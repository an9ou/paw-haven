// Rainy days (wet dogs): screenshots of the Home Yard in the rain with a wet Japanese Spitz (RAIN_PACK=1: and a Chow Chow puppy and a Dobermann).
//   NODE_PATH=$(npm root -g) RAIN_DEV=desktop|phone RAIN_OUT=file.png [RAIN_PACK=1] node game/rain_yard_shot.js   (after node game/build.js + node game/harness.js merged)
const { run, sleep } = require('./test_lib'); const { devices } = require('playwright');
devices['Rain desktop'] = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false, userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' };
const dev = process.env.RAIN_DEV === 'phone' ? 'iPhone 15' : 'Rain desktop', PACK = process.env.RAIN_PACK ? 1 : 0;
run('rain_yard_shot', async (t) => {
  const { ev } = t;
  await t.newGame({ sex: 'girl', device: dev }, { coins: 500, stats: { hunger: 90, happy: 90, energy: 90, clean: 90 } });
  await ev((pack) => {
    const P = window.__paw, S = P.S;
    S.dogs.forEach((d) => { d.key = 'spitz'; delete d.coat; d.name = 'Daifuku'; }); S.dog = S.dogs[0];
    if (pack) { P.addDog({ key: 'chow', sex: 'male', months: 3 }, 'Bao'); P.addDog({ key: 'dobie', sex: 'female', months: 30 }, 'Juno'); }
    S.sleeping = false; S.place = 'yard'; P.saveNow(); P.go('yard');
  }, PACK);
  await t.calm(); await t.lu(); await sleep(2500);
  await ev(() => { const st = document.createElement('style'); st.textContent = '#toasts,.toast,#bubble,.bubble,.pk-bub{display:none!important}'; document.head.appendChild(st); window.__paw.idle.speed(20); });
  await t.p.waitForFunction(() => { const s = document.querySelector('#dogArt svg.pa-dog'); return s && /pa-pose-idle/.test(s.getAttribute('class')); }, null, { timeout: 60000, polling: 100 }).catch(() => console.log('no idle pose'));
  await sleep(500);
  const svg = await ev(() => { const s = document.querySelector('#dogArt svg.pa-dog'); return s ? s.getAttribute('class') : 'none'; });
  console.log('dog svg class:', svg, 'weather', await ev(() => document.querySelector('#hud') && document.querySelector('#hud').innerText.replace(/\s+/g, ' ').slice(0, 160)));
  await t.p.screenshot({ path: process.env.RAIN_OUT });
}, { weather: 'rain', time: 'day', season: 'autumn' });
