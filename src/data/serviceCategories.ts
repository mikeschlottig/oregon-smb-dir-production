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
  // ============================================================================
  // CONSTRUCTION & HOME SERVICES (pilot categories - preserved exactly)
  // ============================================================================
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
  // ============================================================================
  // AUTOMOTIVE
  // ============================================================================
  {
    slug: "auto-repair",
    industrySlug: "automotive",
    displayName: "Auto Repair Shops",
    pluralName: "auto repair shops",
    shortDescription: "Full-service auto repair and maintenance for all vehicle makes and models, from routine service to major repairs.",
    tldr: "Auto repair shops handle everything from oil changes and brake jobs to engine diagnostics and transmission repairs. Look for ASE-certified technicians, clear estimates in writing, and shops that specialize in your vehicle type when needed.",
    licenseRequired: false,
    matchTerms: ["auto repair", "auto shop", "mechanic", "brake", "engine", "transmission", "diagnostic"],
    relatedCategories: ["tire-services", "auto-detailing"],
    sections: [
      {
        sectionId: "common-repairs",
        sectionTitle: "Common Auto Repair Services",
        body: "Auto repair shops provide a wide range of maintenance and repair services. Routine maintenance includes oil changes, tire rotations, fluid checks, and filter replacements. Common repairs include brake service, battery replacement, suspension work, and electrical diagnostics. Many shops also handle state emissions testing and safety inspections where required.",
        takeaways: [
          "ASE certification indicates technicians have passed industry-standard exams",
          "Independent shops often cost less than dealership service centers for routine work",
          "Ask about warranty coverage on parts and labor before authorizing repairs",
          "Getting a written estimate prevents surprise charges",
        ],
      },
      {
        sectionId: "choosing-shop",
        sectionTitle: "How to Choose an Auto Repair Shop",
        body: "Start by asking for recommendations from friends, family, or online reviews that mention your vehicle make. Look for shops that employ ASE-certified technicians. Ask about their specialization—some shops focus on imports, others on domestic vehicles or specific systems like transmissions or brakes. Get estimates in writing and ask questions about anything unclear.",
        takeaways: [
          "Check online reviews with attention to how the shop handles complaints",
          "Ask if the shop offers loaner vehicles or shuttle service",
          "Verify the shop communicates clearly about recommended vs. required repairs",
          "Look for shops that provide detailed invoices listing parts and labor separately",
        ],
      },
    ],
    faqs: [
      {
        question: "How do I verify an auto repair shop's credentials?",
        answer: "While Oregon doesn't license auto repair shops statewide, you can look for ASE (Automotive Service Excellence) certification, check the shop's Better Business Bureau rating, and read reviews that mention successful repairs on vehicles similar to yours. A reputable shop will provide estimates in writing and explain their warranty policy.",
      },
      {
        question: "What factors affect the cost of auto repairs?",
        answer: "Repair costs depend on several factors: vehicle make and model (luxury and import parts often cost more), the specific repair needed, parts quality (OEM vs. aftermarket), and labor rates in your area. Diagnostic time, accessibility of components, and whether the shop uses genuine or aftermarket parts also affect pricing.",
      },
      {
        question: "How do I compare auto repair shops for a major repair?",
        answer: "For major repairs, compare shops by: asking about technician certifications, requesting written estimates that detail parts and labor, checking warranty terms on both parts and labor, asking about the shop's experience with your specific vehicle issue, and verifying they use quality parts appropriate for your vehicle.",
      },
    ],
  },
  {
    slug: "car-dealers",
    industrySlug: "automotive",
    displayName: "Car Dealerships",
    pluralName: "car dealerships",
    shortDescription: "New and used car dealerships offering vehicle sales, trade-ins, financing options, and often service departments.",
    tldr: "Car dealerships sell new and pre-owned vehicles, handle trade-ins, and arrange financing. Research market values before visiting, know your credit score, and don't focus only on monthly payment—consider total cost, warranty, and long-term reliability.",
    licenseRequired: true,
    licenseAuthority: "Oregon Department of Transportation – DMV",
    matchTerms: ["dealership", "dealer", "used car", "new car", "auto sales", "motors"],
    relatedCategories: ["auto-repair"],
    sections: [
      {
        sectionId: "buying-tips",
        sectionTitle: "Tips for Buying from a Dealership",
        body: "Before visiting a dealership, research the fair market value of vehicles you're considering using pricing guides. Get pre-approved financing from your bank or credit union so you can compare with dealer offers. Decide your must-have features versus nice-to-have options. Don't reveal your trade-in intentions until you've negotiated the new vehicle price.",
        takeaways: [
          "Research market values before setting foot on the lot",
          "Get pre-approved financing to compare with dealer rates",
          "Negotiate the out-the-door price, not just monthly payments",
          "Read the entire purchase agreement before signing",
        ],
      },
      {
        sectionId: "dealer-types",
        sectionTitle: "Understanding Dealer Types and Services",
        body: "New car dealerships are franchises of specific manufacturers and typically have factory-trained technicians in their service departments. Used car dealerships vary widely—some specialize in certified pre-owned vehicles with warranties, others sell as-is vehicles. Many dealerships also offer financing, extended warranties, and trade-in services.",
        takeaways: [
          "Franchise dealerships offer manufacturer-backed certified pre-owned programs",
          "Independent used car dealers may offer more price flexibility",
          "Dealer financing may be convenient but isn't always the lowest rate",
          "Certified pre-owned vehicles include manufacturer warranty coverage",
        ],
      },
    ],
    faqs: [
      {
        question: "Are car dealerships regulated in Oregon?",
        answer: "Yes, Oregon dealerships must be licensed through the Oregon Department of Transportation's DMV. You can verify a dealer's license and check for complaints through the DMV. Dealerships must provide certain disclosures about vehicle condition and history for used vehicles.",
      },
      {
        question: "What factors affect the price of a vehicle at a dealership?",
        answer: "Vehicle pricing depends on make, model, year, mileage, condition, and market demand. Additional factors include factory incentives, dealer holdback, trade-in value, financing terms, and any add-on products like extended warranties or protection packages. The final price also reflects the dealer's pricing strategy and your negotiation approach.",
      },
      {
        question: "How do I compare dealerships when shopping for a vehicle?",
        answer: "Compare dealerships by: checking online reviews for sales and service experiences, comparing advertised prices on identical vehicles, evaluating trade-in offer transparency, understanding their financing options and rates, and assessing the overall customer service approach. A dealership's service department reputation matters if you plan to service the vehicle there.",
      },
    ],
  },
  {
    slug: "tire-services",
    industrySlug: "automotive",
    displayName: "Tire Services",
    pluralName: "tire services",
    shortDescription: "Tire sales, installation, rotation, balancing, alignment, and repair services for all vehicle types.",
    tldr: "Tire shops sell new tires, provide installation and balancing, perform tire rotations, and offer alignment services. Proper tire maintenance improves safety, fuel economy, and tire life. Compare tire brands and warranties, not just price per tire.",
    licenseRequired: false,
    matchTerms: ["tire", "tires", "wheel", "alignment", "balance"],
    relatedCategories: ["auto-repair"],
    sections: [
      {
        sectionId: "tire-services-overview",
        sectionTitle: "Tire Services Overview",
        body: "Tire service providers handle tire sales, mounting and installation, balancing, rotations, flat repairs, and wheel alignments. Many also offer road hazard warranties and tire pressure monitoring system (TPMS) service. Choosing the right tires depends on your vehicle, driving habits, climate, and budget.",
        takeaways: [
          "Tire rotations every 5,000-7,000 miles promote even wear",
          "Wheel alignment affects tire life and vehicle handling",
          "All-season tires work for most Oregon drivers; winter tires help in snow zones",
          "Tire age matters—replace tires more than six years old regardless of tread",
        ],
      },
      {
        sectionId: "selecting-tire-shop",
        sectionTitle: "Selecting a Tire Service Provider",
        body: "Look for tire shops that offer a range of brands at different price points, not just one brand. Ask about road hazard warranty coverage and what's included. Compare the total installed price—some shops advertise low tire prices but add significant fees for mounting, balancing, and disposal. Check reviews for honesty in recommending services.",
        takeaways: [
          "Compare total installed price, not just the tire price",
          "Ask what's included: mounting, balancing, valves, disposal, alignment",
          "Understand the road hazard warranty terms before purchasing",
          "Check whether the shop offers free tire rotations after purchase",
        ],
      },
    ],
    faqs: [
      {
        question: "Do tire service providers need to be licensed in Oregon?",
        answer: "Oregon does not have a specific license requirement for tire service providers. However, if the business performs automotive repair services beyond basic tire changes, technicians may need appropriate training. Check reviews and ask about technician experience when selecting a provider.",
      },
      {
        question: "What factors affect the cost of tire services?",
        answer: "Tire service costs depend on tire brand and model, vehicle type (passenger vs. truck/SUV), additional services needed (alignment, balancing), and any warranty coverage. Geographic location and current manufacturer promotions also affect pricing. Getting quotes that include all fees gives the clearest cost comparison.",
      },
      {
        question: "How do I compare tire service providers?",
        answer: "Compare tire providers by: checking the range of tire brands and price points they offer, understanding what's included in the installed price, asking about road hazard and workmanship warranties, reading reviews about honesty in recommending services, and verifying they properly handle tire pressure monitoring system service if your vehicle has TPMS.",
      },
    ],
  },
  // ============================================================================
  // FOOD & DINING
  // ============================================================================
  {
    slug: "restaurants",
    industrySlug: "food-dining",
    displayName: "Restaurants",
    pluralName: "restaurants",
    shortDescription: "Full-service and casual dining restaurants offering diverse cuisines, from family-friendly to fine dining experiences.",
    tldr: "Restaurants offer prepared meals for dine-in, takeout, or delivery. When choosing a restaurant, consider cuisine type, price range, atmosphere, and recent reviews. Reservations are recommended for popular spots, especially on weekends.",
    licenseRequired: true,
    licenseAuthority: "Oregon Health Authority – Food Safety Program",
    matchTerms: ["restaurant", "dining", "eatery", "bistro", "steakhouse", "seafood", "italian", "mexican", "chinese", "thai", "american", "cuisine"],
    relatedCategories: ["cafes-coffee", "bakeries"],
    sections: [
      {
        sectionId: "restaurant-types",
        sectionTitle: "Types of Restaurants",
        body: "Restaurants range from quick-service and casual dining to fine dining establishments. Casual dining restaurants offer full table service in a relaxed atmosphere. Fine dining establishments feature upscale cuisine, formal service, and often require reservations. Many restaurants now offer takeout and delivery in addition to dine-in service.",
        takeaways: [
          "Casual dining offers full service without the formality or price of fine dining",
          "Many restaurants accommodate dietary restrictions with advance notice",
          "Check whether a restaurant accepts reservations or operates on a walk-in basis",
          "Online reviews and recent health inspection scores provide useful insights",
        ],
      },
      {
        sectionId: "choosing-restaurant",
        sectionTitle: "How to Choose a Restaurant",
        body: "Consider the occasion, group size, dietary needs, and budget when selecting a restaurant. Read recent reviews to understand current quality and service levels. Check the menu online beforehand to confirm they offer options for everyone in your group. For special occasions, call ahead to ask about seating options or special arrangements.",
        takeaways: [
          "Read reviews from the past three months for the most relevant feedback",
          "Check the restaurant's website or social media for current menus and hours",
          "Ask about accommodations for food allergies when making reservations",
          "Consider off-peak dining times for more attentive service and easier parking",
        ],
      },
    ],
    faqs: [
      {
        question: "Are restaurants required to have food safety certifications in Oregon?",
        answer: "Yes, Oregon requires food service establishments to operate under health and safety regulations enforced by the Oregon Health Authority and local county health departments. Restaurants must follow food handler certification requirements and pass regular inspections. You can check a restaurant's inspection history through your local county health department.",
      },
      {
        question: "What factors affect the dining experience at a restaurant?",
        answer: "Dining experience quality depends on several factors: food quality and preparation, service attentiveness and knowledge, atmosphere and cleanliness, timing (busy vs. quiet periods), and how well the restaurant accommodates dietary needs. Recent management or chef changes can also affect consistency, which is why current reviews matter more than older ones.",
      },
      {
        question: "How do I compare restaurants for a special occasion?",
        answer: "For special occasions, compare restaurants by: reading recent reviews focusing on service and special occasion experiences, checking their menu and pricing to match your budget, asking about private dining or quiet seating options, verifying they can accommodate any dietary restrictions in your group, and considering the overall atmosphere and noise level for your event.",
      },
    ],
  },
  {
    slug: "cafes-coffee",
    industrySlug: "food-dining",
    displayName: "Cafes & Coffee Shops",
    pluralName: "cafes and coffee shops",
    shortDescription: "Coffee shops and cafes serving espresso drinks, light meals, pastries, and providing comfortable spaces to work or meet.",
    tldr: "Cafes and coffee shops serve coffee, espresso drinks, light meals, and pastries in casual settings. Many offer free Wi-Fi and comfortable seating for working or meeting. Check hours, Wi-Fi reliability, and noise level if you plan to work from a cafe.",
    licenseRequired: true,
    licenseAuthority: "Oregon Health Authority – Food Safety Program",
    matchTerms: ["coffee", "cafe", "espresso", "tea", "pastry", "bakery cafe"],
    relatedCategories: ["restaurants", "bakeries"],
    sections: [
      {
        sectionId: "cafe-offerings",
        sectionTitle: "What Cafes and Coffee Shops Offer",
        body: "Coffee shops typically serve espresso-based drinks, brewed coffee, tea, and light food items like pastries, sandwiches, and salads. Many cafes roast their own beans or source from local roasters. Beyond beverages, cafes often serve as community gathering spaces, offering comfortable seating, Wi-Fi, and a relaxed atmosphere for meetings or solo work.",
        takeaways: [
          "Many cafes offer non-dairy milk alternatives for coffee drinks",
          "Wi-Fi quality and seating comfort vary significantly between cafes",
          "Some cafes host community events, live music, or open mic nights",
          "Check whether a cafe allows laptops during peak hours",
        ],
      },
      {
        sectionId: "choosing-cafe",
        sectionTitle: "Choosing a Cafe for Work or Meeting",
        body: "If you plan to work from a cafe, consider Wi-Fi reliability, available power outlets, noise level, and whether the cafe allows extended stays. For meetings, consider privacy, background noise, and whether the cafe takes reservations for groups. Read recent reviews that mention the specific features you need.",
        takeaways: [
          "Test Wi-Fi speed and outlet availability before committing to a work session",
          "Ask about busy times if you need a quieter environment",
          "Some cafes have time limits on table use during peak hours",
          "Check whether the cafe offers any food options if you plan to stay for a meal",
        ],
      },
    ],
    faqs: [
      {
        question: "Do cafes and coffee shops need food safety certification in Oregon?",
        answer: "Yes, Oregon requires food service establishments, including cafes and coffee shops that serve food, to follow health and safety regulations. Staff who handle food must have food handler cards. You can verify a cafe's compliance through local county health department inspection records.",
      },
      {
        question: "What should I consider when choosing a cafe to work from?",
        answer: "When selecting a cafe for work, consider several factors: Wi-Fi reliability and speed, availability of power outlets, noise level and background music, seating comfort for extended stays, bathroom accessibility, and the cafe's policy on laptop use. Also consider whether the cafe gets busy at certain times, which could affect both noise and seating availability.",
      },
      {
        question: "How do I compare cafes for meeting a client or friend?",
        answer: "For meetings, compare cafes by: checking noise levels in reviews (important for conversation), verifying they have adequate seating for your group size, asking whether they take reservations if your group is large, considering parking availability and transit access, and checking their hours to ensure they'll be open for your preferred meeting time.",
      },
    ],
  },
  {
    slug: "bakeries",
    industrySlug: "food-dining",
    displayName: "Bakeries",
    pluralName: "bakeries",
    shortDescription: "Bakeries offering fresh-baked breads, pastries, cakes, and desserts, from artisan bread shops to custom cake decorators.",
    tldr: "Bakeries produce fresh breads, pastries, cakes, and desserts daily. Artisan bakeries focus on handcrafted breads and pastries, while specialty bakeries may focus on cakes, cookies, or dietary-specific baked goods. Order custom cakes in advance, especially for special occasions.",
    licenseRequired: true,
    licenseAuthority: "Oregon Health Authority – Food Safety Program",
    matchTerms: ["bakery", "baker", "bread", "pastry", "cake", "dessert", "donut", "bagel"],
    relatedCategories: ["cafes-coffee", "restaurants"],
    sections: [
      {
        sectionId: "bakery-types",
        sectionTitle: "Types of Bakeries",
        body: "Bakeries specialize in different products. Artisan bread bakeries focus on handcrafted loaves using traditional techniques. Pastry shops specialize in croissants, danishes, and other laminated dough products. Cake shops create custom celebration cakes. Some bakeries combine cafe service, offering coffee and seating to enjoy baked goods on-site.",
        takeaways: [
          "Artisan breads are typically baked fresh each morning",
          "Custom cakes require advance ordering—ask about lead time",
          "Many bakeries now offer gluten-free and vegan options",
          "Bread freshness matters—ask when items were baked",
        ],
      },
      {
        sectionId: "ordering-custom",
        sectionTitle: "Ordering Custom Bakery Items",
        body: "For custom cakes, cookies, or large orders, contact the bakery well in advance. Be prepared to discuss serving size, dietary restrictions, design preferences, and delivery or pickup logistics. Ask about tasting options for wedding cakes or large event orders. Understand the cancellation and deposit policies before placing your order.",
        takeaways: [
          "Order custom cakes at least one to two weeks in advance",
          "Ask about tiered pricing based on size and design complexity",
          "Request sample tasting for weddings or large events",
          "Understand pickup or delivery logistics and timing",
        ],
      },
    ],
    faqs: [
      {
        question: "Do bakeries need to be certified in Oregon?",
        answer: "Yes, Oregon requires bakeries to follow food safety regulations enforced by the Oregon Health Authority and local county health departments. Bakeries that prepare food on-site must have appropriate permits and staff with food handler certifications. Retail bakeries that only sell pre-packaged goods may have different requirements.",
      },
      {
        question: "What factors affect bakery pricing for custom orders?",
        answer: "Custom bakery pricing depends on several factors: size and serving count, design complexity, ingredient quality (organic, specialty flours, premium chocolates), dietary accommodation requirements (gluten-free, vegan), and lead time. Delivery and setup for large orders also add to the cost. Asking for a detailed quote helps you understand what's included.",
      },
      {
        question: "How do I choose a bakery for a special event?",
        answer: "For special events, compare bakeries by: reviewing photos of their past work in the style you want, reading reviews that mention event orders specifically, asking about tasting options, verifying they can accommodate dietary restrictions in your group, understanding their delivery or pickup logistics, and confirming they have experience with your event size.",
      },
    ],
  },
  // ============================================================================
  // HEALTH & MEDICAL
  // ============================================================================
  {
    slug: "dentists",
    industrySlug: "health-medical",
    displayName: "Dentists & Dental Clinics",
    pluralName: "dentists and dental clinics",
    shortDescription: "General and specialty dental care including cleanings, fillings, cosmetic dentistry, and oral health services for all ages.",
    tldr: "Dentists provide preventive, restorative, and cosmetic oral care. General dentists handle routine cleanings, fillings, and basic procedures. Specialists include orthodontists, oral surgeons, and periodontists. Verify licensing through the Oregon Board of Dentistry and check what insurance plans are accepted.",
    licenseRequired: true,
    licenseAuthority: "Oregon Board of Dentistry",
    licenseUrl: "https://www.oregon.gov/oba",
    matchTerms: ["dentist", "dental", "dentistry", "orthodontist", "oral surgeon", "periodontist", "endodontist"],
    relatedCategories: ["chiropractors", "primary-care"],
    sections: [
      {
        sectionId: "dental-services",
        sectionTitle: "Types of Dental Services",
        body: "General dentists provide preventive care (cleanings, exams, x-rays), restorative treatments (fillings, crowns, bridges), and basic cosmetic services. Specialty dentists include orthodontists (braces and aligners), oral surgeons (extractions, implants), periodontists (gum disease treatment), and endodontists (root canals). Pediatric dentists specialize in children's oral health.",
        takeaways: [
          "Routine cleanings and exams help prevent costly dental problems",
          "Many dentists offer sedation options for anxious patients",
          "Orthodontic treatment isn't just for teens—adult options include clear aligners",
          "Emergency dental services are available through many general practices",
        ],
      },
      {
        sectionId: "choosing-dentist",
        sectionTitle: "How to Choose a Dentist",
        body: "Start by checking whether the dentist is in-network with your dental insurance. Verify their Oregon Board of Dentistry license status. Consider location, office hours, and whether they offer the services you need. Read reviews that mention bedside manner, wait times, and billing transparency. Schedule a consultation to assess comfort level before committing to treatment.",
        takeaways: [
          "Verify Oregon Board of Dentistry license before scheduling",
          "Ask about emergency appointment availability and after-hours care",
          "Understand fee structure for uninsured services upfront",
          "Check whether the office uses digital x-rays (lower radiation exposure)",
        ],
      },
    ],
    faqs: [
      {
        question: "Are dentists required to be licensed in Oregon?",
        answer: "Yes, all dentists practicing in Oregon must be licensed by the Oregon Board of Dentistry. You can verify a dentist's license, check for any disciplinary actions, and confirm their education credentials through the Board's online license lookup tool at oregon.gov/oba.",
      },
      {
        question: "What factors affect the cost of dental care?",
        answer: "Dental care costs depend on the type of procedure, materials used (amalgam vs. composite fillings, type of crown material), geographic location, and whether you have dental insurance. Preventive care typically costs less than restorative or cosmetic procedures. Many dentists offer payment plans or work with third-party financing for larger treatments.",
      },
      {
        question: "How do I compare dentists for ongoing dental care?",
        answer: "Compare dentists by: verifying Oregon Board of Dentistry license, checking insurance network participation, reading reviews that mention communication style and pain management, assessing office cleanliness and modern equipment, understanding their approach to treatment planning, and evaluating whether the office staff is responsive and transparent about costs.",
      },
    ],
  },
  {
    slug: "chiropractors",
    industrySlug: "health-medical",
    displayName: "Chiropractors",
    pluralName: "chiropractors",
    shortDescription: "Chiropractic care focusing on spinal health, pain relief, and non-invasive treatment for musculoskeletal conditions.",
    tldr: "Chiropractors diagnose and treat musculoskeletal disorders, primarily through spinal adjustments and manipulations. Chiropractic care can help with back pain, neck pain, headaches, and joint issues. Verify licensing through the Oregon Board of Chiropractic Examiners and discuss treatment plans upfront.",
    licenseRequired: true,
    licenseAuthority: "Oregon Board of Chiropractic Examiners",
    licenseUrl: "https://www.oregon.gov/chiro",
    matchTerms: ["chiropractor", "chiropractic", "spinal", "back pain", "neck pain"],
    relatedCategories: ["dentists", "acupuncture"],
    sections: [
      {
        sectionId: "chiropractic-care",
        sectionTitle: "Understanding Chiropractic Care",
        body: "Chiropractors focus on the relationship between the spine and nervous system. Common treatments include spinal adjustments, manual manipulations, soft tissue therapy, and exercise recommendations. Chiropractors often treat back pain, neck pain, headaches, sciatica, and joint pain. Many also provide nutritional counseling and lifestyle advice.",
        takeaways: [
          "Chiropractors use drug-free, non-surgical approaches to pain management",
          "Treatment plans vary—some recommend ongoing maintenance, others focus on acute care",
          "Many chiropractors coordinate care with medical doctors and physical therapists",
          "Ask about the chiropractor's approach to treatment planning",
        ],
      },
      {
        sectionId: "choosing-chiropractor",
        sectionTitle: "How to Choose a Chiropractor",
        body: "Verify the chiropractor's license through the Oregon Board of Chiropractic Examiners. Ask about their treatment philosophy—some focus on wellness care with frequent visits, others concentrate on resolving specific complaints. Check whether they use additional therapies like ultrasound, electrical stimulation, or rehabilitative exercise. Read reviews that mention treatment outcomes and communication style.",
        takeaways: [
          "Verify Oregon Board of Chiropractic Examiners license before starting care",
          "Ask about typical treatment duration and frequency upfront",
          "Check whether the chiropractor takes X-rays in-office or refers out",
          "Understand costs and insurance coverage before beginning treatment",
        ],
      },
    ],
    faqs: [
      {
        question: "Are chiropractors licensed in Oregon?",
        answer: "Yes, chiropractors in Oregon must be licensed by the Oregon Board of Chiropractic Examiners. You can verify a chiropractor's license status and check for any disciplinary actions through the Board's website at oregon.gov/chiro.",
      },
      {
        question: "What factors influence the cost of chiropractic care?",
        answer: "Chiropractic care costs depend on several factors: whether you have insurance coverage, the types of treatments provided (adjustments vs. additional therapies), frequency of visits, and whether X-rays or other diagnostics are needed. Initial consultations typically cost more than follow-up visits. Some chiropractors offer package pricing for multiple visits.",
      },
      {
        question: "How do I compare chiropractors for ongoing care?",
        answer: "Compare chiropractors by: verifying Oregon Board of Chiropractic Examiners license, reading reviews that discuss treatment outcomes for conditions similar to yours, asking about their treatment approach and expected visit frequency, checking whether they provide a written treatment plan with goals, and understanding costs, insurance coverage, and cancellation policies.",
      },
    ],
  },
  {
    slug: "primary-care",
    industrySlug: "health-medical",
    displayName: "Primary Care Physicians",
    pluralName: "primary care physicians",
    shortDescription: "Family medicine, internal medicine, and general practice doctors providing preventive care and treatment for common illnesses.",
    tldr: "Primary care physicians (PCPs) serve as your main healthcare provider for preventive care, routine health concerns, and referrals to specialists. Choose a PCP based on insurance network, office location, communication style, and whether they are accepting new patients.",
    licenseRequired: true,
    licenseAuthority: "Oregon Medical Board",
    licenseUrl: "https://www.oregon.gov/omb",
    matchTerms: ["doctor", "physician", "family medicine", "internal medicine", "primary care", "general practice", "clinic", "medical center"],
    relatedCategories: ["dentists", "chiropractors"],
    sections: [
      {
        sectionId: "primary-care-role",
        sectionTitle: "The Role of Primary Care",
        body: "Primary care physicians provide comprehensive healthcare including preventive services (annual exams, screenings, immunizations), diagnosis and treatment of common illnesses, management of chronic conditions, and referrals to specialists when needed. Family medicine doctors treat patients of all ages. Internal medicine doctors (internists) typically treat adults. Some practices include nurse practitioners or physician assistants.",
        takeaways: [
          "Having an established primary care provider improves health outcomes",
          "Annual wellness visits are often covered 100% by insurance",
          "Primary care doctors coordinate care across multiple specialists",
          "Many practices offer same-day appointments for urgent concerns",
        ],
      },
      {
        sectionId: "choosing-provider",
        sectionTitle: "How to Choose a Primary Care Provider",
        body: "Start by confirming the doctor is in-network with your insurance plan. Check whether they are accepting new patients. Consider office location, available appointment times, and whether the practice offers online appointment scheduling or patient portals. Read reviews that mention communication style, wait times, and whether the doctor listens to patient concerns.",
        takeaways: [
          "Verify Oregon Medical Board license before scheduling",
          "Ask about after-hours care and how the practice handles emergencies",
          "Check whether the practice uses electronic medical records and patient portals",
          "Consider whether you prefer a solo practice or a larger group practice",
        ],
      },
    ],
    faqs: [
      {
        question: "Are primary care physicians required to be licensed in Oregon?",
        answer: "Yes, all physicians practicing in Oregon must be licensed by the Oregon Medical Board. You can verify a doctor's license, check for disciplinary actions, and confirm their board certification through the Oregon Medical Board's website at oregon.gov/omb.",
      },
      {
        question: "What factors affect the cost of primary care visits?",
        answer: "Primary care visit costs depend on your insurance coverage (copay, coinsurance, or full cost if uninsured), the type of visit (preventive vs. problem-focused), and any additional services like lab work or procedures. Many insurance plans cover annual wellness visits at no cost to the patient. For uninsured patients, some practices offer sliding scale fees.",
      },
      {
        question: "How do I compare primary care providers for ongoing care?",
        answer: "Compare primary care providers by: verifying Oregon Medical Board license, confirming insurance network participation, reading reviews about communication style and thoroughness, checking office logistics (location, parking, wait times), understanding the practice's approach to after-hours care, and assessing whether the doctor takes time to answer your questions.",
      },
    ],
  },
  {
    slug: "acupuncture",
    industrySlug: "health-medical",
    displayName: "Acupuncture Clinics",
    pluralName: "acupuncture clinics",
    shortDescription: "Traditional Chinese medicine and acupuncture services for pain management, stress reduction, and wellness support.",
    tldr: "Acupuncture involves inserting thin needles at specific points to promote healing and balance. Licensed acupuncturists treat pain, stress, digestive issues, and more. Verify licensing through the Oregon Health Authority's Board of Licensed Acupuncturists and check whether your condition is appropriate for acupuncture treatment.",
    licenseRequired: true,
    licenseAuthority: "Oregon Health Authority – Board of Licensed Acupuncturists",
    matchTerms: ["acupuncture", "acupuncturist", "traditional chinese medicine", "TCM", "needle"],
    relatedCategories: ["chiropractors", "massage-therapy"],
    sections: [
      {
        sectionId: "acupuncture-overview",
        sectionTitle: "Understanding Acupuncture",
        body: "Acupuncture is a component of traditional Chinese medicine that involves inserting very thin, sterile needles into specific points on the body. It's commonly used for pain management, stress reduction, migraine relief, and various other conditions. Many acupuncturists also incorporate cupping, moxibustion, herbal medicine, and lifestyle recommendations into treatment plans.",
        takeaways: [
          "Acupuncture is generally painless—needles are much thinner than those used for injections",
          "Treatment plans vary based on individual diagnosis and goals",
          "Many people find acupuncture helpful for both acute and chronic conditions",
          "Check whether your insurance covers acupuncture services",
        ],
      },
      {
        sectionId: "choosing-acupuncturist",
        sectionTitle: "How to Choose an Acupuncturist",
        body: "Verify the acupuncturist's license through the Oregon Health Authority's Board of Licensed Acupuncturists. Ask about their training, particularly if you have a specific health condition. Some acupuncturists specialize in pain management, fertility, digestive health, or stress-related conditions. Check whether the clinic is clean, the practitioner uses sterile disposable needles, and whether they take time to discuss your health history.",
        takeaways: [
          "Verify licensure through the Oregon Health Authority",
          "Ask about the practitioner's experience with your specific health concern",
          "Check that the clinic uses sterile, single-use needles",
          "Understand the recommended treatment frequency and total plan upfront",
        ],
      },
    ],
    faqs: [
      {
        question: "Are acupuncturists required to be licensed in Oregon?",
        answer: "Yes, acupuncturists in Oregon must be licensed by the Oregon Health Authority's Board of Licensed Acupuncturists. You can verify a practitioner's license and check for any disciplinary actions through the Oregon Health Authority website.",
      },
      {
        question: "What factors affect the cost of acupuncture treatment?",
        answer: "Acupuncture costs depend on several factors: whether you have insurance coverage (some plans cover acupuncture), the length and complexity of the session, whether herbs or other adjunct therapies are included, and the practitioner's experience level. Initial consultations typically cost more than follow-up treatments. Some practitioners offer package pricing for multiple sessions.",
      },
      {
        question: "How do I compare acupuncturists for treatment?",
        answer: "Compare acupuncturists by: verifying Oregon Health Authority licensure, reading reviews that mention treatment for conditions similar to yours, asking about their training and specialization areas, checking whether they provide a clear treatment plan with expected outcomes, and understanding costs, insurance coverage, and the recommended treatment schedule.",
      },
    ],
  },
  // ============================================================================
  // BEAUTY & PERSONAL CARE
  // ============================================================================
  {
    slug: "hair-salons",
    industrySlug: "beauty-personal-care",
    displayName: "Hair Salons & Barbershops",
    pluralName: "hair salons and barbershops",
    shortDescription: "Professional hair cutting, styling, coloring, and texture services for men, women, and children.",
    tldr: "Hair salons and barbershops provide haircuts, styling, coloring, and texture services. Look at stylists' portfolios for your hair type, read recent reviews, and consider whether the salon specializes in your desired service (color correction, curly hair, etc.). A consultation before color services is essential.",
    licenseRequired: true,
    licenseAuthority: "Oregon Health Licensing Office – Board of Cosmetology",
    matchTerms: ["hair salon", "hair stylist", "barber", "barbershop", "haircut", "hair color", "stylist"],
    relatedCategories: ["nail-salons", "spas"],
    sections: [
      {
        sectionId: "salon-services",
        sectionTitle: "Hair Salon and Barbershop Services",
        body: "Hair salons offer a range of services including haircuts, blowouts, hair coloring, highlights, balayage, perms, and hair treatments. Barbershops traditionally focus on men's haircuts, beard trims, and straight-razor shaves, though many now serve all genders. Some salons specialize in specific techniques like curly hair cutting, color correction, or bridal styling.",
        takeaways: [
          "Color services require a consultation to assess hair health and discuss goals",
          "Barbershops often offer traditional hot towel shaves and beard grooming",
          "Many salons offer bridal and special event styling packages",
          "Check whether the salon uses high-quality, professional-grade color and products",
        ],
      },
      {
        sectionId: "choosing-stylist",
        sectionTitle: "How to Choose a Hair Stylist or Barber",
        body: "Look at stylists' portfolios or social media to see examples of their work, particularly for your hair type and desired service. Read recent reviews that mention the specific service you want. Consider the salon's location, hours, and pricing. For color services, schedule a consultation first—a good stylist will assess your hair's condition and discuss realistic outcomes.",
        takeaways: [
          "Verify the salon's Oregon Board of Cosmetology license",
          "Ask to see a portfolio of the stylist's recent work",
          "Schedule a consultation before booking color correction or major changes",
          "Check whether the salon offers a satisfaction guarantee policy",
        ],
      },
    ],
    faqs: [
      {
        question: "Are hair salons and barbershops required to be licensed in Oregon?",
        answer: "Yes, hair salons, barbershops, and individual stylists/barbers must be licensed by the Oregon Health Licensing Office's Board of Cosmetology. You can verify a salon's license and check for any violations through the Oregon Health Licensing Office website.",
      },
      {
        question: "What factors affect the cost of hair salon services?",
        answer: "Hair service costs depend on several factors: the stylist's experience level (master stylist vs. junior stylist), the complexity and length of the service, hair length and thickness, product quality, and geographic location. Color services often cost more due to the time, skill, and product costs involved. Many salons offer tiered pricing based on stylist experience.",
      },
      {
        question: "How do I compare hair salons for a new stylist?",
        answer: "Compare hair salons by: verifying Oregon Board of Cosmetology licensing, reviewing stylists' portfolios for work similar to your hair type and desired outcome, reading recent reviews that mention the specific service you want, checking pricing transparency (many salons list prices online), and scheduling a consultation to assess communication and professionalism.",
      },
    ],
  },
  {
    slug: "nail-salons",
    industrySlug: "beauty-personal-care",
    displayName: "Nail Salons",
    pluralName: "nail salons",
    shortDescription: "Manicures, pedicures, nail art, and nail enhancement services including gel, acrylic, and dip powder.",
    tldr: "Nail salons offer manicures, pedicures, gel polish, acrylics, and nail art. Cleanliness is critical—verify the salon follows proper sanitation practices. Oregon licenses nail salons and technicians. Check reviews for mentions of cleanliness, durability of polish, and technician skill.",
    licenseRequired: true,
    licenseAuthority: "Oregon Health Licensing Office – Board of Cosmetology",
    matchTerms: ["nail", "manicure", "pedicure", "gel", "acrylic", "dip powder"],
    relatedCategories: ["hair-salons", "spas"],
    sections: [
      {
        sectionId: "nail-services",
        sectionTitle: "Nail Salon Services",
        body: "Nail salons provide manicures (hand and nail care), pedicures (foot and toenail care), gel polish applications, acrylic and dip powder nail enhancements, and nail art. Many salons also offer paraffin treatments, hand and foot massages, and other spa add-ons. Some salons specialize in natural nail care, while others focus on enhancements.",
        takeaways: [
          "Gel polish lasts longer than regular polish but requires UV light to cure",
          "Acrylic and dip powder nails require fills every 2-3 weeks as nails grow",
          "Proper cuticle care prevents hangnails and promotes healthy nail growth",
          "Ask about the salon's policy if polish chips within a few days",
        ],
      },
      {
        sectionId: "cleanliness-safety",
        sectionTitle: "Cleanliness and Safety in Nail Salons",
        body: "Oregon requires nail salons to follow strict sanitation protocols. Tools must be properly sterilized between clients, and single-use items should be discarded after each service. When visiting a nail salon, observe whether technicians wash hands between clients, use clean tool kits, and maintain a clean work area. Don't hesitate to ask about sanitation practices.",
        takeaways: [
          "Verify Oregon Board of Cosmetology license is displayed",
          "Look for autoclave sterilization equipment or single-use tool kits",
          "Check that foot baths are cleaned and disinfected between clients",
          "Leave if you observe unsanitary practices—your health is not worth the risk",
        ],
      },
    ],
    faqs: [
      {
        question: "Are nail salons and technicians licensed in Oregon?",
        answer: "Yes, nail salons and nail technicians must be licensed by the Oregon Health Licensing Office's Board of Cosmetology. You can verify a salon's license and check for any sanitation violations through the Oregon Health Licensing Office website.",
      },
      {
        question: "What factors affect the cost of nail salon services?",
        answer: "Nail service costs depend on the type of service (basic manicure vs. gel or acrylic), additional options like nail art or paraffin treatments, the technician's experience level, and geographic location. Enhancement services like acrylics or gels cost more initially but may include fill pricing in the total cost discussion. Checking prices online before visiting helps avoid surprises.",
      },
      {
        question: "How do I compare nail salons for quality and safety?",
        answer: "Compare nail salons by: verifying Oregon Board of Cosmetology licensing, observing cleanliness and sanitation practices during a visit, reading reviews that specifically mention cleanliness and polish durability, checking whether technicians are properly trained and licensed, and assessing the overall professionalism of the staff.",
      },
    ],
  },
  {
    slug: "spas",
    industrySlug: "beauty-personal-care",
    displayName: "Day Spas & Wellness Spas",
    pluralName: "day spas and wellness spas",
    shortDescription: "Relaxing spa treatments including facials, massages, body treatments, and skin care services in a tranquil setting.",
    tldr: "Day spas offer facials, massages, body treatments, and skincare services. Look for licensed estheticians and massage therapists, read reviews about cleanliness and relaxation atmosphere, and ask about package deals if booking multiple services. Arrive early to enjoy the full spa experience.",
    licenseRequired: true,
    licenseAuthority: "Oregon Health Licensing Office – Board of Cosmetology (for estheticians)",
    matchTerms: ["spa", "day spa", "facial", "massage", "body treatment", "skin care", "esthetician", "wellness"],
    relatedCategories: ["hair-salons", "nail-salons"],
    sections: [
      {
        sectionId: "spa-services",
        sectionTitle: "Common Spa Services",
        body: "Day spas offer a variety of relaxation and beauty services. Facials cleanse, exfoliate, and nourish the skin. Massage therapy reduces muscle tension and promotes relaxation. Body treatments like wraps and scrubs exfoliate and hydrate the skin. Many spas also offer waxing, eyelash services, and makeup application. Some spas specialize in specific services or cater to specific needs (prenatal, sports recovery).",
        takeaways: [
          "Facials are customized based on your skin type and concerns",
          "Massage therapy styles vary—Swedish, deep tissue, hot stone, and aromatherapy are common",
          "Many spas offer packages combining multiple services at a discount",
          "Arrive 15-20 minutes early to check in, change, and relax before your service",
        ],
      },
      {
        sectionId: "choosing-spa",
        sectionTitle: "How to Choose a Day Spa",
        body: "Read reviews that mention the specific service you want and the overall atmosphere. Check whether the spa employs licensed estheticians and massage therapists. Consider the spa's cleanliness, ambiance, and privacy. Ask about their cancellation policy and gratuity expectations. For facials, ask about the product lines they use and whether they offer a skin consultation.",
        takeaways: [
          "Verify that estheticians and massage therapists are properly licensed",
          "Read reviews that mention cleanliness and therapist skill",
          "Ask about package deals if booking multiple or repeated services",
          "Understand the cancellation policy—most spas charge for late cancellations",
        ],
      },
    ],
    faqs: [
      {
        question: "Are spas and their staff required to be licensed in Oregon?",
        answer: "Yes, estheticians (who perform facials and skin care) and massage therapists must be licensed in Oregon. Estheticians are licensed through the Oregon Health Licensing Office's Board of Cosmetology. Massage therapists are licensed through the Oregon Board of Massage Therapists. You can verify licenses through the respective state boards.",
      },
      {
        question: "What factors affect the cost of spa services?",
        answer: "Spa service costs depend on the type and length of service, the therapist's or esthetician's experience level, the spa's location and amenities, and whether you book individual services or packages. Longer sessions and specialized treatments typically cost more. Many spas offer membership programs or package pricing that reduce the per-service cost.",
      },
      {
        question: "How do I compare spas for a first visit?",
        answer: "For a first spa visit, compare spas by: verifying that estheticians and massage therapists are licensed, reading reviews that mention the specific service you want, checking the spa's cleanliness and ambiance (look for recent photos), understanding their cancellation and late arrival policies, and asking whether they offer a consultation to customize services to your needs.",
      },
    ],
  },
  // ============================================================================
  // BUSINESS & PROFESSIONAL SERVICES
  // ============================================================================
  {
    slug: "marketing-agencies",
    industrySlug: "business-professional-services",
    displayName: "Marketing & Advertising Agencies",
    pluralName: "marketing and advertising agencies",
    shortDescription: "Full-service and specialized marketing agencies offering digital marketing, branding, social media, SEO, and advertising services.",
    tldr: "Marketing agencies help businesses grow through strategy, branding, digital marketing, content creation, and advertising campaigns. Choose an agency based on their experience in your industry, the services you need, their portfolio, and whether their communication style matches your preferences.",
    licenseRequired: false,
    matchTerms: ["marketing", "advertising", "agency", "digital marketing", "SEO", "social media", "branding", "brand agency"],
    relatedCategories: ["web-design", "business-consulting"],
    sections: [
      {
        sectionId: "agency-services",
        sectionTitle: "Marketing Agency Services",
        body: "Marketing agencies range from full-service firms offering strategy, branding, digital marketing, content creation, and media buying to specialized agencies focusing on specific channels like SEO, social media, or paid advertising. Some agencies serve specific industries (healthcare, real estate, B2B), while others work across sectors. Services may include market research, campaign development, content creation, email marketing, and analytics reporting.",
        takeaways: [
          "Full-service agencies handle all marketing needs; specialized agencies focus on specific channels",
          "Industry experience matters—ask about relevant past clients",
          "Some agencies offer à la carte services; others require retainer agreements",
          "Ask about reporting frequency and the metrics they track",
        ],
      },
      {
        sectionId: "choosing-agency",
        sectionTitle: "How to Choose a Marketing Agency",
        body: "Start by defining your goals and budget. Review agency portfolios and case studies, focusing on results achieved for similar businesses. Ask for client references and actually contact them. Understand their pricing model (hourly, project-based, or retainer). During initial conversations, assess whether they ask good questions about your business and seem genuinely interested in your success.",
        takeaways: [
          "Ask for case studies with measurable results, not just creative samples",
          "Understand contract terms, including length and cancellation policies",
          "Check whether they provide regular reporting and strategy updates",
          "Be wary of agencies that promise specific rankings or results—good agencies focus on strategy and improvement",
        ],
      },
    ],
    faqs: [
      {
        question: "Are marketing agencies required to be licensed in Oregon?",
        answer: "Oregon does not have a specific license requirement for marketing agencies. However, agencies operating as businesses must be properly registered, and individual services like advertising may be subject to general business regulations. When choosing an agency, focus on their portfolio, client references, and industry experience rather than licensing.",
      },
      {
        question: "What factors affect the cost of marketing agency services?",
        answer: "Marketing agency costs depend on several factors: scope of services, agency size and location, team member experience levels, project complexity, and whether you choose project-based or retainer pricing. Monthly retainers can range widely based on service scope. Getting detailed proposals that break down services and deliverables helps you compare value across agencies.",
      },
      {
        question: "How do I compare marketing agencies for my business?",
        answer: "Compare marketing agencies by: reviewing case studies and results for businesses similar to yours, checking client references, understanding their reporting and communication process, comparing pricing models and contract terms, and assessing cultural fit during initial conversations. The best agency is one that asks thoughtful questions about your business and proposes a strategy aligned with your goals.",
      },
    ],
  },
  {
    slug: "web-design",
    industrySlug: "business-professional-services",
    displayName: "Web Design & Development",
    pluralName: "web design and development services",
    shortDescription: "Custom website design, development, e-commerce solutions, and website maintenance for businesses and organizations.",
    tldr: "Web designers and developers create custom websites, e-commerce stores, and web applications. Look at their portfolio for sites in your industry, ask about platform expertise (WordPress, Shopify, custom), and understand ongoing maintenance costs. A good website is an investment in your business.",
    licenseRequired: false,
    matchTerms: ["web design", "website", "developer", "web developer", "web designer", "ecommerce", "wordpress", "shopify"],
    relatedCategories: ["marketing-agencies", "business-consulting"],
    sections: [
      {
        sectionId: "web-services",
        sectionTitle: "Web Design and Development Services",
        body: "Web professionals offer a range of services from simple brochure websites to complex e-commerce platforms and web applications. Some specialize in specific platforms like WordPress, Shopify, or custom development. Services may include UI/UX design, responsive design (mobile-friendly), e-commerce setup, content management system configuration, SEO basics, and ongoing maintenance and security updates.",
        takeaways: [
          "Responsive design (mobile-friendly) is essential—most traffic is now mobile",
          "E-commerce sites require additional security and payment processing setup",
          "Content management systems let you update content without coding",
          "Ongoing maintenance includes security updates, backups, and performance monitoring",
        ],
      },
      {
        sectionId: "choosing-developer",
        sectionTitle: "How to Choose a Web Designer or Developer",
        body: "Review portfolios carefully—look for sites that match your aesthetic and functional needs. Ask about their process: do they start with strategy and user experience, or just jump into design? Understand what's included: strategy, design, development, content, training, and launch support. Ask about post-launch support and maintenance options. Get detailed proposals that specify deliverables, timeline, and total cost.",
        takeaways: [
          "Check that portfolio sites are live and load quickly",
          "Ask who owns the website and domain after launch",
          "Understand training included for updating your own site",
          "Get clarity on ongoing costs: hosting, maintenance, and updates",
        ],
      },
    ],
    faqs: [
      {
        question: "Are web designers and developers required to be licensed in Oregon?",
        answer: "Oregon does not require specific licensing for web designers and developers. These are professional services businesses that must be properly registered but have no state licensing board. Focus on reviewing portfolios, checking client references, and assessing technical expertise when choosing a web professional.",
      },
      {
        question: "What factors affect the cost of website design and development?",
        answer: "Website costs depend on several factors: number of pages, design complexity, functionality requirements (e-commerce, membership, booking), platform choice, content creation needs, and whether you need ongoing maintenance. Simple brochure sites cost less than custom e-commerce or web applications. Getting detailed proposals with clear deliverables helps you understand what's included.",
      },
      {
        question: "How do I compare web design proposals from different providers?",
        answer: "Compare web design proposals by: reviewing portfolio sites they've built (visit them on mobile and desktop), understanding what's included (strategy, design, development, content, training, launch), comparing timeline estimates, asking about post-launch support and maintenance costs, and assessing communication style and responsiveness during the proposal process.",
      },
    ],
  },
  {
    slug: "business-consulting",
    industrySlug: "business-professional-services",
    displayName: "Business Consulting & Advisory",
    pluralName: "business consulting and advisory services",
    shortDescription: "Strategic business consulting covering operations, growth strategy, financial planning, and organizational development for businesses.",
    tldr: "Business consultants help companies improve performance, solve problems, and achieve growth goals. Consultants specialize in areas like strategy, operations, finance, HR, or specific industries. Choose a consultant based on relevant experience, clear methodology, and strong references from similar clients.",
    licenseRequired: false,
    matchTerms: ["consultant", "consulting", "advisory", "strategy", "business coach", "management consultant", "business to business"],
    relatedCategories: ["marketing-agencies"],
    sections: [
      {
        sectionId: "consulting-services",
        sectionTitle: "Types of Business Consulting Services",
        body: "Business consultants work with companies to improve performance and solve problems. Strategy consultants help with business planning, market entry, and growth strategy. Operations consultants focus on efficiency, process improvement, and supply chain. Financial consultants assist with budgeting, forecasting, and financial analysis. HR consultants handle organizational design, hiring, and compliance. Some consultants specialize by industry (healthcare, manufacturing, retail).",
        takeaways: [
          "Consultants bring outside perspective and specialized expertise",
          "Engagements range from short-term problem-solving to long-term retainers",
          "Industry experience matters—ask about similar client challenges",
          "Good consultants transfer knowledge to your team, not just deliver recommendations",
        ],
      },
      {
        sectionId: "choosing-consultant",
        sectionTitle: "How to Choose a Business Consultant",
        body: "Define your problem or goal clearly before meeting consultants. Ask for case studies showing how they've helped similar businesses. Check references—speak with past clients about results achieved and working style. Understand their methodology: how do they approach problems, gather data, and develop recommendations? Discuss deliverables, timeline, and how success will be measured.",
        takeaways: [
          "Ask for specific examples of results achieved for similar clients",
          "Understand pricing model: hourly, project-based, or retainer",
          "Check that the consultant has experience with businesses your size",
          "Discuss how findings and recommendations will be documented and presented",
        ],
      },
    ],
    faqs: [
      {
        question: "Are business consultants required to be licensed in Oregon?",
        answer: "Oregon does not have a specific license requirement for general business consultants. However, consultants providing specialized services may need appropriate credentials—for example, financial consultants may need securities licenses, and HR consultants should understand employment law. Focus on relevant experience and client references when selecting a consultant.",
      },
      {
        question: "What factors affect the cost of business consulting services?",
        answer: "Consulting costs depend on several factors: consultant experience and expertise, engagement scope and duration, whether work is performed by senior or junior team members, and the pricing model (hourly, project-based, or retainer). Strategy and specialized consulting typically costs more than operational improvement work. Getting a detailed scope of work with deliverables helps you evaluate value.",
      },
      {
        question: "How do I compare business consultants for a project?",
        answer: "Compare business consultants by: reviewing case studies of similar client challenges, checking references from past clients, understanding their methodology and deliverables, comparing pricing models and total engagement cost, and assessing whether they ask good questions about your business during initial conversations. The best consultant combines expertise with genuine interest in your success.",
      },
    ],
  },
  // ============================================================================
  // REAL ESTATE
  // ============================================================================
  {
    slug: "real-estate-agents",
    industrySlug: "real-estate",
    displayName: "Real Estate Agents & Brokers",
    pluralName: "real estate agents and brokers",
    shortDescription: "Licensed real estate professionals helping clients buy, sell, and rent residential and commercial properties.",
    tldr: "Real estate agents and brokers guide clients through buying, selling, or renting property. Agents must be licensed in Oregon. Choose an agent based on local market knowledge, recent transaction experience, communication style, and whether they specialize in your property type.",
    licenseRequired: true,
    licenseAuthority: "Oregon Real Estate Agency",
    licenseUrl: "https://www.oregon.gov/rea",
    matchTerms: ["real estate", "realtor", "realty", "broker", "agent", "property"],
    relatedCategories: ["property-management"],
    sections: [
      {
        sectionId: "agent-services",
        sectionTitle: "What Real Estate Agents Do",
        body: "Real estate agents help clients buy, sell, or rent properties. Seller's agents (listing agents) help set listing price, market the property, host open houses, and negotiate offers. Buyer's agents help clients find properties, schedule showings, draft offers, and navigate inspections and closing. Some agents also handle property management or specialize in commercial real estate.",
        takeaways: [
          "Agents are licensed professionals; brokers have additional training and can supervise agents",
          "Most agents work on commission, paid at closing—typically 5-6% split between buyer and seller agents",
          "Dual agency (representing both buyer and seller) is legal in Oregon but must be disclosed",
          "Agents should provide a comparative market analysis (CMA) to help price a home",
        ],
      },
      {
        sectionId: "choosing-agent",
        sectionTitle: "How to Choose a Real Estate Agent",
        body: "Interview multiple agents before signing a listing agreement or buyer representation agreement. Ask about their recent transactions in your neighborhood, their marketing plan (for sellers), or their approach to finding homes in your criteria (for buyers). Check online reviews and ask for references from past clients. Understand the contract terms, including commission rate and contract duration.",
        takeaways: [
          "Verify Oregon Real Estate Agency license before signing any agreement",
          "Ask how many transactions they closed in the past 12 months",
          "Understand the contract duration and cancellation terms",
          "Check whether they work alone or as part of a team",
        ],
      },
    ],
    faqs: [
      {
        question: "Are real estate agents required to be licensed in Oregon?",
        answer: "Yes, all real estate agents and brokers must be licensed by the Oregon Real Estate Agency. You can verify a license, check for disciplinary actions, and confirm the agent's status through the Oregon Real Estate Agency's license lookup tool at oregon.gov/rea.",
      },
      {
        question: "What factors affect real estate agent commission rates?",
        answer: "Commission rates are negotiable and depend on several factors: local market norms, the agent's services and marketing approach, property price point, and whether you're buying or selling. Some agents offer tiered services at different commission levels. Understanding exactly what services are included at each commission level helps you compare value across agents.",
      },
      {
        question: "How do I compare real estate agents for buying or selling a home?",
        answer: "Compare real estate agents by: verifying Oregon Real Estate Agency license, asking about recent transactions in your specific neighborhood, reviewing their marketing plan (for sellers) or home search approach (for buyers), checking references from past clients, understanding contract terms including commission and duration, and assessing their communication style and responsiveness.",
      },
    ],
  },
  {
    slug: "property-management",
    industrySlug: "real-estate",
    displayName: "Property Management Companies",
    pluralName: "property management companies",
    shortDescription: "Professional property management services for rental properties, handling tenant screening, rent collection, maintenance, and legal compliance.",
    tldr: "Property management companies handle day-to-day operations of rental properties: tenant screening, rent collection, maintenance coordination, and legal compliance. Ideal for absentee owners or those with multiple properties. Compare management fees, services included, and how they handle maintenance and tenant issues.",
    licenseRequired: true,
    licenseAuthority: "Oregon Real Estate Agency",
    licenseUrl: "https://www.oregon.gov/rea",
    matchTerms: ["property management", "property manager", "rental", "property management company"],
    relatedCategories: ["real-estate-agents"],
    sections: [
      {
        sectionId: "management-services",
        sectionTitle: "Property Management Services",
        body: "Property management companies handle the day-to-day operations of rental properties. Services typically include marketing vacancies, screening tenants, collecting rent, coordinating maintenance and repairs, conducting property inspections, handling tenant communications and lease violations, and providing financial reporting to owners. Some also handle evictions and legal compliance with Oregon landlord-tenant laws.",
        takeaways: [
          "Oregon has specific landlord-tenant laws—property managers should be experts",
          "Management fees typically range from 8-12% of collected rent",
          "Lease enforcement and eviction handling are valuable services for absentee owners",
          "Monthly financial statements help owners track income and expenses",
        ],
      },
      {
        sectionId: "choosing-manager",
        sectionTitle: "How to Choose a Property Management Company",
        body: "Verify the property management company's real estate broker license through the Oregon Real Estate Agency. Ask about their fee structure—management fee, leasing fee, renewal fee, and maintenance markup. Understand their tenant screening process and how they handle maintenance calls. Ask for references from other property owners. Check reviews that mention responsiveness and transparency.",
        takeaways: [
          "Verify Oregon Real Estate Agency broker license",
          "Understand all fees: management, leasing, renewals, maintenance markup",
          "Ask about their process for handling after-hours maintenance emergencies",
          "Check how often they inspect properties and what the reports include",
        ],
      },
    ],
    faqs: [
      {
        question: "Are property management companies required to be licensed in Oregon?",
        answer: "Yes, property management companies and the individuals who manage properties must be licensed by the Oregon Real Estate Agency. You can verify a property management company's license through the Oregon Real Estate Agency's website at oregon.gov/rea.",
      },
      {
        question: "What factors affect property management fees?",
        answer: "Property management fees depend on several factors: the number and type of units managed, the services included, the local market, and the company's pricing model. Common fees include a monthly management fee (percentage of rent), a leasing fee (finding new tenants), lease renewal fees, and markups on maintenance work. Getting a clear fee schedule helps you compare companies accurately.",
      },
      {
        question: "How do I compare property management companies for my rental property?",
        answer: "Compare property management companies by: verifying Oregon Real Estate Agency license, getting a complete fee schedule for all services, asking about their tenant screening criteria and process, checking references from other property owners, understanding their maintenance coordination process and any markup on vendor services, and reviewing the management agreement carefully before signing.",
      },
    ],
  },
  // ============================================================================
  // RETAIL & SHOPPING
  // ============================================================================
  {
    slug: "furniture-stores",
    industrySlug: "retail-shopping",
    displayName: "Furniture Stores",
    pluralName: "furniture stores",
    shortDescription: "Retail stores selling home and office furniture, from budget to high-end, including delivery and assembly services.",
    tldr: "Furniture stores sell sofas, beds, tables, and home furnishings. Consider quality, delivery options, return policy, and warranty before buying. Many stores offer financing options and will hold items for later delivery. Measure your space and doorways before shopping.",
    licenseRequired: false,
    matchTerms: ["furniture", "sofa", "couch", "bed", "mattress", "table", "chair", "home furnishings"],
    relatedCategories: ["home-goods", "clothing-boutiques"],
    sections: [
      {
        sectionId: "furniture-shopping",
        sectionTitle: "Furniture Shopping Tips",
        body: "Furniture stores range from budget-friendly chains to high-end showrooms. When shopping, consider construction quality (solid wood vs. particle board), fabric durability, cushion firmness, and dimensions. Many stores offer delivery and assembly services. Ask about lead times for custom orders and whether floor models are available for immediate pickup at a discount.",
        takeaways: [
          "Measure your space, doorways, and elevators before shopping",
          "Ask about delivery fees, assembly services, and white-glove delivery options",
          "Floor models are often discounted but may show wear",
          "Understand the store's return and exchange policy before purchasing",
        ],
      },
      {
        sectionId: "quality-value",
        sectionTitle: "Assessing Quality and Value",
        body: "Furniture quality varies widely. For upholstered furniture, check frame construction (kiln-dried hardwood is best), spring systems, and cushion density. For case goods (tables, dressers), look for dovetail joints and solid wood construction. Many stores offer financing—read the terms carefully, as deferred interest promotions can be costly if not paid in full by the deadline.",
        takeaways: [
          "Sit on sofas and chairs to test comfort and support",
          "Check drawers and doors on case goods for smooth operation",
          "Ask about fabric protection plans and what they cover",
          "Understand warranty coverage for frame, cushions, and fabric",
        ],
      },
    ],
    faqs: [
      {
        question: "Are furniture stores required to be licensed in Oregon?",
        answer: "Oregon does not require specific licensing for furniture retailers. However, businesses must be properly registered and follow consumer protection laws, including accurate advertising and clear return policies. When shopping, focus on store reputation, return policies, and warranty terms rather than licensing.",
      },
      {
        question: "What factors affect furniture pricing?",
        answer: "Furniture prices depend on several factors: materials quality (solid wood vs. engineered wood, leather vs. fabric), construction methods, brand name, and whether items are ready-to-assemble or fully assembled. Custom orders cost more than in-stock items. Delivery distance and assembly requirements also affect total cost. Comparing similar construction and materials across stores helps you assess value.",
      },
      {
        question: "How do I compare furniture stores for a major purchase?",
        answer: "Compare furniture stores by: reading reviews that mention delivery experience and quality over time, understanding return and exchange policies, comparing warranty terms on frames and cushions, asking about delivery fees and timelines, and assessing whether sales staff are knowledgeable about construction and materials rather than just pushing sales.",
      },
    ],
  },
  {
    slug: "home-goods",
    industrySlug: "retail-shopping",
    displayName: "Home Goods & Decor Stores",
    pluralName: "home goods and decor stores",
    shortDescription: "Retail stores specializing in home decor, kitchenware, bedding, lighting, and decorative accessories for every room.",
    tldr: "Home goods stores sell decor, kitchenware, bedding, lighting, and accessories to beautify your home. These stores range from big-box retailers to boutique shops with curated selections. Shop sales for seasonal items and check return policies, especially for opened or used items.",
    licenseRequired: false,
    matchTerms: ["home goods", "home decor", "kitchenware", "bedding", "lighting", "decor", "housewares"],
    relatedCategories: ["furniture-stores", "clothing-boutiques"],
    sections: [
      {
        sectionId: "home-goods-overview",
        sectionTitle: "What Home Goods Stores Offer",
        body: "Home goods stores sell non-furniture items for the home. This includes decor (wall art, vases, candles), kitchenware (cookware, dinnerware, gadgets), bedding and bath (sheets, towels, shower curtains), lighting (lamps, fixtures), and organizational products. Some stores specialize in specific categories like kitchenware or lighting, while others offer a broad selection.",
        takeaways: [
          "Big-box home goods stores often have the best prices on basics",
          "Boutique home goods stores offer more curated, unique selections",
          "Seasonal sections change throughout the year—shop off-season for deals",
          "Registry completion discounts can save 10-15% after an event",
        ],
      },
      {
        sectionId: "smart-shopping",
        sectionTitle: "Smart Home Goods Shopping",
        body: "Before shopping, measure spaces and note existing colors and styles in your home. Check return policies—some stores have different policies for opened or used items. Sign up for store emails to learn about sales; home goods stores frequently run promotions. For larger purchases, ask about price matching or negotiating, especially at independently owned stores.",
        takeaways: [
          "Take photos of your space and color swatches when shopping",
          "Check whether the store offers price adjustments if an item goes on sale soon after purchase",
          "Ask about scratch-and-dent sections for discounts on display items",
          "Understand the return window and whether receipts are required",
        ],
      },
    ],
    faqs: [
      {
        question: "Are home goods stores regulated in Oregon?",
        answer: "Home goods stores, like other retailers, must follow Oregon consumer protection laws, including accurate pricing, clear return policies, and truthful advertising. Oregon does not require specific licensing for home goods retail. Focus on store reputation, return policies, and product quality when choosing where to shop.",
      },
      {
        question: "What factors should I consider when comparing home goods stores?",
        answer: "When comparing home goods stores, consider several factors: product selection and uniqueness, pricing and frequency of sales, return and exchange policies, store layout and shopping experience, and whether they offer services like gift registry or design consultation. Reading reviews that mention product quality over time helps you identify stores that carry durable items.",
      },
      {
        question: "How do I get the best value when shopping for home goods?",
        answer: "To get the best value, shop sales and clearance events, compare prices across stores for identical or similar items, check for price matching policies, consider off-season shopping for seasonal items, and sign up for store loyalty programs. For larger purchases, ask about bulk discounts or negotiating room, especially at independently owned stores.",
      },
    ],
  },
  // ============================================================================
  // HEALTH & WELLNESS
  // ============================================================================
  {
    slug: "massage-therapy",
    industrySlug: "health-wellness",
    displayName: "Massage Therapists",
    pluralName: "massage therapists",
    shortDescription: "Licensed massage therapists providing therapeutic and relaxation massage for pain relief, stress reduction, and wellness.",
    tldr: "Massage therapists provide therapeutic touch for relaxation, pain relief, and wellness. Oregon licenses massage therapists through the Oregon Board of Massage Therapists. Discuss your goals and any health conditions before the session. Regular massage can help manage stress and muscle tension.",
    licenseRequired: true,
    licenseAuthority: "Oregon Board of Massage Therapists",
    licenseUrl: "https://www.oregon.gov/obmt",
    matchTerms: ["massage", "massage therapist", "bodywork", "therapeutic massage", "swedish", "deep tissue"],
    relatedCategories: ["wellness-centers"],
    sections: [
      {
        sectionId: "massage-benefits",
        sectionTitle: "Benefits of Massage Therapy",
        body: "Massage therapy offers both physical and mental health benefits. Common massage styles include Swedish (relaxation), deep tissue (targeted muscle work), sports massage (for athletes), and trigger point therapy (for specific pain points). Regular massage can reduce muscle tension, improve circulation, promote relaxation, and support recovery from injuries or strenuous activity.",
        takeaways: [
          "Communicate with your therapist about pressure, areas of focus, and comfort",
          "Drink water after massage to help flush metabolic waste",
          "Some soreness after deep tissue massage is normal and temporary",
          "Regular massage provides cumulative benefits for stress and muscle tension",
        ],
      },
      {
        sectionId: "choosing-therapist",
        sectionTitle: "How to Choose a Massage Therapist",
        body: "Verify the massage therapist's license through the Oregon Board of Massage Therapists. Consider their specialties—some focus on relaxation, others on injury rehabilitation or sports massage. Read reviews that mention the therapist's technique, communication, and professionalism. During your first visit, discuss your goals and any health conditions that might affect the massage.",
        takeaways: [
          "Verify Oregon Board of Massage Therapists license before booking",
          "Ask about the therapist's training and areas of specialization",
          "Check whether the therapist takes insurance (some health plans cover massage with a prescription)",
          "Understand cancellation policy—most therapists charge for late cancellations",
        ],
      },
    ],
    faqs: [
      {
        question: "Are massage therapists required to be licensed in Oregon?",
        answer: "Yes, massage therapists in Oregon must be licensed by the Oregon Board of Massage Therapists. You can verify a therapist's license, check for any disciplinary actions, and confirm their education and training through the Board's website at oregon.gov/obmt.",
      },
      {
        question: "What factors affect the cost of massage therapy?",
        answer: "Massage therapy costs depend on several factors: session length (60 vs. 90 vs. 120 minutes), the therapist's experience and training, whether you visit a spa, clinic, or mobile therapist, and your location. Some therapists offer package pricing for multiple sessions. Checking whether your health insurance covers massage (with a prescription) can reduce out-of-pocket costs.",
      },
      {
        question: "How do I compare massage therapists for regular sessions?",
        answer: "Compare massage therapists by: verifying Oregon Board of Massage Therapists license, reading reviews that mention technique and professionalism, asking about their training and specialties, checking whether they offer package pricing for regular clients, and assessing communication style during your first session. The right therapist combines skill with making you feel comfortable and heard.",
      },
    ],
  },
  {
    slug: "wellness-centers",
    industrySlug: "health-wellness",
    displayName: "Wellness Centers",
    pluralName: "wellness centers",
    shortDescription: "Holistic wellness centers offering combined services like massage, acupuncture, nutrition counseling, and mind-body practices.",
    tldr: "Wellness centers offer integrated health services under one roof—often combining massage, acupuncture, nutrition counseling, yoga, and other wellness modalities. These centers focus on whole-person health. Check practitioner licensing and ask about package deals if using multiple services.",
    licenseRequired: false,
    matchTerms: ["wellness center", "wellness", "holistic", "integrative", "health center"],
    relatedCategories: ["massage-therapy"],
    sections: [
      {
        sectionId: "wellness-services",
        sectionTitle: "Wellness Center Services",
        body: "Wellness centers take a holistic approach to health, often offering multiple services in one location. Common offerings include massage therapy, acupuncture, nutrition counseling, yoga or movement classes, meditation instruction, and sometimes conventional medical services like primary care or functional medicine. The integrated approach allows practitioners to collaborate on your care.",
        takeaways: [
          "Integrated care means practitioners can coordinate your treatment plan",
          "Wellness centers often offer package pricing across services",
          "Ask about practitioner qualifications—licensing requirements vary by service type",
          "Some wellness centers accept health insurance for covered services",
        ],
      },
      {
        sectionId: "choosing-wellness-center",
        sectionTitle: "How to Choose a Wellness Center",
        body: "Research the practitioners at the center—verify licenses for services that require them (massage, acupuncture, nutrition counseling). Read reviews that mention the specific services you're interested in. Ask whether practitioners communicate with each other about your care. Check pricing for packages if you plan to use multiple services. Visit the center to assess cleanliness, atmosphere, and whether you feel comfortable there.",
        takeaways: [
          "Verify licensing for each practitioner type you plan to see",
          "Ask about package deals if using multiple services regularly",
          "Check whether the center accepts insurance for any covered services",
          "Understand scheduling—some centers book practitioners independently, others coordinate",
        ],
      },
    ],
    faqs: [
      {
        question: "Are wellness centers regulated in Oregon?",
        answer: "Wellness centers themselves are not licensed as a single entity in Oregon. However, individual practitioners must hold appropriate licenses for their services—massage therapists through the Oregon Board of Massage Therapists, acupuncturists through the Oregon Health Authority, and so on. When choosing a wellness center, verify the licensing of each practitioner you plan to see.",
      },
      {
        question: "What factors affect the cost of wellness center services?",
        answer: "Wellness center service costs depend on the type of service, practitioner experience, session length, and whether you purchase individual sessions or packages. Many centers offer package pricing that reduces the per-session cost. Some services may be covered by health insurance (check with your provider), and some centers offer sliding scale pricing.",
      },
      {
        question: "How do I compare wellness centers for integrated care?",
        answer: "Compare wellness centers by: verifying that all practitioners hold appropriate licenses, reading reviews that mention coordination between practitioners, asking about package pricing for multiple services, checking whether they accept insurance for covered services, assessing the center's atmosphere and cleanliness, and understanding their approach to integrated, whole-person care.",
      },
    ],
  },
  // ============================================================================
  // LEGAL SERVICES
  // ============================================================================
  {
    slug: "general-practice-law",
    industrySlug: "legal-services",
    displayName: "General Practice Attorneys",
    pluralName: "general practice attorneys",
    shortDescription: "Attorneys handling a broad range of legal matters for individuals and small businesses, from contracts to basic litigation.",
    tldr: "General practice attorneys handle various legal matters including contracts, estate planning, real estate transactions, and some litigation. They're a good starting point for common legal needs. For specialized matters, they may refer you to a specialist. Verify licensing through the Oregon State Bar.",
    licenseRequired: true,
    licenseAuthority: "Oregon State Bar",
    licenseUrl: "https://www.osbar.org",
    matchTerms: ["attorney", "lawyer", "general practice", "legal services", "law office"],
    relatedCategories: ["family-law", "business-law"],
    sections: [
      {
        sectionId: "general-practice-services",
        sectionTitle: "What General Practice Attorneys Handle",
        body: "General practice attorneys handle a variety of legal matters for individuals and small businesses. Common services include contract drafting and review, estate planning (wills and trusts), real estate transactions, small business formation, basic litigation, and legal advice on everyday matters. For complex or specialized issues, general practice attorneys may refer clients to specialists.",
        takeaways: [
          "General practice attorneys are a good first stop for common legal needs",
          "They can often handle multiple legal matters for the same client",
          "For specialized issues (complex litigation, patent law), specialists are appropriate",
          "Ask about their experience with your specific legal issue during consultation",
        ],
      },
      {
        sectionId: "choosing-attorney",
        sectionTitle: "How to Choose a General Practice Attorney",
        body: "Verify the attorney's license through the Oregon State Bar. Schedule a consultation to discuss your legal matter—many attorneys offer initial consultations at reduced rates or for free. Ask about their experience with similar cases, their approach to communication, and their fee structure. Check reviews and ask for references from past clients with similar legal needs.",
        takeaways: [
          "Verify Oregon State Bar license before hiring",
          "Ask about fee structure: hourly, flat fee, or contingency (for some cases)",
          "Understand what's included in the fee and what costs extra (filing fees, etc.)",
          "Check communication expectations: how often will they update you on your case?",
        ],
      },
    ],
    faqs: [
      {
        question: "Are attorneys required to be licensed in Oregon?",
        answer: "Yes, all attorneys practicing in Oregon must be licensed by the Oregon State Bar. You can verify an attorney's license status, check for disciplinary actions, and confirm their standing through the Oregon State Bar's lawyer directory at osbar.org.",
      },
      {
        question: "What factors affect the cost of legal services?",
        answer: "Legal service costs depend on several factors: the attorney's experience level, the complexity and time required for your matter, geographic location, and the fee structure (hourly, flat fee, or contingency). Estate planning and simple contracts often have flat fees; litigation is typically billed hourly. Getting a fee agreement in writing before work begins helps avoid surprises.",
      },
      {
        question: "How do I compare attorneys for my legal matter?",
        answer: "Compare attorneys by: verifying Oregon State Bar license and checking for disciplinary actions, scheduling consultations to discuss your matter, asking about their experience with similar cases, understanding their fee structure and getting it in writing, checking references from past clients, and assessing whether you feel comfortable discussing your legal matter with them.",
      },
    ],
  },
  {
    slug: "family-law",
    industrySlug: "legal-services",
    displayName: "Family Law Attorneys",
    pluralName: "family law attorneys",
    shortDescription: "Legal services for family matters including divorce, child custody, adoption, and domestic partnerships.",
    tldr: "Family law attorneys handle divorce, child custody, support, adoption, and domestic partnership matters. These cases are often emotional—choose an attorney who combines legal skill with compassion and clear communication. Verify licensing through the Oregon State Bar and ask about their approach to negotiation vs. litigation.",
    licenseRequired: true,
    licenseAuthority: "Oregon State Bar",
    licenseUrl: "https://www.osbar.org",
    matchTerms: ["family law", "divorce", "child custody", "adoption", "domestic relations", "custody"],
    relatedCategories: ["general-practice-law", "estate-planning"],
    sections: [
      {
        sectionId: "family-law-services",
        sectionTitle: "Family Law Services",
        body: "Family law attorneys handle legal matters involving family relationships. This includes divorce and legal separation, child custody and parenting time, child and spousal support, adoption, paternity establishment, domestic violence restraining orders, and division of assets and debts. Some family law attorneys also handle prenuptial and postnuptial agreements.",
        takeaways: [
          "Oregon is a 'no-fault' divorce state—fault doesn't affect property division",
          "Mediation is often required before going to trial in contested custody cases",
          "Child support is calculated using state guidelines based on income and parenting time",
          "Adoption processes vary significantly based on type (agency, stepparent, international)",
        ],
      },
      {
        sectionId: "choosing-family-law-attorney",
        sectionTitle: "How to Choose a Family Law Attorney",
        body: "Family law cases are often emotionally challenging. Choose an attorney who communicates clearly, explains your options, and helps you make informed decisions. Ask about their approach to negotiation versus litigation—some attorneys are aggressive litigators, others focus on collaborative approaches. Check reviews that mention communication style and outcomes. During consultation, assess whether you feel heard and supported.",
        takeaways: [
          "Verify Oregon State Bar license and any family law certification",
          "Ask about their approach: collaborative, mediation-focused, or litigation-focused",
          "Understand fee structure and whether they require a retainer",
          "Ask about their caseload—overloaded attorneys may be less responsive",
        ],
      },
    ],
    faqs: [
      {
        question: "Are family law attorneys required to be licensed in Oregon?",
        answer: "Yes, family law attorneys must be licensed by the Oregon State Bar. You can verify an attorney's license and check for disciplinary history through the Oregon State Bar's lawyer directory at osbar.org.",
      },
      {
        question: "What factors affect the cost of family law services?",
        answer: "Family law costs depend on several factors: whether the case is uncontested or contested, the complexity of assets and custody issues, the level of conflict between parties, attorney experience, and whether the case goes to trial. Uncontested divorces with agreement cost far less than contested custody battles. Understanding the fee structure and getting cost estimates for different scenarios helps you plan.",
      },
      {
        question: "How do I compare family law attorneys for my case?",
        answer: "Compare family law attorneys by: verifying Oregon State Bar license, scheduling consultations with multiple attorneys, asking about their approach to negotiation vs. litigation, checking reviews that mention communication and outcomes in similar cases, understanding fee structure and retainer requirements, and assessing whether you feel the attorney listens to your concerns and explains options clearly.",
      },
    ],
  },
  {
    slug: "business-law",
    industrySlug: "legal-services",
    displayName: "Business & Corporate Attorneys",
    pluralName: "business and corporate attorneys",
    shortDescription: "Legal services for businesses including formation, contracts, employment law, mergers and acquisitions, and regulatory compliance.",
    tldr: "Business attorneys help with business formation, contracts, employment law, regulatory compliance, and transactions. Some work with startups, others with established companies. Choose an attorney with experience in your industry and business size. Verify licensing through the Oregon State Bar.",
    licenseRequired: true,
    licenseAuthority: "Oregon State Bar",
    licenseUrl: "https://www.osbar.org",
    matchTerms: ["business attorney", "corporate", "business law", "contracts", "employment law", "mergers"],
    relatedCategories: ["general-practice-law", "estate-planning"],
    sections: [
      {
        sectionId: "business-law-services",
        sectionTitle: "Business Law Services",
        body: "Business attorneys provide legal services to companies at all stages. For startups: business formation (LLC, corporation, partnership), founder agreements, and initial contracts. For established businesses: contract drafting and negotiation, employment law compliance, commercial leases, mergers and acquisitions, intellectual property protection, and regulatory compliance. Some business attorneys also handle business disputes and litigation.",
        takeaways: [
          "Choosing the right business entity affects taxes, liability, and management structure",
          "Well-drafted contracts prevent costly disputes later",
          "Employment law compliance is complex—get advice before hiring",
          "Some attorneys offer general counsel services on a retainer basis",
        ],
      },
      {
        sectionId: "choosing-business-attorney",
        sectionTitle: "How to Choose a Business Attorney",
        body: "Look for attorneys with experience in your industry and with businesses your size. Ask about their experience with matters similar to yours (formation, contracts, employment issues). Understand their fee structure—some charge hourly, others offer flat fees for routine matters, and some work on retainer for ongoing counsel. Check whether they can handle your needs as your business grows or whether you'll need to switch attorneys later.",
        takeaways: [
          "Verify Oregon State Bar license before hiring",
          "Ask for client references from similar-sized businesses in your industry",
          "Understand fee structure: hourly, flat fee, or retainer",
          "Check whether they have relationships with other professionals (CPAs, business consultants)",
        ],
      },
    ],
    faqs: [
      {
        question: "Are business attorneys required to be licensed in Oregon?",
        answer: "Yes, business attorneys must be licensed by the Oregon State Bar. You can verify an attorney's license and check for any disciplinary actions through the Oregon State Bar's lawyer directory at osbar.org.",
      },
      {
        question: "What factors affect the cost of business legal services?",
        answer: "Business legal service costs depend on several factors: the attorney's experience, the complexity of the matter, whether it's a one-time service (formation, contract review) or ongoing counsel, geographic location, and the fee structure. Routine services like business formation often have flat fees; complex matters like mergers or litigation are typically billed hourly. Getting a fee agreement in writing helps you budget.",
      },
      {
        question: "How do I compare business attorneys for my company?",
        answer: "Compare business attorneys by: verifying Oregon State Bar license, asking about experience with businesses your size and in your industry, understanding their fee structure for both routine and complex matters, checking references from business owner clients, assessing whether they ask good questions about your business goals, and determining whether they can grow with your company's needs.",
      },
    ],
  },
  {
    slug: "estate-planning",
    industrySlug: "legal-services",
    displayName: "Estate Planning Attorneys",
    pluralName: "estate planning attorneys",
    shortDescription: "Legal services for estate planning including wills, trusts, powers of attorney, and probate administration.",
    tldr: "Estate planning attorneys help you plan for the future with wills, trusts, powers of attorney, and advance directives. Good estate planning avoids probate, minimizes taxes, and ensures your wishes are followed. Choose an attorney who explains options clearly and updates plans as laws change.",
    licenseRequired: true,
    licenseAuthority: "Oregon State Bar",
    licenseUrl: "https://www.osbar.org",
    matchTerms: ["estate planning", "will", "trust", "probate", "power of attorney", "advance directive", "living will"],
    relatedCategories: ["family-law", "general-practice-law"],
    sections: [
      {
        sectionId: "estate-planning-services",
        sectionTitle: "Estate Planning Services",
        body: "Estate planning attorneys help you create legal documents that protect your assets and ensure your wishes are followed. Core documents include wills (distribute assets after death), revocable living trusts (avoid probate and provide privacy), durable powers of attorney (financial decisions if you're incapacitated), advance directives (healthcare decisions), and beneficiary designations. Some attorneys also handle probate administration after death.",
        takeaways: [
          "Revocable living trusts avoid probate and provide privacy—wills go through public probate",
          "Powers of attorney and advance directives are essential even if you're young and healthy",
          "Beneficiary designations on accounts override wills—keep them updated",
          "Estate plans should be reviewed every 3-5 years or after major life events",
        ],
      },
      {
        sectionId: "choosing-estate-attorney",
        sectionTitle: "How to Choose an Estate Planning Attorney",
        body: "Estate planning is both legal and personal. Choose an attorney who takes time to understand your family situation, explains options in plain language, and doesn't push unnecessary documents. Ask about their experience with Oregon-specific laws (Oregon has unique probate and trust laws). Check whether they offer plan reviews periodically to keep documents current with law changes.",
        takeaways: [
          "Verify Oregon State Bar license before hiring",
          "Ask whether they focus primarily on estate planning or do it as a small part of general practice",
          "Understand fee structure—estate planning is often flat-fee, not hourly",
          "Ask about plan review frequency and whether updates are included in initial fee",
        ],
      },
    ],
    faqs: [
      {
        question: "Are estate planning attorneys required to be licensed in Oregon?",
        answer: "Yes, estate planning attorneys must be licensed by the Oregon State Bar. You can verify an attorney's license and check for disciplinary actions through the Oregon State Bar's lawyer directory at osbar.org.",
      },
      {
        question: "What factors affect the cost of estate planning?",
        answer: "Estate planning costs depend on several factors: the complexity of your situation (size of estate, blended family, business ownership), which documents you need, the attorney's experience, and whether you choose a will-based or trust-based plan. Basic will packages cost less than comprehensive trust-based plans. Getting a flat-fee quote for your specific situation helps you compare.",
      },
      {
        question: "How do I compare estate planning attorneys for my family?",
        answer: "Compare estate planning attorneys by: verifying Oregon State Bar license, asking what documents they recommend for your situation and why, understanding whether they charge flat fees or hourly, asking about plan review and update policies, checking whether they explain options clearly (not just using legal jargon), and assessing whether you feel comfortable discussing personal family and financial matters with them.",
      },
    ],
  },
  // ============================================================================
  // SPORTS & FITNESS
  // ============================================================================
  {
    slug: "gyms-fitness",
    industrySlug: "sports-fitness",
    displayName: "Gyms & Fitness Centers",
    pluralName: "gyms and fitness centers",
    shortDescription: "Full-service gyms and fitness centers with cardio and strength equipment, group classes, and personal training services.",
    tldr: "Gyms and fitness centers provide equipment and space for workouts, plus group classes and personal training. Consider location, hours, cleanliness, equipment condition, and contract terms. Try a day pass before committing to a membership. Ask about initiation fees and cancellation policies.",
    licenseRequired: false,
    matchTerms: ["gym", "fitness center", "athletic club", "workout", "training", "health club"],
    relatedCategories: ["sports-clubs"],
    sections: [
      {
        sectionId: "gym-services",
        sectionTitle: "Gym and Fitness Center Services",
        body: "Gyms and fitness centers offer various amenities. Basic gyms provide cardio machines (treadmills, ellipticals, bikes) and strength equipment (free weights, machines). Full-service fitness centers add group fitness classes (yoga, cycling, HIIT), personal training, swimming pools, basketball courts, and locker room amenities. Some cater to specific audiences (women-only, 24-hour access, family-friendly).",
        takeaways: [
          "Try a day pass or guest pass before signing a membership",
          "Check peak hours—crowded gyms reduce workout quality and equipment access",
          "Cleanliness of locker rooms and equipment matters for health and comfort",
          "Personal training can jumpstart your fitness but adds significant cost",
        ],
      },
      {
        sectionId: "choosing-gym",
        sectionTitle: "How to Choose a Gym or Fitness Center",
        body: "Visit gyms at the time you plan to work out—see how crowded they are. Check equipment condition and availability. Ask about membership options: month-to-month vs. annual contract, initiation fees, and cancellation policies. Consider location and hours—a convenient gym gets used more. Read the contract carefully before signing; some gyms have automatic renewal clauses and difficult cancellation processes.",
        takeaways: [
          "Visit during your intended workout time to assess crowding",
          "Ask about all fees: initiation, annual, cancellation, and freeze fees",
          "Check contract terms carefully—some require notarized cancellation letters",
          "Consider proximity to home or work—convenience drives consistency",
        ],
      },
    ],
    faqs: [
      {
        question: "Are gyms and fitness centers required to be licensed in Oregon?",
        answer: "Oregon does not require specific licensing for gyms and fitness centers. However, businesses must be properly registered and follow health and safety regulations, including cleanliness standards. When choosing a gym, focus on equipment condition, cleanliness, contract terms, and whether members speak positively about their experience.",
      },
      {
        question: "What factors affect the cost of gym memberships?",
        answer: "Gym membership costs depend on several factors: type of facility (basic gym vs. full-service athletic club), membership type (month-to-month vs. annual contract), location, and any initiation or annual fees. Many gyms offer promotional rates for new members. Understanding all fees and the total contract cost helps you compare memberships accurately.",
      },
      {
        question: "How do I compare gyms for a membership?",
        answer: "Compare gyms by: visiting during your planned workout times, checking equipment condition and availability, understanding all fees and contract terms (especially cancellation), assessing cleanliness of workout areas and locker rooms, asking about guest pass policies, and considering location convenience. A gym you enjoy visiting and can easily get to is the gym you'll actually use.",
      },
    ],
  },
  {
    slug: "personal-training",
    industrySlug: "sports-fitness",
    displayName: "Personal Trainers",
    pluralName: "personal trainers",
    shortDescription: "Certified personal trainers providing customized fitness programs, technique instruction, and motivation for individual fitness goals.",
    tldr: "Personal trainers create customized workout plans, teach proper exercise technique, and provide motivation and accountability. Look for nationally recognized certifications (NASM, ACE, ACSM). Ask about their experience with your goals (weight loss, strength, rehabilitation) and whether they offer packages or sessions à la carte.",
    licenseRequired: false,
    matchTerms: ["personal trainer", "training", "fitness coach", "strength training", "workout coach"],
    relatedCategories: ["gyms-fitness"],
    sections: [
      {
        sectionId: "training-benefits",
        sectionTitle: "Benefits of Personal Training",
        body: "Personal trainers provide customized workout programs based on your goals, fitness level, and any limitations. They teach proper exercise technique, which reduces injury risk and improves results. Trainers also provide accountability and motivation. Some specialize in specific areas: weight loss, strength training, post-rehabilitation, sports-specific training, or senior fitness.",
        takeaways: [
          "Proper form is critical—trainers prevent injuries from bad technique",
          "Trainers can modify exercises for injuries or limitations",
          "Accountability and motivation are major benefits, especially early in a fitness journey",
          "Some trainers offer small group training at lower per-person cost",
        ],
      },
      {
        sectionId: "choosing-trainer",
        sectionTitle: "How to Choose a Personal Trainer",
        body: "Verify the trainer holds a nationally recognized certification (NASM, ACE, ACSM, NSCA). Ask about their experience with clients similar to you (age, fitness level, goals). Schedule a consultation or trial session to assess communication style and whether you feel comfortable. Ask about session packages (buying in bulk often reduces per-session cost) and scheduling flexibility.",
        takeaways: [
          "Check for nationally recognized certification—not all certifications are equal",
          "Ask about liability insurance coverage",
          "Trial sessions help assess trainer-client fit before committing",
          "Understand cancellation policy for scheduled sessions",
        ],
      },
    ],
    faqs: [
      {
        question: "Are personal trainers required to be certified in Oregon?",
        answer: "Oregon does not require state licensing or certification for personal trainers. However, reputable trainers hold nationally recognized certifications (NASM, ACE, ACSM, NSCA) and carry liability insurance. When choosing a trainer, ask about their certification, experience, and whether they maintain continuing education.",
      },
      {
        question: "What factors affect the cost of personal training?",
        answer: "Personal training costs depend on several factors: trainer experience and certification level, session length, location (gym vs. in-home vs. virtual), whether you buy individual sessions or packages, and your geographic area. Package purchases typically reduce per-session cost. Some trainers offer semi-private sessions (small groups) at lower per-person rates.",
      },
      {
        question: "How do I compare personal trainers for my fitness goals?",
        answer: "Compare personal trainers by: verifying nationally recognized certification, asking about their experience with clients who have similar goals, scheduling a consultation or trial session, understanding pricing for individual vs. package sessions, checking scheduling availability and cancellation policy, and assessing whether you feel motivated and comfortable with their communication style.",
      },
    ],
  },
  {
    slug: "sports-clubs",
    industrySlug: "sports-fitness",
    displayName: "Sports Clubs & Recreation Centers",
    pluralName: "sports clubs and recreation centers",
    shortDescription: "Sports clubs and recreation centers offering organized sports, courts, fields, and recreational activities for all ages.",
    tldr: "Sports clubs and recreation centers provide facilities and programs for organized sports, recreational activities, and community fitness. Offerings vary widely: tennis clubs, rock climbing gyms, soccer clubs, recreation centers with courts and fields. Check membership options, program schedules, and facility quality.",
    licenseRequired: false,
    matchTerms: ["sports club", "recreation", "tennis", "climbing", "soccer", "athletic", "sports"],
    relatedCategories: ["gyms-fitness", "personal-training"],
    sections: [
      {
        sectionId: "sports-club-types",
        sectionTitle: "Types of Sports Clubs and Recreation Centers",
        body: "Sports clubs focus on specific sports or activities. Tennis clubs offer courts, lessons, and leagues. Rock climbing gyms provide climbing walls, bouldering areas, and instruction. Soccer and other sports clubs offer youth and adult leagues, practices, and facilities. Community recreation centers provide broader programming: courts, pools, fitness classes, and youth and senior programs. Some are membership-based; others are drop-in or program-based.",
        takeaways: [
          "Youth sports clubs often require commitment for a full season",
          "Adult recreational leagues are a great way to meet people and stay active",
          "Climbing gyms offer introductory lessons and equipment rental",
          "Recreation centers often offer sliding scale fees for residents",
        ],
      },
      {
        sectionId: "choosing-sports-club",
        sectionTitle: "How to Choose a Sports Club or Recreation Center",
        body: "Identify your primary activity and look for clubs that specialize in it. Visit the facility to check condition of courts, fields, or equipment. Ask about membership vs. drop-in options. For youth sports, ask about coach qualifications, practice frequency, and time commitment. Read reviews that mention facility maintenance, program quality, and staff friendliness.",
        takeaways: [
          "Try a drop-in session or day pass before committing to membership",
          "Ask about equipment rental if you don't own your own gear",
          "Check league schedules and whether they fit your availability",
          "For youth programs, ask about parent involvement expectations",
        ],
      },
    ],
    faqs: [
      {
        question: "Are sports clubs and recreation centers regulated in Oregon?",
        answer: "Oregon does not have specific licensing for sports clubs and recreation centers. However, businesses must be properly registered and follow safety regulations. For activities with higher injury risk (climbing, contact sports), check whether the facility carries appropriate insurance and follows safety protocols. For youth programs, ask about background checks for coaches and staff.",
      },
      {
        question: "What factors affect the cost of sports club memberships or programs?",
        answer: "Sports club costs depend on several factors: type of sport or activity, membership vs. program enrollment, age (youth vs. adult), whether equipment is included or rented, and facility type (nonprofit community center vs. for-profit club). Seasonal sports programs often have set fees per season; year-round clubs may offer monthly or annual memberships.",
      },
      {
        question: "How do I compare sports clubs for my family?",
        answer: "Compare sports clubs by: visiting the facility to check cleanliness and equipment condition, understanding all costs (membership, program fees, equipment, uniforms), reading reviews from other families, asking about coach qualifications and background checks for youth programs, checking schedule flexibility and makeup policies for missed sessions, and assessing whether the environment feels welcoming and supportive.",
      },
    ],
  },
  // ============================================================================
  // TRAVEL & HOSPITALITY
  // ============================================================================
  {
    slug: "hotels-lodging",
    industrySlug: "travel-hospitality",
    displayName: "Hotels & Lodging",
    pluralName: "hotels and lodging",
    shortDescription: "Hotels, motels, bed & breakfasts, and vacation rentals providing overnight accommodations for travelers and visitors.",
    tldr: "Hotels and lodging options range from budget motels to luxury hotels and charming B&Bs. Consider location, amenities, recent reviews, and cancellation policies when booking. For extended stays, look for suites with kitchenettes. Book directly or compare third-party sites for the best rates.",
    licenseRequired: false,
    matchTerms: ["hotel", "motel", "lodging", "inn", "bed and breakfast", "B&B", "resort", "accommodation"],
    relatedCategories: [],
    sections: [
      {
        sectionId: "lodging-types",
        sectionTitle: "Types of Lodging Accommodations",
        body: "Lodging options cater to different travel styles and budgets. Hotels offer standardized amenities: front desk, daily housekeeping, on-site dining, and fitness centers. Motels provide basic accommodations with exterior entrances, often at lower price points. Bed & breakfasts offer personalized service and breakfast in historic or charming settings. Vacation rentals (through platforms or local management) provide home-like amenities for longer stays.",
        takeaways: [
          "Hotel loyalty programs offer perks: free nights, upgrades, late checkout",
          "B&Bs offer personalized experience but less privacy and fewer amenities",
          "Vacation rentals work well for families or extended stays needing kitchens",
          "Read recent reviews—hotel condition and service quality change over time",
        ],
      },
      {
        sectionId: "choosing-lodging",
        sectionTitle: "How to Choose Lodging",
        body: "Start by identifying your priorities: location, price, amenities, or experience type. Read recent reviews (within the past 6 months) that mention cleanliness, noise levels, and staff helpfulness. Compare prices across booking platforms and the hotel's direct website—direct booking sometimes offers perks or price matching. Check cancellation policies, especially for uncertain travel plans.",
        takeaways: [
          "Book directly with hotels for best cancellation flexibility and potential upgrades",
          "Check parking costs—some city hotels charge significant daily fees",
          "For B&Bs, ask about private vs. shared bathrooms and house rules",
          "Understand resort fees—some properties add mandatory daily fees not included in the room rate",
        ],
      },
    ],
    faqs: [
      {
        question: "Are hotels and lodging establishments regulated in Oregon?",
        answer: "Oregon does not require specific licensing for hotels and lodging establishments at the state level, but local jurisdictions may have permits and regulations. Hotels must follow general business regulations and health and safety codes. When choosing lodging, focus on recent reviews, cleanliness ratings, and cancellation policies rather than licensing.",
      },
      {
        question: "What factors affect hotel and lodging costs?",
        answer: "Lodging costs depend on several factors: location (downtown vs. suburban, proximity to attractions), season and local events, hotel brand and rating level, room type and view, and how far in advance you book. Additional costs may include parking, resort fees, and taxes. Comparing total cost including all fees gives the most accurate price comparison.",
      },
      {
        question: "How do I compare hotels for a stay?",
        answer: "Compare hotels by: reading recent reviews focusing on cleanliness and service, comparing total cost including all fees and taxes, checking location relative to your planned activities, understanding cancellation and modification policies, verifying amenities that matter to you (Wi-Fi, breakfast, parking, pet policy), and checking whether booking directly offers benefits over third-party sites.",
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
