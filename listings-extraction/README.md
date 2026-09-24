# listings-extraction (`lx`)

Pulls every field Google Maps shows for **one place URL or a queue of them**, plus the
top-20 result cards for **search phrases at a point**. Built on
[`rar-linux`](/home/mikes/rar-linux) (`rarlx`), imported as a path dependency rather than
copied, so there is one proven stealth implementation. Nothing in `rar/` or `rar-linux/` is
modified.

## What it reuses, unchanged

From `rarlx` (see `docs/RAR-SCRAPER-COMPOSITION-ANALYSIS.md` and
`rar-linux/research/CONFIGURATION-BREAKDOWN.md`):

- real installed Chrome through Patchright 1.62.3, with the AutomationControlled flag off
- the WSL GPU WebGL fix, and headed by default (headless shows the SwiftShader tell)
- a UA derived from the running Chrome, never hard-coded
- a fresh context per target, and the browser recycled every 7
- 1920×1080, en-US, Pacific time, and geolocation at the place's own pin
- four entry paths (`google_home`, `maps_home`, `search_results`, `direct`), with a warmup
  page as referer
- **on a block:** screenshot, tear down the whole browser, cool 30–120 s, then a new
  browser through the next entry path. A block on the 3rd attempt stops the run.
- ordinary failures: 3 attempts with `2^n + U(1,3)` s backoff; 3–6 s between targets
- mouse-wheel scrolling only (never Page Up/Down), with lognormal steps, tremor and pauses
- the search harvest (`harvest_single_pin`) and the full card extractor
  (`rarlx.fields.extract_full_listings`)

## What is new here

| piece | file | status |
|---|---|---|
| input parsing: place URLs, Maps URLs-API links (`?api=1&query_place_id=`), .txt/.jsonl/.csv queues | `targets.py` | tested |
| place-page extractor: name, rating, reviews, category, address, phone (+E.164), website, plus code, weekly hours, price, status, claimed, feature ID, CID, place ID, pin, raw `panel_items` | `place_fields.py` | **[H] selectors unverified on a live page** |
| a place visit using the same composition as the harvest, with a short panel read instead of a feed scroll | `visit.py` | untested live |
| run loop with identity checking (feature ID, else place ID) and a stale-selector stop (3 nameless place pages in a row) | `runner.py` | tested offline, including mutation checks |
| resume + stream on death: SQLite plus a JSONL line per row, flushed as written | `store.py` | tested |
| queues from the directory's data, city centroids (median of each city's Oregon place pins), and the "best {industry} in {city} oregon" sweep | `directory.py` | tested |

## Use

```bash
cd listings-extraction
uv run lx plan  queues/p10-3-new-listings.jsonl            # what would be visited; no browser
uv run lx run   queues/p10-3-new-listings.jsonl --run p10-3 --yes
uv run lx reparse --run p10-3                                # re-extract saved pages; no browser
uv run lx export  --run p10-3                                # results.csv / results.json

uv run lx queue directory all -o queues/all.jsonl            # every listing's googleUrl
uv run lx queue directory portland__legal-services -o q.jsonl
uv run lx queue sweep -o queues/sweep.jsonl --cities medford --industries legal-services
uv run lx run "https://www.google.com/maps/place/…" --run one --yes    # a single URL
uv run --group dev pytest -q                                 # offline tests
```

`lx run` refuses without `--yes`: it opens real Chrome on Google Maps.

Output goes to `output/<run>/` (gitignored): `lx.sqlite`, `results.jsonl` (appended per row),
`results.csv`, `results.json`, and `artifacts/<target>/page.html|page.png|final_url.txt`.

## First live run — turn the [H] into evidence

Nothing has been run against Google. The place-page selectors are written from knowledge of
the markup, not checked against a page saved on this machine. Before any queue:

1. Run **one** place: `uv run lx run queues/p10-3-new-listings.jsonl --run first --limit 1 --yes`
2. Open `output/first/artifacts/<id>/page.png` and compare it with `results.csv`.
3. Look at `_sources` in `results.json`. Any field that fell back to a second selector, or
   is empty while the screenshot shows it, means `place_fields.py` needs fixing. Fix it
   against the saved `page.html`, then run `lx reparse --run first`. That costs no second visit.
4. Save that page as a real fixture in `tests/fixtures/` and replace the synthetic one.

## Queues in `queues/`

- `p10-3-new-listings.jsonl`: Deepli Clean, Apex Business Marketing, North Tabor Dental,
  Capital Nomics (URLs-API links with place IDs), and Cascadia Putting Club (no Maps URL,
  so it's a name search at the Portland centroid). These are the ratings P10.3 is waiting
  on. Per the site's rule, the numbers are confirmed by Mike before they're published.
- `centroid-sweep-best-industry.jsonl`: 144 searches (12 cities × 12 industries). The
  phrases use the site's industry names ("best Beauty & Personal Care in Albany oregon").
  Change `--template`, or map to search-friendly phrases, before a real sweep.
- The directory's out-of-state check queue is written by
  `node scripts/audit-oregon-location.mjs` to `reports/out-of-state-<date>.queue.jsonl`. It
  holds 43 searches asking whether each blocked business has an Oregon location. Pass it
  to `lx plan` / `lx run` directly.
