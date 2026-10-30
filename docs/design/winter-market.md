# Winter Market 2026: design (draft, 30 Oct 2026)

The Winter Market (1 to 26 Dec, Japan date, `FM_MARKETS` id `winter` in `game/src/49_market.js`) opens with only 9 old items (3 decorations,
3 clothes, 3 treats) and no toys or homes (`V2171.md` 8). This set fills it the way v2.17.2 "Spooky Stalls" filled the Halloween Market:
crude crayon and cute, every colour inside its line, nothing over the eyes or nose, costumes that fit all 35 breeds (adults and puppies,
every pose, dry and wet), Bond gates 1 to 3, prices in line with the Halloween 2026 items. Owner's ask (30 Oct): decorations, new clothes,
new toys and more, done one part at a time, no rush.

## Rules for the set

- Sold only at the Winter Market (`fm: true`, `fest: 'winter'`), **every year** (no `ed`, so a player who misses December 2026 can buy it
  next winter). Bought things stay forever.
- Winter, not religious: snow, knits, lights, presents, Father Christmas, elves, reindeer, gingerbread (as a look, never as food).
- Welfare and food safety: no tinsel, no real candles, no holly, mistletoe, poinsettia or lilies as plants, no chocolate, nutmeg, raisins,
  xylitol or macadamia in treats. A fir tree in the yard is fine (paper decorations only). Treats come with a short, kind two-sentence lesson.
- No name of a film, brand or game character.

## The items (25, plus 3 treats)

| Part | Items |
|---|---|
| 1. Decorations (5, yard) | Paper-Star Fir Tree (a little potted fir with paper stars), Yard Snowman (crude, stick arms, carrot nose, scarf), Candy-Cane Fairy Lights (wall, `lit`), Present Pile (three wrapped boxes), Star Lantern (a paper star on a post, `lit`) |
| 2. Costumes (10) | Father Christmas Suit (coat and hat), Little Elf Outfit (tunic and pointy hat with a bell), Gingerbread Pup Suit (brown with icing squiggles), Snowman Suit (white, coal buttons, the carrot on top of the hat, never on the nose), Polar Bear Hood, Penguin Suit (little flippers), Puffer Jacket, Nutcracker Jacket & Hat, Snowflake Wings (back), Jingle Bell Collar (neck) |
| 3. Toys (5, each plays an older toy game with its own look) | Squeaky Snowman, Candy-Cane Rope (rope only, no sweets), Plush Penguin, Snowball Ball (a fluffy white ball), Present Puzzle Box (treats inside, like the Puzzle Feeder) |
| 4. Homes (a house and 4 beds) | Gingerbread Kennel (a look, not edible), Present-Box Bed, Little Sleigh Bed, Snowball Nest, Giant Mitten Bed |
| 5. Treats (3) | Reindeer Crunch (carrot and apple, no seeds or core), Turkey & Cranberry Bites (plain cooked turkey, no skin, bones or gravy, a few fresh cranberries), Frozen Yoghurt Snowballs (plain yoghurt, nothing sweetened) |
| 6. Market scene | the winter stalls dressed with the real drawings (as v2.17.2 did for Halloween): fir tree and lights at the decor stall, costumes on hangers, toys in baskets, homes stand, treats cart, stall boards |

## Order of work

One part at a time, one art agent at a time, on branch `art/winter-market`: 1 decorations, 2 costumes, 3 toys, 4 homes, 5 treats,
6 the market scene, then names and descriptions in all 11 languages in one batch, the checks (outfit sweep, `dogs/fill_sweep.js`,
`dogs/connect_check.js`, `v2171_market`), three reviews (code, phone, art) and a release before 1 Dec (a `NEWS` entry, Marketing briefing).
The New Year Market (27 Dec to 7 Jan) is a separate small set later.

## Progress

- [x] 1. Decorations (30 Oct 2026): rows in `HM_DECOR` (`game/src/03_yard.js`), props `wmfirtree`, `wmsnowman`, `wmcanelights` (lit), `wmpresents`, `wmstarlantern` (lit) and the 5 item cards in `world/pawart_world_b.js` (`PA.WINTER_MARKET.decor`); prices 90 to 140, Bond 1 (Fir Tree and Star Lantern Bond 2); English stories only; shots `docs/shots/winter-market/part1/`
- [x] 2. Costumes (30 Oct 2026): `CLOTHES` rows in `game/src/00_core.js` (fest 'winter', fm, no ed; prices 55 to 85, Bond 1 to 3), drawn in `dogs/pawart_dogs.js` (body slot with head pieces in `TOP2`, the Jingle Bell Collar in `NECK2`, all in `HM_OWN` so the dog under them stays the plain dog), 10 item cards in `world/pawart_world_b.js` (`PA.WINTER_MARKET.costumes`), listed in `FM_MARKETS` winter; English perks only; shots `docs/shots/winter-market/part2/`
- [x] 3. Toys (30 Oct 2026): `TOYS` rows in `game/src/00_core.js` (fest 'winter', fm, no ed; 45 to 75 coins, Bond 1 to 2), each plays an older game through `HM_TOY_GAME` in `mods/toys.js` (Squeaky Snowman = Squeaky Duck, Candy-Cane Rope = Rope Tug with its own rope colours, Plush Penguin = Plush Bone, Snowball Ball = Tennis Ball, Present Puzzle Box = Puzzle Feeder with its own board and lids, props `wmpuzzle-board`/`wmpuzzle-lid`), cards in `PA.WINTER_MARKET.toys`, listed in `FM_MARKETS` winter (the third stall is now Toys; treats are reached from the sheet tabs until part 6 adds a treats cart); English only; shots `docs/shots/winter-market/part3/`
- [x] 4. Homes (30 Oct 2026): Gingerbread Kennel in `HOUSES` (`game/src/00_core.js`, 900, Bond 3, comfort 25%, windows glow at night) and four `BEDS` rows (`game/src/12_popups_beds_map_snacks_potty.js`: Snowball Nest 250 Bond 1, Present-Box Bed 300 Bond 2, Little Sleigh Bed 350 Bond 2, Giant Mitten Bed 450 Bond 3), all fest 'winter', fm, no ed; art and 5 item cards in `world/pawart_world_b.js` (`PA.WINTER_MARKET.house`/`.beds`), listed on the winter homes tab (no homes stand in the scene until part 6); English only; shots `docs/shots/winter-market/part4/`
- [x] 5. Treats (30 Oct 2026): `FOOD` rows in `game/src/00_core.js` (fest 'winter', fm, no ed, snacks: Reindeer Crunch 8, Turkey & Cranberry Bites 12, Frozen Yoghurt Snowballs 9, each with a two-sentence lesson), item cards and dog-bowl art in `world/pawart_world_b.js` (`PA.WINTER_MARKET.treats`), listed after the three old treats in `FM_MARKETS` winter, the `wstall` mission counts the warm one, Turkey & Cranberry Bites (Baker Bea's stall never sells `fm` foods); English only; shots `docs/shots/winter-market/part5/`
- [x] 6. Market scene (30 Oct 2026): the winter scene dressed with the real drawings (`fmDressWm`/`fmFrontWm` in `world/pawart_world_e.js`): Candy-Cane Fairy Lights under the decor awning, Yard Snowman and Present Pile on its counter, Fir Tree beside, Star Lantern in front (lights and lanterns lit after dark, the scene takes the night tint around them), costumes on hangers, toys in baskets, a homes stand (Little Sleigh Bed) and a treats cart, snow caps and drifts, the sled; five stall buttons with boards (`49_market.js`); every theme's decor roof sits clear of the place chip; a stall with nothing in it is no button (New Year: decor and treats only); `v2171_market` section 8b; shots `docs/shots/winter-market/part6/`
- [ ] Translations, checks, reviews, release

## To fix before the release (found on the way)

- `check_identical` against `origin/v215-base` now differs on every render (older dog outline redraws since v215-base, before this set);
  the base or the check needs updating (compare against the last release instead).
- ~~`v28_winter` fails "wstall matches a stall food buy only" on `main` too (a missions check, older than this set).~~ Fixed: the test was out of date (v2.17.1 made Festive Market treats count on purpose).
- ~~The Halloween market toys still show their base toys' hints ("Click the duck", "Drag the Plush Bone"); give them their own like the winter toys.~~ Fixed: `mod.toys.wm_bat_hint`, `wm_pumpkin_ball_hint`, `wm_mummy_hint`, `wm_glow_bone_hint`, `wm_spider_hint` (English, to translate).
- ~~The Soft Spider Plush promises +10% nap Energy, but only the Plush Bone gives it: make the text or the bonus agree.~~ Fixed: every toy playing the Plush Bone game gives its +10% once (`napBuddy` in `03_yard.js`, `PawToys.gameOf`); new key `yard.nap_buddy`.
- Festive-market houses (the Friendly Haunted Kennel, now the Gingerbread Kennel, both Bond 3) still show as "House: ..." in the Bond-up unlock lists (`unlocksFor` in `00_core.js`, the Bond track in `48_dogdays.js`), though only the market sells them; beds are already skipped there (`!b.fm`).
- ~~The `wstall` mission ("Buy a warm treat from Baker Bea") also counts the Frozen Yoghurt Snowballs from the market: maybe count only warm treats, or reword.~~ Fixed: warm treats only (`cold: true` on Reindeer Crunch and Frozen Yoghurt Snowballs).
