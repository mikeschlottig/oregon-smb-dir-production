// /index.json: every listing as structured data, with links to its page and its .md twin (P20 E, 2026-11-21).
import type { APIRoute } from "astro";
import { cities } from "@/data/cities";
import { industries } from "@/data/industries";
import { getBusinesses } from "@/data/businesses";
import { publisher } from "@/data/publisher";
import { SITE_URL, CONTENT_SIGNAL, listingPath, mdPath } from "@/lib/markdown";

export const GET: APIRoute = () => {
  const listings = cities.flatMap((city) =>
    industries.flatMap((industry) =>
      getBusinesses(city.slug, industry.slug).map((b) => {
        const path = listingPath(city, industry, b);
        return {
          name: b.title,
          url: `${SITE_URL}${path}`,
          markdown: `${SITE_URL}${mdPath(path)}`,
          city: city.name,
          county: city.county,
          industry: industry.name,
          category: b.category ?? null,
          address: b.address || null,
          phone: b.phone ?? null,
          website: b.website && b.websiteStatus === "confirmed" ? b.website : null,
          googleRating: typeof b.rating === "number" ? b.rating : null,
          googleReviews: typeof b.reviews === "number" ? b.reviews : null,
          ratingAsOf: b.ratingObservation?.observedAt ?? null,
        };
      }),
    ),
  );
  const payload = {
    site: {
      name: publisher.name,
      legalName: publisher.legalOperator,
      url: SITE_URL,
      description: publisher.description,
      email: publisher.supportEmail,
      contentSignal: CONTENT_SIGNAL,
      method: `${SITE_URL}${publisher.editorialPolicyUrl}`,
      generated: new Date().toISOString(),
    },
    cities: cities.map((c) => ({ name: c.name, county: c.county, region: c.region, url: `${SITE_URL}/city/${c.slug}/` })),
    industries: industries.map((i) => ({ name: i.name, description: i.description })),
    listings,
  };
  return new Response(JSON.stringify(payload), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};
