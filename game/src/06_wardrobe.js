/* ======================= WARDROBE ======================= */
function equip(n, quiet) {
  const c = ALL_WEAR.find((x) => x.n === n) || CHARMS.find((x) => x.n === n); if (!c) return;
  S.outfit[c.slot] = S.outfit[c.slot] === n ? null : n; markDirty(); SFX.pop();
  if (S.outfit[c.slot] && c.slot !== 'charm') { trackAct('wear', { name: n, slot: c.slot }); dailyCheck(); if (!S.daily.outfit) { S.daily.outfit = true; const tw = S.outfit.body === 'Tutu', lf = S.outfit.head === 'Leaf Beret' && S.outfit.neck === 'Autumn Scarf'; addStat('happy', tw || lf ? 10 : 5); toast(`Fashion bonus! +${tw ? '10 Happiness. Twirl!' : lf ? '10 Happiness. Autumn chic.' : '5 Happiness.'} ${NAME()} is feeling cute.`, 'good'); /* v2.5: Leaf Beret + Autumn Scarf, like the Tutu */ } else if (!quiet) toast(`${n} on. ${PICK(['Stunning.', 'Iconic.', 'A look.', 'Runway ready.'])}`); }
  if (S.outfit[c.slot] && c.slot === 'charm' && !quiet) toast(`${n} equipped as a charm. ${n === 'Sparkle Stone' ? 'It hums. Ominously. Cutely.' : 'Pocket luck activated.'}`, 'good');
  if (cur.mode === 'yard') renderDog(dogPoseNow());
}
function openWardrobe() {
  const owned = ALL_WEAR.filter((c) => owns('clothes', c.n));
  const opt = (c, s) => `<button class="opt" data-eq="${esc(c.n)}" aria-pressed="${S.outfit[s] === c.n}"><span class="ic">${art('item', c.n)}</span>${esc(c.n)}${hwTag(c.n)}${c.treasure || s === 'charm' ? ' <span class="tstar" title="Treasure">&#10022;</span>' : ''}</button>`;
  const slotRow = (s, label, opts, empty) => `<div class="slot"><h4>${label}</h4>${opts.length ? `<button class="opt" data-un="${s}" aria-pressed="${!S.outfit[s]}">Nothing</button>` + opts.map((c) => opt(c, s)).join('') : `<span class="small">${empty}</span>`}${s === 'body' ? shPjToggle() : ''}</div>`;
  const slots = SLOTS.map((s) => slotRow(s, SLOT_NAME[s], owned.filter((c) => c.slot === s), 'Nothing owned yet. Bow-Wow Boutique sells some, walks hide others.')).join('')
    + slotRow('charm', 'Charm', CHARMS.filter((c) => S.inv.charms.includes(c.n)), 'No charms yet. They are buried on walks.');
  const perks = SLOTS.concat('charm').map((s) => S.outfit[s]).filter(Boolean).map((n) => { const c = ALL_WEAR.find((x) => x.n === n) || CHARMS.find((x) => x.n === n); return c ? `${n}: ${c.perk}` : ''; });
  audioPlace('wardrobe');
  const p = openModal('Wardrobe', `<div class="ward"><div class="preview">${dogSVG(D(), { pose: 'happy', outfit: dogOutfit() })}${S.outfit.charm ? `<div class="charmtag">Charm: ${esc(S.outfit.charm)}</div>` : ''}</div><div>${slots}<p class="small">${perks.length ? 'Perks: ' + esc(perks.join(' ')) : 'Wearing: nothing but confidence.'}</p></div></div>`);
  p.querySelectorAll('[data-eq]').forEach((b) => { b.onclick = () => { equip(b.dataset.eq); openWardrobe(); }; });
  const pj = $('#shPj', p); if (pj) pj.onclick = () => { S.pjAuto = S.pjAuto === false; markDirty(); SFX.click(); if (cur.mode === 'yard') renderDog(dogPoseNow(), 'right', true); openWardrobe(); };
  p.querySelectorAll('[data-un]').forEach((b) => { b.onclick = () => { S.outfit[b.dataset.un] = null; markDirty(); SFX.click(); if (cur.mode === 'yard') renderDog(dogPoseNow()); openWardrobe(); }; });
}


/* ---- v2.4 SHOP: the Pyjamas at nap time, nap perks ---- */
// the outfit a dog is drawn in: while it sleeps (its nap flag or the sleep pose; dogSVG turns a greyhound's sleep into rollover after this), owned Pyjamas go on with the Nightcap unless the Wardrobe toggle is off
function shSleepOutfit(d, pose) {
  d = d || D(); const o = outfitOf(d);
  if ((d.sleeping || pose === 'sleep') && S && owns('clothes', 'Pyjamas') && S.pjAuto !== false) { o.body = 'Pyjamas'; o.sleepwear = true; }
  return o;
}
const shPjOn = () => S.outfit.body === 'Pyjamas' || (owns('clothes', 'Pyjamas') && S.pjAuto !== false);
function shPjToggle() {
  if (!owns('clothes', 'Pyjamas')) return '';
  const on = S.pjAuto !== false;
  return `<button class="opt sh-pj" id="shPj" aria-pressed="${on}"><span class="ic">${art('item', 'Pyjamas')}</span>Pyjamas at nap time: ${on ? 'on' : 'off'}</button>`;
}
// Cowboy Hat: outdoor naps x1.1. Pyjamas: x1.15 (worn, or put on at nap time)
function shNapMul() { return (S.outfit.head === 'Cowboy Hat' && S.place !== 'house' ? 1.1 : 1) * (shPjOn() ? 1.15 : 1); }
function shNapNote() { return `${S.outfit.head === 'Cowboy Hat' && S.place !== 'house' ? ', +10% Cowboy Hat' : ''}${shPjOn() ? ', +15% Pyjamas' : ''}`; }
on('game:ready', () => { if (S && typeof S.pjAuto !== 'boolean') S.pjAuto = true; });
