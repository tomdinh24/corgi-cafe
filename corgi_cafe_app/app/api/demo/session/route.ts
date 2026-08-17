import { getSessionSecret, verifyOtpState } from "@corgi/onboarding-shared";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
export async function GET() {
  const value = (await cookies()).get("corgi_exa_otp")?.value;
  const secret = getSessionSecret();
  return NextResponse.json({ verified: verifyOtpState(value, "exa", secret) });
}
