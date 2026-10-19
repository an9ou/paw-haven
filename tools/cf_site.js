// Turns site/ (the doodledoggo.app introduction site) plus the brand kit into a small Cloudflare Worker.
//   node tools/cf_site.js            -> _cfsite/worker.js + its modules + _cfsite/parts.txt (one "name type" line per upload part) + _cfsite/sizes.json
//   node tools/cf_site.js --pseudo   also serves the test-only pseudo-locales /xx/ and /xx-cjk/ (game/test_site.js; never deployed)
//   bash tools/cf_pages_deploy.sh    builds this and deploys it to doodledoggo.app (needs the owner's go-ahead)
// Pages: / (index.html: the live playroom, the dog cards, Dogs in Japan), /dogs (the profiles), /privacy, /reset (a notice: resets happen in the game),
// and since v2.14 the same four in 10 more languages at /<lang>/ (ja, zh-hans, zh-hant, ko, es, pt-br, fr, de, th, id). Every page is made here by
// tools/site_i18n.js from site/tpl/ and site/i18n/ (English is also committed as site/*.html; a warning shows when that copy is out of date).
// No content negotiation: each URL is one language, so no Vary header; the language menu and a first-visit script (English pages only) pick the language.
// Fonts for the other scripts (site/fonts/i18n/<lang>.woff2 + .css, the FONTS lane): when that folder has files they go to a second Worker,
// doodle-doggo-fonts (_cfsite_fonts/, on the route doodledoggo.app/fonts/i18n/*, which runs before the Custom Domain), so the CJK fonts don't
// count against this Worker's size. SITE_FONTS=inline keeps them in the main Worker instead. Empty folder: no second Worker at all.
// The game itself is played on itch.io (https://an9ou.itch.io/doodle-doggo); this site only introduces it.
// Why a Worker and not Pages: Pages and Workers-assets uploads authenticate with a short-lived upload JWT, which the cloud
// session's proxy replaces with the account API token, so those uploads fail there. A Worker script upload needs only the
// API token. www.doodledoggo.app answers with a 301 to the apex, keeping the path.
const fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');
const I18N = require('./site_i18n');
const root = path.join(__dirname, '..'), site = path.join(root, 'site'), brand = path.join(root, 'brand'), out = path.join(root, '_cfsite'), outFonts = path.join(root, '_cfsite_fonts');
const TYPES = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', svg: 'image/svg+xml', png: 'image/png', webp: 'image/webp', woff2: 'font/woff2', webmanifest: 'application/manifest+json', txt: 'text/plain; charset=utf-8', js: 'text/javascript; charset=utf-8' };
const TEXT = new Set(['html', 'css', 'svg', 'webmanifest', 'txt', 'js']);
const PSEUDO = process.argv.includes('--pseudo') || !!process.env.SITE_PSEUDO;
const ALL = I18N.LANGS.concat(I18N.PSEUDO), DIRS = new Set(ALL.map((l) => l.dir).filter(Boolean));
// url path -> source file (or generated text)
const files = {}, gen = {};
const walk = (dir, base) => fs.readdirSync(dir).forEach((f) => {
  const p = path.join(dir, f);
  if (fs.statSync(p).isDirectory()) {
    if (!base && (DIRS.has(f) || f === 'tpl' || f === 'i18n')) return; // the language folders are made below; templates and string tables are not served
    if (base === 'fonts/' && f === 'i18n') return; // the per-language fonts: see FONT_FILES
    return walk(p, base + f + '/');
  }
  if (TYPES[f.split('.').pop()]) files['/' + base + f] = p;
});
walk(site, '');
// v2.14 budget: only the dogs the playroom can pick (KEYS in site/js/site.js) ever show their scene poses, so the other dogs' scene drawings
// (tools/site_art.js still makes them, one frame each) stay out of the Worker. Their cards, profiles and puppies (still, pup) are all served.
const SCENE_KEYS = JSON.parse(fs.readFileSync(path.join(site, 'js', 'site.js'), 'utf8').match(/var KEYS = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
const UNUSED = Object.keys(files).filter((u) => { const m = u.match(/^\/img\/art\/dogs\/(\w+)-(walk|jump|sit|happy|sniff|sleep)\.svg$/); return m && !SCENE_KEYS.includes(m[1]); });
UNUSED.forEach((u) => { delete files[u]; });
['favicon.svg', 'icon-32.png', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'site.webmanifest', 'logo-1200x630.png', 'doodle-doggo-logo.svg', 'doodle-doggo-icon.svg']
  .forEach((f) => { files['/' + f] = path.join(brand, f); });
// every page of every language, from the templates
const built = I18N.build({ pseudo: PSEUDO });
for (const [rel, html] of Object.entries(built.pages)) {
  if (!rel.includes('/')) { const p = path.join(site, rel); if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== html) console.warn(`warning: site/${rel} is out of date with site/tpl + site/i18n (run node tools/site_i18n.js); serving the generated page`); }
  delete files['/' + rel]; gen['/' + rel] = html;
}
const PRETTY = {}, LANG_OF = { '': 'en' };
for (const L of I18N.LANGS.concat(PSEUDO ? I18N.PSEUDO : [])) {
  const pre = L.dir ? '/' + L.dir : '';
  LANG_OF[pre] = L.code;
  PRETTY[pre || '/'] = pre + '/index.html'; PRETTY[pre + '/dogs'] = pre + '/dogs.html'; PRETTY[pre + '/privacy'] = pre + '/privacy.html'; PRETTY[pre + '/reset'] = pre + '/reset.html';
}
// the friendly 404 in each language
const NOTFOUND = {};
for (const L of I18N.LANGS.concat(PSEUDO ? I18N.PSEUDO : [])) {
  // the language's font subset too (same ?v= cache key as the pages), and a <title>
  const fcss = path.join(site, 'fonts', 'i18n', (L.pseudo === 'cjk' ? 'ja' : L.code) + '.css'), fbody = L.code !== 'en' && fs.existsSync(fcss) ? fs.readFileSync(fcss) : null;
  const flink = fbody && /@font-face/.test(fbody) ? `<link rel="stylesheet" href="/fonts/i18n/${path.basename(fcss)}?v=${crypto.createHash('sha1').update(fbody).digest('hex').slice(0, 8)}">` : '';
  NOTFOUND[L.dir ? '/' + L.dir : ''] = `<!doctype html><html lang="${L.code}"${L.code === 'en' ? '' : ` class="i18n s-${L.script}"`}><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${I18N.fmt(L.code, 'notfound.title').replace(/<[^>]*>/g, '')} · Doodle Doggo</title><link rel="stylesheet" href="/style.css">${flink}<main class="page"><div class="sheet center"><h1>${I18N.fmt(L.code, 'notfound.title')}</h1><p><a class="play" href="${I18N.urlFor(L, '/')}">${I18N.fmt(L.code, 'notfound.home')}</a></p></div></main>`;
}
// the per-language fonts
const fontDir = path.join(site, 'fonts', 'i18n');
const FONT_FILES = fs.existsSync(fontDir) ? fs.readdirSync(fontDir).filter((f) => /\.(woff2|css)$/.test(f) || /-OFL\.txt$/.test(f)).sort() : [];
const FONT_MODE = !FONT_FILES.some((f) => f.endsWith('.woff2')) ? 'none' : (process.env.SITE_FONTS === 'inline' ? 'inline' : 'split');
if (FONT_MODE === 'inline') FONT_FILES.forEach((f) => { files['/fonts/i18n/' + f] = path.join(fontDir, f); });

const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src https://pawhaven-api.ansonyuen0108.workers.dev; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";
const HEAD = (name) => `// Generated by tools/cf_site.js from site/ and brand/. Do not edit: run node tools/cf_site.js (or bash tools/cf_pages_deploy.sh). ${name}`;
function emit(dir, entries, workerSrc) { // entries: [url, source path or {text}] -> modules + parts.txt; returns the gzipped size
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const parts = [], imports = [], table = []; let gz = 0;
  entries.sort((a, b) => (a[0] < b[0] ? -1 : 1)).forEach(([u, src], i) => {
    const ext = u.split('.').pop(), mod = u.slice(1).replace(/\//g, '__'); // flat module names
    if (typeof src === 'string') fs.copyFileSync(src, path.join(dir, mod)); else fs.writeFileSync(path.join(dir, mod), src.text);
    parts.push(`${mod} ${TEXT.has(ext) ? 'text/plain' : 'application/octet-stream'}`); // text/plain = Text module, octet-stream = Data module
    imports.push(`import f${i} from './${mod}';`);
    table.push(`  '${u}': [f${i}, '${TYPES[ext]}'],`);
    if (!/^\/xx(-cjk)?\//.test(u)) gz += zlib.gzipSync(fs.readFileSync(path.join(dir, mod))).length; // the pseudo-locales are test-only: not in the budget
  });
  const worker = workerSrc(imports.join('\n'), table.join('\n'));
  fs.writeFileSync(path.join(dir, 'worker.js'), worker); fs.writeFileSync(path.join(dir, 'parts.txt'), parts.join('\n') + '\n');
  return gz + zlib.gzipSync(worker).length;
}
const entries = Object.keys(files).map((u) => [u, files[u]]).concat(Object.keys(gen).map((u) => [u, { text: gen[u] }]));
const mainGz = emit(out, entries, (imports, table) => `${HEAD('The site.')}
${imports}
const FILES = {
${table}
};
const PRETTY = ${JSON.stringify(PRETTY)};
const LANG_OF = ${JSON.stringify(LANG_OF)};
const NOTFOUND = ${JSON.stringify(NOTFOUND)};
const APEX = 'doodledoggo.app';
const CSP = ${JSON.stringify(CSP)};
export default {
  async fetch(req) {
    const url = new URL(req.url);
    if (url.hostname === 'www.' + APEX) return Response.redirect('https://' + APEX + url.pathname + url.search, 301);
    if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
    let p = url.pathname.length > 1 ? url.pathname.replace(/\\/+$/, '') : '/';
    const anyPre = (p.match(/^\\/[A-Za-z-]+(?=\\/|$)/) || [''])[0]; // /zh-Hant/..., /pt-BR (the BCP 47 spelling) -> the lowercase folder
    if (anyPre && anyPre !== anyPre.toLowerCase() && anyPre.toLowerCase() in LANG_OF) {
      const rest = url.pathname.slice(anyPre.length);
      return Response.redirect('https://' + url.host + anyPre.toLowerCase() + (rest || '/') + url.search, 301);
    }
    const pre = (p.match(/^\\/[a-z-]+(?=\\/|$)/) || [''])[0], lpre = pre in LANG_OF ? pre : '';
    if (lpre && p === lpre && url.pathname === p) return Response.redirect('https://' + url.host + p + '/' + url.search, 301); // /ja -> /ja/
    if (p.endsWith('.html') && FILES[p]) return Response.redirect('https://' + url.host + (p.endsWith('/index.html') ? p.slice(0, -10) : p.slice(0, -5)) + url.search, 301);
    const hit = FILES[PRETTY[p] || p];
    const headers = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin', 'content-security-policy': CSP };
    if (!hit) return new Response(FILES['/index.html'] ? NOTFOUND[lpre] : 'Not found',
      { status: 404, headers: Object.assign(headers, { 'content-type': 'text/html; charset=utf-8', 'content-language': LANG_OF[lpre] }) });
    const html = hit[1].startsWith('text/html');
    Object.assign(headers, { 'content-type': hit[1], 'cache-control': html ? 'public, max-age=300' : 'public, max-age=86400' });
    if (html) headers['content-language'] = LANG_OF[lpre];
    if (p === '/reset' || p.endsWith('/reset')) headers['referrer-policy'] = 'no-referrer';
    return new Response(req.method === 'HEAD' ? null : hit[0], { headers });
  }
};
`);
let fontsGz = 0;
fs.rmSync(outFonts, { recursive: true, force: true });
if (FONT_MODE === 'split') {
  fontsGz = emit(outFonts, FONT_FILES.map((f) => ['/fonts/i18n/' + f, path.join(fontDir, f)]), (imports, table) => `${HEAD('The per-language fonts: the Worker doodle-doggo-fonts on the route doodledoggo.app/fonts/i18n/*.')}
${imports}
const FILES = {
${table}
};
export default {
  async fetch(req) {
    const url = new URL(req.url), hit = FILES[url.pathname];
    if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
    if (!hit) return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8', 'x-content-type-options': 'nosniff' } });
    return new Response(req.method === 'HEAD' ? null : hit[0], { headers: { 'content-type': hit[1], 'cache-control': 'public, max-age=604800', 'x-content-type-options': 'nosniff', 'access-control-allow-origin': 'https://doodledoggo.app' } });
  }
};
`);
}
// per-language cost of the pages (gzipped), for the budget
const perLang = {};
for (const [u, html] of Object.entries(gen)) { const d = u.split('/').length > 2 ? u.split('/')[1] : 'en'; perLang[d] = (perLang[d] || 0) + zlib.gzipSync(html).length; }
const sizes = { main: mainGz, fonts: fontsGz, fontMode: FONT_MODE, limit: 2.5e6, perLang };
fs.writeFileSync(path.join(out, 'sizes.json'), JSON.stringify(sizes, null, 1) + '\n');
const raw = Object.values(files).reduce((n, f) => n + fs.statSync(f).size, 0) + Object.values(gen).reduce((n, h) => n + Buffer.byteLength(h), 0);
console.log('wrote _cfsite/worker.js +', Object.keys(files).length + Object.keys(gen).length, 'files,', (raw / 1e6).toFixed(2), 'MB,', (mainGz / 1e6).toFixed(2), 'MB gzipped'
  + (FONT_MODE === 'split' ? `; _cfsite_fonts/worker.js + ${FONT_FILES.length} font files, ${(fontsGz / 1e6).toFixed(2)} MB gzipped` : FONT_MODE === 'inline' ? `; ${FONT_FILES.length} font files inline` : ''));
