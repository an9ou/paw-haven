# Paw Haven v1.1: treasure hunt and Treasure Journal contract

This contract is shared by the game agent, the dog artist and the item/icon artist. Use exact names. Art API rules are in API.md and API_v2.md.

## Why
Walks used to throw many collectibles (leaf, flower, bone and so on) at the player, but none of them had a use and there was nowhere to see them. Version 1.1 makes every walk a TREASURE HUNT, with far fewer but meaningful finds. Every found item has an ability, and a Treasure Journal page shows everything.

## Walk = treasure hunt (laptop only)
1. **The hidden treasure.** Each walk route hides ONE main treasure.
   - A "Nose-o-meter" (a sniff meter in the walk panel) warms up as the dog approaches the right spot. It is a hot/cold meter, pencil-drawn: cold blue, warm orange, hot red with wiggle lines.
   - Sniff spots along the path give clue speech bubbles, for example "Smells like... adventure. And ducks." Each sniff also nudges the meter.
2. **Dig spots.** Each route has 3–4 dig spots, and only ONE holds the main treasure.
   - The player gets 2 digs per walk (3 with the Acorn Cap).
   - A wrong dig gives a small consolation: 5–15 coins, OR a joke junk find that turns into a few coins, such as "An old sock. Pepper is very proud.", "A rock shaped like a slightly different rock." or "Half a sandwich. The duck wants it back."
3. **Fewer pickups.** Remove the old item pickups (leaf, flower, shell, acorn as collect-10 sets).
   - Keep only coins on the path, and fewer of them.
   - Rare surprise: an extra small treasure (a 10% chance per walk) sparkles on the path.
4. **What the main treasure is.**
   - Roll the rarity first: Common 55%, Uncommon 30%, Rare 12%, Legendary 3%.
   - Then pick an item of that rarity from the route's loot table below.
   - If every item of that rarity on the route is already owned, roll down one tier. If nothing is left, give coins: Common 40, Uncommon 80, Rare 150, Legendary 300.
5. **Duplicates.**
   - Unique items (wearables, toys, charms) cannot be found twice. A duplicate roll becomes coins with a joke: "You already have one. A squirrel bought this one for 40 coins."
   - Food stacks.
   - Map pieces are unique per route.
6. **Results card.** It shows the treasure big, with its rarity stamp and ability text, then "Add to Journal".
7. **First-walk guarantee.** The first ever walk guarantees a Common treasure, so the system is learned right away.

## Treasure items (found only on walks, never sold)

| Name | Kind | Slot | Rarity | Routes | Ability (exact effect) |
|---|---|---|---|---|---|
| Acorn Cap | wearable | head | Uncommon | woods, park | Squirrel Diplomacy: +1 dig per walk while worn. |
| Explorer Goggles | wearable | eyes | Rare | river, woods | Eagle-ish Eye: the correct dig spot shows a faint sparkle while worn. |
| Seashell Necklace | wearable | neck | Uncommon | beach, river | Tide Sense: the Nose-o-meter reacts from twice as far away while worn. |
| Mossy Poncho | wearable | body | Common | woods, river | Puddle-proof: puddles don't lower Cleanliness while worn. |
| Clover Collar | wearable | neck | Legendary | any | Lucky Dog: doubles the Rare and Legendary chances while worn. |
| Wild Berries | food | — | Common | park, woods | Feed: +15 Hunger, +10 Energy. Use on a walk: +15 seconds of walk time. |
| Duck's Picnic Sandwich | food | — | Uncommon | river, park | Feed: +40 Hunger, +15 Happiness. |
| Golden Bone | food | — | Rare | any | Feed: +60 Bond points and a "Glowing" mood for 1 game day (Happiness can't drop below 80). |
| Driftwood Stick | toy | — | Common | beach, river | Fetch: +1 coin per catch. |
| Rubber Chicken | toy | — | Uncommon | park | Tricks: learn a trick in 2 taps instead of 3. It honks. |
| Glow Ball | toy | — | Rare | woods, beach | Fetch: the catch window is 50% wider (easier timing). |
| Lucky Penny | charm | charm | Common | park, river | +10% coins on walks while equipped. |
| Sparkle Stone | charm | charm | Rare | river, beach | Petting gives +5 extra Happiness while equipped. In v2 it raises Sparkle (rare variant) odds. Tease this in the text: "It hums. Something about it feels... important later." |
| Old Map Piece (Park) | quest | — | Uncommon | park | 1 of 4 pieces. |
| Old Map Piece (River) | quest | — | Uncommon | river | 1 of 4 pieces. |
| Old Map Piece (Woods) | quest | — | Rare | woods | 1 of 4 pieces. |
| Old Map Piece (Beach) | quest | — | Rare | beach | 1 of 4 pieces. |

- **Charm slot.** This is a new 5th equipment slot, holding one charm at a time, equipped from the Journal or the Wardrobe.
- **Map pieces.** Collecting all 4 completes "Paw Haven Treasure Map". That unlocks a one-time SECRET DIG in the Home Yard: an X appears on the lawn. Digging it gives the Grand Treasure Chest: 1000 coins, 3 Golden Bones, and the title "Treasure Legend", shown on the HUD name tag.
- **Toy abilities.** A toy's ability applies when you pick that toy for fetch (Driftwood Stick, Glow Ball), or automatically when owned (Rubber Chicken).

## Treasure Journal (the item page)
- A new action-bar button, "Journal" (icon `journal`), opens a sketchbook spread.
- **Tabs:** Treasures, Food, Toys, Clothes.
  - The Food, Toys and Clothes tabs show everything owned, both shop-bought and found, with counts and Use / Equip / Feed buttons. This also fixes "I can't find my items".
- **Treasures tab:** a collection grid of all 17 treasure entries.
  - **Found:** full art, a rarity stamp, the ability text, where it was found and the date.
  - **Not found:** a pencil silhouette marked "???" with a route hint, such as "Found near water...".
  - **Progress:** a counter (for example 5/17), and a map-piece progress bar that shows the 4 pieces assembling into a torn map.
- Rarity stamps are drawn in CSS as sketchy ink stamps: Common grey, Uncommon green, Rare blue, Legendary gold with sparkles.
- Old saves: convert any old collect-10 collectibles into coins (5 coins each), with a funny note.

## Art required
- **Dog artist (`pawart_dogs.js`):** draw the 5 new wearables ON the dogs, H style, fitted per breed and pose: `Acorn Cap` (head), `Explorer Goggles` (eyes), `Seashell Necklace` (neck), `Clover Collar` (neck), `Mossy Poncho` (body). An unknown outfit name must be silently ignored, never throw.
- **Item/icon artist (`pawart_world_b.js`, G doodle style):**
  - `PawArt.item(name)` for ALL 17 treasure names above.
  - Icons: `journal` (a sketchbook with a paw), `bag`, `nose` (for the Nose-o-meter), `charm`, `chest`.
  - Collectibles: `chest` (treasure chest), `map-piece`, `sparkle-spot` (a faint sparkle on the ground for the Goggles), `junk-sock`, `junk-rock`.
  - Prop: `torn-map` (`viewBox 0 0 240 160`) with an option `{pieces: ['park', 'river', ...]}` that draws only the collected quarters, plus a dotted path and an X when all 4 are present.
  - An unknown name returns the "?" placeholder (already the case).
