# Simplified Chinese (zh-Hans) style guide and glossary

Doodle Doggo v2.14 "Hello in Every Language". Source language: English. Data file: `game/i18n/glossary/zh-Hans.json`. The tables below match the JSON; change both together. Target readers: mainland China, Singapore and Malaysia, written in Simplified characters with mainland wording. Traditional Chinese has its own page (`zh-Hant.md`, Taiwan wording). Anything marked TODO(native) needs a native speaker's check.

## 1. Tone

- Cozy, kind, simple, playful. Nothing bad ever happens: no 生病, 死, 走丢, no scolding.
- The joke is the crude crayon dogs. Chinese internet humour has the perfect word: 丑萌 (ugly-cute). Keep the dogs proud of their wobbly drawing, deadpan.
- Adapt jokes rather than translating them. Dog-sound puns work well with 汪 (wāng, "woof"): 汪汪精品店, 汪汪建筑 (Barkitecture), 汪奇诺咖啡馆 (Pupuccino). Reduplication is cute and very natural for kids: 狗狗, 摸摸, 霜霜, 桃桃.
- Readers include children: common characters, short sentences, no 成语 unless a child would know it (一模一样 fine, 画蛇添足 no).

## 2. Register and address

**Choice: 你, never 您.** 您 is polite and distant; cozy games for young players use 你, and the dogs and Gerald are friends.

| Who speaks | Register | Example |
|---|---|---|
| UI, buttons, system lines, lessons | short, friendly, neutral | 「已存档。」「点“喂食”，再选一种食物。」 |
| Dogs | casual, first person 我, the breed's personality; sentence particles 呀/啦/嘛/哦 sparingly | 柴犬：「沙发现在是我的了。我决定的。」 金毛：「沙发！地毯！台灯！我爱这个家！」 |
| Gerald the duck | casual, a bit know-it-all | 「我是杰拉德。我住在河边，什么都知道。我带你逛逛吧。」 |
| Mrs. Plum, families, Dr. Paws | warm, polite but still 你 | 「南瓜田快闪店开张啦，欢迎来玩！」 |

- Buttons: verb or verb + object, 2–4 characters: 喂食, 散步, 领养, 返回, 关闭. No 请 on buttons. 请 is fine in a full sentence, but prefer a friendly imperative + 吧: 「去公园走走吧！」
- Don't overuse 哦/呢 in UI; one particle per line at most.

## 3. UI conventions

- Punctuation: full-width ，。！？：；、 and quotes “ ” (inner ‘ ’). Titles of books, cards or contests in 《》 only when they are real titles; game item names need no marks. Ellipsis …… (two).
- Spaces: none between Chinese and digits or Latin words in the UI: 100金币, 等级3, 来玩Doodle Doggo吧. (Tight phone UI; consistent with ja.)
- Numbers: Arabic digits. Measure words: dogs 只 (3只小狗), items 个, days 天. Coins: 100金币.
- Dates: 10月18日 星期六 / 周六. Times: 15:30.
- One exclamation mark at most (！). ！！ only for a dog shouting (Husky: 「嗷呜——！」).
- Plurals: no grammatical plural; ICU `plural` needs only `other`: `{n, plural, other {#只小狗}}`. Add 们 only to people and to 小狗们 when it sounds natural.
- Length: Chinese is about half the characters of English, but each is wide. Buttons up to 4 characters on the phone, toasts one line of about 16 characters.

## 4. The owner's word rules in Chinese

| Never say | Why | Say instead |
|---|---|---|
| 繁殖, 繁育, 配种, 交配, 育种, 配狗, 狗场, 犬舍 | "breed" as a verb (犬舍 = breeding kennel) | 玩伴聚会 (puppy playdate; button 约玩), 小狗出生了 |
| 种犬, 种狗, 种公, 种母 | "stud" | the dog's name, 另一只狗狗 |
| 一窝小狗多少钱, 小狗的价格, 售价 | "litter price" | (no prices for dogs; puppies are free) |
| 卖小狗, 出售幼犬, 买一只小狗 | selling (or buying) dogs | 免费交给新家庭, 领养, 新家庭 |
| 日本制造, 日本产, 日货, 日本游戏 | "made in Japan" | 日式 (Japan-style), 日式风格 |
| 任天堂, 宝可梦, 神奇宝贝, 动物森友会, 动森 … | franchise names | — |

- 品种 / 犬种 (breed, the noun) is fine: 「品种：柴犬」. 原产日本 for a breed is a fact and fine: 「柴犬原产日本。」
- 混种犬 (mixed-breed dog) is fine; it contains 种犬 but the ban pattern excludes it.
- Shops selling items is fine: 「冬日摊位在卖狗狗毛衣。」 Keep 卖 away from a bare dog word: 卖狗狗毛衣 is fine, 卖狗狗 is not.
- Playdate: avoid 约会 (romantic date) and 相亲 (matchmaking) as the main word; they are cute but suggest the wrong thing.

## 5. Japanese words and places

Use the standard Chinese names for the real places, and the Japanese custom with a short Chinese gloss the first time:

御神签 (omikuji, the Fortune box; first time 「御神签（日本的抽签）」), 年贺状 (nengajō, Japanese New Year card), 门松 (kadomatsu), 新年 (here the 1 January Japanese New Year; never 春节), 麻糬 (mochi), 八公 (Hachikō; the statue 八公像), 新干线, 富士山, 涩谷十字路口, 代代木公园, 浅草与浅草寺, 东京塔, 上野公园, 台场.

- Mainland writes 涩谷 (Shibuya) and 代代木 (Yoyogi; Japanese 代々木). Keep these spellings everywhere.
- Facts stay true and are not extended (Hachikō was an Akita who waited at Shibuya Station).

## 6. Care lessons (blocks)

Exactly **two sentences**, each ending in 。 Example, the vet's merle block (English: "Both carry merle. Two merles can have puppies with eye and ear trouble, so these two stay friends."):

「它们俩都带有陨石色基因。两只陨石色狗狗的小狗可能会有眼睛和耳朵的问题，所以它们俩还是做好朋友吧。」

## 7. Starter dog names

The dogs are named after foods and sweets. In Chinese the joke lands best when the name is the food word itself (Chinese pet names are often foods: 饺子, 包子, 花生). So translate the meaning; keep reduplicated or 小- names for non-food names. Japanese food names that Chinese already uses stay (大福, 蜜柑).

| Breed | English name | zh-Hans |
|---|---|---|
| `shiba` | Mochi | 麻糬 |
| `corgi` | Biscuit | 饼干 |
| `golden` | Sunny | 阳光 |
| `dachs` | Noodle | 面条 |
| `husky` | Frost | 霜霜 |
| `mutt` | Pepper | 胡椒 |
| `chihuahua` | Peanut | 花生 |
| `pug` | Dumpling | 饺子 |
| `greyhound` | Rocket | 火箭 |
| `beagle` | Bagel | 贝果 |
| `poodle` | Pretzel | 扭结饼 |
| `collie` | Scout | 小探 |
| `samoyed` | Cloud | 云朵 |
| `frenchie` | Brioche | 布里欧 |
| `akita` | Kuma | 熊熊 |
| `spitz` | Daifuku | 大福 |
| `pom` | Mikan | 蜜柑 |
| `afghan` | Saffron | 藏红花 |
| `dane` | Waffle | 华夫 |
| `mastiff` | Crumpet | 松饼 |
| `gsd` | Strudel | 苹果卷 |
| `dobie` | Espresso | 浓缩 |
| `corso` | Cannoli | 奶油卷 |
| `pitbull` | Peaches | 桃桃 |
| `minpin` | Jellybean | 软糖 |
| `lab` | Butter | 黄油 |
| `malamute` | Maple | 枫糖 |
| `chow` | Bao | 包子 |
| `stdpoodle` | Madeleine | 玛德琳 |
| `schnauzer` | Muesli | 麦片 |
| `westie` | Shortbread | 酥饼 |
| `yorkie` | Toffee | 太妃糖 |
| `bichon` | Meringue | 蛋白霜 |
| `maltese` | Marshmallow | 棉花糖 |
| `shihtzu` | Wonton | 馄饨 |

## 8. Breed names

From `mods/genes.js` BREEDS (35 keys), mainland common usage. Shelter Mutt in running text: 救助站的混种犬 (or the friendly slang 串串, TODO(native) whether kids know it).

| Key | English | zh-Hans |
|---|---|---|
| `shiba` | Shiba Inu | 柴犬 |
| `corgi` | Corgi | 柯基犬 |
| `golden` | Golden Retriever | 金毛寻回犬 |
| `dachs` | Dachshund | 腊肠犬 |
| `husky` | Husky | 哈士奇 |
| `mutt` | Shelter Mutt (mixed breed) | 混种犬 |
| `chihuahua` | Chihuahua | 吉娃娃 |
| `pug` | Pug | 巴哥犬 |
| `greyhound` | Greyhound | 灵缇犬 |
| `beagle` | Beagle | 比格犬 |
| `poodle` | Miniature Poodle | 迷你贵宾犬 |
| `collie` | Border Collie | 边境牧羊犬 |
| `samoyed` | Samoyed | 萨摩耶犬 |
| `frenchie` | French Bulldog | 法国斗牛犬 |
| `akita` | Akita | 秋田犬 |
| `spitz` | Japanese Spitz | 日本尖嘴犬 |
| `pom` | Pomeranian | 博美犬 |
| `afghan` | Afghan Hound | 阿富汗猎犬 |
| `dane` | Great Dane | 大丹犬 |
| `mastiff` | English Mastiff | 英国獒犬 |
| `gsd` | German Shepherd | 德国牧羊犬 |
| `dobie` | Dobermann | 杜宾犬 |
| `corso` | Cane Corso | 卡斯罗犬 |
| `pitbull` | Pit Bull | 比特犬 |
| `minpin` | Miniature Pinscher | 迷你品犬 |
| `lab` | Labrador Retriever | 拉布拉多寻回犬 |
| `malamute` | Alaskan Malamute | 阿拉斯加雪橇犬 |
| `chow` | Chow Chow | 松狮犬 |
| `stdpoodle` | Standard Poodle | 标准贵宾犬 |
| `schnauzer` | Miniature Schnauzer | 迷你雪纳瑞 |
| `westie` | West Highland White Terrier | 西高地白梗 |
| `yorkie` | Yorkshire Terrier | 约克夏梗 |
| `bichon` | Bichon Frise | 比熊犬 |
| `maltese` | Maltese | 马尔济斯犬 |
| `shihtzu` | Shih Tzu | 西施犬 |

## 9. Glossary

**Core words**

| English | zh-Hans | Note |
|---|---|---|
| Doodle Doggo | Doodle Doggo | Brand name: always Latin letters, never translated. |
| dog | 狗狗 | The friendly everyday word. ja also ワンちゃん in dialogue; ko 개 only in compounds; th avoid bare หมา in UI. |
| puppy | 小狗 | ko: never 새끼 (also a rude word). |
| adopt | 领养 | Adopting a dog into your home. |
| adopt out free to families | 免费交给新家庭 | The safe phrase for puppies leaving. Never a sale. |
| new family | 新家庭 |  |
| Adopt me board | 待领养告示板 | Shelter board of dogs looking for a home. |
| bond | 亲密度 | The stat that unlocks places. ja: 絆 (きずな). |
| coins | 金币 | Counter style: ja 100コイン, zh 100金币, ko 100코인, th 100 เหรียญ. |
| Sparkle | 闪亮 | Cosmetic coat sparkle, never paid. |
| Hunger | 饱腹 | A stat bar. Phrase it as fullness, never as suffering. |
| Energy | 体力 | Naps refill it. |
| Happiness | 开心值 |  |
| level | 等级 |  |
| crayon | 蜡笔 | The art joke: crude crayon dogs. |
| sketchbook | 素描本 |  |

**Main buttons and care**

| English | zh-Hans | Note |
|---|---|---|
| Feed | 喂食 | Bar button. |
| Play | 玩耍 | Bar button. |
| Care | 照顾 | Bar button (bath, nap, brush). |
| Walk | 散步 | Bar button; walks are the main income. |
| Wardrobe | 衣橱 | Bar button. |
| Journal | 日记 | Bar button (short form of Treasure Journal). |
| Treasure Journal | 宝物日记 | Modal title. |
| Map | 地图 | Bar button. |
| pet (verb) | 摸摸 | Rubbing the dog. |
| bath | 洗澡 |  |
| nap | 打盹 |  |
| potty | 上厕所 | Keep it light and clean. |
| brush | 梳毛 |  |
| train | 训练 |  |
| trick | 才艺 | ja 芸 (げい) is the real word for dog tricks. |
| Sit | 坐下 | Trick name. |
| Shake | 握手 | Trick name (paw shake). |
| Spin | 转圈 | Trick name. |
| Roll over | 打滚 | Trick name. |
| ball play | 丢球游戏 | Replaced the old Fetch challenge. |
| treat | 零食 |  |
| kibble | 狗粮 |  |
| Pupcake | 汪汪蛋糕 | Dog-safe cupcake. Pun: pup + cupcake. TODO(native) th. |
| food | 食物 | Journal tab "Food". |
| toys | 玩具 |  |
| clothes | 衣服 |  |
| outfit | 搭配 |  |
| collar | 项圈 |  |
| bandana | 三角巾 |  |
| leash | 牵绳 |  |
| bed | 狗窝 |  |
| doghouse | 狗屋 |  |
| decorate | 装饰 | Home decorating mode. |

**Puppies and genetics**

| English | zh-Hans | Note |
|---|---|---|
| playdate | 玩伴聚会 | THE safe word for two dogs meeting (puppy playdate). Short zh button form: 约玩 / 約玩. |
| Playdate Board | 玩伴聚会告示板 | At the Dog Park. |
| puppies | 小狗们 | Use for "litter" in player-facing text. |
| Pick of the litter | 挑一只小狗 | Card title: the family lets you choose one pup, free. |
| healthy pup | 健康的小狗 |  |
| resting after a playdate | 聚会后正在休息 | Welfare rest between litters; kind tone. |
| coat | 毛色 | Coat colour (also the Journal tab "Coats"). |
| merle | 陨石色 | Coat pattern. Never double merle. |
| Family tree | 家谱 |  |
| Gene Sniffer | 基因嗅嗅机 | Joke gadget; keep the sniffing sound. |

**Places**

| English | zh-Hans | Note |
|---|---|---|
| Home Yard | 家里的院子 |  |
| Cozy House | 温馨小屋 |  |
| Sunny Park | 阳光公园 |  |
| Riverside | 河边 |  |
| Maple Woods | 枫树林 |  |
| Seashell Beach | 贝壳海滩 |  |
| Market Street | 商店街 |  |
| Town Square | 小镇广场 |  |
| Dog Park | 狗狗公园 |  |
| Vet Clinic | 宠物医院 | Only check-ups and kind news; no sickness. |
| Grooming Salon | 宠物美容店 |  |
| Pupuccino Café | 汪奇诺咖啡馆 | Pun on puppuccino. TODO(native) zh. |
| Doggy Donut | 汪汪甜甜圈 |  |
| Kibble Corner | 狗粮小铺 | Shop. |
| Bow-Wow Boutique | 汪汪精品店 | Shop (clothes). |
| Barkitecture | 汪汪建筑 | Builder shop; pun bark + architecture: ja ワン築 (建築), ko 멍축 (건축). TODO(native) th. |
| Pip's Sprout Cart | 皮普的幼苗小车 | Seed shop. |
| Shelter | 救助站 | Warm words only. zh-Hant 動物之家 is the Taiwan word for public shelters. |
| Shelter Playroom | 救助站游戏室 |  |
| Lighthouse Pier | 灯塔码头 | Walk spot. |
| Hilltop Meadow | 山顶草地 | Walk spot. |
| Town Loop | 小镇环线 | Walk route. |
| Hilltop Trail | 山顶小径 | Walk route. |
| Pier Boardwalk | 码头栈道 | Walk route. |

**Characters**

| English | zh-Hans | Note |
|---|---|---|
| Gerald (the duck) | 杰拉德 | The guide duck who knows everything. |
| Mrs. Plum | 梅子太太 | The neighbour with the Pumpkin Patch Pop-up. |
| Pip (the farmer) | 皮普 |  |
| Dr. Paws | 爪爪医生 | The vet; translate the pun (paws). |

**Garden and kitchen**

| English | zh-Hans | Note |
|---|---|---|
| garden | 菜园 | Also "veggie patch". |
| seeds | 种子 |  |
| water (plants) | 浇水 |  |
| harvest | 收获 |  |
| kitchen | 厨房 |  |
| cook | 烹饪 | Only dog-safe food. |
| recipe | 食谱 |  |
| Pantry | 食品柜 |  |

**Seasons and festivals**

| English | zh-Hans | Note |
|---|---|---|
| spring | 春天 |  |
| summer | 夏天 |  |
| autumn | 秋天 |  |
| winter | 冬天 |  |
| weather | 天气 |  |
| rain | 雨 |  |
| snow | 雪 |  |
| festival | 节日 |  |
| leaf piles | 落叶堆 |  |
| Harvest Stall | 丰收摊位 |  |
| Costume Parade | 变装游行 |  |
| Halloween | 万圣节 | Cute, never scary. |
| Pumpkin Patch Pop-up | 南瓜田快闪店 |  |
| Snow Days | 下雪天 |  |
| Winter Lights | 冬日灯饰 |  |
| Winter Stall | 冬日摊位 |  |
| Ugly Sweater Contest | 丑萌毛衣大赛 | The ugliness is the joke: ugly-cute. |
| New Year | 新年 | 1 January (Japanese New Year), not the lunar New Year: zh never 春节, ko never 설날. |
| New Year card (nengajō) | 年贺状 | Japanese New Year postcard. |
| Fortune box (omikuji) | 御神签 | Only happy fortunes. th: เซียมซี (fortune sticks) is the familiar word. |
| kadomatsu (pine) | 门松 | New Year pine decoration. |
| mochi | 麻糬 | Food item. The dog Mochi keeps its own name. |

**Japan and Tokyo**

| English | zh-Hans | Note |
|---|---|---|
| Japan-style | 日式 | The safe word. Never "made in Japan". |
| Mt. Fuji | 富士山 |  |
| Mt. Fuji Lookout | 富士山观景台 | Code name fujihill. |
| Station | 车站 | The Station pin on the town map. |
| Shinkansen | 新干线 |  |
| Japan map | 日本地图 |  |
| Tokyo | 东京 |  |
| Shibuya Crossing | 涩谷十字路口 |  |
| Hachikō | 八公 | The loyal Akita at Shibuya Station. |
| Yoyogi Park Dog Run | 代代木公园遛狗区 |  |
| Asakusa and Sensō-ji | 浅草与浅草寺 |  |
| Tokyo Tower | 东京塔 |  |
| Ueno Park | 上野公园 |  |
| Odaiba Seaside | 台场海滨 |  |
| stamp | 印章 |  |
| stamp book | 集章册 | Seven Tokyo stamps. |

**Dog Cards, photos, pack**

| English | zh-Hans | Note |
|---|---|---|
| Dog Cards | 狗狗卡片 | Opt-in public cards; no free text. |
| visiting dog | 来访的狗狗 |  |
| paw (on a card) | 爪爪 | The one "like" per card per Japan day. |
| Photo mode | 拍照模式 |  |
| postcard | 明信片 |  |
| All Together (pack play) | 大家一起 | v2.9 pack play and walks. |
| Missions | 任务 | Journal tab. |
| Daily missions | 每日任务 |  |
| treasure | 宝物 |  |
| letter | 信 |  |
| Mailbox | 信箱 |  |

**Journal tabs and settings**

| English | zh-Hans | Note |
|---|---|---|
| Profile | 资料 | Journal tab. |
| Family | 家族 | Journal tab. |
| How to play | 玩法 | Journal tab. |
| Settings | 设置 |  |
| Sound | 声音 |  |
| Music | 音乐 |  |
| Sound effects | 音效 |  |
| Ambience | 环境音 |  |
| Mute all | 全部静音 |  |
| Motion and wobble | 动态与摇晃 | Reduced-motion setting. |
| Language | 语言 | Show each language by its own name: 日本語, 简体中文, 繁體中文, 한국어, ไทย. |
| Reset save | 删除存档 |  |
| save | 存档 |  |
| Cloud save | 云存档 | Off on claude.ai. |
| Log in | 登录 |  |
| Sign up | 注册 |  |
| Forgot your password? | 忘记密码？ |  |
| Title screen | 标题画面 |  |
| Back | 返回 | Button. |
| Close | 关闭 | Button. |
| OK | 好的 | Button. |
| Yes | 好 | Button. |
| No | 不了 | Button; zh 不了 is a soft "no thanks". |

## 10. Bans (machine check)

`game/test_i18n_node.js` runs these against every Chinese string (the same list for zh-Hans and zh-Hant; each pattern lists both character forms). No word boundaries in Chinese, so the sell patterns use a short window and a look-ahead that skips dog items (狗粮, 狗窝, 狗狗毛衣, 小狗的衣服 …). The `allow` phrases are legitimate sentences that must never be hit.

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

Caught on purpose (test sentences): 「我们来繁殖狗狗」 「配种」 「找一只种犬」 「一窝小狗多少钱？」 「小狗的价格」 「卖小狗」 「出售幼犬」 「卖掉了三只小狗」 「小狗被卖了」 「去买一只小狗」 「宝可梦」 「动物森友会」 「日本制造的游戏」 「一款日本游戏」 「Pokémon」

Never hit (the `allow` list, also used as negative tests): 「品种」 「犬种」 「原产日本」 「日式」 「冬日摊位在卖狗狗毛衣。」 「狗粮小铺卖狗粮和零食。」 「汪汪精品店卖小狗的衣服。」 「给狗狗买零食吧！」 「小狗们免费交给新家庭。」 「柴犬原产日本。」 「汪汪建筑卖狗屋。」 「狗狗卡片」 「领养一只小狗吧！」 「混种犬也很可爱。」

## 11. TODO(native)

- 玩伴聚会 / 约玩 for "playdate": check it reads naturally and isn't babyish.
- Names: 扭结饼 (Pretzel), 小探 (Scout), 浓缩 (Espresso), 华夫 (Waffle) are guesses at a cute pet name.
- 汪奇诺咖啡馆 (Pupuccino Café), 汪汪建筑 (Barkitecture): check the puns.
- 日本尖嘴犬 vs 银狐犬 for the Japanese Spitz.
