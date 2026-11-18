#!/usr/bin/env bash
# Deploys the cloud save API: the Worker "pawhaven-api" (cloudflare/worker.js) with its D1 database "pawhaven".
#   bash tools/cf_api_deploy.sh            make the D1 database if needed, apply cloudflare/schema.sql (safe to repeat), upload the Worker
# The Worker answers at https://api.doodledoggo.app (its Custom Domain, tools/cf_api_domain.sh; game/src/22b_cloud_config.js holds that address)
# and still at https://pawhaven-api.<workers.dev subdomain>.workers.dev (older game copies, the Stripe webhook).
# Needs CLOUDFLARE_ACCOUNT_ID. In a Claude cloud session the proxy adds the API token for api.cloudflare.com; anywhere else,
# export CLOUDFLARE_API_TOKEN (Workers Scripts: Edit, D1: Edit). Never print or commit the token.
set -euo pipefail
cd "$(dirname "$0")/.."
: "${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID}"
API="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID"
AUTH=(); if [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && [ "$CLOUDFLARE_API_TOKEN" != "proxy-injected" ]; then AUTH=(-H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"); fi
SCRIPT=pawhaven-api
DBNAME=pawhaven
py() { python3 -c "$1"; }
ok() { py "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('success') else (print(d.get('errors'), file=sys.stderr) or 1))"; }

DATE=$(sed -n 's/^compatibility_date = "\(.*\)"/\1/p' cloudflare/wrangler.toml)

# 1. D1 database
DBID=$(curl -sS "$API/d1/database?name=$DBNAME" "${AUTH[@]}" | py "import json,sys; r=[d for d in json.load(sys.stdin)['result'] if d['name']=='$DBNAME']; print(r[0]['uuid'] if r else '')")
if [ -z "$DBID" ]; then
  DBID=$(curl -sS -X POST "$API/d1/database" "${AUTH[@]}" -H 'Content-Type: application/json' -d "{\"name\":\"$DBNAME\"}" | py "import json,sys; print(json.load(sys.stdin)['result']['uuid'])")
  echo "made D1 database $DBNAME"
fi
echo "D1 $DBNAME: $DBID"

# 2. schema (every statement is "if not exists")
SQL=$(py "import json,re; s=open('cloudflare/schema.sql').read(); print(json.dumps({'sql': re.sub(r'--[^\n]*', '', s)}))")
curl -sS -X POST "$API/d1/database/$DBID/query" "${AUTH[@]}" -H 'Content-Type: application/json' -d "$SQL" | ok
echo "schema applied"
# (v2.25.5 gift codes: promo_codes and promo_redemptions are new tables in schema.sql, made here by step 2. Later columns: addcol below.)
# (v2.30 "Better together": invites, town_goal and town_goal_users are new tables, made here by step 2. No added columns.)
# 2b. added columns: SQLite has no "add column if not exists", so each is added only when it is missing (safe to repeat).
#     Additive only: never drop or rename. users.official (v2.22.3): the official Friends account, set by hand in D1 only.
addcol() { # table column definition
  local n
  n=$(curl -sS -X POST "$API/d1/database/$DBID/query" "${AUTH[@]}" -H 'Content-Type: application/json' \
      -d "{\"sql\":\"select count(*) as n from pragma_table_info('$1') where name = '$2'\"}" \
    | py "import json,sys; d=json.load(sys.stdin); assert d.get('success'), d.get('errors'); print(d['result'][0]['results'][0]['n'])")
  if [ "$n" = "0" ]; then
    curl -sS -X POST "$API/d1/database/$DBID/query" "${AUTH[@]}" -H 'Content-Type: application/json' \
      -d "{\"sql\":\"alter table $1 add column $2 $3\"}" | ok
    echo "added $1.$2"
  else
    echo "$1.$2 is there"
  fi
}
addcol users official 'integer not null default 0'
addcol shop_holds tried_at 'integer' # Kind shop refund fix (13 Nov 2026): only matters if an older shop_holds was ever created
addcol shop_holds nonce 'text' # Kind shop fix round 2 (13 Nov 2026): the hold's Idempotency-Key nonce. Must run before the new Worker (below)
addcol purchases disputed_at 'integer' # refund protection (14 Nov 2026): set by charge.dispute.created. Must run before the new Worker (below)
addcol users shop_hash 'text' # refund protection (14 Nov 2026): the one-way email code the delete trigger keeps. Before the trigger and the Worker
# 2c. triggers (cloudflare/schema_triggers.sql), after every added column they name; one statement per request (split on "-- statement")
py "import json,re; s=open('cloudflare/schema_triggers.sql').read(); [print(json.dumps({'sql': re.sub(r'--[^\n]*', '', p).strip()})) for p in re.split(r'^-- statement$', s, flags=re.M)[1:] if re.sub(r'--[^\n]*', '', p).strip()]" \
  | while IFS= read -r Q; do curl -sS -X POST "$API/d1/database/$DBID/query" "${AUTH[@]}" -H 'Content-Type: application/json' --data-binary "$Q" | ok; done
echo "triggers applied"

# (v2.32 "A letter from your dog": the table letters is new in schema.sql, its trigger users_letters_gone in schema_triggers.sql. No added columns.)

# 3. the Worker, bound to D1. Its second module letters_text.js (v2.32: the letter's words, node tools/letters_pack.js) goes up next to worker.js.
#    Plain variables set in the dashboard (BT_FROM, TOWN_GOAL, LETTERS_FROM, LETTERS_CAP, LETTERS_DAY, LETTERS_IMG) are kept across deploys, like the secrets
node tools/letters_pack.js --check
META=$(py "import json; print(json.dumps({'main_module':'worker.js','compatibility_date':'$DATE','keep_bindings':['secret_text','plain_text'],'bindings':[{'type':'d1','name':'DB','id':'$DBID'}]}))")
curl -sS -X PUT "$API/workers/scripts/$SCRIPT" "${AUTH[@]}" \
  -F "metadata=$META;type=application/json" -F "worker.js=@cloudflare/worker.js;type=application/javascript+module" \
  -F "letters_text.js=@cloudflare/letters_text.js;type=application/javascript+module" | ok
# 3b. v2.32 letters: the two Cron Triggers (the same as cloudflare/wrangler.toml). They only wake the Worker: it sends nothing before LETTERS_FROM
#     and outside its own window (Sundays 10:00 JST and the 48 hours after it)
curl -sS -X PUT "$API/workers/scripts/$SCRIPT/schedules" "${AUTH[@]}" -H 'Content-Type: application/json' \
  -d '[{"cron":"0 1-23 * * SUN"},{"cron":"0 * * * MON"}]' | ok
echo "cron triggers set"
# 3c. v2.32 letters: LETTERS_KEY signs the confirm and unsubscribe links. Made once, here, from random bytes, never printed, never changed afterwards
#     (a new key would break the unsubscribe links in letters already sent). The list call returns names only
if curl -sS "$API/workers/scripts/$SCRIPT/secrets" "${AUTH[@]}" | py "import json,sys; d=json.load(sys.stdin); sys.exit(0 if any(x.get('name')=='LETTERS_KEY' for x in (d.get('result') or [])) else 1)"; then
  echo "secret LETTERS_KEY is there"
else
  py "import json,secrets; print(json.dumps({'name':'LETTERS_KEY','text':secrets.token_urlsafe(48),'type':'secret_text'}))" \
    | curl -sS -X PUT "$API/workers/scripts/$SCRIPT/secrets" "${AUTH[@]}" -H 'Content-Type: application/json' --data-binary @- | ok
  echo "secret LETTERS_KEY made"
fi
curl -sS -X POST "$API/workers/scripts/$SCRIPT/subdomain" "${AUTH[@]}" -H 'Content-Type: application/json' -d '{"enabled":true,"previews_enabled":false}' | ok
SUB=$(curl -sS "$API/workers/subdomain" "${AUTH[@]}" | py "import json,sys; print(json.load(sys.stdin)['result']['subdomain'])")
echo "deployed https://$SCRIPT.$SUB.workers.dev"
# the Resend key for Forgot password (v2.8.2): a Worker secret, never a plain var. Kept across deploys (keep_bindings above).
if [ -n "${RESEND_API_KEY:-}" ]; then
  py "import json,os; print(json.dumps({'name':'RESEND_API_KEY','text':os.environ['RESEND_API_KEY'],'type':'secret_text'}))" \
    | curl -sS -X PUT "$API/workers/scripts/$SCRIPT/secrets" "${AUTH[@]}" -H 'Content-Type: application/json' --data-binary @- | ok
  echo "secret RESEND_API_KEY set"
fi
sleep 3
curl -sS "https://$SCRIPT.$SUB.workers.dev/" || true; echo
