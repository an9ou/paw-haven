# "Stop the video to dress Noodle" Halloween Reel

Made 19 Oct 2026 (owner's request, made like the owner's reference recording of a "find the one that suits you" Reel). Files are in `brand/instagram/launch/costume_reel/`. Only this style is made (owner, 19 Oct 2026: no style A, so no A/B test). Earlier drafts (the 18-second flash version, the "drop" version and style A) are gone.

| File | What |
|---|---|
| `doodle-doggo-costume-reel-b.mp4` | 1080 x 1920, 30 fps, 36 s, seamless loop, with the game's music. |
| `costume-reel-cover.jpg` | The cover: six costumes under "Pick Noodle's Halloween costume". |
| `build_costumes.js` | Remake: `NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/costume_reel/build_costumes.js <workdir> b` (about 7 minutes). |

## What is in it

- **Fall-through:** Noodle stands still in the game's Halloween yard at dusk, Mt. Fuji behind. Each costume falls straight down, fast (0.8 s from the top edge to the bottom), right through him, one every 0.9 s. It fits him on **one frame only**, and that frame shows a small "perfect fit!" stamp. Pause a frame early or late and it misses, so stopping on the right moment is the game.
- **No intro and no end card.** The last frame flows straight into the first. A small line stays on screen the whole time: "Stop the video to dress Noodle 🎃" and 止めてヌードルに仮装させよう！. itch.io is only in the caption.
- The falling costume's name is on a paper label (readable when paused), with "comment what Noodle got 👇" under it.
- **The 17 looks**, shuffled (each once per round, never twice in a row), are every Halloween piece in the game (`CLOTHES` with `fest: 'halloween'`) plus combinations:
  - the 2026 Pop-up pieces: Witch Hat, Vampire Cape, Candy Corn Bandana, Bat Wings, and the v2.11.1 costumes (Pumpkin Patch Suit, Trick-or-Treat Ghost, Little Bat Costume);
  - the festival pieces: Ghost Sheet, Pumpkin Suit, Parade Rosette;
  - combinations: Witch Hat + Vampire Cape, Witch Hat + Candy Corn Bandana, Witch Hat + Bat Wings, Bat Wings + Candy Corn Bandana, Vampire Cape + Parade Rosette, Witch Hat + Pumpkin Suit, "The Full Witch" (hat, bandana and cape).
- **How the costumes fit exactly:** each falling costume is cut out of the game's own drawing of Noodle wearing it (Noodle with the costume minus plain Noodle, pixel by pixel, with thin stray crayon lines cleaned away), so on the fitting frame it sits exactly where the game puts it.
- **Real art only:** `PawArt.dog('dachs', { outfit })` and `PawArt.scene('yard')` with Halloween on. No game buttons or menus.
- **Sound:** the game's own music engine (`mods/pawaudio.js`), the Town Square at dusk, crossfaded end into start so the loop has no seam, plus a quiet crayon whoosh as each costume passes Noodle.

## When to post

**Fri 23 Oct, 20:30 JST** (a free day: the informative posts take 20, 22, 24 and 27 Oct, and the Halloween image post 3 is on Thu 29 Oct). Share it to your Story the same evening, and again on Sat 31 Oct. If it does well, pin it on Thu 29 Oct until Halloween is over.

How to post: Instagram, "+", Reel, upload the `.mp4`, cover `costume-reel-cover.jpg`, keep "Original audio", paste the caption.

## Caption

```
Stop the video to dress Noodle! 🎃🐶
Pause (or screenshot) right when a costume falls onto him. It does not always fit! Comment what Noodle got (or your best near miss) 👇

17 looks, all from the game: the Witch Hat, the Vampire Cape, the Pumpkin Patch Suit, the Trick-or-Treat Ghost, the Little Bat Costume and more. The 2026 pieces are at Mrs. Plum's Pumpkin Patch Pop-up in Doodle Doggo until 2 Nov (Japan time), and they are yours to keep.

Play free on itch.io (link in bio) 🎮

止めてヌードルの仮装を決めよう！🎃

#halloween #dogcostume #cozygames #doodledoggo #dachshund #indiegame #ハロウィン #犬の仮装
```
**Alt text:** `Noodle the crayon dachshund in a yard with Mt. Fuji as Halloween costumes fall through him.` (91 characters)

**Story sticker idea:** a poll, "Did you get a perfect fit? Yes 🎃 / So close 😭", with a link sticker to the itch.io page.

**What to check after 48 hours** (Reel insights): average watch time and replays (the loop is the point), comments (the call to action), saves and shares. Use what works for the next "dress Noodle" Reel (winter sweaters, New Year).
