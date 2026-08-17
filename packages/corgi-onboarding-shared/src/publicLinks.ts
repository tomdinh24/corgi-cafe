import {
  namedPlatformForUrl,
  namedPlatformLabel,
  type NamedPlatformKind,
} from "./platforms";

// Onboarding link fields. LinkedIn is kept as an identifier only (never fetched); the other three
// are optional public context. This mirrors the app's `LinkKind` so the validator can be shared.
export type PublicLinkKind =
  | "linkedin_identifier"
  | "website"
  | "github"
  | "social";

function normalizeHost(input: string): string | null {
  try {
    return new URL(input).hostname
      .toLowerCase()
      .replace(/\.$/, "")
      .replace(/^www\./, "");
  } catch {
    return null;
  }
}

const URL_ERROR = "Enter a full public link, like https://example.com.";

// Normalizes a member-entered link: adds a missing https:// scheme, strips the fragment, and
// rejects anything that is not a real public http(s) address — no `javascript:` or other schemes,
// no credential-bearing URLs (`user:pass@host`), no bare hosts without a dot (e.g. `localhost`).
// Returns "" for an empty value and null for an unusable one.
export function normalizePublicUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return trimmed ? null : "";
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const parsed = new URL(withScheme);
    const host = normalizeHost(parsed.href);
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      !host ||
      !host.includes(".") ||
      parsed.username ||
      parsed.password
    ) {
      return null;
    }
    parsed.hash = "";
    return parsed.href;
  } catch {
    return null;
  }
}

function isLinkedInProfile(value: string): boolean {
  const host = normalizeHost(value);
  const path = new URL(value).pathname.replace(/\/+$/, "");
  return Boolean(
    host &&
      (host === "linkedin.com" || host.endsWith(".linkedin.com")) &&
      /^\/in\/[^/]+$/i.test(path),
  );
}

function isGitHubProfile(value: string): boolean {
  const parsed = new URL(value);
  const host = normalizeHost(value);
  const segments = parsed.pathname.split("/").filter(Boolean);
  return host === "github.com" && segments.length === 1;
}

function platformForKind(kind: PublicLinkKind): NamedPlatformKind | null {
  if (kind === "linkedin_identifier") return "linkedin";
  if (kind === "github") return "github";
  return null;
}

// Validates one field's value and returns the normalized URL plus a field-level error when the
// link is malformed or belongs in a different field (e.g. a GitHub URL pasted into LinkedIn).
export function validatePublicLink(
  kind: PublicLinkKind,
  value: string,
): { normalized: string; error?: string } {
  if (!value.trim()) return { normalized: "" };
  const normalized = normalizePublicUrl(value);
  if (!normalized) return { normalized: value, error: URL_ERROR };
  const namedPlatform = namedPlatformForUrl(normalized);
  if (namedPlatform && namedPlatform !== platformForKind(kind)) {
    const label = namedPlatformLabel(namedPlatform);
    return {
      normalized,
      error: `Add ${label} profile links in the ${label} field.`,
    };
  }
  if (kind === "linkedin_identifier" && !isLinkedInProfile(normalized)) {
    return { normalized, error: "Enter a LinkedIn profile link." };
  }
  if (kind === "github" && !isGitHubProfile(normalized)) {
    return { normalized, error: "Enter a GitHub profile link." };
  }
  return { normalized };
}
