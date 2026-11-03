# Cantonese (yue): terms fixed in chunk 1

Chunk 1 (UI, settings, journal, missions, care, shop, Dog Cards, first week, diary, the yard) is done: 1,672 keys. The words below are not in the glossary (`game/i18n/glossary/yue.json`) yet. Chunks 2 to 7 reuse them so the same English always gets the same Cantonese. Look a key up in `game/i18n/yue.json` when you need the exact line.

## Format rules chunk 1 settled

- Stat changes go number first, the same as the voice sample: `+10開心值`, `+5親密度`, `每隻+{n}親密度`, `-2體力`. A percentage stays after the word: `親密度分數+20%`, `瞓覺體力+{pct}%`.
- Play: the button and the verb in instructions are both `一齊玩` (owner, 3 Nov): 撳「照顧」，再撳「一齊玩」. "Play ball" is 玩波.
- Bond levels: 親密度2, 親密度{l}級 (level-up title), 親密度{pts} / {max}分.
- Ordinals and counts: 第{n}日, 第{i}步（共{n}步）, 第{i}頁，共{n}頁, {n} / {total}.
- Plurals: only `other`. Keep `one` too when the line has HTML tags, because the merge tool counts tags across the whole string. The same goes for a `sex` select that wraps `<b>` tags.
- Lowercase English fragments that follow "Tip:" or a name (for example `yard.walks_earn_the_most_coins`) are whole short sentences in Cantonese.

## Words

| English | 廣東話 | Where |
|---|---|---|
| Cleanliness (meter) | 清潔度 | data.meters |
| tick (a checkbox) | 剔 | care |
| starter kit | 新手禮包 | adopt |
| Tip: | 貼士： | adopt, yard |
| Random dog (button) | 隨便揀 | adopt |
| Bone-shaped Biscuit | 骨頭餅乾 | adopt (chunk 4 data.food) |
| Cardboard Box | 紙皮箱 | adopt, yard |
| Plush Bone | 骨頭公仔 | yard.nap_plush_bone |
| Golden Bone / Sparkle Stone | 金骨頭 / 閃亮石 | care |
| Mystery Pup | 神秘狗BB | core |
| Goodnight | 早唞 | care |
| Grown-up (age) | 大狗狗 | cards |
| card name (Dog Card) | 咭名, pattern `{a}{b}` with no space | cards |
| Give a paw (button) / a paw | 俾爪爪 / 一個爪爪 | cards |
| Hide (a card) | 收埋 | cards |
| visitor (tag) | 訪客 | cards |
| Preview | 預覽 | cards |
| save code | 進度碼 | cloud |
| Export / Import | 匯出 / 匯入 | cloud |
| backup / restore / sync | 備份 / 還原 / 同步 | cloud |
| verification code | 驗證碼 (6位數字) | reset |
| Send a new code | 寄新驗證碼 | cloud, reset |
| Make account | 開帳戶 | cloud, title |
| Guest | 訪客 | cloud, title |
| characters (password length) | 字元 | cloud |
| offline | 離咗線 (status chip 離線) | cloud |
| Try again in a moment | 等陣再試下 | everywhere |
| Unlocked: | 解鎖咗： | core |
| Yay! | 好嘢！ | core, missions |
| Indoor naps | 室內瞓覺 | care, yard |
| Nose-o-meter | 索索儀 | journal (chunk 4 data.treasures, chunk 5 walk lines) |
| dig spot | 掘寶位 | journal |
| map pieces | 地圖碎片 | journal |
| Equip / Unequip | 戴上 / 除低 | journal |
| charm | 吊飾 | journal, wardrobe |
| slot | 位 ({slot}位) | journal |
| Titles | 稱號 | journal |
| Profile (page) | 資料頁 | journal |
| mix / grand-mix | 混種 / 混混種 | journal |
| Sparkle Meter | 閃亮指數 | journal |
| Family Photo Frame | 家族相框 | journal |
| Coat Collection | 毛色收集 (N種毛色) | journal |
| Coat Collector Ribbon | 毛色收藏家絲帶 | journal |
| Master Breeder (title) | 毛色大師 | journal, data.jr_mile_txt (no breeding word) |
| Gene Detective / Glitter Legend / Treasure Legend | 基因偵探 / 閃亮傳說 / 尋寶傳說 | journal |
| Great-Great-Granddog | 玄孫狗狗 | journal |
| Friend of Doodle Doggo | Doodle Doggo之友 | journal |
| The Everything Dog | 雜錦狗狗 | data.jr_grand |
| Keep breeding | 繼續玩伴聚會 | journal.coat_keep |
| Find a partner | 搵玩伴 | journal |
| Shelter rescue | 領養中心嘅狗狗 | journal |
| Generation / Ancestry | 第{gen}代 / 血統 | journal |
| Nursery | 狗BB房 | journal |
| Town dog | 小鎮狗狗 | journal |
| Bonus | 獎勵 | journal |
| Bond track | 親密度進度表 | dd |
| sticker / Sticker book | 張貼紙 / 貼紙簿 | dd |
| wish come true / make it come true | 願望成真 / 實現 | dd, fw |
| Dear diary | 親愛嘅日記 | dd |
| my human (dog speaking) | 主人 (我個主人) | dd |
| News about {pup} | {pup}嘅近況 | dd |
| Town news from Gerald | 傑拉德嘅小鎮新聞 | dd |
| photo frame | 相框 | dd, photo |
| rubber duck | 橡皮鴨 | dd |
| sprinkler | 灑水器 | dd |
| Claim | 領取 | fw |
| Got it | 知道喇 | fw |
| See you tomorrow | 聽日見 | fw |
| new! | 新！ | fw |
| bag (your bag) / treat bag | 你個袋 / 零食袋 | fw |
| Make the tag / Hang it on | 整狗牌 / 掛上去 | fw |
| belly rub | 掃肚肚 | fw |
| puddle / rain boots | 水氹 / 水鞋 | fw, yard |
| guide / Skip | 指南 / 跳過 | guide |
| Arrange / Put away / Move / Done | 佈置 / 收埋 / 移動 / 完成 | home, yard |
| In use / Living here | 用緊 / 住緊 | home, shop |
| arrow keys / Space | 方向鍵 / 空白鍵 | home, bath |
| drag / hold (input) | 拖住 / 撳住 | home, tricks |
| stamp card / crayon stamp | 印仔咭 (儲滿) / 蠟筆印仔 | missions |
| Station stamp | 車站印仔 (蓋) | data.ms_pool |
| Move in / Wear it / Later | 搬入去 / 著上 / 遲啲 | missions, shop |
| cook a dish | 煮一味餸 | data.ms_pool |
| crop | 農作物 | data.ms_pool, data.perk |
| Clean up after the dog | 執手尾 | data.ms_pool.scoop |
| snowdog / snowdrift | 雪狗 (砌) / 雪堆 | data.ms_pool |
| Year-end clean | 年尾大掃除 | data.ms_pool |
| First Fuji | 初富士 | data.ms_pool |
| draw a fortune | 抽御神籤 | data.ms_pool |
| Riverside Trail | 河邊小徑 | data.ms_pool |
| fishing line | 魚絲 | data.hint_name |
| runner hints: duck / jump / long jump | 蹲低 / 跳 / 跳遠 | data.badge, data.hint |
| rarity | 普通 / 少見 / 稀有 / 傳說 | data.rarity |
| outfit slots | 頭 / 眼 / 頸 / 身 | data.slot_name |
| cooking steps | 焗 / 雪 / 切 / 煲 / 攪 | data.step_name |
| crop stages | 種子 / 發芽 / 長葉 / 熟喇！ | data.stage_txt |
| perks | 掘地高手, 執嘢高手, 看門狗, 檢查員, 雪地狗BB, 小幫手 | data.perk |
| Cool / Warm (buffs) | 涼浸浸 / 暖笠笠 | data.buff_text |
| next walk | 下次散步 | data.buff_text |
| Paw (trick) / command | 握手 / 俾手！ | data.tricks, data.tcmd |
| Speak (trick) / command | 吠一聲 / 吠！ | data.tricks, data.tcmd, train |
| Dance / Play Dead command / Showtime! | 跳舞 / 砰！ / 表演時間！ | data.tcmd |
| Start / Stop | 開始 / 停 | train |
| Hold to lead (button) | 撳住帶路 (藍色掣) | tricks |
| Good! / Great! / Oops | 做得好！ / 好正！ / 哎呀 | tricks |
| combo / chain / part / beat / track | 連擊 / 連續 / 段 / 拍 / 路線 | train, tricks |
| Focus | 專注力 | train |
| hand signal / treat lure / rhythm | 手勢 / 零食引導 / 節奏 | train |
| Getting it / Learned / Mastered | 學緊 / 學識咗 / 精通 | train |
| audience | 觀眾 | train |
| Show off (tab) / Train (tab) | 表演 / 訓練 | train |
| Perks | 好處 | wardrobe |
| Fashion bonus | 時裝獎勵 | wardrobe |
| Who to dress | 幫邊隻著衫 | wardrobe |
| expressions | 伸脷 (Blep), 扁嘴 (Pout), 心心眼 (Heart eyes), 乞嚏 (Achoo), 單眼 (Wink) | data.ex_words |
| Face (photo) / Natural | 表情 / 自然 | expressions |
| photo: Retake / Save photo / Square / Say cheese | 再影過 / 儲存相片 / 正方形 / 笑一個 | photo |
| camera button | 相機掣 | photo |
| Doodle Town | Doodle小鎮 | photo |
| Caption | 標題 | photo |
| Menu / Mute / Sound on | 選單 / 靜音 / 開聲 | phone, shell |
| Turn your phone upright | 將部手機打直 | phone |
| Actions / Trick training | 動作 / 把戲訓練 | shell |
| Barking: Fewer / Normal / Off | 吠聲：少啲 / 正常 / 關 | settings |
| Master volume | 總音量 | settings |
| "No way" (reset) / Yes, reset | 梗係唔好 / 好，刪除 | settings |
| Use device language | 用部機嘅語言 | settings |
| Bring home! / Toss a toy | 帶返屋企！ / 掟玩具 | shelter |
| playroom | 遊戲室 | shelter |
| shop tabs | 狗床, 擺設, 食物, 傢俬, 狗屋, 食物櫃, 工具, 玩具 | shop |
| Buy / Sell (items only) / Cancel / Free | 買 / 賣 / 取消 / 免費 | shop |
| Owned | 已經有 | shop |
| Place (an item) | 擺放 | shop, yard |
| Quantity / In bag / Max | 數量 / 喺袋 / 最多 | shop |
| Furniture corner / shopkeeper / receipt | 傢俬角 / 店主 / 收據 | shop |
| Continue / New game / Start over? / Switch | 繼續 / 新遊戲 / 重新開始？ / 轉 | title |
| Stay a guest / Keep my dog | 繼續做訪客 / 留住我隻狗 | title |
| yawn / snore | 打喊露 / 扯鼻鼾 | yard |
| Check-up | 檢查身體 | yard |
| Café menu | 咖啡室餐牌 | yard |
| coming soon | 就嚟 | journal, yard |
| roaching (greyhound pose) | 曱甴瞓 | yard |
| Puppy Playdates | 狗BB玩伴聚會 | yard |
| Grand Treasure Chest | 超級大寶箱 | yard |

## Outfit names (chunk 4 `data.clothes` should match `data.dc_outfits`)

煲呔 (Bow Tie), 心心太陽眼鏡 (Heart Sunglasses), 波點雨褸 (Polka-dot Raincoat), 波波冷帽 (Pom-pom Beanie), 冬日冷衫 (Knit Winter Sweater), 超級英雄披風, 水手領, 芭蕾舞裙 (Tutu), 睡衣, 蜜蜂裝, 祭典法被 (Happi Coat), 暖笠笠衛衣 (Cozy Hoodie), 冷頸巾 (Knit Scarf), 秋日頸巾, 小幽靈床單 (Ghost Sheet), 南瓜裝, 巡遊獎章 (Parade Rosette), 吸血鬼披風, 粟米糖三角巾 (Candy Corn Bandana), 蝙蝠翼, 超級醜萌冷衫 (Very Ugly Sweater), 馴鹿角, 雪花頸套 (Snowflake Snood), 醜萌冷衫獎章, 羊年羊仔帽, 太空人頭盔, 橡果帽 (Acorn Cap), 探險家護目鏡, 貝殼頸鏈 (Seashell Necklace), 青苔斗篷, 幸運草頸圈, 太陽帽 (Sun Hat), 唔俾糖就搗蛋小幽靈, 小蝙蝠扮裝 (Little Bat Costume).

## For a native speaker to check (TODO(native))

- `yard.flips_upside_down_legs_in`: 曱甴瞓 for a greyhound "roaching". Funny and accurate, but some children may find cockroaches gross.
- `data.ms_pool.scoop.t`: 幫{dog}執手尾 for "clean up after {dog}" (the poop scoop). Kids may know 執手尾 only as "tidy up someone's mess".
- `journal.mixes_count`: 混混種 for "grand-mix". It is made up; 第二代混種 is the plain option.
- `journal.title_great_granddog`: 玄孫狗狗. Correct, but younger children may not know 玄孫.
- `cloud.*`: 進度碼 for "save code" (存檔 is Taiwan wording). 進度 matches 刪除進度 in the glossary.
- `dd.tr_title`: 親密度進度表 for "Bond track". 親密度之路 is the warmer option.
- `care.goodnight`, `dd.c_*`: 早唞 for "Goodnight" (晚安 is also common).
- `dd.c_grand1`: 照辦煮碗 ("same again"): an idiom most kids know.
- `data.tricks.paw.n` 握手 with the command `data.tcmd.paw` 俾手！: the trick name follows the glossary (Shake = 握手), and the spoken command is the HK one.
- `title.start_over_body_html`: the English "moved to a farm" joke stays mild: 搬咗去農場住。真係嘅農場。 Check that it reads as harmless.
