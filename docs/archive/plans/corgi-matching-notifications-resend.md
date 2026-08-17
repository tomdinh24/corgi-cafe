# Corgi matching + notifications + Resend

## Context

The community-activation flow matches two people at Corgi Cafe when both are "searching" with
compatible intent (topics / ask / offer / commercial boundaries) and both are at-cafe +
order-confirmed. If one is waiting alone, they should be paired later when a compatible person
arrives. Three problems, verified against the **live** Supabase project (`crcpjxvsyirwkhsyckke`):

1. **Matching silently fails for the same two people.** Root cause **confirmed from live data**:
   Tom Lam (`3a639a2e…`) and Fred Goh (`f50abd3e…`) were already paired twice
   (`introduction_participants` recs `bfe05e53…`, `a7686c69…`). The no-repeat-match rule in
   `supabase/migrations/202608170001_no_repeat_matches_and_feedback_scale.sql` (the
   `not exists … introduction_participants …` clause in `request_introduction`) then excludes any
   pair **forever** after their first match. Every other hard filter passes on their current live
   sessions — this rule is the sole blocker. **Tom wants the same person to be matchable again**,
   so this rule must go (or be relaxed).

2. **"Notify me when someone's available" does nothing.** Step 18 of `ExaOnboarding.tsx` literally
   says *"Notification delivery is not implemented in this build."* The waiting party is only
   carried into an introduction by an in-browser poll that runs **while the tab is open on step 18**;
   clicking "Notify me" leaves that screen and nothing ever reaches them. There is **no**
   server-side notification (confirmed: no `supabase/functions`, no webhooks/pg_net, no email code).

3. **Email needs to move to Resend** — driven by needing to send "you've been matched" updates, and
   for more reliable OTP/magic-link delivery than Supabase's built-in email.

Current auth (verified): magic-link/OTP via Supabase Auth `signInWithOtp` / `verifyOtp`
(`app/api/auth/start|verify/route.ts`), plus a `CORGI_DEV_LOGIN` bypass. Email is sent by
Supabase's built-in SMTP today.

App base dir:
`prototypes/community-onboarding-clickthroughs/apps/onboarding-exa`

---

## Phase 1 — Fix matching (do first; unblocks Tom ↔ Fred immediately)

**Goal:** the same two accounts match reliably, every time.

- New migration `supabase/migrations/2026081800xx_allow_rematch.sql` that `create or replace`s
  `public.request_introduction` **identical to the 202608170001 version minus the no-repeat
  `not exists (… introduction_participants …)` clause.** Keep every other gate (same cafe, both
  searching, order+at-cafe, boundaries equality, not-in-active-rec, expiry) and the idempotency
  guard — those are correct and are what make it deterministic.
  - Removing the clause means the existing Tom↔Fred history no longer blocks them; no data cleanup
    strictly required. (Optional: also cancel their stale `searching` sessions so a clean pair
    starts — one-off REST/psql call with the service-role key in `.env.local`.)
- Update `supabase/tests/matching_rpc_test.sql`: add an assertion that two members **who were
  previously paired can be matched again** (guards the behavior Tom asked for).
- Apply the migration to the cloud project (`supabase db push` / SQL editor).

**Verify (real user path):** re-run the SQL test (must pass), then live: sign in as Tom in one
browser and Fred in another, each starts an intro session, confirm both land on the introduction
screen showing each other — then repeat a second time to prove it no longer bricks. Re-query
`visit_intro_sessions` → both flip `searching → introduced` and a fresh `recommendations` row
appears.

---

## Phase 2 — "You've been matched" notifications via Resend

**Goal:** when a waiting person is paired (even with their tab closed), they get an email; the
in-app waiting screen also reliably carries open-tab users forward.

- **Server-side trigger (works tab-closed):** add a Supabase **Database Webhook** on `INSERT` into
  `public.recommendations` → HTTP POST to a new route
  `app/api/hooks/matched/route.ts` (secured by a shared-secret header). The route (service-role
  client) loads both participants' `members.email` + `profiles.first_name` and sends each a Resend
  email ("You've been matched at Corgi — here's who / open Corgi to see them"), linking back to the
  app. Add the `resend` npm dep + a small `lib/email.ts` wrapper.
- **In-app waiting fix:** on step 18, keep the existing `get_my_session_status` poll alive after
  "Notify me" (don't tear it down by leaving the screen), so an open tab still auto-advances when
  matched. (Optional upgrade: swap the 5s poll for a Supabase Realtime subscription on the session
  row — nicer, not required for MVP.)
- Env: `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL` (link target), `MATCH_WEBHOOK_SECRET`.

**Verify:** Tom starts a session (no counterpart) → "still looking"; close Tom's tab. Fred signs in
and starts a session → matcher pairs them → confirm Tom **receives the email**; reopen the link →
introduction screen shows Fred. Confirm Fred (the requester) also sees the match in-browser.

---

## Phase 3 — Resend for OTP / sign-in email

**Goal:** reliable sign-in email deliverability, unified on Resend.

- Point **Supabase Auth → custom SMTP** at Resend's SMTP (a Supabase project setting; no app code
  change — `signInWithOtp` / `verifyOtp` keep working). Requires a verified sending domain in
  Resend. This replaces Supabase's rate-limited built-in email for magic-link/OTP.
- Once real delivery is confirmed, plan to set `CORGI_DEV_LOGIN=0` for shared/preview envs (keep the
  dev bypass only for local).

**Verify:** sign up with a fresh email → magic link/OTP arrives via Resend (check Resend dashboard
logs) → clicking it signs in and resumes onboarding.

---

## Prerequisites from Tom (infra I can't provision)
- Resend account + `RESEND_API_KEY`.
- A verified sending domain in Resend (or use Resend's sandbox sender for dev, which only delivers
  to your own verified address).
- Confirm notification channel for MVP is **email only** (SMS via Twilio / web-push PWA are
  larger follow-ons — recommend deferring).

## Critical files
- `supabase/migrations/202608170001_no_repeat_matches_and_feedback_scale.sql` — the no-repeat clause
  to drop (via a new migration).
- New `supabase/migrations/2026081800xx_allow_rematch.sql`.
- `supabase/tests/matching_rpc_test.sql` — add re-match assertion.
- New `app/api/hooks/matched/route.ts`, new `lib/email.ts`; `package.json` (+`resend`).
- `components/ExaOnboarding.tsx` — keep the step-18 poll alive after "Notify me".
- Supabase dashboard: Database Webhook on `recommendations`; Auth custom SMTP → Resend (config,
  not code).

## Scope decision (Tom, 2026-08-16)
**Do Phase 1 only now.** Phase 2 (match notifications) and Phase 3 (Resend for OTP) are
deferred until the Resend account/domain exist — kept above for reference, not part of this
implementation.
