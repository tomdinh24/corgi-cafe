-- Corgi Cafe — profile enrichment (Tier A: keep the people-search trajectory we already fetch).
--
-- The Exa people-search returns each person's full work history, but onboarding kept only the
-- current title/company and discarded the rest. This adds a place to store that trajectory (plus
-- derived signals like is-founder / past companies) and feeds it into the matcher, so a match can
-- reason about who someone actually is — not just the one line they typed. No new external calls:
-- the client derives this from the candidate the member already confirmed as themselves.

alter table public.profiles
  add column if not exists enrichment jsonb not null default '{}'::jsonb;

-- Re-create the candidate-pool RPC (from 202608180005) with enrichment added to both the requester
-- blob and each candidate blob. Everything else is unchanged.
create or replace function public.list_introduction_candidates(
  target_session_id uuid,
  requester_member_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  my_session public.visit_intro_sessions%rowtype;
  my_profile public.profiles%rowtype;
  requester jsonb;
  candidates jsonb;
begin
  select * into my_session
  from public.visit_intro_sessions
  where id = target_session_id and member_id = requester_member_id;
  if not found then
    raise exception 'session not found' using errcode = 'P0002';
  end if;

  if my_session.status <> 'searching'
     or my_session.expires_at <= now()
     or not my_session.order_confirmed_today
     or not my_session.at_cafe then
    return jsonb_build_object('requester', null, 'candidates', '[]'::jsonb);
  end if;

  select * into my_profile from public.profiles where member_id = requester_member_id;

  requester := jsonb_build_object(
    'firstName', coalesce(my_profile.first_name, 'You'),
    'roleTitle', my_profile.role_title,
    'company', my_profile.company_or_project,
    'aboutMe', my_profile.about_me,
    'currentWork', my_profile.current_work,
    'topics', to_jsonb(my_session.topics),
    'wantsHelpWith', my_session.useful_context,
    'canOffer', my_session.offer_context,
    'background', coalesce(my_profile.enrichment, '{}'::jsonb)
  );

  select coalesce(jsonb_agg(jsonb_build_object(
      'sessionId', c.id,
      'firstName', coalesce(p.first_name, 'Someone'),
      'roleTitle', p.role_title,
      'company', p.company_or_project,
      'aboutMe', p.about_me,
      'currentWork', p.current_work,
      'topics', to_jsonb(c.topics),
      'wantsHelpWith', c.useful_context,
      'canOffer', c.offer_context,
      'background', coalesce(p.enrichment, '{}'::jsonb)
    ) order by c.created_at asc), '[]'::jsonb)
  into candidates
  from public.visit_intro_sessions c
  left join public.profiles p on p.member_id = c.member_id
  where c.member_id <> requester_member_id
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
    );

  return jsonb_build_object('requester', requester, 'candidates', candidates);
end;
$$;

revoke all on function public.list_introduction_candidates(uuid, uuid) from public;
revoke all on function public.list_introduction_candidates(uuid, uuid) from authenticated;
grant execute on function public.list_introduction_candidates(uuid, uuid) to service_role;
