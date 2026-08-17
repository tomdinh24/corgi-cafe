# Corgi Cafe — Make Matching Real (ship tonight)

## Context

Corgi's community-activation product has an **approved, finalized design** and a **working onboarding app**, but the "matching" half is faked and the app runs in Supabase **preview mode** (nothing persists). Goal for tonight: connect the existing app to a real Supabase database and replace the hardcoded introduction with a **real deterministic matcher**, so a user can onboard → start an intro session → be matched to a real counterpart → confirm the meeting → leave feedback, all against a live DB.

Decisions (locked):
- **Model A — make the built prototype real** on the existing schema (`recommendations` + `introduction_participants`, simultaneous "already introduced" UX per `MATCHING-JOURNEY-R02`). NOT the newer blind-proposal `.lavish` plan (too big for tonight).
- **Local Supabase (Docker)** for build + verification tonight; env-swappable to cloud for deploy later.
- Matching writer is a **`security definer` RPC**, exactly what the schema comment anticipates ("a reviewed matching service or narrowly-scoped RPC must create them"). No service-role key on the client; RLS stays intact.

App root: `prototypes/community-onboarding-clickthroughs/apps/onboarding-exa/`
Schema: `supabase/migrations/202608160001_corgi_community_core.sql` (written, never applied)

## What already exists (reuse, don't rebuild)

- **DB schema is matching-ready**: `visit_intro_sessions`, `recommendations` (with `compatibility_kind` + `explanation` + `evidence` + expiry), `introduction_participants`, `meeting_confirmations`, `private_feedback`, `recognition_media`, plus RPCs `get_introduction_counterpart(uuid)` and `get_post_meeting_links(uuid)`. Reuse all of it.
- **Persist route** (`app/api/persist/route.ts`) already writes `profile`, `community_interest`, `session` (inserts a real `visit_intro_sessions` with status `searching`), `event`. Extend it, don't replace.
- **Frontend state machine** (`components/ExaOnboarding.tsx`, steps 8–18) already renders the whole intro UX — only the *data* is hardcoded ("Rowan" literal at step 11, canned links at step 15). Swap data source, keep UI.
- **Supabase client factory** (`lib/supabase.ts`): `getSupabaseConfig()` + `createCorgiServerClient()` already flip to `configured` when env is present.

## Build steps

### 1. Connect the app to a live database
- `supabase start` (local stack) → apply the existing migration (`supabase db reset` runs `migrations/`). Confirm all tables + RPCs exist.
- Add local `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (anon key from `supabase status`) to `.env.local`. This alone flips persist/auth out of preview mode — onboarding now writes real `profiles`/`profile_sources`/`onboarding_progress`/`visit_intro_sessions` rows.
- Local auth: OTP emails land in Inbucket (`localhost:54324`); the verify step reads the code from there. (Preview `424242` bypass stops firing once Supabase is `configured`.)

### 2. Backend — the matcher (new migration RPC)
New migration `supabase/migrations/2026081602_matching_service.sql` adding a `security definer` function, e.g. `request_introduction(target_session_id uuid) returns uuid`:
- Verify caller owns `target_session_id` and it is `searching`, not expired, order+presence flags true.
- Scan **other** `visit_intro_sessions` where `status='searching'`, same `cafe_code`, `member_id <> auth.uid()`, not expired, not already paired.
- **Deterministic eligibility + ranking** (pure, no weighted ML): boundary compatibility is a hard gate (a member's commercial `boundaries` must not be violated); then rank by topic overlap → useful/offer (ask↔offer) reciprocity → oldest wait → stable tiebreak on session id. Pick best; if none, return `null`.
- Derive `compatibility_kind` (`ask_offer` | `shared_goal` | `reciprocal_value`) + a plain-language `explanation` + `evidence` jsonb from the overlap.
- Atomically `insert into recommendations` (status `introduced`, `introduced_at=now()`) + two `introduction_participants`, and move both sessions to `introduced`. Return the recommendation id.
- Keep the scoring logic also as a pure TS function (`lib/matching.ts`) mirrored for unit testing, or unit-test the SQL via the integration test below — pick the lighter path; the SQL RPC is the source of truth.
- Thin route `app/api/match/route.ts` (POST) → authed server client calls `supabase.rpc('request_introduction', { target_session_id })` → returns `{ recommendationId }` or `{ status: 'no_match' }`.

### 3. Frontend — swap hardcoded data for real data (`ExaOnboarding.tsx`)
- **Step 10 (loading):** replace the `setTimeout` with a real `POST /api/match`. On `recommendationId` → fetch the counterpart via `get_introduction_counterpart` RPC (new `app/api/introduction/[id]/route.ts` calling `supabase.rpc(...)`); store `{firstName, roleTitle, currentWork, introductionReason}` in state. On `no_match` → go to step 18 (the real "still looking" state).
- **Step 11/12/13/14:** render the real counterpart name/role/reason from state instead of the "Rowan" literal.
- **Step 12 (continue/pass):** write `introduction_participants.private_decision` — extend persist with `kind:'decision'`.
- **Step 14 (met / not yet):** write `meeting_confirmations` — extend persist with `kind:'meeting'`.
- **Step 15 (post-meeting links):** fetch via `get_post_meeting_links` RPC instead of the hardcoded `rowan-studio.example` chips.
- **Step 16 (feedback):** write `private_feedback` — extend persist with `kind:'feedback'` (keep the existing `event` logging too).
- Extend `PersistPayloadSchema` in `lib/persistence.ts` + the switch in `persist/route.ts` for the three new `kind`s. Keep every write owner-scoped (existing RLS covers these tables for the acting member; participant/decision/meeting/feedback inserts are already allowed to self).

### 4. Seed a real counterpart (so a solo demo produces a genuine match)
- `supabase/seed.sql` (or a small script) inserting **one realistic second member** + `profile` + a `searching` `visit_intro_sessions` with overlapping topics/offer. The live user then matches against it through **real logic**, not a string. (A two-browser demo also works, but the seed makes the solo happy-path deterministic.)

## Critical files

- `supabase/migrations/2026081602_matching_service.sql` — **new**, the matcher RPC.
- `supabase/seed.sql` — **new**, one counterpart session.
- `apps/onboarding-exa/app/api/match/route.ts` — **new**.
- `apps/onboarding-exa/app/api/introduction/[id]/route.ts` — **new** (counterpart + post-meeting links).
- `apps/onboarding-exa/components/ExaOnboarding.tsx` — steps 10–16 wired to real data.
- `apps/onboarding-exa/app/api/persist/route.ts` + `lib/persistence.ts` — add `decision` / `meeting` / `feedback` kinds.
- `apps/onboarding-exa/.env.local` — local Supabase URL + anon key.

## Verification (must exercise the real user path — Tom's rule #1)

1. **DB up:** `supabase start` → `supabase db reset` applies core + matching migrations + seed cleanly; `\df` shows `request_introduction`, `get_introduction_counterpart`, `get_post_meeting_links`.
2. **Integration test:** with the seeded counterpart present, call `request_introduction` for a fresh session → assert one `recommendations` row + two `introduction_participants` + both sessions `introduced` + `get_introduction_counterpart` returns the seeded person's real name/role/reason. Assert `no_match` when boundaries conflict / no overlap.
3. **Unit:** existing `vitest` suite still green (`npm run test`); `npm run lint` (tsc) clean; add a case for the scoring/eligibility rules.
4. **E2E (the real path):** `npm run dev` (port 4313) against local Supabase → drive onboarding → start intro session → **step 10 hits the live matcher** → step 11 shows the **seeded counterpart's real name** (not "Rowan") → continue → meeting confirm → real post-meeting links → feedback persists. Watch it in the browser; confirm rows land in Postgres (`select * from recommendations`). Extend `tests/e2e/onboarding.spec.ts` so the "matching happy path" asserts real DB-backed data, not a literal.
5. Only call it done after the browser run + DB rows are seen. If any gate is skipped, label the result **UNVERIFIED**.

## Out of scope tonight (call out, don't build)
- Blind-proposal / mutual-reveal model, presence/purchase proofs, QR leases, Node worker, SSE, email notifications, recognition-photo upload/deletion worker, safety/daily limits — all deferred (they belong to the bigger `.lavish` production plan and its legal/security gates).
- Cloud Supabase link + Vercel env — a later 3-var swap; local proves it works tonight.
