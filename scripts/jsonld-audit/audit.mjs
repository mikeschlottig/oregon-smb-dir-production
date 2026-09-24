// Audits every JSON-LD block in dist/ against rubric.mjs. See rubric.mjs for the layers.
//
//   node scripts/jsonld-audit/audit.mjs                  audit dist/, write reports
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

const vocabularyLayer = (rootNode, rootIdx, out) => {
  walk(rootNode, (node, ctx) => {
    const where = `#${rootIdx} ${fmtPath(ctx.path)}`;
    if (!ctx.types.length) return; // untyped values are reported by checkRange on their property
    for (const t of ctx.types) {
      if (!vocab.isType(t)) { out.push(issue("VOCAB_UNKNOWN_TYPE", "ERROR", where, `"${t}" is not a schema.org type`)); continue; }
      const info = vocab.typeInfo(t);
      if (info.supersededBy) out.push(issue("VOCAB_DEPRECATED_TYPE", "WARNING", where, `"${t}" is superseded by "${info.supersededBy}"`));
      if (info.pending) out.push(issue("VOCAB_PENDING_TYPE", "INFO", where, `"${t}" is in schema.org's pending area`));
    }
    const known = ctx.types.filter(vocab.isType);
    if (!known.length) return;
    for (const [prop, value] of Object.entries(node)) {
      if (prop.startsWith("@")) continue;
      const p = vocab.propInfo(prop);
      if (!p) {
        // SearchAction's "query-input" is the Actions extension, not a vocabulary term.
        if (!/-(input|output)$/.test(prop)) out.push(issue("VOCAB_UNKNOWN_PROPERTY", "ERROR", where, `"${prop}" is not a schema.org property`));
        continue;
      }
      if (!known.some((t) => vocab.propertyAllowed(t, prop))) {
        out.push(issue("VOCAB_PROPERTY_DOMAIN", "WARNING", where, `"${prop}" is not defined for ${known.join("+")}`));
      }
      if (p.supersededBy) out.push(issue("VOCAB_DEPRECATED_PROPERTY", "WARNING", where, `"${prop}" is superseded by "${p.supersededBy}"`));
      for (const v of [].concat(value)) {
        const bad = vocab.checkRange(prop, v);
        if (bad) out.push(issue("VOCAB_RANGE", bad.severity, where, bad.message));
      }
    }
  });
};

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

export const auditHtml = async (html, route) => {
  const { roots, errors, canonical } = extract(html);
  const page = { route, canonical };
  const pt = PAGE_TYPES.find((p) => p.match.test(route)) ?? null;
  const issues = errors.map((e) => issue("JSONLD_PARSE", "ERROR", "(block)", e));
  pageTypeLayer(roots, page, pt, issues);
  roots.forEach(({ node }, i) => {
    vocabularyLayer(node, i, issues);
    googleLayer(node, i, page, issues);
  });
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

const run = async () => {
  const dist = path.resolve(root, opt("--dist") ?? "dist");
  const only = opt("--route");
  const files = (await collect(dist)).filter((f) => !only || routeOf(dist, f).startsWith(only)).sort();
  const pages = [];
  for (const f of files) pages.push(await auditHtml(await readFile(f, "utf8"), routeOf(dist, f)));

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
  const meta = { date, vocabulary: vocab.VOCAB_VERSION, adobeValidator: ADOBE_VERSION, site: SITE.origin, ratingsSource: SITE.ratingsSource, route: only ?? "all" };
  await mkdir(path.join(root, "reports"), { recursive: true });
  const jsonPath = path.join("reports", `jsonld-audit-${date}.json`);
  await writeFile(path.join(root, jsonPath), JSON.stringify({ meta, totals, pageTypes: Object.fromEntries([...byType].map(([k, v]) => [k, { ...v, rootTypes: Object.fromEntries(v.rootTypes) }])), rules, perfect, pages }, null, 1));

  const md = [];
  md.push(`# JSON-LD audit — ${date}`, "");
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
  const mdPath = path.join("reports", `jsonld-audit-${date}.md`);
  await writeFile(path.join(root, mdPath), md.join("\n") + "\n");

  console.log(`${totals.pages} pages · PERFECT ${totals.PERFECT} · WARNING ${totals.WARNING} · ERROR ${totals.ERROR}`);
  for (const r of rules) console.log(`  ${r.severity.padEnd(7)} ${r.rule.padEnd(28)} pages ${String(r.pages).padStart(5)}  e.g. ${r.examples[0].message.slice(0, 90)}`);
  console.log(`wrote ${jsonPath}\nwrote ${mdPath}`);
  if (flag("--strict") && totals.ERROR) process.exit(1);
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await (flag("--self-test") ? selfTest() : run());
}
