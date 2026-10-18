# Doodle Doggo: Spanish (es) style guide

Language code `es`. One neutral, international Spanish that reads naturally in Spain and in Latin America. Data: `game/i18n/glossary/es.json` (breeds, terms, bans). Anything marked `TODO(native)` needs a native speaker's check.

## 1. Tone

- Cozy, kind, simple, playful. Short sentences. A child of 8 should be able to read every line.
- The crude crayon dogs are the joke. Each dog talks in its breed's personality: the Shiba is proud, the Pug is lazy, the Chihuahua is bossy. Translate the joke, not the words. If a pun doesn't work in Spanish, write a new Spanish joke with the same feeling.
  - EN "Haircut optional. Dignity not." → "El corte de pelo, opcional. La dignidad, no."
  - EN "I am also bread-shaped. We are allies." → "Yo también tengo forma de pan. Somos aliados."
- Nothing bad ever happens: no fear, no illness, no sad endings. Soft words for everything.
- Barks and sounds: "¡Guau!", "guau guau", "grr" (playful), "zzz", "¡auuu!" for the Husky.

## 2. Register and address

- **tú** everywhere, including menus, the account screens and the privacy page. Use the neutral tú forms (no vos, no vosotros): "Dale de comer a Luna", "Tienes 3 cartas nuevas".
- Plural "you" (rare): rephrase with "todos" or "tu manada" instead of vosotros / ustedes.
- Avoid regional words. Prefer the word both sides of the ocean know: "ordenador / computadora" → "dispositivo". Never "coger" (rude in much of Latin America): use "tomar", "llevar", "recoger" (pick up after a potty), "atrapar" (catch the ball).
  - Spain-only to avoid: chuche, guay, caseta, pienso (in names), vale (as a button).
  - Latin-America-only to avoid: chévere, padre (= cool), plata (= money), carro.

## 3. Gender

**The player** is never given a gender. Rephrase instead of using "-o/-a", "@", "x" or "-e":
- "¡Bienvenido!" → "¡Te damos la bienvenida!" or "¡Hola!"
- "¿Estás listo?" → "¿Todo listo?"
- "Eres el mejor dueño" → "Eres lo mejor para tu perro"
- "Jugar como invitado" → "Jugar sin cuenta"

**Dogs** are boys and girls, and Spanish agrees with them. The game passes the dog's sex, so use `select`:
- `{sex, select, girl {¡{name} está contenta!} other {¡{name} está contento!}}`
- Prefer adjectives that don't change: feliz, alegre, valiente, dormilón/dormilona is gendered, so "con sueño" is easier. "¡{name} está feliz!" needs no select.
- Nouns: perro / perra, cachorro / cachorra (cachorrito / cachorrita). "El perro" for a dog of unknown sex.
- Characters: Gerald (el pato, he), Mrs. Plum (la señora Plum, she), Baker Bea (she). Pip and Dr. Paws have no stated gender: "Pip, de la granja", "Dr. Patitas", and avoid adjectives about them.

## 4. UI conventions

- **Opening marks:** always "¡...!" and "¿...?": "¡Hola!", "¿Quién se queda?". A question inside a sentence opens where the question starts: "Luna, ¿un paseo?"
- **Quotes:** « » for quotes inside text (RAE first choice), "…" inside them if nested. Item names in running text need no quotes; capitalize them as names: "Compraste el Sombrero de Mago".
- **Capitalization:** sentence case for titles, buttons and tabs: "Misiones del día", "Modo foto", "Jugar a la pelota". Place, shop and item names are proper names and capitalize the main words: "Parque Soleado", "Boutique Guau Guau", "Piedra Destello". Days and months are lowercase: "lunes", "18 de octubre".
- **Numbers:** `Intl.NumberFormat('es')`: 12.345 and 1,5. Note that Spanish leaves four-digit numbers ungrouped: 1000, 2500 (the formatter does this). Never hard-code separators.
- **Dates:** "18 de octubre", short "18 oct". The festival windows are by Japan date; say "hora de Japón" when it matters.
- **Coins:** "+5 monedas", "Cuesta 30 monedas". The currency name is "Monedas Pata" when it appears as a name (shop header, HUD tooltip).
- **Buttons:** infinitive, as most Spanish software does: "Guardar", "Cancelar", "Dar de comer", "Pasear", "Comprar". Dog-command tricks are imperatives on purpose ("Échate", "Baila").
- **Length:** Spanish runs about 20–30% longer than English. Buttons that must fit a phone (the care bar, the buy box, tabs) have short forms:

| English | Normal | Short (phone) |
|---|---|---|
| Feed | Dar de comer | Comida |
| Pet | Acariciar | Mimos |
| Bath | Bañar | Baño |
| Walk | Pasear | Paseo |
| Play with a toy | Jugar con un juguete | Jugar |
| Log in | Iniciar sesión | Entrar |
| Daily missions | Misiones del día | Misiones |
| Not now | Ahora no | Luego |

- **Plurals:** `Intl.PluralRules('es')` gives `one`, `many` (only for millions: "1.000.000 de monedas") and `other`. Always write `one` and `other`; `many` is optional (missing falls back to `other`). Use `=0` for nicer zero lines: `{n, plural, =0 {Aún no hay cachorros} one {# cachorro} other {# cachorros}}`.

## 5. The owner's word rules in Spanish

| Banned idea | Banned Spanish | Say instead |
|---|---|---|
| "breed" as a verb | criar perros, criador, criadero, cruzar perros, aparear, apareamiento, reproducir perros | una cita perruna, tener cachorros, "Luna y Max tuvieron cachorros" |
| raising a dog | (criar is also "to raise", so it is out) | cuidar, cuidar de, crecer: "Cuida de tu cachorro", "Tu cachorro crece" |
| "stud" | semental, macho reproductor, monta | (no word needed: the dad is "Papá" or the dog's name) |
| "litter price" | precio de la camada, precio del cachorro | nothing has a price: "gratis", "adoptado gratis por una familia" |
| "sell" for dogs | vender perros/cachorros, venta de cachorros, se vende cachorro | dar en adopción gratis, encontrar un nuevo hogar, "Una familia adopta a Bolita" |
| "made in Japan" | hecho en Japón, fabricado en Japón | estilo japonés: "una bufanda de estilo japonés" |
| franchises | Nintendo, Pokémon, Animal Crossing | (never mention) |

- "raza" (the noun, a dog breed) is fine. "camada" (a litter) is allowed as a noun but the game prefers "cachorros".
- Selling vegetables and shops selling things are fine: "Vender cosecha", "La Boutique vende gorros para perros". The `sell` ban (like the English test) flags a sell word and a dog word in the same sentence, except a dog word right after "para" / "de" ("para perros", "juguetes de perro"). If a shop line trips it, split the sentence.
- "cruzar" is fine for streets: "cruza el Cruce de Shibuya con tu perro".

## 6. Japanese words

Keep the romanized words with the game's macrons and gloss them once, in the same sentence, the first time they appear:
- **Hachikō** (with ō): "la estatua de Hachikō, el perro más fiel de Japón". Tell his story warmly (he waited every day for his person); never sad.
- **Sensō-ji** in Asakusa: "el templo Sensō-ji".
- **Shinkansen**: "el Shinkansen, el tren bala".
- **omikuji**: "un omikuji, un papelito de la suerte". In the game every fortune is a happy one.
- **nengajō**: the game says "tarjeta de Año Nuevo"; "nengajō" only in a gloss.
- **otoshidama**: "el otoshidama, un sobre de Año Nuevo".
- **kadomatsu**, **happi**, **mochi**: keep the word, gloss with "(adorno de pino)", "chaqueta happi", "mochi".
- Tokyo is "Tokio" in running text; place names in the table below. "Monte Fuji" in a title, "el monte Fuji" in a sentence.

## 7. Care lessons

The blocks are short, kind, two-sentence lessons. Keep them exactly two sentences, simple and true (food safety: nothing toxic to dogs).
- EN "Blueberries are a safe berry for dogs. Grapes and raisins never are." → "Los arándanos son una fruta segura para los perros. Las uvas y las pasas, nunca."
- EN "Plain cooked turkey, no onion or garlic. Those are poison for dogs." → "Pavo cocido, sin cebolla ni ajo. Son veneno para los perros."
- Name the food plainly (uvas, pasas, chocolate, cebolla, ajo, nueces de macadamia) so the lesson is true and clear; keep the voice calm.

## 8. Glossary

<!-- table:start (generated from game/i18n/glossary/es.json, edit both together) -->

### Terms (174)

| English | es | Note |
|---|---|---|
| Doodle Doggo | Doodle Doggo | The game title. Never translated. |
| dog | perro / perra | Boy dog / girl dog where the sentence needs it. |
| puppy | cachorro / cachorrito | The game says "pup" too: same word. "cachorro" is the neutral word in Spain and Latin America. "perrito" works for "doggy". |
| breed (noun) | raza | The noun is fine everywhere. The verb is banned (see the word rules). |
| boy (dog) | niño | The Boy / Girl chip on the dog card. |
| girl (dog) | niña |  |
| Mum (of a puppy) | Mamá | In the family tree and puppy card. |
| Dad (of a puppy) | Papá |  |
| Mystery Pup | Cachorro misterioso | Fallback dog name for an unknown breed. |
| Shelter Mutt | Mestizo del refugio | The mixed-breed starter dog. Warm, never a put-down. |
| sketchbook | cuaderno de dibujo | The look of the world. |
| crayon | cera de colores | The dogs are drawn in crayon: that is the joke. TODO(native): "crayón" is Latin America, "cera" is Spain. "cera de colores" reads in both. |
| Map | Mapa | The town map button. |
| Home Yard | Patio de casa | Not the veggie garden (see Garden). |
| Cozy House | Casa acogedora |  |
| Sunny Park | Parque Soleado |  |
| Riverside | La Ribera | Gerald lives here. |
| Maple Woods | Bosque de los Arces |  |
| Seashell Beach | Playa Caracola |  |
| Market Street | Calle del Mercado |  |
| Town Square (the Square) | Plaza del pueblo (la Plaza) | Festivals happen here. |
| Dog Park | Parque Perruno | Visiting dogs and the Playdate Board. |
| Vet Clinic | Clínica veterinaria | Short: Veterinario / Veterinário / Véto / Tierarzt / Dokter Hewan. |
| Grooming Salon | Peluquería canina |  |
| Shelter | Refugio | The animal shelter. Only kind words about it. |
| Shelter Playroom | Sala de juegos del refugio |  |
| bring home (from the shelter) | llevar a casa |  |
| adopt | adoptar |  |
| Kibble Corner | Rincón Croqueta | Food, toys and the Gene Sniffer. TODO(native): Spain says "pienso", Latin America "croquetas"; "croqueta" reads in both. |
| Bow-Wow Boutique | Boutique Guau Guau | The clothes shop. Use the local bark. |
| Barkitecture | Guauquitectura | Doghouses and furniture. A pun: keep a pun. |
| Harvest Stall | Puesto de la Cosecha | Baker Bea, autumn. |
| Winter Stall | Puesto de Invierno | Baker Bea, winter. |
| Pumpkin Patch Pop-up | Tiendita de las Calabazas | Halloween 2026 only. |
| Gene Sniffer | Olfateagenes | A gadget, said with a wink. |
| Gerald the duck | el pato Gerald | The guide. Keep the name. Speaks a bit grand, always kind. |
| Mrs. Plum | la señora Plum (Sra. Plum) | The kind neighbour who writes letters. |
| Baker Bea | Bea la panadera | Runs the festival stalls. |
| Pip the farmer | Pip, de la granja | Gave you the seeds. Gender is not stated: keep it neutral. |
| Dr. Paws | Dr. Patitas | The vet. Gender is not stated: write "Dr." and avoid gendered adjectives. |
| Old Mr. Reyes | don Reyes |  |
| Feed | Dar de comer | Button. Short: Comida / Comida / Manger / Futter / Makan. |
| Pet (verb) | Acariciar | Button. Short: Mimos / Carinho / Câlin / Kraulen / Elus. |
| Bath | Bañar | Button. Short noun: Baño / Banho / Bain / Bad / Mandi. |
| Walk | Pasear | Walks are the main income. Noun: paseo / passeio / balade / Gassirunde / jalan-jalan. |
| Train (tricks) | Entrenar | Trick training is play, never strict. |
| Nap | Siesta |  |
| Potty | Pipí | Cute and short. Never crude. |
| Play | Jugar |  |
| Ball play | Jugar a la pelota | Coins per return. |
| Brush | Cepillar |  |
| Clean up | Recoger | After a potty in the yard. |
| treat | premio | Not "chuche" (Spain only). |
| Food (tab) | Comida |  |
| Toys | Juguetes |  |
| Clothes | Ropa |  |
| Houses (doghouses) | Casitas | "caseta" is Spain only; "casita" reads in both. |
| Wardrobe | Armario |  |
| Zoomies | Carreritas locas | A sudden happy sprint. |
| Hunger | Hambre | Stat bar label. |
| Happiness | Felicidad | Stat bar label. |
| Energy | Energía | Stat bar label. |
| Cleanliness | Limpieza | Stat bar label. |
| Bond | Cariño | How close you and your dog are. |
| Bond level | Nivel de cariño |  |
| Bond points | puntos de cariño |  |
| Paw Coins | Monedas Pata | The currency name. |
| coins | monedas | Plain word in sentences: "+5 coins". |
| Sit | Sentado | Trick names use the real local dog commands. |
| Paw (trick) | La pata |  |
| Spin | Vuelta |  |
| Speak | Habla |  |
| Roll Over | Rueda |  |
| Play Dead | Hazte el dormido | The game shows a comic faint. Softer words are fine. |
| Lie Down | Échate |  |
| Dance | Baila |  |
| Tricks | Trucos | Journal tab and training. |
| Puppy Playdate | Cita perruna | Two grown-up dogs meet; puppies may follow. The kind word for the whole feature. |
| playdate | cita |  |
| Playdate Board | Tablón de citas | At the Dog Park. |
| Puppies on the way | Cachorros en camino |  |
| expecting (puppies) | esperando cachorros | Use this, not medical words. |
| nursery | cuarto de los cachorros |  |
| Who stays? | ¿Quién se queda? | Choosing which puppy stays home. |
| new home | nuevo hogar | "Ready for new homes today!" |
| adopted out free to a family | adoptado gratis por una familia | The only way puppies leave. Never a price. Also: "dar en adopción gratis". |
| family (adoptive) | familia | Named families who write postcards. |
| family tree | árbol familiar |  |
| spayed / neutered | esterilizada / castrado | Vet option. Calm and plain. |
| Gene test | Prueba genética | At the Vet Clinic. |
| coat | pelaje | Coat colours and patterns (genetics). |
| Sparkle | Destello | A rare cosmetic shine. Never paid for. |
| Sparkle pup | cachorro Destello |  |
| Sparkle Stone | Piedra Destello |  |
| Journal | Diario |  |
| Mailbox | Buzón |  |
| letter | carta |  |
| postcard | postal | Also what photo mode makes. TODO(native): "la postal" (Spain) / "la tarjeta postal" (both). |
| gift | regalo |  |
| Daily missions | Misiones del día |  |
| mission | misión |  |
| stamp | sello | Mission stamps and the Tokyo stamps are the same word. |
| Stamp book | Cuaderno de sellos | Seven stamps in Tokyo. |
| Treasure Map | Mapa del tesoro |  |
| Map Piece | Trozo de mapa |  |
| treasure | tesoro | Found on walks, never sold. |
| Garden (veggie patch) | Huerto | Not the yard. |
| Seeds | Semillas |  |
| crop | cosecha |  |
| Sell crops | Vender cosecha | Selling vegetables is fine. Selling dogs never is. |
| Harvest | Cosechar |  |
| Kitchen | Cocina |  |
| Recipes | Recetas | Dog-safe only. |
| Cook a dish | Cocinar un plato |  |
| spring / summer / autumn / winter | primavera / verano / otoño / invierno | The game follows the Japan calendar. |
| leaf festival | fiesta de las hojas | Autumn. |
| leaf pile | montón de hojas |  |
| Costume parade | Desfile de disfraces |  |
| Halloween | Halloween | Spooky-cute only, nothing scary. |
| Snow Days | Días de nieve |  |
| Winter Lights | Luces de invierno |  |
| Ugly Sweater Contest | Concurso del suéter feo | TODO(native): Spain says "jersey"; "suéter" reads in both. |
| New Year | Año Nuevo |  |
| New Year card (nengajō) | tarjeta de Año Nuevo | The game says "New Year card"; nengajō only in a gloss. |
| Fortune box | Caja de la suerte | Shake it for a New Year fortune (an omikuji). |
| Decorate | Decorar |  |
| furniture | muebles |  |
| dog bed | cama |  |
| pack (your dogs) | manada | All your dogs together. |
| Make leader | Poner delante | Button; avoids gendered "leader" nouns. |
| Photo mode | Modo foto |  |
| Dog Card | Tarjeta perruna | Opt-in public cards. No free text. |
| visiting dog | perro de visita |  |
| Paw (given to a card) | patita | One per card per Japan day. |
| Paw given today | Patita dada hoy |  |
| Japan | Japón |  |
| Japan-style | estilo japonés | The safe word. Never "made in Japan". |
| Station | Estación | The town pin that starts the Tokyo Trip. |
| Tokyo | Tokio | In names: Tokyo Tower stays as listed below. |
| Tokyo Trip | Viaje a Tokio |  |
| Japan map | mapa de Japón |  |
| Shinkansen | Shinkansen (tren bala) | Keep the word; gloss it once. |
| Tokyo Station | Estación de Tokio |  |
| Shibuya Crossing | Cruce de Shibuya |  |
| Hachikō | Hachikō | Keep the macron. Gloss: the statue of a famously loyal dog. Told warmly. |
| Yoyogi Park Dog Run | Zona canina del parque Yoyogi |  |
| Asakusa / Sensō-ji | Asakusa / templo Sensō-ji | Keep the macron. |
| Tokyo Tower | Torre de Tokio |  |
| Ueno Park | Parque Ueno |  |
| Odaiba Seaside | Costa de Odaiba |  |
| Mt. Fuji | monte Fuji |  |
| Mt. Fuji Lookout | Mirador del monte Fuji |  |
| omikuji | omikuji (papelito de la suerte) | Keep the word, gloss it once. Only happy fortunes. |
| otoshidama | otoshidama (sobre de Año Nuevo) | Mrs. Plum gives it to the youngest dog. |
| kadomatsu | kadomatsu (adorno de pino) | New Year pine decoration. |
| happi coat | chaqueta happi | Festival jacket. |
| mochi | mochi | Dog-safe version only. |
| Settings | Ajustes |  |
| Sound | Sonido |  |
| Music | Música |  |
| Sound effects | Efectos de sonido |  |
| Language | Idioma | The language picker. Each language names itself: Español, Português (Brasil), Français, Deutsch, Bahasa Indonesia. |
| Log in | Entrar |  |
| Play as guest | Jugar sin cuenta | Avoids gendered "invitado/convidado/invité". |
| Forgot your password? | ¿Olvidaste tu contraseña? |  |
| Saved on this device | Guardado en este dispositivo |  |
| Cloud save | Guardado en la nube |  |
| Buy | Comprar |  |
| Cancel | Cancelar |  |
| Close | Cerrar |  |
| Back | Volver |  |
| Next | Siguiente |  |
| Not now | Ahora no |  |
| Yes / No | Sí / No |  |

### Breeds (35, `mods/genes.js` BREEDS order)

| Key | es |
|---|---|
| `shiba` | Shiba inu |
| `corgi` | Corgi |
| `golden` | Golden retriever |
| `dachs` | Teckel |
| `husky` | Husky |
| `mutt` | Mestizo |
| `chihuahua` | Chihuahua |
| `pug` | Carlino |
| `greyhound` | Galgo inglés |
| `beagle` | Beagle |
| `poodle` | Caniche mini |
| `collie` | Border collie |
| `samoyed` | Samoyedo |
| `frenchie` | Bulldog francés |
| `akita` | Akita inu |
| `spitz` | Spitz japonés |
| `pom` | Pomerania |
| `afghan` | Lebrel afgano |
| `dane` | Gran danés |
| `mastiff` | Mastín inglés |
| `gsd` | Pastor alemán |
| `dobie` | Dóberman |
| `corso` | Cane corso |
| `pitbull` | Pit bull |
| `minpin` | Pinscher miniatura |
| `lab` | Labrador retriever |
| `malamute` | Malamute de Alaska |
| `chow` | Chow chow |
| `stdpoodle` | Caniche grande |
| `schnauzer` | Schnauzer miniatura |
| `westie` | West highland white terrier |
| `yorkie` | Yorkshire terrier |
| `bichon` | Bichón frisé |
| `maltese` | Bichón maltés |
| `shihtzu` | Shih tzu |

<!-- table:end -->
