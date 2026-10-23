# Back-check: Thai (th), v2.14.1

Checked: 736 lines (584 game keys + 152 site keys from `keys.txt`). Method: each line was read in Thai and put back into plain English first, then compared with `en.json`. Automated checks over the same lines: placeholders and ICU shape against `game/i18n/msg.js`, gendered polite particles (no ครับ/ค่ะ in UI lines; the only hit was the คะ inside คะแนน), HTML tags, semicolons, emoji, glossary terms, word bans.

Fixed: 0 lines.

The Thai matches the English in meaning on every checked line. It follows the style guide: a neutral UI without ครับ/ค่ะ, no full stops, เรา for Gerald and the dogs, the น้อง prefix for dogs, and glossary terms used the same way everywhere (ความผูกพัน, บ้านพักน้องหมา, บอร์ดหาบ้าน, มุมอาหารเม็ด, ช่างโฮ่ง). Dogs get no gendered pronoun. The food-safety lessons (alcohol, caffeine, leek, raw dough, xylitol) are accurate and gentle.

For a native speaker to look at:
- **"You" in the narrator lines.** The style guide says UI "you" = คุณ, but several narrator lines use เธอ, which can also read as "she": `adopt.is_now_your_dog_there_html` (เป็นน้องหมาของเธอแล้ว), `adopt.population_you_html`, `core.lu_dirt_html` (เขียนชื่อเธอ: "your name" or "her name"?), `core.lu_units_html`. The whole table has about 40 non-dog UI lines with เธอ, so it looks like a deliberate friendly choice, not a slip. I left it alone. A native speaker should decide whether to make them คุณ in one pass.
- `shelter.kind_rescue`: เพิ่งมาถึงวันนี้ รับมาช่วยเหลือ ("arrived today, taken in to help") is understandable but a little stiff.
- `data.bd_tips.mastiff`: ผ้าเช็ดหน้า is a handkerchief. ผ้าขนหนู (towel) would be closer to the English "a towel for that big face".
- `title.start_over_body_html`: the "moved to a farm" joke is kept. It is already a TODO(native) in `docs/i18n/th.md`.
