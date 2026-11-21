// /llms-full.txt: the cities, their industries with every business line, and the blog in full (research reports are
// linked as .md twins — together they are several MB). Deedline's pattern (P20 E, 2026-11-21).
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { cities } from "@/data/cities";
import { industries } from "@/data/industries";
import { getBusinesses } from "@/data/businesses";
import { publisher } from "@/data/publisher";
import { SITE_URL, CONTENT_SIGNAL, listingLine } from "@/lib/markdown";

export const GET: APIRoute = async () => {
  const blocks: string[] = [
    `# ${publisher.name} — full text`,
    "",
    `> ${publisher.description} Published by ${publisher.legalOperator}, ${publisher.locationLabel}. Every page also has a .md twin; the structured set is at ${SITE_URL}/index.json.`,
    "",
    `Source: ${SITE_URL}/  |  Method: ${SITE_URL}${publisher.editorialPolicyUrl}  |  Content signal: ${CONTENT_SIGNAL}`,
    "",
  ];
  for (const city of cities) {
    blocks.push(`## ${city.name}, Oregon (${city.county} County)`, "", city.description, "");
    for (const industry of industries) {
      const list = getBusinesses(city.slug, industry.slug);
      if (!list.length) continue;
      blocks.push(`### ${industry.name} in ${city.name} (${list.length})`, ...list.map((b) => listingLine(city, industry, b)), "");
    }
  }
  blocks.push("## Research reports", "");
  for (const r of await getCollection("research")) blocks.push(`- [${r.data.title}](${SITE_URL}/research/${r.id}/) — ${SITE_URL}/research/${r.id}.md`);
  blocks.push("", "## Blog", "");
  for (const p of await getCollection("blog")) blocks.push(`### ${p.data.title}`, `${SITE_URL}/blog/${p.id}/`, "", (p.body ?? "").trim(), "");
  return new Response(blocks.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
