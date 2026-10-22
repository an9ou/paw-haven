# Traditional Chinese (zh-Hant) style guide and glossary

Doodle Doggo v2.14 "Hello in Every Language". Source language: English. Data file: `game/i18n/glossary/zh-Hant.json`. The tables below match the JSON; change both together. Target readers: Taiwan first (wording and punctuation follow Taiwan usage), readable in Hong Kong and Macau. It is **not** a character conversion of zh-Hans: many words differ (米克斯, 米格魯, 動物之家, 飼料, 存檔, 登入). Anything marked TODO(native) needs a native speaker's check; Hong Kong differences are listed in section 11.

## 1. Tone

- Cozy, kind, simple, playful. Nothing bad ever happens: no 生病, 死, 走失, no scolding.
- The joke is the crude crayon dogs: 醜萌 (ugly-cute). Keep the dogs proud of their wobbly drawing, deadpan.
- Adapt jokes. Dog-sound puns with 汪 work: 汪汪精品店, 汪汪建築 (Barkitecture), 汪奇諾咖啡館. Reduplication is cute and natural: 狗狗, 摸摸, 霜霜, 桃桃. Taiwan's 毛孩 (fur kid) is warm and fine in letters.
- Readers include children: common characters, short sentences, no hard 成語.

## 2. Register and address

**Choice: 你, never 您.** Same reasoning as zh-Hans: the dogs and Gerald are friends; 您 is distant.

| Who speaks | Register | Example |
|---|---|---|
| UI, buttons, system lines, lessons | short, friendly, neutral | 「已存檔。」「點『餵食』，再選一種食物。」 (on screen the outer quotes go: 點「餵食」，再選一種食物。) |
| Dogs | casual, 我, the breed's personality; particles 啦/喔/耶/嘛 sparingly (Taiwan writes 喔, not 哦) | 柴犬：「沙發現在是我的了。我決定的。」 黃金獵犬：「沙發！地毯！檯燈！我愛這個家！」 |
| Gerald the duck | casual, a bit know-it-all | 「我是傑拉德。我住在河邊，什麼都知道。我帶你到處逛逛吧。」 |
| Mrs. Plum, families, Dr. Paws | warm, still 你 | 「南瓜田快閃店開張囉，歡迎來玩！」 |

- Buttons: verb or verb + object, 2–4 characters: 餵食, 散步, 領養, 返回, 關閉. No 請 on buttons.

## 3. UI conventions

- Punctuation (Taiwan): full-width ，。！？：；、 and quotes 「」 (inner 『』), never “”. Titles in 《》 only for real titles. Ellipsis ……. In Taiwan the full-width marks sit in the centre of the box; fonts handle this, don't add spaces.
- Spaces: none between Chinese and digits or Latin words in the UI: 100金幣, 等級3.
- Numbers: Arabic digits. Measure words: dogs 隻 (3隻小狗), items 個, days 天. Coins: 100金幣.
- Dates: 10月18日（星期六）/（週六）. Times: 15:30 or 下午3:30.
- One ！ at most; ！！ only for a dog shouting.
- Plurals: only `other` in ICU: `{n, plural, other {#隻小狗}}`.
- Length: as zh-Hans, buttons up to 4 characters on the phone, toasts about 16 characters.
- The characters 㹴 (terrier, Taiwan form) and 麵 are correct here; the FONTS lane must include them in the subset.

## 4. The owner's word rules in Chinese

| Never say | Why | Say instead |
|---|---|---|
| 繁殖, 繁育, 配種, 交配, 育種, 配狗, 狗場, 犬舍 | "breed" as a verb | 玩伴聚會 (puppy playdate; button 約玩), 小狗出生了 |
| 種犬, 種狗, 種公, 種母 | "stud" | the dog's name, 另一隻狗狗 |
| 一窩小狗多少錢, 小狗的價格, 售價 | "litter price" | (no prices; puppies are free) |
| 賣小狗, 出售幼犬, 買一隻小狗 | selling (or buying) dogs | 免費交給新家庭, 領養, 新家庭 ("以認養代替購買" spirit) |
| 日本製造, 日本製, 日本產, 日貨, 日本遊戲 | "made in Japan" | 日式 (Japan-style), 日式風格 |
| 任天堂, 寶可夢, 神奇寶貝, 動物森友會, 動森 … | franchise names | — |

- 品種 / 犬種 (breed, the noun) is fine. 原產日本 for a breed is a fact and fine.
- Shops selling items is fine: 「冬日攤位在賣狗狗毛衣。」 Keep 賣 away from a bare dog word.
- Taiwan 米克斯 (mixed-breed, from "mix") is the warm, everyday word for shelter dogs and is used for the Shelter Mutt.

## 5. Japanese words and places

御神籤 (omikuji; Taiwan also says 籤詩, first time 「御神籤（日本的抽籤）」), 年賀狀 (nengajō), 門松, 新年 (1 January, never 春節 / 過年), 麻糬 (mochi), 八公 (Hachikō; the film in Taiwan is 忠犬小八, but the statue is 八公像), 新幹線, 富士山, 澀谷十字路口, 代代木公園, 淺草與淺草寺, 東京鐵塔 (Taiwan's name for Tokyo Tower), 上野公園, 台場.

- Facts stay true and are not extended.

## 6. Care lessons (blocks)

Exactly **two sentences**, each ending in 。 Example (English: "Both carry merle. Two merles can have puppies with eye and ear trouble, so these two stay friends."):

「牠們兩個都帶有隕石色基因。兩隻隕石色狗狗的小狗可能會有眼睛和耳朵的問題，所以牠們還是當好朋友吧。」

Note: Taiwan writes 牠 for animals (它 is also accepted). Use 牠 consistently for dogs in zh-Hant; zh-Hans uses 它.

## 7. Starter dog names

Translate the food meaning, as in zh-Hans, with Taiwan words (格子餅 for Waffle, 奶油 for Butter, 蝴蝶餅 for Pretzel).

| Breed | English name | zh-Hant |
|---|---|---|
| `shiba` | Mochi | 麻糬 |
| `corgi` | Biscuit | 餅乾 |
| `golden` | Sunny | 陽光 |
| `dachs` | Noodle | 麵條 |
| `husky` | Frost | 霜霜 |
| `mutt` | Pepper | 胡椒 |
| `chihuahua` | Peanut | 花生 |
| `pug` | Dumpling | 餃子 |
| `greyhound` | Rocket | 火箭 |
| `beagle` | Bagel | 貝果 |
| `poodle` | Pretzel | 蝴蝶餅 |
| `collie` | Scout | 小探 |
| `samoyed` | Cloud | 雲朵 |
| `frenchie` | Brioche | 布里歐 |
| `akita` | Kuma | 熊熊 |
| `spitz` | Daifuku | 大福 |
| `pom` | Mikan | 蜜柑 |
| `afghan` | Saffron | 番紅花 |
| `dane` | Waffle | 格子餅 |
| `mastiff` | Crumpet | 英式鬆餅 |
| `gsd` | Strudel | 蘋果捲 |
| `dobie` | Espresso | 濃縮 |
| `corso` | Cannoli | 奶油捲 |
| `pitbull` | Peaches | 桃桃 |
| `minpin` | Jellybean | 軟糖 |
| `lab` | Butter | 奶油 |
| `malamute` | Maple | 楓糖 |
| `chow` | Bao | 包子 |
| `stdpoodle` | Madeleine | 瑪德蓮 |
| `schnauzer` | Muesli | 麥片 |
| `westie` | Shortbread | 酥餅 |
| `yorkie` | Toffee | 太妃糖 |
| `bichon` | Meringue | 蛋白霜 |
| `maltese` | Marshmallow | 棉花糖 |
| `shihtzu` | Wonton | 餛飩 |

## 8. Breed names

From `mods/genes.js` BREEDS (35 keys), Taiwan common usage (黃金獵犬, 米格魯, 米克斯).

| Key | English | zh-Hant |
|---|---|---|
| `shiba` | Shiba Inu | 柴犬 |
| `corgi` | Corgi | 柯基犬 |
| `golden` | Golden Retriever | 黃金獵犬 |
| `dachs` | Dachshund | 臘腸犬 |
| `husky` | Husky | 哈士奇 |
| `mutt` | Shelter Mutt (mixed breed) | 米克斯 |
| `chihuahua` | Chihuahua | 吉娃娃 |
| `pug` | Pug | 巴哥犬 |
| `greyhound` | Greyhound | 格雷伊獵犬 |
| `beagle` | Beagle | 米格魯 |
| `poodle` | Miniature Poodle | 迷你貴賓犬 |
| `collie` | Border Collie | 邊境牧羊犬 |
| `samoyed` | Samoyed | 薩摩耶犬 |
| `frenchie` | French Bulldog | 法國鬥牛犬 |
| `akita` | Akita | 秋田犬 |
| `spitz` | Japanese Spitz | 日本狐狸犬 |
| `pom` | Pomeranian | 博美犬 |
| `afghan` | Afghan Hound | 阿富汗獵犬 |
| `dane` | Great Dane | 大丹犬 |
| `mastiff` | English Mastiff | 英國獒犬 |
| `gsd` | German Shepherd | 德國牧羊犬 |
| `dobie` | Dobermann | 杜賓犬 |
| `corso` | Cane Corso | 卡斯羅犬 |
| `pitbull` | Pit Bull | 比特犬 |
| `minpin` | Miniature Pinscher | 迷你品犬 |
| `lab` | Labrador Retriever | 拉布拉多犬 |
| `malamute` | Alaskan Malamute | 阿拉斯加雪橇犬 |
| `chow` | Chow Chow | 鬆獅犬 |
| `stdpoodle` | Standard Poodle | 標準貴賓犬 |
| `schnauzer` | Miniature Schnauzer | 迷你雪納瑞 |
| `westie` | West Highland White Terrier | 西高地白㹴 |
| `yorkie` | Yorkshire Terrier | 約克夏㹴 |
| `bichon` | Bichon Frise | 比熊犬 |
| `maltese` | Maltese | 瑪爾濟斯犬 |
| `shihtzu` | Shih Tzu | 西施犬 |

## 9. Glossary

**Core words**

| English | zh-Hant | Note |
|---|---|---|
| Doodle Doggo | Doodle Doggo | Brand name: always Latin letters, never translated. |
| dog | 狗狗 | The friendly everyday word. ja also ワンちゃん in dialogue; ko 개 only in compounds; th avoid bare หมา in UI. |
| puppy | 小狗 | ko: never 새끼 (also a rude word). |
| adopt | 領養 | Adopting a dog into your home. |
| adopt out free to families | 免費交給新家庭 | The safe phrase for puppies leaving. Never a sale. |
| new family | 新家庭 |  |
| Adopt me board | 待領養公告欄 | Shelter board of dogs looking for a home. |
| bond | 親密度 | The stat that unlocks places. ja: 絆 (きずな). |
| coins | 金幣 | Counter style: ja 100コイン, zh 100金币, ko 100코인, th 100 เหรียญ. |
| Sparkle | 閃亮 | Cosmetic coat sparkle, never paid. |
| Hunger | 飽足 | A stat bar. Phrase it as fullness, never as suffering. |
| Energy | 體力 | Naps refill it. |
| Happiness | 開心值 |  |
| level | 等級 |  |
| crayon | 蠟筆 | The art joke: crude crayon dogs. |
| sketchbook | 素描本 |  |

**Main buttons and care**

| English | zh-Hant | Note |
|---|---|---|
| Feed | 餵食 | Bar button. |
| Play | 玩耍 | Bar button. |
| Care | 照顧 | Bar button (bath, nap, brush). |
| Walk | 散步 | Bar button; walks are the main income. |
| Wardrobe | 衣櫥 | Bar button. |
| Journal | 日記 | Bar button (short form of Treasure Journal). |
| Treasure Journal | 寶物日記 | Modal title. |
| Map | 地圖 | Bar button. |
| pet (verb) | 摸摸 | Rubbing the dog. |
| bath | 洗澡 |  |
| nap | 打盹 |  |
| potty | 上廁所 | Keep it light and clean. |
| brush | 梳毛 |  |
| train | 訓練 |  |
| trick | 才藝 | ja 芸 (げい) is the real word for dog tricks. |
| Sit | 坐下 | Trick name. |
| Shake | 握手 | Trick name (paw shake). |
| Spin | 轉圈 | Trick name. |
| Roll over | 打滾 | Trick name. |
| ball play | 丟球遊戲 | Replaced the old Fetch challenge. |
| treat | 零食 |  |
| kibble | 飼料 |  |
| Pupcake | 汪汪蛋糕 | Dog-safe cupcake. Pun: pup + cupcake. TODO(native) th. |
| food | 食物 | Journal tab "Food". |
| toys | 玩具 |  |
| clothes | 衣服 |  |
| outfit | 搭配 |  |
| collar | 項圈 |  |
| bandana | 三角巾 |  |
| leash | 牽繩 |  |
| bed | 狗窩 |  |
| doghouse | 狗屋 |  |
| decorate | 裝飾 | Home decorating mode. |

**Puppies and genetics**

| English | zh-Hant | Note |
|---|---|---|
| playdate | 玩伴聚會 | THE safe word for two dogs meeting (puppy playdate). Short zh button form: 约玩 / 約玩. |
| Playdate Board | 玩伴聚會公告欄 | At the Dog Park. |
| puppies | 小狗們 | Use for "litter" in player-facing text. |
| Pick of the litter | 挑一隻小狗 | Card title: the family lets you choose one pup, free. |
| healthy pup | 健康的小狗 |  |
| resting after a playdate | 聚會後正在休息 | Welfare rest between litters; kind tone. |
| coat | 毛色 | Coat colour (also the Journal tab "Coats"). |
| merle | 隕石色 | Coat pattern. Never double merle. |
| Family tree | 家譜 |  |
| Gene Sniffer | 基因嗅嗅機 | Joke gadget; keep the sniffing sound. |

**Places**

| English | zh-Hant | Note |
|---|---|---|
| Home Yard | 家裡的院子 |  |
| Cozy House | 溫馨小屋 |  |
| Sunny Park | 陽光公園 |  |
| Riverside | 河邊 |  |
| Maple Woods | 楓樹林 |  |
| Seashell Beach | 貝殼海灘 |  |
| Market Street | 商店街 |  |
| Town Square | 小鎮廣場 |  |
| Dog Park | 狗狗公園 |  |
| Vet Clinic | 動物醫院 | Only check-ups and kind news; no sickness. |
| Grooming Salon | 寵物美容店 |  |
| Pupuccino Café | 汪奇諾咖啡館 | Pun on puppuccino. TODO(native) zh. |
| Doggy Donut | 汪汪甜甜圈 |  |
| Kibble Corner | 飼料小舖 | Shop. |
| Bow-Wow Boutique | 汪汪精品店 | Shop (clothes). |
| Barkitecture | 汪汪建築 | Builder shop; pun bark + architecture: ja ワン築 (建築), ko 멍축 (건축). TODO(native) th. |
| Pip's Sprout Cart | 皮普的幼苗小車 | Seed shop. |
| Shelter | 動物之家 | Warm words only. zh-Hant 動物之家 is the Taiwan word for public shelters. |
| Shelter Playroom | 動物之家遊戲室 |  |
| Lighthouse Pier | 燈塔碼頭 | Walk spot. |
| Hilltop Meadow | 山頂草地 | Walk spot. |
| Town Loop | 小鎮環線 | Walk route. |
| Hilltop Trail | 山頂小徑 | Walk route. |
| Pier Boardwalk | 碼頭棧道 | Walk route. |

**Characters**

| English | zh-Hant | Note |
|---|---|---|
| Gerald (the duck) | 傑拉德 | The guide duck who knows everything. |
| Mrs. Plum | 梅子太太 | The neighbour with the Pumpkin Patch Pop-up. |
| Pip (the farmer) | 皮普 |  |
| Dr. Paws | 爪爪醫生 | The vet; translate the pun (paws). |

**Garden and kitchen**

| English | zh-Hant | Note |
|---|---|---|
| garden | 菜園 | Also "veggie patch". |
| seeds | 種子 |  |
| water (plants) | 澆水 |  |
| harvest | 收穫 |  |
| kitchen | 廚房 |  |
| cook | 烹飪 | Only dog-safe food. |
| recipe | 食譜 |  |
| Pantry | 食物櫃 |  |

**Seasons and festivals**

| English | zh-Hant | Note |
|---|---|---|
| spring | 春天 |  |
| summer | 夏天 |  |
| autumn | 秋天 |  |
| winter | 冬天 |  |
| weather | 天氣 |  |
| rain | 雨 |  |
| snow | 雪 |  |
| festival | 節日 |  |
| leaf piles | 落葉堆 |  |
| Harvest Stall | 豐收攤位 |  |
| Costume Parade | 變裝遊行 |  |
| Halloween | 萬聖節 | Cute, never scary. |
| Pumpkin Patch Pop-up | 南瓜田快閃店 |  |
| Snow Days | 下雪天 |  |
| Winter Lights | 冬日燈飾 |  |
| Winter Stall | 冬日攤位 |  |
| Ugly Sweater Contest | 醜萌毛衣大賽 | The ugliness is the joke: ugly-cute. |
| New Year | 新年 | 1 January (Japanese New Year), not the lunar New Year: zh never 春节, ko never 설날. |
| New Year card (nengajō) | 年賀狀 | Japanese New Year postcard. |
| Fortune box (omikuji) | 御神籤 | Only happy fortunes. th: เซียมซี (fortune sticks) is the familiar word. |
| kadomatsu (pine) | 門松 | New Year pine decoration. |
| mochi | 麻糬 | Food item. The dog Mochi keeps its own name. |

**Japan and Tokyo**

| English | zh-Hant | Note |
|---|---|---|
| Japan-style | 日式 | The safe word. Never "made in Japan". |
| Mt. Fuji | 富士山 |  |
| Mt. Fuji Lookout | 富士山觀景台 | Code name fujihill. |
| Station | 車站 | The Station pin on the town map. |
| Shinkansen | 新幹線 |  |
| Japan map | 日本地圖 |  |
| Tokyo | 東京 |  |
| Shibuya Crossing | 澀谷十字路口 |  |
| Hachikō | 八公 | The loyal Akita at Shibuya Station. |
| Yoyogi Park Dog Run | 代代木公園狗狗運動場 |  |
| Asakusa and Sensō-ji | 淺草與淺草寺 |  |
| Tokyo Tower | 東京鐵塔 |  |
| Ueno Park | 上野公園 |  |
| Odaiba Seaside | 台場海濱 |  |
| stamp | 紀念章 |  |
| stamp book | 集章冊 | Seven Tokyo stamps. |

**Dog Cards, photos, pack**

| English | zh-Hant | Note |
|---|---|---|
| Dog Cards | 狗狗卡片 | Opt-in public cards; no free text. |
| visiting dog | 來訪的狗狗 |  |
| paw (on a card) | 爪爪 | The one "like" per card per Japan day. |
| Photo mode | 拍照模式 |  |
| postcard | 明信片 |  |
| All Together (pack play) | 大家一起 | v2.9 pack play and walks. |
| Missions | 任務 | Journal tab. |
| Daily missions | 每日任務 |  |
| treasure | 寶物 |  |
| letter | 信 |  |
| Mailbox | 信箱 |  |

**Journal tabs and settings**

| English | zh-Hant | Note |
|---|---|---|
| Profile | 資料 | Journal tab. |
| Family | 家族 | Journal tab. |
| How to play | 玩法 | Journal tab. |
| Settings | 設定 |  |
| Sound | 聲音 |  |
| Music | 音樂 |  |
| Sound effects | 音效 |  |
| Ambience | 環境音 |  |
| Mute all | 全部靜音 |  |
| Motion and wobble | 動態與搖晃 | Reduced-motion setting. |
| Language | 語言 | Show each language by its own name: 日本語, 简体中文, 繁體中文, 한국어, ไทย. |
| Reset save | 刪除存檔 |  |
| save | 存檔 |  |
| Cloud save | 雲端存檔 | Off on claude.ai. |
| Log in | 登入 |  |
| Sign up | 註冊 |  |
| Forgot your password? | 忘記密碼？ |  |
| Title screen | 標題畫面 |  |
| Back | 返回 | Button. |
| Close | 關閉 | Button. |
| OK | 好的 | Button. |
| Yes | 好 | Button. |
| No | 不了 | Button; zh 不了 is a soft "no thanks". |

## 10. Bans (machine check)

The same pattern list as zh-Hans (each pattern lists both character forms). The `allow` phrases are legitimate sentences that must never be hit.

| Rule | Pattern (JS RegExp source, flag `u`) |
|---|---|
| "breed" as a verb (品种 / 犬种 = breed, the noun, is fine) | <code>繁殖\|繁育\|配种\|配種\|交配\|育种\|育種\|配狗\|狗场\|狗場\|犬舍</code> |
| stud (and breeding dam) | <code>(?&lt;![混品纯純])(?:种犬\|種犬\|种狗\|種狗)\|种公\|種公\|种母\|種母</code> |
| litter price | <code>(?:一窝\|一窩)(?:狗狗\|小狗\|幼犬\|狗\|犬\|宠物\|寵物\|毛孩)(?:们\|們)??[^，。！？\n]{0,4}?(?:价格\|價格\|价钱\|價錢\|多少钱\|多少錢\|售价\|售價)\|(?:狗狗\|小狗\|幼犬\|狗\|犬\|宠物\|寵物\|毛孩)(?:们\|們)?(?!狗\|犬\|粮\|糧\|用\|窝\|窩\|屋\|零食\|饼\|餅\|毛衣\|衣\|服\|玩具\|床\|绳\|繩\|链\|鏈\|项圈\|項圈\|碗\|蛋糕\|帽\|鞋\|食\|罐\|卡\|章)[^，。！？\n]{0,3}?(?:价格\|價格\|价钱\|價錢\|多少钱\|多少錢\|售价\|售價\|标价\|標價)</code> |
| selling (or buying) dogs; shops selling items is fine | <code>(?:卖\|賣\|出售\|贩卖\|販賣\|转卖\|轉賣\|买\|買\|购买\|購買)(?:掉\|了\|给\|給)?(?:[^，。！？\n]{0,4}?)(?:狗狗\|小狗\|幼犬\|狗\|犬\|宠物\|寵物\|毛孩)(?:们\|們)?(?!狗\|犬\|粮\|糧\|用\|窝\|窩\|屋\|零食\|饼\|餅\|毛衣\|衣\|服\|玩具\|床\|绳\|繩\|链\|鏈\|项圈\|項圈\|碗\|蛋糕\|帽\|鞋\|食\|罐\|的\|卡\|章)\|(?:狗狗\|小狗\|幼犬\|狗\|犬\|宠物\|寵物\|毛孩)(?:们\|們)?(?!狗\|犬\|粮\|糧\|用\|窝\|窩\|屋\|零食\|饼\|餅\|毛衣\|衣\|服\|玩具\|床\|绳\|繩\|链\|鏈\|项圈\|項圈\|碗\|蛋糕\|帽\|鞋\|食\|罐\|的\|卡\|章)[^，。！？\n]{0,4}?(?:被卖\|被賣\|出售\|待售\|卖掉\|賣掉\|卖给\|賣給\|卖了\|賣了\|卖出\|賣出)</code> |
| franchise name | <code>任天堂\|任天狗\|宝可梦\|寶可夢\|神奇宝贝\|神奇寶貝\|口袋妖怪\|口袋怪兽\|口袋怪獸\|动物森友\|動物森友\|动物之森\|動物之森\|动森\|動森</code> |
| "made in Japan"; say 日式 (Japan-style). 原产日本 for a dog breed is a fact and fine | <code>日本制造\|日本製造\|日本制\|日本製\|日本产\|日本產\|产自日本\|產自日本\|日本原装\|日本原裝\|日货\|日貨\|日本(?:的)?游戏\|日本(?:的)?遊戲</code> |
| franchise name (Latin spelling) | <code>nintendo\|pok[eé]mon\|animal crossing</code> |
| "made in Japan" (Latin spelling); say Japan-style | <code>made in japan\|japanese-made</code> |

Caught on purpose (test sentences): 「我們來繁殖狗狗」 「配種」 「種犬」 「一窩小狗多少錢？」 「賣小狗」 「出售幼犬」 「小狗被賣了」 「買一隻小狗」 「寶可夢」 「動物森友會」 「日本製造」 「animal crossing」

Never hit (the `allow` list, also used as negative tests): 「品種」 「犬種」 「原產日本」 「日式」 「冬日攤位在賣狗狗毛衣。」 「飼料小舖賣飼料和零食。」 「汪汪精品店賣小狗的衣服。」 「給狗狗買零食吧！」 「小狗們免費交給新家庭。」 「柴犬原產日本。」 「汪汪建築賣狗屋。」 「狗狗卡片」 「領養一隻小狗吧！」 「米克斯也很可愛。」

## 11. TODO(native)

- Hong Kong wording differs in places (Golden Retriever 金毛尋回犬, Beagle 比高, Wonton 雲吞, Butter 牛油, Tokyo Tower 東京塔, quotes 「」 same). The game ships one zh-Hant; check Taiwan wording is acceptable to HK readers.
- 玩伴聚會 / 約玩 for "playdate".
- 格雷伊獵犬 vs 灰狗 for Greyhound; 日本狐狸犬 for the Japanese Spitz.
- 動物之家 as "Shelter": warm in Taiwan; check it reads well to HK readers.

## Site

The site translation (`site/i18n/zh-Hant.json`, v2.14 phase 1b), written in Taiwan wording (not converted from zh-Hans). Item words used there, for the game lane to match: 鮭魚抹醬 (salmon pâté), 絨毛骨頭 (plush bone), 益智餵食器 (puzzle feeder), 骨頭餅乾 (bone biscuit), 啾啾小鴨 (squeaky duck), 雞肉飯 (chicken & rice), 拔河繩 (rope tug), 網球, 飛盤, 撿球 (fetch), 開飯時間 (feeding), 膝上犬 (lap dog), 沖天炮 (top-knot), 狗狗運動場 (dog run).

- TODO(native): the dogs' names follow section 7 (麻糬, 餅乾, 陽光 …) on the site too, so they match the game; en.json's note says most languages keep the English names. Check this is what we want.
- TODO(native): Taiwan slang in the dog profiles: 愛演 (Shiba, Chihuahua, Husky), 討拍 (Dachshund), 暴衝 (zoomies), 傻呼呼 (Pit Bull), 愛現 (Poodle, Spitz), 沙發馬鈴薯 (Greyhound), 沖天炮 (Maltese, Shih Tzu). Natural for Taiwan kids, and readable in Hong Kong?
- TODO(native): jokes rewritten rather than translated: Samoyed 「每年春天，掉的毛能再拼出一隻狗。」, Shih Tzu 「沖天炮朝天，身體躺平。」, Poodle 「髮型可以隨便。氣質不能隨便。」, Greyhound 45 mph shown as 時速72公里.
- TODO(native): 小狗版的{name} for the puppy picture caption (English "a Mochi puppy").
- TODO(native): privacy page wording (隱私權政策, 雜湊, 打亂處理過的密碼, 電子報) and the added line in privacy.updated: 「本政策的中文版與英文版如有不同，以英文版為準。」

## Game

`game/i18n/zh-Hant.json` (v2.14 phase 2, 7362 keys, translated 22 Oct 2026), written in Taiwan wording, not converted from zh-Hans. Choices made for Taiwan players:
- Item, place, toy, food, outfit and trick names are fixed once and used the same way in shops, walks, the journal and every line, and they match the site (鮭魚抹醬, 絨毛骨頭, 啾啾小鴨, 益智餵食器, 拔河繩, 雞肉飯, 嗅聞墊, 冰雪小屋, 紅蘿蔔, 地瓜, 酪梨, 夏威夷豆, 尖叫雞 for the Rubber Chicken, 幸運銅板, 東京鐵塔, 代代木公園狗狗運動場). Play Dead = 裝睡, zoomies = 暴衝, Nose-o-meter = 嗅嗅儀, dig spot = 挖寶點, dog spot = 狗狗名額, charm = 護身符, top-knot = 沖天炮, care meters = 數值, perk = 加成, Captain Fluff = 蓬蓬隊長, IOU = 欠條, Cone of Dignity = 尊嚴頭套, spay/neuter = 結紮.
- Every dog is 牠 (several dogs 牠們) unless a line keeps a `sex` branch. Things are 它, other players are 這位玩家 / 其他玩家, never 牠. The player has no gender (你, never 您). Gerald, a male duck, is 他. A dog's sex is 男生 / 女生.
- "In season" for a dog is the heat cycle (發情期), never a season of the year (garden produce in season is 當季). "Fewer than 4 litters" = 最多生過3胎, "rest one season" = 休息一個發情期. Pug, Frenchie and Shih Tzu snorts are 哼哧; 打呼 only where the English says "snores". The veggie Garden is 菜園 and the Home Yard is 院子.
- Bar buttons: 餵食, 玩耍, 照顧, 散步, 衣櫥, 日記, 地圖. Buy = 購買, Bond = 親密度, coins = 金幣, mission stamp = 印章, Tokyo stamp = 紀念章.
- Lessons are exactly two sentences. Where the English has three or four (Gerald's lessons, `winter.lesson`), they are joined into two.
- No funeral imagery: the Westie's "tiny white chrysanthemum" is 小白雲, the Shiba's "I have died" is a faint (暈倒). No return-policy jokes about dogs: adoption is 一輩子的約定.
- Mix names (`data.mix_list.*`): only well-known real mixes have Chinese names; the pun names stay English and show as A × B.
- `title.a_cozy_dog_game_sketchbook` is 溫馨素描狗狗遊戲 so it fits one line on a phone.
- Code note (all languages): `{eyes}` in `vet.coat_eyes`, `playdate.coat_and_eyes`, `puppies.coat_and_eyes`, `pack.coat_and_eyes` and `garden.coatline` looks filled with the raw English eye word from `mods/genes.js` (brown, amber, blue), so it may show in English in every language.
- TODO(native): `data.wx_lines.shiba.warm`: the "Snow is beneath me" pun rewritten as 雪？在我腳下而已。
- TODO(native): `data.wx_lines.shiba.rain`: "the manager of the sky" became 找天空的負責人客訴.
- TODO(native): `data.walk_lines.bonkhigh.1`: the ducking/ducks pun is lost (低頭閃過是鴨子的專長).
- TODO(native): `data.wx_lines.malamute.snow`: 這才像話！話大多是我在講！ for "Now we are talking! Mostly me!".
- TODO(native): `data.wx_lines.bichon.night` / `spitz.night`: "Puff off. Sleep on." as 毛球下班。睡覺上班。 (閃亮下班 for the spitz).
- TODO(native): `data.tk_lines.stdpoodle.shibuya`: 用優雅修長的線條走過去 for "in a long, graceful line".
- TODO(native): `title.start_over_body_html`: the English "moved to a farm. A real one." can read as a death joke, so the old dog moves to 素描本的另一頁 (another page of the sketchbook). Check it lands.
- TODO(native): `adopt.is_now_your_dog_there_html`: "no take-backs policy" became 這是一輩子的約定 (no return-policy joke about a dog).
- TODO(native): `shop.bought_3`: 不能退貨喔。永遠不行。 is about items bought in a shop, not dogs. Check it reads fine next to the adoption rule.
- TODO(native): `data.dc_words_a.*`: 愛睏, 淡定, 霧霧, 衝衝 in Dog Card names, e.g. 愛笑餅乾. Natural?
- TODO(native): `data.dc_breed_words.*`: nicknames 柴柴, 黃金, 拉拉, 法鬥, 德牧, 邊牧, 格雷伊 on the cards.
- TODO(native): `photo.place_town`: "Doodle Town" = 塗鴉小鎮, while `town.map_title` keeps the brand (Doodle Doggo小鎮).
- TODO(native): `data.sig.chihuahua.say`: 「我就是颱風警報！！」 rewrites "WEATHER EVENT" for Taiwan.
- TODO(native): `data.sig.shiba.say`: the "I have died" joke became a faint, 「我暈倒了。要鮭魚抹醬才能叫醒我。」
- TODO(native): `data.sig.shihtzu.say`: 晚安，各位臣民 for "Goodnight, court".
- TODO(native): `newyear.gerald_text`: the Year of the Sheep and Border Collie herding joke.
- TODO(native): `winter.lesson`: the English has three sentences, merged into two for the lesson rule.
- TODO(native): `winter.tip_salt`: 融雪鹽 (road salt) may be unfamiliar in Taiwan.
- TODO(native): `data.ex_words.*`: short face labels (吐舌 for blep, 心虛 for guilty, 想睡 for sleepy).
- TODO(native): `data.npc_boys.*` / `data.npc_girls.*`: Playdate Board dog names (公爵, 豆腐, 酸黃瓜爵士, 小雛菊, 味噌, 毛毛夫人 …), kept apart from the starter names.
- TODO(native): `mod.genes.harlequin`: 小丑花色 for the Great Dane harlequin coat. Is there a usual Taiwan word?
- TODO(native): `data.words.dobie.*`: "and rust" as 黑鏽色 / 紅鏽色 (黑棕色 is an option). Fawn = 小鹿色 for every breed.
- TODO(native): `mod.genes.coat_urajiro`: 裏白 is a Japanese loan word. Can kids read it?
- TODO(native): `mod.genes.everything_dog`: 什錦狗狗 for the Everything Dog joke.
- TODO(native): `vet.painter_broke`: the 不收曝光度 joke (painter paid in exposure). Natural?
- TODO(native): `journal.title_master_breeder` 毛色大師 and "keep breeding" as 多辦幾次玩伴聚會: rewritten to avoid "breed" as a verb. Check the meaning holds.
- TODO(native): `title.a_cozy_dog_game_sketchbook`: 溫馨素描狗狗遊戲 (shortened so it fits one line on a phone, "sketchbook edition" folded into 素描).
- TODO(native): `mod.genes.mutt_mix`: 米克斯混血 repeats itself (米克斯 already means a mix).
- TODO(native): `mod.toys.peekaboo` / `peekaboo_spiky_friend`: 躲貓貓 is hide-and-seek rather than peekaboo.
- TODO(native): `mod.genes.need_dapple`: 斑點色 for the dachshund dapple coat has no glossary entry.
- TODO(native): `pack.rescue`: 救援 as a button (adopt a rescue dog) may read like "do a rescue".
- TODO(native): `newyear.gerald_text`: the herding line 「這樣才不會有誰被當成羊，不小心被趕進羊群」 could be tighter.
- TODO(native): `core.lu_nothing`: "No refunds" became 沒有贈品 (keeps 不退 away from dogs). Check the joke still works.
- TODO(native): `data.food.bone_shaped_biscuit.note`: "very meta" as 非常有深度.
- TODO(native): `data.clothes.ghost_sheet.perk` / `trick_or_treat_ghost.perk`: "Boo" as 嚇一跳 (哇嗚 is an option).
- TODO(native): `data.lines.hello.3`: "My favourite room after all the other rooms" as 除了其他所有房間以外. Does it read?
- TODO(native): growls ("grr") are 嗚嚕 / 嗚嚕嚕 (`data.toys_lines.*.tuggrowl`, `mod.toys.grrr_*`). Natural for a playful tug growl?
- TODO(native): `data.words.*`: "Black and tan" = 黑褐色 may read as one dark brown. Check against Taiwan kennel-club usage.
- TODO(native): `mail.card_9`: 真是超額達成 for "overachiever". Does it land for kids?
- TODO(native): "snack" is 點心 in some lines and 零食 (the glossary word for "treat") in others: pick one per English word.
- TODO(native): the Nose-o-meter hot/cold hints use 超燙 / 越來越燙 (walk.nose_hot, mod.walk.*, walk_lines.hot/warm, clues.hot.2): fine for the warmer/colder game or too literal?
