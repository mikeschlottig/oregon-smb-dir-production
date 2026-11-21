// Build-time index of business names used by more than one listing (P19, 2026-11-21). A listing's <title> may fall
// back to the bare business name only when no other listing has that name; otherwise "Name, City" keeps titles
// unique (three Berkshire Hathaway offices shared one title when the bare name was always allowed).
import { cities } from "@/data/cities";
import { industries } from "@/data/industries";
import { getBusinesses } from "@/data/businesses";

let counts: Map<string, number> | undefined;

export function isSharedName(name: string): boolean {
  if (!counts) {
    counts = new Map();
    for (const c of cities) for (const i of industries) for (const b of getBusinesses(c.slug, i.slug)) {
      const k = b.title.trim().toLowerCase();
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }
  return (counts.get(name.trim().toLowerCase()) ?? 0) > 1;
}
