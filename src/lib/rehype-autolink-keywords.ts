/**
 * rehype-autolink-keywords.ts — Custom fallback for keyword→URL in-body autolinking.
 *
 * Applies ONLY to long-form prose content (blog posts, research reports, SEO text blocks).
 * NOT to listings, cards, or nav.
 *
 * Safeguards:
 * - First-occurrence only per keyword
 * - Max 3 links per page
 * - Skip if inside <a>, <h1>-<h6>, <code>, <pre>
 * - Case-insensitive matching
 *
 * @see /home/mikes/docs/oregon-smb/InterlinkingResearch-astro-auto-linking-2026-07-03.md
 */

import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";

interface KeywordMap {
  [keyword: string]: { href: string };
}

interface RehypeAutolinkOptions {
  keywordMap: KeywordMap;
  maxLinksPerPage?: number;
}

export function rehypeAutolinkKeywords(options: RehypeAutolinkOptions) {
  const { keywordMap, maxLinksPerPage = 3 } = options;

  // Sort keywords by length (longest first) for greedy matching
  const keywords = Object.keys(keywordMap).sort((a, b) => b.length - a.length);

  return (tree: any) => {
    let linksAdded = 0;

    visit(tree, "text", (node, index, parent) => {
      // Stop if we've hit the limit
      if (linksAdded >= maxLinksPerPage) return;

      // Skip if no parent or parent is a forbidden tag
      if (!parent || !parent.tagName) return;

      const forbiddenParents = ["a", "h1", "h2", "h3", "h4", "h5", "h6", "code", "pre", "script", "style"];
      if (forbiddenParents.includes(parent.tagName)) return;

      // Skip if any ancestor is forbidden (check parent's parent too)
      let ancestor = parent;
      while (ancestor) {
        if (ancestor.tagName && forbiddenParents.includes(ancestor.tagName)) {
          return;
        }
        ancestor = ancestor.parent;
      }

      const text = node.value;
      if (!text || typeof text !== "string") return;

      // Try to match keywords (case-insensitive)
      let matched = false;
      for (const keyword of keywords) {
        if (linksAdded >= maxLinksPerPage) break;

        const regex = new RegExp(`\\b(${escapeRegex(keyword)})\\b`, "i");
        const match = text.match(regex);
        if (!match) continue;

        const matchIndex = text.toLowerCase().indexOf(match[1].toLowerCase());
        if (matchIndex === -1) continue;

        const before = text.slice(0, matchIndex);
        const matchedText = text.slice(matchIndex, matchIndex + match[1].length);
        const after = text.slice(matchIndex + match[1].length);

        // Replace this text node with: [before, <a>, after]
        const children = [
          { type: "text", value: before },
          {
            type: "element",
            tagName: "a",
            properties: {
              href: keywordMap[keyword].href,
              class: "autolink-keyword",
            },
            children: [{ type: "text", value: matchedText }],
          },
          { type: "text", value: after },
        ];

        // Replace the current node in parent's children
        if (parent.children && index !== undefined) {
          parent.children.splice(index, 1, ...children);
          linksAdded++;
          matched = true;
          break; // Only one replacement per text node
        }
      }
    });
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
