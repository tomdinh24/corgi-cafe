# Corgi Community Connection — Research-Informed Product Framing

## Summary

Create a problem brief before the PRD that defines Corgi’s activation layer as:

> Help connection-seeking Corgi Cafe visitors discover and meet a relevant community member when their current needs, offers, and openness are compatible.

The business hypothesis is that useful in-person connections make Corgi a trusted resource that people return to. The initial activation outcome is one mutually accepted, useful conversation during the current Cafe visit.

“Risk-takers” or “builders” can remain the brand identity. Product personalization should use current intent, openness, and background rather than treating that broad identity as a segment.

## Personas and Intent Model

Use one shared journey across the community. Persona provides context; current intent determines personalization.

| Persona context | Common asks | Common offers and value |
|---|---|---|
| Founder | Customers/design partners, hiring, fundraising guidance, partnerships, tactical advice, founder peers | Domain expertise, product knowledge, founder lessons, introductions, opportunities |
| Startup operator | Functional advice, hiring, customers or partnerships when role-relevant, benchmarks, career development, peers | Functional playbooks, execution experience, candidate referrals, partner/vendor knowledge |
| Investor | Thesis-aligned founders, quality deal flow, co-investors, market intelligence, portfolio support; LP relationships for fund managers | Capital, feedback, pattern recognition, customer/talent introductions |
| Job-seeking state | Opportunities, insider context, mentorship, portfolio feedback, referrals, peers | Relevant skills, domain knowledge, project help and future community contribution |

Product-model refinements:

- “Operator” must include functional context such as product, engineering, GTM, finance, talent, or operations.
- “Investor” must distinguish angel, scout, investment-team member, partner, and fund manager. LP fundraising applies only to people managing or raising a fund.
- “Job seeker” should be represented as a temporary intent rather than a permanent identity; an operator, founder, or student may become open to opportunities.
- A valid match can be ask-to-offer, shared-goal, or reciprocal-value, but always requires compatible openness.
- People are the only resource in this version. Events, content, and programs remain outside scope.

Research supports recurring founder needs around capital, customers, and talent; trusted peer support for operators; quality deal flow and LP fundraising pressure for investors; and the employment value of professional weak ties. It also supports loneliness and professional isolation as real entrepreneurial problems, while showing that community fit and facilitation matter more than physical proximity alone. [Slush founder survey](https://slush.org/newsroom/slush-startup-struggle-survey-2025), [Operators Guild](https://www.operators-guild.com/about-us), [MSCI GP survey](https://www.msci.com/research-and-insights/paper/the-2025-general-partner-survey), [Stanford weak-ties research](https://www.gsb.stanford.edu/faculty-research/publications/causal-test-strength-weak-ties), [entrepreneurial loneliness research](https://onlinelibrary.wiley.com/doi/10.1111/peps.12614).

## Problem and Journey

Problem statement:

> Builders may be relatively dispersed, and even when concentrated inside Corgi Cafe, visitors cannot easily determine who is relevant, who is receptive, or whether an approach would be welcome. Potentially valuable relationships therefore depend on chance encounters or staff intervention.

Current journey:

1. Visitor orders online or in person.
2. They collect their drink and begin working.
3. Other visitors remain professionally and socially illegible.
4. The visitor relies on visual guesses, accidental conversation, an event, or staff assistance.
5. They may leave without meeting anyone relevant.

Target functional journey:

1. After ordering, the visitor encounters a QR, receipt, pager, counter, or pickup-area message explaining the connection value.
2. A standalone landing page educates them before asking for signup.
3. Onboarding captures background, current need, offers, and interaction boundaries.
4. The visitor explicitly marks themselves present and open for the current visit.
5. The activation experience presents a small number of compatible, present people with clear reasons.
6. The visitor requests a connection.
7. The recipient accepts or declines privately.
8. After acceptance, both receive enough context to meet and start the conversation.
9. The product confirms whether they met and whether it was useful.

## Scope and Product Contract

In scope:

- Everyday Cafe visits rather than scheduled events.
- First-time users of a standalone connection product, including both new and returning Cafe visitors.
- Founders, operators, investors, and people currently seeking startup opportunities.
- Explicit background, ask, offer, presence, and openness signals.
- Personalized people recommendations with understandable reasons.
- Mutual digital consent before an in-person approach.
- Synthetic personas and presence states for the demonstration.

Out of scope:

- Ordering, payments, loyalty, and drink personalization.
- Reusing or rebuilding the existing Cafe account.
- Inferring networking intent from purchases or visit timestamps.
- Events, content, programs, or a broader resource concierge.
- Full messaging, feeds, directories, and ongoing relationship management.
- Networking for visitors who are focused, unavailable, or uninterested.
- Solving real network liquidity in the demo; retain it as a deployment risk.

Conceptual product interface, without choosing a technical schema:

- `MemberContext`: role, functional area, company or project, stage, relevant experience.
- `VisitIntent`: current asks, offers, openness, interaction boundaries, and visit presence.
- `Match`: two compatible members, compatibility type, explanation, and availability.
- `Connection`: requested, accepted, declined, met, and useful outcome states.

## Validation and Test Scenarios

Primary metric:

> Percentage of opted-in visit sessions that produce a mutually accepted connection and a self-reported useful conversation during the same visit.

Supporting funnel:

`Awareness → signup → onboarding → available match viewed → request → acceptance → met → useful`

Secondary business hypothesis:

- Useful first interaction increases intent to return.
- In a real pilot, measure another Cafe visit or Corgi community action within 30 days.

Guardrails:

- Declines, blocks, reports, and unwanted approaches.
- Users shown for interaction types they did not permit.
- Excessive fundraising, recruiting, or sales solicitation.
- Misleading presence or stale availability.
- Job seekers overwhelming founders and operators.
- Low-relevance recommendations that damage trust.

Synthetic scenarios:

- A founder seeking GTM advice matches an operator explicitly offering it.
- A hiring operator matches a qualified visitor who is open to startup opportunities.
- An investor seeking AI founders matches a relevant founder who permits investor conversations.
- An investor not open to pitches is never shown for fundraising.
- Two founders with a shared challenge can connect as peers.
- Focused or unavailable visitors never appear.
- No credible candidate produces an honest empty state rather than a weak match.

## Deliverables and PRD Gate

- Preserve the supplied source as `docs/reference/corgi-community-context.md`, labeled as context rather than an approved specification.
- Create `docs/product/community-activation-problem-brief.md` containing the objective, evidence, persona-intent matrix, current journey, target journey, scope, assumptions, metrics, and synthetic scenarios.
- Draft the PRD only after the brief clearly separates researched evidence from assumptions and establishes whether relevance discovery, social permission, or conversation initiation is the dominant user friction.
- After the product definition is accepted, move sequentially into experience design and then technical architecture.
- Rerun the standing Product Lead review before the PRD once its Claude OAuth authentication is restored.
