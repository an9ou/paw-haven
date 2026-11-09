# Cantonese (yue) style guide and glossary

Doodle Doggo v2.20, the 12th language. Source language: English (`game/i18n/en.json`, `site/i18n/en.json`). Data file: `game/i18n/glossary/yue.json`. The tables in sections 7 to 9 match the JSON: change both together. Voice sample for the owner: `yue_sample.md`. Translation plan and chunks: `coord/yue_plan.md`.

**Owner's choice:** spoken Hong Kong Cantonese (口語廣東話), written in Traditional characters with the Cantonese characters people really type (嘅、咗、啲、唔、冇、喺、嚟、佢、哋). Readers are in Hong Kong and Macau, children included. Short buttons stay simple (餵食、散步). The picker shows the language as **廣東話**; `<html lang>` is `yue-Hant-HK`, and Intl formats numbers and dates as `zh-HK`.

This is **not** a conversion of `zh-Hant.json`. zh-Hant is written Mandarin with Taiwan words: it says 他們在這裡吃飯了; Cantonese says 佢哋喺度食緊飯. Translate from the English meaning. zh-Hant is only a reference for item names and joke ideas, and its Taiwan words (飼料、米克斯、吉娃娃、馬鈴薯、優格) are wrong here: section 11 has the list. Anything marked TODO(native) needs a native speaker's check (the owner's friends).

## 1. Tone

- Cozy, kind, simple, playful. **Nothing bad ever happens**: no 死, 病, 走失, 遺棄, no scolding, no fear. A dog may be 攰 (tired), 肚餓 (a little hungry), 濕晒 (soaked), 暈低 (a dramatic faint), never ill or lost.
- The joke is the crude crayon dogs: 醜萌, 醜得好得意. The dogs are proud of their wobbly drawing, deadpan. 得意 is the HK word for cute; 好得意 is the highest praise.
- Readers include children: common characters, short sentences, everyday words. No 成語 a ten-year-old would not know, no internet slang (no 收皮, hea, chur, 好L, on9), no 粗口 and no vulgar homophones (section 10).
- Each speaker has a voice (section 2). Gerald is a little know-it-all, the dogs follow their breed, families write like warm neighbours.
- Cantonese is spoken language: write it the way a kind HK parent talks to a child. Read every line aloud. If it sounds like a news anchor (書面語), rewrite it.

## 2. Register, pronouns and speakers

**Choice: 你, never 您.** Everyone is a friend; 您 is distant and almost never said in Cantonese.

**Pronouns: 佢 / 佢哋 for everyone and everything**, as people speak: the dog, Gerald, a family, a toy, a shop. Possessive 佢嘅, 佢哋嘅. Never 他、她、它、牠, never ~們 (我哋、你哋、佢哋; for a group of nouns use 啲 or 班: 啲狗BB, 班鄰居). Spoken Cantonese has no gender in 佢, so a `{sex, select, ...}` in the English can usually be dropped (the merge tool allows dropping `sex` only). Keep a `sex` branch only where the English really says boy or girl: 男仔 / 女仔. Another player is 呢位朋友 or 其他玩家, never 佢 alone at the start of a line. The player has no gender.

| Who speaks | Register | Example |
|---|---|---|
| Buttons, tabs, chips | written-simple, 2–4 characters, no particles, no 請 | 餵食、散步、領養、返回、關閉、去玩 |
| System lines, toasts, hints | short spoken Cantonese, one particle at most | 「已經儲存咗。」「撳「餵食」，再揀一樣嘢食。」 |
| Lessons (two sentences) | calm spoken Cantonese, no jokes in the safety part | 「提子同提子乾對狗狗有毒。一粒都唔好俾佢食。」 |
| Dogs | casual, 我, the breed's personality, particles where a person would use them | 柴犬：「張梳化而家係我嘅。我話事。」 金毛：「梳化！地氈！枱燈！我好愛呢個屋企！」 |
| Gerald the duck | casual, a bit know-it-all, likes 當然 and 梗係 | 「我係傑拉德。我住喺河邊，乜嘢都知。等我帶你周圍睇下啦。」 |
| Mrs. Plum, families, Dr. Paws, Baker Bea | warm neighbour, still 你 | 「南瓜田快閃店開咗喇，得閒嚟玩呀！」 |

- On screen the outer quote marks of a line go: 撳「餵食」，再揀一樣嘢食。 The 「」 in the examples here only mark the line.
- **Buttons:** verb or verb + object, 2–4 characters: 餵食、散步、領養、沖涼、梳毛、影相、送禮物、加、去玩、返回、關閉. No particles on buttons (not 好呀！ on an OK button: 好). A confirm button may be one character (加、好).
- **Menus and tabs:** nouns: 地圖、日記、衣櫃、任務、設定、貼紙簿、好友.
- **Headings and titles:** short, no particle unless it is a greeting: 「南瓜田快閃店開咗喇」 is fine as a letter title.

## 3. Spoken forms, particles and characters

**Use the Cantonese words, not their Mandarin twins.** The most common ones:

| Say (廣東話) | Not (書面語 / Mandarin) | Meaning |
|---|---|---|
| 係 / 唔係 | 是 / 不是 | is / is not |
| 唔 | 不 | not (keep 不 only inside fixed words: 不過、不如、不停、不得了) |
| 冇 / 未 | 沒有 / 還沒 | have not / not yet |
| 喺 | 在 | at, in (正在 → 緊: 食緊) |
| 嚟 / 去 / 返 | 來 / 去 / 回 | come / go / go back (返屋企) |
| 嘅 | 的 | 's, -ish |
| 咗 | 了 (done) | 食咗、到咗 |
| 喇 / 啦 | 了 (new situation) | 好喇、得喇 |
| 緊 | 正在 | 瞓緊、玩緊 |
| 啲 | 一些 / 的 (plural) | 啲金幣、食多啲 |
| 呢 / 嗰 / 邊 | 這 / 那 / 哪 | this / that / which (呢度、嗰度、邊度) |
| 乜嘢 / 咩 | 什麼 | what |
| 點 / 點解 | 怎麼 / 為什麼 | how / why |
| 邊個 | 誰 | who |
| 睇 | 看 | look, watch (睇下) |
| 食 / 飲 | 吃 / 喝 | eat / drink |
| 瞓覺 | 睡覺 | sleep |
| 鍾意 | 喜歡 | like (write 鍾意, not 中意) |
| 識 | 會 (know how) | 識坐低 |
| 揀 | 選 | choose |
| 搵 | 找 | find |
| 攞 / 拎 | 拿 | take, fetch |
| 俾 | 給 / 讓 | give, let (write 俾; 畀 is also correct, but HK kids see 俾 everywhere: pick 俾 and keep it) |
| 同 | 和 / 跟 | and, with |
| 嘢 | 東西 | thing |
| 而家 / 今日 / 聽日 / 琴日 | 現在 / 今天 / 明天 / 昨天 | now / today / tomorrow / yesterday |
| 啱啱 | 剛剛 | just now |
| 好似 | 好像 | seems |
| 咁 | 這麼 / 這樣 | so, like this (use 咁 for both; not 噉) |
| 攰 / 肚餓 / 凍 / 熱 | 累 / 餓 / 冷 / 熱 | tired / hungry / cold / hot |
| 靚 / 得意 / 正 | 漂亮 / 可愛 / 很棒 | pretty / cute / great |
| 攬 / 錫 | 抱 / 親 | hug / kiss |
| 屋企 | 家 | home |
| 傾偈 | 聊天 | chat |
| 行街 / 出街 | 逛街 / 出門 | go out |
| 撳 | 點 / 按 | tap, press, click |

**Sentence-final particles** make the voice, but not on every line. As a rule: at most one per sentence, and at most every second sentence in a long text. Buttons and tabs never get one.

| Particle | Feels like | Example |
|---|---|---|
| 啦 | a friendly suggestion, "let's" | 去散步啦。 |
| 喇 | something new has happened | 你返嚟喇！ 食飽喇。 |
| 呀 | soft question or warm exclamation | 你好呀！ 去邊呀？ |
| 吖 | a gentle request | 俾我吖。 |
| 喎 | surprise, or reporting news | 原來佢識坐低喎！ |
| 囉 | "of course, so" | 咁就去公園囉。 |
| 㗎 | explaining, "you know" | 散步賺最多金幣㗎。 |
| 嘛 | "obviously" | 我係柴犬嘛。 |
| 咩 | surprised question, "really?" | 你唔記得咗咩？ |
| 嘅 | a firm statement | 佢好乖嘅。 |
| 咋 | "only, just" | 一陣咋。 |
| 呢 | "and what about" | 你呢？ |

- Write 喇 for "now it has happened" and 啦 for suggestions and requests. Do not use Mandarin particles (吧、嗎、呢 as a question marker for yes/no, 喔、耶): 去公園吧 → 去公園啦; 你餓嗎 → 你肚唔肚餓呀.
- Questions: Cantonese asks with A唔A (好唔好？想唔想？) or with a particle (呀、咩), not with 嗎.
- **Characters:** the same Traditional forms as zh-Hant (裡、線、衛、著衫), so the font subset stays small. Use 啲 (not 的 or D), 嘢 (not 野), 咗 (not 左), 喺 (not 系 or 響), 嚟 (not 黎), 冇 (not 無 in speech), 佢 (not 渠), 哋 (not 地), 嘅 (not 既), 咁 (not 甘), 唔 (not 吾), 係 (not 系), 啱 (not 岩), 瞓 (not 訓). These "lazy" spellings are common online but look wrong in a children's game.
- Latin letters inside Cantonese are fine where HK people write them: 狗BB, hi, OK. Keep them rare: no English words a child cannot read.

## 4. UI conventions

- **Punctuation:** full-width ，。！？：、 and quotes 「」 (inner 『』), never “” or "". Book titles 《》 only for real titles. Ellipsis ……. No semicolons (；) anywhere, no emoji: the merge tool refuses both.
- **Spaces:** none between Chinese and digits or Chinese and the brand: 100金幣、親密度3、Doodle Doggo小鎮. One space before and after a Latin code or link inside Chinese text: 「掃一掃或者輸入 {code}」.
- **Numbers:** Arabic digits. In UI chips: +10開心值, 100金幣, ×3. In sentences the measure word: 3隻狗BB, 100個金幣, 2件衫.
- **Measure words:** dogs and animals 隻; most things 個; clothes 件 (件衫), trousers and leashes 條 (條狗帶), photos, cards and beds 張 (張相、張狗狗咭、張狗床), letters 封, small round things 粒 (粒藍莓、粒波 is fine, 個波 too), lumps 嚿 (一嚿骨), drinks 杯, bowls 碗, days 日 (三日, not 三天), times 次 or 轉 (行一轉).
- **Dates:** as Intl `zh-HK` gives them: 11月3日（星期二）. In speech 11月3號、禮拜二 is fine; on the UI keep 日 and 星期. Year: 2026年. Months 1月 to 12月.
- **Times:** 下午3:30 or 15:30 on the UI; in speech 朝早、晏晝、下晝、夜晚、半夜. "1 game hour" = 遊戲入面1個鐘.
- **Plurals:** Cantonese has only `other`: `{n, plural, other {#隻狗BB}}`. Keep `=0` branches when the English has one.
- **One ！ at most;** ！！ only for a dog shouting (the Chihuahua, the Corgi). No ？！ pile-ups.
- **Length on phones:** phones are 390 px wide. Cantonese is often one or two characters longer than zh-Hant (particles, 咗, 緊, 嘅). Buttons 4 characters at most, toasts about 18 characters, chips 6. When a line overflows, drop the particle first, then shorten the words. Never shorten a lesson below its two sentences.
- **Fonts:** the Cantonese characters (嘅 咗 啲 喺 嚟 哋 噉 㗎 嘢 冇 攰 瞓 撳 揸 冧 咭 㹴 孖 甩) must be in the font subset (`tools/i18n_fonts.js`, the plumbing lane). Avoid rare variants that may be missing: 撳 not 㩒, 俾 not 畀, 咁 not 噉.

## 5. The owner's word rules in Cantonese

| Never say | Why | Say instead |
|---|---|---|
| 繁殖、繁育、配種、配狗、打種、交配、育種、狗場、犬舍 | "breed" as a verb | 玩伴聚會 (button 約玩), 生BB, 狗BB出世喇 |
| 種狗、種犬、種公、種母 | "stud" | the dog's name, 另一隻狗狗 |
| 一胎狗仔幾錢、狗價、幾多錢一隻 | "litter price" | (no prices; puppies are free) |
| 賣狗、買狗、出售、放售、轉讓 (a dog) | selling or buying dogs | 領養, 免費去新屋企, 搵到新屋企 |
| 日本製造、日本製、日本貨、日貨 | "made in Japan" | 日式 |
| 任天堂、寵物小精靈、寶可夢、比卡超、動物森友會、動森 | franchise names | — |
| 死 (and 笑死、攰到死、悶死), 病、走失、遺棄、棄養 | nothing bad ever happens | 好好笑, 好攰, 暈低, 唔舒服, (no lost dogs) |
| 狗公、狗乸、公狗、母狗 | 狗公 and 狗乸 are insults in HK | 男仔 / 女仔 |

- 品種 (breed, the noun) is fine. 原產日本 for a breed is a fact and fine.
- Shops selling items is fine: 「冬日攤檔有狗狗冷衫賣。」 Buying a treat for the dog is fine: 「買啲零食俾狗狗啦！」 Keep 賣 and 買 away from a bare dog word.
- **Welfare words, kind and plain.** 領養 (adopt). The dog in heat is 喺發情期, said once and plainly (a fact, not a joke). Puppies are born: 生BB, 狗BB出世喇. Litters: 最多生過3胎. Rest: 休息一個發情期. Spay and neuter: 絕育. No double merle: 兩隻隕石色狗狗唔可以一齊生BB. No relatives: 屋企人唔可以一齊生BB. Puppies go to families free: 免費去新屋企; they write home: 寄信返嚟.
- The Shelter is 領養中心 and its dogs are 等緊屋企 (waiting for a home), never 被遺棄.
- Adoption is for life: 一世嘅承諾. No return-policy jokes about dogs (no 退貨, 唔要佢 near a dog).

## 6. Care lessons (blocks)

Exactly **two sentences**, each ending in 。 Calm spoken Cantonese, no jokes in the safety part, no particle pile-ups (at most one, usually 㗎 or 啦). Where the English has three or four sentences (some Gerald lessons, `winter.lesson`), join them into two with ，.

- English: "Blueberries are a safe berry for dogs. Grapes and raisins never are." → 「藍莓係狗狗可以放心食嘅莓。提子同提子乾就一定唔得。」
- English: "Both carry merle. Two merles can have puppies with eye and ear trouble, so these two stay friends." → 「佢哋兩個都帶住隕石色基因。兩隻隕石色狗狗生嘅狗BB可能眼同耳仔會有問題，所以佢哋做好朋友就夠喇。」
- Food words in lessons must be the HK ones kids recognise in a shop: 提子 (grapes), 提子乾, 朱古力, 洋蔥, 蒜頭, 牛油果, 夏威夷果仁, 木糖醇, 甘筍, 番薯. "Poison for dogs" = 對狗狗有毒. "Makes dogs ill" = 會令狗狗唔舒服 (never 病).

## 7. Starter dog names

Translate the food meaning with HK words (格仔餅, 牛油, 雲吞, 忌廉卷, 特濃, 啫喱豆). Reduplicated cute names (麵麵, 霜霜, 桃桃, 包包) are natural for HK pets. The site uses the same names.

| Breed | English name | 廣東話 | zh-Hant (Taiwan) |
|---|---|---|---|
| `shiba` | Mochi | 麻糬 | 麻糬 |
| `corgi` | Biscuit | 餅乾 | 餅乾 |
| `golden` | Sunny | 陽光 | 陽光 |
| `dachs` | Noodle | 麵麵 | 麵條 |
| `husky` | Frost | 霜霜 | 霜霜 |
| `mutt` | Pepper | 胡椒 | 胡椒 |
| `chihuahua` | Peanut | 花生 | 花生 |
| `pug` | Dumpling | 餃子 | 餃子 |
| `greyhound` | Rocket | 火箭 | 火箭 |
| `beagle` | Bagel | 貝果 | 貝果 |
| `poodle` | Pretzel | 扭結餅 | 蝴蝶餅 |
| `collie` | Scout | 小探 | 小探 |
| `samoyed` | Cloud | 雲朵 | 雲朵 |
| `frenchie` | Brioche | 布里歐 | 布里歐 |
| `akita` | Kuma | 熊熊 | 熊熊 |
| `spitz` | Daifuku | 大福 | 大福 |
| `pom` | Mikan | 蜜柑 | 蜜柑 |
| `afghan` | Saffron | 藏紅花 | 番紅花 |
| `dane` | Waffle | 格仔餅 | 格子餅 |
| `mastiff` | Crumpet | 英式鬆餅 | 英式鬆餅 |
| `gsd` | Strudel | 蘋果卷 | 蘋果捲 |
| `dobie` | Espresso | 特濃 | 濃縮 |
| `corso` | Cannoli | 忌廉卷 | 奶油捲 |
| `pitbull` | Peaches | 桃桃 | 桃桃 |
| `minpin` | Jellybean | 啫喱豆 | 軟糖 |
| `lab` | Butter | 牛油 | 奶油 |
| `malamute` | Maple | 楓糖 | 楓糖 |
| `chow` | Bao | 包包 | 包子 |
| `stdpoodle` | Madeleine | 瑪德蓮 | 瑪德蓮 |
| `schnauzer` | Muesli | 麥片 | 麥片 |
| `westie` | Shortbread | 酥餅 | 酥餅 |
| `yorkie` | Toffee | 太妃糖 | 太妃糖 |
| `bichon` | Meringue | 蛋白餅 | 蛋白霜 |
| `maltese` | Marshmallow | 棉花糖 | 棉花糖 |
| `shihtzu` | Wonton | 雲吞 | 餛飩 |

## 8. Breed names

From `mods/genes.js` BREEDS (35 keys), as Hong Kong people say them (金毛尋回犬, 比高, 芝娃娃, 哥基, 唐狗, 松鼠狗, 史納莎). Rule: write 犬 or 狗 the way HK says that breed (臘腸狗, 鬆獅狗, 大丹狗, but 柴犬, 秋田犬, 杜賓犬), and use the HK name, not the Taiwan one. Short names for Dog Cards and chat (`data.dc_breed_words.*`): 柴柴, 哥基, 金毛, 臘腸, 哈士奇, 唐狗, 芝娃娃, 八哥, 格力, 比高, 貴婦, 邊牧, 薩摩耶, 法鬥, 秋田, 銀狐, 松鼠, 阿富汗, 大丹, 獒犬, 德牧, 杜賓, 卡斯羅, 比特, 迷你杜賓, 拉拉, 阿拉斯加, 鬆獅, 大貴婦, 史納莎, 西高地, 約瑟爹利, 比熊, 馬爾濟斯, 西施.

| Key | English | 廣東話 | zh-Hant (Taiwan) | Note |
|---|---|---|---|---|
| `shiba` | Shiba Inu | 柴犬 | 柴犬 |  |
| `corgi` | Corgi | 哥基 | 柯基犬 | HK 哥基. Not 柯基 (Taiwan). |
| `golden` | Golden Retriever | 金毛尋回犬 | 黃金獵犬 | Short form 金毛 (data.breed_names.golden is just "Golden"). |
| `dachs` | Dachshund | 臘腸狗 | 臘腸犬 | HK says 臘腸狗, not 臘腸犬. |
| `husky` | Husky | 哈士奇 | 哈士奇 |  |
| `mutt` | Shelter Mutt (mixed breed) | 唐狗 | 米克斯 | The warm HK word for a local mixed dog; HK SPCA and AFCD use it. Not 米克斯 (Taiwan). |
| `chihuahua` | Chihuahua | 芝娃娃 | 吉娃娃 | HK 芝娃娃. Not 吉娃娃 (Taiwan). |
| `pug` | Pug | 八哥犬 | 巴哥犬 | HK 八哥 (bat3 go1); 犬 added so it is not read as the myna bird. Not 巴哥 (Taiwan). |
| `greyhound` | Greyhound | 格力犬 | 格雷伊獵犬 | HK 格力犬. 灰狗 is the bus. |
| `beagle` | Beagle | 比高 | 米格魯 | HK 比高. Not 米格魯 (Taiwan). |
| `poodle` | Miniature Poodle | 迷你貴婦 | 迷你貴賓犬 | HK says 貴婦狗 for poodles. |
| `collie` | Border Collie | 邊境牧羊犬 | 邊境牧羊犬 |  |
| `samoyed` | Samoyed | 薩摩耶 | 薩摩耶犬 | HK 薩摩耶. |
| `frenchie` | French Bulldog | 法國鬥牛犬 | 法國鬥牛犬 |  |
| `akita` | Akita | 秋田犬 | 秋田犬 |  |
| `spitz` | Japanese Spitz | 銀狐犬 | 日本狐狸犬 | HK pet shops say 銀狐 / 銀狐犬. TODO(native): or 日本狐狸犬. |
| `pom` | Pomeranian | 松鼠狗 | 博美犬 | HK 松鼠狗 (also 博美). TODO(native). |
| `afghan` | Afghan Hound | 阿富汗獵犬 | 阿富汗獵犬 |  |
| `dane` | Great Dane | 大丹狗 | 大丹犬 | HK 大丹狗. |
| `mastiff` | English Mastiff | 英國獒犬 | 英國獒犬 |  |
| `gsd` | German Shepherd | 德國牧羊犬 | 德國牧羊犬 |  |
| `dobie` | Dobermann | 杜賓犬 | 杜賓犬 |  |
| `corso` | Cane Corso | 卡斯羅犬 | 卡斯羅犬 |  |
| `pitbull` | Pit Bull | 比特犬 | 比特犬 |  |
| `minpin` | Miniature Pinscher | 迷你杜賓 | 迷你品犬 | HK 迷你杜賓. Not 迷你品犬. |
| `lab` | Labrador Retriever | 拉布拉多 | 拉布拉多犬 | Nickname 拉拉. |
| `malamute` | Alaskan Malamute | 阿拉斯加雪橇犬 | 阿拉斯加雪橇犬 |  |
| `chow` | Chow Chow | 鬆獅狗 | 鬆獅犬 | HK 鬆獅狗. |
| `stdpoodle` | Standard Poodle | 標準貴婦 | 標準貴賓犬 |  |
| `schnauzer` | Miniature Schnauzer | 迷你史納莎 | 迷你雪納瑞 | HK 史納莎. Not 雪納瑞 (Taiwan). |
| `westie` | West Highland White Terrier | 西高地白㹴 | 西高地白㹴 |  |
| `yorkie` | Yorkshire Terrier | 約瑟爹利 | 約克夏㹴 | HK 約瑟爹利. TODO(native): or 約克夏. |
| `bichon` | Bichon Frise | 比熊 | 比熊犬 | HK 比熊. |
| `maltese` | Maltese | 馬爾濟斯 | 瑪爾濟斯犬 | TODO(native): 馬爾濟斯 vs 瑪爾濟斯. |
| `shihtzu` | Shih Tzu | 西施犬 | 西施犬 |  |

## 9. Glossary

Every term the game uses more than once. The zh-Hant column shows where Taiwan wording differs: it is there so translators do not copy it.

**Core words**

| English | 廣東話 | zh-Hant (Taiwan) | Note |
|---|---|---|---|
| Doodle Doggo | Doodle Doggo | Doodle Doggo | Brand name: always Latin letters, never translated. |
| Cantonese (language name in the picker) | 廣東話 | — | What Hong Kong people call the language. Set in msg.js LANGS. |
| dog | 狗狗 | 狗狗 | The friendly everyday word, UI and lessons. |
| dog (casual, in dog lines and letters) | 狗仔 | — | Warm and very HK: 我隻狗仔, 呢隻狗仔. Never 狗公 / 狗乸 (insults). |
| puppy | 狗BB | 小狗 | Spoken HK (狗BB, also BB狗). Plural is the same word: 三隻狗BB, 啲狗BB. 幼犬 only in item names (幼犬糧). |
| adopt | 領養 | 領養 | As HK SPCA says it. |
| adopt out free to families | 免費去新屋企 | 免費交給新家庭 | Puppies 去新屋企, free. Never 賣 / 買 / 送走. |
| new family | 新屋企 | 新家庭 | 屋企 = home and family. 新家庭 also reads fine in a heading. |
| family (the people) | 一家人 | — |  |
| Adopt me board | 等領養告示板 | 待領養公告欄 | 告示板 is the HK word for a notice board. |
| bond | 親密度 | 親密度 | As in HK games (好感度 is the other common word; keep 親密度). |
| Bond 2 (level) | 親密度2 | — | No space: 親密度2. |
| coins | 金幣 | 金幣 | UI 100金幣, a sentence 100個金幣. Never 蚊 (dollars). |
| Paw Coins | 金幣 | — |  |
| Sparkle | 閃亮 | 閃亮 |  |
| Hunger | 飽肚 | 飽足 | A stat bar. 飽肚 = how full the tummy is, never suffering. |
| Energy | 體力 | 體力 |  |
| Happiness | 開心值 | 開心值 |  |
| level | 等級 | 等級 |  |
| crayon | 蠟筆 | 蠟筆 |  |
| sketchbook | 畫簿 | 素描本 | HK says 畫簿 (簿 = exercise book). Not 素描本. |

**Main buttons and care**

| English | 廣東話 | zh-Hant (Taiwan) | Note |
|---|---|---|---|
| Feed | 餵食 | 餵食 |  |
| Play | 去玩 | 一齊玩 | Bar button, the Play tray and the journal Play button (native check, 9 Nov: 去玩; the owner had chosen 一齊玩 on 3 Nov). |
| Care | 照顧 | 照顧 |  |
| Walk | 散步 | 散步 |  |
| More | 更多 | — | Phone bar button. |
| Wardrobe | 衣櫃 | 衣櫥 | HK 衣櫃, not 衣櫥. |
| Journal | 日記 | 日記 |  |
| Treasure Journal | 寶物日記 | 寶物日記 |  |
| Map | 地圖 | 地圖 |  |
| tap (on screen) | 撳 | — | HK says 撳 for tap, press and click: 撳「餵食」. 㩒 is the same word but not in every font, so use 撳. |
| pet (verb) | 摸摸 | 摸摸 | 摸摸頭, 摸下佢. 掃掃 (stroke) is fine in dog lines. |
| bath | 沖涼 | 洗澡 | HK says 沖涼 for a bath or a shower, dogs too. |
| nap | 瞓覺 | 打盹 | 瞓覺 on the button, 瞓一陣 / 瞓晏覺 in lines. |
| Bath & nap | 沖涼瞓覺 | — |  |
| potty | 去廁所 | 上廁所 | Keep it light and clean. Never 屙. |
| brush | 梳毛 | 梳毛 |  |
| train | 訓練 | 訓練 |  |
| trick | 把戲 | 才藝 | 把戲 = a trick a dog shows. Not 才藝 (Taiwan). |
| signature trick | 招牌把戲 | — |  |
| Show off | 表演 | — |  |
| Sit | 坐低 | 坐下 | The HK dog command. |
| Down (lie down) | 瞓低 | — |  |
| Shake | 握手 | 握手 |  |
| Spin | 轉圈 | 轉圈 |  |
| Roll over | 碌地 | 打滾 | 碌地 = roll on the ground. Kids know it. |
| Play Dead | 扮瞓 | — | No 死, ever: the dog pretends to sleep. |
| Bow | 鞠躬 | — |  |
| ball play | 掟波遊戲 | 丟球遊戲 | HK 掟 (throw) and 波 (ball). |
| fetch | 執波 | — | 執 = pick up. 執波返嚟. |
| zoomies | 衝衝衝 | — | Not 暴衝 (Taiwan). |
| treat | 零食 | 零食 |  |
| snack | 零食 | — |  |
| kibble | 狗糧 | 飼料 | HK 狗糧. Never 飼料 (Taiwan, sounds like farm feed). |
| Pupcake | 汪汪蛋糕 | 汪汪蛋糕 | Pun: pup + cupcake. 汪汪 is the dog sound kids know. |
| food | 食物 | 食物 |  |
| food (spoken, in lines) | 嘢食 | — | 嘢食 in dog lines and Gerald, 食物 on tabs. |
| toys | 玩具 | 玩具 |  |
| clothes | 衫 | 衣服 | HK 衫 (件衫, 狗狗衫). Tab label too. |
| outfit | 造型 | 搭配 | 今日嘅造型. |
| costume | 扮裝 | — | 萬聖節扮裝. |
| collar | 頸圈 | 項圈 | HK 頸圈, not 項圈. |
| bandana | 三角巾 | 三角巾 |  |
| leash | 狗帶 | 牽繩 | HK 狗帶, not 牽繩. |
| name tag (on the collar) | 狗牌 | — | Not 名牌: in HK that means a designer brand. |
| bed | 狗床 | 狗窩 | 狗床 in shops. 狗竇 (the dog's den) is fine and cute in lines. |
| doghouse | 狗屋 | 狗屋 |  |
| decorate | 佈置 | 裝飾 | HK 佈置. |

**Puppies and genetics**

| English | 廣東話 | zh-Hant (Taiwan) | Note |
|---|---|---|---|
| playdate | 玩伴聚會 | 玩伴聚會 | THE safe word for two dogs meeting. |
| playdate (button) | 約玩 | — | Short form. |
| Playdate Board | 玩伴聚會告示板 | 玩伴聚會公告欄 |  |
| puppies | 狗BB | 小狗們 | Use for "litter" in player-facing text: 一胎 only in the welfare rule (最多生過3胎). |
| Pick of the litter | 揀一隻狗BB | 挑一隻小狗 |  |
| healthy pup | 健康嘅狗BB | 健康的小狗 |  |
| resting after a playdate | 聚會後休息緊 | 聚會後正在休息 |  |
| in season (heat) | 發情期 | — | The heat cycle, a fact, said once and plainly. A season of the year is 季節, produce in season is 當造. |
| spay / neuter | 絕育 | — | HK SPCA word. Not 結紮. |
| boy / girl (a dog's sex) | 男仔 / 女仔 | — | Never 公狗 / 狗公 / 狗乸. |
| coat | 毛色 | 毛色 |  |
| merle | 隕石色 | 隕石色 | TODO(native): HK breeders may say 雲石色 or just merle. |
| Family tree | 家譜 | 家譜 |  |
| Gene Sniffer | 基因索索機 | 基因嗅嗅機 | 索 = sniff in Cantonese (索下 = have a sniff). Kids get the joke. |

**Places**

| English | 廣東話 | zh-Hant (Taiwan) | Note |
|---|---|---|---|
| Home Yard | 屋企花園 | 家裡的院子 | 花園 is the HK word for a yard. The veggie patch is 菜園. |
| Cozy House | 暖笠笠小屋 | 溫馨小屋 | 暖笠笠 = snug and warm, very Cantonese. |
| Sunny Park | 陽光公園 | 陽光公園 |  |
| Riverside | 河邊 | 河邊 |  |
| Maple Woods | 楓樹林 | 楓樹林 |  |
| Seashell Beach | 貝殼灘 | 貝殼海灘 | HK beaches are 灘 (淺水灣, 石澳灘). |
| Market Street | 商店街 | 商店街 | TODO(native): 商店街 is understood from Japan trips. 街市 would mean the wet market. |
| Town Square | 小鎮廣場 | 小鎮廣場 |  |
| Dog Park | 狗狗公園 | 狗狗公園 | Contains 狗公 followed by 園: the vulgar-word ban allows it. |
| Vet Clinic | 獸醫診所 | 動物醫院 | HK 獸醫診所. Only check-ups and kind news. |
| vet | 獸醫 | — |  |
| Grooming Salon | 寵物美容店 | 寵物美容店 |  |
| Pupuccino Café | 汪奇諾咖啡室 | 汪奇諾咖啡館 | HK 咖啡室. Pun on cappuccino (卡布奇諾). |
| Doggy Donut | 汪汪冬甩 | 汪汪甜甜圈 | HK 冬甩 = donut. |
| Kibble Corner | 狗糧士多 | 飼料小舖 | 士多 = a small corner shop in HK. |
| Bow-Wow Boutique | 汪汪時裝店 | 汪汪精品店 | HK 時裝店 = boutique. |
| Barkitecture | 汪汪建築 | 汪汪建築 | Pun bark + architecture. TODO(native): 汪築師 (建築師) is another option. |
| Pip's Sprout Cart | 皮普幼苗車仔 | 皮普的幼苗小車 | 車仔 = a little cart (車仔麵). |
| Shelter | 領養中心 | 動物之家 | HK SPCA and AFCD say 領養中心. Not 動物之家 (Taiwan). |
| Shelter Playroom | 領養中心遊戲室 | 動物之家遊戲室 |  |
| Lighthouse Pier | 燈塔碼頭 | 燈塔碼頭 |  |
| Hilltop Meadow | 山頂草地 | 山頂草地 |  |
| Town Loop | 小鎮一圈 | 小鎮環線 |  |
| Hilltop Trail | 山頂小徑 | 山頂小徑 |  |
| Pier Boardwalk | 碼頭長廊 | 碼頭棧道 | 長廊 as in 海濱長廊 (promenade). |
| Training Ground | 訓練場 | 訓練場 |  |
| Splash Pool | 嬉水池 | 戲水池 | LCSD pools have a 嬉水池 for kids. |
| Sunflower Lanes | 向日葵小徑 | 向日葵小徑 |  |
| Bamboo Grove Trail | 竹林小徑 | 竹林步道 |  |
| Seaside Cliffs Run | 海崖小徑 | 海崖步道 | 懸崖 avoided as a little scary. |
| agility course | 障礙賽道 | 敏捷賽道 | 障礙 is easier for kids than 敏捷. |
| rosette | 獎章 | 花章 | TODO(native): 襟花 is the ribbon rosette itself. |
| Doggy Life Vest | 狗狗救生衣 | 狗狗救生衣 |  |
| Float fetch | 浮波 | 漂浮撿球 | 浮 + 波. |
| paddle (pool) | 扒水 | 划水 | 狗仔扒水 / 狗爬式 = doggy paddle. |

**Characters**

| English | 廣東話 | zh-Hant (Taiwan) | Note |
|---|---|---|---|
| Gerald (the duck) | 傑拉德 | 傑拉德 | The guide duck who knows everything. He is 佢 like everyone. |
| Mrs. Plum | 布冧太太 | 梅子太太 | 布冧 is the Cantonese word for plum. Fun for HK kids. |
| Pip (the farmer) | 皮普 | 皮普 |  |
| Dr. Paws | 爪爪醫生 | 爪爪醫生 | The vet. |
| Baker Bea | 麵包師傅貝亞 | — | 師傅 is how HK addresses a baker or a cook. |
| Grandpa Joe | 喬伯伯 | — | A neighbour, not family: HK kids say 伯伯. |
| Grandma Lin | 林婆婆 | — | A neighbour: 婆婆. |
| Old Mr. Reyes | 雷耶斯伯伯 | — |  |
| Ms. Patel | 帕特爾小姐 | — |  |
| the Tanakas | 田中一家 | — |  |
| Captain Fluff | 蓬蓬隊長 | — |  |
| twins | 孖生 | — | 孖生 (一對孖生仔 / 孖生女). |

**Garden, kitchen and food**

| English | 廣東話 | zh-Hant (Taiwan) | Note |
|---|---|---|---|
| garden | 菜園 | 菜園 |  |
| seeds | 種子 | 種子 |  |
| water (plants) | 淋水 | 澆水 | HK 淋水, not 澆水. |
| harvest | 收成 | 收穫 | 收成 / 摘 (pick). |
| kitchen | 廚房 | 廚房 |  |
| cook | 煮 | 烹飪 | Button 煮. Only dog-safe food. |
| recipe | 食譜 | 食譜 |  |
| Pantry | 食物櫃 | 食物櫃 |  |
| carrot | 甘筍 | — | HK 甘筍 (紅蘿蔔 also heard). Not 紅蘿蔔 on items. |
| sweet potato | 番薯 | — | HK 番薯, not 地瓜. |
| potato | 薯仔 | — | HK 薯仔, not 馬鈴薯. |
| corn | 粟米 | — | HK 粟米, not 玉米. |
| strawberry | 士多啤梨 | — | HK 士多啤梨, not 草莓. |
| grapes / raisins (never for dogs) | 提子 / 提子乾 | — | HK 提子, not 葡萄. The food-safety lessons must use the HK word so kids recognise it. |
| chocolate (never for dogs) | 朱古力 | — | HK 朱古力, not 巧克力. |
| garlic (never for dogs) | 蒜頭 | — | HK 蒜頭. |
| avocado (never for dogs) | 牛油果 | — | HK 牛油果, not 酪梨. |
| macadamia (never for dogs) | 夏威夷果仁 | — | HK 夏威夷果仁. |
| cheese | 芝士 | — | HK 芝士, not 起司. |
| yoghurt | 乳酪 | — | HK 乳酪, not 優格. |
| cream | 忌廉 | — | HK 忌廉 (奶油 is ambiguous in HK). |
| honey | 蜜糖 | — | HK 蜜糖. |
| salmon | 三文魚 | — | HK 三文魚, not 鮭魚. |
| Salmon Pâté | 三文魚醬 | — | Matches the site. |
| toast (bread) | 多士 | — | HK 多士, not 吐司. |
| loaf (bread) | 方包 | — | The Corgi "loaf" joke: 我而家係一條方包. |
| pancake | 熱香餅 | — | HK 熱香餅. 鬆餅 in HK means a muffin. |
| donut | 冬甩 | — | HK 冬甩. |
| cookie | 曲奇 | — |  |
| ice lolly | 雪條 | — | HK 雪條, not 冰棒. |
| ice cream | 雪糕 | — | HK 雪糕, not 冰淇淋. |
| pear | 啤梨 | — |  |
| cucumber | 青瓜 | — |  |
| broccoli | 西蘭花 | — |  |
| peas | 青豆 | — |  |
| sausage | 腸仔 | — |  |
| fridge | 雪櫃 | — | HK 雪櫃, not 冰箱. |
| Chicken & Rice Bowl | 雞肉飯 | — |  |
| Basic Kibble | 基本狗糧 | — | Puppy Kibble = 幼犬糧. |

**Toys and things**

| English | 廣東話 | zh-Hant (Taiwan) | Note |
|---|---|---|---|
| Tennis Ball | 網球 | — |  |
| ball | 波 | — | HK 波. |
| Frisbee | 飛碟 | — | HK 飛碟, not 飛盤. |
| plush toy | 公仔 | — | HK 公仔 (毛公仔). 企鵝公仔, 新幹線公仔. |
| Squeaky Duck | 吱吱鴨仔 | — | Squeak = 吱吱. 鴨仔 = a little duck. |
| Rope Tug | 拔河繩 | — |  |
| Puzzle Feeder | 益智餵食器 | — |  |
| Snuffle Mat | 聞嗅墊 | — | Native check (9 Nov). The toy line says 聞嗅：. 索 = sniff stays in 基因索索機, 索索搵寶, 索索儀. |
| Rubber Chicken | 尖叫雞 | — | Same in HK. |
| ball pit | 波波池 | — | HK 波波池. |
| mittens / gloves | 手襪 | — | HK 手襪. |
| bicycle | 單車 | — | HK 單車, not 腳踏車. |
| raincoat | 雨褸 | — | HK 雨褸, not 雨衣. |
| umbrella | 遮 | — | HK 遮. |
| sweater | 冷衫 | — | HK 冷衫, not 毛衣. |
| Puffer Jacket | 羽絨 | — | HK just says 羽絨 for a puffer. |
| Polar Bear Hood | 北極熊帽 | — |  |
| Gingerbread Kennel | 薑餅狗屋 | — |  |
| Crayon Crown | 蠟筆皇冠 | — | HK 皇冠. |
| Golden Collar | 金色頸圈 | — |  |

**Seasons, weather and festivals**

| English | 廣東話 | zh-Hant (Taiwan) | Note |
|---|---|---|---|
| spring | 春天 | 春天 |  |
| summer | 夏天 | 夏天 |  |
| autumn | 秋天 | 秋天 |  |
| winter | 冬天 | 冬天 |  |
| weather | 天氣 | 天氣 |  |
| rain | 落雨 | 雨 | Verb form, the everyday word: 落緊雨. 雨 alone in compounds. |
| snow | 落雪 | 雪 | 落雪. 雪 alone in compounds (雪人, 雪球). |
| wet | 濕 | — |  |
| festival | 節日 | 節日 |  |
| leaf piles | 落葉堆 | 落葉堆 |  |
| Harvest Stall | 豐收攤檔 | 豐收攤位 | HK 攤檔. |
| stall | 攤檔 | — |  |
| Costume Parade | 變裝巡遊 | 變裝遊行 | HK 巡遊. Never 遊行 (a march). |
| Halloween | 萬聖節 | 萬聖節 | Cute, never scary. |
| Trick or treat | 唔俾糖就搗蛋 | — | The HK saying. |
| Pumpkin Patch Pop-up | 南瓜田快閃店 | 南瓜田快閃店 | 快閃店 is common in HK. |
| Snow Days | 落雪日 | 下雪天 |  |
| Winter Lights | 冬日燈飾 | 冬日燈飾 |  |
| Winter Stall | 冬日攤檔 | 冬日攤位 |  |
| Ugly Sweater Contest | 醜萌冷衫大賽 | 醜萌毛衣大賽 | The ugliness is the joke: ugly-cute. |
| Festive Market | 節日市集 | — |  |
| Halloween Market | 萬聖節市集 | — |  |
| Harvest Market | 豐收市集 | — |  |
| Winter Market | 冬日市集 | — |  |
| New Year | 新年 | 新年 | 1 January (Japanese New Year). Never 農曆新年, 過年, 春節, 拜年. |
| New Year card (nengajō) | 年賀狀 | 年賀狀 |  |
| Fortune box (omikuji) | 御神籤 | 御神籤 | Only happy fortunes. First time: 御神籤（日本嘅求籤）. |
| kadomatsu (pine) | 門松 | 門松 |  |
| mochi | 麻糬 | 麻糬 | Food item. The dog Mochi keeps its own name. |

**Japan and Tokyo**

| English | 廣東話 | zh-Hant (Taiwan) | Note |
|---|---|---|---|
| Japan-style | 日式 | 日式 | The safe word. Never "made in Japan". |
| Mt. Fuji | 富士山 | 富士山 |  |
| Mt. Fuji Lookout | 富士山觀景台 | 富士山觀景台 |  |
| Station | 車站 | 車站 |  |
| Shinkansen | 新幹線 | 新幹線 |  |
| Japan map | 日本地圖 | 日本地圖 |  |
| Tokyo | 東京 | 東京 |  |
| Shibuya Crossing | 澀谷十字路口 | 澀谷十字路口 |  |
| Hachikō | 八公 | 八公 |  |
| Yoyogi Park Dog Run | 代代木公園狗狗運動場 | 代代木公園狗狗運動場 |  |
| Asakusa and Sensō-ji | 淺草同淺草寺 | 淺草與淺草寺 |  |
| Tokyo Tower | 東京鐵塔 | 東京鐵塔 | TODO(native): 東京塔 is also heard in HK. |
| Ueno Park | 上野公園 | 上野公園 |  |
| Odaiba Seaside | 台場海濱 | 台場海濱 |  |
| stamp | 印仔 | 紀念章 | HK 印仔 (蓋印仔). Mission stamps. |
| Tokyo stamp | 紀念印仔 | — | Seven Tokyo stamps. |
| stamp book | 印仔簿 | 集章冊 |  |

**Dog Cards, photos, pack, Dog Days, Fun Fair**

| English | 廣東話 | zh-Hant (Taiwan) | Note |
|---|---|---|---|
| Dog Cards | 狗狗咭 | 狗狗卡片 | HK writes 咭 for a card (生日咭). No free text. |
| visiting dog | 嚟玩嘅狗狗 | 來訪的狗狗 |  |
| paw (on a card) | 爪爪 | 爪爪 | The one "like" per card per Japan day. |
| Photo mode | 影相模式 | 拍照模式 | HK 影相 = take a photo. |
| take a photo | 影相 | — |  |
| photo contest | 影相比賽 | — |  |
| postcard | 明信片 | 明信片 |  |
| All Together (pack play) | 大家一齊 | 大家一起 |  |
| pack | 狗狗隊 | — | The dogs you own together (v2.9). |
| Missions | 任務 | 任務 |  |
| Daily missions | 每日任務 | 每日任務 |  |
| treasure | 寶物 | 寶物 |  |
| letter | 信 | 信 |  |
| Mailbox | 信箱 | 信箱 |  |
| Calendar | 月曆 | — | HK 月曆. |
| Welcome week | 歡迎週 | — |  |
| gift | 禮物 | — |  |
| Today's gift | 今日禮物 | — |  |
| wish (the dog's daily wish) | 願望 | — |  |
| diary (the dog's) | 狗狗日記 | — |  |
| Sticker book | 貼紙簿 | — |  |
| What's new in town | 小鎮新鮮事 | — |  |
| Gerald's weekly news | 傑拉德週報 | — |  |
| Fun Fair | 嘉年華 | — | HK 嘉年華. Not 園遊會 (Taiwan). |
| minigame | 小遊戲 | — |  |
| town job | 兼職 | — | 兼職 = a part-time job. |
| Sniff & Seek | 索索搵寶 | — | 索 = sniff. |
| runner (the walk minigame) | 散步跑跑 | — | Only if a name is needed; the UI mostly says 散步. |
| Power-up | 道具 | — |  |
| Magnet | 磁石 | — | HK 磁石, not 磁鐵. |
| Bubble shield | 泡泡保護罩 | — |  |
| Super jump | 超級跳 | — |  |

**Friends (v2.19)**

| English | 廣東話 | zh-Hant (Taiwan) | Note |
|---|---|---|---|
| Friends (the feature) | 好友 | — | The feature and the menu. 朋友 in sentences. |
| friend | 朋友 | — |  |
| friend code | 好友碼 | — | As in HK game consoles. |
| friend name | 好友名 | — | Two Dog Card words, no space between them (fr.name = {a}{b}). |
| invite link | 邀請連結 | — |  |
| Share invite | 分享邀請 | — |  |
| Share poster | 分享海報 | — |  |
| Copy code | 複製好友碼 | — |  |
| Add (a friend) | 加 | — |  |
| Visit (a friend's yard) | 去玩 | — | Button. |
| yard visit | 探花園 | — |  |
| paw-print note | 爪印留言 | — | Preset notes only: no typed text leaves the device. |
| Leave a paw print | 留個爪印 | — |  |
| Send a gift | 送禮物 | — |  |
| Block | 封鎖 | — |  |
| Remove friend | 刪除好友 | — |  |
| Leave Friends | 退出好友 | — | fr.leave. |
| Scan or add {code} | 掃一掃或者輸入 {code} | — | One space before a Latin code. |

**Journal tabs, settings and buttons**

| English | 廣東話 | zh-Hant (Taiwan) | Note |
|---|---|---|---|
| Profile | 資料 | 資料 |  |
| Family | 家族 | 家族 |  |
| How to play | 玩法 | 玩法 |  |
| Settings | 設定 | 設定 |  |
| Sound | 聲音 | 聲音 |  |
| Music | 音樂 | 音樂 |  |
| Sound effects | 音效 | 音效 |  |
| Ambience | 環境聲 | 環境音 |  |
| Mute all | 全部靜音 | 全部靜音 |  |
| Motion and wobble | 動態同搖晃 | 動態與搖晃 |  |
| Language | 語言 | 語言 |  |
| Reset save | 刪除存檔 | 刪除存檔 | Native check (9 Nov): a save is 存檔 (save code 存檔碼). 進度 stays for progress (Bond track, walk progress). |
| save (verb) | 儲存 | — | 已經儲存咗。 |
| saved game (the save data) | 遊戲存檔, 存檔 | — | 訪客存檔, 載入呢個存檔. |
| Saved. | 已經儲存咗。 | — |  |
| Cloud save | 雲端儲存 | 雲端存檔 |  |
| device (this phone or computer) | 呢部機 | — | 部 is the measure word for phones and computers. |
| account | 帳戶 | — | HK 帳戶, not 帳號. |
| Log in | 登入 | 登入 |  |
| Sign up | 註冊 | 註冊 |  |
| Forgot your password? | 唔記得密碼？ | 忘記密碼？ |  |
| Title screen | 主畫面 | 標題畫面 |  |
| Back | 返回 | 返回 |  |
| Close | 關閉 | 關閉 | Button. |
| OK | 好 | 好的 | Button. |
| Yes | 好 | 好 | Button. 好呀 in a sentence. |
| No | 唔使喇 | 不了 | Button: a soft "no need". 唔要 sounds rude. |
| Not now | 遲啲先 | — | 遲啲 = later. |

## 10. Bans (machine check)

The `bans` in `yue.json`, checked by `tools/i18n_todo.js --merge` on every batch and by `game/test_i18n_node.js` on the whole table. They are the zh-Hant list widened for Cantonese: dog words include 狗BB, BB狗, 狗仔; the possessive 嘅 and the Cantonese 頸圈, 冷衫, 狗帶, 咭, 狗牌 count as dog things (so 「汪汪時裝店賣狗BB嘅衫。」 passes); buying something 俾 / 同 a dog passes; HK 放售, 轉讓, 打種, 一胎, 幾多錢 are caught; 熱狗 (hot dog) is not a dog. Two bans are new: 死 in any use, and the Cantonese vulgar words (粗口), including 狗公 and 狗乸.

| Rule | Pattern (JS RegExp source, flags) |
|---|---|
| "breed" as a verb (品種 = breed, the noun, is fine). HK also says 打種: never. Say 玩伴聚會, 生BB | <code>繁殖\|繁育\|配种\|配種\|交配\|育种\|育種\|配狗\|打種\|狗场\|狗場\|犬舍</code> (`u`) |
| stud (and breeding dam) | <code>(?&lt;![混品纯純])(?:种犬\|種犬\|种狗\|種狗)\|种公\|種公\|种母\|種母</code> (`u`) |
| litter price (puppies are always free) | <code>(?:一窝\|一窩\|一竇\|一胎)(?:狗BB\|BB狗\|狗仔\|狗狗\|小狗\|幼犬\|狗\|犬\|宠物\|寵物\|毛孩)(?:们\|們\|哋)?[^，。！？\n]{0,4}?(?:价格\|價格\|价钱\|價錢\|多少钱\|多少錢\|幾多錢\|幾錢\|售价\|售價)\|(?:狗BB\|BB狗\|狗仔\|狗狗\|小狗\|幼犬\|(?&lt;!熱)狗(?![BＢ仔狗])\|犬\|宠物\|寵物\|毛孩)(?:们\|們\|哋)?(?!狗\|犬\|粮\|糧\|用\|窝\|窩\|竇\|屋\|零食\|饼\|餅\|冷衫\|毛衣\|衫\|衣\|服\|玩具\|床\|帶\|绳\|繩\|链\|鏈\|项圈\|項圈\|頸圈\|碗\|蛋糕\|帽\|鞋\|食\|罐\|卡\|咭\|章\|印\|牌)[^，。！？\n]{0,3}?(?:价格\|價格\|价钱\|價錢\|多少钱\|多少錢\|幾多錢\|幾錢\|售价\|售價\|标价\|標價)</code> (`u`) |
| selling (or buying) dogs, incl. HK 放售 / 轉讓. Shops selling items is fine, and so is buying a treat 俾狗狗 | <code>(?:卖\|賣\|出售\|放售\|转让\|轉讓\|出讓\|贩卖\|販賣\|转卖\|轉賣\|买\|買\|购买\|購買)(?:掉\|了\|咗\|给\|給\|俾\|畀)?(?:[^，。！？\n俾畀同幫为為给給]{0,4}?)(?:狗BB\|BB狗\|狗仔\|狗狗\|小狗\|幼犬\|(?&lt;!熱)狗(?![BＢ仔狗])\|犬\|宠物\|寵物\|毛孩)(?:们\|們\|哋)?(?!狗\|犬\|粮\|糧\|用\|窝\|窩\|竇\|屋\|零食\|饼\|餅\|冷衫\|毛衣\|衫\|衣\|服\|玩具\|床\|帶\|绳\|繩\|链\|鏈\|项圈\|項圈\|頸圈\|碗\|蛋糕\|帽\|鞋\|食\|罐\|的\|嘅\|卡\|咭\|章\|印\|牌)\|(?:狗BB\|BB狗\|狗仔\|狗狗\|小狗\|幼犬\|(?&lt;!熱)狗(?![BＢ仔狗])\|犬\|宠物\|寵物\|毛孩)(?:们\|們\|哋)?(?!狗\|犬\|粮\|糧\|用\|窝\|窩\|竇\|屋\|零食\|饼\|餅\|冷衫\|毛衣\|衫\|衣\|服\|玩具\|床\|帶\|绳\|繩\|链\|鏈\|项圈\|項圈\|頸圈\|碗\|蛋糕\|帽\|鞋\|食\|罐\|的\|嘅\|卡\|咭\|章\|印\|牌)[^，。！？\n]{0,4}?(?:被卖\|被賣\|俾人賣\|畀人賣\|出售\|放售\|待售\|转让\|轉讓\|卖掉\|賣掉\|卖给\|賣給\|賣俾\|賣畀\|卖了\|賣了\|賣咗\|卖出\|賣出\|買賣)</code> (`u`) |
| franchise name (寵物小精靈 and 比卡超 are the HK names) | <code>任天堂\|任天狗\|宝可梦\|寶可夢\|神奇宝贝\|神奇寶貝\|口袋妖怪\|口袋怪兽\|口袋怪獸\|寵物小精靈\|比卡超\|动物森友\|動物森友\|动物之森\|動物之森\|动森\|動森</code> (`u`) |
| "made in Japan"; say 日式 (Japan-style). 原產日本 for a dog breed is a fact and fine | <code>日本制造\|日本製造\|日本制\|日本製\|日本产\|日本產\|产自日本\|產自日本\|日本原装\|日本原裝\|日货\|日貨\|日本貨\|日本(?:的\|嘅)?游戏\|日本(?:的\|嘅)?遊戲</code> (`u`) |
| franchise name (Latin spelling) | <code>nintendo\|pok[eé]mon\|animal crossing</code> (`iu`) |
| "made in Japan" (Latin spelling); say Japan-style | <code>made in japan\|japanese-made</code> (`iu`) |
| nothing bad ever happens: no death words, also not as an intensifier (笑死, 攰到死, 悶死). Say 好好笑, 好攰, 暈低. A true fact about a person (Hachikō's professor) is 過身. 病 is kept out by the style guide, not here: the site FAQ asks whether dogs get 唔舒服 | <code>死</code> (`u`) |
| Cantonese vulgar words and rude homophones (粗口), and 狗公 / 狗乸 (insults in HK). Readers include children. Say 男仔 / 女仔 for a dog's sex | <code>屌\|𨳒\|撚\|閪\|(?&lt;!斑)鳩\|柒\|仆街\|冚家\|戇居\|躝屍\|狗公(?!園)\|狗乸\|on9</code> (`iu`) |

Caught on purpose (test sentences): 「我哋嚟繁殖狗狗」 「配種」 「打種」 「種犬」 「一胎狗仔幾多錢？」 「狗仔幾錢？」 「賣狗BB」 「賣咗隻狗」 「買一隻狗仔」 「狗BB俾人賣咗」 「狗仔放售」 「轉讓唐狗」 「寵物小精靈」 「比卡超」 「動物森友會」 「日本製造」 「日本貨」 「animal crossing」 「笑死我」 「仆街」 「on9」 「狗乸」

Never hit (the `allow` list, also used as negative tests; plus 「買零食俾狗狗食」 「攤檔賣熱狗」 「買咗新狗帶」 「狗糧士多有狗糧賣」 「我哋去狗狗公園」): 「品種係柴犬，原產日本。」 「冬日攤檔有狗狗冷衫賣。」 「狗糧士多賣狗糧同零食。」 「汪汪時裝店賣狗BB嘅衫。」 「買啲零食俾狗狗啦！」 「同狗狗買零食啦！」 「狗BB免費去新屋企。」 「汪汪建築賣狗屋。」 「領養一隻狗BB啦！」 「唐狗都好得意㗎。」 「去狗狗公園玩啦！」 「攤檔賣熱狗同雪糕。」 「日式狗屋好靚。」 「影一張狗狗咭啦。」

The merge tool excuses a ban hit when the line contains an `allow` phrase, so every allow phrase is a whole sentence ending in 。 or ！, never a short word that could excuse a real hit.

**Not in `bans` (for now), but a reviewer's check.** The placeholder tables (`game/i18n/yue.json`, `site/i18n/yue.json`) start as copies of zh-Hant, so Mandarin-only patterns cannot be bans until every key is translated (they would fail `test_i18n_node.js` on the placeholders). Each translation batch must pass `node tools/yue_chunks.js --leaks <batch.json>` instead (step 4 of `coord/yue_plan.md`; it uses this list, with 的 / 了 / 是 / 在 as hand checks only): these strings almost never appear in spoken Cantonese, and each hit means a line was converted, not translated.

`們` `牠` `(?<!其)他` `她` `它` `沒有` `沒什麼` `什麼` `這` `那` `哪` `怎麼` `為什麼` `不要` `不是` `不會` `不能` `不用` `喜歡` `東西` `現在` `今天` `明天` `昨天` `吧` `嗎` `喔`, and the Taiwan words of section 11 (飼料, 帳號, 米克斯 …). When the table is fully translated, a later release may move these into `bans` (TODO, section 14).

## 11. Hong Kong words, not Taiwan words

zh-Hant is written for Taiwan. These are the differences translators meet most. Left: never in yue. Right: the HK word.

| Taiwan (zh-Hant) | Hong Kong (yue) | Meaning |
|---|---|---|
| 毛孩 | 狗狗, 狗仔 | fur kid (毛孩 is creeping into HK, but keep it out of the game) |
| 飼料 | 狗糧 | kibble |
| 帳號 | 帳戶 | account |
| 軟體, 網路, 影片 | 軟件, 網絡, 片 | software, internet, video |
| 品質 | 質素 | quality |
| 米克斯 | 唐狗 | mixed-breed dog |
| 米格魯, 吉娃娃, 柯基, 巴哥, 黃金獵犬, 雪納瑞, 博美 | 比高, 芝娃娃, 哥基, 八哥, 金毛, 史納莎, 松鼠狗 | breeds (section 8) |
| 貴賓狗 | 貴婦狗 | poodle |
| 動物之家, 收容所 | 領養中心 | shelter |
| 動物醫院 | 獸醫診所 | vet |
| 衣櫥 | 衣櫃 | wardrobe |
| 衣服, 毛衣, 雨衣, 手套 | 衫, 冷衫, 雨褸, 手襪 | clothes, sweater, raincoat, gloves |
| 項圈, 牽繩 | 頸圈, 狗帶 | collar, leash |
| 院子 | 花園 | yard |
| 澆水 | 淋水 | water plants |
| 才藝 | 把戲 | trick |
| 拍照 | 影相 | take a photo |
| 卡片 | 咭 | card (狗狗咭, 生日咭) |
| 點 (tap) | 撳 | tap, press |
| 遊行 | 巡遊 | parade (遊行 is a march in HK) |
| 園遊會 | 嘉年華 | fun fair |
| 攤位 | 攤檔 | stall |
| 腳踏車, 公車, 捷運, 計程車 | 單車, 巴士, 港鐵, 的士 | bike, bus, metro, taxi |
| 冰箱, 冰淇淋, 冰棒 | 雪櫃, 雪糕, 雪條 | fridge, ice cream, ice lolly |
| 馬鈴薯, 地瓜, 玉米, 紅蘿蔔 | 薯仔, 番薯, 粟米, 甘筍 | potato, sweet potato, corn, carrot |
| 草莓, 葡萄, 葡萄乾, 鳳梨, 酪梨, 小黃瓜, 花椰菜, 西洋梨 | 士多啤梨, 提子, 提子乾, 菠蘿, 牛油果, 青瓜, 西蘭花, 啤梨 | fruit and veg |
| 巧克力, 起司, 優格, 奶油 (butter), 鮮奶油 | 朱古力, 芝士, 乳酪, 牛油, 忌廉 | food |
| 鮭魚, 鮪魚 | 三文魚, 吞拿魚 | salmon, tuna |
| 吐司, 鬆餅 (pancake), 甜甜圈, 三明治, 餛飩, 香腸, 蜂蜜 | 多士 / 方包, 熱香餅, 冬甩, 三文治, 雲吞, 腸仔, 蜜糖 | food |
| 磁鐵, 飛盤, 絨毛玩具, 玩偶 | 磁石, 飛碟, 公仔 | magnet, frisbee, plush |
| 麋鹿 | 馴鹿 | reindeer |
| 肉球 | 腳掌, 爪爪 | paw pads (the Japanese 肉球 is fine only as a joke) |
| 傑拉德說 | 傑拉德話 | "Gerald says" (話 = say) |
| 喔、耶、吧、嗎 | 喎、呀、啦、喇、嘛、咩 | particles (section 3) |

## 12. Puns and jokes

Rewrite, never translate word for word. A good Cantonese joke for kids is short, uses a word they say every day, and is never rude.

- **Dog sounds:** 汪汪 (bark), 嗷嗚 (howl), 吱吱 (squeak), *哼哼* (pug snort), *索索* (sniffing), 咻 (zoom). 汪 works as a prefix pun: 汪汪冬甩, 汪奇諾咖啡室, 汪汪時裝店, 汪汪蛋糕.
- **索 = sniff** is a free Cantonese joke: 基因索索機, 索索搵寶 (Sniff & Seek), 「索到啲好嘢喎！」 (the Snuffle Mat is the shop word 聞嗅墊, native check 9 Nov).
- **HK life gives the best jokes:** the Chihuahua's "I AM A WEATHER EVENT" becomes 「我係八號風球！！」; the Husky's opera howl becomes 大戲 (Cantonese opera); the Corgi "loaf" is 一條方包; a dog guarding the house checks your 身份證; the Shiba is 話事人 (the boss).
- **Reduplication** is cute and natural: 摸摸, 霜霜, 桃桃, 麵麵, 暖笠笠, 毛毛, 濕立立, 香噴噴, 圓碌碌.
- **Never** a pun that lands on a rude word, a curse homophone (anything near 屌, 鳩, 柒, 撚, 閪, 仆), a toilet word beyond 去廁所, or 死 / 鬼 as an intensifier (好鬼好食, 笑死). Ghosts at Halloween are 小幽靈, never 鬼仔 (also slang for a foreign boy).
- **Mixes** (`data.mix_list.*`): only the well-known real mixes get a Cantonese name; the English pun names stay English and show as A × B (as zh-Hant).
- Keep facts true (Hachikō, Shibuya, food safety). A joke never changes a fact.

## 13. How to translate a key: the checklist

1. **Meaning from English.** Read the English line (and grep the key in `game/src` if unsure where it shows). Use `zh-Hant.json` only for item names and joke ideas, never as text to convert.
2. **Who is talking?** UI, Gerald, a dog (which breed, which personality), a family, a lesson. Pick the register of section 2.
3. **Glossary words exactly** as `game/i18n/glossary/yue.json` has them: breed names, places, items, people, game terms.
4. **Placeholders byte-exact:** every `{name}`, `{n}`, `{dog}`, `{code}` stays as it is, spelled the same. Inside `{n, plural, ...}` and `{x, select, ...}` keep the arg name, the keywords and `other`; translate only the text inside the branches. `#` stays. A `sex` select may be dropped (佢 has no gender); nothing else may be dropped or added.
5. **HTML tags byte-exact:** `_html` keys keep the same tags (`<b>`, `</b>`, `&mdash;`). Translate between them.
6. **Spoken Cantonese** (section 3): 係 not 是, 唔 not 不, 嘅 not 的, 佢 not 他/她/它/牠, no 們. Read it aloud.
7. **Particles** where a person would use one; none on buttons; not on every line.
8. **Word rules** (section 5): no "breed" verb, no sale of dogs, no 死, no 粗口, food-safety facts kept.
9. **Lessons:** exactly two sentences ending in 。
10. **Punctuation:** 「」『』，。！？ full-width, no ；, no emoji, no spaces next to digits.
11. **Length:** buttons 4 characters, toasts about 18; drop the particle first if it is long.
12. **Run the batch through** `node tools/i18n_todo.js yue --merge <file> --dry`, then the Mandarin check of section 10, then merge.

## 14. Native check (answered 9 Nov 2026)

The owner's friend, a native Hong Kong speaker, checked 480 lines on the review page (391 game, 39 site, plus the questions of `coord/yue_native_check.md`): 430 OK, 50 changed. Applied in `coord/yue_review_applied.md`. Everything this section used to ask is answered:

- **Confirmed as they are:** 狗BB for "puppy" in sentences; 布冧太太; 唐狗; the breed names (銀狐犬, 松鼠狗, 約瑟爹利, 馬爾濟斯, 迷你史納莎, 迷你杜賓, 格力犬); 隕石色 for merle; 獎章 for rosette; 商店街; 東京鐵塔; 汪汪建築; 發情期; the website and privacy page in spoken Cantonese.
- **Changed:** the Snuffle Mat is 聞嗅墊; the Play button is 去玩 (see section 9).

## 15. Rules from the native check (9 Nov 2026)

Each rule comes from one or more of the friend's changes and was swept across `game/i18n/yue.json` and `site/i18n/yue.json`. Keep them in new text.

| Rule | Instead of | Note |
|---|---|---|
| a save, the save data: **存檔**; save code **存檔碼**; Reset save **刪除存檔** | 進度, 進度碼 | 進度 stays for progress (親密度進度表, 散步進度, 訓練進度). 儲存 stays the verb. 存檔 is no longer a leak word. |
| ENCORE: **encore / Encore** in Latin letters | 安哥 | As HK people write it. |
| Vampire Cape: **吸血鬼披風** | 德古拉披風 | Fine for children in this one item name. |
| cranberry: **蔓越莓** | 紅莓 | |
| baked plain: **齋焗** | 淨焗 | |
| couch potato: **電視精** | 梳化薯仔, 梳化懶蟲 | |
| show-off: **show off** (鍾意show off, 愛show off; the Spitz trick Show Off緊) | 騷包 | |
| bring, carry (a toy, a baguette): **拎** | 擰 | 擰 stays for turning the head (擰轉頭, 擰起頭) and 扭扭擰擰. |
| Boing, boing: **彈下，彈下** | 彈彈，彈彈 | 彈彈彈 and 彈彈跳 stay. |
| a horse: **一隻馬** | 一匹馬 | |
| Puppy Playdates (heading): **BB狗Gathering** | 狗BB玩伴聚會 | In a sentence the feature stays 狗BB玩伴聚會 (the friend kept it there). |
| Off (a setting): **閂**; Barking: **狗吠** | 關, 吠聲 | |
| Cone of Dignity: **頭罩** | 尊嚴頭罩 | |
| grand-mix: **第二代混種** | 混混種 | |
| N dog years: **N歲狗** | N狗狗歲 | |
| play bow: **趴低搖尾** | 玩耍鞠躬 | |
| roaching (greyhound): **瞓到反肚** | 曱甴瞓 | |
| shimekazari: **新年裝飾** | 注連飾 | |
| Paw! (the spoken command): **Hand Hand！** | 俾手！ | The trick itself stays 握手. |
| legally (in a joke): drop it or say **照規矩** | 依法 | |
| Welcome week: **迎新週**; Today's gift: **是日禮物** | 歡迎週, 今日禮物 | |
| English names stay English where HK kids say them: **Gary** | 加利 | Other NPC names keep their Cantonese names. |

Still open (not asked): moving the Mandarin-leak patterns of section 10 into `bans` now that both tables hold no zh-Hant placeholders (`tools/yue_chunks.js --leaks game/i18n/yue.json`: 0 leaks).
