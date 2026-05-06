import { ArrowRight } from "lucide-react";
import * as Icons from "lucide-react";
import type { Industry } from "@/data/industries";
import { hasBusinesses } from "@/data/businesses";

type Props = { industry: Industry; citySlug: string };

export const IndustryCard = ({ industry, citySlug }: Props) => {
  const Icon =
    (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[industry.icon] ??
    Icons.Circle;
  const hasData = hasBusinesses(citySlug, industry.slug);
  return (
    <a
      href={`/city/${citySlug}/${industry.slug}`}
      className="group bg-card border border-border rounded-xl p-6 cursor-pointer hover:shadow-elegant hover:-translate-y-1 transition-all duration-300 block relative"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${industry.iconBg} ${industry.iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
      <h3 className="font-serif font-semibold text-lg mb-1.5 text-foreground group-hover:text-primary transition-colors">
        {industry.name}
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{industry.description}</p>
      {hasData && (
        <span className="absolute top-4 right-14 text-[10px] uppercase tracking-wider bg-gold/30 text-foreground px-2 py-0.5 rounded-full font-medium">
          Listings
        </span>
      )}
    </a>
  );
};

export default IndustryCard;
