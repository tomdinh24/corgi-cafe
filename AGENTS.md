# Corgi Cafe Community Connection — Codex Project Instructions

## What this project is

This repository defines a product and experience foundation for a Corgi Cafe activation layer that
helps connection-seeking visitors meet relevant, receptive people in the physical Corgi community.
The current milestone is an accepted pre-PRD problem definition; experience design and technical
architecture follow only after the product scope is accepted.

## Source hierarchy

- `docs/product/community-activation-problem-brief.md` is the current product source of truth.
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
- Mutual permission is a hard constraint. Relevance never overrides visibility, availability, or
  interaction boundaries.
- The intended activation outcome is a mutually accepted, useful, in-person conversation during the
  current Cafe visit.
- Keep researched evidence, Corgi-specific inference, and product decisions visibly distinct.

## Project conventions and verification

- Product definition precedes experience design; experience design precedes technical architecture.
- Keep working documents in `docs/product/`, reusable design guidance in `docs/`, and preserved
  source material in `docs/reference/`.
- Use descriptive Markdown headings, relative links for repository documents, and direct links for
  external evidence.
- Do not report a documentation change complete until links, headings, source fidelity where
  applicable, `git diff --check`, and `git status` have been reviewed.
- There is no executable application or test suite yet. State this plainly instead of claiming a
  runtime verification.
- Preserve intentional Markdown hard line breaks and source-reference formatting when a whitespace
  check flags them.

## Safety and approvals

- Never commit, print, or expose secrets or API keys.
- Never use `--dangerously-bypass-approvals-and-sandbox` or weaken Codex sandbox or approval
  settings to work around a denied action.
- Confirm before irreversible or outward-facing actions such as pushing, deploying, deleting data,
  or sending messages.
- Do not infer networking intent, availability, or openness from orders, timestamps, or loyalty
  behavior.

## Persistent leadership roles

Tom's standing **Product Lead**, **Design Lead**, and **Engineering Manager** persist across projects.
A request such as “talk to my Product Lead” refers to that persistent role, not a generic skill or an
invented persona.

- Resolve named leaders through `~/.ai-os/leadership/registry.md`.
- Invoke a new turn with `~/.ai-os/bin/ai-org talk <role> --run --prompt "<request>"`.
- Add `--resume` to continue the stored Codex thread.
- Repeat `--image <path>` when visual evidence is part of the review.
- Never substitute a generic workflow for a named persistent leader.
- Ask only when the requested role or project context is genuinely ambiguous.

## Cross-project context compatibility

Codex does not automatically load Claude Code's global instructions or auto-memory. When durable
working style, design feedback, or validated cross-project context is relevant:

1. Read `~/.claude/projects/-Users-tomlam-Projects-Tom-OS/memory/MEMORY.md` as the index.
2. Apply entries prefixed `feedback_`, `user_`, or `core_` when relevant.
3. Load `project_` or `reference_` entries only when they match this repository or task.

Keep project-specific instructions here; do not duplicate the underlying cross-project memory.
