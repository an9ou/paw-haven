# "Now in 11 languages" post (v2.14)

Made 23 Oct 2026 for the v2.14 "Hello in Every Language" release. The game and doodledoggo.app speak 11 languages: English, Japanese, Simplified Chinese, Traditional Chinese (Taiwan wording), Korean, Thai, Spanish, Brazilian Portuguese, French, German and Indonesian. All 7,367 game texts are translated, the game starts in the device's language, and Settings has a Language row.

The owner's English-only rule still holds for everything we write: the title, the labels and the caption are English. The other scripts appear only inside the real game screenshots, because they are the news. (The owner was asked about this; with no answer, the recommended way was taken.)

**Made 23 Oct 2026 from the shipped v2.14.1 "Room to breathe" build** (the owner asked for it after v2.14.1 shipped). The dog is **Waffles the English Mastiff**, picked at random (the last ad used the Chihuahua), in a Flower Crown, saying his own line from the game in each language: "I am not drooling. I am showing my love." (the game's translation of `jokes.mastiff.2`).

Files are in `brand/instagram/launch/languages/`:

| File | What |
|---|---|
| `languages-01-cover.jpg` | **Carousel slide 1, the designed cover** (1080 x 1350): the logo, "now in 11 languages", a fan of five real phone screens (Japanese, Thai, English, Spanish, Korean), Waffles saying "hello in every language!", the 11 language names, "swipe →". Everything that matters is inside the grid's 3:4 crop. |
| `languages-02-en.jpg` … `languages-12-id.jpg` | **Carousel slides 2–12**, one per language in the caption's order (English, Japanese, Simplified Chinese, Traditional Chinese, Korean, Thai, Spanish, Brazilian Portuguese, French, German, Indonesian): the language's English name, "N of 11 languages in Doodle Doggo", the phone screen in that language, "Waffles says:" with the line in English, Waffles, "play free at doodledoggo.app". |
| `languages-announce.jpg` | **The single image** for the feed or a 4:5 ad (1080 x 1350): all 11 screens on one page, each labelled in English. |
| `languages-announce-story.jpg` | The same for **Stories and Reels ads** (1080 x 1920); the top 250 and bottom 280 px hold nothing that matters. |
| `capture_langs.js` | Captures the 11 screens (phone portrait, 390 x 844 at DPR 3, autumn, sunny, 1 pm on a fixed clock so the place line shows no override star): `node game/build.js && node game/harness.js merged`, then `NODE_PATH=$(npm root -g) node brand/instagram/launch/languages/capture_langs.js <shotsdir> [lang ...]` (about 2 minutes; `DOG`, `NAME`, `LINE` pick another dog and line). |
| `../make_languages.js` | Lays out the 14 images from those screens: `NODE_PATH=$(npm root -g) node brand/instagram/launch/make.js <shotsdir> languages`. |

The 11 screen PNGs (1170 x 2532) stay out of git; run `capture_langs.js` to make them again.

**Posting:** as an ad, use `languages-announce.jpg` (feed) and `languages-announce-story.jpg` (Stories and Reels) with the ad text below. As a carousel, post slides 01–12 in order with the feed caption.

## Caption (feed post)

```
Doodle Doggo now speaks 11 languages 🌍🐶
English, Japanese, Simplified Chinese, Traditional Chinese, Korean, Thai, Spanish, Brazilian Portuguese, French, German and Indonesian.

Every menu, every dog line, every care tip: all 7,367 lines. The game starts in your phone's language, and you can switch any time in Settings. Our newest update gives the words more room in every language, so nothing gets squeezed.

Know someone who'd love it in their language? Tag them 👇
Play free at doodledoggo.app, link in bio.

#doodledoggo #cozygames #indiegame #doglovers #freegames #cozygaming
```
**Alt text** (one per image; Instagram lets you set it per carousel slide under Advanced settings, Accessibility):
- Cover: `The words "Doodle Doggo, now in 11 languages" over a fan of five phone screens of the game, with a crayon mastiff in a flower crown saying "hello in every language!"`
- Each language slide: `Doodle Doggo on a phone in <language>: a crayon mastiff in a flower crown says "I am not drooling. I am showing my love." in <language>.`
- Single image: `The same crayon dog scene from Doodle Doggo shown in 11 languages, each screen labelled with its language.`

## As an ad (Meta Ads Manager)

**Goal:** Traffic. **Website:** https://doodledoggo.app. **Button:** "Play game".

**Primary text**
```
A cozy crayon dog game, now in 11 languages 🌍 English, Japanese, Chinese, Korean, Thai, Spanish, Portuguese, French, German and Indonesian. Free in your browser, no download.
```
**Headline** (pick one): `Now in 11 languages 🌍` · `Free cozy dog game, no download`
**Description:** `Play free in your browser.`

Tip: in Ads Manager, a language ad works best aimed at the countries it names (Japan, Taiwan, Korea, Thailand, Brazil, France, Germany, Indonesia, Spain and Latin America).
