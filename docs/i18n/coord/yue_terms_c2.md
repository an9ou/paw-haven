# Cantonese (yue): terms fixed in chunk 2

Chunk 2 (the dog lines: greetings, meals, potty, jokes, signature tricks, personalities, toy play, ball play, kitchen and garden lines, town dogs) is done: 1,120 keys. It reuses chunk 1 and the glossary; the words below are new. Chunks 3 to 7 (the site's dog profiles above all) reuse them. Look a key up in `game/i18n/yue.json` for the exact line.

## Format rules chunk 2 settled

- The `sex` select is dropped everywhere in the dog lines (佢 has no gender), including `data.breed_line.afghan`, where it wrapped the whole sentence.
- Placeholders sit right against the Chinese: `{n}食完……`, `{name}行埋嚟要摸摸。`
- Sound effects stay between asterisks: `*哼哼*`, `*打喊露*`, `*呼嚕嚕嚕*`.
- English shouting in caps becomes ！ (！！ only for the Chihuahua and the Corgi). Lowercase toy-play bubbles stay short, often with no full stop, like the English.
- Speeds: 45 mph is 時速72公里 (HK kids think in km).

## Dog sounds

| English | 廣東話 | Who |
|---|---|---|
| snort / happy snort | *哼哼* / *開心哼哼* | pug, frenchie, shihtzu |
| wheeze / huff / snerk | *呼呼* / *呼* / *噗* | pug, frenchie |
| snore | *呼嚕嚕嚕* (in lines 扯鼻鼾) | pug |
| rrf / arf | 嗚汪 / 汪 | pug, frenchie |
| yip / yap | 汪 | small dogs |
| AWOO (howl) | 嗷嗚 | husky, others |
| AROOO (bay) | 啊嗚嗚 | beagle |
| woo-woo (talking) | 嗚嗚 | samoyed, malamute |
| roo (soft) | 嗚 | greyhound |
| GRRR / growl | 吼 / 吼吼 | tug toys |
| mmrf / rumble | 唔汪 / 轟轟聲 | mastiff, corso |
| NYOOOM / ZOOM | 咻 | golden, greyhound |
| Boing | 彈 | bichon, ball play |
| Ta-da | 噹噹 | |
| Splash / Splosh / Plop | 嘩啦 / 啪嗒 / 撲通 | |

## Words and running jokes

| English | 廣東話 | Where |
|---|---|---|
| bum (golden's wag, sniffing) | pat pat | eat_lines.golden, npc_jokes.6 |
| lap / lap dog | 大髀 / 抱抱狗 | pug, dane, pitbull, maltese |
| belly rub | 掃肚肚 (chunk 1) | sr_lines, npc_lines |
| lean (mutt, greyhound) | 挨 / 挨挨 | sig.mutt.n 挨挨 |
| hole (dig) | 窿 (掘窿, 歡迎窿) | dachs, westie, malamute |
| weave poles / tyre / table | 穿柱 / 車胎 / 枱 | ag_lines |
| rosette flag / bunting | 獎章旗 / 彩旗 | ag_lines |
| ring float (pool) | 水泡 | pl_lines.collie |
| the step / ramp (pool) | 級樓梯 / 斜路 | pl_lines |
| security system (chihuahua) | 保安系統 | chihuahua, chi_alert |
| intruder | 有人入侵 | chi_alert |
| mail carrier / postman | 郵差 | chi_alert, ho_lines |
| IOU (Captain Fluff) | 欠條 | fluff_lines (chunk 4 `garden.squirrel` should match) |
| on duty / reporting | 當緊值 / 報到 | gsd, dobie |
| mission complete | 任務完成 | gsd, dobie |
| Threat level: cuddle | 威脅等級：攬攬 | sig.dobie.say |
| marshmallow (soft heart) | 棉花糖 | jokes.dobie.2 |
| very small horse | 迷你馬 | minpin |
| topknot | 頭頂嗰嚿毛 | stdpoodle, maltese, shihtzu |
| fringe (maltese) | 瀏海 | maltese |
| eyebrows / beard | 眉毛 / 鬍鬚 | schnauzer |
| carrot tail | 甘筍尾 | westie |
| cotton ball / cloud | 棉花球 / 毛毛雲 | bichon |
| little queen / diva | 小女王 / 迷你天后 | yorkie |
| charging (resting) | 叉電 | jokes.greyhound.3 |
| file a complaint | 投訴 | jokes.husky.1 |
| I called the police: you | 我已經報咗警。警察就係你。 | jokes.chihuahua.2 |
| hedgehog (toy) | 刺蝟 | hogroll |
| cushion / lift | 咕臣 / 升降機 | ho_lines (not 𠱸, 𨋢: font) |
| chef | 大廚 | lines.* (kitchen) |
| Not for pups | 狗狗唔食得 | lines.nope.0 |
| people shelf | 人類嘅架 | lines.nope.2 |

## Signature tricks (`data.sig.*.n`)

誇張暈低 (shiba), 方包 (corgi), 衝衝衝 (golden), 麵麵扭扭舞 (dachs), 大戲嚎叫 (husky), 挨挨 (mutt), 迷你龍捲風 (chihuahua), 哼哼轉圈 (pug), 衝衝衝跑圈 (greyhound), 大聲嚎 (beagle), 貴婦踏步 (poodle), 牧羊眼神 (collie), 天使微笑 (samoyed), 青蛙趴 (frenchie), 靜靜守候 (akita), 騷包表演 (spitz), 迷你轉圈 (pom), 撥頭髮 (afghan), 高高鞠躬 (dane), 超級攤低 (mastiff), 敬禮 (gsd), 哨兵坐 (dobie), 溫柔挨挨 (corso), 扭扭攬攬 (pitbull), 高抬腿踏步 (minpin), 食飯舞 (lab), 嗚嗚演講 (malamute), 獅子pose (chow), 大大個芭蕾轉 (stdpoodle), 揚眉 (schnauzer), 掘地舞 (westie), 迷你天后轉圈 (yorkie), 粉撲轉圈 (bichon), 絲綢一撥 (maltese), 皇家攤低 (shihtzu), 壓軸大結局 (fallback).

## Hong Kong jokes added (beyond the sample)

- `jokes.shiba.3`: "This yard is beneath me. Literally." → 我睇低呢個花園。真係向下望嗰種。 (睇低 = look down, both senses).
- `jokes.dachs.3`: "Hot dog? Where? Oh. Me." → 臘腸？邊度有？哦，係我。 (the HK breed name is 臘腸狗).
- `jokes.chihuahua.2`: the authorities → 報警 / 警察就係你.
- `jokes.husky.1`: → 我要投訴 (HK's favourite verb).
- `jokes.yorkie.3`: "a loaf of bread" → 方包, the same word as the Corgi's loaf.
- `jokes.3`: "A pumpkin is just a very ambitious orange." → 南瓜即係一個好有大志嘅橙。

## For a native speaker to check (TODO(native))

- `data.eat_lines.golden`, `data.npc_jokes.6`: "pat pat" for the bum. Very HK and child-safe, but check it reads well in a dog line.
- `data.jokes.greyhound.3`: 叉緊電 for "charging" (colloquial 叉電; 充電 is the neutral word).
- `data.sig.frenchie.n`: 青蛙趴 for the sploot (common pet word in HK? or 扒低).
- `data.sig.spitz.n`: 騷包表演 for "The Show-off". 騷包 is playful HK slang for a show-off; check it is fine for children.
- `data.sig.samoyed.n`: 天使微笑 for "The Sammy Smile" (HK owners call Samoyeds 微笑天使).
- `data.jokes.mastiff.4`: "I sat on the cat" kept as in English; check it reads as harmless.
- `data.npc_jokes.1`: 我叫加利。我從來都未開心過。 Deadpan as in English; check it does not read as sad.
- `data.ag_lines.husky`: 穿柱 for agility weave poles.
- `data.chi_alert.2`: 世上竟然有郵差。唔可以接受！
- `data.sig.husky.say`: (好嘢！) for "(bravo)"; 安哥 (encore) was the other option.
- `data.jokes.akita.2`: 門口朋友 for "the door friend" (literal; is there a better HK phrase?).
- `data.toys_lines.*.conelick.*`: 筒 for the lick cone toy (zh-Hant has 漏斗); check what the toy looks like in chunk 4 (`data.toys`).
