# "2 black dogs had puppies. you won't guess the colours" Reel (1 Nov 2026)

Owner, 1 Nov 2026: idea 2 of the new Reel list ("follow your planning"). English first; the RedNote cut and its 3:4 cover come after the owner approves. Files in `brand/instagram/launch/pups_reel/`.

| File | What |
|---|---|
| `doodle-doggo-puppy-colours.mp4` | Instagram, Shorts and X. 1080 x 1920, 30 fps, 17.3 s, with the game's own cozy music (the yard by day), a tick on the 3-2-1, the "adopt" sting and a puppy bark as each puppy arrives. |
| `pups-cover.jpg` | The cover: the hook over the two black parents with their "mum: Black" / "dad: Black" tags. |
| `build_pups.js` | Remake: `NODE_PATH=$(npm root -g) node brand/instagram/launch/pups_reel/build_pups.js <workdir>` (`REDNOTE=1` for the RedNote cut, `ONLY=stills` for key frames). |

**What is in it:** the hook card "2 black dogs had puppies. / you won't guess the colours" (hookscore 81.4 STRONG) over two black Labradors in the yard (autumn, Fuji behind the fence), tagged "mum: Black" and "dad: Black", and the clue "both carry chocolate & yellow". Then "pause and guess / how many colours?" with three question marks and a 3-2-1. The puppies pop in one by one: Black (about 1 in 2), Yellow (1 in 4), Chocolate (about 1 in 5), and "3 puppies, 3 colours!". Then "both parents are black, but both carry chocolate and yellow / in this game, puppies get real coat genes", and the end page "did you guess all 3?" with the three puppies, the logo, "a free cozy dog game with real coat genetics" and "play free at doodledoggo.app".

**Where the facts come from:** the game's own genetics (`mods/genes.js`). Both parents are B/b E/e (black, carrying liver and red); the three puppies are real outcomes of that pair (B/B E/e Black, B/b e/e Yellow, b/b E/E Chocolate), drawn with the game's `phenotype()` colours. The odds are the game's `predict()` for the pair (56.25 %, 25 %, 18.75 %), worded the way the game words them ("about 1 in 2", "1 in 4", "about 1 in 5"). The script checks all of this and stops if the genes module changes. "Carries" follows the game's gene lines (`mod.genes.line_b_carry`, `line_e_carry`). Puppies go to named families for free, never sold (design rules).

## Instagram
```
how many colours did you guess? 🎨 comment your number 👇 then see if you got all 3 🐾

two black Labs, three puppies: one black 🖤 one yellow 💛 and one chocolate 🤎 we didn't see it coming either 😅

can black lab puppies be yellow? yep 🧬 a black Lab can carry hidden chocolate and yellow genes, so two black parents can still have yellow and chocolate puppies 🐶 for our pair the odds were about 1 in 2 black, 1 in 4 yellow and about 1 in 5 chocolate 🍫🎲

it's all in Doodle Doggo, our free cozy dog game where every puppy gets real coat genes ✏️ and goes to a named family 🏡 never sold 💕

#DoodleDoggo #Labrador #DogGenetics #CozyGames #PuppyLove
```
Job A (the Reel carries the hook) · one ask: comment · 5 hashtags · search: "black lab puppies", "coat genes", "cozy dog game" · no link · 15 emoji (2.3 per 100 characters), none as bullets · linter READY · human score 83.7 PASS.

## YouTube Shorts

Title: `2 black dogs had puppies. you won't guess the colours 🐾 #Shorts`

Description:
```
Our two black Labradors had three puppies, and only one came out black. The other two? Yellow and chocolate. Did you pause and guess?

Here's how it works. A black Lab can carry hidden chocolate and yellow genes, and when both parents carry both, you can get black (about 1 in 2), yellow (1 in 4) or chocolate (about 1 in 5) puppies. We didn't plan this pair, the genes did.

Doodle Doggo is our free cozy dog game, drawn in a pencil sketchbook, and every puppy you meet in it gets real coat genes from its mum and dad. Puppies go to named families for free. They're never sold, and nothing bad ever happens.

🎮 Play free: https://doodledoggo.app
🕹️ itch.io: https://an9ou.itch.io/doodle-doggo
☕ Support us on Ko-fi: https://ko-fi.com/doodledoggoapp
📷 Instagram: https://www.instagram.com/doodledoggo.app/

#DoodleDoggo #Shorts #Labrador #DogGenetics #CozyGames
```
Title off the hook (81.4 STRONG). Human score 92.0 PASS on the text (the link list is the same fixed block as the other Shorts; with it the detector reads its emoji as bullets).

## X (under 280 characters)
```
2 black dogs had puppies. you won't guess the colours 🐾 black, yellow AND chocolate. both Labs carry hidden chocolate and yellow genes, odds: about 1 in 2, 1 in 4, about 1 in 5. every puppy gets real coat genes: https://doodledoggo.app #DoodleDoggo #CozyGames
```
259 of 280 (the link counts as 23) · human score 82.9 PASS.

**Alt text:** `Two black crayon Labradors stand in a sketchbook yard, tagged mum: Black and dad: Black, with a note that both carry chocolate and yellow. Three question marks appear and count down 3, 2, 1. Then three puppies pop in one by one: a black one, about 1 in 2, a yellow one, 1 in 4, and a chocolate one, about 1 in 5. It ends on "did you guess all 3?" and the Doodle Doggo logo.`

## RedNote / 小红书

Not made yet: the RedNote cut (`REDNOTE=1`, every word in Simplified Chinese, no link), the 3:4 cover and the caption come after the owner approves the English cut.
