# The TikTok intro (8 Nov 2026)

The owner asked: "Can u create a short intro video for tiktok". One file, made the same way as the v2.19 Friends Reel (`FRIENDS_LAUNCH.md`, "The Reel") and told by Noodle the dachshund, like our first video (`PROMO_VIDEO_45S.md`).

**File:** `brand/instagram/launch/intro_tiktok/doodle-doggo-intro-tiktok.mp4`. It is 1080 x 1920 (9:16), 30 fps, 19.5 s, H.264 + AAC, 8.4 MB. Noodle's voice (Kokoro `af_bella`, 1.1x) plays over the game's own music (the yard by day) at 30%, and the "discover" sting plays on the end page. The music fades out over the last 2.5 s. The voice sits about 11 dB above the music.

Everything on screen is the live game of 8 Nov 2026 (main 0c98aa1, v2.23.1): autumn by day, with no festival on screen. Nothing from the Winter Market or anything unreleased appears. The game's interface is hidden, so only the scenes show. The 40 dogs are the game's own `PawArt.DOGS`, counted at build time; the build stops if the number is not 40.

## Shots

| # | Time | Shot | Noodle says | On screen |
|---|---|---|---|---|
| 1 | 0:00 | Noodle in the Home Yard, petted, hearts (Mt. Fuji behind the fence) | "Hi! I'm Noodle. I drew myself!" | "a cozy dog game / where the dogs / drew themselves", plus a drawn pink crayon (Caveat has no emoji) |
| 2 | 0:02.7 | A paper page: twelve of the 40 crayon dogs pop in (Shiba, Corgi, Golden, Beagle, Pug, Husky, Pom, Cavalier, Chihuahua, Frenchie, Akita, Lab; the game's own art, happy pose) | "Pick one of forty crayon dogs!" | "40 crayon dogs" |
| 3 | 0:05.4 | Mt. Fuji Lookout: Noodle walks in along the path past the torii | "Walk a little pencil town, all the way to Mount Fuji!" | "walk to Mt. Fuji" |
| 4 | 0:09.1 | Three quick cuts: Noodle in the Bumblebee Suit and Heart Sunglasses, then ball play (he brings the ball back, "ta-da!"), then the veggie patch with ripe pumpkins, carrots and sweet potatoes | "Dress up, play ball, grow a garden!" | "dress up · play · garden" (each word inks in with its cut) |
| 5 | 0:12.1 | Noodle in front, with Udon and their two puppies (Soba, Ramen) in the back row, all apart, hearts | "And nothing bad ever happens. Ever." | "nothing bad / ever happens" (green card, two hearts) |
| 6 | 0:15.2 | End page on paper: our standard end card (owner, 9 Nov 2026: "can we add the social media and website at the end card of the reels"; `brand/kids/endcard.js`), moved onto TikTok's centre line | "Doodle Doggo! Free, in your browser. Come play with me!" | The logo, **doodledoggo.app**, Instagram **@doodledoggo.app**, X **@doodledoggoapp**, YouTube **@DoodleDoggoApp**, each with its icon, and "free · play in your browser" under them. No QR code. It replaces the old end page (Noodle hopping, "free · no download"), so the length is unchanged. |

**Safe area (TikTok):** all our words and boxes sit inside x 60..850, y 170..1500. That keeps them clear of TikTok's right-hand buttons (x > 860), its caption and name (the bottom ~380 px) and its tabs (the top ~150 px). Noodle stays inside that area too. Where the phone screen would put his feet under the caption, the screen is lifted over the sketchbook paper with a pencil edge, as in the Friends Reel. On every frame, the build checks that each text is ink-centred (`centreCheck`), inside the safe area (`safeCheck`) and that no two dogs come closer than 28 px (`apartCheck`).

## How to rebuild (about 10 minutes)

```
git worktree add --detach <dir> origin/main; cd <dir> && node game/build.js && node game/harness.js merged && cd -
export NODE_PATH=$(npm root -g)
node brand/instagram/launch/intro_tiktok/capture_intro.js <dir> <footage>        # STILLS=1 for stills only; scene names to redo some (hook fuji dress ball garden pups)
VO_LINES=brand/instagram/launch/intro_tiktok/vo_intro.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo>
node brand/instagram/launch/intro_tiktok/build_intro.js <dir> <footage> <work> <vo>   # ONLY=stills: one key frame per shot; FRAMES=a-b: re-render those frames, then encode (TIMES=1 lists each shot's frames); writes <work>/doodle-doggo-intro-tiktok.mp4
```

- **Kokoro:** run `pip install kokoro-onnx soundfile`. Put `kokoro-v1.0.int8.onnx` and `voices-v1.0.bin` (github.com/thewh1teagle/kokoro-onnx/releases, model-files-v1.0) in `<kokoro dir>`. Never commit them.
- **The capture:** `capture_intro.js` turns on the live features that the harness keeps off under webdriver: the v2.15 map and floors, Japan and the Mt. Fuji Lookout, and faces. It sets the dog idle speed to 200, so Noodle doesn't lie down mid-shot. The ball shot is filmed at 6x, because its crop is wide and the build zooms in on Noodle. The capture hides the ball's aim ring, the game's floating words, and the garden's header, tools, hints and little dog window.
- **Re-used pieces:** `friends_reel/capture_friends.js` (the slowed page clock, `slowInit`), `friends_reel/vo_friends.py` (the voice) and `centre_text.js` (centring and checks, with TikTok's safe area swapped in).

## TikTok caption

```
hi, i'm noodle and i drew myself ✏️ a cozy dog game where all 40 dogs are wobbly crayon doodles 🐶

walk a little pencil town to mt. fuji, dress up, play ball, grow a garden. and nothing bad ever happens, ever 🍂

free in your browser, no download: search Doodle Doggo or tap the link in bio 🐾

#DoodleDoggo #CozyGames #DogGames #IndieGame
```

There is one ask (play: search Doodle Doggo, or use the link in bio) and 4 hashtags, with no em dashes. TikTok links aren't clickable in captions, so the caption has no URL.

Nothing is posted by Marketing: posting is the owner's.
