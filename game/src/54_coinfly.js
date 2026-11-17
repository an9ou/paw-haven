/* ======================= v2.25.2 "Shiny coins" + v2.25.3 "Happy meters": 54_coinfly.js (tags cf, jf) =======================
   One shared helper that makes a gain feel good, instead of a number just changing (owner, 15 Nov 2026: "it can go everywhere, same for
   bonding and XP growing"). Three kinds, one engine:
     coin  the crayon coin (ICON('coin')) flies to the coin counter, which bumps and rolls its number up to S.coins; a soft chime
     bond  a crayon heart (ICON('bond'), the Bond meter's own icon) flies from the dog to the Bond meter, whose bar fills up; a warm pluck
     xp    a crayon star (ICON('star')) flies to the town level star (#lvBtn), its XP bar (the star art on phones) fills up; a light sparkle
   Each: 1. the icon pops at the source (squash and stretch), 2. a small crayon sparkle, 3. a curved arc to the meter, 4. the meter bumps and
   its number or bar rolls up, 5. the sound. Exactly ONE icon flies per gain, never a shower, however big the gain (owner).

   coinFly(from, amount, o)          = juiceFly('coin', ...): call it right after the addCoins / addCoinsD it shows (same task)
   juiceFly(kind, from, amount, o)   kind 'coin' | 'bond' | 'xp'
     from     the element the icon pops from (its centre), a point { x, y } in client px, a world point { wx, wy } (the scene's svg), a
              function returning one of these at launch time (a toast that shows a moment later), or null
     amount   what the text shows (the coin chime's pitch); 0 does nothing
     o.gain   coins: how much S.coins actually went up (default: what the addCoins that paid this amount added, else amount; less when
              coins settled a refund, 52_kindshop.js)
     o.delay  ms before the icon pops (a sheet that is still opening); the meter holds the old value meanwhile
   Bond and XP need no calls: addBond (00_core.js) and lvGain (the lv:gain event, 51_levels.js) hand every gain to bjGain / xjGain.
     They MERGE: gains of one dog within BJ_MERGE ms are one heart, and one dog gets at most one heart every BJ_EVERY ms (pets, feeding and
     care come in bursts); XP gains within XJ_MERGE ms are one star. A tiny Bond gain (under BJ_TINY) only pulses the meter.
     jfSrc(kind, from) names the source for a gain just made or about to be made (the walk result's Bond tile, a toast, a result card).
     No source given: the dog in the scene (Bond and XP), a tap in the last JF_PTR_MS ms, else the icon pops on the meter itself.
     A level-up (Bond or town level) keeps its own celebration: no heart or star for it, and any still on the way land at once, quietly.
     The daily XP cap: lvGain grants 0 and says nothing, so nothing flies.
   The values are already right (addCoins, addBond, lvGain): this is display only. While an icon is on its way the meter shows the value
   without it (CF.pend, bjPend(), xjPend()), and it always ends exactly on the true value.
   The meter not visible on this screen: a pop at the source, no flight. No source either: just the sound and the new value.
   Reduce motion (html[data-motion="off"] or prefers-reduced-motion): no pop, flight or squash; the value changes with a soft highlight.
   Several gains at once: at most CF_MAX icons of a kind in the air, the rest wait (a long wait merges into one). Effects are transform and
   opacity only, pointer-events none, in their own fixed layer, and never outlive the game screen (the title, a hidden tab: all land at once).
   State: CF (coins) in 00_core.js, BJ and XJ here. Hooks: __paw.cf (coins), __paw.jf (all kinds). */
const CF_MAX = 2, CF_GAP = 150, CF_POP = 230, CF_FLY = 640, CF_ROLL = 700;
const JF_PTR_MS = 1500, BJ_MERGE = 700, BJ_EVERY = 1500, BJ_TINY = 2, XJ_MERGE = 450;
const BJ = { q: [], live: 0, last: 0, gs: [], pt: 0, at: {}, hint: null, glowAt: 0 };
const XJ = { q: [], live: 0, last: 0, gs: [], pt: 0, hint: null, glowAt: 0 };
let jfPtr = null; // the last tap: { x, y, t } in client px
window.addEventListener('pointerdown', (e) => { if (e.isPrimary !== false) jfPtr = { x: e.clientX, y: e.clientY, t: performance.now() }; }, { capture: true, passive: true });
// v2.29 Story mode (57_scenes.js): while a scene plays full screen nothing flies over it; a gain then lands at once, without a sound (the scene has its own)
const jfQuiet = () => typeof scPlaying === 'function' && scPlaying();
function cfCalm() { const m = document.documentElement.dataset.motion; return m === 'off' || (m !== 'on' && !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)); }
function cfNum() { return $('#coinNum'); }
function cfShow(v) { CF.disp = v; const el = cfNum(), t = tnum(Math.max(0, Math.round(v))); if (el && el.textContent !== t) el.textContent = t; }
// a meter's icon, if a player can see it on this screen (client px), else null
function jfSeen(box, ic) {
  if (!box || !ic || hud.hidden || !box.offsetParent) return null;
  const cs = getComputedStyle(box); if (cs.visibility === 'hidden' || +cs.opacity === 0) return null;
  const r = ic.getBoundingClientRect(); if (r.width < 4 || r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, s: r.height };
}
function cfTarget() { const c = $('#coins'); return jfSeen(c, $('#coinIc') || c); }
function bjTarget() { const b = $('#hud .bond'); return jfSeen(b, $('#bondIc') || b); }
function xjTarget() { const b = $('#lvBtn'); return jfSeen(b, b && ($('.lv-art', b) || b)); }
function cfFrom(f) {
  if (typeof f === 'function') { try { f = f(); } catch (e) { f = null; } }
  if (!f) return null;
  if (f.nodeType === 1) {
    if (!f.isConnected) return null; const r = f.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return null; // a queued toast (display none), a closed sheet
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  if (Number.isFinite(+f.wx) && Number.isFinite(+f.wy)) { // a point in the scene's world (a dog in the ball game)
    const svg = $('svg.world', view); if (!svg) return null;
    try { const pt = svg.createSVGPoint(); pt.x = +f.wx; pt.y = +f.wy; const p = pt.matrixTransform(svg.getScreenCTM()); return p.x >= 0 && p.y >= 0 && p.x <= innerWidth && p.y <= innerHeight ? { x: p.x, y: p.y } : null; } catch (e) { return null; }
  }
  return Number.isFinite(+f.x) && Number.isFinite(+f.y) ? { x: +f.x, y: +f.y } : null;
}
const jfTap = () => (jfPtr && performance.now() - jfPtr.t < JF_PTR_MS ? { x: jfPtr.x, y: jfPtr.y } : null);
// the dog a Bond gain belongs to, if it is the one drawn in the scene (the yard and town places)
function bjDog(id) {
  if (!S || !S.dog || S.dog.id !== id) return null;
  const h = $('#dogHit'); if (!h || !h.isConnected) return null; const r = h.getBoundingClientRect();
  if (r.width < 8 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height * 0.4 };
}
function cfLayer() {
  if (CF.layer && CF.layer.isConnected) return CF.layer;
  const l = document.createElement('div'); l.id = 'cfLayer'; l.setAttribute('aria-hidden', 'true'); document.body.appendChild(l); CF.layer = l; return l;
}
function cfChime(amount) { try { const A = window.PawAudio; if (A && typeof A.coin === 'function') A.coin(amount); } catch (e) { /* audio never breaks a coin */ } }
function jfSound(name, amount) { try { const A = window.PawAudio; if (A && typeof A[name] === 'function') A[name](amount); } catch (e) { /* audio never breaks a gain */ } }
// the crayon sparkle: the spark doodle (fill and outline are one path) three times, and a few pencil flicks
function cfSparkSVG() {
  const fl = [[-28, -6, -20, -4], [22, -14, 29, -19], [6, 22, 8, 30], [-14, 19, -19, 26]].map(([a, b, c, d]) => `<path d="M${a} ${b}L${c} ${d}" stroke="${INKG}" stroke-width="2.2" stroke-linecap="round"/>`).join('');
  return `<svg viewBox="-40 -40 80 80" width="100%" height="100%">${doodle('spark', -16, -16, 0.62, 8)}${doodle('spark', 19, 4, 0.48, -12)}${doodle('spark', -4, 18, 0.38, 20)}${fl}</svg>`;
}
function cfSpark(x, y, size) {
  if (cfCalm()) return; const el = document.createElement('div'); el.className = 'cf-spark'; el.innerHTML = cfSparkSVG();
  const s = Math.round(size); el.style.width = el.style.height = s + 'px'; el.style.left = (x - s / 2) + 'px'; el.style.top = (y - s / 2) + 'px';
  cfLayer().appendChild(el);
  const a = el.animate([{ transform: 'scale(.3) rotate(-12deg)', opacity: 0 }, { transform: 'scale(1) rotate(0deg)', opacity: 1, offset: 0.35 }, { transform: 'scale(1.18) rotate(6deg)', opacity: 0 }], { duration: 420, easing: 'ease-out' });
  const done = () => el.remove(); a.onfinish = done; a.oncancel = done; setTimeout(done, 900);
}
// the roll-up: from the number shown to S.coins minus what is still on its way, eased; ends exactly on S.coins once nothing is left
function cfRoll() {
  const from = CF.disp == null ? S.coins : CF.disp, t0 = performance.now(); cancelAnimationFrame(CF.roll);
  const step = (now) => {
    if (!S) { CF.roll = 0; return; }
    const target = S.coins - CF.pend, p = Math.max(0, Math.min(1, (now - t0) / CF_ROLL)), e = 1 - Math.pow(1 - p, 3);
    if (p >= 1 || target <= from) { cfShow(target); CF.roll = 0; if (!CF.hold) { CF.disp = null; cfShow(S.coins); CF.disp = null; } return; }
    cfShow(from + (target - from) * e); CF.roll = requestAnimationFrame(step);
  };
  CF.roll = requestAnimationFrame(step);
}
// a meter is hit: a squash (and a sparkle on it), or in calm mode the soft highlighter stroke
function jfBump(box, tg, cls) {
  if (!box) return;
  if (cfCalm()) { box.classList.remove('cf-glow'); void box.offsetWidth; box.classList.add('cf-glow'); clearTimeout(box._cfg); box._cfg = setTimeout(() => box.classList.remove('cf-glow'), 900); return; }
  box.classList.remove('bump', cls); void box.offsetWidth; box.classList.add(cls); clearTimeout(box._cfh); box._cfh = setTimeout(() => box.classList.remove(cls), 450);
  if (tg) cfSpark(tg.x, tg.y, tg.s * 1.8);
}
function cfHit(tg) { jfBump($('#coins'), tg, 'cf-hit'); }
function bjHit(tg) { jfBump($('#hud .bond'), tg, 'jf-hit'); }
function xjHit(tg) {
  const b = $('#lvBtn'); if (!b) return;
  if (cfCalm()) { jfBump(b, null, 'lv-wig'); return; }
  b.classList.remove('lv-pop', 'lv-wig'); void b.offsetWidth; b.classList.add('lv-wig'); clearTimeout(LVU.wig); LVU.wig = setTimeout(() => b.classList.remove('lv-pop', 'lv-wig'), 450); // the star's own wiggle (51_levels.js)
  if (tg) cfSpark(tg.x, tg.y, tg.s * 1.8);
}
// what is still on its way: the meters show the value without it
function bjPend(id) { if (!S || !S.dog) return 0; id = id || S.dog.id; let n = 0; BJ.gs.forEach((g) => { if (!g.landed && g.id === id) n += g.gain; }); return n; }
function xjPend() { let n = 0; XJ.gs.forEach((g) => { if (!g.landed) n += g.gain; }); return n; }
function bjShow() { const bt = $('#bondTrack'); if (bt) bt.dataset.k = ''; updateHUD(); } // the fill's own width transition (.fill, 03_hud.css) makes it grow
function xjShow() { if (typeof LVU === 'object') LVU.hudKey = ''; if (typeof lvNextSync === 'function') lvNextSync(); }
/* the three kinds. st: its state; land(g, quick): the meter part of a landing (the engine already took g out of the air) */
const JK = {
  coin: { name: 'coin', st: CF, icon: () => ICON('coin'), target: cfTarget,
    land(g, quick) {
      CF.pend = Math.max(0, CF.pend - g.gain); CF.hold = Math.max(0, CF.hold - 1);
      const tg = cfTarget(); if (tg && !g.noHit) cfHit(quick ? null : tg);
      if (!g.silent) cfChime(g.amount);
      if (!quick) cfRoll();
      else if (!CF.roll) { cfShow(S.coins - CF.pend); if (!CF.hold) CF.disp = null; } // calm, a hidden counter, a merged or late gain: the number simply changes (a roll already running takes it along)
    } },
  bond: { name: 'bond', st: BJ, icon: () => ICON('bond'), target: bjTarget, cls: 'jf-heart', box: () => $('#hud .bond'), hitCls: 'jf-hit',
    land(g, quick) {
      bjShow(); const tg = bjTarget(), now = performance.now(), loud = !g.silent && (!quick || now - BJ.glowAt > 700);
      if (tg && !g.noHit && loud) { bjHit(quick ? null : tg); BJ.glowAt = now; }
      if (loud && !g.tiny) jfSound('bond', g.amount);
    } },
  xp: { name: 'xp', st: XJ, icon: () => ICON('star'), target: xjTarget, cls: 'jf-star', box: () => $('#lvBtn'), hitCls: 'lv-wig',
    land(g, quick) {
      xjShow(); const tg = xjTarget(), now = performance.now(), loud = !g.silent && (!quick || now - XJ.glowAt > 700);
      if (tg && !g.noHit && loud) { xjHit(quick ? null : tg); XJ.glowAt = now; }
      if (loud) jfSound('xp', g.amount);
    } }
};
// a gain arrives: it leaves the "on its way" sum, the meter bumps and rolls up, the sound plays
function jfLand(K, g, quick) {
  if (g.landed) return; g.landed = true; g.open = false; clearTimeout(g.wd); clearTimeout(g.dt);
  (g.anims || []).forEach((a) => { try { a.cancel(); } catch (e) { /* gone */ } }); if (g.el) g.el.remove();
  const st = K.st; if (g.flying) { g.flying = false; st.live = Math.max(0, st.live - 1); }
  st.gs = st.gs.filter((x) => x !== g); st.q = st.q.filter((x) => x !== g);
  if (!S) { cfReset(); return; }
  K.land(g, quick);
  jfPump(K);
}
function cfLand(g, quick) { jfLand(JK[g.kind || 'coin'], g, quick); }
function jfPump(K) {
  const st = K.st; if (!st.q.length || st.live >= CF_MAX) return;
  const wait = st.last + CF_GAP - performance.now(); if (wait > 0) { clearTimeout(st.pt); st.pt = setTimeout(() => jfPump(K), wait + 5); return; }
  jfLaunch(K, st.q.shift()); if (st.q.length) { clearTimeout(st.pt); st.pt = setTimeout(() => jfPump(K), CF_GAP + 5); }
}
function jfQueue(K, g) {
  if (g.landed) return; const st = K.st;
  if (st.live < CF_MAX && !st.q.length && performance.now() - st.last >= CF_GAP) { jfLaunch(K, g); return; }
  const last = st.q[st.q.length - 1];
  if (st.q.length >= 2 && last && (last.id || null) === (g.id || null)) { last.amount += g.amount; last.gain += g.gain; g.gain = 0; g.silent = true; g.noHit = true; jfLand(K, g, true); return; } // a long wait: the waiting gains share one icon
  st.q.push(g); jfPump(K);
}
// the icon: a pop with squash and stretch at the source, then the arc to the meter (sampled keyframes on transform; opacity at the ends)
function jfLaunch(K, g) {
  if (g.landed) return;
  if (!S || cur.mode === 'title') { jfLand(K, g, true); return; }
  const tg = K.target();
  if (g.tiny) { if (tg && !cfCalm() && K.box) jfBump(K.box(), null, K.hitCls); g.noHit = true; jfLand(K, g, true); return; } // a tiny gain: the meter only pulses
  const src = cfFrom(g.from) || (g.alt && cfFrom(g.alt)) || jfTap() || (tg ? { x: tg.x, y: tg.y, here: true } : null);
  const quiet = jfQuiet(); if (quiet) g.silent = true;
  if (!src || cfCalm() || document.hidden || quiet) { jfLand(K, g, true); return; }
  const st = K.st; st.last = performance.now(); g.flying = true; st.live++;
  const size = Math.round(Math.max(26, Math.min(44, (tg ? tg.s : 30) * 1.3))), el = document.createElement('div');
  el.className = K.cls ? 'jf-icon ' + K.cls : 'cf-coin'; el.innerHTML = K.icon(); el.style.width = el.style.height = size + 'px'; el.style.left = (-size / 2) + 'px'; el.style.top = (-size / 2) + 'px';
  cfLayer().appendChild(el); g.el = el;
  const T = (x, y, sx, sy, r) => `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(r || 0).toFixed(1)}deg) scale(${sx.toFixed(3)},${sy.toFixed(3)})`;
  const k0 = src.here ? 0.85 : 1; // on the meter itself the pop stays small
  const pop = [{ transform: T(src.x, src.y, 0.2, 0.2), opacity: 0 }, { transform: T(src.x, src.y - 6, 0.82 * k0, 1.3 * k0, -6), opacity: 1, offset: 0.4 }, { transform: T(src.x, src.y - 2, 1.22 * k0, 0.8 * k0, 4), opacity: 1, offset: 0.72 }, { transform: T(src.x, src.y - 4, k0, k0), opacity: 1 }];
  const a1 = el.animate(pop, { duration: CF_POP, easing: 'ease-out', fill: 'forwards' }); g.anims = [a1];
  cfSpark(src.x, src.y - 4, size * 2.2);
  if (!tg || src.here) { g.tgOff = !tg; // no meter in sight (or the icon is already on it): a short hold after the pop, then it lands where it is
    a1.onfinish = () => { if (g.landed) return; const a2 = el.animate([{ transform: T(src.x, src.y - 4, k0, k0), opacity: 1 }, { transform: T(src.x, src.y - 12, 0.6, 0.6), opacity: 0 }], { duration: 260, easing: 'ease-in', fill: 'forwards' }); g.anims.push(a2); a2.onfinish = () => jfLand(K, g, !tg); };
    return;
  }
  a1.onfinish = () => {
    if (g.landed) return;
    const t2 = K.target(); if (!t2) { jfLand(K, g, true); return; } // the meter went away during the pop
    const sx = src.x, sy = src.y - 4, ex = t2.x, ey = t2.y, d = Math.hypot(ex - sx, ey - sy);
    // the arc: a lob that bows out to the upper side of the straight line (up and back, away from where it is going), then drops into the meter
    let px = (ey - sy) / (d || 1), py = -(ex - sx) / (d || 1); if (py > 0 || (py === 0 && px > 0)) { px = -px; py = -py; }
    const bow = Math.min(160, Math.max(40, d * 0.22)), cx = (sx + ex) / 2 + px * bow, cy = Math.max(8, (sy + ey) / 2 + py * bow), end = Math.max(0.5, Math.min(1, t2.s / size));
    const kf = []; const N = 16;
    for (let i = 0; i <= N; i++) {
      const t = i / N, e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, u = 1 - e; // ease in and out along the arc
      const x = u * u * sx + 2 * u * e * cx + e * e * ex, y = u * u * sy + 2 * u * e * cy + e * e * ey, s = 1 + (end - 1) * e;
      kf.push({ transform: T(x, y, s, s, Math.sin(t * Math.PI) * -16), opacity: i === N ? 0.9 : 1, offset: t });
    }
    const a2 = el.animate(kf, { duration: CF_FLY, easing: 'linear', fill: 'forwards' }); g.anims.push(a2);
    a2.onfinish = () => jfLand(K, g, false);
  };
}
function coinFly(from, amount, o = {}) {
  amount = Math.max(0, Math.round(+amount || 0)); if (!S || !amount) return null;
  const la = CF.lastAdd, lg = la && la.n === amount && performance.now() - la.t < 50 ? la.a : amount; // the default: what the addCoins that paid this amount added
  const gain = Math.max(0, Math.min(S.coins, Math.round(o.gain != null ? +o.gain || 0 : lg)));
  const c = $('#coins'); if (c) c.classList.remove('bump'); // addCoins' own hop waits: the counter bumps when the coin lands
  CF.hold++; CF.pend += gain;
  cfShow(Math.min(CF.disp == null ? S.coins : CF.disp, S.coins - CF.pend)); // back to the number before this gain (never up: a gain earlier in this task may still be on its way)
  const g = { kind: 'coin', from, amount, gain, landed: false, flying: false, el: null, anims: [] }; CF.gs.push(g);
  if (cfCalm() || jfQuiet()) { g.silent = jfQuiet(); jfLand(JK.coin, g, true); return g; }
  const delay = Math.max(0, +o.delay || 0);
  g.wd = setTimeout(() => jfLand(JK.coin, g, true), delay + 4000); // never stuck: whatever happens, the gain shows within a few seconds
  g.dt = setTimeout(() => jfQueue(JK.coin, g), delay);
  return g;
}
// a Bond or XP gain (already in S): merges with the open gain of the same dog (Bond) or the open XP gain, then flies as one icon
function jfOpen(K, amount, o) {
  if (!(amount > 0)) return null;
  const st = K.st, id = o.id || null, now = performance.now();
  let g = st.gs.find((x) => x.open && !x.landed && (x.id || null) === id);
  if (g) { g.amount += amount; g.gain += amount; g.tiny = g.amount < (o.tiny || 0); if (o.from) g.from = o.from; return g; }
  const hint = st.hint && now - st.hint.t < 300 ? st.hint.from : null; st.hint = null;
  g = { kind: K.name, id, from: o.from || hint, alt: o.alt || null, amount, gain: amount, open: true, landed: false, flying: false, el: null, anims: [], tiny: amount < (o.tiny || 0) };
  st.gs.push(g);
  if (cfCalm() || document.hidden || jfQuiet()) { g.silent = jfQuiet(); jfLand(K, g, true); return g; } // no flight: the value simply changes, with a soft highlight (v2.29: silently under a scene)
  const wait = Math.max(o.merge || 0, o.every && st.at ? (st.at[id] || 0) + o.every - now : 0, +o.delay || 0);
  g.wd = setTimeout(() => jfLand(K, g, true), wait + 4000); // never stuck
  g.dt = setTimeout(() => { g.open = false; if (st.at) st.at[id] = performance.now(); if (!g.landed) jfQueue(K, g); }, wait);
  return g;
}
function juiceFly(kind, from, amount, o = {}) {
  if (kind === 'coin') return coinFly(from, amount, o);
  const K = JK[kind]; amount = Math.max(0, Math.round(+amount || 0)); if (!K || !S || !amount || cur.mode === 'title') return null;
  if (kind === 'bond') { const id = S.dog && S.dog.id; return jfOpen(K, amount, Object.assign({ id, merge: BJ_MERGE, every: BJ_EVERY, tiny: BJ_TINY, alt: () => bjDog(id) }, o, { from })); }
  const id = S.dog && S.dog.id; return jfOpen(K, amount, Object.assign({ merge: XJ_MERGE, alt: () => bjDog(id) }, o, { from }));
}
// the source of a Bond or XP gain just made (an open one takes it) or about to be made (within 300 ms)
function jfSrc(kind, from) {
  const K = JK[kind]; if (!K || !from) return; const st = K.st, open = st.gs.filter((g) => g.open && !g.landed);
  if (open.length) open.forEach((g) => { g.from = from; }); else st.hint = { from, t: performance.now() };
}
// addBond (00_core.js): n Bond points for S.dog; up: it reached a new Bond level (the level-up card celebrates it: no heart, and any still
// on their way for this dog land at once, quietly)
function bjGain(n, up) {
  if (!S || !S.dog || cur.mode === 'title') return;
  const id = S.dog.id;
  if (up) { BJ.gs.filter((g) => g.id === id).forEach((g) => { g.silent = true; jfLand(JK.bond, g, true); }); return; }
  jfOpen(JK.bond, Math.max(0, Math.round(+n || 0)), { id, merge: BJ_MERGE, every: BJ_EVERY, tiny: BJ_TINY, alt: () => bjDog(id) });
}
// lv:gain (51_levels.js): g = { src, n, up, stUp }. A level-up or a new star sticker has its own card, and the XP of a Bond level-up is part
// of the Bond celebration: no star then (any on the way land quietly). Returns true when the star is handled here (the wiggle waits for it)
function xjGain(g) {
  if (!g || !S) return false;
  if (g.up || g.stUp || g.src === 'bond') { XJ.gs.slice().forEach((x) => { x.silent = true; jfLand(JK.xp, x, true); }); return false; }
  const n = Math.max(0, Math.round(+g.n || 0)); if (!n) return false;
  const id = S.dog && S.dog.id; return !!jfOpen(JK.xp, n, { merge: XJ_MERGE, alt: () => bjDog(id) });
}
// everything lands at once, no effect left behind (back to the title, a hidden tab)
function cfFinishAll() { Object.values(JK).forEach((K) => K.st.gs.slice().forEach((g) => jfLand(K, g, true))); }
function cfReset() {
  Object.values(JK).forEach((K) => {
    const st = K.st;
    st.gs.slice().forEach((g) => { g.landed = true; g.open = false; clearTimeout(g.wd); clearTimeout(g.dt); (g.anims || []).forEach((a) => { try { a.cancel(); } catch (e) { /* gone */ } }); });
    st.gs = []; st.q = []; st.live = 0; clearTimeout(st.pt);
  });
  CF.hold = 0; CF.pend = 0; CF.disp = null; cancelAnimationFrame(CF.roll); CF.roll = 0;
  if (CF.layer) CF.layer.innerHTML = '';
  if (S) { const el = cfNum(); if (el) el.textContent = tnum(S.coins); try { bjShow(); xjShow(); } catch (e) { /* no HUD yet */ } }
}
// v2.29: a scene starting (a chapter's end, a big moment) lands whatever is still in the air, quietly, before it covers the screen
on('sc:start', () => { if (!Object.values(JK).some((K) => K.st.gs.length)) return; Object.values(JK).forEach((K) => K.st.gs.forEach((g) => { g.silent = true; })); cfFinishAll(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && Object.values(JK).some((K) => K.st.gs.length)) cfFinishAll(); });
// a screen that hides a meter mid-flight (a mini-game, the title): the icons in the air land at once, nothing is left on screen
setInterval(() => {
  if (!Object.values(JK).some((K) => K.st.live)) return;
  if (!S || cur.mode === 'title') { cfReset(); return; }
  Object.values(JK).forEach((K) => { if (K.st.live && !K.target()) K.st.gs.filter((g) => g.flying && !g.tgOff).forEach((g) => jfLand(K, g, true)); });
}, 120);
const cfExpose = () => { if (window.__paw && !window.__paw.cf) window.__paw.cf = cfHook(); if (window.__paw && !window.__paw.jf) window.__paw.jf = jfHook(); };
on('game:ready', cfExpose); on('yard:enter', cfExpose);
const cfIcons = (k) => { const L = $('#cfLayer'); return L ? L.querySelectorAll(k === 'coin' ? '.cf-coin' : '.' + JK[k].cls).length : 0; };
const cfHook = () => ({ fly: (f, n, o) => !!coinFly(f, n, o), state: () => ({ hold: CF.hold, pend: CF.pend, live: CF.live, q: CF.q.length, disp: CF.disp, roll: !!CF.roll, coins: cfIcons('coin') }), calm: () => cfCalm(), target: () => cfTarget(), finish: () => cfFinishAll(), reset: () => cfReset() });
const jfHook = () => ({
  fly: (k, f, n, o) => !!juiceFly(k, f, n, o), src: (k, f) => jfSrc(k, f), target: (k) => (JK[k] ? JK[k].target() : null),
  state: (k) => { const K = JK[k]; if (!K) return null; const st = K.st; return { gs: st.gs.length, open: st.gs.filter((g) => g.open).length, live: st.live, q: st.q.length, pend: k === 'coin' ? CF.pend : k === 'bond' ? bjPend() : xjPend(), icons: cfIcons(k) }; },
  idle: () => Object.values(JK).every((K) => !K.st.gs.length && !K.st.live) && !CF.roll && !($('#cfLayer') && $('#cfLayer').children.length),
  bond: (n) => addBond(n, { raw: true }), finish: () => cfFinishAll(), reset: () => cfReset(), consts: { BJ_MERGE, BJ_EVERY, BJ_TINY, XJ_MERGE, CF_MAX }
});
