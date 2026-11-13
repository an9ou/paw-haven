# Sakura Market: phone + code review (13 Nov 2026)

Reviewer: paw-reviewer (read-only), branch claude/sakura-market at dbd81d89. v219_friends run, 30 shots at 360x640 / 390x664 / 1280x720 in en de ja, the wm_review placement script, balance_sim --add with the 22 items, i18n_extract --en (scratch copy).

## Must-fix
1. Friends lists out of step; v219_friends fails ("FR_GIFTS, FR_DECOR, FR_HOUSES and FR_NOTES match the game tables"). Sakura rows were inserted mid-table in HM_DECOR (game/src/03_yard.js:965-969), FOOD (00_core.js:53-54), HOUSES (00_core.js:214), none added to FR_DECOR/FR_HOUSES/FR_GIFTS (50_friends.js:34-53). A dog in the Blossom Kennel shows a Cardboard Box in friends' yards (50_friends.js:162,165); the 5 decorations never show, the 2 treats can't be gifts. Fix: append only (the Worker checks positions): FR_DECOR 35 -> 40, FR_HOUSES 15 -> 16, FR_GIFTS 47 -> 49; orderOk() (50_friends.js:1635) checks a frozen prefix plus later additions (or move the Sakura rows to the table ends). Worker: cloudflare/worker.js:212 FR_LIM = { notes: 12, gifts: 49, decor: 40, houses: 16 }; update game/test_v219_friends.js:211-212 and game/test_worker.js:322; deploy the Worker first or add an older-Worker fallback like FR_DECOR_OLD (35 decor, 15 houses).
   Status: FIXED. FR_DECOR 35 -> 40, FR_HOUSES 15 -> 16, FR_GIFTS 47 -> 49, all appended at the END (50_friends.js), so every existing index is unchanged. The Sakura rows stay mid-table in HM_DECOR / FOOD / HOUSES (next to the other festival rows: moving them would change shop order, and HOUSES order is the house list), so orderOk() now checks a frozen prefix (the pre-Sakura rows in table order) plus the Sakura rows (fest 'sakura') appended after it. Worker FR_LIM = { notes: 12, gifts: 49, decor: 40, houses: 16 } with a comment; the game falls back for an older Worker (decor 35, houses 15, gifts 47): FR_SAK_DECOR / FR_SAK_HOUSES / FR_SAK_GIFTS and FR.sakOld resend the yard without the Sakura items (Blossom Kennel sent as house 0), and the two treats are not offered as gifts, then the existing FR_DECOR_OLD (31) step if still refused. Tests updated: test_v219_friends (lengths, plus a new Sakura fallback check), test_worker, test_v224_worker (house 16). The Worker still has to be deployed with the 1 Mar 2027 release.

## Should-fix
2. 4 of 5 decorations don't land at their catalogue spot (hoKeepBoxes moves them): Bento Picnic Table (03_yard.js:968) and Blossom Swing (:969) overlap the dog-house box [640,340,204,186]; Paper Sakura Tree (:967) on the mailbox; Paper Lanterns (:966) inside HO_WALL_KEEP.yard (28_home.js:89). The swing then lands at [548,392,72,132] on the v2.26 yard visitor (YV_SPOT [592,452], 54_visitors.js:152), which hoKeepBoxes (28_home.js:75) doesn't keep clear. The lanterns move to x 404-604, across both phone halves (140-534, 518-912). Fix: new at spots clear of house, mailbox and visitor, each inside one phone half; add YV_SPOT to hoKeepBoxes; add wm_review section 4's assertions to sakura_market.
   Status: FIXED. New spots in 03_yard.js: Lanterns [632,260] (fence, right of the Fir Tree, half B), Paper Sakura Tree [536,464] (under the visitor box, half B), Bento Table [664,528,90,68] (below the dog house, half B), Blossom Swing [846,260,66,122] (right of the dog house, half B; sized to end at x 912). YV_SPOT box added to hoKeepBoxes (28_home.js). Side effect: the visitor box leaves only one tree-size slot in the yard (right of the dog at rest), which the Sakura tree takes; the winter Felt Fir Tree (old spot over the visitor) now lands at the least-overlap spot when bought, so wm_review section 4 buys the Fir last and no longer asserts its spot. sakura_market section 5b asserts: one phone half, clear of dog house, mailbox, house wall and visitor, landing at the catalogue spot in an empty yard, clear of all keep boxes, no overlaps among the five, and lanterns clear of the Candy-Cane Fairy Lights when both are out.
3. The game's own reduce-motion setting doesn't stop the petals (game/css/50_market.css:27); add html[data-motion="off"] .fm-petal{animation:none;opacity:0} (like 57_projects.css:39).
   Status: FIXED. 50_market.css: html[data-motion="off"] .fm-petal{animation:none;opacity:0}.

## Nice
4. en "Hanami Sun Hat" and "Picnic Basket Bed" touch the card edge at 360/390 wide; run i18n_fit PAW_FIT_SCREENS=fm after translation.
5. game/run_tests.js:133-134: the wm_review comment moved onto the sakura_market line.
   Status: FIXED. The wm_review comment is back on its own line.
6. Dog Cards: the 8 costumes aren't in DC_OUTFITS (40_dogcards.js:31-37), like the Winter and Halloween costumes; no DC_LIM change. (If wanted: append, DC_LIM.outfit 57 -> 65, Worker first.)
   Status: SKIPPED (GM decision): consistent with the Winter and Halloween costumes; no DC_LIM change.

## OK
7. Window ['03-25','04-10'] on the Japan date (49_market.js:40, :16, :81); nothing shows from 1 Mar until 25 Mar; closes 11 Apr, a dog there walks to the Square, bought things stay; normal shops leave out fest items (05_market_shops.js:106,110). No page errors.
8. Old saves: no new S fields, migrate() untouched, v stays 1.
9. Caps: Dango and Koi under FF_CAPS.toys 30/day; Petal Ball 2 coins a return under 16/session, 40/day (49_market.js:259).
10. Cardigan in WARM_WEAR (00_core.js:1311); fest:'sakura' music only at the market, back to normal when it closes.
11. Phone layout at 3 sizes: taps >= 44 px, text >= 15 px, nothing under the phone bar, no sideways scroll, petals pointer-events none; first phone view shows Decor, Clothes and Homes; Toys behind look-right, like the Winter Market.
12. No clash with v2.26-v2.29 beyond 1 and 2.
13. Economy: regular ~932/day, light 312, keen 2,020; whole stock (3,062) = 3.3 / ~10 / 1.5 days; every item < 1 regular day (sim says TOO CHEAP), same prices as the Winter Market: owner's call, not a bug.
14. Words: clean.
15. Translation batch: 48 new keys (data.clothes 16, data.hm_decor 10, data.food 6, data.toys 6, data.beds 6, data.houses 2, mod.toys.sk_dango_hint, mod.toys.sk_koi_hint); en.json out of date (run i18n_extract --en, i18n_pack).

## Art review items fixed here (code side; the artist keeps Sakura_review_art.md)
- Art 2 (Paper Sakura Tree on the mailbox): FIXED with phone/code item 2: the tree starts at [536,464], clear of the mailbox post (179-245 x 258-346).
- Art 3 (Lanterns across the window and clothesline): FIXED with phone/code item 2: along the fence at [632,260] like the Candy-Cane Fairy Lights, clear of the house wall box. (hoFreeSpot moves it off the Candy-Cane lights if both are out.)
- Art 7 (petals at night, a petal over the "s" of Homes): FIXED. The petals take the class nt after dark (opacity .45, fmPetals(lit) in 49_market.js, 50_market.css); the petal that fell over the Homes board moved from x 350 to x 388.
- Art 8 (Pup Mochi lesson): FIXED. 00_core.js says cooked sweet potato and a steamed cabbage leaf. Needs the translation batch (the English text changed).
