# Walk runner review (branch claude/webgame-cloudflare-updates-1jo46d, 2 Nov 2026)

Scope: `mods/walkrun.js` (PawWalk.start, `o.pack` followers, v2.19 friend dog), game side `game/src/18_mod_walk_toys.js` (enterWalkMod), `34_pack_play.js`, `50_friends.js`, `00_core.js` / `21_time_loop.js` (HUD tick during a walk). No repo file was changed: all builds, prototype fixes and measurements ran in a copy, `scratchpad/repo/`.

Method: `scratchpad/prof_walk.js <phone|desk> <solo|pack> <cpu throttle> <secs> [trace]` uses `game/test_lib.js`. It starts a new game (pack: +corgi +samoyed with packCare, plus an injected `friend: true` beagle look, so 3 followers), runs `__paw.go('walk','park')` and `walkGate(true)`, then a keyboard autopilot reads `_peek()` (jump lows, hold for wides, duck highs). It records rAF deltas (the first 2.5 s are dropped), PerformanceObserver long tasks, a CDP Profiler CPU profile or a Tracing timeline (with `INV=1`: invalidation tracking), and a MutationObserver count. `EXP=` switches CSS and runtime experiments on. Phone = 393x852 @3x, touch; desk = 1280x800. Headless Chromium on Linux rasterises in software, so absolute numbers are worse than on a real phone. The before/after ratios are what count. Raw results: `scratchpad/res_*.json`, `scratchpad/matrix.txt`. Screenshots: `scratchpad/shot_*.png` (for example `shot_phone_pack_runner.png`).

## A. Lag: measured

4x CPU throttle, 20 s run, park route:

| case | fps | p50 ms | p95 ms | p99 | max | frames >33 ms | long tasks (total ms) |
|---|---|---|---|---|---|---|---|
| phone solo, now | 12.6 | 66.7 | 183 | 250 | 283 | 196 | 190 (18.6 s) |
| phone solo, fixes 1+2+4 | 50.7 | 16.7 | 33.4 | 50 | 183 | 51 | 11 (0.8 s) |
| phone 3 followers, now | 6.8 | 133 | 283 | 383 | 417 | 135 | 138 (21.2 s) |
| phone 3 followers, fixes 1+2+4 | 43.5 | 16.7 | 50 | 83 | 133 | 89 | 32 (2.1 s) |
| + fix 3 (hidden poses display:none) | 46.3 | 16.7 | 33.4 | – | 133 | 46 | 10 (0.7 s) |
| desk solo, now / fixed | 12.4 / 46.2 | 66.7 / 16.7 | 183 / 50 | | 250 / 150 | 193 / 60 | 182 / 31 |
| desk 3 followers, now / fixed | 6.0 / 37.4 | 150 / 16.7 | 333 / 50 | | 433 / 117 | 115 / 127 | 126 / 32 |
| no throttle, now: phone pack / desk pack | 49 / 39 | 16.7 | 33 / 50 | | 200 / 167 | 33 / 70 | 11 / 32 |

**v2.19.1, measured after the fixes** (worktree `runner`, same profiler, phone 393x852 @3x, 4x throttle, 20 s, park; pack = corgi + samoyed + a friend's beagle, 3 followers). Fixes 1 (the `:has(...) > *` rules became classes `.rt-pk` / `.rt-fr` set where the rows are rendered), 2 (`updateHUD` and `updateNose` write only on change), 5 (`display:none` for hidden poses; the start-up measuring shows them in one batched layout pass), 6 (the hint/bubble overlap read at most every 150 ms and after `say()`), 7 (the rare leader poses dig, sad, shake, eat, cold drawn in idle time or on first use; one layout pass for every start measurement) and 8 (the time bar written only when its 3-decimal value changes):

| case | fps | p50 ms | p95 ms | p99 | max | frames >33 ms | long tasks (total ms) | go / start ms |
|---|---|---|---|---|---|---|---|---|
| phone solo, before (throttle after the start) | 16.7 | 50 | 133 | 217 | 233 | 215 | 205 (17.6 s) | |
| phone solo, after | 57.9 | 16.7 | 16.8 | 33.4 | 83 | 11 | 2 (0.13 s) | |
| phone 3 followers, before | 6.8 | 133 | 300 | 333 | 367 | 132 | 133 (20.5 s) | |
| phone 3 followers, after | 55.9 | 16.7 | 33.3 | 50 | 83 | 29 | 4 (0.27 s) | |
| phone solo, before (throttled from the start, `PRE=1`) | 16.8 | 50 | 167 | 183 | 233 | 198 | 186 (16.7 s) | 615 / 585 |
| phone solo, after (`PRE=1`) | 56.1 | 16.7 | 16.8 | 33.4 | 133 | 20 | 3 (0.25 s) | 394 / 370 |
| phone 3 followers, before (`PRE=1`) | 4.7 | 183 | 350 | 517 | 517 | 97 | 100 (21.0 s) | 897 / 863 |
| phone 3 followers, after (`PRE=1`) | 52.9 | 16.7 | 33.3 | 50 | 117 | 32 | 11 (0.79 s) | 932 / 893 |

The start hitch with a pack did not shrink (the followers' poses are still drawn up front: they are only 4 or 5 each); solo it went from 615 to 394 ms. Raw: `scratchpad/runner/out_*.txt`, profiler `scratchpad/prof_walk_wt.js`.

Where the time goes (trace, phone solo, 4x, 15 s): `UpdateLayoutTree` (style recalc) takes 10.4 s of the main thread. It runs 344 times, each over about 2,710 elements (the whole `#stage`: runner plus HUD). Paint takes 0.9 s, Layerize 0.8 s, JS (FunctionCall) only 2.1 s. JS profile (self time): `getBoundingClientRect` 1.28 s (forced layout), walkrun `render` 0.14 s, game `toastPlace` 0.09 s, pawaudio scheduler about 0.15 s. GC is about 35 ms: per-frame allocation is not a problem. DOM size: 2,623 nodes in the runner solo and 4,669 with 3 followers. The leader's 10 pre-drawn poses are 1,623 nodes, each follower about 650. 54 CSS animations run, 45 of them on hidden poses.

Causes, by impact:

1. **Global `:has()` rules ending in `> *` restyle the whole stage on any text change.** `game/css/37_pack_play.css:41` `html[data-layout="phone"] .routes:has(.pk-walkrow) > *` and `game/css/52_friends.css:97` `.routes:has(.fr-walkrow) > *`. When any node inside `#stage` is inserted or removed (a `textContent` write counts), Chromium schedules a `:has` invalidation on the flagged ancestors `#stage` and `#hud`. Because of `> *` the invalidation set is "allDescendantsMightBeInvalid", so the trace shows "Invalidation set invalidates subtree DIV#stage", stack `updateNose <- render <- frame`. Deleting only these two rules: phone solo 12.6 → 43 fps. The rules ship in every build (52_friends.css is not gated by FR_LIVE), and they slow every screen with a ticking HUD, not only walks.
2. **Text written every tick even when it has not changed.** `mods/walkrun.js:1011` `updateNose` sets `E.nl.textContent` (and `E.noseBar` transform, 1013) every 100 ms (1384). The game's `updateHUD` (`game/src/00_core.js:1395-1409`, called by `tick` every 250 ms from `23_boot.js:17`) rewrites 4 meter `.num` values, `#bondLvl`, `#coinNum`, `#hudClock`, `.fill` widths and `aria` attributes even when nothing changed. Each write triggers cause 1. Guarding these writes, with the CSS left as it is, gives 43.7 fps. Fixing both 1 and 2 gives 50.7 fps.
3. **Hidden poses are still live.** `.pw-pose{visibility:hidden}` (`walkrun.js:347`) keeps every pose's crayon-boil animations ticking (`.pa-dog.pa-d-anim .pa-d-f0..f2`, 3 per pose: 45 of 54 animations) and keeps about 2,900 SVG nodes in style and layout. `display:none` for poses without `.on` (in the pack: 43.3 → 46.3 fps, p95 50 → 33) means the getBBox measuring blocks (`walkrun.js:667-705`) must show the pose for a moment, as they already do with inline styles. Pausing only the animations of hidden poses gained nothing measurable.
4. **Forced synchronous layout every frame while a speech bubble is up.** `walkrun.js:1389-1392` calls `E.say.getBoundingClientRect()` and then `getBoundingClientRect()` on each hint, after the frame's transform writes. In the unthrottled pack profile it is 0.63 s self time in 15 s, and 1.28 s in the 4x solo profile. Fix: compute the overlap in world units (the hint's `left`/`top` and the bubble position are known) or check it at most every 150 ms or when `say()` runs. Throttling it gave a small gain on top of fixes 1 and 2 (frames over 33 ms: 33 → 20).
5. **Start hitch (not during the run).** `go('walk')` takes 523 ms solo and 866 ms with the pack at 4x, in one long task. It draws 10 leader poses plus 4 per follower (`walkrun.js:620-662`), runs getBBox, and the v2.19 ribbon placement measures every shape's `getBoundingClientRect` once per pose (`walkrun.js:684-705`). Fix: draw rare poses (dig, sad, shake, eat, cold) lazily on first use or in `requestIdleCallback`; measure the ribbon once on the walk pose and reuse the result.
6. **Smaller items.** `E.timeBar` transform is rewritten every frame (`walkrun.js:1382`; write it only when the 3-decimal value changes). Coins carry two `drop-shadow` filters plus a bob animation (`walkrun.js:211`): many layers, so Layerize and Commit take 1.9 s and 1.0 s per 12 s in the pack trace. A sniff makes the game's `toast()` call `toastPlace()`, a layout read (0.09 s). Ruled out: setInterval-driven movement (the runner uses rAF with a fixed 120 Hz step), per-frame innerHTML (objects are made once, 177 adds in 20 s), and GC.

Prototype patches are in the scratch copy only: `scratchpad/repo/mods/walkrun.js` (flags `__PWFIX.nose` and `.gbcr`) and `scratchpad/repo/game/src/00_core.js` (`.hud`). The HUD-skip prototype is not the recommended fix: the slim HUD stays visible on phones (see `shot_phone_pack_runner.png`), so the right fix is diff-guarded writes.

## B. Followers don't duck

Why:
- `walkrun.js:639` `FOL_POSES = ['walk','jump','happy','idle']` has no `crouch` pose, so nothing is drawn for it.
- `walkrun.js:1364` `const hp = p === 'jump' || p === 'happy' || p === 'walk' ? p : 'idle'` records the leader's crouch in `folHist` as `idle`. When the follower reaches the spot (1369-1373), it switches to the standing idle pose, which looks like stopping while sliding, and keeps full height under the awning, sign, gull, line, kite or bird.
- `folSvg` (645) has no fallback for crouch (the leader uses `POSE_FB.crouch = ['sit','idle']`, 618).
- Followers have no hitbox at all, so the "bonk" is only visual. It happens even when the leader ducked correctly.

Fix:
1. Add `'crouch'` to `FOL_POSES`, with the `crouch → sit → idle` fallback in `folSvg`. The v2.19 ribbon placement then covers it automatically.
2. Decide the follower's duck from the obstacle, not from the leader's keys: in `render`, for each follower, take its world span (`cx + DOG.x - f.dist` ± its art extent `f.art × K(f)`, plus about 12 units of margin). If any live `cat === 'high'` obstacle overlaps that span, show `crouch` and set y to 0 (cancel a replayed jump under it). Otherwise replay the history as now.

Timing: duck **as each dog reaches the obstacle**, not with the leader. Ducking with the leader makes the followers duck under empty sky and stand up just as the obstacle reaches them, which is exactly the bonk. Driving it by obstacle geometry also covers the leader bonking or jumping into a high thing: the line still ducks cleanly. A big follower (rel up to 1.4 → 1.12× the leader's drawn size) should get a visual check that its crouch art stays under `HIGH_BOTTOM` 58.

Test to update: `game/test_v219_friends.js:832` asserts `ribs === 4` (one ribbon per follower pose). With crouch added it becomes 5.

## C. Remove the sniff pause

The pause: running through a sniff spot calls `startSniff` (`walkrun.js:1063`), which sets `S.sniffT = 0.6` and `poseFor('eat', 0.55)`. `step` (1273) then targets 35% speed: `else if (S.sniffT > 0) target = 0.35;`. `S.slow` eases down at 14/s and back up at 5/s, so the run slows for about 1 s. The leader shows the head-down eat pose (render 1354) and the followers turn to `idle` (`hp`, 1364), which reads as a full stop.

Change:
- In `startSniff` (1063), remove `S.sniffT = 0.6;` and `poseFor('eat', 0.55);`. Keep `S.sniffs++` (Happiness and Bond in `results`, 1167-1168), `sfx('sniff')`, the `pw-got` fade, `sniffClue()` (it still nudges the Nose-o-meter) and `say`/`sayExt`.
- At line 1273, drop `else if (S.sniffT > 0) target = 0.35;`.
- The `S.sniffT` field and its decrement (491, 1266) can stay or go.
- Optional: a small "sniff!" `pop()` above the head while running, so the clue still reads as an event.
- Leave the dig-prompt slowdown (`S.prompt` → 0.2 for 1.5 s, same line 1273). It is not a sniff; it gives the player time to tap Dig. The countdown word "sniff" (1251) is only a label.

Tests: no suite asserts the sniff slowdown or `sniffT`. Checked `game/test_*.js` and `mods/walk/{run,bot,bot_touch}.js`; only the archived `mods/walk/walkrun_pre_*.js` copies contain it. `test_phone_walk.js:127` only lists pose names (the `eat` pose stays in `POSES`). Re-run `phone_walk`, `phone_occl_play`, `all_c`, `v29_pack` and `mods/walk/run.js bot`.

## D. Power-ups (Magnet, Zoomies, Bubble, Super jump)

**Spawn.** Use the existing `specials` system (`walkrun.js:792-813`), with a new `{ t: 'power', kind }`:
- 2 per walk when the route is at least 60 s, 1 when shorter, none on `o.firstWalk`.
- Placed at `PLAN × (0.3 ± 0.05)` and `PLAN × (0.62 ± 0.05)`, pushed at least 650 units from dig, sniff and bonus spots (the bonus rule, 808-811).
- `genUntil` gives them the small clear zone (as `sniff`: v × 0.5 before, 0.45 after), so nothing dangerous shares the screen.
- Height `COIN_H.mid` (50): grabbed by walking or a hop, using the bonus pickup test (1327).
- No two of the same kind in one walk. Zoomies never in the last 10 s or right before a dig spot.
- A test hook `o._forcePower`, like `o._forceBonus` (806).

**Effects.** One active at a time; a new pickup replaces the old one. A timer `S.pwr = { kind, t }` ticks in `step` and freezes in pause and bag.
- **Magnet, 8 s.** Coins within about 260 units ahead or behind the dog glide (world-unit lerp) to the nearest dog and are taken with `collectCoin`. It never spawns coins and never pulls dig spots, sniff spots or the bonus.
- **Zoomies, 5 s.** Speed ×1.3: a factor on `v` in `step` (1275). While a dig prompt is up, the prompt's 0.2 wins. Obstacles are passed with no `stumble` and no −3 s: mark them `touched` with no penalty; wides count as cleared. A crayon speed trail (3 wobbly streaks) behind every dog.
- **Bubble.** Lasts until the next bump. In `stumble` (1041), if a bubble is up: pop it, no time loss, no sad pose, a "Pop!" `pop()`. Splashes stay as they are (no fail state either way).
- **Super jump, 8 s.** `PH.V0` ×1.2 and `GLONG` ×0.8 (floatier), plus a spring sparkle. Keep the high-band hitbox as it is so ducking still matters.

**Followers ("the dogs have special abilities").**
- Every follower, the friend's dog included, shows the same effect: bubble around each, trail behind each, spring sparkle on each.
- Magnet coins can fly to any dog (all count to the one `S.coins`).
- Super jump: followers replay the higher hops (`folHist`).
- The friend's dog stays cosmetic: its coin rule (`FR_WALK_COINS = 10`, at most 2 a day, `50_friends.js:1119`) does not change.

**HUD.** A power chip in `.pw-hud` next to the coins: the icon plus a shrinking bar (as the dig ring, `scaleX`). The bubble shows no timer. One `say()` line on pickup. Add a row to tutorial page 3 (`tutPage`, near 1219) and to the pause card.

**Treasure hunt.** Power spots keep 650 units from X spots. Dig prompts override Zoomies' speed. The magnet ignores dig, sniff and bonus. The Nose-o-meter is unchanged.

**Economy.** Walks have no daily coin cap in code. A walk's pay is bounded by its coin spawn budget: `coinTarget` 24–32 (`walkrun.js:814`), hard limit 38 coins per walk (`coinBudget`, 833). Then the pack +10% (`34_pack_play.js:270`) and BOOST in `addCoins`. The daily caps are `FF_CAPS` (`49_funfair.js:19`: minigames, jobs, toys 30/day) and friends' 20/day. Walks are about 230 real coins a day in the sim (`V218.md` 7, sim in `v215_tracks`). The Magnet collects only coins already spawned, so the per-walk maximum is unchanged; only the average take goes up. Zoomies covers more ground, but coin generation follows the same budget (clamp 1.25 × PLAN, 38 max). Re-run the `v215_tracks` sim with "every coin collected" as the walk value. No paid power-ups and no food items, so nothing toxic is involved. Nothing bad ever happens: missing a power-up costs nothing.

**Art (world B, `PawArt.collectible(name)`, with `COL_FB` fallbacks in walkrun as at `walkrun.js:170`).**
- 4 pickups: `magnet` (red/grey horseshoe), `zoom` (a bone with a crayon rocket flame), `bubble` (a soap bubble with a white shine), `spring` (a coil).
- Effects: speed streaks, a bubble ring per dog, a "pop" burst, spring sparkles.
- Crude crayon, every fill inside its outline (owner's rule; check with `dogs/fill_sweep.js`-style audits for world art), tinted for night and rain like the coins.

**Text (11 languages).**
- Runner text goes through `L('mod.walk.<key>', 'English', vars)` (`walkrun.js:96`) → `PawI18n.tt`. Keys are extracted under the `mod.walk` prefix (`tools/i18n_extract.js:75`).
- New keys (about 14): 4 names, 4 pickup lines (for example "Magnet paws!", "ZOOMIES!", "Bubble on!", "Boing boing!"), "Pop!", the bubble's "Saved by the bubble.", 1–2 tutorial rows, a pause row, an aria-label for the chip.
- Then `node tools/i18n_extract.js --en`, one translation batch, `node tools/i18n_pack.js`, and the `i18n_fit` audit for the HUD chip.

**Suites covering walks** (`game/run_tests.js`): smoke, all_c, v16, v17, v2_play, v29_pack, v219_friends, phone_walk, phone_occl_play, phone_v29_pack, phone_legacy (test_phone.js), phone_shell, i18n_phone, plus the module harness `node mods/walk/run.js bot|routes|shots|idle`. Add a new suite (for example `v220_powerups`) with `_peek().power` and `o._forcePower`.

## Numbered fix list (ranked by impact)

1. Rewrite the two `:has(...) > *` rules (`game/css/37_pack_play.css:41`, `game/css/52_friends.css:97`): set a class from JS where `.pk-walkrow`/`.fr-walkrow` are rendered (`.routes.pk-rowed > *`), or name the children (`> :is(.rt-viewport,.rt-nav,...)`). Measured 12.6 → 43 fps (phone solo, 4x). Benefits the whole game.
2. Write only on change: `walkrun.js:1011-1013` (nose label and bar) and `00_core.js:1395-1409` `updateHUD` (meters, bond, coins, clock). With 1: 50.7 fps, p95 183 → 33 ms. Pack: 6.8 → 43.5 fps.
3. Followers duck: add the `crouch` pose and drive it by obstacle overlap per follower (`walkrun.js:639, 645, 1364-1373`); update `test_v219_friends.js:832` (4 → 5).
4. Remove the sniff slowdown: `walkrun.js:1063` (drop `sniffT` and the `eat` pose) and `1273`. No test changes.
5. `display:none` for hidden poses (`walkrun.js:347`, show temporarily in the measuring blocks 667-705). Pack: p95 50 → 33 ms.
6. No `getBoundingClientRect` per frame in `render` (`walkrun.js:1389-1392`): world-unit math or a 150 ms throttle.
7. Smaller start hitch (523/866 ms at 4x): lazy rare poses, ribbon measured once (`walkrun.js:620-705`).
8. Minor: the timeBar write only on change (1382); fewer filtered, animated coin layers (211).
9. Power-ups as in D, after 1–6, so the extra effects land on a smooth runner.
