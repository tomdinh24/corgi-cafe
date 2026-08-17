-- Corgi Cafe — feedback flywheel (Tier C): turn real outcomes into a ranking signal.
--
-- Every introduction already records the outcome we need: each participant's private_decision
-- (continue / pass) and their private_feedback rating. This RPC distills a member's own history into
-- the kinds of counterpart they've valued vs. declined, so the ranker can nudge toward what actually
-- worked for them. It reads the counterpart's headline (cross-member), so it is SERVICE-ROLE ONLY;
-- /api/match calls it with the admin client after verifying the caller, and never returns it to the
-- browser. Empty until real feedback accrues — at which point it starts shaping matches automatically.
create or replace function public.get_member_preferences(target_member_id uuid)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  with mine as (
    select ip.recommendation_id, ip.private_decision
    from public.introduction_participants ip
    where ip.member_id = target_member_id
  ),
  scored as (
    select
      m.private_decision,
      f.rating,
      coalesce(cp_profile.enrichment->>'headline', cp_profile.role_title) as counterpart_headline
    from mine m
    left join public.private_feedback f
      on f.recommendation_id = m.recommendation_id and f.member_id = target_member_id
    left join public.introduction_participants cp
      on cp.recommendation_id = m.recommendation_id and cp.member_id <> target_member_id
    left join public.profiles cp_profile
      on cp_profile.member_id = cp.member_id
  )
  select jsonb_build_object(
    'liked', coalesce((
      select array_agg(distinct counterpart_headline)
      from scored
      where counterpart_headline is not null
        and (private_decision = 'continue' or rating in ('helpful', 'very_helpful'))
    ), array[]::text[]),
    'passed', coalesce((
      select array_agg(distinct counterpart_headline)
      from scored
      where counterpart_headline is not null
        and (private_decision = 'pass' or rating in ('unhelpful', 'very_unhelpful'))
    ), array[]::text[])
  );
$$;

revoke all on function public.get_member_preferences(uuid) from public;
revoke all on function public.get_member_preferences(uuid) from authenticated;
grant execute on function public.get_member_preferences(uuid) to service_role;
