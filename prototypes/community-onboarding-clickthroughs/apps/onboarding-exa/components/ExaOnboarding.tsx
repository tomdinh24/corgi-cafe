"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  AppShell,
  Button,
  ButtonRow,
  CheckChoice,
  ErrorText,
  Eyebrow,
  Field,
  Intro,
  Notice,
  RadioChoice,
  SourceBadge,
  Stack,
  TextArea,
  Title,
  buildPublicLinks,
  draftFromCandidate,
  emptyDraft,
  recordComparisonEvent,
  type AttributedText,
  type OnboardingPhase,
  type PersonCandidate,
  type ProfileDraft,
  type PublicLink,
  type PublicLinkErrors,
  type PublicLinkKind,
  type PublicLinkValues,
  PublicLinksSchema,
} from "@corgi/onboarding-shared";

const FLOW_STATES = [
  "account.email",
  "account.otp",
  "identity.firstName",
  "identity.lastName",
  "identity.location",
  "identity.company",
  "identity.role",
  "profile.lookup",
  "profile.candidates",
  "profile.publicLinks",
  "profile.review",
  "path.choose",
  "connect.topics",
  "connect.boundaries",
  "connect.availability",
  "connect.review",
  "ready",
  "community.complete",
  "later.complete",
] as const;

type FlowState = (typeof FLOW_STATES)[number];
type Path = "connect" | "community" | "later" | "";
type LookupOutcome = "unavailable" | "no-results" | null;
type DraftField =
  | "role"
  | "companyOrProject"
  | "location"
  | "functionalArea"
  | "stage";

type ProfileErrors = Partial<Record<DraftField | "focusAreas" | "contributionTopics", string>>;

const STEP_NUMBER: Partial<Record<FlowState, number>> = {
  "account.email": 1,
  "account.otp": 2,
  "identity.firstName": 3,
  "identity.lastName": 4,
  "identity.location": 5,
  "identity.company": 6,
  "identity.role": 7,
  "profile.lookup": 8,
  "profile.candidates": 9,
  "profile.publicLinks": 10,
  "profile.review": 11,
  "path.choose": 12,
  "connect.topics": 13,
  "connect.boundaries": 14,
  "connect.availability": 15,
  "connect.review": 16,
};

const PHASE: Record<FlowState, OnboardingPhase> = {
  "account.email": "Sign in",
  "account.otp": "Sign in",
  "identity.firstName": "About you",
  "identity.lastName": "About you",
  "identity.location": "About you",
  "identity.company": "About you",
  "identity.role": "About you",
  "profile.lookup": "Profile",
  "profile.candidates": "Profile",
  "profile.publicLinks": "Profile",
  "profile.review": "Profile",
  "path.choose": "Today",
  "connect.topics": "Today",
  "connect.boundaries": "Today",
  "connect.availability": "Today",
  "connect.review": "Review",
  ready: "Review",
  "community.complete": "Review",
  "later.complete": "Review",
};

const EMPTY_LINK_VALUES: PublicLinkValues = {
  linkedin: "",
  website: "",
  github: "",
  social: "",
};

const LINK_FIELDS: Array<{
  kind: PublicLinkKind;
  label: string;
  placeholder: string;
  hint?: string;
  autoComplete?: string;
}> = [
  {
    kind: "linkedin",
    label: "LinkedIn",
    placeholder: "https://www.linkedin.com/in/your-name",
    hint: "Corgi uses this as a profile identifier. It doesn’t fetch LinkedIn pages.",
    autoComplete: "url",
  },
  {
    kind: "website",
    label: "Personal or company website",
    placeholder: "https://your-site.com",
    autoComplete: "url",
  },
  {
    kind: "github",
    label: "GitHub",
    placeholder: "https://github.com/your-name",
    autoComplete: "url",
  },
  {
    kind: "social",
    label: "Other social media",
    placeholder: "https://social.example/your-name",
    autoComplete: "url",
  },
];

const DEFAULT_TOPICS = [
  "Compare notes with another builder",
  "Get practical advice",
  "Talk through a current challenge",
];

const CONVERSATION_TYPES = [
  "Peer conversation",
  "Practical advice",
  "Customer or design-partner conversation",
  "Partnerships",
  "Hiring or opportunities",
  "Fundraising",
  "Sales or vendor conversation",
];

function focusSoon(id: string) {
  window.requestAnimationFrame(() => document.getElementById(id)?.focus());
}

function maskedEmail(value: string) {
  const [local, domain] = value.split("@");
  return local && domain ? `${local.slice(0, 1)}•••@${domain}` : value;
}

function hostFor(sourceUrl?: string) {
  try {
    return sourceUrl
      ? new URL(sourceUrl).hostname.replace(/^www\./, "")
      : undefined;
  } catch {
    return undefined;
  }
}

function sourceKind(field?: AttributedText) {
  return field?.attribution === "found_on_source"
    ? ("found" as const)
    : field?.attribution === "edited_by_you"
      ? ("edited" as const)
      : field?.attribution === "suggested_by_corgi"
        ? ("suggested" as const)
        : ("entered" as const);
}

export function CorgiOnboarding() {
  const [flow, setFlow] = useState<FlowState>("account.email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [formError, setFormError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [location, setLocation] = useState("");
  const [company, setCompany] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [candidates, setCandidates] = useState<PersonCandidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [manualProfile, setManualProfile] = useState(false);
  const [lookupOutcome, setLookupOutcome] = useState<LookupOutcome>(null);
  const [draft, setDraft] = useState<ProfileDraft>(() => emptyDraft(""));
  const [loading, setLoading] = useState(false);
  const [publicLinkValues, setPublicLinkValues] =
    useState<PublicLinkValues>(EMPTY_LINK_VALUES);
  const [publicLinks, setPublicLinks] = useState<PublicLink[]>([]);
  const [providerLinkedIn, setProviderLinkedIn] = useState<PublicLink | null>(
    null,
  );
  const [linkErrors, setLinkErrors] = useState<PublicLinkErrors>({});
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [path, setPath] = useState<Path>("");
  const [intents, setIntents] = useState<string[]>([]);
  const [useful, setUseful] = useState("");
  const [offer, setOffer] = useState("");
  const [conversationTypes, setConversationTypes] = useState<string[]>([]);
  const [availability, setAvailability] = useState("");
  const [visibility, setVisibility] = useState("");
  const [expiration, setExpiration] = useState("");
  const [notify, setNotify] = useState(false);
  const [editingFromReview, setEditingFromReview] = useState(false);

  const go = (target: FlowState) => {
    recordComparisonEvent("step_completed", {
      variation: "exa",
      step: flow,
    });
    setFormError("");
    setFlow(target);
  };

  const goBack = () => {
    if (editingFromReview && flow !== "connect.review") {
      setEditingFromReview(false);
      go("connect.review");
      return;
    }
    const target: Partial<Record<FlowState, FlowState>> = {
      "account.otp": "account.email",
      "identity.firstName": "account.otp",
      "identity.lastName": "identity.firstName",
      "identity.location": "identity.lastName",
      "identity.company": "identity.location",
      "identity.role": "identity.company",
      "profile.lookup": "identity.role",
      "profile.candidates": "profile.lookup",
      "profile.publicLinks": candidates.length
        ? "profile.candidates"
        : "profile.lookup",
      "profile.review": "profile.publicLinks",
      "path.choose": "profile.review",
      "connect.topics": "path.choose",
      "connect.boundaries": "connect.topics",
      "connect.availability": "connect.boundaries",
      "connect.review": "connect.availability",
    };
    const previous = target[flow];
    if (previous) go(previous);
  };

  const manualDraft = () => {
    const nextDraft = emptyDraft(location);
    nextDraft.role.value = roleTitle;
    nextDraft.companyOrProject.value = company;
    return nextDraft;
  };

  const continueManually = (outcome?: "manual" | "none") => {
    setManualProfile(true);
    setCandidates([]);
    setSelectedCandidateId("");
    setDraft(manualDraft());
    setPublicLinkValues(EMPTY_LINK_VALUES);
    setPublicLinks([]);
    setProviderLinkedIn(null);
    setLinkErrors({});
    recordComparisonEvent("provider_outcome", {
      variation: "exa",
      outcome: outcome ?? "manual",
    });
    go("profile.publicLinks");
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setFormError("Enter the six-digit code.");
      focusSoon("otp-code");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/demo/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: otp }),
      });
      if (!response.ok) {
        setFormError("That code doesn’t match. Try again.");
        focusSoon("otp-code");
        return;
      }
      go("identity.firstName");
    } catch {
      setFormError("We couldn’t verify the code. Check your connection and try again.");
      focusSoon("otp-code");
    } finally {
      setLoading(false);
    }
  };

  const search = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setLookupOutcome(null);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          input: {
            identity: { email, firstName, lastName },
            location,
            seedWorkContext: [roleTitle, company].filter(Boolean).join(" at "),
          },
        }),
      });
      const body = (await response.json()) as {
        status?: string;
        candidates?: PersonCandidate[];
      };
      if (
        response.ok &&
        body.status === "draft_ready" &&
        Array.isArray(body.candidates) &&
        body.candidates.length
      ) {
        setCandidates(body.candidates.slice(0, 3));
        setSelectedCandidateId("");
        recordComparisonEvent("provider_outcome", {
          variation: "exa",
          outcome: "candidates",
        });
        go("profile.candidates");
      } else {
        setLookupOutcome(body.status === "manual_only" ? "no-results" : "unavailable");
      }
    } catch {
      setLookupOutcome("unavailable");
    } finally {
      setLoading(false);
    }
  };

  const confirmCandidate = (event: FormEvent) => {
    event.preventDefault();
    const candidate = candidates.find((item) => item.id === selectedCandidateId);
    if (!candidate) return;
    if (!candidate.identifierOnly) {
      setFirstName(candidate.firstName);
      setLastName(candidate.lastName);
    }
    setManualProfile(false);
    setDraft(
      draftFromCandidate(candidate, {
        role: roleTitle,
        company,
        location,
      }),
    );
    const foundLinkedIn = candidate.identifierOnly
      ? {
          kind: "linkedin" as const,
          url: candidate.profileUrl,
          use: "identifier_only" as const,
          provenance: "found_on_source" as const,
          retrievalStatus: "not_fetched" as const,
        }
      : null;
    setProviderLinkedIn(foundLinkedIn);
    setPublicLinks(foundLinkedIn ? [foundLinkedIn] : []);
    if (foundLinkedIn) {
      setPublicLinkValues((current) => ({ ...current, linkedin: "" }));
    }
    setLinkErrors({});
    recordComparisonEvent("provider_outcome", {
      variation: "exa",
      outcome: "identity_confirmed",
    });
    go("profile.publicLinks");
  };

  const submitPublicLinks = (event: FormEvent) => {
    event.preventDefault();
    const result = buildPublicLinks(publicLinkValues);
    setLinkErrors(result.errors);
    if (Object.keys(result.errors).length) {
      const first = LINK_FIELDS.find((field) => result.errors[field.kind]);
      if (first) focusSoon(`public-link-${first.kind}`);
      return;
    }
    setPublicLinkValues(result.normalized);
    const links = providerLinkedIn
      ? [providerLinkedIn, ...result.links]
      : result.links;
    PublicLinksSchema.parse(links);
    setPublicLinks(links);
    recordComparisonEvent("provider_outcome", {
      variation: "exa",
      outcome: links.length ? "links_added" : "links_skipped",
    });
    go("profile.review");
  };

  const skipPublicLinks = () => {
    setPublicLinkValues(EMPTY_LINK_VALUES);
    setPublicLinks(providerLinkedIn ? [providerLinkedIn] : []);
    setLinkErrors({});
    recordComparisonEvent("provider_outcome", {
      variation: "exa",
      outcome: "links_skipped",
    });
    go("profile.review");
  };

  const setDraftField = (key: DraftField, value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? { confirmed: false }),
        value,
        attribution: "edited_by_you",
        sourceUrl: undefined,
      },
    }));
    setProfileErrors((current) => ({ ...current, [key]: undefined }));
    recordComparisonEvent("field_corrected", { variation: "exa" });
  };

  const setDraftList = (
    key: "focusAreas" | "contributionTopics",
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      [key]: value.split(",").map((item) => ({
        value: item.trim(),
        attribution: "edited_by_you" as const,
        confirmed: false,
      })),
    }));
    setProfileErrors((current) => ({ ...current, [key]: undefined }));
  };

  const confirmProfile = (event: FormEvent) => {
    event.preventDefault();
    const linkResult = buildPublicLinks(publicLinkValues);
    setLinkErrors(linkResult.errors);
    if (Object.keys(linkResult.errors).length) {
      const first = LINK_FIELDS.find((field) => linkResult.errors[field.kind]);
      if (first) focusSoon(`review-link-${first.kind}`);
      return;
    }
    const errors: ProfileErrors = {};
    const required: Array<[DraftField, string]> = [
      ["role", "Add your role."],
      ["companyOrProject", "Add your company or project."],
      ["location", "Add your location."],
      ["functionalArea", "Add your area."],
    ];
    required.forEach(([key, message]) => {
      if (!draft[key]?.value.trim()) errors[key] = message;
    });
    if (!draft.focusAreas.some((item) => item.value.trim())) {
      errors.focusAreas = "Add at least one focus area.";
    }
    if (!draft.contributionTopics.some((item) => item.value.trim())) {
      errors.contributionTopics = "Add something you can help with.";
    }
    setProfileErrors(errors);
    if (Object.keys(errors).length) {
      const order = [
        "role",
        "companyOrProject",
        "location",
        "functionalArea",
        "focusAreas",
        "contributionTopics",
      ];
      const first = order.find((key) => errors[key as keyof ProfileErrors]);
      if (first) focusSoon(`profile-${first}`);
      return;
    }
    setPublicLinkValues(linkResult.normalized);
    setPublicLinks(linkResult.links);
    setDraft((current) => ({
      ...current,
      role: { ...current.role, confirmed: true },
      companyOrProject: { ...current.companyOrProject, confirmed: true },
      location: { ...current.location, confirmed: true },
      functionalArea: { ...current.functionalArea, confirmed: true },
      stage: current.stage?.value
        ? { ...current.stage, confirmed: true }
        : undefined,
      focusAreas: current.focusAreas
        .filter((item) => item.value)
        .map((item) => ({ ...item, confirmed: true })),
      contributionTopics: current.contributionTopics
        .filter((item) => item.value)
        .map((item) => ({ ...item, confirmed: true })),
      suggestedIntents: current.suggestedIntents
        .filter((item) => item.value)
        .map((item) => ({ ...item, confirmed: true })),
      confirmationState: "confirmed",
    }));
    if (!intents.length) setIntents(DEFAULT_TOPICS);
    if (editingFromReview) {
      setEditingFromReview(false);
      go("connect.review");
    } else {
      go("path.choose");
    }
  };

  const toggleIntent = (value: string) => {
    setIntents((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const toggleConversationType = (value: string) => {
    setConversationTypes((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
    setFormError("");
  };

  const submitTopics = (event: FormEvent) => {
    event.preventDefault();
    if (!intents.length) {
      setFormError("Keep at least one topic.");
      focusSoon("topic-0");
      return;
    }
    if (!useful.trim()) {
      setFormError("Add what would make the conversation useful.");
      focusSoon("useful-conversation");
      return;
    }
    if (!offer.trim()) {
      setFormError("Add something you could help with.");
      focusSoon("conversation-offer");
      return;
    }
    if (editingFromReview) {
      setEditingFromReview(false);
      go("connect.review");
    } else {
      go("connect.boundaries");
    }
  };

  const submitBoundaries = (event: FormEvent) => {
    event.preventDefault();
    if (!conversationTypes.length) {
      setFormError("Choose at least one conversation type.");
      focusSoon("conversation-type-0");
      return;
    }
    if (editingFromReview) {
      setEditingFromReview(false);
      go("connect.review");
    } else {
      go("connect.availability");
    }
  };

  const submitAvailability = (event: FormEvent) => {
    event.preventDefault();
    if (!availability) {
      setFormError("Choose when you’re open.");
      focusSoon("availability-now");
      return;
    }
    if (!visibility) {
      setFormError("Choose who can see you’re open.");
      focusSoon("visibility-people-at-corgi");
      return;
    }
    if (!expiration) {
      setFormError("Choose how long to stay open.");
      focusSoon("expiration");
      return;
    }
    setEditingFromReview(false);
    go("connect.review");
  };

  const editFromReview = (target: FlowState) => {
    setEditingFromReview(true);
    go(target);
  };

  const shell = (content: ReactNode, options?: { wide?: boolean }) => (
    <AppShell
      phase={PHASE[flow]}
      actualStep={STEP_NUMBER[flow]}
      screenKey={flow}
      wide={options?.wide}
    >
      {content}
    </AppShell>
  );

  if (flow === "account.email") {
    return shell(
      <>
        <Eyebrow>Let’s start</Eyebrow>
        <Title>What’s your email?</Title>
        <Intro>We’ll send a six-digit code.</Intro>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              setFormError("Enter a valid email address.");
              focusSoon("email");
              return;
            }
            go("account.otp");
          }}
        >
          <Stack>
            <Field
              id="email"
              name="email"
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              error={formError}
              onChange={(event) => {
                setEmail(event.target.value);
                setFormError("");
              }}
            />
          </Stack>
          <ButtonRow>
            <Button type="submit">Send code</Button>
          </ButtonRow>
        </form>
      </>,
    );
  }

  if (flow === "account.otp") {
    return shell(
      <>
        <Eyebrow>Check your email</Eyebrow>
        <Title>Enter your code.</Title>
        <Intro>We sent a six-digit code to {maskedEmail(email)}.</Intro>
        <form noValidate onSubmit={verifyOtp}>
          <Stack>
            <Field
              id="otp-code"
              name="otp"
              label="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
              value={otp}
              error={formError}
              onChange={(event) => {
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                setFormError("");
              }}
            />
          </Stack>
          <ButtonRow>
            <Button type="submit" loading={loading}>Verify</Button>
            <Button
              type="button"
              kind="secondary"
              onClick={() => {
                setOtp("");
                go("account.email");
              }}
            >
              Use a different email
            </Button>
            <Button type="button" kind="quiet" onClick={goBack}>Back</Button>
          </ButtonRow>
        </form>
      </>,
    );
  }

  if (flow === "identity.firstName") {
    return shell(
      <>
        <Eyebrow>About you</Eyebrow>
        <Title>What’s your first name?</Title>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!firstName.trim()) {
              setFormError("Enter your first name.");
              focusSoon("first-name");
              return;
            }
            go("identity.lastName");
          }}
        >
          <Stack><Field id="first-name" label="First name" autoComplete="given-name" required value={firstName} error={formError} onChange={(event) => { setFirstName(event.target.value); setFormError(""); }} /></Stack>
          <ButtonRow><Button type="submit">Continue</Button><Button type="button" kind="quiet" onClick={goBack}>Back</Button></ButtonRow>
        </form>
      </>,
    );
  }

  if (flow === "identity.lastName") {
    return shell(
      <>
        <Eyebrow>About you</Eyebrow>
        <Title>And your last name?</Title>
        <Intro>This helps us find the right profile.</Intro>
        <form noValidate onSubmit={(event) => { event.preventDefault(); if (!lastName.trim()) { setFormError("Enter your last name."); focusSoon("last-name"); return; } go("identity.location"); }}>
          <Stack><Field id="last-name" label="Last name" autoComplete="family-name" required value={lastName} error={formError} onChange={(event) => { setLastName(event.target.value); setFormError(""); }} /></Stack>
          <ButtonRow><Button type="submit">Continue</Button><Button type="button" kind="quiet" onClick={goBack}>Back</Button></ButtonRow>
        </form>
      </>,
    );
  }

  if (flow === "identity.location") {
    return shell(
      <>
        <Eyebrow>About you</Eyebrow>
        <Title>Where are you based?</Title>
        <Intro>City or region is enough. We don’t track your location.</Intro>
        <form noValidate onSubmit={(event) => { event.preventDefault(); if (!location.trim()) { setFormError("Enter a city or region."); focusSoon("location"); return; } go("identity.company"); }}>
          <Stack><Field id="location" label="City or region" autoComplete="address-level2" required value={location} error={formError} onChange={(event) => { setLocation(event.target.value); setFormError(""); }} /></Stack>
          <ButtonRow><Button type="submit">Continue</Button><Button type="button" kind="quiet" onClick={goBack}>Back</Button></ButtonRow>
        </form>
      </>,
    );
  }

  if (flow === "identity.company") {
    return shell(
      <>
        <Eyebrow>About you</Eyebrow>
        <Title>What company or project are you with?</Title>
        <form noValidate onSubmit={(event) => { event.preventDefault(); if (!company.trim()) { setFormError("Enter a company or project."); focusSoon("company"); return; } go("identity.role"); }}>
          <Stack><Field id="company" label="Company or project" autoComplete="organization" required value={company} error={formError} onChange={(event) => { setCompany(event.target.value); setFormError(""); }} /></Stack>
          <ButtonRow><Button type="submit">Continue</Button><Button type="button" kind="quiet" onClick={goBack}>Back</Button></ButtonRow>
        </form>
      </>,
    );
  }

  if (flow === "identity.role") {
    return shell(
      <>
        <Eyebrow>About you</Eyebrow>
        <Title>What’s your role?</Title>
        <form noValidate onSubmit={(event) => { event.preventDefault(); if (!roleTitle.trim()) { setFormError("Enter your role or title."); focusSoon("role-title"); return; } go("profile.lookup"); }}>
          <Stack><Field id="role-title" label="Role or title" autoComplete="organization-title" required value={roleTitle} error={formError} onChange={(event) => { setRoleTitle(event.target.value); setFormError(""); }} /></Stack>
          <ButtonRow><Button type="submit">Continue</Button><Button type="button" kind="quiet" onClick={goBack}>Back</Button></ButtonRow>
        </form>
      </>,
    );
  }

  if (flow === "profile.lookup") {
    return shell(
      <>
        <Eyebrow>Your profile</Eyebrow>
        <Title>Find your public profile.</Title>
        <Intro>We’ll search public professional sources using the details you shared. You’ll choose the right result.</Intro>
        <p className="reassurance">Nothing is added until you confirm it. A profile-search service helps with this step.</p>
        <form onSubmit={search}>
          {lookupOutcome && (
            <Notice
              title={lookupOutcome === "unavailable" ? "Profile search isn’t available." : "No profile found."}
              tone="error"
              role="alert"
            >
              <p>No problem. Add your background yourself.</p>
            </Notice>
          )}
          {loading && <p className="loading-status" role="status"><span className="status-dot" aria-hidden="true" />Looking for your profile…</p>}
          <ButtonRow>
            <Button type="submit" loading={loading}>{lookupOutcome ? "Try again" : "Find my profile"}</Button>
            <Button type="button" kind="secondary" disabled={loading} onClick={() => continueManually()}>Enter it myself</Button>
            <Button type="button" kind="quiet" disabled={loading} onClick={goBack}>Back</Button>
          </ButtonRow>
        </form>
      </>,
    );
  }

  if (flow === "profile.candidates") {
    return shell(
      <>
        <Eyebrow>Profile match</Eyebrow>
        <Title>Is one of these you?</Title>
        <Intro>Choose one. If none fit, add your details yourself.</Intro>
        <form onSubmit={confirmCandidate}>
          <fieldset className="candidate-fieldset">
            <legend>Choose your profile</legend>
            <ol className="person-list">
              {candidates.slice(0, 3).map((candidate) => {
                const selected = selectedCandidateId === candidate.id;
                const candidateFirstName = candidate.identifierOnly
                  ? firstName
                  : candidate.firstName;
                const candidateLastName = candidate.identifierOnly
                  ? lastName
                  : candidate.lastName;
                const name = `${candidateFirstName} ${candidateLastName}`;
                const mayShowFacts = candidate.mayExtractFacts && !candidate.identifierOnly;
                return (
                  <li key={candidate.id}>
                    <label className={`person-card${selected ? " selected" : ""}`}>
                      <input type="radio" name="candidate" value={candidate.id} checked={selected} onChange={() => setSelectedCandidateId(candidate.id)} />
                      <span className="person-avatar" aria-hidden="true">
                        {candidateFirstName[0]}{candidateLastName[0]}
                        {!candidate.identifierOnly && candidate.imageUrl && <img src={candidate.imageUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.hidden = true; }} />}
                      </span>
                      <span className="person-details">
                        <strong>{name}</strong>
                        {mayShowFacts && (candidate.title || candidate.company) && <span>{[candidate.title, candidate.company].filter(Boolean).join(" · ")}</span>}
                        {mayShowFacts && candidate.location && <span>{candidate.location}</span>}
                        <span className="candidate-url">{candidate.profileUrl}</span>
                        <small>{candidate.identifierOnly ? "LinkedIn profile · Link only" : `Public profile · ${candidate.sourceHost}`}</small>
                      </span>
                      <span className="person-select">{selected ? "Selected" : "This is me"}</span>
                    </label>
                  </li>
                );
              })}
            </ol>
          </fieldset>
          <p className="trust-note">Nothing is confirmed until you choose and review it.</p>
          <ButtonRow sticky>
            <Button type="submit" disabled={!selectedCandidateId}>Continue</Button>
            <Button type="button" kind="secondary" onClick={() => continueManually("none")}>None of these</Button>
            <Button type="button" kind="quiet" onClick={goBack}>Back</Button>
          </ButtonRow>
        </form>
      </>,
      { wide: true },
    );
  }

  if (flow === "profile.publicLinks") {
    return shell(
      <>
        <Eyebrow>About you</Eyebrow>
        <Title>Add public links?</Title>
        <Intro>{manualProfile ? "Share any links that add context to the profile you’re creating. All are optional." : "Share any links that add context to the profile you chose. All are optional."}</Intro>
        <form noValidate onSubmit={submitPublicLinks}>
          <div className="public-links-grid">
            {LINK_FIELDS.filter(
              (field) => field.kind !== "linkedin" || !providerLinkedIn,
            ).map((field) => (
              <Field
                key={field.kind}
                id={`public-link-${field.kind}`}
                name={field.kind}
                label={field.label}
                hint={field.hint}
                type="url"
                inputMode="url"
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                value={publicLinkValues[field.kind]}
                error={linkErrors[field.kind]}
                onChange={(event) => {
                  setPublicLinkValues((current) => ({ ...current, [field.kind]: event.target.value }));
                  setLinkErrors((current) => ({ ...current, [field.kind]: undefined }));
                }}
              />
            ))}
          </div>
          <ButtonRow sticky>
            <Button type="submit">Continue</Button>
            <Button type="button" kind="secondary" onClick={skipPublicLinks}>Skip for now</Button>
            <Button type="button" kind="quiet" onClick={goBack}>Back</Button>
          </ButtonRow>
        </form>
      </>,
      { wide: true },
    );
  }

  if (flow === "profile.review") {
    const draftFields: Array<{ key: DraftField; label: string; optional?: boolean }> = [
      { key: "role", label: "Role" },
      { key: "companyOrProject", label: "Company or project" },
      { key: "location", label: "Location" },
      { key: "functionalArea", label: "Area" },
      { key: "stage", label: "Stage (optional)", optional: true },
    ];
    return shell(
      <>
        <Eyebrow>Profile check</Eyebrow>
        <Title>Does this sound like you?</Title>
        <Intro>Edit anything that’s off. You choose what goes into your Corgi profile.</Intro>
        <form noValidate onSubmit={confirmProfile}>
          <div className="profile-grid">
            {draftFields.map(({ key, label }) => {
              const field = draft[key];
              return (
                <div className="profile-row" key={key}>
                  <Field id={`profile-${key}`} label={label} value={field?.value ?? ""} error={profileErrors[key]} onChange={(event) => setDraftField(key, event.target.value)} />
                  <SourceBadge kind={sourceKind(field)} host={hostFor(field?.sourceUrl)} />
                </div>
              );
            })}
            <div className="profile-row">
              <Field id="profile-focusAreas" label="Focus areas" hint="Separate topics with commas." value={draft.focusAreas.map((item) => item.value).join(", ")} error={profileErrors.focusAreas} onChange={(event) => setDraftList("focusAreas", event.target.value)} />
              <SourceBadge kind={sourceKind(draft.focusAreas[0])} host={hostFor(draft.focusAreas[0]?.sourceUrl)} />
            </div>
            <div className="profile-row">
              <Field id="profile-contributionTopics" label="Can help with" hint="Separate topics with commas." value={draft.contributionTopics.map((item) => item.value).join(", ")} error={profileErrors.contributionTopics} onChange={(event) => setDraftList("contributionTopics", event.target.value)} />
              <SourceBadge kind={sourceKind(draft.contributionTopics[0])} host={hostFor(draft.contributionTopics[0]?.sourceUrl)} />
            </div>
          </div>
          <section className="review-links" aria-labelledby="review-links-title">
            <h2 id="review-links-title">Public links</h2>
            {!publicLinks.length ? (
              <p>No public links added.</p>
            ) : (
              <div className="review-link-list">
                {publicLinks.map((link) => {
                  const details = LINK_FIELDS.find((field) => field.kind === link.kind)!;
                  return (
                    <div className="review-link-row" key={link.kind}>
                      {link.provenance === "found_on_source" ? (
                        <div>
                          <span>{details.label}</span>
                          <p>{link.url}</p>
                        </div>
                      ) : (
                        <Field id={`review-link-${link.kind}`} label={details.label} type="url" inputMode="url" value={publicLinkValues[link.kind]} error={linkErrors[link.kind]} onChange={(event) => { setPublicLinkValues((current) => ({ ...current, [link.kind]: event.target.value })); setLinkErrors((current) => ({ ...current, [link.kind]: undefined })); }} />
                      )}
                      <div className="review-link-meta">
                        <SourceBadge kind={link.provenance === "found_on_source" ? "found" : link.kind === "linkedin" ? "identifier" : "entered"} host={link.provenance === "found_on_source" ? hostFor(link.url) : undefined} />
                        <Button type="button" kind="quiet" aria-label={`Remove ${details.label}`} onClick={() => { setPublicLinkValues((current) => ({ ...current, [link.kind]: "" })); setPublicLinks((current) => current.filter((item) => item.kind !== link.kind)); if (link.provenance === "found_on_source") setProviderLinkedIn(null); }}>Remove</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          <ButtonRow sticky>
            <Button type="submit">Confirm profile</Button>
            <Button type="button" kind="quiet" onClick={goBack}>Back</Button>
          </ButtonRow>
        </form>
      </>,
      { wide: true },
    );
  }

  if (flow === "path.choose") {
    return shell(
      <>
        <Eyebrow>For today</Eyebrow>
        <Title>What would you like to do?</Title>
        <form onSubmit={(event) => { event.preventDefault(); if (!path) { setFormError("Choose what you’d like to do."); focusSoon("path-connect"); return; } if (path === "connect") go("connect.topics"); else go(path === "community" ? "community.complete" : "later.complete"); }}>
          <fieldset className={`card-fieldset${formError ? " invalid" : ""}`} aria-describedby={formError ? "path-error" : undefined}>
            <legend>Choose one</legend>
            <RadioChoice name="path" value="connect" title="Meet someone now" detail="Tell Corgi what would make a good conversation today." checked={path === "connect"} onChange={() => { setPath("connect"); setFormError(""); }} />
            <RadioChoice name="path" value="community" title="Hear about the Corgi community" detail="Share your interest. This doesn’t grant access or make your profile visible." checked={path === "community"} onChange={() => { setPath("community"); setFormError(""); }} />
            <RadioChoice name="path" value="later" title="Maybe later" detail="Keep introductions off for now." checked={path === "later"} onChange={() => { setPath("later"); setFormError(""); }} />
          </fieldset>
          {formError && <ErrorText id="path-error">{formError}</ErrorText>}
          <ButtonRow><Button type="submit">Continue</Button><Button type="button" kind="quiet" onClick={goBack}>Back</Button></ButtonRow>
        </form>
      </>,
    );
  }

  if (flow === "connect.topics") {
    return shell(
      <>
        <Eyebrow>For today</Eyebrow>
        <Title>What would you like to talk about?</Title>
        <Intro>Start with what’s useful today. Remove any suggestion that misses the mark.</Intro>
        <form noValidate onSubmit={submitTopics}>
          <fieldset className={`card-fieldset compact${formError === "Keep at least one topic." ? " invalid" : ""}`} aria-describedby={formError === "Keep at least one topic." ? "topics-error" : undefined}>
            <legend>Today’s topics</legend>
            {DEFAULT_TOPICS.map((value, index) => (
              <CheckChoice key={value} name={`topic-${index}`} label={value} checked={intents.includes(value)} onChange={() => { toggleIntent(value); setFormError(""); }} />
            ))}
          </fieldset>
          <Stack>
            <TextArea id="useful-conversation" label="What would make the conversation useful?" value={useful} error={formError.includes("useful") ? formError : undefined} onChange={(event) => { setUseful(event.target.value); setFormError(""); }} />
            <TextArea id="conversation-offer" label="What could you help someone else with?" value={offer} error={formError.includes("help") ? formError : undefined} onChange={(event) => { setOffer(event.target.value); setFormError(""); }} />
          </Stack>
          {formError === "Keep at least one topic." && <ErrorText id="topics-error">{formError}</ErrorText>}
          <ButtonRow><Button type="submit">Choose conversation types</Button><Button type="button" kind="quiet" onClick={goBack}>Back</Button></ButtonRow>
        </form>
      </>,
    );
  }

  if (flow === "connect.boundaries") {
    return shell(
      <>
        <Eyebrow>Your intro</Eyebrow>
        <Title>What conversations are you up for?</Title>
        <Intro>Choose each type that’s welcome. Sales, recruiting, and fundraising start off.</Intro>
        <form onSubmit={submitBoundaries}>
          <fieldset className={`card-fieldset compact${formError ? " invalid" : ""}`} aria-describedby={formError ? "conversation-types-error" : undefined}>
            <legend>Conversation types</legend>
            {CONVERSATION_TYPES.map((value, index) => (
              <CheckChoice key={value} name={`conversation-type-${index}`} label={value} checked={conversationTypes.includes(value)} onChange={() => toggleConversationType(value)} />
            ))}
          </fieldset>
          {formError && <ErrorText id="conversation-types-error">{formError}</ErrorText>}
          <ButtonRow><Button type="submit">Set availability</Button><Button type="button" kind="quiet" onClick={goBack}>Back</Button></ButtonRow>
        </form>
      </>,
    );
  }

  if (flow === "connect.availability") {
    return shell(
      <>
        <Eyebrow>Your intro</Eyebrow>
        <Title>When are you open?</Title>
        <Intro>You can change this anytime.</Intro>
        <form noValidate onSubmit={submitAvailability}>
          <fieldset className={`card-fieldset compact${formError.includes("when") ? " invalid" : ""}`} aria-describedby={formError.includes("when") ? "availability-error" : undefined}>
            <legend>When</legend>
            <RadioChoice name="availability" value="Now" title="Now" detail="I’m open while I’m here." checked={availability === "Now"} onChange={() => { setAvailability("Now"); setFormError(""); }} />
            <RadioChoice name="availability" value="Later today" title="Later today" detail="I’ll be open later today." checked={availability === "Later today"} onChange={() => { setAvailability("Later today"); setFormError(""); }} />
            <RadioChoice name="availability" value="Strong matches only" title="Strong matches only" detail="Only show me a particularly useful conversation." checked={availability === "Strong matches only"} onChange={() => { setAvailability("Strong matches only"); setFormError(""); }} />
          </fieldset>
          <fieldset className={`card-fieldset compact${formError.includes("who") ? " invalid" : ""}`} aria-describedby={formError.includes("who") ? "availability-error" : undefined}>
            <legend>Who can see you’re open?</legend>
            <RadioChoice name="visibility" value="People at Corgi" title="People at Corgi" detail="People here who choose a compatible conversation." checked={visibility === "People at Corgi"} onChange={() => { setVisibility("People at Corgi"); setFormError(""); }} />
            <RadioChoice name="visibility" value="Corgi staff only" title="Corgi staff only" detail="Keep your availability with the Cafe team." checked={visibility === "Corgi staff only"} onChange={() => { setVisibility("Corgi staff only"); setFormError(""); }} />
          </fieldset>
          <Stack>
            <div className="field">
              <label htmlFor="expiration">Keep me open for</label>
              <select id="expiration" value={expiration} aria-invalid={formError.includes("long") || undefined} aria-describedby={formError.includes("long") ? "availability-error" : undefined} onChange={(event) => { setExpiration(event.target.value); setFormError(""); }}>
                <option value="">Choose a time</option>
                <option>30 minutes</option><option>60 minutes</option><option>90 minutes</option><option>Until I leave</option>
              </select>
            </div>
            <CheckChoice name="notify" label="Notify me in this app" checked={notify} onChange={() => setNotify((value) => !value)} />
          </Stack>
          {formError && <ErrorText id="availability-error">{formError}</ErrorText>}
          <ButtonRow><Button type="submit">Review</Button><Button type="button" kind="quiet" onClick={goBack}>Back</Button></ButtonRow>
        </form>
      </>,
    );
  }

  if (flow === "connect.review") {
    return shell(
      <>
        <Eyebrow>One last look</Eyebrow>
        <Title>Ready for an introduction?</Title>
        <Intro>If no one fits, we’ll say so.</Intro>
        <div className="summary">
          <section><div><h2>You</h2><p>{firstName} {lastName}, {draft.role.value} · {draft.companyOrProject.value}</p></div><Button kind="quiet" onClick={() => editFromReview("profile.review")}>Edit you</Button></section>
          <section><div><h2>Today</h2><p>{intents.join(", ")}</p></div><Button kind="quiet" onClick={() => editFromReview("connect.topics")}>Edit today</Button></section>
          <section><div><h2>A useful conversation</h2><p>{useful}</p></div><Button kind="quiet" onClick={() => editFromReview("connect.topics")}>Edit conversation</Button></section>
          <section><div><h2>You can help with</h2><p>{offer}</p></div><Button kind="quiet" onClick={() => editFromReview("connect.topics")}>Edit contribution</Button></section>
          <section><div><h2>Availability</h2><p>{availability}, for {expiration.toLowerCase()}. Visible to {visibility.toLowerCase()}. In-app notifications {notify ? "on" : "off"}.</p></div><Button kind="quiet" onClick={() => editFromReview("connect.availability")}>Edit availability</Button></section>
          <section><div><h2>Conversation types</h2><p>{conversationTypes.join(", ")}</p></div><Button kind="quiet" onClick={() => editFromReview("connect.boundaries")}>Edit conversation types</Button></section>
        </div>
        <ButtonRow><Button onClick={() => go("ready")}>Start introductions</Button><Button kind="quiet" onClick={goBack}>Back</Button></ButtonRow>
      </>,
    );
  }

  if (flow === "ready") {
    return (
      <AppShell phase="Review" screenKey={flow} complete>
        <Eyebrow>You’re ready</Eyebrow>
        <Title>You’re open to an introduction.</Title>
        <Intro>This demo stops here. It hasn’t searched for, ranked, or shown anyone.</Intro>
        <Notice title="What happens next" tone="success">
          <p>Corgi would look for someone here who is open to the same conversation. There may not be a match.</p>
        </Notice>
      </AppShell>
    );
  }

  if (flow === "community.complete") {
    return (
      <AppShell phase="Review" screenKey={flow} complete>
        <Eyebrow>That’s it</Eyebrow>
        <Title>Community interest starts here.</Title>
        <Intro>This demo doesn’t submit or save your interest.</Intro>
        <Notice title="What happens next"><p>A future application can continue from this point.</p></Notice>
      </AppShell>
    );
  }

  return (
    <AppShell phase="Review" screenKey={flow} complete>
      <Eyebrow>That’s it</Eyebrow>
      <Title>Come back when the timing feels right.</Title>
      <Intro>This demo doesn’t save your profile or answers.</Intro>
    </AppShell>
  );
}
