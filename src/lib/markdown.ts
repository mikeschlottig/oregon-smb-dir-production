/**
 * Markdown twins of the site's pages, for AI agents and answer engines (P20 E, 2026-11-21). Same implementation as
 * Deedline (C:\Dev\directory_websites\real_estate: src/lib/markdown.ts + src/pages/**\/*.md.ts): every page type has
 * a `.md` sibling (`/city/bend/` → `/city/bend.md`), the HTML page links it with
 * <link rel="alternate" type="text/markdown">, and every twin opens with a `#` title, a `>` summary and its source.
 * Built from the same data as the pages, so the two cannot disagree.
 */
import { publisher } from "@/data/publisher";
import type { City } from "@/data/cities";
import type { Industry } from "@/data/industries";
import { getBusinessPathSlug, type Business } from "@/data/businesses";
import { formatPhone } from "@/lib/phone";
import { ratingDate } from "@/lib/rating-display";
import { placeLink } from "@/lib/google-place-id";

export const SITE_URL = "https://oregonsmbdirectory.com";
/** The same signal Deedline publishes: answers and search may use the content, model training may not. */
export const CONTENT_SIGNAL = "ai-input=yes, search=yes, ai-train=no";

/** `/city/bend/` → `/city/bend.md`; `/` → `/index.md`. */
export const mdPath = (htmlPath: string): string => (htmlPath === "/" ? "/index.md" : `${htmlPath.replace(/\/$/, "")}.md`);

/**
 * The twin for an HTML path, or null where none is built (paginated slices, blog category pages, the policy pages,
 * /best-of/ while it is empty). scripts/check-markdown-twins.mjs proves every advertised twin exists after a build.
 */
export function markdownTwinFor(pathname: string): string | null {
  if (/\/page\/\d+\/$/.test(pathname)) return null;
  if (pathname.startsWith("/blog/category/")) return null;
  if (/^\/(best-of|privacy|accessibility|editorial-policy|404)(\/|$)/.test(pathname)) return null;
  return mdPath(pathname);
}

export const listingPath = (city: City, industry: Industry, b: Business): string =>
  `/city/${city.slug}/${industry.slug}/${getBusinessPathSlug(city.slug, industry.slug, b)}/`;

const sourceLines = (path: string): string =>
  [`Source: ${SITE_URL}${path}`, `Method: ${SITE_URL}${publisher.editorialPolicyUrl}`, `Content signal: ${CONTENT_SIGNAL}`].join("\n");

const showsWebsite = (b: Business): boolean => Boolean(b.website && b.websiteStatus === "confirmed");

const ratingText = (b: Business): string =>
  typeof b.rating === "number"
    ? `${b.rating.toFixed(1)} / 5 on Google${typeof b.reviews === "number" ? ` (${b.reviews.toLocaleString("en-US")} reviews)` : ""}${b.ratingObservation ? `, as of ${ratingDate(b.ratingObservation.observedAt)}` : ""}`
    : "not shown";

/** One line per business in a list: name (linked), category, rating, phone. */
export const listingLine = (city: City, industry: Industry, b: Business): string =>
  `- [${b.title}](${SITE_URL}${listingPath(city, industry, b)})${b.category ? ` — ${b.category}` : ""}${typeof b.rating === "number" ? ` · ${b.rating.toFixed(1)} ★${typeof b.reviews === "number" ? ` (${b.reviews.toLocaleString("en-US")})` : ""}` : ""}${b.phone ? ` · ${formatPhone(b.phone)}` : ""}`;

export function listingMarkdown(b: Business, city: City, industry: Industry, peers: number): string {
  const path = listingPath(city, industry, b);
  const kind = (b.category ?? industry.name).toLowerCase();
  const maps = placeLink(b.title, b.googleUrl ?? undefined) ?? b.googleUrl ?? null;
  return `# ${b.title}

> ${b.title} is a ${kind} in ${city.name}, Oregon (${city.county} County).${typeof b.rating === "number" ? ` Rated ${ratingText(b)}.` : ""}

${sourceLines(path)}

## Details
- Category: ${b.category ?? industry.name}
- Industry: ${industry.name}
- City: ${city.name}, Oregon (${city.county} County, ${city.region})
- Address: ${b.address || "not published (service-area business)"}
- Phone: ${b.phone ? formatPhone(b.phone) : "none listed"}
- Website: ${showsWebsite(b) ? b.website : "none listed"}
- Google rating: ${ratingText(b)}
${maps ? `- Google Maps: ${maps}\n` : ""}${b.verification && ["directory_reviewed", "contact_details_checked", "owner_claimed", "owner_identity_verified", "license_verified"].includes(b.verification.status) ? `- Verified: contact details checked on ${ratingDate(b.verification.verifiedAt)}\n` : ""}
## More in ${city.name}
- All ${peers} ${industry.name} businesses in ${city.name}: ${SITE_URL}/city/${city.slug}/${industry.slug}/
- Everything in ${city.name}: ${SITE_URL}/city/${city.slug}/
`;
}

export function industryMarkdown(city: City, industry: Industry, businesses: Business[]): string {
  const rated = businesses.filter((b) => typeof b.rating === "number");
  const avg = rated.length ? (rated.reduce((s, b) => s + (b.rating as number), 0) / rated.length).toFixed(1) : null;
  return `# ${industry.name} in ${city.name}, Oregon

> ${businesses.length} ${industry.name.toLowerCase()} businesses listed in ${city.name}, ${city.county} County.${avg ? ` ${rated.length} show a Google rating; average ${avg} / 5.` : ""} ${industry.description}.

${sourceLines(`/city/${city.slug}/${industry.slug}/`)}

## Businesses (by Google rating)
${[...businesses]
  .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviews ?? 0) - (a.reviews ?? 0))
  .map((b) => listingLine(city, industry, b))
  .join("\n")}
`;
}

export function cityMarkdown(city: City, groups: Array<{ industry: Industry; count: number }>): string {
  const total = groups.reduce((s, g) => s + g.count, 0);
  return `# ${city.name}, Oregon — local businesses

> ${total.toLocaleString("en-US")} local businesses listed in ${city.name}, ${city.county} County (${city.region}), across ${groups.length} industries. ${city.description}

${sourceLines(`/city/${city.slug}/`)}

## Industries in ${city.name}
${groups.map((g) => `- [${g.industry.name} in ${city.name}](${SITE_URL}/city/${city.slug}/${g.industry.slug}/) — ${g.count} businesses (twin: ${SITE_URL}/city/${city.slug}/${g.industry.slug}.md)`).join("\n")}
`;
}

export function citiesMarkdown(rows: Array<{ city: City; count: number }>): string {
  return `# Oregon businesses by city

> ${publisher.name} lists ${rows.reduce((s, r) => s + r.count, 0).toLocaleString("en-US")} local businesses across ${rows.length} Oregon cities.

${sourceLines("/city/")}

## Cities
${rows.map((r) => `- [${r.city.name}, Oregon](${SITE_URL}/city/${r.city.slug}/) — ${r.count.toLocaleString("en-US")} businesses, ${r.city.county} County`).join("\n")}
`;
}

export function homeMarkdown(rows: Array<{ city: City; count: number }>, industries: Industry[]): string {
  return `# ${publisher.name}

> ${publisher.description} ${rows.reduce((s, r) => s + r.count, 0).toLocaleString("en-US")} businesses across ${rows.length} cities and ${industries.length} industries. Published by ${publisher.legalOperator} in ${publisher.locationLabel}.

${sourceLines("/")}

## Cities
${rows.map((r) => `- [${r.city.name}](${SITE_URL}/city/${r.city.slug}/) — ${r.count.toLocaleString("en-US")} businesses`).join("\n")}

## Industries (statewide)
${industries.map((i) => `- [${i.name}](${SITE_URL}/services/${i.slug}/) — ${i.description}`).join("\n")}

## For machines
- ${SITE_URL}/llms.txt · ${SITE_URL}/llms-full.txt · ${SITE_URL}/index.json · ${SITE_URL}/jsonld.json
- Every page has a .md twin: replace the trailing slash with .md (${SITE_URL}/city/bend/ → ${SITE_URL}/city/bend.md)
`;
}

export function articleMarkdown(
  kind: "blog" | "research",
  slug: string,
  data: { title: string; summary: string; date?: string; author?: string; category?: string },
  body: string,
): string {
  return `# ${data.title}

> ${data.summary.replace(/\s+/g, " ").trim()}

${sourceLines(`/${kind}/${slug}/`)}
${data.date ? `Published: ${data.date}\n` : ""}${data.author ? `Author: ${data.author}\n` : ""}${data.category ? `Category: ${data.category}\n` : ""}
---

${body.trim()}
`;
}

export function articleIndexMarkdown(kind: "blog" | "research", title: string, entries: Array<{ slug: string; title: string; summary: string }>): string {
  return `# ${title}

> ${entries.length} ${kind === "blog" ? "posts" : "reports"} from ${publisher.name}.

${sourceLines(`/${kind}/`)}

${entries.map((e) => `- [${e.title}](${SITE_URL}/${kind}/${e.slug}/) — ${e.summary.replace(/\s+/g, " ").trim().slice(0, 200)} (twin: ${SITE_URL}/${kind}/${e.slug}.md)`).join("\n")}
`;
}

export const aboutMarkdown = (listingCount: number, cityCount: number, industryCount: number): string => `# About ${publisher.name}

> ${publisher.description}

${sourceLines("/about/")}

- Listings: ${listingCount.toLocaleString("en-US")} local businesses across ${cityCount} Oregon cities and ${industryCount} industries.
- Publisher: ${publisher.legalOperator}, ${publisher.locationLabel}.
- Ratings: Google Maps rating and review count, each with the date it was read. Not affiliated with Google.
- Payment does not purchase a ranking.
- Corrections and claims: ${SITE_URL}${publisher.correctionUrl} · ${SITE_URL}${publisher.claimUrl}
- Contact: ${publisher.supportEmail} · ${publisher.supportPhoneDisplay}
`;

export const contactMarkdown = (): string => `# Contact ${publisher.name}

> List a business, correct or claim a listing, request press coverage, or send feedback.

${sourceLines("/contact/")}

- Email: ${publisher.supportEmail}
- Phone: ${publisher.supportPhoneDisplay}
- Form: ${SITE_URL}/contact/
- Correct a listing: ${SITE_URL}${publisher.correctionUrl}
- Claim a listing: ${SITE_URL}${publisher.claimUrl}
`;
