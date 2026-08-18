-- Corgi Cafe — the home match popup should surface the same links the post-meeting screen already does.
--
-- 202608190006's socials sub-select added `identifier_only = false`, which drops a LinkedIn identifier
-- (stored as kind 'linkedin_identifier', identifier_only=true). But get_post_meeting_links — the RPC
-- behind the step-15 "you met" screen — has no such filter: once both members confirm they met and the
-- source is flagged share_after_meeting, it is returned. So a demo match (Richard, LinkedIn only) shows
-- his profile link on the post-meeting screen but "No shared links." in the home popup. Align the two:
-- the mutual-meeting + share_after_meeting gate is the permission boundary, not identifier_only. LinkedIn
-- remains an unverified identifier (we never fetch/scrape it) — this only shares the URL the member gave,
-- after both consented in person.

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
      'lastName', p.last_name,
      'roleTitle', p.role_title,
      'company', p.company_or_project,
      'currentWork', p.current_work,
      'avatarUrl', p.avatar_url,
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
