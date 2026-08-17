import { describe, expect, it } from "vitest";
import type { PersonCandidate } from "./schemas";
import { draftFromCandidate } from "./fixtures";

const fallback = {
  role: "Member-entered role",
  company: "Member-entered company",
  location: "Member-entered city",
};

describe("candidate profile attribution", () => {
  it("never imports or attributes facts from an identifier-only LinkedIn candidate", () => {
    const candidate: PersonCandidate = {
      id: "linkedin-candidate",
      firstName: "Casey",
      lastName: "Builder",
      title: "Provider title that must be ignored",
      company: "Provider company that must be ignored",
      location: "Provider location that must be ignored",
      profileUrl: "https://linkedin.com/in/casey-builder",
      sourceHost: "linkedin.com",
      identifierOnly: true,
      mayExtractFacts: false,
    };
    const draft = draftFromCandidate(candidate, fallback);
    expect(draft.role).toMatchObject({
      value: fallback.role,
      attribution: "entered_by_you",
    });
    expect(draft.companyOrProject.value).toBe(fallback.company);
    expect(draft.location.value).toBe(fallback.location);
    expect([draft.role, draft.companyOrProject, draft.location]).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceUrl: candidate.profileUrl }),
      ]),
    );
  });

  it("keeps recovered source attribution for an authorized non-LinkedIn candidate", () => {
    const candidate: PersonCandidate = {
      id: "public-candidate",
      firstName: "Casey",
      lastName: "Builder",
      title: "Product Lead",
      company: "Corgi Labs",
      location: "San Francisco",
      profileUrl: "https://casey.example.com/about",
      sourceHost: "casey.example.com",
      identifierOnly: false,
      mayExtractFacts: true,
    };
    const draft = draftFromCandidate(candidate, fallback);
    expect(draft.role).toMatchObject({
      value: "Product Lead",
      attribution: "found_on_source",
      sourceUrl: candidate.profileUrl,
    });
  });
});
