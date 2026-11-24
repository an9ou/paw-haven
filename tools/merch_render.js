// Merch spike: the print files from recipes, three ways, with numbers.
//   NODE_PATH=<dir with @resvg/resvg-wasm, @resvg/resvg-js, sharp>:$(npm root -g) node tools/merch_render.js <cmd> [out dir]
//   samples <dir>   the 4 sample dogs x tee / mug / sticker / tote PNGs (resvg-wasm, the Worker candidate) + 4 product mockups
//   bench <dir>     time, CPU and peak memory of resvg-wasm and resvg-js at each print size (each in a fresh child process), and
//                   Chromium (Playwright) canvas drawImage and screenshot, plus the pixel difference of each against the Chromium screenshot
//   one <w> <h> <engine>   (internal: one render in this process, prints JSON)
//   part1 [out] [sheets]   Part 1: the 8 sample dogs through the real print page (Chromium, Playwright only): tee white, navy, black, mug and sticker
//                   sheet at full size into [out] (default merch/dist/part1, ignored by git), and four small mock-up sheets into [sheets]
//                   (default docs/design/merch/samples/)
// Needs merch/dist/pawprint.js (tools/merch_build.js). Nothing here is part of the game build.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const req = (m) => { for (const r of (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean)) { try { return require(path.join(r, m)); } catch (e) { /* next */ } } return require(m); };
const P = require(path.join(ROOT, 'merch', 'dist', 'pawprint.js'));
const B = (k) => P.BREEDS.indexOf(k), W = (n) => P.WEAR.findIndex((w) => w.n === n);

// the four sample dogs (recipes as merchRecipe makes them)
const DOGS = {
  shiba: { r: { v: 1, b: B('shiba'), g: '220200', e: 0, p: P.hashId('sample-shiba'), a: 0, s: 'f', n: 'Mochi' }, pose: 'happy' },
  dane: { r: { v: 1, b: B('dane'), g: '222010', e: 2, p: P.hashId('sample-dane'), a: 0, s: 'm', n: 'Duke' }, pose: 'sit' }, // merle on white: a harlequin, blue eyes
  dachs: { r: { v: 1, b: B('dachs'), g: '220200', e: 0, p: P.hashId('sample-dachs'), a: 1, s: 'f', n: 'Noodle' }, pose: 'happy' }, // a red dachshund puppy (3 months)
  golden: { r: { v: 1, b: B('golden'), g: '220200', e: 0, p: P.hashId('sample-golden'), a: 0, s: 'f', sp: 1, o: [W('Flower Crown'), W('Red Bandana'), W('Superhero Cape'), W('Little Sneakers')], n: 'Honey' }, pose: 'idle' }
};
const PRODUCTS = {
  tee_front_4500x5400: { w: 4500, h: 5400, bg: 'none', name: true },
  mug_wrap_2700x1050: { w: 2700, h: 1050, bg: 'strip', name: true },
  sticker_1500: { w: 1500, h: 1500, bg: 'none', border: 42 },
  tote_3000x3000: { w: 3000, h: 3000, bg: 'yard', name: true }
};
const svgOf = (dog, prod, extra) => P.svg(DOGS[dog].r, Object.assign({ pose: DOGS[dog].pose }, PRODUCTS[prod], extra || {}));

let wasmReady = null;
async function resvgWasm() {
  const R = req('@resvg/resvg-wasm');
  if (!wasmReady) { const p = require.resolve ? (() => { for (const r of (process.env.NODE_PATH || '').split(path.delimiter)) { const f = path.join(r, '@resvg', 'resvg-wasm', 'index_bg.wasm'); if (fs.existsSync(f)) return f; } return null; })() : null; wasmReady = R.initWasm(fs.readFileSync(p)); }
  await wasmReady; return R;
}
async function render(svg, w, engine) {
  if (engine === 'wasm') { const R = await resvgWasm(); const r = new R.Resvg(svg, { fitTo: { mode: 'width', value: w }, font: { loadSystemFonts: false } }); const img = r.render(); const png = img.asPng(); img.free(); r.free(); return Buffer.from(png); }
  if (engine === 'native') { const { Resvg } = req('@resvg/resvg-js'); return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: w }, font: { loadSystemFonts: false } }).render().asPng()); }
  throw new Error('engine ' + engine);
}

async function one(w, h, engine) {
  const svg = P.svg(DOGS.golden.r, { pose: 'idle', bg: 'yard', name: true, w, h });
  const c0 = process.cpuUsage(), t0 = process.hrtime.bigint();
  if (engine === 'wasm') await resvgWasm(); const tInit = Number(process.hrtime.bigint() - t0) / 1e6, cInit = process.cpuUsage(c0);
  const t1 = process.hrtime.bigint(), c1 = process.cpuUsage();
  let pix = 0, enc = 0, png;
  if (engine === 'wasm') { const R = await resvgWasm(); const r = new R.Resvg(svg, { fitTo: { mode: 'width', value: w }, font: { loadSystemFonts: false } }); const img = r.render(); pix = Number(process.hrtime.bigint() - t1) / 1e6; const t2 = process.hrtime.bigint(); png = img.asPng(); enc = Number(process.hrtime.bigint() - t2) / 1e6; img.free(); r.free(); }
  else { const { Resvg } = req('@resvg/resvg-js'); const r = new Resvg(svg, { fitTo: { mode: 'width', value: w }, font: { loadSystemFonts: false } }); const img = r.render(); pix = Number(process.hrtime.bigint() - t1) / 1e6; const t2 = process.hrtime.bigint(); png = img.asPng(); enc = Number(process.hrtime.bigint() - t2) / 1e6; }
  const cpu = process.cpuUsage(c1);
  return { engine, w, h, svgKB: Math.round(svg.length / 1024), initMs: Math.round(tInit), initCpuMs: Math.round((cInit.user + cInit.system) / 1000), renderMs: Math.round(pix), pngMs: Math.round(enc), cpuMs: Math.round((cpu.user + cpu.system) / 1000), pngKB: Math.round(png.length / 1024), maxRssMB: Math.round(process.resourceUsage().maxRSS / 1024), rgbaMB: Math.round(w * h * 4 / 1048576) };
}

// ---------- the product mockups: flat sketchbook drawings (no photos), the print laid on with <image> ----------
const INK = '#5B3D32';
const dataPNG = (b) => 'data:image/png;base64,' + b.toString('base64');
function paper(w, h, title) {
  let dots = ''; for (let y = 20; y < h; y += 36) for (let x = 20; x < w; x += 36) dots += `<circle cx="${x}" cy="${y}" r="1.6" fill="#E3D6C6"/>`;
  return `<rect width="${w}" height="${h}" fill="#FFFBF3"/>${dots}<text x="${w / 2}" y="${h - 40}" text-anchor="middle" font-size="40" fill="${INK}" font-family="Caveat">${title}</text>`;
}
function mockTee(print) {
  const w = 1200, h = 1300, d = 'M360 170 Q600 230 840 170 L1080 300 L990 500 L900 450 L910 1150 Q600 1190 290 1150 L300 450 L210 500 L120 300 Z';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${paper(w, h, '')}<path d="${d}" fill="#F4F1EA"/><path d="M490 190 Q600 260 710 190" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><image href="${dataPNG(print)}" x="420" y="330" width="360" height="432"/><path d="${d}" fill="none" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/><path d="M300 450 L320 470M900 450 L880 470" stroke="${INK}" stroke-width="5"/></svg>`;
}
function mockMug(print) {
  const w = 1400, h = 1000; // the print side (the left half of the wrap) on the front of the mug
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${paper(w, h, '')}<defs><clipPath id="m"><path d="M300 220 L1000 220 L990 820 Q650 880 310 820 Z"/></clipPath></defs>`
    + `<path d="M1000 330 Q1200 330 1200 520 Q1200 710 990 710" fill="none" stroke="${INK}" stroke-width="58" stroke-linecap="round"/><path d="M1000 330 Q1200 330 1200 520 Q1200 710 990 710" fill="none" stroke="#FFFFFF" stroke-width="40" stroke-linecap="round"/>`
    + `<path d="M300 220 L1000 220 L990 820 Q650 880 310 820 Z" fill="#FFFFFF"/><g clip-path="url(#m)"><image href="${dataPNG(print)}" x="300" y="276" width="1400" height="544" preserveAspectRatio="none"/></g>`
    + `<ellipse cx="650" cy="220" rx="350" ry="46" fill="#F4EFE6" stroke="${INK}" stroke-width="7"/><path d="M300 220 L310 820 Q650 880 990 820 L1000 220" fill="none" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/></svg>`;
}
function mockTote(print) {
  const w = 1200, h = 1300;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${paper(w, h, '')}<path d="M420 360 Q420 120 600 120 Q780 120 780 360" fill="none" stroke="${INK}" stroke-width="44" stroke-linecap="round"/><path d="M420 360 Q420 120 600 120 Q780 120 780 360" fill="none" stroke="#E8DDC4" stroke-width="28" stroke-linecap="round"/>`
    + `<path d="M230 340 L970 340 L990 1180 L210 1180 Z" fill="#EFE4CC"/><image href="${dataPNG(print)}" x="330" y="470" width="540" height="540"/><path d="M230 340 L970 340 L990 1180 L210 1180 Z" fill="none" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/><path d="M235 380 L965 380" stroke="${INK}" stroke-width="3" stroke-dasharray="14 12"/></svg>`;
}
function mockSheet(prints) {
  const w = 1200, h = 1300; let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${paper(w, h, '')}<rect x="170" y="110" width="860" height="1060" rx="30" fill="#FFFFFF" stroke="${INK}" stroke-width="7"/><rect x="190" y="130" width="820" height="1020" rx="20" fill="#E9F3FB"/>`;
  prints.forEach((p, i) => { const x = 220 + (i % 2) * 400, y = 160 + Math.floor(i / 2) * 480; s += `<image href="${dataPNG(p)}" x="${x}" y="${y}" width="380" height="380" transform="rotate(${[-4, 3, 2, -3][i]} ${x + 190} ${y + 190})"/>`; });
  return s + '</svg>';
}

async function samples(out) {
  fs.mkdirSync(out, { recursive: true }); const log = [];
  for (const dog of Object.keys(DOGS)) for (const prod of Object.keys(PRODUCTS)) {
    const svg = svgOf(dog, prod), t0 = Date.now(), png = await render(svg, PRODUCTS[prod].w, 'wasm'), ms = Date.now() - t0;
    const f = path.join(out, dog, prod + '.png'); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, png); fs.writeFileSync(f.replace(/\.png$/, '.svg'), svg);
    log.push({ dog, prod, ms, KB: Math.round(png.length / 1024), svgKB: Math.round(svg.length / 1024), stats: P.svg.last });
  }
  // the mockups: each a different dog; the sticker sheet has all four
  const small = async (dog, prod, w) => render(svgOf(dog, prod), w, 'wasm');
  const mk = async (name, svg) => fs.writeFileSync(path.join(out, name), await render(svg, 1200, 'wasm'));
  await mk('mock_tee.png', mockTee(await small('shiba', 'tee_front_4500x5400', 900)));
  await mk('mock_mug.png', mockMug(await small('dane', 'mug_wrap_2700x1050', 1400)));
  await mk('mock_tote.png', mockTote(await small('golden', 'tote_3000x3000', 1080)));
  await mk('mock_sticker_sheet.png', mockSheet(await Promise.all(['shiba', 'dane', 'dachs', 'golden'].map((d) => small(d, 'sticker_1500', 760)))));
  console.log(JSON.stringify(log, null, 0).replace(/\},\{/g, '},\n{'));
}

// ---------- Chromium: canvas drawImage in the page, and the page screenshot (the reference) ----------
async function chromium(jobs) {
  const { chromium } = req('playwright'); const CH = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch(CH ? { executablePath: CH } : {}); const out = [];
  try {
    const page = await b.newPage({ viewport: { width: 800, height: 600 } });
    await page.setContent('<!doctype html><body></body>'); await page.addScriptTag({ path: path.join(ROOT, 'merch', 'dist', 'pawprint.js') });
    for (const j of jobs) {
      if (j.kind === 'canvas') {
        const r = await page.evaluate(async ({ w, h, rec }) => {
          const t0 = performance.now(), svg = window.PawPrint.svg(rec, { pose: 'idle', bg: 'yard', name: true, w, h }), t1 = performance.now();
          try {
            const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })), img = new Image(); img.src = url; await img.decode();
            const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h); const t2 = performance.now();
            const blob = await new Promise((res) => c.toBlob(res, 'image/png')); const t3 = performance.now(); URL.revokeObjectURL(url);
            if (!blob) return { w, h, ok: false, err: 'toBlob gave null (canvas too big?)' };
            const px = x.getImageData(Math.floor(w / 2), Math.floor(h / 2), 1, 1).data; c.width = c.height = 0;
            let b64 = null; if (w * h <= 3000 * 3000) { const u = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); b64 = btoa(s); }
            return { w, h, ok: px[3] > 0, svgMs: Math.round(t1 - t0), drawMs: Math.round(t2 - t1), pngMs: Math.round(t3 - t2), pngKB: Math.round(blob.size / 1024), b64 };
          } catch (e) { return { w, h, ok: false, err: String(e && e.message || e) }; }
        }, { w: j.w, h: j.h, rec: DOGS.golden.r });
        out.push(Object.assign({ kind: 'canvas' }, r));
      } else { // screenshot of the SVG at 1:1 (the reference)
        const svg = j.svg || P.svg(DOGS.golden.r, { pose: 'idle', bg: 'yard', name: true, w: j.w, h: j.h });
        const p2 = await b.newPage({ viewport: { width: j.w, height: j.h }, deviceScaleFactor: 1 }); const t0 = Date.now();
        await p2.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block}</style>${svg}`);
        const png = await p2.screenshot({ type: 'png', omitBackground: true, fullPage: false }); await p2.close();
        out.push({ kind: 'shot', w: j.w, h: j.h, ms: Date.now() - t0, pngKB: Math.round(png.length / 1024), png: j.keep ? png : null });
      }
    }
  } finally { await b.close(); }
  return out;
}

// pixel difference of two PNGs of the same size (sharp): mean |d| per channel (0-255) and the share of pixels off by more than 32 in any channel
async function diff(a, b) {
  const sharp = req('sharp'); const A = await sharp(a).ensureAlpha().raw().toBuffer({ resolveWithObject: true }), Bv = await sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (A.info.width !== Bv.info.width || A.info.height !== Bv.info.height) return { err: 'size ' + A.info.width + 'x' + A.info.height + ' vs ' + Bv.info.width + 'x' + Bv.info.height };
  let sum = 0, big = 0; const n = A.info.width * A.info.height;
  for (let i = 0; i < n; i++) { let m = 0; for (let c = 0; c < 4; c++) { const d = Math.abs(A.data[i * 4 + c] - Bv.data[i * 4 + c]); sum += d; if (d > m) m = d; } if (m > 32) big++; }
  return { mean: +(sum / n / 4).toFixed(2), over32: +(100 * big / n).toFixed(3) + '%' };
}
// a clean edge: the transparent print composited on white equals the same SVG drawn on white (no grey or dark halo from a premultiply slip)
async function halo(svg, w, engine) {
  const sharp = req('sharp'); const t = await render(svg, w, engine), onW = await sharp(t).flatten({ background: '#ffffff' }).png().toBuffer();
  const white = await render(svg.replace(/(<svg[^>]*>)/, `$1<rect width="100%" height="100%" fill="#ffffff"/>`), w, engine);
  const meta = await sharp(t).raw().toBuffer({ resolveWithObject: true }); let edge = 0; for (let i = 3; i < meta.data.length; i += 4) if (meta.data[i] > 0 && meta.data[i] < 255) edge++;
  return Object.assign({ edgePixels: edge }, await diff(onW, white));
}

async function bench(out) {
  fs.mkdirSync(out, { recursive: true }); const res = { node: [], chromium: [], fidelity: [] };
  const sizes = [[1500, 1500], [2700, 1050], [3000, 3000], [4500, 5400]];
  for (const engine of ['wasm', 'native']) for (const [w, h] of sizes) {
    const j = JSON.parse(execFileSync(process.execPath, [__filename, 'one', String(w), String(h), engine], { env: process.env, maxBuffer: 1 << 24 }).toString().trim().split('\n').pop()); res.node.push(j); console.log(JSON.stringify(j));
  }
  // Chromium canvas: the print sizes, then bigger until it breaks
  const cv = await chromium([[1500, 1500], [2700, 1050], [3000, 3000], [4500, 5400], [4096, 4096], [8192, 8192], [11000, 11000], [16384, 16384], [20000, 20000]].map(([w, h]) => ({ kind: 'canvas', w, h })));
  cv.forEach((c) => { if (c.b64) fs.writeFileSync(path.join(out, `canvas_${c.w}x${c.h}.png`), Buffer.from(c.b64, 'base64')); delete c.b64; console.log(JSON.stringify(c)); }); res.chromium.push(...cv);
  // fidelity at 2700x1050 and 3000x3000: resvg (wasm, native) and canvas against the Chromium screenshot
  for (const [w, h] of [[2700, 1050], [3000, 3000]]) {
    const svg = P.svg(DOGS.golden.r, { pose: 'idle', bg: 'yard', name: true, w, h });
    const [shot] = await chromium([{ kind: 'shot', w, h, svg, keep: true }]); console.log(JSON.stringify(Object.assign({}, shot, { png: undefined })));
    fs.writeFileSync(path.join(out, `shot_${w}x${h}.png`), shot.png);
    const wasm = await render(svg, w, 'wasm'), nat = await render(svg, w, 'native'); fs.writeFileSync(path.join(out, `wasm_${w}x${h}.png`), wasm);
    const cvf = path.join(out, `canvas_${w}x${h}.png`);
    const f = { w, h, wasm_vs_chromium: await diff(wasm, shot.png), native_vs_chromium: await diff(nat, shot.png), canvas_vs_chromium: fs.existsSync(cvf) ? await diff(fs.readFileSync(cvf), shot.png) : null, wasm_vs_native: await diff(wasm, nat) };
    res.fidelity.push(f); console.log(JSON.stringify(f));
  }
  // transparency: a transparent tee and the sticker
  for (const [dog, prod] of [['shiba', 'tee_front_4500x5400'], ['dachs', 'sticker_1500']]) { const hres = await halo(svgOf(dog, prod), PRODUCTS[prod].w, 'wasm'); res.fidelity.push(Object.assign({ halo: dog + ' ' + prod }, hres)); console.log(JSON.stringify(Object.assign({ halo: dog + ' ' + prod }, hres))); }
  // the transparent tee through Chromium too (omitBackground) against resvg
  { const svg = svgOf('shiba', 'sticker_1500'); const [shot] = await chromium([{ kind: 'shot', w: 1500, h: 1500, svg, keep: true }]); const f = { sticker_wasm_vs_chromium: await diff(await render(svg, 1500, 'wasm'), shot.png) }; res.fidelity.push(f); console.log(JSON.stringify(f)); fs.writeFileSync(path.join(out, 'shot_sticker_shiba.png'), shot.png); }
  fs.writeFileSync(path.join(out, 'bench.json'), JSON.stringify(res, null, 1));
}

// ---------- Part 1: the print files through the real print page (merch/dist/print/v1), and contact sheets for the owner ----------
// part1 <out dir> [sheet dir]: the 8 sample dogs (merch/sample_dogs.js) on the tee (white, navy, black), mug and sticker sheet, full size into <out dir>
// (keep them out of the repo: 4500x5400 tees), then four small flat mock-ups into [sheet dir] (default docs/design/merch/samples/)
async function part1(out, sheetDir) {
  const http = require('http'), { chromium } = req('playwright'), DOGS8 = require(path.join(ROOT, 'merch', 'sample_dogs.js'))(P), DIR = path.join(ROOT, 'merch', 'dist', 'print', 'v1');
  fs.mkdirSync(out, { recursive: true }); fs.mkdirSync(sheetDir, { recursive: true });
  const srv = http.createServer((q, s) => { const f = path.join(DIR, path.basename(q.url.split(/[?#]/)[0]) || 'index.html'); fs.readFile(f, (e, b) => { if (e) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html' }); s.end(b); }); });
  await new Promise((res) => srv.listen(0, '127.0.0.1', res)); const base = `http://127.0.0.1:${srv.address().port}/index.html`;
  const br = await chromium.launch(), files = {}, log = [];
  try {
    const shoot = async (d, prod, col) => {
      const p = P.PRODUCTS[prod], half = p.w * p.h > 12e6, pg = await br.newPage({ viewport: { width: half ? p.w / 2 : p.w, height: half ? p.h / 2 : p.h }, deviceScaleFactor: half ? 2 : 1 });
      const t0 = Date.now(); await pg.goto(base + P.printHash(d.r, { product: prod, colour: col, pose: d.pose })); const title = await pg.title();
      const png = await pg.screenshot({ omitBackground: true }); await pg.close();
      const f = path.join(out, `${d.id}_${prod}${col && col !== 'white' ? '_' + col : ''}.png`); fs.writeFileSync(f, png);
      P.print(d.r, { product: prod, colour: col, pose: d.pose }); log.push({ dog: d.id, prod, col, title, ms: Date.now() - t0, KB: Math.round(png.length / 1024), k: P.print.last.k, artMM: P.print.last.artMM, name: P.print.last.name ? P.print.last.name.size : P.print.last.label });
      return f;
    };
    for (const [i, d] of DOGS8.entries()) {
      files[d.id] = { tee: await shoot(d, 'tee', 'white'), dark: await shoot(d, 'tee', i % 2 ? 'black' : 'navy'), mug: await shoot(d, 'mug', 'white'), sheet: await shoot(d, 'stickers', 'white') };
    }
    log.forEach((l) => console.log(JSON.stringify(l)));
    // the contact sheets: flat sketchbook mock-ups (no photos), each print laid on at its real size
    const uri = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const sheet = async (name, w, h, body) => {
      const pg = await br.newPage({ viewport: { width: w, height: h } });
      await pg.setContent(`<!doctype html><style>html,body{margin:0;background:#FFFBF3;font:600 15px/1.3 system-ui,sans-serif;color:${INK}}</style><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`);
      await pg.waitForTimeout(300); const png = await pg.screenshot({ type: 'png' }); await pg.close();
      fs.writeFileSync(path.join(sheetDir, name), png); console.log(name, Math.round(png.length / 1024) + ' KB');
    };
    const label = (x, y, t, s) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${s || 15}" font-family="system-ui,sans-serif" font-weight="600" fill="${INK}">${esc(t)}</text>`;
    // a tee, L size, flat: 22 in across the body; the 15 x 18 in print area starts 3.5 in under the collar (to be checked with a sample)
    const ppi = 13, teeTile = (x, y, hex, png, cap) => {
      const u = (n) => n * ppi, cx = x + u(17), top = y + u(1.5);
      const d = `M${cx - u(4)} ${top} Q${cx} ${top + u(1.6)} ${cx + u(4)} ${top} L${cx + u(11)} ${top + u(1.5)} L${cx + u(16)} ${top + u(7)} L${cx + u(12.5)} ${top + u(10)} L${cx + u(11)} ${top + u(8.5)} L${cx + u(11)} ${top + u(29)} L${cx - u(11)} ${top + u(29)} L${cx - u(11)} ${top + u(8.5)} L${cx - u(12.5)} ${top + u(10)} L${cx - u(16)} ${top + u(7)} L${cx - u(11)} ${top + u(1.5)} Z`;
      return `<path d="${d}" fill="${hex}"/><image href="${uri(png)}" x="${cx - u(7.5)}" y="${top + u(3.5)}" width="${u(15)}" height="${u(18)}"/><path d="${d}" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M${cx - u(4)} ${top} Q${cx} ${top + u(2.4)} ${cx + u(4)} ${top}" fill="none" stroke="${INK}" stroke-width="2"/>`
        + `<rect x="${cx - u(7.5)}" y="${top + u(3.5)}" width="${u(15)}" height="${u(18)}" fill="none" stroke="#E07A93" stroke-width="1" stroke-dasharray="4 4"/>` + label(cx, top + u(31.2), cap);
    };
    const TW = 34 * ppi, TH = 34 * ppi;
    const C = (id) => P.TEE_COLOURS.find((c) => c.id === id).hex;
    let s1 = '', s2 = ''; DOGS8.forEach((d, i) => { const x = (i % 4) * TW, y = 10 + Math.floor(i / 4) * TH; s1 += teeTile(x, y, C('white'), files[d.id].tee, `${d.r.n} · ${d.note}`); s2 += teeTile(x, y, C(i % 2 ? 'black' : 'navy'), files[d.id].dark, `${d.r.n} · ${i % 2 ? 'Black' : 'Navy'}`); });
    const foot = (y, t) => label(TW * 2, y, t, 14);
    await sheet('tee_white.png', TW * 4, TH * 2 + 40, s1 + foot(TH * 2 + 28, 'White tee, size L (22 in body). Dashed: Printful\'s 15 x 18 in print area. The dog\'s art box prints 10 x 8.33 in, the name 10 x 1.67 in under it.'));
    await sheet('tee_dark.png', TW * 4, TH * 2 + 40, s2 + foot(TH * 2 + 28, 'Navy and black tees: the cream paper patch behind the dog and the name, hard edged (every edge pixel fully opaque or fully clear).'));
    // the mug: the flat wrap (2700 x 1050, the handle at both ends), then the two faces as seen with the handle right and left
    const MW = 810, MH = 315; let s3 = '';
    DOGS8.forEach((d, i) => {
      const x = (i % 2) * (MW + 60) + 30, y = 20 + Math.floor(i / 2) * (MH + 70), img = uri(files[d.id].mug), k = MW / 2700;
      s3 += `<rect x="${x}" y="${y}" width="${MW}" height="${MH}" fill="#FFFFFF" stroke="${INK}" stroke-width="2" rx="6"/><image href="${img}" x="${x}" y="${y}" width="${MW}" height="${MH}"/>`
        + `<rect x="${x}" y="${y}" width="${150 * k}" height="${MH}" fill="#E07A93" opacity=".18"/><rect x="${x + MW - 150 * k}" y="${y}" width="${150 * k}" height="${MH}" fill="#E07A93" opacity=".18"/>`
        + `<path d="M${x} ${y + 75 * k}H${x + MW}M${x} ${y + MH - 75 * k}H${x + MW}" stroke="#E07A93" stroke-width="1" stroke-dasharray="4 4"/>` + label(x + MW / 2, y + MH + 22, `${d.r.n} · ${d.note}`, 14);
    });
    await sheet('mug.png', 2 * MW + 90, 4 * (MH + 70) + 40, s3 + label(MW + 45, 4 * (MH + 70) + 28, 'Mug wraps, 9 x 3.5 in. Pink: the 0.5 in by the handle (both ends) and the 0.25 in top and bottom keep-clear lines. The same dog on both faces, facing the back of the mug.', 14));
    // the sticker sheets: as cut (Printful adds its own 3 mm white border round each shape)
    const SW = 350, SH = Math.round(SW * 2481 / 1749); let s4 = '';
    DOGS8.forEach((d, i) => { const x = 20 + (i % 4) * (SW + 30), y = 20 + Math.floor(i / 4) * (SH + 50); s4 += `<rect x="${x - 6}" y="${y - 6}" width="${SW + 12}" height="${SH + 12}" rx="10" fill="#CFE3F1" stroke="${INK}" stroke-width="2"/><image href="${uri(files[d.id].sheet)}" x="${x}" y="${y}" width="${SW}" height="${SH}"/>` + label(x + SW / 2, y + SH + 30, `${d.r.n}`, 14); });
    await sheet('stickers.png', 4 * (SW + 30) + 10, 2 * (SH + 50) + 50, s4 + label(2 * (SW + 30), 2 * (SH + 50) + 36, 'A5 sticker sheets (shown on blue so the white backing shows): nine stickers, each one piece, 0.5 in apart, 0.4 in from the edge. No cut lines in the file.', 14));
  } finally { await br.close(); srv.close(); }
}

(async () => {
  const [cmd, a1, a2, a3] = process.argv.slice(2);
  if (cmd === 'one') { console.log(JSON.stringify(await one(+a1, +a2, a3))); return; }
  if (cmd === 'samples') return samples(a1 || path.join(ROOT, 'merch', 'dist', 'samples'));
  if (cmd === 'bench') return bench(a1 || path.join(ROOT, 'merch', 'dist', 'bench'));
  if (cmd === 'part1') return part1(a1 || path.join(ROOT, 'merch', 'dist', 'part1'), a2 || path.join(ROOT, 'docs', 'design', 'merch', 'samples'));
  console.log('usage: node tools/merch_render.js samples|bench|part1 [out dir] [sheet dir]');
})().catch((e) => { console.error(e); process.exit(1); });
