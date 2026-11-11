# Story mode: Gerald's Big Book of Town (v2.29)

Owner's request (11 Nov 2026): "add story mode, like players need to perform tasks to gain xp, bonding, coins. Also short story
videos like 10s or more when the player achieved something, or reached a new place." Owner's choices in the choice window:

- Scenes are **animated in the game**, not video files: drawn live with the game's own crayon art (the player's own dog with its coat and
  outfit, Gerald, the place scenes), camera pans and zooms, simple tweened moves, a caption per shot through `tt()` (all 12 languages).
- **Skipping**: a scene plays by itself the first time; a Skip button shows after 3 seconds. Every scene stays in a **Memories** album.
- **Story mode is a main story alongside free play**: about 8 chapters with Gerald and the townsfolk, unlocking as you play; each chapter has
  tasks that give XP (the v2.22 town level), Bond and coins and ends with a scene. Free play stays as it is.

Contract: `V229.md`. Code: `game/src/57_scenes.js` (the scene engine, tag `sc`), `game/src/57b_story.js` (the story, tag `sm`),
`game/css/59_scenes.css`. Suite `v229_story`.

## 1. Premise and tone

Gerald the duck, who "lives by the river and knows everything", has decided the town needs a storybook: **Gerald's Big Book of Town**, a
crayon scrapbook with one page per chapter. Every good book needs a hero, and he has picked the player's dog. He follows along, writes
everything down, crosses half of it out and writes it again, neater. A running joke from his guide letter ("I still want my sandwich back")
threads through the book: the Great Sandwich Mystery, solved in chapter 8 (he used it as a bookmark on page one).

Tone: the game's voice. Short, warm, a little silly, never mean; the dog is the hero and Gerald is lovably wrong about small things (the map
upside down, the shopping list on his own head). Nothing bad ever happens: nobody is lost, sick or sad for long, there is no deadline and no
fail state; a task only ever moves forward. The townsfolk of release E's neighbour stories (Mrs. Plum, Rosa at the café, Pip, the mail
carrier) can wave, lend a hand or say a line, but their own arcs stay in their letters (V228.md 3): the main story never retells them.

## 2. The eight chapters

Rewards are paid once, the moment a task is done (a gold toast), and again for the whole chapter when its last task is done. XP goes through
`lvGain('story', n)`, a milestone source outside the 150-a-day cap; Bond through `addBond(n, { raw: true })` to the active dog; coins through
`addCoins(n, { raw: true })`. A chapter opens when the one before ends; a task counts only the acts done while its chapter is open. A task
that needs a place or a feature waits, without a timer, until the town level opens it (part 2: the Story page shows "Opens at level N").

| # | Title | Place it opens or celebrates | Tasks (each: XP / Bond / coins) | Chapter reward | End scene |
| - | --- | --- | --- | --- | --- |
| 1 | **A New Friend in Town** | Home Yard | fill the food bowl; three good pets; play with a toy or a ball; a nap (10 / 3 / 10 each) | 30 / 10 / 40 | "Home sweet home": the dog strolls to its spot and sits, hearts float up, Gerald waddles in and writes |
| 2 | **Walkies!** | Sunny Park | two walks (not headed home at the start); visit Sunny Park; find a treasure on a walk; take a photo (15 / 5 / 15 each) | 40 / 15 / 60 | "The big walk": a pan across the park as the dog runs, Gerald on the bench with the map upside down |
| 3 | **The Missing Shopping List** | Market Street, Town Square, Pupuccino Café | buy anything in a Market Street shop; visit the Town Square; visit the café; finish the day's mission (20 / 5 / 20 each) | 50 / 15 / 80 | "Found it!": the list was under Gerald's hat all along; the dog sniffs it out |
| 4 | **Paws at the Dog Park** | Dog Park (level 2) | reach town level 2; visit the Dog Park; play ball 3 times; say hello to a visiting Dog Card dog (paw) or play with a second dog (20 / 6 / 20 each) | 60 / 20 / 90 | "Best friends": a zoom on two dogs sharing one stick, mostly |
| 5 | **The Sandwich Tree** | the veggie patch, Pip's Sprout Cart (level 2) | buy seeds; plant; water 3 times; harvest (20 / 5 / 20 each) | 60 / 15 / 90 | "Not a sandwich": Gerald hoped to grow sandwiches; it is a carrot. The dog is delighted anyway (Pip waves from the cart) |
| 6 | **Splash, Sit, Stay** | Splash Pool (3), Training Ground (4) | visit the Splash Pool; a paddle in the pool; learn a new trick; an agility run (25 / 6 / 20 each) | 70 / 20 / 100 | "Gold rosette": the dog clears the last jump in slow motion, Gerald holds up a 10 he drew himself |
| 7 | **The Mountain and the Train** | Mt. Fuji Lookout (3), the Station and Shibuya (6) | gaze at Mt. Fuji; reach Bond 5 with any dog; ride the Shinkansen; visit Hachikō at Shibuya (25 / 8 / 25 each) | 80 / 25 / 120 | "Postcard from Tokyo": the train slides past the mountain, the dog's nose on the window |
| 8 | **The Big Book Party** | Town Square | reach town level 10 (Friendly Neighbour); 10 walks during the chapter; 3 photos; a gift to a friend or a wish granted (30 / 10 / 30 each) | 120 / 30 / 150 | "The end (for now)": the whole town in the Square, the book on a table, the sandwich falls out from page one |

Totals: 8 chapters, 32 tasks. Coins: 80 + 120 + 160 + 170 + 170 + 180 + 220 + 270 = **1,370** over the whole story, paid once, spread over
weeks (chapters 4-8 wait for town levels 2-10, about day 3 to day 20 for a regular player). Even a keen player who finishes chapters 1-3 on
day one earns 360 story coins once, against 100+ a day from walks forever: walks stay the main income (economy-review.md). XP: 960 in all,
about 6 days of the daily cap, so the story speeds the level climb a little without skipping it. Bond: about 340 points, a few walks' worth.

Part 1 (this branch) builds chapters 1-2 in full. Chapters 3-8 are specified here; the Story page lists their titles and says that Gerald
is still writing the next one ("it comes in an update, and nothing you do in the meantime is lost").

## 3. Scenes

A scene is 10-15 seconds, 2-3 shots. Each shot: a background (a place drawn by `sceneArt`, or a sketchbook card), the actors (the player's
active dog in its coat and outfit, in any pose and face; Gerald in his four poses; a crayon book; floating doodles), a camera move (pan and
zoom with easing), and one caption. Card shots carry a title (the chapter heading). A PawAudio stinger starts it (`discover` for a new place,
`levelup` for a chapter).

When scenes play (automatically, once each):

| Scene | When |
| --- | --- |
| prologue "Gerald's big idea" | the story starts: a new save after Puppy's first day with Gerald, or an old save with no chapter earned |
| ch1 ... ch8 | the chapter's last task |
| visit_park, visit_market (part 1); later: the Dog Park, the Splash Pool, the Training Ground, the Mt. Fuji Lookout, the Station, the Beach | the first trip to that place |
| Big moments (part 2): Bond 5 and Bond 10 with a dog, the first puppies coming home, town levels 5, 10, 15, 20 | the moment it happens, after its own card |
| catchup "The story so far" | once, for an old save that has already earned chapters |

Never on top of anything: a scene waits in `S.story.q` and plays only on a calm yard or Market Street (no sheet, no tray, no guide card, no
level or Bond card, not in photo or ball play), after the calendar's daily page, the What's new sheet and the While you were out page, 1.5 calm
seconds in, and at least 8 seconds after the last scene. Several queued scenes play one after another in order. Walks, trips and minigames
are never interrupted; the scene waits for home.

While a scene plays the game clock stops (`tick()` returns), the roaming dogs pause, and the overlay covers the stage. Skip shows after
3 seconds (and Escape). Skipped or not, it counts as seen and never plays by itself again. Motion off in Settings (or the system's
reduced motion): nothing moves; each shot shows its final picture and the shots cross-fade.

Size: the engine and two chapters of scripts are about 30 KB of source; scenes reuse the place art already in the build (no new images).

## 4. The Memories album

The Story page has two tabs: **Story** and **Memories (n)**. Memories lists every scene unlocked (played, or earned by an old save), with its
title, the date and a **Watch** button; a scene not watched yet shows "Not watched yet" on a yellow card. Watch closes the sheet, plays the
scene and brings the album back.

## 5. Where it lives

- Desktop: a crayon book button in the top bar, next to the camera (`#smBtn`), with a pink dot while the chapter has tasks open.
- Phones: **Story** in the "..." menu (More), next to the calendars and What's new. The phone bar (Care / Walk / Map / More) is unchanged.
- The Story page: Gerald's heading, "Chapter N of 8", the open chapter with its place and tasks (a tick, the task, its reward, n/N), the
  chapter reward line, and the eight chapters as a list (done with a tick, the open one in yellow, later ones faded).
- Part 2: a pinned line on the journal's Missions tab ("Story: 2 of 4 tasks") and the Story page linked from the level sheet.

## 6. Old saves (no flood)

`S.story` is added by `migrate()` with `from: 'old'`. On the first quiet moment the game works out the chapters the save has already earned
from what it can prove (`old(s)` per chapter, in order, stopping at the first one not earned):

- chapter 1: any walk, or any dog at Bond 2+;
- chapter 2: 5+ walks and a treasure found;
- chapters 3-8 (part 2): the matching record (a shop purchase, places in `S.lv.seen`, the town level, garden harvests, `S.ph.n` photos,
  tricks learned, Tokyo stamps).

Earned chapters are marked done (`'old'`), their scenes go into the album unwatched, the first-visit scenes of places the save has surely
seen go in too, and **one** catch-up scene plays. Gerald sends one letter, "The story so far", kept to reread, with the coins for those pages
(capped at 150) as a Collect gift; the XP is given at once; no Bond. The story then goes on from the first chapter not earned. An old save that
has earned nothing yet starts at chapter 1 with the prologue, like a new one.

## 7. Open questions for the owner

1. Catch-up pay: old saves get the XP of the chapters they earned and up to 150 coins in one letter. Recommended: keep it (a thank-you, once).
   Alternative: no coins, only the scenes.
2. Big-moment scenes (Bond 5/10, first puppies, levels 5/10/15/20): play them automatically like chapter scenes (recommended), or only add
   them to Memories with a toast.
3. Chapter 7 sends the player to Tokyo (level 6). Recommended: keep it; it waits without a timer until the Station opens.
4. Should the story ever give a keepsake (a photo frame per chapter, like release E)? Recommended: one frame at the end of chapter 8 only.
5. Translation: the scene captions are short on purpose (one sentence each, at most about 110 characters in English) so they fit at 360 px
   in every language. OK to translate them in the release's one batch?
