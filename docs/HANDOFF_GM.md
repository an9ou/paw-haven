# Game Manager handoff (1 Nov 2026)

Previous Game Manager: session_01D6KLY6MoiRhP5ZXAV2ww5M (archive it once you are running). Marketing: session_01D6KLY45Jihk1dVrpVPDeSv (new 31 Oct, tag team:marketing, branch marketing/launch); brief it on every release.

1. Live: v2.18.4 "Winter Market" on main (site, itch #2256996, GitHub). The owner's official launch was 1 Nov 00:00 JST, and Marketing has the go-ahead. The Winter Market opens in game 1-26 Dec. Its design and the decisions are in docs/design/winter-market.md.
2. **New owner rule (31 Oct, in CLAUDE.md):** special and festival updates never go live without the owner's explicit go-ahead and launch date, and the 5-minute rule does not apply to them. I released v2.18.4 early without asking, and the owner was unhappy about it. Ask first.
3. **Now: v2.19 "Friends first".** Claude designs and Cursor codes:
   - Design contract: V219.md. Rules for coding agents: AGENTS.md.
   - GitHub issues: #3 is the overview. The parts are #4 Worker/D1, #5 Friends sheet, #6 visits, #7 gifts, #8 walk together and #9 invite page and privacy.
   - Owner's choices: async walk, a read-only yard snapshot, preset words only, issues one per part.
   - Part 0 art (PA.FRIENDS in world/pawart_world_b.js) is on main; the art coordinates are in a comment on #5.
   - Your job: when the owner gives a PR number, review it against V219.md, AGENTS.md and CLAUDE.md, and run its suites one at a time. Post the review on the PR (with the attribution footer) as approve or a list of fixes. The owner merges.
   - After all parts are merged: translate fr.* and the site strings in one batch, write the NEWS entry, run the reviews (code, phone, art), deploy the Worker (bash tools/cf_api_deploy.sh) and the site, then release on the owner's date.
4. Release recipe:
   - Merge to the dev branch claude/webgame-cloudflare-updates-1jo46d and push HEAD:main.
   - Set `export NODE_PATH=<minify node_modules>:$(npm root -g)`. esbuild 0.24.0 is not installed globally: `npm install esbuild@0.24.0` into a scratch folder and use its node_modules.
   - Run `node tools/itch.js`, then `SITE_GAME=$PWD/dist/itch node game/run_tests.js site`, then `bash tools/cf_pages_deploy.sh`, then `bash tools/itch_push.sh <ver>` (needs the same NODE_PATH).
   - Add a NEWS entry (49c_news.js) and brief Marketing.
5. Tests: one suite at a time (4-core box). Owner rules are in CLAUDE.md: the 5-minute rule except for special updates, token savers, auto handoff at ~150k.
6. Still open, waiting on the owner:
   - The rest of the growth plan (doc https://claude.ai/artifact/6CfP7zLRodZ5Y44rJ6REeL): paid looks with Sparkle free, app-only rewarded ads, hero cast names.
   - The New Year Market set (27 Dec-7 Jan): later, and it needs the owner's date.
   - Retention recheck around 5 Nov (dashboard https://claude.ai/artifact/7isHciXJMvmfFX1BUTzCQV).
7. Winter Market leftovers (not blocking): with two big dogs at the market the second may cover a board; on desktop, dogs can still cover the back boards (the roaming fix is phone-only); a "new letters" toast can sit over a stall sheet.
8. The usage-limit watchdog: make your own scheduled task when work runs overnight, and disable it when idle.
9. The owner's Cursor/Grok edits land on main, either as PRs or directly. Merge main before every release.

## Cursor loop (owner approved 1 Nov 2026; replaces the owner passing PR numbers along)
- **Scheduled task** `trig_015HgYaCKCK77kFPVbC11evy` "v2.19 Cursor PR check" runs every 3 hours into the Game Manager session. A new Game Manager re-points it (update_trigger can't move it, so make a new one and delete the old one) and re-subscribes to the open PRs.
- **New `cursor/v219-*` PR:**
  1. `subscribe_pr_activity`.
  2. Check out the branch in a worktree.
  3. Diff it against `main` and check it against V219.md, AGENTS.md and the CLAUDE.md rules.
  4. Run the issue's suites one at a time (`NODE_PATH=$(npm root -g)`; Miniflare and Playwright are global). To wait for another suite, match only node: `until ! pgrep -f "^node .*run_tests.js" >/dev/null; do sleep 20; done` (a bare `pgrep -f run_tests.js` matches the waiting shell itself and never ends). The `site` suite needs `dist/itch`: `node game/build.js publish && node tools/itch.js` with esbuild 0.24.0 on NODE_PATH.
  5. Look at its screenshots.
- **Review:** `pull_request_review_write`, always as COMMENT (the PRs come from the owner's own account, so APPROVE and REQUEST_CHANGES fail). It opens with "**Verdict: approve**" or "**Verdict: fixes needed**", then a numbered list. With fixes, the last line is "@cursor please fix items 1–N above on this branch, re-run the issue's suites one at a time, and reply with the summaries." Then the attribution footer.
- **New commits** on a subscribed PR: re-review.
- **Merged:** unsubscribe, then update the progress table in `docs/briefs/V219_CURSOR_PROMPTS.md`. Start the next part by commenting on its issue: "@cursor" + the shared header + that part's prompt from that file. Order: #5 and #9 after #4; then #6, #7 and #8 one at a time, each after the one before is merged.
- **Game Admin** is the owner's Grok bot working through Cursor, under the owner's GitHub account (owner, 1 Nov). Talk with it on the PRs and issues. Its comments are signed "Game Admin". It can't approve anything that is the owner's call (merges, the release date).
- The owner still merges every PR and sets the release date (special update). When #4–#9 are all merged: tell the owner once, disable the scheduled task and start part 7.
