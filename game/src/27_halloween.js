/* ======================= v2.6 HALLOWEEN lane (tag hw): Halloween 2026, the Pumpkin Patch Pop-up. See V26.md sections 1 and 7 =======================
   Mrs. Plum's Pumpkin Patch Pop-up in the Square, open only while hwShopOpen() (8 Oct to 2 Nov 2026, JST). It sells the 16 items with `ed: 2026`
   (4 yard decorations, 4 treats, 4 toys, 4 clothes) for coins. Bought items stay forever and show the "2026" tag (hwTag) everywhere.
   Data: S.hw { letter, seen }. Cross-lane names: hwTag (trays, Wardrobe, decor list, Journal), hwSquareDraw (called by fsSquareDraw), hwOpen (fsChooser),
   hwJournalLine (fsJournalLine). Dates and the shop gate (HW_ED, HW_WIN, jstISO, hwShopOpen) live in 00_core.js.
   Art: PawArt.prop('popup', { lit }), PawArt.icon('popup') and PawArt.item(name) from the HW ART lane, with doodle fallbacks until it merges. */

// the "2026" tag for an edition item (any of FOOD, TOYS, CLOTHES, HM_DECOR with `ed`), else '' so old items render exactly as before
function hwTag(name) {
  const it = FOOD.find((x) => x.n === name) || TOYS.find((x) => x.n === name) || CLOTHES.find((x) => x.n === name) || HM_DECOR[name];
  return it && it.ed ? `<span class="hw-tag">${it.ed}</span>` : '';
}

/* ---- spots (world box x, y, w, h of the 1000x600 scene; the prop viewBox is 240x220) ---- */
// desktop: left of the dog, in front of the fountain, mirroring the Harvest Stall on the right (clear of pack spot 1 at x 18-212, the bowl and #dogHit).
// phones: the stall takes that spot, so the pop-up stands in the foreground: under the dog's feet first, then in front of the stall, then the
// left edge of a visitor-shifted crop. Nothing fits: the desktop spot, seen with the look-right button (like the stall's fallback).
const HW_POP = { desk: [208, 372, 116, 106], phone: [[338, 516, 90, 82], [212, 494, 100, 92]] };
const HW_BOWL = [195, 452, 110, 110]; // the phone bowl box (shown while feeding a snack in the Square)
const HW_END = '2 November';
const HW_PLUM = 'Everything here is made for 2026 only. When I pack up on 2 November, it is gone for good, but yours stays yours.';
const HW_LETTER = { from: 'Mrs. Plum next door', title: 'The Pumpkin Patch Pop-up', text: 'The Pumpkin Patch Pop-up is open in the Square until 2 November. Everything is made for this year only, so have a look.' };
const HW_CATS = [['decor', 'Decorations'], ['food', 'Treats'], ['toys', 'Toys'], ['clothes', 'Clothes']];
const HW = { open: null, pending: 0, buys: [] }; // open: the last hwOn() seen by the tick; pending: letter timers still to run (tests wait on 0); buys: the last pop-up buy acts (tests)

/* ---- the gate ---- */
// under the test harness the pop-up only opens when a suite asks (prefs.hwTest): the real date is inside the 2026 window, and older suites
// with the festival on must keep seeing exactly the v2.5 Square (its buttons, its chooser)
const hwAllowed = () => !navigator.webdriver || !!prefs.hwTest;
function hwOn() { return !!S && hwShopOpen() && hwAllowed(); }
function hwFields() { if (S && (!S.hw || typeof S.hw !== 'object')) S.hw = { letter: null, seen: null }; }
const hwHere = () => cur.mode === 'yard' && !!S && S.place === 'square' && !!$('#view svg.world');

/* ---- art with doodle fallbacks (used until the HW ART lane's props, icons and items are merged) ---- */
const HW_O = '#E8893A', HW_OD = '#B5542F', HW_CR = '#FFFBF3', HW_W = '#C08A5A', HW_G = '#6B8A3A';
function hwPumpkin(x, y, r, lit) { return `<g transform="translate(${x} ${y})"><ellipse rx="${r}" ry="${f1(r * 0.78)}" fill="${HW_O}" stroke="${INKG}" stroke-width="2.2"/><path d="M${f1(-r * 0.4)} ${f1(-r * 0.7)} Q${f1(-r * 0.55)} 0 ${f1(-r * 0.4)} ${f1(r * 0.7)} M${f1(r * 0.4)} ${f1(-r * 0.7)} Q${f1(r * 0.55)} 0 ${f1(r * 0.4)} ${f1(r * 0.7)}" fill="none" stroke="${HW_OD}" stroke-width="1.4"/><path d="M0 ${f1(-r * 0.75)} q-1 -6 4 -9" fill="none" stroke="${HW_G}" stroke-width="3" stroke-linecap="round"/>${lit ? `<g fill="#FFE27A" stroke="${INKG}" stroke-width="1"><path d="M${f1(-r * 0.45)} -2 l${f1(r * 0.2)} ${f1(-r * 0.25)} l${f1(r * 0.2)} ${f1(r * 0.25)}Z M${f1(r * 0.05)} -2 l${f1(r * 0.2)} ${f1(-r * 0.25)} l${f1(r * 0.2)} ${f1(r * 0.25)}Z"/><path d="M${f1(-r * 0.4)} ${f1(r * 0.2)} q${f1(r * 0.4)} ${f1(r * 0.35)} ${f1(r * 0.8)} 0Z"/></g>` : ''}</g>`; }
const HW_FB = {
  // a wooden pumpkin cart on two wheels under an orange-and-cream awning: plum-purple trim and wheels, so it never reads as Baker Bea's stall
  popup: (o) => {
    const lit = !!(o && o.lit), stripes = [0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${30 + i * 26} 58 h26 v20 q-13 9 -26 0 Z" fill="${i % 2 ? HW_CR : HW_O}" stroke="${INKG}" stroke-width="2"/>`).join('');
    const bats = [52, 120, 188].map((x, i) => `<path transform="translate(${x} ${92 + (i % 2) * 6})" d="M0 0 q-6 -6 -14 -3 q4 3 3 7 q5 -3 11 1 q6 -4 11 -1 q-1 -4 3 -7 q-8 -3 -14 3Z" fill="#3E3A38" stroke="${INKG}" stroke-width="1.2"/>`).join('');
    return `<svg viewBox="0 0 240 220" xmlns="http://www.w3.org/2000/svg">${lit ? '<ellipse cx="120" cy="150" rx="104" ry="54" fill="#F9D56E" opacity=".3"/>' : ''}
      <path d="M40 78 V150 M200 78 V150" stroke="${HW_W}" stroke-width="7" stroke-linecap="round"/><path d="M22 60 Q120 26 218 60 Z" fill="#8E6BA8" stroke="${INKG}" stroke-width="2.6" stroke-linejoin="round"/>${stripes}${bats}
      <g transform="translate(206 40) rotate(8)"><path d="M0 0 V-24" stroke="${INKG}" stroke-width="2"/><path d="M0 -24 l22 6 l-22 6Z" fill="${HW_O}" stroke="${INKG}" stroke-width="1.6"/><text x="7" y="-15" font-family="Caveat,cursive" font-weight="700" font-size="9" fill="${INKG}">2026</text></g>
      <rect x="28" y="140" width="184" height="46" rx="5" fill="#D9A877" stroke="${INKG}" stroke-width="2.6"/><path d="M36 156 h168 M36 172 h168" stroke="#B88A5E" stroke-width="2"/>
      <rect x="150" y="150" width="56" height="30" rx="4" fill="#E9D27A" stroke="${INKG}" stroke-width="2"/><path d="M154 158 h48 M154 166 h48 M154 174 h48" stroke="#C2A54A" stroke-width="1.6"/>
      ${hwPumpkin(70, 126, 22, lit)}${hwPumpkin(112, 128, 17, lit)}${hwPumpkin(92, 108, 13, false)}${hwPumpkin(176, 134, 14, false)}
      <g fill="#8E6BA8" stroke="${INKG}" stroke-width="2.4"><circle cx="66" cy="196" r="16"/><circle cx="174" cy="196" r="16"/></g><g fill="${HW_CR}"><circle cx="66" cy="196" r="4"/><circle cx="174" cy="196" r="4"/></g>
      <g transform="translate(120 46) rotate(-2)"><rect x="-62" y="-14" width="124" height="24" rx="5" fill="#3E3A38" stroke="${INKG}" stroke-width="2"/><text y="4" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="15" fill="${HW_CR}">Pumpkin Patch Pop-up</text></g></svg>`;
  },
  icon: () => `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">${hwPumpkin(28, 38, 20, false)}<g transform="translate(48 22) rotate(18)"><path d="M-8 -6 h12 l6 6 l-6 6 h-12Z" fill="${HW_CR}" stroke="${INKG}" stroke-width="2"/><circle cx="4" cy="0" r="1.8" fill="${INKG}"/></g><path d="M40 20 q-8 4 -10 10" fill="none" stroke="${INKG}" stroke-width="1.4"/></svg>`
};
// item doodles: one simple crayon shape per item, so the sheet, the trays and the Wardrobe never show "?" before the real icons arrive
const HW_ITEM_FB = {
  'Pumpkin Pupcake': () => `<path d="M28 58 h44 l-6 26 h-32Z" fill="#F3D9A8" stroke="${INKG}" stroke-width="3"/><path d="M26 58 q4 -22 24 -22 q20 0 24 22Z" fill="${HW_O}" stroke="${INKG}" stroke-width="3"/><path d="M36 48 q14 -10 28 0" fill="none" stroke="${HW_CR}" stroke-width="4" stroke-linecap="round"/>`,
  'Apple Monster Biscuits': () => `<circle cx="50" cy="56" r="26" fill="#E2B57A" stroke="${INKG}" stroke-width="3"/><circle cx="40" cy="50" r="7" fill="#F4F0E0" stroke="${INKG}" stroke-width="2"/><circle cx="60" cy="50" r="7" fill="#F4F0E0" stroke="${INKG}" stroke-width="2"/><circle cx="41" cy="51" r="3" fill="${INKG}"/><circle cx="59" cy="49" r="3" fill="${INKG}"/><path d="M40 66 q10 6 20 0" fill="none" stroke="${INKG}" stroke-width="2.4"/>`,
  'Sweet Potato Bones': () => `<path d="M24 44 a8 8 0 1 1 10 -8 h32 a8 8 0 1 1 10 8 a8 8 0 1 1 -10 8 h-32 a8 8 0 1 1 -10 -8Z" fill="#D9824A" stroke="${INKG}" stroke-width="3" transform="translate(0 14)"/>`,
  'Frozen Yoghurt Ghosts': () => `<path d="M32 78 V48 a18 18 0 0 1 36 0 V78 l-6 -6 l-6 6 l-6 -6 l-6 6 l-6 -6Z" fill="#F4FBFF" stroke="${INKG}" stroke-width="3" stroke-linejoin="round"/><circle cx="44" cy="50" r="3" fill="${INKG}"/><circle cx="56" cy="50" r="3" fill="${INKG}"/><path d="M45 60 q5 4 10 0" fill="none" stroke="${INKG}" stroke-width="2"/>`,
  'Squeaky Pumpkin': () => hwPumpkin(50, 56, 28, false),
  'Plush Ghost': () => `<path d="M30 80 Q26 36 50 28 Q74 36 70 80 Q62 72 56 80 Q50 72 44 80 Q38 72 30 80Z" fill="${HW_CR}" stroke="${INKG}" stroke-width="3" stroke-linejoin="round"/><path d="M30 54 q-10 4 -12 12 M70 54 q10 4 12 12" fill="none" stroke="${INKG}" stroke-width="3" stroke-linecap="round"/><circle cx="44" cy="46" r="3" fill="${INKG}"/><circle cx="56" cy="46" r="3" fill="${INKG}"/>`,
  'Bat-Wing Flyer': () => `<ellipse cx="50" cy="58" rx="12" ry="10" fill="${HW_O}" stroke="${INKG}" stroke-width="3"/><path d="M38 56 q-12 -14 -28 -6 q8 4 6 12 q10 -6 22 0Z M62 56 q12 -14 28 -6 q-8 4 -6 12 q-10 -6 -22 0Z" fill="#3E3A38" stroke="${INKG}" stroke-width="2.4" stroke-linejoin="round"/>`,
  'Trick-or-Treat Bucket': () => `<path d="M24 40 q26 -26 52 0" fill="none" stroke="${INKG}" stroke-width="3"/><path d="M26 42 h48 l-5 38 h-38Z" fill="${HW_O}" stroke="${INKG}" stroke-width="3" stroke-linejoin="round"/><g fill="${INKG}"><path d="M38 54 l4 -6 l4 6Z M54 54 l4 -6 l4 6Z"/><path d="M38 64 q12 8 24 0 l-4 3 l-4 -3 l-4 4 l-4 -4 l-4 3Z"/></g>`,
  'Witch Hat': () => `<ellipse cx="50" cy="74" rx="36" ry="9" fill="#3E3A38" stroke="${INKG}" stroke-width="3"/><path d="M34 72 L52 22 Q60 14 70 24 Q60 22 58 30 L66 72Z" fill="#3E3A38" stroke="${INKG}" stroke-width="3" stroke-linejoin="round"/><path d="M36 64 h30 v8 h-30Z" fill="${HW_O}" stroke="${INKG}" stroke-width="2"/>`,
  'Vampire Cape': () => `<path d="M30 28 L22 18 L40 26 L50 22 L60 26 L78 18 L70 28 L80 80 Q72 74 65 80 Q58 74 50 80 Q42 74 35 80 Q28 74 20 80Z" fill="#2E2A2E" stroke="${INKG}" stroke-width="3" stroke-linejoin="round"/><path d="M40 30 L50 76 L60 30" fill="#C0392B" stroke="${INKG}" stroke-width="2"/>`,
  'Candy Corn Bandana': () => `<path d="M18 30 h64 L50 84Z" fill="${HW_CR}" stroke="${INKG}" stroke-width="3" stroke-linejoin="round"/><path d="M18 30 h64 l-10 16 h-44Z" fill="#F2C14E"/><path d="M28 46 h44 l-9 15 h-26Z" fill="${HW_O}"/><path d="M18 30 h64 L50 84Z" fill="none" stroke="${INKG}" stroke-width="3" stroke-linejoin="round"/>`,
  'Bat Wings': () => `<path d="M48 50 q-16 -26 -38 -18 q8 6 6 14 q10 -4 14 4 q8 -4 18 0Z M52 50 q16 -26 38 -18 q-8 6 -6 14 q-10 -4 -14 4 q-8 -4 -18 0Z" fill="#3E3A38" stroke="${INKG}" stroke-width="2.6" stroke-linejoin="round"/><path d="M30 40 q6 -4 12 2 M70 40 q-6 -4 -12 2" fill="none" stroke="#9A9A9A" stroke-width="2"/><path d="M44 52 h12 v8 h-12Z" fill="${HW_O}" stroke="${INKG}" stroke-width="2"/>`,
  'Jack-o-Lantern Trio': () => hwPumpkin(32, 64, 18, true) + hwPumpkin(68, 66, 16, true) + hwPumpkin(50, 46, 14, true),
  'Paper Bat Bunting': () => `<path d="M10 30 Q50 52 90 30" fill="none" stroke="${INKG}" stroke-width="2.4"/>${[24, 50, 76].map((x, i) => `<path transform="translate(${x} ${40 + (i === 1 ? 6 : 0)})" d="M0 0 q-6 -6 -14 -3 q4 3 3 7 q5 -3 11 1 q6 -4 11 -1 q-1 -4 3 -7 q-8 -3 -14 3Z" fill="#3E3A38" stroke="${INKG}" stroke-width="1.6"/>`).join('')}`,
  'Friendly Scarecrow': () => `<path d="M50 40 V90 M24 52 H76" stroke="${HW_W}" stroke-width="5" stroke-linecap="round"/><path d="M36 50 h28 l4 26 h-36Z" fill="#7FA6C9" stroke="${INKG}" stroke-width="2.4"/>${hwPumpkin(50, 30, 15, false)}<path d="M44 30 q6 5 12 0" fill="none" stroke="${INKG}" stroke-width="2"/>`,
  'Ghost Garland': () => `<path d="M8 28 Q50 46 92 28" fill="none" stroke="${INKG}" stroke-width="2.2"/>${[26, 50, 74].map((x) => `<path transform="translate(${x} 36)" d="M-9 26 V6 a9 9 0 0 1 18 0 V26 l-4 -4 l-5 4 l-5 -4Z" fill="${HW_CR}" stroke="${INKG}" stroke-width="2"/><circle cx="${x - 3}" cy="42" r="1.6" fill="${INKG}"/><circle cx="${x + 3}" cy="42" r="1.6" fill="${INKG}"/>`).join('')}`
};
function hwArt(o) { return artReal('prop', 'popup', o || {}) || HW_FB.popup(o || {}); }
function hwIcon() { return artReal('icon', 'popup') || HW_FB.icon(); }
function hwItemArt(n) { return artReal('item', n) || (HW_ITEM_FB[n] ? `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${HW_ITEM_FB[n]()}</svg>` : itemArt(n)); }

/* ---- where the pop-up stands ---- */
function hwPopBox() {
  if (!isPhone()) return HW_POP.desk;
  const [c0, c1] = fsCrop(), dog = [DX + 30, DY + 40, DW - 60, DH - 40], vis = fsVisitorBox(), stall = fsAnyOn() ? fsStallBox() : null;
  const ok = (b) => b[0] >= c0 && b[0] + b[2] <= c1 && !fsOver(b, dog) && !fsOver(b, vis) && !fsOver(b, stall) && !fsOver(b, HW_BOWL);
  return HW_POP.phone.concat([[c0 + 6, 512, 88, 80]]).find(ok) || HW_POP.phone.find((b) => b[0] >= c0 && b[0] + b[2] <= c1 && !fsOver(b, dog) && !fsOver(b, vis) && !fsOver(b, stall)) || HW_POP.desk;
}

/* ---- the Square: the pop-up and its place button (fsSquareDraw calls this after it draws the stall and its buttons) ---- */
function hwSquareDraw() {
  const svg = $('#view svg.world'); if (!svg) return;
  const old = $('#hwPopG', svg); if (old) old.remove();
  const pb = $('#placeBtns'); if (pb) pb.querySelectorAll('[data-hw]').forEach((b) => b.remove());
  HW.open = hwOn(); if (!HW.open || !S || S.place !== 'square') return;
  const pack = $('#pack', svg); if (!pack) return;
  const [x, y, w, h] = hwPopBox(), lit = isNight();
  pack.insertAdjacentHTML('beforebegin', `<g id="hwPopG" class="hot" data-lit="${lit ? 1 : 0}" tabindex="0" role="button" aria-label="Mrs. Plum's Pumpkin Patch Pop-up">${place(hwArt({ lit }), x, y, w, h)}${fsHit(x + 6, y + 8, w - 12, h - 8)}</g>`);
  if (typeof fsHitFit === 'function') fsHitFit();
  const g = $('#hwPopG', svg); g.onclick = (e) => { e.stopPropagation(); SFX.click(); hwOpen(); }; g.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hwOpen(); } };
  if (pb && !isPhone()) { // phones: the third row of the Festival chooser instead, so the Square row stays one line
    const home = pb.querySelector('[data-pb="yard"]'), btn = '<button class="btn yes" data-hw="popup" aria-label="Pumpkin Patch Pop-up">Pumpkin Patch</button>';
    if (home) home.insertAdjacentHTML('beforebegin', btn); else pb.insertAdjacentHTML('beforeend', btn);
    const b = pb.querySelector('[data-hw]'); if (b) b.onclick = () => { SFX.click(); hwOpen(); };
  }
}

/* ---- the pop-up sheet ---- */
function hwItems() {
  const ed = (x) => x.ed === HW_ED;
  return Object.keys(HM_DECOR).filter((n) => ed(HM_DECOR[n])).map((n) => ({ cat: 'decor', n, price: HM_DECOR[n].price, desc: HM_DECOR[n].story }))
    .concat(FOOD.filter(ed).map((f) => ({ cat: 'food', n: f.n, price: f.price, desc: f.note, tip: f.tip })))
    .concat(TOYS.filter(ed).map((t) => ({ cat: 'toys', n: t.n, price: t.price, desc: t.note })))
    .concat(CLOTHES.filter(ed).map((c) => ({ cat: 'clothes', n: c.n, price: c.price, desc: `${SLOT_NAME[c.slot]}. ${c.perk}` })));
}
function hwOwned(it) { return it.cat === 'decor' ? !!(S.decor && S.decor[it.n]) : it.cat === 'food' ? false : owns(it.cat, it.n); }
function hwClosed() { if (hwOn()) return false; if (!modal.hidden && $('#modal .panel.hw-pop')) closeModal(); toast('The pop-up has packed up. Thank you for visiting.'); return true; }
function hwOpen() { return fsTry(hwOpen0); }
function hwOpen0() {
  if (!S) return null;
  if (!hwOn()) { toast('The Pumpkin Patch Pop-up has packed up for good. The things from it are still yours.'); return null; }
  const op = !modal.hidden && $('#modal .panel.hw-pop'), keep = op ? [op.scrollTop, ($('.panel-body', op) || {}).scrollTop || 0] : null; // a re-open after a buy keeps the scroll
  hwFields(); if (!S.hw.seen) { S.hw.seen = localISO(); markDirty(); }
  SFX.boop(560); if (typeof audioPlace === 'function') audioPlace('shop');
  const items = hwItems();
  const card = (it) => {
    const owned = hwOwned(it), have = it.cat === 'food' ? (S.inv.food[it.n] || 0) : 0;
    const act = owned ? '<span class="chip own">Owned</span>' : `<button class="btn yes" data-hwbuy="${esc(it.n)}">${it.cat === 'food' ? 'Buy…' : 'Buy'}</button>`;
    return `<div class="sitem hw-card" data-cat="${it.cat}"><span class="art">${hwItemArt(it.n)}</span><b>${esc(it.n)}${hwTag(it.n)}</b><span class="desc">${esc(it.desc)}</span>${it.tip ? `<span class="small sh-tip">${esc(it.tip)}</span>` : ''}${priceHTML(it.price + (it.cat === 'food' ? ' each' : ''))}${have ? `<span class="small">You have ${have}</span>` : ''}${act}</div>`;
  };
  const secs = HW_CATS.map(([k, l]) => `<section class="hw-sec" data-sec="${k}"><h3>${l}</h3><div class="shopgrid">${items.filter((it) => it.cat === k).map(card).join('')}</div></section>`).join('');
  const p = openModal('Pumpkin Patch Pop-up', `<div class="hw-plum"><span class="hw-ic" aria-hidden="true">${hwIcon()}</span><p><b>Mrs. Plum:</b> "${HW_PLUM}"</p></div><p class="small">Coins only, no Bond needed. You have ${fmtC(S.coins)} Paw Coins.</p>${secs}`,
    { cls: 'shop hw-pop', foot: `<p class="small hw-foot">Open until ${HW_END}.</p>` });
  if (keep) { p.scrollTop = keep[0]; const bd = $('.panel-body', p); if (bd) bd.scrollTop = keep[1]; }
  p.querySelectorAll('[data-hwbuy]').forEach((b) => { b.onclick = () => fsTry(hwBuy, p, items.find((x) => x.n === b.dataset.hwbuy)); });
  hwWatch();
  return p;
}
async function hwBuy(p, it) {
  if (!it || hwClosed()) return; SFX.click();
  const stack = it.cat === 'food', owned = hwOwned(it);
  const q = await buyWindow(p, { art: hwItemArt(it.n), name: it.n, desc: it.desc, price: it.price, stack, owned, have: stack ? (S.inv.food[it.n] || 0) : owned ? 1 : 0, haveLabel: stack ? 'In bag' : 'Owned' });
  if (!q || hwClosed() || (!stack && hwOwned(it))) return;
  const cost = it.price * q; if (S.coins < cost) { nope('Not enough coins. Walks pay well, and Mrs. Plum will hold the door.'); return; }
  S.coins -= cost; SFX.kaching(); trackAct('buy', { name: it.n, cat: it.cat, qty: q, shop: 'popup' });
  if (it.cat === 'food') S.inv.food[it.n] = (S.inv.food[it.n] || 0) + q;
  else if (it.cat === 'decor') { hmDecorFields(); S.decor[it.n] = { got: localISO(), out: true }; }
  else S.inv[it.cat].push(it.n);
  markDirty(); updateHUD();
  const tail = { food: PICK(['Mrs. Plum wraps it in orange paper.', 'It smells of pumpkin and oats.']), toys: 'In the Play tray.', clothes: 'Mrs. Plum says it suits you.', decor: 'It is up in the yard.' }[it.cat];
  toast(`Bought ${q > 1 ? q + ' × ' : ''}${it.n}. ${tail}`, 'gold');
  if (it.cat === 'decor') emit('decor:new', { name: it.n });
  hwOpen();
  if (it.cat === 'clothes') { const pp = $('.panel', modal); const w = await confirmIn(pp, `Put the ${esc(it.n)} on ${esc(NAME())} now?`, 'Wear it', 'Later'); if (w) equip(it.n, true); if (!modal.hidden && hwOn()) hwOpen(); }
}
// the event can end with the sheet open (midnight JST on 2 November): it closes kindly
let hwWatchT = 0;
function hwWatch() { clearInterval(hwWatchT); hwWatchT = setInterval(() => { if (modal.hidden || !$('#modal .panel.hw-pop')) { clearInterval(hwWatchT); return; } if (!hwOn()) { clearInterval(hwWatchT); hwClosed(); } }, 5000); }

/* ---- the letter (once) and the Journal line ---- */
function hwLetter() {
  if (!S || !hwOn() || typeof mailPush !== 'function') return; hwFields();
  if (S.hw.letter === String(HW_ED)) return;
  S.hw.letter = String(HW_ED); markDirty(); mailPush(Object.assign({ kind: 'news', id: 'hw_popup_' + HW_ED }, HW_LETTER));
}
function hwJournalLine() {
  if (!hwOn()) return '';
  return `<p class="fs-jline hw-jline"><span class="ic" aria-hidden="true">${hwIcon()}</span><b>Pop-up:</b> Pumpkin Patch Pop-up in the Square until ${HW_END}.</p>`;
}

/* ---- the event ending (or a Dev panel change): the Square drops the pop-up and its button, an open sheet closes kindly ---- */
function hwTick() {
  if (!S) return; const on = hwOn(); if (on === HW.open) return; HW.open = on;
  if (hwHere() && !(typeof fsActive === 'function' && fsActive())) { if (typeof fsSquareDraw === 'function') fsSquareDraw(); else hwSquareDraw(); }
  if (!on && !modal.hidden && $('#modal .panel.hw-pop')) hwClosed();
}

/* ---- bus ---- */
on('game:ready', () => { hwFields(); HW.open = hwOn(); setTimeout(hwExpose, 0); setInterval(hwTick, 20000); });
on('yard:enter', () => { hwFields(); hwExpose(); HW.pending++; setTimeout(() => { HW.pending--; if (cur.mode === 'yard') hwLetter(); }, 1500); });
on('act', (a) => { if (a && a.kind === 'buy' && a.shop === 'popup') { HW.buys.push(a); if (HW.buys.length > 20) HW.buys.shift(); } });
on('env:fest', () => { hwTick(); if (cur.mode === 'yard') setTimeout(hwLetter, 600); });

/* ---- tests: window.__paw.hw ---- */
function hwExpose() {
  if (!window.__paw) return;
  window.__paw.hw = {
    open: () => hwOpen(), items: () => hwItems().map((x) => x.n), on: () => hwOn(), spot: () => ({ desk: HW_POP.desk, phone: HW_POP.phone, decor: Object.fromEntries(Object.keys(HM_DECOR).filter((n) => HM_DECOR[n].ed).map((n) => [n, HM_DECOR[n].at])) }),
    popupBox: () => hwPopBox(), letter: () => hwLetter(), journal: () => hwJournalLine(), tick: () => hwTick(), tag: (n) => hwTag(n), get pending() { return HW.pending; }, get buys() { return HW.buys.slice(); },
    allow: (v) => { prefs.hwTest = !!v; hwTick(); } // the harness gate (hwAllowed) for suites that cannot pass prefs.hwTest at load (the occlusion hooks)
  };
}
