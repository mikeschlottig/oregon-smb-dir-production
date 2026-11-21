# JSON-LD side by side — listing page (STD-SEO-001 row 7) — 2026-11-21

Page: https://oregonsmbdirectory.com/city/grants-pass/construction-home-services/m-b-landscaping/
(the `LocalBusiness` node; the page's other block is `BreadcrumbList`, graded by verify-site C02–C08).
Reference: schema.org/LocalBusiness, Example 1 (`#eg-0004`, schema.org V30.1, 2026-09-16). That example's
`@type` is `Restaurant`, a LocalBusiness subtype. It was read through a fetch agent, which restated it property by
property; it was not copied verbatim.

| line | schema.org example | our page | verdict |
|---|---|---|---|
| `@context` | `https://schema.org` | `https://schema.org` | match |
| `@type` | `Restaurant` (most specific subtype) | `LocalBusiness` | **gap**: listing categories ("Landscape designer") are Google categories with no 1:1 schema.org subtype map yet; jsonld-audit LB_MOST_SPECIFIC_TYPE tracks it |
| `address` | PostalAddress: streetAddress, addressLocality, addressRegion, postalCode | the same four + `addressCountry` | match (+ extra-ok) |
| `aggregateRating` | ratingValue "4", reviewCount "250" | — | **gap, by design**: the ratings are Google Maps figures, and Google's review-snippet policy forbids marking up ratings taken from other sites (verify-site C18) |
| `name` | `GreatFood` | `M & B Landscaping` | match |
| `openingHours` | three day/time ranges | — | **gap**: maps-intel holds hours (`hours_json`) for most CID-matched listings; not yet enriched |
| `priceRange` | `$$` | — | gap: no source data |
| `servesCuisine` | two cuisines | — | n/a (Restaurant-only property) |
| `telephone` | `(408) 714-1489` | `+1-541-761-5872` | match (shape) |
| `url` | the business's own website | this directory page | **gap, by design (D14)**: verify-site C14 and the jsonld-audit rubric require an on-origin `url`. The business's confirmed website goes in `sameAs` from this change on |
| `sameAs` | — | business website, when confirmed | extra-ok (defined for Thing) |
| `description` | — | the business's category | extra-ok |

Result: zero `wrong`. Every gap is either fixed (`sameAs`), noted with its reason (`aggregateRating`, `url`), or
listed as open enrichment (`@type` subtype, `openingHours`).
