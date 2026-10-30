"""Daily gate-health check for the 2026-10-30 Albany K10 fix (docs/albany-k10/FINDINGS.md, hypotheses H2-H6).

Reads output/kwsweep/gates.jsonl and exported-pins.jsonl, tests each prediction, prints a PASS/FAIL table and
writes docs/albany-k10/daily/<date>.md. Read-only on run data. Exit 1 when any prediction FAILS, so a scheduler
or a session can tell. `uv run --project . python scripts/gate-health-check.py`
"""
from __future__ import annotations

import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from lx import kwsweep

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "output" / "kwsweep"
EPOCH = kwsweep.STUCK_EPOCH
ALBANY_K10 = ("albany", "sports-fitness", "K10")


def main() -> int:
    recs = [r for r in map(json.loads, (OUT / "gates.jsonl").read_text().splitlines())]
    after = [r for r in recs if r.get("finished_at", "") >= EPOCH]
    key = lambda r: (r["city_slug"], r["industry"], r["keyword_id"])
    ledger_p = OUT / "exported-pins.jsonl"
    ledger = [tuple(x) for x in map(json.loads, ledger_p.read_text().splitlines())] if ledger_p.exists() else []
    checks = []

    albany = [r for r in after if key(r) == ALBANY_K10]
    last = albany[-1] if albany else None
    checks.append(("H2 Albany K10 completes on the first run after the fix",
                   "PENDING" if last is None else "PASS" if last["status"] == "complete" else "FAIL",
                   "no attempt since the fix" if last is None else f"{last['status']} · {last.get('pins_verified')}/49 pins · {last['finished_at'][:16]}"))

    inc = [r for r in after if r["status"].startswith("incomplete")]
    bad = [r for r in inc if r.get("pins_verified", 0) > 0 and r["rows"] == 0]
    checks.append(("H3 an incomplete gate keeps its verified pins (rows > 0 when pins_verified > 0)",
                   "PENDING" if not inc else "FAIL" if bad else "PASS",
                   f"{len(inc)} incomplete since the fix" + (f"; rows=0 despite verified pins: {[key(r) for r in bad]}" if bad else "")))

    dup = [k for k, n in Counter(ledger).items() if n > 1]
    checks.append(("H4 no pin is exported twice (exported-pins.jsonl keys unique)",
                   "PENDING" if not ledger else "FAIL" if dup else "PASS",
                   f"{len(ledger)} pins in the ledger" + (f"; duplicates: {dup[:3]}" if dup else "")))

    stuck = kwsweep.stuck_gates()
    skipped_rows = Counter(key(r) for r in after if r["status"] == "skipped")
    unmarked = [k for k in stuck if skipped_rows[k] == 0]
    repeat = [k for k, n in skipped_rows.items() if n > 1]
    last_run_inc = Counter(key(r) for r in after if r["status"].startswith("incomplete"))
    checks.append(("H5 a stalled gate is marked skipped once and not retried (<= STUCK_AFTER incomplete attempts, 1 skipped row)",
                   "FAIL" if repeat else "PASS" if not stuck or not unmarked else "PENDING",
                   f"stuck now: {sorted(stuck)}; skipped rows: {dict(skipped_rows)}"
                   + (f"; marked more than once: {repeat}" if repeat else "")))
    over = [k for k, n in last_run_inc.items() if n > kwsweep.STUCK_AFTER and k in stuck]
    checks.append(("H5b a stuck gate is attempted no more than STUCK_AFTER times after the epoch",
                   "FAIL" if over else "PASS", f"attempts over the limit: {over}" if over else "none over the limit"))

    comp = [r for r in after if r["status"] == "complete"]
    checks.append(("H6 the sweep keeps moving (gates completed since the fix)",
                   "PENDING" if not after else "PASS" if comp else "FAIL", f"{len(comp)} complete, {len(inc)} incomplete, {skipped_rows.total()} skipped rows"))

    worst = "FAIL" if any(c[1] == "FAIL" for c in checks) else "OK"
    stamp = datetime.now(timezone.utc).astimezone()
    lines = [f"# Gate health {stamp:%Y-%m-%d %H:%M %Z} — {worst}", "",
             f"Epoch {EPOCH}. Attempts since: {len(after)}. Predictions: docs/albany-k10/hypothesis.md.", "",
             "| check | result | evidence |", "|---|---|---|"] + [f"| {n} | **{s}** | {e} |" for n, s, e in checks]
    text = "\n".join(lines) + "\n"
    d = ROOT / "docs" / "albany-k10" / "daily"
    d.mkdir(parents=True, exist_ok=True)
    (d / f"{stamp:%Y-%m-%d}.md").write_text(text)
    print(text)
    return 1 if worst == "FAIL" else 0


if __name__ == "__main__":
    sys.exit(main())
