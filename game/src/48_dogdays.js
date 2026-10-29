/* ======================= v2.17 "Dog Days": 48_dogdays.js (tag dd) =======================
   Contract: V217.md. Save field S.dd (v217Fields in 00_core.js). Test hook: window.__paw.dd.
   1. The daily wish: one small wish a day for each dog, seeded by the date and the dog, picked from what the player can do at their Bond and place.
      Doing it gives double the Bond that action gave, a sticker when one is due and 10 coins (at most 20 wish coins a day).
      Yesterday's "see you tomorrow" wish (S.fw.wish, 47_firstweek.js) becomes today's wish for that dog.
   2. The Bond track: Bond 1 to 10 with what each level opens, read from the game's own tables, plus new gifts: photo frames at Bond 3, 5 and 7,
      the Crayon Crown and the Golden Collar at Bond 10. It opens from the HUD Bond meter and its "Next" line.
   3. The dog diary: a page for every game day with something in it, written at display time from templates in the dog's own voice
      (S.dd.diary keeps summaries, the last 60 pages). Journal > Diary.
   4. The sticker book: 12 pages of 6 stickers (wishes, places, festivals, the Training Ground, the Splash Pool, the calendars).
      A full page gives a Bond 1-2 outfit or a photo frame. Journal > Stickers, and More on phones.
   5. Letters: Gerald's weekly town news and short letters from the families of puppies the player adopted out, at most one a day, in the morning mailbox.
   Under the test harness all of it needs prefs.ddTest. Nothing is ever taken away and a missed day costs nothing. */
function ddOn() { return !navigator.webdriver || !!prefs.ddTest; }
const DD = { bond: [], chip: '', dpg: -1, spg: -1, n: 0, defs: null };
const ddReady = () => !!(S && S.dd && S.dogs && S.dogs.length && D() && ddOn());
const DD_COIN = 10, DD_COIN_DAY = 20, DD_DIARY_MAX = 60;
const ddArr = (a) => (Array.isArray(a) ? a : []);

/* ---------------- 1. the daily wish ---------------- */
const DD_WACT = { walk: 'walk', ball: 'fetch', pet: 'pet', snack: 'feed', bath: 'bath', nap: 'nap', trick: 'trick', toy: 'toy', place: 'travel', paddle: 'paddle', garden: 'garden', photo: 'photo', wear: 'wear' };
const DD_TOWN = ['park', 'square', 'cafe', 'dogpark', 'market', 'hilltop', 'pier', 'vet', 'salon', 'training', 'pool', 'fujihill'];
const DD_FW = { walk: 'walk', ball: 'ball', pet: 'pet', snack: 'snack' }; // v2.16 wish -> the daily wish
// every Bond a dog gets (addBond calls this): a wish doubles what its action gave
function ddBondSeen(n) { if (!S || !S.dog) return; DD.bond.push({ id: S.dog.id, n, t: Date.now() }); if (DD.bond.length > 40) DD.bond.shift(); }
const ddTokyo = () => !!(S && ((typeof TK_PLACES !== 'undefined' && TK_PLACES[S.place]) || S.place === 'station'));
// what the player can do for this dog today, at their Bond and place: [kind, options for its argument or null]
function ddWishOpts(d) {
  const tb = topBond(), tokyo = ddTokyo(), o = [['ball', null], ['pet', null], ['bath', null], ['nap', null], ['trick', null], ['photo', null]];
  const routes = Object.keys(ROUTES).filter((k) => (ROUTES[k].bond || 1) <= tb);
  if (!tokyo && routes.length) o.push(['walk', routes]);
  const foods = Object.keys(S.inv.food || {}).filter((n) => S.inv.food[n] > 0 && n !== 'Fresh Water' && FOOD_ALL.some((f) => f.n === n));
  if (foods.length) o.push(['snack', foods]);
  const toys = ddArr(S.inv.toys).filter((n) => !FETCH_TOYS.includes(n) && typeof toySupported === 'function' && toySupported(n));
  if (toys.length) o.push(['toy', toys]);
  const pl = DD_TOWN.filter((k) => PLACES[k] && !PLACES[k].tokyo && (PLACES[k].bond || 1) <= tb);
  if (!tokyo && pl.length) o.push(['place', pl]);
  if (PLACES.pool && tb >= (PLACES.pool.bond || 2)) o.push(['paddle', null]);
  if (typeof gkOn === 'function' && gkOn() && tb >= 2) o.push(['garden', null]);
  if (ddArr(S.inv.clothes).length) o.push(['wear', null]);
  return o;
}
function ddWishMake(d, day) {
  const fw = S.fw && S.fw.wish;
  if (fw && !fw.done && fw.for === day && fw.id === d.id && DD_FW[fw.k]) return { k: DD_FW[fw.k], a: null, done: 0, fw: 1 };
  const r = seeded(hashId(day + '|' + d.id)), o = ddWishOpts(d), [k, args] = o[Math.floor(r() * o.length) % o.length];
  let a = null;
  if (args && args.length) { const fav = k === 'snack' ? args.find((n) => ddArr(d.favFood).includes(n)) : null; a = fav || args[Math.floor(r() * args.length) % args.length]; }
  return { k, a, done: 0 };
}
function ddWishes() { const t = localISO(); if (S.dd.wish.day !== t) { S.dd.wish = { day: t, w: {}, coins: 0 }; markDirty(); } return S.dd.wish; }
function ddWish(d) { if (!d || !S || !S.dd) return null; const W = ddWishes(); if (!W.w[d.id]) { W.w[d.id] = ddWishMake(d, W.day); markDirty(); } return W.w[d.id]; }
// the v2.16 handler leaves today's "see you tomorrow" wish to the daily wish (it gives the +10 Happiness too)
function ddFwTook(w) { if (!ddReady() || !w || w.for !== localISO() || !DD_FW[w.k]) return false; const W = ddWishes(); return !!(W.w[w.id] ? W.w[w.id].fw : true); }
function ddWishText(k, a) {
  switch (k) {
    case 'walk': return a ? tt('dd.wish_walk_at', 'a sniffy walk: {route}', { route: ddRouteName(a) }) : tt('dd.wish_walk', 'a walk together');
    case 'ball': return tt('dd.wish_ball', 'a game of ball');
    case 'pet': return tt('dd.wish_pet', 'scratches behind my ears');
    case 'snack': return a ? tt('dd.wish_snack_n', '{food}, please', { food: shNameAny(a) }) : tt('dd.wish_snack', 'a crunchy snack');
    case 'bath': return tt('dd.wish_bath', 'a bubbly bath');
    case 'nap': return tt('dd.wish_nap', 'a nap in the sun');
    case 'trick': return tt('dd.wish_trick', 'practising a trick together');
    case 'toy': return a ? tt('dd.wish_toy_n', 'playing with the {toy}', { toy: shNameAny(a) }) : tt('dd.wish_toy', 'playing with a toy');
    case 'place': return tt('dd.wish_place', 'a trip out: {place}', { place: ddPlaceName(a) });
    case 'paddle': return tt('dd.wish_paddle', 'a paddle in the Splash Pool');
    case 'garden': return tt('dd.wish_garden', 'digging in the veggie patch with you');
    case 'photo': return tt('dd.wish_photo', 'a photo of us together');
    default: return tt('dd.wish_wear', 'wearing something fancy');
  }
}
const ddPlaceName = (k) => (typeof TK_PLACES !== 'undefined' && (TK_PLACES[k] || k === 'station') && typeof tkPlaceName === 'function' ? tkPlaceName(k) : typeof townPlaceName === 'function' ? townPlaceName(k) : tPlace(k)); // the town names live in 14_town_places.js
const ddRouteName = (k) => (typeof townRouteName === 'function' ? townRouteName(k) : tRoute(k));
function ddWishMatch(w, e, d) {
  if (DD_WACT[w.k] !== e.kind) return false;
  if (w.k === 'walk') return !w.a || e.area === w.a;
  if (w.k === 'snack' || w.k === 'toy') return !w.a || e.name === w.a;
  if (w.k === 'place') return e.place === w.a;
  if (w.k === 'paddle') return !e.name || e.name === d.name;
  return true;
}
// the dogs an action was for: the dogs it names (a pack meal), else the dog in the pool, else the active dog
function ddActDogs(e) {
  if (Array.isArray(e.ids) && e.ids.length) return e.ids.map((id) => dogById(id)).filter(Boolean);
  if ((e.kind === 'paddle') && e.name) { const d = S.dogs.find((x) => x.name === e.name); if (d) return [d]; }
  return [D()];
}
function ddWishDone(d, w) {
  const W = S.dd.wish, t0 = Date.now(); w.done = 1; S.dd.wn++; S.dd.wk[w.k] = (S.dd.wk[w.k] || 0) + 1;
  let coins = 0; if (W.coins < DD_COIN_DAY) { coins = Math.min(DD_COIN, DD_COIN_DAY - W.coins); W.coins += coins; addCoins(coins, { raw: true }); }
  if (w.fw && S.fw && S.fw.wish && S.fw.wish.id === d.id) { S.fw.wish.done = true; withDog(d, () => addStat('happy', 10)); }
  const p = ddToday(); if (p && p.id === d.id) p.wi = w.k; // only the writer's own wish goes on its page
  markDirty(); DD.chip = ''; ddChipSync();
  setTimeout(() => {
    if (!S || !dogById(d.id)) return;
    const got = DD.bond.filter((b) => b.id === d.id && b.t >= t0 - 4000).reduce((a, b) => a + b.n, 0);
    const b = withDog(d, () => (got > 0 ? addBond(got, { raw: true }) : addBond(2)));
    const st = ddStickers(true);
    const parts = [tt('dd.wish_done', 'Wish come true! {name} is so happy: +{b} Bond (double).', { name: d.name, b })];
    if (coins) parts.push(tt('dd.wish_coins', '+{n, plural, one {# coin} other {# coins}}.', { n: coins }));
    if (w.fw) parts.push(tt('dd.wish_happy', '+10 Happiness.'));
    if (st.length) parts.push(tt('dd.wish_sticker', 'A new sticker: {name}!', { name: st[0].label() }));
    toast(parts.join(' '), 'gold'); st.slice(1).forEach((s) => toast(tt('dd.st_new', 'New sticker: {name}!', { name: s.label() }), 'good', { group: 'ddst', many: (n) => tt('dd.st_new_many', '{n} new stickers in your sticker book!', { n }) })); SFX.kaching(); ddChipSync(); saveNow();
  }, 1200);
}
on('act', (e) => {
  if (!ddReady() || !e || cur.mode === 'title' || cur.mode === 'adopt') return;
  try { ddDiaryAct(e); ddCount(e); } catch (er) { console.warn('dd act', er); }
  let wished = 0; if (DD_WACT_KINDS.includes(e.kind)) ddActDogs(e).forEach((d) => { const w = ddWish(d); if (w && !w.done && ddWishMatch(w, e, d)) { wished++; ddWishDone(d, w); } });
  if (!wished) setTimeout(() => { if (ddReady()) ddStickers(false); }, 400); // a wish names its new sticker in its own toast
});
const DD_WACT_KINDS = Object.values(DD_WACT);
// the wish chip under the place chip, in the yard and the town places: the active dog's wish (a crayon thought bubble)
function ddChipShown() { return ddReady() && (cur.mode === 'yard' || cur.mode === 'market') && !!$('#status', view) && !(typeof blOn === 'function' && blOn()) && !(typeof phActive === 'function' && phActive()) && !$('#trainPanel:not([hidden])'); }
function ddChipSync() {
  let el = $('#ddWish', view);
  if (!ddChipShown()) { if (el && !el.hidden) { el.hidden = true; DD.ct = ''; toastPlace(); } return; }
  const d = D(), w = ddWish(d); if (!w) return;
  if (!el) { el = document.createElement('button'); el.id = 'ddWish'; el.type = 'button'; el.className = 'dd-wish'; el.onclick = (ev) => { ev.stopPropagation(); ddChipTap(); }; view.appendChild(el); DD.chip = ''; }
  const key = [d.id, w.k, w.a, w.done, I18N.lang].join('|');
  if (DD.chip !== key) {
    DD.chip = key; const txt = ddWishText(w.k, w.a);
    el.innerHTML = `<span class="dd-wh" aria-hidden="true">${headSVG(d)}</span><span class="dd-wt"><b>${esc(w.done ? tt('dd.chip_done', 'Wish come true!') : tt('dd.chip', 'Today I wish for'))}</b> <span class="dd-ww">${esc(txt)}</span></span>${w.done ? `<span class="dd-wok" aria-hidden="true">${ICON('check')}</span>` : ''}<i class="dd-tail" aria-hidden="true"></i>`;
    el.classList.toggle('done', !!w.done);
    el.setAttribute('aria-label', w.done ? tt('dd.chip_aria_done', "{name}'s wish came true: {wish}", { name: d.name, wish: txt }) : tt('dd.chip_aria', '{name} wishes for {wish}', { name: d.name, wish: txt }));
  }
  const st = $('#status', view), vr = view.getBoundingClientRect(), r = st.getBoundingClientRect();
  el.style.top = Math.round(r.bottom - vr.top + 8) + 'px'; el.style.left = Math.round(Math.max(8, r.left - vr.left + 4)) + 'px';
  el.hidden = false; const pos = el.style.top + '|' + el.offsetHeight; if (DD.ct !== pos) { DD.ct = pos; toastPlace(); } // phones: toasts start under the chip (phChipClear)
}
function ddChipTap() {
  if (!ddReady()) return; SFX.click(); const d = D(), w = ddWish(d); if (!w) return;
  const txt = ddWishText(w.k, w.a);
  toast(w.done ? tt('dd.tap_done', '{name} already had today\'s wish: {wish}. A new one comes tomorrow.', { name: d.name, wish: txt }) : tt('dd.tap', '{name} wishes for {wish}. Make it come true today for double Bond, coins and a sticker.', { name: d.name, wish: txt }), 'good');
}

/* ---------------- 2. the Bond track ---------------- */
const DD_BT = { 3: 'b3', 5: 'b5', 7: 'b7' }; // the photo frames on the track; Bond 10 gives the crown and the collar
const DD_B10 = ['Crayon Crown', 'Golden Collar'];
function ddFrameName(f) {
  if (f === 'b3') return tt('dd.fr_b3', 'Bond 3: hearts');
  if (f === 'b5') return tt('dd.fr_b5', 'Bond 5: stars');
  if (f === 'b7') return tt('dd.fr_b7', 'Bond 7: flowers');
  return tt('dd.fr_page', 'Stickers: {page}', { page: ddPageTitle(+f.slice(1)) });
}
function ddGiftLabel(L) { return L === 10 ? tlist(DD_B10.map((n) => shNameAny(n))) : tt('dd.fr_label', 'a photo frame ({name})', { name: ddFrameName(DD_BT[L]) }); }
// the level-up card lists the gift (unlocksFor in 00_core.js)
function ddUnlocks(L) { return ddReady() && (DD_BT[L] || L === 10) ? [tt('dd.tr_gift', 'Gift: {what}', { what: ddGiftLabel(L) })] : []; }
// gives each gift once, when any dog first reaches its level (an old save already there gets them on its first v2.17 day)
function ddTrackGive() {
  const tb = topBond(), got = [];
  [3, 5, 7, 10].forEach((L) => {
    if (tb < L || S.dd.bt[L]) return; S.dd.bt[L] = 1;
    if (L === 10) DD_B10.forEach((n) => { if (!owns('clothes', n)) S.inv.clothes.push(n); }); else if (!S.dd.fr.includes(DD_BT[L])) S.dd.fr.push(DD_BT[L]);
    got.push(L);
  });
  if (!got.length) return; markDirty();
  setTimeout(() => got.forEach((L) => toast(L === 10 ? tt('dd.tr_got10', 'Bond 10 gift: the {crown} and the {collar}! They are in the Wardrobe.', { crown: shNameAny(DD_B10[0]), collar: shNameAny(DD_B10[1]) }) : tt('dd.tr_got', 'Bond {l} gift: {what}. Find it in photo mode.', { l: L, what: ddGiftLabel(L) }), 'gold')), 1800);
}
// the real gates, read from the game's tables: [icon, text] rows for Bond level L
function ddTrackRows(L, d) {
  const u = [], add = (ic, t) => u.push([ic, t]), notShop = (x) => !x.ed && !x.fest && !x.reward && !x.tokyo && !x.treasure;
  TRICKS.forEach((t) => { if (t.bond === L) add('star', t.n === 'Signature' ? tt('core.unlock_signature', 'Signature trick: {trick}', { trick: tSig(d.key) }) : tt('core.unlock_trick', 'Trick: {trick}', { trick: tTrick(t.n) })); });
  if (L > 1) {
    Object.keys(ROUTES).forEach((k) => { if (ROUTES[k].bond === L) add('walk', tt('core.unlock_route', '{dig, select, yes {Walk route: {route} (with digging)} other {Walk route: {route}}}', { dig: ROUTES[k].dig ? 'yes' : 'no', route: ddRouteName(k) })); });
    const pl = Object.keys(PLACES).filter((k) => PLACES[k].bond === L && !ROUTES[k] && !PLACES[k].run && !PLACES[k].tokyo && k !== 'station');
    if (pl.length) add('map', tt('dd.tr_places', 'Places: {list}', { list: tlist(pl.map(ddPlaceName)) }));
    if (typeof TK_PLACES !== 'undefined' && typeof tkOn === 'function' && tkOn()) { const tk = Object.keys(TK_PLACES).filter((k) => TK_PLACES[k].bond === L).map(ddPlaceName); if (L === TK_STATION_BOND) tk.unshift(ddPlaceName('station')); if (tk.length) add('map', tt('dd.tr_tokyo', 'Tokyo: {list}', { list: tlist(tk) })); }
    const shop = TOYS.concat(CLOTHES).filter((x) => x.bond === L && notShop(x)).map((x) => shNameAny(x.n)).concat(typeof twTools === 'function' ? twTools().filter((x) => x.bond === L).map((x) => tt('shop.gene_sniffer', 'Gene Sniffer')) : []);
    if (shop.length) add('shop', tt('dd.tr_shop', 'Shop: {list}', { list: tlist(shop) }));
    HOUSES.forEach((h) => { if (h.bond === L && !h.reward) add('house', tt('core.unlock_house', 'House: {house}', { house: tItem(h.n) })); });
    const home = BEDS.filter((b) => b.bond === L && !b.fm).map((b) => tdata('beds.' + tid(b.n) + '.n', b.n)).concat(Object.keys(HM_DECOR).filter((n) => HM_DECOR[n].bond === L && !HM_DECOR[n].fest && !HM_DECOR[n].ed).map((n) => tdata('hm_decor.' + tid(n) + '.n', n)));
    if (home.length) add('decor', tt('dd.tr_home', 'For the home: {list}', { list: tlist(home) }));
    SPOT_RULES.forEach((r, i) => { if (r && r.bond === L) add('spots', tt('dd.tr_spot', 'Room for dog number {n} (with its other rules)', { n: i })); });
    if (L === 2) { add('garden', tt('dd.tr_garden', 'The veggie patch')); if (typeof fwOn === 'function' && fwOn()) add('heart', tt('dd.tr_party', 'A Bond 2 party with a gift')); }
    if (BREEDING && BREEDING.RULES && BREEDING.RULES.welfare && BREEDING.RULES.welfare.minBond === L) add('playdate', tt('dd.tr_playdate', 'Playdates and puppy families'));
  }
  if (L === 10) add('bond', tt('core.unlock_badge', 'Best Friends badge (it is invisible, but it is there)'));
  if (DD_BT[L] || L === 10) add('gift:' + L, tt('dd.tr_gift', 'Gift: {what}', { what: ddGiftLabel(L) }));
  return u;
}
function ddTrackIcon(ic) {
  if (/^gift:/.test(ic)) { const L = +ic.slice(5); return L === 10 ? art('item', DD_B10[0]) : (typeof fwFrameSVG === 'function' ? fwFrameSVG(ddFrameCol(DD_BT[L])) : ICON('star')); }
  return iconOr(ic, doodle('paw', 0, 2, 1.1));
}
function ddTrackHTML(d) {
  const lv = (d.bond && d.bond.level) || 1, rows = [];
  for (let L = 1; L <= 10; L++) {
    const items = ddTrackRows(L, d), cls = L < lv ? 'got' : L === lv ? 'now' : 'next';
    rows.push(`<li class="dd-rung ${cls}" data-l="${L}"><span class="dd-rn" aria-hidden="true"><b>${tnum(L)}</b></span><div class="dd-rb"><p class="dd-rh">${esc(tt('dd.tr_level', 'Bond {l}', { l: L }))}${L === lv ? ` <span class="dd-here">${esc(tt('dd.tr_here', '{name} is here', { name: d.name }))}</span>` : L < lv ? ` <span class="dd-ok">${ICON('check')}</span>` : ''}</p>
      <ul>${items.map(([ic, t]) => `<li><span class="dd-ri" aria-hidden="true">${ddTrackIcon(ic)}</span><span>${esc(t)}</span></li>`).join('') || `<li><span>${esc(tt('core.lu_nothing', 'Pure friendship. No refunds.'))}</span></li>`}</ul></div></li>`);
  }
  const pts = d.bond ? d.bond.pts : 0, nx = BOND_TH[lv] || 0;
  const sub = lv >= 10 ? tt('core.bond_max', 'Max Bond. Best friends.') : tt('dd.tr_sub', '{pts} of {max} Bond points to Bond {n}. Bond grows with care, play, walks and wishes.', { pts: tnum(pts), max: tnum(nx), n: lv + 1 });
  return `<div class="dd-track"><p class="small dd-trsub">${esc(sub)}</p><ol class="dd-ladder">${rows.join('')}</ol></div>`;
}
function ddTrackOpen(id) {
  if (!ddReady()) return; const d = (id && dogById(id)) || D(); SFX.click();
  const p = openModal(esc(tt('dd.tr_title', "{name}'s Bond track", { name: d.name })), ddTrackHTML(d), { cls: 'dd-trackpop' });
  setTimeout(() => { const r = p.querySelector('.dd-rung.now'), b = p.querySelector('.panel-body'); if (r && b) b.scrollTop = Math.max(0, r.offsetTop - b.offsetTop - 12); }, 40);
}
(function ddBondMeter() {
  const b = $('#hud .bond'); if (!b) return;
  b.addEventListener('click', (e) => { if (!ddReady() || cur.mode === 'title' || cur.mode === 'adopt') return; e.stopPropagation(); ddTrackOpen(); });
})();
function ddMeterSync() { // a see-through button over the Bond meter (at least 44 px tall, so phones get a big enough tap)
  const b = $('#hud .bond'); if (!b) return; const on = ddReady(); let btn = b.querySelector('.dd-trbtn');
  if (on && !btn) { btn = document.createElement('button'); btn.type = 'button'; btn.className = 'dd-trbtn'; b.appendChild(btn); b.classList.add('dd-tap'); }
  if (on) { const l = tt('dd.tr_open', 'Bond {l}. Open the Bond track.', { l: S.bond.level }); if (btn.getAttribute('aria-label') !== l) btn.setAttribute('aria-label', l); }
  if (!on && btn) { btn.remove(); b.classList.remove('dd-tap'); }
}

/* ---------------- 3. the dog diary ---------------- */
const DD_XC = { fetch: 'l', floatfetch: 's', toy: 'y', bath: 'b', nap: 'z', paddle: 's', sprinkle: 's', agility: 'a', photo: 'h', garden: 'g', cook: 'c', paw: 'v', leafpile: 'e', parade: 'e', sweater: 'e', snowdog: 'e', snowdrift: 'e', fortune: 'e', pet: 'p', adopt: 'n', mail: 'm', gaze: 'j', ride: 'r' };
const DD_XORDER = 'nlasyrjebzpgchvm';
const DD_XIC = { n: 'family', l: 'ball', a: 't:Agility Tunnel', s: 'water-spray', y: 't:Squeaky Duck', r: 't:Train Ticket', j: 'w-dawn', e: 'leaf', b: 'tub', z: 'zzz', p: 'pet', g: 'garden', c: 'kitchen', h: 'camera', v: 'dogpark', m: 'mail' }; // the diary doodle: the game's own icons
function ddPageNew() { const d = D(); return { g: day(), d: localISO(), id: d.id, n: d.name, k: d.key, w: [], p: [], f: [], t: [], x: '', wi: '', fr: S.dogs.filter((x) => x.id !== d.id).slice(0, 3).map((x) => x.name) }; }
const ddPageHas = (p) => !!(p && (ddArr(p.w).length || ddArr(p.p).length || ddArr(p.f).length || ddArr(p.t).length || p.x || p.wi));
function ddDiaryClose() {
  const t = S.dd.today; if (!t || t.g === day()) return;
  if (ddPageHas(t)) { S.dd.diary.push(t); if (S.dd.diary.length > DD_DIARY_MAX) S.dd.diary.splice(0, S.dd.diary.length - DD_DIARY_MAX); }
  S.dd.today = null; markDirty();
}
function ddToday() { if (!S || !S.dd) return null; ddDiaryClose(); if (!S.dd.today) { S.dd.today = ddPageNew(); markDirty(); } return S.dd.today; }
function ddAdd(a, v, max) { if (v && !a.includes(v) && a.length < max) a.push(v); }
function ddDiaryAct(e) {
  const p = ddToday(), k = e.kind; if (!p) return;
  if (k === 'walk') ddAdd(p.w, e.area, 3);
  else if (k === 'travel') { if (e.place && e.place !== 'yard' && e.place !== 'house') ddAdd(p.p, e.place, 4); }
  else if (k === 'feed') ddAdd(p.f, e.name, 3);
  else if (k === 'trick') { ddAdd(p.t, e.name, 2); if (e.learned && !p.x.includes('L')) p.x += 'L'; }
  else { const c = DD_XC[k]; if (c && !p.x.includes(c)) p.x += c; }
  markDirty();
}
// the dog's voice, from its breed personality (36_personality.js)
function ddVoice(key) { const t = ((typeof BREED_PERS !== 'undefined' && BREED_PERS[key]) || {}).trait || ''; return { aloof: 'grand', polite: 'grand', show: 'grand', guard: 'grand', loyal: 'grand', ball: 'bouncy', burst: 'bouncy', spin: 'bouncy', smile: 'bouncy', herd: 'bouncy', cheeky: 'bouncy', beg: 'foodie', sniff: 'foodie', needy: 'cuddly', follow: 'cuddly', lazy: 'sleepy', chatty: 'chatty' }[t] || 'cuddly'; }
function ddOpener(v, i) {
  switch (v + i) {
    case 'grand0': return tt('dd.o_grand0', 'Dear diary. Today went as I planned. Mostly.');
    case 'grand1': return tt('dd.o_grand1', 'Dear diary. My human did very well today. I am proud of them.');
    case 'bouncy0': return tt('dd.o_bouncy0', 'Dear diary! BEST DAY EVER! Again!');
    case 'bouncy1': return tt('dd.o_bouncy1', 'Dear diary! So much happened! Here it is, fast:');
    case 'foodie0': return tt('dd.o_foodie0', 'Dear diary. Today smelled wonderful.');
    case 'foodie1': return tt('dd.o_foodie1', 'Dear diary. First the snacks, then everything else.');
    case 'sleepy0': return tt('dd.o_sleepy0', 'Dear diary. I woke up. It was worth it.');
    case 'sleepy1': return tt('dd.o_sleepy1', 'Dear diary. Between naps, some things happened.');
    case 'chatty0': return tt('dd.o_chatty0', 'Dear diary! Woo! Let me tell you everything.');
    case 'chatty1': return tt('dd.o_chatty1', 'Dear diary. I have a lot to say. As always.');
    case 'cuddly1': return tt('dd.o_cuddly1', 'Dear diary. Lots of pats today, and lots of love back.');
    default: return tt('dd.o_cuddly0', 'Dear diary. I was with my human all day. Perfect.');
  }
}
function ddCloser(v, i) {
  switch (v + i) {
    case 'grand0': return tt('dd.c_grand0', 'I approve of this day.');
    case 'grand1': return tt('dd.c_grand1', 'Tomorrow, more of the same, please.');
    case 'bouncy0': return tt('dd.c_bouncy0', 'Can tomorrow come now?');
    case 'bouncy1': return tt('dd.c_bouncy1', 'Zoomies, then bed. Goodnight!');
    case 'foodie0': return tt('dd.c_foodie0', 'Dreaming of dinner already.');
    case 'foodie1': return tt('dd.c_foodie1', 'Goodnight. Do not forget breakfast.');
    case 'sleepy0': return tt('dd.c_sleepy0', 'Now, a long nap.');
    case 'sleepy1': return tt('dd.c_sleepy1', 'Zzz. (That is me, sleeping.)');
    case 'chatty0': return tt('dd.c_chatty0', 'Woo-woo. That was the short version.');
    case 'chatty1': return tt('dd.c_chatty1', 'More tomorrow. So much more.');
    case 'cuddly1': return tt('dd.c_cuddly1', 'Same again tomorrow? Together?');
    default: return tt('dd.c_cuddly0', 'I love my human. Goodnight.');
  }
}
function ddXLine(c) {
  switch (c) {
    case 'n': return tt('dd.x_new', 'A new friend came home with us!');
    case 'l': return tt('dd.x_ball', 'We played ball. I was very, very fast.');
    case 'a': return tt('dd.x_agility', 'I ran the Training Ground. Jumps! Tunnels!');
    case 's': return tt('dd.x_splash', 'I paddled at the Splash Pool. Splash!');
    case 'y': return tt('dd.x_toy', 'I played with my toys.');
    case 'r': return tt('dd.x_ride', 'We rode the Shinkansen. Whoosh!');
    case 'j': return tt('dd.x_fuji', 'We looked at Mt. Fuji together.');
    case 'e': return tt('dd.x_fest', 'There was a festival, and I was in it.');
    case 'b': return tt('dd.x_bath', 'I had a bath. I smell like flowers. Hmm.');
    case 'z': return tt('dd.x_nap', 'I had a lovely nap.');
    case 'p': return tt('dd.x_pet', 'I got so many pats.');
    case 'g': return tt('dd.x_garden', 'I helped in the veggie patch. Mostly by watching.');
    case 'c': return tt('dd.x_cook', 'Something good was cooking in the kitchen.');
    case 'h': return tt('dd.x_photo', 'We took a photo. I did my best face.');
    case 'v': return tt('dd.x_visitor', 'A visiting dog said hello.');
    default: return tt('dd.x_mail', 'We read the mail together.');
  }
}
const ddTrickName = (n, key) => (n === 'Signature' ? tSig(key) : tTrick(n));
function ddPageLines(p) {
  const v = ddVoice(p.k), r = seeded(hashId('dd|' + p.g + '|' + p.id)), L = [ddOpener(v, Math.floor(r() * 2) % 2)], ev = [];
  if (p.wi) ev.push(tt('dd.d_wish', 'My wish came true: {wish}!', { wish: ddWishText(p.wi, null) }));
  if (ddArr(p.w).length) ev.push(tt('dd.d_walk', 'Walks today: {list}. I sniffed every single thing.', { list: tlist(p.w.map(ddRouteName)) }));
  if (ddArr(p.p).length) ev.push(tt('dd.d_place', "Today's outings: {list}.", { list: tlist(p.p.map(ddPlaceName)) }));
  if (ddArr(p.f).length) ev.push(tt('dd.d_food', 'I ate {list}. Delicious.', { list: tlist(p.f.map((n) => shNameAny(n))) }));
  if (ddArr(p.t).length) ev.push(p.x.includes('L') ? tt('dd.d_learned', 'I learned {list}! I am a genius.', { list: tlist(p.t.map((n) => ddTrickName(n, p.k))) }) : tt('dd.d_trick', 'I practised {list}.', { list: tlist(p.t.map((n) => ddTrickName(n, p.k))) }));
  for (const c of DD_XORDER) if (p.x.includes(c)) ev.push(ddXLine(c));
  L.push(...ev.slice(0, 6));
  if (ddArr(p.fr).length) L.push(tt('dd.d_friends', 'My pack was there too: {list}.', { list: tlist(p.fr) }));
  L.push(ddCloser(v, Math.floor(r() * 2) % 2));
  return L;
}
// a small doodle from the game's own icons: up to three things from the day
function ddDoodle(p) {
  const ics = [];
  if (p.wi) ics.push(ICON('heart')); if (ddArr(p.w).length) ics.push(ICON('walk')); if (ddArr(p.f).length) ics.push(art('item', p.f[0]));
  if (ddArr(p.t).length) ics.push(ICON('star')); if (ddArr(p.p).length) ics.push(ICON('map'));
  for (const c of DD_XORDER) if (p.x.includes(c) && DD_XIC[c]) ics.push(/^t:/.test(DD_XIC[c]) ? art('item', DD_XIC[c].slice(2)) : ICON(DD_XIC[c]));
  return ics.slice(0, 3).map((s, i) => `<span class="dd-dic" style="--r:${[-8, 6, -3][i]}deg">${s}</span>`).join('') + `<svg class="dd-dpaw" viewBox="-20 -20 40 40">${doodle('paw', 0, 2, 1.1, 12)}</svg>`;
}
function ddDiaryPages() { const L = S.dd.diary.slice(), t = S.dd.today; if (t && ddPageHas(t)) L.push(Object.assign({ now: 1 }, t)); return L; }
function ddDiaryHTML() {
  if (!S || !S.dd) return ''; ddDiaryClose();
  const P = ddDiaryPages();
  if (!P.length) return `<div class="dd-book dd-empty"><p>${esc(tt('dd.d_empty', 'No pages yet. Spend a day together and {name} will write the first one.', { name: NAME() }))}</p></div>`;
  const i = DD.dpg < 0 || DD.dpg >= P.length ? P.length - 1 : DD.dpg, p = P[i], dog = dogById(p.id); DD.dpg = i;
  const date = p.now ? tt('dd.d_today', 'Today so far') : tdate(new Date(p.d + 'T12:00:00'), { day: 'numeric', month: 'long' });
  return `<div class="dd-book"><article class="dd-page" aria-label="${esc(tt('dd.d_title', "{name}'s diary", { name: p.n }))}"><header class="dd-phead"><span class="dd-dhead" aria-hidden="true">${dog ? headSVG(dog) : art('dogHead', p.k)}</span><span class="dd-pt"><b>${esc(tt('dd.d_title', "{name}'s diary", { name: p.n }))}</b><span class="small">${esc(tt('core.status_day', 'Day {day}', { day: p.g }))} · ${esc(date)}</span></span></header>
    <div class="dd-ptext">${ddPageLines(p).map((l) => `<p>${esc(l)}</p>`).join('')}</div><div class="dd-doodle" aria-hidden="true">${ddDoodle(p)}</div></article>
    ${ddFlip('ddpg', i, P.length, tt('dd.d_page', 'Page {i} of {n}', { i: i + 1, n: P.length }))}</div>`;
}
function ddFlip(attr, i, n, label) {
  return `<div class="dd-flip"><button class="btn" type="button" data-${attr}="${i - 1}"${i <= 0 ? ' disabled' : ''}><span aria-hidden="true">‹</span> ${esc(tt('dd.prev', 'Back'))}</button><span class="dd-pgn">${esc(label)}</span><button class="btn" type="button" data-${attr}="${i + 1}"${i >= n - 1 ? ' disabled' : ''}>${esc(tt('dd.next', 'Next'))} <span aria-hidden="true">›</span></button></div>`;
}
function ddBind(root, redraw) {
  root.querySelectorAll('[data-ddpg]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); SFX.page ? SFX.page() : SFX.click(); DD.dpg = +b.dataset.ddpg; redraw(); }; });
  root.querySelectorAll('[data-ddsp]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); SFX.click(); DD.spg = +b.dataset.ddsp; redraw(); }; });
}

/* ---------------- 4. the sticker book ---------------- */
const DD_PAGES = ['wish', 'kinds', 'town', 'trails', 'big', 'tokyo', 'fest', 'seasons', 'ag', 'pool', 'cal', 'year'];
function ddPageTitle(i) {
  switch (DD_PAGES[i]) {
    case 'wish': return tt('dd.pg_wish', 'Wishes come true');
    case 'kinds': return tt('dd.pg_kinds', 'Little wishes');
    case 'town': return tt('dd.pg_town', 'Around town');
    case 'trails': return tt('dd.pg_trails', 'Out and about');
    case 'big': return tt('dd.pg_big', 'A bigger town');
    case 'tokyo': return tt('dd.pg_tokyo', 'Tokyo trip');
    case 'fest': return tt('dd.pg_fest', 'Festival fun');
    case 'seasons': return tt('dd.pg_seasons', 'Four seasons');
    case 'ag': return tt('dd.pg_ag', 'Training Ground');
    case 'pool': return tt('dd.pg_pool', 'Splash Pool');
    case 'cal': return tt('dd.pg_cal', 'Calendar days');
    case 'fair': case 'ribbons': return ffPageTitle(DD_PAGES[i]); // v2.18 (49_funfair.js)
    default: return tt('dd.pg_year', 'A year of paws');
  }
}
function ddStLabel(k) {
  switch (k) {
    case 'leafpile': return tt('dd.st_leafpile', 'A leap in the leaf pile');
    case 'parade': return tt('dd.st_parade', 'The costume parade');
    case 'sweater': return tt('dd.st_sweater', 'The Ugly Sweater Contest');
    case 'snowdog': return tt('dd.st_snowdog', 'A snowdog');
    case 'snowdrift': return tt('dd.st_snowdrift', 'A dive in the snow');
    case 'fortune': return tt('dd.st_fortune', 'A New Year fortune');
    case 'gaze': return tt('dd.st_gaze', 'Mt. Fuji together');
    case 'photo': return tt('dd.st_photo', 'A photo together');
    case 'ag1': return tt('dd.st_ag1', 'The first run');
    case 'ag3r': return tt('dd.st_ag3r', 'Three rosettes');
    case 'agl': return tt('dd.st_agl', 'The gentle course');
    case 'ag2d': return tt('dd.st_ag2d', 'Two dogs ran');
    case 'pd1': return tt('dd.st_pd1', 'The first paddle');
    case 'spr': return tt('dd.st_spr', 'The sprinkler');
    case 'ff': return tt('dd.st_ff', 'Floating fetch');
    case 'pd2d': return tt('dd.st_pd2d', 'Two dogs paddled');
    default: return k;
  }
}
// [id, page, art, label, test]. Art: 'i:name' an icon, 't:name' an item, 's:key' a Tokyo station stamp, 'c:n' a calendar, 'p:#colour' a paw stamp
function ddStickerDefs() {
  if (DD.defs) return DD.defs;
  const L = [], c = (k) => (S.dd.cnt[k] || 0), v = (k) => !!S.dd.pv[k], add = (id, pg, a, label, test) => L.push({ id, pg, a, label, test });
  [1, 3, 7, 15, 30, 50].forEach((n, i) => add('w' + n, 0, ['i:heart', 'i:star', 'i:hearts', 'i:bond', 'i:sparkle-spot', 't:Golden Bone'][i], () => tt('dd.st_wishes', '{n, plural, one {# wish come true} other {# wishes come true}}', { n }), () => S.dd.wn >= n));
  ['walk', 'ball', 'pet', 'snack', 'bath', 'nap'].forEach((k, i) => add('k_' + k, 1, ['i:walk', 'i:ball', 'i:pet', 'i:Bone-shaped Biscuit', 'i:tub', 'i:zzz'][i], () => ddWishText(k, null), () => (S.dd.wk[k] || 0) > 0));
  ['park', 'square', 'cafe', 'market', 'dogpark', 'vet'].forEach((k, i) => add('v_' + k, 2, ['i:flower', 'i:square', 'i:cafe', 'i:shop', 'i:dogpark', 'i:vet'][i], () => ddPlaceName(k), () => v(k)));
  ['river', 'woods', 'beach', 'hilltop', 'pier', 'salon'].forEach((k, i) => add('v_' + k, 3, ['i:drop', 'i:acorn', 'i:shell', 'i:hilltop', 'i:pier', 'i:salon'][i], () => (PLACES[k] ? ddPlaceName(k) : ddRouteName(k)), () => v(k)));
  ['training', 'pool', 'sunflower', 'bamboo', 'cliffs', 'fujihill'].forEach((k, i) => add('v_' + k, 4, ['t:Agility Tunnel', 't:Doggy Life Vest', 't:Sunflower Collar', 't:Bamboo Ring', 't:Sea Glass', 'i:w-dawn'][i], () => (k === 'fujihill' ? tt('town.place_fujihill', 'Mt. Fuji Lookout') : PLACES[k] ? ddPlaceName(k) : ddRouteName(k)), () => v(k)));
  ['shibuya', 'yoyogi', 'asakusa', 'ueno', 'tokyotower', 'odaiba'].forEach((k) => add('v_' + k, 5, 's:' + k, () => ddPlaceName(k), () => v(k) || !!(S.tk && S.tk.stamps && S.tk.stamps[k])));
  ['leafpile', 'parade', 'sweater', 'snowdog', 'snowdrift', 'fortune'].forEach((k, i) => add('f_' + k, 6, ['i:leaf', 't:Parade Rosette', 't:Ugly Sweater Rosette', 'i:w-snow', 'i:snowdrift', 't:Lucky Cat'][i], () => ddStLabel(k), () => c(k) > 0));
  ['spring', 'summer', 'autumn', 'winter'].forEach((k) => add('s_' + k, 7, 'i:season-' + k, () => capFirst(gkSeason(k)), () => c('s_' + k) > 0));
  add('gaze', 7, 'i:w-dawn', () => ddStLabel('gaze'), () => c('gaze') > 0);
  add('photo', 7, 'i:camera', () => ddStLabel('photo'), () => c('photo') > 0 || !!(S.ph && S.ph.n));
  add('ag1', 8, 't:Agility Tunnel', () => ddStLabel('ag1'), () => c('ag') >= 1 || !!(S.ag && Object.keys(S.ag.best || {}).length));
  add('ag5', 8, 'i:speed', () => tt('dd.st_runs', '{n, plural, one {# run} other {# runs}}', { n: 5 }), () => c('ag') >= 5);
  add('ag10', 8, 'i:clicker', () => tt('dd.st_runs', '{n, plural, one {# run} other {# runs}}', { n: 10 }), () => c('ag') >= 10);
  add('ag3r', 8, 'i:star', () => ddStLabel('ag3r'), () => c('ag3r') > 0 || !!(S.ag && Object.values(S.ag.best || {}).some((x) => x >= 3)));
  add('agl', 8, 'i:heart', () => ddStLabel('agl'), () => c('agl') > 0);
  add('ag2d', 8, 'i:spots', () => ddStLabel('ag2d'), () => ddArr(S.dd.cnt.agd).length >= 2 || Object.keys((S.ag && S.ag.best) || {}).length >= 2);
  add('vest', 9, 't:Doggy Life Vest', () => shNameAny('Doggy Life Vest'), () => !!(S.pool && S.pool.vest));
  add('pd1', 9, 'i:puddle', () => ddStLabel('pd1'), () => c('pd') >= 1);
  add('pd5', 9, 'i:bubbles', () => tt('dd.st_paddles', '{n, plural, one {# paddle} other {# paddles}}', { n: 5 }), () => c('pd') >= 5);
  add('spr', 9, 'i:sprinkler', () => ddStLabel('spr'), () => c('spr') > 0);
  add('ff', 9, 't:Bamboo Ring', () => ddStLabel('ff'), () => c('ff') > 0);
  add('pd2d', 9, 'i:water-spray', () => ddStLabel('pd2d'), () => ddArr(S.dd.cnt.pdd).length >= 2);
  [3, 7, 12, 18, 24].forEach((n) => add('c' + n, 10, 'c:' + n, () => tt('dd.st_calday', 'The {n}-day calendar gift', { n }), () => c('c' + n) > 0));
  add('d30', 10, 'p:#F28FA5', () => tt('dd.st_paws', '{n, plural, one {# paw stamped} other {# paws stamped}}', { n: 30 }), () => c('days') >= 30);
  [2, 3, 4, 6, 9, 12].forEach((n, i) => add('m' + n, 11, 'p:' + ['#C8E9CF', '#FFE3A1', '#F9C99E', '#CBE0F4', '#E0D5F0', '#F28FA5'][i], () => tt('dd.st_months', '{n, plural, one {Paws in # month} other {Paws in # months}}', { n }), () => ddArr(S.dd.mo).length >= n));
  if (typeof ffStickerAdd === 'function') ffStickerAdd(add); // v2.18: the Fun Fair and Ribbons pages (49_funfair.js), only while ffOn()
  DD.defs = L; return L;
}
function ddStArt(a) {
  const [t, n] = [a.slice(0, 1), a.slice(2)];
  if (t === 't') return art('item', n);
  if (t === 's') return artReal('prop', 'ekistamp', { key: n, got: true }) || ICON('star');
  if (t === 'c') return `<span class="dd-cal">${typeof fwCalIcon === 'function' ? fwCalIcon() : ICON('star')}<b>${tnum(+n)}</b></span>`;
  if (t === 'p') return typeof fwPawSVG === 'function' ? fwPawSVG(n) : ICON('pet');
  return iconOr(n, doodle('paw', 0, 2, 1.1));
}
// award every sticker whose test now holds; a full page gives its gift. quiet: no toasts (the caller names the sticker)
function ddStickers(quiet) {
  if (!ddReady()) return []; const got = [];
  ddStickerDefs().forEach((s) => { if (S.dd.st[s.id]) return; let ok = false; try { ok = s.test(); } catch (e) { ok = false; } if (ok) { S.dd.st[s.id] = 1; got.push(s); } });
  if (!got.length) return got; markDirty();
  if (!quiet) got.forEach((s) => toast(tt('dd.st_new', 'New sticker: {name}!', { name: s.label() }), 'good', { group: 'ddst', many: (n) => tt('dd.st_new_many', '{n} new stickers in your sticker book!', { n }) }));
  for (let pg = 0; pg < DD_PAGES.length; pg++) if (!S.dd.pg[pg] && ddPageCount(pg) === 6) ddPageGift(pg);
  return got;
}
const ddPageCount = (pg) => ddStickerDefs().filter((s) => s.pg === pg && S.dd.st[s.id]).length;
const DD_PAGE_WEAR = ['Bow Tie', 'Rain Hat', 'Cowboy Hat', 'Pyjamas', 'Tutu', 'Chef Hat', 'Red Bandana', 'Sailor Collar', 'Yellow Raincoat', 'Polka-dot Raincoat']; // Boutique outfits at Bond 1-2 only
// even pages give an outfit (the next one not owned), odd pages and a full wardrobe give the page's photo frame
function ddPageReward(pg) { if (pg % 2 === 0) { const x = DD_PAGE_WEAR.find((n) => !owns('clothes', n)); if (x) return { t: 'cloth', n: x }; } return { t: 'frame', f: 'p' + pg }; }
function ddPageGift(pg) {
  const r = ddPageReward(pg);
  if (r.t === 'cloth') S.inv.clothes.push(r.n); else if (!S.dd.fr.includes(r.f)) S.dd.fr.push(r.f);
  S.dd.pg[pg] = r.t === 'cloth' ? r.n : r.f; markDirty();
  setTimeout(() => toast(tt('dd.pg_full', 'A full sticker page: {page}! Your gift: {gift}.', { page: ddPageTitle(pg), gift: r.t === 'cloth' ? shNameAny(r.n) : tt('dd.fr_label', 'a photo frame ({name})', { name: ddFrameName(r.f) }) }), 'gold'), 900);
}
function ddBookHTML() {
  if (!S || !S.dd) return ''; ddStickers(true);
  const defs = ddStickerDefs(), n = defs.filter((s) => S.dd.st[s.id]).length;
  let pg = DD.spg; if (pg < 0 || pg >= DD_PAGES.length) { pg = DD_PAGES.findIndex((k, i) => ddPageCount(i) < 6); if (pg < 0) pg = 0; } DD.spg = pg;
  const cells = defs.filter((s) => s.pg === pg).map((s) => { const on = !!S.dd.st[s.id]; return `<li class="dd-st${on ? ' on' : ''}" data-st="${s.id}"><span class="dd-sa" aria-hidden="true">${on ? ddStArt(s.a) : '<b>?</b>'}</span><span class="dd-sl">${esc(s.label())}</span></li>`; }).join('');
  const gift = S.dd.pg[pg], r = gift ? (/^p\d+$/.test(gift) ? { t: 'frame', f: gift } : { t: 'cloth', n: gift }) : ddPageReward(pg), what = r.t === 'cloth' ? shNameAny(r.n) : tt('dd.fr_label', 'a photo frame ({name})', { name: ddFrameName(r.f) });
  const foot = gift ? tt('dd.pg_got', 'Page gift: {gift}. It is yours.', { gift: what }) : tt('dd.pg_gift', 'Fill the page for a gift: {gift}.', { gift: what });
  const dots = DD_PAGES.map((k, i) => `<i class="${i === pg ? 'on' : ''}${ddPageCount(i) === 6 ? ' full' : ''}"></i>`).join('');
  return `<div class="dd-sbook"><p class="small dd-scount">${esc(tt('dd.st_count', '{n} of {total} stickers. Wishes, places, festivals, the Training Ground, the Splash Pool and the calendar all give them.', { n, total: defs.length }))}</p>
    <section class="dd-spage" data-pg="${pg}" aria-label="${esc(ddPageTitle(pg))}"><h3>${esc(ddPageTitle(pg))} <span class="small">${ddPageCount(pg)}/6</span></h3><ul class="dd-sgrid">${cells}</ul><p class="small dd-sgift">${r.t === 'cloth' ? `<span class="dd-gi" aria-hidden="true">${art('item', r.n)}</span>` : `<span class="dd-gi" aria-hidden="true">${typeof fwFrameSVG === 'function' ? fwFrameSVG(ddFrameCol(r.f)) : ''}</span>`}<span>${esc(foot)}</span></p></section>
    <div class="dd-sdots" aria-hidden="true">${dots}</div>${ddFlip('ddsp', pg, DD_PAGES.length, tt('dd.d_page', 'Page {i} of {n}', { i: pg + 1, n: DD_PAGES.length }))}</div>`;
}
function ddBookIcon() { return `<svg viewBox="0 0 64 64" class="dd-bic" aria-hidden="true">${typeof fwTwo === 'function' ? fwTwo('M10 12 Q30 8 54 12 L53 54 Q30 50 11 54Z', '#F9D0D9', 2.4) + fwTwo('M32 10 L32 52', 'none', 2) : ''}<g transform="translate(21 25) scale(.55)">${doodle('heart', 0, 0, 1)}</g><g transform="translate(43 37) scale(.55)">${doodle('spark', 0, 0, 1)}</g><g transform="translate(22 42) scale(.42)">${doodle('paw', 0, 0, 1)}</g></svg>`; }
function ddBookOpen() {
  if (!ddReady()) return;
  const draw = () => { const p = openModal(esc(tt('dd.st_title', 'Sticker book')), ddBookHTML(), { cls: 'dd-bookpop' }); ddBind(p, draw); };
  if (S.fw && S.fw.dockNew && S.fw.dockNew.stickers) { delete S.fw.dockNew.stickers; markDirty(); if (typeof fwDockApply === 'function') fwDockApply(); }
  draw();
}
// the counters behind the stickers (S.dd.cnt, S.dd.pv)
function ddCount(e) {
  const c = S.dd.cnt, k = e.kind, inc = (x) => { c[x] = (c[x] || 0) + 1; }, dogs = (x, name) => { if (!name) return; if (!Array.isArray(c[x])) c[x] = []; if (!c[x].includes(name) && c[x].length < 8) c[x].push(name); };
  if (k === 'travel' && e.place) S.dd.pv[e.place] = 1;
  else if (k === 'walk' && e.area) S.dd.pv[e.area] = 1;
  else if (k === 'stamp' && e.key) S.dd.pv[e.key] = 1;
  else if (['leafpile', 'parade', 'sweater', 'snowdrift', 'fortune', 'gaze', 'photo'].includes(k)) inc(k);
  else if (k === 'snowdog' && e.done) inc('snowdog');
  else if (k === 'agility') { inc('ag'); if (e.rosettes >= 3) inc('ag3r'); if (e.low) inc('agl'); dogs('agd', e.name); }
  else if (k === 'paddle') { inc('pd'); dogs('pdd', e.name); }
  else if (k === 'sprinkle') inc('spr');
  else if (k === 'floatfetch') inc('ff');
  if (S.place && PLACES[S.place] && k === 'travel') S.dd.pv[S.place] = 1;
  markDirty();
}
// the calendar and the season, once a tick: the calendar gifts claimed, days and months with a paw (47_firstweek.js keeps S.fw.cal)
function ddCalSync() {
  const c = S.dd.cnt, f = S.fw, t = localISO(); c['s_' + seasonNow()] = 1;
  if (!f || !f.cal) return;
  ddArr(f.cal.got).forEach((n) => { c['c' + n] = 1; });
  if (f.cal.ym && f.cal.days.length && !S.dd.mo.includes(f.cal.ym)) { S.dd.mo.push(f.cal.ym); if (S.dd.mo.length > 24) S.dd.mo.splice(0, S.dd.mo.length - 24); }
  if (c.dl !== t && f.cal.ym === t.slice(0, 7) && f.cal.days.includes(+t.slice(8, 10))) { c.dl = t; c.days = (c.days || 0) + 1; }
  if (!c.bf) { c.bf = 1; ddArr(f.frames && f.frames.months).forEach((ym) => { if (!S.dd.mo.includes(ym)) S.dd.mo.push(ym); }); S.dd.mo.sort(); if (S.fw.dockNew && isPhone()) S.fw.dockNew.stickers = 1; } // an old save: months already played count
}

/* ---------------- photo frames (35_photo.js lists them) ---------------- */
const DD_FCOL = { b3: '#F7B2C4', b5: '#FFE08A', b7: '#BDE7D2' };
function ddFrameCol(f) { return DD_FCOL[f] || ['#F7B2C4', '#FFE08A', '#BDE7D2', '#CBE0F4', '#E0D5F0', '#FCD8BC'][(+String(f).slice(1) || 0) % 6]; }
function ddFrameList() { return S && S.dd && ddOn() ? ddArr(S.dd.fr).map((f) => ({ k: 'dd' + f, n: ddFrameName(f), c: ddFrameCol(f) })) : []; }
function ddPostcard(w, h, o) {
  const P = window.PawArt, f = String(o.color).slice(2), base = { b3: 'rose', b5: 'sun', b7: 'mint' }[f] || ['rose', 'sun', 'mint', 'sky', 'lilac', 'rose'][(+f.slice(1) || 0) % 6];
  const svg = P.postcard(w, h, Object.assign({}, o, { color: base })), s = Math.max(w, h) / 450;
  const kinds = f === 'b3' ? ['heart'] : f === 'b5' ? ['spark'] : f === 'b7' ? ['flower'] : ['heart', 'spark', 'paw', 'flower'], n = 9, gap = (w - 60 * s) / n;
  const g = Array.from({ length: n }, (_, i) => (typeof fwDoodle === 'function' ? fwDoodle : doodle)(kinds[i % kinds.length], +(30 * s + gap * (i + 0.5)).toFixed(1), +(13 * s).toFixed(1), 0.7 * s, i % 2 ? 12 : -10)).join('');
  return svg.replace(/<\/svg>\s*$/, `<g class="dd-frame">${g}</g></svg>`);
}

/* ---------------- 5. letters: Gerald's weekly news, families of adopted-out puppies ---------------- */
const ddMonday = (iso) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return localISO(d); };
function ddGeraldNews(i, dog) {
  switch (i % 8) {
    case 0: return tt('dd.news_0', 'The Splash Pool has a new rubber duck. Nobody knows who brought it. The duck is not telling.');
    case 1: return tt('dd.news_1', 'Baker Bea is testing a new dog biscuit: plain oats and pumpkin. The pigeons are jealous.');
    case 2: return tt('dd.news_2', 'The Dog Park bench was painted blue. Please let it dry before you sit. That means you, {dog}.', { dog });
    case 3: return tt('dd.news_3', 'Pip says the carrots are growing faster this week. Pip says that every week.');
    case 4: return tt('dd.news_4', 'A very polite squirrel was seen on Market Street. It looked at everything and bought nothing.');
    case 5: return tt('dd.news_5', 'The Training Ground has a new flag by the tunnel. It is yellow and it flaps. Some dogs are suspicious of it.');
    case 6: return tt('dd.news_6', 'Mrs. Plum lost a ball of wool. If your dog finds it, she says it is a gift now.');
    default: return tt('dd.news_7', 'A note from the vet: fresh water every day, shade on hot days, and a lot of love. That is the whole secret.');
  }
}
function ddFamilyNote(i, pup) {
  switch (i % 6) {
    case 0: return tt('dd.fam_0', '{pup} found the sunniest spot in our garden and naps there every afternoon. Thank you for our best friend.', { pup });
    case 1: return tt('dd.fam_1', '{pup} learned to sit for breakfast. Then for lunch. Then for no reason at all. We are very proud.', { pup });
    case 2: return tt('dd.fam_2', 'We walked by the river today. {pup} said hello to every duck, very politely.', { pup });
    case 3: return tt('dd.fam_3', '{pup} has a favourite toy now: a squeaky carrot. It squeaks all day and we love it anyway.', { pup });
    case 4: return tt('dd.fam_4', '{pup} met the cat next door. They sat and looked at each other for a long time. Friends now, we think.', { pup });
    default: return tt('dd.fam_5', '{pup} sends a muddy paw print and a big wag. We hope your dogs are well.', { pup });
  }
}
// at most one Dog Days letter a day, in the first visit's mailbox: Gerald's news once a week, else a family letter every 3 days or so
function ddLetters() {
  const t = localISO(), lt = S.dd.lt; if (lt.day === t || typeof mailPush !== 'function') return;
  const wk = ddMonday(t), pups = ddArr(S.rehomed).filter((r) => r && r.id && r.name);
  if (lt.wk !== wk) {
    lt.wk = wk; lt.day = t; const i = lt.gi++;
    mailPush({ kind: 'news', id: 'dd_news_' + wk, from: tt('dd.news_from', 'Gerald'), title: tt('dd.news_title', 'Town news from Gerald'), text: ddGeraldNews(i, NAME()), ps: tt('dd.news_ps', 'Gerald, who reads every notice board twice') });
  } else if (pups.length && (!lt.fam || isoDays(lt.fam, t) >= 3)) {
    const r = pups[lt.fi % pups.length], i = lt.fi++; lt.fam = t; lt.day = t;
    const fam = typeof shortFam === 'function' && typeof mailFamName === 'function' ? shortFam(mailFamName(r.family)) : tt('mail.a_town_family', 'a town family');
    mailPush({ kind: 'postcard', id: 'dd_fam_' + r.id + '_' + t, from: tt('mail.from_pair', '{name} & {family}', { name: r.name, family: fam }), title: tt('dd.fam_title', 'News about {pup}', { pup: r.name }), text: ddFamilyNote(i, r.name), dog: typeof jrPupDog === 'function' ? jrPupDog(r) : undefined, pose: ['happy', 'sit', 'pet'][i % 3], pup: r.id });
  } else return;
  markDirty();
}

/* ---------------- the loop and hooks ---------------- */
function ddTick() {
  ddExpose();
  if (!ddReady()) { const el = $('#ddWish'); if (el) el.hidden = true; ddMeterSync(); return; }
  if (['title', 'adopt'].includes(cur.mode) || !titleEl.hidden) return;
  DD.n++; ddMeterSync(); ddChipSync(); ddDiaryClose();
  if (DD.n % 5 === 1) { ddCalSync(); ddTrackGive(); ddStickers(false); }
  if (cur.mode === 'yard' && modal.hidden && !busy && (DD.n % 5 === 3)) ddLetters();
}
setInterval(() => { try { ddTick(); } catch (e) { console.warn('dd tick', e); } }, 1000);
on('yard:enter', () => { DD.chip = ''; setTimeout(() => { try { ddChipSync(); } catch (e) { /* the yard changed */ } }, 60); });
on('game:ready', () => { DD.n = 0; DD.chip = ''; DD.dpg = -1; DD.spg = -1; });
window.addEventListener('resize', () => { try { if (ddReady()) ddChipSync(); } catch (e) { /* not ready */ } });
function ddExpose() {
  if (!window.__paw || window.__paw.dd) return;
  window.__paw.dd = {
    on: () => ddOn(), state: () => S && S.dd, wish: (id) => ddWish(id ? dogById(id) : D()), opts: () => ddWishOpts(D()).map((o) => o[0]), text: (k, a) => ddWishText(k, a), make: (day) => ddWishMake(D(), day),
    track: (id) => ddTrackOpen(id), rows: (L) => ddTrackRows(L, D()).map((r) => r[1]), give: () => ddTrackGive(), diary: () => ddDiaryPages(), lines: (p) => ddPageLines(p), close: () => ddDiaryClose(),
    book: () => ddBookOpen(), defs: () => ddStickerDefs().map((s) => ({ id: s.id, pg: s.pg, label: s.label() })), stickers: () => ddStickers(false), reward: (pg) => ddPageReward(pg), pages: DD_PAGES.length,
    letters: () => ddLetters(), mail: () => openMailbox(), journal: (tab) => openJournal(tab), frames: () => ddFrameList(), postcard: (w, h, o) => ddPostcard(w, h, o), voice: (k) => ddVoice(k), chip: () => ddChipSync(), tick: () => ddTick(),
    test: (v) => { prefs.ddTest = !!v; if (typeof barLabels === 'function') barLabels(); ddTick(); }, coinCap: DD_COIN_DAY, coin: DD_COIN, wear: DD_PAGE_WEAR.slice(), b10: DD_B10.slice()
  };
}
