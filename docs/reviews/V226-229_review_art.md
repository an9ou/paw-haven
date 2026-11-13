# v2.26-v2.29 art review (12 Nov 2026)

Branch claude/release-26-29 at 6d499671. 2 must-fix, 8 should-fix, 5 nice. Status lines are added by the fix batch.

## Must-fix
1. **55_projects.js `PR_AT`:** the sakura trees and the project board stop at world y~345 while the shop walls meet the pavement at ~405, so they float against the shops. The right tree stands in the Squeak Shop doorway and covers "Shop", the left covers "Bone Appétit", the middle swallows the street lamp, the board hides the "Paws & Pages" sign. Fix: feet down to ~y 410, in open spots clear of doors and signs.
   Status: fixed (9a642d1f): trees in front of the bakery window, in the bakery/bookshop alley and tall beside the clock tower door (feet y 410-414, shadows); the board on the paving in front of the tower (feet y 468), clear of doors, signs, the easel and both lamps.
2. **57b_story.js `smPostcard`, Gerald's Big Book frame:** the name "Gerald's Big Book" is half covered by the postcard stamp. Fix: move the name or hide the stamp in this frame.
   Status: fixed (5cf05bb9, lane B): the name sits on a cream paper label in the middle of the top band; the doodles step aside, the stamp keeps its corner.

## Should-fix
3. **54_visitors.js (yard):** the visitor stands on the mailbox; the mail badge sits on its head (worst: Rapunzel, Zoom, Yuki). Give yard visitors their own spot clear of the mailbox.
   Status: fixed (76040f60): yard visitors have their own spot (feet 592,452, right of the dog), clear of the mailbox; visitorSpot() answers it while one is drawn.
4. **57b_story.js:410, scene ch6:** the rosette and "10" sign sit at fixed positions; the rosette lands on Mochi's ear (desktop) or forehead (phone), the sign floats above Gerald. Tie them to the actors.
   Status: fixed (5cf05bb9, lane B): props can be held by actors (`on` anchors on the actor's drawn box); the rosette is pinned on the dog's chest, the sign's stick sits in Gerald's raised wing, on desktop and phones.
5. **57_scenes.js `scFit` (phone), ch4:** the dogs are pushed together until the beagle's head covers Mochi's face; the stick lies across their chests. Keep a minimum head gap or shrink the cast instead.
   Status: fixed (5cf05bb9, lane B): actors face to face keep a head gap (10% of the smaller height; past that the cast shrinks), and the ch4 stick is held between the two mouths.
6. **world/pawart_world_b.js, the 4 toy shop icons:** line weight not scaled at k .27-.38 (rope, duck, bubbles turn to solid ink); toys sit smaller in the box than older icons. Scale line width with k, draw bigger.
   Status: fixed (6a46fd9b): icons drawn bigger (k .31-.40), a part's outline thins with its size on item cards (rope, duck, bubbles keep their fill).
7. **Framed Paw Print** (03_yard.js `at: [404,206]`, 56_stories.js `stPawFrameSVG`): hangs over the living-room window; clean vector look (no wobble or wood grain), clean pink paw though the story calls it muddy. Move to bare wall, redraw with the world kit.
   Status: fixed (1ad641e1): at [700,304] on bare wall under the quilt, award spot via hoFreeSpot; redrawn in world_b (wobble, wood grain and knots, muddy paw, mud splats); item card added.
8. **Bandstand:** the shop window's toy duck shows through its open sides, reads as a birdcage. Back panel/floor, or nudge off the window.
   Status: fixed (9a642d1f): a boarded back wall behind the posts; the window duck no longer shows through.
9. **Winter sakura:** a thin Y stick with snow discs like lollipops. Thicker forked branches, snow along the tops.
   Status: fixed (9a642d1f): tapered forked bark branches with twigs, snow strips along each branch top and in the fork (`praWinterBranches`).
10. **Lighthouse:** stacked capsules, unlike the pier's own lighthouse; at night the big old one is dark while the tiny new one beams; grey beam. Tapered tower, warm pale beam, consider lighting the old one.
   Status: fixed (9a642d1f): one tapered tower in the pier lighthouse style (red bands, black gallery, yellow lantern, red cone), warm fading gradient beam; the old lighthouse gets a lit window at night (its own lamp is above the desktop crop).

## Nice
11. Visitors Book silhouettes: flat grey at 42% opacity, page lines show through; the contract says "pencil silhouette".
   Status: fixed (99b55250): pencil silhouettes (graphite outline with a little grain, hatching inside), yvSil in 54_visitors.js.
12. The fountain's new bowl reads as a separate dish: join it to the basin, add a trickle.
   Status: fixed (9a642d1f): a stone collar joins the bowl to the basin wall; the spout sits higher with a longer trickle and drops.
13. Star Collar crosses the face in sleep/crouch/bow/eat and the tag sits among a puppy's paws; the Golden Collar has the same geometry (fix both together; changes existing renders, so needs check_identical sign-off).
   Status: fixed (owner's go-ahead 12 Nov, branch claude/fix-collars): both collars share bcFront/bcBehind in dogs/pawart_dogs.js. Head up, the band hangs under the chin as before; a tag that would hang within 16 px of the ground (puppies, corgi, dachshund, chihuahua) sits up on the band, a little smaller. Head down or chin near the ground (eat, sleep, crouch, bow, sniff, dig, playdead, rollover), a short band goes round the neck where it leaves the head, drawn behind the ears and head (new NECKB hook in frame(), random stream handed back) and the tag is tucked away. Checks: check_identical vs origin/main 486,480 renders, 0 differ; outfit sweep (now also the Star Collar and the tucked band) 589,280, 0 bad; own diff of 6,960 renders each: Golden 3,914 and Star 3,984 changed, plain/Red Bandana/Jingle Bell 0; fill_sweep OUTFITS=1 both collars 773, 0 worse; connect_check now lists both collars (collar-only run 9,588, 0 failures); suites smoke, v228_stories, v2183_connect pass. Shots: docs/reviews/shots/collars/.
14. Toys get no snow caps in snow.
   Status: skipped (no snow layer for yard decorations exists; not cheap: it needs a new decor snow pass, not just toy art).
15. The ch8 Square scene background does not show the built projects.
   Status: fixed (5cf05bb9, lane B): the Square in a scene draws the finished projects (sakura, fountain, bandstand) at PR_AT when prOn().

## Checks
- check_identical vs origin/main: 486,480 renders, 0 differ; outfit sweep 575,360, 0 bad.
- fill_sweep OUTFITS=1 (Star Collar, Golden Collar): 773 renders, 0 worse than plain.
- connect_check not run (its outfit list lacks the Star Collar).
- 'Star Collar' shifts later OUT.neck indices by one: harmless (OUT is private, checked by name; DC_OUTFITS unchanged).
