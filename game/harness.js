// Builds test_build.html: the deliverable with the stub inlined into the merge placeholder,
// wrapped in the same skeleton the Artifact publisher adds.
const fs = require('fs'), path = require('path');
const dir = __dirname;
const html = fs.readFileSync(path.join(dir, 'paw_haven_proto.html'), 'utf8');
const mode = process.argv[2] || 'plain', merged = mode === 'merged' || mode === 'published'; // published = merged minus garden/kitchen (what is live)
const rd = (f) => fs.readFileSync(path.join(dir, '..', f), 'utf8');
const stub = merged ? ['dogs/pawart_dogs.js', 'world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js'].filter((f) => fs.existsSync(path.join(dir, '..', f))).map(rd).join('\n') : rd('dogs/pawart_dogs.js') + '\n' + fs.readFileSync(path.join(dir, 'pawart_stub.js'), 'utf8');
const n = html.split('/*@@PAWART@@*/').length - 1;
if (n !== 1) throw new Error('placeholder count ' + n);
const realMods = ['mods/genes.js', 'mods/pawaudio.js', 'mods/walkrun.js', 'mods/toys.js', 'mods/garden.js', 'mods/kitchen.js'].filter((f) => mode !== 'published' || !/garden|kitchen/.test(f)).filter((f) => fs.existsSync(path.join(dir, '..', f))).map(rd).join('\n');
const stubMods = fs.readFileSync(path.join(dir, 'stub_mods.js'), 'utf8');
const mods = mode === 'plain' ? '' : merged ? realMods + '\n' + stubMods : stubMods; // stub_mods only fills modules that are missing
if (html.split('/*@@PAWMODS@@*/').length !== 2) throw new Error('pawmods placeholder count');
const body = html.replace('/*@@PAWART@@*/', () => stub).replace('/*@@PAWMODS@@*/', () => mods);
const out = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`;
fs.writeFileSync(path.join(dir, { plain: 'test_build.html', mods: 'test_mods.html', merged: 'test_merged.html', published: 'test_published.html' }[mode]), out);
// also extract the game script for node --check
const m = html.match(/<script id="pawmods">[\s\S]*?<\/script>\s*<script>([\s\S]*?)<\/script>/);
fs.writeFileSync(path.join(dir, 'game_script.check.js'), m[1]);
console.log('ok', out.length);
