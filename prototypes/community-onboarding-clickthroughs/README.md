# Corgi landing and onboarding prototype

This workspace contains the canonical Corgi Cafe introductions landing page and onboarding flow. It does not create accounts, save profiles, check Cafe presence, or recommend people.

## Routes

- `/` presents the outcome-first Corgi landing experience.
- `/start` enters onboarding at email.

## Run

```bash
npm install
npm run dev          # http://localhost:4313
```

Use OTP `424242` during local evaluation. Refreshing clears the in-memory draft.

The recovered profile-search adapter can use `EXA_API_KEY` on the server. The provider is not part of the public product presentation and is not approved for production. Missing keys, timeouts, and no results intentionally open manual entry. `SESSION_SIGNING_SECRET` is required in production; a local-only secret is used outside production.

Optional public links are collected only after candidate selection or the manual choice. The prototype never sends those links to profile search or fetches them. LinkedIn remains an identifier only and is never fetched or used as a source for profile facts.

## Verify

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

Browser tests use the isolated alternate port `4413`; they never reuse the separately managed preview on `4313`. `npm run test:live` remains opt-in for the recovered search adapter and requires a configured server key. Never use real personal information in this prototype.
