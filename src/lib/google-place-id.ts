// Google place identity, both forms, and the official link built from it. No path aliases and
// only erasable TypeScript: Node imports this file directly (scripts, tests).
//
// A place ID ("ChIJ…") is base64url protobuf:  0a 12 | 09 <hi fixed64 LE> | 11 <lo fixed64 LE>.
// The two fixed64 values are the halves of the feature ID "0x<hi>:0x<lo>" that /maps/place/
// URLs carry. Verified on four live pairs (listings-extraction run p10-3, 2026-09-24), e.g.
// ChIJZ1Zzyzwg6GcRcn-fRTAHw6s  <->  0x67e8203ccb735667:0xabc30730459f7f72 (Deepli Clean).

import { parseFeatureId, parsePlaceId, type FeatureId, type PlaceId } from "../types/ids.ts";

const FEATURE_ID = /(0x[0-9a-f]+):(0x[0-9a-f]+)/i;

const b64urlToBytes = (s: string): Uint8Array | null => {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
};

const bytesToB64url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const readU64LE = (b: Uint8Array, at: number): bigint => {
  let v = 0n;
  for (let i = 7; i >= 0; i--) v = (v << 8n) | BigInt(b[at + i]);
  return v;
};

const writeU64LE = (v: bigint, out: Uint8Array, at: number): void => {
  for (let i = 0; i < 8; i++) {
    out[at + i] = Number(v & 0xffn);
    v >>= 8n;
  }
};

export const placeIdToFeatureId = (placeId?: string | null): FeatureId | null => {
  if (!placeId?.startsWith("ChIJ")) return null;
  const b = b64urlToBytes(placeId);
  if (!b || b.length < 20 || b[0] !== 0x0a || b[1] !== 0x12 || b[2] !== 0x09 || b[11] !== 0x11) return null;
  return parseFeatureId(`0x${readU64LE(b, 3).toString(16)}:0x${readU64LE(b, 12).toString(16)}`);
};

export const featureIdToPlaceId = (featureId?: string | null): PlaceId | null => {
  const m = featureId?.match(FEATURE_ID);
  if (!m) return null;
  const out = new Uint8Array(20);
  out.set([0x0a, 0x12, 0x09], 0);
  writeU64LE(BigInt(m[1]), out, 3);
  out[11] = 0x11;
  writeU64LE(BigInt(m[2]), out, 12);
  return parsePlaceId(bytesToB64url(out));
};

/** The place ID a Google Maps URL identifies: its query_place_id, else its feature ID encoded. */
export const placeIdOf = (url?: string | null): PlaceId | null => {
  if (!url) return null;
  const q = url.match(/[?&]query_place_id=(ChIJ[\w-]+)/);
  // A place ID in a link must decode, or it is not one (a typo or an invented value).
  if (q) return placeIdToFeatureId(q[1]) ? parsePlaceId(q[1]) : null;
  const fids = [...url.matchAll(/0x[0-9a-f]+:0x[0-9a-f]+/gi)];
  return fids.length ? featureIdToPlaceId(fids[fids.length - 1][0]) : null;
};

/** The feature ID a Google Maps URL identifies: its last 0x…:0x…, else its query_place_id decoded. */
export const featureIdOf = (url?: string | null): FeatureId | null => {
  if (!url) return null;
  const fids = [...url.matchAll(/0x[0-9a-f]+:0x[0-9a-f]+/gi)];
  if (fids.length) return parseFeatureId(fids[fids.length - 1][0]);
  const q = url.match(/[?&]query_place_id=(ChIJ[\w-]+)/);
  return q ? placeIdToFeatureId(q[1]) : null;
};

/**
 * Google's documented Maps URLs API link to one place: opens that business's listing. Stable —
 * no viewport, search context or session tokens — unlike a copied /maps/place/…/@lat,lng URL.
 */
export const placeLink = (name: string, url?: string | null): string | null => {
  const placeId = placeIdOf(url);
  return placeId
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${placeId}`
    : null;
};
