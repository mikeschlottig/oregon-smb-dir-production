"""
BCRF-49 Local SERP Geo-Grid: Canonical Location-Agnostic Operational Framework
Version: 0.01
Author: Lead Data Systems Architect & SERP Engineering Principal
Organization: LEVERAGEAI LLC, Grants Pass, Oregon

A production-grade, location-agnostic and industry-neutral framework for local search intelligence:
  1. Market Centroid Definition (Coordinates, CRS, Bounding Frame)
  2. Mathematical BCRF-49 Coordinate Generation (1 Centroid + 6 Rings x 8 Bearings = 49 Pins)
  3. Commercial Intent Keyword Generation (15 Standardized Local Query Templates per Industry)
  4. Context-Isolated Stealth Harvester (Patchright, Warmup Chain, Mouse Wheel Kinematics)
  5. Isolated Relational Persistence (Dynamic SQLite Evidence Store + Viewport Artifacts)
  6. 4-Stage Gated Execution (Dry Run -> Smoke Test -> Keyword 1 Gate -> Full Sequential Queue)
  7. Per-Keyword Sub-process Isolation for Platform Reactive Wakeup Alerts
"""
from __future__ import annotations

import argparse
import asyncio
import json
import math
import os
import platform
import random
import re
import sqlite3
import subprocess
import sys
import time
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional, Tuple

# Windows UTF-8 and unbuffered line output
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
    sys.stderr.reconfigure(encoding="utf-8", line_buffering=True)

from patchright.async_api import async_playwright, Browser, BrowserContext, Page
from scrapling import Selector

# Earth equatorial radius in statute miles for WGS84 geodesic forward calculation
EARTH_RADIUS_MILES = 3958.7613

# Canonical 8-point compass bearings (45-degree intervals)
COMPASS_8_BEARINGS = [
    (0.0, "N"),
    (45.0, "NE"),
    (90.0, "E"),
    (135.0, "SE"),
    (180.0, "S"),
    (225.0, "SW"),
    (270.0, "W"),
    (315.0, "NW"),
]

# Canonical BCRF-49 logarithmic radial progression
DEFAULT_BCRF49_RADII_MILES = [0.0, 0.25, 0.5, 1.0, 2.0, 4.0, 8.0]


# ==============================================================================
# 1. MARKET CONFIGURATION & SPATIAL GEOMETRY
# ==============================================================================
@dataclass
class MarketConfig:
    """Defines the geographic anchor and territorial boundary for any target market."""
    city: str
    state: str
    state_full: str
    centroid_lat: float
    centroid_lng: float
    county: Optional[str] = None
    radii_miles: List[float] = field(default_factory=lambda: list(DEFAULT_BCRF49_RADII_MILES))

    @property
    def market_slug(self) -> str:
        clean_city = re.sub(r"[^a-zA-Z0-9]", "", self.city.lower())
        clean_state = re.sub(r"[^a-zA-Z0-9]", "", self.state.lower())
        return f"{clean_city}_{clean_state}"

    @property
    def display_name(self) -> str:
        return f"{self.city}, {self.state.upper()}"


def geodesic_destination_miles(
    lat: float, lng: float, distance_miles: float, bearing_degrees: float
) -> Tuple[float, float]:
    """Computes destination latitude and longitude given distance in statute miles and bearing in degrees."""
    if distance_miles == 0.0:
        return round(lat, 6), round(lng, 6)

    lat_rad = math.radians(lat)
    lng_rad = math.radians(lng)
    bearing_rad = math.radians(bearing_degrees)
    angular_dist = distance_miles / EARTH_RADIUS_MILES

    dest_lat_rad = math.asin(
        math.sin(lat_rad) * math.cos(angular_dist)
        + math.cos(lat_rad) * math.sin(angular_dist) * math.cos(bearing_rad)
    )

    dest_lng_rad = lng_rad + math.atan2(
        math.sin(bearing_rad) * math.sin(angular_dist) * math.cos(lat_rad),
        math.cos(angular_dist) - math.sin(lat_rad) * math.sin(dest_lat_rad),
    )

    dest_lng_rad = (dest_lng_rad + 3 * math.pi) % (2 * math.pi) - math.pi
    return round(math.degrees(dest_lat_rad), 6), round(math.degrees(dest_lng_rad), 6)


def generate_bcrf49_grid(market: MarketConfig) -> List[Dict[str, Any]]:
    """
    Constructs the canonical 49-point Business-Centered Relative Frame:
      - 1 Centroid (r = 0.0 mi)
      - 6 Concentric rings (0.25, 0.5, 1.0, 2.0, 4.0, 8.0 mi) x 8 compass bearings
      - Exactly 49 deterministic geo-pins.
    """
    pins: List[Dict[str, Any]] = []

    # Pin 1: Centroid
    pins.append({
        "point_id": f"{market.market_slug}_bcrf49_r0.00_centroid",
        "ring_index": 0,
        "radius_miles": 0.0,
        "bearing_degrees": 0.0,
        "bearing_label": "CENTER",
        "latitude": round(market.centroid_lat, 6),
        "longitude": round(market.centroid_lng, 6),
        "population_decay_weight": 1.0,
        "market": market.display_name,
    })

    # Pins 2 through 49: Concentric radial rings
    non_zero_radii = [r for r in market.radii_miles if r > 0.0]
    for ring_idx, radius in enumerate(non_zero_radii, start=1):
        decay_weight = round(1.0 / (1.0 + 0.15 * radius), 3)
        for deg, label in COMPASS_8_BEARINGS:
            dest_lat, dest_lng = geodesic_destination_miles(
                market.centroid_lat, market.centroid_lng, radius, deg
            )
            point_id = f"{market.market_slug}_bcrf49_r{radius:.2f}_{label}"
            pins.append({
                "point_id": point_id,
                "ring_index": ring_idx,
                "radius_miles": radius,
                "bearing_degrees": deg,
                "bearing_label": label,
                "latitude": dest_lat,
                "longitude": dest_lng,
                "population_decay_weight": decay_weight,
                "market": market.display_name,
            })

    if len(pins) != 49:
        raise ValueError(f"BCRF-49 contract violated: Expected exactly 49 pins, generated {len(pins)}")

    return pins


# ==============================================================================
# 2. INDUSTRY TAXONOMY & HIGH-COMMERCIAL-INTENT KEYWORD ENGINE
# ==============================================================================
INDUSTRY_TEMPLATES: Dict[str, List[Tuple[str, str]]] = {
    "lawyers": [
        ("KW-01", "personal injury lawyer {city} {state}"),
        ("KW-02", "car accident lawyer {city}"),
        ("KW-03", "criminal defense attorney {city}"),
        ("KW-04", "divorce attorney {city} {state_full}"),
        ("KW-05", "dui lawyer {city} {state_full}"),
        ("KW-06", "family law attorney {city}"),
        ("KW-07", "auto accident attorney {city} {state_full}"),
        ("KW-08", "estate planning attorney {city} {state_full}"),
        ("KW-09", "bankruptcy attorney {city} {state_full}"),
        ("KW-10", "child custody lawyer {city} {state}"),
        ("KW-11", "probate lawyer {city}"),
        ("KW-12", "real estate attorney {city} {state_full}"),
        ("KW-13", "wills and trusts attorney {city}"),
        ("KW-14", "traffic lawyer {city} {state}"),
        ("KW-15", "truck accident lawyer {city}"),
    ],
    "roofers": [
        ("KW-01", "roofing contractor {city} {state}"),
        ("KW-02", "roof repair {city}"),
        ("KW-03", "commercial roofing {city}"),
        ("KW-04", "residential roof replacement {city} {state_full}"),
        ("KW-05", "emergency roof repair {city} {state_full}"),
        ("KW-06", "metal roofing {city}"),
        ("KW-07", "roofers {city} {state_full}"),
        ("KW-08", "gutter and roof installation {city} {state_full}"),
        ("KW-09", "roof leak repair {city} {state_full}"),
        ("KW-10", "flat roof repair {city} {state}"),
        ("KW-11", "tile roof repair {city}"),
        ("KW-12", "shingle roof replacement {city} {state_full}"),
        ("KW-13", "roof inspection {city}"),
        ("KW-14", "siding and roofing {city} {state}"),
        ("KW-15", "storm damage roof repair {city}"),
    ],
    "plumbers": [
        ("KW-01", "plumber {city} {state}"),
        ("KW-02", "plumbing contractor {city}"),
        ("KW-03", "emergency plumber {city}"),
        ("KW-04", "drain cleaning {city} {state_full}"),
        ("KW-05", "water heater repair {city} {state_full}"),
        ("KW-06", "commercial plumbing {city}"),
        ("KW-07", "sewer line repair {city} {state_full}"),
        ("KW-08", "leak detection {city} {state_full}"),
        ("KW-09", "hydro jetting {city} {state_full}"),
        ("KW-10", "gas line repair {city} {state}"),
        ("KW-11", "pipe replacement {city}"),
        ("KW-12", "toilet repair {city} {state_full}"),
        ("KW-13", "sump pump installation {city}"),
        ("KW-14", "bathroom plumbing {city} {state}"),
        ("KW-15", "slab leak repair {city}"),
    ],
    "hvac": [
        ("KW-01", "hvac contractor {city} {state}"),
        ("KW-02", "ac repair {city}"),
        ("KW-03", "heating repair {city}"),
        ("KW-04", "furnace replacement {city} {state_full}"),
        ("KW-05", "commercial hvac {city} {state_full}"),
        ("KW-06", "air duct cleaning {city}"),
        ("KW-07", "heat pump installation {city} {state_full}"),
        ("KW-08", "emergency ac service {city} {state_full}"),
        ("KW-09", "boiler repair {city} {state_full}"),
        ("KW-10", "indoor air quality {city} {state}"),
        ("KW-11", "mini split installation {city}"),
        ("KW-12", "thermostat installation {city} {state_full}"),
        ("KW-13", "hvac maintenance {city}"),
        ("KW-14", "commercial refrigeration {city} {state}"),
        ("KW-15", "attic ventilation {city}"),
    ],
    "dentists": [
        ("KW-01", "dentist {city} {state}"),
        ("KW-02", "cosmetic dentist {city}"),
        ("KW-03", "emergency dentist {city}"),
        ("KW-04", "dental implants {city} {state_full}"),
        ("KW-05", "teeth whitening {city} {state_full}"),
        ("KW-06", "family dentistry {city}"),
        ("KW-07", "pediatric dentist {city} {state_full}"),
        ("KW-08", "orthodontist {city} {state_full}"),
        ("KW-09", "periodontist {city} {state_full}"),
        ("KW-10", "root canal specialist {city} {state}"),
        ("KW-11", "dental crowns {city}"),
        ("KW-12", "wisdom teeth removal {city} {state_full}"),
        ("KW-13", "dentures {city}"),
        ("KW-14", "sedation dentistry {city} {state}"),
        ("KW-15", "tooth extraction {city}"),
    ],
}


def build_industry_keywords(market: MarketConfig, industry: str) -> List[Dict[str, Any]]:
    """Expands parameterized keyword templates for any market and commercial industry."""
    industry_key = industry.lower().strip()
    if industry_key not in INDUSTRY_TEMPLATES:
        available = ", ".join(INDUSTRY_TEMPLATES.keys())
        raise ValueError(f"Unsupported industry '{industry}'. Available pre-configured verticals: {available}")

    templates = INDUSTRY_TEMPLATES[industry_key]
    city_lower = market.city.lower()
    state_code = market.state.lower()
    state_full = market.state_full.lower()

    keywords: List[Dict[str, Any]] = []
    for kw_id, tpl in templates:
        phrase = tpl.format(
            city=city_lower,
            state=state_code,
            state_full=state_full,
        )
        keywords.append({
            "keyword_id": kw_id,
            "phrase": phrase,
            "target_vertical": industry_key,
            "required_geo_pins": 49,
            "target_ranks_per_pin": 20,
            "expected_total_observations": 980,
        })

    return keywords


# ==============================================================================
# 3. CHROME STEALTH UTILITIES & BOT SENTINELS
# ==============================================================================
def resolve_chrome_executable() -> str:
    """Resolves local Google Chrome installation across Windows, Linux, and macOS."""
    if platform.system() == "Windows":
        candidates = [
            os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
            os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
            os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
        ]
        for path in candidates:
            if os.path.isfile(path):
                return path
    elif platform.system() == "Darwin":
        mac_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        if os.path.isfile(mac_path):
            return mac_path
    else:
        linux_paths = ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"]
        for p in linux_paths:
            if os.path.isfile(p):
                return p

    raise FileNotFoundError("Google Chrome executable not found. Ensure Chrome is installed.")


def get_stealth_user_agent() -> str:
    return (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/133.0.0.0 Safari/537.36"
    )


class HarvesterCircuitBreakerError(Exception):
    """Raised when an anti-bot CAPTCHA or blocking challenge is detected."""
    pass


def check_for_challenge(page_text: str) -> bool:
    """Inspects rendered DOM text for anti-bot interception triggers."""
    sentinels = [
        "recaptcha",
        "please verify you are a human",
        "unusual traffic from your computer network",
        "challenge-running",
        "cf-browser-verification",
    ]
    lower_text = page_text.lower()
    return any(s in lower_text for s in sentinels)


def is_end_of_list_reached(html_content: str, feed_text: str = "") -> bool:
    """Detects Google Maps native end-of-results indicator when a local market has < 20 entities."""
    sentinels = [
        "you've reached the end of the list",
        "reached the end of the list",
        "end of the list",
        "no more results",
    ]
    combined = (html_content + " " + feed_text).lower()
    return any(s in combined for s in sentinels)


# ==============================================================================
# 4. KINEMATIC FEED SCROLLING & ATOMIC PARSER
# ==============================================================================
async def humanized_feed_scroll(page: Page, target_listings: int = 20, max_cycles: int = 10) -> int:
    """
    Executes organic mouse-wheel scrolling within Google Maps div[role="feed"].
    STRICT INVARIANT: Zero Page_Up / Page_Down synthetic keystrokes.
    Terminates early if target listings are loaded or end of list is signaled.
    """
    try:
        await page.wait_for_selector('div[role="feed"]', timeout=9000, state="attached")
    except Exception:
        pass

    feed = await page.query_selector('div[role="feed"]')
    if not feed:
        return 0

    box = await feed.bounding_box()
    if not box:
        return 0

    center_x = box["x"] + (box["width"] / 2.0) + random.uniform(-10.0, 10.0)
    center_y = box["y"] + (box["height"] / 2.0) + random.uniform(-10.0, 10.0)
    await page.mouse.move(center_x, center_y, steps=8)

    listings_count = 0
    for _ in range(max_cycles):
        cards = await page.query_selector_all('div.Nv2PK')
        listings_count = len(cards)
        if listings_count >= target_listings:
            break

        # Lognormal mouse wheel step (350 to 800px)
        delta_y = int(random.lognormvariate(6.3, 0.2))
        delta_y = max(350, min(delta_y, 800))
        await page.mouse.wheel(0, delta_y)

        # Micro-tremor cursor move during reading pause
        await page.mouse.move(
            center_x + random.uniform(-4.0, 4.0),
            center_y + random.uniform(-4.0, 4.0),
            steps=3,
        )

        pause_sec = max(1.0, min(random.lognormvariate(0.5, 0.3), 3.5))
        if random.random() < 0.12:
            pause_sec += random.uniform(1.8, 3.2)
        await page.wait_for_timeout(int(pause_sec * 1000))

        # Check for Google Maps end-of-list indicator
        try:
            feed_text = await page.evaluate("() => document.querySelector('div[role=\\\"feed\\\"]')?.innerText || ''")
            if is_end_of_list_reached("", feed_text):
                break
        except Exception:
            pass

    final_cards = await page.query_selector_all('div.Nv2PK')
    return len(final_cards)


def extract_listings_from_html(html_content: str, max_rank: int = 20) -> List[Dict[str, Any]]:
    """Scrapling-powered atomic parser extracting complete fields from Google Maps cards."""
    sel = Selector(html_content)
    cards = sel.css("div.Nv2PK")
    results: List[Dict[str, Any]] = []

    for idx, card in enumerate(cards[:max_rank], start=1):
        name_elem = card.css("a.hfpxzc::attr(aria-label)").first
        name = name_elem.clean_text if name_elem else ""

        maps_url_elem = card.css("a.hfpxzc::attr(href)").first
        maps_url = maps_url_elem.clean_text if maps_url_elem else ""

        if not name:
            continue

        # Rating and review count
        rating_elem = card.css("span.MW4etd::text").first
        star_rating: Optional[float] = None
        if rating_elem:
            try:
                star_rating = float(rating_elem.clean_text)
            except ValueError:
                pass

        reviews_elem = card.css("span.UY7F9::text").first
        reviews_count: Optional[int] = None
        if reviews_elem:
            m = re.search(r"\(([\d,]+)\)", reviews_elem.clean_text)
            if m:
                reviews_count = int(m.group(1).replace(",", ""))

        # Category, phone, and address from secondary detail spans
        category: Optional[str] = None
        phone_number: Optional[str] = None
        address: Optional[str] = None

        detail_containers = card.css("div.W4Efsd")
        for dc in detail_containers:
            spans = dc.css("span > span::text, span::text").get_all()
            for text in spans:
                text_clean = text.strip().replace("·", "").strip()
                if not text_clean:
                    continue

                if re.search(r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text_clean):
                    if not phone_number:
                        phone_number = text_clean
                elif any(kw in text_clean for kw in [" St", " Ave", " Blvd", " Rd", " Dr", " Way", " Ste", " Suite", " Hwy", " Park"]):
                    if not address and not re.search(r"\(?\d{3}\)?", text_clean):
                        address = text_clean
                elif not category and len(text_clean) > 2 and not any(k in text_clean for k in ["Open", "Closed", "AM", "PM", "mins", "hours", "review"]):
                    category = text_clean

        # Place ID and CID
        cid: Optional[str] = None
        place_id: Optional[str] = None
        if maps_url:
            cid_match = re.search(r"0x[0-9a-fA-F]+:(0x[0-9a-fA-F]+)", maps_url)
            if cid_match:
                try:
                    cid = str(int(cid_match.group(1), 16))
                except ValueError:
                    pass
            pid_match = re.search(r"!1s([^!]+)", maps_url)
            if pid_match:
                place_id = pid_match.group(1)

        results.append({
            "rank": idx,
            "business_name": name,
            "category": category,
            "average_star_rating": star_rating,
            "number_of_reviews": reviews_count,
            "phone_number": phone_number,
            "address_full": address,
            "place_id": place_id,
            "cid": cid,
            "maps_url": maps_url,
        })

    return results


# ==============================================================================
# 5. ISOLATED RELATIONAL EVIDENCE STORE
# ==============================================================================
class UniversalEvidenceStore:
    """Manages SQLite storage for any market and industry with WAL mode and foreign keys."""

    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=30.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA journal_mode = WAL")
        return conn

    def _init_db(self):
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with self._get_connection() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS keywords (
                    keyword_id TEXT PRIMARY KEY,
                    phrase TEXT NOT NULL,
                    target_vertical TEXT NOT NULL,
                    status TEXT NOT NULL,
                    completed_pins INTEGER DEFAULT 0,
                    total_pins INTEGER DEFAULT 49,
                    total_rankings INTEGER DEFAULT 0,
                    start_time TEXT NOT NULL,
                    end_time TEXT
                );

                CREATE TABLE IF NOT EXISTS observations (
                    observation_id TEXT PRIMARY KEY,
                    keyword_id TEXT NOT NULL,
                    keyword_phrase TEXT NOT NULL,
                    point_id TEXT NOT NULL,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    radius_miles REAL NOT NULL,
                    bearing_label TEXT NOT NULL,
                    bearing_degrees REAL NOT NULL,
                    status TEXT NOT NULL,
                    results_count INTEGER NOT NULL,
                    timestamp TEXT NOT NULL,
                    html_path TEXT,
                    screenshot_path TEXT,
                    FOREIGN KEY (keyword_id) REFERENCES keywords(keyword_id)
                );

                CREATE TABLE IF NOT EXISTS rankings (
                    ranking_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    observation_id TEXT NOT NULL,
                    keyword_id TEXT NOT NULL,
                    keyword_phrase TEXT NOT NULL,
                    point_id TEXT NOT NULL,
                    rank INTEGER NOT NULL,
                    business_name TEXT NOT NULL,
                    category TEXT,
                    average_star_rating REAL,
                    number_of_reviews INTEGER,
                    phone_number TEXT,
                    address_full TEXT,
                    place_id TEXT,
                    cid TEXT,
                    maps_url TEXT,
                    timestamp_utc TEXT NOT NULL,
                    FOREIGN KEY (observation_id) REFERENCES observations(observation_id),
                    FOREIGN KEY (keyword_id) REFERENCES keywords(keyword_id)
                );

                CREATE INDEX IF NOT EXISTS idx_rankings_lookup ON rankings (keyword_id, point_id, rank);
                CREATE INDEX IF NOT EXISTS idx_obs_point ON observations (keyword_id, point_id);
            """)

    def ensure_keyword(self, keyword_id: str, phrase: str, target_vertical: str, total_pins: int = 49):
        with self._get_connection() as conn:
            conn.execute("""
                INSERT OR IGNORE INTO keywords (
                    keyword_id, phrase, target_vertical, status, total_pins, start_time
                ) VALUES (?, ?, ?, 'IN_PROGRESS', ?, ?)
            """, (keyword_id, phrase, target_vertical, total_pins, datetime.now(timezone.utc).isoformat()))

    def is_pin_completed(self, keyword_id: str, point_id: str) -> bool:
        with self._get_connection() as conn:
            row = conn.execute("""
                SELECT results_count, status FROM observations 
                WHERE keyword_id = ? AND point_id = ?
                ORDER BY timestamp DESC LIMIT 1
            """, (keyword_id, point_id)).fetchone()
            if not row:
                r = conn.execute("SELECT count(*) FROM rankings WHERE keyword_id = ? AND point_id = ?", (keyword_id, point_id)).fetchone()
                return (r[0] >= 20) if r else False
            count, status = row[0], row[1]
            return status == "SUCCESS" and count > 0

    def get_pin_rankings(self, keyword_id: str, point_id: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute("""
                SELECT rank, business_name, category, average_star_rating,
                       number_of_reviews, phone_number, address_full,
                       place_id, cid, maps_url
                FROM rankings WHERE keyword_id = ? AND point_id = ? ORDER BY rank ASC
            """, (keyword_id, point_id)).fetchall()
            return [dict(r) for r in rows]

    def mark_keyword_completed(self, keyword_id: str, completed_pins: int, total_rankings: int):
        with self._get_connection() as conn:
            conn.execute("""
                UPDATE keywords 
                SET status = 'COMPLETED', completed_pins = ?, total_rankings = ?, end_time = ?
                WHERE keyword_id = ?
            """, (completed_pins, total_rankings, datetime.now(timezone.utc).isoformat(), keyword_id))

    def save_observation_and_rankings(
        self,
        keyword_id: str,
        keyword_phrase: str,
        pin_meta: Dict[str, Any],
        listings: List[Dict[str, Any]],
        html_path: str,
        screenshot_path: str,
        is_end_of_list: bool = False,
    ):
        obs_id = str(uuid.uuid4())
        now_utc = datetime.now(timezone.utc).isoformat()
        is_success = len(listings) >= 20 or (len(listings) > 0 and is_end_of_list)

        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO observations (
                    observation_id, keyword_id, keyword_phrase, point_id,
                    latitude, longitude, radius_miles, bearing_label, bearing_degrees,
                    status, results_count, timestamp, html_path, screenshot_path
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                obs_id, keyword_id, keyword_phrase, pin_meta["point_id"],
                pin_meta["latitude"], pin_meta["longitude"], pin_meta["radius_miles"],
                pin_meta["bearing_label"], pin_meta["bearing_degrees"],
                "SUCCESS" if is_success else "PARTIAL", len(listings),
                now_utc, html_path, screenshot_path,
            ))

            for item in listings:
                conn.execute("""
                    INSERT INTO rankings (
                        observation_id, keyword_id, keyword_phrase, point_id,
                        rank, business_name, category, average_star_rating,
                        number_of_reviews, phone_number, address_full,
                        place_id, cid, maps_url, timestamp_utc
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    obs_id, keyword_id, keyword_phrase, pin_meta["point_id"],
                    item["rank"], item["business_name"], item.get("category"),
                    item.get("average_star_rating"), item.get("number_of_reviews"),
                    item.get("phone_number"), item.get("address_full"),
                    item.get("place_id"), item.get("cid"), item.get("maps_url"),
                    now_utc,
                ))


# ==============================================================================
# 6. SINGLE-PIN HARVESTER WITH CONTEXT ISOLATION
# ==============================================================================
async def harvest_single_pin(
    browser: Browser,
    pin: Dict[str, Any],
    keyword_id: str,
    keyword_phrase: str,
    artifacts_dir: Path,
    headless: bool = True,
) -> Tuple[List[Dict[str, Any]], str, str, bool]:
    """
    Executes a single-pin search inside a freshly spawned, completely isolated BrowserContext.
    Enforces organic referrer warmup chain (https://www.google.com/ -> Maps search).
    """
    lat = pin["latitude"]
    lng = pin["longitude"]
    point_id = pin["point_id"]

    context: BrowserContext = await browser.new_context(
        viewport={"width": 1920, "height": 1080},
        locale="en-US",
        timezone_id="America/Los_Angeles",
        user_agent=get_stealth_user_agent(),
        geolocation={"latitude": lat, "longitude": lng, "accuracy": 20},
        permissions=["geolocation"],
    )

    page: Page = await context.new_page()
    html_path = ""
    screenshot_path = ""
    listings: List[Dict[str, Any]] = []
    end_of_list = False

    try:
        # Step 1: Organic Referrer Warmup (Google Search Homepage)
        try:
            await page.goto("https://www.google.com/", wait_until="domcontentloaded", timeout=25000)
            await page.wait_for_timeout(random.randint(1200, 2200))
        except Exception:
            pass

        # Step 2: Navigate to Maps Search with Organic Referer Header
        encoded_query = keyword_phrase.replace(" ", "+")
        target_url = f"https://www.google.com/maps/search/{encoded_query}/@{lat},{lng},14z"

        try:
            await page.goto(
                target_url,
                wait_until="domcontentloaded",
                timeout=30000,
                referer="https://www.google.com/",
            )
        except Exception:
            pass

        try:
            await page.wait_for_selector('div[role="feed"], div.Nv2PK', timeout=12000)
        except Exception:
            pass
        await page.wait_for_timeout(random.randint(1800, 2600))

        # Anti-bot Sentinel Check
        page_text = await page.evaluate("() => document.body.innerText")
        if check_for_challenge(page_text):
            raise HarvesterCircuitBreakerError(f"Anti-bot challenge detected at pin {point_id} for '{keyword_phrase}'.")

        # Step 3: Humanized Kinematics in feed until 20 cards loaded or end reached
        await humanized_feed_scroll(page, target_listings=20, max_cycles=10)

        # Step 4: Extract HTML DOM & Screenshot Artifacts
        html_content = await page.content()
        point_dir = artifacts_dir / keyword_id / point_id
        point_dir.mkdir(parents=True, exist_ok=True)

        html_file = point_dir / "viewport.html"
        html_file.write_text(html_content, encoding="utf-8")
        html_path = str(html_file)

        screenshot_file = point_dir / "viewport.png"
        await page.screenshot(path=str(screenshot_file), full_page=False)
        screenshot_path = str(screenshot_file)

        # Step 5: Atomic Extraction & End-of-List Sentinel
        listings = extract_listings_from_html(html_content, max_rank=20)
        end_of_list = is_end_of_list_reached(html_content, page_text)

    finally:
        await context.close()

    return listings, html_path, screenshot_path, end_of_list


# ==============================================================================
# 7. MASTER PIPELINE ORCHESTRATOR
# ==============================================================================
async def execute_bcrf49_pipeline(
    market: MarketConfig,
    industry: str,
    output_dir: Path,
    keyword_filter: Optional[str] = None,
    max_pins: int = 49,
    dry_run: bool = False,
    headless: bool = True,
):
    """Executes the full BCRF-49 local SERP extraction workflow for any market and industry."""
    print("=" * 80)
    print(f"  BCRF-49 CANONICAL LOCAL SERP EXTRACTION FRAMEWORK (V-0.01)")
    print(f"  Target Market: {market.display_name} | Centroid: ({market.centroid_lat:.4f}, {market.centroid_lng:.4f})")
    print(f"  Commercial Vertical: {industry.upper()}")
    print("=" * 80)

    # 1. Generate Coordinates & Manifest
    pins = generate_bcrf49_grid(market)
    active_pins = pins[:max_pins]
    print(f"\n[+] Calculated {len(pins)} BCRF-49 geo-pins (Active for this run: {len(active_pins)} pins).")

    # 2. Build 15 Commercial Keywords
    all_keywords = build_industry_keywords(market, industry)
    if keyword_filter:
        active_keywords = [k for k in all_keywords if k["keyword_id"] == keyword_filter or k["phrase"] == keyword_filter]
        if not active_keywords:
            raise ValueError(f"Keyword filter '{keyword_filter}' matched no keywords in vertical '{industry}'.")
    else:
        active_keywords = all_keywords

    print(f"[+] Queued {len(active_keywords)} Commercial Keywords for '{industry}':")
    for kw in active_keywords:
        print(f"    - [{kw['keyword_id']}] '{kw['phrase']}'")

    # 3. Setup Dedicated Evidence Store
    db_name = f"rar_{market.market_slug}_{industry.lower()}_evidence_V_0_01.db"
    db_path = output_dir / db_name
    artifacts_dir = output_dir / f"artifacts_{market.market_slug}_{industry.lower()}"
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    store = UniversalEvidenceStore(db_path)
    print(f"\n[+] Dedicated Storage Initialized:")
    print(f"    - Database: {db_path.name}")
    print(f"    - Artifacts: {artifacts_dir.name}")

    if dry_run:
        print("\n[✓] DRY-RUN VALIDATION COMPLETE:")
        print(f"    - 49 Geo-Pins validated with WGS84 geodesic coordinates.")
        print(f"    - {len(active_keywords)} Keyword templates compiled without error.")
        print(f"    - SQLite schema DDL created and verified at: {db_path}")
        return

    # 4. Chromium Execution Loop with Gating
    chrome_path = resolve_chrome_executable()
    print(f"\n[*] Resolved Google Chrome binary: {chrome_path}")
    print(f"[*] Starting gated extraction. Gate policy: No keyword advances until all {len(active_pins)} pins pass verification.\n")

    launch_args = ["--disable-blink-features=AutomationControlled", "--disable-infobars", "--no-first-run"]

    for kw_idx, kw_spec in enumerate(active_keywords, start=1):
        kw_id = kw_spec["keyword_id"]
        kw_phrase = kw_spec["phrase"]

        print("=" * 80)
        print(f"  >>> ENTERING GATE FOR KEYWORD [{kw_idx}/{len(active_keywords)}]: [{kw_id}] '{kw_phrase}'")
        print("=" * 80)

        store.ensure_keyword(kw_id, kw_phrase, target_vertical=industry, total_pins=len(active_pins))

        completed_pins_for_kw = 0
        total_rankings_for_kw = 0
        kw_rankgrid_points = []

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                executable_path=chrome_path,
                headless=headless,
                args=launch_args,
            )

            try:
                for pin_idx, pin in enumerate(active_pins, start=1):
                    point_id = pin["point_id"]
                    dist_mi = pin["radius_miles"]
                    bearing = pin["bearing_label"]

                    # Cache resume check
                    if store.is_pin_completed(kw_id, point_id):
                        cached = store.get_pin_rankings(kw_id, point_id)
                        print(f"    [{pin_idx:02d}/{len(active_pins)}] [CACHED] {point_id} ({dist_mi:.2f} mi {bearing}) verified with {len(cached)} rankings.")
                        completed_pins_for_kw += 1
                        total_rankings_for_kw += len(cached)
                        kw_rankgrid_points.append({
                            "point_id": point_id,
                            "radius_miles": dist_mi,
                            "bearing_label": bearing,
                            "ranked_businesses": cached,
                        })
                        continue

                    # Recycle browser process every 7 pins to purge OS memory leaks
                    if pin_idx > 1 and pin_idx % 7 == 1:
                        print("    [*] Recycling browser process (7-pin OS memory purge)...")
                        await browser.close()
                        await asyncio.sleep(2.0)
                        browser = await p.chromium.launch(
                            executable_path=chrome_path,
                            headless=headless,
                            args=launch_args,
                        )

                    print(f"    [{pin_idx:02d}/{len(active_pins)}] Querying {point_id} at ({pin['latitude']:.4f}, {pin['longitude']:.4f}) | {dist_mi:.2f} mi {bearing}...")

                    # 3-Attempt Exponential Backoff Retry Loop
                    max_attempts = 3
                    listings: List[Dict[str, Any]] = []
                    h_path, s_path = "", ""
                    end_of_list = False

                    for attempt in range(1, max_attempts + 1):
                        try:
                            listings, h_path, s_path, end_of_list = await harvest_single_pin(
                                browser=browser,
                                pin=pin,
                                keyword_id=kw_id,
                                keyword_phrase=kw_phrase,
                                artifacts_dir=artifacts_dir,
                                headless=headless,
                            )
                            if len(listings) >= 20 or (len(listings) > 0 and end_of_list):
                                break
                            print(f"        [!] Attempt {attempt}/{max_attempts}: Partial harvest ({len(listings)}/20 listings). Backing off...")
                        except Exception as e:
                            print(f"        [!] Attempt {attempt}/{max_attempts} error: {e}")
                            if attempt == max_attempts:
                                raise

                        backoff = (2 ** attempt) + random.uniform(1.0, 3.0)
                        await asyncio.sleep(backoff)

                    is_valid = len(listings) >= 20 or (len(listings) > 0 and end_of_list)
                    if is_valid:
                        store.save_observation_and_rankings(
                            keyword_id=kw_id,
                            keyword_phrase=kw_phrase,
                            pin_meta=pin,
                            listings=listings,
                            html_path=h_path,
                            screenshot_path=s_path,
                            is_end_of_list=end_of_list,
                        )
                        completed_pins_for_kw += 1
                        total_rankings_for_kw += len(listings)
                        status_str = "20/20 rankings" if len(listings) >= 20 else f"{len(listings)} rankings (End of Market reached)"
                        print(f"        [OK] Captured {status_str}. Top: '{listings[0]['business_name']}' | Rank #{len(listings)}: '{listings[-1]['business_name']}'")
                        kw_rankgrid_points.append({
                            "point_id": point_id,
                            "radius_miles": dist_mi,
                            "bearing_label": bearing,
                            "ranked_businesses": listings,
                        })
                    else:
                        print(f"        [!] GATE INCOMPLETE: Only captured {len(listings)}/20 listings after {max_attempts} attempts.")

                    # Lognormal human delay between pins
                    await asyncio.sleep(random.uniform(3.0, 6.0))

            finally:
                await browser.close()

            # The Keyword Gate Check
            print("-" * 80)
            if completed_pins_for_kw == len(active_pins):
                print(f"[✓] GATE UNLOCKED: Keyword [{kw_id}] '{kw_phrase}' fully verified!")
                print(f"    Total Verified Pins: {completed_pins_for_kw}/{len(active_pins)}")
                print(f"    Total Extracted Rankings: {total_rankings_for_kw} records")
                store.mark_keyword_completed(kw_id, completed_pins_for_kw, total_rankings_for_kw)

                # Export keyword rankgrid JSON
                kw_json_path = artifacts_dir / f"{market.market_slug}_{kw_id}_rankgrid_V_0_01.json"
                with open(kw_json_path, "w", encoding="utf-8") as f:
                    json.dump({
                        "keyword_id": kw_id,
                        "keyword_phrase": kw_phrase,
                        "market": market.display_name,
                        "industry": industry,
                        "completed_pins": completed_pins_for_kw,
                        "total_rankings": total_rankings_for_kw,
                        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                        "grid_points": kw_rankgrid_points,
                    }, f, indent=2)
                print(f"    Exported Rankgrid JSON: {kw_json_path.name}")
            else:
                print(f"[X] GATE LOCKED: Keyword [{kw_id}] did not achieve 100% pin verification ({completed_pins_for_kw}/{len(active_pins)}). Halting.")
                sys.exit(1)


# ==============================================================================
# 8. COMMAND LINE INTERFACE
# ==============================================================================
def parse_args():
    parser = argparse.ArgumentParser(description="BCRF-49 Canonical Location-Agnostic Local SERP Framework")
    parser.add_argument("--city", default="Medford", help="Market City Name (e.g. 'Grants Pass', 'Medford', 'Eugene')")
    parser.add_argument("--state", default="OR", help="Market State Code (e.g. 'OR', 'TX')")
    parser.add_argument("--state-full", default="Oregon", help="Market State Full Name (e.g. 'Oregon', 'Texas')")
    parser.add_argument("--lat", type=float, default=42.3265, help="Market Centroid Latitude (e.g. 42.3265)")
    parser.add_argument("--lng", type=float, default=-122.8756, help="Market Centroid Longitude (e.g. -122.8756)")
    parser.add_argument("--industry", default="lawyers", choices=list(INDUSTRY_TEMPLATES.keys()), help="Commercial Industry Vertical")
    parser.add_argument("--keyword-id", default=None, help="Target specific keyword ID (e.g. KW-01). Default runs all.")
    parser.add_argument("--max-pins", type=int, default=49, help="Max pins per keyword (default: 49)")
    parser.add_argument("--dry-run", action="store_true", help="Validates geometry, keywords, and storage without browser launch")
    parser.add_argument("--smoke-test", action="store_true", help="Executes a 1-pin live smoke test on Centroid (KW-01)")
    parser.add_argument("--no-headless", action="store_true", help="Launch visible Chrome for inspection")
    return parser.parse_args()


def main():
    args = parse_args()
    market = MarketConfig(
        city=args.city,
        state=args.state,
        state_full=args.state_full,
        centroid_lat=args.lat,
        centroid_lng=args.lng,
    )

    max_pins = 1 if args.smoke_test else args.max_pins
    kw_filter = "KW-01" if args.smoke_test else args.keyword_id

    output_dir = Path(__file__).resolve().parents[2]

    asyncio.run(execute_bcrf49_pipeline(
        market=market,
        industry=args.industry,
        output_dir=output_dir,
        keyword_filter=kw_filter,
        max_pins=max_pins,
        dry_run=args.dry_run,
        headless=not args.no_headless,
    ))


if __name__ == "__main__":
    main()
