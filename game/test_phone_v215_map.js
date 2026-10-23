// v2.15 Around Town on phones (V215.md sections 4 and 11, PHONE.md): the new town map.
//   * the default view fits the map's height and centres on the pack's place; the zoom column and the X stay clear of the captions
//   * building hit ellipses are 44 px or more, captions 15 px or more at the default zoom, the HTML text 15 px or more, no sideways scroll
//   * a long-press (500 ms) shows the name and does not travel; a drag pans the map and does not travel; a tap travels (the walk, then the trip)
//   * a building under the zoom column pans into the clear part of the map before the walk
// iPhone 15 (390x844) and Pixel 7 (412x915). Run: PAW_ARGS=--ignore-certificate-errors NODE_PATH=$(npm root -g) node game/test_phone_v215_map.js
const { run, sleep } = require('./test_lib');

function touchKit(cdp) {
  const tp = (x, y) => [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }];
  return async (pts, ms = 30, hold = 0) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(...pts[0]) });
    for (let i = 1; i < pts.length; i++) { await sleep(ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(...pts[i]) }); }
    await sleep(hold || ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
}
const line = (a, b, n = 10) => Array.from({ length: n + 1 }, (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);

async function suite(t, dev) {
  const { ok, ev } = t;
  t.sec(dev + ': the map');
  await t.newGame({ device: dev }, { bond: { level: 4, pts: 900 } });
  const p = t.p, touch = touchKit(await t.ctx.newCDPSession(p));
  ok(await ev(() => document.documentElement.dataset.layout) === 'phone', 'phone layout is on');
  await t.home('market'); await t.freezeMotion(false);
  await p.locator('[data-act=map]').first().tap(); await p.waitForSelector('#mapInner .mb[data-area]'); await sleep(400);
  await t.SH('map');
  const V = await ev(() => {
    const pan = document.getElementById('mapPan').getBoundingClientRect(), inner = document.getElementById('mapInner'), m = /scale\(([\d.]+)\)/.exec(inner.style.transform), s = m ? +m[1] : 0;
    const here = document.querySelector('#mapInner .mb[data-area="market"] .mb-hit').getBoundingClientRect();
    const vis = (r) => r.right > pan.left && r.left < pan.right && r.bottom > pan.top && r.top < pan.bottom;
    const hits = [...document.querySelectorAll('#mapInner .mb .mb-hit')].map((h) => h.getBoundingClientRect()).filter(vis);
    const caps = [...document.querySelectorAll('#mapInner .mb-cap')].filter((c) => vis(c.getBoundingClientRect())).map((c) => [+c.getAttribute('font-size') * s, c.textContent, !!c.closest('[data-capfit]')]).sort((a, b) => a[0] - b[0]);
    const ctl = ['#mapX', '#mapZoom'].map((q) => document.querySelector(q).getBoundingClientRect());
    const under = [...document.querySelectorAll('#mapInner .mb-cap')].filter((c) => { const r = c.getBoundingClientRect(); return ctl.some((q) => r.right > q.left && r.left < q.right && r.bottom > q.top && r.top < q.bottom); }).map((c) => c.textContent);
    return { s, panH: pan.height, mapH: 1500 * s, cx: (here.left + here.right) / 2 - (pan.left + pan.right) / 2, minHit: Math.min(...hits.map((r) => Math.min(r.width, r.height))), nHit: hits.length, minCap: Math.min(...caps.filter((c) => !c[2]).map((c) => c[0])), minFit: Math.min(99, ...caps.filter((c) => c[2]).map((c) => c[0])), capList: caps.slice(0, 4).map((c) => c[1] + ' ' + c[0].toFixed(1)).join(', '), under, sw: document.documentElement.scrollWidth, iw: innerWidth };
  });
  ok(V.mapH >= V.panH - 1 && V.mapH < V.panH * 1.25, `the default view fills the map's height, a little taller on a short phone so captions stay 15 px (${Math.round(V.mapH)} for a ${Math.round(V.panH)} px pane)`);
  ok(Math.abs(V.cx) < 110, `centred on the pack's place, Kibble Corner (${Math.round(V.cx)} px off: mapClearCtl may slide it to free a caption from the controls)`);
  ok(V.nHit >= 3 && V.minHit >= 44, `building hit areas >= 44 px (${Math.round(V.minHit)} px, ${V.nHit} on screen)`);
  ok(V.minCap >= 14.95 && V.minFit >= 13, `captions >= 15 px at the default zoom, a long name shrunk to fit >= 13 px (PHONE.md captions) (smallest: ${V.capList}; scale ${V.s.toFixed(3)})`);
  ok(!V.under.length, 'no caption under the X or the zoom column: ' + V.under.join(', '));
  ok(V.sw === V.iw, `no sideways scroll (${V.sw} = ${V.iw})`);
  ok(await ev(() => { const r = document.getElementById('mapX').getBoundingClientRect(), z = [...document.querySelectorAll('#mapZoom .btn')].map((b) => b.getBoundingClientRect()); return r.width >= 44 && r.height >= 44 && z.every((b) => b.width >= 44 && b.height >= 44); }), 'the X and the zoom buttons are 44 px');

  t.sec(dev + ': long-press names, a drag pans, neither travels');
  {
    await ev(() => window.__paw.mapTo('square')); await sleep(200);
    const b = await p.locator('#mapInner .mb[data-area="square"] .mb-hit').boundingBox(), c = [b.x + b.width / 2, b.y + b.height / 2];
    await touch([c], 30, 750);
    const tip = await ev(() => { const e = document.querySelector('.lptip'); return e ? { t: e.textContent, fs: parseFloat(getComputedStyle(e).fontSize) } : null; });
    ok(tip && /Town Square/.test(tip.t) && tip.fs >= 15, 'a long-press shows the name: ' + JSON.stringify(tip));
    await t.SH('longpress');
    await sleep(400); ok(await ev(() => window.__paw.mode === 'map' && !window.__paw.mp.walking() && !document.querySelector('.onway')), 'and does not travel');
    const tf = () => ev(() => document.getElementById('mapInner').style.transform), tx0 = await tf();
    await touch(line([c[0] + 90, c[1]], [c[0] - 90, c[1]], 10)); await sleep(300);
    ok((await tf()) !== tx0, 'a drag that starts on a building pans the map');
    await sleep(300); ok(await ev(() => window.__paw.mode === 'map' && !window.__paw.mp.walking() && !document.querySelector('.onway')), 'and does not travel');
  }

  t.sec(dev + ': a tap travels; a building under the zoom column pans into view first');
  {
    await ev(() => window.__paw.mapTo('sprout')); await sleep(200);
    // move Pip's Sprout Cart under the zoom column
    const z = await p.locator('#mapZoom').boundingBox(), h0 = await p.locator('#mapInner .mb[data-area="sprout"] .mb-hit').boundingBox();
    await ev(([dx, dy]) => window.__paw.mp.view(dx, dy), [z.x + z.width / 2 - (h0.x + h0.width / 2), z.y + z.height / 2 - (h0.y + h0.height / 2)]); await sleep(150);
    const h1 = await p.locator('#mapInner .mb[data-area="sprout"] .mb-hit').boundingBox();
    const over = (r) => r.x + r.width > z.x && r.x < z.x + z.width && r.y + r.height > z.y && r.y < z.y + z.height;
    ok(over(h1), 'the cart sits under the zoom column');
    const tapAt = [Math.max(h1.x + 10, Math.min(z.x - 14, h1.x + h1.width - 10)), h1.y + h1.height / 2];
    await p.touchscreen.tap(tapAt[0], tapAt[1]);
    ok(await t.until(() => !!window.__paw.mp.walking(), null, 2000), 'a tap starts the travel walk');
    const sk = await ev(() => { const e = document.getElementById('mpSkip'); if (!e) return null; const r = e.getBoundingClientRect(); return { h: r.height, fs: parseFloat(getComputedStyle(e).fontSize), in: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }; });
    ok(sk && sk.h >= 44 && sk.fs >= 15 && sk.in, 'the Skip chip: 44 px, 15 px text, on screen ' + JSON.stringify(sk));
    const h2 = await ev(() => { const r = document.querySelector('#mapInner .mb[data-area="sprout"] .mb-hit').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }), pan = await p.locator('#mapPan').boundingBox();
    ok(!over(h2) && h2.y >= pan.y - 1 && h2.y + h2.height <= pan.y + pan.height + 1, 'the cart panned into the clear part of the map first: ' + JSON.stringify(h2));
    await sleep(300); await t.SH('walk');
    ok(await t.until(() => window.__paw.S.place === 'sprout' && window.__paw.mode === 'yard' && !document.querySelector('.onway'), null, 8000), "arrived at Pip's Sprout Cart");
    const L = await ev(() => window.__paw.mp.last()); ok(L && L.from === 'market' && L.ms <= 1700, 'the walk ran from Kibble Corner in ' + (L && L.ms) + ' ms');
  }
}

(async () => {
  for (const dev of ['iPhone 15', 'Pixel 7']) await run('phone_v215_map_' + dev.replace(/\s+/g, '').toLowerCase(), (t) => suite(t, dev), { device: dev, map215: true });
})();
