// v2.33.2 "Sleigh bells": the music snapshot guard as a suite (`node game/run_tests.js audio_sig`, plain node, no browser, about a second).
// Every place x time x weather (x walk area, x fest, x months 6/0/11) must resolve exactly as in mods/audio/sig_snapshot.json, so a
// change for one place (the Winter Market's Christmas tune) cannot quietly change the music anywhere else. It is the fast part of
// mods/audio/check_wxmas.js (`--sig`); the full check (offline renders of the turns, live, about 4 minutes) stays a by-hand run.
const cp = require('child_process'), path = require('path');
const r = cp.spawnSync('node', [path.join(__dirname, '..', 'mods', 'audio', 'check_wxmas.js'), '--sig'], { stdio: 'inherit' });
process.exit(r.status == null ? 1 : r.status);
