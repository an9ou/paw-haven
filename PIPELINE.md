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
| **PHONE** (paused) | — | 05_dock, 06_action_bar, 12_phone_v1, 19_phone_v15b |

Module owners stay as before: dogs/ (dog artist), world/a (scenes), world/b (props/icons), world/c (new scenes), mods/* (one owner each).

## Version control
`proto/` is a git repo. Before a round the coordinator commits a baseline. Each agent's report lists the files it changed, and the coordinator reviews with `git diff` and can revert any single file. Agents must not run destructive git commands (reset, checkout of others' files, force); `git diff` and `git status` are fine.

## Testing (fast loop)
- **During work:** run `node game/build.js`, then `node game/harness.js merged`, then the quick smoke test (`node game/run_tests.js smoke`, about 1–2 min), plus your own feature test.
- **Before reporting:** run the suites that touch your lane.
- **Before publishing (coordinator only):** `node game/run_tests.js all`, which runs every suite in parallel shards.
- Tests never depend on the real clock or weather: they pin time and weather through the dev overrides unless a test is about the clock itself.
- No fixed sleeps where a wait-for-condition works.

## Speed rules for every agent
- Desktop only (1280×720) unless told otherwise. The phone version is paused.
- Do 1 look-and-fix round for small changes and 2 for big ones. Don't repeat runs that already passed.
- Keep reports short: what changed (files), the test results, and the open issues.
