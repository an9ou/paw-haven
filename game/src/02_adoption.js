/* ======================= ADOPTION ======================= */
let adoptIdx = 0, adoptSex = null;
function enterAdopt() {
  setChrome(false, false);
  view.innerHTML = `<svg class="world" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice">${sceneG('shelter')}<g id="adoptDog"></g></svg>`;
  renderAdopt(true);
  const onKey = (e) => { if (!modal.hidden) return; const n = dogsList().length; if (e.key === 'ArrowLeft') { adoptIdx = (adoptIdx + n - 1) % n; renderAdopt(); } if (e.key === 'ArrowRight') { adoptIdx = (adoptIdx + 1) % n; renderAdopt(); } };
  window.addEventListener('keydown', onKey); onCleanup(() => window.removeEventListener('keydown', onKey));
}
function renderAdopt(first) {
  const dogs = dogsList(); if (adoptIdx >= dogs.length) adoptIdx = 0; const d = dogs[adoptIdx];
  $('#adoptDog').innerHTML = place(art('dog', d.key, { pose: 'idle' }), isPhone() ? 310 : 150, 210, 380, 317);
  dock.innerHTML = `<div class="tray"><div class="tray-h"><h3>Paw Haven Shelter: pick your new best friend</h3></div>
    <div class="adopt-card"><button class="arrow" id="aPrev" aria-label="Previous dog">&lt;</button>
      <div class="info"><h3>${esc(d.name)} <span class="small">the ${esc(d.breed)}</span></h3><p>${esc(d.personality)}</p>
      <p class="small">Loves: ${esc(favLine(d.key))}</p>
      <p class="sexpick">${esc(d.name)} has a brother and a sister here. Which one is coming home? <button class="btn sexbtn m" id="aBoy" aria-pressed="${adoptSex === 'male'}">&#9794; Boy</button><button class="btn sexbtn f" id="aGirl" aria-pressed="${adoptSex === 'female'}">&#9792; Girl</button></p></div>
      <button class="arrow" id="aNext" aria-label="Next dog">&gt;</button></div>
    <div class="heads">${dogs.map((x, i) => `<button data-i="${i}" aria-label="${esc(x.name)} the ${esc(x.breed)}" aria-current="${i === adoptIdx}">${art('dogHead', x.key)}</button>`).join('')}</div>
    <div class="foot" style="margin-top:4px"><button class="btn big yes" id="aAdopt">Adopt ${esc(d.name)}</button></div></div>`;
  $('#aPrev').onclick = () => { adoptIdx = (adoptIdx + dogs.length - 1) % dogs.length; adoptSex = null; renderAdopt(); };
  $('#aNext').onclick = () => { adoptIdx = (adoptIdx + 1) % dogs.length; adoptSex = null; renderAdopt(); };
  dock.querySelectorAll('.heads button').forEach((b) => { b.onclick = () => { adoptIdx = +b.dataset.i; adoptSex = null; renderAdopt(); }; });
  $('#aBoy').onclick = () => { adoptSex = 'male'; SFX.boop(520); renderAdopt(true); };
  $('#aGirl').onclick = () => { adoptSex = 'female'; SFX.boop(700); renderAdopt(true); };
  $('#aAdopt').onclick = () => { if (!adoptSex) { nope(`Pick Boy or Girl first. ${d.name}'s siblings are waiting politely.`); return; } adoptName(d); };
  if (!first) SFX.bark(BARK[d.key] || 1);
  setTimeout(() => say(d.joke || PICK(JOKES[d.key] || JOKES.mutt), isPhone() ? 560 : 380, 250, 6000), 60);
}
function favLine(k) {
  const f = FAV[k]; if (k === 'mutt' || !f) return 'petting. Favourite snack and toy: a surprise, rolled at adoption.';
  return `${f.act}, ${f.food.join(' and ')}, ${f.toy}`;
}
function adoptName(d) {
  SFX.boop(660);
  const P0 = adoptSex === 'female' ? { him: 'her', boy: 'girl' } : { him: 'him', boy: 'boy' };
  const p = openModal(`Name your ${P0.boy} ${esc(d.breed)} ${sexSym(adoptSex)}`, `<p>The shelter calls ${P0.him} <b>${esc(d.name)}</b>. You can keep that name, or pick something even sillier.</p>
    <label for="nameIn" class="small">Name (12 letters max)</label><input id="nameIn" class="namebox" maxlength="12" value="${esc(d.name)}" autocomplete="off" autofocus>
    <p class="small" id="nameHint"></p>`, { foot: `<button class="btn no" id="nBack">Back</button><button class="btn yes big" id="nOk">That's the name</button>` });
  const inp = $('#nameIn', p); setTimeout(() => { inp.focus(); inp.select(); }, 60);
  const done = () => {
    let nm = inp.value.replace(/\s+/g, ' ').trim().slice(0, 12); if (!nm) nm = d.name;
    if (/\b(poo+p?|butt|fart)\b/i.test(nm)) $('#nameHint', p).textContent = 'Bold choice. We respect it.';
    S = freshState(d.key, nm, adoptSex); S.careDays = 0; S.careDayLast = ''; S.spotsSeen = 1; if (!Array.isArray(S.litters)) S.litters = []; levelQueue = []; dailyCheck(); saveNow(); closeModal(); audioCue('adopt'); intro();
  };
  $('#nOk', p).onclick = done; inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(); });
  $('#nBack', p).onclick = () => { SFX.click(); closeModal(); };
}
function intro() {
  const n = esc(NAME());
  const pages = [
    ['Welcome to Paw Haven', `<p>Population: you, <b>${n}</b>, and one suspicious duck.</p><p>${n} is now your dog. There is no take-backs policy. ${n} checked.</p>`],
    ['How this works', `<p>Keep the four meters up: <b>Hunger</b>, <b>Happiness</b>, <b>Energy</b>, <b>Cleanliness</b>. Nothing bad ever happens if they drop. ${n} just gets very dramatic about it.</p><p>Every game hour here is one real minute.</p>`],
    ['Your starter kit', `<p>5 Basic Kibble, 3 Bone-shaped Biscuits, 1 Pupcake, a Tennis Ball, a Cardboard Box (luxury) and 150 Paw Coins.</p><p><b>Tip:</b> rub ${n} with your mouse or finger to pet. Go on. Rub.</p>`]
  ];
  let i = 0;
  const show = () => {
    const [t, b] = pages[i];
    const p = openModal(t, b, { noX: true, foot: `<button class="btn yes big" id="iNext">${i < pages.length - 1 ? 'Next' : 'Let\'s go home'}</button>` });
    $('#iNext', p).onclick = () => { SFX.boop(600 + i * 80); i++; if (i < pages.length) { modal.hidden = true; show(); } else { closeModal(); go('yard'); setTimeout(() => { if (cur.mode === 'yard') toast(`Rub ${NAME()} to pet. Tap Feed to fill the bowl.`, 'gold'); }, 900); } };
  };
  show();
}

