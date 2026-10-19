// Wraps the single-file publish build into a full HTML document for GitHub Pages.
//   node game/build.js publish && node tools/pages.js   (or: node tools/pages.js --build)
// Writes _site/index.html (plus .nojekyll) and copies the brand kit (icons, manifest, share card) from brand/.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const root = path.join(__dirname, '..');
const src = path.join(root, 'paw_haven_prototype.html');
if (process.argv.includes('--build') || !fs.existsSync(src)) {
  cp.execFileSync('node', [path.join(root, 'game', 'build.js'), 'publish'], { stdio: 'inherit' });
}
const body = fs.readFileSync(src, 'utf8');
// the shell's leading <title>, <link> and <meta> tags (everything before its first <style>) belong in <head>, where share crawlers read them
const cut = body.indexOf('<style>'), pre = cut > 0 ? body.slice(0, cut) : '', rest = cut > 0 ? body.slice(cut) : body;
const head = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' + pre + '</head><body>';
const out = path.join(root, '_site');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), head + rest + '</body></html>');
fs.writeFileSync(path.join(out, '.nojekyll'), '');
// brand kit: served from the site root (favicons, apple-touch icon, web manifest, og:image)
const brand = path.join(root, 'brand'), kit = fs.readdirSync(brand).filter((f) => /\.(png|svg|webmanifest)$/.test(f));
kit.forEach((f) => fs.copyFileSync(path.join(brand, f), path.join(out, f)));
// v2.14: the per-language font subsets (game/fonts/i18n/*.woff2), served as fonts/i18n/<file> next to index.html (00b_i18n.js loads only the current one)
const FD = path.join(root, 'game', 'fonts', 'i18n'), fonts = fs.existsSync(FD) ? fs.readdirSync(FD).filter((f) => /\.woff2$/.test(f)) : [];
if (fonts.length) { fs.mkdirSync(path.join(out, 'fonts', 'i18n'), { recursive: true }); fonts.forEach((f) => fs.copyFileSync(path.join(FD, f), path.join(out, 'fonts', 'i18n', f))); }
console.log('wrote _site/index.html', ((head.length + rest.length + 14) / 1e6).toFixed(2) + ' MB', '+', kit.length, 'brand files +', fonts.length, 'font files');
