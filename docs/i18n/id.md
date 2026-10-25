# Doodle Doggo: Indonesian (id) style guide

Language code `id`. Standard, friendly Bahasa Indonesia (not slang, not regional). Data: `game/i18n/glossary/id.json` (breeds, terms, bans). Anything marked `TODO(native)` needs a native speaker's check.

## 1. Tone

- Cozy, kind, simple, playful. Short sentences a child can read. Light, warm casual words are welcome ("yuk", "deh", "nih", "lucu", "gemas"), but no Jakarta slang (no "gue / lo", "banget" only now and then).
- The crude crayon dogs are the joke. Each dog speaks in its breed's personality. Translate the joke, not the words; when a pun dies, write an Indonesian one.
  - EN "Haircut optional. Dignity not." → "Potong rambut boleh dilewati. Harga diri jangan."
  - EN "I am also bread-shaped. We are allies." → "Aku juga berbentuk roti. Kita sekutu."
- Nothing bad ever happens. Soft words for everything.
- Barks and sounds: "Guk guk!", "Auuu!" (Husky), "zzz", "grrr" (playful).

## 2. Register and address: **kamu**

We use **kamu** everywhere (and "-mu": "anjingmu"), including menus, account screens and the privacy page.
- Why: "Anda" is the formal, corporate "you" of banks and government forms; next to talking crayon dogs it feels cold. "kamu" is the standard friendly "you" in games and apps for young players, and it is still correct Indonesian (unlike "lo"). One register everywhere keeps screens consistent.
- Dogs speak of themselves as "aku". Gerald and Mrs. Plum also use "aku" with you; Mrs. Plum may call you "Nak" in her letters as a warm touch.
- Imperatives: the base verb, softened with "yuk" or "-lah" when it sounds bossy: "Beri makan Luna", "Yuk, jalan-jalan!".

## 3. Gender

Indonesian is mostly gender-neutral: "dia" is he and she, and adjectives don't change. Nothing to do for the player.
- Dogs: use the name or "dia". Where the game shows Boy / Girl, use "Jantan / Betina" (the normal words for animals).
- Family words: "Ibu" and "Ayah" for the puppy's mum and dad; "anak anjing" for puppies ("anak-anak anjing" or "para anak anjing" for plural, or just a number: "3 anak anjing").
- Characters: Gerald ("Gerald si bebek"), Mrs. Plum ("Bu Plum"), Baker Bea ("Bu Bea si Tukang Roti"), Old Mr. Reyes ("Kakek Reyes"). Pip and Dr. Paws need no gender: "Pip si Petani", "Dr. Tapak".

## 4. UI conventions

- **Quotes:** "tanda kutip dua" (“…”), ‘…’ inside.
- **Punctuation:** like English, no space before ! ? : ; One "!" at a time.
- **Capitalization:** sentence case for buttons and tabs ("Misi harian" in a sentence, "Mode foto"); names of places, shops and features capitalize every word, as Indonesian names do ("Taman Cerah", "Butik Guk-Guk", "Batu Kilau", "Misi Harian" as a screen title).
- **Plural:** Indonesian doesn't mark plural after a number: "3 koin", "5 anak anjing" (never "3 koin-koin"). Reduplication only without a number ("anjing-anjing di taman").
- **Numbers:** `Intl.NumberFormat('id')`: 1.000, 12.345, 1,5. Never hard-code separators.
- **Dates:** "18 Oktober", short "18 Okt" (month names are capitalized in Indonesian).
- **Coins:** "+5 koin", "Harganya 30 koin". "Koin Tapak" only as the currency name.
- **Buttons:** short base verbs ("Simpan", "Batal", "Beli", "Elus", "Mandikan"), not "Silakan …". Tricks are the usual Indonesian dog commands ("Duduk", "Tiarap", "Salaman").
- **Length:** Indonesian runs 10–25% longer than English (prefixes, "anak anjing" for "puppy"). Short forms for the phone care bar, tabs and buttons:

| English | Normal | Short (phone) |
|---|---|---|
| Feed | Beri makan | Makan |
| Pet | Elus | (same) |
| Bath | Mandikan | Mandi |
| Walk | Jalan-jalan | Jalan |
| Nap | Tidur siang | Tidur |
| Play with a toy | Main dengan mainan | Main |
| Daily missions | Misi Harian | Misi |
| Saved on this device | Tersimpan di perangkat ini | Tersimpan |

- **ICU plurals:** `Intl.PluralRules('id')` has only `other`. Write `{n, plural, =0 {Belum ada anak anjing} other {# anak anjing}}`; a `one` branch is never used.

## 5. The owner's word rules in Indonesian

| Banned idea | Banned Indonesian | Say instead |
|---|---|---|
| "breed" as a verb | mengawinkan, dikawinkan, kawin, membiakkan, berkembang biak, ternak, beternak, peternakan | kencan main, punya anak anjing: "Luna dan Max punya anak anjing!" |
| raising a dog | ("memelihara" is fine: it means to keep and care for a pet) | merawat, memelihara, tumbuh besar: "Rawat anak anjingmu" |
| "stud" | pejantan, pemacek, indukan | (no word needed: "Ayah", or the dog's name) |
| "litter price" | harga anak anjing, harga per ekor, harga anakan | nothing has a price: "gratis", "diadopsi gratis oleh keluarga" |
| "sell" for dogs | menjual anak anjing, anjing dijual, penjualan anjing | diadopsi, mencarikan rumah baru: "Sebuah keluarga mengadopsi Bolu" |
| "made in Japan" | buatan Jepang, dibuat di Jepang, produksi Jepang | gaya Jepang: "syal gaya Jepang" |
| franchises | Nintendo, Pokémon, Animal Crossing | (never mention) |

- "ras" / "ras anjing" (the noun) is fine. "induk" (mother) is fine ("induk anjing"); "indukan" (breeding stock) is not.
- English loanwords are banned too: breeding, breeder, stud. Indonesian pet talk often borrows them, so watch for them.
- Selling vegetables and shops are fine: "Jual Hasil Panen", "Butik menjual topi untuk anjing", "makanan anjing", "mainan anjing". The `sell` ban flags a sell word and a dog word in one sentence, except a dog word right after "untuk", "buat" or a thing word (makanan, mainan, baju, camilan, kasur, rumah, kalung, topi …). "penjual" (a seller) is not a sell word for the ban. If a shop line still trips it, split the sentence.

## 6. Japanese words

Keep the romanized words with the game's macrons; gloss once, in the same sentence:
- **Hachikō**: "patung Hachikō, anjing paling setia di Jepang". Warm, never sad.
- **Sensō-ji**: "Kuil Sensō-ji" di Asakusa.
- **Shinkansen**: "Shinkansen, kereta peluru Jepang".
- **omikuji**: "omikuji, kertas ramalan keberuntungan". Every fortune is happy.
- **nengajō**: the game says "kartu Tahun Baru"; "nengajō" only in a gloss.
- **otoshidama**: "otoshidama, amplop Tahun Baru" (like an angpao: a helpful comparison for Indonesian readers).
- **kadomatsu**, **happi**, **mochi**: keep and gloss ("hiasan pinus", "jaket happi").
- Tokyo stays "Tokyo"; Japan "Jepang"; "Gunung Fuji".

## 7. Care lessons

Two sentences, short, kind, true.
- EN "Blueberries are a safe berry for dogs. Grapes and raisins never are." → "Bluberi aman untuk anjing. Anggur dan kismis tidak pernah aman."
- EN "Plain cooked turkey, no onion or garlic. Those are poison for dogs." → "Kalkun rebus tanpa bawang merah atau bawang putih. Bawang itu racun bagi anjing."

## 8. Glossary

<!-- table:start (generated from game/i18n/glossary/id.json, edit both together) -->

### Terms (174)

| English | id | Note |
|---|---|---|
| Doodle Doggo | Doodle Doggo | The game title. Never translated. |
| dog | anjing | Boy dog / girl dog where the sentence needs it. |
| puppy | anak anjing | The game says "pup" too: same word. "puppy" is fine in casual lines. |
| breed (noun) | ras | The noun is fine everywhere. The verb is banned (see the word rules). |
| boy (dog) | jantan | The Boy / Girl chip on the dog card. "jantan / betina" is the normal pair for animals. |
| girl (dog) | betina |  |
| Mum (of a puppy) | Ibu | In the family tree and puppy card. |
| Dad (of a puppy) | Ayah |  |
| Mystery Pup | Anak Anjing Misterius | Fallback dog name for an unknown breed. |
| Shelter Mutt | Anjing Campuran Penampungan | The mixed-breed starter dog. Warm, never a put-down. TODO(native): "anjing kampung" is warmer but means a village dog. |
| sketchbook | buku sketsa | The look of the world. |
| crayon | krayon | The dogs are drawn in crayon: that is the joke. |
| Map | Peta | The town map button. |
| Home Yard | Halaman Rumah | Not the veggie garden (see Garden). |
| Cozy House | Rumah Nyaman |  |
| Sunny Park | Taman Cerah |  |
| Riverside | Tepi Sungai | Gerald lives here. |
| Maple Woods | Hutan Mapel |  |
| Seashell Beach | Pantai Kerang |  |
| Market Street | Jalan Pasar |  |
| Town Square (the Square) | Alun-alun | Festivals happen here. |
| Dog Park | Taman Anjing | Visiting dogs and the Playdate Board. |
| Vet Clinic | Klinik Hewan | Short: Veterinario / Veterinário / Véto / Tierarzt / Dokter Hewan. |
| Grooming Salon | Salon Anjing |  |
| Shelter | Penampungan | The animal shelter. Only kind words about it. TODO(native): many Indonesians just say "shelter". |
| Shelter Playroom | Ruang Bermain Penampungan |  |
| bring home (from the shelter) | bawa pulang |  |
| adopt | mengadopsi |  |
| Kibble Corner | Pojok Kibble | Food, toys and the Gene Sniffer. TODO(native): "kibble" is known to pet owners; "Pojok Pakan" is plainer. |
| Bow-Wow Boutique | Butik Guk-Guk | The clothes shop. Use the local bark. |
| Barkitecture | Gukitektur | Doghouses and furniture. A pun: keep a pun. TODO(native). |
| Harvest Stall | Kios Panen | Baker Bea, autumn. |
| Winter Stall | Kios Musim Dingin | Baker Bea, winter. |
| Pumpkin Patch Pop-up | Toko Labu Dadakan | Halloween 2026 only. |
| Gene Sniffer | Pengendus Gen | A gadget, said with a wink. |
| Gerald the duck | Gerald si bebek | The guide. Keep the name. Speaks a bit grand, always kind. |
| Mrs. Plum | Bu Plum | The kind neighbour who writes letters. |
| Baker Bea | Bu Bea si Tukang Roti | Runs the festival stalls. |
| Pip the farmer | Pip si Petani | Gave you the seeds. Gender is not stated: keep it neutral. |
| Dr. Paws | Dr. Tapak | The vet. Gender is not stated: write "Dr." and avoid gendered adjectives. |
| Old Mr. Reyes | Kakek Reyes |  |
| Feed | Beri makan | Button. Short: Comida / Comida / Manger / Futter / Makan. |
| Pet (verb) | Elus | Button. Short: Mimos / Carinho / Câlin / Kraulen / Elus. |
| Bath | Mandikan | Button. Short noun: Baño / Banho / Bain / Bad / Mandi. |
| Walk | Jalan-jalan | Walks are the main income. Noun: paseo / passeio / balade / Gassirunde / jalan-jalan. |
| Train (tricks) | Latih | Trick training is play, never strict. |
| Nap | Tidur siang |  |
| Potty | Pipis | Cute and short. Never crude. |
| Play | Main |  |
| Ball play | Main bola | Coins per return. |
| Brush | Sisir |  |
| Clean up | Bersihkan | After a potty in the yard. |
| treat | camilan |  |
| Food (tab) | Makanan |  |
| Toys | Mainan |  |
| Clothes | Baju |  |
| Houses (doghouses) | Rumah Anjing |  |
| Wardrobe | Lemari Baju |  |
| Zoomies | Zoomies | A sudden happy sprint. |
| Hunger | Kenyang | Stat bar label (the meter fills when fed, so "+10 Kenyang"; "lapar" only where a dog is hungry). |
| Happiness | Bahagia | Stat bar label. |
| Energy | Energi | Stat bar label. |
| Cleanliness | Kebersihan | Stat bar label. |
| Bond | Kedekatan | How close you and your dog are. |
| Bond level | Level kedekatan |  |
| Bond points | poin kedekatan |  |
| Paw Coins | Koin Tapak | The currency name. TODO(native). |
| coins | koin | Plain word in sentences: "+5 coins". |
| Sit | Duduk | Trick names use the real local dog commands. |
| Paw (trick) | Salaman |  |
| Spin | Putar |  |
| Speak | Gonggong |  |
| Roll Over | Guling |  |
| Play Dead | Pura-pura tidur | The game shows a comic faint. Softer words are fine. |
| Lie Down | Tiarap |  |
| Dance | Joget |  |
| Tricks | Trik | Journal tab and training. |
| Puppy Playdate | Kencan Main | Two grown-up dogs meet; puppies may follow. The kind word for the whole feature. TODO(native): "kencan" is a date; it suits the joke. |
| playdate | kencan main |  |
| Playdate Board | Papan Kencan Main | At the Dog Park. |
| Puppies on the way | Anak anjing segera datang |  |
| expecting (puppies) | menunggu anak anjing | Use this, not medical words. |
| nursery | Kamar Anak Anjing |  |
| Who stays? | Siapa yang tinggal? | Choosing which puppy stays home. |
| new home | rumah baru | "Ready for new homes today!" |
| adopted out free to a family | diadopsi gratis oleh keluarga | The only way puppies leave. Never a price. |
| family (adoptive) | keluarga | Named families who write postcards. |
| family tree | pohon keluarga |  |
| spayed / neutered | sudah steril | Vet option. Calm and plain. |
| Gene test | Tes gen | At the Vet Clinic. |
| coat | bulu | Coat colours and patterns (genetics). |
| Sparkle | Kilau | A rare cosmetic shine. Never paid for. |
| Sparkle pup | anak anjing Kilau |  |
| Sparkle Stone | Batu Kilau |  |
| Journal | Jurnal |  |
| Mailbox | Kotak Surat |  |
| letter | surat |  |
| postcard | kartu pos | Also what photo mode makes. |
| gift | hadiah |  |
| Daily missions | Misi Harian |  |
| mission | misi |  |
| stamp | stempel | Mission stamps and the Tokyo stamps are the same word. |
| Stamp book | Buku Stempel | Seven stamps in Tokyo. |
| Treasure Map | Peta Harta Karun |  |
| Map Piece | Potongan Peta |  |
| treasure | harta karun | Found on walks, never sold. |
| Garden (veggie patch) | Kebun Sayur | Not the yard. |
| Seeds | Benih |  |
| crop | hasil panen |  |
| Sell crops | Jual Hasil Panen | Selling vegetables is fine. Selling dogs never is. |
| Harvest | Panen |  |
| Kitchen | Dapur |  |
| Recipes | Resep | Dog-safe only. |
| Cook a dish | Masak hidangan |  |
| spring / summer / autumn / winter | musim semi / musim panas / musim gugur / musim dingin | The game follows the Japan calendar. |
| leaf festival | festival daun | Autumn. |
| leaf pile | tumpukan daun |  |
| Costume parade | Parade Kostum |  |
| Halloween | Halloween | Spooky-cute only, nothing scary. |
| Snow Days | Hari Bersalju |  |
| Winter Lights | Lampu Musim Dingin |  |
| Ugly Sweater Contest | Lomba Sweter Jelek |  |
| New Year | Tahun Baru |  |
| New Year card (nengajō) | kartu Tahun Baru | The game says "New Year card"; nengajō only in a gloss. |
| Fortune box | Kotak Keberuntungan | Shake it for a New Year fortune (an omikuji). |
| Decorate | Hias |  |
| furniture | perabot |  |
| dog bed | kasur |  |
| pack (your dogs) | kawanan | All your dogs together. |
| Make leader | Jadikan pemimpin | Button; avoids gendered "leader" nouns. |
| Photo mode | Mode Foto |  |
| Dog Card | Kartu Anjing | Opt-in public cards. No free text. |
| visiting dog | anjing tamu |  |
| Paw (given to a card) | tapak | One per card per Japan day. |
| Paw given today | Sudah kasih tapak hari ini |  |
| Japan | Jepang |  |
| Japan-style | gaya Jepang | The safe word. Never "made in Japan". |
| Station | Stasiun | The town pin that starts the Tokyo Trip. |
| Tokyo | Tokyo | In names: Tokyo Tower stays as listed below. |
| Tokyo Trip | Jalan-jalan ke Tokyo |  |
| Japan map | peta Jepang |  |
| Shinkansen | Shinkansen (kereta peluru) | Keep the word; gloss it once. |
| Tokyo Station | Stasiun Tokyo |  |
| Shibuya Crossing | Persimpangan Shibuya |  |
| Hachikō | Hachikō | Keep the macron. Gloss: the statue of a famously loyal dog. Told warmly. |
| Yoyogi Park Dog Run | Area Anjing Taman Yoyogi |  |
| Asakusa / Sensō-ji | Asakusa / Kuil Sensō-ji | Keep the macron. |
| Tokyo Tower | Menara Tokyo |  |
| Ueno Park | Taman Ueno |  |
| Odaiba Seaside | Pantai Odaiba |  |
| Mt. Fuji | Gunung Fuji |  |
| Mt. Fuji Lookout | Bukit Pandang Gunung Fuji |  |
| omikuji | omikuji (kertas ramalan) | Keep the word, gloss it once. Only happy fortunes. |
| otoshidama | otoshidama (amplop Tahun Baru) | Mrs. Plum gives it to the youngest dog. |
| kadomatsu | kadomatsu (hiasan pinus) | New Year pine decoration. |
| happi coat | jaket happi | Festival jacket. |
| mochi | mochi | Dog-safe version only. |
| Settings | Pengaturan |  |
| Sound | Suara |  |
| Music | Musik |  |
| Sound effects | Efek suara |  |
| Language | Bahasa | The language picker. Each language names itself: Español, Português (Brasil), Français, Deutsch, Bahasa Indonesia. |
| Log in | Masuk |  |
| Play as guest | Main sebagai tamu | Avoids gendered "invitado/convidado/invité". |
| Forgot your password? | Lupa kata sandi? |  |
| Saved on this device | Tersimpan di perangkat ini |  |
| Cloud save | Simpan di cloud |  |
| Buy | Beli |  |
| Cancel | Batal |  |
| Close | Tutup |  |
| Back | Kembali |  |
| Next | Lanjut |  |
| Not now | Nanti saja |  |
| Yes / No | Ya / Tidak |  |

### Breeds (35, `mods/genes.js` BREEDS order)

| Key | id |
|---|---|
| `shiba` | Shiba Inu |
| `corgi` | Corgi |
| `golden` | Golden Retriever |
| `dachs` | Dachshund |
| `husky` | Husky |
| `mutt` | Anjing campuran |
| `chihuahua` | Chihuahua |
| `pug` | Pug |
| `greyhound` | Greyhound |
| `beagle` | Beagle |
| `poodle` | Pudel mini |
| `collie` | Border Collie |
| `samoyed` | Samoyed |
| `frenchie` | French Bulldog |
| `akita` | Akita Inu |
| `spitz` | Spitz Jepang |
| `pom` | Pomeranian |
| `afghan` | Afghan Hound |
| `dane` | Great Dane |
| `mastiff` | English Mastiff |
| `gsd` | Gembala Jerman |
| `dobie` | Doberman |
| `corso` | Cane Corso |
| `pitbull` | Pitbull |
| `minpin` | Pinscher mini |
| `lab` | Labrador Retriever |
| `malamute` | Alaskan Malamute |
| `chow` | Chow Chow |
| `stdpoodle` | Pudel standar |
| `schnauzer` | Schnauzer mini |
| `westie` | West Highland White Terrier |
| `yorkie` | Yorkshire Terrier |
| `bichon` | Bichon Frise |
| `maltese` | Maltese |
| `shihtzu` | Shih Tzu |

<!-- table:end -->

## Site

doodledoggo.app in Indonesian (`site/i18n/id.json`, v2.14 phase 1b, 714 keys), kamu everywhere including the privacy page. "wobbly" is "mencong" throughout; the dog names stay English; the privacy page's date line says the English version counts if the two differ. The profile heading reads "Mochi si Shiba Inu" (profile.title_type "si {breed}").

- TODO(native): "mencong" for the wobbly crayon look (or "miring-miring", "goyang"); the tagline drops it to stay short: "Adopsi anak anjing krayon untuk disayang".
- TODO(native): the barks and sounds: "grok." for the Pug's and Frenchie's snort, "wusss!" (Greyhound), "yaah." (aww), "Guk!" for the Pomeranian's yip.
- TODO(native): "Kenali anjingnya" (nav chip) next to "Kenalan dengan anjing" (titles); "pupcake", "kibble" and "pate salmon" kept as loanwords in the loves lists.
- TODO(native): "{name} versi anak anjing" for "a Mochi puppy"; "Stroller dan troli"; "Di kuil Shinto dan kuil Buddha" for shrines and temples.
- TODO(native): puns: "Rumahku, istana saljuku" (Home, sweet snowy home), "Kuncir naik. Badan rebahan." (Shih Tzu), "Potong rambut boleh dilewati. Harga diri jangan." (Poodle).

## Game

The game table (`game/i18n/id.json`, v2.14, 7,366 keys; the 561 mix names keep the English pun names). kamu / -mu everywhere, dogs say "aku", dogs are the name or "dia" (the `{sex, select}` branches carry the same text).

Term choices, one word per English term across the whole table:

- Bond = Kedekatan (label "Kedekatan {n}", "Level kedekatan {l}", "poin kedekatan"); Hunger / Happiness / Energy / Cleanliness = Kenyang / Bahagia / Energi / Kebersihan; Paw Coins / coins = Koin Tapak / koin ("Koinmu belum cukup").
- Buy = Beli, Later = Nanti, Not now = Nanti saja, Close = Tutup, Back = Kembali, Next = Lanjut.
- Dock labels: Beri makan, Main, Rawat, Jalan-jalan, Lemari Baju, Jurnal, Peta (v2.14 fit pass: the full Feed and Walk words are back; the phone bar sets them a little narrower, like Lemari Baju, in `game/css/20_phone_shell.css`).
- treat and snack = camilan; bowl = mangkuk; doghouse = Rumah Anjing, dog bed = kasur; charm = jimat; top-knot = kuncir; puddle = genangan; Nose-o-meter = Hidung-o-meter.
- A dog "in season" = masa birahi (a crop "in season" = sedang musim); "fewer than 4 litters" = belum pernah melahirkan 4 kali atau lebih; Pick of the litter = Pilihan pertama; Pug and Frenchie snort = dengus / mendengus ("dengkur" only for sleep); the schnauzer's "I have notes" = "Aku punya beberapa catatan."
- The veggie Garden is Kebun Sayur, the Home Yard is Halaman Rumah. Master Breeder = Maestro Keluarga Anjing (the loanword is banned). Puppies go to their "rumah baru". Dog Card names are "{b} {a}" (noun first).

TODO(native): `title.start_over_body_html` and the other "farm" jokes: "pindah ke pertanian yang asli" (the word "peternakan" is banned).
TODO(native): the stat names: "+10 Lapar" for a fed dog reads like more hunger ("Kenyang" may be clearer for the meter).
TODO(native): `journal.title_great_granddog` "Moyang Anjing" and `journal.title_master_breeder` / `journal.coat_50` "Maestro Keluarga Anjing" are stand-ins for puns and a banned word.
TODO(native): `data.dc_words_a` Waggy = "Kibas", Wiggly = "Goyang", Toasty = "Anget", Dreamy = "Pemimpi" and `data.dc_words_b` Daisy = "Aster", Willow = "Dedalu": the adjective + noun pairs may sound odd.
TODO(native): `newyear.gerald_text` and `data.clothes.year_of_the_sheep_hood.*`: the sheep / Border Collie joke and "Tahun Domba" / "tudung wol".
TODO(native): `data.ny_fortunes.*`: "Keberuntungan besar / baik / kecil" for the great / good / small luck levels.
TODO(native): `wx_lines.greyhound.coat` "banyak banget" (a little colloquial), `core.lu_raise_html` "minta kenaikan gaji" (the raise in treats joke), `popup.had_a_quick_squat` and `popup.lifted_a_leg_on_the` (potty jokes).
TODO(native): `data.dc_breed_words` keep the English short forms except Mutt = Campuran, Poodle = Pudel, Shepherd = Gembala, Pittie = Pitbull; `data.jr_grand` and "The Everything Dog" / "Harlequin" stay English like the mix names.
TODO(native): `data.place_lines.chow.woods` "singa yang tenang", `data.tk_lines.chihuahua.tokyotower` "Aku lebih tinggi di dalam", `data.tk_lines.poodle.asakusa` "Beda tipis", `data.place_lines.mastiff.river` "Ngiler, air, ngiler."
TODO(native): `town.salon_done` "awan yang sudah lulus kuliah", `town.vet_survived` "berhasil melewati dokter hewan. Nyaris. Dengan dramatis."
TODO(native): `data.treasures.rubber_chicken.ab` "Bunyi Kebijaksanaan", `data.treasures.clover_collar.ab` "Anjing Hoki" ("hoki" is colloquial), `data.tk_ueno.hanami.0` "Piknik hanami" and `momiji.0` "Jalan momiji" (Japanese words without a gloss in the title).
TODO(native): `data.spot_ord.*` "ke-1" depends on the pack sentence putting "Tempat {spot_ord}" before it; `data.walk_lines.bonkname.seagull.1` "CIT CIT" as the gull sound.
TODO(native): `vet.preg_check` / `vet.preg_go` "Cek calon anak anjing" and "USG" may sound clinical; `playdate.has_retired_from_romance` "pensiun dari urusan asmara" may be too grown-up.
TODO(native): `data.sig.dachs.n` "Goyang Mi" (Noodle Wiggle), `data.fallback_dogs.pom.joke` "Kiik!" (Pomeranian yip), `data.ex_words.sneeze` "Hatsyi", `data.ex_words.hearts` "Mata hati".
TODO(native): `data.merle_by.collie.blue` and `data.merle_words.blue` "Merle abu-abu" (Slate merle) next to "Merle biru"; `pack.rescue` and `shelter.kind_rescue` keep the loanword "Rescue".
TODO(native): `puppies.trots_off_with` "berangkat ke rumah barunya bersama {family} {where}" depends on how the `where` phrases read after it.
TODO(native): `data.toys_lines.*` barks ("kik" for small dogs, the Beagle "AUUU") and the smug lines; `data.toys.snuffle_mat.n` "Matras Endus", `data.toys.paddling_pool.n` "Kolam Cipak-Cipak", `data.toys.bat_wing_flyer.n` "Cakram Sayap Kelelawar".
TODO(native): `mod.toys.boo_tiful`, `mod.toys.fetch_tastic`, `mod.toys.best_game_ever` (wordplay), `mod.toys.tucked_in` "Diselimuti" and `mod.toys.tuck_in_meter` "meter selimut".
TODO(native): `data.jokes.dachs.3` "Sosis? Mana? Oh. Aku.", `data.jokes.lab.2` "Ekorku ekor berang-berang.", `train.signature` "Andalan", `data.tcmd.play_dead` "Tidur!" (the English "Bang!" read as a gunshot), `care.seagull` "Camilan diganti".
TODO(native): `train.combo` and `train.cost` are long and may be tight at 390 px.
TODO(native): `garden.fb_*` coat-gene wording ("membawa warna pudar", "belang") may be too technical; `data.pig_need.*` "kedua orang tua" for a dog's parents; `yard.flips_upside_down_legs_in` "pose kecoak" (Greyhound roaching).
TODO(native): `garden.one_peas` "polong kacang polong" reads awkwardly; `data.obs_label.tide_pool` "Kolam karang"; `data.food.pup_kinton.n` kept as "Pup Kinton"; "hammock" kept as a loanword.
TODO(native): `winter.floof` "Pufff." and `winter.lesson` (the English has three sentences, written here as two).

## v2.15

TODO(native): place names: "Lapangan Latihan" (Training Ground), "Kolam Ciprat" (Splash Pool), "Jalur Bunga Matahari", "Jalur Hutan Bambu", "Jalur Tebing Laut" (the mission line shortens them to "Bunga Matahari, Hutan Bambu atau Tebing Laut").
TODO(native): agility words: "lintasan agility", "roset" (as in "Roset Parade"), "Tiang slalom", "Palang lompat", "Ban", "Meja jeda", "Ayo!" for the Go! button.
TODO(native): "berendam" for the dog paddle (Paddle button and mission), "Bola apung" for float fetch, "Rompi Pelampung Anjing" for the Doggy Life Vest, "anak tangga" for the pool step and "tanjakan" for the ramp.
TODO(native): `pool.splsh` and the pool lines use "byur" for the splash sound, `pool.sprink_hint` "Ciprat, ciprat!".
