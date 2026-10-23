# German (de) back-check, v2.14.1

- Lines checked: 791 (639 game, 152 site), list in `keys.txt`. Placeholders checked on all keys: no broken ones.
- Register: du everywhere (lowercase), as `docs/i18n/de.md` says. No Sie found.
- Word rules: no "züchten" or "Zucht", no selling dogs, no "Besitzer" or "Spieler" for the player.
- Overall: very good. Natural, cozy German with consistent glossary terms (Bindung, Pfotentaler, Gassi, Nasometer).

## Fixed (3)

| Key | Back-translation of the old line | Fix | Why |
|---|---|---|---|
| `core.lu_many` | "(That is # level(s) at once. Show-off (a masculine noun).)" | ...Angeberei!) ("What showing off!") | Male default: "Angeber" calls every dog, girls too, a male show-off. |
| `shelter.kind_rescue` | "Arrived today as a rescue operation." | Heute gerettet und angekommen. ("Rescued and arrived today.") | The wrong meaning: "als Rettung" means "as the rescue (service)", not "as a rescued dog". |
| `walk.res_coins_penny` | "Paw Coins (Penny +10 %)" | Pfotentaler (Pfennig +10 %) | Glossary: the treasure is called "Glückspfennig" in German. "Penny" was the English name. |

## For a native speaker to look at

- `site:common.play`: "SPIEL AUF ITCH.IO" in capitals can read as the noun ("GAME ON ITCH.IO"). "AUF ITCH.IO SPIELEN" would be clearer.
- The three new lines above. Please check that they sound natural.
- `walk.res_feed`: "Füttere es im Tagebuch" ("feed it in the journal") is understandable, but check it.
