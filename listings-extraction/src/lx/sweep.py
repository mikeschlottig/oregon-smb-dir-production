"""
The 12-city BCRF-49 sweep: every city × every industry query × 49 pins × top 20.

Harvesting is rarlx's proven `execute_bcrf49_pipeline`, called unchanged with this city's
manifest pins (`pins_override`) and one query (`keywords_override`) — the exact path that
ran Medford 49/49 with 0 challenges. One gate = one city × one query = 49 pins.

  - Order: city by city (Medford first, the proven market), industries alphabetical.
  - Resume: rarlx skips pins already stored (store.is_pin_completed); re-running continues.
  - An incomplete gate (rarlx exits 1) is logged and the sweep moves on; a re-run retries it.
  - A block that survives rarlx's teardown + entry-path rotation raises — the sweep stops.
  - After each gate, every saved viewport.html is re-parsed with the full card extractor
    into output/sweep/rows.jsonl (append, one line per ranked card), so a dead sweep keeps
    every finished gate.
"""
from __future__ import annotations

import asyncio
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional

from rarlx.bcrf49_linux import MarketConfig, execute_bcrf49_pipeline
from rarlx.fields import extract_full_listings

ROOT = Path(__file__).resolve().parents[2]
MARKETS = ROOT / "markets"
OUT = ROOT / "output" / "sweep"
CITY_ORDER_FIRST = "medford"


def load_markets(cities: Optional[Iterable[str]] = None) -> List[dict]:
    files = sorted(p for p in MARKETS.glob("*.json") if p.stem not in {"queries", "centers"})
    ms = [json.loads(p.read_text()) for p in files]
    ms.sort(key=lambda m: (m["market"]["city_slug"] != CITY_ORDER_FIRST, m["market"]["city_slug"]))
    if cities:
        want = set(cities)
        ms = [m for m in ms if m["market"]["city_slug"] in want]
    for m in ms:
        if len(m["geo_pins"]) != 49:
            raise ValueError(f"{m['market']['city_slug']}: {len(m['geo_pins'])} pins, expected 49")
    return ms


def load_queries(industries: Optional[Iterable[str]] = None) -> Dict[str, dict]:
    q = json.loads((MARKETS / "queries.json").read_text())
    return {k: v for k, v in q.items() if not industries or k in set(industries)}


def plan(cities=None, industries=None) -> List[dict]:
    gates = []
    for m in load_markets(cities):
        city = m["market"]["city"]
        for ind, q in load_queries(industries).items():
            gates.append({
                "city_slug": m["market"]["city_slug"], "city": city, "industry": ind,
                "keyword_id": f"Q-{ind}", "phrase": q["template"].format(term=q["term"], city=city),
                "centroid": m["market"]["market_centroid"], "pins": m["geo_pins"],
            })
    return gates


def _market(m_centroid: dict, city: str) -> MarketConfig:
    return MarketConfig(city=city, state="OR", state_full="Oregon",
                        centroid_lat=m_centroid["latitude"], centroid_lng=m_centroid["longitude"])


def gate_dir(g: dict) -> Path:
    return OUT / g["city_slug"]


def export_gate(g: dict) -> int:
    """Re-parse this gate's saved pages with the full extractor; append rows. Returns rows written."""
    mk = _market(g["centroid"], g["city"])
    art = gate_dir(g) / f"artifacts_{mk.market_slug}_{g['industry'].lower()}" / g["keyword_id"]
    ts = datetime.now(timezone.utc).isoformat()
    n = 0
    with (OUT / "rows.jsonl").open("a", encoding="utf-8") as f:
        for pin in g["pins"]:
            page = art / pin["point_id"] / "viewport.html"
            if not page.exists():
                continue
            for r in extract_full_listings(page.read_text(encoding="utf-8"), max_rank=20):
                r.pop("text_tokens", None)
                f.write(json.dumps({
                    "city_slug": g["city_slug"], "industry": g["industry"], "query": g["phrase"],
                    "point_id": pin["point_id"], "pin_lat": pin["latitude"], "pin_lng": pin["longitude"],
                    "radius_miles": pin["radius_miles"], "bearing": pin["bearing_label"],
                    "exported_at": ts, **r,
                }) + "\n")
                n += 1
    return n


def done_gates() -> set:
    p = OUT / "gates.jsonl"
    if not p.exists():
        return set()
    return {(g["city_slug"], g["industry"]) for g in map(json.loads, p.read_text().splitlines()) if g.get("status") == "complete"}


def run_sweep(cities=None, industries=None, headless: bool = False, log=print) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    gates = plan(cities, industries)
    finished = done_gates()
    log(f"[sweep] {len(gates)} gates ({len(gates) * 49} pin searches); {len(finished)} already complete")
    for i, g in enumerate(gates, 1):
        key = (g["city_slug"], g["industry"])
        if key in finished:
            continue
        log(f"[sweep] gate {i}/{len(gates)}: {g['city']} · '{g['phrase']}'")
        t0 = time.time()
        status = "complete"
        try:
            asyncio.run(execute_bcrf49_pipeline(
                market=_market(g["centroid"], g["city"]), industry=g["industry"], output_dir=gate_dir(g),
                pins_override=g["pins"], keywords_override=[{"keyword_id": g["keyword_id"], "phrase": g["phrase"]}],
                headless=headless,
            ))
        except SystemExit as e:  # rarlx: "GATE LOCKED" — fewer than 49 pins verified
            status = f"incomplete (exit {e.code})"
        rows = export_gate(g) if status == "complete" else 0
        rec = {"city_slug": g["city_slug"], "industry": g["industry"], "phrase": g["phrase"], "status": status,
               "rows": rows, "seconds": round(time.time() - t0), "finished_at": datetime.now(timezone.utc).isoformat()}
        with (OUT / "gates.jsonl").open("a", encoding="utf-8") as f:
            f.write(json.dumps(rec) + "\n")
        log(f"[sweep] {status}: {rows} rows in {rec['seconds']} s")
