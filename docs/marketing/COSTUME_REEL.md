# "Stop the video to dress Noodle" Halloween Reels (A/B test)

Made 19 Oct 2026 (owner's request, format like the "find the one that suits you" Reels). Files are in `brand/instagram/launch/costume_reel/`. The first 18-second version (with an intro and an end card) was a draft and is replaced by these two.

| File | What |
|---|---|
| `doodle-doggo-costume-reel-a.mp4` | **Style A, "flash"**: 1080 x 1920, 30 fps, 36 s, seamless loop. Noodle's costume changes every 0.5 s. |
| `doodle-doggo-costume-reel-b.mp4` | **Style B, "the drop"**: 1080 x 1920, 30 fps, 35.7 s, seamless loop. Each costume falls from the top, wobbles, lands on Noodle with a squash, a sparkle and a soft thud; the old one pops off and falls out of the bottom. One landing every 0.7 s. |
| `costume-reel-cover.jpg` | The cover for both (the same cover, so the test compares only the motion): six costumes under "Pick Noodle's Halloween costume". |
| `build_costumes.js` | Remake: `NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/costume_reel/build_costumes.js <workdir> [a\|b\|both]`. |

## What is in them

- **No intro and no end card.** The last frame flows straight into the first, so the loop has no start or end. A small line stays on screen the whole time: "Stop the video to dress Noodle 🎃" and 止めてヌードルに仮装させよう！. itch.io is only in the caption.
- **The same stage for both:** Noodle in the game's Halloween yard at dusk, Mt. Fuji behind. The costume name sits on a paper label (readable when paused), with "comment what Noodle got 👇" under it.
- **The looks** are every Halloween piece in the game (`CLOTHES` with `fest: 'halloween'`), worn alone, plus some combinations, in a shuffled order (each look once per round, never twice in a row):
  - the 2026 Pop-up pieces: Witch Hat, Vampire Cape, Candy Corn Bandana, Bat Wings, and the v2.11.1 costumes (Pumpkin Patch Suit, Trick-or-Treat Ghost, Little Bat Costume);
  - the festival pieces: Ghost Sheet, Pumpkin Suit, Parade Rosette;
  - combinations: Witch Hat + Vampire Cape, Witch Hat + Candy Corn Bandana, Witch Hat + Bat Wings, Bat Wings + Candy Corn Bandana, Vampire Cape + Parade Rosette, Witch Hat + Pumpkin Suit, "The Full Witch" (hat, bandana and cape);
  - A also has one joke look, "No costume (he drew himself)". B leaves it out, because nothing would fall.
- **Real art only:** `PawArt.dog('dachs', { outfit })`, `PawArt.item` (the falling costumes in B are the game's own item drawings), `PawArt.scene('yard')` with Halloween on. No game buttons or menus.
- **Sound:** the same music for both: the game's own engine (`mods/pawaudio.js`), the Town Square at dusk, crossfaded end into start so the loop has no seam. B adds a quiet crayon whoosh and a soft thud on each landing.

## Captions (nearly identical, so the motion is the only real difference)

**A**
```
Stop the video to dress Noodle! 🎃🐶
Pause (or screenshot) when you like a costume, and that is his Halloween look. Comment what Noodle got 👇

17 looks, all from the game: the Witch Hat, the Vampire Cape, the Pumpkin Patch Suit, the Trick-or-Treat Ghost, the Little Bat Costume and more. The 2026 pieces are at Mrs. Plum's Pumpkin Patch Pop-up in Doodle Doggo until 2 Nov (Japan time), and they are yours to keep.

Play free on itch.io (link in bio) 🎮

止めてヌードルの仮装を決めよう！🎃

#halloween #dogcostume #cozygames #doodledoggo #dachshund #indiegame #ハロウィン #犬の仮装
```
**B**
```
Stop the video to dress Noodle! 🎃🐶
Pause (or screenshot) when a costume lands, and that is his Halloween look. Comment what Noodle got 👇

17 looks, all from the game: the Witch Hat, the Vampire Cape, the Pumpkin Patch Suit, the Trick-or-Treat Ghost, the Little Bat Costume and more. The 2026 pieces are at Mrs. Plum's Pumpkin Patch Pop-up in Doodle Doggo until 2 Nov (Japan time), and they are yours to keep.

Play free on itch.io (link in bio) 🎮

止めてヌードルの仮装を決めよう！🎃

#halloween #dogcostume #cozygames #doodledoggo #dachshund #indiegame #ハロウィン #犬の仮装
```
**Alt text (both):** `Noodle the crayon dachshund changes into Halloween costumes in a yard with Mt. Fuji behind.` (91 characters)

How to post: Instagram, "+", Reel, upload the `.mp4`, cover `costume-reel-cover.jpg`, keep "Original audio", paste the caption. Share each to your Story the same evening.

## A/B plan

**When:** both on a weekday evening at the same time, 3 days apart, before 31 Oct, on days with no other post:
- **A: Fri 23 Oct, 20:30 JST**
- **B: Mon 26 Oct, 20:30 JST**

(The informative posts take 20, 22, 24 and 27 Oct, and the Halloween image post 3 is on Thu 29 Oct.)

**What to compare** (Instagram app, the Reel, "View insights"), each at **48 hours** after posting (A on Sun 25 Oct 20:30, B on Wed 28 Oct 20:30). Write the numbers in a small table, and divide by "Accounts reached" so a bigger audience on the second day doesn't skew it:

| Metric | Where | Why |
|---|---|---|
| Plays and accounts reached | Overview | size of the audience (for the per-reach rates) |
| Average watch time | Reel insights | does the motion hold people |
| Replays (plays ÷ initial plays, or "watch time" ÷ 36 s) | Reel insights | the loop is the point |
| Comments per 1,000 reached | Interactions | the "what did Noodle get" call to action |
| Saves and shares per 1,000 reached | Interactions | would people show it to friends |
| Follows from the post | Profile activity | new followers |

**How to pick the winner:**
1. The **primary** metrics are average watch time, the replay rate and comments per 1,000 reached. The style that wins **2 of these 3** wins.
2. If it is 1–1 with one too close to call (within 10 %), the style with more **saves + shares per 1,000 reached** wins.
3. If it is still level, keep **A** (simpler to make for future events).

**After the test:** pin the winner on Thu 29 Oct (in place of a banner tile, or unpin it after Halloween), share it to your Story again on Sat 31 Oct, and if you run an ad, use the winner. Use the winning motion for the next "dress Noodle" Reel (winter sweaters, New Year).
