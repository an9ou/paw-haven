#!/usr/bin/env bash
# Merch part 9: copies the shared test token of the deployed merch test Worker "doodle-doggo-merch-test" into a local file, for the Game Manager,
# who deploys the password-protected test copy from another container (SANDBOX.md part F, G3). The token is never typed, printed or committed.
#
#   bash tools/merch_test_cfg_pull.sh <file>               DRY RUN (the default): prints the requests it would send; sends none, writes nothing
#   DRY_RUN=0 bash tools/merch_test_cfg_pull.sh <file>     the real read; writes {"token":"..."} to <file> (outside the repo, mode 600)
#
# It only READS: GET /accounts/<acc>/workers/scripts/doodle-doggo-merch-test/settings, whose result.bindings lists {type:"plain_text", name, text}.
# It takes the plain variable MERCH_TEST_TOKEN. It refuses and writes nothing when the variable is missing, is not plain text, or does not match
# ^[A-Za-z0-9_-]{32,128}$. It prints only "written: <file> (<n> characters)". The Cloudflare token: in a Claude cloud session the proxy adds it;
# anywhere else export CLOUDFLARE_API_TOKEN (only curl reads it). CLOUDFLARE_ACCOUNT_ID is optional (else the one visible account).
# MERCH_CFG_PULL_FAKE=<json file> (the offline test only) takes the API answer from that file instead of the network.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd)
NAME=doodle-doggo-merch-test
CF=https://api.cloudflare.com/client/v4
DRY=1; [ "${DRY_RUN:-1}" = "0" ] && DRY=0
FAKE=${MERCH_CFG_PULL_FAKE:-}
[ $# -eq 1 ] && [ -n "$1" ] || { echo "merch_test_cfg_pull: usage: merch_test_cfg_pull.sh <output file outside the repo>" >&2; exit 2; }
OUTF=$1
# the output must be outside the repo (the folder is resolved, so a symlink into the repo is caught too)
OD=$(dirname "$OUTF"); [ -d "$OD" ] || { echo "merch_test_cfg_pull: refused: the folder of the output file does not exist" >&2; exit 2; }
OFULL="$(cd "$OD" && pwd -P)/$(basename "$OUTF")"
RROOT=$(cd "$ROOT" && pwd -P)
case "$OFULL" in "$RROOT"/*|"$ROOT"/*) echo "merch_test_cfg_pull: refused: the output file must be outside the repo" >&2; exit 2 ;; esac
[ ! -d "$OFULL" ] || { echo "merch_test_cfg_pull: refused: the output path is a folder" >&2; exit 2; }
AUTH=(); if [ "${CLOUDFLARE_API_TOKEN:-proxy-injected}" != "proxy-injected" ]; then AUTH=(--variable %CLOUDFLARE_API_TOKEN --expand-header 'Authorization: Bearer {{CLOUDFLARE_API_TOKEN}}'); fi
js() { node -e "$1" "${@:2}"; }
cf() { curl -sS --max-time 60 -X "$1" "$CF$2" "${AUTH[@]+"${AUTH[@]}"}"; } # GET only
res() { js "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s||'{}');const r=j.result;console.log(eval(process.argv[1]))})" "$1"; }

if [ -n "$FAKE" ]; then
  if [ "$DRY" = "1" ]; then echo "DRY_RUN: (fake answer from a local file) would read the settings of $NAME and write $OFULL; nothing written" >&2; exit 0; fi
  ANSWER=$(cat "$FAKE")
elif [ "$DRY" = "1" ]; then
  echo "DRY_RUN: GET $CF/accounts   (only when CLOUDFLARE_ACCOUNT_ID is not set; refused if more than one account is visible)" >&2
  echo "DRY_RUN: GET $CF/accounts/<account_id>/workers/scripts/$NAME/settings   (read the plain variable MERCH_TEST_TOKEN) -> write $OFULL (mode 600)" >&2
  echo "DRY RUN done: nothing was sent, nothing written. A real read: DRY_RUN=0 bash tools/merch_test_cfg_pull.sh <file>" >&2; exit 0
else
  if [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
    ACCS=$(cf GET /accounts); N=$(echo "$ACCS" | res '(r||[]).length')
    [ "$N" = "1" ] || { echo "merch_test_cfg_pull: $N Cloudflare accounts are visible: set CLOUDFLARE_ACCOUNT_ID (nothing written)" >&2; exit 1; }
    ACC=$(echo "$ACCS" | res 'r[0].id')
  else ACC=$CLOUDFLARE_ACCOUNT_ID; fi
  ANSWER=$(cf GET "/accounts/$ACC/workers/scripts/$NAME/settings")
fi
# pick the variable, check it, write the file (mode 600 from the start); the answer comes on stdin, never in an argument, and the token is never printed
umask 077
printf '%s' "$ANSWER" | node -e '
const fs=require("fs");let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  const fail=m=>{console.error("merch_test_cfg_pull: refused: "+m+" (nothing written)");process.exit(1)};
  let j;try{j=JSON.parse(s)}catch(e){fail("the answer is not JSON")}
  if(!j||j.success!==true)fail("the API did not say success");
  const b=j.result&&j.result.bindings;if(!Array.isArray(b))fail("no bindings list in the answer");
  const m=b.filter(x=>x&&x.name==="MERCH_TEST_TOKEN");
  if(m.length!==1)fail("MERCH_TEST_TOKEN is "+(m.length?"listed more than once":"missing"));
  if(m[0].type!=="plain_text")fail("MERCH_TEST_TOKEN is not a plain text variable (type "+String(m[0].type).replace(/[^\w]/g,"").slice(0,20)+")");
  const t=m[0].text;if(typeof t!=="string"||!/^[A-Za-z0-9_-]{32,128}$/.test(t))fail("MERCH_TEST_TOKEN does not have the expected shape");
  const f=process.argv[1];
  fs.writeFileSync(f,JSON.stringify({token:t}),{mode:0o600});fs.chmodSync(f,0o600);
  console.log("written: "+f+" ("+t.length+" characters)");
});' "$OFULL"
