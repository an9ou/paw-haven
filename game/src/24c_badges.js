/* ======================= v2.20 "Missions v2": 24c_badges.js (MISSIONS lane, Part C: Badges) =======================
   Contract: V220.md (section 3, part C). Design: docs/design/missions-v2.md 3.3 and its "Decided" section: badges pay COSMETICS ONLY, never coins.
   17 lifetime tracks (MS_TRACKS), four tiers each: bronze, silver, gold, crayon (S.missions.tr[id] = the highest tier given).
   Bronze: a sticker on three "Badges" pages of the sticker book (17 bronze stickers and the first neighbour card, msStickerAdd).
   Silver: the rosette on the row and Bond for the active dog equal to one Sunny Park walk (addBond).
   Gold: the title (titleGive) and a cup on the trophy shelf (msCups, drawn by PawArt.MISSIONS.shelf). Crayon: a crayon star, the cup turns crayon.
   Gold in 8 tracks: the Crayon Medal, a reward-only charm (like the Coat Collector Ribbon), with one popup.
   Coats shows the Coat Collection milestones (5 / 15 / 30 / 50) as they are: their own rewards stay in 07_treasure_journal.js, the badge adds
   no title. No puppy or litter track (welfare). Old saves: the first check gives every earned tier quietly (no toasts, no Bond) and sends one
   letter. New tiers: one batched toast through ms2Say, the soft dot until the Badges tab is seen. Under the harness: prefs.msTest (msAllowed).
   Test hook: window.__paw.msb. */
const MSB = { dot: false, card: false, medal: false, t: 0, order: null };
const MSB_TIERS = ['b', 's', 'g', 'c'];
const MSB_PAGES = ['msb1', 'msb2', 'msb3']; // the three Badges sticker pages (6 stickers each)
const MSB_GOLDS = 8; // golds for the Crayon Medal
const MS_MEDAL = 'Crayon Medal';
const MSB_BOND = () => (ROUTES.park && ROUTES.park.bp) || 8; // silver: the Bond of one Sunny Park walk
// a reward wearable in the charm slot, never in a shop (like the Coat Collector Ribbon). Its look on the dog comes from the art lane
if (!CHARMS.some((c) => c.n === MS_MEDAL)) CHARMS.push({ n: MS_MEDAL, slot: 'charm', perk: 'Crayon Medal: gold in eight badges. Pure bragging rights.', reward: true });

/* ---------------- the tracks ---------------- */
const msbN = (v) => (typeof v === 'number' && v > 0 ? Math.floor(v) : 0);
const msbLife = (k) => msbN(S && S.missions && S.missions.life && S.missions.life[k]);
const msbPv = () => (S && S.dd && S.dd.pv && typeof S.dd.pv === 'object' ? S.dd.pv : {});
const MSB_ROUTES = ['park', 'river', 'woods', 'beach', 'sunflower', 'bamboo', 'cliffs']; // the seven walking routes
// the town's places (not the yard or the house, not the run tracks (Trail explorer), not Tokyo: Tokyo has its own track)
function msbPlaces() { const tk = typeof TK_PLACES === 'object' && TK_PLACES ? TK_PLACES : {}; return Object.keys(PLACES).filter((k) => k !== 'yard' && k !== 'house' && !tk[k] && !(PLACES[k] && (PLACES[k].run || PLACES[k].tokyo))); }
// id, n: the name, d: what counts, title: the gold title (Coats: none, its titles come from the Coat Collection), ic: the sticker art, tiers: [b, s, g, c]
const MS_TRACKS = [
  { id: 'walker', n: 'Walker', d: 'Walks finished', title: 'Trail Pro', ic: 'i:walk', tiers: [10, 50, 200, 500], val: () => msbN(S.walks) },
  { id: 'trails', n: 'Trail explorer', d: 'Routes walked', title: 'Map Maker', ic: 'i:map', tiers: [2, 4, 6, 7], val: () => MSB_ROUTES.filter((k) => msbPv()[k]).length },
  { id: 'places', n: 'Out and about', d: 'Places visited', title: 'Town Know-it-all', ic: 'i:square', tiers: [4, 8, 12, 0], all: true, val: () => msbPlaces().filter((k) => msbPv()[k]).length },
  { id: 'treasure', n: 'Treasure hunter', d: 'Treasures found', title: 'Treasure Hunter', ic: 't:Golden Bone', tiers: [5, 10, 18, 25], val: () => (S.found && typeof S.found === 'object' ? Object.keys(S.found).filter((k) => S.found[k]).length : 0) },
  { id: 'tokyo', n: 'Tokyo traveller', d: 'Station stamps', title: 'Tokyo Traveller', ic: 's:tokyotower', tiers: [1, 3, 5, 7], val: () => (S.tk && S.tk.stamps && typeof S.tk.stamps === 'object' ? Object.keys(S.tk.stamps).filter((k) => S.tk.stamps[k]).length : 0) },
  { id: 'photo', n: 'Photographer', d: 'Photos taken', title: 'Snap Happy', ic: 'i:camera', tiers: [3, 15, 50, 150], val: () => msbN(S.ph && S.ph.n) },
  { id: 'coats', n: 'Coats', d: 'Coats found', title: '', ic: 'i:spots', tiers: [5, 15, 30, 50], val: () => (typeof coatCount === 'function' ? coatCount() : 0) },
  { id: 'garden', n: 'Gardener', d: 'Crops harvested', title: 'Green Paws', ic: 'i:garden', tiers: [10, 50, 150, 400], val: () => msbLife('harvest') },
  { id: 'kitchen', n: 'Kitchen', d: 'Dishes cooked', title: 'Kennel Chef', ic: 'i:kitchen', tiers: [5, 25, 75, 200], val: () => msbLife('cook') },
  { id: 'bath', n: 'Squeaky clean', d: 'Baths', title: 'Bubble Boss', ic: 'i:drop', tiers: [5, 25, 75, 200], val: () => msbLife('bath') },
  { id: 'trick', n: 'Trick practice', d: 'Tricks practised', title: 'Trick Star', ic: 'i:clicker', tiers: [10, 50, 200, 500], val: () => msbLife('trick') },
  { id: 'fetch', n: 'Fetch', d: 'Ball and toy games', title: 'Fetch Legend', ic: 'i:speed', tiers: [20, 100, 400, 1000], val: () => msbLife('fetch') },
  { id: 'fair', n: 'Fun Fair', d: 'Fun Fair rounds', title: 'Fair Champ', ic: 't:Paper Kite', tiers: [10, 50, 150, 400], val: () => (S.ff && S.ff.n && typeof S.ff.n === 'object' ? Object.values(S.ff.n).reduce((a, b) => a + msbN(b), 0) : 0) },
  { id: 'wish', n: 'Wish maker', d: 'Wishes come true', title: 'Wish Maker', ic: 'i:heart', tiers: [5, 25, 75, 200], val: () => msbN(S.dd && S.dd.wn) },
  { id: 'mission', n: 'Mission pup', d: 'Missions done', title: 'Mission Pup', ic: 'i:missions', tiers: [7, 30, 100, 250], val: () => msbLife('ms') },
  { id: 'splash', n: 'Splash and dash', d: 'Agility runs and paddles', title: 'Splash and Dash', ic: 'i:water-spray', tiers: [5, 25, 75, 200], val: () => (S.dd && S.dd.cnt ? msbN(S.dd.cnt.ag) + msbN(S.dd.cnt.pd) : 0) },
  { id: 'neighbour', n: 'Good neighbour', d: 'Help-wanted boards filled', title: 'Good Neighbour', ic: 'i:mail', tiers: [1, 5, 15, 40], val: () => msbLife('boards') }
];
const msbDef = (id) => MS_TRACKS.find((x) => x.id === id);
// the four counts of a track (Out and about: crayon is every town place, at least 13)
function msTrackTiers(id) { const d = msbDef(id); if (!d) return [1, 1, 1, 1]; return d.all ? [d.tiers[0], d.tiers[1], d.tiers[2], Math.max(13, msbPlaces().length)] : d.tiers.slice(); }
function msTrackVal(id) { const d = msbDef(id); if (!d || !S) return 0; try { return msbN(d.val()); } catch (e) { return 0; } }
// the tier given so far ('' none), and the tier the counter has reached now
const msTierOf = (id) => { const t = S && S.missions && S.missions.tr && S.missions.tr[id]; return MSB_TIERS.includes(t) ? t : ''; };
const msbTi = (t) => MSB_TIERS.indexOf(t); // -1 for none
function msTierReached(id) { const v = msTrackVal(id), T = msTrackTiers(id); let i = -1; T.forEach((n, k) => { if (v >= n) i = k; }); return i < 0 ? '' : MSB_TIERS[i]; }
const msbName = (d) => tdata('ms_tracks.' + d.id + '.n', d.n);
const msbTierName = (t) => ({ b: tt('ms2b.tier_b', 'bronze'), s: tt('ms2b.tier_s', 'silver'), g: tt('ms2b.tier_g', 'gold'), c: tt('ms2b.tier_c', 'crayon') })[t] || '';
// the gold titles in other languages (07_treasure_journal.js jrTitleName asks)
function msTitleName(t) { const d = MS_TRACKS.find((x) => x.title && x.title === t); return d ? tdata('ms_tracks.' + d.id + '.title', d.title) : t; }
const msbGolds = () => MS_TRACKS.filter((d) => msbTi(msTierOf(d.id)) >= 2).length;
const msbCount = () => MS_TRACKS.reduce((a, d) => a + msbTi(msTierOf(d.id)) + 1, 0); // every tier given counts as one badge
// the trophy shelf: one cup a gold track, 'c' once it is crayon (PawArt.MISSIONS.shelf(cups), the yard and house decoration of the art merge)
function msCups() { if (!S || !S.missions || !S.missions.tr) return []; return MS_TRACKS.map((d) => msTierOf(d.id)).filter((t) => t === 'g' || t === 'c'); }

/* ---------------- giving tiers ---------------- */
// quiet: no toasts, no Bond, titles written silently (an old save's first look, or a test). Returns [{ id, t }] of the tiers given now
function msTierCheck(quiet) {
  if (!S || !S.missions || !S.missions.tr || !msAllowed() || cur.mode === 'title' || !Array.isArray(S.dogs) || !S.dogs.length) return [];
  const m = S.missions, back = m.trbf !== 1; quiet = !!quiet || back;
  const got = [];
  MS_TRACKS.forEach((d) => {
    const have = msbTi(msTierOf(d.id)), now = msbTi(msTierReached(d.id));
    for (let i = have + 1; i <= now; i++) { const t = MSB_TIERS[i]; m.tr[d.id] = t; got.push({ id: d.id, t }); msbReward(d, t, quiet); }
  });
  if (back) { m.trbf = 1; markDirty(); if (got.length) msbLetter(msbCount()); }
  if (msbGolds() >= MSB_GOLDS) msMedalGive(quiet);
  if (!got.length) return got;
  markDirty();
  try { if (typeof ddStickers === 'function') { msPagesSync(); ddStickers(true); } } catch (e) { /* no sticker book yet */ }
  if (!quiet) {
    MSB.dot = true; msHudSync(true);
    const d0 = msbDef(got[0].id);
    ms2Say(got.length === 1 ? tt('ms2b.new_one', 'New badge: {badge}, {tier}.', { badge: msbName(d0), tier: msbTierName(got[0].t) }) : tt('ms2b.new_many', '{n} new badges. See them in Missions, under Badges.', { n: got.length }),
      'gold', 'msb', (k) => tt('ms2b.new_many', '{n} new badges. See them in Missions, under Badges.', { n: k }));
  }
  msRefresh(); return got;
}
// what one tier gives: b the sticker (its test reads S.missions.tr), s Bond, g the title, c the crayon star and cup (both drawn from S.missions.tr)
function msbReward(d, t, quiet) {
  if (t === 's' && !quiet) addBond(MSB_BOND());
  if (t === 'g' && d.title) {
    if (quiet) { jrFields(); if (!S.titles[d.title]) { S.titles[d.title] = localISO(); markDirty(); } } else titleGive(d.title); // titleGive has its own toast
  }
}
// an old save's first look: one quiet letter from Gerald, once
function msbLetter(n) {
  if (typeof mailPush !== 'function' || !n) return;
  mailPush({ kind: 'news', id: 'msb_backfill', from: tt('ms2b.letter_from', 'Gerald'), title: tt('ms2b.letter_title', 'Your badges'),
    text: tt('ms2b.letter_text', 'You already earned {n, plural, one {# badge} other {# badges}} for everything you and {name} have done in town. Open Missions and look under Badges. Gold ones put a cup on your trophy shelf.', { n, name: NAME() }),
    ps: tt('ms2b.letter_ps', 'Gerald, who keeps a list of everything') });
}
// the Crayon Medal: once, at 8 golds. A popup when the yard is quiet (an old save's first look just puts it in the Wardrobe)
function msMedalGive(quiet) {
  if (!S || !S.inv || !Array.isArray(S.inv.charms) || S.inv.charms.includes(MS_MEDAL)) return false;
  S.inv.charms.push(MS_MEDAL); markDirty();
  if (!quiet) MSB.medal = true;
  return true;
}
// the art lane's medal, else a plain crayon medal (every fill inside its outline)
function msbMedalArt() { return ms2Art('medal') || artReal('item', MS_MEDAL) || '<svg viewBox="-20 -20 40 40"><path d="M-8 -19 L-2 -6 L2 -6 L8 -19 L3 -19 L0 -12 L-3 -19Z" fill="#CBE0F4" stroke="#5B3D32" stroke-width="1.8" stroke-linejoin="round"/><circle cy="5" r="12" fill="#F6CF57" stroke="#5B3D32" stroke-width="2.2"/><circle cy="5" r="7.5" fill="#F28FA5" stroke="#5B3D32" stroke-width="1.6"/><path d="M0 0.5 L1.6 3.6 L5 4 L2.5 6.3 L3.1 9.6 L0 8 L-3.1 9.6 L-2.5 6.3 L-5 4 L-1.6 3.6Z" fill="#FFFBF3" stroke="#5B3D32" stroke-width="1.1" stroke-linejoin="round"/></svg>'; }
function msbMedalPop() {
  MSB.medal = false;
  const wear = S.outfit && S.outfit.charm === MS_MEDAL;
  const p = openModal(esc(tt('ms2b.medal_title', 'The Crayon Medal')), `<div class="msb-medal"><span class="msb-medalic" aria-hidden="true">${msbMedalArt()}</span><p>${esc(tt('ms2b.medal_text', 'Gold in eight badges! The Crayon Medal is yours, a charm for {name}. Pure bragging rights.', { name: NAME() }))}</p></div>`,
    { cls: 'msb-medalpop', foot: `${wear ? '' : `<button class="btn" type="button" id="msbWear">${esc(tt('ms2b.medal_wear', 'Wear it'))}</button>`}<button class="btn" type="button" id="msbOk">${esc(tt('ms2b.medal_ok', 'Lovely'))}</button>` });
  try { SFX.fanfare(); } catch (e) { /* audio off */ }
  const w = p.querySelector('#msbWear'); if (w) w.onclick = () => { if (S.outfit.charm !== MS_MEDAL) equip(MS_MEDAL, true); closeModal(); };
  const o = p.querySelector('#msbOk'); if (o) o.onclick = () => { SFX.click(); closeModal(); };
  return p;
}
function msbMedalTick() { if (MSB.medal && S && cur.mode === 'yard' && modal.hidden && !msGuideBusy() && !(typeof levelQueue !== 'undefined' && levelQueue.length)) msbMedalPop(); }
// the soft dot on the clipboard: a new tier, until the Badges tab is seen
function msBadgeDot() { return !!MSB.dot; }
// Part D: the first full neighbour card gives the 18th sticker (life.boards 4 also gives it)
function msCardSticker() { MSB.card = true; try { if (typeof ddStickers === 'function') { msPagesSync(); return ddStickers(false); } } catch (e) { /* no sticker book yet */ } return []; }

/* ---------------- the three Badges sticker pages ---------------- */
// they sit at the end of the book, after the Fun Fair pages; page gifts (S.dd.pg, by page number) follow their page when the order changes
function msPagesSync() {
  if (typeof DD_PAGES === 'undefined' || !S || !S.dd) return;
  try { if (typeof ffPagesSync === 'function') ffPagesSync(); } catch (e) { /* the fair is not ready */ }
  const want = msAllowed() && Array.isArray(S.dogs) && S.dogs.length > 0, i0 = DD_PAGES.indexOf(MSB_PAGES[0]), end = DD_PAGES.length - MSB_PAGES.length;
  const old = MSB.order || DD_PAGES.slice();
  if (!want && i0 >= 0) DD_PAGES.splice(i0, MSB_PAGES.length);
  else if (want && i0 !== end) { if (i0 >= 0) DD_PAGES.splice(i0, MSB_PAGES.length); DD_PAGES.push(...MSB_PAGES); }
  if (old.join() !== DD_PAGES.join()) {
    DD.defs = null;
    if (MSB.order && S.dd.pg && typeof S.dd.pg === 'object') { const g = {}; old.forEach((k, i) => { const j = DD_PAGES.indexOf(k); if (S.dd.pg[i] && j >= 0) g[j] = S.dd.pg[i]; }); Object.keys(S.dd.pg).forEach((k) => delete S.dd.pg[k]); Object.assign(S.dd.pg, g); markDirty(); }
  }
  MSB.order = DD_PAGES.slice();
}
function msStickerAdd(add) {
  if (!S || !S.missions || !DD_PAGES.includes(MSB_PAGES[0])) return;
  const pg = DD_PAGES.indexOf(MSB_PAGES[0]);
  MS_TRACKS.forEach((d, i) => add('msb_' + d.id, pg + Math.floor(i / 6), d.ic, () => tt('ms2b.st_badge', '{badge} badge', { badge: msbName(d) }), () => msbTi(msTierOf(d.id)) >= 0));
  add('msb_card', pg + 2, 'i:star', () => tt('ms2b.st_card', 'The first neighbour card'), () => MSB.card || msbLife('boards') >= 4);
}
function msPageTitle(k) { return k === 'msb2' ? tt('ms2b.pg_2', 'Badges: home and play') : k === 'msb3' ? tt('ms2b.pg_3', 'Badges: fun in town') : tt('ms2b.pg_1', 'Badges: out and about'); }

/* ---------------- the Badges tab ---------------- */
const MSB_COL = { b: '#E0A86E', s: '#D5DBE3', g: '#F6CF57', c: '#F28FA5' };
// the rosette of a tier (the art lane's, or a plain crayon one; '' an empty dashed ring)
function msbRosette(t) {
  const a = t ? ms2Art('rosette', t) : ''; if (a) return a;
  if (!t) return '<svg viewBox="-20 -20 40 40"><circle r="12" fill="#FFFBF3" stroke="#B8A898" stroke-width="2" stroke-dasharray="4 3"/></svg>';
  const tails = '<path d="M-7 7 L-11 19 L-4 15 L-1 19 L0 9Z" fill="#F7B2C4" stroke="#5B3D32" stroke-width="1.8" stroke-linejoin="round"/><path d="M7 7 L11 19 L4 15 L1 19 L0 9Z" fill="#CBE0F4" stroke="#5B3D32" stroke-width="1.8" stroke-linejoin="round"/>';
  const ring = t === 'c' ? '<circle r="8.5" fill="none" stroke="#7FC8A9" stroke-width="2.6" stroke-dasharray="5 4"/><circle r="8.5" fill="none" stroke="#F9D56E" stroke-width="2.6" stroke-dasharray="5 4" stroke-dashoffset="4.5"/>' : '';
  return `<svg viewBox="-20 -20 40 40">${tails}<circle r="12.5" fill="${MSB_COL[t]}" stroke="#5B3D32" stroke-width="2.2"/>${ring}<circle r="5.5" fill="#FFFBF3" stroke="#5B3D32" stroke-width="1.6"/></svg>`;
}
function msbCupSVG(t) { return `<svg viewBox="-14 -16 28 32" aria-hidden="true"><path d="M-9 -12 H9 V-3 Q9 6 0 7 Q-9 6 -9 -3Z" fill="${t === 'c' ? '#F28FA5' : MSB_COL.g}" stroke="#5B3D32" stroke-width="2" stroke-linejoin="round"/><path d="M-2 7 H2 V11 H-2Z" fill="#E0A86E" stroke="#5B3D32" stroke-width="1.6"/><path d="M-7 11 H7 V14 H-7Z" fill="#E0A86E" stroke="#5B3D32" stroke-width="1.8"/></svg>`; }
function msbShelfHTML() {
  const cups = msCups(), a = ms2Art('shelf', cups);
  const pic = a || `<span class="msb-cups">${cups.map((t) => msbCupSVG(t)).join('') || '<span class="msb-cup0"></span>'}</span>`;
  return `<div class="msb-shelf${a ? ' art' : ''}" aria-hidden="true">${pic}</div>`;
}
function msbNext(d, i) {
  const T = msTrackTiers(d.id); if (i >= 3) return tt('ms2b.done', 'All four tiers. A crayon star.');
  const n = tnum(T[i + 1]);
  if (i < 0) return tt('ms2b.next_b', 'Next at {n}: a sticker', { n });
  if (i === 0) return tt('ms2b.next_s', 'Next at {n}: a rosette and Bond', { n });
  if (i === 1) return d.title ? tt('ms2b.next_g', 'Next at {n}: the title {title} and a cup', { n, title: msTitleName(d.title) }) : tt('ms2b.next_g_cup', 'Next at {n}: a gold cup', { n });
  return tt('ms2b.next_c', 'Next at {n}: a crayon star and a crayon cup', { n });
}
function msbRowHTML(d) {
  const t = msTierOf(d.id), i = msbTi(t), T = msTrackTiers(d.id), v = msTrackVal(d.id), goal = T[Math.min(3, i + 1)], shown = Math.min(v, goal), pct = Math.round(100 * Math.min(1, goal ? v / goal : 1));
  const star = t === 'c' ? `<span class="msb-star" aria-hidden="true">${iconOr('star', doodle('spark', 0, 0, 1))}</span>` : '';
  const lbl = tt('ms2b.bar', '{n} of {total}', { n: tnum(shown), total: tnum(goal) });
  return `<li class="msb-row" data-track="${d.id}" data-tier="${t || '-'}"><span class="msb-ros" aria-hidden="true">${msbRosette(t)}</span><div class="msb-main"><p class="msb-name"><b>${esc(msbName(d))}</b>${star}${t ? ` <span class="msb-tier">${esc(msbTierName(t))}</span>` : ''}</p>`
    + `<p class="msb-d">${esc(tdata('ms_tracks.' + d.id + '.d', d.d))}</p><div class="msb-barrow"><span class="msb-bar" role="progressbar" aria-label="${esc(lbl)}" aria-valuemin="0" aria-valuemax="${goal}" aria-valuenow="${shown}"><i style="width:${pct}%"></i></span><span class="msb-num">${tnum(shown)} / ${tnum(goal)}</span></div>`
    + `<p class="msb-next">${esc(msbNext(d, i))}</p>${d.id === 'coats' ? `<p class="msb-d">${esc(tt('ms2b.coats_note', 'The Coat Collection rewards stay the same, in Journal, Coats.'))}</p>` : ''}</div></li>`;
}
function msBadgesHTML() {
  if (!S || !S.missions || !S.missions.tr) return '';
  if (MSB.dot) { MSB.dot = false; setTimeout(() => msHudSync(), 0); }
  const L = MS_TRACKS.slice(), open = L.filter((d) => msbTi(msTierOf(d.id)) < 2), top = L.filter((d) => msbTi(msTierOf(d.id)) >= 2), g = msbGolds(), med = S.inv.charms.includes(MS_MEDAL);
  const medal = `<p class="msb-medalline${med ? ' got' : ''}"><span class="msb-medalsm" aria-hidden="true">${msbMedalArt()}</span><span>${esc(med ? tt('ms2b.medal_got', 'The Crayon Medal is yours. Find it in the Wardrobe, under Charm.') : tt('ms2b.medal_todo', 'Gold in {n} of {total} badges. Eight golds give the Crayon Medal.', { n: g, total: MSB_GOLDS }))}</span></p>`;
  return `<div class="msb"><div class="msb-head">${msbShelfHTML()}<div class="msb-headtxt"><p class="msb-count"><b>${esc(tt('ms2b.count', '{n} of {total} badges', { n: msbCount(), total: MS_TRACKS.length * 4 }))}</b></p><p class="msb-intro">${esc(tt('ms2b.intro', 'Badges grow with everything you do. Bronze gives a sticker, silver a rosette and Bond, gold a title and a cup, crayon a crayon star. No coins, just bragging rights.'))}</p>${medal}</div></div>`
    + `<ul class="msb-list">${open.map(msbRowHTML).join('')}</ul>`
    + (top.length ? `<details class="msb-fold"><summary>${esc(tt('ms2b.fold', 'Gold and crayon badges ({n})', { n: top.length }))}</summary><ul class="msb-list">${top.map(msbRowHTML).join('')}</ul></details>` : '') + '</div>';
}

/* ---------------- wiring ---------------- */
on('act', () => { clearTimeout(MSB.t); MSB.t = setTimeout(() => { try { msTierCheck(false); } catch (e) { console.warn('badges', e); } }, 400); });
on('game:ready', () => setTimeout(() => { try { msPagesSync(); msTierCheck(false); } catch (e) { console.warn('badges', e); } msbExpose(); }, 600));
setInterval(() => { if (!S || cur.mode === 'title') return; try { msPagesSync(); msTierCheck(false); msbMedalTick(); } catch (e) { /* not ready */ } }, 3000);
function msbExpose() {
  if (!window.__paw) return;
  window.__paw.msb = {
    tracks: MS_TRACKS.map((d) => d.id), val: (id) => msTrackVal(id), tiers: (id) => msTrackTiers(id), tier: (id) => msTierOf(id), reached: (id) => msTierReached(id), check: (q) => msTierCheck(q),
    html: () => msBadgesHTML(), cups: () => msCups(), dot: () => msBadgeDot(), golds: () => msbGolds(), count: () => msbCount(), medal: MS_MEDAL, medalTick: () => msbMedalTick(), get medalPending() { return MSB.medal; },
    card: () => msCardSticker(), sync: () => msPagesSync(), pages: MSB_PAGES.slice(), title: (t) => msTitleName(t), places: () => msbPlaces(), ddPages: () => DD_PAGES.slice()
  };
}
on('yard:enter', () => { if (window.__paw && !window.__paw.msb) msbExpose(); });
