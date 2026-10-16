// Title and adoption screens for the "how to play" post.
const path = require('path'), fs = require('fs');
const { run } = require(path.join(__dirname, '..', '..', '..', 'game', 'test_lib'));
const OUT = path.resolve(process.argv[2] || 'shots'); fs.mkdirSync(OUT, { recursive: true });
run('launch_shots3', async (t) => {
  const p = () => t.p;
  await t.boot({ device: 'iPhone 15' });
  await t.sleep(1500); await p().screenshot({ path: path.join(OUT, 'title.png') }); console.log('shot title');
  await p().click('#tNew'); await p().waitForSelector('#aAdopt'); await t.sleep(1200);
  await p().click('.heads button[aria-label$="Corgi"]'); await t.sleep(800);
  await p().screenshot({ path: path.join(OUT, 'adopt.png') }); console.log('shot adopt');
}, { device: 'iPhone 15', date: '2026-10-20', season: 'auto', fest: 'auto', prefs: { hwTest: true, jpTest: true, wnTest: true }, timeout: 120000 });
