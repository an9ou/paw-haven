#!/usr/bin/env bash
# Offline test of tools/merch_test_cfg_pull.sh: every answer comes from a local file (MERCH_CFG_PULL_FAKE); no network.
# Run: bash tools/merch_test_cfg_pull.test.sh
set -uo pipefail
cd "$(dirname "$0")/.."; ROOT=$(pwd)
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
S=tools/merch_test_cfg_pull.sh; pass=0; fail=0
ck() { if [ "$2" = "1" ]; then echo "ok   $1"; pass=$((pass+1)); else echo "FAIL $1"; fail=1; fi; }
TOK=abcDEF0123_-abcDEF0123_-abcDEF0123_-abcDEF0123_-   # 48 characters
mk() { printf '{"success":true,"result":{"bindings":[%s]}}' "$1" > "$T/$2.json"; }
mk "{\"type\":\"plain_text\",\"name\":\"MERCH_TEST\",\"text\":\"1\"},{\"type\":\"plain_text\",\"name\":\"MERCH_TEST_TOKEN\",\"text\":\"$TOK\"}" good
mk '{"type":"plain_text","name":"MERCH_TEST","text":"1"}' missing
mk '{"type":"secret_text","name":"MERCH_TEST_TOKEN"}' secret
mk '{"type":"plain_text","name":"MERCH_TEST_TOKEN","text":"short one!"}' bad
run() { MERCH_CFG_PULL_FAKE="$T/$1.json" DRY_RUN=${DRY:-0} bash $S "$2" 2>&1; }

OUT=$(run good "$T/out.json"); rc=$?
ck "good token: exit 0" $([ $rc = 0 ] && echo 1 || echo 0)
ck "good token: file holds {token}" $([ "$(cat "$T/out.json")" = "{\"token\":\"$TOK\"}" ] && echo 1 || echo 0)
ck "good token: mode 600" $([ "$(stat -c %a "$T/out.json" 2>/dev/null || stat -f %Lp "$T/out.json")" = 600 ] && echo 1 || echo 0)
ck "good token: not printed except in the file" $(case "$OUT" in *"$TOK"*) echo 0;; *) echo 1;; esac)
ck "good token: prints only the written line" $([ "$OUT" = "written: $T/out.json (48 characters)" ] && echo 1 || echo 0)
for c in missing secret bad; do
  rm -f "$T/o_$c.json"; OUT=$(run $c "$T/o_$c.json"); rc=$?
  ck "$c: refused with exit 1" $([ $rc = 1 ] && echo 1 || echo 0)
  ck "$c: nothing written" $([ ! -e "$T/o_$c.json" ] && echo 1 || echo 0)
done
mkdir -p "$ROOT/.cfgpull_tmp"; OUT=$(run good "$ROOT/.cfgpull_tmp/x.json"); rc=$?
ck "a path inside the repo: refused, nothing written" $([ $rc = 2 ] && [ ! -e "$ROOT/.cfgpull_tmp/x.json" ] && echo 1 || echo 0); rm -rf "$ROOT/.cfgpull_tmp"
ln -s "$ROOT" "$T/link"; OUT=$(run good "$T/link/x.json"); rc=$?
ck "a symlink into the repo: refused" $([ $rc = 2 ] && [ ! -e "$ROOT/x.json" ] && echo 1 || echo 0)
OUT=$(DRY=1 run good "$T/dry.json"); rc=$?
ck "DRY_RUN=1 with the fake answer: exit 0, nothing written" $([ $rc = 0 ] && [ ! -e "$T/dry.json" ] && echo 1 || echo 0)
OUT=$(HTTPS_PROXY=http://127.0.0.1:9 DRY_RUN=1 bash $S "$T/dry2.json" 2>&1); rc=$?
ck "default dry run: prints the GET, sends nothing, writes nothing" $([ $rc = 0 ] && [ ! -e "$T/dry2.json" ] && case "$OUT" in *"DRY_RUN: GET"*) true;; *) false;; esac && echo 1 || echo 0)
ck "the script has no PUT/POST/DELETE" $(grep -Eq 'cf (PUT|POST|DELETE)|-X (PUT|POST|DELETE)' $S && echo 0 || echo 1)
echo "$pass checks passed"; [ $fail = 0 ] && echo ALL OK || { echo FAILED; exit 1; }
