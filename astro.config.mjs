import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import rehypeSlug from "rehype-slug";
import rehypeToc from "rehype-toc";
import pagefind from "astro-pagefind";

export default defineConfig({
  site: "https://oregonsmbdirectory.com",
  redirects: {
    "/research/oregon-law-firm-ai-search-report-1":
      "/research/oregon-law-firm-ai-search-report",
  },
  integrations: [
    react(),
    sitemap({
      // A sitemap is a list of URLs asking to be indexed, so anything carrying
      // `noindex` must not appear in it. /best-of/ is published but empty — it is
      // reachable for existing links and withheld from the index until it has lists.
      filter: (page) => !page.includes("/best-of"),
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
