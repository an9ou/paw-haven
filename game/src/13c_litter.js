/* ======================= v2: 13c_litter.js (BREED lane) =======================
   Birth popup + naming, the nursery basket (yard / house) + Nursery popup, the "Who stays?" popup, rehoming to town FAMILIES,
   breedTick() and the test hooks window.__paw.breed. */
const FAMILIES = [
  { id: 'tanaka', name: 'the Tanakas', where: 'by the bakery' }, { id: 'reyes', name: 'Old Mr. Reyes', where: 'at the pier' },
  { id: 'okafor', name: 'the Okafor twins', where: 'on Maple Street' }, { id: 'lin', name: 'Grandma Lin', where: 'with the big veggie garden' },
  { id: 'nguyen', name: 'the Nguyens', where: 'above the bookshop' }, { id: 'patel', name: 'Ms. Patel', where: 'the town librarian' },
  { id: 'kowalski', name: 'the Kowalskis', where: 'with the red cargo bike' }, { id: 'abebe', name: 'Captain Abebe', where: 'from the ferry' },
  { id: 'moreno', name: 'the Morenos', where: 'next to the park gate' }, { id: 'haddad', name: 'Dr. Haddad', where: 'the dentist who hums' },
  { id: 'sato', name: 'the Sato sisters', where: 'at the café' }, { id: 'obrien', name: 'the O\'Briens', where: 'up on Hill Lane' }
];
const PUP_NAMES = ['Pip-Squeak', 'Bean', 'Tater Tot', 'Sprout', 'Pickle', 'Muffin', 'Dot', 'Scout', 'Nugget', 'Pebble', 'Tofu', 'Gizmo', 'Button', 'Clover', 'Waffle', 'Biscotti', 'Peaches', 'Mumble', 'Socks', 'Doodle', 'Crumpet', 'Jellybean', 'Noodle Jr.', 'Hiccup', 'Wobble', 'Fig', 'Toast', 'Sir Squeaks', 'Puddle', 'Marshmallow'];
const brFree = () => (typeof slotsFree === 'function' ? Math.max(0, slotsFree() | 0) : Math.max(0, Math.min(4, capacity()) - S.dogs.length));
function brPupName(r, pups, i) {
  const used = new Set(S.dogs.map((d) => d.name).concat((pups || []).map((p) => p.name).filter(Boolean), (S.rehomed || []).map((p) => p.name)));
  for (let k = 0; k < 40; k++) { const n = PUP_NAMES[Math.floor(r() * PUP_NAMES.length)]; if (!used.has(n)) return n; }
  return 'Pup ' + (i + 1);
}
const brRecSpec = (pp) => ({ id: pp.id, name: pp.name, key: pp.key, mix: pp.mix || null, sex: pp.sex, coat: pp.coat, eyes: pp.eyes, sparkle: !!pp.sparkle, born: pp.born, parents: pp.parents, gen: pp.gen || 1 });
const brSting = (n) => { try { if (window.PawAudio && typeof PawAudio.sting === 'function') PawAudio.sting(n); } catch (e) { /* ignore */ } };
// a nursery pup or letter pup becomes a real dog (uses a dog spot)
function brKeepPup(pp, name) {
  const d = addDog({ key: pp.key, sex: pp.sex, genes: JSON.parse(JSON.stringify(pp.genes)), born: pp.born || brToday(), id: pp.id }, (name || pp.name || 'Pup').slice(0, 16));
  d.parents = brPar(pp.parents); d.mix = pp.mix || null; d.sparkle = !!pp.sparkle; d.gen = pp.gen || 1; d.coat = pp.coat || d.coat; d.eyes = pp.eyes || d.eyes;
  d.bond = { level: 1, pts: 0 }; d.adoptedAt = brToday();
  treePut(brRec(d, 'home')); coatLog(brRec(d)); hudDogKey = ''; markDirty(); return d;
}

/* ---- birth ---- */
let brSnooze = 0;
const brCanPop = () => !!S && cur.mode === 'yard' && (S.place === 'yard' || S.place === 'house') && modal.hidden && !busy && Date.now() > brSnooze && !(typeof TRN !== 'undefined' && TRN);
function brBirth(dam) {
  const pr = dam.preg; if (!pr) return null; brFields();
  const today = brToday(), r = seeded(hashId('names|' + dam.id + '|' + pr.since));
  const pups = (pr.pups || []).map((pp, i) => Object.assign({}, pp, { born: today }));
  pups.forEach((pp, i) => { pp.name = i === 0 && !S.dogs.some((d) => d.name === dam.name + ' Jr.') ? dam.name.slice(0, 12) + ' Jr.' : brPupName(r, pups, i); });
  const L = { id: 'l_' + hashId(dam.id + '|' + today + '|' + pr.since).toString(36), mum: dam.id, sire: pr.sire, sireName: pr.sireName, born: today, until: brAddDays(today, BREEDING.RULES.puppyStayDays), pups, named: false };
  S.litters.push(L);
  dam.litters = (dam.litters || 0) + 1; dam.lastLitter = today; dam.preg = null;
  pups.forEach((pp) => { S.pupsBorn = (S.pupsBorn || 0) + 1; S.pupsSinceSparkle = pp.sparkle ? 0 : (S.pupsSinceSparkle || 0) + 1; treePut(Object.assign(brRecSpec(pp), { status: 'litter' })); coatLog(pp); });
  treePut(brRec(dam, 'home')); markDirty(); saveNow(); return L;
}
function brPupCard(pp, i, named) {
  const P = brPR(pp);
  return `<div class="lt-card ${pp.sparkle ? 'sparkly' : ''}" style="--i:${i}">${pp.sparkle ? '<span class="lt-spark">Sparkle!</span>' : ''}<span class="lt-art">${dogSVG(pp, { pose: 'sleep' })}</span>
    <span class="lt-sx">${sexSym(pp.sex)} ${pp.sex === 'female' ? 'Girl' : 'Boy'}</span><span class="small">${esc(pp.mix ? pp.mix.name : brBreed(pp.key))}<br>${esc(pp.coat)}, ${esc(pp.eyes)} eyes</span>
    ${named ? `<b>${esc(pp.name)}</b>` : `<label class="lt-name"><span class="sr">Name for pup ${i + 1}</span><input class="namebox" maxlength="16" data-pupname="${pp.id}" value="${esc(pp.name)}" aria-label="Name for the ${P.boy} pup"></label>`}</div>`;
}
function openBirth(litterId) {
  const L = S.litters.find((x) => x.id === litterId); if (!L) return;
  const mum = dogById(L.mum) || { name: 'Mum', key: 'mutt', id: L.mum }, sp = L.pups.some((p) => p.sparkle), n = L.pups.length;
  const lines = [`${mum.name} did amazingly. Everyone is warm, fed and making tiny squeaks.`, `${n === 1 ? 'One perfect pup' : n + ' wriggly pups'}! ${mum.name} counts them twice, just to be sure.`];
  const p = openModal('<span class="hl">Puppies!</span>', `<div class="lt-birth"><div class="lt-top"><div class="lt-mum">${dogSVG(mum, { pose: 'down', facing: 'right' })}</div><div class="lt-intro"><p class="lt-mumname">${esc(mum.name)} ${sexSym('female')} <span class="small">&amp; ${esc(L.sireName || 'dad')}</span></p>
    <p>${esc(lines[n % 2])}</p>${sp ? '<p class="lt-sparkline">One pup is <b>Sparkle</b>! A one-in-five-hundred twinkle. Purely cosmetic, purely magic.</p>' : ''}
    <p class="small">Name your pup${n > 1 ? 's' : ''} (press Enter to confirm). Newborns stay with mum for 2 days before anyone picks new homes.</p></div></div>
    <div class="lt-pups">${L.pups.map((pp, i) => brPupCard(pp, i, false)).join('')}</div></div>`, { cls: 'litter birth', foot: '<button class="btn yes big" id="ltOk">Welcome, little ones!</button>', onClose: () => brNameDone(L, p) });
  const ok = () => { brNameDone(L, p); modalClose = null; closeModal(); toast(`Welcome, ${L.pups.map((x) => x.name).join(', ')}! The nursery basket is ready.`, 'gold'); if (cur.mode === 'yard') brDrawNursery(); };
  $('#ltOk', p).onclick = ok;
  p.querySelectorAll('[data-pupname]').forEach((inp) => inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ok(); } }));
  const first = p.querySelector('[data-pupname]'); if (first) setTimeout(() => { first.focus({ preventScroll: true }); first.select(); }, 60);
  brSting('birth'); if (sp) setTimeout(() => brSting('sparkle'), 1200);
}
function brNameDone(L, p) {
  if (p) p.querySelectorAll('[data-pupname]').forEach((inp) => { const pp = L.pups.find((x) => x.id === inp.dataset.pupname); const v = (inp.value || '').trim().slice(0, 16); if (pp && v) pp.name = v; });
  L.named = true; L.pups.forEach((pp) => treePut({ id: pp.id, name: pp.name })); markDirty(); saveNow();
}

/* ---- nursery basket in the yard / house ---- */
const NURSERY_AT = { art: [575, 483, 220, 117], hit: [588, 528, 194, 72] };
function brBasketArt() {
  const real = artReal('prop', 'nursery'); if (real) return real;
  return `<svg viewBox="0 0 320 170" xmlns="http://www.w3.org/2000/svg"><g stroke="#5B3D32" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <ellipse cx="160" cy="132" rx="150" ry="34" fill="#E9C48D"/><path d="M14 128c4 -38 64 -58 146 -58s142 20 146 58" fill="#F5D7A4"/>
    <ellipse cx="160" cy="118" rx="128" ry="26" fill="#FBE3EA"/><path d="M50 118q20 -10 40 0t40 0t40 0t40 0t40 0" fill="none" stroke="#F28FA5" stroke-width="2.4"/>
    <path d="M22 140q14 6 28 0M62 148q14 6 28 0M104 152q14 6 28 0M146 154q14 6 28 0M188 152q14 6 28 0M230 148q14 6 28 0M270 140q14 6 28 0" fill="none" stroke-width="2"/>
    <rect x="232" y="84" width="62" height="30" rx="14" fill="#CFE6F7" transform="rotate(-8 263 99)"/></g></svg>`;
}
function brNurserySVG(L) {
  const pups = L.pups.slice(0, 3), n = pups.length, xs = n === 1 ? [125] : n === 2 ? [92, 160] : [66, 124, 182];
  const pupG = pups.map((pp, i) => place(dogSVG(pp, { pose: 'sleep', facing: i % 2 ? 'left' : 'right' }), xs[i], 62 + (i % 2) * 6, 82, 68)).join('');
  return `<svg viewBox="0 0 320 170" xmlns="http://www.w3.org/2000/svg">${place(brBasketArt(), 0, 0, 320, 170)}${pupG}<path class="ns-heart" d="M160 24c-6 -9 -18 -4 -14 6c3 7 14 12 14 12s11 -5 14 -12c4 -10 -8 -15 -14 -6z" fill="#F28FA5" stroke="#5B3D32" stroke-width="2"/></svg>`;
}
function brDrawNursery() {
  const old = $('#nurseryG'); if (old) old.remove();
  if (!S || cur.mode !== 'yard' || !(S.place === 'yard' || S.place === 'house')) return;
  const L = (S.litters || []).find((x) => dogById(x.mum)); if (!L) return;
  const svg = $('svg.world', view), anchor = $('#pack', svg || undefined); if (!svg || !anchor) return;
  const [ax, ay, aw, ah] = NURSERY_AT.art, [hx, hy, hw, hh] = NURSERY_AT.hit, mum = dogById(L.mum);
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('id', 'nurseryG'); g.setAttribute('class', 'hot nursery-basket'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
  g.setAttribute('aria-label', `Nursery: ${mum.name}'s ${L.pups.length === 1 ? 'puppy' : L.pups.length + ' puppies'}`); g.dataset.litter = L.id;
  g.innerHTML = `<g pointer-events="none">${place(brNurserySVG(L), ax, ay, aw, ah)}</g><rect x="${hx}" y="${hy}" width="${hw}" height="${hh}" rx="20" fill="transparent" pointer-events="all"/>`;
  anchor.parentNode.insertBefore(g, anchor); // behind every dog, so the dogs stay clickable
  const openIt = () => { SFX.click(); openNursery(L.id); };
  g.addEventListener('click', openIt); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openIt(); } });
}
on('yard:enter', () => { if (S && S.dogs && S.dogs.some((d) => !S.tree || !S.tree[d.id])) brBackfill(); brDrawNursery(); setTimeout(breedTick, 600); });
on('scene:redraw', () => { if (cur.mode === 'yard' && !$('#nurseryG')) brDrawNursery(); });

/* ---- nursery popup ---- */
function openNursery(litterId) {
  brFields(); const list = S.litters; const L = list.find((x) => x.id === litterId) || list[0]; if (!L) { nope('The nursery is empty. Very tidy.'); return; }
  const mum = dogById(L.mum) || { name: 'Mum', key: 'mutt', id: L.mum, stats: null }, left = Math.max(0, brDaysUntil(L.until));
  const today = brToday(); const pets = L.pets && L.pets.date === today ? L.pets.n : 0, idx = list.indexOf(L);
  const p = openModal(`${esc(mum.name)}'s nursery`, `<div class="ns-wrap"><div class="ns-bed">${dogSVG(mum, { pose: 'down', facing: 'right' })}<div class="ns-pups">${L.pups.map((pp) => `<span class="ns-pup" title="${esc(pp.name)}">${dogSVG(pp, { pose: 'sleep' })}<b>${esc(pp.name)} ${sexSym(pp.sex)}</b></span>`).join('')}</div><div class="ns-hearts" id="nsHearts" aria-hidden="true"></div></div>
    <p class="ns-count" id="nsCount">${left > 0 ? `Ready for new homes in ${left} day${left > 1 ? 's' : ''}.` : 'Ready for new homes today!'}</p>
    <p class="small">Newborns just nurse and sleep: no feeding needed. ${esc(mum.name)} eats for ${L.pups.length + 1} and stays home from walks.</p></div>`,
    { cls: 'litter nursery', foot: `${list.length > 1 ? `<button class="btn" id="nsNext">Next litter (${idx + 1}/${list.length})</button>` : ''}<button class="btn go big" id="nsPet" ${pets >= 3 ? 'aria-disabled="true"' : ''}>Pet softly (${3 - pets} left today)</button>${left <= 0 ? '<button class="btn yes big" id="nsChoose">Choose homes</button>' : ''}` });
  const nx = $('#nsNext', p); if (nx) nx.onclick = () => openNursery(list[(idx + 1) % list.length].id);
  const ch = $('#nsChoose', p); if (ch) ch.onclick = () => openWhoStays(L.id);
  $('#nsPet', p).onclick = () => {
    const t = brToday(); if (!L.pets || L.pets.date !== t) L.pets = { date: t, n: 0 };
    if (L.pets.n >= 3) { nope(`Shh. The pups are asleep, and ${mum.name} has had plenty of pets today.`); return; }
    L.pets.n++; if (mum.stats) mum.stats.happy = clamp(mum.stats.happy + 8, 0, 100); markDirty(); updateHUD(); SFX.boop && SFX.boop(880);
    const h = $('#nsHearts', p); if (h) { h.innerHTML = '<i></i><i></i><i></i><i></i>'; h.classList.remove('go'); void h.offsetWidth; h.classList.add('go'); }
    const b = $('#nsPet', p); b.textContent = `Pet softly (${3 - L.pets.n} left today)`; if (L.pets.n >= 3) b.setAttribute('aria-disabled', 'true');
    toast(PICK([`${mum.name} sighs happily. A pup lets out a tiny dream-squeak. +8 Happiness.`, `Soft pets for ${mum.name}. The pups wiggle closer. +8 Happiness.`, `${mum.name} thumps ${brPR(mum).his} tail very quietly. +8 Happiness.`]), 'good');
  };
}

/* ---- Who stays? ---- */
let brStay = {};
function openWhoStays(litterId) {
  brFields(); const L = S.litters.find((x) => x.id === litterId); if (!L) return;
  const mum = dogById(L.mum) || { name: 'Mum' }, free = brFree();
  L.pups.forEach((pp) => { if (!(pp.id in brStay)) brStay[pp.id] = false; });
  let kept = L.pups.filter((pp) => brStay[pp.id]).length;
  if (kept > free) { L.pups.forEach((pp) => { brStay[pp.id] = false; }); kept = 0; }
  const card = (pp, i) => `<div class="lt-card ws ${brStay[pp.id] ? 'stay' : 'home'} ${pp.sparkle ? 'sparkly' : ''}" style="--i:${i}">${pp.sparkle ? '<span class="lt-spark">Sparkle!</span>' : ''}<span class="lt-art">${dogSVG(Object.assign({}, pp), { pose: 'sit' })}</span>
    <b>${esc(pp.name)} ${sexSym(pp.sex)}</b><span class="small">${esc(pp.mix ? pp.mix.name : brBreed(pp.key))}<br>${esc(pp.coat)}</span>
    <div class="ws-tog" role="group" aria-label="${esc(pp.name)}"><button class="btn ${brStay[pp.id] ? 'yes' : ''}" data-ws="${pp.id}|stay" aria-pressed="${!!brStay[pp.id]}">Stay</button><button class="btn ${brStay[pp.id] ? '' : 'go'}" data-ws="${pp.id}|home" aria-pressed="${!brStay[pp.id]}">Loving home</button></div></div>`;
  const p = openModal('Who stays?', `<p>${esc(mum.name)}'s pups are 2 months old: big enough for new homes. Keep some, and the rest move in with kind families in town. They'll send postcards and visit.</p>
    <p class="ws-free" id="wsFree"><b>Free spots: ${free - kept}</b> <span class="small">(of ${free}. Kept pups use a dog spot.)</span></p>
    <div class="lt-pups">${L.pups.map(card).join('')}</div>`, { cls: 'litter whostays', foot: '<button class="btn yes big" id="wsOk">Done</button>', onClose: () => { brSnooze = Date.now() + 90000; } });
  p.querySelectorAll('[data-ws]').forEach((b) => {
    b.onclick = () => {
      const [id, v] = b.dataset.ws.split('|');
      if (v === 'stay' && !brStay[id] && L.pups.filter((pp) => brStay[pp.id]).length >= free) { nope(free ? `Only ${free} free dog spot${free > 1 ? 's' : ''}. The others will love their new families.` : 'No free dog spot right now. Every pup gets a loving home in town.'); return; }
      brStay[id] = v === 'stay'; SFX.click(); modalClose = null; openWhoStays(L.id);
    };
  });
  $('#wsOk', p).onclick = () => { modalClose = null; brFinishLitter(L); };
}
function brFinishLitter(L) {
  const free = brFree(), today = brToday(), keep = L.pups.filter((pp) => brStay[pp.id]).slice(0, free), lines = [];
  const r = seeded(hashId('family|' + L.id));
  const used = new Set((S.rehomed || []).map((x) => x.family && x.family.id));
  keep.forEach((pp) => { const d = brKeepPup(pp, pp.name); lines.push(`${d.name} stays home. ${brPR(d).He} immediately claims the comfiest cushion.`); });
  L.pups.filter((pp) => !keep.includes(pp)).forEach((pp) => {
    let fam = FAMILIES[Math.floor(r() * FAMILIES.length)]; for (let k = 0; k < 12 && used.has(fam.id); k++) fam = FAMILIES[(FAMILIES.indexOf(fam) + 1) % FAMILIES.length]; used.add(fam.id);
    const family = { id: fam.id, name: fam.name, where: fam.where };
    S.rehomed.push({ id: pp.id, name: pp.name, key: pp.key, mix: pp.mix || null, sex: pp.sex, coat: pp.coat, eyes: pp.eyes, sparkle: !!pp.sparkle, born: pp.born, genes: pp.genes, parents: pp.parents, gen: pp.gen || 1, family, since: today, lastVisit: null });
    treePut(Object.assign(brRecSpec(pp), { status: 'rehomed', family }));
    lines.push(`${pp.name} trots off with ${fam.name} ${fam.where}. ${PICK(['They promise postcards.', 'They already bought a tiny bed.', 'They promise lots of visits.', `${brPR(pp).He} looks back once, then sniffs ${brPR(pp).his} new human's shoe.`])}`);
  });
  S.litters = S.litters.filter((x) => x !== L); L.pups.forEach((pp) => delete brStay[pp.id]); markDirty(); saveNow();
  const p = openModal('New homes', `<div class="ws-bye" id="wsBye"><ul>${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul><p class="small">${S.rehomed.length ? 'You might bump into them around town. Wave!' : ''}</p></div>`, { cls: 'litter', foot: '<button class="btn yes big" id="wsBye2">Aww</button>' });
  $('#wsBye2', p).onclick = () => { closeModal(); if (cur.mode === 'yard') go('yard'); };
  SFX.fanfare && SFX.fanfare();
}

/* ---- the tick: births, choosing day, NPC letters ---- */
function breedTick() {
  if (!S || !S.dogs) return; brFields(); brNpcTick();
  const today = brToday();
  if (!brCanPop()) return;
  const dam = S.dogs.find((d) => d.preg && d.preg.due && today >= d.preg.due);
  if (dam) { const L = brBirth(dam); if (L) { openBirth(L.id); brDrawNursery(); } return; }
  const un = S.litters.find((l) => !l.named && dogById(l.mum)); if (un) { openBirth(un.id); return; }
  const ch = S.litters.find((l) => today >= l.until); if (ch) { openWhoStays(ch.id); return; }
  brLetterPopup();
}
// light poll so a waiting birth / choosing day pops as soon as the player is home with no popup open
setInterval(() => { if (!S || !S.dogs || !brCanPop()) return; const t = brToday(); if (S.dogs.some((d) => d.preg && d.preg.due && t >= d.preg.due) || (S.litters || []).some((l) => !l.named || t >= l.until) || (S.npcLitters || []).some((x) => !x.offered ? t >= x.ready : x.letterPending)) breedTick(); }, 2000);

/* ---- test hooks ---- */
function brTickDays(n) {
  n = n | 0; if (!S || !n) return; brFields(); const sh = (iso) => (iso ? brAddDays(iso, -n) : iso);
  S.dogs.forEach((d) => {
    if (d.born) { d.born = sh(d.born); if (d.sex === 'female') d.seasonSeed = ((((d.seasonSeed || 0) - n) % 6) + 6) % 6; } // age n months, keep the season phase
    ['restUntil', 'lastPlaydate', 'lastLitter', 'adoptedAt'].forEach((k) => { if (d[k]) d[k] = sh(d[k]); });
    if (d.preg) { d.preg.since = sh(d.preg.since); d.preg.due = sh(d.preg.due); }
  });
  S.litters.forEach((L) => { L.born = sh(L.born); L.until = sh(L.until); L.pups.forEach((pp) => { pp.born = sh(pp.born); }); });
  S.npcLitters.forEach((x) => { x.due = sh(x.due); x.ready = sh(x.ready); x.pups.forEach((pp) => { if (pp.born) pp.born = sh(pp.born); }); });
  S.rehomed.forEach((x) => { x.born = sh(x.born); x.since = sh(x.since); if (x.lastVisit) x.lastVisit = sh(x.lastVisit); });
  Object.values(S.tree).forEach((r) => { if (r.born) r.born = sh(r.born); });
  coatCache.clear(); hudDogKey = ''; markDirty(); saveNow();
}
function brSetSeason(id, onS) { const d = dogById(id); if (!d || d.sex !== 'female') return false; const m = ageMonths(d), H = BREEDING.RULES.heat; for (let s = 0; s < 6; s++) { const pos = (((m - H.firstMonths + s) % 6) + 6) % 6; if ((pos < H.lastsDays) === !!onS) { d.seasonSeed = s; markDirty(); return true; } } return false; }
const BREED_API = {
  canPair: (a, b, o) => { const r = canPair(a, b, o); return { ok: r.ok, why: r.why, code: r.code }; },
  playdate: (damId, sireId, o) => { const r = doPlaydate(damId, sireId, o || {}); return r; },
  npcPlaydate: (myId, npc, o) => { brNpc = Object.assign({ npc: true, stats: null, bond: null, fixed: false, litters: 0 }, npc, { npc: true }); return doPlaydate(myId, brNpc, o || {}); },
  issues: (id) => { const d = brAsDog(id); return d ? brIssues(d).map((x) => x.code) : []; },
  tickDays: (n) => brTickDays(n), setSeason: (id, onS) => brSetSeason(id, onS),
  birthNow: () => { S.dogs.forEach((d) => { if (d.preg) d.preg.due = brToday(); }); brSnooze = 0; breedTick(); },
  chooseNow: () => { (S.litters || []).forEach((L) => { L.until = brToday(); L.named = true; }); brSnooze = 0; breedTick(); },
  tick: () => { brSnooze = 0; breedTick(); }, free: () => brFree(), related: (a, b) => brRelated(brAsDog(a) || brLookup(a), brAsDog(b) || brLookup(b)),
  get litters() { return S ? S.litters || [] : []; }, get npcLitters() { return S ? S.npcLitters || [] : []; }, adoptPick: (id, pupId) => adoptPick(id, pupId),
  openPlaydates: (o) => openPlaydates(o), openNursery: (id) => openNursery(id), openWhoStays: (id) => openWhoStays(id)
};
function brExpose() { if (window.__paw && window.__paw.breed !== BREED_API) window.__paw.breed = BREED_API; }
on('game:ready', () => setTimeout(brExpose, 0));
setTimeout(brExpose, 0); setInterval(brExpose, 1000);
