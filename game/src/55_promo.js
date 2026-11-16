/* ======================= v2.25.5 GIFT CODES (PROMO.md; owner, 16 Nov 2026) =======================
   "Have a code?": a box in Settings and in the phone "..." menu. The code typed goes only to our Worker (POST /promo/redeem), which checks it
   and answers with what it gives: code-only items (any item name from the tables: CLOTHES, HM_DECOR, HOUSES, BEDS, TOYS; the `promo: true`
   ones are made for codes), a few Paw Coins (500 at most, the Worker's ceiling) and dog-safe treats (FOOD). Nothing is paid, ever.
   Only signed-in cloud-save accounts (an email account): a guest sees one kind line and a button to make the free account.
   Granting is local: items to the Wardrobe / house / houses / beds / toys, coins with addCoins + coinFly from the card, treats to the pantry,
   a Delivered!-style card and Gerald's short letter. A new device (or a fresh save on the same account) gets back every redemption the save
   lacks from GET /promo/mine: the record holds exactly what was granted, so coins never come twice in one save.
   Save (additive, v stays 1; prFields from migrate() and freshState()):
     S.promo.used  normalised codes (the Worker's key) granted in this save
     S.promo.wait  [{ k, n, q }]: an item or treat this build does not know yet (an older build than the code), given once it is known
   Build flag: PROMO_UI. false hides the box everywhere and asks the Worker nothing (the iOS build may need it off: App Store guideline 3.1.1
   lets an app unlock content with its own codes only through App Store offer codes). Test hook: window.__paw.pr. */
const PROMO_UI = true; // the build flag (PROMO.md 7): one line to switch gift codes off for a build
const PR_COIN_MAX = 500; // the Worker's PROMO_COIN_MAX: a reward never adds more, whatever reaches the game
const PR_LEN = 40;
function prUI() { return PROMO_UI && !(typeof window !== 'undefined' && window.__ddPromoOff); } // __ddPromoOff: tests switch the build flag off
// 'ok' (a signed-in email account), 'guest' (cloud on, no account yet), 'off' (no cloud here: the claude.ai copy, the harness, PROMO_UI off).
// Tests: window.__ddPromoMode or prefs.promoMode set it
function prMode() {
  if (!prUI()) return 'off';
  const o = (typeof window !== 'undefined' && window.__ddPromoMode) || (typeof prefs !== 'undefined' && prefs && prefs.promoMode); if (o) return o;
  if (typeof CL === 'undefined' || !CL.on) return 'off';
  return CL.uid && !CL.anon && CL.email ? 'ok' : 'guest';
}
const prWorker = () => typeof CL !== 'undefined' && !!CL.on && !!CL.uid;

/* ---------------- save ---------------- */
function prFields(s) {
  if (!s) return s;
  if (!s.promo || typeof s.promo !== 'object' || Array.isArray(s.promo)) s.promo = {};
  if (!Array.isArray(s.promo.used)) s.promo.used = [];
  if (!Array.isArray(s.promo.wait)) s.promo.wait = [];
  return s;
}

/* ---------------- what a name is ---------------- */
const prTreat = (n) => typeof n === 'string' && n !== 'Fresh Water' && FOOD.some((f) => f.n === n);
function prKind(n) {
  if (typeof n !== 'string' || !n) return null;
  if (CLOTHES.some((c) => c.n === n)) return 'clothes';
  if (typeof HM_DECOR !== 'undefined' && HM_DECOR[n]) return 'decor';
  if (HOUSES.some((h) => h.n === n)) return 'houses';
  if (typeof BEDS !== 'undefined' && BEDS.some((b) => b.n === n)) return 'beds';
  if (TOYS.some((t) => t.n === n)) return 'toys';
  return null;
}
function prOwns(n, k) {
  if (k === 'decor') return !!(S.decor && S.decor[n]);
  if (k === 'beds') return Array.isArray(S.beds) && S.beds.includes(n);
  return Array.isArray(S.inv[k]) && S.inv[k].includes(n);
}
function prGive(n, k) {
  if (k === 'decor') { hmDecorFields(); S.decor[n] = { got: localISO(), out: false }; return; } // it waits to be put out (Arrange the yard / house)
  if (k === 'beds') { if (!Array.isArray(S.beds)) S.beds = []; S.beds.push(n); return; }
  if (!Array.isArray(S.inv[k])) S.inv[k] = [];
  S.inv[k].push(n);
}
// every name a code may give, for tools/promo_items.json (tools/promo_items.js): the `promo` items, and what the shops sell (never the Kind
// shop's paid looks or the earned rewards such as the Bond 10 Golden Collar). Treats: FOOD without Fresh Water
function prCatalog() {
  const out = [], seen = new Set();
  const add = (x, kind) => { if (!x || !x.n || seen.has(x.n)) return; if (!(x.promo || (!x.reward && !x.ks && (x.price || 0) > 0))) return; seen.add(x.n); out.push(Object.assign({ n: x.n, kind }, x.promo ? { promo: true } : {}, x.slot ? { slot: x.slot } : {})); };
  CLOTHES.forEach((x) => add(x, 'clothes'));
  Object.keys(HM_DECOR).forEach((n) => add(Object.assign({ n }, HM_DECOR[n]), 'decor'));
  HOUSES.forEach((x) => add(x, 'houses'));
  BEDS.forEach((x) => add(x, 'beds'));
  TOYS.forEach((x) => add(x, 'toys'));
  return { items: out, treats: FOOD.filter((f) => prTreat(f.n)).map((f) => f.n) };
}

/* ---------------- granting ---------------- */
// rec: { key, code, reward: { items, coins, treats }, at } from the Worker. Grants once per save (S.promo.used). Returns what happened, or null
function prGrant(rec) {
  if (!S || !rec || typeof rec.key !== 'string' || !rec.key) return null;
  prFields(S);
  if (S.promo.used.includes(rec.key)) return null;
  const R = rec.reward && typeof rec.reward === 'object' ? rec.reward : {};
  const out = { key: rec.key, code: String(rec.code || rec.key).slice(0, 60), rows: [], coins: 0, added: 0, wait: 0 };
  (Array.isArray(R.items) ? R.items : []).slice(0, 6).forEach((n) => {
    const k = prKind(n);
    if (!k) { S.promo.wait.push({ k: rec.key, n: String(n).slice(0, 60) }); out.wait++; return; } // an item this build does not know yet
    if (prOwns(n, k)) { out.rows.push({ n, k, had: true }); return; }
    prGive(n, k); out.rows.push({ n, k });
  });
  const T = R.treats && typeof R.treats === 'object' && !Array.isArray(R.treats) ? R.treats : {};
  Object.keys(T).slice(0, 6).forEach((n) => {
    const q = Math.max(0, Math.min(10, Math.floor(Number(T[n]) || 0))); if (!q) return;
    if (!prTreat(n)) { S.promo.wait.push({ k: rec.key, n: String(n).slice(0, 60), q }); out.wait++; return; }
    S.inv.food[n] = (S.inv.food[n] || 0) + q; out.rows.push({ n, k: 'food', q });
  });
  const c = Math.max(0, Math.min(PR_COIN_MAX, Math.floor(Number(R.coins) || 0)));
  if (c) { const g = addCoinsD(c, { raw: true }); out.coins = c; out.added = g.n - g.d; if (g.d && typeof ksSettleTake === 'function') ksSettleTake(g.d); }
  S.promo.used.push(rec.key);
  prLetter(out);
  markDirty(); updateHUD(); saveNow();
  return out;
}
// items a code gave that this build did not know yet: given as soon as a newer build knows them (once)
function prWaitTick() {
  if (!S || !S.promo || !S.promo.wait.length) return 0;
  let n = 0;
  S.promo.wait = S.promo.wait.filter((w) => {
    if (w.q) { if (!prTreat(w.n)) return true; S.inv.food[w.n] = (S.inv.food[w.n] || 0) + Math.min(10, w.q | 0); n++; return false; }
    const k = prKind(w.n); if (!k) return true;
    if (!prOwns(w.n, k)) prGive(w.n, k);
    n++; return false;
  });
  if (n) { markDirty(); saveNow(); }
  return n;
}

/* ---------------- words ---------------- */
const prName = (r) => (r.k === 'food' ? tt('pr.treat_n', '{n} × {item}', { n: tnum(r.q), item: homeName(r.n) }) : homeName(r.n));
function prWhere(r) {
  if (r.had) return tt('pr.where_had', 'You had this one already.');
  if (r.k === 'clothes') return tt('pr.where_clothes', 'Find it in the Wardrobe.');
  if (r.k === 'decor') return tt('pr.where_decor', '{room, select, house {Find it under Arrange the house, ready to put out.} other {Find it under Arrange the yard, ready to put out.}}', { room: typeof hoRoomOf === 'function' ? hoRoomOf(r.n) : 'yard' });
  if (r.k === 'houses') return tt('pr.where_house', 'It is with your houses now, ready to move in.');
  if (r.k === 'beds') return tt('pr.where_bed', 'It is in the Cozy House now.');
  if (r.k === 'toys') return tt('pr.where_toy', 'Find it with your toys.');
  return tt('pr.where_food', 'In your pantry now.');
}
const prCoinsLine = (o) => tt('pr.coins_n', '{n} coins', { n: tnum(o.coins) });
function prArt(r) {
  try {
    if (r.k === 'houses') return art('house', r.n);
    if (r.k === 'clothes' || r.k === 'decor' || r.k === 'beds') return ksLookArt(r.n);
    return itemArt(r.n);
  } catch (e) { return ICON('star'); }
}
// Gerald's letter: what the code brought, kept to reread
function prLetter(o) {
  const lines = o.rows.filter((r) => !r.had).map((r) => '- ' + prName(r)).concat(o.coins ? ['- ' + prCoinsLine(o)] : []);
  if (!lines.length) return null;
  return mailPush({ kind: 'news', id: 'pr_' + o.key, keep: true, from: tt('ks.letter_from', 'Gerald'), title: tt('pr.letter_title', 'A little gift for our friends'),
    text: tt('pr.letter_text', 'Dear friend,\nThank you for being part of Doodle Doggo. Your gift code {code} brought this:\n{list}\nGive your dog a pat from me.\nWith a happy waddle,\nGerald', { code: o.code, list: lines.join('\n') }) });
}

/* ---------------- the card ---------------- */
// the Delivered!-style card: each thing, and where it is. Coins fly to the counter from the card
function prCard(o) {
  if (!o) return null;
  const rows = o.rows.map((r) => `<div class="ks-got-row pr-row" data-pr="${esc(r.n)}"><span class="art">${prArt(r)}</span><div><b>${esc(prName(r))}</b><p class="small ks-where">${esc(prWhere(r))}</p></div></div>`).join('')
    + (o.coins ? `<div class="ks-got-row pr-row pr-coins"><span class="art">${ICON('coin')}</span><div><b>${esc(prCoinsLine(o))}</b><p class="small ks-where">${esc(tt('ks.where_coins', 'Added to your Paw Coins.'))}${typeof ksSettleNote === 'function' && o.coins > o.added ? esc(ksSettleNote(o.coins - o.added)) : ''}</p></div></div>` : '')
    + (o.wait ? `<p class="small pr-wait">${esc(tt('pr.wait', 'One more thing is on its way. It arrives with the next game update.'))}</p>` : '');
  if (!modal.hidden) closeModal();
  SFX.boop(880);
  const p = openModal(esc(tt('pr.got_h', 'A gift for you!')), `<p class="ks-got-hi">${esc(tt('pr.got_hi', 'Code {code}: this is yours now.', { code: o.code }))}</p>${rows}<p class="small pr-mail">${esc(tt('pr.got_mail', 'Gerald sent you a letter about it.'))}</p>`,
    { cls: 'ks ks-got pr-got', foot: `<button class="btn yes big" type="button" id="prGotOk">${esc(tt('ks.got_ok', 'Yay!'))}</button>` });
  $('#prGotOk', p).onclick = () => { SFX.click(); closeModal(); };
  if (o.added > 0) coinFly($('.pr-coins .art', p) || $('#prGotOk', p), o.added, { gain: o.added, delay: 420 });
  setTimeout(() => { try { $('#prGotOk', p).focus({ preventScroll: true }); } catch (e) { /* gone */ } }, 30);
  return p;
}

/* ---------------- the box ---------------- */
const prErrText = (code) => ({
  unknown: tt('pr.err_unknown', 'That code is not working. Check the letters, or it may be over.'),
  used: tt('pr.err_used', 'You have used this code already. Its gift is in your game.'),
  gone: tt('pr.err_gone', 'So many friends were quicker! This code has no gifts left.'),
  rate_limited: tt('pr.err_slow', 'Lots of tries! Please wait a while and try again.'),
  empty: tt('pr.err_empty', 'Type a code first.'),
  login: tt('pr.guest', 'Gift codes are for players with the free account, so your gifts stay safe on every device.')
}[code] || tt('pr.err_offline', 'The code could not be checked right now. Please try again soon.'));
function prBoxHTML(where) {
  const m = prMode(); if (m === 'off') return '';
  const head = where === 'sheet' ? '' : `<h4 class="clh">${esc(tt('pr.title', 'Have a code?'))}</h4>`;
  if (m !== 'ok') return `<section class="prset" id="prBox" data-pr="guest">${head}<p class="small pr-guest">${esc(prErrText('login'))}</p><div class="clrow"><button class="btn yes" type="button" id="prAcct">${esc(tt('pr.make_account', 'Make the free account'))}</button></div></section>`;
  return `<section class="prset" id="prBox" data-pr="ok">${head}<form class="pr-form" id="prForm" novalidate><label class="clfield pr-field" for="prCode"><span>${esc(tt('pr.label', 'Gift code'))}</span>`
    + `<input id="prCode" type="text" inputmode="text" autocapitalize="characters" autocorrect="off" autocomplete="off" spellcheck="false" maxlength="${PR_LEN}" enterkeyhint="go" placeholder="${esc(tt('pr.placeholder', 'DOGGO-XXXX'))}"></label>`
    + `<button class="btn yes pr-go" type="submit" id="prGo">${esc(tt('pr.use', 'Use code'))}</button></form>`
    + `<p class="pr-msg" id="prMsg" role="status" aria-live="polite"></p><p class="small pr-note">${esc(tt('pr.note', 'The code goes only to our server, to check it.'))}</p></section>`;
}
let prBusy = false;
function prBind(p) {
  const box = $('#prBox', p); if (!box) return;
  const ac = $('#prAcct', box);
  if (ac) ac.onclick = () => { SFX.click(); if (!modal.hidden) closeModal(); setTimeout(() => { if (typeof cloudOpen === 'function') cloudOpen(); if (typeof clGo === 'function') clGo('reg'); }, 60); };
  const f = $('#prForm', box); if (!f) return;
  f.onsubmit = (e) => { e.preventDefault(); prSubmit(box); };
}
function prSay(box, code, good) { const m = $('#prMsg', box); if (!m) return; m.textContent = code ? prErrText(code) : ''; m.dataset.kind = good ? 'good' : code ? 'err' : ''; }
async function prSubmit(box) {
  if (prBusy) return null;
  const inp = $('#prCode', box), btn = $('#prGo', box), code = String(inp ? inp.value : '').trim();
  if (!code) { prSay(box, 'empty'); if (inp) inp.focus(); return null; }
  SFX.click(); prBusy = true; if (btn) btn.disabled = true; prSay(box, '');
  try { return await prRedeem(code, box); } finally { prBusy = false; if (btn && btn.isConnected) btn.disabled = false; }
}
// one redeem: the card on success, a kind line in the box otherwise. Resolves the grant (or null)
async function prRedeem(code, box) {
  if (prMode() !== 'ok' || !prWorker()) { if (box) prSay(box, prMode() === 'ok' ? 'offline' : 'login'); return null; }
  let r = null; try { r = await clApi('POST', '/promo/redeem', { code: String(code).slice(0, 80) }); } catch (e) { r = null; }
  if (r && r.ok && r.data && r.data.ok) {
    const o = prGrant({ key: r.data.key, code: r.data.code, reward: r.data.reward, at: r.data.at });
    if (o) { prCard(o); return o; }
    if (box && box.isConnected) prSay(box, 'used'); return null; // this save had it already (a synced save)
  }
  const err = r && r.data && r.data.error ? r.data.error : 'offline';
  if (err === 'used') { // the answer of an earlier tap may have been lost on the way: what the account used and this save lacks comes back now
    const got = await prRestore(true);
    const mine = got && got.find((o) => o.key === (typeof code === 'string' ? code.normalize('NFKC').toUpperCase().replace(/[\s\-_.‐-―−ー・－]/g, '') : ''));
    if (mine) { prCard(mine); return mine; }
  }
  if (box && box.isConnected) prSay(box, err);
  return null;
}

/* ---------------- restore (a new device, a fresh save, a lost answer) ---------------- */
let prPollUid = null, prPollP = null;
// quiet: no toast. Resolves the grants made (an array), or null when the Worker was not asked
async function prRestore(quiet) {
  if (!S || prMode() !== 'ok' || !prWorker()) return null;
  let r = null; try { r = await clApi('GET', '/promo/mine'); } catch (e) { r = null; }
  if (!r || !r.ok || !r.data || !Array.isArray(r.data.redemptions)) return null;
  prPollUid = CL.uid;
  const out = r.data.redemptions.map((x) => prGrant(x)).filter(Boolean);
  if (out.length && !quiet) toast(tt('pr.restored', 'Your gift codes came back: {list}. Gerald sent you a letter.', { list: tlist(out.map((o) => o.code)) }), 'gold');
  return out;
}
// on start (after the cloud has started) and when another account signs in on this page
function prPoll() {
  if (!S || prMode() !== 'ok' || !prWorker() || prPollP || prPollUid === CL.uid) return Promise.resolve(null);
  prPollP = prRestore(false).catch(() => null).finally(() => { prPollP = null; });
  return prPollP;
}

/* ---------------- Settings, the phone menu ---------------- */
function prSettingsHTML() { return prBoxHTML('settings'); }
function prMenuBtn() { return prMode() === 'off' || !S ? '' : `<button class="btn big" id="mmPromo" type="button"><span class="ic">${ICON('star')}</span>${esc(tt('pr.title', 'Have a code?'))}</button>`; }
function prOpen() {
  if (!S || prMode() === 'off') return null;
  const p = openModal(esc(tt('pr.title', 'Have a code?')), prBoxHTML('sheet'), { cls: 'pr-sheet' });
  prBind(p);
  const i = $('#prCode', p); if (i && !isPhone()) setTimeout(() => { try { i.focus({ preventScroll: true }); } catch (e) { /* gone */ } }, 30);
  return p;
}

/* ---------------- test hook ---------------- */
function prExpose() {
  if (!window.__paw || window.__paw.pr) return;
  window.__paw.pr = {
    ui: () => prUI(), mode: () => prMode(), fields: (s) => prFields(s), grant: (rec) => prGrant(rec), card: (o) => prCard(o), open: () => prOpen(), redeem: (c) => prRedeem(c, $('#prBox')),
    restore: (q) => prRestore(q), poll: () => { prPollUid = null; return prPoll(); }, wait: () => prWaitTick(), kind: (n) => prKind(n), catalog: () => prCatalog(), max: PR_COIN_MAX, flag: PROMO_UI
  };
}
on('game:ready', () => {
  if (S) { prFields(S); prWaitTick(); }
  setTimeout(prExpose, 0);
  setTimeout(() => { if (!S || prMode() !== 'ok') return; Promise.resolve(typeof clStart === 'function' ? clStart() : null).then(() => prPoll()).catch(() => {}); }, 1500);
});
on('yard:enter', () => { if (S) prFields(S); if (window.__paw && !window.__paw.pr) prExpose(); if (S && prMode() === 'ok' && prWorker() && prPollUid !== CL.uid) setTimeout(prPoll, 800); }); // a log in on this page loads the account's save and lands in the yard
setTimeout(prExpose, 0);
