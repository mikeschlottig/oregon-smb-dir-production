#!/usr/bin/env bash
# kwsweep-launch.sh — start a kwsweep run that does not depend on the chat (or terminal) that started it.
#
# WHY (Mike, 2026-10-15): live runs started from a Claude Code shell are children of the claude process; closing
# the chat kills them. This hands the run to Windows: Start-Process launches wsl.exe as a Windows process, outside
# the caller's Linux process tree. That wsl.exe also keeps the WSL VM up for the whole run, and the run uses the same
# script as the nightly task (kwsweep-nightly.sh: keep-awake, lock, resume, exit line in the log).
#
#   scripts/kwsweep-launch.sh [lx kwsweep args...]       e.g.  --industries health-wellness --keywords K15
#   KWSWEEP_HOURS=2 scripts/kwsweep-launch.sh ...        time budget (default 9, as nightly)
#
# Prints the log path. Watch it with: tail -f <log>.  Stop at the next gate boundary: touch output/kwsweep/STOP.
# The kwsweep lock (output/kwsweep/.lock) refuses a second concurrent run, nightly included.
set -euo pipefail
HERE=/home/mikes/oregon-smb-directory/listings-extraction
LOG="output/kwsweep/adhoc-$(date +%Y%m%d-%H%M%S).log"
HOURS="${KWSWEEP_HOURS:-9}"
for a in "$@"; do
  case "$a" in *[!A-Za-z0-9._-]*) echo "kwsweep-launch: refusing argument with shell/PowerShell metacharacters: $a" >&2; exit 2 ;; esac
done
ARGS="-d Ubuntu-24.04 -u mikes -- env KWSWEEP_LOG=$LOG KWSWEEP_HOURS=$HOURS $HERE/scripts/kwsweep-nightly.sh $*"
/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -NoProfile -Command \
  "Start-Process -WindowStyle Hidden -FilePath wsl.exe -ArgumentList '$ARGS'" </dev/null
echo "$HERE/$LOG"
