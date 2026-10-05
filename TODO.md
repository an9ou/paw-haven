# Open issues

Logged by the v2 build agents (Paw Haven Studio). Fixed items say which version fixed them (v2.0.1 or v2.1).

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
- [x] Publish to the claude.ai artifact. Done with v2.1.
- [ ] Saves live in `localStorage` (`pawhaven_proto_v1`), so claude.ai, GitHub Pages and local copies keep separate saves. The proposal calls for save export/import in Settings; not built yet.
- [ ] v16b's "night: a distant neighbourhood bark" check is flaky. `game/test_v16b.js`
- [ ] Install Node and Playwright on this Mac to run the test suites (see README).
