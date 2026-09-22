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
