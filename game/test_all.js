// The old 8-minute test_all.js now lives in 5 shards (test_all_a.js .. test_all_e.js, coverage checklist at the top of test_all_a.js).
// This file only keeps `node game/test_all.js` working: it runs the shards through the runner.
const cp = require('child_process'), path = require('path');
const r = cp.spawnSync('node', [path.join(__dirname, 'run_tests.js'), 'test_all', ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(r.status === null ? 1 : r.status);
