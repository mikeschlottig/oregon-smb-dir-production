import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    category: z.string(),
    topics: z.array(z.string()).default([]),
    author: z.string(),
    date: z.string(),
    lastEdited: z.string().optional().default(""),
    city: z.string().optional().default(""),
    citySlug: z.string().optional().default(""),
    population: z.string().optional().default(""),
    i5Exits: z.string().optional().default(""),
    mileMarker: z.string().optional().default(""),
    keySources: z.string().optional().default(""),
    writingStyle: z.string().optional().default(""),
    batch: z.string().optional().default(""),
    readTime: z.string().optional().default(""),
  }),
});

const research = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/research" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.string().default("Industry Research"),
    published: z.string().default(""),
    author: z.string().default(""),
    sourceFormat: z.enum(["epub", "txt", "mdx"]).default("mdx"),
    sourceFilename: z.string().optional().default(""),
    featured: z.boolean().optional().default(false),
    citySlug: z.string().optional().default(""),
    industrySlug: z.string().optional().default(""),
  }),
});

export const collections = { blog, research };
