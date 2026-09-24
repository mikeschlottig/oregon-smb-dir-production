# PDX Fingerprinting split records — archived 20260923-211650

**What was removed:** the two records `pdx-fingerprinting-hillsboro` and
`pdx-fingerprinting-lake-oswego` from `src/data/businesses/portland__business-professional-services.json`,
copied into `portland__business-professional-services.pdx-records.json`.

**Why:** tasks.md P10.2 — Mike merged them into one Portland listing, `pdx-fingerprinting`,
carrying both service addresses. The two old URLs redirect 301 to the new one via
`public/_redirects`.

**Restore:** paste the two objects back into the shard array, remove the
`pdx-fingerprinting` record, its dedicated page and its `dedicatedPages.ts` entry, and
delete the two `_redirects` lines.
