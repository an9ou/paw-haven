# Portuguese (Brazil) (pt-BR) back-check, v2.14.1

- Lines checked: 791 (639 game, 152 site), list in `keys.txt`. Placeholders checked on all keys: no broken ones.
- Register: você everywhere, as `docs/i18n/pt-BR.md` says.
- Word rules: no selling or breeding words ("criar" only means "create an account"). No player gender ("Boas-vindas", "Tudo pronto?").
- Overall: very good and very Brazilian. A few safety tips add a true extra fact (apple seeds: cyanide, grapes: kidneys, choking), which is fine.

## Fixed (1)

| Key | Back-translation of the old line | Fix | Why |
|---|---|---|---|
| `walk.dig_here` | "Dig here? # digs left. (Tap Dig! to dig, hold walk to *jump*.)" | "segure passear para seguir" (hold walk to keep going), in both branches | "pular" means both "skip" and "jump", and "Pular" is the label of the Hop button, so the hint pointed at the wrong button. Same length. |

## For a native speaker to look at

- `data.food.frozen_pupsicle.note`: "Refresca qualquer cachorro-quente" is a pun on the English "cools a hot dog". In Portuguese "cachorro-quente" is the sausage sandwich. It's cute if kids get it.
- `data.food.pumpkin_patch_pupcake.n`: "Pupcake de Halloween" drops the pumpkin from "Pumpkin Patch Pupcake". It fits the Halloween stall, but check it.
- `title.start_over_body_html`: the farm joke became "goes to a new home, full of treats and love". That is kind, but it is a different joke.
- `missions.ready_space`: "Ou para o quintal" (the yard) for "Or the garden". That suits the doghouse prize.
