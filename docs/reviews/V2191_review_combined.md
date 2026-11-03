# v2.19.1 "Smooth runs": combined review (code, phone, art)

Branch `runner` (worktree `/home/user/paw-haven-runner`, head `1e59bcc6`) against `claude/webgame-cloudflare-updates-1jo46d`, 9 commits. Read-only review: no repo file was changed. The base build used for comparison is a `git archive` copy in `scratchpad/runner_rev/base/`. Scripts are in `scratchpad/runner_rev/`: `rev_walk.js` (real game walks with a pack of Great Dane, corgi and the friend's beagle, every power-up forced through `o._forcePower`, sampled every frame), `hud_fit.js`, `pickups.js`, `fetch_trace.js`, `prof.js` (prof_walk_wt.js plus `POW=` and fps while a power-up is active) and `screens.js`.

Suites on the final commit: **v2191_runner PASS** (54 checks, 142 s) and **v29_pack PASS** (112 checks, 47 s). No console errors in any suite or script run (14 walks across 3 viewports).

## Must-fix

1. **Super jump carries the leader out of the scene, behind the HUD and the speech bubble** (`mods/walkrun.js:1098` V0 ×1.2 and `:1399` GLONG ×0.8). A held long jump with Super jump reaches h = 253–272 units. Normal long jumps peak at about 160. Measured, as the top of the leader's drawing against the top of the stage:
   - phone 393 town/river/beach: −27 px;
   - phone 360 town/woods: −17 px;
   - desktop 1280 beach: −62 px.
   On desktop the HUD and toasts cover that strip, so a frame shows only the follower. The leader is also more than 50% covered by `.pw-say` (z-index 4, `:444`) in 15–20 frames per walk (river, town 360).
   Screens:
   - `s_desk_beach_cloudy_night_springpeak2.png` (only the paws show under the HUD);
   - `s_phone393_town_cloudy_day_springpeak2.png` (the head is clipped at the top edge).
   Fix: put a ceiling on the jump. In `layout()`, compute `hCeil = (dog's standing top in stage px − HUD bottom in stage px − 8) / s`. In step, after `S.h += S.vh * dt` (`:1400`), add `if (S.h > hCeil) { S.h = hCeil; S.vh = Math.min(S.vh, 0); }`. Alternatively drop the GLONG ×0.8 and keep only V0 ×1.12, which peaks at about 206 units, and check it again. While `S.h > 60`, fade `.pw-say` to about 0.35, or raise `.pw-dog` above it. The followers replay `folHist`, so the cap reaches them too.
2. **The Zoomies trail still smears over the dog behind** (`mods/walkrun.js:401`). The trail sits at `left:-20%; top:40%; width:32%` of each dog's box. In the pack line (FOL_OV 0.28) that strip falls on the head and chest of the next dog. Measured: it covers up to 58% of a follower's drawn box, in about 1,000–1,300 frames per walk, on every viewport (393, 360, 1280). The last commit made the trail lighter but did not move it.
   Screens: `s_desk_beach_cloudy_night_zoom.png` (streaks across the Great Dane's and the beagle's faces), `s_phone393_town_cloudy_day_zoom.png`.
   Fix:
   - Draw the long trail only on the rear-most dog (the leader when walking solo).
   - Give the other dogs short streaks over their own backs (`top:8%; height:22%; left:0; width:22%`), so nothing reaches the next head.
   - Or move the trail images into one layer behind every `.pw-dog` and position them in `render`.
3. **The power chip wraps the phone HUD to a third row** (`mods/walkrun.js:388-392` and the chip HTML at `:542`). Measured in the real game, HUD height without and with the chip:

   | phone | without chip | with chip |
   |---|---|---|
   | 393 | 84 px | 132 px (the pause button drops to its own row) |
   | 360 | 84 px | 118 px |

   At 360 the HUD bottom then lies 8 px below the stage top, covering the sky band that jumps use. The HUD also jumps in height on every pickup and every expiry. Before the branch, the pause button sat next to the bag (`scratchpad/shot_phone_pack_x4_park.png`).
   Screens: `s_phone393_town_cloudy_day_zoom.png`, `s_phone360_town_rain_day_bubble.png`, `hud_chip_393.png`, `hud_chip_360.png`.
   Fix:
   - Tested in-page: `.pw-pt .pw-pchip .pw-bar{display:none}.pw-pt .pw-pchip .pw-ic{width:26px;height:26px}` brings 393 and 360 back to 84 px. Show the time left as a ring or fill on the icon instead.
   - Or, more robust: on `.pw-pt`, put the chip in the time row (CSS `order`, after `.pw-secs`), so it shrinks the long time bar and never wraps.
   - Re-check at 412 and 320. The nose label width also moves the wrap point, and 320 already wraps without the chip.

## Nice-to-have

- `game/test_v29_pack.js:125` (450 → 600 ms) is **a legitimate timing fix, not a hidden Fetch regression.** Traces taken every frame after the throw (`fetch_trace.js`) give the same curve on base and on runner:
  - followers cover 0.9–1.0 of the leader from 0 to about 430 ms;
  - the cover falls below 0.5 at about 520 ms (runner) and 530–550 ms (base);
  - it reaches 0 at about 680 ms.

  The fixed sleep comes after three evals. They ran slower on base, so its 450 ms sample landed later. Two follow-ups:
  - Make the test wait for the condition (`t.until(lead ≤ 0.5)` within 1 s) instead of sleeping.
  - Pre-existing: for the first half-second of every run, the leader is hidden behind the followers on both builds.
- `game/test_v2191_runner.js:125`: "followers replay the leader's hops" is `ok(true, …)`. It measured a lowest follower y of only −1.9 px, so assert an actual hop height, for example y < −20 px within 1 s of the jump.
- Frame rate while a power-up is active (phone pack, 4x throttle): 46.8 fps and p95 49.9 ms, against 52.3 fps for the whole walk. The cost comes from infinite animations on every dog: `pw-bwob` on 4 translucent bubbles, `pw-trl`, `pw-glow` on the chip icon, and `pw-ring` on the magnet. Drop the chip's glow, step the trail less often, or animate only the leader's overlay.
- Pickup contrast on pale backgrounds: the bubble on pier day and town rain, and the zoom bone's cream on pale hilltop and town skies, are the weakest reads (`pickups_sheet.png`). A slightly darker blue outline on `bubble`, or a warmer halo behind the pickup in `.pw-power::before`, would help.
- The "sniff!" pop sits under the speech bubble's tail at 360 (`s_phone360_woods_rain_day_sniff.png`). Lift it about 20 units or put it to the left.
- The "sign" high obstacle never appeared in 6 river and town walks, so it is not sampled here. The duck rule is generic (overlap with `cat === 'high'`).
- Pre-existing, outside this branch: the game's `sayExt` toast repeats the bubble's text over the HUD on phone and desktop.

## OK (checked)

- **`.rt-pk` / `.rt-fr` classes.** They are set when the routes screen renders (`17_walk_route_carousel.js:18`). `frWalkSync` toggles `.rt-fr` on every sync, including the async `frLoad`. `pkWalkRow` redraws only its inner HTML, so the class stays right. No `:has(...) > *` rule is left.
- **Write-on-change HUD.**
  - A language switch reloads the page (`i18nReload`).
  - `#meters` is rebuilt without `data-v`.
  - The bond key holds level, progress and points.
  - Coins and the clock compare `textContent`.
  - Nothing else writes these nodes.
  - A cloud load or import (`clApply`) goes back through `updateHUD`.
- **`display:none` poses.** The start-up measuring shows the walk, crouch and friend poses in one batch. The friend ribbon gets 5 out of 5, and the Great Dane's crouch is squashed under the high things. The lazy leader poses are drawn on first use.
- **Followers duck.** Sampled followers were crouching in every frame under awning, seagull, fishingline, kite, bunting, bird and branch (more than 400 follower-frames, Great Dane included). The drawing overlapped a high thing 0 times; the closest gap was 8.7 px. 0 bonks.
- **Power-ups.**
  - Only one is active at a time; a new one replaces the old.
  - The timer freezes while paused (suite) and stops in `endT`.
  - The chip and the overlays clear when a power-up ends.
  - The magnet takes only `kind === 'coin'` and never more coins than were made. Over 14 walks, `magCoins` was 3–8 per walk and coins stayed at or below the coins spawned. The hard limit is still 38 coins per walk.
  - Zoomies yields to a dig prompt (`zoomK` target 1) and is never placed just before an X.
  - The bubble pops with no hit and no time lost (suite).
  - The first walk has none.
- **Rules.**
  - The friend's coin rule is unchanged (`50_friends.js` only gains the class toggle).
  - No new save fields.
  - The 14 new English keys go through `L('mod.walk.*')` and are in `en.json` and `packed.js`.
  - No word-rule hits.
  - Nothing bad happens: missing a power-up costs nothing.
- **Art** (`world/pawart_world_b.js`, ea8fbb49). Every wash is a `b.sh` fill inside its own pencil line. The pickups show at 38 px and read on town, hilltop and pier by day, by night and in rain (`pickups_sheet.png`). The bubble overlays read well at night (`s_desk_hilltop_cloudy_night_bubble.png`).

## Numbers

Profiler at 4x CPU throttle, park, every power-up forced:
- phone 393 solo, 32 s: 57.6 fps, p95 16.8 ms, 19 frames over 33 ms;
- phone 393 pack (3 followers), 32 s: 52.3 fps, p95 33.4 ms, 67 frames over 33 ms;
- desktop 1280 pack: 50.1 fps, p95 33.4 ms;
- while a power-up is active: solo 56.5 fps, pack 46.8 fps on phone and 47.7 fps on desktop.

These match plan section A (57.9 and 55.9 fps without power-ups).

Other screens, phone 393 at 4x throttle, base → runner:

| screen | fps | p95 ms |
|---|---|---|
| yard | 44.0 → 55.5 | 66.7 → 16.8 |
| map | 54.4 → 59.9 | 33.4 → 16.7 |
| route picker | 59.3 → 59.3 | 16.8 → 16.8 |

Nothing got slower.

Screens and data: `scratchpad/runner_rev/s_*.png`, `pk_*.png`, `pickups_sheet.png`, `hud_chip_*.png`, `rv_*.json`, `res_pw*.json`.
