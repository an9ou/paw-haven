/* ======================= v2.20 "Missions v2": 24d_week.js (MISSIONS lane, Part D: the Week tab) =======================
   Contract: V220.md (section 3, part D). Design: docs/design/missions-v2.md 3.2, 4, 5 and its "Decided" section.
   Gerald's help-wanted board: five small requests a Japan week (Monday 00:00 JST, ms2WeekKey) from five named townsfolk (Baker Bea, Pip,
   Gerald, the Fun Fair keeper, Rosa from the café), drawn by seed from MS_BOARD (17 rows, gated like MS_POOL: only what the player can do now).
   Any 3 of 5 fill the board. A filled board: a stamp on the neighbour card (4 stamps), one thank-you letter in the next morning's mailbox with
   50 coins (the only coins here: a mail gift, paid raw on Collect like every letter, mbGrant), ms2Life('boards'). A full card: a Bond 1-2
   Boutique outfit the player does not own (DD_PAGE_WEAR, in its order), else a Pupcake; the first full card also gives the card sticker.
   A half-done board is not lost: it simply turns into next week's board, its notes and progress kept (a note that cannot be done any more,
   a festival that ended, is swapped for a fresh one). Calm: no expiry words, the soft dot only when the board is newly filled or a new board
   is up (after the first one was seen), batched toasts through ms2Say. Under the harness progress needs prefs.msTest (msAllowed).
   Save: S.missions.wk (v220Fields): w, list [{ id, n, p, done, u?: distinct keys, arg? }], got, card, + lt (the letter on its way), cards, cg, seen.
   Test hook: window.__paw.msw. */
const MSW = { t: 0 };
const MSW_COINS = 50, MSW_NEED = 3, MSW_NOTES = 5, MSW_CARD = 4;
const MSW_WHO = ['bea', 'pip', 'gerald', 'fair', 'cafe']; // one note from each neighbour when their requests can be drawn
function mswWho(k) {
  switch (k) {
    case 'bea': return tt('ms2w.who_bea', 'Baker Bea');
    case 'pip': return tt('ms2w.who_pip', 'Pip the farmer');
    case 'fair': return tt('ms2w.who_fair', 'The Fun Fair keeper');
    case 'cafe': return tt('ms2w.who_cafe', 'Rosa from the café');
    default: return tt('ms2w.who_gerald', 'Gerald');
  }
}
// the festival acts that can be done now (the season's own gates, as in MS_POOL)
function mswFestActs() {
  const L = [];
  try { if (typeof fsCanJump === 'function' ? fsCanJump() : festOn('leaf')) L.push('leafpile'); } catch (e) { /* no festival lane */ }
  try { if (festOn('halloween')) L.push('parade'); } catch (e) { /* none */ }
  try { if (typeof wnCanJump === 'function' && wnCanJump()) L.push('snowdrift', 'snowdog'); } catch (e) { /* no winter lane */ }
  try { if (typeof nyDays === 'function' && nyDays()) L.push('fortune'); } catch (e) { /* none */ }
  return L;
}
function mswFestName(k) {
  switch (k) {
    case 'leafpile': return tt('ms2w.fa_leafpile', 'jump in a leaf pile');
    case 'parade': return tt('ms2w.fa_parade', 'join the costume parade');
    case 'snowdrift': return tt('ms2w.fa_snowdrift', 'dive into a snowdrift');
    case 'snowdog': return tt('ms2w.fa_snowdog', 'build a snowdog');
    default: return tt('ms2w.fa_fortune', 'draw a New Year fortune');
  }
}
const mswRoutesOpen = () => Object.keys(ROUTES).filter((k) => (ROUTES[k].bond || 1) <= topBond()).length;
const mswPlacesOpen = () => (typeof msbPlaces === 'function' ? msbPlaces() : Object.keys(PLACES).filter((k) => k !== 'yard' && k !== 'house')).filter((k) => PLACES[k] && (PLACES[k].bond || 1) <= topBond()).length;
const mswPool = () => typeof mpOn === 'function' && mpOn() && !!PLACES.pool && topBond() >= (PLACES.pool.bond || 2);
// the weekly town event: the photo contest (any week it is still open) or the Saturday stall (Bond 2), like ffphoto / ffstall
const mswEvent = () => typeof ffOn === 'function' && ffOn() && !!S.ff && (topBond() >= 2 || !((P) => P && P.wk === ffWeekOf(localISO()) && (P.judged || (P.e || []).length >= 3))(S.ff.pc));
const mswFairGame = (a, job) => a.kind === 'funfair' && typeof FF_GAMES === 'object' && !!FF_GAMES[a.game] && !!FF_GAMES[a.game].job === job;
/* the requests. who: the neighbour, n: how many, t: the note, s: the short name (toasts, the letter), g: the gate, m: does an act count,
   u: a distinct key (routes, places: the same one twice counts once), arg: a choice made when the note is drawn (the festival act) */
const MS_BOARD = [
  { id: 'w_walk', who: 'gerald', n: 6, t: 'Take {dog} on 6 walks', s: 'Six walks', m: (a) => a.kind === 'walk' },
  { id: 'w_routes', who: 'gerald', n: 3, t: 'Walk 3 different routes', s: 'Three routes', g: () => mswRoutesOpen() >= 3, m: (a) => a.kind === 'walk' && !!a.area, u: (a) => a.area },
  { id: 'w_places', who: 'gerald', n: 4, t: 'Visit 4 different places in town', s: 'Four places', g: () => mswPlacesOpen() >= 4, m: (a) => a.kind === 'travel' && !!a.place && a.place !== 'yard' && a.place !== 'house', u: (a) => a.place },
  { id: 'w_wish', who: 'gerald', n: 3, t: 'Make 3 wishes come true', s: 'Three wishes', g: () => typeof ddReady === 'function' && ddReady(), m: (a) => a.kind === 'wish' },
  { id: 'w_harvest', who: 'pip', n: 3, t: 'Harvest 3 crops', s: 'Three crops', g: () => gkOn() && gardenUnlocked(), m: (a) => a.kind === 'garden' && a.what === 'harvest' },
  { id: 'w_water', who: 'pip', n: 3, t: 'Water the garden 3 times', s: 'Garden watering', g: () => gkOn() && gardenUnlocked(), m: (a) => a.kind === 'garden' && a.what === 'water' },
  { id: 'w_treasure', who: 'pip', n: 2, t: 'Dig up 2 treasures on walks', s: 'Two treasures', m: (a) => a.kind === 'treasure' },
  { id: 'w_cook', who: 'bea', n: 2, t: 'Cook 2 dishes in the kitchen', s: 'Two dishes', g: () => kOn() && kitchenUnlocked(), m: (a) => a.kind === 'cook' },
  { id: 'w_bath', who: 'bea', n: 2, t: 'Give 2 baths', s: 'Two baths', m: (a) => a.kind === 'bath' },
  { id: 'w_jobs', who: 'bea', n: 2, t: 'Help with 2 town jobs', s: 'Two town jobs', g: () => msFf(true), m: (a) => mswFairGame(a, true) },
  { id: 'w_fair', who: 'fair', n: 2, t: 'Play 2 Fun Fair games', s: 'Two Fun Fair games', g: () => msFf(false), m: (a) => mswFairGame(a, false) },
  { id: 'w_pool', who: 'fair', n: 2, t: 'Paddle or play float fetch at the Splash Pool twice', s: 'Splash Pool fun', g: () => mswPool(), m: (a) => a.kind === 'paddle' || a.kind === 'floatfetch' },
  { id: 'w_event', who: 'fair', n: 1, t: 'Enter the weekly photo contest or set out your Saturday stall', s: 'The town event', g: () => mswEvent(), m: (a) => a.kind === 'funfair' && (a.game === 'photo' || a.game === 'stall') },
  { id: 'w_fest', who: 'fair', n: 1, t: 'Festival fun: {act}', s: 'Festival fun', arg: () => mswFestActs(), m: (a, it) => a.kind === it.arg && (a.kind !== 'snowdog' || !!a.done) },
  { id: 'w_photo', who: 'cafe', n: 3, t: 'Take 3 photos for the café wall', s: 'Three photos', m: (a) => a.kind === 'photo' },
  { id: 'w_cafe', who: 'cafe', n: 2, t: 'Bring {dog} to the café twice', s: 'Two café visits', g: () => !!PLACES.cafe && topBond() >= (PLACES.cafe.bond || 1), m: (a) => a.kind === 'travel' && a.place === 'cafe' },
  { id: 'w_trick', who: 'cafe', n: 8, t: 'Practise tricks 8 times', s: 'Trick practice', g: () => TRICKS.some((x) => x.bond <= topBond()), m: (a) => a.kind === 'trick' }
];
const mswDef = (id) => MS_BOARD.find((x) => x.id === id);
// the requests that can be drawn now (gate and arg ok), without the ids in excl
function mswEligible(excl) {
  return MS_BOARD.filter((d) => { if (excl && excl.includes(d.id)) return false; try { return (!d.g || !!d.g()) && (!d.arg || d.arg().length > 0); } catch (e) { return false; } });
}
function mswItem(d, rnd) {
  const it = { id: d.id, n: d.n, p: 0, done: null };
  if (d.u) it.u = [];
  if (d.arg) { const a = d.arg(); if (!a.length) return null; it.arg = a[Math.floor(rnd() * a.length) % a.length]; }
  return it;
}
// five notes for a Japan week, seeded by its Monday and the first dog (msSeed): one from each neighbour first, then any others
function msWeekPick(w, keep) {
  const rnd = msSeed(w, '|week'), out = (keep || []).slice(), pool = mswEligible(out.map((x) => x.id)), who = MSW_WHO.slice();
  for (let i = who.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [who[i], who[j]] = [who[j], who[i]]; }
  const take = (L) => { const d = L.splice(Math.floor(rnd() * L.length) % L.length, 1)[0]; pool.splice(pool.indexOf(d), 1); const it = mswItem(d, rnd); if (it) out.push(it); };
  who.forEach((k) => { if (out.length >= MSW_NOTES || out.some((x) => (mswDef(x.id) || {}).who === k)) return; const L = pool.filter((d) => d.who === k); if (L.length) take(L); });
  while (out.length < MSW_NOTES && pool.length) take(pool.slice());
  return out;
}
// the board of this Japan week. A new week: a fresh board, or (a board left half done) the same board with its progress, nothing lost
function msWeekRoll(force) {
  if (!S || !S.missions || !Array.isArray(S.dogs) || !S.dogs.length) return [];
  if (!S.missions.wk || !Array.isArray(S.missions.wk.list)) v220Fields(S, false);
  const wk = S.missions.wk, w = ms2WeekKey();
  if (wk.w !== w || force) {
    const half = !force && !!wk.w && wk.got !== wk.w && wk.list.some((x) => x && (x.done || x.p > 0));
    if (half) { // keep every note that is done or can still be done; a note that cannot be done any more (its season is over) makes room for a fresh one
      const ok = new Set(mswEligible().map((d) => d.id)), keep = wk.list.filter((x) => x && mswDef(x.id) && (x.done || ok.has(x.id)));
      wk.list = keep.length < MSW_NOTES ? msWeekPick(w, keep) : keep.slice(0, MSW_NOTES);
    } else wk.list = msWeekPick(w);
    wk.w = w; markDirty();
  }
  return wk.list;
}
const msWeekDone = () => (S && S.missions && S.missions.wk && Array.isArray(S.missions.wk.list) ? S.missions.wk.list.filter((x) => x && x.done).length : 0); // part E reads it
const mswFull = () => { const wk = S.missions.wk; return !!wk.w && wk.got === wk.w; };
function mswText(it, short) {
  const d = mswDef(it.id); if (!d) return it.id;
  return tdata('ms_board.' + d.id + (short ? '.s' : '.t'), short ? d.s : d.t, { dog: NAME(), act: it.arg ? mswFestName(it.arg) : '' });
}

/* ---------------- progress (the act bus) ---------------- */
function msWeekOnAct(a) {
  if (!S || !a || !a.kind || cur.mode === 'title' || !S.missions || !ms2Ok()) return;
  const L = msWeekRoll(), wk = S.missions.wk; if (!L.length) return;
  let changed = false; const now = [];
  L.forEach((it) => {
    const d = mswDef(it.id); if (!d || it.done) return;
    let hit = false; try { hit = !!d.m(a, it); } catch (e) { hit = false; }
    if (!hit) return;
    if (d.u) { const k = d.u(a); if (!k) return; if (!Array.isArray(it.u)) it.u = []; if (it.u.includes(k)) return; it.u.push(k); it.p = Math.min(it.n, it.u.length); }
    else it.p = Math.min(it.n, (it.p || 0) + 1);
    changed = true; if (it.p >= it.n) { it.done = jstISO(); now.push(it); }
  });
  if (!changed) return;
  markDirty();
  now.forEach((it) => ms2Say(tt('ms2w.note_done', 'A note done for {who}: {note}.', { who: mswWho((mswDef(it.id) || {}).who), note: mswText(it, true) }), 'good', 'msw', (k) => tt('ms2w.note_done_many', '{n} board notes done.', { n: k })));
  if (wk.got !== wk.w && msWeekDone() >= MSW_NEED) msWeekFill();
  msRefresh();
}
on('act', msWeekOnAct);
// the board is filled: a stamp on the neighbour card (a full card gives its gift now), the letter comes the next morning
function msWeekFill() {
  const wk = S.missions.wk; if (!wk.w || wk.got === wk.w) return false;
  if (wk.lt) msWeekLetter(true); // a letter still on its way from an earlier board goes out first
  wk.got = wk.w; wk.card = (wk.card || 0) + 1; let gift = null;
  if (wk.card >= MSW_CARD) { wk.card = 0; wk.cards = (wk.cards || 0) + 1; gift = msWeekCardGift(); wk.cg = { w: wk.w, n: gift.n }; if (wk.cards === 1 && typeof msCardSticker === 'function') msCardSticker(); }
  wk.lt = { w: wk.w, d: localISO(), ids: wk.list.filter((x) => x && x.done).map((x) => x.id), c: wk.card, g: gift ? gift.n : '' };
  ms2Life('boards'); markDirty(); msHudSync(true);
  ms2Say(tt('ms2w.filled', "Gerald's board is filled! A stamp on your neighbour card, and a thank-you letter with {n} coins comes tomorrow morning.", { n: MSW_COINS }), 'gold', 'mswf');
  if (gift) ms2Say(gift.t === 'cloth' ? tt('ms2w.card_cloth', 'A full neighbour card! A gift for {name}: the {item}. It is in the Wardrobe.', { name: NAME(), item: shNameAny(gift.n) }) : tt('ms2w.card_food', 'A full neighbour card! A gift for {name}: a {item}. It is in the Feed tray.', { name: NAME(), item: shNameAny(gift.n) }), 'gold', 'mswc');
  ms2Sfx('kaching'); // waits for Gerald like the toasts
  return true;
}
// every 4 boards: a Bond 1-2 Boutique outfit not owned yet (the sticker book's own list and order), else a Pupcake
function msWeekCardGift() {
  const wear = typeof DD_PAGE_WEAR !== 'undefined' ? DD_PAGE_WEAR : [], x = wear.find((n) => !owns('clothes', n));
  if (x) { S.inv.clothes.push(x); markDirty(); return { t: 'cloth', n: x }; }
  S.inv.food.Pupcake = (S.inv.food.Pupcake || 0) + 1; markDirty(); return { t: 'food', n: 'Pupcake' };
}
const mswNextGift = () => { const wear = typeof DD_PAGE_WEAR !== 'undefined' ? DD_PAGE_WEAR : []; return wear.find((n) => !owns('clothes', n)) || ''; };
// the thank-you letter (one per board, id msw_<Monday>), in the first quiet yard of a later local day (now: at once). Its 50 coins wait for Collect
function msWeekLetter(now) {
  const wk = S && S.missions && S.missions.wk, L = wk && wk.lt; if (!L || typeof mailPush !== 'function') return null;
  if (!now && !(String(L.d) < localISO())) return null;
  wk.lt = null; markDirty();
  const who = tlist([...new Set((L.ids || []).map((id) => (mswDef(id) || {}).who).filter(Boolean))].map(mswWho));
  const card = L.g ? tt('ms2w.letter_card_gift', 'Your neighbour card was full, so the {item} is already yours.', { item: shNameAny(L.g) }) : tt('ms2w.letter_card', 'Your neighbour card has {n} of {total} stamps now.', { n: L.c || 0, total: MSW_CARD });
  return mailPush({ kind: 'gift', id: 'msw_' + L.w, from: tt('ms2w.letter_from', 'Gerald'), title: tt('ms2w.letter_title', 'Thank you from the neighbours'),
    text: tt('ms2w.letter_text', 'Thank you for helping out: {who}. Everyone in town says {name} was a very good helper. The neighbours put {n} coins in the tip jar for you.', { who, name: NAME(), n: MSW_COINS }) + ' ' + card,
    ps: tt('ms2w.letter_ps', 'Gerald, who pinned up every note himself'), gift: { coins: MSW_COINS } });
}

/* ---------------- the soft dot ---------------- */
// the board's state as seen: its Monday, and + once it is filled. The dot: a filled board not looked at yet, or a new board after the first one was seen
const mswKey = (wk) => wk.w + (wk.got === wk.w ? '+' : '');
function msWeekDot() {
  const wk = S && S.missions && S.missions.wk; if (!wk || !wk.w || !Array.isArray(wk.list) || !wk.list.length || !ms2Ok() || cur.mode === 'title') return false;
  return wk.seen !== mswKey(wk) && (wk.got === wk.w || !!wk.seen);
}
function mswSeen() { const wk = S.missions.wk, k = mswKey(wk); if (wk.seen !== k) { wk.seen = k; markDirty(); setTimeout(() => msHudSync(), 0); } }

/* ---------------- the Week tab ---------------- */
// the plain cork board and pinned note (every fill inside its outline) until the art lane's PawArt.MISSIONS.board / note are merged
const MSW_NOTE_COL = ['#FFF3B8', '#CBE0F4', '#F7D0DA', '#D6EDC9', '#FFE1C2'];
function mswBoardFB() {
  const notes = MSW_NOTE_COL.map((c, i) => { const x = 18 + i * 34, r = [-6, 4, -3, 6, -4][i]; return `<g transform="translate(${x} ${i % 2 ? 30 : 24}) rotate(${r})"><rect x="0" y="0" width="26" height="28" rx="2" fill="${c}" stroke="#5B3D32" stroke-width="1.6"/><path d="M5 10 h16 M5 16 h12" stroke="#8A7566" stroke-width="1.3" stroke-linecap="round"/><circle cx="13" cy="3" r="3" fill="#F28FA5" stroke="#5B3D32" stroke-width="1.2"/></g>`; }).join('');
  return `<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="6" width="192" height="70" rx="6" fill="#C99A6B" stroke="#5B3D32" stroke-width="2.6"/><rect x="11" y="13" width="178" height="56" rx="3" fill="#E2B985" stroke="#5B3D32" stroke-width="1.6"/>${notes}</svg>`;
}
function mswNoteFB(i) {
  const c = MSW_NOTE_COL[i % MSW_NOTE_COL.length];
  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(${[-5, 4, -3, 5, -4][i % 5]} 20 21)"><rect x="6" y="7" width="28" height="29" rx="2" fill="${c}" stroke="#5B3D32" stroke-width="1.8"/><path d="M11 17 h18 M11 23 h14 M11 29 h10" stroke="#8A7566" stroke-width="1.4" stroke-linecap="round"/></g><circle cx="20" cy="8" r="4" fill="#F28FA5" stroke="#5B3D32" stroke-width="1.5"/></svg>`;
}
const MSW_TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12 l4 5 l10 -11" fill="none" stroke="#3E9A6A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function mswNoteHTML(it, i) {
  const d = mswDef(it.id); if (!d) return '';
  const p = Math.min(it.p || 0, it.n), pct = Math.round(100 * p / (it.n || 1)), done = !!it.done, lbl = tt('ms2w.bar', '{n} of {total}', { n: p, total: it.n });
  const na = ms2Art('note', i % 5); // the art lane's pinned note is the row itself (stretched, the text inside noteText), else a small note doodle on a crayon card
  return `<li class="msw-note${done ? ' done' : ''}${na ? ' art' : ''}" data-req="${esc(it.id)}" data-v="${i % 5}">${na ? `<span class="msw-nbg" aria-hidden="true">${ms2Stretch(na)}</span>` : `<span class="msw-nart" aria-hidden="true">${mswNoteFB(i)}</span>`}<div class="msw-nmain"><p class="msw-who">${esc(mswWho(d.who))}</p><p class="msw-what">${esc(mswText(it))}</p>`
    + `<div class="msw-barrow"><span class="msw-bar" role="progressbar" aria-label="${esc(lbl)}" aria-valuemin="0" aria-valuemax="${it.n}" aria-valuenow="${p}"><i style="width:${pct}%"></i></span><span class="msw-num">${done ? `<span class="msw-tick">${MSW_TICK}</span>${esc(tt('ms2w.done', 'Done'))}` : `${tnum(p)} / ${tnum(it.n)}`}</span></div></div></li>`;
}
function mswCardHTML() {
  const wk = S.missions.wk, n = wk.card || 0, got = wk.cg && wk.cg.w === wk.w && wk.cg.n;
  const spots = Array.from({ length: MSW_CARD }, (_, i) => `<span class="msw-spot${i < n ? ' on' : ''}" aria-hidden="true">${i < n ? `<svg viewBox="-16 -16 32 32">${doodle('paw', 0, 0, 1, [-12, 8, -4, 14][i]).replace(/#E0D5F0/g, '#F28FA5')}</svg>` : ''}</span>`).join('');
  const next = mswNextGift();
  const txt = got ? tt('ms2w.card_got', 'A full card this week: the {item} is yours. A new card has started.', { item: shNameAny(got) })
    : next ? tt('ms2w.card_next', 'Neighbour card: {n} of {total} stamps. A full card gives a Boutique outfit.', { n, total: MSW_CARD }) : tt('ms2w.card_next_food', 'Neighbour card: {n} of {total} stamps. A full card gives a Pupcake.', { n, total: MSW_CARD });
  return `<div class="msw-card"><span class="msw-spots">${spots}</span><p>${esc(txt)}</p></div>`;
}
function msWeekHTML() {
  if (!S || !S.missions) return '';
  const L = msWeekRoll(), wk = S.missions.wk; if (!L.length) return '';
  const nd = msWeekDone(), full = mswFull();
  mswSeen();
  const status = full ? (wk.lt && wk.lt.w === wk.w ? tt('ms2w.full_wait', "Board filled! Gerald's thank-you letter with {n} coins comes tomorrow morning.", { n: MSW_COINS }) : tt('ms2w.full_sent', "Board filled! Gerald's thank-you letter is in your mailbox."))
    : tt('ms2w.intro', 'Help with any three of these five notes and Gerald sends a thank-you letter with {n} coins.', { n: MSW_COINS });
  // the art lane's cork board carries the title on its paper banner (boardText); the plain board keeps the title beside it
  const ba = ms2Art('board'), h3 = `<h3>${esc(tt('ms2w.title', "Gerald's help-wanted board"))}</h3>`;
  const head = `<div class="msw-head${ba ? ' art' : ''}">${ba ? `<div class="msw-board"><span class="msw-art art" aria-hidden="true">${ba}</span>${h3}</div>` : `<span class="msw-art" aria-hidden="true">${mswBoardFB()}</span>`}<div class="msw-headtxt">${ba ? '' : h3}`
    + `<p class="msw-count"><b>${esc(tt('ms2w.count', '{n} of {total}', { n: Math.min(nd, MSW_NEED), total: MSW_NEED }))}</b></p><p class="msw-intro">${esc(status)}</p></div></div>`;
  return `<div class="msw${full ? ' full' : ''}">${head}<ul class="msw-notes">${L.map(mswNoteHTML).join('')}</ul>${mswCardHTML()}</div>`;
}
// the desktop right column of Today: the board in two lines and a way to it (phones have the Week tab one tap away)
function msWeekSummaryHTML() {
  if (!S || !S.missions || isPhone()) return '';
  const L = msWeekRoll(); if (!L.length) return '';
  const nd = msWeekDone(), full = mswFull(), open = L.find((x) => x && !x.done);
  mswSeen();
  const line = full ? tt('ms2w.sum_full', 'Filled. A thank-you letter is on its way.') : open ? tt('ms2w.sum_next', 'Next: {note} for {who}', { note: mswText(open, true), who: mswWho((mswDef(open.id) || {}).who) }) : '';
  return `<div class="msw-sum${full ? ' full' : ''}"><span class="msw-sumart" aria-hidden="true">${ms2Art('board') || mswBoardFB()}</span><div class="msw-sumtxt"><p><b>${esc(tt('ms2w.sum_title', 'Help-wanted board'))}</b> ${esc(tt('ms2w.count', '{n} of {total}', { n: Math.min(nd, MSW_NEED), total: MSW_NEED }))}</p>${line ? `<p class="small">${esc(line)}</p>` : ''}<button class="btn msw-go" type="button" data-mswgo="1">${esc(tt('ms2w.sum_go', 'See the board'))}</button></div></div>`;
}
document.addEventListener('click', (e) => {
  const b = e.target && e.target.closest && e.target.closest('.msw-go[data-mswgo]'); if (!b || !S) return;
  e.stopPropagation(); SFX.click(); MS2.tab = 'week'; msRefresh(); const t = document.querySelector('#modal .ms-tab[data-mstab="week"]'); if (t) t.focus();
});

/* ---------------- wiring ---------------- */
// the roll (a new Monday) and the letter (a later morning, a quiet yard), every 2 s
setInterval(() => {
  if (!S || !S.missions || !S.missions.wk || cur.mode === 'title' || !ms2On()) return; // off (MS2_LIVE): no board, no letter
  try {
    if (S.missions.wk.w !== ms2WeekKey()) { msWeekRoll(); msHudSync(); } // a new Monday board lights the soft dot at once
    if (S.missions.wk.lt && cur.mode === 'yard' && modal.hidden && !busy) msWeekLetter(false);
  } catch (e) { console.warn('week', e); }
}, 2000);
function mswExpose() {
  if (!window.__paw) return;
  window.__paw.msw = {
    pool: MS_BOARD.map((d) => d.id), who: (id) => (mswDef(id) || {}).who, eligible: () => mswEligible().map((d) => d.id), pick: (w) => msWeekPick(w || ms2WeekKey()).map((x) => x.id),
    roll: (f) => msWeekRoll(f), list: () => msWeekRoll(), done: () => msWeekDone(), fill: () => msWeekFill(), letter: (now) => msWeekLetter(now), gift: () => msWeekCardGift(), next: () => mswNextGift(),
    html: () => msWeekHTML(), sum: () => msWeekSummaryHTML(), dot: () => msWeekDot(), text: (it, s) => mswText(it, s), coins: MSW_COINS, need: MSW_NEED, festActs: () => mswFestActs(),
    gate: (id) => { const d = mswDef(id); try { return !!d && (!d.g || !!d.g()) && (!d.arg || d.arg().length > 0); } catch (e) { return false; } },
    force: (ids) => { msWeekRoll(); const rnd = msSeed(ms2WeekKey(), '|wforce'); S.missions.wk.list = ids.map((id) => { const d = mswDef(id); return d ? (mswItem(d, rnd) || { id, n: d.n, p: 0, done: null, arg: 'leafpile' }) : null; }).filter(Boolean); markDirty(); msRefresh(); return S.missions.wk.list; }
  };
}
on('game:ready', () => setTimeout(mswExpose, 0));
on('yard:enter', () => { if (window.__paw && !window.__paw.msw) mswExpose(); });
