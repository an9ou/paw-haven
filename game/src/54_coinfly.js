/* ======================= v2.25.2 "Shiny coins": 54_coinfly.js (tag cf) =======================
   One shared helper that makes a coin gain feel good, instead of the number just changing (owner, 15 Nov 2026):
     1. the coin pops at the source (squash and stretch), 2. a small crayon sparkle, 3. it flies on a curved arc to the coin counter in the
     top bar, 4. the counter bumps (squash) and its number rolls up to the new total, 5. a soft chime (PawAudio.coin, a touch higher for more).
   Exactly ONE coin flies per gain, never a shower, however big the gain (owner). The game's own crayon coin (ICON('coin')) and its spark doodle.

   coinFly(from, amount, o)   call it right after the addCoins / addCoinsD it shows (same task: the counter is set back before the next paint)
     from     the element the coin pops from (its centre), a point { x, y } in client px, or null (the coin pops on the counter itself)
     amount   the coins the text shows (the chime's pitch); 0 does nothing
     o.gain   how much S.coins actually went up for this gain (default amount; less when coins settled a refund, 52_kindshop.js)
     o.delay  ms before the coin pops (a sheet that is still opening); the counter holds the old number meanwhile
   The balance is already right (addCoins): this is display only, and the roll always ends exactly on S.coins.
   The counter not visible on this screen: a pop at the source, no flight. No source either: just the chime and the new number.
   Reduce motion (html[data-motion="off"] or prefers-reduced-motion): no pop, flight or squash; the number changes with a soft highlight.
   Several gains at once: at most CF_MAX coins in the air, the rest wait (a long wait merges into one coin). Effects are transform/opacity only,
   pointer-events none, in their own fixed layer, and never outlive the game screen (back to the title, a hidden tab: everything lands at once).
   Rolled out for walk results (09_walk_classic.js, 18_mod_walk_toys.js) and missions (24_missions.js). State: CF in 00_core.js. Hook: __paw.cf. */
const CF_MAX = 2, CF_GAP = 150, CF_POP = 230, CF_FLY = 640, CF_ROLL = 700;
function cfCalm() { const m = document.documentElement.dataset.motion; return m === 'off' || (m !== 'on' && !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)); }
function cfNum() { return $('#coinNum'); }
function cfShow(v) { CF.disp = v; const el = cfNum(), t = tnum(Math.max(0, Math.round(v))); if (el && el.textContent !== t) el.textContent = t; }
// the counter's coin icon, if a player can see it on this screen (client px), else null
function cfTarget() {
  const c = $('#coins'), ic = $('#coinIc') || c; if (!c || !ic || hud.hidden || !c.offsetParent) return null;
  const cs = getComputedStyle(c); if (cs.visibility === 'hidden' || +cs.opacity === 0) return null;
  const r = ic.getBoundingClientRect(); if (r.width < 4 || r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, s: r.height };
}
function cfFrom(f) {
  if (!f) return null;
  if (f.nodeType === 1) {
    if (!f.isConnected) return null; const r = f.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return null; // a queued toast (display none), a closed sheet
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return Number.isFinite(+f.x) && Number.isFinite(+f.y) ? { x: +f.x, y: +f.y } : null;
}
function cfLayer() {
  if (CF.layer && CF.layer.isConnected) return CF.layer;
  const l = document.createElement('div'); l.id = 'cfLayer'; l.setAttribute('aria-hidden', 'true'); document.body.appendChild(l); CF.layer = l; return l;
}
function cfChime(amount) { try { const A = window.PawAudio; if (A && typeof A.coin === 'function') A.coin(amount); } catch (e) { /* audio never breaks a coin */ } }
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
    const target = S.coins - CF.pend, p = Math.min(1, (now - t0) / CF_ROLL), e = 1 - Math.pow(1 - p, 3);
    if (p >= 1 || target <= from) { cfShow(target); CF.roll = 0; if (!CF.hold) { CF.disp = null; cfShow(S.coins); CF.disp = null; } return; }
    cfShow(from + (target - from) * e); CF.roll = requestAnimationFrame(step);
  };
  CF.roll = requestAnimationFrame(step);
}
function cfHit(tg) {
  const c = $('#coins'); if (!c) return;
  if (cfCalm()) { c.classList.remove('cf-glow'); void c.offsetWidth; c.classList.add('cf-glow'); clearTimeout(c._cfg); c._cfg = setTimeout(() => c.classList.remove('cf-glow'), 900); return; }
  c.classList.remove('bump', 'cf-hit'); void c.offsetWidth; c.classList.add('cf-hit'); clearTimeout(c._cfh); c._cfh = setTimeout(() => c.classList.remove('cf-hit'), 420);
  if (tg) cfSpark(tg.x, tg.y, tg.s * 2.1);
}
// a gain arrives: its coins leave the "on its way" sum, the counter bumps and rolls up, the chime plays
function cfLand(g, quick) {
  if (g.landed) return; g.landed = true; clearTimeout(g.wd); clearTimeout(g.dt);
  (g.anims || []).forEach((a) => { try { a.cancel(); } catch (e) { /* gone */ } }); if (g.el) g.el.remove();
  if (g.flying) { g.flying = false; CF.live = Math.max(0, CF.live - 1); }
  CF.gs = CF.gs.filter((x) => x !== g); CF.q = CF.q.filter((x) => x !== g);
  CF.pend = Math.max(0, CF.pend - g.gain); CF.hold = Math.max(0, CF.hold - 1);
  if (!S) { cfReset(); return; }
  const tg = cfTarget(); if (tg && !g.noHit) cfHit(quick ? null : tg);
  if (!g.silent) cfChime(g.amount);
  if (!quick) cfRoll();
  else if (!CF.roll) { cfShow(S.coins - CF.pend); if (!CF.hold) CF.disp = null; } // calm, a hidden counter, a merged or late gain: the number simply changes (a roll already running takes it along)
  cfPump();
}
function cfPump() {
  if (!CF.q.length || CF.live >= CF_MAX) return;
  const wait = CF.last + CF_GAP - performance.now(); if (wait > 0) { clearTimeout(CF.pt); CF.pt = setTimeout(cfPump, wait + 5); return; }
  cfLaunch(CF.q.shift()); if (CF.q.length) { clearTimeout(CF.pt); CF.pt = setTimeout(cfPump, CF_GAP + 5); }
}
function cfQueue(g) {
  if (g.landed) return;
  if (CF.live < CF_MAX && !CF.q.length && performance.now() - CF.last >= CF_GAP) { cfLaunch(g); return; }
  const last = CF.q[CF.q.length - 1];
  if (CF.q.length >= 2 && last) { last.amount += g.amount; last.gain += g.gain; g.gain = 0; g.silent = true; g.noHit = true; cfLand(g, true); return; } // a long wait: the waiting gains share one coin
  CF.q.push(g); cfPump();
}
// the coin: a pop with squash and stretch at the source, then the arc to the counter (sampled keyframes on transform; opacity at the ends)
function cfLaunch(g) {
  if (g.landed) return;
  if (!S || cur.mode === 'title') { cfLand(g, true); return; }
  const tg = cfTarget(), src = cfFrom(g.from) || (tg ? { x: tg.x, y: tg.y, here: true } : null);
  if (!src || cfCalm() || document.hidden) { cfLand(g, true); return; }
  CF.last = performance.now(); g.flying = true; CF.live++;
  const size = Math.round(Math.max(26, Math.min(44, (tg ? tg.s : 30) * 1.3))), el = document.createElement('div');
  el.className = 'cf-coin'; el.innerHTML = ICON('coin'); el.style.width = el.style.height = size + 'px'; el.style.left = (-size / 2) + 'px'; el.style.top = (-size / 2) + 'px';
  cfLayer().appendChild(el); g.el = el;
  const T = (x, y, sx, sy, r) => `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(r || 0).toFixed(1)}deg) scale(${sx.toFixed(3)},${sy.toFixed(3)})`;
  const k0 = src.here ? 0.85 : 1; // on the counter itself the pop stays small
  const pop = [{ transform: T(src.x, src.y, 0.2, 0.2), opacity: 0 }, { transform: T(src.x, src.y - 6, 0.82 * k0, 1.3 * k0, -6), opacity: 1, offset: 0.4 }, { transform: T(src.x, src.y - 2, 1.22 * k0, 0.8 * k0, 4), opacity: 1, offset: 0.72 }, { transform: T(src.x, src.y - 4, k0, k0), opacity: 1 }];
  const a1 = el.animate(pop, { duration: CF_POP, easing: 'ease-out', fill: 'forwards' }); g.anims = [a1];
  cfSpark(src.x, src.y - 4, size * 2.2);
  if (!tg || src.here) { g.tgOff = !tg; // no counter in sight (or the coin is already on it): a short hold after the pop, then it lands where it is
    a1.onfinish = () => { if (g.landed) return; const a2 = el.animate([{ transform: T(src.x, src.y - 4, k0, k0), opacity: 1 }, { transform: T(src.x, src.y - 12, 0.6, 0.6), opacity: 0 }], { duration: 260, easing: 'ease-in', fill: 'forwards' }); g.anims.push(a2); a2.onfinish = () => cfLand(g, !tg); };
    return;
  }
  a1.onfinish = () => {
    if (g.landed) return;
    const t2 = cfTarget(); if (!t2) { cfLand(g, true); return; } // the counter went away during the pop
    const sx = src.x, sy = src.y - 4, ex = t2.x, ey = t2.y, d = Math.hypot(ex - sx, ey - sy);
    const cx = sx + (ex - sx) * 0.18, cy = Math.max(8, Math.min(sy, ey) - Math.min(140, Math.max(36, d * 0.14))), end = Math.max(0.5, Math.min(1, t2.s / size));
    const kf = []; const N = 16;
    for (let i = 0; i <= N; i++) {
      const t = i / N, e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, u = 1 - e; // ease in and out along the arc
      const x = u * u * sx + 2 * u * e * cx + e * e * ex, y = u * u * sy + 2 * u * e * cy + e * e * ey, s = 1 + (end - 1) * e;
      kf.push({ transform: T(x, y, s, s, Math.sin(t * Math.PI) * -16), opacity: i === N ? 0.9 : 1, offset: t });
    }
    const a2 = el.animate(kf, { duration: CF_FLY, easing: 'linear', fill: 'forwards' }); g.anims.push(a2);
    a2.onfinish = () => cfLand(g, false);
  };
}
function coinFly(from, amount, o = {}) {
  amount = Math.max(0, Math.round(+amount || 0)); if (!S || !amount) return null;
  const gain = Math.max(0, Math.min(S.coins, Math.round(o.gain != null ? +o.gain || 0 : amount)));
  const c = $('#coins'); if (c) c.classList.remove('bump'); // addCoins' own hop waits: the counter bumps when the coin lands
  CF.hold++; CF.pend += gain;
  cfShow(Math.min(CF.disp == null ? S.coins : CF.disp, S.coins - CF.pend)); // back to the number before this gain (never up: a gain earlier in this task may still be on its way)
  const g = { from, amount, gain, landed: false, flying: false, el: null, anims: [] }; CF.gs.push(g);
  if (cfCalm()) { cfLand(g, true); return g; }
  const delay = Math.max(0, +o.delay || 0);
  g.wd = setTimeout(() => cfLand(g, true), delay + 3200); // never stuck: whatever happens, the gain shows within a few seconds
  g.dt = setTimeout(() => cfQueue(g), delay);
  return g;
}
// everything lands at once, no effect left behind (back to the title, a hidden tab)
function cfFinishAll() { CF.gs.slice().forEach((g) => cfLand(g, true)); }
function cfReset() {
  CF.gs.slice().forEach((g) => { g.landed = true; clearTimeout(g.wd); clearTimeout(g.dt); (g.anims || []).forEach((a) => { try { a.cancel(); } catch (e) { /* gone */ } }); });
  CF.gs = []; CF.q = []; CF.hold = 0; CF.pend = 0; CF.live = 0; CF.disp = null; cancelAnimationFrame(CF.roll); CF.roll = 0; clearTimeout(CF.pt);
  if (CF.layer) CF.layer.innerHTML = '';
  if (S) { const el = cfNum(); if (el) el.textContent = tnum(S.coins); }
}
document.addEventListener('visibilitychange', () => { if (document.hidden && CF.gs.length) cfFinishAll(); });
// a screen that hides the counter mid-flight (a mini-game, the title): the coins in the air land at once, nothing is left on screen
setInterval(() => { if (!CF.live) return; if (!S || cur.mode === 'title') cfReset(); else if (!cfTarget()) CF.gs.filter((g) => g.flying && !g.tgOff).forEach((g) => cfLand(g, true)); }, 120);
const cfExpose = () => { if (window.__paw && !window.__paw.cf) window.__paw.cf = cfHook(); };
on('game:ready', cfExpose); on('yard:enter', cfExpose);
const cfHook = () => ({ fly: (f, n, o) => !!coinFly(f, n, o), state: () => ({ hold: CF.hold, pend: CF.pend, live: CF.live, q: CF.q.length, disp: CF.disp, roll: !!CF.roll, coins: $('#cfLayer') ? $('#cfLayer').querySelectorAll('.cf-coin').length : 0 }), calm: () => cfCalm(), target: () => cfTarget(), finish: () => cfFinishAll(), reset: () => cfReset() });
