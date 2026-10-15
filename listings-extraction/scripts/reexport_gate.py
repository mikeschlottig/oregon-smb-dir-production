"""Re-export one completed kwsweep gate into rows.jsonl after an export fix (2026-10-15).

Archives rows.jsonl to output/kwsweep/_archive/rows.jsonl.<YYYY-MM-DD-HHMMSS> first, drops that gate's rows, then
re-parses its saved pages with kwsweep.export_gate (append). Every other row is kept byte-for-byte.
Run:  uv run --project . python scripts/reexport_gate.py <city_slug> <industry> <keyword_id>
"""
import shutil
import sys
from datetime import datetime

from lx import kwsweep

city, industry, kw = sys.argv[1:4]
gate = next(g for g in kwsweep.plan([city], [industry], [kw]))
rows = kwsweep.OUT / "rows.jsonl"
archive = kwsweep.OUT / "_archive" / f"rows.jsonl.{datetime.now():%Y-%m-%d-%H%M%S}"
archive.parent.mkdir(exist_ok=True)
if archive.exists():
    sys.exit(f"refusing to overwrite {archive}")
shutil.copy2(rows, archive)

tag = (f'"city_slug": "{city}"', f'"industry": "{industry}"', f'"keyword_id": "{kw}"')
kept = dropped = 0
tmp = rows.with_suffix(".jsonl.reexporting")
with rows.open(encoding="utf-8") as src, tmp.open("w", encoding="utf-8") as dst:
    for line in src:
        if all(t in line for t in tag):
            dropped += 1
        else:
            dst.write(line)
            kept += 1
tmp.replace(rows)
added = kwsweep.export_gate(gate)
print(f"archived {archive.name}; kept {kept}, dropped {dropped}, re-exported {added}")
