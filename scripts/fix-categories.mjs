#!/usr/bin/env node
/**
 * Moves listings whose provider category is unambiguously filed under the wrong
 * industry shard.
 *
 * The rule is deliberately narrow. A provider category is assigned to the industry it
 * appears in most often across the whole corpus; a listing is only moved when its
 * shard holds at most two of that category AND the majority industry holds at least
 * ten times as many. That catches "Beauty salon" sitting alone under Construction
 * (213 vs 1) and leaves genuinely cross-industry categories alone — "Massage
 * therapist" is 259 health-wellness and 54 beauty-personal-care, and both are correct.
 *
 * GENERIC_CATEGORIES are excluded outright: a label like "Store" has no meaningful
 * majority, so the vote would move listings on noise.
 *
 * Originals are archived before anything is written. Run with --dry to inspect.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "src/data/businesses");
const DRY = process.argv.includes("--dry");

const MINORITY_MAX = 2;
const MAJORITY_RATIO = 10;
/** Labels too generic for a majority vote to mean anything. */
const GENERIC_CATEGORIES = new Set(
  ["Store", "Shop", "Business", "Service", "Establishment"].map((c) => c.toLowerCase())
);

const shardFiles = readdirSync(DIR).filter((f) => f.includes("__") && f.endsWith(".json"));
const parse = (f) => {
  const raw = JSON.parse(readFileSync(join(DIR, f), "utf8"));
  return Array.isArray(raw) ? raw : raw.businesses ?? [];
};
const shardOf = (f) => {
  const [city, rest] = f.split("__");
  return { city, industry: rest.replace(/\.json$/, "") };
};

// 1. tally each provider category across industries
const tally = new Map();
for (const f of shardFiles) {
  const { industry } = shardOf(f);
  for (const b of parse(f)) {
    if (!b.category) continue;
    if (!tally.has(b.category)) tally.set(b.category, new Map());
    const m = tally.get(b.category);
    m.set(industry, (m.get(industry) ?? 0) + 1);
  }
}

// 2. decide the home industry per category, and which placements are misfiles
const misfiled = new Map(); // "category|industry" -> correct industry
for (const [category, m] of tally) {
  if (GENERIC_CATEGORIES.has(category.trim().toLowerCase())) continue;
  const ranked = [...m.entries()].sort((a, b) => b[1] - a[1]);
  const [home, homeCount] = ranked[0];
  for (const [industry, count] of ranked.slice(1)) {
    if (count <= MINORITY_MAX && homeCount >= MAJORITY_RATIO * count) {
      misfiled.set(`${category}|${industry}`, home);
    }
  }
}

// 3. move them
const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);
const archive = join(ROOT, "_archive", `businesses-precategoryfix-${stamp}`);
const pendingWrites = new Map(); // file -> array
const moves = [];

const load = (f) => {
  if (!pendingWrites.has(f)) pendingWrites.set(f, parse(f));
  return pendingWrites.get(f);
};

for (const f of shardFiles) {
  const { city, industry } = shardOf(f);
  const kept = [];
  for (const b of load(f)) {
    const home = b.category ? misfiled.get(`${b.category}|${industry}`) : undefined;
    if (!home) {
      kept.push(b);
      continue;
    }
    const target = `${city}__${home}.json`;
    if (!shardFiles.includes(target)) {
      // No shard to move it into: keep it rather than drop a real listing.
      kept.push(b);
      moves.push({ from: f, to: target, title: b.title, category: b.category, status: "no target shard — kept" });
      continue;
    }
    load(target).push(b);
    moves.push({ from: f, to: target, title: b.title, category: b.category, status: "moved" });
  }
  pendingWrites.set(f, kept);
}

const moved = moves.filter((m) => m.status === "moved");
for (const m of moves) {
  console.log(`  ${m.status.padEnd(22)} "${m.category}" — ${m.title}\n      ${m.from} -> ${m.to}`);
}
console.log(`\n${moved.length} listings moved, ${moves.length - moved.length} left in place`);

if (DRY) {
  // CHECKLIST.md cites this invocation as the proof for category placement, so it
  // has to be falsifiable: a dry run that finds work to do is a failing gate, not a
  // report. A check whose every outcome is "clean" is indistinguishable from a
  // broken one.
  console.log(
    moved.length === 0
      ? "dry run — no misfiled listings"
      : `dry run — ${moved.length} misfiled listing(s) found; nothing written`
  );
  process.exit(moved.length === 0 ? 0 : 1);
}

const touched = [...new Set(moves.filter((m) => m.status === "moved").flatMap((m) => [m.from, m.to]))];
mkdirSync(archive, { recursive: true });
for (const f of touched) copyFileSync(join(DIR, f), join(archive, f));
for (const f of touched) {
  writeFileSync(join(DIR, f), JSON.stringify(pendingWrites.get(f), null, 2) + "\n");
}
console.log(`archived ${touched.length} shards to ${archive.replace(ROOT + "/", "")}`);
console.log(`rewrote ${touched.length} shards`);
