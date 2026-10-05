const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium'
  });
  
  try {
    const page = await browser.newPage();
    await page.goto('file://' + path.resolve(__dirname, 'dogs/gallery.html'));
    
    // Wait for gallery to load
    await page.waitForSelector('#out', { timeout: 10000 });
    
    console.log('Gallery loaded, taking screenshots...');
    
    // Create output directory
    const outDir = path.join(__dirname, 'rainbow_samples');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    // Find and screenshot cells with Rainbow Collar
    const cells = await page.locator('.cell:has-text("Rainbow Collar")').all();
    console.log(`Found ${cells.length} Rainbow Collar cells`);
    
    for (let i = 0; i < Math.min(cells.length, 10); i++) {
      const cell = cells[i];
      const svg = await cell.locator('svg').first();
      await svg.screenshot({ path: path.join(outDir, `rainbow_${i}.png`) });
      
      // Get the code text
      const code = await cell.locator('code').textContent();
      console.log(`Screenshot ${i}: ${code}`);
    }
    
    console.log(`Screenshots saved to ${outDir}`);
  } finally {
    await browser.close();
  }
})();
