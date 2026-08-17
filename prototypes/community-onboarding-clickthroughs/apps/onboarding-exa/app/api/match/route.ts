import { NextResponse } from "next/server";
import { z } from "zod";
import { createCorgiServerClient, getSupabaseConfig } from "../../../lib/supabase";

const Body = z.object({ sessionId: z.string().uuid() });

// Runs the reviewed matching service (request_introduction RPC) for the caller's own session.
// The RPC is the only thing allowed to write recommendations/introduction_participants.
export async function POST(request: Request) {
  if (getSupabaseConfig().mode === "setup_required") {
    // No database connected — the client falls back to a clearly-labelled preview introduction.
    return NextResponse.json({ status: "preview" });
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Missing intro session." }, { status: 400 });

  const supabase = await createCorgiServerClient();
  const { data: auth, error: authError } = await supabase!.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ message: "Sign in again before matching." }, { status: 401 });

  const { data, error } = await supabase!.rpc("request_introduction", { target_session_id: parsed.data.sessionId });
  if (error) return NextResponse.json({ message: "Matching is unavailable right now." }, { status: 502 });
  if (!data) return NextResponse.json({ status: "no_match" });
  return NextResponse.json({ status: "introduced", recommendationId: data as string });
}
