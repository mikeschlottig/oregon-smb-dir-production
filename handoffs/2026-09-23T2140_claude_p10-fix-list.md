# Handoff — P10 fix list, 2026-09-23 21:40 PDT (Claude)

## NOT done — needs Mike

- **P10.3 ratings** for Deepli, Apex, North Tabor Dental, Capital Nomics and Cascadia
  Putting Club. These need Mike's numbers. None are published.
- **P10.7 wording review.** The "source-observed" phrasing is still on city-industry
  taglines, services pages, page-count descriptions, the editorial policy and the listing
  provenance fallback. These change only after Mike approves the proposed wording.
- **P10.13 owner emails:** not drafted. **P10.14 trade directories:** not started.
  **P10.11 Best Of:** deferred.
- **Confirm the Daley date.** It shows `*as of 9/23/2026` (Pacific). Mike wrote 9/24.
- **Home blog order has no real signal.** All 55 posts have the date `2026-04-13`, so the
  "3 newest" are the same three that head /blog/ (Albany, Ashland, Aurora). Real dates in
  the frontmatter would fix this.
- **116 listings pin to Google places outside Oregon** (see
  `reports/maps-pins-outside-oregon-2026-09-23.csv`, a gitignored local file). The pages
  now use the address search instead. The records probably point at the wrong business
  and need review.

## Shipped (each one built, deployed, curled live and committed separately; pushed to origin/master)

| task | Worker | commit |
|---|---|---|
| P10.1 LeverageAI verified + website | 5fa0b6f2 | 2c91264 |
| P10.4 map embeds pinned (132 → 9,780 records) | 8dc286f3 | d40a6fb |
| P10.5 Daley note wording, Pacific dates | e34c32ff | cacfaae |
| P10.8 footer: 12 industries linked | 10402d4a | 345a580 |
| P10.6 `4.6 ★ (10 reviews)*` + `*as of M/D/YYYY` | 75c42294 | 892378a |
| P10.2 PDX Fingerprinting merged, 301s | 1a4695e3 | f4fc139 |
| P10.10 research pagination 9/8/8 | 1bc184c1 | 577d41e |
| P10.9 home shows 3 latest MDX posts | 05041665 | 92893b5 |

## Things the next agent needs

- `public/_redirects` exists now. The assets-only Worker honours it: live 301s were
  checked with curl.
- A deploy takes about 20–30 s to show up on the live site. The first curl after
  `DEPLOY_EXIT=0` can still return the old version.
- `src/lib/rating-display.ts` is the only place rating wording is set.
- `parseLatLng` rejects coordinates outside Oregon's bounding box, on purpose.
- PDX is a **dedicated page**, not a premium profile, because the owner-listings handoff
  classed it as verified standard. Its translation copy cites
  `/certified-document-translation-service/`, because `/document-translation-service/`
  now redirects to the home page.
