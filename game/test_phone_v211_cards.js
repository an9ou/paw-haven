// v2.11 CARDS on phones (V211.md section 5.5, PHONE.md): the visiting dogs stay inside the Dog Park's home crop and never take a tap from the
// player's dogs or a tappable spot, the card sheet (a bottom sheet: 44 px taps, 15 px text, no sideways scroll), and the Dog Card settings
// for an email account (mock mode: the real Worker on a local D1).
//   node game/run_tests.js phone_v211_cards
const { run, URL } = require('./test_lib');
const { makeServer, mockInit } = require('./cloud_mock');

run('phone_v211_cards', async (t) => {
  const { ok, sec } = t; const ev = (f, a) => t.ev(f, a);
  // the phone minimums inside sel: taps of 44 px, text of 15 px, no sideways scroll
  async function phoneCheck(label, sel) {
    const r = await ev((q) => {
      const box = document.querySelector(q), small = [], tiny = [];
      box.querySelectorAll('button, input, select').forEach((e) => { const b = e.getBoundingClientRect(); const l = e.closest('label.tog'); const lb = l ? l.getBoundingClientRect() : b; if (b.width && (Math.max(b.height, lb.height) < 44 || Math.max(b.width, lb.width) < 44)) small.push(`${e.id || e.textContent.trim().slice(0, 16)} ${Math.round(b.width)}x${Math.round(b.height)}`); });
      const walk = document.createTreeWalker(box, NodeFilter.SHOW_TEXT); let n;
      while ((n = walk.nextNode())) { if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el.getClientRects().length || el.closest('svg, option')) continue; const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 15) tiny.push(`${n.textContent.trim().slice(0, 24)} ${fs}px`); }
      return { phone: document.documentElement.dataset.layout, small, tiny, sw: document.documentElement.scrollWidth, iw: innerWidth };
    }, sel);
    ok(r.phone === 'phone', `${label}: phone layout`);
    ok(!r.small.length, `${label}: every tap target is 44 px or more ${r.small.join(', ')}`);
    ok(!r.tiny.length, `${label}: text is 15 px or more ${r.tiny.slice(0, 4).join(', ')}`);
    ok(r.sw === r.iw, `${label}: no sideways scroll (${r.sw} vs ${r.iw})`);
  }
  const visPt = (i) => ev((i) => {
    const el = document.querySelector(`#dcVis [data-dcv="${i}"] .dc-hit`); if (!el) return null; const r = el.getBoundingClientRect();
    for (let fy = 0.5; fy < 0.95; fy += 0.1) for (const fx of [0.5, 0.4, 0.6, 0.3, 0.7]) { const x = r.left + r.width * fx, y = r.top + r.height * fy, e = document.elementFromPoint(x, y); if (e && e.closest(`[data-dcv="${i}"]`)) return { x, y }; }
    return null;
  }, i);
  const inCrop = () => ev(() => { const vb = document.querySelector('#view > svg.world').viewBox.baseVal; return window.__paw.dc.visitors().filter((v) => !v.hidden).every((v) => v.tap[0] >= vb.x && v.tap[0] + v.tap[2] <= vb.x + vb.width); });
  const tapsClear = () => ev(() => {
    const svg = document.querySelector('#view > svg.world'), M = svg.getScreenCTM(), out = [];
    const at = (x, y) => { const p = new DOMPoint(x, y).matrixTransform(M); return document.elementFromPoint(p.x, p.y); };
    window.__paw.rm.dogs().forEach((id) => { const b = window.__paw.rm.tap(id), e = at(b[0] + b[2] / 2, b[1] + b[3] / 2); if (e && e.closest('#dcVis')) out.push('dog ' + id); });
    window.__paw.rm.scan().filter((b) => b[4] !== 'btn' && b[4] !== 'scene').forEach((b) => { const e = at(b[0] + b[2] / 2, b[1] + b[3] / 2); if (e && e.closest('#dcVis')) out.push(b[4]); });
    return out;
  });

  for (const devName of ['iPhone 15', 'Pixel 7']) {
    const tag = devName.replace(/\W+/g, '_');
    sec(`${devName}: visitors in the Dog Park and the card sheet`);
    await t.newGame({ device: devName }, { coins: 2000, bond: { level: 8, pts: 2000 }, stats: { hunger: 90, happy: 80, energy: 90, clean: 90 } });
    await ev(() => window.__paw.dc.visit(['town-4', 'town-6']));
    await t.home('dogpark'); await t.until(() => window.__paw.dc.visitors().length > 0, null, 4000); await t.sleep(400);
    const V = await ev(() => window.__paw.dc.visitors());
    ok(V.length >= 1 && V.length <= 3, `1 to 3 visiting dogs (${V.length})`);
    ok(await inCrop(), 'every visitor stands inside the home crop');
    ok(!(await tapsClear()).length, 'a tap on the player\'s dog or a spot never lands on a visitor');
    ok(await ev(() => { const s = document.querySelector('#dcVis .dc-hit').getBoundingClientRect(); return s.width >= 44 && s.height >= 44; }), 'a visitor\'s tap rect is 44 px or more');
    await t.SH(`dogpark_${tag}`);
    const pt = await visPt(0); ok(!!pt, 'a visitor is on top somewhere in its tap rect');
    await t.p.touchscreen.tap(pt.x, pt.y); await t.waitH2(/\w+ \w+/);
    ok(await ev(() => !!document.querySelector('#modal .panel.dcpop #dcPaw')), 'a tap opens its card');
    await t.sleep(500); await t.SH(`card_${tag}`);
    await phoneCheck(`${devName} card sheet`, '#modal .panel');
    ok(await ev(() => { const r = document.querySelector('#modal .panel').getBoundingClientRect(); const bar = document.getElementById('bar').getBoundingClientRect(); return r.width >= innerWidth - 24 && r.bottom >= Math.min(innerHeight, bar.top) - 24; }), 'the card is a full-width bottom sheet');
    await t.p.locator('#dcPaw').tap(); ok(await t.waitToast(/You gave .* a paw/), 'Give a paw by tap');
    await t.closeX();
  }

  sec('Pixel 7, mock mode: the Dog Card settings for an email account');
  const srv = makeServer();
  const p = await t.mk({ device: 'Pixel 7' });
  await t.ctx.exposeBinding('__clSrv', (src, m, u, b, a) => srv.handle(src.page, m, u, b, a)); await t.ctx.addInitScript(mockInit, {}); srv.pages.add(p);
  await p.goto(URL); await p.waitForSelector('#tGuest'); await p.locator('#tGuest').tap(); await p.waitForSelector('#tNew'); await t.adopt({ sex: 'boy' });
  await t.until(() => !!window.__pawCloud.CL.uid, null, 8000);
  await ev(() => window.__pawCloud.open()); await p.waitForSelector('#dcBox');
  await phoneCheck('guest Dog Card block', '#dcBox');
  await p.locator('[data-cl=reg]').tap(); await p.waitForSelector('#clPw2');
  await p.fill('#clEmail', 'phonecard@example.com'); await p.fill('#clPw', 'pupper123'); await p.fill('#clPw2', 'pupper123'); await p.locator('[data-cl=doReg]').tap();
  ok(await t.until(() => !!document.querySelector('#dcBox [data-dcs="open"]'), null, 8000), 'the account gets the Dog Card button');
  await phoneCheck('account Dog Card block', '#dcBox');
  await p.locator('#dcBox [data-dcs="open"]').scrollIntoViewIfNeeded(); await p.locator('#dcBox [data-dcs="open"]').tap(); await t.waitH2(/My Dog Card/);
  await p.locator('#dcOn').tap(); await t.sleep(400); await t.SH('settings_editor_Pixel_7');
  await phoneCheck('Dog Card editor', '#modal .panel');
  await p.locator('#dcSave').tap(); ok(await t.until(() => /Your Dog Card is shared/.test(document.getElementById('dcMsg').textContent), null, 8000), 'Save shares the card');
  ok(srv.env.DB.raw.prepare('select count(*) as n from cards').get().n === 1, 'the Worker has the card');
}, { device: 'iPhone 15' });
