/* ======================= trick training ======================= */
const TPOSE = { Sit: { pose: 'sit' }, Paw: { pose: 'paw', fx: 'tk-paw' }, 'Lie Down': { pose: 'down', fx: 'tk-lie' }, 'Roll Over': { pose: 'rollover', fx: 'tk-roll', always: true }, Spin: { pose: 'walk', fx: 'tk-spin', always: true }, 'Play Dead': { pose: 'playdead', fx: 'tk-dead' }, Speak: { pose: 'speak', say: 'WOOF!' }, Dance: { pose: 'dance', fx: 'tk-dance' }, Bow: { pose: 'bow', fx: 'tk-bow' } };
const TSIG = { Sit: 'sit', Paw: 'paw', 'Lie Down': 'down', 'Roll Over': 'rollover', Spin: 'spin', 'Play Dead': 'playdead', Speak: 'speak', Dance: 'dance', Bow: 'bow', Signature: 'signature' };
const TCMD = { Sit: 'Sit!', Paw: 'Paw!', 'Lie Down': 'Down!', 'Roll Over': 'Roll over!', Spin: 'Spin!', 'Play Dead': 'Bang!', Speak: 'Speak!', Dance: 'Dance!', Bow: 'Bow!', Signature: 'Showtime!' };
const WRONG = [{ k: 'sniff', label: 'sniff the ground', pose: 'eat' }, { k: 'scratch', label: 'scratch', pose: 'scratch', fx: 'tk-scratch' }, { k: 'wander', label: 'wander off', pose: 'walk', move: true }, { k: 'sit', label: 'sit', pose: 'sit' }, { k: 'down', label: 'lie down', pose: 'down', fx: 'tk-lie' }, { k: 'stare', label: 'stare at you', pose: 'idle', say: '…' }];
const PERS = { corgi: 'food', shiba: 'stubborn', golden: 'eager', dachs: 'curious', husky: 'chatty', mutt: 'gentle', chihuahua: 'bold', pug: 'lazy', greyhound: 'sprinter', beagle: 'nose' };
/* v1.7 trick modifiers: chance bonus per personality and trick, and extra wrong guesses */
const PERS_TRICK = { bold: { Speak: 0.2, Bow: -0.05 }, lazy: { 'Lie Down': 0.15, 'Play Dead': 0.15, Spin: -0.1, 'Roll Over': -0.1, Dance: -0.1 }, sprinter: { Sit: -0.15, 'Lie Down': 0.15, Spin: 0.1 }, nose: {} };
const PERS_WRONG = { bold: [{ k: 'yap', label: 'bark at a leaf', pose: 'speak', say: 'YAP YAP YAP!' }], lazy: [{ k: 'flop', label: 'flop over', pose: 'down', fx: 'tk-lie' }], sprinter: [{ k: 'zoom', label: 'zoom off', pose: 'walk', move: true }], nose: [{ k: 'sniff', label: 'sniff the ground', pose: 'eat' }] };
const poseRealCache = {};
function poseReal(key, pose) { const k = key + '|' + pose; if (!(k in poseRealCache)) { try { poseRealCache[k] = art('dog', key, { pose }).includes('pa-pose-' + pose); } catch (e) { poseRealCache[k] = false; } } return poseRealCache[k]; }
function trickSt(n, d = D()) { let v = d.tricks[n]; if (v == null || typeof v === 'number') { v = d.tricks[n] = { p: Math.min(1, (v || 0) / 3), shows: 0 }; } return v; }
const tStage = (st) => (st.p >= 1 ? (st.shows >= 5 ? 'Mastered' : 'Learned') : st.p >= 0.3 ? 'Getting it' : 'New');
const tName = (n) => (n === 'Signature' ? sigOf(S.dog.key).n : n);
function focusCap(d = D()) { return 100 - (d.stats.energy < 30 ? 30 : 0) - (d.stats.happy < 30 ? 20 : 0); }
function focusNow(d = D()) { const f = d.focus || (d.focus = { v: focusCap(d), at: S.gameMin }); const v = Math.min(focusCap(d), f.v + Math.max(0, S.gameMin - f.at)); f.v = v; f.at = S.gameMin; return v; }
function focusSet(v, d = D()) { d.focus = { v: clamp(v, 0, 100), at: S.gameMin }; }
const SIGN_FB = (n) => `<svg viewBox="0 0 64 64"><path d="M20 54 V30 Q20 24 25 24 V12 Q25 8 29 8 Q33 8 33 12 V24 V10 Q33 6 37 6 Q41 6 41 10 V26 V14 Q41 10 45 10 Q49 10 49 14 V38 Q49 54 34 56 Z" fill="#FFE3C8" stroke="#5B3D32" stroke-width="3" stroke-linejoin="round"/><text x="32" y="63" text-anchor="middle" font-size="10" font-family="Caveat" fill="#5B3D32">${esc(TSIG[n] || '')}</text></svg>`;
const sigIcon = (n) => artReal('icon', 'sig-' + TSIG[n]) || SIGN_FB(n);
let TRN = null; // training session
function openTraining(tab) {
  if (cur.mode !== 'yard') go('yard');
  if (S.sleeping) { nope(`${NAME()} is asleep. Training can wait.`); return; }
  popDown(); clearCurl(); hideBubble();
  const avail = TRICKS.filter((t) => S.bond.level >= t.bond);
  TRN = TRN && TRN.dog === D().id ? TRN : { dog: D().id, trick: (avail.find((t) => trickSt(t.n).p < 1) || avail[0] || TRICKS[0]).n, tab: 'train', att: null, lure: false, treats: 0, chain: 0, chainList: [], hinted: {}, timers: [] };
  if (tab) TRN.tab = tab;
  const tp = $('#trainPanel'); tp.hidden = false; stage.classList.add('training');
  if (!isPhone()) { tp.style.top = (hud.offsetHeight + 10) + 'px'; const w = $('#view > svg.world'); if (w) w.classList.add('trainzoom'); }
  else setTimeout(() => camApply(camCx), 30);
  if (PUBLIC_AUDIENCE.includes(S.place)) drawAudience(true);
  renderTraining();
}
function closeTraining() {
  if (!TRN) return; TRN.timers.forEach(clearTimeout); TRN = null;
  const tp = $('#trainPanel'); if (tp) { tp.hidden = true; tp.innerHTML = ''; } stage.classList.remove('training');
  const w = $('#view > svg.world'); if (w) w.classList.remove('trainzoom'); drawAudience(false);
  const fx = $('#dogFx'); if (fx) fx.setAttribute('class', ''); if (cur.mode === 'yard' && !busy) { dogTo(0, 0, 1, 0.4); renderDog(dogPoseNow(), 'right', true); }
  if (isPhone()) setTimeout(() => camApply(camCx), 30);
}
function drawAudience(on) {
  const svg = $('#view > svg.world'); if (!svg) return; let g = svg.querySelector('#audience'); if (g) g.remove(); if (!on) return;
  const ks = dogsList().filter((d) => d.key !== S.dog.key).slice(0, 2).map((d) => d.key);
  svg.insertAdjacentHTML('beforeend', `<g id="audience" pointer-events="none">${ks.map((k, i) => place(art('dog', k, { pose: i ? 'happy' : 'sit', facing: 'right' }), i ? 150 : 20, i ? 420 : 395, 150, 125)).join('')}<text x="170" y="585" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="26" fill="#5B3D32">audience x2</text></g>`);
}
function trainLine(t, cls = '') { if (TRN) TRN.msg = [t, cls]; const l = $('#trLine'); if (l) { l.textContent = t; l.className = 'trline ' + cls; } }
function renderTraining() {
  const tp = $('#trainPanel'); if (!tp || !TRN) return; const d = D(), n = TRN.trick, st = trickSt(n), f = Math.round(focusNow());
  const chips = TRICKS.map((t) => { const lock = S.bond.level < t.bond, s2 = trickSt(t.n); return `<button class="trchip ${t.n === n ? 'on' : ''}" data-tr="${t.n}" ${lock ? 'aria-disabled="true"' : ''} title="${esc(tName(t.n))}"><span class="ic">${sigIcon(t.n)}</span><b>${esc(t.n === 'Signature' ? 'Signature' : t.n)}</b><small>${lock ? 'Bond ' + t.bond : tStage(s2)}</small></button>`; }).join('');
  const learned = TRICKS.filter((t) => S.bond.level >= t.bond && trickSt(t.n).p >= 1);
  const body = TRN.tab === 'train' ? `<div class="trchips">${chips}</div>
    <div class="trrow"><div class="trprog"><span>${esc(tName(n))} · <b>${tStage(st)}</b></span><div class="prog"><i style="width:${Math.round(st.p * 100)}%"></i></div></div></div>
    <div class="trrow trfocus"><span class="ic">${iconOr('focus', doodle('spark', 0, 0, 0.9))}</span><span>Focus</span><div class="prog"><i style="width:${f}%"></i></div><b>${f}</b></div>
    <div class="trbtns"><button class="btn go big" id="trCue"><span class="ic">${sigIcon(n)}</span>${esc(TCMD[n])}</button><button class="btn yes big trgood" id="trGood"><span class="ic">${iconOr('clicker', doodle('heart', 0, 0, 0.9))}</span>Good!</button></div>
    <button class="btn ${TRN.lure ? 'yes' : ''}" id="trLure" aria-pressed="${TRN.lure}"><span class="ic">${iconOr('lure', doodle('paw', 0, 0, 0.8))}</span>Lure with treat</button>
    <p class="trline" id="trLine">Cue, watch, and tap Good! the moment ${esc(d.name)} gets it right.</p>
    <p class="small">Treat bits: +${TRN.treats} Hunger this session (max 15).</p>`
    : `<p class="small">Learned tricks on cue. Chain 3 in a row for a combo: coins (Learned 3, Mastered 5 each${PUBLIC_AUDIENCE.includes(S.place) ? ', <b>audience x2 here</b>' : ''}). Shows for coins today: ${(S.daily.showCoins || 0)}/10.</p>
    <div class="trshow">${learned.length ? learned.map((t) => `<button class="btn" data-show="${t.n}"><span class="ic">${sigIcon(t.n)}</span>${esc(tName(t.n))}<small>${tStage(trickSt(t.n))}</small></button>`).join('') : '<p>No learned tricks yet. Train one to 100% first!</p>'}</div>
    <p class="trline" id="trLine">${TRN.chain ? `Chain: ${TRN.chain}` : 'Tap a trick to perform it.'}</p>`;
  tp.innerHTML = `<div class="trhead"><div class="tabs" role="tablist"><button class="btn" role="tab" data-trtab="train" aria-selected="${TRN.tab === 'train'}">Train</button><button class="btn" role="tab" data-trtab="show" aria-selected="${TRN.tab === 'show'}">Show off</button></div><button class="xbtn" id="trX" aria-label="Close training">x</button></div><div class="trbody">${body}</div>`;
  tp.querySelector('#trX').onclick = () => { SFX.click(); closeTraining(); };
  tp.querySelectorAll('[data-trtab]').forEach((b) => { b.onclick = () => { SFX.click(); TRN.tab = b.dataset.trtab; TRN.msg = null; renderTraining(); }; });
  tp.querySelectorAll('[data-tr]').forEach((b) => { b.onclick = () => { const t = TRICKS.find((x) => x.n === b.dataset.tr); if (S.bond.level < t.bond) { nope(`${t.n} unlocks at Bond ${t.bond}.`); return; } SFX.click(); TRN.trick = t.n; if (t.n === 'Speak' && PERS[S.dog.key] === 'chatty' && trickSt('Speak').p < 0.6) { trickSt('Speak').p = 0.6; toast(`${NAME()} already loves to talk: Speak starts at 60%!`, 'good'); } renderTraining(); }; });
  const cue = tp.querySelector('#trCue'); if (cue) cue.onclick = trainCue;
  const good = tp.querySelector('#trGood'); if (good) good.onclick = trainMark;
  const lure = tp.querySelector('#trLure'); if (lure) lure.onclick = () => { TRN.lure = !TRN.lure; SFX.click(); if (TRN.lure && !TRN.hinted.lure) { TRN.hinted.lure = true; toast("Lure tip: it's easier, but they learn half as much. Fade the lure, or they'll only do it for snacks.", 'gold'); } renderTraining(); };
  tp.querySelectorAll('[data-show]').forEach((b) => { b.onclick = () => showOff(b.dataset.show); });
  if (TRN.msg) { const l = tp.querySelector('#trLine'); if (l) { l.textContent = TRN.msg[0]; l.className = 'trline ' + TRN.msg[1]; } }
  if (isPhone()) camApply(camCx);
}
function trickPose(n) { if (n === 'Signature') { const s = sigOf(S.dog.key); return { pose: s.pose, fx: s.fx, say: s.say, sig: true, always: !!s.always, snd: s.snd }; } return TPOSE[n] || { pose: 'sit' }; }
function playPose(spec) {
  const fx = $('#dogFx'); if (!fx) return; const real = poseReal(S.dog.key, spec.pose);
  renderDog(spec.pose, 'right', true); fx.setAttribute('class', '');
  if (spec.fx && (spec.always || !real)) { void fx.getBBox(); fx.classList.add(spec.fx); }
  if (spec.move) dogTo(RINT(-90, 90), 0, 1, 0.6);
  if (spec.snd) barkDog(D(), spec.snd, { player: true }); else if (spec.pose === 'speak') barkDog(D(), spec.say === 'AWOOO!' ? 'howl' : speakKind(D()), { player: true });
  const h = dogHeadWorld(); if (spec.say) say(spec.say, h.x, h.y, 1300);
}
function endPose() { const fx = $('#dogFx'); if (fx) fx.setAttribute('class', ''); dogTo(0, 0, 1, 0.4); renderDog(dogPoseNow(), 'right', true); }
function showSignal(n) {
  const fx = $('#fx'); if (!fx) return; const real = artReal('prop', 'hand-signal', { trick: TSIG[n] });
  fx.insertAdjacentHTML('beforeend', `<g class="handsig popfx">${place(real || SIGN_FB(n), 600, 250, 110, 110)}</g>`);
  setTimeout(() => { const g = fx.querySelector('.handsig'); if (g) g.remove(); }, 900);
}
function treatFly() {
  const fx = $('#fx'); if (!fx) return; const t = artReal('prop', 'treat-bit') || '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" fill="#C98A54" stroke="#5B3D32" stroke-width="2"/></svg>';
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'treatfly'); g.innerHTML = place(t, 0, 0, 26, 26); g.style.transform = 'translate(900px, 260px)'; fx.appendChild(g);
  requestAnimationFrame(() => requestAnimationFrame(() => { g.style.transform = 'translate(540px, 370px)'; })); setTimeout(() => g.remove(), 700);
  SFX.crunch(); setTimeout(() => fxText('♥', 520, 330), 400);
  if (TRN && TRN.treats < 15) { TRN.treats++; addStat('hunger', 1); }
}
function trainCue() {
  if (!TRN || TRN.att || busy) return; const d = D(), n = TRN.trick, st = trickSt(n), pers = PERS[d.key];
  let f = focusNow(); if (f <= 0) { trainLine(`${d.name}'s brain is full. Session over. Try again after a break or a nap.`, 'bad'); SFX.nope(); return; }
  const cost = 10 + ((pers === 'food' || pers === 'nose') && !TRN.lure ? 3 : 0) - (pers === 'eager' ? 3 : 0) + (pers === 'lazy' ? 2 : 0); focusSet(f - cost); f = focusNow();
  if (f <= 0) trainLine(`Last try: ${d.name}'s brain is full after this one. Session over.`, 'bad');
  SFX.click(); showSignal(n); hideBubble();
  const lure = TRN.lure; TRN.lure = false;
  let ch = 0.15 + st.p * 0.7 + (lure ? 0.35 : 0);
  if (pers === 'food' && lure) ch += 0.15; if (pers === 'stubborn') ch -= 0.1; if (pers === 'eager') ch += 0.1; if (pers === 'gentle') ch += 0.05; if (pers === 'curious' && n === 'Bow') ch += 0.1; if ((pers === 'nose' || pers === 'lazy') && lure) ch += 0.15; ch += (PERS_TRICK[pers] || {})[n] || 0;
  if (d.stats.happy < 30) ch -= 0.1; if (f < 30) ch -= 0.15; ch = clamp(ch, 0.05, 0.95);
  const correct = Math.random() < ch;
  let spec = trickPose(n), wrong = null;
  if (!correct) { let pool = WRONG.filter((w) => !(w.k === 'sit' && n === 'Sit') && !(w.k === 'down' && n === 'Lie Down')); if (pers === 'curious') pool = pool.concat([WRONG[0], WRONG[0]]); if (PERS_WRONG[pers]) pool = pool.concat(PERS_WRONG[pers], PERS_WRONG[pers]); if (pers === 'chatty') pool = pool.concat([{ k: 'howl', label: 'howl', pose: 'speak', say: 'AWOOO!' }, { k: 'howl', label: 'howl', pose: 'speak', say: 'AWOOO!' }]); wrong = PICK(pool); spec = wrong; }
  renderTraining();
  const delay = RINT(600, 1200);
  TRN.timers.push(setTimeout(() => {
    if (!TRN) return; TRN.att = { correct, wrong, t0: performance.now(), lure, marked: false };
    playPose(spec); const g = $('#trGood'); if (g) g.classList.add('ready');
    TRN.timers.push(setTimeout(() => {
      if (!TRN) return; const a = TRN.att; TRN.att = null; endPose(); const g2 = $('#trGood'); if (g2) g2.classList.remove('ready');
      if (a && !a.marked) {
        if (a.correct) trainLine('Missed it! Timing is everything. Cue again.', 'bad');
        else { trainLine(`${d.name} tried to ${a.wrong.label}. Ignoring it was right: cue again.`, 'ok'); if (!TRN.hinted.ignore) { TRN.hinted.ignore = true; toast('Training tip: ignore the wrong stuff, reward the right stuff.', 'gold'); } }
      }
      if (focusNow() <= 0) trainLine(`${d.name}'s brain is full. Session over.`, 'bad');
    }, 1400));
  }, delay));
}
function trainMark() {
  if (!TRN) return; const a = TRN.att, d = D(), n = TRN.trick, st = trickSt(n), pers = PERS[d.key];
  if (!a) { trainLine('Mark the moment the dog does it. Cue first!', ''); SFX.nope(); return; }
  if (a.marked) return; a.marked = true;
  if (a.correct) {
    const dt = performance.now() - a.t0; let gain = dt <= 700 ? 0.20 : 0.12; if (pers === 'stubborn') gain = dt <= 700 ? 0.25 : 0.15; if (a.lure) gain /= 2; if (owns('toys', 'Rubber Chicken')) gain *= 1.25;
    const was = st.p; st.p = Math.min(1, st.p + gain); treatFly(); SFX.boop(880); markDirty();
    trainLine(dt <= 700 ? `Perfect timing! +${Math.round(gain * 100)}%` : `Good! A bit late: +${Math.round(gain * 100)}%`, 'good');
    if (was < 1 && st.p >= 1) { SFX.fanfare(); const b = addBond(4); toast(`${d.name} learned ${tName(n)}! +${b} Bond. Try it in Show off.`, 'gold'); dailyCare('play'); }
    addStat('happy', 2);
  } else {
    if (pers === 'gentle') trainLine(`${d.name} looks at you kindly. No harm done (this time).`, 'ok');
    else { st.p = Math.max(0, st.p - 0.05); fxText('?', 470, 300, '#86B3EA', 54); SFX.nope(); trainLine(`Oops: ${d.name} now thinks '${tName(n)}' means '${a.wrong.label}'. -5%`, 'bad'); markDirty(); }
  }
  updateHUD(); renderTraining();
}
function showOff(n) {
  if (!TRN || busy || TRN.att) return; const d = D(), st = trickSt(n), ok = Math.random() < (st.shows >= 5 ? 0.98 : 0.8);
  busy = true; showSignal(n); const spec = trickPose(n);
  TRN.timers.push(setTimeout(() => {
    if (spec.sig) { playPose(spec); TRN.timers.push(setTimeout(() => playPose({ pose: 'walk', fx: 'tk-spin', always: true }), 900), setTimeout(() => playPose({ pose: 'happy' }), 1800)); }
    else playPose(ok ? spec : PICK(WRONG));
  }, 500));
  TRN.timers.push(setTimeout(() => {
    busy = false; endPose(); if (!TRN) return; dailyCheck(); const aud = PUBLIC_AUDIENCE.includes(S.place) ? 2 : 1;
    if (ok) {
      st.shows++; TRN.chain++; addStat('happy', 2); SFX.boop(900); fxText('★', 470, 300, '#F2C744', 46);
      if (S.place === 'square') { S.daily.squareShows = (S.daily.squareShows || 0) + 1; if (S.daily.squareShows >= 3 && !S.daily.squareGoal) { S.daily.squareGoal = true; const c = addCoins(30, { raw: true }); toast(`Town notice goal done: 3 tricks in the Square! +${c} coins.`, 'gold'); } }
      if (st.shows === 5) toast(`${d.name} MASTERED ${tName(n)}! Reliable 98% of the time. The other 2% is for drama.`, 'gold');
      let msg = `${tName(n)}: nailed it! Chain ${TRN.chain}.`;
      if (TRN.chain >= 3) {
        const pay = TRN.chain === 3 ? TRN.chainList.concat(n) : [n]; let coins = 0;
        pay.forEach((tn) => { if ((S.daily.showCoins || 0) < 10) { S.daily.showCoins = (S.daily.showCoins || 0) + 1; coins += (trickSt(tn).shows >= 5 ? 5 : 3) * aud; } });
        const c = coins ? addCoins(coins, { raw: true }) : 0; const b = TRN.chain === 3 ? addBond(3) : 0; addStat('happy', 5);
        msg = `COMBO x${TRN.chain}! ${c ? `+${c} coins${aud > 1 ? ' (audience x2)' : ''}` : 'No more show coins today'}${b ? `, +${b} Bond` : ''}.`; if (aud > 1) toast(PICK(['The crowd goes wild!', 'A poodle throws a tiny flower.', 'Someone films it. It will go viral (in the park).']), 'good');
      }
      TRN.chainList = (TRN.chainList || []).concat(n).slice(-3); trainLine(msg, 'good');
    } else { TRN.chain = 0; TRN.chainList = []; SFX.nope(); trainLine(`Oops! ${d.name} forgot halfway. The crowd politely coughs. Chain reset.`, 'bad'); }
    markDirty(); updateHUD(); renderTraining();
  }, spec.sig ? 2800 : 1900));
}

