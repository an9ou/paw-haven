# "World tour" ad: ideas (brainstorm, 23 Oct 2026)

The owner shared an AFK Journey ad (https://www.instagram.com/p/DeEH9NVMKm6/, 14 s). It shows no characters and no buttons:
- a slow aerial camera drifts over the world, one region every 2–3 s: an autumn valley, a lake with a boat, a forest mound, a misty fen, a snowy glen;
- each region gets an elegant title and its unlock level ("Floral Valley · Unlocks at Lvl. 20");
- the sound is soft ambient music;
- the caption says "Massive world. Better art."

The format sells the size and beauty of the world.

Doodle Doggo has the same ingredients, and they are real. Every place in the game unlocks at a Bond level:

| Place | Unlocks at |
|---|---|
| Home Yard, Sunny Park, Market Street | Bond 1 |
| Riverside | Bond 2 |
| The Station (Tokyo), Shibuya Crossing, Yoyogi dog run | Bond 3 |
| Asakusa, Ueno Park | Bond 4 |
| Maple Woods, Tokyo Tower | Bond 5 |
| Odaiba Seaside | Bond 6 |
| Seashell Beach | Bond 8 |

The places come from `PLACES` in `game/src/00_core.js` and `TK_PLACES` in `game/src/39_tokyo.js`. Every place also has its own weather, season and time of day in the art, and the seasons follow the real calendar.

## Ideas

1. **Sketchbook world tour (recommended, the closest copy).**
   - One place every 2 s, in unlock order. A slow drift over each place, with depth built round it like the snack ad (soft parallax, light motes), and the place's own weather:
     - Home Yard: spring petals;
     - Riverside: summer sparkle;
     - Shibuya Crossing: rain;
     - Maple Woods: falling leaves;
     - Tokyo Tower: night lights;
     - Seashell Beach: sunset;
     - the hilltop: snow.
   - A small crayon dog trots through each place, a different dog each time (the owner's random-dog rule).
   - The title follows the reference: "Maple Woods" with "unlocks at Bond 5" under it, in the game's handwriting.
   - Ends on the logo and "play free at doodledoggo.app".
   - Text on screen: "a whole sketchbook world".
   - 14–16 s.
2. **Tour with the dogs' own lines (the funny version).** The same tour, but in each place the dog says its real line from the game (`PLACE_LINES`, 35 dogs × 6 places). For example, the Chihuahua at Riverside: "The ducks are a threat. I have informed them." This plays to the brand's joke (the crude dogs with big opinions), and it is stronger for people who scroll past pretty scenery. It can be made from the same build.
3. **One yard, every season.** A single shot of the Home Yard that changes, without cutting, through spring blossoms, summer, autumn leaves, Halloween, snow and New Year, while the same dog stays. Text: "the seasons change with the real calendar". About 12 s, very calm and satisfying.
4. **Tokyo trip in 15 seconds.** The Shinkansen window ride, then Shibuya, Yoyogi, Asakusa, Ueno, Tokyo Tower and Odaiba. A stamp lands in the stamp book at each one: "collect all 7 stamps". Note: it shows Japan-style places; the text stays English.
5. **The zoom-out.** Start close on one crayon dog in the yard. Pull back without cutting to the whole yard, then the town map, then the Japan map with Tokyo: "it starts with one dog". About 10 s.

Concept frames for idea 1 (Maple Woods, Tokyo Tower at night, Seashell Beach at sunset) were sent to the owner on 23 Oct 2026.
