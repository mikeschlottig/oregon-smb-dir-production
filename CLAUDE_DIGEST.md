# Phase3: schema.org JSON-LD — Digest

## RESULT
✅ Completed. All pages wired with typed schema builders + single `JsonLd.astro` component. Build exit 0, 10433 pages generated in 54.66s.

## Files Changed
- `src/lib/schema.ts` (new) — typed builders: `websiteSchema`, `breadcrumbSchema`, `cityPageSchema`, `industryPageSchema`, `businessSchema`, `blogPostSchema`, `reportSchema`
- `src/components/JsonLd.astro` (new) — single component for all JSON-LD output
- `src/layouts/SiteLayout.astro` — replaced `jsonLd` prop with `schemas` prop, renders `JsonLd` component
- `src/pages/index.astro` — uses `websiteSchema` + `breadcrumbSchema`
- `src/pages/city/[citySlug].astro` — uses `cityPageSchema` + `breadcrumbSchema`
- `src/pages/city/[citySlug]/[industrySlug].astro` — uses `industryPageSchema` + `breadcrumbSchema` (FAQPage via existing `FaqSchema`)
- `src/pages/city/[citySlug]/[industrySlug]/[businessSlug].astro` — uses `businessSchema` + `breadcrumbSchema` (FAQPage via existing `FaqSchema`)
- `src/pages/blog/index.astro` — uses `breadcrumbSchema` + CollectionPage
- `src/pages/blog/[slug].astro` — uses `blogPostSchema` + `breadcrumbSchema`
- `src/pages/blog/category/[category]/index.astro` — uses `breadcrumbSchema` + CollectionPage
- `src/pages/blog/category/[category]/page/[page].astro` — uses `breadcrumbSchema` + CollectionPage
- `src/pages/blog/page/[page].astro` — uses `breadcrumbSchema` + CollectionPage
- `src/pages/best-of/index.astro` — uses `breadcrumbSchema` + CollectionPage
- `src/pages/best-of/[slug].astro` — uses `breadcrumbSchema` + ItemList
- `src/pages/research/index.astro` — uses `breadcrumbSchema` + CollectionPage
- `src/pages/research/[slug].astro` — uses `reportSchema` + `breadcrumbSchema`
- `src/pages/contact.astro` — uses WebPage + `breadcrumbSchema`
- `src/pages/404.astro` — uses WebPage + `breadcrumbSchema`

## Build Exit
`astro build` exit 0 — 10433 pages built in 54.66s.

## Schema Types per Page Type
| Page Type | Schemas |
|-----------|---------|
| Home | WebSite, Organization, BreadcrumbList |
| City | CollectionPage, ItemList (industries), BreadcrumbList |
| Industry | CollectionPage, ItemList (businesses), BreadcrumbList, FAQPage (existing) |
| Company | LocalBusiness, BreadcrumbList, FAQPage (existing) |
| Blog index | CollectionPage, BreadcrumbList |
| Blog post | BlogPosting, BreadcrumbList |
| Blog category | CollectionPage, BreadcrumbList |
| Blog pagination | CollectionPage, BreadcrumbList |
| Best-of index | CollectionPage, BreadcrumbList |
| Best-of post | ItemList, BreadcrumbList |
| Research index | CollectionPage, BreadcrumbList |
| Research post | Report, BreadcrumbList |
| Contact | WebPage, BreadcrumbList |
| 404 | WebPage, BreadcrumbList |

## Parsed JSON-LD Sample (Company Page: Maxim Auto Care)
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Maxim Auto Care",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1024 SE Stephens St, Portland, OR 97214",
    "addressLocality": "Portland",
    "addressRegion": "OR",
    "addressCountry": "US"
  },
  "telephone": "(503) 4843448",
  "url": "https://oregonsmbdirectory.com/city/portland/automotive/maxim-auto-care",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 5.0,
    "reviewCount": 149
  },
  "description": "Auto repair shop"
}
```

## Parsed JSON-LD Sample (Research Page: AI Experts)
```json
{
  "@context": "https://schema.org",
  "@type": "Report",
  "name": "Agent Experts: Learning AI Systems",
  "description": "...",
  "author": { "@type": "Organization", "name": "LEVERAGE AI Research" },
  "publisher": { "@type": "Organization", "name": "Oregon SMB Directory", "logo": { "@type": "ImageObject", "url": "..." } }
}
```

## Omitted Fields (Data Lacked)
Per `Business` type in `src/data/businesses.ts`, the following schema.org fields were **intentionally omitted** (not present in data model):
- `geo` (no lat/lng fields in Business type)
- `openingHours` (not in Business type)
- `priceRange` (not in Business type)
- `sameAs` (not in Business type — `website` field exists but maps to `url` of the directory page, not `sameAs`)
- `hasMap` (not in Business type)
- `telephone` (omitted when `phone` field is null/undefined)
- `aggregateRating` (omitted when either `rating` or `reviews` is null/undefined)
- `address` (omitted when `address` field is null/undefined)

No fabricated data, no hardcoded URLs, no inline script tags — all JSON-LD routed through `JsonLd.astro` via `schemas` prop in `SiteLayout`.
