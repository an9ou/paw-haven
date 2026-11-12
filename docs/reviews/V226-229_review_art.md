# v2.26-v2.29 art review (12 Nov 2026)

Branch claude/release-26-29 at 6d499671. 2 must-fix, 8 should-fix, 5 nice. Status lines are added by the fix batch.

## Must-fix
1. **55_projects.js `PR_AT`:** the sakura trees and the project board stop at world y~345 while the shop walls meet the pavement at ~405, so they float against the shops. The right tree stands in the Squeak Shop doorway and covers "Shop", the left covers "Bone Appétit", the middle swallows the street lamp, the board hides the "Paws & Pages" sign. Fix: feet down to ~y 410, in open spots clear of doors and signs.
2. **57b_story.js `smPostcard`, Gerald's Big Book frame:** the name "Gerald's Big Book" is half covered by the postcard stamp. Fix: move the name or hide the stamp in this frame.
   Status: fixed (5cf05bb9, lane B): the name sits on a cream paper label in the middle of the top band; the doodles step aside, the stamp keeps its corner.

## Should-fix
3. **54_visitors.js (yard):** the visitor stands on the mailbox; the mail badge sits on its head (worst: Rapunzel, Zoom, Yuki). Give yard visitors their own spot clear of the mailbox.
4. **57b_story.js:410, scene ch6:** the rosette and "10" sign sit at fixed positions; the rosette lands on Mochi's ear (desktop) or forehead (phone), the sign floats above Gerald. Tie them to the actors.
   Status: fixed (5cf05bb9, lane B): props can be held by actors (`on` anchors on the actor's drawn box); the rosette is pinned on the dog's chest, the sign's stick sits in Gerald's raised wing, on desktop and phones.
5. **57_scenes.js `scFit` (phone), ch4:** the dogs are pushed together until the beagle's head covers Mochi's face; the stick lies across their chests. Keep a minimum head gap or shrink the cast instead.
   Status: fixed (5cf05bb9, lane B): actors face to face keep a head gap (10% of the smaller height; past that the cast shrinks), and the ch4 stick is held between the two mouths.
6. **world/pawart_world_b.js, the 4 toy shop icons:** line weight not scaled at k .27-.38 (rope, duck, bubbles turn to solid ink); toys sit smaller in the box than older icons. Scale line width with k, draw bigger.
7. **Framed Paw Print** (03_yard.js `at: [404,206]`, 56_stories.js `stPawFrameSVG`): hangs over the living-room window; clean vector look (no wobble or wood grain), clean pink paw though the story calls it muddy. Move to bare wall, redraw with the world kit.
8. **Bandstand:** the shop window's toy duck shows through its open sides, reads as a birdcage. Back panel/floor, or nudge off the window.
9. **Winter sakura:** a thin Y stick with snow discs like lollipops. Thicker forked branches, snow along the tops.
10. **Lighthouse:** stacked capsules, unlike the pier's own lighthouse; at night the big old one is dark while the tiny new one beams; grey beam. Tapered tower, warm pale beam, consider lighting the old one.

## Nice
11. Visitors Book silhouettes: flat grey at 42% opacity, page lines show through; the contract says "pencil silhouette".
12. The fountain's new bowl reads as a separate dish: join it to the basin, add a trickle.
13. Star Collar crosses the face in sleep/crouch/bow/eat and the tag sits among a puppy's paws; the Golden Collar has the same geometry (fix both together; changes existing renders, so needs check_identical sign-off).
14. Toys get no snow caps in snow.
15. The ch8 Square scene background does not show the built projects.
   Status: fixed (5cf05bb9, lane B): the Square in a scene draws the finished projects (sakura, fountain, bandstand) at PR_AT when prOn().

## Checks
- check_identical vs origin/main: 486,480 renders, 0 differ; outfit sweep 575,360, 0 bad.
- fill_sweep OUTFITS=1 (Star Collar, Golden Collar): 773 renders, 0 worse than plain.
- connect_check not run (its outfit list lacks the Star Collar).
- 'Star Collar' shifts later OUT.neck indices by one: harmless (OUT is private, checked by name; DC_OUTFITS unchanged).
