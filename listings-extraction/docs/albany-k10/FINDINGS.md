# Albany K10 — findings, fix, and monitoring (2026-10-30)

Gate: city `albany`, industry `sports-fitness`, keyword `K10` "rock climbing gym Albany". Companion files: `code-findings.md` (code trace), `haiku-log-findings.md` (log forensics, Haiku), `hypothesis.md` (predictions), `tasks.md` (plan), `daily/` (monitor output).

## 1. What happened (OBSERVED)

- Five attempts, 2026-10-26 to 2026-10-30, all `incomplete (exit 1)`, `rows: 0` (`output/kwsweep/gates.jsonl` Albany K10 rows; the last on 10-30 04:38Z).
- Every attempt verified 48 of 49 pins and failed on one: pin 30, `albany_or_bcrf49_r2.00_S`. `nightly-20261029.log:78-84`: "Place jump to 'Valley Rock Gym - Google Maps' — re-running the search typed into Maps at the pin." then three times "Partial harvest (0/20 listings)", then "GATE INCOMPLETE: Only captured 0/20 listings after 3 attempts." `:105`: "GATE LOCKED: Keyword [K10] did not achieve 100% pin verification (48/49). Halting."
- Failed pins per attempt (log scan): [26,30,40] -> [30,40] -> [30,40] -> [30] -> [30]. Pins 26 and 40 were flaky and passed on retry. Pin 30 failed every time.
- Not a thin-market problem: K11 in the same city has the same two-listing profile and passed (Haiku, `nightly-20261026.log:4942`).

## 2. Root cause (OBSERVED in the saved page + code)

The URL search jumped to one place (Valley Rock Gym). The typed retry landed on a *different* place page (SOLID ROCK FITNESS, permanently closed): saved `viewport.html` for pin 30 has marker `serp_path=typed`, title "SOLID ROCK FITNESS - Google Maps", no `role="feed"`, no end-of-list text.

`rar-linux/src/rarlx/bcrf49_linux.py` (before the fix) accepted a one-business answer only when both paths landed on the *same* business (`confirmed_single_place`, H31). Different businesses = "not confirmed" = "the list wins" — but there was no list. The code then parsed a place page as a result list, got 0 listings, retried the identical thing twice more, and failed the pin. It is deterministic, so it failed the same way every night. Medford and Grants Pass K10 pass because their jumps land on the same business both times.

## 3. Two further defects that made it cost days (OBSERVED, `kwsweep.py`)

- **A. Results discarded.** `run()` exported rows only when the gate was `complete` (`rows = export_gate(g) if state == "complete" else 0`). The 48 verified pins were in the evidence DB but never reached `rows.jsonl`, so the gate showed 0 rows.
- **B. Retried first every night.** `todo` was every gate not `complete`, in priority order, so a permanently failing gate was the head of the queue each night (159 to 1368 s each time).

Also found: the 3 Grants Pass retail gates K04/K05/K17 are not failing. They were pruned from the plan on 2026-10-22 (`keywords/pruned-gates.json`, commit `cbde355`) as near-duplicates of sibling gates, so they never run. See section 7.

## 4. The fix (applied; live run untouched)

Safety: both repos are loaded once per process. The 2026-10-29 21:35 run holds the old code in memory and is unaffected; the new code runs from the next process start (tonight 21:29).

1. **H32 split place** (`rar-linux`: `fields.py` `landed_on_place`, `place_jump_outcome`; `bcrf49_linux.py` uses it). When the typed path also ends on a real place page, a different business than the URL jump, the page Maps served last is stored as rank 1 of 1 (`serp_path=place`). No ranking is invented. A blank or bare-titled page still fails the pin.
2. **Keep what is verified** (`kwsweep.py`): `export_gate(g, verified_only=True)` for an incomplete gate exports every pin the evidence store marks verified. `exported-pins.jsonl` records each exported pin so the retry that completes the gate adds only the new pins (no duplicates). The gates.jsonl record gains `pins_verified`.
3. **Skip and move on** (`kwsweep.py`): a gate whose last `STUCK_AFTER` (2) attempts ended incomplete *without gaining a verified pin* is marked `skipped` once in gates.jsonl and dropped from the queue. `--keywords K10` retries it. `status()` lists stuck gates. Attempts before `STUCK_EPOCH` (2026-10-30 16:00Z, after the old-code run exits) do not count, so Albany K10 gets its retry tonight on the fixed code. Bump `STUCK_EPOCH` with each harvest fix that unblocks a gate.

Changed semantics to know: the H31 test "fail the pin when typed search lands elsewhere" encoded the old rule; replaced by `test_harvest_keeps_the_last_place_when_typed_search_lands_on_another_place`. Blank-page failure is kept as its own test. One stale test fixed on the way (`test_kwsweep_plan_...` ignored the 3 pruned gates).

## 5. Proof

- `rar-linux`: 38 passed (new `tests/test_h32_split_place.py`, 6 tests; harvest-level tests drive the real `harvest_single_pin` with a fake page).
- `listings-extraction`: 50 passed (5 new: stall rule, progress resets, epoch, run skips and marks once and `--keywords` retries, verified-only export never twice).
- Replay on the real ledger: `stuck_gates() == {}`, `status()["next"]` = "Albany · rock climbing gym Albany" (it will run tonight).
- NOT proven: the fix on live Google. The H32 decision was exercised with a fake page and the real saved page's title, not a live browser session; a second concurrent Chrome against Google beside the live run was deliberately not started. Tonight's run is the real test.

## 6. Limits (honest)

- A pin with 1 to 19 listings and no end-of-list text (partial, not zero) is still not stored; only fully verified pins are kept. Nothing in the 5 Albany attempts hit this; if the monitor shows it, the next step is to store them flagged `unverified`.
- `skipped` is not "fixed": a skipped gate has missing data until someone resolves it. The daily report lists them.
- `rows.jsonl` for older incomplete gates (Medford K14 and K15 on Oct 14-15) were later completed normally; no backfill needed.

## 7. Open question for Mike

Grants Pass retail K04, K05 and K17 are pruned by an agent-written rule ("70% already captured"). Their probes returned 7, 17 and 18 businesses, of which 6, 4 and 6 would be new. If those should run, remove their entries from `keywords/pruned-gates.json` (archive the file first).

## 8. Monitoring

`scripts/gate-health-check.py` tests H2 to H6 against the ledgers every day and writes `docs/albany-k10/daily/<date>.md`; exit 1 on any FAIL. Fix-on-failure: read the day's report, open the log lines it cites, hypothesize, fix, add a dated entry to `hypothesis.md`.
