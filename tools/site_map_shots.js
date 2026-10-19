// Site v3 MAP page: one real in-game screenshot per place (25) and the two maps.
//   NODE_PATH=$(npm root -g) node tools/site_map_shots.js [only-regex] [--no-build]
// Builds the game the way the test runner does (node game/build.js + node game/harness.js merged -> game/test_merged.html),
// opens it with the harness (game/test_lib.js: dev prefs, frozen clock) in autumn, daytime, sunny, festival off,
// with a Bond 12 Shiba (every place open, prefs.jpTest + prefs.tkTest for Mt. Fuji, the Station and Tokyo).
// Each scene is captured from its element pinned to a 5:3 box (1000 x 600 CSS px at 2x), with the HUD, the dock, the place buttons,
// the status chip, the dev button, toasts, bubbles and modals hidden. Raw PNGs go to _mapshots/ (not committed);
// Pillow writes site/img/map/<id>.webp: places 960 x 576, the two maps 1200 x 720 (quality 72, lowered a little only to fit the budget).
// The Station has no scene of its own (a pin on the town map that opens the ticket window), so its picture is the Shinkansen ride.
const path = require('path'); const fs = require('fs'); const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..'); const RAW = path.join(ROOT, '_mapshots'); const OUT = path.join(ROOT, 'site', 'img', 'map');
const args = process.argv.slice(2); const ONLY = args.find((a) => !a.startsWith('--')); const RE = ONLY ? new RegExp(ONLY) : null;
fs.mkdirSync(RAW, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });

if (!args.includes('--no-build')) {
  execFileSync('node', ['game/build.js'], { cwd: ROOT, stdio: 'inherit' });
  execFileSync('node', ['game/harness.js', 'merged'], { cwd: ROOT, stdio: 'inherit' });
}
const { devices } = require('playwright'); const { run } = require(path.join(ROOT, 'game', 'test_lib'));
// a desktop profile at 2x so the 1000 x 600 scene comes out 2000 x 1200 before the resize
devices['MapShot 2x'] = { viewport: { width: 1000, height: 600 }, deviceScaleFactor: 2, isMobile: false, hasTouch: false, userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' };

const HOME = ['yard', 'house', 'garden', 'kitchen'];
const TOWN = ['park', 'river', 'woods', 'beach', 'market', 'square', 'cafe', 'dogpark', 'vet', 'salon', 'hilltop', 'pier', 'shelter', 'fujihill', 'station'];
const TOKYO = ['shibuya', 'yoyogi', 'asakusa', 'ueno', 'tokyotower', 'odaiba'];
const MAPS = ['town-map', 'japan-map'];
// the scene alone: the scene element (#view, #modHost for the garden and the kitchen, .tk-ride for the Station) fills the 1000 x 600 viewport,
// everything that floats over it is hidden, animations are paused and nothing can be hovered (no hot-spot outlines)
// The garden and the kitchen (mods/garden.js, mods/kitchen.js) draw a 2:1 stage (1240 x 620) scaled into their host: the host is made 1200 x 600
// and the 1000 x 600 window keeps its left part (the garden: the plots and the dog) or nearly all of it (the kitchen: the pantry, the pot and the dog)
const HOST = { garden: 0, kitchen: -12 };
const CLEAN = (sel, left) => `${sel}{position:fixed!important;left:${left || 0}px!important;top:0!important;right:auto!important;bottom:auto!important;width:${sel === '#modHost' ? 1200 : 1000}px!important;height:600px!important;margin:0!important;z-index:9000!important;flex:none!important}
#hud,#bar,#dock,#toasts,#bubble,#modal,#devBtn,#devPanel,#title,#trainPanel,#status,#placeBtns,#rmLookL,#rmLookR,#phBtn,#mapZoom,#mapX,#mapGo,#mapPin,#mapHi,#mapTip,#tkBookBtn,.tk-skip,.pg-bubble,.pg-info,.pk-bub,.toast,[class^="gd-"],.dc-pop{display:none!important}
*,*::before,*::after{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important;pointer-events:none!important}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
run('site_map_shots', async (t) => {
  const { ev } = t;
  await t.newGame({ sex: 'girl', device: 'MapShot 2x' }, { coins: 5000, stats: { hunger: 95, happy: 95, energy: 95, clean: 95 } });
  const p = t.p;
  // Bond 12 on every dog (topBond() opens every place and pin), never too hot (no panting lines), a garden in bloom
  await ev(() => {
    const P = window.__paw, S = P.S; S.dogs.forEach((d) => { d.bond = { level: 12, pts: 9000 }; d.sleeping = false; }); S.bond = S.dog.bond; S.sleeping = false; S.coolUntil = S.gameMin + 1e7;
    const crop = (c, g) => ({ crop: c, g, water: 3, wd: 0, dry: 0, inSeason: true, inspected: false, ready: null, took: 0, planted: S.garden && S.garden.last, harvested: 0 });
    if (S.garden && Array.isArray(S.garden.plots)) S.garden.plots = [crop('pumpkin', 1), crop('carrot', 1), crop('sweet-potato', 0.6), crop('carrot', 0.5), crop('pumpkin', 0.3), crop('sweet-potato', 1)];
    P.saveNow();
  });
  await t.calm(); await t.lu();
  let sel = '#view', left = 0;
  const style = async (on) => {
    await ev(([on, css]) => { let s = document.getElementById('__mapshot'); if (s) s.remove(); if (on) { s = document.createElement('style'); s.id = '__mapshot'; s.textContent = css; document.head.appendChild(s); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } }, [on, CLEAN(sel, left)]);
    if (on) await p.mouse.move(999, 599);
  };
  const quiet = () => ev(() => { const P = window.__paw; P.S.sleeping = false; P.S.coolUntil = P.S.gameMin + 1e7; document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); const m = document.getElementById('modal'); if (m && !m.hidden) { const x = m.querySelector('#luOk, .x, [data-x]'); if (x) x.click(); } });
  const settle = async (ms) => { await style(false); await sleep(ms || 1400); await quiet(); await t.lu(); await t.calm(); await style(true); await sleep(350); };
  const shot = async (id) => { const f = path.join(RAW, id + '.png'); await p.screenshot({ path: f, clip: { x: 0, y: 0, width: 1000, height: 600 } }); console.log('  shot ' + id); return f; };
  const scene = async (k) => { await ev((k) => { const P = window.__paw, S = P.S; S.sleeping = false; S.place = k; P.go('yard'); }, k); await t.until((k) => window.__paw.S.place === k && window.__paw.mode === 'yard', k, 8000); };
  const want = (id) => !RE || RE.test(id);
  const taken = [];
  for (const id of HOME.concat(TOWN, TOKYO, MAPS)) {
    if (!want(id)) continue;
    sel = id in HOST ? '#modHost' : '#view'; left = HOST[id] || 0; await style(false);
    if (id === 'station') {
      await scene('yard'); await ev(() => window.__paw.tk.ride('out')); await t.until(() => !!document.querySelector('.tk-ride'), null, 4000); await sleep(1600);
      sel = '.tk-ride'; await style(true); await sleep(300); taken.push([id, await shot(id)]); await style(false);
      await ev(() => { const r = document.querySelector('.tk-ride'); if (r) r.click(); }); await t.untilMode('japan', 6000); await scene('yard'); continue;
    }
    if (id === 'garden' || id === 'kitchen') { await scene(id === 'garden' ? 'yard' : 'house'); await ev((m) => window.__paw.go(m), id); await t.untilMode(id); }
    else if (id === 'shelter') { await scene('yard'); await ev(() => window.__paw.go('shelter')); await t.untilMode('shelter'); }
    else if (id === 'town-map') { await scene('yard'); await ev(() => window.__paw.go('map')); await t.untilMode('map'); }
    else if (id === 'japan-map') { await scene('station'); await ev(() => window.__paw.go('japan')); await t.untilMode('japan'); }
    else await scene(id);
    await settle(id === 'shelter' || id === 'garden' || id === 'kitchen' ? 2200 : 1400);
    if (MAPS.includes(id)) { // the whole map, fitted into the 5:3 frame (contain), centred
      await ev(() => { const inner = document.getElementById('mapInner'), pan = document.getElementById('mapPan'); const svg = inner.querySelector('svg'); const W = +svg.getAttribute('width'), H = +svg.getAttribute('height'); const vw = pan.clientWidth, vh = pan.clientHeight; const s = Math.min(vw / W, vh / H); inner.style.transform = `translate(${((vw - W * s) / 2).toFixed(1)}px, ${((vh - H * s) / 2).toFixed(1)}px) scale(${s.toFixed(4)})`; inner.style.setProperty('--inv', (1 / s).toFixed(4)); });
      await sleep(300);
    }
    taken.push([id, await shot(id)]);
  }
  await style(false);
  // Pillow: resize (LANCZOS) and write WebP at quality 72, stepping down (not below 56) only while the file is over its budget
  const py = `import sys, os
from PIL import Image
for spec in sys.argv[1:]:
    src, dst, w, h, budget = spec.split('|'); w, h, budget = int(w), int(h), int(budget)
    im = Image.open(src).convert('RGB').resize((w, h), Image.LANCZOS)
    q = 72
    while True:
        im.save(dst, 'WEBP', quality=q, method=6)
        if os.path.getsize(dst) <= budget or q <= 56: break
        q -= 4
    print('  %s %dx%d q%d %.1f KB' % (os.path.basename(dst), w, h, q, os.path.getsize(dst) / 1024))
`;
  const specs = taken.map(([id, f]) => MAPS.includes(id) ? `${f}|${path.join(OUT, id + '.webp')}|1200|720|${120 * 1024}` : `${f}|${path.join(OUT, id + '.webp')}|960|576|${60 * 1024}`);
  if (specs.length) execFileSync('python3', ['-c', py].concat(specs), { stdio: 'inherit' });
  const all = fs.readdirSync(OUT).filter((f) => f.endsWith('.webp')); const tot = all.reduce((a, f) => a + fs.statSync(path.join(OUT, f)).size, 0);
  console.log(`site/img/map: ${all.length} files, ${(tot / 1024).toFixed(0)} KB`);
}, { season: 'autumn', weather: 'sunny', time: 'day', fest: 'off', date: '2026-10-05', prefs: { jpTest: true, tkTest: true, rmTest: false }, timeout: 600000 });
