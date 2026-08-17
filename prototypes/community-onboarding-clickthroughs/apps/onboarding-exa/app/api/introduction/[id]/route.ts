import { NextResponse } from "next/server";
import { createCorgiServerClient, getSupabaseConfig } from "../../../../lib/supabase";

// Rewrites the deterministic explanation into a warmer sentence, grounded strictly in the
// structured evidence the matcher already computed (shared topics, ask/offer reciprocity). The
// model is told exactly which facts it may use and nothing else, so it can't invent new ones.
// Falls back to the deterministic explanation on any failure — this is a presentation layer only.
async function phraseReason(deterministic: string, firstName: string, evidence: unknown): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !evidence || typeof evidence !== "object") return deterministic;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 60,
        messages: [
          { role: "system", content: "Rewrite an introduction reason in one warm, natural sentence under 30 words. Use only the confirmed facts given in the JSON evidence — never invent names, jobs, or details not present. If evidence is thin, keep it general." },
          { role: "user", content: JSON.stringify({ counterpartFirstName: firstName, evidence, fallback: deterministic }) },
        ],
      }),
    });
    clearTimeout(timeout);
    if (!response.ok) return deterministic;
    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content?.trim();
    return text ? text.slice(0, 300) : deterministic;
  } catch {
    return deterministic;
  }
}

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
  const reason = await phraseReason(row.introduction_reason, row.first_name, row.evidence);
  return NextResponse.json({
    firstName: row.first_name,
    roleTitle: row.role_title,
    currentWork: row.current_work,
    reason,
  });
}
