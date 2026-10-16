#!/usr/bin/env bash
# SessionStart hook (cloud sessions only): get the test tools ready so lanes start working at once.
# Local machines (the Mac) are left alone.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
G=$(npm root -g 2>/dev/null)
if [ -n "$G" ] && [ ! -d "$G/playwright" ]; then npm install -g playwright >/dev/null 2>&1 || true; fi  # Chromium is preinstalled; never run `playwright install`
if [ -n "$G" ] && [ ! -d "$G/miniflare" ]; then npm install -g miniflare@4 >/dev/null 2>&1 || true; fi  # v2.8.1: test_worker.js runs the Worker in workerd with a local D1
if [ -n "$CLAUDE_ENV_FILE" ]; then
  { echo "export NODE_PATH=\"$G\""; echo 'export PAW_ARGS="--ignore-certificate-errors"'; } >> "$CLAUDE_ENV_FILE"  # the proxy's certificate breaks Google Fonts in headless Chromium
fi
exit 0
