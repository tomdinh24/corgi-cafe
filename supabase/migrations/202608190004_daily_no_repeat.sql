-- Corgi Cafe — don't re-recommend someone you already declined today.
--
-- 202608180001 removed the *permanent* no-repeat gate (it locked a pair out forever, which is why
-- Tom & Fred stopped matching). This adds a much narrower guard: it only fires when one side
-- explicitly *declined* the introduction. A decline retires that recommendation (decline_introduction
-- sets recommendations.status = 'ended' — the only path that produces 'ended'), so a pair that was
-- declined within the last 24 hours is suppressed from re-recommendation until a day has passed.
--
-- Deliberately NOT triggered by a plain recommendation: if someone is shown a match and just refreshes
-- the page (never declining), that person can still be recommended again — only an explicit decline
-- counts. The guard is applied to every candidate filter: the LLM pool (list_introduction_candidates)
-- and both branches of request_introduction (the ranker's chosen pick and the deterministic auto-pick).

create or replace function public.declined_within_a_day(member_a uuid, member_b uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.recommendations r
    join public.visit_intro_sessions rs on rs.id = r.requester_session_id
    join public.visit_intro_sessions cs on cs.id = r.counterpart_session_id
    where r.status = 'ended'
      and r.created_at >= now() - interval '24 hours'
      and ( (rs.member_id = member_a and cs.member_id = member_b)
         or (rs.member_id = member_b and cs.member_id = member_a) )
  );
$$;

revoke all on function public.declined_within_a_day(uuid, uuid) from public;
grant execute on function public.declined_within_a_day(uuid, uuid) to authenticated, service_role;

-- Re-create list_introduction_candidates (from 202608180006) with the daily-no-repeat clause added.
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
    'canOffer', my_session.offer_context,
    'background', coalesce(my_profile.enrichment, '{}'::jsonb)
  );

  select coalesce(jsonb_agg(jsonb_build_object(
      'sessionId', c.id,
      'firstName', coalesce(p.first_name, 'Someone'),
      'roleTitle', p.role_title,
      'company', p.company_or_project,
      'aboutMe', p.about_me,
      'currentWork', p.current_work,
      'topics', to_jsonb(c.topics),
      'wantsHelpWith', c.useful_context,
      'canOffer', c.offer_context,
      'background', coalesce(p.enrichment, '{}'::jsonb)
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
    )
    and not public.declined_within_a_day(requester_member_id, c.member_id);

  return jsonb_build_object('requester', requester, 'candidates', candidates);
end;
$$;

revoke all on function public.list_introduction_candidates(uuid, uuid) from public;
revoke all on function public.list_introduction_candidates(uuid, uuid) from authenticated;
grant execute on function public.list_introduction_candidates(uuid, uuid) to service_role;

-- Re-create request_introduction (from 202608180005) with the daily-no-repeat clause added to both
-- the chosen-pick and the deterministic auto-pick candidate filters.
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
      )
      and not public.declined_within_a_day(me, c.member_id);
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
      and not public.declined_within_a_day(me, c.member_id)
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
