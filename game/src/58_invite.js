/* ======================= v2.30 "Better together" part 1: the friend invite gift (V230.md 1-4). Tag fi, test hook window.__paw.fi ======================= */
// A new player who comes in through a friend's invite link and adds that friend: the Worker records it once (POST /invite/join) and both players
// get the Friendship Bandana and a letter from Gerald. The Worker decides who counts (a new account, the inviter older, an email account for the
// gift, at most 10 thank-yous per inviter); the game only asks (GET /invite/gifts) and grants once per save. No coins, no Bond, nothing paid.
// Off until NEWS_V230.date (btOn(), 49c_news.js); a guest (cloud save not on) is told kindly that the bandana waits for cloud save.
const FI_ITEM = 'Friendship Bandana', FI_CAP = 10;
const FI = { pollUid: null, pollP: null, joinP: null };
// code review 1: an older Worker answers a route it does not have with 404 not_found (the v2.30 Worker never uses that word on its own routes: no_code,
// not_friends, official...). Then both v2.30 features hide for this load (fiMode 'off', glOn false), and nothing waiting is dropped (S.fi.link, S.goal.q)
let BT_GONE = false;
const btGoneAns = (r) => !!r && r.status === 404 && !!r.data && r.data.error === 'not_found';
function btGoneSet() {
  if (BT_GONE) return; BT_GONE = true;
  try { if (typeof glBoardDraw === 'function') glBoardDraw(); } catch (e) { /* the board just stays until the next scene */ }
}
// the Worker's final answers to POST /invite/join (anything else: 401 a login gone, 429, 5xx, offline, a route missing: ask again later)
const FI_FINAL = ['no_code', 'self', 'bad', 'not_friends', 'official', 'not_new'];

/* ---------------- save (additive) ---------------- */
function fiFields(s) {
  if (!s) return s;
  if (!s.fi || typeof s.fi !== 'object' || Array.isArray(s.fi)) s.fi = {};
  const f = s.fi;
  if (typeof f.link !== 'string') f.link = '';
  f.inv = (typeof f.inv === 'string' && typeof frNormCode === 'function' && frNormCode(f.inv)) || ''; // final review: the link's code until the add card has shown once
  if (!['', 'now', 'later', 'no'].includes(f.join)) f.join = '';
  f.mine = f.mine ? 1 : 0; f.wait = f.wait ? 1 : 0;
  if (!Number.isInteger(f.n) || f.n < 0) f.n = 0; if (f.n > FI_CAP) f.n = FI_CAP;
  // code review 2: the joined friends already thanked, by the Worker's opaque row token t (never a user id): each is thanked once, whatever the order
  if (!Array.isArray(f.thx)) f.thx = []; f.thx = f.thx.filter((t) => typeof t === 'string' && t && t.length <= 32).slice(0, FI_CAP);
  return s;
}
// 'ok' (an email account: cloud save on), 'guest' (cloud on, no account yet), 'off' (before the date, no cloud here). Tests: window.__ddFiMode
function fiMode() {
  if (!btOn() || BT_GONE) return 'off';
  const o = typeof window !== 'undefined' && window.__ddFiMode; if (o) return o;
  if (typeof CL === 'undefined' || !CL.on) return 'off';
  return CL.uid && !CL.anon && CL.email ? 'ok' : 'guest';
}
const fiWorker = () => typeof CL !== 'undefined' && !!CL.on && !!CL.uid;
const fiKey = () => (typeof CL !== 'undefined' && CL.uid ? CL.uid + (CL.anon ? ':g' : ':e') : ''); // a guest who turns on cloud save keeps its user id: asked again
const fiOwns = () => !!(S && S.inv && Array.isArray(S.inv.clothes) && S.inv.clothes.includes(FI_ITEM));
const fiFriend = (name) => (Array.isArray(name) && typeof frPairName === 'function' && frPairName(name)) || tt('fr.a_friend', 'A friend');

/* ---------------- the invite link's code survives a reload (final review, 18 Nov) ---------------- */
// 50_friends.js keeps the code from /play/?friend= in memory only (FR.invite) and takes it off the address at once, and the add card waits for
// Puppy's first day with Gerald (about six minutes, frGuideHold). A new player who reloads or comes back later in that time lost the code, and both
// bandanas with it. So the code is kept in the save (S.fi.inv) until the add card has been shown once (FR.inviteShown): a reload still never opens
// Add a second time. Called from frInviteTry (the 4 s tick). Off before the launch
function fiLinkKeep() {
  if (!S || !btOn() || typeof FR === 'undefined') return;
  fiFields(S); const f = S.fi;
  if (FR.inviteShown) { if (f.inv) { f.inv = ''; markDirty(); } return; }
  if (FR.invite) { if (f.inv !== FR.invite) { f.inv = FR.invite; markDirty(); } }
  else if (f.inv && !f.join && !f.link) FR.invite = f.inv;
}
function fiLinkDone() { if (S && S.fi && S.fi.inv) { S.fi.inv = ''; markDirty(); } } // an add used the code (or let it go): frAdd, 50_friends.js

/* ---------------- the Worker ---------------- */
// after a friend add that came from the invite link (50_friends.js frAdd; also when the add answers "already friends"). now: straight from the Friends
// sheet (the card may open at once). Only a final answer clears S.fi.link: offline, a login gone (401), busy or a missing route: the next start asks again
async function fiJoin(code, now) {
  if (!S || fiMode() === 'off' || !code) return null;
  fiFields(S); if (S.fi.join) return S.fi.join;
  if (FI.joinP) return FI.joinP;
  S.fi.link = code; markDirty();
  FI.joinP = (async () => {
    let r = null; try { r = await frApi('POST', '/invite/join', { code }); } catch (e) { return null; }
    if (btGoneAns(r)) { btGoneSet(); return null; }
    const err = (r && r.data && r.data.error) || '';
    let gift = null;
    if (r && r.ok && r.data && (r.data.gift === 'now' || r.data.gift === 'later')) gift = r.data.gift;
    else if (r && err === 'used') gift = fiMode() === 'ok' ? 'now' : 'later';
    else if (r && !r.ok && FI_FINAL.includes(err)) gift = 'no';
    if (!gift) return null;
    S.fi.link = ''; S.fi.join = gift; markDirty(); saveNow();
    if (gift === 'later') { S.fi.wait = 1; fiWaitLetter('new', true); fiCard({ wait: 'new' }, now); }
    else if (gift === 'now') { FI.pollUid = null; await fiPoll(now); }
    return gift;
  })().finally(() => { FI.joinP = null; });
  return FI.joinP;
}
async function fiPoll(now) {
  if (!S || fiMode() === 'off' || !fiWorker()) return null;
  if (FI.pollP) return FI.pollP;
  FI.pollP = (async () => {
    let r = null; try { r = await clApi('GET', '/invite/gifts'); } catch (e) { return null; }
    if (btGoneAns(r)) { btGoneSet(); return null; }
    if (!r || !r.ok || !r.data || typeof r.data !== 'object') return null;
    FI.pollUid = fiKey();
    return fiApply(r.data, true, now);
  })().finally(() => { FI.pollP = null; });
  return FI.pollP;
}
// what the Worker said: give what this save has not had yet (once), the letters, and the card
function fiApply(d, show, now) {
  if (!S || !d) return null;
  fiFields(S); const f = S.fi, out = { mine: false, from: null, joined: [], bandana: false, wait: '' };
  if (d.guest) {
    if ((d.mine || d.joined > 0) && !f.wait && !f.mine && !f.n) { f.wait = 1; out.wait = d.mine ? 'new' : 'host'; fiWaitLetter(out.wait); markDirty(); saveNow(); }
    return out;
  }
  if (d.mine && !f.mine) { f.mine = 1; out.mine = true; out.from = d.mine.name || null; }
  const J = Array.isArray(d.joined) ? d.joined : [], tok = (x) => (x && typeof x.t === 'string' && x.t.length <= 32 ? x.t : '');
  if (!f.thx.length && f.n > 0) f.thx = J.slice(0, f.n).map(tok).filter(Boolean); // a save from before the row tokens: its first n were thanked
  J.forEach((x) => { const t = tok(x); if (!t || f.thx.includes(t) || f.thx.length >= FI_CAP) return; f.thx.push(t); out.joined.push((x && x.name) || null); });
  f.n = f.thx.length;
  if (!out.mine && !out.joined.length) return out;
  if (!fiOwns()) { pmGive(FI_ITEM, 'clothes'); out.bandana = true; }
  // phone review 6: the "waiting" letter goes once the bandana is here; the card (or its toast) says Gerald wrote, so the letters come without a New mail toast
  if (f.wait && S.mail) { const i = S.mail.findIndex((m) => m && m.id === 'fi_wait'); if (i >= 0) { S.mail.splice(i, 1); if (typeof mailboxRefresh === 'function') mailboxRefresh(); } }
  if (out.mine) fiNewLetter(out.from, !!show);
  if (out.joined.length) fiHostLetter(out.joined, out.bandana && !out.mine, f.n, !!show);
  if (S.fi.join === '') S.fi.join = out.mine ? 'now' : '';
  markDirty(); updateHUD(); saveNow();
  if (show) fiCard(out, now);
  return out;
}

/* ---------------- Gerald's letters (kept to reread) ---------------- */
const fiFrom = () => tt('ks.letter_from', 'Gerald');
function fiNewLetter(from, quiet) {
  return mailPush({ kind: 'news', id: 'fi_new', keep: true, quiet, from: fiFrom(), title: tt('fi.new_title', 'Welcome to town!'),
    text: tt('fi.new_text', 'Dear friend,\n{friend} invited you to Doodle Doggo, and we are so glad you came.\nHere is a Friendship Bandana for {name}, the same one your friend\'s dog gets. Find it in the Wardrobe.\nWith a happy waddle,\nGerald', { friend: fiFriend(from), name: NAME() }) });
}
function fiHostLetter(names, bandana, n, quiet) {
  const list = tlist(names.map(fiFriend));
  // phone review 5: a fixed title (a list of names does not fit a letter's title on a phone); the names are in the body
  return mailPush({ kind: 'news', id: 'fi_host_' + n, keep: true, quiet, from: fiFrom(), title: tt('fi.host_h', 'New friends joined through your invite!'),
    text: tt('fi.host_text', 'Dear friend,\n{list} came to Doodle Doggo through your invite. Thank you for bringing new friends to town!\n{gift}\nWith a happy waddle,\nGerald', { list,
      gift: bandana ? tt('fi.host_gift', 'Here is a Friendship Bandana for {name}, to match. Find it in the Wardrobe.', { name: NAME() }) : tt('fi.host_more', 'Your dogs can wear matching bandanas now.') }) });
}
function fiWaitLetter(who, quiet) {
  return mailPush({ kind: 'news', id: 'fi_wait', keep: true, quiet, from: fiFrom(), title: tt('fi.wait_title', 'A bandana is waiting for you'),
    text: tt('fi.wait_text', 'Dear friend,\n{who, select, host {A new player joined Doodle Doggo through your invite. Thank you!} other {A friend invited you to Doodle Doggo, and we are so glad you came.}}\nA Friendship Bandana for {name} is waiting at the post office. It arrives as soon as you turn on cloud save (More, then Cloud save). Nothing is lost meanwhile, and there is no hurry.\nWith a happy waddle,\nGerald', { who, name: NAME() }) });
}

/* ---------------- the card ---------------- */
// phone review 1: the card never closes a window the player has open and never hides behind a story scene. Straight after a join from the Friends
// sheet (now) it takes the sheet's place; otherwise (a background poll) it opens only when the screen is calm (nwCalmNow), else a toast says it and
// Gerald's letter keeps it (like ksDelivered)
function fiCard(o, now) {
  if (!o || !S) return null;
  const story = typeof scPlaying === 'function' && scPlaying(), sheet = !modal.hidden && !!modal.querySelector('.fr-sheet');
  const calm = typeof nwCalmNow === 'function' ? nwCalmNow() : modal.hidden;
  if (story || !(calm || (now && (sheet || modal.hidden)))) {
    toast(o.wait ? tt('fi.wait_toast', 'Your Friendship Bandana is waiting for cloud save. Gerald sent you a letter about it.') : tt('fi.got_toast', 'A Friendship Bandana for you! Gerald sent you a letter about it.'), 'gold');
    return null;
  }
  if (!modal.hidden) closeModal(); // only the Friends sheet, just after the join
  SFX.boop(880);
  let body;
  if (o.wait) {
    body = `<div class="ks-got-row fi-row"><span class="art">${fiArt()}</span><div><b>${esc(homeName(FI_ITEM))}</b><p class="small ks-where">${esc(tt('fi.wait_where', 'It arrives as soon as you turn on cloud save. Nothing is lost meanwhile.'))}</p></div></div>`;
    const p = openModal(esc(tt('fi.wait_h', 'Your bandana is waiting')), `<p class="ks-got-hi">${esc(tt('fi.wait_hi', 'Your friend\'s invite brings you both a Friendship Bandana.'))}</p>${body}<p class="small fi-mail">${esc(tt('pm.got_mail', 'Gerald sent you a letter about it.'))}</p>`,
      { cls: 'ks ks-got fi-got fi-wait', foot: `<button class="btn" type="button" id="fiLater">${esc(tt('fi.later', 'Later'))}</button><button class="btn yes big" type="button" id="fiCloud">${esc(tt('fi.cloud', 'Turn on cloud save'))}</button>` });
    $('#fiLater', p).onclick = () => { SFX.click(); closeModal(); };
    $('#fiCloud', p).onclick = () => { SFX.click(); closeModal(); setTimeout(() => { if (typeof cloudOpen === 'function') cloudOpen(); if (typeof clGo === 'function') clGo('reg'); }, 60); };
    return p;
  }
  const who = o.mine ? tt('fi.got_new', 'A gift from {friend}\'s invite!', { friend: fiFriend(o.from) }) : tt('fi.got_host', '{list} joined through your invite!', { list: tlist(o.joined.map(fiFriend)) });
  const where = o.bandana ? tt('pm.where_clothes', 'Find it in the Wardrobe.') : tt('fi.got_had', 'Your dogs can wear matching bandanas now.');
  body = `<div class="ks-got-row fi-row"><span class="art">${fiArt()}</span><div><b>${esc(homeName(FI_ITEM))}</b><p class="small ks-where">${esc(where)}</p></div></div>`;
  const p = openModal(esc(tt('fi.got_h', 'Better together!')), `<p class="ks-got-hi">${esc(who)}</p>${body}<p class="small fi-mail">${esc(tt('pm.got_mail', 'Gerald sent you a letter about it.'))}</p>`,
    { cls: 'ks ks-got fi-got', foot: `<button class="btn yes big" type="button" id="fiOk">${esc(tt('ks.got_ok', 'Yay!'))}</button>` });
  $('#fiOk', p).onclick = () => { SFX.click(); closeModal(); };
  setTimeout(() => { try { $('#fiOk', p).focus({ preventScroll: true }); } catch (e) { /* gone */ } }, 30);
  return p;
}
function fiArt() { try { return ksLookArt(FI_ITEM); } catch (e) { return ICON('heart'); } }

/* ---------------- the Friends sheet line (50_friends.js frSheetHTML) ---------------- */
function fiSheetLine() {
  if (!S || fiMode() === 'off') return '';
  fiFields(S);
  const wait = S.fi.wait && !S.fi.mine && !S.fi.n && fiMode() !== 'ok';
  return `<p class="small fi-line" id="fiLine"><span class="fi-ic" aria-hidden="true">${fiArt()}</span><span>${esc(wait ? tt('fi.line_wait', 'Your Friendship Bandana is waiting: it arrives once you turn on cloud save.') : tt('fi.line', 'Invite a new player: you both get a Friendship Bandana.'))}</span></p>`;
}

/* ---------------- start-up ---------------- */
function fiStart() {
  if (!S || fiMode() === 'off') return;
  Promise.resolve(typeof clStart === 'function' ? clStart() : null).then(() => pmCloudIdle()).then(() => {
    if (!S || fiMode() === 'off') return null;
    if (S.fi.link && !S.fi.join) return fiJoin(S.fi.link); // a join that did not reach the Worker last time
    return FI.pollUid === fiKey() ? null : fiPoll();
  }).catch(() => {});
}
function fiExpose() {
  if (!window.__paw || window.__paw.fi) return;
  window.__paw.fi = {
    on: () => btOn(), mode: () => fiMode(), fields: (s) => fiFields(s), join: (c, now) => fiJoin(c, now), poll: (now) => { FI.pollUid = null; return fiPoll(now); }, apply: (d, show, now) => fiApply(d, show, now),
    card: (o, now) => fiCard(o, now), line: () => fiSheetLine(), item: FI_ITEM, cap: FI_CAP, owns: () => fiOwns(),
    gone: (v) => { if (v !== undefined) BT_GONE = !!v; return BT_GONE; }, linkKeep: () => fiLinkKeep(), start: () => fiStart(), busy: () => !!(FI.pollP || FI.joinP)
  };
}
on('game:ready', () => { if (S) fiFields(S); setTimeout(fiExpose, 0); setTimeout(fiStart, 1800); });
on('yard:enter', () => { if (S) fiFields(S); fiExpose(); if (S && fiMode() !== 'off' && fiWorker() && FI.pollUid !== fiKey()) setTimeout(fiStart, 900); }); // a log in on this page (a guest who turned on cloud save) lands in the yard
setTimeout(fiExpose, 0);
