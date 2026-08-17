import { NextResponse } from "next/server";
import { getSupabaseConfig, isDevLoginEnabled } from "../../../lib/supabase";

export async function GET() {
  const mode = getSupabaseConfig().mode;
  // How the client should run sign-in: preview (no DB), dev (any code), or magiclink (real email).
  const authMode = mode === "setup_required" ? "preview" : isDevLoginEnabled() ? "dev" : "magiclink";
  return NextResponse.json({
    supabase: mode,
    exa: process.env.EXA_API_KEY ? "configured" : "setup_required",
    authMode,
  });
}

