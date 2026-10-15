#!/usr/bin/env bash
# kwsweep-nightly.sh — one bounded window of the multi-keyword sweep (lx kwsweep).
# Started by the Windows scheduled task "RAR kwsweep nightly" through wsl.exe (WakeToRun on, 2026-10-13), so the WSL VM
# stays up for the whole window (a WSL systemd timer only fires while the VM happens to be running — house-sync missed its
# 04:30 slot on 2026-10-11 and ran at 12:16 when WSL came up).
# While the run lasts, scripts/keep-awake.ps1 holds Windows awake (the PC slept mid-run on 2026-10-12 and 2026-10-13);
# it exits when output/kwsweep/.awake is removed below, or after KWSWEEP_HOURS + 1 h.
#   KWSWEEP_HOURS   time budget, checked between gates (default 9; a gate is ~16 min, so the window ends ≤ ~20 min late)
#   output/kwsweep/STOP   pauses the queue at the next gate boundary (delete it to resume)
#   KWSWEEP_LOG     log path (default output/kwsweep/nightly-YYYYMMDD.log; scripts/kwsweep-launch.sh sets adhoc-*.log)
#   extra args      passed to `lx kwsweep` (e.g. --industries health-wellness --keywords K15)
# Live runs started from a chat go through scripts/kwsweep-launch.sh, never a chat-owned shell (Mike, 2026-10-15).
# Resume, lock and block handling: src/lx/kwsweep.py.
set -uo pipefail
cd /home/mikes/oregon-smb-directory/listings-extraction
mkdir -p output/kwsweep
LOG="${KWSWEEP_LOG:-output/kwsweep/nightly-$(date +%Y%m%d).log}"
HOURS="${KWSWEEP_HOURS:-9}"
UV=/home/mikes/.local/bin/uv
SENTINEL=output/kwsweep/.awake
echo "=== $(date -Is) start · budget ${HOURS} h · args: ${*:-none}" >> "$LOG"
touch "$SENTINEL"
/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden \
  -File "$(wslpath -w scripts/keep-awake.ps1)" -Hours "$(awk "BEGIN{print $HOURS+1}")" -Sentinel "$(wslpath -w "$SENTINEL")" >/dev/null 2>&1 &
"$UV" run --project . lx kwsweep --headless --yes --max-hours "$HOURS" "$@" >> "$LOG" 2>&1
rc=$?
rm -f "$SENTINEL"
echo "=== $(date -Is) exit ${rc}" >> "$LOG"
"$UV" run --project . lx kwsweep --status >> "$LOG" 2>&1
exit "$rc"
