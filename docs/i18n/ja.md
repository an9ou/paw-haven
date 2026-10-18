# Japanese (ja) style guide and glossary

Doodle Doggo v2.14 "Hello in Every Language". Source language: English. Data file: `game/i18n/glossary/ja.json` (breeds, terms, bans, allow). The tables below match the JSON; change both together. Anything marked TODO(native) needs a native speaker's check.

## 1. Tone

- Cozy, kind, simple, playful. Nothing bad ever happens, so no scary, sad or scolding words (no 病気, 死, 迷子, ダメ!).
- The joke is the crude crayon dogs. Keep the deadpan: a dog that is badly drawn and proud of it. Japanese loves this as ヘタかわ (clumsy-cute) and ゆるい (loose, laid-back) humour, so lean into ゆるさ, not into irony.
- Adapt jokes, don't translate them word for word. Puns on English words usually die; replace them with a Japanese pun of the same kind (Barkitecture → ワン築工房, from 建築 kenchiku). If no pun fits, a cute sound word (オノマトペ: くるりん, ごろーん, クンクン, ぽかぽか) does the same job.
- Readers include children. Use kanji a 3rd–4th grader knows (犬, 子犬, 公園, 家族, 地図, 雪); write harder words in kana: なでる (not 撫でる), おふろ (not 風呂), ごはん, おさんぽ, たからもの, もようがえ. No furigana in the UI.

## 2. Register and address

**Choice: two registers, by speaker.**

| Who speaks | Register | Example |
|---|---|---|
| UI, buttons, system lines, lessons, letters | gentle です/ます | 「ごはんをあげました。」「セーブしました。」 |
| Dogs (their lines, quotes) | plain casual, with the breed's personality | 柴犬: 「ソファはもうわたしのもの。そう決めた。」 ゴールデン: 「ソファ！ ラグ！ ランプ！ おうち大好き！」 |
| Gerald the duck (guide) | plain, a little know-it-all | 「ぼくはジェラルド。川のそばに住んでいて、なんでも知ってるんだ。案内するよ。」 |
| Mrs. Plum, families, Dr. Paws (letters, NPCs) | polite です/ます, warm | 「かぼちゃ畑のポップアップを開きました。遊びに来てくださいね。」 |

Why: です/ます is the friendly default of Japanese games for young players and keeps the UI kind; plain speech gives the dogs their voices. Never use 命令形 (〜しろ) in the UI.

- Address: avoid あなた. Use no pronoun at all (Japanese drops it) or the dog's name: 「モチがよろこんでいます。」
- Dogs call themselves by personality: わたし (default, any sex), ぼく (playful), おれ only if the English line is very swaggering. Never 拙者 or old-fashioned jokes that need culture knowledge.
- Buttons: a short noun or the dictionary form, no です/ます: ごはん, おさんぽ, あそぶ, もどる, とじる, お迎えする. Confirm buttons: 「はい」「いいえ」, or the action itself (「消す」「やめておく」).

## 3. UI conventions

- Punctuation: full-width 。、！？ ; quotes 「」, quotes inside quotes 『』. No “”. Ellipsis ……; wave dash 〜. One ！ at most (！！ only for a dog yelling, like the Husky's AWOOO → 「アオーーン！」).
- After ！ or ？ inside a sentence, add a full-width space: 「ソファ！　ラグ！」 (a half-width space is fine on the phone).
- No spaces between Japanese and numbers or Latin words: 100コイン, レベル3, Doodle Doggo の世界 → Doodle Doggoの世界.
- Numbers: half-width digits. Counters: dogs 匹 (子犬3匹; 頭 is only for very big animals, don't use it), items 個, days 日. Coins: 100コイン.
- Dates: 10月18日（土）. Times: 15:30 or 午後3時半. Use the 24-hour form in tight UI.
- Middle dot ・ splits long foreign compounds; follow the site's existing breed spellings exactly (some have it, some don't: ゴールデンレトリバー but ラブラドール・レトリバー). Don't "fix" them.
- Length: Japanese is usually shorter than English in characters but each character is wider. On the phone keep buttons to about 6 full-width characters (ごはん, おさんぽ, クローゼット) and toasts to one line of about 18 characters.
- Plurals: Japanese has no plural; ICU `plural` only needs `other` (`{n, plural, other {子犬#匹}}`). Don't add たち to every plural; use it for people and dogs only when it sounds natural (子犬たち).

## 4. The owner's word rules in Japanese

| Never say | Why | Say instead |
|---|---|---|
| 繁殖, 交配, 種付け, 掛け合わせ, ブリーディング, ブリーダー, 子作り | "breed" as a verb | プレイデート (puppy playdate), 子犬が生まれる (puppies arrive) |
| 種犬, 種オス, スタッド | "stud" | 相手のワンちゃん, the dog's name |
| 生体価格, 子犬の値段, 一腹の価格 | "litter price" | (there is no price; puppies are free) |
| 子犬を売る, 販売中の子犬, 生体販売, 子犬を買う | selling dogs | 新しい家族のもとへ無料でお届け, 里親さん, お迎えする |
| 日本製, 日本産, 国産, 日本で作られたゲーム, メイド・イン・ジャパン | "made in Japan" | 和風 (Japan-style), 日本の雰囲気 |
| 任天堂, ポケモン, どうぶつの森, あつ森 … | franchise names | — |

- 犬種 (breed, the noun) is fine: 「犬種: 柴犬」. 日本原産 for a breed is a fact and fine: 「柴犬は日本原産の犬種です。」 (but never about the game).
- Shops selling items is fine: 「ワンワン・ブティックで子犬の服を売っています。」 Avoid a dog word right before 売る/販売 even then: write 犬用のセーター, not 犬のセーターを売る if you can.
- The pet-trade word for adoption is お迎え (adopting into your home) and 里親 (foster/adoptive family). Both are warm and right here.

## 5. Japanese words and places (keep them the same in every language)

The game already uses real Japanese places and customs. In Japanese, use the real words, not a translation of the English:

おみくじ (Fortune box), 年賀状 (New Year card, the game's "nengajō"), 門松 (the New Year pine), お正月 (New Year), お餅 (mochi), ハチ公 (Hachikō), 新幹線 (Shinkansen), 富士山 (Mt. Fuji), 渋谷スクランブル交差点, 代々木公園ドッグラン, 浅草と浅草寺 (Sensō-ji: せんそうじ), 東京タワー, 上野公園, お台場.

- Write ハチ公 with 公 (the real statue's name), never ハチコウ.
- Mt. Fuji Lookout is a made-up place: 富士山の見晴らし台.
- Tokyo place facts must stay true (Hachikō was an Akita who waited at Shibuya Station). Don't add facts the English doesn't have.
- The site's Japanese breed names and the katakana dog names (tools/site_dogs.js `jp` and `nameJp`) stay exactly as they are; the breed table and the name table below copy them.

## 6. Care lessons (blocks)

Lessons stay exactly **two sentences**, each ending in 。 Short, kind, factual; です/ます. Example, the vet's merle block (English: "Both carry merle. Two merles can have puppies with eye and ear trouble, so these two stay friends."):

「2匹ともマールの毛色をもっています。マールどうしだと子犬の目や耳にトラブルが出ることがあるので、この2匹はお友だちのままです。」

Never turn a lesson into a warning list, and never add a third sentence to fit an extra fact.

## 7. Starter dog names

The dogs are named after foods and sweets; that is part of the joke. In Japanese, keep the site's katakana names (they are already public on doodledoggo.app). Several are Japanese words already (モチ, ダイフク, ミカン, クマ).

| Breed | English name | ja |
|---|---|---|
| `shiba` | Mochi | モチ |
| `corgi` | Biscuit | ビスケット |
| `golden` | Sunny | サニー |
| `dachs` | Noodle | ヌードル |
| `husky` | Frost | フロスト |
| `mutt` | Pepper | ペッパー |
| `chihuahua` | Peanut | ピーナッツ |
| `pug` | Dumpling | ダンプリング |
| `greyhound` | Rocket | ロケット |
| `beagle` | Bagel | ベーグル |
| `poodle` | Pretzel | プレッツェル |
| `collie` | Scout | スカウト |
| `samoyed` | Cloud | クラウド |
| `frenchie` | Brioche | ブリオッシュ |
| `akita` | Kuma | クマ |
| `spitz` | Daifuku | ダイフク |
| `pom` | Mikan | ミカン |
| `afghan` | Saffron | サフラン |
| `dane` | Waffle | ワッフル |
| `mastiff` | Crumpet | クランペット |
| `gsd` | Strudel | シュトゥルーデル |
| `dobie` | Espresso | エスプレッソ |
| `corso` | Cannoli | カンノーロ |
| `pitbull` | Peaches | ピーチ |
| `minpin` | Jellybean | ジェリービーン |
| `lab` | Butter | バター |
| `malamute` | Maple | メープル |
| `chow` | Bao | バオ |
| `stdpoodle` | Madeleine | マドレーヌ |
| `schnauzer` | Muesli | ミューズリー |
| `westie` | Shortbread | ショートブレッド |
| `yorkie` | Toffee | トフィー |
| `bichon` | Meringue | メレンゲ |
| `maltese` | Marshmallow | マシュマロ |
| `shihtzu` | Wonton | ワンタン |

## 8. Breed names

From `mods/genes.js` BREEDS (35 keys). The values are the site's existing names. Shelter Mutt in running text: 保護犬のミックス; on the breed line: ミックス犬.

| Key | English | ja |
|---|---|---|
| `shiba` | Shiba Inu | 柴犬 |
| `corgi` | Corgi | コーギー |
| `golden` | Golden Retriever | ゴールデンレトリバー |
| `dachs` | Dachshund | ダックスフンド |
| `husky` | Husky | ハスキー |
| `mutt` | Shelter Mutt (mixed breed) | ミックス犬 |
| `chihuahua` | Chihuahua | チワワ |
| `pug` | Pug | パグ |
| `greyhound` | Greyhound | グレイハウンド |
| `beagle` | Beagle | ビーグル |
| `poodle` | Miniature Poodle | ミニチュア・プードル |
| `collie` | Border Collie | ボーダーコリー |
| `samoyed` | Samoyed | サモエド |
| `frenchie` | French Bulldog | フレンチブルドッグ |
| `akita` | Akita | 秋田犬 |
| `spitz` | Japanese Spitz | 日本スピッツ |
| `pom` | Pomeranian | ポメラニアン |
| `afghan` | Afghan Hound | アフガン・ハウンド |
| `dane` | Great Dane | グレート・デーン |
| `mastiff` | English Mastiff | イングリッシュ・マスティフ |
| `gsd` | German Shepherd | ジャーマン・シェパード |
| `dobie` | Dobermann | ドーベルマン |
| `corso` | Cane Corso | カネ・コルソ |
| `pitbull` | Pit Bull | ピット・ブル |
| `minpin` | Miniature Pinscher | ミニチュア・ピンシャー |
| `lab` | Labrador Retriever | ラブラドール・レトリバー |
| `malamute` | Alaskan Malamute | アラスカン・マラミュート |
| `chow` | Chow Chow | チャウチャウ |
| `stdpoodle` | Standard Poodle | スタンダード・プードル |
| `schnauzer` | Miniature Schnauzer | ミニチュア・シュナウザー |
| `westie` | West Highland White Terrier | ウエスト・ハイランド・ホワイト・テリア |
| `yorkie` | Yorkshire Terrier | ヨークシャー・テリア |
| `bichon` | Bichon Frise | ビションフリーゼ |
| `maltese` | Maltese | マルチーズ |
| `shihtzu` | Shih Tzu | シーズー |

## 9. Glossary

**Core words**

| English | ja | Note |
|---|---|---|
| Doodle Doggo | Doodle Doggo | Brand name: always Latin letters, never translated. |
| dog | 犬 | The friendly everyday word. ja also ワンちゃん in dialogue; ko 개 only in compounds; th avoid bare หมา in UI. |
| puppy | 子犬 | ko: never 새끼 (also a rude word). |
| adopt | お迎えする | Adopting a dog into your home. |
| adopt out free to families | 新しい家族のもとへ無料でお届け | The safe phrase for puppies leaving. Never a sale. |
| new family | 新しい家族 |  |
| Adopt me board | 里親募集ボード | Shelter board of dogs looking for a home. |
| bond | 絆 | The stat that unlocks places. ja: 絆 (きずな). |
| coins | コイン | Counter style: ja 100コイン, zh 100金币, ko 100코인, th 100 เหรียญ. |
| Sparkle | キラキラ | Cosmetic coat sparkle, never paid. |
| Hunger | おなか | A stat bar. Phrase it as fullness, never as suffering. |
| Energy | 元気 | Naps refill it. |
| Happiness | しあわせ |  |
| level | レベル |  |
| crayon | クレヨン | The art joke: crude crayon dogs. |
| sketchbook | スケッチブック |  |

**Main buttons and care**

| English | ja | Note |
|---|---|---|
| Feed | ごはん | Bar button. |
| Play | あそぶ | Bar button. |
| Care | おせわ | Bar button (bath, nap, brush). |
| Walk | おさんぽ | Bar button; walks are the main income. |
| Wardrobe | クローゼット | Bar button. |
| Journal | 日記 | Bar button (short form of Treasure Journal). |
| Treasure Journal | たからもの日記 | Modal title. |
| Map | 地図 | Bar button. |
| pet (verb) | なでる | Rubbing the dog. |
| bath | おふろ |  |
| nap | お昼寝 |  |
| potty | トイレ | Keep it light and clean. |
| brush | ブラッシング |  |
| train | トレーニング |  |
| trick | 芸 | ja 芸 (げい) is the real word for dog tricks. |
| Sit | おすわり | Trick name. |
| Shake | お手 | Trick name (paw shake). |
| Spin | くるりん | Trick name. |
| Roll over | ごろーん | Trick name. |
| ball play | ボール遊び | Replaced the old Fetch challenge. |
| treat | おやつ |  |
| kibble | ドッグフード |  |
| Pupcake | わんケーキ | Dog-safe cupcake. Pun: pup + cupcake. TODO(native) th. |
| food | ごはん | Journal tab "Food". |
| toys | おもちゃ |  |
| clothes | 服 |  |
| outfit | コーデ |  |
| collar | 首輪 |  |
| bandana | バンダナ |  |
| leash | リード |  |
| bed | ベッド |  |
| doghouse | 犬小屋 |  |
| decorate | もようがえ | Home decorating mode. |

**Puppies and genetics**

| English | ja | Note |
|---|---|---|
| playdate | プレイデート | THE safe word for two dogs meeting (puppy playdate). Short zh button form: 约玩 / 約玩. |
| Playdate Board | プレイデート掲示板 | At the Dog Park. |
| puppies | 子犬たち | Use for "litter" in player-facing text. |
| Pick of the litter | いちばんの子を選ぼう | Card title: the family lets you choose one pup, free. |
| healthy pup | 元気な子犬 |  |
| resting after a playdate | プレイデートのあとでひと休み中 | Welfare rest between litters; kind tone. |
| coat | 毛色 | Coat colour (also the Journal tab "Coats"). |
| merle | マール | Coat pattern. Never double merle. |
| Family tree | 家系図 |  |
| Gene Sniffer | 遺伝子クンクン | Joke gadget; keep the sniffing sound. |

**Places**

| English | ja | Note |
|---|---|---|
| Home Yard | おうちの庭 |  |
| Cozy House | ぽかぽかハウス |  |
| Sunny Park | ひだまり公園 |  |
| Riverside | 川辺 |  |
| Maple Woods | もみじの森 |  |
| Seashell Beach | 貝がらビーチ |  |
| Market Street | 商店街 |  |
| Town Square | 町の広場 |  |
| Dog Park | ドッグパーク |  |
| Vet Clinic | 動物病院 | Only check-ups and kind news; no sickness. |
| Grooming Salon | トリミングサロン |  |
| Pupuccino Café | パプチーノ・カフェ | Pun on puppuccino. TODO(native) zh. |
| Doggy Donut | わんわんドーナツ |  |
| Kibble Corner | カリカリ・コーナー | Shop. |
| Bow-Wow Boutique | ワンワン・ブティック | Shop (clothes). |
| Barkitecture | ワン築工房 | Builder shop; pun bark + architecture: ja ワン築 (建築), ko 멍축 (건축). TODO(native) th. |
| Pip's Sprout Cart | ピップの苗ワゴン | Seed shop. |
| Shelter | 保護施設 | Warm words only. zh-Hant 動物之家 is the Taiwan word for public shelters. |
| Shelter Playroom | 保護施設のプレイルーム |  |
| Lighthouse Pier | 灯台の桟橋 | Walk spot. |
| Hilltop Meadow | 丘の上の原っぱ | Walk spot. |
| Town Loop | 町ひとまわりコース | Walk route. |
| Hilltop Trail | 丘の小道 | Walk route. |
| Pier Boardwalk | 桟橋のボードウォーク | Walk route. |

**Characters**

| English | ja | Note |
|---|---|---|
| Gerald (the duck) | ジェラルド | The guide duck who knows everything. |
| Mrs. Plum | プラムさん | The neighbour with the Pumpkin Patch Pop-up. |
| Pip (the farmer) | ピップ |  |
| Dr. Paws | ポウズ先生 | The vet; translate the pun (paws). |

**Garden and kitchen**

| English | ja | Note |
|---|---|---|
| garden | 菜園 | Also "veggie patch". |
| seeds | たね |  |
| water (plants) | 水やり |  |
| harvest | 収穫 |  |
| kitchen | キッチン |  |
| cook | 料理する | Only dog-safe food. |
| recipe | レシピ |  |
| Pantry | パントリー |  |

**Seasons and festivals**

| English | ja | Note |
|---|---|---|
| spring | 春 |  |
| summer | 夏 |  |
| autumn | 秋 |  |
| winter | 冬 |  |
| weather | 天気 |  |
| rain | 雨 |  |
| snow | 雪 |  |
| festival | お祭り |  |
| leaf piles | 落ち葉の山 |  |
| Harvest Stall | 収穫祭の屋台 |  |
| Costume Parade | 仮装パレード |  |
| Halloween | ハロウィン | Cute, never scary. |
| Pumpkin Patch Pop-up | かぼちゃ畑のポップアップ |  |
| Snow Days | 雪の日 |  |
| Winter Lights | ウィンターイルミネーション |  |
| Winter Stall | 冬の屋台 |  |
| Ugly Sweater Contest | ダサかわセーター・コンテスト | The ugliness is the joke: ugly-cute. |
| New Year | お正月 | 1 January (Japanese New Year), not the lunar New Year: zh never 春节, ko never 설날. |
| New Year card (nengajō) | 年賀状 | Japanese New Year postcard. |
| Fortune box (omikuji) | おみくじ | Only happy fortunes. th: เซียมซี (fortune sticks) is the familiar word. |
| kadomatsu (pine) | 門松 | New Year pine decoration. |
| mochi | お餅 | Food item. The dog Mochi keeps its own name. |

**Japan and Tokyo**

| English | ja | Note |
|---|---|---|
| Japan-style | 和風 | The safe word. Never "made in Japan". |
| Mt. Fuji | 富士山 |  |
| Mt. Fuji Lookout | 富士山の見晴らし台 | Code name fujihill. |
| Station | 駅 | The Station pin on the town map. |
| Shinkansen | 新幹線 |  |
| Japan map | 日本地図 |  |
| Tokyo | 東京 |  |
| Shibuya Crossing | 渋谷スクランブル交差点 |  |
| Hachikō | ハチ公 | The loyal Akita at Shibuya Station. |
| Yoyogi Park Dog Run | 代々木公園ドッグラン |  |
| Asakusa and Sensō-ji | 浅草と浅草寺 |  |
| Tokyo Tower | 東京タワー |  |
| Ueno Park | 上野公園 |  |
| Odaiba Seaside | お台場の海辺 |  |
| stamp | スタンプ |  |
| stamp book | スタンプ帳 | Seven Tokyo stamps. |

**Dog Cards, photos, pack**

| English | ja | Note |
|---|---|---|
| Dog Cards | ドッグカード | Opt-in public cards; no free text. |
| visiting dog | 遊びに来た犬 |  |
| paw (on a card) | 肉球 | The one "like" per card per Japan day. |
| Photo mode | フォトモード |  |
| postcard | ポストカード |  |
| All Together (pack play) | みんないっしょ | v2.9 pack play and walks. |
| Missions | ミッション | Journal tab. |
| Daily missions | きょうのミッション |  |
| treasure | たからもの |  |
| letter | 手紙 |  |
| Mailbox | ポスト |  |

**Journal tabs and settings**

| English | ja | Note |
|---|---|---|
| Profile | プロフィール | Journal tab. |
| Family | 家族 | Journal tab. |
| How to play | 遊び方 | Journal tab. |
| Settings | 設定 |  |
| Sound | 音 |  |
| Music | 音楽 |  |
| Sound effects | 効果音 |  |
| Ambience | 環境音 |  |
| Mute all | すべてミュート |  |
| Motion and wobble | 動きとゆらゆら | Reduced-motion setting. |
| Language | 言語 | Show each language by its own name: 日本語, 简体中文, 繁體中文, 한국어, ไทย. |
| Reset save | セーブを消す |  |
| save | セーブ |  |
| Cloud save | クラウドセーブ | Off on claude.ai. |
| Log in | ログイン |  |
| Sign up | 新規登録 |  |
| Forgot your password? | パスワードを忘れた？ |  |
| Title screen | タイトル画面 |  |
| Back | もどる | Button. |
| Close | とじる | Button. |
| OK | OK | Button. |
| Yes | はい | Button. |
| No | いいえ | Button; zh 不了 is a soft "no thanks". |

## 10. Bans (machine check)

`game/test_i18n_node.js` runs these against every Japanese string. CJK has no word boundaries, so the patterns use short windows and look-aheads instead of `\b`. The `allow` phrases are legitimate sentences that must never be hit: each is also a negative test.

| Rule | Pattern (JS RegExp source, flag `u`) |
|---|---|
| "breed" as a verb (犬種 = breed, the noun, is fine) | <code>繁殖\|交配\|種付け\|たねつけ\|掛け合わせ\|かけあわせ\|ブリーディング\|ブリーダー\|子作り</code> |
| stud | <code>種犬\|種オス\|種牡\|スタッド</code> |
| litter price | <code>生体販売\|生体価格\|(?:子犬\|こいぬ\|ワンちゃん\|わんこ)(?:たち)?(?:の\|は\|が)?(?:お?値段\|価格\|代金\|ねだん)\|(?:一腹\|ひと腹)の?(?:お?値段\|価格)</code> |
| selling (or buying) dogs; shops selling items is fine | <code>(?:子犬\|こいぬ\|犬\|いぬ\|ワンちゃん\|わんちゃん\|わんこ\|ワンコ\|パピー)(?:たち\|ちゃん)?(?!用\|小屋\|の\|種\|カフェ\|ケーキ)(?:を\|は\|が\|も)?(?:[0-9０-９一二三四五六七八九十]+(?:匹\|頭)(?:を\|は\|が\|も)?)?(?:売\|販売\|譲渡金)\|(?:売\|販売)(?:り\|る\|られる\|られた\|られている\|っている\|ってる\|中\|され\|した\|する)?(?:の\|ている)?(?:[0-9０-９一二三四五六七八九十]+(?:匹\|頭)の)?(?:子犬\|こいぬ\|犬\|いぬ\|ワンちゃん\|わんちゃん\|わんこ\|ワンコ\|パピー)(?:たち\|ちゃん)?(?!用\|小屋\|の\|種\|カフェ\|ケーキ)\|(?:子犬\|こいぬ\|犬\|いぬ\|ワンちゃん\|わんちゃん\|わんこ\|ワンコ\|パピー)(?:たち\|ちゃん)?(?:を\|が)(?:買\|購入)</code> |
| franchise name | <code>任天堂\|ニンテンドー\|ニンテンドッグス\|ポケモン\|ポケットモンスター\|どうぶつの森\|あつ森\|ぶつ森</code> |
| "made in Japan"; say 和風 (Japan-style). 日本原産 for a dog breed is a fact and fine | <code>日本製\|日本産\|国産\|メイド・?イン・?ジャパン\|日本で(?:作\|つく)(?:られ\|った)\|日本(?:生まれ)?の(?:ゲーム)</code> |
| franchise name (Latin spelling) | <code>nintendo\|pok[eé]mon\|animal crossing</code> |
| "made in Japan" (Latin spelling); say Japan-style | <code>made in japan\|japanese-made</code> |

Caught on purpose (test sentences): 「犬を繁殖させよう」 「交配の準備」 「種犬を探す」 「子犬の値段は？」 「子犬を売ります」 「子犬を3匹売った」 「売っている子犬」 「販売中の子犬」 「ペットショップで子犬を買う」 「ポケモンみたい」 「あつまれ どうぶつの森」 「日本製のゲーム」 「このゲームは日本で作られた」 「Made in Japan!」 「ニンテンドーの犬」

Never hit (the `allow` list, also used as negative tests): 「犬種」 「日本原産」 「柴犬は日本原産の犬種です。」 「和風のおもちゃ」 「冬の屋台で犬用のセーターを売っています。」 「ワンワン・ブティックで子犬の服を売っています。」 「ワン築工房で犬小屋を売っています。」 「ワンちゃんのおやつを買いました。」 「子犬たちは新しい家族のもとへ無料でお届けします。」 「売り切れ」 「プレイデートのあとでひと休み中」 「子犬をお迎えしよう！」 「飼い主さんが売店でおやつを売っています。」

## 11. TODO(native)

- プレイデート vs なかよしデート for "playdate": プレイデート is shorter but young children may not know it.
- Gerald's voice (ぼく, …なんだ): check it sounds like a friendly know-it-all, not rude.
- ワン築工房 (Barkitecture) and パプチーノ・カフェ (Pupuccino Café): check the puns land.
- ダサかわセーター・コンテスト (Ugly Sweater Contest): ダサかわ is slang; check it is kid-friendly.

## Site

`site/i18n/ja.json` (v2.14 phase 1b, 714 keys). Choices made for Japanese readers:
- The Japanese-word placeholders ({asobo}, {muryo}, {osanpo}, {dogrun}, {torii}, {shibainu}, {arigato}, {mame}, {inutachi}) are dropped where they only repeated the Japanese; `home.words.*` (犬 inu: …) show the English meaning, under the title 「海外の犬好きさんに教えたい日本語」.
- "wobbly" is ふにゃふにゃ; the tagline is shortened to 「クレヨン子犬をお迎えしよう」 so it fits one line on a phone.
- Greyhound quote: 45 mph → 時速72キロ.
- TODO(native): ふにゃふにゃ for "wobbly" (crayon lines): alternatives へにゃへにゃ, よれよれ.
- TODO(native): dog trait lines and quotes (casual voice, ぼく/わたし per dog), e.g. 辛口 (judgy), もってこい命 (fetch fanatic), カワウソしっぽ (otter tail).
- TODO(native): love items (サーモンのパテ, ぬいぐるみの骨, 知育フィーダー, ピーピーアヒル) must match the game's item names once game/i18n/ja.json exists.
- TODO(native): 「このカードを非表示」 (privacy.cards.off) must match the game's "Hide this card" button.
- TODO(native): soon.line 狆（ちん）と甲斐犬; home.note.* facts read as natural for Japanese readers (they were written for visitors).
- TODO(native): privacy page register and the English-prevails sentence in privacy.updated.
