# Corgi Cafe: Community Activation

An AI-assisted product that helps people at a cafe meet the *right* person for a real, in-person
conversation: a member builds a confirmed profile, starts a consented introduction session, gets
matched to a real counterpart by an LLM ranker, finds them in the room, confirms the meeting, and
exchanges contact details, all gated by mutual permission and persisted on live Supabase.

**Live demo:** https://corgi-cafe-eight.vercel.app/

> New here? Sign up with any email + password, or explore the guided preview. No cafe visit required.

## Engineering highlights

- **Directional LLM matching in a single pass.** One ranking call (OpenAI, temperature 0) scores the
  eligible pool for *mutual* benefit and drafts both sides' introduction reasons at once, each anchored
  to the other person by name, so relevance never overrides reciprocity.
- **Privacy-first by construction.** Postgres Row Level Security + security-definer RPCs mean the
  browser never queries counterpart PII directly. Last name, company, avatar, and social links are
  revealed only after *both* people independently confirm they met, a mutual-permission gate enforced
  in the database, not just the UI.
- **Profile enrichment that never scrapes LinkedIn.** A tiered pipeline (Exa) derives professional
  context from public web results and the member's own confirmed URLs, version-guarded so stale
  profiles refresh on return. LinkedIn is treated as an unverified identifier only, never fetched or
  summarized.
- **Recognition without exposure.** Members exchange "find each other" photos scoped to the live,
  time-bounded introduction via private storage + RLS, auto-expiring, without ever revealing a profile.
- **Consent and presence, never inference.** Introduction sessions are explicitly consented and
  time-bounded. Networking intent is never inferred from orders, timestamps, or loyalty behavior.
- **Typed end to end, verified on the real path.** Zod schemas shared across the app and the DB
  boundary; 14 forward-only Postgres migrations with participant-scoped policies; Vitest unit tests and
  Playwright e2e against an isolated production build.

## Tech stack

Next.js 16 (App Router) · TypeScript · Supabase (Postgres, Auth, Storage, Row Level Security) ·
OpenAI · Exa · Vercel · npm workspaces monorepo · Vitest + Playwright.

## Layout

- `corgi_cafe_app/`: the Next.js app (App Router). **This is the product.**
- `packages/corgi-onboarding-shared/`: shared Zod schemas, security, events, and UI/styles.
- `supabase/`: Postgres schema (migrations), config, seed, tests.
- `docs/`: product spec, brand + design standards, reference. `docs/archive/` holds superseded material.
- `scripts/`, `tests/`: seed scripts + Playwright e2e. Tooling (`package.json`, tsconfig, configs) is at the repo root (npm workspaces).

## Run it locally

```bash
npm install
npm run dev          # http://localhost:4313
```

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

<details>
<summary><strong>Setup &amp; operations</strong> (environment keys, Supabase provisioning)</summary>

### Environment

Exa needs `EXA_API_KEY`; the LLM match ranker needs `OPENAI_API_KEY`. The app may use
`SESSION_SIGNING_SECRET`; a development-only secret is used when it is absent outside production.
Persistence needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The
publishable key is used with member-scoped Row Level Security. A server-only `SUPABASE_SERVICE_ROLE_KEY`
is required for the match ranker, account deletion, and demo seeding; keep it server-side and never
add it to the browser environment.
Copy the app's `.env.local.example` to `.env.local` as needed. Missing provider keys intentionally
open a manual fallback.

When Supabase is not configured, the app shows a setup notice and remains available as an explicit
preview using OTP `424242`. Preview mode never claims to save data. Cafe order/presence checks,
recognition photos, and notification delivery are synthetic.

### Supabase

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

</details>
