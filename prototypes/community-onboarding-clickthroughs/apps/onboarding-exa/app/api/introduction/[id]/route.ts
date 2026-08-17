import { NextResponse } from "next/server";
import { createCorgiServerClient, getSupabaseConfig } from "../../../../lib/supabase";

// Reveals only the minimal counterpart fields (first name, role, current work, reason), and
// only via the security-definer RPC that checks the caller is a participant in an introduced
// recommendation. No counterpart PII is ever queried directly from the client.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.json({ status: "preview" });
  }
  const supabase = await createCorgiServerClient();
  const { data: auth, error: authError } = await supabase!.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ message: "Sign in again." }, { status: 401 });

  const { data, error } = await supabase!.rpc("get_introduction_counterpart", { target_recommendation_id: id });
  if (error) return NextResponse.json({ message: "Introduction is unavailable." }, { status: 502 });
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return NextResponse.json({ message: "Introduction not available." }, { status: 404 });
  return NextResponse.json({
    firstName: row.first_name,
    roleTitle: row.role_title,
    currentWork: row.current_work,
    reason: row.introduction_reason,
  });
}
