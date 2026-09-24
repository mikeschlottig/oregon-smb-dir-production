// Before/after diff of what a change did to every page: the live site (baseline = what master
// deployed) against the local build in dist/. Per page it compares the fields that break
// silently: <title>, H1s, canonical, robots, the visible breadcrumb trail, every JSON-LD block,
// internal links, and Google Maps links. Nothing here judges a page — CHECKLIST.md does that
// (verify-site.mjs). This answers "what else moved?".
//
//   node scripts/compare-builds.mjs [--site https://oregonsmbdirectory.com] [--dist dist]
//        [--expect maps-links] [--expect jsonld:<route-prefix>] …
// Exit 1 if any page differs in a field not named by --expect. Report:
//   reports/compare-builds-<date>.json
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const expects = args.flatMap((a, i) => (a === "--expect" ? [args[i + 1]] : []));
const site = opt("--site", "https://oregonsmbdirectory.com");
const dist = path.resolve(opt("--dist", "dist"));
const UA = "oregonsmbdirectory-compare-builds/1.0";

const strip = (s) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;|&#x27;/g, "'").replace(/\s+/g, " ").trim();
const decode = (s) => s.replace(/&amp;|&#38;/g, "&").replace(/&quot;|&#34;/g, '"');
const sortKeys = (v) => (Array.isArray(v) ? v.map(sortKeys) : v && typeof v === "object"
  ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v);

const facts = (html) => {
  const hrefs = [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)].map((m) => decode(m[1]));
  const crumbNav = html.match(/<nav\b[^>]*data-breadcrumb[^>]*>([\s\S]*?)<\/nav>/i)?.[1] ?? "";
  const crumbs = [...crumbNav.matchAll(/<[^>]*data-crumb[^>]*>([\s\S]*?)<\/(?:a|span|li)>/gi)].map((m) => strip(m[1]));
  const jsonld = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => {
    try { return JSON.stringify(sortKeys(JSON.parse(m[1]))); } catch { return "UNPARSEABLE"; }
  });
  return {
    title: strip(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? ""),
    h1: [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => strip(m[1])),
    canonical: html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1] ?? null,
    robots: html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)/i)?.[1] ?? null,
    breadcrumb: crumbs,
    jsonld: jsonld.sort(),
    internal_links: [...new Set(hrefs.filter((h) => h.startsWith("/") || h.startsWith(site)))].sort(),
    maps_links: [...new Set(hrefs.filter((h) => /google\.[a-z.]+\/maps/.test(h)))].sort(),
    other_external: [...new Set(hrefs.filter((h) => /^https?:/.test(h) && !h.startsWith(site) && !/google\.[a-z.]+\/maps/.test(h)))].sort(),
  };
};

const sitemap = async () => {
  const get = async (u) => (await fetch(u, { headers: { "user-agent": UA } })).text();
  const locs = (s) => [...s.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  const out = [];
  for (const sm of locs(await get(`${site}/sitemap-index.xml`))) out.push(...locs(await get(sm)));
  return [...new Set(out)];
};

const urls = await sitemap();
const results = { same: 0, differs: [], missing_in_dist: [], fetch_failed: [] };
const byField = {};
let next = 0;
const worker = async () => {
  while (next < urls.length) {
    const u = urls[next++];
    const route = new URL(u).pathname;
    const file = path.join(dist, route, route.endsWith("/") ? "index.html" : "");
    try { await access(file); } catch { results.missing_in_dist.push(route); continue; }
    let live;
    try {
      const r = await fetch(u, { headers: { "user-agent": UA }, redirect: "manual" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      live = facts(await r.text());
    } catch (e) { results.fetch_failed.push(`${route} ${e.message}`); continue; }
    const local = facts(await readFile(file, "utf8"));
    const changed = Object.keys(live).filter((k) => JSON.stringify(live[k]) !== JSON.stringify(local[k]));
    if (!changed.length) { results.same++; continue; }
    const d = { route, changed: {} };
    for (const k of changed) {
      const b = [].concat(live[k]), a = [].concat(local[k]);
      d.changed[k] = { removed: b.filter((x) => !a.includes(x)).slice(0, 5), added: a.filter((x) => !b.includes(x)).slice(0, 5) };
      (byField[k] ??= []).push(route);
    }
    results.differs.push(d);
  }
};
await Promise.all(Array.from({ length: 8 }, worker));

// Expected changes: "maps-links" (the Maps link format), "jsonld:<prefix>", "<field>:<prefix>".
const isExpected = (field, route) => expects.some((e) => {
  const [f, prefix] = e.split(":");
  if (f === "maps-links") return field === "maps_links";
  return f === field && (!prefix || route.startsWith(prefix));
});
const unexpected = results.differs.filter((d) => Object.keys(d.changed).some((k) => !isExpected(k, d.route)));

const date = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
await mkdir("reports", { recursive: true });
const out = `reports/compare-builds-${date}.json`;
await writeFile(out, JSON.stringify({ site, dist, expects, pages: urls.length, ...results, byField: Object.fromEntries(Object.entries(byField).map(([k, v]) => [k, v.length])), unexpected }, null, 1));

console.log(`${urls.length} sitemap pages · identical ${results.same} · changed ${results.differs.length} · missing in dist ${results.missing_in_dist.length} · fetch failed ${results.fetch_failed.length}`);
for (const [k, v] of Object.entries(byField)) console.log(`  ${k.padEnd(15)} ${String(v.length).padStart(6)} pages${expects.some((e) => e.split(":")[0] === k || (e === "maps-links" && k === "maps_links")) ? "  (expected field)" : ""}`);
console.log(`UNEXPECTED changes on ${unexpected.length} pages`);
for (const d of unexpected.slice(0, 8)) {
  for (const [k, v] of Object.entries(d.changed)) if (!isExpected(k, d.route)) console.log(`  ${d.route}  ${k}: -${JSON.stringify(v.removed).slice(0, 140)} +${JSON.stringify(v.added).slice(0, 140)}`);
}
console.log(`wrote ${out}`);
process.exit(unexpected.length ? 1 : 0);
