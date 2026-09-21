import { ArrowRight, MapPin } from "lucide-react";
import type { City } from "@/data/cities";

export const CityCard = ({ city }: { city: City }) => (
  <a
    href={`/city/${city.slug}`}
    className="group relative rounded-xl overflow-hidden cursor-pointer shadow-soft hover:shadow-elegant transition-all duration-500 hover:-translate-y-1 bg-card block"
  >
    <div className="relative h-56 overflow-hidden bg-muted">
      <img
        src={city.image.src}
        alt={city.name}
        loading="lazy"
        width={800}
        height={600}
        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
      <div className="absolute bottom-3 left-3 right-3">
        <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full border border-white/20">
          {city.population} residents
        </span>
      </div>
    </div>
    <div className="p-5">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-serif font-bold text-xl text-foreground group-hover:text-primary transition-colors">
            {city.name}
          </h3>
          <div className="flex items-center gap-1 text-accent text-xs mt-0.5">
            <MapPin className="w-3 h-3" />
            <span>{city.tagline}</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{city.description}</p>
    </div>
  </a>
);

export default CityCard;
