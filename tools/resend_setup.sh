#!/usr/bin/env bash
# One-time setup of the Forgot password email (v2.8.2), once the owner has a Resend account and its API key is in the
# Claude environment as RESEND_API_KEY (environment settings, Environment variables; a new session picks it up).
#   bash tools/resend_setup.sh
# 1. adds the domain doodledoggo.app to Resend (or finds it), 2. adds the DNS records Resend asks for to the Cloudflare zone,
# plus a DMARC record, 3. asks Resend to verify, 4. stores the key as the Worker secret RESEND_API_KEY on pawhaven-api.
# Safe to run again. Never prints the key. Needs Zone DNS: Edit on doodledoggo.app for step 2 (otherwise it prints the records).
set -euo pipefail
cd "$(dirname "$0")/.."
: "${RESEND_API_KEY:?Add RESEND_API_KEY to the Claude environment (Environment variables), then start a new session}"
: "${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID}"
CF="https://api.cloudflare.com/client/v4"
AUTH=(); if [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && [ "$CLOUDFLARE_API_TOKEN" != "proxy-injected" ]; then AUTH=(-H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"); fi
RS=(-H "Authorization: Bearer $RESEND_API_KEY" -H 'Content-Type: application/json')
ZONE=doodledoggo.app
py() { python3 -c "$1"; }

# 1. the domain in Resend
DOM=$(curl -sS https://api.resend.com/domains "${RS[@]}" | py "import json,sys; d=[x for x in json.load(sys.stdin).get('data',[]) if x['name']=='$ZONE']; print(d[0]['id'] if d else '')")
if [ -z "$DOM" ]; then
  DOM=$(curl -sS -X POST https://api.resend.com/domains "${RS[@]}" -d "{\"name\":\"$ZONE\",\"region\":\"ap-northeast-1\"}" | py "import json,sys; print(json.load(sys.stdin)['id'])")
  echo "added $ZONE to Resend"
fi
curl -sS "https://api.resend.com/domains/$DOM" "${RS[@]}" > /tmp/resend_domain.json

# 2. its DNS records in Cloudflare (Resend gives names relative to the domain)
ZID=$(curl -sS "$CF/zones?name=$ZONE" "${AUTH[@]}" | py "import json,sys; print(json.load(sys.stdin)['result'][0]['id'])")
py "
import json
d=json.load(open('/tmp/resend_domain.json'))
recs=[(r['type'], r['name'], r['value'], r.get('priority')) for r in d.get('records',[])]
recs.append(('TXT','_dmarc','v=DMARC1; p=none;',None))
for t,n,v,p in recs: print('\t'.join([t, n, v, str(p or '')]))
" | while IFS=$'\t' read -r type name value prio; do
  fq="$name.$ZONE"; [ "$name" = "@" ] && fq=$ZONE
  have=$(curl -sS "$CF/zones/$ZID/dns_records?type=$type&name=$fq" "${AUTH[@]}" | py "import json,sys; print(len(json.load(sys.stdin).get('result') or []))")
  if [ "$have" != "0" ]; then echo "DNS $type $fq: already there"; continue; fi
  body=$(TYPE="$type" NAME="$fq" VALUE="$value" PRIO="$prio" py "import json,os; b={'type':os.environ['TYPE'],'name':os.environ['NAME'],'content':os.environ['VALUE'],'ttl':1,'proxied':False}; p=os.environ['PRIO']; b.update({'priority':int(p)} if p else {}); print(json.dumps(b))")
  if curl -sS -X POST "$CF/zones/$ZID/dns_records" "${AUTH[@]}" -H 'Content-Type: application/json' -d "$body" | py "import json,sys; sys.exit(0 if json.load(sys.stdin).get('success') else 1)"; then
    echo "DNS $type $fq: added"
  else
    echo "DNS $type $fq: could not add (needs Zone DNS: Edit). Add it by hand: $type $fq ${prio:+priority $prio }$value"
  fi
done
rm -f /tmp/resend_domain.json

# 3. verify (Resend checks the DNS; it can take a few minutes, run this script again to re-check)
curl -sS -X POST "https://api.resend.com/domains/$DOM/verify" "${RS[@]}" >/dev/null || true
ST=$(curl -sS "https://api.resend.com/domains/$DOM" "${RS[@]}" | py "import json,sys; print(json.load(sys.stdin).get('status'))")
echo "Resend domain status: $ST"
if [ "$ST" != "verified" ]; then echo "Not verified yet: run this script again in a few minutes. The Worker secret is set only once the domain is verified."; exit 0; fi

# 4. the key as a Worker secret (Forgot password turns on as soon as it is set: only after the domain is verified, so no link is
#    promised that Resend would refuse to send)
py "import json,os; print(json.dumps({'name':'RESEND_API_KEY','text':os.environ['RESEND_API_KEY'],'type':'secret_text'}))" \
  | curl -sS -X PUT "$CF/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts/pawhaven-api/secrets" "${AUTH[@]}" -H 'Content-Type: application/json' --data-binary @- \
  | py "import json,sys; print('Worker secret RESEND_API_KEY set:', json.load(sys.stdin).get('success'))"
