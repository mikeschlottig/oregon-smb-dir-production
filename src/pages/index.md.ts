const MD = { "Content-Type": "text/markdown; charset=utf-8" };
import type { APIRoute } from "astro";
import { cities } from "@/data/cities";
import { industries } from "@/data/industries";
import { getBusinesses } from "@/data/businesses";
import { homeMarkdown } from "@/lib/markdown";

export const GET: APIRoute = () => {
  const rows = cities.map((city) => ({ city, count: industries.reduce((s, i) => s + getBusinesses(city.slug, i.slug).length, 0) }));
  return new Response(homeMarkdown(rows, industries), { headers: MD });
};
