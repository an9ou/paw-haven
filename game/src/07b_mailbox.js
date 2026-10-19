/* ======================= v2: 07b_mailbox.js (SYSTEMS lane) =======================
   Mailbox in the home yard, daily neighbour gift, postcards from rehomed puppies, litter letters (BREED pushes them).
   API: mailPush(msg) -> msg, openMailbox(selectId?), mailUnread(), mailTick(). Data: S.mail (V2.md section 2). */
const MAIL_MAX = 40;
const isoDay = (iso) => (/^\d{4}-\d{2}-\d{2}/.test(String(iso || '')) ? String(iso).slice(0, 10) : localISO());
const isoAdd = (iso, n) => { const d = new Date(isoDay(iso) + 'T00:00:00'); d.setDate(d.getDate() + n); return localISO(d); };
const isoDays = (a, b) => Math.round((new Date(isoDay(b) + 'T00:00:00') - new Date(isoDay(a) + 'T00:00:00')) / 864e5); // b - a in days
const mailFamName = (f) => (f && typeof f === 'object' ? (f.where ? f.name + ' ' + f.where : f.name) : f) || 'a town family'; // BREED stores {id,name,where}
// v2.14 i18n: family texts are stored in English ("the Tanakas by the bakery", FAMILIES name + where). The shown text: the families table of 13c, TOWN_FAMILIES (14b), or the short names below.
// The letters themselves are written in the language the player has when they arrive and keep it (the save stores the text).
const mbFamShort = () => ({ 'Mrs. Lindqvist': tt('mail.fam_lindqvist', 'Mrs. Lindqvist'), 'the Patels': tt('mail.fam_patels', 'the Patels'), 'Grandpa Joe': tt('mail.fam_joe', 'Grandpa Joe'), 'the Moreau family': tt('mail.fam_moreau', 'the Moreau family'), Rosa: tt('mail.fam_rosa', 'Rosa'), 'the Nguyen kids': tt('mail.fam_nguyen', 'the Nguyen kids'), 'Coach Bell': tt('mail.fam_bell', 'Coach Bell'), 'the Abernathys': tt('mail.fam_abernathy', 'the Abernathys'), 'Dr. Kim (the dentist, not the vet)': tt('mail.fam_kim', 'Dr. Kim (the dentist, not the vet)') });
function shortFam(f) {
  const s = String(f && typeof f === 'object' ? f.name || 'a town family' : f || 'a town family').split(/ (?:by|at|near|on|from|in) /)[0];
  if (s === 'a town family') return tt('mail.a_town_family', 'a town family');
  const hit = typeof FAMILIES !== 'undefined' && FAMILIES.find((x) => x.id && x.name === s);
  if (hit) return tdata('families.' + tid(hit.id) + '.name', s);
  const m = mbFamShort(); return m[s] || s;
}
// the whole family text ("the Tanakas by the bakery") for a sentence
function mbFamFull(fam) {
  const s = String(fam || ''), hit = typeof FAMILIES !== 'undefined' && FAMILIES.find((x) => x.id && (s === x.name || s === x.name + ' ' + x.where));
  if (hit) { const n = tdata('families.' + tid(hit.id) + '.name', hit.name); return hit.where && s !== hit.name ? tt('mail.fam_where', '{name} {where}', { name: n, where: tdata('families.' + tid(hit.id) + '.where', hit.where) }) : n; }
  if (s === 'a town family') return tt('mail.a_town_family', 'a town family');
  return townFamily(s);
}
const capFirst = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
// pronouns for any dog record: home dogs go through PRd, other records use their sex
function prOf(d) {
  if (d && d.id && S && S.dogs && dogById(d.id)) return PRd(dogById(d.id));
  return d && d.sex === 'female' ? { he: 'she', him: 'her', his: 'her', He: 'She', His: 'Her', boy: 'girl', self: 'herself' } : { he: 'he', him: 'him', his: 'his', He: 'He', His: 'His', boy: 'boy', self: 'himself' };
}
function mailFields() {
  if (!S) return; if (!Array.isArray(S.mail)) S.mail = []; if (!S.mailCards || typeof S.mailCards !== 'object') S.mailCards = {};
  if (!Array.isArray(S.rehomed)) S.rehomed = [];
  if (!S.penpalV21) { // once, on the first v2.1 load: pups rehomed before v2.1 skip the gift and birthday milestones already past (no burst of coins and letters)
    S.penpalV21 = localISO(); const t = S.penpalV21;
    S.rehomed.forEach((r) => {
      if (!r || !r.id) return; const c = cardSched(r), days = isoDays(r.since || t, t);
      if (!c.paid || typeof c.paid !== 'object') c.paid = { d14: days >= 14 ? 'pre' : null, d30: days >= 30 ? 'pre' : null };
      if (c.bday == null && /^\d{4}-\d{2}-\d{2}/.test(String(r.born || ''))) c.bday = Math.floor(isoDays(r.born, t) / 12);
    });
  }
  if (!S.mbCollectV27) { // v2.7: once, on the first v2.7 load. Gifts now wait for Collect. Letters opened before v2.7 were paid on open, so they read as collected (never paid twice)
    S.mbCollectV27 = localISO();
    S.mail.forEach((m) => { if (m && m.gift && m.read && !m.gift.claimed) { m.gift.claimed = true; m.gift.pre = true; } });
  }
}
/* ---------- v2.7: Collect (gifts wait in the letter until the player collects them) ---------- */
const mbOwed = (m) => !!(m && m.gift && !m.gift.claimed && (m.gift.coins || m.gift.item));
function mbGiftLabel(g) {
  if (!g) return '';
  if (g.coins) return tt('mail.coins', '{n, plural, one {# coin} other {# coins}}', { n: g.coins });
  const n = g.n || 1, it0 = g.item || '', it = !it0 ? tt('mail.surprise', 'surprise') : g.cat === 'seeds' ? tdata('crops.' + tid(g.id) + '.seeditem', it0) : g.cat === 'pantry' ? tdata('pantry.' + tid(g.id) + '.name', it0) : shNameAny(it0);
  return n > 1 ? tt('mail.n_times', '{n} × {item}', { n, item: it }) : tt('mail.one_item', '{art, select, an {an {item}} other {a {item}}}', { art: /^[aeiou]/i.test(String(it)) ? 'an' : 'other', item: it });
}
const mbJoin = (a) => tlist(a);
function mbGrant(m) { // pays one letter's gift once. Returns { coins, item } or null when there is nothing owed
  if (!mbOwed(m)) return null;
  const g = m.gift; g.claimed = true; g.got = localISO();
  if (g.coins) { const n = addCoins(g.coins, { raw: true }); return { coins: n || g.coins }; }
  if (g.cat === 'clothes' && g.item) { if (!owns('clothes', g.item)) S.inv.clothes.push(g.item); return { item: mbGiftLabel(g), ward: g.item }; } // v2.4: the Knit Scarf letter
  if (g.cat && g.id) { S.inv[g.cat] = S.inv[g.cat] || {}; S.inv[g.cat][g.id] = (S.inv[g.cat][g.id] || 0) + (g.n || 1); }
  return { item: mbGiftLabel(g) };
}
function mbCollect(ids) { // collect the gifts of these letters (ids) in one go. One toast names everything
  if (!S) return ''; mailFields();
  const ms = S.mail.filter((m) => ids.includes(m.id) && mbOwed(m)); if (!ms.length) return '';
  let coins = 0, ward = ''; const items = [];
  ms.forEach((m) => { const r = mbGrant(m); if (!r) return; if (r.coins) coins += r.coins; if (r.item) items.push(r.item); if (r.ward) ward = r.ward; }); // read marks stay as they were (Read a letter missions count real reads)
  const parts = (coins ? [tt('mail.coins', '{n, plural, one {# coin} other {# coins}}', { n: coins })] : []).concat(items);
  const txt = tt('mail.collected', 'Collected {list}.{ward, select, none {} other { The {item} is in the Wardrobe.}}{who, select, many { Thank you, neighbours!} other { Thank you, {from}!}}', { list: mbJoin(parts), ward: ward ? 'yes' : 'none', item: ward ? shNameAny(ward) : '', who: ms.length === 1 ? 'one' : 'many', from: ms[0].from });
  try { if (coins) SFX.coin(); else SFX.pop(); } catch (e) { /* audio off */ }
  markDirty(); toast(txt, 'good');
  trackAct('collect', { n: ms.length, coins, items: items.length });
  return txt;
}
function claimGift(m) { return m ? mbCollect([m.id]) : ''; } // older callers: one letter
const mailUnread = () => (S && Array.isArray(S.mail) ? S.mail.filter((m) => !m.read).length : 0);
const mailIcon = () => iconOr('mail', '<rect x="-14" y="-10" width="28" height="20" rx="3" fill="#FFF3D6" stroke="#5B3D32" stroke-width="2.2"/><path d="M-13 -8 L0 3 L13 -8" fill="none" stroke="#5B3D32" stroke-width="2.2" stroke-linejoin="round"/><path d="M6 -16 l2 3 3 1 -3 1 -2 3 -1 -3 -3 -1 3 -1z" fill="#F28FA5"/>');
function mailSfx() { try { const a = PAU(); if (a && typeof a.sfx === 'function') { a.sfx('mail'); return; } } catch (e) { /* no audio module */ } try { SFX.ding(); setTimeout(() => SFX.boop(990), 140); } catch (e) { /* audio off */ } }
/* Add a message. msg: { kind: 'postcard'|'gift'|'litter'|'news', from, title, text, dog?, gift?, ... } */
function mailPush(msg) {
  if (!S) return null; mailFields();
  const m = Object.assign({ kind: 'news', from: tt('mail.default_from', 'Doodle Doggo Post'), title: tt('mail.default_title', 'A letter'), text: '' }, msg || {});
  m.id = m.id || 'm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  m.date = m.date || localISO(); m.read = false;
  if (S.mail.some((x) => x.id === m.id)) return S.mail.find((x) => x.id === m.id);
  S.mail.unshift(m);
  if (S.mail.length > MAIL_MAX) { // drop the oldest read letters first
    for (let i = S.mail.length - 1; i >= 0 && S.mail.length > MAIL_MAX; i--) if (S.mail[i].read && !mbOwed(S.mail[i])) S.mail.splice(i, 1); // v2.7: a gift still waiting for Collect is kept
    for (let i = S.mail.length - 1; i >= 0 && S.mail.length > MAIL_MAX; i--) if (S.mail[i].kind !== 'litter' && !mbOwed(S.mail[i])) S.mail.splice(i, 1); // unread litter letters are kept (v2.8: and every gift still waiting for Collect, e.g. a New Year card)
  }
  markDirty(); mailSfx();
  const tl = toast(tt('mail.new_mail', 'New mail: {title}', { title: m.title }), 'gold', { group: 'mail', many: (n) => tt('mail.new_letters', '{n} new letters in your mailbox.', { n }) }); // phones: letters that arrive together make one note
  try { if (tl) tl.insertAdjacentHTML('afterbegin', `<span class="mail-tic" aria-hidden="true">${mailIcon()}</span>`); } catch (e) { /* toast gone */ }
  mailboxRefresh(); return m;
}

/* ---------- daily neighbour gift ---------- */
// each row: [the sender (shown through tt), the text (c = coins, dog = the dog's name)]. The English sender names are also the stored "from" of the letter.
const GIFT_NEIGHBOURS = [
  [() => tt('mail.nb_plum', 'Mrs. Plum next door'), (c, dog) => tt('mail.nb_plum_text', "Found {coins} coins in my sofa. Your dog looked at me very sweetly over the fence, so I think they're legally {dog}'s now.", { coins: c, dog })],
  [() => tt('mail.nb_reyes', 'Old Mr. Reyes at the pier'), (c) => tt('mail.nb_reyes_text', "Spare change from fishing: {coins} coins. The fish paid in exact change. Don't ask.", { coins: c })],
  [() => tt('mail.nb_okafor', 'the Okafor twins'), (c, dog) => tt('mail.nb_okafor_text', 'We sold lemonade. Business was terrible. Please accept our entire profits: {coins} coins. Give {dog} a scratch from us.', { coins: c, dog })],
  [() => tt('mail.nb_bea', 'Baker Bea'), (c, dog) => tt('mail.nb_bea_text', '{coins} coins from the tip jar. Someone wrote "for the good dog" on a napkin. I assume that means {dog}.', { coins: c, dog })],
  [() => tt('mail.nb_carrier', 'the mail carrier'), (c, dog) => tt('mail.nb_carrier_text', '{coins} coins. This is not a bribe. This is a polite request that {dog} stops barking at my left shoe.', { coins: c, dog })]
];
const GIFT_ITEM_NOTES = [
  [() => tt('mail.in_pip', 'Pip the farmer'), (n) => tt('mail.in_pip_text', "Too many seeds again! Here's a packet of {item}. Plant them before they plant themselves.", { item: n })],
  [() => tt('mail.nb_bea', 'Baker Bea'), (n) => tt('mail.in_bea_text', 'A little something for your kitchen: {item}. No chocolate, I promise. I checked twice.', { item: n })],
  [() => tt('mail.nb_plum', 'Mrs. Plum next door'), (n) => tt('mail.in_plum_text', 'I bought too much {item}. Again. My cat is judging me. Please take it.', { item: n })]
];
function giftRoll() {
  const nm = NAME(), r = Math.random();
  if (topBond() >= 3 && S.inv && !owns('clothes', 'Knit Scarf') && !(S.careGifts && S.careGifts.scarf)) { S.careGifts = S.careGifts || {}; S.careGifts.scarf = localISO(); return { kind: 'gift', from: tt('mail.nb_plum', 'Mrs. Plum next door'), title: tt('mail.parcel_from', 'A parcel from {from}', { from: tt('mail.nb_plum', 'Mrs. Plum next door') }), text: tt('mail.plum_scarf', 'I knitted too much again. A scarf for {name}. It is very long. Like my winters.', { name: nm }), gift: { item: 'Knit Scarf', cat: 'clothes', n: 1 } }; } // v2.4: once, from Bond 3
  if (r < 0.6) {
    const c = 10 + Math.floor(Math.random() * 16), [fromF, f] = PICK(GIFT_NEIGHBOURS), from = fromF();
    return { kind: 'gift', from: capFirst(from), title: tt('mail.something_from', 'A little something from {from}', { from }), text: f(c, nm), gift: { coins: c } };
  }
  let item = null;
  try {
    if (r < 0.8) { const c = PICK(cropsList()); item = { cat: 'seeds', id: c.id, name: c.seedItem || c.name + ' Seeds', n: 2 }; }
    else if (r < 0.88) { item = { cat: 'food', id: 'Pumpkin Purée', name: 'Pumpkin Purée', n: 2, bea: true }; } // v2.4: Baker Bea's parcel
    else { const x = PICK(pantryList()); item = { cat: 'pantry', id: x.id, name: x.name, n: 2 }; }
  } catch (e) { item = null; }
  if (!item) return { kind: 'gift', from: tt('mail.nb_plum', 'Mrs. Plum next door'), title: tt('mail.something_from', 'A little something from {from}', { from: tt('mail.nb_plum', 'Mrs. Plum next door') }), text: tt('mail.plum_sofa', '12 coins from the sofa. {name} supervised.', { name: nm }), gift: { coins: 12 } };
  const [fromF, f] = item.cat === 'seeds' ? GIFT_ITEM_NOTES[0] : item.bea ? GIFT_ITEM_NOTES[1] : PICK(GIFT_ITEM_NOTES.slice(1)), from = fromF();
  const shownItem = item.cat === 'seeds' ? tdata('crops.' + tid(item.id) + '.seeditem', item.name) : item.cat === 'pantry' ? tdata('pantry.' + tid(item.id) + '.name', item.name) : shNameAny(item.name);
  return { kind: 'gift', from: capFirst(from), title: tt('mail.parcel_from', 'A parcel from {from}', { from }), text: item.bea ? tt('mail.bea_pumpkin', 'Two pots of {item} for {name}. Plain pumpkin, no pie spice, no sugar. I checked twice.', { item: shownItem, name: nm }) : f(tt('mail.n_times', '{n} × {item}', { n: item.n, item: shownItem })), gift: { item: item.name, cat: item.cat, id: item.id, n: item.n } };
}
function dailyGift() {
  if (!S) return false; mailFields(); const t = localISO();
  if (S.mailGiftDay === t) return false;
  S.mailGiftDay = t; mailPush(giftRoll()); return true;
}

/* ---------- postcards from rehomed puppies ---------- */
// (n = the pup's name, sex = 'female' | 'male'); the letters keep the language they were written in
const CARD_LINES = [
  (n, sex) => tt('mail.card_1', '{sex, select, female {{n} learned to open the fridge. We changed the locks. She has not changed her ways.} other {{n} learned to open the fridge. We changed the locks. He has not changed his ways.}}', { n, sex }),
  (n, sex) => tt('mail.card_2', '{sex, select, female {{n} met a pigeon today. They are not friends. She is drafting a strongly worded bark.} other {{n} met a pigeon today. They are not friends. He is drafting a strongly worded bark.}}', { n, sex }),
  (n, sex) => tt('mail.card_3', '{sex, select, female {We took {n} to the beach. She dug a hole so deep we found a spoon from 1987.} other {We took {n} to the beach. He dug a hole so deep we found a spoon from 1987.}}', { n, sex }),
  (n) => tt('mail.card_4', '{n} sleeps in the laundry basket now. Clean socks are a distant memory.', { n }),
  (n) => tt('mail.card_5', '{n} says hi! (We think. It might have been a sneeze.)', { n }),
  (n, sex) => tt('mail.card_6', "{sex, select, female {{n} has a new best friend: the mail carrier's left shoe. She visits it daily.} other {{n} has a new best friend: the mail carrier's left shoe. He visits it daily.}}", { n, sex }),
  (n) => tt('mail.card_7', 'Growth update: {n} is now exactly one sofa cushion long. We measured.', { n }),
  (n, sex) => tt('mail.card_8', '{sex, select, female {{n} howled along to the radio. The neighbours asked for an encore. Or an ending. Unclear. She took a bow either way.} other {{n} howled along to the radio. The neighbours asked for an encore. Or an ending. Unclear. He took a bow either way.}}', { n, sex }),
  (n, sex) => tt('mail.card_9', '{sex, select, female {{n} sat on command! Then lay down, rolled over and fell asleep. She is an overachiever.} other {{n} sat on command! Then lay down, rolled over and fell asleep. He is an overachiever.}}', { n, sex }),
  (n) => tt('mail.card_10', '{n} stole a whole baguette and carried it home like a trophy. We are so proud and so hungry.', { n }),
  (n, sex) => tt('mail.card_11', '{sex, select, female {{n} tried to make friends with a snail. The snail is thinking about it. She is patient.} other {{n} tried to make friends with a snail. The snail is thinking about it. He is patient.}}', { n, sex }),
  (n) => tt('mail.card_12', 'Thank you for {n}. The house is louder, muddier and much, much happier.', { n })
];
const CARD_PS = [() => tt('mail.ps_1', 'P.S. Muddy paw print attached as a signature.'), () => tt('mail.ps_2', 'P.S. Sorry about the corner. It was chewed in transit. By the sender.'), () => tt('mail.ps_3', 'P.S. We tell everyone where we got our best friend.'), () => tt('mail.ps_4', 'P.S. Come say hi if you see us around town!')];
const CARD_POSES = ['happy', 'sit', 'jump', 'beg', 'shake', 'dig', 'pet', 'sleep'];
function cardSched(r) {
  const c = S.mailCards[r.id] || (S.mailCards[r.id] = { n: 0, next: isoAdd(r.since || localISO(), 1 + (hashId(r.id) % 2)) });
  return c;
}
function postcardFor(r) {
  const fam = mbFamFull(mailFamName(r.family)), c = S.mailCards[r.id], i = (hashId(r.id) + c.n * 7) % CARD_LINES.length;
  const pose = CARD_POSES[(hashId(r.id) + c.n * 3) % CARD_POSES.length];
  const dog = { id: r.id, key: r.key, genes: r.genes, born: r.born, mix: r.mix || null, sparkle: !!r.sparkle, sex: r.sex, name: r.name, coat: r.coat, eyes: r.eyes };
  return { kind: 'postcard', from: tt('mail.from_pair', '{name} & {family}', { name: r.name, family: shortFam(mailFamName(r.family)) }), title: c.n === 0 ? tt('mail.settled', '{name} has settled in!', { name: r.name }) : tt('mail.postcard_from', 'A postcard from {name}', { name: r.name }), text: (c.n === 0 ? tt('mail.settled_text', '{sex, select, female {{name} made it home with {family}. She has already claimed the best spot on the sofa.} other {{name} made it home with {family}. He has already claimed the best spot on the sofa.}}', { name: r.name, family: fam, sex: r.sex }) + ' ' : '') + CARD_LINES[i](r.name, r.sex), ps: CARD_PS[(hashId(r.id) + c.n) % CARD_PS.length](), dog, pose, pup: r.id, sparkle: !!r.sparkle };
}
function postcardTick() {
  if (!S) return 0; mailFields(); const t = localISO(); let n = 0;
  S.rehomed.forEach((r) => {
    if (!r || !r.id) return; const c = cardSched(r);
    if (c.next <= t) { mailPush(postcardFor(r)); jrPenpal(r); c.n++; c.next = isoAdd(t, 2 + (hashId(r.id + '|' + c.n) % 3)); n++; }
    n += jrPenpalCards(r, c, t);
  });
  if (n) markDirty(); return n;
}
/* ---------- v2.1: pen-pal schedule (day 14 and day 30 gifts, dog birthdays) and S.penpals ---------- */
function jrFamIdOf(f) {
  if (f && typeof f === 'object') return f.id || null;
  const s = String(f || ''), hit = FAMILIES.find((x) => s === x.name || s.startsWith(x.name + ' '));
  return hit ? hit.id : null;
}
function jrPenpal(r) {
  const id = jrFamIdOf(r && r.family); if (!id) return false; jrFields();
  if (S.penpals[id]) return false;
  S.penpals[id] = localISO(); markDirty(); jrFamCheck(); return true;
}
function jrPenpalBackfill() { // postcards already in the mailbox count as a first postcard
  if (!S) return; mailFields(); jrFields();
  S.mail.forEach((m) => { if (m && m.kind === 'postcard' && m.pup) { const r = S.rehomed.find((x) => x && x.id === m.pup); if (r) { const id = jrFamIdOf(r.family); if (id && !S.penpals[id]) { S.penpals[id] = m.date || localISO(); markDirty(); } } } });
}
const jrPupDog = (r) => ({ id: r.id, key: r.key, genes: r.genes, born: r.born, mix: r.mix || null, sparkle: !!r.sparkle, sex: r.sex, name: r.name, coat: r.coat, eyes: r.eyes });
function jrGiftCard(r, day, coins) {
  const fam = mbFamFull(mailFamName(r.family)), nm = r.name, month = day >= 30;
  const msg = { kind: 'postcard', id: `pp_${r.id}_d${day}`, from: tt('mail.from_pair', '{name} & {family}', { name: nm, family: shortFam(mailFamName(r.family)) }), title: month ? tt('mail.month_title', '{name}: one month in town!', { name: nm }) : tt('mail.photo_title', 'A photo from {name}', { name: nm }), sparkle: !!r.sparkle,
    text: month ? tt('mail.month_text', '{sex, select, female {{name} has lived with {family} for a whole month. She knows the way to every bakery. We sent a little something to say thank you.} other {{name} has lived with {family} for a whole month. He knows the way to every bakery. We sent a little something to say thank you.}}', { name: nm, family: fam, sex: r.sex }) : tt('mail.photo_text', '{sex, select, female {Here is a photo of {name}! She sat still for almost a second. We sent a little something to say thank you.} other {Here is a photo of {name}! He sat still for almost a second. We sent a little something to say thank you.}}', { name: nm, sex: r.sex }),
    ps: month ? tt('mail.month_ps', 'P.S. Please accept this for treats and tennis balls.') : tt('mail.photo_ps', 'P.S. The photographer got licked. Twice.'), dog: jrPupDog(r), pose: month ? 'happy' : 'sit', pup: r.id };
  msg.gift = { coins }; // v2.7: the coins wait in the card for Collect (before v2.7 they were paid on arrival, those cards carry claimed: true)
  return mailPush(msg);
}
// day 14 = 40 coins, day 30 = 80 coins (each paid once per pup, kept on the schedule record), then a birthday card every 12 real days from born (no gift)
function jrPenpalCards(r, c, t) {
  let n = 0; const since = r.since || t, days = isoDays(since, t); c.paid = c.paid && typeof c.paid === 'object' ? c.paid : {};
  if (days >= 14 && !c.paid.d14) { c.paid.d14 = t; jrGiftCard(r, 14, 40); jrPenpal(r); n++; }
  if (days >= 30 && !c.paid.d30) { c.paid.d30 = t; jrGiftCard(r, 30, 80); jrPenpal(r); n++; }
  if (/^\d{4}-\d{2}-\d{2}/.test(String(r.born || ''))) {
    const k = Math.floor(isoDays(r.born, t) / 12), last = c.bday || 0;
    if (k > last) {
      c.bday = k;
      if (k >= 1 && isoAdd(r.born, k * 12) >= isoDay(since)) { // a birthday from before the move is skipped
        const fam = mailFamName(r.family);
        mailPush({ kind: 'postcard', id: `pp_${r.id}_b${k}`, from: tt('mail.from_pair', '{name} & {family}', { name: r.name, family: shortFam(fam) }), title: tt('mail.birthday_title', 'Happy birthday, {name}!', { name: r.name }), sparkle: !!r.sparkle,
          text: tt('mail.birthday_text', '{sex, select, female {{name} is {age} today. She had a pupcake and wore the paper hat for nearly four seconds. Thank you for the best friend.} other {{name} is {age} today. He had a pupcake and wore the paper hat for nearly four seconds. Thank you for the best friend.}}', { name: r.name, age: k, sex: r.sex }), ps: tt('mail.birthday_ps', 'P.S. No gift this time. Just love.'), dog: jrPupDog(r), pose: 'happy', pup: r.id });
        n++;
      }
    }
  }
  if (n) markDirty(); return n;
}
function mailTick() { if (!S) return; try { postcardTick(); } catch (e) { console.warn('mail tick', e); } }

/* ---------- the mailbox in the yard ---------- */
function mailboxDoodle(flag, count) {
  return `<svg viewBox="0 0 120 160" class="mb-doodle"><path d="M58 70 L57 156 M66 70 L66 156" stroke="#5B3D32" stroke-width="3" fill="#C9A27A"/><rect x="55" y="70" width="13" height="86" fill="#C9A27A" stroke="#5B3D32" stroke-width="2.4"/>
    <path d="M14 46 Q14 22 40 22 L84 22 Q104 22 104 46 L104 74 L14 74 Z" fill="#E86F6F" stroke="#5B3D32" stroke-width="3" stroke-linejoin="round"/><path d="M22 40 Q24 30 38 29" fill="none" stroke="#FFFBF3" stroke-width="3" stroke-linecap="round" opacity=".7"/>
    <path d="M14 74 L14 46 Q14 30 26 26 L26 74 Z" fill="#C9534F" stroke="#5B3D32" stroke-width="2.4"/><text x="62" y="62" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="16" fill="#FFFBF3">${esc(tt('mail.sign', 'MAIL'))}</text>
    ${flag ? '<path d="M104 52 L104 16" stroke="#5B3D32" stroke-width="3"/><path d="M104 16 L126 21 L104 30 Z" fill="#E2453C" stroke="#5B3D32" stroke-width="2.2" stroke-linejoin="round"/>' : '<path d="M104 54 L126 54" stroke="#5B3D32" stroke-width="3"/><path d="M118 54 L126 49 L126 60 Z" fill="#E2453C" stroke="#5B3D32" stroke-width="2"/>'}
    ${count ? `<circle cx="22" cy="20" r="13" fill="#FFE3A1" stroke="#5B3D32" stroke-width="2.4"/><text x="22" y="26" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="18" fill="#5B3D32">${count > 9 ? '9+' : count}</text>` : ''}</svg>`;
}
function mailboxArt() { const n = mailUnread(); return artReal('prop', 'mailbox', { flag: n > 0, count: n }) || mailboxDoodle(n > 0, n); }
const MB_BOX = [286, 288, 90, 120]; // world x, y, w, h: over the scene's own mailbox by the fence, behind the dogs
function mailboxRefresh() {
  if (!S || cur.mode !== 'yard' || S.place !== 'yard') return;
  const svg = $('svg.world', view); if (!svg) return;
  const n = mailUnread(), lbl = (n ? tt('mail.aria_new', 'Mailbox: {n, plural, one {# new letter} other {# new letters}}', { n }) : tt('mail.aria', 'Mailbox'));
  const sceneHot = svg.querySelector('#sceneG [data-hot="mailbox"]');
  const old = svg.querySelector('#mailboxG');
  if (sceneHot) {
    if (old) old.remove();
    if (!sceneHot.dataset.mb) { sceneHot.dataset.mb = '1'; sceneHot.classList.add('hot'); sceneHot.setAttribute('tabindex', '0'); sceneHot.setAttribute('role', 'button'); sceneHot.addEventListener('click', () => openMailbox()); sceneHot.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMailbox(); } }); }
    sceneHot.setAttribute('aria-label', lbl); sceneHot.classList.toggle('mb-new', n > 0); return;
  }
  const html = `<g id="mailboxG" class="hot${n ? ' mb-new' : ''}" tabindex="0" role="button" aria-label="${esc(lbl)}" data-unread="${n}"><rect x="${MB_BOX[0]}" y="${MB_BOX[1]}" width="${MB_BOX[2]}" height="${MB_BOX[3]}" fill="transparent"/>${place(mailboxArt(), MB_BOX[0], MB_BOX[1], MB_BOX[2], MB_BOX[3])}</g>`;
  if (old) { old.outerHTML = html; } else {
    const anchor = svg.querySelector('#houseG') || svg.querySelector('#bowlG') || svg.querySelector('#pack');
    if (anchor) anchor.insertAdjacentHTML('beforebegin', html); else svg.insertAdjacentHTML('beforeend', html);
  }
  const g = svg.querySelector('#mailboxG'); if (!g) return;
  g.addEventListener('click', (e) => { e.stopPropagation(); openMailbox(); });
  g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMailbox(); } });
}

/* ---------- v2.1: the postcard album (12 pen-pal family slots) ---------- */
function jrAlbumFound() { jrFields(); return FAMILIES.map((f) => !!S.penpals[f.id]); }
function jrMailTabs(album) {
  const n = jrAlbumFound().filter(Boolean).length;
  return `<div class="tabs mbtabs" role="tablist"><button class="btn" role="tab" data-mbt="letters" aria-selected="${!album}"><span class="mbt-ic">${mailIcon()}</span>${tt('mail.tab_letters', 'Letters')}</button><button class="btn" role="tab" data-mbt="album" aria-selected="${album}"><span class="mbt-ic">${iconOr('album', '<rect x="-14" y="-12" width="28" height="24" rx="3" fill="#FFF3D6" stroke="#5B3D32" stroke-width="2.2"/><path d="M-8 -6 h16 v10 h-16z" fill="#BFE3F5" stroke="#5B3D32" stroke-width="1.8"/>')}</span>${tt('mail.tab_album', 'Album {n}/12', { n })}</button></div>`;
}
function jrAlbum() {
  const found = jrAlbumFound(), n = found.filter(Boolean).length, real = artReal('prop', 'album', { found });
  const slots = FAMILIES.map((f, i) => found[i] ? `<div class="al-slot found" data-slot="${i}"><span class="al-stamp" aria-hidden="true"><i></i></span><b>${esc(tdata('families.' + tid(f.id) + '.name', f.name))}</b><span class="small">${esc(tdata('families.' + tid(f.id) + '.where', f.where))}</span><span class="small">${esc(tt('mail.album_first', 'First postcard {date}', { date: S.penpals[f.id] }))}</span></div>` : `<div class="al-slot unk" data-slot="${i}"><b class="q">?</b><span class="small">${tt('mail.album_wait', 'Waiting for a postcard')}</span></div>`).join('');
  return `<div class="album" data-found="${n}">${real ? `<div class="al-art" aria-hidden="true">${real}</div>` : ''}<p class="al-head"><b>${n} / 12</b> ${tt('mail.album_families', 'pen-pal families')}<span class="small"> ${tt('mail.album_note', 'Each puppy you adopt out writes home. Every new family adds a stamp.')}</span></p><div class="al-grid">${slots}</div></div>`;
}

/* ---------- the mailbox popup ---------- */
let mailSel = null;
function letterPhoto(m) {
  if (!m.dog) return '';
  try { return dogSVG(m.dog, { pose: m.pose || 'happy' }); } catch (e) { return art('dog', m.dog.key || 'mutt'); }
}
function postcardHTML(m) {
  const real = artReal('prop', 'postcard');
  return `<div class="pc ${real ? 'pc-real' : 'pc-doodle'}${m.sparkle || (m.dog && m.dog.sparkle) ? ' pc-spk' : ''}">${real ? `<div class="pc-bg">${real}</div>` : '<span class="pc-stamp" aria-hidden="true"><i></i></span><span class="pc-mark" aria-hidden="true">DOODLE DOGGO</span><span class="pc-tape" aria-hidden="true"></span>'}
    <div class="pc-photo">${letterPhoto(m)}</div><div class="pc-addr"><span>${tt('mail.addr_to', 'To: you')}</span><span>${tt('mail.addr_yard', 'Home Yard')}</span><span>Doodle Doggo</span></div></div>`;
}
function letterBody(m) {
  if (!m) return `<div class="mb-empty"><p>${tt('mail.empty', 'No letters yet.')}</p><p class="small">${tt('mail.empty_note', 'The neighbours leave something every day, and puppies who move to town families write home.')}</p></div>`;
  const date = (() => { try { return tdate(new Date(m.date + 'T00:00:00'), { day: 'numeric', month: 'short' }); } catch (e) { return m.date; } })();
  let act = '';
  if (m.gift && (m.gift.coins || m.gift.item)) { // v2.7: a Collect button while the gift waits, a Collected stamp afterwards
    const lbl = esc(capFirst(mbGiftLabel(m.gift)));
    act = m.gift.claimed ? `<div class="mb-giftrow"><p class="mb-gift got">${lbl}</p><span class="mb-got" data-mbgot="${esc(m.id)}" tabindex="-1">${tt('mail.collected_stamp', 'Collected')}</span></div>`
      : `<div class="mb-giftrow"><p class="mb-gift">${lbl}</p><button class="btn yes mb-get" data-mbget="${esc(m.id)}">${tt('mail.collect', 'Collect')}</button></div>`;
  }
  if (m.kind === 'litter') {
    const taken = m.adopted || m.picked;
    act = taken ? `<p class="mb-gift got">${tt('mail.picked', 'You picked a puppy from this litter.')}</p>` : `<div class="mb-acts"><button class="btn yes" data-adoptpick="${esc(m.id)}">${tt('mail.adopt_pup', 'Adopt this pup')}</button><span class="small">${typeof slotsFree === 'function' ? tt('mail.free_spots', 'Free dog spots: {n}', { n: slotsFree() }) : ''}</span></div>`;
  }
  const pups = Array.isArray(m.pups) && m.pups.length ? `<div class="mb-pups">${m.pups.slice(0, 8).map((p) => `<span class="mb-pup" title="${esc(p.name || '')}">${(() => { try { return headSVG(p); } catch (e) { return ''; } })()}</span>`).join('')}</div>` : '';
  const card = (m.card === 'nengajo' && typeof nyCardHTML === 'function' && nyCardHTML(m)) || (m.kind === 'postcard' || (m.dog && m.kind !== 'gift') ? postcardHTML(m) : ''); // v2.8: a New Year letter is drawn as a nengajo (32_newyear.js)
  return `<article class="letter k-${esc(m.kind)}"><header><b>${esc(m.title)}</b><span class="small">${esc(tt('mail.from_date', 'From {from} · {date}', { from: m.from, date }))}</span></header>${card}${pups}<p class="mb-text">${esc(m.text)}</p>${m.ps ? `<p class="small mb-ps">${esc(m.ps)}</p>` : ''}${act}</article>`;
}
function openMailbox(selId, tab) {
  if (!S) return; mailFields(); audioPlace('journal'); jrFields();
  const album = tab === 'album';
  if (selId) mailSel = selId;
  else if (!album) { const u = S.mail.find((m) => !m.read); if (u) mailSel = u.id; }
  if (!S.mail.some((m) => m.id === mailSel)) mailSel = (S.mail[0] || {}).id || null;
  const sel = S.mail.find((m) => m.id === mailSel) || null;
  if (!album && sel && !sel.read) { sel.read = true; markDirty(); trackAct('mail', { id: sel.id, kind: sel.kind }); }
  const kindIc = { postcard: mailIcon(), gift: mailIcon(), litter: mailIcon(), news: mailIcon() }; // v2.3: the envelope drawing, not a letter monogram
  const list = S.mail.length ? S.mail.map((m) => `<button class="mb-item ${m.read ? '' : 'unread'} ${m.id === mailSel ? 'on' : ''} k-${esc(m.kind)}" data-mail="${esc(m.id)}" aria-pressed="${m.id === mailSel}"><span class="mb-k" aria-hidden="true">${m.dog ? headSVG(m.dog) : kindIc[m.kind] || mailIcon()}</span><span class="mb-t"><b>${esc(m.title)}</b><span class="small">${esc(m.from)}</span></span>${mbOwed(m) ? `<span class="small mb-chip">${tt('mail.gift_chip', 'Gift')}</span>` : ''}${m.read ? '' : `<i class="mb-dot" aria-label="${tt('mail.unread_dot', 'unread')}"></i>`}</button>`).join('') : `<p class="small">${tt('mail.list_empty', 'Empty. Just one very determined spider.')}</p>`;
  const n = mailUnread(), owed = S.mail.filter(mbOwed);
  const allBar = owed.length >= 2 ? `<div class="mb-allbar"><span>${tt('mail.owed', '{n, plural, one {# letter carries a gift.} other {# letters carry a gift.}}', { n: owed.length })}</span><button class="btn yes mb-all" data-mball="1">${tt('mail.collect_all', 'Collect all')}</button></div>` : '';
  const p = openModal(`<span class="mb-h-ic">${mailIcon()}</span>${tt('mail.title', 'Mailbox')}`, `${jrMailTabs(album)}${album ? jrAlbum() : `${allBar}<div class="mbox"><div class="mb-list" role="list">${list}</div><div class="mb-read">${letterBody(sel)}</div></div><p class="small mb-foot">${tt('mail.foot', '{n, plural, =0 {All caught up.} other {# unread.}} A neighbour drops something off every day.', { n })}</p>`}`, { cls: 'mailbox' });
  p.querySelectorAll('[data-mbt]').forEach((b) => { b.onclick = () => { SFX.click(); openMailbox(undefined, b.dataset.mbt); }; });
  p.querySelectorAll('[data-mail]').forEach((b) => { b.onclick = () => { SFX.click(); openMailbox(b.dataset.mail); }; });
  const mbRedraw = (focus) => { if (modal.hidden || !$('.panel.mailbox', modal)) return; const keep = mailSel; openMailbox(keep);
    setTimeout(() => { const f = (focus && $(focus, modal)) || $('.mb-got', modal); if (!f) return; try { f.focus({ preventScroll: true }); f.scrollIntoView({ block: 'nearest' }); } catch (e) { /* no focus */ } }, 60); }; // after openModal's own focus (30 ms): the stamp stays in view on a phone sheet
  p.querySelectorAll('[data-mbget]').forEach((b) => { b.onclick = () => { mbCollect([b.dataset.mbget]); mbRedraw(); }; });
  p.querySelectorAll('[data-mball]').forEach((b) => { b.onclick = () => { mbCollect(S.mail.filter(mbOwed).map((m) => m.id)); mbRedraw(); }; });
  p.querySelectorAll('[data-adoptpick]').forEach((b) => {
    b.onclick = () => {
      if (typeof adoptPick !== 'function') { nope(tt('mail.paperwork', 'The puppy paperwork is still at the printer. Try again soon.')); return; }
      const id = b.dataset.adoptpick; let r; try { r = adoptPick(id); } catch (e) { console.warn('adoptPick', e); }
      const m = S.mail.find((x) => x.id === id); if (m && r) m.adopted = true;
      markDirty(); if (!modal.hidden && $('.panel.mailbox', modal)) openMailbox(id);
    };
  });
  if (isPhone() && selId && !album) setTimeout(() => { const c = $('.mb-read .pc', p) || $('.mb-read', p); if (c && !modal.hidden) try { c.scrollIntoView({ block: 'nearest' }); } catch (e) { /* no scroll */ } }, 40); // v2.8 phones: the opened letter (its card) sits under the list, below the fold
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
on('game:ready', () => { mailFields(); jrPenpalBackfill(); mailTick(); });
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
      devPanel.appendChild(b); // after Close, so re-adding it never shifts the Close button
    } catch (e) { /* no dev panel */ }
  };
  try { if (typeof devPanel !== 'undefined' && devPanel) new MutationObserver(add).observe(devPanel, { childList: true, attributes: true, attributeFilter: ['hidden'] }); } catch (e) { /* no observer */ }
})();
function pawMailHelpers() {
  if (!window.__paw) return;
  Object.assign(window.__paw, { mbCollect: (ids) => mbCollect(ids), mbOwed: () => (S && Array.isArray(S.mail) ? S.mail.filter(mbOwed).map((m) => m.id) : []), mailNow,mailPush: (m) => mailPush(m), openMailbox: (id, tab) => openMailbox(id, tab), mailTick: () => mailTick(), dailyGift: () => dailyGift(), coatCheck: () => coatRewardsCheck(), jrFamCheck: () => jrFamCheck(), jrLine: () => jrBestLine(), titleGive: (n) => titleGive(n), jrAlbum: () => jrAlbumFound(), jrDecor: (n) => jrDecor(n), journal: (tab) => openJournal(tab) });
}
on('game:ready', pawMailHelpers); setTimeout(pawMailHelpers, 0);
