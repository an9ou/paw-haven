# Marketing handoff (30 Oct 2026)

Branch `marketing/launch` (main merged at v2.18.3). The owner installed Instagram skills: check which help with Reels and captions.
1. Waiting for the owner's approval of the English versions:
   - `brand/instagram/launch/trick_reel/doodle-doggo-trick-or-treat.mp4`: dogs spaced on the ending page, no bucket.
   - `brand/instagram/launch/safe_reel/doodle-doggo-is-this-safe.mp4`: kitchen background with no words.
2. After approval, make the RedNote cuts: `REDNOTE=1 NODE_PATH=$(npm root -g) node brand/instagram/launch/<trick_reel/build_trick.js|safe_reel/build_safe.js> <workdir>`, then copy the `-rednote` mp4 and cover jpg next to the English ones. The RedNote files in the repo are old (old legs and music).
3. Captions (IG, Shorts, X, RedNote) are in `docs/marketing/TRICK_REEL.md` and `SAFE_REEL.md`. The dancing Reel is in `FREESTYLE_REEL.md`; the RedNote profile and the hello post are in `REDNOTE.md`.
4. Owner rules from 29–30 Oct:
   - Render the English version first; make the RedNote version only after approval.
   - RedNote never shows the game link ("搜索 Doodle Doggo" instead).
   - Instagram captions are English only; RedNote is Simplified Chinese with the game's own zh-Hans names.
   - Background text must not compete with on-screen notes.
   - Halloween Reels use the approved Halloween lo-fi beat (`brand/instagram/launch/spooky_lofi.js`).
   - Ignore Instagram's safe zone in Reel reviews: our Reels have no problem with it (owner, 30 Oct 2026).
   - Captions: draft every caption the way TRICK_REEL.md and SAFE_REEL.md are done (owner, 30 Oct 2026: "next time draft in same way"):
     Instagram: line 1 is the one ask (comment or save), not the on-screen hook again; the search phrases people type in the text; 5 hashtags at most; no link (it's in the bio); plenty of emoji inside the sentences and at line ends (about 2–3 per 100 characters), never as bullets at the start of lines.
     Shorts title and X post use the strongest scored hook (`ig-reel` hookscore). X stays under 280 with the link counted as 23.
     Check with `.claude/skills/ig-caption/caption.py` (READY) and `.claude/skills/ig-human/detect.py` (PASS) for every English text, and write the receipt under each caption. RedNote is checked by hand (the game's zh-Hans names, no link, title 20 characters at most).
5. Reel scripts load the game art with an in-between-pose patch (see `build_dance.js`). If the art changes, the anchors throw "art changed: …": update the anchor string.
6. Ideas not made yet (owner liked the list): pause-to-pick costume, star-sign dogs, pick a door 1/2/3, rainy-day wet dog, Fun Fair speedrun, "other pet games vs Doodle Doggo", dog diary.
