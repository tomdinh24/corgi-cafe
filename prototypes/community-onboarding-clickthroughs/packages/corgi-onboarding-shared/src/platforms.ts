export const NAMED_PLATFORM_RULES = {
  linkedin: {
    label: "LinkedIn",
    recognizedDomains: ["linkedin.com", "lnkd.in"],
  },
  github: {
    label: "GitHub",
    recognizedDomains: ["github.com"],
  },
} as const;

export type NamedPlatformKind = keyof typeof NAMED_PLATFORM_RULES;

function normalizedHost(input: string): string | null {
  try {
    return new URL(input).hostname
      .toLowerCase()
      .replace(/\.$/, "")
      .replace(/^www\./, "");
  } catch {
    return null;
  }
}

function matchesDomain(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

export function namedPlatformForUrl(
  input: string,
): NamedPlatformKind | null {
  const host = normalizedHost(input);
  if (!host) return null;
  for (const [kind, rule] of Object.entries(NAMED_PLATFORM_RULES) as Array<
    [NamedPlatformKind, (typeof NAMED_PLATFORM_RULES)[NamedPlatformKind]]
  >) {
    if (rule.recognizedDomains.some((domain) => matchesDomain(host, domain))) {
      return kind;
    }
  }
  return null;
}

export function namedPlatformLabel(kind: NamedPlatformKind): string {
  return NAMED_PLATFORM_RULES[kind].label;
}
