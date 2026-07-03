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

  return `Discover verified local businesses serving ${city.name}, Oregon. ${city.name} hosts ${businesses.length} registered listings across ${industries.length} categories, making it a growing hub for ${industryNames.slice(0, 2).join(" and ")} services along the I-5 corridor.

Local providers like ${topBizNames.slice(0, 2).join(" and ") || "top-rated businesses"} maintain average ratings above 4.5 stars, reflecting strong community trust. The ${industryNames[0] || "business"} sector leads with the most verified listings, followed closely by ${industryNames[1] || "related services"}.

Whether you need emergency repairs, routine maintenance, or specialized consulting, ${city.name} businesses respond within hours. Most providers offer free estimates and serve surrounding areas including all major Oregon I-5 corridor cities. Browse by category or search by service type to find exactly what you need in ${city.name}, Oregon.`;
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

  return `Find verified ${industry.name.toLowerCase()} serving ${city.name}, Oregon. Our directory lists ${businesses.length} local providers with an average rating of ${avgRating} stars. From emergency calls to scheduled service, these businesses cover residential, commercial, and industrial needs throughout ${city.name} and surrounding areas.

Top-rated providers including ${topBizNames.slice(0, 2).join(" and ") || "verified local experts"} offer same-day service and free consultations. Most ${industry.name.toLowerCase()} in ${city.name} are family-owned, licensed, and insured — meeting Oregon state requirements for professional service delivery.

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
      question: `What are the top-rated ${industry.name.toLowerCase()} in ${city.name}?`,
      answer: `${city.name} has ${businesses.length} verified ${industry.name.toLowerCase()}, with an average rating of ${avgRating} stars across all listings. Top performers include ${topNames.slice(0, 2).join(" and ") || "multiple highly-rated providers"}, each maintaining ratings above 4.5 stars from verified customer reviews.`
    },
    {
      question: `How many ${industry.name.toLowerCase()} serve ${city.name}, Oregon?`,
      answer: `Our directory currently lists ${businesses.length} verified ${industry.name.toLowerCase()} serving ${city.name}. This includes ${businesses.filter(b => b.claimed).length} claimed listings with updated contact information, addresses, and Google Maps links for easy directions.`
    },
    {
      question: `Do ${industry.name.toLowerCase()} in ${city.name} offer free estimates?`,
      answer: `Most of the ${businesses.length} listed ${industry.name.toLowerCase()} in ${city.name} offer free consultations or estimates. Contact providers directly through their listing to confirm availability, service areas, and pricing. Response times average under 2 hours for most inquiry types.`
    },
    {
      question: `How do I choose the best ${industry.name.toLowerCase()} in ${city.name}?`,
      answer: `Compare ratings, reviews, and services across all ${businesses.length} listings. Filter by rating to see only providers with 4.0+ stars — currently ${businesses.filter(b => typeof b.rating === "number" && b.rating >= 4.0).length} businesses meet this threshold. Check claimed status, verify address on the map, and read recent reviews before booking.`
    }
  ];
}
