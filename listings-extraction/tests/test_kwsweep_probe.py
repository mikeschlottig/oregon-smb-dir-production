"""H33 (2026-10-15): one-pin keyword probe — classify, skip what is known, stop on a block."""
import asyncio
import json
import sys
import types

from lx import kwsweep

ROW = {"business_name": "A", "serp_path": "url"}


def gate(kw, phrase="q"):
    return {"city_slug": "medford", "city": "Medford", "industry": "health-wellness", "keyword_id": kw,
            "phrase": phrase, "pins": [{"point_id": "c", "latitude": 42.3, "longitude": -122.8}]}


def test_probe_kind():
    assert kwsweep.probe_kind([ROW] * 20, False) == "list"
    assert kwsweep.probe_kind([ROW] * 7, True) == "short"
    assert kwsweep.probe_kind([ROW] * 7, False) == "fail"       # short with no end-of-list proof
    assert kwsweep.probe_kind([], False) == "fail"
    assert kwsweep.probe_kind([{**ROW, "serp_path": "place"}], True) == "place"


def test_probe_todo_skips_probed_and_complete(tmp_path, monkeypatch):
    monkeypatch.setattr(kwsweep, "PROBES", tmp_path / "probes.jsonl")
    monkeypatch.setattr(kwsweep, "plan", lambda c=None, i=None, k=None: [
        g for g in (gate("K02"), gate("K03"), gate("K04")) if not k or g["keyword_id"] in k])
    monkeypatch.setattr(kwsweep, "done_gates", lambda: {("medford", "health-wellness", "K03")})
    (tmp_path / "probes.jsonl").write_text(json.dumps({**gate("K04"), "kind": "list", "n": 20}) + "\n")
    assert [g["keyword_id"] for g in kwsweep.probe_todo()] == ["K02"]
    # Naming keywords re-includes complete gates (to probe a known one), never already-probed ones.
    assert [g["keyword_id"] for g in kwsweep.probe_todo(keyword_ids=["K03", "K04"])] == ["K03"]


def test_probe_records_and_stops_on_block(tmp_path, monkeypatch):
    import rarlx.bcrf49_linux as rx
    monkeypatch.setattr(kwsweep, "OUT", tmp_path)
    monkeypatch.setattr(kwsweep, "PROBES", tmp_path / "probes.jsonl")

    answers = iter([([{**ROW, "serp_path": "place", "business_name": "SO Float Spa"}], "p.html", "", True),
                    rx.HarvesterCircuitBreakerError("captcha"),
                    ([ROW] * 20, "p.html", "", False)])

    async def fake_harvest(*a, **k):
        a = next(answers)
        if isinstance(a, Exception):
            raise a
        return a

    class Browser:
        version = "151"
        async def close(self): pass

    async def fake_launch(*a, **k): return Browser()

    class PW:
        async def __aenter__(self): return object()
        async def __aexit__(self, *a): return False

    monkeypatch.setattr(rx, "harvest_single_pin", fake_harvest)
    monkeypatch.setattr(rx, "launch_browser", fake_launch)
    monkeypatch.setattr(rx, "resolve_chrome_executable", lambda: "chrome")
    monkeypatch.setitem(sys.modules, "patchright.async_api", types.SimpleNamespace(async_playwright=PW))

    async def no_sleep(*a): pass
    monkeypatch.setattr(kwsweep.asyncio, "sleep", no_sleep)

    n = asyncio.run(kwsweep._probe([gate("K15", "float spa Medford"), gate("K16"), gate("K17")], True, lambda m: None))
    recs = [json.loads(l) for l in (tmp_path / "probes.jsonl").read_text().splitlines()]
    assert n == 2 and [r["kind"] for r in recs] == ["place", "blocked"]   # K17 never asked after the block
    assert recs[0]["top"] == ["SO Float Spa"]
