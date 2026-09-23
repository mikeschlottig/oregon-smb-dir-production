#!/usr/bin/env bash
# Run the full build under the project's Node (22 via nvm), detached-safe.
# Usage: bash scripts/build-bg.sh [npm-script]   (default: build) → log at /tmp/osd-<script>.log
set -e
script="${1:-build}"
cd "$(dirname "$0")/.."
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use --delete-prefix v22.22.2 --silent
echo "node $(node -v) · npm run $script · $(date -Is)"
npm run "$script"
echo "BUILD_EXIT=0 $(date -Is)"
