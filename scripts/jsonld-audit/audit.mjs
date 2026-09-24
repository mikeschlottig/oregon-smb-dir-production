// Audits every JSON-LD block in dist/ against rubric.mjs. See rubric.mjs for the layers.
//
//   node scripts/jsonld-audit/audit.mjs --site https://oregonsmbdirectory.com   the live site (sitemap)
//   node scripts/jsonld-audit/audit.mjs                  the local build in dist/
//   node scripts/jsonld-audit/audit.mjs --strict         also exit 1 on any ERROR
//   node scripts/jsonld-audit/audit.mjs --route /blog/   only paths starting with /blog/
//   node scripts/jsonld-audit/audit.mjs --self-test      prove the rubric: every rule fires
//                                                        on fixtures/, perfect.html is PERFECT
//
// Writes reports/jsonld-audit-<date>.json (every page, every issue) and
// reports/jsonld-audit-<date>.md (per page type, per rule, the perfect pages).
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Validator from "@adobe/structured-data-validator";
import * as vocab from "./vocab.mjs";
import { PAGE_TYPES, GOOGLE_RULES, SITE, SITE_RULES, bindVocab } from "./rubric.mjs";
import { validateHtml, VALIDATOR } from "./schemaorg-validator.mjs";
import { createHash } from "node:crypto";

bindVocab(vocab);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const ADOBE_VERSION = JSON.parse(readFileSync(path.join(root, "node_modules/@adobe/structured-data-validator/package.json"), "utf8")).version;

// ─── extraction ─────────────────────────────────────────────────────────────────────────
const typesOf = (node) => [].concat(node?.["@type"] ?? []).map((t) => String(t).replace(/^(schema:|https?:\/\/schema\.org\/)/, ""));

export const extract = (html) => {
  const blocks = [];
  const errors = [];
  for (const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      blocks.push(JSON.parse(m[1]));
    } catch (e) {
      errors.push(e.message);
    }
  }
  // Roots: a top-level object, each member of a top-level array, each member of @graph.
  const roots = [];
  for (const b of blocks) {
    for (const item of [].concat(b)) {
      if (item && Array.isArray(item["@graph"])) {
        for (const g of item["@graph"]) roots.push({ node: g, context: item["@context"] ?? g["@context"] });
      } else if (item && typeof item === "object") {
        roots.push({ node: item, context: item["@context"] });
      }
    }
  }
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1]
    ?? html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)?.[1] ?? null;
  return { roots, errors, canonical };
};

// ─── the layers ─────────────────────────────────────────────────────────────────────────
const issue = (rule, severity, where, message, extra = {}) => ({ rule, severity, path: where, message, ...extra });

const walk = (node, visit, trail = [], typeTrail = []) => {
  if (Array.isArray(node)) return node.forEach((n, i) => walk(n, visit, [...trail, i], typeTrail));
  if (!node || typeof node !== "object") return;
  const types = typesOf(node);
  visit(node, { path: trail, types, ancestors: typeTrail, depth: trail.filter((p) => typeof p === "string").length });
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith("@")) continue;
    walk(v, visit, [...trail, k], types.length ? [...typeTrail, ...types] : typeTrail);
  }
};
const fmtPath = (p) => p.reduce((s, x) => (typeof x === "number" ? `${s}[${x}]` : s ? `${s}.${x}` : x), "") || "(root)";

const googleLayer = (rootNode, rootIdx, page, out) => {
  walk(rootNode, (node, ctx) => {
    if (!ctx.types.length) return;
    const isRoot = ctx.path.length === 0;
    for (const rule of GOOGLE_RULES) {
      if (!vocab.anySubtypeOf(ctx.types.filter(vocab.isType), rule.appliesTo)) continue;
      if ((rule.where === "root" && !isRoot) || (rule.where === "nested" && isRoot)) continue;
      const res = rule.check(node, { ...ctx, page });
      for (const msg of [].concat(res ?? []).filter(Boolean)) {
        out.push(issue(rule.id, rule.severity, `#${rootIdx} ${fmtPath(ctx.path)}`, msg));
      }
    }
  });
};

const ADOBE_RULE = (i) => `GOOGLE_${(i.path?.at(-1)?.type ?? i.rootType ?? "ITEM").toString().toUpperCase()}_${i.severity}`;
const adobeLayer = async (roots, out) => {
  const byType = {};
  for (const { node } of roots) {
    const t = typesOf(node)[0] ?? "Thing";
    (byType[t] ??= []).push(structuredClone(node));
  }
  const issues = await new Validator().validate({ jsonld: byType });
  for (const i of issues) {
    // Adobe reports "Missing field (optional)" as WARNING for fields Google marks optional;
    // bestRating/worstRating default to 5/1 and Google shows no warning for them.
    if (/"(bestRating|worstRating)" \(optional\)/.test(i.issueMessage)) continue;
    const where = (i.path ?? []).map((p) => `${p.type ?? ""}${p.property ? `.${p.property}` : ""}${p.index != null ? `[${p.index}]` : ""}`).join(" > ");
    out.push(issue(ADOBE_RULE(i), i.severity === "ERROR" ? "ERROR" : "WARNING", where, i.issueMessage, { via: "adobe" }));
  }
};

const siteLayer = (roots, page, out) => {
  const defined = new Set();
  const refs = [];
  roots.forEach(({ node, context }, idx) => {
    if (context && !/^https?:\/\/schema\.org\/?$/.test(String(context))) {
      out.push(issue("SITE_CONTEXT", "WARNING", `#${idx}`, `@context "${context}" is not https://schema.org`));
    } else if (context && /^http:/.test(String(context))) {
      out.push(issue("SITE_CONTEXT", "INFO", `#${idx}`, "@context uses http://schema.org"));
    }
    walk(node, (n, ctx) => {
      const where = `#${idx} ${fmtPath(ctx.path)}`;
      if (n["@id"]) {
        const only = Object.keys(n).length === 1;
        if (only) refs.push({ id: n["@id"], where });
        else defined.add(n["@id"]);
        if (!SITE_RULES.idIri.test(n["@id"])) out.push(issue("SITE_ID_NOT_IRI", "WARNING", where, `@id "${n["@id"]}" is not an absolute IRI`));
      }
      if (typeof n.telephone === "string" && !SITE_RULES.telephone.test(n.telephone.trim())) {
        out.push(issue("SITE_TELEPHONE_FORMAT", "WARNING", where, `telephone "${n.telephone}" is not a dialable format`));
      }
      for (const k of ["url", "item", "mainEntityOfPage", "logo", "image", "sameAs"]) {
        for (const v of [].concat(n[k] ?? [])) {
          if (typeof v === "string" && v.startsWith("/")) out.push(issue("SITE_RELATIVE_URL", "WARNING", where, `${k} "${v}" is relative`));
        }
      }
      if (ctx.path.length === 0 && vocab.anySubtypeOf(ctx.types.filter(vocab.isType), "LocalBusiness") && !n["@id"]) {
        out.push(issue("SITE_ENTITY_ID", "INFO", where, "LocalBusiness has no @id to join it across pages"));
      }
    });
  });
  for (const r of refs) {
    if (!defined.has(r.id) && !/^https?:\/\//.test(r.id)) {
      out.push(issue("SITE_DANGLING_REF", "WARNING", r.where, `@id reference "${r.id}" resolves to nothing on this page`));
    }
  }
};

const pageTypeLayer = (roots, page, pt, out) => {
  const rootTypes = roots.map(({ node }) => typesOf(node).filter(vocab.isType));
  const has = (t) => rootTypes.some((ts) => vocab.anySubtypeOf(ts, t));
  if (!pt) {
    out.push(issue("PAGE_UNCLASSIFIED", "WARNING", "(page)", `no page type in rubric.mjs matches ${page.route}`));
    return;
  }
  if (pt.noJsonLdExpected) return;
  if (!roots.length) out.push(issue("PAGE_NO_JSONLD", "ERROR", "(page)", "page has no JSON-LD"));
  for (const t of pt.required ?? []) if (!has(t)) out.push(issue("PAGE_REQUIRED_TYPE", "ERROR", "(page)", `${pt.id} page lacks a ${t}`));
  for (const t of pt.recommended ?? []) if (!has(t)) out.push(issue("PAGE_RECOMMENDED_TYPE", "WARNING", "(page)", `${pt.id} page has no ${t}`));
  if (pt.mainEntityOf && page.canonical) {
    const main = roots.find(({ node }) => vocab.anySubtypeOf(typesOf(node).filter(vocab.isType), pt.mainEntityOf))?.node;
    const url = main?.url ?? main?.["@id"];
    if (main && url && url !== page.canonical) {
      out.push(issue("PAGE_URL_CANONICAL", "WARNING", "(page)", `${pt.mainEntityOf}.url "${url}" ≠ canonical "${page.canonical}"`));
    }
  }
};

// ─── schema.org validity: the official validator (validator.schema.org), not our own ─────
// The home-grown vocabulary layer this replaces was stricter than schema.org itself (it
// rejected text where schema.org's data model accepts it). Pages are grouped by shape — the
// recursive union of their JSON-LD keys and @types — and one representative per shape is
// validated: same shape = same types and properties = same verdict. One request per second,
// cached by shape in reports/schemaorg-validator-cache.json.
// Shape = the set of key paths plus @type values across the page's JSON-LD. The validator
// judges types and properties, so pages with the same set get the same verdict. 24 on this
// site (2026-09-24). An earlier finer key over-split pages and, paced at 1 req/s, drew
// HTTP 429/405 from validator.schema.org.
const keyPaths = (v, acc = new Set(), pre = "") => {
  if (Array.isArray(v)) { v.forEach((x) => keyPaths(x, acc, pre)); return acc; }
  if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) {
    acc.add(pre + k + (k === "@type" ? "=" + [].concat(x).join("+") : ""));
    keyPaths(x, acc, pre + k + ".");
  }
  return acc;
};
const shapeKey = (roots) => createHash("sha1").update([...keyPaths(roots.map(({ node }) => node))].sort().join("|")).digest("hex").slice(0, 16);
const CACHE_PATH = path.join(root, "reports", "schemaorg-validator-cache.json");
let cache = null;
const loadCache = () => {
  if (cache) return cache;
  try { cache = JSON.parse(readFileSync(CACHE_PATH, "utf8")); } catch { cache = {}; }
  return cache;
};
const inflight = new Map();
let queue = Promise.resolve();
let validatorStopped = null;
export const validatorStats = { shapes: 0, calls: 0, cached: 0 };
const officialIssuesFor = (key, html, route) => {
  const c = loadCache();
  if (c[key]) { if (!inflight.has(key)) { inflight.set(key, Promise.resolve(c[key].issues)); validatorStats.shapes++; validatorStats.cached++; } return inflight.get(key); }
  if (!inflight.has(key)) {
    validatorStats.shapes++;
    const p = (queue = queue.then(async () => {
      if (validatorStopped) return [issue("SCHEMAORG_UNVERIFIED", "ERROR", "(validator.schema.org)", `not validated: ${validatorStopped}`)];
      validatorStats.calls++;
      let r;
      try {
        r = await validateHtml(html);
      } catch (e) {
        // Rate-limited or refused: stop calling for the rest of the run. Never retry into a 429.
        validatorStopped = e.message;
        return [issue("SCHEMAORG_UNVERIFIED", "ERROR", "(validator.schema.org)", `not validated: ${e.message}`)];
      }
      await new Promise((res) => setTimeout(res, 10000));
      const errs = [];
      const walk = (n) => { if (Array.isArray(n)) return n.forEach(walk); if (n && typeof n === "object") { if (Array.isArray(n.errors)) errs.push(...n.errors); Object.values(n).forEach(walk); } };
      walk(r.tripleGroups); if (Array.isArray(r.errors)) errs.push(...r.errors);
      const issues = [...new Map(errs.map((e) => [`${e.errorType}|${(e.args ?? []).join("|")}`, e])).values()].map((e) =>
        issue("SCHEMAORG_VALIDATOR", e.isSevere ? "ERROR" : "WARNING", "(validator.schema.org)", `${e.errorType}: ${(e.args ?? []).join(" · ")}`));
      if ((r.totalNumErrors ?? 0) + (r.totalNumWarnings ?? 0) > 0 && !issues.length) {
        issues.push(issue("SCHEMAORG_VALIDATOR", "ERROR", "(validator.schema.org)", `${r.totalNumErrors} errors / ${r.totalNumWarnings} warnings reported but none itemised`));
      }
      c[key] = { issues, representative: route, numObjects: r.numObjects, checkedAt: new Date().toISOString(), validator: VALIDATOR };
      await saveValidatorCache();
      return issues;
    }));
    inflight.set(key, p);
  }
  return inflight.get(key);
};
export const saveValidatorCache = async () => {
  if (!cache) return;
  await mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 1));
};

export const auditHtml = async (html, route) => {
  const { roots, errors, canonical } = extract(html);
  const page = { route, canonical };
  // A noindex page (redirect stub, empty list, 404) asks not to be indexed, so no page-type
  // requirement applies. Found live: /research/oregon-law-firm-ai-search-report-1/ is a
  // redirect stub, which the first dist/ run wrongly flagged PAGE_NO_JSONLD.
  const noindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
  const pt = noindex ? { id: "noindex", required: [], noJsonLdExpected: true } : PAGE_TYPES.find((p) => p.match.test(route)) ?? null;
  const issues = errors.map((e) => issue("JSONLD_PARSE", "ERROR", "(block)", e));
  pageTypeLayer(roots, page, pt, issues);
  roots.forEach(({ node }, i) => googleLayer(node, i, page, issues));
  if (roots.length && !errors.length) issues.push(...(await officialIssuesFor(shapeKey(roots), html, route)));
  if (roots.length) await adobeLayer(roots, issues);
  siteLayer(roots, page, issues);
  const errorsN = issues.filter((i) => i.severity === "ERROR").length;
  const warningsN = issues.filter((i) => i.severity === "WARNING").length;
  return {
    route,
    pageType: pt?.id ?? "unclassified",
    rootTypes: roots.map(({ node }) => typesOf(node).join("+")),
    status: errorsN ? "ERROR" : warningsN ? "WARNING" : "PERFECT",
    issues,
  };
};

// ─── self-test ──────────────────────────────────────────────────────────────────────────
const selfTest = async () => {
  const dir = path.join(here, "fixtures");
  const expect = JSON.parse(await readFile(path.join(dir, "expect.json"), "utf8"));
  let failed = 0;
  const fired = new Set();
  for (const [file, spec] of Object.entries(expect)) {
    const res = await auditHtml(await readFile(path.join(dir, file), "utf8"), spec.route);
    const got = new Set(res.issues.map((i) => i.rule));
    got.forEach((r) => fired.add(r));
    const problems = [];
    if (spec.status && res.status !== spec.status) problems.push(`status ${res.status}, expected ${spec.status}`);
    for (const r of spec.fires ?? []) if (!got.has(r)) problems.push(`rule ${r} did not fire`);
    for (const r of spec.silent ?? []) if (got.has(r)) problems.push(`rule ${r} fired but should not`);
    console.log(`${problems.length ? "FAIL" : "ok  "} ${file}${problems.length ? ` — ${problems.join("; ")}` : ""}`);
    if (problems.length) {
      failed++;
      for (const i of res.issues) console.log(`       ${i.severity.padEnd(7)} ${i.rule} ${i.path}: ${i.message}`);
    }
  }
  await saveValidatorCache();
  // Every rubric rule must be proven able to fire by some fixture.
  const unproven = GOOGLE_RULES.map((r) => r.id).filter((id) => !fired.has(id));
  if (unproven.length) { failed++; console.log(`FAIL rules never fired by any fixture: ${unproven.join(", ")}`); }
  console.log(failed ? `\nSELF-TEST FAILED (${failed})` : `\nSELF-TEST PASSED — ${Object.keys(expect).length} fixtures, all ${GOOGLE_RULES.length} Google rules proven to fire`);
  process.exit(failed ? 1 : 0);
};

// ─── site run ───────────────────────────────────────────────────────────────────────────
const collect = async (dir, base = dir, out = []) => {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!["pagefind", "_astro", "images"].includes(e.name)) await collect(p, base, out); }
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
};
const routeOf = (dist, file) => {
  const rel = "/" + path.relative(dist, file).split(path.sep).join("/");
  return rel.endsWith("/index.html") ? rel.slice(0, -"index.html".length) : rel;
};

// Live mode: every URL in the site's sitemap index, fetched over HTTPS, audited exactly as
// the built files are. Sitemaps list only indexable pages, so /404.html is not in this set.
const sitemapUrls = async (site) => {
  const xml = async (u) => {
    const r = await fetch(u, { headers: { "user-agent": UA } });
    if (!r.ok) throw new Error(`${u} → HTTP ${r.status}`);
    return r.text();
  };
  const locs = (s) => [...s.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  const index = await xml(new URL("/sitemap-index.xml", site).href);
  const urls = [];
  for (const sm of locs(index)) urls.push(...locs(await xml(sm)));
  return [...new Set(urls)];
};
const UA = "oregonsmbdirectory-jsonld-audit/1.0 (+https://oregonsmbdirectory.com/)";

const fetchPages = async (site, only, concurrency, onPage) => {
  const urls = (await sitemapUrls(site)).filter((u) => !only || new URL(u).pathname.startsWith(only));
  const failures = [];
  let next = 0;
  const worker = async () => {
    while (next < urls.length) {
      const u = urls[next++];
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const r = await fetch(u, { headers: { "user-agent": UA }, redirect: "manual" });
          if (r.status >= 300 && r.status < 400) { failures.push({ url: u, status: r.status }); break; }
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          await onPage(new URL(u).pathname, await r.text());
          break;
        } catch (e) {
          if (attempt === 3) failures.push({ url: u, error: String(e.message ?? e) });
          else await new Promise((res) => setTimeout(res, 500 * attempt));
        }
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return { total: urls.length, failures };
};

const run = async () => {
  const only = opt("--route");
  const site = opt("--site");
  const pages = [];
  let fetchReport = null;
  if (site) {
    const t0 = Date.now();
    fetchReport = await fetchPages(site, only, Number(opt("--concurrency") ?? 8), async (route, html) => {
      pages.push(await auditHtml(html, route));
    });
    pages.sort((a, b) => a.route.localeCompare(b.route));
    console.log(`fetched ${pages.length}/${fetchReport.total} sitemap URLs from ${site} in ${((Date.now() - t0) / 1000).toFixed(0)} s; ${fetchReport.failures.length} failed`);
    for (const f of fetchReport.failures.slice(0, 10)) console.log(`  FETCH FAIL ${f.url} ${f.status ?? f.error}`);
  } else {
    const dist = path.resolve(root, opt("--dist") ?? "dist");
    const files = (await collect(dist)).filter((f) => !only || routeOf(dist, f).startsWith(only)).sort();
    for (const f of files) pages.push(await auditHtml(await readFile(f, "utf8"), routeOf(dist, f)));
  }

  await saveValidatorCache();
  console.log(`validator.schema.org: ${validatorStats.shapes} distinct JSON-LD shapes, ${validatorStats.calls} validated now, ${validatorStats.cached} from cache${validatorStopped ? ` — STOPPED: ${validatorStopped}; unvalidated shapes are ERROR (SCHEMAORG_UNVERIFIED); re-run later, the cache resumes` : ""}`);

  // Aggregate.
  const byType = new Map();
  const byRule = new Map();
  for (const p of pages) {
    const t = byType.get(p.pageType) ?? { pages: 0, PERFECT: 0, WARNING: 0, ERROR: 0, rootTypes: new Map() };
    t.pages++; t[p.status]++;
    const key = p.rootTypes.slice().sort().join(", ");
    t.rootTypes.set(key, (t.rootTypes.get(key) ?? 0) + 1);
    byType.set(p.pageType, t);
    for (const i of p.issues) {
      const r = byRule.get(i.rule) ?? { rule: i.rule, severity: i.severity, count: 0, pages: new Set(), examples: [] };
      r.count++; r.pages.add(p.route);
      if (r.examples.length < 3 && !r.examples.some((e) => e.route === p.route)) r.examples.push({ route: p.route, path: i.path, message: i.message });
      byRule.set(i.rule, r);
    }
  }
  const ruleMeta = Object.fromEntries(GOOGLE_RULES.map((r) => [r.id, { source: r.source, quote: r.quote }]));
  const rules = [...byRule.values()]
    .map((r) => ({ ...r, pages: r.pages.size, ...(ruleMeta[r.rule] ?? {}) }))
    .sort((a, b) => ({ ERROR: 0, WARNING: 1, INFO: 2 })[a.severity] - ({ ERROR: 0, WARNING: 1, INFO: 2 })[b.severity] || b.pages - a.pages);
  const perfect = pages.filter((p) => p.status === "PERFECT").map((p) => p.route);
  const totals = { pages: pages.length, PERFECT: perfect.length, WARNING: pages.filter((p) => p.status === "WARNING").length, ERROR: pages.filter((p) => p.status === "ERROR").length };

  const date = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  const source = site ? `live ${site}` : `built files ${path.relative(root, path.resolve(root, opt("--dist") ?? "dist"))}/`;
  const tag = site ? "live" : "dist";
  const meta = { date, source, vocabulary: vocab.VOCAB_VERSION, adobeValidator: ADOBE_VERSION, site: SITE.origin, ratingsSource: SITE.ratingsSource, route: only ?? "all", fetch: fetchReport };
  await mkdir(path.join(root, "reports"), { recursive: true });
  const jsonPath = path.join("reports", `jsonld-audit-${tag}-${date}.json`);
  await writeFile(path.join(root, jsonPath), JSON.stringify({ meta, totals, pageTypes: Object.fromEntries([...byType].map(([k, v]) => [k, { ...v, rootTypes: Object.fromEntries(v.rootTypes) }])), rules, perfect, pages }, null, 1));

  const md = [];
  md.push(`# JSON-LD audit — ${date}`, "", `Source: **${source}**`, "");
  md.push(`${totals.pages} pages · **${totals.PERFECT} perfect** · ${totals.WARNING} warnings only · ${totals.ERROR} with errors`, "");
  md.push(`Vocabulary ${meta.vocabulary} · @adobe/structured-data-validator ${ADOBE_VERSION} · ratings source: ${SITE.ratingsSource} · rubric: scripts/jsonld-audit/rubric.mjs`, "");
  md.push("## By page type", "", "| page type | pages | perfect | warning | error | root types |", "|---|---:|---:|---:|---:|---|");
  for (const [k, v] of [...byType].sort((a, b) => b[1].pages - a[1].pages)) {
    const rt = [...v.rootTypes].sort((a, b) => b[1] - a[1]).map(([t, c]) => `${c}× ${t || "(none)"}`).join("; ");
    md.push(`| ${k} | ${v.pages} | ${v.PERFECT} | ${v.WARNING} | ${v.ERROR} | ${rt} |`);
  }
  md.push("", "## By rule", "", "| severity | rule | pages | issues | example | source |", "|---|---|---:|---:|---|---|");
  for (const r of rules) {
    const ex = r.examples[0];
    const src = r.source ? `[doc](${r.source})${r.quote ? ` — “${r.quote}”` : " (wording not quoted)"}` : r.rule.startsWith("VOCAB") ? "schema.org vocabulary" : r.rule.startsWith("GOOGLE_") ? "Adobe validator (Google rules)" : "rubric.mjs";
    md.push(`| ${r.severity} | ${r.rule} | ${r.pages} | ${r.count} | \`${ex.route}\` ${ex.path}: ${ex.message.replace(/\|/g, "\\|")} | ${src} |`);
  }
  md.push("", `## Perfect pages (${perfect.length})`, "");
  md.push(perfect.length ? perfect.map((r) => `- \`${r}\``).join("\n") : "_None._");
  const mdPath = path.join("reports", `jsonld-audit-${tag}-${date}.md`);
  await writeFile(path.join(root, mdPath), md.join("\n") + "\n");

  console.log(`${totals.pages} pages · PERFECT ${totals.PERFECT} · WARNING ${totals.WARNING} · ERROR ${totals.ERROR}`);
  for (const r of rules) console.log(`  ${r.severity.padEnd(7)} ${r.rule.padEnd(28)} pages ${String(r.pages).padStart(5)}  e.g. ${r.examples[0].message.slice(0, 90)}`);
  console.log(`wrote ${jsonPath}\nwrote ${mdPath}`);
  if (flag("--strict") && totals.ERROR) process.exit(1);
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await (flag("--self-test") ? selfTest() : run());
}
