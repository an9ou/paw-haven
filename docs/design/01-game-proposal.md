# Paw Haven — Game Proposal

2026-10-03 · @Anson

## Vision & pitch

Paw Haven is a cozy browser game where you adopt one chibi dog, care for it, dress it up and explore a small sunny town together. The pitch in one line: Nintendogs warmth with Animal Crossing pacing, playable in a browser tab in 15-minute sessions.

**The promise to the player**

- **A dog that knows you.** Six breeds with real personalities. Each one reacts differently to food, toys and play, and grows closer through a 10-level Bond.
- **Nothing bad ever happens.** No fail states. The dog never gets sick, never dies and never runs away. Low stats only make the dog sleepy or mopey and lower bonuses.
- **Small, steady goals.** Earn Paw Coins on walks and in play, then spend them on food, outfits, toys and six tiers of dog house. A new area, trick or item unlocks every 2 to 4 days of regular play.
- **A town worth walking.** Seven areas, from the Home Yard hub to Seashell Beach, each with its own walk route, collectibles and neighbours.

**Design pillars**

1. **Touch first.** Petting, throwing and walking all use direct gestures on the dog, never menus alone.
2. **Readable care.** Four meters and one heart tell the player everything at a glance.
3. **Personality over grind.** Choices are about what your dog loves, not about optimal play.
4. **Fair economy.** Everything is earnable in play. No pay-to-win.

**Success for version 1:** a new player adopts a dog in under 3 minutes, a typical session lasts 15 to 25 minutes, and a regular player reaches Bond 10 in about 4 weeks.

## Audience & platform

The target player is a teen or adult cozy gamer who plays in short breaks on a laptop or phone browser. They know Animal Crossing, Stardew Valley and Nintendogs, and they want calm, cute and low-pressure play.

| Topic | Decision |
| --- | --- |
| Primary audience | Ages 13+, cozy and life-sim players, casual to mid-core |
| Session length | 15 to 25 minutes, 1 to 2 sessions a day |
| Platform | Web browser first: desktop Chrome, Edge, Firefox, Safari; mobile Safari (iOS 16+) and Chrome (Android 10+) |
| Orientation | Landscape 16:9 on desktop and tablet; portrait 9:19.5 on phone, with the same screens re-laid out |
| Input | Mouse, touch, and keyboard shortcuts on desktop |
| Install | Plays from a URL with no install; installable as a PWA for offline play |
| Performance target | 60 fps on a 2020 mid-range phone; first load under 8 MB, under 5 s on 4G |
| Language | English at launch; all text in string tables for later localisation |
| Rating goal | Suitable for all ages: no violence, no chat with strangers, no real-money gambling |

Later platforms (Steam via a desktop wrapper, app stores via a native wrapper) reuse the same build and are out of scope for version 1.

## Core game loop

The core loop is care, play, shop and grow, and every step adds Bond points, so the loop rewards variety rather than grinding one activity.

*[Embedded chart/diagram - see the original doc]*

One turn of the loop takes 5 to 10 minutes; a typical 20-minute session runs it two or three times. Higher Bond opens new routes and items, which give the next loop something fresh to do.

## Choosing your first dog

The player adopts one of six dogs at the Paw Haven Shelter, and that choice sets which foods, toys and activities give bonus happiness. A favourite gives +50% Happiness from that item or activity. Every dog can do everything; personality only changes the bonuses and the reactions.

| Breed | Default name | Personality | Favourite food | Favourite toy | Favourite activity | Quirk |
| --- | --- | --- | --- | --- | --- | --- |
| Shiba Inu | Mochi | Proud, independent, dramatic | Salmon Pâté | Plush Bone | Tricks | Turns away with a huff if petted on the belly before Bond 3 |
| Corgi | Biscuit | Cheerful, greedy for food | Pupcake and Bone-shaped Biscuit | Puzzle Feeder | Feeding | Hunger drops 20% faster; every meal also gives +5 Happiness |
| Golden Retriever | Sunny | Friendly, loves fetch | Basic Kibble | Tennis Ball | Fetch | Fetch pays +25% Paw Coins |
| Dachshund | Noodle | Curious, loves digging | Bone-shaped Biscuit | Squeaky Duck | Digging | +1 extra dig spot on every walk |
| Husky | Frost | Energetic, chatty (howls) | Chicken & Rice Bowl | Rope Tug | Walks | Energy drains 20% slower on walks; howls at music spots |
| Shelter Mutt | Pepper | Loyal, gentle, unique random spots | Rolled at adoption | Rolled at adoption | Petting | Bond points +10%; spot pattern is unique per save |

**Adoption flow (about 3 minutes)**

1. **Arrival.** A short letter from the shelter keeper welcomes the player to Paw Haven. One tap to continue.
2. **Meet the dogs.** The six dogs sit in a row of kennels. Tapping one plays its intro animation and shows a card: breed, personality in one line, favourite activity.
3. **Spend time.** The player can pet any dog for a few seconds before choosing. Each dog reacts in character: Mochi turns away, then peeks back; Frost howls.
4. **Choose.** "Adopt Mochi?" confirm screen with a large dog portrait. No penalty for browsing; nothing is locked.
5. **Name.** The default name is pre-filled and editable, 12 characters max, with a filter for offensive words. Pepper's coat pattern is generated here from a seed.
6. **Go home.** The dog follows the player through a short walk to the Home Yard, where the tutorial starts.

The player keeps one dog in version 1. The shelter stays on the map; adopting a second dog is planned after launch (see Risks & open questions).

## Feeding & care stats

Four care meters run from 0 to 100 and drift down slowly in real time; the player tops them up with food, play, naps and baths. Decay is gentle and pauses at a floor while the player is away, so a returning player never finds a miserable dog.

| Stat | Icon | Decay while playing | Decay while away | Away floor | Main refills |
| --- | --- | --- | --- | --- | --- |
| Hunger | Bowl | -6 per hour | -3 per hour | 30 | Food from Kibble Corner |
| Happiness | Smile | -4 per hour | -2 per hour | 40 | Petting, toys, fetch, tricks, walks, treats |
| Energy | Lightning | -2 per hour idle; walks and play cost more | Recovers +20 per hour (napping) | none | Naps in the dog house (comfort bonus applies), Fresh Water |
| Cleanliness | Bubble | -3 per hour; walks cost 5 to 20 | -1 per hour | 40 | Bath in the Home Yard (free, about 60 s) |

**What low stats do.** Below 25, a stat shows a gentle mood on the dog (rumbling tummy, yawns, droopy ears, a little dust cloud) and a soft pulse on its meter. Rewards drop: a dog under 25 Happiness earns half the Bond points from play. Nothing else happens. Above 80 on all four stats the dog is "Glowing": +20% Bond points and a sparkle trail.

**Feeding interaction.** The player drags a food from the pantry tray to the bowl. The dog trots over, eats in a 3-second animation and reacts. Overfeeding is not possible: food is refused with a happy belly-pat animation when Hunger is above 90, and the item is not used up.

**Food (Kibble Corner)**

| Food | Price (Paw Coins) | Hunger | Happiness | Other effect | Limit |
| --- | --- | --- | --- | --- | --- |
| Fresh Water | Free | 0 | +5 | +10 Energy | Refill once every 2 hours |
| Basic Kibble | 5 | +30 | 0 | none | none |
| Bone-shaped Biscuit (treat) | 8 | +10 | +10 | Trick training reward; +2 Bond points | none |
| Chicken & Rice Bowl | 15 | +50 | +5 | none | none |
| Salmon Pâté | 30 | +60 | +10 | +10 Cleanliness (shiny coat) | none |
| Pupcake (special treat) | 60 | +20 | +30 | Double Bond points for 10 minutes | 1 per day |

Food is bought in stacks and kept in the pantry (max 99 of each). The tutorial gives 5 Basic Kibble, 3 Bone-shaped Biscuits and 1 Pupcake. Three Basic Kibble meals cost 15 Paw Coins a day, so food is a small, steady sink and never a wall.

## Shop: clothes & toys

Clothes and toys are one-time purchases the player keeps forever; clothes are mainly for looks with one small perk each, and toys open new ways to play. Both shops sit on Market Street. Items locked by Bond level show in the shop with a heart badge and the level needed, so players always see what is coming.

**Bow-Wow Boutique (clothes)**

The dog wears up to four items at once, one per slot: head, eyes, neck, body. Putting on an outfit gives +5 Happiness once per day. NPC owners on walks compliment a dressed dog for +3 Paw Coins each.

| Item | Slot | Price (Paw Coins) | Unlocks at Bond | Perk |
| --- | --- | --- | --- | --- |
| Red Bandana | Neck | 50 | 1 | +1 NPC dog met on every walk |
| Party Hat | Head | 60 | 3 | Pupcake gives +50% Happiness while worn |
| Bow Tie | Neck | 70 | 2 | Compliments pay +2 extra Paw Coins |
| Flower Crown | Head | 90 | 3 | +2 leaf and flower collectibles per walk |
| Heart Sunglasses | Eyes | 100 | 5 | +10% Happiness from walks on sunny days |
| Yellow Raincoat | Body | 120 | 2 | No Cleanliness loss from rain on walks |
| Knit Winter Sweater | Body | 150 | 4 | Energy drains 10% slower on cold days |
| Superhero Cape | Body | 250 | 6 | Walk speed +15%, with a cape-flutter animation |

The Wardrobe screen in the Home Yard shows the dog on a turntable with slot tabs. Tapping an item previews it on the dog before buying. Each item gets 2 colour variants after launch.

**Kibble Corner (toys)**

| Toy | Price (Paw Coins) | Unlocks at Bond | Where it is used | Effect per play session |
| --- | --- | --- | --- | --- |
| Tennis Ball | 40 (one free in tutorial) | 1 | Home Yard, Sunny Park | Fetch: +15 Happiness, -10 Energy, 2 Paw Coins per catch |
| Squeaky Duck | 50 | 1 | Home Yard | Squeeze to call the dog: +10 Happiness |
| Rope Tug | 60 | 1 | Home Yard | Tug mini-game: +15 Happiness, -10 Energy, +5 Bond points |
| Plush Bone | 80 | 1 | Dog house | Nap toy: +10% Energy recovery while napping |
| Frisbee | 120 | 3 | Sunny Park, Seashell Beach | Long fetch: +20 Happiness, -15 Energy, 3 Paw Coins per catch |
| Puzzle Feeder | 150 | 4 | Home Yard | Meals in it give +10 Happiness and double Bond points |

A play session gives its full effect once every 10 minutes per toy. Repeating sooner still plays the animation and gives 25% of the effect, so players can keep playing without exploiting rewards.

## Dog houses

Six dog house tiers from Barkitecture are the game's big long-term purchases, and each tier makes naps restore Energy faster. A nap restores +20 Energy per hour at the base rate; the comfort bonus multiplies that rate and also slows Happiness decay while the dog is at home.

| Tier | House | Price (Paw Coins) | Unlocks at Bond | Comfort bonus (nap Energy) | Happiness decay at home | Special |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Cardboard Box | Free (starter) | 1 | +0% (20 per hour) | -4 per hour | The dog peeks out of a flap |
| 2 | Classic Wooden Doghouse | 300 | 2 | +15% (23 per hour) | -3.5 per hour | Name plate with the dog's name |
| 3 | Cozy Cottage | 800 | 4 | +30% (26 per hour) | -3 per hour | Chimney smoke, flower box with seasonal flowers |
| 4 | Snow Igloo | 1,500 | 6 | +40% (28 per hour) | -3 per hour | Frost gets double the bonus; stays cool on sunny days |
| 5 | Treehouse Den | 2,500 | 7 | +55% (31 per hour) | -2.5 per hour | Ladder animation; the dog watches birds |
| 6 | Royal Castle Kennel | 5,000 | 9 | +75% (35 per hour) | -2 per hour | Flags, a tiny drawbridge, a crown idle pose |

**Buying and switching.** Barkitecture shows each house on a rotating plinth with a "Try in yard" preview. Owned houses are kept in a catalogue, and switching between them in the Home Yard is free and instant. The first purchase of each tier plays a short build cutscene (about 5 seconds) and the dog's first reaction.

**Pacing.** At about 200 Paw Coins of spare income a day, a regular player buys the Wooden Doghouse on day 2, the Cozy Cottage in week 1, and saves 3 to 4 weeks for the Royal Castle Kennel. Home Yard decoration (fences, flower beds, a pond) is planned as the next sink after launch.

## Play & walk

Play happens directly on the dog with gestures, and walks are short side-scrolling trips where the player holds the leash and taps what the dog finds. Play raises Happiness and Bond and costs Energy; walks do the same and are the main source of Paw Coins.

### Petting

The dog has five petting zones. Each zone responds to a gesture, and each dog has one favourite zone (shown by a tiny heart after the player finds it).

| Zone | Best gesture (mouse or touch) | Reaction |
| --- | --- | --- |
| Head | Slow stroke: drag front to back | Eyes close, tail wags |
| Ears | Scratch: small back-and-forth drag | Head tilts into the hand |
| Chin | Tap-pat: 2 to 3 quick taps | Happy squint, little bark |
| Back | Long stroke along the spine | Wiggle, full-body wag |
| Belly | Circle rub (dog rolls over first, from Bond 3) | Leg kick, blissed-out face |

Petting gives +2 Happiness per second of correct gesture, up to +20 per session, and +3 Bond points. The favourite zone counts double. Full value returns after 10 minutes. A wrong or rough gesture (very fast drag) makes the dog step back for a second; there is no penalty.

### Fetch

The player flicks the Tennis Ball or Frisbee: drag back and release, where drag length sets distance. The dog runs, catches and brings it back. A catch in the air is a "Great catch" for +1 extra Paw Coin. A session is 10 throws, each costing 1 Energy (Frisbee 1.5), with coins per catch as listed in the toy table. Fetch works in the Home Yard (short throws) and in Sunny Park (long throws, NPC dogs sometimes join in).

### Tricks

Tricks are taught with a gesture and a Bone-shaped Biscuit reward. Five correct repeats in one session teach a trick; after that it can be performed on command. Each performed trick gives +4 Happiness and +4 Bond points (Mochi: +6 Happiness). At the Sunny Park bandstand the player can run a 5-trick show once a day for 25 Paw Coins.

| Trick | Gesture | Unlocks at Bond |
| --- | --- | --- |
| Sit | Swipe down | 1 |
| Paw | Tap the dog's paw | 2 |
| Lie Down | Swipe down and hold 1 s | 3 |
| Roll Over | Draw one circle | 4 |
| Spin | Draw two quick circles | 5 |
| Play Dead | Point (tap) then swipe up | 6 |
| Speak | Double-tap the head (Frost howls instead) | 7 |
| Dance | Zig-zag swipe | 8 |
| Bow | Swipe down, then left | 9 |
| Signature trick | Hold on the dog 2 s; unique per breed | 10 |

### Walks

The player picks a route on the town map. The dog walks left to right along a side-scrolling path. The player holds the leash (press and hold) to keep walking and releases to stop. Along the way the player taps sniff spots, collectibles and neighbours.

| Route (map area) | Unlocks at Bond | Length | Energy | Happiness | Cleanliness | Paw Coins | Highlights |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Sunny Park | 1 | 3 min | -15 | +15 | -5 | 20 to 30 | Dog playground, NPC dogs, fetch field, bandstand |
| Riverside Trail | 2 | 5 min | -25 | +20 | -10 | 35 to 50 | Bridge, ducks to chase, river leaves |
| Maple Woods | 5 | 6 min | -30 | +25 | -15 | 50 to 70 + treasure | 3 dig spots per walk with treasure |
| Seashell Beach | 8 | 6 min | -30 | +30 | -20 | 60 to 80 + shells | Sand digging, wave splashing |

A walk needs at least 20 Energy. Below that the dog yawns at the gate and the game suggests a nap; this is a nudge, not a lock-out. Each walk also gives 8 to 15 Bond points, scaled by length.

**Walk events**

- **Sniff spots** (4 to 6 per walk): tap to let the dog sniff for 2 seconds. Reveals a coin (1 to 5 Paw Coins), a collectible, or a funny reaction.
- **Collectibles:** coins, leaves, shells and acorns go into the Collection Album. Each completed set of 10 pays 100 Paw Coins. Duplicates turn into 2 Paw Coins.
- **Neighbours:** 1 to 3 NPC dog-and-owner pairs per walk. Tap to greet: +5 Happiness, +2 Bond points, plus compliments for outfits. Regulars remember the dog's name after 3 meetings.
- **Distractions:** ducks, squirrels or a ball cross the path. The leash tugs; tap "Steady" within 2 seconds to keep going, or let the dog chase for a short +5 Happiness detour.
- **Digging** (Maple Woods, Seashell Beach): tap a glinting patch, then rub to dig. Treasure is 10 to 50 Paw Coins or a rare collectible. Noodle gets +1 dig spot.
- **Puddles:** walking through costs -5 Cleanliness; tap "Hop" to jump over.
- **Daily weather:** sunny, cloudy, rainy or snowy, rolled once per real day. Weather changes the art, the NPCs you meet and the outfit perks above.

At the end of a walk a summary card shows coins, collectibles, Bond points and a photo moment of the dog at the route's landmark.

## Economy & progression

A regular player earns about 250 Paw Coins a day and spends 15 to 45 of it on food, so about 200 a day goes toward items and houses. Bond is a separate track: it grows from all care, gates areas, tricks and items, and never goes down.

**Paw Coin sources (typical day, two sessions)**

| Source | Paw Coins | Typical per day |
| --- | --- | --- |
| Walks | 20 to 80 per walk, plus 1 to 5 per sniff spot | 100 (2 walks) |
| Fetch | 2 to 3 per catch, max 30 per session | 40 |
| Daily care bonus (first feed, pet and play of the day) | 10 each | 30 |
| Trick show at Sunny Park | 25, once a day | 25 |
| Collection Album | 100 per set of 10, 2 per duplicate | 25 |
| Mailbox gift (no streak, no penalty for missed days) | 20 | 20 |
| Outfit compliments on walks | 3 to 5 each | 10 |
| **Total** |  | **about 250** |

**Paw Coin sinks**

| Sink | Price range (Paw Coins) | Full set costs | Kind |
| --- | --- | --- | --- |
| Dog houses (5 to buy) | 300 to 5,000 | 10,100 | One-time, long-term goal |
| Clothes (8) | 50 to 250 | 890 | One-time |
| Toys (6) | 40 to 150 | 500 | One-time |
| Food | 5 to 30 per meal | 15 to 45 a day | Recurring |
| Pupcake | 60 | 1 a day max | Optional treat |

The full catalogue costs about 11,500 Paw Coins, roughly 8 weeks of regular play. Home Yard decoration after launch extends that runway. Prices never rise and items never wear out.

**Bond points.** Meals give 2 (4 in the Puzzle Feeder), petting 3, a toy session 5, a trick 4, a neighbour greeting 2, a walk 8 to 15, and the daily care bonus 20. A typical two-session day gives about 120 Bond points, more when the dog is Glowing or after a Pupcake.

*[Embedded chart/diagram - see the original doc]*

Early levels arrive every 1 to 2 days so new players see unlocks quickly; later levels stretch to 4 to 6 days.

**Bond unlocks**

| Bond | Areas | Tricks | Items and houses |
| --- | --- | --- | --- |
| 1 | Home Yard, Market Street, Paw Haven Shelter, Sunny Park | Sit | Tennis Ball, Squeaky Duck, Rope Tug, Plush Bone, Red Bandana, Cardboard Box |
| 2 | Riverside Trail | Paw | Bow Tie, Yellow Raincoat, Classic Wooden Doghouse |
| 3 | Sunny Park dog playground | Lie Down, belly rubs | Frisbee, Party Hat, Flower Crown |
| 4 |  | Roll Over | Puzzle Feeder, Knit Winter Sweater, Cozy Cottage |
| 5 | Maple Woods | Spin | Heart Sunglasses |
| 6 |  | Play Dead | Superhero Cape, Snow Igloo |
| 7 |  | Speak | Treehouse Den |
| 8 | Seashell Beach | Dance |  |
| 9 |  | Bow | Royal Castle Kennel |
| 10 | Best Friends badge and photo frame | Signature trick |  |

## Game flow & screen map

A new player goes from the title screen to free play in about 5 minutes, and after that the Home Yard is the hub that every screen returns to. No screen is more than two taps from the Home Yard.

*[Embedded chart/diagram - see the original doc]*

The tutorial teaches one action per step (feed, pet, throw, nap) and gives the starter kit. The first walk is always Sunny Park and ends with the first Paw Coins, which points the player toward Market Street. Locked routes show on the Town Map with their Bond level, so goals stay visible.

## UI/UX

The dog is always the centre of the screen and the HUD stays in thin bands at the top and bottom, so every action is one tap from the Home Yard. All UI uses cream panels, deep cocoa text and rounded corners from the bible palette.

### HUD layout

| Region | Desktop (landscape 16:9) | Phone (portrait) |
| --- | --- | --- |
| Top left | Bond heart with level number and a progress ring | Same |
| Top centre | Four round meters: Hunger, Happiness, Energy, Cleanliness | Meters in a row under the Bond heart |
| Top right | Paw Coins counter, settings cog | Same, coins above settings |
| Centre | The dog and the current scene | Same; the camera crops to the dog |
| Bottom bar | Feed, Play, Walk, Wardrobe, Town Map (5 buttons, icon + label) | Same 5 buttons in thumb reach, 56 px tall |
| Pop-up trays | Pantry and toy box slide up from the bottom bar | Same, half-screen sheet |

Meters show their number on hover (desktop) or long-press (touch). A meter under 25 pulses gently and its icon changes shape (for example, an empty bowl), so state never depends on colour alone.

### Controls

| Action | Mouse | Touch | Keyboard |
| --- | --- | --- | --- |
| Select, buy, confirm | Click | Tap | Enter |
| Pet | Drag on the dog | Drag on the dog | Hold P, arrow keys to choose a zone |
| Feed | Drag food to the bowl (or click food) | Drag or tap food | 1 opens the pantry |
| Throw (fetch) | Drag back and release | Flick | Space to charge, release to throw |
| Teach or do a trick | Gesture on the dog, or pick from the trick menu | Same | T opens the trick menu |
| Walk | Hold the mouse button to walk | Hold anywhere | Hold the right arrow |
| Navigate screens | Bottom bar, map pins | Same | 1 to 5 for the bottom bar, Esc goes back |

Every gesture has a button alternative in the trick and play menus, so no action needs fine motor control.

### Feedback

- **Stat change:** the meter fills with a soft bounce, and a small "+15" floats up from the dog.
- **Coins:** coins fly from where they were earned to the counter, with a light chime.
- **Bond:** hearts pop from the dog on petting; a level-up plays a 3-second celebration and an unlock card.
- **Dog reactions:** each action has a reaction animation and a short bark or sound, in the dog's personality.
- **Haptics:** short vibrations on catches and level-ups where the browser supports it (Android Chrome), off by default on desktop.
- **No harsh signals:** no red flashes, no countdowns, no loss sounds.

### Accessibility

- Text size setting (100%, 125%, 150%) and a high-contrast UI theme.
- Reduced motion: removes screen bounce, particles and camera moves, and respects the system setting.
- Hold actions can be switched to toggle (tap once to start, once to stop).
- Captions for all meaningful sounds ("Frost howls happily").
- Separate volume sliders for music, effects and dog voices.
- Full keyboard navigation with visible focus rings; menus are real HTML so screen readers can read them.
- Colour-blind-safe meters: each state has an icon and a fill level, never colour alone.

### Save system

- **Autosave** to IndexedDB 2 seconds after any change, and on tab hide or close. There is no manual save button.
- **One save** per browser in version 1, with a versioned schema and migration on load.
- **Away time:** on load the game applies decay for the time away, capped at the away floors, and shows a "While you were away" card (the dog napped, the mailbox has a gift).
- **Backup:** export and import a save file (JSON) from Settings.
- **Cloud sync (optional, after the vertical slice):** sign in by email link to sync one save across devices; last-write-wins with a conflict prompt showing both dogs' Bond and coins.
- **Clock safety:** decay uses the larger of saved time and server time when online, so changing the device clock gives no rewards.

## Art & audio direction

Paw Haven uses cute chibi vector art: big heads at about a 1:1 head-to-body ratio, round shapes and soft pastel colour. Everything should feel warm, sunny and soft, like a picture book.

**Visual style**

- **Characters:** thick soft outlines in a darker shade of each fill (never black), simple cel shading with one shadow tone, blush cheeks and sparkly eyes. Each breed keeps its bible coat colours; Frost has blue eyes, and Pepper's black-and-white patches are generated per save.
- **Palette:** mint green grass, soft blue sky, sand beige paths, honey wood, cream UI panels with deep cocoa text, and coral-pink and sunflower-yellow accents. No generic purple gradients.
- **Clothes:** drawn once per item and fitted to each breed's head, eyes, neck and body attachment points, so all 8 items work on all 6 dogs.
- **Environments:** layered flat backgrounds (3 to 4 parallax layers on walks) with gentle idle motion: swaying grass, drifting clouds, ripples.
- **Animation set per dog (minimum):** idle, walk, run, sit, eat, sleep, happy wag, sad droop, pet reaction per zone, catch, dig, 10 tricks.
- **UI:** rounded cream panels, chunky icons with the same soft outlines, a rounded sans-serif typeface.

**Audio**

- **Music:** gentle acoustic loops (ukulele, glockenspiel, soft piano), one theme per area, 60 to 90 seconds each, crossfading on area change. Night versions after launch.
- **Dog voices:** short, cute, non-realistic barks and sounds per breed; Frost's howl is the signature sound.
- **Effects:** soft, rounded sounds for UI taps, coins, eating, splashing and digging. Nothing harsh or loud.

Full art and animation preview: [Paw Haven Art Preview](https://claude.ai/artifact/XYyjFg4VAbtJToeZ7Uetya)

Alternative art directions under review: [Paw Haven Style Study](https://claude.ai/artifact/6WhRg9HMgYo7P7ziwZqbm6) compares eight styles: chibi vector, realistic illustration, soft 3D pet sim, anime creature, cozy village, chibi × animated, doodle sketch and ugly hand-drawn.

## Tech stack & architecture

The recommended stack is TypeScript with PixiJS for the game view, a small Preact layer for menus, and Vite for builds, with saves in IndexedDB. It is all static files, so hosting is a CDN and the game runs offline as a PWA.

| Area | Choice | Why |
| --- | --- | --- |
| Language | TypeScript (strict) | One typed codebase for game logic, UI and tools |
| Build | Vite | Fast reload, code splitting per map area, simple PWA plugin |
| Rendering | PixiJS 8 (WebGL, WebGPU when available) | Light and fast 2D; we need layered sprites, not physics. Phaser 3 is the alternative if the team prefers built-in scenes |
| Dog animation | Spine 2D with the PixiJS runtime | Two shared rigs cover 6 breeds; clothes are attachments on head, eyes, neck and body slots. Evaluate Rive as a fallback in pre-production |
| UI layer | Preact + CSS over the canvas | Real HTML for text, focus, screen readers and text scaling |
| Audio | Howler.js | Reliable playback and unlock on mobile Safari |
| Local save | IndexedDB (idb library), persistent storage requested | Survives reloads; larger and safer than localStorage |
| Offline and install | PWA via vite-plugin-pwa (Workbox) | Offline play and home-screen install |
| Cloud sync (optional) | Supabase: email-link sign-in, one JSON save per player | Small managed backend, added after the vertical slice |
| Testing | Vitest for the core; Playwright smoke tests on Chromium, WebKit and Firefox | Economy and decay rules are tested without graphics |
| Hosting | Static CDN (Cloudflare Pages or Netlify) | Low cost, global, instant rollbacks |

*[Embedded chart/diagram - see the original doc]*

The game core never touches the renderer. Scenes send player input to the core and draw whatever state it publishes, so rules can be tested headless and art can be swapped without code changes.

**Asset pipeline**

1. Artists draw in vector (SVG source) following the bible's style and palette.
2. Dogs are split into parts and rigged in Spine; each clothing item is a set of attachments fitted per rig.
3. Backgrounds, props and icons are exported as SVG, then rasterised by a build script into PNG and WebP texture atlases at 1x and 2x (TexturePacker CLI or free-tex-packer).
4. Atlases load in bundles per area, so walks load only their route. Budgets: first load under 8 MB; each area bundle under 3 MB.
5. All prices, decay rates and unlock levels live in content JSON validated by a schema, so designers can tune numbers without code.

## Build plan

Version 1 takes about 30 weeks (7 months) with a core team of two, and a playable vertical slice is ready at week 13. A third person (a second developer) would shorten content production by about 3 weeks.

| Role | Who | Load |
| --- | --- | --- |
| Developer and game designer | 1 person | Full time, weeks 0 to 30 |
| Artist and animator | 1 person | Full time, weeks 0 to 30 |
| Composer and sound designer | Contractor | About 5 weeks in total, from week 9 |
| Optional second developer | 1 person | Full time, weeks 7 to 28 |

*[Embedded chart/diagram - see the original doc]*

**Phases and exit criteria**

1. **Pre-production (weeks 0 to 3).** Paper prototype of the loop, one dog rigged in Spine with two outfits, PixiJS and save tech spike. Exit: style and rig lock, so every later dog and outfit reuses the same rigs.
2. **Core prototype (weeks 3 to 7).** Greybox Home Yard, the four stats with decay, feeding, petting, fetch, autosave. Exit: petting and fetch feel good on a phone and a laptop.
3. **Vertical slice (weeks 7 to 13).** Final art for Shiba Inu and Corgi, adoption flow and tutorial, Sunny Park walk, Kibble Corner and Bow-Wow Boutique with 3 items each, Cardboard Box and Classic Wooden Doghouse, Bond 1 to 3, first music track. Exit: 10 to 15 outside playtesters play 20 minutes unprompted, and 70% say they want to come back tomorrow.
4. **Content production (weeks 13 to 23).** All 6 breeds, 8 clothes, 6 toys, 6 food items, 6 dog houses, 4 walk routes, 10 tricks, Bond 1 to 10, Barkitecture, Collection Album, weather, all audio. Exit: content complete and every unlock reachable.
5. **Polish and closed beta (weeks 23 to 28).** Accessibility options, performance on low-end phones, economy tuning from telemetry, closed beta with 100 to 200 players, cloud sync if in scope. Exit: no blocking bugs and 60 fps on target devices.
6. **Launch prep and launch (weeks 28 to 30).** Store page, trailer GIFs, press kit, final build to CDN, launch at week 30, then a two-week patch window.

## Risks, scope cuts & open questions

The biggest risk is animation volume: 6 breeds, 8 clothing items and about 25 animations each. Skeletal animation with shared rigs is the main mitigation, and the cut list below protects the launch date.

**Risks**

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Animation and clothing combinations overrun the art budget | High | High | Two shared rigs (short-legged and long-legged dogs); clothes as rig attachments; lock the rig in pre-production |
| Gestures feel unreliable on touch screens | Medium | High | Generous hit zones, gesture tests in the prototype, button alternatives for every gesture |
| Mobile browser performance (older iPhones, low-end Android) | Medium | Medium | Texture atlases at 1x and 2x, 60 fps budget checks each milestone, reduced-effects mode |
| Safari clears IndexedDB after 7 days without a visit | Medium | High | Request persistent storage, prompt PWA install, offer export and cloud sync |
| Economy too fast or too slow | Medium | Medium | All numbers in data files; tune from vertical-slice playtests and anonymous opt-in telemetry |
| Content runs out after 4 to 8 weeks | Medium | Medium | Collections and weather add variety; plan Home Yard decor and a second dog as the first update |

**Scope cuts, in order, if the schedule slips**

1. Signature tricks (Bond 10) become one shared trick.
2. Seashell Beach ships in the first update; Bond 8 unlocks Dance and a house discount instead.
3. Clothing colour variants move to after launch (already planned).
4. Cloud sync ships after launch; export and import cover backups.
5. Four breeds at launch instead of six (keep Shiba Inu, Corgi, Golden Retriever, Shelter Mutt).

Never cut: no-fail design, all four care stats, the six features from the brief (adopt, feed, shop, house, play, walk), or saving.

**Open questions**

- Monetization: free with optional cosmetic packs, a one-time paid unlock, or fully free? The no-pay-to-win rule holds either way.
- Adopting more dogs at the shelter: first update, or a later expansion? Affects the save schema now.
- Real-time day and night cycle and real-calendar seasons, or a fixed sunny day with weather only?
- Should neighbours be other players' dogs (asynchronous visits) or only NPCs? Online features need moderation.
- Distribution: our own site only, or also itch.io and web game portals at launch?
- Name check: confirm the "Paw Haven" title is clear for trademark and domain use.

