# v2.19 phone review (1fd16d5, 1 Nov 2026)

Passed: every Friends sheet fits 390x844 and 360x740 in en, ja, de, th; taps >= 44 px; no sideways scroll; nothing under the phone bar; More tray and "..." menu show Friends with its badge; confirms, gift sheet (3 columns), route row, guest walk, What's new sheet and desktop 1280 fine; no console errors; code boxes auto-advance and paste "DOG-9QRST" fills all five. (Screenshots were in the old session's scratchpad; re-shoot with the v219_friends suite's mock if needed.)

## Must-fix
1. **"..." on a friend row redraws the whole sheet** (50_friends.js:536 calls frSheet()): pop-in replays, `.panel-body` scrollTop jumps to 0, Remove/Block for a lower row open below the fold. Patch the row in place (or keep scrollTop, skip the animation, scroll `.fr-pop` into view). Same for the other list redraws (Add, Remove, Block, back from a gift).
2. **Name-wheel words forced to 100 wide** (`textLength="100" lengthAdjust="spacingAndGlyphs"`, frWheelSVG 50_friends.js:178): ko "달" ~4.5x stretched, en "Paw"/"Jolly" ~3.3x, de "Juhu"; ja "ゆきのけっしょう" squeezed to 68%. Card name the same (`textLength="108"`, :169). Drop textLength; measure with getComputedTextLength() in frWheelPaint / the card and only squeeze words wider than 100 / 108 (or step the font size down).
3. **Phone visit shows only the middle of the friend's yard, no pan**: home yard has `#phPeek` ">", fryard has none. 12 decor spread out → 5 visible at 390; the suite's Bird Bath / Flower Barrel (x 24, 96) never show on a phone. Keep the peek / phone pan in `cur.mode 'fryard'` (22c_phone_shell.js or frVisit), or centre the crop on their decor and dogs.
4. **Black focus rectangle stays round the friend's dog after a tap** (`g.frdog` gets `outline: auto 5px` on :focus). 52_friends.css: `#view .frdog:focus{outline:none}`, keep the dashed :focus-visible ring.
5. **Paw-print, pet and walk letters show an empty postcard photo** (~220 px blank frame; letterPhoto(m) has no picture). Set `m.dog` (their card dog) on walk letters; draw the paw doodle inside `.pc-photo` (07b_mailbox.js letterPhoto) for note and pet letters.

## Nice-to-have
6. Care looks active during a visit (Walk is dimmed): add `[data-act="caremenu"]` to the `#stage.frvisit #bar .act` dim list (52_friends.css).
7. ja words break mid-word ("おひさまビスケッ/ト", "ハッピークロー/バー" names at 360; "骨のビスケッ/ト", "にんじんのた/ね" gift labels): `:lang(ja) :is(.fr-nm,.fr-gnm){word-break:keep-all}` or give `.fr-nm` its own line on phones.
8. Friend with no yard snapshot: blank 48 px head gap. frHeadHTML falls back to PA.FRIENDS.badge() or a doodle head.
9. Remove has no confirm/undo and sits 8 px from Block; Block confirm covers the row and doesn't name the friend. Undo toast after Remove; "Block {name}? They won't be able to add you again." (new text = translate in the fix batch).
10. Paw stamp hidden behind the place buttons at 390/360; faded "...today" buttons over the dogs. Put the stamp spot higher on phones.
11. th: the taller Friends sheets' bottom padding slips ~10 px under the phone bar (360). NEWS_V219 date (see code review 10).
Already accepted: dog overlap at 360 (also heavy at 390 with dogs standing still under the harness), 10 px ribbon, sideways friend row.

## Fix batch (8aea677, 1 Nov 2026)
1. Fixed in 8aea677 ("..." patches its row; every other redraw patches the open sheet in place, scrollTop kept, .fr-pop scrolled into view; back from a gift reopens without the pop-in at the old scroll).
2. Fixed in 8aea677 (no textLength; frFit measures and steps the size down to 70%, squeezes only past 100/108; refit after fonts load).
3. Fixed in 8aea677 (fryard on phones: #phPeek look-around button on the left and a drag pan; the Bird Bath at x 24 shows).
4. Fixed in 8aea677.
5. Fixed in 8aea677 (walk letters set m.dog; note and pet letters draw the paw in .pc-photo).
6. Fixed in 8aea677. 7. Fixed in 8aea677 (keep-all for ja). 8. Fixed in 8aea677 (badge doodle head).
9. Fixed in 8aea677 (Remove waits for its Undo toast; "Block {name}? They won't be able to add you again.").
10. Fixed in 8aea677 (stamp 70 units higher on phones; "...today" buttons opaque, desaturated).
11. Fixed in 8aea677 (14 px foot padding on the Friends sheets); not re-shot in th at 360.
