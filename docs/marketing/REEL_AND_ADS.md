# The 30-second Reel (and using it for Meta ads)

Made 17 Oct 2026. Files are in `brand/instagram/launch/reel/`.

| File | Use it for |
|---|---|
| `doodle-doggo-reel-30s-play.mp4` | **When the game is live.** Ends on "Play free, link in bio". |
| `doodle-doggo-reel-30s-soon.mp4` | **Now, while the game is not published.** Ends on "Coming soon, follow to be first". |

**Out of date since v2.11:** the Reel is v2.8 footage and its "14 dog types" part shows 14 dogs (the game has 21). The captions below say 21. A refresh with v2.9+ footage and all 21 dogs is on offer.
| `reel-cover.jpg` | The cover picture (1080 x 1440, the part the profile grid shows). |

Both are 1080 x 1920 (9:16), 30 fps, 30 seconds, H.264 video with AAC sound, about 12 MB. They are identical until second 25.5, so you can test both against each other later.

## What happens in the 30 seconds

| Time | What you see | Why |
|---|---|---|
| 0 to 3 s | "Adopt a wobbly crayon pup" with Noodle bouncing in. "(he drew himself)" | The hook. It names the idea and shows the dog in the first second. |
| 3 to 8.5 s | **Real gameplay:** the yard at dusk, Noodle gets a rub. Captions "Pencil-sketch town", "Crayon dogs" | Shows the art style and that it is a real game. |
| 8.5 to 14.5 s | **Real gameplay:** Mt. Fuji Lookout, Noodle looks at Mt. Fuji. Caption "Mt. Fuji on every skyline" | The Japan angle, and the prettiest scene. |
| 14.5 to 20.5 s | A walk (real footage), then the garden, the kitchen and the house with a pack of dogs. Captions say what you can do | Shows there is a lot to do. |
| 20.5 to 25.5 s | "14 dog types": all 14 dogs run in and line up with their names (v2.8 footage; the game has 21 dogs since v2.11, so this part is out of date) | Gives a reason to come and meet them. |
| 25.5 to 30 s | Noodle with heart sunglasses. **Play free / link in bio ↑** (or **Coming soon / follow to be first**) | The call to action. |

**Sound:** the game's own music, made by the game's music engine. It is original, so there is no licence problem, and it matches the look. It fades in and out, and the loudness is set to a normal level for social video.

**Text placement:** the main words sit between about 190 px from the top and about 1560 px from the top, which keeps them clear of Instagram's top and bottom buttons. The phone footage is the biggest thing on screen.

## Posting it as a normal Reel (free)

1. Instagram app, "+" then Reel, upload the `.mp4`. Pick **`-soon`** while the game is not published.
2. Cover: choose `reel-cover.jpg`. It is the same width as the grid's 3:4 crop.
3. Sound: leave it as "Original audio". Do not add Instagram music on top.
4. Caption (pick one):

**Coming-soon caption**
```
Adopt a wobbly crayon pup 🐶🖍️
Doodle Doggo is coming soon: a cozy dog game with walks, a garden, dog-safe cooking and puppy playdates, in a pencil-sketch town with Mt. Fuji on every skyline. Free for phone and computer.

21 dog types. Which one would you adopt first? 👇
Follow along to be the first to play!

クレヨン犬のゆるいゲーム、近日公開🗻

#cozygames #indiegame #browsergame #comingsoon #doodledoggo #近日公開
```
**Game-is-live caption** (use with the `-play` file)
```
Adopt a wobbly crayon pup 🐶🖍️
Doodle Doggo is a cozy dog game: walks, a garden, dog-safe cooking and puppy playdates, in a pencil-sketch town with Mt. Fuji on every skyline. Free on phone and computer, nothing to download. Tap the link in our bio to play!

21 dog types. Which one would you adopt first? 👇

無料で遊べます！🗻

#cozygames #indiegame #browsergame #newgame #doodledoggo #無料ゲーム
```
5. Also share to your Story, and post the same file as a TikTok and YouTube Short (the sound is yours, so it is safe there too).

## Using it for Meta ads (a few honest notes)

I can make the video, but I **cannot run ads, see your account or promise results**. These are general guidelines that I could not check against your Ads Manager today, so confirm each point on screen.

- **Do not pay yet.** An ad needs a place to send people. Wait until the itch.io page (or the game link) is live and tested on a phone. Ads to "coming soon" can still work if the goal is followers (see the next point), but they usually cost more per useful click.
- **Pick the goal to match the stage:**
  - *Game not live yet:* send people to your **Instagram profile** and measure **new followers** and **profile visits**.
  - *Game is live:* use the **Traffic** goal and send people straight to the game page. In an ad you do **not** need "link in bio". The ad has its own button. Use the **`-play`** video and a button like "Play game" or "Learn more".
- **Start small.** A test of about **¥500 to ¥1,000 a day for 5 to 7 days** is a common way to learn what works before spending more (my rule of thumb, not a Meta rule). Run two ads and compare: the `-play` ending against the `-soon` ending, or two different captions.
- **Audience:** start with Japan and Japanese captions (you live there, and the game has Mt. Fuji and New Year in it). Try a second, separate English ad for the US or UK. Interests to try: casual and cozy games, dogs, mobile games. Keep the audience broad at first and let Meta find people.
- **Check the preview.** In Ads Manager, open the preview for **Instagram Reels**. It shows the area the buttons cover. Our text should be clear of it, but check that the "Play free" at the end is not hidden.
- **Look at three numbers:** how many people **stop and watch** (the first 3 seconds), the **cost for each click or follow**, and how many then **actually start the game** (itch.io shows this).
- **Rules:** do not promise anything the game does not do. "Free" is true. Do not use another game's name. Put the same words in the ad as in the game.
- **Account:** you need an Instagram professional account connected to a Facebook Page, and a payment method, to run ads.

## Remake or change it

```
sh brand/instagram/launch/reel_build.sh <workdir> <shotsdir>
```
`reel/reel.html` holds the layout and timing (change the words or timing there). `reel_footage.js` records the real gameplay, `reel_audio.js` makes the music, `reel_render.js` draws the frames, and `reel_build.sh` puts it all together. A new version takes about 3 minutes.

Ideas for more versions: a 15-second cut for ads, a winter version for 1 Dec (snowdog and Snow Days), and a Japanese-first version with Japanese captions on the video.
