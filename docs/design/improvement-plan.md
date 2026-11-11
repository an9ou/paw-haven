# Doodle Doggo improvement plan: reasons to stay (11 Nov 2026)

Asked by the owner on 11 Nov: "design an improvement plan based on the last analysis; make players stay; improve the features".
Builds on `docs/design/retention-ideas.md` (4 Nov) and `docs/design/economy-review.md` (3 Nov), checked against what has shipped since (v2.19 to v2.24.1). Proposal only; the owner decides what is built and when.

## 1. Where we stand

Done since the two studies:

| Study item | Status |
| --- | --- |
| Dailies, little helps, weekly board, badges, new-player notebook, growing up | Done (v2.20 Missions v2) |
| Daily bonuses once a JST day; 5 full-pay walks a day | Done (v2.19.2) |
| Long goals past Bond 10 | Partly: player levels 1-20 and dog habits (v2.22) |
| Friends: visits, gifts, a friend's dog on your walk | Done (v2.19) |
| Coin prices for the kind shop looks and tools | Done (v2.24) |
| Days played | Partly: a monthly calendar count; no lifetime count or milestone gifts |
| "While you were away" | Partly: one toast ("napped and missed you"); no diary page, no gift |
| Welcome back after a break | Not built (only the log-in screen line) |
| Yard visitors and a Visitors Book | Not built (visiting dogs only at town places) |
| Town projects (coin sink) | Not built |
| A market every 6-8 weeks | Not built: markets run Oct to 7 Jan only; Sakura is an empty `todo` in `49_market.js`; nothing from 8 Jan to 24 Mar or Apr to Sep |
| Weekly Market Street special | Not built (the shop never changes) |
| Bond stars after Bond 10 | Not built |
| Neighbour stories | Not built |
| Share postcard on yard, diary, Dog Cards | Not built (photo mode only) |

The three biggest gaps for keeping players:
1. **Coming back is not rewarded.** After a day or a week away, players get one toast. The best cozy games make the return the best moment of the day.
2. **Coins stop mattering.** Light, regular and keen players own the whole shop by about day 197, 96 and 45, and nothing new arrives.
3. **The calendar goes quiet.** From 8 Jan to 24 Mar, and again from mid-April to October, there is no market or festival.

## 2. The plan: five releases, smallest and safest first

Each release keeps the design rules: nothing bad happens, no streaks that break, no FOMO (seasonal things come back every year), walks stay the main income, no selling dogs. One release at a time, so the retention dashboard (D1, D7, D30) shows what each one did.

### Release A: "Glad you're back" (small, about 2-3 days of work)
For players who come back after hours or days. Highest value for the effort.
- **While you were out page.** After 4+ real hours away, the dog greets you, then a diary page shows 2-3 small things it did (napped in a sunbeam, found a sock, barked at a leaf), drawn with the existing diary art. Once a JST day, a small gift goes with it: a sticker, toy or treat, with coins rare and capped at 30.
- **Days played, forever.** A lifetime count that never resets (a missed day costs nothing), with gifts at 7, 30, 100 and 365 days: a frame, a yard flag, a costume and a golden bowl. Shown on the existing monthly calendar.
- **Welcome back after 3+ days.** Gerald's letter ("we kept your spot warm"), a treat bag and 100 coins, plus the What's new sheet for anything missed. No catch-up chores.
- **Tomorrow line.** After the last daily task, one gentle line about tomorrow: "The carrots are ready tomorrow", "The Saturday stall opens in 2 days", "Your letter from Gerald comes Monday". Text only.
- Save: additive fields `S.daysPlayed`, `S.lastSeenISO`, `S.awayGiftISO`, `S.daysGifts` in `migrate()`.

### Release B: "Yard visitors" (medium, about 1 week)
The strongest long-term loop: it gives yard items a purpose and a collection with visible gaps.
- Neighbourhood dogs (the 40 breeds, named, with coats) visit your yard while you are away and play with what you put out: a ball pit, a sandbox, a water bowl, a kennel.
- **Rare visitors** need a certain toy, season or weather: a Samoyed only in snow, a Shiba under the momiji, a Border Collie only after an agility run at the Training Ground.
- **Visitors Book**: a page per visitor and a pencil silhouette for those not met yet. Visitors sometimes leave a thank-you (a sticker, a bone, a flower). Never a dog to keep or buy.
- New yard toys at 300 to 1,500 coins become a natural coin sink.
- Reuses the town visitor code (`visitorSpot`) and the "While you were out" page from release A ("Biscuit the beagle came by and tried the sandbox").

### Release C: "Town projects" (medium, about 1 week)
The economy fix: something big to save up for that changes the town for good.
- A project board in the Town Square: Fountain 5,000, Bandstand 10,000, Sakura Avenue 15,000, Lighthouse 25,000 coins. Drop in any amount and watch the drawing fill in, crayon stroke by crayon stroke.
- Each one takes a few real days to build after it is paid, so there is a "come back tomorrow" moment, and then it stays in the town: Gerald gives a ribbon-cutting, the bandstand plays music (`PawAudio`), and the dogs drink at the fountain.
- Later, with Friends, friends can add coins to each other's projects (+1 gift kind, no typed text).

### Release D: "A market every season" (large, special update: owner's date)
Fills the quiet months. Each market comes back every year, so there is no FOMO.
- **Sakura Market** (25 Mar - 10 Apr): the empty `sakura` entry, with hanami picnic decorations, petal outfits and a sakura mochi treat (dog-safe recipe only).
- **Rainy Season Market** (June): raincoats, umbrellas and a frog pond; it uses the rainy-day wet dogs from v2.18.
- **Summer Matsuri** (15 Jul - 31 Aug): yukata, goldfish-scooping (paper fish, no live animals), lanterns and fireworks at night.
- **Tsukimi** (September): a moon-viewing deck and rabbit ears.
- Plus a **weekly Market Street special**: 3 items from a pool of 30, at 300-900 coins, changing every Monday and coming back in rotation.
- About 3,000 coins of stock each; art is the big cost, so do one market per release.

### Release E: "Stories and stars" (medium, writing heavy)
For the players who stay past the first month.
- **Bond stars after Bond 10**: a star per 5,000 Bond points, keepsakes at 5 and 10 stars (a framed paw print, a star collar).
- **Neighbour stories**: 4-6 townsfolk with 5-step story arcs over weeks, told through letters and small requests on the Monday board. For example, Mrs Plum learning to knit dog sweaters, or the café owner adopting a shy greyhound.
- **Share postcard**: a postcard button on the yard, the diary page and Dog Cards, using the v2.19 Share poster, to bring friends in.

## 3. Smaller polish worth doing alongside

- Phone checks still open in `TODO.md` (realtime sync on two phones, iPhone sheet heights): play once on a real phone before each release.
- The site is at 9.86 of 10 MB: move to the split deploy (fonts, map shots and /play/ in side Workers) before release D adds art. It needs the Cloudflare token to get "Workers Routes: Edit" (owner).
- Fix the balance sim (economy review item 12) before release C, so the project prices are tested on real walk pay.

## 4. How we know it works

- Read the retention dashboard before each release and 7 days after: D1, D7 and D30, sessions per day, and the share of players who come back after 3+ days away.
- Targets (rough, to check against): release A lifts D7 most; B and C lift D30; D brings lapsed players back at each market's opening (Gerald's letter plus the What's new sheet).
- One release at a time, so each change can be read on its own.

## 5. Suggested order and size

| Order | Release | Size | Needs the owner |
| --- | --- | --- | --- |
| 1 | A "Glad you're back" | Small | Go-ahead; ships as a normal release |
| 2 | B "Yard visitors" | Medium (art: visitor poses, 4 yard toys, the book) | Go-ahead; three reviews |
| 3 | C "Town projects" | Medium (art: 4 buildings in stages) | Go-ahead; prices |
| 4 | D "A market every season" | Large, one market at a time | Special update: go-ahead and date for each market (Sakura first, by 25 Mar 2027) |
| 5 | E "Stories and stars" | Medium (writing) | Story choices |

Every release follows the usual recipe: parts one at a time, one translation batch in 12 languages near the end, a NEWS entry, itch.io and site, then Marketing hears about it.
