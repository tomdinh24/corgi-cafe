import { z } from "zod";
import {
  fetchWithRetry,
  isLinkedInUrl,
  normalizeHost,
  type PersonCandidate,
} from "@corgi/onboarding-shared";

const WorkHistorySchema = z.object({
  title: z.string().max(160).nullish(),
  location: z.string().max(120).nullish(),
  dates: z
    .object({
      from: z.string().nullish(),
      to: z.string().nullish(),
    })
    .nullish(),
  company: z
    .object({
      id: z.string().nullish(),
      name: z.string().max(180).nullish(),
    })
    .nullish(),
});

const PersonEntitySchema = z.object({
  id: z.string().min(1).max(240),
  type: z.literal("person"),
  version: z.number().int().optional(),
  properties: z.object({
    name: z.string().max(160).nullish(),
    firstName: z.string().max(80).nullish(),
    lastName: z.string().max(80).nullish(),
    location: z.string().max(120).nullish(),
    workHistory: z.array(WorkHistorySchema).default([]),
  }),
});

const ExaResultSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.string().optional(),
        url: z.string().url(),
        title: z.string().max(180).nullish(),
        image: z.string().max(2048).nullish(),
        entities: z.array(PersonEntitySchema).default([]),
      }),
    )
    .default([]),
});
async function exaPost(path: string, body: unknown, signal?: AbortSignal) {
  const response = await fetchWithRetry(
    `https://api.exa.ai${path}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.EXA_API_KEY ?? ""}`,
      },
      body: JSON.stringify(body),
    },
    12_000,
    signal,
  );
  if (!response.ok)
    throw new Error(`Exa request failed with ${response.status}`);
  return response.json();
}

const UrlContentsSchema = z.object({
  results: z
    .array(
      z.object({
        url: z.string(),
        title: z.string().nullish(),
        text: z.string().nullish(),
      }),
    )
    .default([]),
});
export type UrlContent = { url: string; title?: string; text: string };

// Fetches readable page text for the URLs a member confirmed as their own (company site, LinkedIn,
// GitHub, personal site) via Exa's /contents — going through Exa rather than fetching server-side
// keeps us off internal-network SSRF surface and handles JS/anti-bot pages. Best-effort: URLs that
// error or return nothing are simply dropped.
export async function fetchUrlContents(
  urls: string[],
  signal?: AbortSignal,
): Promise<UrlContent[]> {
  if (!urls.length) return [];
  const body = await exaPost(
    "/contents",
    { urls, text: { maxCharacters: 2000 }, livecrawl: "fallback" },
    signal,
  );
  const parsed = UrlContentsSchema.parse(body);
  return parsed.results.flatMap((result) => {
    const text = result.text?.trim();
    if (!text) return [];
    return [{ url: result.url, title: result.title?.trim() || undefined, text: text.slice(0, 2000) }];
  });
}

// Public web results about a person (news, talks, funding, writing) — the layer beyond their own
// URLs. One call: Exa /search with inline contents so each result already carries readable text.
export async function searchPersonWeb(query: string, signal?: AbortSignal): Promise<UrlContent[]> {
  if (!query.trim()) return [];
  const body = await exaPost(
    "/search",
    { query, type: "auto", numResults: 5, contents: { text: { maxCharacters: 1200 } } },
    signal,
  );
  const parsed = UrlContentsSchema.parse(body);
  return parsed.results.flatMap((result) => {
    const text = result.text?.trim();
    if (!text) return [];
    return [{ url: result.url, title: result.title?.trim() || undefined, text: text.slice(0, 1200) }];
  });
}

function safeImageUrl(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    return new URL(value).protocol === "https:" ? value : undefined;
  } catch {
    return undefined;
  }
}

function currentWork(
  history: z.infer<typeof WorkHistorySchema>[],
): z.infer<typeof WorkHistorySchema> | undefined {
  return history.find((item) => item.dates?.to == null) ?? history[0];
}

export async function searchExa(
  query: string,
  signal?: AbortSignal,
): Promise<PersonCandidate[]> {
  const body = await exaPost(
    "/search",
    {
      query,
      type: "auto",
      category: "people",
      numResults: 10,
    },
    signal,
  );
  const parsed = ExaResultSchema.parse(body);
  return parsed.results
    .flatMap((result) => {
      const entity = result.entities.find((item) => item.type === "person");
      const firstName = entity?.properties.firstName?.trim();
      const lastName = entity?.properties.lastName?.trim();
      const sourceHost = normalizeHost(result.url);
      if (!entity || !firstName || !lastName || !sourceHost) return [];
      const work = currentWork(entity.properties.workHistory);
      const identifierOnly = isLinkedInUrl(result.url);
      return [
        {
          id: entity.id,
          firstName,
          lastName,
          title: work?.title?.trim() || undefined,
          company: work?.company?.name?.trim() || undefined,
          location:
            entity.properties.location?.trim() ||
            work?.location?.trim() ||
            undefined,
          profileUrl: result.url,
          imageUrl: safeImageUrl(result.image),
          sourceHost,
          identifierOnly,
          mayExtractFacts: !identifierOnly,
          // Keep the full trajectory (not just the current role) so the confirmed profile can be
          // enriched with is-founder / tenure / past-companies signal for the matcher.
          workHistory: entity.properties.workHistory
            .map((item) => ({
              title: item.title?.trim() || undefined,
              company: item.company?.name?.trim() || undefined,
              from: item.dates?.from?.trim() || undefined,
              to: item.dates?.to?.trim() || undefined,
            }))
            .filter((item) => item.title || item.company)
            .slice(0, 25),
        } satisfies PersonCandidate,
      ];
    })
    .slice(0, 10);
}
