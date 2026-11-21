const MD = { "Content-Type": "text/markdown; charset=utf-8" };
import type { APIRoute } from "astro";
import { cities } from "@/data/cities";
import { getIndustryBySlug } from "@/data/industries";
import { serviceCategories } from "@/data/serviceCategories";
import { matchBusinesses } from "@/data/matchBusinesses";
import { SITE_URL, CONTENT_SIGNAL, listingLine } from "@/lib/markdown";

export function getStaticPaths() {
  return serviceCategories.flatMap((cat) =>
    cities
      .filter((c) => matchBusinesses(c.slug, cat).length >= 3)
      .map((city) => ({ params: { industrySlug: cat.industrySlug, categorySlug: cat.slug, citySlug: city.slug }, props: { cat, city } })),
  );
}

export const GET: APIRoute = ({ props }) => {
  const { cat, city } = props;
  const industry = getIndustryBySlug(cat.industrySlug)!;
  const list = matchBusinesses(city.slug, cat);
  return new Response(
    `# ${cat.displayName} in ${city.name}, Oregon\n\n> ${list.length} ${cat.pluralName} in ${city.name}, ${city.county} County. ${cat.shortDescription}\n\nSource: ${SITE_URL}/services/${cat.industrySlug}/${cat.slug}/${city.slug}/\nContent signal: ${CONTENT_SIGNAL}\n\n${list.map((b) => listingLine(city, industry, b)).join("\n")}\n`,
    { headers: MD },
  );
};
