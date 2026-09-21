import { getBusinesses, type Business } from "./businesses";
import type { ServiceCategory } from "./serviceCategories";
import {
  qualifyBusinessForService,
  type ServiceQualification,
} from "./serviceSelectionPolicies";

export type QualifiedBusiness = {
  business: Business;
  qualification: ServiceQualification;
};

export function matchBusinessesWithQualification(
  citySlug: string,
  category: ServiceCategory,
): QualifiedBusiness[] {
  return getBusinesses(citySlug, category.industrySlug).flatMap((business) => {
    const qualification = qualifyBusinessForService(business, category);
    return qualification ? [{ business, qualification }] : [];
  });
}

export function matchBusinesses(citySlug: string, category: ServiceCategory): Business[] {
  return matchBusinessesWithQualification(citySlug, category).map(
    ({ business }) => business,
  );
}
