/* ======================= v2.15 AROUND TOWN: the Training Ground agility course (V215.md section 6.1, ACTIVITIES lane, tag ag, test hook __paw.ag) =======================
   Owner: the ACTIVITIES lane (with css/46_agility.css).
   Place: PLACES.training (Bond 3, only while mpOn()). Save: S.ag { day, runs, coins, best: { dogId: 1-3 }, seen, by: { dogId: day } } (v215Fields in 00_core.js; `by`
   is added on first use, additive). Rules: no fail state (every run ends with 1 to 3 rosettes), the puppy course for puppies and seniors (tunnel, table, a
   low bar), Bond +10 for a dog's first run of the day, coins 10 / 20 / 30 for the first two runs of the day with AG_COIN_DAY 40 pack-wide, Energy -10 a run,
   rmPause('agility') during a run, a picked pack dog runs through pkWith (it is the leader until the run ends, pkBack puts the old leader back).
   The run: the dog walks to an obstacle, one big Go! (64 px) with a gentle timing gauge (a marker sweeps, the target zone is wider on phones and on the low course):
   inside the zone = Perfect, near it = Good, anywhere else (or no tap for AG_WAIT ms) = Slow and steady, which still clears the obstacle, only slower (a stroll).
   Rosettes: the share of the best possible points (2 an obstacle, 1 good, 0 slow) >= 0.75 -> 3, >= 0.35 -> 2, else 1.
   The roaming dogs use the props on their own already (43_ground.js grSpotSteps: weave, jump, tyre, tunnel, table), no GR_ACTS entry is needed.
   Strings: tt('agility.<what>', 'English'). The arrival lines are the AG_LINES table (data.ag_lines.<breed>), merged into PLACE_LINES[breed].training.
   API
     agOn()             the course can be run here now (mpOn(), the Training Ground scene with its five spots)
     agStart(d, o)      start a run for dog d (o.puppy: the low course). False when it cannot start
     agBest(id)         the best rosettes of a dog (0 = none yet)
     agCoinsLeft()      agility coins still to earn today (AG_COIN_DAY minus today's)
     agTrickBonus()     true once per training session at the Training Ground (15b_trick_games.js tgApply adds one extra step) */

const AG_COIN_DAY = 40;
const AG_COINS = [0, 10, 20, 30]; // by rosettes, the first two runs of the day
const AG_ORDER = ['table', 'weave', 'tunnel', 'jump', 'tyre']; // left to right along the course
const AG_LOW = ['table', 'tunnel', 'jump']; // the puppy course: the jump spot is the bar on the ground
// the low course's hop over the bar on the ground (world G data-ag-bar="lo": about 8 units high, crossing the path at the jump box's x - 15):
// [centre x from the box's left edge, height x the dog's scale (a 4-month corgi: about 16 units, a big senior: 23), half width]
const AG_LOW_HOP = [-15, 24, 56];
const AG_SPEED = { perfect: 'run', good: 'trot', slow: 'stroll' };
const AG_PERIOD = 1800, AG_WAIT = 10000; // the marker's sweep (ms) and how long the dog waits for Go! before it simply goes
let AG = null; // the run in progress, or null

function agOn() {
  if (typeof mpOn !== 'function' || !mpOn() || !S || S.place !== 'training' || cur.mode !== 'yard') return false;
  if (!grOn('training')) return false;
  const f = grFloor('training'); return !!f && AG_ORDER.every((k) => f.spots.some((s) => String(s.id) === k));
}
function agRunning() { return !!AG; }
function agBest(id) { return (S && S.ag && S.ag.best && +S.ag.best[id]) || 0; }
function agDay() { if (!S.ag || typeof S.ag !== 'object') S.ag = { day: '', runs: 0, coins: 0, best: {}, seen: false }; if (S.ag.day !== localISO()) { S.ag.day = localISO(); S.ag.runs = 0; S.ag.coins = 0; markDirty(); } if (!S.ag.best) S.ag.best = {}; if (!S.ag.by) S.ag.by = {}; return S.ag; }
function agCoinsLeft() { if (!S || !S.ag) return AG_COIN_DAY; return S.ag.day === localISO() ? Math.max(0, AG_COIN_DAY - (S.ag.coins || 0)) : AG_COIN_DAY; }
function agLowFor(d) { const st = lifeStage(ageMonths(d)); return st === 'puppy' || st === 'senior'; }
function agTrickBonus() { if (typeof mpOn !== 'function' || !mpOn() || !S || S.place !== 'training' || !TRN || TRN.agBonus) return false; TRN.agBonus = true; return true; }

/* ---------------- the arrival lines (35 breeds) ---------------- */
const AG_LINES = {
  shiba: 'A course for me? Fine. I will do it my way and be admired.',
  corgi: 'Tunnels! My legs were built for tunnels! Probably!',
  golden: 'Jumps and a tunnel and a rosette flag! Best day ever.',
  dachs: 'A tunnel! I have been training for this my whole long life.',
  husky: 'Weave poles are just very polite trees. AWOO, I will run them.',
  mutt: 'I do not know the rules. I will try very hard anyway.',
  chihuahua: 'Everything here is huge. I am still going to win it.',
  pug: 'I will do one obstacle. Maybe half. Then the table, for a sit.',
  greyhound: 'A proper runway with things to leap over. Finally. Zoom.',
  beagle: 'The poles smell like ten other dogs. I must read every one.',
  poodle: 'Elegant jumps, tidy turns. I have been practising my bow.',
  collie: 'A course to run in circles around! Everyone, follow me!',
  samoyed: 'Tyre, tunnel, rosette flag! I am smiling and bouncing.',
  frenchie: 'Bat ears up, belly low. The tunnel and I are old friends.',
  akita: 'A calm, careful run. Honour matters more than speed.',
  spitz: 'Tiny paws, big plans, one very loud yip at the start.',
  pom: 'A fluffy ball goes into the tunnel and a fluffier ball comes out.',
  afghan: 'I will glide over the jump. My hair will arrive a moment later.',
  dane: 'The tunnel is a little small for me. I will fold up politely.',
  mastiff: 'Slow and steady. I will take the table and the applause.',
  gsd: 'A clear course and a clear plan. Ready when you are.',
  dobie: 'Sleek and sharp. Show me the course and stand back.',
  corso: 'I will guard the course first. Then I will run it, very proudly.',
  pitbull: 'Wiggle, wiggle, jump! Look at me, I am doing it, look!',
  minpin: 'Little legs, big hops. Watch me prance over the bar.',
  lab: 'Tyre, tunnel, table, everything! Is that a treat on the table?',
  malamute: 'Strong legs and a big heart. I will take the poles slowly and neatly.',
  chow: 'I will cross the course in my own dignified way.',
  stdpoodle: 'Tall jumps, tidy turns. I was made for rosettes.',
  schnauzer: 'Whiskers forward! The poles never saw me coming.',
  westie: 'Small and white and extremely confident about tunnels.',
  yorkie: 'I may be tiny, but I rule this arena and its bunting.',
  bichon: 'Boing, boing, tunnel, boing! A fluffy cloud on the course.',
  maltese: 'A silky run, a graceful hop and a very neat finish.',
  shihtzu: 'I will stroll the whole course at a lovely pace. Slow clap for me.'
};
// a getter, so the line follows the player's language (03_yard.js placeAmbient reads PLACE_LINES[breed].training at run time)
Object.keys(AG_LINES).forEach((b) => { if (PLACE_LINES[b]) Object.defineProperty(PLACE_LINES[b], 'training', { get: () => tdata('ag_lines.' + b, AG_LINES[b]), enumerable: true, configurable: true }); });

// Gerald's guide card (25_guide.js): [key, icon, title, text], only while mpOn()
function agLesson() { return typeof mpOn === 'function' && mpOn() ? ['agility', 'bond', tt('agility.lesson_title', 'Agility'), tt('agility.lesson_text', 'The Training Ground has an agility course. Tap Go! when the marker is in the green, and every run earns a rosette. Short runs keep young and old joints happy.')] : null; }

/* ---------------- art: a crayon rosette ---------------- */
function agRosette(on, sz) {
  const c = on ? '#F7D24E' : '#E9E1D2', r1 = 15, pts = [];
  for (let j = 0; j < 16; j++) { const a = (j / 16) * Math.PI * 2, rr = j % 2 ? r1 * 0.82 : r1; pts.push((Math.cos(a) * rr).toFixed(1) + ' ' + (Math.sin(a) * rr).toFixed(1)); }
  return `<svg class="ag-ros${on ? ' on' : ''}" viewBox="-20 -20 40 58" width="${sz || 30}" height="${Math.round((sz || 30) * 1.45)}" aria-hidden="true"><path d="M-6 6 L-11 32 L-4 27 L-1 34 L0 8 Z" fill="${on ? '#8FB6E3' : '#DDD6C8'}" stroke="#5B3D32" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 6 L11 32 L4 27 L1 34 L0 8 Z" fill="${on ? '#F28FA5' : '#DDD6C8'}" stroke="#5B3D32" stroke-width="1.5" stroke-linejoin="round"/><path d="M${pts.join(' L')} Z" fill="${c}" stroke="#5B3D32" stroke-width="1.8" stroke-linejoin="round"/><circle r="6.5" fill="#FFFBF3" stroke="#5B3D32" stroke-width="1.4"/></svg>`;
}
const agRosettes = (n, sz) => [1, 2, 3].map((i) => agRosette(i <= n, sz)).join('');

/* ---------------- the scoreboard in the scene: one row of rosettes per dog (the art's own board is static) ---------------- */
const AG_BOARD = [1300, 188, 180, 86]; // world C/G scoreboard(k, 1390, 338, 1): the board face
function agBoardDraw() {
  const svg = $('#view svg.world'); if (!svg) return; const old = $('#agBoard', svg); if (old) old.remove();
  if (!agOn()) return; const pk = $('#pack', svg); if (!pk) return;
  const dogs = (S.dogs || []).slice(0, 4), [bx, by, w, h] = AG_BOARD, row = (h - 10) / Math.max(2, dogs.length);
  let g = `<rect x="${bx}" y="${by}" width="${w}" height="${h}" fill="#6E9A80" stroke="#5B3D32" stroke-width="1.6"/>`;
  dogs.forEach((d, i) => {
    const y = by + 5 + row * i + row / 2, n = agBest(d.id);
    g += `<circle cx="${bx + 16}" cy="${y.toFixed(1)}" r="4" fill="#FFFFFF" opacity=".85"/>`;
    for (let k = 1; k <= 3; k++) g += `<circle cx="${bx + 38 + (k - 1) * 28}" cy="${y.toFixed(1)}" r="${Math.min(10, row / 2 - 1).toFixed(1)}" fill="${k <= n ? '#F7D24E' : 'none'}" stroke="${k <= n ? '#5B3D32' : '#FFFFFF'}" stroke-width="${k <= n ? 1.5 : 1.2}" stroke-dasharray="${k <= n ? 'none' : '3 3'}" opacity="${k <= n ? 1 : 0.7}"/>`;
  });
  // the scene's own time, weather and season treatment (world G recolours its art: night, snow, autumn), so the board is not daytime-bright on a snowy night
  const sc = svg.querySelector('svg.pa-wg-training'), ds = sc ? sc.dataset : {};
  if (ds.time && typeof PawArt.tintG === 'function') g = PawArt.tintG(g, { time: ds.time, weather: ds.weather, season: ds.season || 'summer' });
  pk.insertAdjacentHTML('beforebegin', `<g id="agBoard" class="ag-board" pointer-events="none" aria-hidden="true">${g}</g>`);
}

/* ---------------- the place button and the first-visit note ---------------- */
function agPlaceBtn() {
  const pb = $('#placeBtns'); if (!pb) return; pb.querySelectorAll('[data-ag]').forEach((b) => b.remove());
  if (!agOn() || AG) return;
  const html = `<button class="btn yes" data-ag="open">${esc(tt('agility.btn', 'Agility course'))}</button>`, home = pb.querySelector('[data-pb="yard"]');
  if (home) home.insertAdjacentHTML('beforebegin', html); else pb.insertAdjacentHTML('beforeend', html);
  pb.querySelector('[data-ag]').onclick = () => agOpen();
}
function agArrive() {
  if (!agOn()) return; agPlaceBtn(); agBoardDraw();
  agDay();
  if (!S.ag.seen) { S.ag.seen = true; markDirty(); setTimeout(() => { if (S && S.place === 'training') toast(tt('agility.care_note', 'Agility is play, so keep runs short and stop while your dog still wants more. Soft ground and low bars keep young and old joints happy.'), 'gold'); }, 900); }
}
on('yard:enter', agArrive); on('scene:redraw', () => { if (!agOn()) return; if (!AG && !$('#placeBtns [data-ag]')) agPlaceBtn(); agBoardDraw(); }); // a new time or weather: the board takes the new treatment
on('day:new', () => { if (agOn() && !AG) agBoardDraw(); });

/* ---------------- the trays ---------------- */
function agWho() { const lead = S.dog; return [lead].concat((S.dogs || []).filter((d) => d !== lead && !(typeof hmMumIn === 'function' && hmMumIn(d)))); }
function agBlock(d) {
  if (!d) return 'none';
  if (d.sleeping) return tt('agility.asleep', '{name} is asleep. The course can wait.', { name: d.name });
  if (typeof isNursing === 'function' && isNursing(d)) return tt('agility.nursing', '{name} is nursing the pups. No agility for {sex, select, female {her} other {him}} right now.', { name: d.name, sex: d.sex === 'female' ? 'female' : 'male' });
  if (ageMonths(d) < 3) return tt('agility.too_young', '{name} is too little for the course. Watching is fun too.', { name: d.name });
  if ((d.stats ? +d.stats.energy : 70) < 10) return tt('agility.tired', '{name} is too tired. A nap first, then the course.', { name: d.name });
  return '';
}
function agOpen() {
  if (!agOn() || AG || busy || S.sleeping) return false;
  popDown(); clearCurl(); hideBubble(); toasts.innerHTML = '';
  AG = { ph: 'pick', pick: S.dog.id, t: [], tok: Date.now() };
  setChrome(true, false); document.documentElement.classList.add('ag-on'); try { rmPause('agility'); } catch (e) { /* none */ }
  onCleanup(() => { if (AG) agStop(true); });
  busy = true; agTray(); return true;
}
function agTray() {
  if (!AG) return; const A = AG;
  if (A.ph === 'pick') {
    const dogs = agWho(), blk = agBlock(dogs.find((d) => d.id === A.pick));
    dock.innerHTML = `<div class="tray mini ag-tray" data-ph="pick"><div class="tray-h"><h3>${esc(tt('agility.title', 'Agility course'))}</h3><button class="btn ag-done" id="agDone" aria-label="${esc(tt('agility.leave', 'Leave the course'))}">${esc(tt('agility.done', 'Done'))}</button></div>
      <div class="tray-body"><p class="small ag-hint" id="agHint">${esc(blk || tt('agility.pick_hint', 'Five obstacles. Tap Go! when the marker is in the green. A late tap still clears the obstacle, only slower. Everyone earns a rosette.'))}</p>
      <div class="ag-dogs" role="group" aria-label="${esc(tt('agility.who', 'Who runs?'))}">${dogs.map((d) => `<button class="btn ag-dog${d.id === A.pick ? ' sel' : ''}" data-id="${esc(d.id)}" aria-pressed="${d.id === A.pick}"><span class="ag-dn">${esc(d.name)}</span><span class="ag-best" aria-label="${esc(tt('agility.best_label', 'Best: {n, plural, =0 {no rosettes yet} one {# rosette} other {# rosettes}}', { n: agBest(d.id) }))}">${agRosettes(agBest(d.id), 16)}</span></button>`).join('')}</div>
      <button class="btn yes ag-start" id="agStart" ${blk ? 'aria-disabled="true"' : ''}>${esc(tt('agility.start', 'Start the course'))}</button></div></div>`;
    $('#agDone').onclick = () => { SFX.boop(700); agStop(); };
    dock.querySelectorAll('.ag-dog').forEach((b) => { b.onclick = () => { A.pick = b.dataset.id; SFX.boop(620); agTray(); }; });
    $('#agStart').onclick = () => { const d = dogById(A.pick), why = agBlock(d); if (why) { nope(why); return; } SFX.boop(840); agStart(d, {}); };
  } else if (A.ph === 'ready' || A.ph === 'go') {
    const n = A.course.length, id = A.course[A.i], name = agObName(id);
    dock.innerHTML = `<div class="tray mini ag-tray" data-ph="run"><div class="tray-h"><h3>${esc(tt('agility.step', '{name}: {n} of {total}', { name, n: A.i + 1, total: n }))}</h3><button class="btn ag-done" id="agDone" aria-label="${esc(tt('agility.leave', 'Leave the course'))}">${esc(tt('agility.stop', 'Stop'))}</button></div>
      <div class="tray-body"><div class="ag-gauge" id="agGauge" aria-hidden="true"><i class="ag-zone" id="agZone"></i><b class="ag-mark" id="agMark"></b></div>
      <p class="small ag-hint" id="agHint">${esc(A.low ? tt('agility.hint_low', 'The low course: tunnel, table and a bar on the ground. Tap Go! when the marker is in the green.') : tt('agility.hint', 'Tap Go! when the marker is in the green.'))}</p>
      <button class="btn yes ag-go" id="agGo">${esc(tt('agility.go', 'Go!'))}</button></div></div>`;
    $('#agDone').onclick = () => { SFX.boop(700); agStop(); }; $('#agGo').onclick = () => agGo();
    const z = $('#agZone'); if (z) { z.style.left = ((0.5 - A.hw) * 100).toFixed(1) + '%'; z.style.width = (A.hw * 200).toFixed(1) + '%'; }
    const go = $('#agGo'); if (go && A.ph === 'ready') try { go.focus({ preventScroll: true }); } catch (e) { /* none */ }
  } else if (A.ph === 'done') {
    const R = A.res;
    dock.innerHTML = `<div class="tray mini ag-tray" data-ph="done"><div class="tray-h"><h3>${esc(tt('agility.result_title', '{name} finished the course!', { name: A.d.name }))}</h3><button class="btn ag-done" id="agDone">${esc(tt('agility.done', 'Done'))}</button></div>
      <div class="tray-body"><div class="ag-ros-row" role="img" aria-label="${esc(tt('agility.rosettes', '{n, plural, one {# rosette} other {# rosettes}}', { n: R.stars }))}">${agRosettes(R.stars, 44)}</div>
      <p class="small ag-hint" id="agHint">${esc(R.lines.join(' '))}</p>
      <button class="btn yes ag-again" id="agAgain" ${agBlock(A.d) ? 'aria-disabled="true"' : ''}>${esc(tt('agility.again', 'Run it again'))}</button></div></div>`;
    $('#agDone').onclick = () => { SFX.boop(700); agStop(); };
    $('#agAgain').onclick = () => { const why = agBlock(A.d); if (why) { nope(why); return; } SFX.boop(840); const d = A.d; agEndRun(); agStart(d, { puppy: A.forceLow }); };
  }
}
const agObName = (id) => ({ weave: tt('agility.ob_weave', 'Weave poles'), jump: tt('agility.ob_jump', 'Jump bar'), tyre: tt('agility.ob_tyre', 'Tyre'), tunnel: tt('agility.ob_tunnel', 'Tunnel'), table: tt('agility.ob_table', 'Pause table') })[id] || id;
const agQName = (q) => ({ perfect: tt('agility.q_perfect', 'Perfect!'), good: tt('agility.q_good', 'Good!'), slow: tt('agility.q_slow', 'Slow and steady!') })[q];

/* ---------------- the run ---------------- */
function agStart(d, o) {
  o = o || {};
  if (!d || !agOn() || agBlock(d)) return false;
  if (AG && AG.ph !== 'pick' && AG.ph !== 'done') return false;
  if (d.id === S.activeId) { if (!AG && !agOpen()) return false; agBegin(S.dog, o); return !!AG; }
  if (AG) agTeardown(); // the frame is dropped without pkBack: the pack dog takes over through pkWith
  if (busy || S.sleeping) return false;
  let started = false;
  pkWith(d.id, () => { if (!agOpen()) return false; started = true; return true; });
  if (started) agBegin(S.dog, o);
  return started;
}
function agBegin(d, o) {
  const A = AG, f = grFloor('training'), low = !!o.puppy || agLowFor(d);
  A.tok++; A.t.forEach(clearTimeout); A.t = [];
  Object.assign(A, { d, id: d.id, low, forceLow: !!o.puppy, course: (low ? AG_LOW : AG_ORDER).slice(), i: 0, pts: [], ph: 'ready', f, hw: (isPhone() ? 0.17 : 0.12) + (low ? 0.05 : 0), t0: 0, res: null, pin: A.pin == null ? null : A.pin });
  document.documentElement.classList.add('ag-on'); document.documentElement.classList.toggle('ag-low', low); agBoardDraw(); // ag-low: the jump's bar on the ground (46_agility.css)
  agTray(); agApproach();
}
const agSpot = (id) => AG.f.spots.find((s) => String(s.id) === id);
const agProp = (id) => AG.f.props.find((p) => String(p.id) === id);
const agFree = (x, y) => (grFree(x, y) ? [x, y] : grSnap(x, y) || [x, y]);
// walk the dog to where the next obstacle starts, then wait for Go!
function agApproach() {
  const A = AG, id = A.course[A.i], s = agSpot(id), pr = agProp(id);
  const to = id === 'table' && pr && pr.box ? agFree(s.x, s.y + pr.box[3] + 14) : agFree((s.path && s.path[0] ? s.path[0] : [s.x, s.y])[0], (s.path && s.path[0] ? s.path[0] : [s.x, s.y])[1]);
  A.ph = 'ready'; A.tray = A.i; agTray();
  agSeq([{ to, gait: 'trot', allow: [id] }, { pose: 'idle', ms: 0 }], () => { if (!AG || AG.tok !== A.tok) return; A.t0 = performance.now(); A.ready = true; agLoopStart(); });
}
function agSeq(steps, done) {
  const A = AG, d = A.d, tok = A.tok;
  const next = () => {
    if (!AG || AG.tok !== tok) return; const s = steps.shift(); if (!s) { done(); return; }
    if (s.fn) s.fn();
    if (s.to) { try { grFocus(d, 3500); } catch (e) { /* none */ } rmTo(d, s.to[0], s.to[1], { gait: s.gait, act: s.act, done: next }); return; }
    if (s.pose) rmSet(d, { pose: poseReal(d.key, s.pose) ? s.pose : s.fb || 'idle' });
    A.t.push(setTimeout(next, s.ms || 0));
  };
  next();
}
// the marker (0..1): a triangle wave over AG_PERIOD, or A.pin (tests)
function agMark(now) { const A = AG; if (A.pin != null) return A.pin; const u = (((now - A.t0) / AG_PERIOD) % 2 + 2) % 2; return u < 1 ? u : 2 - u; }
function agQuality(p) { const A = AG, e = Math.abs(p - 0.5); return e <= A.hw ? 'perfect' : e <= A.hw * 2.2 ? 'good' : 'slow'; }
function agLoopStart() {
  const A = AG, tok = A.tok, i = A.i;
  const tick = (now) => {
    if (!AG || AG.tok !== tok || AG.i !== i || !AG.ready) return;
    const m = $('#agMark'); if (m) m.style.left = (agMark(now) * 100).toFixed(1) + '%';
    if (now - A.t0 > AG_WAIT) { agGo('slow'); return; }
    A.raf = requestAnimationFrame(tick);
  };
  A.raf = requestAnimationFrame(tick);
}
function agGo(force) {
  const A = AG; if (!A || !A.ready || A.ph !== 'ready') return;
  A.ready = false; cancelAnimationFrame(A.raf);
  const q = force || agQuality(agMark(performance.now())); A.pts.push(q === 'perfect' ? 2 : q === 'good' ? 1 : 0); A.ph = 'go'; A.last = q;
  const gb = $('#agGo'); if (gb) gb.setAttribute('aria-disabled', 'true'); const h = $('#agHint'); if (h) h.textContent = agQName(q);
  agGrade(q); SFX.boop(q === 'perfect' ? 960 : q === 'good' ? 780 : 560);
  const tok = A.tok; agSeq(agLeg(A.course[A.i], q), () => {
    if (!AG || AG.tok !== tok) return;
    A.i++; if (A.i >= A.course.length) agFinish(); else agApproach();
  });
}
// the obstacle itself as steps (the same shapes as 43_ground.js grSpotSteps)
function agLeg(id, q) {
  const A = AG, d = A.d, s = agSpot(id), pr = agProp(id), r = rmSt(d), gait = AG_SPEED[q], al = [id];
  const free = { fn: () => { r.grIn = null; r.lift = 0; grHide(d, false); rmPaint(d); }, ms: 0 };
  if (id === 'table') {
    const e = pr && pr.box ? agFree(s.x, s.y + pr.box[3] + 14) : [s.x, s.y + 30], up = { id, allow: al, hop: 1 }, dn = { id, allow: al, hop: -1 };
    return [{ fn: () => { r.grIn = id; }, ms: 0 }, { to: [s.x, s.y], gait: 'trot', act: up }, { pose: 'sit', fb: 'idle', ms: q === 'perfect' ? 900 : q === 'good' ? 1400 : 2000 }, { to: e, gait: 'trot', act: dn }, free, { pose: 'happy', fb: 'idle', ms: 500 }, { pose: 'idle', ms: 0 }];
  }
  const P = s.path && s.path.length > 1 ? s.path : [[s.x, s.y], [s.x + 100, s.y]], st = agFree(P[0][0], P[0][1]), end = P[P.length - 1], out = agFree(end[0], end[1]);
  const Act = { id, allow: al, path: [st].concat(P.slice(1, -1), [out]) }, b = pr ? pr.box : null;
  if (b && (id === 'jump' || id === 'tyre')) Act.lift = id === 'jump' && A.low ? [b[0] + AG_LOW_HOP[0], AG_LOW_HOP[1], AG_LOW_HOP[2]] : [b[0] + b[2] / 2, id === 'tyre' ? 42 : 70, Math.max(50, b[2] / 2 + 40)];
  if (b && id === 'tunnel') Act.hide = [b[0] + 16, b[0] + b[2] - 16];
  return [{ fn: () => { r.grIn = id; }, ms: 0 }, { to: out, gait, act: Act }, free, { pose: q === 'slow' ? 'idle' : 'happy', fb: 'idle', ms: 350 }, { pose: 'idle', ms: 0 }];
}
function agGrade(q) {
  const fx = $('#fx'); if (!fx || !AG) return; const p = rmPos(AG.d), t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  t.setAttribute('x', p.x.toFixed(0)); t.setAttribute('y', (p.y - 190 * (p.sc || 1)).toFixed(0)); t.setAttribute('text-anchor', 'middle'); t.setAttribute('class', 'ag-grade ' + q); t.textContent = agQName(q); fx.appendChild(t); setTimeout(() => t.remove(), 1400);
}

/* ---------------- the end of a run: rosettes and rewards ---------------- */
function agFinish() {
  const A = AG, d = A.d, n = A.course.length, share = A.pts.reduce((a, b) => a + b, 0) / (2 * n), stars = share >= 0.75 ? 3 : share >= 0.35 ? 2 : 1, today = localISO();
  agDay(); const by = S.ag.by, lines = [];
  const bondFirst = by[d.id] !== today; if (bondFirst) { by[d.id] = today; const b = withDog(d, () => addBond(10)); lines.push(tt('agility.r_bond', '+{n} Bond.', { n: b })); }
  const coinRun = S.ag.runs < 2; S.ag.runs++;
  let coins = 0; if (coinRun) coins = Math.min(AG_COINS[stars], agCoinsLeft());
  if (coins > 0) { addCoins(coins, { raw: true }); S.ag.coins = (S.ag.coins || 0) + coins; lines.push(tt('agility.r_coins', '+{n, plural, one {# coin} other {# coins}}.', { n: coins })); }
  else if (coinRun && agCoinsLeft() <= 0) lines.push(tt('agility.r_cap', 'Agility coins are done for today. The fun is free.'));
  else if (!coinRun) lines.push(tt('agility.r_nocoin', 'Coins are for the first two runs of the day. Rosettes are always free.'));
  withDog(d, () => addStat('energy', -10)); lines.push(tt('agility.r_energy', '-10 Energy.'));
  const was = agBest(d.id); if (stars > was) { S.ag.best[d.id] = stars; if (was > 0) lines.push(tt('agility.r_best', 'A new best!')); }
  markDirty(); updateHUD(); SFX.fanfare();
  A.res = { stars, share, coins, bond: bondFirst, lines }; A.ph = 'done'; A.t.forEach(clearTimeout);
  rmSet(d, { pose: 'happy' }); agBoardDraw();
  trackAct('agility', { rosettes: stars, low: A.low, name: d.name });
  agTray();
}
function agEndRun() { if (!AG) return; const A = AG; A.tok++; A.t.forEach(clearTimeout); A.t = []; cancelAnimationFrame(A.raf); A.ready = false; if (A.d) { const r = rmSt(A.d); r.tw = null; r.lift = 0; r.grIn = null; grHide(A.d, false); } }
function agTeardown() { if (!AG) return; agEndRun(); AG = null; document.documentElement.classList.remove('ag-on', 'ag-low'); try { rmResume('agility'); } catch (e) { /* none */ } busy = false; }
function agStop(quiet) {
  if (!AG) return; agTeardown();
  if (typeof pkBack === 'function') pkBack();
  if (!quiet && rmScene()) { setChrome(true, true); renderDog(dogPoseNow(), 'right', true); if (S.sleeping) sleepTray(); else dockIdle(); agPlaceBtn(); agBoardDraw(); updateHUD(); }
}

/* ---- tests: window.__paw.ag ---- */
function agExpose() {
  if (!window.__paw) return;
  window.__paw.ag = {
    on: () => agOn(), start: (id, o) => agStart(dogById(id) || D(), o || {}), open: () => agOpen(), stop: () => agStop(), best: (id) => agBest(id), left: () => agCoinsLeft(), cap: AG_COIN_DAY, coins: AG_COINS.slice(),
    go: (q) => agGo(q), pin: (v) => { if (AG) AG.pin = v; }, tray: () => agTray(),
    get state() { return AG ? { ph: AG.ph, i: AG.i, n: AG.course ? AG.course.length : 0, course: AG.course ? AG.course.slice() : [], low: !!AG.low, pts: AG.pts ? AG.pts.slice() : [], hw: AG.hw, ready: !!AG.ready, res: AG.res, id: AG.id, last: AG.last, pin: AG.pin } : null; },
    mark: () => (AG && AG.ready ? agMark(performance.now()) : null), running: () => !!AG, lines: AG_LINES, low: (id) => agLowFor(dogById(id) || D()), bonus: () => agTrickBonus(), lesson: () => agLesson(), lesson: () => agLesson()
  };
}
on('game:ready', () => setTimeout(agExpose, 0));
setTimeout(agExpose, 0);
