#!/usr/bin/env node
/**
 * verify-site.mjs — deterministic gate over the built site.
 *
 * Every check is binary and every failure names the file and the exact value that
 * failed. Nothing here samples: it reads every page in dist/.
 *
 * Usage:
 *   node scripts/verify-site.mjs                 # enforce; exit 1 on any failure
 *   node scripts/verify-site.mjs --report-only   # inventory only; always exit 0
 *   node scripts/verify-site.mjs --json <path>   # write the full machine report
 *
 * Checks (ids are stable; CHECKLIST.md references them):
 *   C01 JSONLD_PARSE        every ld+json block is valid JSON
 *   C02 BREADCRUMB_PRESENT  every indexable page carries exactly one BreadcrumbList
 *   C03 BREADCRUMB_SHAPE    Google's required ListItem shape
 *   C04 BREADCRUMB_POSITION positions are 1..n, contiguous, in document order
 *   C05 BREADCRUMB_HOME     first crumb is Home and points at the site root
 *   C06 BREADCRUMB_TERMINAL last crumb names the current page and carries no link
 *   C07 BREADCRUMB_URLS     every crumb URL is absolute, on-origin, and resolves
 *   C08 BREADCRUMB_MATCH    visible trail equals the JSON-LD trail, in order
 *   C09 CANONICAL           exactly one canonical, absolute, equal to the page URL
 *   C10 LINKS               every internal href resolves to a built page
 *   C11 FAQ_SHAPE           FAQPage mainEntity is well formed and non-empty
 *   C12 FAQ_UNIQUE          no two pages ship an identical FAQ answer set
 *   C13 THIN                main-content word count meets the floor
 *   C14 SCHEMA_REQUIRED     required fields present per emitted @type
 *   C15 TRAILING_SLASH      internal links use the canonical trailing-slash form
 *   C16 SITEMAP             sitemap lists only resolvable, indexable URLs
 *   C17 EXEMPTION_SCOPE     only approved paths may declare themselves exempt
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, relative, dirname, posix } from "node:path";
import { fileURLToPath } from "node:url";
import * as parse5 from "parse5";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const ORIGIN = "https://oregonsmbdirectory.com";

const args = process.argv.slice(2);
const REPORT_ONLY = args.includes("--report-only");
const JSON_OUT = (() => {
  const i = args.indexOf("--json");
  return i >= 0 && args[i + 1] ? args[i + 1] : join(ROOT, "reports", "site-verify.json");
})();
const MIN_WORDS = (() => {
  const i = args.indexOf("--min-words");
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : 150;
})();

/* ------------------------------------------------------------------ parse5 */

const childrenOf = (node) => node.childNodes ?? node.content?.childNodes ?? [];
const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;

function* walk(node) {
  yield node;
  for (const child of childrenOf(node)) yield* walk(child);
}

function textOf(node) {
  let out = "";
  for (const n of walk(node)) {
    if (n.nodeName === "#text") out += n.value;
    else if (n.tagName === "script" || n.tagName === "style") out = out; // skipped below
  }
  return out;
}

function textOfVisible(node) {
  let out = "";
  const skip = new Set(["script", "style", "noscript", "template"]);
  const rec = (n) => {
    if (n.nodeName === "#text") {
      out += n.value;
      return;
    }
    if (skip.has(n.tagName)) return;
    for (const c of childrenOf(n)) rec(c);
  };
  rec(node);
  return out;
}

const wordCount = (s) => (s.replace(/\s+/g, " ").trim().match(/\S+/g) ?? []).length;

const findTag = (doc, tag) => {
  for (const n of walk(doc)) if (n.tagName === tag) return n;
  return null;
};
const findHead = (doc) => findTag(doc, "head");
const findBody = (doc) => findTag(doc, "body");

/**
 * Meta lookups read <head> through the parsed tree rather than regexing the whole
 * document: a string that merely looks like a meta tag, anywhere in the body or in a
 * <template>, must not be able to grant a page an exemption.
 */
const hasMeta = (head, attrName, value) => {
  if (!head) return false;
  for (const n of childrenOf(head)) {
    if (n.tagName !== "meta") continue;
    if ((attr(n, attrName) ?? "").toLowerCase() === value) return true;
  }
  return false;
};
const metaContent = (head, name) => {
  if (!head) return null;
  for (const n of childrenOf(head)) {
    if (n.tagName !== "meta") continue;
    if ((attr(n, "name") ?? "").toLowerCase() === name) return attr(n, "content") ?? null;
  }
  return null;
};

/**
 * Paths permitted to declare themselves utility pages and so sit below the content
 * floor. The page must still make the declaration — this set only bounds who may.
 */
const UTILITY_PATHS = new Set(["/contact/", "/accessibility/", "/editorial-policy/"]);

/* -------------------------------------------------------------- dist walk */

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "pagefind" || entry.name === "_astro") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

/** dist/city/albany/index.html -> /city/albany/ ; dist/404.html -> /404.html */
function urlPathFor(file) {
  const rel = relative(DIST, file).split(/[\\/]/).join("/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return "/" + rel.slice(0, -"index.html".length);
  return "/" + rel;
}

/** Does an internal URL path resolve to something the build emitted? */
function resolves(pathname, fileSet) {
  const clean = pathname.split("#")[0].split("?")[0];
  if (clean === "" || clean === "/") return fileSet.has("index.html");
  const p = clean.replace(/^\//, "");
  const candidates = [
    p.endsWith("/") ? p + "index.html" : null,
    p.endsWith("/") ? null : p + "/index.html",
    p.endsWith(".html") ? p : null,
    p.endsWith("/") ? null : p + ".html",
    p, // a real asset: /og-default.jpg, /sitemap-index.xml
  ].filter(Boolean);
  return candidates.some((c) => fileSet.has(c));
}

/* ------------------------------------------------------------ the checks */

const failures = [];
const fail = (check, file, detail, value) =>
  failures.push({ check, page: urlPathFor(file), detail, value });

function checkBreadcrumb(file, bc, doc, fileSet, pageUrl) {
  const items = bc.itemListElement;
  if (!Array.isArray(items) || items.length === 0) {
    fail("C03", file, "BreadcrumbList.itemListElement is empty or not an array");
    return null;
  }

  const names = [];
  items.forEach((li, idx) => {
    const n = idx + 1;
    if (li["@type"] !== "ListItem") fail("C03", file, `item ${n} @type is not ListItem`, li["@type"]);
    if (li.position !== n) fail("C04", file, `item ${n} position mismatch`, li.position);

    // Google: `name` on the ListItem; `item` a URL string (or object with @id).
    // The final crumb is the current page and must not carry `item`.
    const name = typeof li.name === "string" ? li.name : undefined;
    if (!name || !name.trim()) fail("C03", file, `item ${n} has no name`, li.name);
    names.push(name ?? "");

    const isLast = idx === items.length - 1;
    if (isLast) {
      // Google: the final crumb's `item` is optional. If present it must be the
      // current page's canonical URL — anything else mislabels the trail.
      if ("item" in li) {
        const url = typeof li.item === "string" ? li.item : li.item?.["@id"];
        if (url !== pageUrl) fail("C06", file, "final crumb item is not the page URL", String(url));
      }
    } else {
      const url = typeof li.item === "string" ? li.item : li.item?.["@id"];
      if (typeof url !== "string" || !url) {
        fail("C03", file, `item ${n} item is not a URL string or {@id}`, JSON.stringify(li.item));
      } else {
        if (!url.startsWith(ORIGIN + "/") && url !== ORIGIN + "/") {
          fail("C07", file, `item ${n} URL is not absolute on-origin`, url);
        } else {
          const path = url.slice(ORIGIN.length) || "/";
          if (!resolves(path, fileSet)) fail("C07", file, `item ${n} URL 404s`, url);
          if (path !== "/" && !path.endsWith("/")) {
            fail("C07", file, `item ${n} URL lacks the canonical trailing slash`, url);
          }
        }
      }
    }
  });

  if (names[0] !== "Home") fail("C05", file, "first crumb is not Home", names[0]);
  const first = items[0];
  const firstUrl = typeof first.item === "string" ? first.item : first.item?.["@id"];
  if (items.length > 1 && firstUrl !== ORIGIN + "/") {
    fail("C05", file, "Home crumb does not point at the site root", firstUrl);
  }

  return names;
}

function visibleTrail(doc) {
  for (const n of walk(doc)) {
    if (n.tagName !== "nav") continue;
    const isCrumb =
      attr(n, "data-breadcrumb") !== undefined ||
      (attr(n, "aria-label") ?? "").toLowerCase() === "breadcrumb";
    if (!isCrumb) continue;
    const crumbs = [];
    for (const c of walk(n)) {
      if (attr(c, "data-crumb") === undefined) continue;
      crumbs.push({
        label: textOfVisible(c).replace(/\s+/g, " ").trim(),
        href: attr(c, "href") ?? null,
      });
    }
    return crumbs;
  }
  return null;
}

/* ------------------------------------------------------------------ main */

const files = await htmlFiles(DIST);
const fileSet = new Set(
  (await htmlFiles(DIST)).map((f) => relative(DIST, f).split(/[\\/]/).join("/"))
);
// assets that are not HTML still need to resolve for C10
for (const extra of ["og-default.jpg", "favicon.ico", "sitemap-index.xml", "site.webmanifest"]) {
  if (existsSync(join(DIST, extra))) fileSet.add(extra);
}

const faqGroups = new Map(); // whole-set hash -> [pages]
const faqAnswers = new Map(); // single answer text -> [pages]
const noindexPages = new Set();
const wordCounts = [];
const typeCounts = new Map();
let ldBlocks = 0;

for (const file of files) {
  const html = readFileSync(file, "utf8");
  const doc = parse5.parse(html);
  const pagePath = urlPathFor(file);
  const pageUrl = ORIGIN + pagePath;
  const isErrorPage = pagePath === "/404.html";
  // Astro emits a meta-refresh stub for each configured redirect. It carries the
  // target's canonical by design and is not a page of its own.
  const head = findHead(doc);
  const isRedirectStub = hasMeta(head, "http-equiv", "refresh");
  // Home carries WebSite + Organization; a one-item breadcrumb says nothing.
  const breadcrumbExempt = isErrorPage || isRedirectStub || pagePath === "/";
  // A page withheld from the index is not competing for a ranking, so the content
  // floor does not govern it. Utility pages (contact, policy, accessibility) are
  // indexable and deliberately short; they declare themselves in the layout.
  const isNoindex = (metaContent(head, "robots") ?? "").toLowerCase().includes("noindex");
  if (isNoindex) noindexPages.add(pagePath);
  // F9 counter-proposal: the page declares its kind AND the path must be one
  // allowed to make that declaration. A markup-only rule lets a template bug
  // exempt any page; a path-only rule cannot see what the page actually is.
  const declaresUtility = attr(findBody(doc), "data-page-kind") === "utility";
  const isUtility = declaresUtility && UTILITY_PATHS.has(pagePath);
  if (declaresUtility && !isUtility) {
    fail("C17", file, "page declares data-page-kind=\"utility\" but is not an approved utility path");
  }

  // --- collect ld+json
  const schemas = [];
  for (const n of walk(doc)) {
    if (n.tagName !== "script") continue;
    if ((attr(n, "type") ?? "") !== "application/ld+json") continue;
    ldBlocks++;
    const raw = childrenOf(n).map((c) => c.value ?? "").join("");
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      fail("C01", file, "ld+json does not parse", e.message);
      continue;
    }
    for (const s of Array.isArray(parsed) ? parsed : [parsed]) schemas.push(s);
  }
  for (const s of schemas) {
    const t = s?.["@type"];
    if (t) typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
  }

  // --- canonical
  const canonicals = [];
  for (const n of walk(doc)) {
    if (n.tagName === "link" && (attr(n, "rel") ?? "") === "canonical") canonicals.push(attr(n, "href"));
  }
  if (!isErrorPage && !isRedirectStub) {
    if (canonicals.length !== 1) fail("C09", file, "canonical count", canonicals.length);
    else if (canonicals[0] !== pageUrl) fail("C09", file, "canonical does not equal page URL", canonicals[0]);
  }

  // --- breadcrumbs
  const crumbs = schemas.filter((s) => s?.["@type"] === "BreadcrumbList");
  if (!breadcrumbExempt) {
    if (crumbs.length === 0) fail("C02", file, "no BreadcrumbList on page");
    else if (crumbs.length > 1) fail("C02", file, "more than one BreadcrumbList", crumbs.length);
  }
  if (crumbs.length === 1) {
    const names = checkBreadcrumb(file, crumbs[0], doc, fileSet, pageUrl);
    const visible = visibleTrail(doc);
    if (names && visible) {
      const a = names.join(" › ");
      const b = visible.map((v) => v.label).join(" › ");
      if (a !== b) fail("C08", file, "visible trail differs from JSON-LD trail", `${b}  !=  ${a}`);

      // Labels matching is not enough: a visible crumb can link somewhere the
      // JSON-LD does not claim, and the reader and the crawler then disagree about
      // where the trail goes.
      const items = crumbs[0].itemListElement ?? [];
      if (visible.length === items.length) {
        visible.forEach((v, i) => {
          const li = items[i];
          const ldUrl = typeof li?.item === "string" ? li.item : li?.item?.["@id"] ?? null;
          const visibleUrl = v.href ? new URL(v.href, ORIGIN).toString() : null;
          if (visibleUrl !== ldUrl) {
            fail("C08", file, `crumb ${i + 1} link disagrees with its JSON-LD item`, `${visibleUrl} != ${ldUrl}`);
          }
        });
      }
    } else if (names && !visible && !breadcrumbExempt) {
      fail("C08", file, "no machine-identifiable visible breadcrumb nav (needs data-breadcrumb)");
    }
  }

  // --- FAQ
  for (const s of schemas.filter((x) => x?.["@type"] === "FAQPage")) {
    const me = s.mainEntity;
    if (!Array.isArray(me) || me.length === 0) {
      fail("C11", file, "FAQPage mainEntity empty");
      continue;
    }
    const pairs = [];
    for (const q of me) {
      const name = q?.name;
      const text = q?.acceptedAnswer?.text;
      if (q?.["@type"] !== "Question") fail("C11", file, "FAQ entry is not a Question", q?.["@type"]);
      if (typeof name !== "string" || !name.trim()) fail("C11", file, "FAQ question has no name");
      if (typeof text !== "string" || !text.trim()) fail("C11", file, "FAQ answer has no text");
      pairs.push(`${name}\u0000${text}`);
      // Answer-level, not set-level: two pages sharing one answer is the duplicate
      // content problem, even when the rest of their FAQ differs.
      if (typeof text === "string" && text.trim()) {
        const key = text.trim();
        if (!faqAnswers.has(key)) faqAnswers.set(key, []);
        const seen = faqAnswers.get(key);
        if (!seen.includes(pagePath)) seen.push(pagePath);
      }
    }
    const hash = pairs.join("\u0001");
    if (!faqGroups.has(hash)) faqGroups.set(hash, []);
    faqGroups.get(hash).push(urlPathFor(file));
  }

  // --- links
  if (!isErrorPage && !isRedirectStub) {
    for (const n of walk(doc)) {
      if (n.tagName !== "a") continue;
      const href = attr(n, "href");
      if (!href) continue;
      let path = null;
      if (href.startsWith("//")) continue;
      if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
        // absolute URL with a scheme — only ours is ours to check
        if (href.startsWith(ORIGIN)) path = href.slice(ORIGIN.length) || "/";
      } else if (href.startsWith("/")) {
        path = href;
      } else if (href.startsWith("#")) {
        continue;
      } else {
        // relative: resolve against this page's directory
        path = new URL(href, ORIGIN + pagePath).pathname;
      }
      if (path === null) continue;
      if (!resolves(path, fileSet)) fail("C10", file, "internal link 404s", href);

      // Canonical form: a page URL ends in "/". A link to the non-slash spelling
      // still works but names a second URL for the same page.
      const bare = path.split("#")[0].split("?")[0];
      const looksLikeFile = /\.[a-z0-9]{2,5}$/i.test(bare);
      if (bare && bare !== "/" && !bare.endsWith("/") && !looksLikeFile) {
        fail("C15", file, "internal link is missing the canonical trailing slash", href);
      }
    }
  }

  // --- required fields by @type
  for (const s of schemas) {
    const t = s?.["@type"];
    const need = (cond, what) => {
      if (!cond) fail("C14", file, `${t} is missing ${what}`);
    };
    // A root node without @context is not read as schema.org at all.
    const ctx = s?.["@context"];
    const ctxOk =
      ctx === "https://schema.org" ||
      ctx === "http://schema.org" ||
      (Array.isArray(ctx) && ctx.includes("https://schema.org")) ||
      (ctx && typeof ctx === "object" && !Array.isArray(ctx));
    if (!ctxOk) fail("C14", file, `${t} root node has no usable @context`, JSON.stringify(ctx));
    if (t === "LocalBusiness") {
      need(typeof s.name === "string" && s.name.trim(), "name");
      if (s.address) {
        need(s.address.addressLocality, "address.addressLocality");
        need(s.address.addressRegion, "address.addressRegion");
        need(s.address.addressCountry, "address.addressCountry");
      }
    } else if (t === "BlogPosting") {
      need(typeof s.headline === "string" && s.headline.trim(), "headline");
      need(typeof s.datePublished === "string" && s.datePublished.trim(), "datePublished");
      need(s.author?.name, "author.name");
      need(s.publisher?.name, "publisher.name");
      need(s.publisher?.logo?.url, "publisher.logo.url");
      need(
        typeof s.mainEntityOfPage === "string" || typeof s.mainEntityOfPage?.["@id"] === "string",
        "mainEntityOfPage as a URL string or an object with @id"
      );
    } else if (t === "Report") {
      need(typeof s.name === "string" && s.name.trim(), "name");
      need(typeof s.url === "string" && s.url.startsWith(ORIGIN), "an on-origin url");
    } else if (t === "CollectionPage" || t === "WebPage") {
      need(typeof s.name === "string" && s.name.trim(), "name");
      // A page's own schema must name the page it is on. A URL that points at a
      // different route — or at one that does not exist — describes another page.
      if (typeof s.url === "string" && s.url !== pageUrl) {
        fail("C14", file, `${t}.url is not this page's URL`, s.url);
      } else {
        need(typeof s.url === "string", "url");
      }
      const list = s.mainEntity?.itemListElement;
      if (Array.isArray(list)) {
        if (s.mainEntity.numberOfItems !== list.length) {
          fail("C14", file, "CollectionPage numberOfItems disagrees with the list length", `${s.mainEntity.numberOfItems} vs ${list.length}`);
        }
        list.forEach((li, i) => {
          if (li.position !== i + 1) fail("C14", file, "CollectionPage ListItem position out of order", li.position);
        });
      }
    } else if (t === "Organization" || t === "WebSite") {
      need(typeof s.name === "string" && s.name.trim(), "name");
      need(typeof s.url === "string" && s.url.startsWith(ORIGIN), "an on-origin url");
    }
    // AggregateRating is emitted nested; check it wherever it appears.
    const ar = s?.aggregateRating;
    if (ar) {
      const v = Number(ar.ratingValue);
      const c = Number(ar.reviewCount);
      if (!(v >= 1 && v <= 5)) fail("C14", file, "aggregateRating.ratingValue out of range", ar.ratingValue);
      if (!(Number.isInteger(c) && c >= 1)) fail("C14", file, "aggregateRating.reviewCount is not a positive integer", ar.reviewCount);
    }
  }

  // --- thin content
  let main = null;
  for (const n of walk(doc)) if (n.tagName === "main") { main = n; break; }
  if (!isErrorPage && !isRedirectStub && !isNoindex && !isUtility) {
    // No <main> is a failure, not a skip: a page with no main region has no
    // content region to measure, which is the thinnest a page can be.
    if (!main) {
      fail("C13", file, "page has no <main> element to measure");
    } else {
      const wc = wordCount(textOfVisible(main));
      wordCounts.push({ page: urlPathFor(file), words: wc });
      if (wc < MIN_WORDS) fail("C13", file, `main content below ${MIN_WORDS} words`, wc);
    }
  }
}

// --- FAQ uniqueness (cross-page)
const dupFaq = [...faqGroups.entries()].filter(([, pages]) => pages.length > 1);
for (const [, pages] of dupFaq) {
  failures.push({
    check: "C12",
    page: pages[0],
    detail: `identical FAQ answer set shared by ${pages.length} pages`,
    value: pages.slice(0, 5).join(", ") + (pages.length > 5 ? ` … +${pages.length - 5}` : ""),
  });
}
// An answer belongs to one page. Two pages carrying the same answer text is the
// duplicate-content failure whether or not the rest of their FAQ matches.
const dupAnswers = [...faqAnswers.entries()].filter(([, pages]) => pages.length > 1);
for (const [answer, pages] of dupAnswers) {
  failures.push({
    check: "C12",
    page: pages[0],
    detail: `one FAQ answer appears on ${pages.length} pages`,
    value: `"${answer.slice(0, 80)}…" — ${pages.slice(0, 3).join(", ")}`,
  });
}

// --- sitemap: only resolvable, indexable URLs
//
// Enumerated from disk, not from the HTML file set: reading the set meant only
// sitemap-index.xml was ever seen, its one <loc> pointed at sitemap-0.xml, that was
// filtered out as an .xml URL, and the check passed having inspected zero URLs.
const sitemapFiles = readdirSync(DIST).filter((p) => /^sitemap.*\.xml$/.test(p));
if (sitemapFiles.length === 0) {
  failures.push({ check: "C16", page: "/", detail: "no sitemap file found in dist/" });
}
let sitemapUrls = [];
for (const sm of sitemapFiles) {
  const xml = readFileSync(join(DIST, sm), "utf8");
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) sitemapUrls.push(m[1].trim());
}
sitemapUrls = [...new Set(sitemapUrls)].filter((u) => !/\.xml$/.test(u));
// A sitemap that lists no pages is not a passing sitemap.
if (sitemapUrls.length === 0) {
  failures.push({ check: "C16", page: "/", detail: "sitemap lists no page URLs" });
}
for (const url of sitemapUrls) {
  const fakeFile = join(DIST, "index.html"); // only used for the page label
  if (!url.startsWith(ORIGIN)) {
    failures.push({ check: "C16", page: url, detail: "sitemap URL is off-origin", value: url });
    continue;
  }
  const path = url.slice(ORIGIN.length) || "/";
  if (!resolves(path, fileSet)) {
    failures.push({ check: "C16", page: path, detail: "sitemap URL does not resolve", value: url });
  }
  if (noindexPages.has(path.endsWith("/") ? path : path + "/")) {
    failures.push({ check: "C16", page: path, detail: "noindex page is listed in the sitemap", value: url });
  }
}

/* ---------------------------------------------------------------- report */

const byCheck = {};
for (const f of failures) byCheck[f.check] = (byCheck[f.check] ?? 0) + 1;

wordCounts.sort((a, b) => a.words - b.words);
const pct = (p) => wordCounts[Math.floor((wordCounts.length - 1) * p)]?.words ?? 0;

const report = {
  generated: new Date().toISOString(),
  pages: files.length,
  ldBlocks,
  schemaTypes: Object.fromEntries([...typeCounts.entries()].sort((a, b) => b[1] - a[1])),
  minWords: MIN_WORDS,
  wordDistribution: { p0: pct(0), p05: pct(0.05), p25: pct(0.25), p50: pct(0.5), p95: pct(0.95) },
  thinnest: wordCounts.slice(0, 20),
  sitemapUrls: sitemapUrls.length,
  faqDuplicateGroups: dupFaq.length,
  faqDuplicateAnswers: dupAnswers.length,
  faqLargestGroup: Math.max(0, ...dupFaq.map(([, p]) => p.length)),
  failureCounts: byCheck,
  totalFailures: failures.length,
  // Every failure, never a sample — a truncated report hides the tail that matters.
  failures,
};

mkdirSync(dirname(JSON_OUT), { recursive: true });
writeFileSync(JSON_OUT, JSON.stringify(report, null, 2));

const line = (k, v) => console.log(`  ${k.padEnd(26)} ${v}`);
console.log(`\nverify-site — ${files.length} pages, ${ldBlocks} JSON-LD blocks`);
line("word count p0/p5/p50", `${report.wordDistribution.p0} / ${report.wordDistribution.p05} / ${report.wordDistribution.p50}`);
line("FAQ duplicate groups", `${dupFaq.length} (largest: ${report.faqLargestGroup} pages)`);
console.log("\n  failures by check:");
const LABEL = {
  C01: "JSONLD_PARSE", C02: "BREADCRUMB_PRESENT", C03: "BREADCRUMB_SHAPE",
  C04: "BREADCRUMB_POSITION", C05: "BREADCRUMB_HOME", C06: "BREADCRUMB_TERMINAL",
  C07: "BREADCRUMB_URLS", C08: "BREADCRUMB_MATCH", C09: "CANONICAL", C10: "LINKS",
  C11: "FAQ_SHAPE", C12: "FAQ_UNIQUE", C13: "THIN", C14: "SCHEMA_REQUIRED",
  C15: "TRAILING_SLASH", C16: "SITEMAP", C17: "EXEMPTION_SCOPE",
};
for (const id of Object.keys(LABEL)) {
  const n = byCheck[id] ?? 0;
  console.log(`    ${id} ${LABEL[id].padEnd(20)} ${n === 0 ? "PASS" : `FAIL ${n}`}`);
}
console.log(`\n  total failures: ${failures.length}`);
console.log(`  full report: ${relative(ROOT, JSON_OUT)}\n`);

process.exit(REPORT_ONLY || failures.length === 0 ? 0 : 1);
