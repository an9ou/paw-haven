# Fonts for v2.14 "Hello in Every Language"

FONTS lane, phase 1 (18 Oct 2026). The tool is `tools/i18n_fonts.js`. Its outputs go to `site/fonts/i18n/` (site) or `--out` (game). The licenses are already in `site/fonts/i18n/*-OFL.txt`.

## 1. Summary

| Language | Text face (`'DD Local'`) | Title face (`'DD Local Title'`) | License | Why |
|---|---|---|---|---|
| ja | **Klee One SemiBold** | the same face | OFL 1.1 | Pencil-written textbook (kyōkasho) style. Kids learn to write these shapes, so it is very easy for them to read. It reads as a pencil sketchbook, and SemiBold matches Patrick Hand's weight on phones. |
| zh-Hans | **LXGW WenKai Medium** (霞鹜文楷) | the same face | OFL 1.1 (with Reserved Font Names, see 7) | Built on Klee One, so it is the Simplified Chinese twin of the ja pick. Friendly kai-style handwriting with Mainland glyph forms. |
| zh-Hant | **Iansui** (芫荽) | the same face | OFL 1.1 | Built on Klee One, with Taiwan Ministry of Education standard forms. It covers 㹴 (U+3E74) and 麵. Centred full-width punctuation. |
| ko | **Poor Story** | **Jua** | OFL 1.1 | Poor Story is neat handwriting, the Hangul cousin of Patrick Hand. It is also very small (about 50 KB for all 2,350 KS X 1001 syllables). Jua is round and bubbly and gives headings the weight that Caveat 700 gives English ones. |
| th | **Mali** Regular | **Mali Bold** | OFL 1.1 | Rounded, friendly, looped Thai (looped letters are the easiest for children). Marks stack correctly (see 4). The whole Thai block is 14 KB, so a bold title face is cheap. |
| es, pt-BR, fr, de, id | Patrick Hand (already shipped) | Caveat (already shipped) | OFL 1.1 | The shipped latin subsets cover these languages. The tool adds a tiny supplement only when a corpus uses a character they lack (see 3). |

**Recommendation for the site: option (a).** Serve `site/fonts/i18n/` from a second Worker, `doodle-doggo-fonts`, on the route `doodledoggo.app/fonts/i18n/*`. A route takes precedence over the main Worker's Custom Domain on the same hostname (Cloudflare docs, "Routes"). The fonts stay same-origin, so the CSP `font-src 'self'` needs no change. The fonts Worker has its own 3 MB limit; the site's five subsets total about 0.9 MB at 1,000 characters per language. Option (c), the system fonts, is the fallback in every stack (section 6).

**Recommendation for the game: side files plus lazy loading** (section 5). Never embed all five subsets.

## 2. Candidates looked at

The comparison sheet was rendered in Chromium (Playwright). It showed each candidate's title and text next to Patrick Hand / Caveat and the crayon Shiba (`site/img/art/dogs/shiba-still.svg`). The table gives sizes as real woff2, with horizontal layout features and no hinting, for 1,000 and 2,000 characters taken as an even sample of the national level-1 set. Licenses are from each family's `METADATA.pb` in google/fonts (LXGW WenKai: its own repo).

| Script | Candidate | 1000 / 2000 chars | Verdict |
|---|---|---|---|
| ja | Klee One SemiBold | 276 / 560 KB | **picked**: pencil handwriting, the most "sketchbook" |
| ja | Kiwi Maru Medium | 207 / 414 KB | soft and readable, but a printed look; second choice |
| ja | Zen Maru Gothic | 195 / 395 KB | clean rounded gothic, a bit corporate |
| ja | M PLUS Rounded 1c | 176 / 341 KB | the smallest; UI-like, no hand feel |
| ja | Kosugi Maru (Apache 2.0) | 200 / 400 KB | lacks ゔ and small ヷ–ヺ |
| ja | Yomogi | 215 / 445 KB | cute hand-drawn, but thin and grey on phones |
| zh-Hans | LXGW WenKai Medium | 247 / 473 KB | **picked** |
| zh-Hans | ZCOOL KuaiLe | 119 / 234 KB | fun but heavy and blobby at 15–19 px; lacks 〃 and 〜 |
| zh-Hant | Iansui | 325 / 615 KB | **picked** |
| zh-Hant | Huninn (粉圓) | 218 / 424 KB | rounded and clear, Taiwan forms; the fallback pick if bytes get tight (35% smaller) |
| zh-Hant | LXGW WenKai TC | 334 / 643 KB | rejected: it uses inherited (傳承) forms, e.g. 為 is drawn as 爲, which is not the Taiwan standard |
| ko | Poor Story | 33 / 50 KB | **picked** (text) |
| ko | Gowun Dodum | 85 / 127 KB | very readable, but a printed look |
| ko | Gaegu | 41 / 58 KB | crude and crayon-like, but too loose and wide for text on phones |
| ko | Jua | 96 / 153 KB | **picked** (titles only, about 17 KB for the breed names) |
| ko | Gamja Flower | 62 / 86 KB | charming, but uneven at small sizes |
| th | Mali / Itim / Sriracha / Chonburi | 18 / 19 / 14 KB / – (all Thai) | Mali **picked**. Itim is close but less rounded, Sriracha is slanted, Chonburi is a display face. |

## 3. Coverage findings

**Latin (es, pt-BR, fr, de, id).** The shipped `site/fonts/caveat.woff2` and `patrick-hand.woff2` have every letter these languages need: á é í ó ú ü ñ ¿ ¡ ã õ â ê ô ç à è ù û ë ï î œ æ (and capitals), « » ß ä ö „ “ ” ‚ ‘ ’ – — … ª º and U+00A0. Three characters are missing:
- **Ÿ** (U+0178, French, very rare): it is in the full fonts. The tool notices when a corpus uses it and writes `<lang>.woff2` (about 1 KB) as a supplement. For example, a test fr corpus gave a 0.8 KB Patrick Hand and a 1.2 KB Caveat supplement with `unicode-range:U+178`.
- **ẞ** (U+1E9E, capital sharp s): no version of Caveat or Patrick Hand has it. German style: write "SS" in capitals (still standard). The tool warns if a corpus uses it.
- **U+202F narrow no-break space** (French before ! ? ;, see `docs/i18n/fr.md`): no version of either font has it. It is blank, so the browser takes its width from the next font in the stack. The no-break behaviour holds regardless of font, and that is what matters. Nothing to do.
- Ō ō Ū ū (Tokyo names) are already covered by `tools/fonts/*macron*` for the photo postcard. On the site, the full Google latin-ext cut would be needed if a page ever shows them in Patrick Hand: TODO(phase 2), if the site shows "Sensō-ji".

**ja.** Klee One covers all 2,965 JIS level-1 kanji and all kana (including ゕゖ ゔ ヷ–ヺ). The subset always holds the full kana (180) so that a dog name typed in kana renders. Typed kanji outside the corpus fall back to the system font.

**zh-Hans.** LXGW WenKai covers all 3,755 GB2312 level-1 characters.

**zh-Hant.** Iansui covers 㹴 (U+3E74, CJK Ext A, the terrier breeds), 麵, 「」『』 and centred ，。！？. Of Big5 level 1 it lacks 48 of 5,401, all rare (汍 杗 沘 阬 …). The tool prints any character it cannot find, and that character falls back to the system TC font.

**ko.** Poor Story and Jua cover all 2,350 KS X 1001 syllables. Neither has CJK brackets (Korean uses ASCII punctuation, which stays in Patrick Hand).

**th.** Mali covers U+0E01–0E3A and U+0E3F–0E5B. U+0E3B–0E3E are unassigned. A render test compared the full font with the subset at 64 px: ปั้น ปู่ ป๊ะ ป๋า ฟ้า ฝ้าย ป้า (tone marks moved left beside tall letters), ญู ฐุ ฎู (letters lose their tail above a lower vowel), น้ำ (tone mark above ำ), ก๋วยเตี๋ยว, ฤๅษี. The two render identically, because the Thai subset keeps every OpenType feature (`--layout-features='*'`) and all the alternate glyphs those features reach.

## 4. Sizes

These numbers come from `node tools/i18n_fonts.js --all --measure`. Each starts from the real glossary (base set plus the 35 breed names and the terms in `game/i18n/glossary/<lang>.json`), then adds an even sample of the level-1 set. Frequent characters tend to be simpler than the sample average, so the numbers are slightly high, which is the safe side.

| Characters | ja Klee One SB | zh-Hans WenKai M | zh-Hant Iansui | ko Poor Story | th Mali |
|---|---|---|---|---|---|
| glossary only (≈ 320–450) | 70 KB | 97 KB | 131 KB | 13 KB (+17 KB Jua titles) | 14 KB (+13 KB bold) |
| 600 | 147 KB | 136 KB | 181 KB | 23 KB | – |
| 1000 | 265 KB | 231 KB | 307 KB | 31 KB | – |
| 1500 | 413 KB | 351 KB | 459 KB | 40 KB | – |
| 2000 | 551 KB | 463 KB | 599 KB | 48 KB | – |
| 3000 | 826 KB | 684 KB | 879 KB | 52 KB (all 2,350) | – |

As a rule of thumb, Klee One costs about 0.28 KB, WenKai 0.23 KB and Iansui 0.30 KB per CJK character, and Poor Story 0.02 KB per Hangul syllable. Woff2 does not compress further (gzip saves under 1%).

**Site budget.** `game/test_site.js` requires the single site Worker to stay under 2.5 MB gzipped. It is at 2.09 MB before any i18n pages. With 500–1,200 unique characters per language, the site's fonts come to 0.4–1.05 MB (ja 115–330, zh-Hans 110–280, zh-Hant 145–370, ko 25–50 with Jua, th 27 KB). That does not fit next to ten languages of HTML. Hence:
- (a) **picked**: the second Worker `doodle-doggo-fonts` on the route `doodledoggo.app/fonts/i18n/*` (its own 3 MB limit, about 1 MB used). `tools/cf_site.js` currently packs everything under `site/`, so it must skip `site/fonts/i18n/*.woff2`. A small `tools/cf_fonts.js` (phase 2) packs those files as Data modules with `Cache-Control: public, max-age=31536000, immutable`. File names do not change between releases, so use `?v=<sha8>` in the CSS URL, or keep the cache to a day. The CSS files are tiny and can stay in the main Worker.
- (b) Tighter subsets or one shared CJK face: rejected. ja, zh-Hans and zh-Hant need different glyph forms for the same code points (骨 直 角 為 …), so one face would show at least one language the wrong forms. Tighter subsets are what the tool already makes: only the page's own characters. Huninn instead of Iansui would save about 35% on zh-Hant if the fonts Worker ever got tight.
- (c) The system rounded fonts as the only CJK fonts: rejected as the main plan, because Android and Windows have no rounded or hand-drawn CJK system font, so the look would be lost. They stay in every stack as the fallback (section 6), and `font-display: swap` shows them until the subset arrives.

## 5. The game (phase 2)

The game is about 4.0 MB of HTML today (`node game/build.js publish`), and its strings will need roughly 1,500–3,000 unique CJK characters per language. Embedding all five text faces as base64 would add (×4/3 for base64):

| Characters per language | ja + zh-Hans + zh-Hant + ko + th (raw) | as base64 in the HTML |
|---|---|---|
| 1500 | 1.3 MB | about 1.7 MB (+43%) |
| 2000 | 1.7 MB | about 2.3 MB (+57%) |
| 3000 | 2.5 MB | about 3.3 MB (+83%) |

Proposal: load only the active language's face.
1. **itch.io (a zip), GitHub Pages and the claude.ai artifact (multi-file, up to 16 MB per file):** ship `fonts/i18n/<lang>.woff2` next to `index.html` (for the artifact, as `files`). On a language switch the game runs `new FontFace('DD Local', 'url(fonts/i18n/ja.woff2)', { unicodeRange, display: 'swap' })`, then `document.fonts.add(face)`, then `face.load()`. The CSS stack already names `'DD Local'`, so text redraws when the face arrives. Nothing is loaded for English or the Latin languages.
2. **The single-file fallback** (if a build must be one file): put each language's base64 in an inert `<script type="application/octet-stream" id="font-ja">` block. Only the active one is turned into a `FontFace` from an `ArrayBuffer` (`Uint8Array.from(atob(...))`). This avoids decoding fonts that aren't used, but not the HTML weight.
3. **The photo postcard** (`tools/photo_fonts.js`, `PH_FONT_CSS`): an SVG drawn to a canvas cannot load page fonts, so the postcard must carry the active language's face as a data URI. Two ways: at capture time, `fetch` the woff2 and turn it into base64 (`FileReader.readAsDataURL`); or, in a single-file build, take it from the block in step 2. `node tools/i18n_fonts.js <lang> --for game --embed <file>` writes that CSS directly. If the postcard text uses ASCII in the local face, add `--ascii` (section 6). `tools/photo_fonts.js` itself needs no change for es, pt-BR, de and id. fr needs the Ÿ supplement only if the game strings use Ÿ.

The game corpus is `game/i18n/<lang>.json` (`--for game`). The tool always adds the glossary breed names and terms.

## 6. Font stacks and CSS per language

Set `lang` on `<html>` (`ja`, `zh-Hans`, `zh-Hant`, `ko`, `th` and so on). It picks the right Han glyphs in the system fallback fonts and the right line breaking. `'DD Local'` comes first: it covers only non-ASCII, non-Latin characters, so Latin letters, digits and ASCII punctuation fall through to Patrick Hand / Caveat ("v2.14", "3" and "Doodle Doggo" look the same in every language), while CJK punctuation and Thai come from the local face.

```css
/* text */
:lang(ja)      { font-family: 'DD Local', 'Patrick Hand', 'Hiragino Maru Gothic ProN', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', 'Noto Sans JP', 'Noto Sans CJK JP', sans-serif; }
:lang(zh-Hans) { font-family: 'DD Local', 'Patrick Hand', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', 'Noto Sans CJK SC', sans-serif; }
:lang(zh-Hant) { font-family: 'DD Local', 'Patrick Hand', 'PingFang TC', 'Microsoft JhengHei', 'Noto Sans TC', 'Noto Sans CJK TC', sans-serif; }
:lang(ko)      { font-family: 'DD Local', 'Patrick Hand', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', 'Noto Sans CJK KR', sans-serif; }
:lang(th)      { font-family: 'DD Local', 'Patrick Hand', 'Thonburi', 'Leelawadee UI', 'Noto Sans Thai Looped', 'Noto Sans Thai', sans-serif; }
/* headings: the title face first where there is one; 'DD Local' covers the rest */
:lang(ja) h1, :lang(ja) h2 /* and the other headings */ { font-family: 'DD Local Title', 'DD Local', 'Caveat', 'Patrick Hand', /* the system list above */ sans-serif; }
/* es, pt-BR, fr, de, id: the existing --read and --hand stacks, with 'DD Local' / 'DD Local Title' in front (they only claim Ÿ when it is used) */
```

- **CJK** (ja, zh-Hans, zh-Hant): text `line-height: 1.6–1.7` (the English text uses 1.45; the glyphs are denser), headings `line-height: 1.25` (Caveat headings use 1.05, too tight for CJK). Use `word-break: normal; line-break: strict; overflow-wrap: anywhere` and never `letter-spacing`, `font-style: italic` or faux bold. The faces are declared `font-weight: 400 700`, so the browser does not smear a fake bold over them; headings get their weight from size. At the same px size, CJK glyphs look bigger than Caveat, so headings at about 0.85× the English size match visually. Don't put spaces around full-width punctuation.
- **ko:** text `line-height: 1.6`, `word-break: keep-all` (Korean breaks between words, at the spaces), `overflow-wrap: anywhere` for very long words.
- **th:** `line-height: 1.6` for text (at least 1.5) and 1.4 for headings, because marks stack above and below the line. Use `word-break: normal; line-break: auto` (the browser's dictionary breaker; never `break-all`) and no `letter-spacing`. The coordinator and `docs/i18n/th.md` say the same.
- Every face uses `font-display: swap`. The CSS from the tool is `site/fonts/i18n/<lang>.css`. Link it only on that language's pages.

## 7. The tool: `tools/i18n_fonts.js`

```
node tools/i18n_fonts.js ja                      # site: corpus site/i18n/ja.json + glossary -> site/fonts/i18n/ja.woff2, ja.css
node tools/i18n_fonts.js --all                   # every language (Latin ones write CSS only unless something is missing)
node tools/i18n_fonts.js ko --for game --out dist/i18n-fonts --embed 'dist/i18n-fonts/{lang}.embed.css'
node tools/i18n_fonts.js zh-Hant extra.txt --text "麵㹴"   # more corpus files / characters
node tools/i18n_fonts.js --all --measure         # the size table above, writes nothing
node tools/i18n_fonts.js ja --backend gf         # fallback without Python (see below)
```

- **Input:** JSON files (every string value, so ICU syntax costs only ASCII, which is left out) or text files, plus `game/i18n/glossary/<lang>.json` (`breeds` and `terms` values; `--no-glossary` to skip). Title faces take the strings under keys that match `title|heading|h1-3|tag|name|logo|cta|btn|button` (`--title-keys`) plus the breed names. Thai takes the whole Thai block for both faces.
- **Output:** `<lang>.woff2`, `<lang>-title.woff2` when a title face is used, and `<lang>.css` (`@font-face` with family `'DD Local'` / `'DD Local Title'`, `font-display: swap`, `font-weight: 400 700`, and a `unicode-range` taken from the subset's real cmap, without ASCII or Latin letters). URLs are `/fonts/i18n/…` (`--url` to change them). It also copies the font's `<Family>-OFL.txt` and deletes stale outputs for that language. `--embed` writes the same CSS with base64 data URIs (`{lang}` in the path is replaced). `--ascii` puts ASCII digits and punctuation into the face and its range, for a context that has no Patrick Hand.
- **Backend `ft` (the default, deterministic):** Python fontTools 4.67.0 + brotli (`pip install --user fonttools brotli`). The sources are downloaded once into `~/.cache/dd-fonts/src` (`$DD_FONT_CACHE`) from google/fonts and lxgw/LxgwWenKai tag v1.530, and checked against the SHA-256 pinned in the tool, which stops if upstream changed. Head timestamps are kept and the character order is sorted. Two full runs gave byte-identical woff2 and CSS. Layout features: horizontal ones only for CJK and ko (ccmp, locl, kern, liga, calt, rlig, mark, mkmk; no vertical forms), all of them for Thai. No hinting. Name IDs 0–6, 13 and 14 are kept (copyright and license). No source font is committed.
- **Backend `gf` (fallback):** Google Fonts `css2?family=…&text=…` through the proxy. The tool checks that the reply is exactly one face. Above about 500 CJK characters (URLs of about 9 KB) Google ignores `text=` and returns its 120 standard slices, so the tool asks for 400 characters at a time and writes `<lang>.woff2`, `<lang>.2.woff2` and so on, each with its own `@font-face`. Not byte-stable (Google re-encodes), and zh-Hans would get LXGW WenKai TC (WenKai is not on Google Fonts). Use it only when Python is missing.

## 8. Licenses

All picks are SIL Open Font License 1.1 (checked in `METADATA.pb`: `license: "OFL"`, and in the LXGW repo). The texts are in `site/fonts/i18n/`: `KleeOne-OFL.txt`, `LXGWWenKai-OFL.txt`, `Iansui-OFL.txt`, `PoorStory-OFL.txt`, `Jua-OFL.txt`, `Mali-OFL.txt`, `PatrickHand-OFL.txt`, `Caveat-OFL.txt`. Subsetting is a modification under the OFL; it is allowed and the fonts are never sold. Only LXGW WenKai has Reserved Font Names ('霞鹜', 'LXGW' …). Its license adds a permission to keep the name in subsets and WOFF2 conversions "solely for web font delivery", which is our use (not an installable font). The CSS family is `'DD Local'` anyway. No font name appears in the game or site UI.

## 9. Open points

- The site's woff2 files are not committed yet: `site/i18n/<lang>.json` doesn't exist in phase 1. Run `node tools/i18n_fonts.js --all` once the translations land. Before deploying, make `tools/cf_site.js` skip `site/fonts/i18n/*.woff2` and add the fonts Worker (deploying needs the owner's go-ahead).
- TODO(native): a native reader should check the picks once on a real phone, especially Klee One SemiBold at 15 px, Iansui's thinner strokes (Huninn is the bolder fallback) and Poor Story with Jua. Also check that LXGW WenKai's shapes look like normal Mainland school forms to a zh-Hans reader.
- Option, not built: adding an empty U+202F glyph (narrow no-break space) to the fr supplement, if the system fallback width ever looks wrong.
