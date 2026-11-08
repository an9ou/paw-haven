/* ======================= v2.24 KIND SHOP (V224.md; owner's decisions: docs/design/kind-shop.md) =======================
   "We sell coins and looks, never dogs, Bond, welfare or chances. No loot boxes or random paid rewards, and the game is complete without paying."
   Part 1 + the game half of part 4: the gate, the items, the save, the shop sheet and its confirm sheet, granting, the Supporter perks and the
   comfort tools. No payments here yet: ksCheckout(id) and ksRestore() are the two functions the Worker part (/shop/*, Stripe Checkout) replaces.
   Gate: SHOP_LIVE (off until the owner's launch date). With it off players see nothing new: no button, no sheet, no Feet row, and the new items
   are sold nowhere else either (every one carries ks + reward: true, so the Boutique, Barkitecture, the stalls, the markets, the level and Bond lists
   and the journeys skip them). The test copy / dev override: window.__ddShopTest or prefs.shopTest (like __ddFrTest / prefs.frTest).
   Save (additive, v stays 1; v224Fields from migrate() and freshState()):
     S.shop.owned    ids of one-time things owned through a purchase or a coin buy: 'supporter', 'tokyo', 'cozy', 'robo', 'sprinkler', 'bowl', 'comfort'
     S.shop.claimed  purchase ids (Stripe Checkout session ids) granted in this save, so a second poll or a synced save never grants twice
     S.shop.refunded purchase ids whose refund was handled (taken back once)
     S.shop.coin     what was bought with coins (item names and tool ids): a refund never takes these back
     S.shop.tools    { robo, sprinkler, bowl }: the Settings switches (on by default)
     S.shop.roboAt   gameMin of the Robo Scoop's last tidy; S.shop.g2 { ym, days } the Supporter's second calendar gift; S.shop.prevHouse
     every dog's outfit.feet (null): the feet slot (V224.md 2)
   Test hook: window.__paw.ks. */
const SHOP_LIVE = false; // the Game Manager turns this on at the v2.24 release (owner's launch date)
const KS_FR_FF = false; // the friend yard snapshot's ff field (the badge on a visited yard): on once the Worker's frYard takes it (cloudflare/worker.js dcKeys)
function ksOn() { return SHOP_LIVE || (typeof window !== 'undefined' && !!window.__ddShopTest) || !!(typeof prefs !== 'undefined' && prefs && prefs.shopTest); }

/* ---------------- the catalogue (V224.md 1). Prices are shown in USD; Stripe shows the local currency at checkout ---------------- */
const KS_TOKYO = ['Sukajan Jacket', 'Bucket Hat', 'Little Sneakers', 'Paw Tote', 'Round Shades', 'Lucky Cat Charm'];
const KS_COZY_DECOR = ['Cable-Knit Rug', 'Cocoa Mug Lamp', 'Doggy Snow Globe', 'Cardboard Fireplace', 'Woolly Armchair'];
const KS_COZY_BED = 'Tea-Cosy Bed', KS_HOUSE = 'Golden Paw Cottage', KS_TAG = 'Golden Name Tag';
const KS_COZY = KS_COZY_DECOR.concat([KS_COZY_BED]);
const KS_LOOK_COINS = 600, KS_SUP_COINS = 2000, KS_WALK_K = 0.2, KS_GROW_MUL = 1.25; // grow time x0.8
const KS_TOOLS = ['robo', 'sprinkler', 'bowl'];
const KS_ITEMS = {
  supporter: { usd: '4.99', tab: 'supporter' },
  tokyo: { usd: '2.99', tab: 'looks', looks: KS_TOKYO },
  cozy: { usd: '2.99', tab: 'looks', looks: KS_COZY },
  robo: { usd: '1.99', tab: 'tools', coins: 4000, prop: 'Robo Scoop' },
  sprinkler: { usd: '0.99', tab: 'tools', coins: 2500, prop: 'Garden Sprinkler' },
  bowl: { usd: '0.99', tab: 'tools', coins: 2500, prop: 'Auto Water Bowl' },
  comfort: { usd: '2.99', tab: 'tools', tools: KS_TOOLS },
  coins_1k: { usd: '0.99', tab: 'coins', pack: 1000 },
  coins_3k: { usd: '1.99', tab: 'coins', pack: 3000 },
  coins_8k: { usd: '4.99', tab: 'coins', pack: 8000 }
};
const KS_TABS = ['supporter', 'looks', 'tools', 'coins'];
const ksUSD = (id) => tt('ks.usd', 'US${p}', { p: KS_ITEMS[id].usd });

/* ---------------- save ---------------- */
function v224Fields(s) {
  if (!s) return s;
  (Array.isArray(s.dogs) ? s.dogs : []).forEach((d) => { if (d && d.outfit && typeof d.outfit === 'object' && !('feet' in d.outfit)) d.outfit.feet = null; });
  if (!s.shop || typeof s.shop !== 'object' || Array.isArray(s.shop)) s.shop = {};
  const sh = s.shop;
  ['owned', 'claimed', 'refunded', 'coin'].forEach((k) => { if (!Array.isArray(sh[k])) sh[k] = []; });
  if (!sh.tools || typeof sh.tools !== 'object' || Array.isArray(sh.tools)) sh.tools = {};
  KS_TOOLS.forEach((k) => { if (typeof sh.tools[k] !== 'boolean') sh.tools[k] = true; });
  if (typeof sh.roboAt !== 'number' || !isFinite(sh.roboAt)) sh.roboAt = -1e9;
  if (!sh.g2 || typeof sh.g2 !== 'object') sh.g2 = { ym: '', days: [] }; if (!Array.isArray(sh.g2.days)) sh.g2.days = [];
  if (sh.prevHouse === undefined) sh.prevHouse = null;
  return s;
}
const ksS = () => (S ? (S.shop && Array.isArray(S.shop.owned) ? S.shop : v224Fields(S).shop) : null);
const ksHas = (id) => { const sh = ksS(); return !!sh && sh.owned.includes(id); };
// the perks read the owned list, so a refund ends them (V224.md 5)
function ksSup() { return ksHas('supporter'); }
function ksTool(t) { const sh = ksS(); return !!sh && (sh.owned.includes(t) || sh.owned.includes('comfort') || sh.coin.includes(t)); }
function ksToolOn(t) { const sh = ksS(); return ksTool(t) && sh.tools[t] !== false; }
const ksAllTools = () => KS_TOOLS.every(ksTool);
// a look owned (any way: the pack, a coin buy, or already in the save)
function ksLookOwned(n) {
  if (!S) return false;
  if (n === KS_COZY_BED) return Array.isArray(S.beds) && S.beds.includes(n);
  if (HM_DECOR[n]) return !!(S.decor && S.decor[n]);
  if (HOUSES.some((h) => h.n === n)) return owns('houses', n);
  return owns('clothes', n);
}
const ksPackOwned = (id) => ksHas(id) || (KS_ITEMS[id] && KS_ITEMS[id].looks ? KS_ITEMS[id].looks.every(ksLookOwned) : false);
const ksOwnedId = (id) => (KS_ITEMS[id] && KS_ITEMS[id].pack ? false : id === 'comfort' ? ksAllTools() : KS_TOOLS.includes(id) ? ksTool(id) : ksPackOwned(id));
// the Feet row in the Wardrobe: with the kind shop on, or once shoes are owned
function ksFeetRow() { return ksOn() || (!!S && ALL_WEAR.some((c) => c.slot === 'feet' && owns('clothes', c.n))); }
function ksHouseMove(n) { const sh = ksS(); if (sh && n === KS_HOUSE && S.house !== KS_HOUSE) { sh.prevHouse = S.house; markDirty(); } }

/* ---------------- giving and taking back ---------------- */
function ksGiveLook(n) {
  if (ksLookOwned(n)) return false;
  if (n === KS_COZY_BED) { S.beds.push(n); return true; }
  if (HM_DECOR[n]) { hmDecorFields(); S.decor[n] = { got: localISO(), out: false }; return true; } // it waits in the house until placed
  if (HOUSES.some((h) => h.n === n)) { S.inv.houses.push(n); return true; }
  S.inv.clothes.push(n); return true;
}
function ksLetter() {
  return mailPush({ kind: 'news', id: 'ks_thanks', keep: true, from: tt('ks.letter_from', 'Gerald'), title: tt('ks.letter_title', 'Thank you, Founding Friend'),
    text: tt('ks.letter_text', 'Dear friend,\nThank you for the Supporter Pack. Doodle Doggo is made by one person, and you just helped keep the crayons sharp.\nThe Golden Paw Cottage is yours, and so is the golden name tag. Walks pay a little more, the veggies grow a little faster, and the calendar has a second gift for you every day.\nEverything else in town can still be earned by playing, for everyone. That is a promise.\nWith a happy waddle,\nGerald') });
}
// one purchase's contents, once. Returns the coins it added (raw)
function ksGive(item) {
  const sh = ksS(), I = KS_ITEMS[item]; if (!I) return 0;
  if (I.pack) return addCoins(I.pack, { raw: true });
  let coins = 0;
  if (!sh.owned.includes(item)) sh.owned.push(item);
  if (item === 'supporter') { ksGiveLook(KS_HOUSE); ksGiveLook(KS_TAG); coins = addCoins(KS_SUP_COINS, { raw: true }); ksLetter(); }
  if (I.looks) I.looks.forEach(ksGiveLook);
  return coins;
}
function ksTakeLook(n) {
  const sh = ksS(); if (sh.coin.includes(n)) return; // bought with coins: it stays
  if (n === KS_COZY_BED) {
    S.beds = S.beds.filter((b) => b !== n); if (!S.beds.length) S.beds = ['Old Blanket'];
    if (S.bedAt) delete S.bedAt[n]; if (S.bed === n) S.bed = S.beds[0];
    if (S.bedOf) Object.keys(S.bedOf).forEach((id) => { if (S.bedOf[id] === n) delete S.bedOf[id]; });
    return;
  }
  if (HM_DECOR[n]) { if (S.decor) delete S.decor[n]; if (typeof HO === 'object' && HO.uses) Object.keys(HO.uses).forEach((id) => { if (HO.uses[id] && HO.uses[id].name === n) delete HO.uses[id]; }); return; }
  if (n === KS_HOUSE) {
    S.inv.houses = S.inv.houses.filter((h) => h !== n);
    if (S.house === n) { const pv = sh.prevHouse && owns('houses', sh.prevHouse) ? sh.prevHouse : null; S.house = pv || S.inv.houses.slice().sort((a, b) => (HOUSE_CAP[b] || 1) - (HOUSE_CAP[a] || 1))[0] || 'Cardboard Box'; }
    return;
  }
  S.inv.clothes = S.inv.clothes.filter((c) => c !== n);
  S.dogs.forEach((d) => { if (d.outfit) Object.keys(d.outfit).forEach((k) => { if (d.outfit[k] === n) d.outfit[k] = null; }); }); // worn: back to "Nothing"
}
function ksTakeBack(item) {
  const sh = ksS(), I = KS_ITEMS[item]; if (!I || I.pack) return; // coins are never taken back
  sh.owned = sh.owned.filter((x) => x !== item);
  if (item === 'supporter') { ksTakeLook(KS_HOUSE); ksTakeLook(KS_TAG); }
  if (I.looks) I.looks.forEach(ksTakeLook);
}
/* the future GET /shop/owned result: [{ id, item, refunded }]. Each unclaimed id is granted once and recorded in S.shop.claimed; a refunded id that
   was granted here takes back its one-time items once (unless another live purchase of the same thing is owned), never coins. Pure on its input:
   the same list twice grants nothing more. Returns { granted: [ids], refunded: [ids], coins } */
function ksGrant(purchases) {
  const sh = ksS(), out = { granted: [], refunded: [], coins: 0 }; if (!sh) return out;
  const list = (Array.isArray(purchases) ? purchases : []).filter((p) => p && typeof p.id === 'string' && p.id && KS_ITEMS[p.item]);
  list.forEach((p) => {
    if (p.refunded || sh.claimed.includes(p.id)) return;
    sh.claimed.push(p.id); out.coins += ksGive(p.item); out.granted.push(p.id);
  });
  list.forEach((p) => {
    if (!p.refunded || sh.refunded.includes(p.id)) return;
    sh.refunded.push(p.id);
    if (!sh.claimed.includes(p.id)) return; // refunded before this save ever got it: nothing to take back
    const live = list.some((q) => q.item === p.item && !q.refunded && sh.claimed.includes(q.id));
    if (!live) ksTakeBack(p.item); out.refunded.push(p.id);
  });
  if (out.granted.length || out.refunded.length) { markDirty(); updateHUD(); saveNow(); }
  return out;
}

/* ---------------- the Supporter perks (V224.md 1) ---------------- */
// +20% on one walk's coin pay (walk pay and treasure-pouch coins), after the full/half pay, rounded down, no daily limit. Adds them and returns how many
function ksWalkBonus(pay) { const n = ksSup() ? Math.floor(Math.max(0, +pay || 0) * KS_WALK_K) : 0; if (n > 0) addCoins(n, { raw: true }); return n; }
function ksWalkLine(n) { return n > 0 ? `<p class="small ks-walk">${ksBadgeIcon()}${esc(tt('ks.walk_bonus', '+{n} Supporter', { n: tnum(n) }))}</p>` : ''; }
function ksGrowMul() { return ksSup() ? KS_GROW_MUL : 1; }
function ksGardenCtx() { return { growMul: ksGrowMul(), sprinkler: ksToolOn('sprinkler') }; }
// the second calendar gift: a treat, food or seeds, never coins (FW_DG_COIN_CAP untouched)
const KS_G2 = ['treat', 'seeds', 'kibble', 'treat', 'food', 'seeds'];
function ksGift2(ym, d) {
  const k = KS_G2[(d - 1 + (hashId('ks2' + ym) % KS_G2.length)) % KS_G2.length];
  if (k === 'treat') { const T = typeof FW_DG_TREATS !== 'undefined' ? FW_DG_TREATS : ['Bone-shaped Biscuit']; return { t: 'food', n: T[hashId('ks2|' + ym + '|' + d) % T.length], q: 2 }; }
  if (k === 'seeds') return { t: 'seeds', id: 'peas', q: 2 };
  if (k === 'kibble') return { t: 'food', n: 'Basic Kibble', q: 3 };
  return { t: 'food', n: 'Chicken & Rice Bowl', q: 1 };
}
const ksG2Label = (r) => (r.t === 'seeds' ? tt('fw.rew_food', '{item} x{q}', { item: (typeof cropInfo === 'function' && cropInfo('peas') ? tdata('crops.peas.seeditem', cropInfo('peas').seedItem) : 'Pea Seeds'), q: r.q }) : tt('fw.rew_food', '{item} x{q}', { item: tItem(r.n), q: r.q }));
function ksGift2Can() {
  if (!ksSup() || !S.fw || !S.fw.cal || typeof fwDgToday !== 'function') return false;
  const { ym, d } = fwDgToday(), c = S.fw.cal, g = ksS().g2;
  return c.ym === ym && Array.isArray(c.days) && c.days.includes(d) && !(g.ym === ym && g.days.includes(d));
}
function ksGift2Claim() {
  if (!ksGift2Can()) return false;
  const { ym, d } = fwDgToday(), g = ksS().g2, r = ksGift2(ym, d);
  if (g.ym !== ym) { g.ym = ym; g.days = []; } g.days.push(d);
  if (r.t === 'seeds') { S.inv.seeds = S.inv.seeds || {}; S.inv.seeds[r.id] = (S.inv.seeds[r.id] || 0) + r.q; } else S.inv.food[r.n] = (S.inv.food[r.n] || 0) + r.q;
  markDirty(); updateHUD(); saveNow(); SFX.kaching();
  toast(tt('ks.g2_got', 'Supporter gift: {what}. Thank you!', { what: ksG2Label(r) }), 'gold');
  return true;
}
function ksGift2HTML() {
  if (!ksSup() || typeof fwDgToday !== 'function' || !S.fw || !S.fw.cal) return '';
  const { ym, d } = fwDgToday(), r = ksGift2(ym, d), g = ksS().g2, got = g.ym === ym && g.days.includes(d);
  const ic = r.t === 'seeds' ? art('item', 'Pea Seeds') : art('item', r.n);
  return `<div class="fw-dg ks-dg2${got ? ' got' : ''}"><span class="fw-dgart">${ic}</span><span class="fw-dgt"><b>${esc(tt('ks.g2_title', 'Supporter gift'))}</b><span>${esc(ksG2Label(r))}</span></span>${got ? `<span class="fw-got">${esc(tt('fw.dg_claimed', 'Claimed. A new gift comes tomorrow.'))}</span>` : ksGift2Can() ? `<button class="btn yes fw-claim" type="button" id="ksDg2">${esc(tt('fw.claim', 'Claim'))}</button>` : ''}</div>`;
}

/* ---------------- the comfort tools (V224.md 1): no coins, Bond, scooped count or mission tick from any of them ---------------- */
let ksLastMin = -1;
function ksTick() {
  if (!S || !S.shop) return; const m = Math.floor(S.gameMin); if (m === ksLastMin) return; ksLastMin = m;
  try { ksRoboTick(); ksBowlTick(); } catch (e) { /* a tool never stops the clock */ }
}
// Robo Scoop: one pee or poop in the home yard or the house, once a game hour, never in town. A fresh mess waits 10 game minutes, so a hand scoop comes first
function ksRoboTick() {
  if (!ksToolOn('robo') || !S.messes) return;
  const sh = S.shop, now = S.gameMin; if (now - sh.roboAt < 60) return;
  for (const pl of ['yard', 'house']) {
    let a = S.messes[pl]; if (a && !Array.isArray(a)) a = S.messes[pl] = [a];
    if (!Array.isArray(a) || !a.length) continue;
    const i = a.findIndex((x) => x && now - (+x.at || 0) >= 10); if (i < 0) continue;
    const mx = a[i]; a.splice(i, 1); sh.roboAt = now; markDirty();
    if (S.place === pl && cur.mode === 'yard') {
      const fx = $('#fx'), ic = ksPA('prop', 'Robo Scoop') || doodle('spark', 0, 0, 14);
      if (fx) fx.insertAdjacentHTML('beforeend', `<g class="popfx ks-robofx">${ic.includes('<svg') ? place(ic, mx.x - 32, 470, 64, 64) : `<svg x="${mx.x - 20}" y="480" width="40" height="40" viewBox="-20 -20 40 40" overflow="visible">${ic}</svg>`}</g>`);
      drawMess(); toast(tt('ks.robo_did', '{type, select, poop {Beep boop. The Robo Scoop tidied a poop.} other {Beep boop. The Robo Scoop mopped a puddle.}}', { type: mx.type === 'poop' ? 'poop' : 'pee' }), 'good');
    }
    return;
  }
}
// Auto Water Bowl: Fresh Water refills and the dog drinks by itself when it is ready (every 2 game hours): +5 Happiness, +10 Energy, as by hand, no water tick
function ksBowlTick() {
  if (!ksToolOn('bowl') || cur.mode !== 'yard' || !atHome() || busy || S.sleeping || !modal.hidden || popOpen() || (typeof buyOpen !== 'undefined' && buyOpen)) return;
  if (S.gameMin - S.waterAt < shWaterWait()) return;
  S.waterAt = S.gameMin; addStat('happy', 5); addStat('energy', 10); pottyAfter('water'); markDirty(); updateHUD();
  try { setBowl('Fresh Water'); SFX.slurp(); setTimeout(() => { if (S && cur.mode === 'yard' && !busy && !S.bowl) setBowl(null); }, 2600); } catch (e) { /* no bowl here */ }
  toast(tt('ks.bowl_did', 'The Auto Water Bowl filled up and {name} had a drink. +5 Happiness, +10 Energy.', { name: NAME() }), 'good');
}
// Garden Sprinkler: mods/garden.js waters a dry growing plot back to 3 at the start of an hour (ksGardenCtx); this only says so, gently, once an advance
function ksSprinkle(events) {
  if (!ksToolOn('sprinkler')) return;
  const n = (events || []).filter((e) => e && e.type === 'sprinkler').length; if (!n) return;
  if (cur.mode === 'garden' || (cur.mode === 'yard' && S.place === 'yard')) toast(tt('ks.sprinkler_did', '{n, plural, one {Pssst. The Garden Sprinkler watered a dry plot.} other {Pssst. The Garden Sprinkler watered # dry plots.}}', { n }), 'good');
}
function ksSettingsHTML() {
  if (!S || !S.shop || !KS_TOOLS.some(ksTool)) return '';
  const nm = { robo: tt('ks.robo', 'Robo Scoop'), sprinkler: tt('ks.sprinkler', 'Garden Sprinkler'), bowl: tt('ks.bowl', 'Auto Water Bowl') };
  return `<div class="ks-set"><h4 style="margin:0;font-family:var(--font-hand);font-size:26px">${esc(tt('ks.tools_head', 'Comfort tools'))}</h4>${KS_TOOLS.filter(ksTool).map((k) => `<label class="tog"><input type="checkbox" id="ksT-${k}" ${S.shop.tools[k] !== false ? 'checked' : ''}> ${esc(nm[k])}</label>`).join('<br>')}<p class="small">${esc(tt('ks.tools_note', 'Off, the hand way works as always. Nothing bad happens: a mess or a dry plot just waits.'))}</p></div>`;
}
function ksSettingsBind(p) { KS_TOOLS.forEach((k) => { const c = $('#ksT-' + k, p); if (c) c.onchange = () => { S.shop.tools[k] = !!c.checked; markDirty(); saveNow(); SFX.click(); }; }); }

/* ---------------- art (the art lane's PawArt.SHOP, read defensively: the sheet works before it lands) ---------------- */
function ksPA(fn, n) { try { const P = window.PawArt, f = P && P.SHOP && P.SHOP[fn]; const v = typeof f === 'function' ? f.call(P.SHOP, n) : ''; return typeof v === 'string' && v.includes('<svg') ? v : ''; } catch (e) { return ''; } }
const KS_BADGE_FB = '<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M60 10 L74 40 L106 44 L82 66 L88 98 L60 82 L32 98 L38 66 L14 44 L46 40 Z" fill="#FFD56B" stroke="#5B3D32" stroke-width="5" stroke-linejoin="round"/><circle cx="60" cy="58" r="12" fill="#F7B2C4" stroke="#5B3D32" stroke-width="4"/></svg>';
const ksBadgeIcon = () => `<span class="ks-bic" aria-hidden="true">${ksPA('prop', 'Founding Friend Badge') || KS_BADGE_FB}</span>`;
function ksBadgeHTML() { return `<span class="ks-badge" role="img" aria-label="${esc(tt('ks.badge', 'Founding Friend'))}">${ksBadgeIcon()}<b>${esc(tt('ks.badge', 'Founding Friend'))}</b></span>`; }
function ksIcon(k) { return ksPA('icon', k) || (k === 'coins' || k === 'walkcoins' ? ICON('coin') : k === 'cropsfast' ? art('item', 'Carrot') : art('item', 'Pupcake')); }
function ksToolArt(id) { return ksPA('prop', KS_ITEMS[id].prop) || ICON(id === 'robo' ? 'poop-bag' : id === 'sprinkler' ? 'garden' : 'food'); }
function ksLookArt(n) {
  if (n === KS_COZY_BED) return bedSVG(n) || itemArt(n);
  if (HM_DECOR[n]) { try { return hmDecorArt(n); } catch (e) { return itemArt(n); } }
  const real = artReal('item', n); if (real) return real;
  const c = CLOTHES.find((x) => x.n === n); if (!c || !S) return itemArt(n);
  try { return dogSVG(D(), { pose: 'sit', outfit: { [c.slot]: n }, anim: false }); } catch (e) { return itemArt(n); } // the dog wears it (the renderer draws it once the art lands)
}
function ksArt(id) {
  const I = KS_ITEMS[id];
  if (id === 'supporter') return ksPA('house', KS_HOUSE) || art('house', KS_HOUSE);
  if (I.pack) return ksIcon('coins');
  if (I.prop) return ksToolArt(id);
  if (id === 'comfort') return ksToolArt('robo');
  return ksLookArt(I.looks[0]);
}

/* ---------------- words ---------------- */
function ksName(id) {
  switch (id) {
    case 'supporter': return tt('ks.n_supporter', 'Supporter Pack');
    case 'tokyo': return tt('ks.n_tokyo', 'Tokyo Street');
    case 'cozy': return tt('ks.n_cozy', 'Cozy Winter');
    case 'robo': return tt('ks.robo', 'Robo Scoop');
    case 'sprinkler': return tt('ks.sprinkler', 'Garden Sprinkler');
    case 'bowl': return tt('ks.bowl', 'Auto Water Bowl');
    case 'comfort': return tt('ks.n_comfort', 'Comfort Kit');
    default: return tt('ks.n_coins', '{n} coins', { n: tnum(KS_ITEMS[id].pack) });
  }
}
function ksLine(id) {
  switch (id) {
    case 'supporter': return tt('ks.l_supporter', 'A thank-you pack for helping make the game. Only once, never for coins.');
    case 'tokyo': return tt('ks.l_tokyo', 'Six street outfits, with sneakers for a new Feet slot. Looks only.');
    case 'cozy': return tt('ks.l_cozy', 'Six cosy things for the house, with a tea-cosy bed. Looks only.');
    case 'robo': return tt('ks.l_robo', 'Tidies one pee or poop at home once a game hour. Never in town.');
    case 'sprinkler': return tt('ks.l_sprinkler', 'Waters a dry veggie plot back to full.');
    case 'bowl': return tt('ks.l_bowl', 'Fills the water bowl and your dog drinks when it is ready.');
    case 'comfort': return tt('ks.l_comfort', 'The Robo Scoop, the Garden Sprinkler and the Auto Water Bowl.');
    default: return tt('ks.l_coins', 'Paw Coins for the shops in town. Added once.');
  }
}
// exactly what you get (the confirm sheet and the Supporter card)
function ksGets(id) {
  const I = KS_ITEMS[id];
  if (id === 'supporter') return [tt('ks.g_house', 'The Golden Paw Cottage, a house of your own'), tt('ks.g_tag', 'The Golden Name Tag (neck)'), tt('ks.g_badge', 'A Founding Friend badge on your Dog Card and friend card'), tt('ks.g_letter', "Gerald's thank-you letter, kept in your mailbox"), tt('ks.g_coins', '{n} coins, once', { n: tnum(KS_SUP_COINS) }), tt('ks.g_walk', '+20% coins from walks'), tt('ks.g_crops', 'Crops grow 25% faster'), tt('ks.g_gift', 'A second calendar gift every day (a treat, food or seeds)')];
  if (I.pack) return [tt('ks.g_pack', '{n} Paw Coins, added once', { n: tnum(I.pack) })];
  if (I.looks) return I.looks.map((n) => homeName(n));
  if (I.tools) return I.tools.map(ksName);
  return [ksLine(id), tt('ks.g_switch', 'You can switch it off in Settings.')];
}

/* ---------------- the sheet (V224.md 3) ---------------- */
let ksTab = 'supporter';
function ksMenuBtn() { return ksOn() && S ? `<button class="btn big" id="mmKs" type="button"><span class="ic">${ICON('coin')}</span>${esc(tt('ks.btn', 'Kind shop'))}</button>` : ''; }
const ksYours = () => `<span class="chip own ks-yours">${esc(tt('ks.yours', 'Yours'))}</span>`;
function ksCardHTML(id) {
  const I = KS_ITEMS[id], own = ksOwnedId(id);
  const list = id === 'supporter' || I.looks || I.tools ? `<ul class="ks-gets">${ksGets(id).map((g) => `<li>${esc(g)}</li>`).join('')}</ul>` : '';
  const or = I.looks ? `<span class="small ks-or">${esc(tt('ks.or_each', 'or {n} coins each', { n: tnum(KS_LOOK_COINS) }))}</span>` : '';
  const act = own ? ksYours() : `<button class="btn yes ks-cash" type="button" data-kscash="${id}">${esc(ksUSD(id))}</button>${I.coins ? `<button class="btn ks-coin" type="button" data-kscoin="${id}">${esc(tt('ks.or_coins', 'or {n} coins', { n: tnum(I.coins) }))}</button>` : ''}${or}`;
  return `<div class="sitem ks-card ks-${I.tab}${list ? ' ks-wide' : ''}" data-ks="${id}"><span class="art">${ksArt(id)}</span><b>${esc(ksName(id))}</b><span class="desc">${esc(ksLine(id))}</span>${list}<span class="ks-acts">${act}</span></div>`;
}
function ksLookCardHTML(n) {
  const own = ksLookOwned(n), c = CLOTHES.find((x) => x.n === n);
  const desc = c ? tt('shop.cloth_desc', '{slot}. {perk}', { slot: shSlotName(c.slot), perk: shPerk(c) }) : n === KS_COZY_BED ? tdata('beds.' + tid(n) + '.note', (BEDS.find((b) => b.n === n) || {}).note || '') : tdata('hm_decor.' + tid(n) + '.story', (HM_DECOR[n] || {}).story || '');
  const act = own ? ksYours() : `<button class="btn ks-coin" type="button" data-kslook="${esc(n)}">${esc(tt('ks.or_coins', 'or {n} coins', { n: tnum(KS_LOOK_COINS) }))}</button>`;
  return `<div class="sitem ks-card ks-look" data-kslookcard="${esc(n)}"><span class="art">${ksLookArt(n)}</span><b>${esc(homeName(n))}</b><span class="desc">${esc(desc)}</span><span class="ks-acts">${act}</span></div>`;
}
function ksTabHTML(t) {
  if (t === 'supporter') return ksCardHTML('supporter');
  if (t === 'looks') return ksCardHTML('tokyo') + KS_TOKYO.map(ksLookCardHTML).join('') + ksCardHTML('cozy') + KS_COZY.map(ksLookCardHTML).join('');
  if (t === 'tools') return KS_TOOLS.map(ksCardHTML).join('') + (ksAllTools() ? '' : ksCardHTML('comfort')); // the Comfort Kit is not offered once all three are owned
  return ['coins_1k', 'coins_3k', 'coins_8k'].map(ksCardHTML).join('');
}
function ksTabName(t) { return { supporter: tt('ks.tab_supporter', 'Supporter'), looks: tt('ks.tab_looks', 'Looks'), tools: tt('ks.tab_tools', 'Tools'), coins: tt('ks.tab_coins', 'Coins') }[t]; }
function ksOpen(tab) {
  if (!ksOn() || !S) return null;
  v224Fields(S); if (KS_TABS.includes(tab)) ksTab = tab;
  SFX.boop(620); audioPlace('shop');
  const duck = typeof gdDuck === 'function' ? gdDuck('sit') : '';
  const tabs = `<div class="tabs" role="tablist">${KS_TABS.map((t) => `<button class="btn" role="tab" type="button" aria-selected="${t === ksTab}" data-kstab="${t}">${esc(ksTabName(t))}</button>`).join('')}</div>`;
  const why = `<details class="ks-why"><summary>${esc(tt('ks.why', 'Why is there a shop?'))}</summary><div class="ks-whyb">${duck ? `<span class="ks-duck" aria-hidden="true">${duck}</span>` : ''}<p>${esc(tt('ks.why_text', 'Gerald: "Doodle Doggo is made by one person. The shop helps keep the crayons sharp. Everything here except the Supporter Pack and the coins can also be earned by playing, and the game is complete without paying. Dogs, Bond and chances are never in the shop."'))}</p></div></details>`;
  const body = `<p class="small ks-hi">${esc(tt('ks.hi', 'Looks, comfort tools and coins. You have {coins} Paw Coins.', { coins: tnum(S.coins) }))}</p>${why}${tabs}<div class="shopgrid ks-grid">${ksTabHTML(ksTab)}</div>
    <p class="small ks-ask">${esc(tt('ks.ask', 'Ask a grown-up before you buy. Payments are made on Stripe. We never see card details.'))}</p><p class="ks-links"><button class="btn ks-link" type="button" id="ksRestore">${esc(tt('ks.restore', 'Restore purchases'))}</button></p>`;
  const p = openModal(esc(tt('ks.title', 'Kind shop')), body, { cls: 'shop ks' });
  p.querySelectorAll('[data-kstab]').forEach((b) => { b.onclick = () => { SFX.click(); ksTab = b.dataset.kstab; ksOpen(); }; });
  p.querySelectorAll('[data-kscash]').forEach((b) => { b.onclick = () => { SFX.click(); ksConfirm(p, b.dataset.kscash); }; });
  p.querySelectorAll('[data-kscoin]').forEach((b) => { b.onclick = () => { SFX.click(); ksCoinBuy(p, b.dataset.kscoin); }; });
  p.querySelectorAll('[data-kslook]').forEach((b) => { b.onclick = () => { SFX.click(); ksCoinBuy(p, b.dataset.kslook); }; });
  $('#ksRestore', p).onclick = () => { SFX.click(); ksRestore(); };
  return p;
}
// the confirm sheet for a cash price: the item, exactly what you get, the price, where you pay. Resolves true when Pay was tapped
function ksConfirm(panel, id) {
  return new Promise((res) => {
    const I = KS_ITEMS[id]; if (!I) { res(false); return; }
    const old = panel.querySelector('.buyveil'); if (old) old.remove();
    const have = I.looks ? I.looks.filter(ksLookOwned) : I.tools ? I.tools.filter(ksTool) : [];
    const v = document.createElement('div'); v.className = 'buyveil ks-veil';
    v.innerHTML = `<div class="buybox pop ks-confirm" role="dialog" aria-modal="true" aria-label="${esc(ksName(id))}">
      <div class="bb-top"><span class="bb-art">${ksArt(id)}</span><div><h3>${esc(ksName(id))}</h3><p class="bb-unit ks-price"><b>${esc(ksUSD(id))}</b></p></div></div>
      <p class="small ks-youget"><b>${esc(tt('ks.you_get', 'You get exactly this:'))}</b></p><ul class="ks-gets">${ksGets(id).map((g) => `<li>${esc(g)}</li>`).join('')}</ul>
      ${have.length ? `<p class="small ks-have">${esc(tt('ks.have_some', 'You have these already: {list}. The price stays the same.', { list: tlist(have.map((n) => (KS_TOOLS.includes(n) ? ksName(n) : homeName(n)))) }))}</p>` : ''}
      <p class="small ks-stripe">${esc(tt('ks.stripe', "You'll pay on Stripe's secure page in a new tab."))}</p>
      <div class="foot"><button class="btn no ks-no" type="button">${esc(tt('ks.not_now', 'Not now'))}</button><button class="btn yes big ks-pay" type="button">${esc(tt('ks.pay', 'Pay with Stripe'))}</button></div></div>`;
    panel.appendChild(v); buyOpen = true;
    const done = (val) => { window.removeEventListener('keydown', onKey, true); v.remove(); buyOpen = false; res(val); };
    const onKey = (e) => { if (!v.isConnected) { window.removeEventListener('keydown', onKey, true); buyOpen = false; return; } if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); SFX.click(); done(false); } };
    window.addEventListener('keydown', onKey, true);
    v.addEventListener('click', (e) => { if (e.target === v) { SFX.click(); done(false); } });
    v.querySelector('.ks-no').onclick = () => { SFX.click(); done(false); };
    v.querySelector('.ks-pay').onclick = () => { SFX.click(); done(true); ksCheckout(id); };
    setTimeout(() => { try { v.querySelector('.ks-no').focus({ preventScroll: true }); } catch (e) { /* gone */ } }, 30);
  });
}
/* The Worker part replaces these two: POST /shop/checkout { item } -> open its URL in a new tab; GET /shop/owned -> ksGrant(list) (on start and
   when the tab is shown again). Until then: a kind toast. */
function ksCheckout(id) { toast(tt('ks.soon', 'The shop opens soon. Thank you for looking!'), 'good'); return null; }
function ksRestore() { toast(tt('ks.soon', 'The shop opens soon. Thank you for looking!'), 'good'); return null; }
// a coin buy: a look (600 coins) or a tool (its own price), through the same coin window as every shop. Never the Supporter Pack or coins
async function ksCoinBuy(panel, n) {
  const tool = KS_TOOLS.includes(n), look = KS_TOKYO.includes(n) || KS_COZY.includes(n); if (!tool && !look) return false;
  const price = tool ? KS_ITEMS[n].coins : KS_LOOK_COINS, owned = tool ? ksTool(n) : ksLookOwned(n), nm = tool ? ksName(n) : homeName(n);
  const c = CLOTHES.find((x) => x.n === n);
  const q = await buyWindow(panel, { art: tool ? ksToolArt(n) : ksLookArt(n), name: nm, desc: tool ? ksLine(n) : c ? shPerk(c) : '', price, stack: false, owned, have: owned ? 1 : 0, haveLabel: tt('shop.owned', 'Owned') });
  if (!q) return false;
  if (S.coins < price) { nope(tt('shop.not_enough', 'Not enough coins. Have you tried being rich?')); return false; }
  const sh = ksS();
  S.coins -= price; SFX.kaching(); if (!sh.coin.includes(n)) sh.coin.push(n);
  if (tool) { if (!sh.owned.includes(n)) sh.owned.push(n); } else ksGiveLook(n);
  markDirty(); updateHUD(); saveNow();
  toast(tt('ks.bought', '{item} is yours. Thank you for playing!', { item: nm }), 'gold');
  ksOpen();
  const pp = $('.panel', modal); if (!pp || tool) return true;
  if (HM_DECOR[n]) { const pl = await confirmIn(pp, tt('shop.put_decor', 'Put the {n} in the {room, select, house {house} other {yard}} now?', { n: esc(nm), room: hoRoomOf(n) }), tt('shop.place_it', 'Place it'), tt('shop.later', 'Later')); if (pl) { closeModal(); hoPlaceStart(n); } return true; }
  if (n === KS_COZY_BED) { const ub = await confirmIn(pp, tt('shop.put_bed', 'Put the {n} in the house for {name} now?', { n: esc(nm), name: esc(NAME()) }), tt('shop.use_it', 'Use it'), tt('shop.later', 'Later')); if (ub) useBed(n); ksOpen(); return true; }
  if (c) { const w = await confirmIn(pp, tt('shop.put_on', 'Put the {n} on {name} now?', { n: esc(nm), name: esc(NAME()) }), tt('shop.wear_it', 'Wear it'), tt('shop.later', 'Later')); if (w) equip(n, true); ksOpen(); }
  return true;
}

/* ---------------- test hook ---------------- */
function ksExpose() {
  if (!window.__paw || window.__paw.ks) return;
  window.__paw.ks = {
    on: () => ksOn(), live: SHOP_LIVE, items: KS_ITEMS, tokyo: KS_TOKYO.slice(), cozy: KS_COZY.slice(), LOOK: KS_LOOK_COINS,
    grant: (l) => ksGrant(l), fields: (s) => v224Fields(s), sup: () => ksSup(), tool: (t) => ksTool(t), toolOn: (t) => ksToolOn(t), owned: (id) => ksOwnedId(id), look: (n) => ksLookOwned(n),
    walkBonus: (n) => (ksSup() ? Math.floor(Math.max(0, +n || 0) * KS_WALK_K) : 0), growMul: () => ksGrowMul(), gift2: (ym, d) => ksGift2(ym, d), gift2Claim: () => ksGift2Claim(), gift2Can: () => ksGift2Can(),
    open: (t) => ksOpen(t), confirm: (id) => { const p = $('.panel.ks', modal) || ksOpen(); return p ? (ksConfirm(p, id), true) : false; }, coinBuy: (n) => { const p = $('.panel.ks', modal) || ksOpen(); return p ? ksCoinBuy(p, n) : false; },
    tick: () => { ksLastMin = -1; ksTick(); }, robo: () => ksRoboTick(), bowl: () => ksBowlTick(), gardenCtx: () => ksGardenCtx(), checkout: (id) => ksCheckout(id),
    garden: (h, w) => gardenAdvance({ steps: h || 1, stepWeather: w || 'cloudy' }), rec: () => { KS_REC = []; return true; }, acts: () => (KS_REC || []).slice()
  };
}
let KS_REC = null; // tests: the act kinds seen since rec() (the tools must add none)
on('act', (a) => { if (KS_REC && a && a.kind) KS_REC.push(a.kind); });
on('game:ready', () => { if (S) v224Fields(S); setTimeout(ksExpose, 0); });
on('yard:enter', () => { if (S) v224Fields(S); if (window.__paw && !window.__paw.ks) ksExpose(); });
setTimeout(ksExpose, 0);
