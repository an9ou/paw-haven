#!/usr/bin/env bash
# Gift codes (v2.25.5, PROMO.md): the owner's codes in the D1 table promo_codes. Nothing is paid. Rewards: code-only items, a few coins
# (500 at most a code: walks stay the main income), dog-safe treats. Names are checked against tools/promo_items.json (node tools/promo_items.js).
#   bash tools/promo.sh create <CODE> [reward] [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--cap N] [--note "..."]
#        a shared code (e.g. DOGGO-IG-NOV): each account can use it once; --cap: at most N uses in all
#   bash tools/promo.sh batch <PREFIX> <count> [reward] [--from ...] [--to ...] [--note "..."]
#        <count> unique codes PREFIX-XXXX-XXXX (no 0/O/1/I/L), each usable once in all and one per account per batch. The batch id is PREFIX
#        and today's Japan date (GIFT-20261116); a batch id that exists already is refused (one PREFIX a day). The codes are never printed:
#        only how many, and the CSV docs/marketing/promo/<batch id>-<time>.csv (git-ignored: never commit, paste or show them anywhere)
#   reward: --items "Follower Star Bandana,Paw-Print Pennant"  --coins 200  --treats "Pupcake:2,Blueberry Bites"   (at least one)
#   bash tools/promo.sh list                    every shared code, then every batch (its id), with its uses
#   bash tools/promo.sh stats <CODE|BATCH-ID>   one code or one batch (GIFT-20261116): uses, cap, coins given, first and last use
#   bash tools/promo.sh disable|enable <CODE|BATCH-ID>
# Dates are Japan days (the game's day): --from 2026-11-20 starts at 00:00 JST that day, --to 2026-12-31 ends at the end of that day (JST).
# Codes compare in upper case with spaces and dashes left out. Same Cloudflare D1 API as tools/shop_flag.sh: needs CLOUDFLARE_ACCOUNT_ID (the
# proxy adds the token in a Claude cloud session; elsewhere export CLOUDFLARE_API_TOKEN, D1: Edit). Arguments only travel as D1 query params,
# never inside the SQL text. DRY_RUN=1 prints the requests instead of sending them (no account or token needed; batch writes no CSV).
# Needs python3 and curl: run it from a Claude cloud session (the owner's Mac has no Python), like tools/shop_flag.sh.
# Tests only: PROMO_D1_API points it at a local D1 stand-in, PROMO_OUT at another folder for the CSV.
set -euo pipefail
cd "$(dirname "$0")/.."
DBNAME=pawhaven
usage() { sed -n '2,19p' "$0" | sed 's/^# \{0,1\}//' >&2; exit 2; }
[ $# -ge 1 ] || usage
case "$1" in create|batch|list|stats|disable|enable) ;; *) usage ;; esac

WORK=$(mktemp -d); trap 'rm -rf "$WORK"' EXIT
# the D1 request bodies, one JSON per line, built and validated by Python from argv; batch also writes its codes to $WORK/codes.txt
python3 - "$WORK" "$@" > "$WORK/bodies.jsonl" <<'PY'
import datetime, json, re, secrets, sys, time
work, a = sys.argv[1], sys.argv[2:]
cmd = a[0]
def die(m): print('promo: ' + m, file=sys.stderr); sys.exit(2)
ITEMS = json.load(open('tools/promo_items.json'))
COIN_MAX = int(ITEMS.get('max_coins', 500))
NAMES = {x['n']: x for x in ITEMS['items']}
TREATS = set(ITEMS['treats'])
ALPH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' # no 0 O 1 I L
def key(s): return re.sub(r'[\s\-_.]', '', s).upper()
def code_ok(s):
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9 -]{2,46}[A-Za-z0-9]', s or ''): die('a code is 4-40 letters and digits (dashes and spaces allowed between): ' + repr(s))
    k = key(s)
    if not re.fullmatch(r'[A-Z0-9]{4,40}', k): die('a code is 4-40 letters and digits once the dashes and spaces are left out: ' + repr(s))
    return k
def opts(rest, allowed):
    o = {}
    i = 0
    while i < len(rest):
        f = rest[i]
        if not f.startswith('--') or f[2:] not in allowed: die('unknown option ' + repr(f) + ' (allowed here: ' + ', '.join('--' + x for x in allowed) + ')')
        if i + 1 >= len(rest): die(f + ' needs a value')
        if f[2:] in o and f[2:] not in ('items', 'treats'): die(f + ' given twice')
        o[f[2:]] = (o[f[2:]] + ',' if f[2:] in o else '') + rest[i + 1]
        i += 2
    return o
JST = datetime.timezone(datetime.timedelta(hours=9))
def day(s, end):
    try: d = datetime.datetime.strptime(s, '%Y-%m-%d').replace(tzinfo=JST)
    except ValueError: die('a date is YYYY-MM-DD (a Japan day): ' + repr(s))
    if end: d += datetime.timedelta(days=1)
    return int(d.timestamp() * 1000)
def reward(o):
    items = [x.strip() for x in o.get('items', '').split(',') if x.strip()]
    for n in items:
        if n not in NAMES: die('unknown item ' + repr(n) + ': use a name from tools/promo_items.json (node tools/promo_items.js refreshes it)')
    if len(set(items)) != len(items): die('an item is listed twice')
    if len(items) > 6: die('6 items at most')
    coins = 0
    if 'coins' in o:
        if not re.fullmatch(r'\d{1,7}', o['coins']): die('--coins is a whole number')
        coins = int(o['coins'])
        if coins > COIN_MAX: die('--coins %d is over the ceiling: %d coins a code at most (walks stay the main income)' % (coins, COIN_MAX))
    treats = {}
    for t in [x.strip() for x in o.get('treats', '').split(',') if x.strip()]:
        n, _, q = t.partition(':'); n = n.strip(); q = q.strip() or '1'
        if n not in TREATS: die('unknown treat ' + repr(n) + ': a dog-safe food from tools/promo_items.json "treats"')
        if not re.fullmatch(r'\d{1,2}', q) or not 1 <= int(q) <= 10: die('a treat count is 1-10: ' + repr(t))
        if n in treats: die('a treat is listed twice: ' + n)
        treats[n] = int(q)
    if len(treats) > 6: die('6 kinds of treats at most')
    if not items and not coins and not treats: die('give a reward: --items, --coins and/or --treats')
    nonpromo = [n for n in items if not NAMES[n].get('promo')]
    if nonpromo: print('promo: note: not a code-only item (it is also sold in town): ' + ', '.join(nonpromo), file=sys.stderr)
    return json.dumps({'items': items, 'coins': coins, 'treats': treats}, ensure_ascii=False, separators=(',', ':'))
def window(o):
    f = day(o['from'], False) if 'from' in o else None
    t = day(o['to'], True) if 'to' in o else None
    if f is not None and t is not None and t <= f: die('--to is before --from')
    if t is not None and t <= time.time() * 1000: die('--to is in the past')
    return f, t
def note(o):
    n = o.get('note', '')
    if any(ord(c) < 32 for c in n) or len(n) > 200: die('the note is at most 200 characters, no control characters')
    return n or None
def out(sql, params=None): print(json.dumps({'sql': sql, 'params': params or []}, ensure_ascii=False))
INS = 'insert into promo_codes (code, shown, kind, batch, reward, starts_at, ends_at, cap, used, disabled, note, created_at) values '
now = int(time.time() * 1000)
if cmd == 'create':
    if len(a) < 2: die('create <CODE> [reward] [--from] [--to] [--cap] [--note]')
    k = code_ok(a[1]); o = opts(a[2:], ['items', 'coins', 'treats', 'from', 'to', 'cap', 'note'])
    cap = None
    if 'cap' in o:
        if not re.fullmatch(r'\d{1,7}', o['cap']) or int(o['cap']) < 1: die('--cap is a whole number, 1 or more')
        cap = int(o['cap'])
    f, t = window(o)
    out(INS + "(?1, ?2, 'shared', null, ?3, ?4, ?5, ?6, 0, 0, ?7, ?8)", [k, a[1].strip().upper(), reward(o), f, t, cap, note(o), now])
elif cmd == 'batch':
    if len(a) < 3: die('batch <PREFIX> <count> [reward] [--from] [--to] [--note]')
    p = a[1].strip().upper()
    if not re.fullmatch(r'[A-Z0-9]{2,12}', p): die('a batch PREFIX is 2-12 letters and digits')
    if not re.fullmatch(r'\d{1,4}', a[2]) or not 1 <= int(a[2]) <= 2000: die('count is 1-2000')
    n = int(a[2]); o = opts(a[3:], ['items', 'coins', 'treats', 'from', 'to', 'note'])
    rw = reward(o); f, t = window(o); nt = note(o)
    codes = set()
    while len(codes) < n: codes.add(p + '-' + ''.join(secrets.choice(ALPH) for _ in range(4)) + '-' + ''.join(secrets.choice(ALPH) for _ in range(4)))
    codes = sorted(codes)
    open(work + '/codes.txt', 'w').write('\n'.join(codes) + '\n')
    # the batch id: PREFIX and the Japan day it is made (a later batch of the same PREFIX is another batch: its players may use one code of it too)
    bid = p + '-' + datetime.datetime.now(JST).strftime('%Y%m%d')
    open(work + '/batch.txt', 'w').write(bid + '\n')
    out('select count(*) as n from promo_codes where batch = ?1', [bid]) # first: a batch id that exists already is refused
    # D1 takes at most 100 bound parameters a query: the shared values are ?1-?6, then two per code (40 codes a request)
    for i in range(0, n, 40):
        chunk = codes[i:i + 40]
        vals = ', '.join("(?%d, ?%d, 'unique', ?1, ?2, ?3, ?4, 1, 0, 0, ?5, ?6)" % (7 + 2 * j, 8 + 2 * j) for j in range(len(chunk)))
        params = [bid, rw, f, t, nt, now]
        for c in chunk: params += [key(c), c]
        out(INS + vals, params)
else:
    if cmd == 'list':
        if len(a) != 1: die('list takes nothing')
        out("select shown as code, used, cap, disabled, starts_at, ends_at, reward, note from promo_codes where kind = 'shared' order by created_at")
        out("select batch, count(*) as codes, sum(used) as used, max(disabled) as disabled, min(starts_at) as starts_at, max(ends_at) as ends_at, min(reward) as reward, min(note) as note from promo_codes where kind = 'unique' group by batch order by min(created_at)")
    else:
        if len(a) != 2: die(cmd + ' <CODE|BATCH-ID>')
        k = key(a[1])
        if not re.fullmatch(r'[A-Z0-9]{2,40}', k): die('say a code or a batch id (PREFIX-YYYYMMDD, see list)')
        m = re.fullmatch(r'([A-Z0-9]{2,12})[\s\-_.]?(\d{8})', a[1].strip().upper())
        b = m.group(1) + '-' + m.group(2) if m else a[1].strip().upper() # a batch id: GIFT-20261116 (gift 20261116 too)
        if cmd == 'stats':
            out('select count(*) as codes, sum(used) as used, sum(cap) as cap, max(disabled) as disabled, min(starts_at) as starts_at, max(ends_at) as ends_at, min(reward) as reward from promo_codes where code = ?1 or batch = ?2', [k, b])
            out("select count(*) as redeemed, coalesce(sum(json_extract(r.reward, '$.coins')), 0) as coins_given, min(r.at) as first_at, max(r.at) as last_at from promo_redemptions r where r.code = ?1 or r.batch = ?2", [k, b])
        else:
            out('update promo_codes set disabled = ?3 where code = ?1 or batch = ?2', [k, b, 1 if cmd == 'disable' else 0])
PY

if [ "${DRY_RUN:-}" = "1" ]; then
  cat "$WORK/bodies.jsonl"
  [ -f "$WORK/batch.txt" ] && echo "dry run: $(wc -l < "$WORK/codes.txt" | tr -d ' ') codes for batch $(cat "$WORK/batch.txt") (not made, no CSV)" >&2
  exit 0
fi

if [ -n "${PROMO_D1_API:-}" ]; then API="$PROMO_D1_API"; else
  : "${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID}"
  API="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID"
fi
AUTH=(); if [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && [ "$CLOUDFLARE_API_TOKEN" != "proxy-injected" ]; then AUTH=(-H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"); fi
DBID=$(curl -sS "$API/d1/database?name=$DBNAME" "${AUTH[@]}" | python3 -c "import json,sys; r=[d for d in json.load(sys.stdin)['result'] if d['name']=='$DBNAME']; print(r[0]['uuid'] if r else '')")
[ -n "$DBID" ] || { echo "promo: no D1 database $DBNAME" >&2; exit 1; }
q() { curl -sS -X POST "$API/d1/database/$DBID/query" "${AUTH[@]}" -H 'Content-Type: application/json' --data-binary @- <<<"$1"; }
# prints rows (times as JST dates), or the change count; exits 1 on a D1 error
show() {
  python3 -c '
import datetime, json, sys
d = json.load(sys.stdin)
if not d.get("success"): print("promo: D1 said no:", d.get("errors"), file=sys.stderr); sys.exit(1)
res = d["result"][0]; rows = res.get("results") or []; title = sys.argv[1]
if title == "-": print(res.get("meta", {}).get("changes", 0)); sys.exit(0)
if title == "#": print(list(rows[0].values())[0] if rows else 0); sys.exit(0)
print(title)
if not rows: print("  (none)")
J = datetime.timezone(datetime.timedelta(hours=9))
for r in rows:
    for k in ("starts_at", "ends_at", "first_at", "last_at"):
        if r.get(k): r[k] = datetime.datetime.fromtimestamp(r[k] / 1000, J).strftime("%Y-%m-%d %H:%M JST")
    print("  " + "  ".join("%s=%s" % (k, "" if v is None else v) for k, v in r.items()))
' "$1"
}
case "$1" in
  create)
    n=$(q "$(sed -n 1p "$WORK/bodies.jsonl")" | show -)
    echo "made $2 ($n row)" ;;
  batch)
    BID=$(cat "$WORK/batch.txt")
    have=$(q "$(sed -n 1p "$WORK/bodies.jsonl")" | show '#')
    [ "$have" = "0" ] || { echo "promo: batch $BID exists already ($have codes): one batch a PREFIX a day, so use another PREFIX (nothing made)" >&2; exit 2; }
    DIR="${PROMO_OUT:-docs/marketing/promo}"; OUT="$DIR/$BID-$(TZ=Asia/Tokyo date +%H%M%S).csv"
    mkdir -p "$DIR"; made=0; total=$(wc -l < "$WORK/codes.txt" | tr -d ' ')
    echo "code,batch,made_at" > "$OUT"
    while IFS= read -r B; do
      c=$(q "$B" | show -) || { echo "promo: stopped after $made of $total codes; those are in $OUT" >&2; exit 1; }
      sed -n "$((made + 1)),$((made + c))p" "$WORK/codes.txt" | sed "s/\$/,$BID,$(TZ=Asia/Tokyo date +%Y-%m-%d)/" >> "$OUT"
      made=$((made + c))
    done < <(tail -n +2 "$WORK/bodies.jsonl")
    # never the codes themselves: this output can end up in a chat transcript
    echo "made $made unique codes in batch $BID; they are in $OUT (git-ignored: keep it private, never paste it)" ;;
  list)
    q "$(sed -n 1p "$WORK/bodies.jsonl")" | show "shared codes:"
    q "$(sed -n 2p "$WORK/bodies.jsonl")" | show "batches (unique codes):" ;;
  stats)
    q "$(sed -n 1p "$WORK/bodies.jsonl")" | show "codes:"
    q "$(sed -n 2p "$WORK/bodies.jsonl")" | show "redemptions:" ;;
  disable|enable)
    n=$(q "$(sed -n 1p "$WORK/bodies.jsonl")" | show -)
    echo "${1}d $n code(s)"
    [ "$n" != "0" ] || echo "promo: no code or batch by that name (a batch id is PREFIX-YYYYMMDD: see list)" >&2 ;;
esac
