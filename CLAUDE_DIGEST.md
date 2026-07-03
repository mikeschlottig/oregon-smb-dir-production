RESULT: DONE

## Files Changed
1. `src/data/cities.ts` — Added optional `county?: string` field to City type and populated with correct Oregon counties for all 12 cities
2. `src/components/TldrCard.astro` — Added optional `county` prop, updated eyebrow rendering to show `{region} · {county} County` format
3. `src/pages/city/[citySlug].astro` — Pass county prop to TldrCard, use city.tagline as tagline, add county stat pill when present
4. `src/lib/seo-content.ts` — Updated `generateCitySeoContent` to mention county in first paragraph when present

## County Table
| City | County |
|------|--------|
| Albany | Linn |
| Ashland | Jackson |
| Bend | Deschutes |
| Corvallis | Benton |
| Eugene | Lane |
| Grants Pass | Josephine |
| Klamath Falls | Klamath |
| Medford | Jackson |
| Portland | Multnomah |
| Roseburg | Douglas |
| Salem | Marion |
| Springfield | Lane |

## Build Exit Code
0 (Successful)

## Commit
- Branch: dev
- Hash: 09493af
- Message: "P5a: Add county field to cities, update TLDR card with county info, enhance SEO content"
- No push performed
