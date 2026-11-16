// v2.25.5 "Gift codes" (PROMO.md): the Worker's /promo/* routes against a local D1 (cloudflare/d1_node.js over node:sqlite).
//   node game/test_promo_worker.js      (or: node game/run_tests.js promo_worker)
// Shared codes once per account, the cap, the window, disabled, unique codes once in total and one per batch per account, racing
// redemptions of the last slot (only one wins), the rate limits, one generic answer for unknown / expired / disabled, the coin ceiling,
// GET /promo/mine, tidy(). Prints ALL OK when every check passes.
process.removeAllListeners('warning'); // node:sqlite is still "experimental" on Node 22
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.log('  FAIL', m); } };
const sec = (s) => console.log('--- ' + s);

(async () => {
  const t0 = Date.now();
  try {
    const { d1 } = require(path.join(ROOT, 'cloudflare', 'd1_node.js'));
    const worker = (await import(path.join(ROOT, 'cloudflare', 'worker.js'))).default;
    const DB = d1();
    DB.raw.exec(fs.readFileSync(path.join(ROOT, 'cloudflare', 'schema.sql'), 'utf8')); // safe to re-run
    // the batch is wrapped so the race checks can see that the losing redemption really went through the CHECK / unique path
    const batchErrs = []; const batch0 = DB.batch.bind(DB);
    DB.batch = async (l) => { try { return await batch0(l); } catch (e) { batchErrs.push(String(e && e.message)); throw e; } };
    // a gate for the races: the racers' "select ... from promo_codes" all wait until every racer has reached it (or 300 ms), so they really
    // pass the pre-checks together and meet at the insert, as two Workers can in production
    let gate = null; const prep0 = DB.prepare.bind(DB);
    DB.prepare = (sql) => {
      const st = prep0(sql); if (!/from promo_codes where code/.test(sql)) return st;
      const wrap = (x) => Object.assign({}, x, { bind: (...a) => wrap(x.bind(...a)), async first(c) { if (gate) { const g = gate; g.n--; if (g.n <= 0) g.go(); await g.p; } return x.first(c); } });
      return wrap(st);
    };
    const race = (k) => { let go; const p = new Promise((r) => { go = r; setTimeout(r, 300); }); gate = { n: k, p, go }; return () => { gate = null; }; };
    const env = { DB, TIDY: '1', RATE_SCALE: '1' };
    let ipN = 0;
    const call = async (method, p, body, token, ip) => {
      const h = { 'CF-Connecting-IP': ip || '10.25.' + ((++ipN >> 8) & 255) + '.' + (ipN & 255) }; if (token) h.Authorization = 'Bearer ' + token;
      let b; if (body !== null && body !== undefined) { b = typeof body === 'string' ? body : JSON.stringify(body); h['Content-Type'] = 'application/json'; }
      const res = await worker.fetch(new Request('https://api.test' + p, { method, headers: h, body: method === 'GET' ? undefined : b }), env, { waitUntil() {} });
      const text = await res.text(); let json = null; try { json = JSON.parse(text); } catch (e) { json = null; }
      return { status: res.status, text, json };
    };
    const q = (sql, ...a) => DB.raw.prepare(sql).get(...a);
    const n = (sql, ...a) => DB.raw.prepare(sql).get(...a).n;
    let accN = 0;
    const account = async (email) => { const g = (await call('POST', '/guest', {})).json; const r = (await call('POST', '/register', { email: email || 'gift' + (++accN) + '@example.com', password: 'pupper123' }, g.token)).json; return { token: r.token, id: r.user.id }; };
    // a code as tools/promo.sh writes it
    const DAY = 864e5;
    const mk = (shown, o) => {
      o = o || {}; const code = shown.toUpperCase().replace(/[\s-]/g, '');
      DB.raw.prepare('insert into promo_codes (code, shown, kind, batch, reward, starts_at, ends_at, cap, used, disabled, note, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)')
        .run(code, shown, o.kind || 'shared', o.batch || null, JSON.stringify(o.reward || { items: ['Red Bandana'], coins: 200, treats: { Pupcake: 2 } }), o.from === undefined ? Date.now() - DAY : o.from, o.to === undefined ? Date.now() + 30 * DAY : o.to, o.cap === undefined ? null : o.cap, o.disabled ? 1 : 0, o.note || null, Date.now());
      return code;
    };
    const redeem = (code, acc, ip) => call('POST', '/promo/redeem', { code }, acc && acc.token, ip);
    const is = (r, status, err) => r.status === status && r.json && r.json.error === err;

    sec('1. signed-in email accounts only');
    mk('DOGGO-IG-NOV');
    let r = await call('POST', '/promo/redeem', { code: 'DOGGO-IG-NOV' });
    ok(is(r, 403, 'login'), 'no session: 403 login (' + r.status + ' ' + r.text + ')');
    const G = (await call('POST', '/guest', {})).json;
    r = await call('POST', '/promo/redeem', { code: 'DOGGO-IG-NOV' }, G.token);
    ok(is(r, 403, 'login'), 'a guest: 403 login, never 401 (the game would drop its login): ' + r.status);
    r = await call('GET', '/promo/mine', null, G.token); ok(is(r, 403, 'login'), 'GET /promo/mine as a guest: 403 login');
    r = await call('GET', '/promo/mine'); ok(is(r, 403, 'login'), 'GET /promo/mine with no session: 403 login');
    ok(n('select count(*) as n from promo_redemptions') === 0, 'nothing recorded');

    sec('2. a shared code: each account once; spaces, dashes and case do not matter');
    const A = await account('a@example.com'), B = await account('b@example.com'), C = await account('c@example.com');
    r = await redeem('  doggo ig-nov ', A);
    ok(r.status === 200 && r.json.ok && r.json.code === 'DOGGO-IG-NOV' && r.json.key === 'DOGGOIGNOV', 'A redeems "  doggo ig-nov ": 200, shown as DOGGO-IG-NOV: ' + r.text);
    ok(JSON.stringify(r.json.reward) === JSON.stringify({ items: ['Red Bandana'], coins: 200, treats: { Pupcake: 2 } }), 'the reward: the item, 200 coins, 2 Pupcakes: ' + JSON.stringify(r.json.reward));
    r = await redeem('DOGGO-IG-NOV', A); ok(is(r, 409, 'used'), 'A again: 409 used');
    r = await redeem('DOGGOIGNOV', A); ok(is(r, 409, 'used'), 'A again without dashes: 409 used');
    r = await redeem('ＤＯＧＧＯ－ＩＧ－ＮＯＶ', B); // full-width, as a Japanese phone keyboard can type it
    ok(r.status === 200 && r.json.key === 'DOGGOIGNOV', 'B with full-width letters and dashes: 200');
    ok(q('select used from promo_codes where code = ?', 'DOGGOIGNOV').used === 2 && n('select count(*) as n from promo_redemptions where code = ?', 'DOGGOIGNOV') === 2, 'used = 2, two rows');

    sec('3. the cap');
    mk('CAP-TWO', { cap: 2 });
    ok((await redeem('cap-two', A)).status === 200 && (await redeem('CAPTWO', B)).status === 200, 'A and B redeem a code with cap 2');
    r = await redeem('CAP-TWO', C); ok(is(r, 409, 'gone'), 'C: 409 gone (' + r.text + ')');
    r = await redeem('CAP-TWO', A); ok(is(r, 409, 'used'), 'A again: used comes before gone');
    ok(q('select used from promo_codes where code = ?', 'CAPTWO').used === 2, 'used stays 2');

    sec('4. the window, disabled, unknown and broken input: one answer');
    mk('SOON-CODE', { from: Date.now() + DAY });
    mk('OVER-CODE', { from: Date.now() - 9 * DAY, to: Date.now() - 1000 });
    mk('OFF-CODE', { disabled: true });
    mk('EMPTY-CODE', { reward: { items: [], coins: 0, treats: {} } });
    const unk = [];
    for (const c of ['SOON-CODE', 'OVER-CODE', 'OFF-CODE', 'EMPTY-CODE', 'NOPE-CODE', 'AB', '!!!!!!', '<script>', 'x'.repeat(90)]) unk.push([c, await redeem(c, await account())]); // a fresh account each (10 tries an hour)
    unk.push(['(a number)', await call('POST', '/promo/redeem', { code: 12345678 }, (await account()).token)]);
    unk.push(['(extra keys)', await call('POST', '/promo/redeem', { code: 'DOGGO-IG-NOV', coins: 500 }, (await account()).token)]);
    const want = unk[4][1].text;
    ok(unk.every(([, x]) => x.status === 404 && x.text === want && x.json.error === 'unknown'), 'not started, ended, disabled, empty, unknown, too short, symbols, too long, not a string, extra keys: the same 404 unknown, byte for byte: ' + unk.filter(([, x]) => x.text !== want).map(([c, x]) => c + ' ' + x.status + ' ' + x.text).join(' | '));
    ok(n('select count(*) as n from promo_redemptions where user_id = ?', C.id) === 0, 'none of them recorded anything');
    DB.raw.prepare('update promo_codes set disabled = 0 where code = ?').run('OFFCODE');
    ok((await redeem('off-code', C)).status === 200, 'enabled again: it works');

    sec('5. unique codes: once in total, one code of a batch per account');
    const U = ['GIFT-AB2C-DE3F', 'GIFT-GH4J-KM5N', 'GIFT-PQ6R-ST7U'].map((s) => mk(s, { kind: 'unique', batch: 'GIFT', cap: 1, reward: { items: ['Party Hat'], coins: 100, treats: {} } }));
    ok((await redeem('GIFT-AB2C-DE3F', A)).status === 200, 'A redeems a unique code');
    r = await redeem('GIFT-AB2C-DE3F', B); ok(is(r, 409, 'gone'), 'B with the same code: 409 gone');
    r = await redeem('GIFT-GH4J-KM5N', A); ok(is(r, 409, 'used'), 'A with another code of the same batch: 409 used');
    ok(q('select used from promo_codes where code = ?', U[1]).used === 0, 'that code is still unused');
    ok((await redeem('gift gh4j km5n', B)).status === 200, 'so B can redeem it');
    ok(n("select count(*) as n from promo_redemptions where batch = 'GIFT'") === 2, 'two batch rows');

    sec('6. races: the last slot, the last unique code, a double tap');
    batchErrs.length = 0;
    mk('LAST-SLOT', { cap: 1 });
    const racers = []; for (let i = 0; i < 5; i++) racers.push(await account());
    let open = race(5);
    let res = await Promise.all(racers.map((x) => redeem('LAST-SLOT', x))); open();
    ok(res.filter((x) => x.status === 200).length === 1 && res.filter((x) => is(x, 409, 'gone')).length === 4, 'five accounts at once for one slot: one 200, four gone: ' + res.map((x) => x.status + ':' + (x.json && x.json.error || 'ok')).join(' '));
    ok(q('select used from promo_codes where code = ?', 'LASTSLOT').used === 1 && n('select count(*) as n from promo_redemptions where code = ?', 'LASTSLOT') === 1, 'used = 1 and one row');
    ok(batchErrs.some((m) => /CHECK/i.test(m)), 'the losers really raced to the insert and the CHECK (used <= cap) rolled them back: ' + batchErrs.slice(0, 2).join(' | '));
    open = race(5); res = await Promise.all(racers.map((x) => redeem('GIFT-PQ6R-ST7U', x))); open();
    ok(res.filter((x) => x.status === 200).length === 1 && n('select count(*) as n from promo_redemptions where code = ?', U[2]) === 1, 'five accounts at once for a unique code: one wins');
    batchErrs.length = 0;
    mk('TWO-TAPS');
    const D = await account();
    open = race(3); res = await Promise.all([redeem('TWO-TAPS', D), redeem('two taps', D), redeem('TWOTAPS', D)]); open();
    ok(res.filter((x) => x.status === 200).length === 1 && res.filter((x) => is(x, 409, 'used')).length === 2, 'one account, three taps at once: one 200, two used: ' + res.map((x) => x.status).join(' '));
    ok(n('select count(*) as n from promo_redemptions where code = ? and user_id = ?', 'TWOTAPS', D.id) === 1 && q('select used from promo_codes where code = ?', 'TWOTAPS').used === 1, 'one row, used = 1: the coins come once');
    ok(batchErrs.some((m) => /UNIQUE/i.test(m)), 'the unique index stopped the second tap: ' + batchErrs.slice(0, 2).join(' | '));

    sec('7. the coin ceiling and the reward kept clean');
    mk('BIG-COINS', { reward: { items: ['Red Bandana', 'Red Bandana', '<b>x</b>', 'y'.repeat(61), 'A', 'B', 'C', 'D', 'E', 'F'], coins: 5000, treats: { Pupcake: 99, 'Carrot Sticks': 3, '': 2, Bad: -1 } } });
    r = await redeem('BIG-COINS', A);
    ok(r.status === 200 && r.json.reward.coins === 500, 'a row that says 5,000 coins grants 500 (PROMO_COIN_MAX): ' + JSON.stringify(r.json && r.json.reward));
    ok(JSON.stringify(r.json.reward.items) === JSON.stringify(['Red Bandana', 'A', 'B', 'C', 'D', 'E']) && JSON.stringify(r.json.reward.treats) === JSON.stringify({ Pupcake: 10, 'Carrot Sticks': 3 }), 'duplicates, markup and over-long names dropped, at most 6 items, treats 1-10: ' + JSON.stringify(r.json.reward));
    ok(JSON.parse(q('select reward from promo_redemptions where code = ? and user_id = ?', 'BIGCOINS', A.id).reward).coins === 500, 'the record holds what was granted (500)');
    ok(/const PROMO_COIN_MAX = 500;/.test(fs.readFileSync(path.join(ROOT, 'cloudflare', 'worker.js'), 'utf8')), 'PROMO_COIN_MAX is 500');

    sec('8. GET /promo/mine');
    r = await call('GET', '/promo/mine', null, A.token);
    const mine = r.json && r.json.redemptions;
    ok(r.status === 200 && Array.isArray(mine) && mine.map((x) => x.code).join() === 'DOGGO-IG-NOV,CAP-TWO,GIFT-AB2C-DE3F,BIG-COINS', "A's redemptions, oldest first, as shown: " + (mine || []).map((x) => x.code).join());
    ok(mine.every((x) => x.key && x.at > 0 && x.reward && Array.isArray(x.reward.items)) && mine[3].reward.coins === 500 && mine[0].reward.treats.Pupcake === 2, 'each with its key, time and the reward as granted');
    DB.raw.prepare('update promo_codes set disabled = 1, reward = ? where code = ?').run(JSON.stringify({ coins: 9 }), 'DOGGOIGNOV');
    const again = (await call('GET', '/promo/mine', null, A.token)).json.redemptions;
    ok(again[0].code === 'DOGGO-IG-NOV' && again[0].reward.coins === 200, 'a code disabled (and its row changed) later: still listed, with what was granted then');
    DB.raw.prepare('delete from promo_codes where code = ?').run('CAPTWO');
    ok((await call('GET', '/promo/mine', null, A.token)).json.redemptions[1].code === 'CAPTWO', 'a code row deleted by hand: listed by its key');
    r = await call('GET', '/promo/mine', null, C.token);
    ok(r.json.redemptions.map((x) => x.code).join() === 'OFF-CODE', "C's list has only its own: " + r.text.slice(0, 120));

    sec('9. rate limits: 10 an hour per account, 30 per IP; misses count');
    const E = await account();
    const tries = []; for (let i = 0; i < 11; i++) tries.push(await redeem('MISS-' + i + 'XYZ', E));
    ok(tries.slice(0, 10).every((x) => is(x, 404, 'unknown')) && is(tries[10], 429, 'rate_limited'), 'ten misses, then 429 rate_limited: ' + tries.map((x) => x.status).join(' '));
    mk('LATE-CODE');
    r = await redeem('LATE-CODE', E); ok(is(r, 429, 'rate_limited') && n('select count(*) as n from promo_redemptions where user_id = ?', E.id) === 0, 'a good code is refused too while over the limit, nothing recorded');
    const ipTries = []; for (let i = 0; i < 31; i++) { const x = await account(); ipTries.push(await redeem('MISS-' + i + 'IP', x, '10.99.9.9')); }
    ok(ipTries.slice(0, 30).every((x) => x.status === 404) && is(ipTries[30], 429, 'rate_limited'), 'thirty misses from one IP (any accounts), then 429: ' + ipTries.slice(28).map((x) => x.status).join(' '));
    const F = await account(); r = await redeem('LATE-CODE', F); ok(r.status === 200, 'another account on another IP: fine');

    sec('10. a deleted account takes its redemptions along (tidy)');
    const before = n('select count(*) as n from promo_redemptions where user_id = ?', B.id);
    DB.raw.prepare('delete from users where id = ?').run(B.id);
    await call('GET', '/');
    ok(before > 0 && n('select count(*) as n from promo_redemptions where user_id = ?', B.id) === 0, 'tidy() deleted its rows (' + before + ' before)');
    ok(q('select used from promo_codes where code = ?', 'DOGGOIGNOV').used === 2, 'the counts stay (the cap counts every use)');

    sec('11. the schema and the deploy');
    const sch = fs.readFileSync(path.join(ROOT, 'cloudflare', 'schema.sql'), 'utf8');
    ok(/create table if not exists promo_codes/.test(sch) && /create table if not exists promo_redemptions/.test(sch) && /check \(cap is null or used <= cap\)/.test(sch) && /unique \(code, user_id\)/.test(sch), 'schema.sql: both tables, create if not exists, the CHECK and the unique pair');
    let dup = null; try { DB.raw.exec(sch); } catch (e) { dup = e; } ok(!dup, 'schema.sql runs again on a database that has them');

    sec('12. tools/promo.sh (DRY_RUN=1: its D1 requests run here on the local D1)');
    const cp = require('child_process');
    const cli = (...args) => { try { return { code: 0, out: cp.execFileSync('bash', [path.join(ROOT, 'tools', 'promo.sh'), ...args], { cwd: ROOT, env: Object.assign({}, process.env, { DRY_RUN: '1' }), stdio: ['ignore', 'pipe', 'pipe'] }).toString() }; } catch (e) { return { code: e.status, out: String(e.stdout || ''), err: String(e.stderr || '') }; } };
    const apply = (out) => out.split('\n').filter((l) => l.startsWith('{')).map((l) => { const b = JSON.parse(l); const st = DB.raw.prepare(b.sql); return /^\s*select/i.test(b.sql) ? st.all(...(b.params || [])) : st.run(...(b.params || [])); });
    const ITEMS = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'promo_items.json'), 'utf8'));
    const anItem = (ITEMS.items.find((x) => x.promo) || ITEMS.items.find((x) => x.kind === 'clothes')).n;
    let c1 = cli('create', 'CLI-SHARED', '--items', anItem, '--coins', '150', '--treats', 'Pupcake:2,Blueberry Bites', '--to', '2099-12-31', '--cap', '3', '--note', 'test');
    ok(c1.code === 0, 'create: a valid shared code (' + (c1.err || '') + ')');
    apply(c1.out);
    const row = q('select * from promo_codes where code = ?', 'CLISHARED');
    ok(row && row.shown === 'CLI-SHARED' && row.kind === 'shared' && row.cap === 3 && row.ends_at === Date.UTC(2099, 11, 31, 15, 0, 0) && JSON.parse(row.reward).treats['Blueberry Bites'] === 1, 'the row: shown, shared, cap 3, ends at the end of 31 Dec 2099 in Japan, treats counted: ' + JSON.stringify(row));
    const G2 = await account();
    r = await redeem('cli-shared', G2); ok(r.status === 200 && r.json.reward.coins === 150 && r.json.reward.items[0] === anItem, 'and the Worker redeems it: ' + r.text);
    c1 = cli('batch', 'clitest', '5', '--coins', '50', '--to', '2099-01-31');
    ok(c1.code === 0, 'batch: 5 unique codes');
    apply(c1.out);
    const codes = c1.out.split('\n').filter((l) => /^CLITEST-/.test(l));
    ok(codes.length === 5 && codes.every((c) => /^CLITEST-[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{4}$/.test(c)) && new Set(codes).size === 5, 'printed, readable (no 0 O 1 I L), all different: ' + codes.join(' '));
    ok(n("select count(*) as n from promo_codes where batch = 'CLITEST' and kind = 'unique' and cap = 1") === 5, 'five rows, unique, cap 1');
    r = await redeem(codes[0].toLowerCase(), G2); ok(r.status === 200, 'a batch code redeems');
    r = await redeem(codes[1], G2); ok(is(r, 409, 'used'), 'one per account per batch');
    const big = cli('batch', 'BIG', '90', '--coins', '10');
    ok(big.code === 0 && big.out.split('\n').filter((l) => l.startsWith('{')).length === 3 && big.out.split('\n').filter((l) => l.startsWith('{')).every((l) => JSON.parse(l).params.length <= 100), '90 codes go in 3 requests of at most 100 parameters (the D1 limit)');
    apply(big.out); ok(n("select count(*) as n from promo_codes where batch = 'BIG'") === 90, 'all 90 made');
    const bad = [
      [['create', 'TOO-RICH', '--coins', '501'], /ceiling/], [['create', 'NO-ITEM', '--items', 'Moon Boots'], /unknown item/], [['create', 'NO-TREAT', '--treats', 'Grapes:2'], /unknown treat/],
      [['create', 'BAD-TREAT', '--treats', 'Pupcake:11'], /1-10/], [['create', 'NOTHING']], [['create', 'X1', '--coins', '5'], /4-40/], [['create', 'BAD-DATE', '--coins', '5', '--to', '31/12/2026'], /YYYY-MM-DD/],
      [['create', 'OLD-DATE', '--coins', '5', '--to', '2020-01-01'], /past/], [['create', 'BACKWARDS', '--coins', '5', '--from', '2099-02-01', '--to', '2099-01-01'], /before/],
      [['create', 'BAD-CAP', '--coins', '5', '--cap', '0']], [['create', 'ODD-FLAG', '--coins', '5', '--colour', 'red'], /unknown option/], [['batch', 'P', '5', '--coins', '5']], [['batch', 'PFX', '0', '--coins', '5']],
      [['batch', 'PFX', '3', '--coins', '5', '--cap', '2'], /unknown option/], [['stats']], [['frobnicate']]
    ];
    const badOut = bad.map(([args, re]) => { const x = cli(...args); return { args: args.join(' '), ok: x.code === 2 && !x.out.includes('{"sql"') && (!re || re.test(x.err || '')), err: (x.err || '').split('\n')[0] }; });
    ok(badOut.every((x) => x.ok), 'refused with exit 2 and no request: coins over 500, unknown item or treat, a treat count over 10, no reward, a short code, bad, past or backwards dates, cap 0, unknown flags, a bad batch: ' + badOut.filter((x) => !x.ok).map((x) => x.args + ' -> ' + x.err).join(' | '));
    const sh = fs.readFileSync(path.join(ROOT, 'tools', 'promo.sh'), 'utf8');
    ok(/'params'/.test(sh) && !/\$\{?[0-9A-Z_]+\}?['"]?\s*\+?\s*['"]?\s*(where|values)/i.test(sh) && /docs\/marketing\/promo/.test(sh), 'arguments travel as D1 params; the CSV goes to docs/marketing/promo/');
    ok(/docs\/marketing\/promo\/\*\.csv/.test(fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8')), '.gitignore keeps the code lists out of git');
    for (const s2 of ['list', 'stats', 'disable', 'enable']) { const x = cli(s2, ...(s2 === 'list' ? [] : ['CLITEST'])); let okq = x.code === 0; try { apply(x.out); } catch (e) { okq = false; } ok(okq, s2 + ': its SQL runs'); }
    ok(n("select count(*) as n from promo_codes where batch = 'CLITEST' and disabled = 0") === 5, 'disable then enable leaves the batch on');
  } catch (e) { fails++; console.log('  CRASH', e && e.stack || e); }
  console.log(`${passes} passed, ${fails} failed (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  if (!fails) console.log('ALL OK');
  process.exit(fails ? 1 : 0);
})();
