# v2.26-v2.29 phone and layout review (12 Nov 2026)

Branch claude/release-26-29 at 6d49967. Sizes 360x640, 390x844, 1280x720 (dsf 1); en, plus de, ja, th, xx at 360. 2 must-fix, 6 should-fix, 5 nice.
Status lines are added by the fix batch.

## Must-fix
1. **Memories tab, desktop: the sheet's frame breaks.** `smOpen` gives the panel `cls: 'sm-pop sm-' + smTab` (57b_story.js:280), so on Memories the panel gets `.sm-mem{margin:0;padding:0;display:flex;gap:8px}` (59_scenes.css:57): no padding, title on the frame line, rows past the right edge. Fix: scope to `ul.sm-mem` or name the tab class `sm-t-mem`.
2. **Desktop top bar at 1024 px:** `#smBtn` and `#stPcBtn` push `#msBtn` (x 587-681) over the coins "+" `#ksPlus` (x 561-605), an 18 px overlap. Fix: hide the postcard icon below ~1180 px (Share postcard stays in the diary and My Dog Card), or tighten the gaps.

## Should-fix
3. **Lighthouse on phones** is off screen on arrival at the pier (tap box x 369 at 360, x 482 at 390); the pier has no Look right; dragging works but the camera returns after 4 s. Tap box 41 px wide at 360 (< 44).
   Status: fixed (9a642d1f): on phones it stands at world x 474 (inside the crop the pier opens on, 390: css x 227-313), tap box 90 x 116 world (57 x 75 px at 360).
4. **Yard visitor at 390x844** stands on the left edge (tap box from x -13), name tag cut. Clamp `visitorSpot()` to the phone crop.
5. **Fountain drink:** the dog faces away from the bowl and stands half out of frame (desktop x 25; 390 after Look left, x 0).
   Status: fixed (9a642d1f): the dog walks right of the bowl and drinks facing left, head over it (desktop x ~148); phones look left with it, so it stays in frame.
6. **Project board:** the Square's street lamp crosses the paper (desktop and phones). The Square's buttons have no "Town projects" entry; the board is only reachable by tapping its picture.
   Status: fixed (9a642d1f): the board moved off the lamp (x 520-600, feet y 468); "Town projects" button (`pr.btn`, English) before Go home while prOn().
7. **Sakura Avenue:** no tree visible from the home view at 390; at 360 the treetops sit under the wish card.
   Status: fixed (9a642d1f): the alley tree (x 146-226) is in view at home at 390 and 360, crown top y ~305 (below the wish card); the tall tree also shows at 360.
8. **Any amount typing:** if the browser shrinks the page for the keyboard (360x350), the "Turn your phone upright" card covers the sheet. Fix: skip `psLockWanted()` while an input has focus.

## Nice
9. Two Memories rows (prologue, visit_park) have an empty icon.
10. While you were out at 360x640: the Visitors card starts below the fold (only a sliver shows).
11. The visitor's name tag is ~10 px at 360; the Visitors card is the 6th Care tray card (sideways scroll).
12. Thai: sheets end at y 548, the phone bar starts at 545 (3 px under; may be older).
13. The phone "..." menu has 9 rows; Send a postcard and Cloud save are below the fold at 360.

Passed: no sideways scroll, every tap >= 44 px, text fits in de/ja/th/xx on the visitor card, Visitors Book, While you were out, projects sheet, Stories tab, letters, three postcards, Story page and scenes; Skip hidden at 1.2 s, shown by 3.8 s (96x44 phone, 96x48 desktop); Story is a 53 px row in "..."; no console errors.
