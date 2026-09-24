# Taxonomy and naming conventions — oregonsmbdirectory.com

What every entity and identifier is called, what it looks like, where its source of truth
lives, and which code reads or writes it. Types: `src/types/ids.ts`. Codec:
`src/lib/google-place-id.ts`. Enforcement: `scripts/check-id-literals.mjs` (build).

**Rule 0.** An identifier is never typed by hand. It is read from its source of truth (below)
and passed through its parser or codec. A hard-coded ID needs an `id-source:` comment naming
the file it came from, or the build fails.

## 1. Google place identity

One Google place has three equivalent IDs. Each converts to the others exactly; verified on
four live pairs (2026-09-24).

| name (TS / JSON-TS) | name (Python / exports) | shape | example | meaning |
|---|---|---|---|---|
| `featureId` | `feature_id` | `0x<hex>:0x<hex>`, lower case | `0x67e8203ccb735667:0xabc30730459f7f72` | the place's ID inside `/maps/place/…/data=…!1s<featureId>` URLs; **the key of `rating-evidence.json`** |
| `placeId` | `place_id` | `ChIJ` + 23 base64url chars | `ChIJZ1Zzyzwg6GcRcn-fRTAHw6s` | Places API / Maps URLs API ID; base64url of `0a 12 09 <hi LE> 11 <lo LE>` |
| `cid` | `cid` | decimal | `12376744104852160370` | decimal of the feature ID's second half ("ludocid") |

Conversions: `placeIdToFeatureId`, `featureIdToPlaceId`, `placeIdOf(url)`, `featureIdOf(url)`
in `src/lib/google-place-id.ts`; the same pair in `listings-extraction/src/lx/targets.py`.

**Shape is not proof.** Any 27-char string with the right prefix bytes decodes. Only the
source proves an ID is real: a URL Google produced (a record's `googleUrl`, an extraction's
`final_url`), an owner submission, or a live extraction whose identity check passed.

## 2. Google URLs

| name | what it is | source of truth | used for |
|---|---|---|---|
| `googleUrl` | the stored Google URL for a record: a `/maps/place/…` URL (carries `featureId`) or a Maps URLs API link (carries `query_place_id`) | the record in `src/data/businesses/<shard>.json` | identity for the rating gate (`getProviderRecordId` → `featureIdOf`) |
| `placeLink` | the link the site renders: `https://www.google.com/maps/search/?api=1&query=<name>&query_place_id=<placeId>` | built by `placeLink(name, googleUrl)` | "Open in Google Maps" buttons |
| `final_url` | the URL the browser landed on in an extraction | `listings-extraction/output/<run>/lx.sqlite` | identity check, place pin |

## 3. Directory entities

| name | shape | source of truth |
|---|---|---|
| `citySlug` | kebab-case, e.g. `grants-pass` | `src/data/cities.ts` |
| `industrySlug` | kebab-case, e.g. `health-medical` | `src/data/industries.ts` |
| `ShardKey` | `<citySlug>__<industrySlug>` | a file in `src/data/businesses/` |
| `BusinessSlug` | kebab-case, unique within a shard | the record's `slug` |
| listing URL | `/city/<citySlug>/<industrySlug>/<slug>/` | `[businessSlug].astro` (`getBusinessPathSlug`) |
| `sourceRecordId` | = `featureId` | `RatingObservation` in `src/data/businesses.ts` |

## 4. Where changes go (see DIRECTORY-EDITING-AND-CONFIGURATION-GUIDE.md §0)

- Listing fields: a batch in `requests/listings/`, applied by `scripts/add-listings.mjs`. Never
  re-serialize a shard.
- Ratings: the record (via batch) + a supplement block in `rating-evidence.json` with
  `observedAt` and `reportedBy`.
- Test fixtures: `listings-extraction/tests/fixtures/` and `scripts/jsonld-audit/fixtures/`.
  Invented IDs live only there, and a fixture file says SYNTHETIC in its first line.
