const MD = { "Content-Type": "text/markdown; charset=utf-8" };
import type { APIRoute } from "astro";
import { cities } from "@/data/cities";
import { industries, getIndustryBySlug } from "@/data/industries";
import { serviceCategories } from "@/data/serviceCategories";
import { matchBusinesses } from "@/data/matchBusinesses";
import { SITE_URL, CONTENT_SIGNAL } from "@/lib/markdown";

const qualifies = (cat: (typeof serviceCategories)[number]) => cities.some((c) => matchBusinesses(c.slug, cat).length >= 3);

export function getStaticPaths() {
  const withCategories = new Set(serviceCategories.filter(qualifies).map((c) => c.industrySlug));
  return industries.filter((i) => withCategories.has(i.slug)).map((i) => ({ params: { industrySlug: i.slug } }));
}

export const GET: APIRoute = ({ params }) => {
  const industry = getIndustryBySlug(params.industrySlug!)!;
  const cats = serviceCategories.filter((c) => c.industrySlug === industry.slug && qualifies(c));
  const body = cats.map((c) => `- [${c.displayName} in Oregon](${SITE_URL}/services/${industry.slug}/${c.slug}/) — ${c.shortDescription}`).join("\n");
  return new Response(
    `# ${industry.name} services in Oregon\n\n> ${industry.description}. ${cats.length} service categories.\n\nSource: ${SITE_URL}/services/${industry.slug}/\nContent signal: ${CONTENT_SIGNAL}\n\n${body}\n`,
    { headers: MD },
  );
};
