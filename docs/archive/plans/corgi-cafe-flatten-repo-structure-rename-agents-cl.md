# Corgi Cafe — Flatten repo structure, rename AGENTS→CLAUDE, reorganize docs

## Context

The project *works* but is **scattered**, which the user wants fixed:

- The one real, runnable app lives **4 levels deep**: `prototypes/community-onboarding-clickthroughs/apps/onboarding-exa/`.
- The npm-workspaces **monorepo root is 2 levels deep** (`prototypes/community-onboarding-clickthroughs/`), so the repo root has no `package.json`/`tsconfig`/lockfile.
- `supabase/` and `docs/` sit at the repo root, and **Vercel is linked to `.`** — three "roots" at three depths, none aligned.
- Two `AGENTS.md` files: a hand-authored root one (self-titled "Codex Project Instructions") and an auto-generated Next.js block inside the app.
- Docs are mostly in `docs/` but several are **stale** (schema doc predates 9 migrations; an enrichment doc still names Crustdata vs the shipped Exa; dangling `JOURNEY-R0x` references), and `.context/` holds gitignored clutter (a full Chrome profile, vendored Python, screenshots, 11 scratch plans, a duplicate MVP brief).

**Decisions locked with the user:**
1. **Flatten** the monorepo to the repo root (cleanest).
2. **Archive** superseded/stale artifacts to `docs/archive/` (keep history).
3. **Yes** to updating the Vercel root-directory setting as part of this.

**Outcome:** git root = monorepo root = Vercel root = Supabase root. App becomes `apps/onboarding-exa` (2 deep). One `CLAUDE.md` at root. A clean, honest `docs/` with stale material archived.

## Pre-flight (do first)

- **Clean working tree.** This is a Conductor git worktree on branch `corgi-community-activation` shared with in-flight work. Commit or stash all pending changes before the move so the rename diff is legible. (A sibling worktree on branch `fm/engineer-corgi-matching-r04-frontend-e6` still has the old layout — flag: that branch will conflict heavily when it later merges; coordinate before merging either.)
- **Do the move on a dedicated branch** off the current one (e.g. `chore/flatten-structure`) so the large rename is reviewable as its own PR, separate from feature work.
- Stop the running dev server (it points at the old path).

## Step 1 — Rename root AGENTS.md → CLAUDE.md

- `git mv AGENTS.md CLAUDE.md`.
- In the body, change the self-description "Codex Project Instructions" → Claude/Claude Code, and update the two `prototypes/...` path references it contains (see Step 3).
- Verified: only `AGENTS.md` + 2 docs reference the old paths, so scope is tiny.

## Step 2 — Flatten the monorepo to the repo root

Move the **contents** of `prototypes/community-onboarding-clickthroughs/` up to the repo root, then delete the empty wrapper. No name collisions exist (the monorepo has no `docs/`/`supabase/`/`AGENTS.md`/`.gitignore` of its own).

Moves (tracked → `git mv`; gitignored on-disk siblings `node_modules/`, `.next/`, `.env.local` → plain `mv` so the app still runs):
- `prototypes/community-onboarding-clickthroughs/{apps,packages,scripts,tests}/` → `/{apps,packages,scripts,tests}/`
- `.../package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `README.md` → repo root
- Then `git rm -r`/remove the now-empty `prototypes/community-onboarding-clickthroughs/`.

Why it's clean (verified):
- Root `.gitignore` uses **non-anchored** patterns (`node_modules/`, `.next/`, …) — matches at the new depth, **no edits needed**.
- Monorepo `package.json` scripts are **workspace-relative** (`--workspace=@corgi/onboarding-exa`, `apps/onboarding-exa/.env.local`) — valid unchanged once `package.json` is at root.
- `next.config.ts` `transpilePackages` + tsconfig `@/*` alias + `workspaces: ["apps/*","packages/*"]` are all internal/relative — move intact.
- `supabase/` and `docs/` **stay at the repo root** (Supabase CLI expects `supabase/` at project root).
- Optional polish: set root `package.json` `"name"` to `corgi-cafe` (matches the Vercel project + Supabase `project_id`).

## Step 3 — Fix the 3 tracked path references

Update the `prototypes/community-onboarding-clickthroughs/...` paths to the new root-level paths in:
- `CLAUDE.md` (formerly `AGENTS.md`)
- `docs/product/community-onboarding-exa-prototype.md`
- `docs/product/post-order-discovery-landing-page-handoff.md`

(`prototypes/community-activation-landing/index.html` references also move — see Step 5.)

## Step 4 — Handle the app-level auto-generated AGENTS.md

`apps/onboarding-exa/AGENTS.md` is the `<!-- BEGIN:nextjs-agent-rules -->` block that **`next dev` regenerates** — renaming it won't stick. Add `apps/onboarding-exa/AGENTS.md` (or `AGENTS.md` app-scoped) to `.gitignore` and remove it from tracking, so only the root `CLAUDE.md` is the curated instruction file. (Do not fight Next's regeneration.)

## Step 5 — Reorganize docs (create `docs/archive/`)

Keep the live docs in place: `docs/BRAND_WRITING.md`, `docs/DESIGN_SYSTEM.md`, `docs/product/community-activation-problem-brief.md`, `docs/product/community-activation-product-spec.md`, `docs/product/community-activation-implementation-handoff.md`, `docs/reference/corgi-community-context.md`.

Create `docs/archive/` and move superseded material there:
- **Superseded prototype** (code): `prototypes/community-activation-landing/` → `docs/archive/community-activation-landing/` (concept now lives in `apps/onboarding-exa/components/LandingPage.tsx`).
- **Retired-direction docs:** `docs/product/onboarding-enrichment-proposal.md` (Crustdata vs shipped Exa) → `docs/archive/`.
- **Planning artifacts:** the valuable `.context/plans/*.md` (currently gitignored scratch) → `docs/archive/plans/` so history is preserved and tracked.
- **Duplicate brief:** keep `docs/reference/corgi-community-context.md` as canonical; the identical `.context/attachments/TTDOkk/…Brief.md` is gitignored scratch — leave or drop, don't track a second copy.

Refresh rather than archive (still useful, just outdated):
- `docs/product/community-activation-data-schema.md` — regenerate the data dictionary from the current 12 migrations (through `202608190001`) instead of only 0001–0002. (If the user prefers, archive it too — flag at execution.)
- Fix the dangling `ONBOARDING-JOURNEY-R03` / `MATCHING-JOURNEY-R02` references in the handoff doc (either add the artifacts or drop the references).

Add a **root `README.md`**: one-screen orientation — what the project is, `apps/onboarding-exa` is the app, how to run (`npm i && npm run dev`), where docs live, Supabase + Vercel notes. (There is no root README today.)

## Step 6 — Local clutter (gitignored working tree only, not a git change)

Delete from the working tree (all under gitignored `.context/`, so no history impact):
- `.context/chrome-cdp-profile/` (a full Chrome browser profile — accidental, large)
- `.context/pydeps/` (vendored Python `websocket-client` — doesn't belong in a JS repo)
- `.context/todos.md` (empty)

Leave the rest of `.context/` (attachments/screenshots) as Conductor scratch.

## Step 7 — Update Vercel root directory (confirm with user before touching deploy)

Vercel project `corgi-cafe` currently builds from a deep root-dir setting (dashboard). After flattening, set **Project Settings → Build & Development → Root Directory = `apps/onboarding-exa`** (Vercel installs the workspace from the repo root automatically). `.vercel/repo.json` is a gitignored local link and needs no change.
- Prefer the dashboard for the Root Directory change (it's a project setting, not easily set via CLI). I will surface the exact value and confirm before making any deploy-affecting change.

## Critical files

- `AGENTS.md` → `CLAUDE.md` (root) — rename + de-Codex + path fixes.
- `prototypes/community-onboarding-clickthroughs/**` → repo root (`apps/`, `packages/`, `scripts/`, `tests/`, `package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `README.md`).
- `.gitignore` — add app-scoped `AGENTS.md`; otherwise unchanged.
- `docs/archive/` (new) — superseded prototype + docs + `.context/plans/*`.
- `docs/product/community-activation-data-schema.md` — refresh vs migrations.
- New root `README.md`.

## Verification (must exercise the real paths)

1. **Structure sane:** `git status`/`git mv` recorded as renames (not delete+add); tree shows `apps/`, `packages/`, `supabase/`, `docs/`, `CLAUDE.md`, `README.md` at root; no `prototypes/` left.
2. **Install + build from the new root:** `npm install` then `npm run build` — workspace resolves `@corgi/onboarding-shared`, Next builds.
3. **Lint + tests:** `npm run lint` (tsc clean) and `npm run test` (vitest, 25 tests) green from repo root.
4. **App boots the real path:** `npm run dev` → load `/`, `/home`, `/account` in a browser (the flatten only changes location, not code, so a boot + a couple of page loads confirms path/config integrity).
5. **Supabase intact:** `supabase status`/`migration list --linked` still resolves from root `supabase/`.
6. **Deploy:** after the Vercel Root Directory update, trigger a preview deploy and confirm it builds + the app serves (use the branch preview URL). Only call the deploy step done after a green Vercel build.
7. **Docs:** no remaining tracked references to `prototypes/community-onboarding-clickthroughs/` (`git grep prototypes/community-onboarding-clickthroughs` returns nothing); `docs/archive/` holds the superseded set; root `README.md` renders.

## Out of scope (call out, don't do)

- Renaming `apps/onboarding-exa` → a cleaner name / changing the `@corgi/onboarding-exa` package name (extra churn + Vercel/workspace updates) — optional future.
- Rewriting doc *content* beyond the schema refresh + dangling-reference fixes.
- Touching the sibling matching-frontend branch's layout (owned by another agent).
