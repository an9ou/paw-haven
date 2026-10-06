(function () {
'use strict';
/* =========================================================================
   Paw Haven prototype. Numbers come from the game proposal; the prototype
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
  { n: 'Pupcake', price: 60, hunger: 20, happy: 30, note: '+30 Happiness and double Bond for 1 game hour. 1 per day.' }
];
const TOYS = [
  { n: 'Tennis Ball', price: 40, bond: 1, note: 'Fetch: 2 coins per catch.' },
  { n: 'Squeaky Duck', price: 50, bond: 1, note: 'Squeeze: +10 Happiness. The neighbours love it (no).' },
  { n: 'Rope Tug', price: 60, bond: 1, note: 'Tug-of-war: +15 Happiness, -10 Energy, +5 Bond.' },
  { n: 'Plush Bone', price: 80, bond: 1, note: 'Nap buddy: +10% nap Energy. Works automatically.' },
  { n: 'Frisbee', price: 120, bond: 3, note: 'Long fetch: 3 coins per catch, +20 Happiness.' },
  { n: 'Puzzle Feeder', price: 150, bond: 4, note: 'Every meal: +10 Happiness and double Bond. Automatic.' }
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
  { n: 'Superhero Cape', slot: 'body', price: 250, bond: 6, perk: 'Walk speed +15%. Whoosh.' }
];
const HOUSES = [
  { n: 'Cardboard Box', price: 0, bond: 1, comfort: 0, hd: 4, note: 'Free. Has a flap. Smells like delivery.' },
  { n: 'Classic Wooden Doghouse', price: 300, bond: 2, comfort: 0.15, hd: 3.5, note: 'A name plate! Spelled almost right.' },
  { n: 'Cozy Cottage', price: 800, bond: 4, comfort: 0.30, hd: 3, note: 'Chimney, flower box, mortgage.' },
  { n: 'Snow Igloo', price: 1500, bond: 6, comfort: 0.40, hd: 3, note: 'Cool and cozy. Frost gets double the bonus.' },
  { n: 'Treehouse Den', price: 2500, bond: 7, comfort: 0.55, hd: 2.5, note: 'Has a ladder. Dogs cannot climb ladders. Details.' },
  { n: 'Royal Castle Kennel', price: 5000, bond: 9, comfort: 0.75, hd: 2, note: 'Cardboard turrets. Fit for royalty, or a very good boy.' }
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
  beagle: { n: 'The Big Bay', fx: 'tk-bow', pose: 'speak', snd: 'howl', say: 'AROOOOOOOOOO!' }
};
const SIG_FB = { n: 'The Grand Finale', fx: 'tk-bow', pose: 'happy', say: 'Ta-da! (Applause, please.)' };
const sigOf = (k) => SIG[k] || SIG_FB;
/* v1.7: every breed key in the game, in PawArt order (unknown keys fall back to generic content) */
const BREED_KEYS = ['shiba', 'corgi', 'golden', 'dachs', 'husky', 'mutt', 'chihuahua', 'pug', 'greyhound', 'beagle'];
const ROUTES = {
  park: { n: 'Sunny Park', bond: 1, secs: 60, energy: 15, happy: 15, clean: 5, coins: [20, 30], bp: 8, pool: ['coin', 'leaf', 'flower', 'bone'] },
  river: { n: 'Riverside Trail', bond: 2, secs: 75, energy: 25, happy: 20, clean: 10, coins: [35, 50], bp: 11, pool: ['coin', 'leaf', 'shell'] },
  woods: { n: 'Maple Woods', bond: 5, secs: 90, energy: 30, happy: 25, clean: 15, coins: [50, 70], bp: 13, pool: ['coin', 'acorn', 'leaf', 'flower'], dig: 3 },
  beach: { n: 'Seashell Beach', bond: 8, secs: 90, energy: 30, happy: 30, clean: 20, coins: [60, 80], bp: 15, pool: ['coin', 'shell'], dig: 3 }
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
  TR('Driftwood Stick', 'toy', null, 'Common', ['beach', 'river'], 'Splinter Bonus', 'Fetch with it: +1 coin per catch.'),
  TR('Rubber Chicken', 'toy', null, 'Uncommon', ['park'], 'Honk of Wisdom', 'Tricks are learned in 2 taps instead of 3. It honks. Automatic.'),
  TR('Glow Ball', 'toy', null, 'Rare', ['woods', 'beach'], 'Easy Glow', 'Fetch with it: the catch window is 50% wider.'),
  TR('Lucky Penny', 'charm', 'charm', 'Common', ['park', 'river'], 'Pocket Luck', '+10% coins on walks while equipped.'),
  TR('Sparkle Stone', 'charm', 'charm', 'Rare', ['river', 'beach'], 'Strange Hum', 'Petting gives +5 extra Happiness while equipped. It hums. Something about it feels... important later.'),
  TR('Old Map Piece (Park)', 'quest', null, 'Uncommon', ['park'], 'Map Piece', '1 of 4 pieces of the Paw Haven Treasure Map.', { piece: 'park' }),
  TR('Old Map Piece (River)', 'quest', null, 'Uncommon', ['river'], 'Map Piece', '1 of 4 pieces of the Paw Haven Treasure Map.', { piece: 'river' }),
  TR('Old Map Piece (Woods)', 'quest', null, 'Rare', ['woods'], 'Map Piece', '1 of 4 pieces of the Paw Haven Treasure Map.', { piece: 'woods' }),
  TR('Old Map Piece (Beach)', 'quest', null, 'Rare', ['beach'], 'Map Piece', '1 of 4 pieces of the Paw Haven Treasure Map.', { piece: 'beach' })
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
const ROUTE_WORD = { park: 'in the park', river: 'near water', woods: 'under the trees', beach: 'in the sand' };
const ROUTE_HINT = { park: 'Found in the park...', river: 'Found near water...', woods: 'Found under the trees...', beach: 'Found in the sand...' };
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
  beagle: { house: 'Someone had toast here three days ago. I can prove it.', park: 'Hot dog stand: 200 metres. Picnic: 50 metres. Squirrel: everywhere.', river: 'Fish. Mud. Duck. A sandwich from Tuesday. Rich smells here.', woods: 'This trail smells like a rabbit with a story. AROOO!', beach: 'Seaweed, sunscreen, chips. My nose is on holiday.', market: 'I can smell every shop at once. It is a lot. I love it.' }
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
  beagle: { food: ['Basic Kibble', 'Bone-shaped Biscuit'], toy: 'Puzzle Feeder', act: 'digging' }
};
const BARK = { shiba: 1.1, corgi: 1.35, golden: 0.9, dachs: 1.2, husky: 0.8, mutt: 1.0, chihuahua: 1.7, pug: 0.95, greyhound: 0.75, beagle: 1.0 };
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
  { key: 'beagle', name: 'Bagel', breed: 'Beagle', personality: 'Nose-led, food-obsessed, bays loudly', joke: 'Smelled that from three streets away.' }
];
const GENERIC_DOG = (key) => ({ key, name: 'Buddy', breed: 'Mystery Pup', personality: 'A little bit of everything', joke: 'Hi! I am a dog. Probably.' });
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
  beagle: ['Smelled that from three streets away.', 'AROOOO! (That means hello. Also snack.)', 'Somebody ate cheese near here in 2019. I am on the case.', 'My ears are long so they can sweep smells towards my nose.', 'I am not stealing the sandwich. I am inspecting it. With my mouth.']
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
function propOK(name) { try { const f = PA().prop; if (typeof f !== 'function') return ''; const v = f.call(PA(), name); return typeof v === 'string' && v.includes('<svg') ? v : ''; } catch (e) { return ''; } }
function buildChrome() {
  const root = document.documentElement, set = (k, svg) => root.style.setProperty(k, svgURI(svg));
  set('--fr-card', pencilSVG(300, 200, rrPts(300, 200, 9, 3, 90), 11));
  set('--fr-btn', pencilSVG(200, 60, rrPts(200, 60, 12, 3, 70), 23));
  const circ = Array.from({ length: 44 }, (_, i) => [50 + Math.cos(i / 44 * 6.283) * 45, 50 + Math.sin(i / 44 * 6.283) * 45]);
  set('--fr-round', pencilSVG(100, 100, circ, 37));
  set('--fr-tube', pencilSVG(300, 24, rrPts(300, 24, 10, 2.5, 80), 41, true, 1.1));
  set('--fr-tubew', pencilSVG(1000, 24, rrPts(1000, 24, 10, 2.5, 160), 43, true, 1.2));
  set('--fr-wide', pencilSVG(800, 60, rrPts(800, 60, 12, 3, 140), 47, true, 1.6));
  set('--fr-tray', pencilSVG(1000, 170, rrPts(1000, 170, 12, 3, 180), 59, true, 1.7));
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
function sceneArt(name, e, extra) {
  const o = Object.assign({}, e || {}, extra || {});
  if (NEW_PLACES.includes(name) && !hasRealScene(name)) return place(art('scene', SCENE_FB[name], o), 0, 0, 1000, 600) + placeSign(name);
  if (HANG.includes(name) && !hasRealScene(name)) return name === 'house' ? place(art('scene', 'yard', o), 0, 0, 1000, 600) : place(art('walkStrip', name, e), -400, 0, 1800, 600);
  return place(art('scene', name, o), 0, 0, 1000, 600);
}
function sceneG(name, extra = {}, noEnv) { return `<g id="sceneG" data-scene="${name}" data-noenv="${noEnv ? 1 : ''}" data-extra='${JSON.stringify(extra)}'>${sceneArt(name, noEnv ? null : envNow(), extra)}</g>`; }
function snowmanSVG() { if (!S || weatherNow() !== 'snow' || !isWarm()) return ''; const sm = artReal('prop', 'snowman'); return sm ? place(sm, 70, 440, 110, 110) : `<g transform="translate(125 545)" stroke="#5B3D32" stroke-width="2.4" fill="#FFFBF3"><circle cy="-22" r="24"/><circle cy="-62" r="17"/><circle cx="-6" cy="-66" r="2" fill="#5B3D32"/><circle cx="6" cy="-66" r="2" fill="#5B3D32"/><path d="M0 -60 l12 3 l-12 3z" fill="#F4A262"/></g>`; }
const outdoorView = () => (['yard', 'bath', 'fetch'].includes(cur.mode) ? !!(S && PLACES[S.place] && PLACES[S.place].out) : cur.mode === 'shelter');
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
  const e = envNow(), k = e.time + '|' + e.weather;
  if (k === envKey && !force) return; const first = !envKey; envKey = k;
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
let prefs = { mute: false, motion: null };
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
  Object.assign(st.dog, newDogFields(key, sex || 'male', bornDaysAgo(10))); st.kennel = [];
  st.garden = gardenNew(); gkFields(st, false); v131Fields(st);
  if (key === 'mutt') { st.dog.favFood = [PICK(FOOD.slice(1)).n]; st.dog.favToy = PICK(TOYS).n; }
  st.dog.adoptedAt = localISO();
  return linkDogs(st);
}
let S = null;
let dirty = false;
function markDirty() { dirty = true; }
const ALIAS_KEYS = new Set(['dog', 'stats', 'bond', 'outfit', 'potty', 'sleeping', 'dishLog', 'buff', 'glowUntil', 'pupUntil', 'tricks']);
function saveNow() { if (!S) return; S.lastReal = Date.now(); const root = S; lsSet(SAVE_KEY, JSON.stringify(S, function (k, v) { return this === root && ALIAS_KEYS.has(k) ? undefined : v; })); dirty = false;
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
  return s;
}
function migNote() { if (S && S.gkNote) { delete S.gkNote; markDirty(); setTimeout(() => toast('Pip left a packet of seeds on your doorstep. The veggie patch is yours now!', 'gold'), 2200); }
  if (S && !S.dog.sex) setTimeout(askSex, 600);
  if (S && S.migNote) { const n = S.migNote; delete S.migNote; markDirty(); setTimeout(() => toast(`Your ${n} old leaves, shells and acorns were bought by a very enthusiastic squirrel: +${n * 5} coins.`, 'gold'), 1200); } }

/* ---------------- DOM refs ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const stage = $('#stage'), hud = $('#hud'), view = $('#view'), dock = $('#dock'), bar = $('#bar'), titleEl = $('#title'), modal = $('#modal'), bubble = $('#bubble'), toasts = $('#toasts'), devPanel = $('#devPanel');

/* ---------------- helpers: names, time, weather ---------------- */
const NAME = () => (S ? S.dog.name : 'Dog');
const day = () => Math.floor(S.gameMin / 1440) + 1;
function clock() { const m = Math.floor(S.gameMin % 1440); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
/* ---- v1.2 real time + weather: clock = device time; weather seeded by date, 3 periods a day ---- */
const ENV = { time: prefs.ovrTime || 'auto', weather: prefs.ovrWeather || 'auto' };
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
const envNow = () => ({ time: timePhase(), weather: weatherNow() });
const isNight = () => timePhase() === 'night';
function isHot() { if (S && S.buff && typeof buffOn === 'function' && buffOn('cool')) return false; if (weatherNow() !== 'sunny' || timePhase() !== 'day') return false; if (ENV.time !== 'auto') return true; const h = new Date().getHours(); return h >= 11 && h < 15; }
function clockText() { if (ENV.time !== 'auto') return { dawn: '06:00', day: '13:00', dusk: '18:00', night: '23:00' }[ENV.time] + '*'; const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
const WEATHER_TXT = { sunny: 'Sunny', cloudy: 'Cloudy', rain: 'Rain', snow: 'Snow' };
const wxLabel = () => (weatherNow() === 'sunny' && isNight() ? 'Clear night' : WEATHER_TXT[weatherNow()]);
function wxIconName() { const w = weatherNow(), t = timePhase(); if (w === 'rain' || w === 'snow' || w === 'cloudy') return 'w-' + w; return t === 'night' ? 'w-night' : t === 'dawn' ? 'w-dawn' : t === 'dusk' ? 'w-dusk' : 'w-sunny'; }
const RAINCOATS = ['Yellow Raincoat', 'Polka-dot Raincoat', 'Frog Raincoat', 'Bubble Raincoat'];
const hasRaincoat = () => RAINCOATS.includes(S.outfit.body);
const hasRainHat = () => S.outfit.head === 'Rain Hat';
const isWarm = () => S.outfit.head === 'Pom-pom Beanie' || S.outfit.body === 'Knit Winter Sweater' || (typeof buffOn === 'function' && buffOn('warm'));
const houseInfo = (n) => HOUSES.find((h) => h.n === (n || S.house)) || HOUSES[0];
const owns = (cat, n) => S.inv[cat].includes(n);
const glowing = () => (S.gameMin < (S.glowUntil || -1)) || (S.stats.hunger > 80 && S.stats.happy > 80 && S.stats.energy > 80 && S.stats.clean > 80);
const dogOutfit = () => ({ head: S.outfit.head, eyes: S.outfit.eyes, neck: S.outfit.neck, body: S.outfit.body });
const wearing = (n) => SLOTS.some((k) => S.outfit[k] === n) || S.outfit.charm === n;
const tInfo = (n) => TREASURES.find((t) => t.n === n);
function hasTreasure(t) { if (t.kind === 'wearable') return owns('clothes', t.n); if (t.kind === 'toy') return owns('toys', t.n); if (t.kind === 'charm') return S.inv.charms.includes(t.n); if (t.kind === 'quest') return S.mapPieces.includes(t.piece); return false; }
const isUnique = (t) => t.kind !== 'food';
const PLACEHOLDER_RE = /<text[^>]*>\s*\?\s*<\/text>/;
// art call that returns '' when the module is missing the asset (or answers with its '?' placeholder)
function artReal(fn, ...a) { try { const f = PA()[fn]; if (typeof f !== 'function') return ''; const v = f.apply(PA(), a); return typeof v === 'string' && v.includes('<svg') && !PLACEHOLDER_RE.test(v) ? v : ''; } catch (e) { return ''; } }
function iconOr(n, fallbackDoodle) { return artReal('icon', n) || `<svg viewBox="-20 -20 40 40">${fallbackDoodle}</svg>`; }
const isFavFood = (n) => S.dog.favFood.includes(n);
const favAct = (a) => (FAV[S.dog.key] || {}).act === a;

/* ---------------- toasts, bubbles ---------------- */
function toast(text, kind = '') {
  const modScr = stage.classList.contains('modhud'); toasts.style.top = modScr ? 'auto' : (hud.hidden ? 10 : view.offsetTop + 8) + 'px'; toasts.style.bottom = modScr ? '18px' : ''; toasts.style.flexDirection = modScr ? 'column-reverse' : '';
  const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = text; toasts.appendChild(t);
  while (toasts.children.length > 3) toasts.firstChild.remove();
  setTimeout(() => t.remove(), 2900);
}
let bubbleTimer = 0;
function worldToStage(svg, x, y) {
  try { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const p = pt.matrixTransform(svg.getScreenCTM()); const r = stage.getBoundingClientRect(); return { x: p.x - r.left, y: p.y - r.top }; } catch (e) { return { x: 100, y: 100 }; }
}
function toWorld(svg, cx, cy) { const pt = svg.createSVGPoint(); pt.x = cx; pt.y = cy; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
function say(text, wx, wy, ms = 3600) {
  const svg = $('svg.world', view); if (!svg) return;
  bubble.textContent = text; bubble.hidden = false; bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
  const p = worldToStage(svg, wx, wy); const sw = stage.clientWidth, bw = bubble.offsetWidth, bh = bubble.offsetHeight;
  const vtop = view.offsetTop;
  bubble.style.left = clamp(p.x - 40, 6, sw - bw - 6) + 'px';
  bubble.style.top = Math.max(vtop + 4, p.y - bh - 16) + 'px';
  if (isPhone()) { // v2.3: a bubble never sits on the location chip (top-left of the scene)
    const st = $('#status'), sr = st && !st.hidden ? st.getBoundingClientRect() : null, sg = stage.getBoundingClientRect();
    if (sr) { const bt = parseFloat(bubble.style.top), bl = parseFloat(bubble.style.left), cb = sr.bottom - sg.top + 6;
      if (bt < cb && bl < sr.right - sg.left + 6 && bl + bw > sr.left - sg.left - 6) bubble.style.top = cb + 'px'; }
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
  while (S.bond.level < 10 && S.bond.pts >= BOND_TH[S.bond.level]) { S.bond.level++; levelQueue.push(S.bond.level); SFX.fanfare(); }
  updateHUD(); setTimeout(maybeLevelUp, 400); return n;
}
function dailyCheck() {
  const d = day(); if (S.daily.day !== d) { S.daily = { day: d, pupcake: false, feed: false, pet: false, play: false, outfit: false }; markDirty(); return true; } return false;
}
function dailyCare(kind) {
  dailyCheck(); if (S.daily[kind]) return; S.daily[kind] = true;
  const n = addCoins(10); toast(`Daily care bonus: +${n} coins for the first ${kind} of the day.`, 'gold');
}

/* ---------------- HUD ---------------- */
const METERS = [['hunger', 'Hunger'], ['happy', 'Happiness'], ['energy', 'Energy'], ['clean', 'Cleanliness']];
function buildHUD() {
  $('#meters').innerHTML = METERS.map(([k, label]) => `<div class="meter" data-k="${k}" title="${label}"><span class="ic">${ICON(k)}</span><span class="track" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100"><span class="fill"></span></span><span class="num">0</span></div>`).join('');
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
  $('#bondTrack').title = L >= 10 ? 'Max Bond. Best friends.' : `${S.bond.pts} / ${b} Bond points`;
  $('#coinNum').textContent = S.coins;
  if (S.dogs) setHudDog();
  const bc = $('#buffChip'); if (bc) { const k2 = S.buff ? S.buff.id + buffLabel() : ''; if (bc.dataset.k !== k2) { bc.dataset.k = k2; bc.hidden = !S.buff; if (S.buff) bc.innerHTML = `<span class="ic">${art('item', S.buff.dish || 'Carrot Crunchies')}</span>${esc(buffLabel())}`; bc.title = S.buff ? (BUFF_TXT[S.buff.id] || '') : ''; } }
  const hc = $('#hudClock'); if (hc) hc.textContent = `${clockText()} · ${wxLabel()}`;
  const st = $('#status'); if (st) { const k = S.place + wxIconName() + clockText() + wxLabel() + (S.gameMin < S.pupUntil); if (st.dataset.k !== k) { st.dataset.k = k; st.innerHTML = `<span class="pin"><svg viewBox="-10 -12 20 24"><path d="M0 11 C-3 4 -8 0 -8 -4 a8 8 0 0 1 16 0 c0 4 -5 8 -8 15z" fill="#F28FA5" stroke="#5B3D32" stroke-width="1.8"/><circle cy="-4" r="3" fill="#FFFBF3" stroke="#5B3D32" stroke-width="1.4"/></svg></span><b class="pname">${esc((PLACES[S.place] || PLACES.yard).n)}</b> · <span class="wxic">${iconOr(wxIconName(), WX_DOODLE[wxIconName()] || '')}</span>${clockText()} · ${wxLabel()} · Day ${day()}${S.gameMin < S.pupUntil ? ' · Pupcake power' : ''}`; } }
}
function updateMute() { const m = !!prefs.mute; const b = $('#muteBtn'); b.innerHTML = ICON(m ? 'sound-off' : 'sound-on'); b.setAttribute('aria-label', m ? 'Sound off. Tap to unmute.' : 'Sound on. Tap to mute.'); }

/* ---------------- action bar ---------------- */
const ACTS = [['feed', 'Feed', 'feed'], ['play', 'Play', 'play'], ['care', 'Care', 'bath'], ['walk', 'Walk', 'walk'], ['wardrobe', 'Wardrobe', 'wardrobe'], ['journal', 'Journal', 'journal'], ['map', 'Map', 'map']];
function buildBar() {
  bar.innerHTML = ACTS.map(([a, label, ic], i) => `<button class="act" data-act="${a}" aria-keyshortcuts="${i + 1}"><span class="ic">${a === 'journal' ? iconOr('journal', doodle('paw', 0, 2, 1.1)) : ICON(ic)}</span><span>${label}</span></button>`).join('');
  bar.addEventListener('click', (e) => { const b = e.target.closest('.act'); if (b) doAct(b.dataset.act); });
}
function doAct(a) {
  SFX.click(); hideBubble(); closeTraining();
  const pop = !modal.hidden || popOpen();
  if (pop && popAct === a) { if (!modal.hidden) closeModal(); else closeTray(); return; }
  if (!modal.hidden) closeModal();
  if (['feed', 'play', 'care', 'wardrobe', 'journal'].includes(a)) popAct = a;
  if (a === 'map') return cur.mode === 'map' ? go('yard') : go('map');
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
  modal.innerHTML = `<div class="panel pop ${opts.cls || ''}" role="dialog" aria-modal="true" aria-label="${esc(title.replace(/<[^>]+>/g, ''))}"><h2>${title}</h2>${opts.noX ? '' : '<button class="xbtn x" aria-label="Close">x</button>'}<div class="panel-body">${bodyHTML}</div>${opts.foot ? `<div class="foot">${opts.foot}</div>` : ''}</div>`;
  modal.hidden = false; modalClose = opts.onClose || null;
  const p = $('.panel', modal); p.insertAdjacentHTML('afterbegin', '<div class="sheet-grab" aria-hidden="true"></div>'); sheetSwipe(p, () => closeModal()); const x = $('.x', p); if (x) x.onclick = () => { SFX.click(); closeModal(); };
  setTimeout(() => { const f = p.querySelector('[autofocus]') || p.querySelector('.foot .btn') || x; if (f) f.focus({ preventScroll: true }); }, 30);
  return p;
}
function closeModal() {
  if (modal.hidden) return; modal.hidden = true; modal.innerHTML = ''; audioPlace(); const cb = modalClose; modalClose = null; if (cb) cb(); setTimeout(maybeLevelUp, 250);
}
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
function confirmIn(panel, html, yes = 'Yes', no = 'No') {
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
  for (const k in ROUTES) if (ROUTES[k].bond === L && L > 1) u.push(`Walk route: ${ROUTES[k].n}${ROUTES[k].dig ? ' (with digging)' : ''}`);
  TRICKS.forEach((t) => { if (t.bond === L) u.push(t.n === 'Signature' ? `Signature trick: ${sigOf(S.dog.key).n}` : `Trick: ${t.n}`); });
  TOYS.concat(CLOTHES).forEach((t) => { if (t.bond === L && L > 1) u.push(`Shop: ${t.n}`); });
  HOUSES.forEach((h) => { if (h.bond === L && L > 1) u.push(`House: ${h.n}`); });
  if (L === 10) u.push('Best Friends badge (it is invisible, but it is there)');
  return u;
}
function maybeLevelUp() {
  if (!levelQueue.length || !modal.hidden || !['yard', 'market', 'map', 'shelter'].includes(cur.mode)) return;
  const levels = levelQueue.splice(0), L = Math.max(...levels); audioCue('levelup');
  const all = []; levels.sort((a, b) => a - b).forEach((l) => all.push(...unlocksFor(l)));
  const lines = ['now loves you ' + L + ' units. Units are made up.', 'did a little spin about it.', 'would like a raise. In treats.', 'is writing your name in the dirt. Badly.'];
  openModal(`<span class="hl">Bond level ${L}!</span>`, `<svg class="lu-doodle" viewBox="0 0 600 44" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${doodle('spark', 40, 22, 0.9)}${doodle('heart', 90, 22, 0.8)}${doodle('spark', 140, 20, 0.6)}${doodle('paw', 300, 24, 0.7)}${doodle('spark', 460, 22, 0.6)}${doodle('heart', 510, 20, 0.8, 10)}${doodle('spark', 560, 22, 0.9)}</svg><p><b>${esc(NAME())}</b> ${PICK(lines)}</p><p>${levels.length > 1 ? `(That's ${levels.length} levels at once. Show-off.)</p><p>` : ''}Unlocked:</p><ul class="unlocks">${all.map((u) => `<li>${esc(u)}</li>`).join('') || '<li>Pure friendship. No refunds.</li>'}</ul>`, { cls: 'celebrate', foot: '<button class="btn yes big" id="luOk">Yay!</button>' });
  $('#luOk').onclick = () => { SFX.boop(700); closeModal(); };
}

/* ---------------- modes ---------------- */
const cur = { mode: null, cleanup: [] };
function onCleanup(fn) { cur.cleanup.push(fn); }
function setChrome(hudOn, barOn) { hud.hidden = !hudOn; bar.hidden = !barOn; stage.classList.toggle('nobar', !barOn); if (hudOn) setHudDog(); requestAnimationFrame(() => stage.style.setProperty('--hudH', (hud.hidden ? 0 : hud.offsetHeight) + 'px')); }
let hudDogKey = '';
function setHudDog() { if (!S) return; const k = chipsKey(); if (k === hudDogKey) return; hudDogKey = k; renderDogChips(); const ht = $('#hudTitle'); ht.textContent = S.title || ''; ht.hidden = !S.title; $('#hudHead').innerHTML = headSVG(D()); $('#hudName').innerHTML = esc(S.dog.name) + ' ' + sexSym(S.dog.sex); }
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
  ({ garden: enterGarden, kitchen: enterKitchen, title: enterTitle, adopt: enterAdopt, yard: enterYard, market: enterMarketPlace, routes: enterRoutes, map: enterMap, shelter: enterShelter, walk: enterWalk, fetch: enterFetch, bath: enterBath, toy: enterToy })[mode](arg);
  refreshActs();
  updateHUD(); updateWxOverlay(); audioPlace(); setTimeout(maybeLevelUp, 300); markDirty();
}


/* ---------- lane event bus (PIPELINE.md): lanes react to each other without editing each other's files ---------- */
const BUS = Object.create(null);
function on(evt, fn) { (BUS[evt] = BUS[evt] || []).push(fn); }
function emit(evt, data) { const l = BUS[evt]; if (!l) return; for (const fn of l.slice()) { try { fn(data); } catch (e) { console.warn('bus ' + evt, e); } } }
