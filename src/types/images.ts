// A city photo prepared at build time by astro:assets: a default WebP URL plus a srcset.
// Built server-side (src/lib/city-card-images.ts) and passed into CityCard as a prop, because
// CityCard is a React component and cannot call getImage itself.
export type CardImage = {
  src: string;
  srcSet: string;
};
