const MD = { "Content-Type": "text/markdown; charset=utf-8" };
import type { APIRoute } from "astro";
import { cities } from "@/data/cities";
import { serviceCategories } from "@/data/serviceCategories";
import { matchBusinesses } from "@/data/matchBusinesses";
import { SITE_URL, CONTENT_SIGNAL } from "@/lib/markdown";

export const GET: APIRoute = () => {
  const lines = serviceCategories.flatMap((cat) => {
    const inCities = cities.map((c) => ({ c, n: matchBusinesses(c.slug, cat).length })).filter((x) => x.n >= 3);
    if (!inCities.length) return [];
    return [
      `## ${cat.displayName}`,
      ...inCities.map(({ c, n }) => `- [${cat.displayName} in ${c.name}](${SITE_URL}/services/${cat.industrySlug}/${cat.slug}/${c.slug}/) — ${n}`),
      "",
    ];
  });
  return new Response(
    `# Local services in Oregon\n\n> Service categories by city. A category is listed in a city where at least three businesses there are listed under it.\n\nSource: ${SITE_URL}/services/\nContent signal: ${CONTENT_SIGNAL}\n\n${lines.join("\n")}`,
    { headers: MD },
  );
};
