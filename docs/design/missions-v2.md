# Missions v2: daily, progress and growing missions (design proposal, 4 Nov 2026)

Owner's ask (4 Nov 2026): "I think we can make a reference with other games, they will have some daily missions to keep players engaged. Also have some progress missions. We can design a bunches of growing mission or new player missions."

Status: proposal only. No game code is changed. It builds on v2.19.2 "Daily rhythm" (`docs/design/daily-rhythm.md`), which cut missions to one a Japan day after the economy review (`docs/design/economy-review.md`). That cut was about **coins**, not about having things to do. This design adds things to do and pays mostly in things that are not coins.

## 1. What exists today

| System | Where | What it does | Resets |
| --- | --- | --- | --- |
| Daily mission | `24_missions.js`, `S.missions` | One story mission (pool `MS_POOL`, weight `w` 3 / 1 / 0), 40 raw coins and a stamp, one free swap, 7-stamp card (Astronaut Helmet, Rocket Ship, then 150 + Pupcake) | 00:00 JST (`jstISO()`) |
| Gerald's guide | `25_guide.js`, `S.guide` | Old saves: first-day walkthrough `GD_STEPS`; Journal > How to play (8 lessons) | once |
| Puppy's first day | `47_firstweek.js` `FW_STEPS`, `S.fw` | New saves: pet, feed, ball, name tag, walk; Bond 2 at about minute 6 | once |
| Next unlock line, Bond 2 party | `47_firstweek.js` `fwNextSync`, `fwParty` | "Bond 3: ..." under the Bond meter; a free small item at Bond 2 | once a dog |
| Welcome week and monthly calendar | `47_firstweek.js` | A paw for each day played; gifts at days 1/3/5/7 and 3/7/12/18/24; days never need to be in a row; daily gift | local day / month |
| Daily wish | `48_dogdays.js` | One wish a dog a day, double Bond, 10 coins (20 a day at most) | local day |
| Bond track | `48_dogdays.js` | Bond 1-10 with what each opens; frames at 3/5/7, Crayon Crown and Golden Collar at 10 | lifetime |
| Diary, sticker book | `48_dogdays.js`, `49_funfair.js` | A diary page a Japan day; 14 pages of 6 stickers, a full page gives an outfit or a frame | lifetime |
| Letters | `48_dogdays.js`, `07b_mailbox.js` | Gerald's weekly news, letters from puppy families | weekly |
| Fun Fair | `49_funfair.js` `FF_CAPS` | 8 games and jobs with day caps; Saturday stall and photo contest weekly | JST day / local week |
| Titles, coats, treasures | `07_treasure_journal.js` | `titleGive()` into `S.titles`; `COAT_MILESTONES` (5/15/30 coats: 100/300/800 coins, titles, Rainbow Collar); 25 treasures in `S.found` | lifetime |
| The act bus | `00_core.js` `trackAct(kind, data)` | Every hook below listens on `on('act', ...)` | |

Act kinds that fire today: walk (area), feed / water (name, dogs), pet, nap, bath, scoop, toy, fetch, wear, trick (name, grade, learned), garden (plant / water / harvest), cook (dish, stars), buy (shop, cat, name), mail, collect, treasure, photo, travel (place), ride, stamp, gaze, paddle, floatfetch, sprinkle, agility (rosettes, low, name), funfair (game), leafpile, parade, sweater, snowdrift, snowdog, fortune, house, furniture, decorate, nametag, paw, adopt.

Lifetime counters already in the save: `S.walks`, `S.found`, `S.collection` (coats), `S.ph.n` (photos), `S.ff.n` (Fun Fair rounds per game), `S.dd.wn` (wishes), `S.dd.pv` (places and routes visited), `S.dd.cnt` (agility, paddles, festival acts, days with a paw), `S.tk.stamps`, `S.missions.stamps` / `cards`, `S.titles`. Missing: harvests, dishes, baths, trick practice, ball and toy play, missions done.

Already a "monthly challenge": the calendar. Already a "beginner day": Puppy's first day. Already a "long track": Bond 1-10, but it ends in week 1-2. The gaps are: one daily line is thin for a player who wants a small list; nothing spans a week; nothing long-term after Bond 10 except stickers and coats; days 2-14 of a new player have no path.

## 2. Reference patterns

Game types are described generically.

| Pattern | Example game type | Borrow | Avoid |
| --- | --- | --- | --- |
| 3 daily quests + chest | Language-learning app | A short list, one easy item, a small "all done" chest | Streak guilt, paid streak repair, nagging notifications |
| Daily activity points | Mobile RPG / gacha | Partial credit; any mix of tasks fills the bar | 8 chores ("log in", "spend stamina"), currency floods |
| Monthly challenge badge | Language app, fitness app | A month-long badge from normal play | A badge that is lost if one day is missed |
| Weekly quests, any 3 of 5 | Shooter season pass, MMO weeklies | Flexible week; pick what you like | "Win 50 matches" grinds, a hard Monday wall |
| Tiered achievements | Console trophies, PC achievements | Lifetime counters, bronze / silver / gold, a visible bar, titles | Missable one-shots, absurd numbers, hidden lists |
| Lifetime miles list with titles | A cozy island-life game | Tiers on everyday actions; a title to show off | Making it the main currency |
| 7-day beginner quest list | Mobile MMO | A guided path that opens the world step by step | Login-only rewards, "only on day 3", expiry after 7 days |
| Story research chains | AR creature-collecting game | Pages of steps told by a character (Gerald) | Time-limited chains |
| Villager requests / help-wanted board | Cozy farm and life sims | Named neighbours ask small favours; thank-you letters | Requests that expire with a sad face |
| Free season pass | Many live games | A sticker page per season | Paid track, XP grinding, tiers that vanish |
| No-loss calendar | Cozy games | Days never need to be in a row (we already do this) | Streak counters of any kind |

Anti-patterns for Doodle Doggo, all ruled out: FOMO (nothing expires with a loss; a missed day just brings a new one), punishing streaks (no streak counter anywhere), chores that feel like work (no "feed twice"; the small rows are one tap of kindness), coin inflation (most rewards are cosmetic or consumable), noise (one quiet dot, batched toasts), leaderboards, and anything that rewards more puppies (welfare: litters are never a goal, so no puppy counter).

## 3. Recommended structure: three layers and a growing book

### 3.1 Daily (Today tab): one story mission plus two little helps

- **Today's mission**: unchanged from v2.19.2. One story mission, 40 raw coins and a stamp, one free swap, 7-stamp card.
- **Two little helps**: tiny kind acts (under a minute), drawn each Japan day from the little-help pool. They pay **no coins**: each gives the Bond its action gives and ticks a row.
- **All three done**: Gerald's treat pouch, one dog-safe treat from a rotating list (Carrot Sticks, Apple Slices, Blueberry Bites, Bone-shaped Biscuit, Sweet Potato Chews) and a paw doodle on today's diary page. Once a Japan day. Not finishing costs nothing.
- Reset 00:00 JST via `jstISO()`, same seed rule as `msPick` (the date and the first dog), so a reload never rerolls. The free swap works on any one row.
- The little-help pool reuses the weight-0 rows (`feed2`, `pet`, `nap`, `scoop`, `mail`): they were cut as paid missions because they happen anyway; as free little helps that is fine.

Little helps (no coins; act and gate):

| id | Card text | Act | Gate |
| --- | --- | --- | --- |
| h_pet | Give {dog} a good rub | pet | |
| h_water | Fill the water bowl | water | |
| h_ball | Throw the ball three times | fetch, n 3 | |
| h_toy | Play with a toy | toy | owns a toy |
| h_nap | Tuck {dog} in for a nap | nap | |
| h_bath | Bath time for {dog} | bath | Clean under 80 |
| h_wear | Try on an outfit | wear | owns clothes |
| h_scoop | Tidy the yard | scoop | |
| h_mail | Open the mailbox | collect or mail | something waiting |
| h_trick | Practise a trick once | trick | a trick at this Bond |
| h_gwater | Water the garden | garden water | a crop planted |
| h_treat | Give a dog-safe treat | feed, a treat | owns a treat |
| h_fav | Feed {dog} the favourite food | feed, name in favFood | owns it |
| h_pack | Feed the whole pack at once | feed, dogs 2+ | 2+ dogs |
| h_photo | Snap one photo | photo | |
| h_paw | Shake paws with a Dog Card dog | paw | Tokyo open |

New story missions for the existing pool (w 3; 40 and a stamp like the rest):

| id | Card text | Act (new data in brackets) |
| --- | --- | --- |
| walk_fresh | Walk a route you have not walked this week | walk; a 7-day list `S.missions.wkAreas` |
| walk_dressed | Go for a walk in an outfit | walk; any outfit slot set |
| pack_walk | Walk with two or more dogs | walk [pack n] |
| cook_new | Cook a dish you have never cooked | cook [discovered] |
| decorate | Move a decoration at home | decorate |
| cafe | Take {dog} to the café | travel place cafe |
| trick_show | Show a trick in the Town Square | trick [place] |
| wish | Make {dog}'s wish come true | new act `wish` |
| friend_yard | Visit a friend's yard (only when `FR_LIVE`) | new act `frvisit` |

With the 30 story missions already in `MS_POOL`, the pool holds 39 story missions and 16 little helps.

### 3.2 This week (Week tab): Gerald's help-wanted board

- Five small neighbour requests a week, from named townsfolk (Baker Bea, Pip, Gerald, the Fun Fair keeper, the café owner). **Any 3 of 5** fill the board. Reset Monday 00:00 JST.
- Board done: a thank-you letter in the next morning's mailbox with **50 coins** (sim used 60) and a stamp on a 4-board neighbour card. A full neighbour card gives a Bond 1-2 Boutique outfit the player does not own, else a Pupcake.
- Counts stay small (a regular player fills it in 3 sessions). A board left half done simply turns into next week's board.
- Request pool (at least 12; 5 drawn by seed, gated like `MS_POOL`): walk 6 times; walk 3 different routes; harvest 3 crops; cook 2 dishes; take 3 photos; win a ribbon at a Fun Fair game; help with 2 town jobs; paddle or float fetch twice; practise tricks 8 times; visit 4 different places; make 3 wishes come true; this week's town event (the Saturday stall or the photo contest, gated like `msStallDay`); a festival act in season (leaf pile, parade, snowdog, fortune).

### 3.3 Badges (Badges tab): progress tracks

Lifetime counters with four tiers: bronze, silver, gold and crayon. Old saves count from what the save already knows, so a long-time player opens the tab to badges already earned (one quiet letter: "You already earned 23 badges").

| Track | Counter | Tiers | Gold title |
| --- | --- | --- | --- |
| Walker | `S.walks` | 10 / 50 / 200 / 500 | Trail Pro |
| Trail explorer | routes in `S.dd.pv` (7) | 2 / 4 / 6 / 7 | Map Maker |
| Out and about | places in `S.dd.pv` | 4 / 8 / 12 / all | Town Know-it-all |
| Treasure hunter | `S.found` (25) | 5 / 10 / 18 / 25 | Treasure Hunter |
| Coats | `S.collection` | the existing 5 / 15 / 30 / 50 milestones, shown here; rewards unchanged | (as today) |
| Gardener | harvests (new) | 10 / 50 / 150 / 400 | Green Paws |
| Kitchen | dishes cooked (new) | 5 / 25 / 75 / 200 | Kennel Chef |
| Squeaky clean | baths (new) | 5 / 25 / 75 / 200 | Bubble Boss |
| Trick practice | trick acts (new) | 10 / 50 / 200 / 500 | Trick Star |
| Fetch | fetch and toy acts (new) | 20 / 100 / 400 / 1000 | Fetch Legend |
| Photographer | `S.ph.n` | 3 / 15 / 50 / 150 | Snap Happy |
| Fun Fair | sum of `S.ff.n` | 10 / 50 / 150 / 400 | Fair Champ |
| Wish maker | `S.dd.wn` | 5 / 25 / 75 / 200 | Wish Maker |
| Mission pup | missions done (new; old saves: stamps + 7 x cards) | 7 / 30 / 100 / 250 | Mission Pup |
| Splash and dash | `S.dd.cnt.ag` + `S.dd.cnt.pd` | 5 / 25 / 75 / 200 | Splash and Dash |
| Tokyo traveller | `S.tk.stamps` (7) | 1 / 3 / 5 / 7 | Tokyo Traveller |
| Good neighbour | boards filled (new) | 1 / 5 / 15 / 40 | Good Neighbour |

Tier rewards (recommended: no coins): bronze a sticker on three new "Badges" sticker pages (18 stickers: 17 bronze plus the first neighbour card); silver the track's rosette on the row and Bond for the active dog equal to one walk; gold the title (`titleGive`) and a cup on the trophy shelf; crayon a crayon star on the row, and the cup turns crayon. Gold in 8 tracks gives the Crayon Medal charm (reward-only, slot charm, "Pure bragging rights", like the Coat Collector Ribbon). No puppy or litter track: litters are never a goal.

### 3.4 New-player path: Gerald's town notebook (14 days)

For saves that started with Puppy's first day (`S.fw.fresh`). One page opens per day played (a day with a paw on the calendar), so missed days cost nothing. Earlier pages stay open, steps can be done in any order, and a step whose place is still locked shows "opens at Bond N" from the next-unlock line. Each finished page gives a sticker on two new "Notebook" sticker pages (12). The guide's "How to play" lessons link from each page.

| Day | Page | Steps (act) | Gift |
| --- | --- | --- | --- |
| 1 | Puppy's first day | the 5 `FW_STEPS` (done already) | sticker |
| 2 | Settling in | bath; nap; try on the Bond 2 party gift | sticker |
| 3 | The veggie patch (Bond 2) | plant a seed; water it; walk the Riverside Trail | 3 Carrot Seeds |
| 4 | Around town | visit the Dog Park; open the mailbox; buy a snack | sticker |
| 5 | First trick | practise Sit 3 times; make a wish come true | sticker |
| 6 | From garden to bowl | harvest a crop; cook a dish; feed it | sticker |
| 7 | One week together | take a photo of your pack; finish today's mission | First Week frame, Gerald's letter |
| 8 | Splash! | paddle at the Splash Pool; play float fetch | sticker |
| 9 | Fun Fair | play a game; help with a town job | sticker |
| 10 | Training Ground (Bond 3) | run the agility course | sticker |
| 11 | All aboard (Bond 3) | ride to Tokyo; collect a station stamp | sticker |
| 12 | Home sweet home | move a decoration; move into another house or bed | sticker |
| 13 | A new trail | walk Sunflower Lanes or the Bamboo Grove | sticker |
| 14 | Town regular | fill two rows of the help-wanted board | title "Town Regular", a Bond 1-2 decoration not owned |

Each page carries one two-sentence lesson in Gerald's voice (for example day 2: "Puppies sleep up to 18 hours a day. A tired dog is a happy dog.").

### 3.5 Growing up (per dog, in Journal > Profile)

Every dog has a "Growing up" strip of four moments per life stage (`lifeStage`: puppy under 6 months, young under 12, adult, senior from 84; 1 real day = 1 dog month). A dog shows the moments of its current stage; earlier stages it joined after are skipped quietly. A moment can also be that dog's daily wish. Rewards: a dated mark on a pencil height chart, a diary page in the dog's voice, and the stage's lesson. No coins.

| Stage | Moments | Lesson |
| --- | --- | --- |
| Puppy | first bath; first ball game; first short walk; a name tag | Puppies need short walks and lots of naps. Their bones are still growing. |
| Young | learn a trick; walk a new trail; first paddle; first photo | Young dogs learn fast with treats and praise. Keep lessons short and fun. |
| Adult | agility run; Bond 5 with this dog; a walk with the pack; a café visit | Grown dogs need a walk and play every day. A busy dog is a calm dog. |
| Senior | a slow sniff walk (any walk); a nap on the best bed; a vet check; a portrait | Older dogs love soft beds and gentle walks. Regular vet checks keep them comfy. |

## 4. Rewards and economy

| Coin reward | Coins | How often |
| --- | --- | --- |
| Today's mission | 40 raw + a stamp | once a Japan day (unchanged) |
| Stamp card, third card on | 150 + a Pupcake | every 7 stamps (unchanged) |
| Little helps | 0 | |
| All three done | 0 (one treat, about 6 coins of food) | once a Japan day |
| Help-wanted board | 50 | once a JST week |
| Badges | 0 (recommended) or 25 / 50 / 100 per silver / gold / crayon (option) | lifetime; 2,450 in all with coins |
| Notebook | 0 (seeds, treats, a frame, a decoration) | days 2-14 |
| Growing up | 0 | |

Sim: `tools/econ/sim3.js` model (Daily rhythm as built) plus an add-on for these layers (scratch copy, not committed): little-help completion light 50%, regular 90%, keen 100%; the board filled every week (light every other week), at 60 coins; badge tiers from estimated actions a day (for example walks 3 / 6 / 22, harvests 1 / 2 / 3, Fun Fair rounds 0 / 6 / 10) and the fixed-size tracks done by day 60 / 30 / 15; the notebook gifts as 10 coins of value a day for days 2-14. Coins earned a day (averages, since weekly and tier rewards land on single days):

| Player | Day 1 / days 2-7 / days 8-30 / days 31-90 | Everything bought on day |
| --- | --- | --- |
| Light, v2.19.2 | 319 / 353 / 463 / 606 | 57 |
| Light, recommended | 322 / 371 / 473 / 613 (+1 to +5%) | 56 |
| Light, badges pay coins | 322 / 371 / 479 / 620 | 56 |
| Light, 3 paid dailies (15 each extra) | 337 / 386 / 494 / 635 | 54 |
| Regular, v2.19.2 | 556 / 815 / 1,161 / 1,266 | 28 |
| Regular, recommended | 561 / 841 / 1,177 / 1,280 (+1 to +3%) | 28 |
| Regular, badges pay coins | 561 / 841 / 1,204 / 1,297 | 28 |
| Regular, 3 paid dailies | 588 / 868 / 1,231 / 1,324 | 27 |
| Keen, v2.19.2 | 1,247 / 2,753 / 3,358 / 3,366 | 11 |
| Keen, recommended | 1,253 / 2,779 / 3,375 / 3,380 (under 1%) | 11 |
| Keen, badges pay coins | 1,253 / 2,812 / 3,405 / 3,398 | 11 |
| Keen, 3 paid dailies | 1,283 / 2,842 / 3,435 / 3,428 | 11 |

Missions are a small part of income; walks stay the main one. The recommended set adds 3 to 26 coins a day. Paid dailies or badge coins would add more for the same engagement, so they are not recommended. The real coin fix is still the review's coin sinks (town projects, more markets), which this design does not replace.

Non-coin rewards reused: stickers and the sticker-page mechanism (`ddStickerDefs`, `ddPageGift`), titles (`titleGive`, Profile picker), photo frames (`S.dd.fr`), dog-safe treats and seeds, Bond (`addBond`), diary pages (`S.dd.diary` templates), mailbox letters, Boutique Bond 1-2 outfits (`DD_PAGE_WEAR`), `HM_DECOR` decorations, the charm slot. New art, kept small (sketchbook style, every fill inside its outline): (1) the trophy shelf, a yard and house decoration drawing 0-17 cups in bronze / silver / gold / crayon; (2) a rosette icon in four colours; (3) the Crayon Medal charm; (4) a help-wanted board header (cork board with pinned notes); (5) the notebook page and the height chart (pencil lines only). No dog art changes.

## 5. UI on phone and desktop

- It stays where missions are today: the top-bar clipboard `#msBtn` on desktop, the phone "..." menu entry. One sheet, `msOpen()`, with tabs **Today · Week · Badges**, and **Notebook** as a fourth tab only while a new player has unfinished pages (then the finished notebook moves under Badges). Journal > Missions shows the same sheet.
- Phone 360 / 390 px: the tabs are crayon pills with an icon and a short label; long words wrap under the icon, never shrink below 13 px (add the sheet to the `i18n_fit` audit for all 12 languages). Today: the clipboard art with three rows (the story mission first, larger), the swap, the pouch line, the stamp card below. Week: the board as five pinned notes in one column, "2 of 3" at the top. Badges: one row per track (rosette, name, bar "37 / 50", next reward), gold and crayon tracks folded at the bottom.
- Desktop: the same sheet, two columns (clipboard left; stamp card, pouch and board summary right); Badges in two columns.
- Calm rules: the clipboard shows a soft crayon dot only when something is newly done or the board is ready, never a red number. Badge tiers batch into one toast ("2 new badges") through the existing toast group; titles still use `titleGive`'s toast. Toasts wait for Gerald and the parade (`msGuideBusy`). The only popups are the stamp card prize (as today), the notebook day 7 and 14 gifts, and the Crayon Medal. No push or "come back" messages. The Growing up strip lives in the dog's Profile, not the sheet.

## Decided (owner, 4 Nov 2026, choice window)
1. Daily: **1 mission + 2 little helps** (Bond, no coins; all 3 give a dog-safe treat).
2. Weekly: **Gerald's help-wanted board, 50 coins** (any 3 of 5, Monday 00:00 JST; every 4 boards an outfit).
3. Badges: **cosmetics only** (stickers, rosettes, titles, cups, the Crayon Medal charm).
4. New-player notebook: **14 days**.
5-7 (not asked; the recommendations stand): old saves get backfilled badges but no notebook; no season pass; rewards arrive automatically, no claim chores.
Big release: built part by part on its own branch, three reviews, translated once in 12 languages; goes live only with the owner's go-ahead and a launch date (after v2.19 on 7 Nov).

## 6. Options for the owner

1. **Daily: one mission plus two little helps (recommended)**, versus one only (today) or three paid missions. Why: more to do each day, the small rows are kind one-tap acts, and income moves by 1 to 5% (three paid missions add 15 to 30 a day for the same play).
2. **Weekly board: yes, any 3 of 5, 50 coins (recommended)**, versus no weekly layer. Why: gives a reason to try a place or a game this week, and fits Gerald's weekly news; under 8 coins a day.
3. **Badges pay cosmetics only (recommended)**, versus 25 / 50 / 100 coins per tier (2,450 in all). Why: coins stop mattering after day 28 for a regular player; titles, cups and stickers keep their value.
4. **Notebook: 14 days (recommended)**, versus 7. Why: the town opens over Bond 2-4 across about two weeks for a light player, and 12 stickers fill two pages exactly.
5. **Old saves: badges with backfill, no notebook (recommended)**, versus offering the notebook to everyone. Why: old players know the town; badges give them a long goal on day one.
6. **Free season sticker pass: not now (recommended).** Why: the festival sticker pages and markets already do this; revisit with the Sakura Market.
7. **Claiming: automatic (recommended)**, the weekly envelope through the mailbox. Why: no "claim" chores and no lost rewards.

## 7. Build plan

A big release (new save fields, a new sheet with tabs, about 300 new strings, new art): three reviews (code, phone, art), parts one at a time, at most 2 helpers at once. It is a big content release, so it waits for the owner's go-ahead and launch date before `main`. Build after v2.19 (7 Nov) and Daily rhythm ship.

| Part | Work | Size |
| --- | --- | --- |
| A | Save fields in `msFields` (additive, `S.v` stays 1): `S.missions.help`, `pouch`, `life { ms, help, harvest, cook, bath, trick, fetch, boards }`, `tr { track: tier }`, `wk { w, list, got, card }`, `wkAreas`, `nb { pages, done, got }`, `grow { dogId: { moment: date } }`; backfill from existing counters; new act data (walk pack, trick place, `wish`, `frvisit`) | small, ~200 lines |
| B | Today: little helps, pouch, swap on any row, clipboard with three rows | small, ~150 |
| C | Badges: track table, tiers, sticker pages, titles, cups, Crayon Medal | medium, ~350 |
| D | Week: board, Monday JST reset, letter, neighbour card | medium, ~250 |
| E | Notebook: pages, gating by days played and Bond, links to `FW_STEPS` and the guide | medium, ~300 |
| F | Growing up strip in the Profile, wish link, diary templates | small, ~200 |
| G | Art: trophy shelf, rosettes, medal, board header, notebook page and height chart | 5 small pieces |
| H | Texts: news entry (`49c_news.js`), Gerald's guide line and lesson on missions, translated once in one batch in 12 languages (en, ja, zh-Hans, zh-Hant, yue, ko, es, pt-BR, fr, de, th, id; yue hidden until `YUE_LIVE`) | ~300 strings |
| I | Tests: a new suite (daily rows and JST midnight with a clock stub, one pouch a day, swap, Monday JST reset, any 3 of 5, tiers from counters, an old v2.19.2 save backfills and loads, notebook gating, no coins from badges, no puppy track), plus `v24*`, `v2192_rhythm`, smoke, i18n, `i18n_fit` (sheet at 360 / 390), phone, and the sim | medium |

Rough total: about 1,500 lines of game code, 250 of CSS, 5 small art pieces, 300 strings.
