/* ======================= v2.15 AROUND TOWN: the Splash Pool (V215.md section 6.2, ACTIVITIES lane, tag pl, test hook __paw.pl) =======================
   Owner: the ACTIVITIES lane (with css/47_pool.css).
   Place: PLACES.pool (Bond 2, only while mpOn()). Save: S.pool { day: { dogId: localISO of the last paddle }, vest, seen } (v215Fields in 00_core.js).
   Rules: shallow, a ramp out, the free Doggy Life Vest on the first visit (a CLOTHES row, reward: true so no shop lists it, S.pool.vest), one paddle a day per dog,
   flat-faced breeds (GR_FLAT in 43_ground.js) paddle on the step only, float fetch is v2.10 ball play with o.water (38_ball.js, its coins stay inside BL_COIN_DAY),
   the sprinkler gives Happiness only, the pool itself pays no coins. The Winter Dome is art (world G), nothing here depends on the season.
   The paddle: ramp up, a lap in the water (the dog sits a little low and leaves ripples), ramp down, a shake (+15 Happiness, Cleanliness to at least 60, the shake pose,
   a wet-dog line). The vest is worn (d.outfit.body) only in the water and put back after. The dog art does not draw it yet: an outfit name the art does not know is simply
   not drawn (checked in the pool tests), so nothing is guarded here.
   The roaming dogs do not paddle on their own: the water acts in GR_ACTS stay out of the idle roam (the once a day paddle belongs to the player), they are registered
   with weight 0 so the engine knows them (43_ground.js drops spots tagged water that have no handler, this handler says "not on your own").
   Strings: tt('pool.<what>', 'English'). The arrival lines are the PL_LINES table (data.pl_lines.<breed>), merged into PLACE_LINES[breed].pool.
   API
     plOn()             the pool activities show here now (mpOn(), the Splash Pool scene with its spots)
     plPaddle(d)        dog d paddles (once a day, a picked pack dog through pkWith). False when it cannot start
     plPaddled(d)       dog d has paddled today
     plVest()           the Doggy Life Vest has been given
     plFloat(toy)       float fetch with a fetch toy (blStart(toy, { water: true }))
     plSprinkle(d)      dog d runs through the sprinkler (Happiness only)
     plVestOn(dogs) / plVestOff()   the vest on for a group in the water (ball play calls these with o.water) and back */

const PL_FLAT = GR_FLAT.slice(); // flat-faced: the step only
const PL_VEST = 'Doggy Life Vest';
const PL_HAPPY = 15, PL_CLEAN = 60, PL_SPRINK_HAPPY = 5;
const PL_RAMP = [[1150, 518], [1122, 504], [1072, 476], [1010, 456]]; // world G pool: the wooden ramp, foot to top (the top is at the water)
const PL_LAP = [[960, 468], [860, 454], [740, 464], [640, 456], [740, 486], [880, 490], [990, 466]]; // a lap of the shallows
const PL_STEPW = [[322, 470], [372, 464], [420, 462]]; // the wide step (flat-faced dogs stay here)
const PL_SPR = [[1330, 556], [1404, 560], [1480, 556]]; // through the sprinkler spray
const PL_SPRAY_AT = [1404, 524];
let PL = null; // the tray / run in progress, or null
const PL_WORN = {}; // dogId -> the body outfit it had before the vest (in the water only)

function plOn() {
  if (typeof mpOn !== 'function' || !mpOn() || !S || S.place !== 'pool' || cur.mode !== 'yard') return false;
  if (!grOn('pool')) return false;
  const f = grFloor('pool'); return !!f && ['paddle', 'ramp', 'sprinkler'].every((k) => f.spots.some((s) => String(s.id) === k));
}
function plRunning() { return !!PL; }
function plDay() { if (!S.pool || typeof S.pool !== 'object') S.pool = { day: {}, vest: false, seen: false }; if (!S.pool.day || typeof S.pool.day !== 'object') S.pool.day = {}; return S.pool; }
function plPaddled(d) { return !!(S && S.pool && d && S.pool.day && S.pool.day[d.id] === localISO()); }
function plVest() { return !!(S && S.pool && S.pool.vest); }
function plFlat(d) { return !!d && (PL_FLAT.includes(d.key) || (d.mix && d.mix.head && PL_FLAT.includes(d.mix.head))); }

/* ---------------- the arrival lines (35 breeds) ---------------- */
const PL_LINES = {
  shiba: 'Water? I will inspect it from the step. With dignity.',
  corgi: 'Short legs, big splash! The ramp and I are friends.',
  golden: 'A pool, just for us! I am going in, gently, in my vest.',
  dachs: 'A long dog in a small pool. I make a very good boat.',
  husky: 'Cold water, warm sun. AWOO, I will make a wave.',
  mutt: 'I do not know if I can swim. The vest says I can.',
  chihuahua: 'The pool is the size of an ocean. I will wade in up to my knees.',
  pug: 'The step is my favourite part. Paws only, then a nap.',
  greyhound: 'A long, calm paddle. Then a long, calm lie in the sun.',
  beagle: 'Sun cream, wet tiles, so many smells to read!',
  poodle: 'A graceful paddle, a tidy climb out and a perfect shake.',
  collie: 'I will herd the ring float into a neat circle.',
  samoyed: 'Splash! My smile and my fluff are getting soaked.',
  frenchie: 'Bat ears up, belly dry. I will stay on the step.',
  akita: 'Calm water, calm dog. I will paddle with honour.',
  spitz: 'A tiny wave, a tiny paddle and a very big shake.',
  pom: 'A fluffy ball floats very well. I checked.',
  afghan: 'My hair will float behind me like a silk scarf.',
  dane: 'I am too tall for a deep end. There is no deep end. Perfect.',
  mastiff: 'Slow ramp, slow paddle, slow and happy splash.',
  gsd: 'Ramp, paddle, return. A clear plan makes a good swim.',
  dobie: 'A sleek swim and a quick shake. Stand back for the spray.',
  corso: 'I will guard the pool first. Then I will swim in it.',
  pitbull: 'Wiggle, splash, wiggle, splash! Come in, the water is great!',
  minpin: 'A little leap, a little paddle and a proud prance out.',
  lab: 'WATER! My favourite thing! Is there a ball in it? Please?',
  malamute: 'Big paws make big ripples. I will take the ramp first.',
  chow: 'I will wade in my own way. Mind the fluff.',
  stdpoodle: 'Long legs, neat strokes. I was made for pool days.',
  schnauzer: 'Whiskers first! The water never saw me coming.',
  westie: 'Small, white and soaking wet. Worth every drop.',
  yorkie: 'I may be tiny, but I rule this pool and its parasol.',
  bichon: 'Splash, bounce, splash! A fluffy cloud in the water.',
  maltese: 'A silky paddle and a tiny, graceful shake.',
  shihtzu: 'The step is lovely. I will paddle my toes, then relax.'
};
// a getter, so the line follows the player's language (03_yard.js placeAmbient reads PLACE_LINES[breed].pool at run time)
Object.keys(PL_LINES).forEach((b) => { if (PLACE_LINES[b]) Object.defineProperty(PLACE_LINES[b], 'pool', { get: () => tdata('pl_lines.' + b, PL_LINES[b]), enumerable: true, configurable: true }); });

// Gerald's guide card (25_guide.js): [key, icon, title, text], only while mpOn()
function plLesson() { return typeof mpOn === 'function' && mpOn() ? ['pool', 'bath', tt('pool.lesson_title', 'Splash Pool'), tt('pool.lesson_text', 'The Splash Pool has a ramp, a shallow paddle and a sprinkler. Your dog wears a free life vest in the water, and flat-faced dogs paddle on the step. Not every dog loves water, so let them wade in at their own pace.')] : null; }

/* ---------------- the vest: worn in the water only ---------------- */
function plVestGive() {
  const P = plDay(); if (P.vest && owns('clothes', PL_VEST)) return false;
  P.vest = true; if (!owns('clothes', PL_VEST)) S.inv.clothes.push(PL_VEST); markDirty(); return true;
}
function plVestOn(dogs) {
  if (!plVest()) return; (dogs || []).forEach((d) => {
    if (!d || !d.outfit || d.id in PL_WORN || d.outfit.body === PL_VEST) return;
    PL_WORN[d.id] = d.outfit.body || null; d.outfit.body = PL_VEST; try { rmPaint(d); } catch (e) { /* not in a scene */ }
  });
}
function plVestOff() {
  Object.keys(PL_WORN).forEach((id) => { const d = dogById(id); if (d && d.outfit && d.outfit.body === PL_VEST) { d.outfit.body = PL_WORN[id]; try { if (rmScene()) { if (d === D()) renderDog(dogPoseNow(), rmSt(d).face, true); else rmPaint(d); } } catch (e) { /* none */ } } delete PL_WORN[id]; });
}
// ball play in the water (38_ball.js o.water) puts the vest back and brings the place button back
function plAfterBall() { plVestOff(); plPlaceBtn(); }

/* ---------------- the place button and the first-visit note ---------------- */
function plPlaceBtn() {
  const pb = $('#placeBtns'); if (!pb) return; pb.querySelectorAll('[data-pl]').forEach((b) => b.remove());
  if (!plOn() || PL) return;
  const html = `<button class="btn yes" data-pl="open">${esc(tt('pool.btn', 'Splash time'))}</button>`, home = pb.querySelector('[data-pb="yard"]');
  if (home) home.insertAdjacentHTML('beforebegin', html); else pb.insertAdjacentHTML('beforeend', html);
  pb.querySelector('[data-pl]').onclick = () => plOpen();
}
function plArrive() {
  if (!plOn()) return; plPlaceBtn(); const P = plDay();
  if (!P.seen) { P.seen = true; markDirty(); setTimeout(() => { if (S && S.place === 'pool') toast(tt('pool.lesson', 'Not every dog loves water, so let them wade in at their own pace. A life vest and a ramp to climb out make every swim a safe one.'), 'gold'); }, 900); }
  if (!P.vest || !owns('clothes', PL_VEST)) { plVestGive(); setTimeout(() => { if (S && S.place === 'pool') toast(tt('pool.vest_given', 'Gerald hands over a Doggy Life Vest. It is free and it is yours to keep.'), 'good'); }, 2600); }
}
on('yard:enter', plArrive); on('scene:redraw', () => { if (plOn() && !PL && !BL && !$('#placeBtns [data-pl]')) plPlaceBtn(); });

/* ---------------- roaming: water acts are the player's, not the idle roam's ---------------- */
['paddle', 'swim', 'ramp'].forEach((a) => { if (!GR_ACTS[a]) GR_ACTS[a] = { w: () => 0, steps: () => null }; });

/* ---------------- the tray ---------------- */
function plWho() { const lead = S.dog; return [lead].concat((S.dogs || []).filter((d) => d !== lead && !(typeof hmMumIn === 'function' && hmMumIn(d)))); }
function plBlock(d, o) {
  if (!d) return 'none';
  if (d.sleeping) return tt('pool.asleep', '{name} is asleep. The pool can wait.', { name: d.name });
  if (typeof isNursing === 'function' && isNursing(d)) return tt('pool.nursing', '{name} is nursing the pups. No pool for {sex, select, female {her} other {him}} right now.', { name: d.name, sex: d.sex === 'female' ? 'female' : 'male' });
  if (ageMonths(d) < 3) return tt('pool.too_young', '{name} is too little for the water. Watching is fun too.', { name: d.name });
  if (!(o && o.any) && plPaddled(d)) return tt('pool.done_today', '{name} has paddled today. Splashing about is for tomorrow, and the sprinkler is free.', { name: d.name });
  return '';
}
function plOpen() {
  if (!plOn() || PL || busy || S.sleeping) return false;
  popDown(); clearCurl(); hideBubble(); toasts.innerHTML = '';
  PL = { ph: 'pick', pick: S.dog.id, t: [], tok: Date.now() };
  setChrome(true, false); document.documentElement.classList.add('pl-on'); try { rmPause('pool'); } catch (e) { /* none */ }
  onCleanup(() => { if (PL) plStop(true); });
  busy = true; plTray(); return true;
}
function plTray() {
  if (!PL) return; const A = PL;
  const done = `<button class="btn pl-done" id="plDone" aria-label="${esc(tt('pool.leave', 'Leave the pool'))}">${esc(tt('pool.done', 'Done'))}</button>`;
  if (A.ph === 'pick') {
    const dogs = plWho(), pickDog = dogs.find((d) => d.id === A.pick) || dogs[0], blk = plBlock(pickDog), fts = FETCH_TOYS.filter((t) => owns('toys', t));
    dock.innerHTML = `<div class="tray mini pl-tray" data-ph="pick"><div class="tray-h"><h3>${esc(tt('pool.title', 'Splash Pool'))}</h3>${done}</div>
      <div class="tray-body"><p class="small pl-hint" id="plHint">${esc(blk || (plFlat(pickDog) ? tt('pool.step_hint', '{name} paddles on the wide step. Short noses breathe best in the shallows.', { name: pickDog.name }) : tt('pool.pick_hint', 'A ramp, a shallow paddle and a shake. Everyone wears a free life vest in the water.')))}</p>
      <div class="pl-dogs" role="group" aria-label="${esc(tt('pool.who', 'Who goes in?'))}">${dogs.map((d) => `<button class="btn pl-dog${d.id === A.pick ? ' sel' : ''}" data-id="${esc(d.id)}" aria-pressed="${d.id === A.pick}"><span class="pl-dn">${esc(d.name)}</span>${plPaddled(d) ? `<span class="pl-chk" aria-label="${esc(tt('pool.paddled', 'Paddled today'))}">&#10003;</span>` : ''}</button>`).join('')}</div>
      <button class="btn yes pl-act" id="plPaddle" ${blk ? 'aria-disabled="true"' : ''}>${esc(tt('pool.paddle', 'Paddle'))}</button>
      <button class="btn pl-act" id="plSprink">${esc(tt('pool.sprinkler', 'Run through the sprinkler'))}</button>
      <div class="pl-float"><b class="small">${esc(tt('pool.float', 'Float fetch'))}</b><div class="pl-toys">${fts.length ? fts.map((t) => `<button class="btn pl-toy" data-toy="${esc(t)}">${esc(blToyName(t))}</button>`).join('') : `<span class="small">${esc(tt('pool.no_toy', 'No ball toy. Kibble Corner sells balls.'))}</span>`}</div></div></div></div>`;
    $('#plDone').onclick = () => { SFX.boop(700); plStop(); };
    dock.querySelectorAll('.pl-dog').forEach((b) => { b.onclick = () => { A.pick = b.dataset.id; SFX.boop(620); plTray(); }; });
    $('#plPaddle').onclick = () => { const d = dogById(A.pick), why = plBlock(d); if (why) { nope(why); return; } SFX.boop(840); plPaddle(d); };
    $('#plSprink').onclick = () => { const d = dogById(A.pick), why = plBlock(d, { any: true }); if (why) { nope(why); return; } SFX.boop(780); plSprinkle(d); };
    dock.querySelectorAll('.pl-toy').forEach((b) => { b.onclick = () => { SFX.boop(700); plFloat(b.dataset.toy); }; });
  } else if (A.ph === 'run') {
    dock.innerHTML = `<div class="tray mini pl-tray" data-ph="run"><div class="tray-h"><h3>${esc(A.title || tt('pool.title', 'Splash Pool'))}</h3>${done}</div><div class="tray-body"><p class="small pl-hint" id="plHint">${esc(A.hint || '')}</p></div></div>`;
    $('#plDone').onclick = () => { SFX.boop(700); plStop(); };
  } else if (A.ph === 'done') {
    const R = A.res;
    dock.innerHTML = `<div class="tray mini pl-tray" data-ph="done"><div class="tray-h"><h3>${esc(R.title)}</h3>${done}</div><div class="tray-body"><p class="small pl-hint" id="plHint">${esc(R.lines.join(' '))}</p>
      <button class="btn yes pl-act" id="plBack">${esc(tt('pool.back', 'Back to the pool'))}</button></div></div>`;
    $('#plDone').onclick = () => { SFX.boop(700); plStop(); };
    $('#plBack').onclick = () => { SFX.boop(840); plEndRun(); const dd = A.d; plBackHome(); A.ph = 'pick'; A.pick = dd ? dd.id : A.pick; plTray(); };
  }
}

/* ---------------- the sequence runner (steps: { to, gait, act, pose, fb, ms, fn }) ---------------- */
function plSeq(steps, done) {
  const A = PL, d = A.d, tok = A.tok;
  const next = () => {
    if (!PL || PL.tok !== tok) return; const s = steps.shift(); if (!s) { done(); return; }
    if (s.fn) s.fn();
    if (s.to) { try { grFocus(d, 3500); } catch (e) { /* none */ } rmTo(d, s.to[0], s.to[1], { gait: s.gait, act: s.act, done: next }); return; }
    if (s.pose) rmSet(d, { pose: poseReal(d.key, s.pose) ? s.pose : s.fb || 'idle' });
    A.t.push(setTimeout(next, s.ms || 0));
  };
  next();
}
const plFree = (x, y) => (grFree(x, y) ? [x, y] : grSnap(x, y) || [x, y]);
const plWater = (P) => ({ id: 'pool', allow: ['pool'], path: P.map((p) => p.slice()) }); // an act that may cross the pool's box along path P

// start a run for dog d: a picked pack dog leads through pkWith (pkBack gives the old leader back when the tray closes)
function plBegin(d, kind) {
  if (!d || !plOn()) return false;
  if (PL && PL.ph !== 'pick' && PL.ph !== 'done') return false;
  if (d.id === S.activeId) { if (!PL && !plOpen()) return false; plGo(S.dog, kind); return !!PL; }
  if (PL) plTeardown(); // the frame is dropped without pkBack: the pack dog takes over through pkWith
  if (busy || S.sleeping) return false;
  let started = false;
  pkWith(d.id, () => { if (!plOpen()) return false; started = true; return true; });
  if (started) plGo(S.dog, kind);
  return started;
}
function plPaddle(d) {
  d = d || D(); if (!plOn() || !d || plBlock(d)) return false;
  return plBegin(d, 'paddle');
}
function plSprinkle(d) {
  d = d || D(); if (!plOn() || !d || plBlock(d, { any: true })) return false;
  return plBegin(d, 'sprinkle');
}
function plGo(d, kind) {
  const A = PL; A.tok++; A.t.forEach(clearTimeout); A.t = [];
  Object.assign(A, { d, id: d.id, kind, ph: 'run', res: null, fx: null });
  A.title = kind === 'paddle' ? tt('pool.run_title', '{name} is paddling', { name: d.name }) : tt('pool.sprink_title', '{name} is in the sprinkler', { name: d.name });
  A.hint = kind === 'paddle' ? (plFlat(d) ? tt('pool.run_step', 'Paws in on the wide step. No deep water for short noses.') : tt('pool.run_hint', 'Up the ramp, a paddle, and out again.')) : tt('pool.sprink_hint', 'Splish splash! The sprinkler is free.');
  plTray();
  if (kind === 'paddle') plPaddleRun(d); else plSprinkRun(d);
}
function plPaddleRun(d) {
  const A = PL, r = rmSt(d), flat = plFlat(d);
  const sink = (v) => ({ fn: () => { const rr = rmSt(d); rr.lift = -v * rmK(rr); rmPaint(d); plRipples(true); }, ms: 0 });
  const free = { fn: () => { r.lift = 0; plRipples(false); rmPaint(d); }, ms: 0 };
  const shake = { fn: () => plShake(d), pose: 'shake', fb: 'happy', ms: 1700 };
  let steps;
  if (flat) { // the step only: in to the paws, a sit, and out again
    const inP = PL_STEPW, outP = PL_STEPW.slice().reverse();
    steps = [{ fn: () => plVestOn([d]), ms: 0 }, { to: plFree(inP[0][0], inP[0][1]), gait: 'trot' }, sink(4), { to: inP[inP.length - 1], gait: 'stroll', act: plWater(inP) }, { pose: 'sit', fb: 'idle', ms: 1500 }, { to: outP[outP.length - 1], gait: 'stroll', act: plWater(outP) }, free, shake];
  } else {
    const up = PL_RAMP.concat([PL_LAP[0]]), lap = PL_LAP, down = PL_RAMP.slice().reverse().map((p) => p.slice());
    steps = [{ fn: () => plVestOn([d]), ms: 0 }, { to: plFree(PL_RAMP[0][0], PL_RAMP[0][1]), gait: 'trot' }, { to: up[up.length - 1], gait: 'stroll', act: plWater(up) }, sink(10), { to: lap[lap.length - 1], gait: 'stroll', act: plWater(lap) },
      { to: down[down.length - 1], gait: 'stroll', act: plWater(lap.slice(-1).concat(down)) }, free, shake];
  }
  steps.push({ pose: 'happy', fb: 'idle', ms: 500 });
  plSeq(steps, () => plFinish('paddle'));
}
function plSprinkRun(d) {
  const r = rmSt(d), P = PL_SPR, steps = [{ to: plFree(P[0][0], P[0][1]), gait: 'trot' }, { fn: () => plSpray(2600), ms: 0 }, { to: P[P.length - 1], gait: 'run', act: { id: 'sprinkler', allow: null, path: P.map((p) => p.slice()) } }, { fn: () => { r.lift = 0; }, pose: 'shake', fb: 'happy', ms: 1300 }, { pose: 'happy', fb: 'idle', ms: 500 }];
  plSeq(steps, () => plFinish('sprinkle'));
}
// the rewards: at the shake. Happiness and Cleanliness, never coins
function plShake(d) {
  try { SFX.shake(); } catch (e) { /* none */ }
  const h = rmHead(d), K = PL; if (h) fxText(tt('pool.splsh', 'splsh!'), h.x, h.y - 30, '#86B3EA', 30);
  const wet = plFlat(d) ? [tt('pool.wet_flat_1', 'Only my paws got wet. Best swim ever.'), tt('pool.wet_flat_2', 'The step is my pool. I have decided.')] : [tt('pool.wet_1', 'I am a very wet dog now.'), tt('pool.wet_2', 'Shake, shake, shake! You are welcome.'), tt('pool.wet_3', 'That was a swim! Did you see my paddle?'), tt('pool.wet_4', 'Everything is damp and I love it.')];
  if (h && K && !S.sleeping) say(PICK(wet), h.x, h.y, 2800);
}
function plFinish(kind) {
  const A = PL; if (!A) return; const d = A.d, lines = [];
  plVestOff();
  if (kind === 'paddle') {
    plDay().day[d.id] = localISO();
    const hp = withDog(d, () => { const was = S.stats.happy; addStat('happy', PL_HAPPY); return Math.round(S.stats.happy - was); });
    withDog(d, () => { if (S.stats.clean < PL_CLEAN) { S.stats.clean = PL_CLEAN; } });
    lines.push(tt('pool.r_happy', '+{n} Happiness.', { n: Math.max(0, hp) }), tt('pool.r_clean', 'Squeaky clean after the rinse.'));
    trackAct('paddle', { name: d.name, step: plFlat(d) });
  } else {
    const hp = withDog(d, () => { const was = S.stats.happy; addStat('happy', PL_SPRINK_HAPPY); return Math.round(S.stats.happy - was); });
    lines.push(tt('pool.r_happy', '+{n} Happiness.', { n: Math.max(0, hp) }), tt('pool.r_free', 'The sprinkler is free and so is the fun.'));
    trackAct('sprinkle', { name: d.name });
  }
  markDirty(); updateHUD(); try { SFX.fanfare(); } catch (e) { /* none */ }
  A.res = { title: kind === 'paddle' ? tt('pool.done_title', '{name} had a lovely paddle!', { name: d.name }) : tt('pool.sprink_done', '{name} had a splash!', { name: d.name }), lines }; A.ph = 'done'; A.t.forEach(clearTimeout);
  rmSet(d, { pose: 'happy' }); plTray();
}

/* ---------------- float fetch: v2.10 ball play with a floating toy ---------------- */
function plFloat(toy) {
  if (!plOn() || !PL || PL.ph === 'run') return false;
  const lead = S.dog; if (lead.sleeping || S.sleeping) { nope(tt('pool.asleep', '{name} is asleep. The pool can wait.', { name: lead.name })); return false; }
  if ((S.stats.energy || 0) < 10) { nope(tt('pool.tired', '{name} is too tired to play ball. A nap would help.', { name: lead.name })); return false; }
  plTeardown(); if (typeof pkBack === 'function') pkBack(); // the tray closes first: ball play owns the screen
  const ok = blStart(toy, { water: true });
  if (!ok) { plPlaceBtn(); try { if (rmScene()) { setChrome(true, true); dockIdle(); } } catch (e) { /* none */ } }
  return ok;
}

/* ---------------- effects: ripples under a dog in the water, the spray ---------------- */
function plRipples(on) {
  const A = PL; if (!A) return; if (A.rip) { clearInterval(A.rip); A.rip = null; }
  if (!on) return;
  const ring = () => {
    const fx = $('#fx'); if (!fx || !PL || !PL.d) return; const p = rmPos(PL.d), sc = p.sc || 1, e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    e.setAttribute('cx', p.x.toFixed(0)); e.setAttribute('cy', (p.y + 4).toFixed(0)); e.setAttribute('rx', (46 * sc).toFixed(0)); e.setAttribute('ry', (11 * sc).toFixed(0)); e.setAttribute('class', 'pl-rip'); fx.appendChild(e); setTimeout(() => e.remove(), 1500);
  };
  ring(); A.rip = setInterval(ring, 420); // one at once, then every 420 ms while in the water
}
function plSpray(ms) {
  const fx = $('#fx'); if (!fx) return; const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'pl-spray'); g.setAttribute('aria-hidden', 'true');
  let h = ''; for (let i = 0; i < 9; i++) { const a = -Math.PI * (0.12 + 0.76 * i / 8), dx = Math.cos(a) * (50 + (i % 3) * 14), dy = Math.sin(a) * (60 + (i % 2) * 22); h += `<circle cx="${PL_SPRAY_AT[0]}" cy="${PL_SPRAY_AT[1]}" r="${3 + (i % 3)}" fill="#BFE5F5" stroke="#5B3D32" stroke-width="1" style="--dx:${dx.toFixed(0)}px;--dy:${dy.toFixed(0)}px;animation-delay:${(i * 0.12).toFixed(2)}s"/>`; }
  g.innerHTML = h; fx.appendChild(g); setTimeout(() => g.remove(), ms || 2600);
}

/* ---------------- ending ---------------- */
function plEndRun() { if (!PL) return; const A = PL; A.tok++; A.t.forEach(clearTimeout); A.t = []; plRipples(false); if (A.d) { const r = rmSt(A.d); r.tw = null; r.q = null; r.lift = 0; r.grIn = null; try { rmPaint(A.d); } catch (e) { /* none */ } } plVestOff(); }
function plBackHome() { /* the dog stays where it ended; nothing to reset */ }
function plTeardown() { if (!PL) return; plEndRun(); PL = null; document.documentElement.classList.remove('pl-on'); try { rmResume('pool'); } catch (e) { /* none */ } busy = false; }
function plStop(quiet) {
  if (!PL) return; plTeardown();
  if (typeof pkBack === 'function') pkBack();
  if (!quiet && rmScene()) { setChrome(true, true); renderDog(dogPoseNow(), 'right', true); if (S.sleeping) sleepTray(); else dockIdle(); plPlaceBtn(); updateHUD(); }
}

/* ---- tests: window.__paw.pl ---- */
function plExpose() {
  if (!window.__paw) return;
  window.__paw.pl = {
    on: () => plOn(), paddle: (id) => plPaddle(dogById(id) || D()), paddled: (id) => plPaddled(dogById(id) || D()), vest: () => plVest(), open: () => plOpen(), stop: () => plStop(), running: () => !!PL,
    vestRow: () => CLOTHES.find((c) => c.n === PL_VEST), inShop: () => CLOTHES.filter((c) => !c.reward && !c.fest).some((c) => c.n === PL_VEST), today: () => localISO(),
    sprinkle: (id) => plSprinkle(dogById(id) || D()), float: (toy) => plFloat(toy || 'Tennis Ball'), flat: (id) => plFlat(dogById(id) || D()), worn: () => Object.assign({}, PL_WORN), lines: PL_LINES, lesson: () => plLesson(),
    get state() { return PL ? { ph: PL.ph, kind: PL.kind, id: PL.id, pick: PL.pick, res: PL.res, title: PL.title } : null; }, flatList: PL_FLAT.slice(), happy: PL_HAPPY, clean: PL_CLEAN
  };
}
on('game:ready', () => setTimeout(plExpose, 0));
setTimeout(plExpose, 0);
