# Corgi onboarding Exa prototype

This standalone app implements the approved Corgi onboarding and Cafe-introduction journeys. Exa
People Search helps a member identify a possible public professional profile. Supabase provides
email OTP authentication and persistent member, profile, visit-session, and interaction data.

When Supabase is not configured, the app shows a setup notice and remains available as an explicit
preview using OTP `424242`. Preview mode never claims to save data. Cafe order/presence checks,
matching, recognition photos, notification delivery, and the Rowan introduction are synthetic.

## Run

```bash
npm install
npm run dev          # http://localhost:4313
```

With Supabase configured, use the code delivered by Supabase Auth. Without Supabase, use `424242`.
Refreshing the page clears the in-memory draft.

Exa needs `EXA_API_KEY`. The app may use `SESSION_SIGNING_SECRET`; a development-only secret is
used when it is absent outside production.
Persistence needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The
publishable key is used with member-scoped Row Level Security; do not add a service-role key to the
browser environment.
Copy the Exa app's `.env.local.example` to `.env.local` as needed. Missing provider keys intentionally
open a manual fallback.

## Supabase

The versioned schema is at `../../supabase/migrations/202608160001_corgi_community_core.sql` from
the repository root. After creating a development project, link and apply it from the repository
root:

```bash
supabase login
supabase link --project-ref <development-project-ref>
supabase db push
```

These commands mutate the remote project. Run them only after confirming the exact development
project. The migration uses private recognition-media storage, participant-scoped reads, member
ownership policies, and narrow counterpart RPCs. It deliberately gives authenticated clients no
permission to create recommendations.

The app expects a six-digit email OTP. In the hosted Supabase dashboard, update
**Authentication → Email Templates → Magic Link** to include `{{ .Token }}`; a template containing
only `{{ .ConfirmationURL }}` sends a link instead of the code used by this flow. Add the exact
local and Vercel Preview callback URLs to Supabase Auth's redirect allow list. Google sign-in is
optional and remains unavailable until its provider is configured.

## Verify

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

Playwright builds and serves an isolated production instance on port `4317`, so it does not stop or
reuse a Conductor development server on `4313`. Override with `CORGI_E2E_PORT` if needed.

`npm run test:live` is opt-in and only runs live-provider smoke tests when the required keys are
configured. Never put real personal information into these internal prototypes.
