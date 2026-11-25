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
#   tools/merch.sh gift add < codes.txt                    add thank-you gift codes (part 6): read from STDIN only, one per line, never
#                                                          printed; keep the file OUTSIDE the repo. The answer is counts only. A CSV (as
#                                                          tools/promo.sh writes it: code,batch,made_at) works too: the first column, the
#                                                          header line skipped
#   tools/merch.sh gift count                              how many codes are left and how many were given
#   tools/merch.sh render-test <tee|mug> [browser|resvg] [direct|worker]   part 4: the render health check (before launch, after each art
#                                                          change): one sample dog of the current art through the real render, no order;
#                                                          JSON with renderer, bytes, sha-256, size, browser ms, a 15-minute file link.
#                                                          11 s apart; counts toward the day's browser budget
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

# gift add: the codes go to curl on STDIN and the key through a file descriptor, so neither is ever in the process list or printed
gift_send() {
  local body="$1" n="$2"
  if [ "$DRY" != "0" ]; then
    echo "DRY RUN (set DRY_RUN=0 to send): POST $API/merch/admin/gift"
    echo "  body: {\"codes\": [$n codes, not shown]}"
    echo "  header: Authorization: Bearer \$MERCH_ADMIN_KEY ($([ -n "${MERCH_ADMIN_KEY:-}" ] && echo set || echo NOT set))"
    return 0
  fi
  [ -n "${MERCH_ADMIN_KEY:-}" ] || { echo "merch.sh: MERCH_ADMIN_KEY is not set in the environment" >&2; exit 2; }
  printf '%s' "$body" | curl -sS --fail-with-body -X POST -H @<(printf 'Authorization: Bearer %s\n' "$MERCH_ADMIN_KEY") -H 'Content-Type: application/json' --data-binary @- "$API/merch/admin/gift"
  echo
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
  gift)
    sub="${1:-}"; shift || true
    case "$sub" in
      count) send GET gift ;;
      add)
        [ $# -eq 0 ] || { echo "merch.sh: gift add reads the codes from STDIN, one per line, never as arguments: tools/merch.sh gift add < codes.txt" >&2; exit 2; }
        [ -t 0 ] && echo "Paste the codes, one per line, then press Ctrl-D:" >&2
        # one awk pass (no process per line: thousands of codes take a moment): a CSV line's first column without quotes, trimmed, upper case;
        # the header line (code,...) skipped; kept once each; the counts on the last line. The codes stay in this variable, never printed.
        list="$(awk 'BEGIN { n = 0; bad = 0; again = 0 }
          { l = $0; gsub(/\r/, "", l); sub(/,.*/, "", l); gsub(/"/, "", l); gsub(/^[[:space:]]+|[[:space:]]+$/, "", l); l = toupper(l)
            if (l == "") next
            if (NR == 1 && l == "CODE") next
            if (l !~ /^[A-Z0-9][A-Z0-9-]+$/ || length(l) < 4 || length(l) > 40) { bad++; next }
            if (l in seen) { again++; next }
            seen[l] = 1; n++; print l }
          END { print "#counts " n " " bad " " again }')"
        set -- $(printf '%s\n' "$list" | sed -n 's/^#counts //p'); n="${1:-0}"; bad="${2:-0}"; again="${3:-0}"
        list="$(printf '%s\n' "$list" | sed '/^#counts /d')"
        [ "$n" -gt 0 ] || { echo "merch.sh: no codes on STDIN (one per line)" >&2; exit 2; }
        sk="$bad line"; [ "$bad" -eq 1 ] || sk="$bad lines"
        echo "$n codes to send ($sk skipped: not a code; $again repeated)"
        # 1000 codes a request (the Worker takes up to 2000 and 64 KB)
        body=""; k=0
        while IFS= read -r c; do
          [ -z "$c" ] && continue
          body="$body${body:+,}\"$c\""; k=$((k + 1))
          if [ "$k" -ge 1000 ]; then gift_send "{\"codes\": [$body]}" "$k"; body=""; k=0; fi
        done <<EOF2
$list
EOF2
        if [ "$k" -gt 0 ]; then gift_send "{\"codes\": [$body]}" "$k"; fi   # (review finding 14: with &&, a multiple of 1000 codes exited 1)
        ;;
      *) echo "merch.sh: gift add | gift count (tools/merch.sh help)" >&2; exit 2 ;;
    esac ;;
  render-test)
    need "${1:-}" "product (tee or mug)"; [[ "$1" =~ ^(tee|mug)$ ]] || { echo "merch.sh: render-test tee|mug [browser|resvg] [direct|worker]" >&2; exit 2; }
    r="${2:-browser}"; [[ "$r" =~ ^(browser|resvg)$ ]] || { echo "merch.sh: the renderer is browser or resvg" >&2; exit 2; }
    v=""; if [ -n "${3:-}" ]; then [[ "$3" =~ ^(direct|worker)$ ]] || { echo "merch.sh: the path is direct or worker" >&2; exit 2; }; v=", \"via\": \"$3\""; fi
    send POST render-test "{\"product\": \"$1\", \"renderer\": \"$r\"$v}" ;;
  report) send GET report ;;
  tick) send POST tick "{}" ;;
  nightly) send POST nightly "{}" ;;
  help|-h|--help) sed -n '2,29p' "$0" | sed 's/^# \{0,1\}//' ;;
  *) echo "merch.sh: unknown command $cmd (tools/merch.sh help)" >&2; exit 2 ;;
esac
