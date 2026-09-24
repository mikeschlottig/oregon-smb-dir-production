"""
The run loop — rarlx's execute_bcrf49_pipeline discipline, applied to a queue of targets
(rar-linux src/rarlx/bcrf49_linux.py:934-1037):

  - one real-Chrome browser at a time; one fresh context per target      (:934, harvest :769)
  - browser process recycled every 7 targets, 2 s pause                  (:960-965)
  - ordinary failure: up to 3 attempts, backoff 2^n + U(1,3) s           (:969-1010)
  - block (challenge page): screenshot, tear the whole browser down, cool 30–120 s, new
    browser, next entry path; still blocked on attempt 3 → the run stops (:990-1003)
  - 3–6 s uniform pause between targets                                  (:1037)
  - finished targets are skipped on restart                               (:946-958)

Added here, because a queue of single places has failure modes a grid harvest does not:
  - identity: the feature ID the browser lands on must equal the one in the input URL
  - stale selectors: 3 place pages in a row with no business name stops the run — Google
    renamed the markup, and further visits would only collect empty rows
"""
from __future__ import annotations

import asyncio
import random
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from rarlx.bcrf49_linux import (
    ENTRY_PATHS,
    HarvesterCircuitBreakerError,
    async_playwright,
    block_cooldown_seconds,
    derive_user_agent,
    launch_browser,
    next_entry_path,
    resolve_chrome_executable,
)
from rarlx.fields import extract_full_listings

from lx.place_fields import extract_place, missing_core
from lx.store import RunStore
from lx.targets import Target, feature_id_of
from lx import visit as visits

RECYCLE_EVERY = 7
MAX_ATTEMPTS = 3
STALE_AFTER = 3
US_REGION = re.compile(r",\s*([A-Z]{2})\s+\d{5}")


class StaleSelectorsError(RuntimeError):
    pass


def address_region(address: Optional[str]) -> Optional[str]:
    m = US_REGION.search(address or "")
    return m.group(1) if m else None


def extract_rows(target: Target, html: str, final_url: str, page_kind: str) -> List[Dict[str, Any]]:
    """Rows for one visit. Place target → at most one row; search target → every card."""
    if target.kind == "search":
        rows = extract_full_listings(html, max_rank=20)
    elif page_kind == "list":
        # The place URL resolved to a list: keep only the card that is this place.
        cards = extract_full_listings(html, max_rank=20)
        rows = [c for c in cards if target.expect_feature_id and (c.get("feature_id") or "").lower() == target.expect_feature_id]
        for r in rows:
            r["_resolved_from"] = "result_list"
    else:
        rows = [extract_place(html, final_url)]
    for r in rows:
        r["identity"] = identity(target, r, html)
        r["address_region"] = address_region(r.get("address"))
    return rows


def identity(target: Target, row: Dict[str, Any], html: str) -> str:
    """Did the browser land on the place the input named? By feature ID, else by place ID."""
    got = (row.get("feature_id") or feature_id_of(row.get("maps_url") or "") or "").lower() or None
    if target.expect_feature_id and got:
        return "match" if got == target.expect_feature_id else "mismatch"
    if target.expect_place_id:
        if row.get("place_id") == target.expect_place_id:
            return "match"
        # A place page carries its own ChIJ id in the page state; a different place's would not.
        return "match" if target.expect_place_id in html else "mismatch" if row.get("place_id") else "unknown"
    return "unknown"


def _usable(target: Target, rows: List[Dict[str, Any]]) -> bool:
    if target.kind == "search":
        return len(rows) > 0
    return bool(rows) and bool(rows[0].get("business_name"))


async def run(
    targets: List[Target],
    store: RunStore,
    headless: bool,
    limit: Optional[int] = None,
    log=print,
) -> Dict[str, int]:
    store.enqueue(targets)
    todo = [t for t in targets if store.status(t.target_id) != "done"]
    done_before = len(targets) - len(todo)
    if limit is not None:
        todo = todo[:limit]
    log(f"[lx] {len(targets)} targets, {done_before} already done, running {len(todo)}")
    if not todo:
        return store.counts()

    chrome = resolve_chrome_executable()
    stale = 0
    async with async_playwright() as p:
        browser = await launch_browser(p, chrome, headless)
        user_agent = derive_user_agent(browser.version, headless)
        log(f"[lx] Chrome {browser.version} | headless={headless} | UA override: {user_agent or 'none (Chrome reports its own)'}")
        entry_path = ENTRY_PATHS[0]
        try:
            for i, t in enumerate(todo, start=1):
                if i > 1 and i % RECYCLE_EVERY == 1:
                    log("[lx] recycling browser process (every 7 targets)")
                    await browser.close()
                    await asyncio.sleep(2.0)
                    browser = await launch_browser(p, chrome, headless)

                label = t.url if t.kind == "place" else f"'{t.query}' @ {t.lat:.5f},{t.lng:.5f}"
                log(f"[{i:03d}/{len(todo)}] {t.kind} {t.target_id} {label}")
                rows: List[Dict[str, Any]] = []
                visit = None
                last_error = None
                for attempt in range(1, MAX_ATTEMPTS + 1):
                    try:
                        if t.kind == "place":
                            visit = await visits.visit_place(browser, t, store.artifacts, entry_path, user_agent)
                        else:
                            visit = await visits.visit_search(browser, t, store.artifacts, entry_path, user_agent, headless)
                        html = Path(visit.html_path).read_text(encoding="utf-8") if visit.html_path else ""
                        rows = extract_rows(t, html, visit.final_url, visit.page_kind)
                        if _usable(t, rows):
                            break
                        last_error = f"attempt {attempt}: nothing usable extracted (page_kind={visit.page_kind})"
                        log(f"      [!] {last_error}; backing off")
                    except HarvesterCircuitBreakerError as block:
                        # Never retry a block in the same browser (Mike, 2026-09-23).
                        log(f"      [BLOCK] attempt {attempt}/{MAX_ATTEMPTS}: {block} | evidence: {block.screenshot_path}")
                        if attempt == MAX_ATTEMPTS:
                            store.mark(t.target_id, "blocked", entry_path=entry_path, last_error=str(block))
                            raise
                        await browser.close()
                        cooldown = block_cooldown_seconds()
                        entry_path = next_entry_path(entry_path)
                        log(f"      [BLOCK] browser torn down; cooling {cooldown:.0f}s, then a new browser via '{entry_path}'")
                        await asyncio.sleep(cooldown)
                        browser = await launch_browser(p, chrome, headless)
                        continue
                    except Exception as e:  # ordinary failure: timeouts, partial loads
                        last_error = f"attempt {attempt}: {type(e).__name__}: {e}"
                        log(f"      [!] {last_error}")
                    if attempt < MAX_ATTEMPTS:
                        await asyncio.sleep((2 ** attempt) + random.uniform(1.0, 3.0))

                evidence = dict(
                    entry_path=entry_path,
                    html_path=visit.html_path if visit else None,
                    screenshot_path=visit.screenshot_path if visit else None,
                    final_url=visit.final_url if visit else None,
                    page_kind=visit.page_kind if visit else None,
                )
                if _usable(t, rows):
                    store.save_rows(t.target_id, rows)
                    store.mark(t.target_id, "done", last_error=None, **evidence)
                    head = rows[0]
                    log(f"      [OK] {len(rows)} row(s) | {head.get('business_name')} | {head.get('average_star_rating')}★ ({head.get('number_of_reviews')}) | identity={head.get('identity')}"
                        + (f" | missing {', '.join(missing_core(head))}" if t.kind == "place" and missing_core(head) else ""))
                    stale = 0
                else:
                    store.mark(t.target_id, "failed", last_error=last_error, **evidence)
                    if t.kind == "place" and visit and visit.page_kind != "list":
                        stale += 1
                        if stale >= STALE_AFTER:
                            raise StaleSelectorsError(
                                f"{STALE_AFTER} place pages in a row gave no business name. The markup has likely changed: "
                                f"fix lx/place_fields.py against the saved pages, then `lx reparse`. Evidence: {store.artifacts}"
                            )

                await asyncio.sleep(random.uniform(3.0, 6.0))
        finally:
            await browser.close()
    return store.counts()
