# Update posts (25 Oct 2026, owner: "create posts for the new updates")

Three posts for the three new releases, 1080 x 1350, English, real game screens and the game's real art (with the v2.15.2 inside-the-lines fills). Files are in `brand/instagram/launch/updates/`. A new random dog for each: Bruno the Cane Corso, a Great Dane, a Border Collie.

| Post | Files (post in this order) |
|---|---|
| **1. v2.15 "A Bigger Town"** (carousel) | `bigger-town-1-cover.jpg`, `-2-splash-pool.jpg`, `-3-training-ground.jpg`, `-4-map.jpg` |
| **2. v2.16 "First Week"** (carousel) | `first-week-1-cover.jpg`, `-2-calendar.jpg`, `-3-bond2-party.jpg`, `-4-phone-menu.jpg` |
| **3. v2.15.2 "Inside the lines"** (single image) | `inside-the-lines.jpg` |

Remake: `node game/build.js && node game/harness.js merged`, then `NODE_PATH=$(npm root -g) node brand/instagram/launch/updates/capture_v215.js <shots>` (the map, Training Ground and Splash Pool screens), then `NODE_PATH=$(npm root -g) node brand/instagram/launch/make.js <shots> updates` (`make_updates.js`). Post 2 uses the release's own phone shots in `docs/release/v2.16/`. Post 3's "before" is the dog art at commit a1c4d11.

## 1. A Bigger Town

```
The town just got bigger 🐾🗺️
Swipe for what's new in Doodle Doggo:
💦 Splash Pool: a daily paddle, a free life vest and floating fetch (open all winter under the Winter Dome)
🏅 Training Ground: agility for every dog, with a gentle course for puppies and seniors. No fails, every run earns rosettes
🗺️ A redrawn town: winding roads, every building a button, shops with their own storefronts, and 3 new run tracks

Play free at doodledoggo.app, link in bio.
Support the game on Ko-fi: ko-fi.com/doodledoggoapp

#doodledoggo #cozygames #indiegame #doglovers #gameupdate #cozygaming
```
**Alt text:** 1 `"The town just got bigger": a phone showing the new Doodle Doggo town map, and a crayon Cane Corso in an orange life vest.` · 2 `The Splash Pool on a phone: a black crayon dog in a life vest paddling, saying "Everything is damp and I love it."` · 3 `The Training Ground on a phone: a crayon dog running an agility course through a tunnel, with a big Go! button.` · 4 `The redrawn town map on a phone, with winding roads and little buildings.`

## 2. First Week

```
Your first week with a crayon puppy 🐶✨
New in Doodle Doggo:
🦆 A guided first day: Gerald shows you the ropes, and most players reach Bond 2 in minutes
🎉 The Bond 2 party: confetti, a free Bow Tie and your dog's very first Paw
📅 A monthly calendar: every day you play stamps a paw, with gifts at 3, 7, 12, 18 and 24 days. Missing a day never costs anything
📱 Simpler on phones: 4 big buttons

Play free at doodledoggo.app, link in bio.
Support the game on Ko-fi: ko-fi.com/doodledoggoapp

#doodledoggo #cozygames #indiegame #doglovers #gameupdate #cozygaming
```
**Alt text:** 1 `"Your first week with a crayon puppy": a phone with Gerald the duck guiding a new player, and a crayon Great Dane in a bow tie.` · 2 `The new calendar on a phone: a welcome week with gifts and an October page of paw stamps.` · 3 `The Bond 2 party screen on a phone, with a free Bow Tie, and a crayon Great Dane giving a paw.` · 4 `The simpler phone menu with four big buttons: Care, Walk, Map and More.`

## 3. Inside the lines

```
Big news: we learned to colour inside the lines 🖍️
Every dog, every outfit and every house in Doodle Doggo now keeps its colour inside its pencil outline.
(They are still very wobbly. That part stays.)

Play free at doodledoggo.app, link in bio.

#doodledoggo #cozygames #indiegame #crayon #handdrawn #doglovers
```
**Alt text:** `Before and after close-ups of a crayon Border Collie: before, its white fill spills past the outline; now, the colour stays inside the lines.`
