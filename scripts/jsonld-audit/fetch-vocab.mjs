// Pins the official schema.org vocabulary next to the audit so every run validates against
// the same release, offline. Re-run to move to a newer release, and commit both files.
//
//   node scripts/jsonld-audit/fetch-vocab.mjs
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const VOCAB_URL = "https://schema.org/version/latest/schemaorg-current-https.jsonld";
const RELEASES_URL = "https://schema.org/docs/releases.html";

const res = await fetch(VOCAB_URL);
if (!res.ok) throw new Error(`${VOCAB_URL} → HTTP ${res.status}`);
const text = await res.text();
const graph = JSON.parse(text)["@graph"];
if (!Array.isArray(graph) || graph.length < 1000) {
  throw new Error(`vocabulary looks wrong: @graph has ${graph?.length ?? 0} nodes`);
}

const releases = await (await fetch(RELEASES_URL)).text();
const version = releases.match(/\bV(\d+\.\d+)\b/)?.[1] ?? "unknown";

await mkdir(path.join(here, "vocab"), { recursive: true });
await writeFile(path.join(here, "vocab", "schemaorg-current-https.jsonld"), text);
await writeFile(
  path.join(here, "vocab", "VERSION"),
  `schema.org ${version}\nfetched ${new Date().toISOString()}\nsource ${VOCAB_URL}\n`,
);
const count = (t) => graph.filter((n) => n["@type"] === t).length;
console.log(
  `schema.org ${version}: ${graph.length} nodes, ${count("rdfs:Class")} classes, ` +
    `${count("rdf:Property")} properties, ${text.length} bytes`,
);
