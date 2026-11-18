# v2.29.1 "Little town tweaks": combined review (code + phone/fit), 13 Nov 2026

Reviewer: paw-reviewer (read-only). Branch claude/v2291-balance at 605ee544. Shots: 40 PNGs, en de ja th yue, 360x640 and 1280x720 (scratchpad, not kept).

1. MUST-FIX. game/src/51_levels.js:432: `lv.today_full2` (points at Town projects and the Visitors Book) has no gate, but those open 19 Nov 00:00 JST and the release reaches main/itch on 18 Nov. Show it only when `prOn() || yvOn()`, else the old `lv.today_full`; restore `lv.today_full` in all 12 languages.
   Status: fixed in 4fc6a3c6 (gated on prOn() || yvOn(), else lv.today_full, restored in all 12 languages).
2. MUST-FIX (date). game/src/49c_news.js:210: NEWS_V2291 must not share 2026-11-19: on the same date nwVer sorts 2.29.1 first and the auto sheet shows only NEWS[0], so launch-day players would get the tweaks page instead of Story mode.
   Status: fixed in 4fc6a3c6 (NEWS_V2291 is minor: true; the auto sheet leads with the newest unseen non-minor entry; date kept at the 2026-11-20 placeholder; v2291_balance checks launch day, a later day and a seen v2.29).
3. Nice. Same cause: a player who first comes back after the 2.29.1 date sees only the tweaks page; v2.26-29 sit behind "See all updates". Date it later, or let the auto sheet lead with the newest big release the player hasn't seen.
   Status: fixed in 4fc6a3c6 (same change as item 2).
4. Nice. game/src/53_welcome.js:252: at 0% it says "The Fountain is 0% there" (also right after a project is paid, while it is being built), and it replaces the 4 rotating lines most evenings until ~55k coins are paid. Use a "saving for" line at 0, skip it while building or on alternate days. "The Sakura Avenue is..." reads oddly (pr.paid_toast has the same pattern).
   Status: fixed in 4fc6a3c6 (wb.t_save at 0 coins, nothing while a build is under way, wb.t_proj2 percent line on alternate days; pr.paid_toast drops "The").
5. Nice. game/src/57b_story.js:270: chapter 3 always says "a fountain"; an old save may already have paid it. Use prName(prCur().id) or hide once S.projects.i > 0.
   Status: fixed in 4fc6a3c6 (sm.c3_board2 uses prName(prCur().id), hidden when every project is done).
6. Nice. game/src/05_market_shops.js:132: the Boutique row sits under the whole grid (needs a scroll). Consider under the greeting line.
   Status: fixed in 4fc6a3c6 (the Kind shop looks row sits under the Boutique greeting line).
7. Nice. tools/playtest.js:126 reads all of #toasts: an older toast still on screen makes a slow walk start count as "blocked". Snapshot before Start, compare only new toasts.
   Status: fixed in 4fc6a3c6 (toasts snapshotted before Start; only new text counts).
8. Nice. game/test_v2291_balance.js:28: the fallback check passes with an empty pool. Assert pool.length > 0 and a non-home id in it.
   Status: fixed in 4fc6a3c6 (the fallback pool must be non-empty and hold a non-home id).
9. Nice. Board name differs from pr.board_aria (ja 掲示板/ボード, yue 佈告板/告示板, de Projekt-Tafel/Tafel der Stadtprojekte, th ป้าย/บอร์ด); "the evening line" in nw.v2291.tmrw is used nowhere else.
   Status: fixed in 4fc6a3c6 (board name matches pr.board_aria in every language; nw.v2291.tmrw2 says "the note about tomorrow", the line is a toast and the While you were out page has no name for it).
10. OK. Free swap: can't return the same mission (msSwapExcl), falls back to the whole pool, all 18 MS_HOME ids exist, first draw and seed unchanged; trick and walk_river left out as decided.
11. OK. Gates: B1/B3 prOn(), B2 ksOn() (SHOP_LIVE on, harmless), A live at once (harmless). No new S fields.
12. OK. KS_LOOK_COINS (1,500) is the Kind shop's own coin price; ksOpen('looks') is a valid tab.
13. OK. Fit: all four new texts inside their panels at both sizes in en de ja th yue, no overflow, nothing under the phone bar, Boutique button 44 px on phones, no tofu. Cosmetic: yue cap line leaves one character on line 2.
   Status: skipped, cosmetic (owner's decision).
14. OK. Translations: 8 keys in 12 languages, placeholders intact, glossary terms used.
