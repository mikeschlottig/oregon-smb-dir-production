"""
Builds one BCRF-49 market manifest per directory city, in the shape of Medford's master
manifest (MEDFORD_49_GEO_PINS_MASTER_MANIFEST_V_0_01.json). No network.

Centre — the median of the city's own listings' Google place pins (lx.directory.centroids):
only records whose street address says OR and whose `!3d!4d` pin is inside Oregon. BCRF is a
Business-Centred Relative Frame; this is where the city's businesses actually sit.
Medford keeps its master manifest unchanged (the proven frame). A first attempt geocoded
downtown intersections through OpenStreetMap Overpass; the public instances stalled for
minutes per city, and it was dropped (Mike, 2026-09-24). See WORKFLOW.md.

Pins — rarlx.generate_bcrf49_grid, the generator that reproduces Medford's master manifest
to within 0.00035° (≈0.03 mi at the 8-mile ring).

  uv run python markets/build_markets.py   → markets/<slug>.json ×12, markets/centers.json
"""
from __future__ import annotations

import json
import math
from pathlib import Path

from rarlx.bcrf49_linux import MarketConfig, generate_bcrf49_grid

from lx import directory

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
                                "location_description": f"{name} business centre (median of the directory's {name} listing pins)"},
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
        center = medians[slug]
        pins = generate_bcrf49_grid(MarketConfig(name, "OR", "Oregon", center[0], center[1], county=f"{COUNTIES[slug]} County"))
        evidence = {"method": "median of the city's Oregon-address listing pins (!3d!4d), lx.directory.centroids",
                    "listing_pins_used": counts[slug]}
        (HERE / f"{slug}.json").write_text(json.dumps(manifest(slug, name, COUNTIES[slug], center, pins, evidence), indent=2) + "\n")
        centers[slug] = {"center": center, **evidence}
        print(f"{slug:14} {center[0]:.6f},{center[1]:.6f}  from {counts[slug]} listing pins")

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
