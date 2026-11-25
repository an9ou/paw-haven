// MerchRender: the print fallback, "option G" of RENDER_FREE.md 8 (proven on Free: a SQLite Durable Object drew 10 banded tees and 2 mugs, no
// exceededCpu). One instance ('resvg'), no storage of its own: it gets one line's print link, draws it with the BUNDLED PawPrint and resvg-wasm,
// and answers the PNG. The ledger stores it (render.js resvg(), then pngOk and MerchPrints, as for the browser's PNG).
// Why its own class and not MerchPrints or the ledger: a render takes 0.4-1.9 s of CPU; here it never holds up the ledger's requests (webhooks,
// checkouts) or the file route, and a wasm trap only ever breaks this object. It needs the migration tag v2 (wrangler.example.toml).
//   POST /resvg { hash: '#p=...&prod=..&col=..&pose=..&n=..&av=..', product } -> 200 image/png | 409 { error: 'art_ver' } | 422 { error, why } | 500
// Rules:
//   - art version (T2.2-49): a line is drawn by its own art_ver. This object has only the CURRENT PawPrint, so a link of any other av is refused
//     (409 art_ver), never drawn with the wrong art. PawPrint.printFromHash checks the same.
//   - nothing at module load: PawPrint (about 30 ms) and the wasm (2.4 MB) are loaded on the first render, then kept by the instance.
//   - memory (128 MB): the tee (4500x5400) is drawn in 12 horizontal bands (SPIKE.md: 17-25 MB of wasm memory instead of 192 MB), the mug in one
//     piece. Each band's rows go straight into one deflate stream (CompressionStream), so the whole RGBA picture is never in memory.
//   - resvg 2.6.2 panics on an element with opacity that lies wholly outside the drawing area: each band leaves out the shapes that are wholly
//     outside it (their box from PawPrint.bbox, nested <svg> viewports applied). After any trap the wasm instance is thrown away and the next
//     render makes a fresh one (vendor/resvg-wasm/resvg_glue.js makes one per call).
//   - resvg's pixels are premultiplied; PNG wants straight alpha: divided back here (as tools/merch_band.js did).
// Test seams (never set in production): env.RESVG_WASM (a compiled WebAssembly.Module), env.PAWPRINT.

export const BANDS = { tee: 12, mug: 1, stickers: 3 };
const CONTAINERS = new Set(['svg', 'g', 'a']);
const SHAPES = new Set(['path', 'ellipse', 'circle', 'rect', 'line', 'polyline', 'polygon']);

let WASM = null, PP = null;
async function wasmModule(env) {
  if (env.RESVG_WASM) return env.RESVG_WASM;
  if (!WASM) { const m = await import('./vendor/resvg-wasm/index_bg.wasm'); WASM = m.default || m; }
  return WASM;
}
async function pawPrint(env) {
  if (env.PAWPRINT) return env.PAWPRINT;
  if (!PP) { const m = await import('../../merch/dist/pawprint.js'); PP = m.default || m; }
  return PP;
}
export async function newResvg(env) { const { resvgInstance } = await import('./vendor/resvg-wasm/resvg_glue.js'); return resvgInstance(await wasmModule(env)); }

/* ---------------- the SVG in bands ---------------- */
// the print SVG as a tree: { tag, open, close, kids, raw (kept whole), leaf (a shape that can be left out), bb }
function parse(svg) {
  const root = { tag: '#root', kids: [] }, stack = [root];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>|[^<]+/g;
  let m, keep = null, depth = 0, start = 0;
  while ((m = re.exec(svg))) {
    const [all, close, tag, , self] = m;
    if (keep) { // inside an element kept whole (defs, text, ...): only its own depth matters
      if (tag === keep.tag && !self) depth += close ? -1 : 1;
      if (depth === 0) { keep.node.raw = svg.slice(start, re.lastIndex); keep = null; }
      continue;
    }
    const top = stack[stack.length - 1];
    if (!tag) { if (!/^<!--/.test(all)) top.kids.push({ text: all }); continue; }
    if (close) { if (top.tag !== tag) throw new Error('svg: </' + tag + '> closes <' + top.tag + '>'); stack.pop(); continue; }
    if (self) { top.kids.push({ tag, open: all, leaf: SHAPES.has(tag), raw: SHAPES.has(tag) ? null : all }); continue; }
    if (CONTAINERS.has(tag)) { const n = { tag, open: all, close: '</' + tag + '>', kids: [] }; top.kids.push(n); stack.push(n); continue; }
    const n = { tag, open: all }; top.kids.push(n); keep = { tag, node: n }; depth = 1; start = m.index; // kept whole in every band
  }
  if (keep || stack.length !== 1) throw new Error('svg: not closed');
  return root;
}
const attr = (open, k) => { const m = new RegExp('\\s' + k + '="([^"]*)"').exec(open); return m ? m[1] : null; };
// a nested <svg x y width height viewBox preserveAspectRatio> as the transform it applies (the default xMidYMid meet, and none / slice)
function viewportTf(open) {
  const x = +(attr(open, 'x') || 0), y = +(attr(open, 'y') || 0), w = +attr(open, 'width'), h = +attr(open, 'height'), vb = (attr(open, 'viewBox') || '').trim().split(/[\s,]+/).map(Number);
  if (vb.length !== 4 || !(vb[2] > 0) || !(vb[3] > 0) || !(w > 0) || !(h > 0)) return 'translate(' + x + ' ' + y + ')';
  const par = (attr(open, 'preserveAspectRatio') || 'xMidYMid meet').trim().split(/\s+/), al = par[0], sl = par[1] === 'slice';
  let sx = w / vb[2], sy = h / vb[3];
  if (al !== 'none') { const s = sl ? Math.max(sx, sy) : Math.min(sx, sy); sx = sy = s; }
  const ax = al === 'none' ? 0 : /xMid/.test(al) ? 0.5 : /xMax/.test(al) ? 1 : 0, ay = al === 'none' ? 0 : /YMid/.test(al) ? 0.5 : /YMax/.test(al) ? 1 : 0;
  const tx = x + (w - vb[2] * sx) * ax - vb[0] * sx, ty = y + (h - vb[3] * sy) * ay - vb[1] * sy;
  return 'translate(' + tx + ' ' + ty + ') scale(' + sx + ' ' + sy + ')';
}
// every shape's box on the page: PawPrint.bbox of the shape inside its chain of ancestor transforms (a nested <svg> counts as the transform it
// means). Two boxes: bb (half the stroke round each point, as PawPrint pads it) and cb for culling, where a mitred join (the default join) may
// reach stroke-miterlimit (4) half-strokes out. (PawPrint.bbox's per-element point list has no stroke pad, so each shape gets its own small call.)
// A nested <svg> clips at its viewport, and resvg draws a clipped group through a layer too (the same fault as opacity: measured, the akita and
// black lab tees). PawPrint nests the art with a viewBox that always holds the whole drawing plus a margin (pawprint_core.js nest()), so the clip
// cuts nothing; a band then draws that <svg> as the <g transform> it means (unclip), but only when every shape in it is seen inside its viewport.
const miterBox = (open) => /\sstroke-linejoin="(round|bevel)"/.test(open) ? open : open.replace(/\sstroke-width="([\d.]+)"/, (m, v) => ' stroke-width="' + (+v * Math.max(4, +(attr(open, 'stroke-miterlimit') || 4))) + '"');
function boxes(P, root, rootOpen) {
  const head = rootOpen.replace(/\sviewBox="[^"]*"/, ''), nests = [];
  const bbOf = (chain, el) => { const b = P.bbox(head + chain.join('') + el + '</g>'.repeat(chain.length) + '</svg>'); return b[0] <= b[2] && b[1] <= b[3] ? b : null; };
  const walk = (n, chain) => {
    for (const k of n.kids) {
      if (k.text || k.raw != null) continue;
      if (k.leaf) { k.bb = bbOf(chain, k.open); const m = miterBox(k.open); k.cb = m === k.open ? k.bb : bbOf(chain, m); continue; }
      if (k.tag === 'svg') {
        const x = +(attr(k.open, 'x') || 0), y = +(attr(k.open, 'y') || 0), w = +attr(k.open, 'width'), h = +attr(k.open, 'height');
        if (w > 0 && h > 0) { k.vp = bbOf(chain, '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>'); nests.push(k); }
        walk(k, chain.concat('<g transform="' + viewportTf(k.open) + '">'));
      } else walk(k, attr(k.open, 'transform') ? chain.concat('<g transform="' + attr(k.open, 'transform') + '">') : chain);
    }
  };
  walk(root, []);
  const inside = (n, vp) => n.kids.every((k) => k.text || (k.raw != null ? false : k.leaf ? !!k.bb && k.bb[0] >= vp[0] - 0.5 && k.bb[1] >= vp[1] - 0.5 && k.bb[2] <= vp[2] + 0.5 && k.bb[3] <= vp[3] + 0.5 : inside(k, vp)));
  for (const k of nests) k.unclip = !!k.vp && inside(k, k.vp);
}
// resvg's anti-aliasing differs a little in the rows right next to the canvas edge: a band is drawn OVERLAP rows taller on each side and those
// rows are cut off, so no kept row is next to an edge (measured on the 8 sample tees: pixels more than 32 apart from the one-pass render go from
// 58-497 to 28-423 a tee; mean difference 0.0006-0.0014 per channel either way)
const OVERLAP = 48;
const MARGIN = 2; // px on the page around each shape's box (its stroke is in the box already)
// resvg 2.6.2 draws a shape with its own opacity="" through a layer whose box goes wrong when the shape crosses the band's edge: it panics, or
// draws the shape in the wrong place (measured here: the golden tee, rows 1365-1652). A band therefore never has such a layer: the opacity moves
// into the one paint the shape has. Exact, because one paint is one operation (a stroke never doubles over itself): no stroke -> fill-opacity;
// no visible fill (fill="none", or a path of single straight segments only, which has no area) -> stroke-opacity. A shape with both keeps it.
const noArea = (d) => !!d && d.trim().split(/(?=[Mm])/).every((s) => /^[Mm]\s*-?[\d.]+[\s,]*-?[\d.]+\s*[Ll]\s*-?[\d.]+[\s,]*-?[\d.]+\s*$/.test(s.trim()));
export function flatOpacity(open) {
  const op = attr(open, 'opacity'); if (op == null) return open;
  const stroke = attr(open, 'stroke'), fill = attr(open, 'fill'), hasStroke = stroke != null && stroke !== 'none', hasFill = fill !== 'none' && !(/^<path\b/.test(open) && noArea(attr(open, 'd')));
  const into = !hasStroke ? 'fill-opacity' : !hasFill ? 'stroke-opacity' : null; if (!into) return open;
  const was = attr(open, into), v = Number(op) * (was == null ? 1 : Number(was));
  if (!Number.isFinite(v)) return open;
  const o = open.replace(/\sopacity="[^"]*"/, '').replace(new RegExp('\\s' + into + '="[^"]*"'), '');
  return o.replace(/\s*\/>$/, ' ' + into + '="' + +v.toFixed(4) + '"/>');
}
// the SVG of rows y0..y1 of the page: the same tree with the shapes wholly outside those rows left out (and groups left empty by that)
function bandSvg(root, rootOpen, w, y0, y1) {
  const open = rootOpen.replace(/\swidth="[^"]*"/, ' width="' + w + '"').replace(/\sheight="[^"]*"/, ' height="' + (y1 - y0) + '"').replace(/\sviewBox="[^"]*"/, ' viewBox="0 ' + y0 + ' ' + w + ' ' + (y1 - y0) + '"');
  const emit = (n) => {
    let s = '';
    for (const k of n.kids) {
      if (k.text) { s += k.text; continue; }
      if (k.raw != null) { s += k.raw; continue; }
      if (k.leaf) { if (!k.cb || (k.cb[3] >= y0 - MARGIN && k.cb[1] <= y1 + MARGIN && k.cb[2] >= -MARGIN && k.cb[0] <= w + MARGIN)) s += k.flat || (k.flat = flatOpacity(k.open)); continue; }
      const inner = emit(k); if (/<[a-zA-Z]/.test(inner)) s += (k.unclip ? '<g transform="' + viewportTf(k.open) + '">' + inner + '</g>' : k.open + inner + k.close);
    }
    return s;
  };
  return open + emit(root) + '</svg>';
}
// -> { w, h, bands: [{ y0, y1, svg() }] }. The page must be the root <svg width height viewBox="0 0 w h"> that PawPrint.print makes
export function splitBands(P, svg, n) {
  const m = /^\s*(<svg\b(?:[^>"']|"[^"]*"|'[^']*')*>)([\s\S]*)<\/svg>\s*$/.exec(svg); if (!m) throw new Error('svg: no root');
  const rootOpen = m[1], w = +attr(rootOpen, 'width'), h = +attr(rootOpen, 'height'), vb = (attr(rootOpen, 'viewBox') || '').trim().split(/[\s,]+/).map(Number);
  if (!(w > 0) || !(h > 0) || vb.join(' ') !== '0 0 ' + w + ' ' + h) throw new Error('svg: root size');
  if (!(n > 1)) return { w, h, bands: [{ y0: 0, y1: h, a: 0, b: h, svg: () => svg }] };
  const root = parse(m[2]); boxes(P, root, rootOpen);
  const bh = Math.ceil(h / n), bands = [];
  for (let y0 = 0; y0 < h; y0 += bh) { // drawn with OVERLAP rows above and below, which are then cut off
    const y1 = Math.min(h, y0 + bh), a = Math.max(0, y0 - OVERLAP), b = Math.min(h, y1 + OVERLAP);
    bands.push({ y0, y1, a, b, svg: () => bandSvg(root, rootOpen, w, a, b) });
  }
  return { w, h, bands };
}

/* ---------------- the PNG ---------------- */
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c; });
function crc32(parts) { let c = -1; for (const b of parts) for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
const be32 = (v) => new Uint8Array([v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]);
const ascii = (s) => Uint8Array.from(s, (c) => c.charCodeAt(0));
function pngFile(w, h, idat) {
  const ih = new Uint8Array(13); ih.set(be32(w), 0); ih.set(be32(h), 4); ih[8] = 8; ih[9] = 6; // 8-bit RGBA, no interlace
  const chunks = [];
  const chunk = (type, data) => { const t = ascii(type); chunks.push(be32(data.length), t, data, be32(crc32([t, data]))); };
  chunk('IHDR', ih);
  for (let o = 0; o < idat.length; o += 1 << 20) chunk('IDAT', idat.subarray(o, Math.min(idat.length, o + (1 << 20))));
  chunk('IEND', new Uint8Array(0));
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), n = chunks.reduce((a, c) => a + c.length, sig.length), out = new Uint8Array(n);
  let o = 0; for (const c of [sig].concat(chunks)) { out.set(c, o); o += c.length; }
  return out;
}
async function readAll(readable) {
  const r = readable.getReader(), parts = []; let n = 0;
  for (;;) { const { done, value } = await r.read(); if (done) break; parts.push(value); n += value.length; }
  const out = new Uint8Array(n); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out;
}
// one band's premultiplied RGBA -> PNG rows (filter byte 0, straight alpha)
function rows(px, w, hh) {
  const stride = w * 4, out = new Uint8Array(hh * (stride + 1));
  for (let y = 0; y < hh; y++) {
    const o = y * (stride + 1), s = y * stride; out[o] = 0; out.set(px.subarray(s, s + stride), o + 1);
    for (let i = o + 1, e = o + 1 + stride; i < e; i += 4) { const a = out[i + 3]; if (a && a < 255) { out[i] = Math.min(255, Math.round(out[i] * 255 / a)); out[i + 1] = Math.min(255, Math.round(out[i + 1] * 255 / a)); out[i + 2] = Math.min(255, Math.round(out[i + 2] * 255 / a)); } }
  }
  return out;
}
// the print SVG -> one PNG, band by band. R: a resvg instance ({ Resvg }); deadline: a time (ms) after which it stops between bands
export async function drawPng(R, P, svg, bands, deadline) {
  const s = splitBands(P, svg, bands), cs = new CompressionStream('deflate'), wr = cs.writable.getWriter(), all = readAll(cs.readable);
  try {
    for (const b of s.bands) {
      if (deadline && Date.now() > deadline) throw new Error('timeout');
      const r = new R.Resvg(b.svg(), { fitTo: { mode: 'original' }, font: { loadSystemFonts: false } });
      let px, iw, ih; try { const img = r.render(); iw = img.width; ih = img.height; px = img.pixels; img.free(); } finally { try { r.free(); } catch (e) { /* after a failed render: the instance is dropped anyway */ } }
      if (iw !== s.w || ih !== b.b - b.a) throw new Error('band ' + b.y0 + ': ' + iw + 'x' + ih);
      await wr.write(rows(px.subarray((b.y0 - b.a) * s.w * 4, (b.y1 - b.a) * s.w * 4), s.w, b.y1 - b.y0)); px = null;
    }
    await wr.close();
  } catch (e) { try { await wr.abort(e); } catch (x) { /* already failed */ } all.catch(() => {}); throw e; }
  return pngFile(s.w, s.h, await all);
}

const J = (o, status) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } });
export class MerchRender {
  constructor(state, env) { this.state = state; this.env = env; this.R = null; }
  async fetch(req) {
    const u = new URL(req.url);
    if (req.method !== 'POST' || u.pathname !== '/resvg') return J({ error: 'not_found' }, 404);
    let b; try { b = await req.json(); } catch (e) { b = null; }
    const hash = b && typeof b.hash === 'string' ? b.hash : '';
    const P = await pawPrint(this.env), av = /[#&]av=([A-Za-z0-9_-]+)/.exec(hash);
    if (!av || av[1] !== P.ART_VER) return J({ error: 'art_ver', why: (av ? av[1] : 'none') + ' is not ' + P.ART_VER }, 409); // T2.2-49
    const p = P.printFromHash(hash);
    if (!p.ok) return J({ error: p.err === 'art version' ? 'art_ver' : 'link', why: p.err }, p.err === 'art version' ? 409 : 422);
    if (b.product && b.product !== p.product) return J({ error: 'product', why: p.product }, 422);
    const t0 = Date.now(), deadline = t0 + (Number(this.env.MERCH_RESVG_BUDGET_MS) > 0 ? Number(this.env.MERCH_RESVG_BUDGET_MS) : 25e3);
    let png;
    try {
      if (!this.R) this.R = await newResvg(this.env);
      png = await drawPng(this.R, P, p.svg, BANDS[p.product] || 1, deadline);
    } catch (e) {
      this.R = null; // a trap may have left the instance broken: the next render makes a new one
      return J({ error: 'resvg', why: String((e && e.message) || e).slice(0, 120) }, 500);
    }
    return new Response(png, { headers: { 'content-type': 'image/png', 'x-resvg-ms': String(Date.now() - t0), 'cache-control': 'no-store' } });
  }
}
