const calls = new Map<string, { searches: number; expiresAt: number }>();
const otpSessions = new Map<string, number>();

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

export function reserveOtpSession(clientKey: string): boolean {
  const now = Date.now();
  const expiresAt = otpSessions.get(clientKey);
  if (expiresAt && expiresAt > now) return false;
  for (const [key, expiry] of otpSessions) {
    if (expiry <= now) otpSessions.delete(key);
  }
  otpSessions.set(clientKey, now + 30 * 60 * 1000);
  return true;
}
