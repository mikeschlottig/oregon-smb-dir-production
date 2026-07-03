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

export const researchReports: ResearchReport[] = [];

export type BestOfList = {
  slug: string;
  title: string;
  category: string;
  city: string;
  intro: string;
  year: string;
  picks: { rank: number; name: string; reason: string }[];
};

export const bestOfLists: BestOfList[] = [];

export const getBlogPost = (slug: string) => blogPosts.find(p => p.slug === slug);
export const getReport = (slug: string) => researchReports.find(r => r.slug === slug);
export const getBestOf = (slug: string) => bestOfLists.find(b => b.slug === slug);
