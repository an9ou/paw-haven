# Cantonese (yue): terms fixed in chunk 4

Chunk 4 (items and home: clothes, food, toys, decor, beds, houses, treasures, kitchen, garden) is done: 1,552 keys. It reuses the glossary and `yue_terms_c1.md` (outfit names match `data.dc_outfits`; 吊飾, 戴上 / 除低, 一齊玩, number-first stat changes). The words below are new. Chunks 5 to 7 reuse them; look a key up in `game/i18n/yue.json` for the exact line.

## Format rules chunk 4 settled

- Perk and toy notes start with a short tag and a full-width colon: `暖笠笠：落雪唔會打冷震。`, `雨褸：落雨唔會整污糟，仲+5開心值。`, `揸揸：…`, `瞓覺好拍檔：瞓覺體力+10%。`
- Unsigned stat changes stay as in English: `+開心值，-體力，少少親密度`.
- "while worn / equipped" = `戴住嗰陣` / `戴上嗰陣` (clothes on the body: `著住嗰陣`).
- `{touch, select, yes {tap…} other {click…}}`: both branches say 撳, so both are the same text (the merge tool only lets a `sex` select go). Where the English differs in more than the verb (flick vs drag), the branches differ too.
- `{p}` crop words (`garden.one_*`, `garden.plural_*`) are the same word in both forms, apart from 青豆莢 / 青豆 and 菠菜葉 / 菠菜. Lines say 個{p} for one and 啲{p} for many.
- Dog lines in `mod.toys` are lower-case English: short spoken Cantonese, at most one ！ (no ！！, those are only for the Chihuahua and the Corgi).

## Words

| English | 廣東話 | Where |
|---|---|---|
| Warm: no shivering in the snow | 暖笠笠：落雪唔會打冷震 | data.clothes |
| no soggy shake after rain | 落完雨唔使濕立立咁震水 | data.clothes |
| no mud (raincoat) | 唔會整污糟 | data.clothes |
| daily fashion bonus | 每日時裝獎勵 | data.clothes |
| compliments on walks | 散步俾人讚 | data.clothes |
| A Bond 10 gift | 親密度10嘅禮物 | data.clothes |
| A look, not a snack | 淨係好睇，唔係零食 | data.clothes, data.houses |
| felt (material) / fleece | 毛氈 / 絨布 | everywhere |
| stripes / tartan, plaid | 間條 / 格仔 | everywhere |
| icing / gumdrop | 糖霜 / 軟糖 | data.houses, data.clothes |
| Father Christmas Suit / Little Elf Outfit / Nutcracker | 聖誕老人裝 / 小精靈裝 / 胡桃夾子 | data.clothes |
| Puffer Jacket | 羽絨 (glossary) | data.clothes |
| Skeleton Suit | 骨頭裝 (not 骷髏: kept cute) | data.clothes |
| Mummy Wraps / Rope Mummy | 木乃伊繃帶 / 木乃伊繩 | data.clothes, data.toys |
| Boo (ghost) | 嘩 | everywhere |
| Witch Hat (bed, decor) | 女巫帽 (same as data.dc_outfits); Wizard Hat 巫師帽 | data.beds |
| Cauldron | 魔法大鍋 / 大鍋 | data.beds, data.hm_decor |
| nest (bed) | 小竇 | data.beds |
| Hammock | 吊床 | data.beds, data.hm_decor |
| Cozy Cottage (doghouse) | 暖笠笠村屋 (the place Cozy House stays 暖笠笠小屋) | data.houses |
| mortgage (joke) | 供樓 | data.houses |
| Friendly Haunted Kennel | 小幽靈狗屋 (no 鬼) | data.houses |
| Camper Van / Treehouse / Igloo | 露營車 / 樹屋 / 雪屋 | data.houses |
| name plate (on a doghouse) | 門牌 (not 名牌) | data.houses |
| pie | 批 (批餡 = pie filling) | data.houses, data.food |
| treasure ability names (`.ab`) | 松鼠外交, 掟圈圈, 幸運狗, 袋袋平安, 唔怕水氹, 「借」咗嘅午餐 … | data.treasures |
| Old Map Piece (Beach / Park / River / Woods) | 舊地圖碎片（沙灘 / 公園 / 河邊 / 樹林） | data.treasures |
| Treasure Map | 藏寶圖 | data.treasures |
| dig (per walk) | +1次掘寶 | data.treasures, toys |
| Play ball with it / per return | 用佢嚟玩掟波 / 每次執返嚟 | data.treasures, data.toys |
| Bag (walk bag) | 袋 (Use on a walk (Bag) = 散步時用（袋）) | data.treasures |
| Lucky Penny / Sea Glass / Squeaky Hedgehog | 幸運銅仙 / 海玻璃 / 吱吱刺蝟 | data.treasures |
| Glowing (mood) | 閃閃發光 | data.treasures |
| clean teeth | 牙齒乾淨 | data.food |
| xylitol | 木糖醇 | data.food |
| nutmeg / baking spices | 肉豆蔻 / 焗餅香料 | data.food |
| cyanide (apple seeds) | 氰化物 | data.food.apple_slices.tip |
| oats / rolled oats / oat flour | 燕麥 / 燕麥片 / 燕麥粉 | data.food, data.pantry |
| turkey / cranberry | 火雞 / 紅莓 | data.food |
| green beans / spinach / pea pod | 四季豆 / 菠菜 / 青豆莢 | data.food, garden |
| carob / cocoa | 角豆 / 可可 | data.food |
| watermelon (seedless) | 無核西瓜 | data.food |
| Senbei / Kinton | 狗狗仙貝 / 汪汪栗金團 | data.food |
| Pupsicle | 汪汪雪條 | data.food, data.recipes |
| Puppy Kibble | 幼犬糧 (glossary note) | data.food |
| Mystery Mush | 神秘糊糊 | data.recipes |
| Spinach Scramble / Carrot Crunchies | 菠菜炒蛋 / 甘筍脆脆 | data.recipes |
| plain (food) | 原味 / 淨 (淨焗, 淨煮) | data.food |
| choking piece | 哽親 | data.food |
| Rice (pantry) | 白飯 | data.pantry |
| Fresh Water | 清水 | data.food, data.pantry |
| Frisbee-type flyer | 飛碟 (never 飛盤) | data.toys |
| Paddling Pool | 充氣水池 | data.toys |
| Nap buddy | 瞓覺好拍檔 | data.toys |
| Treat Cone | 零食舐舐筒 | data.toys |
| Agility Tunnel | 障礙隧道 | data.toys |
| fairy lights / garland / bunting | 燈串 / 彩帶 / 彩旗 | data.hm_decor |
| Lucky Cat (maneki-neko) | 招財貓 | data.hm_decor |
| Kadomatsu Pair | 一對門松 | data.hm_decor |
| cushion | 軟墊 (not 咕𠱸: rare character) | everywhere |
| Recipe book | 食譜簿 | mod.kitchen |
| pot (cooking) / Put in pot | 煲 / 放落煲 | mod.kitchen |
| Cook! / Cook by heart | 煮！ / 憑記憶煮 | mod.kitchen |
| dish | 餸 (一味餸) | mod.kitchen, garden |
| ingredients | 材料 | mod.kitchen |
| People pantry / not for dogs / not for pups | 人食嘅食物櫃 / 唔俾狗狗食 / 唔俾狗BB食 | mod.kitchen, garden |
| Paw stop | 爪爪叫停 | mod.kitchen |
| judge: Perfect / Nice / Close enough / Whoosh | 完美！ / 唔錯！ / 差唔多啦！ / 咻！ | mod.kitchen |
| golden zone / needle | 金色範圍 / 指針 | mod.kitchen |
| Veggie Patch | 菜園 | mod.garden |
| plot | 塊地 (第{n}塊地) | mod.garden, garden |
| Seeds / Watering Can / Basket / Seed pouch | 種子 / 花灑 / 籃 / 種子袋 | mod.garden |
| Plant / Harvest / ready to pick | 種 / 收成 / 可以摘 | mod.garden |
| thirsty (plot) / soggy | 口渴 / 濕晒 | mod.garden |
| in season / off-season / half speed | 當造 / 唔當造 / 慢一半 | mod.garden, garden |
| regrows / picks | 再生 / 摘得{p}次 | garden |
| IOU (Captain Fluff) | 欠條 | mod.garden, garden |
| hardy (crop) | 耐寒 | garden |
| town compost | 小鎮堆肥 | garden |
| buff | 效果 | garden |
| Expecting! / Due in n days / Due any moment | 有BB喇！ / #日後出世 / 隨時出世 | garden |
| Nursing n puppies / New homes in n days / Choosing day! | 湊緊#隻狗BB / #日後去新屋企 / 揀屋企日！ | garden |
| Litters: n of max / Litters fathered / Four litters | 生過：{n} / {max}胎 / 做過爸爸：{n}次 / 生過四胎 | garden |
| Spayed / Neutered / Not fixed | 絕育咗 / 絕育咗 / 未絕育 | garden |
| Season (heat, profile card) | 發情期 | garden.season |
| Proud Mum / Mum / Dad | 自豪媽媽 / 媽媽 / 爸爸 | garden |
| Gen {gen} / Generation 0 · rescued / shelter starter | 第{gen}代 / 第0代 · 領養返嚟 / 領養中心第一隻 | garden |
| stage: puppy / young / adult / senior | 狗BB / 少年狗狗 / 大狗狗 / 年長狗狗 | garden |
| Dog spots | 狗狗位 | garden |
| Paperwork pending | 文件處理緊 | garden |
| gene feedback | 黑色素, 肝色（朱古力色）, 淡色, 原色, 深色素, 帶住…基因, 花斑, 純色, 鴛鴦眼 | garden.fb_* |
| Potty stats / Scooped / Accidents indoors | 去廁所紀錄 / 執咗 / 喺屋入面去錯地方 | garden.potty |
| Bond moment / Clean run | 親密時刻 / 完美一轉 | mod.toys, toys |
| tuck in (blanket) | 冚被 | mod.toys |
| ENCORE | 安哥 | mod.toys |
| meters in toy play | 演唱會指數, 舐舐指數, 冚被指數, 拉力表 | mod.toys |
| HOT (Nose-o-meter) | 「熱」 (chunk 5: `mod.walk.nose_hot` should be 熱, with 暖 / 凍) | toys.res_hidden_txt |

## For a native speaker to check (TODO(native))

- `data.food.apple_slices.tip`: 蘋果核含有少少氰化物 keeps the English fact (cyanide). Is 氰化物 too technical for children? (蘋果核對狗狗有少少毒 is the plain option.)
- `data.food.snowflake_oat_cookies.tip`: 會令狗狗企唔穩又唔舒服 for "make dogs wobbly and ill".
- `data.food.pup_kinton.n`: 汪汪栗金團 for Pup Kinton (栗金團 is the Japanese New Year sweet). Known in HK?
- `data.food.turkey_cranberry_bites.*`: 紅莓 for cranberry (蔓越莓 is also seen in HK shops).
- `data.food.warm_carob_cup.*`: 角豆 for carob. HK health shops may say 角豆粉.
- `data.toys.snuffle_mat.n`: 索索墊 (glossary TODO stays: 嗅聞墊 is the shop word).
- `data.houses.cozy_cottage.n`: 暖笠笠村屋, with the 供樓 (mortgage) joke for HK kids.
- `data.houses.friendly_haunted_kennel.note`: 佢淨係會黐住個狗碗 for "the only thing it haunts is the food bowl".
- `data.treasures.lucky_penny.ab`: 袋袋平安 (HK saying for pocketing a win) as the ability name.
- `data.treasures.duck_s_picnic_sandwich.ab`: 「借」咗嘅午餐 for "Stolen Lunch" (softer than 偷).
- `data.hm_decor.rocking_chair.story`: 湊咗成日狗BB之後，狗媽媽最鍾意喺度搖下.
- `garden.season`: the profile card heading for a girl dog is 發情期 (same TODO as the glossary).
- `garden.fathered`: 做過爸爸：{n}次 for "Litters fathered" (no breeding word).
- `garden.stage_young` 少年狗狗 and `garden.stage_senior` 年長狗狗 (genes uses 年長狗狗).
- `mod.toys.encore`: 安哥 (HK concert word) for ENCORE.
- `mod.toys.ooh_spooky_throw_it`: 好神秘 for "spooky", to keep fear out.
- `mod.toys.boo_*`, `data.clothes.ghost_sheet.perk`: 嘩 for a ghost's "boo".
