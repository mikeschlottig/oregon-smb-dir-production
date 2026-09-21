/**
 * One pagination rule, shared by the listing index and its /page/N routes.
 *
 * A plain `ceil(total / perPage)` split leaves the final page with whatever remainder
 * is left — often one or two listings, which renders a page with less content than
 * its own navigation. Those tail pages were the bulk of the site's thin pages. Here a
 * remainder smaller than `minLastPage` is folded back into the page before it, so no
 * route is ever published with a stub's worth of content.
 */

export const PER_PAGE = 15;

/**
 * Re-measured after the first pass. Six cards was an over-estimate of words per card:
 * pages holding six still came in at 128-147 words against the 150-word floor. The
 * observed rate is ~18 words per card plus ~35 words of page furniture, so eight is
 * the smallest slice that clears 150 with margin.
 */
export const MIN_LAST_PAGE = 8;

export interface PageRange {
  /** 1-based page number. */
  page: number;
  start: number;
  /** Exclusive. */
  end: number;
}

/**
 * @param total - number of items to spread across pages
 * @returns one range per published page; always at least one range
 */
export function pageRanges(
  total: number,
  perPage: number = PER_PAGE,
  minLastPage: number = MIN_LAST_PAGE
): PageRange[] {
  if (total <= perPage) return [{ page: 1, start: 0, end: total }];

  const ranges: PageRange[] = [];
  for (let start = 0; start < total; start += perPage) {
    ranges.push({ page: ranges.length + 1, start, end: Math.min(start + perPage, total) });
  }

  const last = ranges[ranges.length - 1];
  if (ranges.length > 1 && last.end - last.start < minLastPage) {
    ranges.pop();
    ranges[ranges.length - 1].end = last.end;
  }

  return ranges;
}

/** Total published pages for a listing of this size. */
export function pageCount(total: number, perPage: number = PER_PAGE): number {
  return pageRanges(total, perPage).length;
}

/** The slice shown on a given 1-based page. */
export function pageSlice<T>(items: T[], page: number, perPage: number = PER_PAGE): T[] {
  const range = pageRanges(items.length, perPage).find((r) => r.page === page);
  return range ? items.slice(range.start, range.end) : [];
}
