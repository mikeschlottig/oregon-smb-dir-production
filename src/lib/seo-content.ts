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

  return `Discover local business records serving ${city.name}, Oregon${city.county ? ` in ${city.county} County` : ''}. ${city.name} has ${businesses.length} directory listings across ${industries.length} industries in ${city.region}, including ${industryNames.slice(0, 2).join(" and ")} services.

${topBizNames.length > 0 ? `Source-observed ratings of 4.5 stars or higher are available for providers including ${topBizNames.slice(0, 2).join(" and ")}. ` : ""}Listing fields are drawn from public business data and may change; the directory does not imply owner confirmation unless a listing shows a specific verification event.

Browse by industry or search by service type to compare all ${businesses.length} records in ${city.name}, Oregon. Use the correction path when a name, category, address, or contact detail needs review.`;
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

  return `Find ${industry.name.toLowerCase()} business records serving ${city.name}, Oregon. This broad industry collection contains ${businesses.length} local providers${avgRating === "N/A" ? "" : ` with a ${avgRating}-star average across ratings that passed the source-observation publication gate`}, serving ${city.name} and surrounding communities in ${city.region}.

${topBizNames.length > 0 ? `Source-observed ratings of 4.5 stars or higher are available for ${topBizNames.slice(0, 2).join(" and ")}. ` : ""}Ratings are shown only when the value, review count, observation date, and provider record identity agree with the imported source evidence.

Search filters help you narrow by rating, location, and provider category. Contact and address fields are source-observed rather than owner-confirmed unless a listing states otherwise. Confirm availability, service areas, and pricing directly before hiring.`;
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
      answer: `The directory holds ${businesses.length} ${industryLabel} record${businesses.length === 1 ? "" : "s"} for ${city.name} in ${city.county} County, spanning ${categories.length} distinct provider categor${categories.length === 1 ? "y" : "ies"}${categories.length > 0 ? ` such as ${categories.slice(0, 3).join(", ")}` : ""}. Records are source-observed; owner participation is stated only where an auditable verification event exists.`,
    },
    {
      question: `Which ${industryLabel} businesses in ${city.name} have the strongest source-observed ratings?`,
      answer: avgRating === null
        ? `None of the ${businesses.length} ${industryLabel} records for ${city.name} currently carry a rating that clears the publication gate, so no ratings are shown on this page. A rating publishes only when its value, review count, observation date and record identity all agree with the imported source evidence.`
        : `Across the ${rated.length} of ${businesses.length} ${city.name} ${industryLabel} records whose ratings clear the publication gate, the average is ${avgRating} stars and ${fourPlus} sit at 4.0 or higher${topNames.length > 0 ? `, led by ${topNames.join(" and ")}` : ""}. Ratings are source-observed rather than owner-confirmed, so confirm current standing before hiring.`,
    },
  ];
}
