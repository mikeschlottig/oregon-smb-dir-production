# oregon-smb-directory — start here

**This is the live source for oregonsmbdirectory.com.** Branch `master`, remote
`github.com/mikeschlottig/oregon-smb-dir-production`, Worker `oregonsmbdirectory-site`.

**Not this repo:** `C:\Users\mikes\client-and-product-apps\oregon-smb-dir-production-dev`
(`/mnt/c/...` from WSL). It's an older lineage. Its `HANDOFF.md` calls itself the
"Canonical Worktree". That was true on 2026-08-18 and isn't any more. Don't work there.

## What to do next

Read the **newest** file in `handoffs/` (`ls -t handoffs | head -1`). The newest handoff is
current. Older ones are history. Never edit an old handoff. Write a new one when your
session ends.

## Build and deploy

- **Node:** `.nvmrc` pins it. The system Node fails the build. Both scripts load nvm
  themselves, so always use them.
- **Build:** `bash scripts/build-bg.sh build`. Success prints `BUILD_EXIT=0`. It takes
  about 3 minutes.
- **Deploy:** `bash scripts/deploy-bg.sh "<message>"`. Success prints `DEPLOY_EXIT=0`.
- **Check rendered listings:** `bash scripts/check-listing-pages.sh <dist paths>`.
- **How to wait:** run the build or deploy as one background command and wait for it to
  exit. Don't poll with sleep and grep. From a tool session that may end first, detach
  with `setsid nohup ... < /dev/null &` and write the log to a file.

## Data and gates

- **Listings:** each city-and-industry pair is a shard in `src/data/businesses/<city>__<industry>.json`.
- **Adding or patching listings:** `node scripts/add-listings.mjs <batch>`. Batches go in
  `requests/listings/`.
- **Ratings:** the site publishes a rating only when both of these hold:
  - the record's `googleUrl` carries the `0x…:0x…` feature ID
  - `src/data/rating-evidence.json` has a matching `"rating|reviews"` entry
- **Where the gates live:** `src/data/publication-gates.ts` and `scripts/audit-publication.mjs`.
- **Premium content:** `src/data/premiumListings.ts`. The build fails on a key that
  doesn't resolve to a published record.
