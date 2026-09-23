# Handoff — oregonsmbdirectory.com owner listings

- **Written:** 2026-09-23 00:50 PDT
- **Session:** Claude (claude.ai chat)
- **Repo:** `/home/mikes/oregon-smb-directory` (WSL). This is the live source; branch `master`.
- **Do not use:** `C:\Users\mikes\client-and-product-apps\oregon-smb-dir-production-dev`. That's an older lineage.

## Where I left off
- **Task in progress:** adding real Google Maps URLs and ratings to the 7 new listings.
  - The URLs need to contain the `0x…:0x…` feature ID. The site only publishes a rating when the record's `googleUrl` carries that feature ID *and* `src/data/rating-evidence.json` has a matching `"rating|reviews"` entry.
- **Mike's instruction:** take each place_id, extract fields from Google Maps with Scrapling using **his specific stealth config**, which avoids bot flags.
  - Scrapling CLI is at `/home/mikes/.local/bin/scrapling`, installed as a uv tool.
  - I did **not** locate his stealth config file. Ask Mike or find it before scraping.

## Done
- **Live on oregonsmbdirectory.com**, all returning 200, all with Verified badge and confirmed website:
  - **Premium:** xcelent-concrete-services, deepli-clean, apex-business-marketing, north-tabor-dental, capital-nomics.
  - **Verified standard:** cascadia-putting-club, pdx-fingerprinting-hillsboro, pdx-fingerprinting-lake-oswego.
- **Deployed:** Worker `oregonsmbdirectory-site`, version `67883cd5`.
- **Commits:** `3bef3b3` (listings and premium tier), `2054d5f` (premium header fix). **Not pushed to GitHub yet.**
- **Source data:** D1 `oregonsmbdirectory.contact_submissions`, ids 8, 9, 10, 12, 13, 24, 25. Id 11 is spam and was skipped.
- **Files created or edited:**
  - `/home/mikes/oregon-smb-directory/requests/listings/2026-09-23-contact-submissions.json`: the request batch, with an audit trail per listing.
  - `/home/mikes/oregon-smb-directory/scripts/add-listings.mjs`: applies a batch as text splices. Supports `mode: "patch"` and rejects anything the gates would strip.
  - `/home/mikes/oregon-smb-directory/src/data/premiumListings.ts`: premium content per business. The build fails if a key doesn't resolve to a published record.
  - `/home/mikes/oregon-smb-directory/src/components/PremiumListing.astro`: premium page body.
  - `/home/mikes/oregon-smb-directory/src/pages/city/[citySlug]/[industrySlug]/[businessSlug].astro`: premium switch, "Verified" label, premium JSON-LD with FAQPage, premium stats and banner in the header.
  - Shards under `/home/mikes/oregon-smb-directory/src/data/businesses/`:
    - `portland__construction-home-services.json` (Xcelent patched in place; its existing rating is kept)
    - `portland__business-professional-services.json`
    - `portland__health-medical.json`
    - `portland__sports-fitness.json`
    - `bend__business-professional-services.json`
  - `/home/mikes/oregon-smb-directory/scripts/build-bg.sh`: full build on Node 22 via nvm.
  - `/home/mikes/oregon-smb-directory/scripts/deploy-bg.sh`: `wrangler deploy`.
  - `/home/mikes/oregon-smb-directory/scripts/check-listing-pages.sh`: verifies rendered listing pages in `dist`.
- **How to run build and deploy:** detached, or the session hangup kills them.
  - Build: `setsid nohup bash scripts/build-bg.sh build > /tmp/osd-build.log 2>&1 < /dev/null &`
  - Success marker: `BUILD_EXIT=0`. Deploy prints `DEPLOY_EXIT=0`.

## Still needs doing
1. **Ratings and Maps URLs.**
   - Scrape each place_id with the stealth config. Confirm: feature ID, rating, review count, category, hours.
   - Feature IDs already derived from the place_ids (decoding verified against a known record):

     | Listing | Feature ID |
     |---|---|
     | deepli | `0x67e8203ccb735667:0xabc30730459f7f72` |
     | apex | `0x585442bc72cbdc1:0x619096285d1cba63` |
     | north-tabor | `0x5495a0e0ff6c49ff:0xfdaee010900df06b` |
     | capital-nomics | `0x54b8c86c101572e7:0x66a485d39f73d8f5` |
     | pdx-hillsboro | `0x54950f18a1066bc7:0xd5daf738ddd7b67d` |
     | pdx-lake-oswego | `0x54957312d3331181:0x11fd41e84a3a68d5` |

   - Places ratings from 2026-09-23 (re-confirm with the scrape): PDX-H 4.9/344, PDX-LO 4.9/247, NTD 4.7/31, Apex 5.0/15, Deepli 5.0/2. Capital Nomics has none.
   - Xcelent already has feature ID and rating 4.8/124.
   - Cascadia: no Maps listing found. Search again with Scrapling.
2. **Apply the scraped fields.**
   - Add a `mode: "patch"` batch under `/home/mikes/oregon-smb-directory/requests/listings/` setting `googleUrl` (real place URL containing the feature ID), `rating`, and `reviews`.
   - Run `node scripts/add-listings.mjs <batch>`.
3. **Rating evidence.**
   - Add the new `"<ftid>": "rating|reviews"` entries to `/home/mikes/oregon-smb-directory/src/data/rating-evidence.json`.
   - Open question: that file has one `observedAt` (2026-07-26) for all 9,187 entries. Either accept that, or add a supplemental block with its own date. The supplemental block needs matching edits in `/home/mikes/oregon-smb-directory/src/data/publication-gates.ts` (`buildRatingObservation`) and `/home/mikes/oregon-smb-directory/scripts/audit-publication.mjs` (around line 58).
4. **Ship and verify.**
   - Rebuild, then run `bash scripts/check-listing-pages.sh <paths>`, deploy, and curl the live pages.
   - `git push origin master` (remote: github.com/mikeschlottig/oregon-smb-dir-production).
5. **Owner emails** for all 7: draft, get Mike's OK, then send. Nothing drafted yet. Mark D1 rows handled after sending.
6. **Premium extras not built yet:** dedicated article and SEO/GEO audit per premium listing.
7. **Not started: forms and email for the trade directories.**
   - Workers `oregon-plumbers`, `or-chiropractors` / `or-chiropractors-api`, `oregon-roofers-inbox`.
   - Candidate repos:
     - `/home/mikes/business-directories-leverage-ai-salessystem-cloudflare/oregon-plumbers-directory`
     - `/home/mikes/business-directories-leverage-ai-salessystem-cloudflare/or-roofing-directory`
   - Chiropractors repo not yet located.
