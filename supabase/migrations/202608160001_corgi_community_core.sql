-- Corgi community activation schema.
-- Member-owned writes rely on auth.uid(); system recommendations remain server-only.

create extension if not exists pgcrypto;

create type public.onboarding_status as enum ('started', 'identity', 'sources', 'profile', 'complete');
create type public.session_status as enum ('draft', 'searching', 'waiting', 'introduced', 'meeting', 'completed', 'expired', 'cancelled');
create type public.introduction_status as enum ('proposed', 'introduced', 'locating', 'met', 'completed', 'ended', 'expired');
create type public.private_decision as enum ('pending', 'continue', 'pass');
create type public.meeting_answer as enum ('pending', 'met', 'not_yet', 'did_not_meet');
create type public.feedback_rating as enum ('not_useful', 'okay', 'useful');

create table public.members (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  member_id uuid primary key references public.members(id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  broad_location text check (char_length(broad_location) <= 120),
  role_title text check (char_length(role_title) <= 160),
  company_or_project text check (char_length(company_or_project) <= 180),
  about_me text check (char_length(about_me) <= 800),
  current_work text check (char_length(current_work) <= 280),
  favorite_drink text check (char_length(favorite_drink) <= 160),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_sources (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  source_kind text not null check (source_kind in ('linkedin_identifier', 'website', 'github', 'social', 'exa_candidate', 'manual')),
  source_url text,
  source_host text,
  identifier_only boolean not null default false,
  member_confirmed boolean not null default false,
  share_after_meeting boolean not null default false,
  created_at timestamptz not null default now(),
  unique (member_id, source_kind, source_url)
);

create table public.onboarding_progress (
  member_id uuid primary key references public.members(id) on delete cascade,
  status public.onboarding_status not null default 'started',
  last_step text not null default 'sign_up',
  draft jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.community_interests (
  member_id uuid primary key references public.members(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  status text not null default 'interested' check (status in ('interested', 'withdrawn'))
);

create table public.visit_intro_sessions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  cafe_code text not null default 'corgi-cafe',
  order_confirmed_today boolean not null default false,
  at_cafe boolean not null default false,
  -- Never store exact coordinates or movement history in this table.
  presence_checked_at timestamptz,
  conversation_mode text check (conversation_mode in ('specific', 'open')),
  topics text[] not null default '{}',
  useful_context text check (char_length(useful_context) <= 600),
  offer_context text check (char_length(offer_context) <= 600),
  boundaries jsonb not null default '{"fundraising":false,"recruiting":false,"sales":false}'::jsonb,
  status public.session_status not null default 'draft',
  expires_at timestamptz not null default (now() + interval '60 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index one_active_intro_session_per_member
  on public.visit_intro_sessions(member_id)
  where status in ('draft', 'searching', 'waiting', 'introduced', 'meeting');

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  requester_session_id uuid not null references public.visit_intro_sessions(id) on delete cascade,
  counterpart_session_id uuid not null references public.visit_intro_sessions(id) on delete cascade,
  compatibility_kind text not null check (compatibility_kind in ('ask_offer', 'shared_goal', 'reciprocal_value')),
  explanation text not null check (char_length(explanation) <= 800),
  evidence jsonb not null default '[]'::jsonb,
  status public.introduction_status not null default 'proposed',
  introduced_at timestamptz,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now(),
  check (requester_session_id <> counterpart_session_id)
);

create table public.introduction_participants (
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  private_decision public.private_decision not null default 'pending',
  decided_at timestamptz,
  done_talking_at timestamptz,
  primary key (recommendation_id, member_id)
);

create table public.recognition_media (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  media_kind text not null check (media_kind in ('self_and_outfit', 'nearby_view')),
  storage_path text not null,
  expires_at timestamptz not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (recommendation_id, member_id, media_kind)
);

create table public.meeting_confirmations (
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  answer public.meeting_answer not null default 'pending',
  answered_at timestamptz,
  primary key (recommendation_id, member_id)
);

create table public.private_feedback (
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  rating public.feedback_rating,
  note text check (char_length(note) <= 600),
  submitted_at timestamptz not null default now(),
  primary key (recommendation_id, member_id)
);

create table public.interaction_events (
  id bigint generated always as identity primary key,
  member_id uuid not null references public.members(id) on delete cascade,
  event_name text not null check (char_length(event_name) between 1 and 80),
  step_id text check (char_length(step_id) <= 80),
  context jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index visit_intro_sessions_member_idx on public.visit_intro_sessions(member_id, created_at desc);
create index interaction_events_member_idx on public.interaction_events(member_id, occurred_at desc);
create index recommendation_requester_idx on public.recommendations(requester_session_id);
create index recommendation_counterpart_idx on public.recommendations(counterpart_session_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger members_touch_updated_at before update on public.members
for each row execute function public.touch_updated_at();
create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();
create trigger onboarding_touch_updated_at before update on public.onboarding_progress
for each row execute function public.touch_updated_at();
create trigger sessions_touch_updated_at before update on public.visit_intro_sessions
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.members (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  insert into public.onboarding_progress (member_id)
  values (new.id)
  on conflict (member_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.members enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_sources enable row level security;
alter table public.onboarding_progress enable row level security;
alter table public.community_interests enable row level security;
alter table public.visit_intro_sessions enable row level security;
alter table public.recommendations enable row level security;
alter table public.introduction_participants enable row level security;
alter table public.recognition_media enable row level security;
alter table public.meeting_confirmations enable row level security;
alter table public.private_feedback enable row level security;
alter table public.interaction_events enable row level security;

create policy members_self_select on public.members for select using (id = auth.uid());
create policy members_self_update on public.members for update using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_self_all on public.profiles for all
using (member_id = auth.uid()) with check (member_id = auth.uid());
create policy sources_self_all on public.profile_sources for all
using (member_id = auth.uid()) with check (member_id = auth.uid());
create policy onboarding_self_all on public.onboarding_progress for all
using (member_id = auth.uid()) with check (member_id = auth.uid());
create policy community_interest_self_all on public.community_interests for all
using (member_id = auth.uid()) with check (member_id = auth.uid());
create policy sessions_self_all on public.visit_intro_sessions for all
using (member_id = auth.uid()) with check (member_id = auth.uid());
create policy events_self_insert on public.interaction_events for insert
with check (member_id = auth.uid());
create policy events_self_select on public.interaction_events for select
using (member_id = auth.uid());

create policy recommendation_participant_select on public.recommendations for select using (
  exists (
    select 1 from public.visit_intro_sessions s
    where s.id in (requester_session_id, counterpart_session_id)
      and s.member_id = auth.uid()
  )
);

create policy participant_self_select on public.introduction_participants for select
using (member_id = auth.uid());
create policy participant_self_update on public.introduction_participants for update
using (member_id = auth.uid()) with check (member_id = auth.uid());

create policy recognition_pair_select on public.recognition_media for select using (
  deleted_at is null and expires_at > now() and exists (
    select 1 from public.introduction_participants p
    where p.recommendation_id = recognition_media.recommendation_id
      and p.member_id = auth.uid()
      and p.private_decision = 'continue'
  )
);
create policy recognition_owner_insert on public.recognition_media for insert
with check (
  member_id = auth.uid()
  and exists (
    select 1 from public.introduction_participants p
    where p.recommendation_id = recognition_media.recommendation_id
      and p.member_id = auth.uid()
      and p.private_decision = 'continue'
  )
);
create policy recognition_owner_delete on public.recognition_media for delete
using (member_id = auth.uid());

create policy meeting_self_all on public.meeting_confirmations for all
using (
  member_id = auth.uid()
  and exists (
    select 1 from public.introduction_participants p
    where p.recommendation_id = meeting_confirmations.recommendation_id
      and p.member_id = auth.uid()
  )
)
with check (
  member_id = auth.uid()
  and exists (
    select 1 from public.introduction_participants p
    where p.recommendation_id = meeting_confirmations.recommendation_id
      and p.member_id = auth.uid()
  )
);
create policy feedback_self_all on public.private_feedback for all
using (
  member_id = auth.uid()
  and exists (
    select 1 from public.introduction_participants p
    where p.recommendation_id = private_feedback.recommendation_id
      and p.member_id = auth.uid()
  )
)
with check (
  member_id = auth.uid()
  and exists (
    select 1 from public.introduction_participants p
    where p.recommendation_id = private_feedback.recommendation_id
      and p.member_id = auth.uid()
  )
);

-- Recommendation and participant inserts are intentionally omitted from authenticated
-- policies. A reviewed matching service or narrowly-scoped RPC must create them.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recognition-media', 'recognition-media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy recognition_storage_owner_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'recognition-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.introduction_participants p
    where p.member_id = auth.uid()
      and p.private_decision = 'continue'
      and p.recommendation_id::text = (storage.foldername(name))[2]
  )
);
create policy recognition_storage_pair_select on storage.objects for select to authenticated
using (
  bucket_id = 'recognition-media'
  and exists (
    select 1
    from public.recognition_media rm
    join public.introduction_participants p on p.recommendation_id = rm.recommendation_id
    where rm.storage_path = storage.objects.name
      and rm.deleted_at is null
      and rm.expires_at > now()
      and p.member_id = auth.uid()
      and p.private_decision = 'continue'
  )
);
create policy recognition_storage_owner_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'recognition-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.get_introduction_counterpart(target_recommendation_id uuid)
returns table (
  first_name text,
  role_title text,
  current_work text,
  introduction_reason text
)
language sql
security definer
set search_path = ''
stable
as $$
  select p.first_name, p.role_title, p.current_work, r.explanation
  from public.recommendations r
  join public.visit_intro_sessions candidate_session
    on candidate_session.id in (r.requester_session_id, r.counterpart_session_id)
  join public.profiles p on p.member_id = candidate_session.member_id
  where r.id = target_recommendation_id
    and candidate_session.member_id <> auth.uid()
    and r.status in ('introduced', 'locating', 'met', 'completed')
    and exists (
      select 1 from public.introduction_participants viewer
      where viewer.recommendation_id = r.id
        and viewer.member_id = auth.uid()
    );
$$;

revoke all on function public.get_introduction_counterpart(uuid) from public;
grant execute on function public.get_introduction_counterpart(uuid) to authenticated;

create or replace function public.get_post_meeting_links(target_recommendation_id uuid)
returns table (source_kind text, source_url text, source_host text)
language sql
security definer
set search_path = ''
stable
as $$
  select ps.source_kind, ps.source_url, ps.source_host
  from public.recommendations r
  join public.visit_intro_sessions candidate_session
    on candidate_session.id in (r.requester_session_id, r.counterpart_session_id)
  join public.profile_sources ps on ps.member_id = candidate_session.member_id
  where r.id = target_recommendation_id
    and candidate_session.member_id <> auth.uid()
    and ps.share_after_meeting = true
    and (select count(*) from public.introduction_participants p where p.recommendation_id = r.id) = 2
    and not exists (
      select 1
      from public.introduction_participants p
      left join public.meeting_confirmations mc
        on mc.recommendation_id = p.recommendation_id
       and mc.member_id = p.member_id
      where p.recommendation_id = r.id
        and mc.answer is distinct from 'met'
    )
    and exists (
      select 1 from public.introduction_participants viewer
      where viewer.recommendation_id = r.id and viewer.member_id = auth.uid()
    );
$$;

revoke all on function public.get_post_meeting_links(uuid) from public;
grant execute on function public.get_post_meeting_links(uuid) to authenticated;
