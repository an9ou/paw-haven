#!/usr/bin/env bash
# Paw Haven worktree helper (coordinator only).
#   tools/wt.sh new <name>     -> /home/claude/wt/<name> on branch lane/<name>, from main
#   tools/wt.sh merge <name>   -> commit leftovers on lane/<name>, merge into main (--no-ff), build, smoke test
#   tools/wt.sh drop <name>    -> remove the worktree + branch (after merge)
#   tools/wt.sh list
set -euo pipefail
REPO=/home/claude/proto; WT=/home/claude/wt; G="git -C $REPO -c user.email=claude@local -c user.name=coordinator"
cmd=${1:-list}; name=${2:-}
case "$cmd" in
  new)  $G worktree add -q "$WT/$name" -b "lane/$name" main; echo "worktree: $WT/$name  (branch lane/$name)";;
  merge)
        git -C "$WT/$name" add -A
        git -C "$WT/$name" -c user.email=claude@local -c user.name="$name" commit -qm "lane $name: work" || true
        $G merge --no-ff -q -m "merge lane/$name" "lane/$name" || { echo "MERGE CONFLICT in lane/$name: resolve in $REPO"; exit 1; }
        (cd $REPO && node game/build.js >/dev/null && NODE_PATH=$(npm root -g) node game/run_tests.js smoke --no-build | tail -3);;
  drop) $G worktree remove --force "$WT/$name"; $G branch -D "lane/$name" >/dev/null; echo "dropped $name";;
  list) $G worktree list;;
esac
