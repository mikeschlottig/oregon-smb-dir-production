# Oregon SMB Directory — ship checklist

**Standard: 1% wrong is 100% failure.** Every line below is binary and machine-checked.
Nothing on this list is satisfied by inspection, sampling, or a screenshot. The command
in each row is the proof; if it does not run, the row is not passed.

Enforced by `scripts/verify-site.mjs`, which reads **every** page in `dist/` — 10,583
pages at baseline — and exits non-zero on a single failure. It is wired into
`npm run build`, so a malformed breadcrumb cannot reach `wrangler deploy`.

Run everything:

```bash
npm run build                      # audit:publication && astro check && astro build && verify
node scripts/verify-site.mjs       # re-run the gate alone against an existing dist/
node scripts/verify-site.mjs --report-only --json reports/site-verify.json
```

---

## A. Structured data

| id | check | passes when | proof |
|---|---|---|---|
| **C01** | `JSONLD_PARSE` | every `<script type="application/ld+json">` on every page parses as JSON | `verify-site.mjs` C01 = 0 |
| **C11** | `FAQ_SHAPE` | every `FAQPage` has a non-empty `mainEntity`; every entry is a `Question` with a non-empty `name` and a non-empty `acceptedAnswer.text` | C11 = 0 |
| **C14** | `SCHEMA_REQUIRED` | required fields present per `@type`: `LocalBusiness.name` (+ full `PostalAddress` when an address is emitted); `BlogPosting` headline/datePublished/author.name/publisher.name/publisher.logo.url/mainEntityOfPage; `Report` name+url; `CollectionPage`/`WebPage` name + a `url` equal to **this page's** URL; `Organization`/`WebSite` name+url; `numberOfItems` equals the actual list length; `ListItem.position` is 1..n in order; `aggregateRating.ratingValue` is 1–5 and `reviewCount` is a positive integer | C14 = 0 |

**Escaping.** `JsonLd.astro` and `FaqSchema.astro` both escape `<`, `>` and `&` before
`set:html`. Neither may be changed to emit raw `JSON.stringify` — one ampersand in a
business name breaks that page's block, and C01 is what catches it.

## B. Breadcrumbs

Every breadcrumb on the site comes from **one** declaration per page: `trail([...])` in
`src/lib/breadcrumbs.ts`. `visibleTrail()` renders it and `breadcrumbListSchema()` marks
it up. A page may not hand-build either one — that is what produced the drift being
repaired here.

| id | check | passes when | proof |
|---|---|---|---|
| **C02** | `BREADCRUMB_PRESENT` | every indexable page carries exactly one `BreadcrumbList`. Exempt: `/` (carries WebSite + Organization; a one-item trail says nothing), `/404.html`, and Astro redirect stubs | C02 = 0 |
| **C03** | `BREADCRUMB_SHAPE` | each `itemListElement` is a `ListItem` with a non-empty `name`; each non-final item's `item` is a URL string (or an object carrying `@id`) | C03 = 0 |
| **C04** | `BREADCRUMB_POSITION` | `position` runs 1..n, contiguous, in document order | C04 = 0 |
| **C05** | `BREADCRUMB_HOME` | the first crumb is named `Home` and its `item` is exactly `https://oregonsmbdirectory.com/` | C05 = 0 |
| **C06** | `BREADCRUMB_TERMINAL` | the final crumb is the current page; if it carries `item` at all, that URL equals the page's canonical URL | C06 = 0 |
| **C07** | `BREADCRUMB_URLS` | every crumb URL is absolute, on-origin, ends in a trailing slash, and resolves to a page the build emitted | C07 = 0 |
| **C08** | `BREADCRUMB_MATCH` | the visible trail equals the JSON-LD trail, label for label, in order. The visible trail is found by `nav[data-breadcrumb]` and read from its `[data-crumb]` elements | C08 = 0 |

## C. Routes and canonicals

| id | check | passes when | proof |
|---|---|---|---|
| **C09** | `CANONICAL` | every page has exactly one `<link rel="canonical">`, absolute, equal to its own URL. Exempt: `/404.html` and redirect stubs, which point at their target by design | C09 = 0 |
| **C10** | `LINKS` | every internal `href` resolves to a file the build emitted | C10 = 0 |
| **C15** | `TRAILING_SLASH` | every internal link uses the canonical trailing-slash spelling. A link to the non-slash form still resolves but names a second URL for one page | C15 = 0 |
| **C16** | `SITEMAP` | a sitemap exists; every URL in it is on-origin and resolves; no `noindex` page appears in it | C16 = 0 |

**One route definition per URL.** `src/data/dedicatedPages.ts` lists URLs owned by a
hand-written page; the dynamic business route skips them. Adding another hand-written
page without adding it to that set re-creates the collision.

## D. Content

| id | check | passes when | proof |
|---|---|---|---|
| **C12** | `FAQ_UNIQUE` | no two pages share an identical FAQ answer **set**, and no single FAQ answer text appears on more than one page | C12 = 0 |
| **C13** | `THIN` | every indexable content page renders at least **150 words** inside `<main>` | C13 = 0 |

**Scope of C13.** The floor governs indexable content pages. Two declared exemptions,
both visible in the HTML so the gate can see them rather than trusting a list:

- `<body data-page-kind="utility">` — contact, editorial policy, accessibility. These are
  indexable and deliberately short; padding them would be exactly the generic filler this
  repair removes.
- `<meta name="robots" content="noindex, follow">` — a page withheld from the index is not
  competing for a ranking. Currently only `/best-of/`, which has zero lists to show, and
  which `astro.config.mjs` also excludes from the sitemap.

**Pagination floor.** `src/lib/paginate.ts` folds any final page holding fewer than
`MIN_LAST_PAGE` (6) items back into the page before it. Six cards is the smallest slice
measured to clear the 150-word floor at ~24 words per card plus ~40 words of furniture.

## E. Data integrity

| check | passes when | proof |
|---|---|---|
| Category placement | no listing sits in an industry shard its provider category unambiguously contradicts | `node scripts/fix-categories.mjs --dry` reports 0 moves |
| Publication gates | ratings publish only with value, review count, observation date and record identity in agreement | `npm run audit:publication` exits 0 |

The category rule is intentionally narrow: a listing moves only when its shard holds ≤2 of
that provider category **and** the majority industry holds ≥10× as many. Genuinely
cross-industry categories are left alone — "Massage therapist" is 259 health-wellness and
54 beauty-personal-care and both are correct. Generic labels ("Store", "Shop", "Business",
"Service", "Establishment") are excluded outright: their majority is noise, not signal.

## F. Ship gate

1. `npm run build` exits 0 — this runs `audit:publication`, `astro check`, `astro build`,
   then `verify-site.mjs`.
2. `node scripts/verify-site.mjs` reports **0** for C01–C16.
3. `npx wrangler deploy`.
4. Re-run the gate against the deployed origin before calling it done.

---

## What this checklist does not cover

Stated so the gaps are chosen rather than missed:

- **Google's own validators.** `verify-site.mjs` encodes Google's documented requirements;
  it is not the Rich Results Test. A sample of one URL per page type should still be run
  through the live validator — the gate is what makes that sample meaningful rather than
  the only evidence.
- **Redirect chains at the edge.** The gate checks links inside `dist/`. Chains introduced
  by Cloudflare rules or DNS are outside it and need a crawl of the live origin.
- **Rendered layout and visual regressions.** Nothing here looks at the page.
- **Whether the content is any good.** C13 counts words. It cannot tell prose from filler,
  which is why the FAQ repair removed blocks rather than rewriting them.
- **Search Console truth.** Coverage, impressions and actual rich-result eligibility are
  only observable post-deploy, over weeks.
