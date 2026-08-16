# Corgi onboarding Exa prototype

This standalone internal prototype uses Exa People Search to help a member identify their public
professional profile. It does not create accounts, save profiles, check Cafe presence, or recommend people.

## Run

```bash
npm install
npm run dev          # http://localhost:4313
```

Use OTP `424242`. Refreshing the page clears the draft.

Exa needs `EXA_API_KEY`. The app may use `SESSION_SIGNING_SECRET`; a development-only secret is
used when it is absent outside production.
Copy the Exa app's `.env.local.example` to `.env.local` as needed. Missing provider keys intentionally
open a manual fallback.

## Verify

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

`npm run test:live` is opt-in and only runs live-provider smoke tests when the required keys are
configured. Never put real personal information into these internal prototypes.
