/* ======================= v2.15 AROUND TOWN: the town map, the storefronts, the travel walk (V215.md sections 2 to 5 and 11, MAP lane, tag mp, test hook __paw.mp) =======================
   Owner: the MAP lane (with 08_map.js, 14_town_places.js and css/44_map215.css). With mpOn() false nothing here changes the game (v2.14 exactly).
   In the core (00_core.js): mpOn(), MP_PLACES / MP_KEYS, mpPlaceSync(), mpPlaceName(k), artChunk('f'), prefs.mapLabels, prefs.shopOpen, S.mapNew.
   World F (world/pawart_world_f.js, MAP ART lane): PawArt.scene('map', { v215: true, ... }), PawArt.MAP215_AREAS, PawArt.MAP_ROADS, PawArt.mapBuilding.
   In the split build world F is a lazy chunk: enterMap (14_town_places.js) awaits artChunk('f') behind a short paper wobble (mpMapWait).
   API
     mpMapReady()       world F is loaded and draws the v2.15 map (else the old map is drawn)
     mpMapOpts()        the options for PawArt.scene('map', ...): v215, translated names, aria labels, lock chips, stickers, hidden places, title, env
     mpMapArt()         { W, H, svg, areas, v215: true } for enterMap (the old mapArt shape)
     mpBindMap(svg)     the building buttons: hover / focus lift, press squash, picked hop, locked shake, Tab order, Enter / Space, phone tap / long-press
     mpShopOf(k)        the openShop key of a storefront place (market -> 'kibble', boutique, builder, sprout), else null (always null with mpOn() off)
     mpArrive(k)        after travelTo lands in k: clears the sticker, opens a storefront's shop window when prefs.shopOpen (03_yard.js travelTo)
     mpTravel(k)        the travel walk on the map (the leader's walking dog along the shortest MAP_ROADS path, about 1.2 to 1.6 s, a tap skips it,
                        instant with Motion off), then pickArea(k) (travelTo, the Shelter, the Station)
     mpSticker(k)       'new' | 'moved' | null: the map sticker for the first 7 real days after S.mapNew.since, until the place is visited.
                        A save that started on v2.15 (S.mapNew.fresh, set in newState) never gets them
     mpSeen(k)          a visit clears the sticker
     mpLabels()         the map captions are shown (prefs.mapLabels, default true)
     mpSceneOpts(k)     the extra scene options of a place while mpOn(): Kibble Corner draws its v2.15 corner (o.v215; no art = today's scene)
     mpPlainDoor(k)     a storefront's doodle door (data-shop) on the plain fallback ground until world G draws the storefront
     mpSettingsHTML() / mpSettingsBind(p)   the two Settings switches (Labels on the map, Open the shop window on arrival)
   PLACE_LINES: the storefronts get a shared arrival line per shop; the market lines that name the Boutique (poodle, stdpoodle) move to the boutique. */

const MP_NEW = ['training', 'pool', 'sunflower', 'bamboo', 'cliffs']; // the "new" stickers (V215.md 4)
const MP_MOVED = ['boutique', 'builder', 'sprout']; // the "moved" stickers: the three shops that left Market Street (with MP_NEW, the 8 places of V215.md 4)
const MP_STICKER_DAYS = 7;
const MP_WALK = { min: 1200, max: 1600, k: 0.5, w: 132, h: 110 }; // the travel walk: duration range in ms, the dog at map scale 0.5 (the yard's 264 x 220 box)
const MP = { fallback: false, walk: null, swallow: 0, lp: 0, lpAt: 0 };
function mpMapReady() { return mpOn() && artChunkReady('f') && !!(window.PawArt && Array.isArray(PawArt.MAP215_AREAS)); }
function mpShopOf(k) { const p = PLACES[k]; return (mpOn() && p && p.shop) || null; }
function mpLabels() { return prefs.mapLabels !== false; }
function mpSceneOpts(k) { return mpOn() && k === 'market' ? { v215: true } : {}; }

/* ---- names, locks, stickers ---- */
const mpIds = () => (window.PawArt && Array.isArray(PawArt.MAP215_AREAS) ? PawArt.MAP215_AREAS.map((a) => a.id) : []);
function mpName(k) {
  if (k === 'yard') return tt('popup.my_yard', 'My Yard');
  if (k === 'shelter') return tt('popup.doodle_doggo_shelter', 'Doodle Doggo Shelter');
  if (k === 'station') return typeof tkPlaceName === 'function' ? tkPlaceName('station') : 'Station';
  if (PLACES[k]) return townPlaceName(k);
  return (window.PawArt && PawArt.MAP215_NAMES && PawArt.MAP215_NAMES[k]) || k;
}
const mpLocked = (k) => !!(PLACES[k] && S && topBond() < PLACES[k].bond);
function mpAria(k) {
  if (k === 'shelter') return tt('town.visit_shelter', 'Visit the shelter');
  if (!PLACES[k]) return mpName(k);
  return tt('town.go_to', '{locked, select, yes {Go to {place} (locked, Bond {bond})} other {Go to {place}}}', { locked: mpLocked(k) ? 'yes' : 'no', place: mpName(k), bond: PLACES[k].bond });
}
const mpDay = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5 : NaN; };
function mpSticker(k) {
  if (!mpOn() || !S || !S.mapNew || S.mapNew.fresh) return null;
  const kind = MP_NEW.includes(k) ? 'new' : MP_MOVED.includes(k) ? 'moved' : null; if (!kind || !PLACES[k]) return null;
  if (Array.isArray(S.mapNew.seen) && S.mapNew.seen.includes(k)) return null;
  const age = mpDay(localISO()) - mpDay(S.mapNew.since); return age >= 0 && age < MP_STICKER_DAYS ? kind : null;
}
function mpSeen(k) {
  if (!S || !S.mapNew || !(MP_NEW.includes(k) || MP_MOVED.includes(k))) return false;
  if (!Array.isArray(S.mapNew.seen)) S.mapNew.seen = [];
  if (S.mapNew.seen.includes(k)) return false; S.mapNew.seen.push(k); markDirty(); return true;
}
function mpMapOpts() {
  if (!mpOn()) return {};
  const names = {}, labels = {}, lock = {}, stickers = {}, hide = [];
  if (!(tkOn() && PLACES.station)) hide.push('station'); // the trip off: no Station on the map
  if (!(jpOn() && PLACES.fujihill)) hide.push('fujihill'); // Japan off (or no Fuji art): no Lookout
  mpIds().forEach((k) => {
    if (hide.includes(k)) return; names[k] = mpName(k); labels[k] = mpAria(k);
    if (mpLocked(k)) lock[k] = tt('map215.lock', 'Bond {bond}', { bond: PLACES[k].bond });
    const st = mpSticker(k); if (st) stickers[k] = { kind: st, text: st === 'new' ? tt('map215.sticker_new', 'new') : tt('map215.sticker_moved', 'moved') };
  });
  const e = envNow();
  return { v215: true, names, labels, lock, stickers, hide, title: tt('town.map_title', 'Doodle Doggo Town'), label: tt('map215.map_label', 'Town map: tap a building to go there'),
    season: e.season, halloween: !!e.halloween, lights: !!e.lights, newyear: !!e.newyear, jp: !!e.jp, snow: weatherNow() === 'snow' };
}
function mpMapArt() {
  const raw = art('scene', 'map', mpMapOpts());
  return { W: 2400, H: 1500, v215: true, areas: PA().MAP215_AREAS, svg: `<g id="sceneG" data-scene="map" data-noenv="1" class="${mpLabels() ? '' : 'mp-nolab'}">${place(raw, 0, 0, 2400, 1500)}</g><g id="mpWalkG"></g>` };
}

/* ---- the wait for world F (split build): a short paper wobble, then the map. A failed load draws the old map once (the next visit tries again) ---- */
function mpMapWait() {
  setChrome(true, false); hideBubble();
  view.innerHTML = `<div class="mp-wait" role="status"><div class="mp-wait-paper"><svg viewBox="0 0 120 90" aria-hidden="true"><path d="M8 14 L44 6 L78 14 L112 6 V78 L78 86 L44 78 L8 86 Z" fill="#FFFBF3" stroke="#5B3D32" stroke-width="3" stroke-linejoin="round"/><path d="M44 6 V78 M78 14 V86" stroke="#5B3D32" stroke-width="2" stroke-dasharray="4 5"/><path d="M18 60 Q34 40 52 52 T96 34" fill="none" stroke="#F28FA5" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 7"/></svg><b>${esc(tt('map215.loading', 'Unfolding the map...'))}</b></div></div><button class="xbtn" id="mapX" aria-label="${esc(tt('town.back_to', 'Back to {place}', { place: PLACES[S.place] ? townPlaceName(S.place) : tt('town.your_place', 'your place') }))}">x</button><div id="status"></div><button id="devBtn">dev</button>`;
  $('#mapX').onclick = () => { SFX.click(); go('yard'); };
  updateHUD(); bindDev();
  artChunk('f').then((ok) => { if (!ok) MP.fallback = true; if (cur.mode === 'map' && $('.mp-wait', view)) enterMap(); });
}
// enterMap asks first: true = wait for the chunk (only while its file is still loading; a build without world F draws the old map)
function mpMapNeedsWait() { if (!mpOn() || MP.fallback || artChunkReady('f')) { MP.fallback = false; return false; } return true; }

/* ---- roads: the shortest path (Dijkstra on edge length) ---- */
let mpGraph = null;
function mpRoads() {
  const R = window.PawArt && PawArt.MAP_ROADS; if (!R || !R.nodes || !Array.isArray(R.edges)) return null;
  if (mpGraph && mpGraph.src === R) return mpGraph;
  const adj = {}; Object.keys(R.nodes).forEach((n) => { adj[n] = []; });
  R.edges.forEach((e, i) => { const len = e.len || e.pts.reduce((a, p, j) => (j ? a + Math.hypot(p[0] - e.pts[j - 1][0], p[1] - e.pts[j - 1][1]) : 0), 0); (adj[e.a] = adj[e.a] || []).push({ to: e.b, i, len, fwd: true }); (adj[e.b] = adj[e.b] || []).push({ to: e.a, i, len, fwd: false }); });
  mpGraph = { src: R, adj }; return mpGraph;
}
function mpRoute(from, to) {
  const G = mpRoads(); if (!G || !G.adj[from] || !G.adj[to]) return null;
  const dist = { [from]: 0 }, prev = {}, done = new Set();
  for (;;) {
    let u = null; Object.keys(dist).forEach((n) => { if (!done.has(n) && (u === null || dist[n] < dist[u])) u = n; });
    if (u === null || u === to) break; done.add(u);
    G.adj[u].forEach((e) => { const d = dist[u] + e.len; if (!(e.to in dist) || d < dist[e.to]) { dist[e.to] = d; prev[e.to] = { from: u, e }; } });
  }
  if (!(to in dist)) return null;
  const legs = []; for (let n = to; n !== from; n = prev[n].from) legs.unshift(prev[n].e);
  const R = PawArt.MAP_ROADS, pts = [R.nodes[from].slice()];
  legs.forEach((l) => { const p = R.edges[l.i].pts, q = l.fwd ? p : p.slice().reverse(); q.forEach((x, j) => { if (j || !pts.length) pts.push([x[0], x[1]]); }); });
  return { nodes: [from].concat(legs.map((l) => l.to)), pts, len: dist[to] };
}
// where the pack is on the town map: the place the dog stands at (house is its own building; a place not on the roads walks from home)
function mpHere() { const R = window.PawArt && PawArt.MAP_ROADS, k = S ? S.place : 'yard'; return R && R.nodes && R.nodes[k] ? k : 'yard'; }

/* ---- the walker: the leader's crayon dog at map scale 0.5, standing at the pack's place when the map opens ---- */
const MP_STAND_DX = 74; // the standing dog waits beside the door, so the building stays in view
function mpWalker() {
  const g = $('#mpWalkG', view), R = window.PawArt && PawArt.MAP_ROADS; if (!g || !R || !S) return;
  const k = mpHere(), n = R.nodes[k], d = D(), { w, h } = MP_WALK, o = { outfit: outfitOf(d) };
  const box = (svg) => place(svg, -w / 2, -h * 0.94, w, h);
  g.innerHTML = `<g class="mp-walker" data-at="${k}" pointer-events="none" transform="translate(${n[0] + MP_STAND_DX} ${n[1]})"><g class="mp-flip"><g class="mp-stand">${box(dogSVG(d, Object.assign({ pose: 'sit' }, o)))}</g><g class="mp-run" style="display:none">${box(dogSVG(d, Object.assign({ pose: 'walk' }, o)))}</g></g></g>`;
}
function mpAt(pts, cum, s) {
  let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
  const a = pts[i - 1], b = pts[i], t = cum[i] > cum[i - 1] ? (s - cum[i - 1]) / (cum[i] - cum[i - 1]) : 0;
  return [a[0] + (b[0] - a[0]) * Math.max(0, Math.min(1, t)), a[1] + (b[1] - a[1]) * Math.max(0, Math.min(1, t)), b[0] - a[0]];
}
// the walk itself: then(k) runs once, at the end or when the walk is skipped (a tap anywhere, the Skip chip, Escape). Motion off: no walk at all
function mpTravel(k, then) {
  const fin = then || (() => pickArea(k));
  const g = $('#mpWalkG .mp-walker', view), from = mpHere(), r = from !== k ? mpRoute(from, k) : null;
  if (motionOff() || !g || !r || r.pts.length < 2) { fin(); return false; }
  const R = PawArt.MAP_ROADS, n0 = R.nodes[from], pts = [[n0[0] + MP_STAND_DX, n0[1]]].concat(r.pts), cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = cum[cum.length - 1], dur = Math.round(MP_WALK.min + (MP_WALK.max - MP_WALK.min) * Math.min(1, L / 2400));
  const flip = g.querySelector('.mp-flip'), st = g.querySelector('.mp-stand'), run = g.querySelector('.mp-run');
  st.style.display = 'none'; run.style.display = '';
  const skipBtn = document.createElement('button'); skipBtn.className = 'btn mp-skip'; skipBtn.id = 'mpSkip'; skipBtn.textContent = tt('map215.skip', 'Tap to skip'); view.appendChild(skipBtn);
  const W = { k, from, to: k, path: r.nodes, len: L, dur, t0: performance.now(), raf: 0, face: 1, done: false, skipped: false, end: null };
  MP.walk = W; view.classList.add('mp-walking'); SFX.whoosh();
  const put = (s) => { const [x, y, dx] = mpAt(pts, cum, s); if (Math.abs(dx) > 0.5) W.face = dx < 0 ? -1 : 1; g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`); flip.setAttribute('transform', W.face < 0 ? 'scale(-1 1)' : ''); return [x, y]; };
  const follow = (x, y) => { const M = MAPV; if (!M || $('#mapPan.dragging')) return; const s = M.base * M.z; M.tx += (M.vw / 2 - x * s - M.tx) * 0.12; M.ty += (M.vh / 2 - y * s - M.ty) * 0.12; mapApply(); };
  const finish = (skipped) => {
    if (W.done) return; W.done = true; W.skipped = !!skipped; cancelAnimationFrame(W.raf); W.end = performance.now();
    put(L); g.setAttribute('data-at', k); window.removeEventListener('pointerdown', onTap, true); window.removeEventListener('keydown', onKey, true);
    skipBtn.remove(); view.classList.remove('mp-walking'); MP.walk = null; MP.last = { k, from, dur, ms: Math.round(W.end - W.t0), skipped: !!skipped, path: W.path.slice() };
    fin();
  };
  const onTap = (e) => { if (cur.mode !== 'map') return; if (e.target && e.target.closest && e.target.closest('#hud, #mapX, #mapZoom')) return; MP.swallow = Date.now() + 500; finish(true); };
  const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); MP.swallow = Date.now() + 500; finish(true); } };
  window.addEventListener('pointerdown', onTap, true); window.addEventListener('keydown', onKey, true);
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const step = (now) => { if (W.done) return; if (cur.mode !== 'map') { finish(true); return; } const t = Math.min(1, (now - W.t0) / dur), [x, y] = put(L * ease(t)); follow(x, y); if (t >= 1) finish(false); else W.raf = requestAnimationFrame(step); };
  W.raf = requestAnimationFrame(step);
  return true;
}

/* ---- the building buttons (V215.md 4) ---- */
const mpEl = (k) => $(`#mapInner .mb[data-area="${k}"]`);
function mpFlash(g, cls, ms) { if (!g) return; g.classList.remove(cls); void g.getBoundingClientRect(); g.classList.add(cls); clearTimeout(g['_' + cls]); g['_' + cls] = setTimeout(() => g.classList.remove(cls), ms); }
// the go-checks travelTo makes, ahead of the walk (so a nope never comes after a walk)
function mpCanGo(k) {
  if (k === 'shelter' || k === 'station') return !busy && !S.sleeping;
  const P = PLACES[k]; if (!P || busy || S.sleeping || k === S.place) return false;
  return !(awayFromHome(k) && staysHome(D()));
}
// phones: a building under the zoom column, the X or a sheet pans into the clear part of the map first
function mpPanIntoView(g, then) {
  const pan = $('#mapPan'), inner = $('#mapInner'); if (!isPhone() || !pan || !inner || !MAPV) { then(); return; }
  const pr = pan.getBoundingClientRect(); let top = pr.top + 8, bot = pr.bottom - 8;
  ['#dock', '#bar', '#mapGo'].forEach((q) => { const e = $(q); if (!e || e.hidden || !e.offsetParent) return; const r = e.getBoundingClientRect(); if (r.height && r.top < bot && r.bottom > pr.bottom - 4) bot = Math.min(bot, r.top - 8); });
  const st = $('#status'); if (st && st.offsetParent) top = Math.max(top, st.getBoundingClientRect().bottom + 6);
  const hit = g.querySelector('.mb-hit') || g, r = hit.getBoundingClientRect(), left = pr.left + 8, right = pr.right - 8;
  const z = $('#mapZoom'), zr = z && z.offsetParent ? z.getBoundingClientRect() : null;
  const over = zr && r.right > zr.left && r.left < zr.right && r.bottom > zr.top && r.top < zr.bottom;
  const clear = (q) => q.top >= top - 1 && q.bottom <= bot + 1 && q.left >= left - 1 && q.right <= right + 1 && !(zr && q.right > zr.left && q.left < zr.right && q.bottom > zr.top && q.top < zr.bottom);
  if (clear(r) && !over) { MP.pan = { moved: false, clear: true }; then(); return; }
  const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
  MAPV.tx += (left + right) / 2 - cx; MAPV.ty += (top + bot) / 2 - cy;
  inner.style.transition = motionOff() ? '' : 'transform .25s ease-out'; mapApply();
  setTimeout(() => { inner.style.transition = ''; MP.pan = { moved: true, clear: clear(hit.getBoundingClientRect()) }; then(); }, motionOff() ? 0 : 270);
}
function mpPick(k) {
  if (MP.walk) return; if (Date.now() < MP.swallow) return;
  const g = mpEl(k);
  if (mpLocked(k)) { if (!motionOff()) mpFlash(g, 'mp-shake', 460); pickArea(k); return; } // the Bond line (travelTo's or pickArea's "Nope"), no travel
  if (!mpCanGo(k)) { pickArea(k); return; } // asleep, busy, a puppy at home, or already here: the usual answer, no walk
  mpPanIntoView(g || view, () => {
    if (g) { mpFlash(g, 'mp-press', 140); setTimeout(() => mpFlash(g, 'mp-picked', 560), 120); }
    setTimeout(() => { if (cur.mode === 'map' && !MP.walk) mpTravel(k); }, motionOff() ? 0 : 150);
  });
}
function mpBindMap(svg) {
  const lbl = (k) => mpAria(k);
  hotify(svg, '.mb[data-area]', 'data-area', (k) => mpPick(k), lbl);
  // keyboard focus scrolls the clipped #mapPan natively: turn that scroll into a map pan, so the transform stays the only offset
  const pan = $('#mapPan'); if (pan) pan.addEventListener('scroll', () => { const dx = pan.scrollLeft, dy = pan.scrollTop; if (!dx && !dy) return; pan.scrollLeft = 0; pan.scrollTop = 0; if (MAPV) { MAPV.tx -= dx; MAPV.ty -= dy; mapApply(); } });
  svg.querySelectorAll('.mb[data-area]').forEach((g) => {
    const k = g.getAttribute('data-area'); let x0 = 0, y0 = 0, down = false;
    const unpress = () => { down = false; clearTimeout(MP.lp); g.classList.remove('mp-press'); };
    g.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !isPhone()) g.classList.add('mp-hov'); });
    g.addEventListener('pointerleave', () => { g.classList.remove('mp-hov'); unpress(); });
    g.addEventListener('pointerdown', (e) => {
      if (MP.walk) return; down = true; x0 = e.clientX; y0 = e.clientY; g.classList.add('mp-press');
      clearTimeout(MP.lp);
      if (e.pointerType !== 'mouse') MP.lp = setTimeout(() => { if (!down) return; g.classList.remove('mp-press'); psTipShow(mapTipText(k), x0, y0); MP.lpAt = Date.now(); }, 500); // long-press: the name, no travel
    });
    g.addEventListener('pointermove', (e) => { if (down && Math.hypot(e.clientX - x0, e.clientY - y0) > 6) unpress(); });
    g.addEventListener('pointerup', unpress); g.addEventListener('pointercancel', unpress);
    g.addEventListener('focus', () => { if (g.matches(':focus-visible')) g.classList.add('mp-foc'); });
    g.addEventListener('blur', () => g.classList.remove('mp-foc'));
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') mpFlash(g, 'mp-press', 120); }, true);
  });
}
// after the map is drawn (enterMap): the dog at the pack's place, the label switch, the captions fitted to the language
function mpMapOpened() {
  mpWalker();
  const inner = $('#mapInner'); if (inner) { inner.classList.toggle('mp-nolab', !mpLabels()); mpFitCaps(inner); }
}
/* ---- captions in every language (V215.md 10): a caption may be at most its building's width + 40. World F sets one line at 31 to 34 units
   (two lines only past about 20 letters); a longer name here goes on two lines at a word break (Intl.Segmenter: Thai and CJK too), then shrinks,
   never under MP_CAP_MIN units. On phones the default zoom keeps a 31-unit caption at MP_CAP_PX (enterMap), so a shrunk one is 13.5 px or more ---- */
const MP_CAP_MIN = 28, MP_CAP_PAD = 36, MP_CAP_PX = 15;
function mpArtW(g) {
  let x0 = 1e9, x1 = -1e9; const lift = g.querySelector('.mb-lift'); if (!lift) return 0;
  [...lift.children].forEach((e) => { if (e.matches('.mb-box,.mb-cap,.mb-lock,.mb-sticker')) return; try { const b = e.getBBox(); if (b.width) { x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + b.width); } } catch (er) { /* not drawn */ } });
  return x1 > x0 ? x1 - x0 : 0;
}
function mpSplit(name) {
  let segs = null;
  try { if (typeof Intl === 'object' && Intl.Segmenter) segs = [...new Intl.Segmenter(tlang(), { granularity: 'word' }).segment(name)].map((x) => x.segment); } catch (e) { segs = null; }
  if (!segs || segs.length < 2) segs = name.split(/(\s+)/).filter((x) => x !== '');
  if (segs.length < 2) segs = [...name];
  if (segs.length < 2) return null;
  const units = (x) => [...x].reduce((a, ch) => a + (/[\u2E80-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\uFF00-\uFFEF\u3040-\u30FF]/.test(ch) ? 2.3 : 1), 0);
  let best = null;
  for (let i = 1; i < segs.length; i++) {
    const a = segs.slice(0, i).join('').trim(), b = segs.slice(i).join('').trim(); if (!a || !b) continue;
    const w = Math.max(units(a), units(b)); if (!best || w < best.w) best = { w, a, b };
  }
  return best ? [best.a, best.b] : null;
}
function mpFitCaps(root) {
  if (!root) return 0; let n = 0;
  root.querySelectorAll('.mb[data-area]').forEach((g) => {
    const cap = g.querySelector('.mb-cap'); if (!cap || !cap.getBBox) return;
    let cw = 0; try { cw = cap.getBBox().width; } catch (e) { return; } if (!cw) return; // hidden (Labels off): fitted when shown
    const max = mpArtW(g) + MP_CAP_PAD; if (!max || cw <= max) return;
    const fs = parseFloat(cap.getAttribute('font-size')) || 31, cx = cap.getAttribute('x') || '0';
    if (!cap.querySelector('tspan')) {
      const two = mpSplit(cap.textContent);
      if (two) { cap.textContent = two[0]; const sp = document.createElementNS('http://www.w3.org/2000/svg', 'tspan'); sp.setAttribute('x', cx); sp.setAttribute('dy', (fs * 1.02).toFixed(1)); sp.textContent = two[1]; cap.appendChild(sp); cw = cap.getBBox().width; }
    }
    if (cw > max) { const f2 = Math.max(MP_CAP_MIN, Math.floor(fs * max / cw)); cap.setAttribute('font-size', f2); cap.querySelectorAll('tspan').forEach((t) => { if (t.getAttribute('dy')) t.setAttribute('dy', (f2 * 1.02).toFixed(1)); }); }
    g.setAttribute('data-capfit', '1'); n++;
  });
  return n;
}

/* ---- storefronts (V215.md 5) ---- */
function mpArrive(k) {
  if (!mpOn()) return false; mpSeen(k);
  const sh = mpShopOf(k); if (!sh || prefs.shopOpen === false) return false;
  setTimeout(() => { if (S && S.place === k && ['yard', 'market'].includes(cur.mode) && modal.hidden && !busy && !(typeof blOn === 'function' && blOn())) openShop(sh); }, 450);
  return true;
}
// the door on the plain sketch ground (no world G scene yet): a doodle shop door with a small sign, a data-shop hot spot like world G's
function mpPlainDoor(k) {
  const sh = mpShopOf(k); if (!sh) return '';
  const col = { boutique: '#DCCBF2', builder: '#EBCDA4', sprout: '#C9EBDA', kibble: '#FCE59A' }[sh] || '#FCE6CC';
  return `<g class="mp-door" data-shop="${sh}" transform="translate(500 236)"><rect x="-150" y="0" width="300" height="150" rx="8" fill="${col}" stroke="#5B3D32" stroke-width="4"/><path d="M-166 4 L0 -60 L166 4 Z" fill="#F28FA5" stroke="#5B3D32" stroke-width="4" stroke-linejoin="round"/><rect x="-44" y="44" width="88" height="106" rx="6" fill="#B98A64" stroke="#5B3D32" stroke-width="4"/><circle cx="28" cy="100" r="5" fill="#5B3D32"/><rect x="-118" y="40" width="56" height="48" rx="4" fill="#E4F2FA" stroke="#5B3D32" stroke-width="3"/><rect x="62" y="40" width="56" height="48" rx="4" fill="#E4F2FA" stroke="#5B3D32" stroke-width="3"/><g transform="translate(0 22) rotate(-3)"><rect x="-58" y="-16" width="116" height="30" rx="8" fill="#FFFBF3" stroke="#5B3D32" stroke-width="3"/><text y="7" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="24" fill="#5B3D32">${esc(tt('map215.door_sign', 'Come in'))}</text></g></g>`;
}
// the shared arrival line of each storefront (03_yard.js placeAmbient reads PLACE_LINES[breed][place]); a getter, so it follows the language
const MP_LINES = {
  boutique: () => tt('map215.line_boutique', 'So many bows in the window. I would like all of them, please.'),
  builder: () => tt('map215.line_builder', 'It smells of fresh wood in here. Can I have one plank? Just to hold.'),
  sprout: () => tt('map215.line_sprout', 'Seed packets and a sunflower. I will sniff every one, very gently.')
};
const MP_MOVED_LINES = { poodle: 'boutique', stdpoodle: 'boutique' }; // their Market Street line names the Boutique: it is said there now
Object.keys(PLACE_LINES).forEach((b) => {
  Object.keys(MP_LINES).forEach((k) => {
    const own = MP_MOVED_LINES[b] === k && PLACE_LINES[b].market;
    Object.defineProperty(PLACE_LINES[b], k, { get: own ? () => tdata('place_lines.' + b + '.market', own) : MP_LINES[k], enumerable: true, configurable: true });
  });
});

/* ---- Settings (20_settings_dev.js) ---- */
function mpSettingsHTML() {
  if (!mpOn()) return '';
  return `<label class="tog"><input type="checkbox" id="setMapLabels" ${mpLabels() ? 'checked' : ''}> ${esc(tt('map215.set_labels', 'Labels on the map'))}</label><br>`
    + `<label class="tog"><input type="checkbox" id="setShopOpen" ${prefs.shopOpen !== false ? 'checked' : ''}> ${esc(tt('map215.set_shop', 'Open the shop window when you arrive'))}</label><br>`;
}
function mpSettingsBind(p) {
  const a = $('#setMapLabels', p), b = $('#setShopOpen', p);
  if (a) a.onchange = (e) => { prefs.mapLabels = !!e.target.checked; savePrefs(); const inner = $('#mapInner'); if (inner) { inner.classList.toggle('mp-nolab', !mpLabels()); mpFitCaps(inner); } };
  if (b) b.onchange = (e) => { prefs.shopOpen = !!e.target.checked; savePrefs(); };
}

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
    sticker: (k) => mpSticker(k), labels: () => mpLabels(), chunk: (n) => artChunk(n || 'f'), chunkReady: (n) => artChunkReady(n || 'f'), plain: (k) => !mpSceneReady(k),
    names: () => { const o = {}; mpIds().forEach((k) => { o[k] = mpName(k); }); return o; }, opts: () => mpMapOpts(), route: (a, b) => mpRoute(a, b), here: () => mpHere(),
    walking: () => (MP.walk ? { to: MP.walk.to, from: MP.walk.from, dur: MP.walk.dur, len: MP.walk.len, path: MP.walk.path.slice() } : null), last: () => (MP.last ? Object.assign({}, MP.last) : null),
    fitCaps: (el) => mpFitCaps(el), line: (b, k) => (PLACE_LINES[b] && PLACE_LINES[b][k]) || null, lines: () => PLACE_LINES, panned: () => MP.pan || null, pick: (k) => mpPick(k), seen: (k) => mpSeen(k), arrive: (k) => mpArrive(k), sceneOpts: (k) => mpSceneOpts(k),
    view: (dx, dy) => { if (!MAPV) return null; MAPV.tx += dx || 0; MAPV.ty += dy || 0; mapApply(); return { tx: MAPV.tx, ty: MAPV.ty, s: MAPV.base * MAPV.z }; } // pans the map by screen px (phone suite)
  };
}
on('game:ready', () => setTimeout(mpExpose, 0));
setTimeout(mpExpose, 0);
