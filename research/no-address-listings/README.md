# Listings published without a street address — 594

**Source:** every listing page the live JSON-LD audit flagged `LB_REQUIRED_ADDRESS`
(`reports/jsonld-audit-live-2026-09-24.json`). Built 2026-09-24.

| file | what |
|---|---|
| `listings.csv` | business name, Google Maps URL, website, phone, category, shard, slug, page URL |
| `listings.json` | the same, plus `address_in_first_commit` / `first_commit` (history check) |
| `lx-queue.jsonl` | 593 targets for `listings-extraction` (one has no Maps URL) |

## Was the address lost? What was checked
- **This repo's history:** for each record, its shard as first committed. 0 of 594 had an
  address then.
- **The older lineage** (`/mnt/c/Users/mikes/client-and-product-apps/oregon-smb-dir-production-dev`):
  593 of 594 matched by name; 0 have an address there.
- **The records themselves:** 593 carry a real `/maps/place/` URL, and 518 have a website.
  The categories are service-area trades (Plumber 103, Landscaper 69, Concrete contractor 66,
  Website designer 64, Roofing contractor 39, …). 54 carry Google's ocean placeholder pin
  (46.423669,-129.9427085), which Google gives a business with no public address.

**Reading so far [H]:** most are service-area businesses whose owners hid the street address
on Google, so there was none to scrape, rather than addresses the pipeline dropped. **Not
proven per listing.** Only each Google listing shows whether it states an address.

## How to settle it per listing
Run the extractor on the queue. It reads each Google place page and records `address`
(empty when Google shows none), `plus_code`, and `located_in`:

    cd listings-extraction
    uv run lx run ../research/no-address-listings/lx-queue.jsonl --run no-address --yes

- ~593 × ~25 s ≈ 4 h.
- **Only after the 12-city sweep finishes.** One browser on Google at a time.
- A listing whose Google page shows an address is a pipeline miss: patch it with a batch
  (`requests/listings/`, guide §Change protocol). One with no address is a service-area
  business, and its JSON-LD needs the P12.2 decision.
