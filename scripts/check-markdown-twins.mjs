#!/usr/bin/env node
/**
 * check-markdown-twins.mjs — every <link rel="alternate" type="text/markdown"> in dist/ points at a file that exists,
 * and every twin starts with a "# " title and a "> " summary (P20 E, 2026-11-21). Exits 1 on any failure.
 *
 *   node scripts/check-markdown-twins.mjs [dist]
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const DIST = process.argv[2] ?? "dist";
const ORIGIN = "https://oregonsmbdirectory.com";
const walk = (d) =>
  readdirSync(d).flatMap((n) => {
    const p = path.join(d, n);
    return statSync(p).isDirectory() ? (n === "_astro" || n === "pagefind" ? [] : walk(p)) : n.endsWith(".html") ? [p] : [];
  });

let pages = 0, linked = 0;
const missing = [], malformed = [], seen = new Set();
for (const f of walk(DIST)) {
  pages++;
  const m = readFileSync(f, "utf8").match(/<link rel="alternate" type="text\/markdown" href="([^"]+)"/);
  if (!m) continue;
  linked++;
  const rel = m[1].replace(ORIGIN, "");
  const file = path.join(DIST, decodeURIComponent(rel));
  if (!existsSync(file)) { missing.push(`${path.relative(DIST, f)} → ${rel}`); continue; }
  if (seen.has(file)) continue;
  seen.add(file);
  const head = readFileSync(file, "utf8").split("\n").filter(Boolean);
  if (!head[0]?.startsWith("# ") || !head[1]?.startsWith("> ")) malformed.push(rel);
}
const allMd = [];
const walkMd = (d) => readdirSync(d).forEach((n) => { const p = path.join(d, n); if (statSync(p).isDirectory()) { if (n !== "_astro" && n !== "pagefind") walkMd(p); } else if (n.endsWith(".md")) allMd.push(p); });
walkMd(DIST);
console.log(`markdown twins — ${pages} html pages, ${linked} link a twin, ${allMd.length} .md files, ${missing.length} missing, ${malformed.length} malformed`);
for (const x of missing.slice(0, 10)) console.log(`  MISSING ${x}`);
for (const x of malformed.slice(0, 10)) console.log(`  MALFORMED ${x}`);
process.exit(missing.length || malformed.length ? 1 : 0);
