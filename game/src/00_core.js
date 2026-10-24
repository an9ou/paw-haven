(function () {
'use strict';
/* =========================================================================
   Doodle Doggo prototype. Numbers come from the game proposal; the prototype
   speeds the economy up (coins x2, Bond x3, naps x6) and runs 1 game hour
   per real minute.
   ========================================================================= */
const BOOST = { coins: 2, bond: 3, nap: 6 };
const SAVE_KEY = 'pawhaven_proto_v1', PREF_KEY = 'pawhaven_prefs_v1';
const BOND_TH = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];

const FOOD = [
  { n: 'Fresh Water', price: 0, hunger: 0, happy: 5, energy: 10, note: 'Free. Refills every 2 game hours.' },
  { n: 'Basic Kibble', price: 5, hunger: 30, note: '+30 Hunger. Crunchy brown circles. A classic.' },
  { n: 'Puppy Kibble', price: 6, hunger: 30, pupHappy: 5, note: '+30 Hunger. Small soft bites. Puppies under 6 months get +5 Happiness.' },
  { n: 'Bone-shaped Biscuit', price: 8, hunger: 10, happy: 10, bond: 2, note: '+10 Hunger, +10 Happiness. Shaped like a bone, which is very meta.' },
  { n: 'Chicken & Rice Bowl', price: 15, hunger: 50, happy: 5, note: '+50 Hunger, +5 Happiness. Tastes like Sunday.' },
  { n: 'Salmon Pâté', price: 30, hunger: 60, happy: 10, clean: 10, note: '+60 Hunger, +10 Happiness, +10 Cleanliness (shiny coat).' },
  { n: 'Pupcake', price: 60, hunger: 20, happy: 30, note: '+30 Happiness and double Bond for 1 game hour. 1 per day.' },
  /* v2.4 Shop Day: eight dog-safe foods. `tip` is the two-sentence safety lesson (shown once on the first feed and in the shop card). */
  { n: 'Carrot Sticks', price: 4, hunger: 10, happy: 5, clean: 5, snack: true, v24: true, tip: 'Crunchy and safe raw or cooked. Cut them small for little dogs.', note: '+10 Hunger, +5 Happiness, clean teeth.' },
  { n: 'Apple Slices', price: 6, hunger: 10, happy: 10, snack: true, v24: true, tip: 'Core and seeds out, every time. Apple seeds hold a little cyanide.', note: '+10 Hunger, +10 Happiness. No seeds, ever.' },
  { n: 'Blueberry Bites', price: 8, hunger: 10, happy: 10, bond: 1, snack: true, v24: true, tip: 'Blueberries are a safe berry for dogs. Grapes and raisins never are.', note: '+10 Hunger, +10 Happiness, a little Bond.' },
  { n: 'Seedless Watermelon Cubes', price: 9, hunger: 10, happy: 10, energy: 10, snack: true, v24: true, tip: 'Seedless and rind-free only. The rind can block a tummy.', note: '+10 Hunger, +10 Happiness, +10 Energy.' },
  { n: 'Sweet Potato Chews', price: 10, hunger: 20, happy: 5, snack: true, v24: true, tip: 'Always cooked and plain, never raw. Raw sweet potato is hard to digest.', note: '+20 Hunger, +5 Happiness. A long chew.' },
  { n: 'Pumpkin Purée', price: 12, hunger: 25, happy: 5, clean: 5, v24: true, tip: 'Plain cooked pumpkin only, never pie filling. It is gentle on tummies.', note: '+25 Hunger, +5 Happiness. Gentle on tummies.' },
  { n: 'Turkey Meatballs', price: 18, hunger: 45, happy: 10, v24: true, tip: 'Plain cooked turkey, no onion or garlic. Those are poison for dogs.', note: '+45 Hunger, +10 Happiness. Sunday dinner, dog edition.' },
  // v2.5 festival foods: sold at Baker Bea's Harvest Stall only (fest), never in Kibble Corner
  { n: 'Baked Pumpkin Wedges', fest: 'leaf', price: 8, hunger: 15, happy: 10, snack: true, v25: true, tip: 'Plain baked pumpkin, no spice and no sugar. Nutmeg is not for dogs.', note: '+15 Hunger, +10 Happiness. Soft, orange, gone in two bites.' },
  { n: 'Sweet Potato Coins', fest: 'leaf', price: 9, hunger: 15, happy: 5, clean: 5, snack: true, v25: true, tip: 'Baked soft and plain, never raw. Let them cool before the first bite.', note: '+15 Hunger, +5 Happiness, clean teeth. Chewy little rounds.' },
  { n: 'Warm Bone Broth', fest: 'leaf', price: 10, hunger: 10, happy: 10, energy: 5, warm: 60, snack: true, v25: true, tip: 'Plain and strained, no onion, garlic or salt. Cooked bones can splinter, so none stay in the cup.', note: '+10 Hunger, +10 Happiness, +5 Energy, warm paws for an hour.' },
  { n: 'Ghost Biscuits', fest: 'halloween', price: 9, hunger: 10, happy: 15, snack: true, v25: true, tip: 'Plain oats and plain yoghurt, nothing else. Chocolate is never for dogs, it is poison to them.', note: '+10 Hunger, +15 Happiness. Oat biscuits with a yoghurt ghost on top.' },
  { n: 'Candy Corn Carrots', fest: 'halloween', price: 6, hunger: 10, happy: 5, clean: 5, snack: true, v25: true, tip: 'No sugar at all, just carrot. Real sweets can hold xylitol, which is poison for dogs.', note: '+10 Hunger, +5 Happiness, clean teeth. Carrot points that only look like sweets.' },
  { n: 'Monster Meatball', fest: 'halloween', price: 14, hunger: 30, happy: 10, v25: true, tip: 'Plain cooked turkey, no onion or garlic. Grapes and raisins never go near it, they are poison for dogs.', note: '+30 Hunger, +10 Happiness. A turkey meatball with a carrot-slice eye.' },
  // v2.6 Halloween 2026 pop-up foods: sold only at the Pumpkin Patch Pop-up while hwShopOpen() (fest + ed), never again after the event
  { n: 'Pumpkin Patch Pupcake', fest: 'halloween', ed: 2026, v26: true, price: 14, hunger: 15, happy: 20, snack: true, tip: 'Plain pumpkin, oat flour and plain yoghurt, no sugar. Chocolate never goes in a dog\'s cake, it is poison to them.', note: '+15 Hunger, +20 Happiness. A little pumpkin cake with a yoghurt swirl.' },
  { n: 'Apple Monster Biscuits', fest: 'halloween', ed: 2026, v26: true, price: 8, hunger: 10, happy: 10, bond: 1, snack: true, tip: 'Apple flesh only, the core and pips stay out. Oats and water hold it together, no sugar needed.', note: '+10 Hunger, +10 Happiness, a little Bond. Oat biscuits with googly apple eyes.' },
  { n: 'Sweet Potato Bones', fest: 'halloween', ed: 2026, v26: true, price: 10, hunger: 20, happy: 5, clean: 5, snack: true, tip: 'Baked plain sweet potato, never raw and never buttered. Nutmeg and other baking spices stay in the kitchen, they make dogs ill.', note: '+20 Hunger, +5 Happiness, clean teeth. Baked bone shapes to crunch.' },
  { n: 'Frozen Yoghurt Ghosts', fest: 'halloween', ed: 2026, v26: true, price: 9, hunger: 5, happy: 15, cool: 30, snack: true, tip: 'Plain yoghurt only, no sugar and no sweetener. Xylitol is poison for dogs, so check the pot every time.', note: '+5 Hunger, +15 Happiness, cools the dog. Little frozen ghosts that melt fast.' },
  // v2.8 Winter & New Year (V28.md section 1): sold only at Baker Bea's Winter Stall while their festival flag is on (fest). warm: the Warm Bone Broth rule (S.warmUntil)
  { n: 'Warm Carob Cup', fest: 'snow', price: 8, hunger: 5, happy: 15, warm: 60, snack: true, v28: true, tip: 'Carob is safe for dogs and only looks like cocoa. Real cocoa and chocolate are poison to them, so the mugs never get mixed up.', note: '+5 Hunger, +15 Happiness, warm paws for an hour. Looks like cocoa. Is not cocoa.' },
  { n: 'Snowflake Oat Cookies', fest: 'snow', price: 9, hunger: 10, happy: 10, bond: 1, snack: true, v28: true, tip: 'Rolled oats, egg and pumpkin, baked plain. Festive cookies often hide macadamia nuts, which make dogs wobbly and ill, so these have none.', note: '+10 Hunger, +10 Happiness, a little Bond. Oat cookies cut like snowflakes.' },
  { n: 'Snow Day Stew', fest: 'snow', price: 14, hunger: 30, happy: 10, v28: true, tip: 'Lean chicken with no skin and no bones. Gravy and fatty leftovers upset a dog\'s tummy, so they stay on the people plates.', note: '+30 Hunger, +10 Happiness. Chicken, carrot and green beans, cooked soft.' },
  { n: 'Pup Kinton', fest: 'newyear', price: 10, hunger: 15, happy: 15, snack: true, v28: true, tip: 'Plain mashed sweet potato, no sugar and no chestnut syrup. Mochi never goes in a dog\'s bowl, it is far too sticky to swallow safely.', note: '+15 Hunger, +15 Happiness. Golden sweet potato mash, for a lucky year.' },
  // v2.11 Tokyo Trip (V211.md section 5.3): the Nakamise treats in Asakusa, served there like the café (tokyo + fest 'tokyo': never in a town shop or stall)
  { n: 'Sweet Potato Strip', fest: 'tokyo', tokyo: true, price: 15, hunger: 10, happy: 10, snack: true, v211: true, tip: 'Steamed and dried plain sweet potato, nothing added. Cut it into small strips so it is not a choking piece.', note: '+10 Hunger, +10 Happiness. A chewy Asakusa favourite, made for dogs.' },
  { n: 'Dog Senbei', fest: 'tokyo', tokyo: true, price: 12, hunger: 5, happy: 10, snack: true, v211: true, tip: 'A plain rice cracker made for dogs, with no salt and no soy sauce. The ones people eat are far too salty.', note: '+5 Hunger, +10 Happiness. A crunchy round rice cracker.' },
  { n: 'Frozen Pupsicle', price: 22, hunger: 15, happy: 20, energy: 10, cool: 60, snack: true, v24: true, tip: 'Frozen plain yoghurt and fruit, no xylitol ever. Let it soften a little for small dogs.', note: '+15 Hunger, +20 Happiness, +10 Energy. Cools a hot dog for 1 game hour.' }
];
const TOYS = [
  { n: 'Tennis Ball', price: 40, bond: 1, note: 'Ball play: 2 coins per return.' },
  { n: 'Squeaky Duck', price: 50, bond: 1, note: 'Squeeze: +10 Happiness. The neighbours love it (no).' },
  { n: 'Rope Tug', price: 60, bond: 1, note: 'Tug-of-war: +15 Happiness, -10 Energy, +5 Bond.' },
  { n: 'Plush Bone', price: 80, bond: 1, note: 'Nap buddy: +10% nap Energy. Works automatically.' },
  { n: 'Frisbee', price: 120, bond: 3, note: 'Long floaty throws: 3 coins per return, +20 Happiness.' },
  { n: 'Puzzle Feeder', price: 150, bond: 4, note: 'Every meal: +10 Happiness and double Bond. Automatic.' },
  /* v2.4 Shop Day: five shop toys, each with its own yard play game in mods/toys.js (the Squeaky Hedgehog is a walk treasure) */
  { n: 'Snuffle Mat', price: 70, bond: 2, v24: true, note: 'Snuffle: hide kibble in the mat, the nose finds it. +Happiness, a little Bond.' },
  { n: 'Treat Cone', price: 90, bond: 2, v24: true, note: 'Lick: a treat cone to lick clean, slowly. Calm +Happiness.' },
  { n: 'Bubble Machine', price: 110, bond: 3, v24: true, note: 'Bubbles: dog-safe bubbles to chase and pop. +Happiness, +coins per pop.' },
  { n: 'Paddling Pool', price: 130, bond: 4, v24: true, note: 'Splash: a cool paddle on hot days. +Happiness, +Cleanliness, cools the dog.' },
  { n: 'Agility Tunnel', price: 150, bond: 5, v24: true, note: 'Zoom: run the tunnel, then do it again faster. +Happiness, -Energy, +Bond.' },
  /* v2.6 Halloween 2026 pop-up toys (fest + ed): only the Pumpkin Patch Pop-up sells them, each has a yard play game in mods/toys.js */
  { n: 'Squeaky Pumpkin', fest: 'halloween', ed: 2026, v26: true, price: 45, bond: 1, note: 'Squeak: a soft pumpkin that squeaks when pounced. +Happiness.' },
  { n: 'Plush Ghost', fest: 'halloween', ed: 2026, v26: true, price: 55, bond: 1, note: 'Shake: a floppy ghost to shake and carry about. +Happiness, a little Bond.' },
  { n: 'Bat-Wing Flyer', fest: 'halloween', ed: 2026, v26: true, price: 65, bond: 2, note: 'Leap: a soft flyer with felt bat wings to jump for. +Happiness, -Energy.' },
  { n: 'Trick-or-Treat Bucket', fest: 'halloween', ed: 2026, v26: true, price: 80, bond: 2, note: 'Sniff: nose out the treats hidden under the lids. +Happiness, a little Bond.' },
  /* v2.11 Tokyo Trip: the Tokyo Tower souvenir stand only (tokyo + fest 'tokyo'), with its own play game in mods/toys.js */
  { n: 'Shinkansen Plush', fest: 'tokyo', tokyo: true, price: 80, bond: 1, v211: true, note: 'Zoom: a soft bullet train to roll along the ground and chase. +Happiness.' },
];
const CLOTHES = [
  { n: 'Red Bandana', slot: 'neck', price: 50, bond: 1, perk: '+1 dog friend on every walk.' },
  { n: 'Party Hat', slot: 'head', price: 60, bond: 3, perk: 'Pupcakes give +50% Happiness.' },
  { n: 'Bow Tie', slot: 'neck', price: 70, bond: 2, perk: 'Compliments on walks pay +2 extra coins.' },
  { n: 'Flower Crown', slot: 'head', price: 90, bond: 3, perk: '+2 leaves and flowers on every walk.' },
  { n: 'Heart Sunglasses', slot: 'eyes', price: 100, bond: 5, perk: '+10% walk Happiness on sunny days.' },
  { n: 'Yellow Raincoat', slot: 'body', price: 120, bond: 2, perk: 'Raincoat: no mud and +5 Happiness on rainy walks and outings.' },
  { n: 'Polka-dot Raincoat', slot: 'body', price: 140, bond: 2, perk: 'Raincoat: no mud and +5 Happiness in the rain. Dots are 40% more waterproof (not true).' },
  { n: 'Frog Raincoat', slot: 'body', price: 160, bond: 3, perk: 'Raincoat: no mud and +5 Happiness in the rain. Ribbit.' },
  { n: 'Bubble Raincoat', slot: 'body', price: 220, bond: 5, perk: 'Raincoat: no mud and +5 Happiness in the rain. See-through, so everyone sees the fur.' },
  { n: 'Rain Hat', slot: 'head', price: 80, bond: 2, perk: 'No soggy shake needed after rain.' },
  { n: 'Pom-pom Beanie', slot: 'head', price: 90, bond: 3, perk: 'Warm: no shivering in the snow.' },
  { n: 'Knit Winter Sweater', slot: 'body', price: 150, bond: 4, perk: 'Warm: no shivering in the snow, and snowy walks tire 10% less.' },
  { n: 'Superhero Cape', slot: 'body', price: 250, bond: 6, perk: 'Walk speed +15%. Whoosh.' },
  /* v2.4 Shop Day: eleven outfits (the Sun Hat is a walk treasure). `reward: true` ones are never sold: the Boutique skips them. */
  { n: 'Sailor Collar', slot: 'neck', price: 45, bond: 1, v24: true, perk: 'Ship-shape: the water bowl refills in 1 game hour instead of 2.' },
  { n: 'Chef Hat', slot: 'head', price: 60, bond: 2, v24: true, perk: "Chef's kiss: meals give +5 Happiness." },
  { n: 'Tutu', slot: 'body', price: 65, bond: 2, v24: true, perk: 'Twirl: the daily fashion bonus gives +10 Happiness instead of +5.' },
  { n: 'Cowboy Hat', slot: 'head', price: 70, bond: 2, v24: true, perk: 'Yeehaw: naps outdoors restore 10% more.' },
  { n: 'Pyjamas', slot: 'body', price: 80, bond: 2, v24: true, perk: 'Bedtime: naps restore 15% more. The Nightcap appears at nap time.' },
  { n: 'Bumblebee Suit', slot: 'body', price: 85, bond: 3, v24: true, perk: 'Bzzz: snacks give +5 Happiness.' },
  { n: 'Wizard Hat', slot: 'head', price: 90, bond: 4, v24: true, perk: 'Magic hands: petting gives +1 extra Bond.' },
  { n: 'Happi Coat', slot: 'body', price: 95, bond: 3, v24: true, perk: 'Festival power: Pupcake power lasts 2 game hours instead of 1.' },
  { n: 'Cozy Hoodie', slot: 'body', price: 0, bond: 1, v24: true, reward: true, perk: 'Warm: no shivering in the snow. Hood up, ears out.' },
  { n: 'Knit Scarf', slot: 'neck', price: 0, bond: 1, v24: true, reward: true, perk: 'Warm: no shivering in the snow. Mrs. Plum knitted too much again.' },
  // v2.5 festival clothes: sold at the Harvest Stall only (fest), never in the Boutique; the Rosette is a parade reward
  { n: 'Leaf Beret', slot: 'head', fest: 'leaf', price: 55, bond: 1, v25: true, perk: 'Warm: no shivering in the snow. Tilted, like a painter.' },
  { n: 'Autumn Scarf', slot: 'neck', fest: 'leaf', price: 50, bond: 1, v25: true, perk: 'Warm: no shivering in the snow. With the Leaf Beret, the daily fashion bonus gives +10 Happiness.' },
  { n: 'Ghost Sheet', slot: 'body', fest: 'halloween', price: 60, bond: 1, v25: true, perk: 'Boo: the parade loves it. Nobody can see the tail wag, but it is wagging.' },
  { n: 'Pumpkin Suit', slot: 'body', fest: 'halloween', price: 65, bond: 1, v25: true, perk: 'Round: naps in the Pumpkin Cottage restore 10% more.' },
  { n: 'Parade Rosette', slot: 'neck', fest: 'halloween', price: 0, bond: 1, v25: true, reward: true, perk: 'Pride: won at the Halloween costume parade. It is a little bent.' },
  // v2.6 Halloween 2026 pop-up clothes (fest + ed): perks are flavour only
  { n: 'Witch Hat', slot: 'head', fest: 'halloween', ed: 2026, v26: true, price: 60, bond: 1, perk: 'Pointy: a crooked tip and an orange band. It is not magic, but it looks it.' },
  { n: 'Vampire Cape', slot: 'body', fest: 'halloween', ed: 2026, v26: true, price: 75, bond: 1, perk: 'Swish: a high collar and a red lining. Very dramatic, not at all bitey.' },
  { n: 'Candy Corn Bandana', slot: 'neck', fest: 'halloween', ed: 2026, v26: true, price: 50, bond: 1, perk: 'Sweet look: candy-corn stripes and no actual sugar.' },
  { n: 'Bat Wings', slot: 'body', fest: 'halloween', ed: 2026, v26: true, price: 70, bond: 1, perk: 'Flap: felt wings that bounce when the tail wags.' },
  // v2.11.1 Halloween 2026 costumes (V2111.md 3): body slot, each with its own head piece, so the hat comes off while one is worn
  { n: 'Pumpkin Patch Suit', slot: 'body', fest: 'halloween', ed: 2026, v26: true, price: 70, bond: 1, perk: 'Round and proud: crayon pumpkin ribs, a leafy collar and a curly stem on top.' },
  { n: 'Trick-or-Treat Ghost', slot: 'body', fest: 'halloween', ed: 2026, v26: true, price: 70, bond: 1, perk: 'Boo: a soft sheet with two eye holes and a little pumpkin bucket to carry.' },
  { n: 'Little Bat Costume', slot: 'body', fest: 'halloween', ed: 2026, v26: true, price: 75, bond: 1, perk: 'Flutter: a purple hood with pointy ears, small wings and an orange frill.' },
  // v2.8 Winter & New Year (V28.md section 1): the Winter Stall sells the first three (fest), the Rosette is the contest reward, the Hood comes in Gerald's New Year card (ed: 2027, never sold)
  { n: 'Very Ugly Sweater', slot: 'body', fest: 'snow', price: 65, bond: 1, v28: true, perk: 'Warm: no shivering in the snow. Knitted by someone who has never seen a dog, or a snowflake.' },
  { n: 'Reindeer Antlers', slot: 'head', fest: 'snow', price: 55, bond: 1, v28: true, perk: 'Jingle: a little bell on each antler. Not warm. Very festive.' },
  { n: 'Snowflake Snood', slot: 'neck', fest: 'snow', price: 50, bond: 1, v28: true, perk: 'Warm: no shivering in the snow. A knitted tube, so no ends to trip on.' },
  { n: 'Ugly Sweater Rosette', slot: 'neck', fest: 'lights', price: 0, bond: 1, v28: true, reward: true, perk: 'Pride: won at the Ugly Sweater Contest. It is uglier than the sweater.' },
  { n: 'Year of the Sheep Hood', slot: 'head', fest: 'newyear', ed: 2027, price: 0, bond: 1, v28: true, reward: true, perk: 'Warm: no shivering in the snow. Woolly sheep ears for the Year of the Sheep. The Border Collie has been told.' },
  // v2.11 Tokyo Trip (V211.md section 5.3): souvenir bandanas, sold only at the stands in Tokyo (tokyo + fest 'tokyo')
  { n: 'Shibuya Bandana', slot: 'neck', fest: 'tokyo', tokyo: true, price: 60, bond: 1, v211: true, perk: 'Scramble: green, with little crossing stripes. Everyone stops to say hello.' },
  { n: 'Asakusa Bandana', slot: 'neck', fest: 'tokyo', tokyo: true, price: 60, bond: 1, v211: true, perk: 'Lucky red: a tiny lantern in the corner, like the big one at the temple gate.' },
  { n: 'Tokyo Tower Bandana', slot: 'neck', fest: 'tokyo', tokyo: true, price: 60, bond: 1, v211: true, perk: 'Tall look: orange and white stripes, like the tower on a sunny day.' },
  { n: 'Astronaut Helmet', slot: 'head', price: 0, bond: 1, v24: true, reward: true, perk: 'Space-proof: no soggy shake after rain, no shivering in the snow.' },
  // v2.15 Around Town (V215.md 6.2): the Splash Pool gives it free on the first visit (S.pool.vest), never sold; worn automatically in the water (45_pool.js)
  { n: 'Doggy Life Vest', slot: 'body', price: 0, bond: 1, v215: true, reward: true, perk: 'Safe swimmer: a bright vest with two buckles. Free from the Splash Pool.' }
];
const HOUSES = [
  { n: 'Cardboard Box', price: 0, bond: 1, comfort: 0, hd: 4, note: 'Free. Has a flap. Smells like delivery.' },
  { n: 'Classic Wooden Doghouse', price: 300, bond: 2, comfort: 0.15, hd: 3.5, note: 'A name plate! Spelled almost right.' },
  { n: 'Cozy Cottage', price: 800, bond: 4, comfort: 0.30, hd: 3, note: 'Chimney, flower box, mortgage.' },
  { n: 'Snow Igloo', price: 1500, bond: 6, comfort: 0.40, hd: 3, note: 'Cool and cozy. Huskies get double the bonus.' },
  { n: 'Treehouse Den', price: 2500, bond: 7, comfort: 0.55, hd: 2.5, note: 'Has a ladder. Dogs cannot climb ladders. Details.' },
  { n: 'Royal Castle Kennel', price: 5000, bond: 9, comfort: 0.75, hd: 2, note: 'Cardboard turrets. Fit for royalty, or a very good boy.' },
  /* v2.4 Shop Day: six houses. The Rocket Ship (`reward: true`) is the second mission-stamp reward and is never sold. */
  { n: 'Little Tea House', price: 450, bond: 3, comfort: 0.20, hd: 3, v24: true, note: 'A teapot on the roof. The dog does not drink tea. The teapot is for guests.' },
  { n: 'Beach Hut', price: 650, bond: 4, comfort: 0.25, hd: 3, v24: true, note: 'Striped door, surfboard, sand in everything.' },
  { n: 'Camper Van', price: 1200, bond: 5, comfort: 0.35, hd: 2.5, v24: true, note: 'The wheels are painted on. It has never moved. It has been everywhere.' },
  { n: 'Pumpkin Cottage', price: 1800, bond: 6, comfort: 0.45, hd: 2.5, v24: true, note: 'Round orange walls and a leaf for a roof. Smells faintly of pie.' },
  { n: 'Lighthouse Kennel', price: 3000, bond: 8, comfort: 0.60, hd: 2, v24: true, note: 'The lamp turns at night. Ships are confused.' },
  { n: 'Rocket Ship', price: 0, bond: 1, comfort: 0.55, hd: 2, v24: true, reward: true, note: 'Countdown painted on the side. Launch is cancelled, forever, for naps.' }
];
const SLOTS = ['head', 'eyes', 'neck', 'body'];
const SLOT_NAME = { head: 'Head', eyes: 'Eyes', neck: 'Neck', body: 'Body' };
const TRICKS = [
  { n: 'Sit', bond: 1, fx: 'sit', pose: 'sit' },
  { n: 'Paw', bond: 2, fx: 'tk-paw', pose: 'sit' },
  { n: 'Lie Down', bond: 3, fx: 'tk-lie', pose: 'sit' },
  { n: 'Roll Over', bond: 4, fx: 'tk-roll', pose: 'happy' },
  { n: 'Spin', bond: 5, fx: 'tk-spin', pose: 'happy' },
  { n: 'Play Dead', bond: 6, fx: 'tk-dead', pose: 'sleep' },
  { n: 'Speak', bond: 7, fx: 'speak', pose: 'happy' },
  { n: 'Dance', bond: 8, fx: 'tk-dance', pose: 'happy' },
  { n: 'Bow', bond: 9, fx: 'tk-bow', pose: 'idle' },
  { n: 'Signature', bond: 10, fx: 'sig', pose: 'happy' }
];
const SIG = {
  shiba: { n: 'The Dramatic Faint', fx: 'tk-dead', pose: 'sleep', say: 'I have died. Bury me in pâté.' },
  corgi: { n: 'The Loaf', fx: 'tk-lie', pose: 'sit', say: 'I am bread now.' },
  golden: { n: 'Zoomies', fx: 'tk-zoom', pose: 'walk', say: 'NYOOOOOM' },
  dachs: { n: 'The Noodle Wiggle', fx: 'tk-dance', pose: 'happy', say: 'Wiggle wiggle. The back half is late.' },
  husky: { n: 'Opera Howl', fx: 'tk-bow', pose: 'happy', say: 'AWOOOOOOOOOOOOO (bravo)' },
  mutt: { n: 'The Lean', fx: 'tk-lean', pose: 'pet', say: '*leans on you with full love*' },
  chihuahua: { n: 'The Tiny Tornado', fx: 'tk-tornado', pose: 'walk', always: true, snd: 'alert', say: 'I AM A WEATHER EVENT.' },
  pug: { n: 'The Snort Spin', fx: 'tk-spin', pose: 'happy', always: true, snd: 'huff', say: '*snort* *spin* *snort* Ta-da.' },
  greyhound: { n: 'The Zoomie Lap', fx: 'tk-lap', pose: 'walk', always: true, say: '45 mph. Now I need a 20-hour nap.' },
  beagle: { n: 'The Big Bay', fx: 'tk-bow', pose: 'speak', snd: 'howl', say: 'AROOOOOOOOOO!' },
  poodle: { n: 'The Prance', fx: 'tk-dance', pose: 'dance', say: 'Note the footwork. Note the pom-poms.' },
  collie: { n: 'The Eye', fx: 'tk-perk', pose: 'crouch', say: 'I am herding you with my eyes. Please sit.' },
  samoyed: { n: 'The Sammy Smile', fx: 'tk-bow', pose: 'happy', snd: 'talk', say: 'Woo-woo! That was the smile. Now with sound.' },
  frenchie: { n: 'The Sploot', fx: 'tk-lie', pose: 'down', always: true, snd: 'huff', say: 'Back legs out. Belly on the cool floor. Perfect.' },
  akita: { n: 'The Quiet Vigil', fx: 'tk-perk', pose: 'sit', say: 'I will wait here. I am very good at waiting.' },
  spitz: { n: 'The Show-off', fx: 'tk-dance', pose: 'happy', say: 'Look at the fluff. Now look at the fluff from the side.' },
  pom: { n: 'The Tiny Spin', fx: 'tk-spin', pose: 'happy', always: true, snd: 'alert', say: 'Spin, yip, spin. That is my whole act and it is perfect.' },
  afghan: { n: 'The Hair Flip', fx: 'tk-dance', pose: 'happy', say: 'Note the flow. Note the shine. Do not note the knots.' },
  dane: { n: 'The Tall Bow', fx: 'tk-bow', pose: 'happy', say: 'A bow. From very high up. Sorry about the ceiling.' },
  mastiff: { n: 'The Great Flop', fx: 'tk-lie', pose: 'down', say: 'Down I go. Slowly. All of me. Please wait.' },
  gsd: { n: 'The Salute', fx: 'tk-bow', pose: 'sit', say: 'Ready. Alert. Waiting for orders. Any orders. Even snacks.' },
  // v2.12 Fourteen New Friends
  dobie: { n: 'The Sentry Sit', fx: 'tk-perk', pose: 'sit', say: 'Perimeter checked. Threat level: cuddle. You may approach.' },
  corso: { n: 'The Gentle Lean', fx: 'tk-lean', pose: 'pet', say: '*leans slowly* This is how a guardian hugs. Please do not move.' },
  pitbull: { n: 'The Wiggle Hug', fx: 'tk-dance', pose: 'happy', say: 'The whole back half is wagging. I cannot stop it. Come here for a hug.' },
  minpin: { n: 'The High Prance', fx: 'tk-dance', pose: 'happy', say: 'Knees up. Chin up. I am a very small horse.' },
  lab: { n: 'The Dinner Dance', fx: 'tk-dance', pose: 'happy', say: 'Is it dinner? Is it dinner? It is dinner. I knew it.' },
  malamute: { n: 'The Woo-Woo Speech', fx: 'tk-bow', pose: 'happy', snd: 'talk', say: 'Woo-woo-WOO! That was a speech. You may applaud.' },
  chow: { n: 'The Lion Pose', fx: 'tk-perk', pose: 'sit', say: 'Behold the mane. Do not touch the mane. Just behold.' },
  stdpoodle: { n: 'The Big Pirouette', fx: 'tk-spin', pose: 'happy', say: 'A full turn on long legs. The Miniature Poodle is taking notes.' },
  schnauzer: { n: 'The Eyebrow Raise', fx: 'tk-perk', pose: 'sit', say: 'I raised my eyebrows. That means I saw you. And the leaf.' },
  westie: { n: 'The Dig Dance', fx: 'tk-dance', pose: 'happy', say: 'Dig, dig, dance. Where did the dirt go? Everywhere. Ta-da.' },
  yorkie: { n: 'The Tiny Diva Spin', fx: 'tk-spin', pose: 'happy', always: true, snd: 'alert', say: 'I am small and I am a star. The bow stays on. Always.' },
  bichon: { n: 'The Powder Puff Spin', fx: 'tk-spin', pose: 'happy', say: 'Boing, boing, spin. I am a cloud with a very happy tail.' },
  maltese: { n: 'The Silk Swish', fx: 'tk-bow', pose: 'happy', say: 'A gentle bow and a swish of silk. Applause may be quiet.' },
  shihtzu: { n: 'The Royal Flop', fx: 'tk-lie', pose: 'down', say: 'The top-knot stays up. The rest of me is a rug. Goodnight, court.' }
};
const SIG_FB = { n: 'The Grand Finale', fx: 'tk-bow', pose: 'happy', say: 'Ta-da! (Applause, please.)' };
const sigOf = (k) => SIG[k] || SIG_FB;
/* v1.7: every breed key in the game, in PawArt order (unknown keys fall back to generic content) */
const BREED_KEYS = ['shiba', 'corgi', 'golden', 'dachs', 'husky', 'mutt', 'chihuahua', 'pug', 'greyhound', 'beagle', 'poodle', 'collie', 'samoyed', 'frenchie', 'akita', 'spitz', 'pom', 'afghan', 'dane', 'mastiff', 'gsd', 'dobie', 'corso', 'pitbull', 'minpin', 'lab', 'malamute', 'chow', 'stdpoodle', 'schnauzer', 'westie', 'yorkie', 'bichon', 'maltese', 'shihtzu'];
const ROUTES = {
  park: { n: 'Sunny Park', bond: 1, secs: 60, energy: 15, happy: 15, clean: 5, coins: [20, 30], bp: 8, pool: ['coin', 'leaf', 'flower', 'bone'] },
  river: { n: 'Riverside Trail', bond: 2, secs: 75, energy: 25, happy: 20, clean: 10, coins: [35, 50], bp: 11, pool: ['coin', 'leaf', 'shell'] },
  woods: { n: 'Maple Woods', bond: 5, secs: 90, energy: 30, happy: 25, clean: 15, coins: [50, 70], bp: 13, pool: ['coin', 'acorn', 'leaf', 'flower'], dig: 3 },
  beach: { n: 'Seashell Beach', bond: 8, secs: 90, energy: 30, happy: 30, clean: 20, coins: [60, 80], bp: 15, pool: ['coin', 'shell'], dig: 3 },
  /* v2.15 run tracks (V215.md 6.3, 46_tracks.js): these rows stay in ROUTES only while mpOn() (trSync). Each sits inside today's route tiers (town 25-35, woods 50-70, beach 60-80) */
  sunflower: { n: 'Sunflower Lanes', bond: 2, secs: 60, energy: 15, happy: 15, clean: 5, coins: [25, 35], bp: 9, pool: ['coin', 'flower', 'leaf'], v215: true },
  bamboo: { n: 'Bamboo Grove Trail', bond: 4, secs: 75, energy: 25, happy: 22, clean: 10, coins: [40, 55], bp: 12, pool: ['coin', 'leaf', 'acorn'], v215: true },
  cliffs: { n: 'Seaside Cliffs Run', bond: 7, secs: 90, energy: 30, happy: 28, clean: 12, coins: [55, 70], bp: 14, pool: ['coin', 'shell', 'flower'], v215: true }
};
/* ---------- v1.1 treasure hunt: treasures are only found on walks, never sold ---------- */
const RARITY = ['Common', 'Uncommon', 'Rare', 'Legendary'];
const RAR_P = [55, 30, 12, 3];
const RAR_COINS = [40, 80, 150, 300];
const ALL_ROUTES = ['park', 'river', 'woods', 'beach'];
const TR = (n, kind, slot, r, routes, ab, txt, extra = {}) => Object.assign({ n, kind, slot, r: RARITY.indexOf(r), routes: routes === 'any' ? ALL_ROUTES : routes, ab, txt }, extra);
const TREASURES = [
  TR('Acorn Cap', 'wearable', 'head', 'Uncommon', ['woods', 'park'], 'Squirrel Diplomacy', '+1 dig per walk while worn.'),
  TR('Explorer Goggles', 'wearable', 'eyes', 'Rare', ['river', 'woods'], 'Eagle-ish Eye', 'The correct dig spot shows a faint sparkle while worn.'),
  TR('Seashell Necklace', 'wearable', 'neck', 'Uncommon', ['beach', 'river'], 'Tide Sense', 'The Nose-o-meter reacts from twice as far away while worn.'),
  TR('Mossy Poncho', 'wearable', 'body', 'Common', ['woods', 'river'], 'Puddle-proof', 'Puddles do not lower Cleanliness while worn.'),
  TR('Clover Collar', 'wearable', 'neck', 'Legendary', 'any', 'Lucky Dog', 'Doubles the Rare and Legendary treasure chances while worn.'),
  TR('Wild Berries', 'food', null, 'Common', ['park', 'woods'], 'Trail Snack', 'Feed: +15 Hunger, +10 Energy. Use on a walk (Bag): +15 seconds of walk time.'),
  TR("Duck's Picnic Sandwich", 'food', null, 'Uncommon', ['river', 'park'], 'Stolen Lunch', 'Feed: +40 Hunger, +15 Happiness. The duck wants it back.'),
  TR('Golden Bone', 'food', null, 'Rare', 'any', 'Pure Gold', 'Feed: +60 Bond points and a Glowing mood for 1 game day (Happiness stays at 80 or more).'),
  TR('Driftwood Stick', 'toy', null, 'Common', ['beach', 'river'], 'Splinter Bonus', 'Play ball with it: +1 coin per return.'),
  TR('Rubber Chicken', 'toy', null, 'Uncommon', ['park'], 'Honk of Wisdom', 'Tricks are learned in 2 taps instead of 3. It honks. Automatic.'),
  TR('Glow Ball', 'toy', null, 'Rare', ['woods', 'beach'], 'Easy Glow', 'Play ball with it: it glows after dark, so it never gets lost.'),
  TR('Lucky Penny', 'charm', 'charm', 'Common', ['park', 'river'], 'Pocket Luck', '+10% coins on walks while equipped.'),
  TR('Sparkle Stone', 'charm', 'charm', 'Rare', ['river', 'beach'], 'Strange Hum', 'Petting gives +5 extra Happiness while equipped. It hums. Something about it feels... important later.'),
  TR('Old Map Piece (Park)', 'quest', null, 'Uncommon', ['park'], 'Map Piece', '1 of 4 pieces of the Doodle Doggo Treasure Map.', { piece: 'park' }),
  TR('Old Map Piece (River)', 'quest', null, 'Uncommon', ['river'], 'Map Piece', '1 of 4 pieces of the Doodle Doggo Treasure Map.', { piece: 'river' }),
  TR('Old Map Piece (Woods)', 'quest', null, 'Rare', ['woods'], 'Map Piece', '1 of 4 pieces of the Doodle Doggo Treasure Map.', { piece: 'woods' }),
  TR('Old Map Piece (Beach)', 'quest', null, 'Rare', ['beach'], 'Map Piece', '1 of 4 pieces of the Doodle Doggo Treasure Map.', { piece: 'beach' }),
  /* v2.4 Shop Day: two treasures (never sold) */
  TR('Sun Hat', 'wearable', 'head', 'Uncommon', ['beach', 'park'], 'Shady Business', 'Hot days do not bother the dog while worn.', { v24: true }),
  TR('Squeaky Hedgehog', 'toy', null, 'Uncommon', ['woods', 'park'], 'Squeak of Honour', 'Squeeze it and the dog answers. It hops. Three squeaks and it rolls up.', { v24: true }),
  /* v2.15 run tracks (V215.md 6.3): six treasures, never sold; they are in TREASURES only while mpOn() (trSync in 46_tracks.js). Abilities reuse existing perks */
  TR('Sunflower Collar', 'wearable', 'neck', 'Uncommon', ['sunflower'], 'Fresh Paws', 'Puddles do not lower Cleanliness while worn.', { v215: true }),
  TR('Lucky Horseshoe', 'charm', 'charm', 'Rare', ['sunflower'], 'Good Fortune', '+1 dig per walk while equipped.', { v215: true }),
  TR('Bamboo Ring', 'toy', null, 'Common', ['bamboo'], 'Ring Toss', 'Play ball with it: it floats on a gentle toss, and 3 coins per return.', { v215: true }),
  TR('Paper Lantern', 'charm', 'charm', 'Uncommon', ['bamboo'], 'Lantern Glow', 'Ball play after dark: the ball glows, so it never gets lost.', { v215: true }),
  TR('Sea Glass', 'charm', 'charm', 'Rare', ['cliffs'], 'Sea Sense', 'The Nose-o-meter reacts from twice as far away while equipped.', { v215: true }),
  TR('Sailor Cap', 'wearable', 'head', 'Uncommon', ['cliffs'], 'Steady Sailor', 'Hot days do not bother the dog while worn.', { v215: true })
];
const TFOOD = [
  { n: 'Wild Berries', hunger: 15, energy: 10, note: 'Treasure. +15 Hunger, +10 Energy. On a walk: +15 seconds.' },
  { n: "Duck's Picnic Sandwich", hunger: 40, happy: 15, note: 'Treasure. +40 Hunger, +15 Happiness.' },
  { n: 'Golden Bone', hunger: 0, golden: true, note: 'Treasure. +60 Bond and Glowing for a whole game day.' }
];
const FOOD_ALL = FOOD.concat(TFOOD);
const TWEAR = TREASURES.filter((t) => t.kind === 'wearable').map((t) => ({ n: t.n, slot: t.slot, price: 0, bond: 1, perk: `${t.ab}: ${t.txt}`, treasure: true }));
const ALL_WEAR = CLOTHES.concat(TWEAR);
const CHARMS = TREASURES.filter((t) => t.kind === 'charm').map((t) => ({ n: t.n, slot: 'charm', perk: `${t.ab}: ${t.txt}` }));
const FETCH_TOYS = ['Tennis Ball', 'Frisbee', 'Driftwood Stick', 'Glow Ball'];
const ROUTE_WORD = { park: 'in the park', river: 'near water', woods: 'under the trees', beach: 'in the sand', sunflower: 'among the sunflowers', bamboo: 'in the bamboo', cliffs: 'by the cliffs' };
const ROUTE_HINT = { park: 'Found in the park...', river: 'Found near water...', woods: 'Found under the trees...', beach: 'Found in the sand...', sunflower: 'Found among the sunflowers...', bamboo: 'Found in the bamboo...', cliffs: 'Found by the cliffs...' };
const JUNK = [['junk-sock', 'An old sock. Pepper is very proud.'], ['junk-rock', 'A rock shaped like a slightly different rock.'], ['junk-sock', 'Half a sandwich. The duck wants it back.'], ['junk-rock', 'A bottle cap. Shiny! Worthless! Shiny!']];
const CLUES = {
  far: ['Smells like... nothing much. Keep walking.', 'Sniff. Grass. Just grass. Disappointing grass.', 'The nose says: not here. Not even close.'],
  warm: ['Smells like... adventure. And ducks.', 'Something interesting is up ahead. Probably.', 'Warmer! The nose is wiggling.'],
  hot: ['IT IS RIGHT AROUND HERE. Somewhere. Close.', 'The nose is going bananas. Dig nearby!', 'Hot hot hot! This smells like treasure.'],
  past: ['Hmm. We may have walked past it.', 'The smell is behind us now. Oops.']
};
/* ---------- v1.2.1 places: where the dog hangs out ---------- */
const PLACES = {
  yard: { n: 'Home Yard', bond: 1, out: true }, house: { n: 'Cozy House', bond: 1, out: false }, park: { n: 'Sunny Park', bond: 1, out: true },
  river: { n: 'Riverside', bond: 2, out: true }, woods: { n: 'Maple Woods', bond: 5, out: true }, beach: { n: 'Seashell Beach', bond: 8, out: true },
  market: { n: 'Market Street', bond: 1, out: true }
};
const PLACE_LINES = {
  shiba: { house: 'The sofa is mine now. I have decided.', park: 'Other dogs may admire me from a distance.', river: 'The ducks are staring. I am staring harder.', woods: 'Shady. Mysterious. Like me.', beach: 'Sand in my curl. This is a crisis.', market: 'I will wait outside. Like royalty.' },
  corgi: { house: 'Is that the kitchen? I smell the kitchen.', park: 'Picnics! People here drop snacks!', river: 'The ducks have bread. I want the bread.', woods: 'Mushrooms! Can I eat mushrooms? (No.)', beach: 'Sand zoomies! My legs are perfect for sand!', market: 'Kibble Corner smells AMAZING from here.' },
  golden: { house: 'Couch! Rug! Lamp! I love the house!', park: 'So many friends! So many balls!', river: 'WATER! Can I swim? I am swimming. In my mind.', woods: 'Sticks! The whole place is sticks!', beach: 'The waves keep coming back to play with me!', market: 'Everyone here is my best friend.' },
  dachs: { house: 'Under the sofa is a whole other world.', park: 'Something is buried under this bench. I know it.', river: 'The mud here is premium mud.', woods: 'I could dig here for a hundred years.', beach: 'Infinite sand. Infinite digging. I am home.', market: 'I will sniff every shop door. Twice.' },
  husky: { house: 'Indoors. Fine. AWOO quietly.', park: 'AWOO at every dog in the park! Hello!', river: 'The river is singing. I will sing back. AWOO.', woods: 'This is wolf territory. I am the wolf.', beach: 'Too much sun, not enough snow. AWOO anyway.', market: 'AWOO! (Shopping noises.)' },
  mutt: { house: 'Can I lie on your feet? Thank you.', park: 'I like it here. Can we stay a bit?', river: 'The water sounds nice. Like you.', woods: 'Quiet trees. Quiet me. Happy.', beach: 'I found a shell. It is for you.', market: 'I will wait right here for you. Promise.' },
  chihuahua: { house: 'Sofa secured. Window secured. Toaster under observation.', park: 'Every dog here is twelve times my size. I will bark at all of them.', river: 'The ducks are a threat. I have informed them.', woods: 'A leaf moved. I have filed a report.', beach: 'The waves keep coming back. I keep yelling. It is working.', market: 'I will guard the door. From everyone. Forever.' },
  pug: { house: 'Sofa. Blanket. Snort. Perfect.', park: 'I walked here. That counts as exercise. Can we sit?', river: 'The ducks have bread. I am also bread-shaped. We are allies.', woods: 'Too many trees. Not enough benches. snort.', beach: 'Sand is just a big warm bed. Goodnight.', market: 'Kibble Corner. Kibble. Corner. snort snort.' },
  greyhound: { house: 'Found the softest spot. Lying on it upside down now.', park: 'So much space. Must... sprint... once. Okay, done. Nap.', river: 'Long legs, shallow water. I am basically a heron.', woods: 'Trees are just things I go around at 45 mph.', beach: 'A whole beach of runway! ZOOM. ...zzz.', market: 'I will lean on your legs while you shop. All of my weight.' },
  beagle: { house: 'Someone had toast here three days ago. I can prove it.', park: 'Hot dog stand: 200 metres. Picnic: 50 metres. Squirrel: everywhere.', river: 'Fish. Mud. Duck. A sandwich from Tuesday. Rich smells here.', woods: 'This trail smells like a rabbit with a story. AROOO!', beach: 'Seaweed, sunscreen, chips. My nose is on holiday.', market: 'I can smell every shop at once. It is a lot. I love it.' },
  poodle: { house: 'I have chosen the good cushion. Obviously.', park: 'The other dogs run in circles. I run in shapes.', river: 'I will admire the water. I will not enter the water. The hair.', woods: 'Twigs in my curls. This is a crisis.', beach: 'Sand gets into curls and never leaves. I am being brave.', market: 'I would like to see the Boutique. For research.' },
  collie: { house: 'Everyone is in the kitchen. I have checked. Twice.', park: 'So many dogs. None of them in a line. I can fix that.', river: 'The ducks are in a group. Good ducks.', woods: 'Every tree is accounted for. I counted.', beach: 'The waves keep leaving. I keep bringing them back.', market: 'I will keep the shoppers together. Nobody wanders off.' },
  samoyed: { house: 'The sofa is now fluffier. That is me. I am on it.', park: 'Everyone here gets a smile. Even the pigeon.', river: 'Cold water is my favourite water. Woo-woo!', woods: 'The shade is nice. The leaves stick to me. I am a leaf dog now.', beach: 'Too warm for me. I will smile from the shade.', market: 'Hello, shop. Hello, person. Hello, other person. Woo!' },
  frenchie: { house: 'Sofa. Cushion. Your foot. All good seats.', park: 'I walked to the bench. Now I sit on the bench.', river: 'I do not swim. I sink. I will watch from here.', woods: 'Nice and shady. My kind of walk.', beach: 'Hot sand, flat face. Shade, please. *snort*', market: 'I will sit on your foot while you shop.' },
  akita: { house: 'I will lie by the door and keep an eye on things.', park: 'Hello, park. I will meet the other dogs slowly. One at a time.', river: 'Calm water. I like calm water. I will sit and watch it.', woods: 'Quiet trees. I could sit here all day.', beach: 'Wide sand and a long sea. I will sit and look at it with you.', market: 'I will wait outside the shop. I am very good at waiting.' },
  spitz: { house: 'The sofa is white. I am white. We match.', park: 'Look at me! Look at my fluff! Hello, everyone!', river: 'Splashy! I will go close. Not too close. The fluff.', woods: 'A sunny patch! I will stand in it and sparkle.', beach: 'Sand sticks to fluff. I am a beige dog now. Hello!', market: 'Hello, shop! Do you like my coat? Everyone does.' },
  pom: { house: 'Tiny dog, huge sofa. I am the king of it.', park: 'Every dog here is bigger than me. I will still lead.', river: 'The water is big and I am small. Yip. I will watch from your arms.', woods: 'I am the size of a leaf. A very bossy leaf.', beach: 'The sand is deep. I am a very fluffy ship.', market: 'Carry me and I will tell the shops what to do.' },
  afghan: { house: 'I have chosen the best cushion. I am draped on it. Please do not disturb the drape.', park: 'The wind in my hair. Everyone please notice the wind in my hair.', river: 'I admire the water. My ears may touch it. Nothing else.', woods: 'Twigs in my coat. A tragedy. A very elegant tragedy.', beach: 'Sand in the silk. I will walk like it is a runway.', market: 'I will pose by the door. Admiration is free.' },
  dane: { house: 'The sofa fits half of me. The other half is on the floor. It is fine.', park: 'Hello, small dogs. Hello. Down there. I will be careful.', river: 'The water only reaches my knees. I feel tall. I am tall.', woods: 'Low branches again. I am sorry, trees.', beach: 'So much sand. I will lie in a long line of it.', market: 'I can see over every stall. Everything looks tasty from up here.' },
  mastiff: { house: 'Sofa. Mine. It now has a mastiff on it. The dent stays.', park: 'I will sit here and be a friendly hill. Visitors welcome.', river: 'Drool, water, drool. Mostly drool.', woods: 'Shade and a log. The log is a pillow now.', beach: 'Warm sand and a big sigh. That is the whole plan.', market: 'I will wait here. Please step over my feet. They are big.' },
  gsd: { house: 'I have checked every room. All is in order. Reporting.', park: 'So many dogs and so many jobs. I will start with the ball.', river: 'I will patrol the bank. Nothing is wrong. Still patrolling.', woods: 'Trails! Scents! Tasks! Everything is a task!', beach: 'The sand is flat and the ball is round. Throw it.', market: 'I will stand by you. Anyone suspicious will be sniffed.' },
  // v2.12 Fourteen New Friends
  dobie: { house: 'I have checked every window. Now I will lie where I can see all the doors.', park: 'I will patrol the whole park once. Then I will lean on a friend.', river: 'Water, mud, ducks. I am on watch. The ducks are on notice.', woods: 'Every rustle is under review. So far it is only squirrels.', beach: 'Wide open sand. I can see everything. I may need my coat soon.', market: 'I will stand by the door and look serious. Then I will accept a pat.' },
  corso: { house: 'This is my house. I am its calm, large guardian. Sit anywhere. Not there.', park: 'I will stand in the middle and be a friendly wall. Visitors welcome.', river: 'Slow water, slow dog. We understand each other.', woods: 'A quiet path. I will walk in front of you. Just in case.', beach: 'The sea is big. I am bigger. We are both calm about it.', market: 'I will stay close. Anyone nice may say hello. Slowly.' },
  pitbull: { house: 'Sofa! Blanket! You! This is the best room and I am wiggling all of it.', park: 'So many new friends! I have not met them yet but I love every one!', river: 'Splash! My whole back half is wagging in the water!', woods: 'Sticks and smells and you! My three favourite things!', beach: 'Sand zoomies! The wagging makes even more sand!', market: 'Hello, shop! Hello, shopper! Hello, other shopper! Hug?' },
  minpin: { house: 'I have checked the sofa, the window and the sock. I found the sock.', park: 'I am prancing. Everyone please notice the prancing. High knees!', river: 'The river is long and I am quick. I will race it. I lose. I race again.', woods: 'Tiny dog, huge forest. Everything is a gap I can fit through.', beach: 'The sand is cold on my toes. I will zoom until they warm up.', market: 'Carry me in your coat and I will supervise the whole market from there.' },
  lab: { house: 'The kitchen is that way. I am not going. I am just standing near it.', park: 'Balls! Friends! More balls! I might burst with joy.', river: 'WATER! I was born for this! Splash splash splash!', woods: 'Sticks! Puddles! Mud! A perfect day. Do you have a snack?', beach: 'Waves AND a ball AND you? Is it my birthday?', market: 'Kibble Corner smells so good. I am being very patient. Very. Patient.' },
  malamute: { house: 'Indoors is warm. Woo. Can we go somewhere with snow? Woo-woo.', park: 'Hello, park! Woo-woo! That was a long hello. I have more.', river: 'Cold water! My favourite kind! I will dig a hole in it.', woods: 'This is the best digging ground. I will tell you all about it. Woo.', beach: 'Sun, sand and a thick coat. Shade and water, please. Woo.', market: 'Woo-woo! I am telling the whole market about my day.' },
  chow: { house: 'I have chosen this cushion. It is mine. You may sit near it.', park: 'I will observe the park from here. Do not take it personally.', river: 'Water. Interesting. I will watch it from a dignified distance.', woods: 'A calm forest and a calm lion. We approve of each other.', beach: 'Thick coat, warm sand. Shade and water, please. Then admire me.', market: 'Many people. I will stay by your leg and look unimpressed. It suits me.' },
  stdpoodle: { house: 'I have chosen the best chair. The Miniature Poodle may have the second best.', park: 'I will run a few elegant laps. Then I will learn a trick, for fun.', river: 'A paddle! Poodles were water dogs once. I remember. Mostly.', woods: 'Twigs in the topknot. I will be brave about it.', beach: 'Long legs, long beach. I could run to the horizon. Gracefully.', market: 'The Boutique! My cousin the Miniature Poodle recommends it. Strongly.' },
  schnauzer: { house: 'I have checked every room. The beard approves.', park: 'Ten dogs, four leaves and a pigeon. I will report on all of them.', river: 'Ducks. I have notes. Many notes.', woods: 'A rustle! A twig! A squirrel! This is an emergency. A happy one.', beach: 'Sand in the beard. I will be a very gritty philosopher.', market: 'I will guard the door. The eyebrows will do the rest.' },
  westie: { house: 'Sofa, cushion, dig in the cushion. Why not? It is a good cushion.', park: 'Hello, everyone! I am a very small white dog with very large plans.', river: 'A muddy bank. I will dig. Tomorrow I will be white again. Probably.', woods: 'A hole! Somebody dug a hole. I will make it bigger.', beach: 'Sand is just dry mud. I will dig it. Hello, sand.', market: 'I will march along the shops like a tiny white chrysanthemum on a mission.' },
  yorkie: { house: 'The sofa is mine. The cushion is mine. You may sit on the floor.', park: 'Big dogs everywhere. I will stroll straight through. They will move.', river: 'Water is wet. I have decided I do not love that. Carry me, please.', woods: 'Leaves in the silk. I will allow it. Briefly.', beach: 'Sand and silk are not friends. Hold me and I will look at it.', market: 'Carry me and I will supervise. Put me down and I will still supervise.' },
  bichon: { house: 'A fluffy cushion! We match! I will bounce on it in a circle.', park: 'Hello! Hello! Hello! I am so happy I could pop like a cloud!', river: 'The water is lovely. I will watch it. I will not get my puff wet.', woods: 'Bounce, bounce, leaf. Bounce, bounce, stick. This is a great game.', beach: 'Sand on my puff. I am a sugar cookie now. Hello!', market: 'Everyone says I look like a cotton ball. I say thank you.' },
  maltese: { house: 'A soft cushion and a window. I will lie on both. Gracefully.', park: 'I will float around the park. Please notice the silk.', river: 'Water near my fringe. I will admire it from your arms.', woods: 'The leaves are very big. I am a small white cloud among them.', beach: 'The sand is rough on silk. I will watch it from your lap.', market: 'A small dog in a long white coat. I will wait by you and look lovely.' },
  shihtzu: { house: 'The sofa is soft. The sun is warm. I am not moving. Goodnight.', park: 'I walked to a bench. I sat on the bench. That was the whole walk.', river: 'Water. Ducks. Shade. I will watch from the nicest spot.', woods: 'Shady and quiet. My kind of walk. Wake me if there is a snack.', beach: 'Hot sand, short nose. Shade and water, please. Then a nap.', market: 'I will ride in your arms and wave at the shops with my top-knot.' }
};
const DUCK_LINES = ['A duck looks at you. You look at the duck. Nobody blinks.', 'The ducks are holding a meeting. You were not invited.', 'One duck is wearing a tiny hat. Probably.'];
const FAV = {
  shiba: { food: ['Salmon Pâté'], toy: 'Plush Bone', act: 'tricks' },
  corgi: { food: ['Pupcake', 'Bone-shaped Biscuit'], toy: 'Puzzle Feeder', act: 'feeding' },
  golden: { food: ['Basic Kibble'], toy: 'Tennis Ball', act: 'fetch' },
  dachs: { food: ['Bone-shaped Biscuit'], toy: 'Squeaky Duck', act: 'digging' },
  husky: { food: ['Chicken & Rice Bowl'], toy: 'Rope Tug', act: 'walks' },
  mutt: { food: [], toy: null, act: 'petting' },
  chihuahua: { food: ['Salmon Pâté'], toy: 'Squeaky Duck', act: 'petting' },
  pug: { food: ['Pupcake', 'Chicken & Rice Bowl'], toy: 'Plush Bone', act: 'feeding' },
  greyhound: { food: ['Chicken & Rice Bowl'], toy: 'Frisbee', act: 'fetch' },
  beagle: { food: ['Basic Kibble', 'Bone-shaped Biscuit'], toy: 'Puzzle Feeder', act: 'digging' },
  poodle: { food: ['Salmon Pâté'], toy: 'Puzzle Feeder', act: 'tricks' },
  collie: { food: ['Chicken & Rice Bowl'], toy: 'Frisbee', act: 'fetch' },
  samoyed: { food: ['Chicken & Rice Bowl'], toy: 'Rope Tug', act: 'walks' },
  frenchie: { food: ['Pupcake'], toy: 'Plush Bone', act: 'petting' },
  akita: { food: ['Chicken & Rice Bowl'], toy: 'Tennis Ball', act: 'walks' },
  spitz: { food: ['Bone-shaped Biscuit'], toy: 'Frisbee', act: 'tricks' },
  pom: { food: ['Salmon Pâté'], toy: 'Squeaky Duck', act: 'petting' },
  afghan: { food: ['Salmon Pâté'], toy: 'Frisbee', act: 'walks' },
  dane: { food: ['Chicken & Rice Bowl'], toy: 'Plush Bone', act: 'petting' },
  mastiff: { food: ['Pupcake'], toy: 'Rope Tug', act: 'feeding' },
  gsd: { food: ['Chicken & Rice Bowl'], toy: 'Puzzle Feeder', act: 'tricks' },
  // v2.12 Fourteen New Friends
  dobie: { food: ['Chicken & Rice Bowl'], toy: 'Rope Tug', act: 'walks' },
  corso: { food: ['Pupcake'], toy: 'Plush Bone', act: 'petting' },
  pitbull: { food: ['Pupcake'], toy: 'Rope Tug', act: 'petting' },
  minpin: { food: ['Salmon Pâté'], toy: 'Squeaky Duck', act: 'tricks' },
  lab: { food: ['Basic Kibble', 'Pupcake'], toy: 'Tennis Ball', act: 'fetch' },
  malamute: { food: ['Chicken & Rice Bowl'], toy: 'Rope Tug', act: 'digging' },
  chow: { food: ['Salmon Pâté'], toy: 'Plush Bone', act: 'walks' },
  stdpoodle: { food: ['Salmon Pâté'], toy: 'Frisbee', act: 'tricks' },
  schnauzer: { food: ['Bone-shaped Biscuit'], toy: 'Puzzle Feeder', act: 'walks' },
  westie: { food: ['Bone-shaped Biscuit'], toy: 'Squeaky Duck', act: 'digging' },
  yorkie: { food: ['Salmon Pâté'], toy: 'Plush Bone', act: 'petting' },
  bichon: { food: ['Pupcake'], toy: 'Squeaky Duck', act: 'tricks' },
  maltese: { food: ['Salmon Pâté'], toy: 'Plush Bone', act: 'petting' },
  shihtzu: { food: ['Pupcake'], toy: 'Plush Bone', act: 'feeding' }
};
const BARK = { shiba: 1.1, corgi: 1.35, golden: 0.9, dachs: 1.2, husky: 0.8, mutt: 1.0, chihuahua: 1.7, pug: 0.95, greyhound: 0.75, beagle: 1.0, poodle: 1.25, collie: 1.15, samoyed: 0.95, frenchie: 0.9, akita: 0.65, spitz: 1.3, pom: 1.6, afghan: 0.85, dane: 0.5, mastiff: 0.45, gsd: 0.95, dobie: 0.85, corso: 0.5, pitbull: 1, minpin: 1.55, lab: 0.95, malamute: 0.85, chow: 0.7, stdpoodle: 1.1, schnauzer: 1.4, westie: 1.35, yorkie: 1.6, bichon: 1.2, maltese: 1.15, shihtzu: 1 };
const FALLBACK_DOGS = [
  { key: 'shiba', name: 'Mochi', breed: 'Shiba Inu', personality: 'Proud, independent, dramatic', joke: 'heh.' },
  { key: 'corgi', name: 'Biscuit', breed: 'Corgi', personality: 'Cheerful, greedy for food', joke: 'Is that a snack? Is everything a snack?' },
  { key: 'golden', name: 'Sunny', breed: 'Golden Retriever', personality: 'Friendly, loves fetch', joke: 'I love you. Who are you?' },
  { key: 'dachs', name: 'Noodle', breed: 'Dachshund', personality: 'Curious, loves digging', joke: 'The rest of me is on its way.' },
  { key: 'husky', name: 'Frost', breed: 'Husky', personality: 'Energetic, chatty (howls)', joke: 'AWOOO.' },
  { key: 'mutt', name: 'Pepper', breed: 'Shelter Mutt', personality: 'Loyal, gentle', joke: 'Hi. Can I come home with you?' },
  { key: 'chihuahua', name: 'Peanut', breed: 'Chihuahua', personality: 'Tiny, fearless, dramatic guard dog', joke: 'I am the security system.' },
  { key: 'pug', name: 'Dumpling', breed: 'Pug', personality: 'Snorty, cuddly, lazy, food-loving', joke: 'snort.' },
  { key: 'greyhound', name: 'Rocket', breed: 'Greyhound', personality: 'Gentle couch potato who sprints in bursts', joke: '45 mph. Then a 20-hour nap.' },
  { key: 'beagle', name: 'Bagel', breed: 'Beagle', personality: 'Nose-led, food-obsessed, bays loudly', joke: 'Smelled that from three streets away.' },
  { key: 'poodle', name: 'Pretzel', breed: 'Miniature Poodle', personality: 'Thinks it is the smartest one in the room. It is.', joke: 'Haircut optional. Dignity not.' },
  { key: 'collie', name: 'Scout', breed: 'Border Collie', personality: 'Has counted the sheep. There are no sheep. Has counted you.', joke: 'Will herd the puppies, the ducks and the furniture.' },
  { key: 'samoyed', name: 'Cloud', breed: 'Samoyed', personality: 'Smiles so the snow does not stick. Also just smiles.', joke: 'Sheds a second dog every spring.' },
  { key: 'frenchie', name: 'Brioche', breed: 'French Bulldog', personality: 'Snores, snorts, sits on your foot. All three at once.', joke: 'Breathes like a tiny engine. Shade and water, please.' },
  { key: 'akita', name: 'Kuma', breed: 'Akita', personality: 'Calm, loyal, quietly proud. Waits by the gate.', joke: 'I will wait for you. I am very good at waiting.' },
  { key: 'spitz', name: 'Daifuku', breed: 'Japanese Spitz', personality: 'A white fluffball, cheerful, a bit of a show-off.', joke: 'Yes, I am this white on purpose. Look at me.' },
  { key: 'pom', name: 'Mikan', breed: 'Pomeranian', personality: 'A tiny fluffy loudspeaker. Spins when happy.', joke: 'Yip! That was my indoor voice.' },
  { key: 'afghan', name: 'Saffron', breed: 'Afghan Hound', personality: 'Elegant and aloof. Not one hair out of place.', joke: 'I do not fetch. I glide.' },
  { key: 'dane', name: 'Waffle', breed: 'Great Dane', personality: 'A gentle giant who follows you from room to room.', joke: 'I am a lap dog. Your lap is just too small.' },
  { key: 'mastiff', name: 'Crumpet', breed: 'English Mastiff', personality: 'Huge, slow and sweet. Naps in the biggest patch of shade.', joke: 'A little drool is how I say I love you.' },
  { key: 'gsd', name: 'Strudel', breed: 'German Shepherd', personality: 'Clever and alert. Loves a job, any job.', joke: 'Ears up. On duty. Was that a squirrel?' },
  // v2.12 Fourteen New Friends
  { key: 'dobie', name: 'Espresso', breed: 'Doberman', personality: 'A big softie in a sleek coat. Keeps watch, then wants a cuddle.', joke: 'I am on guard. Please guard me with a blanket.' },
  { key: 'corso', name: 'Cannoli', breed: 'Cane Corso', personality: 'A calm, gentle guardian. Keeps an eye on the whole family.', joke: 'I am very serious. Except when you scratch my ears.' },
  { key: 'pitbull', name: 'Peaches', breed: 'Pit Bull', personality: 'A wiggly, people-loving goofball. Every stranger is a new best friend.', joke: 'My whole back half wags. I cannot stop it.' },
  { key: 'minpin', name: 'Jellybean', breed: 'Miniature Pinscher', personality: 'A tiny, fearless bundle of energy. Prances everywhere.', joke: 'I am not small. Everything else is big.' },
  { key: 'lab', name: 'Butter', breed: 'Labrador Retriever', personality: 'Friendly, food-loving and always ready for a swim.', joke: 'Is it dinner? It feels like dinner.' },
  { key: 'malamute', name: 'Maple', breed: 'Alaskan Malamute', personality: 'A big fluffy sled dog who talks back. Loves snow and digging.', joke: 'Woo-woo. That means I disagree.' },
  { key: 'chow', name: 'Bao', breed: 'Chow Chow', personality: 'A dignified fluffy lion with a blue tongue. Picks friends carefully.', joke: 'I am not grumpy. This is just my face.' },
  { key: 'stdpoodle', name: 'Madeleine', breed: 'Standard Poodle', personality: 'A tall, clever, curly athlete. Learns tricks before you teach them.', joke: 'I am the big poodle. The small one is my cousin.' },
  { key: 'schnauzer', name: 'Muesli', breed: 'Miniature Schnauzer', personality: 'Bearded, bossy and very alert. Reports every leaf.', joke: 'The beard is for wisdom. And soup.' },
  { key: 'westie', name: 'Shortbread', breed: 'West Highland White Terrier', personality: 'A cheerful little white terrier. Digs first, asks later.', joke: 'I was white this morning. I promise.' },
  { key: 'yorkie', name: 'Toffee', breed: 'Yorkshire Terrier', personality: 'A tiny terrier with silky hair and a giant attitude.', joke: 'I am in charge here. Please lift me onto the sofa.' },
  { key: 'bichon', name: 'Meringue', breed: 'Bichon Frise', personality: 'A happy cotton ball who bounces everywhere.', joke: 'Is this a haircut or a cloud? Yes.' },
  { key: 'maltese', name: 'Marshmallow', breed: 'Maltese', personality: 'A gentle little lap dog in a long white coat.', joke: 'I do not walk. I float, elegantly.' },
  { key: 'shihtzu', name: 'Wonton', breed: 'Shih Tzu', personality: 'A relaxed lap dog with a top-knot and big opinions about naps.', joke: 'Top-knot up. Nap time down.' }
];
const GENERIC_DOG = (key) => ({ key, name: 'Buddy', breed: tt('core.generic_breed', 'Mystery Pup'), personality: tt('core.generic_personality', 'A little bit of everything'), joke: tt('core.generic_joke', 'Hi! I am a dog. Probably.') });
const JOKES = {
  shiba: ['heh.', 'I could leave anytime. I choose not to.', 'Pet me. No. Yes. Fine.', 'This yard is beneath me. Literally.', 'I am the main character.', 'Do not look at me while I am being adorable.'],
  corgi: ['Is it snack time? It feels like snack time.', 'I have eaten twice today. Emotionally, that is zero.', 'Short legs. Big dreams. Mostly about snacks.', 'I heard a wrapper. Somewhere. In 2019.', 'Bowl status: tragically empty. Probably.'],
  golden: ['BALL? ball? BALL!', 'I love you. I love the fence. I love that leaf.', 'Every day is the best day!', 'Throw it. Throw anything. Throw the house.', 'I made a friend! It was a bee! Ow!'],
  dachs: ['I dug a hole. It is a secret. It is right there.', 'The rest of me will arrive shortly.', 'Something smells like treasure. Or socks.', 'Hot dog? Where? Oh. Me.', 'I am long for a reason. The reason is digging.'],
  husky: ['AWOOO. That was a greeting.', 'I would like to file a complaint. No walk in five minutes.', 'I am not dramatic. I am a WOLF.', 'Awoo? Awooo. AWOOOOO. (Conversation.)', 'Snow would fix this.'],
  mutt: ['I am a little bit of everything. Mostly love.', 'I will sit here. With you. Forever. Is that okay?', 'My spots are limited edition.', 'You are my favourite human. You are my only human. Still counts.', 'Hi. Just checking you are still here. Hi.'],
  chihuahua: ['I am the security system.', 'I weigh two kilos. Fourteen of them are attitude.', 'A leaf moved. I have alerted the authorities. The authorities is you.', 'I am not shivering. I am vibrating with power.', 'Pick me up. No. Put me down. Pick me up.'],
  pug: ['snort.', 'I have done one thing today. It was a nap. Two things. Two naps.', 'My face is flat so I can get closer to the snacks.', 'Was that a wrapper? snort. snort snort.', 'Lap. Now. Please. snort.'],
  greyhound: ['45 mph. Then a 20-hour nap.', 'I ran once. In 2023. It was amazing.', 'My legs are long so I can lie down in more places at once.', 'I am not lazy. I am charging.', 'Lean mode: activated. You are the wall now.'],
  beagle: ['Smelled that from three streets away.', 'AROOOO! (That means hello. Also snack.)', 'Somebody ate cheese near here in 2019. I am on the case.', 'My ears are long so they can sweep smells towards my nose.', 'I am not stealing the sandwich. I am inspecting it. With my mouth.'],
  poodle: ['Haircut optional. Dignity not.', 'I learned that trick yesterday. I am bored of it today.', 'These are not curls. They are a hairstyle.', 'I have read the instructions. You have not.', 'I could open the treat jar. I am waiting for you to be polite.'],
  collie: ['Will herd the puppies, the ducks and the furniture.', 'You moved. I noticed. I notice everything.', 'Throw it again. And again. And again. Please.', 'The chairs are in a line now. You are welcome.', 'I need a job. Any job. Is the job you?'],
  samoyed: ['Sheds a second dog every spring.', 'Woo-woo! That means hello. Also everything.', 'I am not white. I am snow-coloured.', 'You look sad. I will smile at you until you stop.', 'Brush me? Brush me. Now there are two of me.'],
  frenchie: ['Breathes like a tiny engine. Shade and water, please.', 'I am sitting on your foot. It is my foot now.', 'My ears hear everything. I ignore most of it.', '*snort* That was a compliment.', 'I am not lazy. I am low to the ground.'],
  akita: ['I do not bark much. I just look at you until you understand.', 'I will wait here for you. I am very good at it.', 'A true friend sits by the door. That is me. The door friend.', 'I like my space. You may sit near it.', 'I am calm. I am proud. I would like a snack.', 'My tail curls over my back because it is happy up there.'],
  spitz: ['I am white. Pure white. Please do not look at the mud puddle.', 'A cloud on four legs. Hello.', 'Fluff check: fluffed. Smile check: smiling. Ready.', 'That was my bright bark. It means hello.', 'Someone said I look like a snowball. They said it kindly.', 'Brush me and I will shine. A bit.'],
  pom: ['I am very small and very sure.', 'Spin, yip, spin. That is the whole plan.', 'My fluff is bigger than my dog.', 'I may be tiny. My opinions are not.', 'Pick me up! No, put me down! I run this place.', 'Yip! That was my battle cry.'],
  afghan: ['Wind in my hair. Do not touch the hair.', 'I am not stuck up. I just sit at a better height.', 'Ten minutes of running. Two hours of brushing. Fair trade.', 'I have a very expressive face. It says not now.', 'My ears are silk. They also hold your attention.', 'Yes, I am an artwork. Please look from the left.'],
  dane: ['I am a very big dog who thinks he is a lap dog.', 'I sat on the sofa. The sofa is now a footstool.', 'My tail is a tidy weapon. Sorry about the coffee table.', 'Everyone looks up to me. That is just the height.', 'I leaned on you. That is a hug. A big one.', 'I was a puppy last week. Look at me now. Ow, the ceiling.'],
  mastiff: ['Big dog, bigger sigh.', 'I only run when there is food. The food is usually here.', 'I am not drooling. I am showing my love.', 'My wrinkles tell a story. The story is about naps.', 'I sat on the cat. I did not know there was a cat.', 'All that love in one big head. And big feet.'],
  gsd: ['I have a job. The job is you.', 'Reporting for duty. Waiting for orders. Still waiting.', 'I know a trick. Also fourteen more. Ask.', 'My ears hear the fridge. My ears hear everything.', 'I will guard the garden. And the sofa. And the snacks.', 'I am not bossy. I am organised.'],
  // v2.12 Fourteen New Friends
  dobie: ['I am on guard. Please guard me with a blanket.', 'I checked the room. It is safe. Can I sit on you now?', 'My ears are folded and my heart is not. It is marshmallow.', 'I look serious. I am practising. It is not going well.', 'It is chilly. Is there a coat? I would like the coat.'],
  corso: ['I am very serious. Except when you scratch my ears.', 'I guard the family. The family guards the snacks. It works.', 'A little jowl, a lot of love.', 'I am big. I am calm. I am slightly damp. Sorry.', 'Slow blink means I love you. Fast blink means snack.'],
  pitbull: ['My whole back half wags. I cannot stop it.', 'Hello! Hello! Do you want a hug? I want a hug!', 'I am a lap dog. The lap is a bit small. I will manage.', 'Smile check: smiling. Wiggle check: wiggling.', 'I leaned on you. That means we are best friends.'],
  minpin: ['I am not small. Everything else is big.', 'Look at my knees go. Up, up, up. Like a tiny horse.', 'I fit through every gap. Every gap is mine.', 'I am very brave. Also cold. Do you have a coat?', 'Zoom. Stop. Prance. Zoom. That is my whole morning.'],
  lab: ['Is it dinner? It feels like dinner.', 'I love you. I love the ball. I love that you have a sandwich.', 'My tail is an otter. It clears tables. Sorry about the table.', 'The bowl is measured. I counted the kibble. It is a small number.', 'I swim like a seal and I think like a snack.'],
  malamute: ['Woo-woo. That means I disagree.', 'Woo. Woo-woo. Woo. That was a whole speech. Thank you.', 'I am not stubborn. I am just very sure.', 'I dug a hole. It is a nice hole. It is for me.', 'My coat is a winter coat all year. I regret nothing. I would like shade.'],
  chow: ['I am not grumpy. This is just my face.', 'Check out my tongue. It is blue. It was always blue. No, you cannot touch it.', 'I am a lion. A small, fluffy, polite lion.', 'I choose my friends carefully. You are on the list.', 'Brush me and I will allow it. That is love.'],
  stdpoodle: ['I am the big poodle. The small one is my cousin.', 'I learned that trick before you finished the sentence.', 'Long legs. Curly coat. Please clap.', 'My cousin the Miniature Poodle is very smart. I am smart too. Taller, though.', 'The topknot is not a hat. It is a hairstyle with ambition.'],
  schnauzer: ['The beard is for wisdom. And soup.', 'My eyebrows saw that. My eyebrows see everything.', 'A leaf moved. I have written a report. It is four pages.', 'I am small but I am in charge of the mailbox.', 'Beard check: tidy. Mood check: alert.'],
  westie: ['I was white this morning. I promise.', 'Dig first. Ask later. That is the Westie way.', 'I am not dirty. I am a gardener.', 'My ears are small and my plans are big.', 'Fluffy head, carrot tail, mud on the nose. Perfect.'],
  yorkie: ['I am in charge here. Please lift me onto the sofa.', 'Tiny dog, long hair, enormous opinions.', 'The bow stays. I will fight for the bow.', 'I weigh as much as a loaf of bread. A very bossy loaf.', 'I bark at the big dogs. They do not know I am small. I will not tell them.'],
  bichon: ['Is this a haircut or a cloud? Yes.', 'Boing boing boing. That is how I say hello.', 'I am a cotton ball with a heartbeat.', 'Brush me and I will be a cloud again. A bigger cloud.', 'I spin because I am happy. Also because I can.'],
  maltese: ['I do not walk. I float, elegantly.', 'My hair is longer than my legs. I manage.', 'The topknot keeps the world out of my eyes. It also looks nice.', 'A lap is a throne. This is my throne.', 'Brush me daily and I will tell you I love you. Quietly.'],
  shihtzu: ['Top-knot up. Nap time down.', 'My face is flat so I can reach the pillow faster.', 'I am a small lion. A sleepy one. Roar. Zzz.', 'My hair is so long I walk on a rug of me.', 'The lap is warm. The sun is warm. I am warm. Zzz.']
};
const NPC_JOKES = ['Nice leash. Is that leash new?', 'I am Gary. I have never been happy.', 'Have you seen my ball? It is round. Ball-coloured.', 'WOOF. Sorry. Wrong dog.', 'I ate a bee once. Zero stars.', 'Your human walks funny. Mine too.', 'Sniff my bum? Rude not to.', 'I live here. On this exact spot.'];
const SMELLS = ['Smells like a sandwich from 2014.', 'Smells like ANOTHER DOG. Scandalous.', 'Smells like adventure. No wait, a sock.', 'Smells like rain and old crisps.', 'Smells like... a squirrel\'s diary.', 'Sniff sniff. Interesting. Very interesting.'];
const MUD = ['Splosh. Now with 30% more mud.', 'Puddle. Mud. Joy. Regret.', 'Your dog is now a different colour.'];
const RAND = (a, b) => a + Math.random() * (b - a);
const RINT = (a, b) => Math.floor(RAND(a, b + 1));
const PICK = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- art access (safe) ---------------- */
const PA = () => window.PawArt || {};
const FB_VB = { dog: '0 0 240 200', dogHead: '0 0 100 100', icon: '0 0 64 64', item: '0 0 64 64', house: '0 0 240 200', scene: '0 0 1000 600', walkStrip: '0 0 1200 400', collectible: '0 0 60 60', prop: '0 0 120 120' };
/* v1.7: a breed the art does not know (yet) draws as the generic mutt instead of borrowing another breed */
function artKey(k) { const d = PA().DOGS; if (!Array.isArray(d) || !d.length || d.some((x) => x.key === k)) return k; return d.some((x) => x.key === 'mutt') ? 'mutt' : d[0].key; }
function art(fn, ...a) {
  if ((fn === 'dog' || fn === 'dogHead') && typeof a[0] === 'string') a[0] = artKey(a[0]);
  try { const f = PA()[fn]; if (typeof f === 'function') { const s = f.apply(PA(), a); if (s) return s; } } catch (e) { console.warn('PawArt.' + fn + ' failed', e); }
  const vb = FB_VB[fn] || '0 0 100 100';
  return `<svg viewBox="${vb}"><text x="50%" y="55%" text-anchor="middle" font-size="20" fill="#2a2420">?</text></svg>`;
}
/* v2.15 lazy art chunks (PERF.md section 5, V215.md 13b). 'f' = world F (the v2.15 map), 'g' = world G (the new places, strips, PawArt.FLOOR rows).
   artChunk(name) -> a Promise of true once that world is loaded (at once in the one-file builds, the artifact and the harness, where the worlds
   are inline, and when the build has no such world), false when its file failed to load (a later call tries again).
   artChunkReady(name) -> the same answer, now (no loading). The split build (tools/split.js) sets window.PAW_CHUNKS = { f: 'world_f.<hash>.js', ... } */
const ART_CHUNK = {};
const artChunkReady = (name) => { const C = window.PAW_CHUNKS; return !(C && C[name]) || ART_CHUNK[name] === true; };
function artChunk(name) {
  if (artChunkReady(name)) return Promise.resolve(true);
  if (ART_CHUNK[name]) return ART_CHUNK[name];
  ART_CHUNK[name] = new Promise((res) => {
    const s = document.createElement('script'); s.src = window.PAW_CHUNKS[name]; s.async = true;
    s.onload = () => { ART_CHUNK[name] = true; Object.keys(sceneReal).forEach((k) => { delete sceneReal[k]; }); emit('art:chunk', { name }); res(true); };
    s.onerror = () => { ART_CHUNK[name] = null; if (s.parentNode) s.parentNode.removeChild(s); res(false); };
    (document.head || document.documentElement).appendChild(s);
  });
  return ART_CHUNK[name];
}
let dogsMemo = null;
function dogsList() {
  const d = PA().DOGS; if (!Array.isArray(d) || !d.length) return FALLBACK_DOGS;
  if (dogsMemo && dogsMemo.src === d) return dogsMemo.list;
  const list = d.filter((x) => x && x.key).concat(FALLBACK_DOGS.filter((f) => !d.some((x) => x && x.key === f.key))); dogsMemo = { src: d, list }; return list;
}
function dogInfo(key) { return dogsList().find((d) => d.key === key) || FALLBACK_DOGS.find((d) => d.key === key) || GENERIC_DOG(key); }
// Nest an art SVG string inside a parent SVG at x,y,w,h.
function place(svg, x, y, w, h, extra = '') {
  // inline size wins over any module CSS that sizes .pa-* roots
  return svg.replace(/^\s*<svg\b([^>]*)>/, (m, attrs) => {
    let st = `width:${w}px;height:${h}px;overflow:visible;`;
    attrs = attrs.replace(/\s(?:width|height|x|y)="[^"]*"/g, '').replace(/\sstyle="([^"]*)"/, (mm, v) => { st += v; return ''; });
    return `<svg x="${x}" y="${y}" width="${w}" height="${h}" style="${st}" ${extra} ${attrs}>`;
  });
}
const ICON = (n) => art('icon', n);

/* ---------------- sketch chrome (style G): pencil frames as stretchable SVG data URIs ---------------- */
const INKG = '#5B3D32';
function seeded(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const f1 = (n) => Math.round(n * 10) / 10;
function svgURI(svg) {
  let s2 = svg.trim(); if (!/^<svg[^>]*xmlns=/.test(s2)) s2 = s2.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(s2)}")`;
}
function rrPts(W, H, r, m, n) {
  const x0 = m, y0 = m, x1 = W - m, y1 = H - m, P = Math.PI; r = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
  const line = (ax, ay, bx, by) => ({ len: Math.hypot(bx - ax, by - ay), f: (t) => [ax + (bx - ax) * t, ay + (by - ay) * t] });
  const arc = (cx, cy, a0, a1) => ({ len: Math.abs(a1 - a0) * r, f: (t) => { const a = a0 + (a1 - a0) * t; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; } });
  const segs = [line(x0 + r, y0, x1 - r, y0), arc(x1 - r, y0 + r, -P / 2, 0), line(x1, y0 + r, x1, y1 - r), arc(x1 - r, y1 - r, 0, P / 2), line(x1 - r, y1, x0 + r, y1), arc(x0 + r, y1 - r, P / 2, P), line(x0, y1 - r, x0, y0 + r), arc(x0 + r, y0 + r, P, 1.5 * P)];
  const L = segs.reduce((a, g) => a + g.len, 0), pts = [];
  for (let i = 0; i < n; i++) { let d = i / n * L; for (const g of segs) { if (d <= g.len) { pts.push(g.f(g.len ? d / g.len : 0)); break; } d -= g.len; } }
  return pts;
}
function wobble(pts, rnd, amp, start, span, closed = true) {
  const n = pts.length, s0 = closed ? Math.floor(start * n) : 0, cnt = closed ? Math.floor(span * n) : n - 1, out = [];
  let ox = 0, oy = 0;
  for (let i = 0; i <= cnt; i++) { ox = ox * 0.78 + (rnd() - 0.5) * amp; oy = oy * 0.78 + (rnd() - 0.5) * amp; const p = pts[(s0 + i) % n]; out.push([p[0] + ox, p[1] + oy]); }
  let d = `M${f1(out[0][0])} ${f1(out[0][1])}`;
  for (let i = 1; i < out.length - 1; i++) d += `Q${f1(out[i][0])} ${f1(out[i][1])} ${f1((out[i][0] + out[i + 1][0]) / 2)} ${f1((out[i][1] + out[i + 1][1]) / 2)}`;
  const l = out[out.length - 1]; return d + `L${f1(l[0])} ${f1(l[1])}`;
}
function pencilSVG(W, H, pts, seed, closed = true, amp = 1.5) {
  const rnd = seeded(seed);
  const a = wobble(pts, rnd, amp, rnd(), 1.03, closed), b = wobble(pts, rnd, amp * 0.9, rnd(), 0.95, closed);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><g fill="none" stroke="${INKG}" stroke-linecap="round" stroke-linejoin="round"><path d="${a}" stroke-width="2.3" vector-effect="non-scaling-stroke"/><path d="${b}" stroke-width="1.2" opacity=".55" vector-effect="non-scaling-stroke"/></g></svg>`;
}
// v2.13.2: the same pencil line (same seed, same first path) as a filled shape, used as a CSS mask so a big window's crayon wash fills exactly up to its
// line however far the frame is stretched (a fixed inset left strips at the corners and edges of the shops, the journal and the training panel)
function pencilMask(W, H, pts, seed, closed = true, amp = 1.5) {
  const rnd = seeded(seed), a = wobble(pts, rnd, amp, rnd(), 1.03, closed);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${a}Z" fill="#000"/></svg>`;
}
function propOK(name) { try { const f = PA().prop; if (typeof f !== 'function') return ''; const v = f.call(PA(), name); return typeof v === 'string' && v.includes('<svg') ? v : ''; } catch (e) { return ''; } }
function buildChrome() {
  const root = document.documentElement, set = (k, svg) => root.style.setProperty(k, svgURI(svg));
  set('--fr-card', pencilSVG(300, 200, rrPts(300, 200, 9, 3, 90), 11)); set('--frm-card', pencilMask(300, 200, rrPts(300, 200, 9, 3, 90), 11));
  set('--fr-btn', pencilSVG(200, 60, rrPts(200, 60, 12, 3, 70), 23));
  const circ = Array.from({ length: 44 }, (_, i) => [50 + Math.cos(i / 44 * 6.283) * 45, 50 + Math.sin(i / 44 * 6.283) * 45]);
  set('--fr-round', pencilSVG(100, 100, circ, 37));
  set('--fr-tube', pencilSVG(300, 24, rrPts(300, 24, 10, 2.5, 80), 41, true, 1.1));
  set('--fr-tubew', pencilSVG(1000, 24, rrPts(1000, 24, 10, 2.5, 160), 43, true, 1.2));
  set('--fr-wide', pencilSVG(800, 60, rrPts(800, 60, 12, 3, 140), 47, true, 1.6));
  set('--fr-tray', pencilSVG(1000, 170, rrPts(1000, 170, 12, 3, 180), 59, true, 1.7)); set('--frm-tray', pencilMask(1000, 170, rrPts(1000, 170, 12, 3, 180), 59, true, 1.7));
  // v2.14.1: a tall sheet's frame (the phone adopt card, about 370 x 870 px). --fr-tray is 170 high, so stretched that tall its line sank 20 px
  // into the card and its wobble became waves that ran through the title (owner, 23 Oct 2026)
  set('--fr-sheet', pencilSVG(400, 900, rrPts(400, 900, 12, 3, 240), 59, true, 1.7)); set('--frm-sheet', pencilMask(400, 900, rrPts(400, 900, 12, 3, 240), 59, true, 1.7));
  set('--fr-stage', pencilSVG(1280, 720, rrPts(1280, 720, 14, 4, 260), 61, true, 2.2));
  set('--line', pencilSVG(600, 9, Array.from({ length: 60 }, (_, i) => [3 + i * 594 / 59, 4.5]), 53, false, 1.6));
  set('--fr-tail', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18"><path d="M1 1 L7 17 L21 1 Z" fill="#FFFBF3"/><path d="M1.5 2 Q5 9 7 16.5 Q13 9 20.5 2" fill="none" stroke="${INKG}" stroke-width="2" stroke-linecap="round"/></svg>`);
  const tape = propOK('tape');
  set('--tape', tape || `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 30"><path d="M3 4 L117 2 L114 8 L118 14 L114 20 L117 27 L4 28 L7 22 L2 15 L6 9 Z" fill="#F28FA5" opacity=".6"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${8 + i * 14}" y="3" width="5" height="25" fill="#fff" opacity=".4" transform="skewX(-18)"/>`).join('')}</svg>`);
  const sp = propOK('speech'); if (sp) { set('--speech', sp.replace(/^<svg(?![^>]*preserveAspectRatio)/, '<svg preserveAspectRatio="none"')); root.classList.add('pa-speech'); }
  const pn = propOK('panel'); if (pn) { set('--panelart', pn.replace(/^<svg(?![^>]*preserveAspectRatio)/, '<svg preserveAspectRatio="none"')); root.classList.add('pa-panel'); }
}
/* ---- scenes + weather overlay ---- */
const HANG = ['house', 'park', 'river', 'woods', 'beach'];
const sceneReal = {};
function hasRealScene(name) {
  if (!HANG.includes(name) && !NEW_PLACES.includes(name)) return true; if (name in sceneReal) return sceneReal[name];
  const norm = (x) => x.replace(/\b(id|href|xlink:href)="[^"]*"/g, '').replace(/url\(#[^)]*\)/g, '').replace(/aria-label="[^"]*"/g, '');
  const a = artReal('scene', name, { time: 'day', weather: 'sunny' });
  sceneReal[name] = !!a && norm(a) !== norm(art('scene', 'yard', { time: 'day', weather: 'sunny' }));
  return sceneReal[name];
}
// v2.15: world G lists the scenes it draws in PawArt.WORLD_G_SCENES (as world C does). Until then (or while its chunk loads) a new place is a plain sketch ground with its sign
const mpSceneReady = (name) => !!(window.PawArt && Array.isArray(PawArt.WORLD_G_SCENES) && PawArt.WORLD_G_SCENES.includes(name));
function mpPlainGround(name) {
  return `<g class="mp-plain" data-plain="${name}"><rect width="1000" height="600" fill="#FFFBF3"/><path d="M0 372 Q160 352 330 366 T660 360 T1000 368 V600 H0 Z" fill="#EEF2DC" stroke="#5B3D32" stroke-width="3" stroke-linejoin="round"/>`
    + `<g fill="none" stroke="#B9C79A" stroke-width="3" stroke-linecap="round">${[[90, 430], [260, 470], [450, 420], [640, 480], [820, 440], [160, 540], [560, 550], [900, 530]].map(([x, y]) => `<path d="M${x} ${y} l6 -14 M${x + 8} ${y} l2 -16 M${x + 16} ${y} l-4 -12"/>`).join('')}</g></g>` + mpPlainDoor(name) + placeSign(name); // v2.15: a storefront gets a doodle door (data-shop, 42_map215.js)
}
function sceneArt(name, e, extra) {
  const o = Object.assign({}, e || {}, extra || {});
  const tk = tkSceneArt(name, o); if (tk) return tk; // v2.11: the six Tokyo places (world D / E art, else a stand-in, 39_tokyo.js)
  if (MP_KEYS.includes(name) && !mpSceneReady(name)) return mpPlainGround(name); // v2.15: a new place whose world G scene is not there (yet)
  if (grOn(name)) return place(art('scene', name, Object.assign(o, { v215: true })), 0, 0, grFloor(name).w, 600); // v2.15 GROUND: the deep (and wide) floor, at its own width (43_ground.js)
  if (NEW_PLACES.includes(name) && !hasRealScene(name)) return place(art('scene', SCENE_FB[name], o), 0, 0, 1000, 600) + placeSign(name);
  if (HANG.includes(name) && !hasRealScene(name)) return name === 'house' ? place(art('scene', 'yard', o), 0, 0, 1000, 600) : place(art('walkStrip', name, e), -400, 0, 1800, 600);
  return place(art('scene', name, o), 0, 0, 1000, 600);
}
function sceneG(name, extra = {}, noEnv) { return `<g id="sceneG" data-scene="${name}" data-noenv="${noEnv ? 1 : ''}" data-extra='${JSON.stringify(extra)}'>${sceneArt(name, noEnv ? null : envNow(), extra)}</g>`; }
function snowmanSVG() { if (!S || weatherNow() !== 'snow' || !isWarm()) return ''; const sm = artReal('prop', 'snowman'); return sm ? place(sm, 70, 440, 110, 110) : `<g transform="translate(125 545)" stroke="#5B3D32" stroke-width="2.4" fill="#FFFBF3"><circle cy="-22" r="24"/><circle cy="-62" r="17"/><circle cx="-6" cy="-66" r="2" fill="#5B3D32"/><circle cx="6" cy="-66" r="2" fill="#5B3D32"/><path d="M0 -60 l12 3 l-12 3z" fill="#F4A262"/></g>`; }
const outdoorView = () => (['yard', 'bath', 'fetch'].includes(cur.mode) ? !!(S && PLACES[S.place] && PLACES[S.place].out) : cur.mode === 'shelter' && !(window.PawArt && PawArt.WORLD_C_SCENES && PawArt.WORLD_C_SCENES.includes('playroom'))); // v2.7: the Shelter Playroom is indoors (no rain or snow over it)
const outdoorsNow = () => !(S && (S.place === 'house' || (PLACES[S.place] && PLACES[S.place].out === false)));
// fallback tint while a scene module ignores {time, weather}: compare two renders with ids stripped
const timeSupport = {};
function sceneKnowsTime(name) {
  if (name in timeSupport) return timeSupport[name];
  const norm = (x) => x.replace(/\b(id|href|xlink:href)="[^"]*"/g, '').replace(/url\(#[^)]*\)/g, '');
  try { timeSupport[name] = norm(art('scene', name, { time: 'day', weather: 'sunny' })) !== norm(art('scene', name, { time: 'night', weather: 'rain' })); } catch (e) { timeSupport[name] = true; }
  return timeSupport[name];
}
function updateWxOverlay() {
  view.querySelectorAll('.wxfx,.tintfx').forEach((e) => e.remove());
  const g = $('#sceneG', view), t = timePhase(), w0 = weatherNow();
  if (g && !g.dataset.noenv && S && !(cur.mode !== 'shelter' && S.place === 'house') && !sceneKnowsTime(g.dataset.scene) && (t !== 'day' || w0 === 'rain' || w0 === 'cloudy' || w0 === 'snow')) { const d = document.createElement('div'); d.className = 'tintfx ' + t + ' w-' + w0; view.appendChild(d); }
  const w = weatherNow(); if (!outdoorView() || (w !== 'rain' && w !== 'snow')) return;
  const d = document.createElement('div'); d.className = 'wxfx ' + w; view.appendChild(d);
}
let envKey = '';
function checkEnv(force) {
  const e = envNow(), fe = festNow(), k = e.time + '|' + e.weather + '|' + e.season + '|' + (fe.leaf ? 'L' : '') + (fe.halloween ? 'H' : '') + (fe.snow ? 'S' : '') + (fe.lights ? 'T' : '') + (fe.newyear ? 'N' : '') + '|' + (e.jp ? 'J' : ''); // v2.8: S/T/N, and the jp flag (a suite can flip prefs.jpTest)
  if (k === envKey && !force) return; const first = !envKey; const oldKey = envKey; envKey = k;
  if (!first) { const o = oldKey.split('|'); if (o[2] !== e.season) emit('env:season', { season: e.season }); if (o[3] !== k.split('|')[3]) emit('env:fest', fe); } // v2.5
  const g = $('#sceneG'); if (g && !g.dataset.noenv) { let extra = {}; try { extra = JSON.parse(g.dataset.extra || '{}'); } catch (er) { /* none */ } g.innerHTML = sceneArt(g.dataset.scene, e, extra); }
  const sm = $('#snowmanG'); if (sm) sm.innerHTML = snowmanSVG();
  if (g && !g.dataset.noenv) emit('scene:redraw', { mode: cur.mode });
  updateWxOverlay(); audioPlace(); updateHUD();
  if (!first && cur.mode === 'yard') { dogKey = ''; setTimeout(() => yardReaction(true), 400); }
}
const WX_DOODLE = {
  'w-sunny': '<circle r="8" fill="#FFE3A1" stroke="#5B3D32" stroke-width="2"/><path d="M0 -15v4M0 11v4M-15 0h4M11 0h4M-10 -10l3 3M7 7l3 3M10 -10l-3 3M-7 7l-3 3" stroke="#5B3D32" stroke-width="2" stroke-linecap="round"/>',
  'w-dawn': '<path d="M-14 6h28" stroke="#5B3D32" stroke-width="2"/><path d="M-8 6a8 8 0 0 1 16 0z" fill="#FCD8BC" stroke="#5B3D32" stroke-width="2"/>',
  'w-dusk': '<path d="M-14 6h28" stroke="#5B3D32" stroke-width="2"/><path d="M-8 6a8 8 0 0 1 16 0z" fill="#F4A262" stroke="#5B3D32" stroke-width="2"/>',
  'w-night': '<path d="M4 -12a12 12 0 1 0 8 18a9 9 0 1 1 -8 -18z" fill="#E0D5F0" stroke="#5B3D32" stroke-width="2"/>',
  'w-cloudy': '<path d="M-12 6q-6 0 -4 -6q2 -5 8 -3q3 -7 10 -3q8 0 6 7q5 1 2 5z" fill="#FFFBF3" stroke="#5B3D32" stroke-width="2"/>',
  'w-rain': '<path d="M-12 0q-6 0 -4 -6q2 -5 8 -3q3 -7 10 -3q8 0 6 7q5 1 2 5z" fill="#CBE0F4" stroke="#5B3D32" stroke-width="2"/><path d="M-6 6l-2 6M1 6l-2 6M8 6l-2 6" stroke="#3F76C0" stroke-width="2" stroke-linecap="round"/>',
  'w-snow': '<path d="M0 -12v24M-10 -6l20 12M10 -6l-20 12" stroke="#3F76C0" stroke-width="2.2" stroke-linecap="round"/>'
};
/* small pencil doodles for the cover and celebration cards */
function doodle(kind, x, y, s = 1, rot = 0) {
  const t = `transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"`, st = `stroke="${INKG}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  if (kind === 'spark') return `<g ${t}><path d="M0 -14 Q1.5 -1.5 14 0 Q1.5 1.5 0 14 Q-1.5 1.5 -14 0 Q-1.5 -1.5 0 -14Z" fill="#FFE3A1" ${st}/></g>`;
  if (kind === 'heart') return `<g ${t}><path d="M0 12 C-16 0 -12 -14 0 -6 C12 -14 16 0 0 12Z" fill="#F28FA5" fill-opacity=".75" ${st}/><path d="M-6 -4 Q-3 -7 0 -4" fill="none" stroke="#fff" stroke-width="1.5" opacity=".8"/></g>`;
  if (kind === 'paw') return `<g ${t}><ellipse cx="0" cy="6" rx="9" ry="7.5" fill="#E0D5F0" ${st}/><circle cx="-10" cy="-5" r="3.8" fill="#E0D5F0" ${st}/><circle cx="-3.5" cy="-10" r="3.8" fill="#E0D5F0" ${st}/><circle cx="3.5" cy="-10" r="3.8" fill="#E0D5F0" ${st}/><circle cx="10" cy="-5" r="3.8" fill="#E0D5F0" ${st}/></g>`;
  if (kind === 'flower') return `<g ${t}>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-8" rx="5" ry="7" transform="rotate(${a})" fill="#F9D0D9" ${st}/>`).join('')}<circle r="4.5" fill="#FFE3A1" ${st}/></g>`;
  if (kind === 'note') return `<g ${t}><path d="M4 8 L4 -12 Q10 -8 13 -11" fill="none" ${st}/><ellipse cx="0" cy="9" rx="5" ry="3.8" fill="${INKG}" transform="rotate(-20 0 9)"/></g>`;
  if (kind === 'bone') return `<g ${t}><path d="M-14 -4 Q-20 -10 -14 -12 Q-11 -14 -10 -8 L10 -8 Q11 -14 14 -12 Q20 -10 14 -4 Q20 2 14 4 Q11 6 10 0 L-10 0 Q-11 6 -14 4 Q-20 2 -14 -4Z" fill="#FFF4DF" ${st}/></g>`;
  return '';
}
buildChrome();

/* ---------------- sound (WebAudio, synthesized) ---------------- */
const SFX = (() => {
  let ctx = null, master = null, muted = false, noiseBuf = null;
  let routed = false, level = 1;
  function init() {
    try { if (window.PawAudio && typeof PawAudio.init === 'function') PawAudio.init(); } catch (e) { /* audio module failed */ }
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return; }
    try {
      const PAu = window.PawAudio;
      if (PAu && PAu.ctx && PAu.bus && PAu.bus.sfx) { ctx = PAu.ctx; routed = true; master = ctx.createGain(); master.gain.value = 0.3; master.connect(PAu.bus.sfx); }
      else { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.3 * level; master.connect(ctx.destination); }
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
  }
  const ok = () => ctx && (!muted || routed);
  function env(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function tone(type, f0, f1, dur, vol = 0.6, delay = 0, o = {}) {
    if (!ok()) return; const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator(), g = ctx.createGain(); osc.type = type; osc.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur * (o.bend || 1));
    let node = osc;
    if (o.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.vib; lg.gain.value = o.vibD || 12; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + .05); }
    if (o.filter) { const f = ctx.createBiquadFilter(); f.type = o.filter; f.frequency.value = o.ff || 1200; f.Q.value = o.q || 1; node.connect(f); node = f; }
    node.connect(g); g.connect(master); env(g, t, o.a || 0.01, vol, dur); osc.start(t); osc.stop(t + dur + 0.05);
  }
  function noise(dur, vol = 0.5, delay = 0, type = 'bandpass', f0 = 1500, f1 = 0, q = 1) {
    if (!ok()) return; const t = ctx.currentTime + delay;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf;
    f.type = type; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = q;
    s.connect(f); f.connect(g); g.connect(master); env(g, t, 0.005, vol, dur); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  return {
    init, isMuted: () => muted,
    setMuted(m) { muted = m; if (master && !routed) master.gain.value = m ? 0 : 0.3 * level; },
    setLevel(v) { level = v; if (master && !routed) master.gain.value = muted ? 0 : 0.3 * level; },
    isRouted: () => routed,
    boop(f = 520) { tone('sine', f, f * 1.25, 0.12, 0.5); },
    click() { tone('triangle', 700, 900, 0.06, 0.35); },
    squeak() { tone('sine', 900, 1700, 0.09, 0.45); tone('sine', 1700, 1150, 0.08, 0.4, 0.09); },
    pop() { tone('sine', 600, 1300, 0.08, 0.5); },
    crunch() { for (let i = 0; i < 4; i++) noise(0.05, 0.6, i * 0.11 + Math.random() * 0.03, 'bandpass', 1800 + Math.random() * 900, 0, 2.5); },
    kaching() { tone('square', 1318, 0, 0.08, 0.3); tone('square', 1760, 0, 0.35, 0.3, 0.08); tone('triangle', 2637, 0, 0.5, 0.25, 0.1); noise(0.08, 0.25, 0, 'highpass', 4000); },
    bark(p = 1) { tone('sawtooth', 560 * p, 250 * p, 0.12, 0.45, 0, { filter: 'lowpass', ff: 1700 }); tone('sawtooth', 600 * p, 260 * p, 0.11, 0.4, 0.18, { filter: 'lowpass', ff: 1700 }); noise(0.05, 0.15, 0, 'bandpass', 900); },
    howl() { tone('sine', 320, 640, 1.3, 0.4, 0, { bend: 0.5, vib: 6, vibD: 18, a: 0.1 }); tone('triangle', 640, 380, 0.7, 0.25, 0.65, { vib: 6, vibD: 14 }); },
    nope() { tone('sawtooth', 340, 300, 0.18, 0.35, 0, { vib: 28, vibD: 16, filter: 'bandpass', ff: 950, q: 3 }); tone('sawtooth', 260, 190, 0.32, 0.35, 0.2, { vib: 28, vibD: 16, filter: 'bandpass', ff: 850, q: 3 }); },
    fanfare() { [523, 659, 784].forEach((f, i) => tone('square', f, f, 0.11, 0.25, i * 0.12, { filter: 'lowpass', ff: 3000 })); tone('triangle', 1047, 1047, 0.5, 0.35, 0.36, { vib: 7, vibD: 10 }); tone('square', 784, 784, 0.45, 0.15, 0.36, { filter: 'lowpass', ff: 2500 }); },
    splash() { noise(0.55, 0.55, 0, 'lowpass', 3500, 300, 0.7); tone('sine', 300, 120, 0.2, 0.25, 0.02); },
    thud() { tone('sine', 150, 55, 0.18, 0.55); },
    whoosh() { noise(0.35, 0.35, 0, 'bandpass', 400, 2400, 1.5); },
    sniff() { noise(0.07, 0.3, 0, 'highpass', 2500); noise(0.07, 0.3, 0.12, 'highpass', 2500); noise(0.09, 0.3, 0.24, 'highpass', 2500); },
    slurp() { tone('sine', 300, 700, 0.15, 0.35, 0, { vib: 30, vibD: 40 }); tone('sine', 350, 800, 0.15, 0.3, 0.2, { vib: 30, vibD: 40 }); },
    trombone() { tone('sawtooth', 300, 285, 0.25, 0.25, 0, { filter: 'lowpass', ff: 900 }); tone('sawtooth', 280, 265, 0.25, 0.25, 0.27, { filter: 'lowpass', ff: 900 }); tone('sawtooth', 262, 200, 0.6, 0.25, 0.54, { vib: 5, vibD: 8, filter: 'lowpass', ff: 900 }); },
    scrub() { noise(0.09, 0.25, 0, 'bandpass', 2600 + Math.random() * 1500, 0, 4); },
    sizzle() { noise(0.6, 0.18, 0, 'highpass', 5000); },
    ding() { tone('triangle', 1568, 1568, 0.5, 0.35); tone('sine', 2349, 2349, 0.4, 0.15, 0.02); },
    coin() { tone('square', 1318, 0, 0.06, 0.22); tone('square', 1976, 0, 0.12, 0.2, 0.05); },
    jump() { tone('sine', 380, 760, 0.14, 0.4); },
    longjump() { tone('sine', 320, 900, 0.3, 0.4, 0, { bend: 0.6 }); noise(0.2, 0.15, 0, 'bandpass', 900, 2200); },
    land() { tone('sine', 160, 80, 0.12, 0.45); },
    crouch() { tone('triangle', 420, 240, 0.12, 0.3); },
    bonk() { tone('square', 200, 90, 0.16, 0.3, 0, { filter: 'lowpass', ff: 900 }); noise(0.06, 0.25, 0, 'lowpass', 600); },
    bounce() { tone('sine', 300, 600, 0.09, 0.4); tone('sine', 600, 300, 0.09, 0.3, 0.09); },
    tug() { noise(0.25, 0.25, 0, 'bandpass', 500, 300, 2); tone('sawtooth', 140, 110, 0.25, 0.15, 0, { filter: 'lowpass', ff: 500 }); },
    shake() { for (let i = 0; i < 5; i++) noise(0.06, 0.35, i * 0.07, 'bandpass', 2200 + i * 200, 0, 1.5); },
    rainPat() { for (let i = 0; i < 6; i++) noise(0.02, 0.18, i * 0.05 + Math.random() * 0.03, 'highpass', 3500); },
    snowCrunch() { for (let i = 0; i < 3; i++) noise(0.07, 0.35, i * 0.14, 'bandpass', 900 + Math.random() * 400, 0, 2); },
    honk() { tone('sawtooth', 520, 430, 0.22, 0.35, 0, { filter: 'bandpass', ff: 1300, q: 4, vib: 18, vibD: 30 }); },
    treasure() { [784, 988, 1175, 1568].forEach((f, i) => tone('triangle', f, f, 0.16, 0.3, i * 0.09)); noise(0.3, 0.12, 0.3, 'highpass', 6000); }
  };
})();

/* ---------------- storage ---------------- */
function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { window.localStorage.setItem(k, v); return true; } catch (e) { return false; } }
function lsDel(k) { try { window.localStorage.removeItem(k); } catch (e) { /* storage blocked */ } }
let prefs = { mute: false, motion: null, mapLabels: true, shopOpen: true }; // v2.15: mapLabels (the map captions), shopOpen (a storefront opens its shop window on arrival)
try { prefs = Object.assign(prefs, JSON.parse(lsGet(PREF_KEY) || '{}')); } catch (e) { /* bad prefs */ }
function savePrefs() { lsSet(PREF_KEY, JSON.stringify(prefs)); }
prefs.vol = Object.assign({ master: 80, music: 50, sfx: 80, ambience: 25 }, prefs.vol || {});
if (prefs.vol.ambience === 50 && !prefs.ambTouched) { prefs.vol.ambience = 25; savePrefs(); }
const PAU = () => (window.PawAudio && typeof window.PawAudio === 'object' ? window.PawAudio : null);
function applyAudioPrefs() {
  const v = prefs.vol;
  try { const a = PAU(); if (a) { if (a.setVolumes) a.setVolumes({ master: v.master / 100, music: v.music / 100, sfx: v.sfx / 100, ambience: v.ambience / 100 }); if (a.setMuted) a.setMuted(!!prefs.mute); } } catch (e) { /* audio module error */ }
  SFX.setLevel((v.master / 100) * (v.sfx / 100)); SFX.setMuted(!!prefs.mute);
}
const SFX_MAP = { plant: 'snowCrunch', water: 'rainPat', pluck: 'pop', chop: 'crunch', stir: 'scrub', sizzle: 'sizzle', ding: 'ding', squirrel: 'squeak', jump: 'jump', longjump: 'longjump', land: 'land', crouch: 'crouch', coin: 'coin', bonk: 'bonk', splash: 'splash', dig: 'crunch', treasure: 'treasure', sniff: 'sniff', bark: 'bark', squeak: 'squeak', honk: 'honk', tug: 'tug', bounce: 'bounce', whoosh: 'whoosh', pop: 'pop', nope: 'nope', kaching: 'kaching', levelup: 'fanfare', crunch: 'crunch', slurp: 'slurp', shake: 'shake', 'rain-pat': 'rainPat', 'snow-crunch': 'snowCrunch', click: 'click' };
function sfx(name) { const m = SFX_MAP[name]; if (!m) return; try { if (name === 'bark') SFX.bark(BARK[S && S.dog.key] || 1); else SFX[m](); } catch (e) { /* ignore */ } }
let lastPlace = '';
function modePlace() { const m = cur.mode; if (m === 'adopt') return 'shelter'; if (m === 'routes') return 'map'; if (m === 'yard' && S && S.sleeping) return 'sleep'; if ((m === 'yard' || m === 'market') && S) return S.place || 'yard'; return m || 'title'; }
function audioPlace(place) {
  const a = PAU(); if (!a || typeof a.setContext !== 'function') return;
  const pl = place || modePlace(), e = envNow();
  try { a.setContext({ place: pl, area: cur.mode === 'walk' ? (W && W.area) || cur.arg || null : (cur.mode === 'yard' && S && ROUTE_KEYS.includes(S.place) ? S.place : null), time: e.time, weather: e.weather }); lastPlace = pl; } catch (er) { /* audio module error */ }
}
function audioCue(name) { const a = PAU(); if (!a) return; try { if (a.duck) a.duck(0.4, 1800); if (a.stinger) a.stinger(name); } catch (e) { /* ignore */ } }

/* ---------------- state ---------------- */
function freshState(key, name, sex) {
  const fav = FAV[key] || FAV.mutt;
  const st = {
    v: 1, dog: { key, name, favFood: fav.food.slice(), favToy: fav.toy },
    stats: { hunger: 70, happy: 70, energy: 80, clean: 80 },
    bond: { level: 1, pts: 0 }, coins: 150,
    inv: { food: { 'Basic Kibble': 5, 'Bone-shaped Biscuit': 3, 'Pupcake': 1 }, toys: ['Tennis Ball'], clothes: [], houses: ['Cardboard Box'] },
    outfit: { head: null, eyes: null, neck: null, body: null }, house: 'Cardboard Box',
    tricks: {}, gameMin: 8 * 60, lastReal: Date.now(), waterAt: -999, pupUntil: -1,
    daily: { day: 0, pupcake: false, feed: false, pet: false, play: false, outfit: false },
    sleeping: false, collection: {}, adopted: true,
    found: {}, mapPieces: [], walks: 0, glowUntil: -1, secretDug: false, title: '', place: 'yard'
  };
  st.inv.charms = []; st.outfit.charm = null;
  st.fest = { letters: {}, parade: {}, piles: {}, stall: {} }; st.seasonSeen = {}; st.breedTips = {}; // v2.5
  Object.assign(st.dog, newDogFields(key, sex || 'male', bornDaysAgo(10))); st.kennel = [];
  st.garden = gardenNew(); gkFields(st, false); v131Fields(st);
  if (key === 'mutt') { st.dog.favFood = [PICK(FOOD.slice(1).filter((f) => !f.ed && !f.fest)).n]; st.dog.favToy = PICK(TOYS.filter(t => !t.ed && !t.fest)).n; } // v2.8: festival and edition things are never a favourite
  st.dog.adoptedAt = localISO();
  st.hw = { letter: null, seen: null }; // v2.6 Halloween 2026 pop-up (27_halloween.js)
  st.guide = { step: 0 }; // v2.4: a new save meets Gerald (25_guide.js)
  v27Fields(st); // v2.7 Home & Pack: beds in the house, who naps where, pack care ticks, the shelter playroom (V27.md section 1)
  v28Fields(st); // v2.8 Winter & New Year and Mt. Fuji Lookout (V28.md sections 1 and 12.4)
  v29Fields(st); // v2.9 All Together: photo mode (V29.md section 5)
  v210Fields(st); // v2.10 Free to Roam: ball play (V210.md section 5)
  v211Fields(st); // v2.11 Tokyo Trip: the trip and Dog Cards (V211.md section 5)
  v215Fields(st); st.mapNew.fresh = true; // v2.15 Around Town: agility, the pool, the run tracks, the map stickers (V215.md section 9); fresh: a save that started on v2.15 gets no "new" / "moved" stickers
  v214Fields(st); st.lang = i18nReal(prefs.langPick) ? prefs.langPick : null; // v2.14: a language picked on the title screen before the save existed (V214.md 5)
  return linkDogs(st);
}
let S = null;
let dirty = false;
function markDirty() { dirty = true; }
const ALIAS_KEYS = new Set(['dog', 'stats', 'bond', 'outfit', 'potty', 'sleeping', 'dishLog', 'buff', 'glowUntil', 'pupUntil', 'tricks']);
function saveNow() { if (!S) return; S.lastReal = Date.now(); const root = S; lsSet(SAVE_KEY, JSON.stringify(S, function (k, v) { if (this === root && k === 'activeId' && typeof PKS === 'object' && PKS && PKS.sw && PKS.sw.who === v) return PKS.sw.orig; return this === root && ALIAS_KEYS.has(k) ? undefined : v; })); dirty = false;
  if (typeof clOnSaved === 'function') clOnSaved(); }
function loadSave() { try { const s = JSON.parse(lsGet(SAVE_KEY) || 'null'); return s && (s.dog || (s.dogs && s.dogs.length)) && s.v === 1 ? migrate(s) : null; } catch (e) { return null; }
  finally { if (typeof clOnLoaded === 'function') clOnLoaded(); } }
// v1 -> v1.1: add treasure fields; old collect-10 items are sold to a squirrel for 5 coins each
function migrate(s) {
  if (!s || !s.inv) return s;
  linkDogs(s); // v1.5: S.dogs + live aliases (S.dog, S.stats, ...) of the active dog
  s.inv.charms = s.inv.charms || []; s.found = s.found || {}; s.mapPieces = s.mapPieces || []; s.walks = s.walks || 0;
  if (s.glowUntil == null) s.glowUntil = -1; if (s.title == null) s.title = ''; if (s.outfit && !('charm' in s.outfit)) s.outfit.charm = null;
  const old = Object.values(s.collection || {}).reduce((a, b) => a + (+b || 0), 0);
  if (old > 0) { s.coins += old * 5; s.migNote = old; }
  s.collection = {};
  if (!s.place || !PLACES[s.place]) s.place = 'yard';
  if (s.dog && !s.dog.born) { const f = newDogFields(s.dog.key, s.dog.sex, bornDaysAgo(10)); Object.keys(f).forEach((k) => { if (s.dog[k] === undefined) s.dog[k] = f[k]; }); }
  s.kennel = s.kennel || [];
  if (!s.garden) { s.garden = gardenNew(); gkFields(s, true); if (gkOn()) { s.gkEarly = true; s.gkNote = true; } else { s.seedGiftPending = true; s.inv.seeds = {}; } }
  gkFields(s, true);
  if (s.seedGiftPending && gkOn()) { delete s.seedGiftPending; s.inv.seeds.carrot = (s.inv.seeds.carrot || 0) + 3; s.inv.seeds.peas = (s.inv.seeds.peas || 0) + 3; s.gkEarly = true; s.gkNote = true; }
  v131Fields(s);
  if (!s.fest || typeof s.fest !== 'object') s.fest = {}; s.fest.letters = s.fest.letters || {}; s.fest.parade = s.fest.parade || {}; s.fest.piles = s.fest.piles || {}; s.fest.stall = s.fest.stall || {}; s.seasonSeen = s.seasonSeen || {}; s.breedTips = s.breedTips || {}; // v2.5: festivals and seasons
  if (!s.hw || typeof s.hw !== 'object') s.hw = { letter: null, seen: null }; // v2.6: the Halloween 2026 pop-up letter and first visit
  if (!s.guide || typeof s.guide !== 'object') { s.guide = { step: -1, done: localISO() }; s.guideSeen = true; } // v2.4: saves from before the guide never see the walkthrough, they get a letter
  v27Fields(s); // v2.7 Home & Pack (V27.md section 1): additive, an old save keeps its one bed where it always stood
  v28Fields(s); // v2.8 Winter & New Year, Mt. Fuji Lookout (V28.md section 1): additive
  v29Fields(s); // v2.9 All Together (V29.md section 5): additive
  v210Fields(s); // v2.10 Free to Roam (V210.md section 5): additive
  v211Fields(s); // v2.11 Tokyo Trip (V211.md section 5.1): additive
  v214Fields(s); // v2.14 Hello in Every Language (V214.md section 5): additive
  v215Fields(s); // v2.15 Around Town (V215.md section 9): additive
  return s;
}
/* v2.7 Home & Pack save fields (V27.md section 1). Additive only: S.v stays 1, nothing is dropped.
   S.decor[name].at  optional [x, y] world top-left of a moved decoration or furniture piece (size and room come from HM_DECOR)
   S.bedAt           { bedName: [x, y] } the beds standing in the house (260 x 160 each). An old save gets its one bed at the v2.5 spot
   S.bedOf           { dogId: bedName } who naps on which bed (HOME resolves missing or stale entries)
   S.careOff         { dogId: true } dogs unticked in the pack care chips (PACK CARE). Empty = everyone present gets the care
   S.shelter         { adopted: [ids], seen: ISO | null } the playroom's bookkeeping (SHELTER). The roster itself is seeded by date, never saved */
function v27Fields(s) {
  if (!s) return s;
  if (!s.bedAt || typeof s.bedAt !== 'object' || Array.isArray(s.bedAt)) { s.bedAt = {}; s.bedAt[s.bed || 'Old Blanket'] = [610, 360]; } // [610, 360] = BED_BOX x, y (12_popups)
  if (!s.bedOf || typeof s.bedOf !== 'object' || Array.isArray(s.bedOf)) s.bedOf = {};
  if (!s.careOff || typeof s.careOff !== 'object' || Array.isArray(s.careOff)) s.careOff = {};
  if (!s.shelter || typeof s.shelter !== 'object') s.shelter = { adopted: [], seen: null };
  if (!Array.isArray(s.shelter.adopted)) s.shelter.adopted = []; if (s.shelter.seen === undefined) s.shelter.seen = null;
  return s;
}
/* v2.8 Winter & New Year save fields (V28.md sections 1 and 12.4). Additive only: S.v stays 1, nothing is dropped. Readers default too.
   S.wn  (WINTER)    { letters: { snow?, gift?, contest?: winterYear }, drifts: { [i]: gameMin of the last dive },
                       snowdog: { date: localISO of its snow | null, stage: 0-3, by: dog id | null, nose: bool }, contest: { date?, year? }, tips: { salt?, cold?: winterYear } }
   S.ny  (NEW YEAR)  { cards: nyYear the cards were sent | null, fortune: { date: localISO | null, year: nyYear | null, knots: 0-12 } }
   S.jp  (FUJI HILL) { letter, gazed, first, mochi } (null until set: the letter's date, the last look's localISO, the nyYear of the first Fuji, the nyYear of the mochi tip) */
const v28Obj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
function v28Fields(s) {
  if (!s) return s;
  if (!v28Obj(s.wn)) s.wn = {};
  ['letters', 'drifts', 'contest', 'tips'].forEach((k) => { if (!v28Obj(s.wn[k])) s.wn[k] = {}; });
  if (!v28Obj(s.wn.snowdog)) s.wn.snowdog = {};
  const sd = s.wn.snowdog; if (sd.date === undefined) sd.date = null; if (typeof sd.stage !== 'number') sd.stage = 0; if (sd.by === undefined) sd.by = null; if (typeof sd.nose !== 'boolean') sd.nose = true;
  if (!v28Obj(s.ny)) s.ny = {}; if (s.ny.cards === undefined) s.ny.cards = null;
  if (!v28Obj(s.ny.fortune)) s.ny.fortune = {};
  const fo = s.ny.fortune; if (fo.date === undefined) fo.date = null; if (fo.year === undefined) fo.year = null; if (typeof fo.knots !== 'number') fo.knots = 0;
  if (!v28Obj(s.jp)) s.jp = {}; ['letter', 'gazed', 'first', 'mochi'].forEach((k) => { if (s.jp[k] === undefined) s.jp[k] = null; });
  return s;
}
// v2.9 (V29.md section 5): S.ph = { n: photos taken (the journal line), first: localISO() of the first photo, or null (Gerald's line) }. Photos themselves are never saved
function v29Fields(s) {
  if (!s) return s;
  if (!v28Obj(s.ph)) s.ph = {}; if (typeof s.ph.n !== 'number' || !(s.ph.n >= 0)) s.ph.n = 0; if (s.ph.first === undefined) s.ph.first = null;
  return s;
}
// v2.10 (V210.md section 5): S.bl = { day: localISO() of the coin count, coins: ball-play coins that day, n: balls brought back, all time }
function v210Fields(s) {
  if (!s) return s;
  if (!v28Obj(s.bl)) s.bl = {}; if (s.bl.day === undefined) s.bl.day = null; ['coins', 'n'].forEach((k) => { if (typeof s.bl[k] !== 'number' || !(s.bl[k] >= 0)) s.bl[k] = 0; });
  return s;
}
function v211Fields(s) {
  // V211.md section 5.1. S.tk: the Tokyo trip (TRAVEL), S.dc: the Dog Cards settings and paws given (CARDS)
  if (!s) return s;
  if (!v28Obj(s.tk)) s.tk = {}; ['day', 'hachi', 'omi', 'snack', 'hanami', 'sunset'].forEach((k) => { if (s.tk[k] === undefined) s.tk[k] = null; });
  if (typeof s.tk.rides !== 'number' || !(s.tk.rides >= 0)) s.tk.rides = 0;
  ['stamps', 'seen'].forEach((k) => { if (!v28Obj(s.tk[k])) s.tk[k] = {}; }); if (typeof s.tk.frame !== 'boolean') s.tk.frame = false;
  if (!v28Obj(s.dc)) s.dc = {}; if (typeof s.dc.on !== 'boolean') s.dc.on = false; if (s.dc.name === undefined) s.dc.name = null;
  if (!Array.isArray(s.dc.dogs)) s.dc.dogs = []; if (!Array.isArray(s.dc.hide)) s.dc.hide = []; if (!v28Obj(s.dc.given)) s.dc.given = {};
  if (typeof s.dc.got !== 'number' || !(s.dc.got >= 0)) s.dc.got = 0; if (s.dc.uid === undefined) s.dc.uid = null; // v2.11 CARDS review: the account that switched the card on
  return s;
}
// v2.14 (V214.md 5): S.lang = one of PawI18nMsg.CODES, or null = follow the device (old saves load with null). It goes with the cloud save.
// v2.15 (owner): S.langShown = the language actually on screen (a CODE, never a pseudo-locale), or null before any boot recorded it; set on load and by i18nUse, read by the owner's dashboard as COALESCE(lang, langShown).
function v214Fields(s) {
  if (!s) return s;
  if (s.lang === undefined || (s.lang !== null && !i18nReal(s.lang))) s.lang = null;
  if (s.langShown === undefined || (s.langShown !== null && !i18nReal(s.langShown))) s.langShown = null; // v2.15 (owner): the language on screen
  if (!I18N.ps && i18nReal(I18N.lang)) s.langShown = I18N.lang; // a loaded save records the language this boot settled on (pseudo-locales never)
  return s;
}
/* v2.15 Around Town (V215.md section 9). Additive only: S.v stays 1, nothing is dropped.
   S.ag      { day: localISO of the counts, runs, coins: agility coins that day, best: { dogId: rosettes 1-3 }, seen: first visit note }  (ACTIVITIES, 44_agility.js)
   S.pool    { day: { dogId: localISO of the last paddle }, vest: the Doggy Life Vest given, seen: first visit lesson }                  (ACTIVITIES, 45_pool.js)
   S.trk     { seen: { routeKey: true } } the first-run care notes of the three new tracks                                              (ACTIVITIES, 46_tracks.js)
   S.mapNew  { since: localISO of the first v2.15 load, seen: [place keys], fresh: true on a save started on v2.15 (no stickers) }
             the "new" / "moved" map stickers for 7 real days                                                                        (MAP, 42_map215.js) */
function v215Fields(s) {
  if (!s) return s;
  const num = (o, k) => { if (typeof o[k] !== 'number' || !(o[k] >= 0)) o[k] = 0; };
  if (!v28Obj(s.ag)) s.ag = {}; if (typeof s.ag.day !== 'string') s.ag.day = ''; num(s.ag, 'runs'); num(s.ag, 'coins'); if (!v28Obj(s.ag.best)) s.ag.best = {}; if (typeof s.ag.seen !== 'boolean') s.ag.seen = false;
  if (!v28Obj(s.pool)) s.pool = {}; if (!v28Obj(s.pool.day)) s.pool.day = {}; ['vest', 'seen'].forEach((k) => { if (typeof s.pool[k] !== 'boolean') s.pool[k] = false; });
  if (!v28Obj(s.trk)) s.trk = {}; if (!v28Obj(s.trk.seen)) s.trk.seen = {};
  if (!v28Obj(s.mapNew)) s.mapNew = {}; if (typeof s.mapNew.since !== 'string' || !s.mapNew.since) s.mapNew.since = localISO(); if (!Array.isArray(s.mapNew.seen)) s.mapNew.seen = [];
  return s;
}
function migNote() { if (S && S.gkNote) { delete S.gkNote; markDirty(); setTimeout(() => toast(tt('core.seed_gift', 'Pip left a packet of seeds on your doorstep. The veggie patch is yours now!'), 'gold'), 2200); }
  if (S && !S.dog.sex) setTimeout(askSex, 600);
  if (S && S.migNote) { const n = S.migNote; delete S.migNote; markDirty(); setTimeout(() => toast(tt('core.squirrel_bought', 'Your {n} old leaves, shells and acorns were bought by a very enthusiastic squirrel: +{coins, plural, one {# coin} other {# coins}}.', { n, coins: n * 5 }), 'gold'), 1200); } }

/* ---------------- DOM refs ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const stage = $('#stage'), hud = $('#hud'), view = $('#view'), dock = $('#dock'), bar = $('#bar'), titleEl = $('#title'), modal = $('#modal'), bubble = $('#bubble'), toasts = $('#toasts'), devPanel = $('#devPanel');

/* ---------------- helpers: names, time, weather ---------------- */
const NAME = () => (S ? S.dog.name : tt('shell.dog', 'Dog'));
const day = () => Math.floor(S.gameMin / 1440) + 1;
function clock() { const m = Math.floor(S.gameMin % 1440); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
/* ---- v1.2 real time + weather: clock = device time; weather seeded by date, 3 periods a day ---- */
const ENV = { time: prefs.ovrTime || 'auto', weather: prefs.ovrWeather || 'auto', season: prefs.ovrSeason || 'auto', fest: prefs.ovrFest || 'auto' }; // v2.5: season and festival overrides
/* ---- v2.5 seasons on the real calendar (northern hemisphere) and the festival windows. See V25.md section 1 ---- */
const monthNow = () => new Date().getMonth() + 1;
const seasonOf = (m) => ([12, 1, 2].includes(m) ? 'winter' : m <= 5 ? 'spring' : m <= 8 ? 'summer' : 'autumn');
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
function seasonNow() { return SEASONS.includes(ENV.season) ? ENV.season : seasonOf(monthNow()); }
/* v2.6: Halloween runs by the JST date. HW_WIN holds the years whose window differs from the default (24-31 Oct), HW_ED is the edition the pop-up sells. See V26.md section 1 */
const HW_ED = 2026;
const HW_WIN = { 2026: ['2026-10-08', '2026-11-02'] };
const jstISO = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
function hwAuto() {
  const j = jstISO(), w = HW_WIN[+j.slice(0, 4)];
  if (w) return j >= w[0] && j <= w[1];
  return +j.slice(5, 7) === 10 && +j.slice(8, 10) >= 24;
}
/* v2.8 Winter & New Year by the JST date (V28.md section 1). Under the test harness (navigator.webdriver) the winter flags never turn on
   by date unless the suite sets prefs.wnTest (v2.5 suites run fest 'auto' on December dates). A Dev panel override works everywhere. */
const wnAllowed = () => !navigator.webdriver || !!prefs.wnTest;
function wnAuto(j = jstISO()) {
  if (!wnAllowed()) return { snow: false, lights: false, newyear: false };
  const md = String(j).slice(5, 10);
  return { snow: md >= '12-01' || md <= '02-29', lights: md >= '12-01' && md <= '12-25', newyear: md >= '12-26' || md <= '01-07' };
}
// the winter year: the JST year, minus 1 in January and February (letters, the rosette, the tips)
function wnYear(j = jstISO()) { const y = +String(j).slice(0, 4), m = +String(j).slice(5, 7); return m <= 2 ? y - 1 : y; }
// the New Year: the JST year in January, the year + 1 in December (cards, knots); the JST year otherwise
function nyYear(j = jstISO()) { const y = +String(j).slice(0, 4), m = +String(j).slice(5, 7); return m === 12 ? y + 1 : y; }
// override values: off, leaf, halloween, both (the v2.5 ones, winter flags off), snow (snow only), winter (snow + lights), newyear (snow + newyear)
const FEST_OVR = { off: [0, 0, 0, 0, 0], leaf: [1, 0, 0, 0, 0], halloween: [0, 1, 0, 0, 0], both: [1, 1, 0, 0, 0], snow: [0, 0, 1, 0, 0], winter: [0, 0, 1, 1, 0], newyear: [0, 0, 1, 0, 1] };
function festNow() {
  const o = Object.prototype.hasOwnProperty.call(FEST_OVR, ENV.fest) && FEST_OVR[ENV.fest]; if (o) return { leaf: !!o[0], halloween: !!o[1], snow: !!o[2], lights: !!o[3], newyear: !!o[4] };
  const j = jstISO(), m = +j.slice(5, 7); return Object.assign({ leaf: m === 10 || m === 11, halloween: hwAuto() }, wnAuto(j)); // leaf by the JST month too, so it never overlaps the snow
}
const festOn = (n) => !!festNow()[n];
// New Year cards and the Fortune box: 1 to 7 January (JST), or any day with the Dev panel's newyear override
function nyDays() { const md = jstISO().slice(5); return festOn('newyear') && (ENV.fest === 'newyear' || (md >= '01-01' && md <= '01-07')); }
// the year-end clean mission: 26 to 31 December (JST)
function nyEve() { const md = jstISO().slice(5); return festOn('newyear') && md >= '12-26' && md <= '12-31'; }
/* v2.8 Japan scenery (V28.md section 12.1): env.jp is on in the game, off under the test harness unless the suite sets prefs.jpTest */
function jpOn() { return !navigator.webdriver || !!prefs.jpTest; }
/* v2.15 "Around Town" switches (V215.md 2, 5, 8.3; the stubs lane, section 13b).
   mpOn()         the v2.15 map and the eight new places are on: in the game always, under the test harness only with prefs.mpTest. Off = v2.14 exactly
                  (the old map, Market Street with its four shops, the old routes; the new places are not in PLACES, so nothing lists or reaches them)
   grOn(place)    the place has a v2.15 floor (PawArt.FLOOR[place], drawn under o.v215) and mpOn(); under the harness also prefs.grTest.
                  Never for a Tokyo place (V215.md 17, decision 1). No place = S.place
   MP_PLACES      the PLACES rows of the new keys, added by mpPlaceSync() while mpOn() (as jpPlaceSync / tkPlaceSync do). shop: the openShop key of a
                  storefront, run: a run-track place (its gate starts go('walk', k), 46_tracks.js)
   mpPlaceName(k) the shown name of a v2.15 place (and of market, "Kibble Corner") while mpOn(), else null: placeName / townPlaceName / tPlace use it first */
function mpOn() { return !navigator.webdriver || !!prefs.mpTest; }
const GR_NO = ['shibuya', 'hachiko', 'yoyogi', 'asakusa', 'tokyotower', 'ueno', 'odaiba', 'station', 'shelter']; // Tokyo keeps the v2.10 floor in v2.15
function grOn(place) {
  const k = place === undefined ? (S && S.place) : place; if (!k || GR_NO.includes(k) || (PLACES[k] && PLACES[k].tokyo)) return false;
  if (!mpOn() || (navigator.webdriver && !prefs.grTest)) return false;
  const F = window.PawArt && PawArt.FLOOR; return !!(F && typeof F === 'object' && F[k]);
}
const MP_PLACES = {
  boutique: { n: 'Bow-Wow Boutique', bond: 1, out: true, shop: 'boutique' }, builder: { n: 'Barkitecture', bond: 1, out: true, shop: 'builder' },
  sprout: { n: "Pip's Sprout Cart", bond: 1, out: true, shop: 'sprout' }, training: { n: 'Training Ground', bond: 3, out: true },
  pool: { n: 'Splash Pool', bond: 2, out: true }, sunflower: { n: 'Sunflower Lanes', bond: 2, out: true, run: true },
  bamboo: { n: 'Bamboo Grove Trail', bond: 4, out: true, run: true }, cliffs: { n: 'Seaside Cliffs Run', bond: 7, out: true, run: true }
};
const MP_KEYS = Object.keys(MP_PLACES);
// adds or removes the new rows; call it again after changing prefs.mpTest at run time (a save standing in a new place goes home when it is off)
function mpPlaceSync() {
  const on = mpOn();
  MP_KEYS.forEach((k) => { if (on) { if (!PLACES[k]) PLACES[k] = Object.assign({ v215: true }, MP_PLACES[k]); } else delete PLACES[k]; });
  if (PLACES.market) { PLACES.market.n = on ? 'Kibble Corner' : 'Market Street'; if (on) PLACES.market.shop = 'kibble'; else delete PLACES.market.shop; }
  if (S && MP_KEYS.includes(S.place) && !PLACES[S.place]) S.place = 'yard';
  try { trSync(); } catch (e) { /* 46_tracks.js is not loaded yet at the first call (it runs again at its end) */ }
  return on;
}
mpPlaceSync();
function mpPlaceName(k) {
  if (!mpOn() || !PLACES[k]) return null;
  switch (k) {
    case 'market': return tdata('shop_name.kibble', 'Kibble Corner'); // the storefronts share their shop's name (already in every language)
    case 'boutique': return tdata('shop_name.boutique', 'Bow-Wow Boutique');
    case 'builder': return tdata('shop_name.builder', 'Barkitecture');
    case 'sprout': return tdata('shop_name.sprout', "Pip's Sprout Cart");
    case 'training': return tt('map215.place_training', 'Training Ground');
    case 'pool': return tt('map215.place_pool', 'Splash Pool');
    case 'sunflower': return tt('map215.place_sunflower', 'Sunflower Lanes');
    case 'bamboo': return tt('map215.place_bamboo', 'Bamboo Grove Trail');
    case 'cliffs': return tt('map215.place_cliffs', 'Seaside Cliffs Run');
    default: return null;
  }
}
function hwShopOpen() { const j = jstISO(), w = HW_WIN[HW_ED]; return festOn('halloween') && j >= w[0] && j <= w[1]; } // a Dev panel override outside the dates never reopens the pop-up
function timePhase() { if (ENV.time !== 'auto') return ENV.time; const h = new Date().getHours(); return h >= 5 && h < 7 ? 'dawn' : h >= 7 && h < 17 ? 'day' : h >= 17 && h < 19 ? 'dusk' : 'night'; }
function weatherPeriodKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${Math.floor(d.getHours() / 8)}`; }
function weatherNow() {
  if (ENV.weather !== 'auto') return ENV.weather;
  const d = new Date(), per = Math.floor(d.getHours() / 8);
  const r = seeded((d.getFullYear() * 400 + (d.getMonth() + 1) * 32 + d.getDate()) * 7 + per * 131 + 17)();
  const winter = [11, 0, 1].includes(d.getMonth());
  return r < 0.45 ? 'sunny' : r < 0.70 ? 'cloudy' : r < 0.95 ? 'rain' : winter ? 'snow' : 'rain';
}
const weather = weatherNow;
const envNow = () => { const f = festNow(); return { time: timePhase(), weather: weatherNow(), season: seasonNow(), halloween: f.halloween, lights: f.lights, newyear: f.newyear, jp: jpOn() }; }; // v2.8: lights, newyear, jp
const isNight = () => timePhase() === 'night';
function isHot() { if (S && S.buff && typeof buffOn === 'function' && buffOn('cool')) return false; if (S && (S.outfit.head === 'Sun Hat' || S.outfit.head === 'Sailor Cap' || (S.coolUntil || -1) > S.gameMin)) return false; if (weatherNow() !== 'sunny' || timePhase() !== 'day') return false; if (ENV.time !== 'auto') return true; const h = new Date().getHours(); return h >= 11 && h < 15; }
function clockText() {
  if (tlang() !== 'en') { const d = new Date(); if (ENV.time !== 'auto') d.setHours({ dawn: 6, day: 13, dusk: 18, night: 23 }[ENV.time], 0, 0, 0); return tdate(d, { hour: 'numeric', minute: '2-digit' }) + (ENV.time !== 'auto' ? '*' : ''); } // v2.14: 12 or 24 h per language (V214.md 8)
  if (ENV.time !== 'auto') return { dawn: '06:00', day: '13:00', dusk: '18:00', night: '23:00' }[ENV.time] + '*'; const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
const WEATHER_TXT = { sunny: 'Sunny', cloudy: 'Cloudy', rain: 'Rain', snow: 'Snow' };
const wxLabel = () => (weatherNow() === 'sunny' && isNight() ? tt('core.clear_night', 'Clear night') : tdata('weather_txt.' + weatherNow(), WEATHER_TXT[weatherNow()]));
function wxIconName() { const w = weatherNow(), t = timePhase(); if (w === 'rain' || w === 'snow' || w === 'cloudy') return 'w-' + w; return t === 'night' ? 'w-night' : t === 'dawn' ? 'w-dawn' : t === 'dusk' ? 'w-dusk' : 'w-sunny'; }
const RAINCOATS = ['Yellow Raincoat', 'Polka-dot Raincoat', 'Frog Raincoat', 'Bubble Raincoat'];
const hasRaincoat = () => RAINCOATS.includes(S.outfit.body);
const hasRainHat = () => S.outfit.head === 'Rain Hat' || S.outfit.head === 'Astronaut Helmet';
const WARM_WEAR = ['Pom-pom Beanie', 'Knit Winter Sweater', 'Cozy Hoodie', 'Knit Scarf', 'Astronaut Helmet', 'Leaf Beret', 'Autumn Scarf', 'Very Ugly Sweater', 'Snowflake Snood', 'Year of the Sheep Hood']; // v2.4: three new warm things; v2.5: the leaf festival pair; v2.8: the winter three
const isWarm = () => SLOTS.some((k) => WARM_WEAR.includes(S.outfit[k])) || (typeof buffOn === 'function' && buffOn('warm')) || (S.warmUntil || -1) > S.gameMin; // v2.5: Warm Bone Broth
const houseInfo = (n) => HOUSES.find((h) => h.n === (n || S.house)) || HOUSES[0];
const owns = (cat, n) => S.inv[cat].includes(n);
const glowing = () => (S.gameMin < (S.glowUntil || -1)) || (S.stats.hunger > 80 && S.stats.happy > 80 && S.stats.energy > 80 && S.stats.clean > 80);
const dogOutfit = () => ({ head: S.outfit.head, eyes: S.outfit.eyes, neck: S.outfit.neck, body: S.outfit.body });
const wearing = (n) => SLOTS.some((k) => S.outfit[k] === n) || S.outfit.charm === n;
const tInfo = (n) => TREASURES.find((t) => t.n === n);
/* ---- v2.14 display text of the core tables (V214.md 4.3). The English names stay the data, the keys and the save values; only what is shown
   is looked up. tItem(n, field): any shop, treasure or bed item by its English name; field 'n' (the name, default) or the row's text
   field (FOOD note / tip, TFOOD note, TOYS note, CLOTHES perk, HOUSES note, BEDS note, TREASURES ab / txt). An unknown name comes back as it is. ---- */
let tItemIx = null;
function tItemRow(n) {
  if (!tItemIx) {
    tItemIx = new Map(); const add = (tab, rows) => rows.forEach((r) => { if (r && r.n && !tItemIx.has(r.n)) tItemIx.set(r.n, [tab, r]); });
    add('food', FOOD); add('tfood', TFOOD); add('toys', TOYS); add('clothes', CLOTHES); add('houses', HOUSES); add('treasures', TREASURES);
    if (typeof BEDS !== 'undefined' && Array.isArray(BEDS)) add('beds', BEDS);
  }
  return tItemIx.get(n) || null;
}
function tItem(n, field = 'n') {
  if (n == null) return '';
  const hit = tItemRow(n); if (!hit) return field === 'n' ? String(n) : '';
  const [tab, r] = hit, en = r[field]; if (en == null || en === '') return '';
  return tdata(tab + '.' + tid(r.n) + '.' + field, en); // treasures: TR(n, kind, slot, r, routes, ab, txt) rows are keyed by the parameter names
}
// a wearable's or charm's perk line: the clothes `perk`, or a treasure's "Ability: what it does"
function tPerk(n) { const hit = tItemRow(n); if (hit && hit[0] === 'treasures') return tt('core.treasure_perk', '{ability}: {text}', { ability: tItem(n, 'ab'), text: tItem(n, 'txt') }); return tItem(n, 'perk'); }
const tPlace = (k) => mpPlaceName(k) || (PLACES[k] ? tdata('places.' + k + '.n', PLACES[k].n) : String(k));
const tRoute = (k) => (ROUTES[k] ? tdata('routes.' + k + '.n', ROUTES[k].n) : String(k));
const tTrick = (n) => tdata('tricks.' + tid(n) + '.n', n);
const tSig = (key, field = 'n') => (SIG[key] ? tdata('sig.' + key + '.' + field, SIG[key][field]) : tdata('sig_fb.' + field, SIG_FB[field])); // the dog's signature trick name or line
const tRarity = (i) => tdata('rarity.' + i, RARITY[i]);
const tSlot = (k) => tdata('slot_name.' + k, SLOT_NAME[k] || k);
function hasTreasure(t) { if (t.kind === 'wearable') return owns('clothes', t.n); if (t.kind === 'toy') return owns('toys', t.n); if (t.kind === 'charm') return S.inv.charms.includes(t.n); if (t.kind === 'quest') return S.mapPieces.includes(t.piece); return false; }
const isUnique = (t) => t.kind !== 'food';
const PLACEHOLDER_RE = /<text[^>]*>\s*\?\s*<\/text>/;
// art call that returns '' when the module is missing the asset (or answers with its '?' placeholder)
function artReal(fn, ...a) { try { const f = PA()[fn]; if (typeof f !== 'function') return ''; const v = f.apply(PA(), a); return typeof v === 'string' && v.includes('<svg') && !PLACEHOLDER_RE.test(v) ? v : ''; } catch (e) { return ''; } }
function iconOr(n, fallbackDoodle) { return artReal('icon', n) || `<svg viewBox="-20 -20 40 40">${fallbackDoodle}</svg>`; }
const isFavFood = (n) => S.dog.favFood.includes(n);
const favAct = (a) => (FAV[S.dog.key] || {}).act === a;

/* ---------------- toasts, bubbles ---------------- */
// v2.3 phone: toasts start just under the location chip (top-left of the scene), never on it
function phChipClear() { if (!isPhone()) return 0; const st = $('#status'); return st && !st.hidden && st.offsetParent === view ? st.offsetTop + st.offsetHeight + 4 - 8 : 0; }
// toast(text, kind, o): o.group + o.many(n) (phones): a toast of the same group still on screen is replaced by one note with a count ("3 new letters").
// Phones also re-place live toasts when a sheet opens, closes or changes height (toastPlace): above the sheet when there is room, else under its tabs
// or its title, never on them. Returns the toast element.
const TOAST_MS = 2900;
function toast(text, kind = '', o = {}) {
  let n = 1;
  if (o.group && isPhone()) { const same = [...toasts.children].find((e) => e.dataset.group === o.group); if (same) { n = (+same.dataset.n || 1) + 1; same.remove(); if (o.many) text = o.many(n); } }
  const t = document.createElement('div'); t.className = 'toast ' + kind + (n > 1 ? ' tmerge' : ''); t.textContent = text; // tmerge: a count update bumps, it does not fade in again
  if (o.group) { t.dataset.group = o.group; t.dataset.n = n; }
  toasts.appendChild(t);
  while (toasts.children.length > 3) toasts.firstChild.remove();
  toastPlace();
  setTimeout(() => t.remove(), TOAST_MS);
  return t;
}
function toastPlace() {
  const ph = isPhone(), modScr = stage.classList.contains('modhud') || (ph && cur.mode === 'toy'); // v2.4: in a toy game on a phone, toasts sit under the strip, not on its title bar
  toasts.style.top = modScr ? 'auto' : (hud.hidden ? 10 : view.offsetTop + 8 + phChipClear()) + 'px'; toasts.style.bottom = modScr ? '18px' : ''; toasts.style.flexDirection = modScr ? 'column-reverse' : '';
  if (!ph) return;
  // v2.7 phone review: in the shelter playroom the toasts sit low, just above the tray, so they never cover the "Doodle Doggo Shelter" sign or the Adopt me board
  const low = cur.mode === 'shelter' && modal.hidden && dock.firstElementChild;
  if (low) { let y = 0; for (let e = low; e && e !== stage; e = e.offsetParent) y += e.offsetTop; toasts.style.top = 'auto'; toasts.style.bottom = Math.max(8, stage.clientHeight - y + 8) + 'px'; }
  stage.classList.toggle('toast-map', cur.mode === 'map'); // the map's zoom and close buttons stay clear (20_phone_shell.css)
  if (!modal.hidden) toasts.style.setProperty('--toastTop', toastSheetTop() + 'px');
}
// stage y for the toast column while a sheet is open. Layout boxes (offsetTop), so the sheet's slide-in transform doesn't move the answer.
function toastSheetTop() {
  const pn = modal.querySelector('.panel'); if (!pn) return 6;
  let top = 0; for (let e = pn; e && e !== stage; e = e.offsetParent) top += e.offsetTop;
  const safe = Math.max(0, (parseFloat(getComputedStyle(hud).paddingTop) || 4) - 4), h = toasts.offsetHeight; // the HUD's top padding is 4 px + the safe area
  if (h && top - 8 - h >= safe + 6) return Math.round(top - 8 - h); // room above the sheet (over the dimmed HUD): the sheet stays fully clear
  const pr = pn.getBoundingClientRect(), lim = pr.top + Math.min(pr.height * 0.45, 260);
  const tabs = [...pn.querySelectorAll('.tabs, .jtabs, .mbtabs, [role=tablist]')].find((e) => { const r = e.getBoundingClientRect(); return r.height > 0 && r.top < lim; });
  const anchor = tabs || pn.querySelector(':scope > h2');
  return Math.round(top + (anchor ? anchor.getBoundingClientRect().bottom - pr.top : 0) + 6); // under the tabs (or the title), never on them
}
let toastRO = null;
function toastWatchSheet(p) { // phones: live toasts follow the sheet as it slides in, grows or shrinks
  if (toastRO) toastRO.disconnect(); toastRO = null; if (!p || !isPhone()) return;
  if (typeof ResizeObserver === 'function') { toastRO = new ResizeObserver(() => { if (toasts.children.length) toastPlace(); }); toastRO.observe(p); }
  toastPlace(); setTimeout(() => { if (!modal.hidden) toastPlace(); }, 320);
}
let bubbleTimer = 0;
function worldToStage(svg, x, y) {
  try { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const p = pt.matrixTransform(svg.getScreenCTM()); const r = stage.getBoundingClientRect(); return { x: p.x - r.left, y: p.y - r.top }; } catch (e) { return { x: 100, y: 100 }; }
}
function toWorld(svg, cx, cy) { const pt = svg.createSVGPoint(); pt.x = cx; pt.y = cy; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
// v2.14.1 (owner: "the speech bubble of the dog will cover their face"): the bubble sits above the speaking dog's drawn head, its tail pointing at it.
// The bubble art keeps its tail in the bottom of the box, so the box's bottom edge (the tail tip) goes at the head's top; a taller box (CJK / Thai,
// 50_i18n.css) grows upward, never down over the dog. No room above: beside the head; never on the face while any spot is clear of it.
// sayDogRect(p): the drawn box (stage px) of the svg.pa-dog in the scene nearest the anchor p (the speaking dog's head point), or null
function sayDogRect(p) {
  const sg = stage.getBoundingClientRect(); let best = null, bd = 1e9;
  view.querySelectorAll('svg.pa-dog').forEach((s) => {
    const g = s.firstElementChild, q = g && g.getBoundingClientRect(); if (!q || q.width < 4 || q.height < 4) return;
    const r = { l: q.left - sg.left, t: q.top - sg.top, r: q.right - sg.left, b: q.bottom - sg.top };
    if (p.x < r.l - 40 || p.x > r.r + 40 || p.y < r.t - 160 || p.y > r.b) return;
    const d = Math.abs(p.y - r.t) + 2 * Math.max(0, r.l - p.x, p.x - r.r) + 0.2 * Math.abs(p.x - (r.l + r.r) / 2);
    if (d < bd) { bd = d; best = r; r.face = sayFace(s); }
  });
  return best;
}
// the way a drawn dog faces on screen: the art faces right unless mirrored (by its facing or by the scene), so the sign of a stroke's screen matrix says it
function sayFace(s) { const q = s && s.querySelector('.pa-d-f0 path, path'); try { return q && q.getScreenCTM().a < 0 ? 'l' : 'r'; } catch (e) { return null; } }
// the head's box (stage px): the top of the dog on the side it faces; with no drawn dog, the anchor is the head's top
function sayHeadRect(p, D) {
  if (!D) return { l: p.x - 30, r: p.x + 30, t: p.y - 2, b: p.y + 50 };
  const w = D.r - D.l, h = D.b - D.t, rt = D.face ? D.face === 'r' : p.x >= (D.l + D.r) / 2;
  return { l: rt ? D.l + w * 0.35 : D.l, r: rt ? D.r : D.r - w * 0.35, t: D.t, b: D.t + h * 0.55 };
}
let sayLast = null; // the last placement (anchor, dog box, head box, in stage px), for the tests (__paw.bubbleLast)
const SAY_TIP = 0.07; // the tail tip's x in the speech art (14 of 200), from the box's left edge; tail-r mirrors it
function sayPlace(p, o) {
  const sg = stage.getBoundingClientRect(), sw = stage.clientWidth, sh = stage.clientHeight, vtop = view.offsetTop;
  const D = o.dog || sayDogRect(p), H = sayHeadRect(p, D), hx = (H.l + H.r) / 2, ax = p.x >= H.l && p.x <= H.r ? p.x : hx; // ax: the anchor's x, or the head's when the anchor is off it
  sayLast = { p: { x: Math.round(p.x), y: Math.round(p.y) }, D, H }; if (window.__paw) window.__paw.bubbleLast = sayLast;
  const rel = (q) => ({ l: q.left - sg.left, t: q.top - sg.top, r: q.right - sg.left, b: q.bottom - sg.top });
  const soft = (o.avoid || []).slice(), hard = [], vis = (el) => el && !el.hidden && el.offsetParent !== null && el.getBoundingClientRect().height > 0; // hard: kept clear on every try (v2.14.1)
  if (isPhone()) { const st = $('#status'); if (vis(st)) { const r = rel(st.getBoundingClientRect()); hard.push({ l: r.l - 6, t: r.t, r: r.r + 6, b: r.b + 6 }); } // v2.3: never on the location chip
    const pk = $('#phPeek'); if (vis(pk)) { const r = rel(pk.getBoundingClientRect()); hard.push({ l: r.l - 8, t: r.t - 4, r: r.r + 8, b: r.b + 4 }); } } // UI/UX H9: nor under the look-right button
  const tr = $('#dock .tray'); if (vis(tr) && getComputedStyle(dock).display !== 'none') soft.push(rel(tr.getBoundingClientRect()));
  const hit = (b, r) => b.l < r.r && b.l + b.w > r.l && b.t < r.b && b.t + b.h > r.t;
  const ok = (b, useSoft) => b && b.t >= vtop + 4 && b.t + b.h <= sh - 4 && !hit(b, H) && !(D && hit(b, { l: D.l + 6, t: D.t + 4, r: D.r - 6, b: D.b }) && b.cls !== 'h') && !hard.some((r) => hit(b, r)) && !(useSoft && soft.some((r) => hit(b, r)));
  // put the box at (l, t) with a max width, kept on screen (it re-wraps when it moves, so it is measured again at the width it has: v2.8 / v2.10)
  const put = (l, t, mw, tail) => {
    bubble.classList.toggle('tail-r', tail === 'r'); bubble.style.maxWidth = mw ? Math.round(mw) + 'px' : ''; bubble.style.left = Math.round(l) + 'px'; bubble.style.top = Math.round(t) + 'px';
    let w = bubble.offsetWidth; if (l + w > sw - 6) { bubble.style.maxWidth = w + 'px'; l = Math.max(6, sw - 6 - w); bubble.style.left = Math.round(l) + 'px'; w = bubble.offsetWidth; }
    return { l: Math.round(l), t: Math.round(t), w, h: bubble.offsetHeight, mw: bubble.style.maxWidth, tail };
  };
  const tipX = (b) => b.l + (b.tail === 'r' ? 1 - SAY_TIP : SAY_TIP) * b.w;
  const again = (b, t) => put(b.l, t, b.mw ? parseFloat(b.mw) : 0, b.tail); // the same box at another height
  // over the head: the bottom edge (the tail tip) at the head's top, or where it always was when that is higher (English stays where it was fine)
  const above = (mw) => {
    const bot = Math.min(p.y - 16, H.t - 4); let b = put(6, 0, mw); const w = b.w;
    b = put(clamp(ax - 40, 6, sw - w - 6), 0, mw); b = again(b, bot - b.h); b = again(b, bot - b.h); // (the second time at its re-wrapped height)
    if (Math.abs(tipX(b) - hx) > (H.r - H.l) / 2 + 24) { // the tail would point past the head (a wide box slid to an edge): the tail on the other side, if that points closer
      let r = put(clamp(hx - (1 - SAY_TIP) * w, 6, sw - w - 6), 0, mw, 'r'); r = again(r, bot - r.h); r = again(r, bot - r.h);
      b = Math.abs(tipX(r) - hx) < Math.abs(tipX(b) - hx) ? r : again(b, b.t); }
    return b;
  };
  // beside: the box's bottom corner by the head's middle, its tail pointing in at the head; side 'r' = right of x, 'l' = left of x
  const beside = (x, side, cls) => {
    const mw = side === 'r' ? sw - 6 - x : x - 6; if (mw < 170) return null;
    const tail = side === 'r' ? null : 'r', bot = H.t + (H.b - H.t) * 0.6; let b = put(side === 'r' ? x : 6, 0, Math.min(mw, 300), tail);
    b = put(side === 'r' ? x : x - b.w, 0, Math.min(mw, 300), tail); b = again(b, clamp(bot - b.h, vtop + 4, sh)); b.cls = cls; return b;
  };
  // over the head, slid (and re-wrapped narrower when it must) clear of a chip or button it touches, the tail on the side that points closer to the head
  const aboveClear = (mw) => {
    let b = above(mw); const bot = b.t + b.h;
    for (let i = 0; i < 2; i++) {
      const o2 = hard.concat(soft).find((r) => hit(b, r)); if (!o2) break;
      const right = (o2.l + o2.r) / 2 > b.l + b.w / 2, room = right ? o2.l - 2 - 6 : sw - 6 - (o2.r + 2); if (room < 140) break;
      const w = Math.min(b.w, room); b = put(right ? Math.max(6, o2.l - 2 - w) : o2.r + 2, 0, w < b.w ? w : (b.mw ? parseFloat(b.mw) : mw), b.tail);
      if (right && b.l + b.w > o2.l - 2) b = put(Math.max(6, o2.l - 2 - b.w), 0, b.w, b.tail); b = again(b, bot - b.h);
    }
    const tl = b.l + SAY_TIP * b.w, tr2 = b.l + (1 - SAY_TIP) * b.w, want = Math.abs(tr2 - hx) < Math.abs(tl - hx) ? 'r' : null; // (the tail side does not change the layout)
    if (want !== b.tail) { bubble.classList.toggle('tail-r', want === 'r'); b.tail = want; }
    return b;
  };
  const tries = [() => aboveClear(), () => aboveClear(sw - 12),
    () => D && beside(D.r + 10, 'r'), () => D && beside(D.l - 10, 'l')];
  for (const f of tries) { const b = f(); if (ok(b, true)) return b; }
  for (const f of tries.slice(0, 2)) { const b = f(); if (ok(b, false)) return b; } // over the board: better than over the face (never the chip: beside the head first)
  for (const f of [() => beside(H.r + 10, 'r', 'h'), () => beside(H.l - 10, 'l', 'h')]) { const b = f(); if (ok(b, true) || ok(b, false)) return b; } // beside the head, over the dog's back
  if (D) { bubble.classList.add('below'); const b = put(6, 0); const r = put(clamp(ax - 40, 6, sw - b.w - 6), D.b + 8); if (ok(r, true)) return r; bubble.classList.remove('below'); } // under the dog, its tail pointing up
  let b = above(); b = again(b, Math.max(vtop + 4, b.t)); // nowhere clear: over the head as before, but under the chip it would sit on (v2.3)
  const hb = hard.filter((r) => hit(b, r)).reduce((m, r) => Math.max(m, r.b), 0); return hb ? again(b, hb) : b;
}
function say(text, wx, wy, ms = 3600, o) { // o (v2.14.1): { dog: the speaking dog's drawn box in stage px (else found near the anchor), avoid: [stage boxes to keep clear when there is room] }
  const svg = $('svg.world', view); if (!svg) return;
  if (isPhone() && typeof phPeekOn !== 'undefined' && phPeekOn) return; // v2.3: the dog is off-screen while the player looks right, so its bubble would point at nothing
  bubble.classList.remove('below', 'tail-r'); clearTimeout(bubbleBelowT); bubble.style.maxWidth = ''; // (03_yard.js may narrow it beside the place buttons) // a new line starts from the normal tail (the pier flips it, 03_yard.js)
  bubble.textContent = text; bubble.hidden = false; bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
  sayPlace(worldToStage(svg, wx, wy), o || {});
  if (isPhone()) {
    // UI/UX T5: in town places the dog's own lines go under the dog, so they never cover the shop signs above its head (townBubbleBelowDog, 03_yard.js); Mt. Fuji Lookout has no signs, its line stays over the head
    if (['yard', 'market'].includes(cur.mode) && S && !['yard', 'house', 'fujihill'].includes(S.place) && typeof dogHeadWorld === 'function') { const h = dogHeadWorld(); if (Math.abs(h.x - wx) < 40 && Math.abs(h.y - wy) < 40) townBubbleBelowDog(); }
  }
  clearTimeout(bubbleTimer); bubbleTimer = setTimeout(() => { bubble.hidden = true; }, ms);
}
function hideBubble() { bubble.hidden = true; clearTimeout(bubbleTimer); }
function nope(text) { SFX.nope(); toast(text, 'bad'); }

/* ---------------- stats ---------------- */
function addStat(k, v) { S.stats[k] = clamp(S.stats[k] + v, 0, 100); markDirty(); }
function addCoins(base, opts = {}) {
  const n = Math.round(base * (opts.raw ? 1 : BOOST.coins)); S.coins += n; markDirty();
  const c = $('#coins'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); updateHUD(); return n;
}
let levelQueue = [];
function bondMult() { return BOOST.bond * (S.dog.key === 'mutt' ? 1.1 : 1) * (glowing() ? 1.2 : 1) * (S.gameMin < S.pupUntil ? 2 : 1); }
function addBond(base, opts = {}) {
  const n = Math.max(1, Math.round(base * (opts.raw ? 1 : bondMult()))); S.bond.pts += n; markDirty();
  while (S.bond.level < 10 && S.bond.pts >= BOND_TH[S.bond.level]) { S.bond.level++; levelQueue.push({ l: S.bond.level, who: NAME() }); SFX.fanfare(); } // v2.7: who levelled up (pack care gives a pack dog its Bond)
  updateHUD(); setTimeout(maybeLevelUp, 400); return n;
}
function dailyCheck() {
  const d = day(); if (S.daily.day !== d) { S.daily = { day: d, pupcake: false, feed: false, pet: false, play: false, outfit: false }; markDirty(); return true; } return false;
}
function dailyCare(kind) {
  dailyCheck(); if (S.daily[kind]) return; S.daily[kind] = true;
  const n = addCoins(10); toast(tt('core.daily_care', '{kind, select, feed {Daily care bonus: +{n, plural, one {# coin} other {# coins}} for the first feed of the day.} pet {Daily care bonus: +{n, plural, one {# coin} other {# coins}} for the first pet of the day.} play {Daily care bonus: +{n, plural, one {# coin} other {# coins}} for the first play of the day.} outfit {Daily care bonus: +{n, plural, one {# coin} other {# coins}} for the first outfit of the day.} other {Daily care bonus: +{n, plural, one {# coin} other {# coins}} for the first {kind} of the day.}}', { kind, n }), 'gold');
}

/* ---------------- HUD ---------------- */
const METERS = [['hunger', 'Hunger'], ['happy', 'Happiness'], ['energy', 'Energy'], ['clean', 'Cleanliness']];
function buildHUD() {
  $('#meters').innerHTML = METERS.map(([k, en]) => { const label = esc(tdata('meters.' + k + '.1', en)); return `<div class="meter" data-k="${k}" title="${label}"><span class="ic">${ICON(k)}</span><span class="track" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100"><span class="fill"></span></span><span class="num">0</span></div>`; }).join('');
  $('#bondIc').innerHTML = ICON('bond'); $('#coinIc').innerHTML = ICON('coin'); $('#gearBtn').innerHTML = ICON('settings');
  updateMute();
}
function updateHUD() {
  if (!S) return;
  for (const [k] of METERS) {
    const m = $(`.meter[data-k="${k}"]`); if (!m) continue; const v = Math.round(S.stats[k]);
    m.querySelector('.fill').style.width = v + '%'; m.style.setProperty('--v', v); m.querySelector('.num').textContent = v; m.querySelector('.track').setAttribute('aria-valuenow', v);
    m.classList.toggle('low', v < 25);
  }
  const L = S.bond.level, a = BOND_TH[L - 1], b = BOND_TH[L] || BOND_TH[9];
  const pr = L >= 10 ? 100 : clamp((S.bond.pts - a) / (b - a) * 100, 0, 100);
  $('#bondLvl').textContent = L; $('#bondFill').style.width = pr + '%'; $('#bondTrack').setAttribute('aria-valuenow', Math.round(pr));
  $('#bondTrack').title = L >= 10 ? tt('core.bond_max', 'Max Bond. Best friends.') : tt('core.bond_points', '{pts} / {max} Bond points', { pts: tnum(S.bond.pts), max: tnum(b) });
  $('#coinNum').textContent = tnum(S.coins);
  if (S.dogs) setHudDog();
  const bc = $('#buffChip'); if (bc) { const k2 = S.buff ? S.buff.id + buffLabel() : ''; if (bc.dataset.k !== k2) { bc.dataset.k = k2; bc.hidden = !S.buff; if (S.buff) bc.innerHTML = `<span class="ic">${art('item', S.buff.dish || 'Carrot Crunchies')}</span>${esc(buffLabel())}`; bc.title = S.buff ? (BUFF_TXT[S.buff.id] || '') : ''; } }
  const hc = $('#hudClock'); if (hc) hc.textContent = `${clockText()} · ${wxLabel()}`;
  const st = $('#status'); if (st) { const k = S.place + wxIconName() + clockText() + wxLabel() + (S.gameMin < S.pupUntil); if (st.dataset.k !== k) { st.dataset.k = k; st.innerHTML = `<span class="pin"><svg viewBox="-10 -12 20 24"><path d="M0 11 C-3 4 -8 0 -8 -4 a8 8 0 0 1 16 0 c0 4 -5 8 -8 15z" fill="#F28FA5" stroke="#5B3D32" stroke-width="1.8"/><circle cy="-4" r="3" fill="#FFFBF3" stroke="#5B3D32" stroke-width="1.4"/></svg></span><b class="pname">${esc(tPlace(PLACES[S.place] ? S.place : 'yard'))}</b> · <span class="wxic">${iconOr(wxIconName(), WX_DOODLE[wxIconName()] || '')}</span>${esc(clockText())} · ${esc(wxLabel())} · ${esc(tt('core.status_day', 'Day {day}', { day: day() }))}${S.gameMin < S.pupUntil ? ' · ' + esc(tt('core.pupcake_power', 'Pupcake power')) : ''}`; } }
}
function updateMute() { const m = !!prefs.mute; const b = $('#muteBtn'); b.innerHTML = ICON(m ? 'sound-off' : 'sound-on'); b.setAttribute('aria-label', m ? tt('shell.mute_off', 'Sound off. Tap to unmute.') : tt('shell.mute_on', 'Sound on. Tap to mute.')); }

/* ---------------- action bar ---------------- */
const ACTS = [['feed', 'Feed', 'feed'], ['play', 'Play', 'play'], ['care', 'Care', 'bath'], ['walk', 'Walk', 'walk'], ['wardrobe', 'Wardrobe', 'wardrobe'], ['journal', 'Journal', 'journal'], ['map', 'Map', 'map']];
function buildBar() {
  barLabels();
  bar.addEventListener('click', (e) => { const b = e.target.closest('.act'); if (b) doAct(b.dataset.act); });
}
// the buttons themselves (v2.14: drawn again in the new language when the title screen switches it; the click listener stays the one above)
function barLabels() { bar.innerHTML = ACTS.map(([a, label, ic], i) => `<button class="act" data-act="${a}" aria-keyshortcuts="${i + 1}"><span class="ic">${a === 'journal' ? iconOr('journal', doodle('paw', 0, 2, 1.1)) : ICON(ic)}</span><span>${esc(tdata('acts.' + a + '.1', label))}</span></button>`).join(''); }
function doAct(a) {
  SFX.click(); hideBubble(); closeTraining();
  const pop = !modal.hidden || popOpen();
  if (pop && popAct === a) { if (!modal.hidden) closeModal(); else closeTray(); return; }
  if (!modal.hidden) closeModal();
  if (['feed', 'play', 'care', 'wardrobe', 'journal'].includes(a)) popAct = a;
  if (a === 'map') return tkMapAct(); // v2.11: in a Tokyo place the Map button opens the Japan map (39_tokyo.js)
  if (a === 'walk') return go('routes');
  if (a === 'wardrobe') return openWardrobe();
  if (a === 'journal') return openJournal();
  if (cur.mode !== 'yard') go('yard');
  if (a === 'feed') openFeedTray();
  if (a === 'play') openPlayTray();
  if (a === 'care') openCareTray();
}

/* ---------------- modal ---------------- */
let modalClose = null;
function openModal(title, bodyHTML, opts = {}) {
  if (cur.mode === 'yard' && popOpen()) S.sleeping ? sleepTray() : dockIdle();
  modal.innerHTML = `<div class="panel pop ${opts.cls || ''}" role="dialog" aria-modal="true" aria-label="${esc(title.replace(/<[^>]+>/g, ''))}"><h2>${title}</h2>${opts.noX ? '' : `<button class="xbtn x" aria-label="${esc(tt('core.close', 'Close'))}">x</button>`}<div class="panel-body">${bodyHTML}</div>${opts.foot ? `<div class="foot">${opts.foot}</div>` : ''}</div>`;
  modal.hidden = false; modalClose = opts.onClose || null;
  const p = $('.panel', modal); p.insertAdjacentHTML('afterbegin', '<div class="sheet-grab" aria-hidden="true"></div>'); sheetSwipe(p, () => closeModal()); const x = $('.x', p); if (x) x.onclick = () => { SFX.click(); closeModal(); };
  setTimeout(() => { const f = p.querySelector('[autofocus]') || p.querySelector('.foot .btn') || x; if (f) f.focus({ preventScroll: true }); }, 30);
  if (isPhone()) toastWatchSheet(p); // toasts that came first (a walk's bonus) move off the new sheet
  return p;
}
function closeModal() {
  if (modal.hidden) return; modal.hidden = true; modal.innerHTML = ''; if (isPhone()) { toastWatchSheet(null); toastPlace(); } audioPlace(); const cb = modalClose; modalClose = null; if (cb) cb(); setTimeout(maybeLevelUp, 250);
}
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
function confirmIn(panel, html, yes = tt('core.yes', 'Yes'), no = tt('core.no', 'No')) {
  return new Promise((res) => {
    const old = panel.querySelector('.confirm'); if (old) old.remove();
    const c = document.createElement('div'); c.className = 'confirm';
    c.innerHTML = `<p>${html}</p><button class="btn no">${no}</button><button class="btn yes">${yes}</button>`;
    panel.appendChild(c); c.querySelector('.yes').focus({ preventScroll: true });
    c.querySelector('.yes').onclick = () => { c.remove(); res(true); };
    c.querySelector('.no').onclick = () => { SFX.click(); c.remove(); res(false); };
  });
}
function ask(title, html, yes, no) {
  return new Promise((res) => {
    const p = openModal(title, `<p>${html}</p>`, { foot: `<button class="btn no" id="askNo">${no}</button><button class="btn yes" id="askYes">${yes}</button>`, onClose: () => res(false) });
    $('#askYes', p).onclick = () => { modalClose = null; closeModal(); res(true); };
    $('#askNo', p).onclick = () => { modalClose = null; closeModal(); res(false); };
  });
}

/* ---------------- level-up ---------------- */
function unlocksFor(L) {
  const u = [];
  for (const k in ROUTES) if (ROUTES[k].bond === L && L > 1) u.push(tt('core.unlock_route', '{dig, select, yes {Walk route: {route} (with digging)} other {Walk route: {route}}}', { dig: ROUTES[k].dig ? 'yes' : 'no', route: tRoute(k) }));
  TRICKS.forEach((t) => { if (t.bond === L) u.push(t.n === 'Signature' ? tt('core.unlock_signature', 'Signature trick: {trick}', { trick: tSig(S.dog.key) }) : tt('core.unlock_trick', 'Trick: {trick}', { trick: tTrick(t.n) })); });
  TOYS.concat(CLOTHES).forEach((t) => { if (t.bond === L && L > 1 && !t.ed) u.push(tt('core.unlock_shop', 'Shop: {item}', { item: tItem(t.n) })); });
  HOUSES.forEach((h) => { if (h.bond === L && L > 1) u.push(tt('core.unlock_house', 'House: {house}', { house: tItem(h.n) })); });
  if (L === 10) u.push(tt('core.unlock_badge', 'Best Friends badge (it is invisible, but it is there)'));
  return u;
}
function maybeLevelUp() {
  if (!levelQueue.length || !modal.hidden || !['yard', 'market', 'map', 'shelter'].includes(cur.mode)) return;
  const who = levelQueue[0].who, levels = levelQueue.filter((q) => q.who === who).map((q) => q.l), L = Math.max(...levels); levelQueue = levelQueue.filter((q) => q.who !== who); audioCue('levelup');
  const all = []; levels.sort((a, b) => a - b).forEach((l) => all.push(...unlocksFor(l)));
  const lines = [tt('core.lu_units_html', '<b>{name}</b> now loves you {l} units. Units are made up.', { name: who, l: L }), tt('core.lu_spin_html', '<b>{name}</b> did a little spin about it.', { name: who }), tt('core.lu_raise_html', '<b>{name}</b> would like a raise. In treats.', { name: who }), tt('core.lu_dirt_html', '<b>{name}</b> is writing your name in the dirt. Badly.', { name: who })];
  openModal(`<span class="hl">${esc(tt('core.lu_title', 'Bond level {l}!', { l: L }))}</span>`, `<svg class="lu-doodle" viewBox="0 0 600 44" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${doodle('spark', 40, 22, 0.9)}${doodle('heart', 90, 22, 0.8)}${doodle('spark', 140, 20, 0.6)}${doodle('paw', 300, 24, 0.7)}${doodle('spark', 460, 22, 0.6)}${doodle('heart', 510, 20, 0.8, 10)}${doodle('spark', 560, 22, 0.9)}</svg><p>${PICK(lines)}</p><p>${levels.length > 1 ? esc(tt('core.lu_many', "{n, plural, one {(That's # level at once. Show-off.)} other {(That's # levels at once. Show-off.)}}", { n: levels.length })) + '</p><p>' : ''}${esc(tt('core.lu_unlocked', 'Unlocked:'))}</p><ul class="unlocks">${all.map((u) => `<li>${esc(u)}</li>`).join('') || `<li>${esc(tt('core.lu_nothing', 'Pure friendship. No refunds.'))}</li>`}</ul>`, { cls: 'celebrate', foot: `<button class="btn yes big" id="luOk">${esc(tt('core.lu_yay', 'Yay!'))}</button>` });
  $('#luOk').onclick = () => { SFX.boop(700); closeModal(); if (levelQueue.length) setTimeout(maybeLevelUp, 400); }; // another dog levelled up too
}

/* ---------------- modes ---------------- */
const cur = { mode: null, cleanup: [] };
function onCleanup(fn) { cur.cleanup.push(fn); }
function setChrome(hudOn, barOn) { hud.hidden = !hudOn; bar.hidden = !barOn; stage.classList.toggle('nobar', !barOn); if (hudOn) setHudDog(); requestAnimationFrame(() => stage.style.setProperty('--hudH', (hud.hidden ? 0 : hud.offsetHeight) + 'px')); }
let hudDogKey = '';
function setHudDog() { if (!S) return; const k = chipsKey(); if (k === hudDogKey) return; hudDogKey = k; renderDogChips(); const ht = $('#hudTitle'); ht.textContent = S.title ? (typeof jrTitleName === 'function' ? jrTitleName(S.title) : S.title) : ''; ht.hidden = !S.title; $('#hudHead').innerHTML = headSVG(D()); $('#hudName').innerHTML = esc(S.dog.name) + ' ' + sexSym(S.dog.sex); }
function go(mode, arg) {
  const prevMode = cur.mode; idleStop(); IDLE.act = null; IDLE.steps = []; IDLE.nextAt = performance.now() + 3000 * IDLE.speed;
  if (mode === 'yard' && ['walk', 'fetch', 'toy'].includes(prevMode)) { lastActiveAt = performance.now(); if (prevMode === 'walk') setTimeout(() => greetBark(), 900); }
  closeTraining(); clearCurl(); clearPotty();
  cur.cleanup.splice(0).forEach((f) => { try { f(); } catch (e) { console.warn(e); } });
  hideBubble(); dock.innerHTML = ''; titleEl.hidden = true; view.className = '';
  if (mode !== 'title' && mode !== 'adopt') { if (modal.hidden === false && !arg?.keepModal) closeModal(); }
  cur.mode = mode; cur.arg = typeof arg === 'string' ? arg : null;
  if (mode === 'walk' && S && S.dogs && S.dogs.length > 1) greetFor = S.activeId;
  stage.classList.toggle('flowdock', ['walk', 'fetch', 'bath', 'adopt'].includes(mode)); stage.classList.toggle('adoptmode', mode === 'adopt');
  stage.classList.toggle('slimhud', mode === 'walk' || mode === 'routes' || mode === 'garden' || mode === 'kitchen' || mode === 'map');
  stage.classList.toggle('modhud', mode === 'garden' || mode === 'kitchen');
  ({ garden: enterGarden, kitchen: enterKitchen, title: enterTitle, adopt: enterAdopt, yard: enterYard, market: enterMarketPlace, routes: enterRoutes, map: enterMap, japan: enterJapan, shelter: enterShelter, walk: enterWalk, fetch: enterFetch, bath: enterBath, toy: enterToy })[mode](arg);
  refreshActs();
  updateHUD(); updateWxOverlay(); audioPlace(); setTimeout(maybeLevelUp, 300); markDirty();
}


/* ---------- lane event bus (PIPELINE.md): lanes react to each other without editing each other's files ---------- */
const BUS = Object.create(null);
function on(evt, fn) { (BUS[evt] = BUS[evt] || []).push(fn); }
function emit(evt, data) { const l = BUS[evt]; if (!l) return; for (const fn of l.slice()) { try { fn(data); } catch (e) { console.warn('bus ' + evt, e); } } }
/* v2.4: player actions, for the daily missions and the guide (V24.md section 1). Listeners: on('act', ({ kind, ... }) => ...) or on('act:feed', ...). */
function trackAct(kind, data) { const d = data || {}; emit('act', Object.assign({ kind }, d)); emit('act:' + kind, d); }
