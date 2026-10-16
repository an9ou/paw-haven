#!/usr/bin/env bash
# Deploys the cloud save API: the Worker "pawhaven-api" (cloudflare/worker.js) with its D1 database "pawhaven".
#   bash tools/cf_api_deploy.sh            make the D1 database if needed, apply cloudflare/schema.sql (safe to repeat), upload the Worker
# The Worker answers at https://pawhaven-api.<workers.dev subdomain>.workers.dev (game/src/22b_cloud_config.js holds that address).
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

# the public Supabase values the Worker uses to move old accounts over (from cloudflare/wrangler.toml [vars])
SB_URL=$(sed -n 's/^SUPABASE_URL = "\(.*\)"/\1/p' cloudflare/wrangler.toml)
SB_KEY=$(sed -n 's/^SUPABASE_KEY = "\(.*\)"/\1/p' cloudflare/wrangler.toml)
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

# 3. the Worker, bound to D1, with the public Supabase values
META=$(py "import json; print(json.dumps({'main_module':'worker.js','compatibility_date':'$DATE','bindings':[{'type':'d1','name':'DB','id':'$DBID'},{'type':'plain_text','name':'SUPABASE_URL','text':'$SB_URL'},{'type':'plain_text','name':'SUPABASE_KEY','text':'$SB_KEY'}]}))")
curl -sS -X PUT "$API/workers/scripts/$SCRIPT" "${AUTH[@]}" \
  -F "metadata=$META;type=application/json" -F "worker.js=@cloudflare/worker.js;type=application/javascript+module" | ok
curl -sS -X POST "$API/workers/scripts/$SCRIPT/subdomain" "${AUTH[@]}" -H 'Content-Type: application/json' -d '{"enabled":true,"previews_enabled":false}' | ok
SUB=$(curl -sS "$API/workers/subdomain" "${AUTH[@]}" | py "import json,sys; print(json.load(sys.stdin)['result']['subdomain'])")
echo "deployed https://$SCRIPT.$SUB.workers.dev"
sleep 3
curl -sS "https://$SCRIPT.$SUB.workers.dev/" || true; echo
