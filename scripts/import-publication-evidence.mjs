import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const sourcePath = process.argv[2] ?? process.env.OREGON_LISTINGS_AUDIT_HTML;

if (!sourcePath) {
  console.error(
    "Usage: node scripts/import-publication-evidence.mjs <oregon-listings.html>",
  );
  process.exit(2);
}

const html = await readFile(path.resolve(sourcePath), "utf8");
const match = html.match(/const DATA = (\{.*\});\r?\n\r?\nconst L/s);

if (!match) {
  throw new Error("Could not locate the embedded Listings Explorer dataset.");
}

const data = JSON.parse(match[1]);
const listings = data.listings;
const observations = new Map();
const conflicts = new Set();

for (let index = 0; index < listings.n; index += 1) {
  const providerRecordId = listings.placeId[index];
  const ratingValue = listings.rating[index];
  const reviewCount = listings.reviews[index];

  if (
    !providerRecordId ||
    listings.cellLevel[index] === 1 ||
    typeof ratingValue !== "number" ||
    typeof reviewCount !== "number"
  ) {
    continue;
  }

  const signature = `${ratingValue}|${reviewCount}`;
  const existing = observations.get(providerRecordId);
  if (existing && existing !== signature) {
    conflicts.add(providerRecordId);
  } else {
    observations.set(providerRecordId, signature);
  }
}

for (const providerRecordId of conflicts) observations.delete(providerRecordId);

const generatedWithOffset = `${data.generated.replace(" ", "T")}-07:00`;
const evidence = {
  schemaVersion: 1,
  source: "google_business_profile",
  observedAt: new Date(generatedWithOffset).toISOString(),
  importedFrom: path.basename(sourcePath),
  excludedCellLevelRatings: listings.cellLevel.filter((value) => value === 1).length,
  excludedConflictingSourceRecords: conflicts.size,
  observations: Object.fromEntries(
    [...observations.entries()].sort(([left], [right]) => left.localeCompare(right)),
  ),
};

const outputPath = path.resolve("src/data/rating-evidence.json");
await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      outputPath,
      observations: observations.size,
      excludedCellLevelRatings: evidence.excludedCellLevelRatings,
      excludedConflictingSourceRecords: evidence.excludedConflictingSourceRecords,
    },
    null,
    2,
  ),
);
