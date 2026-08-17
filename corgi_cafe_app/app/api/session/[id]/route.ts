import { NextResponse } from "next/server";
import { createCorgiServerClient, getSupabaseConfig } from "../../../../lib/supabase";

// Lets a waiting member poll their own session — has someone else's request_introduction call
// paired them yet? Scoped to the caller's own session only (get_my_session_status enforces this).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.json({ status: "preview" });
  }
  const supabase = await createCorgiServerClient();
  const { data: auth, error: authError } = await supabase!.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ message: "Sign in again." }, { status: 401 });

  const { data, error } = await supabase!.rpc("get_my_session_status", { target_session_id: id });
  if (error) return NextResponse.json({ message: "Status unavailable." }, { status: 502 });
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return NextResponse.json({ status: "unknown" });
  return NextResponse.json({ status: row.status, recommendationId: row.recommendation_id });
}
