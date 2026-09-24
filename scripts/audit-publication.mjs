import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const businessDir = path.join(root, "src", "data", "businesses");
const evidence = JSON.parse(
  await readFile(path.join(root, "src", "data", "rating-evidence.json"), "utf8"),
);

const providerRecordId = (googleUrl) =>
  googleUrl?.match(/0x[0-9a-f]+:0x[0-9a-f]+/gi)?.at(-1) ?? null;

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

const businessFiles = (await readdir(businessDir))
  .filter((file) => file.endsWith(".json"))
  .sort();

const summary = {
  sourceFiles: businessFiles.length,
  rawRecords: 0,
  legacyClaimedFlagsIgnored: 0,
  ratingsAccepted: 0,
  ratingsSuppressed: 0,
  duplicateSlugRecordsBlocked: 0,
  suspiciousWebsitesQuarantined: 0,
};

for (const file of businessFiles) {
  const businesses = JSON.parse(await readFile(path.join(businessDir, file), "utf8"));
  summary.rawRecords += businesses.length;

  const slugCounts = new Map();
  for (const business of businesses) {
    const slug = (business.slug || business.title || "").toLowerCase();
    slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1);
  }

  for (const business of businesses) {
    if (business.claimed === true) summary.legacyClaimedFlagsIgnored += 1;
    if ((slugCounts.get((business.slug || business.title || "").toLowerCase()) ?? 0) > 1) {
      summary.duplicateSlugRecordsBlocked += 1;
    }

    if (typeof business.rating === "number" && typeof business.reviews === "number") {
      const recordId = providerRecordId(business.googleUrl);
      // Same lookup as publication-gates.ts: newest supplement first, then the base import.
      const expected = recordId
        ? ([...(evidence.supplements ?? [])].reverse().find((s) => s.observations[recordId])
            ?.observations[recordId] ?? evidence.observations[recordId])
        : null;
      if (expected === `${business.rating}|${business.reviews}`) {
        summary.ratingsAccepted += 1;
      } else {
        summary.ratingsSuppressed += 1;
      }
    }

    if (business.website) {
      try {
        const hostname = new URL(business.website).hostname.replace(/^www\./, "");
        const tld = hostname.split(".").at(-1) ?? "";
        if (suspiciousTlds.has(tld)) summary.suspiciousWebsitesQuarantined += 1;
      } catch {
        summary.suspiciousWebsitesQuarantined += 1;
      }
    }
  }
}

const displayFiles = [
  "src/lib/seo-content.ts",
  "src/pages/services/index.astro",
  "src/pages/services/[industrySlug]/[categorySlug]/[citySlug].astro",
  "src/pages/city/index.astro",
  "src/pages/city/[citySlug]/[industrySlug].astro",
  "src/pages/city/[citySlug]/[industrySlug]/page/[page].astro",
  "src/pages/city/[citySlug]/[industrySlug]/[businessSlug].astro",
  "src/pages/best-of/index.astro",
  "src/pages/city/grants-pass/business-professional-services/leverageai/index.astro",
  "src/pages/city/grants-pass/retail-shopping/daley-organics/index.astro",
];

const forbiddenClaims = [
  "verified providers",
  "verified listings",
  "verified businesses",
  "verified service professionals",
  "owner-confirmed contact",
  "on-the-ground visits",
  "★ verified listing",
  'badge="✓ verified"',
  "claimed: true",
  "verified: true",
];

const claimViolations = [];
for (const relativePath of displayFiles) {
  const content = (await readFile(path.join(root, relativePath), "utf8")).toLowerCase();
  for (const claim of forbiddenClaims) {
    if (content.includes(claim)) claimViolations.push({ file: relativePath, claim });
  }
}

const researchDir = path.join(root, "src", "content", "research");
const researchFiles = (await readdir(researchDir)).filter((file) => file.endsWith(".md"));
const fingerprints = new Map();
for (const file of researchFiles) {
  const content = await readFile(path.join(researchDir, file), "utf8");
  const normalized = content
    .replace(/^sourceFilename:.*$/gm, "")
    .replace(/([?&])(sa|source|ust|usg)=[^)&\s]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const hash = createHash("sha256").update(normalized).digest("hex");
  const matches = fingerprints.get(hash) ?? [];
  matches.push(file);
  fingerprints.set(hash, matches);
}
const duplicateResearch = [...fingerprints.values()].filter((files) => files.length > 1);

const gateSource = await readFile(
  path.join(root, "src", "data", "publication-gates.ts"),
  "utf8",
);
const requiredGateMarkers = [
  "buildRatingObservation",
  "websiteStatus === \"confirmed\"",
  "duplicateKeys",
  "claimed: undefined",
];
const missingGateMarkers = requiredGateMarkers.filter(
  (marker) => !gateSource.includes(marker),
);

const failures = {
  claimViolations,
  duplicateResearch,
  missingGateMarkers,
};

console.log(JSON.stringify({ summary, failures }, null, 2));

if (
  claimViolations.length > 0 ||
  duplicateResearch.length > 0 ||
  missingGateMarkers.length > 0
) {
  process.exit(1);
}
