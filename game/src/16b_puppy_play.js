/* ======================= v2: 16b_puppy_play.js (PLAY lane): life-stage rules, puppy idles, test helpers ======================= */
/* Dogs bought at 10 months are 'young': every rule below only touches puppies (< 6 months), expecting mums and nursing mums. */
const dogMonths = (d) => ageMonths(d || S.dog);
const isPup = (d) => lifeStage(dogMonths(d)) === 'puppy';
// isNursing(d) is defined in 14b_vet_playboard.js (same scope)
const isExpecting = (d) => !!d && !!d.preg;
/* walks: null when fine, else the friendly "no" line (pronouns from the dog, not from the active dog) */
function walkBlock(d, area) {
  d = d || D(); if (!d) return null; const pr = PRd(d), m = dogMonths(d), parkName = (ROUTES.park && ROUTES.park.n) || 'Sunny Park';
  if (isNursing(d)) return `${d.name} is nursing the pups and stays by the nursery. No walks for ${pr.him} right now.`;
  if (m < 3) return `${d.name} is too little for walks. Yard play only.`;
  if (m < 6 && area !== 'park') return `${d.name} is still a pup. ${pr.He} only does ${parkName} for now.`;
  if (isExpecting(d) && area !== 'park') return `${d.name} is expecting, so ${pr.he} only strolls in ${parkName}.`;
  return null;
}
/* a dog that can go nowhere at all (used to skip the route carousel) */
const walkNever = (d) => !!d && (isNursing(d) || dogMonths(d) < 3);
/* 3 to 6 months: shorter walks (the runner gets durationSec x 0.7; the classic walk scales its length) */
const walkScale = (d) => { d = d || D(); return d && dogMonths(d) >= 3 && dogMonths(d) < 6 ? 0.7 : 1; };
/* pack walks: dogs that can't go stay home with a friendly line */
function walkPackNote(area) {
  if (!S || S.dogs.length < 2) return;
  others().filter((o) => walkBlock(o, area)).slice(0, 3).forEach((o, i) => setTimeout(() => { if (S && cur.mode === 'walk') toast(isNursing(o) ? `${o.name} stays home with the pups.` : `${o.name} stays home with a chew toy.`, ''); }, 1200 + i * 1700));
}
/* training: blocked under 2 months; 2 to 6 months: 4 attempts per session (Focus 25 each) and progress x1.2 */
function trainBlock(d) { d = d || D(); const pr = PRd(d); return dogMonths(d) < 2 ? `${d.name} is too little to train. Wait until ${pr.he} is 2 months old.` : null; }
const trainCost = (d) => { d = d || D(); return isPup(d) ? 25 : TG_FOCUS; };
const trainBoost = (d) => { d = d || D(); return isPup(d) ? 1.2 : 1; };
/* fetch: not for nursing mums */
function fetchBlock(d) { d = d || D(); return isNursing(d) ? `${d.name} is nursing the pups. No fetch for ${PRd(d).him} right now.` : null; }

/* the map goes through pickArea(): walk-only routes (hilltop, pier) go to a walk from there, so say no there too and the player stays on the map.
   (Park, River, Woods and Beach are also places to visit: travelling there is not a walk; the walk itself starts from the route carousel.) */
const pickAreaBase = pickArea;
pickArea = function (k) {
  const r = ROUTES[k];
  if (r && !PLACES[k] && S && !S.sleeping && topBond() >= r.bond) { const wb = walkBlock(D(), k); if (wb) { SFX.click(); nope(wb); return; } }
  return pickAreaBase(k);
};

/* ---------- puppy idles ---------- */
const PUP_IDLE = ['pounce', 'tumble', 'chewtoy', 'follow', 'pupzoomies', 'tailbark'];
const PUP_MOVERS = ['pounce', 'follow', 'pupzoomies'];
const LEAF_SVG = '<svg viewBox="0 0 40 40"><path d="M6 31 Q7 11 30 8 Q33 29 12 35 Z" fill="#D98E3F" stroke="#5B3D32" stroke-width="2.5" stroke-linejoin="round"/><path d="M8 33 L27 14" stroke="#5B3D32" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
function pupPropClear() { document.querySelectorAll('#fx .pup-prop').forEach((e) => e.remove()); }
function pupProp(p) {
  const fx = $('#fx'); if (!fx || !p) return; pupPropClear();
  let svg = LEAF_SVG, w = 46, h = 46;
  if (p.kind === 'ball') { try { svg = art('prop', 'ball') || svg; } catch (e) { /* leaf stays */ } w = 54; h = 54; }
  fx.insertAdjacentHTML('beforeend', `<g class="pup-prop" pointer-events="none">${place(svg, p.x - w / 2, 500 - h, w, h)}</g>`);
}
/* who a pup trots after: mum first, then an adult, then anyone */
function pupLeader(d) {
  const os = others(); if (!os.length) return null;
  const dam = d.parents && d.parents.dam; const mum = dam && os.find((o) => o.id === dam);
  return mum || os.find((o) => lifeStage(dogMonths(o)) !== 'puppy') || PICK(os);
}
function pupIdleSteps(name) {
  const d = D(), sp = IDLE.speed, R = (a, b) => RINT(a, b) * sp;
  const home = { move: [0, 0, 1, 0.6 * sp], pose: 'walk', facing: 'right', ms: 650 * sp };
  switch (name) {
    case 'pounce': { // a leaf drifts by: crouch, wiggle, pounce, tiny victory yip
      const dir = Math.random() < 0.5 ? -1 : 1, face = dir < 0 ? 'left' : 'right';
      return [{ pose: 'crouch', fb: 'sit', fx: 'tk-pwig', facing: face, ms: 1000 * sp, prop: { kind: 'leaf', x: 430 + dir * 130 } },
        { move: [dir * 95, 0, 1, 0.3 * sp], pose: 'jump', fx: 'tk-pounce', facing: face, ms: 700 * sp, propOff: true },
        { pose: 'happy', facing: face, ms: 900 * sp, sound: 'yip' }, home];
    }
    case 'tumble': return [{ pose: 'rollover', fx: 'tk-tumble', ms: R(1800, 2600) }, { pose: 'happy', ms: 800 * sp, sound: 'yip' }, { pose: 'rollover', fx: 'tk-tumble', ms: R(1200, 1800) }];
    case 'chewtoy': return [{ pose: 'happy', ms: 700 * sp, prop: { kind: 'ball', x: 520 } }, { pose: 'eat', fb: 'sit', fx: 'tk-chew', facing: 'right', ms: R(4000, 6500) }, { pose: 'happy', ms: 800 * sp, propOff: true }];
    case 'follow': {
      const o = pupLeader(d);
      if (!o) return [{ move: [RINT(-110, 110), 0, 1, 0.7 * sp], pose: 'walk', fx: 'tk-pzoom', ms: 800 * sp }, { pose: 'sit', ms: R(2000, 3500) }, home];
      const i = others().indexOf(o), spot = packSpots()[i] || [700, 410, 'left'], dir = spot[0] < 430 ? -1 : 1, face = dir < 0 ? 'left' : 'right', tx = clamp(spot[0] - 430 - dir * 120, -300, 380);
      return [{ move: [tx, -30, 0.92, 0.9 * sp], pose: 'walk', fx: 'tk-pzoom', facing: face, ms: 950 * sp },
        { move: [tx - dir * 45, -30, 0.92, 0.5 * sp], pose: 'walk', facing: dir < 0 ? 'right' : 'left', ms: 560 * sp },
        { move: [tx, -30, 0.92, 0.5 * sp], pose: 'walk', facing: face, ms: 560 * sp, other: [o, 'happy'] },
        { pose: 'sit', facing: face, ms: R(2500, 4500) }, home];
    }
    case 'pupzoomies': return [{ move: [320, 0, 1, 0.4 * sp], pose: 'walk', fx: 'tk-pzoom', facing: 'right', ms: 430 * sp, sound: 'yip' },
      { move: [-260, -6, 1, 0.5 * sp], pose: 'walk', fx: 'tk-pzoom', facing: 'left', ms: 540 * sp },
      { move: [90, 0, 1, 0.35 * sp], pose: 'jump', fx: 'tk-pounce', facing: 'right', ms: 520 * sp },
      { move: [-120, 0, 1, 0.4 * sp], pose: 'walk', fx: 'tk-pzoom', facing: 'left', ms: 480 * sp },
      { move: [0, 0, 1, 0.4 * sp], pose: 'walk', facing: 'right', ms: 500 * sp },
      { pose: 'down', fx: 'tk-lie', ms: R(3500, 6000) }]; // puppies flop over afterwards
    case 'tailbark': return [{ pose: 'walk', fx: 'tk-chase', ms: 1500 * sp },
      { pose: 'speak', fb: 'happy', fx: 'tk-tbark', facing: 'left', ms: 1500 * sp, sound: 'yip', say: PICK(['Who goes there?!', 'Yip! Yip! Stop that!', 'Intruder! At my back end!']) },
      { pose: 'sit', facing: 'right', ms: 1000 * sp, say: PICK(['...oh. It is my tail.', 'It is attached to me. Huh.', '(It was my tail.)']) }];
  }
  return [{ pose: 'idle', ms: 3000 }];
}
/* weights: puppies nap x2 and play more; nursing mums lie down near the nursery */
function pupIdleWeights(w, d, stage) {
  const st = d.stats, indoor = !outdoorsNow();
  if (stage === 'puppy') {
    w.pounce = indoor ? 1.2 : 3; w.tumble = 2; w.chewtoy = 2.4; w.tailbark = 1.4;
    w.tailchase += 3; // "more often" (the base +2 needs Happiness > 60)
    w.pupzoomies = st.energy > 45 && st.happy > 45 ? 2.6 : 0.4; w.zoomies *= 0.4;
    if (others().length) w.follow = 3.2;
    w.nap *= 2; if (st.energy < 55) w.nap += 2; // frequent naps (x2)
  }
  if (isNursing(d)) { // mostly lying down by the nursery
    w.down = 16 + w.down; w.nap = w.nap * 1.5 + 2; w.zoomies = 0; w.pupzoomies = 0; w.tailchase = 0; w.roll = 0; w.bringtoy = 0; w.pounce = 0; w.tumble = 0; w.social *= 0.3; w.sniff *= 0.2; w.look *= 0.5; w.sit *= 0.4; w.stretch *= 0.6; w.drink = Math.min(w.drink, 0.4);
  }
}
/* pack dogs: pups doze twice as much, nursing mums lie by the nursery */
function pupPackPool(d) {
  if (isNursing(d)) return ['down', 'down', 'down', 'down', 'sleep', 'sleep', 'sit', 'yawn'];
  if (isPup(d)) return ['idle', 'sit', 'happy', 'rollover', 'sleep', 'sleep', 'sleep', 'sleep', 'down', 'happy', 'scratch'];
  return null;
}

/* ---------- test helpers: window.__paw.busy, idle.pin(name) ---------- */
function pawPlayHelpers() {
  const P = window.__paw; if (!P) return false;
  if (!P.idle) P.idle = {};
  const pose = (name) => (name === 'nap' ? 'sleep' : name);
  Object.assign(P.idle, {
    // hold a pose on the pack dogs (and on the active dog) until pin(null); returns the pinned name
    pin: (name) => {
      idlePin = name || null;
      if (idlePin) {
        const p = pose(idlePin);
        if (IDLE.act) { IDLE.steps = []; idleEnd(); }
        idlePin = p; others().forEach((d) => { packPose[d.id] = p; if ($('#pack')) redrawPackDog(d); });
        if (S && cur.mode === 'yard' && !S.sleeping && $('#dogArt')) { tempPose = p; tempUntil = Infinity; renderDog(p, 'right', true); }
      } else {
        others().forEach((d) => { delete packPose[d.id]; packNext[d.id] = 0; });
        if (tempUntil === Infinity) { tempPose = null; tempUntil = 0; } if (S && cur.mode === 'yard' && $('#dogArt')) renderDog(dogPoseNow(), 'right', true);
      }
      return idlePin;
    }
  });
  Object.defineProperty(P.idle, 'pinned', { get: () => idlePin, configurable: true });
  if (!Object.getOwnPropertyDescriptor(P, 'busy')) Object.defineProperty(P, 'busy', { get: () => busy, configurable: true });
  Object.assign(P, { play: { walkBlock, trainBlock, walkScale, fetchBlock, isPup, isNursing, trainCost, dogMonths } });
  return true;
}
on('game:ready', () => { pawPlayHelpers(); });
setTimeout(() => { pawPlayHelpers(); }, 0);
