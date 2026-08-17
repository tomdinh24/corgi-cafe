import { NextResponse } from "next/server";
import { z } from "zod";
import { createCorgiServerClient, getSupabaseConfig, isDevLoginEnabled } from "../../../../lib/supabase";

// Email + password sign-up. No email delivery is required — the account is created and (when the
// Supabase "Confirm email" setting is off) a session is returned immediately, so this works for any
// user with no domain/SMTP dependency. Session cookies are written by createCorgiServerClient, so the
// same-tab flow is immune to the private/incognito mobile magic-link failure.
const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function POST(request: Request) {
  const body = BodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    const message = body.error.issues[0]?.message ?? "Enter a valid email and password.";
    return NextResponse.json({ message }, { status: 400 });
  }
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.json({ mode: "preview", message: "Supabase is not connected. Use 424242 to preview without saving." });
  }
  if (isDevLoginEnabled()) {
    return NextResponse.json({ mode: "preview", message: "Dev login is on. Enter any six-digit code to continue." });
  }
  const supabase = await createCorgiServerClient();
  const { data, error } = await supabase!.auth.signUp({
    email: body.data.email,
    password: body.data.password,
  });
  if (error) {
    // Surface the two cases the user can act on; keep everything else generic.
    const already = /already|registered|exists/i.test(error.message);
    return NextResponse.json(
      { message: already ? "That email already has an account. Sign in instead." : "We could not create your account. Try again." },
      { status: already ? 409 : 502 },
    );
  }
  if (!data.session) {
    // "Confirm email" is on in Supabase — no session until the user confirms via email, which
    // reintroduces the delivery dependency we are trying to avoid. Tell the caller plainly.
    return NextResponse.json({ mode: "confirm_required", message: "Check your email to confirm your account, then sign in." });
  }
  return NextResponse.json({ mode: "persistent" });
}
