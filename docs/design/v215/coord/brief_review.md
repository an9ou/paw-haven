# Brief: v2.15 combined review (code + phone, art)

Read-only reviewers. Read `CLAUDE.md`, `V215.md` (the contract), `PHONE.md` (phone), and the "Review notes" in `HANDOFF.md` here: check each note and say whether it is a real problem. The change set is `git diff origin/main...origin/integration/v2.15` (about 5,500 lines: `game/src/42_map215.js`-`46_tracks.js`, their CSS, `world/pawart_world_f.js`, `_g.js`, the v2.15 blocks in world A/C/E and `dogs/pawart_dogs.js`, the harness, the tests, the 10 language tables).

Work in your own worktree on `origin/integration/v2.15`. Don't edit tracked files, don't push. Screenshots and scratch scripts go in your scratchpad. Wrap every test or Playwright run in `flock /tmp/v215_test.lock` and run it as a tracked background task, one at a time. `export NODE_PATH=$(npm root -g) PAW_ARGS=--ignore-certificate-errors`. The harness options `map215` and `ground` turn the v2.15 world on (see `game/test_v215_*.js` for how the suites start a page).

## Reviewer 1: code + phone
- Code: cross-file bugs (shared scope, `ORDER.txt`), save migration (additive, old saves load, `v215Fields`), off-switch paths (`mpOn()` / `grOn()` false = v2.14 behaviour), timers and listeners cleaned up on leaving a place, the economy (walks stay about 100 a day; treasures, rosettes, coins from new places stay below it), the design rules (nothing bad ever happens, food and welfare, words), `tt` on every visible string.
- Phone (390x844 and 360x640, plus one landscape): the new map, each new place (Training Ground, Splash Pool, the three run tracks, Market Street, the Boutique, Barkitecture, Pip's Sprout Cart), the yard and Kibble Corner with ground on; 44 px taps, 15 px text, no sideways scroll, nothing hidden under the HUD, sheets or toasts. Try one long language (de) and one CJK (ja) on the map and the pool.

## Reviewer 2: art
- The new scenes (world F map, world G places, the wide scenes in world C, the yard/house/Kibble Corner block in world A), the 3 new outfits and 7 item icons: style against the old art (detailed pencil-sketchbook world, deliberately crude crayon dogs), seasons (spring, summer, autumn, winter with snow), night, rain, Halloween and New Year on the new places, dogs standing on the floor (no feet in walls or water edges), layering (props in front of or behind dogs as they should be), SVG size notes in the HANDOFF.
- `node dogs/check_identical.js v215-base` once (0 differ expected).

## Report (your final answer, 30 lines at most)
Findings ranked most-severe first. Each: severity (blocker / should fix / nit), file:line or screen, what is wrong, a concrete fix. Then the HANDOFF review notes with a verdict each (real / fine / already fixed). Screenshot paths for the visual findings.
