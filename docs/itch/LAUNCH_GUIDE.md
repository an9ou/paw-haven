# itch.io launch guide: Doodle Doggo

Your page: https://an9ou.itch.io/doodle-doggo (a draft, so only you can see it for now). Everything below is on its **Edit game** page: log in to itch.io, open your Dashboard, click Doodle Doggo, then **Edit game**. The page is one long form, so you scroll from top to bottom. Click **Save** at the bottom after changes. Nothing becomes public until you click **Publish** (or switch Visibility to Public), and that is the last step.

**Who does what:** Claude uploads the game file (the zip) from its own session, after the Cloudflare login ships. You do not need to upload anything by hand. Everything else (text, pictures, settings) you paste in yourself using the files named below.

## Part 1. The Edit game page, field by field

| Field | What to put | Why |
|---|---|---|
| **Title** | Doodle Doggo | The game's name. |
| **Project URL** | doodle-doggo (already set) | It gives you an an9ou.itch.io/doodle-doggo link. |
| **Short description or tagline** | 🖍️ Adopt a wobbly crayon pup to love | Shown under the title in search results and on cards. Keep the crayon emoji, it is the brand line. |
| **Classification** | Games | You are making a game, not a tool or asset pack. |
| **Kind of project** | **HTML** | This tells itch.io the game plays inside the web page. |
| **Uploads** | The zip `doodle-doggo-itch.zip`, with **"This file will be played in the browser"** ticked | Claude does the upload. When the file appears in the list, make sure that box is ticked next to it. |
| **Embed options: Viewport dimensions** | **1280** wide, **720** tall | The size of the game window. It matches the game's own shape. |
| **Embed options: Mobile friendly** | Tick it. Orientation: **Portrait** | The game works on phones held upright. |
| **Embed options: Automatically start on page load** | Tick it | The game opens straight away, so players do not need to press Run game first. |
| **Embed options: Fullscreen button** | Tick it | Lets players go fullscreen. It is the best way to play on a phone. |
| **Embed options: Scrollbars** | Leave off | The game never needs them. |
| **Embed options: Click to launch in fullscreen** | Leave off | Not needed. |
| **Pricing** | **No payments** (free). Read the note below before choosing donations. | The game is free to play. |
| **Description** | Open `docs/itch/PAGE_TEXT.md`, copy everything, paste it into the box. | The text on your page. The box understands the same formatting as the file (headings, bold, bullet lists). |
| **Genre** | **Simulation** | Pick one main genre. |
| **Tags** | cozy, cute, dogs, pets, casual, relaxing, hand-drawn, wholesome, virtual-pet, browser | itch.io allows up to 10 tags. Type each one and press Enter. |
| **Custom noun** | Leave empty (it says "game") | Not needed. |
| **Release status** | **Released** | The game is playable and finished enough to be called released. |
| **AI generation disclosure** | **Yes**: code and art were made with Claude, directed by a human | itch.io asks for this honestly. It is also stated at the bottom of the page text. |
| **Cover image** | `brand/itch/cover-630x500.png` | The big picture on cards and search. Minimum is 315x250 and 630x500 is what we made. |
| **Screenshots** | Five desktop pictures `brand/itch/screenshot-1-winter-yard.png` to `screenshot-5-new-year.png`, then the phone one `screenshot-phone-393x852.png` | Upload in that order. The first one shows first on the page. |
| **Gameplay video** | Leave empty for now | Optional. |
| **Community** | Choose **Comments** (the "Add a comments section" option) | Players can say hi, and you can answer them. A full discussion board is optional, so leave it off to keep it simple. |
| **Visibility and access** | Keep **Draft** until the checklist in Part 2 is finished. Then use **Public**. | Draft means only you can see it. |

### About the pricing choices

- **Free (no payments)** is the simplest and the right start. You can change it later.
- **Donations** ("Pay what you want", with a minimum of $0) lets players tip you. To receive real money, itch.io makes you finish the **Payout** and **tax interview** first: it asks where your money should go (PayPal or bank) and some tax questions (a form like W-8BEN for people outside the US). Until that is done you cannot take payments. It takes about 15 minutes. You can start with Free and add donations later without losing anything.
- Sparkle in the game is never paid and dogs are never sold, so donations are only a thank-you tip. Do not promise anything in return.

### Pictures and where they live

| Picture | File | Goes in |
|---|---|---|
| Cover (with Noodle) | `brand/itch/cover-630x500.png` | Cover image |
| Screenshots 1 to 5 | `brand/itch/screenshot-*.png` (1280x720) | Screenshots |
| Phone screenshot | `brand/itch/screenshot-phone-393x852.png` | Screenshots (last) |

(The screenshots show v2.8: the winter yard, the winter Square, a walk with Mt. Fuji, Fuji View Hill and New Year. They are made by `brand/itch/make_screenshots.js`, so they can be retaken for a later version.)

## Part 2. Before you click Publish: checklist

Do these on the **draft** page. Open https://an9ou.itch.io/doodle-doggo while you are logged in: you can see and play a draft, and nobody else can.

1. **Desktop test.** Open the page on a computer. Press Run game if it does not start by itself. Adopt a dog, feed it, take it on a walk and go to the town map. Nothing should look broken, and the game fills the frame.
2. **Phone test.** Open the page on your phone (log in to itch.io there so you can see the draft). Hold the phone upright and tap the fullscreen button. Play for a few minutes. Buttons must be easy to tap.
3. **Saves stay.** Play a little, close the tab, open the page again and press **Continue**. Your dog and coins must still be there. Try it on the phone too.
4. **Export and Import.** In Settings, press **Export save code** and copy the code. Then press **Import save code**, paste it and check it loads your game.
5. **The dev button is gone.** Look at the bottom right of the yard (on a phone, the top right). There must be no small "dev" button anywhere, and the dev panel must never appear. (Claude removed it from the itch.io copy and tests that.)
6. **Name check.** Search itch.io for "Doodle Doggo" and a few close spellings. Make sure no other game uses the same name or a nearly identical one, so players find you and not someone else.
7. **Page check.** View the page as a visitor would (Visibility stays Draft, but use the "View page" link). Read the text once for typos. The cover, six screenshots, tags and genre must all show.
8. **Account login.** If the Cloudflare login is live by then, test Make an account and Log in on the itch.io copy, and put the privacy page link (`docs/itch/PRIVACY.md`) on your page or in the description. If it is not live, the page text already says accounts are coming soon.
9. **Payout** only if you chose donations: finish the Payout and tax interview.

When every box is ticked, set **Visibility to Public** and click **Save**.

## Part 3. Launch day

1. **Pick the moment.** A weekday afternoon or evening in Japan time works fine. Halloween is a good hook: the game has the Halloween 2026 Pumpkin Patch Pop-up until 2 November.
2. **Instagram post.** Use the Halloween picture `brand/instagram/doodle-doggo-instagram-halloween-1080.png` (Noodle in the Witch Hat and Candy Corn Bandana). If that PNG is not in your folder, it is exported from `doodle-doggo-instagram-halloween.svg` next to it. Caption idea:

   > 🎃 Noodle has a new home on itch.io!
   > 🖍️ Adopt a wobbly crayon pup to love. A cozy dog game you can play free in your browser, on your phone or your computer.
   > Link in bio. 🐾

   Put the itch.io link in your Instagram bio (see `brand/instagram/bio.md`). Hashtags: #cozygames #dogsofinstagram #indiegame #itchio #wholesomegames #crayonart.
3. **Devlog on itch.io.** On your Dashboard, open the game and click **Add devlog**. Title: "Doodle Doggo is out: meet Noodle". Three or four short paragraphs: what the game is, what is new in the latest version (v2.8), the Halloween pop-up, and a thank you. Attach the cover or one screenshot. Devlogs also show to people who follow you.
4. **Answer comments** in the first few days. Short and kind is perfect.
5. **A week later**, check the numbers on your Dashboard (views, plays) and write a small thank-you devlog if people like it.
