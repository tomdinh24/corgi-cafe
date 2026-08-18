# Corgi Post-Order Discovery Landing Page

## Marketing and Design Handoff

- **Status:** Shipped. The live landing is `corgi_cafe_app/components/LandingPage.tsx`. This handoff is the copy and interaction source.
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
2. The visitor starts by choosing a topic they want to talk about.
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

**Supporting copy:** Corgi brings together people at the Cafe who are open to the same kind of conversation.

**CTA:** Start a chat

There is no helper text beneath the CTA. (Header nav: "How it works" and "Community code".)

### 4.2 How it works

**Headline:** Find the conversation that fits.

**Supporting copy:** Share what sounds interesting today. Corgi takes care of the introduction.

1. **Choose a topic.** Pick a project, question, or idea worth talking through. (Topic chips shown:
   Health, AI products, First customers, Fundraising, Career moves, SF life.)
2. **See who's open.** Corgi looks for someone here who chose a compatible conversation.
3. **Meet at Corgi.** When both people are interested, we'll make the introduction.

### 4.3 Example introduction

**Eyebrow:** An intro at Corgi

**Headline (rotating):** Let Corgi connect you with your next co-founder. / bestie. / investor. / hire.

**Example card:**

- Status: TRUDY IS OPEN NOW · At Corgi
- Person: Trudy · GTM operator, Developer tools
- Reason: Trudy has helped two developer-tool teams move beyond founder-led sales and is open to
  comparing notes.
- Conversation starter: What are you building?

The example is fictional and contains no member data.

### 4.4 Community code

**Eyebrow:** Community code

**Headline:** Comfort comes first.

**Supporting copy:** Every introduction starts with two yeses.

- **Mutual.** Both people choose the conversation. No fit means no intro.
- **Pitch-free.** Sales, recruiting, and fundraising stay off unless invited.
- **Private.** Profiles stay within Corgi Community.
- **Easy exits.** Skip, pause, block, or report anytime.

### 4.5 Final invitation

**Eyebrow:** At Corgi today

**Headline:** See who's open to talk.

**Supporting copy:** A good conversation could be one table away.

**CTA:** Start a chat

## 5. Alternate hero routes

These routes are retained for review or later testing. The direct route remains the prototype
default.

### Social-friction route

**Headline:** Skip the awkward hover near someone's laptop.

**Supporting copy:** Tell Corgi what you want to talk about and what is off limits. We'll only make
an introduction when both people want the conversation.

**CTA:** Start a chat

### Builder-recognition route

**Headline:** Someone at Corgi might get what you're building.

**Supporting copy:** Tell Corgi what you're working on and what you want to talk through. If someone
here wants that conversation too, we'll introduce you.

**CTA:** Start a chat

### Useful-conversation route

**Headline:** Open to a good conversation while you're here?

**Supporting copy:** Say what you're working on and what would be helpful to talk through. If someone
nearby is open to the same conversation, Corgi can make the intro.

**CTA:** Start a chat

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

## 7. CTA behavior

The primary CTA routes the visitor into the live onboarding flow: `/sign-up` for a new or
signed-out visitor, or `/home` when already signed in. (There is no interstitial modal; the earlier
prototype's mock modal was replaced by the real flow.)

The onboarding sequence it leads into, as five visitor-facing steps:

1. Create an account (email + password, or Google), then add name and broad location.
2. Choose the correct sourced profile or provide LinkedIn, then correct anything wrong.
3. Choose to meet someone now, record private-community interest, or return later.
4. Review suggested topics and state what to discuss or help with today.
5. Set availability and limits, then receive an introduction or an honest no-one-available state.

Onboarding is live and persists once the visitor confirms. No people-search provider is approved
for production yet.

## 8. Analytics

The landing page is currently **un-instrumented**: it emits no analytics events (the prototype's
`window.corgiPrototypeEvents` store and `corgi:analytics` browser event were never built). The app's
event system is `recordComparisonEvent` (`packages/corgi-onboarding-shared/src/events.ts`), which
records onboarding-flow events (`step_completed`, `provider_outcome`, `source_rejected`,
`field_corrected`, `intent_corrected`, `terminal_completed`) to `sessionStorage`. It instruments
the onboarding flow, not the landing page.

Production instrumentation should add a landing-view and CTA-click event plus entry point, anonymous
experiment assignment, viewport class, first-time-product-user status after signup, and downstream
onboarding and visit outcomes. It must not attach inferred professional context to pre-signup
marketing analytics.

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

The landing page is live in `corgi_cafe_app`. Its CTA leads into real authentication, Exa-backed
profile lookup, persistent onboarding, and live matching. It intentionally still has:

- no ordering or loyalty integration; and
- no landing-page analytics endpoint yet.

No people-search provider is approved for production; production use follows human acceptance of the
[onboarding enrichment proposal](../archive/onboarding-enrichment-proposal.md) and the complete onboarding
experience design. Recording private-community interest does not grant membership, discoverability,
or contact permission.
