// v2.7 HOME lane test, V27.md. Placeholder from the coordinator's stub commit: the HOME lane replaces it.
// node game/run_tests.js v27_home
require('./test_lib').run('v27_home', async (t) => {
  const p = await t.boot();
  t.ok(await p.locator('#tNew').count() === 1, 'title screen loads');
});
