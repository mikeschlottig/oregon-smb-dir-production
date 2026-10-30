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
import sqlite3
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, List, Optional

from rarlx.bcrf49_linux import execute_bcrf49_pipeline

from lx import sweep

KEYWORDS = sweep.ROOT / "keywords" / "keyword-sets.json"
# Single (city, industry, keyword) gates removed from the plan, each with its reason (2026-10-22). Keywords in
# keyword-sets.json are shared by every city, so a per-city decision cannot be made there. Delete an entry to restore it.
PRUNED = sweep.ROOT / "keywords" / "pruned-gates.json"
OUT = sweep.ROOT / "output" / "kwsweep"
CITY_FIRST = ["medford", "grants-pass"]


def load_sets(industries: Optional[Iterable[str]] = None) -> dict:
    sets = json.loads(KEYWORDS.read_text())["industries"]
    return {k: v for k, v in sets.items() if not industries or k in set(industries)}


def pruned_gates() -> set:
    """(city_slug, industry, keyword_id) of every gate listed in PRUNED. An entry without a reason is refused."""
    if not PRUNED.exists():
        return set()
    out = set()
    for e in json.loads(PRUNED.read_text(encoding="utf-8")):
        missing = [k for k in ("city_slug", "industry", "keyword_id", "reason") if not e.get(k)]
        if missing:
            raise ValueError(f"{PRUNED.name}: entry {e} is missing {', '.join(missing)}")
        out.add((e["city_slug"], e["industry"], e["keyword_id"]))
    return out


def plan(cities=None, industries=None, keyword_ids=None) -> List[dict]:
    pruned = pruned_gates()
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
                if not keyword_ids and (m["market"]["city_slug"], ind, kw["id"]) in pruned:
                    continue                    # named keyword ids still run: an explicit request wins
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


def gate_key(g: dict) -> tuple:
    return (g["city_slug"], g["industry"], g["keyword_id"])


# --- Stuck gates (2026-10-30, Mike) ------------------------------------------------------------------
# Albany K10 was retried first thing every night for 4 days: the same pin failed, the gate locked at 48/49 and
# the 48 verified pins never reached rows.jsonl. A gate that ends "incomplete" STUCK_AFTER times in a row is
# marked "skipped" in gates.jsonl and the queue moves on; naming it with --keywords retries it. Incomplete
# attempts finished before STUCK_EPOCH ran on code that could not finish the gate (H32 fixed the place-jump
# pin), so they do not count — bump STUCK_EPOCH with each harvest fix that unblocks a gate.
STUCK_AFTER = 2
STUCK_EPOCH = "2026-10-30T16:00:00+00:00"    # 09:00 PDT: after the 2026-10-29 run, which holds the old code, exits


def _gate_records() -> List[dict]:
    p = OUT / "gates.jsonl"
    return list(map(json.loads, p.read_text().splitlines())) if p.exists() else []


def stuck_gates() -> dict:
    """{(city_slug, industry, keyword_id): consecutive stalled attempts} for gates at STUCK_AFTER or more.
    An attempt is stalled when it ended incomplete and verified no pin more than the attempt before it; a gate
    that gains pins each night (Albany K10 went 3 failed pins -> 2 -> 2 -> 1 -> 1 as flaky pins passed on retry)
    is not stuck. An attempt without pins_verified (records before 2026-10-30) is a stall."""
    streak: dict = {}
    last: dict = {}
    for r in _gate_records():
        k, st = (r["city_slug"], r["industry"], r["keyword_id"]), r.get("status", "")
        if st == "complete":
            streak[k], last[k] = 0, None
        elif st.startswith("incomplete") and r.get("finished_at", "") >= STUCK_EPOCH:
            pv = r.get("pins_verified")
            gained = pv is not None and last.get(k) is not None and pv > last[k]
            streak[k] = 1 if gained or k not in streak or streak[k] == 0 else streak[k] + 1
            last[k] = pv
    return {k: n for k, n in streak.items() if n >= STUCK_AFTER}


def _mark_skipped(stuck: dict, gates: List[dict]) -> None:
    """One 'skipped' row per newly stuck gate (not one per night)."""
    latest = {(r["city_slug"], r["industry"], r["keyword_id"]): r.get("status") for r in _gate_records()}
    with (OUT / "gates.jsonl").open("a", encoding="utf-8") as f:
        for g in gates:
            k = gate_key(g)
            if k in stuck and latest.get(k) != "skipped":
                f.write(json.dumps({
                    "city_slug": g["city_slug"], "industry": g["industry"], "keyword_id": g["keyword_id"],
                    "phrase": g["phrase"], "status": "skipped", "rows": 0, "seconds": 0,
                    "reason": f"{stuck[k]} consecutive incomplete attempts; name it with --keywords to retry",
                    "finished_at": datetime.now(timezone.utc).isoformat()}) + "\n")


def verified_pins(g: dict) -> set:
    """point_ids the evidence store holds as verified for this gate (the rule rarlx resumes by)."""
    mk = sweep._market(g["centroid"], g["city"])
    db = gate_dir(g) / f"rar_{mk.market_slug}_{g['industry'].lower()}_evidence_V_0_01.db"
    if not db.exists():
        return set()
    conn = sqlite3.connect(f"file:{db}?mode=ro", uri=True, timeout=30)
    try:
        latest = {}
        for pid, status, n in conn.execute(
                "SELECT point_id, status, results_count FROM observations WHERE keyword_id = ? ORDER BY timestamp",
                (g["keyword_id"],)):
            latest[pid] = status == "SUCCESS" and n > 0
        for pid, n in conn.execute(
                "SELECT point_id, count(*) FROM rankings WHERE keyword_id = ? GROUP BY point_id", (g["keyword_id"],)):
            latest.setdefault(pid, n >= 20)
        return {pid for pid, ok in latest.items() if ok}
    finally:
        conn.close()


# --- One-pin probe (H33, 2026-10-15) ---------------------------------------------------------------
# A never-run keyword costs 49 pins before anyone sees how Google answers it (K14 vegan, K15 float spa).
# The probe asks once, at the centroid pin, with the same harvester, and records what came back.
PROBES = OUT / "probes.jsonl"


def probe_kind(listings: List[dict], end_of_list: bool) -> str:
    """list (20), short (fewer + Google's end-of-list), place (confirmed one business), fail."""
    if listings and listings[0].get("serp_path") == "place":
        return "place"
    if len(listings) >= 20:
        return "list"
    if listings and end_of_list:
        return "short"
    return "fail"


def probed() -> dict:
    """Latest probe record per gate key."""
    if not PROBES.exists():
        return {}
    return {gate_key(r): r for r in map(json.loads, PROBES.read_text(encoding="utf-8").splitlines())}


def probe_todo(cities=None, industries=None, keyword_ids=None) -> List[dict]:
    """Planned gates with no probe yet. Complete gates are skipped unless keyword ids were named."""
    done, seen = done_gates(), probed()
    return [g for g in plan(cities, industries, keyword_ids)
            if gate_key(g) not in seen and (keyword_ids or gate_key(g) not in done)]


async def _probe(gates: List[dict], headless: bool, log) -> int:
    import random
    from patchright.async_api import async_playwright
    from rarlx.bcrf49_linux import (HarvesterCircuitBreakerError, derive_user_agent, harvest_single_pin,
                                    launch_browser, resolve_chrome_executable)
    n = 0
    async with async_playwright() as p:
        browser = await launch_browser(p, resolve_chrome_executable(), headless)
        ua = derive_user_agent(browser.version, headless)
        try:
            for i, g in enumerate(gates):
                if i and i % 7 == 0:  # same 7-visit browser recycle as the harvest
                    await browser.close()
                    browser = await launch_browser(p, resolve_chrome_executable(), headless)
                pin, t0 = g["pins"][0], time.time()
                rec = {"city_slug": g["city_slug"], "industry": g["industry"], "keyword_id": g["keyword_id"],
                       "phrase": g["phrase"], "point_id": pin["point_id"]}
                try:
                    listings, html_path, _, end = await harvest_single_pin(
                        browser, pin, g["keyword_id"], g["phrase"],
                        OUT / "probes" / g["city_slug"] / g["industry"], headless=headless, user_agent=ua)
                    rec.update(kind=probe_kind(listings, end), n=len(listings),
                               serp_path=listings[0].get("serp_path") if listings else None,
                               top=[r["business_name"] for r in listings[:3]], page=html_path)
                except HarvesterCircuitBreakerError as e:
                    rec.update(kind="blocked", n=0, error=str(e))
                except Exception as e:  # one bad probe must not end the batch
                    rec.update(kind="fail", n=0, error=f"{type(e).__name__}: {e}")
                rec.update(seconds=round(time.time() - t0), probed_at=datetime.now(timezone.utc).isoformat())
                with PROBES.open("a", encoding="utf-8") as f:
                    f.write(json.dumps(rec) + "\n")
                log(f"[probe] {g['city']} · {g['keyword_id']} · '{g['phrase']}': {rec['kind']} "
                    f"({rec['n']}) {rec.get('top', '')}")
                n += 1
                if rec["kind"] == "blocked":
                    log("[probe] blocked — stopping the probe batch; the sweep's own block handling decides the rest")
                    break
                await asyncio.sleep(random.uniform(3.0, 6.0))
        finally:
            await browser.close()
    return n


def probe(cities=None, industries=None, keyword_ids=None, headless: bool = True,
          max_probes: Optional[int] = None, log=print) -> int:
    """Probe gates that have no probe yet (see probe_todo). Holds the kwsweep lock. Returns probes written."""
    lock = _lock(log)
    if lock is None:
        return 0
    todo = probe_todo(cities, industries, keyword_ids)[:max_probes]
    log(f"[probe] {len(todo)} gate(s) to probe at the centroid pin")
    return asyncio.run(_probe(todo, headless, log)) if todo else 0


def _lock(log):
    """The kwsweep flock (one browser workload at a time), or None when another run holds it."""
    OUT.mkdir(parents=True, exist_ok=True)
    lock = (OUT / ".lock").open("w")
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        log("[kwsweep] another run holds output/kwsweep/.lock — not starting a second one")
        return None
    return lock


def export_gate(g: dict, verified_only: bool = False) -> int:
    """Re-parse this gate's saved pages with the full extractor; append rows. Returns rows written.
    verified_only (an incomplete gate, 2026-10-30): export just the pins the store verified, so a gate that
    locks at 48/49 keeps its 48. Every exported pin is recorded in exported-pins.jsonl; a pin in that ledger is
    never exported again, so the retry that completes the gate adds only what is new."""
    mk = sweep._market(g["centroid"], g["city"])
    art = gate_dir(g) / f"artifacts_{mk.market_slug}_{g['industry'].lower()}" / g["keyword_id"]
    ts = datetime.now(timezone.utc).isoformat()
    ledger = OUT / "exported-pins.jsonl"
    done = {tuple(r) for r in map(json.loads, ledger.read_text().splitlines())} if ledger.exists() else set()
    only = verified_pins(g) if verified_only else None
    n = 0
    with (OUT / "rows.jsonl").open("a", encoding="utf-8") as f, ledger.open("a", encoding="utf-8") as led:
        for pin in g["pins"]:
            page = art / pin["point_id"] / "viewport.html"
            key = [*gate_key(g), pin["point_id"]]
            if not page.exists() or tuple(key) in done or (only is not None and pin["point_id"] not in only):
                continue
            led.write(json.dumps(key) + "\n")
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
    stuck = stuck_gates()
    left = [g for g in gates if gate_key(g) not in done and gate_key(g) not in stuck]
    secs = [g["seconds"] for g in map(json.loads, (OUT / "gates.jsonl").read_text().splitlines())
            if g.get("status") == "complete"] if (OUT / "gates.jsonl").exists() else []
    per = sorted(secs)[len(secs) // 2] if secs else 934.5      # median; 934.5 s = the 12-city sweep's median gate
    probes = probed()
    kinds: dict = {}
    for r in probes.values():
        kinds[r["kind"]] = kinds.get(r["kind"], 0) + 1
    return {"gates": len(gates), "complete": len(gates) - len(left), "remaining": len(left),
            "next": f"{left[0]['city']} · {left[0]['phrase']}" if left else None,
            "median_gate_seconds": per, "remaining_hours": round(len(left) * per / 3600, 1),
            "paused": (OUT / "STOP").exists(),
            "pruned": len(pruned_gates()),
            "stuck": sorted(f"{c} · {i} · {k} ({n} incomplete)" for (c, i, k), n in stuck.items()),
            "probes": kinds,
            # Probed one business, or a short market: candidates for pruning from keyword-sets.json (Mike decides).
            "pruning_candidates": sorted(f"{r['city_slug']} · {r['keyword_id']} · {r['phrase']} → {r['kind']} ({r['n']})"
                                         for r in probes.values() if r["kind"] in ("place", "short"))}


def run(cities=None, industries=None, keyword_ids=None, headless: bool = True,
        max_hours: Optional[float] = None, max_gates: Optional[int] = None, log=print) -> int:
    """Run gates until the queue, the time budget or the gate budget is exhausted. Returns gates finished."""
    lock = _lock(log)
    if lock is None:
        return 0
    gates, finished = plan(cities, industries, keyword_ids), done_gates()
    todo = [g for g in gates if (g["city_slug"], g["industry"], g["keyword_id"]) not in finished]
    stuck = {} if keyword_ids else stuck_gates()    # naming keywords retries a stuck gate
    if stuck:
        _mark_skipped(stuck, todo)
        log(f"[kwsweep] skipping {sum(gate_key(g) in stuck for g in todo)} stuck gate(s) "
            f"({STUCK_AFTER}+ incomplete attempts in a row): retry with --keywords")
        todo = [g for g in todo if gate_key(g) not in stuck]
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
        # An incomplete gate keeps what it verified (Mike, 2026-10-30: "it discards the other results").
        rows = export_gate(g, verified_only=state != "complete")
        rec = {"city_slug": g["city_slug"], "industry": g["industry"], "keyword_id": g["keyword_id"],
               "phrase": g["phrase"], "status": state, "rows": rows, "seconds": round(time.time() - t0),
               "pins_verified": len(g["pins"]) if state == "complete" else len(verified_pins(g)),
               "finished_at": datetime.now(timezone.utc).isoformat()}
        with (OUT / "gates.jsonl").open("a", encoding="utf-8") as f:
            f.write(json.dumps(rec) + "\n")
        log(f"[kwsweep] {state}: {rows} rows in {rec['seconds']} s")
        n += 1
    return n


if __name__ == "__main__":
    sys.stdout.reconfigure(line_buffering=True)
    print(json.dumps(status(), indent=1))
