## RESULT: DONE
## Repo structure found (layouts, city/industry templates, data source — paths)
- Layout: `src/layouts/SiteLayout.astro`
- City page template: `src/pages/city/[citySlug].astro`
- Industry page template: `src/pages/city/[citySlug]/[industrySlug].astro`
- Data source: `src/data/businesses.ts` (imports JSON shards), `src/data/cities.ts`, `src/data/industries.ts`
- Components: `src/components/cards/IndustryCard.tsx` (React), `src/components/TldrCard.astro` (new)

## Files created/modified (full paths, 1 line each)
- `src/styles/tokens.css` (created — design tokens per spec)
- `src/layouts/SiteLayout.astro` (modified — tokens import, JetBrains Mono, typography styles)
- `src/components/TldrCard.astro` (created — typed Props, dark pine bg, breadcrumb/eyebrow/H1/tagline/stats)
- `src/pages/city/[citySlug].astro` (modified — TldrCard mounted, real stats, H2 sections)
- `src/pages/city/[citySlug]/[industrySlug].astro` (modified — TldrCard mounted, real stats, H2 sections)
- `src/components/cards/IndustryCard.tsx` (modified — real counts, --c-sage hover, --radius-md, count badge)

## Build: `cd /home/mikes/oregon-smb-dir-production && ./node_modules/.bin/astro build` → exit code 0
- `astro check` passed (only deprecation warnings for zod)
- Full build completed in ~55s with no errors

## Heading audit: H1 count per page type before/after
**Before:**
- City pages: H1 in hero section (bare city name)
- Industry pages: H1 in hero section ("{Industry} in {City}")

**After:**
- City pages: H1 inside TldrCard component ("{City}"), H2 for "Browse by Industry" section
- Industry pages: H1 inside TldrCard component ("{Industry} in {City}"), H2 for listings section
- Strict one-H1-per-page enforced via TldrCard component

## Notes for Phase 2 (BizCard, SEO blocks, FAQ schema, company header)
1. **BizCard component** (`src/components/BusinessFilterGrid.tsx` currently renders listings — needs elevation to match spec with logo/icon slot, star ratings in JetBrains Mono, address, tags, CTA buttons)
2. **SEO text blocks** — need `src/content/city-seo/` collection + render after listings on city pages
3. **FAQPage JSON-LD** — industry + company pages need 4-6 FAQ items with numeric answers
4. **Company header** — `src/pages/city/[citySlug]/[industrySlug]/[businessSlug].astro` needs dark TLDR header variant with "★ Verified" badge
5. **IndustryCard** — currently React (.tsx), consider converting to .astro for consistency (or leave if performance is acceptable)
6. **County data** — not in current `cities.ts`, omitted gracefully from TldrCard eyebrow (shows "Oregon I-5 Corridor" without county)
7. **Responsive testing** — TldrCard stats row wraps nicely on mobile, but should verify on actual devices
