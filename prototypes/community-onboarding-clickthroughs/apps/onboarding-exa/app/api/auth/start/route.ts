import { NextResponse } from "next/server";
import { z } from "zod";
import { createCorgiServerClient, getSupabaseConfig, isDevLoginEnabled } from "../../../../lib/supabase";

const BodySchema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const body = BodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  if (getSupabaseConfig().mode === "setup_required") {
    return NextResponse.json({ mode: "preview", message: "Supabase is not connected. Use 424242 to preview without saving." });
  }
  if (isDevLoginEnabled()) {
    // Dev login: no email is sent. Enter any 6-digit code on the next screen to sign in.
    return NextResponse.json({ mode: "preview", message: "Dev login is on. Enter any six-digit code to continue." });
  }
  // Magic-link sign-in: Supabase emails a link that returns to /auth/callback and establishes the
  // session there. The redirect origin is derived from the request so it works across environments.
  const origin = new URL(request.url).origin;
  const supabase = await createCorgiServerClient();
  const { error } = await supabase!.auth.signInWithOtp({
    email: body.data.email,
    options: { shouldCreateUser: true, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return NextResponse.json({ message: "We could not send your sign-in link. Try again." }, { status: 502 });
  return NextResponse.json({ mode: "magiclink" });
}

