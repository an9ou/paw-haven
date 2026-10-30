# Reel review: Trick-or-treat and "Is this safe?" (30 Oct 2026)

Both English Reels checked with the new Instagram skills (`ig-reel` hookscore and beats, `ig-caption` linter, `ig-human` detector) and against Instagram's safe zone (on 1080 x 1920: nothing above y=230 or below y=1440, and nothing in the right 230 px, where the caption, the like/comment rail and the audio strip sit). Both renders already have the v2.18.3 Noodle legs (commit 36ad117), so the legs don't need a re-render. Nothing has been changed yet: this is the review and the proposed fixes.

Safe-zone frames (the red areas are covered by Instagram's interface): `review_img/trick_safezone.png` and `review_img/safe_safezone.png`.

**Owner, 30 Oct 2026: ignore the safe zone; our Reels have no problem with it.** The safe-zone findings (Trick 1–3 and 5, Safe 2–4, Covers) are dropped and kept below only for the record.

## Scorecard

| | Trick or treat | Is this safe? |
|---|---|---|
| Length | 13.0 s (OK; the skill likes 15–45 s) | 15.1 s |
| Hook score (on screen) | "trick or treat, but make it crayon": **44 WEAK** (no number, no stakes, 7 words on the card, 6 is the limit) | "is this safe for my dog?": **34 WEAK** (nothing specific) |
| Reading time needed (200 wpm) | ~21 s, but most of it repeats ("knock knock", "trick or treat!"), so it's fine | **~37 s of reading in 15 s**: the lessons can't be read |
| Payoff | the dinosaur at 8.6 s, 66% of the way in (the skill wants it before halfway) | a swap every 3.6 s: good |
| Loop | the ending says "trick or treat? treat. always treat.", which echoes the hook: good | "safe" comes back on the save page: good |
| Safe zone | **costume sticker and "Market open until 15 Nov" are hidden** under the caption | **"not for dogs" / "safe swap" labels hidden under the rail; "call your vet", logo and link hidden under the caption** |
| IG caption | **FIX**: 10 hashtags (the cap is 5), repeats the hook, URL as dead text; human score 61 | **FIX**: 10 hashtags, 2 asks, no search terms up top; human score 56 |

## Trick or treat: findings, most important first

1. **The costume sticker is under the caption** (y 1700–1850). It names the new costume, which is the point of the post. Move it into the safe zone, e.g. just under the hook card (y ~460–600), and move the "...he left the treats." card down to make room.
2. **The action is too low.** The feet line is y=1640, so paws, the pumpkin bucket and the treats land under the caption. Lift the feet line to about y=1450.
3. **Ending page:** "the Halloween Market is open until 15 Nov" (y=1530) is covered. Pull the logo, the dogs and the line up so everything ends above y=1440.
4. **Payoff comes late.** All four doors take 2.5 s each, so the dinosaur doesn't arrive until 8.6 s. Trimming doors 1–3 to about 1.9 s brings it to ~6 s (about half way), for a ~11 s Reel.
5. **Right rail:** "knock knock" (x=830) and the jack-o'-lantern on the hook card sit under the like/comment icons. Move them left of x=850.
6. **Hook:** 44 WEAK. Options scored:
   - "door 4 cost him every treat" (on screen, 6 words): 60 OK
   - "4 doors. 3 treats. 1 dinosaur." (on screen): 51 OK
   - spoken or title version, "My dog knocked on 4 doors. Door 4 cost him every treat.": 77 STRONG (good for the Shorts title)
   The crayon line is charming and on brand, but it only names the art style. Recommendation: on-screen card "door 4 cost him every treat", and keep "trick or treat, but make it crayon" as the small second line.

## Is this safe?: findings, most important first

1. **Nobody can read the lessons.** Each "not for dogs" card is up for ~1.9 s with 16–19 words of the game's lesson; at a normal 200 wpm that takes ~5 s. Recommendation: rounds from 3.6 s to ~5.5 s (about 4 s on the lesson, 1.5 s on the swap). Total ~21 s, still well inside the 15–45 s range. That keeps every word the game's own reviewed text.
2. **The safety message is hidden.** On the save page "ate something? call your vet.", the logo, the subtitle and the link are all below y=1440, and "save this for later" is above y=230. Tighten the rows (112 → ~92 px) and move the page down so it fits between y 260 and 1430. The vet line has to be visible.
3. **The verdict labels are under the rail.** "not for dogs" and "safe swap" are right-aligned at x=970. Put them under the food name on the left.
4. **Food, stop sign and tick are in the rail** (plate at x=770, stop sign at x=860, tick at x=905). Shift that group ~150 px left, and lift Noodle and the plate ~150 px (the plate is at y 1600 now).
5. **Hook:** 34 WEAK. Options scored:
   - "Stop sharing these 3 snacks with your dog." (spoken or title): **81 STRONG**
   - "stop sharing these 3 snacks" (on screen, 5 words): **80 STRONG**
   - "3 snacks your dog begs for. Number 3 is probably in your bag.": 56 OK
   - "Nobody tells you sugar-free gum can hurt your dog.": 52 OK
   It matches the Reel exactly (3 rounds) and stays kind, since each round ends on a happy swap. Recommendation: use it on the English cut. On RedNote "这个，狗狗能吃吗？" is a search-style question that suits the platform, so it can stay there.

## Covers

Instagram's profile grid crops a 9:16 cover to 3:4, cutting ~240 px off the top and bottom. Both covers have the hook card starting at y=170, so the first line gets clipped on the grid. Moving the hook card to y ≥ 250 fixes the grid and the safe zone at the same time.

## Captions

The Reel carries the hook, so the caption shouldn't repeat it (ig-caption "Job A"): line 1 should be the ask, the body holds the words people search for, then up to 5 hashtags. Problems in the current Instagram captions:
- 10 hashtags each (Instagram counts 5 since Dec 2025);
- line 1 repeats the on-screen hook;
- "doodledoggo.app (link in bio)" is dead text (links aren't clickable in captions; the bio has it);
- the safe caption has two asks (save + link in bio);
- the search phrases ("dog costume", "foods dogs can't eat", "dog safe treats") are missing or not near the top.

Shorts and X are fine as they are: links work there. On the Shorts titles, the stronger hooks above would help ("My dog knocked on 4 doors. Door 4 cost him every treat 🎃 #Shorts", "Stop sharing these 3 snacks with your dog 🍇🍫 #Shorts"). The RedNote texts are unaffected (the 5-tag cap is Instagram only; no link, as required).

### Instagram caption: Trick or treat (now in `TRICK_REEL.md`)
```
what dog costume is yours wearing this year? comment below. we know the Dinosaur Hood is taken 🦖

Noodle knocked on 4 doors. 3 dogs in new Halloween costumes handed out dog-safe treats. door 4 had other plans.

the Halloween Market in Doodle Doggo is open until 15 Nov: 10 new dog costumes like the Scarecrow Overalls, Skeleton Suit, Mummy Wraps and Dinosaur Hood, plus the Pumpkin Cottage and the Friendly Haunted Kennel.

it's our free cozy dog game, and you play it right in your browser. no ads, and nothing bad ever happens.

#DoodleDoggo #DogCostume #Halloween #CozyGames #IndieGame
```
Receipt: Job A · ask: one, comment · hashtags 5 · search: "dog costume" in line 1, "Halloween" and "cozy dog game" in the body · linter READY · human score 75.

### Instagram caption: Is this safe? (now in `SAFE_REEL.md`)
```
save this one: 7 foods dogs can't eat, and 3 safe swaps 📌

never for dogs: grapes and raisins, chocolate, xylitol (it's in a lot of sugar-free gum), onion, garlic and macadamia nuts.

dog safe treats to give instead? blueberries, carrots and plain pumpkin.

ate something it shouldn't? call your vet right away. don't wait for signs.

in Doodle Doggo, our free cozy dog game, you can't cook or feed anything toxic. every recipe comes with a two-sentence safety lesson.

#DoodleDoggo #DogSafety #DogTips #DogHealth #CozyGames
```
Receipt: Job A · ask: one, save · hashtags 5 · search: "foods dogs can't eat" in line 1, "dog safe treats", "cozy dog game" in the body · linter READY · human score 80 PASS. Every food fact matches the game's `people_food` text (7 foods: grapes, raisins, chocolate, xylitol, onion, garlic, macadamia).

## Recommended order (Halloween is 31 Oct)

The safe-zone fixes are off (owner, 30 Oct 2026). What's left:
1. Trick or treat: post as it is on the 31st, or first apply the hook card ("door 4 cost him every treat") and the shorter doors 1–3 (fix 4) and re-render.
2. Is this safe?: longer rounds so the lessons can be read (fix 1, ~21 s), and the hook card "stop sharing these 3 snacks" (fix 5). Not tied to a date.
3. Done: the new captions for every platform are in `TRICK_REEL.md` and `SAFE_REEL.md`.
4. After approval: the RedNote cuts (`REDNOTE=1`).
