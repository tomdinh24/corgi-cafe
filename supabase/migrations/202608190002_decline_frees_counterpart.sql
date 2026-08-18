-- Corgi Cafe — declining an introduction frees the counterpart back into the pool.
--
-- Before this, tapping "Not now" only recorded the decliner's private pass. The other person was left
-- staring at a dead match they could still accept, and only escaped when the ~5-minute window silently
-- lapsed. This RPC ends the introduction the moment one side declines: the recommendation is closed,
-- the decliner's session is retired, and the counterpart's session is returned to 'searching' so they
-- immediately re-enter the matching pool and can be paired with someone new. Participant-scoped +
-- security definer, mirroring public.expire_introduction.
create or replace function public.decline_introduction(target_recommendation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  req uuid;
  cp uuid;
  my_session uuid;
  other_session uuid;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if not exists (
    select 1 from public.introduction_participants p
    where p.recommendation_id = target_recommendation_id and p.member_id = me
  ) then
    return false;
  end if;

  -- Close the recommendation (only if still live); capture both linked sessions.
  update public.recommendations
    set status = 'ended'
    where id = target_recommendation_id and status in ('proposed', 'introduced')
    returning requester_session_id, counterpart_session_id into req, cp;

  if req is null and cp is null then
    return false;  -- already advanced (met / expired) — nothing to decline
  end if;

  -- Which of the two linked sessions is mine, which is the counterpart's.
  select id into my_session
    from public.visit_intro_sessions
    where id in (req, cp) and member_id = me;
  select id into other_session
    from public.visit_intro_sessions
    where id in (req, cp) and member_id <> me;

  -- The decliner leaves this introduction.
  update public.visit_intro_sessions
    set status = 'expired', updated_at = now()
    where id = my_session and status in ('introduced', 'meeting');

  -- The counterpart returns to the searching pool — unless their visit window already lapsed, in
  -- which case retire them too so they don't linger unpaired forever. (The unique active-session index
  -- still holds: 'introduced' and 'searching' are both "active", so this is a clean 1:1 swap.)
  update public.visit_intro_sessions
    set status = case when expires_at > now() then 'searching' else 'expired' end,
        updated_at = now()
    where id = other_session and status in ('introduced', 'meeting');

  return true;
end;
$$;

revoke all on function public.decline_introduction(uuid) from public;
grant execute on function public.decline_introduction(uuid) to authenticated;
