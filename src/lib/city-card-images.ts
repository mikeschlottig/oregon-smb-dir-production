// Server-only (build time). Responsive WebP versions of every city photo for CityCard.
// Before this, CityCard rendered city.image.src — the untouched original — on every card.
import { getImage } from "astro:assets";
import { cities } from "@/data/cities";
import type { CardImage } from "@/types/images";

const CARD_WIDTHS = [400, 640, 800];

let cache: Promise<Readonly<Record<string, CardImage>>> | undefined;

async function build(): Promise<Readonly<Record<string, CardImage>>> {
  const entries = await Promise.all(
    cities.map(async (city): Promise<[string, CardImage]> => {
      const widths = CARD_WIDTHS.filter((w) => w <= city.image.width);
      const image = await getImage({
        src: city.image,
        widths: widths.length ? widths : [city.image.width],
        format: "webp",
      });
      return [city.slug, { src: image.src, srcSet: image.srcSet.attribute }];
    }),
  );
  return Object.fromEntries(entries);
}

/** Keyed by city slug. Computed once per build and shared by every page that renders cards. */
export function cityCardImages(): Promise<Readonly<Record<string, CardImage>>> {
  cache ??= build();
  return cache;
}
