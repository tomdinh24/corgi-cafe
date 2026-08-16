import { describe, expect, it } from "vitest";
import { reserveExaSearches } from "./budget";

describe("Exa session budgets", () => {
  it("reserves no more than two searches", () => {
    const token = `session-${crypto.randomUUID()}`;
    expect(reserveExaSearches(token, 1)).toBe(true);
    expect(reserveExaSearches(token, 1)).toBe(true);
    expect(reserveExaSearches(token, 1)).toBe(false);
  });
});
