# Integrate the redesigned Corgi landing page into the journey + 4 edits

## Context

You asked for four edits to the "An intro at Corgi" section of the community landing page:
1. The rotating headline ("good conversation. / project to talk through. / idea worth exploring.") needs a **better transition**.
2. That rotating text should become **co-founder, bestie, investor, hire** (headline reads "Let Corgi connect you with your next co-founder / bestie / investor / hire").
3. The example card persona should be **Trudy, not Maya**.
4. The conversation starter "What changed when founder-led sales stopped scaling?" → **"What are you building?"**

## What I found (why this is an integration, not just 4 tweaks)

The redesigned landing you're reviewing was built on a **separate branch in a separate checkout** and was never merged into this worktree:

- **Real source recovered** at `/Users/tomlam/.treehouse/corgi-cafe-4d1d9f/5/corgi-cafe/.../onboarding-exa/` (branch `fm/engineer-corgi-landing-community-a-e4`, newest — Aug 16 17:13): `components/LandingPage.tsx`, `app/page.tsx`→LandingPage, `app/start/page.tsx`→journey, landing CSS in `packages/corgi-onboarding-shared/src/styles.css` (2817 lines incl. `.landing-*`/`.connect-*`/`.example-*`), and `public/` image assets.
- **My worktree (roseau, branch `corgi-community-activation`)** has the **functional journey** (auth, `lib/persistence`, `lib/supabase`, `api/{auth,config,introduction,match,persist}`) but **no landing** — `app/page.tsx` renders `ExaOnboarding`, there's **no `/start` route**, and its shared CSS (692 lines) has **none** of the landing classes.

The two branches diverged: one added the journey backend, the other the landing. The user wants the landing wired into the journey → port the landing into roseau.

**Integration risk (handled):** roseau's base CSS uses a different token vocabulary — it does **not** define `--color-brand-deep` / `--color-ink` that the landing CSS references. So I will port the landing CSS as a **self-contained, scoped stylesheet** (bundling the `--color-*` tokens it needs under `.landing-page`) rather than merging into the 692-line shared CSS — zero risk to journey styling.

## Plan

### 1. Port landing files into roseau (`apps/onboarding-exa/`)
- Copy `components/LandingPage.tsx` from treehouse 5 → roseau `components/LandingPage.tsx`.
- Copy `public/` assets (7 files) → roseau `apps/onboarding-exa/public/`: `brand/corgi-logo.svg`, `community/corgi-{laptop,founder,suit}.png`, `community/team/{nasdaq,speaking,celebration}-team-member(s).jpg`.
- Create `apps/onboarding-exa/app/landing.css`: the landing CSS block from treehouse 5's shared `styles.css` (the `/* Landing */` section, ~lines 935–2817, incl. `@keyframes connect-term`), plus a `.landing-page { --color-brand-deep: …; --color-ink: …; --color-ink-muted: … }` token block (values read from treehouse 5's `:root`). Import it in `app/layout.tsx` after `./journey.css`. All selectors are `.landing-*`/`.social-*`-namespaced, so no collision with journey.

### 2. Wire routes (landing → journey)
- `app/page.tsx`: render `<LandingPage />` (was `<ExaOnboarding />`).
- Create `app/start/page.tsx`: `import { ExaOnboarding } from "@/components/ExaOnboarding"` and render it (roseau's functional journey; treehouse 5's start route used an alias `CorgiOnboarding` — use roseau's actual export). LandingPage's "Start an intro" already links to `/start`.

### 3. Apply the 4 edits (`LandingPage.tsx` section `.social-example`, lines ~94–113, + `landing.css`)

| # | Edit |
|---|------|
| 1 | **Transition:** rework `@keyframes connect-term` for a smoother crossfade + gentle rise/settle (softer easing, longer hold, cross-dissolve between terms; no layout jump — `.connect-rotation` already uses `display:grid`/`overflow:hidden` with a fixed slot). Keep `prefers-reduced-motion` fallback (first term static) and the mobile `:first-child` static rule. |
| 2 | **Rotation copy → 4 role words:** replace the 3 `<span>`s (`good conversation.`/`project to talk through.`/`idea worth exploring.`) with 4: `co-founder` / `bestie` / `investor` / `hire`; update the `.sr-only` text to the first word. Retime CSS: `.connect-rotation > span { animation: connect-term 12s infinite }`, delays `:nth-child(2)=3s, (3)=6s, (4)=9s`, and recompute keyframe % so each term holds ~1/4 of the cycle. |
| 3 | **Maya → Trudy:** `MAYA IS OPEN NOW`→`TRUDY IS OPEN NOW`; `Maya · GTM operator`→`Trudy · GTM operator`; `Maya has helped two developer-tool teams…`→`Trudy has helped…`; `id="maya-title"`/`aria-labelledby="maya-title"`→`trudy-title`. |
| 4 | **Conversation starter:** `What changed when founder-led sales stopped scaling?` → `What are you building?` |

### Critical files
- New/edited in roseau: `components/LandingPage.tsx`, `app/landing.css`, `app/layout.tsx`, `app/page.tsx`, `app/start/page.tsx`, `public/**`.
- Source of truth to copy from: treehouse 5 (`.../corgi-cafe-4d1d9f/5/corgi-cafe/.../onboarding-exa/`).

## Verification (real user path)
1. `cd prototypes/community-onboarding-clickthroughs/apps/onboarding-exa && npm run dev`.
2. Load `/` — confirm the landing renders with all images (corgi trio, team photos, logo), and the headline rotates smoothly through **co-founder → bestie → investor → hire** with no layout shift.
3. Confirm the card reads **Trudy** everywhere and the starter reads **"What are you building?"**.
4. Click **Start an intro** → lands on `/start` and the real onboarding journey renders (not a 404).
5. Toggle OS reduced-motion → rotation shows a single static word.
6. Screenshot desktop + mobile; compare against the reviewed design.

## Notes
- I'm porting files rather than `git merge`-ing the landing branch, because roseau has extensive uncommitted journey work and a token-vocabulary divergence — a merge would risk conflicts and CSS regressions.
- The card's "moved beyond founder-led sales" sentence stays (still reads fine under the new starter); flag if you'd rather I also rework it.
