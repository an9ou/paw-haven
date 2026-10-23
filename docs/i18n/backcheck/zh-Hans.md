# Back-check: Simplified Chinese (zh-Hans), v2.14.1

Checked: 736 lines (584 game keys + 152 site keys from `keys.txt`). Method: each line was read in Chinese and put back into plain English first, then compared with `en.json`. Automated checks over the same lines: placeholders and ICU shape against `game/i18n/msg.js`, Traditional characters that don't belong in Simplified text, HTML tags, semicolons, emoji, glossary terms, word bans.

Fixed: 1 line.

| Key | Old back-translation | Fix | Why |
|---|---|---|---|
| site `guide.pups.p2` | "...go to named families for free, and **they (the puppies)** send you postcards." | 它们 → 他们 | 它们 is the "it/they" used for animals, so the puppies seemed to send the postcards. In the game the families write. 他们 (people) puts that right. Same length. |

Everything else matches the English. The glossary terms (亲密度, 救助站, 待领养告示板, 狗粮小铺, 汪汪蛋糕 and so on) are used the same way everywhere. Simplified characters only. Dogs are "它", or 她/他 inside the `sex` select, so there is never a male default. The player has no gender.

Differences that are on purpose (no fix needed):
- `shelter.is_home`, `care.all_full`, `care.curl_one`, `care.eats_it_up`, `care.pretend_one`: there is no `{sex}` select because Chinese needs no pronoun there. Both branches would read the same.

For a native speaker to look at:
- `title.start_over_body_html`: the "moved to a farm" joke is kept (搬去农场了). Check that it reads as light and not as a euphemism.
- `care.crunch_harmony`: "crunch in harmony" became "crunching, eating neatly" (吃得整整齐齐). Fine, but a native speaker may want something closer to "in harmony".
