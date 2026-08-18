# Corgi Community docs

Orientation for this folder. The source hierarchy (which document wins when they disagree) is defined
in the root [`CLAUDE.md`](../CLAUDE.md); this index is the map.

**Reading order:** product definition → experience design → technical architecture. Product definition
precedes experience design; experience design precedes technical architecture.

## Product (`product/`)

The working product record, most-authoritative first.

| Document | What it is |
|---|---|
| [community-activation-problem-brief.md](product/community-activation-problem-brief.md) | Accepted pre-PRD problem, audience, and activation boundary. The anchor everything else answers to. |
| [community-activation-product-spec.md](product/community-activation-product-spec.md) | Proposed MVP behavior. Subject to human product acceptance. |
| [post-order-discovery-landing-page-handoff.md](product/post-order-discovery-landing-page-handoff.md) | Marketing + experience handoff for discovery after ordering. |
| [community-activation-implementation-handoff.md](product/community-activation-implementation-handoff.md) | What the shipped Exa app (`corgi_cafe_app`) actually implements. |
| [community-activation-data-schema.md](product/community-activation-data-schema.md) | Data dictionary: where each UI field lands and why. Column-level truth lives in `supabase/migrations/`. |

## Standards (`docs/`)

| Document | What it is |
|---|---|
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Proposed frontend design foundation. Does not authorize proprietary assets. |
| [BRAND_WRITING.md](BRAND_WRITING.md) | Authoritative writing standard for public Cafe and community copy. |

## Reference (`reference/`)

| Document | What it is |
|---|---|
| [corgi-community-context.md](reference/corgi-community-context.md) | Preserved original source material. Treat its proposed solutions as hypotheses unless the problem brief accepts them. |

## Archive (`archive/`)

Superseded or historical material, kept for provenance — not current guidance.

- `onboarding-enrichment-proposal.md` — retired Crustdata-direction proposal (the app uses Exa).
- `community-onboarding-exa-prototype.md` — early prototype evaluation snapshot, superseded by the implementation handoff.
- `community-activation-landing/` — the standalone landing prototype; the concept now lives in `corgi_cafe_app/components/LandingPage.tsx`.
- `plans/` — historical planning artifacts. They reference the old repo layout (`prototypes/…`, `apps/onboarding-exa`) on purpose — they are point-in-time snapshots, not current paths.

## Conventions

- Descriptive Markdown headings, relative links for repository documents, direct links for external evidence.
- Keep researched evidence, Corgi-specific inference, and product decisions visibly distinct.
- When documents disagree, preserve the evidence and raise the conflict rather than silently choosing the broader scope.
