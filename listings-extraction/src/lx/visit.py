"""
One visit to one target, inside a fresh BrowserContext that is closed afterwards.

Search targets go through rarlx's proven `harvest_single_pin` unchanged. Place targets use
`visit_place`, which is the same composition pointed at a place URL instead of a search.
Every stealth setting below is rarlx's (rar-linux src/rarlx/bcrf49_linux.py), cited:

  context      1920×1080, en-US, America/Los_Angeles, geolocation = the place's own pin,
               permission granted                                   (bcrf49_linux:760-769)
  UA           only when headless, derived from the running Chrome   (derive_user_agent :328)
  entry paths  google_home / maps_home / search_results / direct, warmup 1.2–2.2 s, the
               warmup page is the referer                            (:782-804)
  settle       wait for the panel, then 1.8–2.6 s                    (:806-810)
  challenge    page text sentinels; screenshot, then raise           (:812-825)
  scrolling    mouse wheel only — never Page Up/Down; lognormal ≈545 px (350–800), ±4 px
               tremor, 1.0–3.5 s reads, 12% +1.8–3.2 s               (humanized_feed_scroll :424)
  evidence     page HTML + screenshot saved before parsing           (:830-841)
"""
from __future__ import annotations

import random
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus

from rarlx import bcrf49_linux as rx

from lx.targets import Target

# rarlx's sentinels plus the two its V_0_02 harvester added (maps_harvester_V_0_02.py:63-70).
EXTRA_SENTINELS = ("detected automated queries", "please solve this captcha")


def is_challenge(page_text: str) -> bool:
    low = page_text.lower()
    return rx.check_for_challenge(page_text) or any(s in low for s in EXTRA_SENTINELS)


@dataclass
class Visit:
    html_path: str
    screenshot_path: str
    final_url: str
    page_kind: str  # "place" | "list" | "unknown"
    cards: Optional[List[Dict[str, Any]]] = None  # when a place URL resolved to a result list


def _context_options(target: Target, user_agent: Optional[str]) -> Dict[str, Any]:
    opts: Dict[str, Any] = dict(
        viewport={"width": 1920, "height": 1080},
        locale="en-US",
        timezone_id="America/Los_Angeles",
    )
    if target.lat is not None and target.lng is not None:
        opts["geolocation"] = {"latitude": target.lat, "longitude": target.lng, "accuracy": 20}
        opts["permissions"] = ["geolocation"]
    if user_agent:
        opts["user_agent"] = user_agent
    return opts


def warmup_url(target: Target, entry_path: str) -> Optional[str]:
    at = f"@{target.lat},{target.lng},14z" if target.lat is not None else ""
    words = " ".join(w for w in [target.name_hint or target.query or "", target.meta.get("city", "")] if w).strip()
    return {
        "google_home": "https://www.google.com/",
        "maps_home": f"https://www.google.com/maps/{at}" if at else "https://www.google.com/maps",
        "search_results": f"https://www.google.com/search?q={quote_plus(words)}" if words else "https://www.google.com/",
        "direct": None,
    }[entry_path]


async def humanized_panel_read(page, max_scrolls: int = 2) -> None:
    """
    Reads a place panel the way rarlx reads a feed: cursor to the panel, then a few wheel
    steps with tremor and reading pauses. Same distributions as humanized_feed_scroll; fewer
    steps, because a place panel's facts sit near the top.
    """
    panel = await page.query_selector('div[role="main"]')
    box = await panel.bounding_box() if panel else None
    if not box:
        return
    cx = box["x"] + box["width"] / 2.0 + random.uniform(-10.0, 10.0)
    cy = box["y"] + min(box["height"], 900) / 2.0 + random.uniform(-10.0, 10.0)
    await page.mouse.move(cx, cy, steps=8)
    for _ in range(random.randint(1, max_scrolls)):
        await page.mouse.wheel(0, max(350, min(int(random.lognormvariate(6.3, 0.2)), 800)))
        await page.mouse.move(cx + random.uniform(-4.0, 4.0), cy + random.uniform(-4.0, 4.0), steps=3)
        pause = max(1.0, min(random.lognormvariate(0.5, 0.3), 3.5))
        if random.random() < 0.12:
            pause += random.uniform(1.8, 3.2)
        await page.wait_for_timeout(int(pause * 1000))


async def visit_place(browser, target: Target, artifacts_dir: Path, entry_path: str, user_agent: Optional[str]) -> Visit:
    from lx.place_fields import page_kind

    context = await browser.new_context(**_context_options(target, user_agent))
    page = await context.new_page()
    out_dir = artifacts_dir / target.target_id
    try:
        warm = warmup_url(target, entry_path)
        if warm:
            try:
                await page.goto(warm, wait_until="domcontentloaded", timeout=25000)
                await page.wait_for_timeout(random.randint(1200, 2200))
            except Exception:
                pass
        try:
            await page.goto(target.url, wait_until="domcontentloaded", timeout=30000, referer=warm)
        except Exception:
            pass
        try:
            await page.wait_for_selector('h1, div[role="feed"], div.Nv2PK', timeout=12000)
        except Exception:
            pass
        await page.wait_for_timeout(random.randint(1800, 2600))

        page_text = await page.evaluate("() => document.body ? document.body.innerText : ''")
        if is_challenge(page_text):
            out_dir.mkdir(parents=True, exist_ok=True)
            shot = out_dir / f"challenge_{entry_path}_{int(time.time())}.png"
            try:
                await page.screenshot(path=str(shot), full_page=False)
            except Exception:
                shot = Path("")
            raise rx.HarvesterCircuitBreakerError(
                f"Anti-bot challenge at {target.target_id} via entry path '{entry_path}'.", screenshot_path=str(shot)
            )

        html = await page.content()
        kind = page_kind(html)
        if kind == "list":
            # The URL resolved to a result list (ambiguous place): read it like a harvest.
            await rx.humanized_feed_scroll(page, target_listings=20, max_cycles=10)
        else:
            await humanized_panel_read(page)
        html = await page.content()
        final_url = page.url

        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "page.html").write_text(html, encoding="utf-8")
        (out_dir / "final_url.txt").write_text(final_url, encoding="utf-8")
        await page.screenshot(path=str(out_dir / "page.png"), full_page=False)
        return Visit(str(out_dir / "page.html"), str(out_dir / "page.png"), final_url, page_kind(html))
    finally:
        await context.close()


async def visit_search(browser, target: Target, artifacts_dir: Path, entry_path: str, user_agent: Optional[str], headless: bool) -> Visit:
    """The proven harvest, unchanged; full card fields are re-parsed from its saved page."""
    pin = {"latitude": target.lat, "longitude": target.lng, "point_id": target.target_id}
    _, html_path, png_path, _ = await rx.harvest_single_pin(
        browser=browser, pin=pin, keyword_id="search", keyword_phrase=target.query,
        artifacts_dir=artifacts_dir, headless=headless, entry_path=entry_path, user_agent=user_agent,
    )
    return Visit(html_path, png_path, final_url="", page_kind="list")
