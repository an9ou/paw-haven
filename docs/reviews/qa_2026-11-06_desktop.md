# Desktop QA (dist/itch @ 96eae646, mouse only): 3 must-fix, 4 nice

Drivers (in the QA session scratchpad, qa_desk/): lib.js (scrollAudit, clipAudit), tour.js, places.js, shops.js, interact.js, interact2.js, t5.js, t6.js. Screenshots: shots/. No console errors.

## Must-fix
1. **Pack chip rows can't be scrolled with a mouse.**
   - Where: `.cr-chips` (Feed/Play/Care trays, Pick-a-walk; game/src/29_pack_care.js:23-32 crChipsHTML/crBindChips, game/css/32_pack_care.css:3) and `.pk-pick` (Wardrobe, "Tricks: who trains?"; game/src/34_pack_play.js:43-48, game/css/37_pack_play.css:4).
   - What goes wrong: with 4 dogs and 12-letter names the row overflows (Feed 773 in 716, Walk 773 in 636, Wardrobe 661 in 653). The wheel and a drag move it 0 px. A macOS mouse player can't tick or untick the 4th dog.
   - Repro: `LONG=1 node tour.js 1024x768 en`. Shots: shots/1024x768_en_21_feed.png, 1024x768_en_24_walk.png, 1280x720_de_21_feed.png.
   - Fix: make the wheel+drag part of trChipsScroll (15_trick_training.js) a shared helper; call it from crBindChips and pkBindPick (and on .ho-put 28_home.js:419, .ex-frow 41_expressions.js:216, dock .row 05_dock.css:9). Desktop ::-webkit-scrollbar styling. Drop `scrollbar-width:thin` on desktop: in Chrome 121+ it overrides the webkit styling.
2. **Walk route carousel: dragging the centred card snaps back.**
   - Where: game/src/17_walk_route_carousel.js:26-27.
   - What goes wrong: pointerup calls shift(), then the click lands on the start card, whose onclick (i !== routeIdx) sets routeIdx back.
   - Fix: when |dx| > 6, swallow the next click (a one-shot capture listener) and use setPointerCapture. Shot: shots/1280x720_en_A_routes.png.
3. **Pick-a-walk card cut off on short desktop windows (1024x768).**
   - Where: game/css/04_view_scene.css:95 (.rt-viewport overflow hidden) and :102 (.rt-prev min about 90 px, from calc(100cqh - 165px)).
   - What goes wrong: a 243 px card in a 165 px viewport, so the bottom 86 px is cut.
   - Fix: below about 600 px of stage, a smaller preview minimum (about 60 px) and tighter .routes gaps. Shot: shots/1024x768_en_24_walk.png.

## Nice-to-have
1. **Mailbox Album:** the `.al-art` ghost label sits behind the intro line (09b_journal_v2.css:210). Start it below .al-head, or fade it.
2. **Trick row drag:** pointerleave stops the drag at the row edge. Use setPointerCapture after 6 px.
3. **zh-Hant mission card:** the text wraps in a column about 50 px wide on a 261 px card (24_missions.js:215-251). Shot: shots/1280x720_zh-Hant_28_missions.png.
4. **Map pin:** it can be off screen after a pan (expected; skip).

## Fine
- The wheel reaches the end of every modal panel.
- Trick row fixed.
- Map: drag pans and the wheel zooms.
- Pet rub, ball drag, pack bath scrub and kitchen drag all work.
- All places open.
- No raw keys or NaN, and no page side-scroll.

## Status (fix batch, branch `claude/qa-fixes`, 6 Nov 2026)
- Must 1 **Fixed.** One shared helper for sideways rows (game/src/22_input.js `HS_ROWS`, `hsKeep`): wheel moves the row, a mouse drag past 6 px scrolls it with setPointerCapture and swallows the click, on `.trchips`, `.cr-chips` (incl. the friend's-dog row), `.pk-pick`, `.ho-put`, `.ex-frow`, `#dock .row`; trChipsScroll keeps only its positioning; setTray keeps a redrawn tray's rows where they were. Desktop bar: `::-webkit-scrollbar` with scrollbar-width/-color left `auto` (Chrome 121+), Firefox gets `scrollbar-width:thin` via `@supports (-moz-appearance:none)` (05_dock.css); phones unchanged. Re-run `LONG=1 NDOG=4 node tour.js 1024x768 en 21,24,25`: Feed and Walk chips wheel 260/260 and 340/340, drag moves, 8 px bar; Wardrobe wheel 183/183 (the audit's drag line still says "does NOT move" because its 30 wheel steps scroll the sheet after the row's end, moving the row off the drag point; a direct drag scrolls it to 183). Test: v29_pack section 15 (5 long-named dogs at 1024x768), v171_tricks.
- Must 2 **Fixed.** 17_walk_route_carousel.js: pointer capture past 6 px, the click after a drag is swallowed. Test: v29_pack 15 (drag on the centred card moves to the next route and back).
- Must 3 **Fixed.** 04_view_scene.css: `.routes` is a size container; under 600 px of stage the title/nav are tighter, and in a carousel under 300 px the card is a flex column whose preview shrinks (min 40 px). Re-run shot 1024x768_en_24_walk: the whole card shows (191 px card in a 203 px carousel).
- Nice 1 **Fixed.** `.al-art` fades out behind the intro line (mask, 09b_journal_v2.css).
- Nice 2 **Fixed** by the shared helper (pointer capture; the drag keeps going outside the row). Test: v171_tricks.
- Nice 3 **Fixed.** 24_missions.js msRowText: a CJK row on the one-mission card uses the 96-unit row like Latin (it was 86 and the balanced 3-line wrap).
- Nice 4 Skipped (as agreed: expected after a pan).
- Re-run (worktree build, drivers in ../qa_desk2): `LONG=1 NDOG=4 node tour.js 1024x768 en 21,24,25` (above), `node tour.js 1280x720 zh-Hant 28,31b`: the mission row is one line, the album intro is clear.
- Suites (one at a time, --jobs 1): smoke, v171_tricks, v29_pack, v27_pack, v21_journal, v215_places, i18n, itch_build, v222_levels (flaky once, a reload check), v220_missions (flaky once, the Crayon Medal popup) pass; i18n_smoke: everything passes except "Settings: after the reload the game is in ja", which fails the same way on the base commit 96eae646 (pre-existing).
