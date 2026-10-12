#!/usr/bin/env bash
# kwsweep-nightly.sh — one bounded window of the multi-keyword sweep (lx kwsweep).
# Started by the Windows scheduled task "RAR kwsweep nightly" through wsl.exe, so the WSL VM stays up for the
# whole window (a WSL systemd timer only fires while the VM happens to be running — house-sync missed its
# 04:30 slot on 2026-10-11 and ran at 12:16 when WSL came up).
#   KWSWEEP_HOURS   time budget, checked between gates (default 9; a gate is ~16 min, so the window ends ≤ ~20 min late)
#   output/kwsweep/STOP   pauses the queue at the next gate boundary (delete it to resume)
# Log: output/kwsweep/nightly-YYYYMMDD.log. Resume, lock and block handling: src/lx/kwsweep.py.
set -uo pipefail
cd /home/mikes/oregon-smb-directory/listings-extraction
mkdir -p output/kwsweep
LOG="output/kwsweep/nightly-$(date +%Y%m%d).log"
HOURS="${KWSWEEP_HOURS:-9}"
UV=/home/mikes/.local/bin/uv
echo "=== $(date -Is) start · budget ${HOURS} h" >> "$LOG"
"$UV" run --project . lx kwsweep --headless --yes --max-hours "$HOURS" >> "$LOG" 2>&1
rc=$?
echo "=== $(date -Is) exit ${rc}" >> "$LOG"
"$UV" run --project . lx kwsweep --status >> "$LOG" 2>&1
exit "$rc"
