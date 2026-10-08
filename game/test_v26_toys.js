// v2.6 TOYS lane test, V26.md section 6. Placeholder from the coordinator's stub commit: the TOYS lane replaces it.
// node game/run_tests.js v26_toys
require('./test_lib').run('v26_toys', async (t) => {
  const p = await t.boot();
  t.ok(await p.locator('#tNew').count() === 1, 'title screen loads');
});
