// Draws the crayon dogs for the doodledoggo.app introduction site (site/img/*.svg) with the game's own art module.
//   node tools/site_assets.js
// The screenshots in site/img/*.webp were made once from brand/itch/*.png (Python Pillow, WebP quality 80, 1280 px wide) so the
// whole site fits in one small Worker. Fonts in site/fonts are Caveat and Patrick Hand (SIL Open Font License), served from the
// site itself so no page asks Google (or anyone) for anything.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), win = {};
const ctx = vm.createContext({ window: win, console });
vm.runInContext(fs.readFileSync(path.join(root, 'dogs', 'pawart_dogs.js'), 'utf8'), ctx);
const out = path.join(root, 'site', 'img');
const dogs = { 'noodle-happy': ['dachs', 'happy'], 'noodle-sit': ['dachs', 'sit'] };
for (const [name, [key, pose]] of Object.entries(dogs)) {
  const svg = win.PawArt.dog(key, { pose }).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  fs.writeFileSync(path.join(out, name + '.svg'), svg);
  console.log('site/img/' + name + '.svg', svg.length);
}
