# Back-check: Traditional Chinese (zh-Hant, Taiwan), v2.14.1

Checked: 736 lines (584 game keys + 152 site keys from `keys.txt`). Method: each line was read in Chinese and put back into plain English first, then compared with `en.json`. Automated checks over the same lines: placeholders and ICU shape against `game/i18n/msg.js`, Simplified-only characters, HTML tags, semicolons, emoji, glossary terms, word bans.

Fixed: 0 lines.

The text is Traditional Chinese with Taiwan wording throughout: 動物之家, 牠 for dogs, 帳號, 登入, 全螢幕. There are no Simplified characters (the automated scan's only hits were 吧 and 首, which both scripts share). The glossary terms are used the same way everywhere. 牠 is used for dogs, so there is never a male default, and the player has no gender.

Differences that are on purpose (no fix needed):

| Key | Back-translation | Why it is fine |
|---|---|---|
| `title.start_over_body_html` | "The old one will be fine. It moved to another page of the sketchbook. That page really exists." | Rewrites the "moved to a farm" joke, which in English can be a euphemism for a pet dying. Kinder, and it fits the sketchbook world. |
| `adopt.is_now_your_dog_there_html` | "This is a lifelong promise." (for "There is no take-backs policy") | Same meaning, warmer. |
| `core.lu_nothing` | "Pure friendship, no free gift." (for "No refunds") | It shows under "Unlocked:" when nothing unlocked, so "no free gift" fits the joke here. |

For a native speaker to look at:
- `walk.out_of_puff`: 走累了，喘不過氣 ("tired, out of breath"). It is the plain idiom, but check that it doesn't sound like real distress for young players.
- `shop.bed_desc`: 狗窩打盹 ("bed nap") where the English says "House nap". The effect is the same, but zh-Hans says 屋里打盹.
