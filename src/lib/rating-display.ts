/**
 * How a published rating reads on the site: stars and review count with an asterisk,
 * and one footnote giving the date the rating was read, e.g.
 *   4.6 ★ (10 reviews)*        …        *as of 9/23/2026
 * Dates are the business's local (Pacific) date, so an evening reading is not shown as
 * the next day.
 */

const asOfFormat = new Intl.DateTimeFormat("en-US", {
  month: "numeric",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Los_Angeles",
});

/** `4.6 ★ (10 reviews)*`, or `4.6 ★*` when the review count is missing. */
export const ratingLabel = (rating: number, reviews?: number | null): string =>
  typeof reviews === "number"
    ? `${rating.toFixed(1)} ★ (${reviews.toLocaleString("en-US")} review${reviews === 1 ? "" : "s"})*`
    : `${rating.toFixed(1)} ★*`;

/** `*as of 9/23/2026` from an ISO timestamp. */
export const ratingAsOf = (observedAt: string): string =>
  `*as of ${asOfFormat.format(new Date(observedAt))}`;
