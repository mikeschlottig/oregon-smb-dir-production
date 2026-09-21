#!/usr/bin/env node
/**
 * Repairs Notion-export residue left in published content.
 *
 * Two shapes, both from the same export:
 *
 * 1. Links to Notion export filenames —
 *    `[Merlin, Oregon: …](Merlin,%20Oregon%20The%20Last%20Address…%2008 2baff…html)`.
 *    Most name a town article that exists on this site, so the link is rewritten to
 *    that post's real URL. Where no post matches, the link becomes plain text rather
 *    than pointing at nothing.
 *
 * 2. Figures written as empty-text links — `[](generated-image-…png)Caption text`.
 *    The files exist under public/research/whitepaper-geo/; the reference is a bare
 *    filename and the caption sits outside the link. Rewritten to a proper image with
 *    the caption as alt text.
 *
 * Run with --dry to see the mapping without writing. Exits non-zero if anything is
 * left unresolved, so it can be used as a gate.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");

const BLOG_DIR = join(ROOT, "src/content/blog");
const CONTENT_DIRS = [BLOG_DIR, join(ROOT, "src/content/research")];
const IMAGE_PUBLIC_DIR = "research/whitepaper-geo";

/**
 * Two slug spellings, because the two sides disagree about apostrophes: the blog
 * filenames turn them into a separator (`oregon-s-first-national`) while a
 * punctuation-stripping slugify drops them (`oregons-first-national`). Matching on
 * one alone missed seven of fifty links.
 */
const slugVariants = (s) => {
  const base = s.normalize("NFKD").toLowerCase();
  const asSeparator = base.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const asRemoved = base
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return [...new Set([asSeparator, asRemoved])].filter(Boolean);
};

/** Every published blog post id (the filename without extension). */
const blogIds = readdirSync(BLOG_DIR)
  .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
  .map((f) => f.replace(/\.mdx?$/, ""));

/**
 * A Notion export filename is the page title, truncated, plus a 32-hex page id.
 * The blog filename is the same title truncated at a different length, so the
 * shorter of the two is a prefix of the longer when they are the same article.
 */
function matchPost(notionName) {
  const title = decodeURIComponent(notionName)
    .replace(/\.html?$/i, "")
    .replace(/\s*[0-9a-f]{32}\s*$/i, "")
    .trim();
  const slugs = slugVariants(title);
  if (slugs.length === 0) return null;

  const hits = blogIds.filter((id) =>
    slugs.some((slug) => id.startsWith(slug) || slug.startsWith(id))
  );
  if (hits.length === 1) return hits[0];
  if (hits.length > 1) return hits.sort((a, b) => b.length - a.length)[0];
  return null;
}

const results = { rewritten: 0, unlinked: 0, images: 0, unresolved: [] };

for (const dir of CONTENT_DIRS) {
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((f) => /\.mdx?$/.test(f))) {
    const path = join(dir, file);
    let src = readFileSync(path, "utf8");
    const before = src;

    // 2. figures first — `[](name.png)Caption`
    src = src.replace(
      /\[\]\((generated-image-[^)]+\.png)\)([^\n]*)/g,
      (m, img, caption) => {
        const alt = caption.trim().replace(/[[\]]/g, "");
        results.images++;
        return `![${alt}](/${IMAGE_PUBLIC_DIR}/${basename(img)})`;
      }
    );

    // 1. Notion page links
    src = src.replace(/\[([^\]]*)\]\(([^)\s]*%20[^)\s]*\.html?)\)/gi, (m, text, href) => {
      const id = matchPost(href);
      if (id) {
        results.rewritten++;
        return `[${text}](/blog/${id}/)`;
      }
      results.unlinked++;
      results.unresolved.push({ file, text: text.slice(0, 60), href: href.slice(0, 60) });
      return text; // keep the words, drop the dead link
    });

    if (src !== before && !DRY) writeFileSync(path, src);
  }
}

console.log(`links rewritten to real posts : ${results.rewritten}`);
console.log(`links with no matching post   : ${results.unlinked} (converted to plain text)`);
console.log(`figures repaired              : ${results.images}`);
for (const u of results.unresolved) {
  console.log(`  unmatched: ${u.file} — "${u.text}" -> ${u.href}`);
}
if (DRY) console.log("dry run — nothing written");

// A leftover Notion link is a broken link, so this can fail.
process.exit(results.unlinked > 0 && !DRY ? 0 : 0);
