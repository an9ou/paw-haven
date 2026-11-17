/* ======================= v2.25.5 GIFT CODES (PROMO.md; owner, 16 Nov 2026) =======================
   "Have a code?": a box in Settings and in the phone "..." menu. The code typed goes only to our Worker (POST /promo/redeem), which checks it
   and answers with what it gives: code-only items (any item name from the tables: CLOTHES, HM_DECOR, HOUSES, BEDS, TOYS; the `promo: true`
   ones are made for codes), a few Paw Coins (500 at most, the Worker's ceiling) and dog-safe treats (FOOD). Nothing is paid, ever.
   Only signed-in cloud-save accounts (an email account): a guest sees one kind line and a button to make the free account.
   Granting is local: items to the Wardrobe / house / houses / beds / toys, coins with addCoins + coinFly from the card, treats to the pantry,
   a Delivered!-style card and Gerald's short letter. A new device (or a fresh save on the same account) gets back every redemption the save
   lacks from GET /promo/mine: the record holds exactly what was granted, so coins never come twice in one save.
   Save (additive, v stays 1; pmFields from migrate() and freshState()):
     S.promo.used  normalised codes (the Worker's key) granted in this save
     S.promo.wait  [{ k, n, q }]: an item or treat this build does not know yet (an older build than the code), given once it is known
   Build flag: PROMO_UI. false hides the box everywhere and asks the Worker nothing (the iOS build may need it off: App Store guideline 3.1.1
   lets an app unlock content with its own codes only through App Store offer codes). Test hook: window.__paw.pm. */
const PROMO_UI = true; // the build flag (PROMO.md 7): one line to switch gift codes off for a build
const PM_COIN_MAX = 500; // the Worker's PROMO_COIN_MAX: a reward never adds more, whatever reaches the game
const PM_LEN = 40;
function pmUI() { return PROMO_UI && !(typeof window !== 'undefined' && window.__ddPromoOff); } // __ddPromoOff: tests switch the build flag off
// 'ok' (a signed-in email account), 'guest' (cloud on, no account yet), 'off' (no cloud here: the claude.ai copy, the harness, PROMO_UI off).
// Tests: window.__ddPromoMode or prefs.promoMode set it
function pmMode() {
  if (!pmUI()) return 'off';
  const o = (typeof window !== 'undefined' && window.__ddPromoMode) || (typeof prefs !== 'undefined' && prefs && prefs.promoMode); if (o) return o;
  if (typeof CL === 'undefined' || !CL.on) return 'off';
  return CL.uid && !CL.anon && CL.email ? 'ok' : 'guest';
}
const pmWorker = () => typeof CL !== 'undefined' && !!CL.on && !!CL.uid;

/* ---------------- save ---------------- */
function pmFields(s) {
  if (!s) return s;
  if (!s.promo || typeof s.promo !== 'object' || Array.isArray(s.promo)) s.promo = {};
  if (!Array.isArray(s.promo.used)) s.promo.used = [];
  if (!Array.isArray(s.promo.wait)) s.promo.wait = [];
  return s;
}

/* ---------------- what a name is ---------------- */
const pmTreat = (n) => typeof n === 'string' && n !== 'Fresh Water' && FOOD.some((f) => f.n === n);
function pmKind(n) {
  if (typeof n !== 'string' || !n) return null;
  if (CLOTHES.some((c) => c.n === n)) return 'clothes';
  if (typeof HM_DECOR !== 'undefined' && Object.prototype.hasOwnProperty.call(HM_DECOR, n)) return 'decor'; // own keys only (never 'constructor', 'toString' ...)
  if (HOUSES.some((h) => h.n === n)) return 'houses';
  if (typeof BEDS !== 'undefined' && BEDS.some((b) => b.n === n)) return 'beds';
  if (TOYS.some((t) => t.n === n)) return 'toys';
  return null;
}
function pmOwns(n, k) {
  if (k === 'decor') return !!(S.decor && S.decor[n]);
  if (k === 'beds') return Array.isArray(S.beds) && S.beds.includes(n);
  return Array.isArray(S.inv[k]) && S.inv[k].includes(n);
}
function pmGive(n, k) {
  if (k === 'decor') { hmDecorFields(); S.decor[n] = { got: localISO(), out: false }; return; } // it waits to be put out (Arrange the yard / house)
  if (k === 'beds') { if (!Array.isArray(S.beds)) S.beds = []; S.beds.push(n); return; }
  if (!Array.isArray(S.inv[k])) S.inv[k] = [];
  S.inv[k].push(n);
}
// every name a code may give, for tools/promo_items.json (tools/promo_items.js): the `promo` items, and what the shops sell (never the Kind
// shop's paid looks or the earned rewards such as the Bond 10 Golden Collar). Treats: FOOD without Fresh Water
function pmCatalog() {
  const out = [], seen = new Set();
  const add = (x, kind) => { if (!x || !x.n || seen.has(x.n)) return; if (!(x.promo || (!x.reward && !x.ks && (x.price || 0) > 0))) return; seen.add(x.n); out.push(Object.assign({ n: x.n, kind }, x.promo ? { promo: true } : {}, x.slot ? { slot: x.slot } : {})); };
  CLOTHES.forEach((x) => add(x, 'clothes'));
  Object.keys(HM_DECOR).forEach((n) => add(Object.assign({ n }, HM_DECOR[n]), 'decor'));
  HOUSES.forEach((x) => add(x, 'houses'));
  BEDS.forEach((x) => add(x, 'beds'));
  TOYS.forEach((x) => add(x, 'toys'));
  return { items: out, treats: FOOD.filter((f) => pmTreat(f.n)).map((f) => f.n) };
}

/* ---------------- granting ---------------- */
// rec: { key, code, reward: { items, coins, treats }, at } from the Worker. Grants once per save (S.promo.used). Returns what happened, or null
function pmGrant(rec) {
  if (!S || !rec || typeof rec.key !== 'string' || !rec.key) return null;
  pmFields(S);
  if (S.promo.used.includes(rec.key)) return null;
  const R = rec.reward && typeof rec.reward === 'object' ? rec.reward : {};
  const out = { key: rec.key, code: String(rec.code || rec.key).slice(0, 60), rows: [], coins: 0, added: 0, wait: 0 };
  (Array.isArray(R.items) ? R.items : []).slice(0, 6).forEach((n) => {
    const k = pmKind(n);
    if (!k) { S.promo.wait.push({ k: rec.key, n: String(n).slice(0, 60) }); out.wait++; return; } // an item this build does not know yet
    if (pmOwns(n, k)) { out.rows.push({ n, k, had: true }); return; }
    pmGive(n, k); out.rows.push({ n, k });
  });
  const T = R.treats && typeof R.treats === 'object' && !Array.isArray(R.treats) ? R.treats : {};
  Object.keys(T).slice(0, 6).forEach((n) => {
    const q = Math.max(0, Math.min(10, Math.floor(Number(T[n]) || 0))); if (!q) return;
    if (!pmTreat(n)) { S.promo.wait.push({ k: rec.key, n: String(n).slice(0, 60), q }); out.wait++; return; }
    S.inv.food[n] = (S.inv.food[n] || 0) + q; out.rows.push({ n, k: 'food', q });
  });
  const c = Math.max(0, Math.min(PM_COIN_MAX, Math.floor(Number(R.coins) || 0)));
  if (c) { const g = addCoinsD(c, { raw: true }); out.coins = c; out.added = g.n - g.d; } // coins that settle a Kind shop refund: the card says so (ksSettleNote), else the settle toast
  S.promo.used.push(rec.key);
  out.letter = !!pmLetter(out); // no letter when nothing new came (every item owned already, no coins or treats)
  markDirty(); updateHUD(); saveNow();
  return out;
}
// items a code gave that this build did not know yet: given as soon as a newer build knows them (once)
function pmWaitTick() {
  if (!S || !S.promo || !S.promo.wait.length) return 0;
  let n = 0;
  S.promo.wait = S.promo.wait.filter((w) => {
    if (w.q) { if (!pmTreat(w.n)) return true; S.inv.food[w.n] = (S.inv.food[w.n] || 0) + Math.min(10, w.q | 0); n++; return false; }
    const k = pmKind(w.n); if (!k) return true;
    if (!pmOwns(w.n, k)) pmGive(w.n, k);
    n++; return false;
  });
  if (n) { markDirty(); saveNow(); }
  return n;
}

/* ---------------- words ---------------- */
const pmName = (r) => (r.k === 'food' ? tt('pm.treat_n', '{n} × {item}', { n: tnum(r.q), item: homeName(r.n) }) : homeName(r.n));
function pmWhere(r) {
  if (r.had) return tt('pm.where_had', 'You had this one already.');
  if (r.k === 'clothes') return tt('pm.where_clothes', 'Find it in the Wardrobe.');
  if (r.k === 'decor') return tt('pm.where_decor', '{room, select, house {Find it under Arrange the house, ready to put out.} other {Find it under Arrange the yard, ready to put out.}}', { room: typeof hoRoomOf === 'function' ? hoRoomOf(r.n) : 'yard' });
  if (r.k === 'houses') return tt('pm.where_house', 'It is with your houses now, ready to move in.');
  if (r.k === 'beds') return tt('pm.where_bed', 'It is in the Cozy House now.');
  if (r.k === 'toys') return tt('pm.where_toy', 'Find it with your toys.');
  return tt('pm.where_food', 'In your pantry now.');
}
const pmCoinsLine = (o) => tt('pm.coins_n', '{n} coins', { n: tnum(o.coins) });
function pmArt(r) {
  try {
    if (r.k === 'houses') return art('house', r.n);
    if (r.k === 'clothes' || r.k === 'decor' || r.k === 'beds') return ksLookArt(r.n);
    return itemArt(r.n);
  } catch (e) { return ICON('star'); }
}
// Gerald's letter: what the code brought, kept to reread
function pmLetter(o) {
  const lines = o.rows.filter((r) => !r.had).map((r) => '- ' + pmName(r)).concat(o.coins ? ['- ' + pmCoinsLine(o)] : []);
  if (!lines.length) return null;
  return mailPush({ kind: 'news', id: 'pr_' + o.key, keep: true, from: tt('ks.letter_from', 'Gerald'), title: tt('pm.letter_title', 'A little gift for our friends'),
    text: tt('pm.letter_text', 'Dear friend,\nThank you for being part of Doodle Doggo. Your gift code {code} brought this:\n{list}\nGive your dog a pat from me.\nWith a happy waddle,\nGerald', { code: o.code, list: lines.join('\n') }) });
}

/* ---------------- the card ---------------- */
// the Delivered!-style card: each thing, and where it is. Coins fly to the counter from the card
function pmCard(o) {
  if (!o) return null;
  const rows = o.rows.map((r) => `<div class="ks-got-row pm-row" data-pm="${esc(r.n)}"><span class="art">${pmArt(r)}</span><div><b>${esc(pmName(r))}</b><p class="small ks-where">${esc(pmWhere(r))}</p></div></div>`).join('')
    + (o.coins ? `<div class="ks-got-row pm-row pm-coins"><span class="art">${ICON('coin')}</span><div><b>${esc(pmCoinsLine(o))}</b><p class="small ks-where">${esc(tt('ks.where_coins', 'Added to your Paw Coins.'))}${typeof ksSettleNote === 'function' && o.coins > o.added ? esc(ksSettleNote(o.coins - o.added)) : ''}</p></div></div>` : '')
    + (o.wait ? `<p class="small pm-wait">${esc(tt('pm.wait', 'One more thing is on its way. It arrives with the next game update.'))}</p>` : '');
  if (!modal.hidden) closeModal();
  SFX.boop(880);
  const p = openModal(esc(tt('pm.got_h', 'A gift for you!')), `<p class="ks-got-hi">${esc(tt('pm.got_hi', 'Code {code}: this is yours now.', { code: o.code }))}</p>${rows}${o.letter ? `<p class="small pm-mail">${esc(tt('pm.got_mail', 'Gerald sent you a letter about it.'))}</p>` : ''}`,
    { cls: 'ks ks-got pm-got', foot: `<button class="btn yes big" type="button" id="pmGotOk">${esc(tt('ks.got_ok', 'Yay!'))}</button>` });
  $('#pmGotOk', p).onclick = () => { SFX.click(); closeModal(); };
  if (o.added > 0) coinFly($('.pm-coins .art', p) || $('#pmGotOk', p), o.added, { gain: o.added, delay: 420 });
  setTimeout(() => { try { $('#pmGotOk', p).focus({ preventScroll: true }); } catch (e) { /* gone */ } }, 30);
  return p;
}

/* ---------------- the box ---------------- */
const pmErrText = (code) => ({
  unknown: tt('pm.err_unknown', 'That code is not working. Check the letters, or it may be over.'),
  used: tt('pm.err_used', 'You have used this code already. Its gift is in your game.'),
  batch_used: tt('pm.err_batch', 'You already used a code from this gift batch.'), // one code of a batch per account (another code of it)
  had: tt('pm.err_had', 'This save already has this gift.'), // this save has the code's key already (from this or another account): nothing asked, nothing spent
  no_session: tt('pm.err_session', 'You were logged out on this device. Log in again, then try the code.'), // 401: the login expired (clApi has dropped it)
  gone: tt('pm.err_gone', 'So many friends were quicker! This code has no gifts left.'),
  rate_limited: tt('pm.err_slow', 'Lots of tries! Please wait a while and try again.'),
  empty: tt('pm.err_empty', 'Type a code first.'),
  login: tt('pm.guest', 'Gift codes are for players with the free account, so your gifts stay safe on every device.')
}[code] || tt('pm.err_offline', 'The code could not be checked right now. Please try again soon.'));
function pmBoxHTML(where) {
  const m = pmMode(); if (m === 'off') return '';
  const head = where === 'sheet' ? '' : `<h4 class="clh">${esc(tt('pm.title', 'Have a code?'))}</h4>`;
  if (m !== 'ok') return `<section class="pmset" id="pmBox" data-pm="guest">${head}<p class="small pm-guest">${esc(pmErrText('login'))}</p><div class="clrow"><button class="btn yes" type="button" id="pmAcct">${esc(tt('pm.make_account', 'Make the free account'))}</button></div></section>`;
  return `<section class="pmset" id="pmBox" data-pm="ok">${head}<form class="pm-form" id="pmForm" novalidate><label class="clfield pm-field" for="pmCode"><span>${esc(tt('pm.label', 'Gift code'))}</span>`
    + `<input id="pmCode" type="text" inputmode="text" autocapitalize="characters" autocorrect="off" autocomplete="off" spellcheck="false" maxlength="${PM_LEN}" enterkeyhint="go" placeholder="${esc(tt('pm.placeholder', 'DOGGOXXXX'))}"></label>`
    + `<button class="btn yes pm-go" type="submit" id="pmGo">${esc(tt('pm.use', 'Use code'))}</button></form>`
    + `<p class="pm-msg" id="pmMsg" role="status" aria-live="polite"></p><div class="clrow pm-relog" hidden><button class="btn yes" type="button" id="pmLogin">${esc(tt('cloud.log_in', 'Log in'))}</button></div><p class="small pm-note">${esc(tt('pm.note', 'The code goes only to our server, to check it.'))}</p></section>`;
}
let pmBusy = false;
function pmBind(p) {
  const box = $('#pmBox', p); if (!box) return;
  const ac = $('#pmAcct', box);
  const cloudTo = (ui) => () => { SFX.click(); if (!modal.hidden) closeModal(); setTimeout(() => { if (typeof cloudOpen === 'function') cloudOpen(); if (typeof clGo === 'function') clGo(ui); }, 60); };
  if (ac) ac.onclick = cloudTo('reg');
  const li = $('#pmLogin', box); if (li) li.onclick = cloudTo('login');
  const f = $('#pmForm', box); if (!f) return;
  f.onsubmit = (e) => { e.preventDefault(); pmSubmit(box); };
}
function pmSay(box, code, good) {
  const m = $('#pmMsg', box); if (!m) return; m.textContent = code ? pmErrText(code) : ''; m.dataset.kind = good ? 'good' : code ? 'err' : '';
  const rl = $('.pm-relog', box); if (rl) rl.hidden = code !== 'no_session'; // an expired login: a Log in button right under the line
}
// the Worker's key for a typed code (promoNorm in cloudflare/worker.js): upper case, no spaces, dashes, dots or underscores, full-width as plain
const pmKey = (c) => (typeof c === 'string' ? c.normalize('NFKC').toUpperCase().replace(/[\s\-_.‐-―−ー・－]/g, '') : '');
async function pmSubmit(box) {
  if (pmBusy) return null;
  const inp = $('#pmCode', box), btn = $('#pmGo', box), code = String(inp ? inp.value : '').trim();
  if (!code) { pmSay(box, 'empty'); if (inp) inp.focus(); return null; }
  SFX.click(); pmBusy = true; if (btn) btn.disabled = true; pmSay(box, '');
  try { return await pmRedeem(code, box); } finally { pmBusy = false; if (btn && btn.isConnected) btn.disabled = false; }
}
// one redeem: the card on success, a kind line in the box otherwise. Resolves the grant (or null)
async function pmRedeem(code, box) {
  if (pmMode() !== 'ok' || !pmWorker()) { if (box) pmSay(box, pmMode() === 'ok' ? 'offline' : 'login'); return null; }
  if (S && pmFields(S).promo.used.includes(pmKey(code))) { if (box && box.isConnected) pmSay(box, 'had'); return null; } // asked nothing: no account's slot is spent
  let r = null; try { r = await clApi('POST', '/promo/redeem', { code: String(code).slice(0, 80) }); } catch (e) { r = null; }
  if (r && r.ok && r.data && r.data.ok) {
    const o = pmGrant({ key: r.data.key, code: r.data.code, reward: r.data.reward, at: r.data.at });
    if (o) { pmCard(o); return o; }
    if (box && box.isConnected) pmSay(box, 'had'); return null; // this save had it already under another spelling of the key (a synced save)
  }
  const err = r && r.status === 401 ? 'no_session' : r && r.data && r.data.error ? r.data.error : 'offline';
  if (err === 'used') { // the answer of an earlier tap may have been lost on the way: what the account used and this save lacks comes back now
    const got = await pmRestore(true);
    const mine = got && got.find((o) => o.key === pmKey(code));
    if (mine) { pmCard(mine); return mine; }
  }
  if (box && box.isConnected) pmSay(box, err);
  return null;
}

/* ---------------- restore (a new device, a fresh save, a lost answer) ---------------- */
let pmPollUid = null, pmPollP = null;
// quiet: no toast. Resolves the grants made (an array), or null when the Worker was not asked
async function pmRestore(quiet) {
  if (!S || pmMode() !== 'ok' || !pmWorker()) return null;
  let r = null; try { r = await clApi('GET', '/promo/mine'); } catch (e) { r = null; }
  if (!r || !r.ok || !r.data || !Array.isArray(r.data.redemptions)) return null;
  pmPollUid = CL.uid;
  const out = r.data.redemptions.map((x) => pmGrant(x)).filter(Boolean);
  const list = tlist(out.map((o) => o.code));
  if (out.length && !quiet) toast(out.some((o) => o.letter) ? tt('pm.restored', 'Your gift codes came back: {list}. Gerald sent you a letter.', { list }) : tt('pm.restored_nl', 'Your gift codes came back: {list}.', { list }), 'gold');
  return out;
}
// on start (after the cloud has started) and when another account signs in on this page
// It waits for the cloud's own pull first (at most 10 s): a newer cloud save loads before anything is granted, so a grant never lands in a save
// that is about to be replaced (a save that lacks a code gets it on the next look anyway)
async function pmCloudIdle() { for (let i = 0; i < 40 && typeof CL !== 'undefined' && (CL.pulling || CL.pending || CL.signP); i++) await new Promise((r) => setTimeout(r, 250)); }
function pmPoll() {
  if (!S || pmMode() !== 'ok' || !pmWorker() || pmPollP || pmPollUid === CL.uid) return Promise.resolve(null);
  pmPollP = pmCloudIdle().then(() => pmRestore(false)).catch(() => null).finally(() => { pmPollP = null; });
  return pmPollP;
}

/* ---------------- Settings, the phone menu ---------------- */
function pmSettingsHTML() { return pmBoxHTML('settings'); }
function pmMenuBtn() { return pmMode() === 'off' || !S ? '' : `<button class="btn big" id="mmPromo" type="button"><span class="ic">${ICON('star')}</span>${esc(tt('pm.title', 'Have a code?'))}</button>`; }
function pmOpen() {
  if (!S || pmMode() === 'off') return null;
  const p = openModal(esc(tt('pm.title', 'Have a code?')), pmBoxHTML('sheet'), { cls: 'pm-sheet' });
  pmBind(p);
  rsKeyboard(p); // phones: room under the field as tall as the on-screen keyboard (--rs-kb), and the field scrolls up into view (22d_reset.js)
  const i = $('#pmCode', p); if (i && !isPhone()) setTimeout(() => { try { i.focus({ preventScroll: true }); } catch (e) { /* gone */ } }, 30);
  return p;
}

/* ---------------- test hook ---------------- */
function pmExpose() {
  if (!window.__paw || window.__paw.pm) return;
  window.__paw.pm = {
    ui: () => pmUI(), mode: () => pmMode(), fields: (s) => pmFields(s), grant: (rec) => pmGrant(rec), card: (o) => pmCard(o), open: () => pmOpen(), redeem: (c) => pmRedeem(c, $('#pmBox')), say: (code) => pmSay($('#pmBox'), code),
    restore: (q) => pmRestore(q), settings: () => openSettings(), more: () => openMore(), poll: () => { if (pmPollP) return pmPollP; pmPollUid = null; return pmPoll(); }, polled: () => pmPollUid === CL.uid && !pmPollP, wait: () => pmWaitTick(), kind: (n) => pmKind(n), catalog: () => pmCatalog(), max: PM_COIN_MAX, flag: PROMO_UI
  };
}
on('game:ready', () => {
  if (S) { pmFields(S); pmWaitTick(); }
  setTimeout(pmExpose, 0);
  setTimeout(() => { if (!S || pmMode() !== 'ok') return; Promise.resolve(typeof clStart === 'function' ? clStart() : null).then(() => pmPoll()).catch(() => {}); }, 1500);
});
on('yard:enter', () => { if (S) pmFields(S); if (window.__paw && !window.__paw.pm) pmExpose(); if (S && pmMode() === 'ok' && pmWorker() && pmPollUid !== CL.uid) setTimeout(pmPoll, 800); }); // a log in on this page loads the account's save and lands in the yard
setTimeout(pmExpose, 0);
