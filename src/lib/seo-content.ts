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

  return `Discover verified local businesses serving ${city.name}, Oregon${city.county ? ` in ${city.county} County` : ''}. ${city.name} hosts ${businesses.length} registered listings across ${industries.length} categories in ${city.region}, including ${industryNames.slice(0, 2).join(" and ")} services.

${topBizNames.length > 0 ? `Local providers like ${topBizNames.slice(0, 2).join(" and ")} hold customer ratings of 4.5 stars or higher, reflecting strong community trust. ` : ""}Every listing is checked against Google Business data for active operation, and each includes a verified address, Google Maps directions, and recent customer reviews.

Browse by category or search by service type to compare all ${businesses.length} businesses in ${city.name}, Oregon. Listings link directly to each provider's website where available, so you can confirm services, hours, and pricing with the business itself.`;
}

/**
 * Generates 150-200 word entity-dense SEO prose for industry pages.
 */
export function generateIndustrySeoContent(city: City, industry: Industry, businesses: Business[]): string {
  const topRated = businesses
    .filter(b => typeof b.rating === "number" && b.rating >= 4.5)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 3);

  const avgRating = businesses.length > 0
    ? (businesses.reduce((sum, b) => sum + (b.rating || 0), 0) / businesses.filter(b => b.rating).length).toFixed(1)
    : "N/A";

  const topBizNames = topRated.map(b => b.title);

  return `Find verified ${industry.name.toLowerCase()} businesses serving ${city.name}, Oregon. Our directory lists ${businesses.length} local providers with an average rating of ${avgRating} stars, serving ${city.name} and surrounding communities in ${city.region}.

${topBizNames.length > 0 ? `Top-rated ${industry.name.toLowerCase()} businesses in ${city.name} include ${topBizNames.slice(0, 2).join(" and ")}, each rated ${topRated[0]?.rating?.toFixed(1) ?? "4.5"} stars or higher by local customers. ` : ""}Every listing is checked against Google Business data for active operation, and ratings shown reflect real customer reviews.

Search filters help you narrow by rating, location, and service type. Each listing includes verified contact information, address, Google Maps directions, and recent customer reviews. Whether you need a quick fix or a long-term service partner, ${city.name}'s ${industry.name.toLowerCase()} deliver quality work backed by local reputation.`;
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

  const avgRating = businesses.length > 0
    ? (businesses.reduce((sum, b) => sum + (b.rating || 0), 0) / businesses.filter(b => b.rating).length).toFixed(1)
    : "N/A";

  const topNames = topRated.map(b => b.title);

  return [
    {
      question: `What are the top-rated ${industry.name.toLowerCase()} businesses in ${city.name}?`,
      answer: `${city.name} has ${businesses.length} verified ${industry.name.toLowerCase()} businesses, with an average rating of ${avgRating} stars across all listings.${topNames.length > 0 && topRated[0]?.rating != null ? ` ${topNames.slice(0, 2).join(" and ")} lead the category, rated ${topRated[0].rating.toFixed(1)} stars by customers.` : ""}`
    },
    {
      question: `How many ${industry.name.toLowerCase()} businesses serve ${city.name}, Oregon?`,
      answer: `Our directory currently lists ${businesses.length} verified ${industry.name.toLowerCase()} businesses serving ${city.name}, including ${businesses.filter(b => b.claimed).length} claimed listings with owner-confirmed contact information, addresses, and Google Maps links.`
    },
    {
      question: `How do I contact ${industry.name.toLowerCase()} businesses in ${city.name}?`,
      answer: `Each of the ${businesses.length} listings includes the business address, a Google Maps link, and a website link where available. Contact providers directly through their listing to confirm availability, service areas, and pricing.`
    },
    {
      question: `How do I choose the best ${industry.name.toLowerCase()} business in ${city.name}?`,
      answer: `Compare ratings and reviews across all ${businesses.length} listings. Currently ${businesses.filter(b => typeof b.rating === "number" && b.rating >= 4.0).length} businesses hold a 4.0-star rating or higher. Check claimed status, verify the address on the map, and read recent reviews before booking.`
    }
  ];
}
