#!/usr/bin/env bash
# Deploy dist/ to the oregonsmbdirectory-site Worker under the project's Node.
# Usage: setsid nohup bash scripts/deploy-bg.sh "message" > /tmp/osd-deploy.log 2>&1 < /dev/null &
set -e
cd "$(dirname "$0")/.."
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use --delete-prefix v22.22.2 --silent
echo "node $(node -v) · commit $(git rev-parse --short HEAD) · $(date -Is)"
npx wrangler whoami 2>&1 | grep -iE "logged in|email|account" | head -3
npx wrangler deploy --message "${1:-$(git log -1 --format=%s)} ($(git rev-parse --short HEAD))"
echo "DEPLOY_EXIT=0 $(date -Is)"
