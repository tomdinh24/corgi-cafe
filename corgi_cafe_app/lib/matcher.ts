// LLM re-ranker for Corgi matching. The SQL layer supplies an already hard-filtered pool of
// eligible candidates (same cafe, both searching, compatible boundaries, etc.); this picks the ONE
// best counterpart by reasoning over the free-text intent + bios that the deterministic sort could
// only treat as booleans. It returns null (→ caller falls back to the deterministic pick) on any
// missing key, timeout, bad output, or a below-threshold best — so a bad/slow model never blocks or
// forces a poor introduction.

export type PersonBlob = {
  sessionId?: string;
  firstName?: string | null;
  roleTitle?: string | null;
  company?: string | null;
  aboutMe?: string | null;
  currentWork?: string | null;
  topics?: string[] | null;
  wantsHelpWith?: string | null;
  canOffer?: string | null;
  // Career context derived from the people-search profile (headline, is-founder, past companies).
  background?: Record<string, unknown> | null;
};

// Both directional reasons come from the single ranking call: `reason` is for the requester (about
// the chosen counterpart), `counterpartReason` is for the counterpart (about the requester). The
// model already reasons over both people's context to make the pick, so it drafts both here rather
// than paying for a second round-trip.
export type RankedMatch = { sessionId: string; score: number; reason: string; counterpartReason: string };

// Learned from this member's own past introductions (Tier C flywheel): counterpart types they chose
// to continue with / rated well ("liked"), vs. passed on / rated poorly ("passed"). Empty until real
// feedback exists, in which case it's simply omitted from the prompt.
export type PreferenceHint = { liked?: string[]; passed?: string[] };

// Below this the queue holds no one worth introducing — return an honest no-match instead.
const MIN_SCORE = 55;
const MODEL = "gpt-4.1-mini";
const TIMEOUT_MS = 6000;

// Trim the stored enrichment to the fields useful for ranking (drop the raw role list to keep the
// prompt lean); `web` carries the URL-derived signal (company stage, hiring, investor thesis, digest).
function leanBackground(bg: PersonBlob["background"]) {
  if (!bg || typeof bg !== "object") return undefined;
  const src = bg as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of ["headline", "isFounder", "currentCompany", "pastCompanies", "web"]) {
    const value = src[key];
    if (value === undefined || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).length === 0) continue;
    out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

function compact(p: PersonBlob) {
  const background = leanBackground(p.background);
  return {
    firstName: p.firstName ?? "Someone",
    role: p.roleTitle ?? undefined,
    company: p.company ?? undefined,
    about: p.aboutMe ?? undefined,
    currentWork: p.currentWork ?? undefined,
    topics: p.topics?.length ? p.topics : undefined,
    wantsHelpWith: p.wantsHelpWith ?? undefined,
    canOffer: p.canOffer ?? undefined,
    background,
  };
}

// One-directional reason writer, used for the counterpart's side of an introduction. rankBestMatch
// answers "is this a good enough match?" (and returns null below MIN_SCORE); this is different — the
// match is already committed, we just need a grounded sentence telling `viewer` why meeting
// `counterpart` is worthwhile. No scoring, no threshold, so the second person never degrades to a
// generic fallback just because their side scored a hair lower. Returns "" on any failure → the
// caller falls back to the deterministic sentence.
export async function describeReason(viewer: PersonBlob, counterpart: PersonBlob): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return "";
  const model = { you: compact(viewer), personYouWouldMeet: compact(counterpart) };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: 90,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You write the single-sentence reason one person should meet another for a short, in-person chat at a cafe. You are given `you` (the reader) and `personYouWouldMeet`. A worthwhile reason can be practical (their offer meets your ask, or yours meets theirs), a shared goal or topic, or simply an interesting conversation in its own right. Use the `background` (career headline, founder status, past companies, and a `web` section describing what their company does, its stage, hiring, or an investor's thesis) as real signal when present. " +
              "Return ONLY JSON: {\"reason\": string}. " +
              "reason is one warm, natural sentence under 30 words, shown to `you` on a card ABOUT `personYouWouldMeet`. Describe `personYouWouldMeet` BY THEIR FIRST NAME (their role, work, background, or what they want) plus how meeting them connects to your own goals or interests (\"...matching your interest in ...\"). Attribute every role and trait to `personYouWouldMeet` — never write \"your\" about their job or merge the two of you into one person. Ground it ONLY in the given facts; never invent; if the gain is modest, be honest. Do NOT name their company; refer to it by WHAT IT DOES instead (say 'a robotics company' or 'someone building a crypto exchange', never 'Atoms' or 'Coinbase').",
          },
          { role: "user", content: JSON.stringify(model) },
        ],
      }),
    });
    clearTimeout(timeout);
    if (!response.ok) return "";
    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content;
    if (typeof text !== "string") return "";
    const parsed = JSON.parse(text) as { reason?: unknown };
    return typeof parsed.reason === "string" ? parsed.reason.trim().slice(0, 300) : "";
  } catch {
    return "";
  }
}

export async function rankBestMatch(requester: PersonBlob, candidates: PersonBlob[], preference?: PreferenceHint | null): Promise<RankedMatch | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  const pool = candidates.filter((c) => typeof c.sessionId === "string" && c.sessionId);
  if (!apiKey || pool.length === 0) return null;

  // A single real candidate is the only possible pick — still score it so a genuinely poor pairing
  // can fall below threshold rather than being force-matched.
  const idBySession = new Map(pool.map((c) => [c.sessionId as string, c] as const));
  const preferenceHint =
    preference && ((preference.liked?.length ?? 0) > 0 || (preference.passed?.length ?? 0) > 0)
      ? { liked: preference.liked?.slice(0, 5), passed: preference.passed?.slice(0, 5) }
      : undefined;
  const model = {
    requester: compact(requester),
    candidates: pool.map((c) => ({ sessionId: c.sessionId, ...compact(c) })),
    ...(preferenceHint ? { preferenceHint } : {}),
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: 320,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You match one person at a cafe with the single best counterpart for a short, in-person conversation. A great match is simply one both people would be glad they had. That value can come from any of: (a) practical fit — one person's ask meets the other's offer; (b) shared goals or overlapping topics; or (c) an interesting conversation in its own right — a genuine shared curiosity, a niche interest in common, or complementary experiences/perspectives worth trading. Weigh all three: a strong human-interest connection can outrank a purely transactional one. Reason over the actual free-text intent and bios, not just the topic labels. When a candidate has a `background` (career headline, whether they're a founder, past companies, and a `web` section with what their company does, its stage, whether they're hiring, or an investor's focus/thesis), use it as real signal — e.g. a seed-stage founder raising money and an investor whose thesis fits, someone hiring and someone job-seeking, or shared past employers. If a `preferenceHint` is present, it summarizes counterpart types this requester previously valued (`liked`) or declined (`passed`) — nudge with it, but the current candidates' actual fit still dominates. Be honest — if no one is a good fit on any of these, score low rather than forcing a match." +
              "Return ONLY JSON: {\"bestSessionId\": string, \"score\": number 0-100, \"reason\": string, \"counterpartReason\": string}. " +
              "bestSessionId MUST be one of the given candidate sessionIds. score is your confidence this is a worthwhile match both would value. " +
              "Write TWO reasons, each one warm, natural sentence under 30 words, grounded ONLY in the given facts — never invent names, jobs, or details. Each reason is shown to one person on a card ABOUT the other person, so write each as a description of the OTHER person BY THEIR FIRST NAME (their role, work, background, or what they want) plus how meeting them connects to the reader's own goals or interests (\"...matching your interest in ...\"). `reason` is shown to the REQUESTER, so it describes the CHOSEN CANDIDATE by name. `counterpartReason` is shown to the CHOSEN CANDIDATE, so it describes the REQUESTER by name. Attribute every role and trait to the correct named person — never write \"your\" about the other person's job, and never merge the two people into one. If one side gains less, stay honest and modest rather than inventing value. In BOTH, do NOT name either person's company; refer to it by WHAT IT DOES instead (say 'a robotics company' or 'someone building a crypto exchange', never 'Atoms' or 'Coinbase').",
          },
          { role: "user", content: JSON.stringify(model) },
        ],
      }),
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content;
    if (typeof text !== "string") return null;
    const parsed = JSON.parse(text) as { bestSessionId?: unknown; score?: unknown; reason?: unknown; counterpartReason?: unknown };

    const sessionId = typeof parsed.bestSessionId === "string" ? parsed.bestSessionId : "";
    const chosen = idBySession.get(sessionId);
    if (!chosen) return null; // model hallucinated an id — fall back to deterministic.
    const score = typeof parsed.score === "number" ? parsed.score : 0;
    if (score < MIN_SCORE) return null; // honest no-match rather than a weak introduction.
    const reason = typeof parsed.reason === "string" ? parsed.reason.trim().slice(0, 300) : "";
    const counterpartReason = typeof parsed.counterpartReason === "string" ? parsed.counterpartReason.trim().slice(0, 300) : "";
    return { sessionId, score, reason, counterpartReason };
  } catch {
    return null;
  }
}
