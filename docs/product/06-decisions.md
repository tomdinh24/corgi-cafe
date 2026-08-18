# Corgi Community, Decisions and Trade-offs

A running log of the notable product and engineering trade-offs made building the current version,
plus the things deliberately left out of scope. The spec ([02](./02-product-spec.md)) and
implementation handoff ([04](./04-implementation-handoff.md)) say what the product is; this says
why it is shaped this way and what we chose not to build yet.

Format per entry: Context, Options, Decision, Trade-off.

## Decisions made (shipped)

### D1. Matching: deterministic SQL ranking, then model-assisted ranking on top

- **Context:** pick the best counterpart for an introduction from the people eligible right now.
- **Options:** (a) fully deterministic SQL ranking (fixed rules: topic overlap, ask/offer
  reciprocity, longest wait); (b) let a model rank and prioritize among eligible people.
- **Decision:** keep the deterministic SQL for the hard eligibility filter (same cafe, ordered and
  present, equal commercial boundaries), then have an LLM rank and prioritize the eligible pool and
  write the "why you two" reason. A deterministic auto-pick stays as the fallback when the model is
  unavailable.
- **Trade-off:** the model gives better, more human prioritization and explanations than fixed SQL
  rules alone, while the deterministic filter plus fallback keep it safe, cheap, and predictable. We
  started deterministic-only and moved to model-assisted on top.

### D2. Onboarding auth: email and password instead of OTP or magic link

- **Context:** how a visitor signs in during onboarding.
- **Options:** (a) email OTP or magic link; (b) email and password (plus Google).
- **Decision:** email and password, plus Google, for this version.
- **Trade-off:** OTP, magic link, or any SMS/phone verification needs a paid email/SMS sending
  service and a verified sending domain, which adds cost, setup time, and another account and
  dependency. Email and password ships today with no delivery dependency. Revisit if and when we
  fund an email or SMS channel (see D7).

### D3. A landing page, not just the platform

- **Context:** how people first encounter Corgi Community.
- **Decision:** build a dedicated post-order landing page as a real front door for the community,
  plus a clear "start a chat" entry, instead of dropping visitors straight into the platform.
- **Trade-off:** more surface to build and maintain, but it feels production-ready and gives Corgi
  Community an actual marketing front door, a place to send people, rather than only an internal tool.

### D4. Let a member decline a weak match, and treat it as a signal

- **Context:** a matched member reads the introduction reason and it does not make sense for them.
- **Decision:** let them decline the introduction so they are freed to meet someone else, and the
  counterpart is returned to the searching pool rather than stranded on a dead match. Treat a
  decline as a negative signal that the recommendation may not have been strong.
- **Trade-off:** gives members control and keeps the pool liquid (no one stuck on a bad match), and
  gives us a match-quality signal to improve ranking over time. Cost: a decline ends that pairing
  and blocks re-matching the same pair for 24h, so a mistaken decline is not instantly re-offered.

### D5. Withhold identity cues until after the meeting (anti-bias)

- **Context:** showing too much about a counterpart before meeting can bias whether someone wants to
  meet them, for example judging by employer or by a photo.
- **Decision:** withhold identity and status cues until both confirm they met. During the
  introduction, show only first name, role, current work, and the reason. Reveal the profile photo
  and shareable links only after both confirm they met, so people meet and learn about each other
  first and details are disclosed afterward.
- **Trade-off:** encourages meeting on the basis of the conversation and the reason rather than brand
  or looks, at the cost of less up-front information.
- **Where it applies:** the anti-bias hiding matters at the decision moment. The active introduction,
  where a member decides whether to meet, shows only first name, role, current work, and the reason
  (no company, no photo). Once both accept, that decision is already made, so the home "My matches"
  dashboard showing the counterpart's company is intended, not a gap: the dashboard is a
  post-conversation review surface, and by the time a member reviews it there they have met and
  already know where the counterpart works. The profile photo and shareable links are still held back
  until both confirm they met.

### D6. Lightweight onboarding via people-search, not scraping

- **Context:** get enough credible context to match well without a long form, and without a
  data-privacy overreach.
- **Decision:** onboarding collects only first name, last name, location, and where the member
  works, which is enough for a people-search tool (Exa) to surface a likely public profile the
  member then confirms. This is a search, not scraping: we never fetch or extract LinkedIn pages,
  and LinkedIn is kept as an identifier only. The confirmed context feeds matching. Because this
  version is not an official public launch, the privacy bar is treated as lower for now.
- **Trade-off and commitment:** lowers onboarding friction (a few fields, no long form) while
  staying on the right side of the no-scraping line. If this launches publicly, add clear
  transparency about where member information comes from, what is collected, and what it is used
  for. That transparency layer is intentionally not in this version.

## Deliberately deferred or out of current scope

### D7. "Notify me when someone's open" (presence notifications): not built

- **Idea:** when a visitor wants to chat but no one is available yet, let them opt into "notify me
  when someone's ready" (email, SMS, or push), so they don't have to sit and wait.
- **Why deferred:** the same cost and account constraint as D2, it needs an email/SMS delivery
  channel. Out of the defined scope for this version.
- **Future:** an opt-in "ping me when there's a match" once a delivery channel exists.

### D8. Order and in-person presence verification: not built

- **Today:** Cafe presence and "ordered today" are self-asserted booleans; the app stores no location.
- **Why deferred:** no access to Corgi's ordering or point-of-sale data to verify a real, present
  customer.
- **Future:** at launch, verify order ownership and physical presence so introductions are limited
  to actual in-person customers, reinforcing real in-person interaction.

### D9. Event-intent branching: future GTM idea

- **Idea:** if a visitor's intent is attending an event, recommend the people they intend to meet
  there, a branch of the same intent-matching engine.
- **Status:** a later go-to-market direction for Corgi Cafe and Corgi Community broadly.

### D10. Member directory and a richer product community: future

- **Idea:** a searchable member directory where people find each other, ask for help, and build
  things together.
- **Why not now:** the purpose of Corgi Cafe is in-person connection. A public, searchable directory
  would not solve the core problem, it recreates the cold-start problem (figure out who to meet, then
  arrange a meeting), which is slower time-to-value. Facilitated in-person introductions during the
  visit are faster to value and push people toward meeting in person. Keeping a public or searchable
  directory out of scope is also consistent with the product boundary in
  [01](./01-problem-brief.md) and [02](./02-product-spec.md).
- **Future:** revisit once in-person activation is proven.

## Other trade-offs on record (from the build)

- **Confirmed match = both accepted OR both met.** The original both-accepted gate never fires in
  Demo mode (the seeded counterpart records no decision), so a finished demo meeting never appeared.
  Broadened so a match shows once both accepted the intro or both confirmed they met.
- **Daily no-repeat blocks only declined pairs.** A pair is blocked from re-matching for 24h only if
  one side declined; a plain page refresh with no decline still allows a re-recommendation.
- **Demo mode.** An isolated `corgi-demo` cafe seeded with real, curated people lets one person run
  the whole match, meet, and links flow solo, without needing a live pool.
