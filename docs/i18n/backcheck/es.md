# Spanish (es) back-check, v2.14.1

- Lines checked: 791 (639 game, 152 site), list in `keys.txt`. Placeholders checked on all 7367 game keys and all site keys: no broken ones.
- Register: tú everywhere, as `docs/i18n/es.md` says. No usted or vosotros found.
- Word rules: no "criar" or "vender perros", and no player gender in the checked lines ("Te damos la bienvenida", "¿Todo listo?" style is used).
- Overall: very good. Natural, warm and correct, and the food-safety tips are complete and accurate.

## Fixed (1)

| Key | Back-translation of the old line | Fix | Why |
|---|---|---|---|
| `missions.all_done` | "All three done! A wax seal for today." ("sello de cera" is a sealing-wax seal) | ¡Las tres listas! Hoy, un sello de colores. | The wrong meaning: it is a crayon stamp, not a wax seal. Same length. |

## For a native speaker to look at

- `data.gd_steps.walk.t`, `data.gd_lessons.walk_walk.3`: "Los paseos dan más monedas" reads as "walks give more coins". The English says the most coins (walks are the main income). "Los paseos son lo que más monedas da" would be exact but longer.
- "premio" is the glossary word for a treat, but it can read as "prize" (`data.ms_pool.stall.t` "Comprar un premio en el Puesto de la Cosecha").
- `title.start_over_body_html`: the "moved to a farm" joke became "on holiday in the countryside. A real one." That is fine and kind, but check the tone.
- `walk.dig_here`: "mantén pulsado para seguir paseando" stands for "hold walk to skip". Check that it is clear.
- Glossary TODO(native): "cera de colores" for crayon.
