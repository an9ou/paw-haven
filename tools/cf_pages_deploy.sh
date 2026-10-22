#!/usr/bin/env bash
# Builds the doodledoggo.app introduction site (site/, v2.8.2) and deploys it (and www, which redirects to it) to Cloudflare.
# The game itself is played on itch.io; the site has the home page, /dogs, /map, /about, /privacy and /reset, since v2.14 in 11 languages (/ja/, /zh-hans/ ...).
# Size (v2.14, Game Manager): the account's Worker limit is the paid 10 MB, and the Cloudflare token cannot create Worker routes, so the side Workers
# (doodle-doggo-fonts on doodledoggo.app/fonts/i18n/*, doodle-doggo-img on doodledoggo.app/img/map/*) cannot get their routes. The normal build is
# therefore INLINE: SITE_FONTS and SITE_IMG default to inline here, tools/cf_site.js puts the per-language fonts and the /map pictures in the main
# Worker (about 6 MB gzipped with the game, limit 10 MB) and makes no side Workers, so side_worker() below finds nothing to do. The split mode is still
# there for an account whose token can create routes: SITE_FONTS=split SITE_IMG=split bash tools/cf_pages_deploy.sh.
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

SITE_FONTS="${SITE_FONTS:-inline}" SITE_IMG="${SITE_IMG:-inline}" node tools/cf_site.js

ok() { python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('success') else (print(d.get('errors'), file=sys.stderr) or 1))"; }

ZID=$(curl -sS "https://api.cloudflare.com/client/v4/zones?name=$ZONE" "${AUTH[@]}" | python3 -c "import json,sys; print(json.load(sys.stdin)['result'][0]['id'])")

# 0. the side Workers tools/cf_site.js made and their routes (split mode only; the default inline build makes none, so nothing happens here): the
#    per-language fonts (doodle-doggo-fonts, doodledoggo.app/fonts/i18n/*) and the place pictures of /map (doodle-doggo-img, doodledoggo.app/img/map/*)
side_worker() { # <folder> <script name> <route pattern>
  local dir=$1 name=$2 pattern=$3
  [ -f "$dir/worker.js" ] || return 0
  local SFORM=(-F "metadata={\"main_module\":\"worker.js\",\"compatibility_date\":\"2026-08-01\"};type=application/json"
               -F "worker.js=@$dir/worker.js;type=application/javascript+module")
  while read -r f type; do [ -n "$f" ] && SFORM+=(-F "$f=@$dir/$f;filename=$f;type=$type"); done < "$dir/parts.txt"
  curl -sS --fail-with-body -X PUT "$API/workers/scripts/$name" "${AUTH[@]}" "${SFORM[@]}" | ok
  echo "uploaded Worker $name"
  local RID
  RID=$(curl -sS "https://api.cloudflare.com/client/v4/zones/$ZID/workers/routes" "${AUTH[@]}" | python3 -c "import json,sys; print(next((r['id'] for r in json.load(sys.stdin)['result'] if r['pattern']=='$pattern'),''))")
  if [ -n "$RID" ]; then
    curl -sS -X PUT "https://api.cloudflare.com/client/v4/zones/$ZID/workers/routes/$RID" "${AUTH[@]}" -H 'Content-Type: application/json' -d "{\"pattern\":\"$pattern\",\"script\":\"$name\"}" | ok
  else
    curl -sS -X POST "https://api.cloudflare.com/client/v4/zones/$ZID/workers/routes" "${AUTH[@]}" -H 'Content-Type: application/json' -d "{\"pattern\":\"$pattern\",\"script\":\"$name\"}" | ok
  fi
  echo "route $pattern -> $name"
}
side_worker _cfsite_fonts "$SCRIPT-fonts" "$ZONE/fonts/i18n/*"
side_worker _cfsite_img "$SCRIPT-img" "$ZONE/img/map/*"

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
for u in "https://$ZONE/" "https://$ZONE/ja/" "https://$ZONE/zh-hant/dogs" "https://$ZONE/map" "https://$ZONE/de/about" "https://$ZONE/img/map/town-map.webp" "https://$ZONE/privacy" "https://$ZONE/reset" "https://$ZONE/favicon.svg" "https://$ZONE/logo-1200x630.png"; do
  curl -sS -o /dev/null -w "%{http_code} %{content_type} $u\n" "$u" || true
done
curl -sS -o /dev/null -w "%{http_code} -> %{redirect_url}  https://www.$ZONE/\n" "https://www.$ZONE/" || true
