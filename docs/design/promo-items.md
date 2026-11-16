# Promo-code looks (draft, 16 Nov 2026, branch `claude/promo-art`)

Exclusive looks the owner gives away with a promotion code posted for social media followers. **Never sold, never earnable otherwise**: no shop,
market, stall, Fun Fair, level, Bond or notebook list shows them. The code system (another branch) grants them by name.

| Look | Table | Flags | Art |
|---|---|---|---|
| Follower Star Bandana (neck) | `CLOTHES` (`game/src/00_core.js`) | `promo: true, reward: true, price: 0, bond: 1` | `NECK2` in `dogs/pawart_dogs.js` (the Tokyo bandanas' `tkBand`), item card in `world/pawart_world_b.js` |
| Paw-Print Pennant (yard decor) | `HM_DECOR` (`game/src/03_yard.js`) | `promo: true, reward: true`, no `v27`, `fest`, `price` or `bond` | prop `prpennant` (100x160) and item card in `world/pawart_world_b.js` |

- `PROMO_LOOKS` (`game/src/03_yard.js`) lists every row flagged `promo` as `{ n, kind }` (`clothes` / `decor`): what a code may grant.
- Friends and Dog Cards (append only): the pennant is the last of `FR_DECOR` (`game/src/50_friends.js`, 32), the bandana the last of `DC_OUTFITS`
  (`game/src/40_dogcards.js`, 58). The Worker needs `FR_LIM.decor 32` and `DC_LIM.outfit 58` (`cloudflare/worker.js`), deployed before a code can grant them.
- Pennant catalogue spot `[446, 516, 48, 78]`: on the grass in front of the dog at rest, in the phone's left half (x 140-534), clear of the garden hotspot,
  the mailbox, the house door, the bowl, the dog house, the yard visitor (`YV_SPOT`) and the pack spots (desktop and phone). `hoFreeSpot` moves it when another decoration stands there.
- Renaming: the names are literal in the rows, the art keys and the lists above (the i18n extractor reads literals). One `grep -rl` for each name
  (`game/src`, `dogs/`, `world/`, `game/test_*.js`, `dogs/connect_check.js`, `dogs/fill_sweep.js`) and a replace renames it; the data keys
  (`data.clothes.<tid>.*`, `data.hm_decor.<tid>.*`) follow the name, then `node tools/i18n_extract.js --en`.
- New English text (translated in one batch with the code system): `data.clothes.follower_star_bandana.n`, `.perk`; `data.hm_decor.paw_print_pennant.n`, `.story`;
  `data.dc_outfits.57`.
