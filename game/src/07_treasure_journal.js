/* ======================= TREASURE JOURNAL ======================= */
let jTab = 'treasures', jProfDog = null, jFamId = null, jCoatKey = null;
function stamp(r) { return `<span class="stamp r${r}">${RARITY[r]}</span>`; }
function tornMap() {
  const pieces = S.mapPieces.slice();
  const real = artReal('prop', 'torn-map', { pieces });
  if (real) return real;
  const q = { park: [0, 0], river: [120, 0], woods: [0, 80], beach: [120, 80] };
  return `<svg viewBox="0 0 240 160"><rect x="2" y="2" width="236" height="156" fill="none" stroke="#A8968A" stroke-dasharray="5 5"/>${ALL_ROUTES.map((k) => pieces.includes(k) ? `<rect x="${q[k][0] + 4}" y="${q[k][1] + 4}" width="112" height="72" rx="6" fill="#F5E6C8" stroke="${INKG}" stroke-width="2"/><text x="${q[k][0] + 60}" y="${q[k][1] + 46}" text-anchor="middle" font-family="Caveat,cursive" font-size="20" fill="${INKG}">${k}</text>` : '').join('')}${pieces.length >= 4 ? `<path d="M40 120 Q90 40 150 90 T200 40" fill="none" stroke="${INKG}" stroke-width="2.5" stroke-dasharray="6 6"/><path d="M190 30 l20 20 M210 30 l-20 20" stroke="#C9475E" stroke-width="4"/>` : ''}</svg>`;
}
function openJournal(tab) {
  if (tab) jTab = tab; audioPlace('journal');
  if (jTab === 'coats' || jTab === 'family' || jTab === 'profile') jrCheckAll();
  const foundN = TREASURES.filter((t) => S.found[t.n]).length;
  const tabs = [['profile', 'Profile'], ['family', 'Family'], ['coats', 'Coats'], ['treasures', `Treasures ${foundN}/${TREASURES.length}`], ['food', 'Food'], ['toys', 'Toys'], ['clothes', 'Clothes'], ['missions', 'Missions'], ['garden', gkOn() ? 'Garden' : 'Garden (soon)'], ['recipes', kOn() ? 'Recipes' : 'Recipes (soon)'], ['howto', 'How to play']];
  let body = '';
  if (jTab === 'family') body = journalFamily();
  else if (jTab === 'coats') body = journalCoats();
  else if (jTab === 'missions') body = typeof msTabHTML === 'function' ? msTabHTML() : '<p class="small">Missions are on their way.</p>'; // v2.4 (24_missions.js)
  else if (jTab === 'howto') body = typeof gdTabHTML === 'function' ? gdTabHTML() : '<p class="small">Gerald is still writing the guide.</p>'; // v2.4 (25_guide.js)
  else if (jTab === 'garden') body = gkOn() ? journalGarden() : soonCard('garden');
  else if (jTab === 'recipes') body = kOn() ? journalRecipes() : soonCard('kitchen');
  else if (jTab === 'profile') { const pd = dogById(jProfDog) || D(); body = pdogTabs(pd.id) + withDog(pd, () => journalProfile()); }
  else if (jTab === 'treasures') {
    const mp = S.mapPieces.length;
    const mapMsg = S.secretDug ? `Secret dig done. ${esc(NAME())} is a Treasure Legend.` : mp >= 4 ? 'All 4 pieces! An X has appeared on your lawn at home. Go dig it!' : `Map pieces: ${mp}/4. Each route hides one piece.`;
    body = `<div class="jtop"><div class="jprog"><b>${foundN} / ${TREASURES.length}</b><span class="small">treasures found</span><div class="prog"><i style="width:${foundN / TREASURES.length * 100}%"></i></div><p class="small" style="margin:6px 0 0">Every walk hides one treasure under one of its dig spots. Follow the Nose-o-meter.</p></div>
      <div class="jmap"><div class="jmap-art">${tornMap()}</div><span class="small">${mapMsg}</span></div></div>
      <div class="jgrid">${TREASURES.map((t) => {
        const f = S.found[t.n];
        if (!f) return `<div class="jent unk"><span class="art">${art('item', t.n)}</span><b>???</b><span class="small">${t.routes.length >= 6 ? 'Found anywhere, if you are lucky...' : 'Found ' + t.routes.map((r) => ROUTE_WORD[r]).join(' or ') + '...'}</span></div>`;
        let act = '';
        if (t.kind === 'wearable' || t.kind === 'charm') act = hasTreasure(t) ? `<button class="btn ${wearing(t.n) ? '' : 'yes'}" data-jeq="${esc(t.n)}">${wearing(t.n) ? 'Unequip' : 'Equip'}</button>` : '';
        if (t.kind === 'food') act = (S.inv.food[t.n] || 0) > 0 ? `<button class="btn yes" data-jfeed="${esc(t.n)}">Feed (${S.inv.food[t.n]})</button>` : '<span class="small">All eaten. Find more on walks.</span>';
        if (t.kind === 'toy') act = FETCH_TOYS.includes(t.n) ? `<button class="btn yes" data-jplay="${esc(t.n)}">Play fetch</button>` : '<span class="chip own">Works automatically</span>';
        if (t.kind === 'quest') act = '<span class="chip own">In the map</span>';
        return `<div class="jent"><span class="art">${art('item', t.n)}</span><b>${esc(t.n)}</b>${stamp(t.r)}<span class="ab"><b>${esc(t.ab)}.</b> ${esc(t.txt)}</span><span class="small">Found in ${esc(ROUTES[f.route] ? ROUTES[f.route].n : 'your yard')}, day ${f.day}</span>${act}</div>`;
      }).join('')}</div>`;
  } else if (jTab === 'food') {
    const fs = FOOD_ALL.filter((f) => f.n === 'Fresh Water' || (S.inv.food[f.n] || 0) > 0);
    body = (typeof fsJournalLine === 'function' ? (fsJournalLine() || '') : '') + `<div class="jgrid">${fs.map((f) => `<div class="jent"><span class="art">${art('item', f.n)}</span><b>${esc(f.n)}</b>${tInfo(f.n) ? stamp(tInfo(f.n).r) : ''}<span class="ab">${esc(f.note || '')}</span><span class="small">${f.n === 'Fresh Water' ? 'Always free' : 'You have ' + S.inv.food[f.n]}</span>${f.tip && typeof shFoodTip === 'function' ? `<span class="small jr-tip">${esc(shFoodTip(f.n, true) || f.tip)}</span>` : ''}<button class="btn yes" data-jfeed="${esc(f.n)}">Feed</button></div>`).join('')}</div>${fs.length <= 1 ? '<p class="small">The pantry is empty. Kibble Corner sells food, walks hide snacks.</p>' : ''}`;
  } else if (jTab === 'toys') {
    const ts = TOYS.map((t) => t.n).concat(TREASURES.filter((t) => t.kind === 'toy').map((t) => t.n)).filter((n) => owns('toys', n));
    body = `<div class="jgrid">${ts.map((n) => { const t = tInfo(n), shop = TOYS.find((x) => x.n === n); const act = toySupported(n) ? `<button class="btn yes" data-jtoyplay="${esc(n)}">Play</button>${FETCH_TOYS.includes(n) ? ` <button class="btn" data-jplay="${esc(n)}">Fetch</button>` : ''}` : FETCH_TOYS.includes(n) ? `<button class="btn yes" data-jplay="${esc(n)}">Play fetch</button>` : n === 'Squeaky Duck' || n === 'Rope Tug' ? `<button class="btn yes" data-jtoy="${n === 'Squeaky Duck' ? 'duck' : 'tug'}">Play</button>` : '<span class="chip own">Works automatically</span>'; return `<div class="jent"><span class="art">${art('item', n)}</span><b>${esc(n)}</b>${t ? stamp(t.r) : ''}<span class="ab">${esc(t ? t.ab + '. ' + t.txt : shop.note)}</span>${act}</div>`; }).join('')}</div>${ts.length ? '' : '<p class="small">No toys yet.</p>'}`;
  } else {
    const ws = ALL_WEAR.filter((c) => owns('clothes', c.n)).concat(CHARMS.filter((c) => S.inv.charms.includes(c.n)));
    body = `<div class="jgrid">${ws.map((c) => { const t = tInfo(c.n); return `<div class="jent"><span class="art">${art('item', c.n)}</span><b>${esc(c.n)}</b>${t ? stamp(t.r) : ''}<span class="small">${c.slot === 'charm' ? 'Charm slot' : SLOT_NAME[c.slot] + ' slot'}</span><span class="ab">${esc(c.perk)}</span><button class="btn ${wearing(c.n) ? '' : 'yes'}" data-jeq="${esc(c.n)}">${wearing(c.n) ? 'Unequip' : 'Equip'}</button></div>`; }).join('')}</div>${ws.length ? '' : '<p class="small">Nothing to wear yet. Bow-Wow Boutique sells clothes, walks hide treasures.</p>'}`;
  }
  const p = openModal('Treasure Journal', `<div class="tabs jtabs" role="tablist">${tabs.map(([k, l]) => `<button class="btn" role="tab" data-jt="${k}" aria-selected="${jTab === k}">${l}</button>`).join('')}</div>${body}`, { cls: 'journal j-' + jTab });
  p.querySelectorAll('[data-jt]').forEach((b) => { b.onclick = () => { SFX.click(); openJournal(b.dataset.jt); }; });
  p.querySelectorAll('[data-pdog]').forEach((b) => { b.onclick = () => { SFX.click(); jProfDog = b.dataset.pdog; jFamId = b.dataset.pdog; openJournal(); }; });
  p.querySelectorAll('[data-fam]').forEach((b) => { b.onclick = () => { SFX.click(); jFamId = b.dataset.fam; if (dogById(jFamId)) jProfDog = jFamId; openJournal('family'); }; });
  p.querySelectorAll('[data-cbreed]').forEach((b) => { b.onclick = () => { SFX.click(); jCoatKey = b.dataset.cbreed; openJournal('coats'); }; });
  p.querySelectorAll('[data-spots]').forEach((b) => { b.onclick = () => { SFX.click(); if (typeof openSpots === 'function') openSpots(); else toast(`Dog spots: ${S.dogs.length} dog${S.dogs.length > 1 ? 's' : ''} at home. More spots open with Bond.`); }; });
  if (jTab === 'family') pinFamNodes(p);
  if (isPhone()) pjJournalInit(p);
  if (isPhone() && jTab === 'coats') { const c = $('.cbreeds', p), on = c && $('.cbreed.on', c); if (on) { const a = c.getBoundingClientRect(), r = on.getBoundingClientRect(); c.scrollLeft += r.left - a.left - (a.width - r.width) / 2; } } // v2.5: 14 tabs, keep the chosen breed in view
  p.querySelectorAll('[data-jtitle]').forEach((b) => { b.onclick = () => { jrToggleTitle(b.dataset.jtitle); openJournal(); }; });
  p.querySelectorAll('[data-fpartner]').forEach((b) => { b.onclick = () => { SFX.click(); closeModal(); if (typeof openPlaydates === 'function') openPlaydates({ with: b.dataset.fpartner }); else toast('The Playdate board is still being pinned up. Try again soon.'); }; });
  p.querySelectorAll('[data-jeq]').forEach((b) => { b.onclick = () => { equip(b.dataset.jeq); openJournal(); }; });
  const toYard = (fn) => { closeModal(); if (cur.mode !== 'yard') go('yard'); setTimeout(fn, 350); };
  p.querySelectorAll('[data-jfeed]').forEach((b) => { b.onclick = () => toYard(() => feed(b.dataset.jfeed)); });
  p.querySelectorAll('[data-jplay]').forEach((b) => { b.onclick = () => toYard(() => playPick('fetch:' + b.dataset.jplay)); });
  p.querySelectorAll('[data-jtoy]').forEach((b) => { b.onclick = () => toYard(() => playPick(b.dataset.jtoy)); });
  p.querySelectorAll('[data-jopen]').forEach((b) => { b.onclick = () => { closeModal(); b.dataset.jopen === 'garden' ? openGarden() : openKitchen(); }; });
  p.querySelectorAll('[data-jtoyplay]').forEach((b) => { b.onclick = () => toYard(() => playPick('toy:' + b.dataset.jtoyplay)); });
}


/* ======================= v2: family register helpers (SYSTEMS) ======================= */
// Every record a dog id can point at: home dogs, nursery pups, rehomed pups, NPC litters, then the S.tree register.
const famParents = (r) => { const p = r && r.parents; if (!p) return [null, null]; if (Array.isArray(p)) return [p[0] || null, p[1] || null]; return [p.dam || null, p.sire || null]; };
function famRec(id) {
  if (!id || !S) return null;
  const T = (S.tree && typeof S.tree === 'object' && S.tree[id]) || null, home = dogById(id);
  if (home) return Object.assign({}, T || {}, { id, name: home.name, key: home.key, sex: home.sex, born: home.born, genes: home.genes, mix: home.mix || (T && T.mix) || null, sparkle: !!(home.sparkle || (T && T.sparkle)), parents: home.parents || (T && T.parents) || null, gen: home.gen, status: 'home', live: home, rescue: home.rescue });
  for (const l of S.litters || []) for (const p of (l && l.pups) || []) if (p && p.id === id) return Object.assign({}, T || {}, p, { status: 'litter', mum: l.mum });
  const r = (S.rehomed || []).find((x) => x && x.id === id); if (r) return Object.assign({}, T || {}, r, { status: 'rehomed' });
  for (const l of S.npcLitters || []) for (const p of (l && l.pups) || []) if (p && p.id === id) return Object.assign({ status: 'npc' }, T || {}, p);
  return T ? Object.assign({ status: 'npc' }, T, { id }) : null;
}
function famAllIds() {
  const ids = new Set(); if (!S) return ids;
  S.dogs.forEach((d) => ids.add(d.id)); Object.keys(S.tree || {}).forEach((k) => ids.add(k));
  (S.rehomed || []).forEach((r) => r && r.id && ids.add(r.id));
  (S.litters || []).concat(S.npcLitters || []).forEach((l) => ((l && l.pups) || []).forEach((p) => p && p.id && ids.add(p.id)));
  return ids;
}
function famChildren(id) {
  const out = []; if (!id) return out;
  famAllIds().forEach((k) => { const r = famRec(k); if (r && famParents(r).includes(id)) out.push(r); });
  return out.sort((a, b) => String(a.born || '').localeCompare(String(b.born || '')) || String(a.name).localeCompare(String(b.name)));
}
/* genes that show a given coat name for a breed (exact 3^5*2 enumeration, memoised): used to draw records that only stored a coat name */
const coatGeneMemo = {};
function coatGeneMap(key) {
  if (coatGeneMemo[key]) return coatGeneMemo[key];
  const G = PGN(), m = {}; if (!G) return m;
  const P = { B: [['B', 'B'], ['B', 'b'], ['b', 'b']], D: [['D', 'D'], ['D', 'd'], ['d', 'd']], E: [['E', 'E'], ['E', 'e'], ['e', 'e']], S: [['S', 'S'], ['S', 'sp'], ['sp', 'sp']], M: [['m', 'm'], ['M', 'm']], Bl: [['bl', 'bl'], ['Bl', 'bl'], ['Bl', 'Bl']] };
  try {
    for (const b of P.B) for (const d of P.D) for (const e of P.E) for (const s of P.S) for (const mm of P.M) for (const bl of P.Bl) {
      const g = { B: b, D: d, E: e, S: s, M: mm, Bl: bl }, ph = G.phenotype(g, key, 'coatbook');
      if (ph && ph.coatName && !m[ph.coatName]) m[ph.coatName] = g;
    }
  } catch (e) { /* genes module changed */ }
  coatGeneMemo[key] = m; return m;
}
function famDraw(r) { // something dogSVG/headSVG can draw
  if (!r) return null; if (r.live) return r.live;
  const o = { id: r.id, key: r.key || 'mutt', genes: r.genes, born: r.born, mix: r.mix || null, sparkle: !!r.sparkle, sex: r.sex, name: r.name };
  if (!o.genes && r.coat) { const g = coatGeneMap(o.key)[r.coat]; if (g) o.genes = g; }
  return o;
}
function famHead(r) { const d = famDraw(r); if (!d) return ''; try { return headSVG(d); } catch (e) { return art('dogHead', d.key); } }
const breedName = (k) => (dogInfo(k) || {}).breed || k;
function mixLine(r) {
  if (r && r.mix && r.mix.name) { const a = r.mix.a, b = r.mix.b; return a && b && a !== b ? `${r.mix.name}: ${breedName(a)} × ${breedName(b)}` : r.mix.name; }
  return r ? breedName(r.key) : '';
}
function famChip(r) {
  if (!r) return '';
  if (r.status === 'home') return '<span class="fchip home">Home</span>';
  if (r.status === 'litter') return '<span class="fchip nursery">Nursery</span>';
  if (r.status === 'rehomed') return `<span class="fchip away">With ${esc(shortFam(r.family))}</span>`;
  const who = r.family || r.owner; return `<span class="fchip npc">${who ? 'With ' + esc(shortFam(who)) : 'Town dog'}</span>`;
}
function pdogTabs(selId) {
  return S.dogs.length > 1 ? `<div class="tabs pdogs" role="tablist">${S.dogs.map((d) => `<button class="btn" role="tab" data-pdog="${d.id}" aria-selected="${d.id === selId}"><span class="ic">${headSVG(d)}</span>${esc(d.name)} ${d.sex === 'female' ? '♀' : '♂'}</button>`).join('')}</div>` : '';
}

/* ---------- Family tab ---------- */
const FT_POS = [[12.5, 16], [37.5, 16], [62.5, 16], [87.5, 16], [25, 47], [75, 47], [50, 79]]; // % of the 600x380 tree: grandparents, dam, sire, dog
function famTreeDoodle() {
  const leaf = (x, y, r, c) => `<path d="M${x - r} ${y} q${r * 0.2} -${r * 1.05} ${r} -${r * 0.95} q${r * 0.95} -${r * 0.15} ${r} ${r * 0.9} q-${r * 0.1} ${r * 1.05} -${r} ${r} q-${r * 1.0} ${r * 0.1} -${r} -${r * 0.95}z" fill="${c}" stroke="#5B3D32" stroke-width="2" stroke-linejoin="round"/>`;
  const br = (a, b, w) => `<path d="M${a[0]} ${a[1]} Q${(a[0] + b[0]) / 2 + 8} ${(a[1] + b[1]) / 2 + 14} ${b[0]} ${b[1]}" fill="none" stroke="#9C7452" stroke-width="${w}" stroke-linecap="round"/><path d="M${a[0]} ${a[1]} Q${(a[0] + b[0]) / 2 + 8} ${(a[1] + b[1]) / 2 + 14} ${b[0]} ${b[1]}" fill="none" stroke="#5B3D32" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`;
  const P = FT_POS.map(([x, y]) => [x * 6, y * 3.8]);
  return `<svg viewBox="0 0 600 380" class="ft-doodle" aria-hidden="true"><path d="M30 372 Q300 352 570 372" fill="none" stroke="#8FBF7A" stroke-width="6" stroke-linecap="round"/>
    ${br([300, 370], P[6], 18)}${br(P[6], P[4], 12)}${br(P[6], P[5], 12)}${br(P[4], P[0], 7)}${br(P[4], P[1], 7)}${br(P[5], P[2], 7)}${br(P[5], P[3], 7)}
    ${P.map(([x, y], i) => leaf(x - 34, y + 4, i === 6 ? 50 : 40, ['#CFEAB0', '#BFE3A6', '#D8EFC0', '#C6E6AE', '#BFE3A6', '#CFEAB0', '#E2F3CF'][i])).join('')}
    ${[[150, 330], [460, 335], [95, 250], [520, 240]].map(([x, y], i) => leaf(x, y, 9, i % 2 ? '#F7C6CF' : '#CFEAB0')).join('')}</svg>`;
}
function famNode(id, i, unknownTxt) {
  const r = famRec(id), [x, y] = FT_POS[i], st = `left:${x}%;top:${y}%`;
  if (!r) return `<div class="fnode unk ${i === 6 ? 'me' : ''}" data-node-i="${i}" style="${st}"><span class="fhead"><b>?</b></span><span class="fname">${esc(unknownTxt || '?')}</span></div>`;
  return `<button class="fnode ${i === 6 ? 'me' : ''} ${r.sparkle ? 'spk' : ''}" data-node-i="${i}" data-fam="${esc(r.id)}" style="${st}" title="${esc(mixLine(r))}"><span class="fhead">${famHead(r)}</span><span class="fname">${esc(r.name || '?')} ${sexSym(r.sex)}</span>${i === 6 ? '' : `<span class="fsub">${esc(r.mix && r.mix.name ? r.mix.name : breedName(r.key))}</span>`}</button>`;
}
function journalFamily() {
  if (!jFamId || !famRec(jFamId)) jFamId = (dogById(jProfDog) || D()).id;
  const me = famRec(jFamId), [dam, sire] = famParents(me);
  const shelterTxt = (r) => (r && (r.status === 'home' || r.status === 'rehomed' || r.status === 'litter') && !(r.gen > 0) ? 'Shelter rescue' : '?');
  const pRec = [famRec(dam), famRec(sire)];
  const gp = pRec.map((pr) => famParents(pr)).flat();
  const unkP = shelterTxt(me), unkG = pRec.map((pr) => (pr ? shelterTxt(pr) : '?'));
  const nodes = [0, 1, 2, 3].map((i) => famNode(gp[i], i, unkG[i < 2 ? 0 : 1])).join('') + famNode(dam, 4, unkP === '?' ? 'Mum: ?' : unkP) + famNode(sire, 5, unkP === '?' ? 'Dad: ?' : unkP) + famNode(me.id, 6);
  const art0 = artReal('prop', 'familytree');
  const kids = famChildren(me.id);
  const homeSel = dogById(me.id) ? me.id : null;
  const P = prOf(me), m = me.born ? ageMonths(me) : null;
  const about = `<div class="fam-me"><span class="portrait big">${famHead(me)}</span><div><h3>${esc(me.name)} ${sexSym(me.sex)}${me.sparkle ? ' <span class="spkbadge">Sparkle</span>' : ''}</h3>
    <p>${esc(mixLine(me))}</p><p class="small">${m != null ? `${ageText(m)} old · ` : ''}Generation ${me.gen || (dam || sire ? 1 : 0)}</p><p>${famChip(me)}</p>${jrPartnerBtn(me)}</div></div>`;
  const kidsHTML = kids.length ? `<div class="fkids">${kids.map((k) => `<button class="fkid ${k.sparkle ? 'spk' : ''}" data-fam="${esc(k.id)}"><span class="fhead">${famHead(k)}</span><span class="fname">${esc(k.name || '?')} ${sexSym(k.sex)}</span>${famChip(k)}</button>`).join('')}</div>`
    : `<p class="small fnone">No puppies yet. ${me.status === 'home' ? `When ${P.he} is grown up, a Puppy Playdate could change that.` : 'This branch is still growing.'}</p>`;
  const tree = `<div class="ft ${art0 ? 'ft-real' : ''}"><div class="ft-art">${art0 || famTreeDoodle()}</div>${nodes}</div>`;
  return `${pdogTabs(homeSel)}<div class="famwrap">${isPhone() ? pjTreeFrame(tree) : tree}
    <div class="fside">${about}${homeSel ? '' : `<button class="btn fback" data-fam="${esc((dogById(jProfDog) || D()).id)}">Back to ${esc((dogById(jProfDog) || D()).name)}</button>`}<h4>Puppies (${kids.length})</h4>${kidsHTML}<p class="small">Tap anyone on the tree to put them at the bottom.</p></div></div>`;
}
// v2.2 phone: the tree is wider than the screen, so it sits in a pannable frame (touch drag scrolls it, the Left and Right buttons are the fallback)
function pjTreeFrame(tree) {
  return `<div class="ft-wrap"><div class="ft-pan" tabindex="0" aria-label="Family tree: drag or use the buttons to look around">${tree}</div><div class="ft-btns"><button class="btn ftb-l" data-ftpan="-1" aria-label="Pan the tree left">Left</button><span class="small">Drag the tree to look around</span><button class="btn ftb-r" data-ftpan="1" aria-label="Pan the tree right">Right</button></div></div>`;
}
function pjJournalInit(p) {
  try {
    const on = p.querySelector('.jtabs [aria-selected="true"]'); if (on) { const bar = on.parentElement; bar.scrollLeft = Math.max(0, on.offsetLeft - (bar.clientWidth - on.offsetWidth) / 2); }
    const pan = p.querySelector('.ft-pan'); if (!pan) return;
    const me = pan.querySelector('.fnode.me');
    if (me) pan.scrollLeft = Math.max(0, me.offsetLeft - pan.clientWidth / 2);
    const step = () => Math.max(120, Math.round(pan.clientWidth * 0.6));
    p.querySelectorAll('[data-ftpan]').forEach((b) => { b.onclick = () => { SFX.click(); pan.scrollBy({ left: +b.dataset.ftpan * step(), behavior: document.documentElement.dataset.motion === 'off' ? 'auto' : 'smooth' }); }; });
  } catch (e) { /* keep the default view */ }
}
// When the real familytree prop marks its leaf spots with data-node, move our nodes onto them (sorted by height: 4 grandparents, 2 parents, the dog).
function pinFamNodes(p) {
  try {
    const ft = p.querySelector('.ft'), spots = ft ? [...ft.querySelectorAll('.ft-art [data-node]')] : []; if (spots.length < 7) return;
    const box = ft.getBoundingClientRect(); if (!box.width) return;
    const c = spots.map((el) => { const r = el.getBoundingClientRect(); return { x: (r.left + r.width / 2 - box.left) / box.width * 100, y: (r.top + r.height / 2 - box.top) / box.height * 100 }; }).sort((a, b) => a.y - b.y);
    const ord = c.slice(0, 4).sort((a, b) => a.x - b.x).concat(c.slice(4, 6).sort((a, b) => a.x - b.x), c.slice(6, 7));
    ft.querySelectorAll('[data-node-i]').forEach((n) => { const q = ord[+n.dataset.nodeI]; if (q) { n.style.left = q.x + '%'; n.style.top = q.y + '%'; } });
  } catch (e) { /* keep the default spots */ }
}

/* ---------- Coats tab: the Coat Collection ---------- */
const COAT_MILESTONES = [[5, 100], [10, 0], [15, 300], [25, 0], [30, 800], [40, 0], [50, 0]];
const JR_MILE_TXT = { 10: 'Gene Detective', 15: '300 + Ribbon', 25: 'Rainbow Collar', 40: 'Crayon Box', 50: 'Master Breeder' };
const RIBBON = 'Coat Collector Ribbon';
if (!CHARMS.some((c) => c.n === RIBBON)) CHARMS.push({ n: RIBBON, slot: 'charm', perk: 'Coat Collector: 15 coats found. Pure bragging rights. Other dogs can tell.' });
const JR_RAINBOW = 'Rainbow Collar';
// a reward wearable: in ALL_WEAR (wardrobe, Journal) but never in CLOTHES, so no shop lists it
if (!ALL_WEAR.some((c) => c.n === JR_RAINBOW)) ALL_WEAR.push({ n: JR_RAINBOW, slot: 'neck', price: 0, bond: 1, perk: 'Rainbow Collar: 25 coats found. Every colour, all at once.', reward: true });

/* ---------- v2.1: decorations, titles, defaults ---------- */
function jrDecor(name) {
  S.decor = S.decor || {}; if (!S.decor[name]) { S.decor[name] = { got: localISO(), out: true }; markDirty(); emit('decor:new', { name }); }
}
function jrFields() {
  if (!S) return;
  if (!S.titles || typeof S.titles !== 'object' || Array.isArray(S.titles)) S.titles = {};
  if (!S.famRewards || typeof S.famRewards !== 'object') S.famRewards = {};
  if (!S.penpals || typeof S.penpals !== 'object') S.penpals = {};
  if (!S.coatRewards || typeof S.coatRewards !== 'object') S.coatRewards = {};
  if (S.title && !S.titles[S.title]) S.titles[S.title] = localISO(); // 'Treasure Legend' and any other old name tag
  if (S.coatRewards[50] && !S.titles['Master Breeder']) S.titles['Master Breeder'] = String(S.coatRewards[50]).slice(0, 10) || localISO();
}
function jrShowTitle() { try { hudDogKey = ''; if (typeof setHudDog === 'function') setHudDog(); } catch (e) { /* hud not ready */ } }
function titleGive(name) {
  if (!S || !name) return false; jrFields();
  if (S.titles[name]) return false;
  S.titles[name] = localISO();
  if (!S.title) { S.title = name; jrShowTitle(); }
  markDirty(); toast(`New title: ${name}! Find it on the Profile.`, 'gold'); try { SFX.fanfare(); } catch (e) { /* audio off */ }
  return true;
}
function jrTitleList() { jrFields(); return Object.keys(S.titles).sort((a, b) => String(S.titles[a]).localeCompare(String(S.titles[b])) || a.localeCompare(b)); }
function jrTitlesRow() {
  const ts = jrTitleList();
  return `<div class="pf-titles"><b>Titles</b>${ts.length ? `<span class="small">Tap one to wear it on the name tag. Tap again to hide it.</span><div class="ptrow">${ts.map((t) => `<button class="ptitle ${S.title === t ? 'on' : ''}" data-jtitle="${esc(t)}" aria-pressed="${S.title === t}"><span class="ptic">${iconOr('title', '<circle r="12" fill="#FFE3A1" stroke="#5B3D32" stroke-width="2.2"/><path d="M-6 10 L-9 20 L0 15 L9 20 L6 10" fill="#E86F6F" stroke="#5B3D32" stroke-width="2"/>')}</span>${esc(t)}</button>`).join('')}</div>` : '<span class="small">None yet. Coats, family trees and postcards earn them.</span>'}</div>`;
}
function jrToggleTitle(name) {
  if (!S || !S.titles || !S.titles[name]) return;
  S.title = S.title === name ? '' : name; markDirty(); jrShowTitle(); try { SFX.click(); } catch (e) { /* audio off */ }
}
function jrAncLabel(d) {
  try {
    const G = window.PawGenes, anc = typeof ancOf === 'function' ? ancOf(d) : d.anc || null; if (!anc) return '';
    if (G && typeof G.grandMix === 'function') { const g = G.grandMix(anc); if (g && g.label) return g.label; }
    const es = Object.keys(anc).map((k) => [k, anc[k]]).filter((e) => e[1] > 0).sort((a, b) => b[1] - a[1]); if (!es.length) return '';
    const fr = (x) => { let n = Math.round(x * 64), dn = 64; while (n % 2 === 0 && dn > 1) { n /= 2; dn /= 2; } return `${n}/${dn}`; };
    return es.map((e, i) => (i === 0 ? '' : fr(e[1]) + ' ') + breedName(e[0])).join(', ');
  } catch (e) { return ''; }
}
function jrAncLine(d) { const l = d ? jrAncLabel(d) : ''; return l ? `<p class="small ancline">Ancestry: ${esc(l)}</p>` : ''; }

/* ---------- family rewards ---------- */
// the longest line of known records ending at `id` (the dog itself, then parents, grandparents...): returns the ids, youngest first
function jrLine(id, memo, seen) {
  if (memo[id]) return memo[id]; if (seen[id]) return [id]; seen[id] = 1;
  const [a, b] = famParents(famRec(id)); let best = [];
  [a, b].forEach((p) => { if (p && famRec(p)) { const l = jrLine(p, memo, seen); if (l.length > best.length) best = l; } });
  delete seen[id]; return (memo[id] = [id].concat(best));
}
function jrBestLine() {
  if (!S) return [];
  const memo = {}; let best = [];
  famAllIds().forEach((id) => { if (famRec(id)) { const l = jrLine(id, memo, {}); if (l.length > best.length) best = l; } });
  return best;
}
function jrFamCheck() {
  if (!S) return []; jrFields(); const got = [], F = S.famRewards, line = jrBestLine();
  if (line.length >= 3 && !F.gen3) {
    F.gen3 = localISO(); got.push('gen3'); jrDecor('Family Photo Frame');
    if (!S.portrait || !Array.isArray(S.portrait.ids) || !S.portrait.ids.length) S.portrait = { date: localISO(), ids: line.slice(0, 4) };
    toast('Three generations in one line! The Family Photo Frame is yours.', 'gold'); markDirty();
  }
  if (line.length >= 5 && !F.gen5) { F.gen5 = localISO(); got.push('gen5'); titleGive('Great-Great-Granddog'); markDirty(); }
  const sp = S.sparkleBook && typeof S.sparkleBook === 'object' ? S.sparkleBook : {};
  if (!F.glitter && coatBreeds().length && coatBreeds().every((k) => sp[k])) { F.glitter = localISO(); got.push('glitter'); titleGive('Glitter Legend'); markDirty(); }
  if (!F.penpals && FAMILIES.every((f) => S.penpals[f.id])) { F.penpals = localISO(); got.push('penpals'); titleGive('Friend of Paw Haven'); markDirty(); }
  return got;
}
function jrCheckAll() { try { coatSync(); coatRewardsCheck(); jrFamCheck(); } catch (e) { console.warn('journal check', e); } }
const coatBreeds = () => { const G = window.PawGenes; const b = G && Array.isArray(G.BREEDS) && G.BREEDS.length ? G.BREEDS : dogsList().map((d) => d.key); return b.slice(0, 14); };
function coatCatalogOf(key) {
  try { const G = window.PawGenes; if (G && typeof G.coatCatalog === 'function') { const c = G.coatCatalog(key); if (Array.isArray(c) && c.length) return c; } } catch (e) { /* older genes module */ }
  return null;
}
const coatBookOf = () => (S.coatBook && typeof S.coatBook === 'object' ? S.coatBook : (S.coatBook = {}));
const coatsFound = (key) => Object.keys(coatBookOf()).filter((k) => k.split('|')[0] === key).map((k) => k.slice(key.length + 1));
// bonus coats: a mix pup can show a coat outside its body breed's catalogue (coatCatalog {all:true}, flagged extra). They get a frame but are not counted.
const jrExtraMemo = {};
function coatExtras(key) {
  if (jrExtraMemo[key]) return jrExtraMemo[key]; let set = [];
  try { const G = window.PawGenes; if (G && typeof G.coatCatalog === 'function') { const c = G.coatCatalog(key, { all: true }); if (Array.isArray(c)) { set = c.filter((x) => x && x.extra).map((x) => x.coat); jrExtraMemo[key] = set; } } } catch (e) { /* older genes module */ }
  return set;
}
function coatIsBonus(key, coat) {
  const cat = coatCatalogOf(key); if (!cat || cat.some((c) => c.coat === coat)) return false;
  return coatExtras(key).includes(coat);
}
const coatCount = () => Object.keys(coatBookOf()).filter((k) => { const i = k.indexOf('|'); return !coatIsBonus(k.slice(0, i), k.slice(i + 1)); }).length;
// Log the coats of everyone at home and every rehomed pup (BREED logs births; this keeps starters, rescues and old saves in the book)
function coatSync() {
  if (!S || !S.dogs) return 0; const book = coatBookOf(); let n = 0;
  const log = (d, when) => { if (!d || !d.key) return; let c = ''; try { c = coatNameOf(d); } catch (e) { c = d.coat || ''; } if (!c) return; const k = d.key + '|' + c; if (!book[k]) { book[k] = when || localISO(); n++; } };
  S.dogs.forEach((d) => log(d, d.rescue && d.rescue.date)); (S.rehomed || []).forEach((r) => log(r, r.since));
  if (n) markDirty(); return n;
}
function coatRewardsCheck() {
  if (!S) return []; jrFields();
  const have = coatCount(), got = [];
  COAT_MILESTONES.forEach(([n, coins]) => {
    if (have < n || S.coatRewards[n]) return; S.coatRewards[n] = localISO(); got.push(n);
    if (coins) addCoins(coins, { raw: true });
    if (n === 15 && !S.inv.charms.includes(RIBBON)) S.inv.charms.push(RIBBON);
    if (n === 25 && !S.inv.clothes.includes(JR_RAINBOW)) S.inv.clothes.push(JR_RAINBOW);
    if (n === 40) jrDecor('Giant Crayon Box');
    const msg = n === 5 ? `Coat Collection: 5 coats! +${coins} coins. A very fashionable family.` : n === 10 ? 'Coat Collection: 10 coats! You are a Gene Detective now.' : n === 15 ? `Coat Collection: 15 coats! +${coins} coins and the ${RIBBON} charm.` : n === 25 ? 'Coat Collection: 25 coats! The Rainbow Collar is in your wardrobe. Every colour, all at once.' : n === 30 ? `Coat Collection: 30 coats! +${coins} coins. Scientists are taking notes.` : n === 40 ? 'Coat Collection: 40 coats! A Giant Crayon Box for the yard.' : 'Coat Collection: 50 coats! You are now a Master Breeder. It says so on the Profile.';
    toast(msg, 'gold'); try { SFX.fanfare(); } catch (e) { /* audio off */ }
    if (n === 10) titleGive('Gene Detective');
    if (n === 50) titleGive('Master Breeder');
  });
  if (got.length) markDirty(); return got;
}
function coatFrame(found, inner, cls) {
  const fr = artReal('prop', 'coatframe', { found });
  return `<span class="cframe ${fr ? 'cf-real' : 'cf-doodle'} ${found ? 'found' : 'unk'} ${cls || ''}">${fr ? `<span class="cf-bg">${fr}</span>` : ''}<span class="cf-in">${inner}</span></span>`;
}
function journalCoats() {
  const breeds = coatBreeds(); if (!jCoatKey || !breeds.includes(jCoatKey)) jCoatKey = breeds.includes((D() || {}).key) ? D().key : breeds[0];
  const cats = {}; breeds.forEach((k) => { cats[k] = coatCatalogOf(k); });
  const haveCats = breeds.every((k) => cats[k]);
  const total = haveCats ? breeds.reduce((a, k) => a + cats[k].length, 0) : 0, found = coatCount();
  const book = coatBookOf(), key = jCoatKey, mine = coatsFound(key), cat = cats[key];
  const list = cat ? cat.map((c) => ({ coat: c.coat, rare: !!c.rare, how: c.how || '', found: mine.includes(c.coat) })).concat(mine.filter((n) => !cat.some((c) => c.coat === n)).map((n) => ({ coat: n, found: true, bonus: coatIsBonus(key, n) }))) : mine.map((n) => ({ coat: n, found: true }));
  const cell = (c) => {
    if (c.found) { const g = coatGeneMap(key)[c.coat]; const d = { id: 'coat|' + key + '|' + c.coat, key, genes: g }; return `<div class="coat found ${c.rare ? 'rare' : ''} ${c.bonus ? 'bonus' : ''}" data-coat="${esc(c.coat)}">${coatFrame(true, (() => { try { return headSVG(d); } catch (e) { return art('dogHead', key); } })())}<b>${esc(c.coat)}</b><span class="small">${c.rare ? '<span class="rarechip">Rare</span> ' : ''}${c.bonus ? '<span class="bonuschip">Bonus</span> ' : ''}Found ${esc(book[key + '|' + c.coat] || '')}</span></div>`; }
    return `<div class="coat unk ${c.rare ? 'rare' : ''}">${coatFrame(false, '<b class="q">?</b>')}<b>???</b><span class="small">${mine.length ? esc(c.how || 'Keep breeding to discover it.') : 'Find any coat of this breed for a hint.'}</span></div>`;
  };
  const tabs = `<div class="cbreeds" role="tablist">${breeds.map((k) => { const n = coatsFound(k).filter((c) => !coatIsBonus(k, c)).length, t = cats[k] ? cats[k].length : null; return `<button class="cbreed ${k === key ? 'on' : ''}" role="tab" aria-selected="${k === key}" data-cbreed="${k}" title="${esc(breedName(k))}"><span class="ic">${art('dogHead', k)}</span><span>${n}${t ? '/' + t : ''}</span>${S.sparkleBook && S.sparkleBook[k] ? '<i class="cspk" aria-label="sparkle found">&#10022;</i>' : ''}</button>`; }).join('')}</div>`;
  const sp = S.sparkleBook && typeof S.sparkleBook === 'object' ? S.sparkleBook : {};
  const spN = breeds.filter((k) => sp[k]).length;
  const miles = COAT_MILESTONES.map(([n, c]) => `<span class="cmile ${S.coatRewards && S.coatRewards[n] ? 'done' : ''}" title="${n} coats"><b>${n}</b>${JR_MILE_TXT[n] || `${c} coins`}${S.coatRewards && S.coatRewards[n] ? ' &#10003;' : ''}</span>`).join('');
  return `<div class="ctop"><div class="ccount"><b>${found}${haveCats ? ' / ' + total : ''}</b><span class="small">coats${haveCats ? '' : ' found'}</span><div class="prog"><i style="width:${haveCats && total ? Math.min(100, found / total * 100) : Math.min(100, found * 2)}%"></i></div></div>
    <div class="cmiles">${miles}</div>
    <div class="csparkle" aria-label="Sparkle puppies: ${spN} of ${breeds.length}"><span class="small">Sparkle pups ${spN}/${breeds.length}</span><span class="cstars">${breeds.map((k) => `<i class="${sp[k] ? 'on' : ''}" title="${esc(breedName(k))}${sp[k] ? ': sparkle found' : ''}">&#10022;</i>`).join('')}</span></div></div>
    ${jrJarCard()}${jrMixesStrip()}
    ${tabs}<h4 class="cbh">${esc(breedName(key))} <span class="small">${mine.filter((c) => !coatIsBonus(key, c)).length}${cat ? ' of ' + cat.length : ''} found${mine.some((c) => coatIsBonus(key, c)) ? ' + bonus' : ''}</span></h4>
    ${list.length ? `<div class="cgrid">${list.map(cell).join('')}</div>` : `<p class="small cnone">No ${esc(breedName(key))} coats yet. Every dog you raise, every puppy born and every rescue adds their coat here.</p>`}`;
}
on('game:ready', () => { jrFields(); jrCheckAll(); });
on('dog:added', () => setTimeout(jrCheckAll, 0));
on('yard:enter', jrCheckAll);

/* ---------- v2.1: Sparkle Meter jar, Breeds & Mixes strip, Find a partner ---------- */
function jrJarSVG(fill) {
  const dots = []; for (let i = 0; i < fill; i++) dots.push(`<circle cx="${34 + (i % 4) * 17}" cy="${138 - Math.floor(i / 4) * 17}" r="4" fill="${i % 2 ? '#F28FA5' : '#FFD66E'}" stroke="#5B3D32" stroke-width="1"/>`);
  return `<svg viewBox="0 0 120 160"><rect x="26" y="26" width="68" height="120" rx="12" fill="#FFFBF3" stroke="#5B3D32" stroke-width="3"/><rect x="22" y="12" width="76" height="16" rx="5" fill="#C9A27A" stroke="#5B3D32" stroke-width="3"/>${dots.join('')}</svg>`;
}
function jrJarCard() {
  const fill = Math.max(0, Math.min(24, S.pupsSinceSparkle | 0));
  const real = artReal('prop', 'sparklejar', { fill });
  return `<div class="cjar" data-fill="${fill}"><span class="cjar-art">${real || jrJarSVG(fill)}</span><div><b>Sparkle Meter: ${fill} / 24</b><p class="small">${fill} / 24: a Sparkle is guaranteed by puppy 24.</p></div></div>`;
}
const JR_GRAND = ['Sled Noodle', 'Sunrise Loaf', 'Snowdrift', 'The Everything Dog'];
function jrMixesStrip() {
  const G = window.PawGenes, breeds = coatBreeds(), have = { breed: new Set(), mix: new Set(), grand: new Set() };
  const note = (n) => { if (n) have.mix.add(n); };
  famAllIds().forEach((id) => {
    const r = famRec(id); if (!r) return;
    if (r.key) have.breed.add(r.key);
    if (r.mix) { if (r.mix.a) have.breed.add(r.mix.a); if (r.mix.b) have.breed.add(r.mix.b); note(r.mix.name); if (r.mix.grand) have.grand.add(r.mix.grand); }
    try { const anc = typeof ancOf === 'function' ? ancOf(r) : r.anc || null; if (anc) { Object.keys(anc).forEach((k) => { if (anc[k] > 0) have.breed.add(k); }); if (G && typeof G.grandMix === 'function') { const g = G.grandMix(anc); if (g && g.name && g.kind !== 'breed') (g.kind === 'mix' ? have.mix : have.grand).add(g.name); } } } catch (e) { /* ancestry not ready */ }
  });
  const mixNames = []; try { Object.keys((G && G.MIXES) || {}).forEach((k) => { const n = G.MIXES[k].name; if (n && n !== 'Mutt mix' && !mixNames.includes(n)) mixNames.push(n); }); } catch (e) { /* no table */ }
  const chip = (txt, on, cls) => `<span class="mchip ${cls} ${on ? 'found' : 'unk'}" ${on ? '' : 'title="Not found yet"'}>${on ? esc(txt) : '?'}</span>`;
  const bN = breeds.filter((k) => have.breed.has(k)).length, mN = mixNames.filter((n) => have.mix.has(n)).length, gN = JR_GRAND.filter((n) => have.grand.has(n) || have.mix.has(n)).length;
  return `<div class="cmixes" aria-label="Breeds and mixes"><h4>Breeds &amp; Mixes <span class="small">${bN} of ${breeds.length} breeds, ${mN} mixes, ${gN} grand-mixes</span></h4>
    <div class="mrow">${breeds.map((k) => chip(breedName(k), have.breed.has(k), 'breed')).join('')}${mixNames.map((n) => chip(n, have.mix.has(n), 'mix')).join('')}${JR_GRAND.map((n) => chip(n, have.grand.has(n) || have.mix.has(n), 'grand')).join('')}</div></div>`;
}
function jrPartnerBtn(r) {
  try {
    if (!r || r.status !== 'home' || !r.live) return ''; const d = r.live;
    if (d.fixed || lifeStage(ageMonths(d)) === 'puppy') return '';
    return `<button class="btn fpartner" data-fpartner="${esc(d.id)}">Find a partner</button>`;
  } catch (e) { return ''; }
}
