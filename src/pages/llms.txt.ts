// /llms.txt (llmstxt.org format: "# name", "> summary", link sections). The house standard requires it (STD-SEO-001
// row 18; qc-site.py "llms.txt returns 200"); it was a 404 until P19, 2026-11-21. Built from the same data as the pages,
// so every link is a page that exists and no count can go stale.
import type { APIRoute } from "astro";
import { cities } from "@/data/cities";
import { industries } from "@/data/industries";
import { getBusinesses } from "@/data/businesses";
import { publisher } from "@/data/publisher";

export const GET: APIRoute = ({ site }) => {
  const base = (site?.toString() ?? "https://oregonsmbdirectory.com/").replace(/\/$/, "");
  const link = (name: string, path: string, note?: string) => `- [${name}](${base}${path})${note ? `: ${note}` : ""}`;
  const citiesWithListings = cities.filter((c) => industries.some((i) => getBusinesses(c.slug, i.slug).length > 0));
  const text = [
    `# ${publisher.name}`,
    "",
    `> ${publisher.description} Published by ${publisher.legalOperator} in ${publisher.locationLabel}.`,
    "",
    "Each listing page shows a business's name, category, contact details and map, with a label saying what evidence",
    "stands behind each detail. Ratings shown on listings are Google Maps figures with the date they were observed.",
    "",
    "## About",
    "",
    link("About", "/about/", "who publishes the directory and how it works"),
    link("Editorial and data quality policy", publisher.editorialPolicyUrl, "record labels, publication gates, rankings, corrections"),
    link("Contact", "/contact/", "list, correct or claim a business"),
    "",
    "## Cities",
    "",
    link("All cities", "/city/"),
    ...citiesWithListings.map((c) => link(`${c.name}, Oregon`, `/city/${c.slug}/`, c.description)),
    "",
    "## Services",
    "",
    link("All services", "/services/"),
    ...industries.map((i) => link(i.name, `/services/${i.slug}/`, i.description)),
    "",
    "## Writing",
    "",
    link("Research reports", "/research/"),
    link("Blog", "/blog/"),
    "",
  ].join("\n");
  return new Response(text, { headers: { "content-type": "text/plain; charset=utf-8" } });
};
