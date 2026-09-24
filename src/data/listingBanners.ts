/**
 * Owner-supplied banner images, shown in the listing header beside the title.
 *
 * Keyed by `${citySlug}/${businessSlug}` rather than by industry, because one business can
 * be listed under several industries in the same city and it has one banner. Files live in
 * `public/images/listings/`; width and height are the file's real pixel size so the header
 * reserves the space and does not shift when the image loads.
 */
export type ListingBanner = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Who supplied the image and when — for review, not rendered. */
  source: string;
};

export const listingBanners: Record<string, ListingBanner> = {
  "grants-pass/daley-organics": {
    src: "/images/listings/daley-organics-banner.jpg",
    alt: "Daley Organics premium potting soil banner: a loader dumping soil beside a four-leaf clover crest",
    width: 1101,
    height: 620,
    source: "Supplied by Mike Schlottig, 2026-09-23 (daley-organics-pic.jpg)",
  },
};

export const getListingBanner = (citySlug: string, businessSlug: string): ListingBanner | undefined =>
  listingBanners[`${citySlug}/${businessSlug}`];
