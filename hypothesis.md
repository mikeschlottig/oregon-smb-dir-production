# hypothesis.md — Oregon SMB Directory repair

Loop: think → analyze → act → observe → reason → document → proceed.
Prediction goes in **before** the command runs. Result is pasted, not paraphrased.

---

## H1 — `breadcrumbSchema` emits a shape Google rejects

**Prediction:** `src/lib/schema.ts:149` builds `itemListElement[].item` as
`{"@type":"WebPage","name":…,"url":…}` with no `@id`. Google's BreadcrumbList spec requires
`item` to be a URL string or an object with `@id`; `url` alone is not the identifier. So
every page on the site emits a BreadcrumbList that fails the Rich Results Test.

**Status:** code read, not yet validated against a validator.
**Evidence so far:** `src/lib/schema.ts:149-168` — item object has `name` + `url`, no `@id`.

---

## H2 — Visible trail and JSON-LD trail are produced independently, so they drift

**Prediction:** pages build a `breadcrumbItems` array for `breadcrumbSchema(...)` and a
separate `breadcrumb={[…]}` prop for `TldrCard`. Two hand-maintained lists per page means
at least one page where they disagree.

**Evidence so far:** both patterns present in the same files, e.g.
`src/pages/city/[citySlug]/[industrySlug].astro:70` (`breadcrumbItems`) and `:89`
(`breadcrumb={[`). Same in `[businessSlug].astro:95` / `:118`,
`services/[industrySlug]/[categorySlug]/[citySlug].astro:80` / `:106`.

---

## H3 — "Josephine Co. County" comes from TldrCard string concatenation

**Prediction:** `TldrCard.astro:41` renders `` `${eyebrow} · ${county} County` ``. With
`county: "Josephine"` that yields "Josephine County", which is correct — so the observed
"Josephine Co. County" must come from a page passing an already-suffixed county, or from a
different template. Need the rendered HTML to tell which.

**Evidence so far:** `src/data/cities.ts:27-38` — all twelve counties are bare names
("Linn", "Josephine", "Jackson"), no "Co." or "County" suffix. So the concatenation is
correct for city pages; the defect is elsewhere. **Unresolved — do not fix blind.**

---

## H4 — `FaqSchema.astro` can emit invalid JSON-LD

**Prediction:** `FaqSchema.astro:25` writes `JSON.stringify(jsonLd)` straight into
`set:html` with no entity escaping, while `JsonLd.astro:9-13` escapes `<`, `>`, `&`. Any FAQ
answer containing `<` or `&` breaks the script block on that page.

**Evidence so far:** the two files differ exactly as described. Whether any live answer
contains those characters is P1.1's job to answer.

---

## H5 — `/services/*` has no parent routes

**Prediction:** `src/pages/services/` contains only `index.astro` and
`[industrySlug]/[categorySlug]/[citySlug].astro`. If any breadcrumb or link points at
`/services/<industry>/` or `/services/<industry>/<category>/`, it is a 404.

**Evidence so far:** route inventory confirms only those two files exist under
`src/pages/services/`. Whether anything links to the missing levels is P1.4's job.
