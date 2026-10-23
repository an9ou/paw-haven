# Back-check: Japanese (ja), v2.14.1

Checked: 736 lines (584 game keys + 152 site keys from `keys.txt`). Method: each line was read in Japanese and put back into plain English first, then compared with `en.json`. Automated checks over the same lines: placeholders and ICU shape against `game/i18n/msg.js`, HTML tags, semicolons, emoji, glossary terms, word bans ("breed" as a verb, selling dogs).

Fixed: 0 lines.

The Japanese reads natural and kind, and the meaning matches the English on every checked line. The glossary terms (絆, おさんぽ, 保護施設, 里親募集ボード, カリカリ・コーナー and so on) are used the same way everywhere. Dogs are never given a male default, and the player has no gender.

Differences that are on purpose (no fix needed):

| Key | Back-translation | Why it is fine |
|---|---|---|
| site `home.playroom_caption`, `home.free_line`, `home.feat.walks.text`, `home.japan.caption`, `home.note.shiba.text`, `home.note.lead.text`, `home.note.shrine.text`, `home.footer.thanks` | The "(Japanese word) = meaning" glosses are left out | Japanese readers don't need romaji glosses of Japanese words. The `{asobo}`-style vars are simply not used. |
| site `home.note.shiba.text` | "In English too it is called 'Shiba Inu'; inu means dog." | Turned around for a Japanese reader. Same fact. |
| site `home.words.title` | "Japanese to teach dog lovers from abroad" | Adapted for Japanese readers. |
| game `data.acts.wardrobe.1` | "Dress up" (きがえ) | A short dock button. The glossary's クローゼット is used for the Wardrobe itself. |

For a native speaker to look at:
- `title.start_over_body_html`: the English "moved to a farm" joke is kept (広い牧場に引っこして). Check that it reads as light and not as a euphemism.
- `missions.ready_space`: "Or the garden" became 庭 (the yard), which suits where the rocket house goes.
