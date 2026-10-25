/* ======================= MARKET + SHOPS ======================= */
const SHOP_NAME = { kibble: 'Kibble Corner', boutique: 'Bow-Wow Boutique', builder: 'Barkitecture', sprout: "Pip's Sprout Cart" };
// v2.14 i18n: display text of the item tables (V214.md 4.3). Ids, item names and save values stay English; only what is shown is looked up.
// cat = 'food' | 'toys' | 'clothes' | 'houses' | 'beds' | 'decor' | 'furniture' | 'pantry' | 'tools'; id = the pantry id
const shopTitle = (k) => tdata('shop_name.' + k, SHOP_NAME[k] || k);
const SH_TBL = { food: 'food', toys: 'toys', clothes: 'clothes', houses: 'houses', beds: 'beds', decor: 'hm_decor', furniture: 'hm_decor' };
const shItemName = (cat, n, id) => (cat === 'pantry' ? tdata('pantry.' + tid(id) + '.name', n) : cat === 'tools' ? (n === 'Gene Sniffer' ? tt('shop.gene_sniffer', 'Gene Sniffer') : n) : tdata((SH_TBL[cat] || cat) + '.' + tid(n) + '.n', n));
// the shown name of any item by its English name (clothes, toys, food, treasure food, treasures, houses); unknown names come back as they are
const shNameAny = (n) => { if (n === 'Coat Collector Ribbon') return tt('journal.ribbon_name', 'Coat Collector Ribbon'); if (n === 'Rainbow Collar') return tt('journal.rainbow_name', 'Rainbow Collar'); const tb = CLOTHES.some((x) => x.n === n) ? 'clothes' : TOYS.some((x) => x.n === n) ? 'toys' : FOOD.some((x) => x.n === n) ? 'food' : TFOOD.some((x) => x.n === n) ? 'tfood' : TREASURES.some((x) => x.n === n) ? 'treasures' : HOUSES.some((x) => x.n === n) ? 'houses' : ''; return tb ? tdata(tb + '.' + tid(n) + '.n', n) : n; };
const shSlotName = (s) => (SLOT_NAME[s] ? tdata('slot_name.' + s, SLOT_NAME[s]) : s);
// the perk line of a wearable: a boutique row has a perk of its own; a treasure wearable is "ability: text"
const shPerk = (c) => (c.n === 'Coat Collector Ribbon' ? tt('journal.ribbon_perk', 'Coat Collector: 15 coats found. Pure bragging rights. Other dogs can tell.') : c.n === 'Rainbow Collar' ? tt('journal.rainbow_perk', 'Rainbow Collar: 25 coats found. Every colour, all at once.') : c.treasure || c.slot === 'charm' ? (() => { const t = TREASURES.find((x) => x.n === c.n); return t ? tt('shop.treasure_perk', '{ab}: {txt}', { ab: tdata('treasures.' + tid(t.n) + '.ab', t.ab), txt: tdata('treasures.' + tid(t.n) + '.txt', t.txt) }) : c.perk; })() : tdata('clothes.' + tid(c.n) + '.perk', c.perk));
const portrait = () => !!(window.matchMedia && matchMedia('(max-aspect-ratio: 4/5)').matches);
const fitPA = () => (portrait() ? 'xMidYMid slice' : 'xMidYMid meet');
function hotify(svg, sel, attr, onPick, label) {
  svg.querySelectorAll(sel).forEach((g) => {
    const k = g.getAttribute(attr); g.classList.add('hot'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', label(k));
    // v2.13.3 (owner): while ball play is on, a shop or prop opens nothing, whatever part of it takes the tap
    const pick = () => { if (typeof blOn === 'function' && blOn()) return; onPick(k); };
    g.addEventListener('click', pick); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  });
}
// v2.8 review 3: with the Japan scenery the desktop street sits 30 units higher (the crop used to start at the roof cornices), so a strip of sky
// over the Boutique shows Mt. Fuji's cap. The "Market Street" sign (y 530-570) and the shops stay whole; phones frame the street in camApply.
const MK_DESK_LIFT = 30;
function enterMarketPlace() {
  S.place = 'market'; enterYard();
  const svg = !isPhone() && jpOn() && $('#view > svg.world'); if (svg) svg.setAttribute('viewBox', `0 ${-MK_DESK_LIFT} 1000 600`);
}
function enterMarketOld() {
  setChrome(true, true);
  view.innerHTML = `<svg class="world" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" style="background:#FFFBF3">${sceneG('market')}</svg><div id="status"></div><button id="devBtn">dev</button>`;
  hotify($('svg.world', view), '[data-shop]', 'data-shop', (k) => openShop(k), (k) => tt('shop.enter', 'Enter {name}', { name: shopTitle(k) }));
  dock.innerHTML = `<div class="tray"><div class="tray-h"><h3>${tt('shop.market_street', 'Market Street: tap a shop')}</h3></div><div class="wrap">${Object.keys(SHOP_NAME).map((k) => `<button class="btn" data-sh="${k}">${shopTitle(k)}</button>`).join('')}</div></div>`;
  dock.querySelectorAll('[data-sh]').forEach((b) => { b.onclick = () => openShop(b.dataset.sh); });
  updateHUD(); bindDev();
}
/* ---- v1.5A purchase / sale window (every shop) ---- */
const fmtC = (n) => tnum(Math.round(n)); // v2.14: grouped in the current language (en: the same as en-US)
let buyOpen = false;
function buyWindow(panel, o) {
  // o: { art, name, desc, price, stack, owned, have, haveLabel, sell, max }  -> Promise<qty | 0>
  return new Promise((res) => {
    const old = panel.querySelector('.buyveil'); if (old) old.remove();
    const sell = !!o.sell, unit = o.price;
    const maxQ = () => (sell ? o.max : o.stack ? Math.max(0, Math.min(999, Math.floor(S.coins / unit))) : 1);
    let q = o.stack || sell ? Math.min(1, Math.max(0, maxQ())) || 1 : 1;
    const v = document.createElement('div'); v.className = 'buyveil';
    v.innerHTML = `<div class="buybox pop" role="dialog" aria-modal="true" aria-label="${esc(sell ? tt('shop.aria_sell', 'Sell {name}', { name: o.name }) : tt('shop.aria_buy', 'Buy {name}', { name: o.name }))}">
      <div class="bb-top"><span class="bb-art">${o.art}</span><div><h3>${esc(o.name)}</h3><p class="small">${esc(o.desc || '')}</p><p class="bb-unit">${priceHTML(tt('shop.price_each', '{price} each', { price: fmtC(unit) }))}</p></div></div>
      ${o.stack || sell ? `<div class="bb-qty"><button class="btn bb-m" aria-label="${tt('shop.one_less', 'One less')}">−</button><input class="bb-in" type="number" min="1" inputmode="numeric" aria-label="${tt('shop.quantity', 'Quantity')}" value="${q}"><button class="btn bb-p" aria-label="${tt('shop.one_more', 'One more')}">+</button>
        <span class="bb-quick">${[1, 5, 10].map((n) => `<button class="btn" data-qq="${n}">×${n}</button>`).join('')}<button class="btn" data-qq="max">${tt('shop.max', 'Max')}</button></span></div>` : `<p class="bb-one">${o.owned ? `<span class="chip own">${tt('shop.owned', 'Owned')}</span> ${tt('shop.already_have', 'You already have this one.')}` : tt('shop.one_of_kind', 'One of a kind: quantity 1.')}</p>`}
      <div class="bb-sum"></div>
      <div class="foot"><button class="btn no bb-no">${tt('shop.cancel', 'Cancel')}</button><button class="btn yes big bb-yes">${sell ? tt('shop.sell', 'Sell') : tt('shop.buy', 'Buy')}</button></div></div>`;
    panel.appendChild(v); buyOpen = true;
    const inp = v.querySelector('.bb-in'), yes = v.querySelector('.bb-yes'), sum = v.querySelector('.bb-sum');
    const draw = () => {
      const mx = maxQ(); if (o.stack || sell) q = clamp(Math.round(+q || 1), 1, Math.max(1, sell ? mx : 999));
      const total = unit * q, after = sell ? S.coins + total : S.coins - total, bad = !sell && (after < 0 || (!o.stack && o.owned));
      if (inp && document.activeElement !== inp) inp.value = q;
      sum.className = 'bb-sum' + (bad ? ' bad' : '');
      sum.innerHTML = `<div>${tt('shop.sum_have_html', '{coins, plural, one {You have <b>#</b> coin} other {You have <b>#</b> coins}}', { coins: S.coins })}</div><div>${tt('shop.sum_total_html', '{total, plural, one {Total: <b>#</b> coin} other {Total: <b>#</b> coins}}', { total })}</div><div class="bb-after">${sell ? tt('shop.coins_after_html', 'Coins after: <b>{n}</b>', { n: fmtC(after) }) : tt('shop.coins_left_html', 'Coins left after: <b>{n}</b>', { n: fmtC(after) })}</div><div class="small">${esc(tt('shop.label_n', '{label}: {n}', { label: o.haveLabel || tt('shop.in_bag', 'In bag'), n: o.have || 0 }))}${sell ? '' : o.stack ? ` · ${tt('shop.can_afford', 'you can afford {n}', { n: mx })}` : ''}</div>${bad && !o.owned ? `<div class="bb-warn">${tt('shop.not_enough', 'Not enough coins. Have you tried being rich?')}</div>` : ''}`;
      yes.disabled = bad; yes.setAttribute('aria-disabled', bad ? 'true' : 'false');
      v.querySelectorAll('[data-qq]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.qq === String(q) || (b.dataset.qq === 'max' && q === mx))));
    };
    // a step from the keys or the -/+ buttons always rewrites the box, even while it has focus (typing still isn't overwritten)
    const step = (d) => { q = (+q || 1) + d; SFX.click(); draw(); if (inp) inp.value = q; };
    const done = (val) => { window.removeEventListener('keydown', onKey, true); v.remove(); buyOpen = false; res(val); };
    const doBuy = () => { if (yes.disabled) { SFX.nope(); return; } done(q); };
    const onKey = (e) => {
      if (!v.isConnected) { window.removeEventListener('keydown', onKey, true); buyOpen = false; return; }
      const k = e.key; let used = true;
      if (k === 'Escape') { SFX.click(); done(0); }
      else if (k === 'Enter') doBuy();
      else if ((k === 'ArrowLeft' || k === 'ArrowDown' || k === '-' || k === '_') && (o.stack || sell)) step(-1);
      else if ((k === 'ArrowRight' || k === 'ArrowUp' || k === '+' || k === '=') && (o.stack || sell)) step(1);
      else used = false;
      if (used) { e.preventDefault(); e.stopImmediatePropagation(); }
    };
    window.addEventListener('keydown', onKey, true);
    v.addEventListener('click', (e) => { if (e.target === v) { SFX.click(); done(0); } });
    v.querySelector('.bb-no').onclick = () => { SFX.click(); done(0); };
    yes.onclick = doBuy;
    if (inp) { v.querySelector('.bb-m').onclick = () => step(-1); v.querySelector('.bb-p').onclick = () => step(1); inp.addEventListener('input', () => { q = inp.value; draw(); }); inp.addEventListener('change', () => { q = inp.value; draw(); inp.value = q; }); }
    v.querySelectorAll('[data-qq]').forEach((b) => { b.onclick = () => { SFX.click(); q = b.dataset.qq === 'max' ? Math.max(1, maxQ()) : +b.dataset.qq; draw(); if (inp) inp.value = q; }; });
    draw(); setTimeout(() => { try { (inp || yes).focus({ preventScroll: true }); if (inp) inp.select(); } catch (e) { /* none */ } }, 30);
  });
}
/* item art with a graceful fallback: a new item the art module doesn't draw yet gets a doodle instead of the "?" */
const ITEM_FB = {
  'Puppy Kibble': () => `<svg viewBox="0 0 100 100"><path d="M26 30 Q24 22 30 20 H70 Q76 22 74 30 L80 84 Q80 90 74 90 H26 Q20 90 20 84 Z" fill="#CDEBDD" stroke="#5B3D32" stroke-width="3.5" stroke-linejoin="round"/><path d="M30 20 Q40 28 50 20 Q60 28 70 20" fill="none" stroke="#5B3D32" stroke-width="2.5"/><rect x="31" y="44" width="38" height="32" rx="8" fill="#FBE0E6" stroke="#5B3D32" stroke-width="2.5"/><g fill="#F28FA5" stroke="#5B3D32" stroke-width="1.6"><ellipse cx="50" cy="64" rx="7" ry="6"/><circle cx="41" cy="54" r="3.2"/><circle cx="47" cy="50" r="3.2"/><circle cx="53" cy="50" r="3.2"/><circle cx="59" cy="54" r="3.2"/></g><g fill="#E8B07A" stroke="#5B3D32" stroke-width="1.5"><circle cx="78" cy="88" r="4"/><circle cx="86" cy="84" r="3.4"/></g></svg>`
};
function itemArt(n) { return artReal('item', n) || (ITEM_FB[n] ? ITEM_FB[n]() : art('item', n)); }
function priceHTML(p) { return `<span class="price"><span class="ic">${ICON('coin')}</span>${p}</span>`; }
let shopTab = { kibble: 'food' };
function openShop(k) {
  if (k === 'sprout') { openPip(); return; }
  SFX.boop(620); audioPlace('shop');
  const title = shopTitle(k);
  let tabs = '', items = [];
  if (k === 'kibble') {
    if (!kOn() && shopTab.kibble === 'pantry') shopTab.kibble = 'food';
    const t = shopTab.kibble;
    tabs = `<div class="tabs" role="tablist"><button class="btn" role="tab" aria-selected="${t === 'food'}" data-tab="food">${tt('shop.tab_food', 'Food')}</button><button class="btn" role="tab" aria-selected="${t === 'toys'}" data-tab="toys">${tt('shop.tab_toys', 'Toys')}</button><button class="btn" role="tab" aria-selected="${t === 'tools'}" data-tab="tools">${tt('shop.tab_tools', 'Tools')}</button>${kOn() ? `<button class="btn" role="tab" aria-selected="${t === 'pantry'}" data-tab="pantry">${tt('shop.tab_pantry', 'Pantry')}</button>` : ''}</div>`;
    items = t === 'pantry' ? pantryList().map((x) => ({ cat: 'pantry', id: x.id, n: x.name, price: x.price, bond: 1, desc: x.id === 'chicken' ? tt('shop.pantry_chicken', 'Boneless. For the kitchen.') : tt('shop.pantry_other', 'For the kitchen. Cooks into dog dishes.') })) : t === 'tools' ? twTools() : t === 'food' ? FOOD.filter((f) => f.price > 0 && !f.fest).map((f) => ({ cat: 'food', n: f.n, price: f.price, bond: 1, desc: tdata('food.' + tid(f.n) + '.note', f.note), tip: f.tip && tdata('food.' + tid(f.n) + '.tip', f.tip) })) : TOYS.filter((x) => !x.reward && !x.fest).map((x) => ({ cat: 'toys', n: x.n, price: x.price, bond: x.bond, desc: tdata('toys.' + tid(x.n) + '.note', x.note) }));
  } else if (k === 'boutique') items = CLOTHES.filter((c) => !c.reward && !c.fest).map((c) => ({ cat: 'clothes', n: c.n, price: c.price, bond: c.bond, desc: tt('shop.cloth_desc', '{slot}. {perk}', { slot: shSlotName(c.slot), perk: shPerk(c) }) }));
  else {
    const t = shopTab.builder || 'houses';
    tabs = `<div class="tabs" role="tablist"><button class="btn" role="tab" aria-selected="${t === 'houses'}" data-btab="houses">${tt('shop.tab_houses', 'Houses')}</button><button class="btn" role="tab" aria-selected="${t === 'beds'}" data-btab="beds">${tt('shop.tab_beds', 'Beds')}</button><button class="btn" role="tab" aria-selected="${t === 'decor'}" data-btab="decor">${tt('shop.tab_decor', 'Decor')}</button><button class="btn ho-ftab" role="tab" aria-selected="${t === 'furniture'}" data-btab="furniture"><span class="ic" aria-hidden="true">${iconOr('furniture', '')}</span>${tt('shop.tab_furniture', 'Furniture')}</button></div>${t === 'furniture' ? `<p class="small ho-shnote">${tt('shop.furniture_note', 'The Furniture corner: big comfy things the dogs actually use.')}</p>` : ''}`; // v2.7: Decor and the Furniture corner (28_home.js hoShopItems)
    items = t === 'decor' || t === 'furniture' ? hoShopItems(t) : t === 'beds' ? BEDS.filter((b) => !b.fm && !b.fest).map((b) => ({ cat: 'beds', n: b.n, price: b.price, bond: b.bond, desc: tt('shop.bed_desc', 'House nap +{pct}%. {note}', { pct: Math.round(b.bonus * 100), note: tdata('beds.' + tid(b.n) + '.note', b.note) }) })) : HOUSES.filter((h) => !h.reward && !h.fest).map((h) => ({ cat: 'houses', n: h.n, price: h.price, bond: h.bond, desc: tt('shop.house_desc', 'Nap Energy +{pct}%. {note}', { pct: Math.round(h.comfort * 100), note: tdata('houses.' + tid(h.n) + '.note', h.note) }) }));
  }
  const hoCat = (it) => it.cat === 'decor' || it.cat === 'furniture'; // v2.7: decorations and furniture, owned once (S.decor)
  const cards = items.map((it) => {
    if (it.head) return `<h4 class="ho-shh">${esc(it.head)}</h4>`;
    if (hoCat(it)) {
      const lock = topBond() < it.bond, got = !!(S.decor && S.decor[it.n]);
      const act = lock ? `<span class="chip lock">${tt('shop.bond_chip', 'Bond {bond}', { bond: it.bond })}</span>` : got ? (hmDecorOut(it.n) ? `<span class="chip own">${tt('shop.owned', 'Owned')}</span>` : `<button class="btn" data-hoplace="${esc(it.n)}">${tt('shop.owned_place', 'Owned · Place')}</button>`) : `<button class="btn yes" data-buy="${esc(it.n)}">${tt('shop.buy', 'Buy')}</button>`;
      return `<div class="sitem ${lock ? 'lockd' : ''}"><span class="art">${itemArt(it.n)}</span><b>${esc(shItemName(it.cat, it.n))}</b><span class="desc">${esc(it.desc)}</span>${priceHTML(it.price)}${act}</div>`;
    }
    const lock = topBond() < it.bond, owned = it.cat === 'beds' ? S.beds.includes(it.n) : it.cat === 'tools' ? twOwns(it.n) : it.cat !== 'food' && it.cat !== 'pantry' && owns(it.cat, it.n), have = it.cat === 'food' ? (S.inv.food[it.n] || 0) : it.cat === 'pantry' ? (S.inv.pantry[it.id] || 0) : 0;
    const artH = it.cat === 'houses' ? `<span class="art house">${art('house', it.n)}</span>` : `<span class="art">${itemArt(it.n)}</span>`;
    let act;
    if (lock) act = `<span class="chip lock">${tt('shop.bond_chip', 'Bond {bond}', { bond: it.bond })}</span>${it.cat === 'tools' ? `<span class="small">${esc(twToolLock(it))}</span>` : ''}`;
    else if (owned && it.cat === 'beds') act = S.bed === it.n ? `<span class="chip own">${tt('shop.owned_in_use', 'Owned · in use')}</span>` : `<button class="btn" data-usebed="${esc(it.n)}">${tt('shop.owned_use_bed', 'Owned · Use this bed')}</button>`;
    else if (owned) act = it.cat === 'houses' ? (S.house === it.n ? `<span class="chip own">${tt('shop.owned_living', 'Owned · living here')}</span>` : `<button class="btn" data-use="${esc(it.n)}">${tt('shop.owned_move_in', 'Owned · Move in')}</button>`) : `<span class="chip own">${tt('shop.owned', 'Owned')}</span>`;
    else if (it.price === 0) act = `<span class="chip own">${tt('shop.free', 'Free')}</span>`;
    else act = `<button class="btn yes" data-buy="${esc(it.n)}">${it.cat === 'food' || it.cat === 'pantry' ? tt('shop.buy_more', 'Buy…') : tt('shop.buy', 'Buy')}</button>`;
    return `<div class="sitem ${lock ? 'lockd' : ''}">${artH}<b>${esc(shItemName(it.cat, it.n, it.id))}</b><span class="desc">${esc(it.desc)}</span>${it.tip ? `<span class="small sh-tip">${esc(it.tip)}</span>` : ''}${it.price ? priceHTML(it.cat === 'food' ? tt('shop.price_each', '{price} each', { price: it.price }) : it.price) : ''}${have ? `<span class="small">${tt('shop.you_have_n', 'You have {n}', { n: have })}</span>` : ''}${act}</div>`;
  }).join('');
  const greet = { kibble: tt('shop.greet_kibble', 'Snacks, toys, and a strong smell of kibble.'), boutique: tt('shop.greet_boutique', 'Fashion for dogs who do not care about fashion.'), builder: tt('shop.greet_builder', 'We build houses. Out of whatever. Mostly cardboard.') }[k];
  const p = openModal(title, `<p class="small">${esc(tt('shop.greet_coins', '{greet} {coins, plural, one {You have # Paw Coin.} other {You have # Paw Coins.}}', { greet, coins: S.coins }))}</p>${tabs}<div class="shopgrid">${cards}</div>`, { cls: 'shop' });
  p.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { shopTab.kibble = b.dataset.tab; openShop('kibble'); }; });
  p.querySelectorAll('[data-btab]').forEach((b) => { b.onclick = () => { SFX.click(); shopTab.builder = b.dataset.btab; openShop('builder'); }; });
  p.querySelectorAll('[data-usebed]').forEach((b) => { b.onclick = () => { useBed(b.dataset.usebed); openShop(k); }; });
  p.querySelectorAll('[data-hoplace]').forEach((b) => { b.onclick = () => { SFX.click(); closeModal(); hoPlaceStart(b.dataset.hoplace); }; });
  p.querySelectorAll('[data-use]').forEach((b) => { b.onclick = () => { switchHouse(b.dataset.use); openShop(k); }; });
  p.querySelectorAll('[data-buy]').forEach((b) => {
    b.onclick = async () => {
      const it = items.find((x) => x.n === b.dataset.buy); SFX.click();
      const stack = it.cat === 'food' || it.cat === 'pantry', owned = it.cat === 'beds' ? S.beds.includes(it.n) : it.cat === 'tools' ? twOwns(it.n) : hoCat(it) ? !!(S.decor && S.decor[it.n]) : !stack && owns(it.cat, it.n);
      const have = it.cat === 'food' ? (S.inv.food[it.n] || 0) : it.cat === 'pantry' ? (S.inv.pantry[it.id] || 0) : owned ? 1 : 0;
      const nm = shItemName(it.cat, it.n, it.id);
      const q = await buyWindow(p, { art: it.cat === 'houses' ? art('house', it.n) : itemArt(it.n), name: nm, desc: it.desc, price: it.price, stack, owned, have, haveLabel: stack ? tt('shop.in_bag', 'In bag') : tt('shop.owned', 'Owned') }); if (!q) return;
      const cost = it.price * q; if (S.coins < cost) { nope(tt('shop.not_enough', 'Not enough coins. Have you tried being rich?')); return; }
      S.coins -= cost; SFX.kaching(); trackAct('buy', { name: it.n, cat: it.cat, qty: q, shop: k });
      if (hoCat(it)) { hmDecorFields(); S.decor[it.n] = { got: localISO(), out: false }; } else if (it.cat === 'beds') S.beds.push(it.n); else if (it.cat === 'food') S.inv.food[it.n] = (S.inv.food[it.n] || 0) + q; else if (it.cat === 'pantry') S.inv.pantry[it.id] = (S.inv.pantry[it.id] || 0) + q; else if (it.cat === 'tools') twGiveTool(it.n); else S.inv[it.cat].push(it.n);
      markDirty(); updateHUD();
      toast(tt('shop.bought', 'Bought {q} × {item}. {pick}', { q, item: nm, pick: PICK([tt('shop.bought_1', 'The shopkeeper did a little dance.'), tt('shop.bought_2', 'Receipt drawn in crayon.'), tt('shop.bought_3', 'No refunds. Ever.'), tt('shop.bought_4', 'Wise purchase. Probably.')]) }), 'gold');
      if (hoCat(it)) { openShop(k); const pp = $('.panel', modal); const pl = await confirmIn(pp, tt('shop.put_decor', 'Put the {n} in the {room, select, house {house} other {yard}} now?', { n: esc(nm), room: hoRoomOf(it.n) }), tt('shop.place_it', 'Place it'), tt('shop.later', 'Later')); if (pl) { closeModal(); hoPlaceStart(it.n); return; } openShop(k); return; }
      if (it.cat === 'beds') { openShop(k); const pp = $('.panel', modal); const ub = await confirmIn(pp, tt('shop.put_bed', 'Put the {n} in the house for {name} now?', { n: esc(nm), name: esc(NAME()) }), tt('shop.use_it', 'Use it'), tt('shop.later', 'Later')); if (ub) useBed(it.n); openShop(k); return; }
      if (it.cat === 'houses') { openShop(k); const pp = $('.panel', modal); const mv = await confirmIn(pp, tt('shop.move_house', 'Move {name} into the {n} now?', { name: esc(NAME()), n: esc(nm) }), tt('shop.move_in', 'Move in'), tt('shop.later', 'Later')); if (mv) switchHouse(it.n); openShop(k); return; }
      if (it.cat === 'clothes') { openShop(k); const pp = $('.panel', modal); const w = await confirmIn(pp, tt('shop.put_on', 'Put the {n} on {name} now?', { n: esc(nm), name: esc(NAME()) }), tt('shop.wear_it', 'Wear it'), tt('shop.later', 'Later')); if (w) equip(it.n, true); openShop(k); return; }
      openShop(k);
    };
  });
}


/* ---- v2.1 TOWN: Kibble Corner tools (the Gene Sniffer) ---- */
function twTools() { return [{ cat: 'tools', n: 'Gene Sniffer', price: 1200, bond: 6, desc: tt('shop.gene_sniffer_desc', 'A pocket gadget that reads coat genes. Free sniffs at the Vet and on the Playdate Board.') }]; }
function twOwns(n) { return n === 'Gene Sniffer' && !!(S && S.sniffer); }
function twGiveTool(n) { if (n === 'Gene Sniffer') S.sniffer = true; }
function twToolLock(it) { return tt('shop.tool_locked', 'Locked. It unlocks when any dog reaches Bond {bond}.', { bond: it.bond }); }
on('game:ready', () => { if (S) { S.sniffer = !!S.sniffer; if (!S.sniffed || typeof S.sniffed !== 'object') S.sniffed = {}; } });

/* ---- v2.4 SHOP: food safety tips and the feeding perks (called from feed() in 03_yard) ---- */
// the two-sentence safety tip of a food. The first time a food is fed it shows once as a toast (S.foodTips). quiet: just return the text (the Journal Food tab)
function shFoodTip(name, quiet) {
  const f = FOOD.find((x) => x.n === name); if (!f || !f.tip) return '';
  const tip = tdata('food.' + tid(f.n) + '.tip', f.tip);
  if (quiet || !S) return tip;
  if (!S.foodTips || typeof S.foodTips !== 'object') S.foodTips = {};
  if (!S.foodTips[name]) { S.foodTips[name] = localISO(); markDirty(); toast(tt('shop.food_tip', '{name}: {tip}', { name: shItemName('food', name), tip }), 'good'); }
  return tip;
}
const shWaterWait = () => (S.outfit.neck === 'Sailor Collar' ? 60 : 120); // Sailor Collar: the water bowl refills in 1 game hour
const shPupMins = () => (S.outfit.body === 'Happi Coat' ? 120 : 60); // Happi Coat: Pupcake power for 2 game hours
function shFeedPerk(name, f) {
  if (name === 'Fresh Water' || !f) return { happy: 0, msg: '' };
  if (S.outfit.head === 'Chef Hat' && isMeal(name)) return { happy: 5, msg: ' ' + tt('shop.perk_chef', "Chef's kiss: +5 Happiness.") };
  if (S.outfit.body === 'Bumblebee Suit' && !isMeal(name)) return { happy: 5, msg: ' ' + tt('shop.perk_bee', 'Bzzz: +5 Happiness.') };
  return { happy: 0, msg: '' };
}
on('game:ready', () => { if (S && (!S.foodTips || typeof S.foodTips !== 'object')) S.foodTips = {}; });
// tests: window.__paw.shop
function shExpose() {
  if (!window.__paw) return;
  window.__paw.shop = { tip: (n, q) => shFoodTip(n, q), outfit: (pose) => shSleepOutfit(D(), pose), napRate: () => napRate(), roll: (area, o) => { const r = rollTreasure(area, o || {}); return r && r.item ? r.item.n : null; }, careDay: () => markCareDay(), careGift: () => shCareGift(), giftRoll: () => giftRoll(), dailyGift: () => { S.mailGiftDay = ''; return dailyGift(); }, mail: () => openMailbox(), wardrobe: () => openWardrobe(), equip: (n) => equip(n, true), sleep: () => startSleep(), wake: () => wake(), hot: () => isHot(), shop: (k) => openShop(k), waterWait: () => shWaterWait(), get busy() { return busy; } };
}
on('game:ready', () => setTimeout(shExpose, 0)); on('yard:enter', () => { if (!window.__paw || !window.__paw.shop) shExpose(); });
