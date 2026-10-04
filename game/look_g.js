const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto('file:///home/claude/art/paw_haven_style_study.html'); await p.waitForTimeout(800);
  const cards = p.locator('#heroGrid .card');
  const n = await cards.count();
  for (let i = 0; i < n; i++) { const t = await cards.nth(i).innerText(); console.log(JSON.stringify(t.slice(0,40))); if (/Doodle/.test(t)) { await cards.nth(i).screenshot({ path: path.join(__dirname, 'shots', 'g_ref.png') }); break; } }
  await b.close();
})();
