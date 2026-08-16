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
export const runtime = "nodejs";

export async function POST(request: Request) {
  const sessionToken = readRequestCookie(request, "corgi_exa_otp");
  if (!verifyOtpState(sessionToken, "exa", getSessionSecret()))
    return NextResponse.json(
      {
        status: "error",
        candidates: [],
        message: "Verify your code before searching.",
      },
      { status: 401 },
    );
  if (!process.env.EXA_API_KEY)
    return NextResponse.json({
      status: "missing_key",
      candidates: [],
      message:
        "Profile search isn’t available. You can still add your background yourself.",
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
  if (!reserveExaSearches(sessionToken!, 1))
    return NextResponse.json(
      {
        status: "manual_only",
        candidates: [],
        message: "Profile search is unavailable. Add your background yourself.",
      },
      { status: 429 },
    );
  const query =
    `${parsed.data.identity.firstName} ${parsed.data.identity.lastName} ${parsed.data.location} ${parsed.data.seedWorkContext ?? ""}`.trim();
  try {
    const candidates = await withTimeout((signal) =>
      searchExa(query, parsed.data.identity, signal),
    );
    return NextResponse.json({
      status: candidates.length ? "draft_ready" : "manual_only",
      candidates,
      message: candidates.length
        ? undefined
        : "No profile found. Add your background yourself.",
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return NextResponse.json({
      status: timedOut ? "timed_out" : "error",
      candidates: [],
      message: timedOut
        ? "Profile search took too long. Add your background yourself instead."
        : "Profile search did not return a reliable result. Add your background yourself instead.",
    });
  }
}
