/* ======================= v2.4: 24_missions.js (SHOP & MISSIONS lane, tag ms) =======================
   Daily missions: 3 a day on a crayon checklist card, about 15 coins each, a crayon stamp for all 3, a reward at 7 stamps.
   Spec: V24.md section 4. Data: S.missions. API: msOpen(), msToday(), msTabHTML(). Listens to on('act', ...). */
const MS_PAY = 15, MS_CARD = 7;
const MS_V24FOOD = () => FOOD.filter((f) => f.v24).map((f) => f.n);
const MS_V24TOYS = () => TOYS.filter((x) => x.v24).map((x) => x.n).concat('Squeaky Hedgehog');
/* the pool. t: the card line, s: the short toast name, g: the gate (eligible today), m: does an act count. shop: the "shop" group (one a day at most) */
const MS_POOL = [
  { id: 'feed2', n: 2, t: 'Feed {dog} twice', s: 'Feed twice', m: (a) => a.kind === 'feed' },
  { id: 'pet', n: 1, t: 'Pet {dog} until the tail goes', s: 'Petting', m: (a) => a.kind === 'pet' },
  { id: 'toy', n: 1, t: 'Play with a toy', s: 'Play with a toy', m: (a) => a.kind === 'toy' || a.kind === 'fetch' },
  { id: 'walk', n: 1, t: 'Go for a walk', s: 'Go for a walk', m: (a) => a.kind === 'walk' },
  { id: 'walk_river', n: 1, t: 'Walk the Riverside Trail', s: 'Riverside walk', g: () => topBond() >= ROUTES.river.bond, m: (a) => a.kind === 'walk' && a.area === 'river' },
  { id: 'bath', n: 1, t: 'Give {dog} a bath', s: 'Bath time', m: (a) => a.kind === 'bath' },
  { id: 'nap', n: 1, t: 'Tuck {dog} in for a nap', s: 'Nap time', m: (a) => a.kind === 'nap' },
  { id: 'wear', n: 1, t: 'Put on an outfit', s: 'Put on an outfit', g: () => S.inv.clothes.length > 0, m: (a) => a.kind === 'wear' },
  { id: 'trick', n: 1, t: 'Practise a trick', s: 'Practise a trick', g: () => TRICKS.some((x) => x.bond <= topBond()), m: (a) => a.kind === 'trick' },
  { id: 'garden_plant', n: 1, t: 'Plant a seed', s: 'Plant a seed', g: () => gkOn() && gardenUnlocked() && Object.values(S.inv.seeds || {}).some((v) => v > 0), m: (a) => a.kind === 'garden' && a.what === 'plant' },
  { id: 'harvest', n: 1, t: 'Harvest a crop', s: 'Harvest a crop', g: () => gkOn() && gardenUnlocked() && !!(S.garden && Array.isArray(S.garden.plots) && S.garden.plots.some((p) => p && p.crop)), m: (a) => a.kind === 'garden' && a.what === 'harvest' },
  { id: 'cook', n: 1, t: 'Cook a dish', s: 'Cook a dish', g: () => kOn() && kitchenUnlocked(), m: (a) => a.kind === 'cook' },
  { id: 'buy', n: 1, t: 'Buy something on Market Street', s: 'Market Street shopping', shop: true, m: (a) => a.kind === 'buy' && !['stall', 'popup', 'station', 'tokyo'].includes(a.shop) }, // v2.5/v2.6: the stall and the pop-up are in the Square, not on Market Street
  { id: 'buy_food_new', n: 1, t: 'Try a new snack from Kibble Corner', s: 'New snack', shop: true, m: (a) => a.kind === 'buy' && a.cat === 'food' && MS_V24FOOD().includes(a.name) },
  { id: 'feed_new', n: 1, t: 'Feed {dog} the {arg}', s: 'Feed the {arg}', arg: () => MS_V24FOOD().filter((n) => (S.inv.food[n] || 0) > 0), m: (a, it) => a.kind === 'feed' && a.name === it.arg },
  { id: 'toy_new', n: 1, t: 'Play with the {arg}', s: 'Play with the {arg}', arg: () => MS_V24TOYS().filter((n) => owns('toys', n)), m: (a, it) => (a.kind === 'toy' || a.kind === 'fetch') && a.name === it.arg },
  { id: 'mail', n: 1, t: 'Read a letter', s: 'Read a letter', g: () => typeof mailUnread === 'function' && mailUnread() > 0, m: (a) => a.kind === 'mail' },
  { id: 'scoop', n: 1, t: 'Clean up after {dog}', s: 'Clean up', m: (a) => a.kind === 'scoop' },
  { id: 'treasure', n: 1, t: 'Dig up a treasure', s: 'Dig up a treasure', m: (a) => a.kind === 'treasure' },
  // v2.5: watering (the garden onWater callback) and the festival missions. The FESTIVAL lane fires leafpile / parade / buy shop:'stall'
  { id: 'garden_water', n: 1, t: 'Water the garden', s: 'Water the garden', g: () => gkOn() && gardenUnlocked() && !!(S.garden && Array.isArray(S.garden.plots) && S.garden.plots.some((p) => p && p.crop)), m: (a) => a.kind === 'garden' && a.what === 'water' },
  { id: 'stall', n: 1, t: 'Buy a treat at the Harvest Stall', s: 'Harvest Stall', shop: true, g: () => festOn('leaf'), m: (a) => a.kind === 'buy' && a.shop === 'stall' && a.cat === 'food' },
  { id: 'leafpile', n: 1, t: 'Jump in a leaf pile', s: 'Leaf pile', g: () => (typeof fsCanJump === 'function' ? fsCanJump() : festOn('leaf')), m: (a) => a.kind === 'leafpile' },
  { id: 'parade', n: 1, t: 'Join the costume parade', s: 'Costume parade', g: () => festOn('halloween'), m: (a) => a.kind === 'parade' },
  { id: 'photo', n: 1, t: 'Take a photo of your pack', s: 'Take a photo', m: (a) => a.kind === 'photo' }, // v2.9 PHOTO lane: fired once per saved photo (35_photo.js)
  { id: 'travel', n: 1, t: 'Visit the Dog Park', s: 'Dog Park visit', g: () => topBond() >= ((PLACES.dogpark && PLACES.dogpark.bond) || 2), m: (a) => a.kind === 'travel' && a.place === 'dogpark' },
  // v2.8 Winter & New Year (V28.md section 1): WINTER fires snowdrift / snowdog / sweater and buy shop:'stall', NEW YEAR fires fortune. Lane gates are guarded
  { id: 'snowdrift', n: 1, t: 'Dive into a snowdrift', s: 'Snowdrift', g: () => typeof wnCanJump === 'function' && !!wnCanJump(), m: (a) => a.kind === 'snowdrift' },
  { id: 'snowdog', n: 1, t: 'Build a snowdog', s: 'Snowdog', g: () => typeof wnSnowdogFree === 'function' && !!wnSnowdogFree(), m: (a) => a.kind === 'snowdog' && !!a.done },
  { id: 'wstall', n: 1, t: 'Buy a warm treat from Baker Bea', s: 'Winter Stall', shop: true, g: () => festOn('snow'), m: (a) => a.kind === 'buy' && a.shop === 'stall' && a.cat === 'food' && ['snow', 'newyear'].includes((FOOD.find((f) => f.n === a.name) || {}).fest) },
  { id: 'sweater', n: 1, t: 'Enter the Ugly Sweater Contest', s: 'Sweater Contest', g: () => festOn('lights'), m: (a) => a.kind === 'sweater' },
  { id: 'yearclean', n: 1, t: 'Year-end clean: give {dog} a bath', s: 'Year-end clean', g: () => nyEve(), m: (a) => a.kind === 'bath' },
  { id: 'fortune', n: 1, t: 'Draw a New Year fortune', s: 'New Year fortune', g: () => nyDays() && !(S.ny && S.ny.fortune && S.ny.fortune.date === localISO()), m: (a) => a.kind === 'fortune' },
  // v2.8 Mt. Fuji Lookout (V28.md section 12.4): FUJI HILL fires gaze { first }; travel is the core act. jpHillOpen(): jpOn(), the scene exists, Bond 2
  { id: 'gaze', n: 1, t: 'Look at Mt. Fuji from the Mt. Fuji Lookout', s: 'Look at Mt. Fuji', g: () => jpHillOpen() && !(S.jp && S.jp.gazed === localISO()), m: (a) => a.kind === 'gaze' },
  { id: 'hatsufuji', n: 1, t: 'See the first Fuji of the year', s: 'First Fuji', g: () => nyDays() && jpHillOpen() && !(S.jp && S.jp.first === nyYear()), m: (a) => a.kind === 'gaze' && !!a.first },
  { id: 'travel_fuji', n: 1, t: 'Visit the Mt. Fuji Lookout', s: 'Mt. Fuji Lookout visit', g: () => jpHillOpen(), m: (a) => a.kind === 'travel' && a.place === 'fujihill' },
  // v2.11 Tokyo Trip (V211.md section 5.3, 39_tokyo.js): the ride out and a new station stamp, from the Station's Bond on
  { id: 'tokyo_ride', n: 1, t: 'Ride the Shinkansen to Tokyo', s: 'Shinkansen ride', g: () => tkOn() && topBond() >= TK_STATION_BOND, m: (a) => a.kind === 'ride' && a.dir === 'out' },
  { id: 'tokyo_stamp', n: 1, t: 'Collect a station stamp', s: 'Station stamp', g: () => tkOn() && topBond() >= TK_STATION_BOND && tkStampFree(), m: (a) => a.kind === 'stamp' }
];
const msDef = (id) => MS_POOL.find((x) => x.id === id);
function msFields() {
  if (!S) return; let m = S.missions;
  if (!m || typeof m !== 'object') m = S.missions = {};
  if (typeof m.date !== 'string') m.date = '';
  if (!Array.isArray(m.list)) m.list = [];
  if (typeof m.stamps !== 'number') m.stamps = 0;
  if (typeof m.cards !== 'number') m.cards = 0;
  if (!Array.isArray(m.rewards)) m.rewards = [];
  if (typeof m.stampDay !== 'string') m.stampDay = '';
}
function msItem(def, rnd) {
  const it = { id: def.id, n: def.n, p: 0, done: null };
  if (def.arg) { const a = def.arg(); if (!a.length) return null; it.arg = a[Math.floor(rnd() * a.length)]; }
  return it;
}
/* pick 3 missions for a date, seeded by the date and the first dog: the same day and dog give the same 3 */
function msPick(date) {
  const rnd = seeded(hashId(date + '|' + ((S.dogs && S.dogs[0] && S.dogs[0].id) || 'dog')));
  const pool = MS_POOL.filter((d) => { try { return (!d.g || d.g()) && (!d.arg || d.arg().length > 0); } catch (e) { return false; } });
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const out = []; let shop = false;
  for (const d of pool) { if (out.length >= 3) break; if (d.shop && shop) continue; const it = msItem(d, rnd); if (!it) continue; if (d.shop) shop = true; out.push(it); }
  return out;
}
/* a new real day: three fresh missions. Unfinished ones are simply replaced, nothing is said about them */
function msRoll(force) {
  if (!S) return null; msFields(); const t = localISO();
  if (S.missions.date !== t || force) { S.missions.date = t; S.missions.list = msPick(t); markDirty(); msRefresh(); }
  return S.missions;
}
function msToday() { const m = msRoll(); return m ? m.list : []; }
function msText(it, short) {
  const d = msDef(it.id); if (!d) return it.id;
  return tdata('ms_pool.' + d.id + (short ? '.s' : '.t'), short ? d.s : d.t, { dog: NAME(), arg: it.arg ? shNameAny(it.arg) : '' }); // v2.14 i18n: the pool text is a message with {dog} and {arg}
}
const msDoneN = () => (S && S.missions ? S.missions.list.filter((x) => x.done).length : 0);

/* ---- progress ---- */
let msQueue = [];
const msGuideBusy = () => (typeof gdActive === 'function' && !!gdActive()) || (typeof fsActive === 'function' && !!fsActive()); // v2.5: mission toasts also wait for the costume parade walk
function msSay(text, kind) { if (msGuideBusy()) msQueue.push([text, kind]); else toast(text, kind); }
function msFlush() { if (!msQueue.length || msGuideBusy()) return; const q = msQueue; msQueue = []; q.forEach(([t, k], i) => setTimeout(() => toast(t, k), i * 700)); }
// under the test harness missions only progress when a suite asks for it (prefs.msTest): a mission payout would otherwise change coin totals in older suites
function msAllowed() { return !navigator.webdriver || !!prefs.msTest; }
function msOnAct(a) {
  if (!S || !a || !a.kind || cur.mode === 'title' || !msAllowed()) return; msRoll();
  const m = S.missions; let changed = false;
  m.list.forEach((it) => {
    const d = msDef(it.id); if (!d || it.done) return;
    let hit = false; try { hit = d.m(a, it); } catch (e) { hit = false; }
    if (!hit) return;
    it.p = Math.min(it.n, (it.p || 0) + 1); changed = true;
    if (it.p >= it.n) { it.done = localISO(); const c = addCoins(MS_PAY, { raw: true }); msSay(tt('missions.done', 'Mission done: {mission}. +{n} coins.', { mission: msText(it, true), n: c }), 'gold'); }
  });
  if (!changed) return;
  markDirty();
  if (m.list.length && m.list.every((x) => x.done) && m.stampDay !== m.date) {
    m.stampDay = m.date; m.stamps++;
    setTimeout(() => msSay(tt('missions.all_done', 'All three done! A crayon stamp for today.'), 'gold'), 800);
    if (m.stamps >= MS_CARD) { m.stamps = 0; m.cards++; msReward(); }
    else msRefresh(true);
  } else msRefresh();
}
on('act', msOnAct);

/* ---- the 7-stamp rewards: Astronaut Helmet, then the Rocket Ship, then 120 coins and a Pupcake ---- */
function msReward() {
  const m = S.missions; let kind;
  if (!m.rewards.includes('Astronaut Helmet')) { kind = 'helmet'; m.rewards.push('Astronaut Helmet'); if (!owns('clothes', 'Astronaut Helmet')) S.inv.clothes.push('Astronaut Helmet'); }
  else if (!m.rewards.includes('Rocket Ship')) { kind = 'rocket'; m.rewards.push('Rocket Ship'); if (!owns('houses', 'Rocket Ship')) S.inv.houses.push('Rocket Ship'); }
  else { kind = 'coins'; addCoins(120, { raw: true }); S.inv.food.Pupcake = (S.inv.food.Pupcake || 0) + 1; }
  markDirty(); saveNow(); msRefresh(true);
  msWhenFree(() => msRewardPop(kind));
}
function msRewardPop(kind) {
  SFX.fanfare();
  const art1 = kind === 'helmet' ? itemArt('Astronaut Helmet') : kind === 'rocket' ? (artReal('house', 'Rocket Ship') || itemArt('Rocket Ship')) : itemArt('Pupcake');
  const txt = kind === 'helmet' ? tt('missions.prize_helmet_html', '<p>Seven stamps! The card is full.</p><p>A prize for <b>{name}</b>: the <b>{item}</b>. No soggy shake after rain, no shivering in the snow. It is in the Wardrobe.</p>', { name: NAME(), item: shNameAny('Astronaut Helmet') })
    : kind === 'rocket' ? tt('missions.prize_rocket_html', '<p>Another full card! The prize is a whole <b>{item}</b>.</p><p>Launch is cancelled, forever, for naps. Move in now?</p>', { item: shNameAny('Rocket Ship') })
    : tt('missions.prize_coins_html', '<p>Another full card! <b>+120 coins</b> and one <b>{item}</b>.</p><p>A new card starts tomorrow.</p>', { item: shNameAny('Pupcake') });
  const later = esc(tt('missions.later', 'Later'));
  const foot = kind === 'rocket' ? `<button class="btn no" id="msLater">${later}</button><button class="btn yes big" id="msMove">${esc(tt('missions.move_in', 'Move in'))}</button>`
    : kind === 'helmet' ? `<button class="btn no" id="msLater">${later}</button><button class="btn yes big" id="msWear">${esc(tt('missions.wear_it', 'Wear it'))}</button>` : `<button class="btn yes big" id="msLater">${esc(tt('missions.yay', 'Yay!'))}</button>`;
  const p = openModal(`<span class="hl">${esc(tt('missions.full_card', 'A full stamp card!'))}</span>`, `<div class="ms-prize"><span class="ms-prize-art${kind === 'rocket' ? ' house' : ''}">${art1}</span><div>${txt}</div></div>`, { cls: 'celebrate ms-reward', foot });
  const l = $('#msLater', p); if (l) l.onclick = () => { SFX.click(); closeModal(); };
  const w = $('#msWear', p); if (w) w.onclick = () => { closeModal(); equip('Astronaut Helmet', true); toast(tt('missions.ready_space', '{name} is ready for space. Or the garden.', { name: NAME() }), 'good'); };
  const mv = $('#msMove', p); if (mv) mv.onclick = () => { closeModal(); switchHouse('Rocket Ship'); };
}
/* run a popup when nothing else is in the way (a modal, a tray, a walk, Gerald) */
function msWhenFree(fn, tries = 0) {
  const free = cur.mode === 'yard' && modal.hidden && !busy && !msGuideBusy() && !(typeof popOpen === 'function' && popOpen());
  if (free) { fn(); return; }
  if (tries < 3600) setTimeout(() => msWhenFree(fn, tries + 1), 1000); // after an hour of play the popup is dropped quietly: the item is already given
}

/* ---- art: the checklist card and the stamp card (WORLD ART props), with a pencil doodle fallback ---- */
function msDayLabel() { return tdate(new Date(), { weekday: 'long', day: 'numeric', month: 'short' }); }
function msCardArt() {
  const list = msToday(), items = list.map((it) => ({ text: esc(msText(it)), done: !!it.done, p: it.p || 0, n: it.n })), o = { items, stamps: S.missions.stamps, day: esc(msDayLabel()) };
  return artReal('prop', 'missioncard', o) || msCardFB(o);
}
function msWrap(t, max) { const w = String(t).split(' '), out = ['']; w.forEach((x) => { const l = out[out.length - 1]; if (l && (l + ' ' + x).length > max && out.length < 2) out.push(x); else out[out.length - 1] = l ? l + ' ' + x : x; }); return out; }
function msCardFB(o) {
  const lines = o.items.map((it, i) => { const y = 92 + i * 54, tl = msWrap(it.text, 19); return `<rect x="22" y="${y - 16}" width="20" height="20" rx="3" fill="#FFFBF3" stroke="${INKG}" stroke-width="2.2" transform="rotate(${[-3, 2, -1][i % 3]} 32 ${y - 6})"/>${it.done ? `<path d="M25 ${y - 6} l6 7 l12 -16" fill="none" stroke="#3E9A6A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` : ''}${tl.map((l, k) => `<text x="50" y="${y + k * 18}" font-family="Caveat,cursive" font-weight="700" font-size="17" fill="${INKG}">${l}</text>`).join('')}${it.n > 1 ? `<text x="178" y="${y}" text-anchor="end" font-family="Caveat,cursive" font-size="15" fill="${INKG}">${Math.min(it.p, it.n)}/${it.n}</text>` : ''}<path d="M48 ${y + 26} q60 3 128 -1" fill="none" stroke="#C9B8A6" stroke-width="1.2"/>`; }).join('');
  const nd = o.items.filter((x) => x.done).length;
  return `<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" class="ms-fb"><rect x="8" y="16" width="184" height="236" rx="12" fill="#D9A877" stroke="${INKG}" stroke-width="3"/><path d="M14 30 q2 100 0 210" stroke="#B9875A" stroke-width="2" fill="none" opacity=".6"/><rect x="18" y="32" width="164" height="210" rx="4" fill="#FFFBF3" stroke="${INKG}" stroke-width="2" transform="rotate(-1 100 137)"/><rect x="70" y="6" width="60" height="30" rx="7" fill="#C9CED6" stroke="${INKG}" stroke-width="2.6"/><circle cx="100" cy="16" r="5" fill="#FFFBF3" stroke="${INKG}" stroke-width="2"/><text x="28" y="58" font-family="Caveat,cursive" font-weight="700" font-size="20" fill="${INKG}">${esc(tt('missions.today', 'Today'))}</text><text x="176" y="58" text-anchor="end" font-family="Caveat,cursive" font-size="14" fill="${INKG}">${o.day || ''}</text>${lines}<g transform="translate(160 232) rotate(-8)"><circle r="16" fill="#F9D56E" stroke="${INKG}" stroke-width="2.2"/><text y="6" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="17" fill="${INKG}">${nd}/3</text></g></svg>`;
}
function msStampArt() { const s = S.missions.stamps; return artReal('prop', 'stampcard', { stamps: s }) || msStampFB(s); }
function msStampFB(s) {
  const spots = Array.from({ length: MS_CARD }, (_, i) => { const x = 34 + i * 29, y = 80 + (i % 2 ? 8 : -6); return `<circle cx="${x}" cy="${y}" r="13" fill="none" stroke="#C9B8A6" stroke-width="1.6" stroke-dasharray="3 3"/>${i < s ? doodle('paw', x, y + 1, 0.95, [-12, 8, -4, 14, -8, 5, -14][i]).replace(/#E0D5F0/g, '#F28FA5') : ''}`; }).join('');
  return `<svg viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg" class="ms-fb"><rect x="6" y="10" width="228" height="122" rx="12" fill="#FFF3D6" stroke="${INKG}" stroke-width="3" transform="rotate(-1 120 71)"/><rect x="88" y="2" width="64" height="16" fill="rgba(242,143,165,.55)" transform="rotate(4 120 10)"/><text x="120" y="44" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="22" fill="${INKG}">${esc(tt('missions.stamp_card', 'Stamp card'))}</text>${spots}<text x="120" y="122" text-anchor="middle" font-family="Caveat,cursive" font-size="15" fill="${INKG}">${esc(tt('missions.seven_surprise', '7 stamps is a surprise'))}</text></svg>`;
}
const MS_TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="3" fill="#FFFBF3" stroke="#5B3D32" stroke-width="2.2"/><path class="ms-tk" d="M6 12 l4 5 l9 -11" fill="none" stroke="#3E9A6A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
/* the popup / tab body: the clipboard with today's lines, the coin line, the stamp card */
function msBodyHTML(stampNew) {
  const list = msToday(), m = S.missions, nd = list.filter((x) => x.done).length;
  const lines = list.map((it) => `<li class="${it.done ? 'done' : ''}" data-ms="${esc(it.id)}">${MS_TICK}<span class="ms-t">${esc(msText(it))}</span><span class="ms-p">${it.done ? `+${MS_PAY}` : `${Math.min(it.p || 0, it.n)}/${it.n}`}</span></li>`).join('');
  return `<div class="ms-body"><div class="ms-cardwrap"><span class="ms-card" aria-hidden="true">${msCardArt()}</span><ul class="ms-list" aria-label="${esc(tt('missions.list_aria', "Today's missions"))}">${lines}</ul></div>
    <div class="ms-side"><p class="ms-coins">${tt('missions.coins_html', 'Each mission pays <b>{pay} coins</b>. Done today: <b>{nd} of 3</b>, {got} of {max} coins.', { pay: MS_PAY, nd, got: nd * MS_PAY, max: 3 * MS_PAY })}</p>
    <div class="ms-stampwrap${stampNew ? ' new' : ''}" data-stamps="${m.stamps}"><span class="ms-stampcard" aria-hidden="true">${msStampArt()}</span></div><p class="ms-sline">${tt('missions.stamps_html', '<b>{n} of {total}</b> stamps. All three missions in a day earn a stamp. Seven stamps is a surprise.{cards, select, yes { Full cards so far: {c}.} other {}}', { n: m.stamps, total: MS_CARD, cards: m.cards ? 'yes' : 'no', c: m.cards })}</p></div></div>`;
}
function msOpen() {
  if (!S) return null; msRoll(); SFX.boop(700);
  const p = openModal(tt('missions.title', 'Daily missions'), msBodyHTML(false), { cls: 'ms-pop' });
  return p;
}
function msTabHTML() { if (!S) return ''; msRoll(); return `${msBodyHTML(false)}<p class="small ms-reset">${esc(tt('missions.reset', 'Missions reset every real day at midnight. Finished or not, tomorrow brings three new ones.'))}</p>`; }
/* redraw whatever shows the missions: the popup, the Journal tab, the yard clipboard */
function msRefresh(stampNew) {
  if (!S || !S.missions) return;
  const pop = $('#modal .panel.ms-pop .panel-body'); if (pop) pop.innerHTML = msBodyHTML(!!stampNew);
  const jt = $('#modal .panel.journal .ms-body'); if (jt) jt.outerHTML = msBodyHTML(!!stampNew);
  msYardRedraw();
}

/* ---- the yard clipboard on the left fence (world box, 1000x600 scene) ---- */
const MS_YARD = [208, 318, 50, 64]; // on the house wall between the front door and the mailbox, under the window; clear of #dogHit, the mailbox, the photo frame, the crayon box and the dog house
const MS_YARD_MAXX = 260; // the mailbox tap box starts at x=261
// the tap rect: on phones at least 48 screen px each way (like hmDecorHit), kept left of the mailbox.
// v2.9: while a Feed, Play or Care tray is open the scene shrinks into the strip above it, so the rect grows in world units (44 px, the least a tap needs) instead of the clipboard hiding; msYardFit re-reads the scale whenever the scene resizes.
function msTrayOpen() { return !!document.querySelector('#dock > .tray:not(.dock-idle):not(.mini)'); }
function msYardRect() {
  let [x, y, w, h] = MS_YARD;
  if (isPhone()) {
    const s = phHitScale(), m = (msTrayOpen() ? 44 : 48) / s; if (w < m) { x -= (m - w) / 2; w = m; } if (h < m) { y -= (m - h) / 2; h = m; } if (x + w > MS_YARD_MAXX) x = MS_YARD_MAXX - w;
    // v2.9: the camera can slide the clipboard to the edge (a tray open while the leader is by the dog house). The tap box stays fully on screen; when that would
    // take it off the clipboard (or onto the mailbox) it is switched off until the camera comes back
    const vis = msYardVis(); if (vis) {
      if (x < vis[0]) x = vis[0]; if (x + w > vis[1]) x = vis[1] - w;
      const [ax, , aw] = MS_YARD; if (x < vis[0] - 0.5 || x + w > vis[1] + 0.5 || x + w > MS_YARD_MAXX + 0.5 || x > ax + aw - 12 || x + w < ax + 12) return [MS_YARD[0], MS_YARD[1], 0, 0];
    }
  }
  return [x, y, w, h];
}
// the scene x range on screen (the view's box, inside the window), in scene units
function msYardVis() {
  const svg = $('#view > svg.world'), m = svg && svg.isConnected && svg.getScreenCTM(); if (!m || !(m.a > 0.05)) return null;
  const vr = view.getBoundingClientRect(), l = Math.max(vr.left, 0), r = Math.min(vr.right, innerWidth); if (r - l < 10) return null;
  return [(l - m.e) / m.a, (r - m.e) / m.a];
}
function msYardHit() { const [x, y, w, h] = msYardRect(); return `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="transparent" pointer-events="all"/>`; }
// re-read the scale and resize the tap rect in place (no redraw, so a tap in progress is not lost)
function msYardFit() {
  const r = $('#msCardG > rect'); if (!r) return;
  const [x, y, w, h] = msYardRect(); r.setAttribute('x', f1(x)); r.setAttribute('y', f1(y)); r.setAttribute('width', f1(w)); r.setAttribute('height', f1(h));
}
{ let raf = 0; const fit = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; msYardFit(); }); };
  const dk = $('#dock'), vw = $('#view');
  if (dk && typeof MutationObserver === 'function') new MutationObserver(fit).observe(dk, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  if (vw && typeof MutationObserver === 'function') { new MutationObserver(fit).observe(vw, { attributes: true, attributeFilter: ['style'] }); new MutationObserver(fit).observe(vw, { attributes: true, attributeFilter: ['viewBox'], subtree: true }); } // v2.9: the camera moves (viewBox) too
  if (vw) vw.addEventListener('transitionend', fit, true);
  window.addEventListener('resize', fit); }
// While a tray is open the dock is a full-screen backdrop (a tap on it closes the tray), so the clipboard cannot take the tap itself: a tap that lands inside its
// tap rect closes the tray and opens the Missions sheet instead of only closing the tray.
document.addEventListener('click', (e) => {
  const dk = $('#dock'); if (!dk || e.target !== dk || !isPhone() || !msTrayOpen()) return;
  const r = $('#msCardG > rect'); if (!r) return; const b = r.getBoundingClientRect();
  if (!b.width || e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) return;
  e.stopImmediatePropagation(); e.preventDefault(); popDown(); msOpen();
}, true);
function msYardSVG() {
  if (!S || S.place !== 'yard') return '';
  msFields(); if (S.missions.date !== localISO()) msRoll();
  const [x, y, w, h] = MS_YARD, nd = msDoneN();
  return `<g id="msCardG" class="hot" tabindex="0" role="button" aria-label="${esc(tt('missions.yard_aria', 'Daily missions: {nd} of 3 done', { nd }))}" data-done="${nd}">${place(msCardArt(), x, y, w, h)}<g class="ms-badge" pointer-events="none" transform="translate(${x + w - 8} ${y + 8}) rotate(-8)"><circle r="13" fill="${nd >= 3 ? '#BFE3C8' : '#F9D56E'}" stroke="${INKG}" stroke-width="2.4"/><text y="6" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="16" fill="${INKG}">${nd}/3</text></g>${msYardHit()}</g>`;
}
function msYardBind() {
  const g = $('#msCardG'); if (!g) return;
  const go = (e) => { if (e) e.stopPropagation(); SFX.click(); msOpen(); };
  g.onclick = go; g.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
}
function msYardRedraw() {
  if (cur.mode !== 'yard' || !S || S.place !== 'yard') return;
  const svg = $('#view svg.world'); if (!svg) return;
  const html = msYardSVG(), old = $('#msCardG');
  if (old) old.outerHTML = html;
  else { const a = svg.querySelector('#decorG') || svg.querySelector('#houseG'); if (a) a.insertAdjacentHTML('beforebegin', html); else return; }
  msYardBind();
}
on('yard:enter', () => { if (window.__paw && !window.__paw.ms) msExpose(); if (S && S.place === 'yard') msYardRedraw(); });
on('scene:redraw', () => { if (S && S.place === 'yard') msYardRedraw(); });

/* ---- tests ---- */
function msExpose() {
  if (!window.__paw) return;
  window.__paw.ms = {
    roll: (f) => msRoll(f), today: () => msToday(), open: () => msOpen(), pool: MS_POOL.map((d) => d.id), pick: (date) => msPick(date), yard: MS_YARD,
    force: (ids) => { msRoll(); S.missions.list = ids.map((id) => { const d = msDef(id); return d ? (msItem(d, Math.random) || { id, n: d.n, p: 0, done: null }) : null; }).filter(Boolean); S.missions.stampDay = ''; markDirty(); msRefresh(); return S.missions.list; },
    act: (kind, data) => trackAct(kind, data), flush: () => msFlush(), get queue() { return msQueue.length; }
  };
}
on('game:ready', () => { msFields(); setTimeout(msExpose, 0); });
setInterval(() => { if (S && cur.mode !== 'title') { msFlush(); if (S.missions && S.missions.date && S.missions.date !== localISO()) msRoll(); } }, 1000);
