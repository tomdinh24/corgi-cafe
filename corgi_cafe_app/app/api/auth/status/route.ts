import { NextResponse } from "next/server";
import { createCorgiServerClient, getSupabaseConfig } from "../../../../lib/supabase";

// Lightweight session check used on load so a member returning from a magic link (or a fresh
// visit with a live cookie) resumes already signed in, with any previously saved profile, rather
// than re-entering the email step and redoing onboarding from scratch.
export async function GET() {
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.json({ authenticated: false });
  }
  const supabase = await createCorgiServerClient();
  const { data, error } = await supabase!.auth.getUser();
  if (error || !data.user) return NextResponse.json({ authenticated: false });
  const { data: profile } = await supabase!
    .from("profiles")
    .select("first_name,last_name,broad_location,role_title,company_or_project,about_me,current_work,favorite_drink,avatar_url,confirmed_at")
    .eq("member_id", data.user.id)
    .maybeSingle();
  const { data: sources } = await supabase!
    .from("profile_sources")
    .select("source_kind,source_url")
    .eq("member_id", data.user.id);

  // Surface any live session so the client can resume after a refresh: a matched member returns to
  // their introduction, a waiting member returns to the "still looking" screen (which re-arms
  // polling). Own-rows only (RLS scopes visit_intro_sessions to member_id = auth.uid()).
  const { data: session } = await supabase!
    .from("visit_intro_sessions")
    .select("id,status,expires_at,cafe_code")
    .eq("member_id", data.user.id)
    .in("status", ["searching", "introduced", "meeting"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  let activeSession: { id: string; status: string; cafeCode: string } | null = null;
  let activeRecommendationId: string | null = null;
  let introducedAt: string | null = null;
  if (session) {
    const notExpired = new Date(session.expires_at as string) > new Date();
    // A waiting session only matters while unexpired; a match stays resumable so a dropped
    // connection never loses the introduction.
    if (session.status !== "searching" || notExpired) {
      activeSession = { id: session.id as string, status: session.status as string, cafeCode: (session.cafe_code as string) ?? "" };
      if (session.status !== "searching") {
        const { data: statusRow } = await supabase!.rpc("get_my_session_status", { target_session_id: session.id });
        const row = Array.isArray(statusRow) ? statusRow[0] : statusRow;
        activeRecommendationId = (row?.recommendation_id as string) ?? null;
        // When the match started — the client counts the 5-minute window from here so a refresh
        // resumes the same countdown instead of restarting it.
        if (activeRecommendationId) {
          const { data: rec } = await supabase!
            .from("recommendations")
            .select("introduced_at")
            .eq("id", activeRecommendationId)
            .maybeSingle();
          introducedAt = (rec?.introduced_at as string) ?? null;
        }
      }
    }
  }

  return NextResponse.json({
    authenticated: true,
    email: data.user.email ?? "",
    activeSession,
    activeRecommendationId,
    introducedAt,
    profile: profile
      ? {
          firstName: profile.first_name,
          lastName: profile.last_name,
          broadLocation: profile.broad_location ?? "",
          roleTitle: profile.role_title ?? "",
          companyOrProject: profile.company_or_project ?? "",
          aboutMe: profile.about_me ?? "",
          currentWork: profile.current_work ?? "",
          favoriteDrink: profile.favorite_drink ?? "",
          avatarUrl: profile.avatar_url ?? "",
          confirmed: Boolean(profile.confirmed_at),
        }
      : null,
    sources: (sources ?? []).map((s) => ({ kind: s.source_kind as string, url: s.source_url as string })),
  });
}
