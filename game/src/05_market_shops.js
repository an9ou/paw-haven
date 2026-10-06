/* ======================= MARKET + SHOPS ======================= */
const SHOP_NAME = { kibble: 'Kibble Corner', boutique: 'Bow-Wow Boutique', builder: 'Barkitecture', sprout: "Pip's Sprout Cart" };
const portrait = () => !!(window.matchMedia && matchMedia('(max-aspect-ratio: 4/5)').matches);
const fitPA = () => (portrait() ? 'xMidYMid slice' : 'xMidYMid meet');
function hotify(svg, sel, attr, onPick, label) {
  svg.querySelectorAll(sel).forEach((g) => {
    const k = g.getAttribute(attr); g.classList.add('hot'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', label(k));
    g.addEventListener('click', () => onPick(k)); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(k); } });
  });
}
function enterMarketPlace() { S.place = 'market'; enterYard(); }
function enterMarketOld() {
  setChrome(true, true);
  view.innerHTML = `<svg class="world" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" style="background:#FFFBF3">${sceneG('market')}</svg><div id="status"></div><button id="devBtn">dev</button>`;
  hotify($('svg.world', view), '[data-shop]', 'data-shop', (k) => openShop(k), (k) => 'Enter ' + (SHOP_NAME[k] || k));
  dock.innerHTML = `<div class="tray"><div class="tray-h"><h3>Market Street: tap a shop</h3></div><div class="wrap">${Object.keys(SHOP_NAME).map((k) => `<button class="btn" data-sh="${k}">${SHOP_NAME[k]}</button>`).join('')}</div></div>`;
  dock.querySelectorAll('[data-sh]').forEach((b) => { b.onclick = () => openShop(b.dataset.sh); });
  updateHUD(); bindDev();
}
/* ---- v1.5A purchase / sale window (every shop) ---- */
const fmtC = (n) => Math.round(n).toLocaleString('en-US');
let buyOpen = false;
function buyWindow(panel, o) {
  // o: { art, name, desc, price, stack, owned, have, haveLabel, sell, max }  -> Promise<qty | 0>
  return new Promise((res) => {
    const old = panel.querySelector('.buyveil'); if (old) old.remove();
    const sell = !!o.sell, unit = o.price;
    const maxQ = () => (sell ? o.max : o.stack ? Math.max(0, Math.min(999, Math.floor(S.coins / unit))) : 1);
    let q = o.stack || sell ? Math.min(1, Math.max(0, maxQ())) || 1 : 1;
    const v = document.createElement('div'); v.className = 'buyveil';
    v.innerHTML = `<div class="buybox pop" role="dialog" aria-modal="true" aria-label="${sell ? 'Sell' : 'Buy'} ${esc(o.name)}">
      <div class="bb-top"><span class="bb-art">${o.art}</span><div><h3>${esc(o.name)}</h3><p class="small">${esc(o.desc || '')}</p><p class="bb-unit">${priceHTML(fmtC(unit) + ' each')}</p></div></div>
      ${o.stack || sell ? `<div class="bb-qty"><button class="btn bb-m" aria-label="One less">−</button><input class="bb-in" type="number" min="1" inputmode="numeric" aria-label="Quantity" value="${q}"><button class="btn bb-p" aria-label="One more">+</button>
        <span class="bb-quick">${[1, 5, 10].map((n) => `<button class="btn" data-qq="${n}">×${n}</button>`).join('')}<button class="btn" data-qq="max">Max</button></span></div>` : `<p class="bb-one">${o.owned ? '<span class="chip own">Owned</span> You already have this one.' : 'One of a kind: quantity 1.'}</p>`}
      <div class="bb-sum"></div>
      <div class="foot"><button class="btn no bb-no">Cancel</button><button class="btn yes big bb-yes">${sell ? 'Sell' : 'Buy'}</button></div></div>`;
    panel.appendChild(v); buyOpen = true;
    const inp = v.querySelector('.bb-in'), yes = v.querySelector('.bb-yes'), sum = v.querySelector('.bb-sum');
    const draw = () => {
      const mx = maxQ(); if (o.stack || sell) q = clamp(Math.round(+q || 1), 1, Math.max(1, sell ? mx : 999));
      const total = unit * q, after = sell ? S.coins + total : S.coins - total, bad = !sell && (after < 0 || (!o.stack && o.owned));
      if (inp && document.activeElement !== inp) inp.value = q;
      sum.className = 'bb-sum' + (bad ? ' bad' : '');
      sum.innerHTML = `<div>You have <b>${fmtC(S.coins)}</b> coins</div><div>Total: <b>${fmtC(total)}</b> coins</div><div class="bb-after">${sell ? 'Coins after' : 'Coins left after'}: <b>${fmtC(after)}</b></div><div class="small">${esc(o.haveLabel || 'In bag')}: ${o.have || 0}${sell ? '' : o.stack ? ` · you can afford ${mx}` : ''}</div>${bad && !o.owned ? `<div class="bb-warn">Not enough coins. Have you tried being rich?</div>` : ''}`;
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
  const title = SHOP_NAME[k];
  let tabs = '', items = [];
  if (k === 'kibble') {
    if (!kOn() && shopTab.kibble === 'pantry') shopTab.kibble = 'food';
    const t = shopTab.kibble;
    tabs = `<div class="tabs" role="tablist"><button class="btn" role="tab" aria-selected="${t === 'food'}" data-tab="food">Food</button><button class="btn" role="tab" aria-selected="${t === 'toys'}" data-tab="toys">Toys</button><button class="btn" role="tab" aria-selected="${t === 'tools'}" data-tab="tools">Tools</button>${kOn() ? `<button class="btn" role="tab" aria-selected="${t === 'pantry'}" data-tab="pantry">Pantry</button>` : ''}</div>`;
    items = t === 'pantry' ? pantryList().map((x) => ({ cat: 'pantry', id: x.id, n: x.name, price: x.price, bond: 1, desc: x.id === 'chicken' ? 'Boneless. For the kitchen.' : 'For the kitchen. Cooks into dog dishes.' })) : t === 'tools' ? twTools() : t === 'food' ? FOOD.filter((f) => f.price > 0).map((f) => ({ cat: 'food', n: f.n, price: f.price, bond: 1, desc: f.note, tip: f.tip })) : TOYS.filter((x) => !x.reward).map((x) => ({ cat: 'toys', n: x.n, price: x.price, bond: x.bond, desc: x.note }));
  } else if (k === 'boutique') items = CLOTHES.filter((c) => !c.reward).map((c) => ({ cat: 'clothes', n: c.n, price: c.price, bond: c.bond, desc: `${SLOT_NAME[c.slot]}. ${c.perk}` }));
  else {
    const t = shopTab.builder || 'houses';
    tabs = `<div class="tabs" role="tablist"><button class="btn" role="tab" aria-selected="${t === 'houses'}" data-btab="houses">Houses</button><button class="btn" role="tab" aria-selected="${t === 'beds'}" data-btab="beds">Beds</button></div>`;
    items = t === 'beds' ? BEDS.map((b) => ({ cat: 'beds', n: b.n, price: b.price, bond: b.bond, desc: `House nap +${Math.round(b.bonus * 100)}%. ${b.note}` })) : HOUSES.filter((h) => !h.reward).map((h) => ({ cat: 'houses', n: h.n, price: h.price, bond: h.bond, desc: `Nap Energy +${Math.round(h.comfort * 100)}%. ${h.note}` }));
  }
  const cards = items.map((it) => {
    const lock = topBond() < it.bond, owned = it.cat === 'beds' ? S.beds.includes(it.n) : it.cat === 'tools' ? twOwns(it.n) : it.cat !== 'food' && it.cat !== 'pantry' && owns(it.cat, it.n), have = it.cat === 'food' ? (S.inv.food[it.n] || 0) : it.cat === 'pantry' ? (S.inv.pantry[it.id] || 0) : 0;
    const artH = it.cat === 'houses' ? `<span class="art house">${art('house', it.n)}</span>` : `<span class="art">${itemArt(it.n)}</span>`;
    let act;
    if (lock) act = `<span class="chip lock">Bond ${it.bond}</span>${it.cat === 'tools' ? `<span class="small">${esc(twToolLock(it))}</span>` : ''}`;
    else if (owned && it.cat === 'beds') act = S.bed === it.n ? '<span class="chip own">Owned · in use</span>' : `<button class="btn" data-usebed="${esc(it.n)}">Owned · Use this bed</button>`;
    else if (owned) act = it.cat === 'houses' ? (S.house === it.n ? '<span class="chip own">Owned · living here</span>' : `<button class="btn" data-use="${esc(it.n)}">Owned · Move in</button>`) : '<span class="chip own">Owned</span>';
    else if (it.price === 0) act = '<span class="chip own">Free</span>';
    else act = `<button class="btn yes" data-buy="${esc(it.n)}">${it.cat === 'food' || it.cat === 'pantry' ? 'Buy…' : 'Buy'}</button>`;
    return `<div class="sitem ${lock ? 'lockd' : ''}">${artH}<b>${esc(it.n)}</b><span class="desc">${esc(it.desc)}</span>${it.tip ? `<span class="small sh-tip">${esc(it.tip)}</span>` : ''}${it.price ? priceHTML(it.price + (it.cat === 'food' ? ' each' : '')) : ''}${have ? `<span class="small">You have ${have}</span>` : ''}${act}</div>`;
  }).join('');
  const greet = { kibble: 'Snacks, toys, and a strong smell of kibble.', boutique: 'Fashion for dogs who do not care about fashion.', builder: 'We build houses. Out of whatever. Mostly cardboard.' }[k];
  const p = openModal(title, `<p class="small">${greet} You have ${S.coins} Paw Coins.</p>${tabs}<div class="shopgrid">${cards}</div>`, { cls: 'shop' });
  p.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { shopTab.kibble = b.dataset.tab; openShop('kibble'); }; });
  p.querySelectorAll('[data-btab]').forEach((b) => { b.onclick = () => { SFX.click(); shopTab.builder = b.dataset.btab; openShop('builder'); }; });
  p.querySelectorAll('[data-usebed]').forEach((b) => { b.onclick = () => { useBed(b.dataset.usebed); openShop(k); }; });
  p.querySelectorAll('[data-use]').forEach((b) => { b.onclick = () => { switchHouse(b.dataset.use); openShop(k); }; });
  p.querySelectorAll('[data-buy]').forEach((b) => {
    b.onclick = async () => {
      const it = items.find((x) => x.n === b.dataset.buy); SFX.click();
      const stack = it.cat === 'food' || it.cat === 'pantry', owned = it.cat === 'beds' ? S.beds.includes(it.n) : it.cat === 'tools' ? twOwns(it.n) : !stack && owns(it.cat, it.n);
      const have = it.cat === 'food' ? (S.inv.food[it.n] || 0) : it.cat === 'pantry' ? (S.inv.pantry[it.id] || 0) : owned ? 1 : 0;
      const q = await buyWindow(p, { art: it.cat === 'houses' ? art('house', it.n) : itemArt(it.n), name: it.n, desc: it.desc, price: it.price, stack, owned, have, haveLabel: stack ? 'In bag' : 'Owned' }); if (!q) return;
      const cost = it.price * q; if (S.coins < cost) { nope('Not enough coins. Have you tried being rich?'); return; }
      S.coins -= cost; SFX.kaching(); trackAct('buy', { name: it.n, cat: it.cat, qty: q, shop: k });
      if (it.cat === 'beds') S.beds.push(it.n); else if (it.cat === 'food') S.inv.food[it.n] = (S.inv.food[it.n] || 0) + q; else if (it.cat === 'pantry') S.inv.pantry[it.id] = (S.inv.pantry[it.id] || 0) + q; else if (it.cat === 'tools') twGiveTool(it.n); else S.inv[it.cat].push(it.n);
      markDirty(); updateHUD();
      toast(`Bought ${q} × ${it.n}. ${PICK(['The shopkeeper did a little dance.', 'Receipt drawn in crayon.', 'No refunds. Ever.', 'Wise purchase. Probably.'])}`, 'gold');
      if (it.cat === 'beds') { openShop(k); const pp = $('.panel', modal); const ub = await confirmIn(pp, `Put the ${esc(it.n)} in the house for ${esc(NAME())} now?`, 'Use it', 'Later'); if (ub) useBed(it.n); openShop(k); return; }
      if (it.cat === 'houses') { openShop(k); const pp = $('.panel', modal); const mv = await confirmIn(pp, `Move ${esc(NAME())} into the ${esc(it.n)} now?`, 'Move in', 'Later'); if (mv) switchHouse(it.n); openShop(k); return; }
      if (it.cat === 'clothes') { openShop(k); const pp = $('.panel', modal); const w = await confirmIn(pp, `Put the ${esc(it.n)} on ${esc(NAME())} now?`, 'Wear it', 'Later'); if (w) equip(it.n, true); openShop(k); return; }
      openShop(k);
    };
  });
}


/* ---- v2.1 TOWN: Kibble Corner tools (the Gene Sniffer) ---- */
function twTools() { return [{ cat: 'tools', n: 'Gene Sniffer', price: 1200, bond: 6, desc: 'A pocket gadget that reads coat genes. Free sniffs at the Vet and on the Playdate Board.' }]; }
function twOwns(n) { return n === 'Gene Sniffer' && !!(S && S.sniffer); }
function twGiveTool(n) { if (n === 'Gene Sniffer') S.sniffer = true; }
function twToolLock(it) { return `Locked. It unlocks when any dog reaches Bond ${it.bond}.`; }
on('game:ready', () => { if (S) { S.sniffer = !!S.sniffer; if (!S.sniffed || typeof S.sniffed !== 'object') S.sniffed = {}; } });

/* ---- v2.4 SHOP: food safety tips and the feeding perks (called from feed() in 03_yard) ---- */
// the two-sentence safety tip of a food. The first time a food is fed it shows once as a toast (S.foodTips). quiet: just return the text (the Journal Food tab)
function shFoodTip(name, quiet) {
  const f = FOOD.find((x) => x.n === name); if (!f || !f.tip) return '';
  if (quiet || !S) return f.tip;
  if (!S.foodTips || typeof S.foodTips !== 'object') S.foodTips = {};
  if (!S.foodTips[name]) { S.foodTips[name] = localISO(); markDirty(); toast(`${name}: ${f.tip}`, 'good'); }
  return f.tip;
}
const shWaterWait = () => (S.outfit.neck === 'Sailor Collar' ? 60 : 120); // Sailor Collar: the water bowl refills in 1 game hour
const shPupMins = () => (S.outfit.body === 'Happi Coat' ? 120 : 60); // Happi Coat: Pupcake power for 2 game hours
function shFeedPerk(name, f) {
  if (name === 'Fresh Water' || !f) return { happy: 0, msg: '' };
  if (S.outfit.head === 'Chef Hat' && isMeal(name)) return { happy: 5, msg: " Chef's kiss: +5 Happiness." };
  if (S.outfit.body === 'Bumblebee Suit' && !isMeal(name)) return { happy: 5, msg: ' Bzzz: +5 Happiness.' };
  return { happy: 0, msg: '' };
}
on('game:ready', () => { if (S && (!S.foodTips || typeof S.foodTips !== 'object')) S.foodTips = {}; });
// tests: window.__paw.shop
function shExpose() {
  if (!window.__paw) return;
  window.__paw.shop = { tip: (n, q) => shFoodTip(n, q), outfit: (pose) => shSleepOutfit(D(), pose), napRate: () => napRate(), roll: (area, o) => { const r = rollTreasure(area, o || {}); return r && r.item ? r.item.n : null; }, careDay: () => markCareDay(), careGift: () => shCareGift(), giftRoll: () => giftRoll(), dailyGift: () => { S.mailGiftDay = ''; return dailyGift(); }, mail: () => openMailbox(), wardrobe: () => openWardrobe(), equip: (n) => equip(n, true), sleep: () => startSleep(), wake: () => wake(), hot: () => isHot(), shop: (k) => openShop(k), waterWait: () => shWaterWait() };
}
on('game:ready', () => setTimeout(shExpose, 0)); on('yard:enter', () => { if (!window.__paw || !window.__paw.shop) shExpose(); });
