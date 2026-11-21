// /jsonld.json: the site's own entity graph (publisher Organization + WebSite) in one place (P20 E, 2026-11-21).
import type { APIRoute } from "astro";
import { publisher } from "@/data/publisher";
import { SITE_URL } from "@/lib/markdown";

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: publisher.name,
          legalName: publisher.legalOperator,
          url: SITE_URL,
          description: publisher.description,
          email: publisher.supportEmail,
          telephone: publisher.supportPhone,
          address: { "@type": "PostalAddress", addressLocality: "Grants Pass", addressRegion: "OR", addressCountry: "US" },
        },
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          url: SITE_URL,
          name: publisher.name,
          publisher: { "@id": `${SITE_URL}/#organization` },
        },
      ],
    }, null, 2),
    { headers: { "Content-Type": "application/ld+json; charset=utf-8" } },
  );
