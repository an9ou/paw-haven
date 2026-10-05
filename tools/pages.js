// Wraps the single-file publish build into a full HTML document for GitHub Pages.
//   node game/build.js publish && node tools/pages.js   (or: node tools/pages.js --build)
// Writes _site/index.html (plus .nojekyll).
const fs = require('fs'), path = require('path'), cp = require('child_process');
const root = path.join(__dirname, '..');
const src = path.join(root, 'paw_haven_prototype.html');
if (process.argv.includes('--build') || !fs.existsSync(src)) {
  cp.execFileSync('node', [path.join(root, 'game', 'build.js'), 'publish'], { stdio: 'inherit' });
}
const body = fs.readFileSync(src, 'utf8');
const head = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>';
const out = path.join(root, '_site');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), head + body + '</body></html>');
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('wrote _site/index.html', ((head.length + body.length + 14) / 1e6).toFixed(2) + ' MB');
