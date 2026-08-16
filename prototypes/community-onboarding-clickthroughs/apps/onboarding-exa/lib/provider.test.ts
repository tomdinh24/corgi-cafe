import { afterEach, describe, expect, it, vi } from "vitest";
import { searchExa } from "./provider";

const memberIdentity = { firstName: "Member", lastName: "Entered" };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function personResult(index: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `result-${index}`,
    url: `https://example.com/people/person-${index}`,
    title: `Person ${index}`,
    image: `https://images.example.com/person-${index}.jpg`,
    entities: [
      {
        id: `person-${index}`,
        type: "person",
        version: 1,
        properties: {
          name: `Casey ${index}`,
          firstName: "Casey",
          lastName: String(index),
          location: "San Francisco, California",
          workHistory: [
            {
              title: "Product Lead",
              location: "San Francisco, California",
              dates: { from: "2024-01-01", to: null },
              company: { id: "company-1", name: "Corgi Labs" },
            },
          ],
        },
      },
    ],
    ...overrides,
  };
}

describe("Exa People Search boundary", () => {
  it("returns structured LinkedIn metadata as identifier-only", async () => {
    vi.stubEnv("EXA_API_KEY", "test");
    const result = personResult(1, {
      url: "https://linkedin.com/in/casey-builder",
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: [result] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const candidates = await searchExa("Casey Builder", memberIdentity);

    expect(candidates).toEqual([
      expect.objectContaining({
        firstName: memberIdentity.firstName,
        lastName: memberIdentity.lastName,
        title: undefined,
        company: undefined,
        location: undefined,
        imageUrl: undefined,
        identifierOnly: true,
        mayExtractFacts: false,
      }),
    ]);
    const requestBody = JSON.parse(
      String(fetchMock.mock.calls[0]?.[1]?.body),
    ) as Record<string, unknown>;
    expect(requestBody).toMatchObject({ category: "people", numResults: 10 });
    expect(requestBody).not.toHaveProperty("contents");
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      authorization: "Bearer test",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://api.exa.ai/search");
  });

  it("returns at most ten structured candidates in provider order", async () => {
    vi.stubEnv("EXA_API_KEY", "test");
    const results = Array.from({ length: 12 }, (_, index) =>
      personResult(index + 1),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ results }), { status: 200 }),
      ),
    );

    const candidates = await searchExa("People", memberIdentity);

    expect(candidates).toHaveLength(10);
    expect(candidates.map((candidate) => candidate.id)).toEqual(
      results.slice(0, 10).map((result) => result.entities[0].id),
    );
  });

  it("omits unsafe images and rows without structured person names", async () => {
    vi.stubEnv("EXA_API_KEY", "test");
    const unnamed = personResult(1);
    unnamed.entities[0].properties.firstName = null as unknown as string;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            results: [
              unnamed,
              personResult(2, { image: "http://example.com/photo.jpg" }),
              personResult(3, { image: "not-a-url" }),
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    const candidates = await searchExa("People", memberIdentity);

    expect(candidates).toHaveLength(2);
    expect(candidates.every((candidate) => !candidate.imageUrl)).toBe(true);
  });

  it("recovers after one rate limit", async () => {
    vi.stubEnv("EXA_API_KEY", "test");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("rate", { status: 429 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ results: [] }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    await searchExa("A Person", memberIdentity);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects malformed provider output", async () => {
    vi.stubEnv("EXA_API_KEY", "test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ results: "not-an-array" }), {
          status: 200,
        }),
      ),
    );
    await expect(searchExa("A Person", memberIdentity)).rejects.toThrow();
  });
});
