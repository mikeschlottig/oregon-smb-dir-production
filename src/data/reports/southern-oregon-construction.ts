import type { ReportSection } from "@/data/content";

export const southernOregonConstructionSections: ReportSection[] = [
  {
    id: "executive-summary",
    label: "Executive Summary",
    title: "Strategic Landscape & Key Findings",
    blocks: [
      {
        type: "lede",
        text: "The construction industry in Southern Oregon — anchored by the Medford–Ashland–Grants Pass MSA — is operating in a high-pressure environment of acute housing demand and supportive legislative shifts. Despite inflationary pressure and elevated borrowing costs, the regional market is positioned for sustained high volume through 2030.",
      },
      {
        type: "p",
        text: "Success in this competitive sector hinges less on market opportunity and more on operational excellence and financial dexterity. General contractors must attain superior profitability — specifically a Gross Profit Margin (GPM) above the top-quartile benchmark of 21.8% — and maintain a Quick Ratio above 1.4 to manage tight capital access and protracted payment cycles.",
      },
      {
        type: "p",
        text: "The competitive landscape is bifurcated. Large institutional and commercial work is dominated by regional firms with capacity for high-value public works, healthcare, and industrial projects (S+B James, Andersen Construction). Local and mid-sized contractors drive the high-volume residential, remodeling, and restoration segments expanding under HB 2001 density mandates.",
      },
      {
        type: "callout",
        tone: "primary",
        title: "The bottom line",
        text: "Cost modeling shows Southern Oregon residential and commercial construction now sits at parity with the Portland metro — material volatility and skilled-labor scarcity have neutralized the historical regional cost advantage.",
      },
      {
        type: "table",
        caption: "Table 1 — Strategic Market Summary (2025 Outlook)",
        headers: ["Indicator", "Southern Oregon trend", "Driving factors"],
        rows: [
          ["Project volume", "High, sustained growth forecast", "41% population growth since 2000; HB 2001 density policy"],
          ["Cost volatility", "Elevated / persistent", "Inflation in lumber, steel, cement; labor shortages"],
          ["Capital access", "Constrained", "Higher borrowing costs; cautious developers"],
          ["Key focus area", "Middle housing & infrastructure", "Regulatory expansion of middle housing; federal infra funding"],
        ],
      },
    ],
  },
  {
    id: "regional-economy",
    label: "Economy & Regulation",
    title: "Regional Economic & Regulatory Environment",
    blocks: [
      { type: "h3", text: "Population growth & housing demand catalysts" },
      {
        type: "p",
        text: "Oregon's long-term housing deficit is fueling one of the most active building cycles in recent history. The state's population is projected to reach 4.83M by 2030 and 5.43M by 2040, translating directly into accelerated demand for residential and essential commercial real estate.",
      },
      {
        type: "p",
        text: "HB 2001 mandated that larger cities permit duplexes, triplexes, townhomes, and cottage clusters — maximizing land use and improving project viability by distributing infrastructure costs across multiple units. HB 2138 (2025) is poised to extend middle-housing allowances into unincorporated urban areas, while SB 1537 (2024) supports housing production by expanding urban growth boundaries.",
      },
      {
        type: "callout",
        tone: "accent",
        title: "Strategic pivot required",
        text: "GCs limited to traditional single-family custom homes face share erosion. The winners will develop core competencies in multi-family construction management and complex urban infill site logistics.",
      },
      { type: "h3", text: "Macroeconomic headwinds & inflationary pressure" },
      {
        type: "p",
        text: "Cost volatility in lumber, steel, aluminum, and cement remains a persistent threat to project margins. Developers are responding with tighter procurement and intensive value engineering. Elevated borrowing costs particularly impact private multi-family and mixed-use feasibility — pushing developers to refine scopes, extend timelines, and seek non-traditional capital.",
      },
      {
        type: "p",
        text: "Federal infrastructure investments provide a vital counter-cyclical revenue stream — supporting highway, bridge, transit, and broadband projects across Oregon and stabilizing backlog for GCs capable of bidding on large public contracts.",
      },
      { type: "h3", text: "Labor market & workforce stability" },
      {
        type: "p",
        text: "The Pacific Northwest workforce pipeline faces structural shortages. Average annual construction salary in the Medford MSA is approximately $100,926, with estimators earning $115K–$130K and heavy civil workers averaging $104,488. Firms are responding through expanded apprenticeships and adoption of labor-offsetting technology.",
      },
      { type: "h3", text: "Capital availability & financing landscape" },
      {
        type: "p",
        text: "Rogue Valley developers report widespread difficulty securing financing. Combined with slow local approvals, pre-construction risk is elevated — funneling viable projects toward GCs with established banking relationships and integrated design-build models that reduce client risk.",
      },
    ],
  },
  {
    id: "cost-margins",
    label: "Cost & Margins",
    title: "Comparative Project Cost Modeling and Margins",
    blocks: [
      { type: "h3", text: "Financial structure & target margins" },
      {
        type: "p",
        text: "Top-quartile industry performers, as benchmarked by the CFMA, achieve a Gross Profit Margin of 21.8% of total revenue. While GPM measures efficiency before fixed operating expenses, Net Profit Margin is the definitive measure of overall company health.",
      },
      { type: "h3", text: "Residential cost analysis (per square foot)" },
      {
        type: "p",
        text: "Hard costs in Oregon typically run $175–$300+ per square foot. A standard 2,000 sq ft home averages $350K–$600K to construct, with total project cost commonly $500K–$700K excluding land. Portland metro hard costs hover near $200/sf with a +3.3% YoY increase as of Q2 2025 — Southern Oregon remains firmly within the high end of the state average.",
      },
      { type: "h3", text: "Commercial cost analysis by method" },
      {
        type: "table",
        caption: "Commercial shell construction cost ranges, May 2025",
        headers: ["Construction method", "Total cost ($/sf)"],
        rows: [
          ["Metal stud frame", "$80 – $300"],
          ["Pre-engineered metal building (PEMB)", "$75 – $295"],
          ["Structural steel", "$105 – $330"],
          ["Tilt-up concrete", "$140 – $375"],
        ],
      },
      {
        type: "p",
        text: "Estimates cover building shell, foundation, and construction — excluding interior build-out. Specialists in PEMB and structural steel can deliver cost-sensitive projects (warehousing, light industrial) at the lower end of the regional benchmark.",
      },
      {
        type: "table",
        caption: "Table 2 — Construction cost & margin benchmarks",
        headers: ["Metric", "Oregon average", "Top-tier benchmark"],
        rows: [
          ["Residential hard cost ($/sf)", "$175 – $300+", "Minimize via Cost Variance control"],
          ["Commercial shell cost ($/sf)", "Low $200s – low $300s", "Efficient PEMB / structural steel"],
          ["Gross Profit Margin (GPM)", "Varies (target 15%+)", ">21.8% of total revenue"],
          ["Portland Cost Index YoY", "Regional inflation proxy", "+3.3% (Q2 2025)"],
          ["Avg GC salary, Medford", "$100,926", "—"],
        ],
      },
    ],
  },
  {
    id: "kpis",
    label: "Performance KPIs",
    title: "Key Indicators for Growth & Stability",
    blocks: [
      { type: "h3", text: "Critical financial KPIs" },
      {
        type: "list",
        items: [
          "Gross & Net Profit Margin — foundational metrics; GPM must be robust enough to absorb increasing indirect costs and external volatility.",
          "Working Capital — current assets minus current liabilities; reflects capacity to fund payroll and material procurement while awaiting client payments.",
          "Quick Ratio (Acid-Test) — (Current Assets − Inventory) / Current Liabilities; benchmark ~1.4. Demonstrates liquidity without liquidating illiquid materials.",
          "Days in Accounts Receivable (DAR) — average days to collect. Above 30 signals an impending cash-flow crunch.",
        ],
      },
      { type: "h3", text: "Operational & project efficiency KPIs" },
      {
        type: "list",
        items: [
          "Cost Variance (CV) — deviation between estimated and actual project costs; preserves GPM from overrun erosion.",
          "Rework Rate & Cost of Rework — financial and time burden of post-construction defect correction.",
          "Labor Productivity — planned hours vs actual; paramount given chronic Southern Oregon labor shortages.",
        ],
      },
      { type: "h3", text: "Safety & client satisfaction KPIs" },
      {
        type: "list",
        items: [
          "Safety Incident Rate (SIR) & Lost Time Injury Frequency Rate (LTIFR) — strong records reduce insurance premiums and prevent labor downtime; often a pre-qualification mandate for institutional contracts.",
          "Client Satisfaction — surveys, referral rates, punch-list completion efficiency. The primary precursor to repeat business.",
        ],
      },
      {
        type: "table",
        caption: "Table 3 — Predictive KPIs for GC growth",
        headers: ["Category", "KPI", "Benchmark", "Southern Oregon relevance"],
        rows: [
          ["Liquidity", "Quick Ratio", ">1.4", "Mitigates Rogue Valley lending tightness & delayed payments"],
          ["Cash flow", "Days in A/R", "<30 days", "Rapid collection essential in high-cost, volatile market"],
          ["Profitability", "Gross Profit Margin", ">21.8%", "Disciplined procurement & value engineering"],
          ["Efficiency", "Cost Variance", "<5% deviation", "Estimating accuracy protects GPM"],
          ["Risk", "Safety Incident Rate", "Target 0", "Lowers overhead & prevents schedule slippage"],
        ],
      },
    ],
  },
  {
    id: "top-25-contractors",
    label: "Top 25 Contractors",
    title: "Vetted Top 25 General Contractors — Southern Oregon",
    blocks: [
      {
        type: "p",
        text: "Selection emphasizes operational diversity, project scale, regional reputation, and longevity. The core inclusion requirement is capacity to perform a variety of construction types — framing, roofing, painting, and general contracting — across residential, commercial, remodeling, and restoration projects. Single-trade specialists are excluded.",
      },
      {
        type: "table",
        caption: "Table 4 — Top 25 General Contractors (vetted for diversity)",
        headers: ["Rank", "Contractor", "Primary location", "Diversity focus", "Inferred scale"],
        rows: [
          ["1", "S+B James Construction", "Medford", "Commercial, industrial, medical, multi-family", "Large regional"],
          ["2", "Andersen Construction", "Portland (regional)", "Institutional, healthcare, education", "Mega regional"],
          ["3", "Hoffman Construction", "Portland (statewide)", "Commercial, institutional, public works", "Mega regional"],
          ["4", "Outlier Construction", "Medford", "General building, reputation/quality", "Medium-large local"],
          ["5", "Mahar Homes, Inc.", "Medford", "High-volume new residential", "Large local"],
          ["6", "Holt Homes", "Medford (regional)", "High-volume new residential", "Large regional"],
          ["7", "Ben The Builder Inc", "Ashland", "Custom new build, remodels, design-build", "Medium local"],
          ["8", "Ashland Remodeling / Stokes Built", "Ashland", "Residential & commercial remodel, restoration", "Medium local"],
          ["9", "Scott Wells Construction", "Medford", "General contractor, diverse projects", "Medium local"],
          ["10", "Buntin Construction", "Medford", "General contractor", "Medium local"],
          ["11", "Southridge Builders LLC", "Medford", "New homes, remodels, restoration", "Medium local"],
          ["12", "Rispoli Design & Build", "Medford", "Design-build, new homes, modernization", "Medium local"],
          ["13", "Jon Turrell Quality Homes", "Ashland", "Custom builder, designer, remodeler", "Medium local"],
          ["14", "Riverline Construction LLC", "Central Point", "General contractor (BASO member)", "Small-medium local"],
          ["15", "Rock Solid Remodeling", "Wilderville", "Remodel, structural updates", "Small-medium local"],
          ["16", "Van Wey Homes, LLC", "Medford", "New home construction", "Small-medium local"],
          ["17", "Applegate Rogue Building Co.", "Jacksonville", "Custom residential", "Small-medium local"],
          ["18", "Riverdell Construction, Inc.", "Central Point", "General contractor", "Small-medium local"],
          ["19", "Z Development LLC", "Jacksonville", "Innovative home remodel", "Small-medium local"],
          ["20", "Galpin Homes LLC", "Medford", "Custom home building", "Small-medium local"],
          ["21", "Tom Tobey Design & Build", "Murphy", "Design & build, residential GC", "Small-medium local"],
          ["22", "McLennan Builders Inc.", "Brookings", "General contractor (coastal)", "Small-medium local"],
          ["23", "Doug Backman Construction", "Coquille", "General contractor (coastal)", "Small-medium local"],
          ["24", "Knouff, Inc.", "Central Point", "General contractor", "Small-medium local"],
          ["25", "Brian Magel Construction", "Eagle Point", "General contractor", "Small-medium local"],
        ],
      },
      {
        type: "callout",
        tone: "primary",
        title: "Licensing & verification mandate",
        text: "Anyone paid to repair, improve, or build a structure in Oregon must be licensed by the Construction Contractors Board (CCB). Verify active license status — including up to 10 years of disciplinary actions and complaints — via the DCBS public lookup or CCB directly before signing any contract.",
      },
    ],
  },
  {
    id: "recommendations",
    label: "Recommendations",
    title: "Conclusions & Strategic Recommendations",
    blocks: [
      {
        type: "p",
        text: "The Southern Oregon construction market offers significant growth driven by demographic trends and density-friendly legislation. Sustained success, however, depends on a contractor's ability to transcend market volatility through superior financial and operational discipline.",
      },
      {
        type: "numbered",
        items: [
          "Profitability and liquidity are non-negotiable. GPM above 21.8% and Quick Ratio above 1.4 are crucial survival metrics for withstanding payment delays and material price shocks.",
          "The shift to density demands new expertise. State housing policy is reshaping core competency — winning firms will master multi-unit, complex urban infill, and mixed-use HB 2001 projects.",
          "Cost control through value engineering. With per-square-foot costs at parity with Portland MSA, GCs integrating preconstruction services and aggressive value engineering gain a decisive advantage.",
          "Competitive advantage favors integrated models. Difficulty securing construction loans and navigating Rogue Valley permitting favors GCs offering vertically-integrated design-build services that absorb pre-construction risk.",
        ],
      },
      {
        type: "callout",
        tone: "accent",
        title: "Final note",
        text: "The vetted Top 25 represent firms with the capacity, track record, and diversity to thrive in this high-demand, high-risk climate. For any engagement, thorough verification of CCB licensing and recent performance history is strongly recommended.",
      },
    ],
  },
];