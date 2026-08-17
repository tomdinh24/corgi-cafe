const calls = new Map<string, { searches: number; enrichments: number; expiresAt: number }>();

function state(sessionToken: string) {
  const now = Date.now();
  const current = calls.get(sessionToken);
  if (current && current.expiresAt > now) return current;
  const fresh = {
    searches: 0,
    enrichments: 0,
    expiresAt: now + 30 * 60 * 1000,
  };
  calls.set(sessionToken, fresh);
  return fresh;
}

export function reserveExaSearches(
  sessionToken: string,
  count: number,
): boolean {
  const current = state(sessionToken);
  if (current.searches + count > 2) return false;
  current.searches += count;
  return true;
}

// URL enrichment fans out to Exa /contents (paid) + an LLM extraction, so cap it the same way we
// cap searches: a small number of runs per member per window, to bound cost and prevent abuse.
export function reserveEnrichment(sessionToken: string): boolean {
  const current = state(sessionToken);
  if (current.enrichments + 1 > 2) return false;
  current.enrichments += 1;
  return true;
}
