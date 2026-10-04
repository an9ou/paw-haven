/* Test stubs for the v1.2 modules (PawAudio, PawWalk, PawToys). Never shipped. */
(function () {
  const A = window.PawAudio = window.PawAudio || {};
  if (!A.init) {
    let vols = { master: 0.8, music: 0.6, sfx: 0.8, ambience: 0.5 }, muted = false;
    A.contexts = [];
    A.init = function () { if (A.ctx) return; const AC = window.AudioContext || window.webkitAudioContext; A.ctx = new AC(); const g = () => A.ctx.createGain(); A.bus = { master: g(), music: g(), sfx: g(), ambience: g() }; ['music', 'sfx', 'ambience'].forEach((k) => A.bus[k].connect(A.bus.master)); A.bus.master.connect(A.ctx.destination); };
    A.setContext = (c) => { A.contexts.push(c); A.last = c; };
    A.setVolumes = (v) => { vols = Object.assign(vols, v); if (A.bus) { A.bus.master.gain.value = muted ? 0 : vols.master; A.bus.sfx.gain.value = vols.sfx; } };
    A.getVolumes = () => Object.assign({}, vols); A.setMuted = (m) => { muted = m; if (A.bus) A.bus.master.gain.value = m ? 0 : vols.master; }; A.isMuted = () => muted;
    A.duck = () => { A.ducked = (A.ducked || 0) + 1; }; A.stinger = (n) => { A.stingers = (A.stingers || []).concat(n); };
  }
  if (!window.PawWalk) window.PawWalk = { start(el, o) {
    el.innerHTML = `<div style="padding:30px;font:20px 'Patrick Hand'"><h2 style="font-family:Caveat">PawWalk stub: ${o.area} · ${o.time} · ${o.weather}</h2><p>first walk: ${o.firstWalk} · abilities: ${Object.keys(o.abilities).filter((k) => o.abilities[k]).join(', ') || 'none'} · bag: ${o.bag.map((b) => b.name + ' x' + b.count).join(', ') || 'empty'}</p><button id="pwDig">Dig the right X</button> <button id="pwJunk">Wrong dig</button> <button id="pwBag">Use bag</button> <button id="pwEnd">Finish walk</button><p id="pwLog"></p></div>`;
    let treasure = null; const junk = [];
    el.querySelector('#pwDig').onclick = () => { treasure = o.rollTreasure(o.area); o.sfx('treasure'); el.querySelector('#pwLog').textContent = JSON.stringify(treasure); };
    el.querySelector('#pwJunk').onclick = () => { junk.push(o.junk()); o.sfx('dig'); };
    el.querySelector('#pwBag').onclick = () => { if (o.bag[0]) el.querySelector('#pwLog').textContent = 'bag used: ' + o.useBagItem(o.bag[0].name); };
    el.querySelector('#pwEnd').onclick = () => o.onEnd({ coins: 30 + junk.reduce((a, j) => a + j.coins, 0), treasure, bonus: null, junk, digsUsed: 1 + junk.length, happiness: 18, bond: 9, energy: 15, cleanliness: 8, obstaclesHit: 1, cleanRun: false, distance: 1200, puddlesCleared: 2 });
    return { stop() { el.innerHTML = ''; } };
  } };
  if (!window.PawToys) window.PawToys = {
    supports: (n) => ['Tennis Ball', 'Rope Tug', 'Squeaky Duck', 'Frisbee', 'Plush Bone', 'Puzzle Feeder', 'Driftwood Stick', 'Rubber Chicken', 'Glow Ball'].includes(n),
    open(el, name, ctx) {
      el.innerHTML = `<div style="padding:30px;font:20px 'Patrick Hand'"><h2 style="font-family:Caveat">PawToys stub: ${name} (${ctx.time}/${ctx.weather})</h2><button id="ptPlay">Play</button> <button id="ptClose">Close</button></div>`;
      el.querySelector('#ptPlay').onclick = () => { ctx.sfx('squeak'); ctx.reward({ happiness: 12, bond: 3, coins: 2, energy: 5 }); };
      el.querySelector('#ptClose').onclick = () => ctx.onClose();
      return { close() { el.innerHTML = ''; } };
    }
  };
})();
/* PawGarden + PawKitchen stubs (v1.3). Only installed when the real modules are missing AND the URL has ?gkstub
   (v1.3.1: the published build ships without these modules, so the default test build must look the same). */
(function () {
  if (!/gkstub/.test(location.search + location.hash)) return;
  if (!window.PawGarden) {
    const CROPS = [
      { id: 'peas', name: 'Peas', seasons: ['spring'], days: 2, regrow: null, yield: 3, seed: 6, sell: 5, hardy: false, seedItem: 'Pea Seeds', item: 'Peas' },
      { id: 'spinach', name: 'Spinach', seasons: ['winter', 'spring'], days: 2, regrow: null, yield: 2, seed: 6, sell: 7, hardy: true, seedItem: 'Spinach Seeds', item: 'Spinach' },
      { id: 'carrot', name: 'Carrot', seasons: ['spring', 'autumn'], days: 3, regrow: null, yield: 2, seed: 8, sell: 10, hardy: false, seedItem: 'Carrot Seeds', item: 'Carrot' },
      { id: 'blueberries', name: 'Blueberries', seasons: ['summer'], days: 5, regrow: 3, yield: 4, seed: 40, sell: 3, hardy: false, seedItem: 'Blueberry Seeds', item: 'Blueberries' },
      { id: 'sweet-potato', name: 'Sweet Potato', seasons: ['summer', 'autumn'], days: 5, regrow: null, yield: 2, seed: 12, sell: 16, hardy: false, seedItem: 'Sweet Potato Seeds', item: 'Sweet Potato' },
      { id: 'pumpkin', name: 'Pumpkin', seasons: ['autumn'], days: 6, regrow: null, yield: 1, seed: 20, sell: 45, hardy: false, seedItem: 'Pumpkin Seeds', item: 'Pumpkin' }];
    const pk = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${Math.floor(d.getHours() / 8)}`;
    const clone = (s) => JSON.parse(JSON.stringify(s));
    const G = window.PawGarden = {
      CROPS, BUDDY: { shiba: 'inspect', corgi: 'guard', golden: 'fetch', dachs: 'dig', husky: 'snow', mutt: 'tend' },
      periodKey: pk,
      newState: () => ({ v: 1, plots: Array.from({ length: 6 }, () => ({ crop: null, g: 0, water: 0, dry: 0, inSeason: true, inspected: false, ready: null, took: 0, planted: null, harvested: 0 })), last: pk(new Date()), harvests: {} }),
      stage: (p) => (!p.crop ? 0 : p.g >= 1 ? 3 : p.g >= 0.4 ? 2 : p.g > 0 ? 1 : 0),
      advance(state, ctx) { const s = clone(state), ev = []; const n = ctx.steps || 0; for (let i = 0; i < n; i++) { const w = ctx.stepWeather || 'cloudy'; s.plots.forEach((p, k) => { if (w === 'rain') p.water = 3; if (!p.crop || p.g >= 1) return; if (p.water >= 1) { const c = CROPS.find((x) => x.id === p.crop); p.g = Math.min(1, p.g + (w === 'sunny' ? 1.5 : w === 'snow' ? 0 : 1) / (c.days * 3)); p.water = Math.max(0, p.water - (w === 'sunny' ? 2 : w === 'cloudy' ? 1 : 0)); if (p.g >= 1) { p.ready = 'step'; ev.push({ type: 'ready', plot: k, crop: p.crop }); } } else p.dry++; }); } s.last = pk(new Date(ctx.now || Date.now())); return { state: s, events: ev }; },
      plant(state, i, crop, ctx) { const s = clone(state); const p = s.plots[i]; if (!p || p.crop) return { state: s, ok: false }; Object.assign(p, { crop, g: 0, water: 0, dry: 0, inSeason: true, ready: null, took: 0, planted: s.last }); return { state: s, ok: true, bonusSeed: false }; },
      water(state, i) { const s = clone(state); if (s.plots[i]) s.plots[i].water = 3; return s; },
      harvest(state, i) { const s = clone(state), p = s.plots[i], c = CROPS.find((x) => x.id === p.crop); if (!c || p.g < 1) return { state: s, items: [], took: 0 }; const items = Array.from({ length: Math.max(1, c.yield - p.took) }, (_, k) => ({ crop: c.id, stars: 1 + (k % 2) })); Object.assign(p, { crop: null, g: 0, water: p.water, ready: null, took: 0 }); return { state: s, items, took: 0 }; },
      open(el, o) {
        let st = clone(o.state), sel = 0, seeds = Object.assign({}, o.seeds);
        const draw = () => { el.innerHTML = `<div style="padding:20px;font:18px 'Patrick Hand'"><h2 style="font-family:Caveat;margin:0">PawGarden stub · ${o.time}/${o.weather} · buddy ${o.buddy}</h2><div id="gPlots" style="display:grid;grid-template-columns:repeat(3,200px);gap:10px;margin:10px 0">${st.plots.map((p, i) => `<button data-p="${i}" style="height:80px;${i === sel ? 'outline:3px solid #F28FA5' : ''}">${i + 1}: ${p.crop || 'empty'} st${G.stage(p)} w${p.water}</button>`).join('')}</div><button id="gPlant">Plant carrot (${seeds.carrot || 0})</button> <button id="gWater">Water</button> <button id="gHarv">Harvest</button> <button id="gClose">Close</button></div>`;
          el.querySelectorAll('[data-p]').forEach((b) => { b.onclick = () => { sel = +b.dataset.p; draw(); }; });
          el.querySelector('#gPlant').onclick = () => { if (st.plots[sel].crop) return; if (!o.onPlant(sel, 'carrot')) return; seeds.carrot--; st = G.plant(st, sel, 'carrot', { month: o.month }).state; o.sfx('plant'); o.onChange(st); draw(); };
          el.querySelector('#gWater').onclick = () => { st = G.water(st, sel); o.sfx('water'); o.onChange(st); draw(); };
          el.querySelector('#gHarv').onclick = () => { const r = G.harvest(st, sel); if (!r.items.length) return; st = r.state; o.onHarvest(sel, r.items, r.took); o.onChange(st); draw(); };
          el.querySelector('#gClose').onclick = () => o.onClose(); };
        draw();
        return { close() { el.innerHTML = ''; }, update(pt) { if (pt.state) st = clone(pt.state); if (pt.seeds) seeds = Object.assign({}, pt.seeds); draw(); } };
      }
    };
  }
  if (!window.PawKitchen) {
    const K = window.PawKitchen = {
      FAV: { shiba: 'golden-harvest-stew', corgi: 'chicken-veggie-rice', golden: 'carrot-crunchies', dachs: 'spinach-scramble', husky: 'blueberry-pupsicle', mutt: 'golden-harvest-stew' },
      match: (ids) => { const k = ids.slice().sort().join(','); const r = { 'carrot,oats': 'carrot-crunchies', 'blueberries,water': 'blueberry-pupsicle', 'egg,spinach': 'spinach-scramble' }; return r[k] || null; },
      hint: () => null, dishStars: (c, cs) => Math.ceil((c + (cs.length ? cs.reduce((a, b) => a + b, 0) / cs.length : c)) / 2),
      open(el, o) {
        let fridge = o.fridge.count;
        const draw = () => { el.innerHTML = `<div style="padding:20px;font:18px 'Patrick Hand'"><h2 style="font-family:Caveat;margin:0">PawKitchen stub · fridge ${fridge}/${o.fridge.max}</h2><p>known: ${o.known.join(', ')} · oats ${o.pantry.oats || 0} · carrot ${(o.crops.carrot || []).join('/')}</p><button id="kCook" ${fridge >= o.fridge.max ? 'disabled' : ''}>Cook Carrot Crunchies</button> <button id="kMush">Make Mystery Mush</button> <button id="kOnion">People pantry: Onion</button> <button id="kClose">Close</button></div>`;
          el.querySelector('#kCook').onclick = () => { o.sfx('chop'); o.onCook({ recipe: 'carrot-crunchies', used: [{ id: 'carrot', stars: 2 }, { id: 'oats', stars: null }], cookStars: 3, stars: 2, auto: false, discovered: false }); fridge++; draw(); };
          el.querySelector('#kMush').onclick = () => { o.onCook({ recipe: 'mystery-mush', used: [{ id: 'rice', stars: null }, { id: 'egg', stars: null }], cookStars: 1, stars: 1, auto: false, discovered: false }); fridge++; draw(); };
          el.querySelector('#kOnion').onclick = () => o.onSafety('onion');
          el.querySelector('#kClose').onclick = () => o.onClose(); };
        draw();
        return { close() { el.innerHTML = ''; }, update(pt) { if (pt.fridge) fridge = pt.fridge.count; Object.assign(o, pt); draw(); } };
      }
    };
  }
})();
