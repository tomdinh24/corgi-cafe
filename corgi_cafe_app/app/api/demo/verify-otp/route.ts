import { getSessionSecret, signOtpState } from "@corgi/onboarding-shared";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { code?: string };
  if (body.code !== "424242")
    return NextResponse.json(
      { ok: false, message: "That code does not match. Try 424242." },
      { status: 400 },
    );
  const secret = getSessionSecret();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    "corgi_exa_otp",
    signOtpState(Date.now() + 1_800_000, "exa", secret),
    {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1800,
      path: "/",
    },
  );
  return response;
}
