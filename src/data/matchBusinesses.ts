import { getBusinesses, type Business } from "./businesses";
import type { ServiceCategory } from "./serviceCategories";

export function matchBusinesses(citySlug: string, category: ServiceCategory): Business[] {
  const allBusinesses = getBusinesses(citySlug, category.industrySlug);
  const lowerTerms = category.matchTerms.map((t) => t.toLowerCase());

  return allBusinesses.filter((b) => {
    const searchText = [b.title, b.category, category.industrySlug]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return lowerTerms.some((term) => searchText.includes(term));
  });
}
