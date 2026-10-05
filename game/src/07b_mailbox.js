/* ======================= v2: 07b_mailbox.js (SYSTEMS lane) =======================
   Mailbox in the home yard, daily neighbour gift, postcards from rehomed puppies, litter letters (BREED pushes them).
   API: mailPush(msg) -> msg, openMailbox(selectId?), mailUnread(), mailTick(). Data: S.mail (V2.md section 2). */
const MAIL_MAX = 40;
const isoDay = (iso) => (/^\d{4}-\d{2}-\d{2}/.test(String(iso || '')) ? String(iso).slice(0, 10) : localISO());
const isoAdd = (iso, n) => { const d = new Date(isoDay(iso) + 'T00:00:00'); d.setDate(d.getDate() + n); return localISO(d); };
const isoDays = (a, b) => Math.round((new Date(isoDay(b) + 'T00:00:00') - new Date(isoDay(a) + 'T00:00:00')) / 864e5); // b - a in days
const shortFam = (f) => String(f || 'a town family').split(/ (?:by|at|near|on|from|in) /)[0];
const capFirst = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
// pronouns for any dog record: home dogs go through PRd, other records use their sex
function prOf(d) {
  if (d && d.id && S && S.dogs && dogById(d.id)) return PRd(dogById(d.id));
  return d && d.sex === 'female' ? { he: 'she', him: 'her', his: 'her', He: 'She', His: 'Her', boy: 'girl', self: 'herself' } : { he: 'he', him: 'him', his: 'his', He: 'He', His: 'His', boy: 'boy', self: 'himself' };
}
function mailFields() {
  if (!S) return; if (!Array.isArray(S.mail)) S.mail = []; if (!S.mailCards || typeof S.mailCards !== 'object') S.mailCards = {};
  if (!Array.isArray(S.rehomed)) S.rehomed = [];
}
const mailUnread = () => (S && Array.isArray(S.mail) ? S.mail.filter((m) => !m.read).length : 0);
const mailIcon = () => iconOr('mail', '<rect x="-14" y="-10" width="28" height="20" rx="3" fill="#FFF3D6" stroke="#5B3D32" stroke-width="2.2"/><path d="M-13 -8 L0 3 L13 -8" fill="none" stroke="#5B3D32" stroke-width="2.2" stroke-linejoin="round"/><path d="M6 -16 l2 3 3 1 -3 1 -2 3 -1 -3 -3 -1 3 -1z" fill="#F28FA5"/>');
function mailSfx() { try { const a = PAU(); if (a && typeof a.sfx === 'function') { a.sfx('mail'); return; } } catch (e) { /* no audio module */ } try { SFX.ding(); setTimeout(() => SFX.boop(990), 140); } catch (e) { /* audio off */ } }
/* Add a message. msg: { kind: 'postcard'|'gift'|'litter'|'news', from, title, text, dog?, gift?, ... } */
function mailPush(msg) {
  if (!S) return null; mailFields();
  const m = Object.assign({ kind: 'news', from: 'Paw Haven Post', title: 'A letter', text: '' }, msg || {});
  m.id = m.id || 'm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  m.date = m.date || localISO(); m.read = false;
  if (S.mail.some((x) => x.id === m.id)) return S.mail.find((x) => x.id === m.id);
  S.mail.unshift(m);
  if (S.mail.length > MAIL_MAX) { // drop the oldest read letters first
    for (let i = S.mail.length - 1; i >= 0 && S.mail.length > MAIL_MAX; i--) if (S.mail[i].read) S.mail.splice(i, 1);
    if (S.mail.length > MAIL_MAX) S.mail.length = MAIL_MAX;
  }
  markDirty(); mailSfx();
  toast(`New mail: ${m.title}`, 'gold');
  try { const tl = toasts.lastElementChild; if (tl) tl.insertAdjacentHTML('afterbegin', `<span class="mail-tic" aria-hidden="true">${mailIcon()}</span>`); } catch (e) { /* toast gone */ }
  mailboxRefresh(); return m;
}

/* ---------- daily neighbour gift ---------- */
const GIFT_NEIGHBOURS = [
  ['Mrs. Plum next door', (c) => `Found ${c} coins in my sofa. Your dog looked at me very sweetly over the fence, so I think they're legally {dog}'s now.`],
  ['Old Mr. Reyes at the pier', (c) => `Spare change from fishing: ${c} coins. The fish paid in exact change. Don't ask.`],
  ['the Okafor twins', (c) => `We sold lemonade. Business was terrible. Please accept our entire profits: ${c} coins. Give {dog} a scratch from us.`],
  ['Baker Bea', (c) => `${c} coins from the tip jar. Someone wrote "for the good dog" on a napkin. I assume that means {dog}.`],
  ['the mail carrier', (c) => `${c} coins. This is not a bribe. This is a polite request that {dog} stops barking at my left shoe.`]
];
const GIFT_ITEM_NOTES = [
  ['Pip the farmer', (n) => `Too many seeds again! Here's a packet of ${n}. Plant them before they plant themselves.`],
  ['Baker Bea', (n) => `A little something for your kitchen: ${n}. No chocolate, I promise. I checked twice.`],
  ['Mrs. Plum next door', (n) => `I bought too much ${n}. Again. My cat is judging me. Please take it.`]
];
function giftRoll() {
  const nm = NAME(), r = Math.random();
  if (r < 0.6) {
    const c = 10 + Math.floor(Math.random() * 16), [from, f] = PICK(GIFT_NEIGHBOURS);
    return { kind: 'gift', from: capFirst(from), title: `A little something from ${from}`, text: f(c).replace(/\{dog\}/g, nm), gift: { coins: c } };
  }
  let item = null;
  try {
    if (r < 0.8) { const c = PICK(cropsList()); item = { cat: 'seeds', id: c.id, name: c.seedItem || c.name + ' Seeds', n: 2 }; }
    else { const x = PICK(pantryList()); item = { cat: 'pantry', id: x.id, name: x.name, n: 2 }; }
  } catch (e) { item = null; }
  if (!item) return { kind: 'gift', from: 'Mrs. Plum next door', title: 'A little something from Mrs. Plum next door', text: `12 coins from the sofa. ${nm} supervised.`, gift: { coins: 12 } };
  const [from, f] = item.cat === 'seeds' ? GIFT_ITEM_NOTES[0] : PICK(GIFT_ITEM_NOTES.slice(1));
  return { kind: 'gift', from: capFirst(from), title: `A parcel from ${from}`, text: f(`${item.n} × ${item.name}`), gift: { item: item.name, cat: item.cat, id: item.id, n: item.n } };
}
function dailyGift() {
  if (!S) return false; mailFields(); const t = localISO();
  if (S.mailGiftDay === t) return false;
  S.mailGiftDay = t; mailPush(giftRoll()); return true;
}
function claimGift(m) {
  if (!m || !m.gift || m.gift.claimed) return '';
  m.gift.claimed = true; let txt = '';
  if (m.gift.coins) { const n = addCoins(m.gift.coins, { raw: true }); SFX.coin(); txt = `+${n} coins`; }
  else if (m.gift.cat && m.gift.id) {
    S.inv[m.gift.cat] = S.inv[m.gift.cat] || {}; S.inv[m.gift.cat][m.gift.id] = (S.inv[m.gift.cat][m.gift.id] || 0) + (m.gift.n || 1);
    txt = `+${m.gift.n || 1} ${m.gift.item}`; SFX.pop();
  }
  markDirty(); if (txt) toast(`${txt}. Thank you, ${m.from}!`, 'good'); return txt;
}

/* ---------- postcards from rehomed puppies ---------- */
const CARD_LINES = [
  (n, p) => `${n} learned to open the fridge. We changed the locks. ${p.He} has not changed ${p.his} ways.`,
  (n, p) => `${n} met a pigeon today. They are not friends. ${p.He} is drafting a strongly worded bark.`,
  (n, p) => `We took ${n} to the beach. ${p.He} dug a hole so deep we found a spoon from 1987.`,
  (n, p) => `${n} sleeps in the laundry basket now. Clean socks are a distant memory.`,
  (n) => `${n} says hi! (We think. It might have been a sneeze.)`,
  (n, p) => `${n} has a new best friend: the mail carrier's left shoe. ${p.He} visits it daily.`,
  (n) => `Growth update: ${n} is now exactly one sofa cushion long. We measured.`,
  (n, p) => `${n} howled along to the radio. The neighbours asked for an encore. Or an ending. Unclear. ${p.He} took a bow either way.`,
  (n, p) => `${n} sat on command! Then lay down, rolled over and fell asleep. ${p.He} is an overachiever.`,
  (n, p) => `${n} stole a whole baguette and carried it home like a trophy. We are so proud and so hungry.`,
  (n, p) => `${n} tried to make friends with a snail. The snail is thinking about it. ${p.He} is patient.`,
  (n) => `Thank you for ${n}. The house is louder, muddier and much, much happier.`
];
const CARD_PS = ['P.S. Muddy paw print attached as a signature.', 'P.S. Sorry about the corner. It was chewed in transit. By the sender.', 'P.S. We tell everyone where we got our best friend.', 'P.S. Come say hi if you see us around town!'];
const CARD_POSES = ['happy', 'sit', 'jump', 'beg', 'shake', 'dig', 'pet', 'sleep'];
function cardSched(r) {
  const c = S.mailCards[r.id] || (S.mailCards[r.id] = { n: 0, next: isoAdd(r.since || localISO(), 1 + (hashId(r.id) % 2)) });
  return c;
}
function postcardFor(r) {
  const p = prOf(r), fam = r.family || 'a town family', c = S.mailCards[r.id], i = (hashId(r.id) + c.n * 7) % CARD_LINES.length;
  const pose = CARD_POSES[(hashId(r.id) + c.n * 3) % CARD_POSES.length];
  const dog = { id: r.id, key: r.key, genes: r.genes, born: r.born, mix: r.mix || null, sparkle: !!r.sparkle, sex: r.sex, name: r.name, coat: r.coat, eyes: r.eyes };
  return { kind: 'postcard', from: `${r.name} & ${shortFam(fam)}`, title: c.n === 0 ? `${r.name} has settled in!` : `A postcard from ${r.name}`, text: (c.n === 0 ? `${r.name} made it home with ${fam}. ${p.He} has already claimed the best spot on the sofa. ` : '') + CARD_LINES[i](r.name, p), ps: CARD_PS[(hashId(r.id) + c.n) % CARD_PS.length], dog, pose, pup: r.id };
}
function postcardTick() {
  if (!S) return 0; mailFields(); const t = localISO(); let n = 0;
  S.rehomed.forEach((r) => {
    if (!r || !r.id) return; const c = cardSched(r);
    if (c.next <= t) { mailPush(postcardFor(r)); c.n++; c.next = isoAdd(t, 2 + (hashId(r.id + '|' + c.n) % 3)); n++; }
  });
  if (n) markDirty(); return n;
}
function mailTick() { if (!S) return; try { postcardTick(); } catch (e) { console.warn('mail tick', e); } }

/* ---------- the mailbox in the yard ---------- */
function mailboxDoodle(flag, count) {
  return `<svg viewBox="0 0 120 160" class="mb-doodle"><path d="M58 70 L57 156 M66 70 L66 156" stroke="#5B3D32" stroke-width="3" fill="#C9A27A"/><rect x="55" y="70" width="13" height="86" fill="#C9A27A" stroke="#5B3D32" stroke-width="2.4"/>
    <path d="M14 46 Q14 22 40 22 L84 22 Q104 22 104 46 L104 74 L14 74 Z" fill="#E86F6F" stroke="#5B3D32" stroke-width="3" stroke-linejoin="round"/><path d="M22 40 Q24 30 38 29" fill="none" stroke="#FFFBF3" stroke-width="3" stroke-linecap="round" opacity=".7"/>
    <path d="M14 74 L14 46 Q14 30 26 26 L26 74 Z" fill="#C9534F" stroke="#5B3D32" stroke-width="2.4"/><text x="62" y="62" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="16" fill="#FFFBF3">MAIL</text>
    ${flag ? '<path d="M104 52 L104 16" stroke="#5B3D32" stroke-width="3"/><path d="M104 16 L126 21 L104 30 Z" fill="#E2453C" stroke="#5B3D32" stroke-width="2.2" stroke-linejoin="round"/>' : '<path d="M104 54 L126 54" stroke="#5B3D32" stroke-width="3"/><path d="M118 54 L126 49 L126 60 Z" fill="#E2453C" stroke="#5B3D32" stroke-width="2"/>'}
    ${count ? `<circle cx="22" cy="20" r="13" fill="#FFE3A1" stroke="#5B3D32" stroke-width="2.4"/><text x="22" y="26" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="18" fill="#5B3D32">${count > 9 ? '9+' : count}</text>` : ''}</svg>`;
}
function mailboxArt() { const n = mailUnread(); return artReal('prop', 'mailbox', { flag: n > 0, count: n }) || mailboxDoodle(n > 0, n); }
const MB_BOX = [286, 288, 90, 120]; // world x, y, w, h: over the scene's own mailbox by the fence, behind the dogs
function mailboxRefresh() {
  if (!S || cur.mode !== 'yard' || S.place !== 'yard') return;
  const svg = $('svg.world', view); if (!svg) return;
  const n = mailUnread(), lbl = `Mailbox${n ? `: ${n} new letter${n > 1 ? 's' : ''}` : ''}`;
  const sceneHot = svg.querySelector('#sceneG [data-hot="mailbox"]');
  const old = svg.querySelector('#mailboxG');
  if (sceneHot) {
    if (old) old.remove();
    if (!sceneHot.dataset.mb) { sceneHot.dataset.mb = '1'; sceneHot.classList.add('hot'); sceneHot.setAttribute('tabindex', '0'); sceneHot.setAttribute('role', 'button'); sceneHot.addEventListener('click', () => openMailbox()); sceneHot.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMailbox(); } }); }
    sceneHot.setAttribute('aria-label', lbl); sceneHot.classList.toggle('mb-new', n > 0); return;
  }
  const html = `<g id="mailboxG" class="hot${n ? ' mb-new' : ''}" tabindex="0" role="button" aria-label="${lbl}" data-unread="${n}"><rect x="${MB_BOX[0]}" y="${MB_BOX[1]}" width="${MB_BOX[2]}" height="${MB_BOX[3]}" fill="transparent"/>${place(mailboxArt(), MB_BOX[0], MB_BOX[1], MB_BOX[2], MB_BOX[3])}</g>`;
  if (old) { old.outerHTML = html; } else {
    const anchor = svg.querySelector('#houseG') || svg.querySelector('#bowlG') || svg.querySelector('#pack');
    if (anchor) anchor.insertAdjacentHTML('beforebegin', html); else svg.insertAdjacentHTML('beforeend', html);
  }
  const g = svg.querySelector('#mailboxG'); if (!g) return;
  g.addEventListener('click', (e) => { e.stopPropagation(); openMailbox(); });
  g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMailbox(); } });
}

/* ---------- the mailbox popup ---------- */
let mailSel = null;
function letterPhoto(m) {
  if (!m.dog) return '';
  try { return dogSVG(m.dog, { pose: m.pose || 'happy' }); } catch (e) { return art('dog', m.dog.key || 'mutt'); }
}
function postcardHTML(m) {
  const real = artReal('prop', 'postcard');
  return `<div class="pc ${real ? 'pc-real' : 'pc-doodle'}">${real ? `<div class="pc-bg">${real}</div>` : '<span class="pc-stamp" aria-hidden="true"><i></i></span><span class="pc-mark" aria-hidden="true">PAW HAVEN</span><span class="pc-tape" aria-hidden="true"></span>'}
    <div class="pc-photo">${letterPhoto(m)}</div><div class="pc-addr"><span>To: you</span><span>Home Yard</span><span>Paw Haven</span></div></div>`;
}
function letterBody(m) {
  if (!m) return '<div class="mb-empty"><p>No letters yet.</p><p class="small">The neighbours leave something every day, and puppies who move to town families write home.</p></div>';
  const date = (() => { try { return new Date(m.date + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); } catch (e) { return m.date; } })();
  let act = '';
  if (m.kind === 'gift' && m.gift) act = `<p class="mb-gift ${m.gift.claimed ? 'got' : ''}">${m.gift.coins ? `${m.gift.coins} coins` : `${m.gift.n || 1} × ${esc(m.gift.item || 'a surprise')}`}${m.gift.claimed ? ' · added to your things' : ''}</p>`;
  if (m.kind === 'litter') {
    const taken = m.adopted || m.picked;
    act = taken ? '<p class="mb-gift got">You picked a puppy from this litter.</p>' : `<div class="mb-acts"><button class="btn yes" data-adoptpick="${esc(m.id)}">Adopt this pup</button><span class="small">${typeof slotsFree === 'function' ? `Free dog spots: ${slotsFree()}` : ''}</span></div>`;
  }
  const pups = Array.isArray(m.pups) && m.pups.length ? `<div class="mb-pups">${m.pups.slice(0, 8).map((p) => `<span class="mb-pup" title="${esc(p.name || '')}">${(() => { try { return headSVG(p); } catch (e) { return ''; } })()}</span>`).join('')}</div>` : '';
  const card = m.kind === 'postcard' || (m.dog && m.kind !== 'gift') ? postcardHTML(m) : '';
  return `<article class="letter k-${esc(m.kind)}"><header><b>${esc(m.title)}</b><span class="small">From ${esc(m.from)} · ${esc(date)}</span></header>${card}${pups}<p class="mb-text">${esc(m.text)}</p>${m.ps ? `<p class="small mb-ps">${esc(m.ps)}</p>` : ''}${act}</article>`;
}
function openMailbox(selId) {
  if (!S) return; mailFields(); audioPlace('journal');
  if (selId) mailSel = selId;
  else { const u = S.mail.find((m) => !m.read); if (u) mailSel = u.id; }
  if (!S.mail.some((m) => m.id === mailSel)) mailSel = (S.mail[0] || {}).id || null;
  const sel = S.mail.find((m) => m.id === mailSel) || null;
  if (sel && !sel.read) { sel.read = true; markDirty(); }
  if (sel && sel.kind === 'gift') claimGift(sel);
  const kindIc = { postcard: 'P', gift: 'G', litter: 'L', news: 'N' };
  const list = S.mail.length ? S.mail.map((m) => `<button class="mb-item ${m.read ? '' : 'unread'} ${m.id === mailSel ? 'on' : ''} k-${esc(m.kind)}" data-mail="${esc(m.id)}" aria-pressed="${m.id === mailSel}"><span class="mb-k" aria-hidden="true">${m.dog ? headSVG(m.dog) : kindIc[m.kind] || 'N'}</span><span class="mb-t"><b>${esc(m.title)}</b><span class="small">${esc(m.from)}</span></span>${m.read ? '' : '<i class="mb-dot" aria-label="unread"></i>'}</button>`).join('') : '<p class="small">Empty. Just one very determined spider.</p>';
  const n = mailUnread();
  const p = openModal(`<span class="mb-h-ic">${mailIcon()}</span>Mailbox`, `<div class="mbox"><div class="mb-list" role="list">${list}</div><div class="mb-read">${letterBody(sel)}</div></div><p class="small mb-foot">${n ? `${n} unread.` : 'All caught up.'} A neighbour drops something off every day.</p>`, { cls: 'mailbox' });
  p.querySelectorAll('[data-mail]').forEach((b) => { b.onclick = () => { SFX.click(); openMailbox(b.dataset.mail); }; });
  p.querySelectorAll('[data-adoptpick]').forEach((b) => {
    b.onclick = () => {
      if (typeof adoptPick !== 'function') { nope('The puppy paperwork is still at the printer. Try again soon.'); return; }
      const id = b.dataset.adoptpick; let r; try { r = adoptPick(id); } catch (e) { console.warn('adoptPick', e); }
      const m = S.mail.find((x) => x.id === id); if (m && r === true) m.adopted = true;
      markDirty(); if (!modal.hidden && $('.panel.mailbox', modal)) openMailbox(id);
    };
  });
  mailboxRefresh();
}

/* ---------- wiring ---------- */
function mailYardEnter() {
  if (!S || S.place !== 'yard') return;
  mailFields(); mailboxRefresh(); mailTick();
  if (S.mailGiftDay !== localISO()) setTimeout(() => { if (S && cur.mode === 'yard' && S.place === 'yard') dailyGift(); }, 900);
}
on('yard:enter', mailYardEnter);
on('scene:redraw', () => { if (S && cur.mode === 'yard' && S.place === 'yard') mailboxRefresh(); });
on('game:ready', () => { mailFields(); mailTick(); });
on('day:new', () => mailTick());
on('clock:minute', () => mailTick());
function mailNow() { // dev: deliver every due thing now (the daily gift even if already given, plus one postcard from each rehomed pup)
  if (!S) return 0; mailFields(); let n = 0;
  S.mailGiftDay = null; if (dailyGift()) n++;
  S.rehomed.forEach((r) => { if (r && r.id) { cardSched(r).next = localISO(); } }); n += postcardTick();
  return n;
}
// Dev panel button, registered from this file: the panel re-renders its innerHTML, so a small observer re-adds it
(function devMailButton() {
  const add = () => {
    try {
      if (typeof devPanel === 'undefined' || !devPanel || devPanel.hidden || devPanel.querySelector('#dvMail')) return;
      const b = document.createElement('button'); b.className = 'btn'; b.id = 'dvMail'; b.textContent = 'Mail: deliver now';
      b.onclick = () => { const n = mailNow(); toast(n ? `Delivered ${n} letter${n > 1 ? 's' : ''}. The mail carrier is exhausted.` : 'Nothing to deliver.'); };
      const x = devPanel.querySelector('#dvX'); if (x) devPanel.insertBefore(b, x); else devPanel.appendChild(b);
    } catch (e) { /* no dev panel */ }
  };
  try { if (typeof devPanel !== 'undefined' && devPanel) new MutationObserver(add).observe(devPanel, { childList: true, attributes: true, attributeFilter: ['hidden'] }); } catch (e) { /* no observer */ }
})();
function pawMailHelpers() {
  if (!window.__paw) return;
  Object.assign(window.__paw, { mailNow, mailPush: (m) => mailPush(m), openMailbox: (id) => openMailbox(id), mailTick: () => mailTick(), dailyGift: () => dailyGift(), coatCheck: () => coatRewardsCheck(), journal: (tab) => openJournal(tab) });
}
on('game:ready', pawMailHelpers); setTimeout(pawMailHelpers, 0);
