# Doodle Doggo: German (de) style guide

Language code `de`. Standard German readable in Germany, Austria and Switzerland (use "ß"; Swiss readers accept it in a game). Data: `game/i18n/glossary/de.json` (breeds, terms, bans). Anything marked `TODO(native)` needs a native speaker's check.

## 1. Tone

- Cozy, kind, simple, playful. Short sentences a child can read. Warm everyday words ("kuscheln", "Leckerli", "Gassi", "Nickerchen").
- The crude crayon dogs are the joke. Each dog speaks in its breed's personality. Translate the joke, not the words; German loves a dry understatement, which fits the Shiba and the Pug well.
  - EN "Haircut optional. Dignity not." → "Frisur optional. Würde nicht."
  - EN "I am also bread-shaped. We are allies." → "Ich bin auch brotförmig. Wir sind Verbündete."
- Nothing bad ever happens. Soft words for everything.
- Barks and sounds: "Wuff!", "Wau!", "Auuu!" (Husky), "zzz", "grrr" (playful).

## 2. Register and address

- **du** everywhere, including menus, account screens and the privacy page. Lowercase "du / dein" (the current rule; "Du" capitalized only in letters, and Mrs. Plum's letters may use "Du / Dein" as a cozy letter touch, consistently).
- Imperatives in the du form: "Gib Luna etwas zu fressen", "Wähl ein Outfit". Buttons use the infinitive (see 4).
- "fressen" is the correct verb for animals and is friendly in a pet game ("Futter fressen"); "essen" for people.

## 3. Gender

**The player** is never given a gender. German du sentences are mostly neutral already; avoid role nouns about the player:
- "Du bist der beste Besitzer" → "Dein Hund liebt dich"
- "Willkommen!" is neutral. "Als Gast spielen" is fine (Gast covers everyone).
- No "Spieler:innen", "Besitzer*in": rephrase instead ("alle, die spielen", "du").

**Dogs:** Hund (m) for any dog, Hündin for a girl dog when it matters, "Rüde" only if needed (prefer "Junge"). Welpe is masculine for both sexes ("der Welpe", "ein Welpe"). Pronouns follow the dog's sex ("er" / "sie"); use `select`:
- `{sex, select, girl {Sie ist müde.} other {Er ist müde.}}`
- Predicative adjectives don't change: "{name} ist glücklich" needs no select. Attributive adjectives after "ein/eine" do ("ein glücklicher Hund" / "eine glückliche Hündin"): prefer the dog's name and a predicative adjective.
- Characters: Gerald ("die Ente" is grammatically feminine, but Gerald is "er"), Mrs. Plum ("Frau Plum", sie), Baker Bea ("Bäckerin Bea", sie). Pip and Dr. Paws have no stated gender: "Pip vom Bauernhof", "Dr. Pfote", no pronouns about them (repeat the name).

## 4. UI conventions

- **Quotes:** „Anführungszeichen“ (U+201E opening, U+201C closing): „Hallo!“. Nested: ‚…‘.
- **Punctuation:** like English, no space before ! ? : ; One "!" at a time.
- **Capitalization:** nouns are always capitalized; otherwise sentence case for titles, buttons and tabs ("Tagesaufgaben", "Fotomodus", "Ernte verkaufen"). Place and shop names are names, so an adjective in them is capitalized too ("Hässlicher Pulli" style); most of ours are compounds anyway ("Kuschelhaus", "Sonnenpark", "Am Flussufer").
- **Compounds:** join with a hyphen when a name or a foreign word is in it: "Yoyogi-Park", "Shibuya-Kreuzung", "Kürbis-Pop-up", "Wau-Wau-Boutique". Otherwise one word: "Hundewiese", "Stempelheft".
- **Numbers:** `Intl.NumberFormat('de')`: 1.000, 12.345, 1,5. Never hard-code separators.
- **Dates:** "18. Oktober", short "18. Okt.", numeric "18.10.".
- **Coins:** "+5 Taler", "Kostet 30 Taler". "Pfotentaler" only as the currency name.
- **Buttons:** infinitive, as German software does ("Speichern", "Abbrechen", "Kaufen", "Füttern", "Streicheln"). Tricks are the real German dog commands on purpose ("Sitz", "Platz", "Pfote", "Peng!").
- **Length:** German runs 30% longer than English, and long compounds don't wrap. Short forms for the phone care bar, tabs and buttons; if a word is longer than about 12 letters on a button, use the short form or allow a hyphen (`&shy;` in HTML, `­` in the JSON) at the compound joint: "Bindungs­stufe".

| English | Normal | Short (phone) |
|---|---|---|
| Feed | Füttern | Futter |
| Pet | Streicheln | Kraulen |
| Bath | Baden | Bad |
| Walk | Gassi gehen | Gassi |
| Play with a toy | Mit Spielzeug spielen | Spielen |
| Log in | Anmelden | (same) |
| Daily missions | Tagesaufgaben | Aufgaben |
| Not now | Nicht jetzt | Später |
| Forgot your password? | Passwort vergessen? | (same) |
| Saved on this device | Auf diesem Gerät gespeichert | Lokal gespeichert |
| Paw given today | Heute schon Pfötchen gegeben | Pfötchen gegeben |

- **Plurals:** `Intl.PluralRules('de')` gives `one` and `other`. Use `=0` for nicer zero lines: `{n, plural, =0 {Noch keine Welpen} one {# Welpe} other {# Welpen}}`. Watch the case: "mit # Welpen" (dative plural) differs from "# Welpen" only for some nouns ("mit einem Hund" / "mit # Hunden").

## 5. The owner's word rules in German

| Banned idea | Banned German | Say instead |
|---|---|---|
| "breed" as a verb | züchten, Zucht, Züchter, Hundezucht, Aufzucht, verpaaren, Paarung, vermehren | ein Spieltreff, Welpen bekommen: „Luna und Max haben Welpen bekommen“ |
| raising a dog | ("aufziehen" sounds like a breeder too) | sich kümmern, großwerden: „Kümmer dich um deinen Welpen“, „Dein Welpe wird groß“ |
| "stud" | Deckrüde, decken lassen, Deckakt | (no word needed: „der Papa“, or the dog's name) |
| "litter price" | Wurfpreis, Welpenpreis, Preis pro Welpe | nothing has a price: „kostenlos“, „kostenlos an eine Familie vermittelt“ |
| "sell" for dogs | Welpen verkaufen, Hund zu verkaufen, Verkauf von Hunden | vermitteln, ein neues Zuhause finden: „Eine Familie nimmt Krümel auf“ |
| "made in Japan" | hergestellt in Japan, in Japan gemacht, Japan-made | im japanischen Stil: „ein Schal im japanischen Stil“ |
| franchises | Nintendo, Pokémon, Animal Crossing | (never mention) |

- "Rasse" / "Hunderasse" (the noun) is fine. "Wurf" (litter) is allowed as a noun but the game prefers "Welpen"; "Wurf" is also a ball throw ("3 Taler pro Wurf"), which is fine.
- The `z[üu]cht` ban catches every form and compound of Zucht/züchten. "Stammbaum" (family tree) is fine.
- Selling vegetables and shops are fine: „Ernte verkaufen“, „Die Boutique verkauft Mützen für Hunde“, „Hundefutter“ (compounds are not dog words for the ban). The `sell` ban flags a sell word and a dog word in one sentence, except a dog word right after "für (den/die/deinen …)". If a shop line still trips it, split the sentence. "Ausverkauft!" is fine.
- "decken" alone is fine ("den Tisch decken").

## 6. Japanese words

Keep the romanized words with the game's macrons; gloss once, in the same sentence. Nouns borrowed from Japanese are capitalized in German (Omikuji, Mochi, Kadomatsu):
- **Hachikō**: „die Statue von Hachikō, dem treuesten Hund Japans“. Warm, never sad.
- **Sensō-ji**: „der Sensō-ji-Tempel“ in Asakusa.
- **Shinkansen**: „der Shinkansen, Japans Schnellzug“.
- **Omikuji**: „ein Omikuji, ein kleiner Glückszettel“. Every fortune is happy.
- **nengajō**: the game says „Neujahrskarte“; "Nengajō" only in a gloss.
- **Otoshidama**: „ein Otoshidama, ein Neujahrsumschlag“.
- **Kadomatsu**, **Happi**, **Mochi**: keep and gloss („Kiefernschmuck“, „Happi-Jacke“).
- Tokyo is "Tokio" in running text, but "Tokyo Tower" stays as the name. "der Fuji" or "der Berg Fuji".

## 7. Care lessons

Two sentences, short, kind, true.
- EN "Blueberries are a safe berry for dogs. Grapes and raisins never are." → „Heidelbeeren sind für Hunde sicher. Trauben und Rosinen nie.“
- EN "Plain cooked turkey, no onion or garlic. Those are poison for dogs." → „Gekochte Pute, ohne Zwiebeln und Knoblauch. Die sind giftig für Hunde.“

## 8. Glossary

<!-- table:start (generated from game/i18n/glossary/de.json, edit both together) -->

### Terms (174)

| English | de | Note |
|---|---|---|
| Doodle Doggo | Doodle Doggo | The game title. Never translated. |
| dog | Hund / Hündin | Boy dog / girl dog where the sentence needs it. |
| puppy | Welpe | The game says "pup" too: same word. Welpe is masculine for both sexes: der Welpe, ein Welpe. |
| breed (noun) | Rasse | The noun is fine everywhere. The verb is banned (see the word rules). |
| boy (dog) | Junge | The Boy / Girl chip on the dog card. |
| girl (dog) | Mädchen |  |
| Mum (of a puppy) | Mama | In the family tree and puppy card. |
| Dad (of a puppy) | Papa |  |
| Mystery Pup | Überraschungswelpe | Fallback dog name for an unknown breed. |
| Shelter Mutt | Tierheim-Mischling | The mixed-breed starter dog. Warm, never a put-down. |
| sketchbook | Skizzenbuch | The look of the world. |
| crayon | Wachsmalstift | The dogs are drawn in crayon: that is the joke. |
| Map | Karte | The town map button. |
| Home Yard | Garten | Not the veggie garden (see Garden). |
| Cozy House | Kuschelhaus |  |
| Sunny Park | Sonnenpark |  |
| Riverside | Am Flussufer | Gerald lives here. |
| Maple Woods | Ahornwald |  |
| Seashell Beach | Muschelstrand |  |
| Market Street | Marktstraße |  |
| Town Square (the Square) | Dorfplatz (der Platz) | Festivals happen here. |
| Dog Park | Hundewiese | Visiting dogs and the Playdate Board. |
| Vet Clinic | Tierarztpraxis | Short: Veterinario / Veterinário / Véto / Tierarzt / Dokter Hewan. |
| Grooming Salon | Hundesalon |  |
| Shelter | Tierheim | The animal shelter. Only kind words about it. |
| Shelter Playroom | Spielzimmer im Tierheim |  |
| bring home (from the shelter) | mit nach Hause nehmen |  |
| adopt | adoptieren |  |
| Kibble Corner | Futterecke | Food, toys and the Gene Sniffer. |
| Bow-Wow Boutique | Wau-Wau-Boutique | The clothes shop. Use the local bark. |
| Barkitecture | Wauhaus | Doghouses and furniture. A pun: keep a pun. Wau + Bauhaus. |
| Harvest Stall | Erntestand | Baker Bea, autumn. |
| Winter Stall | Winterstand | Baker Bea, winter. |
| Pumpkin Patch Pop-up | Kürbis-Pop-up | Halloween 2026 only. |
| Gene Sniffer | Genschnüffler | A gadget, said with a wink. |
| Gerald the duck | Gerald, die Ente | The guide. Keep the name. Speaks a bit grand, always kind. "die Ente" is feminine in grammar; Gerald is still "er". |
| Mrs. Plum | Frau Plum | The kind neighbour who writes letters. |
| Baker Bea | Bäckerin Bea | Runs the festival stalls. |
| Pip the farmer | Pip vom Bauernhof | Gave you the seeds. Gender is not stated: keep it neutral. |
| Dr. Paws | Dr. Pfote | The vet. Gender is not stated: write "Dr." and avoid gendered adjectives. |
| Old Mr. Reyes | der alte Herr Reyes |  |
| Feed | Füttern | Button. Short: Comida / Comida / Manger / Futter / Makan. |
| Pet (verb) | Streicheln | Button. Short: Mimos / Carinho / Câlin / Kraulen / Elus. |
| Bath | Baden | Button. Short noun: Baño / Banho / Bain / Bad / Mandi. |
| Walk | Gassi gehen | Walks are the main income. Noun: paseo / passeio / balade / Gassirunde / jalan-jalan. Short: Gassi. |
| Train (tricks) | Üben | Trick training is play, never strict. "Üben" is friendlier than "Dressieren". |
| Nap | Nickerchen |  |
| Potty | Pipi | Cute and short. Never crude. |
| Play | Spielen |  |
| Ball play | Ballspielen | Coins per return. |
| Brush | Bürsten |  |
| Clean up | Aufräumen | After a potty in the yard. |
| treat | Leckerli |  |
| Food (tab) | Futter |  |
| Toys | Spielzeug |  |
| Clothes | Kleidung |  |
| Houses (doghouses) | Hundehütten |  |
| Wardrobe | Kleiderschrank |  |
| Zoomies | Flitzerunde | A sudden happy sprint. Germans also say "die verrückten fünf Minuten". |
| Hunger | Hunger | Stat bar label. |
| Happiness | Freude | Stat bar label. |
| Energy | Energie | Stat bar label. |
| Cleanliness | Sauberkeit | Stat bar label. |
| Bond | Bindung | How close you and your dog are. Short and warm alternative: "Nähe". TODO(native). |
| Bond level | Bindungsstufe |  |
| Bond points | Bindungspunkte |  |
| Paw Coins | Pfotentaler | The currency name. |
| coins | Taler | Plain word in sentences: "+5 coins". |
| Sit | Sitz | Trick names use the real local dog commands. |
| Paw (trick) | Pfote |  |
| Spin | Dreh dich |  |
| Speak | Gib Laut |  |
| Roll Over | Rolle |  |
| Play Dead | Peng! | The game shows a comic faint. Softer words are fine. "Peng!" is the usual German name for this trick. |
| Lie Down | Platz |  |
| Dance | Tanzen |  |
| Tricks | Tricks | Journal tab and training. |
| Puppy Playdate | Hunde-Spieltreff | Two grown-up dogs meet; puppies may follow. The kind word for the whole feature. |
| playdate | Spieltreff |  |
| Playdate Board | Spieltreff-Pinnwand | At the Dog Park. |
| Puppies on the way | Bald kommen Welpen |  |
| expecting (puppies) | erwartet Welpen | Use this, not medical words. |
| nursery | Welpenzimmer |  |
| Who stays? | Wer bleibt? | Choosing which puppy stays home. |
| new home | neues Zuhause | "Ready for new homes today!" |
| adopted out free to a family | kostenlos an eine Familie vermittelt | The only way puppies leave. Never a price. "vermitteln" is the shelter word. Never "abgeben gegen Gebühr". |
| family (adoptive) | Familie | Named families who write postcards. |
| family tree | Familienbaum | "Stammbaum" is fine too. |
| spayed / neutered | kastriert | Vet option. Calm and plain. |
| Gene test | Gentest | At the Vet Clinic. |
| coat | Fell | Coat colours and patterns (genetics). |
| Sparkle | Glitzer | A rare cosmetic shine. Never paid for. |
| Sparkle pup | Glitzerwelpe |  |
| Sparkle Stone | Glitzerstein |  |
| Journal | Tagebuch |  |
| Mailbox | Briefkasten |  |
| letter | Brief |  |
| postcard | Postkarte | Also what photo mode makes. |
| gift | Geschenk |  |
| Daily missions | Tagesaufgaben |  |
| mission | Aufgabe |  |
| stamp | Stempel | Mission stamps and the Tokyo stamps are the same word. |
| Stamp book | Stempelheft | Seven stamps in Tokyo. |
| Treasure Map | Schatzkarte |  |
| Map Piece | Kartenstück |  |
| treasure | Schatz | Found on walks, never sold. |
| Garden (veggie patch) | Gemüsebeet | Not the yard. |
| Seeds | Samen |  |
| crop | Ernte |  |
| Sell crops | Ernte verkaufen | Selling vegetables is fine. Selling dogs never is. |
| Harvest | Ernten |  |
| Kitchen | Küche |  |
| Recipes | Rezepte | Dog-safe only. |
| Cook a dish | Ein Gericht kochen |  |
| spring / summer / autumn / winter | Frühling / Sommer / Herbst / Winter | The game follows the Japan calendar. |
| leaf festival | Blätterfest | Autumn. |
| leaf pile | Laubhaufen |  |
| Costume parade | Kostümparade |  |
| Halloween | Halloween | Spooky-cute only, nothing scary. |
| Snow Days | Schneetage |  |
| Winter Lights | Winterlichter |  |
| Ugly Sweater Contest | Wettbewerb der schrägen Pullis | Short: "Pulli-Contest". TODO(native). |
| New Year | Neujahr |  |
| New Year card (nengajō) | Neujahrskarte | The game says "New Year card"; nengajō only in a gloss. |
| Fortune box | Glücksbox | Shake it for a New Year fortune (an omikuji). |
| Decorate | Einrichten |  |
| furniture | Möbel |  |
| dog bed | Körbchen |  |
| pack (your dogs) | Rudel | All your dogs together. |
| Make leader | Nach vorne | Button; avoids gendered "leader" nouns. |
| Photo mode | Fotomodus |  |
| Dog Card | Hundekarte | Opt-in public cards. No free text. |
| visiting dog | Besuchshund |  |
| Paw (given to a card) | Pfötchen | One per card per Japan day. |
| Paw given today | Heute schon Pfötchen gegeben | Short: "Pfötchen gegeben". |
| Japan | Japan |  |
| Japan-style | im japanischen Stil | The safe word. Never "made in Japan". |
| Station | Bahnhof | The town pin that starts the Tokyo Trip. |
| Tokyo | Tokio | In names: Tokyo Tower stays as listed below. |
| Tokyo Trip | Tokio-Reise |  |
| Japan map | Japankarte |  |
| Shinkansen | Shinkansen (Schnellzug) | Keep the word; gloss it once. |
| Tokyo Station | Bahnhof Tokio |  |
| Shibuya Crossing | Shibuya-Kreuzung |  |
| Hachikō | Hachikō | Keep the macron. Gloss: the statue of a famously loyal dog. Told warmly. |
| Yoyogi Park Dog Run | Hundeauslauf im Yoyogi-Park |  |
| Asakusa / Sensō-ji | Asakusa / Sensō-ji-Tempel | Keep the macron. |
| Tokyo Tower | Tokyo Tower |  |
| Ueno Park | Ueno-Park |  |
| Odaiba Seaside | Odaiba am Meer |  |
| Mt. Fuji | der Fuji |  |
| Mt. Fuji Lookout | Fuji-Aussichtspunkt |  |
| omikuji | Omikuji (Glückszettel) | Keep the word, gloss it once. Only happy fortunes. |
| otoshidama | Otoshidama (Neujahrsumschlag) | Mrs. Plum gives it to the youngest dog. |
| kadomatsu | Kadomatsu (Kiefernschmuck) | New Year pine decoration. |
| happi coat | Happi-Jacke | Festival jacket. |
| mochi | Mochi | Dog-safe version only. |
| Settings | Einstellungen |  |
| Sound | Ton |  |
| Music | Musik |  |
| Sound effects | Soundeffekte |  |
| Language | Sprache | The language picker. Each language names itself: Español, Português (Brasil), Français, Deutsch, Bahasa Indonesia. |
| Log in | Anmelden |  |
| Play as guest | Als Gast spielen | Avoids gendered "invitado/convidado/invité". |
| Forgot your password? | Passwort vergessen? |  |
| Saved on this device | Auf diesem Gerät gespeichert |  |
| Cloud save | Cloud-Speicherstand |  |
| Buy | Kaufen |  |
| Cancel | Abbrechen |  |
| Close | Schließen |  |
| Back | Zurück |  |
| Next | Weiter |  |
| Not now | Nicht jetzt |  |
| Yes / No | Ja / Nein |  |

### Breeds (35, `mods/genes.js` BREEDS order)

| Key | de |
|---|---|
| `shiba` | Shiba Inu |
| `corgi` | Corgi |
| `golden` | Golden Retriever |
| `dachs` | Dackel |
| `husky` | Husky |
| `mutt` | Mischling |
| `chihuahua` | Chihuahua |
| `pug` | Mops |
| `greyhound` | Greyhound |
| `beagle` | Beagle |
| `poodle` | Zwergpudel |
| `collie` | Border Collie |
| `samoyed` | Samojede |
| `frenchie` | Französische Bulldogge |
| `akita` | Akita Inu |
| `spitz` | Japan-Spitz |
| `pom` | Zwergspitz |
| `afghan` | Afghanischer Windhund |
| `dane` | Deutsche Dogge |
| `mastiff` | Mastiff |
| `gsd` | Deutscher Schäferhund |
| `dobie` | Dobermann |
| `corso` | Cane Corso |
| `pitbull` | Pitbull |
| `minpin` | Zwergpinscher |
| `lab` | Labrador Retriever |
| `malamute` | Alaskan Malamute |
| `chow` | Chow-Chow |
| `stdpoodle` | Großpudel |
| `schnauzer` | Zwergschnauzer |
| `westie` | West Highland White Terrier |
| `yorkie` | Yorkshire Terrier |
| `bichon` | Bichon Frisé |
| `maltese` | Malteser |
| `shihtzu` | Shih Tzu |

<!-- table:end -->

## 9. Site

`site/i18n/de.json` (doodledoggo.app, v2.14). Decisions: the dog names stay English (Butter happens to be German too); `card.type`, `profile.title_type` and `profile.alt` show `{breed}` without an article (avoids der/die by breed); `profile.pup_alt` is "{name} als Welpe" (`{article}` unused); the PLAY button is "SPIEL AUF ITCH.IO" (du imperative), because "AUF ITCH.IO SPIELEN" wrapped to two lines at 360 px; the privacy page says the English version counts, in `privacy.updated`. No capital ẞ anywhere. Titles in the hand font write "Hachiko" without the macron, as the English does.
- TODO(native): "krakelig" for "wobbly" and "Wachsmalhund" for "crayon dog" across the site, and the tagline "Ein krakeliger Welpe zum Liebhaben".
- Dog sexes are the same in every language (data: `sex` per dog in `tools/site_dogs.js`; note in `site/i18n/en.json` `_notes`). Written as "sie"/"ihr": Pepper (mutt), Mikan (pom), Saffron (afghan), Peaches (pitbull), Maple (malamute), Madeleine (stdpoodle), Toffee (yorkie), Meringue (bichon), Marshmallow (maltese). All others "er". TODO(native): check "Chefin", "Buddlerin", "Schlittenhündin", "Schoßhündin".
- TODO(native): jokes rewritten: Cloud (samoyed) quote, Espresso (dobie) quote, Wonton (shihtzu) "Haarknoten hoch. Nickerchen jetzt.", Dumpling (pug) "schnorch.", the playroom barks ("och.", "nochmal!", "alle her!").
- TODO(native): love items "Hundemuffin" (pupcake), "Futterzeit" (feeding), "Futterpuzzle", "Zerrseil", "Gassirunden", "Streicheleinheiten".
- TODO(native): privacy wording: "erheben" / "speichern", "unkenntlich gemachte Form" for the hash, "die Zeitpunkte, an denen du dein Konto angelegt und zuletzt gespeichert hast" for "dates".
- TODO(native): "SPIEL AUF ITCH.IO" still wraps to two lines on a 320 px phone.

## 10. Game (v2.14, `game/i18n/de.json`, 7362 keys)

Decisions: Walk = "Gassi" (button), "Gassirunde" (noun); Nose-o-meter = "Nasometer" (neuter, everywhere); Bond = "Bindung" / "Bindungsstufe"; Hunger / Freude / Energie / Sauberkeit; Garden (veggie) = "Gemüsebeet" (short "Beet"), Home Yard = "Garten"; Wardrobe = "Kleiderschrank" in the title, "Kleider" on the phone act bar; carrots are "Karotte" everywhere; coats: Rehbraun (fawn), Schwarz-Loh, Flieder (lilac), Schokobraun (chocolate/liver); in season = "Läufigkeit"; titles "Gen-Spürnase", "Fell-Profi", "Ururgroßhund". Dog voices avoid gendered self-nouns (Wachhund, Majestät instead of Wächter, Königin); third-person lines use `{sex, select, female {...} other {...}}`. "..." is always "…". Rest one season after a litter = eine Läufigkeit aussetzen (never Jahreszeit); snort = schnaufen.
- TODO(native): `vet.carry_*` / `vet.pup_*` and `mod.genes.carry_*` / `pup_*` (nouns and inflected adjectives built to fit one sentence), "Schokobraun" vs "Leberbraun".
- TODO(native): `vet.painter_title`, `vet.painter_aria` ("Maler im Dorf" assumes a male painter), `mail.card_6` / `mail.nb_carrier` ("Briefträger").
- TODO(native): `vet.fix_toast` ("Kragen der Würde"), `vet.fix_nursing`, `vet.fix_expecting` (reason labels inside a sentence).
- TODO(native): `pupplay.walk_pup`, `pupplay.walk_expecting`, `care.climb_in` (colon + `{park}` / `{house}` because the names have mixed genders).
- TODO(native): `fest.rosette_*`, `fest.paraded*` ("Paraden-Rosette", "Mitgelaufen"), `data.clothes.*` ("Laub-Baskenmütze", "Schräger-Pulli-Rosette", "Süßes-oder-Saures-Gespenst"), "Kuschel-Hoodie".
- TODO(native): rewritten jokes: `data.tk_lines.*` (Chihuahua "Innen drin bin ich höher", Westie "winzige weiße Chrysantheme", Schnauzer), `data.jokes.*` (Chihuahua "Die Behörde bist du", Dachs "Würstchen? Wo? Ach so. Ich.", Pom "Mein Flausch ist größer als mein Hund"), `data.toys_lines.maltese.fetchstart.0` ("Achte auf den Pony"), `data.treasures.*.ab` ("Fast-Adlerauge", "Schattige Geschäfte", "Quietscher der Ehre"), `route.bouncer` ("Es ist eine Gans.").
- cards.name_pattern = {a}-{b} (reviewed 21 Oct: the de dc_words_a stems read well with a hyphen).
- TODO(native): `data.dc_words_a.*` stems like "Juhu", "Sause", "Kicher"; `data.dc_words_b.*` bare nouns.
- TODO(native): `garden.season` / `garden.boys_note` ("Läufigkeit": kid-friendly enough?), `garden.fathered` / `garden.litters` ("Würfe als Papa"), `garden.fb_*` genetics wording, `garden.plural_pumpkin` ("3 Kürbis"), `tokyo.omi_ok` ("Glückshund!"), `tokyo.btn_sunset` ("Abendrunde").
- TODO(native): `mod.walk.*` key hints for a German keyboard ("Taste D", "Leertaste"); `walk.res_feed` ("Futtermenü"), `walk.bag` ("Beutel"), `walk.no_use`.
- TODO(native): `pack.rescue` ("Retten"), `pack.today_s_rescues` ("Die Neuen von heute"), `pack.starter` / `pack.adopt_a_starter` ("Starter"), `mod.kitchen.pantry` ("Vorrat") vs "Vorratskammer", `mod.kitchen.cook_by_heart` ("Aus dem Kopf").
- TODO(native): `mail.a_town_family` ("Familie aus dem Ort"), `mail.fam_kim`, `data.npc_boys.5` / `.9` (pun names translated: "Käpt’n Waffel", "Sir Gürkchen"), `town.cafe_enjoyed` ("einen {item}" assumes masculine item names), `playdate.has_retired_from_romance`, `popup.*` ("Missgeschick", "Kotbeutel", "Häufchen").
- TODO(native): `core.lu_raise_html` ("Gehaltserhöhung in Leckerli"), `core.lu_units_html`, `data.tri_solid.collie.*` ("Tricolor"), `data.families.*.where` (in parentheses so they work in the album and in sentences).

## v2.15

- TODO(native): place names: "Hundeplatz" (Training Ground, the usual German word for a dog training ground), "Planschbecken" (Splash Pool), "Sonnenblumenweg", "Bambuspfad", "Klippenpfad" (short on purpose for the map captions; "Grove" and "Run" are dropped).
- TODO(native): agility words: "Agility-Parcours", "Rosette" (as in "Paraden-Rosette"), "Slalom", "Hürde", "Reifen", "Tisch", "Los!" for the Go! button.
- TODO(native): "paddeln" for the dog paddle, "Planschen" for the mission and button, "Schwimmball" for float fetch, "Hunde-Schwimmweste" for the Doggy Life Vest.
- TODO(native): `agility.trick_bonus` "Übungsrunde" for a trick-training session.
