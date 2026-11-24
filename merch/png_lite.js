// A small PNG reader for the print tests and tools (8-bit RGBA or RGB, not interlaced: what Chromium's screenshots are). Node only (zlib).
//   readPNG(buffer) -> { w, h, data: Uint8Array RGBA }
const zlib = require('zlib');
module.exports = function readPNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504E47) throw new Error('not a PNG');
  let o = 8, w = 0, h = 0, depth = 0, type = 0, inter = 0; const idat = [];
  while (o < buf.length) {
    const len = buf.readUInt32BE(o), t = buf.toString('latin1', o + 4, o + 8), d = buf.subarray(o + 8, o + 8 + len);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); depth = d[8]; type = d[9]; inter = d[12]; }
    else if (t === 'IDAT') idat.push(d); else if (t === 'IEND') break;
    o += 12 + len;
  }
  if (depth !== 8 || (type !== 6 && type !== 2) || inter) throw new Error('unsupported PNG');
  const bpp = type === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, out = new Uint8Array(w * h * 4);
  let prev = new Uint8Array(stride), cur = new Uint8Array(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0; let v = row[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[i] = v & 255;
    }
    for (let x = 0; x < w; x++) { const s = x * bpp, d = (y * w + x) * 4; out[d] = cur[s]; out[d + 1] = cur[s + 1]; out[d + 2] = cur[s + 2]; out[d + 3] = bpp === 4 ? cur[s + 3] : 255; }
    const t = prev; prev = cur; cur = t;
  }
  return { w, h, data: out };
};
