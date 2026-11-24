// Merch spike: the print render as a Cloudflare Worker (a sketch, never deployed). GET /?p=<merchEncode link>&w=&h=&bg= -> the print PNG.
// Only a recipe goes in, so only a game-drawn dog can come out: no uploads, nothing to moderate but the optional name (outlines, <= 20 letters).
// Bundle: this file + merch/dist/pawprint.min.js (603 KB) + @resvg/resvg-wasm 2.6.2 (index.mjs + index_bg.wasm, 2.4 MB). Run locally in workerd
// with merch/test_print_worker.mjs. On the Workers Free plan (10 ms CPU a request) this cannot run: a mug wrap needs about 0.4-0.6 s of CPU.
// On Workers Paid (30 s default) it fits; prints over about 3000x3000 must go in bands (tools/merch_band.js) to stay inside 128 MB.
import { initWasm, Resvg } from './resvg.mjs';
import wasm from './resvg.wasm';
import PawPrint from './pawprint.js';
let ready = null;
export default {
  async fetch(req) {
    const u = new URL(req.url), P = PawPrint;
    if (!ready) ready = initWasm(wasm); await ready; // not at global scope: the 1 s startup limit
    const r = P.merchFromHash('#p=' + (u.searchParams.get('p') || '')); if (!r.ok) return new Response('bad recipe: ' + r.err, { status: 400 });
    const w = Math.min(3000, +u.searchParams.get('w') || 2700), h = Math.min(3000, +u.searchParams.get('h') || 1050), bg = ['none', 'yard', 'tile', 'strip'].includes(u.searchParams.get('bg')) ? u.searchParams.get('bg') : 'strip';
    const t0 = Date.now(), svg = P.svg(r.dogs[0].recipe, { bg, name: true, w, h, border: bg === 'none' ? Math.round(w * 0.028) : 0 });
    const rs = new Resvg(svg, { fitTo: { mode: 'original' }, font: { loadSystemFonts: false } }), img = rs.render(), png = img.asPng(); img.free(); rs.free();
    return new Response(png, { headers: { 'content-type': 'image/png', 'x-render-ms': String(Date.now() - t0) } });
  }
};
