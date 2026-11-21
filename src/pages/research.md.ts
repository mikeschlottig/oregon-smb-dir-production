const MD = { "Content-Type": "text/markdown; charset=utf-8" };
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { articleIndexMarkdown } from "@/lib/markdown";

export const GET: APIRoute = async () => {
  const entries = (await getCollection("research")).map((e) => ({ slug: e.id, title: e.data.title, summary: e.data.summary }));
  return new Response(articleIndexMarkdown("research", "Research reports", entries), { headers: MD });
};
