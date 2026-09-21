export const publisher = {
  id: "publisher:oregon-smb-directory",
  name: "Oregon SMB Directory",
  legalOperator: "LEVERAGE AI LLC",
  description:
    "A statewide Oregon business directory organized by regional, city, industry, and service collections.",
  supportEmail: "contact@oregonsmbdirectory.com",
  supportPhone: "+1-541-450-2082",
  supportPhoneDisplay: "(541) 450-2082",
  locationLabel: "Grants Pass, Oregon",
  correctionUrl: "/contact/?topic=listing-correction",
  claimUrl: "/contact/?topic=listing-claim",
  editorialPolicyUrl: "/editorial-policy/",
} as const;

export type Publisher = typeof publisher;
