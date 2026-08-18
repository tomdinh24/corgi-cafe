-- Corgi Cafe — a counterpart's last name and company are identity, not intro context: gate them on BOTH met.
--
-- list_my_confirmed_matches returned last_name and company_or_project as soon as both sides accepted the
-- intro (both private_decision = 'continue'), before they actually met. The live-intro card
-- (get_introduction_counterpart) only ever exposes first name, role, current work, and the reason, so the
-- home dashboard was the one surface disclosing a counterpart's last name + employer pre-meeting. Two
-- people who accepted but never met could each harvest the other's full identity. Mutual permission is a
-- hard constraint, and "you'd already know where they work" only holds once they have talked. Gate
-- lastName + company on bm.both_met, exactly like avatarUrl and socials (202608190007/190008). First name,
-- role, and current work stay ungated so an in-progress match card is still recognizable and matches the
-- anti-bias intro card. Otherwise identical to 202608190008.
create or replace function public.list_my_confirmed_matches()
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'recommendationId', r.id,
      'status', r.status,
      'matchedAt', coalesce(r.introduced_at, r.created_at),
      'firstName', p.first_name,
      'lastName', case when bm.both_met then p.last_name else null end,
      'roleTitle', p.role_title,
      'company', case when bm.both_met then p.company_or_project else null end,
      'currentWork', p.current_work,
      'avatarUrl', case when bm.both_met then p.avatar_url else null end,
      'bothMet', bm.both_met,
      'socials', case when bm.both_met then coalesce((
          select jsonb_agg(jsonb_build_object(
            'kind', ps.source_kind, 'url', ps.source_url, 'host', ps.source_host
          ) order by ps.created_at asc)
          from public.profile_sources ps
          where ps.member_id = cp.member_id
            and ps.share_after_meeting = true
            and ps.source_url is not null
        ), '[]'::jsonb) else '[]'::jsonb end
    ) order by coalesce(r.introduced_at, r.created_at) desc
  ), '[]'::jsonb)
  from public.recommendations r
  join public.introduction_participants me
    on me.recommendation_id = r.id and me.member_id = auth.uid()
  join public.visit_intro_sessions cp
    on cp.id in (r.requester_session_id, r.counterpart_session_id)
   and cp.member_id <> auth.uid()
  join public.profiles p on p.member_id = cp.member_id
  cross join lateral (
    select (count(*) = 2 and count(*) filter (where mc.answer = 'met') = 2) as both_met
    from public.introduction_participants ip
    left join public.meeting_confirmations mc
      on mc.recommendation_id = ip.recommendation_id and mc.member_id = ip.member_id
    where ip.recommendation_id = r.id
  ) bm
  where r.status <> 'ended'
    and (
      bm.both_met
      or (
        select count(*) from public.introduction_participants dp
        where dp.recommendation_id = r.id and dp.private_decision = 'continue'
      ) = 2
    );
$$;

revoke all on function public.list_my_confirmed_matches() from public;
grant execute on function public.list_my_confirmed_matches() to authenticated;

-- Hardening: declined_within_a_day (202608190004) is only ever called inside request_introduction
-- (security definer, runs as owner) and list_introduction_candidates (service_role). The authenticated
-- grant is unnecessary surface: it let any signed-in member call the RPC with two arbitrary member ids
-- and learn whether that pair declined an introduction in the last 24 hours. Revoke it; internal callers
-- are unaffected.
revoke execute on function public.declined_within_a_day(uuid, uuid) from authenticated;
