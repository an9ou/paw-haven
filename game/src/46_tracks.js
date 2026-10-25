/* ======================= v2.15 AROUND TOWN: the three run tracks as places (V215.md section 6.3, ACTIVITIES lane, tag tr, test hook __paw.tr) =======================
   Owner: the ACTIVITIES lane (no CSS file of its own; the gate buttons use the #placeBtns row). Laid down by the stubs lane: the names work today.
   Places: PLACES.sunflower / bamboo / cliffs (run: true, only while mpOn()). Their ROUTES rows (Bond 2 / 4 / 7, inside the town / woods / beach tiers),
   ROUTE_WORD / ROUTE_HINT and the six treasures (TR(...), v215: true) are written in 00_core.js and stay there only while mpOn(): trSync() (called by
   mpPlaceSync) adds or removes them together with ALL_ROUTES' three keys, the carousel's ROUTE_KEYS (Bond order), the Bamboo Ring in FETCH_TOYS / BL_TOYS and the
   wardrobe lists. With the switch off the game is v2.14. Strips: PawArt.walkStrip('sunflower' | 'bamboo' | 'cliffs') (world G), mods/walkrun.js AREAS.
   Save: S.trk { seen: { routeKey: true } } (v215Fields in 00_core.js): the first walk on a new route shows its care note (gold toast).
   The run gate (data-hot="run" in the trailhead scenes, the seven old route places and the Square) starts the walk with the carousel's checks (Bond, asleep,
   Energy >= 20, startRoute in 17_walk_route_carousel.js). Phones: a "Start the run" button in #placeBtns.
   API (stubs now)
     TR_TRACKS          the three new route keys
     trOn()             the new tracks can be run now (their ROUTES rows exist): false until the lane adds them
     trGate(k)          the run gate of place k was tapped: the pickArea checks, then go('walk', route). Stub: false (nothing happens)
     trRouteOf(k)       the route a place's gate starts (the place key when ROUTES has it, square -> 'town'), else null */

const TR_TRACKS = ['sunflower', 'bamboo', 'cliffs'];
const TR_BASE_KEYS = ['park', 'town', 'river', 'hilltop', 'woods', 'pier', 'beach'];
const TR_RING = 'Bamboo Ring';
const TR_RING_TOY = { prop: ['item', TR_RING], g: 1500, bounce: 0.3, fric: 3.6, spin: 1.2, vzK: 0.8, coin: 3, hap: 15, en: 1, float: true };

// on / off together with mpOn(): the rows 00_core.js writes statically are kept in a stash and put back or taken out. Called by mpPlaceSync() at load (before the
// later files exist: each part is guarded) and again at the end of this file. A function declaration, so 00_core.js can call it first.
function trSync() {
  const on = mpOn(), K = ['sunflower', 'bamboo', 'cliffs'], st = trSync.st || (trSync.st = {});
  if (!st.rows) {
    st.rows = TREASURES.filter((t) => t.v215); st.routes = {}; K.forEach((k) => { st.routes[k] = ROUTES[k]; });
    st.wear = {}; st.charm = {}; st.rows.forEach((t) => { st.wear[t.n] = TWEAR.find((w) => w.n === t.n) || null; st.charm[t.n] = CHARMS.find((w) => w.n === t.n) || null; });
  }
  const put = (arr, row, want) => { if (!row) return; const i = arr.indexOf(row); if (want && i < 0) arr.push(row); else if (!want && i >= 0) arr.splice(i, 1); };
  K.forEach((k) => { if (on) ROUTES[k] = st.routes[k]; else delete ROUTES[k]; put(ALL_ROUTES, k, on); });
  st.rows.forEach((t) => { put(TREASURES, t, on); put(TWEAR, st.wear[t.n], on); put(ALL_WEAR, st.wear[t.n], on); put(CHARMS, st.charm[t.n], on); });
  put(FETCH_TOYS, TR_RING, on);
  try { tItemIx = null; } catch (e) { /* the core cache is not there yet */ }
  try { if (on) BL_TOYS[TR_RING] = TR_RING_TOY; else delete BL_TOYS[TR_RING]; } catch (e) { /* 38_ball.js is not loaded yet */ }
  try {
    const keys = TR_BASE_KEYS.concat(on ? K : []).sort((a, b) => ROUTES[a].bond - ROUTES[b].bond); // stable: an old route stays ahead of a new one at the same Bond
    ROUTE_KEYS.splice(0, ROUTE_KEYS.length, ...keys);
  } catch (e) { /* 17_walk_route_carousel.js is not loaded yet */ }
}
function trOn() { return mpOn() && TR_TRACKS.every((k) => !!ROUTES[k] && !!PLACES[k]); }
// the route a place's gate starts: the place key when ROUTES has it, the Square starts the Town Loop
function trRouteOf(k) { const r = k === 'square' ? 'town' : k; return mpOn() && ROUTES[r] ? r : null; }
// the gate (the checkered arch, or the phone button) was tapped: the carousel's checks (Bond, asleep, Energy >= 20), then go('walk', route)
function trGate(k) {
  if (!mpOn() || cur.mode !== 'yard') return false;
  if ((typeof blOn === 'function' && blOn()) || (typeof agRunning === 'function' && agRunning()) || (typeof plRunning === 'function' && plRunning())) return false;
  const r = trRouteOf(k == null ? S.place : k); if (!r) return false;
  SFX.click(); startRoute(r); return true;
}

/* ---------------- the shared arrival lines (all breeds), read by 03_yard.js placeAmbient from PLACE_LINES[breed][place] ---------------- */
const TR_LINES = {
  sunflower: () => tt('tracks.line_sunflower', 'Sunflowers taller than me! I will say hello to every one.'),
  bamboo: () => tt('tracks.line_bamboo', 'The bamboo whispers. I will whisper back, mostly by sniffing.'),
  cliffs: () => tt('tracks.line_cliffs', 'A big wide sea! I will stay on the path, close to you.')
};
Object.keys(PLACE_LINES).forEach((b) => { TR_TRACKS.forEach((k) => { Object.defineProperty(PLACE_LINES[b], k, { get: TR_LINES[k], enumerable: true, configurable: true }); }); });

/* ---------------- the first walk on each new route: a short, kind care note ---------------- */
function trNote(k) {
  return { sunflower: tt('tracks.note_sunflower', 'Farm tracks pass fields with other animals. Keep the lead short and let the cows and ducks have their space.'),
    bamboo: tt('tracks.note_bamboo', 'Stepping stones get slippery after rain. Walk slowly across and let your dog choose where to put each paw.'),
    cliffs: tt('tracks.note_cliffs', 'Stay on the path and well back from the edge, even with a calm dog. A fence and a short lead mean everyone enjoys the view.') }[k] || '';
}
function trSeen() { if (!S.trk || typeof S.trk !== 'object') S.trk = { seen: {} }; if (!S.trk.seen || typeof S.trk.seen !== 'object') S.trk.seen = {}; return S.trk.seen; }
on('act:walk', (a) => {
  if (!mpOn() || !a || !TR_TRACKS.includes(a.area)) return; const seen = trSeen(); if (seen[a.area]) return;
  seen[a.area] = true; markDirty(); setTimeout(() => { if (S) toast(trNote(a.area), 'gold'); }, 1200);
});

/* ---------------- phones: the gate in the #placeBtns row (the existing .btn classes, the row's CSS is not touched) ---------------- */
function trPlaceBtn() {
  const pb = $('#placeBtns'); if (!pb) return; pb.querySelectorAll('[data-tr]').forEach((b) => b.remove());
  if (!isPhone() || cur.mode !== 'yard' || !trRouteOf(S.place)) return;
  const html = `<button class="btn yes" data-tr="run">${esc(tt('tracks.btn', 'Start the run'))}</button>`, home = pb.querySelector('[data-pb="yard"]');
  if (home) home.insertAdjacentHTML('beforebegin', html); else pb.insertAdjacentHTML('beforeend', html);
  pb.querySelector('[data-tr]').onclick = () => trGate(S.place);
}
on('yard:enter', trPlaceBtn); on('scene:redraw', () => { if (cur.mode === 'yard' && !$('#placeBtns [data-tr]')) trPlaceBtn(); });

/* ---- tests: window.__paw.tr ---- */
function trExpose() {
  if (!window.__paw) return;
  window.__paw.tr = { on: () => trOn(), tracks: TR_TRACKS.slice(), gate: (k) => trGate(k), route: (k) => trRouteOf(k), seen: () => Object.assign({}, S && S.trk ? S.trk.seen : {}), sync: () => trSync(), note: (k) => trNote(k), keys: () => ROUTE_KEYS.slice(),
    rows: () => JSON.parse(JSON.stringify(ROUTES)), loot: (k) => TREASURES.filter((t) => t.routes.includes(k)).map((t) => t.n), treasure: (n) => { const t = tInfo(n); return t ? { n: t.n, kind: t.kind, slot: t.slot, rarity: RARITY[t.r], routes: t.routes.slice(), ab: t.ab, txt: t.txt } : null; },
    roll: (k, o) => { const L = rollTreasure(k, o || {}); return L.item ? { n: L.item.n, r: L.r } : { coins: L.coins, r: L.r }; }, walked: (k) => trackAct('walk', { area: k }),
    counts: () => ({ routes: Object.keys(ROUTES).length, treasures: TREASURES.length, allRoutes: ALL_ROUTES.length, fetch: FETCH_TOYS.length, wear: ALL_WEAR.length, charms: CHARMS.length, ring: !!BL_TOYS[TR_RING] }), lines: () => TR_LINES };
}
on('game:ready', () => setTimeout(trExpose, 0));
setTimeout(trExpose, 0);
trSync(); // the tables of the files loaded after 00_core.js are there now
