import { NextResponse } from "next/server";
import { createCorgiServerClient, getSupabaseConfig } from "../../../../../lib/supabase";

// Mutual meeting status for a participant: whether the caller confirmed 'met', whether the counterpart
// did, and whether BOTH have. Backs the waiting screen (step 15) so a member who confirms first sees an
// honest "waiting for the other person" state instead of a premature "both confirmed". RLS hides the
// counterpart's own confirmation row, so this goes through the security-definer get_meeting_status RPC.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.json({ status: "preview", selfMet: false, counterpartMet: false, bothMet: false });
  }
  const supabase = await createCorgiServerClient();
  const { data: auth, error: authError } = await supabase!.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ message: "Sign in again." }, { status: 401 });

  const { data, error } = await supabase!.rpc("get_meeting_status", { target_recommendation_id: id });
  if (error) return NextResponse.json({ message: "Status unavailable." }, { status: 502 });
  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    selfMet: !!row?.self_met,
    counterpartMet: !!row?.counterpart_met,
    bothMet: !!row?.both_met,
  });
}
