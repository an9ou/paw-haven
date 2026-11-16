#!/usr/bin/env bash
# Kind shop refund protection (owner, 14 Nov 2026; V224.md 4.4): the owner's hand-set flags in the D1 table shop_flags.
#   bash tools/shop_flag.sh block user <user id> [note]     pause paid items for that account
#   bash tools/shop_flag.sh block email <address> [note]    pause paid items for every account with that email (a new one too)
#   bash tools/shop_flag.sh allow user <user id> [note]     lift the auto pause (2 full refunds or 1 dispute) for that account
#   bash tools/shop_flag.sh allow email <address> [note]    the same for every account with that email
#   bash tools/shop_flag.sh clear user <user id>            remove that flag (back to the automatic rule)
#   bash tools/shop_flag.sh clear email <address>
#   bash tools/shop_flag.sh block|allow|clear hash <address>  the 'h:' row a paused account left when it was deleted (only a one-way code
#                                                           of its email is kept): computed here from the address; allow or clear lifts it
#   bash tools/shop_flag.sh list                            every flag (h: rows as their code), then the accounts the automatic rule pauses now
# A block wins over an allow. Coins buys in the game are never affected. Emails are stored lower case (Checkout sends the account email).
# Same Cloudflare D1 API as tools/cf_api_deploy.sh: needs CLOUDFLARE_ACCOUNT_ID; the proxy adds the token in a Claude cloud session,
# anywhere else export CLOUDFLARE_API_TOKEN (D1: Edit). Arguments only ever travel as D1 query params, never inside the SQL text.
# DRY_RUN=1 prints the request body instead of sending it (no account or token needed).
set -euo pipefail
cd "$(dirname "$0")/.."
DBNAME=pawhaven
usage() { sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//' >&2; exit 2; }

CMD="${1:-}"
case "$CMD" in
  block|allow|clear) [ $# -ge 3 ] || usage; KIND="$2"; VAL="$3"; NOTE="${4:-}"; [ $# -le 4 ] || usage ;;
  list) [ $# -eq 1 ] || usage ;;
  *) usage ;;
esac

# the D1 request body, built by Python from argv (validated there): { sql, params }
BODY=$(python3 - "$@" <<'PY'
import hashlib, json, re, sys, time
a = sys.argv[1:]
cmd = a[0]
def die(m): print('shop_flag: ' + m, file=sys.stderr); sys.exit(2)
if cmd == 'list':
    print(json.dumps({'sql': "select key, mode, note, created_at from shop_flags order by created_at desc"})); sys.exit(0)
kind, val = a[1], a[2]
note = a[3] if len(a) > 3 else ''
if kind == 'user':
    if not re.fullmatch(r'[A-Za-z0-9_-]{1,64}', val): die('a user id is 1-64 letters, digits, - or _')
    key = 'u:' + val
elif kind in ('email', 'hash'):
    val = val.strip().lower()
    if len(val) > 254 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', val): die('that does not look like an email address')
    # hash: the same one-way code as the Worker's shopHash() (hex SHA-256 of "dd-shop-v1:" + the lowercased, trimmed email)
    key = 'e:' + val if kind == 'email' else 'h:' + hashlib.sha256(('dd-shop-v1:' + val).encode('utf-8')).hexdigest()
else:
    die('say user <id>, email <address> or hash <address>')
if any(ord(c) < 32 for c in note): die('the note has control characters')
if len(note) > 200: die('the note is longer than 200 characters')
if cmd == 'clear':
    print(json.dumps({'sql': 'delete from shop_flags where key = ?1', 'params': [key]}))
else:
    print(json.dumps({'sql': 'insert into shop_flags (key, mode, note, created_at) values (?1, ?2, ?3, ?4) '
                             'on conflict(key) do update set mode = excluded.mode, note = excluded.note, created_at = excluded.created_at',
                      'params': [key, cmd, note or None, int(time.time() * 1000)]}))
PY
)
# list also shows who the automatic rule pauses now (2 full refunds or 1 dispute, no allow or block flag)
AUTO='{"sql":"select p.user_id, u.email, count(p.refunded_at) as refunds, count(p.disputed_at) as disputes from purchases p left join users u on u.id = p.user_id group by p.user_id having count(p.refunded_at) >= 2 or count(p.disputed_at) >= 1 order by p.user_id"}'

if [ "${DRY_RUN:-}" = "1" ]; then
  echo "$BODY"; [ "$CMD" = "list" ] && echo "$AUTO"
  exit 0
fi

: "${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID}"
API="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID"
AUTH=(); if [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && [ "$CLOUDFLARE_API_TOKEN" != "proxy-injected" ]; then AUTH=(-H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"); fi
DBID=$(curl -sS "$API/d1/database?name=$DBNAME" "${AUTH[@]}" | python3 -c "import json,sys; r=[d for d in json.load(sys.stdin)['result'] if d['name']=='$DBNAME']; print(r[0]['uuid'] if r else '')")
[ -n "$DBID" ] || { echo "shop_flag: no D1 database $DBNAME" >&2; exit 1; }
q() { curl -sS -X POST "$API/d1/database/$DBID/query" "${AUTH[@]}" -H 'Content-Type: application/json' --data-binary @- <<<"$1"; }
# prints the rows (list) or what changed; exits 1 on a D1 error
show() {
  python3 -c '
import json, sys, time
d = json.load(sys.stdin)
if not d.get("success"): print(d.get("errors"), file=sys.stderr); sys.exit(1)
res = d["result"][0]
rows = res.get("results") or []
title = sys.argv[1]
if title == "-": print("done (%s row changed)" % res.get("meta", {}).get("changes", "?")); sys.exit(0)
print(title)
if not rows: print("  (none)")
for r in rows:
    if "created_at" in r and r["created_at"]: r["created_at"] = time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime(r["created_at"] / 1000))
    print("  " + "  ".join("%s=%s" % (k, "" if v is None else v) for k, v in r.items()))
' "$1"
}
if [ "$CMD" = "list" ]; then
  q "$BODY" | show "flags (shop_flags):"
  q "$AUTO" | show "paused by the automatic rule unless an allow flag says otherwise (2 full refunds or 1 dispute):"
else
  q "$BODY" | show -
fi
