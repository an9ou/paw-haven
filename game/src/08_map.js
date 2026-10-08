/* ======================= MAP ======================= */
function lockedAreas() { return [...new Set(Object.keys(ROUTES).filter((k) => topBond() < ROUTES[k].bond).concat(Object.keys(PLACES).filter((k) => topBond() < PLACES[k].bond)))]; }
function pickArea(k) {
  SFX.click();
  if (k === 'shelter') return go('shelter');
  if (PLACES[k]) return travelTo(k);
  const r = ROUTES[k]; if (!r) return;
  if (topBond() < r.bond) { nope(PICK([`Nope. ${r.n} opens at Bond ${r.bond}. The trees need time to warm up to you.`, `Nope. ${r.n} is Bond ${r.bond} only. There is a bouncer. He is a goose.`, `Nope nope. Bond ${r.bond} for ${r.n}. Rules are rules (we made them up).`])); return; }
  if (S.sleeping) { nope(`${NAME()} is asleep. Wake up first (Care menu).`); return; }
  if (S.stats.energy < 20) { nope(`${NAME()} lies down at the gate. Too sleepy for a walk. Try a nap first.`); return; }
  go('walk', k);
}
// v2.7: the Shelter Playroom (30_shelter.js). The list ("Looking for a home") opens from the Adopt me board, not by itself.
function enterShelter() { srEnterShelter(); }
