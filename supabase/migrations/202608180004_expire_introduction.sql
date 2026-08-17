-- Corgi Cafe — let a stale introduction be expired and reset.
--
-- An introduction is only useful for a short window: if neither person acts within ~5 minutes it
-- should lapse so both are freed to meet someone else. The client counts down and calls this RPC
-- when the window elapses. It is participant-scoped: it only expires a recommendation the caller
-- belongs to, flips it to 'expired', and resets both linked sessions to 'expired' so a fresh
-- "meet someone" starts clean. (No-op, returns false, if the rec already advanced past 'introduced'.)
create or replace function public.expire_introduction(target_recommendation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  req uuid;
  cp uuid;
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

  update public.recommendations
    set status = 'expired'
    where id = target_recommendation_id and status = 'introduced'
    returning requester_session_id, counterpart_session_id into req, cp;

  if req is null and cp is null then
    return false;
  end if;

  update public.visit_intro_sessions
    set status = 'expired'
    where id in (req, cp) and status in ('introduced', 'meeting');

  return true;
end;
$$;

revoke all on function public.expire_introduction(uuid) from public;
grant execute on function public.expire_introduction(uuid) to authenticated;
