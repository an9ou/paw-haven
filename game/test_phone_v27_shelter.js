// v2.7 SHELTER lane phone test (iPhone 13 and Pixel 7), V27.md. Placeholder from the coordinator's stub commit: the SHELTER lane replaces it.
// node game/run_tests.js phone_v27_shelter
require('./test_lib').run('phone_v27_shelter', async (t) => {
  const p = await t.boot();
  t.ok(await p.locator('#tNew').count() === 1, 'title screen loads on a phone');
}, { device: 'iPhone 13' });
