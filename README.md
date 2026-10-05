# Paw Haven

A cozy comedy dog-raising game that runs in your browser. The world is a detailed doodle-sketch notebook. The dogs are crude crayon drawings that "drew themselves, on purpose."

Adopt a dog, feed it, bathe it, pet it, take it for walks, teach it tricks, and (eventually) raise a litter of puppies.

Made for desktop and laptop screens, designed at **1280×720**. No install, no account, no ads, no network calls except the Google Fonts stylesheet.

## Play it

Play in your browser: **https://an9ou.github.io/paw-haven/** (live once GitHub Pages is switched on: repo Settings → Pages → Source: GitHub Actions).

Your save lives in your browser's local storage, so it stays on your device.

## What's in the game

- **10 breeds**: shiba, corgi, golden retriever, dachshund, husky, mutt, chihuahua, pug, greyhound and beagle. Each has its own voice, personality, size and joke.
- **Realistic genetics and breeding**: coats and traits are inherited through real-style gene loci. Dogs have sex, age, seasons and life stages, and breeding follows realistic rules.
- **Puppies and mixes**: raise litters, name them, keep them or rehome them. Mixed-breed pups get a body from one parent and a head from the other.
- **Sparkle pups**: a rare shimmering puppy that your journal remembers.
- **Dog spots by Bond**: the closer you are, the more places your dog will hang out (house, park, riverside and more).
- **Garden and kitchen**: grow veggies, cook treats, and learn what your dog loves to eat.
- **Walks as a runner**: take your dog on a route and dash, jump and collect things along the way.
- **Trick mini-games**: teach tricks with quick timing games.
- **Town places**: a map with a market, shops, a vet, a playboard, a wardrobe and more.
- **Mailbox**: postcards and news from the dogs you have raised.
- **Treasure hunt and journal**: find map pieces, dig things up and fill your Treasure Journal.

## Build

You only need Node.js (no packages). The game is split into small source files under `game/`, and the build stitches them into one self-contained HTML file.

```
node game/build.js            # game only -> game/paw_haven_proto.html (used by the tests)
node game/build.js publish    # everything merged -> paw_haven_prototype.html (single file, open it in a browser)
node tools/pages.js           # wraps the publish build as _site/index.html (what GitHub Pages serves)
```

No Node? `perl tools/build.pl` makes the same `paw_haven_prototype.html`.

The generated HTML files are not tracked. Run the build after cloning.

## Test

The tests drive the real game in headless Chromium with Playwright.

```
npm install -g playwright && npx playwright install chromium
NODE_PATH=$(npm root -g) node game/run_tests.js smoke    # about 30 seconds
NODE_PATH=$(npm root -g) node game/run_tests.js all --jobs 2
```

## Project layout

```
game/
  shell.html      page markup with slots for CSS, art, modules and game script
  css/            styles, concatenated in ORDER.txt order
  src/            game script, concatenated in ORDER.txt order into one scope
  build.js        the build
  run_tests.js    parallel Playwright test runner (test_*.js are the suites)
dogs/             dog art module (SVG strings)
world/            scene, prop and icon art modules
mods/             gameplay modules: genes, audio, walk runner, toys, garden, kitchen
tools/            build helpers (GitHub Pages wrapper, worktree script)
dashboard/        a small tooling dashboard
*.md              design and build contracts for each version (see PIPELINE.md)
docs/design/      game design documents (proposal, v2, garden and kitchen, v1.3 plan)
```

Some folders (`dogs/`, `world/`, `mods/`) also hold earlier art versions and review galleries from development.

## Changelog

- **v1.0**: the prototype: adopt a dog, feed, bathe, pet, walk, shops and a treasure hunt.
- **v1.2**: laptop-first polish and build contract.
- **v1.2.1 "Places"**: the dog can stay in more places, and the town map gets its own look.
- **v1.3 "Garden & Kitchen"**: grow food, cook treats, male and female dogs, breeding preparation.
- **v1.3.1**: clearer popups, runner tutorial, pet beds.
- **v1.5 "More Dogs"**: a bigger roster, plus a phone version (now paused).
- **v1.6**: trick training, the bigger town, realistic barking and natural idle behaviour.
- **v1.7**: four new breeds, ten in total.
- **v1.7.1**: faster garden and trick mini-games.
- **v2 "Puppy Playdates & Sparkle"**: realistic genetics, breeding, puppies, mixes, Sparkle pups, the mailbox and town visits.
- **v2.0.1**: puppies stay home on trips, spot 4 at 60 care days, mailbox tap fix, Coat Collector Ribbon art.

Full details: [CHANGELOG.md](CHANGELOG.md). Open issues: [TODO.md](TODO.md).

## Made with Claude

Paw Haven was designed and built with [Claude](https://claude.ai) (Anthropic) working as a team of coding and art agents, directed by a human.

## License

No license has been chosen yet. All rights reserved by default.
