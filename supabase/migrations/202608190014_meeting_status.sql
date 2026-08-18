-- Mutual meeting status for a live introduction.
--
-- The waiting screen (step 15) must reflect the ACTUAL mutual state: a member who taps "we met" first
-- should see an honest "waiting for the other person" state, not a premature "both confirmed". This
-- matters for safety: if one side confirms and the other never does, it may mean they found the wrong
-- person, so the UI must not claim the meeting is mutual until it is.
--
-- RLS (meeting_self_all) confines each member to reading only their own meeting_confirmations row, so a
-- participant cannot see the counterpart's answer directly. This security-definer RPC exposes just the
-- three booleans a participant needs — did I confirm, did the counterpart confirm, did both — and
-- returns all-false for anyone who is not a participant (the exists-viewer guard filters every row out,
-- so the aggregate collapses to false rather than leaking state).
create or replace function public.get_meeting_status(target_recommendation_id uuid)
returns table (self_met boolean, counterpart_met boolean, both_met boolean)
language sql
security definer
set search_path = ''
stable
as $$
  with viewer as (
    select 1
    from public.introduction_participants v
    where v.recommendation_id = target_recommendation_id
      and v.member_id = auth.uid()
  ),
  parts as (
    select p.member_id, (mc.answer = 'met') as met
    from public.introduction_participants p
    left join public.meeting_confirmations mc
      on mc.recommendation_id = p.recommendation_id
     and mc.member_id = p.member_id
    where p.recommendation_id = target_recommendation_id
  )
  select
    coalesce(bool_or(member_id = auth.uid() and met), false) as self_met,
    coalesce(bool_or(member_id <> auth.uid() and met), false) as counterpart_met,
    (count(*) = 2 and count(*) filter (where met) = 2) as both_met
  from parts
  where exists (select 1 from viewer);
$$;

grant execute on function public.get_meeting_status(uuid) to authenticated;
