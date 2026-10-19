// Doodle Doggo build. Usage:
//   node build.js            -> game/paw_haven_proto.html (game only, art/mod placeholders kept; used by harness.js + tests)
//   node build.js publish    -> /home/claude/proto/paw_haven_prototype.html (everything merged, ready to publish)
//   node build.js check      -> rebuild + syntax-check the game script
// Sources: game/shell.html, game/css/*.css and game/src/*.js in the order of their ORDER.txt files.
// The game script is ONE shared scope: the src files are concatenated in order inside a single IIFE (opened in 00_core.js,
// closed in 23_boot.js). Keep top-level declarations in a file that loads before their first use at load time.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const D = __dirname, P = path.join(D, '..');
const cat = (dir) => fs.readFileSync(path.join(D, dir, 'ORDER.txt'), 'utf8').split('\n').map((s) => s.trim()).filter(Boolean).map((f) => fs.readFileSync(path.join(D, dir, f), 'utf8')).join('');
const ART = ['dogs/pawart_dogs.js', 'world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js', 'world/pawart_world_d.js', 'world/pawart_world_e.js'];
// v2.14: the i18n slot = game/i18n/msg.js (+ the generated game/i18n/packed.js once it exists), raw text, before the art and modules
const I18N = () => ['game/i18n/msg.js', 'game/i18n/packed.js'].filter((f) => fs.existsSync(path.join(P, f))).map((f) => fs.readFileSync(path.join(P, f), 'utf8')).join('\n');
const MODS = ['mods/genes.js', 'mods/pawaudio.js', 'mods/walkrun.js', 'mods/toys.js', 'mods/garden.js', 'mods/kitchen.js'];
function buildGame() {
  const shell = fs.readFileSync(path.join(D, 'shell.html'), 'utf8');
  const css = cat('css'), js = cat('src');
  const out = shell.replace('/*@@I18N@@*/', I18N).replace('/*@@CSS@@*/', () => css).replace('/*@@GAME@@*/', () => js);
  fs.writeFileSync(path.join(D, 'paw_haven_proto.html'), out);
  fs.writeFileSync(path.join(D, 'game_script.check.js'), js);
  return out;
}
const mode = process.argv[2] || 'game';
const game = buildGame();
cp.execFileSync('node', ['--check', path.join(D, 'game_script.check.js')], { stdio: 'inherit' });
// v2.14: game/i18n/packed.js must run and give keys and one array per language, no longer than the keys
if (fs.existsSync(path.join(P, 'game/i18n/packed.js'))) {
  const w = {}; new Function('window', fs.readFileSync(path.join(P, 'game/i18n/packed.js'), 'utf8'))(w); const pk = w.PAW_I18N;
  if (!pk || !Array.isArray(pk.keys) || Object.keys(pk).some((k) => Array.isArray(pk[k]) && k !== 'keys' && pk[k].length > pk.keys.length)) throw new Error('game/i18n/packed.js is broken: run node tools/i18n_pack.js');
}
// the franchise names, in English and in the local spellings (V214.md 10)
const BANNED = /nintendo|pok[eé]mon|animal crossing|任天堂|ポケモン|ポケットモンスター|どうぶつの森|宝可梦|寶可夢|精灵宝可梦|神奇宝贝|神奇寶貝|动物森友会|動物森友會|集合啦|닌텐도|포켓몬|동물의 숲|นินเทนโด|โปเกมอน|แอนิมอล ครอสซิง/i;
if (mode === 'publish') {
  const rd = (f) => { const s = fs.readFileSync(path.join(P, f), 'utf8'); if (/<\/script/i.test(s)) throw new Error('</script in ' + f); return s; };
  const out = game.replace('/*@@PAWART@@*/', () => ART.map(rd).join('\n')).replace('/*@@PAWMODS@@*/', () => MODS.map(rd).join('\n'));
  if (BANNED.test(out)) throw new Error('banned word in build');
  fs.writeFileSync(path.join(P, 'paw_haven_prototype.html'), out);
  console.log('publish build ok', (out.length / 1e6).toFixed(2) + ' MB');
} else console.log('game build ok', (game.length / 1e3).toFixed(0) + ' KB');
