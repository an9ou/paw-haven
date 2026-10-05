const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium'
  });
  
  try {
    const page = await browser.newPage();
    await page.goto('file://' + path.resolve(__dirname, 'dogs/gallery.html'));
    
    // Wait for leg checks to complete
    await page.waitForSelector('#legcheck[data-done="1"], #legcheck2[data-done="1"]', { timeout: 30000 });
    
    // Get the leg check results
    const legcheck1 = await page.locator('#legcheck').textContent();
    const legcheck2 = await page.locator('#legcheck2').textContent();
    
    console.log(legcheck1);
    console.log(legcheck2);
  } finally {
    await browser.close();
  }
})();
