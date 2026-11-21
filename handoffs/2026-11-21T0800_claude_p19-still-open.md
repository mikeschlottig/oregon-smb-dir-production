# Handoff — still-open items after P19 (2026-11-21 08:00)

Context, by query rather than by reading: doc-intel indexes `/home/mikes/doc-intel/indexes/oregon-smb-directory.db`
(this repo, rebuilt nightly 05:10) and `C:\Users\mikes\doc-intel\indexes\sessions.db` (session
bdffe815-dea1-4f9f-9064-8a10f3536f89). Background: `docs/STANDARDS-AUDIT-2026-11-21.md`, `tasks.md` P19–P20,
`hypothesis.md` H37. Build and deploy only with `scripts/build-bg.sh build` and `scripts/deploy-bg.sh "<msg>"`; pull
first, push after. After any markdown-pipeline change run `npx astro sync --force` before building.
From Windows: never put text with quotes or apostrophes inline in `wsl.exe bash -lc`; Write a file, then run it.

## 1. TL;DR + Key Takeaways on posts and reports (65 pages) — STD-SEO-001 §4
- Add optional `tldr` (string) and `takeaways` (string[]) to the blog and research collection schemas
  (`src/content.config.ts` or `src/content/config.ts`); the two `[slug].astro` templates render a TL;DR block first
  and a Key Takeaways callout at the end. Missing fields render nothing, so posts can be done in batches.
- Per post: read it (doc-intel `section` for long reports), write 2–4 TL;DR sentences and 2–4 takeaways that restate
  what the post says. No new claims. Run the anti-slop phrase scan on the new text.
- Done when qc-site shows no "post: no TL;DR" or "post: no Key Takeaways" rows.

## 2. Keyword slugs for posts and reports (80 URLs) — STD-SEO-001 §1
- Today's slugs are whole headlines (longer than 60 characters), so slug-first and title ≤ 60 cannot both hold.
- Per post: pick a 2–5 word keyword slug that appears verbatim in the title and H1 (e.g. `/blog/albany-oregon-history/`).
  Set it as the entry id, add `/old/ → /new/ 301` lines (slash and slashless) to `public/_redirects`, and update
  internal links (`grep -rn` the old slug).
- Batches of 10; after each deploy, curl every old URL (expect 301 → 200).

## 3. Listing slugs that lost accented letters (27) — D1b
- e.g. "Dobrá Tea" → `dobr-tea`, "MÄS" → `m-s`, "Northwest Autohäus" → `northwest-autoh-us`. List them with the
  normalized slug-vs-title check in `scripts/` (or recompute: NFKD, strip marks, kebab-case the title).
- Move each with `scripts/add-listings.mjs` (mode `remove` + `add`, which archives the old record) and add
  301 lines to `public/_redirects`, as done for Major Fluke in P18 (requests/listings/2026-11-21-contact-submissions.json).

## 4. City photos (low priority — Mike, 2026-11-21)
- Card sources in `src/images/cities/` are 800 px wide, so they look soft on 3× phones (slot ~1,070 px). The originals
  were high quality but their location is unknown. If it comes up: `atlas find "albany*"` / `atlas find "*bend*.jpg"`
  across the backup buckets before asking anyone. `CARD_WIDTHS` already serves 1200 px when a source is that wide.

## 5. Speed (Lighthouse performance 75–89) — follow the perf skill
- Skill: `C:\Users\mikes\.agents\skills\astro-cloudflare-perf-audit\SKILL.md` (principles; it may map exactly).
- Phase 0 baseline: `scripts/cdp-perf-audit.mjs --base https://oregonsmbdirectory.com --routes / /city/bend/
  /city/bend/beauty-personal-care/ /city/bend/beauty-personal-care/salon-twist/ /blog/`.
- Levers found in P19: the Google Maps iframe on every listing page (~330 KB JS; reference 03: click-to-load),
  Google Fonts from `fonts.googleapis.com` in `src/layouts/SiteLayout.astro` (reference 04: local fonts + preload),
  PostHog `array.js` 125 KB on every page (load after first interaction), `public/_headers` immutable caching
  for `/_astro/*` (reference 04). Gate with `scripts/verify-perf-gates.mjs`, then Lighthouse mobile ≥ 90.

## 6. Eugene listings-extraction backup to R2 (unblocked: the kwsweep finished)
- Gap: `listings-extraction/output` health-wellness DB on disk 11.3 MB (11-20) vs 4.7 MB in R2 (11-18); atlas fails
  nightly with "key already exists" because something outside atlas wrote the 11-18 copy and the listing is stale.
- From `/home/mikes/r2-backup-atlas`: `bash /home/mikes/scripts/resource-watch.sh --once` (must be 0/1) →
  `atlas snapshot --force -b wsl2` → `atlas build` → `atlas manifest -b wsl2 --execute` →
  `atlas backup wsl-home --under oregon-smb-directory/listings-extraction/output` (dry run, read it) → `--execute`
  → `atlas verify wsl-home --under oregon-smb-directory/listings-extraction/output --hash`.
- snapshot --force + build are heavy (crashed the host twice on 2026-10-14): run them idle, one at a time.
