/* ======================= v2.27 "Town projects" (V227.md) =======================
   The economy fix of docs/design/economy-review.md (recommendation 3): something big to save up for that changes the town for good.
   A project board in the Town Square takes coins for four projects, in order: the Fountain, the Bandstand, Sakura Avenue, the Lighthouse.
   Any amount goes in (quick buttons or a typed number); nothing is ever taken back or lost. Fully paid, a project builds for PR_BUILD_DAYS
   Japan days (the daily reset, jstISO), then stays for good: Gerald's ribbon-cutting letter (kept in the mailbox) and something to do there
   (the dogs drink at the fountain, the bandstand plays a tune, the sakura trees follow the seasons with petals in spring, the lighthouse on the
   Lighthouse Pier lights up at night). Save: S.projects (v227Fields, additive). Art: 55b_projects_art.js. CSS: game/css/57_projects.css.
   Test hook: window.__paw.pr. Suite: v227_projects. */
const PR_LIST = [
  { id: 'fountain', price: 5000, place: 'square' },
  { id: 'bandstand', price: 10000, place: 'square' },
  { id: 'sakura', price: 15000, place: 'square' },
  { id: 'lighthouse', price: 25000, place: 'pier' }
];
const PR_BUILD_DAYS = 2; // Japan days from the day it is fully paid
const PR_KEEP = 200; // "All but 200" keeps this many coins in the pocket
const PR_QUICK = [50, 100, 500];
const PR_TREAT_MIN = 60; // game minutes between the small Happiness treats at the fountain and the bandstand (the fun never stops; only the +Happiness waits)
// where the builds stand (world units; [x, y, scale] of the art's top-left corner). Square: world 1000 x 600; Pier: world 1600 x 600
const PR_AT = {
  board: [302, 246, 0.96],
  fountain: [14, 290, 1], // built ONTO the old dog-statue fountain (one fountain): the art's box is world x 14..206, y 290..520, its new bowl at paw height in front
  bandstand: [837, 272, 0.6], // back right, standing free on the paving in front of the toy shop's window: between the notice board (drawn to x 831) and the shop's door (x 927), its top under the shop's sign (y 258)
  sakura: [[-23, 167, 0.9], [564, 233, 0.6], [912, 167, 0.9]], // left, in the gap by the run gate, back right beside the bandstand
  lighthouse: [720, 157, 0.7] // far out at sea, on the horizon, above the pier's railing
};
const PR_FT_HOT = [20, 296, 174, 204]; // the fountain's tap box (world): the whole old fountain and its new bowl, clear of the phone's festival stall (x 196) and of the dogs' drinking spot (110, 512)
const PR_BS_HOT = [860, 276, 80, 108]; // the bandstand's tap box (world): right of the notice board's tap group (to x 859 with its shadow), above the festival stall (y 384 on), 80 wide so it is 44 px even on a 360 x 640 phone (its right edge, invisible, reaches over the shop door's left side)
const PRJ = { skip: 0, tune: 0, tod: '' }; // skip: test-only extra days on the Japan date (window.__paw.pr.skip)
function v227Fields(s) {
  if (!s) return s;
  if (!s.projects || typeof s.projects !== 'object' || Array.isArray(s.projects)) s.projects = {};
  const p = s.projects;
  if (!Number.isInteger(p.i) || p.i < 0) p.i = 0; if (p.i > PR_LIST.length) p.i = PR_LIST.length;
  if (typeof p.paid !== 'number' || !isFinite(p.paid) || p.paid < 0) p.paid = 0; p.paid = Math.floor(p.paid);
  ['built', 'letters'].forEach((k) => { if (!Array.isArray(p[k])) p[k] = []; });
  if (!Array.isArray(p.building)) p.building = []; p.building = p.building.filter((b) => b && typeof b.id === 'string' && typeof b.ready === 'string');
  if (typeof p.treatAt !== 'number' || !isFinite(p.treatAt)) p.treatAt = -1e9;
  return s;
}
const prS = () => (S ? (v227Fields(S), S.projects) : null);
const prToday = () => (PRJ.skip ? prAddDays(jstISO(), PRJ.skip) : jstISO());
function prAddDays(iso, n) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); if (!m) return iso; return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + n)).toISOString().slice(0, 10); }
function prDaysTo(iso) { const a = /^(\d{4})-(\d{2})-(\d{2})/.exec(prToday()), b = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); if (!a || !b) return 0; return Math.round((Date.UTC(+b[1], +b[2] - 1, +b[3]) - Date.UTC(+a[1], +a[2] - 1, +a[3])) / 864e5); }
function prName(id) { return { fountain: tt('pr.n_fountain', 'Fountain'), bandstand: tt('pr.n_bandstand', 'Bandstand'), sakura: tt('pr.n_sakura', 'Sakura Avenue'), lighthouse: tt('pr.n_lighthouse', 'Lighthouse') }[id] || id; }
function prBlurb(id) {
  return { fountain: tt('pr.b_fountain', 'A stone fountain with a low bowl, so every dog in town can have a drink.'),
    bandstand: tt('pr.b_bandstand', 'A little bandstand with bunting. Tap it and the band plays a tune.'),
    sakura: tt('pr.b_sakura', 'A row of cherry trees around the Square, pink in spring and lovely all year.'),
    lighthouse: tt('pr.b_lighthouse', 'A lighthouse far out at sea, seen from the Lighthouse Pier. It lights up at night.') }[id] || '';
}
const prInfo = (id) => PR_LIST.find((x) => x.id === id) || null;
const prBuilt = (id) => { const p = prS(); return !!p && p.built.includes(id); };
const prBuilding = (id) => { const p = prS(); return (p && p.building.find((b) => b.id === id)) || null; };
const prCur = () => { const p = prS(); return p && p.i < PR_LIST.length ? PR_LIST[p.i] : null; };
// what to draw: 'done' when built, 'half' while it builds or once half paid, 'plan' for the project being paid for, null for later ones
function prStage(id) {
  const p = prS(); if (!p) return null; if (p.built.includes(id)) return 'done'; if (prBuilding(id)) return 'half';
  const c = prCur(); if (!c || c.id !== id) return null; return p.paid * 2 >= c.price ? 'half' : 'plan';
}
// coins into the current project. Never more than the pocket or what is left; never below 0. Returns the coins put in
function prPay(n) {
  const p = prS(), c = prCur(); if (!p || !c) return 0;
  n = Math.floor(+n); if (!(n > 0)) return 0;
  n = Math.min(n, Math.max(0, Math.floor(S.coins)), c.price - p.paid); if (n <= 0) return 0;
  S.coins -= n; p.paid += n; trackAct('project_pay', { id: c.id, n });
  if (p.paid >= c.price) { p.building.push({ id: c.id, ready: prAddDays(prToday(), PR_BUILD_DAYS), paid: prToday() }); p.i++; p.paid = 0; trackAct('project_paid', { id: c.id }); }
  markDirty(); updateHUD(); prDraw(); return n;
}
// how much a quick button puts in now ('keep' = everything but PR_KEEP); 0 = the button is off
function prAmount(kind) {
  const p = prS(), c = prCur(); if (!p || !c) return 0; const left = c.price - p.paid, pocket = Math.max(0, Math.floor(S.coins));
  const want = kind === 'keep' ? pocket - PR_KEEP : +kind; if (!(want > 0)) return 0;
  if (kind !== 'keep' && want > pocket) return 0; // a quick button for more than the pocket is off (a typed amount takes what there is)
  return Math.min(want, pocket, left);
}
// a build whose day has come is finished: it joins the town for good, and Gerald's ribbon-cutting letter comes once
function prTick() {
  const p = prS(); if (!p) return false; let ch = false; const today = prToday();
  p.building.slice().forEach((b) => { if (today >= b.ready) { p.building = p.building.filter((x) => x !== b); if (!p.built.includes(b.id)) p.built.push(b.id); ch = true; prLetter(b.id); } });
  if (ch) { markDirty(); prDraw(); }
  return ch;
}
function prLetter(id) {
  const p = prS(); if (!p || p.letters.includes(id)) return null; p.letters.push(id); markDirty();
  const L = {
    fountain: tt('pr.l_fountain', 'Dear friend,\nThe new Fountain in the Town Square is finished! This morning I cut the ribbon, and the first dog to drink from the low bowl was a very serious pug.\nIt is yours too: tap it and your dogs stop for a drink.\nThank you for every coin you put in.\nWith a happy waddle,\nGerald'),
    bandstand: tt('pr.l_bandstand', 'Dear friend,\nThe Bandstand is up in the Town Square, bunting and all! The ribbon was cut to a little drum roll.\nTap it any time and the band plays a tune. Dancing dogs welcome.\nThank you for helping build it.\nWith a happy waddle,\nGerald'),
    sakura: tt('pr.l_sakura', 'Dear friend,\nSakura Avenue is planted! Cherry trees now stand around the Town Square.\nThey change with the seasons, and in spring the petals drift all over the Square. The dogs think they are snacks. They are not.\nThank you for your coins.\nWith a happy waddle,\nGerald'),
    lighthouse: tt('pr.l_lighthouse', 'Dear friend,\nThe Lighthouse is finished! You can see it far out at sea from the Lighthouse Pier, and at night its light sweeps over the water.\nThat was the last of my four plans. The whole town is a little brighter because of you.\nWith a happy waddle,\nGerald')
  }[id];
  if (typeof mailPush !== 'function' || !L) return null;
  return mailPush({ kind: 'news', id: 'pr_ribbon_' + id, keep: true, from: tt('pr.letter_from', 'Gerald'), title: tt('pr.letter_title', 'Ribbon cutting: the {name}', { name: prName(id) }), text: L });
}

/* ---- the scene layers (Town Square and Lighthouse Pier) ---- */
const prWrap = (at, w, h, inner) => `<g transform="translate(${at[0]} ${at[1]}) scale(${at[2]})">${inner}</g>`;
function prHot(id, at, w, h, inner, label, box) { // box: a tap box of its own (world x, y, w, h), else the art's box
  const b = box || [at[0], at[1], w * at[2], h * at[2]];
  return `<g class="hot pr-hot" data-pr-hot="${id}" role="button" tabindex="0" aria-label="${esc(label)}"><rect x="${b[0]}" y="${b[1]}" width="${(+b[2]).toFixed(1)}" height="${(+b[3]).toFixed(1)}" fill="transparent"/>${prWrap(at, w, h, inner)}</g>`;
}
function prSquareSVG() {
  const p = prS(), c = prCur(), season = seasonNow(), out = [];
  const sk = prStage('sakura'); if (sk) PR_AT.sakura.forEach((at, i) => out.push(`<g class="pr-tree" pointer-events="none">${prWrap(at, 140, 200, sk === 'done' ? praSakura('done', season, i) : praSakura(sk, season, i))}</g>`));
  const fs = prStage('fountain'); if (fs) out.push(prHot('fountain', PR_AT.fountain, 192, 230, prFtProp() ? '' : praFountainAdd(fs), prName('fountain'), PR_FT_HOT)); // only the new parts: the old fountain is in the backdrop (prFtAttach)
  const bs = prStage('bandstand'); if (bs) out.push(prHot('bandstand', PR_AT.bandstand, 140, 190, praBandstand(bs), prName('bandstand'), PR_BS_HOT));
  const frac = c ? p.paid / c.price : 1;
  out.push(prHot('board', PR_AT.board, 100, 104, praBoard(c && c.id, frac, !c), tt('pr.board_aria', 'Town projects board')));
  return `<g id="prG" data-tod="${timePhase()}">${out.join('')}</g>`;
}
// the old fountain as a floor prop (a grOn Square: 43_ground.js moves it into #pack, sorted with the dogs by feet y, drawn over #prG). The new parts are
// drawn inside it, right after the old fountain, so they sit on it and sort with it; its wrapper has no pointer events, so a tap reaches the fountain's
// tap box in #prG under it. Just after a scene redraw the new drawing is still in #floorG (grLayer wraps it on the next depth sort): that one wins
function prFtProp() { const svg = $('svg.world', view); return svg && (svg.querySelector('#sceneG #floorG > [data-prop="fountain"]') || svg.querySelector('#pack .gr-prop > [data-prop="fountain"]')); }
function prFtAttach(tint) {
  const svg = $('svg.world', view); if (!svg) return; svg.querySelectorAll('.pr-ft-art').forEach((e) => e.remove());
  const fs = S.place === 'square' && prStage('fountain'), el = fs && prFtProp(); if (!el) return;
  const wrap = PR_AT.fountain, inner = `<g class="pr-ft-art" pointer-events="none">${prWrap(wrap, 192, 230, praFountainAdd(fs))}</g>`;
  el.insertAdjacentHTML('beforeend', tint ? tint(inner) : inner);
}
function prPierSVG() {
  const st = prStage('lighthouse'); if (!st) return '';
  const glow = st === 'done' && isNight() ? prWrap(PR_AT.lighthouse, 90, 160, praLighthouseGlow()) : '';
  return `<g id="prG" data-tod="${timePhase()}">${glow}${prHot('lighthouse',PR_AT.lighthouse, 90, 160, praLighthouse(st, st === 'done' && isNight()), prName('lighthouse'))}</g>`;
}
function prPetalsSVG() {
  if (prStage('sakura') !== 'done' || seasonNow() !== 'spring') return '';
  const r = praRng(77), ps = []; for (let i = 0; i < 14; i++) { const x = Math.round(20 + r() * 960), y = Math.round(150 + r() * 120), d = (6 + r() * 6).toFixed(1), dl = (-r() * 12).toFixed(1); ps.push(`<ellipse class="pr-petal" cx="${x}" cy="${y}" rx="4" ry="2.6" fill="${PRA_C.pink}" stroke="${PRA_C.pinkD}" stroke-width=".8" style="animation-duration:${d}s;animation-delay:${dl}s"/>`); }
  return `<g id="prPetals" pointer-events="none">${ps.join('')}</g>`;
}
function prDraw() {
  if (!S || cur.mode !== 'yard') return; const svg = $('svg.world', view); if (!svg) return;
  ['#prG', '#prPetals'].forEach((q) => { const o = $(q, svg); if (o) o.remove(); });
  const pack = $('#pack', svg); if (!pack) return;
  const tint = (h) => (h && window.PawArt && typeof PawArt.tint === 'function' ? PawArt.tint(h, { time: timePhase(), lit: true }) : h); // the scene's time of day; lit keeps the lamp's light
  const html = tint(S.place === 'square' ? prSquareSVG() : S.place === 'pier' ? prPierSVG() : ''); if (!html) return;
  pack.insertAdjacentHTML('beforebegin', html);
  if (S.place === 'square') { const pet = tint(prPetalsSVG()), fx = $('#fx', svg); if (pet && fx) fx.insertAdjacentHTML('beforebegin', pet); prFtAttach(tint); }
  PRJ.tod = timePhase();
  svg.querySelectorAll('[data-pr-hot]').forEach((g) => { const go = () => prTap(g.dataset.prHot); g.onclick = go; g.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }; });
}
function prTap(id) {
  if (typeof blOn === 'function' && blOn()) return; SFX.click();
  if (id === 'board') { prOpen(); return; }
  const st = prStage(id);
  if (st !== 'done') { const b = prBuilding(id); if (b) { toast(prReadyLine(b), 'good'); return; } prOpen(); return; }
  if (id === 'fountain') prDrink(); else if (id === 'bandstand') prTune(); else if (id === 'lighthouse') prLight();
}
function prTreat(k) { const p = prS(); if (S.gameMin - p.treatAt < PR_TREAT_MIN) return 0; p.treatAt = S.gameMin; addStat('happy', k); updateHUD(); return k; }
// the dogs drink at the fountain: the leader goes over for a drink (when the idle system is free), splashes, +5 Happiness at most once a game hour
function prDrink() {
  const at = PR_AT.fountain, fx = at[0] + 96 * at[2], fy = at[1] + 206 * at[2]; // the new bowl
  try { SFX.splash(); } catch (e) { /* audio off */ }
  for (let i = 0; i < 4; i++) setTimeout(() => fxText('•', fx - 16 + i * 10, fy - 10 - (i % 2) * 8, '#9CCDE8', 30), i * 120);
  try { if (typeof IDLE === 'object' && !busy && !IDLE.act) { IDLE.ask = { to: [fx - 44, fy + 18], pose: 'eat', line: tt('pr.drink_line', 'Slurp! Fountain water tastes fancier.') }; IDLE.force = 'ask'; IDLE.nextAt = 0; } } catch (e) { /* no idle system */ }
  const k = prTreat(5);
  toast(k ? tt('pr.drink_toast', '{name} has a long drink at the fountain. +{n} Happiness.', { name: NAME(), n: k }) : tt('pr.drink_toast2', '{name} has a long drink at the fountain.', { name: NAME() }), 'good');
  trackAct('project_fun', { id: 'fountain' });
}
// the bandstand plays a tune (PawAudio's stingers, a different one each time), notes float up, the dog dances
function prTune() {
  const at = PR_AT.bandstand, x = at[0] + 70 * at[2], y = at[1] + 60 * at[2], names = ['levelup', 'discover', 'harvest', 'treasure'], a = PAU();
  try { if (a && typeof a.stinger === 'function') a.stinger(names[PRJ.tune % names.length]); else SFX.fanfare(); } catch (e) { /* audio off */ }
  PRJ.tune++;
  for (let i = 0; i < 5; i++) setTimeout(() => fxText(i % 2 ? '♫' : '♪', x - 30 + i * 15, y - (i % 3) * 14, '#5B3D32', 34), i * 220);
  try { if (!busy) setTemp('happy', 1800); } catch (e) { /* no dog */ }
  const k = prTreat(3);
  toast(k ? tt('pr.tune_toast', 'The band plays a little tune and {name} dances along. +{n} Happiness.', { name: NAME(), n: k }) : tt('pr.tune_toast2', 'The band plays a little tune and {name} dances along.', { name: NAME() }), 'good');
  trackAct('project_fun', { id: 'bandstand' });
}
function prLight() {
  const g = $('[data-pr-hot="lighthouse"]'); if (g) { g.classList.remove('pr-flash'); void g.getBoundingClientRect(); g.classList.add('pr-flash'); }
  toast(isNight() ? tt('pr.light_night', 'The lighthouse light sweeps over the sea. {name} watches, ears up.', { name: NAME() }) : tt('pr.light_day', '{name} looks out at the lighthouse. Come back at night to see it shine.', { name: NAME() }), 'good');
  trackAct('project_fun', { id: 'lighthouse' });
}
function prReadyLine(b) {
  const n = prDaysTo(b.ready);
  return n <= 0 ? tt('pr.ready_now', 'The {name} is finished!', { name: prName(b.id) }) : n === 1 ? tt('pr.ready_tomorrow', 'The builders are at work on the {name}. It will be ready tomorrow.', { name: prName(b.id) }) : tt('pr.ready_days', 'The builders are at work on the {name}. It will be ready in {n} days.', { name: prName(b.id), n });
}

/* ---- the board's sheet ---- */
function prSheetHTML() {
  const p = prS(), c = prCur(), parts = [];
  parts.push(`<p class="pr-intro">${esc(tt('pr.intro', "Gerald's plans to make the town even nicer. Put in any coins you like, whenever you like. Every coin stays in the project."))}</p>`);
  if (c) {
    const frac = p.paid / c.price, pct = Math.floor(frac * 100);
    const btn = (k, label) => { const n = prAmount(k); return `<button class="btn${k === 'keep' ? ' yes' : ''}" type="button" data-pr-pay="${k}"${n ? '' : ' aria-disabled="true"'}>${esc(label)}</button>`; };
    parts.push(`<div class="pr-cur"><div class="pr-art">${praProgressSVG(c.id, frac, { season: seasonNow() })}</div><div class="pr-info"><h3>${esc(prName(c.id))}</h3><p class="small">${esc(prBlurb(c.id))}</p>
      <div class="pr-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${(frac * 100).toFixed(1)}%"></i></div>
      <p class="pr-num">${esc(tt('pr.paid_of', '{paid} of {price} coins', { paid: tnum(p.paid), price: tnum(c.price) }))}</p></div></div>`);
    parts.push(`<div class="pr-pay">${PR_QUICK.map((n) => btn(String(n), '+' + tnum(n))).join('')}${btn('keep', tt('pr.all_but', 'All but {n}', { n: tnum(PR_KEEP) }))}</div>`);
    parts.push(`<div class="pr-own"><label for="prAmt">${esc(tt('pr.any_amount', 'Any amount'))}</label><input id="prAmt" type="number" min="1" step="1" inputmode="numeric" placeholder="${esc(tnum(100))}"><button class="btn yes" type="button" id="prPut">${esc(tt('pr.put_in', 'Put in'))}</button></div>`);
  } else parts.push(`<p class="pr-all">${esc(tt('pr.all_done', 'Every project is built. Thank you! The whole town is brighter because of you.'))}</p>`);
  if (p.building.length) parts.push(`<ul class="pr-building">${p.building.map((b) => `<li>${esc(prReadyLine(b))}</li>`).join('')}</ul>`);
  parts.push(`<ol class="pr-list">${PR_LIST.map((x, i) => { const st = p.built.includes(x.id) ? 'built' : prBuilding(x.id) ? 'building' : i === p.i ? 'now' : 'later';
    const chip = { built: tt('pr.st_built', 'Built'), building: tt('pr.st_building', 'Building'), now: tt('pr.st_now', 'Saving up'), later: tt('pr.st_later', 'Next') }[st];
    return `<li data-st="${st}"><span class="pr-ic">${praSVG(x.id, st === 'built' ? 'done' : st === 'building' ? 'half' : 'plan', { season: seasonNow() })}</span><span class="pr-ln"><b>${esc(prName(x.id))}</b> <span class="small">${esc(tnum(x.price))}</span></span><span class="pr-chip">${esc(chip)}</span></li>`; }).join('')}</ol>`);
  return `<div class="pr">${parts.join('')}</div>`;
}
function prOpen() {
  prTick();
  const p = openModal(tt('pr.title', 'Town projects'), prSheetHTML(), { cls: 'pr-sheet' });
  prBind(p); return p;
}
function prBind(p) {
  p.querySelectorAll('[data-pr-pay]').forEach((b) => { b.onclick = () => prPayUI(p, prAmount(b.dataset.prPay), false, b.dataset.prPay); });
  const put = $('#prPut', p), inp = $('#prAmt', p);
  if (put && inp) { const go = () => prPayUI(p, Math.floor(+inp.value), true); put.onclick = go; inp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } }; }
}
function prPayUI(p, n, typed, kind) {
  const c = prCur(); if (!c) return;
  if (!(n > 0)) { nope(typed ? tt('pr.nope_amount', 'Type how many coins to put in.') : S.coins <= 0 ? tt('pr.nope_coins', 'No coins in your pocket right now. Walks bring more!') : kind === 'keep' ? tt('pr.nope_keep', 'You would keep less than {n} coins. Try a smaller amount.', { n: tnum(PR_KEEP) }) : tt('pr.nope_more', 'That is more than your pocket holds right now. Try a smaller amount.')); return; }
  const got = prPay(n); if (!got) { nope(tt('pr.nope_coins', 'No coins in your pocket right now. Walks bring more!')); return; }
  SFX.kaching();
  const done = !prS().building.every((b) => b.id !== c.id);
  const body = $('.panel-body', p); if (body) { body.innerHTML = prSheetHTML(); prBind(p); }
  if (done) toast(tt('pr.paid_toast', 'The {name} is fully paid! The builders start today. It will be ready in {n} days.', { name: prName(c.id), n: PR_BUILD_DAYS }), 'gold');
  else toast(tt('pr.put_toast', '{n} coins into the {name}. Thank you!', { n: tnum(got), name: prName(c.id) }), 'good');
}

on('yard:enter', () => { prTick(); prDraw(); prExpose(); });
on('scene:redraw', () => { if (cur.mode === 'yard' && S && (S.place === 'square' || S.place === 'pier') && (!$('#prG') || PRJ.tod !== timePhase())) prDraw(); else if (cur.mode === 'yard' && S && S.place === 'square') prFtAttach((h) => (h && window.PawArt && typeof PawArt.tint === 'function' ? PawArt.tint(h, { time: timePhase(), lit: true }) : h)); }); // a new scene drawing has a new old fountain: the new parts go on it again
on('env:season', () => { if (cur.mode === 'yard') prDraw(); });
function prExpose() {
  if (!window.__paw || window.__paw.pr) return;
  window.__paw.pr = { LIST: PR_LIST, BUILD_DAYS: PR_BUILD_DAYS, KEEP: PR_KEEP, AT: PR_AT, get S() { return prS(); }, pay: prPay, amount: prAmount, tick: prTick, stage: prStage, open: prOpen, draw: prDraw, today: prToday,
    skip: (n) => { PRJ.skip += n; }, fields: (s) => v227Fields(s), tap: prTap };
}
