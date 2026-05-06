const items = [
  "Oregon's Premier Business Directory",
  "The #1 Resource for Businesses, Residents & Travelers",
  "Northwest I-5 Corridor",
  "Ashland to Portland Metro",
  "12 Cities · 12 Industries · Thousands of Businesses",
  "Find Local Services Along the I-5",
];

export const MarqueeBanner = () => {
  const doubled = [...items, ...items];
  return (
    <section id="scroll-banner" className="bg-primary py-3.5 overflow-hidden border-y border-primary/20">
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-3 text-primary-foreground/90 text-sm font-medium tracking-wide mr-3"
          >
            {item}
            <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
          </span>
        ))}
      </div>
    </section>
  );
};

export default MarqueeBanner;
