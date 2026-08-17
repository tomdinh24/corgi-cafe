import { NextResponse } from "next/server";
import {
  OnboardingInputSchema,
  getSessionSecret,
  readRequestCookie,
  verifyOtpState,
  withTimeout,
} from "@corgi/onboarding-shared";
import { reserveExaSearches } from "../../../lib/budget";
import { searchExa } from "../../../lib/provider";
import { createCorgiServerClient, getSupabaseConfig } from "../../../lib/supabase";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const sessionToken = readRequestCookie(request, "corgi_exa_otp");
  let authenticated = verifyOtpState(sessionToken, "exa", getSessionSecret());
  let memberId: string | undefined;
  if (!authenticated && getSupabaseConfig().mode === "configured") {
    const supabase = await createCorgiServerClient();
    const { data } = await supabase!.auth.getUser();
    authenticated = Boolean(data.user);
    memberId = data.user?.id;
  }
  if (!authenticated)
    return NextResponse.json(
      {
        status: "error",
        candidates: [],
        message: "Verify the demo code before searching.",
      },
      { status: 401 },
    );
  if (!process.env.EXA_API_KEY)
    return NextResponse.json({
      status: "missing_key",
      candidates: [],
      message:
        "Exa search is unavailable here. You can still add your background yourself.",
    });
  const body = (await request.json().catch(() => null)) as {
    input?: unknown;
  } | null;
  const parsed = OnboardingInputSchema.safeParse(body?.input);
  if (!parsed.success)
    return NextResponse.json(
      {
        status: "error",
        candidates: [],
        message: "Check the details and try again.",
      },
      { status: 400 },
    );
  const budgetKey = sessionToken ?? memberId ?? "authenticated";
  if (!reserveExaSearches(budgetKey, 1))
    return NextResponse.json(
      {
        status: "manual_only",
        candidates: [],
        message: "This walkthrough has reached its two-search limit.",
      },
      { status: 429 },
    );
  const query =
    `${parsed.data.identity.firstName} ${parsed.data.identity.lastName} ${parsed.data.location} ${parsed.data.seedWorkContext ?? ""} ${parsed.data.urls.join(" ")}`.trim();
  try {
    const candidates = await withTimeout((signal) => searchExa(query, signal));
    return NextResponse.json({
      status: candidates.length ? "draft_ready" : "manual_only",
      candidates,
      message: candidates.length
        ? undefined
        : "We did not find a structured person profile to confirm.",
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return NextResponse.json({
      status: timedOut ? "timed_out" : "error",
      candidates: [],
      message: timedOut
        ? "Exa took too long. Add your background yourself instead."
        : "Exa search did not return a reliable result. Add your background yourself instead.",
    });
  }
}
