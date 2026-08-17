import { describe, expect, it } from "vitest";
import { PersistPayloadSchema, sourceHost } from "./persistence";

describe("persistent payloads", () => {
  it("accepts only coarse Cafe presence", () => {
    const parsed = PersistPayloadSchema.parse({
      kind: "session",
      session: {
        orderConfirmedToday: true,
        atCafe: true,
        conversationMode: "specific",
        topics: ["Building community"],
        usefulContext: "Compare onboarding notes",
        offerContext: "Design research experience",
        boundaries: { fundraising: false, recruiting: false, sales: false },
      },
    });
    expect(parsed.kind).toBe("session");
    expect(JSON.stringify(parsed)).not.toContain("latitude");
  });

  it("normalizes a source host", () => {
    expect(sourceHost("https://www.example.com/profile")).toBe("example.com");
  });
});

