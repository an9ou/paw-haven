# Balance options, 13 Nov 2026 (release branch `claude/release-26-29`, live 19 Nov)

For the owner to decide. No game code was changed. This re-checks the 11 Nov playtest findings (`docs/reviews/playtest-2026-11-11.md`,
F1-F5, played on main before v2.26-v2.29) against the four releases that go live together on 19 Nov, and gives options for what is still open.

How the numbers were made: `node tools/balance_sim.js --add .claude/skills/paw-balance/town_projects.json --start 2026-11-19` on a scratch
copy of the branch. The four features are dated 19 Nov, so the table dump (13 Nov) misses the yard toys: they were added with `--add`. A
scratch copy of the sim also modelled Story mode (the 8 chapters' coins and XP, outside the cap, with their level and Bond gates; pace
assumed: light one chapter every 2 days, regular one a day, keen two a day), XP cap variants, and a "2 buys a day" shopper like the
playtest. `tools/balance_sim.js` itself is unchanged. The sim is a little kinder than the real game (the playtest's regular player was at
level 6 on day 7, the sim says 8), so read the days as "about".

## 1. Where each finding stands

| Finding (11 Nov) | What the release changes | Verdict |
|---|---|---|
| F1 Regular players hoard ~1,800 by day 7, nothing mid-price before level 13 | v2.26: 4 yard toys at **level 1** in Barkitecture, 300 / 600 / 900 / 1,500 (3,300). v2.27: the project board in the Town Square from day 1, any amount, 55,000 in all. Story chapter 3 (day 2-5) sends the player to the Square. Kind shop looks (12 x 1,500) were already level 1. Story XP brings level 13 (the first 1,200+ shop item) from day 21 to **day 13** (regular), 48 to 30 (light). Story coins (1,370 once) add a little to the pile. | **Mostly fixed**, if players see the board and the looks |
| F2 The 150 XP cap: 2 hours a day levels like 45 minutes | Story mode (1,170 XP) and the neighbour stories (4 x 40) sit outside the cap. Keen reaches level 10 on **day 5**, regular day 7 (both day 11 before). After week 2 both climb at 150 a day again: level 20 on day 47 for both. | **Partly fixed** (first two weeks only) |
| F3 Keen walk "did not start" twice | Not a game bug: see section 3. | **Closed** (tool fix) |
| F4 Many daily missions need a minigame or a trip | Pool unchanged. Story chapter 3 asks "finish the day's mission" and chapter 6 a pool paddle and an agility run, so a light player's story can now wait behind a minigame mission. | **Open, slightly worse** |
| F5 Light players get no letters on days 2-6 | v2.28 neighbour stories start at Bond 3 (light: day 2-3), one letter a day at most, the next step 3 days after the request. v2.25 While you were out page each return (4+ h), v2.26 a yard visitor each return (1 a day even with no toys), v2.29 a chapter and its scene about every 2 days. Light mail: ~day 3 Mrs Plum 1, ~day 6 Mrs Plum 2, day 7 Rosa 1 and "7 days together". | **Mostly fixed**; days 4-5 have no letter but do have a visitor, the page and a chapter |

The pace with and without the release (shop + kind coin buys + yard toys + projects, buying cheapest first):

| | Light | Regular | Keen |
|---|---|---|---|
| Net coins a day, days 1-30 (unchanged) | 311 | 930 | 2,019 |
| Walks' share of income / garden a day (unchanged) | 54% / 25 | 64% / 51 | 74% / 58 |
| Level 10: before / with Story | day 26 / 13 | day 11 / 7 | day 11 / 5 |
| Level 20: before / with Story | day 120 / 102 | day 55 / 47 | day 54 / 47 |
| Everything owned (with projects) | day 283 | day 117 | day 59 |

No sim warnings: every new price is 1-120 days of a regular player's income (yard toys 0.3-1.6 days, projects 5.4-26.9). The garden stays
below walks for every player. Yard visitor coin gifts are 10 a week at most.

## 2. Options for what is still open

### F1 Hoarding (mostly fixed: what is left is finding the goals)

| Option | What | Light / regular / keen | Risk |
|---|---|---|---|
| **A (Recommended)** | No price change; show the goals. (1) When chapter 3's Town Square task is done, Gerald's line points at the board: "The town is saving for a fountain. Any coins help." (2) A last row "Kind shop: looks for 1,500 coins" in the Boutique list that opens the kind shop on the looks. (3) The tomorrow line (v2.25), once a day while coins are 1,000+: "The Fountain is 40% there." | With half their coins going in, the Fountain is done about day 32 (light), day 11 (regular), day 5 (keen) | None: words and one row (3 new strings for the translation batch) |
| B | Open four big houses earlier: Camper Van (1,200) level 13 to 8, Snow Igloo (1,500) 14 to 9, Pumpkin Cottage (1,800) 15 to 10, Treehouse Den (2,500) 17 to 12 | A first 1,200+ house about day 5 for regular (with Story), day 9-10 for light, day 3 for keen | Levels 13-15 open less; changes the v2.22 unlock baseline (suite `v222_levels`) |
| C | The weekly Market Street special (improvement plan D): 3 items at 300-900, a new set every Monday from a pool of 30 | A steady small goal for everyone | Big: art for 30 items; its own release |

### F2 The XP cap (fixed for two weeks, then flat again)

The cap is not the main limit. A keen player's raw XP is about 195 a day against a regular player's 164: walk XP stops after 5 walks
(`LV_SRC.walk` = `WALK_FULL`) and every other source has its own daily count. So raising only the cap barely separates them.

| Option | What | Level 20 day: light / regular / keen | Risk |
|---|---|---|---|
| **A (Recommended)** | Keep `LV_CAP` 150. Story mode and the stories already speed up week 1-2. Change the "That is all the growing for today" line to point at goals that are not levels: "More tomorrow. The Visitors Book and the town projects never stop." | 102 / 47 / 47 | None. Keen players keep their level 13-20 rewards spread out; their long goals are projects and Bond stars |
| B | Soft cap: past 150, XP counts at half up to 200 a day; walks 6-10 give half walk XP | 102 / 45 / 39 | Keen owns the shop on day 39 instead of 48, then only projects are left (done day 59 anyway) |
| C | `LV_CAP` 200 and walks 6-10 give half walk XP | 102 / 43 / 36 | Regular also faster; keen reaches the level wall and Crayon stars (`LV_STAR`) 11 days sooner |

Light players never reach the cap (about 67 XP a day), so no option changes them. Walk coins do not change in any option.

### F4 Missions that need a minigame or a trip (open)

Hand count at town level 5 (light player, about day 6, no festival): 14 of about 30 eligible missions are a trip or a minigame (Dog Park,
Mt. Fuji twice, Splash Pool twice, Training Ground three times, the Fun Fair, a town job, the photo contest, cooking twice, a trick show in
the Square), all at weight 3: about **55%** of the draw. The free swap draws from the same pool, so it lands on another one about half the time.

| Option | What | Light / regular / keen | Risk |
|---|---|---|---|
| **A (Recommended)** | The free swap draws only "home" missions: walk, a fresh route, a dressed walk, toy, new toy, bath, outfit, photo, buy, new snack, feed new, treasure, wish, decorate, plant, water, harvest, café | Light: the mission done about 6 days in 7 (3 before), a full stamp card every ~8 days, not ~16; +40 coins on ~3 more days a week (+17 a day, walks still 51% of income). Regular / keen: no change unless they swap. Story chapter 3 no longer stalls | Small; the day's first draw still shows the town |
| B | New players: trip and minigame missions weight 3 to 1 until town level 8 (light about day 16, regular day 5-7) | Light ~5 days in 7; regular and keen keep variety from week 2 | Fewer reasons to visit new places in week 1 (the story's first visits partly cover it) |
| C | Three easy weight-3 missions from the new features: "Pet a yard visitor" (after one is met), "Look at the town project board", "Watch a page in Memories" | Light ~4-5 days in 7 | 3 strings x 12 languages; "pet a visitor" depends on someone coming that day |

### F5 Quiet mail for light players (mostly fixed)

| Option | What | Light / regular / keen | Risk |
|---|---|---|---|
| **A (Recommended)** | No new letters now. Re-run the playtest with `--start 2026-11-19` (the four features are dated then) and count letters on days 2-6 | (as section 1) | None |
| B | Mrs Plum's story starts at Bond 2 (light: day 1-2) and `ST_GAP` is 2 for her first three steps | Light letters about days 2, 4, 6; regular / keen finish her story about a week sooner | Story 1 can arrive on the same day as the first-week welcome letters (one story letter a day still holds) |
| C | Two short Gerald postcards on play days 3 and 5 (no coins), skipped if another letter came that day | One letter every day in week 1 | Two new letters x 12 languages |

## 3. "Walk did not start" (F3): verdict and proposed fix

**Not a game bug; it is the playtest script.** Reproduced on this branch: see the last line of this section.

- The starter puppy is 3 months on day 1 and grows a month a day. Under 6 months it may walk Sunny Park only (`walkBlock`,
  `game/src/16b_puppy_play.js`). On days 2 and 3 it is 4 and 5 months old; from day 4 it can walk everywhere.
- The route carousel (`ROUTE_KEYS`, 10 routes sorted by level) has the Town Loop second (index 1). For a puppy its button reads "Not for
  {name} yet" and is marked `aria-disabled="true"`, not `disabled`. Pressing it gives a "Nope" toast (`startRoute`), which goes after
  `TOAST_MS` = 2.9 s.
- The keen script tries routes from card `(walk number + day) % 10` and skips cards whose button is `disabled` or says "Locked". The
  Town Loop card is neither, so it presses Start, waits 15 s for the walk, then reads the toasts, which are gone by then: "no toast".
- That card comes up only when walk number = 11 - day: walk 9 on day 2 and walk 8 on day 3, once each, late in the session. Regular
  (5 walks) and light (Sunny Park only) never hit it. Sleep, low energy (`energy < 20`) and level locks also stop a walk, but each shows
  its own toast; nothing in `startRoute` or `go('walk')` depends on long sessions or timers.

Proposed fix (in `tools/playtest.js`, not made): treat `aria-disabled="true"` as blocked in the route loop and the check before Start, and
read the toast right after pressing Start (or spy on `nope()`), so a real block reports as "walk: blocked (Not for {name} yet)". No game
change is needed. Optional polish: a small line under a puppy's Start button, "Puppies walk Sunny Park until 6 months".

Repro (`node tools/playtest.js --profile keen --days 3 --start 2026-11-11` on a scratch copy of this branch): "walk: did not start" on day 2 and day 3, once each, no toast and no console errors, exactly as the
cause above predicts (none on day 1; from day 4 the puppy is 6 months, so it cannot recur). The same run also saw the day-3 free swap land on "Visit the Dog Park" (F4).
