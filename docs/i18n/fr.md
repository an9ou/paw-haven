# Doodle Doggo: French (fr) style guide

Language code `fr`. Standard French readable in France, Belgium, Switzerland and Quebec. Data: `game/i18n/glossary/fr.json` (breeds, terms, bans). Anything marked `TODO(native)` needs a native speaker's check.

## 1. Tone

- Cozy, kind, simple, playful. Short sentences a child can read. A light, tender humour ("toutou", "papattes", "un petit somme").
- The crude crayon dogs are the joke. Each dog speaks in its breed's personality. Translate the joke, not the words; when a pun dies in French, write a French one.
  - EN "Haircut optional. Dignity not." → "La coupe, c'est en option. La dignité, non."
  - EN "I am also bread-shaped. We are allies." → "Moi aussi, j'ai une forme de pain. On est alliés."
- Nothing bad ever happens. Soft words for everything.
- Barks and sounds: "Ouaf !", "Wouf !", "Ahouuu !" (Husky), "zzz", "grrr" (playful).

## 2. Register and address: **tu**

We use **tu** everywhere, including menus, account screens and the privacy page.
- Why: the game is a cozy toy for all ages and kids; the dogs, Gerald and Mrs. Plum all talk to you as friends. Family games and most casual games in French use tu, and "vous" would sound like a bank. One register across the whole game also avoids mixed screens.
- Imperatives in the tu form: "Donne à manger à Luna", "Choisis une tenue". Buttons use the infinitive (see 4).

## 3. Gender

**The player** is never given a gender. French makes this hard, so rephrase rather than use "prêt·e" or "(e)":
- "Tu es prêt ?" → "C'est parti ?" / "On y va ?"
- "Bienvenue !" is already neutral.
- "Tu es le meilleur maître" → "Ton chien t'adore"
- "Jouer en tant qu'invité" → "Jouer sans compte"
- Past participles with être after "tu" are gendered: "Tu es arrivé" → "Te voilà !"; with avoir they don't change: "Tu as gagné 5 pièces".

**Dogs:** chien / chienne (the normal words; "chienne" is never used as a joke), chiot (masculine for both sexes: "un chiot", "le chiot de Luna"), "toutou" (playful, masculine). Adjectives agree with the dog's sex, so use `select`:
- `{sex, select, girl {{name} est toute contente !} other {{name} est tout content !}}`
- Easier: adjectives that don't change: heureux/heureuse is gendered, but "ravi(e)" too, so prefer "plein d'énergie", "de bonne humeur", "aux anges", or a verb: "{name} remue la queue".
- Characters: Gerald (il, "le canard"), Mrs. Plum (Mme Plum, elle), Baker Bea (elle). Pip and Dr. Paws have no stated gender: "Pip, de la ferme", "Dr Papattes", no gendered adjectives about them.

## 4. UI conventions

- **Quotes:** « guillemets » with a no-break space inside: « Coucou ! ». Nested: “…”.
- **Spaces before punctuation:** a narrow no-break space (U+202F) before ! ? ; and a no-break space (U+00A0) before : and inside « ». In the JSON write ` ` or the character itself, never a normal space (a normal space lets the "!" wrap to the next line on a phone). Examples: "Coucou !", "Qui reste ?", "Prix : 30 pièces".
- **Capitalization:** sentence case everywhere, including names of places and shops: only the first word and proper nouns are capitalized ("Parc ensoleillé", "Coin des croquettes", "Concours du pull moche", "Tour de Tokyo"). Months and days lowercase ("18 octobre", "dimanche"). Accented capitals keep their accents ("Énergie", "À bientôt").
- **Numbers:** `Intl.NumberFormat('fr')`: 1 000, 12 345 (narrow no-break space), 1,5. Never hard-code separators.
- **Dates:** "18 octobre", short "18 oct.", "le 1er janvier" (1er only for the first day).
- **Coins:** "+5 pièces", "Ça coûte 30 pièces". "Pièces Papatte" only as the currency name.
- **Buttons:** infinitive, as French software does ("Enregistrer", "Annuler", "Acheter", "Nourrir", "Promener"). Tricks are the real dog commands on purpose ("Assis", "Couché", "La patte").
- **Ellipsis:** "…" one character.
- **Length:** French runs 15–30% longer than English. Short forms for the phone care bar, tabs and buttons:

| English | Normal | Short (phone) |
|---|---|---|
| Feed | Nourrir | Manger |
| Pet | Caresser | Câlin |
| Bath | Donner le bain | Bain |
| Walk | Promener | Balade |
| Play with a toy | Jouer avec un jouet | Jouer |
| Log in | Se connecter | Connexion |
| Daily missions | Missions du jour | Missions |
| Not now | Pas maintenant | Plus tard |
| Forgot your password? | Mot de passe oublié ? | (same) |

- **Plurals:** `Intl.PluralRules('fr')` gives `one` (0 and 1: "0 chien" is correct French), `many` (millions: "1 000 000 de pièces") and `other`. Use `=0` for nicer zero lines: `{n, plural, =0 {Pas encore de chiots} one {# chiot} other {# chiots}}`. `many` falls back to `other` if missing.

## 5. The owner's word rules in French

| Banned idea | Banned French | Say instead |
|---|---|---|
| "breed" as a verb | élever des chiens, élevage, éleveur, faire reproduire, accoupler, accouplement, croiser deux chiens | un rendez-vous toutou, avoir des chiots: « Luna et Max ont eu des chiots » |
| raising a dog | ("élever" is also "breed", so not for dogs) | s'occuper de, prendre soin de, grandir: « Prends soin de ton chiot » |
| "stud" | étalon, saillie, (mâle) reproducteur | (no word needed: « le papa », or the dog's name) |
| "litter price" | prix de la portée, prix du chiot | nothing has a price: « gratuitement », « adopté gratuitement par une famille » |
| "sell" for dogs | vendre des chiots, vente de chiens, chiot à vendre | confier à une famille, trouver une nouvelle maison: « Une famille adopte Biscotte » |
| "made in Japan" | fabriqué au Japon, fait au Japon | à la japonaise, de style japonais: « une écharpe à la japonaise » |
| franchises | Nintendo, Pokémon, Animal Crossing | (never mention) |

- "race" (the noun) is fine. "portée" (litter) is allowed as a noun, but the game prefers "chiots".
- "croiser des chiens au parc" (to meet them) is fine; the ban only fires on "croiser ton/deux chien(s)" and "croisement de chiens". "Carrefour de Shibuya" is fine. "un élève" (a pupil) is fine.
- Selling vegetables and shops are fine: « Vendre la récolte », « La Boutique vend des pulls pour chiens ». The `sell` ban flags a sell word and a dog word in one sentence, except a dog word right after "pour", "de", "à" or "d'". If a shop line still trips it, split the sentence.

## 6. Japanese words

Keep the romanized words with the game's macrons; gloss once, in the same sentence:
- **Hachikō**: « la statue de Hachikō, le chien le plus fidèle du Japon ». Warm, never sad.
- **Sensō-ji**: « le temple Sensō-ji », à Asakusa.
- **Shinkansen**: « le Shinkansen, le train à grande vitesse japonais ».
- **omikuji**: « un omikuji, un petit papier de bonne aventure ». Every fortune is happy.
- **nengajō**: the game says « carte de Nouvel An »; "nengajō" only in a gloss.
- **otoshidama**: « un otoshidama, l'enveloppe du Nouvel An ».
- **kadomatsu**, **happi**, **mochi**: keep and gloss (« décoration de pin », « veste happi »).
- Tokyo stays "Tokyo"; "le mont Fuji" in a sentence, "Mont Fuji" only at the start of a title.

## 7. Care lessons

Two sentences, short, kind, true.
- EN "Blueberries are a safe berry for dogs. Grapes and raisins never are." → « La myrtille est un fruit sans danger pour les chiens. Le raisin, jamais. »
- EN "Plain cooked turkey, no onion or garlic. Those are poison for dogs." → « De la dinde cuite, sans oignon ni ail. C'est du poison pour les chiens. »

## 8. Glossary

<!-- table:start (generated from game/i18n/glossary/fr.json, edit both together) -->

### Terms (174)

| English | fr | Note |
|---|---|---|
| Doodle Doggo | Doodle Doggo | The game title. Never translated. |
| dog | chien / chienne | Boy dog / girl dog where the sentence needs it. "toutou" is the playful word. "chienne" is the normal word for a girl dog; never use it as an insult joke. |
| puppy | chiot | The game says "pup" too: same word. |
| breed (noun) | race | The noun is fine everywhere. The verb is banned (see the word rules). |
| boy (dog) | garçon | The Boy / Girl chip on the dog card. |
| girl (dog) | fille |  |
| Mum (of a puppy) | Maman | In the family tree and puppy card. |
| Dad (of a puppy) | Papa |  |
| Mystery Pup | Chiot mystère | Fallback dog name for an unknown breed. |
| Shelter Mutt | Croisé du refuge | The mixed-breed starter dog. Warm, never a put-down. Not "bâtard" (also an insult). |
| sketchbook | carnet de croquis | The look of the world. |
| crayon | crayon de cire | The dogs are drawn in crayon: that is the joke. |
| Map | Carte | The town map button. |
| Home Yard | Jardin de la maison | Not the veggie garden (see Garden). |
| Cozy House | Maison douillette |  |
| Sunny Park | Parc ensoleillé |  |
| Riverside | Les Berges | Gerald lives here. |
| Maple Woods | Bois des érables |  |
| Seashell Beach | Plage aux coquillages |  |
| Market Street | Rue du marché |  |
| Town Square (the Square) | Place du village (la Place) | Festivals happen here. |
| Dog Park | Parc canin | Visiting dogs and the Playdate Board. |
| Vet Clinic | Clinique vétérinaire | Short: Veterinario / Veterinário / Véto / Tierarzt / Dokter Hewan. |
| Grooming Salon | Salon de toilettage |  |
| Shelter | Refuge | The animal shelter. Only kind words about it. |
| Shelter Playroom | Salle de jeux du refuge |  |
| bring home (from the shelter) | ramener à la maison |  |
| adopt | adopter |  |
| Kibble Corner | Coin des croquettes | Food, toys and the Gene Sniffer. |
| Bow-Wow Boutique | Boutique Ouaf-Ouaf | The clothes shop. Use the local bark. |
| Barkitecture | Ouafchitecture | Doghouses and furniture. A pun: keep a pun. TODO(native). |
| Harvest Stall | Stand des récoltes | Baker Bea, autumn. |
| Winter Stall | Stand d'hiver | Baker Bea, winter. |
| Pumpkin Patch Pop-up | Pop-up des citrouilles | Halloween 2026 only. |
| Gene Sniffer | Renifle-gènes | A gadget, said with a wink. |
| Gerald the duck | Gerald le canard | The guide. Keep the name. Speaks a bit grand, always kind. |
| Mrs. Plum | Mme Plum | The kind neighbour who writes letters. |
| Baker Bea | Bea la boulangère | Runs the festival stalls. |
| Pip the farmer | Pip, de la ferme | Gave you the seeds. Gender is not stated: keep it neutral. |
| Dr. Paws | Dr Papattes | The vet. Gender is not stated: write "Dr." and avoid gendered adjectives. French writes "Dr" without a full stop. |
| Old Mr. Reyes | le vieux M. Reyes |  |
| Feed | Nourrir | Button. Short: Comida / Comida / Manger / Futter / Makan. |
| Pet (verb) | Caresser | Button. Short: Mimos / Carinho / Câlin / Kraulen / Elus. |
| Bath | Donner le bain | Button. Short noun: Baño / Banho / Bain / Bad / Mandi. |
| Walk | Promener | Walks are the main income. Noun: paseo / passeio / balade / Gassirunde / jalan-jalan. |
| Train (tricks) | Entraîner | Trick training is play, never strict. "dresser" sounds strict; prefer "entraîner" or "apprendre un tour". |
| Nap | Sieste |  |
| Potty | Pipi | Cute and short. Never crude. |
| Play | Jouer |  |
| Ball play | Jouer à la balle | Coins per return. |
| Brush | Brosser |  |
| Clean up | Ramasser | After a potty in the yard. |
| treat | friandise |  |
| Food (tab) | Nourriture |  |
| Toys | Jouets |  |
| Clothes | Vêtements |  |
| Houses (doghouses) | Niches |  |
| Wardrobe | Garde-robe |  |
| Zoomies | Zoomies | A sudden happy sprint. |
| Hunger | Faim | Stat bar label. |
| Happiness | Bonheur | Stat bar label. |
| Energy | Énergie | Stat bar label. |
| Cleanliness | Propreté | Stat bar label. |
| Bond | Amitié | How close you and your dog are. |
| Bond level | Niveau d'amitié |  |
| Bond points | points d'amitié |  |
| Paw Coins | Pièces Papatte | The currency name. |
| coins | pièces | Plain word in sentences: "+5 coins". |
| Sit | Assis | Trick names use the real local dog commands. |
| Paw (trick) | La patte |  |
| Spin | Tourne |  |
| Speak | Parle |  |
| Roll Over | Roule |  |
| Play Dead | Fais le mort | The game shows a comic faint. Softer words are fine. "Fais le mort" is the standard trick name and reads as play. |
| Lie Down | Couché |  |
| Dance | Danse |  |
| Tricks | Tours | Journal tab and training. |
| Puppy Playdate | Rendez-vous toutou | Two grown-up dogs meet; puppies may follow. The kind word for the whole feature. |
| playdate | rendez-vous |  |
| Playdate Board | Tableau des rendez-vous | At the Dog Park. |
| Puppies on the way | Des chiots en route |  |
| expecting (puppies) | attend des chiots | Use this, not medical words. |
| nursery | nurserie |  |
| Who stays? | Qui reste ? | Choosing which puppy stays home. |
| new home | nouvelle maison | "Ready for new homes today!" |
| adopted out free to a family | adopté gratuitement par une famille | The only way puppies leave. Never a price. |
| family (adoptive) | famille | Named families who write postcards. |
| family tree | arbre de famille |  |
| spayed / neutered | stérilisée / castré | Vet option. Calm and plain. |
| Gene test | Test génétique | At the Vet Clinic. |
| coat | pelage | Coat colours and patterns (genetics). |
| Sparkle | Paillettes | A rare cosmetic shine. Never paid for. |
| Sparkle pup | chiot Paillettes |  |
| Sparkle Stone | Pierre à paillettes |  |
| Journal | Carnet |  |
| Mailbox | Boîte aux lettres |  |
| letter | lettre |  |
| postcard | carte postale | Also what photo mode makes. |
| gift | cadeau |  |
| Daily missions | Missions du jour |  |
| mission | mission |  |
| stamp | tampon | Mission stamps and the Tokyo stamps are the same word. |
| Stamp book | Carnet de tampons | Seven stamps in Tokyo. |
| Treasure Map | Carte au trésor |  |
| Map Piece | Morceau de carte |  |
| treasure | trésor | Found on walks, never sold. |
| Garden (veggie patch) | Potager | Not the yard. |
| Seeds | Graines |  |
| crop | récolte |  |
| Sell crops | Vendre la récolte | Selling vegetables is fine. Selling dogs never is. |
| Harvest | Récolter |  |
| Kitchen | Cuisine |  |
| Recipes | Recettes | Dog-safe only. |
| Cook a dish | Cuisiner un plat |  |
| spring / summer / autumn / winter | printemps / été / automne / hiver | The game follows the Japan calendar. |
| leaf festival | fête des feuilles | Autumn. |
| leaf pile | tas de feuilles |  |
| Costume parade | Défilé costumé |  |
| Halloween | Halloween | Spooky-cute only, nothing scary. |
| Snow Days | Jours de neige |  |
| Winter Lights | Lumières d'hiver |  |
| Ugly Sweater Contest | Concours du pull moche |  |
| New Year | Nouvel An |  |
| New Year card (nengajō) | carte de Nouvel An | The game says "New Year card"; nengajō only in a gloss. |
| Fortune box | Boîte à fortune | Shake it for a New Year fortune (an omikuji). |
| Decorate | Décorer |  |
| furniture | meubles |  |
| dog bed | panier |  |
| pack (your dogs) | petite bande | All your dogs together. |
| Make leader | Mettre devant | Button; avoids gendered "leader" nouns. |
| Photo mode | Mode photo |  |
| Dog Card | Carte toutou | Opt-in public cards. No free text. |
| visiting dog | chien en visite |  |
| Paw (given to a card) | papatte | One per card per Japan day. |
| Paw given today | Papatte donnée |  |
| Japan | Japon |  |
| Japan-style | à la japonaise | The safe word. Never "made in Japan". |
| Station | Gare | The town pin that starts the Tokyo Trip. |
| Tokyo | Tokyo | In names: Tokyo Tower stays as listed below. |
| Tokyo Trip | Voyage à Tokyo |  |
| Japan map | carte du Japon |  |
| Shinkansen | Shinkansen (train à grande vitesse) | Keep the word; gloss it once. |
| Tokyo Station | Gare de Tokyo |  |
| Shibuya Crossing | Carrefour de Shibuya |  |
| Hachikō | Hachikō | Keep the macron. Gloss: the statue of a famously loyal dog. Told warmly. |
| Yoyogi Park Dog Run | Espace chiens du parc Yoyogi |  |
| Asakusa / Sensō-ji | Asakusa / temple Sensō-ji | Keep the macron. |
| Tokyo Tower | Tour de Tokyo |  |
| Ueno Park | Parc d'Ueno |  |
| Odaiba Seaside | Bord de mer d'Odaiba |  |
| Mt. Fuji | mont Fuji |  |
| Mt. Fuji Lookout | Belvédère du mont Fuji |  |
| omikuji | omikuji (petit papier de bonne aventure) | Keep the word, gloss it once. Only happy fortunes. |
| otoshidama | otoshidama (enveloppe du Nouvel An) | Mrs. Plum gives it to the youngest dog. |
| kadomatsu | kadomatsu (décoration de pin) | New Year pine decoration. |
| happi coat | veste happi | Festival jacket. |
| mochi | mochi | Dog-safe version only. |
| Settings | Réglages |  |
| Sound | Son |  |
| Music | Musique |  |
| Sound effects | Effets sonores |  |
| Language | Langue | The language picker. Each language names itself: Español, Português (Brasil), Français, Deutsch, Bahasa Indonesia. |
| Log in | Se connecter |  |
| Play as guest | Jouer sans compte | Avoids gendered "invitado/convidado/invité". |
| Forgot your password? | Mot de passe oublié ? |  |
| Saved on this device | Sauvegardé sur cet appareil |  |
| Cloud save | Sauvegarde en ligne |  |
| Buy | Acheter |  |
| Cancel | Annuler |  |
| Close | Fermer |  |
| Back | Retour |  |
| Next | Suivant |  |
| Not now | Pas maintenant |  |
| Yes / No | Oui / Non |  |

### Breeds (35, `mods/genes.js` BREEDS order)

| Key | fr |
|---|---|
| `shiba` | Shiba inu |
| `corgi` | Corgi |
| `golden` | Golden retriever |
| `dachs` | Teckel |
| `husky` | Husky |
| `mutt` | Croisé |
| `chihuahua` | Chihuahua |
| `pug` | Carlin |
| `greyhound` | Lévrier anglais |
| `beagle` | Beagle |
| `poodle` | Caniche nain |
| `collie` | Border collie |
| `samoyed` | Samoyède |
| `frenchie` | Bouledogue français |
| `akita` | Akita inu |
| `spitz` | Spitz japonais |
| `pom` | Spitz nain (Loulou de Poméranie) |
| `afghan` | Lévrier afghan |
| `dane` | Dogue allemand |
| `mastiff` | Mastiff |
| `gsd` | Berger allemand |
| `dobie` | Dobermann |
| `corso` | Cane corso |
| `pitbull` | Pit-bull |
| `minpin` | Pinscher nain |
| `lab` | Labrador retriever |
| `malamute` | Malamute de l'Alaska |
| `chow` | Chow-chow |
| `stdpoodle` | Grand caniche |
| `schnauzer` | Schnauzer nain |
| `westie` | West highland white terrier |
| `yorkie` | Yorkshire terrier |
| `bichon` | Bichon à poil frisé |
| `maltese` | Bichon maltais |
| `shihtzu` | Shih tzu |

<!-- table:end -->

## 9. Site

`site/i18n/fr.json` (doodledoggo.app, v2.14). Decisions: the dog names stay English (the name puns are explained in the fun facts, e.g. "Butter veut dire « beurre » en anglais"); `card.type`, `profile.title_type` and `profile.alt` show `{breed}` without an article (avoids "le Akita"); `profile.pup_alt` is "{name}, version chiot" (`{article}` unused); the privacy page says the English version counts, in `privacy.updated`. Titles in the hand font write "Hachiko" without the macron, as the English does.
- Dog sexes are the same in every language (data: `sex` per dog in `tools/site_dogs.js`; note in `site/i18n/en.json` `_notes`). Girls (feminine adjectives and pronouns): Pepper (mutt), Mikan (pom), Saffron (afghan), Peaches (pitbull), Maple (malamute), Madeleine (stdpoodle), Toffee (yorkie), Meringue (bichon), Marshmallow (maltese). All others are boys (masculine). TODO(native): check that the feminine traits read naturally (douce, pleine d’espoir, jappeuse, petite cheffe, bavarde, pelucheuse, creuseuse, soyeuse, « une grosse chienne de traîneau », « une douce petite chienne de compagnie »).
- TODO(native): the tagline "Un chiot au crayon tout bancal à aimer" and "tout bancal" for "wobbly" across the site.
- TODO(native): jokes rewritten rather than translated: Cloud (samoyed) quote, Espresso (dobie) quote, Wonton (shihtzu) quote, Meringue (bichon) fun fact, Dumpling (pug) "grouik." for the snort.
- TODO(native): love items "muffin toutou" (pupcake), "gamelle puzzle" (puzzle feeder), "corde à tirer" (rope tug), "rapporter la balle" (fetch).
- TODO(native): "Carte toutou" written with a capital C in the privacy page sentences (the feature name).
- TODO(native): "JOUER SUR ITCH.IO" wraps to two lines on a 320 px phone (fine at 360 px). A shorter label would need to drop words.

## Game

Game strings: 7362 / 7362 keys (v2.14), site strings 865 / 865 (incl. the new /guide page). The 27 pronoun-var keys (eat, walk and potty lines) are written without pronouns or with a sex select where French needs one. TODO(native) lines from the translators:

- TODO(native) data.tk_lines.*: dog voice lines kept gender-neutral where possible (breed lines carry no sex); afghan/maltese stay feminine on purpose ("petite dame blanche"), check
- TODO(native) data.tk_lines.frenchie.shibuya: "*grouik*" for the snort (same as site Dumpling), TODO(native)
- TODO(native) vet.sum_carries / vet.pup_*: "des chiots {list2}" needs plural adjectives (bleus, roux ou dorés, bicolores, aux yeux bleus); vet.carry_* are nouns after "gènes cachés :"
- TODO(native) vet.coat_eyes: "yeux {eyes}" depends on how the eye colour words are translated elsewhere (blue -> bleus?)
- TODO(native) vet.fix_toast / vet.spay / vet.neuter: "collerette de dignité", "Stériliser / Castrer" button forms, check tone
- TODO(native) vet.painter_broke: "payé en pièces, pas en visibilité" rewrites the exposure joke
- TODO(native) data.food.*.n: names chosen here (Esquimau toutou glacé, Muffin toutou, Kinton toutou, Carottes façon candy corn); other agents' clothes/treasure names must match: Croquants de carotte, Brouillade d'épinards, casquette de gland, lunettes d'explorateur, collier de coquillages, imperméable, baies sauvages, Flairomètre
- TODO(native) mod.walk.*: Flairomètre (Nose-o-meter), Creuser !, Fouilles restantes, Se baisser (Duck) used as button labels; "Flaque !" for Soggy pop
- TODO(native) data.ny_zodiac.2027.animal: "Mouton" (French zodiac often says "chèvre")
- TODO(native) data.npc_boys.*: names kept English (Capitaine Waffles), per site decision
- TODO(native) fest.place_q / fest.wear_q / care.not_enough / care.seagull / care.climb_in: item names wrapped in « » because French articles/gender of item names are unknown
- TODO(native) cloud.err_code_expired: names the button "Envoyer un nouveau code"; must match reset.send_new (other agent)
- TODO(native) cloud.err_too_many_tries: same, button "Envoyer un nouveau code"
- TODO(native) cloud.err_email_taken: names the link "Mot de passe oublié" (matches cloud.forgot)
- TODO(native) newyear.gerald_text: "l'année du zodiaque : {animal}" kept neutral because data.ny_zodiac animal has no article/gender; check against that translation (Sheep 2027)
- TODO(native) popup.soon_card_html: "chariot à pousses" for Pip's Sprout Cart, must match data.shop_name.sprout (other agent)
- TODO(native) data.gd_lessons.shops_coin.3: "chariot à pousses de Pip", same as above
- TODO(native) data.perk.guard: "Capitaine Duvet" for Captain Fluff; check it matches the name elsewhere
- TODO(native) town.cafe_donut: "Donut toutou" (Doggy Donut); town.cafe_pupuccino kept "Pupuccino"
- TODO(native) town.route_hilltop/pier/town and town.place_*: check vs data.route_name / data.places from other agents ("Sentier de la colline", "Promenade de la jetée", "Boucle du village")
- TODO(native) photo.place_town: "Ville Doodle" (English "Doodle Town") vs town.map_title "Ville de Doodle Doggo"
- TODO(native) playdate.*: "en chaleurs" used for "in season"; "Prédicteur de chiots" for Puppy Predictor; ✓ dropped from ready_for_a_playdate (emoji check refused it)
- TODO(native) data.dc_breed_words: short French breed words used as dog names (Limier for Hound, Pit for Pittie, Dobi for Dobie)
- TODO(native) data.jr_grand: kept in English on purpose (mix pun names)
- TODO(native) data.words.*: coat colours built from one mapping (Foie, Sable for yellow lab, Poivre et sel, rouille for rust, feu for tan); native check
- TODO(native) data.wx_lines.* / breed_pers.*: breed voices avoid gendered adjectives on purpose (no sex arg); check tone
- TODO(native) data.eat_lines.{afghan,beagle,chihuahua,corgi,dachs,dobie,frenchie,golden,greyhound,husky,mutt,poodle,pug,samoyed,shiba,spitz,stdpoodle}: BLOCKED, 17 keys. tools/i18n_todo.js --merge requires the same arg names as English (his/He/he/His) but those are English pronoun strings; French drafts without them are refused. Finished French lines are in /tmp/claude-0/-home-user-paw-haven/319e6c61-e445-52b4-9f37-b3b581677652/scratchpad/pending_C_pron.json. Fix: let the validator ignore he/him/his/He/His (03_yard.js says translations use the sex select), then merge that file. Same trap likely in data.walk_lines / data.potty_lines / data.greet_lines.
- TODO(native) cards.name_pattern: I set it to "{b} {a}" and wrote data.dc_words_a as invariable "de soleil / de coton / chic" words (so any gender of the dc_words_b noun works). data.dc_words_b owner must keep nouns without articles ("Biscuit", "Étoile"); do not change the pattern back to "{a} {b}".
- TODO(native) data.starter_genes.*.coat and data.words: coat colour names must match (Roux, Fauve, Noir et feu, Chocolat (foie), Tricolore, Poivre et sel); I used "foie" for liver consistently (garden.fb_*, mod.genes.*).
- TODO(native) data.houses names used in data.spot_toast: "Cabane dans l'arbre" (Treehouse Den), "Niche du château royal" (Royal Castle Kennel): check data.houses agrees.
- TODO(native) data.extra_unsafe.raw_dough.swap: "Carrot Crunchies" written as "croquants de carotte": check data.food/recipes name.
- TODO(native) Terms invented: Nose-o-meter = Truffomètre (journal.treasures_hint); Captain Fluff = capitaine Houpette (matches an existing fr entry); Show off tab = Spectacle (train.tab_show); Master Breeder title = Maître des pelages; Friend of Doodle Doggo = Complice de Doodle Doggo; Great-Great-Granddog = Arrière-arrière-petit-chien.
- TODO(native) mod.genes.need_dapple: "dapple" kept as is; check against data.dapple_words (Teckel arlequin?).
- TODO(native) data.walk_lines.beagle / data.treasures: 'Nose-o-meter' translated 'Flairomètre' by D; check same word in mod.walk.nose_o_meter (other agent)
- TODO(native) 6 keys data.walk_lines.{afghan,maltese,poodle,shiba,spitz,westie}: merge refuses (English uses {his}/{he}/{him} vars, checker needs same arg names, sex select not allowed). French is ready in /tmp/claude-0/-home-user-paw-haven/319e6c61-e445-52b4-9f37-b3b581677652/scratchpad/held_D_pronouns.json, merge once tools/i18n_todo.js accepts a sex select there (their French avoids pronouns except westie which uses a sex select)
- TODO(native) Captain Fluff = 'capitaine Houpette' (others' choice), IOU = 'reconnaissance de dette'; journal.treasures_hint uses 'Truffomètre' but mod.walk uses 'Flairomètre' (not mine, should be unified)
- TODO(native) shop.put_decor: source passes raw English 'house'/'yard' as {room} (hoRoomOf in 28_home.js), so French shows it untranslated in parentheses; code should translate it
- TODO(native) data.potty_lines.poodle: English uses pronoun var {he}; the merge validator needs the same args, so not translated yet (needs the English sex-select fix). Draft: "{n} a choisi l'endroit le plus propre du jardin. Évidemment."
- TODO(native) data.potty_lines.shiba: English uses {his}; same blocker. Draft: "{n} a fait ses petites affaires, puis a fait comme si de rien n'était."
- TODO(native) data.potty_lines.stdpoodle: English uses {his}; same blocker. Draft: "{n} a fait son pipi très proprement et a regagné la maison au petit trot, la tête haute."
- TODO(native) data.potty_lines.westie: English uses {He}/{him}; same blocker. Draft: "{n} a fait son pipi et a envoyé de la terre derrière soi. De la terre partout. {sex, select, female {Elle est ravie.} other {Il est ravi.}}"
- TODO(native) Captain Fluff: I used "le capitaine Houpette" (lowercase capitaine, like garden.squirrel and data.breed_line.chihuahua) in data.jokes.5 and data.fluff_lines.*; data.perk.guard (other lane) says "Capitaine Duvet" and should be "capitaine Houpette".
- TODO(native) data.fav.<breed> (bare keys, e.g. data.fav.shiba): value is a recipe id (DISH_FAV) not display text; left identical to English on purpose.
- TODO(native) data.dc_words_b.*: all 40 card-name nouns chosen MASCULINE (Cristal, Gland, Nuage, Croissant, Souci, Raton...) so the A-list adjectives (data.dc_words_a, another agent) can be masculine/epicene forms: "Joyeux Biscuit". Meanings loosened where the French word is feminine (Dewdrop=Cristal, Otter=Raton, Waffle=Beignet, Bubble=Ballon, Moon=Croissant, Sock=Bas, Mitten=Chausson, Fern=Lierre, Comet=Météore).
- TODO(native): the Retour : {place} form is used for every Back to {place} button because the place name arrives as a var (no article agreement possible).
- TODO(native): mail.new_mail "Nouveau courrier : {title}" shows a capital after the colon when the title is a sentence ("Un colis de Mme Plum").
