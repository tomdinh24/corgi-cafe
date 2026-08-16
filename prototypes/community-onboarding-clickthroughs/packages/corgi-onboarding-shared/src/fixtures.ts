import type { PersonCandidate, ProfileDraft } from "./schemas";

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

export function draftFromCandidate(
  candidate: PersonCandidate,
  fallback: { role: string; company: string; location: string },
): ProfileDraft {
  const draft = emptyDraft(fallback.location);
  const mayUseFacts = candidate.mayExtractFacts && !candidate.identifierOnly;
  const field = (candidateValue: string | undefined, fallbackValue: string) =>
    mayUseFacts && candidateValue
      ? {
          value: candidateValue,
          attribution: "found_on_source" as const,
          sourceUrl: candidate.profileUrl,
          confirmed: false,
        }
      : {
          value: fallbackValue,
          attribution: "entered_by_you" as const,
          confirmed: false,
        };
  return {
    ...draft,
    role: field(candidate.title, fallback.role),
    companyOrProject: field(candidate.company, fallback.company),
    location: field(candidate.location, fallback.location),
  };
}
