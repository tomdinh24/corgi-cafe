-- Integration test for the matching backend (request_introduction + get_introduction_counterpart).
-- Runs entirely inside one transaction and rolls back, so it is safe to re-run against a
-- seeded database. Uses set_config('request.jwt.claims', ...) to simulate an authenticated
-- caller, exactly as PostgREST does when the app calls .rpc(...).
--
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/matching_rpc_test.sql
-- Any assertion failure raises an exception -> psql exits non-zero.

begin;

-- ---- Caller A: shares a topic + reciprocal ask/offer with seeded Rowan -> must match ----
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
  'authenticated', 'authenticated', 'caller-a@corgi.local',
  extensions.crypt('x', extensions.gen_salt('bf')), now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Ada Caller"}'::jsonb,
  false, '', '', '', ''
);
insert into public.profiles (member_id, first_name, last_name)
values ('22222222-2222-2222-2222-222222222222', 'Ada', 'Caller');
insert into public.visit_intro_sessions (
  id, member_id, order_confirmed_today, at_cafe, presence_checked_at,
  conversation_mode, topics, useful_context, offer_context, boundaries, status
) values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222',
  true, true, now(), 'specific', array['Building community'],
  'Want to learn how to host low-pressure meetups', 'Can give product feedback',
  '{"fundraising":false,"recruiting":false,"sales":false}'::jsonb, 'searching'
);

select set_config('request.jwt.claims',
  json_build_object('sub', '22222222-2222-2222-2222-222222222222', 'role', 'authenticated')::text, true);

do $$
declare
  rec uuid;
  participant_count int;
  caller_status public.session_status;
  counterpart_first text;
  counterpart_reason text;
begin
  rec := public.request_introduction('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
  if rec is null then
    raise exception 'FAIL: expected a match for caller A, got null';
  end if;

  select count(*) into participant_count
  from public.introduction_participants where recommendation_id = rec;
  if participant_count <> 2 then
    raise exception 'FAIL: expected 2 participants, got %', participant_count;
  end if;

  select status into caller_status
  from public.visit_intro_sessions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  if caller_status <> 'introduced' then
    raise exception 'FAIL: caller session status should be introduced, got %', caller_status;
  end if;

  select first_name, introduction_reason into counterpart_first, counterpart_reason
  from public.get_introduction_counterpart(rec);
  if counterpart_first is distinct from 'Rowan' then
    raise exception 'FAIL: expected counterpart Rowan, got %', counterpart_first;
  end if;
  if counterpart_reason is null or counterpart_reason = '' then
    raise exception 'FAIL: expected a non-empty introduction reason';
  end if;

  raise notice 'PASS match: rec=% participants=% counterpart=% reason=%',
    rec, participant_count, counterpart_first, counterpart_reason;
end $$;

-- ---- Caller B: arrives after Rowan is taken, no other counterpart -> honest no_match ----
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333',
  'authenticated', 'authenticated', 'caller-b@corgi.local',
  extensions.crypt('x', extensions.gen_salt('bf')), now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Ben Caller"}'::jsonb,
  false, '', '', '', ''
);
insert into public.profiles (member_id, first_name, last_name)
values ('33333333-3333-3333-3333-333333333333', 'Ben', 'Caller');
insert into public.visit_intro_sessions (
  id, member_id, order_confirmed_today, at_cafe, presence_checked_at,
  conversation_mode, topics, boundaries, status
) values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333',
  true, true, now(), 'specific', array['Building community'],
  '{"fundraising":false,"recruiting":false,"sales":false}'::jsonb, 'searching'
);

select set_config('request.jwt.claims',
  json_build_object('sub', '33333333-3333-3333-3333-333333333333', 'role', 'authenticated')::text, true);

do $$
declare rec uuid;
begin
  rec := public.request_introduction('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
  if rec is not null then
    raise exception 'FAIL: expected no_match (null) for caller B, got %', rec;
  end if;
  raise notice 'PASS no_match: null as expected when no eligible counterpart remains';
end $$;

-- ---- Re-match: A and Rowan already met once; a NEW visit must be allowed to reconnect them ----
-- This guards the 202608180001 change (removal of the permanent no-repeat gate). Close every prior
-- session (as the app does at the start of a new visit) so the partial one-active-session index and
-- the "not in an active recommendation" filter are clear, leaving Rowan as A's only candidate. A
-- non-null result therefore means the previously-paired Rowan was reconnected.
update public.visit_intro_sessions
  set status = 'completed'
  where status in ('searching', 'introduced', 'waiting', 'meeting', 'draft');

insert into public.visit_intro_sessions (
  id, member_id, order_confirmed_today, at_cafe, presence_checked_at,
  conversation_mode, topics, useful_context, offer_context, boundaries, status
) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111',
   true, true, now(), 'specific', array['Building community'],
   'Meeting builders thinking about community', 'Can share how to host gatherings',
   '{"fundraising":false,"recruiting":false,"sales":false}'::jsonb, 'searching'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222',
   true, true, now(), 'specific', array['Building community'],
   'Want to learn how to host low-pressure meetups', 'Can give product feedback',
   '{"fundraising":false,"recruiting":false,"sales":false}'::jsonb, 'searching');

select set_config('request.jwt.claims',
  json_build_object('sub', '22222222-2222-2222-2222-222222222222', 'role', 'authenticated')::text, true);

do $$
declare
  rec2 uuid;
  counterpart_first text;
begin
  rec2 := public.request_introduction('dddddddd-dddd-dddd-dddd-dddddddddddd');
  if rec2 is null then
    raise exception 'FAIL: expected a re-match for previously-paired members, got null (no-repeat gate still active?)';
  end if;
  select first_name into counterpart_first
  from public.get_introduction_counterpart(rec2);
  if counterpart_first is distinct from 'Rowan' then
    raise exception 'FAIL: expected re-match counterpart Rowan, got %', counterpart_first;
  end if;
  raise notice 'PASS re-match: previously-paired members were reconnected (rec=% counterpart=%)', rec2, counterpart_first;
end $$;

rollback;
