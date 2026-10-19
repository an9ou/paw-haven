# "Stop the video to dress Noodle" Halloween Reel

Made 19 Oct 2026 (owner's request, made like the owner's reference recording of a "find the one that suits you" Reel). Files are in `brand/instagram/launch/costume_reel/`. Only this style is made (owner, 19 Oct 2026: no style A, so no A/B test). Earlier drafts (the 18-second flash version, the "drop" version and style A) are gone.

| File | What |
|---|---|
| `doodle-doggo-costume-reel-b.mp4` | 1080 x 1920, 30 fps, 44.8 s, seamless loop, with the game's music. 64 looks, each falls once per loop. |
| `costume-reel-cover.jpg` | The cover: six costumes under "Pick Noodle's Halloween costume". |
| `build_costumes.js` | Remake: `NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/costume_reel/build_costumes.js <workdir> b` (about 10 minutes; `SPRITES=1` saves a check picture of every look fitted on Noodle, without the video). |

## What is in it

- **Fall-through:** Noodle stands still in the game's Halloween yard at dusk, Mt. Fuji behind. Each costume falls straight down, fast (0.65 s from the top edge to the bottom), right through him, one every 0.7 s. It fits him on **one frame only**, and that frame shows a small "perfect fit!" stamp. Pause a frame early or late and it misses, so stopping on the right moment is the game.
- **No intro and no end card.** The last frame flows straight into the first. A small line stays on screen the whole time: "Stop the video to dress Noodle 🎃" and 止めてヌードルに仮装させよう！. itch.io is only in the caption.
- The falling costume's name is on a paper label (readable when paused), with "comment what Noodle got 👇" under it.
- **The 64 looks** (owner: "as much variation as you can"), shuffled, each once per loop, with a name on the label:
  - **the Halloween pieces on their own (10):** Witch Hat, Vampire Cape, Candy Corn Bandana, Bat Wings, Pumpkin Patch Suit, Trick-or-Treat Ghost, Little Bat Costume, Ghost Sheet, Pumpkin Suit, Parade Champion (the Parade Rosette);
  - **Halloween combinations (18):** The Full Witch, Flying Witch, Count Noodle, Pumpkin Witch, Candy Bat, Ghost in Shades, Cool Ghost, Prize Pumpkin, Bat in Shades, Vampire Wizard, Fancy Witch, Vampire in Shades, Wizard Bat, Party Ghost, Pumpkin Pie Chef, Vampire Cowboy, Bumblebee Witch, Pumpkin Explorer;
  - **classic dress-up costumes from the whole wardrobe (36):** Bumblebee, Superhero, Super Noodle, Astronaut, Space Bee, Space Hero, Cowboy, Fancy Chef, Wizard, Grand Wizard, Ballerina, Frog, Frog Princess, Sleepyhead, Sailor, Explorer, Rock Star, Party Animal, Reindeer, Festival Dancer, Scarecrow, Painter, Gardener, Rainy Day, Bubble Bath, Ugly Sweater Champion, Cozy Day, Polka Dot Party, Tokyo Tourist, Scramble Explorer, Flower Fairy, Beach Day, Snow Day, Lucky Festival, Ski Trip, Bee in Shades.
  - Which items make each look: `LOOKS` at the top of `build_costumes.js`. Combinations leave out pieces the game's art hides (a hat under a costume's own head piece, a neck item under a ghost sheet).
- **How the costumes fit exactly:** each falling costume is cut out of the game's own drawing of Noodle wearing it (Noodle with the costume minus plain Noodle, pixel by pixel). Body pieces get a strong clean-up of stray crayon lines; hats, glasses and neck pieces are cut on their own with a light one, so thin parts survive. On the fitting frame it sits exactly where the game puts it.
- **Real art only:** `PawArt.dog('dachs', { outfit })` and `PawArt.scene('yard')` with Halloween on. No game buttons or menus.
- **Sound:** the game's own music engine (`mods/pawaudio.js`), the Town Square at dusk, crossfaded end into start so the loop has no seam, plus a quiet crayon whoosh as each costume passes Noodle.

## When to post

**Fri 23 Oct, 20:30 JST** (a free day: the informative posts take 20, 22, 24 and 27 Oct, and the Halloween image post 3 is on Thu 29 Oct). Share it to your Story the same evening, and again on Sat 31 Oct. If it does well, pin it on Thu 29 Oct until Halloween is over.

How to post: Instagram, "+", Reel, upload the `.mp4`, cover `costume-reel-cover.jpg`, keep "Original audio", paste the caption.

## Caption

```
Stop the video to dress Noodle! 🎃🐶
Pause (or screenshot) right when a costume falls onto him. It does not always fit! Comment what Noodle got (or your best near miss) 👇

64 looks, all from the game's wardrobe: a witch, a vampire, a pumpkin, a ghost, a bumblebee, an astronaut, a superhero and many more. The 2026 Halloween pieces are at Mrs. Plum's Pumpkin Patch Pop-up in Doodle Doggo until 2 Nov (Japan time), and they are yours to keep.

Play free on itch.io (link in bio) 🎮

止めてヌードルの仮装を決めよう！🎃

#halloween #dogcostume #cozygames #doodledoggo #dachshund #indiegame #ハロウィン #犬の仮装
```
**Alt text:** `Noodle the crayon dachshund in a yard with Mt. Fuji as 64 costumes fall through him.` (84 characters)

**Story sticker idea:** a poll, "Did you get a perfect fit? Yes 🎃 / So close 😭", with a link sticker to the itch.io page.

**What to check after 48 hours** (Reel insights): average watch time and replays (the loop is the point), comments (the call to action), saves and shares. Use what works for the next "dress Noodle" Reel (winter sweaters, New Year).
