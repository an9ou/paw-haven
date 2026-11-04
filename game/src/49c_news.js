/* ======================= v2.18.2 "What's new in town": 49c_news.js (tag nw) =======================
   After an update with news, every player sees one crayon sheet once, the first time the yard is calm on that version.
   Data: NEWS below, newest first. Each entry: { id (the version), date (ISO), title(), items: [{ ic(), tx() }] (3 to 5), pic? }.
   pic: 'dog' (the player's own dog's crayon head) or { item: 'Shop item name' }. Every text goes through tt() (key nw.<id>.*): add the
   English here, run `node tools/i18n_extract.js --en`, translate the new keys in one batch, `node tools/i18n_pack.js`.
   Save field S.newsSeen: the last id seen ('' on an old save, so it sees the newest entry once; a new save gets the newest id at adoption).
   When: on a calm yard (no popup, no first-day guide, no level-up or Bond 2 party, and the calendar's daily page goes first), after 3 s of calm.
   Again: Settings "What's new" and the phone "..." menu. Under the test harness it needs prefs.nwTest (the older suites never see it).
   Test hook: window.__paw.nw. How to add an entry each release: V218.md section "What's new". */
function nwOn() { return !navigator.webdriver || !!prefs.nwTest; }
const NW = { calm: 0, exposed: false };
const nwDate = (iso) => tdate(new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)), { day: 'numeric', month: 'long' });
const nwItemArt = (n) => art('item', n);
const nwFmDate = (id, i) => { const m = FM_MARKETS.find((x) => x.id === id); return m ? nwDate('2026-' + m.win()[i]) : ''; }; // a market's first (0) or last (1) day, 2026
const NEWS = [
  { // Daily rhythm (docs/design/daily-rhythm.md). The date is a placeholder until the release day is set (after v2.19, 7 Nov 2026)
    id: '2.19.2', date: '2026-11-04', c: '#E2F0D9', d: 'paw', pic: 'dog',
    title: () => tt('nw.v2192.title', 'A calmer day in town'),
    items: [
      { ic: () => nwSafe(() => msHudIcon()), tx: () => tt('nw.v2192.mission', 'One daily mission now, worth {n} coins and a crayon stamp, with one free swap a day', { n: MS_PAY }) },
      { ic: () => nwItemArt('Pupcake'), tx: () => tt('nw.v2192.stamps', 'Every finished mission stamps the card. Seven stamps bring a surprise, and later cards give {n} coins and a Pupcake', { n: MS_CARD_COINS }) },
      { ic: () => nwSafe(() => ICON('sleep')), tx: () => tt('nw.v2192.clock', 'A calmer clock: a game day lasts one real hour, so dogs get hungry and sleepy more slowly') },
      { ic: () => fwCalIcon(), tx: () => tt('nw.v2192.daily', 'Daily bonuses and the mission start again every day at midnight in Japan') },
      { ic: () => nwSafe(() => ICON('walk')), tx: () => tt('nw.v2192.walks', 'The first {n} walks of a day pay full coins. After that your dog is happily tired and walks pay half', { n: WALK_FULL }) }
    ]
  },
  {
    id: '2.18.4', date: '2026-10-30', c: '#D3E4F4', d: 'snow', pic: { item: 'Snowman Suit' },
    title: () => tt('nw.v2184.title', 'The Winter Market is coming!'),
    items: [
      { ic: () => nwItemArt('Present Pile'), tx: () => tt('nw.v2184.market', 'The {market} comes to town from {from} to {to}', { market: tt('fm.m_winter', 'Winter Market'), from: nwFmDate('winter', 0), to: nwFmDate('winter', 1) }) },
      { ic: () => nwItemArt('Puffer Jacket'), tx: () => tt('nw.v2184.costumes', '10 winter costumes from the {first} to the {last}, and two of them keep a dog warm in the snow', { first: tItem('Father Christmas Suit'), last: tItem('Penguin Suit') }) },
      { ic: () => nwItemArt('Star Lantern'), tx: () => tt('nw.v2184.decor', '5 yard decorations, and the lights glow after dark') },
      { ic: () => nwItemArt('Gingerbread Kennel'), tx: () => tt('nw.v2184.homes', 'A {kennel}, 4 cosy beds and 5 winter toys', { kennel: tItem('Gingerbread Kennel') }) },
      { ic: () => nwItemArt('Reindeer Crunch'), tx: () => tt('nw.v2184.treats', '3 dog-safe winter treats') }
    ]
  },
  {
    id: '2.18.2', date: '2026-10-30', c: '#FFE3A1', d: 'leaf', pic: 'dog',
    title: () => tt('nw.v2182.title', 'The Fun Fair is in town!'),
    items: [
      { ic: () => nwItemArt('Paper Kite'), tx: () => tt('nw.v2182.fair', 'Fun Fair: 5 minigames ({games}) and 3 town jobs', { games: tlist(['catch', 'bubble', 'seek', 'show', 'kite'].map((k) => ffName(k))) }) },
      { ic: () => nwItemArt('Yellow Raincoat'), tx: () => tt('nw.v2182.rain', 'Rainy days: dogs get wet in the rain, and a raincoat keeps them dry') },
      { ic: () => nwItemArt('Pumpkin Ball'), tx: () => tt('nw.v2182.halloween', '{market}: 25 new items, open until {date}', { market: tt('fm.m_halloween', 'Halloween Market'), date: nwDate('2026-11-15') }) },
      { ic: () => fwCalIcon(), tx: () => tt('nw.v2182.gift', 'A daily gift in the calendar every day you play') },
      { ic: () => nwItemArt('Market Basket'), tx: () => tt('nw.v2182.stall', 'Saturday market stall and the weekly photo contest') }
    ]
  }
];
/* v2.19 "Friends first": 50_friends.js adds this entry only when FR_LIVE is on (nwSort puts it in date order), so the news never shows Friends before the release */
const nwFrArt = (k) => nwSafe(() => { const P = window.PawArt; return P && P.FRIENDS && typeof P.FRIENDS[k] === 'function' ? P.FRIENDS[k]() : ''; });
const NEWS_V219 = {
  id: '2.19', date: '2026-11-07', c: '#FFE3EC', d: 'paw', pic: 'dog',
  title: () => tt('nw.v219.title', 'Friends are here!'),
  items: [
    { ic: () => nwFrArt('badge'), tx: () => tt('nw.v219.friends', 'Pick a friend name, then share your code or an invite link. Up to 50 friends') },
    { ic: () => nwFrArt('paw'), tx: () => tt('nw.v219.visit', "Visit a friend's yard, pet their dogs and leave a paw-print note") },
    { ic: () => nwFrArt('wrap'), tx: () => tt('nw.v219.gift', 'Send one gift a day: a treat, seeds or something from your garden') },
    { ic: () => nwFrArt('ribbon'), tx: () => tt('nw.v219.walk', "Take a friend's dog on your walk, and your friend gets a letter about it") },
    { ic: () => nwSafe(() => ICON('lock')), tx: () => tt('nw.v219.safe', 'No typing and no search: a friend joins only with your code or invite link') }
  ]
};
/* v2.20 "Missions v2" (V220.md, docs/design/missions-v2.md): nwSort adds this entry once the Japan date reaches its date, so the news never shows Missions v2 before the release */
const nwMsArt = (k, ...a) => nwSafe(() => (typeof ms2Art === 'function' ? ms2Art(k, ...a) : '')); // PawArt.MISSIONS through ms2Art, '' until the art lands
const NEWS_V220 = {
  id: '2.20', date: '2026-11-14', // LAUNCH DATE: set at release (owner's date)
  c: '#FFF1C9', d: 'paw', pic: 'dog',
  title: () => tt('nw.v220.title', 'More little things to do'),
  items: [
    { ic: () => nwMsArt('tab', 'today') || nwSafe(() => msHudIcon()), tx: () => tt('nw.v220.helps', "Two little helps a day beside the mission. Finish all three for a treat from Gerald's pouch") },
    { ic: () => nwMsArt('tab', 'week') || nwSafe(() => ICON('walk')), tx: () => tt('nw.v220.board', "Gerald's help-wanted board comes every Monday. Do any {need} of its {notes} notes for a thank-you letter with {n} coins", { need: MSW_NEED, notes: MSW_NOTES, n: MSW_COINS }) },
    { ic: () => nwMsArt('medal') || nwSafe(() => ICON('star')), tx: () => tt('nw.v220.badges', 'Badges for all the things you love to do, with stickers, titles, cups and the Crayon Medal') },
    { ic: () => nwMsArt('tab', 'notebook') || fwCalIcon(), tx: () => tt('nw.v220.notebook', "New in town? Gerald's notebook has one page a day for your first {n} days", { n: 14 }) },
    { ic: () => nwMsArt('chart', []) || nwSafe(() => ICON('bond')), tx: () => tt('nw.v220.grow', "Growing up moments for every dog, marked on a crayon height chart in each dog's Profile") }
  ]
};
const nwV220Due = () => jstISO() >= NEWS_V220.date;
// Daily rhythm: NEWS is read newest first by date (a later version first on the same date), so an entry put in front at load time (50_friends.js unshifts NEWS_V219 when FR_LIVE is on) still lands in its place
const nwVer = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; };
function nwSort() { if (nwV220Due() && !NEWS.includes(NEWS_V220)) NEWS.unshift(NEWS_V220); NEWS.sort((a, b) => (a.date === b.date ? nwVer(b.id, a.id) : a.date < b.date ? 1 : -1)); return NEWS; }
const nwLatest = () => nwSort()[0].id;
const nwSafe = (f) => { try { return f(); } catch (e) { return ''; } };
function v2182Fields(s) { if (s && typeof s.newsSeen !== 'string') s.newsSeen = ''; return s; } // additive: '' = an old save, it sees the newest entry once
function nwPic(e) {
  if (!e.pic) return '';
  const svg = nwSafe(() => (e.pic === 'dog' ? headSVG(D()) : e.pic.item ? art('item', e.pic.item) : ''));
  return svg ? `<span class="nw-pic${e.pic === 'dog' ? ' dog' : ''}" aria-hidden="true">${svg}</span>` : '';
}
function nwEntryHTML(e, big) {
  const border = `<svg class="fw-border nw-border" viewBox="0 0 300 40" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${[24, 84, 150, 216, 276].map((x, i) => fwDoodle(i === 2 ? 'paw' : e.d || 'paw', x, 20, i === 2 ? 0.8 : 1, i % 2 ? 12 : -10)).join('')}</svg>`;
  const li = e.items.map((x) => `<li><span class="nw-ic" aria-hidden="true">${nwSafe(x.ic)}</span><span class="nw-tx">${esc(x.tx())}</span></li>`).join('');
  return `<section class="fw-page nw-page${big ? ' big' : ''}" style="--fwc:${e.c || 'var(--paper)'}" aria-label="${esc(e.title())}">${big ? border : ''}<div class="nw-head">${big ? nwPic(e) : ''}<div><h3>${esc(e.title())}</h3><p class="small nw-ver">${esc(tt('nw.version', 'Version {v} · {date}', { v: e.id, date: nwDate(e.date) }))}</p></div></div><ul class="nw-list">${li}</ul></section>`;
}
// the sheet: the newest entry; "See all updates" swaps in every entry, newest first
function nwOpen(auto) {
  if (!S) return false;
  if (auto) { S.newsSeen = nwLatest(); markDirty(); try { saveNow(); } catch (e) { /* storage */ } }
  nwSort();
  const draw = (all) => {
    const body = all ? `<div class="nw-sheet nw-all">${NEWS.map((e) => nwEntryHTML(e, false)).join('')}</div>`
      : `<div class="nw-sheet">${nwEntryHTML(NEWS[0], true)}${NEWS.length ? `<button class="btn nw-more" type="button" id="nwAll">${esc(tt('nw.see_all', 'See all updates'))}</button>` : ''}</div>`;
    const p = openModal(esc(tt('nw.title', "What's new in town")), body, { cls: 'fw-calpop nw-pop', foot: `<button class="btn yes big nw-ok" id="nwOk">${esc(tt('nw.ok', 'OK!'))}</button>` });
    $('#nwOk', p).onclick = () => { SFX.click(); closeModal(); };
    const a = $('#nwAll', p); if (a) a.onclick = () => { SFX.click(); draw(true); };
  };
  draw(false); return true;
}
// the automatic open: once per news id, on a calm yard, never on top of the guide, the calendar's daily page, a level-up or the Bond 2 party
function nwCalmNow() {
  if (!S || cur.mode !== 'yard' || !modal.hidden || busy || levelQueue.length || !titleEl.hidden) return false;
  if (typeof popOpen === 'function' && popOpen()) return false;
  if (typeof gdLive === 'function' && gdLive() && gdAllowed()) return false;
  if (typeof phActive === 'function' && phActive()) return false; if (typeof blOn === 'function' && blOn()) return false;
  if ($('#gdLayer .gd-card:not([hidden])')) return false;
  if (S.fw && typeof fwOn === 'function' && fwOn()) { const f = S.fw; if (f.morning && f.shown !== f.morning) return false; if (Object.keys(f.b2pending || {}).length) return false; }
  return true;
}
function nwTry() {
  if (!S || !nwOn() || S.newsSeen === nwLatest()) { NW.calm = 0; return; }
  if (!nwCalmNow()) { NW.calm = 0; return; }
  if (!NW.calm) NW.calm = Date.now();
  if (Date.now() - NW.calm < 3000) return; // three calm seconds: the calendar or a party that is about to open goes first
  NW.calm = 0; nwOpen(true);
}
function nwMenuBtn() { return S ? `<button class="btn big" id="mmNews"><span class="ic">${nwSafe(() => fwCalIcon())}</span>${esc(tt('nw.menu', "What's new"))}</button>` : ''; }
function nwExpose() {
  if (!window.__paw || window.__paw.nw) return;
  window.__paw.nw = { on: () => nwOn(), test: (v) => { prefs.nwTest = !!v; }, latest: () => nwLatest(), list: () => nwSort().map((e) => e.id), seen: () => S && S.newsSeen, open: () => nwOpen(false), calm: () => nwCalmNow(), migrate: (s) => v2182Fields(s),
    add: (e) => { NEWS.unshift(Object.assign({ date: '2026-12-01', c: '#D3E4F4', title: () => 'Test news', items: [{ ic: () => '', tx: () => 'A test line' }, { ic: () => '', tx: () => 'Another line' }, { ic: () => '', tx: () => 'A third line' }] }, e)); return NEWS[0].id; },
    v219: () => { if (!NEWS.includes(NEWS_V219)) NEWS.unshift(NEWS_V219); return nwSort().map((e) => e.id); }, // what 50_friends.js does with FR_LIVE on (test hook)
    v220: () => { if (!NEWS.includes(NEWS_V220)) NEWS.unshift(NEWS_V220); return nwSort().map((e) => e.id); }, v220Due: () => nwV220Due(), // Missions v2 before its date (test hook)
    drop: () => { nwSort(); if (NEWS.length > 1) NEWS.shift(); return NEWS[0].id; } };
}
setInterval(() => { try { nwExpose(); nwTry(); } catch (e) { console.warn('nw tick', e); } }, 500);
on('game:ready', () => { NW.calm = 0; nwExpose(); });
