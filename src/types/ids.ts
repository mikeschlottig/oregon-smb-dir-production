// Identifier types for the directory. Every ID the site keys on is a branded string: the
// compiler refuses a bare string where an ID is expected, so the only way to get one is
// through its parser, which checks the shape. Names and meanings: docs/TAXONOMY.md.
//
// Why this exists (2026-09-24): a place ID copied from a synthetic test fixture was hard-coded
// into Daley Organics' Maps link. As a plain `string` it type-checked; it pointed nowhere.
// No path aliases and only erasable TypeScript here — Node imports this file directly.

declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

/** Google feature ID, the place's identity in /maps/place/ URLs: "0x<hex>:0x<hex>", lower case. */
export type FeatureId = Brand<string, "FeatureId">;
/** Google place ID, the Places API / Maps URLs API identity: "ChIJ…", base64url. */
export type PlaceId = Brand<string, "PlaceId">;
/** Google CID: the decimal of a feature ID's second half ("ludocid"). */
export type Cid = Brand<string, "Cid">;
/** A listing's URL segment, unique within its shard. */
export type BusinessSlug = Brand<string, "BusinessSlug">;
/** A data shard: "<citySlug>__<industrySlug>". */
export type ShardKey = Brand<string, "ShardKey">;

const FEATURE_ID_RE = /^0x[0-9a-f]{1,16}:0x[0-9a-f]{1,16}$/;
// A feature ID encodes to exactly 20 bytes → 27 base64url characters, always starting "ChIJ".
const PLACE_ID_RE = /^ChIJ[A-Za-z0-9_-]{23}$/;

export const parseFeatureId = (s: string | null | undefined): FeatureId | null => {
  const v = s?.trim().toLowerCase();
  return v && FEATURE_ID_RE.test(v) ? (v as FeatureId) : null;
};

/** Shape check only. Use placeIdToFeatureId (src/lib/google-place-id.ts) to prove it decodes. */
export const parsePlaceId = (s: string | null | undefined): PlaceId | null => {
  const v = s?.trim();
  return v && PLACE_ID_RE.test(v) ? (v as PlaceId) : null;
};

export const parseShardKey = (s: string): ShardKey | null =>
  /^[a-z0-9-]+__[a-z0-9-]+$/.test(s) ? (s as ShardKey) : null;
