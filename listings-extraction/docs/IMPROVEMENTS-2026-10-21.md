# kwsweep + harvest-monitor — setup review and proposed improvements (2026-10-21)

Scope: the nightly sweep (`scripts/kwsweep-nightly.sh`, Windows task "RAR kwsweep nightly"), the detached launcher
(`scripts/kwsweep-launch.sh`), and the dashboard (`/home/mikes/claude_builds/harvest-monitor`, :8470).
Every number below was measured on 2026-10-21 ~16:45 PDT; the source is named per item. **Extrapolations are labelled
HYPOTHESIS** and carry a test. Nothing here has been implemented except the dashboard log-pattern fix (`89d68a3`).

## State at review

| fact | value | source |
|---|---|---|
| plan | 2304 gates × 49 pins | `output/kwsweep/nightly-20261020.log` status block |
| complete / remaining | 292 / 2012 | same |
| median gate | 912 s | same |
| gates gained per night, last 4 nights | +36, +32, +40, +37 (147→183→215→255→292) | "gates in plan" line of each `nightly-*.log` |
| remaining time at that pace | ≈ 56 nights (status block says 509.7 h of gate time) | derived: 2012 / ~36 |
| gate-audit false passes | 0 across three ledger lines | `output/kwsweep/gate-audit.jsonl` |
| artifacts on disk | 17.4 GB (14,323 PNG 9.77 GB · 14,323 HTML 7.12 GB · 292 JSON 0.27 GB) | `find … -printf %s` over `medford/` + `grants-pass/` |
| `C:` free | 69 GB of 476 GB (86 % used) | `df -BG /mnt/c` |

## Proposals, ranked

### 1. Disk will run out before the sweep finishes — HYPOTHESIS, high severity
- **Observation:** 17.4 GB / 292 gates ≈ 60 MB per gate. 2012 remaining gates × 60 MB ≈ 120 GB, against 69 GB free on `C:`
  (WSL writes consume `C:`; see memory *windows-work-runs-natively-c-is-the-budget*).
- **Prediction:** if nothing else writes to `C:`, free space hits zero near gate ~1450 — about 33 nights out (≈ late November).
- **Cheapest fix first:** HTML gzips 4.2× (20-sample test: 9.7 MB → 2.3 MB), so compressing the HTML saves ≈ 5.3 GB of the
  7.1 GB held today and ≈ 75 % of every future gate's HTML. `cwebp` is installed (`/usr/bin/cwebp`) for the PNGs; PNG→WebP
  ratio is **untested** on these screenshots.
- **Then:** back the finished city/industry artifact folders up to R2 with the atlas (append-only), verify, and only then
  delete the older local copies (memory *r2-is-history-never-sync*). The parsed rows already live in `rows.jsonl`.
- **Gate:** `df -BG /mnt/c` after compressing one finished `artifacts_*` folder; open one page in the dashboard Explore
  view to prove the consumer still reads it. Decide first whether anything reads the raw HTML/PNG after parsing.

### 2. A missed night is invisible — observed, medium severity
- **Observation:** starts per date in the nightly logs run 10-12 … 10-15, then 10-17 … 10-20. **No start is recorded for
  10-16.** The cause is unknown: the Task Scheduler Operational log is **disabled** (`wevtutil gl … → enabled: false`), so
  `Get-WinEvent` returned nothing for the task.
- **Proposal A:** enable that log (Windows-side setting, admin; not changed here — Mike's call).
- **Proposal B (no admin):** the dashboard already reads `schedule.last` / `schedule.result`. Add a *missed-night* flag
  when the last logged start is older than 26 h and no run is alive, and push a notification.
- **Gate:** simulate by pointing the check at 10-16's gap and confirm it fires; confirm silence on a normal night.

### 3. No alert when a run stalls or is blocked — observed, medium
The status bar shows Running / Stalled / Paused / Blocked, but only to someone looking. Today's wrong "stalled" reading
sat unnoticed until I asked. **Proposal:** transitions into Stalled/Blocked, plus a nightly "finished: +N gates, F false
passes" summary, go out through the existing push channel. **Gate:** trigger by touching `output/kwsweep/STOP` and
confirm exactly one notification on the transition, none while it stays paused.

### 4. The 21:30 nightly skips instead of continuing — observed, medium
`nightly-20261012.log` shows `another run holds output/kwsweep/.lock — not starting a second one`, then `exit 0`. Tonight's
21:30 task will do the same against today's ad-hoc run, which ends ≈ 01:30, leaving ≈ 5 h of the usual window idle.
**Proposal:** let the nightly wait for the lock (bounded by its own end-of-window) instead of exiting. The lock lives in
`src/lx/kwsweep.py`, which I have **not read**, so the right mechanism (blocking `flock` vs. poll) is open.
**Gate:** start an ad-hoc run with `KWSWEEP_HOURS=1`, fire the nightly script, confirm it starts a sweep when the first exits.

### 5. Prune the 15 flagged "short" gates — observed, small win
The status block lists 15 `pruning_candidates` (probes returned short or a single place). 15 × 912 s ≈ 3.8 h, about 0.4 of a
night. Pruning is a plan decision, not a mechanical one: the 14 "short" results may still be the correct answer for a
small town. **Gate:** Mike reviews the list; the plan loses exactly the approved gates and `remaining` drops by that count.

### 6. Throughput — HYPOTHESIS
~36 gates a night ⇒ ~56 nights. The ad-hoc run launched today shows a daytime window works (detached, kept awake), so a
second window roughly doubles throughput. Parallel browsers in one window are **untested** and risk the block path
(`README.md`: a block on the 3rd attempt stops the run). **Order matters:** do item 1 first, because doubling the pace
without freeing disk only reaches the wall sooner. **Test for parallelism:** two pins in flight for one gate, compare
block count and per-gate seconds against the 912 s median over ≥ 5 gates.

### 7. Dashboard hardening — small
- **Regression test:** `tests/` has 4 tests and none covers `currentLog()`; add one with an `adhoc-*` and a `nightly-*`
  file where the older-named file is newer. (The bug fixed in `89d68a3` would have failed it.)
- **Disk panel:** show `C:` free and projected gates-until-full beside the existing ETA; item 1 would then be visible.
- **Process match:** `processMatch` is `pgrep -f "lx kwsweep"`, which matches *any* command line containing that text, such
  as a chat shell that merely mentions it. Today's live check returned two pids correctly, so this is a latent
  false-"alive", not an observed one. Prefer matching the python entry point or reading the lock holder.

### 8. Low priority
- `gate-audit.jsonl` field `gates` is constant 192 while 292 gates are complete: `scripts/audit_gate_passes.py:50` counts
  unique `(industry, kw)` pairs, not gates. Rename to `keywords` so nobody reconciles it against the plan.
- `rows.jsonl` is 305 MB at 292 gates; ≈ 2.4 GB at 2304 (HYPOTHESIS, linear). The dashboard tails it by byte offset so
  it is fine; convert to Parquet once the sweep ends.

## Suggested order
1. Compress HTML (item 1, first step) · 2. missed-night flag + alerts (2, 3) · 3. nightly waits for the lock (4) ·
4. R2 archive of finished folders (1, second step) · 5. Mike decides pruning (5) · 6. second window, then the parallel test (6).

## Not touched
Windows Task Scheduler settings, the R2 buckets, `src/lx/kwsweep.py`, and the gate plan are unchanged.

## Update log
- **2026-10-22 — item 1 implemented (disk).** R2 top-up to `wsl2`, hash-verified, then `viewport.html`/`viewport.png`
  of 333 finished gates removed (32,558 files, 18.94 GB); run data untouched. Compression was measured and dropped at
  Mike's direction. The nightly now ends with `scripts/kwsweep-reclaim.sh --backup --execute`. **Correction to item 1:**
  deleting inside WSL did not raise `C:` free (61.88 GiB before and after) because `ext4.vhdx` is not sparse — see the
  open items in `docs/CHANGES-2026-10-22-artifact-reclaim.md`. Completed gates are now 333, not 292.
