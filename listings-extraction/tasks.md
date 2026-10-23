# tasks — kwsweep artifact backup + compression (started 2026-10-22)

Goal: stop `C:` filling before the sweep ends (IMPROVEMENTS-2026-10-21.md item 1). Order fixed by Mike 2026-10-22:
**R2 backup of the raw artifacts first (existing WSL bucket `wsl2`, manifest in bucket), then compress.**

Constraints (real, each verified 2026-10-22):
- Nightly sweep starts 21:30 and writes new `K##` gate folders. Never touch a gate that is not `status: complete` in
  `output/kwsweep/gates.jsonl`. Never hold `output/kwsweep/.lock` (a held lock makes the nightly exit 0 and skip).
- `kwsweep.export_gate` / `sweep.page_rows` read `viewport.html` of the gate that just finished, then never again.
  Done-ness comes from `gates.jsonl`, not from file existence. Nothing else reads old `viewport.*` except the one-off
  `scripts/repair_rows_serp_path.py` (already applied).
- Archive, never delete: originals go to R2 first and the verified R2 copy is the history; local replacement is lossless.
- Tools present: gzip, pigz, xz, cwebp, dwebp. Absent: zstd, magick, oxipng, parallel.

## Tasks
- [ ] 1. Sample test in scratchpad (no in-place change): HTML gzip vs xz, PNG→lossless WebP, ratios + bit-exact round trip.
- [ ] 2. Backup: `atlas scan wsl-home` → `compare --under` the kwsweep output → dry run → `--execute` (append-only).
- [x] 1. Sample test (gzip 4.31×, WebP z6 1.62× / z9 2.03×, bit-exact) — see hypothesis.md H1/H2. Dropped at Mike's direction.
- [x] 2. Backup: 23,645 objects 14.4 GB to `wsl2`, 0 failed, 491.8 s.
- [x] 3. Verify R2 copy: `atlas verify … --hash --sample 50`: 33,211 equal / 0 differ, 50/50 byte-identical.

**Changed by Mike 2026-10-22 21:02:** "we can remove them once they are backed up — not the data from the runs, just the
html and png." Compression is dropped: after R2 is verified, DELETE `viewport.html` / `viewport.png` of finished gates.
Everything else (rows.jsonl, gates.jsonl, probes, per-gate JSON, evidence .db, logs) stays. The compress script
(`scripts/kwsweep-compress.sh`) and its nightly hook are not used; hook already removed from kwsweep-nightly.sh.
H1/H2 numbers stay in hypothesis.md as the measured alternative (z=6 WebP / gzip) if Mike ever wants local copies kept.

- [x] 4. Reclaim ONE gate: 98 files, run data identical.
- [x] 5. Reclaim all eligible gates: 32,558 files, 18.94 GB total; 76 `duplicate`-status files kept by design.
- [x] 6. Permanent: `scripts/kwsweep-reclaim.sh --backup --execute` at the end of kwsweep-nightly.sh; tested under `env -i`.
- [x] 7. IMPROVEMENTS update log appended, ARD `docs/CHANGES-2026-10-22-artifact-reclaim.md` written.
- [ ] 8. (Mike) C: free did not rise — ext4.vhdx not sparse. Convert/compact needs a WSL shutdown; decide timing. H5 test
      tomorrow: vhdx length after tonight's run.
- [ ] 9. Commit (next step).

# Prune short-probe gates (2026-10-22 evening, Mike: "Proceed with both. I trust you - get it done")
Correction found on the way: 18 of the 24 flagged candidates had already run; only grants-pass retail-shopping gates were
pending (the doc's "15 gates ≈ 3.8 h" counted completed ones). Real saving: 3 gates ≈ 45 min. See hypothesis.md H6.
- [x] P1. Mechanism: `keywords/pruned-gates.json` (list of {city_slug, industry, keyword_id, reason, pruned_at}); `plan()`
      skips them; `status()` reports the count. Test first (failing), then code. The running sweep is unaffected (plan is
      read once at start).
- [x] P2. Prune exactly: grants-pass retail-shopping K04, K05, K17. Keep K03, K11, K13, K15.
- [x] P3. The running sweep holds the old plan in memory and reaches K04 ≈ 23:10, so apply by pausing at a gate
      boundary (`output/kwsweep/STOP`), then resume via `scripts/kwsweep-launch.sh`; confirm the new log says 2301 gates.
- [x] P4. Record result + restore instructions (delete the entry), commit.
