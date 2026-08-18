import { NextResponse } from "next/server";
import { reserveEnrichment } from "../../../lib/budget";
import { buildMemberEnrichment, ENRICHMENT_PIPELINE_VERSION } from "../../../lib/enrichment";
import { createCorgiServerClient, getSupabaseConfig } from "../../../lib/supabase";

export const runtime = "nodejs";

// Enriches the signed-in member's profile from the public URLs they confirmed during onboarding and
// their company's own site. Best-effort and idempotent-safe: called fire-and-forget after the profile
// saves AND on hub entry, never blocking onboarding or matching. The Tier B/company/Tier C logic lives
// in lib/enrichment (shared with the Demo seeder) so a demo person carries the exact same derived
// profile a real member does. Merges a `web` section into profiles.enrichment (preserving Tier-A fields).
//
// Version-guarded so it is safe to call on every hub load: a member whose `web` block is already at the
// current ENRICHMENT_PIPELINE_VERSION is a cheap no-op (one read, no model calls, no budget spent). Only
// a missing or older-version block triggers a rebuild — so a member who onboarded before a pipeline bump
// (e.g. stale Tier-A-only, or a pre-compliance LinkedIn-sourced block) refreshes the next time they
// return, instead of keeping stale enrichment forever.
export async function POST() {
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.json({ status: "preview_only" });
  }
  const supabase = await createCorgiServerClient();
  const { data: auth, error: authError } = await supabase!.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ message: "Sign in again." }, { status: 401 });
  const memberId = auth.user.id;

  const { data: profile } = await supabase!
    .from("profiles")
    .select("first_name,last_name,role_title,company_or_project,broad_location,enrichment")
    .eq("member_id", memberId)
    .maybeSingle();

  const base = (profile?.enrichment && typeof profile.enrichment === "object" ? profile.enrichment : {}) as Record<string, unknown>;
  // Version guard: if the web block is already current, there is nothing to do — return before touching
  // the rate-limiter or the model so repeated hub-load calls stay free.
  const existingWeb = base.web as { pipelineVersion?: unknown } | undefined;
  if (existingWeb && typeof existingWeb === "object" && existingWeb.pipelineVersion === ENRICHMENT_PIPELINE_VERSION) {
    return NextResponse.json({ status: "fresh" });
  }

  if (!reserveEnrichment(memberId)) return NextResponse.json({ status: "rate_limited" });

  const { data: sourceRows } = await supabase!
    .from("profile_sources")
    .select("source_url")
    .eq("member_id", memberId);

  const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  // Strip any stale web block from the Tier-A base so an older-version (e.g. pre-compliance) block is
  // never carried forward — the rebuild's fresh web replaces it, and a skip stamps a clean marker.
  const { web: _staleWeb, ...baseNoWeb } = base;

  const outcome = await buildMemberEnrichment({
    name,
    company: (profile?.company_or_project as string) || undefined,
    role: (profile?.role_title as string) || undefined,
    location: (profile?.broad_location as string) || undefined,
    base: baseNoWeb,
    sourceUrls: (sourceRows ?? []).map((s) => s.source_url as string).filter(Boolean),
  });

  if (outcome.status === "skipped") {
    // Stamp the current version with an empty web block so a member with no derivable signal is not
    // re-enriched on every hub load — the guard above will treat them as current next time.
    await supabase!
      .from("profiles")
      .update({ enrichment: { ...baseNoWeb, web: { pipelineVersion: ENRICHMENT_PIPELINE_VERSION, sources: [] } } })
      .eq("member_id", memberId);
    return NextResponse.json({ status: "skipped", reason: outcome.reason });
  }

  const { error: writeError } = await supabase!.from("profiles").update({ enrichment: outcome.enrichment }).eq("member_id", memberId);
  if (writeError) return NextResponse.json({ status: "error" }, { status: 502 });

  return NextResponse.json({ status: "enriched", web: outcome.web });
}
