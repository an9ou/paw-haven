// node run_test.js -> screenshots in shots/, prints cook results and console errors
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const DIR = path.join(__dirname, 'shots'); fs.mkdirSync(DIR, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'test.html'));
  await p.evaluate(() => document.fonts && document.fonts.ready); await sleep(900);
  const SH = n => p.screenshot({ path: path.join(DIR, n + '.png') });
  const dbg = () => p.evaluate(() => window.__ctl && window.__ctl._dbg());
  const L = () => p.evaluate(() => JSON.parse(JSON.stringify(window.__log)));
  const center = async (sel) => { const bb = await p.locator(sel).first().boundingBox(); return [bb.x + bb.width / 2, bb.y + bb.height / 2]; };
  const dragTo = async (sel) => {
    const [x, y] = await center(sel), [tx, ty] = await center('.pk-pot');
    await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.move(x + 20, y - 10, { steps: 3 });
    await p.mouse.move(tx, ty, { steps: 12 }); await sleep(80); await p.mouse.up(); await sleep(450);
  };
  // play the needle: mode 'perfect' -> tap at zone centre (Space for odd steps, Tap button for even), 'none' -> never tap
  const play = async (mode, shotName) => {
    for (let guard = 0; guard < 40; guard++) {
      const d = await dbg(); if (!d || d.mode !== 'game') return;
      const g = d.game;
      if (g && g.running) {
        if (mode === 'perfect') {
          await p.evaluate(({ useSpace }) => new Promise(res => {
            const g = window.__ctl._dbg().game; const at = g.t0 + g.zone.c * 1600, wait = at - performance.now();
            setTimeout(() => { if (useSpace) window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true })); else document.querySelector('.pk-tap').click(); res(); }, Math.max(0, wait));
          }), { useSpace: g.idx % 2 === 0 });
          if (shotName && g.idx === 0) { await sleep(120); await SH(shotName); }
        } else if (shotName && g.idx === 0) { await sleep(800); await SH(shotName); }
        // wait for this step to end
        for (let i = 0; i < 40; i++) { const e = await dbg(); if (!e || e.mode !== 'game' || !e.game || e.game.idx !== g.idx || !e.game.running) break; await sleep(60); }
      }
      await sleep(120);
    }
  };
  const waitMode = async (m) => { for (let i = 0; i < 60; i++) { const d = await dbg(); if (d && d.mode === m) return true; await sleep(100); } return false; };

  await sleep(500); await SH('01_kitchen');

  // 1) Carrot Crunchies by dragging (known recipe, 2 steps, perfect timing)
  await dragTo('[data-ing="carrot"]'); await dragTo('[data-ing="oats"]');
  await SH('02_pot_filled');
  await p.click('.pk-btn.pk-go:has-text("Cook!")');
  await play('perfect', '03_minigame_chop');
  await waitMode('reveal'); await sleep(500); await SH('04_reveal_crunchies');
  await p.click('.pk-rbtns .pk-btn:has-text("Cook more")'); await sleep(300);

  // 2) Blueberry Pupsicle from the recipe book, no taps at all (worst case = 1 star joke, no fail)
  await p.keyboard.press('b'); await sleep(400); await SH('05_recipe_book');
  await p.locator('.pk-card:has-text("Blueberry Pupsicle") .pk-btn:has-text("Put in pot")').click(); await sleep(300);
  await p.click('.pk-btn.pk-go:has-text("Cook!")');
  await play('none', '06_minigame_chill');
  await waitMode('reveal'); await sleep(400); await SH('07_reveal_pupsicle');
  await p.click('.pk-rbtns .pk-btn:has-text("Cook more")'); await sleep(300);

  // 3) Try an onion (tap) -> bounces out, note, onSafety. Then drag chocolate onto the pot.
  await p.click('[data-pf="onion"]'); await sleep(450); await SH('08_onion_bounce');
  await sleep(900); await SH('09_onion_note');
  await p.click('.pk-note .pk-btn:has-text("Got it")'); await sleep(200);
  await dragTo('[data-pf="chocolate"]'); await sleep(1200);
  const choc = await p.locator('.pk-note').count();
  await p.keyboard.press('Escape'); await sleep(200);
  const stillOpen = await p.locator('.pk-root').count();

  // 4) Mystery Mush with a hint, then discover Spinach Scramble by experimenting (tap tiles)
  for (const id of ['pumpkin', 'oats', 'rice']) { await p.click(`[data-ing="${id}"]`); await sleep(250); }
  await p.click('.pk-btn.pk-go:has-text("Cook!")'); await waitMode('reveal'); await sleep(400); await SH('10_mush_hint');
  await p.click('.pk-rbtns .pk-btn:has-text("Cook more")'); await sleep(300);
  for (const id of ['egg', 'spinach']) { await p.click(`[data-ing="${id}"]`); await sleep(250); }
  await p.click('.pk-btn.pk-go:has-text("Cook!")');
  await play('perfect');
  await waitMode('reveal'); await sleep(400); await SH('11_discover_scramble');
  await p.click('.pk-rbtns .pk-btn:has-text("Cook more")'); await sleep(300);
  await p.keyboard.press('b'); await sleep(300); await SH('12_book_after');
  await p.keyboard.press('Escape'); await sleep(200);

  // 5) Full fridge, different dog/time, then Esc closes
  await p.evaluate(() => window.openKitchen({ fridgeCount: 8, dog: 'husky', time: 'night', weather: 'snow' })); await sleep(700);
  await SH('13_full_fridge_night');
  const cookDisabled = await p.locator('.pk-btn.pk-go:has-text("Cook!")').isDisabled();
  await p.keyboard.press('Escape'); await sleep(200);
  const afterEsc = await p.locator('.pk-root').count();
  const leftover = await p.evaluate(() => document.querySelectorAll('.pk-root').length);

  const log = await L();
  console.log('cooks:'); log.cooks.forEach(r => console.log('  ', JSON.stringify(r)));
  console.log('safety:', log.safety.join(','), '| chocolate note shown:', choc, '| esc closed note only:', stillOpen === 1);
  console.log('cook disabled when full:', cookDisabled, '| closes:', log.closes, '| roots after esc:', afterEsc, leftover);
  console.log('sfx:', [...new Set(log.sfx)].join(','), '| says:', log.says.length);
  console.log('beg pose available:', (await p.evaluate(() => PawArt.dog('shiba', { pose: 'beg' }).includes('pa-pose-beg'))));
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
