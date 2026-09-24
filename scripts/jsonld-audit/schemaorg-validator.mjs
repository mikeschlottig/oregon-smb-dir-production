// Client for the official schema.org validator (https://validator.schema.org, operated by
// Google). The authority on schema.org types, properties and values. Used instead of any
// home-grown vocabulary check.
//
//   node scripts/jsonld-audit/schemaorg-validator.mjs <file.html | url>    one page, prints the verdict
export const VALIDATOR = "https://validator.schema.org/validate";

/** POST a page's HTML; returns the validator's parsed JSON (it prefixes `)]}'`). */
export const validateHtml = async (html) => {
  const res = await fetch(VALIDATOR, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams({ html }).toString(),
  });
  if (!res.ok) throw new Error(`validator HTTP ${res.status}`);
  const text = await res.text();
  return JSON.parse(text.replace(/^\)\]\}'\s*/, ""));
};

if (process.argv[1]?.endsWith("schemaorg-validator.mjs")) {
  const { readFile } = await import("node:fs/promises");
  const src = process.argv[2];
  const html = src.startsWith("http") ? await (await fetch(src)).text() : await readFile(src, "utf8");
  const r = await validateHtml(html);
  const triples = r.tripleGroups ?? [];
  console.log(JSON.stringify({ keys: Object.keys(r), numObjects: r.numObjects, totalNumErrors: r.totalNumErrors, totalNumWarnings: r.totalNumWarnings,
    types: triples.map((g) => g.type), sampleError: (r.errors ?? [])[0] ?? null }, null, 1));
}
