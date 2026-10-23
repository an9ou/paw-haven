# Indonesian (id) back-check, v2.14.1

- Lines checked: 791 (639 game, 152 site), list in `keys.txt`. Placeholders checked on all keys: no broken ones. Plurals correctly use only `other` (or `=1`).
- Register: kamu / -mu everywhere, as `docs/i18n/id.md` says. No Anda found.
- Word rules: no "ternak", "membiakkan" or "kawin", and no selling dogs. Gender is neutral by nature ("dia").
- Overall: very good. Friendly and clear, and the glossary terms are consistent (Kedekatan, Koin Tapak, Hidung-o-meter, Pojok Kibble).

## Fixed (1)

| Key | Back-translation of the old line | Fix | Why |
|---|---|---|---|
| `shelter.kind_rescue` | "Arrived today as a 'rescue'." (the English word left in) | Baru diselamatkan, tiba hari ini. ("Just rescued, arrived today.") | An untranslated English word. |

## For a native speaker to look at

- The onion lessons (`data.food.monster_meatball.tip`, `turkey_meatballs.tip`, `warm_bone_broth.tip`): "bawang merah" (shallot / red onion) stands for "onion". It's common usage, and shallots are unsafe too, but "bawang bombai" is the exact word.
- `data.gd_steps.garden.t`, `data.gd_lessons.garden_garden.3`: "...yang bisa ditanam. Selamanya." ("Forever") for "Ever". "Tidak akan pernah" may read better.
- `care.none_left`: "Pojok Kibble menjualnya" ("Kibble Corner sells it") is fine. It's a shop selling food.
