import { describe, expect, it } from "vitest";
import { computeResume, MATCH_WINDOW_MS, type BootData } from "./resume";

const config = (authMode: string, supabase = "configured") => ({ supabase, authMode } as BootData["config"]);
const boot = (authMode: string, status: BootData["status"]): BootData => ({ config: config(authMode), status });

const confirmedProfile = { firstName: "Ada", lastName: "Lovelace", roleTitle: "Engineer", companyOrProject: "Analytical", broadLocation: "SF", confirmed: true };

describe("computeResume — auth gating", () => {
  it("preview mode never resumes even if a session is present", () => {
    const r = computeResume(boot("preview", { authenticated: true, profile: confirmedProfile }));
    expect(r.authenticated).toBe(false);
    expect(r.step).toBe(0);
  });

  it("password mode, not authenticated -> sign-in (step 0)", () => {
    const r = computeResume(boot("password", { authenticated: false }));
    expect(r.authenticated).toBe(false);
    expect(r.step).toBe(0);
    expect(r.authMode).toBe("password");
  });
});

describe("computeResume — destination step", () => {
  it("authenticated but no profile -> onboarding (step 2)", () => {
    const r = computeResume(boot("password", { authenticated: true, email: "a@b.co", profile: null }));
    expect(r.step).toBe(2);
    expect(r.email).toBe("a@b.co");
  });

  it("unconfirmed profile -> onboarding (step 2)", () => {
    const r = computeResume(boot("password", { authenticated: true, profile: { ...confirmedProfile, confirmed: false } }));
    expect(r.step).toBe(2);
  });

  it("confirmed profile, no active session -> home (step 7)", () => {
    const r = computeResume(boot("otp", { authenticated: true, profile: confirmedProfile }));
    expect(r.step).toBe(7);
    expect(r.profile?.firstName).toBe("Ada");
  });

  it("confirmed profile + searching session -> waiting pool (step 18)", () => {
    const r = computeResume(boot("password", { authenticated: true, profile: confirmedProfile, activeSession: { id: "s1", status: "searching" } }));
    expect(r.step).toBe(18);
    expect(r.sessionId).toBe("s1");
  });

  it("live introduced session within window -> match (step 11) with counterpart + expiry to fetch", () => {
    const introducedAt = new Date(Date.now() - 60_000).toISOString(); // 1 min ago, still inside window
    const r = computeResume(boot("password", { authenticated: true, profile: confirmedProfile, activeSession: { id: "s2", status: "introduced" }, activeRecommendationId: "rec9", introducedAt }));
    expect(r.step).toBe(11);
    expect(r.sessionId).toBe("s2");
    expect(r.recommendationId).toBe("rec9");
    expect(r.pendingCounterpart).toBe("rec9");
    expect(r.matchExpiresAt).toBeGreaterThan(Date.now());
  });

  it("introduced session whose window already lapsed -> home (step 7) + pendingExpire", () => {
    const introducedAt = new Date(Date.now() - MATCH_WINDOW_MS - 1_000).toISOString(); // expired
    const r = computeResume(boot("password", { authenticated: true, profile: confirmedProfile, activeSession: { id: "s3", status: "introduced" }, activeRecommendationId: "rec10", introducedAt }));
    expect(r.step).toBe(7);
    expect(r.pendingExpire).toBe("rec10");
    expect(r.matchExpiresAt).toBe(0);
  });

  it("meeting session never expires -> match (step 11) regardless of age", () => {
    const introducedAt = new Date(Date.now() - MATCH_WINDOW_MS * 10).toISOString();
    const r = computeResume(boot("password", { authenticated: true, profile: confirmedProfile, activeSession: { id: "s4", status: "meeting" }, activeRecommendationId: "rec11", introducedAt }));
    expect(r.step).toBe(11);
    expect(r.matchExpiresAt).toBe(0); // meeting stage owes no countdown
  });
});

describe("computeResume — links", () => {
  it("maps known source kinds and ignores unknown ones", () => {
    const r = computeResume(boot("password", {
      authenticated: true,
      profile: confirmedProfile,
      sources: [{ kind: "github", url: "https://github.com/ada" }, { kind: "bogus", url: "x" }],
    }));
    expect(r.links.github).toBe("https://github.com/ada");
    expect(r.links.website).toBe("");
  });
});
