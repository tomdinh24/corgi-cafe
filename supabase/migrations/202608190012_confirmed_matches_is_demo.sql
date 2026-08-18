-- Corgi Cafe — tag each confirmed match as Live or Demo so the home dashboard can keep them separate.
--
-- The home "My matches" grid should show only the matches for the mode the member is currently in:
-- switching Live/Demo must not mix a demo counterpart into the Live list or vice versa. Demo sessions
-- live in the isolated 'corgi-demo' cafe, so a match is a demo match when the counterpart's session
-- cafe_code is 'corgi-demo'. Expose that as `isDemo`; the client filters on it. Otherwise identical to
-- 202608190009.
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
      'isDemo', (cp.cafe_code = 'corgi-demo'),
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
