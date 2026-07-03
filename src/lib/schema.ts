import type { Business } from "@/data/businesses";
import type { City } from "@/data/cities";
import type { Industry } from "@/data/industries";

// --- Schema Interfaces (no any) ---
interface PostalAddress {
  "@type": "PostalAddress";
  streetAddress?: string;
  addressLocality: string;
  addressRegion: string;
  addressCountry: string;
  [key: string]: unknown;
}

interface AggregateRating {
  "@type": "AggregateRating";
  ratingValue: number;
  reviewCount: number;
  [key: string]: unknown;
}

interface BreadcrumbItem {
  "@type": "ListItem";
  position: number;
  item: {
    "@type": "WebPage";
    name: string;
    url: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface BreadcrumbListSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: BreadcrumbItem[];
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
      name: "Oregon Business Directory",
      description: "Oregon's statewide business directory covering I-5 hubs and regional cities including Corvallis, Bend, and Klamath Falls.",
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
      name: "Oregon Business Directory",
      url: base,
      logo: `${base}/og-default.jpg`,
    },
  ];
}

/**
 * Returns BreadcrumbList schema from an array of {name, url} items.
 * @param items - Ordered breadcrumb items (first = home, last = current page)
 */
export function breadcrumbSchema(items: { name: string; url: string }[]): BreadcrumbListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem" as const,
      position: i + 1,
      item: {
        "@type": "WebPage" as const,
        name: item.name,
        url: item.url,
      },
    })),
  };
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
  const cityUrl = `${base}/city/${city.slug}`;
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
            url: `${cityUrl}/${ind.slug}`,
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
  siteUrl: string
): Record<string, unknown>[] {
  const base = siteUrl.replace(/\/$/, "");
  const pageUrl = `${base}/city/${city.slug}/${industry.slug}`;
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
            url: `${base}/city/${city.slug}/${industry.slug}/${b.slug || b.title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
          };
          if (b.address) {
            item.address = {
              "@type": "PostalAddress",
              streetAddress: b.address,
              addressLocality: city.name,
              addressRegion: "OR",
              addressCountry: "US",
            };
          }
          if (b.phone) item.telephone = b.phone;
          if (b.rating != null && b.reviews != null) {
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
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: business.address,
      addressLocality: city.name,
      addressRegion: "OR",
      addressCountry: "US",
    };
  }

  if (business.phone) schema.telephone = business.phone;

  const businessPath =
    business.slug ||
    business.title
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  schema.url = `${base}/city/${city.slug}/${industry.slug}/${businessPath}`;

  if (business.rating != null && business.reviews != null) {
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
      name: "Oregon SMB Directory",
      logo: { "@type": "ImageObject", url: `${base}/og-default.jpg` },
    },
    mainEntityOfPage: `${base}/blog/${post.id}`,
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
      name: "Oregon SMB Directory",
      logo: { "@type": "ImageObject", url: `${base}/og-default.jpg` },
    },
    ...(report.data.published ? { datePublished: report.data.published } : {}),
    url: `${base}/research/${report.id}`,
  };
}
