// v2.6 HALLOWEEN lane phone test, V26.md section 7. Placeholder from the coordinator's stub commit: the HALLOWEEN lane replaces it.
// node game/run_tests.js phone_v26_halloween
require('./test_lib').run('phone_v26_halloween', async (t) => {
  const p = await t.boot();
  t.ok(await p.locator('#tNew').count() === 1, 'title screen loads');
}, { device: 'iPhone 13' });
