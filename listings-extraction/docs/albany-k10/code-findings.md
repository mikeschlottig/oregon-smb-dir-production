# Albany K10 — code-side findings (2026-10-30)

Read-only investigation. Nothing under `src/`, `output/`, `keywords/` was edited. Indexes built: CODE `codebase-intel-toolkit/indexes/listings-extraction`, DOCS `doc-intel/indexes/listings-extraction.db`. Added one inert file `listings-extraction/.codeintelignore` (excludes `.venv`, `output`, `_archive`, ...) so the indexer does not walk 300 MB+ of run data.

Gate being investigated: city `albany`, industry `sports-fitness`, keyword `K10`, phrase "rock climbing gym Albany" (`keywords/keyword-sets.json:206`, template `rock climbing gym {city}`). K10 is a different phrase in every industry; this is only the sports-fitness one.

## 1. Where the gate actually lives

kwsweep does not decide pass/fail. It calls rarlx `execute_bcrf49_pipeline` unchanged (`src/lx/kwsweep.py:4`, import at `:33`) and catches its `SystemExit` (`src/lx/kwsweep.py:271`, "rarlx GATE LOCKED: fewer than 49 pins verified"). The decision is in the sibling repo `/home/mikes/rar-linux` (path dependency, `pyproject.toml:23`), file `src/rarlx/bcrf49_linux.py`.

## 2. The rule (OBSERVED, quoted)

`bcrf49_linux.py:1065` and `:1090`:

    is_valid = len(listings) >= 20 or (len(listings) > 0 and end_of_list)

- A pin is stored only when `is_valid` (`:1091-1100`, `store.save_observation_and_rankings`).
- Otherwise `:1112`: `[!] GATE INCOMPLETE: Only captured {len(listings)}/20 listings after {max_attempts} attempts.` The partial listings are discarded; only `viewport.html` / `viewport.png` remain on disk (written at `:904-910` before the validity test).
- After the loop `:1122-1144`: if `completed_pins_for_kw != len(active_pins)` then `GATE LOCKED ... Halting.` and `sys.exit(1)`.
- kwsweep records `incomplete (exit 1)`, skips `export_gate` (`src/lx/kwsweep.py:273`), so `rows` = 0 (gates.jsonl).

## 3. How "end of list" is decided (OBSERVED)

`bcrf49_linux.py:414-423` `is_end_of_list_reached` returns True only if the page HTML/text contains one of four English strings: "you've reached the end of the list", "reached the end of the list", "end of the list", "no more results". Set at `:923` for a normal SERP; at `:917` it is forced True for a confirmed single-business place page (H31).

So a pin with 1..19 listings is accepted ONLY if Google printed that sentinel. A pin with 1..19 listings and no sentinel is a hard failure after 3 attempts (`:1053-1088`, backoff `2**attempt + 1..3 s`).

## 4. Evidence this gate is a small market (OBSERVED)

`output/kwsweep/probes.jsonl` (Albany sports-fitness K10 centroid probe, 2026-10-27T03:08Z): `"kind": "short", "n": 2, "top": ["Valley Rock Gym", "SOLID ROCK FITNESS"]`. Only two climbing gyms came back at the centroid.

`output/kwsweep/gates.jsonl` Albany K10 rows: lines 555, 559, 599 all `"status": "incomplete (exit 1)", "rows": 0` (2026-10-26T22:25Z 1368 s; 2026-10-27T03:19Z 388 s; 2026-10-27T19:05Z 377 s). Comparators that passed: Medford K10 (line 174, rows 49) and Grants Pass K10 (line 363, rows 598).

## 5. Status of the hypothesis (Mike's)

Direction CONFIRMED by code: a gate in which any pin legitimately returns fewer than 20 results AND fails the sentinel test is locked, and its captured partial results are not saved. Not yet known (waiting on log forensics): which pins fail, what they returned, and whether the sentinel was absent or the pin had some other failure (block, place jump). Mike's wording "couldn't get the full 20 across all 49 pins" is slightly off: the rule is per pin, not a 49 x 20 total.

## 6. Open questions for the logs

1. For the failing pins, n captured and is the sentinel text on the saved `viewport.html`?
2. Is the failure the same pin set on every retry (deterministic), i.e. why is the gate stuck for days?
3. Why did attempts 2 and 3 take only ~380 s (resume skips stored pins) and does a re-run retry only the failed pins?
