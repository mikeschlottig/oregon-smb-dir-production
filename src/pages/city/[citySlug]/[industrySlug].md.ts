const MD = { "Content-Type": "text/markdown; charset=utf-8" };
import type { APIRoute } from "astro";
import { cities, getCityBySlug } from "@/data/cities";
import { industries, getIndustryBySlug } from "@/data/industries";
import { getBusinesses } from "@/data/businesses";
import { industryMarkdown } from "@/lib/markdown";

export function getStaticPaths() {
  return cities.flatMap((c) => industries.map((i) => ({ params: { citySlug: c.slug, industrySlug: i.slug } })));
}

export const GET: APIRoute = ({ params }) => {
  const city = getCityBySlug(params.citySlug!)!;
  const industry = getIndustryBySlug(params.industrySlug!)!;
  return new Response(industryMarkdown(city, industry, getBusinesses(city.slug, industry.slug)), { headers: MD });
};
