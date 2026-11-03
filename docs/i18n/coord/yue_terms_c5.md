# Cantonese (yue): terms fixed in chunk 5

Chunk 5 (places, routes, walks, weather, the walk runner, the town map, Training Ground, Splash Pool) is done: 1,139 keys. It reuses the glossary and `yue_terms_c1.md`, `c2`, `c4` (索索儀, 蹲低 / 跳 / 跳遠, 掘寶位, 一齊玩, number-first stat changes, the chunk-2 dog sounds and breed voices). The words below are new. Chunks 6 and 7 reuse them; look a key up in `game/i18n/yue.json` for the exact line.

## Format rules chunk 5 settled

- Runner HUD stays very short: `出發！` (GO!), `預備` (Ready), `索索` (sniff), `掘！`, `{n}秒`, `−3秒`, `+15秒`, `仲可以掘{n}次`. Key hints: `撳D`, `撳住↓或者S`.
- Key names stay Latin in the `_html` legends (`<b>Space/&uarr;</b> 跳`, `<b>Esc</b> 暫停`); HTML entities (`&uarr;`, `&middot;`, `&mdash;`) are kept as in English.
- A bump is never a hurt: "bump" = `碰到嘢` / `碰撞`, the sound is `咚！`, "Ow" is a light `哎吔`. No fail words anywhere.
- The `sex` select is dropped everywhere except `town.vet_sniffles`, where the English says "brave girl / boy" (`好勇敢嘅女仔` / `男仔`).
- Lesson texts of three or four English sentences (`agility.lesson_text`, `pool.lesson_text`) are joined into two.
- Lists: `town.or_sep` is `、`, `town.or_join` is `{head}或者{last}`.

## Words

| English | 廣東話 | Where |
|---|---|---|
| Nose-o-meter: Cold / Warm / HOT / Dug / Found! | 索索儀：凍 / 暖 / 熱 / 掘咗 / 搵到！ | walk, mod.walk |
| Sniff spot | 索索位 | walk, mod.walk |
| dig / digs left | 掘 / 仲可以掘{n}次 | walk, mod.walk |
| Power-up / Magnet / Zoomies / Bubble shield / Super jump | 道具 / 磁石 / 衝衝衝 / 泡泡保護罩 / 超級跳 | mod.walk |
| Auto-walk / Hold to walk / Go home early | 自動行 / 撳住行 / 早啲返屋企 | walk |
| swipe down | 向下掃 | mod.walk |
| Walk progress / Walk complete / Walk cut short | 散步進度 / 散步完成 / 散步提早完 | walk |
| Consolation coins | 安慰金幣 | walk |
| Compliment! | 有人讚你！ | walk |
| junk (dug up) | 雜物 | walk |
| a pouch of coins | 一袋金幣 | walk, mod.walk |
| Psst | 偷偷話你知 | walk, mod.walk |
| obstacles | 帳篷簷 (awning), 消防栓, 泥堆 (molehill), 一捆繩, 潮池, 路牌, 垃圾桶, 風箏線, 木頭 (log) | data.obs_label |
| weather | 天晴 / 多雲 / 落雨 / 落雪, 晴朗夜晚 | data.weather_txt, data.wx_txt |
| time of day | 天光 / 日頭 / 黃昏 / 夜晚 | route |
| Difficulty n of 4 | 難度{n} / 4 | route |
| Pick a walk / Start walk | 揀一條散步路線 / 開始散步 | route |
| route places | 河邊小徑, 竹林小徑, 向日葵小徑, 海崖小徑 (Seaside Cliffs Run; the cliff path itself 海崖小路), 山頂小徑, 碼頭長廊, 小鎮一圈 | data.routes, map215, town |
| Ball play / Fetch | 掟波 / 執波 | ball, fetch |
| GREAT CATCH! / Caught it! | 接得好靚！ / 接到喇！ | fetch |
| Golden (+25%) / Penny (+10%) | 金毛+25% / 銅仙+10% | fetch, walk |
| the bouncer is a goose | 門口有個保安，佢係一隻鵝 | map, route |
| Labels on the map | 地圖上嘅名 | map215 |
| Town notice / mayor | 小鎮通告 / 鎮長 | town |
| Fresh & Fluffy (salon buff) | 香噴噴鬆毛毛 | town |
| Full groom | 全身美容 (as yard.full_groom) | town |
| Pupuccino | 汪奇諾 | town |
| barista / groomer | 咖啡師 / 美容師 | town |
| Health card | 健康咭 | town |
| Expecting check-up | 懷孕檢查 (as vet.preg_check) | town |
| sniffles | 流鼻水 | town |
| Zoom in / Zoom out | 放大 / 縮細 | town |
| you are here / your place | 你喺呢度 / 你屋企 | town |
| agility obstacles | 跳欄 / 暫停枱 / 隧道 / 車胎 / 穿柱 | agility |
| Go! (agility) / Perfect! / Slow and steady! | 去！ / 完美！ / 慢慢嚟，穩陣！ | agility |
| A new best! / Best: | 新最好成績！ / 最好成績： | agility |
| Splash time / Paddle / Float fetch | 嬉水時間 / 扒水 / 浮波 | pool |
| ramp / the wide step / shallows | 斜路 / 級樓梯 / 淺水 | pool |
| sprinkler | 灑水器 (chunk 1) | pool |
| flat-faced / short-nosed dogs | 扁面狗狗 / 短鼻狗狗 | pool |
| Start the run | 開始跑 | tracks |
| pant (dog sound) | *喘氣* | data.wx_lines |
| yawn / snore | *打喊露* / *呼嚕嚕嚕* (chunk 2) | data.wx_lines |
| wet butt (corgi) | 濕pat pat (chunk 2's pat pat) | data.wx_lines.corgi.rain |

## For a native speaker to check (TODO(native))

- `data.obs_label.awning`: 帳篷簷 for a shop awning (HK may say 簷篷 or 帆布篷).
- `data.obs_label.molehill`: 泥堆, with 鼴鼠 in `data.walk_lines.bonkname.molehill.0`. Kids may not know 鼴鼠.
- `data.clues.past.0`, `data.walk_lines.past.0`: 行過咗龍 for "walked past it".
- `walk.npc_outfit_3`: "Take my money" → 我啲錢俾晒你 (a passer-by loves the outfit; check it reads as a joke, not as buying anything).
- `town.vet_survived`: 捱過咗睇獸醫。好險咁。好誇張咁。 for "survived the vet. Barely. Dramatically." (no 死; check it does not sound scary).
- `town.salon_broke`: 美容師好失望咁剪咗一下空氣 for "a sad little snip of the scissors".
- `town.cafe_broke`: 咖啡師好明白你，但係唔通融得 for "sympathetic but firm".
- `town.notice_board_html`: 搵失物：一個網球。叫佢『波』會應。 (a lost ball, not a dog).
- `mod.walk.cd_go`: 出發！ for the countdown GO! (衝！ is shorter and punchier).
- `ground.play_3`: 擺個玩耍鞠躬，即係開波喇 for the play bow (開波 = kick-off).
- `data.wx_lines.shiba.rain`: 我要搵個天嘅經理投訴 ("speak to the manager of the sky").
- `data.wx_lines.frenchie.coat`, `data.wx_lines.pug.coat`: 薯仔 for "potato" (a dog in a raincoat).
