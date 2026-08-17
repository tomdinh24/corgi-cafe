# Corgi Centralized Onboarding and Profile Enrichment

## Product and Engineering Proposal

**Status:** Ready for human product and legal review  
**Audience:** Corgi Cafe Tech Ops, Product, Design, Engineering, and Legal  
**Date researched:** August 15, 2026  
**Owners:** Standing Engineering Manager and Product Lead  
**Historical provider candidate:** Crustdata, per earlier human product direction
**Production decision:** No vendor or architecture approved

---

> **Status update, August 16, 2026:** This document preserves historical research and does not
> describe the canonical executable experience or approve a provider, production architecture, or
> public-link processing. The canonical prototype retains a recovered search adapter internally,
> has a member-confirmed manual fallback, and is provider-neutral in public presentation. Its
> current privacy, LinkedIn identifier-only, public-link validation, and terminal boundaries are
> owned by [community-onboarding-exa-prototype.md](community-onboarding-exa-prototype.md).

## 1. Recommendation

Use one centralized Corgi account and a progressive, user-confirmed profile flow:

```text
Email → one-time passcode → name → location
→ Crustdata candidate selection or LinkedIn URL fallback
→ optional additional URL → editable profile confirmation
→ choose the next Corgi path
→ review suggested current intent → recommendations
```

Use Crustdata as the first search candidate in a shadow experiment. Search by exact full name and broad location, show at most three candidates, and enrich only after the user confirms one. Never treat an API result as verified identity or allow inferred background to create interaction permission.

The recommendation is **go for a manual baseline and a 100-person Crustdata shadow test; no-go for production until contractual data provenance, privacy notice, deletion behavior, and dollar pricing receive explicit review**.

## 2. Product goals

- Avoid a long resume-style onboarding form.
- Establish enough credible professional context for a useful introduction.
- Give the member control over every externally sourced claim.
- Reuse durable context across Cafe visits and future Corgi community participation.
- Keep today's intent, availability, boundaries, and visibility explicitly separate.
- Learn whether enrichment improves completion and match usefulness enough to justify cost and trust risk.

## 3. Experience contract

### Stage 1: Enter email

Collect an email address, including a Gmail address. This flow uses email verification rather than
Google OAuth; a later Google sign-in option should replace, not duplicate, the OTP step.

Show the applicable privacy disclosure before any production people lookup. No matching,
availability, directory visibility, or private-community permission exists at this stage.

### Stage 2: Verify with a one-time passcode

Send a short-lived passcode to the submitted email. Support resend, address correction, expiry,
attempt limits, and abuse throttling. Do not call Crustdata until verification succeeds.

### Stage 3: Enter first name

Collect the member's first name as they want it displayed.

### Stage 4: Enter last name

Collect the member's last name for candidate search. The product may later let the member choose a
less specific public display name, but matching identity must remain distinct from display settings.

### Stage 5: Enter location

Collect a broad city or metro area. Explain that this supports profile disambiguation and does not
enable background location tracking or exact-seat visibility.

### Stage 6: Select a Crustdata candidate or provide LinkedIn

Call Crustdata's indexed person search using exact name and broad location and request no more than
three lightweight results. When credible candidates exist, show source-attributed cards with:

- name;
- current role and company;
- broad location;
- relevant public professional URL;
- retrieved date;
- source/provider label; and
- actions: `This is me` and `None of these`.

A candidate is credible enough to display only when the normalized full name matches and the broad
location or another member-provided discriminator corroborates it. Corgi never auto-selects a
candidate, even when only one result is returned.

If search confidence is low, results conflict, or the member chooses `None of these`, ask for their
LinkedIn URL. A user-provided URL is a lookup identifier, not permission to scrape LinkedIn. If the
URL path still fails or the member cannot provide one, continue to the short manual profile rather
than blocking activation.

An unconfirmed candidate is ephemeral and cannot become profile truth, matching context,
introduction copy, community-vetting evidence, or a basis for contact.

### Stage 7: Add an optional enrichment URL

Offer one optional field for a personal website, company website, portfolio, GitHub profile, or
another relevant professional source. Label why it helps and allow the member to skip it. Do not
request personal email, phone, contact graph, or social posts for this product need.

Use the URL for automated enrichment only when an approved provider explicitly supports that source
and Corgi is contractually allowed to process it. Otherwise retain it as member-provided context for
confirmation or route it to a separately approved extraction path; do not imply that Crustdata
enriches every URL type.

### Stage 8: Build and confirm the profile

After candidate selection, request Crustdata's base enrichment and combine it with any supported
member-provided URLs. Show one editable, source-attributed profile containing only the information
needed for recommendations. The member must confirm or correct it before any imported field becomes
durable.

When enrichment fails, build the same confirmation card from a short manual flow covering:

- current role or professional context;
- functional area or investor/founder/operator type;
- company, project, or professional focus;
- stage where relevant; and
- topics the member knows well or can help with.

Retain provenance and confirmation status per field. Enrichment failure must not block same-visit
activation.

### Stage 9: Choose a Corgi path

After profile confirmation, show three choices:

1. **Connect at Corgi now** — continue into current intent and an explicit visit session.
2. **Record private-community interest** — store interest and use a placeholder until a future application URL exists. Do not imply approval, membership, discoverability, or contact permission.
3. **Maybe later** — save the centralized profile and exit without creating a live session or community visibility.

### Stage 10: Review inferred current intent

For `Connect at Corgi now`, infer a small set of likely conversation intents from the confirmed
profile and present them as editable, initially selected suggestions. The member can deselect wrong
suggestions, add a missing intent, and then choose `Confirm today's intent`.

This review action converts the final selections into explicit current intent; the inference itself
does not create permission. Never preselect sales, recruiting, fundraising, investor-founder,
customer/design-partner, or partnership permission. Those categories remain off until the member
explicitly enables them.

The same screen or a short following screen must confirm:

- what the member wants to discuss;
- what they can offer;
- open now, open later, or strong matches only;
- prohibited interaction categories;
- visibility and notification permission; and
- session expiration.

Offer optional text chat only to clarify missing context or refine intent. Exclude voice.

### Stage 11: Recommend or wait

After the member explicitly starts the session, evaluate only present, mutually eligible people. If
a credible match exists, deliver the explained recommendation to both people at approximately the
same time. Otherwise show an honest waiting state, the session expiry, and options to adjust intent
or end the session.

## 4. Information boundaries

### Durable background

Stable, reusable member facts:

- identity basics;
- confirmed role and functional context;
- confirmed company, project, and stage;
- confirmed domain and experience tags;
- contribution topics; and
- source, retrieval date, and confirmation state for every imported claim.

### Inferred context

Corgi may suggest:

- role or persona classification;
- industry, domain, or expertise tags;
- company or project stage;
- possible ask-to-offer fit;
- shared problems; and
- potential conversation categories.

Inferences must be explainable, editable, and visually different from confirmed facts. They may help suggest relevance but cannot create availability, openness, private-community membership, or commercial permission.

For the connect-now flow, intent suggestions may render as initially selected to reduce effort only
when the interface requires a deliberate final confirmation. Suggested sales, recruiting,
fundraising, investor-founder, customer/design-partner, and partnership categories always render
off.

### Explicit current intent

What the member wants during this visit:

- current goal;
- asks and offers;
- usefulness criterion;
- desired conversation types; and
- time sensitivity.

### Permission

What Corgi is allowed to do:

- selected activation branch;
- current availability and expiration;
- visibility audience;
- permitted and prohibited interaction categories;
- notification permission; and
- any later, separate private-community visibility or contact permission.

Permission must never be inferred from a profile, job title, investor status, order, loyalty behavior, visit frequency, or timestamp.

## 5. Provider evaluation

### Crustdata — selected experiment candidate

Crustdata's indexed [`/person/search`](https://docs.crustdata.com/person-docs/search/introduction) supports name, company, title, location, and other filters and costs `0.03` credits per result returned. Its base [`/person/enrich`](https://docs.crustdata.com/general/pricing) costs `1` credit after a professional-network URL or business-email identifier is known. Default documented throughput is approximately `15 requests/minute`, subject to endpoint and plan. [Crustdata rate limits](https://docs.crustdata.com/general/rate-limits)

Why it fits the experiment:

- search-first flow can present candidate choices before paying for full enrichment;
- structured people results align with a confirmation card;
- base enrichment includes professional background without needing contact-data add-ons; and
- search and enrich have versioned REST interfaces.

Important constraints:

- exact-name examples can return multiple people, so name plus location is not identity verification;
- public documentation prices endpoints in credits but does not publish a current dollar-per-credit amount;
- live professional-network people endpoints are plan-gated and materially more expensive;
- credits expire after six months according to current documentation; and
- contractual support for Corgi's member-facing use and professional-network data provenance must be confirmed.

### People Data Labs — pricing benchmark

People Data Labs can enrich using a name plus location and charges per successful match. Public self-serve pricing currently includes up to `100` monthly records free and starts at `$98/month` for `350` person records. Its own documentation warns that name-plus-location requests rarely score above `4`, while high-accuracy use cases should generally require a likelihood of at least `6`. [PDL pricing](https://www.peopledatalabs.com/pricing/person), [PDL enrichment inputs](https://docs.peopledatalabs.com/docs/input-parameters-person-enrichment-api)

PDL remains a useful benchmark, but it is not the selected primary candidate.

### Apollo — sales-oriented benchmark only

Apollo's person enrichment uses `1–9` credits per person and is more likely to match when company domain, email, or profile URL is present. Public plans are framed for internal business use; Apollo states that powering an external customer product requires separate terms and custom pricing. [Apollo enrichment](https://docs.apollo.io/reference/people-enrichment), [Apollo API credits](https://docs.apollo.io/docs/api-pricing), [Apollo pricing and external-use note](https://www.apollo.io/pricing?solution=enrichment)

Apollo is not recommended for Corgi's initial member-facing experiment.

## 6. Crustdata credit model

Crustdata does not expose the current dollar price of a credit in its public documentation. The model therefore reports credits and provides a formula for converting an actual quote into dollars.

### Illustrative assumptions

These are planning assumptions, not Crustdata performance claims:

- primary search runs for every onboarding attempt;
- search returns an average of `1.8` candidates, capped at three;
- `45%` of attempts confirm a primary-search candidate;
- of the remaining `55%`, `60%` provide a company, URL, or business-email fallback;
- `70%` of fallback attempts confirm a person;
- total confirmed-profile rate is `68.1%`;
- base enrichment runs only after confirmation; and
- no contact-data or live-search add-ons are used.

| Monthly attempts | Search credits | Base-enrich credits | Total credits | Confirmed profiles | Credits per confirmed profile |
|---:|---:|---:|---:|---:|---:|
| 100 | 6.39 | 68.1 | 74.49 | 68 | 1.09 |
| 1,000 | 63.9 | 681 | 744.9 | 681 | 1.09 |
| 10,000 | 639 | 6,810 | 7,449 | 6,810 | 1.09 |

Dollar conversion after receiving a quote:

```text
monthly USD = total credits × contracted USD per credit + plan minimum
USD per confirmed profile = monthly USD ÷ confirmed profiles
```

Do not use live professional-network search in the first experiment. At the currently documented `2 credits/profile`, a fallback that requests two live profiles for `10%` of attempts would add `0.4 credits` per onboarding attempt before any base enrichment, while remaining plan-gated.

## 7. Privacy and platform constraints

Tom's requested product default is to place lookup disclosure in the privacy policy rather than add a separate consent step. Treat that as a product assumption—not a legal conclusion.

Before production, Legal must determine:

- whether policy acknowledgement is sufficiently prominent and specific;
- the permitted purpose and contractual provenance of Crustdata professional-network data;
- whether a separate affirmative action is required;
- retention and deletion obligations;
- whether Corgi or its provider has applicable California data-broker obligations; and
- how members exercise access, correction, deletion, and opt-out rights.

LinkedIn's API terms prohibit storing or displaying LinkedIn content obtained by scraping directly or indirectly through third parties and require affirmative member consent for official authenticated access in applicable cases. A user-provided LinkedIn URL can be treated as a lookup identifier only after Legal confirms the selected provider and contract; it does not authorize Corgi to scrape the page or say LinkedIn verified the result. [LinkedIn API Terms](https://www.linkedin.com/legal/l/api-terms-of-use), [LinkedIn crawling terms](https://www.linkedin.com/legal/crawling-terms)

California's regulator describes access, correction, deletion, and opt-out expectations and began operating the DROP deletion platform in 2026. Applicability to Corgi requires counsel rather than assumption. [California privacy rights](https://oag.ca.gov/privacy/ccpa), [CPPA data-broker guidance](https://cppa.ca.gov/data_brokers/)

### Proposed data handling

- Keep candidate payloads ephemeral until confirmation.
- Delete unconfirmed payloads within 24 hours unless Legal approves a different debugging window.
- Retain only confirmed fields needed for the Corgi experience.
- Store provider, source identifier, retrieval date, confirmation status, and user edits per field.
- Provide correction and deletion paths before a production pilot.
- Do not request personal email, phone, connection graph, posts, or contact details for matching.
- Never use enrichment data for advertising audiences or automated commercial outreach.

## 8. Failure behavior

| Scenario | Required behavior |
|---|---|
| Incorrect email address | Let the member edit it and invalidate any prior OTP |
| Expired or incorrect OTP | Explain the state, preserve the email, and allow a bounded retry or resend |
| OTP abuse or rate limit | Apply a clear cooldown without revealing whether an unrelated account exists |
| Exact credible candidate | Show sourced summary; require confirmation |
| Multiple candidates | Show no more than three and include `None of these` |
| Weak or conflicting candidate | Ask for LinkedIn URL, then fall through to manual context |
| Wrong candidate | Discard it; do not write it to the member profile |
| No match | Continue to LinkedIn URL or short manual fallback |
| Missing location | Ask for broad metro or skip to company/URL/manual fallback |
| Sparse result | Treat member-entered fields as canonical |
| Unsupported additional URL | Keep it as member-provided context or skip it; do not claim automated enrichment |
| `429` rate limit | Bounded retry with backoff, then fail open to manual onboarding |
| Provider outage or timeout | Fail open immediately; do not block a same-visit session |
| Plan or credit exhaustion | Disable enrichment and preserve the manual path |
| User rejects imported claim | Preserve the correction, not the rejected value |
| User requests deletion | Delete durable profile and route any required provider request |

## 9. Experiment plan

### Phase 0: Manual baseline

Run a structured manual flow during selected Cafe windows. Measure completion time, form abandonment, profile usefulness, and willingness to provide company or profile URL.

### Phase 1: Crustdata shadow test

For up to 100 participants:

- run indexed search with no production profile write;
- compare candidates to the member's confirmed manual background;
- measure candidate coverage, wrong-person risk, ambiguity, latency, and modeled credit use; and
- do not call live professional-network endpoints.

### Phase 2: Assisted onboarding

Only after legal and procurement approval, show candidates to users and enrich confirmed profiles. Continue to preserve the manual path.

### Go criteria

- Crustdata contractually supports the member-facing use and satisfies provenance review.
- Total confirmed-profile rate is at least `65%` in the assisted pilot.
- Wrong-person confirmation remains below `1%`.
- User correction rate remains below `10%`.
- Enrichment materially improves completion, speed, or useful profile context over the manual baseline.
- Median latency does not materially slow same-visit onboarding.
- Contracted USD per confirmed profile is acceptable to Corgi.
- Provider failures reliably fall through to manual onboarding.

### No-go criteria

- Name and location routinely create ambiguous or socially risky results.
- The provider cannot establish acceptable professional-network data provenance.
- Policy-only disclosure is insufficient under legal review.
- Live, plan-gated endpoints are required to reach acceptable quality.
- Dollar pricing makes the confirmed-profile cost unjustifiable.
- Enrichment increases abandonment or distrust.

## 10. Metrics

- Email entry, OTP request, verification, resend, failure, and completion.
- Search attempt and candidate coverage.
- Exact, multiple, wrong, and no-match rates.
- Candidate confirmation and correction rates.
- LinkedIn-fallback completion.
- Optional additional-URL submission and skip rates.
- Manual-fallback completion.
- Time to confirmed profile.
- Credits and contracted USD per confirmed profile.
- Branch distribution: connect now, community placeholder, maybe later.
- Suggested-intent deselection, addition, and final-confirmation rates.
- Connect-now session start rate.
- Downstream eligible-match, introduction, meeting, and useful-conversation rates.
- Privacy, surprise, deletion, block, and report signals.

## 11. Acceptance scenarios

1. An email OTP must be verified before any Crustdata request occurs.
2. An exact candidate is confirmed and only the base professional context is retained.
3. Multiple candidates require user choice; none is silently selected.
4. A wrong candidate is rejected and never influences a recommendation.
5. No credible candidate leads to a LinkedIn URL request and then a short manual fallback.
6. The member can skip the additional enrichment URL and still confirm a profile.
7. A provider outage does not prevent the visitor from starting a manual in-person session.
8. Imported stage or role information remains editable and records its provenance.
9. Initially selected intent suggestions can be removed or extended before explicit confirmation.
10. Inferred fundraising need never selects or grants investor-pitch permission.
11. `Connect at Corgi now` continues into explicit session settings and then recommendation or waiting.
12. `Record private-community interest` stores interest only and shows a future-link placeholder.
13. `Maybe later` saves the profile without creating availability or visibility.

## 12. Decision required before production

Tech Ops must accept or change:

- Crustdata as the experiment provider;
- the search-first, confirm-then-enrich sequence;
- the centralized profile and three activation branches;
- the policy-disclosure assumption subject to Legal;
- the manual fallback as a permanent reliability requirement;
- the cost and accuracy thresholds; and
- the boundary excluding live search, contact data, voice, and production integration from the first experiment.
