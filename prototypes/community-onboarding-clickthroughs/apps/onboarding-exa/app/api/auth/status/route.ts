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
    .select("first_name,last_name,broad_location,role_title,company_or_project,about_me,current_work,favorite_drink,confirmed_at")
    .eq("member_id", data.user.id)
    .maybeSingle();
  return NextResponse.json({
    authenticated: true,
    email: data.user.email ?? "",
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
          confirmed: Boolean(profile.confirmed_at),
        }
      : null,
  });
}
