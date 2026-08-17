import type { ProfileDraft } from "./schemas";

export function emptyDraft(location: string): ProfileDraft {
  const entered = (value = "") => ({
    value,
    attribution: "entered_by_you" as const,
    confirmed: false,
  });
  return {
    role: entered(),
    companyOrProject: entered(),
    location: entered(location),
    functionalArea: entered(),
    stage: entered(),
    focusAreas: [],
    contributionTopics: [],
    suggestedIntents: [],
    evidence: [],
    confirmationState: "unconfirmed",
  };
}
