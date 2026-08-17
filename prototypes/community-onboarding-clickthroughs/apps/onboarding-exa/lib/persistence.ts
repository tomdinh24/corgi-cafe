import { z } from "zod";

export const PublicLinkSchema = z.object({
  kind: z.enum(["linkedin_identifier", "website", "github", "social"]),
  url: z.string().url().max(2048),
});

// Derived career context, computed client-side from the confirmed people-search candidate. Bounded
// and structured so it can be fed straight into the matcher without another lookup.
export const EnrichmentPayloadSchema = z.object({
  headline: z.string().trim().max(240).optional(),
  isFounder: z.boolean().optional(),
  currentCompany: z.string().trim().max(180).optional(),
  pastCompanies: z.array(z.string().trim().max(180)).max(8).optional(),
  roles: z
    .array(
      z.object({
        title: z.string().trim().max(160).optional(),
        company: z.string().trim().max(180).optional(),
        from: z.string().trim().max(40).optional(),
        to: z.string().trim().max(40).optional(),
      }),
    )
    .max(25)
    .optional(),
});

export const ProfilePayloadSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  broadLocation: z.string().trim().min(2).max(120),
  roleTitle: z.string().trim().min(1).max(160),
  companyOrProject: z.string().trim().min(1).max(180),
  aboutMe: z.string().trim().max(800),
  currentWork: z.string().trim().max(280),
  favoriteDrink: z.string().trim().max(160),
  avatarUrl: z.string().url().max(2048).optional(),
  sources: z.array(PublicLinkSchema).max(4),
  enrichment: EnrichmentPayloadSchema.optional(),
});

export const SessionPayloadSchema = z.object({
  orderConfirmedToday: z.boolean(),
  atCafe: z.boolean(),
  conversationMode: z.enum(["specific", "open"]),
  topics: z.array(z.string().trim().min(1).max(80)).max(4),
  usefulContext: z.string().trim().max(600),
  offerContext: z.string().trim().max(600),
  boundaries: z.object({
    fundraising: z.boolean(),
    recruiting: z.boolean(),
    sales: z.boolean(),
  }),
});

export const InteractionPayloadSchema = z.object({
  eventName: z.string().trim().min(1).max(80),
  stepId: z.string().trim().max(80).optional(),
  context: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
});

// Post-introduction writes. All are scoped to the acting member by RLS; the recommendation
// id ties the write to an introduction the member is actually a participant in.
export const DecisionPayloadSchema = z.object({
  recommendationId: z.string().uuid(),
  choice: z.enum(["continue", "pass"]),
});

export const MeetingPayloadSchema = z.object({
  recommendationId: z.string().uuid(),
  answer: z.enum(["met", "not_yet"]),
});

export const FeedbackPayloadSchema = z.object({
  recommendationId: z.string().uuid(),
  rating: z.enum(["very_unhelpful", "unhelpful", "neutral", "helpful", "very_helpful"]),
  note: z.string().trim().max(600).optional(),
});

export const PersistPayloadSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("profile"), profile: ProfilePayloadSchema }),
  z.object({ kind: z.literal("community_interest") }),
  z.object({ kind: z.literal("session"), session: SessionPayloadSchema }),
  z.object({ kind: z.literal("event"), event: InteractionPayloadSchema }),
  z.object({ kind: z.literal("decision"), decision: DecisionPayloadSchema }),
  z.object({ kind: z.literal("meeting"), meeting: MeetingPayloadSchema }),
  z.object({ kind: z.literal("feedback"), feedback: FeedbackPayloadSchema }),
]);

export function sourceHost(value: string) {
  return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
}

