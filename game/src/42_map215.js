/* ======================= v2.15 AROUND TOWN: the town map, the storefronts, the travel walk (V215.md sections 2 to 5, MAP lane, tag mp, test hook __paw.mp) =======================
   Owner: the MAP lane (with 08_map.js, 14_town_places.js and css/44_map215.css). Laid down by the stubs lane: every name below works today as a
   no-op or a plain answer, so the other lanes can call it; the MAP lane fills in the bodies and keeps the names.
   In the core (00_core.js): mpOn(), MP_PLACES / MP_KEYS, mpPlaceSync(), mpPlaceName(k), artChunk('f'), prefs.mapLabels, prefs.shopOpen, S.mapNew.
   World F (world/pawart_world_f.js, MAP ART lane): PawArt.scene('map', { v215: true, ... }), PawArt.MAP215_AREAS, PawArt.MAP_ROADS, PawArt.mapBuilding.
   In the split build world F is a lazy chunk: await artChunk('f') before drawing the v2.15 map (it is preloaded when idle after the title).
   API (stubs now)
     mpMapReady()       world F is loaded and draws the v2.15 map: false until PawArt.MAP215_AREAS exists (the old map is drawn then)
     mpMapOpts()        the extra options for art('scene', 'map', ...) on the v2.15 map: {} now
     mpShopOf(k)        the openShop key of a storefront place (market -> 'kibble', boutique, builder, sprout), else null
     mpArrive(k)        after travelTo lands in k: opens a storefront's shop window when prefs.shopOpen (stub: nothing)
     mpTravel(k)        the travel walk on the map, then travelTo(k) (stub: travelTo(k) at once)
     mpSticker(k)       'new' | 'moved' | null: the map sticker of a place for the first 7 days after S.mapNew.since (stub: null)
     mpSeen(k)          a visit clears the sticker (stub: nothing)
     mpLabels()         the map captions are shown (prefs.mapLabels, default true) */

const MP_NEW = ['training', 'pool', 'sunflower', 'bamboo', 'cliffs']; // the "new" stickers (V215.md 4)
const MP_MOVED = ['market', 'boutique', 'builder', 'sprout']; // the "moved" stickers
function mpMapReady() { return mpOn() && artChunkReady('f') && !!(window.PawArt && Array.isArray(PawArt.MAP215_AREAS)); }
function mpMapOpts() { return {}; }
function mpShopOf(k) { const p = PLACES[k]; return (mpOn() && p && p.shop) || null; }
function mpArrive(k) { return false; }
function mpTravel(k) { return travelTo(k); }
function mpSticker(k) { return null; }
function mpSeen(k) { return false; }
function mpLabels() { return prefs.mapLabels !== false; }

// a save that boots in a new place: world G comes as a chunk in the split build, so draw the place again once it is there
on('game:ready', () => { if (S && PLACES[S.place] && PLACES[S.place].v215 && !mpSceneReady(S.place)) artChunk('g').then((ok) => { if (ok && mpSceneReady(S.place) && cur.mode === 'yard' && modal.hidden) go('yard'); }); });
// the map opens often: preload world F when the browser is idle after the title (split build only; elsewhere artChunk resolves at once)
setTimeout(() => { if (!mpOn()) return; const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200)); idle(() => artChunk('f'), { timeout: 4000 }); }, 1500);

/* ---- tests: window.__paw.mp ---- */
function mpExpose() {
  if (!window.__paw) return;
  // allow(v): the harness gate at run time (prefs.mpTest), then the place table follows (a save standing in a new place goes home when off)
  window.__paw.mp = {
    allow: (v) => { prefs.mpTest = !!v; mpPlaceSync(); return mpOn(); }, on: () => mpOn(), keys: MP_KEYS.slice(), places: () => MP_KEYS.filter((k) => !!PLACES[k]),
    row: (k) => (PLACES[k] ? Object.assign({}, PLACES[k]) : null), name: (k) => mpPlaceName(k), shop: (k) => mpShopOf(k), ready: () => mpMapReady(),
    sticker: (k) => mpSticker(k), labels: () => mpLabels(), chunk: (n) => artChunk(n || 'f'), chunkReady: (n) => artChunkReady(n || 'f'), plain: (k) => !mpSceneReady(k)
  };
}
on('game:ready', () => setTimeout(mpExpose, 0));
setTimeout(mpExpose, 0);
