# 35-breeds Reel: auto-reply template for a bot (Grok) (7 Nov 2026)

Owner, 7 Nov 2026: "send me a template for grok bot to reply the 35 dogs reels. One version is we already have and another version of the dogs we dont have. Please list the dogs we launched, and the dogs we will launch". The hand-written replies per breed stay in `BREEDS_REEL_REPLIES.md`; this is the same thing as fill-in templates, plus one prompt to paste into the bot.

## The two templates

**A. We have the breed** (fill in the brackets from the list below)

```
Your [breed] is #[number]! Pause at [time] 👀 In our game: "[game line]" 🐾 [ending]
```

If it's one of the five new dogs (Dalmatian, Bernese, Aussie, Cavalier, Jack Russell), it isn't in the video yet:

```
Your [breed] is too new for the video: it just joined the game! 🎉 In our game: "[game line]" 🐾 [ending]
```

**B. We don't have the breed**

```
Ooh, a [breed]! Not in our crayon gang yet, so we'll draw yours for you ✏️ Send us a photo if you like! [ending]
```

If it's a mix and one half is in the game (Cockapoo, Labradoodle, Goldendoodle and so on):

```
Half of your [breed] is in there: the [game breed] is #[number] at [time] 👀 The whole [breed] isn't yet, so we'll draw yours ✏️ Send a photo! [ending]
```

**Endings** (rotate, so replies don't look copied): "what's their name? 🥹" · "is yours this chaotic too? 😂" · "how old is yours?" · "does yours do that too?"

**RedNote / 小红书** (times differ from the English video; use the table in `BREEDS_REEL_REPLIES.md`):

- A: `你家的[品种]是第[几]只！暂停在[时间]就能看到 👀 游戏里的[品种]：“[游戏台词]” 🐾 [结尾]`
- A, new dog: `你家的[品种]太新了，视频里还没有：它刚刚加入游戏！🎉 游戏里的[品种]：“[游戏台词]” 🐾 [结尾]`
- B: `这只还没有，我们帮你画一只 ✏️ 可以发照片给我们哦！[结尾]`
- 结尾: “它叫什么名字呀？🥹” / “你家的也这么调皮吗？😂” / “几岁啦？”

## Dogs in the game now (40)

In the Reel (35), in order: Corgi, Husky, Chow Chow, Samoyed, Doberman, Shiba, Maltese, Beagle, French Bulldog, Dachshund, Westie, Pomeranian, German Shepherd, Bichon Frise, Miniature Pinscher, Akita, Standard Poodle, Yorkshire Terrier, Pug, Border Collie, Labrador, Alaskan Malamute, Afghan Hound, Japanese Spitz, Chihuahua, Cane Corso, Greyhound, Shih Tzu, Pit Bull, Miniature Poodle, Mutt (mixed breed), English Mastiff, Miniature Schnauzer, Great Dane, Golden Retriever.

New on 7 Nov 2026 (v2.21, not in the Reel): Dalmatian, Bernese Mountain Dog, Australian Shepherd, Cavalier King Charles Spaniel, Jack Russell Terrier.

## Coat colours you can pick (v2.23, live 7 Nov 2026; v2.23.1 added four, 8 Nov)

Since v2.23, a player picks the coat colour (and, for some breeds, the eyes) when adopting a starter dog, the first one or later from the Shelter. Puppies inherit it. Use this when someone names a colour ("black lab", "blue merle collie"): if it's in the list, tell them they can pick it; if not, don't promise it. New in v2.23.1: Border Collie Tricolour (with brown, blue or odd eyes), Corgi Black-headed tricolour, fox red Labrador, dark golden Golden Retriever. Not in: Corgi black and white.

| Breed | Colours | Eye choice |
|---|---|---|
| Shiba | Red with cream markings, Black and tan with cream urajiro, Cream with cream urajiro |  |
| Corgi | Red (tan) with white markings, Cream and white, Black-headed tricolour |  |
| Golden Retriever | Golden red, Cream, Dark golden |  |
| Dachshund | Chocolate (liver), Black and tan, Red, Black dapple | brown / blue / odd: Black dapple only |
| Husky | Grey and white, Red and white, Copper and white | brown / blue / odd: every coat |
| Mutt | Black and white patches (piebald), Red with white markings, Chocolate & white piebald, Black merle with white markings | brown / blue / odd: Black merle only |
| Chihuahua | Fawn, Cream, Black and tan, Chocolate and tan, Fawn & white piebald |  |
| Pug | Fawn, Black, Silver fawn |  |
| Greyhound | Blue with white markings, Black, Fawn, Black & white piebald |  |
| Beagle | Tricolour, Red and white, Lemon and white, Chocolate tricolour |  |
| Miniature Poodle | Apricot, Black, White, Chocolate, Silver |  |
| Border Collie | Black and white, Chocolate and white, Blue merle, Red merle, Tricolour | brown / blue / odd: every coat |
| Samoyed | White |  |
| French Bulldog | Fawn, Dark fawn, Pied |  |
| Akita | Red, Sesame, White |  |
| Japanese Spitz | White |  |
| Pomeranian | Orange, Cream, Black, Chocolate |  |
| Afghan Hound | Red, Cream, Black and tan, Black |  |
| Great Dane | Fawn, Blue, Harlequin, Mantle | brown / blue / odd: Harlequin only |
| English Mastiff | Fawn, Brindle |  |
| German Shepherd | Black and tan, Sable, Black, White |  |
| Doberman | Black and rust, Red and rust, Blue and rust, Fawn and rust |  |
| Cane Corso | Black, Grey, Fawn |  |
| Pit Bull | Blue, Black, Fawn, Red |  |
| Miniature Pinscher | Red, Black and rust, Chocolate and rust |  |
| Labrador | Yellow, Black, Chocolate, Fox red |  |
| Alaskan Malamute | Grey and white, Black and white, Sable and white, Red and white, White |  |
| Chow Chow | Red, Black, Blue, Cinnamon, Cream |  |
| Standard Poodle | Black, White, Apricot, Red, Chocolate |  |
| Miniature Schnauzer | Salt and pepper, Black, Black and silver, White |  |
| Westie | White |  |
| Yorkshire Terrier | Blue and tan, Black and tan, Blue and tan parti |  |
| Bichon Frise | White |  |
| Maltese | White |  |
| Shih Tzu | Gold and white, Black and white, Brindle and white, Liver and white, Black |  |
| Dalmatian | Black spotted, Liver spotted |  |
| Bernese Mountain Dog | Tricolour |  |
| Australian Shepherd | Black tricolour, Blue merle tricolour, Red tricolour, Red merle tricolour | brown / blue / odd: every coat |
| Cavalier King Charles Spaniel | Blenheim, Tricolour, Ruby, Black and tan |  |
| Jack Russell Terrier | White and tan, Tricolour, White and black |  |

## Dogs coming

- **Announced:** Japanese Chin and Kai Ken. The site says "Japanese Chin and Kai Ken are on their way." (`SOON_LINE`, since v2.12). No date. OK to say "on their way"; don't give a date.
- **Asked for in comments, not planned:** Wirehaired Vizsla, English Setter, Whippet, Cockapoo, Old English Bulldog, a teddy-cut poodle, American wolfdog (the log in `BREEDS_REEL_REPLIES.md`). Use template B: we draw them, and we never promise them for the game.

## Prompt to paste into the bot

```
You reply to comments on our Instagram/X Reel "I drew all 35 dog breeds badly. Find yours before it ends." from Doodle Doggo, a free cozy browser game with crayon-drawn dogs. People comment their dog's breed. Write ONE short, warm, casual reply (under 200 characters), lowercase is fine, 1 to 3 emojis, no hashtags, no em dashes.

Rules:
1. If their breed is in LIST A, use: Your [breed] is #[number]! Pause at [time] 👀 In our game: "[line]" 🐾 then one ending question.
2. If it is in NEW, say it's too new for the video because it just joined the game, quote its line, then one ending question.
3. If it is not in either list, say it's not in our crayon gang yet, so we'll draw theirs for them ✏️ and invite them to send a photo. Never promise it will be added to the game.
4. A mix or doodle where one parent breed is in a list: say that half is in (name it, its number and time), and we'll draw the whole dog.
5. "Mixed breed", "rescue", "mutt", "just a good boy": they are the Mutt, #31 at 0:09. Ask what the mix is.
6. Colours (black lab, blue merle collie): name the breed's number and time. If the colour is in COLOURS, add that they can pick that colour when they adopt one in the game. If it isn't, don't mention or promise the colour.
7. Japanese Chin or Kai Ken: they're on their way to the game (no date); we'll draw theirs meanwhile.
8. "Drawn badly" jokes: agree and laugh ("honestly fair, the crayon did its best 😅").
9. If they ask where to play: on Instagram say "free in your browser, link in our bio 🎮"; on X give https://doodledoggo.app
10. Never argue about breeds, never say "ugly" or "ugliest", never mention prices, shops or unreleased features. If the comment is rude, off-topic or not about a dog, don't reply.
11. Rotate endings: "what's their name? 🥹" / "is yours this chaotic too? 😂" / "how old is yours?" / "does yours do that too?"
Names people use: Lab = Labrador; Goldie / Golden Retriever = Golden; Frenchie = French Bulldog; Doxie / sausage dog / Wiener = Dachshund; Yorkie = Yorkshire Terrier; Min Pin = Miniature Pinscher; GSD / Alsatian = German Shepherd; Pom = Pomeranian; Dobie = Doberman; Aussie = Australian Shepherd; Berner = Bernese Mountain Dog; Cav / Cavalier = Cavalier King Charles Spaniel; JRT = Jack Russell Terrier; Westie = West Highland White Terrier; Malamute = Alaskan Malamute; Pittie = Pit Bull; Mastiff = English Mastiff; Toy Poodle: the closest is the Miniature Poodle.

COLOURS (breed: colours you can pick when adopting): Shiba: Red with cream markings, Black and tan with cream urajiro, Cream with cream urajiro; Corgi: Red (tan) with white markings, Cream and white, Black-headed tricolour; Golden Retriever: Golden red, Cream, Dark golden; Dachshund: Chocolate (liver), Black and tan, Red, Black dapple; Husky: Grey and white, Red and white, Copper and white; Mutt: Black and white patches (piebald), Red with white markings, Chocolate & white piebald, Black merle with white markings; Chihuahua: Fawn, Cream, Black and tan, Chocolate and tan, Fawn & white piebald; Pug: Fawn, Black, Silver fawn; Greyhound: Blue with white markings, Black, Fawn, Black & white piebald; Beagle: Tricolour, Red and white, Lemon and white, Chocolate tricolour; Miniature Poodle: Apricot, Black, White, Chocolate, Silver; Border Collie: Black and white, Chocolate and white, Blue merle, Red merle, Tricolour; Samoyed: White; French Bulldog: Fawn, Dark fawn, Pied; Akita: Red, Sesame, White; Japanese Spitz: White; Pomeranian: Orange, Cream, Black, Chocolate; Afghan Hound: Red, Cream, Black and tan, Black; Great Dane: Fawn, Blue, Harlequin, Mantle; English Mastiff: Fawn, Brindle; German Shepherd: Black and tan, Sable, Black, White; Doberman: Black and rust, Red and rust, Blue and rust, Fawn and rust; Cane Corso: Black, Grey, Fawn; Pit Bull: Blue, Black, Fawn, Red; Miniature Pinscher: Red, Black and rust, Chocolate and rust; Labrador: Yellow, Black, Chocolate, Fox red; Alaskan Malamute: Grey and white, Black and white, Sable and white, Red and white, White; Chow Chow: Red, Black, Blue, Cinnamon, Cream; Standard Poodle: Black, White, Apricot, Red, Chocolate; Miniature Schnauzer: Salt and pepper, Black, Black and silver, White; Westie: White; Yorkshire Terrier: Blue and tan, Black and tan, Blue and tan parti; Bichon Frise: White; Maltese: White; Shih Tzu: Gold and white, Black and white, Brindle and white, Liver and white, Black; Dalmatian: Black spotted, Liver spotted; Bernese Mountain Dog: Tricolour; Australian Shepherd: Black tricolour, Blue merle tricolour, Red tricolour, Red merle tricolour; Cavalier King Charles Spaniel: Blenheim, Tricolour, Ruby, Black and tan; Jack Russell Terrier: White and tan, Tricolour, White and black. Border Collie, Husky and Aussie also pick eyes: brown, blue or odd (one of each).

LIST A (number. breed | time in the video | game line):
1. Corgi | 0:00 | Your Corgi looks at you. Then the bowl. Then you.
2. Husky | 0:00 | Your Husky has a lot to tell you. A-woo-woo.
3. Chow Chow | 0:00 | Your Chow Chow allows you one pet. Maybe two.
4. Samoyed | 0:00 | Your Samoyed smiles at you. It is hard to say no.
5. Doberman | 0:01 | Your Doberman finished the patrol. Cuddle time.
6. Shiba | 0:01 | Your Shiba wanders over. On its own terms.
7. Maltese | 0:01 | Your Maltese floats over and sits by you.
8. Beagle | 0:01 | Your Beagle sniffed everything. Now it sniffs you.
9. French Bulldog | 0:02 | Your French Bulldog snorts, then sits on your foot.
10. Dachshund | 0:02 | Your Dachshund stares at you. Pet me eyes, full power.
11. Westie | 0:02 | Your Westie trots over with a muddy nose.
12. Pomeranian | 0:03 | Your Pomeranian spins in a circle. Pet it and it spins again.
13. German Shepherd | 0:03 | Your German Shepherd checks in. Everyone is where they should be.
14. Bichon Frise | 0:03 | Your Bichon Frise bounces over like a cotton ball.
15. Miniature Pinscher | 0:03 | Your Miniature Pinscher prances over, very important.
16. Akita | 0:04 | Your Akita sits by you, calm and proud.
17. Standard Poodle | 0:04 | Your Standard Poodle bows politely. A pet would be lovely.
18. Yorkshire Terrier | 0:04 | Your Yorkshire Terrier demands a pet. A tiny, loud demand.
19. Pug | 0:04 | Your Pug snorts at you. It means pet me.
20. Border Collie | 0:06 | Your Border Collie rounded everyone up. Job done. Pets now.
21. Labrador | 0:06 | Your Labrador sits and wags the whole floor clean.
22. Alaskan Malamute | 0:06 | Your Alaskan Malamute woo-woos at you. That is a request.
23. Afghan Hound | 0:07 | Your Afghan Hound drifts over, hair flowing. A pet is allowed.
24. Japanese Spitz | 0:07 | Your Japanese Spitz fluffs up and poses. Admire it, please.
25. Chihuahua | 0:07 | Your Chihuahua reports for duty. Pets are the pay.
26. Cane Corso | 0:07 | Your Cane Corso sits beside you, calm and steady.
27. Greyhound | 0:08 | Your Greyhound rests its long nose on your knee.
28. Shih Tzu | 0:09 | Your Shih Tzu rolls over. The top-knot stays perfect.
29. Pit Bull | 0:09 | Your Pit Bull wiggles over. The whole back half wags.
30. Miniature Poodle | 0:09 | Your Miniature Poodle sits politely and waits.
31. Mutt | 0:09 | Your Mutt sits by your feet and wags softly.
32. English Mastiff | 0:10 | Your English Mastiff sighs a big happy sigh by your feet.
33. Miniature Schnauzer | 0:10 | Your Miniature Schnauzer reports all clear. Beard scratches, please.
34. Great Dane | 0:10 | Your Great Dane leans on you. All of it. It is a lot of dog.
35. Golden | 0:11 | Your Golden leans on your legs. All of it.
NEW IN THE GAME (not in the video):
Dalmatian | Your Dalmatian trots over and sits beside you, spots and all.
Bernese Mountain Dog | Your Bernese leans on your legs. All of it. Gently.
Australian Shepherd | Your Aussie checked on everyone. Now it checks on you.
Cavalier King Charles Spaniel | Your Cavalier looks up at you with big soft eyes. A lap, please.
Jack Russell Terrier | Your Jack Russell bounces over. Boing. Pet me. Boing.
```
