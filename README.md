# Corgi Cafe: Community Activation

Onboarding + Cafe-introduction ("matching") product for the Corgi community: a member builds a
confirmed profile (Exa People Search assists identity), starts a consented intro session, is matched
to a real counterpart, confirms the meeting, and leaves private feedback, all persisted on live Supabase.

## Layout

- `corgi_cafe_app/`: the Next.js app (App Router). **This is the product.**
- `packages/corgi-onboarding-shared/`: shared Zod schemas, security, events, and UI/styles.
- `supabase/`: Postgres schema (migrations), config, seed, tests.
- `docs/`: product spec, brand + design standards, reference. `docs/archive/` holds superseded material.
- `scripts/`, `tests/`: seed scripts + Playwright e2e. Tooling (`package.json`, tsconfig, configs) is at the repo root (npm workspaces).

When Supabase is not configured, the app shows a setup notice and remains available as an explicit
preview using OTP `424242`. Preview mode never claims to save data. Cafe order/presence checks,
recognition photos, and notification delivery are synthetic.

## Run

```bash
npm install
npm run dev          # http://localhost:4313
```

Exa needs `EXA_API_KEY`; the LLM match ranker needs `OPENAI_API_KEY`. The app may use
`SESSION_SIGNING_SECRET`; a development-only secret is used when it is absent outside production.
Persistence needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The
publishable key is used with member-scoped Row Level Security. A server-only `SUPABASE_SERVICE_ROLE_KEY`
is required for the match ranker, account deletion, and demo seeding; keep it server-side and never
add it to the browser environment.
Copy the Exa app's `.env.local.example` to `.env.local` as needed. Missing provider keys intentionally
open a manual fallback.

## Supabase

The versioned schema lives in `supabase/migrations/` at the repository root (starting with
`202608160001_corgi_community_core.sql`). After creating a development project, link and apply it
from the repository root:

```bash
supabase login
supabase link --project-ref <development-project-ref>
supabase db push
```

These commands mutate the remote project. Run them only after confirming the exact development
project. The migration uses private recognition-media storage, participant-scoped reads, member
ownership policies, and narrow counterpart RPCs. It deliberately gives authenticated clients no
permission to create recommendations.

Configured sign-in is email and password, so no email-delivery setup or Magic Link template edit is
needed; keep Supabase's **Confirm email** setting off so sign-up returns a session in the same tab.
Add the exact local and Vercel Preview callback URLs to Supabase Auth's redirect allow list. Google
sign-in is optional and remains unavailable until its provider is configured.

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
