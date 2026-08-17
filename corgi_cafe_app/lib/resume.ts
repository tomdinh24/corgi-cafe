// Session-resume logic, kept out of the "use client" component so it is a plain, testable module.
// computeResume() turns the boot payload (config + auth status) into the exact screen/state a
// returning visitor should land on. loadBoot() caches that payload for the current page-load so a
// remount within the SPA (e.g. the resume redirect /sign-in -> /home) hydrates synchronously instead
// of re-fetching — which is what removes the double loader flash on return.

export type AuthMode = "checking" | "preview" | "dev" | "magiclink" | "otp" | "password";
export type SetupMode = "checking" | "configured" | "setup_required";
export type LinkKind = "linkedin_identifier" | "website" | "github" | "social";

// A match is only live for a short window: if neither person acts within it the intro expires so both
// are freed to meet someone else. The introduction screen counts down from here; on refresh/resume
// the countdown resumes from the server's introduced_at rather than restarting.
export const MATCH_WINDOW_MS = 5 * 60 * 1000;

export type BootData = {
  config: { supabase?: SetupMode; authMode?: AuthMode };
  status: { authenticated?: boolean; [k: string]: unknown };
};

export type ResumeProfile = {
  firstName: string; lastName: string; broadLocation: string; roleTitle: string; companyOrProject: string;
  aboutMe: string; currentWork: string; favoriteDrink: string; avatarUrl: string; confirmed: boolean;
};

export type Resume = {
  authMode: AuthMode;
  setup: SetupMode;
  authenticated: boolean;
  email: string;
  profile: ResumeProfile | null;
  links: Record<LinkKind, string>;
  step: number;
  sessionId: string;
  recommendationId: string;
  matchExpiresAt: number;
  pendingExpire: string | null;      // recommendation id whose lapsed intro must be expired server-side
  pendingCounterpart: string | null; // recommendation id whose counterpart must be fetched for step 11
};

// Boot data is fetched once per page-load and cached at module scope. Every route (/sign-in, /home,
// /onboarding, …) renders its own <ExaOnboarding>, so a resumed sign-in that redirects
// /sign-in -> /home REMOUNTS the component. Without this cache each remount re-fetched config +
// status (a second Supabase round-trip), flashing the loader a second time. A full page reload
// (every sign-in/sign-out/delete path uses window.location) clears the module, so it never goes
// stale across an auth change.
export let bootCache: BootData | null = null;
let bootPromise: Promise<BootData> | null = null;

export function loadBoot(): Promise<BootData> {
  if (!bootPromise) {
    bootPromise = Promise.all([
      fetch("/api/config").then((r) => r.json()).catch(() => ({ supabase: "setup_required", authMode: "preview" })),
      fetch("/api/auth/status").then((r) => r.json()).catch(() => ({ authenticated: false })),
    ]).then(([config, status]) => {
      bootCache = { config, status };
      return bootCache;
    });
  }
  return bootPromise;
}

// Test-only: reset the module cache between cases.
export function resetBootCache() {
  bootCache = null;
  bootPromise = null;
}

// Pure: derive the resumed state from the boot payload. Kept separate from the effect so the first
// (async) boot and a cache-hit remount produce identical state — the remount seeds it synchronously.
export function computeResume(boot: BootData): Resume {
  const authMode = (boot.config?.authMode ?? "preview") as AuthMode;
  const setup = (boot.config?.supabase ?? "setup_required") as SetupMode;
  const empty: Record<LinkKind, string> = { linkedin_identifier: "", website: "", github: "", social: "" };
  const base: Resume = { authMode, setup, authenticated: false, email: "", profile: null, links: empty, step: 0, sessionId: "", recommendationId: "", matchExpiresAt: 0, pendingExpire: null, pendingCounterpart: null };
  const resumable = authMode === "otp" || authMode === "magiclink" || authMode === "dev" || authMode === "password";
  const status = boot.status;
  if (!resumable || !status?.authenticated) return base;

  const links = { ...empty };
  if (Array.isArray(status.sources)) {
    for (const source of status.sources as Array<{ kind?: string; url?: string }>) {
      if (source && typeof source.kind === "string" && source.kind in links) links[source.kind as LinkKind] = source.url ?? "";
    }
  }
  const p = status.profile as Partial<ResumeProfile> | undefined;
  const result: Resume = {
    ...base,
    authenticated: true,
    email: (status.email as string) ?? "",
    profile: p
      ? { firstName: p.firstName ?? "", lastName: p.lastName ?? "", broadLocation: p.broadLocation ?? "", roleTitle: p.roleTitle ?? "", companyOrProject: p.companyOrProject ?? "", aboutMe: p.aboutMe ?? "", currentWork: p.currentWork ?? "", favoriteDrink: p.favoriteDrink ?? "", avatarUrl: p.avatarUrl ?? "", confirmed: !!p.confirmed }
      : null,
    links,
  };
  const active = status.activeSession as { id?: string; status?: string } | undefined;
  const activeRecommendationId = status.activeRecommendationId as string | undefined;
  if (result.profile?.confirmed && active?.id && active?.status) {
    if ((active.status === "introduced" || active.status === "meeting") && activeRecommendationId) {
      // A "meeting" session is already past the intro window (both confirmed continue), so it never
      // expires; an "introduced" session still owes its window, counted from when the match was made
      // so a refresh resumes — not restarts — the countdown.
      const startedAt = status.introducedAt ? new Date(status.introducedAt as string).getTime() : Date.now();
      const expiresAt = startedAt + MATCH_WINDOW_MS;
      if (active.status === "introduced" && expiresAt <= Date.now()) {
        result.pendingExpire = activeRecommendationId; // lapsed while away -> expire server-side, land home
        result.step = 7;
      } else {
        result.sessionId = active.id;
        result.recommendationId = activeRecommendationId;
        if (active.status === "introduced") result.matchExpiresAt = expiresAt;
        result.pendingCounterpart = activeRecommendationId;
        result.step = 11;
      }
    } else if (active.status === "searching") {
      result.sessionId = active.id;
      result.step = 18;
    } else {
      result.step = 7;
    }
  } else {
    result.step = result.profile?.confirmed ? 7 : 2;
  }
  return result;
}
