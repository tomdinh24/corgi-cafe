"use client";

import { useState } from "react";
import {
  AppShell,
  Button,
  ButtonRow,
  CheckChoice,
  Choice,
  Eyebrow,
  Field,
  Intro,
  Notice,
  ProfileSourceList,
  SourceBadge,
  Stack,
  TextArea,
  Title,
  emptyDraft,
  recordComparisonEvent,
  type PersonCandidate,
  type ProfileDraft,
} from "@corgi/onboarding-shared";

type Path = "connect" | "community" | "later" | "";
export function ExaOnboarding() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [location, setLocation] = useState("");
  const [company, setCompany] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [candidates, setCandidates] = useState<PersonCandidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [draft, setDraft] = useState<ProfileDraft>(() => emptyDraft(""));
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState<Path>("");
  const [intents, setIntents] = useState<string[]>([]);
  const [useful, setUseful] = useState("");
  const [offer, setOffer] = useState("");
  const [prefs, setPrefs] = useState({
    open: false,
    fundraising: false,
    recruiting: false,
    sales: false,
    notify: false,
  });
  const [visibility, setVisibility] = useState("People at Corgi");
  const [expiration, setExpiration] = useState("60 minutes");
  const next = () => {
    recordComparisonEvent("step_completed", { variation: "exa", step });
    setStep((v) => v + 1);
    scrollTo(0, 0);
  };
  const back = () => {
    setStep((v) => Math.max(0, v - 1));
    scrollTo(0, 0);
  };
  const input = {
    identity: { email, firstName, lastName },
    location,
    seedWorkContext: [roleTitle, company].filter(Boolean).join(" at "),
    urls: publicUrl ? [publicUrl] : [],
  };
  const manualFallback = (message?: string) => {
    setDraft(emptyDraft(location));
    setError(message ?? "Add your background yourself.");
    setStep(12);
    recordComparisonEvent("provider_outcome", {
      variation: "exa",
      outcome: "manual",
    });
  };
  const verify = async () => {
    try {
      const response = await fetch("/api/demo/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: otp }),
      });
      if (!response.ok)
        return setError("That code does not match. Try 424242.");
      setError("");
      next();
    } catch {
      setError(
        "We could not verify the demo code. Check your connection and try again.",
      );
    }
  };
  const search = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const body = await response.json();
      if (
        !response.ok ||
        body.status !== "draft_ready" ||
        !body.candidates?.length
      )
        return manualFallback(body.message);
      setCandidates(body.candidates);
      setSelectedCandidateId("");
      setStep(11);
      recordComparisonEvent("provider_outcome", {
        variation: "exa",
        outcome: "candidates",
      });
    } catch {
      manualFallback(
        "Exa search is unavailable. Add your background yourself.",
      );
    } finally {
      setLoading(false);
    }
  };
  const confirmCandidate = () => {
    const candidate = candidates.find((item) => item.id === selectedCandidateId);
    if (!candidate) return;
    const found = (value: string | undefined, fallback: string) =>
      value
        ? {
            value,
            attribution: "found_on_source" as const,
            sourceUrl: candidate.profileUrl,
            confirmed: false,
          }
        : {
            value: fallback,
            attribution: "entered_by_you" as const,
            confirmed: false,
          };
    const nextDraft = emptyDraft(candidate.location ?? location);
    setFirstName(candidate.firstName);
    setLastName(candidate.lastName);
    setDraft({
      ...nextDraft,
      role: found(candidate.title, roleTitle),
      companyOrProject: found(candidate.company, company),
      location: found(candidate.location, location),
    });
    setError("");
    setStep(12);
    recordComparisonEvent("provider_outcome", {
      variation: "exa",
      outcome: "identity_confirmed",
    });
  };
  const setField = (
    key: "role" | "companyOrProject" | "location" | "functionalArea" | "stage",
    value: string,
  ) => {
    setDraft(
      (d) =>
        ({
          ...d,
          [key]: {
            ...(d[key] ?? { confirmed: false }),
            value,
            attribution: "edited_by_you",
          },
        }) as ProfileDraft,
    );
    recordComparisonEvent("field_corrected", { variation: "exa" });
  };
  const badgeKind = (attribution?: string) =>
    attribution === "found_on_source"
      ? ("found" as const)
      : attribution === "edited_by_you"
        ? ("edited" as const)
        : attribution === "suggested_by_corgi"
          ? ("suggested" as const)
          : ("entered" as const);
  const sourceHost = (sourceUrl?: string) => {
    try {
      return sourceUrl
        ? new URL(sourceUrl).hostname.replace(/^www\./, "")
        : undefined;
    } catch {
      return undefined;
    }
  };
  const confirm = () => {
    const suggested = draft.suggestedIntents.length
      ? draft.suggestedIntents.map((item) => item.value)
      : [
          "Compare notes with another builder",
          "Get practical advice",
          "Talk through a current challenge",
        ];
    setIntents(suggested);
    setDraft((d) => ({
      ...d,
      role: { ...d.role, confirmed: true },
      companyOrProject: { ...d.companyOrProject, confirmed: true },
      location: { ...d.location, confirmed: true },
      functionalArea: { ...d.functionalArea, confirmed: true },
      stage: d.stage ? { ...d.stage, confirmed: true } : undefined,
      focusAreas: d.focusAreas
        .filter((x) => x.value)
        .map((x) => ({ ...x, confirmed: true })),
      contributionTopics: d.contributionTopics
        .filter((x) => x.value)
        .map((x) => ({ ...x, confirmed: true })),
      suggestedIntents: d.suggestedIntents
        .filter((x) => x.value)
        .map((x) => ({ ...x, confirmed: true })),
      confirmationState: "confirmed",
    }));
    next();
  };
  const toggleIntent = (value: string) =>
    setIntents((items) =>
      items.includes(value)
        ? items.filter((x) => x !== value)
        : [...items, value],
    );

  if (step === 0)
    return (
      <AppShell variant="Exa" step={1}>
        <Eyebrow>Exa comparison</Eyebrow>
        <Title>Set up your intro session.</Title>
        <Intro>
          Corgi can use Exa to find possible professional profiles. You confirm
          which one is yours before reviewing any profile details.
        </Intro>
        <Notice title="Internal prototype">
          This walkthrough does not create an account or save anything.
        </Notice>
        <ButtonRow>
          <Button onClick={next}>Get started</Button>
        </ButtonRow>
      </AppShell>
    );
  if (step === 1)
    return (
      <AppShell variant="Exa" step={2}>
        <Eyebrow>Your sign-in</Eyebrow>
        <Title>What’s your email?</Title>
        <Intro>
          We’ll use it to verify this walkthrough. No message will be sent.
        </Intro>
        <Stack>
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Stack>
        <ButtonRow>
          <Button disabled={!email.includes("@")} onClick={next}>
            Continue
          </Button>
          <Button kind="quiet" onClick={back}>
            Back
          </Button>
        </ButtonRow>
      </AppShell>
    );
  if (step === 2)
    return (
      <AppShell variant="Exa" step={3}>
        <Eyebrow>Quick check</Eyebrow>
        <Title>Enter the demo code.</Title>
        <Intro>
          Use 424242. In a real experience, we would email it to you.
        </Intro>
        <Stack>
          <Field
            label="6-digit code"
            inputMode="numeric"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
          />
          {error && (
            <Notice title="Try that again" tone="orange">
              {error}
            </Notice>
          )}
        </Stack>
        <ButtonRow>
          <Button disabled={otp.length !== 6} onClick={verify}>
            Verify
          </Button>
          <Button kind="quiet" onClick={back}>
            Back
          </Button>
        </ButtonRow>
      </AppShell>
    );
  if (step === 3)
    return (
      <AppShell variant="Exa" step={4}>
        <Eyebrow>About you</Eyebrow>
        <Title>What’s your first name?</Title>
        <Intro>Use the name people at Corgi know you by.</Intro>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (firstName.trim()) next();
          }}
        >
          <Stack>
            <Field
              label="First name"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </Stack>
          <ButtonRow>
            <Button type="submit" disabled={!firstName.trim()}>
              Continue
            </Button>
            <Button type="button" kind="quiet" onClick={back}>
              Back
            </Button>
          </ButtonRow>
        </form>
      </AppShell>
    );
  if (step === 4)
    return (
      <AppShell variant="Exa" step={5}>
        <Eyebrow>About you</Eyebrow>
        <Title>What’s your last name?</Title>
        <Intro>This helps distinguish you from people with similar names.</Intro>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (lastName.trim()) next();
          }}
        >
          <Stack>
            <Field
              label="Last name"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Stack>
          <ButtonRow>
            <Button type="submit" disabled={!lastName.trim()}>
              Continue
            </Button>
            <Button type="button" kind="quiet" onClick={back}>
              Back
            </Button>
          </ButtonRow>
        </form>
      </AppShell>
    );
  if (step === 5)
    return (
      <AppShell variant="Exa" step={6}>
        <Eyebrow>About you</Eyebrow>
        <Title>Where are you based?</Title>
        <Intro>
          Share only a broad city or region. Corgi does not track your location.
        </Intro>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (location.trim()) next();
          }}
        >
          <Stack>
            <Field
              label="City or region"
              autoComplete="address-level2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </Stack>
          <ButtonRow>
            <Button type="submit" disabled={!location.trim()}>
              Continue
            </Button>
            <Button type="button" kind="quiet" onClick={back}>
              Back
            </Button>
          </ButtonRow>
        </form>
      </AppShell>
    );
  if (step === 6)
    return (
      <AppShell variant="Exa" step={7}>
        <Eyebrow>About you</Eyebrow>
        <Title>What company are you with?</Title>
        <Intro>Your current company helps narrow the search.</Intro>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (company.trim()) next();
          }}
        >
          <Stack>
            <Field
              label="Company"
              autoComplete="organization"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </Stack>
          <ButtonRow>
            <Button type="submit" disabled={!company.trim()}>
              Continue
            </Button>
            <Button type="button" kind="quiet" onClick={back}>
              Back
            </Button>
          </ButtonRow>
        </form>
      </AppShell>
    );
  if (step === 7)
    return (
      <AppShell variant="Exa" step={8}>
        <Eyebrow>About you</Eyebrow>
        <Title>What is your role or title?</Title>
        <Intro>Use your current professional title.</Intro>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (roleTitle.trim()) next();
          }}
        >
          <Stack>
            <Field
              label="Role or title"
              autoComplete="organization-title"
              value={roleTitle}
              onChange={(event) => setRoleTitle(event.target.value)}
            />
          </Stack>
          <ButtonRow>
            <Button type="submit" disabled={!roleTitle.trim()}>
              Continue
            </Button>
            <Button type="button" kind="quiet" onClick={back}>
              Back
            </Button>
          </ButtonRow>
        </form>
      </AppShell>
    );
  if (step === 8)
    return (
      <AppShell variant="Exa" step={9}>
        <Eyebrow>About you</Eyebrow>
        <Title>Do you have a public profile?</Title>
        <Intro>
          Add a personal site, portfolio, GitHub, or another public profile.
          This is optional.
        </Intro>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            next();
          }}
        >
          <Stack>
            <Field
              label="Public URL"
              type="url"
              value={publicUrl}
              onChange={(event) => setPublicUrl(event.target.value)}
              placeholder="https://..."
            />
          </Stack>
          <ButtonRow>
            <Button type="submit">Continue</Button>
            <Button type="button" kind="quiet" onClick={back}>
              Back
            </Button>
          </ButtonRow>
        </form>
      </AppShell>
    );
  if (step === 9)
    return (
      <AppShell variant="Exa" step={10}>
        <Eyebrow>Before we look</Eyebrow>
        <Title>You confirm which profile is yours.</Title>
        <Intro>
          Exa may receive your name, broad location, company, role, and public
          URL to find professional profiles. Results may include information
          aggregated from LinkedIn, but Corgi never fetches LinkedIn pages.
          Associated profile images may load from their public image hosts.
        </Intro>
        <Notice title="You stay in control">
          Results may belong to someone else. Nothing is confirmed until you
          select your profile, and you can edit every imported field.
        </Notice>
        <ButtonRow>
          <Button onClick={next}>Find my profile</Button>
          <Button kind="quiet" onClick={back}>
            Back
          </Button>
        </ButtonRow>
      </AppShell>
    );
  if (step === 10)
    return (
      <AppShell variant="Exa" step={11}>
        <Eyebrow>Source discovery</Eyebrow>
        <Title>Ready to look?</Title>
        <Intro>
          Exa will search public professional data and show up to ten possible
          people for you to confirm.
        </Intro>
        {loading && (
          <div className="loading">
            <span className="status-dot" /> Looking for your profile…
          </div>
        )}
        {error && (
          <Notice title="Manual entry is ready" tone="orange">
            {error}
          </Notice>
        )}
        <ButtonRow>
          <Button disabled={loading} onClick={search}>
            Search with Exa
          </Button>
          <Button
            kind="secondary"
            onClick={() =>
              manualFallback("You chose to enter your background yourself.")
            }
          >
            Enter it myself
          </Button>
          <Button kind="quiet" onClick={back}>
            Back
          </Button>
        </ButtonRow>
      </AppShell>
    );
  if (step === 11)
    return (
      <AppShell variant="Exa" step={12}>
        <Eyebrow>Profile match</Eyebrow>
        <Title>Do you see yourself here?</Title>
        <Intro>
          Exa found up to 10 possible people. Select one profile to confirm
          your identity. Nothing is verified until you choose it.
        </Intro>
        <fieldset className="person-picker stack">
          <legend className="sr-only">Choose your professional profile</legend>
          <ol className="person-list">
            {candidates.slice(0, 10).map((candidate) => {
              const name = `${candidate.firstName} ${candidate.lastName}`;
              const initials = `${candidate.firstName[0]}${candidate.lastName[0]}`;
              return (
                <li
                  className={`person-card ${
                    selectedCandidateId === candidate.id ? "selected" : ""
                  }`}
                  key={candidate.id}
                >
                  <div className="person-avatar" aria-hidden="true">
                    <span>{initials}</span>
                    {candidate.imageUrl && (
                      <img
                        src={candidate.imageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={(event) => {
                          event.currentTarget.hidden = true;
                        }}
                      />
                    )}
                  </div>
                  <div className="person-details">
                    <strong>{name}</strong>
                    {(candidate.title || candidate.company) && (
                      <p>
                        {[candidate.title, candidate.company]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {candidate.location && <p>{candidate.location}</p>}
                    <a
                      href={candidate.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open public profile for ${name} in a new tab`}
                    >
                      {candidate.profileUrl}
                    </a>
                    <small>
                      {candidate.identifierOnly
                        ? "LinkedIn profile · Identity only"
                        : `${candidate.sourceHost} · Public professional profile`}
                    </small>
                  </div>
                  <label className="person-select">
                    <input
                      type="radio"
                      name="person-candidate"
                      value={candidate.id}
                      checked={selectedCandidateId === candidate.id}
                      onChange={() => setSelectedCandidateId(candidate.id)}
                    />
                    <span>This is me</span>
                  </label>
                </li>
              );
            })}
          </ol>
        </fieldset>
        <ButtonRow>
          <Button disabled={!selectedCandidateId} onClick={confirmCandidate}>
            Confirm this profile
          </Button>
          <Button
            kind="secondary"
            onClick={() => manualFallback("None of these profiles were yours.")}
          >
            None are mine
          </Button>
          <Button kind="quiet" onClick={back}>
            Back
          </Button>
        </ButtonRow>
      </AppShell>
    );
  if (step === 12)
    return (
      <AppShell variant="Exa" step={13}>
        <Eyebrow>Profile check</Eyebrow>
        <Title>Does this sound like you?</Title>
        <Intro>
          Exa returned structured public professional fields. Edit or clear
          anything before confirming.
        </Intro>
        {error && (
          <Notice title="Add it yourself" tone="orange">
            {error}
          </Notice>
        )}
        <div className="profile-grid">
          {[
            ["Role", "role"],
            ["Company", "companyOrProject"],
            ["Location", "location"],
            ["Area", "functionalArea"],
            ["Stage", "stage"],
          ].map(([label, key]) => (
            <div className="profile-row" key={key}>
              <label>{label}</label>
              <input
                aria-label={label}
                value={
                  (
                    draft[key as keyof ProfileDraft] as
                      { value?: string } | undefined
                  )?.value ?? ""
                }
                onChange={(e) =>
                  setField(
                    key as
                      | "role"
                      | "companyOrProject"
                      | "location"
                      | "functionalArea"
                      | "stage",
                    e.target.value,
                  )
                }
              />
              <SourceBadge
                kind={badgeKind(
                  draft[
                    key as
                      | "role"
                      | "companyOrProject"
                      | "location"
                      | "functionalArea"
                  ]?.attribution,
                )}
                host={sourceHost(
                  draft[
                    key as
                      | "role"
                      | "companyOrProject"
                      | "location"
                      | "functionalArea"
                  ]?.sourceUrl,
                )}
              />
            </div>
          ))}
          <div className="profile-row">
            <label>Focus areas</label>
            <input
              aria-label="Focus areas"
              value={draft.focusAreas.map((x) => x.value).join(", ")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  focusAreas: e.target.value.split(",").map((value) => ({
                    value: value.trim(),
                    attribution: "edited_by_you",
                    confirmed: false,
                  })),
                })
              }
            />
            <ProfileSourceList items={draft.focusAreas} />
          </div>
          <div className="profile-row">
            <label>Can help with</label>
            <input
              aria-label="Can help with"
              value={draft.contributionTopics.map((x) => x.value).join(", ")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  contributionTopics: e.target.value
                    .split(",")
                    .map((value) => ({
                      value: value.trim(),
                      attribution: "edited_by_you",
                      confirmed: false,
                    })),
                })
              }
            />
            <ProfileSourceList items={draft.contributionTopics} />
          </div>
        </div>
        <ButtonRow>
          <Button
            disabled={
              !draft.role.value.trim() ||
              !draft.companyOrProject.value.trim() ||
              !draft.location.value.trim() ||
              !draft.functionalArea.value.trim() ||
              !draft.focusAreas.some((item) => item.value.trim()) ||
              !draft.contributionTopics.some((item) => item.value.trim())
            }
            onClick={confirm}
          >
            Confirm profile
          </Button>
          <Button kind="quiet" onClick={() => (error ? setStep(10) : back())}>
            Back
          </Button>
        </ButtonRow>
      </AppShell>
    );
  if (step === 13)
    return (
      <AppShell variant="Exa" step={14}>
        <Eyebrow>For today</Eyebrow>
        <Title>What would you like to do?</Title>
        <Stack compact>
          <Choice
            title="Connect at Corgi now"
            detail="Set what you want to talk about and how long you are open."
            selected={path === "connect"}
            onClick={() => setPath("connect")}
          />
          <Choice
            title="Record community interest"
            detail="See what could happen next with the private Corgi community."
            selected={path === "community"}
            onClick={() => setPath("community")}
          />
          <Choice
            title="Maybe later"
            detail="Leave without opening introductions."
            selected={path === "later"}
            onClick={() => setPath("later")}
          />
        </Stack>
        <ButtonRow>
          <Button
            disabled={!path}
            onClick={() => (path === "connect" ? next() : setStep(18))}
          >
            Continue
          </Button>
          <Button kind="quiet" onClick={back}>
            Back
          </Button>
        </ButtonRow>
      </AppShell>
    );
  if (step === 14)
    return (
      <AppShell variant="Exa" step={15}>
        <Eyebrow>Conversation</Eyebrow>
        <Title>What do you want to talk about today?</Title>
        <Intro>
          These are suggestions, not assumptions. Unselect anything that does
          not fit.
        </Intro>
        <Stack compact>
          {(draft.suggestedIntents.length
            ? draft.suggestedIntents.map((x) => x.value)
            : [
                "Compare notes with another builder",
                "Get practical advice",
                "Talk through a current challenge",
              ]
          ).map((value) => (
            <CheckChoice
              key={value}
              label={value}
              checked={intents.includes(value)}
              onChange={() => toggleIntent(value)}
            />
          ))}
        </Stack>
        <Stack>
          <TextArea
            label="What would make the conversation useful?"
            value={useful}
            onChange={(e) => setUseful(e.target.value)}
          />
          <TextArea
            label="What could you share in return?"
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
          />
        </Stack>
        <ButtonRow>
          <Button
            disabled={!intents.length || !useful || !offer}
            onClick={next}
          >
            Set preferences
          </Button>
          <Button kind="quiet" onClick={back}>
            Back
          </Button>
        </ButtonRow>
      </AppShell>
    );
  if (step === 15)
    return (
      <AppShell variant="Exa" step={16}>
        <Eyebrow>Your preferences</Eyebrow>
        <Title>Make the introduction feel right.</Title>
        <Intro>
          AI cannot select any of these for you. Commercial conversations start
          off.
        </Intro>
        <Stack compact>
          <CheckChoice
            label="I’m open to an introduction now"
            checked={prefs.open}
            onChange={() => setPrefs({ ...prefs, open: !prefs.open })}
          />
          <CheckChoice
            label="Fundraising conversations"
            checked={prefs.fundraising}
            onChange={() =>
              setPrefs({ ...prefs, fundraising: !prefs.fundraising })
            }
          />
          <CheckChoice
            label="Recruiting conversations"
            checked={prefs.recruiting}
            onChange={() =>
              setPrefs({ ...prefs, recruiting: !prefs.recruiting })
            }
          />
          <CheckChoice
            label="Sales conversations"
            checked={prefs.sales}
            onChange={() => setPrefs({ ...prefs, sales: !prefs.sales })}
          />
          <CheckChoice
            label="Notify me in this prototype"
            detail="Simulated. No message will be sent."
            checked={prefs.notify}
            onChange={() => setPrefs({ ...prefs, notify: !prefs.notify })}
          />
        </Stack>
        <Stack>
          <label className="field">
            <span>Who can see I’m open?</span>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option>People at Corgi</option>
              <option>Corgi staff only</option>
            </select>
          </label>
          <label className="field">
            <span>Keep me open for</span>
            <select
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
            >
              <option>30 minutes</option>
              <option>60 minutes</option>
              <option>90 minutes</option>
              <option>Until I leave</option>
            </select>
          </label>
        </Stack>
        <ButtonRow>
          <Button disabled={!prefs.open} onClick={next}>
            Review introduction
          </Button>
          <Button kind="quiet" onClick={back}>
            Back
          </Button>
        </ButtonRow>
      </AppShell>
    );
  if (step === 16)
    return (
      <AppShell variant="Exa" step={17}>
        <Eyebrow>One last look</Eyebrow>
        <Title>Ready to be introduced?</Title>
        <Intro>
          No recommendation is guaranteed. If no one fits, Corgi should say so
          honestly.
        </Intro>
        <div className="summary">
          <section>
            <h2>You</h2>
            <p>
              {firstName} {lastName}, {draft.role.value} ·{" "}
              {draft.companyOrProject.value}
            </p>
          </section>
          <section>
            <h2>Today</h2>
            <p>{intents.join(", ")}</p>
          </section>
          <section>
            <h2>Useful conversation</h2>
            <p>{useful}</p>
          </section>
          <section>
            <h2>You can share</h2>
            <p>{offer}</p>
          </section>
          <section>
            <h2>Availability and boundaries</h2>
            <p>
              Open now for {expiration.toLowerCase()}. Visible to{" "}
              {visibility.toLowerCase()}. Prototype notifications{" "}
              {prefs.notify ? "on" : "off"}. Fundraising{" "}
              {prefs.fundraising ? "on" : "off"}, recruiting{" "}
              {prefs.recruiting ? "on" : "off"}, sales{" "}
              {prefs.sales ? "on" : "off"}.
            </p>
          </section>
        </div>
        <ButtonRow>
          <Button onClick={next}>Start introductions</Button>
          <Button kind="quiet" onClick={back}>
            Back
          </Button>
        </ButtonRow>
      </AppShell>
    );
  if (step === 17)
    return (
      <AppShell variant="Exa" step={17}>
        <Eyebrow>You’re ready</Eyebrow>
        <Title>Ready for recommendations.</Title>
        <Intro>
          This prototype stops here. It has not searched for, ranked, or shown
          another person.
        </Intro>
        <Notice title="What would happen next" tone="green">
          Corgi would look for someone present whose conversation preferences
          fit yours. There may be no recommendation.
        </Notice>
      </AppShell>
    );
  return (
    <AppShell variant="Exa" step={17}>
      <Eyebrow>Walkthrough complete</Eyebrow>
      <Title>
        {path === "community"
          ? "This is where community interest could go."
          : "Come back when the timing feels right."}
      </Title>
      <Intro>
        {path === "community"
          ? "A future experience could continue to the private Corgi community here."
          : "You can get ready for introductions another time."}
      </Intro>
      <Notice title="Nothing was saved">
        This prototype did not create a profile, submit community interest, or
        keep your answers.
      </Notice>
    </AppShell>
  );
}
