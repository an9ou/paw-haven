# Cantonese (yue): terms fixed in chunk 6

Chunk 6 (Friends, What's new, Fun Fair, festive markets, Halloween pop-up, Winter, New Year, Mt. Fuji, Tokyo) is done: 1,058 keys. It reuses the glossary and the chunk 1 to 5 lists (好友, 分享邀請, 分享海報, 複製好友碼, 加, 去玩, 送禮物, 留個爪印, 嘉年華, 巡遊, 狗狗咭, 印仔 / 車站印仔 / 印仔簿, 御神籤, 一齊玩, number-first stat changes, 金幣). The words below are new. Chunk 7 (the site) reuses them; look a key up in `game/i18n/yue.json` for the exact line.

## Format rules chunk 6 settled

- Friend names: `fr.name` = `{a}{b}`, no space, like the Dog Card name.
- Dates: `fest.day_month` = `{month}{day}日` with `data.fs_months.*` = `1月` … `12月`, so a date reads 11月15日. Fixed dates in text: 11月2日, 12月25日, 1月7日, 2月{day}日.
- `hw.quote` = `「{text}」`.
- Plurals keep `one` where the English branch says something different (`{name}` vs "the pack": `tokyo.hachi_sat`, `tokyo.sunset_walk`, `tokyo.snack_eaten`, `tokyo.ticket_unpaid`); `multi`, `type`, `k`, `kind`, `cat`, `room`, `state` selects are kept as they are.
- A `sex` select is dropped where it has no tags (`popup.*`, `newyear.pup_0`); `popup.soon_card_html` keeps it (same text in both) because it wraps `<b>` tags.
- Lessons (`winter.lesson`, `winter.tip_*`, `data.tk_care.*`): two sentences; `winter.lesson` joins its three English sentences with ，.
- Fortunes: Great luck / Good luck / Small luck = 大吉 / 吉 / 小吉 (`data.ny_fortunes`, `data.tk_fortunes`).

## Words

| English | 廣東話 | Where |
|---|---|---|
| Keep them (don't block) / Stay (don't leave) | 保留 / 留低 | fr |
| Undo / Random / This is my name | 復原 / 隨便揀 / 就用呢個名 | fr |
| Up / Down (name wheels) / First word / Second word | 上 / 下 / 第一個字詞 / 第二個字詞 | fr |
| Just us (walk chip) | 淨係我哋 | fr |
| yard snapshot | 花園快照 | fr.leave_ask |
| friends list | 朋友名單 | fr |
| What's new (menu) / See all updates | 新鮮事 / 睇晒所有更新 | nw |
| Yard games | 花園遊戲 | ff |
| minigame names | 麵包店小幫手, 篤泡泡, 接零食, 放風箏日, 派報紙, 每週影相比賽, 索索搵寶, 狗狗表演姿勢, 星期六市集攤檔, 幫鄰居狗狗沖涼 | ff.n_* |
| Start the job / Play (minigame) / Play again | 開工 / 開始玩 / 再玩一次 | ff |
| ribbon / gold rosette | 絲帶 / 金色獎章 | ff, sticker book |
| pose card | 姿勢咭 | ff |
| biscuit tin / shapes | 罐 / 骨頭, 心心, 圓形, 星星 | ff |
| pinecone / kite | 松果 / 風箏 | ff |
| Scrub / Rinse / Towel | 擦擦 / 沖水 / 毛巾 | ff |
| Open the stall / stall keeper | 開檔 / 檔主 | ff, tokyo |
| Browse the stalls / packed up | 行下啲攤檔 / 收咗檔 | fm, fest, hw |
| New Year Market / Sakura Market | 新年市集 / 櫻花市集 | fm |
| Festival! (map tag) | 節日！ | fm |
| poop / pee / poop bag / water bottle | 便便 / 尿尿 / 便便袋 / 水樽 | popup |
| had an accident indoors | 喺屋入面去錯地方 (as chunk 4 garden.potty) | popup |
| Best in show | 全場最佳 | fest |
| leaf festival | 落葉節 | fest, data.fs_letters |
| snowdog / snow heap / snowdrift | 雪狗 / 雪堆 / 雪堆 (跳入去) | winter |
| Ugly Sweater Rosette / Parade Rosette | 醜萌冷衫獎章 / 巡遊獎章 (as chunk 1 outfits) | winter, fest |
| contestants | 參賽者 | winter |
| snood | 頸套 | winter.tip_cold |
| road salt | 馬路上面啲鹽 | winter.tip_salt |
| Year of the Sheep | 羊年 (data.ny_zodiac = 羊) | newyear |
| fortune slip / tie it on the rail | 籤紙 / 綁喺欄杆 | newyear, tokyo |
| Otoshidama / New Year envelope | 年玉 / 新年封包 | newyear.plum_* |
| shimekazari | 注連飾 | newyear.pup_0 |
| Nakamise (treat street) | 仲見世 | tokyo |
| senbei crunch / chewy | 咔嚓咔嚓 / 煙韌 | tokyo.snack_eaten |
| souvenirs | 手信 | tokyo |
| day ticket | 一日車飛 | tokyo |
| Yamanote loop / Tokyo Bay / Rainbow Bridge | 山手線 / 東京灣 / 彩虹橋 | tokyo |
| Shinobazu pond / swan boat | 不忍池 / 天鵝船 | data.tk_ueno, data.tk_lines |
| Hanami picnic / Momiji walk | 賞櫻野餐 / 賞紅葉散步 | data.tk_ueno |
| carrier (dog) | 籠 / 寵物籠 | data.tk_care |
| Nope. (locked place) | 未得住。 | tokyo |

## For a native speaker to check (TODO(native))

- `newyear.plum_title` 布冧太太送嘅年玉, `newyear.plum_text` 新年封包: otoshidama. 利是 is the HK word but belongs to Lunar New Year, which the game never names (glossary: New Year = 1 January). Is 年玉 understood?
- `newyear.pup_0`: 注連飾 for shimekazari. Do HK children know it, or is 新年裝飾 better?
- `data.ny_fortunes.*`, `data.tk_fortunes.*`: 大吉 / 吉 / 小吉 for Great / Good / Small luck.
- `popup.*`: 便便 / 尿尿 for poop and pee (child words, as zh-Hant). `popup.has_made_a_contribution`: 留低咗一份「心意」.
- `ff.paper_*`, `ff.r_paper`: 喬伯伯舉一舉帽多謝佢 for "tips his cap".
- `ff.pc_intro`: 笑到見牙唔見眼 for "a big smile".
- `fest.no_costume`, `winter.no_sweater`: 扮自己做狗 for "Going as a dog".
- `winter.fresh_snow`: 琴日隻雪狗上咗山探其他雪狗 (the melted snowdog, kept gentle as in English).
- `fr.keep` 保留 (Keep them, on the Block confirm) and `fr.stay` 留低 (Stay, on the Leave confirm).
- `tokyo.place_locked`, `tokyo.station_locked`: 未得住 for "Nope".
- `data.tk_lines.maltese.asakusa`: 一位細細隻嘅白色小姐 for "a small white lady".
- `data.tk_lines.chow.tokyotower`: 獅子批准呢個地標 (the Chow is the lion, as in chunk 2).
