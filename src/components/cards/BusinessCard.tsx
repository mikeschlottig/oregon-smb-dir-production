import { ExternalLink, MapPin, Phone, Star } from "lucide-react";
import { getBusinessPathSlug, type Business } from "@/data/businesses";

type Props = {
  business: Business;
  citySlug: string;
  industrySlug: string;
};

export const BusinessCard = ({ business, citySlug, industrySlug }: Props) => (
  <article className="bg-card border border-border rounded-xl p-6 hover:shadow-elegant hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
    <div className="flex items-start justify-between gap-3 mb-2">
      <h3 className="font-serif text-lg font-semibold text-foreground leading-tight">
        <a
          href={`/city/${citySlug}/${industrySlug}/${getBusinessPathSlug(citySlug, industrySlug, business)}`}
          className="hover:text-accent transition-colors"
        >
          {business.title}
        </a>
      </h3>
      {typeof business.rating === "number" && (
        <div className="flex-shrink-0 flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-xs font-medium">
          <Star className="w-3 h-3 fill-gold text-gold" />
          <span>{business.rating.toFixed(1)}</span>
          {business.reviews ? (
            <span className="text-muted-foreground">({business.reviews})</span>
          ) : null}
        </div>
      )}
    </div>

    {business.category && (
      <p className="text-xs uppercase tracking-wider text-accent mb-3">{business.category}</p>
    )}

    <div className="space-y-2 text-sm text-muted-foreground flex-1">
      {business.address && (
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
          <span>{business.address}</span>
        </div>
      )}
      {business.phone && (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 flex-shrink-0 text-accent" />
          <a href={`tel:${business.phone}`} className="hover:text-foreground transition-colors">
            {business.phone}
          </a>
        </div>
      )}
    </div>

    <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-border">
      <a
        href={`/city/${citySlug}/${industrySlug}/${getBusinessPathSlug(citySlug, industrySlug, business)}`}
        className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-2 rounded hover:bg-primary/90 transition-colors"
      >
        View details
      </a>
      {business.website && (
        <a
          href={business.website}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 border border-border text-xs font-medium px-3 py-2 rounded hover:bg-muted transition-colors"
        >
          Website <ExternalLink className="w-3 h-3" />
        </a>
      )}
      {business.googleUrl && (
        <a
          href={business.googleUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 border border-border text-xs font-medium px-3 py-2 rounded hover:bg-muted transition-colors"
        >
          Maps <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  </article>
);

export default BusinessCard;
