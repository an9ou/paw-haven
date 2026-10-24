# Marketing: owner's standing rules

For every Marketing session (branch `marketing/launch`). Read these with `CLAUDE.md` before starting.

- **Captions are not sent in chat unless the owner asks (owner, 19 Oct 2026).** The owner usually posts later, so captions sent in chat get lost. Write every caption, alt text and hashtag set into the right doc in `docs/marketing/` and tell the owner which doc and section to find them in. When the owner asks for captions ("send me Noodle's caption"), paste them in chat.
- **Images and videos are sent with SendUserFile** when a piece is finished.
- **Every Reel gets a designed cover (owner, 23 Oct 2026).** Not just a frame from the video: a cover page made for it, with a short title, the art and the logo. Keep everything that matters inside the middle 1080 x 1440 (y 240 to 1680), which the profile grid shows. Send it with the video.
- **Ads only (owner, 23 Oct 2026).** From now on Marketing makes Reels and pictures for ads, nothing else (no devlogs, carousels or posts made only for the feed unless the owner asks).
- **A different dog each time (owner, 23 Oct 2026).** Do not always use Noodle: pick a dog at random from the 35 for each new ad (for example the Chihuahua), and avoid repeating the last one or two. Dogs used lately, newest first: the Mastiff (11-languages post, 23 Oct), the Chihuahua (snack ad, 23 Oct).
- **"3D" means depth with the real dogs (owner, 23 Oct 2026).** When an ad should feel 3D (like the cozy-game ads with 3D animals), keep the game's real crayon dog and build the depth around it: layers moving at different speeds, depth of field, soft round shadows, light rays and floating light, a slow camera move. Never redraw the dogs in 3D or shade them: the ad must show the dogs players get.
- **Fixing a video: re-render only the changed part (owner, 21 Oct 2026).** Never re-render a whole video for a fix to one part. Keep the frames of the last full render (copy its workdir), re-render only the frames that changed and encode again with the same music. The birthday Reel takes `FRAMES=a-b` for this (see `BIRTHDAY_DOG_REEL.md`); give any other video script the same option before fixing it. Re-render the whole video only when the change touches every frame (timing, length or something on screen the whole time).
- **English only, no Japanese (owner, 21 Oct 2026).** No Japanese text in images, videos or captions, and no Japanese hashtags, for everything made from now on. (Older captions in these docs still carry a Japanese line; drop it when you reuse one.) Japan-style scenery in the art is fine.
- **Words:** never "ugliest"; never "breed" as a verb; never "sell" for dogs; never "made in Japan" (say "Japan-style"); no 🇯🇵 flag. The build also rejects "nintendo", "pokémon" and "animal crossing".
- **The game is live:** say "play free on itch.io" (https://an9ou.itch.io/doodle-doggo), link in bio. Instagram is @doodledoggo.app.
- **Support link (24 Oct 2026, from the Game Manager):** the owner's Ko-fi page is https://ko-fi.com/doodledoggoapp (bio and first post: `docs/marketing/KOFI_INTRO.md` on main). Use it as the support link in future posts, alongside itch.io.
- **Site links (21 Oct 2026):** the game plays right on https://doodledoggo.app (say "play right on doodledoggo.app", never "tap Play at itch.io on our site"). The How to play page, https://doodledoggo.app/guide, is the link for "new here? start here" posts.
- **The Noodle story videos never show game UI.**
- **Reports:** no progress updates; report when the whole task is done, and send the Game Manager a one-line done note.
