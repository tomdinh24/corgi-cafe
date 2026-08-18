-- Corgi Cafe — finishing your visit must never strand a match you were in the middle of meeting.
--
-- "Finish for today" retired the caller's own session but left any live recommendation open and the
-- counterpart's session on 'introduced', so the other person kept polling a dead match until the ~5
-- minute window lapsed. That is the exact stranding decline_introduction was built to prevent. This RPC
-- ends every live-but-not-yet-met introduction the caller is in, freeing each counterpart back to the
-- searching pool (mirroring decline_introduction), and then retires the caller's own active sessions.
--
-- A recommendation where BOTH sides already confirmed they met is left fully intact (rec and counterpart
-- untouched): it is a real, completed match and must stay on both dashboards with post-meeting access.
-- Participant-scoped + security definer.
create or replace function public.finish_my_visit()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  rec record;
  other_session uuid;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  for rec in
    select r.id, r.requester_session_id, r.counterpart_session_id,
      ( select count(*) = 2 and count(*) filter (where mc.answer = 'met') = 2
        from public.introduction_participants ip
        left join public.meeting_confirmations mc
          on mc.recommendation_id = ip.recommendation_id and mc.member_id = ip.member_id
        where ip.recommendation_id = r.id ) as both_met
    from public.recommendations r
    join public.introduction_participants p
      on p.recommendation_id = r.id and p.member_id = me
    where r.status in ('proposed', 'introduced')
  loop
    -- A completed (both-met) match is a keeper: leave the recommendation and the counterpart alone.
    if rec.both_met then
      continue;
    end if;

    -- Close this recommendation (only if still live), then free the counterpart, exactly as a decline
    -- would: return them to 'searching' if their window is still open, otherwise retire them too.
    update public.recommendations
      set status = 'ended'
      where id = rec.id and status in ('proposed', 'introduced');

    select id into other_session
      from public.visit_intro_sessions
      where id in (rec.requester_session_id, rec.counterpart_session_id) and member_id <> me;

    update public.visit_intro_sessions
      set status = (case when expires_at > now() then 'searching' else 'expired' end)::public.session_status,
          updated_at = now()
      where id = other_session and status in ('introduced', 'meeting');
  end loop;

  -- Retire all of the caller's own still-active sessions so the home dashboard stops showing an intro
  -- in progress.
  update public.visit_intro_sessions
    set status = 'completed', updated_at = now()
    where member_id = me
      and status in ('draft', 'searching', 'waiting', 'introduced', 'meeting');

  return true;
end;
$$;

revoke all on function public.finish_my_visit() from public;
grant execute on function public.finish_my_visit() to authenticated;
