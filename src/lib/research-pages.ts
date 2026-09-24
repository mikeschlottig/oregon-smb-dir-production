/**
 * Research index pagination: at most 12 reports per page (tasks.md P10.10).
 *
 * The shared pageRanges() fills pages to the cap and folds a short tail into the page
 * before it, which can exceed 12. Filling to the cap without folding leaves a stub
 * (25 reports → 12/12/1, and the 1-card page fails the 150-word C13 check). So the
 * reports are spread evenly over the fewest pages that respect the cap: 25 → 9/8/8.
 */
import { getCollection } from "astro:content";
import type { PageRange } from "@/lib/paginate";

export const RESEARCH_PER_PAGE = 12;

function balancedRanges(total: number, maxPerPage: number): PageRange[] {
  const count = Math.max(1, Math.ceil(total / maxPerPage));
  const base = Math.floor(total / count);
  const extra = total % count;
  const ranges: PageRange[] = [];
  let start = 0;
  for (let i = 0; i < count; i++) {
    const size = base + (i < extra ? 1 : 0);
    ranges.push({ page: i + 1, start, end: start + size });
    start += size;
  }
  return ranges;
}

export async function getResearchPages() {
  const reports = (await getCollection("research")).sort((a, b) =>
    a.data.title.localeCompare(b.data.title),
  );
  const ranges = balancedRanges(reports.length, RESEARCH_PER_PAGE);
  return {
    reports,
    totalPages: ranges.length,
    pages: ranges.map((r) => ({ ...r, items: reports.slice(r.start, r.end) })),
  };
}

/** Unique title and description per page; page 1 keeps the library's own wording. */
export function researchPageMeta(page: number, totalPages: number, start: number, end: number, total: number) {
  const title =
    page === 1
      ? "Research Library — Oregon SMB Directory"
      : `Research Library — Page ${page} of ${totalPages} — Oregon SMB Directory`;
  const description =
    page === 1
      ? "Industry research reports and deep-dive analyses across Oregon's small-business economy."
      : `Research reports ${start + 1}–${end} of ${total}: industry studies and deep-dive analyses of Oregon's small-business economy, page ${page} of ${totalPages}.`;
  return { title, description };
}
