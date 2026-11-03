# Cantonese (yue): terms fixed in chunk 7 (the website)

Chunk 7 (`site/i18n/en.json`: home, nav and footer, the 35 dog profiles, the map of places, the guide, the owner's About story, privacy, reset, the Friends invite page, the playroom barks) is done: 881 keys, `site/i18n/yue.json` marked `complete`. It reuses the game's words exactly: breed names from the glossary, the starter names (yue.md section 7, `dog.<key>.name`), the place names (`data.places.*`, glossary `terms`), the item names for the favourites (`data.fav.*`: 三文魚醬, 骨頭公仔, 汪汪蛋糕, 益智餵食器, 骨頭餅乾, 吱吱鴨仔, 拔河繩, 雞肉飯, 飛碟, 網球, 狗糧; actions 把戲, 開飯時間, 執波, 掘地, 散步, 摸摸), the meters (飽肚, 開心值, 體力, 清潔度), 索索儀, 收埋呢張咭, 匯出進度碼, 唔記得密碼？, 退出好友, 加朋友, 好友碼.

## Format rules chunk 7 settled

- Japanese words stay in their placeholders, the gloss is Cantonese: `{inu} = 狗`, `{asobo} = 一齊玩啦！`, `{arigato} = 多謝！`, `{inutachi} = 班狗狗`. Katakana barks (`ワン！`) stay.
- `profile.pup_alt` / `pup_cap` keep the `article` select with the same text in both branches: `做狗BB時嘅{name}`. `profile.alt` and `card.alt` put the breed first: `{breed}{name}`.
- Nav, footer and buttons are short nouns or verbs: 主頁、狗狗、地圖、玩法、關於我哋、選單、私隱、聯絡我哋、去ITCH.IO玩、即刻玩、全螢幕.
- Privacy is in the same spoken Cantonese; `privacy.updated` keeps the line that the English version counts: 「呢份政策嘅廣東話版同英文版如果有唔同，以英文版為準。」
- Hachikō's professor 過身 (the 死 ban), the FAQ asks about 唔舒服 (never 病).
- "Plant only dog-safe plants" is 「種對狗狗安全嘅植物」: 「種狗狗」 hits the stud ban.

## New words

| English | 廣東話 | Where |
|---|---|---|
| Privacy / Privacy policy | 私隱 / 私隱政策 | footer, privacy |
| About Us | 關於我哋 | nav, footer, about |
| Guide (nav) / How to play | 玩法 / 點樣玩 | nav, guide |
| Home (page) | 主頁 | nav, footer |
| Menu | 選單 | nav.menu |
| Full screen / Exit full screen | 全螢幕 / 退出全螢幕 | home |
| profile (dog page) / Full profile | 資料 / 完整資料 | home, card |
| live (playroom) | 直播緊 / 直播自 | home.playroom_* |
| guest | 訪客 (訪客身份、訪客進度) | privacy, game |
| hashed password / hash | 雜湊密碼 / 密碼雜湊 | privacy |
| newsletter | 電子報 | privacy |
| analytics | 數據分析 | privacy |
| yard snapshot | 屋企花園嘅快照 | privacy.friends |
| donation / donate | 捐款 / 捐少少錢 | about |
| in-game purchases | 遊戲內購買 | about |
| landlord | 業主 | about.p4 |
| dog run (fenced) | 狗狗運動場 | home.note.lead (as in 代代木公園狗狗運動場) |
| pet stroller / carrier | 寵物車仔 / 寵物袋 | home.note.stroller |
| resident dogs (café) | 駐店狗狗 | home.note.cafe |
| torii | 鳥居 | home.note.shrine |
| missions clipboard | 任務板 | guide.tip2 |
| camera button | 相機掣 | guide.tip5 (as in the game) |
| new dog owner | 新手狗主 | guide.title |
| Japanese Chin / Kai Ken | 日本狆 / 甲斐犬 | soon.line |
| rescue dog (保護犬) | 俾人救出嚟、等緊領養嘅狗狗 | dog.mutt.fun |
| lap dog | 坐大髀嘅狗 (Dane joke), 伴侶狗 (Maltese, Shih Tzu) | dog.* |
| couch potato | 梳化懶蟲 | dog.greyhound |
| forgetful | 大頭蝦 | dog.golden.trait4 |
| show-off | 騷包 (Spitz, as the game's 騷包表演), 愛表演 (Poodle) | dog.* |
| follower | 跟屁蟲 | dog.dane, dog.maltese |
| grumpy | 黑面 | dog.chow.quote |
| topknot | 頭頂髻 | dog.maltese, dog.shihtzu |
| jowls | 嘴邊肉 | dog.corso.trait4_line |

## HK jokes in the profiles

- Chihuahua: quote 「我就係成座大廈嘅保安。」, loud = 「一吠就好似掛八號風球」 (the game's 八號風球).
- Husky: 大戲歌手, 「對住月光同梳化唱大戲」 (the game's 大戲嚎叫).
- Dachshund: 「我後面嗰半仲喺路上。」 (the game's 後面嗰半遲到咗). Yorkie weighs 「一條方包」 (the Corgi's 方包).
- Greyhound: 「時速72公里」 as in the game's signature line.

## TODO(native): lines to check

- `home.peek.yard` 「屋企，落雪嘅溫暖屋企」 (Home, sweet snowy home): natural, or 「甜蜜嘅雪地屋企」?
- `home.note.hachiko.text` 「八公前面等」 for "meet at Hachikō": how HK visitors say it.
- `dog.collie.personality` 「數過啲羊。冇羊。所以數咗你。」 and `dog.samoyed.quote` 「每年春天甩出第二隻狗咁多毛。」: do the jokes land?
- `dog.pug.play` 「個肚開門營業喇。」 and `dog.corso.trait1_line` 「一座有心跳嘅友善小山」.
- `dog.spitz.fun`: 銀狐犬（日本狐狸犬）, the glossary's open question.
- `dog.shihtzu.fun`: rewritten as a fact (the English name Shih Tzu comes from 獅子), not "its name means lion".
- `privacy.collect.hash` 雜湊 (hash): fine for children, or say only 打亂咗嘅密碼?
- `about.p1`–`p8`: the owner's story, kept close to the English in first person; a native read for warmth.
- `guide.faq.q4` 「會唔會唔舒服或者走咗去？」: 走咗去 for "run away" (never 走失).
- Site font: `site/fonts/i18n/yue.woff2` is a subset of the old placeholder text, so new characters (e.g. 㹴 脷 髀 髻) may fall back to the system font until `node tools/i18n_fonts.js` is re-run for yue (plumbing lane).
