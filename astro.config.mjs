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

/**
 * The page template owns the one <h1>. A markdown body's top heading level becomes h2 and every heading
 * below it moves by the same amount (2026-11-21, house standard STD-SEO-001 row 3: "exactly one <h1>";
 * 23 of 25 research reports used `#` for their sections — 21 <h1>s on one page). No-op when a body
 * already starts at h2, which is every blog post.
 */
function remarkTopHeadingH2() {
  return (tree) => {
    // Empty headings (a bare "#" left by document exports) carry no outline and become nameless TOC links: drop them.
    const textOf = (n) => (n.value ?? "") + (n.children ?? []).map(textOf).join("");
    const prune = (node) => {
      if (!node.children) return;
      node.children = node.children.filter((c) => !(c.type === "heading" && textOf(c).trim() === ""));
      node.children.forEach(prune);
    };
    prune(tree);
    const headings = [];
    const walk = (node) => {
      if (node.type === "heading") headings.push(node);
      (node.children ?? []).forEach(walk);
    };
    walk(tree);
    if (!headings.length) return;
    // The levels a body uses, in order, become h2, h3, … so the outline has no gaps (a body that used #, ### and #####
    // rendered h2→h4→h6 after a plain shift). Relative order is kept; only unused levels are closed up.
    const used = [...new Set(headings.map((h) => h.depth))].sort((a, b) => a - b);
    const level = new Map(used.map((d, i) => [d, Math.min(6, 2 + i)]));
    // Then in document order no heading sits more than one level below the one before it (page h1 = level 1):
    // an h2 followed straight by an h4 becomes h2 → h3 (STD-SEO-001 row 3: "no skipped levels").
    let prev = 1;
    for (const h of headings) {
      h.depth = Math.min(level.get(h.depth), prev + 1);
      prev = h.depth;
    }
  };
}

export default defineConfig({
  site: "https://oregonsmbdirectory.com",
  markdown: {
    remarkPlugins: [remarkTopHeadingH2],
    // Astro's default "github-dark" colours code comments #6A737D on #24292E (3.04:1, Lighthouse color-contrast);
    // "github-dark-default" keeps the look with readable comments (P19, 2026-11-21).
    shikiConfig: { theme: "github-dark-default" },
  },
  redirects: {
    // Target carries the trailing slash. Without it, Cloudflare Workers static assets
    // (html_handling defaults to auto-trailing-slash) answers the slashless path with
    // a 307 to the slashed one, turning one redirect into a two-hop chain.
    "/research/oregon-law-firm-ai-search-report-1":
      "/research/oregon-law-firm-ai-search-report/",
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
