// v2.8 FUJI HILL lane test, V28.md section 12.4 and 12.6. Placeholder from the coordinator's stub commit: the lane replaces it.
// node game/run_tests.js v28_jp
require('./test_lib').run('v28_jp', async (t) => {
  const p = await t.boot();
  t.ok(await p.locator('#tNew').count() === 1, 'title screen loads');
});
