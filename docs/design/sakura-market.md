# Sakura Market: design (draft, 11 Nov 2026, branch `claude/sakura-market`)

Release D "A market every season" (`docs/design/improvement-plan.md`), first market. The Sakura Market (25 Mar to 10 Apr, Japan date,
`FM_MARKETS` id `sakura` in `game/src/49_market.js`) was configured but shut (`todo: true, items: {}`, `V2171.md` 8). This set fills it the way
the Winter Market 2026 set (`docs/design/winter-market.md`) filled December: crude crayon and cute, every colour inside its line, nothing over the
eyes or nose, costumes on all 40 breeds (adults and puppies, every pose, dry and wet), Bond gates 1 to 2, prices in line with the winter items.

**Special update:** it goes live only with the owner's go-ahead and date (CLAUDE.md). It is built on the branch, not merged, no `NEWS` entry yet,
English only (`tt('key', 'English')`; the one translation batch comes with the release).

## Rules for the set

- Sold only at the Sakura Market (`fm: true`, `fest: 'sakura'`), **every year** (no `ed`): a player who misses spring 2027 buys it in 2028. No FOMO.
  Bought things stay forever; the normal shops leave out every `fest` item, so nothing here shows in the Boutique, Barkitecture or Kibble Corner.
- Spring and hanami (blossom viewing), not a religious festival. No name of a film, brand or game character.
- **Welfare and food safety.** Cherry trees (Prunus) are not safe for dogs: leaves, stems and stones. So the yard tree is a **paper** sakura tree
  on a wooden trunk, and no real blossom, leaf or cherry is ever fed. **No real mochi** (too sticky to swallow safely; the Pup Kinton lesson says the
  same) and **no pickled sakura leaf** (salted). No salt, soy sauce or pickled plum (umeboshi) in the rice ball. The toy dango is felt with a felt stick
  (no wooden skewer). Every treat has a short, kind two-sentence lesson.

## The items (18, and 4 homes in part 2)

| Part | Item | Kind | Price | Bond | Notes |
|---|---|---|---|---|---|
| Decor | Hanami Picnic Blanket | yard floor (flat) | 90 | 1 | pink-and-white check blanket, a folded corner |
| Decor | Sakura Paper Lanterns | yard wall, `lit` | 110 | 1 | round pink paper lanterns on a string; glow after dark |
| Decor | Paper Sakura Tree | yard floor | 140 | 2 | paper blossoms on a wooden tree in a pot (real cherry is not dog-safe) |
| Decor | Bento Picnic Table | yard floor | 100 | 1 | a low table, a wooden bento box, two tea cups (all wood and paint) |
| Decor | Blossom Swing | yard floor | 130 | 2 | a wooden A-frame swing, a pink seat, a garland of paper blossoms (replaces the Koinobori Pole) |
| Clothes | Sakura Petal Crown | head | 55 | 1 | pink paper blossoms on a soft green band |
| Clothes | Hanami Sun Hat | head | 60 | 1 | a straw hat with a blossom sprig in its band |
| Clothes | Sakura Bandana | neck | 50 | 1 | pink bandana with white five-petal flowers |
| Clothes | Blossom Garland | neck | 55 | 1 | a sagging string of paper blossoms |
| Clothes | Sakura Haori | body | 80 | 2 | a pink haori jacket, white blossoms, a white tie, a darker hem band |
| Clothes | Sakura Mochi Suit | body | 75 | 2 | a pink round suit wrapped in a big green leaf (a look, not a snack) |
| Clothes | Butterfly Wings | body | 70 | 1 | yellow and pink felt wings on a soft strap (the Snowflake Wings rig) |
| Clothes | Spring Knit Cardigan | body | 65 | 1 | a mint knit with blossom buttons; warm wear (`WARM_WEAR`) |
| Toys | Squeaky Dango | toy (Squeaky Duck game) | 50 | 1 | three felt dango balls on a felt stick |
| Toys | Petal Ball | ball play (2 coins a return) | 45 | 1 | a pink ball with petals; ball-play caps 16 a session, 40 a day |
| Toys | Plush Koi | toy (Plush Bone game, nap buddy) | 65 | 2 | a soft red-and-white carp; +10% nap Energy once |
| Treats | Sakura Pup Mochi | snack | 10 | | sweet potato tinted with beetroot, in a cabbage leaf (no real mochi) |
| Treats | Hanami Rice Ball | snack | 12 | | plain rice and boneless plain salmon, no salt, soy or umeboshi |

Part 2, the homes stall (owner, 11 Nov), priced like the Winter Market's kennel and beds; paper and felt blossoms only:

| Stall | Item | Kind | Price | Bond | Look |
|---|---|---|---|---|---|
| Homes | Blossom Kennel | house (comfort 0.25) | 900 | 3 | a little wooden house, pink tiled roof with upturned eaves, round paper windows (glow at night), a short pink noren, a paper blossom branch |
| Homes | Picnic Basket Bed | bed (+10%) | 300 | 2 | an open wicker picnic basket, lid up behind, a pink check cushion |
| Homes | Paper Parasol Bed | bed (+10%) | 350 | 2 | a round cushion under a pink paper parasol (wagasa) on a bamboo pole |
| Homes | Petal Nest | bed (+5%) | 250 | 1 | a ring of big soft felt petals round a cream cushion |

One of each: 570 decor + 510 clothes + 1,800 homes + 160 toys = 3,040 coins, plus 22 of treats = 3,062 (the winter set was about 2,700 with homes). Toy-game coins come under the
one toy-game cap (`FF_CAPS.toys`, 30 a Japan day); the Petal Ball pays through ball play's own caps, like the Snowball Ball.

Wear: the Spring Knit Cardigan is warm wear (owner, 11 Nov); nothing else is and nothing is a raincoat; the dogs still look wet in the rain in every costume except the old raincoats.

## The market scene

The `sakura` scene (`fmscene` theme `sakura`, world E) is dressed like the winter one: the Sakura Paper Lanterns under the decor awning, the Bento
Picnic Table and the blanket on its counter, the Paper Sakura Tree beside it and the Blossom Swing at the right edge; four costumes on hangers and the
crown and bandana on the counter; toys in baskets; a homes stand with the Paper Parasol Bed and a treats cart in front (part 2); the same blank boards (the game
writes the stall names); pink blossom clouds at both edges, petals lying on the ground, and petals falling in the air (a CSS animation on the game's
side, still under `prefers-reduced-motion`).

## Decisions

- Every year, no edition (owner rule: markets come back every year).
- Eight costumes, not ten: two head, two neck, four body; the Butterfly Wings and the head pieces leave room for a hat (the wings) or a body piece.
- ~~No homes in this market~~: the owner chose a homes stall (Decided 1, built in part 2).
- Music (part 2): `fest: 'sakura'` at `fmarket` picks the style `smarket` in `mods/pawaudio.js` (`FEST_BASE`): 80 bpm, swing 0.6, the new 8-bar
  progression `spring` (Fmaj9 Am9 Bbmaj9 F69 Dm9 Am9 Gm9 C9sus), bouncy keys and bass, lazy kick, light brushed hats, a kalimba topline (a soft
  koto feel), spring birds over the market murmur. Like the Winter Market: dawn is the plain market music (`audioPlace()`), dusk and night its
  softer version (`STRONG`), it keeps its progression in rain and its topline in a late snow. Loudness -22.6 LUFS (the Winter Market -22.3).
- Koinobori belong to Children's Day (5 May), so the pole is out (owner, 11 Nov): an idea for a later Golden Week market (the `skCarp` drawing is kept, the Plush Koi uses it).

## Decided (owner, 11 Nov 2026, choice window)

1. Add a homes stall: a Blossom Kennel and 2 to 3 spring beds, about 3,000 coins of stock in all (part 2, done: 3 beds, 3,062 coins).
2. Own music: a light spring Sakura Market variant in PawAudio, like the Winter Market's (part 2, done; waits for the owner to hear the clip).
3. The Koinobori Pole is swapped for the Blossom Swing (done); koinobori kept as a Golden Week market idea.
4. The Spring Knit Cardigan counts as warm wear (done).

## Open questions for the owner (answered above, kept for the record)

1. Launch date and go-ahead (the window opens 25 Mar 2027).
2. Stock is about 1,240 coins (the plan said about 3,000): add a homes stall (a Blossom Kennel and two beds) in a later part?
3. Should the Spring Knit Cardigan count as warm wear (no shivering in a late snow)? Now: no.
4. Music: a Sakura Market variant (`paw-music`, like the Winter Market's), or the plain market music? Now: the plain market music.

## Status

Built on `claude/sakura-market` (11 Nov 2026), English only, not merged:

- [x] Data: rows in `FOOD`, `TOYS`, `CLOTHES` (`game/src/00_core.js`) and `HM_DECOR` (`game/src/03_yard.js`), all `fest: 'sakura', fm: true`, no `ed`;
  the `sakura` entry in `FM_MARKETS` filled (no `todo`); the Petal Ball in `FM_BALLS`; the Squeaky Dango and Plush Koi in `HM_TOY_GAME` (`mods/toys.js`) with their own hints.
- [x] Art: world B (5 props `skblanket`, `sklanterns` (lit), `sktree`, `skbento`, `skkoi`, 18 item cards, 2 dog bowls, `PA.SAKURA_MARKET`);
  dogs (`HAT2`/`NECK2`/`BODY2`/`BACK2`, `SK_OWN` hands back the random stream); world E (`fmDressSk`, `fmFrontSk`); falling petals `fmPetals` + `.fm-petal` in `50_market.css`.
- [x] Checks: suite `sakura_market` (window, items, buying, caps, scene, costume renders on every breed, phone 360x640); the 8 costumes added to
  `dogs/connect_check.js` OUTFITS and `dogs/fill_sweep.js`.
- [x] Part 2 started (11 Nov): Blossom Swing in place of the Koinobori Pole (prop `skswing`), the cardigan in `WARM_WEAR`; `sakura_market` 36, `wm_review` 73, `smoke` 35, `copy` pass.
- [x] Part 2 done (11 Nov): the homes stall: `Blossom Kennel` in `HOUSES` (900, Bond 3), `Picnic Basket Bed` 300, `Paper Parasol Bed` 350,
  `Petal Nest` 250 in `BEDS`, `homes` in the `sakura` entry of `FM_MARKETS`; art in world B (`HOUSES`/`BEDS`, item cards, `PA.SAKURA_MARKET.house/.beds`,
  the kennel windows glow at night), a homes stand with the parasol bed in `fmFrontSk`. No dog drawing changed (`v2183_connect` not needed).
  Music: the `smarket` style (Decisions above), `audioPlace()` passes `fest: 'sakura'`; `mods/audio/test_audio.js` checks it.
  Lighter props: `skRel` (world B) writes the Sakura props, the kennel and the beds as relative path steps from the same rounded points (lossless):
  `sklanterns` 95.7 -> 53.6 KB, `sktree` 97.6 -> 58.8 KB, `skswing` 69.7 -> 40.8 KB; the scene still lightens them (`fmLite` with `fmAbs`, scene size unchanged).
  Suite `sakura_market` checks the five stalls, the homes art, about 3,000 coins of stock and the lighter props.
- [ ] Left for the release: the owner hears the music clip (`smarket`) and says yes; the art review (owner/top model) and the phone review;
  `dogs/fill_sweep.js` with OUTFITS=1 on the new costumes; `check_identical` against the last release; translations (one batch, 12 languages,
  the 4 new homes too); a `NEWS` entry and Gerald's market letter wording; a `V*.md` music note for the release.


**Music approved (owner, 12 Nov 2026):** "The music of sakura market is good, can ship it." The spring variant ships with the market.

## Status, final stage (13 Nov 2026, branch `claude/sakura-market`, nothing pushed to `main`, nothing deployed)

Done:

- [x] Merge fallout: after merging Sakura + v2.26-v2.29 + the art and code fixes, `sakura_market` 47, `worker` pass, `wm_review` 73, `v226_visitors` 69 and `smoke` 35 are green;
  `v219_friends` failed one check twice in a row on the first run (a dog overlap sample at 360x640) and then passed 351 checks on a rerun, `FR_ONLY=greet` alone passed 58, and `release-26-29` passes 348: a timing flake under load, not Sakura.
- [x] Phone half B (360 x 640, the yard's Look right arrow): all five Sakura decorations plus the five Winter Market ones out in the yard, with and without a yard
  visitor (Tilly): left and right half looked at by eye, nothing overlaps the mailbox, house, dog house, garden or the visitor, and nothing sits in half
  across the view edge (the next half only peeks in at the edge, like the dog house does). The Paper Sakura Tree sits right under the visitor's name tag with about
  2 px to spare, no overlap. No change to `03_yard.js` needed.
- [x] NEWS: `NEWS_V230` in `game/src/49c_news.js`, id `2.30` (placeholder), date `2027-03-01`, 5 lines, shown by `nwSort` only once `nwDue` (Japan date from 1 Mar 2027,
  or the Pages test copy's `__ddNextTest`), so it never leads before 1 Mar. It does not use the `minor` flag.
- [x] Gerald's letter: the Festive Market's opening letter (`fmLetter`, once per market per year, on 25 Mar) has its own Sakura wording
  (`fm.letter_text_sakura`, `fm.letter_ps_sakura`); other markets keep the generic text.
- [x] Translations: 56 keys (22 item names, their notes, perks, stories and tips, the changed Pup Mochi lesson, the 2 toy hints, the letter and 6 NEWS keys) in all 11
  other languages in one batch; yue style from `docs/i18n/yue.md`; the ja, zh-Hans, zh-Hant, yue, ko and th game font subsets and `packed.js` rebuilt.
  `i18n`, `copy` and `i18n_smoke` (ja, de) pass.
- [x] Fit: `test_i18n_fit.js` has the steps `fm sakura` (market scene, 5 stalls, map on 28 Mar 2027) and `nw sakura` (the Sakura news on top);
  de ja th yue at small, iphone15 and desktop: 17 states per session (204 in all), 0 findings. On a phone the market cards keep 10 px each side (`50_market.css`):
  "Hanami Sun Hat" and "Picnic Basket Bed" had 4 px to the pencil line, now they wrap.

Left for the release day (1 Mar 2027):

- [ ] Deploy the Worker first, with `FR_LIM { notes 12, gifts 49, decor 40, houses 16 }` (`cloudflare/worker.js`), so friends' yards take the Sakura decorations and the
  Blossom Kennel. An older Worker is handled in the game (`FR.sakOld`), but the Worker comes first.
- [ ] Merge `main` once v2.29.1 and the Kind shop fix have landed (the `minor` flag in `49c_news.js`, `nwSort`, `run_tests.js` are the likely conflicts), regenerate
  `packed.js` and the font subsets instead of hand-merging, run `i18n_extract.js --en`, check for new untranslated keys, then the suites above and `i18n_fit` again.
- [ ] The Game Manager picks the version: change the `NEWS_V230` id (`2.30`), `nw.v230.*` keys and `CHANGELOG.md`; date stays `2027-03-01` unless the owner moves it.
- [ ] Owner's go-ahead and launch date (special update), then itch.io, Marketing briefing, `dogs/check_identical` against the last release.
