/**
 * URLs that have a hand-written page of their own.
 *
 * Both of these businesses also appear in the listing data, so the dynamic
 * `/city/[citySlug]/[industrySlug]/[businessSlug]` route would generate the same URL.
 * Astro resolves the collision in favour of the static file, which means the dynamic
 * page is built and then shadowed — two route definitions for one URL, and whichever
 * one you read is not necessarily the one that ships. The dynamic route excludes these
 * paths so exactly one definition owns each URL.
 */
export const dedicatedBusinessPages: ReadonlySet<string> = new Set([
  "grants-pass/business-professional-services/leverageai",
  "grants-pass/retail-shopping/daley-organics",
  "portland/business-professional-services/pdx-fingerprinting",
]);

export function hasDedicatedPage(
  citySlug: string,
  industrySlug: string,
  businessSlug: string
): boolean {
  return dedicatedBusinessPages.has(`${citySlug}/${industrySlug}/${businessSlug}`);
}
