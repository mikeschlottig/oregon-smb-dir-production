const MD = { "Content-Type": "text/markdown; charset=utf-8" };
import type { APIRoute } from "astro";
import { cities } from "@/data/cities";
import { industries } from "@/data/industries";
import { getBusinesses } from "@/data/businesses";
import { aboutMarkdown } from "@/lib/markdown";

export const GET: APIRoute = () => {
  const n = cities.reduce((s, c) => s + industries.reduce((t, i) => t + getBusinesses(c.slug, i.slug).length, 0), 0);
  return new Response(aboutMarkdown(n, cities.length, industries.length), { headers: MD });
};
