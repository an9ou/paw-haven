// Merch spike: runs merch/print_worker.mjs in workerd (Miniflare; no CPU or memory limits are enforced locally, so this proves it runs, not that it fits).
//   node merch/test_print_worker.mjs <dir holding @resvg/resvg-wasm>     (needs miniflare installed globally and merch/dist/pawprint.min.js)
import fs from 'fs'; import path from 'path'; import os from 'os'; import { execSync } from 'child_process'; import { createRequire } from 'module';
const here = path.dirname(new URL(import.meta.url).pathname), nm = process.argv[2], G = execSync('npm root -g').toString().trim();
const { Miniflare } = await import(path.join(G, 'miniflare', 'dist', 'src', 'index.js'));
const P = createRequire(import.meta.url)(path.join(here, 'dist', 'pawprint.js'));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-worker-'));
fs.copyFileSync(path.join(here, 'print_worker.mjs'), path.join(dir, 'worker.mjs')); fs.copyFileSync(path.join(here, 'dist', 'pawprint.min.js'), path.join(dir, 'pawprint.js'));
fs.copyFileSync(path.join(nm, '@resvg', 'resvg-wasm', 'index.mjs'), path.join(dir, 'resvg.mjs')); fs.copyFileSync(path.join(nm, '@resvg', 'resvg-wasm', 'index_bg.wasm'), path.join(dir, 'resvg.wasm'));
process.chdir(dir); const mf = new Miniflare({ modules: true, scriptPath: 'worker.mjs', modulesRules: [{ type: 'CompiledWasm', include: ['**/*.wasm'] }, { type: 'ESModule', include: ['**/*.mjs'] }, { type: 'CommonJS', include: ['**/pawprint.js'] }], compatibilityDate: '2025-01-01' });
const p = P.merchEncode({ v: 1, b: P.BREEDS.indexOf('dane'), g: '222010', e: 2, p: 77, a: 0, s: 'm', n: 'Duke' }); let bad = 0;
for (const [w, h, bg] of [[2700, 1050, 'strip'], [1500, 1500, 'none'], [3000, 3000, 'yard']]) {
  const res = await mf.dispatchFetch(`http://x/?p=${p}&w=${w}&h=${h}&bg=${bg}`), b = Buffer.from(await res.arrayBuffer());
  const ok = res.status === 200 && b.readUInt32BE(16) === w && b.readUInt32BE(20) === h; bad += ok ? 0 : 1;
  console.log((ok ? '  ok  ' : '  FAIL ') + `${w}x${h} ${bg}: ${res.status}, ${res.headers.get('x-render-ms')} ms in workerd, ${Math.round(b.length / 1024)} KB PNG`);
}
const r = await mf.dispatchFetch('http://x/?p=AAAA'); const ok = r.status === 400; bad += ok ? 0 : 1; console.log((ok ? '  ok  ' : '  FAIL ') + 'a bad link is refused: ' + r.status + ' ' + await r.text());
await mf.dispose(); fs.rmSync(dir, { recursive: true, force: true }); process.exit(bad ? 1 : 0);
