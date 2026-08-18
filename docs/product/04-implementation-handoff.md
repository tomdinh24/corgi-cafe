# Corgi Community Activation Implementation Handoff

## Implemented experience

The active Exa app (`corgi_cafe_app`) implements the approved onboarding and matching journeys.
Onboarding covers email + password or Google authentication, profile search
disclosure, a user-confirmed Exa identity candidate, optional public links, profile preview, and
profile confirmation. The post-onboarding flow covers the Cafe/community/later choice, Cafe gates,
explicit conversation topics and boundaries, search/no-match states, a live matched introduction
(synthetic only in preview mode), private pass, temporary recognition-photo states, bilateral
meeting confirmation, approved post-meeting links, and private feedback.

**Home hub + matching.** Signed-in, onboarded members land on a `/home` "My matches" dashboard
(routes: `/home`, `/start`, `/account`). A confirmed match = both sides accepted the intro
(`private_decision='continue'`) or both confirmed they met. The dashboard shows an in-progress /
"Still looking" card with Resume, a grid of confirmed-match cards (click for a detail popup), and
"Start a chat"; the intro flow ends with "Finish for today". Matching is real: an LLM ranker picks
the best counterpart from the eligible pool and commits through the `request_introduction` RPC (the
only writer of `recommendations`), degrading to a deterministic auto-pick when the ranker is
unavailable. Declining an introduction ends it immediately and re-pools the counterpart back into
the searching queue (`decline_introduction` RPC), so no one is stranded; a declined pair is blocked
from re-matching for 24h (`declined_within_a_day`), while a plain page refresh with no decline still
allows re-recommendation. Only Cafe-presence and order-ownership verification remain simulated.

**Account + Demo.** `/account` supports profile-photo upload and permanent account deletion (cascades
all member rows). Demo mode runs the whole match → meet → links flow solo against an isolated
`corgi-demo` cafe seeded with real, curated, enriched people; demo people never appear in Live pools.

Auth, member profiles, onboarding progress, community interest, visit-introduction sessions,
recommendations, meeting confirmations, and feedback all persist once Supabase is connected and
migrated; the same schema backs Demo mode's seeded pool.

## Data and security decisions

- Supabase Auth owns member identity. Application rows reference `auth.users` through `members`.
- Row Level Security limits member/profile/source/progress/session/event data to its owner.
- Authenticated members cannot create recommendations or introduction participants directly. Only
  the reviewed `request_introduction` RPC (security-definer) creates them.
- Counterpart data is not exposed through global profile reads. A narrow RPC returns only first
  name, role, current work, and the introduction reason to an eligible participant.
- The counterpart's shareable links (including the LinkedIn identifier's URL) and profile photo are
  revealed only after both members confirm they met, gated server-side in `list_my_confirmed_matches`
  and `get_post_meeting_links`, so the URLs never reach the client before mutual meeting.
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
SUPABASE_SERVICE_ROLE_KEY        # server-only: matching ranker, account deletion, demo seeding
EXA_API_KEY                      # people-search onboarding
OPENAI_API_KEY                   # LLM match ranker
SESSION_SIGNING_SECRET           # signed session cookie
```

Configure the Supabase Auth site URL and allowed redirect URLs for the local and Preview domains.
Configured sign-in is **email + password**, so no SMTP/email-delivery setup and no Magic Link
template edit are required; keep Supabase's "Confirm email" setting off so sign-up returns a session
in the same tab. Enable the **Google** provider in Supabase to allow "Continue with Google". A
server-only `SUPABASE_SERVICE_ROLE_KEY` (never exposed to the browser) is required: the matching
ranker, account deletion, and demo seeding use the admin client; the publishable key remains the
only Supabase key sent to the client.

Before a real pilot, implement order ownership verification, coarse Cafe-presence verification,
email notifications, recognition-media capture/deletion, safety and daily limits, and a retention
audit.
