# Paw Haven: starter dog genotypes (source: v2 tab of the proposal doc, Genetics section)

The doc wins over the fallback table in V13b.md. These are the differences from that fallback:

1. **Notation:** the doc writes the non-blue allele of the husky blue-eye gene as `bl`, not `n`. Use `'bl'` in `genes.Bl`.
2. **Red dogs are `e/e`:** Mochi and Biscuit have red coats, and a red coat needs two `e` alleles.
   - The fallback gave them `E/e`, which would draw a black-based coat.
3. **Carriers changed:** the doc hides more carrier genes so the v2 teaching examples work.

| Dog | Fallback said | Doc says |
|---|---|---|
| Mochi | D/D | D/d |
| Biscuit | D/d | D/D |
| Sunny | B/B | B/b |
| Frost | E/E | E/e |
| Pepper | D/D, E/E | D/d, E/e |

   The doc's teaching examples need these values:
   - Mochi × Pepper can make a lilac puppy (1 in 32).
   - Biscuit × Frost can make a surprise piebald (1 in 4).

All genotypes are consistent with each dog's visible coat and eyes. A capital letter is dominant.

## Genotypes

| key | Dog | B | D | E | S | M | Bl | Visible coat | Eyes | Hidden carriers |
|---|---|---|---|---|---|---|---|---|---|---|
| `shiba` | Mochi | B/b | D/d | e/e | S/S | m/m | bl/bl | Red (red-orange, with cream Shiba markings) | brown | liver, dilute |
| `corgi` | Biscuit | B/B | D/D | e/e | S/sp | m/m | bl/bl | Red (tan, with white Corgi markings) | brown | piebald |
| `golden` | Sunny | B/b | D/D | e/e | S/S | m/m | bl/bl | Red (golden) | brown | liver |
| `dachs` | Noodle | b/b | D/D | E/E | S/S | m/m | bl/bl | Liver (chocolate) | amber | none |
| `husky` | Frost | B/B | D/d | E/e | S/sp | m/m | Bl/Bl | Black-based, drawn as husky grey and white by the breed markings | blue | dilute, red, piebald |
| `mutt` | Pepper | B/b | D/d | E/e | sp/sp | m/m | bl/bl | Black piebald (black-and-white patches) | brown | liver, dilute, red |

## Ready to paste (game data)

The v1.5 genes module `mods/genes.js` (`PawGenes.STARTER_GENES`, `PawGenes.phenotype`) is the source of truth. The coat names below match its output.

```js
const STARTER_GENES = {
  shiba:  { B: ['B','b'], D: ['D','d'], E: ['e','e'], S: ['S','S'],   M: ['m','m'], Bl: ['bl','bl'], coat: 'Red with cream urajiro', eyes: 'brown' },
  corgi:  { B: ['B','B'], D: ['D','D'], E: ['e','e'], S: ['S','sp'],  M: ['m','m'], Bl: ['bl','bl'], coat: 'Red and white', eyes: 'brown' },
  golden: { B: ['B','b'], D: ['D','D'], E: ['e','e'], S: ['S','S'],   M: ['m','m'], Bl: ['bl','bl'], coat: 'Golden', eyes: 'brown' },
  dachs:  { B: ['b','b'], D: ['D','D'], E: ['E','E'], S: ['S','S'],   M: ['m','m'], Bl: ['bl','bl'], coat: 'Chocolate and tan', eyes: 'amber' },
  husky:  { B: ['B','B'], D: ['D','d'], E: ['E','e'], S: ['S','sp'],  M: ['m','m'], Bl: ['Bl','Bl'], coat: 'Grey and white', eyes: 'blue' },
  mutt:   { B: ['B','b'], D: ['D','d'], E: ['E','e'], S: ['sp','sp'], M: ['m','m'], Bl: ['bl','bl'], coat: 'Black & white piebald', eyes: 'brown' }
};
```

## Rules the coat and eye names follow (from the doc, for later checks)

**Coat**, read in this order:
1. `e/e` → red, gold or tan by breed. With `d/d` too → cream. Merle never shows on `e/e`.
2. Otherwise `B` gives black and `b/b` gives liver.
3. `d/d` turns black into blue and liver into lilac.
4. One `M` → merle. Two `M` are never allowed.
5. `sp/sp` → piebald white patches.
6. Breed markings are drawn on top.

**Eyes:**
1. Any `Bl` → blue. With a single copy, there is a 1 in 4 chance of odd eyes instead.
2. Otherwise merle → a 1 in 4 chance of odd eyes.
3. Otherwise `b/b` → amber.
4. Otherwise brown.

Sex does not change genes. A dog of either sex can have any genotype.
