export type ComparisonEvent =
  | "step_completed"
  | "provider_outcome"
  | "source_rejected"
  | "field_corrected"
  | "intent_corrected"
  | "terminal_completed";

export function recordComparisonEvent(
  name: ComparisonEvent,
  metadata: Record<string, string | number | boolean> = {},
) {
  if (typeof window === "undefined") return;
  const safe = Object.fromEntries(
    Object.entries(metadata).filter(
      ([key]) => !/name|email|location|url|text|profile/i.test(key),
    ),
  );
  const events = JSON.parse(
    sessionStorage.getItem("corgi-comparison-events") ?? "[]",
  ) as unknown[];
  events.push({ name, at: Date.now(), ...safe });
  sessionStorage.setItem(
    "corgi-comparison-events",
    JSON.stringify(events.slice(-100)),
  );
}
