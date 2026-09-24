# oregon-smb-directory — the Astro source for oregonsmbdirectory.com

> **To change anything on the site, start with
> [`DIRECTORY-EDITING-AND-CONFIGURATION-GUIDE.md`](DIRECTORY-EDITING-AND-CONFIGURATION-GUIDE.md).**
> It covers listings, verification, ratings, cities, industries, service categories,
> blog, reports, Best Of, config, and the new-listing checklist.

<!-- projectstd:begin id=facts v=1 -->
| | |
|---|---|
| Kind | node |
| Run (dev) | `cd /home/mikes/oregon-smb-directory && npm run dev` |
| Run (start) | `cd /home/mikes/oregon-smb-directory && npm run start` |
| Agent contract | [`AGENTS.md`](AGENTS.md) |
<!-- projectstd:end id=facts -->

## What it is

A static directory of Oregon small businesses, organized by city and industry. It includes
provider pages, a blog, and Best Of lists. Astro builds it to `dist/`, and it's served by
the assets-only Cloudflare Worker `oregonsmbdirectory-site`. Publication gates decide which
fields, such as ratings, a listing is allowed to show.

## Quick start

- **Build:** `bash scripts/build-bg.sh build`. This uses the Node pinned in `.nvmrc`.
- **Deploy:** `bash scripts/deploy-bg.sh "<message>"`.
- **Status and next steps:** the newest file in `handoffs/`.

## Files

| path | what it holds |
|---|---|
| `src/data/businesses/` | listing shards, one per `<city>__<industry>.json` |
| `src/data/publication-gates.ts` | rules for what a listing is allowed to publish |
| `src/data/rating-evidence.json` | observed ratings, keyed by Maps feature ID |
| `src/data/premiumListings.ts` | premium page content |
| `requests/listings/` | batches of owner-requested listings (input to `scripts/add-listings.mjs`) |
| `scripts/` | build, deploy, audit, and listing tools |
| `handoffs/` | per-session handoffs; the newest one is current |
| `tasks.md` / `hypothesis.md` | the repair plan and its evidence |
| `_archive/` | removed material, one dated folder per removal |

## Verification

The last recorded run is in the newest handoff:
`handoffs/2026-09-23T0050_claude_owner-listings.md`. Worker version `67883cd5`, and every
new listing returned 200 live. This README makes no claim that hasn't been re-run since then.
