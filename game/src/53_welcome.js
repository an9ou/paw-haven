/* ======================= v2.25 "Glad you're back": 53_welcome.js (tag wb) =======================
   Contract: V225.md. Design: docs/design/improvement-plan.md, release A. Test hook: window.__paw.wb. Suite: v225_welcome.
   1. While you were out: after 4+ REAL hours away (S.lastReal / S.lastSeenAt, never game time), the dog greets the player and a diary page
      shows 2-3 small things it did (WB_LINES, seeded by the return so a reload shows the same page). Once a Japan day (S.awayGiftISO) the page
      brings a small gift: a dog-safe treat or a Bond 1-2 toy, coins only now and then and never more than WB_COIN_CAP. Shorter absences keep the
      old "napped for N game hours" toast (21_time_loop.js). The page waits its turn: the calendar's daily page and the What's new sheet go first
      (nwCalmNow, 49c_news.js), then 2.5 calm seconds on the yard.
   2. Days played, forever: S.daysPlayed counts distinct Japan days played and never goes down or resets (a missed day costs nothing).
      Gifts from Gerald at 7, 30, 100 and 365 days (S.daysGifts, once each), with a letter to keep. Shown on the monthly calendar.
      An old save starts from what it honestly knows: the diary's dated pages, the welcome week, this month's calendar paws, the treat pouches.
   3. Welcome back after 3+ real days away: Gerald's letter "We kept your spot warm" with a treat bag and WB_BACK_COINS coins, once per return
      (S.backISO; S.lastSeenAt is a high-water mark, so turning the clock back and forth does not bring a second letter).
   4. Tomorrow line: once the day's last daily task is done (the mission and the two little helps: Gerald's pouch; the mission alone with
      Missions v2 off), one gentle toast about tomorrow (S.tmrwISO, once a Japan day). Text only.
   Under the test harness the page, the gifts, the letters and the tomorrow line need prefs.wbTest (the older suites never see them);
   the days are counted for everyone. */
function wbOn() { return !navigator.webdriver || !!(typeof prefs !== 'undefined' && prefs && prefs.wbTest); }
const WB_AWAY_MS = 4 * 3600e3, WB_BACK_MS = 3 * 864e5, WB_COIN_CAP = 30, WB_BACK_COINS = 100, WB_DAYS = [7, 30, 100, 365];
const WB = { calm: 0, hiddenAt: 0, doneAt: 0 };
const WB_TOYS = ['Squeaky Duck', 'Rope Tug', 'Plush Bone', 'Snuffle Mat', 'Treat Cone']; // Bond 1-2 toys only
const WB_TREATS = ['Bone-shaped Biscuit', 'Carrot Sticks', 'Blueberry Bites', 'Apple Slices']; // dog-safe snacks (the calendar's treats)
const WB_DECOR = ['String Lights', 'Wind Chime', 'Bird Bath', 'Flower Barrel', 'Garden Bench']; // 30 days: a yard decoration (no flag art yet: the first one not owned)
const WB_WEAR = ['Astronaut Helmet', 'Cozy Hoodie', 'Knit Scarf', 'Leaf Beret', 'Cowboy Hat', 'Pyjamas']; // 100 days: a costume not owned yet

/* ---------------- save (additive, v stays 1) ---------------- */
// fresh: a brand-new save (freshState). An old save's day count starts from what it already knows (wbInfer)
function v225Fields(s, fresh) {
  if (!s) return s;
  const str = (k) => { if (typeof s[k] !== 'string') s[k] = ''; };
  if (typeof s.lastSeenAt !== 'number' || !isFinite(s.lastSeenAt) || s.lastSeenAt < 0) s.lastSeenAt = fresh ? Date.now() : 0;
  str('awayGiftISO'); str('backISO'); str('tmrwISO');
  if (typeof s.wbVisSeen !== 'number' || !isFinite(s.wbVisSeen) || s.wbVisSeen < 0) s.wbVisSeen = 0; // v2.26 visitors already listed on a page
  if (!Array.isArray(s.daysGifts)) s.daysGifts = [];
  if (!s.wbPend || typeof s.wbPend !== 'object' || Array.isArray(s.wbPend)) s.wbPend = null;
  if (typeof s.daysPlayed !== 'number' || !isFinite(s.daysPlayed) || s.daysPlayed < 0) { if (fresh) { s.daysPlayed = 0; s.daysLastISO = ''; } else wbInfer(s); }
  str('daysLastISO');
  return s;
}
// the honest start for an old save: the most days any record proves (never a guess upwards)
function wbInfer(s) {
  const j = jstISO(), seen = new Set(), add = (iso) => { const x = String(iso || ''); if (/^\d{4}-\d{2}-\d{2}$/.test(x) && x <= j) seen.add(x); };
  const dd = s.dd && typeof s.dd === 'object' ? s.dd : {};
  (Array.isArray(dd.diary) ? dd.diary : []).forEach((p) => { if (p) add(p.j || p.d); });
  const fw = s.fw && typeof s.fw === 'object' ? s.fw : {};
  if (fw.wel && Array.isArray(fw.wel.days)) fw.wel.days.forEach(add);
  const cal = fw.cal && Array.isArray(fw.cal.days) ? fw.cal.days.length : 0;
  const m = s.missions && typeof s.missions === 'object' ? s.missions : {}, pouch = m.pouch && +m.pouch.c > 0 ? +m.pouch.c : 0;
  s.daysPlayed = Math.max(seen.size, cal, pouch);
  const lt = localISO(), calToday = !!(fw.cal && fw.cal.ym === lt.slice(0, 7) && Array.isArray(fw.cal.days) && fw.cal.days.includes(+lt.slice(8, 10)));
  s.daysLastISO = s.daysPlayed > 0 && (seen.has(j) || calToday || (m.pouch && m.pouch.day === j)) ? j : '';
}

/* ---------------- 2. days played, forever ---------------- */
// a new Japan day while playing: +1. A clock turned back never counts (the date must be later than the last one counted)
function wbDaysTick() {
  if (!S || typeof S.daysPlayed !== 'number') return false;
  const j = jstISO(); if (S.daysLastISO && S.daysLastISO >= j) return false;
  S.daysPlayed++; S.daysLastISO = j; markDirty(); return true;
}
function wbMileGift(n) {
  if (n === 7) return { t: 'frame', f: 7 };
  if (n === 30) { const x = WB_DECOR.find((d) => typeof HM_DECOR !== 'undefined' && HM_DECOR[d] && !(S.decor && S.decor[d])); return x ? { t: 'decor', n: x } : { t: 'bag', c: WB_COIN_CAP }; }
  if (n === 100) { const x = WB_WEAR.find((w) => ALL_WEAR.some((c) => c.n === w) && !owns('clothes', w)); return x ? { t: 'cloth', n: x } : { t: 'bag', c: WB_COIN_CAP }; }
  return { t: 'gold', f: 365 }; // a whole year: a Golden Bone and a golden photo frame
}
const wbFrameName = (f) => (f === 365 ? tt('wb.frame_year', 'A whole year together') : tt('wb.frame_days', '{n, plural, one {# day together} other {# days together}}', { n: f }));
function wbGiftLabel(g) {
  if (!g) return '';
  if (g.t === 'coins') return tt('fw.rew_coins', '{n, plural, one {# coin} other {# coins}}', { n: g.c });
  if (g.t === 'food') return tt('fw.rew_food', '{item} x{q}', { item: tItem(g.n), q: g.q });
  if (g.t === 'toy' || g.t === 'cloth' || g.t === 'decor') return shNameAny(g.n);
  if (g.t === 'bag') return tt('fw.rew_bag_coins', 'A treat bag and {n, plural, one {# coin} other {# coins}}', { n: g.c });
  if (g.t === 'frame') return tt('wb.g_frame', 'A photo frame: {name}', { name: wbFrameName(g.f) });
  return tt('wb.g_gold', 'A Golden Bone and a golden photo frame');
}
function wbGiftArt(g) {
  try {
    if (g.t === 'coins') return ICON('coin');
    if (g.t === 'food' || g.t === 'toy' || g.t === 'cloth') return art('item', g.n);
    if (g.t === 'decor') return typeof hmDecorArt === 'function' ? hmDecorArt(g.n) : fwFrameSVG('#F2C744');
    if (g.t === 'bag') return fwBagSVG();
    return fwFrameSVG(g.t === 'gold' ? '#E8B923' : '#F2C744');
  } catch (e) { return ''; }
}
function wbGive(g) {
  if (g.t === 'coins') addCoins(Math.max(0, Math.min(WB_COIN_CAP, g.c)), { raw: true });
  else if (g.t === 'food') S.inv.food[g.n] = (S.inv.food[g.n] || 0) + g.q;
  else if (g.t === 'toy') { if (!owns('toys', g.n)) S.inv.toys.push(g.n); }
  else if (g.t === 'cloth') { if (!owns('clothes', g.n)) S.inv.clothes.push(g.n); }
  else if (g.t === 'decor') { S.decor = S.decor || {}; if (!S.decor[g.n]) { S.decor[g.n] = { got: localISO(), out: true }; emit('decor:new', { name: g.n }); } }
  else if (g.t === 'bag') { FW_BAG.forEach(([n, q]) => { S.inv.food[n] = (S.inv.food[n] || 0) + q; }); if (g.c) addCoins(Math.min(WB_COIN_CAP, g.c), { raw: true }); }
  else if (g.t === 'gold') S.inv.food['Golden Bone'] = (S.inv.food['Golden Bone'] || 0) + 1;
  markDirty(); updateHUD();
}
// each milestone once (S.daysGifts), with a letter from Gerald to keep. An old save that starts past a milestone gets it too: nothing is held back
function wbMilestones() {
  if (!S || !wbOn() || !Array.isArray(S.daysGifts) || ['title', 'adopt'].includes(cur.mode)) return [];
  const got = [];
  WB_DAYS.forEach((n) => {
    if (S.daysPlayed < n || S.daysGifts.includes(n)) return;
    const g = wbMileGift(n); S.daysGifts.push(n); wbGive(g); got.push(n);
    const what = wbGiftLabel(g);
    mailPush({ kind: 'news', id: 'wb_days_' + n, keep: true, from: tt('ks.letter_from', 'Gerald'), title: tt('wb.m_title', '{n, plural, one {# day together} other {# days together}}', { n }),
      text: tt('wb.m_text', 'Dear friend,\nYou and {name} have now played together on {n} different days. Not in a row and never in a rush, just {n} good days.\nHere is a little thank-you: {gift}.\nWith a happy waddle,\nGerald', { name: NAME(), n, gift: what }) });
    setTimeout(() => toast(tt('wb.m_toast', '{n} days played! A gift from Gerald: {gift}.', { n, gift: what }), 'gold'), 600 + got.length * 400);
  });
  if (got.length) { try { SFX.kaching(); } catch (e) { /* audio off */ } saveNow(); }
  return got;
}
// the monthly calendar's line (47_firstweek.js fwCalHTML)
function wbCalHTML() {
  if (!S || typeof S.daysPlayed !== 'number') return '';
  const n = S.daysPlayed, next = WB_DAYS.find((m) => m > n);
  const chips = WB_DAYS.map((m) => `<li class="${n >= m ? 'on' : ''}${S.daysGifts.includes(m) ? ' got' : ''}"><b>${tnum(m)}</b></li>`).join('');
  return `<div class="wb-life"><p class="wb-lifen"><b>${esc(tt('wb.cal_life', '{n, plural, one {# day played, ever} other {# days played, ever}}', { n }))}</b> <span class="small">${esc(next ? tt('wb.cal_next', 'Next gift from Gerald at {m} days.', { m: next }) : tt('wb.cal_all', 'Every days-played gift is yours. Thank you for playing!'))}</span></p><ol class="fw-spec wb-spec" aria-label="${esc(tt('wb.cal_gifts', 'Days-played gifts'))}">${chips}</ol></div>`;
}
// photo mode frames (35_photo.js): the 7-day frame and the year frame
function wbFrameList() { return S && Array.isArray(S.daysGifts) ? [7, 365].filter((f) => S.daysGifts.includes(f)).map((f) => ({ k: 'wb' + f, n: wbFrameName(f), c: f === 365 ? '#E8B923' : '#F2C744' })) : []; }
function wbPostcard(w, h, o) {
  const P = window.PawArt, f = +String(o.color).slice(2) || 7, svg = P.postcard(w, h, Object.assign({}, o, { color: 'sun' })), s = Math.max(w, h) / 450, n = 7, gap = (w - 60 * s) / n;
  const g = Array.from({ length: n }, (_, i) => fwDoodle(i === 3 ? 'paw' : f === 365 ? 'sun' : 'heart', +(30 * s + gap * (i + 0.5)).toFixed(1), +(12 * s).toFixed(1), 0.75 * s, i % 2 ? 10 : -10)).join('')
    + `<text x="${(w - 22 * s).toFixed(1)}" y="${(h - 9 * s).toFixed(1)}" text-anchor="end" font-family="Caveat,cursive" font-weight="700" font-size="${(13 * s).toFixed(1)}" fill="${INKG}">${esc(wbFrameName(f))}</text>`;
  return svg.replace(/<\/svg>\s*$/, `<g class="wb-frame">${g}</g></svg>`);
}

/* ---------------- 1 + 3. coming back ---------------- */
// from applyAway (21_time_loop.js) and a tab shown again: ms = real time since the player was last here. Returns true when the page takes
// over from the old away toast (4+ hours, and wbOn)
function wbAway(ms) {
  if (!S) return false; const now = Date.now();
  S.lastSeenAt = Math.max(+S.lastSeenAt || 0, now); markDirty();
  if (!wbOn() || !(ms >= WB_AWAY_MS)) return false;
  S.wbPend = { at: now, h: Math.max(4, Math.round(ms / 3600e3)) };
  if (ms >= WB_BACK_MS) wbBackLetter();
  return true;
}
function wbBackLetter() {
  const j = jstISO(); if (!S || S.backISO === j) return null; S.backISO = j; markDirty();
  return mailPush({ kind: 'news', id: 'wb_back_' + j, from: tt('ks.letter_from', 'Gerald'), title: tt('wb.b_title', 'We kept your spot warm'),
    text: tt('wb.b_text', 'Dear friend,\nWelcome back! {name} and the whole town missed you. We kept your spot warm, and nobody minded the wait. There is nothing to catch up on.\nHere is a treat bag and {n} coins, to start again gently.\nWith a happy waddle,\nGerald', { name: NAME(), n: WB_BACK_COINS }),
    gift: { coins: WB_BACK_COINS, bag: true } });
}
// the small things the dog did (one is picked only with a second dog at home)
function wbLine(i, name, other) {
  switch (i) {
    case 0: return tt('wb.l0', '{name} napped in a sunbeam and moved with it all afternoon.', { name });
    case 1: return tt('wb.l1', '{name} found a sock. Nobody knows whose. It belongs to {name} now.', { name });
    case 2: return tt('wb.l2', '{name} barked at a leaf. The leaf did not bark back.', { name });
    case 3: return tt('wb.l3', '{name} guarded the gate from a very suspicious pigeon.', { name });
    case 4: return tt('wb.l4', '{name} sniffed every corner of the yard, twice, just to be sure.', { name });
    case 5: return tt('wb.l5', '{name} dug a tiny hole and then filled it in again, very politely.', { name });
    case 6: return tt('wb.l6', '{name} chased a butterfly and let it win.', { name });
    case 7: return tt('wb.l7', '{name} rolled in the grass until it smelled just right.', { name });
    case 8: return tt('wb.l8', '{name} practised sitting, all alone, for when you came home.', { name });
    case 9: return tt('wb.l9', '{name} counted the clouds and got to three.', { name });
    case 10: return tt('wb.l10', '{name} had a long drink of water and an even longer nap.', { name });
    case 11: return tt('wb.l11', '{name} said hello to Gerald over the fence.', { name });
    case 12: return tt('wb.l12', '{name} dreamt about a ball the size of a house.', { name });
    case 13: return tt('wb.l13', '{name} found the squeakiest toy and squeaked it for a while.', { name });
    case 14: return tt('wb.l14', '{name} sat by the gate and listened for your footsteps.', { name });
    case 15: return tt('wb.l15', '{name} chased a tail round and round, then noticed it was a very familiar tail.', { name });
    case 16: return tt('wb.l16', '{name} sneezed at a flower. The flower was fine.', { name });
    case 17: return tt('wb.l17', '{name} waved a paw at the postman and got a wave back.', { name });
    case 18: return tt('wb.l18', '{name} watched a snail cross the whole path. It took ages. Worth it.', { name });
    case 19: return tt('wb.l19', '{name} kept your favourite spot warm.', { name });
    default: return tt('wb.l20', '{name} and {other} shared one stick, mostly.', { name, other });
  }
}
// 2 lines (3 after 12 hours or more), different ones, seeded by the return so a reload shows the same page
function wbLines(pend, d) {
  d = d || D(); const others = S.dogs.filter((x) => x.id !== d.id), rnd = seeded(hashId('wb|' + (pend && pend.at) + '|' + d.id));
  const pool = Array.from({ length: others.length ? 21 : 20 }, (_, i) => i), out = [], n = pend && pend.h >= 12 ? 3 : 2;
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  const other = others.length ? others[Math.floor(rnd() * others.length)].name : '';
  return out.map((i) => wbLine(i, d.name, other));
}
// today's small gift (once a Japan day): mostly a dog-safe treat or a toy not owned yet, coins now and then (at most WB_COIN_CAP)
function wbGiftPick(j) {
  const r = hashId('wbg|' + j + '|' + (S.dog && S.dog.id)) % 100;
  if (r < 12) return { t: 'coins', c: [10, 20, 30][hashId('wbc|' + j) % 3] };
  if (r < 42) { const x = WB_TOYS.find((n) => TOYS.some((t) => t.n === n) && !owns('toys', n)); if (x) return { t: 'toy', n: x }; }
  const L = WB_TREATS.filter((n) => FOOD.some((f) => f.n === n)); return { t: 'food', n: L[hashId('wbt|' + j) % L.length] || 'Bone-shaped Biscuit', q: 2 };
}
function wbGiftToday() {
  const j = jstISO(); if (!S || (S.awayGiftISO && S.awayGiftISO >= j)) return null;
  const g = wbGiftPick(j); S.awayGiftISO = j; wbGive(g); return g;
}
function wbAwayText(h) { return h >= 48 ? tt('wb.away_d', 'You were away for {n, plural, one {# day} other {# days}}', { n: Math.floor(h / 24) }) : tt('wb.away_h', 'You were away for {n, plural, one {# hour} other {# hours}}', { n: h }); }
// v2.26 yard visitors that came during this absence and are not yet listed (read from S.visitors.log, so the order of the catch-up and the page does not matter)
function wbVisitors(pend) {
  const V = S && S.visitors; if (!V || !Array.isArray(V.log) || typeof yvDog !== 'function' || typeof yvOn !== 'function' || !yvOn()) return [];
  const lo = Math.max(+S.wbVisSeen || 0, (pend && pend.at || Date.now()) - ((pend && pend.h || 4) + 1) * 3600e3);
  return V.log.filter((e) => e && e.t > lo && yvDog(e.id)).sort((a, b) => a.t - b.t);
}
function wbVisHTML(list) {
  if (!list || !list.length) return '';
  const show = list.slice(-3), more = list.length - show.length;
  return `<div class="wb-vis"><b>${esc(tt('yv.wb_head', 'Visitors came by'))}</b>${show.map((e) => `<p>${esc(yvLine(e))}${e.g && typeof yvGiftLine === 'function' ? ' <span class="wb-vg">' + esc(yvGiftLine(e)) + '</span>' : ''}</p>`).join('')}${more > 0 ? `<p class="small">${esc(tt('yv.wb_more', 'and {n} more', { n: more }))}</p>` : ''}</div>`;
}
function wbHTML(pend, gift, vis) {
  const d = D(), lines = wbLines(pend, d);
  const giftRow = gift ? `<div class="wb-gift"><span class="wb-gart" aria-hidden="true">${wbGiftArt(gift)}</span><span class="wb-gt"><b>${esc(tt('wb.gift_h', 'A little gift from {name}', { name: d.name }))}</b><span>${esc(wbGiftLabel(gift))}</span></span></div>` : '';
  return `<div class="wb-sheet${vis && vis.length ? ' wb-hasvis' : ''}"><article class="dd-page wb-page" aria-label="${esc(tt('dd.d_title', "{name}'s diary", { name: d.name }))}"><header class="dd-phead"><span class="dd-dhead" aria-hidden="true">${headSVG(d)}</span><span class="dd-pt"><b>${esc(tt('dd.d_title', "{name}'s diary", { name: d.name }))}</b><span class="small">${esc(wbAwayText(pend.h))}</span></span></header>
    <div class="dd-ptext">${lines.map((l) => `<p>${esc(l)}</p>`).join('')}</div><div class="dd-doodle" aria-hidden="true"><svg class="dd-dpaw" viewBox="-20 -20 40 40">${doodle('heart', 0, 2, 1.1, -8)}</svg><svg class="dd-dpaw" viewBox="-20 -20 40 40">${doodle('paw', 0, 2, 1.1, 12)}</svg></div></article>${giftRow}${wbVisHTML(vis)}</div>`;
}
function wbOpen(pend) {
  if (!S) return null; pend = pend || S.wbPend || { at: Date.now(), h: 4 }; S.wbPend = null;
  const gift = wbGiftToday(), vis = wbVisitors(pend); S.wbVisSeen = Date.now(); markDirty();
  const p = openModal(esc(tt('wb.title', 'While you were out')), wbHTML(pend, gift, vis), { cls: 'wb-pop', foot: `<button class="btn yes big wb-ok" id="wbOk">${esc(tt('wb.ok', 'Hello, {name}!', { name: NAME() }))}</button>` });
  $('#wbOk', p).onclick = () => { SFX.click(); closeModal(); };
  try { greetBark(); } catch (e) { /* no dog on screen */ }
  if (gift) { try { SFX.kaching(); } catch (e) { /* audio off */ } }
  saveNow(); return p;
}
// the automatic open: a calm yard, after the calendar's daily page and the What's new sheet
function wbTry() {
  if (!S || !wbOn() || !S.wbPend) { WB.calm = 0; return; }
  if (typeof nwOn === 'function' && nwOn() && S.newsSeen !== nwLatest()) { WB.calm = 0; return; }
  if (!(typeof nwCalmNow === 'function' ? nwCalmNow() : cur.mode === 'yard' && modal.hidden)) { WB.calm = 0; return; }
  if (!WB.calm) WB.calm = Date.now();
  if (Date.now() - WB.calm < 2500) return;
  WB.calm = 0; wbOpen();
}
// a tab left in the background: the game clock stops there, so coming back after 4+ hours counts as a return too
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') { WB.hiddenAt = Date.now(); return; }
  const t = WB.hiddenAt; WB.hiddenAt = 0;
  if (!S || !t || ['title', 'adopt'].includes(cur.mode)) return;
  try { wbAway(Date.now() - Math.max(t, +S.lastSeenAt || 0)); } catch (e) { console.warn('wb away', e); }
});

/* ---------------- 4. the tomorrow line ---------------- */
function wbDailyDone(j) {
  const m = S && S.missions; if (!m) return false;
  if (typeof ms2Ok === 'function' && ms2Ok()) return !!(m.pouch && m.pouch.day === j);
  if (typeof msAllowed === 'function' && !msAllowed()) return false;
  return m.date === j && Array.isArray(m.list) && m.list.length > 0 && m.list.every((x) => x && x.done);
}
function wbSoonCrop() {
  const g = S.garden; if (!g || !Array.isArray(g.plots)) return null;
  const L = g.plots.filter((p) => p && p.crop && !(p.g >= 1)).map((p) => { const c = cropInfo(p.crop); return c && c.hours ? { id: p.crop, h: (1 - (+p.g || 0)) * c.hours } : null; }).filter((x) => x && x.h <= 24);
  return L.sort((a, b) => a.h - b.h)[0] || null;
}
function wbTmrwText() {
  const c = wbSoonCrop();
  if (c) return tt('wb.t_crop', 'Tomorrow: the {crop} should be ready to pick.', { crop: (typeof gkCropPlural === 'function' && gkCropPlural(c.id)) || tt('garden.veggies', 'veggies') });
  const t = new Date(); t.setDate(t.getDate() + 1); const wd = t.getDay();
  if (wd === 6) return tt('wb.t_sat', 'Tomorrow is Saturday: the market stall on Market Street is open.');
  if (wd === 5) return tt('wb.t_sat2', 'The Saturday market stall opens in {n} days.', { n: 2 });
  if (wd === 1 && typeof ms2On === 'function' && ms2On()) return tt('wb.t_mon', "Tomorrow is Monday: Gerald pins up a new help-wanted board.");
  switch (hashId('wbt|' + jstISO()) % 4) {
    case 0: return tt('wb.t_g0', '{name} will be waiting by the gate tomorrow.', { name: NAME() });
    case 1: return tt('wb.t_g1', 'A new mission and two little helps come tomorrow.');
    case 2: return tt('wb.t_g2', "Tomorrow's calendar gift is already wrapped.");
    default: return tt('wb.t_g3', '{name} is already dreaming about tomorrow\'s walk.', { name: NAME() });
  }
}
function wbTmrwTick() {
  if (!S || !wbOn() || ['title', 'adopt'].includes(cur.mode)) { WB.doneAt = 0; return false; }
  const j = jstISO(); if (S.tmrwISO === j || !wbDailyDone(j)) { WB.doneAt = 0; return false; }
  if (!WB.doneAt) { WB.doneAt = Date.now(); return false; }
  if (Date.now() - WB.doneAt < 6000) return false; // Gerald's pouch toast first
  S.tmrwISO = j; markDirty(); toast(wbTmrwText(), 'gold'); return true;
}

/* ---------------- the loop and the hook ---------------- */
function wbTick() {
  wbExpose();
  if (!S || ['title', 'adopt'].includes(cur.mode) || !titleEl.hidden) return;
  if (typeof S.daysPlayed !== 'number') v225Fields(S, false);
  wbDaysTick(); wbMilestones(); wbTmrwTick(); wbTry();
}
setInterval(() => { try { wbTick(); } catch (e) { console.warn('wb tick', e); } }, 500);
on('game:ready', () => { WB.calm = 0; WB.doneAt = 0; wbExpose(); });
function wbExpose() {
  if (!window.__paw || window.__paw.wb) return;
  window.__paw.wb = {
    on: () => wbOn(), test: (v) => { prefs.wbTest = !!v; }, fields: (s, fresh) => v225Fields(s, !!fresh), away: (ms) => wbAway(ms), pend: () => S && S.wbPend, open: () => wbOpen(), lines: (p) => wbLines(p || { at: 1, h: 4 }),
    gift: () => wbGiftToday(), pick: (j) => wbGiftPick(j || jstISO()), days: () => wbDaysTick(), mile: () => wbMilestones(), mileGift: (n) => wbMileGift(n), tmrw: () => wbTmrwTick(), tmrwText: () => wbTmrwText(), done: () => wbDailyDone(jstISO()),
    cal: () => wbCalHTML(), frames: () => wbFrameList(), letter: () => wbBackLetter(), AWAY: WB_AWAY_MS, BACK: WB_BACK_MS, CAP: WB_COIN_CAP, COINS: WB_BACK_COINS, DAYS: WB_DAYS.slice(), doneAt: (v) => { if (typeof v === 'number') WB.doneAt = v; return WB.doneAt; }
  };
}
