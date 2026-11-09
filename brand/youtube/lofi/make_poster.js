// YouTube poster for the rainy evening lofi (owner, 9 Nov 2026): the thumbnail with "play at doodledoggo.app" beside the logo.
// Bottom-left only: YouTube covers the bottom-right corner with the video length.
//   node brand/youtube/lofi/make_poster.js   (needs Playwright; Caveat from Google Fonts)
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const DIR = __dirname, IMG = fs.readFileSync(path.join(DIR, 'lofi-rainy-evening-thumb.jpg')).toString('base64');
const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap" rel="stylesheet">
<style>body{margin:0}#p{position:relative;width:1280px;height:720px;background:url(data:image/jpeg;base64,${IMG}) 0 0/1280px 720px}
.pill{position:absolute;left:272px;top:624px;height:62px;padding:0 26px;display:flex;align-items:center;justify-content:center;background:#FFF8EC;
border:4px solid #5B3D32;border-radius:31px;box-sizing:border-box;box-shadow:3px 4px 0 rgba(91,61,50,.25);font:700 40px/1 Caveat;color:#5B3D32;white-space:nowrap;transform:rotate(-1.5deg)}
.pill b{color:#E0607E;font-weight:700;margin-left:.28em}</style>
<div id="p"><div class="pill">play at<b>doodledoggo.app</b></div></div>`;
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  await p.setContent(html, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(DIR, 'lofi-rainy-evening-poster.jpg'), type: 'jpeg', quality: 92 }); await b.close();
})();
