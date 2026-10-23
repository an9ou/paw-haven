#!/usr/bin/env bash
# Uploads the itch.io build from a Claude cloud session (owner's choice, 15 Oct 2026: push to itch.io from Claude).
#   bash tools/itch_push.sh [version]
# Needs, in the Claude environment settings (Environment variables; a new session picks them up):
#   BUTLER_API_KEY  an itch.io API key (itch.io > Settings > API keys). Never commit or print it.
#   ITCH_USER       the itch.io username
#   ITCH_GAME       optional, the project's URL name (default: doodle-doggo)
# The project page must already exist on itch.io (Kind of project: HTML); butler only uploads builds.
set -euo pipefail
cd "$(dirname "$0")/.."
: "${BUTLER_API_KEY:?Add BUTLER_API_KEY to the Claude environment (Environment variables), then start a new session}"
: "${ITCH_USER:?Add ITCH_USER (your itch.io username) to the Claude environment}"
GAME="${ITCH_GAME:-doodle-doggo}"
VERSION="${1:-$(git describe --tags --always 2>/dev/null || date -u +%Y%m%d)}"
# never upload a full-size build: itch.js minifies with esbuild from NODE_PATH, and without it the build stays unminified (v2.14 release slip)
node -e "require('esbuild')" 2>/dev/null || { echo "itch_push: esbuild not found (npm i -g esbuild@0.24.0, or set NODE_PATH); not uploading an unminified build" >&2; exit 1; }
node tools/itch.js
B="${TMPDIR:-/tmp}/butler"
if [ ! -x "$B/butler" ]; then
  mkdir -p "$B"
  curl -sSfL -o "$B/butler.zip" https://broth.itch.zone/butler/linux-amd64/LATEST/archive/default
  unzip -qo "$B/butler.zip" -d "$B" && chmod +x "$B/butler"
fi
"$B/butler" -V
"$B/butler" push dist/itch "$ITCH_USER/$GAME:html5" --userversion "$VERSION"
"$B/butler" status "$ITCH_USER/$GAME"
