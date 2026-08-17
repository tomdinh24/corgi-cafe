import { describe, expect, it } from "vitest";
import {
  EMPTY_PUBLIC_LINKS,
  buildPublicLinks,
  normalizePublicUrl,
  validatePublicLink,
} from "./publicLinks";

describe("member-provided public links", () => {
  it("normalizes a missing scheme after submission", () => {
    expect(normalizePublicUrl("example.com/work")).toBe(
      "https://example.com/work",
    );
  });

  it("accepts all four fields or an entirely blank skip", () => {
    const complete = buildPublicLinks({
      linkedin: "linkedin.com/in/casey-builder",
      website: "https://casey.example.com",
      github: "github.com/casey",
      social: "https://social.example.com/@casey",
    });
    expect(complete.errors).toEqual({});
    expect(complete.links).toHaveLength(4);
    expect(complete.links.every((link) => link.retrievalStatus === "not_fetched")).toBe(true);
    expect(buildPublicLinks(EMPTY_PUBLIC_LINKS)).toEqual({
      links: [],
      normalized: EMPTY_PUBLIC_LINKS,
      errors: {},
    });
  });

  it("validates LinkedIn and GitHub as profile links", () => {
    expect(
      validatePublicLink("linkedin", "https://example.com/in/casey").error,
    ).toBe("Enter a LinkedIn profile link.");
    expect(
      validatePublicLink("github", "https://github.com/casey/project").error,
    ).toBe("Enter a GitHub profile link.");
    expect(validatePublicLink("github", "https://github.com/casey").error).toBeUndefined();
    expect(
      validatePublicLink("website", "https://linkedin.com/in/casey").error,
    ).toBe("Add LinkedIn profile links in the LinkedIn field.");
    expect(
      validatePublicLink("social", "https://lnkd.in/casey").error,
    ).toBe("Add LinkedIn profile links in the LinkedIn field.");
    expect(
      validatePublicLink("website", "https://github.com/casey").error,
    ).toBe("Add GitHub profile links in the GitHub field.");
    expect(
      validatePublicLink("linkedin", "https://github.com/casey").error,
    ).toBe("Add GitHub profile links in the GitHub field.");
  });

  it("rejects non-public or non-web values", () => {
    expect(validatePublicLink("website", "not a link").error).toMatch(
      /full public link/i,
    );
    expect(validatePublicLink("social", "http://localhost/profile").error).toMatch(
      /full public link/i,
    );
    expect(validatePublicLink("website", "javascript:alert(1)").error).toMatch(
      /full public link/i,
    );
  });
});
