// Wraps the publish build into a full HTML document for GitHub Pages (and, through tools/itch.js, the itch.io zip and the doodledoggo.app /play/ copy).
//   node game/build.js publish && node tools/pages.js   (or: node tools/pages.js --build)
//   --single       wrap the one-file paw_haven_prototype.html instead of the split build (all languages inline, nothing minified)
//   --no-minify    keep the scripts and styles as they are (easier to debug in the browser)
// Writes _site/index.html (plus .nojekyll) and copies the brand kit (icons, manifest, share card) from brand/.
// v2.14 PERF (PERF.md): by default it ships the split build from _split/ (game/build.js publish, tools/split.js): English inline, lang/<code>.<hash>.js
// per other language and photo_fonts.<hash>.js next to index.html, and minifies index.html with tools/minify.js (esbuild; without it: a warning).
const fs = require('fs'), path = require('path'), cp = require('child_process');
const root = path.join(__dirname, '..');
const SINGLE = process.argv.includes('--single'), MINIFY = !SINGLE && !process.argv.includes('--no-minify');
const SPLIT = path.join(root, '_split');
const src = SINGLE ? path.join(root, 'paw_haven_prototype.html') : path.join(SPLIT, 'index.html');
if (process.argv.includes('--build') || !fs.existsSync(src)) {
  cp.execFileSync('node', [path.join(root, 'game', 'build.js'), 'publish'], { stdio: 'inherit' });
}
const body = fs.readFileSync(src, 'utf8');
// the shell's leading <title>, <link> and <meta> tags (everything before its first <style>: since v2.14 the loading paw's) belong in <head>, where share crawlers read them
const cut = body.indexOf('<style'), pre = cut > 0 ? body.slice(0, cut) : '', rest = cut > 0 ? body.slice(cut) : body;
const head = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' + pre + '</head><body>';
const out = path.join(root, '_site');
fs.rmSync(path.join(out, 'lang'), { recursive: true, force: true });
fs.readdirSync(out, { withFileTypes: true }).filter((e) => e.isFile() && /^photo_fonts\.\w+\.js$/.test(e.name)).forEach((e) => fs.rmSync(path.join(out, e.name)));
fs.mkdirSync(out, { recursive: true });
let html = head + rest + '</body></html>';
if (MINIFY) { const r = require('./minify.js').minifyHtml(html); html = r.html; if (!r.skipped) console.log(`minified index.html: ${(r.before / 1e6).toFixed(2)} -> ${(r.after / 1e6).toFixed(2)} MB (${r.blocks} blocks)`); }
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.writeFileSync(path.join(out, '.nojekyll'), '');
// the split build's side files: lang/<code>.<hash>.js and photo_fonts.<hash>.js
let side = 0;
if (!SINGLE) {
  const copy = (rel) => { fs.mkdirSync(path.dirname(path.join(out, rel)), { recursive: true }); fs.copyFileSync(path.join(SPLIT, rel), path.join(out, rel)); side++; };
  fs.readdirSync(path.join(SPLIT, 'lang')).forEach((f) => copy('lang/' + f));
  fs.readdirSync(SPLIT).filter((f) => /\.js$/.test(f)).forEach(copy);
}
// brand kit: served from the site root (favicons, apple-touch icon, web manifest, og:image)
const brand = path.join(root, 'brand'), kit = fs.readdirSync(brand).filter((f) => /\.(png|svg|webmanifest)$/.test(f));
kit.forEach((f) => fs.copyFileSync(path.join(brand, f), path.join(out, f)));
// v2.14: the per-language font subsets (game/fonts/i18n/*.woff2), served as fonts/i18n/<file> next to index.html (00b_i18n.js loads only the current one)
const FD = path.join(root, 'game', 'fonts', 'i18n'), fonts = fs.existsSync(FD) ? fs.readdirSync(FD).filter((f) => /\.woff2$/.test(f)) : [];
if (fonts.length) { fs.mkdirSync(path.join(out, 'fonts', 'i18n'), { recursive: true }); fonts.forEach((f) => fs.copyFileSync(path.join(FD, f), path.join(out, 'fonts', 'i18n', f))); }
console.log('wrote _site/index.html', (Buffer.byteLength(html) / 1e6).toFixed(2) + ' MB', SINGLE ? '(single file)' : `+ ${side} split files`, '+', kit.length, 'brand files +', fonts.length, 'font files');
