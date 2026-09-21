import type { Business } from "@/data/businesses";
import type { City } from "@/data/cities";
import type { Industry } from "@/data/industries";
import { publisher } from "@/data/publisher";
import { hasPublishableRating } from "@/data/publication-gates";

// --- Schema Interfaces (no any) ---
interface PostalAddress {
  "@type": "PostalAddress";
  streetAddress?: string;
  addressLocality: string;
  addressRegion: string;
  postalCode?: string;
  addressCountry: string;
  [key: string]: unknown;
}

interface AggregateRating {
  "@type": "AggregateRating";
  ratingValue: number;
  reviewCount: number;
  [key: string]: unknown;
}

interface CollectionPageSchema {
  "@context": "https://schema.org";
  "@type": "CollectionPage";
  name: string;
  url: string;
  description?: string;
  mainEntity: {
    "@type": "ItemList";
    numberOfItems: number;
    itemListElement: Array<{
      "@type": "ListItem";
      position: number;
      item: Record<string, unknown>;
    }>;
  };
  [key: string]: unknown;
}

interface LocalBusinessSchema {
  "@context": "https://schema.org";
  "@type": "LocalBusiness";
  name: string;
  address?: PostalAddress;
  url?: string;
  telephone?: string;
  aggregateRating?: AggregateRating;
  description?: string;
  [key: string]: unknown;
}

interface BlogPostingSchema {
  "@context": "https://schema.org";
  "@type": "BlogPosting";
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author: { "@type": "Person"; name: string };
  publisher: {
    "@type": "Organization";
    name: string;
    logo: { "@type": "ImageObject"; url: string };
  };
  mainEntityOfPage: string;
  articleSection?: string;
  keywords?: string;
  [key: string]: unknown;
}

interface ReportSchema {
  "@context": "https://schema.org";
  "@type": "Report";
  name: string;
  description: string;
  about?: string;
  author: { "@type": "Organization"; name: string };
  publisher: {
    "@type": "Organization";
    name: string;
    logo: { "@type": "ImageObject"; url: string };
  };
  datePublished?: string;
  url: string;
  [key: string]: unknown;
}

/**
 * Splits a source address string into schema.org PostalAddress components.
 *
 * The listing data stores one flat string — "37 E Main St, Ashland, OR 97520". Emitting
 * that whole string as `streetAddress` is wrong twice over: schema.org defines
 * `streetAddress` as the street number and name only, and doing so both repeats the
 * locality and region that are already their own properties and drops `postalCode`
 * entirely.
 *
 * Only a confident parse is split. Anything that does not match the
 * "<street>, <city>, <ST> <ZIP>" shape keeps its original text as `streetAddress`,
 * because a wrong split is worse than an unsplit one.
 *
 * @param address - the raw address string from the listing
 * @param fallbackLocality - the city the page is for
 */
export function postalAddress(address: string, fallbackLocality: string): PostalAddress {
  const text = address.trim();

  /** ZIP+4 appears both hyphenated and run together ("97321-1789", "973211789"). */
  const ZIP = String.raw`(\d{5})(?:-?(\d{4}))?`;
  const normaliseZip = (five: string, plusFour?: string) =>
    plusFour ? `${five}-${plusFour}` : five;

  // "<street>, <city>, <ST> <ZIP>" — 9,075 of 9,144 records.
  const withStreet = text.match(new RegExp(String.raw`^(.*?),\s*([^,]+?),\s*([A-Z]{2})\s+${ZIP}$`));
  if (withStreet) {
    const [, street, locality, region, five, plusFour] = withStreet;
    return {
      "@type": "PostalAddress",
      streetAddress: street.trim(),
      addressLocality: locality.trim(),
      addressRegion: region,
      postalCode: normaliseZip(five, plusFour),
      addressCountry: "US",
    };
  }

  // "<city>, <ST> <ZIP>" — 58 records carry no street line at all. Emitting the whole
  // string as streetAddress would claim the city is a street.
  const noStreet = text.match(new RegExp(String.raw`^([^,]+),\s*([A-Z]{2})\s+${ZIP}$`));
  if (noStreet) {
    const [, locality, region, five, plusFour] = noStreet;
    return {
      "@type": "PostalAddress",
      addressLocality: locality.trim(),
      addressRegion: region,
      postalCode: normaliseZip(five, plusFour),
      addressCountry: "US",
    };
  }

  // Anything else keeps its text as the street line: a wrong split is worse than none.
  return {
    "@type": "PostalAddress",
    streetAddress: text,
    addressLocality: fallbackLocality,
    addressRegion: "OR",
    addressCountry: "US",
  };
}

// --- Builder Functions ---

/**
 * Returns WebSite + Organization schemas for the home page.
 * @param siteUrl - Astro.site or fallback origin (no trailing slash)
 */
export function websiteSchema(siteUrl: string): Record<string, unknown>[] {
  const base = siteUrl.replace(/\/$/, "");
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: publisher.name,
      description: publisher.description,
      url: base,
      potentialAction: {
        "@type": "SearchAction",
        target: `${base}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": publisher.id,
      name: publisher.name,
      legalName: publisher.legalOperator,
      description: publisher.description,
      url: base,
      logo: `${base}/og-default.jpg`,
      email: publisher.supportEmail,
      telephone: publisher.supportPhone,
    },
  ];
}

/**
 * Returns CollectionPage + ItemList schema for city pages.
 * @param city - City object
 * @param industries - Array of industries with listings in this city
 * @param siteUrl - Base site URL (no trailing slash)
 */
export function cityPageSchema(
  city: City,
  industries: Industry[],
  siteUrl: string
): Record<string, unknown>[] {
  const base = siteUrl.replace(/\/$/, "");
  const cityUrl = `${base}/city/${city.slug}/`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${city.name}, Oregon — Local Business Directory`,
      url: cityUrl,
      description: city.description,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: industries.length,
        itemListElement: industries.map((ind, i) => ({
          "@type": "ListItem" as const,
          position: i + 1,
          item: {
            "@type": "WebPage" as const,
            name: ind.name,
            url: `${cityUrl}${ind.slug}/`,
          },
        })),
      },
    },
  ];
}

/**
 * Returns CollectionPage + ItemList schema for industry pages.
 * Only includes aggregateRating if both rating and review count exist.
 * @param city - City object
 * @param industry - Industry object
 * @param businesses - Array of Business objects for this city+industry
 * @param siteUrl - Base site URL (no trailing slash)
 */
export function industryPageSchema(
  city: City,
  industry: Industry,
  businesses: Business[],
  siteUrl: string,
  /**
   * Site-absolute path of the page emitting this schema. Paginated pages pass their
   * own path; without it every /page/N/ URL described itself as page 1.
   */
  pagePath?: string
): Record<string, unknown>[] {
  const base = siteUrl.replace(/\/$/, "");
  const pageUrl = pagePath ? `${base}${pagePath}` : `${base}/city/${city.slug}/${industry.slug}/`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${industry.name} in ${city.name}, Oregon`,
      url: pageUrl,
      description: industry.description,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: businesses.length,
        itemListElement: businesses.map((b, i) => {
          const item: Record<string, unknown> = {
            "@type": "LocalBusiness",
            name: b.title,
            url: `${base}/city/${city.slug}/${industry.slug}/${b.slug || b.title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}/`,
          };
          if (b.address) {
            item.address = postalAddress(b.address, city.name);
          }
          if (b.phone) item.telephone = b.phone;
          if (hasPublishableRating(b)) {
            item.aggregateRating = {
              "@type": "AggregateRating",
              ratingValue: b.rating,
              reviewCount: b.reviews,
            };
          }
          if (b.category) item.description = b.category;
          return {
            "@type": "ListItem" as const,
            position: i + 1,
            item,
          };
        }),
      },
    },
  ];
}

/**
 * Returns LocalBusiness schema for a single business page.
 * Only includes fields that exist in the Business type — no fabrication.
 * @param business - Business object
 * @param city - City object
 * @param industry - Industry object
 * @param siteUrl - Base site URL (no trailing slash)
 */
export function businessSchema(
  business: Business,
  city: City,
  industry: Industry,
  siteUrl: string
): LocalBusinessSchema {
  const base = siteUrl.replace(/\/$/, "");
  const schema: LocalBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.title,
  };

  if (business.address) {
    schema.address = postalAddress(business.address, city.name);
  }

  if (business.phone) schema.telephone = business.phone;

  if (business.email) schema.email = business.email;

  const businessPath =
    business.slug ||
    business.title
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  schema.url = `${base}/city/${city.slug}/${industry.slug}/${businessPath}/`;

  if (hasPublishableRating(business)) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: business.rating,
      reviewCount: business.reviews,
    };
  }

  if (business.category) schema.description = business.category;

  // DO NOT add telephone, geo, openingHours, sameAs, priceRange unless present in Business type
  return schema;
}

/**
 * Returns BlogPosting schema for a blog post.
 * Only includes fields that exist in the post data.
 * @param post - Blog post data (from astro:content collection)
 * @param siteUrl - Base site URL (no trailing slash)
 */
export function blogPostSchema(
  post: {
    id: string;
    data: {
      title: string;
      excerpt: string;
      date: string;
      lastEdited?: string;
      author: string;
      category: string;
      topics: string[];
    };
  },
  siteUrl: string
): BlogPostingSchema {
  const base = siteUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.data.title,
    description: post.data.excerpt,
    datePublished: post.data.date,
    ...(post.data.lastEdited ? { dateModified: post.data.lastEdited } : {}),
    author: { "@type": "Person", name: post.data.author },
    publisher: {
      "@type": "Organization",
      name: publisher.name,
      logo: { "@type": "ImageObject", url: `${base}/og-default.jpg` },
    },
    mainEntityOfPage: `${base}/blog/${post.id}/`,
    articleSection: post.data.category,
    keywords: post.data.topics.join(", "),
  };
}

/**
 * Returns Report schema for a research report page.
 * @param report - Research report data (from astro:content collection)
 * @param siteUrl - Base site URL (no trailing slash)
 */
export function reportSchema(
  report: {
    id: string;
    data: {
      title: string;
      summary: string;
      category: string;
      author?: string;
      published?: string;
    };
  },
  siteUrl: string
): ReportSchema {
  const base = siteUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "Report",
    name: report.data.title,
    description: report.data.summary,
    about: report.data.category,
    author: { "@type": "Organization", name: report.data.author || "LEVERAGE AI Research" },
    publisher: {
      "@type": "Organization",
      name: publisher.name,
      logo: { "@type": "ImageObject", url: `${base}/og-default.jpg` },
    },
    ...(report.data.published ? { datePublished: report.data.published } : {}),
    url: `${base}/research/${report.id}/`,
  };
}

/**
 * Returns CollectionPage + ItemList schema for service category pages.
 * Only includes aggregateRating if both rating and review count exist.
 * @param city - City object
 * @param category - ServiceCategory object
 * @param industry - Industry object
 * @param businesses - Array of Business objects matching this category
 * @param siteUrl - Base site URL (no trailing slash)
 */
export function servicePageSchema(
  city: { name: string; slug: string; county?: string },
  category: { displayName: string; slug: string; industrySlug: string },
  industry: { name: string; slug: string },
  businesses: Business[],
  siteUrl: string
): Record<string, unknown>[] {
  const base = siteUrl.replace(/\/$/, "");
  const pageUrl = `${base}/services/${industry.slug}/${category.slug}/${city.slug}/`;
  
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${category.displayName} in ${city.name}, Oregon`,
      url: pageUrl,
      description: `Find ${category.displayName.toLowerCase()} serving ${city.name} and surrounding communities through an explicit provider-category selection policy.`,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: businesses.length,
        itemListElement: businesses.map((b, i) => {
          const item: Record<string, unknown> = {
            "@type": "LocalBusiness",
            name: b.title,
            url: `${base}/city/${city.slug}/${industry.slug}/${b.slug || b.title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}/`,
          };
          if (b.address) {
            item.address = postalAddress(b.address, city.name);
          }
          if (b.phone) item.telephone = b.phone;
          if (hasPublishableRating(b)) {
            item.aggregateRating = {
              "@type": "AggregateRating",
              ratingValue: b.rating,
              reviewCount: b.reviews,
            };
          }
          if (b.category) item.description = b.category;
          return {
            "@type": "ListItem" as const,
            position: i + 1,
            item,
          };
        }),
      },
    },
  ];
}
