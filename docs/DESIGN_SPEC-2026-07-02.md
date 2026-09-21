# Oregon SMB Directory — UI/SEO Design Spec (2026-07-02)

Structured design upgrade for City, Industry, and Company pages: design tokens, TLDR cards, SEO text blocks, heading hierarchy, card components. Source: Mike's approved design recommendation.

## TL;DR — 5 core changes
1. **Design tokens** — documented Oregon-rooted token system (pine, river, copper) as CSS custom properties.
2. **TLDR card** — every page opens with dark-bg summary card: breadcrumb → H1 → one-sentence description → 3–4 stat pills.
3. **SEO text block** — 150–200 word geo-optimized prose BELOW the listings (never inline/above), entity-dense, proper H2/H3 nesting.
4. **Heading structure** — strict one-H1-per-page; industry cards H3; business names H2 on detail pages only; never skip levels.
5. **Industry + business cards** — elevated card component with hover state, count badge, icon slot replacing bare text links.

## Design tokens (`src/styles/tokens.css`, imported globally in base layout; NEVER hardcode hex in components — always `var(--c-*)`)
| Token | Value | Use |
|---|---|---|
| `--c-pine` | `#1A3329` | Page headers, nav bg, H1 text, TLDR card bg |
| `--c-river` | `#2A6049` | Links, active states, CTAs |
| `--c-sage` | `#5C7E6E` | Hover borders, icon fills |
| `--c-copper` | `#C45E2A` | Accent: buttons, eyebrows |
| `--c-copper-lt` | `#F0C4A0` | Tags, stat values on dark bg |
| `--c-sky` | `#D4E8DF` | Icon bg, chip bg, code blocks |
| `--c-stone` | `#F4F1EB` | Page bg, callout bg, alt rows |
| `--c-border` | `#DDE4DC` | Card borders, dividers, hr |

Spacing: base 4px ladder — `--space-2`:8px (icon gap, tag padding), `--space-4`:16px (compact card/nav padding), `--space-6`:24px (standard card padding, section gap), `--space-8`:32px (hero card padding), `--space-12`:48px (section v-padding mobile), `--space-16`:64px (desktop). Min touch target 44px.
Radius: `--radius-sm`:4px (buttons, badges), `--radius-md`:8px (cards, chips, inputs), `--radius-lg`:16px (TLDR card, modals), `--radius-full`:9999px (tags, pills, icon circles).

## Typography
Google Fonts (base layout): `https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@600&display=swap`
- H1: Playfair 700 · 3rem · lh 1.1
- H2: Playfair 700 · 2.25rem · lh 1.2
- H3/card title: Inter 600 · 1.375rem · lh 1.3
- Body/lead: Inter 400 · 1.125rem · lh 1.65
- Eyebrow: Inter 700 · 0.75rem · uppercase · letter-spacing 0.12em
- Stat/mono: JetBrains Mono 600 · 1.75rem (numeric data ONLY: ratings, counts)

## TLDR card component spec (signature element, top of every page)
| Slot | City | Industry | Company |
|---|---|---|---|
| Background | `--c-pine` | `--c-pine` | `--c-pine` |
| Breadcrumb | Home › Cities › {City} | Home › {City} › {Industry} | Home › {City} › {Industry} › {Biz} |
| Eyebrow | Oregon I-5 Corridor · {County} | {City} · {County}, OR | Verified Listing · {Category} |
| H1 | City name | {Industry} in {City} | Business name |
| Tagline | 1 sentence: terrain + pop | "{N} verified {category} serving {city}" | "{Category} in {City}, Oregon" |
| Stats row | Industries · Listings · Population | Count · Avg Rating · Updated date | Rating · Review count · Hours status |

SEO rule: tagline = primary LLM-extractable answer unit; MUST contain city name + industry/business type + "Oregon" + a numeric entity.

## Page structures
**City page:** TLDR card → H2 "Browse by Industry in {City}" + icon-card grid (3-col desktop / 2-col mobile; each card: icon circle, H3 industry name, sub-line, "{N} listings →" badge, hover border `--c-sage`) → H2 "About {City}" SEO text block with anchor links to top industry pages → optional H2 Featured Businesses (3 cards) → footer.
**Industry page:** TLDR card → sticky filter bar (subcategory chips + sort) → H2 "Top Rated in {City}" + elevated BizCards (logo/icon slot, name, category, star rating + review count in mono, address, tags, View Details/Website/Maps buttons; paginated 15/page) → H2 "About {Industry} in {City}" SEO block → H3 FAQ accordion (4–6 questions, each with numeric/verifiable answer) with `FAQPage` JSON-LD → footer.
**Company page:** dark TLDR header variant (badge "★ Verified · Top Rated", H1 biz name, tagline, meta line: address · phone · open-now) → 2-col desktop (left 2/3: H2 About {Biz} 150w entity-dense, H3 Services tag list, H3 Hours table, H2 Customer Reviews 3 excerpts, H2 FAQ w/ schema; right 1/3 sticky: CTA card, map embed, contact block, "List Your Business" CTA) → H2 "More {Industry} in {City}" 3 related cards → footer.

## SEO text block spec
150–200 words, entity-dense (≥2 verifiable entities per paragraph), geo-optimized, placed AFTER listings and BEFORE FAQ. Never pushes listings below fold. Mobile: may collapse behind "Learn more about {Industry} in {City}" toggle. Content lives in content collections (e.g. `src/content/city-seo/`), not hardcoded in templates.

## Heading rules
One H1 per page containing primary keyword phrase. City H1 = city name WITH visible tagline directly below containing city + state + category intent (fixes current bare-proper-noun H1 bug). Never skip levels. H4 only for individual FAQ question text.

## JSON-LD
Every industry + company page emits `FAQPage` schema in `<script type="application/ld+json">`. 4–6 questions/page, each answer contains a specific numeric or verifiable fact.

## Implementation order
| # | Task | Files | Pri |
|---|---|---|---|
| 1 | CSS token file | `src/styles/tokens.css` | P1 |
| 2 | Import tokens in base layout | base layout | P1 |
| 3 | `<TldrCard>` component | `src/components/TldrCard.astro` | P1 |
| 4 | TLDR card on city page | city page template | P1 |
| 5 | Fix heading structure city+industry | templates | P1 |
| 6 | Industry grid → icon cards | `src/components/IndustryCard.astro` | P1 |
| 7 | Listing rows → elevated BizCard | `src/components/BizCard.astro` | P2 |
| 8 | SEO text block on city page | city template + `src/content/city-seo/` | P2 |
| 9 | SEO block + FAQ on industry page | industry template + collection | P2 |
| 10 | Company page dark TLDR header | `src/components/CompanyHeader.astro` | P2 |
| 11 | FAQPage JSON-LD industry+company | layout or per-page | P2 |
| 12 | Google Fonts import | base layout | P3 |

## Scope boundary
Covers: tokens, TLDR cards, SEO text blocks, heading structure, card components. Does NOT cover: nav redesign, homepage hero, search/filter backend, image CDN.
