# Oregon SMB Directory — Repair Plan

**Standard: 1% wrong = 100% failure.** Breadcrumbs and JSON-LD ship perfect or they do not
ship. Every task below closes only on tool output pasted into this file's companion
`hypothesis.md`, never on inspection.

Repo: `/home/mikes/oregon-smb-directory` (imported from
`C:\Users\mikes\client-and-product-apps\oregon-smb-dir-production-main\oregon-smb-dir-production-main`,
baseline commit `0ab75cd`). Deploy target: Cloudflare Worker `oregonsmbdirectory-site`,
assets-only, `./dist`.

## P0 — Orient and index

- [x] P0.1 Locate repo, copy to WSL, `git init`, baseline commit — `0ab75cd`
- [x] P0.2 CODE index — `codebase-intel-toolkit/indexes/oregon-smb-directory/` (374 files, 183,884 LOC)
- [x] P0.3 DOCS index — `doc-intel/indexes/oregon-smb-directory.db` (87 docs, 1,190 sections)
- [x] P0.4 Locate RustySEO CLI — `/mnt/c/Users/mikes/rusty_seo_projects/RustySEO-Headless/target/release/RustySEO-CLI.exe`
- [ ] P0.5 `npm install` + `npm run build` green; record page count in `dist/`

## P1 — Baseline evidence (no fixes yet)

- [ ] P1.1 Extract every `application/ld+json` block from every page in `dist/`; parse each
      with a strict JSON parser. **Gate:** zero parse failures, or the failing files listed.
- [ ] P1.2 Validate every BreadcrumbList against Google's required shape
      (`itemListElement[].item` = URL string or object carrying `@id`; contiguous
      `position` starting at 1; first crumb = Home; last crumb = current page).
      **Gate:** inventory of every page type × violation, counted.
- [ ] P1.3 Diff visible breadcrumb trail (TldrCard `breadcrumb` prop) against the
      BreadcrumbList JSON-LD on the same page. **Gate:** table of mismatches.
- [ ] P1.4 Full internal link/route crawl of `dist/` — every `href` resolved against built
      files. **Gate:** list of 404-producing internal links and orphan routes.
- [ ] P1.5 FAQ inventory: every FAQ question/answer pair per URL, hashed. **Gate:** counts of
      identical answers across pages, per page type.
- [ ] P1.6 Thin-page inventory: rendered main-content word count per URL. **Gate:** ranked
      list under threshold, threshold justified in `hypothesis.md`.
- [ ] P1.7 RustySEO crawl of the built site served locally. **Gate:** report JSON on disk.

## P2 — Breadcrumb repair (template-level only)

- [ ] P2.1 `src/lib/schema.ts#breadcrumbSchema` emits Google-valid items
- [ ] P2.2 Single source of truth: one function produces both the visible trail and the
      JSON-LD, so the two cannot drift
- [ ] P2.3 Every route's crumb chain resolves to a real page (no crumb pointing at a 404)
- [ ] P2.4 `TldrCard` county/eyebrow duplication fixed ("Josephine Co. County")
- [ ] P2.5 Re-run P1.2 + P1.3 — **zero** violations, **zero** mismatches

## P3 — JSON-LD repair

- [ ] P3.1 `FaqSchema.astro` escapes `<`, `>`, `&` like `JsonLd.astro` does
- [ ] P3.2 One `@id` graph: Organization/WebSite referenced by `@id`, not re-declared per page
- [ ] P3.3 Every emitted type validated against schema.org + Google Rich Results requirements
- [ ] P3.4 Re-run P1.1 — zero parse failures, zero required-field violations

## P4 — Routes

- [ ] P4.1 Every internal link resolves (from P1.4 list)
- [ ] P4.2 Missing parent routes created or de-linked (e.g. `/services/[industry]/`,
      `/services/[industry]/[category]/`)
- [ ] P4.3 Redirect chains collapsed to one hop; loops eliminated
- [ ] P4.4 Sitemap contains only 200-returning canonical URLs

## P5 — FAQ and thin pages

- [ ] P5.1 Remove generic/duplicate FAQ blocks; keep only data-unique answers (P1.5 list)
- [ ] P5.2 Any page whose FAQ block cannot be made page-specific loses the block entirely
      rather than shipping boilerplate
- [ ] P5.3 Thin pages (P1.6 list): each either gains real content or is removed from the
      sitemap and `noindex`ed — decision recorded per URL
- [ ] P5.4 Miscategorized listings corrected (e.g. "Beauty salon" under Construction)

## P6 — Checklist and enforcement

- [ ] P6.1 Write `CHECKLIST.md` — strict, binary, one line per check, each with the command
      that proves it
- [ ] P6.2 Write `scripts/verify-site.mjs` — runs every check against `dist/`, exits non-zero
      on any failure
- [ ] P6.3 Wire it into `npm run build` so a malformed breadcrumb cannot ship

## P7 — Adversarial audit (Fulcrum)

- [ ] P7.1 Fulcrum audits `CHECKLIST.md` itself — is it complete and are the checks the right
      ones? Disagreements answered with cited counter-proposals, both directions.
- [ ] P7.2 Fulcrum adversarially audits the repaired site against the agreed checklist
- [ ] P7.3 Findings resolved to general agreement; scoreboard entry written

## P8 — Ship

- [ ] P8.1 `npm run build` + `verify-site.mjs` green
- [ ] P8.2 `wrangler deploy`
- [ ] P8.3 Post-deploy verification against the live origin, same checks

## P9 — Owner listing fixes (2026-09-23, Mike's request)

- [ ] P9.1 LeverageAI + Daley Organics (both shards): verification event and confirmed
      websiteValidation, so the gate publishes the badge and website link
- [ ] P9.2 Dedicated pages (leverageai, retail daley-organics) read badge and rating from
      the sanitized record instead of hard-coding `verified: false`
- [x] P9.3 Rating evidence gets dated supplements; gate and audit read them
- [ ] P9.4 PDX Fingerprinting: one Portland record `pdx-fingerprinting` with both locations,
      4.9/344 on the Hillsboro feature ID, and Notary and Translation H2 sections;
      the two old URLs redirect 301
- [x] P9.5 Daley Organics: verified, website `https://daleyorganics.com`, 4.6 from 10 reviews (Mike), banner — both pages live, Worker version `9abf79e7`
- [ ] P9.6 Build, check pages, deploy, and curl live: badge, link, rating, H2s, redirects

## P10 — Fix list (Mike, 2026-09-23 evening)

Decisions recorded, not open questions:
- **The listings index stays hand-wired.** `src/data/businesses.ts` gets no generator
  until one is proven, and kept working, on a separate non-live site. The last generator
  attempt broke the live site and hurt it with Google.
- **Both report systems stay for now.** The `research` collection is live; `ReportReader` +
  `researchReports` are unused. Mike hasn't decided which to keep, so delete neither.
- **Best Of is deferred.** It comes after the fundamentals are fixed, the listings are up,
  and edits are shown to ship without breaking anything.
- **No agent uses a browser on Google** (memory `google-services-stealth-only`). Ratings
  come from Mike.

### Listings
- [x] P10.1 LeverageAI verified with website `https://leverageai.network`. Done: Worker 5fa0b6f2.
  - A patch batch adds `verification` + `websiteValidation`.
  - The dedicated page reads its badge and rating from the record, as Daley's does. It
    hard-codes `verified: false` today.
- [x] P10.2 PDX Fingerprinting becomes one Portland listing, `pdx-fingerprinting`: Done: Worker 1a4695e3. Dedicated page (not premium — the handoff classed PDX verified standard); old records archived in `_archive/pdx-fingerprinting-split-records-*`; 301s in `public/_redirects`. Translation copy cites `/certified-document-translation-service/` because `/document-translation-service/` now redirects to the home page.
  - Verified, website `https://pdxfingerprinting.com`.
  - Both service addresses: Hillsboro and Lake Oswego.
  - 4.9 stars, 344 reviews (Mike), on the Hillsboro feature ID `0x54950f18a1066bc7:0xd5daf738ddd7b67d`.
  - H2 sections "Notary Services" and "Translation Services", with copy traced to
    pdxfingerprinting.com/notary-services/ and /document-translation-service/.
  - The two old URLs (`-hillsboro`, `-lake-oswego`) redirect 301 to the new one.
  - Office phone `503-212-0678`. The `(971) 394-4150` number was never corroborated; the
    site lists `971-394-4154`, for international clients only.
- [ ] P10.3 Ratings for the other new listings, **numbers from Mike**: Deepli, Apex, North Tabor
  Dental, Capital Nomics, Cascadia Putting Club. Each needs a real place `googleUrl` and a
  rating-evidence supplement.
  - Last session's Places figures, **not confirmed by Mike**: Apex 5.0/15, Deepli 5.0/2,
    NTD 4.7/31.
  - Capital Nomics has no rating. Cascadia has no Maps listing found.
- [x] P10.4 Real Maps embeds for every new listing. Done: Worker 8dc286f3. 9,780 of 10,168 records now pin (was 132); 116 whose pin is outside Oregon fall back to address search, listed in `reports/maps-pins-outside-oregon-2026-09-23.csv`. Premium listings pin via `premium.geo`; Cascadia has no Maps place; PDX handled in P10.2.
  - `parseLatLng` (`src/data/businesses.ts`) reads only `query=lat,lng`, so every
    `/maps/place/…/@lat,lng` URL falls back to a name + address search embed.
  - Fix: parse the `@lat,lng` and the `!3d…!4d…` coordinates too. Then check that every
    new listing's embed is pinned to its own location.
- [x] P10.5 Daley Organics note wording and date. Done: Worker e34c32ff; verification dates now format in America/Los_Angeles. The provenance text reads like a log
  ("Directory operator review…"), and the verification date prints as September 24 (UTC).
  Rewrite the `method` and store `verifiedAt` with the Pacific offset.

### Rating display, site-wide
- [x] P10.6 Remove the "observed <Mon YYYY>" wording from every business page: Done: Worker 75c42294; 0 pages in dist match "observed <Mon YYYY>". Daley reads `*as of 9/23/2026` (Pacific) — Mike to confirm vs 9/24.
  - `src/pages/city/[citySlug]/[industrySlug]/[businessSlug].astro` lines ~89 (label),
    ~157 ("observed through"), ~317 ("The source record showed … when observed"), and
    ~438 ("Rating evidence is tied to provider record … observed").
  - Replace them with **stars + review count with an asterisk**, e.g. `4.6 ★ (10 reviews)*`.
  - Put **one footnote at the bottom of the listing**: `*as of M/D/YYYY`. The date is the
    rating's observation date.
  - Same treatment on the dedicated pages and the premium body (`PremiumListing.astro`).
  - **Confirm with Mike:** Daley's reading is stored as 9/23 (Pacific), and Mike wrote
    9/24. Ratings from the July import would read `*as of 7/26/2026`.
- [ ] P10.7 Review the other machine-sounding "source-observed" phrasing (city-industry
  taglines, services pages, page-count descriptions, editorial policy) and propose plain
  wording. **Mike approves before any change.**

### Footer
- [x] P10.8 `src/components/layout/Footer.tsx`: Done: Worker 10402d4a; live footer has 12 /services/ links, all 200.
  - The "Industries" column shows 6 industries as plain text. The other 6 render under
    "Resources", also plain text.
  - Fix: all 12 industries under Industries, each linked to `/services/<industry>/`
    (all 12 pages exist in `dist/services/`).
  - "Resources" keeps only Blog, Research Reports, Best Of, Editorial, Accessibility,
    Contact.
  - Cities are already links (checked live, 12 anchors). Leave them.

### Home page and content
- [x] P10.9 Home page blog teaser reads the real blog. Done: Worker 05041665 — shipped on Mike's "ship it" without the preview step; review https://oregonsmbdirectory.com/#cities (Newsroom). All 55 posts share date 2026-04-13, so "newest" is a tie and the three shown are the same three that head /blog/ (Albany, Ashland, Aurora). Real dates in frontmatter would fix the order.
  - Today `src/pages/index.astro` takes `blogPosts[0]` from `src/data/blog-posts.json`, a
    separate legacy file, not `src/content/blog/`.
  - Change it to the newest **2–3 posts** from the MDX collection, sorted by `date`.
    **Never more than 3.**
  - Show Mike what it looks like before shipping.
- [x] P10.10 Research index pagination and SEO. Done: Worker 1bc184c1. 25 reports spread 9/8/8 (filling to 12 left a 1-card page that failed C13 THIN at 40 words); unique titles/descriptions, self canonicals, rel prev/next links, pages 2–3 in sitemap.
  - `src/pages/research/index.astro` renders all reports on one page.
  - Change it to **max 12 per page**, with `/research/page/<n>/` pages, the same pattern
    as `blog/page/[page].astro` and `src/lib/paginate.ts`.
  - Each page gets a unique title and description, a self canonical, and page links in
    the markup. It stays in the sitemap and passes `verify-site.mjs`.
- [ ] P10.11 Best Of. **Deferred** (see decisions).

### Ship hygiene
- [x] P10.12 Push `master` to GitHub. Done 2026-09-23 21:36, origin/master in sync.
- [ ] P10.13 Owner emails for the 7 listings from the owner-listings handoff: draft,
  Mike approves, send.
- [ ] P10.14 Trade directories (roofers, plumbers, chiropractors): forms and email. Not
  started.
- [x] P10.15 Every fix above ships one at a time: edit, build, check, deploy, curl our own
  site, commit with the Worker version.

### Research
- [x] P10.16 Index `rar/` with codebase-intel, then write an analysis of how the scrapers
  and extractors are composed (stealth rules as they appear in code). The proof set is
  550K records over 8 days, with 0 bot flags. Done: `docs/RAR-SCRAPER-COMPOSITION-ANALYSIS.md`; index at `codebase-intel-toolkit/indexes/rar/`.
