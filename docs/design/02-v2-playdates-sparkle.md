# Paw Haven v2: Playdates & Sparkle

2026-10-04 · @Anson

v2 lets two well-loved adult dogs have Puppy Playdates, teaches real coat genetics in plain language, and pays off the v1.1 Sparkle Stone with rare Sparkle puppies: 1 in 512 per puppy, guaranteed by the 24th.

Builds on the v1 proposal: @someone

## Roadmap

Five releases build on each other before v2: v1.1 gives walks a purpose, v1.2 adds real time and weather, v1.3 turns the veggie patch into a garden and kitchen, v1.5 gives the player a second dog, and v2 turns two dogs into a family. Each release ships something the next one needs, so the order is fixed.

| Version | Adds | Why it comes here | Size (estimate) |
| --- | --- | --- | --- |
| v1.1 Treasure Hunt (built) | Treasure-hunt walks, item abilities, the Treasure Journal, a 5th charm slot, the Sparkle Stone tease | Gives walks a reason; builds the Journal and charm slot that later releases reuse | Built |
| v1.2 Weather & Walks (in build) | Real-time clock and weather, weather reactions, raincoats, interactive toys, the runner walk, cozy generative music | The clock and weather drive the garden's growth and seasons | In build now |
| v1.3 Garden & Kitchen | A 6-to-12-plot garden, Pip's Sprout Cart, seasons by real month, a kitchen, a cooking mini-game, the Journal recipe book (see the Garden & Kitchen tab); every dog gets a sex, an age and hidden genes, shown on a new Dog Profile | Needs only v1.2 and the Journal, and gives every player a daily loop before the risky save change | 6 weeks |
| v1.5 Second Dog & Phone | A second adoption at Bond 5, home capacity by house tier, rotating shelter rescues, the phone (portrait) version | v2 needs two dogs and a save file that holds many; rescues bring rare genes such as merle into the town; phone widens the audience before the big content drop | 8 weeks |
| v2 Playdates & Sparkle | Puppy Playdates, coat genetics, the Vet Hut, Family Tree, Coat Collection, Sparkle puppies, pen-pal families, Sunflower Farm | The late-game loop for players past Bond 10; pays off the Sparkle Stone | 14 weeks |

The roadmap below shows the gates between releases. v2 does not ship until a real vet has reviewed the welfare text.

*[Embedded chart/diagram - see the original doc]*

v1.5 must ship before v2 because playdates need two dogs and a save file that holds many; v1.1's Stone and Journal flow straight into v2.

## Puppy Playdates

A male and a female adult dog at Bond 6 or higher can have a Puppy Playdate at Sunny Park while she is in season. She is then expecting for 2 real days, and 1 to 3 puppies are born at home. Nobody buys or sells a dog in Paw Haven: puppies the player cannot keep go to friendly town families, who send postcards and small gifts later.

**Words we use.** Puppy Playdate, Family Tree, Puppy Basket, in season, Expecting, graduation, adopting out, pen-pal family. Words we never use in game: breed (as a verb), stud, litter price, sell, stock.

**Requirements to start a playdate**

| Requirement | Value | Why |
| --- | --- | --- |
| A pair | One male and one female | Real reproduction; same-sex pairs can still have playdates, just no puppies |
| Age, both dogs | Adult: 12 dog months (12 real days) or older | Young dogs are still growing |
| Age limits | Female under 6 dog years; male under 8 dog years (senior) | Older dogs should not have litters |
| Season | The female is in season (3 real days out of every 6) | Real dogs can only conceive in season |
| Rest | She skipped one full season since her last litter; he rested 2 real days since his last playdate | Recovery between litters |
| Bond, each dog | 6 or higher (1,000 Bond points, about day 8 on the v1 curve) | Playdates are a reward for care |
| Care meters, each dog | Hunger, Happiness, Energy and Cleanliness all at 50 or above | Only healthy, content dogs |
| Not fixed | Neither dog is spayed or neutered | A fixed dog never breeds |
| Home | Cozy Cottage (tier 3, 800 coins) or better | A Cottage is the first house with room for 2 dogs |
| Puppy Basket | Empty (Royal Castle Kennel: up to 2 litters) | One litter at a time keeps the home calm |
| Picnic Basket | 120 coins, bought at Kibble Corner | The playdate is a picnic |

### Male and female, on a real-life clock

Every dog is a boy or a girl, and every reproductive rule follows real dogs at a scale of 1 real day = 1 dog month. Most numbers are real-world proportions; a few are capped or lengthened so the game stays gentle and playable. v1.3 already stores sex, age and hidden genes on every dog and shows them on a Dog Profile page, so v2 only switches breeding on.

| Rule | Real dogs | Paw Haven | Real or game |
| --- | --- | --- | --- |
| Time scale | — | 1 real day = 1 dog month; 12 real days = 1 dog year | Scaled |
| Pair | A male and a female | One male + one female; same-sex friends can play but never have puppies | Real |
| Life stages | Puppy, adolescent, adult, senior from about 7 years | Puppy 0–5 months, young 6–11, adult 12 months to 7 years, senior 7+ (84 real days); shelter dogs arrive at 10 months | Real proportions |
| Maturity | Mature at roughly 6 to 24 months by breed; breed clubs will not register litters from very young mothers | Both dogs 12 dog months or older | Real proportion, one age for all breeds |
| Senior limit | Breeding is not advised for older dogs | No breeding at 8 dog years or older | Real proportion |
| Heat cycle | A season about every 6 months (it varies by breed), lasting about 2 to 3 weeks | A season every 6 dog months (6 real days), seeded per female, lasting 3 real days | Cycle real; length extended so players don't miss it |
| Male cycle | No cycle | No cycle; rests 2 real days after a playdate | Rest is a game cap |
| Pregnancy | About 63 days | 2 real days ("Expecting!"): +20% Hunger decay, a vet check-up bonus, walks only at Sunny Park, no playdates | Real proportion |
| Litter size | Often 4 to 10, larger in big breeds | Small breeds 1–3, medium 1–3, large 2–3 (see below) | Capped |
| Puppy sex | About 50/50 | 50/50 | Real |
| Inheritance | One copy of each gene from each parent | Mendelian, as in the Genetics section | Real, simplified to 6 genes |
| Staying with mum | Puppies leave at about 8 weeks at the earliest | Puppies stay with mum for 2 dog months (2 real days) | Real proportion |
| Mum's recovery | Vets advise rest between litters; breed clubs cap litters per mother | Skip at least one full season between litters; at most 4 litters; none after 6 dog years | Real-world guidance, applied strictly |
| Relatives | Close inbreeding raises the risk of inherited disease | Blocks parent, child, full or half sibling, grandparent, grandchild, aunt, uncle, niece, nephew and first cousin | Stricter than real clubs |
| Spay and neuter | A responsible-owner choice | Free at the Vet Hut; the dog is marked fixed and never breeds; no other effect | Real |

The Dog Profile already shows each female's season ("In season" or "Next season in 3 days") from v1.3. Males show "Ready for playdates in v2" until v2 ships.

**Litter size by breed size.** The mother's breed sets the litter size. A mixed-breed mum uses the size both her parent breeds share, or medium if they differ. Real litters are bigger; these are capped for the cozy game.

| Size | Breeds | Puppies | Chances | Average |
| --- | --- | --- | --- | --- |
| Small | Dachshund, Corgi | 1–3 | 40% / 40% / 20% | 1.8 |
| Medium | Shiba, Mutt, most mixes | 1–3 | 30% / 50% / 20% | 1.9 |
| Large | Golden, Husky | 2–3 | 60% / 40% | 2.4 |

Across the 6 breeds a litter averages about 2.0 puppies. Litter size never depends on money or Bond, so nobody grinds for bigger litters.

**Expecting and birth.** After the playdate, the mum shows an "Expecting!" chip for 2 real days and naps more. The player feeds her more and can take her to Dr. Hazel for a check-up (+10 Happiness and a tip card). Then the puppies are born in the whelping basket at home, and the litter reveal plays.

**With mum.** Puppies stay in the Puppy Basket with their mum for 2 dog months (2 real days) and do not use a home slot. They start at Bond 3 because they were born into the family. After 2 days they graduate, and the player picks who stays and who goes to a pen-pal family. A kept puppy becomes an adult at 12 dog months, so it can have its own first playdate about 12 real days after birth.

**Home capacity.** Every kept dog needs a slot. Extra dogs can rest at Sunflower Farm, a sunny place to visit and swap dogs in and out. Farmer June cares for them, so their meters never drop.

| Place | Dogs |
| --- | --- |
| Cardboard Box, Classic Wooden Doghouse | 1 |
| Cozy Cottage, Snow Igloo | 2 |
| Treehouse Den | 3 |
| Royal Castle Kennel | 4 |
| Sunflower Farm | 4, then +4 per barn (up to 16) |

**Pen-pal families.** 12 town families adopt puppies, for example the Okafors, Grandpa Lou, the Kim twins and Ms. Petrova at the bakery. Adopting out is free and nothing is paid at the door. Each family sends 3 postcards: a thank-you doodle on day 2, a photo and a gift on day 14 (40 coins or a cosmetic), and a birthday card with a gift on day 30 (80 coins or a rare cosmetic). After that they send a birthday card each month with no gift. Grown puppies also appear at Sunny Park with their family and say hello.

### Health and welfare rules

The game follows a short set of rules taken from real dog care. When a rule blocks a pair, Dr. Hazel at the new Vet Hut explains why in two friendly sentences and suggests a partner who would work. Each block is a teaching moment, not a scolding.

| Rule | The real reason | What the game does |
| --- | --- | --- |
| One male and one female | That is how puppies are made | Same-sex pairs get a friendly playdate and no puppies. Dr. Hazel: "Biscuit and Juniper are best friends. Puppies need a mum and a dad, though." |
| Never pair two merle dogs | Puppies with two merle genes (double merle) are often born deaf, blind or both | Blocks the pair. Dr. Hazel: "Two merle parents can give puppies trouble with their ears and eyes. Let's find Smudge a solid-coated friend." |
| Check for hidden merle | Merle does not show on a red or cream coat, so a red dog can carry it secretly | The game always knows. The block names the hidden gene and reveals it for free |
| No close relatives | Relatives share genes, which raises the risk of inherited illness | The Family Tree check blocks parents, children, siblings, half-siblings, grandparents, grandchildren, aunts, uncles, nieces, nephews and first cousins, and lists unrelated partners |
| Adults only, and not too old | Young dogs are still growing; older mums face more risk | Both dogs 12 dog months or older; females under 6 dog years, males under 8 |
| Only in season | Females can only conceive in season | Outside her season, the partner list shows "Next season in N days" |
| Mum skips a season after each litter | Her body needs time to recover | A season-skip chip on her Profile; a male rests 2 days |
| 4 litters per mum in her life | Real breed clubs cap litters per mother | After her 4th litter she earns a Proud Grandparent badge and a rocking-chair idle pose |
| Care while expecting | Pregnant dogs need more food and calm | +20% Hunger decay, walks only at Sunny Park, no playdates, a vet check-up bonus |
| Healthy and content | Only well-cared-for dogs should have puppies | Below 50 on any meter, Dr. Hazel says: "Come back after a snack and a nap." |
| Spay and neuter | Many owners choose it, and it prevents unplanned litters | Free at the Vet Hut, explained in two sentences, never pushed |
| Long backs need care | Dachshund and Corgi mixes have long backs that are easy to hurt | Not a block: the first long-backed puppy comes with a free Doggy Ramp and a tip card |

## Genetics: how coats are inherited

Every dog carries 6 hidden gene pairs, one copy from each parent, and those pairs decide its coat and eyes. The rules are a simplified version of real dog coat genetics, so what players learn here is true in the real world.

**The three ideas players need**

1. Every gene comes in a pair. A puppy gets one copy from each parent, picked at random, like a coin flip.
2. A **dominant** version (capital letter) shows with one copy. A **recessive** version (small letter) shows only with two copies.
3. A dog with one hidden recessive copy is a **carrier**. It looks normal but can pass the gene on. Two carriers can surprise you with a puppy that looks like neither of them.

**The six gene pairs**

| Gene pair | Versions | What two copies (or one, if dominant) do | Real-world basis |
| --- | --- | --- | --- |
| B, coat base | B black, b liver | bb turns black pigment brown (liver, also called chocolate): brown nose, amber eyes | The B locus (TYRP1) |
| D, dilution | D full colour, d dilute | dd fades the coat: black becomes blue (soft grey), liver becomes lilac | The D locus (MLPH) |
| E, red | E colour, e red | ee makes the coat grow only red pigment: red, gold or tan. It also hides merle | The E locus (MC1R) |
| S, white spotting | S solid, sp piebald | sp sp gives big white patches | The S locus (MITF) |
| M, merle | M merle, m plain | One M gives merle smudge patches. Two M is never allowed (health rule) | The M locus (PMEL) |
| Bl, husky blue eyes | Bl blue, bl none | Dominant: one copy gives blue eyes. One copy only: a 1 in 4 chance of odd eyes instead | The husky blue-eye gene (ALX4) |

**Eye colour rule,** checked in this order: any Bl gives blue eyes (or odd eyes on a 1 in 4 roll if the dog has only one copy). Otherwise a merle dog has a 1 in 4 chance of odd eyes. Otherwise bb gives amber eyes. Otherwise eyes are brown.

Real coat colour uses more genes, such as K and agouti. We fold those into each breed's fixed markings instead: the Husky mask, Corgi socks and Shiba cream cheeks are drawn on top of whatever colour the genes make. A red dog with dd is cream.

*[Embedded chart/diagram - see the original doc]*

The game reads the genes top to bottom; a red dog jumps straight to white spotting, which is why a red coat can hide a merle gene.

**The starter dogs' genes.** Bold marks a hidden carrier gene.

| Dog | Looks | B | D | E | S | M | Bl | Hidden carriers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mochi the Shiba | Red-orange and cream | B **b** | D **d** | e e | S S | m m | bl bl | Liver, dilute |
| Biscuit the Corgi | Tan and white | B B | D D | e e | S **sp** | m m | bl bl | Piebald |
| Sunny the Golden | Golden yellow | B **b** | D D | e e | S S | m m | bl bl | Liver |
| Noodle the Dachshund | Chocolate, amber eyes | b b | D D | E E | S S | m m | bl bl | None |
| Frost the Husky | Grey and white, blue eyes | B B | D **d** | E **e** | S **sp** | m m | Bl Bl | Dilute, red, piebald |
| Pepper the Mutt | Black-and-white patched | B **b** | D **d** | E **e** | sp sp | m m | bl bl | Liver, dilute, red |

No starter dog is merle. Merle enters town through v1.5 shelter rescues, such as Smudge (a black merle Corgi) and Dapple (a liver merle Dachshund). Clementine, a red Corgi rescue, secretly carries merle under her red coat.

### Punnett examples

A Punnett square lists one parent's two copies across the top and the other's down the side. Each of the 4 boxes is one equally likely puppy.

**Example 1: a surprise piebald.** Biscuit (S sp) and Frost (S sp) both look solid. Both carry piebald.

|  | Frost gives S | Frost gives sp |
| --- | --- | --- |
| **Biscuit gives S** | S S, solid | S sp, solid carrier |
| **Biscuit gives sp** | S sp, solid carrier | sp sp, **piebald** |

Each Horgi puppy has a 1 in 4 chance of being piebald, from two solid parents. 2 in 4 puppies are hidden carriers. The reveal card says: "Piebald! A secret from both sides of the family."

**Example 2: lilac from two dogs who look nothing like it.** Mochi (B b, D d, e e) and Pepper (B b, D d, E e) both carry liver and dilute.

|  | Pepper gives B | Pepper gives b |
| --- | --- | --- |
| **Mochi gives B** | B B | B b |
| **Mochi gives b** | B b | **b b, liver** |

The D gene works the same way, so dd is also 1 in 4. The puppy must not be red (ee hides the colour), which is 1 in 2. Each gene is a separate coin flip, so the chances multiply:

```latex
P(\text{lilac}) = \tfrac{1}{4} \times \tfrac{1}{4} \times \tfrac{1}{2} = \tfrac{1}{32}
```

The same pair makes a blue puppy 3 in 32 times and a red or cream puppy 16 in 32 times.

**Example 3: merle and the health rule.** Smudge (M m) and Biscuit (m m): each puppy has a 1 in 2 chance of merle. Smudge and Dapple (M m and M m) would give a 1 in 4 chance of a double merle puppy, so the game blocks that pair.

### Gene Sniffer and the Vet Hut

Unknown genes show as "?" in the Family Tree until the player finds them. There are three ways to learn a dog's genes.

| Way | Cost | What it reveals |
| --- | --- | --- |
| Look | Free | What the coat proves. A piebald dog must be sp sp; a solid dog is S and one unknown, shown "S ?" |
| Vet gene test at Dr. Hazel's Vet Hut | 150 coins per dog, once | All 6 pairs of one dog |
| Gene Sniffer (Kibble Corner, unlocks at Bond 6) | 1,200 coins, reusable | All 6 pairs of any dog after a 10-second sniff animation |

A puppy's genes can also be worked out from its parents. The Journal fills in anything the player could prove, and says how: "Biscuit must carry piebald, because her puppy Pickle is piebald." Before a playdate, the Puppy Forecast shows the odds of each coat from the known genes, with grey "?" bars where genes are unknown.

## Sparkle: the rare-variant system

Sparkle has three separate layers: rare colours players earn by planning, named mixes they earn by pairing breeds, and true Sparkle puppies that only luck can bring. The system is inspired by the shiny variants in creature-collecting games, but every name and rule here is our own. Rarity uses the same four ink stamps as the v1.1 Treasure Journal: Common, Uncommon, Rare and Legendary.

### Layer A: rare genetic colours (planned, inheritable)

These follow the genetics rules exactly, so a player who reads the Family Tree can plan for them.

| Rare look | Genes needed | Fastest plan from the starters | Chance per puppy | Stamp |
| --- | --- | --- | --- | --- |
| Piebald on a pure breed | sp sp | Biscuit and Frost, both carriers | 1 in 4 | Uncommon |
| Cream | e e, d d | Mochi and Frost | 1 in 8 | Uncommon |
| Blue | B, d d, E | Mochi and Frost | 1 in 8 | Rare |
| Merle | One M | Rescue Smudge and any non-merle dog | 1 in 2 | Rare |
| Odd eyes | One Bl (1 in 4 roll) or merle (1 in 4 roll) | Frost and any non-husky dog | 1 in 4 | Rare |
| Blue eyes on a Corgi | Bl in a dog that is at least 75% Corgi | A Horgi and an unrelated Corgi, over 2 generations | 3 in 8 | Rare |
| Lilac | b b, d d, E | Mochi and Pepper | 1 in 32 | Legendary |
| Lilac merle | b b, d d, E, one M | A lilac carrier line and a merle rescue, over 2 to 3 generations | 1 in 16 or better with a planned pair | Legendary |

### Layer B: rare mixed breeds (named crosses)

Crossing two breeds gives a named mix with its own look and joke. A puppy that is at least 75% one breed shows as that breed, with a note in the tree ("Corgi, 1/4 Husky"). A puppy whose top two breeds are each at least 25% shows as their mix. Mixes inherit the favourite foods and activities of both breeds.

| Cross | Mix name | Look | Personality and joke |
| --- | --- | --- | --- |
| Corgi × Husky | Horgi | Husky coat and mask on Corgi legs, blue eyes | Chatty and greedy. Howls for snacks; the howl is short, like the legs |
| Dachshund × Corgi | Dorgi | Very long, very low, enormous ears | Curious foodie. Calls itself a tunnel enthusiast. Comes with the Doggy Ramp |
| Shiba × Husky | Husky Inu | Fox face, wolf mask, curled fluffy tail | Dramatic and loud. Argues with the doorbell and wins |
| Shiba × Corgi | Corgi Inu | Red fox loaf on short legs | Proud and greedy. Sits only when paid in biscuits |
| Shiba × Golden | Golden Shiba | Fluffy golden fox | Pretends to hate fetch. Fetches anyway, then looks away |
| Shiba × Dachshund | Doxi-Inu | A long red fox | Digs a hole, then acts like it was already there |
| Corgi × Golden | Golden Corgi | Golden Retriever top half, Corgi legs | Loves fetch. Runs at full speed and arrives later than expected |
| Golden × Dachshund | Golden Dox | Long dog with a golden plume tail | Brings you every rock it finds, one at a time |
| Golden × Husky | Goberian | Big golden cloud with a husky mask, blue eyes | Tells you about its whole day, loudly |
| Dachshund × Husky | Dusky | Husky fluff on a long body, blue eyes | Howls into holes for the echo |
| Shiba × Mutt | Shiba-ish | Curled tail and mystery spots | Stares at walls meaningfully |
| Corgi × Mutt | Corgi-ish | Corgi loaf with mystery patches | Sits for food before anyone asks |
| Golden × Mutt | Golden-ish | Golden fluff with Pepper's mystery spots | Fetches things nobody threw |
| Dachshund × Mutt | Doxie-ish | Long body, one floppy ear, one perky ear | Investigates every sock in the house |
| Husky × Mutt | Husky-ish | Husky mask with patches, blue eyes | Howls softly so it won't disturb anyone |
| Chihuahua × Dachshund | Chiweenie | A tiny long body with giant bat ears | A hot dog with a security system. Burrows under every blanket, then guards it |
| Pug × Beagle | Puggle | Beagle body, a shorter wrinkly face, a curly flag tail | Follows its nose until it needs a nap, then snores where the smell ended |
| Greyhound × Husky | Greysky | Very long legs, a husky mask, blue eyes | Does zoomies, then howls a full report about the zoomies |
| Chihuahua × Pug | Chug | Bat ears on a squished face | Barks at the doorbell, snorts at its own bark, then needs a lie-down |
| Beagle × Corgi | Beagi | Beagle tricolour on Corgi legs | Very short, very loud. Bays at snacks it has not found yet |
| Pug × Corgi | Porgi | A round loaf with a squished face and giant ears | Greedy times two. Sits by the bowl before it is even dinner time |
| Beagle × Dachshund | Doxle | A long, low beagle with floppy ears | Digs exactly where its nose says. Its nose is wrong about half the time |
| Greyhound × Golden | Goldhound | Long golden legs and a feathery whip tail | Fetches at top speed, then naps for 20 hours with the ball |
| Greyhound × Dachshund | Long Dog | Long in both directions: tall legs AND a long body | Arrives in two instalments |
| Chihuahua, Pug, Greyhound or Beagle × Mutt | Chihuahua-ish, Pug-ish, Greyhound-ish, Beagle-ish | The breed's big trait plus Pepper's mystery spots | Same "-ish" rule as the other Mutt crosses, with a 1 in 4 Mystery Feature |

Every "-ish" puppy has a 1 in 4 chance of a Mystery Feature from Pepper's side: a heart-shaped spot, a curly tail, eyebrows or one floppy ear.

**Ten breeds (v1.7).** With 10 breeds there are 45 possible two-breed pairs. The 28 named mixes above get their own look and joke; the other 17 pairs show as "[Breed] × [Breed] mix" and still inherit both breeds' traits. The new breeds follow the same genes: Chihuahua mixes can be merle (about 10% of Chihuahua rescues carry it), while Pug, Greyhound and Beagle never carry merle.

**Grand-mixes (Legendary).** Three breeds at 25% or more each make a grand-mix. Three recipes have names; any other three-breed dog shows as "[top breed] family mix".

| Recipe | Grand-mix | Look and joke |
| --- | --- | --- |
| Corgi + Husky + Dachshund | Sled Noodle | The longest, lowest, fluffiest dog in town. Pulls a tiny sled carrying exactly one sock |
| Shiba + Corgi + Golden | Sunrise Loaf | A golden-red loaf with a curled tail. Lies in a sunbeam and moves with it all day |
| Golden + Husky + Mutt | Snowdrift | A huge patchy cloud dog. Vanishes completely in snow |
| 4 or more breeds at 12.5% or more each | The Everything Dog | Mismatched ears and three kinds of fur. Its Journal entry just says "Yes." |

### Layer C: true Sparkle puppies (luck only)

Every puppy has a 1 in 512 base chance of being born Sparkle, rolled at birth and separate from its genes. Sparkle is a one-in-many surprise, like a real new mutation: it cannot be planned, only invited (odds and boosts in the next section).

A Sparkle puppy keeps its genetic colour, but the crayon turns metallic. The finish follows the base coat, so collecting every finish needs genetics planning too.

| Base coat | Sparkle finish |
| --- | --- |
| Black | Midnight Silver |
| Liver | Copper |
| Blue | Steel Blue |
| Lilac | Rose Gold |
| Red, gold or tan | Sunburst Gold |
| Cream | Pearl |
| Any merle | Opal (rainbow speckle) |

**What a Sparkle puppy gets:** a metallic crayon coat with 5 to 8 glitter specks that twinkle about every 4 seconds, a tiny star glint in each eye, a gold-foil nameplate, and a rainbow-foil Sparkle stamp in the Journal.

**The Sparkle promise:**

- Cosmetic only. No stat, coin, Bond or litter bonus.
- Never sold for real money, never in a bundle, and no paid boosts. Boosts come only from play.
- No trading, so there is no Sparkle market.
- A Sparkle puppy can be adopted out after a confirm step. That family's postcards arrive with glitter on them.

## Sparkle odds and boosts

Every puppy starts at 1 in 512, play-earned boosts raise that to as good as 1 in 28, and the Sparkle Meter guarantees a Sparkle on the 24th puppy since the last one. The meter sets the longest wait; the boosts decide how often a Sparkle arrives early.

**Boosts.** Boosts multiply together.

| Boost | Effect on odds | Why it makes sense in the story |
| --- | --- | --- |
| Sparkle Stone (v1.1 charm) equipped on either parent at the playdate | ×4 | The v1.1 tease pays off. The Stone "hums" because it reacts to puppies. Only one Stone exists, so it counts once |
| Each Sparkle parent | ×1.5 (×2.25 for two) | Sparkle runs a little in families |
| Both parents at Bond 8 or 9 | ×1.5 | Happy, well-loved parents |
| Both parents at Bond 10 | ×2 (replaces the Bond 8 boost) | The best-loved dogs in town |
| Sparkle Meter | The 24th puppy since the last Sparkle is always Sparkle | A promise that nobody waits forever |

The largest multiplier is 4 × 2.25 × 2 = 18, which is 1 in 28.4. A first Sparkle cannot use the Sparkle-parent boost, so the best first-Sparkle setup is the Stone plus Bond 10, at 1 in 64.

**Cadence and odds table.** Real-life rules set how fast puppies come. A mum can have a litter at most every 2 seasons (12 real days), and a litter averages 2.0 puppies, so each breeding female gives about 1.17 puppies a week. A 2-dog home (one male, one female) makes about 1.2 puppies a week; a Castle home with 3 females and 1 male makes about 3.5. That is about half the pace of the earlier draft, so the Sparkle Meter now fills at 24 puppies instead of 40, which keeps the chase near the same length for a 4-dog home.

| Setup | Multiplier | Odds per puppy | Expected puppies to a Sparkle (meter at 24) | Chance before the meter fills | Weeks, 2-dog home | Weeks, Castle home (3 females) |
| --- | --- | --- | --- | --- | --- | --- |
| No boosts | ×1 | 1 in 512 | 23.5 | 4% | 20.1 | 6.7 |
| Both parents Bond 8+ | ×1.5 | 1 in 341 | 23.2 | 7% | 19.8 | 6.6 |
| Sparkle Stone | ×4 | 1 in 128 | 22.0 | 17% | 18.8 | 6.3 |
| Stone + both Bond 10 | ×8 | 1 in 64 | 20.1 | 30% | 17.2 | 5.8 |
| Stone + Bond 10 + one Sparkle parent | ×12 | 1 in 43 | 18.5 | 42% | 15.8 | 5.3 |
| All boosts (two Sparkle parents) | ×18 | 1 in 28 | 16.4 | 56% | 14.0 | 4.7 |

**The maths.** With odds p per puppy, the chance of at least one Sparkle in n puppies is 1 − (1 − p)^n. With a guarantee on puppy N, the expected number of puppies to a Sparkle is:

```latex
E = \sum_{k=0}^{N-1} (1-p)^k = \frac{1-(1-p)^{N}}{p}
```

With no boosts, p = 1/512 and N = 24, so E = 512 × (1 − (511/512)^24) = 23.5 puppies. Without the meter, E would be 1/p = 512 puppies, about 8 years for a 2-dog home at 1.2 puppies a week. Real-life cadence makes puppies slow, which is why the meter is essential. With the Stone and Bond 10, p = 1/64 and E = 20.1 puppies. A second breeding female roughly doubles the pace, so the fastest way to a Sparkle is a bigger, happier family, not money.

*[Embedded chart/diagram - see the original doc]*

With no boosts, only 4% of players see a Sparkle before the meter fills; with the Stone and Bond 10, 30% do, and with two Sparkle parents more than half.

**The Sparkle Meter** is a crayon jar in the Journal with 24 notches. Every puppy born adds one speck of glitter, kept or adopted out. It empties when a Sparkle is born. The meter is always visible, so the chase feels fair.

**Finding the Stone.** Players who reach 10 puppies without the Sparkle Stone get a hint: their next Riverside Trail treasure is the Stone. At v2 launch, players who already own it get a letter: "The Sparkle Stone is humming louder than ever. Maybe it likes puppies?"

## Journal: Family Tree and Coat Collection

v2 adds two tabs to the v1.1 Treasure Journal, Family Tree and Coat Collection, giving players 73 entries to collect after Bond 10. Both reuse the Journal's sketchbook spread, pencil silhouettes and ink stamps.

**Family Tree.** Every dog the player has adopted or seen born is recorded here forever: dogs at home, dogs at Sunflower Farm, and puppies adopted out (marked with a postcard stamp and their family's name). The page centres on one dog and shows 3 generations above it and its puppies below. Each dog card shows its name, breed or mix, a coat chip, its 6 gene pairs ("?" where unknown) and a star if it is Sparkle. Tapping "Find a partner" lists the dogs who pass every welfare rule, each with a Puppy Forecast.

**Coat Collection.** A collection grid in 4 pages. A found entry shows the first dog that earned it, its parents and the date. An unfound entry is a pencil silhouette with a hint, such as "Two dogs who both secretly carry dilute...".

| Page | Entries | What counts |
| --- | --- | --- |
| Coats | 20 | 6 base colours (black, liver, blue, lilac, red, cream), each solid or piebald (12), plus 4 merle colours, each solid or piebald (8). Merle cannot show on red or cream |
| Eyes | 4 | Brown, amber, blue, odd |
| Breeds and Mixes | 42 | 10 breeds, 28 named mixes, 3 named grand-mixes, The Everything Dog |
| Sparkle | 7 | One per Sparkle finish |
| **Total** | **73** |  |

The 4 merle colours are named after their base: black merle, liver merle, slate merle (blue base) and lilac merle. A one-line note teaches the real names: breeders call black merle "blue merle" and liver merle "red merle".

**Collection rewards.** All rewards are cosmetic or titles.

| Goal | Reward |
| --- | --- |
| 10 Coat Collection entries | Title "Gene Detective" on the HUD name tag |
| 25 entries | Rainbow Collar (neck wearable) |
| 40 entries | Giant Crayon Box decoration for the Home Yard |
| All 73 entries | Title "Keeper of the Crayon Box" and a gold Family Tree frame |
| All 7 Sparkle finishes | Title "Glitter Legend" and a glitter paw-print trail on walks |
| 3 generations in one line | Family photo frame for the Home Yard |
| 5 generations in one line | Title "Great-Great-Granddog" |
| Postcards from all 12 pen-pal families | A complete postcard album page and the title "Friend of Paw Haven" |

## Economy and pacing

v2 adds about 40 coins a day of income and about 13,700 coins of one-time sinks, which is roughly 55 days of v1 earnings for players who have already bought every house. Playdates themselves stay cheap, at 120 coins a playdate, so nobody feels taxed for having puppies.

**Costs**

| Item or action | Paw Coins | Limit |
| --- | --- | --- |
| Picnic Basket (needed for each playdate) | 120 | One per playdate |
| Vet welfare check | Free | Automatic before every playdate |
| Vet gene test | 150 | Once per dog |
| Gene Sniffer | 1,200 | Buy once; unlocks at Bond 6 |
| Puppy Starter Kit (bed, bowl, tiny bandana) | 200 | Per kept puppy; the first is free |
| Puppy Mash | 12 | Puppy food during Puppy Season |
| Sunflower Farm barns 2, 3 and 4 | 2,000 / 4,000 / 6,000 | +4 farm slots each |
| Family Portrait by the town painter | 500 | Any time; a framed crayon portrait for the Home Yard |
| Second adoption and shelter rescues | Free | Needs a free home or farm slot |

**New income**

| Source | Paw Coins | Typical per day |
| --- | --- | --- |
| Pen-pal gifts (day 14 and day 30 postcards) | 120 per adopted-out puppy | About 25 |
| Weekly Puppy Parade at Sunny Park | 100 and a ribbon | About 14 |

**Timers.** All times are real days, as in v1.

| Timer | Length | Real or scaled |
| --- | --- | --- |
| Dog age | 1 real day = 1 dog month | Scaled |
| Adulthood | 12 dog months (12 real days) | Real proportion |
| Female season | Every 6 real days, lasting 3 | Cycle real, length extended |
| Expecting | 2 real days | Real proportion |
| With mum | 2 real days | Real proportion |
| Mum's recovery | Skip one full season, so a litter at most every 12 real days | Real-world guidance |
| Male rest | 2 real days | Game cap |
| Litters per mum | 4, none after 6 dog years (72 real days) | Real-world guidance |
| Shelter rescues | A new rescue every 3 days, 1 in 6 with a rare gene | Game |
| Pen-pal postcards | Day 2, day 14, day 30, then a monthly birthday card | Game |
| Puppy Parade | Weekly | Game |

**Pacing for a regular player** (120 Bond points a day, 250 coins a day):

| Day | Milestone |
| --- | --- |
| 4 | Bond 4: buys the Cozy Cottage for 800 coins |
| 6 | Bond 5: adopts a second dog of the other sex (v1.5); shelter dogs arrive at 10 dog months |
| 8 | Both dogs are adults (12 dog months) |
| About 14 | Second dog reaches Bond 6 |
| About 14 to 17 | First Puppy Playdate, at her next season (seasons last 3 of every 6 days) |
| About 16 to 19 | Puppies are born after 2 days expecting |
| About 18 to 21 | Puppies graduate after 2 days with mum; one stays at Bond 3 |
| 27 | First dog reaches Bond 10 |
| About 30 to 33 | The kept puppy is an adult at Bond 6, but related to both dogs at home, so the player adopts an unrelated rescue |
| About 55 to 160 | First Sparkle: 20 to 24 puppies after the first playdate; about 6 weeks with 3 breeding females, about 4.5 months with one |

The relatives rule is also a pacing tool. It pushes players to adopt rescues and upgrade houses, which brings fresh genes and spends coins.

**What keeps players busy after Bond 10**

1. The Coat Collection's long tail: lilac merle, The Everything Dog and all 7 Sparkle finishes.
2. The Sparkle chase, with the meter always in view.
3. New Bond journeys: every kept puppy climbs from Bond 3 to Bond 10 and learns its own tricks, reusing v1 content.
4. Pen-pal families and grown puppies who say hello around town.
5. Big coin goals: farm barns and family portraits.
6. Generations: the 5-generation title takes about 2 to 2.5 months, at roughly 12 to 15 days from birth to a puppy's first playdate.

## UI flows

Four screens carry v2: the playdate flow, the litter reveal, the Family Tree and the Coat Collection. Every welfare block loops back to choosing a partner, and every puppy ends at graduation, kept or adopted out.

### Playdate flow

The player starts from a dog's action menu or from "Find a partner" in the Family Tree. Dogs who fail a welfare rule stay in the list, greyed out, with a reason chip such as "Next season in 3 days", "Resting, 2 days", "Same sex", "Sibling" or "Both merle". Choosing one opens Dr. Hazel's explanation instead of the playdate. The Puppy Forecast shows coat, eye and mix odds, plus today's Sparkle odds with every boost named, such as "1 in 64 today: Sparkle Stone ×4, Bond 10 ×2". The picnic is a 30-second comedy scene at Sunny Park where the player can pet the dogs or throw a ball.

*[Embedded chart/diagram - see the original doc]*

A failed welfare check never ends the flow; Dr. Hazel sends the player back to the partner list with a suggestion.

### Litter reveal

The reveal is the comedy and delight peak of v2. After 2 days expecting, the mum settles into the whelping basket at home and the screen cuts to a cozy close-up with a "Shh... puppies!" sign. The player lifts the blanket and the puppies pop out one at a time in a crayon scribble poof, each with a ♂ or ♀ on its card. A Sparkle puppy is always revealed last, for drama. Gerald the duck still turns up at the window with a note: "Congratulations. I still want my sandwich back."

Each puppy gets a name card with its mix name, a coat chip and one joke line, for example:

- "This one is mostly ears."
- "Piebald! A secret from both sides of the family."
- "Already asleep. A natural."
- "Has Grandpa Frost's eyes. Both of them, different colours."
- "Loaf shape confirmed."

A new Coat Collection entry slams a "NEW" ink stamp onto the card. A Sparkle puppy fades the screen to plain paper, bursts crayon glitter, plays its own jingle and turns its nameplate gold foil. The Sparkle Meter then empties with a whoosh.

*[Embedded chart/diagram - see the original doc]*

The reveal loops once per puppy; the keep or adopt-out choice waits until graduation, 2 days later, so nobody decides on the spot.

### Family Tree screen

The Family Tree centres on one dog, with parents and grandparents above and puppies below; the player scrolls up for great-grandparents. A side panel lists the dog's 6 gene pairs, with a "Sniff" button on each "?". Adopted-out dogs carry a postcard stamp and their family's name.

*[Embedded chart/diagram - see the original doc]*

Waffle's panel shows the payoff: the blue eyes trace back to Frost, the hidden piebald to Pickle, and one "?" is a single sniff away.

### Coat Collection screen

The Coat Collection is a sketchbook spread. The left page holds the grid for the chosen tab; the right page shows the selected entry, the 73-entry progress track with its 4 reward stops, and the Sparkle Meter jar.

*[Embedded chart/diagram - see the original doc]*

The grid makes the gaps visible at a glance, and the selected gap's hint points the player at the next pairing to try.

## Art implications

Rare coats stay inside the ugly crayon style by changing the crayon, not the drawing: about 40 artist-days in total, because the dogs are already drawn in code and most variants are parameters. Rare looks must read at a glance on a phone, so each one changes a single, obvious thing.

| Feature | How it is drawn in crayon | Method | Cost (artist-days, estimate) |
| --- | --- | --- | --- |
| 6 base colours and dilutes | Same scribbly strokes in a new crayon colour; dilutes look chalky and greyish | Palette swap per coat | 1 |
| Piebald | Unfilled white paper patches; the pencil outline stays, the crayon skips the patch | Seeded patch mask, unique per dog | 2 |
| Merle | Darker crayon smudge blots over a lighter base, with thumb-smudged edges | Seeded blot stamps | 3 |
| Eyes | Crayon circles round the dot pupil. Odd eyes are mismatched circles, one blue and one brown, slightly different sizes on purpose | Two colour slots; retrofit the 6 starters (Noodle amber, Frost blue) | 1 |
| 15 mixes and 4 grand-mixes | A parts kit per breed (head, ears, body length, legs, tail), plus one hand-tuned signature per mix, such as the Dorgi's extreme length | 30 swappable parts and 19 tuning passes | 13 |
| Puppies | Bigger head, stubby legs, fluff scribbles, wobbly walk | Scale rules on the parts kit | 3 |
| Sparkle coat | Metallic crayon: the coat colour swaps to a foil tone with diagonal sheen streaks and 5 to 8 glitter specks that twinkle about every 4 seconds; static specks with reduced motion | One SVG gradient per finish and a speck sprite | 4 |
| Sparkle nameplate and stamp | Gold-foil nameplate with a crayon star; rainbow-foil Journal stamp | CSS, like the v1.1 stamps | 1 |
| Litter reveal | Wobbling basket, blanket, scribble poof, glitter burst, Gerald the duck | Sprites and tweens | 4 |
| Vet Hut, Sunflower Farm, Dr. Hazel, Farmer June, 12 families | Pencil-sketchbook world props and doodle NPCs | Hand-drawn | 6 |
| Family Tree and Coat Collection screens | Sketchbook spreads matching the Treasure Journal | UI art | 3 |
| **Total** |  |  | **About 41** |

The mix parts kit is the biggest cost and the biggest risk. If the 6 breeds' parts do not combine cleanly, the fallback is one hand-drawn body per mix, about 0.5 day each. The bible still describes a chibi vector style; it should be updated to the crayon-dog direction before v2 art starts.

## Risks and open questions

The biggest risk is that breeding reads as puppy farming; the design answers it with no selling, real welfare rules and rescues at the centre. The other risks are scale problems: too many dogs, a growing save file and a Sparkle chase that feels like a grind.

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Ethics perception | Players, parents or press read playdates as puppy farming | No selling anywhere; free adoption to named families; 4-litter cap; welfare rules taught kindly; rescues as the main source of new genes; a vet reviews all welfare text; one Journal line: "Thinking about a real dog? Your local shelter has friends waiting." |
| Inventory bloat | Hundreds of puppies would bury the player | 1 to 4 dogs at home, up to 16 at the farm (20 at most); everyone else lives on as a light Family Tree record |
| Save-size growth | Saves are stored in the browser | A kept dog is about 0.5 KB; an adopted-out record about 150 bytes (genes, parents, name, family). 20 dogs and 1,000 records come to about 160 KB. v1.5 must move to a multi-dog save format first |
| Sparkle grind | 1 in 512 with slow puppies could feel endless | The 24-puppy meter, always visible; boosts earned by play; Sparkle is cosmetic only |
| Genetics too hard for some players | Teens may bounce off letters and squares | Genes stay hidden until the player looks; the Puppy Forecast does the maths; Punnett squares live in an optional "How genes work" page |
| Genetics called wrong | A simplified model can be criticised by experts | A "Simplified for play" note on the genes page; ask a canine geneticist to check the 6 rules |
| Double merle text feels scary | Deafness and blindness are heavy topics | Dr. Hazel's lines are short, calm and end with a positive suggestion |
| Pressure to sell Sparkle | A rare cosmetic is an obvious thing to monetise | The Sparkle promise is a design pillar: never sold, never boosted with money |
| Mix parts kit does not combine cleanly | Bad mixes break the comedy | Prototype 3 mixes first (Horgi, Dorgi, Goberian); fallback is one drawing per mix |

**Decisions for the game team**

- Sparkle at 1 in 512 with the meter at 24: playtest 16, 24 and 32 with the real-life litter cadence.
- Sunflower Farm capped at 16 dogs, or unlimited?
- Can adopted-out dogs ever come home again, or only visit?
- Who reviews the welfare text (a vet advisor), and what is the budget?
- Playdates with friends' dogs online: v2, later, or never? Trading stays out either way.
- Do the v1.1 treasure-hunt walks need a touch redesign for the v1.5 phone version?

