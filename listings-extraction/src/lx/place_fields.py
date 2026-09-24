"""
Every field a Google Maps place page exposes without clicking into tabs.

No proven extractor reads a place page — rarlx.fields reads result cards
(docs/RAR-SCRAPER-COMPOSITION-ANALYSIS.md §3: "a single place page uses different markup
that this extractor doesn't parse [H]"). So this module is built to fail loudly and cheaply:

  - Selectors key on Google's semantic attributes first — `data-item-id` ("address",
    "authority", "phone:tel:…", "oloc") and aria-labels ("4.6 stars", "Address: …") —
    and only fall back to generated class names (DUwDvf, F7nice, DkEaL). **[H]** every
    selector here is written from knowledge of the markup, not yet checked against a page
    saved on this machine. The first live place page must be checked with `lx reparse`.
  - Each field records which selector produced it (`_sources`), so a field that silently
    fell back is visible.
  - Every `[data-item-id]` in the panel is kept raw (`panel_items`), and the page itself is
    saved, so a stale selector costs a reparse, never a second visit.
  - URL-derived identity (feature ID, CID, pin, place ID) does not depend on markup at all.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple

from scrapling import Selector

from lx.targets import feature_id_of, PLACE_PIN

STARS = re.compile(r"(\d(?:\.\d)?)\s*stars?", re.I)
REVIEWS = re.compile(r"([\d,]+)\s+reviews?", re.I)
PAREN_COUNT = re.compile(r"^\(([\d,]+)\)$")
PLACE_ID = re.compile(r"\b(ChIJ[\w-]{20,})")
STATUS = re.compile(r"\b(Permanently closed|Temporarily closed)\b", re.I)
PRICE = re.compile(r"^Price:\s*(.+)$", re.I)
LABEL_PREFIX = re.compile(r"^(Address|Phone|Website|Plus code|Located in|Open in Google Maps|Menu|Book online|Order online):\s*", re.I)


def _get(node, css: str) -> Optional[str]:
    v = node.css(css).get()
    if v is None:
        return None
    s = v.clean() if hasattr(v, "clean") else str(v).strip()
    return s or None


def _all(node, css: str) -> List[str]:
    return [str(v).strip() for v in node.css(css).getall() if str(v).strip()]


def _first(candidates: List[Tuple[str, Optional[str]]]) -> Tuple[Optional[str], Optional[str]]:
    """First non-empty (source, value) of an ordered list of selector attempts."""
    for source, value in candidates:
        if value:
            return value, source
    return None, None


def _strip_label(s: Optional[str]) -> Optional[str]:
    return LABEL_PREFIX.sub("", s).strip() if s else s


def page_kind(html: str) -> str:
    """'place' (a single business panel), 'list' (search results), or 'unknown'."""
    sel = Selector(html)
    if sel.css("div.Nv2PK") and not sel.css("h1.DUwDvf"):
        return "list"
    if sel.css("h1.DUwDvf") or sel.css('[data-item-id="address"]') or sel.css('[data-item-id^="phone:tel:"]'):
        return "place"
    return "unknown"


def extract_place(html: str, final_url: str = "") -> Dict[str, Any]:
    sel = Selector(html)
    main = sel.css('div[role="main"]').first or sel
    src: Dict[str, str] = {}

    def take(name: str, candidates: List[Tuple[str, Optional[str]]]) -> Optional[str]:
        value, source = _first(candidates)
        if source:
            src[name] = source
        return value

    name = take("name", [
        ("h1.DUwDvf", _get(main, "h1.DUwDvf::text") or _get(main, "h1.DUwDvf *::text")),
        ("main[aria-label]", _get(sel, 'div[role="main"]::attr(aria-label)')),
        ("h1", _get(main, "h1::text")),
    ])

    # Rating and review count: aria-labels first ("4.6 stars", "10 reviews"), then F7nice text.
    labels = _all(main, "[aria-label]::attr(aria-label)")
    rating_s = take("rating", [
        ("aria-label stars", next((m.group(1) for l in labels if (m := STARS.search(l))), None)),
        ("F7nice span[aria-hidden]", _get(main, 'div.F7nice span[aria-hidden="true"]::text')),
    ])
    reviews_s = take("reviews", [
        ("aria-label reviews", next((m.group(1) for l in labels if (m := REVIEWS.search(l))), None)),
        ("F7nice (n)", next((m.group(1) for t in _all(main, "div.F7nice *::text") if (m := PAREN_COUNT.match(t))), None)),
    ])
    try:
        rating = float(rating_s) if rating_s else None
    except ValueError:
        rating = None
    reviews = int(reviews_s.replace(",", "")) if reviews_s else None

    category = take("category", [
        ("button.DkEaL", _get(main, "button.DkEaL::text")),
        ('button[jsaction*="category"]', _get(main, 'button[jsaction*="category"]::text')),
    ])

    # Panel rows carry a semantic data-item-id. Keep them all, raw.
    panel_items: Dict[str, str] = {}
    for node in main.css("[data-item-id]"):
        key = node.attrib.get("data-item-id", "")
        text = " ".join(t for t in _all(node, "::text") if t not in {"", "·"})
        panel_items[key] = node.attrib.get("aria-label") or text or node.attrib.get("href", "")

    address = take("address", [
        ('[data-item-id="address"]', _strip_label(panel_items.get("address"))),
        ("aria-label Address:", _strip_label(next((l for l in labels if l.startswith("Address:")), None))),
    ])
    phone_key = next((k for k in panel_items if k.startswith("phone:tel:")), None)
    phone = take("phone", [
        ('[data-item-id^="phone:tel:"] label', _strip_label(panel_items.get(phone_key)) if phone_key else None),
        ("aria-label Phone:", _strip_label(next((l for l in labels if l.startswith("Phone:")), None))),
    ])
    phone_e164 = phone_key.split("phone:tel:", 1)[1] if phone_key else None
    website = take("website", [
        ('a[data-item-id="authority"][href]', _get(main, 'a[data-item-id="authority"]::attr(href)')),
    ])
    plus_code = take("plus_code", [
        ('[data-item-id="oloc"]', _strip_label(panel_items.get("oloc"))),
    ])
    located_in = take("located_in", [
        ('[data-item-id="locatedin"]', _strip_label(panel_items.get("locatedin"))),
    ])

    # Hours: the weekly table's aria-label ("Monday, 8 AM to 5 PM; Tuesday, …"), else rows.
    # One aria-label per weekday ("Friday, 8 AM to 4 PM, Copy open hours"); keep one per day.
    day_labels: Dict[str, str] = {}
    for l in labels:
        m = re.match(r"^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s*(.+)$", l)
        if m:
            day_labels.setdefault(m.group(1), re.sub(r",?\s*Copy open hours$", "", m.group(2)).strip())
    order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    hours_label = "; ".join(f"{d}: {day_labels[d]}" for d in order if d in day_labels) or None
    rows = []
    for tr in main.css("table tr"):
        cells = [c for c in _all(tr, "::text") if c]
        if cells and re.match(r"^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)", cells[0]):
            rows.append(f"{cells[0]}: {' '.join(cells[1:])}")
    weekly_hours = take("weekly_hours", [
        ("aria-label per weekday", hours_label),
        ("hours table rows", "; ".join(rows) if rows else None),
    ])

    price = take("price", [
        ('aria-label "Price:"', next((m.group(1) for l in labels if (m := PRICE.match(l))), None)),
    ])
    page_text = " ".join(_all(main, "::text"))
    status_m = STATUS.search(page_text)
    claimed = None
    if "Claim this business" in page_text or "Own this business?" in page_text:
        claimed = False

    # Identity from the URL the browser ended on — independent of markup.
    fid = feature_id_of(final_url)
    pins = PLACE_PIN.findall(final_url or "")
    # Only the landed URL's own `!19sChIJ…`. The page body echoes the request URL, so a ChIJ
    # found there can be the input's, not the place's (seen on the first live pages).
    place_id_m = re.search(r"!19s(ChIJ[\w-]{20,})", final_url or "")

    return {
        "business_name": name,
        "category": category,
        "average_star_rating": rating,
        "number_of_reviews": reviews,
        "address": address,
        "phone": phone,
        "phone_e164": phone_e164,
        "website": website,
        "plus_code": plus_code,
        "located_in": located_in,
        "weekly_hours": weekly_hours,
        "price": price,
        "business_status": status_m.group(1) if status_m else "operational_or_unknown",
        "claimed": claimed,
        "feature_id": fid,
        "cid": str(int(fid.split(":")[1], 16)) if fid else None,
        "place_id": place_id_m.group(1) if place_id_m else None,
        "place_lat": float(pins[-1][0]) if pins else None,
        "place_lng": float(pins[-1][1]) if pins else None,
        "final_url": final_url or None,
        "panel_items": panel_items,
        "_sources": src,
    }


CORE_FIELDS = ("business_name", "address", "category")


def missing_core(row: Dict[str, Any]) -> List[str]:
    return [f for f in CORE_FIELDS if not row.get(f)]
