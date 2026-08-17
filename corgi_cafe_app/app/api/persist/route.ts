import { NextResponse } from "next/server";
import { DEMO_CAFE_CODE } from "../../../lib/cafes";
import { PersistPayloadSchema, sourceHost } from "../../../lib/persistence";
import { createCorgiServerClient, getSupabaseConfig } from "../../../lib/supabase";

export async function POST(request: Request) {
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.json({ status: "preview_only", message: "Supabase is not connected. Nothing was saved." });
  }
  const payload = PersistPayloadSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) return NextResponse.json({ message: "Check the information and try again." }, { status: 400 });
  const supabase = await createCorgiServerClient();
  const { data: auth, error: authError } = await supabase!.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ message: "Sign in again before saving." }, { status: 401 });
  const memberId = auth.user.id;
  const data = payload.data;

  if (data.kind === "profile") {
    const profile = data.profile;
    const { error } = await supabase!.from("profiles").upsert({
      member_id: memberId,
      first_name: profile.firstName,
      last_name: profile.lastName,
      broad_location: profile.broadLocation,
      role_title: profile.roleTitle,
      company_or_project: profile.companyOrProject,
      about_me: profile.aboutMe || null,
      current_work: profile.currentWork || null,
      favorite_drink: profile.favoriteDrink || null,
      // Only overwrite the avatar when the client sends one, so saving profile edits from account
      // settings never wipes a photo the member uploaded separately.
      ...(profile.avatarUrl ? { avatar_url: profile.avatarUrl } : {}),
      // Same guard for enrichment: only written when the client derived it (from a confirmed
      // people-search candidate), so a later manual profile edit doesn't blank the career context.
      ...(profile.enrichment ? { enrichment: profile.enrichment } : {}),
      confirmed_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ message: "Your profile could not be saved." }, { status: 502 });
    if (profile.sources.length) {
      const rows = profile.sources.map((source) => ({
        member_id: memberId,
        source_kind: source.kind,
        source_url: source.url,
        source_host: sourceHost(source.url),
        identifier_only: source.kind === "linkedin_identifier",
        member_confirmed: true,
      }));
      const { error: sourceError } = await supabase!.from("profile_sources").upsert(rows, { onConflict: "member_id,source_kind,source_url" });
      if (sourceError) return NextResponse.json({ message: "Your profile saved, but a source could not be attached." }, { status: 502 });
    }
    await supabase!.from("onboarding_progress").upsert({ member_id: memberId, status: "complete", last_step: "profile_details", draft: {}, completed_at: new Date().toISOString() });
    return NextResponse.json({ status: "saved" });
  }

  if (data.kind === "community_interest") {
    const { error } = await supabase!.from("community_interests").upsert({ member_id: memberId, status: "interested", recorded_at: new Date().toISOString() });
    return error ? NextResponse.json({ message: "Interest could not be recorded." }, { status: 502 }) : NextResponse.json({ status: "saved" });
  }

  if (data.kind === "session") {
    const session = data.session;
    const { error: closeError } = await supabase!.from("visit_intro_sessions").update({ status: "cancelled" }).eq("member_id", memberId).in("status", ["draft", "searching", "waiting", "introduced", "meeting"]);
    if (closeError) return NextResponse.json({ message: "Your previous intro session could not be closed." }, { status: 502 });
    // Demo mode is location-less: force presence true and route into the isolated demo cafe so the
    // real matcher pairs the visitor only with seeded demo people (never a Live user, and vice versa).
    const isDemo = session.mode === "demo";
    const { data: saved, error } = await supabase!.from("visit_intro_sessions").insert({
      member_id: memberId,
      order_confirmed_today: isDemo ? true : session.orderConfirmedToday,
      at_cafe: isDemo ? true : session.atCafe,
      cafe_code: isDemo ? DEMO_CAFE_CODE : session.cafeCode || "corgi-cafe",
      presence_checked_at: new Date().toISOString(),
      conversation_mode: session.conversationMode,
      topics: session.topics,
      useful_context: session.usefulContext || null,
      offer_context: session.offerContext || null,
      boundaries: session.boundaries,
      status: "searching",
    }).select("id").single();
    return error ? NextResponse.json({ message: "Your intro session could not be started." }, { status: 502 }) : NextResponse.json({ status: "saved", sessionId: saved.id });
  }

  if (data.kind === "decision") {
    // The member's private continue/pass. RLS allows a participant to update only their own row.
    const { error } = await supabase!.from("introduction_participants")
      .update({ private_decision: data.decision.choice, decided_at: new Date().toISOString() })
      .eq("recommendation_id", data.decision.recommendationId)
      .eq("member_id", memberId);
    if (error) return NextResponse.json({ message: "Your choice could not be recorded." }, { status: 502 });
    // A pass ends the introduction for both: the security-definer RPC closes the recommendation,
    // retires the decliner's session, and returns the counterpart's session to the searching pool so
    // they aren't stranded on a match the decliner already killed. Best-effort — the private decision
    // is already recorded, and the counterpart's client also polls, so a transient RPC failure still
    // resolves when the intro window lapses.
    if (data.decision.choice === "pass") {
      await supabase!.rpc("decline_introduction", { target_recommendation_id: data.decision.recommendationId });
    }
    return NextResponse.json({ status: "saved" });
  }

  if (data.kind === "meeting") {
    // A meeting counts only once both members independently confirm 'met'.
    const { error } = await supabase!.from("meeting_confirmations")
      .upsert({ recommendation_id: data.meeting.recommendationId, member_id: memberId, answer: data.meeting.answer, answered_at: new Date().toISOString() }, { onConflict: "recommendation_id,member_id" });
    return error ? NextResponse.json({ message: "Your answer could not be recorded." }, { status: 502 }) : NextResponse.json({ status: "saved" });
  }

  if (data.kind === "feedback") {
    const { error } = await supabase!.from("private_feedback")
      .upsert({ recommendation_id: data.feedback.recommendationId, member_id: memberId, rating: data.feedback.rating, note: data.feedback.note || null, submitted_at: new Date().toISOString() }, { onConflict: "recommendation_id,member_id" });
    return error ? NextResponse.json({ message: "Your feedback could not be saved." }, { status: 502 }) : NextResponse.json({ status: "saved" });
  }

  const { error } = await supabase!.from("interaction_events").insert({
    member_id: memberId,
    event_name: data.event.eventName,
    step_id: data.event.stepId ?? null,
    context: data.event.context,
  });
  return error ? NextResponse.json({ message: "This interaction could not be recorded." }, { status: 502 }) : NextResponse.json({ status: "saved" });
}
