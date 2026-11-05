# v2.22 code review (claude/player-levels, diff vs origin/claude/webgame-cloudflare-updates-1jo46d)

Must-fix: 1 (test only). Should-fix: 2. Nice-to-have: 6. No coin, save-version or off-mode leak found.

## Must-fix
1. **itch_build flag check is a false positive. No flag actually leaks.** `game/test_itch_build.js:71`
   - The regex `window\.__ddMs2Test=1` (no `<script>` anchor) matches the minified test hooks: `pagesFlag` in `24b_missions2.js:267` (`window.__ddMs2Test=1,n=kn()` in dist) and `50_friends.js:1601` (`window.__ddFrTest=1`).
   - Not a real risk: `tools/pages.js:33` adds the three flags only when `!ITCH`, and `tools/itch.js:27` already checks the real `<script>window.__dd…=1` tag. The red came in with v2.20 (`1b6893eb`), not v2.22.
   - Fix: anchor the test on `/<script>window\.__dd(Fr|Yue|Ms2)Test=1<\/script>|dd_gate_v1|id="ddGate"/`, the same pattern as itch.js. Add `window.__paw.lv.on() === false` to the line-72 runtime check. Also update the stale "7 action buttons" check (line 5 of the log) so `all` goes green.
   - **Status: fixed. `game/test_itch_build.js` uses the `<script>`-anchored pattern of tools/itch.js, the runtime check adds `__paw.lv.on() === false` (and no test flag set), and the bar check is today's (phones Care / Walk / Map / More, desktop 7).**

## Should-fix
2. **Notebook page 3 offers a step that locks.** `24e_notebook.js:50` (the `river` step)
   - Page 3 opens on day 3. Its step "Walk the Riverside Trail" now needs town level 8: a regular player gets there on day 5, a light player on day 9. On the dev branch it needed Bond 2 (day 1).
   - For a 3-month starter it is worse: the short-walk `alt` applies only while `!nbRiverOk()`. On day 4 the pup turns 6 months, and a step that could be done flips to "Opens at level 8". The page and its Carrot Seeds wait.
   - Suite B2 even asserts the 8 (`nbL.includes(8)`).
   - Fix: keep the short-walk alt while the route is level-locked, e.g. `const ok = nbRiverOk() && !lvRouteLocked('river')`, used for `m`, `lock` and `alt`.
   - **Status: fixed. `nbRiverOn()` (24e_notebook.js): with lvOn the short walk stays while Riverside is level-locked; off unchanged. B1/B2 updated (no `nb.3.2` lock on, `Opens at Bond 2` off).**
3. **The level 3 card announces something that is already open.** `51_levels.js:35` (`feat:stall`), `49_funfair.js:127/330`
   - `feat:stall` gates only the `ffstall` mission and `mswEvent`. The stall card and `ffStall()` have no gate ('stall' is not in `FF_GAMES`, so `lock` is false), and neither does the photo contest. Both are open at level 1.
   - Yet `lvUnlocksFor(3)` and the sheet list "The Saturday stall and the photo contest", and `lvNextText(2)` says "Level 3: … the Saturday stall".
   - Fix (choose one): gate the stall/photo cards with `wOpen('feat','stall',2)` while lvOn (the Off path stays the same), or drop `feat` from the card and Next text and keep it as a mission-only gate.
   - **Status: fixed (the smaller change: drop it). `feat:stall` stays a mission-only gate; `lvRowsSorted` leaves it out, so no card, sheet or Next line names the stall or the photo contest. Test R.**

## Nice-to-have
4. **A walk that covered no ground still pays first-visit XP.** `18_mod_walk_toys.js:46` + `51_levels.js:259`
   - The mod walk emits `walk` even when `!went` (headed home at the start), and `lvOnAct` runs `lvVisit(a.area)` first: +15 XP for 0 m. It is once per route.
   - Fix: run `lvVisit` only when `!a.early` or when the walk counted (`wn > src.wn`).
   - **Status: fixed. `lvVisit` only when `!a.early` or the walk counted. Test R.**
5. **A level card can be lost or covered.** `51_levels.js:454`
   - `L.shown = top` is written before `openModal`. If another timer's `openModal` replaces the card, or the player reloads while it is open, the card is gone for good. "Survives reload" holds only until the card first paints.
   - Fix: set `shown` (and `st.shown`, line 475) in the OK / `onClose` handler.
   - Also, `lvCalm` (443) does not check `busy`, `HO.pl` (decor placement) or `FW.enterAt`. `#luOk` → `lvMaybeShow` at 400 ms (`00_core.js:1624`) opens the card over the Bond 2 party's Paw, which `fwPaw` starts at 350 ms (`47_firstweek.js:132`).
   - Fix: add `!busy && !(HO && HO.pl) && Date.now() > (FW.enterAt||0)` to `lvCalm`.
   - **Status: fixed. `shown` / `st.shown` move in the card's `onClose`; `lvCalm` adds `busy`, `HO.pl` and `FW.enterAt`. Tests C3, C4, G1, R (a replaced card comes back).**
6. **Tick cost.** `51_levels.js:380`
   - `lvHudSync` runs about twice a second (the 1 s `lvUiTick` plus `fwNextSync`). Each call rebuilds `lvNextText`: `lvLiveRows` (137 rows plus HM_DECOR), a scan of `LV_UNLOCK`, and `HOUSES/CLOTHES.some` per row. This happens before the `hudKey` check.
   - There are no layout reads, so it is cheap on desktop but wasted on phones.
   - Fix: cache the next line by `lv|lang`, and the `lvLiveRows` Set once per session (the tables are static after boot).
   - **Status: fixed (the Next line cached by level + language, refreshed every 10 s). The `lvLiveRows` Set cache skipped: the HUD no longer calls it per tick, and the tables are not provably static (festival rows).**
7. **Pre-v2.7 saves start low.** `51_levels.js:175`
   - Such saves have no `careDays` at `migrate()`: `spotsInit` backfills it later (`13_more_dogs.js:239`). So `est` counts 0 care days, and players start near the floor.
   - Fix: when it is missing, use the same backfill in `lvStart`: `min(60, ageMonths(dogs[0]) - 10)`.
   - **Status: fixed. `lvStart` uses spotsInit's backfill when `careDays` is missing. Test R.**
8. **The wrong title shows for players who start at 20.** `51_levels.js:156-160`
   - `lvTitles` loops [10, 20] and sets `s.title` at 10 first, so an old player who starts at 20 shows "Friendly Neighbour".
   - Fix: give 20 first, or set `s.title` after the loop to the highest title earned.
   - **Status: fixed. `lvTitles` gives 20 first. Test R.**
9. **Bath zoomies can freeze a pack dog.** `51b_habits.js:265-266`
   - `hbBathZoom` sets `packNext[d.id] = now + 60000` and resets it only in the queue's last `fn` step. If the queue is cut (travel, a pet), that pack dog idles for a minute. This happens only with lvOn. Low confidence: please check that `rmQueue` interruption behaves this way.
   - Fix: a shorter guard, or reset it on `yard:enter`.
   - **Status: fixed. The guard is 20 s, and the next `yard:enter` clears a guard still in place (`HB.zg`). (`rmPause` already resets queued pack dogs.)**

## Checked and OK (probe: /tmp/claude-0/-home-user-paw-haven/2bdd0121-7c30-5d17-94e4-4e89be11931f/scratchpad/lvrev/probe1.js, on a copy of the built test_merged.html)
- **Gates:** every place, route, Tokyo, feature, Fun Fair and shop gate goes through `wOpen`/`lv*Locked`. The only `topBond()` comparisons left are tricks, the scarf letter, `49_market.js` and `ddTrackRows` (all on the Bond list in 3.4).
- **The table is complete:** all 137 live rows have an `LV_UNLOCK` entry (none falls back to `LV_FLOOR`), and no entry is dead.
- **Off is identical:** gates, texts and weights match the dev branch (no extra `Math.random`, and `sec`→`RINT` is the same function). With lvOn off, a reload changed only `S.lv.floor` (0→1). An old save loaded off gets no `S.lv`. No `#lvBtn`.
- **The floor never drops:** `floor` and `lv` are only ever raised with `Math.max`. A rehome after migration cannot close anything. Before migration, `wOpen` keeps today's `topBond()` test.
- **Cloud:** the pick stays whole-save, and the `migrate(copy)` check has no side effects.
- **Cap and day:** the 150 cap and sub-caps run in `lvGain`. The day rolls at `jstISO()`. Walk XP comes only from walks that counted (`src.wn`).
- **One-time XP:** `seen`/`bl`/`once` count each thing once.
- **No coins or items:** nothing in 51/51b gives them.
- **Migration:** additive, last in `migrate()` (after `pupStartFields`), runs once (`lvObj(s.lv)` guard), `S.v` untouched.
- **Card queue:** the Bond card always comes first (`levelQueue` is in `lvCalm`). The star card waits behind the level card.

## Fix batch (5 Nov 2026)

Commits b9471a50, fb073c68 and the itch_build follow-up on claude/player-levels (art fixes: 991b9965). Suites after the batch, one at a time, all green: v222_levels (254), phone_v222_levels (302), smoke, itch_build, v220_missions, phone_home, phone_shell, v2193_puppy, v216_first_week.
