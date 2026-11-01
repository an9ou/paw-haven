# v2.19 art and style review (2e2809e, 1 Nov 2026)

Shots: /tmp/claude-0/-home-user-paw-haven/456124aa-9b6b-5292-94ad-ee5fe5a6cc74/scratchpad/art/ (SA below). 1280x800 and 390x844, the v219_friends mock; ja/th with the real i18n fonts (served over http, prefs.i18nFonts).
Passed: every PA.FRIENDS piece keeps its fills inside its outlines at 8-15x (badge, card, stamp corner, wheel, pointers, wrap 0/1/2 patterns clipped to the box and lid, paw, ribbon: SA/z_*.png). Palette and the crude ink match the icons and Gerald (SA/z_compare.png). The badge reads at 24 px on paper and on dark. Gift letter wrap, note paw and walk-letter head sit well under the postcard. The news icons read on the pink page. The night tint on the decor and the en card are fine.

## Must-fix
1. **The wheel words and the card's friend name skip the local hand fonts.** 50_friends.js:178 (frWheelSVG) and :169 (frCardSVG) hard-code `font-family="Caveat,cursive"`, so in ja/th/ko/zh the SVG words fall to a heavy system gothic, while the preview, the buttons and the sheet title next to them use Klee One / Mali ('DD Local Title' / 'DD Local'). Two typefaces in one sheet, and the wheel loses the crayon look. SA/l_sheet_ja_390.png, SA/l_sheet_th_390.png, SA/l_card_th_390.png. (The suite's file:// harness loads no i18n fonts, so its shots hide this.) Fix: use the stack world_b already has for this, `'Caveat','DD Local Title','DD Local',cursive` (pawart_world_b.js:3371 FONT_L), on both `<text>` elements (or `style="font-family:var(--font-hand)"`).

## Nice-to-have
2. Card name crowds the code: name baseline y 114 at 22 px, code baseline y 131 at 21 px, so about 2 units between them. "Sunny Biscuit" and the ja/th names almost touch "DOG-23456". 50_friends.js:169; SA/d_card_zoom.png, SA/l_card_ja_1280.png. Fix: name baseline y 104 (the stamp ends at y 66, so there is room), or code at y 134.
3. Row doodles mix styles and the "sent" state barely shows: pet is a thin line doodle('heart'), note and gift are full-colour PA.FRIENDS art, and "not sent" is only opacity .45 at 28 px (pink on cream). 50_friends.js:183 frDoodle, 52_friends.css `.fr-doo`; SA/d_rows_zoom.png. Fix: a coloured crayon heart for pet (the badge's heartP or ex('heart')), and show "not sent" as `filter:grayscale(1);opacity:.4`.
4. Guest ribbon line weight: frRibbon's outline is lw .75-.9 on a 64 box, so it is about 0.3 px at the walk's 10-24 px. The ink vanishes and the rosette reads as a pale smudge on the corgi. pawart_world_b.js:7014; SA/w_ribbon_zoom_1280.png. Fix: lw about 2 (the badge's dog kit uses 2.4-2.7), or a simpler bold variant for the walk.
5. Friend's dogs draw over the decor whatever their depth: a dog's feet at y 575 stand "inside" the Yard Snowman, whose base is at y 640 (in front of it). 50_friends.js:695 frScan / frDecorSVG; SA/d_visit_day.png. Fix: add each layer-2 decor footprint (its lower 40%) to FRV.crop.boxes so the dogs pick spots clear of it, or draw a decor item in front of a dog whose feet are above its bottom edge.
6. At night the paw stamp stays day-bright pink beside the night-tinted decor. 50_friends.js:651 frStampSVG; SA/d_visit_night.png, SA/d_stamp_night_zoom.png. Fix: pass the stamp through propTint(svg, false, false) like frDecorArt.
7. News line "No typing and no search..." uses the calendar icon (fwCalIcon), which means nothing there. 49c_news.js:49. Fix: ICON('lock'), or a tiny PA.FRIENDS.card('').
8. QR quiet zone is 1 module plus the 4-unit tile margin (about 2 modules; the spec asks for 4). 50_friends.js:155 `q = 1`. Fix: q = 2 if a phone camera struggles to read it from the card at 390 px; check on a real phone before changing.

## Fix batch (8aea677, 1 Nov 2026)
1. Fixed in 8aea677 (wheel and card text use 'Caveat','DD Local Title','DD Local',cursive).
2. Fixed in 8aea677 (name baseline y 104). 3. Fixed in 8aea677 (ICON('heart') for pet; not sent = grayscale + .4).
4. Fixed in 8aea677 (frRibbon lines lw 1.8-2.2). 5. Skipped (not trivial; accepted overlap).
6. Fixed in 8aea677 (propTint on the stamp). 7. Fixed in 8aea677 (ICON('lock')). 8. Fixed in 8aea677 (q = 2; check on a real phone).
