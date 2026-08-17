import { NextResponse } from "next/server";
import { createCorgiServerClient, getSupabaseConfig } from "../../../../../lib/supabase";

// Post-meeting approved links, only returned by the security-definer RPC once BOTH members
// have confirmed they met and the source was flagged share_after_meeting.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.json({ status: "preview", links: [] });
  }
  const supabase = await createCorgiServerClient();
  const { data: auth, error: authError } = await supabase!.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ message: "Sign in again." }, { status: 401 });

  const { data, error } = await supabase!.rpc("get_post_meeting_links", { target_recommendation_id: id });
  if (error) return NextResponse.json({ message: "Links are unavailable." }, { status: 502 });
  const rows = Array.isArray(data) ? data : [];
  return NextResponse.json({
    links: rows.map((row: { source_kind: string; source_url: string; source_host: string }) => ({
      kind: row.source_kind,
      url: row.source_url,
      host: row.source_host,
    })),
  });
}
