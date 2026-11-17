#!/usr/bin/env bash
# Builds the doodledoggo.app introduction site (site/, v2.8.2) and deploys it (and www, which redirects to it) to Cloudflare.
# The game itself is played on itch.io; the site has the home page, /dogs, /map, /about, /privacy and /reset, since v2.14 in 12 languages (/ja/, /zh-hans/, /yue/ ...).
# Size (v2.14, Game Manager): the account's Worker limit is the paid 10 MB. The normal build is INLINE: SITE_FONTS, SITE_IMG and SITE_PLAY default to
# inline here, tools/cf_site.js puts the per-language fonts, the /map pictures and the game copy (/play/) in the main Worker and makes no side Workers.
# Split (docs/design/site-split.md; the token can create Worker routes since 16 Nov 2026, the inline main Worker is 9.57 MB gzipped): SITE_SPLIT=1
# (= SITE_FONTS=split SITE_IMG=split SITE_PLAY=split) moves them to three side Workers on routes of the zone, which run before the Custom Domain:
# doodle-doggo-fonts (doodledoggo.app/fonts/i18n/* and /play/fonts/i18n/*), doodle-doggo-img (/img/map/*) and doodle-doggo-play (/play/*). The routes
# come from _cfsite/routes.txt, which tools/cf_site.js writes.
#   bash tools/cf_pages_deploy.sh                          inline (refuses while side routes are live: they would shadow the new files)
#   SITE_SPLIT=1 bash tools/cf_pages_deploy.sh             split: uploads the side Workers, then their routes, then the main Worker
#   SITE_BUILD_ONLY=1 [SITE_SPLIT=1] bash tools/cf_pages_deploy.sh   builds every bundle, prints its gzipped size and the routes, no Cloudflare call at all
#   SITE_DROP_ROUTES=1 bash tools/cf_pages_deploy.sh       roll back a split: uploads the inline main Worker, then deletes the side routes
# The site is the Worker "doodle-doggo" (see tools/cf_site.js for why a Worker and not a Pages project), with Workers Custom
# Domains for doodledoggo.app and www.doodledoggo.app (Cloudflare adds their DNS records itself).
# Needs CLOUDFLARE_ACCOUNT_ID. In a Claude cloud session the proxy adds the API token for api.cloudflare.com; anywhere else,
# export CLOUDFLARE_API_TOKEN (Workers Scripts: Edit, plus Zone DNS: Edit and Workers Routes: Edit on doodledoggo.app).
# Never print or commit the token.
set -euo pipefail
cd "$(dirname "$0")/.."
# v2.21 (code review 4): the site's five new dog profiles ("Forty dogs") launch with the game. While MS2_LIVE is false (game/src/24b_missions2.js)
# a site that has them would show 40 dogs before the launch, so refuse. Deploy the site from main (35 profiles) until the owner's launch date.
if grep -qE "key: '(dalmatian|bernese|aussie|cavalier|jrt)'" tools/site_dogs.js && ! grep -q "const MS2_LIVE = true" game/src/24b_missions2.js; then
  echo "cf_pages_deploy: refused. The site has the five v2.21 dog profiles (tools/site_dogs.js), but MS2_LIVE is still false in game/src/24b_missions2.js." >&2
  echo "  They launch on the owner's date: deploy the Worker first (bash tools/cf_api_deploy.sh), then MS2_LIVE = true, then this site." >&2
  echo "  For a site change before the launch, deploy from main (35 profiles)." >&2
  exit 1
fi
: "${SITE_SPLIT:=}"
if [ -n "$SITE_SPLIT" ]; then SITE_FONTS="${SITE_FONTS:-split}" SITE_IMG="${SITE_IMG:-split}" SITE_PLAY="${SITE_PLAY:-split}"; fi
SITE_FONTS="${SITE_FONTS:-inline}" SITE_IMG="${SITE_IMG:-inline}" SITE_PLAY="${SITE_PLAY:-inline}" node tools/cf_site.js

# the bundles: gzipped size of each (tools/cf_site.js, _cfsite/sizes.json) against the 10 MB paid-plan limit, and the routes of the side Workers
LIMIT=10000000
node -e '
const s = require("./_cfsite/sizes.json"), lim = +process.argv[1]; let bad = 0;
const row = (name, n) => { const over = n >= lim; bad += over; console.log(`  ${name.padEnd(20)} ${(n / 1e6).toFixed(2).padStart(5)} MB gzipped${over ? "  OVER the 10 MB limit" : ""}`); };
console.log("bundles (limit " + lim / 1e6 + " MB gzipped each):"); row("doodle-doggo", s.main);
[["fonts", "fontMode"], ["img", "imgMode"], ["play", "playMode"]].forEach(([k, m]) => s[m] === "split" ? row("doodle-doggo-" + k, s[k]) : console.log(`  ${("doodle-doggo-" + k).padEnd(20)} ${s[m]} (no side Worker)`));
process.exit(bad ? 1 : 0);' "$LIMIT" || { echo "cf_pages_deploy: refused, a bundle is over the Worker limit" >&2; exit 1; }
echo "side Worker routes (_cfsite/routes.txt):"; if [ -s _cfsite/routes.txt ]; then awk '{ print "  " $3 " -> " $2 }' _cfsite/routes.txt; else echo "  none (inline build)"; fi
if [ -n "${SITE_BUILD_ONLY:-}" ]; then echo "SITE_BUILD_ONLY: built _cfsite*/, nothing uploaded"; exit 0; fi

: "${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID}"
API="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID"
AUTH=(); if [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && [ "$CLOUDFLARE_API_TOKEN" != "proxy-injected" ]; then AUTH=(-H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"); fi
SCRIPT=doodle-doggo
ZONE=doodledoggo.app

ok() { python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('success') else (print(d.get('errors'), file=sys.stderr) or 1))"; }

ZID=$(curl -sS "https://api.cloudflare.com/client/v4/zones?name=$ZONE" "${AUTH[@]}" | python3 -c "import json,sys; print(json.load(sys.stdin)['result'][0]['id'])")
# the zone's routes now ("id pattern script" lines); a split route this build does not want (the inline build, or a side now inline) would keep
# serving the side Worker's old files in front of the new main Worker, so refuse unless SITE_DROP_ROUTES=1, which deletes it after the upload
ROUTES_NOW=$(curl -sS --fail-with-body "https://api.cloudflare.com/client/v4/zones/$ZID/workers/routes" "${AUTH[@]}" | python3 -c "import json,sys; [print(r['id'], r['pattern'], r.get('script') or '-') for r in json.load(sys.stdin)['result']]")
SPLIT_PATTERNS=" $ZONE/fonts/i18n/* $ZONE/play/fonts/i18n/* $ZONE/img/map/* $ZONE/play/* "
DROP=()
while read -r rid pat scr; do
  [ -n "$rid" ] || continue
  case "$SPLIT_PATTERNS" in *" $pat "*) ;; *) continue ;; esac
  if awk -v p="$pat" '$3 == p { f = 1 } END { exit !f }' _cfsite/routes.txt; then continue; fi
  DROP+=("$rid $pat $scr")
done <<< "$ROUTES_NOW"
if [ ${#DROP[@]} -gt 0 ] && [ -z "${SITE_DROP_ROUTES:-}" ]; then
  echo "cf_pages_deploy: refused. These side Worker routes are live and this build serves their paths from the main Worker:" >&2
  printf '  %s\n' "${DROP[@]}" >&2 # (id pattern script)
  echo "  Deploy the split (SITE_SPLIT=1), or roll it back with SITE_DROP_ROUTES=1 (uploads this build, then deletes them)." >&2
  exit 1
fi

# 0. the side Workers tools/cf_site.js made and their routes (split mode only; the inline build makes none, so nothing happens here). Each Worker is
#    uploaded before its routes, and all of them before the main Worker drops their files, so no path is ever without a Worker that has it.
side_worker() { # <folder> <script name>
  local dir=$1 name=$2
  [ -n "$name" ] || { echo "cf_pages_deploy: no script name for $dir in _cfsite/routes.txt" >&2; exit 1; }
  [ -f "$dir/worker.js" ] || return 0
  local SFORM=(-F "metadata={\"main_module\":\"worker.js\",\"compatibility_date\":\"2026-08-01\"};type=application/json"
               -F "worker.js=@$dir/worker.js;type=application/javascript+module")
  while read -r f type; do [ -n "$f" ] && SFORM+=(-F "$f=@$dir/$f;filename=$f;type=$type"); done < "$dir/parts.txt"
  curl -sS --fail-with-body -X PUT "$API/workers/scripts/$name" "${AUTH[@]}" "${SFORM[@]}" | ok
  echo "uploaded Worker $name"
}
side_route() { # <script name> <route pattern>
  local name=$1 pattern=$2 RID
  RID=$(printf '%s\n' "$ROUTES_NOW" | awk -v p="$pattern" '$2 == p { print $1; exit }')
  if [ -n "$RID" ]; then
    curl -sS -X PUT "https://api.cloudflare.com/client/v4/zones/$ZID/workers/routes/$RID" "${AUTH[@]}" -H 'Content-Type: application/json' -d "{\"pattern\":\"$pattern\",\"script\":\"$name\"}" | ok
  else
    curl -sS -X POST "https://api.cloudflare.com/client/v4/zones/$ZID/workers/routes" "${AUTH[@]}" -H 'Content-Type: application/json' -d "{\"pattern\":\"$pattern\",\"script\":\"$name\"}" | ok
  fi
  echo "route $pattern -> $name"
}
for d in _cfsite_fonts _cfsite_img _cfsite_play; do
  if [ -f "$d/worker.js" ]; then side_worker "$d" "$(awk -v d="$d" '$1 == d { print $2; exit }' _cfsite/routes.txt)"; fi
done
while read -r d name pattern; do if [ -n "$pattern" ]; then side_route "$name" "$pattern"; fi; done < _cfsite/routes.txt

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

# 2b. rollback (SITE_DROP_ROUTES=1): the main Worker has the files again, so the side routes can go (the side Workers stay, unrouted)
for x in ${DROP[@]+"${DROP[@]}"}; do
  read -r rid pat scr <<< "$x"
  curl -sS -X DELETE "https://api.cloudflare.com/client/v4/zones/$ZID/workers/routes/$rid" "${AUTH[@]}" | ok
  echo "deleted route $pat (was -> $scr)"
done

# 3. check
sleep 3
# the side Workers' paths too (split or inline, the same URLs answer): the game copy, a site font and a game font
for u in "https://$ZONE/" "https://$ZONE/ja/" "https://$ZONE/zh-hant/dogs" "https://$ZONE/map" "https://$ZONE/de/about" "https://$ZONE/img/map/town-map.webp" "https://$ZONE/privacy" "https://$ZONE/reset" "https://$ZONE/favicon.svg" "https://$ZONE/logo-1200x630.png" \
         "https://$ZONE/play/" "https://$ZONE/fonts/i18n/ja.css" "https://$ZONE/play/fonts/i18n/ja.woff2"; do
  curl -sS -o /dev/null -w "%{http_code} %{content_type} $u\n" "$u" || true
done
curl -sS -o /dev/null -w "%{http_code} -> %{redirect_url}  https://$ZONE/play\n" "https://$ZONE/play" || true
curl -sS -o /dev/null -w "%{http_code} -> %{redirect_url}  https://www.$ZONE/\n" "https://www.$ZONE/" || true
