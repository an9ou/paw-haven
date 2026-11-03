# Cantonese (yue): terms fixed in chunk 3

Chunk 3 (Gerald's guide, letters and families, food safety and breed lessons, puppies, pack, coat genes, the vet) is done: 1,802 keys. It reuses the glossary and the chunk 1 and 2 lists; the words below are new. Chunks 4 to 7 (the site's dog profiles above all) reuse them. Look a key up in `game/i18n/yue.json` for the exact line.

## Format rules chunk 3 settled

- Mixes (`data.mix_list.*`): the 16 real mixes get an HK name in breed + breed form (金毛貴婦, 拉布拉多貴婦, 馬爾濟斯貴婦, 八哥比高, 松鼠哈士奇 …); the other 545 pun names stay English, so the game shows `{a} × {b}` (`mod.genes.mix_pattern`).
- Eyes: every use is `{coat}，{eyes}眼`, so the eye words have no 眼: 啡色, 琥珀色, 藍色, 鴛鴦 (odd eyes). Chunk 4 `garden.coatline` should end the same way (`{coat}，{eyes}眼`).
- Family with place: `mail.fam_where` and `puppies.trots_off_with` use `{name}（{where}）`; the `where` phrases read alone (the postcard album shows them alone): 渡輪碼頭, 喺碼頭, 住喺書店樓上.
- Lessons: two sentences each; the Gerald guide lessons of three or four English sentences are joined with ，into two.
- A `sex` select is kept only where the English says boy / girl (`vet.npc_desc`, `vet.npc_none`, `playdate.would_love_a_friend_but_none`, `puppies.name_for_the_pup`, `genes.paperwork_done_is_a_good` 乖女 / 乖仔); dropped everywhere else.
- Letters keep `P.S. ` in Latin letters, as HK people write it.

## Words

| English | 廣東話 | Where |
|---|---|---|
| gene / carries (a gene) | 基因 / 帶住…基因 | genes, vet, mod.genes |
| gene test / cheek swab | 基因測試 / 用棉棒喺口入面掃一掃 | vet |
| gene card | 基因咭 | vet |
| sniff test (Gene Sniffer) | 索索測試, 索一索 | vet |
| locus | 位點 (B位點) | data.loci |
| dilute / full colour | 淡色 / 原本深色 | genes, mod.genes |
| liver (pigment) | 深啡 | genes; Chocolate stays 朱古力色 |
| piebald / pied / parti / mantle | 白花斑 / 花斑 / 雙色花 / 披肩紋 | mod.genes |
| dapple / brindle / sable | 斑點 / 虎紋 / 貂色 | data.words |
| fawn / tan / rust | 黃啡色 / 棕 (黑棕色) / 鏽 (黑鏽色) | data.words |
| cream / lilac | 忌廉色 / 淡紫色 | data.words |
| urajiro | 裏白 (帶忌廉色裏白) | mod.genes |
| Harlequin | 丑角紋 | mod.genes |
| double merle | 雙隕石色 | genes, mod.genes |
| odds 1 in {n} | {n}分之1 | mod.genes, playdate |
| parents | 爸爸媽媽 / 爸爸或者媽媽其中一個 | data.pig_need |
| Mutt mix / family mix | 唐狗混種 / {breed}家族混種 | mod.genes |
| expecting (pregnant) | 有咗BB, 懷孕 (懷孕期間唔得) | vet, playdate |
| nursing | 餵奶 / 餵緊狗BB飲奶 | vet, pupplay, pack |
| mum-to-be / Proud Mum | 準媽媽 / 自豪媽媽 | vet, puppies |
| Ultrasound | 超聲波 | vet |
| litter (rules only) | 胎 (生過3胎, 生完一胎) | playdate |
| litter (player-facing) | 呢班狗BB | mail.picked, playdate |
| due in N days | 仲有{n}日就生 | vet, playdate |
| retired (from seasons, litters) | 光榮退休, 已經冇發情期（年長狗狗） | genes, playdate |
| Cone of Dignity | 尊嚴頭罩 | vet.fix_toast |
| care meter | 照顧指數 | playdate |
| Puppy Predictor | 狗BB預測 | playdate |
| Family Portrait / town painter | 全家福 / 小鎮畫家 | vet |
| dog spot | 狗狗位 (第{n}個位) | pack |
| leader (pack walk) | 隊長 | packplay |
| tick (a dog) | 剔 / 打咗剔 | packplay |
| starter (dog) | 新手狗狗 | pack |
| puppy shots | 狗BB針 | pack |
| Rescue / Today's rescues | 領養 / 今日等緊屋企嘅狗狗 | pack |
| pen-pal families / album | 筆友家庭 / 相簿 | mail |
| Doodle Doggo Post | Doodle Doggo郵局 | mail, puppies |
| mail carrier | 郵差 | mail |
| tip jar | 貼士罐 | mail |
| Doggy Ramp / Rocking Chair | 狗狗斜台 / 搖搖椅 (chunk 4 names) | puppies |
| Carrot Crunchies / Spinach Scramble / Pumpkin Pupcake | 甘筍脆脆 / 菠菜炒蛋 / 南瓜汪汪蛋糕 | food safety swaps (chunk 4 names) |
| harness | 胸背帶 | data.bd_tips |
| topknot | 頭頂髻 | data.bd_tips |
| unsafe foods | 酒精, 咖啡因, 大蒜苗 (leek), 韭菜, 乾蔥, 生麵糰, 木糖醇, 無糖香口膠 | data.extra_unsafe, data.people_food |
| medical facts | 腎衰竭, 貧血, 紅血球, 血糖, 傷肝, 嘔, 發燒 | data.people_food (facts kept exact) |

## Names

- Families: 阿貝貝船長, 哈達德醫生, 科瓦斯基一家, 林婆婆, 莫雷諾一家, 阮家, 奧布萊恩一家, 奧卡福家嘅孖生, 帕特爾小姐, 雷耶斯伯伯, 佐藤兩姊妹, 田中一家; town: 阿伯納西一家, 金醫生（係牙醫，唔係獸醫）, 林奎斯特太太, 帕特爾一家, 喬伯伯, 莫羅一家, 羅莎, 阮家啲細路, 貝爾教練.
- Town dogs: 公爵, 阿福, 賓利, 吉吉, 大鹿, 格仔餅船長, 布魯諾, 豆腐, 阿格, 酸瓜爵士; 雛菊, 露娜, 小柑, 佩妮, 小楓, 珠珠, 蘿絲, 味噌, 榛子, 毛毛夫人.
- `data.breed_names` (short forms the game shows): 金毛 (Golden), 唐狗 (Mutt), 拉布拉多, 西高地白㹴 (Westie), 杜賓犬; the rest as the glossary.
- Gerald's title in the puppy letter: 鴨仔傑拉德.

## For a native speaker to check (TODO(native))

- `data.words.*` coat colours: 黃啡色 for fawn, 棕 for tan (黑棕色), 鏽 for rust (杜賓 黑鏽色), 深啡 for liver, 貂色 for sable, 裏白 for urajiro. Are these the words HK groomers and breeders use?
- `data.people_food.avocado.why`: 鱷梨素（persin）. Mainland/Taiwan word for persin; HK may just say 一種物質.
- `data.people_food.*.why`, `data.extra_unsafe.*.why`: plain medical facts (腎衰竭, 貧血, 嘔, 發燒) kept as in English. Check they read calm for children.
- `playdate.has_retired_from_romance`: 唔再談情說愛喇 for "retired from romance".
- `vet.fix_toast`: 尊嚴頭罩 for the Cone of Dignity (HK owners say 頭罩 or 伊莉莎白圈).
- `vet.painter_broke`: 唔收「曝光率」 for the "not exposure" joke.
- `vet.npc_puddle`: rewritten as 見到水氹就一定要踩 (sex select dropped).
- `mail.card_8`: 叫佢安哥，定係叫佢收聲 for "an encore. Or an ending."
- `mail.nb_plum_text`: 依法 for "legally".
- `data.fallback_dogs.*.personality`: 梳化薯仔 (couch potato, greyhound), 騷包 (spitz, as in chunk 2).
- `genes.happy_birthday_dog_years`: #狗狗歲 for "# dog years".
- `data.loci.*`: gene names keep the Latin codes (TYRP1, MLPH …) as in English.
