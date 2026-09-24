// Generates the fixture pages. Edit here, re-run, commit the .html files it writes.
//   node scripts/jsonld-audit/fixtures/build-fixtures.mjs
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const O = "https://oregonsmbdirectory.com";
const page = (canonical, ...blocks) =>
  `<!doctype html><html><head><link rel="canonical" href="${canonical}">\n` +
  blocks.map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join("\n") +
  `\n</head><body></body></html>\n`;
const crumbs = (...names) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: names.map(([name, p], i) => ({ "@type": "ListItem", position: i + 1, name, ...(p ? { item: O + p } : {}) })),
});
const addr = { "@type": "PostalAddress", streetAddress: "33798 Berry Dr NE", addressLocality: "Albany", addressRegion: "OR", postalCode: "97322", addressCountry: "US" };
const listingUrl = `${O}/city/albany/automotive/example-auto-repair/`;
const trail = crumbs(["Home", "/"], ["Albany", "/city/albany/"], ["Automotive", "/city/albany/automotive/"], ["Example Auto Repair"]);

const files = {
  // Named exemplar for a PERFECT listing page.
  "perfect-listing.html": page(listingUrl, {
    "@context": "https://schema.org", "@type": "AutoRepair", "@id": `${listingUrl}#business`,
    name: "Example Auto Repair", address: addr,
    geo: { "@type": "GeoCoordinates", latitude: 44.68131, longitude: -123.04716 },
    telephone: "(541) 730-7759", url: "https://example-auto-repair.com/",
    openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: "https://schema.org/Monday", opens: "08:00", closes: "17:00" }],
  }, trail),
  "perfect-home.html": page(`${O}/`, {
    "@context": "https://schema.org", "@type": "Organization", "@id": `${O}/#organization`,
    name: "Oregon SMB Directory", url: `${O}/`, logo: `${O}/icon-192.png`,
  }, { "@context": "https://schema.org", "@type": "WebSite", "@id": `${O}/#website`, name: "Oregon SMB Directory", url: `${O}/`, publisher: { "@id": `${O}/#organization` } }),
  "perfect-blog.html": page(`${O}/blog/example-post/`, {
    "@context": "https://schema.org", "@type": "BlogPosting", headline: "Example post",
    image: `${O}/og-default.jpg`, datePublished: "2026-04-13T09:00:00-07:00", dateModified: "2026-04-14T09:00:00-07:00",
    author: { "@type": "Person", name: "Mike Schlottig", url: `${O}/about/` }, mainEntityOfPage: `${O}/blog/example-post/`,
  }, crumbs(["Home", "/"], ["Blog", "/blog/"], ["Example post"])),
  // Required fields missing, generic type, third-party rating, bad phone, bad @id, junk property, geo as text.
  "bad-listing.html": page(listingUrl, {
    "@context": "https://schema.org", "@type": "LocalBusiness", "@id": "publisher:example",
    telephone: "(541) 7307759", fooBar: "x", geo: "44.6,-123.2",
    aggregateRating: { "@type": "AggregateRating", ratingValue: 5, reviewCount: 234 },
  }, trail),
  // Partial address, low-precision geo, recommended fields missing.
  "partial-listing.html": page(listingUrl, {
    "@context": "https://schema.org", "@type": "AutoRepair", "@id": `${listingUrl}#business`, name: "Example Auto Repair",
    address: { "@type": "PostalAddress", addressLocality: "Albany" }, geo: { "@type": "GeoCoordinates", latitude: 44.6, longitude: -123.2 },
  }, trail),
  // Ratings on a list page; CollectionPage url disagrees with the canonical.
  "bad-list.html": page(`${O}/city/albany/automotive/`, {
    "@context": "https://schema.org", "@type": "CollectionPage", name: "Automotive in Albany", url: `${O}/city/albany/automotive`,
    mainEntity: { "@type": "ItemList", itemListElement: [{ "@type": "ListItem", position: 1, item: {
      "@type": "LocalBusiness", name: "A", url: listingUrl, aggregateRating: { "@type": "AggregateRating", ratingValue: 5, reviewCount: 3 } } }] },
  }, crumbs(["Home", "/"], ["Albany", "/city/albany/"], ["Automotive"])),
  // Report (an Article subtype): year-only date, bio in author.name, no author url, no image/headline.
  "bad-report.html": page(`${O}/research/example/`, {
    "@context": "https://schema.org", "@type": "Report", name: "Example report", datePublished: "2026",
    author: { "@type": "Person", name: "Mike Schlottig — Founder, LEVERAGE AI LLC | Oregon resident since 2001" },
  }, crumbs(["Home", "/"], ["Research", "/research/"], ["Example report"])),
  "date-only-blog.html": page(`${O}/blog/example-post/`, {
    "@context": "https://schema.org", "@type": "BlogPosting", headline: "Example post", image: `${O}/og-default.jpg`,
    datePublished: "2026-04-13", dateModified: "2026-04-13", author: { "@type": "Person", name: "Mike Schlottig", url: `${O}/about/` },
  }, crumbs(["Home", "/"], ["Blog", "/blog/"], ["Example post"])),
  "bad-home.html": page(`${O}/`, { "@context": "https://schema.org", "@type": "Organization", name: "Oregon SMB Directory" },
    { "@context": "https://schema.org", "@type": "WebSite", url: O }),
  "faq-listing.html": page(listingUrl, {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [{ "@type": "Question", name: "Open Sundays?" }],
  }, trail),
  "no-jsonld.html": `<!doctype html><html><head><link rel="canonical" href="${O}/research/empty/"></head><body></body></html>\n`,
};
for (const [f, html] of Object.entries(files)) writeFileSync(path.join(here, f), html);
console.log(`wrote ${Object.keys(files).length} fixtures`);
