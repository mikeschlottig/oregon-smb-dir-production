"""
What to extract. Every input shape becomes a list of `Target`:

  place   a Google Maps place URL (/maps/place/…, or any URL carrying a feature ID). One
          business; the place page is loaded and every panel field is read.
  search  a Maps search phrase at a point. The proven top-20 harvest (rarlx
          harvest_single_pin) runs and every result card is read.

Inputs accepted by `load_targets`:
  - a URL string                         → place
  - *.txt   one URL or phrase per line   → place / search (search needs --lat/--lng)
  - *.jsonl {"url"| "query", "lat", "lng", "id", …}   (reports/out-of-state-*.queue.jsonl
            from the directory is this shape)
  - *.csv   a googleUrl / url / maps_url column, or a query column with lat/lng columns
"""
from __future__ import annotations

import csv
import hashlib
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional
from urllib.parse import parse_qs, unquote_plus, urlsplit, urlunsplit

FEATURE_ID = re.compile(r"(0x[0-9a-fA-F]+):(0x[0-9a-fA-F]+)")
PLACE_PIN = re.compile(r"!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)")
VIEWPORT = re.compile(r"/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)")
PLACE_NAME = re.compile(r"/maps/place/([^/@?]+)")


@dataclass
class Target:
    target_id: str
    kind: str  # "place" | "search"
    url: Optional[str] = None
    query: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    name_hint: Optional[str] = None
    expect_feature_id: Optional[str] = None
    expect_place_id: Optional[str] = None
    meta: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in self.__dict__.items() if v not in (None, {}, "")}


def feature_id_of(url: str) -> Optional[str]:
    """The place's feature ID — the last `0x…:0x…` in the URL (earlier ones can be the search's)."""
    found = FEATURE_ID.findall(url or "")
    return f"{found[-1][0]}:{found[-1][1]}".lower() if found else None


def pin_of(url: str) -> Optional[tuple[float, float]]:
    """The place pin (`!3d!4d`, last wins), else the viewport centre (`/@lat,lng`)."""
    pins = PLACE_PIN.findall(url or "")
    if pins:
        return float(pins[-1][0]), float(pins[-1][1])
    vp = VIEWPORT.search(url or "")
    return (float(vp.group(1)), float(vp.group(2))) if vp else None


def name_of(url: str) -> Optional[str]:
    m = PLACE_NAME.search(url or "")
    return unquote_plus(m.group(1)) if m else None


def place_id_to_feature_id(place_id: Optional[str]) -> Optional[str]:
    """
    A `ChIJ…` place ID is base64url protobuf: 0a 12 | 09 <fixed64 LE> | 11 <fixed64 LE>, and
    the two fixed64 values are the halves of the feature ID `0x…:0x…`. Verified on the first
    live pages (Deepli Clean: ChIJZ1Zzyzwg6GcRcn-fRTAHw6s → 0x67e8203ccb735667:0xabc30730459f7f72,
    the feature ID the browser landed on). None for any other shape.
    """
    import base64
    if not place_id or not place_id.startswith("ChIJ"):
        return None
    try:
        raw = base64.urlsafe_b64decode(place_id + "=" * (-len(place_id) % 4))
    except (ValueError, TypeError):
        return None
    if len(raw) < 20 or raw[0:3] != b"\x0a\x12\x09" or raw[11] != 0x11:
        return None
    hi = int.from_bytes(raw[3:11], "little")
    lo = int.from_bytes(raw[12:20], "little")
    return f"0x{hi:x}:0x{lo:x}"


def feature_id_to_place_id(feature_id: Optional[str]) -> Optional[str]:
    """The exact inverse of place_id_to_feature_id: `0x<hi>:0x<lo>` → `ChIJ…` (base64url of
    0a 12 | 09 <hi fixed64 LE> | 11 <lo fixed64 LE>, unpadded). Round-trips on the live pairs."""
    import base64
    m = FEATURE_ID.fullmatch(feature_id or "")
    if not m:
        return None
    hi, lo = int(m.group(1), 16), int(m.group(2), 16)
    raw = b"\x0a\x12\x09" + hi.to_bytes(8, "little") + b"\x11" + lo.to_bytes(8, "little")
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def api_place_id(url: str) -> Optional[str]:
    """`query_place_id` of a Maps URLs-API link (`/maps/search/?api=1&query=…&query_place_id=ChIJ…`)."""
    q = parse_qs(urlsplit(url or "").query)
    return (q.get("query_place_id") or [None])[0] if q.get("api") == ["1"] else None


def canonical_place_url(url: str) -> str:
    """Drop the query string (`?entry=ttu&g_ep=…` share/session tokens); path and data stay.
    A Maps URLs-API link keeps its query — the query *is* the address of the place."""
    parts = urlsplit(url.strip())
    query = parts.query if api_place_id(url) else ""
    return urlunsplit((parts.scheme or "https", parts.netloc or "www.google.com", parts.path, query, ""))


def _stable_id(*parts: Any) -> str:
    return hashlib.sha1("|".join(str(p) for p in parts).encode()).hexdigest()[:12]


def place_target(url: str, target_id: Optional[str] = None, **meta: Any) -> Target:
    url = canonical_place_url(url)
    fid = feature_id_of(url)
    pid = api_place_id(url)
    pin = pin_of(url)
    api_name = (parse_qs(urlsplit(url).query).get("query") or [None])[0] if pid else None
    return Target(
        target_id=target_id or (f"fid-{fid.replace(':', '-')}" if fid else f"pid-{pid}" if pid else f"url-{_stable_id(url)}"),
        kind="place",
        url=url,
        lat=pin[0] if pin else meta.pop("lat", None),
        lng=pin[1] if pin else meta.pop("lng", None),
        name_hint=meta.pop("name_hint", None) or name_of(url) or api_name,
        expect_feature_id=fid or place_id_to_feature_id(pid),
        expect_place_id=pid,
        meta={k: v for k, v in meta.items() if v is not None},
    )


def search_target(query: str, lat: float, lng: float, target_id: Optional[str] = None, **meta: Any) -> Target:
    if lat is None or lng is None:
        raise ValueError(f"search target '{query}' needs lat/lng (the harvest runs at a point)")
    return Target(
        target_id=target_id or f"q-{_stable_id(query, round(lat, 5), round(lng, 5))}",
        kind="search",
        query=query.strip(),
        lat=float(lat),
        lng=float(lng),
        meta={k: v for k, v in meta.items() if v is not None},
    )


def _is_maps_url(s: str) -> bool:
    return s.startswith("http") and ("google." in s and "/maps" in s or "goo.gl/maps" in s or "maps.app.goo.gl" in s)


def _from_record(rec: Dict[str, Any], default_lat: Optional[float], default_lng: Optional[float], point_for=None) -> Target:
    url = rec.get("url") or rec.get("googleUrl") or rec.get("maps_url") or rec.get("blockedPlaceUrl") if rec.get("kind") != "search" else None
    tid = rec.get("id") or rec.get("target_id")
    meta = {k: v for k, v in rec.items() if k not in {"url", "googleUrl", "maps_url", "query", "lat", "lng", "id", "target_id", "kind"}}
    if url:
        return place_target(url, tid, lat=rec.get("lat"), lng=rec.get("lng"), **meta)
    query = rec.get("query")
    if not query:
        raise ValueError(f"record has neither a Maps URL nor a query: {rec}")
    lat, lng = rec.get("lat", default_lat), rec.get("lng", default_lng)
    if (lat is None or lng is None) and point_for:
        lat, lng = point_for(rec) or (None, None)
    return search_target(query, lat, lng, tid, **meta)


def load_targets(inputs: Iterable[str], lat: Optional[float] = None, lng: Optional[float] = None, point_for=None) -> List[Target]:
    """`point_for(record) -> (lat, lng) | None` fills a search record that carries no point
    (e.g. the directory's out-of-state queue names a shard; lx.directory maps it to a centroid)."""
    out: List[Target] = []
    for item in inputs:
        p = Path(item)
        if _is_maps_url(item):
            out.append(place_target(item))
        elif p.suffix == ".jsonl" and p.exists():
            for n, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
                if line.strip():
                    try:
                        out.append(_from_record(json.loads(line), lat, lng, point_for))
                    except ValueError as e:
                        raise ValueError(f"{p}:{n}: {e}") from e
        elif p.suffix == ".csv" and p.exists():
            with p.open(newline="", encoding="utf-8") as f:
                for rec in csv.DictReader(f):
                    rec = {k: (float(v) if k in ("lat", "lng") and v else v) for k, v in rec.items() if v not in (None, "")}
                    out.append(_from_record(rec, lat, lng, point_for))
        elif p.suffix == ".txt" and p.exists():
            for line in p.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                out.append(place_target(line) if _is_maps_url(line) else search_target(line, lat, lng))
        elif lat is not None and lng is not None:
            out.append(search_target(item, lat, lng))
        else:
            raise ValueError(f"not a Maps URL, not a readable .txt/.jsonl/.csv, and no --lat/--lng for a search: {item}")
    # One target per id, first wins: a queue can name the same place twice.
    seen, unique = set(), []
    for t in out:
        if t.target_id not in seen:
            seen.add(t.target_id)
            unique.append(t)
    return unique
