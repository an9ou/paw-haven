---
name: paw-balance
description: >-
  Check Doodle Doggo's coin economy with the game's own numbers before anything that earns or costs coins ships: a new shop item or
  price, a market or festival stall, a town project, a kind shop coin price, a reward, a daily cap or a change to walk pay, BOOST,
  missions, the Fun Fair or the garden. Runs tools/balance_sim.js for a light, regular and keen player (coins a day, when each thing is
  affordable, when everything is owned) and flags prices under 1 day or over 120 days of a regular player's income, and a garden that
  out-earns walks. Also use when the owner asks how fast players earn or whether a price is right.
---

# Paw balance

`tools/balance_sim.js` loads the built game (scratch copy of `game/test_merged.html` with a read-only `window.__econ` dump injected in
`23_boot.js`'s scope by `tools/paw_sim_lib.js`), reads every table it needs from the running game (BOOST, WALK_FULL, BOND_TH, the shop
tables, HM_DECOR, ROUTES, treasure odds, MS_PAY / MS_CARD_COINS, MSW_COINS, FF_CAPS, PIP_CAP, the crops, ball and agility caps, wishes,
calendar caps, KS_ITEMS / KS_LOOK_COINS / KS_WALK_K, the town level tables LV_*), and simulates a year. Nothing in the game changes.

- **Walk pay is measured**, not guessed: `--measure` plays real runner walks with an autoplayer (`tools/balance_walk.js`: jumps, ducks,
  coin arcs, digs on HOT) and saves the raw results to `tools/balance_walk.json` (committed). The sim adds BOOST, the 5 full-pay walks a
  Japan day then half (pouch whole), treasure pouches as routes run out of treasures, and the Supporter +20% with `--supporter`.
- **Player behaviour** is the `PROFILES` table in the script (walks, care bonuses, mission share, helps, wishes, Fun Fair rounds, toys,
  ball, agility, tricks, garden check-ins, board, stall, photo). Light about 15 min a day (2 walks), regular about 45 (5), keen about 2 h (12).
- **Town level gates the shop** (v2.22, `LV_UNLOCK` / `LV_FLOOR`), with XP from `LV_SRC` capped at `LV_CAP` a day: the dearest houses
  wait for level 19-20, so "everything owned" is often a level wall, not a coin wall. The report shows both.
- What the game does not hold as one constant is in the `ASSUME` table, one row each with its source file:line. Update it there.

## Run it

```
export NODE_PATH=$(npm root -g) PAW_ARGS=--ignore-certificate-errors
node tools/balance_sim.js                                    # all three players, today's game
node tools/balance_sim.js --add .claude/skills/paw-balance/town_projects.json   # with new sinks
node tools/balance_sim.js --profile regular --supporter --days 120
node tools/balance_sim.js --measure                          # re-measure walk pay first (about 10 min: 8 real walks)
```

Other options: `--no-kind` (leave the kind shop coin buys out), `--start YYYY-MM-DD` (garden season), `--json out.json`,
`--tables t.json` / `--save-tables t.json` (reuse a dump, no browser), `--build`. The game is rebuilt automatically when the sources are
newer than the harness. One run takes about 15 s.

`--add` takes JSON: `{ "sinks": [{ "n": "Fountain", "price": 5000, "level": 1, "cat": "project" }], "sources": [{ "n": "Yard visitor tips", "perDay": { "light": 5, "regular": 10, "keen": 20 }, "fromDay": 1 }] }`
(a bare array is a list of sinks; `perDay` may be one number). Sinks join the shopping list (cheapest first) and get a verdict.

Measure again (`--measure`) after any change to `mods/walkrun.js` coins, digs or treasure, or to `finishWalkMod`.

## Read the report

- **Coins a day d1 / d7 / d30 / d90**: earned that day (before food). **Net**: after kibble. **Walks share**: walks' part of income.
- **Level 10 / 20, Bond 10**: when they arrive. **Shop owned**: the always-on-sale shop (no markets, festivals, Tokyo). **Everything
  owned**: shop + kind shop coin buys + `--add` sinks. **Longest wall**: most days in a row with things open but nothing bought.
- **New prices table**: `Days (regular)` = price / the regular player's net a day (days 1-30). `Saved by` = the first day it is affordable
  if it were the only goal. `Bought` = the day it is bought when buying everything cheapest first.
- **Warnings**: a checked price under 1 day or over 120 days of regular income; any player whose garden out-earns walks.

## The design rules to check (CLAUDE.md, docs/design/economy-review.md)

- Walks stay the main income (nominal "about 100 a day"; real income is several times that because of BOOST and repeat walks: say both).
  The garden stays below walks for every player.
- A new price should be a goal, not a glut or a wall: 1 to 120 days for a regular player; big town goals sit at the long end.
- Nothing paid gives power: the Supporter perk is +20% walk coins only; coin packs and the Supporter Pack are never sold for coins.
- Prices players see are real coins (after BOOST): `addCoins(n)` doubles, `addCoins(n, { raw: true })` does not.

Report the numbers (a short table and the verdicts) to the Game Manager, with the command you ran. Write a dated note in
`docs/design/balance-YYYY-MM-DD.md` when the owner asked for a check. Price changes themselves go through the normal release path.
