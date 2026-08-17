# Fix: Supabase sign-in/sign-up in private/incognito on mobile

## Context

Tom reports sign-in/sign-up **fails in private/incognito mode on phones** ("was an issue
before"). Investigation of the real (configured) auth flow found a deterministic root cause — it is
**not** a localStorage problem; it's the **magic-link + PKCE cross-context** pattern.

### Root cause (verified in code)

1. `app/api/auth/start/route.ts` (configured branch) calls
   `signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: ${origin}/auth/callback } })`.
   Because `emailRedirectTo` is set, Supabase emails a **clickable magic link** and `@supabase/ssr`
   (default `flowType: pkce`) writes a **code-verifier cookie** (`sb-<ref>-auth-token-code-verifier`)
   into the **requesting browser**.
2. `app/auth/callback/route.ts` completes auth with `exchangeCodeForSession(code)`, which **requires
   that verifier cookie** to still be present in whatever browser opens the link.
3. On mobile, tapping the emailed link opens the mail app's **in-app browser** or a **fresh
   private window** — a separate/partitioned cookie jar with **no verifier cookie**. The exchange
   fails → redirect to `/sign-in?auth=failed`. Private/incognito guarantees a clean jar, so it
   fails every time.
4. The `magiclink`-mode UI in `components/ExaOnboarding.tsx` (step 1) renders a **link-only** screen
   with **no code-entry field**, so there is no same-tab recovery.

### Why the fix is safe

A **same-tab 6-digit OTP code** path already exists and is proven:
- `app/api/auth/verify/route.ts` already calls `supabase.auth.verifyOtp({ email, token, type: "email" })`.
- The dev-login flow (`CORGI_DEV_LOGIN=1`) already uses that exact `verifyOtp` call and its session
  cookies persist correctly from a Route Handler.
- The client already renders a `<Field label="6-digit code" autoComplete="one-time-code">` +
  `verify` form — but only for `dev`/`preview`, never for configured `magiclink`.

`verifyOtp` is entered and completed **in the same tab**, so it needs **no verifier cookie** and is
immune to the cross-context failure. This is the minimal, robust fix. Google OAuth stays as-is
(its redirect is same-browser, not email-cross-context) and remains the social option.

App base dir: `prototypes/community-onboarding-clickthroughs/apps/onboarding-exa` (abbrev `.../`).

---

## Implementation

### 1. Switch configured auth mode from link → code — `.../app/api/config/route.ts`
Change the configured branch so the client renders the code-entry UI instead of the link screen:
```ts
// before: mode === "setup_required" ? "preview" : isDevLoginEnabled() ? "dev" : "magiclink"
const authMode = mode === "setup_required" ? "preview" : isDevLoginEnabled() ? "dev" : "otp";
```
(New `"otp"` = real Supabase email OTP code, same-tab.)

### 2. Start route returns code mode — `.../app/api/auth/start/route.ts`
Configured branch keeps calling `signInWithOtp` (that call generates the 6-digit token) but returns
`{ mode: "otp" }` instead of `{ mode: "magiclink" }`. **Keep `emailRedirectTo`** so the magic link
in the email still works for same-context users as a bonus — the code is now the primary,
private-mode-safe path. (Optional hardening: drop `emailRedirectTo` entirely to force code-only; not
required.)

### 3. Client renders the code field for `"otp"` — `.../components/ExaOnboarding.tsx`
- `authMode` union type: add `"otp"` → `"checking" | "preview" | "dev" | "magiclink" | "otp"`.
- Boot gate (~line 231): `if (data.authMode === "magiclink" || data.authMode === "dev")` → also
  include `"otp"` so the resume/advance logic treats it as a real auth mode.
- Step-1 render (~lines 643-647): the existing fallthrough already renders the 6-digit code form for
  the non-`magiclink` case; ensure `"otp"` hits it with consumer copy ("We sent a 6-digit code to
  {masked}. Enter it here to finish."). Keep the `magiclink` link-screen branch in place (dead
  unless re-enabled) or remove it — recommend keeping it behind the now-unused mode for easy revert.
- `Field` already has `inputMode="numeric"` + `autoComplete="one-time-code"` (iOS/Android
  autofill-from-SMS/mail) — no change needed.

### 4. (No code change) Cookie attributes
`@supabase/ssr` defaults (`SameSite=Lax`) are correct for same-tab OTP; no override needed. The
`corgi_exa_otp` **preview** cookie is `SameSite=Strict` but is preview-only and unrelated to the
real session — leave it.

---

## Prereq from Tom (Supabase dashboard — I cannot do this)

The Supabase project's **email template** (Auth → Email Templates → "Magic Link") must include the
token so the user actually receives a code to type:
```
Your Corgi sign-in code is {{ .Token }}
```
Today the default template only renders `{{ .ConfirmationURL }}` (link). Adding `{{ .Token }}` (a
one-line template edit) is what makes the OTP-code flow deliver a code. This is the **one manual
step** that gates the fix; the code changes above are inert without it.

## Out of scope
- Google OAuth changes (already same-browser; fine).
- Middleware session refresh (no `middleware.ts` today; not needed for this fix).
- Removing the magic-link code path (kept for revert/graceful fallback).

## Critical files
- `.../app/api/config/route.ts` — `authMode` configured → `"otp"`.
- `.../app/api/auth/start/route.ts` — return `{ mode: "otp" }`.
- `.../components/ExaOnboarding.tsx` — accept `"otp"` in the union + boot gate + step-1 code render.
- Unchanged, reused: `.../app/api/auth/verify/route.ts` (`verifyOtp`), `.../lib/supabase.ts`.

## Verification (real private-mode path)
1. Add `{{ .Token }}` to the Supabase Magic Link email template (Tom).
2. Deploy to the preview/prod URL (configured mode; `CORGI_DEV_LOGIN` **off**).
3. On a **phone, in a real private/incognito tab**: enter email → confirm the screen now shows a
   **6-digit code field** (not "click your link") → receive the email → type the code → confirm you
   land signed-in in **the same tab** and `/api/auth/status` returns `authenticated:true`.
4. Repeat in a **second** private session with a different email to confirm sign-**up** (new user)
   works the same way (`shouldCreateUser: true`).
5. Regression: dev-login (`CORGI_DEV_LOGIN=1`) and preview (`424242`) still work unchanged.
6. `../../node_modules/.bin/tsc --noEmit` clean + `npm run build` passes.

Note: this must be verified on a **real device in private mode**, not just desktop — the failure
only reproduces in a partitioned/clean cookie jar. Per Tom's verification rule, do not call it done
off a proxy; watch one real private-mode session complete end-to-end.
