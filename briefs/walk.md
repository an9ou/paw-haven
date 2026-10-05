You are one lane of the Paw Haven v2.2 phone build (repo an9ou/paw-haven). A build coordinator session merges the lanes; you only build your lane.

## Setup (do this first)
- `npm install -g playwright` (Chromium is preinstalled at /opt/pw-browsers; NEVER run `playwright install`).
- Every test command needs this prefix: `PAW_ARGS=--ignore-certificate-errors NODE_PATH=$(npm root -g)`. The machine has 4 CPUs: use `--jobs 2`.
- Read CLAUDE.md, PIPELINE.md, the "Standing rules" of V21.md, and PHONE.md (all of it, especially "Standing rules (every lane)", section 4 Tests and your own section). Ignore CLAUDE.md's Mac notes, PIPELINE.md's /home/claude paths and its worktree workflow: you work directly in this checkout, on your lane branch.
- You are on branch `lane/p-walk`, branched from main at c27504b. The coordinator already created every v2.2 stub file (src 22b_cloud_config.js, 22b_cloud.js, 22c_phone_shell.js; css 20_phone_shell … 26_phone_skill) and added them to the ORDER.txt files. Never edit ORDER.txt.

## Rules
- Edit ONLY the files listed for your lane below. If you truly need a change elsewhere, don't make it: describe it in your final report.
- The laptop version (>= 1024 px, mouse) must look and play exactly as now. Every phone rule sits under `html[data-layout="phone"]` (CSS) or `if (isPhone())` (JS). `isPhone()` already exists (13_more_dogs.js).
- Prefix every new top-level name in game/src with your lane tag `pw`. Before committing, grep the whole of game/src for each new top-level name to make sure it is unique.
- Phone minimums (portrait 360–430 px): tap targets >= 44×44 px; text >= 15 px (captions 13 px); no horizontal page scroll (`document.documentElement.scrollWidth === innerWidth`); `env(safe-area-inset-*)` respected; no hover-only interactions; pointer events; long-press tooltip; drag always optional with a tap-to-select, tap-to-place fallback; `touch-action: manipulation` on game controls.
- Cozy design rules (CLAUDE.md "Design rules") and copy style (V21.md: plain short English, no semicolons in player text, no emoji in code) still hold.
- Lanes run in parallel and can't see each other's work. The SHELL lane (in parallel) owns the global phone shell: HUD, action bar, turning every `openModal` popup into a bottom sheet, the base 44 px sizes of `.btn`/`.opt`/tab buttons, toasts, the portrait lock, and the fixes inside `game/test_phone.js`. Don't restyle those global pieces; style your own screens' content (scoped selectors under `html[data-layout="phone"]`). Your popups' content must work both as today's v1.5B phone popup and inside a full-width bottom sheet up to 88% of the screen height with its own scroll.
- Don't break existing tests. All desktop suites must still pass unchanged.

## Tests
- Build: `node game/build.js` (the runner also builds and makes the harness).
- Write `game/test_phone_walk.js` with `game/test_lib.js`. test_lib now has a phone option: `require('./test_lib').run('name', async (t) => { ... }, { device: 'iPhone 13' })` or `await t.mk({ device: 'Pixel 7' })` / `t.boot({ device: 'Pixel 7' })` / `t.newGame({ device: 'Pixel 7' }, patch)`. Cover both iPhone 13 (390×844) and Pixel 7 (412×915). Check, for each of your screens: it opens; tap targets >= 44 px; text >= 15 px (13 for captions); no horizontal scroll; touch works (tap, plus rub / drag / swipe where your screens use them; Playwright `.tap()` and CDP `Input.dispatchTouchEvent` as in game/test_phone.js); no console errors (test_lib fails on them). The suite must print "ALL OK" and exit 0 when everything passes (test_lib does this).
- Run: `node game/run_tests.js smoke game/test_phone_walk.js --jobs 2` plus your lane's existing desktop suites (listed below), and `node game/test_phone.js` (with the prefix). On your branch test_phone.js may still show the known failures that SHELL fixes (the font-certificate console error, Settings/Journal tabs at 40 px, the potty "tapped to scoop" step); it must not show NEW failures caused by you.
- Do 2 look-and-fix rounds at most: take screenshots of your screens at 390×844 and 412×915 (`page.screenshot`), look at them, fix what's cramped or clipped.

## Finish
- Commit on your branch with message "WALK (v2.2 phone): <summary>" and `git push -u origin lane/p-walk`. Push ONLY that branch. No pull requests. Never touch, merge into or push main or any other branch.
- End with a short final report: files changed, new top-level names, the PASS lines of every suite you ran (with check counts), and open issues / requests for other lanes.

## Cross-lane names (v2.2) — use exactly these, always guarded with `typeof fn === 'function'`
- CLOUD defines `cloudStatus()` → `{ state, text }` where state is 'off' | 'guest' | 'account' | 'offline' | 'syncing' | 'synced' and text is a short line like "Synced 12 s ago" or "Guest". CLOUD also defines `cloudOpen()`, which opens Settings scrolled to the Cloud save section.
- SHELL's ⋯ menu shows `cloudStatus().text` (when defined) and its "Cloud save" item calls `cloudOpen()` (falling back to `openSettings()`).
- CLOUD's hook in `00_core.js`: `saveNow()` ends with `if (typeof clOnSaved === 'function') clOnSaved();` and after the local load `if (typeof clOnLoaded === 'function') clOnLoaded();` (two lines, nothing else in 00_core.js).
- SHELL defines `psSheetOpen()` → true while a bottom sheet is open, and emits `emit('phone:layout', { phone })` (event bus in 00_core.js) when the layout switches. `isPhone()` stays where it is or keeps working from any file.

## Your lane: WALK (Sonnet). PHONE.md section 2, row WALK, plus "WALK details (portrait only)".
Files you may edit: phone-only branches in `game/src/09_walk_classic.js`, `17_walk_route_carousel.js`, `18_mod_walk_toys.js`, `19_fetch.js`, `mods/walkrun.js`, `mods/toys.js` (modules never touch localStorage or game state; the game passes options/callbacks, so pass a `phone` option from the game rather than sniffing the page inside the module where you can), the css `game/css/25_phone_walk.css` (stub, yours), and your new `game/test_phone_walk.js`.
Screens: the walk route carousel (swipe plus arrow buttons), the classic treasure walk (hold-to-walk button, dig), the runner (`mods/walkrun.js`) in a letterboxed landscape strip scaled to the width with the HUD above and controls below, large Jump (hold for long jump) and Duck buttons in the bottom corners, tap on the strip = jump, swipe down = duck, a large Dig button, obstacles still giving at least 1.8 s of warning (zoom the camera out if needed), tutorial cards stacked vertically; toys (`mods/toys.js`) and fetch.
Existing desktop suites to keep green: smoke, v16, v16b, v2_play, all_e, all_a (run them by name with run_tests.js), then game/test_phone.js.
