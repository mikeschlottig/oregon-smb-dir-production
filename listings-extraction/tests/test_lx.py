"""Offline tests for listings-extraction. No browser is launched and no network is touched."""
import asyncio
import json
from pathlib import Path

import pytest

from lx import cli, directory, runner
from lx import visit as visits
from lx.place_fields import extract_place, page_kind
from lx.store import RunStore
from lx.targets import load_targets, place_target
from lx.visit import Visit
import rarlx.bcrf49_linux as rx

FIX = Path(__file__).parent / "fixtures"
MEDFORD = Path("/home/mikes/rar-linux/tests/fixtures/medford_lawfirms_kw09_centroid_viewport.html")
ANDY = ("https://www.google.com/maps/place/Andy%E2%80%99s+Auto+Detailing/@44.6150879,-123.265726,12z/data=!4m11!1m3!2m2"
        "!1sUsed+Car+Dealerships+Albany+Oregon!6e6!3m6!1s0x54c01379a4a83dd7:0x3c2c7c4d356f3340!8m2!3d44.6813162!4d-123.0471678"
        "!15sCiJVc2VkIENhc!16s%2Fg%2F11f_4rk3c8?entry=ttu&g_ep=EgoyMDI2MDQyOS4wIKXMDSoASAFQAw%3D%3D")


# ── targets ────────────────────────────────────────────────────────────────────────────
def test_place_url_gives_feature_id_pin_not_viewport_and_drops_share_tokens():
    t = place_target(ANDY)
    assert t.expect_feature_id == "0x54c01379a4a83dd7:0x3c2c7c4d356f3340"
    assert (t.lat, t.lng) == (44.6813162, -123.0471678), "the !3d!4d place pin, not the /@ viewport"
    assert "entry=" not in t.url and "g_ep=" not in t.url
    assert t.name_hint.startswith("Andy’s Auto Detailing")


def test_data_only_place_url_has_id_but_no_pin():
    t = place_target("https://www.google.com/maps/place/PDX+Fingerprinting/data=!4m2!3m1!1s0x54950f18a1066bc7:0xd5daf738ddd7b67d")
    assert t.expect_feature_id == "0x54950f18a1066bc7:0xd5daf738ddd7b67d" and t.lat is None


def test_jsonl_search_record_without_point_gets_its_city_centroid(tmp_path):
    q = tmp_path / "q.jsonl"
    q.write_text(json.dumps({"kind": "search", "query": "Cali Law Ashland Oregon", "shard": "ashland__legal-services", "slug": "cali-law"}) + "\n")
    [t] = load_targets([str(q)], point_for=directory.point_for)
    assert t.kind == "search" and (t.lat, t.lng) == directory.centroids()["ashland"]


def test_every_city_centroid_is_inside_oregon():
    cs = directory.centroids()
    assert set(cs) == set(directory.cities()), "all 12 directory cities get a centroid"
    assert all(directory._in_oregon(*p) for p in cs.values())


def test_directory_queue_for_one_listing():
    [t] = directory.from_directory(["grants-pass__retail-shopping/daley-organics"])
    assert t.kind == "place" and t.expect_feature_id == "0x54c574367c852899:0x2759c1273f2ee03d"
    assert t.meta["shard"] == "grants-pass__retail-shopping"


def test_sweep_is_one_search_per_city_and_industry():
    ts = directory.centroid_sweep(city_slugs=["medford"], industry_slugs=["automotive", "legal-services"])
    assert [t.query for t in ts] == ["best Automotive in Medford oregon", "best Legal Services in Medford oregon"]


# ── extraction ─────────────────────────────────────────────────────────────────────────
def test_place_panel_fields_and_their_sources():
    html = (FIX / "place_panel_synthetic.html").read_text()
    url = "https://www.google.com/maps/place/Daley+Organics/@42.54,-123.38,17z/data=!3m1!4b1!4m6!3m5!1s0x54c574367c852899:0x2759c1273f2ee03d!8m2!3d42.5432168!4d-123.3884123"
    r = extract_place(html, url)
    assert page_kind(html) == "place"
    assert (r["business_name"], r["average_star_rating"], r["number_of_reviews"]) == ("Daley Organics", 4.6, 10)
    assert r["category"] == "Mulch supplier" and r["price"] == "$$"
    assert r["address"] == "8470 Monument Dr, Grants Pass, OR 97526"
    assert (r["phone"], r["phone_e164"]) == ("(541) 555-0123", "+15415550123")
    assert r["website"] == "https://daleyorganics.com/"
    assert r["plus_code"] == "GJVJ+7J Grants Pass, Oregon"
    assert r["weekly_hours"] == "Monday: 8 AM to 5 PM; Tuesday: 8 AM to 5 PM; Wednesday: Closed"
    assert r["claimed"] is False
    assert r["feature_id"] == "0x54c574367c852899:0x2759c1273f2ee03d" and r["cid"] == str(int("0x2759c1273f2ee03d", 16))
    assert (r["place_lat"], r["place_lng"]) == (42.5432168, -123.3884123)
    assert r["place_id"] is None, "a ChIJ in the page body is not the place's own id"
    assert r["_sources"]["name"] == "h1.DUwDvf" and r["_sources"]["address"] == '[data-item-id="address"]'


def test_semantic_attributes_survive_renamed_classes():
    html = (FIX / "place_panel_synthetic.html").read_text().replace("DUwDvf", "zzRenamed").replace("F7nice", "zz2").replace("DkEaL", "zz3")
    r = extract_place(html, "")
    assert r["business_name"] == "Daley Organics", "falls back to the main panel's aria-label"
    assert r["_sources"]["name"] == "main[aria-label]"
    assert r["average_star_rating"] == 4.6 and r["number_of_reviews"] == 10
    assert r["address"].startswith("8470 Monument Dr")


@pytest.mark.skipif(not MEDFORD.exists(), reason="rar-linux archived page not present")
def test_place_url_that_resolves_to_a_list_keeps_only_its_own_card():
    t = place_target("https://www.google.com/maps/place/OlsenDaines/data=!4m2!3m1!1s0x54cf7a3928a0ae7f:0xf2dec05fe8057dec")
    html = MEDFORD.read_text(encoding="utf-8")
    assert page_kind(html) == "list"
    [row] = runner.extract_rows(t, html, "", "list")
    assert row["business_name"] == "OlsenDaines" and row["identity"] == "match" and row["_resolved_from"] == "result_list"


def test_identity_mismatch_is_flagged():
    t = place_target("https://www.google.com/maps/place/X/data=!4m2!3m1!1s0x1:0x2")
    [row] = runner.extract_rows(t, (FIX / "place_panel_synthetic.html").read_text(), "https://www.google.com/maps/place/Y/data=!1s0x54c574367c852899:0x2759c1273f2ee03d", "place")
    assert row["identity"] == "mismatch"


# ── run loop ───────────────────────────────────────────────────────────────────────────
class FakeBrowser:
    def __init__(self):
        self.version = "151.0.7922.173"
        self.closed = False

    async def close(self):
        self.closed = True


class FakePlaywright:
    async def __aenter__(self):
        return object()

    async def __aexit__(self, *exc):
        return False


@pytest.fixture
def offline(monkeypatch):
    browsers = []

    async def fake_launch(p, chrome_path, headless):
        b = FakeBrowser()
        browsers.append(b)
        return b

    async def no_sleep(_):
        return None

    monkeypatch.setattr(runner, "launch_browser", fake_launch)
    monkeypatch.setattr(runner, "async_playwright", lambda: FakePlaywright())
    monkeypatch.setattr(runner, "resolve_chrome_executable", lambda: "/usr/bin/google-chrome")
    monkeypatch.setattr(runner.asyncio, "sleep", no_sleep)
    monkeypatch.setattr(runner, "block_cooldown_seconds", lambda: 0.0)
    return browsers


def _saved_page(tmp_path, html):
    p = tmp_path / "page.html"
    p.write_text(html, encoding="utf-8")
    return str(p)


def test_block_tears_down_browser_and_retries_through_a_different_entry_path(tmp_path, monkeypatch, offline):
    calls = []
    page = _saved_page(tmp_path, (FIX / "place_panel_synthetic.html").read_text())

    async def fake_visit(browser, target, artifacts_dir, entry_path, user_agent):
        calls.append((browser, entry_path))
        if len(calls) == 1:
            raise rx.HarvesterCircuitBreakerError("challenge", screenshot_path="x.png")
        return Visit(page, "", "https://www.google.com/maps/place/D/data=!1s0x54c574367c852899:0x2759c1273f2ee03d", "place")

    monkeypatch.setattr(visits, "visit_place", fake_visit)
    store = RunStore(tmp_path / "run")
    t = place_target("https://www.google.com/maps/place/Daley+Organics/data=!4m2!3m1!1s0x54c574367c852899:0x2759c1273f2ee03d")
    counts = asyncio.run(runner.run([t], store, headless=False, log=lambda *_: None))
    assert counts == {"done": 1}
    (b1, p1), (b2, p2) = calls
    assert b1 is not b2 and b1.closed, "the retry runs in a new browser; the blocked one is torn down"
    assert (p1, p2) == ("google_home", "maps_home")
    [row] = store.all_rows()
    assert row["business_name"] == "Daley Organics" and row["identity"] == "match"


def test_blocked_on_every_attempt_stops_the_run(tmp_path, monkeypatch, offline):
    async def always_blocked(*a, **k):
        raise rx.HarvesterCircuitBreakerError("challenge")

    monkeypatch.setattr(visits, "visit_place", always_blocked)
    store = RunStore(tmp_path / "run")
    ts = [place_target(f"https://www.google.com/maps/place/A/data=!1s0x1:0x{i}") for i in (1, 2)]
    with pytest.raises(rx.HarvesterCircuitBreakerError):
        asyncio.run(runner.run(ts, store, headless=False, log=lambda *_: None))
    assert store.status(ts[0].target_id) == "blocked" and store.status(ts[1].target_id) == "pending", "the second target is never visited"


def test_three_nameless_place_pages_in_a_row_stop_the_run(tmp_path, monkeypatch, offline):
    page = _saved_page(tmp_path, "<html><body><div role='main'><p>nothing we know</p></div></body></html>")
    visited = []

    async def empty(browser, target, *a, **k):
        visited.append(target.target_id)
        return Visit(page, "", "", "unknown")

    monkeypatch.setattr(visits, "visit_place", empty)
    store = RunStore(tmp_path / "run")
    ts = [place_target(f"https://www.google.com/maps/place/A/data=!1s0x1:0x{i}") for i in range(1, 6)]
    with pytest.raises(runner.StaleSelectorsError):
        asyncio.run(runner.run(ts, store, headless=False, log=lambda *_: None))
    assert len(set(visited)) == 3, "stops after the third target, before a fourth visit"


def test_finished_targets_are_skipped_on_restart(tmp_path, monkeypatch, offline):
    page = _saved_page(tmp_path, (FIX / "place_panel_synthetic.html").read_text())
    visited = []

    async def ok(browser, target, *a, **k):
        visited.append(target.target_id)
        return Visit(page, "", "", "place")

    monkeypatch.setattr(visits, "visit_place", ok)
    t = place_target("https://www.google.com/maps/place/D/data=!1s0x54c574367c852899:0x2759c1273f2ee03d")
    store = RunStore(tmp_path / "run")
    asyncio.run(runner.run([t], store, headless=False, log=lambda *_: None))
    asyncio.run(runner.run([t], store, headless=False, log=lambda *_: None))
    assert visited == [t.target_id]


def test_run_refuses_without_yes(capsys):
    assert cli.main(["run", ANDY, "--run", "t"]) == 2
    assert "pass --yes" in capsys.readouterr().out


def test_maps_urls_api_link_keeps_its_query_and_expects_the_place_id():
    t = place_target("https://www.google.com/maps/search/?api=1&query=Deepli%20Clean&query_place_id=ChIJZ1Zzyzwg6GcRcn-fRTAHw6s")
    assert t.url.endswith("?api=1&query=Deepli%20Clean&query_place_id=ChIJZ1Zzyzwg6GcRcn-fRTAHw6s")
    assert t.expect_place_id == "ChIJZ1Zzyzwg6GcRcn-fRTAHw6s" and t.target_id == "pid-ChIJZ1Zzyzwg6GcRcn-fRTAHw6s"
    assert t.name_hint == "Deepli Clean"


def test_place_id_decodes_to_the_feature_id_google_lands_on():
    # Real pairs from the first live run (2026-09-24): input place ID -> landed feature ID.
    from lx.targets import place_id_to_feature_id
    assert place_id_to_feature_id("ChIJZ1Zzyzwg6GcRcn-fRTAHw6s") == "0x67e8203ccb735667:0xabc30730459f7f72"
    assert place_id_to_feature_id("ChIJwb0sxytEhQURY7ocXSiWkGE") == "0x585442bc72cbdc1:0x619096285d1cba63"
    assert place_id_to_feature_id("not-a-place-id") is None


def test_identity_by_place_id_is_not_fooled_by_the_echoed_request_url():
    t = place_target("https://www.google.com/maps/search/?api=1&query=Deepli%20Clean&query_place_id=ChIJZ1Zzyzwg6GcRcn-fRTAHw6s")
    html = (FIX / "place_panel_synthetic.html").read_text() + "<a href='?query_place_id=ChIJZ1Zzyzwg6GcRcn-fRTAHw6s'></a>"
    right = "https://www.google.com/maps/place/Deepli/data=!1s0x67e8203ccb735667:0xabc30730459f7f72"
    wrong = "https://www.google.com/maps/place/Other/data=!1s0x54c574367c852899:0x2759c1273f2ee03d"
    assert runner.extract_rows(t, html, right, "place")[0]["identity"] == "match"
    assert runner.extract_rows(t, html, wrong, "place")[0]["identity"] == "mismatch", "the echoed ChIJ must not count"


def test_p10_3_listings_queue_as_place_targets():
    ts = directory.from_directory(["portland__business-professional-services/deepli-clean", "portland__health-medical/north-tabor-dental"])
    assert [t.kind for t in ts] == ["place", "place"] and all(t.expect_place_id for t in ts)


def test_search_that_opens_a_single_place_is_read_as_a_place():
    t = load_targets(["Daley Organics Grants Pass Oregon"], lat=42.44, lng=-123.33)[0]
    [row] = runner.extract_rows(t, (FIX / "place_panel_synthetic.html").read_text(), "", "list")
    assert row["business_name"] == "Daley Organics" and row["_resolved_from"] == "search_to_place"


# ── sweep ──────────────────────────────────────────────────────────────────────────────
def test_queries_are_one_per_industry_and_follow_the_template():
    from lx import sweep
    q = sweep.load_queries()
    assert set(q) == set(directory.industries())
    assert q["automotive"]["term"] == "auto repair shop" and q["travel-hospitality"]["term"] == "hotel"


def test_medford_market_is_the_master_manifest_unchanged():
    import json as _j
    from lx import sweep
    master = Path("/mnt/c/Dev/standalone-archives-and-zips/ranks-above-replacement-20260913T085954Z-1-001/MEDFORD_49_GEO_PINS_MASTER_MANIFEST_V_0_01.json")
    if not master.exists() or not (sweep.MARKETS / "medford.json").exists():
        pytest.skip("master manifest or medford.json not present")
    ours = _j.loads((sweep.MARKETS / "medford.json").read_text())["geo_pins"]
    assert [(p["latitude"], p["longitude"]) for p in ours] == [(p["latitude"], p["longitude"]) for p in _j.loads(master.read_text())["geo_pins"]]


@pytest.mark.skipif(not MEDFORD.exists(), reason="rar-linux archived page not present")
def test_gate_export_reads_every_saved_pin_page(tmp_path, monkeypatch):
    from lx import sweep
    monkeypatch.setattr(sweep, "OUT", tmp_path)
    pins = [{"point_id": "medford_or_bcrf49_r0.00_centroid", "latitude": 42.3265, "longitude": -122.8756, "radius_miles": 0.0, "bearing_label": "CENTER"}]
    g = {"city_slug": "medford", "city": "Medford", "industry": "legal-services", "keyword_id": "Q-legal-services",
         "phrase": "best attorney in Medford oregon", "centroid": {"latitude": 42.3265, "longitude": -122.8756}, "pins": pins}
    page = tmp_path / "medford" / "artifacts_medford_or_legal-services" / "Q-legal-services" / pins[0]["point_id"] / "viewport.html"
    page.parent.mkdir(parents=True)
    page.write_text(MEDFORD.read_text(encoding="utf-8"), encoding="utf-8")
    assert sweep.export_gate(g) == 20
    rows = [json.loads(l) for l in (tmp_path / "rows.jsonl").read_text().splitlines()]
    assert rows[0]["business_name"] == "OlsenDaines" and rows[0]["query"] == "best attorney in Medford oregon" and rows[0]["rank"] == 1


def test_every_market_pin_sits_at_its_ring_radius_and_bearing():
    """Independent inverse check: haversine distance and initial bearing from the centre
    back to each pin, computed here — not by the generator that placed them."""
    import math
    from lx import sweep
    for m in sweep.load_markets():
        c = m["market"]["market_centroid"]
        la1, lo1 = math.radians(c["latitude"]), math.radians(c["longitude"])
        assert directory._in_oregon(c["latitude"], c["longitude"])
        for p in m["geo_pins"]:
            la2, lo2 = math.radians(p["latitude"]), math.radians(p["longitude"])
            h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
            d = 2 * 3958.7613 * math.asin(math.sqrt(h))
            assert abs(d - p["radius_miles"]) < 0.03, (m["market"]["city_slug"], p["point_id"], d)
            if p["radius_miles"]:
                brg = (math.degrees(math.atan2(math.sin(lo2 - lo1) * math.cos(la2),
                       math.cos(la1) * math.sin(la2) - math.sin(la1) * math.cos(la2) * math.cos(lo2 - lo1))) + 360) % 360
                assert min(abs(brg - p["bearing_degrees"]), 360 - abs(brg - p["bearing_degrees"])) < 0.5, (p["point_id"], brg)
