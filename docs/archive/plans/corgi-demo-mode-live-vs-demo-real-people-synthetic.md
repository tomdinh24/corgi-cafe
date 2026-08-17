# Corgi Demo Mode — Live vs Demo, real-people synthetic matching

## Context

Matching requires **two live people at the same Corgi Cafe** (same `cafe_code`, both
`searching` + `at_cafe` + order-confirmed, exact `boundaries` equality, unexpired, not already in
an active recommendation). That's correct for production but makes a **solo demo impossible** — you
can't show the match + "why you two" without a second person physically present.

**Fix:** a user-switchable **Live / Demo** mode.

- **Live** — current behavior, unchanged (real second person, optional location check).
- **Demo** — no location; the user is matched against **real people the user curates by name**,
  seeded as real enriched profiles so the *entire* flow works end-to-end (match → find each other →
  confirm met → feedback). Isolated under a dedicated `demo` cafe so synthetic people never leak
  into Live pools.

Demo pool (extensible, starting set):

| Name | Role | Company |
|---|---|---|
| Richard Zhang | Product | Coinbase |
| Justin Ruiz | GTM | ATOMS |

Decisions (Tom, this session): **Full flow** (real seeded profiles, whole experience works) ·
default mode **Live** (user switches to Demo) · each person **enriched via Exa anchored on their
real LinkedIn** (no same-name conflation) · **notifications deferred** (next phase).

Why real seeded rows, not a mock: the commit (`request_introduction`) and every downstream write
(continue/pass, meeting confirmation, feedback) key off a **real `recommendation_id` + real
`members`/`visit_intro_sessions` FKs**. A mock reveal would break the downstream flow and diverge
from the real matcher. Seeding real rows makes the whole pipeline work unchanged.

App base dir: `prototypes/community-onboarding-clickthroughs/apps/onboarding-exa` (abbrev `.../`).
Repo-root `supabase/` holds migrations. No migrations or RPC changes are required.

---

## Implementation

### 1. Mode selection UX (client) — `.../components/ExaOnboarding.tsx` (+ small header/modal CSS)
State backed by localStorage, mirroring the `locationCheck` pattern:
- `MODE_KEY = "corgi.mode"`; `mode` state (`"live" | "demo"`); `modeChosen` = whether a value is
  stored; a mount `useEffect` reading `localStorage.getItem(MODE_KEY)`; a `setModeFlag(m)` writer
  (persists + updates state; when switching to `demo`, force the location check off).

**(a) Post-auth chooser modal.** After sign-in / sign-up completes (`authMode` is `magiclink` or
`dev`) and no mode is stored yet (`!modeChosen`), render a blocking overlay modal:
"How do you want to try Corgi? **Live** — meet a real person at your cafe · **Demo** — try the full
flow with a sample match." Picking one calls `setModeFlag`, closes the modal, and continues into the
app in that version. (New small `.mode-modal` overlay + two choice cards; reuse existing
button/card styles.) Returning users with a stored choice skip the modal.

**(b) Persistent top-bar toggle.** In the header's top-right cluster (`SiteHeader right={...}`, next
to the account menu + cafe pill, shown when `showAccount`), add a compact segmented **Live | Demo**
switch (`.mode-switch`) that calls `setModeFlag` on click so the user can flip anytime. Reflects the
current `mode`.

- When `mode === "demo"`: skip the presence screen (`goMeetSomeone` goes straight to step 9) and
  suppress the location pill/geolocation — demo has no location.
- Thread `mode` into the `startSession` payload (line ~552, same way `cafeCode` is threaded).
- Default: no stored mode → the modal forces an explicit choice on first run (so there is no silent
  default; if a default is ever needed, it is `live`).

### 2. Demo cafe isolation — `.../lib/cafes.ts`
Add `export const DEMO_CAFE_CODE = "corgi-demo";`. Demo sessions (both the user and the seeded
people) use this code; the matcher only pairs same-`cafe_code`, so demo people can never appear in
Live (`corgi-cafe` / `sf-*`) pools.

### 3. Session payload carries mode — `.../lib/persistence.ts`, `.../app/api/persist/route.ts`
- Add `mode: z.enum(["live","demo"]).optional()` to `SessionPayloadSchema`.
- In the persist `kind:"session"` branch: when `mode === "demo"`, force
  `cafe_code = DEMO_CAFE_CODE`, `at_cafe = true`, `order_confirmed_today = true` (no location/presence
  gating in demo). Live path unchanged.

### 4. Curated real-people fixture — new `.../lib/demoPeople.ts`
Array of the real people, shaped like `seed-test-pool.mjs`'s `people[]`:
`{ email, firstName, lastName, roleTitle, company, location, linkedinUrl, about, currentWork,
drink, topics, useful, offer, enrichment }`. Emails under an `@corgi.demo` domain
(e.g. `richard.zhang@corgi.demo`). The `enrichment` blob per person is produced by the existing
enrichment pipeline at build time (see step 6) and baked in — this is what powers a specific,
grounded "why you two."

### 5. Seeding (two parts) — reuse `scripts/seed-test-pool.mjs` as the template
- **Durable identities** — new `.../scripts/seed-demo-pool.mjs` (service-role): for each person,
  `admin.auth.admin.createUser` (idempotent, falls back to `listUsers`) → upsert `profiles`
  (incl. `enrichment`) + `profile_sources` (their LinkedIn) under `corgi-demo`. Run **once** to
  create the durable synthetic auth users/profiles. (The `on_auth_user_created` trigger creates
  `members` + `onboarding_progress`.)
- **Runtime session refresh** — new `.../app/api/demo/seed/route.ts` (admin client, authenticated
  caller): given the caller's `boundaries`, for each demo person cancel stale sessions and insert a
  fresh `visit_intro_sessions` (status `searching`, cafe `corgi-demo`, `at_cafe`/`order_confirmed`
  true, `boundaries` = **the caller's exact boundaries**, fresh `expires_at`). This solves the two
  gotchas: **boundaries exact-equality** (copied from the caller each run) and **consumed-on-match**
  (a match flips the session to `introduced`; refreshing re-arms it for the next demo).
- Client (mode=demo) calls `/api/demo/seed` right after `startSession`, before `runMatch`.

### 6. Enrichment of the real people (build step — reuse, don't rebuild)
For each person, resolve the correct LinkedIn via Exa people-search anchored on name + company +
role, **confirm the right individual** (per the existing anti-conflation guardrail), then run the
enrichment pipeline (`.../lib/provider.ts` `searchPersonWeb` / `fetchUrlContents`, and the
`extractSignal` logic in `.../app/api/enrich/route.ts`) to produce each person's `enrichment` blob +
`profile_sources`. Bake into `lib/demoPeople.ts`. *Optional from Tom:* their LinkedIn URLs to anchor
precisely; otherwise resolve + confirm during build.

### 7. Match / reveal / downstream — **unchanged**
Real `/api/match` → `list_introduction_candidates` (now returns the `corgi-demo` people) →
`rankBestMatch` (`.../lib/matcher.ts`) picks the best of {Richard, Justin, …} → `request_introduction`
commits a real recommendation → intro reveal (`/api/introduction/[id]`) + recognition + confirm-met
+ feedback all work with zero changes.

---

## Out of scope (this build)
- **Notifications** ("you've been matched" email) — next phase (existing deferred Resend plan).
- **Location in Demo mode** — intentionally off.

## Critical files
- `.../components/ExaOnboarding.tsx` — post-auth mode modal + top-right header toggle + demo branch, call `/api/demo/seed`.
- `.../app/journey.css` — `.mode-modal` overlay + `.mode-switch` header toggle styles.
- `.../lib/cafes.ts` — `DEMO_CAFE_CODE`.
- `.../lib/persistence.ts`, `.../app/api/persist/route.ts` — `mode` → demo cafe_code.
- `.../lib/demoPeople.ts` (new) — curated real-people fixture + enrichment.
- `.../app/api/demo/seed/route.ts` (new) — runtime session refresh (admin/service-role).
- `.../scripts/seed-demo-pool.mjs` (new, from `scripts/seed-test-pool.mjs`) — durable identities.
- Reuse unchanged: `.../lib/matcher.ts`, `.../app/api/match/route.ts`, `.../lib/provider.ts`,
  `.../app/api/enrich/route.ts`, the RPCs.

## Verification (real user path)
1. Run `seed-demo-pool.mjs` against cloud → confirm Richard + Justin exist (profiles + enrichment).
2. Live browser: sign in (dev-login) → **the post-auth modal appears** → pick **Demo** → "meet
   someone" → enter a background (e.g. product/crypto → should favor Richard; GTM/growth → Justin) →
   land on the intro screen with that person + a **specific LLM "why you two"** → continue through
   recognition → confirm-met → feedback, verifying each persists (a `recommendation_id` is present).
3. Use the **top-right toggle** to switch to **Live** → confirm demo people do NOT appear (different
   `cafe_code`); Live unchanged. Reload → confirm the stored choice skips the modal.
4. Re-run Demo a second time → confirm the refresh route re-arms a fresh `searching` session so it
   matches again (not bricked by the consumed session).

## Prereqs from Tom (infra I can't provision)
- Cloud DB stays configured + `SUPABASE_SERVICE_ROLE_KEY` present (already in `.env.local`).
- `OPENAI_API_KEY` + `EXA_API_KEY` present (already used by matcher/enrichment).
- Optional: LinkedIn URLs for Richard Zhang / Justin Ruiz to anchor enrichment precisely.
