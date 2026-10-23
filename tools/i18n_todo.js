#!/usr/bin/env node
// v2.14 translation lanes (V214.md 15): hand a translator the next batch of keys, merge a batch back, show progress.
//   node tools/i18n_todo.js <lang> --stats                       done / total per area
//   node tools/i18n_todo.js <lang> --next 150 [--prefix data.food.] [--out f.json]
//                                                                the next untranslated keys with their English (sorted, one area at a time)
//   node tools/i18n_todo.js <lang> --merge f.json [--dry]        check a batch and merge it into game/i18n/<lang>.json (sorted keys)
// The batch file is a flat { key: "translation" } object. A merge refuses the whole batch on any problem:
// unknown key, parse error, vars or plural/select args not matching the English, HTML tags not matching, a glossary ban hit.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const M = require(path.join(ROOT, 'game/i18n/msg.js'));
const argv = process.argv.slice(2), lang = argv[0];
const opt = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : (argv[i + 1] === undefined || argv[i + 1].startsWith('--') ? true : argv[i + 1]); };
if (!lang || !M.CODES.includes(lang) || lang === 'en') { console.error('usage: node tools/i18n_todo.js <' + M.CODES.filter(c => c !== 'en').join('|') + '> --stats | --next N [--prefix p] [--out f] | --merge f.json [--dry]'); process.exit(2); }
const EN = JSON.parse(fs.readFileSync(path.join(ROOT, 'game/i18n/en.json'), 'utf8'));
const FILE = path.join(ROOT, 'game/i18n', lang + '.json');
const TR = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
const area = k => { const p = k.split('.'); return p[0] === 'data' || p[0] === 'mod' ? p[0] + '.' + p[1] : p[0]; };
const done = k => typeof TR[k] === 'string' && TR[k] !== '';
const keys = Object.keys(EN).sort();

if (opt('--stats')) {
  const a = {};
  for (const k of keys) { const x = a[area(k)] || (a[area(k)] = { n: 0, d: 0, w: 0 }); x.n++; if (done(k)) x.d++; else x.w += EN[k].split(/\s+/).length; }
  const tot = keys.filter(done).length;
  console.log(`${lang}: ${tot} / ${keys.length} keys (${(100 * tot / keys.length).toFixed(1)} %), stale keys not in en.json: ${Object.keys(TR).filter(k => !(k in EN)).length}`);
  console.log(Object.entries(a).filter(([, x]) => x.d < x.n).sort((p, q) => q[1].w - p[1].w).map(([k, x]) => `${k} ${x.d}/${x.n} (${x.w} words left)`).join('\n'));
  process.exit(0);
}

if (opt('--next')) {
  const n = +opt('--next') || 150, pre = typeof opt('--prefix') === 'string' ? opt('--prefix') : '';
  const left = keys.filter(k => !done(k) && k.startsWith(pre));
  const first = left.length ? area(left[0]) : '';
  const out = {}; for (const k of left.filter(k => pre || area(k) === first).slice(0, n)) out[k] = EN[k];
  const txt = JSON.stringify(out, null, 1);
  if (typeof opt('--out') === 'string') { fs.writeFileSync(opt('--out'), txt + '\n'); console.log(`${Object.keys(out).length} keys (${left.length} left${pre ? ' under ' + pre : ''}) -> ${opt('--out')}`); }
  else console.log(txt);
  process.exit(0);
}

const mf = opt('--merge');
if (typeof mf !== 'string') { console.error('need --stats, --next N or --merge file.json'); process.exit(2); }
const B = JSON.parse(fs.readFileSync(mf, 'utf8'));
const G = JSON.parse(fs.readFileSync(path.join(ROOT, 'game/i18n/glossary', lang + '.json'), 'utf8'));
const bans = (G.bans || []).map(b => ({ re: new RegExp(b.re, b.flags || 'iu'), why: b.why }));
const allow = G.allow || [];
const tags = s => (s.match(/<\/?[a-z][a-z0-9]*/gi) || []).map(t => t.toLowerCase()).sort().join(' ');
const sig = s => { const a = M.args(s); return Object.keys(a).sort().map(k => k + ':' + (a[k] === 'josa' ? 'arg' : a[k])).join(' '); };
const bad = [];
for (const [k, v] of Object.entries(B)) {
  if (!(k in EN)) { bad.push(`${k}: not in en.json`); continue; }
  if (typeof v !== 'string') { bad.push(`${k}: not a string`); continue; }
  if (v === '') continue;
  try { M.parse(v); } catch (e) { bad.push(`${k}: parse error ${e.message}`); continue; }
  // a translation may leave out a `sex` select (ja / zh / ko / th often drop the pronoun); every other arg must match
  if (sig(v) !== sig(EN[k]) && sig(v) !== sig(EN[k]).split(' ').filter(a => a !== 'sex:select').join(' ')) bad.push(`${k}: args "${sig(v)}" vs English "${sig(EN[k])}"`);
  if (tags(v) !== tags(EN[k])) bad.push(`${k}: tags "${tags(v)}" vs English "${tags(EN[k])}"`);
  if (/[;；\u{1F300}-\u{1FAFF}☀-➿]/u.test(v) && !/[;]/.test(EN[k])) bad.push(`${k}: semicolon or emoji`);
  for (const b of bans) if (b.re.test(v) && !allow.some(a => v.includes(a))) bad.push(`${k}: ban (${b.why})`);
}
if (bad.length) { console.error(`REFUSED ${mf}: ${bad.length} problem(s)\n` + bad.slice(0, 60).join('\n')); process.exit(1); }
if (opt('--dry')) { console.log(`OK ${Object.keys(B).length} keys (dry run)`); process.exit(0); }
Object.assign(TR, B);
const out = {}; for (const k of Object.keys(TR).sort()) out[k] = TR[k];
fs.writeFileSync(FILE, JSON.stringify(out, null, 1) + '\n');
console.log(`merged ${Object.keys(B).length} keys -> ${path.relative(ROOT, FILE)} (${keys.filter(k => typeof out[k] === 'string' && out[k] !== '').length} / ${keys.length})`);
