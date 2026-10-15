"""kwsweep/sweep export (2026-10-15): every row says how its page was reached; a confirmed place page
is exported as its one business (H31). Fixture: the real K15 "float spa Medford" page saved at
med_bcrf49_r0.00_centroid on 2026-10-15 (marker line removed)."""
from pathlib import Path

from rarlx.fields import serp_marker

from lx import kwsweep, sweep

FIX = Path(__file__).parent / "fixtures"
SO_PAGE = (FIX / "h31_so_float_spa_place_page.html").read_text(encoding="utf-8")
LIST_PAGE = (Path(__file__).parents[3] / "rar-linux" / "tests" / "fixtures"
             / "medford_lawfirms_kw09_centroid_viewport.html").read_text(encoding="utf-8")
SO_URL = ("https://www.google.com/maps/place/SO+Float+Spa/@42.3267,-122.8746,17z/data=!4m6!3m5"
          "!1s0x54cf7b0000000001:0x9f00000000000abc!8m2!3d42.3267!4d-122.8746")


def test_confirmed_place_page_exports_one_row():
    rows = sweep.page_rows(serp_marker("place", SO_URL) + SO_PAGE)
    assert len(rows) == 1
    r = rows[0]
    assert (r["rank"], r["business_name"], r["serp_path"]) == (1, "SO Float Spa", "place")
    assert r["feature_id"] == "0x54cf7b0000000001:0x9f00000000000abc" and r["maps_url"] == SO_URL


def test_place_page_saved_before_the_panel_rendered_still_exports_its_business():
    # K15 med_bcrf49_r8.00_NW, 2026-10-15: no h1/panel in the saved page; the DB had the name from the title.
    bare = "<html><head><title>SO Float Spa - Google Maps</title></head><body><div role=main></div></body></html>"
    [r] = sweep.page_rows(serp_marker("place", SO_URL) + bare)
    assert r["business_name"] == "SO Float Spa" and r["feature_id"] == "0x54cf7b0000000001:0x9f00000000000abc"


def test_unconfirmed_place_page_exports_nothing():
    # Typed-marked place page = the retype also jumped but was not confirmed; it never became a row.
    assert sweep.page_rows(serp_marker("typed") + SO_PAGE) == []


def test_list_pages_carry_serp_path():
    assert {r["serp_path"] for r in sweep.page_rows(LIST_PAGE)} == {"url"}
    typed = sweep.page_rows(serp_marker("typed") + LIST_PAGE)
    assert len(typed) == 20 and {r["serp_path"] for r in typed} == {"typed"}


def test_kwsweep_export_uses_the_shared_parser(tmp_path, monkeypatch):
    # The H29 commit tagged sweep.export_gate only; kwsweep.export_gate wrote no serp_path at all.
    monkeypatch.setattr(kwsweep, "OUT", tmp_path)
    g = {"city_slug": "medford", "city": "Medford", "centroid": {"latitude": 42.3265, "longitude": -122.8756}, "industry": "health-wellness",
         "keyword_id": "K15", "phrase": "float spa Medford",
         "pins": [{"point_id": "p1", "latitude": 42.3, "longitude": -122.8, "radius_miles": 0, "bearing_label": "C"}]}
    mk = sweep._market(g["centroid"], g["city"])
    page = tmp_path / "medford" / f"artifacts_{mk.market_slug}_health-wellness" / "K15" / "p1" / "viewport.html"
    page.parent.mkdir(parents=True)
    page.write_text(serp_marker("place", SO_URL) + SO_PAGE, encoding="utf-8")
    assert kwsweep.export_gate(g) == 1
    assert '"serp_path": "place"' in (tmp_path / "rows.jsonl").read_text(encoding="utf-8")
