// ITCH BUILD (about 40 s): node game/run_tests.js itch_build
// Builds the itch.io copy (node tools/itch.js), opens dist/itch/index.html on an iPhone 15 and on the desktop and checks that
// the dev button and the dev panel are gone from the DOM (also after a scene change), that nothing opens the panel,
// that the game still starts, and that there are no console errors. GitHub Pages and the claude.ai artifact keep the dev button.
const path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
cp.execFileSync('node', [path.join(ROOT, 'tools', 'itch.js')], { cwd: ROOT, stdio: 'ignore' });
const ITCH = 'file://' + path.join(ROOT, 'dist', 'itch', 'index.html');

require('./test_lib').run('itch_build', async (t) => {
  const { ok, sec } = t;
  for (const dev of [{ name: 'iPhone 15', o: { device: 'iPhone 15' } }, { name: 'desktop 1280x720', o: {} }]) {
    sec(dev.name);
    const p = await t.mk(dev.o);
    await p.goto(ITCH); await p.waitForSelector('#tNew, #tContinue');
    const gone = () => p.evaluate(() => !document.getElementById('devBtn') && !document.getElementById('devPanel') && !document.querySelector('#devBtn,#devPanel'));
    ok(await p.evaluate(() => !!document.getElementById('itchNoDev') && !!document.getElementById('itchNoDevJs')), 'the itch.io hide rule and strip script are in the page');
    ok(await gone(), 'title screen: no #devBtn, no #devPanel');
    await t.adopt({ sex: 'girl' });
    ok((await t.mode()) === 'yard' && await p.locator('#bar .act').count() === 7, 'the game starts: adopted, in the yard with 7 action buttons');
    await t.sleep(300);
    ok(await gone(), 'yard: no #devBtn, no #devPanel');
    // the dev button is drawn again by each scene, so go to a few: the map, then the park, then home
    await p.click('[data-act=map]'); await p.waitForSelector('[data-area=park]');
    ok(await gone(), 'map: no #devBtn, no #devPanel');
    await p.keyboard.press('Escape'); await t.untilMode('yard');
    await t.travel('park'); await t.sleep(300);
    ok(await gone(), 'park: no #devBtn, no #devPanel');
    // nothing can open it: a click where the button sat, Esc, and the keys a player could try
    await p.mouse.click(dev.o.device ? 385 : 1250, dev.o.device ? 80 : 690);
    for (const k of ['Escape', 'd', 'D', 'F12', 'Control+Shift+D', '`']) await p.keyboard.press(k);
    ok(await gone(), 'after clicks and key presses: still no #devBtn or #devPanel');
    ok(await p.evaluate(() => { const d = document.querySelector('#devPanel'); return !d; }), 'no dev panel anywhere in the document');
    ok(await p.evaluate(() => window.__paw.mode !== undefined), 'the game is still running');
  }
});
