# Corgi Exa Onboarding Prototype

- **Status:** Ready for internal owner evaluation
- **Date:** August 15, 2026
- **Owners:** Design Lead, Engineering Manager, and Product Lead
- **Production decision:** None

## Purpose

This prototype uses Exa People Search to find structured public professional profiles, then asks the
member to confirm one identity candidate before reviewing an editable profile. The standalone Manual
and AI Web prototypes have been retired. Exa retains a short in-flow manual fallback so a missing
key, provider failure, or no-match result never blocks onboarding.

The experiment ends at `Ready for recommendations`. It does not create accounts, save profiles,
confirm Cafe presence, find people, rank people, or display a recommendation.

## Shared experience contract

The prototype uses this simulated verification and activation sequence:

```text
Set up intro → email → OTP 424242 → first name → last name → broad location
→ company → role or title → optional public URL
→ disclosed Exa People Search → identity candidate confirmation → editable profile confirmation
→ connect now, community interest, or maybe later
→ discussion topics → useful conversation and contribution
→ explicit permissions and expiration → session review
→ Ready for recommendations
```

All imported fields identify their source and remain unconfirmed until the member reviews them.
Suggested topics do not grant
availability, visibility, fundraising, recruiting, sales, or notification permission.

The community-interest and maybe-later branches say explicitly that nothing was saved. This is
intentional because these prototypes have no database or private-community handoff.

## Run the prototype

The npm workspace lives at the repo root; the app is
[`corgi_cafe_app/`](../../README.md).

| Command | Local URL | Live keys |
|---|---|---|
| `npm run dev` | `http://localhost:4313` | `EXA_API_KEY` |

Missing keys produce an on-brand manual fallback. `SESSION_SIGNING_SECRET` signs the 30-minute,
HTTP-only demo OTP cookie. A local-only default is available outside production.

## Provider and trust boundaries

- Provider calls occur only after a visible disclosure and an explicit member action.
- Exa performs one People Search and shows up to ten structured identity candidates.
- Exa may return professional metadata aggregated from LinkedIn. LinkedIn URLs remain unverified
  identifiers and Corgi never fetches their contents.
- Provider images are supporting context only and are never presented as verified portraits.
- Corgi consumes only Exa's structured person metadata and does not fetch candidate profile pages.
- Names, emails, locations, URLs, free text, source contents, and profile drafts are not logged.
- Drafts stay in React memory. Refreshing resets the walkthrough.
- Prototype events contain only the variation, step, duration or outcome category, never input
  values.

## Evaluation questions

Use the prototype to evaluate:

- Does structured candidate selection establish identity without making the member feel investigated?
- How often does the member correct or remove imported facts?
- Do imported role, company, location, and public-profile details feel helpful or presumptuous?
- Does structured People Search improve the confirmed profile enough to justify provider cost and latency?
- Is the fallback easy to find and complete when People Search is not useful?

Do not approve Exa for production from visual preference alone. Evaluate completion time, candidate
rejection, field correction, topic correction, privacy, cost, and terminal completion.

## Validation completed

- TypeScript linting for the Exa app and shared package.
- Production build for the Exa Next.js application.
- Twenty-three unit and mocked-provider tests for schemas, app-scoped signed state, call budgets,
  structured-person filtering, timeout behavior, malformed output, rate-limit retry, and missing-key
  fallbacks.
- Twenty-seven browser tests for connect-now, community-interest, maybe-later, incorrect-OTP, and
  identity-confirmation paths at 320, 768, and 1440 pixel widths.
- Browser checks for keyboard operation, reduced motion, zoom, truthful terminal states, commercial
  permissions defaulting off, and the absence of recommendation UI.
- Opt-in live smoke testing remains an engineering acceptance gate for the structured People Search
  response and candidate-confirmation flow.
- Browser-bundle checks confirming that provider key names and key material are absent.
- Dependency audit with no known vulnerabilities at the time of validation.

Prototype validation does not approve Exa for production or satisfy the privacy, legal, deletion,
or real-member test gates.

## Human acceptance gate

Before testing with anyone beyond the owner:

1. Product accepts the structured identity-confirmation journey.
2. Design accepts the disclosure, candidate selection, correction, permission, and fallback behavior.
3. Engineering verifies live provider behavior with configured keys and confirms server logs and
   browser bundles do not expose personal information or secrets.
4. Privacy and legal reviewers accept provider use, disclosure, deletion posture, and platform
   constraints.
5. The owner approves the complete onboarding design. No production architecture or vendor
   selection happens before that choice.
