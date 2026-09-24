"""
lx — Google Maps listing extraction for one place URL or a queue.

  lx plan   INPUT…                      show the targets; no browser
  lx run    INPUT… --run NAME --yes     visit them (refuses without --yes)
  lx reparse --run NAME                 re-extract every saved page; no browser
  lx export  --run NAME                 write results.csv / results.json from the run
  lx queue  directory SEL… -o FILE      queue from the directory's googleUrls
  lx queue  sweep -o FILE [--template T] [--cities …] [--industries …]
                                        one search per city × industry at the city centroid

INPUT is a Maps URL, a .txt / .jsonl / .csv queue, or a phrase with --lat/--lng.
Run output lives in listings-extraction/output/<NAME>/ (gitignored).
"""
from __future__ import annotations

import argparse
import asyncio
import csv
import json
import sys
from pathlib import Path

from lx import directory
from lx.runner import StaleSelectorsError, extract_rows, run
from lx.store import RunStore
from lx.targets import Target, load_targets, place_target

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output"
FLAT = [
    "target_id", "row_index", "kind", "identity", "business_name", "category", "average_star_rating",
    "number_of_reviews", "address", "address_region", "phone", "phone_e164", "website", "plus_code",
    "weekly_hours", "hours_status", "price", "business_status", "claimed", "feature_id", "cid",
    "place_id", "place_lat", "place_lng", "rank", "maps_url", "final_url",
]


def _targets(args) -> list[Target]:
    return load_targets(args.inputs, args.lat, args.lng, point_for=directory.point_for)


def cmd_plan(args) -> int:
    ts = _targets(args)
    for t in ts:
        where = t.url if t.kind == "place" else f"'{t.query}' @ {t.lat},{t.lng}"
        print(f"{t.kind:6} {t.target_id:32} {where}")
    kinds = {k: sum(t.kind == k for t in ts) for k in ("place", "search")}
    print(f"\n{len(ts)} targets ({kinds['place']} place, {kinds['search']} search)")
    return 0


def cmd_run(args) -> int:
    ts = _targets(args)
    if not args.yes:
        cmd_plan(args)
        print("\nNot run. `lx run` opens real Chrome on Google Maps; pass --yes to proceed.")
        return 2
    store = RunStore(OUTPUT / args.run)
    try:
        counts = asyncio.run(run(ts, store, headless=args.headless, limit=args.limit))
    except StaleSelectorsError as e:
        print(f"\n[STOP] {e}", file=sys.stderr)
        return 3
    finally:
        store.close()
    print(f"\n[lx] run '{args.run}': {counts}")
    return cmd_export(args)


def cmd_reparse(args) -> int:
    store = RunStore(OUTPUT / args.run)
    n = 0
    for ev in store.evidence():
        spec = json.loads(ev["spec"])
        # Re-derive from the URL so a fixed parser (e.g. place-ID → feature-ID) applies to old runs.
        t = place_target(spec["url"], spec["target_id"], name_hint=spec.get("name_hint"), **spec.get("meta", {})) if spec["kind"] == "place" else Target(**spec)
        html = Path(ev["html_path"]).read_text(encoding="utf-8")
        rows = extract_rows(t, html, ev["final_url"] or "", ev["page_kind"] or "unknown")
        store.save_rows(t.target_id, rows)
        n += 1
    store.close()
    print(f"[lx] re-extracted {n} saved pages")
    return cmd_export(args)


def cmd_export(args) -> int:
    store = RunStore(OUTPUT / args.run)
    rows = store.all_rows()
    counts = store.counts()
    store.close()
    out = OUTPUT / args.run
    (out / "results.json").write_text(json.dumps(rows, indent=1), encoding="utf-8")
    with (out / "results.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FLAT, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k) for k in FLAT})
    fill = {k: sum(1 for r in rows if r.get(k) not in (None, "", [])) for k in ("business_name", "address", "phone", "average_star_rating", "number_of_reviews", "website", "weekly_hours")}
    ident = {k: sum(r.get("identity") == k for r in rows) for k in ("match", "mismatch", "unknown")}
    print(f"[lx] targets {counts} | rows {len(rows)} | identity {ident}")
    print(f"[lx] field fill: " + ", ".join(f"{k} {v}/{len(rows)}" for k, v in fill.items()))
    print(f"[lx] wrote {out / 'results.csv'} and results.json")
    return 0


def cmd_queue(args) -> int:
    if args.source == "directory":
        ts = directory.from_directory(args.selectors or ["all"])
    else:
        ts = directory.centroid_sweep(args.template, args.cities, args.industries)
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        for t in ts:
            # The same record shape load_targets reads back (a place re-derives pin/id from its URL).
            if t.kind == "place":
                rec = {"id": t.target_id, "url": t.url, "name_hint": t.name_hint}
            else:
                rec = {"id": t.target_id, "kind": "search", "query": t.query, "lat": t.lat, "lng": t.lng}
            f.write(json.dumps({**rec, **t.meta}) + "\n")
    print(f"[lx] wrote {len(ts)} targets to {args.out}")
    return 0


def cmd_sweep(args) -> int:
    from lx import sweep
    gates = sweep.plan(args.cities, args.industries)
    done = sweep.done_gates()
    for g in gates:
        mark = "done" if (g["city_slug"], g["industry"]) in done else "    "
        print(f"{mark} {g['city_slug']:14} {g['industry']:32} '{g['phrase']}'")
    print(f"\n{len(gates)} gates × 49 pins = {len(gates) * 49} pin searches; {len(done)} gates complete; "
          f"≈{(len(gates) - len(done)) * 49 * 16.5 / 3600:.1f} h at the Medford run's 16.5 s/pin")
    if not args.yes:
        print("Not run. Pass --yes to start (real Chrome on Google Maps; resumable).")
        return 2
    sweep.run_sweep(args.cities, args.industries, headless=args.headless)
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="lx", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    def inputs(p):
        p.add_argument("inputs", nargs="+")
        p.add_argument("--lat", type=float)
        p.add_argument("--lng", type=float)

    p = sub.add_parser("plan"); inputs(p); p.set_defaults(fn=cmd_plan)
    p = sub.add_parser("run"); inputs(p)
    p.add_argument("--run", required=True, help="run name; output/<run>/ is created or resumed")
    p.add_argument("--yes", action="store_true", help="actually open Chrome on Google Maps")
    p.add_argument("--headless", action="store_true", help="default is headed (rar-linux §3.3: headless shows the SwiftShader tell)")
    p.add_argument("--limit", type=int)
    p.set_defaults(fn=cmd_run)
    for name, fn in (("reparse", cmd_reparse), ("export", cmd_export)):
        p = sub.add_parser(name); p.add_argument("--run", required=True); p.set_defaults(fn=fn)
    p = sub.add_parser("queue")
    p.add_argument("source", choices=["directory", "sweep"])
    p.add_argument("selectors", nargs="*", help="directory: all | city__industry | city__industry/slug")
    p.add_argument("-o", "--out", required=True)
    p.add_argument("--template", default="best {industry} in {city} oregon")
    p.add_argument("--cities", nargs="*")
    p.add_argument("--industries", nargs="*")
    p.set_defaults(fn=cmd_queue)

    p = sub.add_parser("sweep", help="12-city BCRF-49 sweep: city × industry query × 49 pins × top 20")
    p.add_argument("--cities", nargs="*")
    p.add_argument("--industries", nargs="*")
    p.add_argument("--yes", action="store_true")
    p.add_argument("--headless", action="store_true")
    p.set_defaults(fn=cmd_sweep)

    args = ap.parse_args(argv)
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
