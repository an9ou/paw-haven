#!/usr/bin/env bash
# Live smoke test of the deployed Worker: guest, save PUT and GET, register (guest becomes the account), log out, log in, CORS.
#   bash tools/cf_api_smoke.sh [api url]
# Makes one throwaway account (pawhaven-smoke-<time>@example.com) and deletes nothing: the account is harmless.
set -euo pipefail
API=${1:-https://pawhaven-api.ansonyuen0108.workers.dev}
EM="pawhaven-smoke-$(date +%s)@example.com"; PW="smoke-$(date +%s)-pw"
j() { python3 -c "import json,sys; d=json.load(sys.stdin); print(eval(sys.argv[1]))" "$1"; }
call() { local m=$1 p=$2 b=${3:-} t=${4:-}; local a=(-sS -X "$m" "$API$p" -H 'Origin: https://doodledoggo.app'); [ -n "$t" ] && a+=(-H "Authorization: Bearer $t"); [ -n "$b" ] && a+=(-H 'Content-Type: application/json' -d "$b"); curl "${a[@]}"; }
fail=0; check() { if [ "$1" = "$2" ]; then echo "ok   $3"; else echo "FAIL $3 (got '$1', want '$2')"; fail=1; fi; }

G=$(call POST /guest '{}'); GT=$(echo "$G" | j "d['token']"); GID=$(echo "$G" | j "d['user']['id']")
check "$(echo "$G" | j "d['user']['guest']")" True "guest made"
check "$(call PUT /save "{\"data\":{\"v\":1,\"coins\":11,\"dogs\":[{\"id\":\"smoke\",\"name\":\"Smoke\"}]},\"rev\":1,\"changed_at\":\"$(date -u +%FT%TZ)\",\"device\":\"smoke\"}" "$GT" | j "d.get('rev')")" 1 "guest save PUT rev 1"
check "$(call GET /save '' "$GT" | j "d['save']['data']['coins']")" 11 "guest save GET"
R=$(call POST /register "{\"email\":\"$EM\",\"password\":\"$PW\"}" "$GT"); AT=$(echo "$R" | j "d['token']")
check "$(echo "$R" | j "d['upgraded'] and d['user']['id']")" "$GID" "register: the guest became the account (same id)"
check "$(call GET /me '' "$AT" | j "d['user']['email']")" "$EM" "GET /me has the email"
check "$(call POST /logout '{}' "$AT" | j "d['ok']")" True "log out"
check "$(curl -sS -o /dev/null -w '%{http_code}' "$API/me" -H "Authorization: Bearer $AT")" 401 "the old token is gone"
check "$(call POST /login "{\"email\":\"$EM\",\"password\":\"wrong-password\"}" | j "d.get('error')")" invalid_credentials "wrong password refused"
L=$(call POST /login "{\"email\":\"$EM\",\"password\":\"$PW\"}"); LT=$(echo "$L" | j "d['token']")
check "$(echo "$L" | j "d['user']['id']")" "$GID" "log in: same account"
check "$(call PUT /save "{\"data\":{\"v\":1,\"coins\":22,\"dogs\":[{\"id\":\"smoke\",\"name\":\"Smoke\"}]},\"rev\":2,\"changed_at\":\"$(date -u +%FT%TZ)\",\"device\":\"smoke\"}" "$LT" | j "d.get('rev')")" 2 "account save PUT rev 2"
check "$(call GET /save '' "$LT" | j "d['save']['data']['coins']")" 22 "account save GET"
check "$(curl -sS -o /dev/null -w '%{http_code}' -X PUT "$API/save" -H "Authorization: Bearer $LT" -H 'Content-Type: application/json' -d '{"data":{"v":1},"rev":2,"changed_at":"2026-01-01T00:00:00Z"}')" 409 "a stale rev is refused"
check "$(curl -sS -D - -o /dev/null -X OPTIONS "$API/save" -H 'Origin: https://doodledoggo.app' -H 'Access-Control-Request-Method: PUT' | tr -d '\r' | sed -n 's/^access-control-allow-origin: //Ip')" https://doodledoggo.app "CORS: doodledoggo.app"
check "$(curl -sS -D - -o /dev/null -X OPTIONS "$API/save" -H 'Origin: https://html-classic.itch.zone' -H 'Access-Control-Request-Method: PUT' | tr -d '\r' | sed -n 's/^access-control-allow-origin: //Ip')" https://html-classic.itch.zone "CORS: itch.io frame"
check "$(curl -sS -o /dev/null -w '%{http_code}' -X OPTIONS "$API/save" -H 'Origin: https://evil.example')" 403 "CORS: other origins refused"
call POST /logout '{}' "$LT" >/dev/null
check "$(call POST /register "{\"email\":\"$EM\",\"password\":\"another-pass-1\"}" | j "d.get('error')")" email_exists "one email, one account"
check "$(call POST /forgot "{\"email\":\"nobody-$(date +%s)@example.com\"}" | j "d.get('ok')")" True "forgot password: the same answer for an unknown email"
check "$(call POST /reset '{"token":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx","password":"whatever-1"}' | j "d.get('error')")" expired "a made-up reset link is refused"
[ $fail = 0 ] && echo "LIVE SMOKE OK ($EM)" || { echo "LIVE SMOKE FAILED"; exit 1; }
