import blogPostsData from "./blog-posts.json";

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "list"; items: string[] }
  | { type: "numbered"; items: string[] }
  | {
      type: "callout";
      tone: "primary" | "accent";
      title: string;
      text?: string;
      items?: string[];
    }
  | { type: "table"; headers: string[]; rows: string[][] };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  topics: string[];
  author: string;
  readTime: string;
  date: string;
  lastEdited?: string;
  city?: string | null;
  citySlug?: string | null;
  population?: string | null;
  i5Exits?: string | null;
  mileMarker?: string | null;
  keySources?: string | null;
  writingStyle?: string | null;
  batch?: string | null;
  blocks: BlogBlock[];
};

export const blogPosts: BlogPost[] = blogPostsData as BlogPost[];

export type ResearchReport = {
  slug: string;
  title: string;
  summary: string;
  body?: string;
  sections?: ReportSection[];
  pages: number;
  published: string;
  category: string;
  metrics: { label: string; value: string }[];
  citySlug?: string;
  industrySlug?: string;
};

export type ReportBlock =
  | { type: "lede"; text: string }
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "list"; items: string[] }
  | { type: "numbered"; items: string[] }
  | { type: "callout"; tone: "primary" | "accent"; title: string; text: string }
  | { type: "table"; caption?: string; headers: string[]; rows: string[][] };

export type ReportSection = {
  id: string;
  label: string;
  title: string;
  blocks: ReportBlock[];
};

import { southernOregonConstructionSections } from "./reports/southern-oregon-construction";

export const researchReports: ResearchReport[] = [
  {
    slug: "southern-oregon-construction-2025",
    title: "Southern Oregon Construction Market Due Diligence (2025–2030)",
    summary: "A 6-section deep dive into the Medford–Ashland–Grants Pass construction market: economic forecast, profitability benchmarks, KPIs, and a vetted Top 25 General Contractors list.",
    pages: 6,
    published: "October 2025",
    category: "Construction",
    citySlug: "medford",
    industrySlug: "contractors",
    metrics: [
      { label: "Top-quartile GPM", value: "21.8%" },
      { label: "Avg residential cost", value: "$175–$300+/sf" },
      { label: "Vetted GCs", value: "25" },
    ],
    sections: southernOregonConstructionSections,
  },
  {
    slug: "i5-corridor-economic-outlook-2026",
    title: "Oregon I-5 Corridor Economic Outlook 2026",
    summary: "A comprehensive 42-page analysis of population shifts, employment trends, and small-business growth across the 10 cities of the Northwest I-5 corridor.",
    pages: 42,
    published: "April 2026",
    category: "Regional Economy",
    metrics: [
      { label: "Population growth (5yr)", value: "+7.4%" },
      { label: "Net new businesses", value: "12,890" },
      { label: "Median wage growth",   value: "+18%" },
    ],
    body: "The Oregon I-5 corridor has demonstrated remarkable economic resilience in the post-pandemic era. While headline narratives have focused on Portland's challenges, the mid-corridor cities — Eugene, Salem, Albany, and Corvallis — have quietly outperformed nearly every comparable metro in the western United States on three key dimensions: small business formation, prime-age labor force participation, and median household income growth. This report synthesizes data from the Oregon Employment Department, U.S. Census Bureau ACS, and proprietary business directory analytics to provide a granular city-by-city outlook for the year ahead.",
  },
  {
    slug: "housing-affordability-report-2026",
    title: "Housing Affordability Across the Corridor",
    summary: "Where Oregon's housing market is heading: rents, median home prices, and inventory across all 10 I-5 cities.",
    pages: 28,
    published: "March 2026",
    category: "Housing",
    metrics: [
      { label: "Median home price", value: "$485K" },
      { label: "Inventory shift",   value: "+22%" },
      { label: "Rent change YoY",   value: "+3.1%" },
    ],
    body: "After three years of double-digit price appreciation, Oregon's I-5 housing market is showing signs of healthy normalization. Inventory has expanded across every city in our coverage, and the rental market has cooled in tandem with new multifamily completions. This report breaks down each market individually, with particular attention to first-time buyer affordability and the impact of recent zoning reforms on missing-middle housing supply.",
  },
  {
    slug: "small-business-confidence-q1-2026",
    title: "Small Business Confidence Index — Q1 2026",
    summary: "Quarterly survey of 1,200+ small business owners across the I-5 corridor on hiring, capital spending, and 12-month outlook.",
    pages: 18,
    published: "February 2026",
    category: "Small Business",
    metrics: [
      { label: "Confidence index", value: "61.4" },
      { label: "Plan to hire",     value: "38%" },
      { label: "Plan to expand",   value: "27%" },
    ],
    body: "Small business sentiment along the Oregon I-5 corridor has reached its highest level since Q3 2021, with our composite confidence index climbing to 61.4 — well above the long-run average of 54. Hiring intentions remain strong despite a tight labor market, and capital expenditure plans have rebounded sharply in the trades, hospitality, and professional services sectors.",
  },
  {
    slug: "tourism-visitor-spend-2025",
    title: "Visitor Spend & Tourism Impact 2025",
    summary: "How $4.8B in visitor spending flowed through the corridor's restaurants, hotels, and small businesses last year.",
    pages: 34,
    published: "January 2026",
    category: "Tourism",
    metrics: [
      { label: "Total visitor spend", value: "$4.8B" },
      { label: "Lodging nights",      value: "9.2M" },
      { label: "Jobs supported",      value: "44,500" },
    ],
    body: "Tourism remains one of the corridor's most important economic engines. Ashland's Oregon Shakespeare Festival, Eugene's track and field meets, and Portland's culinary destination status together drove a record $4.8 billion in direct visitor spending in 2025. This report breaks the spend down by city, category, and visitor origin — and projects what 2026 will look like as international travel continues its recovery.",
  },
];

export type BestOfList = {
  slug: string;
  title: string;
  category: string;
  city: string;
  intro: string;
  year: string;
  picks: { rank: number; name: string; reason: string }[];
};

export const bestOfLists: BestOfList[] = [
  {
    slug: "best-restaurants-eugene-2026",
    title: "Best Restaurants in Eugene 2026",
    category: "Restaurants",
    city: "Eugene",
    year: "2026",
    intro: "From farm-to-table fine dining to legendary wood-fired pizza, our editors' picks for the most memorable meals in the Emerald City.",
    picks: [
      { rank: 1, name: "Marché",           reason: "James Beard–nominated French-Pacific NW; the most refined room in the valley." },
      { rank: 2, name: "Beppe & Gianni's", reason: "Hand-rolled pasta and a wine list that keeps you discovering Italian regions you'd forgotten existed." },
      { rank: 3, name: "Tacovore",         reason: "Bright, modern Mexican with an obsessive sourcing program — the carnitas are a destination." },
      { rank: 4, name: "Pizza Research Institute", reason: "An institution. Vegetarian wood-fired pizza that converts even the skeptics." },
      { rank: 5, name: "Soubise",          reason: "Tasting-menu French in a tiny Whiteaker storefront; book three weeks ahead." },
    ],
  },
  {
    slug: "best-roofers-eugene-2026",
    title: "Top-Rated Roofers in Eugene 2026",
    category: "Roofing",
    city: "Eugene",
    year: "2026",
    intro: "Pacific Northwest weather doesn't forgive a bad roof. These five contractors consistently earn the highest reviews from Eugene homeowners.",
    picks: [
      { rank: 1, name: "Buzzline Roofing",            reason: "259 reviews at 4.8★ — unmatched consistency on residential re-roofs." },
      { rank: 2, name: "Huey & Sons Roofing",         reason: "Multi-generation family operation with deep ties to the Eugene trades community." },
      { rank: 3, name: "Klaus Roofing Systems of Oregon", reason: "Specialized in high-performance roofing systems with industry-leading warranties." },
      { rank: 4, name: "Expert Roofing Services LLC", reason: "Strong storm-damage and insurance-claim expertise — fast and communicative." },
      { rank: 5, name: "Gruwell Roofing & Restoration", reason: "Boutique operation, perfect 5★ across 73 reviews — meticulous craftsmanship." },
    ],
  },
  {
    slug: "best-chiropractors-grants-pass-2026",
    title: "Best Chiropractors in Grants Pass 2026",
    category: "Chiropractic",
    city: "Grants Pass",
    year: "2026",
    intro: "From sports injury rehab to family wellness, these are the highest-reviewed chiropractic clinics in Josephine County.",
    picks: [
      { rank: 1, name: "Total Performance Chiropractic & Physical Therapy", reason: "398 reviews at 4.8★ — the dominant practice in the Rogue Valley." },
      { rank: 2, name: "Axis Health",                       reason: "405 reviews at 4.8★ — integrated care model with broad provider team." },
      { rank: 3, name: "Cornerstone Health",                reason: "127 reviews at 4.9★ — personalized treatment plans and patient education." },
      { rank: 4, name: "Grants Pass Chiropractic Clinic",   reason: "Long-standing local practice with deep community roots." },
      { rank: 5, name: "Active Sports & Family Chiropractic", reason: "Excellent for athletes and active families — focused, results-driven care." },
    ],
  },
  {
    slug: "best-real-estate-agents-eugene-2026",
    title: "Top Real Estate Agencies in Eugene 2026",
    category: "Real Estate",
    city: "Eugene",
    year: "2026",
    intro: "Buying or selling in Eugene's competitive market? These agencies consistently deliver outstanding client experiences.",
    picks: [
      { rank: 1, name: "Hybrid Real Estate",                reason: "581 reviews at 4.9★ — the most reviewed agency in Eugene with elite client satisfaction." },
      { rank: 2, name: "Heart & Home Real Estate",          reason: "Perfect 5★ across 232 reviews — boutique attention with full-service expertise." },
      { rank: 3, name: "Eugene Realty Group",               reason: "128 reviews at 4.9★ — strong relocation and investment-property practice." },
      { rank: 4, name: "George Zakhary — Real Estate Broker", reason: "Top-producing solo broker with deep market knowledge and 5★ rating." },
      { rank: 5, name: "Hearthstone Real Estate",           reason: "Long-time downtown Eugene fixture; trusted by multi-generational clients." },
    ],
  },
];

export const getBlogPost = (slug: string) => blogPosts.find(p => p.slug === slug);
export const getReport = (slug: string) => researchReports.find(r => r.slug === slug);
export const getBestOf = (slug: string) => bestOfLists.find(b => b.slug === slug);
