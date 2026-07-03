import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import rehypeSlug from "rehype-slug";
import rehypeToc from "rehype-toc";
import pagefind from "astro-pagefind";

export default defineConfig({
  site: "https://oregonsmbdirectory.com",
  integrations: [
    react(),
    sitemap(),
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
