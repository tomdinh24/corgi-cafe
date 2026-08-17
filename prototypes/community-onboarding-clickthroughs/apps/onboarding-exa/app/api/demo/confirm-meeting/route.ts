import { NextResponse } from "next/server";
import { z } from "zod";
import { DEMO_CAFE_CODE } from "@/lib/cafes";
import { createCorgiAdminClient, createCorgiServerClient, getSupabaseConfig } from "@/lib/supabase";

// In Demo mode the counterpart is a seeded person who will never tap "we met", so the post-meeting
// links (which require BOTH participants to confirm) would stay stuck. This confirms the meeting on
// the demo counterpart's behalf so the flow completes. Guardrail: it only ever touches a counterpart
// whose session is in the isolated demo cafe — it can never force-confirm a real Live introduction.
const BodySchema = z.object({ recommendationId: z.string().uuid() });

export async function POST(request: Request) {
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.json({ status: "preview_only" });
  }
  const server = await createCorgiServerClient();
  const { data: auth, error: authError } = await server!.auth.getUser();
  if (authError || !auth.user) {
    return NextResponse.json({ message: "Sign in again." }, { status: 401 });
  }
  const admin = createCorgiAdminClient();
  if (!admin) {
    return NextResponse.json({ message: "Demo mode isn’t configured on the server." }, { status: 503 });
  }
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Check the request and try again." }, { status: 400 });
  }
  const callerId = auth.user.id;
  const recommendationId = parsed.data.recommendationId;

  const { data: rec, error: recError } = await admin
    .from("recommendations")
    .select("requester_session_id, counterpart_session_id")
    .eq("id", recommendationId)
    .single();
  if (recError || !rec) {
    return NextResponse.json({ message: "Introduction not found." }, { status: 404 });
  }

  const { data: sessions } = await admin
    .from("visit_intro_sessions")
    .select("id, member_id, cafe_code")
    .in("id", [rec.requester_session_id, rec.counterpart_session_id]);
  const list = sessions ?? [];
  const callerIsParticipant = list.some((s) => s.member_id === callerId);
  const counterpart = list.find((s) => s.member_id !== callerId);
  if (!callerIsParticipant) {
    return NextResponse.json({ message: "Not your introduction." }, { status: 403 });
  }
  if (!counterpart || counterpart.cafe_code !== DEMO_CAFE_CODE) {
    // Never auto-confirm a real (Live) counterpart's meeting.
    return NextResponse.json({ message: "Not a demo introduction." }, { status: 400 });
  }

  const { error: upsertError } = await admin.from("meeting_confirmations").upsert(
    { recommendation_id: recommendationId, member_id: counterpart.member_id, answer: "met", answered_at: new Date().toISOString() },
    { onConflict: "recommendation_id,member_id" },
  );
  if (upsertError) {
    return NextResponse.json({ message: "Could not confirm the demo meeting." }, { status: 502 });
  }
  return NextResponse.json({ status: "confirmed" });
}
