# Code review: v2.26 "Yard visitors", v2.27 "Town projects", v2.28 "Stories and stars", v2.29 "Story mode"

Branch `claude/release-26-29` at `6d499671`, diffed against `origin/main` (`git diff origin/main...HEAD`, 46 files, +3,843 / -32). Read-only
review. Contracts V226.md to V229.md, CLAUDE.md design rules. The review covers the cross-feature bugs from the merge, the save migration, the
economy, the gates, the scene queue, toasts, performance and console errors. Known issues not reported again: the v219_friends table mismatch and
the v229_story +20 coin flake.

How it was checked: I read the diff, ran the `v229_story` suite and wrote my own Playwright probes on the `game/test_merged.html` harness.
The page clock was 12 Nov 2026, so every NEWS date was still in the future and all four gates were closed unless their test prefs were set.

Counts: **1 must-fix, 4 should-fix, 7 nice.**

## Must-fix

1. **must-fix: the four v2.26 yard toys go on sale before the v2.26 launch.** Files: `game/src/54_visitors.js:10`, `game/src/28_home.js:518-520`,
   `game/src/51_levels.js:96`, `game/src/24e_notebook.js:172`.
   - What goes wrong: `54_visitors.js` adds the Tug Post, Puddle Pool, Play Tunnel and Bubble Fountain to `HM_DECOR` when the file loads, with
     `v27: true`. `hoShopItems` lists every `v27` decoration, and so does the town-level item list (`51_levels.js:96`). As soon as this branch is on `main`, every
     player (on itch.io too) can see and buy the toys in Barkitecture > Decor, weeks before `NEWS_V226.date`. This breaks V226.md 0 ("before it
     nothing of the feature shows") and the CLAUDE.md rule that a content release waits for the owner's go-ahead.
   - Repro: a probe on a new game (12 Nov, `yvOn()` false, `nwDue` false for 2.26 to 2.29), then `__paw.shop.shop('builder')` and the Decor tab.
     The tab lists all four toys.
   - Fix: add one helper, `hmLive(d) = !d.v226 || yvOn()`, and use it in `hoShopItems`, in the town-level list (`51_levels.js:96`) and in the notebook
     pick (`24e_notebook.js:172`). A toy a player already owns still draws as it does now. Add a gate check for this to `v226_visitors`.
   Status: fixed (d5971454): hmLive(d) = !d.v226 || yvOn() in hoShopItems, lvLiveRows and nbDecorPick; v226_visitors 6b fakes the date (webdriver off, page clock) before/after NEWS_V226.date.

## Should-fix

2. **should-fix: automatic sheets open under a playing scene.** Files: `game/src/49c_news.js:241` (`nwCalmNow`, which `wbTry` in
   `53_welcome.js:216` also uses), `game/src/51_levels.js:449` (`lvCalm`). No file outside `00_core.js`, `21_time_loop.js` and `57_scenes.js` calls `scPlaying()`.
   - What goes wrong: none of these calm checks knows about `scPlaying()`. While a scene plays, `modal.hidden` is true and the mode is `yard`,
     so What's new, While you were out or a level card can open. `#modal` (z 20) then sits under `#scLayer` (z 25): the
     player can't see it, but its sounds play over the scene (kaching for the away gift, `greetBark`, the level fanfare). If the player presses
     Escape before Skip shows, the global handler in `22_input.js:9` closes the sheet. Then While you were out (its gift already given) or What's
     new (marked seen) is lost without being seen.
   - Repro: a probe with `prefs.wbTest`, `smTest` and `scTest` set, the prologue playing, and `S.wbPend = { at: now, h: 6 }`. After 4.5 s,
     `#modal` is open with "While you were out" while `__paw.sc.on() === 'prologue'`.
   - Fix: add `if (typeof scPlaying === 'function' && scPlaying()) return false;` to `nwCalmNow` and `lvCalm`, and to any other automatic opener
     with its own calm check (the calendar page, the Gerald guide). A simpler alternative is one guard in `openModal` that holds automatic opens.
   Status: fixed (5cf05bb9, lane B): nwCalmNow (so wbTry too) and lvCalm return false while scPlaying(); test in v229_story 4.

3. **should-fix: desktop keys act on the game under a scene.** File: `game/src/22_input.js:5-14`.
   - What goes wrong: the global keydown handler still runs `doAct` for keys 1 to 7, and Space still pets, while a scene plays (the
     action bar is under the layer but not hidden). Pressing 4 during the `ch2` scene switched `cur.mode` to `routes` under the scene. After a
     Memories replay, `onEnd` then opens the album over the route picker. Escape before Skip shows also runs the mode's own Escape handling.
   - Repro: the probe `__paw.sc.play('ch2', { replay: true })`, then `keyboard.press('4')`. The mode is `routes` while `sc.on()` is still `'ch2'`.
   - Fix: at the top of the handler (after `firstGesture()`), add `if (typeof scPlaying === 'function' && scPlaying()) return;`. Escape keeps
     working because `57_scenes.js:249` handles it in the capture phase.
   Status: fixed (5cf05bb9, lane B): the keydown handler returns while scPlaying() (1-7/Space/Enter prevented unless focus is in the scene); Escape still skips in the capture phase; test in v229_story 4.

4. **should-fix: saves started between the merge and 10 Dec get no story catch-up.** Files: `game/src/00_core.js:851`, `game/src/57b_story.js:18,23`
   and `:191-197`.
   - What goes wrong: `freshState()` marks every new save `story.from = 'fresh'`, even while `smOn()` is still false. With v2.26 to v2.28
     live from 19 Nov, players who start in the three weeks before v2.29 can have many walks, Bond 5 and town level 5+ by 10 Dec. They still get
     no catch-up: chapter 1 starts from nothing, nothing they did before counts, and `smBigBase(false)` skips the first-visit entries. As a
     result, "First day at Sunny Park" and similar scenes play the next time they go to places they have visited many times.
   - Fix: in `v229Fields`, use `fresh && smOn() ? 'fresh' : 'old'`. The catch-up path already handles a save with nothing earned (chapter 1, the
     prologue, no letter), so a real day-one player sees the same thing.
   Status: fixed (5cf05bb9, lane B): `fresh && smOn() ? 'fresh' : 'old'`; test in v229_story 1 (a save made while Story is off gets the catch-up, a seen place goes into the album, only the prologue plays).

5. **should-fix: the four launch dates are placeholders that go live by themselves.** File: `game/src/49c_news.js:170-210` (`date` fields
   marked `// LAUNCH DATE`).
   - What goes wrong: `nwDue` is date-only. Once this is on `main`, v2.26 opens on 19 Nov, v2.27 on 26 Nov, v2.28 on 3 Dec and v2.29 on 10 Dec
     with no further step. CLAUDE.md says special or content updates need the owner's explicit go-ahead and launch date, and the 5-minute rule
     does not apply to them.
   - Fix: before merging, make sure each date is one the owner set. Until then, keep an obviously far date (for example `'2099-01-01'`) so that
     merging can never launch anything.

## Nice

6. **nice: V228.md and the code disagree on when story 1 starts.** `game/src/56_stories.js:158` vs V228.md 3. The contract says story 1 starts
   at Bond 2. `stStartOk` uses `topBond() >= 3`, and the journal line `st.j_empty` says Bond 3. Pick one and align the other.
   Status: fixed (7dbd6604): V228.md 3 now says Bond 3, as stStartOk and st.j_empty.

7. **nice: a scene left in a background tab is marked watched.** `game/src/57_scenes.js:218`. `requestAnimationFrame` stops while the tab is
   hidden, but `t0` is wall time. On return, `ms >= total` ends the scene with `scEnd(false)`, and `scPlayAuto` marks it watched even though it
   was never seen. Fix: on `visibilitychange` hidden, note the time and add the hidden span to `SC.on.t0` on return.
   Status: fixed (5cf05bb9, lane B): the scene pauses while the tab is hidden (the hidden span is added to t0), and no automatic scene starts in a hidden tab.

8. **nice: on desktop, toasts held during a scene are capped at 3.** `game/src/00_core.js:1379`. During a scene, desktop toasts are queued
   (`tq`), but `while (toasts.children.length > 3) toasts.firstChild.remove()` still applies, so the oldest held toast, such as a chapter reward
   line, is dropped. Fix: count only live toasts there, or keep the newest 3 plus any `gold` toasts.
   Status: fixed (5cf05bb9, lane B): desktop caps only live toasts at 3; up to 8 wait (plain ones dropped before gold), and after the scene they come in 3 at a time.

9. **nice: two corrupt-save cases that never heal.** `game/src/56_stories.js:22`: an array `S.st` passes `typeof === 'object'`, and its keys are
   lost on every save, so the keepsake toasts come back each session. Use `Array.isArray` as the other `v22xFields` do.
   `game/src/55_projects.js:37`: `paid` is not capped at the price. With `paid >= price`, `prPay` returns 0 forever and the project is stuck.
   Cap it at `price - 1`, or move the project to `building`.
   Status: fixed for S.st (7dbd6604, Array.isArray in v228Fields + test); S.projects paid cap skipped (55_projects.js is lane A).

10. **nice: field order.** `game/src/00_core.js:851,927`: `v229Fields` runs before `v225Fields` in both `freshState()` and `migrate()`. Nothing
    depends on that order today, but move it after `v228Fields` so the order follows the versions and a later dependency can't break silently.
   Status: fixed (5cf05bb9, lane B): v229Fields runs after v228Fields in freshState and migrate (no v225-v228 field reads S.story).

11. **nice: unescaped strings.** `game/src/54_visitors.js:190-193,219,229` and `game/src/55_projects.js:206`: `tt()` text goes into button and
    title HTML without `esc()`, unlike the rest of the code. A translation with `&` or `<` would break the markup. Wrap them in `esc()`.
   Status: fixed for 54_visitors.js (7dbd6604: title, buttons, care card wrapped in esc()); 55_projects.js:206 is lane A.

12. **nice: the v229_story fit check fails on timing.** `game/test_v229_story.js:191-204`. "every actor inside the picture" failed on both
    attempts here, every time with "measured shot N+1". The seek lands at 96 % of a shot, and on a slow runner two `requestAnimationFrame` calls
    plus an evaluate cross into the next shot. That is a test problem, not a framing bug. Fix: add a `seek` that also freezes the clock (a test
    hook that sets `SC.on.t0` on every frame), or measure at 85 %.

## Checked, nothing to report

- **Migration.** Every new field is additive and `S.v` stays 1. A missing or broken `S.visitors`, `S.projects`, `S.st` or `S.story` is
  rebuilt, and no field is dropped. A new save is `visitors.seen = now`, so there is no flood of visitors.
- **Economy.** Story coins add up to 1,370 (200 + 160 + 170 + 170 + 180 + 220 + 270), each paid once. The old-save catch-up is capped at 150.
  Visitor coins are at most 10 in 7 days. The projects cost 5k, 10k, 15k and 25k and only take coins. The fountain and bandstand treats give
  Happiness, not coins. Walks stay the main income.
- **Design rules.** No banned words. No FOMO wording ("there is no hurry", "every one comes back"). Every visitor goes home, and Comet is
  adopted for "no money, only a promise".
- **Gates (apart from finding 1).** Menus, journal tabs, letters, catch-ups, scenes, the Missions line, the Week board notes, the postcard
  buttons, the star badges and the camera "look left" all wait for their `On()` check.
- **Toasts and bubbles during scenes.** Both are held.
- **Performance.** Three light timers (1 s, 1 s and 400 ms) and a 30 s `seen` stamp. The scene engine does two `getBoundingClientRect` calls per
  frame, which is acceptable.
- **Console errors.** None in the probes.
- **Suites.** `v225_welcome` passes (70 checks, with the visitors card). `v229_story` fails only on the fit check in finding 12.
