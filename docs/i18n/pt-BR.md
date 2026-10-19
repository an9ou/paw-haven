# Doodle Doggo: Brazilian Portuguese (pt-BR) style guide

Language code `pt-BR`. Brazilian Portuguese (not European). Data: `game/i18n/glossary/pt-BR.json` (breeds, terms, bans). Anything marked `TODO(native)` needs a native speaker's check.

## 1. Tone

- Cozy, kind, simple, playful, a little bit "fofo". Short sentences a child can read.
- The crude crayon dogs are the joke. Each dog speaks in its breed's personality. Translate the joke, not the words; Brazilian humour is warm and a bit silly, and diminutives help a lot (filhotinho, cochilinho, patinha).
  - EN "Haircut optional. Dignity not." → "Tosa opcional. Dignidade, jamais."
  - EN "I am also bread-shaped. We are allies." → "Eu também tenho formato de pão. Somos aliados."
- Nothing bad ever happens. Soft words for everything.
- Barks and sounds: "Au au!", "auuu!" (Husky), "zzz", "grrr" (playful).

## 2. Register and address

- **você** everywhere, with third-person verbs: "Você tem 3 cartas novas", "Dê comida para a Luna". No tu (regional), no o senhor / a senhora.
- Possessives: "seu cachorro", "sua cachorra" (they agree with the dog, not the player). "Teu" is regional: avoid.
- Everyday Brazilian words, not European ones: "celular" not "telemóvel", "tela" not "ecrã", "time" not "equipa", "ônibus", "trem", "legal" (cool), "fofo" (cute).
- Brazilian spelling (the 2009 agreement): "ideia", "voo", "Ano-Novo", "cartão-postal".

## 3. Gender

**The player** is never given a gender. Rephrase:
- "Bem-vindo!" → "Boas-vindas!" or "Oi!"
- "Você está pronto?" → "Tudo pronto?"
- "Obrigado por jogar" (the speaker's gender) is fine from Gerald (he); from Mrs. Plum "Obrigada".
- "Jogar como convidado" → "Jogar sem conta"
- No "@", "x" or "-e" endings.

**Dogs:** cachorro / cachorra, the dog's articles follow its sex ("o Max", "a Luna": Brazilians put an article before names; it is natural and cosy). "Filhote" is one word for both sexes (o filhote). Use `select` when an adjective changes:
- `{sex, select, girl {A {name} está feliz e cansada.} other {O {name} está feliz e cansado.}}`
- Easier: pick adjectives that don't change: feliz, alegre, animado/animada is gendered, so "cheio de energia" works for both.
- Characters: Gerald (o pato), Mrs. Plum (dona Plum), Baker Bea (a padeira Bea). Pip and Dr. Paws have no stated gender: "Pip, da fazenda", "Dr. Patinhas", no gendered adjectives about them.

## 4. UI conventions

- **Quotes:** "aspas duplas" (“…”), ‘simples’ inside. No « ».
- **Punctuation:** like English, no space before ! ? : ; One "!" at a time.
- **Capitalization:** sentence case for titles, buttons and tabs ("Missões do dia", "Modo foto"). Place, shop and item names are names and capitalize the main words ("Parque Ensolarado", "Butique Au-Au", "Pedra Brilho"). Months and weekdays are lowercase ("18 de outubro", "domingo").
- **Numbers:** `Intl.NumberFormat('pt-BR')`: 1.000, 12.345, 1,5. Never hard-code separators.
- **Dates:** "18 de outubro", short "18 de out.". Festival windows follow the Japan date: say "horário do Japão" when needed. The seasons follow the Japan (northern) calendar, the opposite of Brazil's: write the season the game shows ("inverno" in December) and don't explain it.
- **Coins:** "+5 moedas", "Custa 30 moedas". The currency name "Moedas de Patinha" only as a name (HUD tooltip, shop header).
- **Buttons:** infinitive, like most Brazilian apps: "Salvar", "Cancelar", "Comprar", "Passear", "Dar comida". Tricks are the real dog commands in the imperative on purpose ("Senta", "Deita", "Dá a pata").
- **Length:** about 20–30% longer than English. Short forms for the phone care bar, tabs and buttons:

| English | Normal | Short (phone) |
|---|---|---|
| Feed | Dar comida | Comida |
| Pet | Fazer carinho | Carinho |
| Bath | Dar banho | Banho |
| Walk | Passear | Passeio |
| Play with a toy | Brincar com um brinquedo | Brincar |
| Daily missions | Missões do dia | Missões |
| Forgot your password? | Esqueceu a senha? | (same) |
| Not now | Agora não | Depois |

- **Plurals:** `Intl.PluralRules('pt-BR')` gives `one` (0 and 1!), `many` (millions) and `other`. Because 0 is `one`, always add `=0`: `{n, plural, =0 {Nenhum filhote ainda} one {# filhote} other {# filhotes}}`. `many` falls back to `other` if missing.

## 5. The owner's word rules in Portuguese

| Banned idea | Banned Portuguese | Say instead |
|---|---|---|
| "breed" as a verb | criar cães, criador de cães, criação de cães, cruzar cachorros, acasalar, acasalamento, procriar | um encontrinho, ter filhotes: "A Luna e o Max tiveram filhotes" |
| raising a dog | ("criar" is also "breed", so not for dogs) | cuidar: "Cuide do seu filhote", "Seu filhote está crescendo" |
| "stud" | reprodutor, padreador, garanhão, cobertura (mating sense) | (no word needed: "o pai", or the dog's name) |
| "litter price" | preço da ninhada, preço do filhote, valor do cachorro | nothing has a price: "de graça", "adotado de graça por uma família" |
| "sell" for dogs | vender filhotes, venda de cães, filhote à venda | doar para adoção, encontrar um novo lar: "Uma família adotou a Bolinha" |
| "made in Japan" | feito no Japão, fabricado no Japão | estilo japonês: "um cachecol estilo japonês" |
| franchises | Nintendo, Pokémon, Animal Crossing | (never mention) |

- "criar" also means "to create": "Criar conta", "Criar cartão" are fine; the ban only fires when a dog word follows ("criar cachorros").
- "Cruzamento de Shibuya" (the crossing) is fine. "Cobertura" is also icing on a pupcake: fine.
- "raça" (the noun) is fine. "Ninhada" (litter) is allowed as a noun but the game prefers "filhotes".
- Selling vegetables and shops are fine: "Vender colheita", "A Butique vende chapéus para cachorros", "ração de cachorro". The `sell` ban flags a sell word and a dog word in one sentence, except a dog word right after "para", "pra" or "de". If a shop line still trips it, split the sentence.

## 6. Japanese words

Keep the romanized words with the game's macrons; gloss once, in the same sentence:
- **Hachikō**: "a estátua do Hachikō, o cachorro mais fiel do Japão". Warm, never sad.
- **Sensō-ji**: "o templo Sensō-ji", in Asakusa.
- **Shinkansen**: "o Shinkansen, o trem-bala".
- **omikuji**: "um omikuji, um papelzinho da sorte". Every fortune is happy.
- **nengajō**: the game says "cartão de Ano-Novo"; "nengajō" only in a gloss.
- **otoshidama**: "um otoshidama, o envelope de Ano-Novo".
- **kadomatsu**, **happi**, **mochi**: keep and gloss ("enfeite de pinheiro", "casaco happi").
- Tokyo is "Tóquio", Japan "Japão", "Monte Fuji".

## 7. Care lessons

Two sentences, short, kind, true.
- EN "Blueberries are a safe berry for dogs. Grapes and raisins never are." → "Mirtilo é uma fruta segura para cachorros. Uva e uva-passa, nunca."
- EN "Plain cooked turkey, no onion or garlic. Those are poison for dogs." → "Peru cozido, sem cebola nem alho. Eles são veneno para cachorros."

## 8. Glossary

<!-- table:start (generated from game/i18n/glossary/pt-BR.json, edit both together) -->

### Terms (174)

| English | pt-BR | Note |
|---|---|---|
| Doodle Doggo | Doodle Doggo | The game title. Never translated. |
| dog | cachorro / cachorra | Boy dog / girl dog where the sentence needs it. "cachorro" in speech (Brazil). "cão / cães" in set names (Parque dos Cães). In Portugal "cachorro" means puppy: we write for Brazil. |
| puppy | filhote / filhotinho | The game says "pup" too: same word. "filhote" has one form for both sexes (o filhote). |
| breed (noun) | raça | The noun is fine everywhere. The verb is banned (see the word rules). |
| boy (dog) | menino | The Boy / Girl chip on the dog card. |
| girl (dog) | menina |  |
| Mum (of a puppy) | Mãe | In the family tree and puppy card. |
| Dad (of a puppy) | Pai |  |
| Mystery Pup | Filhote misterioso | Fallback dog name for an unknown breed. |
| Shelter Mutt | Vira-lata do abrigo | The mixed-breed starter dog. Warm, never a put-down. "vira-lata" is loved in Brazil (the "SRD" dog). |
| sketchbook | caderno de desenho | The look of the world. |
| crayon | giz de cera | The dogs are drawn in crayon: that is the joke. |
| Map | Mapa | The town map button. |
| Home Yard | Quintal | Not the veggie garden (see Garden). |
| Cozy House | Casa aconchegante |  |
| Sunny Park | Parque Ensolarado |  |
| Riverside | Beira-Rio | Gerald lives here. |
| Maple Woods | Bosque dos Bordos | TODO(native): "bordo" is the tree; "Bosque das Folhas Vermelhas" is a softer option. |
| Seashell Beach | Praia das Conchas |  |
| Market Street | Rua do Mercado |  |
| Town Square (the Square) | Praça da cidade (a Praça) | Festivals happen here. |
| Dog Park | Parque dos Cães | Visiting dogs and the Playdate Board. |
| Vet Clinic | Clínica veterinária | Short: Veterinario / Veterinário / Véto / Tierarzt / Dokter Hewan. |
| Grooming Salon | Banho e Tosa | "Banho e Tosa" is what Brazilian pet shops call it. |
| Shelter | Abrigo | The animal shelter. Only kind words about it. |
| Shelter Playroom | Brinquedoteca do Abrigo |  |
| bring home (from the shelter) | levar para casa |  |
| adopt | adotar |  |
| Kibble Corner | Cantinho da Ração | Food, toys and the Gene Sniffer. |
| Bow-Wow Boutique | Butique Au-Au | The clothes shop. Use the local bark. |
| Barkitecture | Auquitetura | Doghouses and furniture. A pun: keep a pun. |
| Harvest Stall | Barraca da Colheita | Baker Bea, autumn. |
| Winter Stall | Barraca de Inverno | Baker Bea, winter. |
| Pumpkin Patch Pop-up | Lojinha da Abóbora | Halloween 2026 only. |
| Gene Sniffer | Fareja-Genes | A gadget, said with a wink. |
| Gerald the duck | o pato Gerald | The guide. Keep the name. Speaks a bit grand, always kind. |
| Mrs. Plum | dona Plum | The kind neighbour who writes letters. |
| Baker Bea | a padeira Bea | Runs the festival stalls. |
| Pip the farmer | Pip, da fazenda | Gave you the seeds. Gender is not stated: keep it neutral. |
| Dr. Paws | Dr. Patinhas | The vet. Gender is not stated: write "Dr." and avoid gendered adjectives. |
| Old Mr. Reyes | seu Reyes |  |
| Feed | Dar comida | Button. Short: Comida / Comida / Manger / Futter / Makan. |
| Pet (verb) | Fazer carinho | Button. Short: Mimos / Carinho / Câlin / Kraulen / Elus. |
| Bath | Dar banho | Button. Short noun: Baño / Banho / Bain / Bad / Mandi. |
| Walk | Passear | Walks are the main income. Noun: paseo / passeio / balade / Gassirunde / jalan-jalan. |
| Train (tricks) | Treinar | Trick training is play, never strict. |
| Nap | Soneca |  |
| Potty | Xixi | Cute and short. Never crude. |
| Play | Brincar |  |
| Ball play | Brincar de bola | Coins per return. |
| Brush | Escovar |  |
| Clean up | Limpar | After a potty in the yard. |
| treat | petisco |  |
| Food (tab) | Comida |  |
| Toys | Brinquedos |  |
| Clothes | Roupas |  |
| Houses (doghouses) | Casinhas |  |
| Wardrobe | Guarda-roupa |  |
| Zoomies | Loucurinha | A sudden happy sprint. |
| Hunger | Fome | Stat bar label. |
| Happiness | Alegria | Stat bar label. |
| Energy | Energia | Stat bar label. |
| Cleanliness | Limpeza | Stat bar label. |
| Bond | Carinho | How close you and your dog are. |
| Bond level | Nível de carinho |  |
| Bond points | pontos de carinho |  |
| Paw Coins | Moedas de Patinha | The currency name. |
| coins | moedas | Plain word in sentences: "+5 coins". |
| Sit | Senta | Trick names use the real local dog commands. |
| Paw (trick) | Dá a pata |  |
| Spin | Gira |  |
| Speak | Fala |  |
| Roll Over | Rola |  |
| Play Dead | Finge que dorme | The game shows a comic faint. Softer words are fine. |
| Lie Down | Deita |  |
| Dance | Dança |  |
| Tricks | Truques | Journal tab and training. |
| Puppy Playdate | Encontrinho | Two grown-up dogs meet; puppies may follow. The kind word for the whole feature. TODO(native). |
| playdate | encontrinho |  |
| Playdate Board | Mural de encontrinhos | At the Dog Park. |
| Puppies on the way | Filhotes a caminho |  |
| expecting (puppies) | esperando filhotes | Use this, not medical words. |
| nursery | berçário |  |
| Who stays? | Quem fica? | Choosing which puppy stays home. |
| new home | novo lar | "Ready for new homes today!" |
| adopted out free to a family | adotado de graça por uma família | The only way puppies leave. Never a price. Also: "doar para adoção" (the usual Brazilian phrase for free adoption). |
| family (adoptive) | família | Named families who write postcards. |
| family tree | árvore da família |  |
| spayed / neutered | castrada / castrado | Vet option. Calm and plain. |
| Gene test | Teste genético | At the Vet Clinic. |
| coat | pelagem | Coat colours and patterns (genetics). |
| Sparkle | Brilho | A rare cosmetic shine. Never paid for. |
| Sparkle pup | filhote Brilho |  |
| Sparkle Stone | Pedra Brilho |  |
| Journal | Diário |  |
| Mailbox | Caixa de correio |  |
| letter | carta |  |
| postcard | cartão-postal | Also what photo mode makes. |
| gift | presente |  |
| Daily missions | Missões do dia |  |
| mission | missão |  |
| stamp | carimbo | Mission stamps and the Tokyo stamps are the same word. "selo" is a postage stamp; these are rubber stamps. |
| Stamp book | Caderno de carimbos | Seven stamps in Tokyo. |
| Treasure Map | Mapa do tesouro |  |
| Map Piece | Pedaço do mapa |  |
| treasure | tesouro | Found on walks, never sold. |
| Garden (veggie patch) | Horta | Not the yard. |
| Seeds | Sementes |  |
| crop | colheita |  |
| Sell crops | Vender colheita | Selling vegetables is fine. Selling dogs never is. |
| Harvest | Colher |  |
| Kitchen | Cozinha |  |
| Recipes | Receitas | Dog-safe only. |
| Cook a dish | Cozinhar um prato |  |
| spring / summer / autumn / winter | primavera / verão / outono / inverno | The game follows the Japan calendar. |
| leaf festival | festa das folhas | Autumn. |
| leaf pile | montinho de folhas |  |
| Costume parade | Desfile de fantasias |  |
| Halloween | Halloween | Spooky-cute only, nothing scary. "Dia das Bruxas" also works. |
| Snow Days | Dias de neve |  |
| Winter Lights | Luzes de inverno |  |
| Ugly Sweater Contest | Concurso do Suéter Feio |  |
| New Year | Ano-Novo |  |
| New Year card (nengajō) | cartão de Ano-Novo | The game says "New Year card"; nengajō only in a gloss. |
| Fortune box | Caixinha da sorte | Shake it for a New Year fortune (an omikuji). |
| Decorate | Decorar |  |
| furniture | móveis |  |
| dog bed | caminha |  |
| pack (your dogs) | turminha | All your dogs together. "matilha" is correct but sounds wild; "turminha" is cosy. TODO(native). |
| Make leader | Ir na frente | Button; avoids gendered "leader" nouns. |
| Photo mode | Modo foto |  |
| Dog Card | Cartão do cachorro | Opt-in public cards. No free text. |
| visiting dog | cachorro visitante |  |
| Paw (given to a card) | patinha | One per card per Japan day. |
| Paw given today | Patinha dada hoje |  |
| Japan | Japão |  |
| Japan-style | estilo japonês | The safe word. Never "made in Japan". |
| Station | Estação | The town pin that starts the Tokyo Trip. |
| Tokyo | Tóquio | In names: Tokyo Tower stays as listed below. |
| Tokyo Trip | Viagem a Tóquio |  |
| Japan map | mapa do Japão |  |
| Shinkansen | Shinkansen (trem-bala) | Keep the word; gloss it once. |
| Tokyo Station | Estação de Tóquio |  |
| Shibuya Crossing | Cruzamento de Shibuya |  |
| Hachikō | Hachikō | Keep the macron. Gloss: the statue of a famously loyal dog. Told warmly. |
| Yoyogi Park Dog Run | Cachorródromo do Parque Yoyogi |  |
| Asakusa / Sensō-ji | Asakusa / templo Sensō-ji | Keep the macron. |
| Tokyo Tower | Torre de Tóquio |  |
| Ueno Park | Parque Ueno |  |
| Odaiba Seaside | Orla de Odaiba |  |
| Mt. Fuji | Monte Fuji |  |
| Mt. Fuji Lookout | Mirante do Monte Fuji |  |
| omikuji | omikuji (papelzinho da sorte) | Keep the word, gloss it once. Only happy fortunes. |
| otoshidama | otoshidama (envelope de Ano-Novo) | Mrs. Plum gives it to the youngest dog. |
| kadomatsu | kadomatsu (enfeite de pinheiro) | New Year pine decoration. |
| happi coat | casaco happi | Festival jacket. |
| mochi | mochi | Dog-safe version only. |
| Settings | Configurações |  |
| Sound | Som |  |
| Music | Música |  |
| Sound effects | Efeitos sonoros |  |
| Language | Idioma | The language picker. Each language names itself: Español, Português (Brasil), Français, Deutsch, Bahasa Indonesia. |
| Log in | Entrar |  |
| Play as guest | Jogar sem conta | Avoids gendered "invitado/convidado/invité". |
| Forgot your password? | Esqueceu a senha? |  |
| Saved on this device | Salvo neste aparelho |  |
| Cloud save | Salvamento na nuvem |  |
| Buy | Comprar |  |
| Cancel | Cancelar |  |
| Close | Fechar |  |
| Back | Voltar |  |
| Next | Próximo |  |
| Not now | Agora não |  |
| Yes / No | Sim / Não |  |

### Breeds (35, `mods/genes.js` BREEDS order)

| Key | pt-BR |
|---|---|
| `shiba` | Shiba inu |
| `corgi` | Corgi |
| `golden` | Golden retriever |
| `dachs` | Dachshund |
| `husky` | Husky |
| `mutt` | Vira-lata |
| `chihuahua` | Chihuahua |
| `pug` | Pug |
| `greyhound` | Galgo inglês |
| `beagle` | Beagle |
| `poodle` | Poodle miniatura |
| `collie` | Border collie |
| `samoyed` | Samoieda |
| `frenchie` | Buldogue francês |
| `akita` | Akita inu |
| `spitz` | Spitz japonês |
| `pom` | Lulu da Pomerânia |
| `afghan` | Galgo afegão |
| `dane` | Dogue alemão |
| `mastiff` | Mastiff inglês |
| `gsd` | Pastor-alemão |
| `dobie` | Dobermann |
| `corso` | Cane corso |
| `pitbull` | Pit bull |
| `minpin` | Pinscher miniatura |
| `lab` | Labrador retriever |
| `malamute` | Malamute-do-alasca |
| `chow` | Chow-chow |
| `stdpoodle` | Poodle standard |
| `schnauzer` | Schnauzer miniatura |
| `westie` | West highland white terrier |
| `yorkie` | Yorkshire terrier |
| `bichon` | Bichon frisé |
| `maltese` | Maltês |
| `shihtzu` | Shih-tzu |

<!-- table:end -->

## Site

doodledoggo.app strings: `site/i18n/pt-BR.json` (v2.14 phase 1b, all keys done).

- TODO(native): "wobbly crayon pup" is "filhotinho tortinho (de giz de cera)" (tagline, alt texts). Check that it reads as cute.
- Dog sexes are the same in every language (data: `sex` per dog in `tools/site_dogs.js`; note in `site/i18n/en.json` `_notes`). Girls: Pepper (mutt), Mikan (pom), Saffron (afghan), Peaches (pitbull), Maple (malamute), Madeleine (stdpoodle), Toffee (yorkie), Meringue (bichon), Marshmallow (maltese). All others are boys. The grammatical gender and the article before the name agree with that.
- TODO(native): the favourite things use these item names: patê de salmão, osso de pelúcia, cupcake canino, comedouro interativo, biscoito de ossinho, patinho de apito, cabo de guerra, ração, cafuné (petting), hora da comida. Phase 2 (game strings) must use the same names, or the site must follow the game's.
- TODO(native): barks: "hmpf." (Shiba, smug), "ronc." (snort), "own..." (aww), "tcharam!" (ta-da), "vem, turma!" (Collie).
- TODO(native): "manteiga derretida" (Dobermann, softie), "chuquinha" (topknot, Maltese and Shih-tzu), "rebolante" (Pit bull, wiggly), the Shih-tzu quote "Chuquinha em pé. Soneca deitada." (a new pun for "Top-knot up. Nap time down.").
- TODO(native): the nav chips are "Conheça a turma" and "Cães no Japão" (short for the phone). The section title stays "Cachorros no Japão".
- Site titles say "Hachiko" without the macron, like the English page: Caveat (the title face) may lack ō. Running text keeps "Hachikō".
- The privacy page says that the English version counts if the two differ (in `privacy.updated`, the small line under the title).
