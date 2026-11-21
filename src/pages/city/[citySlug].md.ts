const MD = { "Content-Type": "text/markdown; charset=utf-8" };
import type { APIRoute } from "astro";
import { cities, getCityBySlug } from "@/data/cities";
import { industries } from "@/data/industries";
import { getBusinesses } from "@/data/businesses";
import { cityMarkdown } from "@/lib/markdown";

export function getStaticPaths() {
  return cities.map((c) => ({ params: { citySlug: c.slug } }));
}

export const GET: APIRoute = ({ params }) => {
  const city = getCityBySlug(params.citySlug!)!;
  const groups = industries
    .map((industry) => ({ industry, count: getBusinesses(city.slug, industry.slug).length }))
    .filter((g) => g.count > 0);
  return new Response(cityMarkdown(city, groups), { headers: MD });
};
