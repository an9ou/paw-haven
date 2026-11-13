/* ======================= v2.24 KIND SHOP (V224.md; owner's decisions: docs/design/kind-shop.md) =======================
   "We sell coins and looks, never dogs, Bond, welfare or chances. No loot boxes or random paid rewards, and the game is complete without paying."
   Part 1 + the game half of part 4: the gate, the items, the save, the shop sheet and its confirm sheet, granting, the Supporter perks and the
   comfort tools. Part 3: ksCheckout(id), ksRestore() and ksPoll() talk to the Worker's /shop/* routes (Stripe Checkout, Managed Payments).
   Gate: SHOP_LIVE (off until the owner's launch date). With it off players see nothing new: no button, no sheet, no Feet row, and the new items
   are sold nowhere else either (every one carries ks + reward: true, so the Boutique, Barkitecture, the stalls, the markets, the level and Bond lists
   and the journeys skip them). The test copy / dev override: window.__ddShopTest or prefs.shopTest (like __ddFrTest / prefs.frTest).
   Save (additive, v stays 1; v224Fields from migrate() and freshState()):
     S.shop.owned    ids of one-time things owned through a purchase or a coin buy: 'supporter', 'tokyo', 'cozy', 'robo', 'sprinkler', 'bowl', 'comfort'
     S.shop.claimed  purchase ids (Stripe Checkout session ids) granted in this save, so a second poll or a synced save never grants twice
     S.shop.refunded purchase ids whose refund was handled (taken back once)
     S.shop.onceBack one-time items a refund took back: not granted again. S.shop.coinGot purchase id -> coins that row added.
     S.shop.coinDebt Paw Coins from a refund that were already spent; later coins pay this before they can be spent
     S.shop.coin     what was bought with coins (item names and tool ids): a refund never takes these back
     S.shop.tools    { robo, sprinkler, bowl }: the Settings switches (on by default)
     S.shop.roboAt   gameMin of the Robo Scoop's last tidy; S.shop.g2 { ym, days } the Supporter's second calendar gift; S.shop.prevHouse
     every dog's outfit.feet (null): the feet slot (V224.md 2)
   Test hook: window.__paw.ks. */
const SHOP_LIVE = true; // live since the v2.24 release, 9 Nov 2026
const KS_FR_FF = true; // v2.24 part 3: the friend yard snapshot sends ff (the Worker takes it and then sets the badge itself from its purchases table, never from this field)
function ksOn() { return SHOP_LIVE || (typeof window !== 'undefined' && !!window.__ddShopTest) || !!(typeof prefs !== 'undefined' && prefs && prefs.shopTest); }

/* ---------------- the catalogue (V224.md 1). Prices are shown in USD; Stripe shows the local currency at checkout ---------------- */
const KS_TOKYO = ['Sukajan Jacket', 'Bucket Hat', 'Little Sneakers', 'Paw Tote', 'Round Shades', 'Lucky Cat Charm'];
const KS_COZY_DECOR = ['Cable-Knit Rug', 'Cocoa Mug Lamp', 'Doggy Snow Globe', 'Cardboard Fireplace', 'Woolly Armchair'];
const KS_COZY_BED = 'Tea-Cosy Bed', KS_HOUSE = 'Golden Paw Cottage', KS_TAG = 'Golden Name Tag';
const KS_COZY = KS_COZY_DECOR.concat([KS_COZY_BED]);
const KS_LOOK_COINS = 1500, KS_SUP_COINS = 2000, KS_WALK_K = 0.2, KS_GROW_MUL = 1.25; // grow time x0.8
const KS_TOOLS = ['robo', 'sprinkler', 'bowl'];
const KS_ITEMS = {
  supporter: { usd: '4.99', tab: 'supporter' },
  tokyo: { usd: '2.99', tab: 'looks', looks: KS_TOKYO },
  cozy: { usd: '2.99', tab: 'looks', looks: KS_COZY },
  robo: { usd: '1.99', tab: 'tools', coins: 10000, prop: 'Robo Scoop' },
  sprinkler: { usd: '0.99', tab: 'tools', coins: 6000, prop: 'Garden Sprinkler' },
  bowl: { usd: '0.99', tab: 'tools', coins: 6000, prop: 'Auto Water Bowl' },
  comfort: { usd: '2.99', tab: 'tools', tools: KS_TOOLS },
  coins_1k: { usd: '0.99', tab: 'coins', pack: 2000, old: 1000 }, // v2.24.2 (owner, 11 Nov): coin prices x2.5, packs about x2; the ids stay (Stripe metadata)
  coins_3k: { usd: '1.99', tab: 'coins', pack: 5000, old: 3000 }, // old: the size of a pack bought before v2.24.2 (KS_PACKS_AT), what a refund of it takes back
  coins_8k: { usd: '4.99', tab: 'coins', pack: 14000, old: 8000 }
};
const KS_PACKS_AT = Date.UTC(2026, 10, 11, 16, 0, 0); // v2.24.2 live everywhere (15:57 UTC, 11 Nov 2026); the Worker's SHOP_PACKS_AT
const KS_TABS = ['supporter', 'looks', 'tools', 'coins'];
const ksUSD = (id) => tt('ks.usd', 'US${p}', { p: KS_ITEMS[id].usd });

/* ---------------- save ---------------- */
function v224Fields(s) {
  if (!s) return s;
  (Array.isArray(s.dogs) ? s.dogs : []).forEach((d) => { if (d && d.outfit && typeof d.outfit === 'object' && !('feet' in d.outfit)) d.outfit.feet = null; });
  if (!s.shop || typeof s.shop !== 'object' || Array.isArray(s.shop)) s.shop = {};
  const sh = s.shop;
  ['owned', 'claimed', 'refunded', 'coin', 'log', 'onceBack'].forEach((k) => { if (!Array.isArray(sh[k])) sh[k] = []; }); // log (v2.24.1): [{ id, item, at, r }] for My purchases. onceBack: one-time items a refund took back; they are not granted again
  if (!sh.coinGot || typeof sh.coinGot !== 'object' || Array.isArray(sh.coinGot)) sh.coinGot = {}; // purchase id -> { n: coins that purchase was for, a: how many landed in S.coins }
  if (typeof sh.coinDebt !== 'number' || !isFinite(sh.coinDebt) || sh.coinDebt < 0) sh.coinDebt = 0; // refunded coins that had already been spent
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
function ksHouseMove(n) {
  const sh = ksS();
  if (sh && n === KS_HOUSE && S.house !== KS_HOUSE) {
    sh.prevHouse = S.house; markDirty();
    if (!sh.camSeen) { sh.camSeen = 1; if (cur.mode === 'yard' && typeof camTo === 'function') setTimeout(() => { try { camTo(740, 0.9); } catch (e) { /* no camera here */ } }, 400); } // the first time: show the new kennel on a phone
  }
}

/* ---------------- giving and taking back ---------------- */
function ksShopReady() {
  const sh = ksS(); if (!sh) return null;
  if (!Array.isArray(sh.onceBack)) sh.onceBack = [];
  if (!sh.coinGot || typeof sh.coinGot !== 'object' || Array.isArray(sh.coinGot)) sh.coinGot = {};
  if (typeof sh.coinDebt !== 'number' || !isFinite(sh.coinDebt) || sh.coinDebt < 0) sh.coinDebt = 0;
  return sh;
}
// the coins one purchase row is for. The Worker sends coins (a pack from before v2.24.2 at its old size, a second Supporter session 0); without
// it, the catalogue, and the old pack size for a row from before KS_PACKS_AT. Never more than the pack is today.
function ksNominal(p) {
  const I = p && KS_ITEMS[p.item]; if (!I) return 0;
  const cat = I.pack ? (I.old && Number(p.at) > 0 && Number(p.at) < KS_PACKS_AT ? I.old : I.pack) : p.item === 'supporter' ? KS_SUP_COINS : 0;
  if (Number.isInteger(p.coins) && p.coins >= 0) return Math.min(p.coins, I.pack || KS_SUP_COINS);
  return cat;
}
let ksLastGrant = null; // the last ksApplyCoins result; not part of the save
// add a purchase's coins. addCoins settles coinDebt first: n is what the purchase was for, a what reached the balance. The Delivered! card
// and Gerald's letter say how it split, so the settle note is taken here (no extra toast).
function ksApplyCoins(nominal) {
  nominal = Math.max(0, Math.round(Number(nominal) || 0));
  const added = nominal ? addCoins(nominal, { raw: true }) - coinSettled : 0;
  if (nominal) { ksSettleTake(coinSettled); coinSettled = 0; }
  ksLastGrant = { n: nominal, a: added };
  return added;
}
// take coins back. What is still in the balance leaves it; what was already spent becomes coinDebt (later coins settle it). Returns what left the balance
function ksClawCoins(n) {
  n = Math.max(0, Math.round(Number(n) || 0));
  if (!n || !S) return 0;
  const sh = ksShopReady(), have = Math.max(0, Math.round(Number(S.coins) || 0)), take = Math.min(have, n);
  if (take) S.coins = have - take;
  if (sh && n > take) sh.coinDebt += n - take;
  return take;
}
/* the settle notes (owner, 13 Nov: take coins back kindly and visibly). addCoins queues each settled coin; a text that shows a coin amount takes
   the queue with ksSettleNote() / ksSettleHTML(); whatever nobody took becomes one toast a moment later, so no coin income settles in silence. */
function ksSettleQueue(d) {
  coinSettleQ += Math.max(0, Math.round(d) || 0); clearTimeout(coinSettleT);
  coinSettleT = setTimeout(() => { const n = ksSettleTake(); if (n > 0 && S) toast(ksSettleLine(n), 'good', { group: 'kssettle' }); }, 900);
}
// take settled coins out of the queue: all of them, or at most n (what one text is about), leaving the rest for its own text or the toast
function ksSettleTake(n) {
  const k = n === undefined ? coinSettleQ : Math.max(0, Math.min(coinSettleQ, Math.round(n) || 0));
  coinSettleQ -= k; if (!coinSettleQ) clearTimeout(coinSettleT); return k;
}
const ksDebt = () => (S && S.shop ? Math.max(0, Math.round(S.shop.coinDebt) || 0) : 0);
function ksSettleLine(n) {
  return tt('ks.settle_line', '{n, plural, one {# coin} other {# coins}} went to settling the refund. {left, plural, =0 {All settled now. Thank you!} one {# coin to go.} other {# coins to go.}}', { n, left: ksDebt() });
}
// " (N coins go to settling the refund)" after a "+N coins" text, or '' when none did. It speaks for the last addCoins call, or, given since
// (coinSettleSum before a few calls), for everything settled since then. The walk result (ksSettleHTML) speaks for everything not said yet.
function ksSettleNote(since) {
  const n = ksSettleTake(typeof since === 'number' ? coinSettleSum - since : coinSettled); coinSettled = 0;
  return n > 0 ? ' ' + tt('ks.settle_note', '({n, plural, one {# coin goes} other {# coins go}} to settling the refund)', { n }) : '';
}
function ksSettleHTML() { const n = ksSettleTake(); coinSettled = 0; return n > 0 ? `<p class="small ks-settle">${esc(ksSettleLine(n))}</p>` : ''; }
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
// one purchase's contents, once. coins (ksNominal of the GET /shop/owned row) is how many Paw Coins this row grants; omit it and the catalogue is used.
// Supporter coins are added only the first time it becomes owned. A paid row always delivers, even for an item a refund took back before
// (the Worker no longer sells it, so such a row was paid before that refund): it leaves onceBack. Returns coins that reached the balance.
function ksGive(item, coins) {
  const sh = ksShopReady(), I = KS_ITEMS[item]; if (!sh || !I) return 0;
  const passed = Number.isInteger(coins) && coins >= 0 && coins <= 1000000;
  if (I.pack) return ksApplyCoins(passed ? Math.min(coins, I.pack) : I.pack);
  sh.onceBack = sh.onceBack.filter((x) => x !== item);
  const fresh = !sh.owned.includes(item);
  if (fresh) sh.owned.push(item);
  if (item === 'supporter') { ksGiveLook(KS_HOUSE); ksGiveLook(KS_TAG); ksLetter(); return ksApplyCoins(fresh ? (passed ? coins : KS_SUP_COINS) : 0); }
  if (I.looks) I.looks.forEach(ksGiveLook);
  ksLastGrant = { n: 0, a: 0 };
  return 0;
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
    if (S.house === n) { const cap = (h) => HOUSE_CAP[h] || 1, hc = (h) => (HOUSES.find((x) => x.n === h) || {}).comfort || 0, pv = sh.prevHouse && owns('houses', sh.prevHouse) && cap(sh.prevHouse) >= S.dogs.length ? sh.prevHouse : null; S.house = pv || S.inv.houses.slice().sort((a, b) => cap(b) - cap(a) || hc(b) - hc(a))[0] || 'Cardboard Box'; }
    return;
  }
  const ci = S.inv.clothes.indexOf(n); if (ci >= 0 && typeof S.wardN === 'number' && ci < S.wardN) S.wardN--; // v2.23.3's "new!" tape counts clothes by place: one taken back before the mark moves the mark back
  S.inv.clothes = S.inv.clothes.filter((c) => c !== n);
  S.dogs.forEach((d) => { if (d.outfit) Object.keys(d.outfit).forEach((k) => { if (d.outfit[k] === n) d.outfit[k] = null; }); }); // worn: back to "Nothing"
}
function ksTakeBack(item) {
  const sh = ksShopReady(), I = KS_ITEMS[item]; if (!sh || !I || I.pack) return; // coin packs have no item to take; their coins are clawed in ksRefundCoins
  sh.owned = sh.owned.filter((x) => x !== item);
  if (item === 'supporter') { ksTakeLook(KS_HOUSE); ksTakeLook(KS_TAG); }
  if (I.looks) I.looks.forEach(ksTakeLook);
}
// the coins a refund takes back: { n: what that purchase was for, took: what left the balance, debt: what was already spent and is now owed }.
// Never more than the save recorded for that row (coinGot), or, for a row granted before coinGot existed, what the row was for (ksNominal: an
// old pack size for a pack from before v2.24.2). A live second purchase of the same one-time item keeps them (paid twice, one charge came back).
function ksRefundCoins(p, list) {
  const sh = ksShopReady(), none = { n: 0, took: 0, debt: 0 }; if (!sh) return none;
  const I = KS_ITEMS[p.item], rec = sh.coinGot[p.id];
  let nominal, added;
  if (rec && typeof rec.n === 'number') { nominal = Math.max(0, rec.n); added = Math.max(0, Math.min(nominal, rec.a || 0)); } else { nominal = ksNominal(p); added = nominal; }
  delete sh.coinGot[p.id];
  if (nominal <= 0) return none;
  if (I && !I.pack) {
    const heir = list.find((q) => q.id !== p.id && q.item === p.item && !q.refunded && sh.claimed.includes(q.id));
    if (heir && !(sh.coinGot[heir.id] && sh.coinGot[heir.id].n > 0)) { sh.coinGot[heir.id] = { n: nominal, a: added }; return none; }
  }
  const d0 = sh.coinDebt;
  if (nominal > added) sh.coinDebt += nominal - added; // that grant had settled an older refund: that part is owed again
  const took = added > 0 ? ksClawCoins(added) : 0;
  return { n: nominal, took, debt: sh.coinDebt - d0 };
}
// Gerald's letter when a refund takes coins back: two short kind sentences, no blame (owner, 13 Nov 2026)
function ksRefundLetter(items, n, debt, id) {
  return mailPush({ kind: 'news', id: 'ks_refund_' + id, keep: true, from: tt('ks.letter_from', 'Gerald'), title: tt('ks.refund_title', 'About your refund'),
    text: tt('ks.refund_letter', 'Dear friend,\nYour refund for {list} came through, and the {n, plural, one {# Paw Coin} other {# Paw Coins}} it added went back with it. Everything you bought with coins stays yours{debt, plural, =0 {.} one {, and the next coin you earn settles the rest.} other {, and the next # coins you earn settle the rest.}}\nWith a happy waddle,\nGerald', { list: tlist(items.map(ksName)), n, debt }) });
}
/* GET /shop/owned: [{ id, item, at, refunded, coins }]. Each unclaimed id is granted once and recorded in S.shop.claimed. A refunded id that was
   granted here takes back its one-time items (unless another live purchase of the same thing is in the list) and the coins that row added,
   with Gerald's letter. A one-time item with no live purchase left is in onceBack: the Kind shop says "Refunded, not for sale again" (the Worker
   answers 409 refunded). The same list twice changes nothing. Returns { granted: [ids], refunded: [ids], coins, items: [ids], got: [{ n, a } | null] }:
   coins is the net change in the balance, got[i] how items[i]'s coins split (n the pack, a what was added; n - a settled an older refund). */
function ksGrant(purchases, give) {
  give = give || ksGive;
  const sh = ksShopReady(), out = { granted: [], refunded: [], coins: 0, items: [], got: [] }; if (!sh) return out;
  const list = (Array.isArray(purchases) ? purchases : []).filter((p) => p && typeof p.id === 'string' && p.id && KS_ITEMS[p.item]);
  list.forEach((p) => {
    if (p.refunded || sh.claimed.includes(p.id)) return;
    const I = KS_ITEMS[p.item], had = sh.owned.includes(p.item);
    let added = 0;
    ksLastGrant = null;
    try { added = give(p.item, ksNominal(p)); } catch (e) { console.warn('kind shop: grant failed, will retry', p.id, e); ksLastGrant = null; return; } // unclaimed: the next poll retries
    const rec = ksLastGrant && typeof ksLastGrant.n === 'number' ? ksLastGrant : { n: added, a: added };
    ksLastGrant = null;
    sh.coinGot[p.id] = { n: rec.n || 0, a: rec.a || 0 };
    sh.claimed.push(p.id); out.granted.push(p.id); out.coins += added;
    if (I.pack ? rec.n > 0 : !had) { out.items.push(p.item); out.got.push(I.pack ? { n: rec.n || 0, a: rec.a || 0 } : null); }
  });
  const back = { items: [], n: 0, debt: 0, id: '' };
  list.forEach((p) => {
    if (!p.refunded || sh.refunded.includes(p.id)) return;
    sh.refunded.push(p.id);
    const I = KS_ITEMS[p.item];
    if (!sh.claimed.includes(p.id)) { // refunded before this save ever got it: nothing was given, so nothing comes back. The card still says so
      if (!I.pack && !list.some((q) => q.item === p.item && !q.refunded) && !sh.onceBack.includes(p.item)) sh.onceBack.push(p.item);
      return;
    }
    const live = list.some((q) => q.item === p.item && !q.refunded && sh.claimed.includes(q.id));
    if (!live && !I.pack) { if (!sh.onceBack.includes(p.item)) sh.onceBack.push(p.item); ksTakeBack(p.item); }
    const r = ksRefundCoins(p, list);
    out.coins -= r.took; out.refunded.push(p.id);
    if (r.n > 0) { if (!back.items.includes(p.item)) back.items.push(p.item); back.n += r.n; back.debt += r.debt; back.id = back.id || p.id; }
  });
  if (back.n > 0) { ksRefundLetter(back.items, back.n, ksDebt(), back.id); out.letter = true; }
  const logged = ksLogSync(list);
  if (out.granted.length || out.refunded.length || logged) { markDirty(); updateHUD(); saveNow(); }
  return out;
}
// My purchases (v2.24.1): every purchase this save got, from the server list (so purchases from before v2.24.1 show too). True when it changed
const KS_LOG_MAX = 200;
function ksLogSync(list) {
  const sh = ksS(); let changed = false;
  list.forEach((p) => {
    if (!sh.claimed.includes(p.id)) return;
    const at = Number.isFinite(p.at) && p.at > 0 ? p.at : 0, r = !!p.refunded, e = sh.log.find((x) => x && x.id === p.id);
    if (!e) { sh.log.push({ id: p.id, item: p.item, at, r }); changed = true; }
    else if (e.r !== r || (!e.at && at)) { e.r = r; if (at) e.at = at; changed = true; }
  });
  if (changed) { sh.log.sort((a, b) => (b.at || 0) - (a.at || 0)); if (sh.log.length > KS_LOG_MAX) sh.log.length = KS_LOG_MAX; }
  return changed;
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
      const fx = $('#fx'), my = +mx.y > 0 ? +mx.y : 470, frame = (k) => { const r = ksPA('prop', 'ksrobo', { k }); return r ? place(r, mx.x - 30, my - 30, 60, 50) : ''; }, ic = frame(0) || ksPA('prop', 'Robo Scoop') || doodle('spark', 0, 0, 14);
      if (fx) {
        fx.insertAdjacentHTML('beforeend', `<g class="popfx ks-robofx">${frame(0) ? frame(0) : ic.includes('<svg') ? place(ic, mx.x - 32, 470, 64, 64) : `<svg x="${mx.x - 20}" y="480" width="40" height="40" viewBox="-20 -20 40 40" overflow="visible">${ic}</svg>`}</g>`);
        const g = fx.lastElementChild; let k = 0; if (g && frame(0)) { const iv = setInterval(() => { if (!g.isConnected) { clearInterval(iv); return; } g.innerHTML = frame(++k % 3); }, 140); setTimeout(() => clearInterval(iv), 4000); } // the wheels turn while it rolls
      }
      drawMess(); toast(tt('ks.robo_did', '{type, select, poop {Beep boop. The Robo Scoop tidied a poop.} other {Beep boop. The Robo Scoop mopped a puddle.}}', { type: mx.type === 'poop' ? 'poop' : 'pee' }), 'good');
    }
    return;
  }
}
const KS_BOWL_GRACE = 20;
function ksHelpOpen(id) { try { const h = S.missions && S.missions.help; return !!(h && h.date === jstISO() && Array.isArray(h.list) && h.list.some((it) => it && it.id === id && !it.done)); } catch (e) { return false; } }
// Auto Water Bowl: Fresh Water refills and the dog drinks by itself when it is ready (every 2 game hours): +5 Happiness, +10 Energy, as by hand, no water tick
function ksBowlTick() {
  if (!ksToolOn('bowl') || cur.mode !== 'yard' || !atHome() || busy || S.sleeping || !modal.hidden || popOpen() || (typeof buyOpen !== 'undefined' && buyOpen)) return;
  if (S.gameMin - S.waterAt < shWaterWait() + KS_BOWL_GRACE || ksHelpOpen('h_water')) return; // the hand way first: 20 game minutes of grace, and never while today's help is open
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
function ksPA(fn, n, o) { try { const P = window.PawArt, f = P && P.SHOP && P.SHOP[fn]; const v = typeof f === 'function' ? f.call(P.SHOP, n, o) : ''; return typeof v === 'string' && v.includes('<svg') ? v : ''; } catch (e) { return ''; } }
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
  if (I.pack) return ksIcon({ coins_1k: 'coins1', coins_3k: 'coins3', coins_8k: 'coins8' }[id] || 'coins');
  if (I.prop) return ksToolArt(id);
  if (id === 'comfort') return `<span class="ks-trio" style="display:flex;align-items:flex-end;justify-content:center;gap:2px;width:100%;height:100%">${KS_TOOLS.map((t) => `<span style="flex:1 1 0;min-width:0;height:62%">${ksToolArt(t)}</span>`).join('')}</span>`;
  if (id === 'cozy') return ksLookArt(KS_COZY_BED);
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
// My purchases (v2.24.1): newest first, with the date; a refunded one says so. Nothing while there are none
// While a refund is being settled (S.shop.coinDebt > 0) My purchases is open and says how many coins are still to go
function ksMineHTML() {
  const sh = ksS(), L = sh ? sh.log.filter((e) => e && KS_ITEMS[e.item]) : [], debt = ksDebt(); if (!L.length && !debt) return '';
  const rows = L.map((e) => `<li><b>${esc(ksName(e.item))}</b>${e.at ? ` <span class="ks-mine-d">${esc(tdate(new Date(e.at), { year: 'numeric', month: 'short', day: 'numeric' }))}</span>` : ''}${e.r ? ` <span class="ks-mine-r">${esc(tt('ks.mine_refunded', 'refunded'))}</span>` : ''}</li>`).join('');
  const settling = debt ? `<p class="small ks-settling"><b>${esc(tt('ks.settling', 'Settling: {n, plural, one {# coin} other {# coins}}', { n: debt }))}</b> ${esc(tt('ks.settling_why', 'A refund took back coins that were already spent. Coins you earn settle it first, and everything you bought stays yours.'))}</p>` : '';
  return `<details class="ks-mine"${debt ? ' open' : ''}><summary>${esc(tt('ks.mine', 'My purchases ({n})', { n: tnum(L.length) }))}</summary>${settling}${rows ? `<ul>${rows}</ul>` : ''}<p class="small">${esc(tt('ks.mine_help', 'Stripe emailed a receipt for each one. Questions or a refund: {email}', { email: 'contact@doodledoggo.app' }))}</p></details>`;
}
let ksTab = 'supporter';
function ksMenuBtn() { return ksOn() && S ? `<button class="btn big" id="mmKs" type="button"><span class="ic">${ICON('coin')}</span>${esc(tt('ks.btn', 'Kind shop'))}</button>` : ''; }
const ksYours = () => `<span class="chip own ks-yours">${esc(tt('ks.yours', 'Yours'))}</span>`;
// a one-time item bought and fully refunded is never for sale again (owner, 13 Nov 2026): its card says so kindly instead of a Pay button.
// What can be earned with coins (a tool, each look) still can.
const ksRefundedId = (id) => { const sh = ksS(); return !!sh && Array.isArray(sh.onceBack) && sh.onceBack.includes(id) && !KS_ITEMS[id].pack && !ksOwnedId(id); };
const ksRefundedTag = () => `<span class="small ks-refunded">${esc(tt('ks.refunded_card', 'Refunded, not for sale again'))}</span>`;
function ksCardHTML(id) {
  const I = KS_ITEMS[id], own = ksOwnedId(id), back = ksRefundedId(id);
  const list = id === 'supporter' || I.looks || I.tools ? `<ul class="ks-gets">${ksGets(id).map((g) => `<li>${esc(g)}</li>`).join('')}</ul>` : '';
  const or = I.looks ? `<span class="small ks-or">${esc(tt('ks.or_each', 'or {n} coins each', { n: tnum(KS_LOOK_COINS) }))}</span>` : '';
  const off = ksCashMode() === 'off', act = own ? ksYours() : `${back ? ksRefundedTag() : off ? (I.coins ? '' : `<span class="small ks-nopay-note">${esc(tt('ks.not_here', 'Not open here'))}</span>`) : `<button class="btn yes ks-cash" type="button" data-kscash="${id}">${esc(ksUSD(id))}</button>`}${I.coins ? `<button class="btn ks-coin" type="button" data-kscoin="${id}">${esc(tt('ks.or_coins', 'or {n} coins', { n: tnum(I.coins) }))}</button>` : ''}${or}`;
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
// how cash buys can work here: 'ok' (a cloud account with an email), 'guest' (cloud on, no email yet), 'off' (cloud off: the claude.ai build, no Worker).
// Tests: prefs.shopCash or window.__ddShopCash set it.
function ksCashMode() {
  const o = (typeof window !== 'undefined' && window.__ddShopCash) || (typeof prefs !== 'undefined' && prefs && prefs.shopCash); if (o) return o;
  if (typeof CL === 'undefined' || !CL.on) return 'off';
  return CL.uid && !CL.anon && CL.email ? 'ok' : 'guest';
}
// guest without an email: purchases are tied to the account, so add an email first
function ksEmailSheet(panel) {
  const old = panel.querySelector('.buyveil'); if (old) old.remove();
  const v = document.createElement('div'); v.className = 'buyveil ks-veil';
  v.innerHTML = `<div class="buybox pop ks-confirm ks-email" role="dialog" aria-modal="true"><p>${esc(tt('ks.need_email', 'Add an email to your save first, so your purchases can come back on a new device.'))}</p>
    <div class="foot"><button class="btn no ks-no" type="button">${esc(tt('ks.not_now', 'Not now'))}</button><button class="btn yes big ks-addmail" type="button">${esc(tt('ks.add_email', 'Add an email'))}</button></div></div>`;
  panel.appendChild(v);
  v.addEventListener('click', (e) => { if (e.target === v) { SFX.click(); v.remove(); } });
  v.querySelector('.ks-no').onclick = () => { SFX.click(); v.remove(); };
  v.querySelector('.ks-addmail').onclick = () => { SFX.click(); closeModal(); if (typeof cloudOpen === 'function') cloudOpen(); };
}
function ksOpen(tab) {
  if (!ksOn() || !S) return null;
  v224Fields(S); if (KS_TABS.includes(tab)) ksTab = tab;
  SFX.boop(620); audioPlace('shop');
  const duck = typeof gdDuck === 'function' ? gdDuck('sit') : '';
  const tabs = `<div class="tabs" role="tablist">${KS_TABS.map((t) => `<button class="btn" role="tab" type="button" aria-selected="${t === ksTab}" data-kstab="${t}">${esc(ksTabName(t))}</button>`).join('')}</div>`;
  const why = `<details class="ks-why"><summary>${esc(tt('ks.why', 'Why is there a shop?'))}</summary><div class="ks-whyb">${duck ? `<span class="ks-duck" aria-hidden="true">${duck}</span>` : ''}<p>${esc(tt('ks.why_text', 'Gerald: "Doodle Doggo is made by one person. The shop helps keep the crayons sharp. Everything here except the Supporter Pack and the coins can also be earned by playing, and the game is complete without paying. Dogs, Bond and chances are never in the shop."'))}</p></div></details>`;
  const body = `<p class="small ks-hi">${esc(tt('ks.hi', 'Looks, comfort tools and coins. You have {coins} Paw Coins.', { coins: tnum(S.coins) }))}</p>${why}${tabs}<div class="shopgrid ks-grid">${ksTabHTML(ksTab)}</div>
    ${ksCashMode() === 'off' ? '' : `<p class="small ks-ask">${esc(tt('ks.ask', 'Ask a grown-up before you buy. Payments are made on Stripe. We never see card details.'))}</p>`}<p class="ks-links">${ksCashMode() === 'off' ? `<span class="small ks-nopay">${esc(tt('ks.pay_closed', 'Shop payments are not open here'))}</span>` : `<button class="btn ks-link" type="button" id="ksRestore">${esc(tt('ks.restore', 'Restore purchases'))}</button>`}</p>${ksMineHTML()}`;
  const p = openModal(esc(tt('ks.title', 'Kind shop')), body, { cls: 'shop ks' });
  p.querySelectorAll('[data-kstab]').forEach((b) => { b.onclick = () => { SFX.click(); ksTab = b.dataset.kstab; ksOpen(); }; });
  p.querySelectorAll('[data-kscash]').forEach((b) => { b.onclick = () => { SFX.click(); if (ksCashMode() === 'guest') ksEmailSheet(p); else ksConfirm(p, b.dataset.kscash); }; });
  p.querySelectorAll('[data-kscoin]').forEach((b) => { b.onclick = () => { SFX.click(); ksCoinBuy(p, b.dataset.kscoin); }; });
  p.querySelectorAll('[data-kslook]').forEach((b) => { b.onclick = () => { SFX.click(); ksCoinBuy(p, b.dataset.kslook); }; });
  const rs = $('#ksRestore', p); if (rs) rs.onclick = () => { SFX.click(); if (ksCashMode() === 'guest') ksEmailSheet(p); else ksRestore(); };
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
/* ---------------- payments (part 3: the Worker's /shop/*, cloudflare/worker.js; V224.md 4) ----------------
   ksCheckout(id): POST /shop/checkout { item } -> { url }, opened in a new tab. The tab is opened blank in the tap itself (window.open must run
   synchronously in the click, or a browser and the itch.io frame block it), then pointed at Stripe once the Worker answers, and closed again on
   any error with a kind toast. ksRestore(): GET /shop/owned -> ksGrant(list). ksPoll() does the same quietly on start and whenever the tab is
   shown again (the player comes back from Stripe's tab). The Worker answers shop_closed until the owner's Stripe keys are in. */
const KS_SOON = () => tt('ks.soon', 'The shop opens soon. Thank you for looking!');
let ksPollAt = 0, ksPollP = null;
const ksWorker = () => typeof CL !== 'undefined' && !!CL.on && !!CL.uid; // the cloud is on and this device is signed in (otherwise there is no Worker to ask)
function ksErrToast(code) {
  if (code === 'shop_closed') toast(KS_SOON(), 'good');
  else if (code === 'owned') toast(tt('ks.owned_already', 'This is yours already. Restoring your purchases now.'), 'good');
  else if (code === 'refunded') toast(tt('ks.refunded_toast', 'This one was refunded, so it is not for sale again. Thank you for trying it!'), 'good');
  else if (code === 'pending') toast(tt('ks.pending', 'A payment for this is still on its way. Please look again in a minute.'), 'good');
  else if (code === 'no_account') toast(tt('ks.need_email', 'Add an email to your save first, so your purchases can come back on a new device.'), 'good');
  else if (code === 'rate_limited') toast(tt('ks.slow_down', 'Lots of taps! Please wait a few minutes and try again.'), 'good');
  else toast(tt('ks.no_reach', 'The shop could not be reached. Nothing was paid. Please try again soon.'), 'good');
}
// the blank tab could not be opened (a pop-up blocker): a real link the player taps opens Stripe instead
function ksLinkSheet(url) {
  const pp = $('.panel', modal) || document.body, old = pp.querySelector('.buyveil'); if (old) old.remove();
  const v = document.createElement('div'); v.className = 'buyveil ks-veil';
  v.innerHTML = `<div class="buybox pop ks-confirm ks-link" role="dialog" aria-modal="true"><p>${esc(tt('ks.stripe', "You'll pay on Stripe's secure page in a new tab."))}</p>
    <div class="foot"><button class="btn no ks-no" type="button">${esc(tt('ks.not_now', 'Not now'))}</button><a class="btn yes big ks-go" href="${esc(url)}" target="_blank" rel="noopener">${esc(tt('ks.pay', 'Pay with Stripe'))}</a></div></div>`;
  pp.appendChild(v);
  const gone = () => v.remove();
  v.querySelector('.ks-no').onclick = () => { SFX.click(); gone(); };
  v.querySelector('.ks-go').addEventListener('click', () => setTimeout(gone, 50));
  return v;
}
function ksCheckout(id) {
  if (!KS_ITEMS[id]) return Promise.resolve(false);
  const mode = ksCashMode();
  if (mode !== 'ok' || !ksWorker()) { if (mode === 'guest') ksErrToast('no_account'); else toast(KS_SOON(), 'good'); return Promise.resolve(false); }
  let w = null;
  try { w = window.open('', '_blank'); } catch (e) { w = null; } // now, inside the tap
  if (w) { try { w.opener = null; w.document.title = 'Stripe'; w.document.body.innerHTML = '<p style="font:18px Georgia,serif;margin:40px;color:#5B3D32">Opening Stripe…</p>'; } catch (e) { /* another origin already */ } }
  const shut = () => { try { if (w && !w.closed) w.close(); } catch (e) { /* gone */ } };
  return clApi('POST', '/shop/checkout', { item: id }).then((r) => {
    const url = r && r.ok && r.data && typeof r.data.url === 'string' && /^https:\/\//.test(r.data.url) ? r.data.url : null;
    if (!url) {
      shut(); const code = r && r.data && r.data.error; ksErrToast(code);
      if (code === 'refunded') { const sh = ksShopReady(); if (sh && !KS_ITEMS[id].pack && !sh.onceBack.includes(id)) { sh.onceBack.push(id); markDirty(); saveNow(); } if ($('.panel.ks', modal)) ksOpen(); }
      if (code === 'owned' || code === 'refunded' || code === 'pending') ksRestore(false);
      return false;
    }
    if (w && !w.closed) { try { w.location.href = url; } catch (e) { shut(); w = null; } }
    if (!w) ksLinkSheet(url);
    ksPollAt = 0; // the next time the tab is shown, look at once
    return true;
  }).catch(() => { shut(); ksErrToast('offline'); return false; });
}
// where a delivered item is (v2.24.1)
function ksWhere(id) {
  const I = KS_ITEMS[id];
  if (id === 'supporter') return tt('ks.where_sup', "The perks are on now, and Gerald's letter is in your mailbox.");
  if (I.pack) return tt('ks.where_coins', 'Added to your Paw Coins.');
  if (id === 'tokyo') return tt('ks.where_tokyo', 'Find them in the Wardrobe.');
  if (id === 'cozy') return tt('ks.where_cozy', 'Find them in your house, ready to place.');
  return tt('ks.where_tool', 'Working at home now. You can switch it off in Settings.');
}
// a coin pack in a delivery: its own size (an old pack restored on a new device is its old size), and how it split when it settled a refund
const ksPackName = (id, g) => (g && g.n > 0 ? tt('ks.n_coins', '{n} coins', { n: tnum(g.n) }) : ksName(id));
const ksPackSplit = (g) => (g && g.n > g.a ? tt('ks.got_settle', '{a, plural, =0 {All {s} coins settled the refund.} one {{s} settled the refund and # coin was added to your Paw Coins.} other {{s} settled the refund and # coins were added to your Paw Coins.}}', { s: tnum(g.n - g.a), a: g.a }) : '');
// one delivery's lines, as plain text: "Tokyo Street: Sukajan Jacket, Bucket Hat, ..." / "2,000 coins" (+ how it split)
function ksGotLine(id, g) { return KS_ITEMS[id].pack ? ksPackName(id, g) + (ksPackSplit(g) ? ' (' + ksPackSplit(g) + ')' : '') : ksName(id) + ': ' + tlist(ksGets(id)); }
// Gerald's delivery letter: what arrived, kept to reread. The Supporter Pack has its own thank-you letter (ksLetter)
function ksDeliveryLetter(out) {
  const rows = out.items.map((id, i) => [id, (out.got || [])[i]]).filter(([id]) => id !== 'supporter'); if (!rows.length) return null;
  return mailPush({ kind: 'news', id: 'ks_got_' + out.granted[0], from: tt('ks.letter_from', 'Gerald'), title: tt('ks.got_title', 'Your Kind shop delivery'),
    text: tt('ks.got_letter', 'Dear friend,\nThank you for your purchase! This arrived in town for you:\n{list}\nYou can see every purchase under My purchases in the Kind shop.\nWith a happy waddle,\nGerald', { list: rows.map(([id, g]) => '- ' + ksGotLine(id, g)).join('\n') }) });
}
// the Delivered! card: each item, exactly what came, and where it is. Over the Kind shop or an empty screen; elsewhere (a minigame, a walk) a toast
function ksDelivered(out) { // true when it showed something
  if (!out.items.length) return false;
  const shopOpen = !!$('.panel.ks', modal);
  const got = out.got || [], nm = (id, i) => (KS_ITEMS[id].pack ? ksPackName(id, got[i]) : ksName(id));
  if (!modal.hidden && !shopOpen) { toast(tt('ks.got_toast', 'Thank you! Delivered: {list}. Look in your mailbox.', { list: tlist(out.items.map(nm)) }), 'gold'); return true; }
  const rows = out.items.map((id, i) => { const I = KS_ITEMS[id], gets = I.pack ? [] : ksGets(id), split = I.pack ? ksPackSplit(got[i]) : '';
    return `<div class="ks-got-row" data-ks="${id}"><span class="art">${ksArt(id)}</span><div><b>${esc(nm(id, i))}</b>${gets.length ? `<ul class="ks-gets">${gets.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>` : ''}<p class="small ks-where">${esc(split || ksWhere(id))}</p></div></div>`; }).join('');
  SFX.boop(880);
  const p = openModal(esc(tt('ks.got_h', 'Delivered!')), `<p class="ks-got-hi">${esc(tt('ks.got_hi', 'Thank you! This is yours now:'))}</p>${rows}`,
    { cls: 'ks ks-got', foot: `<button class="btn yes big" type="button" id="ksGotOk">${esc(tt('ks.got_ok', 'Yay!'))}</button>`, onClose: shopOpen ? () => setTimeout(() => ksOpen(), 0) : null });
  $('#ksGotOk', p).onclick = () => { SFX.click(); closeModal(); };
  return true;
}
function ksGrantToast(out) {
  if (!out.granted.length) return;
  ksDeliveryLetter(out);
  if (!ksDelivered(out)) toast(tt('ks.got', 'Thank you! Your purchase is here. Look in the shop for "Yours".'), 'gold');
}
// manual: the Restore purchases link (toasts every outcome); otherwise the quiet poll (toasts only a new purchase)
async function ksRestore(manual) {
  manual = manual !== false;
  if (!S || !ksOn()) return null;
  const mode = ksCashMode();
  if (mode !== 'ok' || !ksWorker()) { if (manual) { if (mode === 'guest') ksErrToast('no_account'); else toast(KS_SOON(), 'good'); } return null; }
  let r = null;
  try { r = await clApi('GET', '/shop/owned'); } catch (e) { r = null; }
  if (!r || !r.ok || !r.data || !Array.isArray(r.data.purchases)) { if (manual) ksErrToast(r && r.data && r.data.error ? r.data.error : 'offline'); return null; }
  const out = ksGrant(r.data.purchases);
  if (out.letter) toast(tt('ks.refund_toast', 'A refund came through. Gerald sent you a letter about it.'), 'good');
  if (out.granted.length) ksGrantToast(out); // the Delivered! card, which opens the Kind shop again when it was open
  else if (out.refunded.length && $('.panel.ks', modal)) ksOpen(); // the open Kind shop shows the refunded card at once
  else if (manual) toast(tt('ks.restored_none', 'Your purchases are all here. Nothing new to restore.'), 'good');
  return out;
}
// the quiet poll: on start, and when the tab is shown again; at most once every 20 s unless a checkout just opened
function ksPoll(force) {
  if (!S || !ksOn() || ksCashMode() !== 'ok' || !ksWorker()) return Promise.resolve(null);
  if (ksPollP) return ksPollP;
  if (!force && Date.now() - ksPollAt < 20000) return Promise.resolve(null);
  ksPollAt = Date.now();
  ksPollP = ksRestore(false).catch(() => null).finally(() => { ksPollP = null; });
  return ksPollP;
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') ksPoll(false); });
// a coin buy: a look (KS_LOOK_COINS) or a tool (its own price), through the same coin window as every shop. Never the Supporter Pack or coins
async function ksCoinBuy(panel, n) {
  const tool = KS_TOOLS.includes(n), look = KS_TOKYO.includes(n) || KS_COZY.includes(n); if (!tool && !look) return false;
  const price = tool ? KS_ITEMS[n].coins : KS_LOOK_COINS, owned = tool ? ksTool(n) : ksLookOwned(n), nm = tool ? ksName(n) : homeName(n);
  const c = CLOTHES.find((x) => x.n === n);
  const q = await buyWindow(panel, { art: tool ? ksToolArt(n) : ksLookArt(n), name: nm, desc: tool ? ksLine(n) : c ? shPerk(c) : '', price, stack: false, one: true, owned, have: owned ? 1 : 0, haveLabel: tt('shop.owned', 'Owned') });
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
    on: () => ksOn(), live: SHOP_LIVE, newsDate: NEWS_V224.date, items: KS_ITEMS, tokyo: KS_TOKYO.slice(), cozy: KS_COZY.slice(), LOOK: KS_LOOK_COINS,
    grant: (l, g) => ksGrant(l, g), cashMode: () => ksCashMode(), bowlWait: () => shWaterWait() + KS_BOWL_GRACE, fields: (s) => v224Fields(s), sup: () => ksSup(), tool: (t) => ksTool(t), toolOn: (t) => ksToolOn(t), owned: (id) => ksOwnedId(id), look: (n) => ksLookOwned(n),
    walkBonus: (n) => (ksSup() ? Math.floor(Math.max(0, +n || 0) * KS_WALK_K) : 0), growMul: () => ksGrowMul(), gift2: (ym, d) => ksGift2(ym, d), gift2Claim: () => ksGift2Claim(), gift2Can: () => ksGift2Can(),
    open: (t) => ksOpen(t), confirm: (id) => { const p = $('.panel.ks', modal) || ksOpen(); return p ? (ksConfirm(p, id), true) : false; }, coinBuy: (n) => { const p = $('.panel.ks', modal) || ksOpen(); return p ? ksCoinBuy(p, n) : false; },
    tick: () => { ksLastMin = -1; ksTick(); }, robo: () => ksRoboTick(), bowl: () => ksBowlTick(), gardenCtx: () => ksGardenCtx(), checkout: (id) => ksCheckout(id), restore: (m) => ksRestore(m), poll: (f) => ksPoll(f),
    garden: (h, w) => gardenAdvance({ steps: h || 1, stepWeather: w || 'cloudy' }), rec: () => { KS_REC = []; return true; }, acts: () => (KS_REC || []).slice(),
    debt: () => ksDebt(), settleNote: () => ksSettleNote(), settleTake: () => ksSettleTake(), refundedId: (id) => ksRefundedId(id), nominal: (p) => ksNominal(p), packsAt: KS_PACKS_AT,
    addCoins: (n, raw) => addCoins(n, { raw: !!raw }), delivered: (out) => ksDelivered(out), grantToast: (out) => ksGrantToast(out), gotLine: (id, g) => ksGotLine(id, g), errToast: (c) => ksErrToast(c)
  };
}
let KS_REC = null; // tests: the act kinds seen since rec() (the tools must add none)
on('act', (a) => { if (KS_REC && a && a.kind) KS_REC.push(a.kind); });
on('game:ready', () => { if (S) v224Fields(S); setTimeout(ksExpose, 0); setTimeout(() => { if (!ksOn() || !S) return; Promise.resolve(typeof clStart === 'function' ? clStart() : null).then(() => ksPoll(true)).catch(() => {}); }, 1200); }); // part 3: purchases made on another device, or while the game was closed
// a (+) inside the coin counter opens the shop on its Coins tab, only while the shop is on (owner, 9 Nov 2026)
function ksPlusSync() {
  const coins = $('#coins'); if (!coins) return; let b = $('#ksPlus');
  if (!b) {
    coins.insertAdjacentHTML('beforeend', '<button id="ksPlus" class="ks-plus" type="button" hidden><svg viewBox="-10 -10 20 20" aria-hidden="true"><path d="M0.4 -5.6L-0.3 5.8M-5.7 0.3L5.6 -0.4" fill="none" stroke="#5B3D32" stroke-width="3.2" stroke-linecap="round"/></svg></button>');
    b = $('#ksPlus'); b.onclick = (e) => { e.stopPropagation(); SFX.click(); ksOpen('coins'); };
  }
  const on = ksOn() && !!S && cur.mode !== 'title';
  if (b.hidden === on) b.hidden = !on;
  const lbl = tt('ks.title', 'Kind shop') + ': ' + tt('ks.tab_coins', 'Coins');
  if (b.getAttribute('aria-label') !== lbl) { b.setAttribute('aria-label', lbl); b.title = lbl; }
}
on('game:ready', () => setTimeout(ksPlusSync, 0));
on('yard:enter', () => { if (S) v224Fields(S); if (window.__paw && !window.__paw.ks) ksExpose(); ksPlusSync(); });
setTimeout(ksExpose, 0);
