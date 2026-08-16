import { describe, expect, it } from "vitest";
import { reserveExaSearches, reserveOtpSession } from "./budget";

describe("Exa session budgets", () => {
  it("reserves no more than two searches", () => {
    const token = `session-${crypto.randomUUID()}`;
    expect(reserveExaSearches(token, 1)).toBe(true);
    expect(reserveExaSearches(token, 1)).toBe(true);
    expect(reserveExaSearches(token, 1)).toBe(false);
  });

  it("issues one OTP session per client window", () => {
    const client = `client-${crypto.randomUUID()}`;
    expect(reserveOtpSession(client)).toBe(true);
    expect(reserveOtpSession(client)).toBe(false);
  });
});
