#!/usr/bin/env bash
# Builds the doodledoggo.app introduction site (site/, v2.8.2) and deploys it (and www, which redirects to it) to Cloudflare.
# The game itself is played on itch.io; the site has the home page, /dogs, /privacy and /reset, since v2.14 in 11 languages (/ja/, /zh-hans/ ...).
# v2.14: when site/fonts/i18n/ has fonts, tools/cf_site.js puts them in a second Worker, doodle-doggo-fonts (_cfsite_fonts/), which goes up first
# with the route doodledoggo.app/fonts/i18n/* (a route runs before the Custom Domain, so only those URLs reach it). No fonts: no second Worker.
#   bash tools/cf_pages_deploy.sh
# The site is the Worker "doodle-doggo" (see tools/cf_site.js for why a Worker and not a Pages project), with Workers Custom
# Domains for doodledoggo.app and www.doodledoggo.app (Cloudflare adds their DNS records itself).
# Needs CLOUDFLARE_ACCOUNT_ID. In a Claude cloud session the proxy adds the API token for api.cloudflare.com; anywhere else,
# export CLOUDFLARE_API_TOKEN (Workers Scripts: Edit, plus Zone DNS: Edit and Workers Routes: Edit on doodledoggo.app).
# Never print or commit the token.
set -euo pipefail
cd "$(dirname "$0")/.."
: "${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID}"
API="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID"
AUTH=(); if [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && [ "$CLOUDFLARE_API_TOKEN" != "proxy-injected" ]; then AUTH=(-H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"); fi
SCRIPT=doodle-doggo
ZONE=doodledoggo.app

node tools/cf_site.js

ok() { python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('success') else (print(d.get('errors'), file=sys.stderr) or 1))"; }

ZID=$(curl -sS "https://api.cloudflare.com/client/v4/zones?name=$ZONE" "${AUTH[@]}" | python3 -c "import json,sys; print(json.load(sys.stdin)['result'][0]['id'])")

# 0. the per-language fonts Worker (only when tools/cf_site.js made one) and its route
if [ -f _cfsite_fonts/worker.js ]; then
  FFORM=(-F "metadata={\"main_module\":\"worker.js\",\"compatibility_date\":\"2026-08-01\"};type=application/json"
         -F "worker.js=@_cfsite_fonts/worker.js;type=application/javascript+module")
  while read -r name type; do [ -n "$name" ] && FFORM+=(-F "$name=@_cfsite_fonts/$name;filename=$name;type=$type"); done < _cfsite_fonts/parts.txt
  curl -sS --fail-with-body -X PUT "$API/workers/scripts/$SCRIPT-fonts" "${AUTH[@]}" "${FFORM[@]}" | ok
  echo "uploaded Worker $SCRIPT-fonts"
  PATTERN="$ZONE/fonts/i18n/*"
  RID=$(curl -sS "https://api.cloudflare.com/client/v4/zones/$ZID/workers/routes" "${AUTH[@]}" | python3 -c "import json,sys; print(next((r['id'] for r in json.load(sys.stdin)['result'] if r['pattern']=='$PATTERN'),''))")
  if [ -n "$RID" ]; then
    curl -sS -X PUT "https://api.cloudflare.com/client/v4/zones/$ZID/workers/routes/$RID" "${AUTH[@]}" -H 'Content-Type: application/json' -d "{\"pattern\":\"$PATTERN\",\"script\":\"$SCRIPT-fonts\"}" | ok
  else
    curl -sS -X POST "https://api.cloudflare.com/client/v4/zones/$ZID/workers/routes" "${AUTH[@]}" -H 'Content-Type: application/json' -d "{\"pattern\":\"$PATTERN\",\"script\":\"$SCRIPT-fonts\"}" | ok
  fi
  echo "route $PATTERN -> $SCRIPT-fonts"
fi

# 1. upload the Worker (metadata + module parts)
FORM=(-F "metadata={\"main_module\":\"worker.js\",\"compatibility_date\":\"2026-08-01\"};type=application/json"
      -F "worker.js=@_cfsite/worker.js;type=application/javascript+module")
while read -r name type; do [ -n "$name" ] && FORM+=(-F "$name=@_cfsite/$name;filename=$name;type=$type"); done < _cfsite/parts.txt
curl -sS --fail-with-body -X PUT "$API/workers/scripts/$SCRIPT" "${AUTH[@]}" "${FORM[@]}" | ok
echo "uploaded Worker $SCRIPT"

# 2. custom domains (idempotent: PUT replaces the same hostname)
for host in "$ZONE" "www.$ZONE"; do
  curl -sS -X PUT "$API/workers/domains" "${AUTH[@]}" -H 'Content-Type: application/json' \
    -d "{\"hostname\":\"$host\",\"zone_id\":\"$ZID\",\"service\":\"$SCRIPT\",\"environment\":\"production\"}" | ok
  echo "domain $host -> $SCRIPT"
done

# 3. check
sleep 3
for u in "https://$ZONE/" "https://$ZONE/ja/" "https://$ZONE/zh-hant/dogs" "https://$ZONE/privacy" "https://$ZONE/reset" "https://$ZONE/favicon.svg" "https://$ZONE/logo-1200x630.png"; do
  curl -sS -o /dev/null -w "%{http_code} %{content_type} $u\n" "$u" || true
done
curl -sS -o /dev/null -w "%{http_code} -> %{redirect_url}  https://www.$ZONE/\n" "https://www.$ZONE/" || true
