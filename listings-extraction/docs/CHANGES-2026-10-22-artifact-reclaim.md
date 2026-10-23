# 2026-10-22 — kwsweep saved pages: back up to R2, then remove from disk (ARD)

Follows IMPROVEMENTS-2026-10-21.md item 1 (disk). Decision by Mike, 2026-10-22: back the artifacts up to the existing WSL
R2 bucket first, then remove `viewport.html` and `viewport.png` once backed up — **not the run data**.

## Decision
- **Kept on disk, never touched:** `rows.jsonl`, `gates.jsonl`, `probes*`, per-gate JSON, evidence `.db`, logs, `_archive/`.
- **Removed after R2 proof:** `viewport.html` and `viewport.png` of gates that are `status: complete` in `gates.jsonl`,
  finished more than 30 min ago, and listed `same` by `atlas compare` (R2 holds that object at that key).
- **Compression was tried first and dropped** at Mike's direction. Measured alternative if local copies are ever wanted
  again: gzip -9 4.31× on HTML; lossless WebP `-z 6` 1.62× / `-z 9` 2.03× on PNG, bit-exact (hypothesis.md H1, H2).

## Evidence (all 2026-10-22)
| step | result |
|---|---|
| bucket | `wsl2` = `wsl2-backup-home09172026`; manifest inside the bucket; routes reproduce 423,625 of 423,625 recorded keys |
| upload | 23,645 objects, 14.4 GB, 0 failed, 491.8 s; 23,554 new keys + 91 changed files as versions under `_atlas/versions/`; run manifest `_atlas/runs/20261023T035607Z/manifest.jsonl.gz` |
| verify `--hash --sample 50` | listing 33,211 checked: absent 0 · wrong size 0 · wrong etag 0; content 33,211 equal / 0 differ; download sample 50/50 byte-identical. Exit 1 only because 97 files are `duplicate` (bytes in R2 under another key, none at their own key) |
| one gate first | 98 files, 53,209,680 B removed; `rows.jsonl` (348,105,847 B, 304,375 lines) and `gates.jsonl` (338 lines) identical before/after |
| 40 gates | 3,769 files, 2,057,744,575 B; VM free +1,970 MB |
| remaining 333-gate set | 28,691 files, 16,831,921,620 B; VM free +16,107 MB |
| total | **32,558 files, 18.94 GB** removed; `medford/` 338 MB and `grants-pass/` 299 MB left |
| left on disk by design | 76 `viewport.*` files with status `duplicate` (43 MB with the 21 evidence DBs) |

## Restore
`uv run --project /home/mikes/r2-backup-atlas atlas restore wsl2:business-directories-leverage-ai-salessystem-cloudflare/oregon-smb-directory/listings-extraction/output/kwsweep/<city>/artifacts_<city>_or_<industry>/<K##> --dest <new empty dir>`
(newest versions win; restores into an empty directory, a person moves it into place).

## Permanent step
`scripts/kwsweep-reclaim.sh --backup --execute` runs at the end of `scripts/kwsweep-nightly.sh` (failure never changes the
run's exit code). Tested under `env -i` (as the Windows-launched task sees it): backup ran, nothing left to remove, rc 0.
It takes no `.lock` — holding it would make the nightly exit 0 and skip its window (IMPROVEMENTS item 4).
`scripts/kwsweep-compress.sh` (written, never used) is archived as `_archive/kwsweep-compress.sh.20261022-210800`;
the stamp is ~2 min ahead of the real clock (21:06 PDT).

## Open — needs Mike
1. **C: free did not rise.** Windows: 61.88 GiB free before and after; the VM's free space rose 18 GB. `ext4.vhdx`
   (212 GB) is **NOT set as sparse** (`fsutil sparse queryflag`); `sparseVhd=true` in `.wslconfig` applies to new disks
   only. Freed space is reusable by the VM but is not returned to C: until the VHD is compacted or converted
   (`wsl --manage Ubuntu-24.04 --set-sparse true`, or `Optimize-VHD`/`diskpart compact vdisk`). Every route shuts WSL
   down, so it cannot run from a session inside WSL and must not run during a sweep. Not done.
2. **H5 (below) decides whether it is urgent:** if ext4 reuses the freed blocks, the VHD stops growing and C: holds.
3. `scripts/repair_rows_serp_path.py` reads old `viewport.html` and skips a missing file silently; it was a one-off
   already applied. If it is ever re-run, restore the gates from R2 first.
