/**
 * How a published rating reads on the site, in plain words (P20, 2026-11-21 — Mike: no pipeline vocabulary and no
 * asterisks on public pages):
 *   5.0 ★ Google rating · 45 reviews          …          Google rating and review count as of Jul 26, 2026.
 * Dates are the business's local (Pacific) date, so an evening reading is not shown as the next day. Records were
 * captured on different days, so the date is per record, not one site-wide snapshot.
 */

const asOfFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Los_Angeles",
});

/** `5.0 ★ Google rating · 45 reviews`, or `5.0 ★ Google rating` when the review count is missing. */
export const ratingLabel = (rating: number, reviews?: number | null): string =>
  typeof reviews === "number"
    ? `${rating.toFixed(1)} ★ Google rating · ${reviews.toLocaleString("en-US")} review${reviews === 1 ? "" : "s"}`
    : `${rating.toFixed(1)} ★ Google rating`;

/** `Jul 26, 2026` from an ISO timestamp. */
export const ratingDate = (observedAt: string): string => asOfFormat.format(new Date(observedAt));

/** `Google rating and review count as of Jul 26, 2026.` — the one dated line on a listing page. */
export const ratingAsOf = (observedAt: string): string =>
  `Google rating and review count as of ${ratingDate(observedAt)}.`;
