"use client";

import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import type { AttributedText } from "./schemas";

export const PHASES = ["Sign in", "About you", "Profile", "Today", "Review"] as const;
export type OnboardingPhase = (typeof PHASES)[number];

export function BrandLogo({ linked = false }: { linked?: boolean }) {
  const image = (
    <img
      className="brand-logo"
      src="/brand/corgi-logo.svg"
      width="83"
      height="24"
      alt="Corgi"
    />
  );
  return linked ? (
    <a className="brand-home" href="/" aria-label="Corgi home">
      {image}
    </a>
  ) : (
    <span className="brand-home">{image}</span>
  );
}

export function AppShell({
  children,
  phase,
  actualStep,
  screenKey,
  actualTotal = 16,
  wide = false,
  complete = false,
}: {
  children: ReactNode;
  phase: OnboardingPhase;
  actualStep?: number;
  screenKey: string;
  actualTotal?: number;
  wide?: boolean;
  complete?: boolean;
}) {
  const screenRef = useRef<HTMLElement>(null);
  const phaseIndex = PHASES.indexOf(phase);
  useEffect(() => {
    const heading = screenRef.current?.querySelector("h1");
    if (heading instanceof HTMLElement) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [screenKey]);

  return (
    <div className="onboarding-shell">
      <a className="skip-link" href="#onboarding-main">
        Skip to main content
      </a>
      <header className="onboarding-header">
        <div className="onboarding-header-inner">
          <div className="brand-lockup">
            <BrandLogo />
            <span>Cafe introductions</span>
          </div>
          <span className="cafe-status">At Corgi</span>
        </div>
      </header>
      <div className="phase-bar">
        <div className="phase-copy">
          <span>{complete ? "Complete" : "Current phase"}</span>
          <strong>{phase}</strong>
        </div>
        <div
          className="phase-progress"
          role={complete ? undefined : "progressbar"}
          aria-label={
            complete || actualStep === undefined
              ? undefined
              : `${phase}. Step ${actualStep} of ${actualTotal}`
          }
          aria-valuemin={complete ? undefined : 1}
          aria-valuemax={complete ? undefined : actualTotal}
          aria-valuenow={complete ? undefined : actualStep}
        >
          {PHASES.map((item, index) => (
            <span
              key={item}
              className={
                complete || index < phaseIndex
                  ? "complete"
                  : index === phaseIndex
                    ? "active"
                    : ""
              }
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
      <main id="onboarding-main">
        <section
          ref={screenRef}
          className={`onboarding-screen${wide ? " wide" : ""}`}
        >
          {children}
        </section>
      </main>
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function Title({ children }: { children: ReactNode }) {
  return <h1>{children}</h1>;
}

export function Intro({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p className="intro" id={id}>
      {children}
    </p>
  );
}

export function Stack({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return <div className={compact ? "stack compact" : "stack"}>{children}</div>;
}

export function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p className="error-text" id={id}>
      <span aria-hidden="true">!</span>
      {children}
    </p>
  );
}

export function Field({
  label,
  hint,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const id = props.id ?? props.name ?? label.toLowerCase().replace(/\W+/g, "-");
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [props["aria-describedby"], hintId, errorId]
    .filter(Boolean)
    .join(" ") || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && <small id={hintId}>{hint}</small>}
      <input
        {...props}
        id={id}
        aria-describedby={describedBy}
        aria-invalid={error ? true : props["aria-invalid"]}
      />
      {error && <ErrorText id={errorId!}>{error}</ErrorText>}
    </div>
  );
}

export function TextArea({
  label,
  hint,
  error,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const id = props.id ?? props.name ?? label.toLowerCase().replace(/\W+/g, "-");
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [props["aria-describedby"], hintId, errorId]
    .filter(Boolean)
    .join(" ") || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && <small id={hintId}>{hint}</small>}
      <textarea
        {...props}
        id={id}
        aria-describedby={describedBy}
        aria-invalid={error ? true : props["aria-invalid"]}
      />
      {error && <ErrorText id={errorId!}>{error}</ErrorText>}
    </div>
  );
}

export function Button({
  children,
  kind = "primary",
  loading = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  kind?: "primary" | "secondary" | "quiet";
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      aria-busy={loading || undefined}
      className={`button ${kind} ${props.className ?? ""}`.trim()}
    >
      {loading && <span className="button-spinner" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}

export function ButtonRow({
  children,
  sticky = false,
}: {
  children: ReactNode;
  sticky?: boolean;
}) {
  return <div className={`button-row${sticky ? " sticky" : ""}`}>{children}</div>;
}

export function RadioChoice({
  name,
  value,
  title,
  detail,
  checked,
  onChange,
  disabled = false,
}: {
  name: string;
  value: string;
  title: string;
  detail: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label className={`radio-choice${disabled ? " disabled" : ""}`}>
      <input
        id={`${name}-${value.toLowerCase().replace(/\W+/g, "-")}`}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <span className="choice-state">{checked ? "Selected" : "Choose"}</span>
    </label>
  );
}

export function CheckChoice({
  label,
  detail,
  checked,
  onChange,
  disabled = false,
  name,
}: {
  label: string;
  detail?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  name?: string;
}) {
  return (
    <label className={`check-choice${disabled ? " disabled" : ""}`}>
      <input
        id={name}
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span>
        <strong>{label}</strong>
        {detail && <small>{detail}</small>}
      </span>
    </label>
  );
}

export function Notice({
  title,
  children,
  tone = "neutral",
  role,
}: {
  title: string;
  children: ReactNode;
  tone?: "neutral" | "orange" | "success" | "error";
  role?: "alert" | "status";
}) {
  return (
    <aside className={`notice ${tone}`} role={role}>
      <strong>{title}</strong>
      <div>{children}</div>
    </aside>
  );
}

export function SourceBadge({
  kind,
  host,
}: {
  kind: "entered" | "found" | "suggested" | "edited" | "identifier";
  host?: string;
}) {
  const normalizedHost = host?.toLowerCase().replace(/^www\./, "");
  const linkedInHost = Boolean(
    normalizedHost &&
      ["linkedin.com", "lnkd.in"].some(
        (blocked) =>
          normalizedHost === blocked || normalizedHost.endsWith(`.${blocked}`),
      ),
  );
  const text =
    kind === "identifier" || linkedInHost
      ? "LinkedIn profile · Link only"
      : kind === "entered"
      ? "Added by you"
      : kind === "found"
        ? `Found on ${host ?? "a public page"}`
        : kind === "edited"
          ? "Edited by you"
          : "Suggested by Corgi";
  return <span className={`source-badge ${kind}`}>{text}</span>;
}

export function ProfileSourceList({ items }: { items: AttributedText[] }) {
  const visibleItems = items.filter((item) => item.value);
  if (!visibleItems.length) return <SourceBadge kind="entered" />;
  return (
    <ul className="profile-source-list">
      {visibleItems.map((item, index) => {
        let host: string | undefined;
        try {
          host = item.sourceUrl
            ? new URL(item.sourceUrl).hostname.replace(/^www\./, "")
            : undefined;
        } catch {
          host = undefined;
        }
        const kind =
          item.attribution === "found_on_source"
            ? "found"
            : item.attribution === "edited_by_you"
              ? "edited"
              : item.attribution === "suggested_by_corgi"
                ? "suggested"
                : "entered";
        return (
          <li key={`${item.value}-${index}`}>
            <span>{item.value}</span>
            <SourceBadge kind={kind} host={host} />
          </li>
        );
      })}
    </ul>
  );
}
