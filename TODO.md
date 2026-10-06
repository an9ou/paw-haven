# Open issues

Logged by the v2 build agents (Paw Haven Studio). Fixed items say which version fixed them (v2.0.1, v2.1, v2.2 or v2.3).

## Gameplay
- [x] Puppies could travel to Park / River / Woods / Beach as a place. Fixed: under 3 months and nursing mums stay home.
- [x] Spot 4 took about 1.5 months for heavy players. Fixed: 60 care days.
- [x] Mix puppies can carry coats outside their body breed's coat catalogue. Fixed in v2.1: they show as bonus coats.
- [ ] Horgi × Horgi pups are still named "Mutt mix". `mods/genes.js` / `game/src/13b_breeding.js`
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
- [ ] The claude.ai artifact publish is blocked by the full-read requirement on a 1.8 MB page, so the artifact still shows v2.2. v2.4 to solve it, e.g. publish as a multi-file artifact with a small index.html and the game JS/CSS as supporting files.
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
