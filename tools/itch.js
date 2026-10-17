// Builds the itch.io upload (Kind: HTML).
//   node tools/itch.js
// Runs `node game/build.js publish` and `node tools/pages.js` (the brand head tags), then writes
// dist/itch/index.html plus the brand files the page links to, and zips them to dist/doodle-doggo-itch.zip
// with index.html at the zip root. Uses the `zip` command when installed, otherwise the small zip writer below.
const fs = require('fs'), path = require('path'), cp = require('child_process'), zlib = require('zlib');
const root = path.join(__dirname, '..');
cp.execFileSync('node', [path.join(root, 'game', 'build.js'), 'publish'], { stdio: 'inherit' });
cp.execFileSync('node', [path.join(__dirname, 'pages.js')], { stdio: 'inherit' });
const html = fs.readFileSync(path.join(root, '_site', 'index.html'), 'utf8');

const dist = path.join(root, 'dist'), out = path.join(dist, 'itch'), zipPath = path.join(dist, 'doodle-doggo-itch.zip');
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
// itch.io copy only (owner's choice, 14 Oct 2026): players never see the dev button or its panel. GitHub Pages and claude.ai keep it.
const HIDE_DEV = '<style id="itchNoDev">#devBtn,#devPanel{display:none!important}</style>';
// The CSS alone only hides them, so this script (it runs after the game script has booted) also takes both out of the DOM.
// #devBtn is drawn again by every scene (view.innerHTML), so a MutationObserver removes it each time, before it can paint.
// The panel opens only from #devBtn (bindDev), and Esc only closes it; the game keeps its own detached reference to #devPanel.
const STRIP_DEV = '<script id="itchNoDevJs">(function(){var Q="#devBtn,#devPanel";function strip(r){var n=r.querySelectorAll(Q);for(var i=0;i<n.length;i++)n[i].remove();}strip(document);'
  + 'new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var a=ms[i].addedNodes;for(var j=0;j<a.length;j++){var e=a[j];if(e.nodeType!==1)continue;if(e.matches(Q))e.remove();else strip(e);}}}).observe(document.documentElement,{childList:true,subtree:true});})();</script>';
let itchHtml = html.includes('</head>') ? html.replace('</head>', () => HIDE_DEV + '</head>') : HIDE_DEV + html;
const bodyEnd = itchHtml.lastIndexOf('</body>');
itchHtml = bodyEnd >= 0 ? itchHtml.slice(0, bodyEnd) + STRIP_DEV + itchHtml.slice(bodyEnd) : itchHtml + STRIP_DEV;
fs.writeFileSync(path.join(out, 'index.html'), itchHtml);
// the brand files the page links to (relative href/src), plus the icons the web manifest names
const brand = path.join(root, 'brand'), want = new Set();
const refs = /<link\b[^>]*\bhref="([^":?#]+)"/g; let m;
while ((m = refs.exec(html))) want.add(m[1]);
if (want.has('site.webmanifest')) JSON.parse(fs.readFileSync(path.join(brand, 'site.webmanifest'), 'utf8')).icons.forEach((i) => want.add(i.src));
const files = ['index.html'];
for (const f of [...want].sort()) {
  if (!fs.existsSync(path.join(brand, f))) { console.error('itch: missing brand file ' + f); process.exit(1); }
  fs.copyFileSync(path.join(brand, f), path.join(out, f)); files.push(f);
}

fs.rmSync(zipPath, { force: true });
let viaCmd = false;
try { cp.execFileSync('zip', ['-q', '-X', '-9', zipPath].concat(files), { cwd: out, stdio: 'inherit' }); viaCmd = true; } catch (e) { viaCmd = false; }
if (!viaCmd) writeZip(zipPath, files.map((f) => ({ name: f, data: fs.readFileSync(path.join(out, f)) })));
console.log('wrote dist/itch (' + files.length + ' files) and dist/doodle-doggo-itch.zip', (fs.statSync(zipPath).size / 1e6).toFixed(2) + ' MB', viaCmd ? '(zip)' : '(built-in writer)');

// ---------- minimal zip writer (deflate, no extras) ----------
function crc32(buf) {
  let c, crc = 0xFFFFFFFF;
  if (!crc32.t) { crc32.t = new Uint32Array(256); for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crc32.t[n] = c >>> 0; } }
  for (let i = 0; i < buf.length; i++) crc = crc32.t[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function writeZip(file, entries) {
  const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  const parts = [], central = []; let off = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, 'utf8'), body = zlib.deflateRawSync(e.data, { level: 9 }), crc = crc32(e.data);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(8, 8); h.writeUInt16LE(time, 10); h.writeUInt16LE(date, 12);
    h.writeUInt32LE(crc, 14); h.writeUInt32LE(body.length, 18); h.writeUInt32LE(e.data.length, 22); h.writeUInt16LE(name.length, 26); h.writeUInt16LE(0, 28);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10); c.writeUInt16LE(time, 12); c.writeUInt16LE(date, 14);
    c.writeUInt32LE(crc, 16); c.writeUInt32LE(body.length, 20); c.writeUInt32LE(e.data.length, 24); c.writeUInt16LE(name.length, 28); c.writeUInt32LE(off, 42);
    parts.push(h, name, body); central.push(c, name); off += 30 + name.length + body.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  fs.writeFileSync(file, Buffer.concat(parts.concat([cd, end])));
}
