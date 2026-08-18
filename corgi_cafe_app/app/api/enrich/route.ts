import { NextResponse } from "next/server";
import { reserveEnrichment } from "../../../lib/budget";
import { buildMemberEnrichment } from "../../../lib/enrichment";
import { createCorgiServerClient, getSupabaseConfig } from "../../../lib/supabase";

export const runtime = "nodejs";

// Enriches the signed-in member's profile from the public URLs they confirmed during onboarding and
// their company's own site. Best-effort and idempotent-safe: called fire-and-forget after the profile
// saves, never blocking onboarding or matching. The Tier B/company/Tier C logic lives in lib/enrichment
// (shared with the Demo seeder) so a demo person carries the exact same derived profile a real member
// does. Merges a `web` section into profiles.enrichment (preserving Tier-A fields).
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
  const base = (profile?.enrichment && typeof profile.enrichment === "object" ? profile.enrichment : {}) as Record<string, unknown>;

  const outcome = await buildMemberEnrichment({
    name,
    company: (profile?.company_or_project as string) || undefined,
    role: (profile?.role_title as string) || undefined,
    location: (profile?.broad_location as string) || undefined,
    base,
    sourceUrls: (sourceRows ?? []).map((s) => s.source_url as string).filter(Boolean),
  });

  if (outcome.status === "skipped") return NextResponse.json({ status: "skipped", reason: outcome.reason });

  const { error: writeError } = await supabase!.from("profiles").update({ enrichment: outcome.enrichment }).eq("member_id", memberId);
  if (writeError) return NextResponse.json({ status: "error" }, { status: 502 });

  return NextResponse.json({ status: "enriched", web: outcome.web });
}
