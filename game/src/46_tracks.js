/* ======================= v2.15 AROUND TOWN: the three run tracks as places (V215.md section 6.3, ACTIVITIES lane, tag tr, test hook __paw.tr) =======================
   Owner: the ACTIVITIES lane (no CSS file of its own; the gate buttons use the #placeBtns row). Laid down by the stubs lane: the names work today.
   Places: PLACES.sunflower / bamboo / cliffs (run: true, only while mpOn()). The ACTIVITIES lane adds their ROUTES rows (Bond 2 / 4 / 7, inside the
   town / woods / beach tiers), ROUTE_WORD / ROUTE_HINT, the six treasures (TR(...) appended, ALL_ROUTES gains the keys), the carousel cards and the
   strips (PawArt.walkStrip('sunflower' | 'bamboo' | 'cliffs'), world G). Save: S.trk { seen: { routeKey: true } } (v215Fields in 00_core.js).
   The run gate (data-hot="run" in the trailhead scenes and the old route places) starts go('walk', k) with the pickArea checks.
   API (stubs now)
     TR_TRACKS          the three new route keys
     trOn()             the new tracks can be run now (their ROUTES rows exist): false until the lane adds them
     trGate(k)          the run gate of place k was tapped: the pickArea checks, then go('walk', route). Stub: false (nothing happens)
     trRouteOf(k)       the route a place's gate starts (the place key when ROUTES has it, square -> 'town'), else null */

const TR_TRACKS = ['sunflower', 'bamboo', 'cliffs'];
function trOn() { return mpOn() && TR_TRACKS.every((k) => !!ROUTES[k] && !!PLACES[k]); }
function trGate(k) { return false; }
function trRouteOf(k) { const r = k === 'square' ? 'town' : k; return ROUTES[r] ? r : null; }

/* ---- tests: window.__paw.tr ---- */
function trExpose() {
  if (!window.__paw) return;
  window.__paw.tr = { on: () => trOn(), tracks: TR_TRACKS.slice(), gate: (k) => trGate(k), route: (k) => trRouteOf(k), seen: () => Object.assign({}, S && S.trk ? S.trk.seen : {}) };
}
on('game:ready', () => setTimeout(trExpose, 0));
setTimeout(trExpose, 0);
