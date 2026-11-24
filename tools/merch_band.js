// Merch spike: the Worker-shaped render. resvg-wasm draws the print in horizontal bands (elements wholly outside a band are left out: resvg 2.6.2
// panics on an element with opacity that lies outside the canvas), each band's rows go straight into one deflate stream, and a PNG is written:
// the full 4500x5400 picture is never in memory, so wasm memory stays near one band. Prints peak wasm memory, CPU and wall time.
//   NODE_PATH=<dir with @resvg/resvg-wasm> node tools/merch_band.js <w> <h> <bands> [out.png] [bg: yard | none | tile | strip]
// In a Worker the same loop would use CompressionStream('deflate') and a ReadableStream response (or an R2 multipart upload).
const path = require('path');
const req = (m) => { for (const r of (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean)) { try { return require(path.join(r, m)); } catch (e) { /* next */ } } return require(m); };
const wasmPath = () => { for (const r of (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean)) { const f = path.join(r, '@resvg', 'resvg-wasm', 'index_bg.wasm'); if (require('fs').existsSync(f)) return f; } return require.resolve('@resvg/resvg-wasm/index_bg.wasm'); };
const fs = require('fs'), zlib = require('zlib'); let MEM = null;
const oi = WebAssembly.instantiate; WebAssembly.instantiate = async (...a) => { const r = await oi(...a); MEM = (r.instance || r).exports.memory; return r; };
const R = req('@resvg/resvg-wasm'); const P = require(require('path').join(__dirname, '..', 'merch', 'dist', 'pawprint.js'));
const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = (b) => { let c = -1; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
(async () => {
  await R.initWasm(fs.readFileSync(wasmPath())); const m0 = MEM.buffer.byteLength;
  const [w, h, bands] = process.argv.slice(2, 5).map(Number), out = process.argv[5];
  const svg = P.svg({ v: 1, b: 2, g: '220200', e: 0, p: 9, a: 0, s: 'f', sp: 1, o: [3, 0, 12, 53], n: 'Honey' }, { pose: 'idle', bg: process.argv[6] || 'yard', name: true, w, h });
  const m = /^(<svg[^>]*?) width="\d+" height="\d+" viewBox="[^"]*">([\s\S]*)<\/svg>$/.exec(svg);
  // leaves with their ancestors (defs kept whole)
  const defs = (m[2].match(/<defs>[\s\S]*?<\/defs>/g) || []).join(''), body = m[2].replace(/<defs>[\s\S]*?<\/defs>/g, '');
  const leaves = []; const st = []; for (const t of body.matchAll(/<(\/?)([a-zA-Z]+)\b([^>]*?)(\/?)>/g)) { const [all, cl, , , self] = t; if (cl) { st.pop(); continue; } if (!self) { st.push(all); continue; } leaves.push({ s: st.join('') + all + '</g>'.repeat(st.length), bb: P.bbox('<svg>' + st.join('') + all + '</g>'.repeat(st.length) + '</svg>') }); }
  const c0 = process.cpuUsage(), t0 = Date.now(); const def = zlib.createDeflate({ level: 6 }), idat = []; def.on('data', (d) => idat.push(d));
  const bh = Math.ceil(h / bands);
  for (let i = 0; i < bands; i++) {
    const y = i * bh, hh = Math.min(bh, h - y);
    const keep = leaves.filter((l) => l.bb[3] >= y - 2 && l.bb[1] <= y + hh + 2).map((l) => l.s).join('');
    const s = `${m[1]} width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}">${defs}<g transform="translate(0 ${-y})">${keep}</g></svg>`;
    const r = new R.Resvg(s, { fitTo: { mode: 'original' }, font: { loadSystemFonts: false } }); const img = r.render(); const px = img.pixels; img.free(); r.free();
    for (let k = 0; k < px.length; k += 4) { const a = px[k + 3]; if (a && a < 255) { px[k] = Math.min(255, Math.round(px[k] * 255 / a)); px[k + 1] = Math.min(255, Math.round(px[k + 1] * 255 / a)); px[k + 2] = Math.min(255, Math.round(px[k + 2] * 255 / a)); } } // pixels come premultiplied
    for (let row = 0; row < hh; row++) { def.write(Buffer.from([0])); def.write(Buffer.from(px.buffer, px.byteOffset + row * w * 4, w * 4)); }
    await new Promise((res) => def.flush(res));
  }
  await new Promise((res) => { def.on('end', res); def.end(); });
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', Buffer.concat(idat)), chunk('IEND', Buffer.alloc(0))]);
  const cpu = process.cpuUsage(c0); if (out) fs.writeFileSync(out, png);
  console.log(JSON.stringify({ w, h, bands, wasmStartMB: +(m0 / 1048576).toFixed(1), wasmPeakMB: +(MEM.buffer.byteLength / 1048576).toFixed(1), cpuMs: Math.round((cpu.user + cpu.system) / 1000), wallMs: Date.now() - t0, pngKB: Math.round(png.length / 1024), maxRssMB: Math.round(process.resourceUsage().maxRSS / 1024) }));
})();
