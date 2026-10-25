// Preview only (art/rain-wet): the Home Yard in the rain with a wet Japanese Spitz. Not wired into the game: PawArt.dog is wrapped in the page.
//   NODE_PATH=$(npm root -g) RAIN_DEV=desktop|phone RAIN_OUT=file.png node game/rain_yard_shot.js   (after node game/build.js + node game/harness.js merged)
const { run, sleep } = require('./test_lib'); const { devices } = require('playwright');
devices['Rain desktop'] = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false, userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' };
const dev = process.env.RAIN_DEV === 'phone' ? 'iPhone 15' : 'Rain desktop', WET = process.env.RAIN_DRY ? 0 : 1;
run('rain_yard_shot', async (t) => {
  const { ev } = t;
  await t.newGame({ sex: 'girl', device: dev }, { coins: 500, stats: { hunger: 90, happy: 90, energy: 90, clean: 90 } });
  await ev((wet) => {
    const P = window.__paw, S = P.S, A = window.PawArt, o = A.dog;
    if (wet) A.dog = (k, op) => o(k, k === 'spitz' ? Object.assign({}, op, { wet: true }) : op);
    S.dogs.forEach((d) => { d.key = 'spitz'; delete d.coat; d.name = 'Daifuku'; }); S.dog = S.dogs[0]; S.sleeping = false; S.place = 'yard'; P.saveNow(); P.go('yard');
  }, WET);
  await t.calm(); await t.lu(); await sleep(2500);
  await ev(() => { const st = document.createElement('style'); st.textContent = '#toasts,.toast,#bubble,.bubble,.pk-bub{display:none!important}'; document.head.appendChild(st); window.__paw.idle.speed(20); });
  await t.p.waitForFunction(() => { const s = document.querySelector('#dogArt svg.pa-dog'); return s && /pa-pose-idle/.test(s.getAttribute('class')); }, null, { timeout: 60000, polling: 100 }).catch(() => console.log('no idle pose'));
  await sleep(500);
  const svg = await ev(() => { const s = document.querySelector('#dogArt svg.pa-dog'); return s ? s.getAttribute('class') : 'none'; });
  console.log('dog svg class:', svg, 'weather', await ev(() => document.querySelector('#hud') && document.querySelector('#hud').innerText.replace(/\s+/g, ' ').slice(0, 160)));
  await t.p.screenshot({ path: process.env.RAIN_OUT });
}, { weather: 'rain', time: 'day', season: 'autumn' });
