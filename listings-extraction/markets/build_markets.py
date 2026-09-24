"""
Builds one BCRF-49 market manifest per directory city, in the shape of Medford's master
manifest (MEDFORD_49_GEO_PINS_MASTER_MANIFEST_V_0_01.json). No network.

Centre — the city's downtown point, as OpenStreetMap's geocoder (Nominatim) returns it for
"<city>, Oregon": the label point OSM places on the city's centre. Same logic as Medford's
hand-picked "Downtown Commercial Core (Central Ave & Main St)" — and checked against it:
Nominatim's Medford is 0.19 mi from the master centroid. One request per city, 1.1 s apart
(Nominatim fair use), and the answers are saved to markets/centers.json, so the sweep never
depends on the network. Guard: a centre more than 3 mi from the median of the city's own
listing pins is a wrong match, and the build stops. Medford keeps its master manifest.
Earlier attempts and why they were replaced: WORKFLOW.md.

Pins — rarlx.generate_bcrf49_grid, the generator that reproduces Medford's master manifest
to within 0.00035° (≈0.03 mi at the 8-mile ring).

  uv run python markets/build_markets.py   → markets/<slug>.json ×12, markets/centers.json
"""
from __future__ import annotations

import json
import math
from pathlib import Path

from rarlx.bcrf49_linux import MarketConfig, generate_bcrf49_grid

import time
import urllib.parse
import urllib.request

from lx import directory

NOMINATIM = "https://nominatim.openstreetmap.org/search"
UA = "oregonsmbdirectory-market-builder/1.0 (+https://oregonsmbdirectory.com/)"


def geocode_city(name: str) -> dict:
    q = urllib.parse.urlencode({"city": name, "state": "Oregon", "country": "USA", "format": "jsonv2", "limit": 1})
    with urllib.request.urlopen(urllib.request.Request(f"{NOMINATIM}?{q}", headers={"User-Agent": UA}), timeout=20) as r:
        hit = json.load(r)[0]
    return {"lat": round(float(hit["lat"]), 6), "lng": round(float(hit["lon"]), 6), "osm": f"{hit['osm_type']}/{hit['osm_id']}", "display_name": hit["display_name"]}

HERE = Path(__file__).resolve().parent
MEDFORD_MASTER = Path(
    "/mnt/c/Dev/standalone-archives-and-zips/ranks-above-replacement-20260913T085954Z-1-001/"
    "MEDFORD_49_GEO_PINS_MASTER_MANIFEST_V_0_01.json"
)
COUNTIES = {
    "albany": "Linn", "ashland": "Jackson", "bend": "Deschutes", "corvallis": "Benton", "eugene": "Lane",
    "grants-pass": "Josephine", "klamath-falls": "Klamath", "medford": "Jackson", "portland": "Multnomah",
    "roseburg": "Douglas", "salem": "Marion", "springfield": "Lane",
}


def miles(a, b) -> float:
    la1, lo1, la2, lo2 = map(math.radians, (*a, *b))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 3958.7613 * math.asin(math.sqrt(h))


def manifest(slug, name, county, center, pins, evidence) -> dict:
    return {
        "title": f"Master 49-Pin BCRF Geo-Sampling Frame — {name}, Oregon",
        "version": "0.01",
        "organization": "LEVERAGEAI LLC",
        "market": {
            "city": name, "city_slug": slug, "state": "Oregon", "county": f"{county} County",
            "market_centroid": {"latitude": center[0], "longitude": center[1],
                                "location_description": f"Downtown {name} (OpenStreetMap city centre)"},
            "geometry_framework": "BCRF-49 (Logarithmic Radial Polar Frame)",
            "total_geo_pins": 49,
            "radii_progression_miles": [0.0, 0.25, 0.5, 1.0, 2.0, 4.0, 8.0],
            "compass_bearings": ["N (0°)", "NE (45°)", "E (90°)", "SE (135°)", "S (180°)", "SW (225°)", "W (270°)", "NW (315°)"],
            "centroid_evidence": evidence,
        },
        "geo_pins": [
            {
                "pin_number": i, "point_id": p["point_id"], "latitude": p["latitude"], "longitude": p["longitude"],
                "radius_miles": p["radius_miles"], "bearing_label": p["bearing_label"], "bearing_degrees": p["bearing_degrees"],
                "viewport_zoom": 14,
                "target_maps_url_template": f"https://www.google.com/maps/search/{{encoded_query}}/@{p['latitude']:.6f},{p['longitude']:.6f},14z",
            }
            for i, p in enumerate(pins, 1)
        ],
    }


def main() -> None:
    medians = directory.centroids()
    counts = directory.centroid_pin_counts()
    centers = {}
    for slug, name in sorted(directory.cities().items()):
        if slug == "medford":
            continue
        g = geocode_city(name)
        time.sleep(1.1)
        center = (g["lat"], g["lng"])
        gap = round(miles(center, medians[slug]), 2)
        if gap > 3.0:
            raise SystemExit(f"{slug}: Nominatim centre {center} is {gap} mi from the city's listing median — wrong match? {g}")
        pins = generate_bcrf49_grid(MarketConfig(name, "OR", "Oregon", center[0], center[1], county=f"{COUNTIES[slug]} County"))
        evidence = {"method": "OpenStreetMap Nominatim city centre for '<city>, Oregon' (the city's downtown label point)",
                    "osm_object": g["osm"], "display_name": g["display_name"],
                    "miles_from_listing_median": gap, "listing_pins_in_median": counts[slug]}
        (HERE / f"{slug}.json").write_text(json.dumps(manifest(slug, name, COUNTIES[slug], center, pins, evidence), indent=2) + "\n")
        centers[slug] = {"center": center, **evidence}
        print(f"{slug:14} {center[0]:.6f},{center[1]:.6f}  {g['osm']:18} {gap:4.2f} mi from listing median")

    m = json.loads(MEDFORD_MASTER.read_text())
    m["market"]["city_slug"] = "medford"
    m["market"]["centroid_evidence"] = {"method": "Medford master manifest, copied unchanged", "source": str(MEDFORD_MASTER)}
    (HERE / "medford.json").write_text(json.dumps(m, indent=2) + "\n")
    c = m["market"]["market_centroid"]
    gap = round(miles((c["latitude"], c["longitude"]), medians["medford"]), 2)
    centers["medford"] = {"center": (c["latitude"], c["longitude"]), "method": "master manifest", "miles_from_listing_median": gap}
    print(f"{'medford':14} {c['latitude']:.6f},{c['longitude']:.6f}  master manifest; its listing median is {gap} mi away")
    (HERE / "centers.json").write_text(json.dumps(centers, indent=2) + "\n")


if __name__ == "__main__":
    main()
