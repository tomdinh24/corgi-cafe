"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { PersonCandidate } from "@corgi/onboarding-shared";
import { SiteHeader } from "./SiteHeader";
import { CORGI_CAFES, DEFAULT_CAFE_CODE, nearestCafe } from "@/lib/cafes";

const LOCATION_CHECK_KEY = "corgi.locationCheck";
const MODE_KEY = "corgi.mode";

type SetupMode = "checking" | "configured" | "setup_required";
type Terminal = "" | "community" | "later" | "pass" | "not_met" | "notify" | "finished";
type LinkKind = "linkedin_identifier" | "website" | "github" | "social";

const topicOptions = ["Building community", "Creative projects", "Product & technology", "Career stories", "AI & products", "First customers", "Fundraising", "SF life"];

// A match is only live for a short window: if neither person acts within this window it expires so
// both are freed to meet someone else. The introduction screen counts down from here; on refresh the
// countdown resumes from the server's introduced_at rather than restarting.
const MATCH_WINDOW_MS = 5 * 60 * 1000;

// The hold still counts down in the background, but we surface only a soft, rounded sense of how much
// time is left ("~10 min", then 5 / 2 / 1) instead of a ticking clock — a gentle heads-up, not a
// stopwatch. Empty string means the window has run out (callers show a friendly wrap-up message).
function windowBucket(secondsLeft: number): string {
  const minutes = secondsLeft / 60;
  if (minutes > 5) return "10 min";
  if (minutes > 2) return "5 min";
  if (minutes > 1) return "2 min";
  if (secondsLeft > 0) return "1 min";
  return "";
}

type Counterpart = { firstName: string; roleTitle: string; currentWork: string; reason: string };
type PostLink = { kind: string; url: string; host: string };

// Shown only when no database is connected (preview mode), so the flow stays demoable without
// Supabase. When configured, every field below comes from the real matcher + RPCs instead.
const PREVIEW_COUNTERPART: Counterpart = {
  firstName: "Rowan",
  roleTitle: "Community program designer · Hospitality",
  currentWork: "",
  reason: "You’re both thinking about how small gatherings can feel easier to join. Rowan has hosted them; you’re deciding how much structure helps.",
};
const PREVIEW_LINKS: PostLink[] = [
  { kind: "website", url: "rowan-studio.example", host: "rowan-studio.example" },
  { kind: "social", url: "@rowan.gathers", host: "instagram.com" },
];

function GoogleMark() {
  return <svg className="google-mark" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5L15.4 17c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.9A6 6 0 0 1 6.1 12c0-.7.1-1.3.3-1.9V7.5H3.1A10 10 0 0 0 2 12c0 1.6.4 3.1 1.1 4.5l3.3-2.6Z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.9 5.5l3.3 2.6A6 6 0 0 1 12 6Z"/></svg>;
}


function CameraIcon() {
  return <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
}

function Header({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return <><p className="journey-eyebrow">{eyebrow}</p><h1>{title}</h1>{children && <p className="journey-intro">{children}</p>}</>;
}

function Actions({ children }: { children: ReactNode }) { return <div className="journey-actions">{children}</div>; }
function Primary(props: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button {...props} className={`journey-button primary ${props.className ?? ""}`}>{props.children}</button>; }
function Secondary(props: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button {...props} className={`journey-button secondary ${props.className ?? ""}`}>{props.children}</button>; }
function Quiet(props: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button {...props} className="journey-button quiet">{props.children}</button>; }
function Field({ label, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) { const id = props.id ?? label.toLowerCase().replace(/\W+/g, "-"); return <label className="journey-field" htmlFor={id}><span>{label}</span>{hint && <small>{hint}</small>}<input {...props} id={id} /></label>; }
function TextBox({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) { const id = props.id ?? label.toLowerCase().replace(/\W+/g, "-"); return <label className="journey-field" htmlFor={id}><span>{label}</span><textarea {...props} id={id} /></label>; }

// LinkedIn hands back a generic ghost avatar from its static asset host (static.licdn.com) when a
// person has no public photo; only media.licdn.com and other hosts carry a real face. Treat the
// static placeholder as "no photo" so avatars fall back to initials instead of showing a fake face.
function isRealPhoto(url: string | undefined | null): url is string {
  if (!url) return false;
  try { return new URL(url).host !== "static.licdn.com"; } catch { return false; }
}

type ProfileEnrichment = {
  headline?: string;
  isFounder?: boolean;
  currentCompany?: string;
  pastCompanies?: string[];
  roles?: { title?: string; company?: string; from?: string; to?: string }[];
};
// Turns the confirmed people-search candidate's work history into compact career context for the
// matcher: a headline, whether they currently hold a founder/CEO-type role, and their past
// companies. Returns undefined when there's nothing worth storing (e.g. a manual, no-candidate flow).
function deriveEnrichment(candidate: PersonCandidate): ProfileEnrichment | undefined {
  const roles = (candidate.workHistory ?? []).filter((role) => role.title || role.company);
  const current = roles.find((role) => !role.to) ?? roles[0];
  const currentTitle = candidate.title || current?.title;
  const currentCompany = candidate.company || current?.company;
  const headline = [currentTitle, currentCompany].filter(Boolean).join(" at ") || undefined;
  const isFounder = /\b(founder|co-?founder|ceo|owner|managing partner|general partner)\b/i.test(currentTitle ?? "");
  const pastCompanies = Array.from(
    new Set(roles.map((role) => role.company).filter((company): company is string => Boolean(company) && company !== currentCompany)),
  ).slice(0, 8);
  const out: ProfileEnrichment = {
    ...(headline ? { headline } : {}),
    ...(isFounder ? { isFounder: true } : {}),
    ...(currentCompany ? { currentCompany } : {}),
    ...(pastCompanies.length ? { pastCompanies } : {}),
    ...(roles.length ? { roles: roles.slice(0, 25) } : {}),
  };
  return out.headline || out.roles || out.pastCompanies ? out : undefined;
}

async function jsonPost(path: string, body: unknown) {
  const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong. Try again.");
  return data;
}

async function jsonGet(path: string) {
  const response = await fetch(path);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong. Try again.");
  return data;
}

export function ExaOnboarding() {
  const pathname = usePathname();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [setup, setSetup] = useState<SetupMode>("checking");
  const [authMode, setAuthMode] = useState<"checking" | "preview" | "dev" | "magiclink">("checking");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [authIntent, setAuthIntent] = useState<"signup" | "signin">(() => (pathname === "/sign-in" ? "signin" : "signup"));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [about, setAbout] = useState("");
  const [currentWork, setCurrentWork] = useState("");
  const [favoriteDrink, setFavoriteDrink] = useState("");
  // Profile photo. Set from the chosen search candidate's public photo during onboarding, or from a
  // file uploaded in account settings; shown wherever this member's avatar appears post-onboarding.
  const [avatarUrl, setAvatarUrl] = useState("");
  const [links, setLinks] = useState<Record<LinkKind, string>>({ linkedin_identifier: "", website: "", github: "", social: "" });
  const [candidates, setCandidates] = useState<PersonCandidate[]>([]);
  const [candidateId, setCandidateId] = useState("");
  const [candidateSource, setCandidateSource] = useState<{ kind: LinkKind; url: string } | null>(null);
  // Career context derived from the confirmed people-search candidate; persisted with the profile
  // and later fed to the matcher. Set at candidate selection, empty on the manual (no-candidate) path.
  const [enrichment, setEnrichment] = useState<ProfileEnrichment | undefined>(undefined);
  const [branch, setBranch] = useState<"cafe" | "community" | "later">("cafe");
  const [terminal, setTerminal] = useState<Terminal>("");
  // Cafe presence. When the location check is off, everyone is at the single generic "corgi-cafe"
  // (atCafe stays true, pill reads "Corgi Cafe"). When on, geolocation / a manual pick resolves the
  // specific cafe, which sets cafeCode (the matcher only pairs same-cafe) and the pill label.
  const [atCafe, setAtCafe] = useState(true);
  const [cafeCode, setCafeCode] = useState(DEFAULT_CAFE_CODE);
  const [cafeLabel, setCafeLabel] = useState("");
  // True only once the browser's geolocation has actually placed the visitor inside a Corgi Cafe.
  // Drives the green presence dot and disables the pill's "find a cafe" redirect — a manual pick or
  // the generic default never turns this on, so green always means "the system verified you're here".
  const [locationVerified, setLocationVerified] = useState(false);
  const [locationCheck, setLocationCheck] = useState(false);
  // Live vs Demo. Live = real match at your cafe (unchanged). Demo = location-less, matched against
  // seeded demo people so the whole flow can be shown solo. Chosen in a post-sign-in modal and
  // switchable from the top bar; persisted in localStorage.
  const [mode, setMode] = useState<"live" | "demo">("live");
  const [modeChosen, setModeChosen] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [conversationMode, setConversationMode] = useState<"specific" | "open">("specific");
  const [topics, setTopics] = useState<string[]>([topicOptions[0]]);
  const [otherTopic, setOtherTopic] = useState("");
  const [useful, setUseful] = useState("");
  const [offer, setOffer] = useState("");
  const [commercial, setCommercial] = useState({ fundraising: false, recruiting: false, sales: false });
  const [photoSelf, setPhotoSelf] = useState(false);
  const [photoNearby, setPhotoNearby] = useState(false);
  // Local object-URL previews of the just-captured photos, so the tile shows the actual image
  // instead of a checkmark (the stored object is private, so previewing the local file is both
  // instant and avoids a signed-URL round-trip).
  const [photoSelfUrl, setPhotoSelfUrl] = useState("");
  const [photoNearbyUrl, setPhotoNearbyUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState<"" | "self" | "nearby">("");
  const selfPhotoInputRef = useRef<HTMLInputElement>(null);
  const nearbyPhotoInputRef = useRef<HTMLInputElement>(null);
  const [meetingSecondsLeft, setMeetingSecondsLeft] = useState(600);
  // Epoch ms when the current match expires (0 = no live match). The introduction screen (step 11)
  // counts down to it; when it passes, the match is expired server-side and both people are reset.
  const [matchExpiresAt, setMatchExpiresAt] = useState(0);
  const [matchSecondsLeft, setMatchSecondsLeft] = useState(Math.round(MATCH_WINDOW_MS / 1000));
  const [feedback, setFeedback] = useState<"" | "very_unhelpful" | "unhelpful" | "neutral" | "helpful" | "very_helpful">("");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [recommendationId, setRecommendationId] = useState("");
  const [counterpart, setCounterpart] = useState<Counterpart | null>(null);
  const [postLinks, setPostLinks] = useState<PostLink[]>([]);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  // Account settings is a real pushed route (/account) rather than a hidden flag, so the browser
  // Back button and the "Done" button both land back on /home instead of exiting to the landing
  // page. Deriving the view from the path keeps the URL the single source of truth.
  const accountView = pathname === "/account";
  const [accountNotice, setAccountNotice] = useState("");
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Three separate hidden inputs so the account photo buttons map to distinct native pickers:
  // camera capture, the image/photo library, and a generic file chooser (all validated as images).
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  // Photo source menu (Take photo / Upload photo / Upload file) popped from clicking the avatar.
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const photoPickerRef = useRef<HTMLDivElement>(null);
  const avatarCameraInputRef = useRef<HTMLInputElement>(null);
  const avatarPhotoInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  // True until we know whether this visitor already has a live session (and a claimed profile) to
  // resume into — gates the very first paint so we never flash the sign-up screen before jumping
  // straight to a resumed session.
  const [resuming, setResuming] = useState(true);

  useEffect(() => {
    // Fire both boot calls at once instead of chaining status behind config. They're independent
    // (status returns {authenticated:false} when Supabase isn't configured), so running them in
    // parallel halves the resume wait a signed-in visitor sees before landing on /home.
    const configPromise = fetch("/api/config").then((r) => r.json());
    const statusPromise = fetch("/api/auth/status").then((r) => r.json()).catch(() => ({ authenticated: false }));
    configPromise.then(async (data) => {
      setSetup(data.supabase);
      setAuthMode(data.authMode ?? "preview");
      if (data.authMode === "magiclink" || data.authMode === "dev") {
        // Already signed in (magic-link return, or a live session from earlier tonight)? Resume
        // where they left off instead of re-running onboarding from scratch.
        try {
          const status = await statusPromise;
          if (!status.authenticated) return;
          setEmail(status.email ?? "");
          const profile = status.profile;
          if (profile) {
            setFirstName(profile.firstName ?? ""); setLastName(profile.lastName ?? "");
            setLocation(profile.broadLocation ?? ""); setRole(profile.roleTitle ?? ""); setCompany(profile.companyOrProject ?? "");
            setAbout(profile.aboutMe ?? ""); setCurrentWork(profile.currentWork ?? ""); setFavoriteDrink(profile.favoriteDrink ?? "");
            setAvatarUrl(profile.avatarUrl ?? "");
          }
          if (Array.isArray(status.sources) && status.sources.length) {
            setLinks((current) => {
              const next = { ...current };
              for (const source of status.sources) {
                if (source && typeof source.kind === "string" && source.kind in next) next[source.kind as LinkKind] = source.url ?? "";
              }
              return next;
            });
          }
          // Resume into a live match after a refresh/reconnect: a matched member returns to their
          // introduction; a member still waiting in the pool returns to the "still looking" screen
          // (which re-arms polling). Otherwise land on home / profile as before.
          const active = status.activeSession;
          if (profile?.confirmed && active?.id && active?.status) {
            if ((active.status === "introduced" || active.status === "meeting") && status.activeRecommendationId) {
              // A "meeting" session is already past the intro window (both confirmed continue), so it
              // never expires; an "introduced" session still owes the 5-minute window, counted from
              // when the match was made so a refresh resumes — not restarts — the countdown.
              const startedAt = status.introducedAt ? new Date(status.introducedAt).getTime() : Date.now();
              const expiresAt = startedAt + MATCH_WINDOW_MS;
              if (active.status === "introduced" && expiresAt <= Date.now()) {
                // The window lapsed while they were away: expire it server-side and land on home.
                void fetch(`/api/introduction/${status.activeRecommendationId}/expire`, { method: "POST" }).catch(() => {});
                setStep((current) => (current !== 0 ? current : 7));
              } else {
                setSessionId(active.id);
                setRecommendationId(status.activeRecommendationId);
                if (active.status === "introduced") setMatchExpiresAt(expiresAt);
                try {
                  const p = await jsonGet(`/api/introduction/${status.activeRecommendationId}`);
                  setCounterpart({ firstName: p.firstName ?? "Someone", roleTitle: p.roleTitle ?? "", currentWork: p.currentWork ?? "", reason: p.reason ?? "" });
                } catch { /* still land on the match; the screen re-fetches the counterpart */ }
                setStep((current) => (current !== 0 ? current : 11));
              }
            } else if (active.status === "searching") {
              setSessionId(active.id);
              setStep((current) => (current !== 0 ? current : 18));
            } else {
              setStep((current) => (current !== 0 ? current : 7));
            }
          } else {
            setStep((current) => (current !== 0 ? current : profile?.confirmed ? 7 : 2));
          }
        } catch { /* stay on the email step */ }
      }
    }).catch(() => { setSetup("setup_required"); setAuthMode("preview"); }).finally(() => setResuming(false));
  }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step, terminal]);
  // Location check is an opt-in beta the visitor toggles in account settings (off by default),
  // stored locally so it survives reloads without a server round-trip.
  useEffect(() => {
    try { setLocationCheck(window.localStorage.getItem(LOCATION_CHECK_KEY) === "1"); } catch { /* ignore */ }
  }, []);
  // Restore the saved Live/Demo choice. If none is stored, the post-sign-in modal will ask.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(MODE_KEY);
      if (stored === "live" || stored === "demo") { setMode(stored); setModeChosen(true); }
    } catch { /* ignore */ }
  }, []);
  // Ask for a mode the first time a signed-in visitor lands on home without a saved choice.
  useEffect(() => {
    if (!resuming && !modeChosen && step === 7 && (authMode === "magiclink" || authMode === "dev")) setShowModeModal(true);
  }, [resuming, modeChosen, step, authMode]);
  // Close the avatar photo-source menu when clicking anywhere outside it.
  useEffect(() => {
    if (!photoMenuOpen) return;
    const onDown = (event: MouseEvent) => { if (photoPickerRef.current && !photoPickerRef.current.contains(event.target as Node)) setPhotoMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [photoMenuOpen]);
  // Close the header profile menu when clicking anywhere outside it (mirrors the photo menu).
  useEffect(() => {
    if (!accountMenuOpen) return;
    const onDown = (event: MouseEvent) => { if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) setAccountMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [accountMenuOpen]);
  useEffect(() => {
    if (resuming) return;
    // Account settings is a pushed history entry that owns its own URL — never replace it away,
    // or Back/Done would be undone the moment this effect re-runs.
    if (pathname === "/account") return;
    // Keep the address bar in sync with the section of the flow: auth (sign-up/sign-in),
    // onboarding (profile creation), and home (everything after the profile is claimed).
    const section = terminal ? "/home" : step <= 1 ? (authIntent === "signin" ? "/sign-in" : "/sign-up") : step <= 6 ? "/onboarding" : "/home";
    if (pathname !== section) router.replace(section, { scroll: false });
  }, [step, terminal, authIntent, resuming, pathname, router]);
  useEffect(() => {
    const heading = document.querySelector<HTMLElement>(".journey-screen h1");
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }, [step, terminal]);
  // Real countdown for finding-each-other, reset every time a fresh introduction starts.
  useEffect(() => {
    if (step !== 14) return;
    setMeetingSecondsLeft(600);
    const interval = setInterval(() => setMeetingSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(interval);
  }, [step, recommendationId]);
  // The introduction is only live for MATCH_WINDOW_MS. While the match is shown (step 11), count
  // down to matchExpiresAt; when it lapses, expire it server-side — which frees both people — and
  // return home with a note. Clearing matchExpiresAt (Continue / Not now) stops this cleanly.
  useEffect(() => {
    if (step !== 11 || !matchExpiresAt) return;
    const tick = () => {
      const remaining = matchExpiresAt - Date.now();
      if (remaining > 0) { setMatchSecondsLeft(Math.ceil(remaining / 1000)); return; }
      setMatchSecondsLeft(0);
      const rec = recommendationId;
      setMatchExpiresAt(0);
      if (rec && setup === "configured") void fetch(`/api/introduction/${rec}/expire`, { method: "POST" }).catch(() => {});
      setRecommendationId(""); setSessionId(""); setCounterpart(null);
      setStep(7);
      setNotice("That introduction expired — you didn’t connect in time. Start another whenever you’re ready.");
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [step, matchExpiresAt, recommendationId, setup]);
  // The person already waiting in the pool has no way to learn their session was paired by
  // someone else's request_introduction call — poll their own session while on the "still
  // looking" screen so they get carried into the introduction automatically.
  useEffect(() => {
    if (step !== 18 || !sessionId || setup !== "configured") return;
    let cancelled = false;
    const checkStatus = async () => {
      try {
        const result = await jsonGet(`/api/session/${sessionId}`);
        if (cancelled || result.status !== "introduced" || !result.recommendationId) return;
        setRecommendationId(result.recommendationId);
        const person = await jsonGet(`/api/introduction/${result.recommendationId}`);
        if (cancelled) return;
        setCounterpart({ firstName: person.firstName ?? "Someone", roleTitle: person.roleTitle ?? "", currentWork: person.currentWork ?? "", reason: person.reason ?? "" });
        setMatchExpiresAt(Date.now() + MATCH_WINDOW_MS);
        go(11);
      } catch { /* keep polling */ }
    };
    const interval = setInterval(checkStatus, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [step, sessionId, setup]);
  const person = counterpart ?? PREVIEW_COUNTERPART;
  const personInitial = (person.firstName[0] ?? "?").toUpperCase();
  // Order-confirmed is still simulated as passing (see step 8); presence is now real when the
  // location check is on. With the check on, always route through the presence screen (step 8) so a
  // cafe is resolved before a session starts; with it off, skip straight to choosing a conversation.
  const goMeetSomeone = () => go(mode === "demo" ? 9 : locationCheck ? 8 : 9);
  // Resolve which Corgi Cafe the visitor is standing in from the browser's coordinates.
  const useMyLocation = () => {
    setLocationError("");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("Location isn’t available here — pick your cafe below.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const hit = nearestCafe(pos.coords.latitude, pos.coords.longitude);
        if (hit) { setCafeCode(hit.cafe.code); setCafeLabel(hit.cafe.name); setAtCafe(true); setLocationVerified(true); }
        else { setAtCafe(false); setCafeLabel(""); setLocationVerified(false); setLocationError("You don’t seem to be at a Corgi Cafe right now."); }
        setLocating(false);
      },
      () => { setLocationVerified(false); setLocationError("We couldn’t read your location — pick your cafe below."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };
  const pickCafe = (code: string) => {
    const cafe = CORGI_CAFES.find((c) => c.code === code);
    if (!cafe) return;
    // A manual pick resolves the cafe for matching, but is not a system-verified presence, so the
    // dot stays neutral and the pill keeps its "find a cafe" redirect.
    setCafeCode(cafe.code); setCafeLabel(cafe.name); setAtCafe(true); setLocationVerified(false); setLocationError("");
  };
  const setLocationCheckFlag = (on: boolean) => {
    setLocationCheck(on);
    try { window.localStorage.setItem(LOCATION_CHECK_KEY, on ? "1" : "0"); } catch { /* ignore */ }
    if (!on) { setAtCafe(true); setCafeCode(DEFAULT_CAFE_CODE); setCafeLabel(""); setLocationVerified(false); setLocationError(""); }
  };
  const setModeFlag = (next: "live" | "demo") => {
    setMode(next); setModeChosen(true); setShowModeModal(false);
    try { window.localStorage.setItem(MODE_KEY, next); } catch { /* ignore */ }
    if (next === "demo") setLocationCheckFlag(false); // Demo is location-less.
  };
  const cleanLinks = useMemo(() => Object.entries(links).flatMap(([kind, url]) => url.trim() ? [{ kind: kind as LinkKind, url: url.trim() }] : []), [links]);
  const go = (next: number) => { setError(""); setNotice(""); setStep(next); };
  const back = () => go(Math.max(0, step - 1));
  const save = async (body: unknown) => { const result = await jsonPost("/api/persist", body); if (result.status === "preview_only") setNotice("Supabase is not connected. This preview continues without saving."); return result; };
  const record = (eventName: string, context: Record<string, string | number | boolean | null> = {}) => {
    void save({ kind: "event", event: { eventName, stepId: `matching_${step}`, context } }).catch(() => undefined);
  };
  const accountInitials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?";
  const logout = async (redirectTo = "/sign-in") => {
    setAccountMenuOpen(false);
    try { await fetch("/api/auth/logout", { method: "POST" }); } finally { window.location.href = redirectTo; }
  };
  // Defined here (before Shell/shellState reference it) so the header menu can open account settings.
  // Shallow-route to /account via the History API (not router.push): the App Router patches
  // pushState so usePathname flips to "/account" WITHOUT unmounting/remounting this component or
  // re-running the resume fetches — the account screen opens instantly, and it's a real history
  // entry so browser Back returns to /home. (A hard reload/deeplink on /account is served by
  // app/account/page.tsx.)
  const openAccount = () => { setAccountMenuOpen(false); setError(""); setAccountNotice(""); setDeleteArmed(false); window.history.pushState(null, "", "/account"); };
  // Shell must keep a stable identity across renders — defining a component function inline in
  // the render body (as this used to) makes React remount its whole subtree on every keystroke
  // anywhere in the app (any state change here creates a "new" Shell type), which drops focus out
  // of every input after one character. It's created once via useMemo and reads the account/auth
  // values it needs from a ref that's refreshed every render, so it stays fresh without being
  // recreated.
  const shellState = useRef({ accountMenuOpen, accountInitials, avatarUrl, email, authMode, logout, openAccount, mode, setModeFlag, showModeModal });
  shellState.current = { accountMenuOpen, accountInitials, avatarUrl, email, authMode, logout, openAccount, mode, setModeFlag, showModeModal };
  const Shell = useMemo(() => function Shell({ step: shellStep, children, wide = false, hideProgress = false }: { step: number; children: ReactNode; wide?: boolean; hideProgress?: boolean }) {
    const { accountMenuOpen, accountInitials, avatarUrl, email, authMode, logout, openAccount, mode, setModeFlag, showModeModal } = shellState.current;
    const progress = Math.min(100, Math.max(8, ((Math.min(shellStep, 7) + 1) / 7) * 100));
    const showAccount = shellStep >= 7 && authMode !== "preview" && authMode !== "checking";
    return <main className="journey-shell"><SiteHeader right={<>{showAccount && <div className="mode-switch" role="group" aria-label="Live or Demo mode"><button type="button" className={mode === "live" ? "selected" : ""} aria-pressed={mode === "live"} onClick={() => setModeFlag("live")}>Live</button><button type="button" className={mode === "demo" ? "selected" : ""} aria-pressed={mode === "demo"} onClick={() => setModeFlag("demo")}>Demo</button></div>}{showAccount && <div className="account-menu" ref={accountMenuRef} onMouseEnter={() => setAccountMenuOpen(true)} onMouseLeave={() => setAccountMenuOpen(false)}><button type="button" className="account-avatar" aria-haspopup="true" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)}>{isRealPhoto(avatarUrl) ? <img className="avatar-img" src={avatarUrl} alt="" /> : accountInitials}</button>{accountMenuOpen && <div className="account-dropdown" role="menu"><div className="account-email-row"><span className="account-email-label">Signed in as</span><span className="account-email">{email}</span></div><button type="button" role="menuitem" onClick={openAccount}>Settings</button><button type="button" role="menuitem" onClick={() => logout()}>Log out</button></div>}</div>}{locationVerified
      ? <span className="cafe-pill verified" title={`Verified: you’re at ${cafeLabel || "a Corgi Cafe"}`}><span className="cafe-pill-dot" aria-hidden="true" />{cafeLabel ? <><b>{cafeLabel}</b> · Corgi Cafe</> : "Corgi Cafe"}</span>
      : <a className="cafe-pill" href="https://www.corgicafe.com/locations" target="_blank" rel="noopener noreferrer" title="Find a Corgi Cafe near you"><span className="cafe-pill-dot" aria-hidden="true" />{cafeLabel ? <><b>{cafeLabel}</b> · Corgi Cafe</> : "Corgi Cafe"}</a>}</>} />{!hideProgress && shellStep <= 6 && <div className="journey-progress" role="progressbar" aria-label={`Onboarding step ${shellStep + 1} of 7`} aria-valuemin={1} aria-valuemax={7} aria-valuenow={shellStep + 1}><span style={{ width: `${progress}%` }} /></div>}<section className={`journey-screen ${wide ? "wide" : ""}`}>{children}</section>{showModeModal && <div className="mode-modal" role="dialog" aria-modal="true" aria-labelledby="mode-modal-title"><div className="mode-modal-card"><h2 id="mode-modal-title">How do you want to start?</h2><p>You can switch anytime from the top bar.</p><div className="mode-modal-choices"><button type="button" className="mode-choice" onClick={() => setModeFlag("live")}><strong>Live</strong><span>Meet someone who’s at your café right now — a real introduction.</span></button><button type="button" className="mode-choice" onClick={() => setModeFlag("demo")}><strong>Demo</strong><span>Just exploring? Walk through the whole experience with a sample match — no one else needed.</span></button></div></div></div>}</main>;
  }, []);
  // Post-introduction writes. Guarded on a real recommendation id, so preview mode never posts them.
  // Awaitable: the recognition-media upload (next step) is gated by RLS on this decision being
  // recorded as "continue". Callers that advance into the photo step must await it, or the upload
  // races ahead of the write and is rejected ("Your photo could not be uploaded").
  const saveDecision = async (choice: "continue" | "pass") => {
    if (!recommendationId) return;
    try { await save({ kind: "decision", decision: { recommendationId, choice } }); } catch { /* ignore */ }
  };
  const saveMeeting = async (answer: "met" | "not_yet") => {
    if (!recommendationId) return;
    await save({ kind: "meeting", meeting: { recommendationId, answer } }).catch(() => undefined);
  };
  const saveFeedback = (rating: "very_unhelpful" | "unhelpful" | "neutral" | "helpful" | "very_helpful", note?: string) => {
    if (!recommendationId) return;
    void save({ kind: "feedback", feedback: { recommendationId, rating, note: note?.trim() || undefined } }).catch(() => undefined);
  };
  const uploadRecognitionPhoto = async (kind: "self" | "nearby", file: File | undefined) => {
    if (!file || !recommendationId) return;
    setUploadingPhoto(kind); setError("");
    try {
      const form = new FormData();
      form.set("file", file); form.set("kind", kind); form.set("recommendationId", recommendationId);
      const response = await fetch("/api/recognition", { method: "POST", body: form });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Your photo could not be uploaded.");
      const preview = URL.createObjectURL(file);
      if (kind === "self") { setPhotoSelf(true); setPhotoSelfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return preview; }); }
      else { setPhotoNearby(true); setPhotoNearbyUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return preview; }); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Your photo could not be uploaded."); }
    finally { setUploadingPhoto(""); }
  };

  const startEmail = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError("");
    try { const result = await jsonPost("/api/auth/start", { email }); if (result.mode === "preview") setNotice(result.message); go(1); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "We could not send a code."); }
    finally { setLoading(false); }
  };
  const verify = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError("");
    try { const result = await jsonPost("/api/auth/verify", { email, token: otp }); if (result.mode === "preview") setNotice("Preview mode: nothing will be saved until Supabase is connected."); go(2); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "That code did not work."); }
    finally { setLoading(false); }
  };
  const search = async () => {
    setLoading(true); setError("");
    try {
      const response = await jsonPost("/api/search", { input: { identity: { email, firstName, lastName }, location, seedWorkContext: `${role} at ${company}`, urls: [] } });
      setCandidates(response.candidates ?? []); setCandidateId("");
      if (!(response.candidates ?? []).length) setNotice("No reliable profile appeared. You can continue with the details you entered.");
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Profile search is unavailable. Continue with your details."); }
    finally { setLoading(false); }
  };
  const chooseCandidate = () => {
    const candidate = candidates.find((item) => item.id === candidateId);
    if (!candidate) return;
    // Adopt the candidate's public photo (e.g. their LinkedIn headshot) as this member's avatar.
    if (isRealPhoto(candidate.imageUrl)) setAvatarUrl(candidate.imageUrl);
    // Capture the confirmed candidate's trajectory as enrichment (is-founder, past companies).
    setEnrichment(deriveEnrichment(candidate));
    if (!candidate.identifierOnly && candidate.mayExtractFacts) {
      setRole(candidate.title || role); setCompany(candidate.company || company); setLocation(candidate.location || location);
      setCandidateSource({ kind: "website", url: candidate.profileUrl });
    } else {
      setCandidateSource({ kind: "linkedin_identifier", url: candidate.profileUrl });
      setLinks((current) => ({ ...current, linkedin_identifier: candidate.profileUrl }));
    }
    go(4);
  };
  const persistProfile = async () => {
    setLoading(true); setError("");
    try {
      await save({ kind: "profile", profile: { firstName, lastName, broadLocation: location, roleTitle: role, companyOrProject: company, aboutMe: about, currentWork, favoriteDrink, avatarUrl: isRealPhoto(avatarUrl) ? avatarUrl : undefined, sources: [...cleanLinks, ...(candidateSource && !cleanLinks.some((item) => item.url === candidateSource.url) ? [candidateSource] : [])], ...(enrichment ? { enrichment } : {}) } });
      // Fire-and-forget: enrich the profile from the URLs just saved (company stage, hiring, thesis).
      // Deliberately not awaited — it must never delay landing on home or the first match.
      if (cleanLinks.length || candidateSource) void fetch("/api/enrich", { method: "POST" }).catch(() => {});
      go(7);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Your profile could not be saved."); }
    finally { setLoading(false); }
  };
  // Mirror the browser Back button: pop the pushed /account entry to return to /home.
  const closeAccount = () => { setDeleteArmed(false); setAccountNotice(""); window.history.back(); };
  // Save profile edits without leaving the settings screen (upsert, so it updates the existing row).
  const saveAccount = async () => {
    setLoading(true); setError(""); setAccountNotice("");
    try {
      await save({ kind: "profile", profile: { firstName, lastName, broadLocation: location, roleTitle: role, companyOrProject: company, aboutMe: about, currentWork, favoriteDrink, avatarUrl: isRealPhoto(avatarUrl) ? avatarUrl : undefined, sources: cleanLinks } });
      setAccountNotice("Saved.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Your changes could not be saved."); }
    finally { setLoading(false); }
  };
  // Upload a new profile photo from account settings (camera / photo library / file chooser all
  // funnel here). The route stores it in the public avatars bucket and returns the public URL,
  // which we adopt immediately so every avatar on screen updates without a reload.
  const uploadAvatar = async (file: File | undefined) => {
    if (!file) return;
    setUploadingAvatar(true); setError(""); setAccountNotice("");
    try {
      const form = new FormData(); form.set("file", file);
      const response = await fetch("/api/account/avatar", { method: "POST", body: form });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Your photo could not be uploaded.");
      if (result.avatarUrl) { setAvatarUrl(result.avatarUrl); setAccountNotice("Photo updated."); }
      else setAccountNotice("Supabase is not connected, so the photo was not saved.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Your photo could not be uploaded."); }
    finally { setUploadingAvatar(false); }
  };
  const deleteAccount = async () => {
    setDeleting(true); setError("");
    try {
      const response = await fetch("/api/account/delete", { method: "POST" });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.message || "Your account could not be deleted."); }
      window.location.href = "/";
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Your account could not be deleted."); setDeleting(false); }
  };
  const chooseBranch = async () => {
    if (branch === "community") { try { await save({ kind: "community_interest" }); } catch { /* screen remains truthful */ } setTerminal("community"); return; }
    if (branch === "later") { record("onboarding_deferred"); await logout("/"); return; }
    goMeetSomeone();
  };
  const startSession = async () => {
    setLoading(true); setError("");
    try {
      const resolvedTopics = topics.map((topic) => (topic === "Other" ? otherTopic.trim() : topic)).filter(Boolean);
      const result = await save({ kind: "session", session: { orderConfirmedToday: true, atCafe, cafeCode, mode, conversationMode, topics: conversationMode === "specific" ? resolvedTopics : [], usefulContext: useful, offerContext: offer, boundaries: commercial } });
      const sid = typeof result?.sessionId === "string" ? result.sessionId : "";
      setSessionId(sid);
      go(10);
      // Demo: re-arm the isolated demo pool with this session's exact boundaries so the real matcher
      // has a compatible counterpart to pick. Best-effort — a failure just yields an honest no-match.
      if (mode === "demo" && setup === "configured") {
        try { await jsonPost("/api/demo/seed", { boundaries: commercial }); } catch { /* fall through to match */ }
      }
      await runMatch(sid);
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Your intro session could not be started."); go(9); }
    finally { setLoading(false); }
  };
  // Ask the reviewed matcher for one worthwhile counterpart. No fabricated match ever reaches a
  // configured (real-database) session: it's either a real pairing, an honest no-match, or — only
  // when no database is connected — a clearly-labelled preview introduction.
  const runMatch = async (sid: string) => {
    const target = sid || sessionId;
    if (setup !== "configured" || !target) {
      setCounterpart(PREVIEW_COUNTERPART); setRecommendationId("");
      await new Promise((resolve) => setTimeout(resolve, 900));
      setStep((value) => (value === 10 ? 11 : value));
      return;
    }
    try {
      const match = await jsonPost("/api/match", { sessionId: target });
      if (match.status === "no_match") { go(18); return; }
      if (match.status === "preview") { setCounterpart(PREVIEW_COUNTERPART); setRecommendationId(""); go(11); return; }
      const rec = match.recommendationId as string;
      setRecommendationId(rec);
      const person = await jsonGet(`/api/introduction/${rec}`);
      setCounterpart({ firstName: person.firstName ?? "Someone", roleTitle: person.roleTitle ?? "", currentWork: person.currentWork ?? "", reason: person.reason ?? "" });
      setMatchExpiresAt(Date.now() + MATCH_WINDOW_MS);
      go(11);
    } catch { go(18); }
  };
  const loadLinks = async () => {
    if (setup !== "configured" || !recommendationId) { setPostLinks(PREVIEW_LINKS); return; }
    try {
      const result = await jsonGet(`/api/introduction/${recommendationId}/links`);
      setPostLinks(Array.isArray(result.links) ? result.links : []);
    } catch { setPostLinks([]); }
  };

  if (resuming) return <Shell step={0} hideProgress><div className="center"><div className="loader" aria-label="Checking your session"><i/><i/><i/></div></div></Shell>;

  if (accountView) return <Shell step={7} wide><Header eyebrow="Account" title="My Profile">Edit your details, add links, or delete your account. Everything here came from your onboarding and stays editable.</Header><div className="account-photo"><div className="photo-picker" ref={photoPickerRef}><button type="button" className="account-photo-current" aria-haspopup="menu" aria-expanded={photoMenuOpen} onClick={() => setPhotoMenuOpen((open) => !open)} disabled={uploadingAvatar} title="Change profile photo">{isRealPhoto(avatarUrl) ? <img className="avatar-img" src={avatarUrl} alt="" /> : <span aria-hidden="true">{accountInitials}</span>}<span className="photo-edit-overlay" aria-hidden="true"><CameraIcon /></span></button>{photoMenuOpen && <div className="photo-menu" role="menu"><button type="button" role="menuitem" onClick={() => { setPhotoMenuOpen(false); avatarCameraInputRef.current?.click(); }}>Take photo</button><button type="button" role="menuitem" onClick={() => { setPhotoMenuOpen(false); avatarPhotoInputRef.current?.click(); }}>Upload photo</button><button type="button" role="menuitem" onClick={() => { setPhotoMenuOpen(false); avatarFileInputRef.current?.click(); }}>Upload file</button></div>}</div><div className="account-photo-actions"><span className="account-photo-label">Profile photo</span><span className="account-photo-hint">{uploadingAvatar ? "Uploading…" : "Tap your photo to change it"}</span></div><input ref={avatarCameraInputRef} type="file" accept="image/*" capture="user" hidden onChange={(e) => uploadAvatar(e.target.files?.[0])} /><input ref={avatarPhotoInputRef} type="file" accept="image/*" hidden onChange={(e) => uploadAvatar(e.target.files?.[0])} /><input ref={avatarFileInputRef} type="file" hidden onChange={(e) => uploadAvatar(e.target.files?.[0])} /></div><div className="journey-grid"><Field label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} /><Field label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} /></div><div className="journey-stack"><Field label="City or region" value={location} onChange={(e) => setLocation(e.target.value)} /><Field label="Role or title" value={role} onChange={(e) => setRole(e.target.value)} /><Field label="Company or project" value={company} onChange={(e) => setCompany(e.target.value)} /><TextBox label="About me" value={about} onChange={(e) => setAbout(e.target.value)} /><Field label="What are you working on?" value={currentWork} onChange={(e) => setCurrentWork(e.target.value)} /><Field label="Favorite drink at Corgi Cafe" value={favoriteDrink} onChange={(e) => setFavoriteDrink(e.target.value)} /></div><hr className="section-divider" /><h2 className="account-section-title">Links</h2><div className="journey-stack"><Field label="LinkedIn" type="url" value={links.linkedin_identifier} onChange={(e) => setLinks({ ...links, linkedin_identifier: e.target.value })} /><Field label="Personal or company website" type="url" value={links.website} onChange={(e) => setLinks({ ...links, website: e.target.value })} /><Field label="GitHub" type="url" value={links.github} onChange={(e) => setLinks({ ...links, github: e.target.value })} /><Field label="Other public link" type="url" value={links.social} onChange={(e) => setLinks({ ...links, social: e.target.value })} /></div>{error && <p className="journey-error">{error}</p>}{accountNotice && <p className="inline-status">{accountNotice}</p>}<Actions><Primary onClick={saveAccount} disabled={loading || deleting}>{loading ? "Saving…" : "Save changes"}</Primary><Secondary onClick={closeAccount} disabled={deleting}>Done</Secondary></Actions><hr className="section-divider" /><h2 className="account-section-title">Experimental</h2><label className="toggle-row"><span className="toggle-copy"><strong>Require Corgi Cafe location</strong><small>Ask for your location during search and only match people who are at the same Corgi Cafe in person.</small></span><input type="checkbox" role="switch" checked={locationCheck} onChange={(e) => setLocationCheckFlag(e.target.checked)} /></label><div className="danger-zone"><h2>Delete account</h2><p>Permanently removes your profile, links, and history. This can’t be undone.</p>{!deleteArmed ? <button type="button" className="journey-button danger" onClick={() => setDeleteArmed(true)}>Delete my account</button> : <div className="danger-confirm"><p><strong>Are you sure?</strong> This permanently deletes everything.</p><Actions><button type="button" className="journey-button danger" onClick={deleteAccount} disabled={deleting}>{deleting ? "Deleting…" : "Yes, delete forever"}</button><Quiet onClick={() => setDeleteArmed(false)} disabled={deleting}>Cancel</Quiet></Actions></div>}</div></Shell>;

  if (terminal) {
    const content = terminal === "community" ? ["Interest recorded", "You’re on the list.", setup === "configured" ? "Corgi recorded your interest in the private community. Membership and access are separate." : "This preview did not save your interest because Supabase is not connected."] : terminal === "later" ? ["Come back anytime", "Your profile is ready.", setup === "configured" ? "Your confirmed profile is saved. Start an intro session during another Cafe visit." : "This preview did not save a profile because Supabase is not connected."] : terminal === "pass" ? ["Introduction ended", "No awkward moment.", "No one is told who passed or why. Any temporary photos are removed promptly."] : terminal === "not_met" ? ["Couldn’t meet this time", "Nothing was recorded.", "Links stay private and temporary photos are removed promptly."] : terminal === "notify" ? ["No introduction yet", "We’ll let you know.", "We’ll email you as soon as Corgi finds someone worth meeting."] : ["All set", "Thanks for showing up.", "Your private feedback helps Corgi make future introductions more useful."];
    return <Shell step={12}><div className="terminal-mark">✓</div><Header eyebrow={content[0]} title={content[1]}>{content[2]}</Header><Actions><Primary onClick={() => { setTerminal(""); go(7); }}>Back to Corgi</Primary></Actions></Shell>;
  }

  if (step === 0) return <Shell step={0}><Header eyebrow="Let’s start" title={authIntent === "signin" ? "Sign in to Corgi." : "Start an introduction."}>{authIntent === "signin" ? "Enter the email on your Corgi account and we’ll send you a sign-in link." : "Sign up to create a profile for conversations at Corgi."}</Header>{setup === "setup_required" && <aside className="setup-banner"><strong>Database setup needed</strong><span>You can review the flow, but accounts and interactions will not be saved until Supabase is connected.</span></aside>}<form onSubmit={startEmail}><div className="journey-stack"><Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>{error && <p className="journey-error">{error}</p>}<Actions><Primary disabled={loading || !email.includes("@")} type="submit">{loading ? "Sending…" : authIntent === "signin" ? "Sign in" : "Sign up"}</Primary></Actions></form><p className="auth-switch">{authIntent === "signin" ? <>New here? <button type="button" onClick={() => setAuthIntent("signup")}>Sign up</button></> : <>Already have an account? <button type="button" onClick={() => setAuthIntent("signin")}>Sign in</button></>}</p><div className="divider">or</div><a className="journey-button secondary google-button" href="/api/auth/google"><GoogleMark />Continue with Google</a></Shell>;
  if (step === 1) {
    const masked = email.replace(/^(.).+(@.*)$/, "$1•••$2");
    if (authMode === "magiclink") return <Shell step={1}><Header eyebrow="Check your email" title="Click your sign-in link.">We emailed a secure sign-in link to {masked}. Open it on this device and Corgi brings you right back here, signed in.</Header><Actions><Secondary type="button" onClick={() => jsonPost("/api/auth/start", { email }).then(() => setNotice("A new link is on its way.")).catch(() => setError("We could not resend the link."))}>Resend link</Secondary><Quiet type="button" onClick={() => go(0)}>Use a different email</Quiet></Actions>{notice && <p className="inline-status">{notice}</p>}{error && <p className="journey-error">{error}</p>}</Shell>;
    return <Shell step={1}><Header eyebrow="Check your email" title="Enter your code.">{authMode === "dev" ? "Dev login is on — enter any six-digit code to continue." : `We sent a six-digit code to ${masked}.`}</Header>{authMode === "dev" && <p className="preview-note">Dev login: any six-digit code works.</p>}{setup === "setup_required" && <p className="preview-note">Preview code: <strong>424242</strong>. Nothing will be saved.</p>}<form onSubmit={verify}><div className="journey-stack"><Field label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} /></div>{error && <p className="journey-error">{error}</p>}<Actions><Primary disabled={loading || otp.length !== 6} type="submit">Verify</Primary><Secondary type="button" onClick={() => jsonPost("/api/auth/start", { email }).then(() => setNotice("A new code was sent.")).catch(() => setError("We could not resend the code."))}>Resend code</Secondary><Quiet type="button" onClick={() => go(0)}>Use a different email</Quiet></Actions>{notice && <p className="inline-status">{notice}</p>}</form></Shell>;
  }
  if (step === 2) return <Shell step={2} wide><Header eyebrow="About you" title="A little about you.">These details help us find the profile that feels most like you.</Header><form onSubmit={(e) => { e.preventDefault(); go(3); void search(); }}><div className="journey-grid"><Field label="First name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} /><Field label="Last name" required value={lastName} onChange={(e) => setLastName(e.target.value)} /><Field label="City or region" required value={location} onChange={(e) => setLocation(e.target.value)} /><Field label="Role or title" required value={role} onChange={(e) => setRole(e.target.value)} /><Field label="Company or project" required value={company} onChange={(e) => setCompany(e.target.value)} /></div><Actions><Primary type="submit" disabled={!firstName || !lastName || !location || !role || !company}>Continue</Primary><Quiet type="button" onClick={back}>Back</Quiet></Actions></form></Shell>;
  if (step === 3) return <Shell step={3} wide><Header eyebrow="Your profile" title="Which profile looks like yours?">Choose the profile that’s you, or skip to add your details.</Header>{loading && <div className="loader" aria-label="Finding your profile"><i/><i/><i/></div>}{!loading && candidates.length > 0 && <><fieldset className="candidate-list"><legend>Choose your profile</legend>{candidates.slice(0, 3).map((candidate) => <label className={`candidate-card ${candidateId === candidate.id ? "selected" : ""}`} key={candidate.id}><input type="radio" name="candidate" checked={candidateId === candidate.id} onChange={() => setCandidateId(candidate.id)} /><span className="candidate-avatar" aria-hidden="true">{isRealPhoto(candidate.imageUrl) ? <img className="avatar-img" src={candidate.imageUrl} alt="" /> : `${candidate.firstName[0] ?? ""}${candidate.lastName[0] ?? ""}`.toUpperCase()}</span><span><strong>{candidate.firstName} {candidate.lastName}</strong><small>{[candidate.title, candidate.company].filter(Boolean).join(" · ") || "Public professional profile"}</small></span></label>)}</fieldset><Actions><Primary onClick={chooseCandidate} disabled={!candidateId}>Continue</Primary><Secondary onClick={() => go(4)}>None of these</Secondary><Quiet onClick={back}>Back</Quiet></Actions></>}{!loading && candidates.length === 0 && <><p className="journey-intro">We couldn’t find a public profile to match. Add your details on the next step.</p><Actions><Primary onClick={() => go(4)}>Continue</Primary><Quiet onClick={back}>Back</Quiet></Actions></>}{notice && <p className="inline-status">{notice}</p>}</Shell>;
  if (step === 4) return <Shell step={4} wide><Header eyebrow="Your profile" title={<>Add your public links <span className="optional-badge">Optional</span></>}>Share any links that help your profile feel more like you.</Header>{notice && <p className="preview-note">{notice}</p>}<div className="journey-stack"><Field label="LinkedIn" type="url" value={links.linkedin_identifier} onChange={(e) => setLinks({ ...links, linkedin_identifier: e.target.value })} /><Field label="Personal or company website" type="url" value={links.website} onChange={(e) => setLinks({ ...links, website: e.target.value })} /><Field label="GitHub" type="url" value={links.github} onChange={(e) => setLinks({ ...links, github: e.target.value })} /><Field label="Other public link" type="url" value={links.social} onChange={(e) => setLinks({ ...links, social: e.target.value })} /></div><Actions><Primary onClick={() => go(5)}>Continue</Primary><Quiet onClick={back}>Back</Quiet></Actions></Shell>;
  if (step === 5) return <Shell step={5} wide><Header eyebrow="Your profile" title="Here’s how you’ll show up.">Review your profile before you meet anyone.</Header><article className="profile-card"><div className="profile-card-head"><span className="profile-card-avatar" aria-hidden="true">{isRealPhoto(avatarUrl) ? <img className="avatar-img" src={avatarUrl} alt="" /> : accountInitials}</span><div><h2>{firstName} {lastName}</h2><p className="profile-sub">{role} at {company} · {location}</p></div></div>{about && <p className="profile-about">{about}</p>}<dl>{currentWork && <div><dt>Working on</dt><dd>{currentWork}</dd></div>}{favoriteDrink && <div><dt>Favorite at Corgi Cafe</dt><dd>{favoriteDrink}</dd></div>}{cleanLinks.length > 0 && <div><dt>Links</dt><dd>{cleanLinks.map((link) => link.kind.replace("_identifier", "")).join(" · ")}</dd></div>}</dl></article>{error && <p className="journey-error">{error}</p>}<Actions><Primary onClick={persistProfile} disabled={loading}>{loading ? "Saving…" : "Confirm profile"}</Primary><Secondary onClick={() => go(6)}>Add more details</Secondary><Quiet onClick={back}>Back</Quiet></Actions></Shell>;
  if (step === 6) return <Shell step={6} wide><Header eyebrow="Your profile" title="Make your profile feel like you.">Add a few details that can help someone start a good conversation.</Header><div className="journey-stack"><TextBox label="About me" value={about} onChange={(e) => setAbout(e.target.value)} /><Field label="What are you working on?" value={currentWork} onChange={(e) => setCurrentWork(e.target.value)} /><Field label="Favorite drink at Corgi Cafe" value={favoriteDrink} onChange={(e) => setFavoriteDrink(e.target.value)} /></div>{error && <p className="journey-error">{error}</p>}{notice && <p className="preview-note">{notice}</p>}<Actions><Primary onClick={persistProfile} disabled={loading}>{loading ? "Saving…" : "Continue to Corgi"}</Primary><Quiet onClick={back}>Back</Quiet></Actions></Shell>;
  if (step === 7) return <Shell step={7} wide><Header eyebrow="Profile ready" title="What would you like to do next?">Choose what feels right today.</Header><div className="visual-options">{([['cafe','cafe','Meet someone at the Cafe','Find one worthwhile conversation while you’re here.'],['community','community','Join Corgi’s private community','Stay connected with members beyond today’s visit.'],['later','later','Maybe later','Come back whenever it feels right.']] as const).map(([value, art, title, detail]) => <button key={value} type="button" className={`visual-option ${branch === value ? "selected" : ""}`} aria-pressed={branch === value} onClick={() => setBranch(value)}><span className={`option-art ${art}-art`} aria-hidden="true"><i/><i/>{art === "cafe" && <b/>}</span><span><strong>{title}</strong><small>{detail}</small></span></button>)}</div>{notice && <p className="inline-status">{notice}</p>}<Actions><Primary onClick={chooseBranch}>Continue</Primary></Actions></Shell>;
  if (step === 8) return <Shell step={8}>{locationCheck
    ? <><Header eyebrow="Meet at the Cafe" title="Are you at a Corgi Cafe?">Corgi introductions happen in person, so we confirm you’re here before matching you with anyone.</Header>
        <Actions><Primary onClick={useMyLocation} disabled={locating}>{locating ? "Locating…" : "Use my location"}</Primary></Actions>
        {cafeLabel && <p className="inline-status">You’re at <strong>{cafeLabel}</strong>.</p>}
        {locationError && <p className="journey-error">{locationError}</p>}
        <div className="cafe-picker"><span className="cafe-picker-label">Or choose your cafe</span><div className="cafe-picker-grid">{CORGI_CAFES.map((cafe) => <button key={cafe.code} type="button" className={atCafe && cafeCode === cafe.code ? "selected" : ""} aria-pressed={atCafe && cafeCode === cafe.code} onClick={() => pickCafe(cafe.code)}>{cafe.name}</button>)}</div></div>
        <p className="privacy-line">Only which cafe you’re at is used — never your exact location or movement.</p>
        <Actions><Primary onClick={() => go(9)} disabled={!atCafe || !cafeLabel}>Choose a conversation</Primary></Actions></>
    : <><Header eyebrow="Meet at the Cafe" title="Two quick checks">You’ll need both to meet someone here.</Header><div className="eligibility-grid"><article><span>✓</span><div><strong>Ordered here today?</strong><small>Yes, confirmed for this account.</small></div></article><article><span>✓</span><div><strong>At Corgi now?</strong><small>Yes, current Cafe check passed.</small></div></article></div><aside className="ready-strip"><strong>You’re ready.</strong><span>Only the Cafe result is kept, not exact coordinates or movement.</span></aside><Actions><Primary onClick={() => go(9)}>Choose a conversation</Primary></Actions></>
  }</Shell>;
  if (step === 9) return <Shell step={9} wide><Header eyebrow="Today at Corgi" title="What type of conversation do you want?"/><div className="journey-stack"><button className={`mode-card ${conversationMode === "specific" ? "selected" : ""}`} onClick={() => setConversationMode("specific")}><strong>I have something in mind</strong><small>Choose a topic for today.</small></button><button className={`mode-card ${conversationMode === "open" ? "selected" : ""}`} onClick={() => setConversationMode("open")}><strong>Just looking to meet interesting people</strong><small>Corgi will still look for a thoughtful fit.</small></button></div><hr className="section-divider" />{conversationMode === "specific" && <section className="topic-panel"><h2>What’s on your mind?</h2><div className="topic-grid">{[...topicOptions, "Other"].map((topic) => <button key={topic} className={topics.includes(topic) ? "selected" : ""} aria-pressed={topics.includes(topic)} onClick={() => setTopics(topics.includes(topic) ? topics.filter((item) => item !== topic) : [...topics, topic])}>{topic}</button>)}</div>{topics.includes("Other") && <TextBox label="Tell us what’s on your mind" value={otherTopic} onChange={(e) => setOtherTopic(e.target.value)} />}</section>}<div className="journey-grid intent-details"><TextBox label="What would you like help on?" value={useful} onChange={(e) => setUseful(e.target.value)} /><TextBox label="What can you help with?" value={offer} onChange={(e) => setOffer(e.target.value)} /></div>{error && <p className="journey-error">{error}</p>}<Actions><Primary disabled={loading || (conversationMode === "specific" && (topics.length === 0 || (topics.includes("Other") && !otherTopic.trim())))} onClick={startSession}>Continue</Primary></Actions></Shell>;
  if (step === 10) return <Shell step={10}><div className="loader" aria-label="Finding someone"><i/><i/><i/></div><div className="center"><Header eyebrow="One moment" title="Corgi is finding someone worth meeting.">We’ll only make an introduction when the conversation looks promising.</Header><aside className="community-note"><strong>A quick community note</strong><span>Keep it conversational. No direct fundraising asks or recruiting.</span></aside></div></Shell>;
  if (step === 11) return <Shell step={11}><div className="intro-person"><div className="intro-symbol">{personInitial}</div><div className="intro-person-text"><Header eyebrow="A Corgi introduction" title={`Meet ${person.firstName}`}>{person.roleTitle}</Header></div></div>{matchExpiresAt ? <p className="match-window">{windowBucket(matchSecondsLeft) ? <>We’ll hold this intro for about <strong>{windowBucket(matchSecondsLeft)}</strong> — no rush, continue when you’re ready.</> : <>This intro just wrapped up — head back and we’ll find you another.</>}</p> : null}<div className="meet-reason"><span>Why you should meet</span><strong>{person.reason}</strong></div><p className="privacy-line">Based only on details you both confirmed.</p><Actions><Primary onClick={async () => { setMatchExpiresAt(0); record("introduction_continue"); await saveDecision("continue"); go(13); }}>Continue</Primary><Quiet onClick={() => { setMatchExpiresAt(0); record("introduction_passed"); saveDecision("pass"); setTerminal("pass"); }}>Not now</Quiet></Actions></Shell>;
  if (step === 13) return <Shell step={13} wide><Header eyebrow={`Help ${person.firstName} spot you`} title="Add two quick photos"/><div className="capture-grid"><article><button type="button" className={`capture-image ${photoSelf ? "taken" : ""}`} style={photoSelfUrl ? { backgroundImage: `url(${photoSelfUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} disabled={uploadingPhoto !== ""} onClick={() => selfPhotoInputRef.current?.click()}>{photoSelfUrl ? "" : uploadingPhoto === "self" ? "…" : "+"}</button><input ref={selfPhotoInputRef} type="file" accept="image/*" capture="user" hidden onChange={(e) => uploadRecognitionPhoto("self", e.target.files?.[0])} /><strong>You + what you’re wearing</strong><small>{photoSelf ? "Photo added" : uploadingPhoto === "self" ? "Uploading…" : "Photo needed"}</small></article><article><button type="button" className={`capture-image nearby ${photoNearby ? "taken" : ""}`} style={photoNearbyUrl ? { backgroundImage: `url(${photoNearbyUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} disabled={uploadingPhoto !== ""} onClick={() => nearbyPhotoInputRef.current?.click()}>{photoNearbyUrl ? "" : uploadingPhoto === "nearby" ? "…" : "+"}</button><input ref={nearbyPhotoInputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => uploadRecognitionPhoto("nearby", e.target.files?.[0])} /><strong>What you can see nearby</strong><small>{photoNearby ? "Photo added" : uploadingPhoto === "nearby" ? "Uploading…" : "Photo needed"}</small></article></div>{error && <p className="journey-error">{error}</p>}<p className="pair-note">Only {person.firstName} can see these, and only once you both confirm you met. They’re deleted automatically afterward.</p><Actions><Primary disabled={!photoSelf || !photoNearby} onClick={() => go(14)}>Share with {person.firstName}</Primary></Actions></Shell>;
  if (step === 14) { const bucket = windowBucket(meetingSecondsLeft); return <Shell step={14}><div className="find-heading"><div className="intro-symbol small">{personInitial}</div><div><p className="journey-eyebrow">Find each other</p><h1>{person.firstName}</h1></div><div className="timer">{bucket ? <><strong>~{bucket}</strong><span>left</span></> : <><strong>No rush</strong><span>take your time</span></>}</div></div><div className="recognition-demo"><div>{person.firstName} + outfit</div><div>Nearby Cafe view</div></div><section className="confirm-block"><h2>Did you meet {person.firstName} in person?</h2><Actions><Primary onClick={async () => { record("meeting_confirmed"); await saveMeeting("met"); if (mode === "demo") { try { await jsonPost("/api/demo/confirm-meeting", { recommendationId }); } catch { /* links stay pending */ } } await loadLinks(); go(15); }}>Yes, we met</Primary><Secondary onClick={() => { record("meeting_not_yet"); saveMeeting("not_yet"); setTerminal("not_met"); }}>Not yet</Secondary></Actions><small>Your answer stays private. A meeting counts only after you both confirm.</small></section></Shell>; }
  if (step === 15) return <Shell step={15}><div className="center"><div className="terminal-mark">✓</div><Header eyebrow="Both confirmed" title={`You met ${person.firstName}`}/><div className="approved-links">{postLinks.length > 0 ? postLinks.map((link, index) => <span key={index}><strong>{link.kind === "linkedin_identifier" ? "LinkedIn" : link.kind === "website" ? "Website" : link.kind === "github" ? "GitHub" : link.kind === "social" ? "Social" : "Link"}</strong>{link.host || link.url}</span>) : <span className="pending-links">Approved links appear here once {person.firstName} also confirms you met.</span>}</div><p className="helper-text">Only links {person.firstName} approved for after an in-person meeting.</p><Actions><Primary onClick={() => go(16)}>Continue</Primary></Actions></div></Shell>;
  if (step === 16) return <Shell step={16}><Header eyebrow="Private · optional" title="How was the conversation?"/><div className="feedback-options">{([['very_unhelpful','😞','Not useful'],['unhelpful','🙁','Not really'],['neutral','😐','Okay'],['helpful','🙂','Useful'],['very_helpful','😄','Very useful']] as const).map(([value,emoji,label]) => <button key={value} className={feedback === value ? "selected" : ""} aria-pressed={feedback === value} aria-label={label} title={label} onClick={() => { setFeedback(value); record("conversation_feedback", { rating: value }); saveFeedback(value, feedbackNote); }}><span aria-hidden="true">{emoji}</span></button>)}</div><div className="feedback-note"><TextBox label="Add a note (optional)" value={feedbackNote} maxLength={600} placeholder="What made it useful — or not? Only you and Corgi see this." onChange={(e) => setFeedbackNote(e.target.value)} /></div><section className="what-next"><h2>What next?</h2><Actions><Primary onClick={() => { if (feedback) saveFeedback(feedback, feedbackNote); record("meet_another_selected"); setFeedback(""); setFeedbackNote(""); setRecommendationId(""); setCounterpart(null); setSessionId(""); setMatchExpiresAt(0); setPostLinks([]); setPhotoSelf(false); setPhotoNearby(false); setPhotoSelfUrl(""); setPhotoNearbyUrl(""); goMeetSomeone(); }}>Meet another person</Primary><Secondary onClick={() => { if (feedback) saveFeedback(feedback, feedbackNote); record("intro_session_finished"); setTerminal("finished"); }}>Finish for today</Secondary></Actions></section><p className="retention-note">Temporary photo access ends when this introduction closes; deletion is due promptly under the configured retention job.</p></Shell>;
  return <Shell step={18}><div className="center"><div className="mail-mark">@</div><Header eyebrow="No introduction yet" title="We’re still looking">We’ll email you when Corgi finds someone worth meeting.</Header><p className="preview-note">Notification delivery is not implemented in this build.</p><Actions><Primary onClick={() => { record("notify_me_requested"); setTerminal("notify"); }}>Notify me</Primary><Quiet onClick={() => go(7)}>Cancel</Quiet></Actions></div></Shell>;
}
