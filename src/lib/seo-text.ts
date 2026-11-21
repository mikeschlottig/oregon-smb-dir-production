/**
 * Titles and meta descriptions that fit the house SEO standard (STD-SEO-001 row 2, house-standards/standards/seo.md):
 * "title ≤ 60 chars; description 120–160 chars", brand appended at the end of the title.
 *
 * Each template lists its candidates in order of preference; these functions pick, they never invent. Nothing here
 * truncates a business's name. When even the shortest candidate is over the limit (a business whose name alone is
 * longer than 60 characters) the shortest one is used and the audit reports it — see docs/STANDARDS-AUDIT-2026-11-21.md.
 */

export const TITLE_MAX = 60;
export const DESC_MIN = 120;
export const DESC_MAX = 160;

/** The first candidate that fits, else the shortest. Empty and duplicate candidates are ignored. */
export function fitTitle(candidates: Array<string | null | undefined | false>, max = TITLE_MAX): string {
  const list = [...new Set(candidates.filter((c): c is string => typeof c === "string" && c.trim() !== "").map((c) => c.trim()))];
  if (!list.length) throw new Error("fitTitle: no candidates");
  return list.find((c) => c.length <= max) ?? list.reduce((a, b) => (b.length < a.length ? b : a));
}

/**
 * Builds a description from sentences in priority order. The first sentence is always used; each later sentence
 * is added only if the result stays within `max`, so a lower-priority sentence never pushes out a higher one. If the
 * first sentence alone is over `max` it is cut at a word boundary and ends with "…".
 */
export function fitDescription(
  sentences: Array<string | null | undefined | false>,
  min = DESC_MIN,
  max = DESC_MAX,
): string {
  const parts = sentences.filter((s): s is string => typeof s === "string" && s.trim() !== "").map((s) => s.trim().replace(/\s+/g, " "));
  if (!parts.length) throw new Error("fitDescription: no sentences");
  let out = parts[0];
  if (out.length > max) {
    const cut = out.slice(0, max - 1);
    return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:.—-]+$/, "")}…`;
  }
  for (const s of parts.slice(1)) {
    if (out.length >= min && out.length + 1 + s.length > max) break;
    if (out.length + 1 + s.length <= max) out = `${out} ${s}`;
  }
  return out;
}

/**
 * A long headline shortened for the <title> only (the page's H1 keeps the full headline): cut at a word boundary
 * within `max`, trailing punctuation dropped, "…" appended. Used last, after every untruncated candidate.
 */
export function cutAtWord(text: string, max = TITLE_MAX): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 1)).replace(/[\s,;:.—–-]+$/, "")}…`;
}

/** "a" or "an" before a word, by its first sound as written ("an auto repair shop", "a law firm"). */
export function article(word: string): "a" | "an" {
  return /^[aeiou]/i.test(word.trim()) ? "an" : "a";
}

/** Joins words as an English list: "a", "a and b", "a, b and c". */
export function listWords(words: string[]): string {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`;
}
