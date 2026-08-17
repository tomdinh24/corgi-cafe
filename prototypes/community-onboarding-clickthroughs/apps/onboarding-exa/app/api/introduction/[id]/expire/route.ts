import { NextResponse } from "next/server";
import { createCorgiServerClient, getSupabaseConfig } from "../../../../../lib/supabase";

// Expires a stale introduction once its ~5-minute window lapses. The client calls this when its
// countdown hits zero (or on resume if the window already passed) so both people are reset to a
// clean state and freed to meet someone else. The RPC is participant-scoped and a safe no-op if the
// introduction already advanced, so re-calls are harmless.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.json({ status: "preview_only" });
  }
  const supabase = await createCorgiServerClient();
  const { data: auth, error: authError } = await supabase!.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ message: "Sign in again." }, { status: 401 });

  const { data, error } = await supabase!.rpc("expire_introduction", { target_recommendation_id: id });
  if (error) return NextResponse.json({ message: "Could not expire the introduction." }, { status: 502 });
  return NextResponse.json({ status: "expired", expired: Boolean(data) });
}
