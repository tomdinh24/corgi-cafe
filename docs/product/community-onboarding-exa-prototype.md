# Corgi Cafe introductions prototype

- **Status:** Canonical internal prototype
- **Date:** August 16, 2026
- **Owners:** Design Lead, Engineering Manager, and Product Lead
- **Production provider decision:** None

## Purpose

The prototype lets a Cafe member verify a local session, identify or manually create a professional profile, review every detail, and explicitly choose what conversation is welcome today. It ends before matching. It does not create accounts, save profiles, confirm Cafe presence, find other people, rank people, or display a recommendation.

The implementation retains the recovered profile-search adapter internally. No provider or variation appears in metadata, navigation, progress, controls, errors, or terminal states. A provider choice is not approved by this prototype.

## Canonical routes and experience

The Next.js app serves:

- `/`: the canonical Corgi landing page, including the in-Cafe invitation, three-step mechanism, example introduction, ground rules, and direct `Start an intro` link;
- `/start`: onboarding beginning directly at email.

The five visible phases are **Sign in**, **About you**, **Profile**, **Today**, and **Review**. The accessible progressbar reports the current actionable screen out of 16. The implementation uses these named flow states:

```text
account.email → account.otp
→ identity.firstName → identity.lastName → identity.location
→ identity.company → identity.role
→ profile.lookup → profile.candidates
→ profile.publicLinks → profile.review
→ path.choose
→ connect.topics → connect.boundaries → connect.availability
→ connect.review → ready
                 ↘ community.complete
                 ↘ later.complete
```

Manual entry, unavailable search, no result, and `None of these` all route to `profile.publicLinks`, then the same editable profile review. The former standalone `Before we look` screen no longer exists. Point-of-action transparency and the manual choice live on the single profile lookup screen.

## Candidate and public-link boundaries

- Search uses only the verified member’s name, broad location, company or project, and role.
- Candidate results are unconfirmed until the member explicitly selects one. The interface initially renders no more than three and never preselects a candidate.
- A selected non-LinkedIn candidate routes to four optional member-provided link fields before profile review: LinkedIn, personal or company website, GitHub, and other social media. All four may remain blank.
- When the selected candidate is a LinkedIn identifier, the prototype retains that identifier as `found_on_source`, `identifier_only`, and `not_fetched`; it hides the next-step LinkedIn input while retaining the other three optional member-provided fields. The provider-found identifier is reviewable and removable, but not editable as a member-provided value.
- Member-provided values stay in React memory and are editable or removable during profile review.
- The public-link screen performs local URL normalization and validation only. It does not retrieve, summarize, enrich, retain, or submit a link to an external service.
- LinkedIn is always `identifier_only` with `retrievalStatus: not_fetched`. Corgi never fetches a LinkedIn page and never attributes role, company, location, or other facts to LinkedIn. A LinkedIn URL in a website or social field is rejected; member-entered LinkedIn remains `member_provided`, while the selected-candidate exception is visibly `found_on_source`.
- Non-LinkedIn links remain `member_provided` and display `Added by you`. No new production enrichment contract is implied.
- Imported non-LinkedIn fields remain editable and source-labelled until `Confirm profile`.

## Permission and terminal boundaries

Suggested discussion topics may begin selected for review. Conversation categories, availability, visibility, expiry, and notifications do not. Sales, recruiting or hiring, and fundraising begin off and require explicit selection.

`Start introductions` ends at a truthful ready screen that says the prototype has not searched for, ranked, or shown anyone. Community-interest and maybe-later branches state that nothing was submitted or saved. No branch grants community access, visibility, contact permission, or a commercial outcome.

## Run and validate

See the workspace [README](../../prototypes/community-onboarding-clickthroughs/README.md). The canonical local URL is `http://localhost:4313`; automated browser tests use isolated port `4413` so they do not reuse a separately managed preview.

Required checks are:

```text
npm run lint
npm test
npm run build
npm run test:e2e
```

The local OTP fixture is documented for evaluators in the workspace README and is not rendered in public UI copy.

### August 16, 2026 implementation review

The implementation was reviewed live with `chrome-devtools-axi` on isolated port `4413`. Accessibility snapshots confirmed the landing and onboarding landmark, heading, form, label, and progress semantics. Lighthouse scored 100 for accessibility, best practices, SEO, and agentic browsing on both `/` and `/start`. Automated browser checks covered 320, 390, 480, 768, 1024, and 1440 CSS pixels, 200% zoom, reduced motion, forced colors, keyboard submission, focus styling, and horizontal overflow.

The browser tool reported successful screenshot exports but did not materialize the files in the worktree. This was treated as an artifact-export defect, not a product result. No alternate browser client was used; the live DOM, accessibility-tree, Lighthouse, computed-style, and responsive evidence above formed the visual review record.

## Production gate

The recovered search adapter and any future public-link processing remain non-production. Privacy, legal, procurement, provider selection, retention, deletion, correction, and operational ownership require separate approval. LinkedIn page retrieval remains outside that decision.
