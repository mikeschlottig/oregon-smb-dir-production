#!/usr/bin/env bash
# kwsweep-reclaim.sh — free disk by removing the saved pages (viewport.html, viewport.png) of FINISHED kwsweep gates
# once R2 holds them (IMPROVEMENTS-2026-10-21 item 1; Mike 2026-10-22: "remove them once they are backed up — not the
# data from the runs, just the html and png"). Run data — rows.jsonl, gates.jsonl, probes, per-gate JSON, evidence .db,
# logs — is never touched.
# A file is removed only when ALL hold:
#   1. its name is viewport.html or viewport.png
#   2. its gate has status "complete" in gates.jsonl and finished more than GRACE_MIN minutes ago (export_gate
#      re-parses viewport.html right after a gate; a running or blocked gate is never touched)
#   3. `atlas compare --status same` lists it: R2 holds that object at the same key (restore: `atlas restore`)
# It does NOT take output/kwsweep/.lock — a held lock makes the nightly exit 0 and skip its window. Idempotent.
#   --backup         first top up R2 (`atlas backup --execute`, append-only) so newly finished gates qualify
#   --execute        delete (default: report only)
#   --max-gates N    consider at most N eligible gates
#   KWSWEEP_RECLAIM_GRACE_MIN  default 30
set -uo pipefail
HOME_ROOT=/home/mikes
REL=oregon-smb-directory/listings-extraction/output/kwsweep
OUT="$HOME_ROOT/$REL"
ATLAS=(/home/mikes/.local/bin/uv run --project /home/mikes/r2-backup-atlas atlas)
EXEC=0; BACKUP=0; MAX=0
while [ $# -gt 0 ]; do
  case "$1" in
    --execute) EXEC=1 ;;
    --backup) BACKUP=1 ;;
    --max-gates) MAX="${2:?--max-gates needs a number}"; shift ;;
    *) echo "usage: kwsweep-reclaim.sh [--backup] [--execute] [--max-gates N]" >&2; exit 2 ;;
  esac
  shift
done
GRACE_MIN="${KWSWEEP_RECLAIM_GRACE_MIN:-30}"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
log() { echo "[reclaim] $(date -Is) $*"; }

cd "$OUT" || exit 1
# 1. eligible gate folders (relative to HOME_ROOT, trailing slash dropped)
cut=$(( $(date +%s) - GRACE_MIN * 60 ))
n=0
while IFS=$'\t' read -r city ind kw; do
  for d in "$city"/artifacts_*_or_"$ind"/"$kw"; do
    [ -d "$d" ] && { echo "$REL/$d" >> "$TMP/dirs.txt"; n=$((n + 1)); }
  done
  [ "$MAX" -gt 0 ] && [ "$n" -ge "$MAX" ] && break
done < <(jq -r --argjson cut "$cut" 'select(.status=="complete" and ((.finished_at[:19] + "Z" | fromdateiso8601) < $cut))
  | "\(.city_slug)\t\(.industry)\t\(.keyword_id)"' gates.jsonl | sort -u)
log "eligible finished gate folders: $n"
[ "$n" -gt 0 ] || exit 0

# 2. the atlas plan: fresh scan + compare, optional append-only top-up, then recompute
cd "$HOME_ROOT/r2-backup-atlas" || exit 1
"${ATLAS[@]}" scan wsl-home > "$TMP/scan.out" 2>&1 || { log "atlas scan failed"; tail -n 5 "$TMP/scan.out"; exit 1; }
"${ATLAS[@]}" compare wsl-home --under "$REL" > "$TMP/compare.out" 2>&1 || { log "atlas compare failed"; tail -n 5 "$TMP/compare.out"; exit 1; }
if [ "$BACKUP" -eq 1 ]; then
  CATEGORIZED=skip:top-up-already-routed-oregon-smb-directory-wsl2-routes-reproduce-all-keys \
    "${ATLAS[@]}" backup wsl-home --under "$REL" --execute > "$TMP/backup.out" 2>&1 \
    || { log "atlas backup had failures — continuing: a file that did not upload stays 'missing', so rule 3 keeps it"
         grep -E 'failed|^run ' "$TMP/backup.out" | tail -n 5 | cut -c1-200; }
  # (until 2026-11-03 any failed upload aborted the whole reclaim: one transient R2 503 "Reduce your concurrent
  #  request rate for the same object." on one file kept 875 gates' pages on disk; rule 3 already guards the delete)
  log "backup: $(grep -v '^\[guard\]' "$TMP/backup.out" | tail -n 1 | cut -c1-200)"
  "${ATLAS[@]}" scan wsl-home > "$TMP/scan.out" 2>&1 && "${ATLAS[@]}" compare wsl-home --under "$REL" > "$TMP/compare.out" 2>&1 \
    || { log "atlas rescan after backup failed — nothing removed"; exit 1; }
fi
"${ATLAS[@]}" compare wsl-home --under "$REL" --cached --files --status same -n 2000000 > "$TMP/same.out" 2>&1 \
  || { log "atlas file list failed"; exit 1; }

# 3. same-in-R2 viewport files inside eligible gate folders
awk -v dirs="$TMP/dirs.txt" 'BEGIN { while ((getline d < dirs) > 0) ok[d] = 1 }
  $1 == "same" && $5 == "->" && $4 ~ /\/viewport\.(html|png)$/ { g = $4; sub(/\/[^\/]+\/[^\/]+$/, "", g); if (g in ok) print $4 }' \
  "$TMP/same.out" > "$TMP/delete.txt"
count=$(wc -l < "$TMP/delete.txt")
[ "$count" -gt 0 ] || { log "nothing to remove (no viewport file is both finished and same-in-R2)"; exit 0; }
bytes=$(cd "$HOME_ROOT" && xargs -d '\n' stat -c %s -- < "$TMP/delete.txt" 2>/dev/null | awk '{s += $1} END {print s + 0}')
log "candidates: $count files · $bytes bytes"
[ "$EXEC" -eq 1 ] || { log "report only — add --execute"; exit 0; }
free_before=$(df -B1 --output=avail /mnt/c | tail -n 1)
(cd "$HOME_ROOT" && xargs -d '\n' rm -f -- < "$TMP/delete.txt")
left=$(cd "$HOME_ROOT" && xargs -d '\n' ls -1 -- < "$TMP/delete.txt" 2>/dev/null | wc -l)
log "removed. candidates still on disk: $left · C: free $(( free_before / 1073741824 )) GB -> $(( $(df -B1 --output=avail /mnt/c | tail -n 1) / 1073741824 )) GB"
