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
