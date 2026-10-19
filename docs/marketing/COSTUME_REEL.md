# "Stop the video to dress Noodle" Halloween Reel

Made 19 Oct 2026 (owner's request, format like the "find the one that suits you" Reels). Files are in `brand/instagram/launch/costume_reel/`.

| File | What |
|---|---|
| `doodle-doggo-costume-reel.mp4` | 1080 x 1920, 30 fps, 18 s, H.264 + AAC. Loops cleanly (it ends on Noodle in the same spot it starts). |
| `costume-reel-cover.jpg` | The cover: six costumes under "Pick Noodle's Halloween costume". The title and the cards sit in the grid's 3:4 crop. |
| `build_costumes.js` | Remake: `NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/costume_reel/build_costumes.js <workdir>` (`ONLY=frames` for the stills and the cover only). |

## What is in it

- **0 to 1.6 s:** the hook. "STOP the video to dress Noodle 🎃", 止めてヌードルに仮装させよう！, with Noodle (no costume) in the game's Halloween yard at dusk, Mt. Fuji behind.
- **1.6 to 16 s:** a new look every 0.2 s, shuffled each round, never the same twice in a row. Each look has its name on a paper label (readable when paused) and "comment what Noodle got 👇".
- **16 to 18 s:** the end card. "Play free on itch.io", @doodledoggo.app, 無料で遊べます, and "costumes: Pumpkin Patch Pop-up, until 2 Nov".
- **The 18 looks** are every Halloween piece in the game (`CLOTHES` with `fest: 'halloween'`), worn alone, plus some combinations:
  - the 2026 Pop-up pieces: Witch Hat, Vampire Cape, Candy Corn Bandana, Bat Wings, and the v2.11.1 costumes (Pumpkin Patch Suit, Trick-or-Treat Ghost, Little Bat Costume);
  - the festival pieces: Ghost Sheet, Pumpkin Suit, Parade Rosette;
  - combinations: Witch Hat + Vampire Cape, Witch Hat + Candy Corn Bandana, Witch Hat + Bat Wings, Bat Wings + Candy Corn Bandana, Vampire Cape + Parade Rosette, Witch Hat + Pumpkin Suit, "The Full Witch" (hat, bandana and cape);
  - and one joke: "No costume (he drew himself)".
- Real art only (`PawArt.dog('dachs', { outfit })`, `PawArt.scene('yard')` with Halloween on). No game buttons or menus.
- Music: the game's own engine (`mods/pawaudio.js`), the Town Square at dusk, a sparkle when the costumes start and a "discover" chime on the end card.

## When to post

**Sun 25 Oct, 20:30 JST** (the informative posts take 20, 22, 24 and 27 Oct, and the Halloween image post 3 is on Thu 29 Oct). Share it to your Story the same evening. Then reply to comments in Noodle's voice ("Noodle says the Vampire Cape is very dramatic, not at all bitey").

1. Instagram, "+", Reel, upload the `.mp4`.
2. Cover: choose `costume-reel-cover.jpg`.
3. Sound: keep "Original audio".
4. Caption below.

**Caption**
```
Stop the video to dress Noodle! 🎃🐶
Pause (or screenshot) and that is his Halloween costume. Comment what Noodle got 👇

18 looks, all from the game: the Witch Hat, the Vampire Cape, the Pumpkin Patch Suit, the Trick-or-Treat Ghost, the Little Bat Costume and more. The 2026 pieces are at Mrs. Plum's Pumpkin Patch Pop-up in Doodle Doggo until 2 Nov (Japan time), and they are yours to keep.

Play free on itch.io (link in bio) 🎮

止めてヌードルの仮装を決めよう！🎃

#halloween #dogcostume #cozygames #doodledoggo #dachshund #indiegame #ハロウィン #犬の仮装
```
**Alt text:** `Noodle the crayon dachshund flashes through 18 Halloween costumes in a yard with Mt. Fuji behind.` (97 characters)

**Story sticker idea:** a poll, "Witch Hat 🧙 or Pumpkin Patch Suit 🎃?", with a link sticker to the itch.io page.
