# 12-city BCRF-49 sweep — workflow and decisions

Mike, 2026-09-24: *"Come up with queries for each industry in each city, then define the
center point of each city, then run the 49 pin radial logarithm and collect the top 20
query results from each geo point … using the same logic used to create the geo-points
for medford."*

## Workflow

| step | command | output |
|---|---|---|
| 1. queries | `uv run python markets/build_queries.py` | `markets/queries.json` |
| 2. centres + pins | `uv run python markets/build_markets.py` | `markets/<city>.json` ×12, `markets/centers.json` |
| 3. plan | `uv run lx sweep` | every gate listed; nothing opened |
| 4. run | `uv run lx sweep --yes` | `output/sweep/<city>/…` pages + SQLite; `output/sweep/rows.jsonl`; `output/sweep/gates.jsonl` |
| 5. resume | the same command | finished pins and gates are skipped |

A **gate** is one city × one query × 49 pins. 12 cities × 12 queries = 144 gates, or
7,056 pin searches returning up to 141,120 ranked cards.

## Decisions and why

### Centre point: OpenStreetMap's city centre (Nominatim), saved once
- **Rule, taken from Medford.** Medford's centroid is its downtown core, "Central Ave & Main
  St" (42.3265, -122.8756), a single hand-picked point, 4 decimals, looked up once and saved.
  That worked because it was one lookup, from one trusted source.
- **Same logic, done by code.** For each city, Nominatim is asked for "<city>, Oregon". It
  returns the label point OSM places at the city's centre. That's one request per city,
  1.1 s apart, and the results are saved in the manifests and `centers.json`, so the sweep
  never touches a geocoder.
- **Checked against Medford:** Nominatim's Medford is 0.19 mi from the master centroid.
- **Guard:** a centre more than 3 mi from the median of that city's own listing pins stops
  the build as a probable wrong match. The actual gaps are 0.14–1.07 mi.
- **Medford** keeps its master manifest unchanged.

**What went wrong on the way (kept so it isn't repeated):**
1. **Overpass** street-intersection matching: a heavy regex query on a busy public server.
   It returned 504s and stalled for minutes per city, and I built the whole script before
   trying one request.
2. **The listing-pin median:** fine as a business centre and 0.47 mi off Medford's, but
   further than Nominatim, and not the downtown rule.
3. The fix was the one-request smoke test that should have come first: Nominatim on Medford
   against the known answer.

### Pins: rarlx `generate_bcrf49_grid`
- **Frame:** radii 0 / 0.25 / 0.5 / 1 / 2 / 4 / 8 mi × 8 compass bearings, plus the centre,
  for 49 pins.
- **Verified against Medford's master manifest before it was used anywhere else:** all 49
  radius/bearing keys match. The worst deviation is 0.000354° lng at the 8-mile E pin, about
  0.03 mi, the rounding drift rar-linux already records.

### Queries: `best {term} in {city} oregon`, one per industry
- **{term}** is the industry's most common Google category among the directory's own
  listings, pooled over all 12 cities, and lower-cased. The directory files each listing
  under an industry by its Google category, so the top category is what the industry page
  mostly lists.
- **Singular "hotel".** Google's lodging category is the plural "Hotels"; people search
  "best hotel in …".
- **Near-ties, kept visible in `queries.json`:**
  - plumber 293 vs roofing contractor 292
  - dentist 382 vs chiropractor 378
  - massage therapist 259 vs cannabis store 257

  The rule picks the top category. Overriding one is a single edit to `queries.json`.
- **Rejected: the site's industry names** ("best Beauty & Personal Care in Albany oregon").
  Nobody types that, so the results wouldn't be the market a customer sees.

### Validation (tests/test_lx.py)
1. The generator reproduces Medford's master manifest: all 49 pins, worst difference 0.03 mi.
2. `medford.json` uses exactly the master's coordinates.
3. An independent inverse check, computed in the test and not by the generator: the
   haversine distance from each centre to every pin equals its ring radius within 0.03 mi,
   and the initial bearing matches its label within 0.5°. That covers all 12 cities × 49
   pins, and every centre is inside Oregon.

### Harvest: rarlx's proven pipeline, unchanged
- `execute_bcrf49_pipeline(pins_override=…, keywords_override=…)` is the call that ran
  Medford electricians 49/49 × 20 with 0 challenges, about 16.5 s per pin. Nothing about
  stealth is re-implemented here.
- **Order:** Medford first (the proven market), then the other cities alphabetically, and
  industries alphabetically within a city. A dead sweep leaves whole cities done, not a
  thin layer everywhere.
- **Failures:**
  - An incomplete gate (rarlx exits 1) is logged, and the sweep moves on; a re-run retries
    it.
  - A block that survives rarlx's teardown and entry-path rotation **stops the sweep**.
- **Export:** after each complete gate, every saved `viewport.html` is re-parsed with the
  full card extractor into `rows.jsonl`. That's one line per card, tagged with city,
  industry, query, pin, radius and bearing.

### Time
About 7,056 pins × 16.5 s ≈ 32 h of continuous running at the proven pace. It's resumable,
so it can run in blocks.
