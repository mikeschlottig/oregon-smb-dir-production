/**
 * Editorial description for each blog category.
 *
 * Category pages previously rendered a heading, a story count, and nothing else — the
 * smallest came to 38 words, which is a navigation stub rather than a page. Each
 * description below states what the category actually collects, drawn from the posts
 * filed under it, so the page says something a reader could not get from the title.
 */
export interface BlogCategoryInfo {
  /** Matches the `category` value in blog frontmatter. */
  name: string;
  description: string;
}

export const blogCategories: BlogCategoryInfo[] = [
  {
    name: "Economy & Business",
    description:
      "Town-by-town economic profiles along the I-5 corridor: what each place makes, who employs people there, what the median household actually earns, and which industries carried the town through the mill closures. These are the posts that sit closest to the directory itself — a town's business mix is the reason its listings look the way they do.",
  },
  {
    name: "Arts & Events",
    description:
      "The festivals, theaters, galleries, and annual traditions that give I-5 towns their reputations — Ashland's Shakespeare season, Aurora's antique district, the county fairs and summer concert series that draw visitors from outside the valley. Where an event shapes a town's calendar and its storefronts, it is covered here.",
  },
  {
    name: "History & Culture",
    description:
      "How these towns came to exist and why they are shaped the way they are: utopian colonies, ferry crossings, railroad stops, timber camps, and the national historic districts that survived. Each post works from named primary sources — county museums, historical societies, and municipal records.",
  },
  {
    name: "Oregon",
    description:
      "Statewide context that does not belong to any single town — corridor-wide patterns, cross-county comparisons, and the geography that explains why the I-5 settlements sit where they sit.",
  },
  {
    name: "Outdoor Recreation",
    description:
      "Rivers, trails, lakes, and the exits that reach them. Southern and central Oregon's outdoor economy supports a real share of the directory's lodging, guide, and equipment listings, and these posts cover the places those businesses serve.",
  },
  {
    name: "Food & Drink",
    description:
      "Creameries, wineries, coffee roasters, and the agricultural belt that feeds them. Oregon's food producers are concentrated along the same corridor as its towns, and these posts trace what grows where and who turns it into something sold.",
  },
];

export function getBlogCategory(name: string): BlogCategoryInfo | undefined {
  return blogCategories.find((c) => c.name === name);
}
