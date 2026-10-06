/* ======================= v2.4: 25_guide.js (GUIDE lane, tag gd) =======================
   Gerald the duck's first-day walkthrough for new saves, the Journal "How to play" tab, the one-time letter for older saves.
   Spec: V24.md section 5. Data: S.guide, S.guideSeen, S.guideLetter. API: gdStart(), gdTabHTML(), gdActive().
   The card lives in #gdLayer (inside #stage, pointer-events off except its buttons). A 300 ms tick hides it while a modal, tray or walk
   is open, advances the map and walk steps on the mode change, and re-measures so the card never covers #dogHit or the ringed button. */
// step: key, Gerald's pose, text ({dog} = the dog's name), ring target(s) (first one on screen wins), act kinds that advance it
const GD_STEPS = [
  { k: 'hello', pose: 'wave', t: 'I am Gerald. I live by the river and I know everything. Let me show you around.' },
  { k: 'feed', pose: 'point', t: 'Tap Feed, then tap a food. {dog} is always a little bit hungry.', ring: ['#bar [data-act=feed]'], on: ['feed'] },
  { k: 'pet', pose: 'point', t: 'Rub {dog} with your finger or mouse. The tail will tell you when it is enough.', ring: ['#dogHit'], on: ['pet'] },
  { k: 'nap', pose: 'point', t: 'Care has the bath and the nap. Naps refill Energy. Better houses mean faster naps.', ring: ['#bar [data-act=care]'], on: ['nap'] },
  { k: 'map', pose: 'point', t: 'The Map goes everywhere: the park, the river, Market Street. Some places unlock with Bond.', ring: ['#bar [data-act=map]'] },
  { k: 'walk', pose: 'point', t: 'Walks earn the most coins and hide treasure. Try the Sunny Park.', ring: ['#bar [data-act=walk]'], on: ['walk'] },
  { k: 'shops', pose: 'sit', t: 'Market Street has three shops and Pip\'s Sprout Cart. Food at Kibble Corner, clothes at the Boutique, houses at Barkitecture.' },
  { k: 'garden', pose: 'sit', t: 'At Bond 2 the veggie patch opens. Grow carrots, feed them to {dog}. Nothing toxic can be planted. Ever.' },
  { k: 'missions', pose: 'point', t: 'Three little missions a day, about 15 coins each. Three done is a stamp. Seven stamps is a surprise.', ring: ['#msCardG', '#bar [data-act=journal]'] },
  { k: 'done', pose: 'cheer', t: 'That is everything. It is in your Journal under How to play, if you forget. I will be by the river.' }
];
// the Journal page: the 8 lessons (action icon, 2 to 3 sentences)
const GD_LESSONS = [
  ['feed', 'feed', 'Feed', 'Tap Feed, then tap a food. Fresh Water fills the bowl. Every dog has a favourite food, and the tail says which.'],
  ['pet', 'bond', 'Pet', 'Rub your dog with your finger or the mouse. A good petting session gives Bond. The tail tells you when it is enough.'],
  ['nap', 'sleep', 'Bath and nap', 'Care has the bath and the nap. Naps refill Energy. Better houses mean faster naps.'],
  ['map', 'map', 'Map', 'The Map goes everywhere: the park, the river, Market Street. Some places unlock with Bond.'],
  ['walk', 'walk', 'Walks', 'Walks earn the most coins and hide treasure. New routes open as your Bond grows.'],
  ['shops', 'coin', 'Shops', 'Market Street has three shops and Pip\'s Sprout Cart. Food at Kibble Corner, clothes at the Boutique, houses at Barkitecture.'],
  ['garden', 'garden', 'Garden', 'At Bond 2 the veggie patch opens. Grow carrots and feed them to your dog. Nothing toxic can be planted. Ever.'],
  ['missions', 'missions', 'Daily missions', 'Three little missions a day, about 15 coins each. Three done is a stamp. Seven stamps is a surprise.']
];
const gd = { on: false, timer: 0, shown: -1, place: '', ringKey: '', layer: null, force: false };
function gdFields() { if (!S) return; if (!S.guide || typeof S.guide !== 'object') S.guide = S.guideSeen ? { step: -1, done: localISO() } : { step: 0 }; if (typeof S.guide.step !== 'number') S.guide.step = 0; }
function gdLive() { return !!(S && S.guide && S.guide.step >= 0 && S.guide.step < GD_STEPS.length && !S.guide.done && !S.guide.skipped); }
// under the test harness the walkthrough only runs when a suite asks for it (prefs.gdTest), so the other suites' clicks are never in its way
function gdAllowed() { return !navigator.webdriver || !!prefs.gdTest; }
function gdActive() { return !!(gd.layer && gd.on && !gd.layer.querySelector('.gd-card').hidden); }

/* ---------- art: Gerald (WORLD ART) or a crude crayon duck doodle, the crayon ring ---------- */
function gdDuck(pose) {
  const real = artReal('prop', 'gerald', { pose }); if (real) return real;
  // fallback: flat yellow crayon fill drifting off a two-stroke pencil outline (the doodle() hand)
  const two = (d, fill, w = 2.4) => `<path d="${d}" fill="${fill}" stroke="none" transform="translate(3 2)"/><path d="${d}" fill="none" stroke="${INKG}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${INKG}" stroke-width="1.1" opacity=".5" transform="translate(-1.2 .8)" stroke-linecap="round"/>`;
  const body = 'M38 112 Q30 84 58 78 Q80 74 104 82 Q132 86 138 74 Q144 98 128 116 Q110 136 72 134 Q44 132 38 112Z';
  const head = 'M56 80 Q42 56 54 38 Q68 22 86 32 Q98 42 92 62 Q88 74 80 82Z';
  const beak = 'M50 46 Q36 46 26 52 Q36 58 52 56Z';
  const wing = { wave: 'M96 96 Q98 70 120 52 Q136 50 132 66 Q126 86 104 100Z', cheer: 'M94 94 Q94 62 112 42 Q128 38 126 56 Q120 82 102 98Z', point: 'M70 100 Q48 96 24 104 Q40 112 62 112 Q72 110 76 106Z', sit: 'M74 96 Q96 90 116 104 Q100 116 80 110Z' }[pose] || 'M74 96 Q96 90 116 104 Q100 116 80 110Z';
  const legs = pose === 'sit' ? '' : `<path d="M66 132 L62 148 M58 148 L70 148 M92 132 L94 148 M88 148 L100 148" stroke="#F4A262" stroke-width="4" stroke-linecap="round"/><path d="M66 132 L62 148 M92 132 L94 148" stroke="${INKG}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`;
  const hat = pose === 'cheer' ? `<path d="M30 36 Q36 30 42 34" fill="none" stroke="${INKG}" stroke-width="2" stroke-linecap="round"/><path d="M122 22 l4 -8 M130 28 l8 -4" stroke="${INKG}" stroke-width="2" stroke-linecap="round"/>` : '';
  return `<svg viewBox="0 0 160 160" class="gd-doodle" aria-hidden="true">${legs}${two(body, '#FFE3A1')}${two(wing, '#F2C744', 2)}${two(head, '#FFE3A1')}${two(beak, '#F4A262', 2)}<circle cx="68" cy="46" r="3.6" fill="${INKG}"/><circle cx="69.3" cy="44.8" r="1.1" fill="#FFFBF3"/><path d="M60 38 Q66 34 72 37" fill="none" stroke="${INKG}" stroke-width="1.6" stroke-linecap="round"/>${hat}<path d="M50 120 l8 -3 M58 124 l8 -3 M66 127 l8 -3" stroke="${INKG}" stroke-width="1" opacity=".35"/></svg>`;
}
function gdRingSVG(W, H, seed) {
  const n = 46, pts = Array.from({ length: n }, (_, i) => [W / 2 + Math.cos(i / n * 6.283 - 1.9) * (W / 2 - 5), H / 2 + Math.sin(i / n * 6.283 - 1.9) * (H / 2 - 5)]);
  return pencilSVG(W, H, pts, seed, true, 2.6).replace('preserveAspectRatio="none"', 'preserveAspectRatio="none" aria-hidden="true"').replace(`stroke="${INKG}"`, 'stroke="#F4A262"').replace('stroke-width="2.3"', 'stroke-width="5"').replace('stroke-width="1.2" opacity=".55"', 'stroke-width="2.6" opacity=".8"');
}
// the torn sketchbook note behind the card: ragged top and bottom edge, faint ruled lines, a pencil outline
function gdPaper() {
  const rnd = seeded(907), W = 600, H = 200, top = [], bot = [];
  for (let x = 0; x <= W; x += 12) { top.push([x, 6 + rnd() * 7]); bot.push([W - x, H - 6 - rnd() * 7]); }
  const pts = top.concat([[W - 2, 40], [W - 3, 160]], bot, [[2, 160], [3, 40]]), d = 'M' + pts.map((p) => f1(p[0]) + ' ' + f1(p[1])).join(' L') + 'Z';
  const lines = [52, 84, 116, 148].map((y) => `<path d="M14 ${y} L${W - 14} ${y + 1}" stroke="#CBE0F4" stroke-width="1.4"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${d}" fill="#FFFBF3"/>${lines}<path d="M44 14 L46 ${H - 14}" stroke="#F9D0D9" stroke-width="1.6"/><path d="${d}" fill="none" stroke="${INKG}" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><path d="${d}" fill="none" stroke="${INKG}" stroke-width="1" opacity=".45" transform="translate(1.5 1)" vector-effect="non-scaling-stroke"/></svg>`;
}
function gdDots(i) { return GD_STEPS.map((_, j) => `<svg viewBox="-8 -8 16 16" class="gd-dot${j === i ? ' on' : ''}" aria-hidden="true"><circle r="${j === i ? 5.6 : 4.2}" fill="${j < i ? '#C8E9CF' : j === i ? '#F2C744' : '#FFFBF3'}" stroke="${INKG}" stroke-width="1.6"/></svg>`).join(''); }

/* ---------- the card ---------- */
function gdLayer() {
  if (gd.layer && gd.layer.isConnected) return gd.layer;
  document.documentElement.style.setProperty('--gd-paper', svgURI(gdPaper()));
  const L = document.createElement('div'); L.id = 'gdLayer';
  L.innerHTML = '<div class="gd-ring" hidden></div><div class="gd-card" role="region" aria-label="Gerald the duck" aria-live="polite" hidden><div class="gd-duck"></div><div class="gd-main"><div class="gd-say"><p class="gd-txt"></p></div><div class="gd-row"><span class="gd-dots"></span><span class="gd-btns"><button class="btn gd-skip" type="button" aria-label="Skip the guide"><span class="gd-skl">Skip the guide</span><span class="gd-sks">Skip</span></button><button class="btn yes gd-next" type="button">Next</button></span></div></div></div>';
  stage.appendChild(L); gd.layer = L;
  $('.gd-next', L).onclick = (e) => { e.stopPropagation(); SFX.boop(640); gdNext(); };
  $('.gd-skip', L).onclick = (e) => { e.stopPropagation(); SFX.click(); gdSkip(); };
  return L;
}
function gdText(i) { return esc(GD_STEPS[i].t).replace(/\{dog\}/g, esc(NAME())); }
function gdRender() {
  const L = gdLayer(), i = S.guide.step, st = GD_STEPS[i], c = $('.gd-card', L);
  c.dataset.step = i; c.dataset.k = st.k;
  $('.gd-duck', c).innerHTML = gdDuck(st.pose); $('.gd-txt', c).innerHTML = gdText(i);
  $('.gd-dots', c).innerHTML = gdDots(i); $('.gd-dots', c).setAttribute('aria-label', `Step ${i + 1} of ${GD_STEPS.length}`);
  $('.gd-next', c).textContent = i === GD_STEPS.length - 1 ? 'Bye, Gerald' : 'Next'; $('.gd-skip', c).hidden = i === GD_STEPS.length - 1;
  gd.shown = i; gd.place = ''; gd.ringKey = '';
  c.classList.remove('gd-in'); void c.offsetWidth; c.classList.add('gd-in');
}
const gdR = (e) => { const r = e.getBoundingClientRect(), s = stage.getBoundingClientRect(); return { l: r.left - s.left, t: r.top - s.top, r: r.right - s.left, b: r.bottom - s.top, w: r.width, h: r.height }; };
const gdHit = (a, b, m = 0) => !!a && !!b && a.l < b.r + m && a.r > b.l - m && a.t < b.b + m && a.b > b.t - m;
const gdArea = (a, b) => (!a || !b) ? 0 : Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
function gdTarget(i) {
  for (const sel of GD_STEPS[i].ring || []) {
    const e = $(sel); if (!e) continue; const r = gdR(e), v = gdR(view);
    if (r.w < 2 || r.h < 2) continue;
    if (!sel.startsWith('#bar') && (r.r < v.l + 4 || r.l > v.r - 4 || r.b < v.t + 4 || r.t > v.b - 4)) continue; // a scene prop panned out of the crop
    return { e, r, sel };
  }
  return null;
}
// spots for the card: above the dock (bottom of the scene) first, then under the HUD. Hard rules: never on #dogHit, the ringed target or the place buttons.
// Soft: stay off the location chip, the bowl, the mailbox and the missions clipboard. Re-measured every tick, moved only when its spot stops being clear.
const GD_HARD = ['#placeBtns .btn', '#devBtn'], GD_SOFT = ['#status', '#bowlG', '#mailboxG', '#msCardG'];
function gdPlace(force) {
  const c = $('.gd-card', gd.layer); const v = gdR(view), dh = $('#dogHit'), dog = dh ? gdR(dh) : null, tg = gdTarget(S.guide.step), tr = tg && tg.sel !== '#dogHit' ? tg.r : null;
  const cw = c.offsetWidth, ch = c.offsetHeight, ph = isPhone();
  const rects = (sels) => sels.flatMap((s) => [...document.querySelectorAll(s)]).filter((e) => e.getClientRects().length).map(gdR);
  const hard = rects(GD_HARD), soft = rects(GD_SOFT);
  const clear = (q) => !gdHit(q, dog, 6) && !gdHit(q, tr, 4) && !hard.some((h) => gdHit(q, h, 4));
  const cur0 = c.style.left ? { l: c.offsetLeft, t: c.offsetTop, r: c.offsetLeft + cw, b: c.offsetTop + ch } : null;
  if (!force && cur0 && clear(cur0) && gd.place === `${v.w}x${v.h}`) return; // still fine where it is
  let bottom = v.b - 10; const tray = dock.querySelector(':scope > .tray:not(.dock-idle)');
  if (tray && getComputedStyle(dock).display !== 'none') { const tq = gdR(tray); if (tq.h > 2 && tq.t < bottom && tq.t > v.t + ch) bottom = tq.t - 10; }
  const m = ph ? 8 : 18, L0 = v.l + m, R0 = v.r - cw - m, C0 = v.l + (v.w - cw) / 2;
  const spots = ph ? [[bottom - ch, L0, 'bottom'], [v.t + 8, L0, 'top']] : [[bottom - ch, L0, 'bottom'], [bottom - ch, R0, 'bottom'], [bottom - ch, C0, 'bottom'], [v.t + 12, R0, 'top'], [v.t + 12, L0, 'top'], [v.t + 12, C0, 'top']];
  let best = null;
  spots.forEach(([t, l, at], k) => {
    const q = { l, t, r: l + cw, b: t + ch, at };
    q.cost = (clear(q) ? 0 : 1e7) + gdArea(q, dog) * 50 + gdArea(q, tr) * 20 + hard.reduce((a, h) => a + gdArea(q, h) * 20, 0) + soft.reduce((a, h) => a + gdArea(q, h), 0) + k;
    if (!best || q.cost < best.cost) best = q;
  });
  c.style.left = Math.round(best.l) + 'px'; c.style.top = Math.round(best.t) + 'px'; c.dataset.at = best.at; gd.place = `${v.w}x${v.h}`;
}
function gdRing() {
  const ring = $('.gd-ring', gd.layer), tg = gdTarget(S.guide.step);
  if (!tg) { ring.hidden = true; gd.ringKey = ''; return; }
  const pad = tg.sel === '#dogHit' ? 10 : 8, r = tg.r, W = Math.round(r.w + pad * 2), H = Math.round(r.h + pad * 2), key = `${S.guide.step}|${W}x${H}`;
  if (key !== gd.ringKey) { ring.innerHTML = gdRingSVG(W, H, 71 + S.guide.step * 13); gd.ringKey = key; }
  ring.dataset.for = tg.sel; ring.style.left = Math.round(r.l - pad) + 'px'; ring.style.top = Math.round(r.t - pad) + 'px'; ring.style.width = W + 'px'; ring.style.height = H + 'px'; ring.hidden = false;
}
function gdPaused() { return cur.mode !== 'yard' || !modal.hidden || popOpen() || hud.hidden || bar.hidden || !titleEl.hidden || (typeof phPeekOn !== 'undefined' && phPeekOn); }
function gdTick() {
  if (!S || !gdLive() || !gdAllowed()) { gdStop(); return; }
  const i = S.guide.step;
  if (i === 4 && (cur.mode === 'map' || cur.mode === 'routes' || cur.mode === 'walk')) return gdGo(5, true); // entering the map (or going straight to a walk) counts
  if (i === 5 && cur.mode === 'walk') return gdGo(6, true); // a walk started: the card waits for the yard
  const L = gdLayer(), c = $('.gd-card', L), ring = $('.gd-ring', L);
  if (gdPaused()) { c.hidden = true; ring.hidden = true; gdToasts(false); return; }
  const was = c.hidden; if (gd.shown !== i) gdRender();
  c.hidden = false; gdPlace(was || gd.force); gd.force = false; gdRing(); gdToasts(c.dataset.at === 'top');
}
function gdGo(i, quiet) {
  if (!gdLive()) return; S.guide.step = i; markDirty();
  if (!quiet) gdTick();
}
function gdNext() { if (!S || !S.guide) return; const i = S.guide.step; if (i >= GD_STEPS.length - 1) { gdBye(); return; } gdGo(i + 1); }
function gdBye() {
  if (S && S.guide) { S.guide.done = localISO(); markDirty(); }
  const L = gd.layer; if (L) { $('.gd-duck', L).innerHTML = gdDuck('wave'); $('.gd-ring', L).hidden = true; $('.gd-card', L).classList.add('gd-out'); }
  gd.on = false; clearInterval(gd.timer); gd.timer = 0; gdToasts(false); setTimeout(gdStop, 600);
}
function gdSkip() {
  if (!S || !S.guide) return; S.guide.skipped = localISO(); markDirty(); gdStop();
  toast('Gerald waddles back to the river. The guide is in your Journal, under How to play.');
}
// phones: while the strip sits under the HUD, the toasts drop below it (28_guide.css reads --gdToastTop)
function gdToasts(top) {
  const on = !!top && isPhone(); stage.classList.toggle('gd-top', on);
  if (on) { const c = $('.gd-card', gd.layer); stage.style.setProperty('--gdToastTop', Math.round(c.offsetTop + c.offsetHeight + 10) + 'px'); }
}
function gdStop() { gdToasts(false); gd.on = false; clearInterval(gd.timer); gd.timer = 0; gd.shown = -1; if (gd.layer) { $('.gd-card', gd.layer).hidden = true; $('.gd-card', gd.layer).classList.remove('gd-out'); $('.gd-ring', gd.layer).hidden = true; } }
function gdStart() {
  if (!S) return; gdFields(); if (!gdLive() || !gdAllowed()) return;
  gdLayer(); gd.on = true; gd.shown = -1; gd.force = true;
  if (!gd.timer) gd.timer = setInterval(gdTick, 300);
  gdTick();
}
on('act', (d) => {
  if (!gd.on || !gdLive() || !d) return; const st = GD_STEPS[S.guide.step];
  if (st.on && st.on.includes(d.kind)) gdGo(S.guide.step + 1, true); // the tick shows the next step once the tray or popup is gone
});
window.addEventListener('resize', () => { if (gd.on) { gd.force = true; gd.ringKey = ''; } });

/* ---------- older saves: one letter, never the walkthrough ---------- */
function gdLetter() {
  if (!S || !S.guideSeen || S.guideLetter || typeof mailPush !== 'function') return;
  mailPush({ kind: 'news', from: 'Gerald the duck', title: 'New: How to play guide in your Journal.', text: 'I wrote down how everything works. It is in your Journal, under How to play. I still want my sandwich back.' });
  S.guideLetter = localISO(); markDirty();
}
on('yard:enter', () => { if (gdLive() && gdAllowed() && !gd.on) gdStart(); }); // a reloaded save mid-guide: Continue on the title screen lands here
on('game:ready', () => { gdFields(); gdLetter(); if (gdLive()) setTimeout(() => { if (cur.mode === 'yard' || cur.mode === 'map') gdStart(); }, 1200); });

/* ---------- the Journal "How to play" page ---------- */
function gdTabHTML() {
  const ic = (n, act) => `<span class="gd-lic">${n === 'missions' ? iconOr('missions', '<path d="M-9 -12h18v24h-18z" fill="#FFF4DF" stroke="#5B3D32" stroke-width="2"/><path d="M-5 0l4 4l7 -9" fill="none" stroke="#5B3D32" stroke-width="2.4" stroke-linecap="round"/>') : n === 'garden' ? iconOr('garden', doodle('flower', 0, 0, 1)) : n === 'bond' ? iconOr('bond', doodle('heart', 0, 0, 1)) : ICON(n)}<span class="gd-lring">${gdRingSVG(64, 64, 300 + act)}</span></span>`;
  const cards = GD_LESSONS.map(([k, icon, title, txt], j) => `<li class="gd-lesson" data-lesson="${k}">${ic(icon, j)}<div><b>${esc(title)}</b><p>${esc(txt)}</p></div></li>`).join('');
  return `<div class="gd-page"><div class="gd-head"><div class="gd-duck">${gdDuck('sit')}</div><div class="gd-say"><p><b>Gerald's notes.</b> Everything a new dog friend needs, written down by a duck who knows everything. You are welcome.</p></div></div>
    <ol class="gd-lessons">${cards}</ol>
    <p class="gd-replay"><button class="btn yes" id="gdReplay" type="button">Replay the guide</button></p></div>`;
}
function gdReplay() {
  if (!S) return; S.guide = { step: 0 }; markDirty(); closeModal();
  if (cur.mode !== 'yard') go('yard');
  setTimeout(gdStart, 300);
}
modal.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('#gdReplay')) { SFX.boop(600); gdReplay(); } });
window.__gd = { active: gdActive, start: gdStart, tab: gdTabHTML, steps: GD_STEPS.length }; // for the guide suites
