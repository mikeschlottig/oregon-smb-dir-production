"""
Google Maps Viewport Harvester — Patchright + Real Chrome + Scrapling
Version: V-0.02
Implements strict stealth invariants, humanized mouse kinematics, and challenge sentinel circuit-breakers.
"""
import asyncio
import os
import platform
import random
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from patchright.async_api import async_playwright, Browser, BrowserContext, Page

from rar.schemas.data_models_V_0_01 import (
    GridPoint,
    RankObservation,
    AcquisitionStatus,
    SearchSurface,
    RawArtifactReference,
)
from rar.extractor.maps_extractor_V_0_01 import extract_maps_listings
from rar.storage.artifact_store_V_0_01 import ArtifactStorageEngine
from rar.proxy.proxy_adapter_V_0_01 import ProxyNode, ProxyRotationManager


def get_chrome_executable() -> Optional[str]:
    """Dynamically resolves real Google Chrome executable across platforms."""
    sys_name = platform.system()
    if sys_name == "Darwin":
        mac_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        if os.path.exists(mac_path):
            return mac_path
    elif sys_name == "Windows":
        win_candidates = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        ]
        for p in win_candidates:
            if os.path.exists(p):
                return p
    elif sys_name == "Linux":
        for p in ["/usr/bin/google-chrome", "/usr/bin/chromium-browser"]:
            if os.path.exists(p):
                return p
    return None


def get_stealth_user_agent() -> str:
    """Returns platform-consistent User-Agent string."""
    if platform.system() == "Windows":
        return (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
        )
    return (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    )


CHALLENGE_INDICATORS = [
    "unusual traffic from your computer network",
    "recaptcha",
    "challenges.cloudflare.com",
    "systems have detected unusual traffic",
    "please solve this captcha",
    "detected automated queries",
]


class HarvesterCircuitBreakerError(Exception):
    """Raised when an anti-bot challenge is encountered and the hard stop trips."""
    pass


def check_for_challenge(page_text: str) -> bool:
    """Checks if page content matches known anti-bot / CAPTCHA challenge markers."""
    lower = page_text.lower()
    return any(marker in lower for marker in CHALLENGE_INDICATORS)


async def humanized_feed_scroll(page: Page, scroll_cycles: int = 4):
    """
    Executes humanized mouse wheel scrolling inside Google Maps div[role="feed"].
    Strictly forbids Page_Up / Page_Down synthetic keyboard events.
    Enforces centroid targeting with Bezier steps and micro-jitter kinematics.
    """
    try:
        await page.wait_for_selector('div[role="feed"]', timeout=8000, state="attached")
    except Exception:
        pass

    feed = await page.query_selector('div[role="feed"]')
    if not feed:
        return

    box = await feed.bounding_box()
    if not box:
        return

    # Centroid of feed element with small random natural human offset
    jitter_x = random.uniform(-15.0, 15.0)
    jitter_y = random.uniform(-15.0, 15.0)
    center_x = box["x"] + (box["width"] / 2.0) + jitter_x
    center_y = box["y"] + (box["height"] / 2.0) + jitter_y
    
    # Smooth mouse move with human-like steps
    await page.mouse.move(center_x, center_y, steps=8)

    for cycle in range(scroll_cycles):
        # Lognormal wheel step (400 to 750px)
        delta_y = int(random.lognormvariate(6.3, 0.2))
        delta_y = max(350, min(delta_y, 800))
        
        await page.mouse.wheel(0, delta_y)

        # Micro-jiggle: small cursor tremors during scroll pauses
        micro_x = center_x + random.uniform(-4.0, 4.0)
        micro_y = center_y + random.uniform(-4.0, 4.0)
        await page.mouse.move(micro_x, micro_y, steps=3)

        # Lognormal delay with human long-tail pause
        pause_sec = random.lognormvariate(0.5, 0.3)
        pause_sec = max(1.0, min(pause_sec, 3.5))

        if random.random() < 0.12:  # 12% distraction pause
            pause_sec += random.uniform(2.0, 4.0)

        await page.wait_for_timeout(int(pause_sec * 1000))


async def harvest_single_point(
    grid_point: GridPoint,
    query: str,
    scan_id: str,
    storage: ArtifactStorageEngine,
    proxy_manager: Optional[ProxyRotationManager] = None,
    chrome_path: Optional[str] = None,
    viewport_zoom: int = 14,
    capture_screenshot: bool = True,
    headless: bool = True,
    timezone_id: str = "America/Los_Angeles",
) -> RankObservation:
    """
    Executes a single-point Google Maps viewport ranking harvest.
    """
    if grid_point.allowed_surface != SearchSurface.GOOGLE_MAPS_VIEWPORT:
        raise ValueError(
            f"Point {grid_point.point_id} is designated for {grid_point.allowed_surface}, "
            f"not {SearchSurface.GOOGLE_MAPS_VIEWPORT}."
        )

    timestamp = datetime.now(timezone.utc).isoformat()
    obs_id = str(uuid.uuid4())
    lat, lng = grid_point.latitude, grid_point.longitude

    encoded_query = query.replace(" ", "+")
    target_url = f"https://www.google.com/maps/search/{encoded_query}/@{lat},{lng},{viewport_zoom}z"

    proxy_node: Optional[ProxyNode] = None
    proxy_dict = None
    if proxy_manager:
        proxy_node = proxy_manager.get_proxy(session_id=f"{scan_id}_{grid_point.point_id}")
        if proxy_node:
            proxy_dict = {"server": proxy_node.proxy_url}

    executable = chrome_path or get_chrome_executable()

    launch_args = [
        "--disable-blink-features=AutomationControlled",
        "--disable-infobars",
        "--no-first-run",
    ]

    async with async_playwright() as p:
        browser: Browser = await p.chromium.launch(
            executable_path=executable,
            headless=headless,
            args=launch_args,
            proxy=proxy_dict,
        )

        context: BrowserContext = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
            timezone_id=timezone_id,
            user_agent=get_stealth_user_agent(),
            geolocation={"latitude": lat, "longitude": lng, "accuracy": 20},
            permissions=["geolocation"],
        )

        page: Page = await context.new_page()

        try:
            try:
                await page.goto(target_url, wait_until="networkidle", timeout=45000)
            except Exception:
                pass

            await page.wait_for_timeout(2000)

            # Dismiss Google consent modal
            for consent_sel in ['button[aria-label*="Accept all"]', 'button:has-text("Accept all")', 'form[action*="consent"] button']:
                try:
                    c_btn = await page.query_selector(consent_sel)
                    if c_btn and await c_btn.is_visible():
                        await c_btn.click()
                        await page.wait_for_timeout(1500)
                        break
                except Exception:
                    pass

            # Sentinel Check 1: Initial Page Load
            page_text = await page.evaluate("() => document.body.innerText")
            if check_for_challenge(page_text):
                err_html = await page.content()
                err_ref = storage.store_artifacts(scan_id, f"{grid_point.point_id}_FAILED", err_html)
                if proxy_manager and proxy_node:
                    proxy_manager.report_result(proxy_node.node_id, success=False)

                return RankObservation(
                    observation_id=obs_id,
                    scan_id=scan_id,
                    point_id=grid_point.point_id,
                    status=AcquisitionStatus.ACQUISITION_FAILED,
                    requested_coordinate=(lat, lng),
                    viewport_zoom=viewport_zoom,
                    search_surface=SearchSurface.GOOGLE_MAPS_VIEWPORT,
                    query=query,
                    timestamp=timestamp,
                    artifact_ref=err_ref,
                )

            # Kinematic Humanized Scroll
            await humanized_feed_scroll(page, scroll_cycles=4)

            # Sentinel Check 2: Post-Scroll Check
            page_text_after = await page.evaluate("() => document.body.innerText")
            if check_for_challenge(page_text_after):
                err_html = await page.content()
                err_ref = storage.store_artifacts(scan_id, f"{grid_point.point_id}_FAILED", err_html)
                if proxy_manager and proxy_node:
                    proxy_manager.report_result(proxy_node.node_id, success=False)

                return RankObservation(
                    observation_id=obs_id,
                    scan_id=scan_id,
                    point_id=grid_point.point_id,
                    status=AcquisitionStatus.ACQUISITION_FAILED,
                    requested_coordinate=(lat, lng),
                    viewport_zoom=viewport_zoom,
                    search_surface=SearchSurface.GOOGLE_MAPS_VIEWPORT,
                    query=query,
                    timestamp=timestamp,
                    artifact_ref=err_ref,
                )

            # Capture Raw Evidence
            html_content = await page.content()
            screenshot_bytes = None
            if capture_screenshot:
                try:
                    screenshot_bytes = await page.screenshot(type="png", full_page=False)
                except Exception:
                    pass

            # Store Raw Artifacts
            artifact_ref = storage.store_artifacts(
                scan_id=scan_id,
                point_id=grid_point.point_id,
                html_content=html_content,
                screenshot_bytes=screenshot_bytes,
            )

            # Extract Structured Listings via Scrapling
            listings = extract_maps_listings(html_content, max_rank=20)

            # Report success to proxy manager
            if proxy_manager and proxy_node:
                proxy_manager.report_result(proxy_node.node_id, success=True)

            return RankObservation(
                observation_id=obs_id,
                scan_id=scan_id,
                point_id=grid_point.point_id,
                status=AcquisitionStatus.SUCCESS,
                requested_coordinate=(lat, lng),
                viewport_zoom=viewport_zoom,
                search_surface=SearchSurface.GOOGLE_MAPS_VIEWPORT,
                query=query,
                timestamp=timestamp,
                ranked_businesses=listings,
                artifact_ref=artifact_ref,
                censoring_horizon=20,
            )

        except Exception as e:
            if proxy_manager and proxy_node:
                proxy_manager.report_result(proxy_node.node_id, success=False)
            raise e

        finally:
            await context.close()
            await browser.close()
