import { ExternalLink, MapPin, Phone, Star, BadgeCheck } from "lucide-react";
import { getBusinessPathSlug, type Business } from "@/data/businesses";

type Props = {
  business: Business;
  citySlug: string;
  industrySlug: string;
};

// Get initials from business title
const getInitials = (title: string): string => {
  return title
    .split(" ")
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();
};

export const BusinessCard = ({ business, citySlug, industrySlug }: Props) => {
  const isTopRated = typeof business.rating === "number" && business.rating >= 4.8;
  const initials = getInitials(business.title);
  const businessPath = `/city/${citySlug}/${industrySlug}/${getBusinessPathSlug(citySlug, industrySlug, business)}`;

  return (
    <article className="bg-white border rounded-lg p-6 hover:shadow-lg hover:border-[var(--c-sage)] transition-all duration-300 flex flex-col group" style={{ borderColor: 'var(--c-border)' }}>
      {/* Top row: Icon + Name + Rating */}
      <div className="flex items-start gap-4 mb-4">
        {/* Icon/Logo slot */}
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm" style={{ backgroundColor: 'var(--c-sky)' }}>
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-lg font-semibold leading-tight" style={{ color: 'var(--c-pine)' }}>
              <a href={businessPath} className="hover:opacity-80 transition-opacity">
                {business.title}
              </a>
            </h3>
            {isTopRated && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--c-copper-lt)', color: 'var(--c-pine)' }}>
                <BadgeCheck className="w-3 h-3" /> Top Rated
              </span>
            )}
          </div>
          {business.category && (
            <p className="text-xs uppercase tracking-wider mt-1" style={{ color: 'var(--c-copper)' }}>
              {business.category}
            </p>
          )}
        </div>
      </div>

      {/* Rating row with JetBrains Mono for numbers */}
      {typeof business.rating === "number" && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-current" style={{ color: 'var(--c-copper)' }} />
            <span className="font-mono font-semibold text-base" style={{ color: 'var(--c-pine)' }}>
              {business.rating.toFixed(1)}
            </span>
          </div>
          {typeof business.reviews === "number" && (
            <span className="font-mono text-sm" style={{ color: 'var(--c-sage)' }}>
              ({business.reviews.toLocaleString()} reviews)
            </span>
          )}
        </div>
      )}

    {business.category && (
      <p className="text-xs uppercase tracking-wider text-accent mb-3">{business.category}</p>
    )}

      {/* Address */}
      {business.address && (
        <div className="flex items-start gap-2 text-sm mb-4" style={{ color: 'var(--c-pine)' }}>
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--c-sage)' }} />
          <span>{business.address}</span>
        </div>
      )}

      {/* Spacer to push buttons to bottom */}
      <div className="flex-1" />

      {/* Action buttons - min 44px touch targets */}
      <div className="flex flex-wrap gap-2 pt-4 border-t" style={{ borderColor: 'var(--c-border)' }}>
        <a
          href={businessPath}
          className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-medium rounded transition-colors"
          style={{ backgroundColor: 'var(--c-river)', color: 'white' }}
        >
          View Details
        </a>
        {business.website && (
          <a
            href={business.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 text-sm font-medium border rounded hover:opacity-80 transition-opacity"
            style={{ borderColor: 'var(--c-border)', color: 'var(--c-pine)' }}
          >
            Website <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        {business.googleUrl && (
          <a
            href={business.googleUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 text-sm font-medium border rounded hover:opacity-80 transition-opacity"
            style={{ borderColor: 'var(--c-border)', color: 'var(--c-pine)' }}
          >
            Maps <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </article>
  );
};

export default BusinessCard;
