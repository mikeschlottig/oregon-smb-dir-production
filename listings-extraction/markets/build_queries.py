"""
One search phrase per directory industry, for every city:  "best {term} in {city} oregon".

{term} is the industry's most common Google Maps category among the directory's own
listings (all 12 cities pooled), lower-cased as a person types it. Data, not taste: the
directory files each listing under an industry from its Google category, so the top
category is the thing the industry page mostly lists. The runner-up and both shares are
recorded, so a near-tie is visible rather than silently decided.

  uv run python markets/build_queries.py   → markets/queries.json
"""
from __future__ import annotations

import json
from pathlib import Path

import polars as pl

from lx import directory

HERE = Path(__file__).resolve().parent
TEMPLATE = "best {term} in {city} oregon"


def main() -> None:
    rows = []
    for shard in directory.shards():
        city, industry = shard.split("__")
        for r in directory.records(shard):
            cat = (r.get("category") or "").strip()
            if cat:
                rows.append({"city": city, "industry": industry, "category": cat})
    df = pl.DataFrame(rows)
    ranked = (
        df.group_by(["industry", "category"]).agg(n=pl.len(), cities=pl.col("city").n_unique())
        .join(df.group_by("industry").agg(total=pl.len()), on="industry")
        .with_columns(share=(pl.col("n") / pl.col("total") * 100).round(1))
        .sort(["industry", "n"], descending=[False, True])
    )
    queries = {}
    for industry in sorted(directory.industries()):
        top = ranked.filter(pl.col("industry") == industry).head(2).to_dicts()
        term = top[0]["category"].lower()
        # Google's category for lodging is the plural "Hotels"; people search the singular.
        term = {"hotels": "hotel"}.get(term, term)
        queries[industry] = {
            "industry_name": directory.industries()[industry],
            "term": term,
            "template": TEMPLATE,
            "basis": {
                "top_category": top[0]["category"], "listings": top[0]["n"], "share_pct": top[0]["share"],
                "cities_with_it": top[0]["cities"], "industry_listings": top[0]["total"],
                "runner_up": {"category": top[1]["category"], "listings": top[1]["n"], "share_pct": top[1]["share"]} if len(top) > 1 else None,
            },
            "examples": [TEMPLATE.format(term=term, city=directory.cities()[c]) for c in ("medford", "portland")],
        }
    (HERE / "queries.json").write_text(json.dumps(queries, indent=2) + "\n")
    for k, v in queries.items():
        b = v["basis"]
        ru = b["runner_up"]
        print(f"{k:32} '{v['term']}'  {b['listings']}/{b['industry_listings']} ({b['share_pct']}%)"
              + (f"  runner-up {ru['category']} {ru['listings']} ({ru['share_pct']}%)" if ru else ""))


if __name__ == "__main__":
    main()
