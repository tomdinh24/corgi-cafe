# Corgi Community Activation

## MVP Product Specification

**Status:** Draft for human product acceptance  
**Audience:** Corgi Cafe Tech Ops  
**Date:** August 15, 2026  
**Phase:** Product definition with post-order discovery prototype; production architecture follows acceptance  
**Depends on:** [Community activation problem brief](./community-activation-problem-brief.md)  
**Product review:** Standing Product Lead approved for human product acceptance

**Related work:** [Landing-page handoff](./post-order-discovery-landing-page-handoff.md) · [Canonical onboarding prototype](./community-onboarding-exa-prototype.md) · [Onboarding enrichment proposal](./onboarding-enrichment-proposal.md)

---

## 1. Product summary

> Corgi helps a visitor who is open to meeting someone during their Cafe visit discover and talk with a relevant, receptive community member. It acts like a thoughtful host: understanding both people, confirming their current openness, explaining the fit, and facilitating an immediate in-person introduction.

The first release is a real-time activation layer for everyday Cafe visits, not a professional directory or networking inbox. A durable member profile may later support the broader Corgi community, while availability and introduction permission remain explicit and time-bounded.

## 2. Product objective

Increase the share of opted-in Cafe visits that result in a relevant, useful, in-person conversation during the same visit.

The product should help a member meet someone they probably would not have approached otherwise without making the Cafe feel transactional, interruptive, or dominated by sales, recruiting, and fundraising pitches.

## 3. Core product contract

> When two present members explicitly opt into compatible introduction sessions, Corgi may recommend them to one another without a LinkedIn-style connection request. Corgi must explain why, help them begin naturally, and let either person skip, delay, pause, block, or report at any time.

Product rules:

1. Inference can improve relevance; it cannot create permission.
2. Eligibility and boundaries are resolved before people are ranked.
3. An introduction is delivered to both people at approximately the same time.
4. No recommendation is better than a weak or socially risky recommendation.
5. The product optimizes for useful conversation, not connection volume.

## 4. Target audience and personas

The shared target condition is more important than the persona label:

> A Corgi visitor who is physically present, wants to meet someone during this visit, provides enough context for a credible introduction, and explicitly starts a time-bounded introduction session.

### Founder

- **Typical context:** Building a company or project at an identifiable stage and in a defined market.
- **Constructive needs:** Peer exchange, tactical advice, customer-problem learning, hiring insight, partnerships, or fundraising guidance.
- **Potential contribution:** Domain knowledge, founder experience, product insight, introductions, and support for other builders.
- **Guardrail:** Fundraising and customer conversations require the other member to permit those interaction types. Being an investor or operator does not imply openness to a pitch.

### Startup operator

- **Typical context:** Working in product, engineering, GTM, finance, talent, operations, or another startup function.
- **Constructive needs:** Functional advice, benchmarks, peers, career development, hiring insight, or role-relevant partnerships.
- **Potential contribution:** Practical playbooks, execution experience, candidate knowledge, and functional mentorship.
- **Guardrail:** Employment and recruiting conversations are eligible only when both people explicitly permit them.

### Investor

- **Typical context:** Angel, scout, investment-team member, partner, or fund manager with a defined thesis and stage focus.
- **Constructive needs:** Market learning, founder relationships, thesis-relevant conversations, co-investors, or LP relationships for fund managers.
- **Potential contribution:** Pattern recognition, company-building feedback, capital context, and relevant introductions.
- **Guardrail:** Investor presence never implies willingness to receive a pitch. Thesis, stage, conversation preference, and reciprocal value—not public prestige—determine fit.

### Opportunity-seeking member

- **Typical context:** A founder, operator, student, or independent builder temporarily open to a startup role or project.
- **Constructive needs:** Role context, advice, mentorship, portfolio feedback, referrals, or relevant opportunities.
- **Potential contribution:** Skills, domain knowledge, project support, and future community contribution.
- **Guardrail:** Opportunity seeking is a current intent, not a permanent identity. The product prevents repetitive outreach to members who are not hiring or advising.

## 5. Jobs to be done

### Functional

> When I am at Corgi and open to meeting someone, help me identify and talk with a person who is relevant to what I care about right now.

### Social

> Help us begin without either person having to guess whether an approach, pitch, or interruption is welcome.

### Emotional

> Help me feel that I belong among people who understand the ambition, uncertainty, and risk involved in building.

## 6. Ideal new-member journey

1. **Discover:** After ordering, the visitor sees a receipt, confirmation-page, pager, counter, table, or pickup-area message offering a relevant introduction during this visit.
2. **Understand:** A landing page explains the value, session-level permission, expected behavior, privacy boundary, and time commitment before signup.
3. **Enter email:** The visitor enters an email address, including Gmail, and sees the applicable privacy disclosure before any production lookup.
4. **Verify email:** The visitor enters a short-lived one-time passcode.
5. **Identify:** The visitor enters first name, last name, and broad city or metro area on focused, sequential screens.
6. **Find a profile:** The canonical prototype searches through its internal recovered adapter and asks the visitor to select an unconfirmed candidate. Unavailable search, no result, and rejected candidates preserve a manual fallback. The exact executable flow and its provider-neutral presentation are owned by the [canonical onboarding prototype](./community-onboarding-exa-prototype.md).
7. **Add context:** After candidate selection or the manual choice, the prototype offers four optional public-link fields: LinkedIn profile, personal or company website, GitHub, and other social. Links are locally normalized and validated; they are not fetched, enriched, or sent to search.
8. **Confirm the profile:** The prototype builds one editable profile for review. A candidate remains unconfirmed until the visitor explicitly selects it, and the prototype does not create or save a durable profile.
9. **Choose a path:** The visitor chooses `Connect at Corgi now`, `Record private-community interest`, or `Maybe later`. The interest choice grants no membership, visibility, or contact permission. In the prototype, neither branch submits or saves anything.
10. **Confirm current intent:** On the in-person path, Corgi presents a small set of inferred intent suggestions as selected, editable chips. The visitor deselects incorrect suggestions, adds missing ones, confirms what they can offer, and explicitly sets availability, boundaries, visibility, notifications, and session expiration. Commercial permissions always begin off.
11. **Recommend or wait:** Corgi evaluates present, mutually eligible members. It either delivers a simultaneous, explained recommendation or provides an honest waiting state with expiry and adjustment controls.
12. **Meet:** Both receive recognition context and a natural conversation opener.
13. **Learn:** Afterward, each privately confirms whether they met, whether the conversation was relevant and useful, and whether any boundary was crossed.

## 7. Returning-member journeys

### Open now

1. The returning member checks in without repeating durable onboarding.
2. They review or update today's intent and boundaries.
3. They choose a session duration.
4. Corgi introduces a strong, mutually eligible match or begins a waiting state.

### Open later

1. The member chooses when they expect to be interruptible and how long they will remain at Corgi.
2. They decide whether strong matches may notify them before that time.
3. Corgi waits until the availability condition is satisfied before facilitating a standard introduction.
4. The status expires automatically.

### Strong matches only

1. The member authorizes introductions only above a deliberately high relevance threshold.
2. Corgi stays quiet unless a match satisfies the stricter eligibility and relevance criteria.
3. Lack of a recommendation is treated as correct product behavior, not a failure to fill inventory.

### Focused or unavailable

1. The member marks themselves unavailable or does not begin a session.
2. They remain undiscoverable to connection-seeking visitors.
3. The product sends no introduction notifications.

## 8. Onboarding information model

Onboarding should be progressive: collect the minimum needed for a credible first introduction, then enrich the durable profile over time.

The canonical prototype uses an internal recovered search adapter to search member-entered name,
broad location, company or project, and role; it presents no more than three unconfirmed candidates.
Provider failure, ambiguity, or member preference leads to a short manual flow without blocking
same-visit activation. The prototype does not enrich public links: LinkedIn is identifier-only and
never fetched, while all other links are retained only in the in-memory review flow. See the
[canonical onboarding prototype](./community-onboarding-exa-prototype.md) for the executable
contract. The [onboarding enrichment proposal](./onboarding-enrichment-proposal.md) preserves
separate historical research, pricing, legal, privacy, and go/no-go material; it does not approve a
provider or public-link processing.

### Explicit durable context

- Name and appropriate identity evidence.
- Role context and functional area.
- Company, project, or professional focus.
- Company, career, or investment stage where relevant.
- Industries, technologies, and problems known well.
- Experience and topics the member is comfortable helping with.
- Provider, source identifier, retrieval date, and member-confirmation state for imported fields.

### Explicit session context

- Topics the member wants to explore today.
- What would make a conversation useful.
- What the member can contribute today.
- Permitted and prohibited interaction types.
- Availability and expiration.
- Standard or strong-match-only threshold.

### Inferred context

Corgi may derive potential shared interests, ask-to-offer fit, shared challenges, or complementary experience from explicit profile information. Inferences must be explainable, correctable, and excluded from permission decisions.

Unconfirmed search candidates are ephemeral. They cannot drive matching, introduction copy,
community eligibility, visibility, or contact.

Inferred intent may be displayed as initially selected suggestions to reduce effort. It becomes
explicit current intent only after the member reviews the set and selects `Confirm today's intent`.
Commercial interaction permissions must never be inferred or preselected.

Corgi must not infer professional intent, availability, or openness from drink orders, loyalty behavior, or historical order timestamps.

## 9. Availability and interaction controls

Availability and boundaries are separate controls.

### Availability states

- **Open now:** Eligible for an immediate introduction.
- **Open later:** Eligible after a member-selected time.
- **Strong matches only:** May be notified only for a high-confidence match.
- **Focused today:** Not eligible or visible.
- **Expired or left:** Automatically removed from current supply.

### Interaction boundaries

Members can permit or prohibit categories such as:

- Peer conversation.
- Tactical advice.
- Shared-interest exploration.
- Customer or design-partner discussion.
- Partnerships.
- Hiring or opportunity conversations.
- Fundraising guidance.
- Direct investor-founder conversation.
- Sales or vendor discussion.

The MVP should default commercial categories to off until the member explicitly permits them.

## 10. Matching and recommendation policy

### Eligibility gates

Both members must be:

- Present in the same Cafe context.
- Inside an active availability window.
- Open to the proposed interaction category.
- Visible to the applicable community audience.
- Unblocked and not otherwise restricted.
- Capable of receiving and acting on the introduction before it expires.

### Relevance signals

Eligible people may be ranked using:

- Ask-to-offer fit.
- Shared professional problem or goal.
- Complementary experience.
- Shared industry, technology, or functional interest.
- Investor thesis and company-stage fit where explicitly permitted.
- Potential value to both members.
- Member preference and prior private feedback.

### Signals that must not independently determine rank

- Drink or purchasing behavior.
- Public popularity.
- Follower counts.
- A visible prestige tier.
- Investor title without thesis and permission fit.
- A willingness to pay for preferential access.

### Recommendation explanation

Every introduction must answer:

1. Who is this person?
2. Why could this conversation be useful to both of us?
3. What topic or common ground should we start with?
4. Why is this interaction appropriate now?

## 11. Facilitated introduction behavior

The introduction should resemble a thoughtful host rather than a networking transaction.

Example:

> Meet Maya. You are both exploring developer tools, and Maya has taken two products from founder-led sales to a first GTM hire. She is open to exchanging GTM lessons now. You are both near the pickup area for the next 20 minutes.

Required controls:

- Skip this introduction.
- Remind me shortly.
- Pause introductions.
- Correct the recommendation reason.
- Block this member.
- Report inappropriate behavior.

The introduction becomes active when it is delivered; neither member must accept it before acting. If either member skips it, Corgi deactivates it for both and tells the other person only that the introduction is no longer active. It must not identify who skipped or disclose a reason. Members should approach only while the introduction is active.

The product does not create a permanent connection, follower relationship, or messaging thread as a side effect.

## 12. Empty and waiting states

When no strong match exists, Corgi should say so directly and offer bounded alternatives:

- Stay available until a selected time.
- Notify only for a strong match.
- Change today's intent or boundaries.
- Try again during a future visit.
- Separately opt into the broader Corgi community.

The empty state must not reveal unavailable members, imply that a specific person declined, or lower the relevance threshold without the member's knowledge.

## 13. Community eligibility

“The right type of person” must become a transparent community policy before launch. Initial eligibility should consider:

- Relevant founder, operator, investor, or builder context.
- Sufficient profile credibility for a safe introduction.
- Constructive intent and willingness to contribute.
- Agreement to Corgi's interaction standards.
- No unresolved safety or repeated-solicitation restrictions.

Eligibility should not be defined solely by employer prestige, fundraising history, investor status, or social reach. Verification can strengthen trust without creating a public social hierarchy.

## 14. Trust, safety, and commercial guardrails

### Hard constraints

- Never surface a focused, unavailable, expired, blocked, or invisible member.
- Never recommend an interaction category that either member prohibited.
- Never expose an inferred sensitive intent as a stated fact.
- Never imply that an introduction guarantees investment, employment, partnership, or advice.
- Always provide accessible pause, block, and report controls.

### Commercial conduct

- Unsolicited selling, recruiting, fundraising, and referral requests are not eligible introduction reasons.
- A commercial interaction becomes eligible only when both members explicitly permit the category and the recommendation has credible contextual fit.
- Repeated solicitation, misrepresented intent, or boundary violations reduce or suspend eligibility.
- Corgi optimizes for conversation quality and reciprocal respect, not commercial conversion.

## 15. Post-interaction feedback

Feedback is private by default and collected independently from both members:

- Did you meet?
- Was the recommendation relevant?
- Was the conversation useful?
- Would you welcome a similar introduction again?
- Did the interaction match the stated reason?
- Did either person cross a sales, recruiting, fundraising, or safety boundary?

Feedback may tune future recommendations and trust controls. A single skip or poor conversation should not permanently classify a member.

## 16. Growth loop

The primary product loop is:

```text
Useful introduction
→ trust in Corgi
→ return visit or community participation
→ richer explicit context and availability
→ more credible introduction supply
→ more useful introductions
```

Optional social sharing is secondary. A member may share a generic Corgi moment, but identities, companies, match reasons, and conversation details require permission from everyone identified.

## 17. MVP scope

### P0 — required

- Post-order awareness surface and educational landing page.
- Centralized Corgi signup and progressive onboarding, separate from ordering and loyalty.
- Sourced, editable candidate confirmation with URL and short manual fallbacks.
- Durable member context with field-level provenance and confirmation state.
- Three post-enrichment branches: connect now, record private-community interest, or maybe later.
- Explicit visit check-in and expiration.
- Availability, interaction boundaries, and current intent.
- Eligibility filtering and a small set of explained recommendations.
- Simultaneous facilitated introduction.
- Honest waiting and empty states.
- Skip, delay, pause, block, and report controls.
- Post-interaction meeting, relevance, usefulness, and boundary feedback.
- Synthetic members and visit states for product demonstration.

### P1 — after initial validation

- Visit-adjacent “open later” scheduling refinements.
- Saved private history of prior Corgi introductions.
- Better preference controls derived from explicit feedback.
- Private-community application, vetting, membership, and separately governed visibility controls.

### Future expansion

- Offsite discovery among explicitly discoverable members.
- AI-assisted community search and recommendation explanations.
- Warm-introduction workflows outside a shared Cafe visit.
- Slack or other community integrations with separate governance and member consent.

## 18. Out of scope

- Ordering, payments, loyalty, and drink personalization.
- Inferring social intent from purchases or visit frequency.
- A public member directory.
- Full messaging, feeds, followers, likes, and posts.
- Events, content, programs, and general resource search.
- Automatic offsite contact permission.
- Location tracking or exact seat surveillance.
- Paid ranking or preferential access to high-status members.
- Guaranteed access to investors, employers, or customers.
- Automatic or silent identity resolution from people-search results.
- Production people-search integration before provider, legal, privacy, security, and procurement approval.
- Private-community vetting, approval, directory visibility, or member-to-member contact.

## 19. Success measurement

### Primary activation metric

> Percentage of started, opted-in visit sessions that result in a facilitated introduction and a self-reported useful in-person conversation during the same visit.

For the initial evaluation, the denominator is every first-time product user who completes onboarding and starts an opted-in visit session. Sessions that are abandoned, expire, or receive no eligible match remain in the denominator so the metric preserves demand, liquidity, and coordination failures.

Report each stage independently:

```text
Awareness
→ signup
→ email verified
→ Crustdata candidate selected or fallback completed
→ profile confirmed
→ onboarding complete
→ connect-now branch selected
→ current intent confirmed
→ visit session started
→ eligible match available
→ introduction delivered
→ introduction viewed
→ members met
→ conversation useful
```

### Supporting measures

- Onboarding completion and time to active session.
- Percentage of sessions with at least one eligible match.
- Time to first credible introduction.
- Introduction view, skip, meeting, and usefulness rates.
- Recommendation relevance and explanation-correction rates.
- “Open later” notification engagement.
- Intent to use Corgi introductions again.
- Another Cafe visit or Corgi community action within 30 days.

### Guardrails

- Unwanted or ineligible introductions.
- Boundary violations and reports.
- Commercial solicitation complaints.
- Incorrect or stale presence.
- Notification mute and session-abandonment rates.
- Concentration of introductions on a small set of members.
- Unequal usefulness between the two participants.

## 20. MVP acceptance scenarios

1. An exact professional-profile candidate is shown with its source and becomes durable only after the visitor confirms it.
2. Multiple, incorrect, missing, or unavailable provider results fall through to correction, URL, or short manual onboarding without blocking the visitor.
3. `Record private-community interest` grants no membership or discoverability; `Maybe later` saves a private profile without starting a session.
4. Before any production lookup attempt, the visitor sees and acknowledges the legally approved privacy disclosure; if disclosure is insufficient or declined, manual onboarding remains available.
5. Email verification must succeed before Crustdata is called; expired, incorrect, resent, and rate-limited OTP states remain recoverable.
6. The optional enrichment URL can be skipped without preventing profile confirmation.
7. Inferred intent suggestions can begin selected, but the member can remove or add items and must explicitly confirm the final set. No commercial permission begins selected.
8. A founder seeking GTM advice and an operator offering it are both open now; Corgi introduces them simultaneously with a specific reason and opener.
9. Two founders facing a similar challenge are introduced for peer exchange even though neither claims expert status.
10. An investor open to market conversations but not pitches is never recommended for a fundraising interaction.
11. A thesis-aligned founder and investor can be introduced only when both explicitly permit the proposed investor-founder conversation.
12. A hiring operator and an opportunity-seeking member can be introduced only when both permit employment conversations.
13. A focused or expired member is invisible and receives no notification.
14. A member choosing strong matches only receives no weak recommendation.
15. No eligible match produces an honest waiting state and optional time-bounded notification.
16. Either participant can skip, pause, block, or report. A skip deactivates the introduction for both, while the other member sees only a neutral inactive state.
17. Post-interaction feedback records meeting, relevance, usefulness, and boundary outcomes separately.

## 21. Validation plan and decision gate

Before building the complete experience, Corgi should run a limited, manually facilitated pilot during selected Cafe windows.

The pilot must test:

- Whether visitors opt into an introduction session after ordering.
- Whether they provide enough context for a credible match.
- Whether enough mutually eligible people are present concurrently.
- Whether simultaneous recommendations feel welcome without per-match requests.
- Whether recommended members meet and find the conversation useful.
- Whether members experience inappropriate selling, recruiting, or fundraising.
- Whether a digital introduction outperforms or complements a staff introduction.

Proceed into experience design when Tech Ops accepts:

- The real-time, in-person wedge.
- Session-level permission instead of per-match connection requests.
- Progressive onboarding and the explicit-versus-inferred context boundary.
- The centralized profile, three activation branches, and confirm-before-import enrichment contract.
- Crustdata only as a shadow-test candidate until the proposal's legal, privacy, accuracy, and cost gates pass.
- Availability and interaction controls.
- Matching eligibility, relevance policy, and commercial guardrails.
- The primary metric and pilot learning plan.
- The expansion boundary between Cafe activation and offsite community discovery.
