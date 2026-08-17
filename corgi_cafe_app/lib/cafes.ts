// Corgi Cafe physical locations. The matcher only pairs two people at the SAME cafe (same
// `cafe_code`) — so when the location check is on, resolving which cafe someone is standing in is
// what enforces "both live at a Corgi Cafe, not virtually." Coordinates are placeholders; adjust
// per real venue. `radiusM` is how close (metres) you must be to count as present.
export type Cafe = { code: string; name: string; lat: number; lng: number; radiusM: number };

export const DEFAULT_CAFE_CODE = "corgi-cafe";
export const DEFAULT_CAFE_NAME = "Corgi Cafe";

// Demo mode runs in its own isolated cafe. The matcher only pairs people who share a `cafe_code`,
// so seeding the synthetic demo people under this code guarantees they can NEVER surface in a real
// (Live) pool, and a Live user can never be matched with a demo person.
export const DEMO_CAFE_CODE = "corgi-demo";

export const CORGI_CAFES: Cafe[] = [
  { code: "sf-defi", name: "SF DeFi", lat: 37.7897, lng: -122.3972, radiusM: 250 },
  { code: "sf-mission", name: "SF Mission", lat: 37.7599, lng: -122.4148, radiusM: 250 },
];

export function cafeName(code: string | null | undefined): string {
  return CORGI_CAFES.find((c) => c.code === code)?.name ?? DEFAULT_CAFE_NAME;
}

// Great-circle distance in metres.
function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

// The nearest cafe the coordinates fall inside (within its radius), or null if not at any cafe.
export function nearestCafe(lat: number, lng: number): { cafe: Cafe; distanceM: number } | null {
  let best: { cafe: Cafe; distanceM: number } | null = null;
  for (const cafe of CORGI_CAFES) {
    const distanceM = haversineM(lat, lng, cafe.lat, cafe.lng);
    if (distanceM <= cafe.radiusM && (!best || distanceM < best.distanceM)) best = { cafe, distanceM };
  }
  return best;
}
