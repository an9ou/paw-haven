# Doodle Doggo economy review (3 Nov 2026)

Full version with charts: the Claude Doc "Doodle Doggo economy review" (https://claude.ai/artifact/5nkGvPomNM4QzPVC2j32pK). This file is the plain copy.

Players earn far more than the design says, so coins stop mattering within weeks. The fix is mostly new, lovely places to put coins, plus making daily bonuses truly daily.

## Summary

1. **The BOOST is live.** Walk coins are doubled, Bond tripled and naps six times faster in the shipped game, not only in tests.
2. **Walks have no limit.** A nap refills Energy in about 20 seconds, so walks pay about 30 coins a real minute (about 63 a walk), rising to about 70 a minute once treasure pouches start. The design target is "about 100 a day"; real players earn about 300 (10 minutes a day), 1,300 (30 minutes) or 4,400 (90 minutes).
3. **Daily bonuses reset every 24 real minutes**, because they follow the game day. A 90-minute session collects them about 4 times.
4. **Everything sold all year costs 28,830 coins.** A keen player owns it all by day 9, a regular player by day 28, a light player by day 60.
5. **Bond 10 comes in the first week or two**, and the year has no market or festival from 8 January to 1 October.
6. **The +20% walk perk** adds 13 to 16% income uncapped, 1 to 7% with a +40 daily cap. The kind shop's coin prices (16,200 in all) help more.

**First 3 changes:** (1) daily bonuses once a real day and "happily tired" walks after 5 a day; (2) town projects (55,000 coins) and garden plots 7 to 9 (7,000); (3) finish the Sakura Market and add a summer festival, with a weekly Market Street special.

## How players earn

Why walks are not limited today:

- The BOOST (`coins: 2, bond: 3, nap: 6`) is a fixed setting in the shipped game.
- Energy is not a limit: a walk needs 20 and costs 15 to 30; a nap gives about 120 a real minute.
- Route length does not change coins: the runner places 24 to 32 coins on every route, so the 60-second park pays like the 90-second beach.
- Many "daily" bonuses reset every game day (24 real minutes).

| Source | Pay (as the player sees it) | Real time | Limit | Coins per real minute |
| --- | --- | --- | --- | --- |
| Walk (runner) | about 63 (86 without a treasure, about 40 plus an item with one) | about 2.2 min with screens and nap | none | about 29 |
| Walk, later on | +88 average when a treasure dig gives a pouch | same | none | about 70 |
| Care bonus (first feed, pet, play) | 20 each | 1.5 min | once a game day | 40 |
| Trick show in public | 6 to 10 a trick, up to 100 | 2 min | 10 tricks a game day | 50 |
| Town Square goal | 30 | 1 min | once a game day | 30 |
| Beach dig | about 17 | 0.5 min | once a game day | 34 |
| Fun Fair (5 games, 3 jobs) | 8 to 15 a round | 1 to 2 min | 125 a real day in all | 8 to 10 |
| Toy games | small | 1 min | 30 a Japan day | about 10 |
| Ball play | 2 to 3 a return | 3 min | 16 a game, 40 a day | 6 to 8 |
| Agility | 10 / 20 / 30, first two runs | 1.5 min | 40 a day | 10 to 15 |
| Garden (Pip) | 27 to 37 a day net | check-ins | Pip buys 60 a day | |
| Saturday stall | crops, dishes | 2 min | 40 a Saturday | |
| Photo contest | up to 10 a photo | 2 min | 30 a week | |
| Missions | 15 each, 3 a day | while playing | 45 a day | |
| Mission card (7 full days) | Helmet, Rocket Ship, then 120 + Pupcake | | about 17 a day | |
| Daily wish | 10 | while playing | 20 a day | |
| Mailbox gift | 10 to 25 (60% of days) | | about 10 a day | |
| Calendar and daily gift | 3 to 50 | | about 8 a day | |
| Festival extras | 10 | | once a day in season | |
| Friends (not live) | 20 a friend walk | | 40 a day (notes say 20; doubling makes 40) | |
| One-offs | 150 start, 1,000 secret dig, 100/300/800 at 5/15/30 coats | | once | |

Bond: about 60 points a walk; Bond 10 (3,200) on day 2 to 3 (keen), about day 7 (regular), about day 15 (light).

## How players spend

| Group | Items | Cheapest | Middle | Dearest | All of them |
| --- | --- | --- | --- | --- | --- |
| Houses (Bond 2 to 9) | 10 | 300 | 1,200 | 5,000 | 17,200 |
| Beds | 7 | 150 | 350 | 2,000 | 4,280 |
| Decorations | 21 | 60 | 100 | 360 | 2,930 |
| Clothes | 21 | 45 | 90 | 250 | 2,170 |
| Toys | 11 | 40 | 90 | 150 | 1,050 |
| Gene Sniffer | 1 | 1,200 | | | 1,200 |
| **Always on sale** | **71** | | | | **28,830** |
| Winter Market (1-26 Dec, yearly) | 25 | 45 | 80 | 900 | 3,850 |
| Festival stalls | 11 | 50 | 60 | 120 | 800 |
| Halloween 2026 only | 43 | 45 | 80 | 900 | 5,480 |
| Tokyo souvenirs | 5 | 60 | 60 | 150 | 410 |

Repeat costs: kibble 5 (about 1 coin a minute of play), treats 4 to 60, café 12, vet 30, salon 40, gene test 60, portrait 500, Tokyo ticket 60, omikuji 10, seeds and pantry 2 to 8.

## Three player journeys (model: scratchpad `sim.js`, measured walk pay)

| Player | Day | Earned so far | Earned that day | Items owned (of 71) | Bond |
| --- | --- | --- | --- | --- | --- |
| Light (10 min, 3 walks) | 1 / 7 / 30 / 90 | 309 / 2,364 / 12,430 / 46,890 | 309 / 359 / 510 / 580 | 8 / 32 / 64 / 71 | 3 / 7 / 10 / 10 |
| Regular (30 min, 6 walks) | 1 / 7 / 30 / 90 | 624 / 5,926 / 33,862 / 112,658 | 624 / 973 / 1,304 / 1,344 | 12 / 52 / 71 / 71 | 4 / 10 / 10 / 10 |
| Keen (90 min, 22 walks) | 1 / 7 / 30 / 90 | 1,970 / 24,612 / 125,122 / 387,374 | 1,970 / 4,387 / 4,361 / 4,401 | 27 / 70 / 71 / 71 | 7 / 10 / 10 / 10 |

| Item | Price | Light | Regular | Keen |
| --- | --- | --- | --- | --- |
| Camper Van | 1,200 | day 30 | day 14 | day 5 |
| Royal Canopy Bed | 2,000 | day 42 | day 19 | day 6 |
| Lighthouse Kennel | 3,000 | day 51 | day 24 | day 7 |
| Royal Castle Kennel | 5,000 | day 60 | day 28 | day 9 |

- Walls: only the light player saving for houses, up to 8 days without a new buy.
- Coin glut: keen from day 9, regular from day 28, light from day 60.

| Paid shop proposal | Light | Regular | Keen |
| --- | --- | --- | --- |
| +20% walk coins, no cap: income | +16% | +13% | +15% |
| +20% walk coins, at most +40 a day | +7% | +3% | +1% |
| Kind items also for coins (16,200): everything owned on | day 89 (was 60) | day 40 (was 28) | day 12 (was 9) |

## Reasons to come back, and the gaps

Daily: wishes, missions, mailbox, calendar, Pip, Fun Fair/toy/ball/agility caps, vet, café, Hachikō, omikuji, crops (2 to 6 real hours), letters. Game day: care bonus, Square goal, tricks, beach dig, diary page. Weekly: photo contest, Saturday stall, Gerald's news, the stamp card. Long term: Bond 1-10, 84 stickers on 14 pages, coats and genetics, 25 treasures, 7 Tokyo stamps. By date: Harvest and leaf (Oct-Nov), Halloween (8 Oct-2 Nov), snow (Dec-Feb), Winter Market (1-26 Dec), New Year (27 Dec-7 Jan), Sakura (25 Mar-10 Apr, still empty).

Gaps: (1) coins stop mattering after day 9 / 28 / 60; (2) Bond 10 is a first-week goal; (3) no market or festival from 8 Jan to 1 Oct; (4) game-day bonuses reward long sessions, not return visits; (5) the shop never changes; (6) no welcome-back gift; (7) coin rewards feel flat late on.

## Recommendations

| # | Change | Numbers | Impact | Effort |
| --- | --- | --- | --- | --- |
| 1 | Daily bonuses once a real day (00:00 JST) | light/regular -0 to 7%, keen about -570 a day | High | Small |
| 2 | Happily tired walks: first 5 a day full coins, then half (Bond, treasures full) | keen 4,400 to 2,650 a day with 1 | High | Small |
| 3 | Town projects, any amount, progress board | Fountain 5,000, Bandstand 10,000, Sakura Avenue 15,000, Lighthouse festival 25,000 | Very high | Medium |
| 4 | Garden plots 7 to 9 | 1,000 / 2,000 / 4,000 | Medium | Small |
| 5 | Coin prices for kind shop items | 12 x 600, tools 2,500 / 2,500 / 4,000 | Medium | Small |
| 6 | A market every 6 to 8 weeks | Sakura, Rainy Season, Summer Matsuri (15 Jul-31 Aug), Tsukimi; about 3,000 coins of stock each, yearly | Very high | Large |
| 7 | Weekly Market Street special | 3 items from 30, 300 to 900, back in rotation | High | Medium |
| 8 | Bond stars after Bond 10 | a star per 5,000 points, keepsakes at 5 and 10 | Medium | Small |
| 9 | Welcome back after 3+ days | Gerald's letter, treat bag, 100 coins; a "memories" stall | Medium | Small |
| 10 | Cap the +20% perk | +40 a day | Low | Small |
| 11 | Outfit colours | 3 colours x 63 outfits x 100 | Medium | Large |
| 12 | Fix the balance sim (naps, measured walk) | "about 100 a day" is really 300 to 4,400 | Prevents drift | Small |

With 1 to 5, everything is owned around day 197 (light, with project progress all along), day 96 (regular), day 45 (keen); light and regular income barely moves.

## One daily mission (owner's change)

One mission a Japan day (reset 00:00 JST), **40 coins**, **a stamp each time**. The 7-stamp card keeps the Astronaut Helmet and Rocket Ship, then 150 + a Pupcake, with a mission-only photo frame every third card. Mission income: regular about 62 a day today, about 57 after; light about 30 today (no stamps), about 57 after. Favour tasks that make a small story (a route not walked this week, a Fun Fair game, cook, harvest, the stall on Saturdays, the photo contest, a festival task, Tokyo, a friend's yard, the weekly special); drop the ones that happen anyway (feed twice, pet, nap, scoop, read a letter). A free Swap once a day. Code: `msPick` returns 1, `localISO` to `jstISO` in `msRoll`, `MS_PAY = 40`, the "all three" text.

## The game clock

**Recommendation: a game day = 1 real hour (2.5 real minutes per game hour), naps as fast as today, daily bonuses on the real day.** The clock on screen, day and night, weather, seasons, festivals, ageing, garden and buffs already use the real clock. Game time drives needs (Hunger -6, Happiness -3 to -4, Cleanliness -3, Energy -2 per game hour; naps +120), timers (water 2 game hours, pee every 4-6, poop 30-90 min after a meal, toy freshness, trick focus, Pupcake, cool/warm treats, salon and glow 1 game day, leaf piles and drifts) and the game-day resets.

| | A: today (1 min) | B: 2.5 min (day = 1 hour) | C: 5 min (day = 2 hours) |
| --- | --- | --- | --- |
| Game days in 10 / 30 / 90 min | 0.4 / 1.25 / 3.75 | 0.17 / 0.5 / 1.5 | 0.08 / 0.25 / 0.75 |
| Kibble needed in 10 / 30 / 90 min | 2 / 6 / 18 | 1 / 2.5 / 7 | 0.5 / 1 / 3.5 |
| Pee break every | 4-6 min | 10-15 min | 20-30 min |
| Income if bonuses stay per game day (light / regular / keen) | today | same / -2% / -11% | same / -2% / -13% |
| Feel | busy | calm | care nearly disappears |

Exact changes for B: `const GAME_SEC = 2.5;` beside BOOST in `game/src/00_core.js`; `BOOST.nap` 6 to 15; in `game/src/21_time_loop.js` `tick()` use `S.gameMin += dt / GAME_SEC; const h = dt / 60 / GAME_SEC;` and in `applyAway()` `secs / GAME_SEC`; `dailyCheck()` resets on `jstISO()` (keep `day()` for the Day N counter); the `settings.economy` text reads the constant. No save change.

## Sources

Branch `claude/kind-shop`. Prices dumped from the running game's tables; walk pay measured with an autoplayer (park 130 and 32, river 86, beach 124).

- BOOST, Bond thresholds, start coins: `game/src/00_core.js`:8, 11, 763; addCoins and bondMult: 1369-1374; game day and daily bonuses: 1064, 1381-1385; real clock, JST, festivals: 1076-1100, 1156-1161
- Walk: `game/src/09_walk_classic.js`:35; `game/src/18_mod_walk_toys.js`:6-40; `mods/walkrun.js`:528, 858-861, 892, 911, 1293-1301; junk and pouches `game/src/11_garden_kitchen.js`:191-193, `game/src/00_core.js`:255-256, `game/src/09_walk_classic.js`:16-28; routes `game/src/00_core.js`:243-251, `game/src/14_town_places.js`:9-11
- Energy and naps: `game/src/17_walk_route_carousel.js`:49; `game/src/03_yard.js`:835; `game/src/21_time_loop.js`:2-30
- Tricks `game/src/15_trick_training.js`:114-120; beach and secret dig `game/src/03_yard.js`:513, 570-574
- Fun Fair `game/src/49_funfair.js`:19-24, 77, 93-97, 348, 381; ball `game/src/38_ball.js`:10; agility `game/src/44_agility.js`:19-20; Pip `game/src/11_garden_kitchen.js`:107-110, 254 and `game/balance_v171.js`
- Missions `game/src/24_missions.js`:4, 84-131; wishes `game/src/48_dogdays.js`:17, 90; mailbox `game/src/07b_mailbox.js`:121-126; calendar `game/src/47_firstweek.js`:193, 218, 293; coats `game/src/07_treasure_journal.js`:222-331; Friends `game/src/50_friends.js`:8, 1429, 1530; parade and sweater `game/src/26_festival.js`:431, `game/src/31_winter.js`:260
- Prices `game/src/00_core.js`:13, 56, 91, 170; `game/src/12_popups_beds_map_snacks_potty.js`:31; `game/src/03_yard.js` (HM_DECOR); `game/src/05_market_shops.js`:160; services `game/src/14_town_places.js`:86-121, `game/src/14b_vet_playboard.js`:71, 220, 247; Tokyo `game/src/39_tokyo.js`:12, 492-534; markets `game/src/49_market.js`:21-41
- Timers `game/src/12_popups_beds_map_snacks_potty.js`:133-134; `game/src/03_yard.js`:707, 760; `game/src/15_trick_training.js`:18
- Current balance check `game/test_v215_tracks.js`:153-220; paid shop `docs/design/kind-shop.md`:24-45
