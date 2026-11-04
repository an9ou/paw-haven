# Economy sim (3 Nov 2026)

Scripts behind docs/design/economy-review.md, copied from the GM scratchpad: sim.js / sim2.js (player journeys), sim3.js (Daily rhythm as built: before / after per player), spend.js (price tables), dump.js (reads the game tables), journey.md (output). They were run with node from a scratch folder against a checkout of the game; paths inside may need adjusting.

How to run (Daily rhythm, 3 Nov 2026): `window.__econ` is not in the game. Build the harness (`node game/run_tests.js smoke` writes `game/test_merged.html`), copy it to a scratch folder and put `window.__econ = () => JSON.parse(JSON.stringify({ FOOD, TOYS, CLOTHES, HOUSES, BEDS, HM_DECOR }));` in front of `window.__paw = { get S()`; then, in that folder, `NODE_PATH=$(npm root -g) node dump.js <copy.html> tables.json`, `node spend.js` (writes items.json) and `node sim3.js`.
