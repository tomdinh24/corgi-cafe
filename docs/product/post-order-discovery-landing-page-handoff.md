# Corgi Post-Order Discovery Landing Page

## Marketing and Design Handoff

- **Status:** Implemented as a standalone prototype
- **Audience:** Corgi Cafe Tech Ops, Product, Design, and Engineering
- **Date:** August 15, 2026
- **Owners:** Standing Marketing Lead and Design Lead
- **Product review:** Standing Product Lead terminology incorporated
- **Writing standard:** [Corgi Cafe Brand Writing Guide](../BRAND_WRITING.md)
- **Prototype (archived):** [`docs/archive/community-activation-landing/index.html`](../archive/community-activation-landing/index.html)

---

## 1. Objective

Invite a post-order visitor who is physically at Corgi and open to meeting someone into the
centralized Corgi onboarding flow.

The page should make three things clear within a few seconds:

1. Corgi can introduce people who are already in the Cafe.
2. The visitor starts by saying what they want to talk about.
3. An introduction happens only when both people want that kind of conversation.

The page does not promise that someone will be available.

## 2. Audience and positioning

The primary audience is a founder, startup operator, investor, or opportunity-seeking builder who
is currently at Corgi and open to meeting someone during the visit.

Corgi should sound like a friendly Cafe host, not a networking platform. It asks what someone wants
to talk about, checks whether another person wants the same conversation, and makes the introduction
for both people.

The centralized profile and possible future private-community participation remain secondary. The
landing page is about having a conversation during the current Cafe visit.

## 3. Writing direction

The copy follows the [brand writing guide](../BRAND_WRITING.md):

- lead with the human invitation rather than the matching system;
- use familiar words, contractions, and short sentences;
- make playfulness come from real social moments;
- explain the mechanism in three human steps;
- move privacy, uncertainty, and permission into compact ground rules; and
- keep the CTA clean, with no disclaimer or helper text beneath it.

Internal product terms such as `eligible`, `mutual fit`, `current intent`, `visibility`, and
`session expiration` remain in the product specification. They are translated for visitors.

## 4. Primary copy deck

### 4.1 Hero

**Eyebrow:** Here today

**Headline:** Want to meet someone at Corgi?

**Supporting copy:** Tell Corgi what you're working on and what you'd like to talk about. If someone
here wants that conversation too, we'll introduce you.

**CTA:** Start an intro

There is no helper text beneath the CTA.

### 4.2 How it works

**Headline:** Start with what you actually want to talk about.

**Supporting copy:** No bio-writing contest. Give Corgi just enough to make a good introduction.

1. **Say what's on your mind.** Tell us what you're building, figuring out, or curious about today.
2. **Say what you're up for.** Share what you can help with and any conversations you would rather
   skip.
3. **Get introduced together.** If you both want the conversation, Corgi introduces you at the same
   time.

### 4.3 Example introduction

**Eyebrow:** Skip the cold approach

**Headline:** A real reason to say hello.

**Setup:** You are building a developer tool and want to talk through early sales. Maya is at Corgi
too. She has been through the same shift and is open to comparing notes now.

**Example card:**

- Status: You're both up for this
- Person: Maya, an early GTM operator
- Reason: Maya has helped two developer-tool teams move past founder-led sales. You can compare what
  changed, what did not, and what you're seeing with early customers.
- Starting point: What changed when founder-led sales stopped scaling?
- Controls: Meet now; Skip

The example is fictional and contains no member data.

### 4.4 Ground rules

**Headline:** No awkward surprises.

**Supporting copy:** Corgi only makes an intro when both people want that kind of conversation. You
can always skip without turning it into a thing.

- **No cold approaches.** You only meet when you are both open to that kind of conversation.
- **No surprise pitches.** Sales, recruiting, fundraising, and hiring talk only happen when both
  people say yes.
- **No forced introduction.** If no one is available, stay open while you're here or try another
  visit.
- **No public directory.** A profile does not create followers, messages, or permission to contact
  someone.
- **Skip without the speech.** Corgi does not say who skipped or why. A person can also pause, block,
  or report.

### 4.5 Final invitation

**Eyebrow:** Still here?

**Headline:** Open to meeting someone?

**Supporting copy:** Tell us what you'd like to talk about. We'll make an intro only when you both
want it.

**CTA:** Start an intro

## 5. Alternate hero routes

These routes are retained for review or later testing. The direct route remains the prototype
default.

### Social-friction route

**Headline:** Skip the awkward hover near someone's laptop.

**Supporting copy:** Tell Corgi what you want to talk about and what is off limits. We'll only make
an introduction when both people want the conversation.

**CTA:** Start an intro

### Builder-recognition route

**Headline:** Someone at Corgi might get what you're building.

**Supporting copy:** Tell Corgi what you're working on and what you want to talk through. If someone
here wants that conversation too, we'll introduce you.

**CTA:** Start an intro

### Useful-conversation route

**Headline:** Open to a good conversation while you're here?

**Supporting copy:** Say what you're working on and what would be helpful to talk through. If someone
nearby is open to the same conversation, Corgi can make the intro.

**CTA:** Start an intro

Do not test an alternate until a pilot has enough people available to make landing-page conversion
results interpretable.

## 6. Proof and trust boundaries

The page may say that Corgi:

- asks what someone wants to discuss and what they can help with;
- asks which conversations are welcome or off limits;
- introduces people only when both have opted into compatible, time-bounded availability;
- explains why they may want to talk and offers a starting point;
- supports skip, pause, block, and report controls; and
- gives an honest waiting state when no credible introduction exists.

The page must not promise:

- that an introduction or meeting will exist;
- access to investors, jobs, customers, referrals, or funding;
- private-community acceptance;
- a public directory or offsite contact; or
- a commercial outcome from an introduction.

## 7. Prototype handoff

The primary CTA opens a modal showing the proposed transition into centralized Corgi setup. It does
not implement account creation, profile enrichment, onboarding, matching, or private-community
membership.

The modal groups the canonical onboarding sequence into five visitor-facing steps:

1. Verify an email, then add name and broad location.
2. Choose the correct sourced profile or provide LinkedIn, then correct anything wrong.
3. Choose to meet someone now, record private-community interest, or return later.
4. Review suggested topics and state what to discuss or help with today.
5. Set availability and limits, then receive an introduction or an honest no-one-available state.

The modal states that nothing is saved, profile search is not connected, and the proposed search is
not approved for production. Escape and the explicit close action close the modal and return focus
to the CTA that opened it.

## 8. Prototype analytics contract

The prototype records events locally in `window.corgiPrototypeEvents` and dispatches a
`corgi:analytics` browser event. It sends no network requests and includes no personal information.

| Event | Trigger |
|---|---|
| `community_landing_viewed` | Page initializes |
| `community_landing_section_viewed` | A major page section becomes visible for the first time |
| `community_landing_cta_clicked` | A header, hero, or final CTA is selected |
| `signup_started` | The mocked onboarding handoff opens |
| `onboarding_handoff_closed` | The modal closes |

Production instrumentation should add entry point, anonymous experiment assignment, viewport class,
first-time-product-user status after signup, and downstream onboarding and visit outcomes. It must
not attach inferred professional context to pre-signup marketing analytics.

## 9. Experiment

### Hypothesis

A direct invitation to meet someone already at Corgi will increase qualified onboarding starts
without creating the belief that an introduction, pitch opportunity, or commercial outcome is
guaranteed.

### Primary measure

Percentage of landing-page visitors who start centralized Corgi onboarding.

### Downstream measure

Percentage of first-time product users who complete onboarding and open themselves to an
introduction during the current visit.

### Guardrails

- Visitors believe an introduction, investment, job, customer, or community acceptance is
  guaranteed.
- Visitors are surprised by profile resolution or visibility choices.
- CTA engagement is high but profile confirmation drops sharply.
- Commercial-solicitation or interaction-boundary complaints increase.

Do not optimize landing-page conversion independently of useful-conversation and safety outcomes.

## 10. Implementation boundary

This artifact is a visual and interaction prototype. It intentionally contains:

- no production authentication;
- no profile lookup or third-party API;
- no storage or submission of personal information;
- no ordering or loyalty integration;
- no real analytics endpoint; and
- no live matching.

Production implementation follows human acceptance of the
[onboarding enrichment proposal](../archive/onboarding-enrichment-proposal.md) and the complete onboarding
experience design.

Crustdata is the selected shadow-test candidate only. This handoff does not approve it for
production. Recording private-community interest does not grant membership, discoverability, or
contact permission.
