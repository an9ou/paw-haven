/* ======================= TREASURE JOURNAL ======================= */
let jTab = 'treasures', jProfDog = null;
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
  const foundN = TREASURES.filter((t) => S.found[t.n]).length;
  const tabs = [['treasures', `Treasures ${foundN}/${TREASURES.length}`], ['food', 'Food'], ['toys', 'Toys'], ['clothes', 'Clothes'], ['garden', gkOn() ? 'Garden' : 'Garden (soon)'], ['recipes', kOn() ? 'Recipes' : 'Recipes (soon)'], ['profile', 'Profile']];
  let body = '';
  if (jTab === 'garden') body = gkOn() ? journalGarden() : soonCard('garden');
  else if (jTab === 'recipes') body = kOn() ? journalRecipes() : soonCard('kitchen');
  else if (jTab === 'profile') { const pd = dogById(jProfDog) || D(); body = (S.dogs.length > 1 ? `<div class="tabs pdogs" role="tablist">${S.dogs.map((d) => `<button class="btn" role="tab" data-pdog="${d.id}" aria-selected="${d.id === pd.id}"><span class="ic">${headSVG(d)}</span>${esc(d.name)} ${d.sex === 'female' ? '♀' : '♂'}</button>`).join('')}</div>` : '') + withDog(pd, () => journalProfile()); }
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
    body = `<div class="jgrid">${fs.map((f) => `<div class="jent"><span class="art">${art('item', f.n)}</span><b>${esc(f.n)}</b>${tInfo(f.n) ? stamp(tInfo(f.n).r) : ''}<span class="ab">${esc(f.note || '')}</span><span class="small">${f.n === 'Fresh Water' ? 'Always free' : 'You have ' + S.inv.food[f.n]}</span><button class="btn yes" data-jfeed="${esc(f.n)}">Feed</button></div>`).join('')}</div>${fs.length <= 1 ? '<p class="small">The pantry is empty. Kibble Corner sells food, walks hide snacks.</p>' : ''}`;
  } else if (jTab === 'toys') {
    const ts = TOYS.map((t) => t.n).concat(TREASURES.filter((t) => t.kind === 'toy').map((t) => t.n)).filter((n) => owns('toys', n));
    body = `<div class="jgrid">${ts.map((n) => { const t = tInfo(n), shop = TOYS.find((x) => x.n === n); const act = toySupported(n) ? `<button class="btn yes" data-jtoyplay="${esc(n)}">Play</button>${FETCH_TOYS.includes(n) ? ` <button class="btn" data-jplay="${esc(n)}">Fetch</button>` : ''}` : FETCH_TOYS.includes(n) ? `<button class="btn yes" data-jplay="${esc(n)}">Play fetch</button>` : n === 'Squeaky Duck' || n === 'Rope Tug' ? `<button class="btn yes" data-jtoy="${n === 'Squeaky Duck' ? 'duck' : 'tug'}">Play</button>` : '<span class="chip own">Works automatically</span>'; return `<div class="jent"><span class="art">${art('item', n)}</span><b>${esc(n)}</b>${t ? stamp(t.r) : ''}<span class="ab">${esc(t ? t.ab + '. ' + t.txt : shop.note)}</span>${act}</div>`; }).join('')}</div>${ts.length ? '' : '<p class="small">No toys yet.</p>'}`;
  } else {
    const ws = ALL_WEAR.filter((c) => owns('clothes', c.n)).concat(CHARMS.filter((c) => S.inv.charms.includes(c.n)));
    body = `<div class="jgrid">${ws.map((c) => { const t = tInfo(c.n); return `<div class="jent"><span class="art">${art('item', c.n)}</span><b>${esc(c.n)}</b>${t ? stamp(t.r) : ''}<span class="small">${c.slot === 'charm' ? 'Charm slot' : SLOT_NAME[c.slot] + ' slot'}</span><span class="ab">${esc(c.perk)}</span><button class="btn ${wearing(c.n) ? '' : 'yes'}" data-jeq="${esc(c.n)}">${wearing(c.n) ? 'Unequip' : 'Equip'}</button></div>`; }).join('')}</div>${ws.length ? '' : '<p class="small">Nothing to wear yet. Bow-Wow Boutique sells clothes, walks hide treasures.</p>'}`;
  }
  const p = openModal('Treasure Journal', `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button class="btn" role="tab" data-jt="${k}" aria-selected="${jTab === k}">${l}</button>`).join('')}</div>${body}`, { cls: 'journal' });
  p.querySelectorAll('[data-jt]').forEach((b) => { b.onclick = () => { SFX.click(); openJournal(b.dataset.jt); }; });
  p.querySelectorAll('[data-pdog]').forEach((b) => { b.onclick = () => { SFX.click(); jProfDog = b.dataset.pdog; openJournal('profile'); }; });
  p.querySelectorAll('[data-jeq]').forEach((b) => { b.onclick = () => { equip(b.dataset.jeq); openJournal(); }; });
  const toYard = (fn) => { closeModal(); if (cur.mode !== 'yard') go('yard'); setTimeout(fn, 350); };
  p.querySelectorAll('[data-jfeed]').forEach((b) => { b.onclick = () => toYard(() => feed(b.dataset.jfeed)); });
  p.querySelectorAll('[data-jplay]').forEach((b) => { b.onclick = () => toYard(() => playPick('fetch:' + b.dataset.jplay)); });
  p.querySelectorAll('[data-jtoy]').forEach((b) => { b.onclick = () => toYard(() => playPick(b.dataset.jtoy)); });
  p.querySelectorAll('[data-jopen]').forEach((b) => { b.onclick = () => { closeModal(); b.dataset.jopen === 'garden' ? openGarden() : openKitchen(); }; });
  p.querySelectorAll('[data-jtoyplay]').forEach((b) => { b.onclick = () => toYard(() => playPick('toy:' + b.dataset.jtoyplay)); });
}

