// The JSON-LD rubric for oregonsmbdirectory.com. Declarative: the engine (audit.mjs) runs
// four layers over every page in dist/, and this file says what each layer expects.
//
//   1. PAGE_TYPES  — which schema.org root types each kind of page must (and may) carry.
//   2. vocabulary  — every @type and property checked against schema.org (vocab.mjs):
//                    real type, property defined for that type, value fits rangeIncludes.
//   3. GOOGLE      — Google Search rich-result requirements, recommendations and content
//                    policies (Adobe structured-data-validator for the types it covers, plus
//                    the rules below for LocalBusiness, Article, WebSite, FAQPage…).
//   4. SITE        — this site's own contract: absolute IRIs, canonical agreement, phone
//                    format, identity.
//
// Every Google rule names its source page and, where the text was checked, quotes it.
// `quote: null` means the rule is sound practice but its exact wording was not verified —
// the report shows which is which. Docs fetched 2026-09-24.
//
// Severity:  ERROR   — invalid, a required field is missing, or a Google policy is broken.
//            WARNING — a recommended field is missing, or a value is misconfigured.
//            INFO    — no effect on eligibility; worth knowing.
// A page is PERFECT when it has no ERROR and no WARNING.

const G = "https://developers.google.com/search/docs/appearance";
export const SOURCES = {
  localBusiness: `${G}/structured-data/local-business`,
  reviewSnippet: `${G}/structured-data/review-snippet`,
  article: `${G}/structured-data/article`,
  breadcrumb: `${G}/structured-data/breadcrumb`,
  organization: `${G}/structured-data/organization`,
  siteNames: `${G}/site-names`,
  faqRemoved: "https://developers.google.com/search/updates",
};

export const SITE = {
  origin: "https://oregonsmbdirectory.com",
  // Where displayed ratings come from. They are Google Maps figures, not reviews collected
  // on this site, which decides the review-snippet policy rules below.
  ratingsSource: "third-party",
};

// ─── 1. Page types ──────────────────────────────────────────────────────────────────────
// `match` runs against the URL path. First match wins, so order specific → general.
// `required` / `recommended` entries are schema.org types; a root satisfies an entry when
// it is that type or any subtype (Report satisfies Article; AutoRepair satisfies
// LocalBusiness). `mainEntityOf` names the type whose url must equal the page's canonical.
export const PAGE_TYPES = [
  { id: "home", match: /^\/$/, required: ["Organization", "WebSite"], mainEntityOf: "WebSite" },
  { id: "listing", match: /^\/city\/[^/]+\/[^/]+\/(?!page\/)[^/]+\/$/, required: ["LocalBusiness", "BreadcrumbList"], preferSubtypeOf: "LocalBusiness" },
  { id: "city-industry", match: /^\/city\/[^/]+\/[^/]+\/(page\/\d+\/)?$/, required: ["CollectionPage", "BreadcrumbList"], mainEntityOf: "CollectionPage" },
  { id: "city", match: /^\/city\/[^/]+\/$/, required: ["CollectionPage", "BreadcrumbList"], mainEntityOf: "CollectionPage" },
  { id: "city-hub", match: /^\/city\/$/, required: ["CollectionPage", "BreadcrumbList"], mainEntityOf: "CollectionPage" },
  { id: "service-city", match: /^\/services\/[^/]+\/[^/]+\/[^/]+\/$/, required: ["CollectionPage", "BreadcrumbList"], mainEntityOf: "CollectionPage" },
  { id: "service", match: /^\/services\/[^/]+\/[^/]+\/$/, required: ["CollectionPage", "BreadcrumbList"], mainEntityOf: "CollectionPage" },
  { id: "industry", match: /^\/services\/[^/]+\/$/, required: ["CollectionPage", "BreadcrumbList"], mainEntityOf: "CollectionPage" },
  { id: "services-hub", match: /^\/services\/$/, required: ["CollectionPage", "BreadcrumbList"], mainEntityOf: "CollectionPage" },
  { id: "blog-index", match: /^\/blog\/((category\/[^/]+\/)?(page\/\d+\/)?)$/, required: ["CollectionPage", "BreadcrumbList"], mainEntityOf: "CollectionPage" },
  { id: "blog-post", match: /^\/blog\/[^/]+\/$/, required: ["Article", "BreadcrumbList"] },
  { id: "research-index", match: /^\/research\/(page\/\d+\/)?$/, required: ["CollectionPage", "BreadcrumbList"], mainEntityOf: "CollectionPage" },
  { id: "research-report", match: /^\/research\/[^/]+\/$/, required: ["Article", "BreadcrumbList"] },
  { id: "best-of", match: /^\/best-of\/([^/]+\/)?$/, required: ["BreadcrumbList"], recommended: ["CollectionPage"] },
  { id: "contact", match: /^\/contact\/$/, required: ["BreadcrumbList"], recommended: ["ContactPage"] },
  { id: "static", match: /^\/[^/]+\/$/, required: ["BreadcrumbList"], recommended: ["WebPage"] },
  { id: "not-found", match: /^\/404(\.html)?\/?$/, required: [], noJsonLdExpected: true },
];

// ─── 3. Google rules ────────────────────────────────────────────────────────────────────
// `appliesTo`: a schema.org type — the rule runs on every node that is that type or a
// subtype. `where`: "root" (a top-level entity) | "nested" | "any". `check(node, ctx)`
// returns a message string (or array of strings) when the rule is broken, else null.
// ctx: { path, ancestors (types above this node), page, types (this node's @type list) }.

const isBlank = (v) => v == null || v === "" || (Array.isArray(v) && v.length === 0);
const decimals = (n) => (String(n).split(".")[1] ?? "").length;

export const GOOGLE_RULES = [
  // LocalBusiness ────────────────────────────────────────────────────────────────────────
  {
    id: "LB_REQUIRED_NAME", appliesTo: "LocalBusiness", where: "root", severity: "ERROR",
    source: SOURCES.localBusiness, quote: "Required properties … name — The name of the business.",
    check: (n) => (isBlank(n.name) ? 'missing "name"' : null),
  },
  {
    id: "LB_REQUIRED_ADDRESS", appliesTo: "LocalBusiness", where: "root", severity: "ERROR",
    source: SOURCES.localBusiness, quote: "Required properties … address — The physical location of the business.",
    check: (n) => (isBlank(n.address) ? 'missing "address"' : null),
  },
  {
    id: "LB_ADDRESS_COMPLETE", appliesTo: "LocalBusiness", where: "root", severity: "WARNING",
    source: SOURCES.localBusiness, quote: "Include as many properties as possible. The more properties you provide, the higher quality the result is to users.",
    check: (n) => {
      const a = n.address;
      if (!a || typeof a !== "object") return typeof a === "string" ? "address is a text string, not a PostalAddress" : null;
      const missing = ["streetAddress", "addressLocality", "addressRegion", "postalCode", "addressCountry"].filter((k) => isBlank(a[k]));
      return missing.length ? `address missing ${missing.join(", ")}` : null;
    },
  },
  {
    id: "LB_MOST_SPECIFIC_TYPE", appliesTo: "LocalBusiness", where: "root", severity: "WARNING",
    source: SOURCES.localBusiness, quote: "Use the most specific LocalBusiness sub-type possible",
    check: (n, ctx) => (ctx.types.length === 1 && ctx.types[0] === "LocalBusiness" ? '@type is the generic "LocalBusiness"' : null),
  },
  {
    id: "LB_GEO", appliesTo: "LocalBusiness", where: "root", severity: "WARNING",
    source: SOURCES.localBusiness, quote: "geo.latitude — The precision must be at least 5 decimal places.",
    check: (n) => {
      if (isBlank(n.geo)) return 'missing "geo"';
      const { latitude, longitude } = n.geo;
      if (latitude == null || longitude == null) return "geo missing latitude/longitude";
      return decimals(latitude) < 5 || decimals(longitude) < 5 ? `geo precision under 5 decimals (${latitude}, ${longitude})` : null;
    },
  },
  {
    id: "LB_RECOMMENDED", appliesTo: "LocalBusiness", where: "root", severity: "WARNING",
    source: SOURCES.localBusiness, quote: null,
    check: (n) => {
      const missing = ["telephone", "url", "openingHoursSpecification"].filter((k) => isBlank(n[k]));
      return missing.length ? `recommended missing: ${missing.join(", ")}` : null;
    },
  },
  {
    id: "LB_RATING_THIRD_PARTY", appliesTo: "LocalBusiness", where: "any", severity: "ERROR",
    source: SOURCES.reviewSnippet, quote: "Don't aggregate reviews or ratings from other websites.",
    check: (n) => (SITE.ratingsSource === "third-party" && !isBlank(n.aggregateRating)
      ? "aggregateRating is marked up, but the rating comes from Google Maps, not reviews collected here"
      : null),
  },
  {
    id: "RATING_ON_LIST", appliesTo: "AggregateRating", where: "nested", severity: "ERROR",
    source: SOURCES.reviewSnippet, quote: "Provide review information about a specific item, not about a category or a list of items.",
    check: (n, ctx) => (ctx.ancestors.includes("ItemList") ? "a rating inside an ItemList (a list page)" : null),
  },

  // Article family (Article, BlogPosting, NewsArticle, Report …) ──────────────────────────
  {
    id: "ART_RECOMMENDED", appliesTo: "Article", where: "root", severity: "WARNING",
    source: SOURCES.article, quote: "Recommended properties: author, author.name, author.url, dateModified, datePublished, headline, image",
    check: (n) => {
      const missing = ["headline", "image", "datePublished", "dateModified", "author"].filter((k) => isBlank(n[k]));
      return missing.length ? `recommended missing: ${missing.join(", ")}` : null;
    },
  },
  {
    id: "ART_DATES_ISO", appliesTo: "Article", where: "root", severity: "WARNING",
    source: SOURCES.article, quote: "The date and time the article was first published, in ISO 8601 format. We recommend that you provide timezone information",
    check: (n) => ["datePublished", "dateModified"]
      .filter((k) => typeof n[k] === "string" && !/^\d{4}-\d{2}-\d{2}/.test(n[k]))
      .map((k) => `${k} "${n[k]}" is not an ISO 8601 date`),
  },
  {
    id: "ART_DATES_TIMEZONE", appliesTo: "Article", where: "root", severity: "INFO",
    source: SOURCES.article, quote: "We recommend that you provide timezone information; otherwise, we will default to the timezone used by Googlebot",
    check: (n) => (typeof n.datePublished === "string" && /^\d{4}-\d{2}-\d{2}$/.test(n.datePublished) ? "datePublished has no time or timezone" : null),
  },
  {
    id: "ART_AUTHOR_URL", appliesTo: "Article", where: "root", severity: "WARNING",
    source: SOURCES.article, quote: "we strongly recommend using the type and url (or sameAs) properties",
    check: (n) => [].concat(n.author ?? []).filter((a) => a && typeof a === "object" && isBlank(a.url) && isBlank(a.sameAs))
      .map((a) => `author "${String(a.name ?? "?").slice(0, 40)}" has no url or sameAs`),
  },
  {
    id: "ART_AUTHOR_NAME_ONLY", appliesTo: "Article", where: "root", severity: "WARNING",
    source: SOURCES.article, quote: null,
    check: (n) => [].concat(n.author ?? []).filter((a) => a && typeof a.name === "string" && /[—|:;]|,.*(LLC|Inc|since|founder)/i.test(a.name))
      .map((a) => `author.name carries a title or bio, not just a name: "${a.name.slice(0, 60)}"`),
  },

  // Site name (WebSite, home page) ───────────────────────────────────────────────────────
  {
    id: "SITE_NAME_REQUIRED", appliesTo: "WebSite", where: "root", severity: "ERROR",
    source: SOURCES.siteNames, quote: "Required properties: name — The name of the website. url — The URL of the home page of the site.",
    check: (n) => ["name", "url"].filter((k) => isBlank(n[k])).map((k) => `missing "${k}"`),
  },
  {
    id: "SITE_NAME_CANONICAL_URL", appliesTo: "WebSite", where: "root", severity: "WARNING",
    source: SOURCES.siteNames, quote: "Set this to the canonical home page of your site's domain or subdomain. For example, https://example.com/",
    check: (n, ctx) => (n.url && ctx.page.canonical && n.url !== ctx.page.canonical ? `url "${n.url}" ≠ canonical "${ctx.page.canonical}"` : null),
  },

  // Organization (publisher) ─────────────────────────────────────────────────────────────
  {
    id: "ORG_RECOMMENDED", appliesTo: "Organization", where: "root", severity: "WARNING",
    source: SOURCES.organization, quote: null,
    check: (n, ctx) => {
      if (anyLocalBusiness(ctx.types)) return null; // LocalBusiness has its own rules
      const missing = ["url", "logo"].filter((k) => isBlank(n[k]));
      return missing.length ? `recommended missing: ${missing.join(", ")}` : null;
    },
  },

  // FAQPage ──────────────────────────────────────────────────────────────────────────────
  {
    id: "FAQ_NO_RICH_RESULT", appliesTo: "FAQPage", where: "root", severity: "INFO",
    source: SOURCES.faqRemoved, quote: "The FAQ rich result feature is no longer shown in Google Search results (June 2026)",
    check: () => "FAQPage markup is valid schema.org but earns no Google rich result",
  },
  {
    id: "FAQ_QUESTION_SHAPE", appliesTo: "Question", where: "nested", severity: "WARNING",
    source: SOURCES.faqRemoved, quote: null,
    check: (n) => {
      const out = [];
      if (isBlank(n.name)) out.push('Question missing "name"');
      if (isBlank(n.acceptedAnswer?.text)) out.push('Question missing "acceptedAnswer.text"');
      return out;
    },
  },
];

// Filled in by audit.mjs (needs the vocabulary); kept here so the rules read in one place.
let anyLocalBusiness = () => false;
export const bindVocab = (vocab) => {
  anyLocalBusiness = (types) => vocab.anySubtypeOf(types, "LocalBusiness");
};

// ─── 4. Site rules ──────────────────────────────────────────────────────────────────────
export const SITE_RULES = {
  // NANP number in a form a caller can dial: (541) 730-7759, 541-730-7759, +1-541-730-7759.
  telephone: /^(\+1[\s.-]?)?(\(\d{3}\)\s?|\d{3}[\s.-])\d{3}[\s.-]\d{4}$/,
  // @id must be an absolute IRI (or a same-document fragment) so graphs across pages can join.
  idIri: /^(https?:\/\/[^\s]+|#[\w-]+)$/,
};
