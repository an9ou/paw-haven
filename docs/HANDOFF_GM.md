# Game Manager handoff (30 Oct 2026)

Previous Game Manager: session_01YWqF1YmkskA96YAshTRHg3 (archive it once you are running). Marketing: session_01D6KLY3kmkonSJgdVfRqFo7 (new, tag team:marketing, branch marketing/launch); brief it on every release.

1. Live: v2.18.3 "All in one piece" on main (site, itch #2247434, GitHub). Cloud API worker deployed 30 Oct with the Cursor fixes (live smoke OK).
2. Release recipe: merge to the dev branch claude/webgame-cloudflare-updates-1jo46d and push HEAD:main; export NODE_PATH=<minify node_modules>:$(npm root -g); node tools/itch.js; SITE_GAME=$PWD/dist/itch node game/run_tests.js site; bash tools/cf_pages_deploy.sh; bash tools/itch_push.sh <ver>; add a NEWS entry (49c_news.js) for player-facing releases; brief Marketing.
3. Tests: one suite at a time (4-core box; parallel suites time out). Owner rules in CLAUDE.md (5-minute rule, token savers, auto handoff at ~150k).
4. Open, waiting on owner: growth plan decisions (doc https://claude.ai/artifact/6CfP7zLRodZ5Y44rJ6REeL: paid looks with Sparkle free, rewarded ads app-only, Friends v2.19 first, hero cast names, accounts). Google Drive uploads: dropped for now.
5. Markets: Halloween until 15 Nov (FM_MARKETS in 49_market.js); Winter Market 1-26 Dec has no new items yet (TODO in V2171.md). New Year 27 Dec-7 Jan.
6. Retention (29 Oct): Bond 1 share 69% -> 37% after v2.16; Bond 3+ 13% -> 27%; past 10 min 17% -> 25%; next-day return too early, recheck ~5 Nov. Dashboard https://claude.ai/artifact/7isHciXJMvmfFX1BUTzCQV has an active/came-back chart.
7. Reels: brand/reels/; rules: EN for IG/Shorts/X, zh-Hans for RedNote, no link on RedNote ("搜索 Doodle Doggo"), English first, RedNote after approval. Instagram skill pack in .claude/skills (ig-*).
8. The hourly usage-limit watchdog trigger trig_01MLghGE3g9UHDn7pBtjdJkJ is bound to the OLD session and disabled: make your own when work runs overnight, disable when idle.
9. Owner's Cursor/Grok edits may land on main directly; merge main before every release.
