/* ======================= v1.6b: dog voices + natural idle behaviour ======================= */
/* ---- voices ---- */
const DOG_SIZE = { shiba: 'small', corgi: 'small', golden: 'large', dachs: 'small', husky: 'large', mutt: 'medium', chihuahua: 'small', pug: 'small', greyhound: 'large', beagle: 'medium' };
/* v1.7: how each breed answers another dog's bark (greyhounds rarely bark, but roo along with a howl) */
function echoBark(o, kind) {
  const howly = kind === 'howl' || kind === 'talk';
  const p = o.key === 'greyhound' ? (howly ? 0.6 : 0.08) : o.key === 'chihuahua' ? 0.55 : o.key === 'beagle' && howly ? 0.6 : 0.3;
  if (Math.random() >= p) return null;
  if (o.key === 'husky') return 'talk'; if (o.key === 'greyhound') return howly ? 'howl' : 'woof'; if (o.key === 'beagle' && howly) return 'howl'; if (o.key === 'chihuahua') return 'alert';
  return PICK(['woof', 'alert']);
}
const CHI_ALERT = ['INTRUDER! (A leaf.)', 'I heard a noise. It was me. Still suspicious.', 'The mail carrier exists. Unacceptable.', 'Something moved! I barked at the wind. The wind left.', 'Security alert! Everything is fine. Stay alert.'];
const BODY_SOUNDS = ['snore', 'pant', 'yawn', 'sneeze', 'huff'];
const barkCD = {}; window.__barkLog = window.__barkLog || [];
const barkMode = () => prefs.bark || 'normal';
function voiceOf(d) { const v = { breed: d.key, pitch: +(0.85 + (hashId(d.id) % 1000) / 1000 * 0.3).toFixed(3), size: DOG_SIZE[d.key] || 'medium' }; if (lifeStage(ageMonths(d)) === 'puppy') v.age = 'puppy'; /* v2: AUDIO adds puppy voices */ return v; }
function playBark(voice, kind, opts) {
  const A = window.PawAudio;
  if (A && typeof A.bark === 'function') { try { A.bark(voice, kind, opts || {}); } catch (e) { /* never throws */ } return; }
  if (BODY_SOUNDS.includes(kind) || kind === 'whine' || kind === 'growl-play') return; // the old synth has no such sounds
  if (kind === 'howl' || kind === 'talk') SFX.howl(); else SFX.bark(BARK[voice.breed] || 1);
}
/* opts: { player: true (no cooldown), ambient: true (off in Fewer mode), volume, distance, contagion } */
function barkDog(d, kind, opts = {}) {
  if (!d || barkMode() === 'off') return false;
  if (opts.ambient && barkMode() === 'fewer') return false;
  const body = BODY_SOUNDS.includes(kind), now = performance.now(), key = d.id + (body ? '|b' : '|v');
  const cd = (body ? 6000 : 25000) * (barkMode() === 'fewer' ? 2 : 1);
  if (!opts.player && barkCD[key] && now - barkCD[key] < cd) return false;
  barkCD[key] = now;
  playBark(voiceOf(d), kind, { volume: opts.volume ?? (d.id === S.activeId ? 1 : 0.8), distance: opts.distance || 0 });
  window.__barkLog.push({ dog: d.name, id: d.id, kind, t: Math.round(now) }); if (window.__barkLog.length > 300) window.__barkLog.shift();
  if (!body && !opts.contagion && kind !== 'whine') {
    S.dogs.filter((o) => o.id !== d.id).forEach((o) => { const k2 = echoBark(o, kind); if (k2) setTimeout(() => { if (S && cur.mode !== 'title') barkDog(o, k2, { contagion: true }); }, RINT(500, 1200)); });
    if (['park', 'dogpark', 'square'].includes(S.place) && Math.random() < 0.25) setTimeout(() => npcBark('woof', 0.7), RINT(700, 1500));
  }
  return true;
}
function alertBark() { const d = D(); if (!d || S.sleeping) return false; const ok = barkDog(d, 'alert', { ambient: true }); if (ok && cur.mode === 'yard' && !busy) { idleStop(); setTemp('idle', 1400); const fx = $('#dogFx'); if (fx) { fx.classList.add('tk-look'); setTimeout(() => fx.classList.remove('tk-look'), 1400); } } return ok; }
function npcBark(kind, distance) { if (barkMode() !== 'normal') return; const k = PICK(['shiba', 'corgi', 'golden', 'dachs', 'mutt', 'chihuahua', 'pug', 'beagle']); playBark({ breed: k, pitch: +(0.85 + Math.random() * 0.3).toFixed(3), size: DOG_SIZE[k] }, kind, { distance, volume: 0.6 }); window.__barkLog.push({ dog: 'npc', kind, t: Math.round(performance.now()), distance }); }
const SPEAK_KIND = { husky: 'talk', greyhound: 'talk', beagle: 'howl', chihuahua: 'alert' };
const speakKind = (d) => SPEAK_KIND[d.key] || 'woof';
const GREET_KIND = { greyhound: 'talk', beagle: 'howl', pug: 'huff' };
function greetBark(d = D()) {
  if (!d) return; barkDog(d, GREET_KIND[d.key] || 'play', {}); setTimeout(() => barkDog(d, 'whine', { player: true }), 700);
  if (cur.mode === 'yard' && d.id === S.activeId && !busy) { setTemp('happy', 1500); const gl = breedLine(GREET_LINES, d); if (gl) setTimeout(() => { if (cur.mode === 'yard' && !busy) { const h = dogHeadWorld(); say(gl, h.x, h.y, 2600); } }, 300); }
}
let lastDemand = 0, lastNightHowl = {}, lastDistant = -1e9; const demandAt = {};
function voiceTick() { // called once a second from tick()
  if (!S || cur.mode !== 'yard' || barkMode() === 'off') return;
  const now = performance.now(), gm = S.gameMin;
  S.dogs.forEach((d) => {
    if ((d.stats.hunger < 25 || d.stats.happy < 25) && !d.sleeping && now - (demandAt[d.id] ?? -1e9) > 60000) { demandAt[d.id] = now; if (barkDog(d, 'demand', { ambient: true })) setTimeout(() => barkDog(d, 'whine', { player: true, ambient: true }), 900); }
    if (d.sleeping || (d.id === S.activeId && IDLE.act && IDLE.act.name === 'nap') || packPose[d.id] === 'sleep') { if (Math.random() < (d.key === 'pug' ? 0.45 : 0.2)) barkDog(d, 'snore', { ambient: true, volume: d.key === 'pug' ? 0.65 : 0.5 }); }
    else if (d.key === 'chihuahua' && Math.random() < 0.035) { if (d.id === S.activeId) { if (alertBark() && !busy) { const h = dogHeadWorld(); say(PICK(CHI_ALERT), h.x, h.y, 2000); } } else barkDog(d, 'alert', { ambient: true }); }
    if (d.id === S.activeId && dogKey.startsWith('hot|') && Math.random() < 0.25) barkDog(d, 'pant', { ambient: true, volume: 0.6 });
  });
  const clearNight = timePhase() === 'night' && !['rain', 'snow'].includes(weatherNow()) && atHome();
  if (clearNight) {
    S.dogs.filter((d) => d.key === 'husky' || d.key === 'beagle').forEach((d) => { if (gm - (lastNightHowl[d.id] ?? -999) >= (d.key === 'beagle' ? 360 : 180)) { lastNightHowl[d.id] = gm; barkDog(d, 'howl', { ambient: true }); } });
    if (now - lastDistant > 90000 && Math.random() < 0.02) { lastDistant = now; npcBark('woof', 0.8); }
  }
}

/* ---- idle behaviour scheduler ---- */
const IDLE = { act: null, steps: [], nextAt: 0, speed: 1, last: '', lastEnd: 0, mouse: null, force: null, napDone: 0 };
window.__idleLog = window.__idleLog || [];
const IDLE_NAMES = ['look', 'sit', 'down', 'nap', 'stretch', 'yawn', 'scratch', 'sniff', 'shake', 'roll', 'tailchase', 'zoomies', 'drink', 'watch', 'social', 'bringtoy', 'pounce', 'tumble', 'chewtoy', 'follow', 'pupzoomies', 'tailbark'];
const GRASSY = ['yard', 'park', 'beach', 'hilltop', 'dogpark', 'woods'];
let lastActiveAt = 0, bathZoomies = false, idlePin = null; // idlePin: test helper (__paw.idle.pin), holds the pack/idle pose
const IDLE_FXS = ['tk-look', 'tk-circle', 'tk-lie', 'tk-bow', 'tk-yawn', 'tk-scratch', 'tk-sniff', 'tk-roll', 'tk-chase', 'tk-pounce', 'tk-tumble', 'tk-chew', 'tk-pwig', 'tk-pzoom', 'tk-tbark'];
/* v1.7: chihuahuas feel the cold even indoors */
const chiCold = () => !isWarm() && (weatherNow() === 'snow' || [12, 1, 2].includes(monthNow()) || (weatherNow() === 'rain' && outdoorsNow()));
function idleWeights() {
  const d = D(), st = d.stats, t = timePhase(), hot = isHot(), indoor = !outdoorsNow(), stage = lifeStage(ageMonths()), now = performance.now();
  const w = { look: 3, sit: 3, down: 2, nap: 0.6, stretch: 0.6, yawn: 0.6, scratch: 0.8, sniff: indoor ? 0 : 1.5, shake: 0.4, roll: 0, tailchase: 0, zoomies: 0, drink: 0.4, watch: 0, social: 0, bringtoy: 0, pounce: 0, tumble: 0, chewtoy: 0, follow: 0, pupzoomies: 0, tailbark: 0 };
  if (st.energy < 60) w.down += 3; if (st.energy < 35) w.nap += 5; if (t === 'night') { w.nap += 4; w.yawn += 2; } if (t === 'dusk') w.yawn += 2;
  if (hot) { w.down += 3; w.drink += 3; } if (indoor) w.down += 2;
  if (['park', 'woods', 'beach', 'hilltop', 'dogpark'].includes(S.place)) w.sniff += 3;
  if (GRASSY.includes(S.place) && st.happy > 60) w.roll += 1.5; if (st.clean < 40) w.scratch += 3;
  if (['puppy', 'young'].includes(stage) && st.happy > 60) w.tailchase += 2;
  if (st.happy > 85 && st.energy > 70) w.zoomies += 1.5; if (st.hunger < 40) w.sit += 3;
  if (S.dogs.length > 1) w.social += 2.5; if (IDLE.mouse && Math.abs(IDLE.mouse.x - 430) < 260) w.watch += 4;
  if (now - lastActiveAt < 120000) w.down += 3;
  if (IDLE.last === 'down') { w.stretch += 3; w.shake += 2; } if (IDLE.last === 'nap') { w.yawn += 4; w.stretch += 4; }
  const pk = d.key;
  if (pk === 'shiba') w.sit += 2; if (pk === 'corgi') w.sit += 3; if (pk === 'golden') w.bringtoy += 2; if (pk === 'dachs') w.sniff += 3;
  if (pk === 'husky') w.zoomies += 2; if (pk === 'mutt') { w.down += 1; w.social += 2; }
  if (pk === 'chihuahua') { w.look += 3; if (chiCold()) w.look += 3; }
  if (pk === 'pug') { w.sit += 3; w.nap += 1; w.down += 1; w.zoomies *= 0.3; }
  if (pk === 'greyhound') { w.down += 5; w.nap += 1.5; w.sit = Math.max(0.5, w.sit - 2); w.zoomies += 1.2; }
  if (pk === 'beagle') w.sniff += indoor ? 3 : 5;
  if (typeof pupIdleWeights === 'function') pupIdleWeights(w, d, stage); // v2: puppies and nursing mums (16b)
  if (S.sleeping) return null;
  return w;
}
function pickIdle() { const w = idleWeights(); if (!w) return null; const tot = Object.values(w).reduce((a, b) => a + b, 0); let r = Math.random() * tot; for (const k in w) { r -= w[k]; if (r <= 0) return k; } return 'look'; }
const R2 = (a, b) => RINT(a, b) * IDLE.speed;
function idleSteps(name) {
  if (typeof PUP_IDLE !== 'undefined' && PUP_IDLE.includes(name)) return pupIdleSteps(name);
  const d = D(), indoor = !outdoorsNow(), aloof = d.key === 'shiba' ? 'left' : 'right';
  const bowl = { move: [-125, 0, 1, 0.8 * IDLE.speed], pose: 'walk', facing: 'left', ms: 850 * IDLE.speed };
  const home = { move: [0, 0, 1, 0.6 * IDLE.speed], pose: 'walk', facing: 'right', ms: 650 * IDLE.speed };
  switch (name) {
    case 'look': if (d.key === 'chihuahua' && chiCold() && Math.random() < 0.6) return [{ pose: 'cold', fb: 'sad', ms: R2(3000, 5000) }]; return [{ pose: 'idle', fx: 'tk-look', facing: Math.random() < 0.5 ? 'left' : 'right', ms: R2(3000, 6000), alert: d.key === 'chihuahua' && Math.random() < 0.4 }];
    case 'sit': return d.stats.hunger < 40 || d.key === 'corgi' || d.key === 'pug' ? [bowl, { pose: 'sit', facing: 'left', ms: R2(5000, 12000) }, home] : [{ pose: 'sit', facing: aloof, ms: R2(5000, 12000) }];
    case 'down': { const s = []; if (Math.random() < 0.4) s.push({ pose: 'walk', fx: 'tk-circle', ms: 1000 * IDLE.speed }); if (d.key === 'mutt') s.push({ move: [0, 40, 1.06, 0.6 * IDLE.speed], pose: 'walk', ms: 650 * IDLE.speed }); s.push({ pose: 'down', fx: 'tk-lie', facing: aloof, ms: d.key === 'greyhound' ? R2(12000, 30000) : R2(8000, 20000) }); if (d.key === 'mutt') s.push(home); return s; }
    case 'nap': return [{ move: [417.5, S.place === 'house' ? 130 : 140, 0.75, 1 * IDLE.speed], pose: 'walk', ms: 1050 * IDLE.speed }, { pose: 'sleep', ms: R2(15000, 40000), zzz: true }, home];
    case 'stretch': return [{ pose: 'bow', fx: 'tk-bow', ms: 1500 * IDLE.speed }];
    case 'yawn': return [{ pose: 'yawn', fx: 'tk-yawn', fb: 'sit', ms: 1200 * IDLE.speed, sound: 'yawn' }];
    case 'scratch': return [{ pose: 'scratch', fx: 'tk-scratch', ms: 2000 * IDLE.speed }];
    case 'sniff': { const a = RINT(-110, 110), b = RINT(-110, 110); return [{ move: [a, 0, 1, 0.8 * IDLE.speed], pose: 'walk', facing: a < 0 ? 'left' : 'right', ms: 850 * IDLE.speed }, { pose: 'sniff', fx: 'tk-sniff', fb: 'eat', facing: a < 0 ? 'left' : 'right', ms: 1600 * IDLE.speed, sound: Math.random() < 0.3 ? 'sneeze' : null }, { move: [b, 0, 1, 0.8 * IDLE.speed], pose: 'walk', facing: b < a ? 'left' : 'right', ms: 850 * IDLE.speed }, { pose: 'sniff', fx: 'tk-sniff', fb: 'eat', facing: b < a ? 'left' : 'right', ms: 1400 * IDLE.speed }, home]; }
    case 'shake': return [{ pose: 'shake', ms: 1000 * IDLE.speed }];
    case 'roll': return [{ pose: 'rollover', fx: 'tk-roll', ms: R2(2000, 3000), dirt: S.place === 'beach' }];
    case 'tailchase': return [{ pose: 'walk', fx: 'tk-chase', ms: 2000 * IDLE.speed }];
    case 'zoomies': if (d.key === 'greyhound') return [{ move: [380, 0, 1, 0.35 * IDLE.speed], pose: 'walk', facing: 'right', ms: 380 * IDLE.speed }, { move: [-330, 0, 1, 0.45 * IDLE.speed], pose: 'walk', facing: 'left', ms: 470 * IDLE.speed }, { move: [300, 0, 1, 0.4 * IDLE.speed], pose: 'walk', facing: 'right', ms: 420 * IDLE.speed }, { move: [0, 0, 1, 0.5 * IDLE.speed], pose: 'walk', facing: 'left', ms: 520 * IDLE.speed }, { pose: 'down', fx: 'tk-lie', ms: R2(4000, 8000) }];
      return [{ move: [330, 0, 1, 0.5 * IDLE.speed], pose: 'walk', facing: 'right', ms: 520 * IDLE.speed }, { move: [-260, 0, 1, 0.7 * IDLE.speed], pose: 'walk', facing: 'left', ms: 720 * IDLE.speed }, { move: [180, -8, 1, 0.5 * IDLE.speed], pose: 'happy', facing: 'right', ms: 520 * IDLE.speed }, home];
    case 'drink': return [bowl, { pose: 'eat', facing: 'left', ms: 2000 * IDLE.speed, water: true }, home];
    case 'watch': return [{ pose: 'idle', watch: true, ms: R2(2500, 4500) }];
    case 'social': {
      const o = PICK(others()); if (!o) return [{ pose: 'sit', ms: R2(4000, 8000) }];
      const i = others().indexOf(o), spot = packSpots()[i] || [700, 410, 'left'], tx = clamp(spot[0] - 430 + (spot[0] < 430 ? 120 : -120), -300, 380);
      const kind = PICK(['sniff', 'invite', 'together']);
      if (kind === 'invite') return [{ pose: 'bow', fx: 'tk-bow', facing: spot[0] < 430 ? 'left' : 'right', ms: 1500 * IDLE.speed, sound: 'play', other: [o, 'happy'] }];
      if (kind === 'together') return [{ move: [tx, -30, 0.92, 0.9 * IDLE.speed], pose: 'walk', facing: spot[0] < 430 ? 'left' : 'right', ms: 950 * IDLE.speed }, { pose: 'down', fx: 'tk-lie', ms: R2(6000, 12000), other: [o, 'down'] }, home];
      return [{ move: [tx, -30, 0.92, 0.9 * IDLE.speed], pose: 'walk', facing: spot[0] < 430 ? 'left' : 'right', ms: 950 * IDLE.speed }, { pose: 'sniff', fx: 'tk-sniff', fb: 'eat', facing: spot[0] < 430 ? 'left' : 'right', ms: 1600 * IDLE.speed, other: [o, 'sit'] }, home];
    }
    case 'bringtoy': return [{ pose: 'happy', ms: 900 * IDLE.speed, toy: true }, { pose: 'bow', fx: 'tk-bow', ms: 1500 * IDLE.speed, sound: 'play' }];
  }
  return [{ pose: 'idle', ms: 3000 }];
}
function idleRunStep() {
  const s = IDLE.steps.shift(); if (!s) { idleEnd(); return; }
  const d = D(), real = poseReal(d.key, s.pose), pose = real || !s.fb ? s.pose : s.fb;
  const fx = $('#dogFx'); if (fx) { fx.classList.remove(...IDLE_FXS); if (s.fx && (!real || ['tk-circle', 'tk-chase', 'tk-look', 'tk-roll', 'tk-pounce', 'tk-tumble', 'tk-chew', 'tk-pwig', 'tk-pzoom', 'tk-tbark'].includes(s.fx))) { void fx.getBBox(); fx.classList.add(s.fx); } }
  if (s.move) dogTo(...s.move);
  let facing = s.facing || 'right';
  if (s.watch && IDLE.mouse) facing = IDLE.mouse.x < 430 ? 'left' : 'right';
  IDLE.act = Object.assign({}, IDLE.act, { pose, facing, until: performance.now() + s.ms, step: s });
  renderDog(pose, facing, true);
  if (s.zzz) showZzz(true);
  if (s.sound) barkDog(d, s.sound, { player: true, volume: s.sound === 'play' ? 1 : 0.7 });
  if (s.alert) barkDog(d, 'alert', { ambient: true });
  if (s.water) { setBowl('Fresh Water'); IDLE.act.watered = true; }
  if (s.dirt) addStat('clean', -2);
  if (s.toy) toast(`${d.name} drops a ball at your feet and stares. Hard.`, '');
  if (s.other) { packPose[s.other[0].id] = s.other[1]; redrawPackDog(s.other[0]); }
  if (s.say) { const h = dogHeadWorld(); say(s.say, h.x, h.y, 2200); }
  if (s.propOff && typeof pupPropClear === 'function') pupPropClear(); if (s.prop && typeof pupProp === 'function') pupProp(s.prop);
}
function idleEnd() {
  const a = IDLE.act; IDLE.act = null; IDLE.steps = [];
  const fx = $('#dogFx'); if (fx) fx.classList.remove(...IDLE_FXS);
  if (typeof pupPropClear === 'function') pupPropClear();
  if (a) { IDLE.last = a.name; if (a.name === 'nap') showZzz(false); if (a.watered) setBowl(S.bowl || null); }
  IDLE.lastEnd = performance.now(); IDLE.nextAt = performance.now() + RINT(4000, 9000) * IDLE.speed;
  if (cur.mode === 'yard' && !busy && !S.sleeping) renderDog(dogPoseNow(), 'right', true);
}
function idleStop() { // any player action
  if (!IDLE.act) return; const wasMoved = IDLE.act.step && (IDLE.act.step.move || IDLE.act.name === 'nap' || IDLE.act.name === 'sniff' || IDLE.act.name === 'zoomies' || IDLE.act.name === 'drink' || IDLE.act.name === 'social' || PUP_MOVERS.includes(IDLE.act.name));
  if (wasMoved && !busy && !S.sleeping) dogTo(0, 0, 1, 0.25); IDLE.steps = []; idleEnd(); lastActiveAt = performance.now();
}
function idleStart(name) {
  IDLE.act = { name, until: 0 }; IDLE.steps = idleSteps(name); window.__idleLog.push({ name, t: Math.round(performance.now()) }); if (window.__idleLog.length > 300) window.__idleLog.shift(); idleRunStep();
}
function idleTick() {
  if (!S || cur.mode !== 'yard' || !$('#dogArt')) return;
  if (busy || TRN || S.sleeping || pottyBusy || curling) { if (IDLE.act && (busy || TRN || S.sleeping)) { IDLE.steps = []; IDLE.act = null; } return; }
  const now = performance.now();
  if (IDLE.force) { const n = IDLE.force; IDLE.force = null; if (IDLE.act) { IDLE.steps = []; idleEnd(); } idleStart(n); return; }
  if (IDLE.act) { if (now >= IDLE.act.until) idleRunStep(); else if (IDLE.act.step && IDLE.act.step.watch && IDLE.mouse) { const f = IDLE.mouse.x < 430 ? 'left' : 'right'; if (f !== IDLE.act.facing) { IDLE.act.facing = f; renderDog(IDLE.act.pose, f, true); } } return; }
  if (idlePin) return; // test helper: pinned
  if (bathZoomies) { bathZoomies = false; idleStart('zoomies'); return; }
  if (now < IDLE.nextAt || dogPoseNow() !== 'idle' && dogPoseNow() !== 'happy') return;
  const n = pickIdle(); if (n) idleStart(n);
}
/* pack dogs: simple pose scheduling, no movement */
const packNext = {};
function packIdleTick() {
  if (!S || cur.mode !== 'yard' || S.dogs.length < 2 || !modal.hidden) return; const now = performance.now();
  others().forEach((d) => {
    if (d.sleeping || (IDLE.act && IDLE.act.step && IDLE.act.step.other && IDLE.act.step.other[0] === d)) return;
    if (idlePin) { if (packPose[d.id] !== idlePin) { packPose[d.id] = idlePin; redrawPackDog(d); } return; } // test helper: hold the pose
    if (now < (packNext[d.id] || 0)) return; packNext[d.id] = now + RINT(5000, 10000) * IDLE.speed;
    const pup = typeof pupPackPool === 'function' ? pupPackPool(d) : null;
    const pool = pup || ['idle', 'idle', 'sit', 'sit', 'down', 'scratch', 'yawn', 'sniff', d.stats.energy < 40 ? 'sleep' : 'idle'].concat(outdoorsNow() && d.stats.happy > 60 ? ['rollover'] : []);
    let p = PICK(pool); if (!poseReal(d.key, p)) p = { down: 'sit', scratch: 'sit', yawn: 'sit', sniff: 'eat', rollover: 'happy' }[p] || p;
    packPose[d.id] = p; redrawPackDog(d); if (p === 'yawn' || (p === 'sit' && Math.random() < 0.1)) barkDog(d, 'yawn', { ambient: true, volume: 0.6 });
  });
}
['pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, (e) => { if (e.isTrusted !== false) idleStop(); }, true));
window.addEventListener('mousemove', (e) => {
  if (cur.mode !== 'yard') { IDLE.mouse = null; return; } const svg = $('#view > svg.world'); if (!svg) return;
  try { const w = toWorld(svg, e.clientX, e.clientY); IDLE.mouse = w.y > 150 && w.y < 600 ? { x: w.x, y: w.y } : null; } catch (er) { IDLE.mouse = null; }
}, { passive: true });

