# Open issues

Logged by the v2 build agents (Paw Haven Studio). Fixed items say which version fixed them (v2.0.1, v2.1, v2.2 or v2.3).

## Gameplay
- [x] Puppies could travel to Park / River / Woods / Beach as a place. Fixed: under 3 months and nursing mums stay home.
- [x] Spot 4 took about 1.5 months for heavy players. Fixed: 60 care days.
- [x] Mix puppies can carry coats outside their body breed's coat catalogue. Fixed in v2.1: they show as bonus coats.
- [x] Horgi × Horgi pups are still named "Mutt mix". Fixed in v2.5: a same named mix keeps its name, and 3/4 dogs follow the top breed. `game/src/13b_breeding.js`
- [ ] Coat catalogue is 186 coats, bigger than the planned 84 (decide: keep or trim). `mods/genes.js`

## Layout
- [x] Yard mailbox sat next to the dog's tap area. Fixed: taps on the mailbox behind the dog open it.
- [x] Visitor spot is tight with 4 dogs in the Square and Café. Fixed in v2.1: a dedicated visitor spot.
- [x] Family-tree child branches sit a bit low. Fixed in v2.1.
- [x] Mum isn't drawn inside the nursery basket. Fixed in v2.1: `mumInBasket`.
- [x] The board sniff summary doesn't name the dog. `game/src/14b_vet_playboard.js` Done in v2.9: "<Dog>'s sniff test: ...".
- [x] The painter's chip labels are cramped. `game/src/14b_vet_playboard.js` Done in v2.9: head plus name, 44 px, 15 px text (`game/css/13b_town_v2.css`).
- [ ] The album slot grid is HTML laid over the `album` prop. `game/src/07b_mailbox.js`

## Art & audio
- [x] Coat Collector Ribbon had no art. Fixed.
- [x] Pregnant belly was very subtle on the fluffy golden. Fixed.
- [ ] Greyhound head on short bodies keeps a longish snout. `dogs/pawart_dogs.js`
- [x] Some newborn squeaks are a few dB quiet. `mods/pawaudio.js` Done in v2.9: a per-breed `NB_TRIM` table, spread now -25.7..-22.8 dB.
- [x] The Rainbow Collar tag is a 4-point sparkle; the spec asked for a 5-point star. `dogs/pawart_dogs.js` Fixed (art-fixes): a 5-point star, same centre and size.
- [x] The rocking chair's backrest leans a little. `world/pawart_world_b.js` Fixed (art-fixes): it stands upright, on the yard prop and the item card.

## Project
- [x] The claude.ai artifact publish was blocked by the full-read requirement on a 1.8 MB page. Fixed in v2.4: `tools/artifact.js` builds a multi-file artifact (152 KB index.html + 6 script files); a subagent does the one-time read.
- [x] Publish to the claude.ai artifact. Done with v2.1.
- [x] Saves were per copy with no export. Fixed in v2.2: cloud save on the web version and Export / Import save codes on every copy.
- [ ] Under parallel load (`--jobs 2`) a few desktop checks time out once and pass on retry: v16b (night bark, the click that interrupts an idle, the dev panel Close button), v21_home (Proud Mum picks "down": the test pins `Math.random` around one call and an idle tick can take it). Same timings as before v2.2. `game/test_v16b.js`, `game/test_v21_home.js` v2.9: the `v21_home` roll is fixed; the v16b night bark, idle click and Close button items did not reproduce in 5 loaded runs.
- [ ] Install Node and Playwright on this Mac to run the test suites (see README).

## Phone (v2.2)
- [x] The portrait lock pauses CSS animations and the walk runner; fetch and the trick mini-games keep running behind the card. `game/src/19_fetch.js`, `game/src/15b_trick_games.js` (listen to `phone:lock`)
- [ ] Realtime sync could not be tested live from the build container (its proxy blocks WebSockets). The mocked suite covers it, and a focus pull covers the same path. Check once on real phones. `game/src/22b_cloud.js`
- [x] Desktop Settings now scrolls: the Cloud save and Save code section pushes Reset save and Title screen below the fold at 1280×720. `game/src/20_settings_dev.js` (v2.3 phone-home lane)
- [x] Landscape tablet runner: the hint says "tap the scene", but only the right half jumps (Duck sits on the left). `mods/walkrun.js`
- [x] Garden on phones: plots 5 and 6 and the plot card sit below the fold; seeds need two taps (dig, then plant). `mods/garden.js` (v2.3 phone-home lane)
- [x] Walk results sheet: the "Walk complete" title is drawn over the panel's header art. `game/src/09_walk_classic.js`
- [x] Runner countdown overlaps the legend in portrait for a moment. `mods/walkrun.js`
- [x] Market Street: the place buttons overlap the street sign; the map speech bubble covers "you are here". `game/src/14_town_places.js`, `game/src/08_map.js`
- [x] Mailbox Letters / Album buttons measure 38–41 px on phones; nursery sex symbols are about 13.6 px. `game/css/23_phone_journal.css`, `game/css/24_phone_puppy.css` (v2.3 phone-home lane)
- [x] The camera crop can hide the Dog Park board and the Square easel (their place buttons work). `game/src/03_yard.js` (v2.3 phone-home lane)
- [ ] The Playwright iPhone 13 profile is 390×664, not 390×844, so sheet heights were tested at the smaller size. Check once on a real iPhone.
- [x] The register fallback (`signUp`, only used if a project still asks to confirm email changes) had no push guard like the login one. `game/src/22b_cloud.js` clRegister (v2.3 account lane)
- [ ] The QA audit (Haiku) covered title, yard, market and map by hand. Every other screen is covered by its lane's phone suite, not by a separate audit.

## Phone (v2.3)
- [ ] Realtime sync still needs a real two-phone check. The mocked suite covers it. `game/src/22b_cloud.js`
- [x] Playdate pals' noses nearly touch in the bow pose at 390 px wide. `game/css/24_phone_puppy.css` Done in v2.9: pals 20 px further apart on phones.
- [ ] With puppies, the nursery basket sits right of the phone view and is reached with "look right" (accepted in v2.3). `game/src/03_yard.js`
- [x] The map zoom buttons were checked clear of the labels only in the default (unpanned) view. `game/src/08_map.js` Done in v2.9: after a drag, pinch or zoom tap on phones the map slides clear of the place names (`mapClearCtl` pattern).
- [x] Supabase is gone (v2.9.1): nothing to confirm.
- [ ] The "look right" peek button and the nap details card are new. Check both once on a real phone.

## Shop Day (v2.4)
- [x] On phones Gerald's steps 6 to 8 run to 4 lines in the strip (the spec said two). Fixed in v2.5: shorter phone wording (`tp`). `game/src/25_guide.js`
- [x] Toasts can sit over a sheet's title for 3 s on phones (the Missions sheet, the Wardrobe heading). Fixed in v2.5: toasts sit just under the sheet's title. `game/src/00_core.js` toast()
- [x] The yard missions clipboard hides while a feed / play / care tray is open on phones (its tap target would shrink under 44 px). A tray-aware tap rect would let it stay. `game/css/27_missions.css` Done in v2.9: the tap rect follows the shrinking scene (`msYardFit`) and stays 44 px; a tap opens Missions and closes the tray.
- [x] Under the test harness missions and the walkthrough only run when a suite sets `prefs.msTest` / `prefs.gdTest`, so the older suites never exercise them alongside the old flows. One combined smoke pass would catch interactions. `game/src/24_missions.js`, `25_guide.js` Done in v2.9: `test_v29_flows.js` runs missions and the walkthrough with adopt, feed, pet, toy, walk, shop and travel.
- [x] The six house-card item icons draw the house at about 50 px, so detail is soft at the 40 px shop scale. Fixed in v2.5: bolder icons. `world/pawart_world_b.js`
- [x] The garden module has no watering callback, so no mission can ask for watering. Fixed in v2.5: `onWater` and the "Water the garden" mission. `mods/garden.js`
- [ ] Owner: open the claude.ai artifact once on a phone and a laptop to confirm the multi-file version boots there (it was checked in headless Chromium over http, not on claude.ai itself).

## Autumn & New Pups (v2.5)
- [ ] Coat catalogue is now 14 breeds; the old keep-or-trim question (planned 84 coats) is still open. `mods/genes.js`
- [ ] `S.warmUntil` (Warm Bone Broth) is save-wide, so a second dog is warm too for the hour. In the dog's favour, so left as is. `game/src/00_core.js`
- [ ] The parade line-up draws five dogs from `playboardDogs` (four) plus one extra seeded roll. A sixth town dog would need a bigger board. `game/src/26_festival.js`
- [ ] Spring and winter have no festival yet (the season art is ready for one). `game/src/26_festival.js`
- [ ] Git tags do not reach GitHub through the build container's proxy, so `v25-base` is also a branch. Delete the branch when the tag is pushed from a machine that can. `tools/`
- [ ] Owner: play one October day on a phone (leaf piles, the stall, the parade) and check the seasons with the Dev panel Season select.
- [x] Fetch on phones: the scene is full width but only about 234 px tall, with blank space under the panel. Gone in v2.10: the Fetch challenge is retired, and ball play runs in the place's own scene with a 760-unit crop. `game/src/38_ball.js`
- [ ] Market Street on phones: the first camera move re-applies a zoom about 7% tighter than the home framing (pre-existing; the town occlusion checks tune that framing). `game/src/03_yard.js`
- [ ] Round buttons lost their hatching when the fill was fitted inside the outline (the crayon look is kept by the wash). Decide whether to draw a clipped hatch. `game/css/01_sketch_surface.css`
- [ ] Tray-card notes clamp at 2 lines on phones. `game/css/21_phone_home.css`
- [ ] The `account` suite takes about 260 s alone, near its 300 s watchdog, and can hit it under `--jobs 2`. `game/test_account.js`

## Halloween 2026 (v2.6)
- [ ] Owner: play one evening in the Square on a phone (the pop-up, the night glow) and buy one thing from each section.
- [x] The yard decorations and the festival props (the Harvest Stall, the pop-up by day) get no night tint, so they look bright next to the night scene. One shared night tint would fix them all. `world/pawart_world_b.js`, `game/src/03_yard.js` Fixed (art-fixes): `PawArt.tint(svg, {time, lit})` gives a prop the scenes' own dawn, dusk and night recolour (glows, masks and candlelight kept); `propTint()` in `03_yard.js` uses it for the yard decor (v2.7 decorations included, lit ones drawn lit), the stall, the banner, the leaf piles and the unlit pop-up.
- [ ] The v2.5 porch jack-o-lantern keeps its pale glow (it must stay byte-identical), while the v2.6 pumpkins glow warm. `world/pawart_world_b.js`
- [x] Pre-existing: at night the shop window glow draws over the Town Notice board in the Square. `world/pawart_world_c.js` Fixed (art-fixes): the window glows are masked by the board's silhouette (`k.unlit`, world C).
- [ ] Pre-existing: on phones, a visiting dog with no pack dogs takes Square pack spot 0 and the camera only widens to the right, so the visitor and the Harvest Stall can sit off-screen at 360 px. `game/src/03_yard.js` phHomeRefit
- [x] On phones the dog house's jack-o-lantern can show cut in half at the right edge of the yard's home view. `game/src/26_festival.js` Fixed (art-fixes): phones tuck it in at the dog house's right front corner, `FS_PUMPKIN_PH` [796, 488]: outside every portrait home view, whole in the look-right crop.
- [x] Market Street's Halloween bat bunting sits right under the place label on phones. `world/pawart_world_a.js` Fixed (art-fixes): strung under the signs at y 229, along the awning tops (the phone label reaches y 130).
- [ ] The v2.6 items are 2026 only. A Halloween 2027 would need new `ed: 2027` items and a `HW_WIN` entry (the pop-up code is written for any edition). `game/src/00_core.js`, `game/src/27_halloween.js`
- [ ] Under parallel load, `account` can hit its 300 s watchdog, and `phone_town`, `phone_occl_home`, `phone_v25_fixes_a`, `phone_puppy` (iPhone 13 "Stay toggles by tap", 3 of 3 clean alone) and `v21_home` can need their retry. `v21_home` "chair put away: she does not lie down" also fails about 1 run in 4 on its own, on integration/v2.7 too (idle pose roll).

## Home & Pack (v2.7)
- [ ] Owner: on a phone, decorate the yard and the house (drag and tap-to-place), feed and bathe a pack of three, and visit the Shelter Playroom (pet, belly rub, toss a toy, Meet, Adopt).
- [ ] On iPhone 13 the Feed tray with a pack caps its height so the dogs stay in view, and the "Feed all" row sits below the fold with no hint that the tray scrolls. `game/src/03_yard.js` phTrayCap
- [ ] Phones: the first pack dog's yard spot (`PACK_SPOTS_PH.yard[0]`, front left) stands in front of the main bowl while the Feed tray is open. `game/src/13_more_dogs.js`
- [ ] The free-spot scan can put the Bird Bath in front of the house door (desktop did before, phones now too). `game/src/28_home.js` hoFreeSpot
- [ ] The String Lights' left end hangs in the air (the right end sits on the pole). Tie loops at both ends or a spot along the fence. `world/pawart_world_b.js`, `HM_DECOR`
- [ ] Barkitecture tabs: only Furniture has an icon (hidden on phones). Houses, Beds and Decor have none. `game/src/05_market_shops.js`
- [ ] Shelter on desktop: the sign at the very top is cropped (the HUD is hidden there so the whole board shows). Six room dogs look a little crowded on an iPhone floor. `game/src/30_shelter.js` srCam
- [ ] On phones the test-harness dev button covers the board's top-right corner (harness only).
- [ ] Pre-existing: at 360 px the shelter list sheet's dog-spot cards wrap one word per line. `game/src/13_more_dogs.js` openShelterList
- [ ] Pre-existing: a garden toast can cover the plot card's buttons on phones.
- [ ] `node dogs/check_identical.js` exits 1 against `v27-base`: the 3302 differences are all the intended Rainbow Collar star (art-fixes). Make the next base after v2.7 (`v28-base`) so it is clean again.
- [ ] Flaky under load, clean alone: `phone_legacy` ("settings: tap targets", `#dogHit` measured mid-move), `phone_occl_home` (dog park board), `phone_v27_shelter`. `v21_home` "Proud Mum lies down" fails about 1 run in 3 alone, on `v27-base` too (idle pose roll).
- [ ] Stale v2.1 branches `lane/home` and `lane/shelter` are still on GitHub (v2.7 used `lane/v27-*`). Delete them from a machine that can.

## Winter & New Year (v2.8)
- [ ] 2028 needs a `NY_ZODIAC` entry for the Year of the Monkey and its item (a year without one sends Gerald's card as plain news). `game/src/32_newyear.js`
- [ ] Market Street shows only a small Fuji cap on desktop (the market camera is lifted 30 units under jp). `game/src/05_market_shops.js`
- [ ] The runner's far layer has no Fuji (the walk strip carries it, repeating every 1200 units). `mods/walkrun.js`
- [ ] New Year pup cards don't stamp the postcard album (`nyPup`). `game/src/32_newyear.js`
- [ ] The New Year Square crowds one spot left of centre. `game/src/32_newyear.js`
- [ ] The stall's New Year kadomatsu are tiny. `world/pawart_world_b.js`
- [ ] The Paper Snowflake Garland reads as stars when small. `world/pawart_world_b.js`
- [ ] The Red Wooden Sled can be placed against the house wall. `game/src/28_home.js`, `HM_DECOR`
- [ ] The yard's ambient sparkle can land on Fuji. `game/src/03_yard.js`
- [ ] At 360 px with a visitor, the Fortune box chip overlaps the notice board's bottom notes. `game/src/32_newyear.js`
- [ ] Under jp, the Market Street dog hit box overlaps the desktop place-button row by about 10 px. `game/src/05_market_shops.js`
- [ ] Dog outfit nits: the antlers squash in rollover, the greyhound's head is small, the snood covers the chin in sleep, the sheep hood's horns overlap. `dogs/pawart_dogs.js`
- [ ] The itch.io build waits for the Cloudflare login work (`docs/CLOUDFLARE_LOGIN.md`).
- [ ] Halloween 2027 still needs new items and an `HW_WIN` entry (see Halloween 2026 above).
- [x] Flaky under load in the v2.8 `all --jobs 2` run, clean 3 of 3 alone: `v27_home` (the Dog Play Tower's front layer still showed before a use, likely an idle furniture use starting between free and check), `v171_garden` (the reload's `#tContinue` wait timed out at 20 s), and `v21_home` "proud mum" (the known idle pose roll). Done in v2.9: `v21_home` and `v27_home` read in one page task; `v171_garden` (and `v16b`) re-seed the save through the harness init script, because Chromium can drop a localStorage write across a reload (about 1 in 25). 5 of 5 clean under load.

## All Together (v2.9)
- [ ] Safari / iOS: photo mode's Web Share and the second-load font workaround for SVG images are written from known behaviour, not run on a real iPhone (the owner's real-phone check). `game/src/35_photo.js`
- [ ] Photo mode on the claude.ai artifact picks the "Press and hold to save" view by `clArtifact()`; check it once in the live artifact. `game/src/35_photo.js`
- [ ] The v2.7 bath queue (`crBathSwap`) can still save the bathing dog as the leader if the game closes mid-bath (pack training is fixed through `saveNow`). `game/src/29_pack_care.js`
- [ ] `bindPack` re-binds every pack dog's pet handlers after each redraw (v2.8.4 behaviour; `pkHold` binds once). `game/src/13_more_dogs.js`
- [ ] The classic walk (the fallback when PawWalk fails) pays the followers but does not draw them. `game/src/09_walk_classic.js`
- [ ] No photo in the Shelter Playroom (its dogs aren't the pack); decide if it should have one. `game/src/35_photo.js`
- [ ] `v27_review` ("the bath finishes from the house") and `v28_scenes` (420 s timeout) failed once under heavy load (the full run plus three reviewers), clean alone.
- [ ] Flaky once in the final v2.9 `all` + `phone` run, clean 3 of 3 under load afterwards: `phone_home` (a tap timed out), `v2_journal` (the mailbox centre click, 4 s wait), `phone_v27_shelter` (a tap on a room dog).
- [x] `v24_guide` lost its save across the reload about 1 in 2 runs, on v2.8.4 too (the Chromium localStorage race). Fixed in v2.9 with `t.reloadKeepingSave()` in `game/test_lib.js`; use it for any reload that must keep the save.

## Free to Roam (v2.10)
- [ ] On a narrow phone the yard home crop (about 490 units on an iPhone 15) has no free spot beside the leader for the pack dogs, so they stand outside it and the look chip shows them. The leader can roam outside the crop too. `game/src/37_roam.js`
- [ ] `#ballLayer` is not depth-sorted with the dogs: the ball draws over the legs of dogs standing in front of it. `game/src/38_ball.js`
- [ ] `phone_occl_play` is flaky under load (the walkfetch toast, the runner hint). Not from v2.10. `game/test_phone_occl_play.js`

## Faces & Feelings (v2.13)
- [ ] The Ghost Sheet, the Trick-or-Treat Ghost and the Heart Sunglasses hide the expression's eyes (`ghostEyes` draws the pose eyes), so only the marks show. `dogs/pawart_dogs.js`
- [ ] On phones the `fx` marks can be cut at the crop edge with no look chip (`rmLookSync`), and they pile up when several dogs show the same face. `game/src/37_roam.js`
- [ ] The phone occlusion suites don't run with `prefs.exTest`, so nothing checks the `fx` marks against the hot spots. `game/test_phone_occl_home.js`, `game/test_phone_occl_play.js`
- [ ] Sparkle stars shift a little when a head tilts. `dogs/pawart_dogs.js`
- [ ] `dogHead` has no `fx`, so the wink is weak on the 40 px chip, and small-eyed breeds (dobie, corso, greyhound, chow) read weaker there. `dogs/pawart_dogs.js`
- [ ] The face words can touch the chihuahua's tall ears when it faces down. `dogs/pawart_dogs.js`
- [ ] 2 of 2625 face renders still change scale by less than 1%. `dogs/pawart_dogs.js`
- [ ] The photo face picker shows the leader's head only. `game/src/41_expressions.js`

## Fourteen New Friends (v2.12)
- [ ] `NOSE_DX` has no rows for the seven v2.11 breeds (`akita`, `spitz`, `pom`, `afghan`, `dane`, `mastiff`, `gsd`), so their treat lure starts at the default x. `game/src/15b_trick_games.js`
- [ ] The training lure position comes from `dogTo(0, 0, 1)`, not from each dog's size class. `game/src/15b_trick_games.js`
- [ ] Four big dogs together overfill Shibuya and the Pixel 7 phone crop. `game/src/39_tokyo.js`, `game/src/37_roam.js`
- [x] Some old breeds' heads float off the body in a few poses (as the yorkie, schnauzer, pit bull and lab did before fix/v212-neck): the collie's howl, the shiba, chihuahua and beagle in happy, speak and howl. Fixing them changes old renders (needs the owner's go-ahead and a new `check_identical` baseline). `game/v212_neck_check.js` can measure them. `dogs/pawart_dogs.js` Done in v2.13: `NECKFIX` (23 adult breed and pose renders) and the neck tube on every mix (`V213.md` section 8).
- [ ] The site's Playroom animates only the first 14 dogs (`KEYS` in `site/js/site.js`); the other 21 have profiles but never walk in it.
- [x] The Worker change (`DC_LIM` { n: 115, breed: 35, outfit: 50 }) needs `bash tools/cf_api_deploy.sh` with the release. The coordinator deploys it with v2.12.

## Costumes & Sizes (v2.11.1)
- [x] The three new costumes (Pumpkin Patch Suit, Trick-or-Treat Ghost, Little Bat Costume) are not in the Dog Card list `DC_OUTFITS`: adding them changes the Worker's list counts and needs a Worker deploy in the same release. A card dog wearing one shows its next listed item. `game/src/40_dogcards.js`, `cloudflare/worker.js` Done in v2.12: appended to `DC_OUTFITS`, `DC_LIM.outfit` 50.
- [ ] The new costumes have no item drawing in the art module: the pop-up, Wardrobe and Journal use the `HW_ITEM_FB` doodles in `27_halloween.js`.
- [ ] With the bigger dogs (v2.10 size x 1.25 x class) the narrow phone yard fits fewer dogs on screen, so the look chips show more often.
- [ ] At the Dog Park a card visitor may stand partly behind your dogs (allowed since v2.11).
- [ ] `phone_occl_play` is still flaky under load (passes on retry).
- [ ] `phone_v25_fixes_b` "the view eases back to the dog after the drag" (iPhone or Pixel yard) fails about half the runs, on `v2111-base` (v2.11) too: the camera does not settle within 3 units in 9 s. Pre-existing, not caused by v2.11.1. `game/test_phone_v25_fixes_b.js:77`
- [ ] A costume hides the head-slot hat, but the hat's perk still works and the Wardrobe gives no hint that the hat is hidden.

## Tokyo Trip (v2.11)
- [ ] Pre-v2.11, found by the phone review: on phones `#mapPan` is 24 px wider than the screen. `game/src/08_map.js`
- [ ] Pre-v2.11, phone review: the Dog Park sign measures 95 x 40 px on phones.
- [ ] Pre-v2.11, phone review: photo mode shows a blank band on phones. `game/src/35_photo.js`
- [ ] `v211_dogs` takes about 440 s alone (its timeout is 700 s). Split it or sample fewer renders. `game/test_v211_dogs_node.js`
- [ ] `account` and `cloud` are slow under load (the full parallel run), clean alone.
- [ ] The site rows for the 7 new breeds and the privacy page's Dog Cards section are committed but not deployed (owner's go-ahead: `bash tools/cf_pages_deploy.sh`). `site/`, `tools/site_dogs.js`
- [ ] The lane screenshots from CARDS (about 8 MB) and TOKYO ART E (about 26 MB) came into the history through early merges (accepted). Later lanes keep theirs on the lane branch only.
- [ ] Waiting (owner, V211.md section 6): the day trips (Kamakura, Hakone, Kyoto) for v2.12, Quick Chat with preset phrases and friends for v2.12, and the breeds Japanese Chin, Shih Tzu and Kai Ken.

## Reset code in the game (v2.9.2)
- [ ] Live email needs the Resend domain doodledoggo.app verified (it was still verifying on 17 Oct). Until then `/forgot` answers the same and the send fails quietly in the Worker log. Re-check with a real account once Resend says verified.
- [ ] `site/privacy.html` still says the only emails are "a password link". The SITE lane (site/v2) should say "a password code". `site/privacy.html`
- [ ] `POST /reset` (the v2.8.2 link) and the D1 table `resets` stay only for links sent before v2.9.2 (they all ran out 30 minutes after the deploy). Remove both in a later release. `cloudflare/worker.js`, `cloudflare/schema.sql`
- [ ] The keyboard check runs in Chromium with a shorter screen (the Android way). Check the iPhone overlay keyboard once on a real phone (`rsKeyboard`, `game/src/22d_reset.js`).
- [ ] `tools/cf_site.js` still describes /reset as the password form in its header comment (harmless).
