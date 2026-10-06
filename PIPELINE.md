# Paw Haven: how the team builds (read this first, every agent)

The game is split into small files so several agents can work at once. **Never edit `game/paw_haven_proto.html` or `/home/claude/proto/paw_haven_prototype.html` by hand.** Both are generated.

## Layout
```
proto/
  game/shell.html          page markup with /*@@CSS@@*/ /*@@PAWART@@*/ /*@@PAWMODS@@*/ /*@@GAME@@*/ slots
  game/css/NN_*.css        styles, concatenated in css/ORDER.txt order
  game/src/NN_*.js         game script, concatenated in src/ORDER.txt order into ONE shared scope
                           (the IIFE opens in 00_core.js and closes in 23_boot.js)
  game/build.js            node game/build.js          -> game/paw_haven_proto.html (+ syntax check)
                           node game/build.js publish  -> proto/paw_haven_prototype.html (art + modules merged)
  game/harness.js          node game/harness.js merged -> game/test_merged.html (used by the tests)
  dogs/ world/ mods/       art modules and gameplay modules (one owner each, unchanged rules)
```

## Shared-scope rules (src/*.js)
- All src files share one scope. A function declared in any file can be called from any other file at runtime.
- Top-level `const`/`let` values that are used *while the script loads* must be declared in an earlier file. Calls inside functions are fine anywhere.
- **New feature = new file.** Name it `NN_feature.js` and add it to `src/ORDER.txt` BEFORE `23_boot.js`. Add matching styles as a new `css/NN_feature.css` file in `css/ORDER.txt`.
- **Hook points** (in the core lane, change rarely): when another lane needs to react to something, it uses the small event bus in `00_core.js`. If it isn't there yet, the core-lane owner adds `on(evt, fn)` / `emit(evt, data)`. Don't patch another lane's file directly.

## Lanes (who may edit what)
Parallel game agents each get ONE lane. Editing outside your lane needs the coordinator's OK.

| Lane | src files | css files |
|---|---|---|
| **CORE** (integrator, at most one agent) | 00_core, 20_settings_dev, 21_time_loop, 22_input, 23_boot, shell.html | 00_base, 01_sketch_surface, 02_stage, 03_hud, 04_view_scene, 07_buttons_cards, 08_modal, 10_toasts, 15_popups, 18_popup_style |
| **HOME** | 01_title, 02_adoption, 03_yard, 04_bath, 10_sex_age_genes, 12_popups_beds_map_snacks_potty, 13_more_dogs | 11_title, 14_pack |
| **TOWN** | 05_market_shops, 06_wardrobe, 08_map, 14_town_places | 13_purchase_window, 17_training_map (map part) |
| **PLAY** | 09_walk_classic, 15_trick_training, 16_voices_idle, 17_walk_route_carousel, 18_mod_walk_toys, 19_fetch | 16_idle_behaviours, 17_training_map (training part) |
| **SYSTEMS** | 07_treasure_journal, 11_garden_kitchen | 09_journal |
| **PHONE** (v2.2, see PHONE.md) | 22c_phone_shell (+ phone parts of the screen files) | 05_dock, 06_action_bar, 12_phone_v1, 19_phone_v15b, 20–26_phone_* |

Module owners stay as before: dogs/ (dog artist), world/a (scenes), world/b (props/icons), world/c (new scenes), mods/* (one owner each).

## Version control: one worktree per agent
`proto/` is a git repo on branch `main`. **Every agent works in its own git worktree**, never in `/home/claude/proto` directly.
- The coordinator creates each agent's worktree with `tools/wt.sh new <name>`. That makes `/home/claude/wt/<name>` on branch `lane/<name>`, branched from `main`. The agent's brief names its worktree path.
- The agent edits, builds (`node game/build.js`) and tests (`node game/run_tests.js smoke`, plus its own suites) INSIDE its worktree. Every path in the brief is relative to that worktree.
- When finished, the agent commits on its own branch: `git add -A && git commit -m "<lane>: <summary>"`. It must not merge, rebase, push, or touch `main` or other worktrees.
- The coordinator merges with `tools/wt.sh merge <name>`, which does a `--no-ff` merge into `main`, then the build and the smoke test. It resolves any conflicts, runs `node game/run_tests.js all --jobs 2` once all lanes are merged, publishes with `node game/build.js publish`, and drops the worktrees with `tools/wt.sh drop <name>`.
- Lanes keep conflicts rare. If two lanes must touch the same file, the coordinator merges them one after the other and re-tests.
- Generated files (`game/paw_haven_proto.html`, `proto/paw_haven_prototype.html`) are not tracked: always run `node game/build.js` after checkout or merge.

## Testing (fast loop)
One runner does everything: `node game/run_tests.js <smoke | all | suite names...> [--jobs N] [--retries N] [--strict] [--no-build] [--shots] [--list]`.
It runs `node game/build.js`, then `node game/harness.js merged`, then the suites in PARALLEL (one Chromium process per suite, longest first). It prints one
summary line per suite (PASS / FLAKY / FAIL, time, first failure lines), saves logs in `game/test_logs/<suite>.log` (+ `.retryN.log`, `last_run.txt`, `timings.json`),
and exits non-zero on a real failure. A suite that fails is retried once automatically; if the retry passes it is reported FLAKY (exit 0, or exit 1 with `--strict`).
Default parallelism = CPU cores - 1 (at least 1); override with `--jobs N`. **On a 2-core machine use `node game/run_tests.js all --jobs 2`** (measured stable over repeated runs; 3 jobs is slower than 2). Screenshots are off by default (`--shots` or `PAW_SHOTS=1` writes `game/shots_<suite>/`).

| Command | What | Time (2 cores) |
|---|---|---|
| `node game/run_tests.js smoke` | load, adopt, every popup, feed + pet, travel x3, shop + purchase window, walk + Head home early, toy, no console errors | about 25-30 s |
| `node game/run_tests.js all` | every desktop suite: `all_a..all_e` (the old test_all.js in 5 shards), `v15`, `v16`, `v16b`, `v17` | about 195 s with `--jobs 2`; about 315 s with 1 job (the old sequential run was 500 s) |
| `node game/run_tests.js all_c v16b` | named suites only | |
| `node game/run_tests.js game/test_myfeature.js` | your own suite file (written with `test_lib.js`), run like any other (retry, log, summary) | |
| `NODE_PATH=$(npm root -g) node game/test_all_c.js` | one suite directly (same file the runner starts) | |

- **During work:** build + harness merged (the runner does both), then `smoke`, plus the suite(s) of your lane. **Before reporting:** the suites that touch your lane. **Before publishing (coordinator only):** `all`.
- Phone suites (v2.2, v2.3): `node game/run_tests.js phone` runs `test_phone.js`, `test_phone_<lane>.js`, `test_cloud.js`, `test_account.js` (the title account choice) and the occlusion suites `test_phone_occl_home.js` and `test_phone_occl_play.js` (with `game/occl_play_*.js` helpers) (iPhone 13 / Pixel 7 profiles via test_lib's `device` option). They are not part of `all`, which stays the desktop regression set. The superseded originals of test_all / v15 / v16 / v16b / v17 are archived in `game/legacy_tests/` (not run).
- **Writing or editing a test** (use `game/test_lib.js`, see `game/test_smoke.js` for a small example):
  - `require('./test_lib').run('name', async (t) => { ... })`. The library exits non-zero on a failed `t.ok`, a crash or a console error.
  - **Time and weather are pinned** for every page: dev overrides `ovrTime='day'`, `ovrWeather='cloudy'` (neutral: sunny + day makes the dog "hot", which blocks idle behaviours, rain/snow change poses) and the page clock is frozen to "today 10:00" (it ticks, but the hour/date cannot roll over). A test that is about the clock or weather sets it itself (Dev panel selects) and then goes back to the pin, never to `auto`.
  - **No fixed sleeps.** Wait for the real condition: `t.until(fn, arg, ms)`, `t.untilMode('yard')`, `t.waitPop(true)`, `t.waitToast(/re/)`, `p.waitForSelector`. Actions the game ignores while the dog is "busy" (eat, dig, potty) use `t.retryUntil(action, cond)` or `t.travel(k)` / `t.pet(pred)` (they repeat). "Nothing should happen" checks use one short settle (`t.sleep(300)`), or wait for the bark log to go quiet.
  - **Prepared state instead of replaying the game:** `t.newGame({}, { bond: {level: 7, pts: 1600}, coins: 1000, inv: {...} })` adopts through the UI (about 3 s) and merges a patch into the live save (`t.patch(obj)`); `t.home('market')` puts you at a place. Old-save tests inject JSON with `t.mk({ storage: { pawhaven_proto_v1: json } })`.
  - **Timing-sensitive game checks must not race the wall clock:** the purchase-window arrow keys wait until the quantity box has focus and read the quantity from the "Total" line; the trick-training mark waits for `__paw.train.att` and pins the attempt age before pressing Good!; layout checks switch Motion off (the pack dogs' CSS sway) before measuring.

## Test pitfalls we hit (v2.1 and v2.2): read before writing a test
- **"ALL OK":** `run_tests.js` passes a suite only if it exits 0 **and** its output contains `ALL OK`. Node-only tests must print it themselves (`if (!fail) console.log('ALL OK')`).
- **`t.patch` merges objects.** It doesn't replace them. To set a new object (e.g. `dog.anc`), patch the field to `null` first, then patch the new value.
- **Faking another lane's function only works before that lane merges.** `window.fn = ...` stops working once the owner's real `fn` is in the shared scope, because the in-scope name wins. Test with real state (e.g. put a litter in `S.litters`, mark `S.sniffed`), not by faking functions.
- **Real art changes what you measure.** A selector like `[data-decor] rect` matches rectangles inside the art once real art is merged. Measure your own hit box (`> rect`) or a `data-*` hook.
- **Things that load once can change what you patch.** BREED backfills `anc` on load, and the mailbox migrates pen-pal schedules once (`S.penpalV21`). Patch after `newGame`, knowing those defaults already ran.
- **The certificate flag:** in cloud containers headless Chromium needs `PAW_ARGS=--ignore-certificate-errors`. `tools/session_start.sh` sets it for you.
- **Phone suites:** use the `device` option of `test_lib.js` (iPhone 13 / Pixel 7 profiles). Run them with `node game/run_tests.js phone`. `all` stays desktop-only.
- **Copy rules:** `node game/test_copy_node.js` (the `copy` suite, in `all`). A deliberate exception needs `// copy-ok: <reason>` on the line.

## Speed rules for every agent
- Desktop (1280×720) and phone (portrait, see PHONE.md). Phone rules always sit under `html[data-layout="phone"]` / `isPhone()`.
- Do 1 look-and-fix round for small changes and 2 for big ones. Don't repeat runs that already passed.
- Keep reports short: what changed (files), the test results, and the open issues.
