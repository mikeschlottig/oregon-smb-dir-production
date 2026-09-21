export type Industry = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  iconBg: string;
  iconColor: string;
};

export const industries: Industry[] = [
  { name: "Automotive",                     slug: "automotive",                      description: "Auto repair, dealers, detailing, and vehicle services",          icon: "Wrench",           iconBg: "bg-amber-100",   iconColor: "text-amber-800"   },
  { name: "Beauty & Personal Care",         slug: "beauty-personal-care",            description: "Salons, spas, barbershops, and personal care services",          icon: "Sparkles",         iconBg: "bg-pink-100",    iconColor: "text-pink-800"    },
  { name: "Business & Professional Services", slug: "business-professional-services", description: "Accounting, marketing, consulting, and B2B services",           icon: "Briefcase",        iconBg: "bg-blue-100",    iconColor: "text-blue-800"    },
  { name: "Construction & Home Services",   slug: "construction-home-services",      description: "Contractors, electricians, plumbers, and home improvement",      icon: "HardHat",          iconBg: "bg-orange-100",  iconColor: "text-orange-800"  },
  { name: "Food & Dining",                  slug: "food-dining",                     description: "Restaurants, cafes, bakeries, and local eateries",               icon: "UtensilsCrossed",  iconBg: "bg-red-100",     iconColor: "text-red-800"     },
  { name: "Health & Medical",               slug: "health-medical",                  description: "Doctors, dentists, clinics, and medical specialists",            icon: "HeartPulse",       iconBg: "bg-rose-100",    iconColor: "text-rose-800"    },
  { name: "Health & Wellness",              slug: "health-wellness",                 description: "Chiropractic, massage, yoga, acupuncture, and wellness centers", icon: "Activity",         iconBg: "bg-green-100",   iconColor: "text-green-800"   },
  { name: "Legal Services",                 slug: "legal-services",                  description: "Attorneys, law firms, and legal professionals",                  icon: "Scale",            iconBg: "bg-slate-100",   iconColor: "text-slate-800"   },
  { name: "Real Estate",                    slug: "real-estate",                     description: "Agents, brokers, property management, and home services",        icon: "Home",             iconBg: "bg-teal-100",    iconColor: "text-teal-800"    },
  { name: "Retail & Shopping",              slug: "retail-shopping",                 description: "Local shops, boutiques, and specialty retail stores",            icon: "ShoppingBag",      iconBg: "bg-purple-100",  iconColor: "text-purple-800"  },
  { name: "Sports & Fitness",               slug: "sports-fitness",                  description: "Gyms, fitness studios, sporting goods, and recreation",          icon: "Dumbbell",         iconBg: "bg-lime-100",    iconColor: "text-lime-800"    },
  { name: "Travel & Hospitality",           slug: "travel-hospitality",              description: "Hotels, motels, B&Bs, and travel services",                     icon: "Hotel",            iconBg: "bg-indigo-100",  iconColor: "text-indigo-800"  },
];

export const getIndustryBySlug = (slug: string) => industries.find((i) => i.slug === slug);
