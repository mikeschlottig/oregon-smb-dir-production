// Decides whether a scraped listing is an Oregon business. One rule, used by the build
// (src/data/publication-gates.ts) and by scripts/audit-oregon-location.mjs, so the report
// and the site can never disagree. Keep this file free of path aliases and non-erasable
// TypeScript: Node imports it directly.
//
// Evidence, in order of trust:
//   1. The street address. If it names another state or province, the record is a
//      different business with the same name in another city (Albany GA, Ashland KY…).
//   2. With no street address (a service-area business), the Google place pin and the
//      phone area code. Both must point away from Oregon to block: a pin alone is not
//      enough, because Google gives many service-area businesses a placeholder pin in the
//      Pacific (46.423669,-129.942709), and an area code alone is not enough, because
//      owners keep out-of-state mobile numbers.

export type OregonLocationInput = {
  address?: string | null;
  phone?: string | null;
  googleUrl?: string | null;
};

export type OregonLocationVerdict =
  | { publish: true; basis: "oregon-address" | "no-contrary-evidence" }
  // Pin points away but there is no phone to corroborate it. Published, and queued for
  // listings-extraction/ to resolve, because a lone pin has blocked real Oregon businesses.
  | { publish: true; basis: "pin-away-uncorroborated"; region: string }
  | {
      publish: false;
      basis: "address-out-of-state" | "pin-and-phone-out-of-state";
      region: string;
    };

export const OREGON_AREA_CODES: ReadonlySet<string> = new Set(["503", "971", "541", "458"]);

// Oregon's bounding box plus a small margin. It also covers slivers of WA, ID, NV and CA,
// so it is only ever used together with a second signal.
const OREGON_BOUNDS = { minLat: 41.9, maxLat: 46.4, minLng: -124.8, maxLng: -116.3 };

// West of this longitude at Oregon's latitudes is open ocean: a placeholder pin, not a place.
const OCEAN_LNG = -125;

const CANADIAN_PROVINCES = "AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT";

/** Two-letter state/province code named by a street address, or null if none is legible. */
export const addressRegion = (address?: string | null): string | null => {
  if (!address) return null;
  const us = address.match(/,\s*([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/);
  if (us) return us[1];
  const ca = address.match(new RegExp(`,\\s*(${CANADIAN_PROVINCES})\\s+[A-Z]\\d[A-Z]`));
  if (ca) return ca[1];
  const bare = address.match(/,\s*([A-Z]{2})\s*(?:,\s*(?:USA|US|United States))?\s*$/);
  if (bare) return bare[1];
  if (/\bOregon\b/i.test(address)) return "OR";
  return null;
};

/** The place pin (`!3d<lat>!4d<lng>`, last wins). Never the `/@` viewport: that is the
 *  map view of the search that found the place, not the place. */
export const placePin = (
  googleUrl?: string | null,
): { lat: number; lng: number } | null => {
  if (!googleUrl) return null;
  const pins = [...googleUrl.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g)];
  const last = pins.at(-1);
  if (!last) return null;
  return { lat: parseFloat(last[1]), lng: parseFloat(last[2]) };
};

export const isInOregonBounds = ({ lat, lng }: { lat: number; lng: number }): boolean =>
  lat >= OREGON_BOUNDS.minLat &&
  lat <= OREGON_BOUNDS.maxLat &&
  lng >= OREGON_BOUNDS.minLng &&
  lng <= OREGON_BOUNDS.maxLng;

/** Ten-digit NANP area code, or null. */
export const areaCode = (phone?: string | null): string | null => {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return digits.length === 10 ? digits.slice(0, 3) : null;
};

export const oregonLocation = (business: OregonLocationInput): OregonLocationVerdict => {
  const region = addressRegion(business.address);
  if (region === "OR") return { publish: true, basis: "oregon-address" };
  if (region) return { publish: false, basis: "address-out-of-state", region };

  const pin = placePin(business.googleUrl);
  const pinAway = pin != null && pin.lng > OCEAN_LNG && !isInOregonBounds(pin);
  if (!pinAway) return { publish: true, basis: "no-contrary-evidence" };
  const code = areaCode(business.phone);
  const where = `pin ${pin.lat.toFixed(4)},${pin.lng.toFixed(4)}; area code ${code ?? "none"}`;
  if (code == null) return { publish: true, basis: "pin-away-uncorroborated", region: where };
  if (OREGON_AREA_CODES.has(code)) return { publish: true, basis: "no-contrary-evidence" };
  return { publish: false, basis: "pin-and-phone-out-of-state", region: where };
};
