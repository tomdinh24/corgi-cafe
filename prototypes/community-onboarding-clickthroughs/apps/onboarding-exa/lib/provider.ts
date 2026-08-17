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
        id: z.string().max(240).optional(),
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

function isLinkedInProfileIdentifier(value: string): boolean {
  if (!isLinkedInUrl(value)) return false;
  const parsed = new URL(value);
  const host = normalizeHost(value);
  const path = parsed.pathname.replace(/\/+$/, "");
  if (host === "lnkd.in") return /^\/[^/]+$/.test(path);
  return /^\/in\/[^/]+$/i.test(path);
}

export async function searchExa(
  query: string,
  memberIdentity: { firstName: string; lastName: string },
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
    .flatMap<PersonCandidate>((result, index) => {
      const sourceHost = normalizeHost(result.url);
      if (!sourceHost) return [];
      const identifierOnly = isLinkedInUrl(result.url);
      if (identifierOnly) {
        if (!isLinkedInProfileIdentifier(result.url)) return [];
        return [
          {
            id: result.id?.trim() || `linkedin-result-${index + 1}`,
            firstName: memberIdentity.firstName,
            lastName: memberIdentity.lastName,
            profileUrl: result.url,
            sourceHost,
            identifierOnly: true,
            mayExtractFacts: false,
          } satisfies PersonCandidate,
        ];
      }
      const entity = result.entities.find((item) => item.type === "person");
      const firstName = entity?.properties.firstName?.trim();
      const lastName = entity?.properties.lastName?.trim();
      if (!entity || !firstName || !lastName) return [];
      const work = currentWork(entity.properties.workHistory);
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
          identifierOnly: false,
          mayExtractFacts: true,
        } satisfies PersonCandidate,
      ];
    })
    .slice(0, 10);
}
