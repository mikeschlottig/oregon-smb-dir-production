# Oregon SMB Directory against the house standards — 2026-11-21

Mike, 2026-11-21: "we have our own checkers … audit the oregonsmbdirectory properly. When you run into perceived
contradictory instructions … surface the issues, make a choice, document your reasoning, and proceed."
Plan and proof: `tasks.md` P19 · predictions and results: `hypothesis.md` H37.

## Standards and checkers used

| standard | where | checker |
|---|---|---|
| Unified master guide | `/home/mikes/leverageai-seo-site-standards/STANDARDS.md` (+ README anti-slop scan) | — |
| STD-WEB-QC-001 deploy gate, rows 1–13 | `/home/mikes/house-standards/standards/web-qc-seo.md` | `astro check`, Lighthouse, `qc-images.js`, `qc-minified.js` |
| STD-SEO-001 page checklist, rows 1–19 | `/home/mikes/house-standards/standards/seo.md` | `qc-site.py` (crawl of every sitemap URL), `qc-seo-page.js` |

Both repos are indexed: codebase-intel (`…/codebase-intel-toolkit/indexes/{leverageai-seo-site-standards,house-standards}`)
and doc-intel (`/home/mikes/doc-intel/indexes/{leverageai-seo-site-standards,house-standards}.db`).
Raw output (gitignored, regenerable): `reports/std/` — the qc-site report, `browser-20261121/` (snippet JSON +
390/768 full-page screenshots), Lighthouse JSON.

## The checker itself was broken (fixed first)

`qc-site.py` crashed on every run: the documented `uv run --with advertools` resolves Scrapy 2.20, which added a
required `schemes` argument to `LxmlLinkExtractor._process_links`; advertools 0.18.0 does not pass it, so every
request errored, the crawl came back empty, and the script died on `KeyError: 'title'`.
- Pinned `--with 'scrapy<2.20'` (2.19.0 has the old signature; checked 2.13–2.19) in every documented invocation:
  `house-standards/scripts/qc-site.py`, `house-standards/standards/website-checklist.md`, and in
  leverageai-seo-site-standards `STANDARDS.md`, `README.md` (×2), `source-docs/…-master.md`,
  `source-docs/std-website-checklist.md`. `expert/REPORT.md` quotes the old line as evidence and was left as written.
- `qc-site.py` now exits with a message when the crawl returns fewer than 90% of the sitemap URLs — a broken crawler
  must not look like a clean (or a crashed) site.

## Decisions — where a standard and this site disagree

**D1 — Slug-first "verbatim" vs punctuation a slug cannot carry.** STD-SEO-001 §1: the title and H1 contain the
slug phrase verbatim; "a word in between does not" count. A listing's title is the business's legal name
("AAMCO Transmissions & Total Car Care"); its slug cannot hold `&`, `'` or `:`. Verbatim: 3,134 pages fail.
Comparing with punctuation removed on both sides: 27 listings + a handful of hub pages.
*Choice:* the hyphen in a slug stands for any run of punctuation. Business names are facts and are not rewritten;
3,000+ URLs are not re-slugged. The hub pages that failed even this way were fixed (D1a). The house checkers were
**not** changed — whether the rule should normalize punctuation is Mike's call; this is how the site was graded.
- D1a fixed: `/city/` ("Oregon Businesses by City"), `/blog/` H1, `/research/` H1, `/editorial-policy/`, blog
  pagination H1s, and 7 service categories whose name did not contain their slug (Plumbers → Plumbing Contractors,
  Electricians → Electrical Contractors, Marketing & Advertising Agencies → Marketing Agencies & Advertising Firms,
  Massage Therapists → Massage Therapy Practices, General Practice Attorneys → General Practice Law Firms,
  Business & Corporate Attorneys → Business Law & Corporate Attorneys, Personal Trainers → Personal Training Services).
- D1b open: 27 listings whose slug lost accented letters ("Dobrá Tea" → `dobr-tea`, "MÄS" → `m-s`). Fix = new
  slug + 301 per listing (the `add-listings.mjs` remove/add + `_redirects` pattern used for Major Fluke).

**D2 — Brand at the end of every title vs 60 characters.** STANDARDS §2 wants `Page Title | Brand`; with the
21-character brand most listing titles cannot fit. *Choice:* the business name and location come first; the brand
is appended only when it fits; a business name is never shortened (`src/lib/seo-text.ts` `fitTitle`).

**D3 — "One phone number / one email site-wide" vs a directory.** The qc-site rows assume a single-business site.
Every listing page links its own business's `tel:`/`mailto:` — that is the product. *Choice:* not applicable to
listing contact links; the publisher's own NAP is the same on every page (footer, `/contact/`, `/about/`, JSON-LD:
(541) 450-2082, contact@oregonsmbdirectory.com) — qc-site "phone + email links on every page" passes.
*Operational note:* qc-site also treats every `google.com/maps` link as a "social profile" and fetched **18,849**
Google Maps URLs from this machine in one run (plain HTTP, not a browser). On a directory that is a rate-limit risk
for the machine that runs maps-intel. Recommendation for Mike: skip that row's Google Maps links for directories.

**D4 — qc-site reads only the first object of a JSON-LD array.** It reported "no BreadcrumbList" on 10,529 pages
whose breadcrumb was item 2 of one `<script>` array (valid JSON-LD; verify-site C02 passes). *Choice:* `JsonLd.astro`
now writes one `<script>` per object — valid everywhere, read by every tool.

**D5 — Copyright row: the two house checkers disagree.** `qc-seo-page.js` reads all footer text (passed);
`qc-site.py` reads footer *links* only (failed on all pages). *Choice:* the notice now names the legal operator
("Copyright © 2026 LEVERAGE AI LLC · Oregon SMB Directory") and links to `/about/`, which names the rights holder.

**D6 — About page with `Person` + `sameAs`.** STANDARDS §4 asks for `AboutPage` linking a founder `Person` with
social profiles. `/about/` did not exist (404). *Choice:* built `/about/` from facts the site already publishes,
with `AboutPage` about the publisher `Organization`. No person is named: publishing an individual's name and profiles
is Mike's decision, and no profile URLs were verified.

**D7 — "Service pages: `Service`".** The `/services/…` pages list third-party providers; a `Service` node would
claim the directory itself provides plumbing or dentistry. *Choice:* they keep `CollectionPage` + `ItemList`, which
the repo's own JSON-LD rubric requires for those page types.

**D8 — Things Cloudflare injects at the edge (not in this repo).**
- `/.webmcp/bridge.js` (75 KB, unminified, `data-packs="c2pa,mcp-server-client"`) on every page — fails
  qc-minified and "zero JS by default".
- `/cdn-cgi/challenge-platform/scripts/jsd/main.js` (bot detection) uses deprecated APIs (FencedFrame,
  `StorageType.persistent`) → Lighthouse Best Practices **81 on every page**; it is the only failing audit there.
*Choice:* neither was switched off. One is a security feature and the other looks deliberate (agent/WebMCP work).
Both are zone settings for Mike to decide; turning off JS detections should lift Best Practices to ~100.

**D9 — Anti-slop phrase gate.** 507 hits in `dist/`; 468 are business names ("Tesla Supercharger", "Embark Fitness",
"…Tapestry Collection by Hilton") and 6 are quoted source titles in citations — facts, justified, unchanged.
The other 32 were our own research prose and were rewritten (no meaning changed).

**D10 — Blog and research slugs are whole headlines.** The slug phrase is longer than 60 characters, so slug-first
and "title ≤ 60" cannot both hold. *Choice:* no re-slug now (80 URL changes plus a keyword decision per post — an
editorial pass). The `<title>` is cut at a word with "…"; the H1 keeps the full headline.

**D11 — Posts and reports need a TL;DR first and Key Takeaways after each block (STD-SEO-001 §4).** 65 pages lack
both. *Choice:* not generated mechanically — 65 summaries written without reading each post are the slop the gate
exists to stop. Editorial pass, per post.

**D12 — Image slot ratio 1.0–2.0 at 390 px.** City-card source photos are 800 px wide; a 3× phone slot is ~1,070 px
(ratio 0.74). Code cannot fix that. *Choice:* added a 1200 px step for sources that have it (Bend is 1600 px);
the rest need new ≥ 1,200 px photos.

## Defects found and fixed (P19)

| finding | standard row | fix |
|---|---|---|
| `qc-site.py` could not run | — | Scrapy pin + empty-crawl guard (above) |
| `/about/` 404; footer had no About | SEO row 12 | `/about/` page + footer link |
| `/llms.txt` 404 | SEO row 18 | `src/pages/llms.txt.ts` built from site data |
| no `<header>` landmark on any page | SEO row 4 | navbar wrapper `div` → `header` |
| `main` nested in `main` on 3 policy pages | SEO row 4 | inner `main` → `article` |
| heading skips (footer `h4`, industry `h1→h3`) | SEO row 3 | footer `h2`; outline `h2` above the business grid |
| 23 research reports with up to 21 `<h1>` | SEO row 3 | remark plugin: a body's top heading becomes `h2` |
| titles > 60 (4,724), descriptions outside 120–160 (4,247) | SEO row 2 | `src/lib/seo-text.ts` + every template |
| JSON-LD breadcrumb invisible to qc-site | SEO row 8 | one `<script>` per object (D4) |
| contrast < 4.5:1 (muted text, copper, sage, card initials) | Lighthouse a11y ≥ 95 | 3 tokens darkened to the minimum passing value; copper-lt on dark; pine initials |
| home LCP 7.1 s: 251 KB JPEG CSS-background hero | Lighthouse perf ≥ 90 | `<img>` + WebP srcset + preload + fetchpriority |
| salon report shipped a pasted HTML app: Tailwind CDN + Chart.js, a second `<title>`, and a "rankings" table of named businesses with fictional 555-01xx phones and example.com sites | WEB-QC row 9 | cut from the published report; original archived in `_archive/research-embedded-app-20261121-043240/` |
| GEO whitepaper summary was "📄" | SEO row 2 | the report's own summary line |
| 32 slop phrases in research prose | STANDARDS §10 | rewritten (D9) |

## Still open

- D1b (27 diacritic slugs), D10 (post re-slug), D11 (TL;DR + Key Takeaways), D12 (photos) — listed above.
- Performance below 90 on listing and industry pages: Google Maps embed JS (~330 KB) on listings and PostHog's
  `array.js` (125 KB) on every page. Next step: click-to-load map facade, analytics after first interaction.
- Research reports still carry Notion export rows ("Archived|", "Created time|") in their bodies.
- Rich Results Test / validator.schema.org (SEO row 6) are Google/third-party services: Mike or the stealth toolkit.
- Results after the fix deploy: see the end of this file.

**D13 — HTML between-tag whitespace runs (qc-minified, limit 5).** Pages show 6–10 runs: double spaces Astro leaves
where a template expression renders nothing, plus HTML comments. Collapsing them needs a rewrite pass over every built
file that could alter whitespace inside `<pre>` code blocks; the house snippet itself calls these Astro artefacts that
compression absorbs (home: zstd, 18% of plain). *Choice:* accepted.

**D14 — `LocalBusiness.url`: schema.org example vs this repo's gates.** schema.org's example puts the business's own
site in `url`; verify-site C14 fails an off-origin `url` and the JSON-LD rubric wants it to equal the page canonical.
*Choice:* `url` stays on-origin; a confirmed business website goes in `sameAs` (as premium listings already did).
Side-by-side: `docs/jsonld-side-by-side-listing-2026-11-21.md`.

Also changed during the run: premium/dedicated copy trimmed to fit (Apex Business Marketing's description now names
Hillsboro and Washington County, not Portland; PDX Fingerprinting's title drops "Translation", which stays in its
description); a research report's unfenced bash script (every `# comment` rendered as a heading) is now a code block;
Astro's content-layer cache must be cleared (`npx astro sync --force`) after a markdown-pipeline change, or unchanged
files keep their old rendering; the code-block theme is now `github-dark-default` (comment contrast).

## Results — before → after (live site; deploys 4d0b98a3 … 04c2f5a8)

| measure | before | after |
|---|---|---|
| qc-site site rows failing | 7 | 5 (D3 ×2; two external links that answer 403 to bots) |
| qc-site pages with problems | 10,533 of 10,533 | 3,172 (slug rule D1/D10, long names D2, TL;DR D11, names D9) |
| titles > 60 | 4,724 | 111 (business names already ≥ 60 on their own, D2) |
| descriptions outside 120–160 | 4,247 | 0 |
| duplicate titles / descriptions | 0 / 6 | 0 / 0 |
| pages with ≠ 1 `<h1>` | 23 | 0 |
| posts + reports with skipped heading levels | present | 0 of 80 |
| qc-site "no BreadcrumbList" | 10,529 | 0 |
| `/about/`, `/llms.txt` | 404, 404 | 200, 200 |
| Lighthouse mobile, 12 page types: SEO | 100 | 100 |
| Accessibility | 93–96 | **100 on all 12** |
| Best Practices | 81 | 81 (D8 — Cloudflare's bot-detection script) |
| Performance | 74–89 | 75–89 (home LCP 7.1 s → 5.2 s); open: maps embed, analytics |
| verify-site C01–C18 | 0 failures | 0 failures |

The qc-site re-run used a copy of the checker identical except that its "social profile" pattern skips Google Maps
links (D3 operational note): the first run had already fetched 18,849 of them.
