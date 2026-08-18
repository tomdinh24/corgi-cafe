# Corgi Community Connection

## Pre-PRD Problem Brief

**Status:** Product framing for review  
**Audience:** Corgi Cafe Tech Ops  
**Date:** August 15, 2026  
**Phase:** Problem definition and activation scope; not a PRD  
**Product review:** Standing Product Lead approved the updated framing for human product acceptance

---

## 1. Executive summary

Corgi Cafe already creates the physical conditions for community: builders, founders, startup operators, investors, and people seeking startup opportunities spend time in the same place. Physical proximity alone, however, does not make the network understandable or approachable.

This brief frames the opportunity as:

> Help connection-seeking Corgi Cafe visitors discover and meet a relevant community member when their current needs, offers, and openness are compatible.

The intended user outcome is one relevant, useful, in-person conversation during the current Cafe visit. Both participants must have explicitly opted into a compatible, time-bounded introduction session before Corgi recommends them to one another. The business hypothesis is that useful encounters make Corgi feel like a trusted resource, increasing the likelihood that members return and engage with the community again.

The first product is not a professional directory, social feed, event platform, ordering replacement, or general-purpose networking app. It is an activation layer for people who are physically at Corgi and explicitly want to connect now.

This framing remains a hypothesis. Public evidence validates the underlying professional needs and the value of third places, but does not yet prove:

- how many everyday Cafe visitors want help connecting;
- which connection friction is most important;
- whether visitors will disclose useful context and availability;
- whether an app-mediated connection improves on chance encounters or staff introductions; or
- whether one useful interaction causes repeat Corgi engagement.

These uncertainties must remain visible through the PRD process.

---

## 2. Objective hierarchy

### Company outcome

Increase meaningful engagement with the Corgi community and establish Corgi as a resource that builders repeatedly use during their professional journey.

### Product objective

Increase the share of connection-seeking Cafe visitors who have one relevant, useful conversation during the same visit.

### User outcome

The visitor meets someone they would probably not have met otherwise and receives relevant support, insight, access, or belonging from the interaction.

### Causal hypothesis

```text
Physical presence at Corgi
        +
Explicit need, offer, and openness
        ↓
Mutually eligible introduction surfaced
        ↓
Useful in-person conversation
        ↓
Corgi is perceived as a valuable community resource
        ↓
Future Cafe or community engagement
```

Only the outcome through “useful in-person conversation” defines first-visit activation. Repeat engagement is a downstream business hypothesis to measure in a real pilot.

---

## 3. Evidence and confidence

### 3.1 What public evidence supports

#### The underlying professional needs are real

- Founders consistently report challenges related to fundraising, customer acquisition and revenue, and talent. Slush's 2025 survey of more than 600 early-stage founders reported fundraising as a concern for 58.1% and customer acquisition for just over half, with technical and nontechnical hiring remaining persistent challenges. [Slush Startup Struggle Survey 2025](https://slush.org/newsroom/slush-startup-struggle-survey-2025)
- Operators seek trusted, role-relevant peers because scaling problems are contextual and often lack a standard playbook. Existing operator communities emphasize confidential guidance, practical experience, benchmarks, warm introductions, and protection from pitches or spam. [Operators Guild](https://www.operators-guild.com/about-us), [Operators Guild peer forums](https://community.operators-guild.com/og-forums)
- Investors need qualified deal flow, trusted founder relationships, co-investors, and ways to support portfolio companies. LP fundraising is also a material challenge for fund managers: MSCI reports that one in three GPs ranked fundraising as their top challenge and more than half struggled to find quality deals. [MSCI 2025 General Partner Survey](https://www.msci.com/research-and-insights/paper/the-2025-general-partner-survey), [Affinity 2025 investment benchmark](https://www.affinity.co/report/the-2025-investment-benchmark-report)
- Professional weak ties can create employment opportunity. A large randomized LinkedIn study found that moderately weak ties improved job mobility, although benefits diminished when ties became too weak. [Stanford Graduate School of Business](https://www.gsb.stanford.edu/faculty-research/publications/causal-test-strength-weak-ties)

#### Isolation and third-place needs are credible

- Research on entrepreneurial loneliness identifies lack of coworker support, limited time, and social, cognitive, and physical isolation as recurring causes. [The many faces of entrepreneurial loneliness](https://onlinelibrary.wiley.com/doi/10.1111/peps.12614)
- Coworking research supports the value of community fit and facilitation, while cautioning that co-location alone does not automatically create community. [Community fit in coworking spaces](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.620794/full), [Curating the third place](https://www.sciencedirect.com/science/article/pii/S0016718517300866)

#### Corgi has physical density and a community ambition

- Corgi publicly describes frequent events, hundreds of weekly founder/operator/investor visits, and 1:1 introductions as an important form of community value. This is company-reported evidence, not independently audited behavior. [Corgi community announcement](https://www.linkedin.com/posts/brookeleblanc_at-corgi-we-host-events-every-single-day-activity-7443766242915745797-KUqv)
- Corgi's public event calendar shows an active, partner-led programming model. [Corgi events](https://luma.com/usecorgi)
- Public visitor accounts support the Cafe's value as a workspace and occasionally describe accidental conversations, but reviews more often discuss hours, Wi-Fi, seating, drinks, and atmosphere than an unmet need for structured introductions. [Independent Cafe coverage](https://sf.gazetteer.co/come-for-the-all-night-coffee-stay-for-the-ai-insurance), [aggregated visitor reviews](https://restaurantguru.com/Corgi-Cafe-San-Francisco)

### 3.2 What remains inferred

- Everyday Cafe visitors frequently want to meet someone during that visit.
- Relevant people are present often enough to support useful matching.
- Visitors cannot already solve the problem through direct conversation, staff, events, or existing networks.
- People are willing to disclose their needs, offers, and availability in a Cafe context.
- Session-level permission and a simultaneous introduction feel safer and easier than an in-person approach or individual connection request.
- Visitors will remain available long enough to see an introduction and meet.
- A useful conversation increases return behavior or broader Corgi engagement.

### 3.3 Research limitations

This brief uses public desk research. Company posts are promotional, reviews are self-selected and primarily evaluate the Cafe, and broader industry studies do not establish Corgi-specific demand. The evidence is sufficient to define a testable problem space, but not to claim product-market fit or set confident matching weights.

---

## 4. Problem framing

### Core problem

> Builders may be dispersed across the wider ecosystem, and even when concentrated inside Corgi Cafe, a connection-seeking visitor cannot easily determine who is relevant, who is receptive, or whether an approach would be welcome. Potentially valuable conversations therefore depend on chance encounters or staff intervention.

### Candidate frictions

The current context suggests at least five different failure modes. They should not be treated as one undifferentiated “networking problem.”

1. **Relevance legibility:** The visitor cannot determine who has applicable experience, needs, or interests.
2. **Social permission:** The visitor cannot tell who is open to being approached or for which interaction types.
3. **Initiation friction:** Even after finding someone relevant, the visitor lacks a comfortable opening or mutually understood reason to talk. Corgi can reduce this friction by acting as a host and introducing two eligible people simultaneously.
4. **Temporal availability:** A relevant member may exist in the community but may not be present, available, or staying long enough to connect.
5. **Trust and safety:** A visitor may hesitate to share information or act on an introduction without credible identity, clear boundaries, and control over visibility.

The recommended first design hypothesis is **relevance legibility**: explicit intent and contextual explanations will help a visitor identify a person worth meeting more confidently than physical observation alone. Mutual permission remains a non-negotiable constraint, and the demo should still expose initiation, availability, and trust risks. Tech Ops should accept or change this starting bet before the PRD.

### What is not yet established

- That the primary problem is a shortage of ambitious people. Corgi's claimed advantage is already concentrating them physically.
- That more connections are always better. High-volume or poorly bounded outreach could make the Cafe less comfortable.
- That every visitor wants community interaction. Many visitors are there to work, study, or focus.
- That professional value and belonging are separate products. Belonging may emerge from repeated useful and welcoming encounters.

---

## 5. Audience and segmentation

### Shared target condition

The initial target is defined behaviorally:

> A first-time user of the standalone connection experience who is physically at Corgi Cafe, explicitly wants to connect during this visit, and is willing to state their current need, offer, and interaction boundaries.

The experience can serve both first-time and returning Cafe visitors. Prior Cafe history is a segmentation attribute, not the primary product boundary. The initial evaluation cohort is people using the connection product for the first time; a person may therefore be a Cafe regular while still belonging to the first-time product cohort. Repeat product use is a later retention measure.

### Segmentation axes

Personalization should use four independent dimensions:

1. **Community history:** first visit, returning visitor, regular, prior event participant.
2. **Background:** role, functional area, company or project, stage, relevant experience.
3. **Current intent:** current need, current offer, specific or exploratory goal.
4. **Openness:** availability now or later, interaction types permitted, strength threshold, and current session expiration.

“Risk-taker” and “builder” are useful brand identities, but too broad to drive matching or product eligibility.

### Persona-intent matrix

| Persona context | Common current asks | Common offers and value | Important distinctions |
|---|---|---|---|
| Founder | Customers or design partners; hiring; fundraising guidance; partnerships; tactical advice; founder peers | Domain expertise; product knowledge; lessons from building; introductions; startup opportunities | Company stage, industry, current priority, and whether fundraising or selling is permitted |
| Startup operator | Role-specific advice; hiring; customer or partner access where relevant; benchmarks; career development; peers | Functional playbooks; execution experience; candidate referrals; partner or vendor knowledge | Functional area must be captured: product, engineering, GTM, finance, talent, operations, or another specialty |
| Investor | Thesis-aligned founders; quality deal flow; co-investors; market intelligence; founder relationships; LP relationships for fund managers | Capital; feedback; pattern recognition; customer and talent introductions; portfolio support | Distinguish angel, scout, investment-team member, partner, and fund manager; not every investor is raising from LPs or accepting pitches |
| Job-seeking state | Relevant opportunities; insider context; mentorship; work feedback; referrals; peers | Skills; project help; candidate or domain knowledge; future community contribution | Model this as a temporary intent, not a permanent identity; introductions must respect whether both people permit recruiting conversations |

### Shared jobs to be done

**Functional job**

> When I am at Corgi and want help with a current goal, help me identify a relevant person who is present and open to that interaction so I can have a useful conversation during my visit.

**Social job**

> Help me approach someone without feeling that I am interrupting, imposing, or making an indiscriminate pitch.

**Emotional job**

> Help me feel that I belong among people who understand the ambition, uncertainty, and risk involved in building or supporting startups.

---

## 6. Intent and compatibility model

Role informs context; intent drives activation.

### Information needed from a member

- **Background:** enough professional context to establish relevance and credibility.
- **Ask:** what would be useful during this visit.
- **Offer:** what others may come to them for.
- **Openness:** which interaction types they permit Corgi to facilitate during the current session.
- **Presence:** whether they are currently at Corgi and until when.

None of these social signals should be inferred from drink orders, visit timestamps, or loyalty behavior.

### Compatible match types

1. **Ask-to-offer:** One member's current need matches something the other explicitly offers.
2. **Shared goal:** Both members are working through a similar problem and want peer exchange.
3. **Reciprocal value:** Each member currently offers something relevant to the other.

Reciprocal value may strengthen a match but is not mandatory. A mentor-style interaction can still be valuable when the offering member has explicitly opted into helping.

### Eligibility before ranking

A person can be considered only when they are:

- currently present in the same Cafe context;
- visible and available;
- open to the proposed interaction type;
- not blocked by either party; and
- not already connected or otherwise excluded by product safety rules.

Eligibility and consent are hard constraints. Relevance is a ranking concern.

---

## 7. Journey

### Current journey

1. The visitor orders online or in person.
2. They collect their drink and begin working.
3. Other visitors remain professionally and socially illegible.
4. The visitor uses visual guesses, waits for an accidental interaction, asks staff, attends an event, or does nothing.
5. They may leave without meeting anyone relevant.

### Target functional journey

| Stage | Visitor need | Required product behavior |
|---|---|---|
| Awareness | Understand that Corgi can help create a connection during this visit | Communicate the promise immediately after ordering or at pickup without requiring commerce integration |
| Education | Decide whether the experience is relevant and safe | Explain the value, session-level permission model, visibility, and time-limited presence before signup |
| Join | Enter with minimal friction | Sign up with email and a password (or Google), then collect first name, last name, and broad location |
| Establish context | Provide enough credible background without a long form | Present Exa people-search candidates for selection; use LinkedIn, an optional additional URL, and a short manual fallback when confidence is low; never treat an unconfirmed result as profile truth |
| Confirm profile | Control what Corgi retains | Build one source-attributed, editable profile and require confirmation before imported fields become durable |
| Choose | Decide what Corgi should help with next | Offer connect now, private-community interest, or maybe later; only connect now creates a visit-session path |
| Signal | Provide enough current context for a credible connection | Present inferred intents as removable suggestions, then require explicit confirmation of the final ask, offer, openness, boundaries, and presence |
| Become available | Authorize appropriate introductions without approving people one by one | Start a time-bounded session with explicit availability, interaction boundaries, and match-strength threshold |
| Understand | Evaluate a recommended introduction confidently | Notify both eligible members simultaneously and explain why the introduction is relevant and permitted |
| Respond | Preserve control without creating a formal networking workflow | Let either member skip the active introduction, delay it briefly, pause introductions, block, or report; a skip privately deactivates the introduction for both without attributing the decision |
| Meet | Begin the real-world interaction | Give both people enough shared context to recognize one another and start the conversation without requiring a connection request |
| Validate | Determine whether activation occurred | Ask whether they met and whether the conversation was useful |

### Awareness entry points

The first experience should be discoverable after ordering regardless of order channel. Candidate placements include:

- counter or pickup-area signage;
- a QR on a receipt, table, cup sleeve, or pager;
- an order-confirmation or pickup message when a link can be added without coupling the products.

The landing page is responsible for education before account creation. Integration with ordering is not a dependency for the standalone demonstration.

---

## 8. Product principles

1. **Intent first:** Personalize around what is useful today, not a permanent persona label.
2. **People only:** The initial activation layer connects members to members, not events, content, or services.
3. **Mutual permission:** Session-level opt-in, compatible boundaries, and current availability are required before Corgi facilitates an introduction. Relevance never overrides them.
4. **Explain the connection:** Every recommendation must communicate why the interaction could be useful and permitted.
5. **Ask and offer:** Represent contribution as well as need so the community does not become purely extractive.
6. **IRL completion:** Digital activity is a means to a real conversation, not the final outcome.
7. **Quality over volume:** An honest empty state is better than a weak or socially risky match.
8. **Respect focus:** Visitors who are unavailable or uninterested should remain invisible to connection seekers.
9. **Trust before growth:** Prevent unwanted fundraising, recruiting, and sales behavior before optimizing introduction volume.

---

## 9. Scope

### In scope

- Everyday Cafe visits rather than scheduled-event networking.
- First-time users of a centralized Corgi profile and connection product, including new and returning Cafe visitors.
- Founder, startup-operator, and investor contexts.
- Job seeking as a temporary intent available to relevant members.
- Explicit background, ask, offer, openness, and presence.
- User-confirmed, sourced profile enrichment with URL and short manual fallbacks.
- A post-enrichment choice to connect now, record private-community interest, or maybe later.
- A small set of personalized people recommendations with understandable reasons.
- Time-bounded, session-level permission for Corgi to facilitate compatible in-person introductions.
- Simultaneous introduction recommendations with skip, delay, pause, block, and report controls.
- Post-conversation confirmation and usefulness feedback.
- Synthetic members, visits, and connection states for the demonstration.

### Out of scope

- Ordering, payments, loyalty points, menus, and drink personalization.
- Reusing, migrating, or rebuilding the existing Cafe account.
- Inferring professional intent or availability from commerce behavior.
- Events, content, programs, and a broader community-resource concierge.
- A public or searchable member directory.
- Social feeds, followers, likes, posts, or community forums.
- A full messaging system.
- Long-term relationship management or autonomous follow-up.
- Background location tracking or exact seat visibility.
- Networking for visitors who are focused, unavailable, or uninterested.
- Proving real-world network liquidity with synthetic data.
- Silent identity resolution from people-search results.
- Private-community application, vetting, approval, directory visibility, or contact operations.
- Production use of a people-data provider before legal, privacy, security, data-provenance, and procurement review.

---

## 10. Conceptual product contract

These are product concepts, not a backend schema or API commitment.

### `MemberContext`

Provides enough durable context to evaluate relevance and credibility.

- role context;
- functional area or investor type;
- company, project, or professional focus;
- company or career stage where relevant;
- relevant experience and expertise.

### `VisitIntent`

Represents what is true for the current Cafe visit.

- current asks;
- current offers;
- specific or exploratory connection goal;
- accepted interaction types;
- openness threshold;
- presence and expiration.

### `Match`

Represents an eligible connection opportunity.

- two eligible members;
- compatibility type;
- human-readable explanation;
- current availability;
- applicable interaction boundaries.

### `Introduction`

Represents a facilitated recommendation between two mutually eligible members and its outcome lifecycle.

```text
recommended → met → useful outcome recorded
            ↘ skipped
            ↘ delayed
            ↘ expired
```

An introduction is active immediately when delivered; neither member must accept before acting on it. Either member may skip it, which deactivates it for both and shows the other person only a neutral “This introduction is no longer active” state without identifying who skipped or why. Blocking, reporting, and cancellation must be possible independently of the success path.

---

## 11. Measurement

### Primary activation metric

> Percentage of opted-in visit sessions that produce a facilitated introduction followed by a self-reported useful conversation during the same visit.

For the initial evaluation, the denominator is first-time product users who complete onboarding and begin an opted-in, connection-seeking visit session. It is not all Cafe orders, landing-page visitors, or accounts. Sessions without an eligible match remain in the denominator because availability is part of the product promise.

Activation evidence is recorded in distinct stages:

- **Recommended:** Both participants were eligible and received the facilitated introduction.
- **Met:** Both participants confirm that an in-person conversation occurred during the visit.
- **Useful:** The initiating visitor reports that the conversation was useful; collect the recipient's assessment separately rather than requiring identical ratings.

The stages should be reported independently so a high recommendation rate cannot conceal failure to meet or low conversation quality. The PRD should set stage-level targets after establishing a pilot baseline rather than inventing unsupported thresholds in this brief.

### Funnel

```text
Awareness seen
→ landing page visited
→ account created or accessed
→ onboarding completed
→ active visit started
→ introduction recommended
→ introduction viewed
→ members met
→ conversation rated useful
```

### Supporting measures

- Awareness-to-landing-page rate by entry point.
- Onboarding completion and time to first recommendation.
- Percentage of sessions with at least one eligible match.
- Recommendation-view, meeting, and useful-conversation rates.
- Median time from active visit to facilitated introduction and from introduction to meeting.
- Introduction skip and recommendation-irrelevance rates.
- Intent to use the experience again.

### Downstream business measure for a real pilot

- Another Cafe visit or Corgi community action within 30 days after a useful first interaction.

This is a secondary hypothesis measure, not proof of causality on its own.

### Guardrails

**Release-blocking safety failures**

- A declined, blocked, unavailable, or invisible person is exposed or approached through the product.
- A person is surfaced for an interaction type they did not permit.
- A safety report cannot be submitted or acted upon.

**High-priority abuse and trust failures**

- Repeated fundraising, recruiting, sales, or referral solicitation after rejection.
- Misleading identity, intent, or presence information.
- Job-seeking outreach disproportionately overwhelming founders and operators.

**Quality and adoption warnings**

- Low-relevance recommendations that reduce trust.
- Users avoiding check-in because visibility feels socially costly.
- High empty-state, skip, or introduction-expiration rates.

---

## 12. Synthetic demonstration scenarios

Synthetic personas demonstrate product behavior, not real market liquidity.

### Scenario A: Ask-to-offer founder advice

A returning Cafe visitor and first-time product user is a founder seeking advice on enterprise GTM. A present startup operator explicitly offers enterprise GTM experience and is open to advising founders. Both have opted into compatible introduction sessions, so Corgi introduces them simultaneously with a relevant conversation starting point.

### Scenario B: Hiring and opportunity compatibility

A startup operator is hiring for a product role. A present member with relevant experience has marked themselves open to startup opportunities. Both permit recruiting conversations, so the match is eligible.

### Scenario C: Founder and investor compatibility

An investor is looking for early-stage AI infrastructure founders. A relevant founder is open to investor conversations. The recommendation explains thesis and stage fit without implying an investment decision.

### Scenario D: Investor boundary

An investor is present but not accepting fundraising pitches. They may be open to peer or market conversations, but the product never surfaces them to a founder for fundraising.

### Scenario E: Shared founder challenge

Two founders are working through the same hiring or customer-development problem and both want peer exchange. They can match through shared intent even when neither presents themselves as an expert.

### Scenario F: Focus mode

A relevant member is physically present but unavailable. They are not shown, and the system does not reveal their presence to connection seekers.

### Scenario G: No credible match

No currently present person satisfies intent and openness constraints. The visitor receives an honest empty state rather than an irrelevant recommendation.

---

## 13. Risks and unresolved questions

### Demand risk

- What share of everyday visitors actively wants a connection?
- Is the need strong enough to justify onboarding during a Cafe visit?
- Do purposeful and exploratory visitors need materially different activation experiences?

### Supply and liquidity risk

- Is there sufficient role, intent, and expertise diversity at the same time and location?
- Will helpful regulars repeatedly opt in, or will introductions concentrate on a small number of people?
- How quickly should presence and introduction recommendations expire?

### Trust and safety risk

- What identity evidence is sufficient for a recommendation to feel credible?
- Which interaction categories require additional controls?
- How should repeat solicitation, misrepresentation, and uncomfortable offline behavior affect visibility?

### Experience risk

- Does session-level permission make a simultaneous introduction feel welcome, or do some interaction types still require per-match confirmation?
- Will members see and act on an introduction quickly enough during short Cafe visits?
- What minimum coordination is needed without building messaging?

### Business risk

- Does a useful connection change return behavior or merely improve a single visit?
- Can Corgi attribute community engagement without creating invasive tracking?
- Could a transactional connection layer weaken the Cafe's low-pressure, serendipitous character?

---

## 14. PRD readiness gate

The product can move into a PRD when Tech Ops accepts the following:

- the product objective and activation metric;
- the intent-first model and shared journey across persona contexts;
- people-only scope;
- session-level permission and simultaneous facilitated introductions as the connection contract;
- the distinction between eligibility, relevance, and outcome;
- the current and target functional journeys;
- the synthetic scenarios and guardrails;
- the evidence limitations and unresolved real-world liquidity risk; and
- acceptance or revision of relevance legibility as the first design hypothesis, while retaining permission as a hard constraint.

The PRD should then specify requirements and acceptance criteria. Experience design should follow the accepted product behavior, and technical architecture should follow the accepted experience and data needs.

---

## 15. Source of record

The original supplied strategic and MVP context is preserved at [`../reference/corgi-community-context.md`](../reference/corgi-community-context.md). It is source material, not an approved specification. Where the source document prescribes a solution, this brief treats that prescription as a hypothesis unless explicitly accepted above.
