import {
  getSessionSecret,
  readRequestCookie,
  signOtpState,
  verifyOtpState,
} from "@corgi/onboarding-shared";
import { NextResponse } from "next/server";
import { reserveOtpSession } from "../../../../lib/budget";

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { code?: string };
  if (body.code !== "424242")
    return NextResponse.json(
      { ok: false, message: "That code doesn’t match. Try again." },
      { status: 400 },
    );
  const secret = getSessionSecret();
  const existingToken = readRequestCookie(request, "corgi_exa_otp");
  if (verifyOtpState(existingToken, "exa", secret)) {
    return NextResponse.json({ ok: true });
  }
  if (!reserveOtpSession(clientKey(request)))
    return NextResponse.json(
      { ok: false, message: "Try again later." },
      { status: 429 },
    );
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
