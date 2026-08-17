# Corgi Cafe Community Connection — Claude Code Project Instructions

## What this project is

This repository defines a product and experience foundation for a Corgi Cafe activation layer that
helps connection-seeking visitors meet relevant, receptive people in the physical Corgi community.
The current milestone includes an accepted pre-PRD problem definition, a draft MVP product
specification, and a standalone post-order landing prototype. Production onboarding and technical
architecture remain gated on human product, privacy, legal, and vendor review.

## Source hierarchy

- `docs/product/community-activation-problem-brief.md` defines the accepted problem, audience, and
  activation boundary.
- `docs/product/community-activation-product-spec.md` defines the current proposed MVP behavior and
  remains subject to human product acceptance.
- `docs/product/post-order-discovery-landing-page-handoff.md` and its linked prototype are the
  current marketing and experience handoff for discovery after ordering.
- `docs/archive/onboarding-enrichment-proposal.md` is an archived research/experiment proposal
  (Crustdata direction; the shipped app uses Exa). It does
  not approve Crustdata, production architecture, data processing, or private-community operations.
- `docs/DESIGN_SYSTEM.md` is the proposed frontend design foundation. It does not override product
  scope or authorize the use of proprietary assets.
- `docs/reference/corgi-community-context.md` preserves the original source material. Treat its
  proposed solutions as hypotheses unless the product brief explicitly accepts them.

When documents disagree, preserve the evidence and raise the conflict rather than silently choosing
the broader scope.

## Conductor worktree model

- `$CONDUCTOR_WORKSPACE_PATH` is the repository for the active session.
- Stay inside the active workspace for editing, building, and testing.
- Treat `$CONDUCTOR_ROOT_PATH` and the matching `~/Projects/<repo>` checkout as read-only reference
  material unless the user explicitly requests a cross-worktree operation.
- Do not rename the current branch unless the user explicitly asks.
- Use `origin/master` as the comparison and PR base.

## Product boundaries

- Keep product work intent-first: background provides context, while current asks, offers,
  openness, and presence drive activation.
- People are the only community resource in the first scope. Events, content, ordering, loyalty,
  feeds, full messaging, and relationship management are out of scope.
- A centralized Corgi profile may support the in-person experience and a future private community.
  The current private-community branch records interest only; it does not grant membership,
  visibility, or contact permission.
- The current onboarding prototype uses Exa People Search and a user-confirmed identity candidate.
  The standalone Manual and AI Web variants have been retired; Exa retains an in-flow manual
  fallback. This prototype supersedes Crustdata as the only active prototype direction without
  approving any production provider. The sequence is email verification, separate identity and
  professional-context fields, a disclosed people-search flow, editable sourced profile
  confirmation, branch selection, explicit review of suggested discussion topics, permissions, and
  a `Ready for recommendations` boundary. Matching itself is not part of these prototypes.
  Suggested intent may begin selected for review, but commercial permissions must remain off until
  the member explicitly enables them.
- Mutual permission is a hard constraint. Relevance never overrides visibility, availability, or
  interaction boundaries. For the MVP, permission is granted through compatible, time-bounded
  introduction sessions rather than per-person connection requests.
- The intended activation outcome is a relevant, useful, in-person conversation during the current
  Cafe visit.
- Keep researched evidence, Corgi-specific inference, and product decisions visibly distinct.

## Project conventions and verification

- Product definition precedes experience design; experience design precedes technical architecture.
- Keep working documents in `docs/product/`, reusable design guidance in `docs/`, and preserved
  source material in `docs/reference/`.
- Use descriptive Markdown headings, relative links for repository documents, and direct links for
  external evidence.
- Do not report a documentation change complete until links, headings, source fidelity where
  applicable, `git diff --check`, and `git status` have been reviewed.
- The Exa onboarding app (`corgi_cafe_app`) is executable. Run the workspace checks documented
  in the root `README.md` before claiming runtime verification.
- Preserve intentional Markdown hard line breaks and source-reference formatting when a whitespace
  check flags them.

## Safety and approvals

- Never commit, print, or expose secrets or API keys.
- Never use `--dangerously-skip-permissions` or weaken sandbox or approval settings to work around
  a denied action.
- Confirm before irreversible or outward-facing actions such as pushing, deploying, deleting data,
  or sending messages.
- Do not infer networking intent, availability, or openness from orders, timestamps, or loyalty
  behavior.
- Do not silently identify a member from people-search results. Candidates require member
  confirmation, imported fields remain editable and sourced, and provider failure must fall through
  to manual onboarding. LinkedIn is an unverified identifier only; OpenAI and Exa must never fetch,
  summarize, or extract LinkedIn pages.

## Persistent leadership roles

Tom's standing **Product Lead**, **Design Lead**, **Engineering Manager**, and **Marketing Lead**
persist across projects. A request such as “talk to my Marketing Lead” refers to that persistent
role, not a generic skill or an invented persona.

- Resolve named leaders through `~/.ai-os/leadership/registry.md`.
- Invoke a new turn with `~/.ai-os/bin/ai-org talk <role> --run --prompt "<request>"`.
- Add `--resume` to continue the stored thread.
- Repeat `--image <path>` when visual evidence is part of the review.
- Never substitute a generic workflow for a named persistent leader.
- Ask only when the requested role or project context is genuinely ambiguous.

### Chief of Staff as the project front door

When Tom addresses the **Chief of Staff** or asks for automatic delegation, use the global
`$chief-of-staff` skill. The current root session remains Tom's only interface and automatically
routes bounded work to the smallest sufficient set of Product, Design, Engineering, Marketing,
implementation, or review subagents in this workspace.

- Parallelize read-only work and edits to disjoint files; serialize overlapping edits.
- Give every editing subagent explicit file ownership and preserve existing user changes.
- Supervise, verify, reconcile, and synthesize child results before replying to Tom.
- Do not require Tom to open, monitor, or combine separate agent chats.
- Keep external, destructive, integration, release, and spending actions behind explicit approval.

## Cross-project context compatibility

Claude Code loads `~/.claude/CLAUDE.md` globally, but the Tom-OS auto-memory only auto-loads in the
Tom-OS project. When durable working style, design feedback, or validated cross-project context is
relevant to this repo:

1. Read `~/.claude/projects/-Users-tomlam-Projects-Tom-OS/memory/MEMORY.md` as the index.
2. Apply entries prefixed `feedback_`, `user_`, or `core_` when relevant.
3. Load `project_` or `reference_` entries only when they match this repository or task.

Keep project-specific instructions here; do not duplicate the underlying cross-project memory.
