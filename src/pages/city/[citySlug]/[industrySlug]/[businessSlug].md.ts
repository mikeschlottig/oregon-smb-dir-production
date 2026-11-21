const MD = { "Content-Type": "text/markdown; charset=utf-8" };
import type { APIRoute } from "astro";
import { cities } from "@/data/cities";
import { industries } from "@/data/industries";
import { getBusinesses, getBusinessPathSlug } from "@/data/businesses";
import { listingMarkdown } from "@/lib/markdown";

// Every listing, including the ones with a hand-written HTML page (those pages are listings too).
export function getStaticPaths() {
  return cities.flatMap((city) =>
    industries.flatMap((industry) => {
      const all = getBusinesses(city.slug, industry.slug);
      return all.map((business) => ({
        params: { citySlug: city.slug, industrySlug: industry.slug, businessSlug: getBusinessPathSlug(city.slug, industry.slug, business) },
        props: { city, industry, business, peers: all.length },
      }));
    }),
  );
}

export const GET: APIRoute = ({ props }) =>
  new Response(listingMarkdown(props.business, props.city, props.industry, props.peers), { headers: MD });
