#!/usr/bin/env bash
# Builds the password-gated test copy and deploys it to https://test.doodledoggo.app: the Worker "doodle-doggo-test" (owner, 18 Nov 2026).
# It replaces the GitHub Pages test copy (an9ou.github.io/paw-haven), which stops working once the repo is private.
#   BUILD_ONLY=1 bash tools/cf_test_deploy.sh [git ref]   build _site_test/ and _cftest/ only; no network at all
#   DRY_RUN=1    bash tools/cf_test_deploy.sh [git ref]   build, then print every Cloudflare request and send none
#   bash tools/cf_test_deploy.sh [git ref]                build, check TEST_PASSWORD, upload the Worker, attach test.doodledoggo.app, check
# [git ref]: build the game from that ref (a temporary git worktree) instead of this checkout; the deploy tools (tools/pages.js, tools/cf_test.js,
# tools/test_gate.mjs) always come from this checkout.
# What the copy is: the GitHub Pages build (dev button kept, Friends / Cantonese / Missions v2 / What's new test flags on) built with
# node tools/pages.js --test: no in-page password screen (this Worker has the real gate, tools/test_gate.mjs) and payments off (window.__ddNoPay;
# the API also refuses /shop/checkout from https://test.doodledoggo.app).
# The password is the Worker secret TEST_PASSWORD. It is never in the repo or in this script, and this script never sets it: the owner sets it in
# the dashboard (below). Without it this script refuses to deploy. On the very first run the Worker does not exist yet, so the script uploads a
# placeholder that only answers 503 (no domain), and asks the owner to add the secret to it; then run this again.
# Needs Workers Scripts: Edit and Zone > Workers Routes: Edit on doodledoggo.app. In a Claude cloud session the proxy adds the API token; anywhere
# else export CLOUDFLARE_API_TOKEN. CLOUDFLARE_ACCOUNT_ID is optional (else the first account from GET /accounts).
# The merch sandbox run (opt-in, SANDBOX.md part F): MERCH_PAGE=<a checkout of merch/shop> adds the "My dog" page at /merch/ (tools/cf_test.js
# --merch), and MERCH_TEST_CFG=<file> the merch test Worker's token file at /merch/test_cfg.json (--merch-cfg; only with MERCH_PAGE). Relative
# paths are from the repo root. With neither set the test copy is exactly the game, as before.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd)
HOST=test.doodledoggo.app; SCRIPT=doodle-doggo-test; ZONE=doodledoggo.app; DATE=2026-08-01
CF=https://api.cloudflare.com/client/v4
DRY=${DRY_RUN:-0}; BUILD_ONLY=${BUILD_ONLY:-0}; REF=${1:-}
AUTH=(); if [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && [ "$CLOUDFLARE_API_TOKEN" != "proxy-injected" ]; then AUTH=(-H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"); fi
py() { python3 -c "$@"; }
ok() { py "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('success') else (print(d.get('errors'), file=sys.stderr) or 1))"; }
cf() { # METHOD PATH [json body]: one JSON call; DRY_RUN=1 prints it and answers an empty success
  local m=$1 p=$2 b=${3:-}
  if [ "$DRY" = "1" ]; then echo "DRY_RUN: $m $CF$p${b:+  $b}" >&2; echo '{"success":true,"result":[]}'; return 0; fi
  if [ -n "$b" ]; then curl -sS -X "$m" "$CF$p" "${AUTH[@]}" -H 'Content-Type: application/json' --data-binary "$b"
  else curl -sS -X "$m" "$CF$p" "${AUTH[@]}"; fi
}
GIT=git; command -v git >/dev/null 2>&1 || GIT="/Applications/GitHub Desktop.app/Contents/Resources/app/git/bin/git"
SECRET_HELP="  The owner sets it once, in the Cloudflare dashboard (never in chat or in the repo):
    Workers & Pages > $SCRIPT > Settings > Variables and Secrets > Add > Type: Secret, Name: TEST_PASSWORD, Value: the password > Deploy.
  (Optional: a second secret TEST_COOKIE_KEY, any long random text, signs the 30-day login cookie; without it the key comes from the password,
  so a new password logs everyone out.) Then run: bash tools/cf_test_deploy.sh"

# 1. build: the test copy (tools/pages.js --test) into _site_test/, then the Worker into _cftest/
SRC=$ROOT; TMP=
if [ -n "$REF" ]; then
  TMP=$(mktemp -d "${TMPDIR:-/tmp}/dd-test-build.XXXXXX"); trap '[ -n "$TMP" ] && "$GIT" -C "$ROOT" worktree remove --force "$TMP" >/dev/null 2>&1; rm -rf "$TMP"' EXIT
  "$GIT" -C "$ROOT" worktree add --detach "$TMP" "$REF" >/dev/null
  cp tools/pages.js "$TMP/tools/pages.js" # this checkout's build wrapper (it knows --test)
  SRC=$TMP; echo "building the test copy from $REF ($("$GIT" -C "$TMP" rev-parse --short HEAD))"
fi
node "$SRC/tools/pages.js" --build --test --out "$ROOT/_site_test"
MERCH=(); [ -n "${MERCH_PAGE:-}" ] && MERCH+=(--merch "$MERCH_PAGE"); [ -n "${MERCH_TEST_CFG:-}" ] && MERCH+=(--merch-cfg "$MERCH_TEST_CFG")
node tools/cf_test.js --from "$ROOT/_site_test" --out "$ROOT/_cftest" ${MERCH[@]+"${MERCH[@]}"}
[ "$BUILD_ONLY" = "1" ] && { echo "BUILD_ONLY: _site_test/ and _cftest/ are ready; nothing sent"; exit 0; }

# 2. account and zone
if [ "$DRY" = "1" ]; then ACC=${CLOUDFLARE_ACCOUNT_ID:-'<account_id>'}; cf GET /accounts >/dev/null; cf GET "/zones?name=$ZONE" >/dev/null; ZID='<zone_id>'
else
  ACC=${CLOUDFLARE_ACCOUNT_ID:-$(cf GET /accounts | py "import json,sys; r=json.load(sys.stdin).get('result') or []; print(r[0]['id'] if r else '')")}
  [ -n "$ACC" ] || { echo "cf_test_deploy: no Cloudflare account visible to this token" >&2; exit 1; }
  ZID=$(cf GET "/zones?name=$ZONE" | py "import json,sys; r=json.load(sys.stdin).get('result') or []; print(r[0]['id'] if r else '')")
  [ -n "$ZID" ] || { echo "cf_test_deploy: zone $ZONE not found" >&2; exit 1; }
fi
API="$CF/accounts/$ACC"

# 3. TEST_PASSWORD must be on the Worker (names only: the API never shows a secret's value)
if [ "$DRY" = "1" ]; then cf GET "/accounts/$ACC/workers/scripts/$SCRIPT/secrets" >/dev/null; HAVE=yes; echo "DRY_RUN: (a real run stops here unless TEST_PASSWORD is in that list)" >&2
else
  SEC=$(curl -sS "$API/workers/scripts/$SCRIPT/secrets" "${AUTH[@]}")
  HAVE=$(echo "$SEC" | py "import json,sys
d=json.load(sys.stdin)
if not d.get('success'): print('missing' if any(e.get('code') in (10007,) or 'not found' in str(e.get('message','')).lower() for e in d.get('errors') or []) else 'error:' + json.dumps(d.get('errors')))
else: print('yes' if any(s.get('name')=='TEST_PASSWORD' for s in d.get('result') or []) else 'no')")
fi
case "$HAVE" in
  yes) [ "$DRY" = "1" ] || echo "TEST_PASSWORD is set on $SCRIPT" ;;
  missing)
    # first run: a placeholder Worker that answers 503 everywhere (no domain, no workers.dev), so the owner has somewhere to add the secret
    PH=$(mktemp -d); printf '%s\n' "export default { fetch() { return new Response('The test copy is not set up yet.', { status: 503, headers: { 'x-robots-tag': 'noindex, nofollow', 'cache-control': 'private, no-store' } }); } };" > "$PH/worker.js"
    curl -sS --fail-with-body -X PUT "$API/workers/scripts/$SCRIPT" "${AUTH[@]}" \
      -F "metadata={\"main_module\":\"worker.js\",\"compatibility_date\":\"$DATE\",\"keep_bindings\":[\"secret_text\"]};type=application/json" \
      -F "worker.js=@$PH/worker.js;type=application/javascript+module" | ok
    curl -sS -X POST "$API/workers/scripts/$SCRIPT/subdomain" "${AUTH[@]}" -H 'Content-Type: application/json' -d '{"enabled":false,"previews_enabled":false}' | ok
    rm -rf "$PH"
    echo "cf_test_deploy: made the empty Worker $SCRIPT (it answers 503 and has no domain yet). Refused to deploy the game: TEST_PASSWORD is not set." >&2
    echo "$SECRET_HELP" >&2; exit 2 ;;
  no) echo "cf_test_deploy: refused. The Worker $SCRIPT has no TEST_PASSWORD secret." >&2; echo "$SECRET_HELP" >&2; exit 2 ;;
  *) echo "cf_test_deploy: could not list the secrets of $SCRIPT: $HAVE" >&2; exit 1 ;;
esac

# 4. upload the Worker (keep_bindings keeps TEST_PASSWORD and TEST_COOKIE_KEY), workers.dev off: only test.doodledoggo.app answers
FORM=(-F "metadata={\"main_module\":\"worker.js\",\"compatibility_date\":\"$DATE\",\"keep_bindings\":[\"secret_text\"]};type=application/json"
      -F "worker.js=@_cftest/worker.js;type=application/javascript+module")
while read -r name type; do [ -n "$name" ] && FORM+=(-F "$name=@_cftest/$name;filename=$name;type=$type"); done < _cftest/parts.txt
if [ "$DRY" = "1" ]; then echo "DRY_RUN: PUT $API/workers/scripts/$SCRIPT  multipart: metadata (keep_bindings secret_text) + worker.js + $(grep -c . _cftest/parts.txt) modules from _cftest/parts.txt" >&2
else curl -sS --fail-with-body -X PUT "$API/workers/scripts/$SCRIPT" "${AUTH[@]}" "${FORM[@]}" | ok; echo "uploaded Worker $SCRIPT"; fi
cf POST "/accounts/$ACC/workers/scripts/$SCRIPT/subdomain" '{"enabled":false,"previews_enabled":false}' | ok

# 5. the Custom Domain (idempotent)
CUR=$(cf GET "/accounts/$ACC/workers/domains?hostname=$HOST" | py "import json,sys; r=[d for d in (json.load(sys.stdin).get('result') or []) if d.get('hostname')=='$HOST']; print(r[0].get('service','') if r else '')")
if [ "$CUR" = "$SCRIPT" ]; then echo "$HOST is already the Custom Domain of $SCRIPT"
else
  [ -n "$CUR" ] && { echo "cf_test_deploy: $HOST belongs to the Worker '$CUR'. Stop: change it by hand if that is really wanted." >&2; exit 1; }
  RECS=$(cf GET "/zones/$ZID/dns_records?name=$HOST" | py "import json,sys; print(' '.join(r['type'] for r in (json.load(sys.stdin).get('result') or [])))")
  [ -n "$RECS" ] && { echo "cf_test_deploy: $HOST already has DNS records ($RECS). Delete them in the dashboard (DNS > Records), then run this again." >&2; exit 1; }
  cf PUT "/accounts/$ACC/workers/domains" "{\"hostname\":\"$HOST\",\"service\":\"$SCRIPT\",\"zone_id\":\"$ZID\",\"environment\":\"production\"}" | ok
  [ "$DRY" = "1" ] || echo "attached $HOST -> $SCRIPT"
fi
[ "$DRY" = "1" ] && { echo "DRY_RUN: then the checks on https://$HOST (gate 401 + noindex, robots.txt, a wrong password 401, nothing cached publicly)"; exit 0; }

# 6. check (the right password is never known here: the owner logs in once in a browser)
sleep 5; fail=0
chk() { if [ "$1" = "$2" ]; then echo "ok   $3"; else echo "FAIL $3 (got '$1', want '$2')"; fail=1; fi; }
H=$(curl -sS --max-time 20 -D - -o /dev/null "https://$HOST/" | tr -d '\r')
chk "$(echo "$H" | head -1 | awk '{print $2}')" 401 "no cookie: the gate page (401)"
chk "$(echo "$H" | sed -n 's/^x-robots-tag: //Ip')" "noindex, nofollow" "X-Robots-Tag noindex"
chk "$(echo "$H" | sed -n 's/^cache-control: //Ip')" "private, no-store" "the gate is never cached"
chk "$(curl -sS --max-time 20 -o /dev/null -w '%{http_code}' -X POST "https://$HOST/__gate" -H 'Content-Type: application/x-www-form-urlencoded' --data 'password=not-the-password-1&next=/')" 401 "a wrong password: 401"
chk "$(curl -sS --max-time 20 "https://$HOST/robots.txt" | tail -1)" "Disallow: /" "robots.txt disallows everything"
chk "$(curl -sS --max-time 20 -o /dev/null -w '%{http_code}' "https://$HOST/index.html")" 401 "the game itself needs the cookie"
[ $fail = 0 ] && echo "TEST COPY OK: https://$HOST (log in once in a browser with the owner's password)" || { echo "TEST COPY CHECK FAILED"; exit 1; }
