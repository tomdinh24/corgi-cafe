import { z } from "zod";
import { isLinkedInUrl, withTimeout } from "@corgi/onboarding-shared";
import { fetchUrlContents, searchPersonWeb, type UrlContent } from "./provider";

// Shared enrichment pipeline used by BOTH the live onboarding route (app/api/enrich) and the Demo
// seeder (lib/demoSeed), so a curated demo person carries the exact same derived profile a real member
// gets after onboarding. It builds the `web` block folded into profiles.enrichment: what the person's
// company does, company stage, hiring, founder status, focus areas, an investor thesis, and a short
// digest, all grounded in the member's own confirmed URLs plus anchored public web results.
//
// Hard rule: LinkedIn is an identifier only. This pipeline NEVER sends a LinkedIn URL to Exa/OpenAI to
// fetch, summarize, or extract it, and drops any LinkedIn result that turns up in a web search.

export const WebEnrichmentSchema = z.object({
  // What the member's company actually does (product / industry / what they build), so the matcher can
  // reason on company context, not just a company name.
  companyDescription: z.string().trim().max(400).optional(),
  companyStage: z.string().trim().max(40).optional(),
  isFounder: z.boolean().optional(),
  hiring: z.boolean().optional(),
  focusAreas: z.array(z.string().trim().max(60)).max(6).optional(),
  firmThesis: z.string().trim().max(300).optional(),
  digest: z.string().trim().max(400).optional(),
  // The model's confidence that the name-based web results describe the ANCHOR person (not a same-name
  // other). Person-web signal is only trusted at "high"; below that we fall back to grounded sources.
  webConfidence: z.enum(["high", "medium", "low"]).optional(),
});
export type WebSignal = z.infer<typeof WebEnrichmentSchema>;

// Bumped when the pipeline's shape changes; the Demo seeder rebuilds a person whose stored enrichment
// predates the current version, so old hand-authored blobs are replaced by real derived signal.
export const ENRICHMENT_PIPELINE_VERSION = 1;

function httpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

// The pages where the signal actually lives — stage, hiring, and founder info sit on About/Careers/
// Team, not the marketing homepage. Exa's own subpage targeting is loose, so we target these directly
// and let Exa drop the ones that 404.
const SUBPATHS = ["about", "about-us", "company", "team", "careers", "jobs"];

// Expands each confirmed URL into the set worth fetching: a personal/company site fans out to its
// high-signal subpages; a GitHub profile is left alone (the profile page IS the signal). LinkedIn is
// excluded entirely — it is an identifier only and must never be fetched or extracted.
function expandSourceUrls(rawUrls: string[]): string[] {
  const out = new Set<string>();
  for (const raw of rawUrls) {
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      continue;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") continue;
    if (isLinkedInUrl(url.toString())) continue; // never fetch LinkedIn
    out.add(url.toString());
    const host = url.host.toLowerCase();
    if (host.endsWith("github.com")) continue; // profile page is the signal; no subpaths
    const origin = `${url.protocol}//${url.host}`;
    for (const path of SUBPATHS) out.add(`${origin}/${path}`);
  }
  return Array.from(out).slice(0, 10);
}

// Belt-and-suspenders: even though we never request LinkedIn, drop any LinkedIn result that a web
// search surfaces, so no LinkedIn text is ever summarized.
function dropLinkedIn(contents: UrlContent[]): UrlContent[] {
  return contents.filter((c) => {
    try {
      return !isLinkedInUrl(c.url);
    } catch {
      return true;
    }
  });
}

// The confirmed identity — from the URLs the member claimed as their own + what they confirmed at
// onboarding. Everything the extractor accepts must align with THIS person, never a same-name other.
type Anchor = { name: string; company?: string; role?: string; location?: string; headline?: string; pastCompanies?: string[] };

// Builds the strictly-grounded, anchor-aligned signal. `ownSources` (the member's claimed URLs plus
// their company's own site) are trusted as ground truth; `webResults` (name-based search) are admitted
// ONLY when they clearly line up with the anchor — so enrichment deepens the confirmed identity instead
// of conflating strangers.
async function extractSignal(anchor: Anchor, ownSources: UrlContent[], webResults: UrlContent[]): Promise<WebSignal | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const trim = (list: UrlContent[]) => list.map((c) => ({ url: c.url, title: c.title, text: c.text }));
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0,
        max_tokens: 320,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You build a professional profile for ONE specific person: the CONFIRMED person described in `anchor` — the identity they claimed via their own URLs. " +
              "`ownSources` are pages from URLs they claimed as their own AND pages about their stated company — trust these as ground truth. " +
              "`anchor.company` is a CONFIRMED fact. Describe what THAT company does (companyDescription), its stage (companyStage), and its focus areas from the company pages in ownSources — fill these EVEN IF you cannot confirm the person in webResults, because they describe the company, not the person. When ownSources mention more than one company sharing the name, use the one consistent with the anchor (its role, location, or listed site) and ignore the others. " +
              "`webResults` are name-based search hits that MAY describe DIFFERENT people who happen to share the name. Admit a PERSON fact (isFounder, firmThesis, personal claims in the digest) ONLY when you are HIGHLY confident it is the SAME person as the anchor. If not, ignore webResults for person facts. NEVER merge facts from a same-name different person. " +
              "Use ONLY grounded facts; omit any field you cannot support. " +
              "Return JSON with optional fields: companyDescription (one neutral phrase on what `anchor.company` actually does — its product, industry, or what it builds), companyStage (pre-seed, seed, series a, series b, series c+, growth, public, bootstrapped, nonprofit, agency, student — only if indicated), isFounder, hiring (open roles / 'we're hiring'), focusAreas (up to 6 short tags for the person's or company's areas), firmThesis (if an investor, their focus in one phrase), digest (1-2 neutral sentences on who they are and what they're working on), and webConfidence ('high' | 'medium' | 'low' = how confident you are that the webResults describe the anchor person, not a same-name other). " +
              "Return {} only if you have NEITHER a company description NOR any confident person fact.",
          },
          { role: "user", content: JSON.stringify({ anchor, ownSources: trim(ownSources), webResults: trim(webResults) }) },
        ],
      }),
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content;
    if (typeof text !== "string") return null;
    const raw = JSON.parse(text) as Record<string, unknown>;
    // Clamp rather than reject: a slightly-too-long field from the model should trim, not nuke the whole
    // enrichment (a 330-char company description shouldn't throw away a perfectly good profile).
    const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
    const bool = (v: unknown) => (typeof v === "boolean" ? v : undefined);
    const web: WebSignal = {
      companyDescription: str(raw.companyDescription, 400),
      companyStage: str(raw.companyStage, 40),
      isFounder: bool(raw.isFounder),
      hiring: bool(raw.hiring),
      focusAreas: Array.isArray(raw.focusAreas)
        ? raw.focusAreas.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, 60)).filter(Boolean).slice(0, 6)
        : undefined,
      firmThesis: str(raw.firmThesis, 300),
      digest: str(raw.digest, 400),
      webConfidence: raw.webConfidence === "high" || raw.webConfidence === "medium" || raw.webConfidence === "low" ? raw.webConfidence : undefined,
    };
    const cleaned = Object.fromEntries(
      Object.entries(web).filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0)),
    ) as WebSignal;
    return Object.keys(cleaned).length ? cleaned : null;
  } catch {
    return null;
  }
}

export type MemberEnrichmentInput = {
  name: string;
  company?: string | null;
  role?: string | null;
  location?: string | null;
  // Existing enrichment to preserve (Tier-A: headline, isFounder, currentCompany, pastCompanies from
  // the confirmed people-search candidate). The freshly derived `web` block is merged on top.
  base: Record<string, unknown>;
  // The member's confirmed source URLs (any LinkedIn among them is used only to decide we have a
  // claimed identity — it is never fetched).
  sourceUrls: string[];
};

export type MemberEnrichmentOutcome =
  | { status: "enriched"; enrichment: Record<string, unknown>; web: WebSignal }
  | { status: "skipped"; reason: "no_content" | "no_signal" | "low_confidence" };

// Runs the full Tier B (own URLs) + company-site + Tier C (anchored web) enrichment and returns the
// merged enrichment object to persist. Best-effort: any fetch/model failure degrades to a skip.
export async function buildMemberEnrichment(input: MemberEnrichmentInput): Promise<MemberEnrichmentOutcome> {
  const base = input.base && typeof input.base === "object" ? input.base : {};
  const anchor: Anchor = {
    name: input.name,
    company: input.company || undefined,
    role: input.role || undefined,
    location: input.location || undefined,
    headline: typeof base.headline === "string" ? base.headline : undefined,
    pastCompanies: Array.isArray(base.pastCompanies) ? (base.pastCompanies as string[]).slice(0, 8) : undefined,
  };

  const rawUrls = input.sourceUrls.map(httpUrl).filter((u): u is string => Boolean(u));
  const hasClaimedIdentity = rawUrls.some((u) => isLinkedInUrl(u)) || Boolean(anchor.headline);

  // Tier B: the member's own claimed URLs (LinkedIn excluded), expanded to their About/Careers pages.
  const urls = expandSourceUrls(rawUrls);
  let ownContents: UrlContent[] = [];
  if (urls.length) {
    try {
      ownContents = dropLinkedIn(await withTimeout((signal) => fetchUrlContents(urls, signal)));
    } catch {
      /* keep going — the company + web searches below may still find signal */
    }
  }

  // Company site derived from the company NAME — only when the member listed no own website to read
  // the company from (e.g. LinkedIn-only). This captures "what the company does" for that case, while
  // avoiding same-name conflation for members who gave us their actual company URL (we read that above).
  if (anchor.company && urls.length === 0) {
    try {
      const companyHits = dropLinkedIn(await withTimeout((signal) => searchPersonWeb(`${anchor.company} company official site what they do product`, signal)));
      ownContents = ownContents.concat(companyHits).slice(0, 12);
    } catch {
      /* best-effort */
    }
  }

  // Tier C: public web results about the person — only when there's a confident anchor to align them.
  let webResults: UrlContent[] = [];
  if (input.name && hasClaimedIdentity) {
    try {
      const query = [input.name, input.company, input.location].filter(Boolean).join(" ").trim();
      webResults = dropLinkedIn(await withTimeout((signal) => searchPersonWeb(query, signal)));
    } catch {
      /* best-effort */
    }
  }

  if (!ownContents.length && !webResults.length) return { status: "skipped", reason: "no_content" };

  const web = await extractSignal(anchor, ownContents, webResults);
  if (!web) return { status: "skipped", reason: "no_signal" };

  // High-confidence guardrail: never store person-web-derived enrichment we can't ground. Company-site
  // and own-URL contents count as grounding; with none of those, only keep signal when the model is
  // highly confident the web results are this person (not a same-name other).
  if (!ownContents.length && web.webConfidence !== "high") return { status: "skipped", reason: "low_confidence" };

  const enrichment = {
    ...base,
    web: {
      ...web,
      pipelineVersion: ENRICHMENT_PIPELINE_VERSION,
      sources: [...ownContents, ...webResults].map((c) => c.url).slice(0, 8),
    },
  };
  return { status: "enriched", enrichment, web };
}
