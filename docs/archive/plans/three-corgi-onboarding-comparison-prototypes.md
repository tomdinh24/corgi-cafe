# Three Corgi Onboarding Comparison Prototypes

## Summary

Build three independently runnable, mobile-first onboarding prototypes that differ only in how professional background is gathered:

1. **Manual:** structured entry with no enrichment.
2. **AI Web:** structured entry plus targeted AI and OpenAI web search.
3. **Exa:** structured entry plus Exa source discovery and AI extraction.

All three use the same Corgi visual system, consumer-friendly writing, simulated OTP, profile confirmation, activation choices, intent review, permissions, and final `Ready for recommendations` state. Matching and recommendation UI remain out of scope.

Design Lead owns UX, interaction design, and final copy. Engineering Manager owns implementation and live integrations. Product Lead reviews journey consistency before acceptance.

## Experience and Writing

### Shared journey

1. `Set up your intro session`
2. Enter email.
3. Enter simulated OTP `424242`.
4. Enter first name, last name, and broad location.
5. See a disclosure before any live lookup.
6. Complete the variation-specific background flow.
7. Review, edit, remove, and confirm every profile field.
8. Choose:

   - `Connect at Corgi now`
   - `Record community interest`
   - `Maybe later`

9. For connect-now, review suggested conversation intents.
10. Enter what would be useful and what the member can offer.
11. Set availability, boundaries, visibility, notifications, and expiration.
12. Review the session summary.
13. Select `Start intro session`.
14. End at `Ready for recommendations` without showing matches.

Community-interest and maybe-later branches end in truthful prototype-only states and explicitly say nothing was saved.

### Variation-specific background creation

- **Manual:** Ask what the member is working on, company/project context, functional area, stage when relevant, focus areas, and topics they can help with. Source label: `Entered by you`.
- **AI Web:** Let the member choose public-web search, an approved URL, or manual entry. OpenAI may ask one targeted clarification, return up to three candidate/source options, and create editable sourced fields.
- **Exa:** Search using name, location, and optional company/project. Show up to three allowed source pages, let the member choose which are theirs, then extract a profile from selected sources.

Every imported field displays `Entered by you`, `Found on <source>`, `Suggested by Corgi`, or `Edited by you`. Nothing unconfirmed is used downstream.

### Brand writing

Create `docs/BRAND_WRITING.md` before final screen copy and make it authoritative for public Cafe/community writing:

- Warm, local, direct, builder-literate, and low-pressure.
- One clear idea per screen.
- Short CTAs without helper disclaimers beneath buttons.
- Prefer “what you’re working on” over “current intent.”
- Prefer “open to meeting” over “mutually eligible.”
- Avoid SaaS language, networking jargon, hype, exclusivity, stacked qualifiers, and em dashes.
- Preserve trust language around sources, uncertainty, commercial boundaries, and no guaranteed recommendation.

## Implementation

### Application structure

Create one npm workspace containing three separate Next.js 16.3.1 applications and one neutral shared package:

```text
prototypes/community-onboarding-clickthroughs/
  apps/
    onboarding-manual/
    onboarding-ai-web/
    onboarding-exa/
  packages/
    corgi-onboarding-shared/
```

Each app has independent routes, server handlers, environment configuration, tests, and provider logic. Only tokens, schemas, source filtering, neutral form primitives, and synthetic fixtures are shared.

Run independently on:

- Manual: `localhost:4311`
- AI Web: `localhost:4312`
- Exa: `localhost:4313`

Provide `dev:manual`, `dev:ai-web`, `dev:exa`, `dev:all`, `build`, `test`, and `lint` npm scripts. Preserve the existing landing prototype unchanged.

### Shared interfaces

Define and validate with Zod:

- `OnboardingInput`: identity, location, seed work context, URLs, and optional free text.
- `SourceEvidence`: URL, host, source type, retrieval status, whether facts may be extracted, and blocked reason.
- `ProfileDraft`: editable role, company/project, location, focus areas, contribution topics, suggested intents, evidence, and confirmation state.
- `EnrichmentResponse`: `draft_ready`, `manual_only`, `missing_key`, `timed_out`, or `error`.
- `SessionSummary`: confirmed profile, explicit intent, offer, permissions, and expiration.

Keep drafts in client memory. Use a signed, HTTP-only, 30-minute cookie only for the simulated OTP state. Refreshing resets the onboarding draft. Do not create accounts, a database, or durable profiles.

### Live provider behavior

- **Manual:** No external calls.
- **AI Web:** Use `gpt-5.4-nano` through the Responses API, with at most two model/web-search calls per session. The first discovers sources and optionally returns one clarification; the second produces the sourced profile and intent suggestions.
- **Exa:** Use `POST /search` with a maximum of two searches, display no more than three usable sources, fetch contents from at most four selected pages, then use one OpenAI extraction call.

Provider keys remain server-side:

```text
OPENAI_API_KEY
EXA_API_KEY
SESSION_SIGNING_SECRET
```

Missing provider keys produce a branded unavailable state and manual fallback rather than crashing. Variation C cannot pass live acceptance until a self-serve Exa key is supplied.

### Security and provider boundaries

- Show a visible disclosure and require user action before live lookup.
- Never log names, emails, URLs, free text, source contents, or profile drafts.
- Treat fetched webpages as untrusted data and ignore embedded instructions.
- Require schema-constrained extraction and source attribution.
- Never let AI set availability, visibility, commercial permissions, or session activation.
- LinkedIn URLs are unverified identifiers only.
- OpenAI and Exa must never fetch, summarize, or extract LinkedIn pages.
- Filter `linkedin.com`, regional subdomains, and `lnkd.in` before contents requests.
- If only LinkedIn results exist, request manual confirmation instead of extracting facts.
- Use 12-second route timeouts, one retry for `429/5xx`, bounded provider calls, and manual fallback.

## Validation

### Functional scenarios

- All three apps complete the connect-now journey and reach `Ready for recommendations`.
- Community-interest and maybe-later branches do not imply persistence or membership.
- A wrong imported fact can be edited or removed.
- Ambiguous, empty, slow, and failed searches recover through manual entry.
- Missing OpenAI or Exa credentials do not break the application.
- No app renders a match, ranked person, or recommendation card.
- No unconfirmed fact reaches the final session summary.
- Commercial permissions begin off and cannot be AI-selected.
- LinkedIn results are never fetched or treated as evidence.

### Automated and experience testing

- Unit tests cover schemas, redaction, source filtering, budget limits, and hostile webpage instructions.
- API tests mock OpenAI and Exa, including timeouts, malformed output, rate limits, and missing keys.
- Playwright covers every primary path and secondary branch in each independent app.
- Run an opt-in live smoke test for AI Web and Exa after credentials are configured.
- Validate keyboard operation, screen-reader labels, focus management, reduced motion, 200% zoom, and widths of 320, 768, and 1440 pixels.
- Verify keys never enter browser bundles and logs contain no raw personal information.

Capture local, non-identifying comparison events for step completion, duration, provider outcome, source rejection, field correction, intent correction, and terminal completion. Store no input values.

## Assumptions and Gates

- These are internal evaluation prototypes, not a public pilot.
- Email delivery, authentication, persistence, member presence, matching, and recommendations are simulated or excluded.
- User-entered information drives the experience; no persona-specific script is hardcoded.
- The existing `OPENAI_API_KEY` is available.
- The user will provide a self-serve `EXA_API_KEY` before live acceptance of Variation C.
- Exa costs approximately $7 per 1,000 searches and currently includes free signup/monthly credits, but production use still requires privacy and provider review. [Exa pricing](https://exa.ai/pricing?tab=api)
- Real-user testing beyond the owner’s internal evaluation requires approval of the disclosure, provider-use, privacy, and deletion posture.
- Design and Engineering review each completed variation together; Product Lead performs the final cross-variation consistency review.
