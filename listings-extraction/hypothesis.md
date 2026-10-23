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
