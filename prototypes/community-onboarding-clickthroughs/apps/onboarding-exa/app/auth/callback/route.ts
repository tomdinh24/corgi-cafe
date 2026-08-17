import { NextRequest, NextResponse } from "next/server";
import { createCorgiServerClient, getSupabaseConfig } from "../../../lib/supabase";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code && getSupabaseConfig().mode === "configured") {
    const supabase = await createCorgiServerClient();
    const { error } = await supabase!.auth.exchangeCodeForSession(code);
    // Return into the app (not the marketing landing); ExaOnboarding sees the live session on
    // load and resumes at the right URL (onboarding or home) once it resolves.
    if (!error) return NextResponse.redirect(new URL("/onboarding?auth=ok", request.url));
  }
  return NextResponse.redirect(new URL("/sign-in?auth=failed", request.url));
}

