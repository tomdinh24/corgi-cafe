-- Corgi Cafe — allow re-matching the same two members.
--
-- Migration 202608170001 added a permanent "no-repeat" gate to request_introduction(): once two
-- members were paired on ANY past visit they could never be introduced again. In practice this
-- silently bricks matching for a fixed set of accounts — after the first pairing every later visit
-- returns an honest-but-useless no_match (this is exactly what blocked the Tom <-> Fred test pair,
-- who had already been introduced).
--
-- Product decision: two people who met before ARE allowed to be reconnected. This migration
-- re-creates request_introduction WITHOUT the historical no-repeat clause. Every other gate is
-- kept verbatim from 202608170001, so matching stays deterministic:
--   * same cafe, both sessions still 'searching', both order-confirmed + at-cafe, unexpired
--   * commercial boundaries must match exactly
--   * the counterpart is not already inside another *active* recommendation
--   * idempotent: a session already paired returns its existing recommendation
-- The only change vs. 202608170001 is the removal of the cross-visit introduction_participants
-- exclusion. (Same-session double-matching is still prevented by the status/active-rec checks.)

create or replace function public.request_introduction(target_session_id uuid)
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
  explanation := left(explanation, 800);

  evidence := jsonb_build_object(
    'shared_topics', to_jsonb(shared_topics),
    'reciprocity', jsonb_build_object('offer_to_me', offer_to_me, 'offer_from_me', offer_from_me),
    'compatibility_kind', kind
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

revoke all on function public.request_introduction(uuid) from public;
grant execute on function public.request_introduction(uuid) to authenticated;
