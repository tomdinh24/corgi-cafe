# Corgi Community Activation — Product Framing Phase

## Summary

Before writing a PRD, create a problem brief that establishes:

- Business goal: make Corgi a resource builders repeatedly use throughout their journey.
- Activation objective: help an opted-in Cafe visitor have one useful, mutually welcomed conversation during the current visit.
- Core hypothesis: a useful first connection increases the visitor’s perceived value of Corgi and likelihood of engaging again.
- Boundary: define the product problem and functional journey first; defer screens, architecture, matching algorithms, and integrations.

## Product Definition

- Primary user: a returning Cafe visitor who is new to the standalone app, physically present, actively wants to connect, and has a specific professional need.
- Primary scenario: a founder seeking advice about a current startup challenge.
- Problem statement: during an unstructured Cafe visit, the visitor cannot confidently determine who is relevant, who is open to talking, or how to establish mutual consent, leaving useful conversations to chance.
- Entry point: immediately after ordering through a universal physical prompt such as a receipt, counter sign, or table QR. This is a timing decision, not an ordering-system integration.
- Connection definition: one visitor requests a connection, the other explicitly accepts, they meet in person, and the initiating visitor reports that the conversation was useful.
- Demo supply: use synthetic personas representing strong matches, weak matches, unavailable visitors, and different connection goals.

## Scope and Journey

In scope:

1. Discover the connection opportunity while at the Cafe.
2. Explicitly opt in for the current visit.
3. State a current need and what the visitor can offer others.
4. Understand which present, receptive people may be relevant and why.
5. Request a connection.
6. Receive mutual acceptance or a pressure-free decline.
7. Meet in person with enough shared context to begin.
8. Confirm whether the conversation occurred and was useful.

Out of scope:

- Ordering, payments, loyalty points, and drink personalization.
- Reusing or rebuilding the existing Cafe account.
- Inferring social intent from orders, timestamps, or drink preferences.
- Event discovery and event-specific networking.
- Visitors who want to focus, are only open later, or do not want connections.
- Messaging, social feeds, relationship maintenance, and long-term networking.
- Solving real network cold-start in the demo; retain it as a real-world product risk.

Public evidence should be recorded carefully: Corgi says it already hosts frequent events and values curated 1:1 connections, while visitor feedback more clearly validates the workspace and accidental encounters than an unmet connection-discovery need. Brand confusion and trust concerns should be captured as guardrails, not ignored. Sources include [Corgi’s community announcement](https://www.linkedin.com/posts/brookeleblanc_at-corgi-we-host-events-every-single-day-activity-7443766242915745797-KUqv), its [public event calendar](https://luma.com/usecorgi), [visitor feedback](https://restaurantguru.com/Corgi-Cafe-San-Francisco), and [independent coverage](https://sf.gazetteer.co/come-for-the-all-night-coffee-stay-for-the-ai-insurance).

## Deliverables and PRD Gate

- Preserve the supplied brief as `docs/reference/corgi-community-context.md`, clearly labeled as source context rather than an approved specification.
- Create `docs/product/community-activation-problem-brief.md` containing the objective hierarchy, segmentation, current journey, target journey, evidence, assumptions, scope, metrics, and synthetic primary scenario.
- Draft the PRD only after the problem brief clearly distinguishes:
  - What public evidence supports.
  - What remains inferred.
  - Whether relevance discovery, social permission, or conversation initiation is the dominant friction.
  - Why purposeful founder advice is the primary job, with exploratory connection retained as a secondary hypothesis.

No API, schema, or technical architecture decisions will be made in this phase.

## Success and Validation Scenarios

- Primary metric: percentage of opted-in visitors who complete a mutually accepted connection and report a useful conversation during the same visit.
- Secondary funnel: entry seen → opt-in → need expressed → relevant person evaluated → request → acceptance → met → useful.
- Longer-term hypothesis metric: return visit or another Corgi community action within 30 days; this is not the initial activation metric.
- Guardrails: unwanted approaches, excessive declines, irrelevant recommendations, privacy concerns, misleading presence, and pressure placed on focused visitors.
- Demo scenarios:
  - Strong founder-advice match accepts and leads to a useful conversation.
  - Recipient declines or does not respond without social exposure.
  - Focused or unavailable members never appear as approachable.
  - No credible match produces an honest empty state.
  - An exploratory visitor demonstrates the secondary hypothesis without expanding the primary journey.

## Assumptions

- Initial context is the SF flagship Cafe during an everyday, non-event visit.
- All personas and presence states are synthetic for the demo.
- The connection experience is standalone and does not access existing customer data.
- Online research is directional rather than representative user validation.
- The standing Product Lead review should be rerun before the PRD once its expired Claude OAuth session is restored.
