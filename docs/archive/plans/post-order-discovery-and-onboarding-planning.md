# Post-Order Discovery and Onboarding Planning

## Summary

Create two coordinated product workstreams:

1. A marketing-led, Design Lead-built HTML landing-page prototype for post-order discovery.
2. An Engineering Manager/Product Lead proposal for low-friction profile enrichment and centralized Corgi onboarding.

Before Task 1 begins, establish a persistent Marketing Lead through a separate AI-OS workspace because the current leadership runtime does not support that role.

## Task 1 — Post-Order Landing Page

- Marketing Lead owns positioning, conversion narrative, final copy, CTA language, trust messaging, and one testable messaging alternative.
- Design Lead converts that work into a responsive HTML/CSS/JS prototype using `docs/DESIGN_SYSTEM.md`; Product Lead reviews product accuracy.
- Keep the primary promise focused on meeting someone relevant at Corgi today. Mention broader community access as secondary value.
- Include the hero, how it works, relevant-person examples, focus and permission controls, anti-pitch trust language, honest no-match expectations, and primary onboarding CTA.
- Mock the CTA handoff without implementing signup or onboarding.
- Define analytics for landing view, primary CTA, signup start, and major content engagement.
- Deliver the prototype under `prototypes/community-activation-landing/` with a written copy and component handoff in `docs/product/`.
- Validate at mobile, tablet, and desktop widths; keyboard navigation; 200% zoom; reduced motion; accessible contrast; and no unauthorized proprietary assets.

## Task 2 — Enrichment and Centralized Onboarding Proposal

- Engineering Manager researches technical feasibility, providers, current pricing, latency, coverage, data quality, privacy, LinkedIn/platform constraints, and failure modes using official sources.
- Product Lead defines the minimum information needed for credible recommendations and jointly produces the final approach.
- Evaluate this progressive enrichment ladder:
  1. Sign up and collect first name, last name, and location.
  2. Automatically resolve a likely professional profile.
  3. Show source-attributed, editable background information for confirmation.
  4. If ambiguous or unsuccessful, request a LinkedIn, personal, or company URL.
  5. Fall back to a short structured manual flow.
- Treat privacy-policy disclosure as the requested default, but make legal and platform-policy sufficiency a go/no-go criterion. Do not recommend unauthorized scraping.
- Compare costs at 100, 1,000, and 10,000 monthly onboarding attempts, including cost per successfully confirmed profile.
- Keep durable background, inferred context, and explicit current intent separate. Inferred needs may generate suggestions but never grant interaction permission.
- Use structured choices and editable cards by default. Offer optional text chat only for missing context or intent refinement; exclude voice.
- After enrichment, present three provisional branches:
  - Connect with people at Corgi now.
  - Join the private Corgi community.
  - Continue later.
- The private-community branch remains a placeholder for a future URL; this task does not define vetting or membership operations.
- The in-person branch proceeds to current discussion intent, availability, boundaries, and matching. “Continue later” preserves the centralized profile and exits.
- Deliver a provider decision matrix, recommended approach, conceptual profile/intent contract, fallback behavior, cost model, privacy risks, experiment design, and explicit go/no-go recommendation.

## Validation and Coordination

- Test enrichment against exact match, multiple candidates, incorrect match, no match, missing location, sparse profile, provider outage, rate limit, and unaffordable-cost scenarios.
- Measure lookup coverage, confirmation accuracy, correction rate, time to confirmed profile, manual-fallback completion, cost per confirmed profile, and conversion into each post-enrichment branch.
- Run Task 1 and Task 2 concurrently after the Marketing Lead exists. Product Lead reconciles their shared terminology and CTA-to-onboarding handoff.
- Require human acceptance of both outputs before designing the complete onboarding experience or selecting a production architecture/vendor.

## Assumptions

- One centralized Corgi profile supports both in-person activation and future private-community participation.
- Visit intent is asked after signup and enrichment.
- Automatic professional-profile search is the first enrichment experiment.
- The landing deliverable is a standalone visual HTML prototype, not production code.
- The private-community URL, application, and vetting flow remain outside this phase.
