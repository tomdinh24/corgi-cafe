# Corgi Cafe Writing System and Landing-Page Rewrite

## Summary

Create a Cafe/community-specific writing guide, then use it to rewrite the landing page before further design work.

The guide will combine Corgi’s strongest current writing from its [Cafe](https://www.corgicafe.com/), [event-hosting](https://www.corgicafe.com/host), and [residency](https://www.corgicafe.com/residency) pages with consumer-social patterns from [Timeleft](https://timeleft.com/), [Meetup](https://www.meetup.com/), [222](https://www.222.place/), [Geneva](https://www.geneva.com/), and [Partiful](https://www.partiful.com/).

The benchmark indicates that strong consumer-social pages:

- Lead with the human outcome or recognizable social tension.
- Make the experience concrete through place, activity, timing, or group size.
- Ask for action before explaining the full system.
- Explain the mechanism in roughly three steps.
- Put safety and uncertainty after the promise, using plain language.
- Use identity and belonging more than product terminology.

## Key Changes

### 1. Establish the writing source of truth

Create `docs/BRAND_WRITING.md` for Cafe and community messaging, covering:

- Evidence hierarchy: Cafe, residency, events, and hosting as primary voice references; Corgi Insurance as a secondary reference for precision and proof.
- Voice principles: local, direct, builder-literate, concrete, energetic, and selectively playful.
- Message anatomy: hook → one-sentence promise → action → mechanism → trust.
- Hook construction using a recognizable moment, human outcome, and concrete Corgi advantage.
- CTA rules: short verbs, one clear action, and no helper or disclaimer beneath buttons.
- Translation guidance from internal product language to human language:
  - “Relevant and receptive” → “worth talking to and open to meeting.”
  - “Mutually eligible” → “you both said yes to this kind of conversation.”
  - “Current intent” → “what you’re working on today.”
  - “Session expiration” → “only while you’re here.”
- Avoid list: abstract SaaS language, stacked qualifiers, em dashes, hype, vague claims, networking jargon, and legal language in hooks.
- Worked examples for landing pages, social posts, events, trust messaging, empty states, and CTAs.
- A read-aloud editing checklist: understandable in five seconds, concrete nouns and verbs, one idea per sentence, and language a Cafe host could naturally say.

Update `docs/DESIGN_SYSTEM.md` so its voice section points to the writing guide as the authority for public Cafe/community copy.

### 2. Produce multiple hook territories

Have the persistent Marketing Lead apply the completed guide and develop four full hero variations:

1. **Place-first, primary:** “The right person might already be here.”
2. **Builder identity:** “You came to build. Don’t build alone.”
3. **Corgi as host:** “If there’s someone worth meeting, Corgi makes the intro.”
4. **Cafe-playful:** “Coffee first. Good conversation next.”

Each variation will include a headline, one-sentence explanation, and CTA. The place-first version becomes the prototype default because it expresses Corgi’s unique physical advantage without promising a match. The other three remain documented alternatives for review or later testing.

Use “I’m open to talk” as the default CTA direction. Do not add explanatory text beneath it.

### 3. Rewrite and shorten the landing page

Reduce the current specification-heavy narrative to five consumer-facing sections:

1. **Hero:** Physical-room hook, short promise, CTA.
2. **How it works:** Say what you are working on, say what conversations are welcome, meet only when there is a real reason.
3. **The introduction:** One concrete example showing who, why, and how to begin.
4. **Ground rules:** No cold approaches, surprise pitches, weak matches, public profiles, or public rejection.
5. **Final action:** Restate the possibility of meeting someone already in the Cafe and repeat the CTA.

Apply the same voice to the onboarding handoff modal while preserving its existing product boundaries. Move guarantees, privacy qualifications, and session limits into the appropriate trust section instead of attaching them to buttons.

Keep internal terms such as eligibility, visibility, and session policy in the product specification, not in the marketing hook.

Synchronize the rewritten copy between the marketing handoff and `prototypes/community-activation-landing/index.html`. Do not change the page’s visual system or onboarding behavior in this pass.

## Interfaces and Behavior

- No application API, analytics event, data model, or onboarding-flow changes.
- Existing CTA placements continue opening the same prototype handoff.
- Existing local analytics event names and placement identifiers remain unchanged.
- The writing guide becomes the public-copy authority; product documents remain authoritative for functional and safety rules.

## Test Plan

- Verify the prototype and handoff contain the same approved primary message.
- Confirm every product promise still respects mutual permission, no-match behavior, privacy, commercial-conversation boundaries, and no guaranteed outcome.
- Check that no public UI copy uses em dashes, banned abstract phrases, or helper text beneath CTAs.
- Read every headline and CTA aloud for conversational phrasing.
- Confirm heading order, links, modal accessibility, and analytics behavior remain intact.
- Recheck layouts at 320px, 768px, 1440px, and 200% zoom for copy-induced overflow.
- Run `git diff --check` and review `git status`.
- State that the repository has no executable application test suite; verification is static prototype and documentation review.

## Assumptions

- The guide governs Corgi Cafe and community experiences, not all Corgi insurance or financial-product messaging.
- Official public writing is used as evidence for voice traits, not copied as reusable slogans.
- The place-first hook is the prototype default while all four variations are preserved for evaluation.
- Product scope, privacy requirements, and permission rules remain unchanged.
