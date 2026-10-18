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
