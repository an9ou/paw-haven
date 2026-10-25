/* ======================= v2.17.1 FESTIVE MARKET (V2171.md, tag fm, test hook window.__paw.fm) =======================
   A pop-up market place on the town map ('fmarket') that is there only while a festival market is open. One config table (FM_MARKETS):
   each market has its date window (Japan date, inclusive), its name, its theme (the scene, the map tent, the sign), and its item lists by stall.
   The lists are names only: the price, the Bond gate and the kind come from the game's own tables (HM_DECOR, CLOTHES, HOUSES, BEDS, TOYS, FOOD).
   Owner rule (26 Oct 2026): festive items are sold only at the festival pop-ups, never in the normal shops (those already leave out every `fest`
   item; the beds list now does too). Bought things stay forever; a missed market takes nothing away. Nothing is paid with real money.
   When markets overlap (the Halloween and Harvest markets in October) one place holds them both: the market that closes first names it.
   Under the test harness everything needs prefs.fmTest (and the v2.15 map); prefs.fmDate pins the Japan date for tests.
   API
     fmOn()            the market system is on (prefs.fmTest under the harness, the v2.15 map)
     fmOpen(day)       the open markets on that Japan date (default today), the one closing first first
     fmItems(cat)      the open markets' items of a stall: { n, kind, cat, price, bond, name, desc }
     fmSheet(cat)      the stall sheet (the shop sheet pattern, tabs, scrollable)
     fmSync()          adds or removes PLACES.fmarket (a save standing there when it closes goes to the Square) */
function fmOn() { return (!navigator.webdriver || !!prefs.fmTest) && typeof mpOn === 'function' && mpOn(); }
const FM_DAY = () => (navigator.webdriver && prefs.fmDate) || jstISO();
// the stalls, in the order they show (a stall with nothing in it does not show)
const FM_CATS = ['decor', 'clothes', 'homes', 'toys', 'treats'];
/* the markets. win(year) -> [from, to] as 'MM-DD' (a window that crosses New Year has from > to). ed: edition items (`ed` in the tables)
   are sold only in their own year. todo: no items yet, the market stays shut (V2171.md 8) */
const FM_MARKETS = [
  { id: 'halloween', theme: 'halloween', name: 'Halloween Market', win: (y) => (y === 2026 ? ['10-08', '11-02'] : ['10-24', '11-02']),
    items: {
      decor: ['Pumpkin Lantern', 'Jack-o-Lantern Trio', 'Paper Bat Bunting', 'Friendly Scarecrow', 'Ghost Garland', 'Ghost Lantern String', 'Pumpkin Fairy Lights', 'Friendly Fence Web', 'Cardboard Black Cat', 'Cauldron Planter'],
      clothes: ['Pumpkin Patch Suit', 'Little Bat Costume', 'Trick-or-Treat Ghost', 'Witch Hat', 'Vampire Cape', 'Bat Wings', 'Candy Corn Bandana', 'Ghost Sheet', 'Pumpkin Suit',
        'Little Witch Hat & Cape', 'Scarecrow Overalls', 'Mummy Wraps', 'Skeleton Suit', 'Black Cat Ears & Bow', 'Pirate Hat & Sash', 'Dinosaur Hood', 'Little Owl Wings', 'Wizard Robe & Star Hat', 'Lion Mane'],
      homes: ['Witch-Hat Bed', 'Pumpkin Cottage', 'Friendly Haunted Kennel', 'Cauldron Bed', 'Bat-Cave Cushion', 'Pumpkin Patch Bed', 'Moon and Stars Tent'],
      toys: ['Squeaky Ghost', 'Squeaky Pumpkin', 'Plush Ghost', 'Bat-Wing Flyer', 'Trick-or-Treat Bucket', 'Squeaky Bat', 'Pumpkin Ball', 'Rope Mummy', 'Glow-in-the-Dark Bone', 'Soft Spider Plush'],
      treats: ['Pumpkin Patch Pupcake', 'Apple Monster Biscuits', 'Sweet Potato Bones', 'Frozen Yoghurt Ghosts', 'Ghost Biscuits', 'Candy Corn Carrots', 'Monster Meatball']
    } },
  { id: 'harvest', theme: 'harvest', name: 'Harvest Market', win: () => ['10-01', '11-30'],
    items: { clothes: ['Leaf Beret', 'Autumn Scarf'], treats: ['Baked Pumpkin Wedges', 'Sweet Potato Coins', 'Warm Bone Broth'] } },
  { id: 'winter', theme: 'winter', name: 'Winter Market', win: () => ['12-01', '12-26'],
    items: { decor: ['Paper Snowflake Garland', 'Felt Holly Wreath', 'Red Wooden Sled'], clothes: ['Very Ugly Sweater', 'Reindeer Antlers', 'Snowflake Snood'], treats: ['Warm Carob Cup', 'Snowflake Oat Cookies', 'Snow Day Stew'] } },
  { id: 'newyear', theme: 'newyear', name: 'New Year Market', win: () => ['12-27', '01-07'],
    items: { decor: ['Kadomatsu Pair'], treats: ['Pup Kinton'] } },
  { id: 'sakura', theme: 'sakura', name: 'Sakura Market', win: () => ['03-25', '04-10'], todo: true, items: {} }
];
const FM_THEME_ART = { halloween: 'halloween', harvest: 'halloween', winter: 'winter', newyear: 'newyear', sakura: 'sakura' }; // TODO (V2171.md 8): a harvest stall re-colour
const FM_SPOT = [1010, 720]; // the tent on the v2.15 town map (2400 x 1500), beside the Town Square
const FM_STALLS = [['decor', 40, 250], ['clothes', 375, 250], ['toys', 710, 250]]; // the three stalls in the scene: [stall, x, width] (the sign is over the middle one)
const FM = { open: null, letters: 0 };

/* ---------------- names (through tt) ---------------- */
function fmMarketName(m) {
  switch (m.id) {
    case 'halloween': return tt('fm.m_halloween', 'Halloween Market');
    case 'harvest': return tt('fm.m_harvest', 'Harvest Market');
    case 'winter': return tt('fm.m_winter', 'Winter Market');
    case 'newyear': return tt('fm.m_newyear', 'New Year Market');
    default: return tt('fm.m_sakura', 'Sakura Market');
  }
}
function fmCatShort(c) { // v2.17.2: the word on a stall's little board
  switch (c) {
    case 'decor': return tt('fm.s_decor', 'Decor');
    case 'clothes': return tt('fm.s_clothes', 'Clothes');
    case 'homes': return tt('fm.s_homes', 'Homes');
    case 'toys': return tt('fm.s_toys', 'Toys');
    default: return tt('fm.s_treats', 'Treats');
  }
}
function fmCatName(c) {
  switch (c) {
    case 'decor': return tt('fm.c_decor', 'Yard decorations');
    case 'clothes': return tt('fm.c_clothes', 'Clothes and costumes');
    case 'homes': return tt('fm.c_homes', 'Dog houses and beds');
    case 'toys': return tt('fm.c_toys', 'Toys');
    default: return tt('fm.c_treats', 'Festival treats');
  }
}

/* ---------------- the windows ---------------- */
function fmWindow(m, day) {
  const y = +day.slice(0, 4), md = day.slice(5), [a, b] = m.win(y);
  if (a <= b) return md >= a && md <= b ? { from: y + '-' + a, to: y + '-' + b, y } : null;
  if (md >= a) { const [, b2] = m.win(y + 1); return { from: y + '-' + a, to: (y + 1) + '-' + b2, y }; } // crosses New Year: the market of year y runs into January
  if (md <= b) { const [a0] = m.win(y - 1); return { from: (y - 1) + '-' + a0, to: y + '-' + b, y: y - 1 }; }
  return null;
}
function fmOpen(day) {
  if (!fmOn()) return []; const d = day || FM_DAY();
  return FM_MARKETS.filter((m) => !m.todo).map((m) => { const w = fmWindow(m, d); return w ? Object.assign({ m }, w) : null; }).filter(Boolean).sort((a, b) => (a.to < b.to ? -1 : a.to > b.to ? 1 : 0));
}
const fmMain = () => fmOpen()[0] || null;
function fmClose(o) { const [y, mo, d] = o.to.split('-').map(Number); return tdate(new Date(y, mo - 1, d), { day: 'numeric', month: 'short' }); }
function fmSign(o) { o = o || fmMain(); if (!o) return ''; return tt('fm.sign', '{market} · open until {date}', { market: fmMarketName(o.m), date: fmClose(o) }); }
function fmPlaceName() { const o = fmMain(); return o ? fmMarketName(o.m) : tt('fm.m_any', 'Festive Market'); }

/* ---------------- the items (from the game's own tables) ---------------- */
function fmKind(n) {
  if (HM_DECOR[n]) return 'decor'; if (CLOTHES.some((c) => c.n === n)) return 'clothes'; if (TOYS.some((t) => t.n === n)) return 'toys';
  if (HOUSES.some((h) => h.n === n)) return 'houses'; if (BEDS.some((b) => b.n === n)) return 'beds'; if (FOOD.some((f) => f.n === n)) return 'food'; return null;
}
function fmRow(n) {
  const k = fmKind(n); if (!k) return null;
  const r = k === 'decor' ? HM_DECOR[n] : (k === 'clothes' ? CLOTHES : k === 'toys' ? TOYS : k === 'houses' ? HOUSES : k === 'beds' ? BEDS : FOOD).find((x) => x.n === n);
  const desc = k === 'decor' ? tdata('hm_decor.' + tid(n) + '.story', r.story) : k === 'clothes' ? tt('fest.slot_perk', '{slot}. {perk}', { slot: tdata('slot_name.' + r.slot, SLOT_NAME[r.slot]), perk: tdata('clothes.' + tid(n) + '.perk', r.perk) })
    : k === 'toys' ? tdata('toys.' + tid(n) + '.note', r.note) : k === 'houses' ? tdata('houses.' + tid(n) + '.note', r.note) : k === 'beds' ? tdata('beds.' + tid(n) + '.note', r.note) : tdata('food.' + tid(n) + '.note', r.note);
  const name = k === 'decor' || k === 'clothes' || k === 'toys' || k === 'food' ? fsIName(k, n) : k === 'beds' ? tdata('beds.' + tid(n) + '.n', n) : tItem(n);
  return { n, kind: k, price: r.price || 0, bond: r.bond || 1, ed: r.ed || 0, name, desc, tip: k === 'food' && r.tip ? tdata('food.' + tid(n) + '.tip', r.tip) : '' };
}
function fmItems(cat, list) {
  const out = [], seen = new Set();
  (list || fmOpen()).forEach((o) => ((o.m.items || {})[cat] || []).forEach((n) => { if (seen.has(n)) return; const r = fmRow(n); if (!r || (r.ed && r.ed !== o.y)) return; seen.add(n); out.push(Object.assign({ cat, mk: o.m.id }, r)); }));
  return out;
}
function fmOwned(it) { return it.kind === 'decor' ? !!(S.decor && S.decor[it.n]) : it.kind === 'food' ? false : it.kind === 'beds' ? (S.beds || []).includes(it.n) : owns(it.kind, it.n); }
const fmCats = () => FM_CATS.filter((c) => fmItems(c).length);

/* ---------------- the place ---------------- */
function fmSync() {
  const o = fmMain(), on = !!o;
  if (on && !PLACES.fmarket) PLACES.fmarket = { n: 'Festive Market', bond: 1, out: true, fm: true };
  if (!on && PLACES.fmarket) { delete PLACES.fmarket; if (S && S.place === 'fmarket') { S.place = 'square'; markDirty(); if (cur.mode === 'yard') { toast(tt('fm.packed', 'The market has packed up and left. Everything you got there is still yours.')); go('yard'); } } }
  if (on && window.PawArt && PawArt.MAP_ROADS && PawArt.MAP_ROADS.nodes && !PawArt.MAP_ROADS.nodes.fmarket) PawArt.MAP_ROADS.nodes.fmarket = FM_SPOT.slice();
  if (FM.open !== null && FM.open !== on && !on && !modal.hidden && $('#modal .panel.fm-pop')) { closeModal(); toast(tt('fm.packed', 'The market has packed up and left. Everything you got there is still yours.')); }
  FM.open = on; return on;
}
// the scene: the themed stalls, the sign with the market's name and closing date, the three stalls as buttons
function fmSceneArt() {
  const o = fmMain(), th = FM_THEME_ART[o ? o.m.theme : 'halloween'] || 'halloween', sv = artReal('prop', 'fmscene', { theme: th });
  const sign = esc(fmSign(o)), [sx, sy, sw] = (window.PawArt && PawArt.FM_SIGN) || [500, 128, 240], fs = Math.min(26, Math.max(15, sw * 2.1 / Math.max(10, [...fmSign(o)].length)));
  const stalls = FM_STALLS.map(([c, x, w], i) => { const cats = fmCats(), cc = i === 2 && !cats.includes('toys') ? cats[cats.length - 1] : c; return `<g data-fmstall="${cc}"><rect x="${x}" y="216" width="${w}" height="244" fill="transparent"/></g>`; }).join('');
  // v2.17.2 Spooky Stalls: the Halloween scene has a little board per stall (PawArt.FM_STALL_SIGNS) with the stall's short name, and the homes stand
  // and the treats cart in front are buttons too (when that stall has items)
  const SB = th === 'halloween' && sv && window.PawArt && PawArt.FM_STALL_SIGNS, cats = fmCats();
  const boards = SB ? Object.keys(SB).filter((c) => cats.includes(c)).map((c) => { const [x, y, w] = SB[c], t = fmCatShort(c), f = Math.min(19, Math.max(11, w * 1.7 / Math.max(4, [...t].length))); return `<text class="fm-stall-sign" x="${x}" y="${(y + 20).toFixed(1)}" text-anchor="middle" font-family="'Caveat',cursive" font-weight="700" font-size="${f.toFixed(1)}" fill="#5B3D32">${esc(t)}</text>`; }).join('') : '';
  const front = SB ? [['homes', 292, 418, 90, 152], ['treats', 626, 418, 84, 152]].filter(([c]) => cats.includes(c)).map(([c, x, y, w, h]) => `<g data-fmstall="${c}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"/></g>`).join('') : '';
  return (sv ? place(sv, 0, 0, 1000, 600) : '<rect width="1000" height="600" fill="#FFFBF3"/>')
    + `<text class="fm-sign" x="${sx}" y="${sy + 8}" text-anchor="middle" font-family="'Caveat',cursive" font-weight="700" font-size="${fs.toFixed(1)}" fill="#5B3D32">${sign}</text>${boards}${stalls}${front}`;
}
function fmPlaceBtn() {
  const pb = $('#placeBtns'); if (!pb) return; pb.querySelectorAll('[data-fmb]').forEach((b) => b.remove());
  if (!fmOn() || S.place !== 'fmarket' || !fmMain()) return;
  const html = `<button class="btn yes" data-fmb="stalls">${esc(tt('fm.browse', 'Browse the stalls'))}</button>`, home = pb.querySelector('[data-pb="yard"]');
  if (home) home.insertAdjacentHTML('beforebegin', html); else pb.insertAdjacentHTML('beforeend', html);
  pb.querySelector('[data-fmb]').onclick = () => fmSheet();
  const svg = $('svg.world', view); if (svg) hotify(svg, '#sceneG [data-fmstall]', 'data-fmstall', (c) => fmSheet(c), (c) => tt('fm.stall_label', 'Stall: {stall}', { stall: fmCatName(c) }));
}
function fmArrive() {
  if (!fmOn() || !S || S.place !== 'fmarket') return; fmPlaceBtn();
  const o = fmMain(); if (!o) return; const key = o.m.id + '_' + o.y;
  if (!S.fm.seen[key]) { S.fm.seen[key] = localISO(); markDirty(); setTimeout(() => { if (S.place === 'fmarket') toast(tt('fm.hello', 'Welcome to the {market}! Things you get here stay yours forever, even after the market packs up.', { market: fmMarketName(o.m) }), 'gold'); }, 800); }
}
on('yard:enter', () => { fmSync(); fmArrive(); });
on('scene:redraw', () => { if (fmOn() && S && S.place === 'fmarket' && !$('#placeBtns [data-fmb]')) fmPlaceBtn(); });

/* ---------------- the stall sheet (the shop sheet pattern: tabs, a scrollable grid, the purchase window) ---------------- */
let fmTab = 'decor';
function fmSheet(cat) {
  if (!S) return null; if (!fmSync()) { toast(tt('fm.packed', 'The market has packed up and left. Everything you got there is still yours.')); return null; }
  const cats = fmCats(); if (cat && cats.includes(cat)) fmTab = cat; if (!cats.includes(fmTab)) fmTab = cats[0]; if (!fmTab) return null;
  const op = !modal.hidden && $('#modal .panel.fm-pop'), keep = op ? (($('.panel-body', op) || {}).scrollTop || 0) : 0;
  SFX.boop(560); if (typeof audioPlace === 'function') audioPlace('shop');
  const items = fmItems(fmTab), L = topBond();
  const card = (it) => {
    const owned = fmOwned(it), lock = it.bond > L, have = it.kind === 'food' ? (S.inv.food[it.n] || 0) : 0;
    const act = owned ? `<span class="chip own">${esc(tt('fm.owned', 'Owned'))}</span>` : lock ? `<button class="btn" data-fmbuy="${esc(it.n)}" aria-disabled="true">${esc(tt('fm.bond', 'Bond {bond}', { bond: it.bond }))}</button>` : `<button class="btn yes" data-fmbuy="${esc(it.n)}">${esc(it.kind === 'food' ? tt('fm.buy_more', 'Buy…') : tt('fm.buy', 'Buy'))}</button>`;
    const pic = it.kind === 'houses' ? `<span class="art house">${art('house', it.n)}</span>` : it.kind === 'decor' ? `<span class="art">${hmDecorArt(it.n)}</span>` : `<span class="art">${typeof hwItemArt === 'function' ? hwItemArt(it.n) : art('item', it.n)}</span>`;
    return `<div class="sitem fm-card${lock ? ' lockd' : ''}" data-n="${esc(it.n)}" data-kind="${it.kind}">${pic}<b>${esc(it.name)}${typeof hwTag === 'function' ? hwTag(it.n) : ''}</b><span class="desc">${esc(it.desc)}</span>${it.tip ? `<span class="small sh-tip">${esc(it.tip)}</span>` : ''}${priceHTML(it.kind === 'food' ? tt('fm.each', '{n} each', { n: tnum(it.price) }) : tnum(it.price))}${have ? `<span class="small">${esc(tt('fm.in_bag', 'In bag: {n}', { n: have }))}</span>` : ''}${act}</div>`;
  };
  const tabs = `<div class="tabs fm-tabs" role="tablist">${cats.map((c) => `<button class="btn" role="tab" aria-selected="${c === fmTab}" data-fmtab="${c}">${esc(fmCatName(c))}</button>`).join('')}</div>`;
  const o = fmMain();
  const p = openModal(esc(fmPlaceName()), `<p class="small fm-lead">${esc(tt('fm.lead', 'A pop-up market for the festival. Coins only. Everything you get here stays yours forever.'))}</p>${tabs}<div class="shopgrid fm-grid">${items.map(card).join('')}</div>`,
    { cls: 'shop fm-pop', foot: `<p class="small fm-foot">${esc(fmSign(o))}</p>` });
  const bd = $('.panel-body', p); if (bd && keep) bd.scrollTop = keep;
  p.querySelectorAll('[data-fmtab]').forEach((b) => { b.onclick = () => { fmTab = b.dataset.fmtab; SFX.click(); fmSheet(); }; });
  p.querySelectorAll('[data-fmbuy]').forEach((b) => { b.onclick = () => { const it = items.find((x) => x.n === b.dataset.fmbuy); if (b.getAttribute('aria-disabled') === 'true') { nope(tt('fm.locked', '{item} opens at Bond {bond}.', { item: it.name, bond: it.bond })); return; } fmBuy(p, it); }; });
  return p;
}
async function fmBuy(p, it) {
  if (!it || !fmSync()) return; SFX.click();
  const stack = it.kind === 'food', owned = fmOwned(it), art0 = it.kind === 'houses' ? art('house', it.n) : it.kind === 'decor' ? hmDecorArt(it.n) : (typeof hwItemArt === 'function' ? hwItemArt(it.n) : art('item', it.n));
  const q = await buyWindow(p, { art: art0, name: it.name, desc: it.desc, price: it.price, stack, owned, have: stack ? (S.inv.food[it.n] || 0) : owned ? 1 : 0, haveLabel: stack ? tt('fm.in_bag_l', 'In bag') : tt('fm.owned', 'Owned') });
  if (!q || !fmSync() || (!stack && fmOwned(it))) return;
  const cost = it.price * q; if (S.coins < cost) { nope(tt('fm.poor', 'Not enough coins. Walks pay well, and the market is open until the sign says.')); return; }
  S.coins -= cost; SFX.kaching(); trackAct('buy', { name: it.n, cat: it.kind === 'food' ? 'food' : it.kind, qty: q, shop: 'market' });
  if (stack) S.inv.food[it.n] = (S.inv.food[it.n] || 0) + q;
  else if (it.kind === 'decor') { hmDecorFields(); S.decor[it.n] = { got: localISO(), out: true }; }
  else if (it.kind === 'beds') S.beds.push(it.n);
  else S.inv[it.kind].push(it.n);
  S.fm.bought = (S.fm.bought || 0) + 1; markDirty(); updateHUD(); saveNow();
  if (it.kind === 'decor') emit('decor:new', { name: it.n });
  else toast(tt('fm.bought', '{multi, select, yes {Bought {n} × {item}. It is yours to keep.} other {Bought {item}. It is yours to keep.}}', { multi: q > 1 ? 'yes' : 'no', n: q, item: it.name }), 'gold');
  fmSheet();
  if (it.kind === 'clothes') { const pp = $('.panel', modal); const w = await confirmIn(pp, esc(tt('fest.wear_q', 'Put the {item} on {name} now?', { item: it.name, name: NAME() })), tt('fm.wear', 'Wear it'), tt('fm.later', 'Later')); if (w) equip(it.n, true); if (!modal.hidden && fmSync()) fmSheet(); }
}

/* ---------------- the Squeaky Ghost: a ball-play toy (38_ball.js BL_TOYS, FETCH_TOYS) ---------------- */
if (!BL_TOYS['Squeaky Ghost']) BL_TOYS['Squeaky Ghost'] = { prop: ['item', 'Squeaky Ghost'], g: 1700, bounce: 0.45, fric: 3, spin: 0.6, vzK: 0.95, coin: 2, hap: 15, en: 1 };
if (!FETCH_TOYS.includes('Squeaky Ghost')) FETCH_TOYS.push('Squeaky Ghost');

/* ---------------- the map: the tent beside the Square with a "Festival!" tag, the travel walk through the Square ---------------- */
function fmMapTent() {
  if (!fmOn() || !PLACES.fmarket) return '';
  const o = fmMain(), th = FM_THEME_ART[o.m.theme] || 'halloween', a = artReal('prop', 'fmtent', { theme: th }), name = esc(fmPlaceName()), tag = esc(tt('fm.tag', 'Festival!'));
  const tw = Math.max(110, [...tag].length * 15 + 30);
  return `<g class="mb fm-mb" data-area="fmarket" role="button" tabindex="0" aria-label="${esc(tt('town.go_to', '{locked, select, yes {Go to {place} (locked, Bond {bond})} other {Go to {place}}}', { locked: 'no', place: fmPlaceName(), bond: 1 }))}" transform="translate(${FM_SPOT[0]} ${FM_SPOT[1]})">`
    + `<ellipse class="mb-shadow" cx="0" cy="40" rx="96" ry="14" fill="#5B3D32" opacity=".13"/><g class="mb-lift" style="transform-box:fill-box;transform-origin:50% 80%"><rect class="mb-box" x="-150" y="-140" width="300" height="260" fill="none"/>${a ? place(a, -130, -130, 260, 230) : ''}`
    + `<text class="mb-cap" x="0" y="96" text-anchor="middle" font-family="'Caveat',cursive" font-weight="700" font-size="31" fill="#5B3D32" stroke="#FFFBF3" stroke-width="7" stroke-linejoin="round" paint-order="stroke">${name}</text>`
    + `<g class="mb-sticker fm-tag" data-kind="new" pointer-events="none" transform="translate(70 -96) rotate(8)"><rect x="${-tw / 2}" y="-17" width="${tw}" height="32" rx="9" fill="#F2A65A" stroke="#5B3D32" stroke-width="2"/><text y="7" text-anchor="middle" font-family="'Caveat',cursive" font-weight="700" font-size="24" fill="#5B3D32">${tag}</text></g></g>`
    + `<ellipse class="mb-hit" cx="0" cy="-10" rx="132" ry="120" fill="transparent"/></g>`;
}
// the travel walk: to (or from) the market through the Square's node, then the last short leg
function fmRoute(from, k) {
  if (from !== 'fmarket' && k !== 'fmarket') return null;
  const other = from === 'fmarket' ? k : from, r = other === 'square' ? { pts: [], nodes: ['square'] } : mpRoute(other, 'square'), sq = PawArt.MAP_ROADS.nodes.square;
  if (!r || !sq) return null;
  if (k === 'fmarket') return { pts: r.pts.concat([FM_SPOT.slice()]), nodes: r.nodes.concat('fmarket') };
  return null; // leaving the market: the plain travel (no walk)
}

/* ---------------- the letter when a market opens (once per market per year) ---------------- */
function fmLetter() {
  if (!fmOn() || !S || typeof mailPush !== 'function') return; const o = fmMain(); if (!o) return; const key = o.m.id + '_' + o.y;
  if (S.fm.letters[key]) return; S.fm.letters[key] = localISO(); markDirty();
  mailPush({ kind: 'news', id: 'fm_' + key, from: tt('dd.news_from', 'Gerald'), title: tt('fm.letter_title', 'The {market} is open', { market: fmMarketName(o.m) }), text: tt('fm.letter_text', 'A pop-up market has come to town, right beside the Town Square. Look for the tent with the "Festival!" tag on the map. It is open until {date}, and everything you get there stays yours.', { date: fmClose(o) }), ps: tt('fm.letter_ps', 'Gerald, who has already tried on a hat') });
  FM.letters++;
}
on('yard:enter', () => { if (fmOn()) setTimeout(() => { if (cur.mode === 'yard') fmLetter(); }, 1600); });
setInterval(() => { try { if (S && fmOn() !== null) fmSync(); fmExpose(); } catch (e) { /* not ready */ } }, 5000);
on('game:ready', () => { setTimeout(() => { fmSync(); fmExpose(); }, 0); });

/* ---- tests: window.__paw.fm ---- */
function fmExpose() {
  if (!window.__paw || window.__paw.fm) return;
  window.__paw.fm = {
    on: () => fmOn(), markets: FM_MARKETS, open: (d) => fmOpen(d).map((o) => ({ id: o.m.id, from: o.from, to: o.to, y: o.y })), main: () => { const o = fmMain(); return o ? o.m.id : null; }, sign: () => fmSign(), name: () => fmPlaceName(),
    items: (c) => fmItems(c).map((x) => ({ n: x.n, kind: x.kind, price: x.price, bond: x.bond })), cats: () => fmCats(), sheet: (c) => fmSheet(c), sync: () => fmSync(), owned: (n) => { const r = fmRow(n); return r ? fmOwned(r) : false; }, row: (n) => fmRow(n),
    date: (d) => { prefs.fmDate = d || null; fmSync(); }, allow: (v) => { prefs.fmTest = !!v; fmSync(); }, letter: () => fmLetter(), get letters() { return FM.letters; }, tent: () => fmMapTent(), spot: FM_SPOT.slice(), cats0: FM_CATS.slice()
  };
}
