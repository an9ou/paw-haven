#!/usr/bin/env node
// Paw Haven test runner: build -> harness merged -> run suites in PARALLEL (one Chromium process per suite).
//   node game/run_tests.js smoke                 quick loop (<= 90 s)
//   node game/run_tests.js all                   every desktop suite, sharded
//   node game/run_tests.js all_c v15             named suites (see --list)
//   node game/run_tests.js game/test_myfeature.js  your own suite file (written with test_lib.js), run like any other
// Options:  --jobs N   parallel suites (default: CPU cores - 1, at least 1)
//           --retries N  automatic retries of a failing suite (default 1; a suite that fails then passes is reported FLAKY)
//           --strict   treat FLAKY as a failure (exit 1)
//           --no-build skip build + harness (use the existing game/test_merged.html)
//           --shots    write screenshots to game/shots_<suite>/ (off by default, they cost time)
//           --list     print the suites and exit
// Logs: game/test_logs/<suite>.log (+ <suite>.retryN.log), summary in game/test_logs/last_run.txt, timings in timings.json.
// Exit code: 0 all passed (flaky ones included unless --strict), 1 any real failure.
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const D = __dirname, LOGS = path.join(D, 'test_logs');

// name -> { file, group, est (seconds, only used for ordering the first time; real timings replace it) }
const SUITES = {
  smoke: { file: 'test_smoke.js', group: 'smoke', est: 25 },
  all_a: { file: 'test_all_a.js', group: 'all', est: 45 },
  all_b: { file: 'test_all_b.js', group: 'all', est: 20 },
  all_c: { file: 'test_all_c.js', group: 'all', est: 25 },
  all_d: { file: 'test_all_d.js', group: 'all', est: 45 },
  all_e: { file: 'test_all_e.js', group: 'all', est: 30 },
  v15: { file: 'test_v15.js', group: 'all', est: 35 },
  v16: { file: 'test_v16.js', group: 'all', est: 55 },
  v16b: { file: 'test_v16b.js', group: 'all', est: 45 },
  v17: { file: 'test_v17.js', group: 'all', est: 30 },
  v171_garden: { file: 'test_v171_garden.js', group: 'all', est: 35 },
};
// extra aliases: `all_*` is the same as `all`; `test_all` = the four+ shards of the old test_all.js
const ALIAS = { test_all: ['all_a', 'all_b', 'all_c', 'all_d', 'all_e'], 'test_v15': ['v15'], 'test_v16': ['v16'], 'test_v16b': ['v16b'], 'test_v17': ['v17'], 'test_v171_garden': ['v171_garden'] };

const argv = process.argv.slice(2); const opt = { jobs: Math.max(1, os.cpus().length - 1), retries: 1, strict: false, build: true, shots: false, timeout: 420 }; const names = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--jobs' || a === '-j') opt.jobs = Math.max(1, parseInt(argv[++i], 10) || 1);
  else if (a.startsWith('--jobs=')) opt.jobs = Math.max(1, parseInt(a.slice(7), 10) || 1);
  else if (a === '--retries') opt.retries = Math.max(0, parseInt(argv[++i], 10) || 0);
  else if (a === '--timeout') opt.timeout = parseInt(argv[++i], 10) || 420;
  else if (a === '--strict') opt.strict = true;
  else if (a === '--no-build') opt.build = false;
  else if (a === '--shots') opt.shots = true;
  else if (a === '--list') { Object.entries(SUITES).forEach(([k, v]) => console.log(k.padEnd(8), v.group.padEnd(6), v.file)); process.exit(0); }
  else if (a === '-h' || a === '--help') { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 14).map((l) => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(0); }
  else names.push(a);
}
if (!names.length) { console.error('usage: node game/run_tests.js smoke | all | <suite names...> [--jobs N] [--retries N] [--strict] [--no-build] [--shots] [--list]'); process.exit(2); }
let list = [];
for (const n of names) {
  if (n === 'all') list.push(...Object.keys(SUITES).filter((k) => SUITES[k].group === 'all'));
  else if (n === 'smoke') list.push('smoke');
  else if (ALIAS[n]) list.push(...ALIAS[n]);
  else if (SUITES[n]) list.push(n);
  else if (/\.js$/.test(n) && (fs.existsSync(path.resolve(n)) || fs.existsSync(path.join(D, n)))) { // an ad-hoc suite file (your own feature test written with test_lib.js)
    const file = fs.existsSync(path.resolve(n)) ? path.resolve(n) : path.join(D, n), key = path.basename(n, '.js').replace(/^test_/, ''); SUITES[key] = { file, group: 'adhoc', est: 60 }; list.push(key);
  } else { console.error('unknown suite: ' + n + '  (try --list)'); process.exit(2); }
}
list = [...new Set(list)];

fs.mkdirSync(LOGS, { recursive: true });
let NODE_PATH = process.env.NODE_PATH; if (!NODE_PATH) { try { NODE_PATH = cp.execSync('npm root -g', { encoding: 'utf8' }).trim(); } catch (e) { NODE_PATH = ''; } }
const env = Object.assign({}, process.env, { NODE_PATH }, opt.shots ? { PAW_SHOTS: '1' } : {});
const t0 = Date.now(); const sec = (ms) => (ms / 1000).toFixed(1) + 's';

function sh(cmd, args, label) {
  const r = cp.spawnSync(cmd, args, { cwd: path.join(D, '..'), encoding: 'utf8', env });
  if (r.status !== 0) { console.error(`${label} FAILED\n${(r.stdout || '') + (r.stderr || '')}`); process.exit(1); }
  return (r.stdout || '').trim();
}
if (opt.build) {
  const s = Date.now(); const a = sh('node', ['game/build.js'], 'build'), b = sh('node', ['game/harness.js', 'merged'], 'harness merged');
  console.log(`build: ${a} | harness merged: ${b} (${sec(Date.now() - s)})`);
} else if (!fs.existsSync(path.join(D, 'test_merged.html'))) { console.error('game/test_merged.html is missing: run without --no-build'); process.exit(1); }

// longest suite first (timings from the previous run) so the parallel schedule finishes together
let hist = {}; try { hist = JSON.parse(fs.readFileSync(path.join(LOGS, 'timings.json'), 'utf8')); } catch (e) { hist = {}; }
const est = (n) => hist[n] || SUITES[n].est; list.sort((a, b) => est(b) - est(a));

function runOne(name, attempt) {
  return new Promise((resolve) => {
    const log = path.join(LOGS, name + (attempt ? `.retry${attempt}` : '') + '.log'); const out = fs.openSync(log, 'w'); const s = Date.now();
    const child = cp.spawn('node', [path.resolve(D, SUITES[name].file)], { cwd: D, env, stdio: ['ignore', out, out], detached: true });
    let killed = false; const kt = setTimeout(() => { killed = true; try { process.kill(-child.pid, 'SIGKILL'); } catch (e) { /* gone */ } }, opt.timeout * 1000);
    child.on('exit', (code) => {
      clearTimeout(kt); try { fs.closeSync(out); } catch (e) { /* closed */ }
      try { process.kill(-child.pid, 'SIGKILL'); } catch (e) { /* no stragglers */ } // chromium leftovers
      const txt = fs.readFileSync(log, 'utf8'); const pass = code === 0 && !killed && /ALL OK/.test(txt);
      const bad = txt.split('\n').filter((l) => /^\s*FAIL |^CRASH|^FAILED|Error:/.test(l)).slice(0, 4).map((l) => l.trim().slice(0, 220));
      if (killed) bad.unshift(`TIMEOUT after ${opt.timeout}s`);
      if (!pass && !bad.length) bad.push(`exit code ${code}, see ${path.relative(process.cwd(), log)}`);
      const checks = (txt.match(/^\s+ok\s/gm) || []).length, nfail = (txt.match(/^\s+FAIL\s/gm) || []).length;
      resolve({ name, attempt, pass, secs: (Date.now() - s) / 1000, bad, log, checks, nfail });
    });
  });
}
async function runSuite(name) {
  const tries = []; let r = await runOne(name, 0); tries.push(r);
  for (let a = 1; !r.pass && a <= opt.retries; a++) { console.log(`  retry ${name} (attempt ${a + 1}) after: ${r.bad[0] || 'failure'}`); r = await runOne(name, a); tries.push(r); }
  const first = tries[0]; const status = first.pass ? 'PASS' : r.pass ? 'FLAKY' : 'FAIL';
  const res = { name, status, secs: tries.reduce((s, x) => s + x.secs, 0), lastSecs: r.secs, checks: r.checks, bad: first.bad, tries: tries.length, log: path.relative(process.cwd(), (status === 'FLAKY' ? first : tries[tries.length - 1]).log) };
  console.log(`  ${status.padEnd(5)} ${name.padEnd(7)} ${sec(r.secs * 1000)}${tries.length > 1 ? ` (${tries.length} attempts)` : ''}`);
  return res;
}
(async () => {
  console.log(`running ${list.length} suite(s) with ${opt.jobs} parallel job(s): ${list.join(', ')}`);
  const results = []; const queue = list.slice(); let running = 0;
  await new Promise((done) => {
    const next = () => {
      if (!queue.length && !running) return done();
      while (running < opt.jobs && queue.length) { const n = queue.shift(); running++; runSuite(n).then((r) => { results.push(r); running--; next(); }); }
    };
    next();
  });
  const wall = Date.now() - t0; results.sort((a, b) => list.indexOf(a.name) - list.indexOf(b.name));
  for (const r of results) if (r.status !== 'FAIL' || true) hist[r.name] = Math.round(r.lastSecs);
  try { fs.writeFileSync(path.join(LOGS, 'timings.json'), JSON.stringify(hist, null, 1)); } catch (e) { /* ro */ }
  const lines = ['', 'suite     result  time     checks  first failure lines', '-'.repeat(78)];
  for (const r of results) {
    lines.push(`${r.name.padEnd(9)} ${r.status.padEnd(7)} ${sec(r.lastSecs * 1000).padEnd(8)} ${String(r.checks).padEnd(7)} ${r.status === 'PASS' ? '' : r.bad[0] || ''}`);
    if (r.status !== 'PASS') { r.bad.slice(1).forEach((b) => lines.push(' '.repeat(34) + b)); lines.push(' '.repeat(34) + 'log: ' + r.log); }
  }
  const nFail = results.filter((r) => r.status === 'FAIL').length, nFlaky = results.filter((r) => r.status === 'FLAKY').length;
  lines.push('-'.repeat(78), `${results.length - nFail - nFlaky} passed, ${nFlaky} flaky, ${nFail} failed | wall ${sec(wall)} | sum of suites ${sec(results.reduce((s, r) => s + r.lastSecs * 1000, 0))} | jobs ${opt.jobs}`);
  if (nFlaky) lines.push('FLAKY = failed once, passed on retry. The log shown is the FIRST (failing) attempt; the passing retry is <suite>.retry1.log. and fix the wait/pin that is missing.');
  const txt = lines.join('\n'); console.log(txt); try { fs.writeFileSync(path.join(LOGS, 'last_run.txt'), txt + '\n'); } catch (e) { /* ro */ }
  process.exit(nFail || (opt.strict && nFlaky) ? 1 : 0);
})();
