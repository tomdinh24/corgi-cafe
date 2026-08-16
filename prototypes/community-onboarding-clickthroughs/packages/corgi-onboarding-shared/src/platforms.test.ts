import { describe, expect, it } from "vitest";
import { namedPlatformForUrl } from "./platforms";

describe("named platform domains", () => {
  it("recognizes owned domains without accepting lookalike hosts", () => {
    expect(namedPlatformForUrl("https://www.linkedin.com/in/casey")).toBe(
      "linkedin",
    );
    expect(namedPlatformForUrl("https://github.com/casey")).toBe("github");
    expect(namedPlatformForUrl("https://linkedin.com.example.test/in/casey")).toBeNull();
    expect(namedPlatformForUrl("https://notgithub.com/casey")).toBeNull();
  });
});
