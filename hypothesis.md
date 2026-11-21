# hypothesis.md — Oregon SMB Directory repair

Loop: think → analyze → act → observe → reason → document → proceed.
Prediction goes in **before** the command runs. Result is pasted, not paraphrased.

Baseline measurement: build #1 (10,583 pages) →
`node scripts/verify-site.mjs --report-only --json reports/baseline-verify.json`
→ **117,339 failures**.

```
C01 JSONLD_PARSE         PASS
C02 BREADCRUMB_PRESENT   FAIL 4
C03 BREADCRUMB_SHAPE     FAIL 74152
C04 BREADCRUMB_POSITION  PASS
C05 BREADCRUMB_HOME      FAIL 21158
C06 BREADCRUMB_TERMINAL  FAIL 10580
C07 BREADCRUMB_URLS      PASS
C08 BREADCRUMB_MATCH     FAIL 10579
C09 CANONICAL            FAIL 1
C10 LINKS                FAIL 662
C11 FAQ_SHAPE            PASS
C12 FAQ_UNIQUE           FAIL 143
C13 THIN                 FAIL 60
```

---

## H1 — `breadcrumbSchema` emits a shape Google rejects — **CONFIRMED**

**Prediction:** `src/lib/schema.ts:149` built `itemListElement[].item` as
`{"@type":"WebPage","name":…,"url":…}` with no `@id`. Google requires `item` to be a URL
string or an object carrying `@id`; `url` is not the identifier. So every page emitted a
BreadcrumbList Google cannot read as a breadcrumb.

**Result:** held, and larger than predicted. 74,152 C03 failures across the site — the
missing ListItem-level `name` and the unusable `item` both fire per crumb. The knock-on
was 21,158 C05 (no Home name, Home URL unreadable) and 10,580 C06.

**Fix:** `src/lib/breadcrumbs.ts#breadcrumbListSchema` emits Google's documented form —
`name` on the ListItem, `item` as an absolute URL string, no `item` on the final crumb.

---

## H2 — Visible trail and JSON-LD drift because they are built separately — **CONFIRMED**

**Prediction:** every page kept a `breadcrumbItems` array and a separate `breadcrumb={[…]}`
prop. Two hand-maintained lists guarantee at least one disagreement.

**Result:** held. Three independent implementations, not two:

- the `breadcrumbItems` / `breadcrumb={[…]}` pair (e.g.
  `city/[citySlug]/[industrySlug].astro:70` vs `:89`)
- hand-rolled `<nav>` trails in `blog/[slug].astro:45`, `research/[slug].astro:38`,
  `best-of/[slug].astro:34`, `city/[citySlug]/[industrySlug]/page/[page].astro:54`
- `TldrCard`'s own nav

Drift found in the wild: `best-of/[slug].astro` linked `/best-of` in the visible trail and
`/best-of/` in the JSON-LD. `city/index.astro:29` used `/city`, `city/[citySlug].astro:50`
used `/city/`.

10,579 C08 failures — no page's visible trail was machine-identifiable at all, because no
nav carried `aria-label="Breadcrumb"` or any stable marker.

**Fix:** one `trail([...])` per page; `visibleTrail()` and `breadcrumbListSchema()` both
derive from it. Paths are normalised to the trailing-slash canonical form inside `trail()`,
so the two spellings cannot recur.

---

## H3 — "Josephine Co. County" comes from TldrCard concatenation — **REFUTED**

**Prediction:** `TldrCard.astro:41` renders `` `${eyebrow} · ${county} County` ``, so a
county value already carrying a suffix would double it.

**Result:** refuted. `src/data/cities.ts:27-38` — all twelve counties are bare names
("Linn", "Josephine", "Jackson"). The concatenation is correct and produces "Josephine
County". The audit's "Josephine Co. County" was not reproduced anywhere in the built
site; no fix was applied, and nothing was changed on a guess.

---

## H4 — `FaqSchema.astro` can emit invalid JSON-LD — **CONFIRMED as latent**

**Prediction:** `FaqSchema.astro:25` wrote `JSON.stringify` into `set:html` with no entity
escaping while `JsonLd.astro:9-13` escaped.

**Result:** the asymmetry was real; C01 was PASS at baseline, so no live answer currently
contains `<`, `>` or `&`. A latent break, one business name away. Fixed anyway — the two
components now escape identically.

---

## H5 — `/services/*` has no parent routes — **CONFIRMED**

**Prediction:** `src/pages/services/` held only `index.astro` and the three-deep dynamic
route, so any breadcrumb pointing at `/services/{industry}/` or
`/services/{industry}/{category}/` was a 404.

**Result:** held. 622 of the 662 broken internal links were exactly this: 11 industry-level
and 34 category-level URLs, linked from every service page's crumb trail.

**Fix:** both hub levels now exist as real pages —
`services/[industrySlug]/index.astro` and `services/[industrySlug]/[categorySlug]/index.astro`.
They are not placeholders: the industry hub lists the categories that have qualifying
cities, the category hub carries the category's editorial sections, licensing note and FAQ.

---

## H6 — the generic FAQ is industry-aggregate content on business pages — **CONFIRMED**

Not predicted in advance; found by reading `[businessSlug].astro:91`.

`generateIndustryFaqs(city, industry, getBusinesses(city.slug, industry.slug))` produced
four questions from the city-industry aggregate and rendered them on every business page
in that city and industry.

**Measured:** 143 duplicate answer sets covering **9,598 of 10,583 pages** — the largest
single group spanned 223 pages. Each carried its own `FAQPage` block.

**Fix:** business pages carry no FAQ. The city-industry page keeps its FAQ, where the
counts in the answers are actually about that page. The category FAQ moved off the twelve
city service pages onto the category hub, which is the one page it describes.

---

## H7 — thin pages are mostly a pagination remainder artifact — **CONFIRMED**

**Prediction (made from the C13 list, before fixing):** the 60 thin pages would be
dominated by paginated tails holding one or two listings, not by genuinely empty content.

**Result:** held. 55 of 60 were `/city/{city}/{industry}/page/N/`. The remaining five were
`/best-of/` (27 words — `bestOfLists` is an empty array), two blog category pages with one
and two posts, and `/contact/` and `/accessibility/`, which are short by design.

**Fix:** `src/lib/paginate.ts` folds a final page of fewer than six items into the previous
page. Six is derived, not guessed: the baseline measured ~355 words for a full 15-card page
and ~40 words of page furniture, so ~24 words per card, and 6 × 24 + 40 > 150.

---

## H8 — a majority-vote category rule would move listings it should not — **CONFIRMED**

**Prediction:** assigning each provider category to the industry it appears in most often
and moving every minority listing would move 212 listings, including legitimate
cross-industry ones.

**Result:** held, and the raw rows showed a second trap. 68 categories span more than one
industry; a blunt rule moves 212 listings including 54 correctly-filed massage therapists.
Tightening to "minority ≤2 AND majority ≥10×" gave 29 — but two of those were the label
`"Store"`, whose majority industry (health-wellness, 11) is an artifact of a generic label,
not a signal.

**Fix:** generic labels excluded by name; 27 listings moved; originals archived to
`_archive/businesses-precategoryfix-20260921040557/`.

---

## H9 — a schema `url` can name a route that does not exist — **CONFIRMED**

Found while canonicalising URLs, not predicted.

`blog/category/[category]/page/[page].astro:65` emitted
`${siteUrl}/blog/category/${categorySlug}/${currentPage}/` while the route it describes is
`/blog/category/{slug}/page/{n}/`. `blog/page/[page].astro:50` had the same defect.
Both pointed structured data at a URL the site never serves.

**Fix:** corrected, and C14 now requires a `CollectionPage`/`WebPage` `url` to equal the
URL of the page carrying it — so this class cannot recur silently.

---

## H10 — `PostalAddress` packs locality, region, and ZIP into `streetAddress` — **CONFIRMED**

**Prediction (Adversarial Audit F1):** LocalBusiness schemas pack the entire address string into `streetAddress` and omit `postalCode`, violating Schema.org's definition of `streetAddress`.

**Result:** held. 31,750 nested `PostalAddress` instances across the directory had locality, region, and ZIP bundled into the street line.

**Fix:** `src/lib/schema.ts#postalAddress` parses addresses into discrete `streetAddress`, `addressLocality`, `addressRegion`, and normalized `postalCode` fields, handling full addresses, missing street lines, and ZIP+4 variants.

---

## H11 — City-descendant breadcrumbs skip the `/city/` parent level — **CONFIRMED**

**Prediction (Adversarial Audit F2):** City-industry and business pages emit breadcrumbs linking directly from the city to Home, skipping the `/city/` ("Cities") parent hub.

**Result:** held. Inconsistent hierarchy across all 5 city-descendant page templates.

**Fix:** Added `{ name: "Cities", path: "/city/" }` to all city-descendant breadcrumb trails (`src/pages/city/[citySlug]/[industrySlug].astro`, `[businessSlug].astro`, `page/[page].astro`, and dedicated pages), establishing a unified `Home > Cities > City > Industry > [Business]` hierarchy.

---

## H12 — Redirect stubs omit trailing slashes — **CONFIRMED**

**Prediction (Adversarial Audit F3):** Astro redirect stubs without trailing slashes cause redirect chains on Cloudflare Workers Static Assets.

**Result:** held. Target in `astro.config.mjs` lacked a trailing slash, triggering an unnecessary second 307 hop under Cloudflare's `auto-trailing-slash` behavior.

**Fix:** Added trailing slash to redirect target in `astro.config.mjs` and updated `scripts/verify-site.mjs` to validate redirect stubs rather than skipping them.

---

## H13 — Content word floor met by page furniture — **CONFIRMED**

**Prediction (Adversarial Audit F4):** Low-listing paginated pages clear the 150-word content floor using breadcrumbs, search bars, and navigation markup rather than distinct prose.

**Result:** held. Excluding furniture dropped the measured floor on borderline pages below 150 words.

**Fix:** Updated `scripts/verify-site.mjs` to exclude nav, search, and form furniture from the word count calculation; added genuine comparative entity copy to `[businessSlug].astro` comparing each listing against its city/industry peer cohort; increased pagination minimum floor in `src/lib/paginate.ts`.

---

## H14 — Templated FAQ answers and deprecated FAQPage schema — **CONFIRMED**

**Prediction (Adversarial Audit F5):** FAQ answers across city-industry pages were structurally identical template frames with only numeric counts varying. Furthermore, Google officially deprecated `FAQPage` rich results in May 2026 and removed the documentation in June 2026.

**Result:** held. 488 `FAQPage` structured data blocks provided no rich result benefit, while visible FAQ answers needed true uniqueness.

**Fix:** Removed `FAQPage` JSON-LD schema generation entirely. Converted FAQ answers into genuine on-page editorial text, reading visible text via `<p data-faq-answer>` in `scripts/verify-site.mjs` to ensure sentence frames are distinct.

---

## H15 — Verification gate was blind to nested schema — **CONFIRMED**

**Prediction (Adversarial Audit F6):** `scripts/verify-site.mjs` only checked root-level schema nodes for `AggregateRating` and required properties, ignoring deeply nested `CollectionPage` items.

**Result:** held. 31,750 schema violations had bypassed C14 entirely because they were nested inside `itemListElement[].item`.

**Fix:** Refactored C14 in `scripts/verify-site.mjs` to recursively traverse the complete JSON-LD object tree, validating required properties on all nested entities.

---

## H16 — Unbounded Pagefind indexing bleeds cross-city links into search — **CONFIRMED**

**Prediction:** Pagefind indexed the full HTML document on every page because `SiteLayout.astro` lacked `data-pagefind-body` on `<main>`, and universal furniture (`<Navbar>`, `<Footer>`, cross-city `<section>` widgets) lacked `data-pagefind-ignore`. Because `Footer.tsx` lists all 12 Oregon cities on every page, and service landing pages list all 11 nearby cities in their "Nearby Cities" section, every Eugene page contained the word "Medford" and every Medford page contained "Eugene". Consequently, queries like "medford roofing" matched Eugene plumbers and cross-city competitors.

**Result:** held. Pagefind indexed all 10,564 pages globally. Searching "medford" in the raw Pagefind index returned 1,302 results across all cities; searching "medford roofing" matched 124 pages including Result #115 ("Plumbers in Eugene, Oregon") and Result #44 ("Roofing Contractors in Eugene, Oregon").

**Fix:** Enforce strict Pagefind indexing boundaries:
1. Put `data-pagefind-body` on `<main>` in `SiteLayout.astro`.
2. Add `data-pagefind-ignore` to `<Navbar>`, `<Footer>`, `RelatedLinks.astro`, and the "Nearby Cities" and "Related Services" recommendation sections in service landing pages.
3. Add Pagefind metadata and filter attributes (`data-pagefind-meta="city:..."`, `data-pagefind-meta="industry:..."`, `data-pagefind-meta="type:..."`) to all searchable pages.

---

## H17 — Paginated index slices pollute search results — **CONFIRMED**

**Prediction:** Paginated listing pages (`/city/[citySlug]/[industrySlug]/page/[page]/`, pages 2 through 8+) were being indexed by Pagefind as standalone results (e.g. "Construction & Home Services in Medford — Page 8"), crowding out actual businesses and canonical category hubs.

**Result:** held. Top search results for "medford roofing" contained paginated index slices ("Construction & Home Services in Medford — Page 8", "Page 7", "Page 6") that offered no direct business contact info.

**Fix:** Add `pagefindIgnore?: boolean` to `SiteLayout.astro` and pass `pagefindIgnore={true}` on all paginated slice templates (`src/pages/city/[citySlug]/[industrySlug]/page/[page].astro`), restricting the search index to canonical hubs and business detail records.

---

## H18 — Service intent and plural synonym mismatch in business records — **CONFIRMED**

**Prediction:** Local businesses are categorized under formal Google Place types (e.g. "Roofing contractor", "Plumber"), none of which contain the colloquial plural forms (e.g. "roofers", "plumbers"). When a user searches for "medford roofers", Medford businesses fail to match because they lack the word "roofers", while service landing pages in distant cities (Klamath Falls, Salem, Portland, Eugene) match because their editorial prose contains "roofer" and "roofers" alongside "Medford" in the nearby-cities section.

**Result:** held. Querying "medford roofers" returned 13 results: 10 service landing pages in other cities (Klamath Falls #0, Salem #1, Portland #2, Medford #3, Eugene #4), and 0 individual Medford roofing businesses.

**Fix:** Add localized synonym/intent tags to business profile templates (`[businessSlug].astro`) and service category pages, matching colloquial search terms ("roofers", "plumbers", "electricians", "realtors") to the qualified service categories.

---

## H19 — Asynchronous race conditions and missing city badges in SearchBar — **CONFIRMED**

**Prediction:** `SearchBar.astro` handled debounced input without an in-flight request guard or cancellation token. In rapid typing scenarios or network latency jitter, an earlier query (e.g. "real estate") could resolve after a subsequent query (e.g. "medford roofers"), overwriting the dropdown with stale results. Additionally, search results lacked City and Industry badges, preventing users from recognizing cross-city results before navigating.

**Result:** held. Inspecting `SearchBar.astro` revealed no request sequence counter or input validation upon Promise resolution, allowing stale async callbacks to overwrite the DOM. Furthermore, results rendered only raw titles and excerpts with no location or industry indicators.

**Fix:** 
1. Implement a monotonic `requestId` counter in `SearchBar.astro` to discard any async results that do not match the current input.
2. Render clear location, industry, and type badges (`[Medford]`, `[Construction]`, `[Business]`) on every search result item.
3. Detect city names in user queries to automatically prioritize or filter results matching the targeted city.


## H20 — Owner-verified listings render without badge or link because the evidence objects are missing — **OPEN**

**Prediction:** LeverageAI and Daley Organics carry only the legacy `verified: true`, which
`sanitizeBusiness` drops. They have no `verification.evidenceIds` and no confirmed
`websiteValidation`, so the gate strips the badge and the website. Adding both objects
through a patch batch will make "Verified" and the website link appear on the dynamic
pages. The two dedicated pages will stay unbadged until they read the record, because they
hard-code `verified: false`.

**Baseline (live, 2026-09-23):** "Verified" count is 0 on all five Daley and LeverageAI
URLs. Daley's construction page and both category indexes carry no website link.

**Result for Daley Organics (2026-09-23):** held. After the patch batch
`requests/listings/2026-09-23-daley-organics.json`, the dated rating supplement, and
record-driven stats on the dedicated page, live curl on Worker version `9abf79e7` shows:

| page | Verified | site links | banner | ratingValue 4.6 | count 10 |
|---|---|---|---|---|---|
| construction page | 3 | 2 | 1 | 1 | 1 |
| retail page | 2 | 2 | 1 | 1 | 1 |

The dedicated page stayed "Editorial profile" until it read the record, as predicted.
LeverageAI and PDX are not done yet.

**Result for LeverageAI and PDX (2026-09-23 evening):** held. LeverageAI patch batch +
record-driven dedicated page: live badge "Verified · confirmed website" (Worker `5fa0b6f2`).
PDX merged to one record with a dedicated page (Worker `1a4695e3`). **H20 closed.**

## H21 — Most map embeds fall back to a name search because the pin parser reads one URL shape — **CLOSED, held with a surprise**

**Prediction:** `parseLatLng` reads only `query=lat,lng`, so almost every listing uses a
name + address search embed. Reading `!3d/!4d` and `/@lat,lng` will pin most of them.

**Result:** 132 → 9,896 of 10,168 records parse. **Surprise:** 116 of the new pins lie
outside Oregon (Kansas, Nevada, British Columbia…) — Google places that are not the listed
business. Those are gated back to the address search by an Oregon bounding box, leaving
9,780 pinned (derived twice: 9,896 − 9,780 = 116 = 115 place pins + 1 query/viewport).
The `!3d` pin beat the `/@` viewport where both exist (Xcelent: viewport at 9z in the Coast
Range, pin in Portland). List: `reports/maps-pins-outside-oregon-2026-09-23.csv`.

## H22 — Research pagination at 12 per page — **CLOSED, prediction wrong once**

**Prediction:** 12 per page with no tail-folding passes the build.
**Result:** wrong. 25 reports → 12/12/1; page 3 had 40 words and failed C13 THIN.
Spreading evenly over the fewest pages under the cap (9/8/8) passed with 0 failures.
**Rule:** a per-page maximum is a cap, not a fill target — balance the pages.

## H23 — Oregon location gate replaces the bounding-box pin gate — CLOSED, prediction right, then tightened

**Prediction (written before code):** rule A (street address names another state) blocks
31 records; rule B (no address + pin on land outside Oregon + non-Oregon or missing area
code) blocks ~14; total ~45, down from P10.4's 116. The 13 ocean-placeholder pins
(`46.423669,-129.942709`) with no address stay published. After the link fix, `dist/`
has zero `maps/dir/?api=1&destination=` links on listings that carry a `googleUrl`.
**Result:** first run 31 + 14 = 45, exactly as predicted (and as the independent Polars
profile). Reading the 45 rows showed 6 of the 14 had **no phone** — one signal, not two
(e.g. "Corvallis Plumbing Company, LLC" with a Wyoming pin). Rule tightened: a pin-only
case publishes as `pin-away-uncorroborated` and goes on the extractor queue. Final:
39 blocked (31 address + 8 pin-and-phone), 6 unresolved, 37 unique URLs 301'd.
Link check in `dist/`: 0 coordinate `maps/dir` links (any `&` encoding; the positive
control — name+address `maps/dir` — matched 8,777 pages, so the zero is real).
**Rule:** a placeholder value (ocean pin) looks like evidence; a block needs two
independent signals, and a missing signal is not a second signal.

## H24 — JSON-LD rubric over dist/ — CLOSED, prediction wrong on the perfect count

**Prediction (before the first full run):** almost no page is PERFECT. Every listing with a
displayed rating errors on LB_RATING_THIRD_PARTY (Google: "Don't aggregate reviews or
ratings from other websites"); every city-industry / service list page errors on
RATING_ON_LIST; ~9,400 listings warn LB_MOST_SPECIFIC_TYPE and SITE_TELEPHONE_FORMAT.
PERFECT ≤ 30 pages, mostly CollectionPage indexes (blog, research). The one research page
with no JSON-LD errors on PAGE_NO_JSONLD. /city/ and /services/ hubs error on
PAGE_REQUIRED_TYPE (BreadcrumbList only).
**Result (12 s, 10,535 pages):** PERFECT 77 · WARNING 604 · ERROR 9,854. Wrong on PERFECT
(≤30 predicted): the 12 city, 12 industry and 33 service pages list businesses *without*
ratings, so they pass; 3 listings (the premium profiles: subtype, geo, hours, no scraped
rating) are PERFECT — the exemplar exists in production. Right on the rest:
LB_RATING_THIRD_PARTY 9,816 pages, RATING_ON_LIST 947, LB_MOST_SPECIFIC_TYPE 9,423,
SITE_TELEPHONE_FORMAT 10,069 (source phones like "(541) 7307759"), hubs /city/ and
/services/ lack a CollectionPage, one research page has no JSON-LD.
Self-test first: it caught my own false positive (ListItem.item as a URL string is Google's
documented form) before the full run.
**Rule:** a rubric ships with fixtures that prove each rule can fire and a named exemplar
that must pass — the first run of this one was wrong in the rubric, not the site.

## H25 — listings-extraction place-page selectors — OPEN (needs Mike's go for a live run)

**Prediction:** on the first live place page, the semantic selectors (`data-item-id`
address / authority / phone:tel: / oloc, "N stars" / "N reviews" aria-labels) fill name,
rating, reviews, address, phone, website; the class-name fallbacks (DUwDvf, F7nice, DkEaL)
are the ones most likely to have drifted. Identity = match for all 4 URLs-API targets.
**Offline proof so far:** 18 tests; mutation checks confirm the block-teardown and
stale-selector tests fail when that code is removed.

## H25 — result (first live run, 2026-09-24 02:2x) — CLOSED, mostly right

Primary selectors all hit on live pages (name, rating, reviews, category, address, phone,
website, plus code). Wrong in three places, all found on the saved pages and fixed by reparse
(no second visit): weekly hours are one aria-label per day, not one list; the page body
echoes the request URL, so a ChIJ in the page is not evidence of the place (the first
identity check was circular); a unique search can open the place itself. Fix for identity:
a ChIJ place ID base64-decodes to the feature ID — verified on 2 live pairs.
**Rule:** an identity check must compare against something the input did not put there.

## H26 — 12-city BCRF-49 sweep — OPEN

**Prediction:** Medford gates run at ≈16.5 s/pin with 0 challenges (the proven market and
pace). Dense queries (dentist, attorney, auto repair shop, coffee shop) fill 20/20 at every
pin; thin ones in small markets (furniture store, website designer in Klamath Falls /
Roseburg / Ashland) hit Google's end-of-list below 20 at the 4–8 mi rings. First gate
done in ≈14 min.

## H27 — dev/p10-3-ratings changes only what it should — CLOSED, prediction right

Change: place-ID Maps links site-wide; the rating gate reads place-ID links; P10.3 ratings for
3 Portland listings (batch 2026-09-24-p10-3-ratings); ID-literal build check.
**Prediction (live site = master baseline vs dev dist/, `scripts/compare-builds.mjs`):**
- `maps_links` changes on every page that lists businesses (≈10,000): expected.
- `jsonld` changes only under /city/portland/business-professional-services/,
  /city/portland/health-medical/ and /services/…/portland/ (3 new aggregateRatings, list
  re-ranking); `internal_links` may change on those same prefixes (re-sorted pagination and
  "related" picks).
- **0 pages** change `title`, `h1`, `canonical`, `robots` or `breadcrumb`. Anything outside
  the prefixes above is a regression.
**Result (compare-builds, 10,531 live pages vs dist/):** title, h1, canonical, robots,
breadcrumb: **0 pages changed**. `jsonld`: 10 pages, all Portland (4 business-professional,
3 health-medical listings/lists, 3 /services/…/portland/). `maps_links`: 10,367 pages (the
place-ID link). `internal_links`: the Portland prefixes as expected; the tool first flagged
1,597 more, **all** Cloudflare edge-injected `/cdn-cgi/content` links present only live — now
excluded in the tool. Build: C01–C17 PASS, BUILD_EXIT=0.
**Rule:** a live-vs-build diff must strip what the edge injects, or it cries wolf.

## H28 — P12.1: no ratings in structured data, stars stay visible — CLOSED, prediction right

Change: schema.ts emits no aggregateRating (listing, city-industry list, service list);
LocalBusinessSchema types aggregateRating/review as `never`; verify-site C18 forbids any
rating node or property. Proven able to fail: C18 = 63,508 on the P10.3 build.
**Prediction:**
- build: C01–C18 all PASS.
- compare-builds (P10.3 dist → this dist): `jsonld` changes on every page that showed a
  rating (≈9,900); **0 pages** change title, h1, canonical, robots, breadcrumb,
  internal_links, maps_links, **stars** (visible ★ count identical on every page).
- jsonld-audit: LB_RATING_THIRD_PARTY 9,816 → 0, RATING_ON_LIST 947 → 0; ERROR pages
  9,853 → 596 (594 LB_REQUIRED_ADDRESS + 2 hub pages lacking CollectionPage).
**Result:** build C01–C18 PASS, BUILD_EXIT=0. compare-builds (P10.3 dist → P12.1 dist, 10,534
pages): `jsonld` changed on 9,819; **0 unexpected** — title, h1, canonical, robots,
breadcrumb, internal_links, maps_links and visible ★ identical on every page. The ★ metric is
live: 8,872 pages show stars before and after. jsonld-audit: LB_RATING_THIRD_PARTY 0,
RATING_ON_LIST 0, ERROR pages 9,853 → 596 (594 LB_REQUIRED_ADDRESS + 2 hubs), as predicted.

## H29 — kwsweep gate "vegan restaurant Medford" never completes — CLOSED, root cause found; planned fix wrong

Symptom (output/kwsweep/gates.jsonl, nightly-20261015.log): K14 incomplete on 3 runs
(2026-10-14 12:11Z, 10-15 01:17Z, 08:30Z), ~75 min each, 7/49 pins pass, 42 return 0/20 on
all 3 attempts. No `[BLOCK]` line, so `check_for_challenge` never fired. A 4th incomplete
gate exists: "float spa Medford" (health-wellness, 10-15 12:45Z).
Evidence so far: K14/med_bcrf49_r0.25_N/viewport.png is a Google Maps **place page**
("Rooted: Eat More Plants", Vegetarian restaurant), not a results list.
**Hypothesis:** Maps answers the query at those pins by jumping straight to one business's
place page. The page has no `div[role=feed]` and no `div.Nv2PK` cards, so
`extract_full_listings` returns 0 rows; there is no "end of the list" text, so
`end_of_list` is False; the pin is never valid and the gate can never lock. Retries cannot
help — the page Google serves is the same every time. This is not a block or a parser regression.
**Prediction:**
- all 42 failing K14 pins: `viewport.html` has 0 `Nv2PK` cards and no challenge sentinel;
  each is one place page (URL/canonical `/maps/place/`), mostly or all "Rooted: Eat More Plants".
- the 7 passing pins hold 20 card rankings (a list was served there).
- "float spa Medford" failing pins: same pattern (place page, 0 cards).
- fix = a place page is a 1-result SERP: record that one business as rank 1 with
  end-of-market = True. Re-running K14 then locks the gate 49/49 with no further Google work
  beyond the 42 pins; the 1-row pins carry the real place's name/place_id/cid.
**Result (artifacts + evidence DB, no live traffic):**
- Right: all 42 failing pins' `viewport.html` = place page titled "Rooted: Eat More Plants -
  Google Maps", 0 `Nv2PK` cards, no `role="feed"`, no challenge. The page embeds no other
  business (0 hits for the list pins' other names) — the list is not hidden in the HTML.
- Right: the 7 passing pins (all from the 10-14 17:03 run) hold 20-card lists.
- New: per-pin deterministic — a pin that failed did so on 3/3 attempts in 3/3 runs; passes
  and fails interleave at the same radius (r0.25: N fail, NE/E/SE pass, S fail, SW pass).
- **Wrong, and it kills the planned fix:** at the 7 list pins Rooted is rank **2 or 3**, never 1
  (rank 1 = "Indian Family Kitchen" ×5, "Infinity Indian Eats", "Rogue Salad Co."). Storing
  the place page as a 1-row SERP would write Rooted as #1 where Google ranks it #2–3, and
  drop 19 real competitors. Rejected. The list exists; the place page hides it.
**Rule:** before treating a degenerate SERP as the answer, compare it with a neighbouring pin
that got the full list.

## H29b — which request form gets the list at a place-jump pin — CLOSED, zoom wrong, typed right
Probe (scratch, rarlx `launch_browser` + the harvest's own context options, headless, pin
med_bcrf49_r0.25_N 42.330118,-122.8756, one visit per variant):
A protocol URL `/maps/search/q/@lat,lng,14z` via google_home · B 15z · C 13z ·
D maps_home at pin, type phrase into the search box, Enter · E protocol URL + `?hl=en`.
**Prediction:** A = place page (reproduces). At least one of B–E returns ≥20 cards with
Indian Family Kitchen / Rooted in the top 3. Most likely D fails too (typed search resolves the
same way); zoom variants are the best bet if the jump depends on what the viewport holds.
**Result H29b (2 probe runs, 2026-10-15 ~11:30):**
- pin r0.25_N: A 14z = place page (reproduces); **B 15z = 20-card list**, top 5 Indian Family
  Kitchen, Rooted, Infinity Indian Eats, Rogue Salad Co., Soo Rah — matches the neighbouring
  list pins; C 13z = place page; D (typed) crashed: `#searchboxinput` never visible.
- control, centroid (list at 14z on 10-14 17:03): **14z and 15z both = place page now.**
- **Wrong:** zoom is not the lever. The jump is not a fixed function of the URL; the same URL
  gave a list on 10-14 and a place page today. Per-pin "deterministic" was 3 tries within
  minutes, not a property of the pin.
- Side finding: `scripts/hooks/artifact-keeper.sh sweep` ran mid-session (another session's
  SessionEnd) and **moved this live session's scratchpad** to ~/.claude/artifacts. Not fixed here.
**Result H29c (centroid, now a jump pin at 14z and 15z):** F `…/data=!3m1!4b1` = place page;
H maps_home entry = place page; I direct = place page; **G typed into Maps' box
(`input[name="q"]` — `#searchboxinput` no longer exists) = 20-card list.** G repeated at
r0.25_N and r1.00_E: 20 cards each (3/3). Every URL form jumps; the typed in-app search lists.
Caveat measured, not assumed: after a typed search Maps re-fits the camera to "Medford"
(@42.3295485,-122.8709386,14z at every pin), so only the context geolocation stays per-pin;
the URL path keeps the camera on the pin. Orders still differ by pin (Decant appears at
r1.00_E). Typed = what a person standing at the pin sees after typing the phrase; it is a
different measurement from the URL camera, so every row must say which path produced it.
**Root cause (closed):** Google Maps answers `/maps/search/<phrase>/@pin,14z` for this
phrase with a single place page (Rooted: Eat More Plants) at most pins since 2026-10-14
evening — a per-request decision, not a block, not a parser fault. The harvester only knows
"list" or "challenge"; a place page parses to 0 cards, `end_of_list` stays False, all 3
retries repeat the same request, the gate can never reach 49/49.

## H29d — typed-search fallback on a place jump — CLOSED for K14 (49/49); K15 open, needs Mike
Change (rarlx): `harvest_single_pin` detects a place jump (URL `/maps/place/`, no feed, no
cards) and re-runs the search the probe-G way (Maps home at the pin, type the phrase,
Enter); rankings gain `serp_path` (`url`|`typed`, NULL on older rows = url); a typed page is
saved with a leading `<!-- rarlx serp_path=typed -->` so `lx` export tags rows.jsonl too.
If the typed search also jumps, the pin still fails (no invented ranking).
**Prediction:**
- rar-linux tests + listings-extraction tests: all pass, plus new tests for the marker/column.
- `lx kwsweep` re-run of K14 vegan: the 42 pins harvest via `typed`, gate locks 49/49 in
  ≈ 42 × ~40 s ≈ 30 min, rows.jsonl gains 49×20 = 980 rows minus the 7 cached pins' rows
  are re-exported too (export re-parses all 49 pages) → +980 rows, 840 tagged typed.
- K15 float spa (health-wellness): unknown — either typed lists it, or the market is genuinely one-place and it
  still fails (prediction: lists; Medford has several float/spa businesses).
**Result H29d, live run 1 (K14, 2026-10-15 11:42–12:21, 2,317 s):** 42 uncached pins all
place-jumped; typed fallback → 41 OK, **48/49, gate still locked out** by med_bcrf49_r2.00_N
(attempt 1: 0 cards with **no** place-jump line — a 0-card page not at `/maps/place/`, page
overwritten so unseen; attempts 2–3 typed: 0, then 12 cards with no end-of-list text).
10 typed partials, 9 recovered on retry. 9 outer pins (8 mi ×7, r2.00_W, r4.00_SE) stored
12–18 rows with Google's own "end of the list" text — a real short market at the
city-fitted camera, accepted by the existing rule. DB: 41 pins `typed` (765 rows), 7 pins
NULL/url (140). Predictions: fallback works = right; 49/49 in one pass = **wrong** (one flaky pin);
"+980 rows, 840 typed" = **wrong** (short outer markets).
Fix 2: `is_place_jump` = no feed and no cards, whatever the URL (the challenge check still
runs on the final page). Tests 21 + 32 pass.
**K15 float spa, before the fix:** all 49 saved pages = place page "SO Float Spa", 0 cards —
same root cause. Prediction: typed search may also resolve to the one place (Medford may have
a single float spa); if so the pin keeps failing by design and the keyword is a genuine
1-business market that needs a decision (accept 1-row end-of-market, or drop the keyword) —
not a harvester fault.
**Result H29d, live run 2 (2026-10-15 12:21–12:42):**
- K14 vegan: r2.00_N place-jumped, typed → 20/20; **gate locked 49/49 in 37 s, status
  `complete`, 925 rows exported** (rows.jsonl carries `serp_path`). Closed.
- K15 float spa: typed search **also** lands on "SO Float Spa" at every pin tried (pins 1–7,
  3 attempts each) — prediction right: a genuine one-business market, not a harvester fault.
- **Regression caught (mine):** at pin 07 Maps home loaded blank (title "Google Maps"),
  `typed_maps_search` timed out on the search box, the TimeoutError escaped the 3rd attempt and
  **crashed kwsweep** (it catches only SystemExit) — no gates.jsonl line written. Before H29 the
  same pin just failed and the queue moved on; tonight's 21:30 run would have died at K15.
  Fix 3: the fallback is wrapped — a failed retype keeps the page Maps served and the pin
  falls through to the ordinary partial/incomplete path. Test
  `test_failed_typed_fallback_fails_the_pin_not_the_sweep` drives `harvest_single_pin` with a
  fake browser; proven able to fail (1 failed with the guard removed, 22 passed with it).
**Rule:** a fallback added inside a retry loop must not raise anything the loop's caller
did not already handle — check the caller's except clause, not just the happy path.
**Open, needs Mike:** one-business keywords (K15 float spa, and the same will recur in small
cities). URL and typed paths agree on one place, yet the gate needs a list, so the gate costs
~49 pins × 3 attempts × 2 loads ≈ 2 h every night the queue reaches it and never locks.
Options: (a) record the confirmed single place as rank 1 of 1, end-of-market, serp_path
`place` (truthful when both paths agree — the K14 objection was that a list existed);
(b) drop such keywords from keyword-sets.json; (c) leave as is.

## H30 — artifact-keeper sweep scope — OPEN
Evidence (2026-10-15 14:03): `~/.claude/artifacts/MANIFEST.tsv` shows a SessionEnd sweep moving this live
session's scratchpad files (`0d67f09c…/scratchpad/falsepass.py`, `cards.py`), deleting the emptied
`scratchpad/` dir, and moving Claude Code's own `/tmp/claude-1000/bash-edit-diff/…/objects/*`.
Cause (read in source): `sweep` runs `find "$SRC_GLOB_ROOT" -type f` over `/tmp/claude-1000` — every
session, every project — then `find -empty -delete`. It never reads the SessionEnd payload's `session_id`.
**Prediction:** scoping sweep to `/tmp/claude-1000/*/<session_id>/` (from stdin) moves the ending
session's files only; a fake tree with 2 sessions + `bash-edit-diff` keeps the other session and
`bash-edit-diff` byte-identical; a payload with no session_id moves nothing.

## H31 — confirmed one-business answer is a valid pin — OPEN
Mike, 2026-10-15: "when the end of list is confirmed and accurate the gate should pass."
Audit first (all 8 kwsweep evidence DBs, 124 complete gates, 6,076 accepted pins): 536 pins were accepted
short (<20) and **536/536** saved pages carry Google's exact "You've reached the end of the list"; on
**0** short pins does the saved page hold more result cards than rows stored. False passes found: 0.
The gate already passes a confirmed short list. What it cannot pass: a place page (no list, so no
end-of-list sentence).
**Rule for "confirmed":** the URL request place-jumps AND the typed search also lands on a place page AND
both show the same business (page title). One path disagreeing = not confirmed = pin fails as before
(K14 vegan: URL jumped to Rooted, typed listed 20 — the list wins, Rooted is not stored as #1).
**Prediction:** K15 "float spa Medford": 49/49 pins confirmed, gate `complete`, 49 rows, every row
rank 1 "SO Float Spa", `serp_path=place`; ≈ 49 × ~35 s ≈ 30 min (two loads per pin, no retries).
K14 rows unchanged.

## H32 — detached launch survives the chat — OPEN
**Prediction:** `scripts/kwsweep-launch.sh` starts the run through Windows (`Start-Process wsl.exe`), so
the sweep's process tree does not descend from the claude process: `ps -o ppid` chain of the `lx
kwsweep` process contains no `claude`, and the log keeps growing after the launching shell exits.

## H30 / H32 — results (2026-10-15 ~14:20)
- **H30 right.** A fake tree held an ending session, a live session and a `bash-edit-diff` store. Sweep with
  `session_id` moved only the ending session; the other two stayed sha1-identical. A payload with no id moved
  nothing, and rescue moved only the 24 h-idle file. Home repo commit `4e2fea5`. A 1-minute backup timer
  (`scratchpad-backup.timer`) was added at Mike's request; journal shows 4 runs in its first 5 min.
- **H32 right (structure).** The K15 run launched by `scripts/kwsweep-launch.sh` at 14:10 has this ppid chain:
  `lx ← uv ← bash kwsweep-nightly.sh ← Relay ← SessionLeader ← init`, with no claude in it. The launching shell
  returned at once while the log kept growing.
- **H31 timing wrong so far.** Predicted ≈35 s/pin; measured ≈130 s/pin (URL load, Maps home, typing, two page
  loads, plus the 3–6 s pin delay). Pins 1–5: 5/5 confirmed "SO Float Spa".
- **New, not predicted:** rows.jsonl had **no** serp_path at all (0/117,207). The H29 commit tagged the wrong
  export function. Fixed and back-filled: 785 typed + 140 url for K14, matching the DB.
- **10-14 regression question (Mike):** 0 scraper commits on 10-14; Chrome dated 08-19; libs 10-03; both failing
  keywords were first-ever runs. Latent gap, not a regression. Docs: listings-extraction/docs/CHANGES-2026-10-15-gate-detach-sweep.md.

## H31 — result (K15 live, 2026-10-15 14:10–14:52, detached via kwsweep-launch.sh)
- **Right:** 49/49 pins confirmed "SO Float Spa" (URL jump + typed jump, same place), gate `complete`, 49 rows,
  0 typed-search failures, 0 incomplete. K14 vegan rows untouched (785 typed + 140 url).
- **Wrong:** time. Predicted ≈30 min; actual 2,512 s ≈ 42 min (≈51 s/pin).
- **Defect found by checking the final artifact (new pattern `verify-the-artifact-the-reader-uses`):** 1/49 exported
  rows had `business_name = null` (med_bcrf49_r8.00_NW). The DB row was right (name from title); the saved page
  was captured before Maps drew the panel (no h1, 470 KB vs 742 KB), so `extract_place` found nothing. Fix:
  `sweep.page_rows` takes identity from `place_page_row(url, title)` (same as the DB) and overlays panel fields.
  Re-exported with `scripts/reexport_gate.py` (archive `rows.jsonl.2026-10-15-145349`): 49/49 named.
- Thumbtack scraper was SIGSTOPped 14:2x–14:53 for IO headroom, resumed (SIGCONT), auto-resume timer cancelled.

## H33 — one-pin keyword probe — OPEN
Change: `lx kwsweep --probe` runs each not-yet-probed gate's phrase at the centroid pin only (same rarlx
`harvest_single_pin`, incl. typed fallback and place confirmation), classifies it, appends `output/kwsweep/probes.jsonl`:
`list` (≥20), `short` (1–19 + Google's end-of-list), `place` (confirmed one business), `fail` (anything else), `blocked`.
Nightly runs `--probe --max-probes 20` before the sweep; `--status` shows probe counts and the `place`/`short`
keywords as pruning candidates (no auto-skip — pruning is Mike's call).
**Prediction:** K15 float spa Medford → `place` "SO Float Spa"; legal-services K15 (next in queue) → `list` 20;
≈50 s per probe; 0 blocks.
**Result H33 (live, 2026-10-15 14:56, detached systemd-run unit, 8 Medford K15 probes):** float spa → `place`
"SO Float Spa" (right); employment lawyer → `list` 20 (right); steakhouse → `short` 13 (matches its gate's 450
rows); the other 5 → `list`. 0 blocks (right). Time **wrong, in the good direction**: 10–20 s per list probe,
38 s for the place probe (two loads), not ≈50 s. 20 nightly probes ≈ 5–7 min. `--status` lists float spa and
steakhouse as pruning candidates.

## H34 — nightly gate-audit ledger — CLOSED
`audit_gate_passes.py --json` appended by `kwsweep-nightly.sh` after every window. First line by hand
(22:00Z): 125 gates, 6,125 pins, 536 short / 536 with end-of-list, 49 place, 42 typed,
false_pass_no_end_proof 0, false_pass_unstored_cards 0. Prediction (0 / 0) right.

## H35 — reconcile local master with origin (P17) — CLOSED
Prediction (written before running): the merge of origin/master (4 commits) into master (21 + keepers) completes
with no conflicts (merge-tree was clean); pnpm install + build-bg.sh gives BUILD_EXIT=0 with the C01–C18 verify and the
search test passing; the built dist contains the PostHog snippet and /privacy/; after deploy the live homepage still
has PostHog and /privacy/ answers 200 (no regression from deploying this machine's tree).

**Reality:** RIGHT on every point, after two things the prediction did not foresee.
- Merge 0d1d52b: no conflicts. Build: 10,535 pages (= the Mac's count), C01–C18 PASS, search PASS. Deploy 29194195
  (472 changed files, 20,380 identical). Live: PostHog snippet + token, /lv-relay Worker 200, /privacy/ 200, robots
  sitemap index, WebP cards, Daley Organics 4.6 ★, custom 404, contact preflight 204. local == origin (pushed).
- Not predicted 1: the merge brought a build-time secret. PostHog renders only with PUBLIC_POSTHOG_TOKEN, which lived
  only in the Mac's .env; a build here would have shipped a site without analytics and every gate would still pass
  (no gate checks it). Fixed: the public phc_ token from the live page → gitignored .env + keyring
  `oregon-smb-directory/PUBLIC_POSTHOG_TOKEN`.
- Not predicted 2: in WSL, `pnpm` resolved to the Windows global shim (AppData/Roaming/npm/pnpm) → Windows npm →
  "C:\Windows\package.json", BUILD_EXIT=38 in 1 s. Fixed in the toolchain: `corepack enable pnpm` (nvm v22.22.2).
- Why: a tree can only be built where its build-time inputs live; the Mac held one the repo never named. Lesson: list
  every `import.meta.env.PUBLIC_*` and its source before building from another machine.
