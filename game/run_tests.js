#!/usr/bin/env node
// Doodle Doggo test runner: build -> harness merged -> run suites in PARALLEL (one Chromium process per suite).
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

// name -> { file, group, est (seconds, only used for ordering the first time; real timings replace it), timeout (optional, seconds: raises --timeout for that suite) }
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
  v171_tricks: { file: 'test_v171_tricks.js', group: 'all', est: 60 },
  v2_slots: { file: 'test_v2_slots.js', group: 'all', est: 70 },
  v2_breed: { file: 'test_v2_breed.js', group: 'all', est: 90 },
  v2_journal: { file: 'test_v2_journal.js', group: 'all', est: 80 },
  v2_town: { file: 'test_v2_town.js', group: 'all', est: 80 },
  v2_play: { file: 'test_v2_play.js', group: 'all', est: 70 },
  v21_genes: { file: 'test_v21_genes_node.js', group: 'all', est: 15 },
  copy: { file: 'test_copy_node.js', group: 'all', est: 2 },
  i18n: { file: 'test_i18n_node.js', group: 'all', est: 3 }, // v2.14 SPEC (V214.md 13): msg.js, glossaries, string tables, helper names
  v21_breed: { file: 'test_v21_breed.js', group: 'all', est: 15 },
  v21_journal: { file: 'test_v21_journal.js', group: 'all', est: 30 },
  v21_town: { file: 'test_v21_town.js', group: 'all', est: 20 },
  v21_home: { file: 'test_v21_home.js', group: 'all', est: 15 },
  // v2.4 Shop Day
  v24_shop: { file: 'test_v24_shop.js', group: 'all', est: 40 },
  v24_missions: { file: 'test_v24_missions.js', group: 'all', est: 30 },
  v24_guide: { file: 'test_v24_guide.js', group: 'all', est: 30 },
  v24_toys: { file: 'test_v24_toys.js', group: 'all', est: 45 },
  v24_art: { file: 'test_v24_art_node.js', group: 'all', est: 10 },
  // v2.5 (V25.md): seasons, festival art, breeds, festivals
  v25_seasons: { file: 'test_v25_seasons_node.js', group: 'all', est: 20 },
  v25_art: { file: 'test_v25_art_node.js', group: 'all', est: 10 },
  v25_breeds: { file: 'test_v25_breeds.js', group: 'all', est: 150, timeout: 500 }, // v2.12: 35 heads to tap through
  v25_festival: { file: 'test_v25_festival.js', group: 'all', est: 60 },
  v25_fixes_a: { file: 'test_v25_fixes_a.js', group: 'all', est: 40 }, // the owner's v2.4 fixes (V25.md 7b)
  v25_fixes_b: { file: 'test_v25_fixes_b.js', group: 'all', est: 40 },
  // v2.6 (V26.md): Halloween 2026 art, scenes, toys and the Pumpkin Patch Pop-up
  v26_art: { file: 'test_v26_art_node.js', group: 'all', est: 10 },
  v26_scenes: { file: 'test_v26_scenes_node.js', group: 'all', est: 20 },
  v26_toys: { file: 'test_v26_toys.js', group: 'all', est: 45 },
  v26_halloween: { file: 'test_v26_halloween.js', group: 'all', est: 60 },
  // v2.7 (V27.md): Home & Pack art, the playroom scene, house decorating and furniture, pack care, the Shelter Playroom
  v27_art: { file: 'test_v27_art_node.js', group: 'all', est: 10 },
  v27_scenes: { file: 'test_v27_scenes_node.js', group: 'all', est: 20 },
  v27_home: { file: 'test_v27_home.js', group: 'all', est: 60 },
  v27_pack: { file: 'test_v27_pack.js', group: 'all', est: 45 },
  v27_shelter: { file: 'test_v27_shelter.js', group: 'all', est: 45 },
  v27_mailbox: { file: 'test_v27_mailbox.js', group: 'all', est: 40 }, // v2.7 owner addition: Collect in the mailbox
  v27_review: { file: 'test_v27_review.js', group: 'all', est: 40 }, // v2.7 integration review fixes (coordinator)
  // v2.8 (V28.md): Winter & New Year art and scene dressing, the Japan scenery, core dates, the WINTER, NEW YEAR and FUJI HILL lanes
  v28_art: { file: 'test_v28_art_node.js', group: 'all', est: 10 },
  v28_scenes: { file: 'test_v28_scenes_node.js', group: 'all', est: 120 },
  v28_dates: { file: 'test_v28_dates_node.js', group: 'all', est: 5 }, // coordinator: wnAuto, festNow overrides, the wnTest / jpTest gates, v28Fields, section 1 data
  v28_japan: { file: 'test_v28_japan_node.js', group: 'all', est: 70 },
  v28_winter: { file: 'test_v28_winter.js', group: 'all', est: 60 },
  v28_newyear: { file: 'test_v28_newyear.js', group: 'all', est: 45 },
  v28_jp: { file: 'test_v28_jp.js', group: 'all', est: 45 },
  // v2.9 (V29.md): pack play and walks, photo mode, polish (and the combined missions + guide flow)
  v29_pack: { file: 'test_v29_pack.js', group: 'all', est: 60 },
  v210_roam: { file: 'test_v210_roam.js', group: 'all', est: 60 }, // v2.10 ROAM (V210.md)
  v211_breeds: { file: 'test_v211_breeds.js', group: 'all', est: 300, timeout: 750 }, // v2.11 BREEDS (V211.md 5.2): akita, spitz, pom
  v212_breeds: { file: 'test_v212_breeds.js', group: 'all', est: 260, timeout: 700 }, // v2.12 GENES (V212.md 3): the fourteen adopted, coats, litters, Labradoodle, the coat tab
  v211_cards: { file: 'test_v211_cards.js', group: 'all', est: 70 }, // v2.11 CARDS: Dog Cards (V211.md section 5.5)
  v29_photo: { file: 'test_v29_photo.js', group: 'all', est: 45 },
  v29_polish: { file: 'test_v29_polish.js', group: 'all', est: 45 },
  v29_flows: { file: 'test_v29_flows.js', group: 'all', est: 60 },
  v210_ball: { file: 'test_v210_ball.js', group: 'all', est: 60 }, // v2.10 (V210.md): free ball play where you are (BALL lane)
  v211_tokyo: { file: 'test_v211_tokyo.js', group: 'all', est: 150, timeout: 420 }, // v2.11 TRAVEL (V211.md 5.3): the Station, the ride, the Japan map, the Tokyo places
  v211_art_d: { file: 'test_v211_art_d_node.js', group: 'all', est: 30 }, // v2.11 TOKYO ART D (V211.md 5.4): Japan map, Shinkansen, Shibuya, Yoyogi, Asakusa, the town map's Station pin
  v211_art_e: { file: 'test_v211_art_e_node.js', group: 'all', est: 15 }, // v2.11 (V211.md 5.4): world E, the Tokyo Tower, Ueno and Odaiba scenes, eki stamps, lucky cat, Tokyo frame, items (TOKYO ART E)
  v29_review: { file: 'test_v29_review.js', group: 'all', est: 40 }, // v2.9 integration review fixes (coordinator)
  v211_dogs: { file: 'test_v211_dogs_node.js', group: 'all', est: 450, timeout: 700 }, // v2.11 BREED ART (V211.md 5.2): akita, spitz, pom, afghan, dane, mastiff, gsd and the three Tokyo bandanas
  v212_dogs: { file: 'test_v212_dogs_node.js', group: 'all', est: 480, timeout: 900 }, // v2.12 ART A-D (V212.md 5): the fourteen new breeds in every pose, age, facing and outfit
  v212_lines: { file: 'test_v212_lines_node.js', group: 'all', est: 3 }, // v2.12 LINES (V212.md 4): every per-breed table has all 35 keys
  v213_faces: { file: 'test_v213_faces_node.js', group: 'all', est: 120, timeout: 600 }, // v2.13 ART A + B (V213.md 3, 6): every expression on every breed, age, ok pose, facing and a set of outfits
  v213_neck: { file: 'test_v213_neck_node.js', group: 'all', est: 170, timeout: 600 }, // v2.13 NECK (V213.md 5): every head on its body, 35 breeds, every pose, adult and puppy, expressions that tilt the head, mixes (5.1)
  v213_expr: { file: 'test_v213_expr.js', group: 'all', est: 60 }, // v2.13 EX (V213.md 4): expressions in play, personality, photo picker
  // v2.2 phone suites: `node game/run_tests.js phone` (not part of `all`, which stays the desktop regression set)
  phone_legacy: { file: 'test_phone.js', group: 'phone', est: 90 },
  phone_shell: { file: 'test_phone_shell.js', group: 'phone', est: 40 },
  cloud: { file: 'test_cloud.js', group: 'phone', est: 60 },
  worker: { file: 'test_worker.js', group: 'phone', est: 5 }, // v2.8.1: the Cloudflare Worker (node + Miniflare, local D1)
  site: { file: 'test_site.js', group: 'phone', est: 20 }, // v2.8.2: the doodledoggo.app introduction site and its reset page (Miniflare, desktop + iPhone 15)
  phone_home: { file: 'test_phone_home.js', group: 'phone', est: 60 },
  phone_town: { file: 'test_phone_town.js', group: 'phone', est: 70 },
  phone_journal: { file: 'test_phone_journal.js', group: 'phone', est: 35 },
  phone_puppy: { file: 'test_phone_puppy.js', group: 'phone', est: 35 },
  phone_walk: { file: 'test_phone_walk.js', group: 'phone', est: 110 },
  phone_skill: { file: 'test_phone_skill.js', group: 'phone', est: 150 },
  // v2.3 "Cozy Phones"
  account: { file: 'test_account.js', group: 'phone', est: 240, timeout: 500 }, // v2.8: about 230 s alone, more under load (its own watchdog is 480 s)
  itch_build: { file: 'test_itch_build.js', group: 'all', est: 40 }, // the itch.io copy has no dev button or panel (tools/itch.js)
  phone_occl_home: { file: 'test_phone_occl_home.js', group: 'phone', est: 60 },
  phone_occl_play: { file: 'test_phone_occl_play.js', group: 'phone', est: 60 },
  phone_v24_shop: { file: 'test_phone_v24_shop.js', group: 'phone', est: 40 }, // v2.4
  phone_v24_guide: { file: 'test_phone_v24_guide.js', group: 'phone', est: 40 },
  phone_v25_festival: { file: 'test_phone_v25_festival.js', group: 'phone', est: 60 }, // v2.5
  phone_v25_fixes_a: { file: 'test_phone_v25_fixes_a.js', group: 'phone', est: 40 },
  phone_v25_fixes_b: { file: 'test_phone_v25_fixes_b.js', group: 'phone', est: 40 },
  phone_v26_halloween: { file: 'test_phone_v26_halloween.js', group: 'phone', est: 60 }, // v2.6
  phone_v27_home: { file: 'test_phone_v27_home.js', group: 'phone', est: 60 }, // v2.7 Home & Pack (V27.md)
  phone_v27_pack: { file: 'test_phone_v27_pack.js', group: 'phone', est: 45 },
  phone_v27_shelter: { file: 'test_phone_v27_shelter.js', group: 'phone', est: 45 },
  phone_v27_mailbox: { file: 'test_phone_v27_mailbox.js', group: 'phone', est: 40 },
  phone_v28_winter: { file: 'test_phone_v28_winter.js', group: 'phone', est: 60 }, // v2.8 (V28.md section 9): WINTER, with the NEW YEAR and FUJI HILL phone parts
  phone_v29_pack: { file: 'test_phone_v29_pack.js', group: 'phone', est: 50 }, // v2.9 (V29.md)
  phone_v210_ball: { file: 'test_phone_v210_ball.js', group: 'phone', est: 60 },
  phone_v210_roam: { file: 'test_phone_v210_roam.js', group: 'phone', est: 50 }, // v2.10 ROAM (V210.md)
  phone_v211_cards: { file: 'test_phone_v211_cards.js', group: 'phone', est: 50 }, // v2.11 CARDS: Dog Cards on phones (V211.md section 5.5)
  phone_v213_expr: { file: 'test_phone_v213_expr.js', group: 'phone', est: 50 }, // v2.13 EX: expressions and the photo face picker on phones (V213.md 4)
  phone_v211_tokyo: { file: 'test_phone_v211_tokyo.js', group: 'phone', est: 90 }, // v2.11 TRAVEL (V211.md 5.3): the Japan map, the ride, the Tokyo places on phones
  phone_v29_photo: { file: 'test_phone_v29_photo.js', group: 'phone', est: 45 },
  phone_v29_polish: { file: 'test_phone_v29_polish.js', group: 'phone', est: 45 },
};
// extra aliases: `all_*` is the same as `all`; `test_all` = the four+ shards of the old test_all.js
const ALIAS = { test_all: ['all_a', 'all_b', 'all_c', 'all_d', 'all_e'], 'test_v15': ['v15'], 'test_v16': ['v16'], 'test_v16b': ['v16b'], 'test_v17': ['v17'], 'test_v171_garden': ['v171_garden'], 'test_v171_tricks': ['v171_tricks'], 'test_v2_slots': ['v2_slots'], 'test_v2_breed': ['v2_breed'], 'test_v2_journal': ['v2_journal'], 'test_v2_town': ['v2_town'], 'test_v2_play': ['v2_play'], 'test_v21_genes_node': ['v21_genes'], 'test_copy_node': ['copy'], 'test_v21_breed': ['v21_breed'], 'test_v21_journal': ['v21_journal'], 'test_v21_town': ['v21_town'], 'test_v21_home': ['v21_home'] };

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
  else if (n === 'phone') list.push(...Object.keys(SUITES).filter((k) => SUITES[k].group === 'phone'));
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
    let killed = false; const kt = setTimeout(() => { killed = true; try { process.kill(-child.pid, 'SIGKILL'); } catch (e) { /* gone */ } }, Math.max(opt.timeout, SUITES[name].timeout || 0) * 1000); // a suite with its own longer watchdog (account) gets the runner's time to match
    child.on('exit', (code) => {
      clearTimeout(kt); try { fs.closeSync(out); } catch (e) { /* closed */ }
      try { process.kill(-child.pid, 'SIGKILL'); } catch (e) { /* no stragglers */ } // chromium leftovers
      const txt = fs.readFileSync(log, 'utf8'); const pass = code === 0 && !killed && /ALL OK/.test(txt);
      const bad = txt.split('\n').filter((l) => /^\s*FAIL |^CRASH|^FAILED|Error:/.test(l)).slice(0, 4).map((l) => l.trim().slice(0, 220));
      if (killed) bad.unshift(`TIMEOUT after ${Math.max(opt.timeout, SUITES[name].timeout || 0)}s`);
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
