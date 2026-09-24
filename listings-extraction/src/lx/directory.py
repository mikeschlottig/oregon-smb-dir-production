"""
Queues built from the Oregon SMB Directory's own data (../src/data). Read-only: nothing
here writes into the site.

  from_directory(["portland__legal-services", "albany__automotive/andy-s-auto-detailing…"])
      every listing's googleUrl as a place target (search target by name + address when a
      record has no place URL)
  centroid_sweep("best {industry} in {city} oregon")
      one search per city × industry, at the city's centroid
  point_for(record)
      the centroid for a queue record that names a shard but carries no point

A city's centroid is the median of its own listings' Google place pins, taking only records
whose street address says OR and whose pin is inside Oregon — derived from data already in
hand, no geocoder.
"""
from __future__ import annotations

import json
import re
import statistics
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from lx.targets import Target, pin_of, place_target, search_target

SITE = Path(__file__).resolve().parents[3]
DATA = SITE / "src" / "data"
OREGON_BOX = (41.9, 46.4, -124.8, -116.3)


def _names(ts_file: str) -> Dict[str, str]:
    text = (DATA / ts_file).read_text(encoding="utf-8")
    return {slug: name for name, slug in re.findall(r'name:\s*"([^"]+)",\s*slug:\s*"([^"]+)"', text)}


@lru_cache(maxsize=1)
def cities() -> Dict[str, str]:
    return _names("cities.ts")


@lru_cache(maxsize=1)
def industries() -> Dict[str, str]:
    return _names("industries.ts")


def shards() -> List[str]:
    return sorted(p.stem for p in (DATA / "businesses").glob("*__*.json"))


def records(shard: str) -> List[Dict[str, Any]]:
    return json.loads((DATA / "businesses" / f"{shard}.json").read_text(encoding="utf-8"))


def _in_oregon(lat: float, lng: float) -> bool:
    return OREGON_BOX[0] <= lat <= OREGON_BOX[1] and OREGON_BOX[2] <= lng <= OREGON_BOX[3]


@lru_cache(maxsize=1)
def _oregon_pins() -> Dict[str, List[Tuple[float, float]]]:
    pins: Dict[str, List[Tuple[float, float]]] = {}
    for shard in shards():
        city = shard.split("__")[0]
        for r in records(shard):
            if not re.search(r",\s*OR\s+\d{5}", r.get("address") or ""):
                continue
            pin = pin_of(r.get("googleUrl") or "")
            if pin and "!3d" in (r.get("googleUrl") or "") and _in_oregon(*pin):
                pins.setdefault(city, []).append(pin)
    return pins


def centroid_pin_counts() -> Dict[str, int]:
    return {c: len(p) for c, p in _oregon_pins().items()}


@lru_cache(maxsize=1)
def centroids() -> Dict[str, Tuple[float, float]]:
    pins = _oregon_pins()
    return {
        city: (round(statistics.median(p[0] for p in pts), 6), round(statistics.median(p[1] for p in pts), 6))
        for city, pts in pins.items() if len(pts) >= 5
    }


def point_for(rec: Dict[str, Any]) -> Optional[Tuple[float, float]]:
    city = rec.get("city_slug") or (rec.get("shard") or "").split("__")[0]
    return centroids().get(city)


def from_directory(selectors: List[str]) -> List[Target]:
    """`all`, a shard (`city__industry`), or one listing (`city__industry/slug`)."""
    out: List[Target] = []
    wanted = shards() if selectors == ["all"] else selectors
    for sel in wanted:
        shard, _, slug = sel.partition("/")
        city = shard.split("__")[0]
        for r in records(shard):
            if slug and r.get("slug") != slug:
                continue
            meta = dict(shard=shard, slug=r.get("slug"), directory_title=r.get("title"),
                        directory_address=r.get("address"), directory_phone=r.get("phone"),
                        city=cities().get(city, city), name_hint=r.get("title"))
            url = r.get("googleUrl") or ""
            if "/maps/place/" in url or "0x" in url or "query_place_id=" in url:
                out.append(place_target(url, **meta))
            elif city in centroids():
                q = " ".join(x for x in [r.get("title"), r.get("address") or cities().get(city, city), "Oregon"] if x)
                meta.pop("name_hint")
                out.append(search_target(q, *centroids()[city], **meta))
    return out


def centroid_sweep(template: str = "best {industry} in {city} oregon", city_slugs: Optional[List[str]] = None,
                   industry_slugs: Optional[List[str]] = None) -> List[Target]:
    out: List[Target] = []
    for c in city_slugs or sorted(centroids()):
        if c not in centroids():
            raise ValueError(f"no centroid for city '{c}' (fewer than 5 Oregon place pins)")
        for i in industry_slugs or sorted(industries()):
            q = template.format(industry=industries()[i], city=cities().get(c, c))
            out.append(search_target(q, *centroids()[c], target_id=f"sweep-{c}-{i}", city_slug=c, industry_slug=i, city=cities().get(c, c)))
    return out
