# Korean (ko) style guide and glossary

Doodle Doggo v2.14 "Hello in Every Language". Source language: English. Data file: `game/i18n/glossary/ko.json`. The tables below match the JSON; change both together. Anything marked TODO(native) needs a native speaker's check.

## 1. Tone

- Cozy, kind, simple, playful. Nothing bad ever happens: no 아프다, 죽다, 잃어버리다, no scolding.
- The joke is the crude crayon dogs. Korean has the right words: 못난이 (lovable ugly one) and 못생겨서 귀여운 (so ugly it's cute). The dogs are proud of their wobbly drawing; deadpan works well in Korean (짤 humour).
- Adapt jokes. Korean dog sounds make good puns: 멍 (woof) → 멍케이크 (Pupcake), 멍축 사무소 (Barkitecture, from 건축). 댕댕이 is affectionate slang for dogs; fine in dog lines and letters, not in UI labels.
- Readers include children: everyday words, short sentences, Hangul only (no Hanja). Prefer native words over Sino-Korean when both exist (쓰다듬기, 낮잠, 텃밭).

## 2. Register and address

**Choice: 해요체 for UI and narration; 반말 for the dogs.**

| Who speaks | Register | Example |
|---|---|---|
| UI, system lines, lessons, letters | 해요체 (polite, friendly) | 「밥을 줬어요.」「저장했어요.」「먹이를 골라 주세요.」 |
| Dogs | 반말, the breed's personality | 시바견: 「소파는 이제 내 거야. 내가 정했어.」 골든 리트리버: 「소파! 러그! 램프! 우리 집 너무 좋아!」 |
| Gerald the duck | 반말, a friendly know-it-all | 「난 제럴드야. 강가에 살고, 모르는 게 없지. 내가 구경시켜 줄게.」 |
| Mrs. Plum, families, Dr. Paws | 해요체, warm | 「호박밭 팝업 가게를 열었어요. 놀러 오세요!」 |

Why: 해요체 is the friendly polite style of Korean games for all ages; 합니다체 feels like a bank. Dogs speaking 반말 to their person is cute and expected.

- Address: avoid 당신 (cold or even rude). Drop the subject, or use the dog's name: 「모찌가 기뻐해요.」 In dog lines the player is 너 only when needed.
- Buttons: noun or noun + 하기 form, no 요: 밥 주기, 산책, 놀기, 입양하기, 뒤로, 닫기, 확인. Confirm buttons: 네 / 아니요.
- Names + particles: the particle depends on the final consonant (모찌가 / 쿠마가 vs 구름이 / 땅콩이). Messages with `{name}` must not hard-code 이/가, 을/를, 은/는, 와/과. Use a `select` on a name flag later, or write lines that avoid the particle (「{name}, 신났어요!」). Flag for the SPEC lane.

## 3. UI conventions

- Spacing: Korean uses spaces between words (띄어쓰기). Follow standard spacing; counters attach to numbers: 100코인, 3마리, 2일.
- Punctuation: half-width . , ! ? ; quotes “ ” (inner ‘ ’). Ellipsis … ; tilde ~ is cute in dog lines (「좋아~」), not in UI.
- Numbers: Arabic digits, comma for thousands (1,000코인). Counters: dogs 마리 (아기 강아지 3마리), items 개, days 일.
- Dates: 10월 18일 (토). Times: 오후 3:30 or 15:30.
- One ! at most; !! only for a dog shouting (허스키: 「아우우우!」).
- Plurals: Korean has no required plural; ICU `plural` needs only `other`: `{n, plural, other {아기 강아지 #마리}}`. Don't add 들 to every plural.
- Length: Korean is a bit shorter than English in characters; buttons up to about 5 syllables on the phone, toasts one line of about 16 syllables.

## 4. The owner's word rules in Korean

| Never say | Why | Say instead |
|---|---|---|
| 번식, 교배, 브리딩, 브리더, 짝짓기 | "breed" as a verb | 놀이 데이트 (puppy playdate), 아기 강아지가 태어났어요 |
| 종견, 씨수캐, 종모견 | "stud" | the dog's name, 친구 강아지 |
| 분양, 분양가, 책임비, 강아지 가격 | "litter price" | (no prices; puppies are free). Note: 분양 is the Korean pet-trade word and usually means a sale, so it is banned entirely |
| 강아지를 팔다, 판매 중인 강아지, 강아지를 사다 | selling (or buying) dogs | 새 가족에게 무료로 입양 보내기, 입양하다 |
| 일본산, 일본제, 일본에서 만든 게임, 일본 게임 | "made in Japan" | 일본풍 (Japan-style) |
| 닌텐도, 포켓몬, 동물의 숲, 동숲 … | franchise names | — |

- **Never 새끼 for puppies.** It is the normal biological word but also a common insult. Use 아기 강아지 (or 강아지 alone).
- 견종 / 품종 (breed, the noun) are fine. 순종견 and 토종견 are fine (the stud ban skips them).
- Shops selling items is fine: 「겨울 가판대에서 강아지 스웨터를 팔아요.」 Keep 팔다 away from a bare dog word.
- 개 alone sounds blunt; use 강아지 for any dog (Korean uses it for adult dogs too, affectionately). 개 stays in compounds (개집, 믹스견 …) and 개인기 (trick) is fine.

## 5. Japanese words and places

Korean standard transcription of Japanese (국립국어원 rules), with a short Korean gloss the first time:

오미쿠지 (Fortune box; first time 「오미쿠지(운세 뽑기)」), 연하장 (nengajō; Korean has the same custom and word), 가도마쓰 (kadomatsu), 새해 (1 January; never 설날, which is the lunar New Year), 떡 (mochi as food; the dog Mochi is 모찌), 하치코 (Hachikō; 충견 하치코), 신칸센, 후지산, 시부야 스크램블 교차로, 요요기 공원, 아사쿠사와 센소지, 도쿄 타워, 우에노 공원, 오다이바.

- Facts stay true and are not extended.
- Japanese-origin dog breeds use 견 (시바견, 아키타견), which is common Korean usage.

## 6. Care lessons (blocks)

Exactly **two sentences**, 해요체. Example (English: "Both carry merle. Two merles can have puppies with eye and ear trouble, so these two stay friends."):

「둘 다 멀 털색 유전자가 있어요. 멀끼리 만나면 아기 강아지의 눈과 귀가 아플 수 있어서, 이 둘은 친구로 지내요.」

## 7. Starter dog names

Mostly transliterated, as Korean pet names usually are loanwords (비스킷, 베이글). Where a Korean food word is cuter and the joke lands better, use it: 땅콩 (Peanut), 만두 (Dumpling), 복숭아 (Peaches), 구름 (Cloud). Bao is 바오 (as in the famous panda 푸바오).

| Breed | English name | ko |
|---|---|---|
| `shiba` | Mochi | 모찌 |
| `corgi` | Biscuit | 비스킷 |
| `golden` | Sunny | 써니 |
| `dachs` | Noodle | 누들 |
| `husky` | Frost | 프로스트 |
| `mutt` | Pepper | 페퍼 |
| `chihuahua` | Peanut | 땅콩 |
| `pug` | Dumpling | 만두 |
| `greyhound` | Rocket | 로켓 |
| `beagle` | Bagel | 베이글 |
| `poodle` | Pretzel | 프레첼 |
| `collie` | Scout | 스카우트 |
| `samoyed` | Cloud | 구름 |
| `frenchie` | Brioche | 브리오슈 |
| `akita` | Kuma | 쿠마 |
| `spitz` | Daifuku | 다이후쿠 |
| `pom` | Mikan | 미캉 |
| `afghan` | Saffron | 사프란 |
| `dane` | Waffle | 와플 |
| `mastiff` | Crumpet | 크럼펫 |
| `gsd` | Strudel | 슈트루델 |
| `dobie` | Espresso | 에스프레소 |
| `corso` | Cannoli | 카놀리 |
| `pitbull` | Peaches | 복숭아 |
| `minpin` | Jellybean | 젤리빈 |
| `lab` | Butter | 버터 |
| `malamute` | Maple | 메이플 |
| `chow` | Bao | 바오 |
| `stdpoodle` | Madeleine | 마들렌 |
| `schnauzer` | Muesli | 뮤즐리 |
| `westie` | Shortbread | 쇼트브레드 |
| `yorkie` | Toffee | 토피 |
| `bichon` | Meringue | 머랭 |
| `maltese` | Marshmallow | 마시멜로 |
| `shihtzu` | Wonton | 완탕 |

## 8. Breed names

From `mods/genes.js` BREEDS (35 keys), Korean common usage (말티즈 rather than the dictionary 몰티즈, 시추, 핏불).

| Key | English | ko |
|---|---|---|
| `shiba` | Shiba Inu | 시바견 |
| `corgi` | Corgi | 코기 |
| `golden` | Golden Retriever | 골든 리트리버 |
| `dachs` | Dachshund | 닥스훈트 |
| `husky` | Husky | 허스키 |
| `mutt` | Shelter Mutt (mixed breed) | 믹스견 |
| `chihuahua` | Chihuahua | 치와와 |
| `pug` | Pug | 퍼그 |
| `greyhound` | Greyhound | 그레이하운드 |
| `beagle` | Beagle | 비글 |
| `poodle` | Miniature Poodle | 미니어처 푸들 |
| `collie` | Border Collie | 보더 콜리 |
| `samoyed` | Samoyed | 사모예드 |
| `frenchie` | French Bulldog | 프렌치 불도그 |
| `akita` | Akita | 아키타견 |
| `spitz` | Japanese Spitz | 재패니즈 스피츠 |
| `pom` | Pomeranian | 포메라니안 |
| `afghan` | Afghan Hound | 아프간 하운드 |
| `dane` | Great Dane | 그레이트 데인 |
| `mastiff` | English Mastiff | 잉글리시 마스티프 |
| `gsd` | German Shepherd | 저먼 셰퍼드 |
| `dobie` | Dobermann | 도베르만 |
| `corso` | Cane Corso | 카네 코르소 |
| `pitbull` | Pit Bull | 핏불 |
| `minpin` | Miniature Pinscher | 미니어처 핀셔 |
| `lab` | Labrador Retriever | 래브라도 리트리버 |
| `malamute` | Alaskan Malamute | 알래스칸 맬러뮤트 |
| `chow` | Chow Chow | 차우차우 |
| `stdpoodle` | Standard Poodle | 스탠더드 푸들 |
| `schnauzer` | Miniature Schnauzer | 미니어처 슈나우저 |
| `westie` | West Highland White Terrier | 웨스트 하이랜드 화이트 테리어 |
| `yorkie` | Yorkshire Terrier | 요크셔테리어 |
| `bichon` | Bichon Frise | 비숑 프리제 |
| `maltese` | Maltese | 말티즈 |
| `shihtzu` | Shih Tzu | 시추 |

## 9. Glossary

**Core words**

| English | ko | Note |
|---|---|---|
| Doodle Doggo | Doodle Doggo | Brand name: always Latin letters, never translated. |
| dog | 강아지 | The friendly everyday word. ja also ワンちゃん in dialogue; ko 개 only in compounds; th avoid bare หมา in UI. |
| puppy | 아기 강아지 | ko: never 새끼 (also a rude word). |
| adopt | 입양하다 | Adopting a dog into your home. |
| adopt out free to families | 새 가족에게 무료로 입양 보내기 | The safe phrase for puppies leaving. Never a sale. |
| new family | 새 가족 |  |
| Adopt me board | 입양 게시판 | Shelter board of dogs looking for a home. |
| bond | 친밀도 | The stat that unlocks places. ja: 絆 (きずな). |
| coins | 코인 | Counter style: ja 100コイン, zh 100金币, ko 100코인, th 100 เหรียญ. |
| Sparkle | 반짝이 | Cosmetic coat sparkle, never paid. |
| Hunger | 포만감 | A stat bar. Phrase it as fullness, never as suffering. |
| Energy | 기운 | Naps refill it. |
| Happiness | 행복 |  |
| level | 레벨 |  |
| crayon | 크레용 | The art joke: crude crayon dogs. |
| sketchbook | 스케치북 |  |

**Main buttons and care**

| English | ko | Note |
|---|---|---|
| Feed | 밥 주기 | Bar button. |
| Play | 놀기 | Bar button. |
| Care | 돌보기 | Bar button (bath, nap, brush). |
| Walk | 산책 | Bar button; walks are the main income. |
| Wardrobe | 옷장 | Bar button. |
| Journal | 일기장 | Bar button (short form of Treasure Journal). |
| Treasure Journal | 보물 일기장 | Modal title. |
| Map | 지도 | Bar button. |
| pet (verb) | 쓰다듬기 | Rubbing the dog. |
| bath | 목욕 |  |
| nap | 낮잠 |  |
| potty | 배변 | Keep it light and clean. |
| brush | 빗질 |  |
| train | 훈련 |  |
| trick | 개인기 | ja 芸 (げい) is the real word for dog tricks. |
| Sit | 앉아 | Trick name. |
| Shake | 손 | Trick name (paw shake). |
| Spin | 빙글빙글 | Trick name. |
| Roll over | 데굴데굴 | Trick name. |
| ball play | 공놀이 | Replaced the old Fetch challenge. |
| treat | 간식 |  |
| kibble | 사료 |  |
| Pupcake | 멍케이크 | Dog-safe cupcake. Pun: pup + cupcake. TODO(native) th. |
| food | 음식 | Journal tab "Food". |
| toys | 장난감 |  |
| clothes | 옷 |  |
| outfit | 코디 |  |
| collar | 목걸이 |  |
| bandana | 반다나 |  |
| leash | 리드줄 |  |
| bed | 침대 |  |
| doghouse | 개집 |  |
| decorate | 꾸미기 | Home decorating mode. |

**Puppies and genetics**

| English | ko | Note |
|---|---|---|
| playdate | 놀이 데이트 | THE safe word for two dogs meeting (puppy playdate). Short zh button form: 约玩 / 約玩. |
| Playdate Board | 놀이 데이트 게시판 | At the Dog Park. |
| puppies | 아기 강아지들 | Use for "litter" in player-facing text. |
| Pick of the litter | 한 마리 골라요 | Card title: the family lets you choose one pup, free. |
| healthy pup | 건강한 아기 강아지 |  |
| resting after a playdate | 놀이 데이트 후 쉬는 중 | Welfare rest between litters; kind tone. |
| coat | 털색 | Coat colour (also the Journal tab "Coats"). |
| merle | 멀 | Coat pattern. Never double merle. |
| Family tree | 가계도 |  |
| Gene Sniffer | 유전자 킁킁이 | Joke gadget; keep the sniffing sound. |

**Places**

| English | ko | Note |
|---|---|---|
| Home Yard | 우리 집 마당 |  |
| Cozy House | 아늑한 집 |  |
| Sunny Park | 햇살 공원 |  |
| Riverside | 강가 |  |
| Maple Woods | 단풍 숲 |  |
| Seashell Beach | 조개 해변 |  |
| Market Street | 시장 거리 |  |
| Town Square | 마을 광장 |  |
| Dog Park | 강아지 공원 |  |
| Vet Clinic | 동물병원 | Only check-ups and kind news; no sickness. |
| Grooming Salon | 애견 미용실 |  |
| Pupuccino Café | 퍼푸치노 카페 | Pun on puppuccino. TODO(native) zh. |
| Doggy Donut | 멍멍 도넛 |  |
| Kibble Corner | 사료 코너 | Shop. |
| Bow-Wow Boutique | 멍멍 부티크 | Shop (clothes). |
| Barkitecture | 멍축 사무소 | Builder shop; pun bark + architecture: ja ワン築 (建築), ko 멍축 (건축). TODO(native) th. |
| Pip's Sprout Cart | 핍의 새싹 수레 | Seed shop. |
| Shelter | 보호소 | Warm words only. zh-Hant 動物之家 is the Taiwan word for public shelters. |
| Shelter Playroom | 보호소 놀이방 |  |
| Lighthouse Pier | 등대 부두 | Walk spot. |
| Hilltop Meadow | 언덕 위 풀밭 | Walk spot. |
| Town Loop | 마을 한 바퀴 | Walk route. |
| Hilltop Trail | 언덕 오솔길 | Walk route. |
| Pier Boardwalk | 부두 산책로 | Walk route. |

**Characters**

| English | ko | Note |
|---|---|---|
| Gerald (the duck) | 제럴드 | The guide duck who knows everything. |
| Mrs. Plum | 플럼 아주머니 | The neighbour with the Pumpkin Patch Pop-up. |
| Pip (the farmer) | 핍 |  |
| Dr. Paws | 발바닥 선생님 | The vet; translate the pun (paws). |

**Garden and kitchen**

| English | ko | Note |
|---|---|---|
| garden | 텃밭 | Also "veggie patch". |
| seeds | 씨앗 |  |
| water (plants) | 물 주기 |  |
| harvest | 수확 |  |
| kitchen | 부엌 |  |
| cook | 요리하기 | Only dog-safe food. |
| recipe | 레시피 |  |
| Pantry | 팬트리 |  |

**Seasons and festivals**

| English | ko | Note |
|---|---|---|
| spring | 봄 |  |
| summer | 여름 |  |
| autumn | 가을 |  |
| winter | 겨울 |  |
| weather | 날씨 |  |
| rain | 비 |  |
| snow | 눈 |  |
| festival | 축제 |  |
| leaf piles | 낙엽 더미 |  |
| Harvest Stall | 수확 가판대 |  |
| Costume Parade | 코스튬 퍼레이드 |  |
| Halloween | 핼러윈 | Cute, never scary. |
| Pumpkin Patch Pop-up | 호박밭 팝업 가게 |  |
| Snow Days | 눈 오는 날 |  |
| Winter Lights | 겨울 불빛 |  |
| Winter Stall | 겨울 가판대 |  |
| Ugly Sweater Contest | 못난이 스웨터 대회 | The ugliness is the joke: ugly-cute. |
| New Year | 새해 | 1 January (Japanese New Year), not the lunar New Year: zh never 春节, ko never 설날. |
| New Year card (nengajō) | 연하장 | Japanese New Year postcard. |
| Fortune box (omikuji) | 오미쿠지 | Only happy fortunes. th: เซียมซี (fortune sticks) is the familiar word. |
| kadomatsu (pine) | 가도마쓰 | New Year pine decoration. |
| mochi | 떡 | Food item. The dog Mochi keeps its own name. |

**Japan and Tokyo**

| English | ko | Note |
|---|---|---|
| Japan-style | 일본풍 | The safe word. Never "made in Japan". |
| Mt. Fuji | 후지산 |  |
| Mt. Fuji Lookout | 후지산 전망대 | Code name fujihill. |
| Station | 역 | The Station pin on the town map. |
| Shinkansen | 신칸센 |  |
| Japan map | 일본 지도 |  |
| Tokyo | 도쿄 |  |
| Shibuya Crossing | 시부야 스크램블 교차로 |  |
| Hachikō | 하치코 | The loyal Akita at Shibuya Station. |
| Yoyogi Park Dog Run | 요요기 공원 도그런 |  |
| Asakusa and Sensō-ji | 아사쿠사와 센소지 |  |
| Tokyo Tower | 도쿄 타워 |  |
| Ueno Park | 우에노 공원 |  |
| Odaiba Seaside | 오다이바 해변 |  |
| stamp | 스탬프 |  |
| stamp book | 스탬프북 | Seven Tokyo stamps. |

**Dog Cards, photos, pack**

| English | ko | Note |
|---|---|---|
| Dog Cards | 강아지 카드 | Opt-in public cards; no free text. |
| visiting dog | 놀러 온 강아지 |  |
| paw (on a card) | 발도장 | The one "like" per card per Japan day. |
| Photo mode | 사진 모드 |  |
| postcard | 엽서 |  |
| All Together (pack play) | 다 함께 | v2.9 pack play and walks. |
| Missions | 미션 | Journal tab. |
| Daily missions | 오늘의 미션 |  |
| treasure | 보물 |  |
| letter | 편지 |  |
| Mailbox | 우편함 |  |

**Journal tabs and settings**

| English | ko | Note |
|---|---|---|
| Profile | 프로필 | Journal tab. |
| Family | 가족 | Journal tab. |
| How to play | 플레이 방법 | Journal tab. |
| Settings | 설정 |  |
| Sound | 소리 |  |
| Music | 음악 |  |
| Sound effects | 효과음 |  |
| Ambience | 환경음 |  |
| Mute all | 모두 음소거 |  |
| Motion and wobble | 움직임과 흔들림 | Reduced-motion setting. |
| Language | 언어 | Show each language by its own name: 日本語, 简体中文, 繁體中文, 한국어, ไทย. |
| Reset save | 저장 데이터 지우기 |  |
| save | 저장 |  |
| Cloud save | 클라우드 저장 | Off on claude.ai. |
| Log in | 로그인 |  |
| Sign up | 가입하기 |  |
| Forgot your password? | 비밀번호를 잊었나요? |  |
| Title screen | 타이틀 화면 |  |
| Back | 뒤로 | Button. |
| Close | 닫기 | Button. |
| OK | 확인 | Button. |
| Yes | 네 | Button. |
| No | 아니요 | Button; zh 不了 is a soft "no thanks". |

## 10. Bans (machine check)

Korean has spaces, but `\b` does not understand Hangul in JS, so patterns use look-arounds: 개 counts as "dog" only when it stands alone (not after a digit, as in 3개, and not inside 개인기 or 개집). The `allow` phrases are legitimate sentences that must never be hit.

| Rule | Pattern (JS RegExp source, flag `u`) |
|---|---|
| "breed" as a verb (견종 = breed, the noun, is fine) | <code>번식\|교배\|브리딩\|브리더\|짝짓기</code> |
| stud | <code>(?&lt;![토순])종견\|씨수캐\|종모견\|씨받이</code> |
| litter price; 분양 is the pet-trade word, say 입양 보내기 | <code>분양\|책임비\|(?:강아지\|새끼\|반려견)[^.!?\n]{0,4}(?:가격\|값)</code> |
| selling (or buying) dogs; shops selling items is fine | <code>(?:아기 ?강아지\|강아지\|반려견\|댕댕이\|멍멍이\|(?&lt;![0-9가-힣])개(?=[를을은는이가도들]\|\s\|$))(?:들)?(?:을\|를\|은\|는\|이\|가\|도)? ?(?:[0-9]+ ?마리(?:를\|을)? ?)?(?:팔\|판매\|판다\|팝니다\|사고\|사요\|산다\|구매\|구입)\|(?:팔린\|파는\|팔\|판매(?:하는\| ?중인\|된\|할)?) ?(?:[0-9]+ ?마리 ?)?(?:아기 ?강아지\|강아지\|반려견\|댕댕이\|멍멍이\|(?&lt;![0-9가-힣])개(?=[를을은는이가도들]\|\s\|$))(?! ?(?:옷\|용품\|간식\|사료\|장난감\|침대\|집\|카드\|스웨터\|목걸이))</code> |
| franchise name | <code>닌텐도\|닌텐독스\|포켓몬\|포켓 ?몬스터\|동물의 ?숲\|동숲</code> |
| "made in Japan"; say 일본풍 (Japan-style) | <code>일본산\|일본제\|일본 ?제조\|메이드 ?인 ?재팬\|일본에서 만(?:든\|들어\|들었)\|일본 게임</code> |
| franchise name (Latin spelling) | <code>nintendo\|pok[eé]mon\|animal crossing</code> |
| "made in Japan" (Latin spelling); say Japan-style | <code>made in japan\|japanese-made</code> |

Caught on purpose (test sentences): 「강아지를 번식시켜요」 「교배」 「종견을 찾아요」 「분양가」 「강아지 가격이 얼마예요?」 「강아지를 팔아요」 「강아지 3마리를 팔았어요」 「판매 중인 강아지」 「파는 강아지」 「개를 팔다」 「강아지를 사요」 「포켓몬」 「동물의 숲」 「일본산 게임」 「일본에서 만든 게임」 「Nintendo」

Never hit (the `allow` list, also used as negative tests): 「견종」 「품종」 「일본풍」 「입양 보내기」 「아기 강아지들은 새 가족에게 무료로 입양 보내요.」 「겨울 가판대에서 강아지 스웨터를 팔아요.」 「강아지 간식을 샀어요.」 「사료 코너에서 사료를 3개 팔아요.」 「개인기를 배웠어요!」 「시바견은 일본 토종견이에요.」 「개집을 꾸며요.」 「강아지를 사랑해요.」 「개를 사랑해!」 「순종견도 믹스견도 다 좋아요.」

## 11. TODO(native)

- Particles after `{name}` (이/가, 을/를): needs a message-format solution; see section 2.
- 놀이 데이트 for "playdate": natural for kids?
- 멍축 사무소, 멍케이크, 퍼푸치노 카페: check the puns.
- 친밀도 vs 유대감 for "Bond".

## Site

`site/i18n/ko.json` (v2.14 phase 1b, 714 keys). No particle follows a placeholder (no `josa` needed): lines are phrased as `{breed} {name}`, `{name}의 …`, `{mail} 앞으로`.
- "wobbly" is 삐뚤빼뚤. Dog names follow section 7 (모찌, 땅콩, 만두, 구름, 복숭아 …). `footer.home` is 홈으로 (a bare 홈 failed the 44 px tap test).
- Westie quote avoids 얬 (not in Jua): 「오늘 아침엔 새하얀 강아지였어.」
- TODO(native): Kai Ken as 카이견 (soon.line); Japanese Chin as 재패니즈 친.
- TODO(native): dog trait lines and quotes (반말), e.g. 깐깐함 (judgy), 공놀이 광, 수달 꼬리, 머리 묶음 (top-knot).
- TODO(native): love items (연어 파테, 봉제 뼈다귀, 퍼즐 급식기, 삑삑 오리) must match the game's item names once game/i18n/ko.json exists.
- TODO(native): “이 카드 숨기기” (privacy.cards.off) must match the game's "Hide this card" button.
- TODO(native): privacy page register and the English-prevails sentence in privacy.updated.

## Game

`game/i18n/ko.json` (v2.14 phase 2). Particles after vars use `{name, josa, 이/가}` (the var plus the particle; never write `{name}` before it). Mix names: 41 well-known real mixes are in Korean (래브라두들, 말티푸, 폼스키 …); the puns stay English so the game shows `{a} × {b}`.

TODO(native):
- data.ny_fortunes.* / data.tk_fortunes.*: omikuji levels as 대길 / 길 / 소길. Will children know them, or is 아주 좋은 운 / 좋은 운 / 작은 운 better?
- newyear.plum_title: 오토시다마(세뱃돈). Is the gloss in brackets natural?
- newyear.pup_0: 시메카자리 장식 (shimekazari). Should it be glossed as 새해 장식?
- data.dc_words_a.* + data.dc_words_b.*: card names "{a} {b}" (e.g. 꼼지락 솜방울, 멋쟁이 양말). Check that the mixed adjective and mimetic forms read well together.
- data.jr_grand.3: The Everything Dog as 종합선물세트 강아지. Is the pun OK?
- tokyo.lantern / photo.say_cheese: "Say cheese" as 김치!
- data.toys.trick_or_treat_bucket.n: 핼러윈 간식통 (not a literal "trick or treat" bucket); mod.toys.trick_or_treat_* use 장난칠까 간식 줄래?
- data.toys.snuffle_mat.n: 노즈워크 매트 (the usual Korean pet-shop word) vs 스너플 매트
- data.toys.frisbee.n: 원반 (avoids the trademark 프리스비)
- data.tricks.play_dead.n / data.tcmd.play_dead: 빵야 / 빵! (the Korean "bang" trick)
- data.tcmd.signature: 쇼타임! and data.tricks.signature.n 주특기
- pupplay.walk_expecting / pupplay.fetch_nursing male branches: wording for a male dog in these lines is odd in English too
- mod.toys.bond_moment: 찐친 모먼트! (slang, check for kids)
- data.wx_lines.shiba.warm: "Snow is beneath me" pun as 눈 따위 내 발밑이야. Does it read well?
- data.wx_lines.malamute.snow: "Now we are talking! Mostly me!" as 이제 좀 얘기가 되네! 떠드는 건 주로 나지만!
- data.wx_lines.westie.dawn: "The garden is out there" read as the Home Yard (마당), not the veggie patch.
- yard.flips_upside_down_legs_in: "roaching" as 바퀴벌레 자세. Is there a better known Korean word?
- yard.a_shell_with_a_smaller: "Shell-ception" as 조개셉션 (Inception pun).
- yard.the_crowd_you_goes_wild: 관중(나)이 열광해! (the player speaking to the dog in 반말).
- data.hm_decor.garden_bench.n / data.hm_decor.bird_bath.story / missions.ready_space: English "garden" here is the Home Yard, so 마당.
- mod.toys.bond_moment: 찐친 모먼트! is slang, and Bond is 친밀도 elsewhere. OK for children?
- journal.title_master_breeder: "Master Breeder" as 털색 마스터 (브리더 is banned). journal.title_great_granddog: 고손주 강아지.
- Meters: the four care meters and the Sparkle Meter are 게이지 (반짝이 게이지); the Nose-o-meter is 킁킁미터.
- adopt.the_shelter_calls_html / shelter.name_lead_html: "…부르는 이름은 <b>{name, josa, 이에요/예요}</b>." (there is no 이라고/라고 josa pair).
- Family and people names are transliterated (애버내시 가족, 응우옌네 아이들, 린드크비스트 아주머니, 빵집 베아 아주머니, 복슬 선장 for Captain Fluff). Check that they sound natural.
- Mix names: only 41 well-known real mixes are in Korean (data.mix_list). Check the spellings (말티숑, 시숑, 푸숑, 퍼가푸, 셰프스키, 허스키타, 골다도르).
