import {
  namedPlatformForUrl,
  namedPlatformLabel,
} from "./platforms";
import {
  PublicLinksSchema,
  type PublicLink,
  type PublicLinkKind,
} from "./schemas";

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

export type PublicLinkValues = Record<PublicLinkKind, string>;
export type PublicLinkErrors = Partial<Record<PublicLinkKind, string>>;

export const EMPTY_PUBLIC_LINKS: PublicLinkValues = {
  linkedin: "",
  website: "",
  github: "",
  social: "",
};

const URL_ERROR = "Enter a full public link, like https://example.com.";

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

export function validatePublicLink(
  kind: PublicLinkKind,
  value: string,
): { normalized: string; error?: string } {
  if (!value.trim()) return { normalized: "" };
  const normalized = normalizePublicUrl(value);
  if (!normalized) return { normalized: value, error: URL_ERROR };
  const namedPlatform = namedPlatformForUrl(normalized);
  if (namedPlatform && namedPlatform !== kind) {
    const label = namedPlatformLabel(namedPlatform);
    return {
      normalized,
      error: `Add ${label} profile links in the ${label} field.`,
    };
  }
  if (kind === "linkedin" && !isLinkedInProfile(normalized)) {
    return { normalized, error: "Enter a LinkedIn profile link." };
  }
  if (kind === "github" && !isGitHubProfile(normalized)) {
    return { normalized, error: "Enter a GitHub profile link." };
  }
  return { normalized };
}

export function buildPublicLinks(values: PublicLinkValues): {
  links: PublicLink[];
  normalized: PublicLinkValues;
  errors: PublicLinkErrors;
} {
  const normalized = { ...EMPTY_PUBLIC_LINKS };
  const errors: PublicLinkErrors = {};
  const links: PublicLink[] = [];
  (Object.keys(EMPTY_PUBLIC_LINKS) as PublicLinkKind[]).forEach((kind) => {
    const result = validatePublicLink(kind, values[kind]);
    normalized[kind] = result.normalized;
    if (result.error) {
      errors[kind] = result.error;
      return;
    }
    if (!result.normalized) return;
    links.push({
      kind,
      url: result.normalized,
      use: kind === "linkedin" ? "identifier_only" : "public_context",
      provenance: "member_provided",
      retrievalStatus: "not_fetched",
    });
  });
  if (!Object.keys(errors).length) PublicLinksSchema.parse(links);
  return { links, normalized, errors };
}
