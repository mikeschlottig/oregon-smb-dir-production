import { readdirSync, readFileSync } from "node:fs";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import rehypeSlug from "rehype-slug";
import rehypeToc from "rehype-toc";
import pagefind from "astro-pagefind";

/** `/city/{city}/{industry}/` paths whose listing shard is empty. */
const emptyIndustryPaths = new Set(
  readdirSync("./src/data/businesses")
    .filter((f) => f.includes("__") && f.endsWith(".json"))
    .flatMap((f) => {
      const [city, rest] = f.split("__");
      const industry = rest.replace(/\.json$/, "");
      const rows = JSON.parse(readFileSync(`./src/data/businesses/${f}`, "utf8"));
      return Array.isArray(rows) && rows.length === 0 ? [`/city/${city}/${industry}/`] : [];
    })
);

export default defineConfig({
  site: "https://oregonsmbdirectory.com",
  redirects: {
    "/research/oregon-law-firm-ai-search-report-1":
      "/research/oregon-law-firm-ai-search-report",
  },
  integrations: [
    react(),
    sitemap({
      // A sitemap is a list of URLs asking to be indexed, so anything the site marks
      // `noindex` must not appear in it. Two cases:
      //   /best-of/ — published but holds zero lists.
      //   city-industry pages with zero listings — the page renders its generated
      //     prose, which is enough to clear a word count and not enough to be a
      //     listing page. Read from the same shards the pages read, so the two
      //     cannot disagree.
      filter: (page) => !page.includes("/best-of") && !emptyIndustryPaths.has(new URL(page).pathname),
    }),
    pagefind(),
    mdx({
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeToc,
          {
            headings: ["h2", "h3"],
            cssClasses: { toc: "post-toc", list: "post-toc-list" },
          },
        ],
      ],
    }),
  ],
  vite: {
    resolve: {
      alias: {
        "@": new URL("./src", import.meta.url).pathname,
      },
    },
  },
});
