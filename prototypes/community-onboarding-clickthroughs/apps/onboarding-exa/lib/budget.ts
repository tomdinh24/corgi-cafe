const calls = new Map<string, { searches: number; expiresAt: number }>();

function state(sessionToken: string) {
  const now = Date.now();
  const current = calls.get(sessionToken);
  if (current && current.expiresAt > now) return current;
  const fresh = {
    searches: 0,
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
