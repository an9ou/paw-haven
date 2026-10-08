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
- [ ] The board sniff summary doesn't name the dog. `game/src/14b_vet_playboard.js`
- [ ] The painter's chip labels are cramped. `game/src/14b_vet_playboard.js`
- [ ] The album slot grid is HTML laid over the `album` prop. `game/src/07b_mailbox.js`

## Art & audio
- [x] Coat Collector Ribbon had no art. Fixed.
- [x] Pregnant belly was very subtle on the fluffy golden. Fixed.
- [ ] Greyhound head on short bodies keeps a longish snout. `dogs/pawart_dogs.js`
- [ ] Some newborn squeaks are a few dB quiet. `mods/pawaudio.js`
- [ ] The Rainbow Collar tag is a 4-point sparkle; the spec asked for a 5-point star. `dogs/pawart_dogs.js`
- [ ] The rocking chair's backrest leans a little. `world/pawart_world_b.js`

## Project
- [x] The claude.ai artifact publish was blocked by the full-read requirement on a 1.8 MB page. Fixed in v2.4: `tools/artifact.js` builds a multi-file artifact (152 KB index.html + 6 script files); a subagent does the one-time read.
- [x] Publish to the claude.ai artifact. Done with v2.1.
- [x] Saves were per copy with no export. Fixed in v2.2: cloud save on the web version and Export / Import save codes on every copy.
- [ ] Under parallel load (`--jobs 2`) a few desktop checks time out once and pass on retry: v16b (night bark, the click that interrupts an idle, the dev panel Close button), v21_home (Proud Mum picks "down": the test pins `Math.random` around one call and an idle tick can take it). Same timings as before v2.2. `game/test_v16b.js`, `game/test_v21_home.js`
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
- [ ] Playdate pals' noses nearly touch in the bow pose at 390 px wide. `game/css/24_phone_puppy.css`
- [ ] With puppies, the nursery basket sits right of the phone view and is reached with "look right" (accepted in v2.3). `game/src/03_yard.js`
- [ ] The map zoom buttons were checked clear of the labels only in the default (unpanned) view. `game/src/08_map.js`
- [ ] Owner: confirm the Supabase project auto-confirms email changes (Confirm email off), so "No email is ever sent" stays true.
- [ ] The "look right" peek button and the nap details card are new. Check both once on a real phone.

## Shop Day (v2.4)
- [x] On phones Gerald's steps 6 to 8 run to 4 lines in the strip (the spec said two). Fixed in v2.5: shorter phone wording (`tp`). `game/src/25_guide.js`
- [x] Toasts can sit over a sheet's title for 3 s on phones (the Missions sheet, the Wardrobe heading). Fixed in v2.5: toasts sit just under the sheet's title. `game/src/00_core.js` toast()
- [ ] The yard missions clipboard hides while a feed / play / care tray is open on phones (its tap target would shrink under 44 px). A tray-aware tap rect would let it stay. `game/css/27_missions.css`
- [ ] Under the test harness missions and the walkthrough only run when a suite sets `prefs.msTest` / `prefs.gdTest`, so the older suites never exercise them alongside the old flows. One combined smoke pass would catch interactions. `game/src/24_missions.js`, `25_guide.js`
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
- [ ] Fetch on phones: the scene is full width but only about 234 px tall, with blank space under the panel. A taller scene would gain about 10% at most (the throw needs 900 of the 1000 units). `game/src/19_fetch.js`
- [ ] Market Street on phones: the first camera move re-applies a zoom about 7% tighter than the home framing (pre-existing; the town occlusion checks tune that framing). `game/src/03_yard.js`
- [ ] Round buttons lost their hatching when the fill was fitted inside the outline (the crayon look is kept by the wash). Decide whether to draw a clipped hatch. `game/css/01_sketch_surface.css`
- [ ] Tray-card notes clamp at 2 lines on phones. `game/css/21_phone_home.css`
- [ ] The `account` suite takes about 260 s alone, near its 300 s watchdog, and can hit it under `--jobs 2`. `game/test_account.js`

## Halloween 2026 (v2.6)
- [ ] Owner: play one evening in the Square on a phone (the pop-up, the night glow) and buy one thing from each section.
- [ ] The yard decorations and the festival props (the Harvest Stall, the pop-up by day) get no night tint, so they look bright next to the night scene. One shared night tint would fix them all. `world/pawart_world_b.js`, `game/src/03_yard.js`
- [ ] The v2.5 porch jack-o-lantern keeps its pale glow (it must stay byte-identical), while the v2.6 pumpkins glow warm. `world/pawart_world_b.js`
- [ ] Pre-existing: at night the shop window glow draws over the Town Notice board in the Square. `world/pawart_world_c.js`
- [ ] Pre-existing: on phones, a visiting dog with no pack dogs takes Square pack spot 0 and the camera only widens to the right, so the visitor and the Harvest Stall can sit off-screen at 360 px. `game/src/03_yard.js` phHomeRefit
- [ ] On phones the dog house's jack-o-lantern can show cut in half at the right edge of the yard's home view. `game/src/26_festival.js`
- [ ] Market Street's Halloween bat bunting sits right under the place label on phones. `world/pawart_world_a.js`
- [ ] The v2.6 items are 2026 only. A Halloween 2027 would need new `ed: 2027` items and a `HW_WIN` entry (the pop-up code is written for any edition). `game/src/00_core.js`, `game/src/27_halloween.js`
- [ ] Under parallel load, `account` can hit its 300 s watchdog, and `phone_town`, `phone_occl_home`, `phone_v25_fixes_a` and `v21_home` can need their retry.
