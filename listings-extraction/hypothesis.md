# hypothesis — kwsweep artifact backup + compression (2026-10-22)

Format: prediction written BEFORE the run → reality → diff → why.

## H1 — HTML compresses ≥4× with gzip, ≥5× with xz (task 1)
- Prediction: gzip -9 ≈ 4.2× (the 20-file test in IMPROVEMENTS item 1); xz -9 a further 20–40 % smaller.
- Reality (40 files, 19.8 MB): gzip -9 4.31× in 0.56 s total; xz -9 4.89× in 5.8 s.
- Diff: gzip right; xz only +13 % over gzip, not +20–40 %, and 10× slower. Chose gzip (readable by every tool, browsers).

## H2 — PNG → lossless WebP saves 20–40 % and is bit-exact (task 1)
- Prediction: screenshots of a map-search page are flat-colour heavy, so lossless WebP beats PNG by roughly 25–35 %.
- Reality (40 files, 25.1 MB, 1920×1080): `-z 9` 2.01× (saves 50 %) at 7.1 s/file; on the same 10 files z=6 1.62× at
  0.53 s, z=7 1.65× at 0.82 s, z=8 1.64× at 1.35 s, z=9 2.03× at ~7 s, z=0 1.29×, z=2 1.52×. Bit-exact: 10/10 identical
  by Pillow, 3/3 by ffmpeg RGBA MD5, and both negative controls (different image, lossy q60) hash differently.
- Diff: saving better than predicted (38 % at z=6, 50 % at z=9) — flat-colour was right, magnitude under-called. Only z=9
  is a real step up; 7 and 8 buy nothing. Chose z=6 (13× cheaper than z=9). z=9 would save ~1.2 GB more over today's
  9.8 GB of PNGs for ~28 CPU-hours — left as a documented option.

## H3 — the atlas will classify the kwsweep output as `missing`, not `same` (task 2)
- Prediction: the `wsl2` snapshot is 2026-10-14; most gates finished after that, and 10-12..10-14 gates may be partly there.
- Reality (compare 2026-10-22 20:49): missing 23,554 files / 13.9 GB · same 9,566 / 5.9 GB · changed 91 / 434 MB ·
  duplicate 97 / 43 MB. Upload: 23,645 objects 14.4 GB, 0 failed, 491.8 s, run manifest
  `_atlas/runs/20261023T035607Z/manifest.jsonl.gz` (UTC stamp; local time 20:56 PDT Oct 22).
- Diff: right — 70 % missing; 28 % already in R2 (the 10-12..10-14 gates were in the 10-14 snapshot, so partly there).
- Post-upload proof (`atlas verify … --hash --sample 50`): listing 33,211 checked, absent 0, wrong size 0, wrong etag 0;
  content 33,211 equal / 0 differ / 0 size-only; download sample 50/50 byte-identical. Exit 1 ("VERIFY FAIL") is only
  because 97 files are `duplicate` (same bytes in R2 under another key, none at their own key) — they are not `same`,
  so the reclaim script never selects them.

## H4 — nothing breaks when finished gates hold `.html.gz` (task 4) — RETIRED
- Mike chose removal over compression (2026-10-22 21:02), so this was never run. Replaced by the removal check:
  prediction "run data is byte-identical after deleting viewport.*". Reality: rows.jsonl 348,105,847 B / 304,375 lines and
  gates.jsonl 338 lines identical before/after the one-gate, 40-gate and full runs. Diff: none.

## H5 — deleting 18.94 GB inside WSL does NOT raise C: free (task 5)
- Prediction (written after seeing `sparseVhd=true` in .wslconfig, before checking the file): C: free rises ~18 GB.
- Reality: Windows free 61.88 GiB before and after; VM free rose 18,076 MB. `fsutil sparse queryflag` on ext4.vhdx:
  "NOT set as sparse"; the file is 212 GB. Diff: prediction wrong — `sparseVhd=true` only applies to newly created VHDs.
- Open test (decides urgency): note vhdx length now (212.1 GB at 21:10) and after tonight's run; the sweep writes
  ~2 GB/night of run data plus the ~3.5 GB of pages it deletes at the end. If the length stays ≈ 212 GB, ext4 reuses the
  freed blocks and C: holds; if it grows by about the pages written, the VHD must be converted/compacted (WSL shutdown).

# Pruning the short-probe gates (2026-10-22 21:37, after Mike: "Proceed … I trust you")

## H6 — most "short" probes are not redundant with completed gates
- Decision rule, fixed BEFORE scoring: a candidate gate (city, industry, keyword) is pruned when its probe is `short` or
  `place` AND at least 70 % of the businesses on its saved probe page already appear in `rows.jsonl` for the same city
  (any industry, matched on place_id → cid → feature_id → name). Otherwise it stays in the plan: it adds enough new
  businesses to be worth ~15 min. 70 % is a judgement, not a measurement; the full distribution is reported so it can be moved.
- Prediction: median overlap ≈ 40 %; fewer than half of the 22 candidates reach 70 %. (Niche keywords such as crossfit,
  pilates, brewery, campground are not covered by the gates run so far.)
- Reality, first pass (INVALID): 20 of 23 scored 100 % overlap. Hand check showed why: 18 of the candidates had **already
  run** and their own rows were counted as coverage. The status block's `pruning_candidates` lists every short/place probe
  whether or not the gate is complete; the improvements doc's "15 gates ≈ 3.8 h" counted them that way. Only 6 candidates
  were still pending (all grants-pass / retail-shopping), so the real ceiling is ~6 × 15 min ≈ 1.5 h. My first
  `rg` cross-check was also wrong (pattern lacked the space `json.dumps` writes after the colon); the positive control
  caught it. Diff: prediction (median 40 %) untested by a valid run; the method, not the hypothesis, failed.
- Rule, restated for the valid scope: only PENDING gates are scored; coverage = share of the probe page's businesses already
  in rows.jsonl for that city, or already on the probe page of a pending sibling that is kept (plan order). Prune at ≥ 70 %.
- Reality, valid run (7 pending gates, all grants-pass retail-shopping): K03 14 % keep · K04 100 % (6 of 7 on kept K03) PRUNE ·
  K05 82 % (13/17 in rows) PRUNE · K11 19 % keep · K13 0 % keep · K15 33 % keep · K17 100 % (12 in rows + 6 on siblings) PRUNE.
  Three prunes ≈ 45 min. Prediction ("fewer than half reach 70 %"): 3 of 7 = 43 % — right, on a smaller set than I assumed.
  Tradeoff stated: K05 loses up to 4 businesses that no completed gate holds; K17 up to 0–6. Reversible: delete the entry.
- Applied 2026-10-22 21:53: STOP at a gate boundary (gate `grants-pass real-estate K15` finished first, 958 rows, 917 s), end-of-run
  steps ran, relaunch via `kwsweep-launch.sh` → "2301 gates in plan, 334 complete, 1967 to go". Downtime ≈ 2.5 min.
  To confirm tomorrow: K04, K05, K17 (grants-pass, retail-shopping) never appear in the adhoc log.

# 2026-10-25 early start (13:2x PDT, Mike: "resume the ksweep nightly extraction workflow - we are starting early today")

## H7 — an early detached run with a 7.5 h budget hands over cleanly to the 21:30 nightly
- State found: sweep idle since 06:47 (nightly-20261024 exit 0); 446/2301 complete, 1855 remaining; no STOP, no live lock holder;
  resource-watch WARN only (C_free 57G). The 10-25 06:48 end-of-run reclaim FAILED: `atlas scan` refused by the resource guard
  (psi_io_full 30.29 > STOP, exit 75) → 444 finished gate folders still hold viewport.html/png, and their new files are not yet in R2.
- Prediction: launch via kwsweep-launch.sh (KWSWEEP_HOURS=7.5) → run ends ≈ 20:50–21:10, its end-of-run reclaim runs before 21:30,
  the lock is free at 21:30 so the nightly starts normally. ppid chain of the lx process has no `claude`. First new gate ≈ 15–30 min
  after probes (20 probes × ~50 s) begin. Reclaim stays PSI-sensitive: if the end-of-run `atlas scan` is refused again, rerun it by hand.

# 2026-11-02 restart (05:34 PST, Mike: start where it left off, do not go back for Grants Pass or Ashland)

## H8 — a plain resume moves forward; no code change is needed to keep it out of finished cities
- State found: idle since 04:43 (adhoc-20261101-193703 exit 0, 9 h budget reached at Bend automotive K12). `plan()` minus `done_gates()`
  minus `stuck_gates()` holds 0 Medford, Grants Pass, Albany or Ashland gates. The only gaps there stay out of the queue: Grants Pass
  retail K04/K05/K17 (`keywords/pruned-gates.json`) and Ashland sports-fitness K03 (stuck, 2 incomplete).
- Prediction: `kwsweep-launch.sh --yes` (an arg skips the probe phase) starts at Bend automotive K13; 776 complete, 1525 to go.
- Reality: log line "2301 gates in plan, 776 complete, 1525 to go", first gate Bend K13, complete 49/49 pins, 980 rows, 921 s; K14 started.
  ppid chain uv → bash → Relay → SessionLeader → init, no `claude`.
- Diff: none. Naming the keyword ids with `--keywords` is the one path that would retry the stuck Ashland gate.
