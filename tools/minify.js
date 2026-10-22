// Minifies a built Doodle Doggo HTML file in place: every inline <script> (JS) and <style> (CSS), with esbuild.
//   node tools/minify.js <file.html> [--check]
// Used by tools/itch.js (the itch.io upload and the doodledoggo.app /play/ copy) and tools/artifact.js. The tests run on the unminified
// build; `node game/run_tests.js ... --minified` runs them on a minified harness. Nothing is renamed across scripts: each script is minified
// on its own, so the shared globals (PawArt, PawGenes ..., window.__paw) keep their names, and the game's own IIFE keeps its scope.
// Drops `debugger` and console.log / console.debug / console.info (console.warn and console.error stay: they report real problems).
// esbuild comes from NODE_PATH, the repo or tools/node_modules; without it the file is left as it is, with a warning (never a broken build).
const fs = require('fs'), path = require('path');
function loadEsbuild() {
  const tries = [].concat((process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean).map((d) => path.join(d, 'esbuild')), 'esbuild', path.join(__dirname, 'node_modules', 'esbuild'));
  for (const t of tries) { try { return require(t); } catch (e) { /* next */ } }
  return null;
}
function minifyHtml(html) {
  const es = loadEsbuild();
  if (!es) { console.warn('minify: esbuild not found (npm i -g esbuild@0.24.0, or npm i --prefix tools esbuild@0.24.0); left unminified'); return { html, before: html.length, after: html.length, skipped: true }; }
  const before = html.length;
  let n = 0;
  // one pass in document order: a <style> written inside a script's strings is part of that script, never minified as CSS
  const out = html.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)|(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, so, sb, sc, co, cb, cc) => {
    if (so) {
      if (!sb.trim() || /\btype="(?:application\/(?:ld\+)?json|text\/template)"/i.test(so)) return m;
      const r = es.transformSync(sb, { loader: 'js', minify: true, target: 'es2019', legalComments: 'none', drop: ['debugger'], pure: ['console.log', 'console.debug', 'console.info'] });
      n++; return so + r.code.replace(/<\/script/gi, '<\\/script') + sc;
    }
    if (!cb.trim()) return m;
    const r = es.transformSync(cb, { loader: 'css', minify: true, legalComments: 'none' });
    n++; return co + r.code + cc;
  });
  return { html: out, before, after: out.length, blocks: n };
}
module.exports = { minifyHtml };
if (require.main === module) {
  const f = process.argv[2]; if (!f) { console.error('usage: node tools/minify.js <file.html>'); process.exit(1); }
  const r = minifyHtml(fs.readFileSync(f, 'utf8'));
  if (!r.skipped) fs.writeFileSync(f, r.html);
  const gz = (s) => require('zlib').gzipSync(s).length;
  console.log(`minify ${path.basename(f)}: ${(r.before / 1e6).toFixed(2)} MB -> ${(r.after / 1e6).toFixed(2)} MB (${r.blocks || 0} blocks)` + (r.skipped ? ' [skipped]' : ''));
}
