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

export function AppShell({
  children,
  step,
  total = 17,
  variant,
}: {
  children: ReactNode;
  step: number;
  total?: number;
  variant: string;
}) {
  const progress = Math.min(100, Math.max(0, (step / total) * 100));
  const screenRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const heading = screenRef.current?.querySelector("h1");
    if (heading instanceof HTMLElement) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }, [step]);
  return (
    <main className="app-shell">
      <header className="site-header">
        <a
          className="wordmark"
          href="/"
          aria-label="Corgi Cafe onboarding home"
        >
          CORGI
        </a>
        <span>{variant}</span>
      </header>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={`Step ${step} of ${total}`}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={Math.min(total, Math.max(1, step))}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <section ref={screenRef} className="screen" aria-live="polite">
        {children}
      </section>
    </main>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}
export function Title({ children }: { children: ReactNode }) {
  return <h1>{children}</h1>;
}
export function Intro({ children }: { children: ReactNode }) {
  return <p className="intro">{children}</p>;
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

export function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = props.id ?? props.name ?? label.toLowerCase().replace(/\W+/g, "-");
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      {hint && <small>{hint}</small>}
      <input {...props} id={id} />
    </label>
  );
}

export function TextArea({
  label,
  hint,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
}) {
  const id = props.id ?? props.name ?? label.toLowerCase().replace(/\W+/g, "-");
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      {hint && <small>{hint}</small>}
      <textarea {...props} id={id} />
    </label>
  );
}

export function Button({
  children,
  kind = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  kind?: "primary" | "secondary" | "quiet";
}) {
  return (
    <button
      {...props}
      className={`button ${kind} ${props.className ?? ""}`.trim()}
    >
      {children}
    </button>
  );
}

export function ButtonRow({ children }: { children: ReactNode }) {
  return <div className="button-row">{children}</div>;
}

export function Choice({
  title,
  detail,
  selected,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  title: string;
  detail: string;
  selected?: boolean;
}) {
  return (
    <button
      {...props}
      className={`choice ${selected ? "selected" : ""}`}
      aria-pressed={selected}
    >
      <strong>{title}</strong>
      <span>{detail}</span>
    </button>
  );
}

export function CheckChoice({
  label,
  detail,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  detail?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label className={`check-choice ${disabled ? "disabled" : ""}`}>
      <input
        type="checkbox"
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
  tone = "paper",
}: {
  title: string;
  children: ReactNode;
  tone?: "paper" | "orange" | "green";
}) {
  return (
    <aside className={`notice ${tone}`}>
      <strong>{title}</strong>
      <div>{children}</div>
    </aside>
  );
}

export function SourceBadge({
  kind,
  host,
}: {
  kind: "entered" | "found" | "suggested" | "edited";
  host?: string;
}) {
  const text =
    kind === "entered"
      ? "Entered by you"
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
