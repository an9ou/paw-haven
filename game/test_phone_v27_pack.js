// v2.7 PACK CARE lane phone test (iPhone 13 and Pixel 7), V27.md. Placeholder from the coordinator's stub commit: the PACK CARE lane replaces it.
// node game/run_tests.js phone_v27_pack
require('./test_lib').run('phone_v27_pack', async (t) => {
  const p = await t.boot();
  t.ok(await p.locator('#tNew').count() === 1, 'title screen loads on a phone');
}, { device: 'iPhone 13', packCare: true });
