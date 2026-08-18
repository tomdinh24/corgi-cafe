import { NextResponse } from "next/server";
import { createCorgiServerClient, getSupabaseConfig } from "../../../lib/supabase";

// The home dashboard's list of the caller's confirmed matches (both sides accepted, not declined).
// All participant-scoping + minimal-PII selection happens inside the security-definer RPC; the client
// only ever receives counterpart card fields, and socials only after both members confirmed they met.
export async function GET() {
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.json({ matches: [] });
  }
  const supabase = await createCorgiServerClient();
  const { data: auth, error: authError } = await supabase!.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ message: "Sign in again." }, { status: 401 });

  const { data, error } = await supabase!.rpc("list_my_confirmed_matches");
  if (error) return NextResponse.json({ message: "Your matches are unavailable right now." }, { status: 502 });
  return NextResponse.json({ matches: Array.isArray(data) ? data : [] });
}
