# Corgi Community — Data Schema & Dictionary

**What this is:** the definition of every piece of data the community-activation platform stores, where each UI input lands, its type, and *why* we keep it. This is the contract for the Supabase Postgres database.

**Source of truth in code:**
- `supabase/migrations/202608160001_corgi_community_core.sql` — core schema, RLS, privacy RPCs, storage bucket.
- `supabase/migrations/202608160002_matching_service.sql` — the matcher (`request_introduction`).

## Storage principles (why the shape is what it is)

| Principle | How the schema enforces it |
|---|---|
| **Consent before relevance** | A member only enters matching by writing a `visit_intro_sessions` row with explicit intent + boundaries. No profile is matched without one. |
| **Minimal exposure** | Counterpart identity is never handed to the client directly. It's only readable through two `security definer` RPCs that return a first name / role / reason (`get_introduction_counterpart`) or approved links after both confirm a meeting (`get_post_meeting_links`). |
| **No location trails** | `visit_intro_sessions` stores only booleans (`at_cafe`, `order_confirmed_today`) + a `presence_checked_at` timestamp — never coordinates or movement. Enforced by an explicit column comment + the persist layer stripping `latitude`. |
| **LinkedIn is an identifier, not a source** | `profile_sources.identifier_only = true` for LinkedIn; facts are never imported from it. |
| **Member owns their rows** | Row-Level Security scopes every table to `member_id = auth.uid()`. Members cannot write matches — only the reviewed `request_introduction` RPC can. |
| **Temporary recognition media** | `recognition_media` carries `expires_at` + `deleted_at`; the storage bucket is private. |

## Input field → where it's stored → why

| UI input (onboarding-exa) | Table.column | Type | Why we store it |
|---|---|---|---|
| Email / Google sign-in | `members.email`, `members.display_name` | text | Identity + contact for the account (auth-bound). |
| First / last name | `profiles.first_name`, `last_name` | text | How a member is shown to a confirmed introduction. |
| City or region | `profiles.broad_location` | text | Coarse context only; never precise location. |
| Role or title | `profiles.role_title` | text | Relevance signal + shown in an introduction. |
| Company or project | `profiles.company_or_project` | text | Relevance signal for matching. |
| About me | `profiles.about_me` | text (≤800) | Conversation starter on the profile. |
| What are you working on | `profiles.current_work` | text (≤280) | Shown in an introduction ("what they're working on"). |
| Favorite drink at Corgi | `profiles.favorite_drink` | text | Light, human icebreaker. |
| Public links (website/github/social) | `profile_sources` (kind, url, host) | rows | Optional profile enrichment the member confirmed. |
| LinkedIn URL | `profile_sources` with `identifier_only=true` | row | Kept only as an identifier; never fetched. |
| Exa-selected profile | `profile_sources.source_kind='exa_candidate'` | row | Provenance of any auto-filled facts the member accepted. |
| Onboarding position | `onboarding_progress.status`, `last_step`, `draft` | enum/jsonb | Resume-where-you-left-off + funnel analytics. |
| "Join private community" | `community_interests.status` | enum | Records interest (membership is a separate gate). |
| Conversation mode (specific/open) | `visit_intro_sessions.conversation_mode` | text | Whether to match on a topic or on general fit. |
| Chosen topics | `visit_intro_sessions.topics` | text[] | Primary matching signal (topic overlap). |
| "What would make this useful" | `visit_intro_sessions.useful_context` | text (≤600) | The member's *ask* — matched against a counterpart's offer. |
| "What can you offer" | `visit_intro_sessions.offer_context` | text (≤600) | The member's *offer* — matched against a counterpart's ask. |
| Commercial toggles (fundraising/recruiting/sales) | `visit_intro_sessions.boundaries` | jsonb | Hard consent gate; two members must have equal comfort to match. |
| "Ordered here today" / "At Corgi now" | `visit_intro_sessions.order_confirmed_today`, `at_cafe`, `presence_checked_at` | bool/ts | Eligibility gates for matching (prototype simulates; production verifies). |
| — (matcher output) | `recommendations` (kind, explanation, evidence, status, expiry) | row | The pairing itself + why the two were matched. |
| — (matcher output) | `introduction_participants` (private_decision) | rows | The two people in an introduction + each one's private continue/pass. |
| Recognition photos (self / nearby) | `recognition_media` + private storage bucket | rows/objects | Temporary, pair-only, to find each other in person. |
| "Did you meet?" | `meeting_confirmations.answer` | enum | A meeting counts only when both confirm; unlocks approved links. |
| Post-meeting feedback | `private_feedback.rating`, `note` | enum/text | Private signal to improve future matches (the activation metric). |
| Any button/step interaction | `interaction_events` (event_name, step_id, context) | row | Product analytics on the funnel. |

## Table dictionary (types + purpose)

- **`members`** — one row per authenticated person (`id` = `auth.users.id`). Email, display name. Auto-created by trigger on signup.
- **`profiles`** — the member-confirmed public profile (names, role, company, about, current work, drink). 1:1 with member.
- **`profile_sources`** — links/sources attached to a profile, each with `identifier_only` (LinkedIn) and `share_after_meeting` (only revealed post-meeting) flags.
- **`onboarding_progress`** — funnel state machine (`started→identity→sources→profile→complete`) + a `draft` jsonb for resume.
- **`community_interests`** — soft interest in the private community (separate from membership).
- **`visit_intro_sessions`** — a member's active, consented intent to be introduced *on this visit*: mode, topics, ask/offer text, commercial boundaries, eligibility booleans, `status` (`draft→searching→introduced→meeting→completed/expired/cancelled`), and a 60-min `expires_at`. A partial unique index enforces **one active session per member**.
- **`recommendations`** — the matcher's output: `requester_session_id` ↔ `counterpart_session_id`, a `compatibility_kind` (`ask_offer` / `shared_goal` / `reciprocal_value`), a human `explanation`, `evidence` jsonb, `status`, and a 10-min `expires_at`.
- **`introduction_participants`** — the two members in a recommendation, each with a private `continue`/`pass` decision. Written only by the matcher RPC.
- **`recognition_media`** — temporary photos (self+outfit, nearby view), private bucket, with `expires_at`/`deleted_at` for retention.
- **`meeting_confirmations`** — each member's `met`/`not_yet` answer; both `met` is required to unlock post-meeting links.
- **`private_feedback`** — post-conversation rating + optional note, never shown to the counterpart.
- **`interaction_events`** — append-only analytics events (name, step, context).

## Who can read what (access model)

| Data | Access |
|---|---|
| Your own profile / sources / sessions / progress | You only (RLS `member_id = auth.uid()`). |
| A recommendation you're part of | Both participants can see the row's existence + explanation. |
| The counterpart's **name/role/current work/reason** | Only via `get_introduction_counterpart(rec_id)`, only once `status ∈ (introduced, locating, met, completed)`, only for the two participants. |
| The counterpart's **shareable links** | Only via `get_post_meeting_links(rec_id)`, only after **both** confirm `met`. |
| Recognition photos | Only the paired counterpart, only while not expired/deleted, only if both chose `continue`. |
| Creating a match | **Nobody via the client.** Only the `request_introduction` RPC (reviewed, security-definer). |

## What we deliberately do NOT store

- No precise location, GPS, or movement history — only cafe presence booleans + a check timestamp.
- No facts scraped from LinkedIn — identifier only.
- No counterpart PII in the client — mediated by RPCs.
- No "matched/rejected" status exposed between people — a pass simply ends the introduction quietly.
- No age/identity claims.

## Retention (planned)

- `recommendations` / `visit_intro_sessions` expire on their `expires_at`; a retention job (not yet built) sweeps `recognition_media` at `expires_at` and hard-deletes storage objects. Feedback and analytics are retained as aggregate product signal.
