-- Corgi Cafe — give each side of an introduction its own reason.
--
-- A recommendation stored a single `explanation`, written from the requester's viewpoint about the
-- counterpart ("Tom is a product manager ... matching your interest in ..."). Both participants read
-- that same text, so the counterpart saw a description of themselves instead of the person they were
-- being introduced to. Fix: store a second, reverse-direction reason and serve each viewer the reason
-- about the OTHER person.
--
--  * recommendations.counterpart_explanation — reason addressed to the counterpart, about the requester.
--  * request_introduction gains counterpart_override_explanation (the LLM's reverse-direction reason)
--    and builds a mirrored deterministic fallback (swap the name and the offer clause).
--  * get_introduction_counterpart returns explanation to the requester and counterpart_explanation to
--    the counterpart (coalescing to explanation for rows written before this migration).

alter table public.recommendations
  add column if not exists counterpart_explanation text;

-- request_introduction: same logic as 202608190004, plus a second directional reason.
drop function if exists public.request_introduction(uuid, uuid, text);
create or replace function public.request_introduction(
  target_session_id uuid,
  chosen_target_session_id uuid default null,
  override_explanation text default null,
  counterpart_override_explanation text default null
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
  counterpart_explanation text;
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
  my_first := coalesce(my_first, 'someone here');
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

  -- Requester-facing reason (about the counterpart).
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

  -- Counterpart-facing reason (about the requester): mirror the name and the offer clause.
  if cardinality(shared_topics) > 0 then
    counterpart_explanation := format('You and %s both want to talk about %s.', my_first, array_to_string(shared_topics, ', '));
  else
    counterpart_explanation := format('You and %s are both here to meet one worthwhile person at Corgi today.', my_first);
  end if;
  if offer_from_me then
    counterpart_explanation := counterpart_explanation || format(' They mentioned they can offer: %s.', my_session.offer_context);
  end if;
  if counterpart_override_explanation is not null and length(btrim(counterpart_override_explanation)) > 0 then
    counterpart_explanation := counterpart_override_explanation;
  end if;
  counterpart_explanation := left(counterpart_explanation, 800);

  evidence := jsonb_build_object(
    'shared_topics', to_jsonb(shared_topics),
    'reciprocity', jsonb_build_object('offer_to_me', offer_to_me, 'offer_from_me', offer_from_me),
    'compatibility_kind', kind,
    'ranked_by', case when chosen_target_session_id is not null then 'llm' else 'deterministic' end
  );

  insert into public.recommendations
    (requester_session_id, counterpart_session_id, compatibility_kind, explanation, counterpart_explanation, evidence, status, introduced_at)
  values
    (my_session.id, best.id, kind, explanation, counterpart_explanation, evidence, 'introduced', now())
  returning id into new_rec_id;

  insert into public.introduction_participants (recommendation_id, member_id)
  values (new_rec_id, me), (new_rec_id, best.member_id);

  update public.visit_intro_sessions
    set status = 'introduced'
    where id in (my_session.id, best.id);

  return new_rec_id;
end;
$$;
revoke all on function public.request_introduction(uuid, uuid, text, text) from public;
grant execute on function public.request_introduction(uuid, uuid, text, text) to authenticated;

-- get_introduction_counterpart: serve each viewer the reason about the OTHER person.
create or replace function public.get_introduction_counterpart(target_recommendation_id uuid)
returns table (
  first_name text,
  role_title text,
  current_work text,
  introduction_reason text,
  evidence jsonb
)
language sql
security definer
set search_path = ''
stable
as $$
  select p.first_name, p.role_title, p.current_work,
    case when req_sess.member_id = auth.uid()
         then r.explanation
         else coalesce(r.counterpart_explanation, r.explanation) end,
    r.evidence
  from public.recommendations r
  join public.visit_intro_sessions req_sess
    on req_sess.id = r.requester_session_id
  join public.visit_intro_sessions candidate_session
    on candidate_session.id in (r.requester_session_id, r.counterpart_session_id)
  join public.profiles p on p.member_id = candidate_session.member_id
  where r.id = target_recommendation_id
    and candidate_session.member_id <> auth.uid()
    and r.status in ('introduced', 'locating', 'met', 'completed')
    and exists (
      select 1 from public.introduction_participants viewer
      where viewer.recommendation_id = r.id
        and viewer.member_id = auth.uid()
    );
$$;
revoke all on function public.get_introduction_counterpart(uuid) from public;
grant execute on function public.get_introduction_counterpart(uuid) to authenticated;
