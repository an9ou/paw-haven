/* ======================= v2.8 FUJI HILL lane (tag jp): Fuji View Hill, Look at Fuji, the first Fuji of the year, Gerald's letter. See V28.md section 12 =======================
   The FUJI HILL lane owns this file (and css/36_japan.css). This is the coordinator's stub: the cross-lane names resolve and do nothing.
   Core names: jpOn() (00_core.js: true in the game, false under the harness unless prefs.jpTest), envNow().jp, S.jp (v28Fields),
   PLACES.fujihill / jpPlaceSync() / jpHillOpen() (14_town_places.js: only while jpOn() and PawArt.scene('fujihill') exists), JP_MAP_PIN / jpMapPin (08_map.js),
   the missions gaze / hatsufuji / travel_fuji (24_missions.js). Acts: trackAct('gaze', { first }), travel { place: 'fujihill' } (core). */

// Look at Fuji (the place button). Stub: nothing
function jpGaze() { return null; }
// Gerald's letter when the hill first opens (Bond 2, jpOn()). Stub: nothing
function jpLetter() { return null; }
// the dog's line on arrival, by breed key (all 14 breeds), merged into PLACE_LINES[breed].fujihill (00_core.js, read by 03_yard.js placeAmbient)
const jpPlaceLines = {};
Object.keys(jpPlaceLines).forEach((k) => { if (PLACE_LINES[k]) PLACE_LINES[k].fujihill = jpPlaceLines[k]; });

function jpExpose() {
  if (!window.__paw) return;
  // allow(v): the harness gate at run time (prefs.jpTest), then the place table and the scene follow
  window.__paw.jp = { allow: (v) => { prefs.jpTest = !!v; jpPlaceSync(); checkEnv(true); return jpOn(); }, on: () => jpOn(), open: () => jpHillOpen(), place: () => (PLACES.fujihill ? Object.assign({}, PLACES.fujihill) : null), gaze: () => jpGaze() };
}
on('game:ready', () => setTimeout(jpExpose, 0));
on('yard:enter', () => { if (!window.__paw || !window.__paw.jp) jpExpose(); });
setTimeout(jpExpose, 0);
