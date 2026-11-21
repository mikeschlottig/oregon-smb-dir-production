import type { Business } from "@/data/businesses";
import type { City } from "@/data/cities";
import type { Industry } from "@/data/industries";

/**
 * Generates 150-200 word entity-dense SEO prose for city pages.
 * Placed AFTER listings, never above fold.
 */
export function generateCitySeoContent(city: City, industries: Industry[], businesses: Business[]): string {
  const topRated = businesses
    .filter(b => typeof b.rating === "number" && b.rating >= 4.5)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 3);

  const industryNames = industries.slice(0, 3).map(i => i.name.toLowerCase());
  const topBizNames = topRated.map(b => b.title);

  return `Find local businesses in ${city.name}, Oregon${city.county ? `, ${city.county} County` : ''}. ${city.name} has ${businesses.length} listings across ${industries.length} industries in ${city.region}, including ${industryNames.slice(0, 2).join(" and ")}.

${topBizNames.length > 0 ? `${topBizNames.slice(0, 2).join(" and ")} ${topBizNames.length > 1 ? "have" : "has"} a Google rating of 4.5 stars or higher. ` : ""}Listings come from public business information and can change, so call ahead to confirm hours and prices.

Browse by industry or search by service to compare all ${businesses.length} businesses in ${city.name}, Oregon. If a name, category, address or phone number is wrong, suggest a correction from the listing.`;
}

/**
 * Generates 150-200 word entity-dense SEO prose for industry pages.
 */
export function generateIndustrySeoContent(city: City, industry: Industry, businesses: Business[]): string {
  const topRated = businesses
    .filter(b => typeof b.rating === "number" && b.rating >= 4.5)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 3);

  const rated = businesses.filter((b): b is Business & { rating: number } => typeof b.rating === "number");
  const avgRating = rated.length > 0
    ? (rated.reduce((sum, b) => sum + b.rating, 0) / rated.length).toFixed(1)
    : "N/A";

  const topBizNames = topRated.map(b => b.title);

  return `Find ${industry.name.toLowerCase()} businesses in ${city.name}, Oregon. This page lists ${businesses.length} local businesses${avgRating === "N/A" ? "" : ` with an average Google rating of ${avgRating} stars`}, serving ${city.name} and nearby communities in ${city.region}.

${topBizNames.length > 0 ? `${topBizNames.slice(0, 2).join(" and ")} ${topBizNames.length > 1 ? "have" : "has"} a Google rating of 4.5 stars or higher. ` : ""}Each rating shows the date it was read from Google Maps.

Use the filters to narrow the list by rating, location and category. Call ahead to confirm availability, service area and prices before you hire.`;
}

/**
 * FAQ Q&As for a city-industry page.
 *
 * Two questions, both answered from this page's own data. The previous version had
 * four, and the last two ("how do I contact…", "how do I choose…") were generic
 * advice whose only variable was a listing count — so any two pages that happened to
 * hold the same number of listings shipped byte-identical answers. Every answer below
 * names the city, the industry, and at least two independent numbers, which is what
 * makes it belong to one page.
 *
 * @param city - the city this page is for
 * @param industry - the industry this page is for
 * @param businesses - the listings on this page
 */
export function generateIndustryFaqs(city: City, industry: Industry, businesses: Business[]): Array<{ question: string; answer: string }> {
  const industryLabel = industry.name.toLowerCase();

  const rated = businesses.filter((b): b is Business & { rating: number } => typeof b.rating === "number");
  const avgRating = rated.length > 0
    ? (rated.reduce((sum, b) => sum + b.rating, 0) / rated.length).toFixed(1)
    : null;

  const topRated = [...rated].sort((a, b) => b.rating - a.rating).slice(0, 2);
  const topNames = topRated.map(b => b.title);
  const fourPlus = rated.filter(b => b.rating >= 4.0).length;

  /** Distinct provider categories present, which differ city to city. */
  const categories = [...new Set(businesses.map(b => b.category).filter(Boolean) as string[])];

  return [
    {
      question: `How many ${industryLabel} businesses serve ${city.name}, Oregon?`,
      answer: `This directory lists ${businesses.length} ${industryLabel} business${businesses.length === 1 ? "" : "es"} in ${city.name}, ${city.county} County, across ${categories.length} categor${categories.length === 1 ? "y" : "ies"}${categories.length > 0 ? ` such as ${categories.slice(0, 3).join(", ")}` : ""}.`,
    },
    {
      question: `Which ${industryLabel} businesses in ${city.name} have the best Google ratings?`,
      answer: avgRating === null
        ? `None of the ${businesses.length} ${industryLabel} businesses listed in ${city.name} has a Google rating shown here yet.`
        : `${rated.length} of the ${businesses.length} ${industryLabel} businesses listed in ${city.name} show a Google rating. They average ${avgRating} stars, and ${fourPlus} rate 4.0 or higher${topNames.length > 0 ? `, led by ${topNames.join(" and ")}` : ""}.`,
    },
  ];
}
