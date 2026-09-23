#!/usr/bin/env node
/**
 * Apply a batch of listing requests to the business shards.
 *
 *   node scripts/add-listings.mjs requests/listings/<batch>.json [--dry]
 *
 * Each entry names a shard (<city>__<industry>) and a Business record.
 *   mode "add"   (default) appends a new record; skipped if the slug already exists.
 *   mode "patch" merges the given fields into the existing record with that slug —
 *                used when the business is already in the directory from source data.
 *
 * Shards are edited as text, never re-serialized, so untouched records keep their exact
 * bytes (e.g. "rating": 5.0 stays 5.0) and a diff shows only what the request changed.
 *
 * The script refuses anything the publication gates would silently strip, so a request
 * either lands exactly as written or fails loudly:
 *   - the shard file must already exist (new cities/industries are a separate change)
 *   - slugs are kebab-case and unique within the shard
 *   - a website needs a matching, confirmed websiteValidation with sources and no risk flags
 *   - a verification event needs at least one evidence ID
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const [batchPath, ...flags] = process.argv.slice(2);
const dry = flags.includes("--dry");
if (!batchPath) {
  console.error("Usage: node scripts/add-listings.mjs <batch.json> [--dry]");
  process.exit(2);
}

const root = process.cwd();
const batch = JSON.parse(await readFile(path.resolve(batchPath), "utf8"));
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const errors = [];

const shards = new Map();
const loadShard = async (shard) => {
  if (shards.has(shard)) return shards.get(shard);
  const file = path.join(root, "src", "data", "businesses", `${shard}.json`);
  const text = await readFile(file, "utf8").catch(() => null);
  const data = text == null ? null : { file, text, eol: text.includes("\r\n") ? "\r\n" : "\n", changed: false };
  shards.set(shard, data);
  return data;
};

/** Serialize one record in the shard's layout: array items at 2 spaces, fields at 4. */
const serialize = (record, eol) =>
  JSON.stringify(record, null, 2)
    .split("\n")
    .map((line) => `  ${line}`)
    .join(eol)
    // Shards store ratings with one decimal ("5.0"); JSON.stringify drops it.
    .replace(/("rating": )(\d+)(,?)$/gm, "$1$2.0$3");

/** Character range of the record object whose slug matches, within the shard text. */
const findRecord = (text, slug) => {
  const at = text.indexOf(`"slug": ${JSON.stringify(slug)}`);
  if (at < 0) return null;
  const start = text.lastIndexOf("\n  {", at) + 1;
  const endBrace = text.indexOf("\n  }", at);
  if (start <= 0 || endBrace < 0) return null;
  return { start, end: endBrace + "\n  }".length };
};

const validate = (where, r) => {
  if (!r?.title) errors.push(`${where}: title required`);
  if (!slugPattern.test(r?.slug ?? "")) errors.push(`${where}: slug must be kebab-case`);
  if (r?.website) {
    const v = r.websiteValidation;
    if (!v) errors.push(`${where}: website without websiteValidation would be hidden`);
    else {
      if (v.url !== r.website) errors.push(`${where}: websiteValidation.url must equal website`);
      if (v.resolutionStatus !== "confirmed") errors.push(`${where}: website not confirmed`);
      if (!v.lastCheckedAt || !v.confirmationSources?.length) errors.push(`${where}: website confirmation needs a date and sources`);
      if (v.riskFlags?.length) errors.push(`${where}: website has risk flags ${v.riskFlags.join(",")}`);
    }
  }
  if (r?.verification && !r.verification.evidenceIds?.length) {
    errors.push(`${where}: verification needs evidenceIds or it is stripped`);
  }
};

const actions = [];
for (const [index, entry] of batch.listings.entries()) {
  const mode = entry.mode ?? "add";
  const where = `listings[${index}] ${entry.shard}/${entry.record?.slug ?? "?"}`;
  const data = await loadShard(entry.shard);
  if (!data) { errors.push(`${where}: shard does not exist`); continue; }
  const found = findRecord(data.text, entry.record.slug);

  if (mode === "patch") {
    if (!found) { errors.push(`${where}: patch target not found`); continue; }
    const current = JSON.parse(data.text.slice(found.start, found.end));
    const merged = { ...current, ...entry.record };
    validate(where, merged);
    actions.push({ where, shard: entry.shard, kind: "patch", record: merged });
  } else if (found) {
    console.log(`skip  ${where} (already present)`);
  } else {
    validate(where, entry.record);
    actions.push({ where, shard: entry.shard, kind: "add", record: entry.record });
  }
}

if (errors.length) {
  console.error(`Batch rejected (${errors.length}):\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}

for (const action of actions) {
  const data = shards.get(action.shard);
  const block = serialize(action.record, data.eol);
  if (action.kind === "patch") {
    const { start, end } = findRecord(data.text, action.record.slug);
    data.text = data.text.slice(0, start) + block + data.text.slice(end);
  } else {
    const close = data.text.lastIndexOf(`${data.eol}]`);
    data.text = `${data.text.slice(0, close)},${data.eol}${block}${data.text.slice(close)}`;
  }
  JSON.parse(data.text); // the shard must still be valid JSON
  data.changed = true;
  console.log(`${action.kind.padEnd(5)} ${action.where}`);
}

for (const data of shards.values()) {
  if (data?.changed && !dry) await writeFile(data.file, data.text, "utf8");
}
console.log(`${dry ? "[dry] " : ""}${actions.length} change(s) from ${batch.batch}`);
