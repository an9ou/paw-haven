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
const NEWS = [
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
const nwLatest = () => NEWS[0].id;
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
  window.__paw.nw = { on: () => nwOn(), test: (v) => { prefs.nwTest = !!v; }, latest: () => nwLatest(), list: () => NEWS.map((e) => e.id), seen: () => S && S.newsSeen, open: () => nwOpen(false), calm: () => nwCalmNow(), migrate: (s) => v2182Fields(s),
    add: (e) => { NEWS.unshift(Object.assign({ date: '2026-12-01', c: '#D3E4F4', title: () => 'Test news', items: [{ ic: () => '', tx: () => 'A test line' }, { ic: () => '', tx: () => 'Another line' }, { ic: () => '', tx: () => 'A third line' }] }, e)); return NEWS[0].id; },
    drop: () => { if (NEWS.length > 1) NEWS.shift(); return NEWS[0].id; } };
}
setInterval(() => { try { nwExpose(); nwTry(); } catch (e) { console.warn('nw tick', e); } }, 500);
on('game:ready', () => { NW.calm = 0; nwExpose(); });
