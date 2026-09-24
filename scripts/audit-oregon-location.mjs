// Lists every listing the Oregon location gate blocks, using the exact rule the build uses
// (src/lib/oregon-location.ts, imported directly — Node strips the types).
//
//   node scripts/audit-oregon-location.mjs              report only
//   node scripts/audit-oregon-location.mjs --redirects  also rewrite the generated block
//                                                       in public/_redirects
//
// Writes:
//   reports/out-of-state-<date>.csv          one row per blocked listing, with the evidence
//   reports/out-of-state-<date>.queue.jsonl  one Maps search per blocked listing, for
//                                            listings-extraction/: does this business also
//                                            have a location in the Oregon city it was
//                                            filed under?
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { oregonLocation } from "../src/lib/oregon-location.ts";

const root = process.cwd();
const businessDir = path.join(root, "src", "data", "businesses");
const wiring = await readFile(path.join(root, "src", "data", "businesses.ts"), "utf8");
const cityNames = new Map(
  [
    ...(await readFile(path.join(root, "src", "data", "cities.ts"), "utf8")).matchAll(
      /name:\s*"([^"]+)",\s*slug:\s*"([^"]+)"/g,
    ),
  ].map((m) => [m[2], m[1]]),
);
const cityName = (slug) => cityNames.get(slug) ?? slug;

// Mirrors slugifyBusiness in src/data/businesses.ts (getBusinessPathSlug).
const slugify = (title) =>
  title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const norm = (s) => (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const records = [];
for (const file of (await readdir(businessDir)).filter((f) => f.endsWith(".json")).sort()) {
  const shard = file.slice(0, -5);
  const [citySlug, industrySlug] = shard.split("__");
  const wired = wiring.includes(`"${shard}":`);
  for (const b of JSON.parse(await readFile(path.join(businessDir, file), "utf8"))) {
    records.push({ shard, citySlug, industrySlug, wired, b, verdict: oregonLocation(b) });
  }
}

// Same business name with an Oregon street address anywhere in the data = a known Oregon
// location of a multi-location business.
const oregonByName = new Map();
for (const r of records) {
  if (r.verdict.publish && r.verdict.basis === "oregon-address") {
    const key = norm(r.b.title);
    if (!oregonByName.has(key)) oregonByName.set(key, `${r.shard}/${r.b.slug || slugify(r.b.title)}`);
  }
}

const blocked = records.filter((r) => !r.verdict.publish);
// Published, but the pin disagrees and nothing corroborates it: resolve with the extractor.
const unresolved = records.filter((r) => r.verdict.basis === "pin-away-uncorroborated");
const reported = [...blocked, ...unresolved];
const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const header = [
  "shard", "wired", "published", "slug", "title", "address", "phone", "basis", "evidence",
  "oregon_record_same_name", "googleUrl",
];
const rows = reported.map((r) =>
  [
    r.shard, r.wired, r.verdict.publish, r.b.slug || slugify(r.b.title), r.b.title, r.b.address, r.b.phone,
    r.verdict.basis, r.verdict.region, oregonByName.get(norm(r.b.title)) ?? "", r.b.googleUrl,
  ].map(csvCell).join(","),
);

const date = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
await mkdir(path.join(root, "reports"), { recursive: true });
const csvPath = path.join("reports", `out-of-state-${date}.csv`);
await writeFile(path.join(root, csvPath), [header.join(","), ...rows].join("\n") + "\n");

const queuePath = path.join("reports", `out-of-state-${date}.queue.jsonl`);
await writeFile(
  path.join(root, queuePath),
  reported
    .filter((r) => r.wired && r.citySlug && r.industrySlug)
    .map((r) =>
      JSON.stringify({
        kind: "search",
        query: `${r.b.title} ${cityName(r.citySlug)} Oregon`,
        purpose: "oregon-location-check",
        shard: r.shard,
        slug: r.b.slug || slugify(r.b.title),
        blockedPlaceUrl: r.b.googleUrl ?? null,
      }),
    )
    .join("\n") + "\n",
);

const count = (pred) => blocked.filter(pred).length;
console.log(`records ${records.length} · blocked ${blocked.length}`);
console.log(`  address-out-of-state       ${count((r) => r.verdict.basis === "address-out-of-state")}`);
console.log(`  pin-and-phone-out-of-state ${count((r) => r.verdict.basis === "pin-and-phone-out-of-state")}`);
console.log(`  published but unresolved   ${unresolved.length}`);
console.log(`  in wired shards            ${count((r) => r.wired)}`);
console.log(`  same name has Oregon record ${count((r) => oregonByName.has(norm(r.b.title)))}`);
console.log(`wrote ${csvPath}`);
console.log(`wrote ${queuePath}`);

if (process.argv.includes("--redirects")) {
  const BEGIN = "# BEGIN out-of-state listings (scripts/audit-oregon-location.mjs)";
  const END = "# END out-of-state listings";
  const redirectsPath = path.join(root, "public", "_redirects");
  const current = await readFile(redirectsPath, "utf8");
  const seen = new Set();
  const lines = [];
  for (const r of blocked.filter((r) => r.wired && r.citySlug && r.industrySlug)) {
    const from = `/city/${r.citySlug}/${r.industrySlug}/${r.b.slug || slugify(r.b.title)}`;
    if (seen.has(from)) continue;
    seen.add(from);
    const to = `/city/${r.citySlug}/${r.industrySlug}/`;
    lines.push(`${from}/ ${to} 301`, `${from} ${to} 301`);
  }
  const block = [BEGIN, ...lines, END].join("\n");
  const pattern = new RegExp(`${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END}`);
  const next = pattern.test(current)
    ? current.replace(pattern, block)
    : `${current.replace(/\n*$/, "\n")}\n${block}\n`;
  await writeFile(redirectsPath, next);
  console.log(`public/_redirects: ${lines.length} lines in the generated block`);
}
