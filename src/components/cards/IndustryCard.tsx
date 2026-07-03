import { ArrowRight } from "lucide-react";
import * as Icons from "lucide-react";
import type { Industry } from "@/data/industries";
import { getBusinesses } from "@/data/businesses";

const countBadgeBase =
  "absolute top-4 right-4 text-xs font-medium px-2 py-1 rounded-full";
type Props = { industry: Industry; citySlug: string };

export const IndustryCard = ({ industry, citySlug }: Props) => {
  const Icon =
    (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[industry.icon] ??
    Icons.Circle;
  const businesses = getBusinesses(citySlug, industry.slug);
  const count = businesses.length;
  return (
    <a
      href={`/city/${citySlug}/${industry.slug}`}
      className="group bg-card border border-border hover:border-[var(--c-sage)] rounded-lg p-6 cursor-pointer hover:shadow-elegant hover:-translate-y-1 transition-all duration-300 block relative min-h-[44px]"
      style={{ borderRadius: "var(--radius-md)" }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${industry.iconBg} ${industry.iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-serif font-semibold text-lg mb-1 text-foreground group-hover:text-[var(--c-river)] transition-colors">
            {industry.name}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{industry.description}</p>
        </div>
      </div>
      {count > 0 && (
        <div className={countBadgeBase} style={{ backgroundColor: "var(--c-sky)", color: "var(--c-pine)" }}>
          {count} listings →
        </div>
      )}
    </a>
  );
};

export default IndustryCard;
