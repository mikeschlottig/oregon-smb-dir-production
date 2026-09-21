import type { Business } from "./businesses";
import type { ServiceCategory } from "./serviceCategories";

export type ServiceQualification = {
  policyId: string;
  policyVersion: number;
  method: "direct-provider-category-match";
  matchedProviderCategory: string;
  categoryRole: "primary";
  explanation: string;
};

type ServiceSelectionPolicy = {
  includedCategories?: string[];
  includedTerms?: string[];
  excludedCategories?: string[];
  excludedTerms?: string[];
};

const normalize = (value: string): string =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const policies: Record<string, ServiceSelectionPolicy> = {
  roofing: {
    includedCategories: ["Roofing contractor", "Roofing service"],
    excludedTerms: ["supply", "supplier", "building material", "lumber"],
  },
  electrical: {
    includedCategories: ["Electrician", "Electrical installation service"],
    excludedTerms: ["auto", "utility", "supply", "engineer"],
  },
  plumbing: {
    includedCategories: ["Plumber", "Plumbing service"],
    excludedTerms: ["supply", "store"],
  },
  hvac: {
    includedCategories: [
      "HVAC contractor",
      "Air conditioning contractor",
      "Heating contractor",
    ],
    excludedTerms: ["supply", "store"],
  },
  "auto-repair": {
    includedCategories: [
      "Auto repair shop",
      "Auto body shop",
      "Auto electrical service",
      "Brake shop",
      "Transmission shop",
    ],
  },
};

const policyFor = (category: ServiceCategory): ServiceSelectionPolicy =>
  policies[category.slug] ?? { includedTerms: category.matchTerms };

export const qualifyBusinessForService = (
  business: Business,
  category: ServiceCategory,
): ServiceQualification | null => {
  if (!business.category) return null;

  const providerCategory = normalize(business.category);
  const policy = policyFor(category);
  const excludedCategories = (policy.excludedCategories ?? []).map(normalize);
  const excludedTerms = (policy.excludedTerms ?? []).map(normalize);

  if (
    excludedCategories.includes(providerCategory) ||
    excludedTerms.some((term) => providerCategory.includes(term))
  ) {
    return null;
  }

  const includedCategories = (policy.includedCategories ?? []).map(normalize);
  const includedTerms = (policy.includedTerms ?? []).map(normalize);
  const matched =
    includedCategories.includes(providerCategory) ||
    includedTerms.some((term) => providerCategory.includes(term));

  if (!matched) return null;

  return {
    policyId: `service-intent:${category.slug}`,
    policyVersion: 1,
    method: "direct-provider-category-match",
    matchedProviderCategory: business.category,
    categoryRole: "primary",
    explanation: `Included because the source-observed provider category is “${business.category}”.`,
  };
};
