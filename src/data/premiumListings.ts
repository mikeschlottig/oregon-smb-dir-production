/**
 * Premium listing profiles.
 *
 * A premium profile upgrades an existing business record in place: the listing keeps its
 * canonical URL (/city/<city>/<industry>/<slug>/) and the dynamic route renders
 * <PremiumListing> instead of the standard body. Nothing here creates a second URL.
 *
 * Every statement must trace to the owner's own submission, the business's website, or
 * its Google Business Profile — see `sources`. Claims the directory has not checked are
 * phrased as the business's own ("the business describes itself as ...").
 *
 * Adding one: append an entry, then `npm run build`. The build fails if the key does not
 * resolve to a published business record, so a typo cannot ship a dead profile.
 */
import { getBusinesses } from "./businesses";

export type PremiumHours = {
  days: ("Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday")[];
  opens: string; // HH:MM, 24h
  closes: string;
};

export type PremiumListing = {
  /** `${citySlug}/${industrySlug}/${businessSlug}` — must match a published record. */
  key: string;
  /** schema.org type for the JSON-LD; defaults to LocalBusiness. */
  schemaType?: "LocalBusiness" | "Dentist" | "HomeAndConstructionBusiness" | "ProfessionalService";
  seo: { title: string; description: string };
  banner: { eyebrow: string; statement: string };
  /** Quotable answer block: 2–3 self-contained sentences an AI answer can lift whole. */
  quickAnswer: string;
  about: string[];
  services: string[];
  serviceAreas: string[];
  facts: string[];
  hours?: PremiumHours[];
  geo?: { lat: number; lng: number };
  faqs: { question: string; answer: string }[];
  /** Where the content came from, for review — not rendered. */
  sources: string[];
  since: string; // ISO date the profile was published
};

const weekdays: PremiumHours["days"] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export const premiumListings: PremiumListing[] = [
  {
    key: "portland/construction-home-services/xcelent-concrete-services",
    schemaType: "HomeAndConstructionBusiness",
    seo: {
      title: "Xcelent Concrete Services — Concrete Contractor in Portland, OR",
      description:
        "Xcelent Concrete Services installs and repairs concrete driveways, patios, sidewalks, steps, and retaining walls for homes and businesses in Portland, Oregon.",
    },
    banner: {
      eyebrow: "Concrete contractor · Portland metro",
      statement: "Driveways, patios, walkways, and repairs built to last through Oregon winters.",
    },
    quickAnswer:
      "Xcelent Concrete Services is a concrete contractor serving Portland, Oregon and nearby areas. It installs and repairs driveways, patios, sidewalks, walkways, concrete steps, and retaining walls for residential and commercial properties. Call (503) 676-0172 or visit xcelentconcrete.com for a quote.",
    about: [
      "Xcelent Concrete Services handles both new concrete installation and repair work for Portland-area homes and commercial properties. The business describes its focus as quality workmanship, durable materials, and customer satisfaction on every project.",
      "Typical work ranges from a new driveway or patio pour to targeted repairs such as cracked steps and worn driveway sections, where fixing the damaged area restores safety and appearance without replacing the whole surface.",
    ],
    services: [
      "Concrete driveways",
      "Concrete patio installation",
      "Sidewalk & walkway construction",
      "Concrete step repair",
      "Retaining walls",
      "Driveway repair & maintenance",
      "Residential & commercial concrete",
    ],
    serviceAreas: ["Portland", "Portland metro area"],
    facts: ["Residential and commercial work", "New installation and repair", "Owner-submitted listing"],
    geo: { lat: 45.5224907, lng: -122.622596 },
    faqs: [
      {
        question: "What concrete work does Xcelent Concrete Services do?",
        answer:
          "Driveways, patios, sidewalks and walkways, concrete step repair, retaining walls, and driveway repair and maintenance, for both residential and commercial properties.",
      },
      {
        question: "Does Xcelent Concrete Services repair existing concrete?",
        answer:
          "Yes. Alongside new installation, the business lists concrete step repair and driveway repair and maintenance among its services.",
      },
      {
        question: "How do I get a quote from Xcelent Concrete Services?",
        answer: "Call (503) 676-0172 or request a quote through xcelentconcrete.com.",
      },
    ],
    sources: ["D1 contact_submissions/8", "xcelentconcrete.com (2026-09-23)", "existing directory record"],
    since: "2026-09-23",
  },
  {
    key: "portland/business-professional-services/deepli-clean",
    seo: {
      title: "Deepli Clean — Commercial Cleaning & Janitorial Services in Portland, OR",
      description:
        "Deepli Clean provides commercial cleaning, janitorial, office cleaning, deep cleaning, and facility maintenance for businesses in Portland, Oregon and surrounding areas.",
    },
    banner: {
      eyebrow: "Commercial cleaning · Portland metro",
      statement: "Janitorial and deep-cleaning service for Portland offices and facilities.",
    },
    quickAnswer:
      "Deepli Clean is a commercial cleaning company serving Portland, Oregon and surrounding areas. It provides janitorial services, office cleaning, deep cleaning, and facility maintenance for businesses. The office is at 10121 SE Sunnyside Rd in Clackamas and is open weekdays 8 AM to 4 PM.",
    about: [
      "Deepli Clean works with businesses rather than households: recurring janitorial service, office cleaning, periodic deep cleans, and ongoing facility maintenance across Portland and the surrounding metro area.",
      "The company operates from an office on SE Sunnyside Road in Clackamas and schedules service by arrangement with each client.",
    ],
    services: [
      "Commercial cleaning",
      "Janitorial services",
      "Office cleaning",
      "Deep cleaning",
      "Facility maintenance",
    ],
    serviceAreas: ["Portland", "Clackamas", "Portland metro area"],
    facts: ["Business clients", "Office in Clackamas", "Open weekdays"],
    hours: [{ days: weekdays, opens: "08:00", closes: "16:00" }],
    geo: { lat: 45.4353767, lng: -122.5618566 },
    faqs: [
      {
        question: "What does Deepli Clean clean?",
        answer:
          "Commercial spaces: offices and business facilities, through janitorial service, office cleaning, deep cleaning, and facility maintenance.",
      },
      {
        question: "Where does Deepli Clean work?",
        answer: "Portland, Oregon and surrounding areas, from an office at 10121 SE Sunnyside Rd #300 in Clackamas.",
      },
      {
        question: "What are Deepli Clean's office hours?",
        answer: "Monday through Friday, 8:00 AM to 4:00 PM. Call (802) 433-3754 to arrange service.",
      },
    ],
    sources: ["D1 contact_submissions/9", "deepliclean.com (2026-09-23)", "Google Business Profile"],
    since: "2026-09-23",
  },
  {
    key: "portland/business-professional-services/apex-business-marketing",
    schemaType: "ProfessionalService",
    seo: {
      title: "Apex Business Marketing — Web Design & SEO in Hillsboro, OR",
      description:
        "Apex Business Marketing builds websites and provides SEO, AI search optimization, hosting, and maintenance for small businesses in Hillsboro, Portland, and Washington County.",
    },
    banner: {
      eyebrow: "Web design & SEO · Hillsboro",
      statement: "Fast, trustworthy websites for local businesses that need to be found and chosen.",
    },
    quickAnswer:
      "Apex Business Marketing is a Hillsboro, Oregon web design and digital marketing firm for small businesses. It provides website design, SEO, AI search optimization, hosting, and website maintenance across Hillsboro, Portland, Beaverton, Tigard, and the west-side metro. Call (564) 208-4838.",
    about: [
      "Apex Business Marketing helps small businesses build a stronger online presence: professional website design, search engine optimization, optimization for AI-driven search experiences, hosting, ongoing website maintenance, and broader digital marketing support.",
      "Based in Hillsboro, the firm works with local businesses that need websites that load fast, earn trust, rank well, and turn visitors into leads.",
    ],
    services: [
      "Website design",
      "Search engine optimization (SEO)",
      "AI search optimization",
      "Website hosting",
      "Website maintenance",
      "Digital marketing",
    ],
    serviceAreas: [
      "Hillsboro",
      "Portland",
      "Beaverton",
      "Tigard",
      "Aloha",
      "Gresham",
      "Sherwood",
      "Cornelius",
      "Milwaukie",
      "Lake Oswego",
      "Wilsonville",
      "Newberg",
      "Oregon City",
      "Forest Grove",
    ],
    facts: ["Based in Hillsboro", "Serves 14 metro cities", "Open seven days"],
    hours: [
      { days: weekdays, opens: "09:00", closes: "17:00" },
      { days: ["Saturday", "Sunday"], opens: "08:00", closes: "17:00" },
    ],
    geo: { lat: 45.4984628, lng: -122.9670417 },
    faqs: [
      {
        question: "What services does Apex Business Marketing offer?",
        answer:
          "Website design, SEO, AI search optimization, website hosting and maintenance, and digital marketing support for small businesses.",
      },
      {
        question: "Which areas does Apex Business Marketing serve?",
        answer:
          "Hillsboro, Portland, Beaverton, Tigard, Aloha, Gresham, Sherwood, Cornelius, Milwaukie, Lake Oswego, Wilsonville, Newberg, Oregon City, and Forest Grove.",
      },
      {
        question: "Does Apex Business Marketing host and maintain websites?",
        answer: "Yes. Hosting and ongoing website maintenance are part of its service list, alongside design and SEO.",
      },
    ],
    sources: ["D1 contact_submissions/10", "apexbusinessmarketing.com (2026-09-23)", "Google Business Profile"],
    since: "2026-09-23",
  },
  {
    key: "portland/health-medical/north-tabor-dental",
    schemaType: "Dentist",
    seo: {
      title: "North Tabor Dental — Family & Cosmetic Dentist in Portland, OR",
      description:
        "North Tabor Dental on NE Glisan St offers general, family, cosmetic, and pediatric dentistry, dental implants, veneers, and teeth whitening in Portland, Oregon.",
    },
    banner: {
      eyebrow: "Dentist · North Tabor, Portland",
      statement: "General, family, and cosmetic dentistry on NE Glisan Street.",
    },
    quickAnswer:
      "North Tabor Dental is a family and cosmetic dental practice at 5553 NE Glisan St in Portland, Oregon. It provides exams and cleanings, general and pediatric dentistry, cosmetic dentistry, veneers, teeth whitening, teeth straightening, and dental implants, and offers in-office membership plans. Call (503) 331-1322.",
    about: [
      "North Tabor Dental provides preventive, restorative, and cosmetic care for adults and children from its office on NE Glisan Street. The practice is led by Dr. Charlie Hartman, DMD.",
      "For patients without dental insurance, the practice offers in-office membership plans, including adult, periodontal, and child memberships.",
    ],
    services: [
      "Dental exams & cleanings",
      "General dentistry",
      "Family dentistry",
      "Pediatric dentistry",
      "Cosmetic dentistry",
      "Dental veneers",
      "Teeth whitening",
      "Teeth straightening",
      "Dental implants",
    ],
    serviceAreas: ["North Tabor", "Portland"],
    facts: ["Adult and child patients", "In-office membership plans", "Open Monday–Thursday"],
    hours: [{ days: ["Monday", "Tuesday", "Wednesday", "Thursday"], opens: "07:00", closes: "16:00" }],
    geo: { lat: 45.5267308, lng: -122.6065191 },
    faqs: [
      {
        question: "What dental services does North Tabor Dental offer?",
        answer:
          "Exams and cleanings, general, family, and pediatric dentistry, cosmetic dentistry, veneers, teeth whitening, teeth straightening, and dental implants.",
      },
      {
        question: "Does North Tabor Dental have a plan for patients without insurance?",
        answer: "Yes. The practice offers in-office membership plans for adults, periodontal patients, and children.",
      },
      {
        question: "What are North Tabor Dental's hours?",
        answer: "Monday through Thursday, 7:00 AM to 4:00 PM. The office is closed Friday through Sunday.",
      },
    ],
    sources: ["D1 contact_submissions/12", "northtabordental.com (2026-09-23)", "Google Business Profile"],
    since: "2026-09-23",
  },
  {
    key: "bend/business-professional-services/capital-nomics",
    schemaType: "ProfessionalService",
    seo: {
      title: "Capital Nomics — Business Valuation & Appraisal in Bend, OR",
      description:
        "Capital Nomics provides business valuations, M&A advisory, exit planning, and goodwill assessments for businesses in Bend, Redmond, Eugene, Medford, and across Oregon.",
    },
    banner: {
      eyebrow: "Business valuation · Central Oregon",
      statement: "Valuation and advisory for owners buying, selling, or planning an exit.",
    },
    quickAnswer:
      "Capital Nomics is a business valuation and appraisal firm based in Bend, Oregon. It provides business valuations, merger and acquisition advisory, exit planning, goodwill assessments, and valuations for family transactions, marital business interests, and employee buyouts, serving Bend, Redmond, Eugene, Medford, and beyond. Call (458) 202-4825.",
    about: [
      "Capital Nomics provides business valuation and appraisal services through a team of valuation consultants working with clients across a range of industries.",
      "Its work covers the moments when an owner needs a defensible number: buying or merging with another company, planning an exit, assessing goodwill, or valuing a business in a family transaction, a divorce, or an employee buyout.",
    ],
    services: [
      "Business valuation",
      "Mergers & acquisitions advisory",
      "Exit planning",
      "Goodwill value assessment",
      "Family transaction valuation",
      "Marital business valuation",
      "Employee buyout valuation",
    ],
    serviceAreas: ["Bend", "Redmond", "Eugene", "Medford", "Central Oregon"],
    facts: ["Based in Bend", "Serves clients statewide", "Open weekdays"],
    hours: [{ days: weekdays, opens: "08:00", closes: "17:00" }],
    geo: { lat: 44.0587038, lng: -121.3594429 },
    faqs: [
      {
        question: "What does Capital Nomics do?",
        answer:
          "Business valuations and appraisals, M&A advisory, exit planning, goodwill assessments, and valuations for family transactions, marital business interests, and employee buyouts.",
      },
      {
        question: "Where does Capital Nomics work?",
        answer: "From Bend, with clients in Redmond, Eugene, Medford, and elsewhere in Oregon.",
      },
      {
        question: "When would a business owner need a valuation?",
        answer:
          "Common triggers include selling or buying a company, a merger, exit or succession planning, an employee buyout, and dividing business interests in a family transaction or divorce.",
      },
    ],
    sources: ["D1 contact_submissions/13", "capitalnomics.com (2026-09-23)", "Google Business Profile"],
    since: "2026-09-23",
  },
];

const byKey = new Map(premiumListings.map((listing) => [listing.key, listing]));

export const getPremiumListing = (
  citySlug: string,
  industrySlug: string,
  businessSlug: string,
): PremiumListing | undefined => byKey.get(`${citySlug}/${industrySlug}/${businessSlug}`);

// Fail the build on a profile that points at no published record.
for (const listing of premiumListings) {
  const [citySlug, industrySlug, businessSlug] = listing.key.split("/");
  if (!getBusinesses(citySlug, industrySlug).some((b) => b.slug === businessSlug)) {
    throw new Error(`Premium listing ${listing.key} has no published business record`);
  }
}
