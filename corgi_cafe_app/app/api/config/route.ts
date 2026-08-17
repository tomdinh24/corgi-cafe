import { NextResponse } from "next/server";
import { getSupabaseConfig, isDevLoginEnabled } from "../../../lib/supabase";

export async function GET() {
  const mode = getSupabaseConfig().mode;
  // How the client should run sign-in: preview (no DB), dev (any code), or password (real Supabase
  // email + password). We use email + password rather than a magic link / email OTP so sign-in works
  // for any user with no email delivery or domain dependency, and works in private/incognito on
  // mobile (password is entered in the same tab, so it needs no PKCE verifier cookie and no emailed
  // link that would open a separate cookie jar).
  const authMode = mode === "setup_required" ? "preview" : isDevLoginEnabled() ? "dev" : "password";
  return NextResponse.json({
    supabase: mode,
    exa: process.env.EXA_API_KEY ? "configured" : "setup_required",
    authMode,
  });
}

