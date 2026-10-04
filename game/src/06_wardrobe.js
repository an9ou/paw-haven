/* ======================= WARDROBE ======================= */
function equip(n, quiet) {
  const c = ALL_WEAR.find((x) => x.n === n) || CHARMS.find((x) => x.n === n); if (!c) return;
  S.outfit[c.slot] = S.outfit[c.slot] === n ? null : n; markDirty(); SFX.pop();
  if (S.outfit[c.slot] && c.slot !== 'charm') { dailyCheck(); if (!S.daily.outfit) { S.daily.outfit = true; addStat('happy', 5); toast(`Fashion bonus! +5 Happiness. ${NAME()} is feeling cute.`, 'good'); } else if (!quiet) toast(`${n} on. ${PICK(['Stunning.', 'Iconic.', 'A look.', 'Runway ready.'])}`); }
  if (S.outfit[c.slot] && c.slot === 'charm' && !quiet) toast(`${n} equipped as a charm. ${n === 'Sparkle Stone' ? 'It hums. Ominously. Cutely.' : 'Pocket luck activated.'}`, 'good');
  if (cur.mode === 'yard') renderDog(dogPoseNow());
}
function openWardrobe() {
  const owned = ALL_WEAR.filter((c) => owns('clothes', c.n));
  const opt = (c, s) => `<button class="opt" data-eq="${esc(c.n)}" aria-pressed="${S.outfit[s] === c.n}"><span class="ic">${art('item', c.n)}</span>${esc(c.n)}${c.treasure || s === 'charm' ? ' <span class="tstar" title="Treasure">&#10022;</span>' : ''}</button>`;
  const slotRow = (s, label, opts, empty) => `<div class="slot"><h4>${label}</h4>${opts.length ? `<button class="opt" data-un="${s}" aria-pressed="${!S.outfit[s]}">Nothing</button>` + opts.map((c) => opt(c, s)).join('') : `<span class="small">${empty}</span>`}</div>`;
  const slots = SLOTS.map((s) => slotRow(s, SLOT_NAME[s], owned.filter((c) => c.slot === s), 'Nothing owned yet. Bow-Wow Boutique sells some, walks hide others.')).join('')
    + slotRow('charm', 'Charm', CHARMS.filter((c) => S.inv.charms.includes(c.n)), 'No charms yet. They are buried on walks.');
  const perks = SLOTS.concat('charm').map((s) => S.outfit[s]).filter(Boolean).map((n) => { const c = ALL_WEAR.find((x) => x.n === n) || CHARMS.find((x) => x.n === n); return c ? `${n}: ${c.perk}` : ''; });
  audioPlace('wardrobe');
  const p = openModal('Wardrobe', `<div class="ward"><div class="preview">${dogSVG(D(), { pose: 'happy', outfit: dogOutfit() })}${S.outfit.charm ? `<div class="charmtag">Charm: ${esc(S.outfit.charm)}</div>` : ''}</div><div>${slots}<p class="small">${perks.length ? 'Perks: ' + esc(perks.join(' ')) : 'Wearing: nothing but confidence.'}</p></div></div>`);
  p.querySelectorAll('[data-eq]').forEach((b) => { b.onclick = () => { equip(b.dataset.eq); openWardrobe(); }; });
  p.querySelectorAll('[data-un]').forEach((b) => { b.onclick = () => { S.outfit[b.dataset.un] = null; markDirty(); SFX.click(); if (cur.mode === 'yard') renderDog(dogPoseNow()); openWardrobe(); }; });
}

