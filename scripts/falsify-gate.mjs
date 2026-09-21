#!/usr/bin/env node
/**
 * Proves the gate can fail.
 *
 * Twice in this project a check reported PASS while blind: C16 passed having read zero
 * sitemap URLs, and C14 passed while 31,750 nested violations sat in the same pages it
 * had just read. A green result means nothing until the check has been shown to go red
 * on a defect it claims to catch.
 *
 * This injects one defect per check into a copy of dist/, runs the gate against the
 * copy, and asserts the expected check fired. Nothing touches the real dist/.
 *
 *   node scripts/falsify-gate.mjs
 *
 * Exits non-zero if any check failed to notice its own defect.
 */

import { cpSync, rmSync, readFileSync, writeFileSync, mkdtempSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

/** Find a built page matching a predicate, so the test does not hardcode slugs. */
function findPage(pred, limit = 40000) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (out.length >= limit) return;
      if (e.name === "pagefind" || e.name === "_astro") continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".html")) out.push(p);
    }
  };
  walk(DIST);
  return out.find(pred);
}

const cases = [
  {
    check: "C13",
    what: "a page with no <main> element",
    pick: () => findPage((p) => p.includes(join("city", "albany", "automotive")) && p.endsWith("index.html")),
    corrupt: (html) => html.replace(/<main[^>]*>/, "<div>").replace(/<\/main>/, "</div>"),
  },
  {
    check: "C14",
    what: "a nested aggregateRating with ratingValue 9",
    pick: () => findPage((p) => readFileSync(p, "utf8").includes('"aggregateRating"')),
    corrupt: (html) => html.replace(/("ratingValue":\s*)[\d.]+/, "$19"),
  },
  {
    check: "C08",
    what: "a visible breadcrumb label that disagrees with the JSON-LD",
    pick: () => findPage((p) => readFileSync(p, "utf8").includes("data-crumb")),
    corrupt: (html) => html.replace(/(<a data-crumb[^>]*>)[^<]+(<\/a>)/, "$1Wrong Label$2"),
  },
  {
    check: "C10",
    what: "an internal link to a page that does not exist",
    pick: () => findPage((p) => p.endsWith(join("city", "index.html"))),
    corrupt: (html) => html.replace(/href="\/city\//, 'href="/city-does-not-exist/'),
  },
  {
    check: "C09",
    what: "a canonical pointing at another page",
    pick: () => findPage((p) => p.endsWith(join("contact", "index.html"))),
    corrupt: (html) => html.replace(/<link rel="canonical" href="[^"]*"/, '<link rel="canonical" href="https://oregonsmbdirectory.com/somewhere-else/"'),
  },
  {
    check: "C17",
    what: "a listing page claiming the utility exemption",
    pick: () => findPage((p) => p.includes(join("city", "albany", "food-dining")) && p.endsWith("index.html")),
    corrupt: (html) => html.replace(/<body([^>]*)data-page-kind="content"/, '<body$1data-page-kind="utility"'),
  },
  {
    check: "C03",
    what: "a BreadcrumbList ListItem with no name",
    pick: () => findPage((p) => readFileSync(p, "utf8").includes("BreadcrumbList")),
    // The emitted JSON is pretty-printed, so the key sits on its own line. Drop the
    // `name` from the first ListItem inside the BreadcrumbList.
    corrupt: (html) => {
      const at = html.indexOf("BreadcrumbList");
      if (at === -1) return html;
      const head = html.slice(0, at);
      const tail = html.slice(at).replace(/^[\s\S]*?\n\s*"name": "[^"]*",\n/, (m) =>
        m.replace(/\n\s*"name": "[^"]*",\n/, "\n")
      );
      return head + tail;
    },
  },
  {
    check: "C16",
    what: "a sitemap URL that resolves to nothing",
    pick: () => join(DIST, "sitemap-0.xml"),
    corrupt: (xml) => xml.replace(/<loc>https:\/\/oregonsmbdirectory\.com\//, "<loc>https://oregonsmbdirectory.com/not-a-real-page/"),
    isSitemap: true,
  },
];

const results = [];
for (const c of cases) {
  const target = c.pick();
  if (!target) {
    results.push({ check: c.check, ok: false, note: "could not find a page to corrupt" });
    continue;
  }

  const tmp = mkdtempSync(join(tmpdir(), "falsify-"));
  const tmpDist = join(tmp, "dist");
  cpSync(DIST, tmpDist, { recursive: true });

  const rel = target.slice(DIST.length + 1);
  const copy = join(tmpDist, rel);
  const original = readFileSync(copy, "utf8");
  const mutated = c.corrupt(original);
  if (mutated === original) {
    results.push({ check: c.check, ok: false, note: "corruption did not change the file" });
    rmSync(tmp, { recursive: true, force: true });
    continue;
  }
  writeFileSync(copy, mutated);

  // Run the gate against the copy.
  let out = "";
  try {
    out = execFileSync(process.execPath, [join(ROOT, "scripts/verify-site.mjs"), "--report-only", "--dist", tmpDist, "--json", join(tmp, "r.json")], { encoding: "utf8" });
  } catch (e) {
    out = (e.stdout ?? "") + (e.stderr ?? "");
  }

  const report = JSON.parse(readFileSync(join(tmp, "r.json"), "utf8"));
  const fired = (report.failureCounts?.[c.check] ?? 0) > 0;
  results.push({ check: c.check, ok: fired, note: fired ? `caught (${report.failureCounts[c.check]})` : "DID NOT FIRE", what: c.what, page: rel });

  rmSync(tmp, { recursive: true, force: true });
}

let bad = 0;
console.log("\nfalsification — each check must go red on its own defect\n");
for (const r of results) {
  const mark = r.ok ? "PASS" : "FAIL";
  if (!r.ok) bad++;
  console.log(`  ${mark}  ${r.check}  ${r.what ?? ""}\n        ${r.note}`);
}
console.log(`\n${results.length - bad}/${results.length} checks proved falsifiable\n`);
process.exit(bad === 0 ? 0 : 1);
