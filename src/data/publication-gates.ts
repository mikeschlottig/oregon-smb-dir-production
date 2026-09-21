import ratingEvidence from "./rating-evidence.json";
import type { Business, RatingObservation, WebsiteStatus } from "./businesses";

type RatingEvidence = {
  schemaVersion: number;
  source: RatingObservation["source"];
  observedAt: string;
  observations: Record<string, string>;
};

const evidence = ratingEvidence as RatingEvidence;

const suspiciousTlds = new Set([
  "buzz",
  "click",
  "info",
  "link",
  "live",
  "site",
  "top",
  "xyz",
]);

const directoryHosts = [
  "google.com",
  "maps.google.com",
  "mapquest.com",
  "yellowpages.com",
  "yelp.com",
];

const normalize = (value?: string | null): string =>
  (value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const getProviderRecordId = (googleUrl?: string | null): string | null => {
  if (!googleUrl) return null;
  const matches = googleUrl.match(/0x[0-9a-f]+:0x[0-9a-f]+/gi);
  return matches?.at(-1) ?? null;
};

const buildRatingObservation = (business: Business): RatingObservation | null => {
  if (
    typeof business.rating !== "number" ||
    typeof business.reviews !== "number" ||
    business.rating < 0 ||
    business.rating > 5 ||
    !Number.isInteger(business.reviews) ||
    business.reviews < 0
  ) {
    return null;
  }

  const sourceRecordId = getProviderRecordId(business.googleUrl);
  if (!sourceRecordId) return null;

  const expected = evidence.observations[sourceRecordId];
  if (expected !== `${business.rating}|${business.reviews}`) return null;

  return {
    source: evidence.source,
    observedAt: evidence.observedAt,
    sourceRecordId,
    ratingValue: business.rating,
    reviewCount: business.reviews,
    confidence: "source_observed",
  };
};

const getWebsiteStatus = (business: Business): WebsiteStatus => {
  if (!business.website) return "not_provided";

  try {
    const url = new URL(business.website);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    const tld = hostname.split(".").at(-1) ?? "";
    const isDirectory = directoryHosts.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );

    if (suspiciousTlds.has(tld) || isDirectory) return "quarantined";
  } catch {
    return "quarantined";
  }

  const validation = business.websiteValidation;
  if (
    validation?.resolutionStatus === "confirmed" &&
    validation.url === business.website &&
    validation.lastCheckedAt &&
    validation.confirmationSources.length > 0 &&
    validation.riskFlags.length === 0
  ) {
    return "confirmed";
  }

  return "unconfirmed";
};

const sanitizeBusiness = (business: Business): Business => {
  const ratingObservation = buildRatingObservation(business);
  const websiteStatus = getWebsiteStatus(business);

  return {
    ...business,
    rating: ratingObservation?.ratingValue ?? null,
    reviews: ratingObservation?.reviewCount ?? null,
    ratingObservation: ratingObservation ?? undefined,
    claimed: undefined,
    verified: undefined,
    verification: business.verification?.evidenceIds?.length
      ? business.verification
      : undefined,
    website: websiteStatus === "confirmed" ? business.website : null,
    websiteStatus,
  };
};

const duplicateKeys = (businesses: Business[]): Set<string> => {
  const groups = new Map<string, number>();
  for (const business of businesses) {
    const slugKey = `slug:${normalize(business.slug || business.title)}`;
    groups.set(slugKey, (groups.get(slugKey) ?? 0) + 1);

    const identityParts = [
      normalize(business.title),
      normalize(business.phone),
      normalize(business.address),
    ];
    if (identityParts.every(Boolean)) {
      const identityKey = `identity:${identityParts.join("|")}`;
      groups.set(identityKey, (groups.get(identityKey) ?? 0) + 1);
    }
  }
  return new Set(
    [...groups.entries()].filter(([, count]) => count > 1).map(([key]) => key),
  );
};

export const prepareBusinessesForPublication = (
  businesses: Business[],
): Business[] => {
  const blockedKeys = duplicateKeys(businesses);

  return businesses
    .filter((business) => {
      const slugKey = `slug:${normalize(business.slug || business.title)}`;
      const identityKey = `identity:${[
        normalize(business.title),
        normalize(business.phone),
        normalize(business.address),
      ].join("|")}`;
      return !blockedKeys.has(slugKey) && !blockedKeys.has(identityKey);
    })
    .map(sanitizeBusiness);
};

export const hasPublishableRating = (
  business: Business,
): business is Business & {
  rating: number;
  reviews: number;
  ratingObservation: RatingObservation;
} =>
  typeof business.rating === "number" &&
  typeof business.reviews === "number" &&
  business.ratingObservation != null;
