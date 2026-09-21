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
 * Generates 4 FAQ Q&As for industry pages.
 * Each answer contains a real numeric fact from data.
 */
export function generateIndustryFaqs(city: City, industry: Industry, businesses: Business[]): Array<{ question: string; answer: string }> {
  const topRated = businesses
    .filter(b => typeof b.rating === "number")
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 3);

  const rated = businesses.filter((b): b is Business & { rating: number } => typeof b.rating === "number");
  const avgRating = rated.length > 0
    ? (rated.reduce((sum, b) => sum + b.rating, 0) / rated.length).toFixed(1)
    : "N/A";

  const topNames = topRated.map(b => b.title);

  return [
    {
      question: `What are the top-rated ${industry.name.toLowerCase()} businesses in ${city.name}?`,
      answer: `${city.name} has ${businesses.length} ${industry.name.toLowerCase()} directory records.${avgRating !== "N/A" ? ` Ratings that pass the source-observation gate average ${avgRating} stars.` : " No ratings currently meet the publication requirements."}${topNames.length > 0 && topRated[0]?.rating != null ? ` Source-observed ratings are available for ${topNames.slice(0, 2).join(" and ")}.` : ""}`
    },
    {
      question: `How many ${industry.name.toLowerCase()} businesses serve ${city.name}, Oregon?`,
      answer: `Our directory currently lists ${businesses.length} ${industry.name.toLowerCase()} business records serving ${city.name}. Records are source-observed; owner participation is stated only when an auditable verification event exists.`
    },
    {
      question: `How do I contact ${industry.name.toLowerCase()} businesses in ${city.name}?`,
      answer: `Each of the ${businesses.length} listings includes the business address, a Google Maps link, and a website link where available. Contact providers directly through their listing to confirm availability, service areas, and pricing.`
    },
    {
      question: `How do I choose the best ${industry.name.toLowerCase()} business in ${city.name}?`,
      answer: `Compare provider categories, locations, and the ratings that pass publication gates across all ${businesses.length} listings. Currently ${businesses.filter(b => typeof b.rating === "number" && b.rating >= 4.0).length} businesses have a source-observed rating of 4.0 stars or higher. Confirm current details directly before booking.`
    }
  ];
}
