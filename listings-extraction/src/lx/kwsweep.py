"""
The multi-keyword sweep: every city × every keyword in keywords/keyword-sets.json × 49 pins × top 20.

Same harvest as lx.sweep — rarlx's proven `execute_bcrf49_pipeline`, called unchanged with the
city's manifest pins and one phrase. One gate = one city × one keyword = 49 pins. Differences:

  - Many keywords per industry. K01 of every set is the phrase lx.sweep already ran
    (`same_as_sweep`); it is skipped here — its rows live in output/sweep/.
  - Output goes to output/kwsweep/ (gates.jsonl, rows.jsonl, <city>/ artifacts), so the
    finished 144-gate sweep in output/sweep/ is never appended to or rewritten.
  - Built to run in bounded nightly windows: --max-hours / --max-gates are checked between
    gates; a file output/kwsweep/STOP pauses the queue at the next gate boundary; an flock
    keeps two runs from overlapping.
  - Order: city by city (CITY_FIRST, then alphabetical), industries alphabetical, keywords
    in the set's priority order — so one market is complete before the next starts.

Resume, failure and block handling are the sweep's: rarlx skips stored pins; an incomplete gate
(rarlx exits 1) is logged and the queue moves on, a re-run retries it; a block that survives
rarlx's teardown + entry-path rotation raises and the run stops. After each gate its saved
pages are re-parsed into rows.jsonl (append), so a dead run keeps every finished gate.
"""
from __future__ import annotations

import asyncio
import fcntl
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, List, Optional

from rarlx.bcrf49_linux import execute_bcrf49_pipeline

from lx import sweep

KEYWORDS = sweep.ROOT / "keywords" / "keyword-sets.json"
OUT = sweep.ROOT / "output" / "kwsweep"
CITY_FIRST = ["medford", "grants-pass"]


def load_sets(industries: Optional[Iterable[str]] = None) -> dict:
    sets = json.loads(KEYWORDS.read_text())["industries"]
    return {k: v for k, v in sets.items() if not industries or k in set(industries)}


def plan(cities=None, industries=None, keyword_ids=None) -> List[dict]:
    ms = sweep.load_markets(cities)
    ms.sort(key=lambda m: (CITY_FIRST.index(m["market"]["city_slug"]) if m["market"]["city_slug"] in CITY_FIRST
                           else len(CITY_FIRST), m["market"]["city_slug"]))
    gates = []
    for m in ms:
        city = m["market"]["city"]
        for ind, s in sorted(load_sets(industries).items()):
            for kw in s["keywords"]:
                if kw.get("same_as_sweep") or (keyword_ids and kw["id"] not in set(keyword_ids)):
                    continue
                gates.append({
                    "city_slug": m["market"]["city_slug"], "city": city, "industry": ind,
                    "keyword_id": kw["id"], "phrase": kw["template"].format(city=city),
                    "centroid": m["market"]["market_centroid"], "pins": m["geo_pins"],
                })
    return gates


def done_gates() -> set:
    p = OUT / "gates.jsonl"
    if not p.exists():
        return set()
    return {(g["city_slug"], g["industry"], g["keyword_id"])
            for g in map(json.loads, p.read_text().splitlines()) if g.get("status") == "complete"}


def gate_dir(g: dict) -> Path:
    return OUT / g["city_slug"]


def export_gate(g: dict) -> int:
    """Re-parse this gate's saved pages with the full extractor; append rows. Returns rows written."""
    mk = sweep._market(g["centroid"], g["city"])
    art = gate_dir(g) / f"artifacts_{mk.market_slug}_{g['industry'].lower()}" / g["keyword_id"]
    ts = datetime.now(timezone.utc).isoformat()
    n = 0
    with (OUT / "rows.jsonl").open("a", encoding="utf-8") as f:
        for pin in g["pins"]:
            page = art / pin["point_id"] / "viewport.html"
            if not page.exists():
                continue
            # serp_path on every row (url | typed | place). Missing here until 2026-10-15: the H29 commit
            # tagged lx/sweep.py's export, which kwsweep does not call (CHANGES-2026-10-15 §3).
            for r in sweep.page_rows(page.read_text(encoding="utf-8")):
                f.write(json.dumps({
                    "city_slug": g["city_slug"], "industry": g["industry"], "keyword_id": g["keyword_id"],
                    "query": g["phrase"], "point_id": pin["point_id"], "pin_lat": pin["latitude"],
                    "pin_lng": pin["longitude"], "radius_miles": pin["radius_miles"], "bearing": pin["bearing_label"],
                    "exported_at": ts, **r,
                }) + "\n")
                n += 1
    return n


def status() -> dict:
    gates, done = plan(), done_gates()
    left = [g for g in gates if (g["city_slug"], g["industry"], g["keyword_id"]) not in done]
    secs = [g["seconds"] for g in map(json.loads, (OUT / "gates.jsonl").read_text().splitlines())
            if g.get("status") == "complete"] if (OUT / "gates.jsonl").exists() else []
    per = sorted(secs)[len(secs) // 2] if secs else 934.5      # median; 934.5 s = the 12-city sweep's median gate
    return {"gates": len(gates), "complete": len(gates) - len(left), "remaining": len(left),
            "next": f"{left[0]['city']} · {left[0]['phrase']}" if left else None,
            "median_gate_seconds": per, "remaining_hours": round(len(left) * per / 3600, 1),
            "paused": (OUT / "STOP").exists()}


def run(cities=None, industries=None, keyword_ids=None, headless: bool = True,
        max_hours: Optional[float] = None, max_gates: Optional[int] = None, log=print) -> int:
    """Run gates until the queue, the time budget or the gate budget is exhausted. Returns gates finished."""
    OUT.mkdir(parents=True, exist_ok=True)
    lock = (OUT / ".lock").open("w")
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        log("[kwsweep] another run holds output/kwsweep/.lock — not starting a second one")
        return 0
    gates, finished = plan(cities, industries, keyword_ids), done_gates()
    todo = [g for g in gates if (g["city_slug"], g["industry"], g["keyword_id"]) not in finished]
    log(f"[kwsweep] {len(gates)} gates in plan, {len(gates) - len(todo)} complete, {len(todo)} to go"
        f"{f'; budget {max_hours} h' if max_hours else ''}{f', {max_gates} gates' if max_gates else ''}")
    t_start, n = time.time(), 0
    for g in todo:
        if (OUT / "STOP").exists():
            log("[kwsweep] output/kwsweep/STOP present — pausing at a gate boundary")
            break
        if max_gates is not None and n >= max_gates:
            break
        if max_hours is not None and (time.time() - t_start) / 3600 >= max_hours:
            log(f"[kwsweep] time budget reached ({max_hours} h) — stopping at a gate boundary")
            break
        log(f"[kwsweep] {g['city']} · {g['industry']} · {g['keyword_id']} · '{g['phrase']}'")
        t0, state = time.time(), "complete"
        try:
            asyncio.run(execute_bcrf49_pipeline(
                market=sweep._market(g["centroid"], g["city"]), industry=g["industry"], output_dir=gate_dir(g),
                pins_override=g["pins"], keywords_override=[{"keyword_id": g["keyword_id"], "phrase": g["phrase"]}],
                headless=headless,
            ))
        except SystemExit as e:  # rarlx "GATE LOCKED": fewer than 49 pins verified; a re-run resumes the pins
            state = f"incomplete (exit {e.code})"
        rows = export_gate(g) if state == "complete" else 0
        rec = {"city_slug": g["city_slug"], "industry": g["industry"], "keyword_id": g["keyword_id"],
               "phrase": g["phrase"], "status": state, "rows": rows, "seconds": round(time.time() - t0),
               "finished_at": datetime.now(timezone.utc).isoformat()}
        with (OUT / "gates.jsonl").open("a", encoding="utf-8") as f:
            f.write(json.dumps(rec) + "\n")
        log(f"[kwsweep] {state}: {rows} rows in {rec['seconds']} s")
        n += 1
    return n


if __name__ == "__main__":
    sys.stdout.reconfigure(line_buffering=True)
    print(json.dumps(status(), indent=1))
