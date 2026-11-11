---
name: paw-playtest
description: >-
  Play the real Doodle Doggo build as a light, regular and keen player over a simulated week (or up to 30 days) and report, day by day,
  coins, Bond, town level, what was bought, which windows and letters appeared, what was affordable but left, missions and helps the
  player could not do, and where each player gets bored, stuck or runs out of things to do, plus console errors. Use after a feature
  release or a branch is green, before asking the owner for a go-ahead, and when tuning pacing (levels, prices, unlocks, daily limits).
  Findings go to the Game Manager, not straight into code.
---

# Paw playtest

`tools/playtest.js` drives the test harness build (`game/test_merged.html`, rebuilt when the sources are newer) in Playwright Chromium.
It switches on every feature that is live in the shipped game but off under the harness (the `prefs.*Test` flags, `LIVE_PREFS` in
`tools/paw_sim_lib.js`; Friends and cloud save stay off: they need the Worker). One fresh save per profile, adopted through the real
title and adoption screens (a 3-month puppy, as for players).

Each day: the page clock moves on 24 hours and the page reloads (so mail, needs, the garden and the 00:00 JST resets happen as for a
returning player), the player taps Continue, then runs the profile's session:

| | Light (15 min) | Regular (45 min) | Keen (2 h) |
|---|---|---|---|
| Mailbox, feed, pet | yes, feed once | yes, feed twice, outfit | same |
| Walks (route carousel) | 2, the default route | 5, open routes in turn | 9, open routes in turn |
| Daily mission / helps / wish | tries / 1 / yes | tries, free swap / 2 / yes | same |
| Fun Fair rounds, travel | none | 2, a place every 2nd day | every open game, a place every 2nd day |
| Shop (all shop screens, cheapest first) | 1 thing, keeps 60 | 2, keeps 80 | everything, keeps 100 |

Real UI: feed tray, petting, naps (Care, Bed), the route carousel, the map, the shops and the purchase window, the mailbox list.
The game's own functions (`window.__paw`): mail Collect, putting on an outfit, Fun Fair rounds (start, end with a fair score, back).
**The runner is not played**: each walk starts for real and is ended through the runner's own `onEnd` with a measured walk's coins
(`tools/balance_walk.json`, see the paw-balance skill), and the game rolls the treasure dig or the junk. All pay, Bond, level, mission and
daily-limit rules are the game's. Not played: bath, tricks, ball, garden, kitchen, photo, agility, Tokyo. A mission or help that needs one
of those is listed as "the script cannot play it", which is a tool limit, not a player problem (unless it repeats for days).

## Run it

```
export NODE_PATH=$(npm root -g) PAW_ARGS=--ignore-certificate-errors
node tools/playtest.js --out <scratchpad>/playtest.md                 # 7 days, all three side by side, desktop (about 35 min)
node tools/playtest.js --profile regular --days 14 --phone --shots <scratchpad>/shots
node tools/playtest.js --start 2026-12-01 --days 3                    # e.g. the Winter Market week
```

`--days N` (1-30), `--profile light,regular,keen`, `--phone` (360x640), `--shots [dir]` (a screenshot per profile per day),
`--out file` (else stdout; rewritten as each profile finishes, so a stopped run still leaves a report), `--start YYYY-MM-DD` (festivals
and markets follow the date), `--build`. Run it in the background with a long timeout (`run_in_background`, timeout 7200000: the
default 30 min background limit stops a 7-day run) and keep one copy running at a time.

## Read the report

Per profile, a day table: coins start and end, what was bought, town level (XP), Bond, mission and helps done, the windows and letters
that opened (titles), and what was new that day. Then **Bored / stuck**:

- "nothing new today": no level, no Bond level, nothing bought and no letters. Two or more in a row is a pacing gap.
- "N coins and nothing to buy (M locked)": a coin glut or a level wall; compare with `node tools/balance_sim.js`.
- "the same session as yesterday": the same actions and outcomes with nothing new.
- "walk: blocked", "travel X: did not arrive", "STUCK a window would not close": the player could not do something; check by hand.
- Missions or helps "not done (the script cannot play it)": a tool limit; flag it only if a player-facing task is impossible.
- **Console errors**: any page error or console error while playing. Always worth a look.

Send the findings to the Game Manager (a short list: profile, day, what happened, why it matters, a suggestion). Do not change game code
from a playtest; the GM decides. A dated copy for the owner goes in `docs/reviews/playtest-YYYY-MM-DD.md`.
