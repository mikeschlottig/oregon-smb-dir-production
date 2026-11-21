const MD = { "Content-Type": "text/markdown; charset=utf-8" };
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { articleIndexMarkdown } from "@/lib/markdown";

export const GET: APIRoute = async () => {
  const entries = (await getCollection("blog")).map((e) => ({ slug: e.id, title: e.data.title, summary: e.data.excerpt }));
  return new Response(articleIndexMarkdown("blog", "Oregon SMB Directory blog", entries), { headers: MD });
};
