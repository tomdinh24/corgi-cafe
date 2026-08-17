-- Corgi Cafe — fix decline_introduction: cast the counterpart status expression to the enum.
--
-- 202608190002 set the counterpart session with `case when ... then 'searching' else 'expired' end`,
-- whose result type is text. Assigning text to the session_status enum column raised
-- "column \"status\" is of type public.session_status but expression is of type text", so the RPC
-- errored and no one was re-pooled. Cast the CASE result to public.session_status. (A plain string
-- literal assignment casts implicitly; a CASE expression does not.) Function body is otherwise
-- identical to 202608190002.
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

  update public.recommendations
    set status = 'ended'
    where id = target_recommendation_id and status in ('proposed', 'introduced')
    returning requester_session_id, counterpart_session_id into req, cp;

  if req is null and cp is null then
    return false;  -- already advanced (met / expired) — nothing to decline
  end if;

  select id into my_session
    from public.visit_intro_sessions
    where id in (req, cp) and member_id = me;
  select id into other_session
    from public.visit_intro_sessions
    where id in (req, cp) and member_id <> me;

  update public.visit_intro_sessions
    set status = 'expired', updated_at = now()
    where id = my_session and status in ('introduced', 'meeting');

  update public.visit_intro_sessions
    set status = (case when expires_at > now() then 'searching' else 'expired' end)::public.session_status,
        updated_at = now()
    where id = other_session and status in ('introduced', 'meeting');

  return true;
end;
$$;

revoke all on function public.decline_introduction(uuid) from public;
grant execute on function public.decline_introduction(uuid) to authenticated;
