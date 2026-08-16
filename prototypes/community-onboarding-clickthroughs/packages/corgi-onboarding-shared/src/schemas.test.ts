import { describe, expect, it } from "vitest";
import {
  AttributedTextSchema,
  EnrichmentResponseSchema,
  OnboardingInputSchema,
  PersonCandidateSchema,
  PublicLinksSchema,
  SessionSummarySchema,
} from "./schemas";
import { emptyDraft } from "./fixtures";

describe("shared contracts", () => {
  it("validates search input without carrying member links", () => {
    const result = OnboardingInputSchema.parse({
      identity: { email: "a@b.com", firstName: "A", lastName: "B" },
      location: "San Francisco",
      urls: ["https://linkedin.com/in/a"],
    });
    expect(result).not.toHaveProperty("urls");
  });
  it("accepts honest provider fallback", () =>
    expect(
      EnrichmentResponseSchema.parse({
        status: "missing_key",
        sources: [],
        message: "Unavailable",
      }).status,
    ).toBe("missing_key"));
  it("accepts ten source candidates and rejects eleven", () => {
    const source = (index: number) => ({
      url: `https://person-${index}.example.com`,
      host: `person-${index}.example.com`,
      sourceType: "other" as const,
      retrievalStatus: "candidate" as const,
      mayExtractFacts: true,
    });
    const response = (count: number) => ({
      status: "draft_ready" as const,
      sources: Array.from({ length: count }, (_, index) => source(index)),
    });
    expect(EnrichmentResponseSchema.safeParse(response(10)).success).toBe(true);
    expect(EnrichmentResponseSchema.safeParse(response(11)).success).toBe(false);
  });
  it("allows only safe profile and image URL protocols", () => {
    const candidate = {
      id: "person-1",
      firstName: "Casey",
      lastName: "Builder",
      title: "Product Lead",
      profileUrl: "https://linkedin.com/in/casey-builder",
      imageUrl: "https://images.example.com/casey.jpg",
      sourceHost: "linkedin.com",
      identifierOnly: true,
      mayExtractFacts: false,
    };
    expect(PersonCandidateSchema.safeParse(candidate).success).toBe(true);
    expect(
      PersonCandidateSchema.safeParse({
        ...candidate,
        profileUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
    expect(
      PersonCandidateSchema.safeParse({
        ...candidate,
        imageUrl: "http://images.example.com/casey.jpg",
      }).success,
    ).toBe(false);
  });
  it("enforces at most one typed link per category and four total", () => {
    const link = (kind: "linkedin" | "website" | "github" | "social") => ({
      kind,
      url:
        kind === "linkedin"
          ? "https://linkedin.com/in/casey"
          : kind === "github"
            ? "https://github.com/casey"
            : `https://${kind}.example.com/casey`,
      use: kind === "linkedin" ? "identifier_only" : "public_context",
      provenance: "member_provided",
      retrievalStatus: "not_fetched",
    });
    expect(
      PublicLinksSchema.safeParse([
        link("linkedin"),
        link("website"),
        link("github"),
        link("social"),
      ]).success,
    ).toBe(true);
    expect(PublicLinksSchema.safeParse([link("website"), link("website")]).success).toBe(false);
  });
  it("requires LinkedIn links to remain identifier-only and not fetched", () => {
    const link = {
      kind: "linkedin",
      url: "https://linkedin.com/in/casey",
      use: "public_context",
      provenance: "member_provided",
      retrievalStatus: "not_fetched",
    };
    expect(PublicLinksSchema.safeParse([link]).success).toBe(false);
    expect(
      PublicLinksSchema.safeParse([
        { ...link, use: "identifier_only", retrievalStatus: "retrieved" },
      ]).success,
    ).toBe(false);
    expect(
      PublicLinksSchema.safeParse([
        { ...link, url: "ftp://linkedin.com/in/casey", use: "identifier_only" },
      ]).success,
    ).toBe(false);
    expect(
      PublicLinksSchema.safeParse([
        {
          ...link,
          kind: "website",
          url: "https://linkedin.com/in/casey",
          use: "public_context",
        },
      ]).success,
    ).toBe(false);
    expect(
      PublicLinksSchema.safeParse([
        { ...link, use: "identifier_only", provenance: "found_on_source" },
      ]).success,
    ).toBe(true);
    expect(
      PublicLinksSchema.safeParse([
        {
          ...link,
          url: "https://lnkd.in/casey",
          use: "identifier_only",
          provenance: "found_on_source",
        },
      ]).success,
    ).toBe(true);
  });
  it("requires a URL for a sourced field", () =>
    expect(
      AttributedTextSchema.safeParse({
        value: "Founder",
        attribution: "found_on_source",
        confirmed: false,
      }).success,
    ).toBe(false));
  it("rejects unconfirmed profile in a session", () => {
    const result = SessionSummarySchema.safeParse({
      confirmedProfile: emptyDraft("SF"),
      explicitIntent: ["Talk product"],
      usefulConversation: "A product tradeoff",
      offer: "Research notes",
      permissions: {
        openNow: true,
        visibility: "people_at_corgi",
        allowFundraising: false,
        allowRecruiting: false,
        allowSales: false,
        notifications: "in_app",
      },
      expiration: "60_minutes",
    });
    expect(result.success).toBe(false);
  });
});
