import { NextResponse } from "next/server";
import { z } from "zod";
import { withTimeout } from "@corgi/onboarding-shared";
import { reserveEnrichment } from "../../../lib/budget";
import { fetchUrlContents, searchPersonWeb, type UrlContent } from "../../../lib/provider";
import { createCorgiServerClient, getSupabaseConfig } from "../../../lib/supabase";

export const runtime = "nodejs";

// What we extract from a member's own confirmed URLs and fold into their profile enrichment, so the
// matcher can reason about company stage, hiring, and (for investors) thesis — not just a typed line.
const WebEnrichmentSchema = z.object({
  companyStage: z.string().trim().max(40).optional(),
  isFounder: z.boolean().optional(),
  hiring: z.boolean().optional(),
  focusAreas: z.array(z.string().trim().max(60)).max(6).optional(),
  firmThesis: z.string().trim().max(300).optional(),
  digest: z.string().trim().max(400).optional(),
  // The model's confidence that the web results describe the ANCHOR person (not a same-name other).
  // Web-derived signal is only trusted at "high"; below that we fall back to the claimed URLs alone.
  webConfidence: z.enum(["high", "medium", "low"]).optional(),
});

function httpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

// The pages where the signal actually lives — stage, hiring, and founder info sit on About/Careers/
// Team, not the marketing homepage. Exa's own subpage targeting is loose, so we target these paths
// directly and let Exa drop the ones that 404.
const SUBPATHS = ["about", "about-us", "company", "team", "careers", "jobs"];

// Expands each confirmed URL into the set worth fetching: a personal/company site fans out to its
// high-signal subpages; a LinkedIn or GitHub profile is left alone (the profile page IS the signal).
// Capped so a member with several links can't blow up cost/latency.
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
    out.add(url.toString());
    const host = url.host.toLowerCase();
    if (host.endsWith("linkedin.com") || host.endsWith("github.com")) continue;
    const origin = `${url.protocol}//${url.host}`;
    for (const path of SUBPATHS) out.add(`${origin}/${path}`);
  }
  return Array.from(out).slice(0, 10);
}

// The confirmed identity — from the URLs the member claimed as their own + what they confirmed at
// onboarding. Everything the extractor accepts must align with THIS person, never a same-name other.
type Anchor = { name: string; company?: string; role?: string; location?: string; headline?: string; pastCompanies?: string[] };

// Builds the strictly-grounded, anchor-aligned signal. `ownSources` (the member's claimed URLs) are
// trusted as ground truth; `webResults` (name-based search) are admitted ONLY when they clearly line
// up with the anchor — so enrichment deepens the confirmed identity instead of conflating strangers.
async function extractSignal(anchor: Anchor, ownSources: UrlContent[], webResults: UrlContent[]): Promise<z.infer<typeof WebEnrichmentSchema> | null> {
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
        max_tokens: 300,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You build a professional profile for ONE specific person: the CONFIRMED person described in `anchor` — the identity they claimed via their own URLs. " +
              "`ownSources` are pages from URLs they claimed as their own — trust these as ground truth about the anchor person. " +
              "`webResults` are name-based search hits that MAY describe DIFFERENT people who happen to share the name. Admit a web fact ONLY when you are HIGHLY confident it is the SAME person as the anchor (matching current or past employer, role, school, location, or facts consistent with ownSources). If you are not highly confident, IGNORE webResults entirely and profile from ownSources alone. DISCARD anything that conflicts with the anchor. NEVER merge facts from a same-name different person. " +
              "Use ONLY grounded facts; omit any field you cannot support. " +
              "Return JSON with optional fields: companyStage (pre-seed, seed, series a, series b, series c+, growth, public, bootstrapped, nonprofit, agency, student — only if indicated), isFounder, hiring (open roles / 'we're hiring'), focusAreas (up to 6 short tags), firmThesis (if an investor, their focus in one phrase), digest (1-2 neutral sentences on who they are and what they're working on), and webConfidence ('high' | 'medium' | 'low' = how confident you are that the webResults describe the anchor person, not a same-name other). " +
              "If evidence is thin, or you cannot confirm the web results are the same person as the anchor, rely on ownSources alone; if even those are thin, return {}.",
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
    const parsed = WebEnrichmentSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return null;
    // Drop empty-object / all-undefined results.
    return Object.values(parsed.data).some((v) => v !== undefined) ? parsed.data : null;
  } catch {
    return null;
  }
}

// Enriches the signed-in member's profile from the public URLs they confirmed during onboarding.
// Best-effort and idempotent-safe: called fire-and-forget after the profile saves, never blocking
// onboarding or matching. Merges a `web` section into profiles.enrichment (preserving Tier-A fields).
export async function POST() {
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.json({ status: "preview_only" });
  }
  const supabase = await createCorgiServerClient();
  const { data: auth, error: authError } = await supabase!.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ message: "Sign in again." }, { status: 401 });
  const memberId = auth.user.id;

  if (!reserveEnrichment(memberId)) return NextResponse.json({ status: "rate_limited" });

  const { data: profile } = await supabase!
    .from("profiles")
    .select("first_name,last_name,role_title,company_or_project,broad_location,enrichment")
    .eq("member_id", memberId)
    .maybeSingle();
  const { data: sourceRows } = await supabase!
    .from("profile_sources")
    .select("source_url")
    .eq("member_id", memberId);

  const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  const company = (profile?.company_or_project as string) ?? "";
  const base = (profile?.enrichment && typeof profile.enrichment === "object" ? profile.enrichment : {}) as Record<string, unknown>;

  // The anchor is the identity the member confirmed: their claimed URLs plus the Tier-A signal from
  // the candidate they picked. Web enrichment must align to THIS, never a same-name stranger.
  const anchor: Anchor = {
    name,
    company: company || undefined,
    role: (profile?.role_title as string) || undefined,
    location: (profile?.broad_location as string) || undefined,
    headline: typeof base.headline === "string" ? base.headline : undefined,
    pastCompanies: Array.isArray(base.pastCompanies) ? (base.pastCompanies as string[]).slice(0, 8) : undefined,
  };

  const rawUrls = (sourceRows ?? []).map((s) => httpUrl(s.source_url as string)).filter((u): u is string => Boolean(u));
  const isLinkedIn = (u: string) => {
    try { return new URL(u).host.toLowerCase().endsWith("linkedin.com"); } catch { return false; }
  };
  // Tier B/C are only meaningful once there's a confirmed identity to anchor on — a claimed LinkedIn
  // or a candidate the member picked (which gives the Tier-A headline). Without that anchor, a
  // name-only web search can't be trusted, so Tier C is skipped.
  const hasClaimedIdentity = rawUrls.some(isLinkedIn) || Boolean(anchor.headline);

  // Tier B: the member's own claimed URLs, expanded to their About/Careers/Team pages.
  const urls = expandSourceUrls(rawUrls);
  let contents: UrlContent[] = [];
  if (urls.length) {
    try {
      contents = await withTimeout((signal) => fetchUrlContents(urls, signal));
    } catch {
      /* keep going — the anchored web search below may still find signal */
    }
  }

  // Tier C: public web results — only when we have a confident anchor to align them against.
  let webFindings: UrlContent[] = [];
  if (name && hasClaimedIdentity) {
    try {
      const query = [name, company, profile?.broad_location].filter(Boolean).join(" ").trim();
      webFindings = await withTimeout((signal) => searchPersonWeb(query, signal));
    } catch {
      /* best-effort */
    }
  }

  if (!contents.length && !webFindings.length) return NextResponse.json({ status: "skipped", reason: "no_content" });

  const web = await extractSignal(anchor, contents, webFindings);
  if (!web) return NextResponse.json({ status: "skipped", reason: "no_signal" });

  // High-confidence guardrail: never store web-derived enrichment we can't tie to this person. If
  // nothing came from the member's own URLs and the model isn't highly confident the web results are
  // the same person, drop it rather than risk a same-name mixup.
  if (!contents.length && web.webConfidence !== "high") {
    return NextResponse.json({ status: "skipped", reason: "low_confidence" });
  }

  const merged = { ...base, web: { ...web, sources: [...contents, ...webFindings].map((c) => c.url).slice(0, 8) } };
  const { error: writeError } = await supabase!.from("profiles").update({ enrichment: merged }).eq("member_id", memberId);
  if (writeError) return NextResponse.json({ status: "error" }, { status: 502 });

  return NextResponse.json({ status: "enriched", web });
}
