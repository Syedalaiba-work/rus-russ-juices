#!/usr/bin/env bash
# Rebuild and restart the production server on :3100 for visual QA.
cd "$(dirname "$0")/.."
pid=$(netstat -ano | grep ":3100 " | grep LISTENING | awk '{print $5}' | head -1)
[ -n "$pid" ] && taskkill //F //PID "$pid" >/dev/null 2>&1
node tools/scan-hero-assets.mjs && npx next build 2>&1 | grep -E "rror|Failed|Compiled" 
(npx next start -p 3100 >/dev/null 2>&1 &)
until curl -s -o /dev/null http://localhost:3100; do :; done
echo serving
