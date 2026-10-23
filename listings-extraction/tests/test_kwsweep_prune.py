"""2026-10-22: keywords/pruned-gates.json removes single (city, industry, keyword) gates from the plan.

keyword-sets.json keywords are shared by every city, so a per-city decision cannot live there.
"""
import json

import pytest

from lx import kwsweep

MARKETS = [
    {"market": {"city_slug": "medford", "city": "Medford", "market_centroid": {"lat": 42.3, "lng": -122.8}}, "geo_pins": []},
    {"market": {"city_slug": "grants-pass", "city": "Grants Pass", "market_centroid": {"lat": 42.4, "lng": -123.3}}, "geo_pins": []},
]
SETS = {"retail-shopping": {"keywords": [{"id": k, "template": f"{k} {{city}}"} for k in ("K03", "K04", "K05")]}}


@pytest.fixture
def wired(tmp_path, monkeypatch):
    monkeypatch.setattr(kwsweep.sweep, "load_markets", lambda cities=None: [dict(m) for m in MARKETS])
    monkeypatch.setattr(kwsweep, "load_sets", lambda industries=None: SETS)
    monkeypatch.setattr(kwsweep, "PRUNED", tmp_path / "pruned-gates.json")
    monkeypatch.setattr(kwsweep, "OUT", tmp_path)
    monkeypatch.setattr(kwsweep, "PROBES", tmp_path / "probes.jsonl")
    return tmp_path


def keys(gates):
    return {(g["city_slug"], g["keyword_id"]) for g in gates}


def test_no_file_changes_nothing(wired):
    assert len(kwsweep.plan()) == 6
    assert kwsweep.pruned_gates() == set()


def test_pruned_gate_is_skipped_for_its_own_city_only(wired):
    (wired / "pruned-gates.json").write_text(json.dumps([
        {"city_slug": "grants-pass", "industry": "retail-shopping", "keyword_id": "K04",
         "reason": "same 7 businesses as K03", "pruned_at": "2026-10-22"}]))
    got = keys(kwsweep.plan())
    assert ("grants-pass", "K04") not in got
    assert ("medford", "K04") in got                      # same keyword id, other city: untouched
    assert len(got) == 5


def test_named_keyword_overrides_the_prune(wired):
    (wired / "pruned-gates.json").write_text(json.dumps([
        {"city_slug": "grants-pass", "industry": "retail-shopping", "keyword_id": "K04", "reason": "r", "pruned_at": "2026-10-22"}]))
    assert ("grants-pass", "K04") in keys(kwsweep.plan(keyword_ids=["K04"]))


def test_malformed_entry_fails_loudly(wired):
    (wired / "pruned-gates.json").write_text(json.dumps([{"city_slug": "grants-pass", "keyword_id": "K04"}]))
    with pytest.raises(ValueError, match="industry"):
        kwsweep.pruned_gates()


def test_status_reports_pruned_count(wired):
    (wired / "pruned-gates.json").write_text(json.dumps([
        {"city_slug": "grants-pass", "industry": "retail-shopping", "keyword_id": k, "reason": "r", "pruned_at": "2026-10-22"}
        for k in ("K04", "K05")]))
    st = kwsweep.status()
    assert st["pruned"] == 2
    assert st["gates"] == 4
