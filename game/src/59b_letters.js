/* ======================= v2.32 "A letter from your dog": 59b_letters.js (tag lt, V232_letters.md) =======================
   Marketing idea 4, owner's go-ahead 16 Nov 2026: an opt-in weekly email "from" the player's dog, sent by the Worker (cloudflare/worker.js,
   the letters section) on Sundays 10:00 JST, built only from the cloud save the account already syncs.
   What the game does: a row in Settings (a switch, default off, the words of what is sent and how often, a sample letter made on the device),
     one gentle offer card ever, and a tiny weekly note in the save (S.ltr: Bond at the first look of each day and a few fixed tokens: walks,
     wishes, a trick, a market buy, a friend's visit, a new dog) that the Worker reads for the letter. No coins, no rewards, nothing paid.
     S.ltr is made on first use (ltFields), never by migrate(): a save from before the launch carries nothing of this.
   Who: an email account with cloud save on. The account has no verified email, so the Worker asks the address itself first (a confirmation
     email, state 'pending'); the game only shows the Worker's answer.
   Gate: LT_FROM. '' = no launch date yet: nothing shows, no /letters route is asked, S.ltr is never written. The Worker's LETTERS_FROM
     carries the same text (test_letters_worker checks). Tests turn it on with prefs.ltTest; never under webdriver otherwise.
   The letter's own words (lt.m_*) live here too, in ltM(): the sample letter uses them, the i18n tables carry them, and
     `node tools/letters_pack.js` packs them for the Worker (cloudflare/letters_text.js).
   Test hook: window.__paw.lt. Suites: letters (game), letters_worker (Worker). */
const LT_FROM = '2026-11-20'; // LAUNCH DATE (owner): 'YYYY-MM-DD' = on from 00:00 JST that day. Keep cloudflare/worker.js LETTERS_FROM the same
const LT_DAYS = 7, LT_BOND = 3, LT_KEEP_DAYS = 9, LT_EV_MAX = 40; // the offer: 7 days played or Bond 3 (and never on the first day)
const LT = { known: false, uid: null, pollP: null, gone: false, busy: false, calm: 0, readyAt: 0, wait: 45000, calmMs: 5000 };
function ltOn() { return (!navigator.webdriver && !!LT_FROM && jstISO() >= LT_FROM) || !!(typeof prefs !== 'undefined' && prefs && prefs.ltTest); }
// 'ok' (an email account: cloud save on), 'guest' (cloud here, no account on this device), 'off' (before the launch, an older Worker, no cloud)
function ltMode() {
  if (!ltOn() || LT.gone) return 'off';
  const o = typeof window !== 'undefined' && window.__ddLtMode; if (o) return o; // the fit audit has no cloud: it names the mode itself
  if (typeof CL === 'undefined' || !CL.on) return 'off';
  return CL.uid && !CL.anon && CL.email ? 'ok' : 'guest';
}

/* ---------------- save (additive, V232_letters.md 5) ---------------- */
function ltFields(s) {
  if (!s) return s;
  if (!s.ltr || typeof s.ltr !== 'object' || Array.isArray(s.ltr)) s.ltr = {};
  const L = s.ltr;
  if (!['', 'pending', 'on', 'stopped'].includes(L.st)) L.st = '';
  L.ask = L.ask ? 1 : 0;
  if (!Array.isArray(L.b)) L.b = []; if (!Array.isArray(L.ev)) L.ev = [];
  return s;
}
const ltDayBack = (n) => new Date(Date.now() + 9 * 3600e3 - n * 864e5).toISOString().slice(0, 10);
function ltTrim() {
  const L = S.ltr, old = ltDayBack(LT_KEEP_DAYS), keep = (e) => Array.isArray(e) && typeof e[0] === 'string' && e[0] >= old;
  L.ev = L.ev.filter(keep).slice(-LT_EV_MAX); L.b = L.b.filter(keep).slice(-LT_EV_MAX);
}
// one thing that happened today, as a fixed token: w walks, wi wishes come true, mk market buys, v friend visits, dg a new dog (counts a day), t a trick learned (its table name)
function ltNote(k, v) {
  if (!S || !ltOn()) return;
  ltFields(S); const d = jstISO(), E = S.ltr.ev;
  if (k === 't') { if (typeof v !== 'string' || !v || E.some((e) => e[0] === d && e[1] === 't' && e[2] === v)) return; E.push([d, 't', v]); }
  else { const n = Math.max(1, Math.floor(+v) || 1), e = E.find((x) => x[0] === d && x[1] === k); if (e) e[2] = Math.min(999, (e[2] | 0) + n); else E.push([d, k, n]); }
  ltTrim(); markDirty();
}
// the active dog's Bond at its first look of the Japan day: the Worker's "this week" starts from the oldest one in the week
function ltBondLook() {
  if (!S || !ltOn() || !S.dog || !S.bond) return;
  ltFields(S); const d = jstISO(), id = S.dog.id;
  if (S.ltr.b.some((x) => x[0] === d && x[1] === id)) return;
  S.ltr.b.push([d, id, S.bond.level | 0, Math.round(S.bond.pts) || 0]); ltTrim(); markDirty();
}
on('act', (e) => {
  if (!S || !e || !ltOn() || cur.mode === 'title' || cur.mode === 'adopt') return;
  try {
    ltBondLook();
    if (e.kind === 'walk') ltNote('w', 1);
    else if (e.kind === 'wish') ltNote('wi', 1);
    else if (e.kind === 'trick' && e.learned) ltNote('t', String(e.name || ''));
    else if (e.kind === 'buy' && ['market', 'stall', 'popup'].includes(e.shop)) ltNote('mk', 1);
    else if (e.kind === 'adopt' && S.dogs && S.dogs.length > 1) ltNote('dg', 1);
  } catch (er) { console.warn('lt act', er); }
});

/* ---------------- the letter's words ---------------- */
// Every line of the email, the confirmation email and the two small pages. The Worker formats the same messages (cloudflare/letters_text.js,
// packed from the i18n tables), so a change here is a change to the email: run `node tools/letters_pack.js` after the tables change
function ltM(k, v) {
  switch (k) {
    case 'subj': return tt('lt.m_subj', 'A letter from {name}', v);
    case 'subj_bye': return tt('lt.m_subj_bye', 'A last letter from {name}, for now', v);
    case 'hi': return tt('lt.m_hi', 'Dear human,');
    case 'open0': return tt('lt.m_open0', 'It is me, {name}. I wrote this with a crayon in my mouth, so please excuse the drool.', v);
    case 'open1': return tt('lt.m_open1', 'It is me, {name}. Gerald held the paper still. I did all the thinking.', v);
    case 'open2': return tt('lt.m_open2', '{name} here. I have news, and most of it is about me.', v);
    case 'days': return tt('lt.m_days', 'We have played together on {n, plural, one {# day} other {# days}} now. I counted on my paws, twice.', v);
    case 'bond_up': return tt('lt.m_bond_up', 'Big news: we reached Bond {n} this week. I did a spin about it.', v);
    case 'bond_grow': return tt('lt.m_bond_grow', 'Our Bond grew this week. We are at Bond {n}, and I can feel it in my tail.', v);
    case 'bond_max': return tt('lt.m_bond_max', 'We are at Bond 10. Best friends. I checked.');
    case 'bond': return tt('lt.m_bond', 'We are at Bond {n}. I like it here.', v);
    case 'trick': return tt('lt.m_trick', 'I learned a new trick: {trick}. I am a genius.', v);
    case 'trick0': return tt('lt.m_trick0', 'I learned a new trick. I am a genius.');
    case 'story': return tt('lt.m_story', "We finished chapter {n} of Gerald's storybook. I liked the part with me in it.", v);
    case 'wish': return tt('lt.m_wish', '{n, plural, one {A wish of mine came true this week} other {# of my wishes came true this week}}. You always know.', v);
    case 'newdog': return tt('lt.m_newdog', 'A new friend came home with us. I am showing them where the best naps are.');
    case 'visit': return tt('lt.m_visit', "A friend's dog came to visit our yard. I showed them the best smells.");
    case 'market': return tt('lt.m_market', 'We brought something home from the market. I sniffed it first, to be safe.');
    case 'walks': return tt('lt.m_walks', 'We went on {n, plural, one {# walk} other {# walks}} this week. I sniffed every single thing.', v);
    case 'plain': return tt('lt.m_plain', 'It was a quiet week. Quiet weeks have the best naps.');
    case 'close': return tt('lt.m_close', 'See you in the yard. I will be the one wagging.');
    case 'love': return tt('lt.m_love', 'Love,');
    case 'sig': return tt('lt.m_sig', '{name} ({breed})', v);
    case 'ps': return tt('lt.m_ps', 'P.S. I held the paper and checked the spelling. With a happy waddle, Gerald');
    case 'away1': return tt('lt.m_away1', 'It is me, {name}. I had a calm week in the yard. I tried three new nap spots and saved the best one for you.', v);
    case 'away2': return tt('lt.m_away2', '{name} here. Gerald and I have been watching the clouds. One of them looked like you, so we waved.', v);
    case 'away4': return tt('lt.m_away4', 'It is me, {name}. All is well in town. I have been practising my sit, and it is very good now.', v);
    case 'miss': return tt('lt.m_miss', 'I miss you a little, in the happy way.');
    case 'any': return tt('lt.m_any', 'There is no hurry at all. The yard is here whenever you like.');
    case 'bye1': return tt('lt.m_bye1', 'It is me, {name}. This is my last letter for now, so I do not fill up your mailbox.', v);
    case 'bye2': return tt('lt.m_bye2', 'I am happy and well looked after in town. If you ever visit again, I will write again.');
    case 'foot': return tt('lt.m_foot', 'You get this letter once a week because you turned on Letters from my dog in Doodle Doggo.');
    case 'foot_bye': return tt('lt.m_foot_bye', 'You turned on Letters from my dog in Doodle Doggo. No more letters will come unless you play again.');
    case 'unsub': return tt('lt.m_unsub', 'Stop these letters');
    case 'dog': return tt('lt.m_dog', 'dog');
    case 'c_subj': return tt('lt.m_c_subj', 'Please confirm: letters from your dog');
    case 'c_text': return tt('lt.m_c_text', 'Someone, we hope you, asked Doodle Doggo to send a short letter from their dog to this address every Sunday. If that was you, tap the button.');
    case 'c_btn': return tt('lt.m_c_btn', 'Yes, send me the letters');
    case 'c_ignore': return tt('lt.m_c_ignore', 'If that was not you, do nothing. No letters will be sent.');
    case 'c_exp': return tt('lt.m_c_exp', 'The button works for 48 hours.');
    case 'p_conf_h': return tt('lt.m_p_conf_h', 'Send the weekly letters?');
    case 'p_conf': return tt('lt.m_p_conf', 'One short letter from your dog, every Sunday. You can stop any time.');
    case 'p_conf_ok_h': return tt('lt.m_p_conf_ok_h', 'Letters are on');
    case 'p_conf_ok': return tt('lt.m_p_conf_ok', 'The first one comes on a Sunday. You can close this page.');
    case 'p_unsub_h': return tt('lt.m_p_unsub_h', 'Stop the weekly letters?');
    case 'p_unsub': return tt('lt.m_p_unsub', "Your dog will understand. You can turn them on again in the game's Settings.");
    case 'p_unsub_btn': return tt('lt.m_p_unsub_btn', 'Yes, stop them');
    case 'p_unsub_ok_h': return tt('lt.m_p_unsub_ok_h', 'Done. No more letters');
    case 'p_unsub_ok': return tt('lt.m_p_unsub_ok', "You can turn them on again any time in the game's Settings.");
    case 'p_bad_h': return tt('lt.m_p_bad_h', 'This link does not work any more');
    case 'p_bad': return tt('lt.m_p_bad', "It may be too old. You can change your letters in the game's Settings.");
    default: return tt('lt.m_p_busy', 'Too many tries. Please come back in an hour.');
  }
}
// the sample: this week's letter as the Worker would write it, from the notes in this save. Made on the device, nothing is sent
function ltSampleLines() {
  if (!S || !S.dog) return [];
  ltFields(S); const d = S.dog, name = d.name, from = ltDayBack(7), sum = (k) => S.ltr.ev.filter((e) => e[0] >= from && e[1] === k).reduce((a, e) => a + (e[2] | 0), 0);
  const lv = S.bond ? S.bond.level | 0 : 1, was = S.ltr.b.filter((x) => x[0] >= from && x[1] === d.id).sort((a, b) => (a[0] < b[0] ? -1 : 1))[0];
  const L = [ltM('hi'), ltM('open0', { name })];
  if (S.daysPlayed >= 2) L.push(ltM('days', { n: S.daysPlayed }));
  L.push(was && lv > was[2] ? ltM('bond_up', { n: lv }) : lv >= 10 ? ltM('bond_max') : was && was[2] === lv && S.bond.pts > was[3] ? ltM('bond_grow', { n: lv }) : ltM('bond', { n: lv }));
  const hl = [], tr = S.ltr.ev.filter((e) => e[0] >= from && e[1] === 't').pop();
  if (tr) hl.push(tr[2] === 'Signature' ? ltM('trick0') : ltM('trick', { trick: typeof tTrick === 'function' ? tTrick(tr[2]) : tr[2] }));
  const ch = S.story && S.story.c ? Math.max(0, ...Object.keys(S.story.c).filter((k) => String(S.story.c[k]) >= from && /^\d{4}-/.test(String(S.story.c[k]))).map(Number)) : 0;
  if (ch) hl.push(ltM('story', { n: ch }));
  if (sum('wi')) hl.push(ltM('wish', { n: sum('wi') }));
  if (sum('dg')) hl.push(ltM('newdog')); if (sum('v')) hl.push(ltM('visit')); if (sum('mk')) hl.push(ltM('market'));
  if (sum('w')) hl.push(ltM('walks', { n: sum('w') }));
  L.push(...(hl.length ? hl.slice(0, 2) : [ltM('plain')]), ltM('close'));
  return { lines: L, sign: [ltM('love'), ltM('sig', { name, breed: tbreed(d.key) })], ps: ltM('ps') };
}
function ltSampleHTML() {
  const s = ltSampleLines(); if (!s.lines) return '';
  return `<div class="ltr-letter" lang="${esc(PIM ? PIM.htmlLang(tlang()) : tlang())}"><p class="ltr-subj">${esc(ltM('subj', { name: NAME() }))}</p>${s.lines.map((l) => `<p>${esc(l)}</p>`).join('')}<p class="ltr-sign">${s.sign.map(esc).join('<br>')}</p><p class="ltr-ps">${esc(s.ps)}</p></div><p class="small ltr-snote">${esc(tt('lt.sample_note', 'This sample was made on your device. Nothing was sent.'))}</p>`;
}

/* ---------------- the Worker ---------------- */
const ltWorker = () => typeof CL !== 'undefined' && !!CL.on && !!CL.uid && !CL.anon;
const ltGoneAns = (r) => !!r && r.status === 404 && !!r.data && r.data.error === 'not_found'; // an older Worker, or one whose letters are still shut
const ltLangNow = () => { const c = tlang(); return PIM && PIM.CODES.includes(c) ? c : 'en'; };
function ltTake(r) { // the Worker's answer -> the save's echo. true when it was an answer
  if (ltGoneAns(r)) { LT.gone = true; ltRender(); return false; }
  const d = r && r.data, st = d && typeof d.state === 'string' ? d.state : null;
  if (!st || !['off', 'pending', 'on', 'stopped'].includes(st)) return false;
  LT.known = true; LT.uid = CL.uid; ltFields(S);
  const v = st === 'off' ? '' : st; if (S.ltr.st !== v) { S.ltr.st = v; markDirty(); }
  return true;
}
// quiet look: on start, when an account signs in on this page, when Settings opens. The game's language follows along
function ltPoll() {
  if (!S || ltMode() !== 'ok' || !ltWorker() || LT.pollP) return LT.pollP || Promise.resolve(null);
  LT.pollP = (async () => {
    let r = null; try { r = await clApi('GET', '/letters'); } catch (e) { return null; }
    if (!ltTake(r)) return null;
    const lang = ltLangNow();
    if ((S.ltr.st === 'on' || S.ltr.st === 'pending') && r.data.lang && r.data.lang !== lang) { try { ltTake(await clApi('POST', '/letters', { lang })); } catch (e) { /* next time */ } }
    ltRender(); return S.ltr.st;
  })().finally(() => { LT.pollP = null; });
  return LT.pollP;
}
// the switch: on -> the Worker emails a confirmation (pending); off -> the row is deleted. Resolves the new state, or null with a kind line
async function ltSet(on) {
  if (!S || ltMode() !== 'ok' || !ltWorker()) { ltSay('offline'); return null; }
  if (LT.busy) return null; LT.busy = true; ltSay(''); ltFields(S);
  let r = null;
  try { r = await clApi('POST', '/letters', { on: !!on, lang: ltLangNow() }); } catch (e) { r = null; } finally { LT.busy = false; }
  if (ltTake(r)) {
    if (r.ok && S.ltr.st === 'pending') toast(tt('lt.t_pending', 'Check your email and say yes to the letters.'), 'good');
    else if (r.ok && !on) toast(tt('lt.t_off', 'Letters are off. No more emails.'));
    saveNow(); ltRender();
    if (!r.ok && r.status === 429) ltSay('rate');
    return S.ltr.st;
  }
  ltRender(); if (!LT.gone) ltSay(r && r.status === 429 ? 'rate' : 'offline');
  return null;
}

/* ---------------- Settings ---------------- */
function ltStatText() {
  const st = S && S.ltr ? S.ltr.st : '', email = typeof clMask === 'function' && typeof CL !== 'undefined' ? clMask(CL.email) : ''; // as the Cloud save line shows it: the first letter and the domain
  if (st === 'pending') return tt('lt.st_pending', 'Almost there. We sent an email to {email}. Tap the button in it to say yes.', { email });
  if (st === 'on') return tt('lt.st_on', 'On. {name} writes to {email} every Sunday.', { name: NAME(), email });
  if (st === 'stopped') return tt('lt.st_stopped', 'Letters could not reach {email}, so they are off.', { email });
  return '';
}
function ltBoxInner() {
  const mode = ltMode(), st = S.ltr.st, lead = `<p class="small ltr-lead">${esc(tt('lt.set_lead', 'A short letter from {name} in your email, once a week, on Sundays. It is off unless you turn it on.', { name: NAME() }))}</p>`;
  let body;
  if (mode === 'ok') {
    body = `<label class="tog ltr-tog"><input type="checkbox" id="ltTog" ${st === 'on' || st === 'pending' ? 'checked' : ''} ${st === 'stopped' ? 'disabled' : ''}> ${esc(tt('lt.set_tog', 'Send me the weekly letter'))}</label>`
      + `<p class="small ltr-stat" id="ltStat" role="status">${esc(ltStatText())}</p>`
      + (st === 'pending' ? `<div class="clrow ltr-row"><button class="btn" type="button" id="ltAgain">${esc(tt('lt.again', 'Send it again'))}</button></div>` : '');
  } else {
    body = `<p class="small ltr-guest">${esc(tt('lt.st_guest', 'Letters need an account, so they know where to go.'))}</p><div class="clrow ltr-row"><button class="btn" type="button" id="ltAcct">${esc(tt('cloud.make_an_account', 'Make an account'))}</button></div>`;
  }
  return `<h4 class="clh">${esc(tt('lt.set_h', 'Letters from my dog'))}</h4>${lead}${body}<p class="ltr-msg" id="ltMsg" role="alert"></p>`
    + `<div class="clrow ltr-row"><button class="btn" type="button" id="ltSampleBtn" aria-expanded="false">${esc(tt('lt.sample', 'What is in a letter?'))}</button></div><div id="ltSample" hidden></div>`
    + `<p class="small ltr-note">${esc(tt('lt.note', 'Made only from your saved game. No ads and no tracking. Stop any time here, or with the link in every letter.'))}</p>`;
}
function ltSettingsHTML() {
  if (!S || ltMode() === 'off') return '';
  ltFields(S);
  return `<section class="clset ltset" id="ltBox" aria-label="${esc(tt('lt.set_h', 'Letters from my dog'))}">${ltBoxInner()}</section>`;
}
function ltSay(code) {
  const m = document.getElementById('ltMsg'); if (!m) return;
  m.textContent = code === 'rate' ? tt('lt.err_rate', 'That is enough emails for today. Please try again tomorrow.') : code === 'offline' ? tt('lt.err_offline', 'The post office did not answer. Please try again in a little while.') : '';
}
function ltSampleWire(root) {
  const b = $('#ltSampleBtn', root), box = $('#ltSample', root); if (!b || !box) return;
  b.onclick = () => { SFX.click(); const open = box.hidden; box.innerHTML = open ? ltSampleHTML() : ''; box.hidden = !open; b.setAttribute('aria-expanded', String(open)); if (open && box.scrollIntoView) { try { box.scrollIntoView({ block: 'nearest' }); } catch (e) { /* an old browser */ } } };
}
function ltBind(p) {
  const box = p ? $('#ltBox', p) : document.getElementById('ltBox'); if (!box) return;
  const tog = $('#ltTog', box);
  if (tog) tog.onchange = () => { SFX.click(); tog.disabled = true; ltSet(tog.checked).then(() => { const t = document.getElementById('ltTog'); if (t && t === tog) { t.disabled = S.ltr.st === 'stopped'; t.checked = S.ltr.st === 'on' || S.ltr.st === 'pending'; } }); };
  const ag = $('#ltAgain', box); if (ag) ag.onclick = () => { SFX.click(); ag.disabled = true; ltSet(true); };
  const ac = $('#ltAcct', box); if (ac) ac.onclick = () => { SFX.click(); if (!modal.hidden) closeModal(); setTimeout(() => { if (typeof cloudOpen === 'function') cloudOpen(); if (typeof clGo === 'function') clGo('reg'); }, 60); };
  ltSampleWire(box);
  if (p && ltMode() === 'ok' && ltWorker()) ltPoll(); // Settings just opened: the row shows what the Worker says now (a letter confirmed or stopped from the email)
}
// the row follows the Worker's answer while Settings is open (an older Worker: the row goes)
function ltRender() {
  const box = document.getElementById('ltBox'); if (!box || !S) return;
  if (ltMode() === 'off') { box.remove(); return; }
  ltFields(S);
  const open = !!($('#ltSample', box) && !$('#ltSample', box).hidden), msg = ($('#ltMsg', box) || {}).textContent || '';
  box.innerHTML = ltBoxInner(); ltBind(null);
  if (open) { const b = $('#ltSampleBtn', box); if (b) b.click(); }
  const m = $('#ltMsg', box); if (m) m.textContent = msg;
}

/* ---------------- the offer card: once per save, at a calm moment, never on the first day ---------------- */
function ltDue() {
  if (!S || ltMode() !== 'ok' || !LT.known || LT.uid !== CL.uid) return false; // only once the Worker has said letters are off for this account
  ltFields(S); if (S.ltr.ask || S.ltr.st) return false;
  if (!(S.daysPlayed >= 2)) return false;
  return S.daysPlayed >= LT_DAYS || (S.dogs || []).some((d) => d && d.bond && d.bond.level >= LT_BOND);
}
function ltCalm() {
  if (!S || !(typeof nwCalmNow === 'function' ? nwCalmNow() : cur.mode === 'yard' && modal.hidden)) return false;
  if (!['yard', 'house'].includes(S.place) || S.sleeping) return false;
  if (typeof nwOn === 'function' && nwOn() && S.newsSeen !== nwLatest()) return false;
  if (S.wbPend && typeof wbOn === 'function' && wbOn()) return false;
  if (typeof buyOpen !== 'undefined' && buyOpen) return false;
  return true;
}
function ltShown() { return !modal.hidden && !!$('.panel.ltr-pop', modal); }
// a crayon envelope with a paw-print seal (a flat fill under a two-stroke pencil line of the same path)
function ltEnvSVG() {
  const two = (d, fill) => `<path d="${d}" fill="${fill}" stroke="none"/><path d="${d}" fill="none" stroke="${INKG}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${INKG}" stroke-width="1.1" opacity=".5" transform="translate(-1 .7)" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 120 90" class="ltr-env" aria-hidden="true">${two('M10 16 Q60 11 110 16 Q114 17 114 22 Q116 46 113 72 Q113 78 108 79 Q60 83 12 79 Q7 78 7 72 Q4 46 7 22 Q7 17 10 16Z', '#FFF4DF')}<path d="M9 19 Q36 42 60 52 Q84 42 111 19" fill="none" stroke="${INKG}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<g transform="translate(60 56)"><circle r="11" fill="#F28FA5" stroke="${INKG}" stroke-width="2"/><ellipse cy="2.5" rx="4.2" ry="3.4" fill="#FFFBF3"/><circle cx="-4.6" cy="-2.6" r="1.7" fill="#FFFBF3"/><circle cx="0" cy="-4.6" r="1.7" fill="#FFFBF3"/><circle cx="4.6" cy="-2.6" r="1.7" fill="#FFFBF3"/></g></svg>`;
}
function ltDogArt() { try { return dogSVG(D(), { pose: 'sit', anim: false }); } catch (e) { return ''; } }
// auto: the game opened it by itself (it counts as shown for good); the test hook passes false
function ltOpen(auto) {
  if (!S) return null; ltFields(S);
  if (auto) { S.ltr.ask = 1; markDirty(); saveNow(); }
  const name = NAME();
  const p = openModal(esc(tt('lt.offer_h', 'A letter from {name}?', { name })),
    `<div class="ltr-offer"><div class="ltr-top"><span class="ltr-dog" aria-hidden="true">${ltDogArt()}</span><span class="ltr-art" aria-hidden="true">${ltEnvSVG()}</span></div>`
    + `<p class="ltr-lead2" tabindex="-1" autofocus>${esc(tt('lt.offer_p', '{name} would like to write to you. One short letter by email every Sunday, about your week together.', { name }))}</p>`
    + `<p class="small ltr-free">${esc(tt('lt.offer_small', 'Free. Off unless you say yes. You can stop any time.'))}</p>`
    + `<p class="ltr-row ltr-mid"><button class="btn" type="button" id="ltSampleBtn" aria-expanded="false">${esc(tt('lt.sample', 'What is in a letter?'))}</button></p><div id="ltSample" hidden></div></div>`,
    { cls: 'ltr-pop', foot: `<button class="btn ltr-no" type="button" id="ltrNo">${esc(tt('a2.no', 'No thanks'))}</button><button class="btn yes big ltr-yes" type="button" id="ltrYes">${esc(tt('lt.offer_yes', 'Yes, please'))}</button>` });
  ltSampleWire(p);
  $('#ltrNo', p).onclick = () => { SFX.click(); closeModal(); };
  $('#ltrYes', p).onclick = () => { SFX.click(); closeModal(); ltSet(true); };
  return p;
}
function ltTry() {
  if (ltShown() || !ltDue() || !ltCalm()) { LT.calm = 0; return; }
  const now = Date.now();
  if (!LT.readyAt) LT.readyAt = now;
  if (now - LT.readyAt < LT.wait) return; // not the moment the game opens
  if (!LT.calm) LT.calm = now;
  if (now - LT.calm < LT.calmMs) return;
  LT.calm = 0; ltOpen(true);
}

/* ---------------- start-up, the loop, the hook ---------------- */
function ltStart() {
  if (!S || ltMode() !== 'ok') return;
  Promise.resolve(typeof clStart === 'function' ? clStart() : null).then(() => (typeof pmCloudIdle === 'function' ? pmCloudIdle() : null)).then(() => { if (S && ltMode() === 'ok' && LT.uid !== CL.uid) return ltPoll(); return null; }).catch(() => {});
}
function ltExpose() {
  if (!window.__paw || window.__paw.lt) return;
  window.__paw.lt = {
    from: LT_FROM, on: () => ltOn(), test: (v) => { prefs.ltTest = !!v; }, mode: () => ltMode(), fields: (s) => ltFields(s), known: () => LT.known, gone: (v) => { if (v !== undefined) LT.gone = !!v; return LT.gone; },
    poll: () => { LT.uid = null; return ltPoll(); }, set: (on) => ltSet(on), due: () => ltDue(), calm: () => ltCalm(), open: () => ltOpen(false), shown: () => ltShown(), tryNow: () => ltTry(),
    timing: (wait, calmMs) => { if (typeof wait === 'number') LT.wait = wait; if (typeof calmMs === 'number') LT.calmMs = calmMs; LT.readyAt = 0; LT.calm = 0; return [LT.wait, LT.calmMs]; },
    note: (k, v) => ltNote(k, v), look: () => ltBondLook(), sample: () => ltSampleLines(), m: (k, v) => ltM(k, v), settings: () => openSettings(), busy: () => !!(LT.pollP || LT.busy), DAYS: LT_DAYS, BOND: LT_BOND
  };
}
setInterval(() => { try { ltExpose(); ltTry(); } catch (e) { console.warn('lt tick', e); } }, 1000);
on('game:ready', () => { LT.calm = 0; LT.readyAt = Date.now(); if (S && ltOn()) { ltFields(S); ltBondLook(); } setTimeout(ltExpose, 0); setTimeout(ltStart, 2200); });
on('yard:enter', () => { if (S && ltOn()) { ltFields(S); ltBondLook(); } ltExpose(); if (S && ltMode() === 'ok' && ltWorker() && LT.uid !== CL.uid) setTimeout(ltStart, 1000); }); // a log in on this page lands in the yard
setTimeout(ltExpose, 0);
