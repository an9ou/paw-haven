/* ======================= v2.7 HOME lane (tag ho): house and yard decorating, placement mode, beds for every dog, furniture the dogs use. See V27.md sections 1 and 5 =======================
   The HOME lane owns this file (and css/31_home.css). This is the coordinator's stub: every name below is called from shared files or by other lanes,
   so it resolves from day one and keeps the v2.6 behaviour until the HOME lane fills it in. Data (HM_DECOR entries, BEDS 'Knitted Nest') is final in
   03_yard.js and 12_popups_beds_map_snacks_potty.js. */

// zones a placed item must stay in, world units of the 1000 x 600 scene. floor: the item's bottom edge y within [y0, y1] and x within [x0, x1 - w].
// wall: the whole box inside [x0, y0, x1, y1]. Starting numbers, the HOME lane tunes them in screenshots and records the final ones in V27.md section 10.
const HO_ZONES = {
  yard: { floor: { x0: 0, x1: 1000, y0: 330, y1: 596 }, wall: { x0: 0, x1: 1000, y0: 150, y1: 420 } },
  house: { floor: { x0: 0, x1: 1000, y0: 404, y1: 596 }, wall: { x0: 16, x1: 864, y0: 16, y1: 384 } }
};
const HO_BED_WH = [260, 160]; // every bed in the house is drawn 260 x 160 (BED_BOX w, h), sleep area ~(130, 95) of the bed's own viewBox

// [tx, ty, scale] for dogTo() when the ACTIVE dog naps. Stub = the v2.5 spot (the one bed at BED_BOX in the house, the dog-house door in the yard).
// HOME: in the house, the active dog's own bed (hoBedFor) at S.bedAt: tx = x - 192.5, ty = y - 230, scale 0.75 (feet at x + 130, y + 145); no bed: a rug spot.
function napSpot() { return [417.5, S && S.place === 'house' ? 130 : 140, 0.75]; }
// the bed a dog naps on (a name in S.bedAt) or null. Stub: everyone shares S.bed.
function hoBedFor(d) { return S && S.bed ? S.bed : null; }
// the room an HM_DECOR item lives in
function hoRoomOf(name) { const D = HM_DECOR[name]; return (D && D.room) || 'yard'; }
// [feet x, feet y, facing, scale] for a pack dog that naps on its own bed or uses furniture, else null (13_more_dogs.js packDogSVG). Stub: null = the v2.6 spots.
function hoPackSpot(d, i) { return null; }
// idle hooks (16_voices_idle.js): add weights, return steps for HOME's own idle names (e.g. 'furn'), run a step with { ho: ... }, clean up, say if it moved the dog
function hoIdleWeights(w, d, stage) { /* HOME adds w.furn in the house when furniture is out */ }
function hoIdleSteps(name) { return null; }
function hoIdleStep(s) { /* front layer on for s.ho */ }
function hoIdleEnd(a) { /* front layer off */ }
function hoIdleMoves(name) { return false; }
// a pack dog's idle turn: return true when HOME sent it to a piece of furniture (it sets packPose and redraws the dog itself)
function hoPackIdle(d) { return false; }
// stop dog d using any furniture (PACK CARE calls it before feeding, bathing or tucking a dog in); it goes back to its normal spot
function hoFree(d) { /* nothing to free in the stub */ }
// placement mode for the current room (yard or house), optionally with one item selected (from the shop's "Place it" or the Decorate sheet)
function hoPlaceStart(name) { /* HOME: placement mode. The stub does nothing */ }

function hoExpose() {
  if (!window.__paw) return;
  window.__paw.ho = { napSpot: () => napSpot(), bedFor: (id) => hoBedFor(id ? dogById(id) : (S && S.dog)), room: (n) => hoRoomOf(n), place: (n) => hoPlaceStart(n), zones: HO_ZONES, specs: HM_DECOR };
}
on('game:ready', () => setTimeout(hoExpose, 0));
on('yard:enter', () => { if (!window.__paw || !window.__paw.ho) hoExpose(); });
setTimeout(hoExpose, 0);
