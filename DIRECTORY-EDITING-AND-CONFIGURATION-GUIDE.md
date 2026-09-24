# Directory Editing & Configuration Guide — oregonsmbdirectory.com

This guide says exactly where to make each kind of change and how to ship it. Every path
here is relative to `/home/mikes/oregon-smb-directory`, and every one was checked against
the code on 2026-09-23. If a path here stops matching the code, fix this file in the same
commit.

---

## 0. How the site works, in one diagram

```
src/data/cities.ts ─────────┐
src/data/industries.ts ─────┤   getStaticPaths loops every city × every industry
                            ▼
src/data/businesses/<city>__<industry>.json  ──►  src/data/businesses.ts  (imports every shard)
                            │                          │
                            │                          ▼
                            │               src/data/publication-gates.ts   ◄── src/data/rating-evidence.json
                            │               (strips anything unproven:        (ratings are only shown
                            │                rating, website, verified)        if they match this file)
                            ▼                          │
                  getBusinesses(city, industry) ◄──────┘   every page reads through this
                            │
     ┌──────────────────────┼──────────────────────────────┬────────────────────────────┐
     ▼                      ▼                              ▼                            ▼
/city/<city>/        /city/<city>/<industry>/      /city/<c>/<i>/<business>/     /services/<industry>/<category>/<city>/
[citySlug].astro     [industrySlug].astro          [businessSlug].astro          (matched by serviceCategories +
                                                   + premiumListings.ts           serviceSelectionPolicies)
                                                   + listingBanners.ts
```

- **Astro builds everything to `dist/`.** There is no server and no database at runtime.
- **The Worker `oregonsmbdirectory-site` serves `dist/` as static files.** It's configured
  in `wrangler.jsonc`.
- **A change reaches the site only through build → deploy** (section 9). Editing a file
  changes nothing live until then.

**Rules that apply to every edit:**

1. **Listing data lives only in the shards.** Pages never hard-code a rating, a
   verification status, or a website. The one exception is the two dedicated pages in
   section 2.7, and those read the shard too.
2. **The gates decide what shows.** If a field is missing its proof, the page silently
   hides it. Section 2.3 lists each proof.
3. **Ratings and review counts come from Mike, never from an agent browsing Google.**
   Agents never open Google in a browser (see memory `google-services-stealth-only`).
4. **Archive, never delete.** Removed material goes to
   `_archive/<name>-<YYYYMMDD-HHMMSS>/`, with a `README.md` explaining what was removed and
   how to restore it.

---

## 1. "I want to…" — quick map

| I want to… | Edit this | Section |
|---|---|---|
| Add a business | new batch in `requests/listings/` → `node scripts/add-listings.mjs` | 2.1 |
| Mark a business Verified | its `verification` object in the shard, via a patch batch | 2.3 |
| Change stars or review count | `rating`/`reviews` in the shard **and** `src/data/rating-evidence.json` | 2.4 |
| Link or change a website | `website` + `websiteValidation` in the shard, via a patch batch | 2.3 |
| Add an owner banner image | `public/images/listings/` + `src/data/listingBanners.ts` | 2.5 |
| Make a listing premium | `src/data/premiumListings.ts` | 2.6 |
| Add a city | `src/data/cities.ts`, image, 12 shard files, `businesses.ts`, `SearchBar.astro` | 3 |
| Add an industry | `src/data/industries.ts`, 12 shard files, `businesses.ts` | 4 |
| Add a service category (e.g. roofing) | `src/data/serviceCategories.ts` + `src/data/serviceSelectionPolicies.ts` | 5 |
| Write or edit a blog post (article) | `src/content/blog/<slug>.mdx` | 6.1 |
| Change how blog posts look | `src/pages/blog/[slug].astro` | 6.1 |
| Write or edit a research report | `src/content/research/<slug>.md(x)` | 6.2 |
| Change how reports look | `src/pages/research/[slug].astro` | 6.2 |
| Publish a Best Of list | `bestOfLists` in `src/data/content.ts` | 6.3 |
| Change the home page's featured blog/report/Best Of | `src/data/blog-posts.json`, `src/data/content.ts` | 6.4 |
| Add a redirect | `redirects` in `astro.config.mjs` | 7 |
| Change colors or fonts site-wide | `src/styles/tokens.css`, `src/styles/globals.css`, `tailwind.config.ts` | 7 |

---

## 2. Listings (businesses)

### 2.1 Add a new business — step by step

1. **Pick the shard.** The shard is `src/data/businesses/<city-slug>__<industry-slug>.json`,
   for example `grants-pass__retail-shopping.json`.
   - The file must already exist; the add script refuses a missing shard.
   - For a new city or industry, do section 3 or 4 first.
   - A business listed under two industries is **two records in two shards**. They share
     the same slug, and you edit both every time (see 2.8).
2. **Collect the facts.**
   - **Name, address and phone.** Use the business's own formatting, e.g. `(541) 441-0510`.
   - **Website.** The exact URL the owner gives, character for character.
   - **Google Maps place URL.** It must contain the `0x…:0x…` feature ID.
   - **Rating and review count, from Mike.** Never go and look them up yourself.
   - **Category.** Google's primary category, e.g. "Mulch supplier".
3. **Write a batch file** at `requests/listings/<YYYY-MM-DD>-<topic>.json`. The format
   matches `requests/listings/2026-09-23-daley-organics.json`:
   ```json
   {
     "batch": "2026-09-23-example",
     "source": "who asked, when, and what they asked for",
     "checkedAt": "2026-09-24T01:16:00Z",
     "listings": [
       { "mode": "add", "tier": "verified", "shard": "grants-pass__retail-shopping",
         "record": { "slug": "example-co", "title": "Example Co", "address": "…",
                     "phone": "…", "category": "…", "website": "https://example.com",
                     "googleUrl": "https://www.google.com/maps/place/…0x…:0x…",
                     "rating": 4.8, "reviews": 52,
                     "verification": { … see 2.3 … },
                     "websiteValidation": { … see 2.3 … } } }
     ]
   }
   ```
   - `"mode": "add"` appends a new record; `"mode": "patch"` merges fields into the
     existing record with that slug.
   - The slug must be kebab-case and unique within the shard.
4. **Dry-run the batch:** `node scripts/add-listings.mjs requests/listings/<file>.json --dry`.
   - The script refuses anything the gates would silently strip: a website without a
     confirmed validation, or a verification without evidence IDs.
   - Read every error it prints and fix the batch.
5. **Apply it:** run the same command without `--dry`. Shards are edited as text, so the
   diff shows only your change.
6. **If there's a rating,** add the evidence entry (section 2.4).
7. **Optional extras:** a banner (2.5) or a premium profile (2.6).
8. **Build, check, deploy, and verify live** (section 9). Then commit the batch, the shard
   diff and any evidence change together.

### 2.2 What a record holds

The type is `Business` in `src/data/businesses.ts`.

- **Fields:** `slug`, `title`, `address`, `phone`, `email`, `rating`, `reviews`,
  `category`, `website`, `googleUrl`, `verification`, `websiteValidation`.
- **Legacy flags:** `claimed: true` and `verified: true` still appear on old records.
  **They do nothing.** The gate deletes them before publishing (`sanitizeBusiness` in
  `src/data/publication-gates.ts`).

### 2.3 Verified status and the website link

**Verified badge.** The listing shows "Verified" only when its `verification` object:

- has at least one entry in `evidenceIds`, **and**
- has a `status` that counts as verified. The set lives in
  `src/pages/city/[citySlug]/[industrySlug]/[businessSlug].astro` (`verifiedStatuses`):
  `directory_reviewed`, `contact_details_checked`, `owner_claimed`,
  `owner_identity_verified`, `license_verified`.

```json
"verification": {
  "status": "directory_reviewed",
  "scope": ["business_name", "address", "phone", "website"],
  "method": "Name, address, phone and website checked against the Google Business Profile on September 23, 2026.",
  "verifiedAt": "2026-09-23T18:16:00-07:00",
  "ownerParticipated": false,
  "evidenceIds": ["operator:mike@leverageai.network@2026-09-23", "web:example.com@2026-09-23"]
}
```

- **`method` is printed on the page, word for word,** in the "Data provenance" block. Write
  it for a reader, not as an internal log.
- **`verifiedAt` is printed as a UTC date.** Write it with the Pacific offset
  (`-07:00`/`-08:00`), or a late-evening check shows up as tomorrow.
- **`ownerParticipated: true`** changes the page sentence to "The business requested this
  listing…". Use it only when the owner asked.

**Website link.** The link shows only when `websiteValidation` meets all of these (see
`getWebsiteStatus` in `publication-gates.ts`):

- `url` equals `website` character for character. `https://x.com` and `https://x.com/`
  are different.
- `resolutionStatus` is `"confirmed"`.
- `lastCheckedAt` is set.
- `confirmationSources` has at least one entry.
- `riskFlags` is empty.

Any website on a suspicious top-level domain (`.buzz .click .info .link .live .site .top
.xyz`) or on a directory host (Google, MapQuest, Yellow Pages, Yelp) is quarantined no
matter what.

**To change a business from unverified to verified:** write a `"mode": "patch"` batch
carrying only `slug`, `verification` and (if linking) `website` + `websiteValidation`, for
**every shard the business appears in**. Then apply it, build and deploy.

### 2.4 Star rating and review count

A rating shows only when **all three** hold (see `buildRatingObservation` in
`publication-gates.ts`):

1. The record has a numeric `rating` (0–5) and an integer `reviews`.
2. The record's `googleUrl` contains a feature ID `0x…:0x…`. When the URL has several,
   the last one counts.
3. `src/data/rating-evidence.json` maps that feature ID to exactly `"<rating>|<reviews>"`,
   e.g. `"4.6|10"`. Write the number exactly as it is in the record: the record's `5` is
   `"5|16"`, not `"5.0|16"`.

**To update a rating:**

1. **Change the record.** Patch `rating` and `reviews` in **every shard the business
   appears in**.
2. **Change the evidence.** In `rating-evidence.json`, add or update the entry under
   `supplements`. Put it in the newest supplement block, or start a new block with its own
   `observedAt`. Never edit the July 2026 base `observations` for a new reading; that
   would backdate it.
   ```json
   "supplements": [
     { "source": "google_business_profile",
       "observedAt": "2026-09-23T18:16:00.000-07:00",
       "reportedBy": "Mike Schlottig, directory operator, from the Google Business Profile",
       "observations": { "0x54c574367c852899:0x2759c1273f2ee03d": "4.6|10" } }
   ]
   ```
   The gate and `scripts/audit-publication.mjs` both read supplements newest-first, then
   the base import.
3. **If the numbers don't match exactly,** the rating is silently hidden. The page then
   shows "N/A", and the build's publication audit counts it under `ratingsSuppressed`.

**How a rating change spreads:**

- **Same business, other industries.** The evidence is keyed by feature ID, so one
  evidence entry serves every shard that lists the business. Each shard's record still
  needs its own `rating`/`reviews`, and a record with stale numbers is hidden.
- **The business page.** It shows the header stats (Rating, Reviews), an
  `aggregateRating` in the structured data, and the sentence "observed <Mon YYYY>".
- **The city-industry page** (`/city/<city>/<industry>/`) re-sorts and re-ranks. The
  "N of them rate higher" sentences on business pages are computed from that same shard.
- **The services pages** (`/services/<industry>/<category>/<city>/`) pick it up
  automatically, because they read the same `getBusinesses()`.

### 2.5 Banner image (owner-supplied)

1. **Put the image in** `public/images/listings/<business-slug>-banner.<ext>`. Anything in
   `public/` is served at the same path.
2. **Add an entry to** `src/data/listingBanners.ts`:
   - key: `"<city-slug>/<business-slug>"`, so one banner serves every industry that business
     is listed under in that city
   - `src`, `alt`, and the image's real `width`/`height`
   - `source`: who supplied it and when
3. **It renders in the header** (`src/components/TldrCard.astro`, prop `image`) on the
   dynamic business page. A dedicated page must pass `image={getListingBanner(...)}`
   itself, as the Daley retail page does.

### 2.6 Premium profile

- **Where:** add an entry to `src/data/premiumListings.ts`. The key is
  `"<city>/<industry>/<slug>"` and must match a published record, or the build fails.
- **What it replaces:** the standard page body, rendered by
  `src/components/PremiumListing.astro`.
- **What it adds:**
  - the banner eyebrow and statement in the header
  - a quick answer, about text, services, service areas, facts, hours and FAQs
  - `FAQPage` structured data
- **What each statement must trace to:** the owner's submission, the business's website,
  or its Google profile. List the sources in `sources`.

### 2.7 Dedicated (hand-written) business pages

There are two, both static files that shadow the dynamic route:

- `src/pages/city/grants-pass/business-professional-services/leverageai/index.astro`
- `src/pages/city/grants-pass/retail-shopping/daley-organics/index.astro`

Their URLs are listed in `src/data/dedicatedPages.ts`, so the dynamic route skips them.
Their prose is written in the file. Their rating, verification and website must be read
from the gated record (`businesses.find(b => b.slug === …)`), as the Daley page does. The
LeverageAI page still hard-codes `verified: false` and has no rating, so fix it the same
way before verifying LeverageAI.

### 2.8 One business, several industries or cities

- **Separate records.** Each `<city>__<industry>` shard holds its own record, so a
  business in two industries has two records and gets two URLs.
- **Edit all of them.** Every edit (verification, rating, website) must be made in every
  record. List every shard in the same batch; the Daley batch patches both of its shards
  in one file.
- **Find every shard a business is in:**
  `grep -l '"slug": "<slug>"' src/data/businesses/*.json` (use `command grep` in this
  shell).
- **Shared, keyed by city and slug:** banners.
- **Shared, keyed by feature ID:** rating evidence.
- **Per URL:** premium profiles and dedicated pages.

### 2.9 Maps link and embed (known limitation)

In `[businessSlug].astro`:

- **"Open in Google Maps"** and **"Get Directions"** use `googleUrl`.
- **The embedded map** uses coordinates only when `googleUrl` has `query=<lat>,<lng>`
  (`parseLatLng` in `businesses.ts`). Otherwise it searches Google for "title + address".
  A place URL like `/maps/place/…/@lat,lng…` isn't parsed, so the embed is a name
  search, not the pinned place.
- **Premium `geo`** overrides both.

A proper fix is a code change to `parseLatLng`. It hasn't been made yet.

---

## 3. Add a city

Every item is required. A missing one fails the build or leaves dead links.

1. **Image:** add `src/images/cities/<city-slug>.jpg`.
2. **City record:** add it in `src/data/cities.ts`.
   - Import the image at the top.
   - Add `{ name, slug, population, tagline, description, image, region, county }` to
     `cities`.
   - The array order is the display order.
3. **Shard files:** create one `src/data/businesses/<city-slug>__<industry-slug>.json` for
   **each** industry in `src/data/industries.ts`. Content is `[]` if there are no listings
   yet.
   - Empty shards are fine: `astro.config.mjs` keeps empty city-industry pages out of
     the sitemap automatically.
4. **Shard wiring:** in `src/data/businesses.ts`, add one `import` line and one `map`
   entry per new shard, next to the existing ones. **Nothing generates this file.** It's
   edited by hand, and a missing entry makes that page render with zero listings.
   **Mike's decision, 2026-09-23: it stays hand-wired.** Don't build a generator for it
   unless one has been proven and kept working on a separate, non-live site. The last
   attempt broke the live site and hurt it with Google.
5. **Search dropdown:** `src/components/SearchBar.astro` has its **own hard-coded city
   list**. Add the city there too.
6. **Build.** The pages `/city/<slug>/`, `/city/<slug>/<industry>/` and the services city
   pages are generated automatically from `cities`.

## 4. Add an industry

1. **Industry record:** add it in `src/data/industries.ts` as
   `{ name, slug, description, icon, iconBg, iconColor }`.
   - `icon` is a lucide-react icon name, e.g. `"Wrench"`. A wrong name silently falls back
     to a circle (`src/components/cards/IndustryCard.tsx`).
2. **Shard files:** create `src/data/businesses/<city-slug>__<new-industry-slug>.json`
   (`[]` if empty) for **every** city.
3. **Shard wiring:** add the imports and `map` entries in `src/data/businesses.ts`.
4. **Service categories:** optional, see section 5.
5. **Build.**

To move listings that were filed under the wrong industry, use
`npm run audit:categories`, which is a dry run of `scripts/fix-categories.mjs`.

## 5. Add a service category (e.g. roofing, plumbing)

Service pages live at `/services/<industry>/<category>/` and
`/services/<industry>/<category>/<city>/`.

1. **Category:** add an entry to `serviceCategories` in `src/data/serviceCategories.ts`:
   - `slug` and `industrySlug` (an existing industry)
   - `displayName` and `pluralName`
   - `shortDescription` and `tldr`
   - licensing fields
   - `matchTerms` and `relatedCategories`
   - `sections` (each with a title, body and takeaways) and `faqs`
2. **Selection policy:** add a policy keyed by the category slug in
   `src/data/serviceSelectionPolicies.ts`, with included and excluded provider categories
   or terms. This decides which businesses qualify, by their Google category.
3. **City-industry links:** a category appears on a city-industry page only when enough
   businesses in that city match it. The threshold is set in
   `src/pages/city/[citySlug]/[industrySlug].astro`.
4. **Page layout:** `src/pages/services/[industrySlug]/[categorySlug]/[citySlug].astro` and
   `…/index.astro`.

---

## 6. Content: blogs, reports, Best Of, articles

"Article" on this site means a **blog post**. The per-premium-listing "dedicated article"
from the owner-listings handoff hasn't been built yet.

### 6.1 Blog posts

- **Content:** one file per post, `src/content/blog/<slug>.mdx`. The file name becomes the
  URL `/blog/<slug>/`.
- **Frontmatter schema:** `blog` in `src/content.config.ts`.
  - Required: `title`, `excerpt`, `category`, `author`, `date`.
  - Optional: `topics`, `city`, `citySlug`, `readTime`, and others.
  - A post missing a required field fails the build.
- **Categories:** the `category` must match a `name` in `src/data/blogCategories.ts`,
  which holds each category page's description.
- **Formatting, one post:** `src/pages/blog/[slug].astro`.
  - Header, byline and table of contents are in the markup.
  - Body typography is the long Tailwind `prose …` class list on the content `<div>`
    (headings, links, tables, `aside.callout` boxes).
- **Formatting, listings:** `src/pages/blog/index.astro`, `blog/page/[page].astro`,
  `blog/category/[category]/index.astro` and `…/page/[page].astro`.
- **Table of contents:** `rehype-toc` over H2/H3, configured in `astro.config.mjs`
  (`mdx.rehypePlugins`).

### 6.2 Research reports

- **Content:** `src/content/research/<slug>.md` or `.mdx`, served at `/research/<slug>/`.
- **Schema:** `research` in `src/content.config.ts`. Required: `title`, `summary`.
  `featured`, `citySlug` and `industrySlug` are optional.
- **Formatting, one report:** `src/pages/research/[slug].astro`, with body typography in
  its `prose …` class list.
- **Formatting, index:** `src/pages/research/index.astro`.
- **Not used for these pages:** `src/data/content.ts` → `researchReports` (empty) and
  `src/components/ReportReader.tsx` (no page imports it). The same goes for
  `src/data/reports/southern-oregon-construction.ts`. Report pages come only from the
  `research` collection. **Don't delete either system.** Mike hasn't decided which one
  to keep (2026-09-23).

### 6.3 Best Of lists

- **Content:** `bestOfLists` in `src/data/content.ts`. **It's empty in this repo.** The
  five-list Best Of implementation exists only in the old
  `C:\Users\mikes\client-and-product-apps\oregon-smb-dir-production-dev` lineage and was
  never brought over.
- **Shape:** the `BestOfList` type: `slug`, `title`, `category`, `city`, `intro`, `year`,
  `picks[]`.
- **Formatting:** `src/pages/best-of/index.astro` and `src/pages/best-of/[slug].astro`.
- **Sitemap:** `/best-of` is excluded by `astro.config.mjs`
  (`!page.includes("/best-of")`). Remove that condition when lists are published.

### 6.4 Home page features

`src/pages/index.astro` features the first entries of:

- `blogPosts` — which comes from **`src/data/blog-posts.json`, a separate legacy file,
  not the MDX blog collection.** A new MDX post doesn't appear on the home page unless
  this is changed.
- `researchReports` and `bestOfLists` (both empty, so those slots are hidden).

---

## 7. Configuration

| what | file | notes |
|---|---|---|
| Site URL, redirects, sitemap filter, integrations (React, MDX, Pagefind search) | `astro.config.mjs` | redirect targets need a trailing slash (comment in file) |
| Content schemas (blog, research) | `src/content.config.ts` | frontmatter validation |
| Worker name, custom domains, 404 handling, observability | `wrangler.jsonc` | assets-only; serves `./dist` |
| Colors, fonts, spacing tokens | `src/styles/tokens.css` (variables such as `--c-pine`, `--c-copper`), `src/styles/globals.css`, `tailwind.config.ts` | typography plugin enabled |
| Page shell (head, SEO tags) | `src/layouts/SiteLayout.astro` | renders the nav and footer below |
| Top navigation / footer | `src/components/layout/Navbar.tsx`, `src/components/layout/Footer.tsx` | |
| Structured data (JSON-LD) builders | `src/lib/schema.ts` | |
| Breadcrumbs (visible + JSON-LD from one trail) | `src/lib/breadcrumbs.ts` | |
| Generated city/industry prose + FAQs | `src/lib/seo-content.ts` | |
| Internal link graph (related links) | `src/lib/link-graph.ts` | |
| Publication gates | `src/data/publication-gates.ts` | section 2.3–2.4 |
| Node version | `.nvmrc` | the scripts load it; system Node fails |

---

## 8. Checks that run on every build

`npm run build`, which `scripts/build-bg.sh` runs under the right Node, runs in order:

1. `npm run audit:publication` (`scripts/audit-publication.mjs`) — counts accepted and
   suppressed ratings, quarantined websites and duplicate slugs.
2. `astro check` — type errors fail the build.
3. `astro build`.
4. `scripts/verify-site.mjs` — the deterministic gate over every page in `dist/`. Its
   rules are in `CHECKLIST.md`.
5. `scripts/test-search.mjs` — the Pagefind search quality checks.

Also useful:

- `npm run audit:links`
- `bash scripts/check-listing-pages.sh <city>/<industry>/<slug> …` — paths without
  `city/`. It prints counts for Verified, premium, FAQ structured data and website.

---

## 9. Build, deploy, verify — every change

```bash
bash scripts/build-bg.sh build          # ~3 min; success prints BUILD_EXIT=0
bash scripts/check-listing-pages.sh grants-pass/retail-shopping/daley-organics
bash scripts/deploy-bg.sh "what changed"  # success prints DEPLOY_EXIT=0 and a Version ID
curl -s https://oregonsmbdirectory.com/city/<city>/<industry>/<slug>/ | grep -c Verified
```

- **How to run them:** as one background command each, waiting for it to exit. Don't
  poll with sleep and grep.
- **After deploying:** curl our own live URLs and confirm the change (badge, link, rating
  and review count in the structured data, banner).
- **Then commit:** the batch, the shard diff, the evidence change, and the `tasks.md` /
  `hypothesis.md` result together, with the Worker Version ID in the message.
- **Never curl or browse Google** to verify anything.
