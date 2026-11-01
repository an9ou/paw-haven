# Game Manager handoff (1 Nov 2026, 19:45 UTC)

Previous Game Manager: session_01D6KLY3EuQ2ya1GqT7VBhht (handed over at ~160k context under the 150k rule; archiving it was blocked by the permission classifier, so leave it if that happens again). Marketing: session_01D6KLY45Jihk1dVrpVPDeSv (tag team:marketing): brief it on v2.19 only once the owner has set the date.

**v2.19 now: parts 1-6 are ALL merged into main** (#10, #12, #14 visits, #15 gifts, #16 walk together, #11 invite page). The owner moved coding back to Claude on 1 Nov (parts 3-5 were Claude subagents; Cursor's PR #13 was closed unmerged). The owner also said the Game Manager merges approved PRs itself. The 3-hourly check (trig_01HLcVE97q5Tc9cTEsk8vLyv) is disabled; the owner has been told parts 1-6 are done.

**Part 7 status (1 Nov, ~20:30 UTC, session_01D6KLY6U5zWqqoFW5nxYnVZ):**
- Done on the dev branch (NOT on `main`: the permission classifier blocks `git push HEAD:main` as a production deploy, since main deploys GitHub Pages; that is fine under the special-update rule: main gets v2.19 with the owner's go-ahead):
  - All 106 new game keys (fr.*, data.fr_notes.* (the 12 notes are now the TABLES.txt table FR_NOTES, read with tdata), nw.v219.*) and the 14 site keys in all 11 languages; `privacy.short` re-translated (part 6 had changed the English); the invite page's itch.io line is now "Friends → Add a friend" (desktop has no More menu). CJK/Thai font subsets (game + site) and packed.js regenerated (fontTools was pip-installed in the container).
  - NEWS: `NEWS_V219` in 49c_news.js; 50_friends.js does `if (FR_LIVE) NEWS.unshift(NEWS_V219)`, so the news never announces Friends early. Its `date` is 2026-11-01: set it to the launch date at release. Test hook `__paw.fr.news()`.
  - CHANGELOG row, README, CLAUDE.md version line, docs/FILES.md Friends line.
  - Suites green on 1fd16d5: i18n, v219_friends (237), v2182_news, site (466; with SITE_GAME=dist/itch, esbuild 0.24.0 in the scratchpad `minify/node_modules`).
- After the owner's go-ahead and date only: `FR_LIVE = true` in `game/src/50_friends.js`, the NEWS_V219 date, deploy the Worker (`bash tools/cf_api_deploy.sh`) before the site and game, push HEAD:main, the release recipe below (site, itch.io), then brief Marketing.
- Reviews: code review `docs/reviews/V219_review_code.md` (2 must-fix: stale identity after logout + stray guest; gifts/walks backlog starving pets/notes in the inbox) and phone review `docs/reviews/V219_review_phone.md` (5 must-fix: row "..." redraws the sheet, textLength stretching wheel/card words, no pan on phone visits, focus box on the friend dog, empty postcard photo on note/pet/walk letters). Next: the art review (top model, paw-reviewer; PA.FRIENDS art, the visit, letters, the guest ribbon, the news icons), then ONE fix batch for all must-fixes plus the cheap nice-to-haves (any new English gets translated in that batch, 11 languages), re-run i18n, v219_friends, worker, site, v2182_news one at a time, then ask the owner (choice window, no 5-minute default) for the go-ahead and the launch date.

- **Fix batch done (8aea677, dev branch):** all must-fixes of the code, phone and art reviews plus the cheap nice-to-haves (each review file lists what was fixed or skipped; skipped: code 10 (release dates), code 11 (qr.js lazy-load), art 5). 5 new game keys + privacy.delete in 11 languages; ja/ko/zh-Hans font subsets and packed.js regenerated. Suites green one at a time: i18n, v219_friends (265), worker (2129), v2182_news (33), site (466), smoke (35). Remove now has an Undo toast (the Worker hears it after ~3 s), and /friends/add and /friends/send need the caller's own friend id.
- **Waiting for the owner's go-ahead and launch date** (special update, no 5-minute default). Then: FR_LIVE = true, NEWS_V219.date and POLICY_DATE = the launch date, the Worker deploy first, then main, site and itch.io.

Known small notes from the reviews of parts 3-5: on 360 px phones the visiting dogs can still overlap a little (drawn at 0.84x on phones); a guest puppy's ribbon is about 10 px at 390; the route picker's friend row scrolls sideways with "Just us" at its left end.

1. Live: v2.18.4 "Winter Market" on main (site, itch #2256996, GitHub). The owner's official launch was 1 Nov 00:00 JST, and Marketing has the go-ahead. The Winter Market opens in game 1-26 Dec. Its design and the decisions are in docs/design/winter-market.md.
2. **New owner rule (31 Oct, in CLAUDE.md):** special and festival updates never go live without the owner's explicit go-ahead and launch date, and the 5-minute rule does not apply to them. I released v2.18.4 early without asking, and the owner was unhappy about it. Ask first.
3. **Now: v2.19 "Friends first".** Claude designs and Cursor codes:
   - Design contract: V219.md. Rules for coding agents: AGENTS.md.
   - GitHub issues: #3 is the overview. The parts are #4 Worker/D1, #5 Friends sheet, #6 visits, #7 gifts, #8 walk together and #9 invite page and privacy.
   - Owner's choices: async walk, a read-only yard snapshot, preset words only, issues one per part.
   - Part 0 art (PA.FRIENDS in world/pawart_world_b.js) is on main; the art coordinates are in a comment on #5.
   - Your job: when the owner gives a PR number, review it against V219.md, AGENTS.md and CLAUDE.md, and run its suites one at a time. Post the review on the PR (with the attribution footer) as approve or a list of fixes. Since 1 Nov the Game Manager merges approved part PRs itself (see the Cursor loop).
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

## Claude codes again (owner, 1 Nov 2026, 17:30 UTC)
The owner moved the coding of parts 3–5 from Cursor back to Claude. The Game Manager runs one coding subagent per part (worktree, branch `claude/v219-<part>`, brief = that part's prompt in `docs/briefs/V219_CURSOR_PROMPTS.md` plus the issue), reviews its diff, runs the suites, opens a PR and squash-merges it into `main`, then starts the next part. Close any Cursor PR for #6–#8 unmerged. The Cursor loop below is kept for reference only.

## Cursor loop (owner approved 1 Nov 2026; replaced by the section above)
- **Scheduled task** `trig_015HgYaCKCK77kFPVbC11evy` "v2.19 Cursor PR check" runs every 3 hours into the Game Manager session. A new Game Manager re-points it (update_trigger can't move it, so make a new one and delete the old one) and re-subscribes to the open PRs.
- **New `cursor/v219-*` PR:**
  1. `subscribe_pr_activity`.
  2. Check out the branch in a worktree.
  3. Diff it against `main` and check it against V219.md, AGENTS.md and the CLAUDE.md rules.
  4. Run the issue's suites one at a time (`NODE_PATH=$(npm root -g)`; Miniflare and Playwright are global). To wait for another suite, match only node: `until ! pgrep -f "^node .*run_tests.js" >/dev/null; do sleep 20; done` (a bare `pgrep -f run_tests.js` matches the waiting shell itself and never ends). The `site` suite needs `dist/itch`: `node game/build.js publish && node tools/itch.js` with esbuild 0.24.0 on NODE_PATH.
  5. Look at its screenshots.
- **Review:** `pull_request_review_write`, always as COMMENT (the PRs come from the owner's own account, so APPROVE and REQUEST_CHANGES fail). It opens with "**Verdict: approve**" or "**Verdict: fixes needed**", then a numbered list. Then the attribution footer. **Cursor does not react to `@cursor` inside a review body**: after a review with fixes, also post a plain PR comment (add_issue_comment) "@cursor please fix items 1–N in the review above on this branch, re-run ... and reply here with the summaries."
- **New commits** on a subscribed PR: re-review.
- **Merged (by you, see below):** unsubscribe, then update the progress table in `docs/briefs/V219_CURSOR_PROMPTS.md`. Start the next part by commenting on its issue: "@cursor" + the shared header + that part's prompt from that file. Order: #5 and #9 after #4; then #6, #7 and #8 one at a time, each after the one before is merged.
- **Game Admin** is the owner's Grok bot working through Cursor, under the owner's GitHub account (owner, 1 Nov). Talk with it on the PRs and issues. Its comments are signed "Game Admin". It can't approve anything that is the owner's call (merges, the release date).
- **The Game Manager merges (owner, 1 Nov 2026: "auto merge, as Grok bot's Cursor is always not responding").** When a part PR's review is "Verdict: approve" and its suites are green, squash-merge it into `main` yourself (merge_pull_request, squash, title "v2.19 part N: ... (#PR)"), then fast-forward the dev branch and start the next part. If fixes have waited 2 hours with no Cursor commit or reply, push the fixes to the PR branch yourself, re-run the suites, re-review, and merge. Part merges are fine on `main` because `FR_LIVE = false` keeps Friends hidden; the v2.19 release itself (FR_LIVE on, Worker, site, itch) still needs the owner's go-ahead and date. When #4–#9 are all merged: tell the owner once, disable the scheduled task and start part 7.
- **At the v2.19 release:** set `FR_LIVE = true` in `game/src/50_friends.js` (it stays off under the test harness by itself) and deploy the Worker before the site and game.
