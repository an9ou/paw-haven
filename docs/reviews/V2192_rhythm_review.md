# Daily rhythm (v2.19.2): review

REVIEW (from the reviewer):
Must-fix
1. Runner walks that cover no ground still count. game/src/18_mod_walk_toys.js:38 calls walkCount() on every runner end, including "Head home early" at the start (0 distance) and dropped friend walks. A player who taps a route by mistake and heads home at once loses a full-pay walk. The classic walk only counts `frac > 0.05 || W.found` (09_walk_classic.js:265). Fix: only count a runner walk that actually went (same spirit as the classic rule: compute whether it went first, then `const wk = went ? walkCount() : null`, share 1 when null). Add a test.
2. Care days lose a day for European and US players. game/src/13_more_dogs.js:263 (markCareDay) still counts by the local date, but the feed/pet/play flags now reset on the Japan day; CET: feed Mon 18:00 (Japan Tue), again Tue 09:00 (still Japan Tue): flags already set, careWatch sees no change, local Tuesday gets no care day (dog spots, 14-day Cozy Hoodie slow down). Fix: use jstISO() there (check old saves' stored care-day keys still compare sanely).
Should-fix
3. 50_friends.js:9 sits right next to `const FR_LIVE = false;`; the 6 Nov release flips that line to true on the dev branch, and a merge conflicts. Fix: move the date-ordered news insertion into a helper in 49c_news.js (called from 50_friends.js away from the FR_LIVE line, or have 49c_news sort NEWS by date at the point it reads it), keep 50_friends.js's FR_LIVE line and its neighbours byte-identical to the base commit 83d2adb if at all possible (check with `git diff 83d2adb -- game/src/50_friends.js`), and add a test of the order with FR_LIVE on: [2.19.2 (2026-11-08), 2.19 (2026-11-07), 2.18.4 ...]; equal dates keep the newer version first.
4. The Saturday stall mission (ffstall, 24_missions.js:63) checks the local Saturday but lasts a Japan day; it can be rolled when the stall closes before the mission ends. Fix: only allow it when the local Saturday lasts until the Japan day's end (or give it weight 0 if that is messy).
5. In ja/zh/ko the one mission is cut off: 24_missions.js:230-233 (msRowText) still caps a row at 3 lines with "…" even on the one-row card (o.one). Fix: allow 5-6 lines when o.one, and check the card still fits (screenshots of the missions sheet at 360 px and desktop in ja, zh-Hant, ko, de, en with Playwright; earlier shots for comparison: /tmp/claude-0/-home-user-paw-haven/3f5bedaa-786b-5050-a4dc-16efe20a7878/scratchpad/shots/360_ja_missions.png and desk_ja_missions.png; write new ones next to them with a _fix suffix and look at them).
6. An old client (cached build, second device) can bring back 3 missions a day through cloud save: m.rhythm is already 1, so msRoll (24_missions.js:104) keeps all 3 when the local date equals the Japan date. Fix: trim to 1 in msRoll unless it is a test force (keep a finished one if any was finished, as the existing old-save trim does). Add a test.
Nice-to-have (do these too)
7. After the update a reload under 5 s with the old numeric S.daily.day shows "A new day in town!" once (21_time_loop.js:18): skip the toast when the old value was numeric (first migration).
8. "Energy refills at {n} per game hour" (03_yard.js:848) now shows 300+: show it per real minute instead (new key or changed English → translate that one line into all 11 non-English game languages in game/i18n/*.json in each language's existing terms, Cantonese yue is spoken HK Cantonese in Traditional characters per docs/i18n/yue.md, then regenerate game/i18n/packed.js and any CJK/Thai font subset that needs new glyphs, the way commit 9e27efd did it).
9. Skip (owner decision, not now).
10. Add tests for the classic-walk count and the early runner walk (part of 1).

## Status
1. Fixed in 94b00a1 (runner `went` before `walkCount()`; tests 7b, runner and classic).
2. Fixed in 94b00a1 (`markCareDay` on `jstISO()`; an old local-date key compares as a plain date; test 7c).
3. Fixed in 94b00a1 (`50_friends.js` identical to 83d2adb; `nwSort()` in `49c_news.js`; test 7f with the FR_LIVE line simulated).
4. Fixed in 94b00a1 (`msStallDay()`; test 7e).
5. Fixed in 94b00a1 (6 lines on the one-row card, art `o.one`; shots `*_missions_fix.png`).
6. Fixed in 94b00a1 (`msRoll` trims, a finished one first; a test force keeps its list; test 7d).
7. Fixed in 94b00a1 (test 7g).
8. Fixed in 94b00a1 (new key `yard.energy_refills_min_html`, 11 languages, no new glyphs; packed.js).
9. Skipped (owner decision).
10. Fixed in 94b00a1 (7b).
