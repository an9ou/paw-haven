// phone_ground (v2.14.1, the owner on an iPhone in the doodledoggo.app game box: "There is a blue bar under the 2 buttons").
// On phones the scene ends above the place-button strip (--trayH) and Market Street's button row; #phGnd (03_yard.js) runs the scene's own ground
// on down to the dock. This suite looks at the pixels between the scene's bottom edge (world y 600) and the dock top: no row there may be the
// view's bare background colour (the flat band), apart from the place buttons, the speech bubble and toasts drawn on top.
// Sizes: phone 360x640, iPhone 15, Pixel 7, the doodledoggo.app phone box (390 px virtual width, site/js/site.js fit()), the 684 x 716 tablet box
// (as i18n_fit's `embed`) and desktop 1280x720 (no strip at all). Languages: the owner's zh-Hant, en, th and ja (taller CJK / Thai buttons).
// A control on the yard hides #phGnd once and checks that the detector does see the band then.
// node game/run_tests.js phone_ground
'use strict';
const zlib = require('zlib');
const { run } = require('./test_lib');
const { devices } = require('playwright');

const ph = (base, w, h, dpr) => Object.assign({}, devices[base], { viewport: { width: w, height: h }, screen: { width: w, height: h }, deviceScaleFactor: dpr, defaultBrowserType: undefined });
const SIZES = {
  small: ph('Pixel 7', 360, 640, 2),
  iphone15: ph('iPhone 15', 393, 852, 3),
  pixel7: ph('Pixel 7', 412, 915, 2.625),
  site390: { viewport: { width: 390, height: 696 }, screen: { width: 393, height: 852 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true, userAgent: devices['iPhone 15'].userAgent }, // the site box on an iPhone: 390 px virtual width, box height / scale
  embed: { viewport: { width: 684, height: 716 }, screen: { width: 768, height: 1024 }, deviceScaleFactor: 2, hasTouch: true, isMobile: false, userAgent: devices['Desktop Chrome'].userAgent },
  desktop: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
};
const RUNS = [['site390', 'zh-Hant'], ['site390', 'en'], ['small', 'th'], ['iphone15', 'en'], ['pixel7', 'ja'], ['embed', 'zh-Hant'], ['desktop', 'en']];
const PLACES = ['yard', 'house', 'market', 'square', 'pier', 'fujihill', 'shibuya'];

// a small PNG reader (8-bit RGB / RGBA, not interlaced: what Chromium writes)
function png(buf) {
  let p = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); if (d[8] !== 8 || d[12] !== 0) throw new Error('png: unsupported'); ct = d[9]; }
    else if (type === 'IDAT') idat.push(d); else if (type === 'IEND') break;
    p += 12 + len;
  }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : 0; if (!bpp) throw new Error('png: colour type ' + ct);
  const raw = zlib.inflateSync(Buffer.concat(idat)), st = w * bpp, out = Buffer.alloc(st * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (st + 1)], src = raw.subarray(y * (st + 1) + 1, (y + 1) * (st + 1)), o = y * st;
    for (let x = 0; x < st; x++) {
      const a = x >= bpp ? out[o + x - bpp] : 0, b = y ? out[o - st + x] : 0, c = x >= bpp && y ? out[o - st + x - bpp] : 0; let v = src[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[o + x] = v & 255;
    }
  }
  return { w, h, bpp, px: out };
}

// in the page: the strip between the scene's bottom edge and the view's bottom (the dock top), the boxes drawn over it, and the bare colour
const STRIP = () => {
  const v = document.getElementById('view'), s = document.querySelector('#view > svg.world'); if (!v || !s) return null;
  const vr = v.getBoundingClientRect(), sr = s.getBoundingClientRect(), dock = document.getElementById('dock'), dr = dock && dock.offsetParent ? dock.getBoundingClientRect() : null;
  const bottom = Math.min(vr.bottom, dr && dr.height && dr.top > sr.bottom ? dr.top : vr.bottom);
  const skip = [...document.querySelectorAll('#placeBtns .btn, #bubble, #toasts .toast, #phPeek, #devBtn, #status')].map((e) => e.getBoundingClientRect()).filter((r) => r.width && r.height).map((r) => [r.left - 4, r.top - 4, r.right + 4, r.bottom + 4]);
  let bg = getComputedStyle(v).backgroundColor; for (let e = v; e && /rgba\(0, 0, 0, 0\)|transparent/.test(bg); e = e.parentElement) bg = getComputedStyle(e).backgroundColor;
  const m = /rgba?\((\d+), (\d+), (\d+)/.exec(bg) || [0, 255, 255, 255];
  const g = document.getElementById('phGnd');
  return { x: Math.max(0, vr.left), w: Math.min(innerWidth, vr.right) - Math.max(0, vr.left), top: sr.bottom, bottom, skip, bg: [+m[1], +m[2], +m[3]], gnd: !!g && g.style.display !== 'none', layout: document.documentElement.dataset.layout, place: window.__paw.S.place };
};

(async () => { for (const [size, lang] of RUNS) {
  await run(`phone_ground_${size}_${lang}`, async (t) => {
    const { ok, sec } = t; devices['GROUND ' + size] = SIZES[size];
    await t.newGame({ device: 'GROUND ' + size, lang, prefs: { tkTest: true, jpTest: true } }, { bond: { level: 12, pts: 9000 }, coins: 1000 });
    const dpr = SIZES[size].deviceScaleFactor || 1;
    // rows of the strip that are (almost) all the bare colour, outside the boxes drawn on top
    const bareRows = async () => {
      const st = await t.ev(STRIP); if (!st) return { st, rows: -1, n: 0 };
      const h = st.bottom - st.top; if (h < 2) return { st, rows: 0, n: 0 };
      const clip = { x: st.x, y: st.top + 1, width: st.w, height: h - 2 }, img = png(await t.p.screenshot({ clip }));
      let rows = 0, n = 0;
      for (let y = 0; y < img.h; y++) {
        const cy = clip.y + (y + 0.5) / dpr; let tot = 0, bare = 0;
        for (let x = 0; x < img.w; x += 2) {
          const cx = clip.x + (x + 0.5) / dpr; if (st.skip.some((r) => cx >= r[0] && cx <= r[2] && cy >= r[1] && cy <= r[3])) continue;
          const i = (y * img.w + x) * img.bpp; tot++;
          if (Math.abs(img.px[i] - st.bg[0]) <= 6 && Math.abs(img.px[i + 1] - st.bg[1]) <= 6 && Math.abs(img.px[i + 2] - st.bg[2]) <= 6) bare++;
        }
        if (tot >= 20) { n++; if (bare / tot >= 0.9) rows++; }
      }
      return { st, rows: Math.round(rows / dpr), n: Math.round(n / dpr) };
    };
    for (const pl of PLACES) {
      sec(`${size} ${lang}: ${pl}`);
      await t.home(pl); await t.sleep(400);
      const r = await bareRows();
      if (!r.st) { ok(false, `${size} ${lang} ${pl}: the scene is drawn`); continue; }
      if (size === 'desktop') { ok(r.st.layout !== 'phone' && r.st.bottom - r.st.top < 1 && !r.st.gnd, `${size} ${lang} ${pl}: desktop: the scene fills the view, no ground strip (${(r.st.bottom - r.st.top).toFixed(1)} px)`); continue; }
      const strip = r.st.bottom - r.st.top;
      if (strip >= 2) ok(r.st.gnd, `${size} ${lang} ${pl}: the ground strip is drawn under the scene (${strip.toFixed(0)} px)`);
      ok(r.rows <= 1, `${size} ${lang} ${pl}: no bare background between the scene and the dock (${r.rows} bare rows of ${r.n}, strip ${strip.toFixed(0)} px, bare colour rgb(${r.st.bg.join(',')}))`);
      await t.SH(`${size}_${lang}_${pl}`);
      if (pl === 'yard' && strip >= 10) { // the control: without #phGnd the detector sees the band
        await t.ev(() => { document.getElementById('phGnd').style.visibility = 'hidden'; });
        const c = await bareRows();
        ok(c.rows >= Math.min(8, strip / 2), `${size} ${lang} yard: control: with the ground hidden the band is found (${c.rows} bare rows)`);
        await t.ev(() => { document.getElementById('phGnd').style.visibility = ''; });
      }
    }
    // a redrawn scene (the season) keeps the ground strip in step
    if (size !== 'desktop') {
      sec(`${size} ${lang}: the season changes`);
      await t.home('yard'); const art0 = await t.ev(() => document.querySelector('#phGndSrc') && document.querySelector('#phGndSrc').innerHTML);
      await t.dev(async () => { await t.p.selectOption('#dvSeason', 'winter'); }); await t.sleep(600);
      const art1 = await t.ev(() => document.querySelector('#phGndSrc') && document.querySelector('#phGndSrc').innerHTML);
      ok(!!art1 && art1 !== art0, `${size} ${lang} yard (winter): the ground strip is drawn again from the new scene`);
      const r = await bareRows(); ok(r.rows <= 1, `${size} ${lang} yard (winter): no bare background under the scene (${r.rows} bare rows)`);
    }
  }, { timeout: 300000 });
} })();
