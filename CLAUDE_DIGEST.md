RESULT: Fixed — Total Listings now 9763 (was 3432) by deriving industry slugs from data layer

## Fix Applied

**File**: `src/pages/city/index.astro`

**Change**: Replaced hardcoded wrong industry slugs array with dynamic derivation from `industries` array imported from `@/data/industries.ts`.

**Before** (lines 12-20):
```typescript
const industriesWithListings = ["construction-home-services", "restaurants", "retail", "healthcare", "automotive", "professional-services", "real-estate", "hospitality", "technology", "manufacturing", "education", "personal-services"].filter(indSlug =>
  getBusinesses(city.slug, indSlug).length > 0
);
```

**After**:
```typescript
import { industries } from "@/data/industries";

const cityStats = cities.map(city => {
  const industriesWithListings = industries.filter(ind =>
    getBusinesses(city.slug, ind.slug).length > 0
  );
  const totalListings = industriesWithListings.reduce(
    (sum, ind) => sum + getBusinesses(city.slug, ind.slug).length,
    0
  );
  return { city, industriesCount: industriesWithListings.length, totalListings };
});
```

## Verification

| Metric | Value | Source |
|--------|-------|--------|
| New Total Listings count | **9,763** | `dist/city/index.html` built output |
| Previous wrong count | 3,432 | Hardcoded wrong slugs |
| Industry slugs source | `src/data/industries.ts` | Canonical data layer |
| Build status | ✅ Success | 10,781 pages built in 84.31s |
| Link audit (non-blog broken) | **0** | `node scripts/audit-links.js` |

## Sweep Results

Searched `src/` for other uses of wrong slugs (`'restaurants'`, `'healthcare'`, `'hospitality'`, `'personal-services'`, `'professional-services'`, `'technology'`, `'manufacturing'`, `'education'` as industry slugs):

**Result**: No other files contain these wrong slugs. Only `src/pages/city/index.astro` needed fixing.

## Commit

```
Fix: derive Total Listings from data industry slugs (was hardcoded, showed 3432)
```

Branch: `dev` (not pushed to main)
