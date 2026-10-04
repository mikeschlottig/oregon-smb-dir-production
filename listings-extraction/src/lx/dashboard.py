"""
Sweep dashboard — output/sweep/dashboard.html, a self-contained page rebuilt only when a
49-pin gate finishes (a line lands in gates.jsonl). The open browser tab reloads itself
every 2 minutes, so it always shows the latest finished gate.

  uv run lx dashboard            rebuild now
  uv run lx dashboard --watch    rebuild whenever gates.jsonl grows (for a sweep already running)
  uv run lx status               one-line progress summary (what the 50-minute check-in reads)

Leader columns are raw counts — how many of the 49 pins had the business in Google's top 3 —
not a score.
"""
from __future__ import annotations

import html
import json
import os
import time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Tuple

from lx import sweep

OUT = sweep.OUT
PAGE = OUT / "dashboard.html"


def _gates() -> List[dict]:
    p = OUT / "gates.jsonl"
    return [json.loads(l) for l in p.read_text().splitlines() if l.strip()] if p.exists() else []


def _latest_by_key(gates: List[dict]) -> Dict[Tuple[str, str], dict]:
    out: Dict[Tuple[str, str], dict] = {}
    for g in gates:
        out[(g["city_slug"], g["industry"])] = g  # later lines win (a retried gate)
    return out


def _leaders(complete: set) -> Dict[Tuple[str, str], List[Tuple[str, int]]]:
    """Per finished gate: businesses by how many of the 49 pins had them in the top 3."""
    rows = OUT / "rows.jsonl"
    top3: Dict[Tuple[str, str], Counter] = defaultdict(Counter)
    if rows.exists():
        with rows.open(encoding="utf-8") as f:
            for line in f:
                r = json.loads(line)
                key = (r["city_slug"], r["industry"])
                if key in complete and (r.get("rank") or 99) <= 3:
                    top3[key][r.get("business_name") or "?"] += 1
    return {k: c.most_common(3) for k, c in top3.items()}


def _blocks() -> int:
    log = OUT.parent / "sweep.log"
    return log.read_text(errors="ignore").count("[BLOCK]") if log.exists() else 0


def status_line() -> str:
    plan = sweep.plan()
    latest = _latest_by_key(_gates())
    done = [g for g in latest.values() if g["status"] == "complete"]
    incomplete = [g for g in latest.values() if g["status"] != "complete"]
    rows = sum(g["rows"] for g in done)
    secs = [g["seconds"] for g in done if g.get("seconds")]
    left = len(plan) - len(done)
    eta_h = left * (sum(secs) / len(secs)) / 3600 if secs else left * 49 * 16.5 / 3600
    alive = os.system("pgrep -f '(lx[.]cli|bin/lx) sweep' >/dev/null 2>&1") == 0
    last = max(latest.values(), key=lambda g: g["finished_at"]) if latest else None
    return (f"sweep {'RUNNING' if alive else 'STOPPED'} | gates {len(done)}/{len(plan)} complete, {len(incomplete)} incomplete | "
            f"{rows} rows | blocks {_blocks()} | ~{eta_h:.1f} h left"
            + (f" | last: {last['city_slug']}/{last['industry']} {last['status']} {last['rows']} rows" if last else ""))


def build() -> Path:
    plan = sweep.plan()
    latest = _latest_by_key(_gates())
    complete = {k for k, g in latest.items() if g["status"] == "complete"}
    leaders = _leaders(complete)
    cities: List[Tuple[str, str]] = []
    industries: List[Tuple[str, str]] = []
    for g in plan:
        if (g["city_slug"], g["city"]) not in cities:
            cities.append((g["city_slug"], g["city"]))
        if (g["industry"], g["phrase"]) and g["industry"] not in [i for i, _ in industries]:
            term = g["phrase"].split("best ", 1)[1].split(" in ", 1)[0]
            industries.append((g["industry"], term))
    next_gate = next(((g["city_slug"], g["industry"]) for g in plan if (g["city_slug"], g["industry"]) not in complete), None)
    done = [latest[k] for k in complete]
    rows = sum(g["rows"] for g in done)
    secs = [g["seconds"] for g in done if g.get("seconds")]
    avg = sum(secs) / len(secs) if secs else 49 * 16.5
    left = len(plan) - len(done)
    pct = 100 * len(done) / len(plan) if plan else 0
    now = datetime.now().astimezone()
    eta = datetime.fromtimestamp(time.time() + left * avg).astimezone()
    e = html.escape

    def cell(city: str, ind: str) -> str:
        g = latest.get((city, ind))
        if g and g["status"] == "complete":
            tip = "; ".join(f"{n} ({c}/49 pins top-3)" for n, c in leaders.get((city, ind), []))
            return f'<td class="done" title="{e(tip)}">{g["rows"]}</td>'
        if g:
            return f'<td class="bad" title="{e(g["status"])}">!</td>'
        if (city, ind) == next_gate:
            return '<td class="next" title="running now">•</td>'
        return '<td class="todo"></td>'

    grid = "".join(
        f'<tr><th scope="row">{e(name)}</th>' + "".join(cell(slug, i) for i, _ in industries) + "</tr>"
        for slug, name in cities
    )
    head = "".join(f'<th scope="col"><span>{e(t)}</span></th>' for _, t in industries)
    recent = sorted(done, key=lambda g: g["finished_at"], reverse=True)[:12]
    recent_rows = "".join(
        f"<tr><td>{e(g['finished_at'][11:16])} UTC</td><td>{e(g['phrase'])}</td><td class=num>{g['rows']}</td>"
        f"<td class=num>{g['seconds'] // 60} min</td><td>{e('; '.join(f'{n} ({c})' for n, c in leaders.get((g['city_slug'], g['industry']), [])))}</td></tr>"
        for g in recent
    ) or '<tr><td colspan=5 class="muted">No gate has finished yet — the first lands ≈14 min after the sweep starts.</td></tr>'

    page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="120">
<title>Sweep Progress</title>
<style>
:root {{ --bg:#f7f6f2; --fg:#1d2320; --muted:#6b736e; --card:#ffffff; --line:#dedbd2;
  --done:#2f6f4f; --done-fg:#ffffff; --next:#c98a1b; --bad:#b3402e; --todo:#ecebe5; }}
@media (prefers-color-scheme: dark) {{ :root {{ --bg:#141816; --fg:#e7ebe8; --muted:#98a29c; --card:#1d2220;
  --line:#2e3532; --done:#3f9a6c; --done-fg:#0f1411; --next:#e0a53a; --bad:#e0654f; --todo:#262c29; }} }}
* {{ box-sizing:border-box; }}
body {{ margin:0; background:var(--bg); color:var(--fg); font:15px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif; }}
main {{ max-width:1180px; margin:0 auto; padding:24px 16px 48px; }}
h1 {{ font-size:22px; margin:0 0 4px; }} h2 {{ font-size:16px; margin:28px 0 10px; }}
.muted {{ color:var(--muted); }}
.stats {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; margin:18px 0; }}
.stat {{ background:var(--card); border:1px solid var(--line); border-radius:10px; padding:12px 14px; }}
.stat b {{ display:block; font-size:24px; font-variant-numeric:tabular-nums; }}
.bar {{ height:10px; background:var(--todo); border-radius:6px; overflow:hidden; }}
.bar i {{ display:block; height:100%; width:{pct:.2f}%; background:var(--done); }}
.scroll {{ overflow-x:auto; background:var(--card); border:1px solid var(--line); border-radius:10px; padding:10px; }}
table {{ border-collapse:collapse; }}
.grid th[scope=row] {{ text-align:right; padding-right:10px; white-space:nowrap; font-weight:500; }}
.grid th[scope=col] {{ height:120px; vertical-align:bottom; padding:0 2px; }}
.grid th[scope=col] span {{ display:inline-block; writing-mode:vertical-rl; transform:rotate(180deg); font-weight:500; font-size:13px; }}
.grid td {{ width:46px; height:30px; text-align:center; font-size:12px; border:2px solid var(--card); border-radius:6px; font-variant-numeric:tabular-nums; }}
td.done {{ background:var(--done); color:var(--done-fg); }} td.next {{ background:var(--next); color:#fff; font-size:18px; }}
td.bad {{ background:var(--bad); color:#fff; font-weight:700; }} td.todo {{ background:var(--todo); }}
.legend span {{ display:inline-flex; align-items:center; gap:6px; margin-right:16px; font-size:13px; }}
.legend i {{ width:14px; height:14px; border-radius:4px; display:inline-block; }}
.recent {{ width:100%; }} .recent td, .recent th {{ text-align:left; padding:7px 8px; border-bottom:1px solid var(--line); vertical-align:top; }}
.num {{ text-align:right !important; font-variant-numeric:tabular-nums; }}
</style></head>
<body><main>
<h1>12-city BCRF-49 sweep</h1>
<div class="muted">Updated {e(now.strftime('%a %b %-d, %-I:%M %p %Z'))}, when the last 49-pin gate finished · this tab reloads every 2 min</div>
<div class="stats">
 <div class="stat"><b>{len(done)} / {len(plan)}</b>gates complete</div>
 <div class="stat"><b>{len(done) * 49:,} / {len(plan) * 49:,}</b>pins searched</div>
 <div class="stat"><b>{rows:,}</b>ranked cards collected</div>
 <div class="stat"><b>{avg / 60:.1f} min</b>per gate (avg)</div>
 <div class="stat"><b>{e(eta.strftime('%a %-I:%M %p'))}</b>estimated finish</div>
 <div class="stat"><b>{_blocks()}</b>blocks (challenges)</div>
</div>
<div class="bar" role="progressbar" aria-valuenow="{pct:.0f}" aria-valuemin="0" aria-valuemax="100"><i></i></div>
<h2>City × query</h2>
<div class="legend muted"><span><i style="background:var(--done)"></i>complete — number is cards collected; hover for top-3 leaders</span>
<span><i style="background:var(--next)"></i>running now</span><span><i style="background:var(--bad)"></i>incomplete, will retry</span>
<span><i style="background:var(--todo)"></i>queued</span></div>
<div class="scroll"><table class="grid"><thead><tr><th></th>{head}</tr></thead><tbody>{grid}</tbody></table></div>
<h2>Latest finished gates</h2>
<div class="scroll"><table class="recent"><thead><tr><th>finished</th><th>query</th><th class=num>cards</th><th class=num>took</th>
<th>most often top-3 (pins out of 49)</th></tr></thead><tbody>{recent_rows}</tbody></table></div>
<p class="muted">Query: "best {{top Google category}} in {{city}} oregon" · 49 pins per city (0–8 mi, 8 bearings) · top 20 per pin ·
data: listings-extraction/output/sweep/rows.jsonl</p>
</main></body></html>
"""
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = PAGE.with_suffix(".tmp")
    tmp.write_text(page, encoding="utf-8")
    tmp.replace(PAGE)  # atomic: an open tab never reloads a half-written page
    return PAGE


def watch(interval: float = 20.0) -> None:
    """Rebuild whenever gates.jsonl grows. Local file stat only — no network, no Google."""
    gates = OUT / "gates.jsonl"
    seen = -1
    build()
    while True:
        size = gates.stat().st_size if gates.exists() else 0
        if size != seen:
            seen = size
            build()
            print(f"[dashboard] rebuilt {datetime.now(timezone.utc).isoformat()} — {status_line()}", flush=True)
        if os.system("pgrep -f 'lx[.]cli sweep' >/dev/null 2>&1") != 0 and size == seen:
            build()
            print("[dashboard] sweep process gone; final rebuild done", flush=True)
            return
        time.sleep(interval)
