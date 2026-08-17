import { NextResponse } from "next/server";
import { z } from "zod";
import { createCorgiAdminClient, createCorgiServerClient, getSupabaseConfig, isDevLoginEnabled } from "../../../../lib/supabase";
import { getSessionSecret, signOtpState } from "@corgi/onboarding-shared";

const BodySchema = z.object({ email: z.string().email(), token: z.string().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  const body = BodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: "Enter the six-digit code." }, { status: 400 });
  if (getSupabaseConfig().mode === "setup_required") {
    if (body.data.token !== "424242") return NextResponse.json({ message: "That code doesn’t match. Try 424242 in preview mode." }, { status: 401 });
    const response = NextResponse.json({ mode: "preview" });
    response.cookies.set("corgi_exa_otp", signOtpState(Date.now() + 1_800_000, "exa", getSessionSecret()), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1800,
      path: "/",
    });
    return response;
  }

  if (isDevLoginEnabled()) {
    // Dev login: mint a real Supabase session for this email (creating the user if needed) so
    // that all downstream writes are real, without requiring an email inbox. The entered code
    // is not checked. Replace this branch with real Supabase OTP email when ready.
    const admin = createCorgiAdminClient();
    if (!admin) return NextResponse.json({ message: "Dev login needs SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });
    await admin.auth.admin.createUser({ email: body.data.email, email_confirm: true }).catch(() => undefined);
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email: body.data.email });
    const otp = link?.properties?.email_otp;
    if (linkError || !otp) return NextResponse.json({ message: "Dev login could not start a session." }, { status: 502 });
    const supabase = await createCorgiServerClient();
    const { error } = await supabase!.auth.verifyOtp({ email: body.data.email, token: otp, type: "email" });
    if (error) return NextResponse.json({ message: "Dev login could not complete." }, { status: 502 });
    return NextResponse.json({ mode: "persistent" });
  }

  const supabase = await createCorgiServerClient();
  const { error } = await supabase!.auth.verifyOtp({ email: body.data.email, token: body.data.token, type: "email" });
  if (error) return NextResponse.json({ message: "That code doesn’t match. Try again or request a new code." }, { status: 401 });
  return NextResponse.json({ mode: "persistent" });
}
