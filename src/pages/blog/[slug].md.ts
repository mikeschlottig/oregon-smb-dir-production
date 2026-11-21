const MD = { "Content-Type": "text/markdown; charset=utf-8" };
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { articleMarkdown } from "@/lib/markdown";

export async function getStaticPaths() {
  return (await getCollection("blog")).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export const GET: APIRoute = ({ props }) => {
  const d = props.entry.data;
  return new Response(
    articleMarkdown("blog", props.entry.id, { title: d.title, summary: d.excerpt, date: d.date, author: d.author, category: d.category }, props.entry.body ?? ""),
    { headers: MD },
  );
};
