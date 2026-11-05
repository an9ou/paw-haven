# Player levels (draft, 5 Nov 2026)

Owner's ask (5 Nov 2026): "Can we have player levels too: player levels unlock different places, Bond level unlocks the dog's habits and learning tricks."

## Today (v2.19.2)

- One ladder: **Bond 1-10**. Places and walks use the **top Bond of any dog** (`topBond()`, `mpLocked`):
  - Riverside / Pool / Sunflower Lanes / Mt. Fuji Lookout: Bond 2
  - Training Ground, Shibuya, Yoyogi: Bond 3
  - Bamboo Grove, Asakusa, Ueno: Bond 4
  - Maple Woods: Bond 5
  - Seaside Cliffs: Bond 7
  - Seashell Beach: Bond 8
- Tricks use the **active dog's** Bond (Sit 1 ... Bow 9, Signature 10). Outfits, houses and toys in the shops also carry a Bond number.
- Habits already exist as data, but they are not unlocked. Each breed has a personality (`BREED_PERS`, 36_personality.js): attention, zoomies, favourite spots and one named trait (aloof, polite, sniff, lazy, herding ...). Every dog shows all of it from day 1, and nowhere in the game says so.

## Proposal

Two ladders, "you grow" and "your dog grows":

1. **Player level (you), 1-20.** It unlocks **places and walk routes** (all of the table above moves from Bond to player level) and the shop's houses, toys and outfits. It goes in the HUD as a small crayon star with the level, next to the coins.
   - XP comes from what you already do: care, walks, the daily mission, little helps, Fun Fair games, a new place visited.
   - There is a gentle daily cap, so playing a long session doesn't race ahead.
   - XP is never bought and never lost. Nothing bad ever happens: no XP loss, no fail.
   - Pace: about a level a day in the first week, then slower. Level 20 comes in about 6-8 weeks.
2. **Bond (each dog), 1-10.** It unlocks **tricks** (as now) and **habits**. Each Bond level reveals one of that dog's habits, written as a line in Journal > Profile ("Mochi's habits"), and the dog starts doing it more:
   - Bond 2: its favourite spot
   - Bond 3: its named trait
   - Bond 4: its ask-for-pets line
   - Bond 5: zoomies after a bath
   - and so on.
   - A habit is cosmetic and kind. A second dog starts its own Bond and habits, but can go everywhere the player has unlocked.
3. **Old players:** nothing that is open now ever locks again.
   - Their player level starts from what they have already done: the top Bond, days played, walks and places visited.
   - Every habit up to each dog's current Bond is revealed at once, with one "Mochi's habits" letter in the mailbox.

## Fit with what is waiting

- Little Helps (v2.20) is built but off. Its badges and the new player's notebook would give XP too.
- Suggested order:
  1. v2.19 Friends on 7 Nov
  2. v2.20 + v2.21 on the owner's date
  3. player levels as **v2.22**, on the GitHub test copy first, then the owner's date
- Big release rules apply: parts one at a time, three reviews, one translation batch.

## Decided (owner, 5 Nov 2026, choice window)

1. **Player level unlocks** places, walk routes and the shop's houses, toys and outfits. Bond (each dog) keeps tricks and gets habits.
2. **One habit per Bond level**, shown in Journal > Profile; the dog does it more from then on. Cosmetic and kind.
3. **Ships together with Little Helps** (v2.20 + v2.21) on the owner's launch date. It sits behind the same `MS2_LIVE` gate (on the GitHub Pages test copy with `__ddMs2Test`). Contract: `V222.md`; the release keeps the big-release rules.
