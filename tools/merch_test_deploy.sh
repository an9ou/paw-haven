#!/usr/bin/env bash
# Merch part 9: deploys the SANDBOX test Worker "doodle-doggo-merch-test" at https://merch-api-test.doodledoggo.app (docs/design/merch/SANDBOX.md).
# Modelled on tools/cf_test_deploy.sh (the game's test copy), which it never changes. The owner approves a real send first (choice window).
#
#   bash tools/merch_test_deploy.sh                       DRY RUN (the default): builds, then prints every request it would send; sends none
#   BUILD_ONLY=1 bash tools/merch_test_deploy.sh          builds the bundle only (tools/merch_test_build.mjs); no network but the npm download
#   DRY_RUN=0 MERCH_TEST_DEPLOY_OK=1 bash tools/merch_test_deploy.sh     the real send (only after the owner's go-ahead)
#   MERCH_TEST_PRINTER=1 ...                              with any of the above: also the stand-in printer (part 9, C2; run 1, before the
#                                                         Printful key): the second Worker doodle-doggo-merch-test-printer and the binding
#                                                         PROVIDER_FETCH to it. A later send without it drops the binding (the printer Worker
#                                                         stays, idle, until it is deleted: SANDBOX.md E)
#
# What a real send does (Cloudflare REST API with curl, as tools/cf_test_deploy.sh and the 25 Nov cloud render test did; wrangler only bundles):
#   1. the account (refused when more than one is visible and CLOUDFLARE_ACCOUNT_ID is not set) and the zone doodledoggo.app
#   2. counts the account's Workers and cron triggers (Free: 5 crons an account; refused if this Worker's one would be the 6th)
#   3a. (MERCH_TEST_PRINTER=1 only) first the stand-in printer Worker: its own SQLite Durable Object PRINTER -> TestPrinter (migration v1 on its
#      first deploy), no variables, secrets, route or cron; then workers.dev off for it
#   3. upload: the real merch Worker in the test entry; Durable Objects LEDGER, PRINTS, RENDER (SQLite; the migration only on the first
#      deploy), Browser Run BROWSER, the [env.test] variables; keep_bindings secret_text keeps every secret the owner set in the dashboard.
#      A new Worker is uploaded twice: the second upload adds SELF (a service binding to itself, entrypoint RenderGate)
#   4. the cron trigger */10 (PUT .../schedules), workers.dev off, the Custom Domain merch-api-test.doodledoggo.app (idempotent; it stops if the
#      name belongs to another Worker or has DNS records)
#   5. lists the Worker's secret NAMES (never a value) and says which are still missing; checks the public answers
# The Worker is safe with no secret at all: without the Stripe keys, MERCH_HASH_KEY, MERCH_FILE_KEY and a printer it refuses every order
# (cloudflare/merch/README.md "Safe by default"), and the test entry answers 503 unless MERCH_TEST = "1". So the first send makes the full
# Worker (no placeholder), and the owner then adds the secrets to it in the dashboard (SANDBOX.md A).
# This script never reads, prints or sets a secret. The Cloudflare token: in a Claude cloud session the proxy adds it; anywhere else export
# CLOUDFLARE_API_TOKEN (Workers Scripts: Edit, Zone > Workers Routes: Edit on doodledoggo.app), which only curl reads (--variable), never this script.
# Switch it off at once (SANDBOX.md E): Cloudflare dashboard > Workers & Pages > doodle-doggo-merch-test > Settings > Variables and Secrets >
# add or edit MERCH_OFF = 1 (no new checkouts), or Settings > Domains & Routes > remove merch-api-test.doodledoggo.app (nothing answers).
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd)
NAME=${MERCH_TEST_NAME:-doodle-doggo-merch-test}
[ "$NAME" = "doodle-doggo-merch-test" ] || { echo "merch_test_deploy: refused: the target must be exactly doodle-doggo-merch-test (got '$NAME')" >&2; exit 2; }
HOST=merch-api-test.doodledoggo.app; ZONE=doodledoggo.app; CRON='*/10 * * * *'; CRON_LIMIT=5
PNAME=doodle-doggo-merch-test-printer; PRINTER=${MERCH_TEST_PRINTER:-0}
case "$PRINTER" in 0|1) ;; *) echo "merch_test_deploy: refused: MERCH_TEST_PRINTER is 1 or 0" >&2; exit 2 ;; esac
CF=https://api.cloudflare.com/client/v4
BUILD_ONLY=${BUILD_ONLY:-0}; DRY=1; [ "${DRY_RUN:-1}" = "0" ] && DRY=0
if [ "$BUILD_ONLY" != "1" ] && [ "$DRY" = "0" ] && [ "${MERCH_TEST_DEPLOY_OK:-0}" != "1" ]; then
  echo "merch_test_deploy: refused: a real send needs DRY_RUN=0 AND MERCH_TEST_DEPLOY_OK=1, and only after the owner's go-ahead" >&2; exit 2
fi
OUT=${MERCH_TEST_OUT:-$(mktemp -d "${TMPDIR:-/tmp}/dd-merch-test.XXXXXX")}
case "$(cd "$OUT" 2>/dev/null && pwd)/" in "$ROOT"/*) echo "merch_test_deploy: refused: MERCH_TEST_OUT must be outside the repo" >&2; exit 2 ;; esac
AUTH=(); if [ "${CLOUDFLARE_API_TOKEN:-proxy-injected}" != "proxy-injected" ]; then AUTH=(--variable %CLOUDFLARE_API_TOKEN --expand-header 'Authorization: Bearer {{CLOUDFLARE_API_TOKEN}}'); fi
js() { node -e "$1" "${@:2}"; } # small JSON reads from stdin
cf() { # METHOD PATH [json body]: one JSON call. Dry: printed, and an empty success is the answer
  local m=$1 p=$2 b=${3:-}
  if [ "$DRY" = "1" ]; then echo "DRY_RUN: $m $CF$p${b:+  $b}" >&2; echo '{"success":true,"result":[]}'; return 0; fi
  if [ -n "$b" ]; then curl -sS --max-time 60 -X "$m" "$CF$p" "${AUTH[@]+"${AUTH[@]}"}" -H 'Content-Type: application/json' --data-binary "$b"
  else curl -sS --max-time 60 -X "$m" "$CF$p" "${AUTH[@]+"${AUTH[@]}"}"; fi
}
ok() { js "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{let j;try{j=JSON.parse(s)}catch(e){console.error(s.slice(0,300));process.exit(1)}if(!j.success){console.error(JSON.stringify(j.errors||j).slice(0,400));process.exit(1)}})"; }
res() { js "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s||'{}');const r=j.result;console.log(eval(process.argv[1]))})" "$1"; } # res '<expr over r>'

# ---------- 1. build (local only) ----------
echo "merch test Worker: $NAME -> https://$HOST ($([ "$BUILD_ONLY" = "1" ] && echo BUILD_ONLY || { [ "$DRY" = "1" ] && echo 'DRY RUN: nothing is sent' || echo 'REAL SEND'; }))"
BUNDLE=(); [ "${MERCH_TEST_NO_BUNDLE:-0}" = "1" ] && BUNDLE=(--no-bundle)
NODE_PATH=${NODE_PATH:-$(npm root -g)} MERCH_TEST_PRINTER=$PRINTER node tools/merch_test_build.mjs --out "$OUT" "${BUNDLE[@]+"${BUNDLE[@]}"}"
[ "$BUILD_ONLY" = "1" ] && { echo "BUILD_ONLY: the bundle and the upload metadata are in $OUT; nothing sent"; exit 0; }

# ---------- 2. account, zone, counts ----------
if [ "$DRY" = "1" ]; then
  ACC='<account_id>'; ZID='<zone_id>' # a dry run never prints the real account id (it is not a secret, but it need not be in a log)
  [ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ] || cf GET /accounts >/dev/null # (a real send refuses when more than one account is visible)
  cf GET "/zones?name=$ZONE" >/dev/null
  cf GET "/accounts/$ACC/workers/scripts" >/dev/null
  echo "DRY_RUN: GET $CF/accounts/$ACC/workers/scripts/<each Worker>/schedules   (count the account's cron triggers: at most $CRON_LIMIT; pawhaven-api has 2)" >&2
  EXISTS=no; PEXISTS=no; NOW_CRONS=0
else
  if [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
    ACCS=$(cf GET /accounts); N=$(echo "$ACCS" | res '(r||[]).length')
    [ "$N" = "1" ] || { echo "merch_test_deploy: $N Cloudflare accounts are visible: set CLOUDFLARE_ACCOUNT_ID (nothing was changed)" >&2; exit 1; }
    ACC=$(echo "$ACCS" | res 'r[0].id')
  else ACC=$CLOUDFLARE_ACCOUNT_ID; fi
  ZID=$(cf GET "/zones?name=$ZONE" | res '(r||[])[0] ? r[0].id : ""'); [ -n "$ZID" ] || { echo "merch_test_deploy: zone $ZONE not found" >&2; exit 1; }
  SCRIPTS=$(cf GET "/accounts/$ACC/workers/scripts" | res '(r||[]).map(s=>s.id).join(" ")')
  EXISTS=no; case " $SCRIPTS " in *" $NAME "*) EXISTS=yes ;; esac
  PEXISTS=no; case " $SCRIPTS " in *" $PNAME "*) PEXISTS=yes ;; esac
  NOW_CRONS=0; MINE=0
  for s in $SCRIPTS; do
    c=$(cf GET "/accounts/$ACC/workers/scripts/$s/schedules" | res '((r&&r.schedules)||[]).length')
    NOW_CRONS=$((NOW_CRONS + c)); [ "$s" = "$NAME" ] && MINE=$c
    echo "  cron triggers on $s: $c"
  done
  [ $((NOW_CRONS - MINE + 1)) -le $CRON_LIMIT ] || { echo "merch_test_deploy: the account has $NOW_CRONS cron triggers; one more for $NAME would pass the limit of $CRON_LIMIT (nothing was changed)" >&2; exit 1; }
  echo "account: $(echo "$SCRIPTS" | wc -w | tr -d ' ') Workers, $NOW_CRONS cron triggers; $NAME exists: $EXISTS; $PNAME exists: $PEXISTS"
fi
API="/accounts/$ACC/workers/scripts/$NAME"; PAPI="/accounts/$ACC/workers/scripts/$PNAME"

# ---------- 3. upload (multipart: the metadata file + every bundle part; no secret in any of them) ----------
upload() { # metadata file [parts file, bundle folder, script path, name]: the test Worker by default, or the stand-in printer
  local meta=$1 parts=${2:-$OUT/parts.txt} dir=${3:-$OUT/out} api=${4:-$API} who=${5:-$NAME}; local FORM=(-F "metadata=@$meta;type=application/json")
  while read -r f t; do [ -n "$f" ] && FORM+=(-F "$f=@$dir/$f;filename=$f;type=$t"); done < "$parts"
  if [ "$DRY" = "1" ]; then
    echo "DRY_RUN: PUT $CF$api  multipart: $(basename "$meta") ($(js "const m=require(process.argv[1]);console.log('bindings '+m.bindings.map(b=>b.name+':'+b.type+(b.service?' -> '+b.service:'')).join(', ')+(m.migrations?'; migration new_tag '+m.migrations.new_tag+' new_sqlite_classes '+m.migrations.new_sqlite_classes.join('/'):'; no migration')+(m.keep_bindings?'; keep_bindings '+m.keep_bindings.join(','):''))" "$meta")) + $(cut -d' ' -f1 "$parts" | tr '\n' ' ')" >&2
    return 0
  fi
  curl -sS --max-time 300 --fail-with-body -X PUT "$CF$api" "${AUTH[@]+"${AUTH[@]}"}" "${FORM[@]}" | ok
  echo "uploaded $who ($(basename "$meta"))"
}
# C2: the stand-in printer first (the test Worker's PROVIDER_FETCH can only name a Worker that exists); no route, no cron, workers.dev off
if [ "$PRINTER" = "1" ]; then
  [ "$DRY" = "1" ] && echo "DRY_RUN: (MERCH_TEST_PRINTER=1) the stand-in printer $PNAME first; it is reached only through the binding PROVIDER_FETCH of $NAME" >&2
  if [ "$PEXISTS" = "no" ]; then upload "$OUT/printer_meta_new.json" "$OUT/printer_parts.txt" "$OUT/printer/out" "$PAPI" "$PNAME"
  else upload "$OUT/printer_meta.json" "$OUT/printer_parts.txt" "$OUT/printer/out" "$PAPI" "$PNAME"; fi
  cf POST "$PAPI/subdomain" '{"enabled":false,"previews_enabled":false}' | ok
fi
if [ "$EXISTS" = "no" ]; then
  upload "$OUT/meta_new.json"     # the Worker and its Durable Object classes (migration v2: MerchLedger, MerchPrints, MerchRender)
  upload "$OUT/meta.json"         # again with SELF -> itself (a service binding can only name a Worker that exists)
else
  upload "$OUT/meta.json"         # a redeploy: no migration (the classes exist), SELF kept
fi

# ---------- 4. cron, workers.dev off, the Custom Domain ----------
cf PUT "$API/schedules" "[{\"cron\":\"$CRON\"}]" | ok
cf POST "$API/subdomain" '{"enabled":false,"previews_enabled":false}' | ok
CUR=$(cf GET "/accounts/$ACC/workers/domains?hostname=$HOST" | res "((r||[]).filter(d=>d.hostname==='$HOST')[0]||{}).service||''")
if [ "$CUR" = "$NAME" ]; then echo "$HOST is already the Custom Domain of $NAME"
else
  [ -n "$CUR" ] && { echo "merch_test_deploy: $HOST belongs to the Worker '$CUR'. Stop: change it by hand if that is really wanted." >&2; exit 1; }
  RECS=$(cf GET "/zones/$ZID/dns_records?name=$HOST" | res '(r||[]).map(x=>x.type).join(" ")')
  [ -n "$RECS" ] && { echo "merch_test_deploy: $HOST already has DNS records ($RECS). Delete them in the dashboard (DNS > Records), then run this again." >&2; exit 1; }
  cf PUT "/accounts/$ACC/workers/domains" "{\"hostname\":\"$HOST\",\"service\":\"$NAME\",\"zone_id\":\"$ZID\",\"environment\":\"production\"}" | ok
  [ "$DRY" = "1" ] || echo "attached $HOST -> $NAME"
fi

# ---------- 5. which secrets are set (names only) ----------
WANT="MERCH_STRIPE_KEY MERCH_STRIPE_WEBHOOK_SECRET MERCH_FILE_KEY MERCH_HASH_KEY MERCH_ADMIN_KEY MERCH_OWNER_TO RESEND_API_KEY MERCH_PROVIDER_KEY MERCH_PROVIDER_WEBHOOK_SECRET"
if [ "$DRY" = "1" ]; then cf GET "$API/secrets" >/dev/null; echo "DRY_RUN: (then it names which of these are still missing: $WANT)$([ "$PRINTER" = "1" ] && echo "; with the stand-in, MERCH_PROVIDER_KEY stays unset (a real key turns the stand-in off)")" >&2
else
  HAVE=$(cf GET "$API/secrets" | res '(r||[]).map(s=>s.name).join(" ")')
  MISS=""; for k in $WANT; do case " $HAVE " in *" $k "*) ;; *) MISS="$MISS $k" ;; esac; done
  echo "secrets set (names): ${HAVE:-none}"
  if [ "$PRINTER" = "1" ]; then case " $HAVE " in *" MERCH_PROVIDER_KEY "*) echo "note: MERCH_PROVIDER_KEY is set, so the stand-in printer is NOT used: that key goes to Printful (C2)" ;; *) echo "printer: the stand-in $PNAME (no MERCH_PROVIDER_KEY set)" ;; esac; fi
  [ -n "$MISS" ] && echo "still missing:$MISS   (the owner adds them in the dashboard: SANDBOX.md A; the Worker takes no order until the Stripe keys, MERCH_FILE_KEY, MERCH_HASH_KEY and a printer are there)"
fi

# ---------- 6. the public checks ----------
AV=$(node -e "console.log(require(process.argv[1]).ART_VER)" "$ROOT/merch/dist/pawprint.js")
if [ "$DRY" = "1" ]; then
  echo "DRY_RUN: then the checks on https://$HOST: GET /merch/catalog 200 JSON; OPTIONS /merch/quote from https://test.doodledoggo.app 204 and from https://doodledoggo.app 403; GET /merch/print/$AV/ 200; POST /merch/webhook/stripe unsigned 400 (503 before the webhook secret is set); GET /merch/admin/report without the key 401"
  if [ "$PRINTER" = "1" ]; then
    echo "DRY_RUN: GET $CF$PAPI/subdomain   (the stand-in printer: workers.dev must be off; it has no route, domain or cron)"
    echo "DRY_RUN: to delete them afterwards (SANDBOX.md E; by hand in the dashboard, never by this script): first $NAME (DELETE $CF$API), then $PNAME (DELETE $CF$PAPI; a Worker that another binds to cannot go first). Their Durable Objects and data go with them."
  fi
  echo "DRY RUN done: nothing was sent. The build is in $OUT"; exit 0
fi
sleep 5; fail=0
chk() { if [ "$1" = "$2" ]; then echo "ok   $3"; else echo "FAIL $3 (got '$1', want '$2')"; fail=1; fi; }
code() { curl -sS --max-time 30 -o /dev/null -w '%{http_code}' "$@"; }
chk "$(code "https://$HOST/merch/catalog")" 200 "the catalog answers"
chk "$(code -X OPTIONS -H 'Origin: https://test.doodledoggo.app' -H 'Access-Control-Request-Method: POST' "https://$HOST/merch/quote")" 204 "CORS: the test copy is allowed"
chk "$(code -X OPTIONS -H 'Origin: https://doodledoggo.app' -H 'Access-Control-Request-Method: POST' "https://$HOST/merch/quote")" 403 "CORS: the live site is refused by the test Worker"
chk "$(code "https://$HOST/merch/print/$AV/")" 200 "the print page $AV"
W=$(code -X POST -H 'Content-Type: application/json' --data '{}' "https://$HOST/merch/webhook/stripe"); case "$W" in 400|503) echo "ok   an unsigned Stripe event is refused ($W)" ;; *) echo "FAIL an unsigned Stripe event (got $W)"; fail=1 ;; esac
chk "$(code "https://$HOST/merch/admin/report")" 401 "the admin routes need the key"
if [ "$PRINTER" = "1" ]; then chk "$(cf GET "$PAPI/subdomain" | res '(r&&r.enabled)?"on":"off"')" off "the stand-in printer has no workers.dev address"; fi
[ $fail = 0 ] && echo "MERCH TEST WORKER OK: https://$HOST (build in $OUT)" || { echo "MERCH TEST WORKER CHECK FAILED"; exit 1; }
