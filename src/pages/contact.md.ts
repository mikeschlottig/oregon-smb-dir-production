const MD = { "Content-Type": "text/markdown; charset=utf-8" };
import type { APIRoute } from "astro";
import { contactMarkdown } from "@/lib/markdown";

export const GET: APIRoute = () => new Response(contactMarkdown(), { headers: MD });
