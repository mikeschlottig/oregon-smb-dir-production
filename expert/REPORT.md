# oregon-smb-directory — Expert Report
Generated 2026-09-28 by agy gemini-3.8-flash-high · scope: /home/mikes/oregon-smb-directory

## 1. Identity
- **What it is**: A high-performance static business directory website for the state of Oregon, organizing local small and medium businesses across 12 cities and 12 industry categories (`README.md:29-32`, `src/data/cities.ts:26-39`, `src/data/industries.ts:10-23`). It includes individual business profile pages (`src/pages/city/[citySlug]/[industrySlug]/[businessSlug].astro:1`), city and industry hub collections (`src/pages/city/[citySlug].astro:1`, `src/pages/services/[industrySlug].astro:1`), an MDX editorial blog (`src/content.config.ts:4-24`), industry research reports (`src/content.config.ts:26-40`), and curated Best Of lists (`src/pages/best-of/index.astro:1`).
- **Who it serves**: Oregon consumers looking for local service providers and verified businesses, local small business owners claiming or upgrading directory profiles, and client commercial platforms within the LeverageAI network (`README.md:29-32`, `src/data/publication-gates.ts:155-182`, `DIRECTORY-EDITING-AND-CONFIGURATION-GUIDE.md:96-100`).
- **Status**: Live and actively maintained in production (`AGENTS.md:120-123`, `README.md:5-7`, `wrangler.jsonc:16-19`).
  - Active commits through 2026-09-26 (commit `14044cd`, `PRIORITIES-2026-09-26.md:1-19`).
  - Completed comprehensive repair roadmap across phases P0 through P13 (`tasks.md:12-293`, `hypothesis.md:6-426`).
  - Successful edge deployments recorded across multiple worker revisions: version `7b8a2a36` (commit `82ff9e0`) for location gates (`tasks.md:222`), version `9abf79e7` for Daley Organics (`tasks.md:102`, `hypothesis.md:291`), version `5fa0b6f2` for LeverageAI (`tasks.md:119`, `hypothesis.md:302`), version `1a4695e3` for PDX Fingerprinting (`tasks.md:123`, `hypothesis.md:302`), version `8dc286f3` for map pin coordinates (`tasks.md:139`), version `10402d4a` for footer services (`tasks.md:164`), version `05041665` for home blog teasers (`tasks.md:174`), version `1bc184c1` for research pagination (`tasks.md:180`), and version `67883cd5` for baseline listings (`README.md:57`).
- **Deployed Worker Name**: `oregonsmbdirectory-site` (`wrangler.jsonc:3`).
- **Deploying Configuration**: `wrangler.jsonc:1-21`, deployed via the operational wrapper `scripts/deploy-bg.sh:11` calling `npx wrangler deploy`.

## 2. Architecture
The project is built as a static site generated via Astro v6 (`package.json:57`, `astro.config.mjs:22-64`), generating pre-rendered HTML/JSON/CSS artifacts into `dist/` (`astro.config.mjs:11`, `wrangler.jsonc:11`) that are served as static assets by Cloudflare Workers without server-side compute.

### Components & Subsystems
- **Data Shards & Aggregation**: 144 static JSON files in `src/data/businesses/` representing each city and industry combination (`src/data/businesses/albany__automotive.json:1` to `src/data/businesses/springfield__travel-hospitality.json:1`). Centralized in `src/data/businesses.ts:210-354`, which imports each shard, caches parsed collections, and manages slug lookups (`src/data/businesses.ts:358-385`).
- **Publication Gating System**: `src/data/publication-gates.ts:162-182` intercepts raw listing data before rendering. It filters out-of-state entities via `src/lib/oregon-location.ts:21-30`, drops ratings that lack matching verification evidence in `src/data/rating-evidence.json:1-18`, quarantines unconfirmed or suspicious website URLs (`src/data/publication-gates.ts:92-120`), and deduplicates listings by title, phone, and address (`src/data/publication-gates.ts:141-160`).
- **Layout and Shell**: `src/layouts/SiteLayout.astro:1-70` renders the document head, canonical `<link>` tags, OpenGraph metadata, JSON-LD script containers, navigation (`src/components/layout/Navbar.tsx:1`), footer (`src/components/layout/Footer.tsx:1`), and Pagefind search bounding attributes (`src/layouts/SiteLayout.astro:49`).
- **Client Search Engine**: Built-in Pagefind static search integration via `astro-pagefind` (`astro.config.mjs:43`, `package.json:58`), queried client-side by `src/components/SearchBar.astro:1-118` with monotonic request sequencing guards to prevent async race conditions (`hypothesis.md:271-275`).
- **Content Collections**: Astro content collections defined in `src/content.config.ts:1-43` using the `glob` loader for MDX blog posts (`src/content/blog/`) and industry research reports (`src/content/research/`).
- **Stealth Extractor Subpackage (`listings-extraction/`)**: Standalone Python utility in `listings-extraction/pyproject.toml:1-34` with CLI entry point `listings-extraction/src/lx/cli.py:1`. Leverages `rarlx` (`listings-extraction/pyproject.toml:23`) and Patchright 1.62.3 (`listings-extraction/pyproject.toml:14`) to scrape Google Maps place profiles, validate place identity via protobuf decoding, and manage extraction queues (`listings-extraction/README.md:1-85`).

### Request & Data Flow
1. **Compilation Trigger**: Operator triggers `bash scripts/build-bg.sh build` (`scripts/build-bg.sh:3-11`), which sources NVM and activates Node v22.22.2 (`.nvmrc:1`, `scripts/build-bg.sh:8-9`).
2. **Pre-build Publication Audit**: `scripts/audit-publication.mjs:1-165` audits all 144 shard files, matching `googleUrl` place feature IDs against `src/data/rating-evidence.json:1-18` and validating website hosts (`package.json:9, 13`).
3. **Identifier Linting**: `scripts/check-id-literals.mjs:1-55` scans source files to verify that all Google Maps place IDs match branded regex specifications (`package.json:9`, `src/types/ids.ts:23-25`).
4. **Type Checking & Astro Build**: `astro check` verifies TypeScript types (`package.json:9`), followed by `astro build` (`package.json:9`). `src/data/businesses.ts:360-367` invokes `prepareBusinessesForPublication` (`src/data/publication-gates.ts:162-182`), passing each listing through `oregonLocation` (`src/lib/oregon-location.ts:21-30`) and `sanitizeBusiness` (`src/data/publication-gates.ts:122-139`).
5. **Static File Emission**: Astro emits 10,500+ static HTML pages, XML sitemaps filtered via `astro.config.mjs:41`, Pagefind indices (`astro.config.mjs:43`), and client JS assets into `./dist` (`wrangler.jsonc:11`).
6. **Deterministic Quality Gate**: `scripts/verify-site.mjs:1-680` scans every emitted HTML file in `dist/`, asserting 100% adherence to C01–C18 quality rules (`CHECKLIST.md:21-71`, `package.json:9`).
7. **Search Regression Tests**: `scripts/test-search.mjs:1-120` runs queries against the compiled Pagefind index to confirm term matching and prevent cross-city link pollution (`package.json:9`, `hypothesis.md:232-243`).
8. **Edge Deployment**: Operator invokes `bash scripts/deploy-bg.sh "<message>"` (`scripts/deploy-bg.sh:3-12`), which runs `npx wrangler deploy` to sync `dist/` to Cloudflare Workers Static Assets (`wrangler.jsonc:10-13`, `scripts/deploy-bg.sh:11`).
9. **Client Request**: Cloudflare edge resolves requests for `oregonsmbdirectory.com` (`wrangler.jsonc:17`) directly from static storage. Missing paths return `dist/404.html` via `"not_found_handling": "404-page"` (`wrangler.jsonc:12`). Redirects in `public/_redirects:1-41` and `astro.config.mjs:28-29` are handled natively at the edge.

## 3. Cloudflare Surface
Defined in `wrangler.jsonc:1-21`:
- **name**: `"oregonsmbdirectory-site"` (`wrangler.jsonc:3`).
- **main**: None specified. Assets-only Worker (`wrangler.jsonc:7-9`).
- **compatibility_date**: `"2025-09-23"` (`wrangler.jsonc:4`).
- **compatibility_flags**: None declared (`wrangler.jsonc:1-21`).
- **observability block**: `{ "enabled": true }` (`wrangler.jsonc:5`).
- **assets**:
  - `directory`: `"./dist"` (`wrangler.jsonc:11`).
  - `not_found_handling`: `"404-page"` (`wrangler.jsonc:12`).
- **routes / custom domains**:
  - `{ "pattern": "oregonsmbdirectory.com", "custom_domain": true }` (`wrangler.jsonc:17`).
  - `{ "pattern": "www.oregonsmbdirectory.com", "custom_domain": true }` (`wrangler.jsonc:18`).
- **D1 Databases**: None configured (`wrangler.jsonc:1-21`). (D1 migration is planned per `PRIORITIES-2026-09-26.md:22-26`, but no binding exists in configuration).
- **R2 Buckets**: None configured (`wrangler.jsonc:1-21`).
- **KV Namespaces**: None configured (`wrangler.jsonc:1-21`).
- **Durable Objects**: None configured (`wrangler.jsonc:1-21`).
- **Queues**: None configured (`wrangler.jsonc:1-21`).
- **Workers AI**: None configured (`wrangler.jsonc:1-21`).
- **Vectorize**: None configured (`wrangler.jsonc:1-21`).
- **Browser Rendering**: None configured (`wrangler.jsonc:1-21`).
- **Service Bindings**: None configured (`wrangler.jsonc:1-21`).
- **Crons**: None configured (`wrangler.jsonc:1-21`).

## 4. Data Model & Contracts
- **Branded Identifiers** (`src/types/ids.ts:13-21`):
  - `FeatureId`: Google Maps hex identifier (`0x<hex>:0x<hex>`) validated via regex (`src/types/ids.ts:13, 23`).
  - `PlaceId`: Google Maps base64url protobuf identifier (`ChIJ...`) validated via regex (`src/types/ids.ts:15, 25`).
  - `Cid`: Decimal representation of feature ID second half (`src/types/ids.ts:17`).
  - `BusinessSlug`: Unique business identifier within a city/industry shard (`src/types/ids.ts:19`).
  - `ShardKey`: City and industry compound key `"<citySlug>__<industrySlug>"` (`src/types/ids.ts:21, 38-39`).
- **Business Listing Contract** (`src/data/businesses.ts:190-207`):
  - `Business`: Core listing model containing `slug`, `title`, optional `address`, `phone`, `email`, sanitized `rating` (`number | null`), sanitized `reviews` (`number | null`), `category`, `website` (`string | null`), `googleUrl`, `claimed`, `verified`, `ratingObservation` (`RatingObservation`), `verification` (`VerificationStatus`), `websiteValidation` (`WebsiteValidation`), and `websiteStatus` (`WebsiteStatus`).
  - `RatingObservation` (`src/data/businesses.ts:146-153`): `source: "google_business_profile"`, `observedAt: string`, `sourceRecordId: string`, `ratingValue: number`, `reviewCount: number`, `confidence: "source_observed"`.
  - `VerificationStatus` (`src/data/businesses.ts:155-173`): Includes union `status` (`"source_observed" | "directory_reviewed" | "contact_details_checked" | "owner_claim_pending" | "owner_claimed" | "owner_identity_verified" | "license_verified" | "disputed" | "temporarily_closed" | "permanently_closed"`), `scope: string[]`, `method: string`, `verifiedAt: string`, `expiresAt?: string`, `ownerParticipated: boolean`, `evidenceIds: string[]`.
  - `WebsiteValidation` (`src/data/businesses.ts:175-182`): `url: string`, `relationship: "official_website"`, `resolutionStatus: "confirmed" | "unconfirmed" | "quarantined"`, `lastCheckedAt: string`, `confirmationSources: string[]`, `riskFlags: string[]`.
- **Geographic & Industry Taxonomy**:
  - `City` (`src/data/cities.ts:15-24`): `name`, `slug`, `population`, `tagline`, `description`, `image: ImageMetadata`, `region`, optional `county`.
  - `Industry` (`src/data/industries.ts:1-8`): `name`, `slug`, `description`, `icon`, `iconBg`, `iconColor`.
- **Rating Evidence Contract** (`src/data/publication-gates.ts:6-18`):
  - `RatingEvidence`: `schemaVersion: number`, `source: "google_business_profile"`, `observedAt: string`, `observations: Record<string, string>` (mapping `FeatureId` to `"${rating}|${reviews}"`), and optional `supplements` array with per-entry `observedAt` and `reportedBy`.
- **Premium Profile Contract** (`src/data/premiumListings.ts:23-42`):
  - `PremiumListing`: `key` (`"${citySlug}/${industrySlug}/${businessSlug}"`), `schemaType` (`"LocalBusiness" | "Dentist" | "HomeAndConstructionBusiness" | "ProfessionalService"`), `seo: { title, description }`, `banner: { eyebrow, statement }`, `quickAnswer: string`, `about: string[]`, `services: string[]`, `serviceAreas: string[]`, `facts: string[]`, optional `hours: PremiumHours[]`, optional `geo: { lat, lng }`, `faqs: { question, answer }[]`, `sources: string[]`, `since: string`.
- **Structured Data (JSON-LD) Contracts** (`src/lib/schema.ts:7-97`):
  - `LocalBusinessSchema` (`src/lib/schema.ts:35-49`): Enforces `aggregateRating?: never` and `review?: never` (`src/lib/schema.ts:45-46`), strictly forbidding rating markup in JSON-LD per Google review snippet policies (`CHECKLIST.md:27`).
  - `CollectionPageSchema` (`src/lib/schema.ts:17-33`): Emits `ItemList` where each child `ListBusinessItem` also forbids ratings (`src/lib/schema.ts:59-60`).
  - `BreadcrumbListSchema` (`src/lib/breadcrumbs.ts:33-37`): Strict contiguous `itemListElement` positions starting at 1, pointing to canonical trailing-slash URLs (`src/lib/breadcrumbs.ts:45-51, 60-70`).
- **Database Tables**: No live production D1 migrations exist (`wrangler.jsonc:1-21`). In `listings-extraction/src/lx/store.py:27-52`, local SQLite schema manages `targets`, `attempts`, `place_results`, and `search_results`.

## 5. Interfaces
### Static HTTP Routes
Pre-rendered by Astro to `dist/` and served by the Worker:
- `GET /` -> `src/pages/index.astro:1`
- `GET /404.html` -> `src/pages/404.astro:1`
- `GET /accessibility/` -> `src/pages/accessibility.astro:1`
- `GET /contact/` -> `src/pages/contact.astro:1`
- `GET /editorial-policy/` -> `src/pages/editorial-policy.astro:1`
- `GET /best-of/` -> `src/pages/best-of/index.astro:1`
- `GET /best-of/[slug]/` -> `src/pages/best-of/[slug].astro:1`
- `GET /blog/` -> `src/pages/blog/index.astro:1`
- `GET /blog/[slug]/` -> `src/pages/blog/[slug].astro:1`
- `GET /blog/category/[category]/` -> `src/pages/blog/category/[category]/index.astro:1`
- `GET /blog/category/[category]/page/[page]/` -> `src/pages/blog/category/[category]/page/[page].astro:1`
- `GET /blog/page/[page]/` -> `src/pages/blog/page/[page].astro:1`
- `GET /city/` -> `src/pages/city/index.astro:1`
- `GET /city/[citySlug]/` -> `src/pages/city/[citySlug].astro:1`
- `GET /city/[citySlug]/[industrySlug]/` -> `src/pages/city/[citySlug]/[industrySlug].astro:1`
- `GET /city/[citySlug]/[industrySlug]/page/[page]/` -> `src/pages/city/[citySlug]/[industrySlug]/page/[page].astro:1`
- `GET /city/[citySlug]/[industrySlug]/[businessSlug]/` -> `src/pages/city/[citySlug]/[industrySlug]/[businessSlug].astro:1`
- `GET /city/grants-pass/business-professional-services/leverageai/` -> `src/pages/city/grants-pass/business-professional-services/leverageai/index.astro:1` (dedicated page)
- `GET /city/grants-pass/retail-shopping/daley-organics/` -> `src/pages/city/grants-pass/retail-shopping/daley-organics/index.astro:1` (dedicated page)
- `GET /city/portland/business-professional-services/pdx-fingerprinting/` -> `src/pages/city/portland/business-professional-services/pdx-fingerprinting/index.astro:1` (dedicated page)
- `GET /research/` -> `src/pages/research/index.astro:1`
- `GET /research/page/[page]/` -> `src/pages/research/page/[page].astro:1`
- `GET /research/[slug]/` -> `src/pages/research/[slug].astro:1`
- `GET /services/` -> `src/pages/services/index.astro:1`
- `GET /services/[industrySlug]/` -> `src/pages/services/[industrySlug]/index.astro:1`
- `GET /services/[industrySlug]/[categorySlug]/` -> `src/pages/services/[industrySlug]/[categorySlug]/index.astro:1`
- `GET /services/[industrySlug]/[categorySlug]/[citySlug]/` -> `src/pages/services/[industrySlug]/[categorySlug]/[citySlug].astro:1`

### Edge Redirects
- Target-with-trailing-slash redirect configured in `astro.config.mjs:28-29`:
  - `/research/oregon-law-firm-ai-search-report-1` -> `/research/oregon-law-firm-ai-search-report/`
- Static edge 301 redirects in `public/_redirects:1-41`:
  - Consolidated PDX Fingerprinting URLs to `/city/portland/business-professional-services/pdx-fingerprinting/` (`public/_redirects:1-2`).
  - Blocked out-of-state listings redirected to parent city/industry hubs (`public/_redirects:5-41`).

### Outbound Client Endpoints
- Contact submission POST request in `src/components/ContactForm.tsx:28` targeting `PUBLIC_CONTACT_ENDPOINT` (fallback: `https://contact.oregonsmbdirectory.com`).

### WebSockets & MCP Tools
- WebSocket endpoints: None (`wrangler.jsonc:1-21`).
- MCP tools: None declared in this repository.

### Environment Variable & Secret Names
- `PUBLIC_CONTACT_ENDPOINT`: Target URL for contact form submissions (from `.env.example:4`, referenced in `src/components/ContactForm.tsx:28`).
- `NVM_DIR`: NVM installation directory (from `scripts/build-bg.sh:7`, `scripts/deploy-bg.sh:6`).

## 6. Build, Test, Deploy
All commands are cited directly from repository configuration:

### Package Scripts (`package.json:6-22`)
- `npm run dev` (from `package.json:7`, `README.md:22`, `AGENTS.md:100`): Executes `astro dev`.
- `npm run start` (from `package.json:8`, `README.md:23`, `AGENTS.md:101`): Executes `astro dev`.
- `npm run build` (from `package.json:9`, `AGENTS.md:102`): Executes composite pipeline: `npm run audit:publication && node scripts/check-id-literals.mjs && astro check && astro build && node scripts/verify-site.mjs && node scripts/test-search.mjs`.
- `npm run preview` (from `package.json:10`, `AGENTS.md:103`): Executes `astro preview`.
- `npm run audit:links` (from `package.json:12`): Executes `node scripts/link-audit.mjs`.
- `npm run audit:publication` (from `package.json:13`): Executes `node scripts/audit-publication.mjs`.
- `npm run import:audit-evidence` (from `package.json:14`): Executes `node scripts/import-publication-evidence.mjs`.
- `npm run verify` (from `package.json:15`): Executes `node scripts/verify-site.mjs`.
- `npm run verify:report` (from `package.json:16`): Executes `node scripts/verify-site.mjs --report-only --json reports/site-verify.json`.
- `npm run test:search` (from `package.json:17`): Executes `node scripts/test-search.mjs`.
- `npm run audit:categories` (from `package.json:18`): Executes `node scripts/fix-categories.mjs --dry`.
- `npm run audit:jsonld` (from `package.json:19`): Executes `node scripts/jsonld-audit/audit.mjs`.
- `npm run test:jsonld-rubric` (from `package.json:20`): Executes `node scripts/jsonld-audit/audit.mjs --self-test`.
- `npm run audit:jsonld:live` (from `package.json:21`): Executes `node scripts/jsonld-audit/audit.mjs --site https://oregonsmbdirectory.com`.

### Canonical Operational Wrappers
- **Build**: `bash scripts/build-bg.sh build` (from `AGENTS.md:15, 140`, `README.md:15, 36`, `DIRECTORY-EDITING-AND-CONFIGURATION-GUIDE.md:34, 503`). Ensures Node v22.22.2 execution via NVM (`scripts/build-bg.sh:7-9`).
- **Deploy**: `bash scripts/deploy-bg.sh "<message>"` (from `AGENTS.md:15, 142`, `README.md:15, 37`, `DIRECTORY-EDITING-AND-CONFIGURATION-GUIDE.md:41, 505`). Deploys `./dist` to Cloudflare Worker `oregonsmbdirectory-site` via Wrangler (`scripts/deploy-bg.sh:10-12`).
- **Verification Inspection**: `bash scripts/check-listing-pages.sh <city>/<industry>/<slug> ...` (from `AGENTS.md:143`, `DIRECTORY-EDITING-AND-CONFIGURATION-GUIDE.md:36, 504`).
- **Listings Batch Ingestion**: `node scripts/add-listings.mjs <batch> [--dry]` (from `AGENTS.md:152-153`, `DIRECTORY-EDITING-AND-CONFIGURATION-GUIDE.md:24-25`).
- **Extraction Suite Execution**: `uv run --group dev pytest -q` (from `listings-extraction/README.md:52`).

### Existing Test Suites & Coverage
- **`scripts/verify-site.mjs:1-680`**: Post-build deterministic test suite inspecting every emitted HTML file across 18 rules (`CHECKLIST.md:21-71`):
  - C01: `JSONLD_PARSE` — All `<script type="application/ld+json">` parse as valid JSON (`CHECKLIST.md:25`).
  - C02–C08: Breadcrumb structure — Verifies presence, shape, contiguous 1-indexed ordering, Home root, terminal node, on-origin trailing-slash URLs, and exact 1:1 match between visible DOM and JSON-LD (`CHECKLIST.md:43-49`).
  - C09–C10: Canonical and link integrity — Single self-referencing canonical tag and zero broken internal `href` targets (`CHECKLIST.md:55-56`).
  - C11–C12: FAQ validation — FAQPage structure and cross-page uniqueness (`CHECKLIST.md:26, 69`).
  - C13: `THIN` — Minimum 150-word floor within `<main>` excluding nav/furniture (`CHECKLIST.md:70`).
  - C14: `SCHEMA_REQUIRED` — Presence of required Schema.org properties (`CHECKLIST.md:28`).
  - C15–C17: Route integrity — Trailing-slash standardization, sitemap validity, and utility exemption scoping (`CHECKLIST.md:57-59`).
  - C18: `NO_THIRD_PARTY_RATING` — Complete prohibition of rating/review nodes in JSON-LD (`CHECKLIST.md:27`).
- **`scripts/test-search.mjs:1-120`**: Search index integration tests verifying Pagefind ranking, debouncing monotonic guards, and preventing cross-city term bleed (`hypothesis.md:265-275`).
- **`scripts/check-id-literals.mjs:1-55`**: Static source linter checking for unauthorized or unformatted Place IDs (`package.json:9`, `src/types/ids.ts:23-25`).
- **`scripts/jsonld-audit/audit.mjs:260-310` (`test:jsonld-rubric`)**: 11 unit test fixtures proving all 18 Google Rich Result rules and schema.org hierarchy validations (`tasks.md:227`).
- **`listings-extraction/tests/test_lx.py:1-150`**: 18 unit tests validating Google Maps target parsing, CSS selectors, protobuf transcoding, and error teardown logic (`listings-extraction/README.md:32-38`, `tasks.md:232`).

## 7. Current State & Health
### Functional State
- Build pipeline runs clean with zero exit code (`BUILD_EXIT=0`) across 10,500+ pages (`tasks.md:275`, `hypothesis.md:421-426`).
- All 18 checklist verification gates (C01–C18) pass synchronously on build (`CHECKLIST.md:23-71`, `hypothesis.md:421`).
- Pagefind client search bounds properly configured, preventing cross-city query leakage (`hypothesis.md:238-243`, `src/layouts/SiteLayout.astro:49`).
- Breadcrumbs derived from single pure function `trail([...])`, preventing visible and JSON-LD drift (`src/lib/breadcrumbs.ts:1-65`).

### Known Issues & Defects
- **Ocean Placeholder Pins**: 116 listings have Google Maps pins outside Oregon (e.g. Pacific Ocean coordinates `46.423669,-129.942709`), requiring fallback to name/address search embeds (`tasks.md:139-143`, `hypothesis.md:310-315`, `handoffs/2026-09-23T2140_claude_p10-fix-list.md:16-19`).
- **Service-Area Business Addresses**: 594 service-area business listings have no street address, triggering warnings under Google LocalBusiness address requirements (`tasks.md:242-244`, `hypothesis.md:425`).
- **Telephone Formatting**: 10,069 phone numbers across listing shards have non-standard dialable formatting (e.g. `(541) 7307759`) awaiting normalization (`tasks.md:247`, `hypothesis.md:354`).
- **Generic Schema Types**: 9,423 business listings use generic `LocalBusiness` rather than specific industry subtypes (`tasks.md:248`, `hypothesis.md:354`).
- **Unverified Contact Form Delivery**: Contact form endpoint responds over HTTP, but actual email delivery to operator inbox has not been confirmed (`tasks.md:304-306`).
- **Uniform Blog Dates**: All 55 MDX blog posts share identical date `2026-04-13`, making date sorting ambiguous on homepage and blog roll (`tasks.md:174`, `handoffs/2026-09-23T2140_claude_p10-fix-list.md:13-15`).
- **Deferred Best-Of Section**: Best-Of directory section contains zero items and remains `noindex` (`tasks.md:113-114, 186`, `astro.config.mjs:41`).

### Code Comments & Inline Markers
- `listings-extraction/src/lx/dashboard.py:110`: `return '<td class="todo"></td>'`
- `listings-extraction/src/lx/runner.py:108`: `todo = [t for t in targets if store.status(t.target_id) != "done"]`
- `scripts/jsonld-audit/vocab.mjs:4`: `// fetch-vocab.mjs. The Adobe validator checks the domain but not the range ("TODO: Add range checking")`
- `tasks.md:304`: `that the build does not use — reconcile. **Delivery is unproven:** one real test submission`

### Contradictions Between Documentation and Code
- **Contradiction 1: Homepage Blog Data Source**
  - *Documentation* (`DIRECTORY-EDITING-AND-CONFIGURATION-GUIDE.md:454-456`): "`blogPosts` — which comes from `src/data/blog-posts.json`, a separate legacy file, not the MDX blog collection."
  - *Code* (`src/pages/index.astro:15-19`): `const latestPosts = (await getCollection("blog")).sort(...).slice(0, LATEST_POSTS);` actively imports from the Astro MDX collection (`src/content/blog/`), ignoring `blog-posts.json`.
- **Contradiction 2: Ratings in Structured Data**
  - *Documentation* (`DIRECTORY-EDITING-AND-CONFIGURATION-GUIDE.md:98, 511`): States that modifying stars/reviews requires updating the shard and `rating-evidence.json` for structured data publication.
  - *Code & Update Log* (`DIRECTORY-EDITING-AND-CONFIGURATION-GUIDE.md:529-530`, `src/lib/schema.ts:42-46`, `CHECKLIST.md:27`): Update log of 2026-09-24 and code in `src/lib/schema.ts` strictly prohibit ratings in structured data (`aggregateRating?: never`), enforcing checklist rule C18. Stars remain visible only in HTML.
- **Contradiction 3: Contact Endpoint Configuration**
  - *Documentation / Environment* (`.env.example:4`): `PUBLIC_CONTACT_ENDPOINT=https://oregonsmbdirectory-contact-form.ceo-a53.workers.dev`.
  - *Code & Built Output* (`src/components/ContactForm.tsx:28`, `tasks.md:300-304`): Code targets `https://contact.oregonsmbdirectory.com` by default and is baked into static assets.

## 8. Gotchas
1. **System Node Build Failure**
   - **Badge**: `[EnvironmentMismatch]`
   - **Symptom**: Direct invocation of `npm run build` fails with syntax or loader errors (`AGENTS.md:138-141`).
   - **Root cause**: Astro v6 and ES module plugins require Node v22.22.2 (`.nvmrc:1`). System default Node versions fail.
   - **Fix**: Always execute builds using `bash scripts/build-bg.sh build`, which activates NVM and selects `.nvmrc` (`scripts/build-bg.sh:7-9`).
   - **Lesson**: Do not run package managers directly on host systems with multiple Node toolchains.

2. **Ocean Coordinate False Positives**
   - **Badge**: `[GeographicDataAnomaly]`
   - **Symptom**: Legitimate Oregon service-area businesses were flagged as out-of-state and blocked from publication (`hypothesis.md:310-315`).
   - **Root cause**: Google Maps defaults unaddressed service businesses to an arbitrary coordinate in the Pacific Ocean (`46.423669,-129.942709`). Naive bounding box filters classified this as out-of-state (`src/lib/oregon-location.ts:38-40`).
   - **Fix**: `src/lib/oregon-location.ts:25, 38-40` explicitly recognizes longitudes west of `-125` as ocean placeholders, requiring two independent signals (e.g. out-of-state street address OR out-of-state pin AND out-of-state area code) to block (`src/lib/oregon-location.ts:27-30`).
   - **Lesson**: Coordinate data alone cannot verify location without checking for vendor placeholder values.

3. **Cloudflare Two-Hop Static Asset Redirects**
   - **Badge**: `[EdgeRoutingMismatch]`
   - **Symptom**: Page redirects resulted in multi-hop 307 chains on Cloudflare Workers (`hypothesis.md:192-198`).
   - **Root cause**: Cloudflare's `html_handling: auto-trailing-slash` redirects slashless URLs to slashed paths. A redirect target lacking a trailing slash triggers a secondary edge redirect (`astro.config.mjs:24-30`).
   - **Fix**: All redirect targets in `astro.config.mjs:28-29` and `public/_redirects:1-41` must end with a canonical trailing slash.
   - **Lesson**: Static edge file handlers strictly enforce URL normalization rules.

4. **Third-Party Review Snippet Penalties**
   - **Badge**: `[SchemaGuidelineViolation]`
   - **Symptom**: Google Rich Results audit reported 9,816 errors on `LB_RATING_THIRD_PARTY` (`hypothesis.md:343-356, 409-426`).
   - **Root cause**: Google Search Central rules explicitly forbid aggregating review snippets from external platforms (e.g. Google Maps) into `LocalBusiness` `aggregateRating` markup (`CHECKLIST.md:27`).
   - **Fix**: Removed `aggregateRating` and `review` from all JSON-LD schemas (`src/lib/schema.ts:42-46`), while retaining star badges in rendered HTML (`CHECKLIST.md:27`, `hypothesis.md:412-426`).
   - **Lesson**: Visual user interface features must not be conflated with structured data rich snippet claims.

5. **Search Index Bleed Across Cities**
   - **Badge**: `[SearchIndexBleed]`
   - **Symptom**: Searches for "Medford roofing" returned Eugene, Salem, and Portland businesses in top results (`hypothesis.md:232-243`).
   - **Root cause**: Universal navigation and footer components listed all 12 cities on every page without exclusion attributes, causing Pagefind to index all cities globally (`hypothesis.md:234-237`).
   - **Fix**: Added `data-pagefind-body` to `<main>` in `src/layouts/SiteLayout.astro:49`, applied `data-pagefind-ignore` to header, footer, related link widgets, and paginated index slices (`src/layouts/SiteLayout.astro:39-65`, `hypothesis.md:238-251`).
   - **Lesson**: Static site search scrapers must be bounded by explicit body and ignore attributes.

6. **Pagination Tail Thin Content Errors**
   - **Badge**: `[SEOThinPageArtifact]`
   - **Symptom**: 55 paginated listing pages failed the 150-word content floor check C13 (`hypothesis.md:126-138`).
   - **Root cause**: Fixed chunk pagination left trailing pages with only 1–2 listing cards, which failed word count checks once navigation furniture was excluded (`hypothesis.md:135-138, 202-209`).
   - **Fix**: `src/lib/paginate.ts` folds trailing pages with fewer than 8 listings into the preceding page, balancing page distribution (`CHECKLIST.md:88-92`, `hypothesis.md:135-137`).
   - **Lesson**: Pagination limits should represent maximum caps rather than rigid fill targets.

7. **Untyped String Entity Identifier Drift**
   - **Badge**: `[IdentifierIntegrityFailure]`
   - **Symptom**: Hardcoded test fixture place IDs were embedded into production Maps links (`src/types/ids.ts:5-7`, `DIRECTORY-EDITING-AND-CONFIGURATION-GUIDE.md:15-17`).
   - **Root cause**: Place IDs and feature IDs were typed as generic strings, permitting invalid or synthetic identifiers to compile unnoticed (`src/types/ids.ts:1-7`).
   - **Fix**: Created branded nominal types (`FeatureId`, `PlaceId`) in `src/types/ids.ts:13-15`, protobuf conversion utilities in `src/lib/google-place-id.ts:38-56`, and pre-build linter `scripts/check-id-literals.mjs:1-55`.
   - **Lesson**: Nominal types and validation linters are necessary for third-party entity identifiers.

## 9. Source Map
| Path | Purpose |
|---|---|
| `wrangler.jsonc` | Cloudflare Worker configuration for assets-only static site serving (`wrangler.jsonc:1-21`) |
| `astro.config.mjs` | Astro build configuration, integrations, redirects, and sitemap filter (`astro.config.mjs:1-65`) |
| `package.json` | Project dependencies, npm run scripts, and verification commands (`package.json:1-100`) |
| `CHECKLIST.md` | Authoritative 18-point binary checklist (C01–C18) for site correctness (`CHECKLIST.md:1-131`) |
| `DIRECTORY-EDITING-AND-CONFIGURATION-GUIDE.md` | Standard operating procedures and change protocol for directory updates (`DIRECTORY-EDITING-AND-CONFIGURATION-GUIDE.md:1-534`) |
| `AGENTS.md` | Agent contract, operating rules, build/deploy instructions, and tool routing (`AGENTS.md:1-162`) |
| `tasks.md` | Milestone task tracker and repair phases P0 through P14 (`tasks.md:1-325`) |
| `hypothesis.md` | Empirical hypotheses and experimental verification log H1 through H28 (`hypothesis.md:1-426`) |
| `src/data/businesses.ts` | Central listing aggregator importing 144 shards with caching and slug utilities (`src/data/businesses.ts:1-409`) |
| `src/data/publication-gates.ts` | Sanitization pipeline gating ratings, websites, verification, and duplicates (`src/data/publication-gates.ts:1-194`) |
| `src/data/rating-evidence.json` | Ground-truth observed rating store keyed by Google Feature ID (`src/data/rating-evidence.json:1-9200`) |
| `src/data/cities.ts` | 12 Oregon cities with metadata, population, regions, and images (`src/data/cities.ts:1-42`) |
| `src/data/industries.ts` | 12 standardized directory industries with metadata and icons (`src/data/industries.ts:1-26`) |
| `src/data/premiumListings.ts` | Enriched profile data and schema definitions for premium listings (`src/data/premiumListings.ts:1-327`) |
| `src/data/dedicatedPages.ts` | Registry of businesses with hand-written custom landing pages (`src/data/dedicatedPages.ts:1-24`) |
| `src/data/listingBanners.ts` | Registry of verified owner-provided banner image assets (`src/data/listingBanners.ts:1-30`) |
| `src/types/ids.ts` | Branded nominal types for FeatureId, PlaceId, Cid, BusinessSlug, and ShardKey (`src/types/ids.ts:1-40`) |
| `src/lib/schema.ts` | Schema.org JSON-LD generation for LocalBusiness, CollectionPage, and Breadcrumbs (`src/lib/schema.ts:1-458`) |
| `src/lib/breadcrumbs.ts` | Single source of truth generating synchronized visible and JSON-LD breadcrumbs (`src/lib/breadcrumbs.ts:1-101`) |
| `src/lib/oregon-location.ts` | Multi-signal validation rule classifying businesses as in-state or out-of-state (`src/lib/oregon-location.ts:1-95`) |
| `src/lib/google-place-id.ts` | Protobuf codec converting between base64url Place IDs and hex Feature IDs (`src/lib/google-place-id.ts:1-87`) |
| `src/lib/paginate.ts` | Pagination utility enforcing minimum item floors to prevent thin pages (`src/lib/paginate.ts:1-45`) |
| `src/lib/rating-display.ts` | Formatting functions for visual star ratings and Pacific timestamp footnotes (`src/lib/rating-display.ts:1-35`) |
| `src/layouts/SiteLayout.astro` | Base HTML layout with SEO meta tags, Pagefind boundary, nav, and footer (`src/layouts/SiteLayout.astro:1-70`) |
| `src/content.config.ts` | Astro Content Collections schemas for blog posts and research reports (`src/content.config.ts:1-43`) |
| `src/pages/index.astro` | Homepage template featuring hero, search bar, city cards, and recent blog posts (`src/pages/index.astro:1-142`) |
| `src/pages/city/[citySlug]/[industrySlug]/[businessSlug].astro` | Dynamic business profile detail page template (`src/pages/city/[citySlug]/[industrySlug]/[businessSlug].astro:1-160`) |
| `src/pages/city/[citySlug]/[industrySlug].astro` | City-industry directory listing hub with SEO text and FAQs (`src/pages/city/[citySlug]/[industrySlug].astro:1-140`) |
| `src/components/SearchBar.astro` | Client-side search component with Pagefind integration and debounce guards (`src/components/SearchBar.astro:1-118`) |
| `src/components/ContactForm.tsx` | React interactive contact form posting to contact Worker endpoint (`src/components/ContactForm.tsx:1-150`) |
| `scripts/build-bg.sh` | Canonical build execution script ensuring Node v22 execution via NVM (`scripts/build-bg.sh:1-13`) |
| `scripts/deploy-bg.sh` | Canonical deploy script publishing dist/ to Cloudflare Worker (`scripts/deploy-bg.sh:1-13`) |
| `scripts/verify-site.mjs` | Automated test script asserting 100% compliance across C01–C18 on built HTML (`scripts/verify-site.mjs:1-680`) |
| `scripts/audit-publication.mjs` | Pre-build audit validating ratings, websites, and duplicate keys (`scripts/audit-publication.mjs:1-165`) |
| `scripts/check-id-literals.mjs` | Pre-build linter enforcing ID taxonomy and preventing hardcoded IDs (`scripts/check-id-literals.mjs:1-55`) |
| `scripts/compare-builds.mjs` | Diffing tool comparing build dist/ against live origin or baseline dist/ (`scripts/compare-builds.mjs:1-220`) |
| `scripts/jsonld-audit/audit.mjs` | Comprehensive JSON-LD validator against schema.org and Google rules (`scripts/jsonld-audit/audit.mjs:1-380`) |
| `listings-extraction/pyproject.toml` | Python package configuration for Google Maps stealth extraction tool (`listings-extraction/pyproject.toml:1-34`) |
| `listings-extraction/src/lx/cli.py` | CLI entry point for lx extraction, planning, and queue management (`listings-extraction/src/lx/cli.py:1-180`) |

## 10. Unknowns
1. **Google Sheet Dataset Location (`UNVERIFIED`)**: The exact URL, Google Drive identifier, and tab name for Mike's hand-corrected listing spreadsheet and formula-generated JSON-LD cannot be determined from repository files (`PRIORITIES-2026-09-26.md:29`).
2. **Target Cloudflare D1 Database (`UNVERIFIED`)**: The specific D1 database name or database ID in the Cloudflare account intended to hold the migrated listings data is not defined in any configuration file (`PRIORITIES-2026-09-26.md:33`).
3. **Contact Form Worker Source (`UNVERIFIED`)**: The repository containing the source code for `https://contact.oregonsmbdirectory.com` (and its `.workers.dev` counterpart) is not located within this repository, leaving its email dispatch implementation unconfirmed (`tasks.md:304-306`).
4. **Contact Form End-to-End Email Delivery (`UNVERIFIED`)**: Whether form submissions sent to the contact Worker actually deliver emails to the operator inbox has not been tested or confirmed (`tasks.md:304-306`).
5. **Resolution of 116 Out-of-State Coordinates (`UNVERIFIED`)**: Whether the 116 listings with coordinates outside Oregon are multi-state chains, remote businesses, or erroneous Google Maps place associations has not been audited (`tasks.md:139-143`, `hypothesis.md:310-315`, `handoffs/2026-09-23T2140_claude_p10-fix-list.md:16-19`).
6. **Machine-Sounding Copy Approvals (`UNVERIFIED`)**: Operator approval for proposed plain-language replacements of legacy "source-observed" phrases on city/industry landing pages has not been granted (`tasks.md:159-161`, `handoffs/2026-09-23T2140_claude_p10-fix-list.md:7-9`).
7. **Structured Data Strategy for 594 Service-Area Businesses (`UNVERIFIED`)**: A final policy decision on whether to emit partial `PostalAddress` objects or suppress `LocalBusiness` markup entirely for the 594 service-area listings lacking street addresses remains open (`tasks.md:242-245`).
