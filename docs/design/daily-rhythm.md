# Daily rhythm: one mission a day, daily bonuses once a real day, a slower game clock (owner, 3 Nov 2026)

Source: the economy review (Claude Doc https://claude.ai/artifact/5nkGvPomNM4QzPVC2j32pK; markdown docs/design/economy-review.md on branch `claude/kind-shop`, commit 8b8c6b56, local worktree /home/user/paw-haven-shop; sim scripts in the GM scratchpad econ/). Findings: BOOST (coins x2, Bond x3, naps x6) is live; walks have no limit (~30 coins a real minute; ~300 / 1,300 / 4,400 coins a day at 10 / 30 / 90 minutes vs the design's ~100); "daily" bonuses reset every game day (24 real minutes); everything for sale (28,830) is owned by day 9 / 28 / 60.

## Decided
1. **One daily mission per real day, reset at 00:00 JST** (owner). Pay 40 coins (before BOOST, as MS_PAY is today: check), a stamp for each finished mission, the 7-stamp card stays (its 3rd reward becomes 150 coins + a Pupcake), one free swap a day. The pool favours tasks that make a small story. Mission income stays about 57 a day; light players get more than today. Update the card art and texts (1/1, "one mission a day"), the HUD clipboard count, Gerald's guide lines and the calendar if they mention three.
2. **Daily bonuses once a real (JST) day** (owner): the care bonus, Town Square goal, trick coins, beach dig and every other "daily" reset that runs on the game day move to `dailyCheck()` on `jstISO()`. **Walks: full coins for the first 5 walks a JST day, half after that** (owner chose this option, which included it). Players under an hour a day lose 0–7%.
3. **Game clock (owner: "you decide"; GM decided on the review's recommendation): a game day = 1 real hour.** `GAME_SEC = 2.5` used in `tick()` and `applyAway()`, `BOOST.nap` 6 → 15, no save change. Hunger drops 2.4 a minute instead of 6, a pee break every 10–15 minutes. Day/night, weather, ageing and the garden already follow the real clock: verify. Check every "N game hours" text (food notes, perks such as the Sailor Collar) still reads right.

## Not chosen (for later, owner may revisit)
Town projects (Fountain 5,000 … Lighthouse 25,000) and garden plots 7–9; more festivals (Sakura Market, a summer festival, a weekly Market Street special); slower Bond (x3 → x2).

## Shipping
A normal update (not a festival): build on its own branch after the v2.19 release (Sat 7 Nov), new texts translated once in all 12 languages (incl. yue), suites: missions (v24*), smoke, i18n, i18n_fit subsets, the balance sim, v219_friends (daily limits share the JST day). Tell players in the news (49c_news.js NEWS entry). Then it ships once green (small-update rule).
