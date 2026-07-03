export type ServiceCategory = {
  slug: string;
  industrySlug: string;
  displayName: string;
  pluralName: string;
  shortDescription: string;
  tldr: string;
  licenseRequired: boolean;
  licenseAuthority?: string;
  licenseUrl?: string;
  matchTerms: string[];
  relatedCategories: string[];
  sections: {
    sectionId: string;
    sectionTitle: string;
    body: string;
    takeaways: string[];
  }[];
  faqs: { question: string; answer: string }[];
};

export const serviceCategories: ServiceCategory[] = [
  {
    slug: "roofing",
    industrySlug: "construction-home-services",
    displayName: "Roofing Contractors",
    pluralName: "roofing contractors",
    shortDescription: "Professional roof installation, repair, and replacement services for residential and commercial properties.",
    tldr: "Roofing contractors handle everything from leak repairs to full roof replacements. When choosing a roofer in Oregon, verify CCB licensing, check for manufacturer certifications, and get multiple quotes. Quality roofing protects your home for decades.",
    licenseRequired: true,
    licenseAuthority: "Oregon Construction Contractors Board (CCB)",
    licenseUrl: "https://www.oregon.gov/ccb",
    matchTerms: ["roof", "roofing", "roofer"],
    relatedCategories: ["hvac", "construction-general"],
    sections: [
      {
        sectionId: "when-to-hire",
        sectionTitle: "When to Hire a Roofing Contractor",
        body: "Roofing issues rarely announce themselves with drama. A small leak can signal major underlying damage. Homeowners should watch for missing shingles, granules in gutters, water stains on ceilings, or daylight visible through the attic. In Oregon's wet climate, prompt attention prevents minor issues from becoming structural problems.",
        takeaways: [
          "Schedule a professional inspection after severe weather events",
          "Address missing or damaged shingles within days to prevent water intrusion",
          "Consider roof replacement when repairs exceed 30% of roof value",
          "Get an attic inspection—poor ventilation shortens roof life",
        ],
      },
      {
        sectionId: "choosing-right",
        sectionTitle: "Choosing the Right Roofing Contractor",
        body: "Oregon's Construction Contractors Board (CCB) licenses roofing contractors. Always verify a contractor's CCB number before signing. Beyond licensing, look for manufacturer certifications (CertainTeed, GAF, Owens Corning) which indicate advanced training. Get three written estimates that specify materials, timeline, and cleanup responsibilities.",
        takeaways: [
          "Verify CCB license is active and in good standing",
          "Ask for proof of liability insurance and workers' compensation",
          "Request local references from jobs completed at least two years ago",
          "Avoid contractors who demand large upfront payments or lack a physical business address",
        ],
      },
    ],
    faqs: [
      {
        question: "How do I verify a roofing contractor's license in Oregon?",
        answer: "All roofing contractors in Oregon must hold a valid CCB license. You can verify a contractor's license status, bond information, and complaint history at the Oregon CCB website (oregon.gov/ccb). A valid license means the contractor has met state requirements for insurance and bonding.",
      },
      {
        question: "What factors affect the cost of a roof replacement?",
        answer: "Roof replacement costs depend on several qualitative factors: roofing material (asphalt, metal, tile), roof pitch and complexity, number of layers to remove, and regional labor rates. Additional factors include ventilation upgrades, decking repairs, and permit requirements. The best way to understand pricing for your specific project is to get detailed written estimates from licensed contractors.",
      },
      {
        question: "How do I compare roofing contractor quotes effectively?",
        answer: "Compare quotes by ensuring they cover the same scope: materials specification, tear-off and disposal, underlayment type, flashing work, and warranty terms. The lowest bid often excludes items that become change orders later. Focus on value—a contractor offering better materials and workmanship warranty may cost more upfront but save money over time.",
      },
    ],
  },
  {
    slug: "plumbing",
    industrySlug: "construction-home-services",
    displayName: "Plumbers",
    pluralName: "plumbers",
    shortDescription: "Licensed plumbing services for repairs, installations, and emergency services in residential and commercial properties.",
    tldr: "Plumbers handle everything from leaky faucets to full repiping and water heater installation. In Oregon, plumbers must be licensed through the Oregon Building Codes Division. Always verify licensing and get upfront pricing before work begins.",
    licenseRequired: true,
    licenseAuthority: "Oregon Building Codes Division",
    licenseUrl: "https://www.oregon.gov/bcd",
    matchTerms: ["plumb", "plumber", "plumbing"],
    relatedCategories: ["hvac", "electrical"],
    sections: [
      {
        sectionId: "common-services",
        sectionTitle: "Common Plumbing Services",
        body: "Plumbing contractors handle a wide range of residential and commercial needs. Common services include drain cleaning, leak detection and repair, water heater installation and repair, toilet and fixture installation, pipe repair and repiping, and sewer line inspection. Many plumbers offer emergency services for burst pipes or severe clogs.",
        takeaways: [
          "Emergency plumbers typically charge higher rates for after-hours service",
          "Tankless water heater installation requires specialized knowledge",
          "Sewer line issues may require camera inspection to diagnose properly",
          "Fixture installation quality affects long-term leak risk",
        ],
      },
      {
        sectionId: "hiring-tips",
        sectionTitle: "Tips for Hiring a Plumber",
        body: "Oregon requires plumbers to be licensed through the Oregon Building Codes Division. Verify the plumber's license number and check that it's current. Ask about pricing structure—some plumbers charge flat rates for common services, others bill hourly plus parts. Get a written estimate for larger projects, and confirm they pull required permits for major work.",
        takeaways: [
          "Verify plumbing license through the Oregon Building Codes Division",
          "Ask if the plumber is bonded and insured before allowing work to begin",
          "Get upfront pricing or a written estimate for projects exceeding one hour",
          "Check online reviews focusing on punctuality and pricing transparency",
        ],
      },
    ],
    faqs: [
      {
        question: "Are plumbers required to be licensed in Oregon?",
        answer: "Yes, Oregon requires plumbers to be licensed through the Oregon Building Codes Division. Different license levels exist (trainee, journeyperson, limited residential). For plumbing work in your home, verify the contractor holds an appropriate license for the scope of work.",
      },
      {
        question: "What affects the cost of plumbing services?",
        answer: "Plumbing costs vary based on several factors: type of repair or installation, parts required, accessibility of pipes or fixtures, and whether it's an emergency call. Geographic location and time of day also affect pricing. The most accurate way to budget is to request a written estimate that itemizes labor and parts separately.",
      },
      {
        question: "How do I compare plumbers for a major project?",
        answer: "For larger plumbing projects, compare contractors on: license and insurance verification, written estimates with detailed scope, warranty terms on both labor and parts, timeline commitments, and whether they handle permits. Avoid choosing solely on price—a significantly lower bid may indicate cut corners or missing scope items.",
      },
    ],
  },
  {
    slug: "electrical",
    industrySlug: "construction-home-services",
    displayName: "Electricians",
    pluralName: "electricians",
    shortDescription: "Licensed electrical services including wiring, panel upgrades, lighting installation, and electrical repairs for homes and businesses.",
    tldr: "Electricians handle all electrical work from outlet repairs to full rewiring and panel upgrades. Oregon requires electricians to be licensed through the Oregon Building Codes Division. Never attempt DIY electrical work—improper wiring creates fire and shock hazards.",
    licenseRequired: true,
    licenseAuthority: "Oregon Building Codes Division",
    licenseUrl: "https://www.oregon.gov/bcd",
    matchTerms: ["electric", "electrician", "electrical"],
    relatedCategories: ["hvac", "plumbing"],
    sections: [
      {
        sectionId: "services-overview",
        sectionTitle: "Electrical Services Overview",
        body: "Licensed electricians provide services ranging from basic repairs to complex installations. Common residential services include outlet and switch installation, lighting upgrades, ceiling fan installation, electrical panel upgrades, whole-home rewiring, and EV charger installation. Commercial electricians handle three-phase power, emergency systems, and code compliance upgrades.",
        takeaways: [
          "Panel upgrades are often needed for homes over 30 years old or adding major appliances",
          "EV charger installation requires dedicated circuit and may need panel assessment",
          "LED lighting upgrades reduce energy costs and heat output",
          "Whole-home surge protection safeguards electronics from power spikes",
        ],
      },
      {
        sectionId: "selection-criteria",
        sectionTitle: "How to Select an Electrician",
        body: "Oregon licenses electricians through the Building Codes Division, with classifications for residential, commercial, and industrial work. Verify the electrician's license matches the job type. Ask about their experience with your specific need—EV charger installation requires different expertise than panel upgrades. Get a detailed written bid specifying materials, labor hours, and permit costs.",
        takeaways: [
          "Confirm the electrician's license is appropriate for your project type",
          "Ask for a written bid that separates materials, labor, and permit costs",
          "Verify they will pull permits and schedule inspections for required work",
          "Check that their insurance covers electrical work specifically",
        ],
      },
    ],
    faqs: [
      {
        question: "Do electricians need to be licensed in Oregon?",
        answer: "Yes, Oregon requires electricians to hold a license from the Oregon Building Codes Division. License types include limited residential electrician, general journeyperson electrician, and supervising electrician. Always verify licensing before hiring—unlicensed electrical work creates safety hazards and may violate building codes.",
      },
      {
        question: "What factors influence the cost of electrical work?",
        answer: "Electrical project costs depend on factors including: project complexity, materials quality, accessibility of existing wiring, permit requirements, and local labor rates. Emergency or after-hours work typically costs more. For accurate budgeting, request a written estimate that details the scope of work and any potential variables.",
      },
      {
        question: "How should I evaluate electricians for a home project?",
        answer: "Evaluate electricians by verifying their Oregon license, checking reviews that mention similar project types, confirming they carry proper insurance, and comparing detailed written bids. Pay attention to communication quality and whether they answer technical questions clearly. The lowest bid isn't always the best value if it excludes necessary permits or uses lower-quality materials.",
      },
    ],
  },
  {
    slug: "hvac",
    industrySlug: "construction-home-services",
    displayName: "HVAC Contractors",
    pluralName: "HVAC contractors",
    shortDescription: "Heating, ventilation, and air conditioning services including installation, repair, and maintenance for homes and businesses.",
    tldr: "HVAC contractors install and service heating and cooling systems that keep your home comfortable year-round. In Oregon, HVAC work requires CCB licensing for contractors. Regular maintenance extends system life and maintains efficiency—schedule bi-annual tune-ups.",
    licenseRequired: true,
    licenseAuthority: "Oregon Construction Contractors Board (CCB)",
    licenseUrl: "https://www.oregon.gov/ccb",
    matchTerms: ["hvac", "heating", "cooling", "air conditioning", "furnace", "ac ", "a/c", "air condition"],
    relatedCategories: ["electrical", "plumbing"],
    sections: [
      {
        sectionId: "system-types",
        sectionTitle: "Understanding HVAC System Types",
        body: "HVAC systems vary widely based on climate needs and home configuration. Common systems include central air with ductwork, ductless mini-splits, heat pumps (highly efficient for Oregon's climate), furnaces (gas or electric), and hybrid systems. The right system depends on your home's insulation, existing ductwork, and heating/cooling load calculations.",
        takeaways: [
          "Heat pumps are increasingly popular in Oregon for their heating and cooling efficiency",
          "Ductless mini-splits work well for homes without existing ductwork",
          "Regular filter changes are the single most important maintenance task",
          "Proper system sizing matters more than brand—oversized systems cycle inefficiently",
        ],
      },
      {
        sectionId: "contractor-selection",
        sectionTitle: "Selecting an HVAC Contractor",
        body: "Oregon requires HVAC contractors to hold CCB licensing. Look for contractors who perform Manual J load calculations rather than guessing system size. Ask about manufacturer certifications—Carrier, Trane, Lennox, and Mitsubishi all have factory training programs. Get written proposals that specify equipment model numbers, efficiency ratings, and warranty terms.",
        takeaways: [
          "Verify CCB license and ask about specific HVAC manufacturer certifications",
          "Request a load calculation rather than accepting a rule-of-thumb system size",
          "Compare efficiency ratings (SEER for cooling, AFUE for heating) across bids",
          "Ask about maintenance agreements—many contractors offer discounted tune-ups",
        ],
      },
    ],
    faqs: [
      {
        question: "Does an HVAC contractor need to be licensed in Oregon?",
        answer: "Yes, HVAC contractors in Oregon must hold a CCB license for installation and major repair work. Some HVAC technicians may also hold EPA Section 608 certification for refrigerant handling. You can verify a contractor's CCB license at oregon.gov/ccb.",
      },
      {
        question: "What factors affect HVAC installation or repair costs?",
        answer: "HVAC project costs are influenced by system type, efficiency rating, home size and insulation, ductwork requirements, and accessibility. Geographic location and seasonal demand also affect pricing—off-season installation may cost less. To understand costs for your specific situation, request written estimates from licensed contractors.",
      },
      {
        question: "How do I compare HVAC contractors for a new system installation?",
        answer: "Compare HVAC contractors by reviewing: their load calculation methodology, equipment efficiency ratings and model specifics, warranty coverage on both equipment and labor, references from similar installations, and whether they handle permits and inspections. Avoid contractors who quote only by square footage without assessing your home's specific needs.",
      },
    ],
  },
  {
    slug: "landscaping",
    industrySlug: "construction-home-services",
    displayName: "Landscaping Services",
    pluralName: "landscaping services",
    shortDescription: "Professional landscaping services including design, installation, maintenance, and hardscaping for residential and commercial properties.",
    tldr: "Landscapers transform outdoor spaces through design, planting, hardscaping, and maintenance. While Oregon doesn't license landscapers uniformly, those using pesticides or doing major hardscaping should carry appropriate certifications and CCB licensing. Get a detailed design plan before committing to major work.",
    licenseRequired: false,
    matchTerms: ["landscape", "landscaping", "lawn", "garden", "hardscape", "irrigation"],
    relatedCategories: ["roofing", "construction-general"],
    sections: [
      {
        sectionId: "service-types",
        sectionTitle: "Types of Landscaping Services",
        body: "Landscaping encompasses a broad range of services. Design services create master plans for your property. Installation includes planting, sodding, irrigation systems, and lighting. Hardscaping covers patios, retaining walls, walkways, and outdoor kitchens. Maintenance services include mowing, pruning, fertilizing, and seasonal cleanups. Some landscapers specialize in specific services while others offer full-service care.",
        takeaways: [
          "Design-build firms handle both planning and installation for cohesive results",
          "Irrigation system design significantly affects water efficiency and plant health",
          "Hardscaping adds structure and often increases property value",
          "Maintenance contracts can keep your landscape investment looking its best",
        ],
      },
      {
        sectionId: "hiring-landscaper",
        sectionTitle: "Hiring a Landscaping Professional",
        body: "Oregon's licensing requirements for landscapers vary by services offered. Those performing construction-style work (retaining walls, irrigation installation) should have CCB licensing. Those applying pesticides need Oregon Department of Agriculture certification. Ask to see past project photos, get references from similar-scale projects, and ensure you understand what's included in maintenance agreements.",
        takeaways: [
          "Ask if the landscaper holds CCB licensing for hardscaping or irrigation work",
          "Verify pesticide applicator certification if chemical treatments are included",
          "Get a detailed scope of work with plant varieties, hardscape materials, and timeline",
          "For maintenance services, clarify frequency, what's included, and cancellation terms",
        ],
      },
    ],
    faqs: [
      {
        question: "Do landscapers need to be licensed in Oregon?",
        answer: "Oregon's licensing requirements depend on the services provided. Landscapers performing construction-type work (built features, major irrigation) should have CCB licensing. Those applying pesticides require certification from the Oregon Department of Agriculture. For basic maintenance (mowing, pruning), no state license is required, but ask about insurance coverage.",
      },
      {
        question: "What factors affect landscaping project costs?",
        answer: "Landscaping costs vary based on project scope, materials selection, site accessibility, and whether design services are included. Hardscaping typically costs more than planting. Slope, soil conditions, and existing vegetation removal also affect pricing. The best way to understand costs is to get detailed proposals that break down design, materials, labor, and ongoing maintenance separately.",
      },
      {
        question: "How do I choose between landscaping contractors?",
        answer: "Compare landscapers by reviewing their portfolio of completed projects, checking references from projects of similar scope, verifying appropriate licensing for the work type, and ensuring their proposed plants and materials suit your site conditions. Be wary of unusually low bids—quality landscaping requires skilled labor and appropriate materials.",
      },
    ],
  },
];

// Helper: get category by slug
export const getServiceCategoryBySlug = (slug: string) =>
  serviceCategories.find((c) => c.slug === slug);

// Helper: get categories by industry slug
export const getCategoriesByIndustry = (industrySlug: string) =>
  serviceCategories.filter((c) => c.industrySlug === industrySlug);
