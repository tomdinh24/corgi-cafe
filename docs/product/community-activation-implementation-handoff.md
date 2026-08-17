# Corgi Community Activation Implementation Handoff

## Implemented experience

The active Exa app (`apps/onboarding-exa`) implements the approved onboarding and matching journeys.
Onboarding covers email or Google authentication, profile search
disclosure, a user-confirmed Exa identity candidate, optional public links, profile preview, and
profile confirmation. The post-onboarding flow covers the Cafe/community/later choice, Cafe gates,
explicit conversation topics and boundaries, search/no-match states, a synthetic direct
introduction, private pass, temporary recognition-photo states, bilateral meeting confirmation,
approved post-meeting links, and private feedback.

The Rowan recommendation and Cafe eligibility checks remain synthetic. Auth, member profiles,
onboarding progress, community interest, and visit-introduction sessions are ready to persist after
a Supabase development project is linked and migrated.

## Data and security decisions

- Supabase Auth owns member identity. Application rows reference `auth.users` through `members`.
- Row Level Security limits member/profile/source/progress/session/event data to its owner.
- Authenticated members cannot create recommendations or introduction participants. A future
  reviewed matching service or constrained RPC must create them.
- Counterpart data is not exposed through global profile reads. A narrow RPC returns only first
  name, role, current work, and the introduction reason to an eligible participant.
- Post-meeting links require member approval and two positive meeting confirmations.
- LinkedIn is an identifier only. The app never fetches a LinkedIn page or imports its facts.
- Cafe presence is a Boolean result with a timestamp. Exact coordinates and movement are not stored.
- Commercial boundaries default off and are always set explicitly by the member.
- Recognition media uses a private bucket, pair-scoped read policy, expiration metadata, and an
  owner path. The production deletion worker is not implemented yet.
- Private pass, meeting confirmation, and feedback are separate participant-owned records.

## Remote development setup gate

No remote Supabase project was linked or mutated during implementation. To unblock persistent
testing, an engineer must create or select the exact development project, then run from the
repository root:

```bash
supabase login
supabase link --project-ref <development-project-ref>
supabase db push
```

Add these variables to the linked Vercel development environment:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Configure the Supabase Auth site URL and allowed redirect URLs for the local and Preview domains.
In **Authentication → Email Templates → Magic Link**, include `{{ .Token }}` so Supabase sends the
six-digit code expected by the app rather than only a magic link. Google authentication also
requires enabling the Google provider in Supabase. Email OTP works without Google. No service-role
key belongs in the browser or is required by the current app.

Before a real pilot, implement order ownership verification, coarse Cafe-presence verification,
the matching service, email notifications, recognition-media capture/deletion, safety and daily
limits, and a retention audit.
