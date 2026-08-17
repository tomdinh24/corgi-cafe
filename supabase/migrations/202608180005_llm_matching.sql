-- Corgi Cafe — semantic (LLM-ranked) matching.
--
-- The deterministic matcher only used the free-text intent ("what I want help with" / "what I can
-- offer") and bios as booleans (is-not-null) — throwing away all the actual meaning. This migration
-- adds the two pieces needed to let a model rank the queue instead:
--
--   1. list_introduction_candidates(session, member) — returns the SAME hard-filtered eligible pool
--      the deterministic matcher would consider, but as rich context blobs (name, role, bio, current
--      work, topics, ask, offer) so a server-side ranker can reason over them. It returns other
--      members' pre-match profile text, so it is SERVICE-ROLE ONLY (never granted to authenticated):
--      the /api/match route calls it with the admin client after verifying the caller owns the
--      session, and never forwards the blobs to the browser. auth.uid() is null under service role,
--      so ownership is checked against the passed requester_member_id instead.
--
--   2. request_introduction gains two optional args: a chosen_target_session_id (the ranker's pick)
--      and an override_explanation (the ranker's human-facing reason). When a pick is supplied it is
--      re-validated against every hard filter at commit time (race-safe) instead of running the
--      ORDER BY auto-pick. With no pick supplied the behavior is byte-for-byte the old deterministic
--      matcher — so the LLM path degrades cleanly to it on any ranker error/timeout.

-- 1. Candidate pool with context — service-role only.
create or replace function public.list_introduction_candidates(
  target_session_id uuid,
  requester_member_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  my_session public.visit_intro_sessions%rowtype;
  my_profile public.profiles%rowtype;
  requester jsonb;
  candidates jsonb;
begin
  select * into my_session
  from public.visit_intro_sessions
  where id = target_session_id and member_id = requester_member_id;
  if not found then
    raise exception 'session not found' using errcode = 'P0002';
  end if;

  -- Only an eligible, still-searching session has a pool worth ranking.
  if my_session.status <> 'searching'
     or my_session.expires_at <= now()
     or not my_session.order_confirmed_today
     or not my_session.at_cafe then
    return jsonb_build_object('requester', null, 'candidates', '[]'::jsonb);
  end if;

  select * into my_profile from public.profiles where member_id = requester_member_id;

  requester := jsonb_build_object(
    'firstName', coalesce(my_profile.first_name, 'You'),
    'roleTitle', my_profile.role_title,
    'company', my_profile.company_or_project,
    'aboutMe', my_profile.about_me,
    'currentWork', my_profile.current_work,
    'topics', to_jsonb(my_session.topics),
    'wantsHelpWith', my_session.useful_context,
    'canOffer', my_session.offer_context
  );

  -- Same hard filters as the deterministic candidate select: same cafe, both searching, order + at
  -- cafe, unexpired, exact boundary match, and not already inside another active recommendation.
  select coalesce(jsonb_agg(jsonb_build_object(
      'sessionId', c.id,
      'firstName', coalesce(p.first_name, 'Someone'),
      'roleTitle', p.role_title,
      'company', p.company_or_project,
      'aboutMe', p.about_me,
      'currentWork', p.current_work,
      'topics', to_jsonb(c.topics),
      'wantsHelpWith', c.useful_context,
      'canOffer', c.offer_context
    ) order by c.created_at asc), '[]'::jsonb)
  into candidates
  from public.visit_intro_sessions c
  left join public.profiles p on p.member_id = c.member_id
  where c.member_id <> requester_member_id
    and c.status = 'searching'
    and c.cafe_code = my_session.cafe_code
    and c.expires_at > now()
    and c.order_confirmed_today
    and c.at_cafe
    and c.boundaries = my_session.boundaries
    and not exists (
      select 1 from public.recommendations r
      where (r.requester_session_id = c.id or r.counterpart_session_id = c.id)
        and r.status in ('proposed', 'introduced', 'locating', 'met')
    );

  return jsonb_build_object('requester', requester, 'candidates', candidates);
end;
$$;

revoke all on function public.list_introduction_candidates(uuid, uuid) from public;
revoke all on function public.list_introduction_candidates(uuid, uuid) from authenticated;
grant execute on function public.list_introduction_candidates(uuid, uuid) to service_role;

-- 2. request_introduction with an optional ranker pick + reason. Replaces the 1-arg version.
drop function if exists public.request_introduction(uuid);

create or replace function public.request_introduction(
  target_session_id uuid,
  chosen_target_session_id uuid default null,
  override_explanation text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  my_session public.visit_intro_sessions%rowtype;
  best public.visit_intro_sessions%rowtype;
  existing_rec uuid;
  new_rec_id uuid;
  shared_topics text[];
  my_first text;
  their_first text;
  offer_to_me boolean;
  offer_from_me boolean;
  kind text;
  explanation text;
  evidence jsonb;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into my_session
  from public.visit_intro_sessions
  where id = target_session_id and member_id = me;

  if not found then
    raise exception 'session not found' using errcode = 'P0002';
  end if;

  if my_session.status <> 'searching' then
    select r.id into existing_rec
    from public.recommendations r
    where (r.requester_session_id = my_session.id or r.counterpart_session_id = my_session.id)
      and r.status in ('proposed', 'introduced', 'locating', 'met', 'completed')
    order by r.created_at desc
    limit 1;
    return existing_rec;
  end if;

  if my_session.expires_at <= now()
     or not my_session.order_confirmed_today
     or not my_session.at_cafe then
    return null;
  end if;

  if chosen_target_session_id is not null then
    -- Re-validate the ranker's pick against every hard filter at commit time, so a stale or
    -- concurrently-taken candidate cannot be forced into an introduction.
    select * into best
    from public.visit_intro_sessions c
    where c.id = chosen_target_session_id
      and c.member_id <> me
      and c.status = 'searching'
      and c.cafe_code = my_session.cafe_code
      and c.expires_at > now()
      and c.order_confirmed_today
      and c.at_cafe
      and c.boundaries = my_session.boundaries
      and not exists (
        select 1 from public.recommendations r
        where (r.requester_session_id = c.id or r.counterpart_session_id = c.id)
          and r.status in ('proposed', 'introduced', 'locating', 'met')
      );
  else
    select * into best
    from public.visit_intro_sessions c
    where c.member_id <> me
      and c.status = 'searching'
      and c.cafe_code = my_session.cafe_code
      and c.expires_at > now()
      and c.order_confirmed_today
      and c.at_cafe
      and c.boundaries = my_session.boundaries
      and not exists (
        select 1 from public.recommendations r
        where (r.requester_session_id = c.id or r.counterpart_session_id = c.id)
          and r.status in ('proposed', 'introduced', 'locating', 'met')
      )
    order by
      cardinality(array(select unnest(c.topics) intersect select unnest(my_session.topics))) desc,
      ( (case when my_session.useful_context is not null and c.offer_context is not null then 1 else 0 end)
      + (case when c.useful_context is not null and my_session.offer_context is not null then 1 else 0 end) ) desc,
      c.created_at asc,
      c.id asc
    limit 1;
  end if;

  if best.id is null then
    return null;
  end if;

  shared_topics := array(select unnest(my_session.topics) intersect select unnest(best.topics));
  select first_name into my_first from public.profiles where member_id = me;
  select first_name into their_first from public.profiles where member_id = best.member_id;
  their_first := coalesce(their_first, 'someone here');

  offer_to_me   := my_session.useful_context is not null and best.offer_context is not null;
  offer_from_me := best.useful_context is not null and my_session.offer_context is not null;

  if offer_to_me and offer_from_me then
    kind := 'reciprocal_value';
  elsif offer_to_me or offer_from_me then
    kind := 'ask_offer';
  else
    kind := 'shared_goal';
  end if;

  if cardinality(shared_topics) > 0 then
    explanation := format('You and %s both want to talk about %s.', their_first, array_to_string(shared_topics, ', '));
  else
    explanation := format('You and %s are both here to meet one worthwhile person at Corgi today.', their_first);
  end if;
  if offer_to_me then
    explanation := explanation || format(' They mentioned they can offer: %s.', best.offer_context);
  end if;
  -- The ranker's reason, when supplied, is the human-facing "why you should meet" line; the
  -- deterministic sentence remains the fallback (and still feeds evidence below).
  if override_explanation is not null and length(btrim(override_explanation)) > 0 then
    explanation := override_explanation;
  end if;
  explanation := left(explanation, 800);

  evidence := jsonb_build_object(
    'shared_topics', to_jsonb(shared_topics),
    'reciprocity', jsonb_build_object('offer_to_me', offer_to_me, 'offer_from_me', offer_from_me),
    'compatibility_kind', kind,
    'ranked_by', case when chosen_target_session_id is not null then 'llm' else 'deterministic' end
  );

  insert into public.recommendations
    (requester_session_id, counterpart_session_id, compatibility_kind, explanation, evidence, status, introduced_at)
  values
    (my_session.id, best.id, kind, explanation, evidence, 'introduced', now())
  returning id into new_rec_id;

  insert into public.introduction_participants (recommendation_id, member_id)
  values (new_rec_id, me), (new_rec_id, best.member_id);

  update public.visit_intro_sessions
    set status = 'introduced'
    where id in (my_session.id, best.id);

  return new_rec_id;
end;
$$;

revoke all on function public.request_introduction(uuid, uuid, text) from public;
grant execute on function public.request_introduction(uuid, uuid, text) to authenticated;
