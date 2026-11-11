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

## The items (18)

| Part | Item | Kind | Price | Bond | Notes |
|---|---|---|---|---|---|
| Decor | Hanami Picnic Blanket | yard floor (flat) | 90 | 1 | pink-and-white check blanket, a folded corner |
| Decor | Sakura Paper Lanterns | yard wall, `lit` | 110 | 1 | round pink paper lanterns on a string; glow after dark |
| Decor | Paper Sakura Tree | yard floor | 140 | 2 | paper blossoms on a wooden tree in a pot (real cherry is not dog-safe) |
| Decor | Bento Picnic Table | yard floor | 100 | 1 | a low table, a wooden bento box, two tea cups (all wood and paint) |
| Decor | Koinobori Pole | yard floor | 130 | 2 | three cloth carp streamers on a pole |
| Clothes | Sakura Petal Crown | head | 55 | 1 | pink paper blossoms on a soft green band |
| Clothes | Hanami Sun Hat | head | 60 | 1 | a straw hat with a blossom sprig in its band |
| Clothes | Sakura Bandana | neck | 50 | 1 | pink bandana with white five-petal flowers |
| Clothes | Blossom Garland | neck | 55 | 1 | a sagging string of paper blossoms |
| Clothes | Sakura Haori | body | 80 | 2 | a pink haori jacket, white blossoms, a white tie, a darker hem band |
| Clothes | Sakura Mochi Suit | body | 75 | 2 | a pink round suit wrapped in a big green leaf (a look, not a snack) |
| Clothes | Butterfly Wings | body | 70 | 1 | yellow and pink felt wings on a soft strap (the Snowflake Wings rig) |
| Clothes | Spring Knit Cardigan | body | 65 | 1 | a mint knit with blossom buttons |
| Toys | Squeaky Dango | toy (Squeaky Duck game) | 50 | 1 | three felt dango balls on a felt stick |
| Toys | Petal Ball | ball play (2 coins a return) | 45 | 1 | a pink ball with petals; ball-play caps 16 a session, 40 a day |
| Toys | Plush Koi | toy (Plush Bone game, nap buddy) | 65 | 2 | a soft red-and-white carp; +10% nap Energy once |
| Treats | Sakura Pup Mochi | snack | 10 | | sweet potato tinted with beetroot, in a cabbage leaf (no real mochi) |
| Treats | Hanami Rice Ball | snack | 12 | | plain rice and boneless plain salmon, no salt, soy or umeboshi |

One of each: 570 decor + 510 clothes + 160 toys = 1,240 coins, plus treats (the winter set was about 2,700 with homes). Toy-game coins come under the
one toy-game cap (`FF_CAPS.toys`, 30 a Japan day); the Petal Ball pays through ball play's own caps, like the Snowball Ball.

Wear: nothing here is warm wear (spring) and nothing is a raincoat; the dogs still look wet in the rain in every costume except the old raincoats.

## The market scene

The `sakura` scene (`fmscene` theme `sakura`, world E) is dressed like the winter one: the Sakura Paper Lanterns under the decor awning, the Bento
Picnic Table and the blanket on its counter, the Paper Sakura Tree beside it and the Koinobori Pole at the right edge; four costumes on hangers and the
crown and bandana on the counter; toys in baskets; a treats cart in front (no homes this market, so no homes stand); the same blank boards (the game
writes the stall names); pink blossom clouds at both edges, petals lying on the ground, and petals falling in the air (a CSS animation on the game's
side, still under `prefers-reduced-motion`).

## Decisions

- Every year, no edition (owner rule: markets come back every year).
- Eight costumes, not ten: two head, two neck, four body; the Butterfly Wings and the head pieces leave room for a hat (the wings) or a body piece.
- No homes in this market (the winter homes set was the big art cost; the plan asks for about one market per release).
- The koinobori is Children's Day (5 May), a little after the window; it is a spring look and the owner's plan lists it, so it stays.

## Open questions for the owner

1. Launch date and go-ahead (the window opens 25 Mar 2027).
2. Stock is about 1,240 coins (the plan said about 3,000): add a homes stall (a Blossom Kennel and two beds) in a later part?
3. Should the Spring Knit Cardigan count as warm wear (no shivering in a late snow)? Now: no.
4. Music: a Sakura Market variant (`paw-music`, like the Winter Market's), or the plain market music? Now: the plain market music.

## Status

See the bottom of this file (filled in as the parts land).
