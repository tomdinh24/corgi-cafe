import { z } from "zod";

export const AttributionSchema = z.enum([
  "entered_by_you",
  "found_on_source",
  "suggested_by_corgi",
  "edited_by_you",
]);

export const AttributedTextSchema = z
  .object({
    value: z.string().trim().max(280),
    attribution: AttributionSchema,
    sourceUrl: z.string().url().optional(),
    confirmed: z.boolean().default(false),
  })
  .superRefine((field, context) => {
    if (field.attribution === "found_on_source" && !field.sourceUrl) {
      context.addIssue({
        code: "custom",
        message: "Imported fields require a source URL",
        path: ["sourceUrl"],
      });
    }
  });

export const OnboardingInputSchema = z.object({
  identity: z.object({
    email: z.string().email(),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
  }),
  location: z.string().trim().min(2).max(120),
  seedWorkContext: z.string().trim().max(800).optional(),
  urls: z.array(z.string().url()).max(4).default([]),
  freeText: z.string().trim().max(1200).optional(),
});

export const SourceEvidenceSchema = z.object({
  url: z.string().url(),
  host: z.string().min(1),
  title: z.string().max(180).optional(),
  sourceType: z.enum([
    "personal",
    "company",
    "portfolio",
    "article",
    "social",
    "other",
  ]),
  retrievalStatus: z.enum([
    "candidate",
    "selected",
    "retrieved",
    "blocked",
    "failed",
  ]),
  mayExtractFacts: z.boolean(),
  blockedReason: z.string().max(160).optional(),
});

const HttpUrlSchema = z
  .string()
  .url()
  .max(2048)
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "Only HTTP and HTTPS URLs are allowed");

const HttpsUrlSchema = z
  .string()
  .url()
  .max(2048)
  .refine((value) => new URL(value).protocol === "https:", {
    message: "Profile images must use HTTPS",
  });

// One prior/current role from the people-search work history. Carried on the candidate so that,
// once the member confirms "this is me", we can persist their trajectory as profile enrichment
// (is-founder, tenure, past companies) instead of discarding everything but the current title.
export const WorkHistoryEntrySchema = z.object({
  title: z.string().trim().max(160).optional(),
  company: z.string().trim().max(180).optional(),
  from: z.string().trim().max(40).optional(),
  to: z.string().trim().max(40).optional(),
});
export type WorkHistoryEntry = z.infer<typeof WorkHistoryEntrySchema>;

export const PersonCandidateSchema = z.object({
  id: z.string().min(1).max(240),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  title: z.string().trim().max(160).optional(),
  company: z.string().trim().max(180).optional(),
  location: z.string().trim().max(120).optional(),
  profileUrl: HttpUrlSchema,
  imageUrl: HttpsUrlSchema.optional(),
  sourceHost: z.string().min(1).max(255),
  identifierOnly: z.boolean(),
  mayExtractFacts: z.boolean(),
  workHistory: z.array(WorkHistoryEntrySchema).max(25).default([]),
});

export const ProfileDraftSchema = z.object({
  role: AttributedTextSchema,
  companyOrProject: AttributedTextSchema,
  location: AttributedTextSchema,
  functionalArea: AttributedTextSchema,
  stage: AttributedTextSchema.optional(),
  focusAreas: z.array(AttributedTextSchema).max(8),
  contributionTopics: z.array(AttributedTextSchema).max(8),
  suggestedIntents: z.array(AttributedTextSchema).max(8),
  evidence: z.array(SourceEvidenceSchema).max(4),
  confirmationState: z.enum(["unconfirmed", "confirmed"]),
});

export const EnrichmentResponseSchema = z.object({
  status: z.enum([
    "draft_ready",
    "manual_only",
    "missing_key",
    "timed_out",
    "error",
  ]),
  draft: ProfileDraftSchema.optional(),
  clarification: z.string().max(240).optional(),
  sources: z.array(SourceEvidenceSchema).max(10).default([]),
  candidates: z.array(PersonCandidateSchema).max(10).default([]),
  message: z.string().max(240).optional(),
});

export const SessionSummarySchema = z.object({
  confirmedProfile: ProfileDraftSchema.refine(
    (draft) => {
      const fields = [
        draft.role,
        draft.companyOrProject,
        draft.location,
        draft.functionalArea,
        ...(draft.stage ? [draft.stage] : []),
        ...draft.focusAreas,
        ...draft.contributionTopics,
        ...draft.suggestedIntents,
      ];
      return (
        draft.confirmationState === "confirmed" &&
        fields.every((field) => field.confirmed)
      );
    },
    {
      message: "Every profile field must be confirmed",
    },
  ),
  explicitIntent: z.array(z.string().trim().min(1).max(160)).max(8),
  usefulConversation: z.string().trim().min(1).max(600),
  offer: z.string().trim().min(1).max(600),
  permissions: z.object({
    openNow: z.boolean(),
    visibility: z.enum(["people_at_corgi", "staff_only"]),
    allowFundraising: z.boolean(),
    allowRecruiting: z.boolean(),
    allowSales: z.boolean(),
    notifications: z.enum(["in_app", "sms", "none"]),
  }),
  expiration: z.enum([
    "30_minutes",
    "60_minutes",
    "90_minutes",
    "when_i_leave",
  ]),
});

export type OnboardingInput = z.infer<typeof OnboardingInputSchema>;
export type SourceEvidence = z.infer<typeof SourceEvidenceSchema>;
export type PersonCandidate = z.infer<typeof PersonCandidateSchema>;
export type ProfileDraft = z.infer<typeof ProfileDraftSchema>;
export type EnrichmentResponse = z.infer<typeof EnrichmentResponseSchema>;
export type SessionSummary = z.infer<typeof SessionSummarySchema>;
export type AttributedText = z.infer<typeof AttributedTextSchema>;
