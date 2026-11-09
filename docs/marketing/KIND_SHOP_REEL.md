# "Kind shop" Reel: we opened a shop, you can't buy a dog in it

> **LIVE (9 Nov 2026, GM confirmed): the Kind shop is out (v2.24) on doodledoggo.app, itch.io 2.24 and GitHub Pages. Post now, in the owner's order: the Reels first, then the carousel.** Final names and prices (live catalog): Supporter Pack US$4.99 once; Tokyo Street US$2.99 or 600 coins each; Cozy Winter US$2.99 or 600 coins each; Robo Scoop US$1.99 or 4,000 coins; Garden Sprinkler and Auto Water Bowl US$0.99 or 2,500 coins each; Comfort Kit US$2.99; coins 1,000 / 3,000 / 8,000 for US$0.99 / 1.99 / 4.99. The released branch's item art and words match what these were built from. No rewarded ads yet: never mention ads. Captions stay without prices (kind, no pressure); "from US$0.99" is true if the owner wants a price line in English captions. Never on RedNote.


> **PREPARED FOR LAUNCH, do not post before the owner's date.** The kind shop is v2.24, built on the branch `claude/kind-shop` and gated by
> `SHOP_LIVE = false` (aim: early December 2026). It goes live only after the owner's go-ahead and launch date (CLAUDE.md, special-update rule).
> The owner posts this Reel on launch day. Marketing hears the date from the Game Manager; nothing here is posted, scheduled or uploaded before that.

One English Reel that introduces the shop and every kind of thing in it, told by Noodle the dachshund like our recent Reels. Every word follows the
contract `V224.md` and `docs/design/kind-shop.md` on `origin/claude/kind-shop` (read 9 Nov 2026, branch head `e3ef9aa9`). The trust message is the
shop rule itself: *"We sell coins and looks, never dogs, Bond, welfare or chances. No loot boxes or random paid rewards, and the game is complete
without paying."* No prices, countdowns, "limited", "best deal" or "buy now" anywhere in the video.

| File | |
|---|---|
| Video | `brand/instagram/launch/shop_reel/doodle-doggo-kind-shop.mp4` (34.4 s, 1080 x 1920, 30 fps, H.264 + AAC stereo, -16 LUFS; ends on our standard end card since 9 Nov 2026) |
| Cover | `brand/instagram/launch/shop_reel/shop-cover.jpg` (1080 x 1920; owner, 9 Nov 2026: "different from the reels, eye catching". Its own design, never a frame: a bright pink crayon colour block with a sunburst, the hook **Our new shop has / NO dogs in it!** big with a white outline, Noodle big in the Tokyo Street set and Little Sneakers on a yellow sticker, five item pictures on white stickers (Golden Paw Cottage, Doggy Snow Globe, Robo Scoop, Cocoa Mug Lamp lit, Golden Name Tag), a yellow **NEW!** burst; all key content inside the 1:1 crop y 420..1500, the logo inside the 4:5 crop. The hook reads at 200 px wide) |
| RedNote video | `brand/instagram/launch/shop_reel/doodle-doggo-kind-shop-rednote.mp4` (42.7 s, 1080 x 1920, 30 fps; everything in Simplified Chinese; ends on the RedNote end card with no QR) |
| RedNote cover | `brand/rednote/rednote-13-kind-shop.jpg` (1080 x 1440, 3:4, its own design like the English cover: **我们开店啦！ / 但不卖狗狗**, a **上新！** burst; no link, no QR) |
| Captions | all platforms in one file: `docs/marketing/captions/KIND_SHOP_CAPTIONS.md` |
| Scripts | `brand/instagram/launch/shop_reel/build_shop.js` (the Reel and the cover), `capture_shop.js` (the game footage), `vo_shop.json` (Noodle's lines) |

## Where the pictures come from

- **The real game** (the kind-shop build, `capture_shop.js`): the branch is built in a scratch worktree and played in a phone viewport (iPhone 15,
  393 x 659 at 3x) with the build's own test switch (`prefs.shopTest`, the switch the `v224_shop` suite uses; `SHOP_LIVE` in the branch stays false).
  The purchases are granted the game's own way (`ks.grant()` with made-up purchase ids, as the suite does: no Worker, no Stripe). Every bar,
  button, toast and bubble is hidden. Two scenes: the yard, where the **Golden Paw Cottage** is Noodle's dog house and Noodle (in the Tokyo Street
  set) trots over to it; and the house with the **Cozy Winter** set placed where the game puts each piece, the camera panning from the Woolly Armchair
  and the Tea-Cosy Bed to the Cardboard Fireplace, the Doggy Snow Globe and the Cocoa Mug Lamp, where Noodle lies on the rug.
- **The branch's own art** (`world/pawart_shop.js` `PawArt.SHOP` and `PawArt.item`, the wearables in `dogs/pawart_dogs.js`): the item cards and
  Noodle being dressed piece by piece by the game's own dog renderer (Sukajan Jacket, Bucket Hat, Round Shades, Paw Tote, then Little Sneakers on the
  new feet slot). The shop sheet itself is not shown (it shows prices).
- The build reads the item names, the coin prices and the "Why is there a shop?" line from the branch's `game/src/52_kindshop.js`, and the shop rule
  from `V224.md`, and stops if any of them changed. Every frame passes `centreCheck`, `safeCheck` (text and boxes inside x 60..850, y 270..1440) and
  `apartCheck` (`brand/instagram/launch/centre_text.js`). One dog per shot.

## Shots

| Time (s) | Noodle says | On screen |
|---|---|---|
| 0.0 | "We opened a shop! You can't buy a dog in it." (0.1) | Card at frame 1: **We opened a shop. / You can't buy a dog in it.** Twelve of the shop's own item pictures in a grid, plain Noodle sitting under them, pink pill **Noodle: not in the shop** |
| 2.66 | "The Supporter Pack! A golden cottage, a name tag, and a thank-you letter from Gerald." (2.78) | Pill **Supporter Pack**, the real game yard in a crayon window: Noodle trots to the Golden Paw Cottage, label **Golden Paw Cottage**. Cards pop in on the words: **Golden Name Tag**, **Founding Friend badge**, **Gerald's thank-you letter** |
| 7.90 | "He means it." | The letter card wiggles, subtitle |
| 8.74 | "Tokyo Street outfits!" (8.89) | Pill **Tokyo Street / 6 outfits**. Noodle big, the pieces going on one by one with a tick: Sukajan Jacket, Bucket Hat, Round Shades, Paw Tote; name pills (plus **Lucky Cat Charm**, one neck item at a time) |
| 10.55 | "Yes. I have sneakers now." | Little Sneakers go on, Noodle happy, pink pill **Little Sneakers**, sticker **NEW: a feet slot!**, subtitle |
| 12.31 | "Cozy Winter, for your house!" (12.43) | The real game house, full screen, panning. Pill **Cozy Winter / 6 things for your house**, card with the six names in the branch's order: Cable-Knit Rug · Cocoa Mug Lamp · Doggy Snow Globe · Cardboard Fireplace · Woolly Armchair · Tea-Cosy Bed |
| 14.18 | "The fireplace is cardboard. Don't tell anyone." | The pan ends on the Cardboard Fireplace with Noodle on the rug in front; subtitles above the fireplace |
| 16.96 | "And helpers! A Robo Scoop, a sprinkler, a water bowl. Switch them off any time." (17.11) | Pill **Comfort tools**, cards **Robo Scoop**, **Garden Sprinkler**, **Auto Water Bowl** pop on the words; a card **switch them off any time** with three switches that click off one by one on "Switch them off" and back on; pill **the hand way always works** |
| 21.86 | "No loot boxes. Never dogs. Everything but the Supporter Pack can also be earned by playing." (22.01) | Pill **Our shop rule**, four cards with green ticks, each on its words: **No loot boxes. / No random paid rewards.** · **Never dogs, Bond, / welfare or chances.** · **Looks packs and tools: / also for coins, by playing.** · **The game is complete / without paying.** |
| 27.74 to 31.87 | "Made by one person. Free to play. Thank you for helping!" (27.89) | Pills **Made by one person.** · **Free to play.** · **Thank you for helping!** on the words, Noodle sitting in the Tokyo Street set, the logo (the game's "discover" sting) |
| 31.87 to 34.37 | (none) | Our standard end card fades in over paper (owner, 9 Nov 2026; `brand/kids/endcard.js`): the logo, **doodledoggo.app**, Instagram **@doodledoggo.app**, X **@doodledoggoapp**, YouTube **@DoodleDoggoApp**, each with its icon. The music fades out under it |

Sound: Noodle (Kokoro af_bella 1.1x) at -16 LUFS; the game's own cozy yard music (`mods/pawaudio.js`) about 11 dB under the voice (~30 %), a crayon
tick per pop, a soft click per switch. Whole mix -16 LUFS, true peak -1.5.

### Changes from the draft brief, and why

- **Hook:** "We opened a shop! You can't buy a dog in it." instead of "Everything in our new shop. And none of it is a dog." It scored 77.8 (STRONG)
  on `hookscore.py` against 43.4 for the draft; same meaning, kind, no mocking.
- **Trust card line 3:** "Looks packs and tools: also for coins, by playing" instead of "earn the looks with coins too". The Supporter Pack's own looks
  (Golden Paw Cottage, Golden Name Tag) are **not** for coins (V224.md 1: Supporter Pack "Also for coins: no"), so "the looks" would not be true. Noodle's
  line follows the shop's own "Why is there a shop?" text: everything but the Supporter Pack (and the coins) can also be earned by playing.
- **Supporter beat:** the Founding Friend badge is on screen but not spoken (time). The pack's perks (2,000 coins, +20 % walk coins, faster crops,
  a second daily gift) are not in the Reel; the captions do not hide them either, they just keep to the looks.
- **Cocoa Mug Lamp:** shown unlit (the footage is daytime; the lamp lights at night). "Lit" is not claimed anywhere.
- **Length:** 34.4 s: 31.9 s of beats (a little over the 25 to 30 s target: seven beats at Noodle's speed) plus the 2.5 s end card.

## Rebuild

```
# a scratch worktree of origin/claude/kind-shop, built: node game/build.js && node game/harness.js merged
git worktree add --detach <scratch>/kindshop origin/claude/kind-shop
VO_LINES=brand/instagram/launch/shop_reel/vo_shop.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo dir>
DOG_HOUSE_TX=-160 NODE_PATH=$(npm root -g) node brand/instagram/launch/shop_reel/capture_shop.js <scratch>/kindshop <cap dir>
ART_ROOT=<scratch>/kindshop CAP=<cap dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/shop_reel/build_shop.js <workdir> <vo dir>
# ONLY=stills (STRIP=t1,t2,...) renders key frames into <workdir>/stills; ONLY=cover writes shop-cover.jpg
```
The Kokoro model files (`kokoro-v1.0.int8.onnx`, `voices-v1.0.bin`) are never committed. Once v2.24 is on `main`, `ART_ROOT` can be a main checkout.

## Re-check at launch (before the owner posts)

- **The contract.** If `V224.md` or `52_kindshop.js` changes (item names, which items are for coins, the shop rule, the "Why is there a shop?" line),
  `build_shop.js` stops with the reason: rebuild and re-read the trust card and the captions. Rebuild from the released `main` if the art changed in
  the reviews (Tokyo Street wearables, Cozy Winter pieces, the Golden Paw Cottage).
- **Prices.** None in the video or the captions. The contract prices (Supporter Pack US$4.99; Tokyo Street and Cozy Winter US$2.99; Robo Scoop
  US$1.99; Garden Sprinkler and Auto Water Bowl US$0.99; Comfort Kit US$2.99; coins from US$0.99) are the owner's 8 Nov decisions. If the owner wants a
  price in the YouTube or X text, add "from US$0.99" only after checking the live Stripe prices on launch day.
- **"Free to play" and "made by one person"** stay true (the About / FAQ pages say "free to play with an optional shop" from v2.24).
- **Where to play.** The YouTube and X texts link the itch.io page and doodledoggo.app; check both have v2.24 live before posting.
- The shop needs a cloud account (email) to buy with money; the captions do not promise anything about that, so nothing to change.

## RedNote cut

Owner, 9 Nov 2026: a RedNote version and new covers for both. `build_shop.js` with `REDNOTE=1`:
- **Words.** Every word in Simplified Chinese, LXGW WenKai. Item names and the shop rule are the kind-shop branch's own zh-Hans strings
  (`game/i18n/zh-Hans.json`: 金爪小屋, 金色名牌, 创始好友, 东京街头, 横须贺夹克, 渔夫帽, 圆圆墨镜, 爪印帆布袋, 招财猫挂饰, 小小运动鞋, 暖暖冬日, 麻花针织地毯,
  可可杯台灯, 狗狗雪花水晶球, 纸板壁炉, 毛线扶手椅, 茶壶保暖套小窝, 扫扫机器人, 花园洒水器, 自动水碗; the rule cards follow `ks.why_text` and `nw.v224.free`:
  狗狗、亲密度和运气永远不会出现在小店里, 外观也能用金币换到, 不付钱游戏也是完整的). The build stops if any of them changes. Subtitles at most 14 characters.
- **Voice.** Noodle's Mandarin voice, Kokoro v1.1-zh zf_073 at 1.0x (`../friends_reel/vo_friends_zh.py` with `VO_LINES=shop_reel/vo_shop_zh.json`):
  我们开店啦！但是不卖狗狗哦。/ 支持者礼包！金爪小屋、金色名牌，还有杰拉德的感谢信。/ 他是认真的。/ 东京街头服装！/ 没错，我现在有运动鞋了。/ 暖暖冬日，装点你的房子！/
  壁炉是纸板做的。别告诉别人。/ 还有贴心工具！扫扫机器人、洒水器、自动水碗，随时都能关掉。/ 没有盲盒。狗狗、亲密度和运气，永远不在小店里。除了支持者礼包，都能靠玩游戏得到。/
  这个游戏是一个人做的。谢谢你的支持！
- **Footage.** Captured with `PAW_LANG=zh-Hans` (the game in Chinese; the capture checks Chinese is on the page). The house's drawn signs ("home sweet home",
  "kitchen", "treats") are part of the game's art and stay English in every language; the Cozy Winter name card covers most of the sampler.
- **End card.** The RedNote card (`brand/kids/endcard.js` `endCardRN`, called with no QR): the logo, 治愈系蜡笔狗狗游戏 and only **搜 Doodle Doggo App**.
- **Anti-ban checks** (README, owner, 9 Nov 2026), run by the build on every word: no QR, no URL or dot-domain, no other platform names, no handles, none of
  链接 网址 官网 二维码 扫码 下载 私信我 加我 主页链接 戳, no 浏览器, no 免费 (left out as in the RedNote bio, so "free to play" is not said), no prices, no pressure words.
- **Length.** 42.7 s (2.5 s of it the end card): the Mandarin lines are longer.

```
PAW_LANG=zh-Hans DOG_HOUSE_TX=-160 NODE_PATH=$(npm root -g) node brand/instagram/launch/shop_reel/capture_shop.js <scratch>/kindshop <cap_zh dir>
VO_LINES=brand/instagram/launch/shop_reel/vo_shop_zh.json PYTHONPATH=<jieba 0.42.1 src> python3 brand/instagram/launch/friends_reel/vo_friends_zh.py <kokoro dir> <vo_zh dir>
REDNOTE=1 ART_ROOT=<scratch>/kindshop CAP=<cap_zh dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/shop_reel/build_shop.js <workdir_rn> <vo_zh dir>
# covers: ONLY=cover on the English build (shop-cover.jpg) and on the RedNote build (brand/rednote/rednote-13-kind-shop.jpg)
```

## Captions

All captions (Instagram, TikTok, YouTube Shorts, X, RedNote) are in one file: `docs/marketing/captions/KIND_SHOP_CAPTIONS.md`.
