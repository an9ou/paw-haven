#!/usr/bin/env bash
# The owner's merch console (docs/design/merch/TRANSACTIONS.md 6.1, 6.3; PART3.md): there is no SQL console for a Durable Object.
# It calls the merch Worker's admin routes. By default it only PRINTS what it would do (DRY_RUN=1); DRY_RUN=0 sends.
# The key comes from the environment only (MERCH_ADMIN_KEY), never from a file or an argument, and is never printed.
#
#   tools/merch.sh list [status] [hold]                    orders (newest first)
#   tools/merch.sh show <order>                            one order: lines, parcels, refunds, events, signed print links (7 days)
#   tools/merch.sh refund <order> <line> [qty] <reason>    refund a line (or qty of it): Stripe partial refund, the buyer is emailed
#                                                          (the reason is words: "refund mo_x 2 1" with no reason is refused)
#   tools/merch.sh reprint <order> <line,line> [printful order]   reprint lines (or attach Printful's own claim reship)
#   tools/merch.sh confirm <order>                         release a held order (review, cost, a won dispute): the flow goes on
#   tools/merch.sh lost <order> <parcel> [reprint|refund]  mark a parcel lost, then reprint or refund its lines
#   tools/merch.sh flag <e:hash|ip:hash|email:addr|ipaddr:ip> <block|allow|clear> [note]
#   tools/merch.sh export [from] [to]                      JSON lines, no buyer data -> merch-export-<from>-<to>.jsonl (keep one a month)
#   tools/merch.sh forget <order|email:address>            deletion on request: clears the email hash, the dog's name and recipe, the
#                                                          print files and tracking links of ended orders; the money rows stay (the law)
#   tools/merch.sh report                                  the nightly report (held orders, refunds, disputes, sales per country, storage)
#   tools/merch.sh tick | nightly                          wake the ledger / run the nightly job now
#
# Env: MERCH_API (default https://merch-api.doodledoggo.app; the test Worker: set it to its address), MERCH_ADMIN_KEY, DRY_RUN (default 1).
set -euo pipefail
API="${MERCH_API:-https://merch-api.doodledoggo.app}"
DRY="${DRY_RUN:-1}"
cmd="${1:-help}"; shift || true

esc() { local s="${1//\\/\\\\}"; s="${s//\"/\\\"}"; printf '%s' "$s"; }   # a JSON string body, without jq
need() { [ -n "${1:-}" ] || { echo "merch.sh: missing $2 (see tools/merch.sh help)" >&2; exit 2; }; }
order_ok() { [[ "$1" =~ ^mo_[A-Za-z0-9_-]{22}$ ]] || { echo "merch.sh: not an order id: $1" >&2; exit 2; }; }

# send METHOD PATH [JSON] [OUTFILE]
send() {
  local m="$1" p="$2" body="${3:-}" out="${4:-}"
  if [ "$DRY" != "0" ]; then
    echo "DRY RUN (set DRY_RUN=0 to send): $m $API/merch/admin/$p"
    [ -n "$body" ] && echo "  body: $body"
    [ -n "$out" ] && echo "  saved to: $out"
    echo "  header: Authorization: Bearer \$MERCH_ADMIN_KEY ($([ -n "${MERCH_ADMIN_KEY:-}" ] && echo set || echo NOT set))"
    return 0
  fi
  [ -n "${MERCH_ADMIN_KEY:-}" ] || { echo "merch.sh: MERCH_ADMIN_KEY is not set in the environment" >&2; exit 2; }
  local args=(-sS --fail-with-body -X "$m" -H @- "$API/merch/admin/$p")
  [ -n "$body" ] && args+=(-H 'Content-Type: application/json' --data-binary "$body")
  [ -n "$out" ] && args+=(-o "$out")
  # the key goes in on stdin (-H @-), so it never shows in the process list
  printf 'Authorization: Bearer %s\n' "$MERCH_ADMIN_KEY" | curl "${args[@]}"
  [ -n "$out" ] && echo "saved $out" || echo
}

case "$cmd" in
  list) q=""; [ -n "${1:-}" ] && q="status=$1"; [ -n "${2:-}" ] && q="$q&hold=$2"; send GET "orders${q:+?$q}" ;;
  show) need "${1:-}" order; order_ok "$1"; send GET "order/$1" ;;
  refund)
    need "${1:-}" order; need "${2:-}" line; order_ok "$1"
    if [ $# -ge 4 ]; then qty="$3"; reason="$4"; else qty=""; reason="${3:-}"; fi
    need "$reason" reason
    [[ "$reason" =~ [A-Za-z] ]] || { echo "merch.sh: the reason must be words (did you forget it after the quantity? refund <order> <line> [qty] <reason>)" >&2; exit 2; }; [[ "$2" =~ ^[0-9]{1,3}$ ]] || { echo "merch.sh: line must be a number" >&2; exit 2; }
    [ -z "$qty" ] || [[ "$qty" =~ ^[1-3]$ ]] || { echo "merch.sh: qty is 1-3" >&2; exit 2; }
    send POST "order/$1/refund" "{\"line\": $2${qty:+, \"qty\": $qty}, \"reason\": \"$(esc "$reason")\"}" ;;
  reprint)
    need "${1:-}" order; need "${2:-}" lines; order_ok "$1"; [[ "$2" =~ ^[0-9]{1,3}(,[0-9]{1,3})*$ ]] || { echo "merch.sh: lines like 1,2" >&2; exit 2; }
    po=""; [ -n "${3:-}" ] && po=", \"provider_order\": \"$(esc "$3")\""
    send POST "order/$1/reprint" "{\"lines\": [$2]$po}" ;;
  confirm) need "${1:-}" order; order_ok "$1"; send POST "order/$1/confirm" "{}" ;;
  lost)
    need "${1:-}" order; need "${2:-}" parcel; order_ok "$1"; then=""; [ -n "${3:-}" ] && then=", \"then\": \"$(esc "$3")\""
    send POST "order/$1/lost" "{\"parcel\": \"$(esc "$2")\"$then}" ;;
  flag) need "${1:-}" key; need "${2:-}" mode; send POST flag "{\"key\": \"$(esc "$1")\", \"mode\": \"$(esc "$2")\", \"note\": \"$(esc "${3:-}")\"}" ;;
  export) from="${1:-$(date -u -v-1m +%Y-%m-01 2>/dev/null || date -u -d '1 month ago' +%Y-%m-01)}"; to="${2:-$(date -u +%Y-%m-01)}"
    send GET "export?from=$from&to=$to" "" "merch-export-$from-$to.jsonl" ;;
  forget)
    need "${1:-}" "order or email:address"
    if [[ "$1" =~ ^email:[^@[:space:]]+@[^@[:space:]]+$ ]]; then send POST forget "{\"email\": \"$(esc "${1#email:}")\"}"
    else order_ok "$1"; send POST forget "{\"order\": \"$1\"}"; fi ;;
  report) send GET report ;;
  tick) send POST tick "{}" ;;
  nightly) send POST nightly "{}" ;;
  help|-h|--help) sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//' ;;
  *) echo "merch.sh: unknown command $cmd (tools/merch.sh help)" >&2; exit 2 ;;
esac
