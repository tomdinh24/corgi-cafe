import { NextResponse } from "next/server";
import { getSupabaseConfig, isDevLoginEnabled } from "../../../lib/supabase";

export async function GET() {
  const mode = getSupabaseConfig().mode;
  // How the client should run sign-in: preview (no DB), dev (any code), or otp (real Supabase email
  // code). We use a same-tab 6-digit code rather than a magic link so sign-in works in private/
  // incognito on mobile, where tapping the emailed link opens a separate cookie jar and the PKCE
  // code-verifier is missing (magic-link exchange fails). The code is entered in the same tab, so
  // it needs no verifier cookie.
  const authMode = mode === "setup_required" ? "preview" : isDevLoginEnabled() ? "dev" : "otp";
  return NextResponse.json({
    supabase: mode,
    exa: process.env.EXA_API_KEY ? "configured" : "setup_required",
    authMode,
  });
}

