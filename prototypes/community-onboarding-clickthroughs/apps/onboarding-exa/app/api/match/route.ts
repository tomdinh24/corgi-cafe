import { NextResponse } from "next/server";
import { z } from "zod";
import { createCorgiAdminClient, createCorgiServerClient, getSupabaseConfig } from "../../../lib/supabase";
import { rankBestMatch, type PersonBlob, type PreferenceHint } from "../../../lib/matcher";

const Body = z.object({ sessionId: z.string().uuid() });

// Matches the caller's own session. Flow:
//   1. Load the hard-filtered eligible pool with rich context (admin client — candidate PII never
//      reaches the browser; it's used only for the server-side ranker).
//   2. Let the LLM pick the single best counterpart + a warm reason.
//   3. Commit via request_introduction — the ONLY thing allowed to write recommendations. The RPC
//      re-validates the pick against every hard filter (race-safe) and, given no pick (ranker
//      unavailable / no candidates / below threshold), falls back to the deterministic auto-pick.
export async function POST(request: Request) {
  if (getSupabaseConfig().mode === "setup_required") {
    // No database connected — the client falls back to a clearly-labelled preview introduction.
    return NextResponse.json({ status: "preview" });
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Missing intro session." }, { status: 400 });
  const sessionId = parsed.data.sessionId;

  const supabase = await createCorgiServerClient();
  const { data: auth, error: authError } = await supabase!.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ message: "Sign in again before matching." }, { status: 401 });

  // Rank the queue with a model when possible; degrade silently to the deterministic RPC otherwise.
  let chosenTargetSessionId: string | null = null;
  let overrideExplanation: string | null = null;
  try {
    const admin = createCorgiAdminClient();
    if (admin) {
      const { data: pool } = await admin.rpc("list_introduction_candidates", {
        target_session_id: sessionId,
        requester_member_id: auth.user.id,
      });
      const requester = (pool?.requester ?? null) as PersonBlob | null;
      const candidates = (Array.isArray(pool?.candidates) ? pool.candidates : []) as PersonBlob[];
      if (requester && candidates.length > 0) {
        // Best-effort preference signal from this member's past introductions (Tier C flywheel).
        let preference: PreferenceHint | null = null;
        try {
          const { data: pref } = await admin.rpc("get_member_preferences", { target_member_id: auth.user.id });
          preference = (pref ?? null) as PreferenceHint | null;
        } catch {
          /* no history / RPC unavailable — rank without it */
        }
        const ranked = await rankBestMatch(requester, candidates, preference);
        if (ranked) {
          chosenTargetSessionId = ranked.sessionId;
          overrideExplanation = ranked.reason || null;
        }
      }
    }
  } catch {
    // Any ranker/pool failure → deterministic pick below.
  }

  const { data, error } = await supabase!.rpc("request_introduction", {
    target_session_id: sessionId,
    chosen_target_session_id: chosenTargetSessionId,
    override_explanation: overrideExplanation,
  });
  if (error) return NextResponse.json({ message: "Matching is unavailable right now." }, { status: 502 });
  if (!data) return NextResponse.json({ status: "no_match" });
  return NextResponse.json({ status: "introduced", recommendationId: data as string });
}
