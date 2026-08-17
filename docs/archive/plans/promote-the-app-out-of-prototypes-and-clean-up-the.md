# Promote the app out of prototypes/ and clean up the repo layout

## Context

`prototypes/community-onboarding-clickthroughs/` is not actually a prototype — it's the real,
live product (Next.js app `apps/onboarding-exa` + shared package `packages/corgi-onboarding-shared`,
npm workspaces, deployed on Vercel, backed by `supabase/` at repo root). Its name and location under
`prototypes/` misrepresent it and make the repo hard to navigate. `prototypes/community-activation-landing/`
is a genuine, still-current design/marketing handoff prototype (standalone static HTML, not wired
into the app, not deployed) and should stay put.

**Gate — do not execute until PR #1 (`fm/engineer-corgi-refresh-e1`) has merged to `master`.**
PR #1 is what originally creates this entire file tree on `master` and is still open. Our current
branch (`corgi-community-activation`, PR #2, 33 commits, currently `MERGEABLE`/`CLEAN`) already
contains that tree. Reorganizing now, before PR #1 lands, would make PR #2's diff show the whole
tree as moved/deleted relative to PR #1 once that merges — a large, confusing conflict. Confirm with
Tom that PR #1 has merged (`gh-axi pr view 1`) before starting.

## Target layout

```
/                              (repo root)
  app/                         (renamed from prototypes/community-onboarding-clickthroughs)
    apps/onboarding-exa/
    packages/corgi-onboarding-shared/
    scripts/
    tests/
    package.json, package-lock.json, playwright.config.ts, vitest.config.ts, tsconfig.json, README.md
    .env.local, .env.local.example
  prototypes/
    community-activation-landing/   (unchanged, stays a standalone prototype)
  docs/                         (unchanged)
  supabase/                     (unchanged)
  AGENTS.md, .gitignore
```

Decisions confirmed with Tom:
- New top-level folder `app/` (workspace wrapper relocated out of `prototypes/`, not flattened into
  repo root) — keeps the npm-workspaces boundary clean and named distinctly from `docs/`, `supabase/`.
- Rename to **`corgi-app`** is the folder's internal identity where naming shows up (see below) —
  but the directory itself is `app/` per the above (Tom picked "New top-level folder, e.g. /app").
- `prototypes/community-activation-landing/` stays exactly where it is.

## Steps

1. **Move the tree**: `git mv prototypes/community-onboarding-clickthroughs app` (single `git mv` of
   the directory preserves history for every file underneath; do not copy+delete).
2. **Rename workspace identity**: in `app/package.json`, change `"name"` from
   `corgi-community-onboarding-clickthroughs` to `corgi-app`. Leave `apps/onboarding-exa`'s package
   name (`@corgi/onboarding-exa`) and `packages/corgi-onboarding-shared`'s package name as-is — those
   already describe the actual sub-packages correctly and aren't part of the rename Tom asked for.
3. **Fix the one path-dependent reference**: `app/README.md` line ~31 currently reads
   `../../supabase/migrations/...` (correct for 2-levels-deep `prototypes/community-onboarding-clickthroughs/`).
   From `app/` (1 level deep) this must become `../supabase/migrations/202608160001_corgi_community_core.sql`.
   Everything else (all `app/apps/onboarding-exa/**` imports) is relative *within* the app and is
   unaffected by moving the parent — verified via grep, no other cross-boundary relative paths exist.
4. **Update AGENTS.md** (repo root): every reference to `prototypes/community-onboarding-clickthroughs`
   (the "current onboarding prototype" language, the checks-location pointer) becomes `app/`. Update
   the sentence describing it as a "prototype" to reflect it's the live app now that it's promoted
   out of `prototypes/`.
5. **Update docs referencing the old path**: `docs/product/post-order-discovery-landing-page-handoff.md`
   and `docs/product/community-onboarding-exa-prototype.md` — grep confirmed these are the only docs/
   files with `prototypes/` references; update any that point at
   `prototypes/community-onboarding-clickthroughs` (leave references to
   `prototypes/community-activation-landing` unchanged, that path isn't moving).
6. **Leave `.context/plans/*.md` alone** — those are historical/gitignored planning artifacts, not
   part of the shipped codebase; don't rewrite history for cosmetic path drift.
7. **`.gitkeep` at repo root**: appears to be a stale placeholder from before `prototypes/` existed;
   remove it as part of the cleanup pass (confirm it's genuinely empty and unreferenced first).

## Explicitly out of scope / follow-ups Tom must do manually

- **Vercel Root Directory setting**: the Vercel project's build root is configured in the Vercel
  dashboard (no `vercel.json` in-repo), currently pointing at the old path. After this merges to
  `master`, Tom needs to update it to `app/apps/onboarding-exa` in the Vercel project settings, or
  the next deploy will fail to find the app.
- **Supabase CLI link**: `supabase/config.toml` and `.temp/project-ref` are unaffected (supabase/
  isn't moving), no action needed there.

## Verification

1. From repo root: `cd app && npm install && npm run dev` — confirm it boots on `:4313` and `/` and
   `/start` render as before.
2. `cd app && npm run lint && npm test && npm run build` — must pass exactly as they did at the old
   path (these are path-independent workspace scripts).
3. `grep -rn "prototypes/community-onboarding-clickthroughs"` across the repo (excluding
   `.context/`, `node_modules/`, `.next/`) — must return zero hits after the doc/AGENTS.md updates.
4. `git status` / `git diff --stat origin/master...` — confirm the diff reads as renames (`R`), not
   delete+add, so review stays sane.
