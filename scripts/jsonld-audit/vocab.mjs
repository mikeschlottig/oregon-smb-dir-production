// schema.org vocabulary layer: is this a real type, is this property defined for it (by
// inheritance), is the value the kind of thing the property expects (rangeIncludes), and is
// anything deprecated or still pending. Built from the pinned release in vocab/ — see
// fetch-vocab.mjs. The Adobe validator checks the domain but not the range ("TODO: Add
// property types"), which is where most misconfigured fields live, so this owns both.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const strip = (id) => String(id).replace(/^(schema:|https?:\/\/schema\.org\/)/, "");
const ids = (v) => (v == null ? [] : [].concat(v).map((x) => strip(x["@id"] ?? x)));

const raw = JSON.parse(readFileSync(path.join(here, "vocab", "schemaorg-current-https.jsonld"), "utf8"));
export const VOCAB_VERSION = readFileSync(path.join(here, "vocab", "VERSION"), "utf8").split("\n")[0];

const classes = new Map(); // name -> { parents, pending, supersededBy, enumeration members }
const props = new Map(); // name -> { domains, ranges, pending, supersededBy }
const members = new Map(); // enumeration member name -> enumeration types

for (const node of raw["@graph"]) {
  const types = [].concat(node["@type"]);
  const name = strip(node["@id"]);
  const pending = ids(node["schema:isPartOf"]).some((p) => p.includes("pending"));
  const supersededBy = ids(node["schema:supersededBy"])[0] ?? null;
  if (types.includes("rdfs:Class")) {
    classes.set(name, { parents: ids(node["rdfs:subClassOf"]), pending, supersededBy });
  } else if (types.includes("rdf:Property")) {
    props.set(name, {
      domains: ids(node["schema:domainIncludes"]),
      ranges: ids(node["schema:rangeIncludes"]),
      pending,
      supersededBy,
    });
  } else {
    // Enumeration members are typed by their enumeration (e.g. schema:DayOfWeek).
    for (const t of types) {
      const tn = strip(t);
      if (tn !== t || t.startsWith("schema:")) {
        members.set(name, [...(members.get(name) ?? []), tn]);
      }
    }
  }
}

const ancestorCache = new Map();
export const ancestors = (type) => {
  if (ancestorCache.has(type)) return ancestorCache.get(type);
  const out = new Set([type]);
  for (const p of classes.get(type)?.parents ?? []) for (const a of ancestors(p)) out.add(a);
  ancestorCache.set(type, out);
  return out;
};

export const isType = (type) => classes.has(type);
export const isSubtypeOf = (type, parent) => ancestors(type).has(parent);
export const anySubtypeOf = (types, parent) => [].concat(types).some((t) => isSubtypeOf(t, parent));
export const typeInfo = (type) => classes.get(type) ?? null;
export const propInfo = (prop) => props.get(prop) ?? null;

/** Is `prop` defined for `type` (directly or through any ancestor)? */
export const propertyAllowed = (type, prop) => {
  const p = props.get(prop);
  if (!p) return false;
  const anc = ancestors(type);
  return p.domains.some((d) => anc.has(d));
};

// Data types and what a JSON value of each kind can satisfy. URL is a subclass of Text, so a
// string always satisfies a Text-ranged property; the stricter checks below run only when a
// property accepts nothing looser than URL / Date / DateTime / Number.
const DATATYPES = new Set(["Text", "URL", "Number", "Integer", "Float", "Boolean", "Date", "DateTime", "Time", "CssSelectorType", "XPathType", "PronounceableText"]);
const TEXTY = new Set(["Text", "URL", "CssSelectorType", "XPathType", "PronounceableText"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;

const rangeClassesAccept = (ranges, valueTypes) =>
  valueTypes.some((vt) => ranges.some((r) => !DATATYPES.has(r) && isSubtypeOf(vt, r)));

/**
 * Checks one value against a property's rangeIncludes. Returns null when it fits, or
 * { severity, message } when it does not.
 */
export const checkRange = (prop, value) => {
  const p = props.get(prop);
  if (!p || !p.ranges.length) return null;
  const r = p.ranges;
  const has = (t) => r.includes(t);

  if (typeof value === "string") {
    if (r.some((t) => TEXTY.has(t))) {
      if (!has("Text") && has("URL") && !r.some((t) => !DATATYPES.has(t))) {
        return /^(https?:)?\/\/|^\/|^[a-z]+:/i.test(value)
          ? null
          : { severity: "WARNING", message: `"${prop}" expects a URL; got "${value.slice(0, 60)}"` };
      }
      return null;
    }
    if (has("DateTime") || has("Date") || has("Time")) {
      if ((has("Date") && ISO_DATE.test(value)) || (has("DateTime") && (ISO_DATETIME.test(value) || ISO_DATE.test(value))) || has("Time")) return null;
      return { severity: "WARNING", message: `"${prop}" expects an ISO 8601 ${has("DateTime") ? "DateTime" : "Date"}; got "${value}"` };
    }
    if (has("Number") || has("Integer") || has("Float")) {
      return Number.isFinite(Number(value))
        ? { severity: "INFO", message: `"${prop}" is a number sent as a string ("${value}")` }
        : { severity: "WARNING", message: `"${prop}" expects a Number; got "${value.slice(0, 60)}"` };
    }
    if (has("Boolean")) return { severity: "WARNING", message: `"${prop}" expects a Boolean; got a string` };
    // Enumeration member written as a string (e.g. "https://schema.org/Monday").
    const enumTypes = members.get(strip(value));
    if (enumTypes && rangeClassesAccept(r, enumTypes)) return null;
    // An absolute URL where an entity is expected is an IRI reference to that entity —
    // Google's own BreadcrumbList example writes "item": "https://example.com/books".
    if (/^https?:\/\/\S+$/.test(value)) return null;
    return {
      severity: "WARNING",
      message: `"${prop}" expects ${r.join(" | ")}; got a text string`,
    };
  }
  if (typeof value === "number") {
    if (has("Number") || has("Integer") || has("Float")) return null;
    return { severity: "WARNING", message: `"${prop}" expects ${r.join(" | ")}; got a number` };
  }
  if (typeof value === "boolean") {
    return has("Boolean") ? null : { severity: "WARNING", message: `"${prop}" expects ${r.join(" | ")}; got a boolean` };
  }
  if (value && typeof value === "object") {
    const t = value["@type"];
    if (!t) {
      // A bare reference ({"@id": ...}) is fine; an untyped object is not.
      return value["@id"] && Object.keys(value).length === 1
        ? null
        : { severity: "WARNING", message: `"${prop}" holds an object with no @type` };
    }
    const vt = [].concat(t);
    if (rangeClassesAccept(r, vt)) return null;
    return { severity: "WARNING", message: `"${prop}" expects ${r.join(" | ")}; got ${vt.join("+")}` };
  }
  return null;
};

/** Every property whose rangeIncludes has a class matching `pred` (by the vocabulary's own hierarchy). */
export const propertiesWithRange = (pred) =>
  [...props.entries()].filter(([, p]) => p.ranges.some((r) => classes.has(r) && pred(r))).map(([name]) => name).sort();

export const vocabStats = () => ({ classes: classes.size, properties: props.size, members: members.size });
