# Thai (th) style guide and glossary

Doodle Doggo v2.14 "Hello in Every Language". Source language: English. Data file: `game/i18n/glossary/th.json`. The tables below match the JSON; change both together. Anything marked TODO(native) needs a native speaker's check.

## 1. Tone

- Cozy, kind, simple, playful. Nothing bad ever happens: no ป่วย, ตาย, หลงทาง, no scolding.
- The joke is the crude crayon dogs. Thai humour loves น่ารักแบบบ้าๆ (silly-cute) and ขี้เหร่แต่น่ารัก (ugly but cute). Keep the dogs proud of their wobbly drawing.
- Adapt jokes. Dog sounds: โฮ่ง (woof), ง่ำ (nom). Thai pet culture uses น้อง for pets (น้องหมา, น้องโมจิ), which sets the warm tone by itself.
- Readers include children: everyday words, short sentences. Avoid formal Sanskrit-heavy words (ใช้ ให้อาหาร not ป้อนโภชนาหาร).

## 2. Register and address

**Choice: neutral UI with no ค่ะ/ครับ; the dogs use เรา.**

| Who speaks | Register | Example |
|---|---|---|
| UI, buttons, system lines, lessons | neutral, friendly, no gendered particle | 「ให้อาหารแล้ว」「บันทึกแล้ว」「แตะ ให้อาหาร แล้วเลือกอาหาร」 |
| Dogs | casual, first person เรา, soft particles นะ / จ้ะ / เลย, the breed's personality | ชิบะ: 「โซฟานี่เป็นของเราแล้ว เราตัดสินใจแล้ว」 โกลเด้น: 「โซฟา! พรม! โคมไฟ! รักบ้านนี้ที่สุด!」 |
| Gerald the duck | casual, know-it-all, เรา, may end with นะ | 「เราชื่อเจอรัลด์ อยู่ริมแม่น้ำ รู้ทุกเรื่องเลยนะ เดี๋ยวพาเที่ยว」 |
| Mrs. Plum, families, Dr. Paws | polite with นะคะ / นะครับ by the character's sex (Mrs. Plum: ค่ะ; Dr. Paws: ครับ), warm | คุณป้าพลัม: 「ป๊อปอัปไร่ฟักทองเปิดแล้วนะคะ แวะมาเล่นกันนะ」 |

Why: ค่ะ/ครับ mark the speaker's sex, so a gender-free UI can't use them; neutral sentences read as friendly in apps and games. เรา is gender-neutral and cute for the dogs (ผม/ฉัน/หนู all carry sex or age).

- Address: drop the pronoun, or use เธอ only when needed in dog lines. Never คุณ in dog lines (too distant), never มึง/กู.
- Buttons: a short verb or noun: ให้อาหาร, เดินเล่น, เล่น, ดูแล, รับเลี้ยง, กลับ, ปิด, ตกลง. Confirm buttons: ใช่ / ไม่.

## 3. UI conventions

- **No full stops.** Thai ends a sentence with a space (or a line end). Use a space between sentences: 「บันทึกแล้ว แล้วเจอกันพรุ่งนี้」.
- No spaces between words; spaces separate phrases and sentences. Put a space before and after Latin words and numbers: 「ได้ 100 เหรียญ」, 「เล่น Doodle Doggo」.
- ? and ! are used in casual text; one at most. ๆ (mai yamok) repeats a word: เล็กๆ, เบาๆ (no space before ๆ in this game; TODO(native) if a space is preferred).
- Quotes: “ ” in text. Ellipsis ...
- Numbers: Arabic digits (not Thai digits ๑๒๓). Counters: dogs ตัว (ลูกหมา 3 ตัว), items ชิ้น / อัน, days วัน. Coins: 100 เหรียญ.
- Dates: 18 ต.ค. or 18 ตุลาคม; use the Gregorian year (ค.ศ.) when a year is shown, e.g. Halloween 2026 items "2026" stay as is (the Buddhist year พ.ศ. 2569 would confuse the "ed 2026" tag).
- Plurals: Thai has no plural; ICU `plural` needs only `other`: `{n, plural, other {ลูกหมา # ตัว}}`.
- Line breaking: Thai has no spaces between words, so the browser needs its dictionary line breaker. CSS must not use `word-break: break-all` on Thai text; use `word-break: normal` and `line-break: auto`. Tall marks above and below the line need a line-height of at least 1.5.
- Length: Thai is often longer than English on screen. Buttons up to about 8 characters on the phone (ให้อาหาร, เดินเล่น); shorten the label rather than the font.

## 4. The owner's word rules in Thai

| Never say | Why | Say instead |
|---|---|---|
| ผสมพันธุ์, เพาะพันธุ์, ขยายพันธุ์, ทำพันธุ์, ฟาร์มหมา | "breed" as a verb | นัดเล่น (puppy playdate), ลูกหมาเกิดแล้ว |
| พ่อพันธุ์, แม่พันธุ์ | "stud" (and breeding dam) | the dog's name, เพื่อนหมา |
| ราคาลูกหมา, ลูกหมาตัวละ … บาท | "litter price" | (no prices; puppies are free) |
| ขายลูกหมา, ขายน้องหมา, ซื้อหมา, ลูกหมาที่ขาย | selling (or buying) dogs | ส่งต่อให้ครอบครัวใหม่ฟรี, รับเลี้ยง |
| ผลิตในญี่ปุ่น, ทำในญี่ปุ่น, เมดอินเจแปน, เกมญี่ปุ่น | "made in Japan" | สไตล์ญี่ปุ่น (Japan-style) |
| นินเทนโด, โปเกมอน, แอนิมอลครอสซิ่ง … | franchise names | — |

- สายพันธุ์ (breed, the noun) is fine: 「สายพันธุ์: ชิบะอินุ」. พันทาง (mixed breed) is fine.
- Shops selling items is fine: 「ร้านนี้ขายเสื้อน้องหมาน่ารัก」. Keep ขาย / ซื้อ from sitting right before a dog word.
- หมา vs สุนัข: สุนัข is formal, bare หมา can sound blunt. Use น้องหมา (dogs) and ลูกหมา (puppies) everywhere.

## 5. Japanese words and places

Thai transcription of Japanese, with a short Thai gloss the first time:

โอมิคุจิ / เซียมซี (the Fortune box: เซียมซี, the Thai fortune sticks, is the familiar word; first time 「เซียมซีญี่ปุ่น (โอมิคุจิ)」), การ์ดอวยพรปีใหม่ (nengajō; first time 「การ์ดอวยพรปีใหม่แบบญี่ปุ่น (เน็งกะโจ)」), คาโดมัตสึ (kadomatsu), ปีใหม่ (1 January), โมจิ (mochi), ฮาจิโกะ (Hachikō), ชินคันเซ็น, ภูเขาไฟฟูจิ, ทางข้ามชิบุยะ, สวนโยโยงิ, อาซากุสะและวัดเซ็นโซจิ, โตเกียวทาวเวอร์, สวนอุเอโนะ, โอไดบะ.

- Facts stay true and are not extended.

## 6. Care lessons (blocks)

Exactly **two sentences**, separated by a space (no full stops). Example (English: "Both carry merle. Two merles can have puppies with eye and ear trouble, so these two stay friends."):

「น้องทั้งสองตัวมียีนขนลายเมิร์ล ถ้าเมิร์ลคู่กับเมิร์ล ลูกหมาอาจมีปัญหาเรื่องตาและหู สองตัวนี้เลยเป็นเพื่อนกันนะ」

Spaces also separate clauses inside a sentence (as above), so count the sentences by meaning, not by spaces: this example is two sentences, the second starting at ถ้า. Never add a third idea.

## 7. Starter dog names

Transliterated, as Thai pet names usually are English loanwords (บิสกิต, เบเกิล). A few use a Thai word that is a classic pet name and keeps the food joke: ปุยเมฆ (Cloud, "fluffy cloud"), เนย (Butter), ซาลาเปา (Bao), เกี๊ยว (Wonton). Say น้อง before a name in running text: 「น้องโมจิ」.

| Breed | English name | th |
|---|---|---|
| `shiba` | Mochi | โมจิ |
| `corgi` | Biscuit | บิสกิต |
| `golden` | Sunny | ซันนี่ |
| `dachs` | Noodle | นู้ดเดิ้ล |
| `husky` | Frost | ฟรอสต์ |
| `mutt` | Pepper | เปปเปอร์ |
| `chihuahua` | Peanut | พีนัท |
| `pug` | Dumpling | ดัมปลิง |
| `greyhound` | Rocket | ร็อกเก็ต |
| `beagle` | Bagel | เบเกิล |
| `poodle` | Pretzel | เพรทเซล |
| `collie` | Scout | สเกาต์ |
| `samoyed` | Cloud | ปุยเมฆ |
| `frenchie` | Brioche | บริยอช |
| `akita` | Kuma | คุมะ |
| `spitz` | Daifuku | ไดฟุกุ |
| `pom` | Mikan | มิกัง |
| `afghan` | Saffron | แซฟฟรอน |
| `dane` | Waffle | วาฟเฟิล |
| `mastiff` | Crumpet | ครัมเปต |
| `gsd` | Strudel | สตรูเดิล |
| `dobie` | Espresso | เอสเปรสโซ |
| `corso` | Cannoli | คันโนลี |
| `pitbull` | Peaches | พีช |
| `minpin` | Jellybean | เจลลี่บีน |
| `lab` | Butter | เนย |
| `malamute` | Maple | เมเปิล |
| `chow` | Bao | ซาลาเปา |
| `stdpoodle` | Madeleine | มาเดอลีน |
| `schnauzer` | Muesli | มูสลี่ |
| `westie` | Shortbread | ชอร์ตเบรด |
| `yorkie` | Toffee | ท็อฟฟี่ |
| `bichon` | Meringue | เมอแรงค์ |
| `maltese` | Marshmallow | มาร์ชเมลโล่ |
| `shihtzu` | Wonton | เกี๊ยว |

## 8. Breed names

From `mods/genes.js` BREEDS (35 keys), Thai common usage (spaced as Thai pet sites write them).

| Key | English | th |
|---|---|---|
| `shiba` | Shiba Inu | ชิบะอินุ |
| `corgi` | Corgi | คอร์กี้ |
| `golden` | Golden Retriever | โกลเด้น รีทรีฟเวอร์ |
| `dachs` | Dachshund | ดัชชุนด์ |
| `husky` | Husky | ฮัสกี้ |
| `mutt` | Shelter Mutt (mixed breed) | พันทาง |
| `chihuahua` | Chihuahua | ชิวาวา |
| `pug` | Pug | ปั๊ก |
| `greyhound` | Greyhound | เกรย์ฮาวด์ |
| `beagle` | Beagle | บีเกิ้ล |
| `poodle` | Miniature Poodle | มินิเอเจอร์ พุดเดิ้ล |
| `collie` | Border Collie | บอร์เดอร์ คอลลี่ |
| `samoyed` | Samoyed | ซามอยด์ |
| `frenchie` | French Bulldog | เฟรนช์ บูลด็อก |
| `akita` | Akita | อาคิตะ |
| `spitz` | Japanese Spitz | เจแปนนีส สปิตซ์ |
| `pom` | Pomeranian | ปอมเมอเรเนียน |
| `afghan` | Afghan Hound | อัฟกัน ฮาวด์ |
| `dane` | Great Dane | เกรท เดน |
| `mastiff` | English Mastiff | อิงลิช มาสทิฟฟ์ |
| `gsd` | German Shepherd | เยอรมัน เชพเพิร์ด |
| `dobie` | Dobermann | โดเบอร์แมน |
| `corso` | Cane Corso | เคน คอร์โซ่ |
| `pitbull` | Pit Bull | พิทบูล |
| `minpin` | Miniature Pinscher | มินิเอเจอร์ พินเชอร์ |
| `lab` | Labrador Retriever | ลาบราดอร์ รีทรีฟเวอร์ |
| `malamute` | Alaskan Malamute | อะแลสกัน มาลามิวท์ |
| `chow` | Chow Chow | เชาเชา |
| `stdpoodle` | Standard Poodle | สแตนดาร์ด พุดเดิ้ล |
| `schnauzer` | Miniature Schnauzer | มินิเอเจอร์ ชนาวเซอร์ |
| `westie` | West Highland White Terrier | เวสต์ ไฮแลนด์ ไวท์ เทอร์เรีย |
| `yorkie` | Yorkshire Terrier | ยอร์กเชียร์ เทอร์เรีย |
| `bichon` | Bichon Frise | บิชอง ฟริเซ่ |
| `maltese` | Maltese | มอลทีส |
| `shihtzu` | Shih Tzu | ชิสุ |

## 9. Glossary

**Core words**

| English | th | Note |
|---|---|---|
| Doodle Doggo | Doodle Doggo | Brand name: always Latin letters, never translated. |
| dog | น้องหมา | The friendly everyday word. ja also ワンちゃん in dialogue; ko 개 only in compounds; th avoid bare หมา in UI. |
| puppy | ลูกหมา | ko: never 새끼 (also a rude word). |
| adopt | รับเลี้ยง | Adopting a dog into your home. |
| adopt out free to families | ส่งต่อให้ครอบครัวใหม่ฟรี | The safe phrase for puppies leaving. Never a sale. |
| new family | ครอบครัวใหม่ |  |
| Adopt me board | บอร์ดหาบ้าน | Shelter board of dogs looking for a home. |
| bond | ความผูกพัน | The stat that unlocks places. ja: 絆 (きずな). |
| coins | เหรียญ | Counter style: ja 100コイン, zh 100金币, ko 100코인, th 100 เหรียญ. |
| Sparkle | วิบวับ | Cosmetic coat sparkle, never paid. |
| Hunger | ความอิ่ม | A stat bar. Phrase it as fullness, never as suffering. |
| Energy | พลังงาน | Naps refill it. |
| Happiness | ความสุข |  |
| level | เลเวล |  |
| crayon | สีเทียน | The art joke: crude crayon dogs. |
| sketchbook | สมุดสเก็ตช์ |  |

**Main buttons and care**

| English | th | Note |
|---|---|---|
| Feed | ให้อาหาร | Bar button. |
| Play | เล่น | Bar button. |
| Care | ดูแล | Bar button (bath, nap, brush). |
| Walk | เดินเล่น | Bar button; walks are the main income. |
| Wardrobe | ตู้เสื้อผ้า | Bar button. |
| Journal | สมุดบันทึก | Bar button (short form of Treasure Journal). |
| Treasure Journal | สมุดสมบัติ | Modal title. |
| Map | แผนที่ | Bar button. |
| pet (verb) | ลูบ | Rubbing the dog. |
| bath | อาบน้ำ |  |
| nap | งีบหลับ |  |
| potty | เข้าห้องน้ำ | Keep it light and clean. |
| brush | แปรงขน |  |
| train | ฝึก |  |
| trick | ท่าโชว์ | ja 芸 (げい) is the real word for dog tricks. |
| Sit | นั่ง | Trick name. |
| Shake | ยื่นมือ | Trick name (paw shake). |
| Spin | หมุนตัว | Trick name. |
| Roll over | กลิ้งตัว | Trick name. |
| ball play | เล่นโยนบอล | Replaced the old Fetch challenge. |
| treat | ขนม |  |
| kibble | อาหารเม็ด |  |
| Pupcake | คัพเค้กหมาน้อย | Dog-safe cupcake. Pun: pup + cupcake. TODO(native) th. |
| food | อาหาร | Journal tab "Food". |
| toys | ของเล่น |  |
| clothes | เสื้อผ้า |  |
| outfit | ชุด |  |
| collar | ปลอกคอ |  |
| bandana | ผ้าพันคอ |  |
| leash | สายจูง |  |
| bed | ที่นอน |  |
| doghouse | บ้านหมา |  |
| decorate | ตกแต่ง | Home decorating mode. |

**Puppies and genetics**

| English | th | Note |
|---|---|---|
| playdate | นัดเล่น | THE safe word for two dogs meeting (puppy playdate). Short zh button form: 约玩 / 約玩. |
| Playdate Board | บอร์ดนัดเล่น | At the Dog Park. |
| puppies | ลูกหมา | Use for "litter" in player-facing text. |
| Pick of the litter | เลือกลูกหมาหนึ่งตัว | Card title: the family lets you choose one pup, free. |
| healthy pup | ลูกหมาแข็งแรง |  |
| resting after a playdate | กำลังพักหลังนัดเล่น | Welfare rest between litters; kind tone. |
| coat | สีขน | Coat colour (also the Journal tab "Coats"). |
| merle | เมิร์ล | Coat pattern. Never double merle. |
| Family tree | แผนผังครอบครัว |  |
| Gene Sniffer | เครื่องดมยีน | Joke gadget; keep the sniffing sound. |

**Places**

| English | th | Note |
|---|---|---|
| Home Yard | สนามหน้าบ้าน |  |
| Cozy House | บ้านแสนอุ่น |  |
| Sunny Park | สวนแดดอุ่น |  |
| Riverside | ริมแม่น้ำ |  |
| Maple Woods | ป่าเมเปิล |  |
| Seashell Beach | หาดเปลือกหอย |  |
| Market Street | ถนนตลาด |  |
| Town Square | ลานกลางเมือง |  |
| Dog Park | สวนน้องหมา |  |
| Vet Clinic | คลินิกหมอสัตว์ | Only check-ups and kind news; no sickness. |
| Grooming Salon | ร้านตัดขนน้องหมา |  |
| Pupuccino Café | คาเฟ่พัพปุชิโน่ | Pun on puppuccino. TODO(native) zh. |
| Doggy Donut | โดนัทน้องหมา |  |
| Kibble Corner | มุมอาหารเม็ด | Shop. |
| Bow-Wow Boutique | บูติกโฮ่งโฮ่ง | Shop (clothes). |
| Barkitecture | ช่างโฮ่ง | Builder shop; pun bark + architecture: ja ワン築 (建築), ko 멍축 (건축). TODO(native) th. |
| Pip's Sprout Cart | รถเข็นต้นกล้าของพิพ | Seed shop. |
| Shelter | บ้านพักน้องหมา | Warm words only. zh-Hant 動物之家 is the Taiwan word for public shelters. |
| Shelter Playroom | ห้องเล่นบ้านพักน้องหมา |  |
| Lighthouse Pier | ท่าเรือประภาคาร | Walk spot. |
| Hilltop Meadow | ทุ่งหญ้าบนเนิน | Walk spot. |
| Town Loop | เส้นทางรอบเมือง | Walk route. |
| Hilltop Trail | ทางเดินบนเนิน | Walk route. |
| Pier Boardwalk | ทางเดินริมท่าเรือ | Walk route. |

**Characters**

| English | th | Note |
|---|---|---|
| Gerald (the duck) | เจอรัลด์ | The guide duck who knows everything. |
| Mrs. Plum | คุณป้าพลัม | The neighbour with the Pumpkin Patch Pop-up. |
| Pip (the farmer) | พิพ |  |
| Dr. Paws | หมออุ้งเท้า | The vet; translate the pun (paws). |

**Garden and kitchen**

| English | th | Note |
|---|---|---|
| garden | แปลงผัก | Also "veggie patch". |
| seeds | เมล็ด |  |
| water (plants) | รดน้ำ |  |
| harvest | เก็บเกี่ยว |  |
| kitchen | ห้องครัว |  |
| cook | ทำอาหาร | Only dog-safe food. |
| recipe | สูตรอาหาร |  |
| Pantry | ตู้กับข้าว |  |

**Seasons and festivals**

| English | th | Note |
|---|---|---|
| spring | ฤดูใบไม้ผลิ |  |
| summer | ฤดูร้อน |  |
| autumn | ฤดูใบไม้ร่วง |  |
| winter | ฤดูหนาว |  |
| weather | อากาศ |  |
| rain | ฝน |  |
| snow | หิมะ |  |
| festival | เทศกาล |  |
| leaf piles | กองใบไม้ |  |
| Harvest Stall | ซุ้มเก็บเกี่ยว |  |
| Costume Parade | ขบวนพาเหรดแต่งตัว |  |
| Halloween | ฮาโลวีน | Cute, never scary. |
| Pumpkin Patch Pop-up | ป๊อปอัปไร่ฟักทอง |  |
| Snow Days | วันหิมะตก |  |
| Winter Lights | ไฟฤดูหนาว |  |
| Winter Stall | ซุ้มฤดูหนาว |  |
| Ugly Sweater Contest | ประกวดเสื้อกันหนาวสุดเชย | The ugliness is the joke: ugly-cute. |
| New Year | ปีใหม่ | 1 January (Japanese New Year), not the lunar New Year: zh never 春节, ko never 설날. |
| New Year card (nengajō) | การ์ดอวยพรปีใหม่ | Japanese New Year postcard. |
| Fortune box (omikuji) | เซียมซี | Only happy fortunes. th: เซียมซี (fortune sticks) is the familiar word. |
| kadomatsu (pine) | คาโดมัตสึ | New Year pine decoration. |
| mochi | โมจิ | Food item. The dog Mochi keeps its own name. |

**Japan and Tokyo**

| English | th | Note |
|---|---|---|
| Japan-style | สไตล์ญี่ปุ่น | The safe word. Never "made in Japan". |
| Mt. Fuji | ภูเขาไฟฟูจิ |  |
| Mt. Fuji Lookout | จุดชมวิวฟูจิ | Code name fujihill. |
| Station | สถานี | The Station pin on the town map. |
| Shinkansen | ชินคันเซ็น |  |
| Japan map | แผนที่ญี่ปุ่น |  |
| Tokyo | โตเกียว |  |
| Shibuya Crossing | ทางข้ามชิบุยะ |  |
| Hachikō | ฮาจิโกะ | The loyal Akita at Shibuya Station. |
| Yoyogi Park Dog Run | ลานวิ่งน้องหมาสวนโยโยงิ |  |
| Asakusa and Sensō-ji | อาซากุสะและวัดเซ็นโซจิ |  |
| Tokyo Tower | โตเกียวทาวเวอร์ |  |
| Ueno Park | สวนอุเอโนะ |  |
| Odaiba Seaside | ริมทะเลโอไดบะ |  |
| stamp | ตราประทับ |  |
| stamp book | สมุดสะสมตราประทับ | Seven Tokyo stamps. |

**Dog Cards, photos, pack**

| English | th | Note |
|---|---|---|
| Dog Cards | การ์ดน้องหมา | Opt-in public cards; no free text. |
| visiting dog | น้องหมาที่มาเยี่ยม |  |
| paw (on a card) | อุ้งเท้า | The one "like" per card per Japan day. |
| Photo mode | โหมดถ่ายรูป |  |
| postcard | โปสการ์ด |  |
| All Together (pack play) | ไปด้วยกันทั้งแก๊ง | v2.9 pack play and walks. |
| Missions | ภารกิจ | Journal tab. |
| Daily missions | ภารกิจประจำวัน |  |
| treasure | สมบัติ |  |
| letter | จดหมาย |  |
| Mailbox | ตู้จดหมาย |  |

**Journal tabs and settings**

| English | th | Note |
|---|---|---|
| Profile | โปรไฟล์ | Journal tab. |
| Family | ครอบครัว | Journal tab. |
| How to play | วิธีเล่น | Journal tab. |
| Settings | การตั้งค่า |  |
| Sound | เสียง |  |
| Music | เพลง |  |
| Sound effects | เสียงเอฟเฟกต์ |  |
| Ambience | เสียงบรรยากาศ |  |
| Mute all | ปิดเสียงทั้งหมด |  |
| Motion and wobble | การเคลื่อนไหวและการโยก | Reduced-motion setting. |
| Language | ภาษา | Show each language by its own name: 日本語, 简体中文, 繁體中文, 한국어, ไทย. |
| Reset save | ลบข้อมูลเซฟ |  |
| save | บันทึก |  |
| Cloud save | เซฟบนคลาวด์ | Off on claude.ai. |
| Log in | เข้าสู่ระบบ |  |
| Sign up | สมัคร |  |
| Forgot your password? | ลืมรหัสผ่าน? |  |
| Title screen | หน้าแรก |  |
| Back | กลับ | Button. |
| Close | ปิด | Button. |
| OK | ตกลง | Button. |
| Yes | ใช่ | Button. |
| No | ไม่ | Button; zh 不了 is a soft "no thanks". |

## 10. Bans (machine check)

Thai has no word boundaries, so `\b` can't be used. The sell patterns require ขาย / ซื้อ directly before a dog word (ขายลูกหมา) or a sale phrase directly after it, which leaves ขายเสื้อน้องหมา (selling dog clothes) alone. The `allow` phrases are legitimate sentences that must never be hit.

| Rule | Pattern (JS RegExp source, flag `u`) |
|---|---|
| "breed" as a verb (สายพันธุ์ = breed, the noun, and พันทาง = mixed breed are fine) | <code>ผสมพันธุ์\|เพาะพันธุ์\|ขยายพันธุ์\|ทำพันธุ์\|ฟาร์มหมา\|ฟาร์มสุนัข</code> |
| stud (and breeding dam) | <code>พ่อพันธุ์\|แม่พันธุ์</code> |
| litter price | <code>ราคาลูก(?:หมา\|สุนัข)\|(?:ลูกหมา\|น้องหมา\|หมา\|ลูกสุนัข\|สุนัข)(?:ตัว(?:นี้\|ละ\|เล็ก)?)?\s?(?:ราคา\|ตัวละ)\s?[0-9]</code> |
| selling (or buying) dogs; shops selling items is fine | <code>(?:ขาย\|ซื้อ)(?:ต่อ)?\s?(?:ลูกหมา\|น้องหมา\|หมา\|ลูกสุนัข\|สุนัข)\|(?:ลูกหมา\|น้องหมา\|หมา\|ลูกสุนัข\|สุนัข)[^\s]{0,6}(?:ถูกขาย\|ขายแล้ว\|ขายได้\|ที่ขาย\|สำหรับขาย\|ขายไป)</code> |
| franchise name | <code>นินเทนโด\|นินเท็นโด\|โปเกมอน\|โปเกม่อน\|แอนิมอล\s?ครอสซิ่?ง\|อนิมอล\s?ครอสซิ่?ง</code> |
| "made in Japan"; say สไตล์ญี่ปุ่น (Japan-style) | <code>ผลิตในญี่ปุ่น\|ผลิตจากญี่ปุ่น\|ทำในญี่ปุ่น\|สร้างในญี่ปุ่น\|เมดอิน\s?เจแปน\|เมดอิน\s?แจแปน\|เกม(?:จาก)?ญี่ปุ่น</code> |
| franchise name (Latin spelling) | <code>nintendo\|pok[eé]mon\|animal crossing</code> |
| "made in Japan" (Latin spelling); say Japan-style | <code>made in japan\|japanese-made</code> |

Caught on purpose (test sentences): 「ผสมพันธุ์น้องหมา」 「เพาะพันธุ์」 「พ่อพันธุ์」 「ราคาลูกหมา」 「ลูกหมาตัวละ 500 บาท」 「ขายลูกหมา」 「ขาย น้องหมา」 「ซื้อหมา」 「ลูกหมาถูกขาย」 「โปเกมอน」 「นินเทนโด」 「แอนิมอลครอสซิ่ง」 「ผลิตในญี่ปุ่น」 「เกมญี่ปุ่น」 「Pokemon」

Never hit (the `allow` list, also used as negative tests): 「สายพันธุ์」 「พันทาง」 「สไตล์ญี่ปุ่น」 「ร้านนี้ขายเสื้อน้องหมาน่ารัก」 「ซื้อขนมให้น้องหมา」 「ลูกหมาไปอยู่กับครอบครัวใหม่ฟรี」 「ชิบะอินุเป็นสุนัขพันธุ์ญี่ปุ่น」 「ขายอาหารเม็ดและของเล่น」 「บ้านพักน้องหมา」 「เรารักน้องหมา」 「ร้านขายของเล่นสำหรับน้องหมา」

## 11. TODO(native)

- เรา for dogs and Gerald: natural, or would หนู fit some small breeds better?
- ช่างโฮ่ง (Barkitecture), คัพเค้กหมาน้อย (Pupcake), คาเฟ่พัพปุชิโน่: check the puns.
- ๆ spacing and the sentence-space rule in long lines on the phone.
