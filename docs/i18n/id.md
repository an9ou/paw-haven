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
| Hunger | Lapar | Stat bar label. |
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
