-- Seed one realistic counterpart so a solo demo produces a genuine match through the real
-- matcher (request_introduction), not a hardcoded string. The live user's session is ranked
-- against this row by shared topics + ask/offer reciprocity.
--
-- Rowan is created as an auth user; the on_auth_user_created trigger auto-inserts the
-- matching public.members + public.onboarding_progress rows.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'rowan@corgi.local',
  extensions.crypt('corgi-demo-password', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Rowan Ellery"}'::jsonb,
  false, '', '', '', ''
) on conflict (id) do nothing;

insert into public.profiles (
  member_id, first_name, last_name, broad_location, role_title,
  company_or_project, about_me, current_work, favorite_drink, confirmed_at
) values (
  '11111111-1111-1111-1111-111111111111',
  'Rowan', 'Ellery', 'San Francisco', 'Community program designer',
  'Hospitality collective',
  'I help small gatherings feel easier to join.',
  'Designing low-pressure meetups for builders',
  'Oat cortado', now()
) on conflict (member_id) do update
  set first_name = excluded.first_name,
      role_title = excluded.role_title,
      current_work = excluded.current_work;

insert into public.profile_sources (
  member_id, source_kind, source_url, source_host, member_confirmed, share_after_meeting
) values
  ('11111111-1111-1111-1111-111111111111', 'website', 'https://rowan-studio.example', 'rowan-studio.example', true, true),
  ('11111111-1111-1111-1111-111111111111', 'social', 'https://instagram.com/rowan.gathers', 'instagram.com', true, true)
on conflict (member_id, source_kind, source_url) do nothing;

insert into public.visit_intro_sessions (
  member_id, cafe_code, order_confirmed_today, at_cafe, presence_checked_at,
  conversation_mode, topics, useful_context, offer_context, boundaries, status, expires_at
) values (
  '11111111-1111-1111-1111-111111111111', 'corgi-cafe', true, true, now(),
  'specific',
  array['Building community', 'Creative projects'],
  'Meeting builders who are thinking about how community forms',
  'Can share how to host gatherings that feel easy to join',
  '{"fundraising":false,"recruiting":false,"sales":false}'::jsonb,
  'searching',
  now() + interval '12 hours'
) on conflict do nothing;
