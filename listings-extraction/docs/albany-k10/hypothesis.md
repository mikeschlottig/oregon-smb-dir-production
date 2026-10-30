# Albany K10 — hypotheses (predict -> measure -> diff -> why)

## H1 (Mike, 2026-10-30) — RESULT: partly right
Albany K10 captures real results, then a strict gate discards them.
- Prediction: per-pin captures for most pins, then a gate failure line; no rows exported.
- Measured: 48/49 pins verified, 1 pin (30) returns 0 listings in every attempt; the gate locks and the 48 are never exported (`kwsweep.py:273`).
- Diff: the rule is per pin, not 20 across 49. And what failed was not "too few results": it was a place jump to two *different* businesses, parsed as a list.
- Why: H31 only handled "both paths agree"; the disagree case had no outcome except "0 listings".

## Predictions for the fix (checked daily by scripts/gate-health-check.py; dates are the run that finishes that morning)

- **H2** Albany K10 completes on its first run after 2026-10-30 16:00Z (night of 10-30 to 10-31): log shows "URL search jumped to 'Valley Rock Gym' ... typed search landed on 'SOLID ROCK FITNESS'" at pin 30, `GATE UNLOCKED`, a `complete` row in gates.jsonl, rows near the thin-market Albany sports-fitness gates (K11 and K14: 98 rows each; the 15 complete gates range 98 to 980). If this fails: read the pin 30 block first.
- **H3** Any gate that ends incomplete after the fix has `rows > 0` whenever `pins_verified > 0`.
- **H4** `exported-pins.jsonl` never contains a duplicate key; the retry that completes a gate adds only new pins.
- **H5** A gate with 2 consecutive incomplete attempts and no gained pin is marked `skipped` exactly once and is not attempted again until named with `--keywords`. No gate is attempted more than 2 times after the epoch without gaining a pin.
- **H6** The sweep keeps moving: complete gates per night stay at the recent rate. Measured from gates.jsonl (UTC `finished_at` date): 10-19 to 10-27 ran 32 to 94 a night (typical 36 to 42); 10-28 shows 4 only because that run crossed UTC midnight (`nightly-20261028.log:1` start 15:43 PDT, `:5526` exit 0 at 00:51 PDT, 42 `complete:` lines; the date buckets split it 4 + 37). Compare per run (count `complete:` lines in the night's log), not per UTC date.
- **H7 (risk)** A new class of failure appears that this fix does not cover (a pin with 1 to 19 listings and no end-of-list text). Signal: an incomplete gate whose log shows "Partial harvest (N/20)" with N > 0. Action: store those pins flagged `unverified`.

## Daily log (append one dated line per check)

- 2026-10-30 05:37 PDT baseline: all PENDING (no attempt since the fix), H5 PASS vacuously.
