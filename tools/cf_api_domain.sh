#!/usr/bin/env bash
# Gives the cloud save API its own address: the Workers Custom Domain api.doodledoggo.app on the Worker "pawhaven-api" (owner, 18 Nov 2026).
# Why: the workers.dev address has the account's name in it and every player's browser sees it. The workers.dev address stays on (older game
# copies, and the Stripe webhook until the owner moves it: docs/CLOUDFLARE_LOGIN.md "api.doodledoggo.app").
#   DRY_RUN=1 bash tools/cf_api_domain.sh     print every request, send none
#   bash tools/cf_api_domain.sh               attach the domain (idempotent: already attached to pawhaven-api -> nothing to do), then verify
#   bash tools/cf_api_domain.sh verify        only the checks: GET / on the new address, CORS preflights, workers.dev still answering
# Cloudflare adds the DNS record and the certificate itself. A hostname that already has a CNAME record cannot become a Custom Domain: the
# script then stops and says so (delete that record in the dashboard first).
# Needs the token permissions Workers Scripts: Edit and Zone > Workers Routes: Edit on doodledoggo.app (Custom Domains count as routes).
# In a Claude cloud session the proxy adds the API token for api.cloudflare.com; anywhere else export CLOUDFLARE_API_TOKEN. Never print it.
# CLOUDFLARE_ACCOUNT_ID is optional: without it the first account from GET /accounts is used.
set -euo pipefail
cd "$(dirname "$0")/.."
HOST=api.doodledoggo.app; SCRIPT=pawhaven-api; ZONE=doodledoggo.app
CF=https://api.cloudflare.com/client/v4
DRY=${DRY_RUN:-0}
AUTH=(); if [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && [ "$CLOUDFLARE_API_TOKEN" != "proxy-injected" ]; then AUTH=(-H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"); fi
py() { python3 -c "$@"; }
# cf METHOD PATH [json body]: one Cloudflare API call; DRY_RUN=1 prints it and answers an empty success instead
cf() {
  local m=$1 p=$2 b=${3:-}
  if [ "$DRY" = "1" ]; then echo "DRY_RUN: $m $CF$p${b:+  $b}" >&2; echo '{"success":true,"result":[]}'; return 0; fi
  if [ -n "$b" ]; then curl -sS -X "$m" "$CF$p" "${AUTH[@]}" -H 'Content-Type: application/json' --data-binary "$b"
  else curl -sS -X "$m" "$CF$p" "${AUTH[@]}"; fi
}
ok() { py "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('success') else (print(d.get('errors'), file=sys.stderr) or 1))"; }

verify() {
  local fail=0 got
  echo "--- verify https://$HOST"
  got=$(curl -sS --max-time 15 "https://$HOST/" || true); echo "GET /: $got"
  echo "$got" | grep -q '"name":"pawhaven-api"' || { echo "FAIL GET https://$HOST/ is not pawhaven-api (the DNS record and certificate can take a few minutes)"; fail=1; }
  for o in https://doodledoggo.app https://www.doodledoggo.app https://html-classic.itch.zone https://html.itch.zone https://test.doodledoggo.app https://evil.example; do
    got=$(curl -sS --max-time 15 -D - -o /dev/null -X OPTIONS "https://$HOST/save" -H "Origin: $o" -H 'Access-Control-Request-Method: PUT' -H 'Access-Control-Request-Headers: authorization,content-type' | tr -d '\r' | sed -n 's/^access-control-allow-origin: //Ip' || true)
    if [ "$o" = https://evil.example ]; then [ -z "$got" ] && echo "ok   CORS refused for $o" || { echo "FAIL CORS allowed $o"; fail=1; }
    elif [ "$got" = "$o" ]; then echo "ok   CORS preflight $o"
    elif [ "$o" = https://test.doodledoggo.app ]; then echo "note CORS for $o needs the Worker from this branch (bash tools/cf_api_deploy.sh)"
    else echo "FAIL CORS preflight $o (got '$got')"; fail=1; fi
  done
  if [ "$DRY" != "1" ] && [ -n "${ACC:-}" ]; then # the old address must keep answering
    local sub; sub=$(cf GET "/accounts/$ACC/workers/subdomain" | py "import json,sys; print((json.load(sys.stdin).get('result') or {}).get('subdomain',''))" || true)
    if [ -n "$sub" ]; then got=$(curl -sS --max-time 15 "https://$SCRIPT.$sub.workers.dev/" || true)
      echo "$got" | grep -q '"name":"pawhaven-api"' && echo "ok   the workers.dev address still answers" || { echo "FAIL the workers.dev address does not answer"; fail=1; }; fi
  fi
  [ $fail = 0 ] && echo "API DOMAIN OK: https://$HOST" || { echo "API DOMAIN CHECK FAILED"; return 1; }
}

# account and zone (reads)
if [ "$DRY" = "1" ]; then ACC=${CLOUDFLARE_ACCOUNT_ID:-'<account_id>'}; cf GET "/accounts" >/dev/null; ZID='<zone_id>'; cf GET "/zones?name=$ZONE" >/dev/null
else
  ACC=${CLOUDFLARE_ACCOUNT_ID:-$(cf GET "/accounts" | py "import json,sys; r=json.load(sys.stdin).get('result') or []; print(r[0]['id'] if r else '')")}
  [ -n "$ACC" ] || { echo "cf_api_domain: no Cloudflare account visible to this token" >&2; exit 1; }
  ZID=$(cf GET "/zones?name=$ZONE" | py "import json,sys; r=json.load(sys.stdin).get('result') or []; print(r[0]['id'] if r else '')")
  [ -n "$ZID" ] || { echo "cf_api_domain: zone $ZONE not found" >&2; exit 1; }
fi
if [ "${1:-}" = "verify" ]; then [ "$DRY" = "1" ] && { echo "DRY_RUN: would curl https://$HOST/ and the CORS preflights"; exit 0; }; verify; exit $?; fi

# 1. already there?
CUR=$(cf GET "/accounts/$ACC/workers/domains?hostname=$HOST" | py "import json,sys; r=[d for d in (json.load(sys.stdin).get('result') or []) if d.get('hostname')=='$HOST']; print(r[0].get('service','') if r else '')")
if [ "$CUR" = "$SCRIPT" ]; then echo "$HOST is already the Custom Domain of $SCRIPT: nothing to change"
else
  [ -n "$CUR" ] && { echo "cf_api_domain: $HOST belongs to the Worker '$CUR', not $SCRIPT. Stop: move it by hand in the dashboard if that is really wanted." >&2; exit 1; }
  # 2. a CNAME on the hostname blocks a Custom Domain
  CN=$(cf GET "/zones/$ZID/dns_records?name=$HOST" | py "import json,sys; print(' '.join(r['type'] for r in (json.load(sys.stdin).get('result') or [])))")
  if [ -n "$CN" ]; then echo "cf_api_domain: $HOST already has DNS records ($CN). Delete them in the dashboard (DNS > Records) first, then run this again." >&2; exit 1; fi
  # 3. attach (PUT is idempotent for the same hostname and service)
  cf PUT "/accounts/$ACC/workers/domains" "{\"hostname\":\"$HOST\",\"service\":\"$SCRIPT\",\"zone_id\":\"$ZID\",\"environment\":\"production\"}" | ok
  [ "$DRY" = "1" ] || echo "attached $HOST -> $SCRIPT"
fi
[ "$DRY" = "1" ] && { echo "DRY_RUN: then the checks (bash tools/cf_api_domain.sh verify)"; exit 0; }
sleep 5
verify
