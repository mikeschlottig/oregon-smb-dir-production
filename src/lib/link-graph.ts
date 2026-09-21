/**
 * link-graph.ts — Build-time related-content graph for automatic internal linking.
 *
 * Computes per-page related links from the entity model.
 * Designed for deterministic, reproducible builds (stable sort).
 *
 * @see /home/mikes/docs/oregon-smb/InterlinkingResearch-astro-auto-linking-2026-07-03.md
 */

import type { Business } from "../data/businesses";
import { cities, getCityBySlug } from "../data/cities";
import { industries, getIndustryBySlug } from "../data/industries";
import { serviceCategories, type ServiceCategory } from "../data/serviceCategories";
import { matchBusinesses } from "../data/matchBusinesses";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RelatedLink {
  href: string;
  label: string;
  reason: "industry" | "city" | "sibling-business" | "service" | "nearby-city" | "region-sibling";
}

export interface RelatedLinksResult {
  links: RelatedLink[];
  totalInbound: number; // populated during audit, not at build-time
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Stable sort: higher rating first, then more reviews, then title alpha. */
function sortBusinesses(a: Business, b: Business): number {
  const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
  if (ratingDiff !== 0) return ratingDiff;
  const reviewDiff = (b.reviews ?? 0) - (a.reviews ?? 0);
  if (reviewDiff !== 0) return reviewDiff;
  return a.title.localeCompare(b.title);
}

/** Get cities in same region, sorted by population (descending). */
function getRegionCities(citySlug: string): typeof cities {
  const city = getCityBySlug(citySlug);
  if (!city) return [];
  return cities
    .filter((c) => c.slug !== citySlug && c.region === city.region)
    .sort((a, b) => {
      const popA = parseInt(a.population.replace(/[^0-9]/g, ""), 10) || 0;
      const popB = parseInt(b.population.replace(/[^0-9]/g, ""), 10) || 0;
      return popB - popA;
    });
}

/** Check if a service page exists for the given industry+category+city. */
function hasServicePage(industrySlug: string, categorySlug: string, citySlug: string): boolean {
  const category = serviceCategories.find(
    (c) => c.industrySlug === industrySlug && c.slug === categorySlug
  );
  if (!category) return false;
  // Use the same threshold logic as getStaticPaths
  const businesses = matchBusinesses(citySlug, category);
  return businesses.length >= 3;
}



// ---------------------------------------------------------------------------
// Core functions — one per page type
// ---------------------------------------------------------------------------

/**
 * Get related links for a business detail page.
 * Caps: ≤8 auto links.
 *
 * Links to:
 * 1. Its industry page (city + industry)
 * 2. Its city page
 * 3. 2-3 sibling businesses (same city+industry, closest rating)
 * 4. Matching service page if one exists
 */
export function getBusinessRelatedLinks(args: {
  citySlug: string;
  industrySlug: string;
  businessSlug: string;
  businesses: Business[]; // all businesses for this city+industry
  baseUrl: string;
}): RelatedLink[] {
  const { citySlug, industrySlug, businessSlug, businesses, baseUrl } = args;
  const links: RelatedLink[] = [];
  const city = getCityBySlug(citySlug);
  const industry = getIndustryBySlug(industrySlug);

  // 1. Industry page (city + industry)
  if (city && industry) {
    links.push({
      href: `/city/${citySlug}/${industrySlug}`,
      label: `${industry.name} in ${city.name}`,
      reason: "industry",
    });
  }

  // 2. City page
  if (city) {
    links.push({
      href: `/city/${citySlug}`,
      label: `${city.name} businesses`,
      reason: "city",
    });
  }

  // 3. Sibling businesses (same city+industry, exclude self, sort by rating)
  const siblings = businesses
    .filter((b) => b.slug !== businessSlug)
    .sort(sortBusinesses)
    .slice(0, 3);

  for (const sibling of siblings) {
    links.push({
      href: `/city/${citySlug}/${industrySlug}/${sibling.slug}`,
      label: sibling.title,
      reason: "sibling-business",
    });
  }

  // 4. Matching service pages that exist (pass threshold)
  const categories = serviceCategories.filter((c) => c.industrySlug === industrySlug);
  for (const cat of categories.slice(0, 3)) {
    if (hasServicePage(industrySlug, cat.slug, citySlug)) {
      links.push({
        href: `/services/${industrySlug}/${cat.slug}/${citySlug}`,
        label: cat.displayName ?? `${industry?.name} services`,
        reason: "service",
      });
    }
  }

  return links.slice(0, 8);
}

/**
 * Get related links for a city×industry page.
 * Caps: ≤15 auto links.
 *
 * Links to:
 * 1. City hub
 * 2. Industry across 2-3 nearby cities (same region first)
 * 3. Matching service pages for that city
 */
export function getCityIndustryRelatedLinks(args: {
  citySlug: string;
  industrySlug: string;
  baseUrl: string;
}): RelatedLink[] {
  const { citySlug, industrySlug, baseUrl } = args;
  const links: RelatedLink[] = [];
  const city = getCityBySlug(citySlug);
  const industry = getIndustryBySlug(industrySlug);

  // 1. City hub
  if (city) {
    links.push({
      href: `/city/${citySlug}`,
      label: `${city.name} — all industries`,
      reason: "city",
    });
  }

  // 2. Industry across nearby cities (same region first)
  const nearbyCities = getRegionCities(citySlug).slice(0, 3);
  for (const nearby of nearbyCities) {
    links.push({
      href: `/city/${nearby.slug}/${industrySlug}`,
      label: `${industry?.name ?? industrySlug} in ${nearby.name}`,
      reason: "nearby-city",
    });
  }

  // 3. Matching service pages for this city (only those that pass threshold)
  const categories = serviceCategories.filter((c) => c.industrySlug === industrySlug);
  for (const cat of categories) {
    if (hasServicePage(industrySlug, cat.slug, citySlug)) {
      links.push({
        href: `/services/${industrySlug}/${cat.slug}/${citySlug}`,
        label: `${cat.displayName} in ${city?.name ?? citySlug}`,
        reason: "service",
      });
    }
  }

  return links.slice(0, 15);
}

/**
 * Get related links for a service page.
 * Caps: ≤15 auto links.
 *
 * Links to:
 * 1. Corresponding city×industry page
 * 2. City hub
 * 3. Other categories for same city+industry
 */
export function getServicePageRelatedLinks(args: {
  citySlug: string;
  industrySlug: string;
  categorySlug: string;
  baseUrl: string;
}): RelatedLink[] {
  const { citySlug, industrySlug, categorySlug, baseUrl } = args;
  const links: RelatedLink[] = [];
  const city = getCityBySlug(citySlug);
  const industry = getIndustryBySlug(industrySlug);
  const category = serviceCategories.find(
    (c) => c.industrySlug === industrySlug && c.slug === categorySlug
  );

  // 1. City×industry page
  if (city && industry) {
    links.push({
      href: `/city/${citySlug}/${industrySlug}`,
      label: `${industry.name} businesses in ${city.name}`,
      reason: "industry",
    });
  }

  // 2. City hub
  if (city) {
    links.push({
      href: `/city/${citySlug}`,
      label: `${city.name} — all businesses`,
      reason: "city",
    });
  }

  // 3. Other categories for same city+industry (only those that pass threshold)
  const otherCategories = serviceCategories
    .filter((c) => c.industrySlug === industrySlug && c.slug !== categorySlug);

  for (const cat of otherCategories) {
    if (hasServicePage(industrySlug, cat.slug, citySlug)) {
      links.push({
        href: `/services/${industrySlug}/${cat.slug}/${citySlug}`,
        label: `${cat.displayName} in ${city?.name ?? citySlug}`,
        reason: "service",
      });
    }
  }

  // 4. Same category in nearby cities (only if service page exists)
  const nearbyCities = getRegionCities(citySlug);
  for (const nearby of nearbyCities) {
    if (hasServicePage(industrySlug, categorySlug, nearby.slug)) {
      links.push({
        href: `/services/${industrySlug}/${categorySlug}/${nearby.slug}`,
        label: `${category?.displayName ?? categorySlug} in ${nearby.name}`,
        reason: "nearby-city",
      });
    }
  }

  return links.slice(0, 15);
}

/**
 * Get related links for a city hub page.
 * Caps: ≤15 auto links.
 *
 * Links to:
 * 1. Region siblings
 * 2. Top industries in this city
 */
export function getCityHubRelatedLinks(args: {
  citySlug: string;
  baseUrl: string;
}): RelatedLink[] {
  const { citySlug, baseUrl } = args;
  const links: RelatedLink[] = [];
  const city = getCityBySlug(citySlug);

  // 1. Region siblings
  const regionCities = getRegionCities(citySlug).slice(0, 8);
  for (const rc of regionCities) {
    links.push({
      href: `/city/${rc.slug}`,
      label: `${rc.name} businesses`,
      reason: "region-sibling",
    });
  }

  // 2. Top industries in this city (all industries, since we don't have biz counts here)
  const topIndustries = industries.slice(0, 6);
  for (const ind of topIndustries) {
    links.push({
      href: `/city/${citySlug}/${ind.slug}`,
      label: `${ind.name} in ${city?.name ?? citySlug}`,
      reason: "industry",
    });
  }

  return links.slice(0, 15);
}

// ---------------------------------------------------------------------------
// Keyword map builder (for rehype-auto-internal-links)
// ---------------------------------------------------------------------------

/**
 * Generate keyword→URL map from page data.
 * Used by the rehype plugin for in-body autolinking.
 *
 * Returns a Map of lowercase keyword → { href, priority }.
 * Priority: longer/more specific phrases win (checked first).
 */
export function buildKeywordMap(): Map<string, { href: string; priority: number }> {
  const map = new Map<string, { href: string; priority: number }>();

  // 1. "{industry} in {city}" → city×industry URL
  for (const city of cities) {
    for (const industry of industries) {
      const keyword = `${industry.name.toLowerCase()} in ${city.name.toLowerCase()}`;
      const href = `/city/${city.slug}/${industry.slug}`;
      // Priority based on specificity (city+industry = high)
      map.set(keyword, { href, priority: 100 });
    }
  }

  // 2. "{category displayName} in {city}" → service URL (only if page exists)
  for (const city of cities) {
    for (const category of serviceCategories) {
      if (hasServicePage(category.industrySlug, category.slug, city.slug)) {
        const keyword = `${category.displayName.toLowerCase()} in ${city.name.toLowerCase()}`;
        const href = `/services/${category.industrySlug}/${category.slug}/${city.slug}`;
        map.set(keyword, { href, priority: 90 });
      }
    }
  }

  // 3. City names → city hubs
  for (const city of cities) {
    const keyword = city.name.toLowerCase();
    const href = `/city/${city.slug}`;
    // Lower priority (just city name = less specific)
    if (!map.has(keyword) || map.get(keyword)!.priority < 50) {
      map.set(keyword, { href, priority: 50 });
    }
  }

  return map;
}

/**
 * Get sorted keywords for the rehype plugin.
 * Returns array of [keyword, href] sorted by priority (descending).
 */
export function getKeywordMapForRehype(): Record<string, { href: string }> {
  const keywordMap = buildKeywordMap();

  // Convert to record, handling duplicates (higher priority wins)
  const record: Record<string, { href: string }> = {};
  const entries = Array.from(keywordMap.entries());
  entries.sort((a, b) => b[1].priority - a[1].priority);

  for (const [keyword, { href }] of entries) {
    if (!record[keyword]) {
      record[keyword] = { href };
    }
  }

  return record;
}
