"""Audit every accepted kwsweep pin for a false pass (2026-10-15, docs/CHANGES-2026-10-15-gate-detach-sweep.md §2).

A pin is accepted when it holds 20 rows, or fewer with Google's end-of-list proof (or, since H31, a confirmed
one-business place page). A false pass = a pin accepted while businesses Google showed were not stored. Two
independent checks over the newest SUCCESS observation of every pin in every output/kwsweep evidence DB:
  1. every short pin (< 20 rows, url/typed path) — does its saved page carry "You've reached the end of the list"?
  2. every pin — does its saved page hold more result cards (div.Nv2PK) than rows stored, on a short list?
Plus, per short gate, distinct businesses across the whole grid vs the most any one pin showed.
Run:  uv run --project . python scripts/audit_gate_passes.py [--json]
      --json prints one summary line (the nightly ledger output/kwsweep/gate-audit.jsonl).
"""
import glob
import json
import re
import sqlite3
import sys
from datetime import datetime, timezone

import polars as pl
from scrapling import Selector

from rarlx.fields import serp_path_of
from lx import kwsweep

END = "you've reached the end of the list"
LATEST = """SELECT o.observation_id, o.keyword_id, o.point_id, o.results_count, o.html_path FROM observations o
            WHERE o.status='SUCCESS' AND o.timestamp = (SELECT max(timestamp) FROM observations o2
            WHERE o2.keyword_id=o.keyword_id AND o2.point_id=o.point_id AND o2.status='SUCCESS')"""

out = []
for db in sorted(glob.glob(str(kwsweep.OUT / "*" / "*.db"))):
    industry = re.search(r"_or_(.+)_evidence", db).group(1)
    c = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
    for oid, kw, pin, n, html_path in c.execute(LATEST):
        try:
            html = open(html_path, encoding="utf-8", errors="replace").read()
        except OSError:
            out.append(dict(industry=industry, kw=kw, pin=pin, n=n, cards=-1, end=False, path="missing", places=[]))
            continue
        places = [r[0] for r in c.execute(
            "SELECT coalesce(place_id, cid, business_name) FROM rankings WHERE observation_id=?", (oid,))]
        out.append(dict(industry=industry, kw=kw, pin=pin, n=n, cards=len(Selector(html).css("div.Nv2PK")),
                        end=END in html.lower().replace("’", "'"), path=serp_path_of(html), places=places))

df = pl.DataFrame(out)
short = df.filter((pl.col("n") < 20) & (pl.col("path") != "place"))
if "--json" in sys.argv:  # one ledger line; kwsweep-nightly.sh appends it to output/kwsweep/gate-audit.jsonl
    print(json.dumps({
        "audited_at": datetime.now(timezone.utc).isoformat(),
        "gates": df.select("industry", "kw").unique().height, "pins": df.height,
        "pages_missing": df.filter(pl.col("path") == "missing").height,
        "short_pins": short.height, "short_with_end_of_list": short.filter(pl.col("end")).height,
        "place_pins": df.filter(pl.col("path") == "place").height,
        "typed_pins": df.filter(pl.col("path") == "typed").height,
        # The two false-pass signals. Anything above 0 is a gate that let missing businesses through.
        "false_pass_no_end_proof": short.filter(~pl.col("end")).height,
        "false_pass_unstored_cards": short.filter(pl.col("cards") > pl.col("n")).height,
    }))
    sys.exit(0)
print(f"accepted pins: {df.height}  gates: {df.select('industry', 'kw').unique().height}  "
      f"saved page missing: {df.filter(pl.col('path') == 'missing').height}")
print(f"short pins (url/typed): {short.height}  with Google's end-of-list sentence: {short.filter(pl.col('end')).height}")
print(f"confirmed one-business pins (place): {df.filter(pl.col('path') == 'place').height}")
print(f"short pins whose page shows more cards than rows stored: "
      f"{short.filter(pl.col('cards') > pl.col('n')).height}")
grid = (df.join(short.select("industry", "kw").unique(), on=["industry", "kw"]).explode("places")
        .group_by(["industry", "kw"]).agg(pl.col("places").n_unique().alias("distinct_in_grid"),
                                          pl.col("n").max().alias("most_at_one_pin"))
        .sort("distinct_in_grid", descending=True))
with pl.Config(tbl_rows=40):
    print(grid)
