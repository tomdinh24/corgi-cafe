import { NextResponse } from "next/server";
import { z } from "zod";
import { createCorgiServerClient, getSupabaseConfig, isDevLoginEnabled } from "../../../../lib/supabase";

// Email + password sign-in. signInWithPassword returns a session synchronously and
// createCorgiServerClient writes the session cookies, so the caller is signed in the same tab with no
// email delivery and no PKCE verifier cookie (immune to the private/incognito mobile failure).
const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Enter your password."),
});

export async function POST(request: Request) {
  const body = BodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ message: "Enter your email and password." }, { status: 400 });
  }
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.json({ mode: "preview", message: "Supabase is not connected. Use 424242 to preview without saving." });
  }
  if (isDevLoginEnabled()) {
    return NextResponse.json({ mode: "preview", message: "Dev login is on. Enter any six-digit code to continue." });
  }
  const supabase = await createCorgiServerClient();
  const { data, error } = await supabase!.auth.signInWithPassword({
    email: body.data.email,
    password: body.data.password,
  });
  if (error || !data.session) {
    return NextResponse.json({ message: "That email or password is incorrect." }, { status: 401 });
  }
  return NextResponse.json({ mode: "persistent" });
}
