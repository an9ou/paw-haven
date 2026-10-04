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
function enterShelter() {
  setChrome(true, true);
  const rs = rescuesToday();
  view.innerHTML = `<svg class="world" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice">${sceneG('shelter')}${rs.map((r, i) => { const t = { id: r.id, key: r.key, genes: r.genes }, c = coatInfo(t); return place(dogArtSafe(r.key, Object.assign({ pose: i % 2 ? 'happy' : 'sit' }, c ? { coat: c.coat, seed: hashId(r.id) } : {})), 200 + i * 420, 380, 168, 140); }).join('')}</svg><button class="btn" id="shList" style="position:absolute;left:50%;bottom:20px;transform:translateX(-50%);z-index:4">Meet the dogs</button><div id="status"></div><button id="devBtn">dev</button>`;
  $('#shList').onclick = () => openShelterList();
  setTimeout(() => { if (cur.mode === 'shelter') openShelterList(); }, 250);
  setTimeout(() => { if (cur.mode === 'shelter' && modal.hidden) { say(PICK(NPC_JOKES), 260, 400); SFX.bark(1); } }, 900);
  updateHUD(); bindDev();
}

