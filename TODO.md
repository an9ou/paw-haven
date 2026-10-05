# Open issues

Logged by the v2 build agents (Paw Haven Studio). Fixed items were fixed in v2.0.1.

## Gameplay
- [x] Puppies could travel to Park / River / Woods / Beach as a place. Fixed: under 3 months and nursing mums stay home.
- [x] Spot 4 took about 1.5 months for heavy players. Fixed: 60 care days.
- [ ] Mix puppies can carry coats outside their body breed's coat catalogue. `mods/genes.js`
- [ ] Coat catalogue is 186 coats, bigger than the planned 84 (decide: keep or trim). `mods/genes.js`

## Layout
- [x] Yard mailbox sat next to the dog's tap area. Fixed: taps on the mailbox behind the dog open it.
- [ ] Visitor spot is tight with 4 dogs in the Square and Café. `game/src/14b_vet_playboard.js`
- [ ] Family-tree child branches sit a bit low. `familytree` prop in `world/pawart_world_b.js`
- [ ] Mum isn't drawn inside the nursery basket (she's already on screen). `game/src/13c_litter.js`

## Art & audio
- [x] Coat Collector Ribbon had no art. Fixed.
- [x] Pregnant belly was very subtle on the fluffy golden. Fixed.
- [ ] Greyhound head on short bodies keeps a longish snout. `dogs/pawart_dogs.js`
- [ ] Some newborn squeaks are a few dB quiet. `mods/pawaudio.js`

## Project
- [ ] Publish v2.0.1 to the claude.ai artifact (it still runs v2).
- [ ] Saves live in `localStorage` (`pawhaven_proto_v1`), so claude.ai, GitHub Pages and local copies keep separate saves. The proposal calls for save export/import in Settings; not built yet.
- [ ] Install Node and Playwright on this Mac to run the test suites (see README).
