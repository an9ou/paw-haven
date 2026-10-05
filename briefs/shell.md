You are one lane of the Paw Haven v2.2 phone build (repo an9ou/paw-haven). A build coordinator session merges the lanes; you only build your lane.

## Setup (do this first)
- `npm install -g playwright` (Chromium is preinstalled at /opt/pw-browsers; NEVER run `playwright install`).
- Every test command needs this prefix: `PAW_ARGS=--ignore-certificate-errors NODE_PATH=$(npm root -g)`. The machine has 4 CPUs: use `--jobs 2`.
- Read CLAUDE.md, PIPELINE.md, the "Standing rules" of V21.md, and PHONE.md (all of it, especially "Standing rules (every lane)", section 4 Tests and your own section). Ignore CLAUDE.md's Mac notes, PIPELINE.md's /home/claude paths and its worktree workflow: you work directly in this checkout, on your lane branch.
- You are on branch `lane/p-shell`, branched from main at c27504b. The coordinator already created every v2.2 stub file (src 22b_cloud_config.js, 22b_cloud.js, 22c_phone_shell.js; css 20_phone_shell … 26_phone_skill) and added them to the ORDER.txt files. Never edit ORDER.txt.

## Rules
- Edit ONLY the files listed for your lane below. If you truly need a change elsewhere, don't make it: describe it in your final report.
- The laptop version (>= 1024 px, mouse) must look and play exactly as now. Every phone rule sits under `html[data-layout="phone"]` (CSS) or `if (isPhone())` (JS). `isPhone()` already exists (13_more_dogs.js).
- Prefix every new top-level name in game/src with your lane tag `ps`. Before committing, grep the whole of game/src for each new top-level name to make sure it is unique.
- Phone minimums (portrait 360–430 px): tap targets >= 44×44 px; text >= 15 px (captions 13 px); no horizontal page scroll (`document.documentElement.scrollWidth === innerWidth`); `env(safe-area-inset-*)` respected; no hover-only interactions; pointer events; long-press tooltip; drag always optional with a tap-to-select, tap-to-place fallback; `touch-action: manipulation` on game controls.
- Cozy design rules (CLAUDE.md "Design rules") and copy style (V21.md: plain short English, no semicolons in player text, no emoji in code) still hold.
- Lanes run in parallel and can't see each other's work. The SHELL lane (in parallel) owns the global phone shell: HUD, action bar, turning every `openModal` popup into a bottom sheet, the base 44 px sizes of `.btn`/`.opt`/tab buttons, toasts, the portrait lock, and the fixes inside `game/test_phone.js`. Don't restyle those global pieces; style your own screens' content (scoped selectors under `html[data-layout="phone"]`). Your popups' content must work both as today's v1.5B phone popup and inside a full-width bottom sheet up to 88% of the screen height with its own scroll.
- Don't break existing tests. All desktop suites must still pass unchanged.

## Tests
- Build: `node game/build.js` (the runner also builds and makes the harness).
- Write `game/test_phone_shell.js` with `game/test_lib.js`. test_lib now has a phone option: `require('./test_lib').run('name', async (t) => { ... }, { device: 'iPhone 13' })` or `await t.mk({ device: 'Pixel 7' })` / `t.boot({ device: 'Pixel 7' })` / `t.newGame({ device: 'Pixel 7' }, patch)`. Cover both iPhone 13 (390×844) and Pixel 7 (412×915). Check, for each of your screens: it opens; tap targets >= 44 px; text >= 15 px (13 for captions); no horizontal scroll; touch works (tap, plus rub / drag / swipe where your screens use them; Playwright `.tap()` and CDP `Input.dispatchTouchEvent` as in game/test_phone.js); no console errors (test_lib fails on them). The suite must print "ALL OK" and exit 0 when everything passes (test_lib does this).
- Run: `node game/run_tests.js smoke game/test_phone_shell.js --jobs 2` plus your lane's existing desktop suites (listed below), and `node game/test_phone.js` (with the prefix). On your branch test_phone.js may still show the known failures that SHELL fixes (the font-certificate console error, Settings/Journal tabs at 40 px, the potty "tapped to scoop" step); it must not show NEW failures caused by you.
- Do 2 look-and-fix rounds at most: take screenshots of your screens at 390×844 and 412×915 (`page.screenshot`), look at them, fix what's cramped or clipped.

## Finish
- Commit on your branch with message "SHELL (v2.2 phone): <summary>" and `git push -u origin lane/p-shell`. Push ONLY that branch. No pull requests. Never touch, merge into or push main or any other branch.
- End with a short final report: files changed, new top-level names, the PASS lines of every suite you ran (with check counts), and open issues / requests for other lanes.

## Cross-lane names (v2.2) — use exactly these, always guarded with `typeof fn === 'function'`
- CLOUD defines `cloudStatus()` → `{ state, text }` where state is 'off' | 'guest' | 'account' | 'offline' | 'syncing' | 'synced' and text is a short line like "Synced 12 s ago" or "Guest". CLOUD also defines `cloudOpen()`, which opens Settings scrolled to the Cloud save section.
- SHELL's ⋯ menu shows `cloudStatus().text` (when defined) and its "Cloud save" item calls `cloudOpen()` (falling back to `openSettings()`).
- CLOUD's hook in `00_core.js`: `saveNow()` ends with `if (typeof clOnSaved === 'function') clOnSaved();` and after the local load `if (typeof clOnLoaded === 'function') clOnLoaded();` (two lines, nothing else in 00_core.js).
- SHELL defines `psSheetOpen()` → true while a bottom sheet is open, and emits `emit('phone:layout', { phone })` (event bus in 00_core.js) when the layout switches. `isPhone()` stays where it is or keeps working from any file.

## Your lane: SHELL (Opus). PHONE.md section 1 "Phone shell".
Files you may edit: `game/src/22c_phone_shell.js` (stub, yours), the v1.5B phone section of `game/src/13_more_dogs.js` (from the comment "v1.5B: phone layout (portrait, touch)" to the end of that phone code), `game/src/22_input.js`, `game/shell.html` (markup hooks only), `game/css/19_phone_v15b.css`, `game/css/20_phone_shell.css` (stub, yours), `game/test_phone.js`, and your new `game/test_phone_shell.js`.
Build everything in PHONE.md section 1: the mode switch moved into 22c (leave a call in the old place), the portrait lock card (touch + landscape + height <= 500 px; pause clock-driven animations; never on a mouse pointer), the two-row phone HUD (dog chip, mood dot, name, sex symbol, coins, ⋯ menu with Settings / mute / cloud status; 4 ring meters that expand on tap; #hudTitle under the name), the fixed 7-button action bar (>= 48 px, labels, safe-area inset), every openModal as a bottom sheet (full width, up to 88% height, drag handle, swipe-down and backdrop-tap close, inner scroll, grids reflow to 2 columns, tab rows scroll sideways), base sizes (.btn, .opt, tab buttons >= 44 px on phones; fixes the Settings and Journal tab failures), toasts above the action bar.
test_phone.js: make it honour PAW_ARGS and the shared Chromium path exactly like test_lib.js (it fails on the font certificate today), and make the potty "tap to scoop" step wait for the real condition. On your branch test_phone.js must pass fully.
Also add a long-press tooltip helper other lanes can use (e.g. `psLongPress(el, text)`), and mention it in your report.
Suites: smoke, game/test_phone.js, game/test_phone_shell.js, and — because you touch global pieces — `node game/run_tests.js all --jobs 2` before your final report (all must pass unchanged).
