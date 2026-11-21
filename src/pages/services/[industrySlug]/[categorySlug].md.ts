const MD = { "Content-Type": "text/markdown; charset=utf-8" };
import type { APIRoute } from "astro";
import { cities } from "@/data/cities";
import { serviceCategories } from "@/data/serviceCategories";
import { matchBusinesses } from "@/data/matchBusinesses";
import { SITE_URL, CONTENT_SIGNAL } from "@/lib/markdown";

export function getStaticPaths() {
  return serviceCategories
    .filter((cat) => cities.some((c) => matchBusinesses(c.slug, cat).length >= 3))
    .map((cat) => ({ params: { industrySlug: cat.industrySlug, categorySlug: cat.slug }, props: { cat } }));
}

export const GET: APIRoute = ({ props }) => {
  const cat = props.cat;
  const rows = cities.map((c) => ({ c, n: matchBusinesses(c.slug, cat).length })).filter((x) => x.n >= 3);
  const body = rows.map(({ c, n }) => `- [${cat.displayName} in ${c.name}](${SITE_URL}/services/${cat.industrySlug}/${cat.slug}/${c.slug}/) — ${n} businesses`).join("\n");
  return new Response(
    `# ${cat.displayName} in Oregon\n\n> ${cat.shortDescription}\n\nSource: ${SITE_URL}/services/${cat.industrySlug}/${cat.slug}/\nContent signal: ${CONTENT_SIGNAL}\n\n${body}\n`,
    { headers: MD },
  );
};
