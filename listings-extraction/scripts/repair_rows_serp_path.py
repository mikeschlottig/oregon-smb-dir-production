"""One-off repair (2026-10-15, docs/CHANGES-2026-10-15-gate-detach-sweep.md §3).

rows.jsonl rows written before kwsweep.export_gate tagged serp_path get it from the marker line of the saved page
they were parsed from; a page with no marker was reached by the URL path ("url"). Rows that already carry serp_path
are left alone. The caller archives the pre-repair file first (output/kwsweep/_archive/rows.jsonl.<stamp>).
Run:  uv run --project . python scripts/repair_rows_serp_path.py
"""
import json
import os
from collections import Counter

from rarlx.fields import serp_path_of

from lx import kwsweep, sweep

out = kwsweep.OUT / "rows.jsonl"
tmp = out.with_suffix(".jsonl.repairing")
cache: dict = {}
by_gate: Counter = Counter()
with out.open(encoding="utf-8") as src, tmp.open("w", encoding="utf-8") as dst:
    for line in src:
        r = json.loads(line)
        if "serp_path" not in r:
            mk = sweep._market({"latitude": 0, "longitude": 0}, r["city_slug"].replace("-", " ").title())
            page = (kwsweep.OUT / r["city_slug"] / f"artifacts_{mk.market_slug}_{r['industry'].lower()}"
                    / r["keyword_id"] / r["point_id"] / "viewport.html")
            if page not in cache:
                cache[page] = serp_path_of(page.read_text(encoding="utf-8")) if page.exists() else "url"
            r = {**r, "serp_path": cache[page]}
        by_gate[(r["industry"], r["keyword_id"], r["serp_path"])] += 1
        dst.write(json.dumps(r) + "\n")
os.replace(tmp, out)

totals = Counter()
for (industry, kw, path), n in sorted(by_gate.items()):
    totals[path] += n
    if path != "url" or (industry, kw) == ("food-dining", "K14"):
        print(industry, kw, path, n)
print("rows:", sum(totals.values()), dict(totals), "| pages read:", len(cache))
