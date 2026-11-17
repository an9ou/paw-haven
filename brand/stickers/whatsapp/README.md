# Noodle stickers for WhatsApp

16 die-cut stickers of Noodle, the Doodle Doggo dachshund, plus a tray icon. Only for the owner to look at: nothing here is posted anywhere.
Look at `preview.jpg` first: all 16 on WhatsApp-like light and dark chat backgrounds.

## The set

| # | File | Word | Pose + face (PawArt) |
|---|------|------|----------------------|
| 1 | `noodle-01-hi` | hi! | paw + wink |
| 2 | `noodle-02-yay` | yay! | jump + wow |
| 3 | `noodle-03-love-you` | love you | sit + hearts |
| 4 | `noodle-04-thank-you` | thank you | bow + hearts |
| 5 | `noodle-05-sorry` | sorry… | down + guilty (the art says "oops") |
| 6 | `noodle-06-yum` | nom nom | sit + yum (the art says "yum!") |
| 7 | `noodle-07-good-night` | good night | sleep (+ a small moon) |
| 8 | `noodle-08-omg` | omg | idle + surprised |
| 9 | `noodle-09-hmm` | hmm? | sit + curious |
| 10 | `noodle-10-on-my-way` | on my way! | walk + zoomies |
| 11 | `noodle-11-lol` | lol | rollover |
| 12 | `noodle-12-im-dead` | I’m dead | playdead |
| 13 | `noodle-13-lets-dance` | let’s dance | dance + zoomies |
| 14 | `noodle-14-pls` | pls? | beg + curious |
| 15 | `noodle-15-achoo` | bless me! | sit + sneeze (the art says "achoo!") |
| 16 | `noodle-16-so-proud` | so proud | happy + proud |

Each sticker is a `.webp` (for WhatsApp) and a `.png` copy. `tray.png` is the pack icon (Noodle's head with heart eyes).

## Specs (WhatsApp)

- Stickers: exactly 512 x 512, transparent background, a clear 16 px margin on every side, WebP at most 100 KB (these are 27–43 KB).
- Tray icon: 96 x 96 PNG, at most 50 KB (this one is about 7 KB).
- A pack needs 3 to 30 stickers; this set has 16.
- The dogs are the game's own art (`PawArt.dog('dachs', …)`, from `origin/main`), unchanged except that the faint ground shadow under the dog is left out, since a sticker has no ground.

## Adding them to WhatsApp

WhatsApp has no "import a folder" button of its own, so pick one of these:

1. **WhatsApp's own sticker maker (iPhone, WhatsApp Web, WhatsApp Desktop).** Open any chat, tap the sticker icon, then **Create** (the + / "Create sticker" tile), choose one of the `noodle-…png` files from Photos or your computer, and send or save it. Repeat for each sticker you want. They land in your own stickers, not in a named pack.
2. **A free sticker-maker app (Android or iPhone)**, for a real named pack with the tray icon: for example "Sticker Maker" (Viko & Co). Copy the 16 `.webp` (or `.png`) files and `tray.png` to the phone, make a new pack called "Noodle", set `tray.png` as the tray icon, add the stickers, then tap **Add to WhatsApp**.

## Rebuilding

`make_stickers.js` makes everything here and checks it (sizes, margins, no part touching another, file limits). How to run it is in its header comment.
