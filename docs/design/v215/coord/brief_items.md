# Brief: ITEM ART (v2.15), lane `items`

Read `v215_common.md` first (lane rules). Branch: `lane/v215-items` from `origin/integration/v2.15`. Commit trailer session line: `Claude-Session: https://claude.ai/code/session_01QrEn8GuJzf6563HVWgovNg`.

## Goal
The seven v2.15 items get real art. Today the Bamboo Ring (and the others) fall back to the `?` placeholder (`artReal` / `PLACEHOLDER_RE`, `game/src/00_core.js` ~1012).

Items (rows in `game/src/00_core.js`: CLOTHES row ~123, treasure rows `TR(...)` ~234-239):
- Wearables, drawn ON the crude crayon dogs (`dogs/pawart_dogs.js`: `OUT` lists ~774 and the per-slot draw tables, e.g. `NECK2['Asakusa Bandana']` ~1214 is the latest pattern):
  - **Doggy Life Vest** (body): bright orange/yellow vest, two buckles, a little grab handle. The pool puts it on dogs in the water (`45_pool.js` `plVestOn`): check it shows there.
  - **Sunflower Collar** (neck): green collar with a sunflower.
  - **Sailor Cap** (head): white sailor cap, navy band (don't confuse with the existing `Sailor Collar`).
- Item icons, `PawArt.item(name)` / `PawArt.icon` as the game asks for them (viewBox 0 0 64 64), for all seven: the three above plus **Lucky Horseshoe** (charm), **Bamboo Ring** (toy, also used in ball play: check `38_ball.js` BL_TOYS draws it, not a `?`), **Paper Lantern** (charm), **Sea Glass** (charm). Put them in the v2.15 art module (`world/pawart_world_g.js` has an empty `ITEMS` table at ~641, wrapping like world E does), unless the existing pattern says otherwise.

Style: match the existing item icons (world B/E) and the crude crayon outfits. Look at a few in screenshots before and after.

## Must hold
- `node dogs/check_identical.js v215-base` (after `git fetch origin v215-base:v215-base`): 0 differ, no SKIP. New outfit art must not change any old render.
- Every grep in the game for these names finds real art, no `?`: wardrobe, journal treasures, shop/inventory lists, ball play (Bamboo Ring), Dog Cards outfit counts if they count OUT entries (check `test_v211_cards.js`, `test_v211_dogs_node.js`/`v212` expectations; update a test only where it counts the outfit list length, and say so).
- Add a small node test `game/test_v215_items_node.js` (registered in `game/run_tests.js` like the other `_node` art tests): each of the 7 names returns real SVG (no placeholder), the 3 wearables draw on a few breeds/ages without errors, ids unique.
- Suites to run (one at a time, under the lock): smoke, your new test, v215_tracks, v215_places (pool), v211_art_e_node, v212_dogs_node, check_identical.

## Optional (only if cheap, under 20 min)
A low puppy bar in the world G training scene (puppies currently jump the tall bar). Skip it if it touches game logic; list it as not done.

## Screenshots
Wardrobe with the 3 wearables on 2-3 dogs (incl. one puppy), the journal treasure page with the 6 treasures, the pool with a vested dog, ball play with the Bamboo Ring. Put them in the scratchpad or `game/shots_v215_items/` (untracked) and give the paths.

Report per `v215_common.md` (25 lines max).
