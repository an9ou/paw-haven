# French (fr) back-check, v2.14.1

- Lines checked: 791 (639 game, 152 site), list in `keys.txt`. Placeholders checked on all keys: no broken ones. The narrow no-break spaces before ? ! : were kept in every fixed line.
- Register: tu everywhere, as `docs/i18n/fr.md` says. No vous found.
- Overall: good and lively. The main problem is French gender agreement: a feminine participle used for every dog, and masculine nouns for the player. The whole-table scan found three more of these outside the list.

## Fixed (7)

| Key | Back-translation of the old line | Fix | Why |
|---|---|---|---|
| `shelter.kind_rescue` | "Arrived (feminine) today, after a rescue." | Vient d'arriver, après un sauvetage. | Gender: "Arrivée" is feminine but shows for boy dogs too. The new line is neutral and shorter. |
| `shelter.name_new` | "What will you call your new daughter? / your new son?" | ...ta nouvelle chienne ? / ...ton nouveau chien ? | The wrong meaning: "ta nouvelle fille" reads as "your new daughter". |
| `site:guide.title` | "How to play Doodle Doggo: the guide for new (male) dog masters" | ...: le guide pour bien débuter | Player gender: "maîtres" makes the player male (the style guide bans "le meilleur maître"). Shorter too. |
| `journal.coat_50` (scan) | "...You are now Master (male) of coats." | Te voilà Pro des pelages. | Player gender ("Maître"). "Pro" works for everyone. |
| `journal.title_master_breeder` (scan) | "Master (male) of coats" | Pro des pelages | Same title, shown on the profile. |
| `data.jr_mile_txt.50` (scan) | "Master (male) of coats" | Pro des pelages | Same title, shown in the journal milestones. |
| `data.treasures.seashell_necklace.txt` (scan) | "The Nose-o-mètre reacts twice as far when it is worn." | Avec ce collier, le Flairomètre réagit deux fois plus loin. | Glossary: the meter is "Flairomètre" in every other line. The old line also read as if the meter was being worn. |

`docs/i18n/fr.md` (the coined-terms note) now records "Pro des pelages".

## For a native speaker to look at

- `map.asleep`: "{name} dort. Il faut d'abord un réveil (menu Soins)." "un réveil" can read as "an alarm clock". "Réveille {name} d'abord" would be clearer but longer.
- `site:home.japan.lead`: "si tu aimes les chiens" drops "for visitors (to Japan)".
- `cards.from_player` "d'un autre joueur" and `adopt.doodle_doggo_shelter_pick_your` "ton nouveau meilleur ami" use the generic masculine. That is normal French, but check that it is OK for a kids' game.
- `care.cool`: "Frais comme un gardon" (an idiom for lively) stands for "cool as a cucumber". It works, but check it.

## Note on the English source (not changed here)

- `journal.title_master_breeder` / `journal.coat_50` say "Master Breeder" in English. "Breeder" goes against the owner's word rules. Every translation already avoids it.
- `site:home.trip.*` still says the Tokyo Trip is "coming up", but it shipped in v2.11.
