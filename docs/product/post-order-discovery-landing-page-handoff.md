# Corgi Cafe introductions landing page

## Product, marketing, and design handoff

- **Status:** Canonical landing experience
- **Date:** August 16, 2026
- **Writing standard:** [Corgi Cafe Brand Writing Guide](../BRAND_WRITING.md)
- **Implementation:** [`../../prototypes/community-onboarding-clickthroughs/apps/onboarding-exa/app/page.tsx`](../../prototypes/community-onboarding-clickthroughs/apps/onboarding-exa/app/page.tsx)
- **Onboarding:** [`community-onboarding-exa-prototype.md`](./community-onboarding-exa-prototype.md)

## Objective

Invite a visitor who is at Corgi and open to a useful conversation into the centralized onboarding flow. Within a few seconds, the page makes clear that someone they may want to talk to could already be in the Cafe, both people opt in, and an introduction is not guaranteed.

Corgi sounds like a friendly Cafe host. The page leads with the human outcome rather than profile search, matching, or a provider.

## Canonical hierarchy and copy

### Header

- Official Corgi logo, followed by the HTML descriptor **Cafe introductions**
- In-Cafe context: **At Corgi · 9 Claude Lane**
- Action: **Start an intro**

The logo is the unmodified project-owned asset registered in [`../ASSET_REGISTER.md`](../ASSET_REGISTER.md).

### Hero

- Eyebrow: **Here today**
- H1: **Want to meet someone at Corgi?**
- Supporting copy: **Tell us what you’re working on and what you’d like to talk about. If someone here wants that conversation too, we’ll introduce you.**
- Action: **Start an intro**

The retained original CSS Cafe scene shows two people, a table, conversation notes, and a 42-minute introduction window. It is decorative and adds no duplicate accessibility-tree content.

### How it works

- Eyebrow: **How it works**
- H2: **Skip the cold approach.**

1. **Say what’s on your mind.** Share what you’re building or figuring out today.
2. **Choose what you’re up for.** Tell us what you can help with and what to skip.
3. **Get introduced together.** If the conversation fits, Corgi introduces you both.

### Example introduction

- Eyebrow: **Example intro**
- H2: **A real reason to say hello.**
- Status: **Open now · 42 min left**
- Person: **Maya · GTM operator**
- Reason: **You’re working through early sales. Maya has helped two developer-tool teams move beyond founder-led sales and is open to comparing notes.**
- Prompt: **What changed when founder-led sales stopped scaling?**
- Footer: **Example only. No member data is shown.**

The example is a static `<article>`. It does not expose fake, disabled match controls.

### Ground rules

- Eyebrow: **Your call**
- H2: **No awkward surprises.**
- **Both people opt in.** Corgi only introduces people who are open to that conversation.
- **No surprise pitches.** Sales, recruiting, and fundraising stay off unless both people choose them.
- **Private by default.** Your profile isn’t a public directory listing.
- **No forced match.** If no one fits, we’ll say so.
- **Easy out.** Skip, pause, block, or report anytime.

### Final invitation

- H2: **Open to an intro?**
- Action: **Start an intro**

Every CTA is a normal link to `/start`. The former five-step preview modal has been retired.

## Trust and scope

The landing page may explain mutual permission, member control, a private-by-default profile, and an honest no-match state. It must not promise an introduction, private-community acceptance, a public directory, investors, jobs, customers, funding, safety, or another commercial outcome.

No provider, model, AI claim, version, profile-search detail, or inferred professional fact appears in public metadata or landing copy.

## Responsive and accessible behavior

- Desktop uses a 12-column hero, three open mechanism columns, a 5/7 example split, and a two-column ground-rule band.
- Below 768px, sections reflow to one column and the adjacent logo descriptor hides before the 83×24 logo is reduced.
- At 320px, primary CTAs fit the viewport and the hero action becomes full width.
- Controls use 44px or larger targets, tactile orange states, a dark-orange focus edge, and a light-orange halo.
- Reduced-motion and forced-colors preferences are supported.
- Automated review covers 320, 390, 480, 768, 1024, and 1440 CSS pixels plus 200% zoom without page-level horizontal overflow.

## Analytics boundary

The current prototype sends no analytics network request. Any future instrumentation may record placement and categorical outcomes only. It must never include emails, names, locations, URLs, free text, candidate contents, or profile contents.
