// WORKER (v2.8.1, friends in v2.19): the Cloudflare login and cloud save API (cloudflare/worker.js) against a local D1 (v2.9.1: no Supabase any more).
//   NODE_PATH=$(npm root -g) node game/test_worker.js      (or: node game/run_tests.js worker)
// Runs the same checks twice when it can: in Miniflare (workerd + a real local D1, from the global wrangler install) and
// in-process in Node (cloudflare/d1_node.js over node:sqlite). Node-only: prints ALL OK when every check passes.
process.removeAllListeners('warning'); // node:sqlite is still "experimental" on Node 22
const path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.log('  FAIL', m); } };
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

const { fakeMail } = require('./cloud_mock');

/* ---------------- the checks (same for both backends) ---------------- */
async function checks(label, call, sql, mail) {
  console.log(`--- ${label}`);
  const save = (coins, extra) => Object.assign({ v: 1, coins, dogs: [{ id: 'dog1', name: 'Mochi' }], dog: { id: 'dog1', name: 'Mochi' } }, extra || {});

  let r = await call('GET', '/');
  ok(r.status === 200 && r.json.ok, 'GET / answers');

  // CORS: only the game's own origins
  for (const o of ['https://doodledoggo.app', 'https://www.doodledoggo.app', 'https://an9ou.github.io', 'https://html-classic.itch.zone', 'https://html.itch.zone', 'http://localhost:8765', 'http://127.0.0.1:8765']) {
    r = await call('OPTIONS', '/save', null, null, { Origin: o, 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'authorization,content-type' });
    ok(r.status === 204 && r.headers.get('access-control-allow-origin') === o && /Authorization/.test(r.headers.get('access-control-allow-headers')), `CORS preflight allowed for ${o}`);
  }
  for (const o of ['https://evil.example', 'https://doodledoggo.app.evil.example', 'null', 'https://claude.ai']) {
    r = await call('OPTIONS', '/save', null, null, { Origin: o });
    ok(r.status === 403 && !r.headers.get('access-control-allow-origin'), `CORS refused for ${o}`);
  }
  r = await call('POST', '/guest', {}, null, { Origin: 'https://doodledoggo.app' });
  ok(r.headers.get('access-control-allow-origin') === 'https://doodledoggo.app', 'a real request from the game carries the CORS header');

  // a guest and its save
  const g = (await call('POST', '/guest', {})).json;
  ok(g.token && g.token.length >= 40 && g.user.guest === true && !g.user.email, 'POST /guest makes a guest with a bearer token');
  r = await call('GET', '/me', null, g.token); ok(r.status === 200 && r.json.user.id === g.user.id && r.json.user.guest, 'GET /me knows the guest');
  ok((await call('GET', '/me')).status === 401 && (await call('GET', '/me', null, 'x'.repeat(43))).status === 401, 'no token or a wrong token: 401');
  r = await call('GET', '/save', null, g.token); ok(r.status === 200 && r.json.save === null, 'no save yet');
  const s1 = save(100), t1 = new Date(Date.now() - 5000).toISOString();
  r = await call('PUT', '/save', { data: s1, rev: 1, changed_at: t1, device: 'iPhone Safari' }, g.token); ok(r.status === 200 && r.json.rev === 1, 'PUT /save rev 1');
  r = await call('GET', '/save', null, g.token);
  ok(r.status === 200 && r.text.includes(JSON.stringify(s1)) && r.json.save.rev === 1 && r.json.save.device === 'iPhone Safari' && Date.parse(r.json.save.changed_at) === Date.parse(t1), 'GET /save returns the same JSON text, rev, device and changed_at');
  r = await call('GET', '/save?meta=1', null, g.token); ok(r.json.save.rev === 1 && !('data' in r.json.save), 'GET /save?meta=1 is rev and changed_at only');
  r = await call('PUT', '/save', { data: save(5), rev: 1, changed_at: t1 }, g.token);
  ok(r.status === 409 && r.json.error === 'stale' && r.json.rev === 1, 'a PUT with a rev the cloud already has is refused (409 stale)');
  ok((await call('GET', '/save', null, g.token)).json.save.data.coins === 100, 'the refused PUT changed nothing');
  ok((await call('PUT', '/save', { data: { v: 2 }, rev: 2, changed_at: t1 }, g.token)).status === 400, 'a save that is not v 1 is refused');
  ok((await call('PUT', '/save', { data: save(1, { big: 'x'.repeat(530000) }), rev: 2, changed_at: t1 }, g.token)).status === 413, 'a save of 512 KB or more is refused');
  ok((await call('PUT', '/save', { data: s1, rev: 2, changed_at: t1 })).status === 401, 'PUT /save needs a session');
  const gTime = (await call('POST', '/guest', {})).json, tOld = new Date(Date.now() - 10000).toISOString();
  ok((await call('PUT', '/save', { data: save(10), rev: 1, changed_at: tOld }, gTime.token)).status === 200, 'a fresh guest can store rev 1');
  r = await call('PUT', '/save', { data: save(11), rev: 2, changed_at: new Date(Date.parse(tOld) - 5000).toISOString() }, gTime.token);
  ok(r.status === 409 && r.json.error === 'stale' && r.json.rev === 1, 'a higher rev with an older changed_at is refused');
  ok((await call('GET', '/save', null, gTime.token)).json.save.data.coins === 10, 'the older put left the save that is already there');
  r = await call('PUT', '/save', { data: save(12), rev: 2, changed_at: new Date(Date.parse(tOld) + 1000).toISOString() }, gTime.token);
  ok(r.status === 200 && r.json.rev === 2 && (await call('GET', '/save', null, gTime.token)).json.save.data.coins === 12, 'a higher rev with a later changed_at is stored');
  r = await call('POST', '/register', 'not json', g.token); ok(r.status === 400, 'bad JSON: 400');

  // register: the guest becomes the account (same id, same save)
  r = await call('POST', '/register', { email: 'mochi@example.com', password: 'short' }, g.token); ok(r.status === 400 && r.json.error === 'weak_password', 'a password under 8 characters is refused');
  r = await call('POST', '/register', { email: 'not-an-email', password: 'pupper123' }, g.token); ok(r.status === 400 && r.json.error === 'invalid_email', 'a bad email is refused');
  r = await call('POST', '/register', { email: ' Mochi@Example.com ', password: 'pupper123' }, g.token);
  ok(r.status === 200 && r.json.upgraded === true && r.json.user.id === g.user.id && r.json.user.email === 'mochi@example.com' && !r.json.user.guest, 'register on a guest keeps the user id (email stored in lower case)');
  const a = r.json;
  ok((await call('GET', '/me', null, g.token)).status === 401, 'the guest token is replaced by a fresh one');
  ok((await call('GET', '/save', null, a.token)).json.save.data.coins === 100, 'the account keeps the guest save');
  r = await call('POST', '/register', { email: 'MOCHI@example.com', password: 'pupper999' }); ok(r.status === 409 && r.json.error === 'email_exists', 'an email that has an account is refused (any case)');

  // the stored secrets
  const u = await sql('select * from users where id = ?', a.user.id);
  ok(/^[0-9a-f]{64}$/.test(u.pw_hash) && /^[0-9a-f]{32}$/.test(u.pw_salt) && !JSON.stringify(u).includes('pupper123'), 'the password is a PBKDF2 hash with a 16-byte salt, never plain');
  ok(u.pw_hash === crypto.pbkdf2Sync('pupper123', Buffer.from(u.pw_salt, 'hex'), 100000, 32, 'sha256').toString('hex'), 'PBKDF2-SHA256 with 100k iterations');
  const sess = await sql('select * from sessions where user_id = ? order by created_at desc', a.user.id);
  ok(sess && sess.token_hash === sha(a.token) && !JSON.stringify(sess).includes(a.token), 'sessions store only the SHA-256 of the token');

  // login and logout
  r = await call('POST', '/login', { email: 'mochi@example.com', password: 'wrongpass1' }); ok(r.status === 401 && r.json.error === 'invalid_credentials', 'wrong password: invalid_credentials');
  r = await call('POST', '/login', { email: 'nobody@example.com', password: 'whatever1' }); ok(r.status === 401 && r.json.error === 'invalid_credentials', 'unknown email: invalid_credentials');
  ok(!(await sql('select * from users where email = ?', 'nobody@example.com')), 'a failed login makes no user');
  r = await call('POST', '/login', { email: 'Mochi@example.com', password: 'pupper123' }); ok(r.status === 200 && r.json.user.id === a.user.id && r.json.migrated === undefined, 'right password logs in');
  const d2 = r.json.token;
  ok((await call('GET', '/save', null, d2)).json.save.data.coins === 100, 'a second device reads the same save');
  r = await call('PUT', '/save', { data: save(200), rev: 2, changed_at: new Date().toISOString(), device: 'Pixel Chrome' }, d2); ok(r.json.rev === 2, 'device 2 pushes rev 2');
  ok((await call('GET', '/save', null, a.token)).json.save.data.coins === 200, 'device 1 pulls rev 2');
  r = await call('POST', '/password', { password: 'pupper456' }, a.token); ok(r.status === 200, 'change password');
  ok((await call('GET', '/me', null, d2)).status === 401 && (await call('GET', '/me', null, a.token)).status === 200, 'a password change logs out every other device; this one stays logged in');
  ok((await call('POST', '/login', { email: 'mochi@example.com', password: 'pupper123' })).status === 401 && (await call('POST', '/login', { email: 'mochi@example.com', password: 'pupper456' })).status === 200, 'the old password stops working, the new one works');
  ok((await call('POST', '/password', { password: 'pupper789' }, (await call('POST', '/guest', {})).json.token)).status === 403, 'a guest has no password to change');
  r = await call('POST', '/logout', {}, d2); ok(r.status === 200 && (await call('GET', '/me', null, d2)).status === 401, 'log out ends that session');
  ok((await call('GET', '/me', null, a.token)).status === 200, 'other devices stay logged in');

  // a fresh account while logged in to an account or a guest with fresh: a new user
  const g2 = (await call('POST', '/guest', {})).json;
  r = await call('POST', '/register', { email: 'second@example.com', password: 'biscuits9', fresh: true }, g2.token);
  ok(r.status === 200 && r.json.upgraded === false && r.json.user.id !== g2.user.id, 'register with fresh makes a new user, the guest stays');
  r = await call('POST', '/register', { email: 'third@example.com', password: 'biscuits9' }, a.token);
  ok(r.status === 200 && r.json.upgraded === false && r.json.user.id !== a.user.id, 'register while logged in to an account never renames it');
  ok((await call('GET', '/me', null, a.token)).json.user.email === 'mochi@example.com', 'the first account keeps its email');

  // backups: the newest 5
  for (let i = 1; i <= 7; i++) await call('POST', '/backups', { data: save(i), reason: 'older than your other device' }, a.token);
  r = await call('GET', '/backups', null, a.token);
  ok(r.json.backups.length === 5 && r.json.backups.map((b) => b.data.coins).join() === '7,6,5,4,3' && r.json.backups[0].reason === 'older than your other device' && r.json.backups[0].created_at, 'GET /backups: the newest 5, newest first, with reason and time');
  ok((await sql('select count(*) as n from save_backups where user_id = ?', a.user.id)).n === 5, 'older backups are trimmed in D1');
  ok((await call('GET', '/backups', null, g2.token)).json.backups.length === 0, 'backups are per player');

  // rate limits
  let codes = [];
  for (let i = 0; i < 11; i++) codes.push((await call('POST', '/login', { email: 'mochi@example.com', password: 'nope-nope-' + i }, null, { 'CF-Connecting-IP': '10.0.0.' + i })).status);
  ok(codes[0] === 401 && codes[codes.length - 1] === 429, `login is rate-limited per email (${codes.join(' ')})`);
  r = await call('POST', '/login', { email: 'mochi@example.com', password: 'pupper456' }, null, { 'CF-Connecting-IP': '10.0.1.1' }); ok(r.status === 429 && r.json.error === 'rate_limited', 'even the right password waits out the limit');
  codes = [];
  for (let i = 0; i < 31; i++) codes.push((await call('POST', '/login', { email: `x${i}@example.com`, password: 'nope-nope-1' }, null, { 'CF-Connecting-IP': '10.9.9.9' })).status);
  ok(codes[0] === 401 && codes[30] === 429, 'login is rate-limited per IP');
  ok((await call('POST', '/login', { email: 'second@example.com', password: 'biscuits9' }, null, { 'CF-Connecting-IP': '10.9.9.10' })).status === 200, 'other IPs and emails still log in');

  // v2.9.1: Supabase is gone. An old Supabase email is just an email nobody has: it can sign up, and nothing is carried over.
  r = await call('POST', '/login', { email: 'legacy@example.com', password: 'oldpass123' }); ok(r.status === 401 && r.json.error === 'invalid_credentials', 'an old Supabase email cannot log in (no account here): invalid_credentials');
  ok(!(await sql('select * from users where email = ?', 'legacy@example.com')), 'and no user is made for it');
  const gR = (await call('POST', '/guest', {})).json;
  r = await call('POST', '/register', { email: 'Legacy@example.com', password: 'newpass123' }, gR.token);
  ok(r.status === 200 && r.json.upgraded === true && r.json.user.email === 'legacy@example.com', 'an old Supabase email can sign up now (no more 409 from the legacy list)');
  ok((await call('POST', '/register', { email: 'legacy@example.com', password: 'other-pass-1' })).status === 409, 'and then it has one account');
  ok((await call('POST', '/login', { email: 'legacy@example.com', password: 'newpass123' })).status === 200, 'which logs in with the new password');
  ok(!(await sql("select name from sqlite_master where type = 'table' and name = 'legacy'")), 'the legacy table is gone');
  r = await call('POST', '/migrate', { access_token: 'sbat_bogus', refresh_token: 'sbrt_bogus' }); ok(r.status === 410 && r.json.error === 'gone', 'POST /migrate answers 410 gone');
  r = await call('POST', '/register', { email: 'carry2@example.com', password: 'carrypass2' }); const other = r.json;
  r = await call('POST', '/login', { email: 'carry2@example.com', password: 'zzzzzzzz9' }); ok(r.status === 401, 'a wrong password on a registered email is refused');
  ok((await call('GET', '/me', null, other.token)).json.user.id === other.user.id, 'that account is untouched');

  // Forgot password (v2.9.2): an emailed 6-digit code, typed in the game (no website link)
  const fu = (await call('POST', '/register', { email: 'forgetful@example.com', password: 'forgetful1' }, null, { 'CF-Connecting-IP': '10.6.6.5' })).json;
  const fd2 = (await call('POST', '/login', { email: 'forgetful@example.com', password: 'forgetful1' })).json; // a second device
  const rc = (email, code, password, ip) => call('POST', '/reset-code', { email, code, password }, null, ip ? { 'CF-Connecting-IP': ip } : undefined);
  const other6 = (c) => String((Number(c) + 1) % 1e6).padStart(6, '0'); // a wrong code, for sure
  let m0 = mail.mails.length;
  r = await call('POST', '/forgot', { email: 'nobody-here@example.com' });
  ok(r.status === 200 && r.json.ok && r.json.mail === true && mail.mails.length === m0, 'an unknown email: the same answer, no email');
  ok((await call('POST', '/forgot', { email: 'not-an-email' })).status === 400, 'a malformed email: 400');
  r = await call('POST', '/forgot', { email: 'Forgetful@example.com' }, null, { Origin: 'https://an9ou.github.io' });
  const fm = mail.mails[mail.mails.length - 1];
  ok(r.status === 200 && r.json.mail === true && mail.mails.length === m0 + 1 && fm.to[0] === 'forgetful@example.com' && /noreply@doodledoggo\.app/.test(fm.from), 'a known email gets one email from noreply@doodledoggo.app, same answer');
  ok(/^\d{6}$/.test(fm.code) && fm.html.includes(fm.code), 'the email carries a 6-digit code');
  ok(fm.subject === 'Your Doodle Doggo code' && fm.text.startsWith(`Your Doodle Doggo code is ${fm.code}. It works for 30 minutes. If you didn't ask for it, ignore this email.`), "the owner's wording: Your Doodle Doggo code is 123456. It works for 30 minutes...");
  ok(!/https?:\/\//.test(fm.text) && !/href=/.test(fm.html), 'no website link in the email');
  let row = await sql('select * from reset_codes where k = ?', sha('forgetful@example.com'));
  ok(row && row.code_hash === sha(row.salt + ':' + fm.code) && row.salt.length === 32 && !Object.values(row).includes(fm.code), 'only a salted SHA-256 of the code is stored, keyed by the email\'s SHA-256');
  ok(row.expires_at - row.created_at === 30 * 60 * 1000 && row.tries === 0, 'the code works for 30 minutes');
  ok((await rc('forgetful@example.com', fm.code, 'short')).json.error === 'weak_password', 'the new password needs 8 or more characters (same rule as Make an account)');
  ok((await rc('forgetful@example.com', '12345', 'remembered1')).json.error === 'wrong_code', 'not six digits: wrong_code');
  ok((await sql('select tries from reset_codes where k = ?', sha('forgetful@example.com'))).tries === 0, 'a short password or a code that is not 6 digits costs no try');
  r = await rc('forgetful@example.com', other6(fm.code), 'remembered1');
  ok(r.status === 400 && r.json.error === 'wrong_code' && r.json.left === 4, 'a wrong code: wrong_code, 4 tries left');
  r = await rc(' Forgetful@Example.com ', ' ' + fm.code.slice(0, 3) + ' ' + fm.code.slice(3), 'remembered1');
  ok(r.status === 200 && r.json.user.id === fu.user.id && r.json.token && r.json.user.email === 'forgetful@example.com' && !r.json.user.guest, 'the right code sets the new password and logs in (spaces and capitals are fine)');
  ok((await call('GET', '/me', null, fu.token)).status === 401 && (await call('GET', '/me', null, fd2.token)).status === 401 && (await call('GET', '/me', null, r.json.token)).status === 200, 'a reset logs every other device out, this one stays in');
  ok((await call('POST', '/login', { email: 'forgetful@example.com', password: 'forgetful1' })).status === 401 && (await call('POST', '/login', { email: 'forgetful@example.com', password: 'remembered1' })).status === 200, 'the old password stops working, the new one works');
  r = await rc('forgetful@example.com', fm.code, 'again-again1'); ok(r.status === 400 && r.json.error === 'expired', 'a code works only once');
  // 5 wrong tries kill the code
  await call('POST', '/forgot', { email: 'forgetful@example.com' }); const fk = mail.mails[mail.mails.length - 1];
  const tries = [];
  for (let i = 0; i < 5; i++) { const x = (await rc('forgetful@example.com', other6(fk.code), 'killed-code1')).json; tries.push(x.error + ':' + x.left); }
  ok(tries.join(' ') === 'wrong_code:4 wrong_code:3 wrong_code:2 wrong_code:1 too_many_tries:0', 'wrong tries count down, the 5th says too_many_tries ' + tries.join(' '));
  r = await rc('forgetful@example.com', fk.code, 'killed-code1');
  ok(r.status === 400 && r.json.error === 'too_many_tries', 'after 5 wrong tries even the right code is dead');
  ok((await call('POST', '/login', { email: 'forgetful@example.com', password: 'remembered1' })).status === 200, 'and the password did not change');
  await call('POST', '/forgot', { email: 'forgetful@example.com' }); const fk2 = mail.mails[mail.mails.length - 1];
  ok((await rc('forgetful@example.com', fk2.code, 'fresh-code-1')).status === 200, 'a new code works again after a dead one');
  // expiry and replacement
  const ip2 = { 'CF-Connecting-IP': '10.6.6.6' };
  await call('POST', '/register', { email: 'forgetful2@example.com', password: 'forgetful2' }, null, ip2); // "make an account" allows 10 an hour per IP
  await call('POST', '/forgot', { email: 'forgetful2@example.com' }, null, ip2); const f1 = mail.mails[mail.mails.length - 1];
  await sql('update reset_codes set expires_at = ? where k = ?', Date.now() - 1, sha('forgetful2@example.com'), true);
  ok((await rc('forgetful2@example.com', f1.code, 'late-late-1')).json.error === 'expired', 'a code older than 30 minutes: expired');
  await call('POST', '/forgot', { email: 'forgetful2@example.com' }, null, ip2); const f2 = mail.mails[mail.mails.length - 1];
  await call('POST', '/forgot', { email: 'forgetful2@example.com' }, null, ip2); const f3 = mail.mails[mail.mails.length - 1];
  ok((await sql('select count(*) as n from reset_codes where k = ?', sha('forgetful2@example.com'))).n === 1, 'one code row per email');
  ok(f2.code === f3.code || (await rc('forgetful2@example.com', f2.code, 'older-code-1')).json.error === 'wrong_code', 'a new code replaces the old one');
  ok((await rc('forgetful2@example.com', f3.code, 'newest-code1')).status === 200, 'only the newest code works');
  // per-email limit on /forgot (quiet), per-IP limit (429)
  const ip3 = { 'CF-Connecting-IP': '10.6.6.7' };
  await call('POST', '/register', { email: 'forgetful3@example.com', password: 'forgetful3' }, null, ip3);
  m0 = mail.mails.length; for (let i = 0; i < 5; i++) await call('POST', '/forgot', { email: 'forgetful3@example.com' }, null, ip3);
  const last3 = mail.mails[mail.mails.length - 1];
  r = await call('POST', '/forgot', { email: 'forgetful3@example.com' }, null, ip3);
  ok(mail.mails.length === m0 + 5 && r.status === 200 && r.json.mail === true, 'at most 5 codes an hour per email (the 6th: the same answer, no email)');
  ok((await rc('forgetful3@example.com', last3.code, 'still-works1')).status === 200, 'and the quiet 6th left the last code working');
  codes = [];
  for (let i = 0; i < 11; i++) codes.push((await call('POST', '/forgot', { email: `ip${i}@example.com` }, null, { 'CF-Connecting-IP': '10.7.7.7' })).status);
  ok(codes[0] === 200 && codes[10] === 429, 'Forgot password is rate-limited per IP');
  codes = [];
  for (let i = 0; i < 31; i++) codes.push((await rc(`guess${i}@example.com`, '123456', 'guessing-1', '10.5.5.5')).status);
  ok(codes[0] === 400 && codes[29] === 400 && codes[30] === 429, 'typing codes is rate-limited per IP (30 in 10 minutes)');
  // no account leak: an email with no account answers exactly like one with an account
  m0 = mail.mails.length; r = await call('POST', '/forgot', { email: 'NeverHadOne@example.com' });
  ok(r.status === 200 && r.json.mail === true && mail.mails.length === m0, 'an email with no account gets the same answer and no mail');
  const a1 = await rc('neverhadone@example.com', '000000', 'whatever-1');
  await call('POST', '/forgot', { email: 'forgetful@example.com' });
  const b2 = await rc('forgetful@example.com', mail.mails[mail.mails.length - 1].code === '000000' ? '000001' : '000000', 'whatever-1');
  ok(a1.status === b2.status && a1.text === b2.text && a1.json.error === 'wrong_code' && a1.json.left === 4, 'a wrong code: the same answer with or without an account ' + a1.text + ' / ' + b2.text);
  for (let i = 0; i < 4; i++) await rc('neverhadone@example.com', '000000', 'whatever-1');
  ok((await rc('neverhadone@example.com', '000000', 'whatever-1')).json.error === 'too_many_tries', 'and 5 wrong tries end the same way');
  const n1 = await rc('never-asked@example.com', '123456', 'whatever-1'), n2 = await rc('carry2@example.com', '123456', 'whatever-1');
  ok(n1.status === 400 && n1.text === n2.text && n1.json.error === 'expired', 'no code asked for: expired, with or without an account');
  // the v2.8.2 links already sent keep working until they run out (no new ones are made)
  const old = 'L'.repeat(43);
  await sql('insert into resets (token_hash, user_id, created_at, expires_at) values (?, ?, ?, ?)', sha(old), fu.user.id, Date.now(), Date.now() + 6e5, true);
  ok((await call('POST', '/reset', { token: old, password: 'from-a-link1' })).status === 200 && (await call('POST', '/login', { email: 'forgetful@example.com', password: 'from-a-link1' })).status === 200, 'an old emailed link still sets the password');
  ok((await call('POST', '/reset', { token: old, password: 'again-again1' })).json.error === 'expired', 'an old link works only once');
  ok((await call('POST', '/reset', { token: 'x'.repeat(43), password: 'whatever-1' })).json.error === 'expired' && (await call('POST', '/reset', { password: 'whatever-1' })).json.error === 'expired', 'a made-up or missing token: expired');
  ok((await call('POST', '/reset', { sb_token: 'sbat_bogus', password: 'whatever-1' })).json.error === 'expired', 'a Supabase link token is no longer accepted: expired');

  // Dog Cards (v2.11, V211.md section 5.5): only integers and fixed tokens, opt-in, email accounts only
  {
    const ipC = (n) => ({ 'CF-Connecting-IP': '10.11.' + n + '.1' });
    const ca = (await call('POST', '/register', { email: 'cards-a@example.com', password: 'cardspass1' }, null, ipC(1))).json;
    const cb = (await call('POST', '/register', { email: 'cards-b@example.com', password: 'cardspass2' }, null, ipC(1))).json;
    const cg = (await call('POST', '/guest', {}, null, ipC(2))).json;
    const dog = (o) => Object.assign({ b: 0, c: { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'] }, o: 0, a: 'adult', s: 'f', sp: 0, n: 0 }, o || {});
    const card = (o) => Object.assign({ name: [3, 7], dogs: [dog(), dog({ b: 20, o: -1, a: 'pup', s: 'm', sp: 1, n: 100, c: null })] }, o || {});
    ok((await call('PUT', '/card', card())).status === 401, 'PUT /card needs a session');
    r = await call('PUT', '/card', card(), cg.token); ok(r.status === 403 && r.json.error === 'no_account', 'a guest cannot publish a card (403 no_account)');
    ok(!(await sql('select * from cards where user_id = ?', cg.user.id)), 'and nothing is stored for the guest');
    const junk = [
      ['an extra field', card({ note: 'hi' })], ['a name as text', card({ name: ['Sunny', 'Biscuit'] })], ['a name index as a string', card({ name: ['3', 7] })],
      ['a name word past the list', card({ name: [40, 0] })], ['a negative index', card({ name: [-1, 0] })], ['a fraction', card({ name: [1.5, 0] })], ['one name word', card({ name: [1] })],
      ['no dogs', card({ dogs: [] })], ['5 dogs', card({ dogs: [dog(), dog(), dog(), dog(), dog()] })], ['dogs as an object', card({ dogs: { 0: dog() } })],
      ['a dog name as text', card({ dogs: [dog({ n: 'Mochi' })] })], ['a dog name index past the list', card({ dogs: [dog({ n: 120 })] })],
      ['a breed past the list', card({ dogs: [dog({ b: 40 })] })], ['a breed as text', card({ dogs: [dog({ b: 'shiba' })] })],
      ['an outfit past the list', card({ dogs: [dog({ o: 57 })] })], ['an outfit as text', card({ dogs: [dog({ o: 'Red Bandana' })] })], ['an outfit under -1', card({ dogs: [dog({ o: -2 })] })],
      ['an age that is not pup or adult', card({ dogs: [dog({ a: 'old' })] })], ['a sex that is not m or f', card({ dogs: [dog({ s: 'x' })] })], ['sparkle 2', card({ dogs: [dog({ sp: 2 })] })],
      ['a dog with an extra key', card({ dogs: [Object.assign(dog(), { name: 'Mochi' })] })], ['a dog missing a key', card({ dogs: [(() => { const d = dog(); delete d.sp; return d; })()] })],
      ['a coat allele not in the set', card({ dogs: [dog({ c: { B: ['B', 'x'] } })] })], ['a coat word', card({ dogs: [dog({ c: 'red' })] })], ['a coat with an unknown locus', card({ dogs: [dog({ c: { K: ['K', 'k'] } })] })], ['a tan-point allele not in the set', card({ dogs: [dog({ c: { A: ['at', 'ay'] } })] })], ['a red-intensity allele not in the set', card({ dogs: [dog({ c: { I: ['I', 'x'] } })] })], ['a red-intensity locus with one allele', card({ dogs: [dog({ c: { I: ['I'] } })] })],
      ['a coat locus with 3 alleles', card({ dogs: [dog({ c: { B: ['B', 'b', 'b'] } })] })], ['a double merle', card({ dogs: [dog({ c: { M: ['M', 'M'] } })] })], ['an empty coat', card({ dogs: [dog({ c: {} })] })],
      ['a coat locus named constructor', card({ dogs: [dog({ c: { constructor: ['B', 'b'] } })] })], ['a coat with __proto__', card({ dogs: [dog({ c: JSON.parse('{"__proto__":["B","b"]}') })] })],
      ['a coat colour that is not #rrggbb', card({ dogs: [dog({ c: '#12345g' })] })],
      ['eyes past the list (v2.23)', card({ dogs: [dog({ e: 4 })] })], ['eyes as text', card({ dogs: [dog({ e: 'blue' })] })], ['eyes negative', card({ dogs: [dog({ e: -1 })] })],
      ['a pattern seed as text', card({ dogs: [dog({ p: '12' })] })], ['a pattern seed past 32 bits', card({ dogs: [dog({ p: 4294967296 })] })], ['a pattern seed fraction', card({ dogs: [dog({ p: 1.5 })] })], ['a pattern seed negative', card({ dogs: [dog({ p: -1 })] })],
      ['an oversized card', card({ dogs: [dog({ c: '#' + 'a'.repeat(3000) })] })], ['an array body', [card()]]
    ];
    const bad = [];
    for (const [label, b] of junk) { const x = await call('PUT', '/card', b, ca.token); if (!(x.status === 400 && x.json && (x.json.error === 'bad_card' || x.json.error === 'bad_json'))) bad.push(label + ' ' + x.status); }
    ok(!bad.length, `every junk card is refused with 400 bad_card (${junk.length} kinds) ${bad.join(', ')}`);
    ok(!(await sql('select * from cards where user_id = ?', ca.user.id)), 'no junk card was stored');
    r = await call('PUT', '/card', card({ dogs: [dog(), dog({ b: 20, o: -1, a: 'pup', s: 'm', sp: 1, n: 100, c: null }), dog({ c: '#AABBCC' }), dog({ b: 39, o: 49, n: 119, c: { B: ['B', 'b'], E: ['E', 'E'], A: ['a', 'a'] } })] }), ca.token); // v2.12: the last breed, outfit and dog name are in the lists (v2.21: 40 breeds, 120 names)
    const mine = r.json;
    ok(r.status === 200 && /^[A-Za-z0-9_-]{22}$/.test(mine.id) && mine.name.join() === '3,7' && mine.dogs.length === 4 && mine.paws === 0, 'an email account publishes a card: a random card id, the name, the dogs, 0 paws');
    ok(mine.dogs[1].c === null && mine.dogs[2].c === '#aabbcc' && JSON.stringify(mine.dogs[0]) === JSON.stringify(dog()) && mine.dogs[1].b === 20 && mine.dogs[1].n === 100 && mine.dogs[3].b === 39 && mine.dogs[3].o === 49 && mine.dogs[3].n === 119 && JSON.stringify(mine.dogs[3].c) === '{"B":["B","b"],"E":["E","E"],"A":["a","a"]}', 'the dogs come back in the Worker\'s own shape (coat alleles, null or #rrggbb)');
    { // v2.23: the optional eyes (e, 0-3) and coat-pattern seed (p, 32 bits) come back as sent; a dog without them comes back without them
      const r2 = await call('PUT', '/card', card({ dogs: [dog({ e: 3, p: 4294967295 }), dog({ e: 0 }), dog({ p: 0 }), dog()] }), ca.token), ds = r2.json && r2.json.dogs;
      ok(r2.status === 200 && ds && ds[0].e === 3 && ds[0].p === 4294967295 && ds[1].e === 0 && !('p' in ds[1]) && ds[2].p === 0 && !('e' in ds[2]) && JSON.stringify(ds[3]) === JSON.stringify(dog()), 'v2.23: a dog may carry its eyes (e) and pattern seed (p); a dog without them is as before: ' + JSON.stringify(ds && ds.slice(0, 3)));
      const rw = await sql('select * from cards where user_id = ?', ca.user.id), kk = JSON.parse(rw.dogs).map((d) => Object.keys(d).join());
      ok(kk.join(' ') === 'b,c,o,a,s,sp,n,e,p b,c,o,a,s,sp,n,e b,c,o,a,s,sp,n,p b,c,o,a,s,sp,n', 'D1 keeps e and p only when sent: ' + kk.join(' '));
      // the red-intensity locus I (fox red Lab, dark golden): optional in the coat, comes back as sent; a coat without it is as before
      const r3 = await call('PUT', '/card', card({ dogs: [dog({ b: 25, c: { B: ['B', 'b'], E: ['e', 'e'], I: ['I', 'I'] } }), dog({ b: 2, c: { E: ['e', 'e'], I: ['I', 'i'] } }), dog({ b: 11, c: { B: ['B', 'b'], A: ['at', 'at'] } }), dog()] }), ca.token), d3 = r3.json && r3.json.dogs;
      ok(r3.status === 200 && d3 && JSON.stringify(d3[0].c) === '{"B":["B","b"],"E":["e","e"],"I":["I","I"]}' && JSON.stringify(d3[1].c) === '{"E":["e","e"],"I":["I","i"]}' && JSON.stringify(d3[2].c) === '{"B":["B","b"],"A":["at","at"]}' && JSON.stringify(d3[3]) === JSON.stringify(dog()), 'a coat may carry the red-intensity locus I (a fox red Lab, a dark golden) and the collie tan points A; one without is as before: ' + JSON.stringify(d3 && d3.map((d) => d.c)));
      r = await call('PUT', '/card', card({ dogs: [dog(), dog({ b: 20, o: -1, a: 'pup', s: 'm', sp: 1, n: 100, c: null }), dog({ c: '#AABBCC' }), dog({ b: 39, o: 49, n: 119, c: { B: ['B', 'b'], E: ['E', 'E'], A: ['a', 'a'] } })] }), ca.token); // back to the card the checks below expect
    }
    ok(mine.id !== ca.user.id && !r.text.includes(ca.user.id) && !r.text.includes('cards-a'), 'the card id is not the user id, and neither the user id nor the email is in the answer');
    const row = await sql('select * from cards where user_id = ?', ca.user.id);
    ok(row && !/[a-z]{3,}@/.test(row.dogs) && JSON.parse(row.dogs).every((d) => Object.keys(d).join() === 'b,c,o,a,s,sp,n'), 'D1 keeps only the checked fields');
    r = await call('GET', '/card', null, ca.token); ok(r.status === 200 && r.json.id === mine.id && r.json.paws === 0 && r.json.at > 0, 'GET /card: my card');
    ok((await call('GET', '/card', null, cb.token)).json === null, 'GET /card: null with no card');
    r = await call('PUT', '/card', card({ name: [0, 39] }), ca.token); ok(r.json.id === mine.id && r.json.name.join() === '0,39' && r.json.dogs.length === 2, 'PUT /card again replaces the card and keeps its id');
    ok((await sql('select count(*) as n from cards where user_id = ?', ca.user.id)).n === 1, 'one card per account');
    // visiting: anyone, never the caller's own, only fresh cards, no ids or emails
    const cbCard = (await call('PUT', '/card', card({ name: [1, 1] }), cb.token)).json;
    r = await call('GET', '/cards/visit?n=4', null, null, ipC(3));
    ok(r.status === 200 && Array.isArray(r.json) && r.json.some((x) => x.id === mine.id) && r.json.some((x) => x.id === cbCard.id), 'GET /cards/visit needs no session and returns cards');
    ok(r.json.every((x) => Object.keys(x).join() === 'id,name,dogs,paws') && !r.text.includes(ca.user.id) && !r.text.includes(cb.user.id) && !r.text.includes('@'), 'visit cards carry only id, name, dogs, paws: no user id, no email');
    r = await call('GET', '/cards/visit?n=4', null, ca.token, ipC(3)); ok(r.json.length >= 1 && !r.json.some((x) => x.id === mine.id), 'never the caller\'s own card');
    r = await call('GET', '/cards/visit?n=4&not=' + cbCard.id + ',junk!,' + 'x'.repeat(300), null, ca.token, ipC(3)); ok(!r.json.some((x) => x.id === cbCard.id || x.id === mine.id), 'not= leaves out hidden cards (junk ids are ignored)');
    for (let i = 0; i < 5; i++) await call('PUT', '/card', card(), (await call('POST', '/register', { email: `cards-x${i}@example.com`, password: 'cardspass9' }, null, ipC(4))).json.token);
    r = await call('GET', '/cards/visit?n=99', null, null, ipC(3)); ok(r.json.length === 4, 'at most 4 cards a visit');
    r = await call('GET', '/cards/visit', null, null, ipC(3)); ok(r.json.length === 2, 'n defaults to 2');
    await sql('update cards set updated_at = ? where id = ?', Date.now() - 31 * 864e5, cbCard.id, true);
    let seen = false; for (let i = 0; i < 6 && !seen; i++) seen = (await call('GET', '/cards/visit?n=4', null, null, ipC(5))).json.some((x) => x.id === cbCard.id);
    ok(!seen, 'a card not updated for 30 days does not visit');
    await call('PUT', '/card', card({ name: [1, 1] }), cb.token);
    const codesV = []; for (let i = 0; i < 121; i++) codesV.push((await call('GET', '/cards/visit', null, null, ipC(6))).status);
    ok(codesV[0] === 200 && codesV[119] === 200 && codesV[120] === 429, 'visits are rate-limited per IP (120 an hour)');
    // paws
    ok((await call('POST', '/paw', { id: mine.id })).status === 401, 'POST /paw needs a session');
    r = await call('POST', '/paw', { id: mine.id }, cg.token, ipC(20)); ok(r.status === 200 && r.json.paws === 1 && r.json.given === true, 'a guest gives a paw');
    const jst = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
    ok((await sql('select day from paws where from_id = ? and card_id = ?', cg.user.id, mine.id)).day === jst, 'the paw counts on the Japan day (the game\'s jstISO)');
    r = await call('POST', '/paw', { id: mine.id }, cg.token, ipC(21)); ok(r.status === 200 && r.json.paws === 1 && r.json.given === false, 'a second paw the same day counts nothing');
    r = await call('POST', '/paw', { id: mine.id }, cb.token, ipC(22)); ok(r.json.paws === 2 && r.json.given, 'another account gives one more');
    r = await call('POST', '/paw', { id: mine.id }, ca.token, ipC(23)); ok(r.status === 400 && r.json.error === 'own_card', 'never a paw to your own card');
    await sql("update paws set day = '2000-01-01' where from_id = ? and card_id = ?", cg.user.id, mine.id, true);
    r = await call('POST', '/paw', { id: mine.id }, cg.token, ipC(24)); ok(r.json.paws === 3 && r.json.given, 'a new day, a new paw');
    // many guests on one IP: at most 3 paws a day to one card, then quietly nothing
    const farm = []; for (let i = 0; i < 5; i++) { const gx = (await call('POST', '/guest', {}, null, ipC(30 + i))).json; farm.push((await call('POST', '/paw', { id: mine.id }, gx.token, ipC(25))).json.given); }
    ok(farm.join() === 'true,true,true,false,false', 'one IP gives one card at most 3 paws a day (' + farm.join() + ')');
    ok((await call('GET', '/card', null, ca.token)).json.paws === 6, 'and only those count');
    ok((await call('POST', '/paw', { id: 'A'.repeat(22) }, cg.token)).json.error === 'no_card' && (await call('POST', '/paw', { id: 'nope' }, cg.token)).json.error === 'bad_card' && (await call('POST', '/paw', { id: mine.id, x: 1 }, cg.token)).json.error === 'bad_card', 'an unknown card: no_card, a bad id or extra fields: bad_card');
    r = await call('GET', '/card', null, ca.token); ok(r.json.paws === 6, 'the owner sees the paws');
    const cg2 = (await call('POST', '/guest', {}, null, ipC(8))).json;
    const codesP = []; for (let i = 0; i < 101; i++) codesP.push((await call('POST', '/paw', { id: cbCard.id }, cg2.token, ipC(40))).status);
    ok(codesP[0] === 200 && codesP[99] === 200 && codesP[100] === 429, 'paws are rate-limited per account (100 an hour)');
    const codesU = []; for (let i = 0; i < 16; i++) codesU.push((await call('PUT', '/card', card(), ca.token)).status); // 5 PUTs above (v2.23 added two for e and p, the tan-points branch one for A and I): the 21st is refused
    ok(codesU[14] === 200 && codesU[15] === 429, 'publishing is rate-limited (20 an hour)');
    // stop sharing: the card and its paws go
    r = await call('DELETE', '/card', null, cb.token); ok(r.status === 200 && r.json.ok, 'DELETE /card');
    ok(!(await sql('select * from cards where id = ?', cbCard.id)) && !(await sql('select * from paws where card_id = ?', cbCard.id)), 'the card and its paws are deleted');
    ok((await call('GET', '/card', null, cb.token)).json === null && (await call('POST', '/paw', { id: cbCard.id }, cg.token)).json.error === 'no_card', 'it no longer exists for anyone');
    r = await call('OPTIONS', '/card', null, null, { Origin: 'https://doodledoggo.app', 'Access-Control-Request-Method': 'DELETE' }); ok(/DELETE/.test(r.headers.get('access-control-allow-methods')), 'CORS allows DELETE');
    // deleting the account deletes its card and its paws
    await sql('delete from users where id = ?', ca.user.id, true);
    r = await call('GET', '/cards/visit?n=4', null, null, ipC(7)); ok(!r.json.some((x) => x.id === mine.id), 'a deleted account\'s card never visits again');
    ok((await call('POST', '/paw', { id: mine.id }, cg.token)).json.error === 'no_card', 'and takes no paws');
    ok(!(await sql('select * from cards where id = ?', mine.id)) && !(await sql('select * from paws where card_id = ?', mine.id)), 'tidy deletes the card and its paws');
  }
  ok((await call('GET', '/nope')).status === 404, 'unknown paths: 404');

  // Friends (v2.19, V219.md sections 1, 2 and 7). Every answer below is also checked as raw JSON.
  {
    const fs = require('fs');
    const schemaTxt = fs.readFileSync(path.join(ROOT, 'cloudflare', 'schema.sql'), 'utf8');
    const workerSrc = fs.readFileSync(path.join(ROOT, 'cloudflare', 'worker.js'), 'utf8');
    ok(workerSrc.includes('const FR_LIM = { notes: 12, gifts: 47, decor: 35, houses: 15 }'), 'FR_LIM is notes 12, gifts 47, decor 35, houses 15 (v2.24: + the Golden Paw Cottage; v2.26: + the four yard toys), next to the other limits');
    ok(workerSrc.includes('crypto.getRandomValues(b)'), 'friend codes are drawn with crypto.getRandomValues');
    for (const t of ['friend_ids', 'friends', 'friend_blocks', 'yards', 'friend_events']) {
      ok(new RegExp('create table if not exists ' + t + '\\b', 'i').test(schemaTxt), `schema creates ${t} if it is missing`);
    }
    ok(/create unique index if not exists friend_events_pair/i.test(schemaTxt) && /where kind != 'gift'/i.test(schemaTxt), 'pet, note and walk are unique per from, to, kind and day');
    ok(/create unique index if not exists friend_events_gift/i.test(schemaTxt) && /where kind = 'gift'/i.test(schemaTxt), 'a gift is unique per sender per day');
    ok(/create index if not exists friend_events_inbox[\s\S]*\(to_id, claimed_at\)/i.test(schemaTxt), 'the inbox index is (to_id, claimed_at)');
    for (const name of ['friend_events_pair', 'friend_events_gift', 'friend_events_inbox', 'friend_events_age']) {
      ok(!!(await sql("select name from sqlite_master where type = 'index' and name = ?", name)), name + ' is in the database');
    }
    const insEv = (from, to, kind, day, at) => sql(
      'insert into friend_events (to_id, from_id, kind, data, day, created_at) values (?, ?, ?, ?, ?, ?)',
      to, from, kind, '{}', day, at || Date.now(), true);
    await insEv('fr-sql-a', 'fr-sql-b', 'pet', '2026-11-01');
    await insEv('fr-sql-a', 'fr-sql-b', 'note', '2026-11-01');
    await insEv('fr-sql-a', 'fr-sql-c', 'pet', '2026-11-01');
    let threw = false; try { await insEv('fr-sql-a', 'fr-sql-b', 'pet', '2026-11-01'); } catch (e) { threw = /unique/i.test(String(e && (e.message || e))); }
    ok(threw, 'a second pet to the same friend on the same Japan day is refused by the table');
    await insEv('fr-sql-a', 'fr-sql-b', 'gift', '2026-11-01');
    threw = false; try { await insEv('fr-sql-a', 'fr-sql-c', 'gift', '2026-11-01'); } catch (e) { threw = /unique/i.test(String(e && (e.message || e))); }
    ok(threw, 'a second gift on the same Japan day is refused even for a different friend');
    await insEv('fr-sql-a', 'fr-sql-c', 'gift', '2026-11-02');

    const ids = [], emails = [], hit = new Set();
    const leakOf = (text) => {
      if (!text) return '';
      if (/"user_id"/.test(text) || /"email"/.test(text)) return 'key';
      if (/"created_at"|"updated_at"|"code_at"|"seen_at"|"claimed_at"/.test(text)) return 'time field';
      if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text)) return 'timestamp';
      for (const id of ids) if (id && text.includes(id)) return 'user id';
      for (const em of emails) if (em && text.toLowerCase().includes(String(em).toLowerCase())) return 'email';
      return '';
    };
    const seenOk = (o) => {
      if (Array.isArray(o)) return o.every(seenOk);
      if (o && typeof o === 'object') {
        if ('seen' in o && o.seen !== 'today' && o.seen !== 'week' && o.seen !== 'older') return false;
        return Object.keys(o).every((k) => seenOk(o[k]));
      }
      return true;
    };
    const frCall = async (method, p, body, token, headers) => {
      hit.add(method + ' ' + p.split('?')[0]);
      const res = await call(method, p, body, token, headers);
      const leak = leakOf(res.text || ''), seenBad = !!(res.json && !seenOk(res.json));
      ok(!leak && !seenBad, `raw JSON ${method} ${p.split('?')[0]} has no user id, email or exact timestamp${leak || seenBad ? ' (' + (leak || 'seen') + ') ' + String(res.text).slice(0, 180) : ''}`);
      ok(!res.json || res.json.error !== 'blocked', `${method} ${p.split('?')[0]} never answers blocked`);
      return res;
    };
    const nOf = async (q, ...a) => { const row = await sql(q, ...a); return row ? row.n : 0; };
    const bump = async (key, n) => {
      ok(!!(await sql('select k from rate where k = ?', key)), 'rate row ' + key);
      await sql('update rate set n = ?, reset_at = ? where k = ?', n, Date.now() + 3 * 864e5, key, true);
    };
    let seq = 0;
    const user = async (ip) => {
      seq++;
      const g = (await call('POST', '/guest', {}, null, { 'CF-Connecting-IP': ip || ('10.19.1.' + seq) })).json;
      ok(!!(g && g.token && g.user && g.user.id), 'a guest for a friends check');
      ids.push(g.user.id);
      return g;
    };
    const CODE = /^DOG-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/;
    const dog = (o) => Object.assign({ b: 0, c: { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'] }, o: 0, a: 'adult', s: 'f', sp: 0, n: 0 }, o || {});
    const yard = (o) => Object.assign({ v: 1, name: [1, 2], house: 0, season: 'spring', dogs: [dog()], decor: [{ i: 0, x: 10, y: 20 }] }, o || {});
    const profile = async (g, name) => {
      const want = name || [0, 1];
      const res = await frCall('POST', '/friends/me', { name: want }, g.token);
      ok(res.status === 200 && CODE.test(res.json.code) && /^[A-Za-z0-9_-]{22}$/.test(res.json.fid) && res.json.name.join() === want.join(), 'POST /friends/me returns a DOG- code and a 22-character fid');
      return res.json;
    };
    const sent0 = JSON.stringify({ pet: false, note: false, gift: false, walk: false });

    const routes = [
      ['GET', '/friends', null], ['POST', '/friends/me', { name: [0, 1] }], ['POST', '/friends/code/new', {}],
      ['POST', '/friends/add', { code: 'DOG-23456' }], ['POST', '/friends/remove', { fid: 'A'.repeat(22) }],
      ['POST', '/friends/block', { fid: 'A'.repeat(22) }], ['PUT', '/friends/yard', { yard: yard() }],
      ['GET', '/friends/yard?fid=' + 'A'.repeat(22), null], ['POST', '/friends/send', { fid: 'A'.repeat(22), kind: 'pet' }],
      ['GET', '/friends/inbox', null], ['POST', '/friends/inbox/claim', { ids: [] }], ['POST', '/friends/leave', {}]
    ];
    for (const [m, p, b] of routes) {
      const res = await frCall(m, p, b);
      ok(res.status === 401 && res.json.error === 'no_session', `${m} ${p.split('?')[0]} needs a token`);
    }

    const gMail = await user('10.19.20.8');
    const reg = await call('POST', '/register', { email: 'friends-mail@example.com', password: 'friendpass1' }, gMail.token, { 'CF-Connecting-IP': '10.19.20.9' });
    ok(reg.status === 200 && reg.json.user.email === 'friends-mail@example.com' && reg.json.user.id === gMail.user.id, 'the friends account can be an email user');
    emails.push('friends-mail@example.com');
    const A = { token: reg.json.token, user: reg.json.user };
    const B = await user('10.19.20.2'), C = await user('10.19.20.3');
    const empty = await frCall('GET', '/friends', null, A.token);
    ok(empty.status === 200 && empty.json.me === null && empty.json.friends.length === 0, 'GET /friends before a profile: me is null and the list is empty');
    ok((await frCall('POST', '/friends/me', { name: [40, 0] }, A.token)).json.error === 'bad', 'a name word past the list is bad');
    ok((await frCall('POST', '/friends/me', { name: ['Sunny', 'Biscuit'] }, A.token)).json.error === 'bad', 'a typed name is bad');
    ok((await frCall('POST', '/friends/me', { name: [0, 1], hi: 'x' }, A.token)).json.error === 'bad', 'an extra field on /friends/me is bad');
    ok((await frCall('POST', '/friends/code/new', {}, A.token)).json.error === 'bad', 'a new code needs a profile first');
    const a = await profile(A, [3, 7]);
    const renamed = await frCall('POST', '/friends/me', { name: [0, 39] }, A.token);
    ok(renamed.status === 200 && renamed.json.fid === a.fid && renamed.json.code === a.code && renamed.json.name.join() === '0,39', 'renaming keeps the fid and the code');
    const b = await profile(B, [1, 2]);
    await profile(C, [4, 5]);
    ok((await frCall('POST', '/friends/add', { code: 'nope', extra: true }, A.token, { 'CF-Connecting-IP': '10.19.21.1' })).json.error === 'bad', 'add with an extra field is bad and is not a guess');
    let res = await frCall('POST', '/friends/add', { code: ' ' + b.code.toLowerCase() + ' ' }, A.token, { 'CF-Connecting-IP': '10.19.21.1' });
    ok(res.status === 200 && res.json.ok === true, 'add is case-insensitive and ignores spaces');
    ok((await nOf('select count(*) as n from friends where user_id = ? and friend_id = ?', A.user.id, B.user.id)) === 1, 'add writes my row');
    ok((await nOf('select count(*) as n from friends where user_id = ? and friend_id = ?', B.user.id, A.user.id)) === 1, 'add writes their row too');
    res = await frCall('GET', '/friends', null, A.token);
    ok(res.json.me.fid === a.fid && res.json.me.code === a.code && res.json.me.name.join() === '0,39', 'GET /friends returns me');
    ok(res.json.friends.length === 1 && res.json.friends[0].fid === b.fid && res.json.friends[0].name.join() === '1,2' && res.json.friends[0].seen === 'older' && res.json.friends[0].dogs.length === 0 && JSON.stringify(res.json.friends[0].sent) === sent0, 'a new friend: name, no dogs yet, seen older, nothing sent today');
    ok(!('code' in res.json.friends[0]) && Object.keys(res.json.friends[0]).join() === 'fid,name,dogs,seen,sent', 'a friend row has fid, name, dogs, seen and sent only');
    ok((await frCall('POST', '/friends/add', { code: 'dog-' + b.code.slice(4).toLowerCase() }, A.token, { 'CF-Connecting-IP': '10.19.21.1' })).json.error === 'already', 'adding the same friend again is already');
    ok((await frCall('POST', '/friends/add', { code: a.code.slice(4) }, A.token, { 'CF-Connecting-IP': '10.19.21.1' })).json.error === 'self', 'adding my own code, without the DOG- prefix, is self');
    ok((await frCall('POST', '/friends/add', { code: 'OOOOO' }, A.token, { 'CF-Connecting-IP': '10.19.21.1' })).json.error === 'not_found', 'a code with a letter the alphabet skips is not_found');
    ok((await frCall('POST', '/friends/add', { code: 'DOG-ZZZZZ' }, C.token, { 'CF-Connecting-IP': '10.19.21.2' })).json.error === 'not_found', 'an unknown code is not_found');
    res = await frCall('POST', '/friends/add', { code: 'dog - ' + a.code.slice(4).toLowerCase() }, C.token, { 'CF-Connecting-IP': '10.19.21.2' });
    ok(res.status === 200 && res.json.ok === true, 'the prefix is optional and the hyphen in it is optional');

    const fresh = await profile(await user('10.19.22.1'), [2, 2]);
    const owner = await user('10.19.22.2');
    const first = await profile(owner, [6, 6]);
    const rotated = [first.code];
    for (let i = 0; i < 5; i++) {
      res = await frCall('POST', '/friends/code/new', {}, owner.token);
      ok(res.status === 200 && CODE.test(res.json.code) && res.json.fid === first.fid, 'new code ' + (i + 1) + ' keeps the fid');
      rotated.push(res.json.code);
    }
    ok(new Set(rotated).size === 6, 'each new code is different');
    ok((await frCall('POST', '/friends/code/new', {}, owner.token)).status === 429, 'the 6th new code in a Japan day is rate limited (5 a day)');
    const taker = await user('10.19.22.3'); await profile(taker, [7, 7]); // add needs my own friend id (fix batch)
    ok((await frCall('POST', '/friends/add', { code: rotated[0] }, taker.token, { 'CF-Connecting-IP': '10.19.22.4' })).json.error === 'not_found', 'the old code stops working');
    ok((await frCall('POST', '/friends/add', { code: rotated[5].toLowerCase() }, taker.token, { 'CF-Connecting-IP': '10.19.22.4' })).json.ok === true, 'the newest code works, in any case');
    ok(fresh.code && first.code, 'profiles for the code checks exist');

    // yard: Dog Card dog checks, coordinates, counts, 16 KB
    const yA = await user('10.19.23.1'), yB = await user('10.19.23.2'), yS = await user('10.19.23.3');
    const pyA = await profile(yA, [8, 8]), pyB = await profile(yB, [9, 9]);
    await profile(yS, [8, 9]);
    ok((await frCall('POST', '/friends/add', { code: pyB.code }, yA.token, { 'CF-Connecting-IP': '10.19.23.4' })).json.ok === true, 'yard pair are friends');
    ok((await frCall('GET', '/friends/yard?fid=' + pyB.fid, null, yA.token)).json.yard === null, 'a friend with no snapshot yet: yard is null');
    ok((await frCall('POST', '/friends/send', { fid: pyB.fid, kind: 'walk', data: { dog: 0, mine: dog() } }, yA.token)).json.error === 'bad', 'a walk needs the friend to have a snapshot with that dog');
    ok((await frCall('GET', '/friends/yard?fid=' + pyB.fid, null, yS.token)).json.error === 'not_found', 'a yard is not_found unless you are friends');
    ok((await frCall('GET', '/friends/yard?fid=' + pyA.fid, null, yA.token)).json.error === 'not_found', 'my own fid is not a friend yard');
    ok((await frCall('PUT', '/friends/yard', { yard: yard(), extra: 1 }, yB.token)).json.error === 'bad', 'an extra field on the yard put is bad');
    const junk = [
      ['typed dog name', dog({ n: 'Mochi' })], ['dog name past the list', dog({ n: 120 })], ['breed past the list', dog({ b: 40 })],
      ['breed as text', dog({ b: 'shiba' })], ['outfit past the list', dog({ o: 57 })], ['outfit under -1', dog({ o: -2 })],
      ['age not pup or adult', dog({ a: 'old' })], ['sex not m or f', dog({ s: 'x' })], ['sparkle 2', dog({ sp: 2 })],
      ['an extra dog key', Object.assign(dog(), { name: 'Pip' })], ['a missing dog key', (() => { const d = dog(); delete d.n; return d; })()],
      ['a bad allele', dog({ c: { B: ['B', 'x'] } })], ['a coat word', dog({ c: 'red' })], ['an unknown locus', dog({ c: { K: ['K', 'k'] } })],
      ['a double merle', dog({ c: { M: ['M', 'M'] } })], ['an empty coat', dog({ c: {} })], ['a colour that is not #rrggbb', dog({ c: '#12345g' })],
      ['eyes past the list (v2.23)', dog({ e: 4 })], ['a pattern seed as text', dog({ p: 'x' })]
    ];
    const junkBad = [];
    for (const [label, d] of junk) {
      const x = await frCall('PUT', '/friends/yard', { yard: yard({ dogs: [d] }) }, yB.token);
      if (!(x.status === 400 && x.json.error === 'bad')) junkBad.push(label + ' ' + x.status);
    }
    ok(!junkBad.length, `yard dogs use the Dog Card checks (${junk.length} kinds) ${junkBad.join(', ')}`);
    const yardBad = [
      ['v is 2', yard({ v: 2 })], ['no season', yard({ season: 'fall' })], ['house past the list', yard({ house: 15 })],
      ['6 dogs', yard({ dogs: [dog(), dog(), dog(), dog(), dog(), dog()] })],
      ['41 decor', yard({ decor: Array.from({ length: 41 }, (_, i) => ({ i: 0, x: i, y: 0 })) })],
      ['decor index past the list', yard({ decor: [{ i: 35, x: 0, y: 0 }] })],
      ['x past 1200', yard({ decor: [{ i: 0, x: 1201, y: 0 }] })], ['y past 800', yard({ decor: [{ i: 0, x: 0, y: 801 }] })],
      ['x negative', yard({ decor: [{ i: 0, x: -1, y: 0 }] })], ['x not an integer', yard({ decor: [{ i: 0, x: 1.5, y: 0 }] })],
      ['x as text', yard({ decor: [{ i: 0, x: '10', y: 0 }] })], ['an extra decor key', yard({ decor: [{ i: 0, x: 0, y: 0, z: 1 }] })],
      ['over 16 KB', Object.assign(yard(), { pad: 'x'.repeat(17000) })]
    ];
    const yardFails = [];
    for (const [label, body] of yardBad) {
      const x = await frCall('PUT', '/friends/yard', { yard: body }, yB.token);
      if (!(x.status === 400 && x.json.error === 'bad')) yardFails.push(label + ' ' + x.status);
    }
    ok(!yardFails.length, `anything outside the snapshot rules is bad ${yardFails.join(', ')}`);
    ok(!(await sql('select user_id from yards where user_id = ?', yB.user.id)), 'no junk yard was stored');
    const goodDogs = [dog({ b: 3 }), dog({ b: 39, o: 49, n: 119, c: '#AABBCC' }), dog({ b: 20, o: -1, a: 'pup', s: 'm', sp: 1, n: 100, c: null }), dog({ e: 2, p: 123456789 }), dog({ b: 1, c: null })]; // v2.23: the fourth carries eyes and a pattern seed
    const goodDecor = [{ i: 0, x: 0, y: 0 }, { i: 34, x: 1200, y: 800 }].concat(Array.from({ length: 38 }, (_, i) => ({ i: i % 35, x: i, y: i }))); // v2.26: 34 = the Bubble Fountain, the last yard toy
    const good = { v: 1, name: [9, 9], house: 13, season: 'winter', dogs: goodDogs, decor: goodDecor };
    ok(good.dogs.length === 5 && good.decor.length === 40 && JSON.stringify(good).length < 16384, 'the accepted snapshot is 5 dogs, 40 decor and under 16 KB');
    res = await frCall('PUT', '/friends/yard', { yard: good }, yB.token);
    ok(res.status === 200 && res.json.ok === true, 'a snapshot inside the rules is stored');
    res = await frCall('GET', '/friends/yard?fid=' + pyB.fid, null, yA.token);
    ok(res.status === 200 && res.json.yard.house === 13 && res.json.yard.season === 'winter' && res.json.yard.name.join() === '9,9', 'GET /friends/yard returns the snapshot');
    ok(res.json.yard.dogs[3].e === 2 && res.json.yard.dogs[3].p === 123456789 && !('e' in res.json.yard.dogs[0]) && !('p' in res.json.yard.dogs[0]), 'v2.23: a yard dog keeps its eyes and pattern seed; a dog without them has none');
    ok(res.json.yard.dogs.length === 5 && res.json.yard.dogs[0].b === 3 && res.json.yard.dogs[1].c === '#aabbcc' && res.json.yard.dogs[2].c === null && res.json.yard.dogs[2].o === -1, 'dogs come back in the Dog Card shape, leader first, colour lower case');
    ok(res.json.yard.decor.length === 40 && res.json.yard.decor[1].x === 1200 && res.json.yard.decor[1].y === 800 && res.json.yard.decor[1].i === 34, 'decor keeps integer coordinates up to 1200 and 800, and the v2.26 yard toys (index 31-34)');
    ok(!res.text.includes(yB.user.id) && !/"updated_at"|"created_at"/.test(res.text), 'the yard answer has no user id and no timestamp');
    const zero = await frCall('PUT', '/friends/yard', { yard: yard({ dogs: [], decor: [], season: 'summer', house: 0 }) }, yA.token);
    ok(zero.status === 200, 'a yard may have no dogs and no decor (at most 5, at most 40)');
    res = await frCall('GET', '/friends', null, yA.token);
    const rowB = res.json.friends.find((f) => f.fid === pyB.fid);
    ok(rowB && rowB.seen === 'today' && rowB.dogs.length === 5 && rowB.dogs[0].b === 3 && JSON.stringify(rowB.sent) === sent0, 'the list takes the dogs from the snapshot and seen is today after they save a yard');

    // sends: per Japan day, friends only
    ok((await frCall('POST', '/friends/send', { fid: pyB.fid, kind: 'note', data: { i: 12 } }, yA.token)).json.error === 'bad', 'a note past the 12 lines is bad');
    ok((await frCall('POST', '/friends/send', { fid: pyB.fid, kind: 'note', data: { i: 0, text: 'hi' } }, yA.token)).json.error === 'bad', 'a note cannot carry typed text');
    ok((await frCall('POST', '/friends/send', { fid: pyB.fid, kind: 'gift', data: { i: 47, n: 1 } }, yA.token)).json.error === 'bad', 'a gift past the list is bad');
    ok((await frCall('POST', '/friends/send', { fid: pyB.fid, kind: 'gift', data: { i: 0, n: 2 } }, yA.token)).json.error === 'bad', 'a gift sends exactly one');
    ok((await frCall('POST', '/friends/send', { fid: pyA.fid, kind: 'pet' }, yS.token)).json.error === 'not_found', 'only a friend can send');
    ok((await frCall('POST', '/friends/send', { fid: pyB.fid, kind: 'wave' }, yA.token)).json.error === 'bad', 'kind has to be pet, note, gift or walk');
    ok((await frCall('POST', '/friends/send', { fid: pyB.fid, kind: 'walk', data: { dog: 5, mine: dog() } }, yA.token)).json.error === 'bad', 'a walk dog index is 0 to 4');
    ok((await frCall('POST', '/friends/send', { fid: pyB.fid, kind: 'walk', data: { dog: 0, mine: dog(), t: 47 } }, yA.token)).json.error === 'bad', 'a walk treasure past the gift list is bad');
    ok((await frCall('POST', '/friends/send', { fid: pyB.fid, kind: 'walk', data: { dog: 0, mine: dog({ c: { M: ['M', 'M'] } }) } }, yA.token)).json.error === 'bad', 'the walking leader is checked like a Dog Card dog');
    res = await frCall('POST', '/friends/send', { fid: pyB.fid, kind: 'pet' }, yA.token);
    ok(res.status === 200 && res.json.ok === true, 'the first pet today is kept');
    const day = (await sql('select day from friend_events where from_id = ? and kind = ?', yA.user.id, 'pet')).day;
    ok(day === new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10), 'the pet is stored on the Japan day');
    ok((await frCall('POST', '/friends/send', { fid: pyB.fid, kind: 'pet' }, yA.token)).json.error === 'limit', 'a second pet to the same friend today is limit');
    ok((await frCall('POST', '/friends/send', { fid: pyB.fid, kind: 'note', data: { i: 11 } }, yA.token)).json.ok === true, 'a note is a different kind, so it is kept the same day');
    res = await frCall('POST', '/friends/send', { fid: pyB.fid, kind: 'walk', data: { dog: 4, mine: dog({ b: 2, n: 3 }), t: 45 } }, yA.token);
    ok(res.json.ok === true, 'a walk with a treasure index is kept');
    ok((await frCall('POST', '/friends/send', { fid: pyB.fid, kind: 'walk', data: { dog: 0, mine: dog() } }, yA.token)).json.error === 'limit', 'a second walk to the same friend today is limit');
    ok((await frCall('POST', '/friends/send', { fid: pyB.fid, kind: 'gift', data: { i: 45, n: 1 } }, yA.token)).json.ok === true, 'one gift today is kept');
    ok((await frCall('POST', '/friends/send', { fid: pyB.fid, kind: 'gift', data: { i: 1, n: 1 } }, yA.token)).json.error === 'limit', 'a second gift today is limit, even to the same friend');
    const yD = await user('10.19.23.5'); const pyD = await profile(yD, [7, 7]);
    ok((await frCall('POST', '/friends/add', { code: pyD.code }, yA.token, { 'CF-Connecting-IP': '10.19.23.6' })).json.ok === true, 'a second friend for the gift rule');
    ok((await frCall('POST', '/friends/send', { fid: pyD.fid, kind: 'gift', data: { i: 0, n: 1 } }, yA.token)).json.error === 'limit', 'the one gift a day counts for every friend');
    ok((await frCall('POST', '/friends/send', { fid: pyD.fid, kind: 'pet' }, yA.token)).json.ok === true, 'a pet to a different friend is still allowed');
    res = await frCall('GET', '/friends', null, yA.token);
    const sb = res.json.friends.find((f) => f.fid === pyB.fid), sd = res.json.friends.find((f) => f.fid === pyD.fid);
    ok(sb && sb.sent.pet && sb.sent.note && sb.sent.walk && sb.sent.gift, 'sent shows what I sent that friend today');
    ok(sd && sd.sent.pet && !sd.sent.gift && !sd.sent.note && !sd.sent.walk, 'the gift flag is only on the friend who got it');

    // inbox, claim, 30 days, at most 30
    res = await frCall('GET', '/friends/inbox', null, yB.token);
    ok(res.status === 200 && res.json.events.length === 4, 'inbox has the four unclaimed events (pet, note, walk, and the gift)');
    ok(res.json.events.every((e) => e.from && e.from.fid === pyA.fid && e.from.name.join() === '8,8' && !e.from.code), 'each event names the sender by fid and friend name');
    ok(res.json.events.map((e) => e.kind).join() === 'pet,note,walk,gift', 'oldest first');
    const note = res.json.events.find((e) => e.kind === 'note'), walk = res.json.events.find((e) => e.kind === 'walk');
    ok(note && note.data.i === 11 && note.day === day && Object.keys(note).join() === 'id,from,kind,data,day', 'a note event is id, from, kind, data and the Japan day');
    ok(walk && walk.data.dog === 4 && walk.data.t === 45 && walk.data.mine.b === 2 && walk.data.mine.n === 3, 'a walk event keeps the dog index, the treasure and the leader');
    await sql('insert into friend_events (to_id, from_id, kind, data, day, created_at) values (?, ?, ?, ?, ?, ?)',
      yB.user.id, yA.user.id, 'note', '{"i":1}', '2000-01-01', Date.now() - 31 * 864e5, true);
    res = await frCall('GET', '/friends/inbox', null, yB.token);
    ok(!res.json.events.some((e) => e.day === '2000-01-01'), 'an inbox read drops events older than 30 days');
    ok((await nOf('select count(*) as n from friend_events where to_id = ? and day = ?', yB.user.id, '2000-01-01')) === 0, 'the old event is deleted, not just hidden');
    const keepAt = Date.now() - 29 * 864e5;
    await sql('insert into friend_events (to_id, from_id, kind, data, day, created_at) values (?, ?, ?, ?, ?, ?)', yB.user.id, yA.user.id, 'note', '{"i":2}', '2000-02-01', keepAt, true);
    res = await frCall('GET', '/friends/inbox', null, yB.token);
    ok(res.json.events.some((e) => e.day === '2000-02-01' && e.data.i === 2), 'an event from 29 days ago is still in the inbox');
    const claimId = res.json.events.find((e) => e.kind === 'pet').id;
    res = await frCall('POST', '/friends/inbox/claim', { ids: [claimId, claimId] }, yB.token);
    ok(res.status === 200 && res.json.ok === true, 'claim marks my events');
    ok((await frCall('POST', '/friends/inbox/claim', { ids: [claimId] }, yB.token)).json.ok === true, 'claiming again is fine');
    res = await frCall('GET', '/friends/inbox', null, yB.token);
    ok(!res.json.events.some((e) => e.id === claimId), 'a claimed event leaves the inbox');
    ok((await nOf('select count(*) as n from friend_events where id = ? and claimed_at is not null', claimId)) === 1, 'the row stays, with claimed_at set');
    ok((await frCall('POST', '/friends/inbox/claim', { ids: [claimId] }, yA.token)).json.ok === true, 'claiming someone else\'s event does nothing to it');
    ok((await nOf('select count(*) as n from friend_events where id = ? and to_id = ? and claimed_at is not null', claimId, yB.user.id)) === 1, 'their claim did not undo mine, and did not move it');
    ok((await frCall('POST', '/friends/inbox/claim', { ids: [1.5] }, yB.token)).json.error === 'bad', 'a claim id has to be a whole number');
    ok((await frCall('POST', '/friends/inbox/claim', { ids: Array.from({ length: 31 }, (_, i) => i + 1) }, yB.token)).json.error === 'bad', 'a claim takes at most 30 ids');
    const box = await user('10.19.24.1'), from = await user('10.19.24.2');
    await profile(box, [1, 1]); await profile(from, [2, 2]);
    for (let i = 0; i < 31; i++) {
      const d = '2010-01-' + String(i + 1).padStart(2, '0');
      await sql('insert into friend_events (to_id, from_id, kind, data, day, created_at) values (?, ?, ?, ?, ?, ?)', box.user.id, from.user.id, 'note', '{"i":0}', d, Date.now() - (31 - i) * 1000, true);
    }
    res = await frCall('GET', '/friends/inbox', null, box.token);
    ok(res.json.events.length === 30 && res.json.events[0].day === '2010-01-01' && res.json.events[29].day === '2010-01-30' && !res.json.events.some((e) => e.day === '2010-01-31'), 'the inbox returns at most 30 events, oldest first');
    const box2 = await user('10.19.24.3'), from2 = await user('10.19.24.4');
    await profile(box2, [1, 2]); await profile(from2, [2, 1]);
    for (let i = 0; i < 31; i++) await sql('insert into friend_events (to_id, from_id, kind, data, day, created_at) values (?, ?, ?, ?, ?, ?)', box2.user.id, from2.user.id, i % 2 ? 'walk' : 'gift', '{"i":0,"n":1}', '2011-01-' + String(i + 1).padStart(2, '0'), Date.now() - (40 - i) * 1000, true);
    await sql('insert into friend_events (to_id, from_id, kind, data, day, created_at) values (?, ?, ?, ?, ?, ?)', box2.user.id, from2.user.id, 'pet', '{}', '2011-02-01', Date.now() - 5000, true);
    await sql('insert into friend_events (to_id, from_id, kind, data, day, created_at) values (?, ?, ?, ?, ?, ?)', box2.user.id, from2.user.id, 'note', '{"i":3}', '2011-02-01', Date.now() - 4000, true);
    res = await frCall('GET', '/friends/inbox', null, box2.token);
    ok(res.json.events.length === 30 && res.json.events[0].kind === 'pet' && res.json.events[1].kind === 'note', 'unclaimed gifts and walks never crowd pets and notes out of the inbox (code review 1)');
    // a caller with no friend id of its own (a stray guest after a logout) cannot add or send
    const noId = await user('10.19.24.5');
    ok((await frCall('POST', '/friends/add', { code: a.code }, noId.token, { 'CF-Connecting-IP': '10.19.24.6' })).json.error === 'bad', 'add without my own friend id is bad');
    ok((await frCall('POST', '/friends/send', { fid: pyB.fid, kind: 'pet' }, noId.token)).json.error === 'bad', 'send without my own friend id is bad');
    ok((await nOf('select count(*) as n from friends where user_id = ? or friend_id = ?', noId.user.id, noId.user.id)) === 0, 'no friends row for a caller without a friend id');

    // seen: today, the previous six Japan days, or older. An inbox read counts.
    await sql('update friend_ids set seen_at = ? where user_id = ?', Date.now() - 6 * 864e5, yB.user.id, true);
    res = await frCall('GET', '/friends', null, yA.token);
    ok(res.json.friends.find((f) => f.fid === pyB.fid).seen === 'week', 'seen is week for the previous six Japan days');
    await sql('update friend_ids set seen_at = ? where user_id = ?', Date.now() - 7 * 864e5, yB.user.id, true);
    res = await frCall('GET', '/friends', null, yA.token);
    ok(res.json.friends.find((f) => f.fid === pyB.fid).seen === 'older', 'seen is older from the seventh Japan day back');
    await frCall('GET', '/friends/inbox', null, yB.token);
    res = await frCall('GET', '/friends', null, yA.token);
    ok(res.json.friends.find((f) => f.fid === pyB.fid).seen === 'today', 'an inbox read counts as seen today');

    // remove keeps claimed events and drops unclaimed ones. They can be added again. No block row.
    const rA = await user('10.19.25.1'), rB = await user('10.19.25.2');
    const prA = await profile(rA, [3, 3]), prB = await profile(rB, [4, 4]);
    ok((await frCall('POST', '/friends/add', { code: prB.code }, rA.token, { 'CF-Connecting-IP': '10.19.25.3' })).json.ok === true, 'remove pair');
    await frCall('POST', '/friends/send', { fid: prB.fid, kind: 'note', data: { i: 0 } }, rA.token);
    await frCall('POST', '/friends/send', { fid: prB.fid, kind: 'pet' }, rA.token);
    res = await frCall('GET', '/friends/inbox', null, rB.token);
    const keep = res.json.events.find((e) => e.kind === 'note').id;
    await frCall('POST', '/friends/inbox/claim', { ids: [keep] }, rB.token);
    ok((await frCall('POST', '/friends/remove', { fid: prA.fid }, rB.token)).json.ok === true, 'remove is quiet');
    ok((await nOf('select count(*) as n from friends where user_id = ? or friend_id = ?', rA.user.id, rA.user.id)) === 0, 'remove deletes both rows');
    ok((await nOf('select count(*) as n from friend_events where claimed_at is null and (from_id = ? or to_id = ?)', rA.user.id, rA.user.id)) === 0, 'remove deletes the unclaimed events between the two');
    ok((await nOf('select count(*) as n from friend_events where id = ? and claimed_at is not null', keep)) === 1, 'remove keeps a claimed event');
    ok((await nOf('select count(*) as n from friend_blocks where user_id = ? or blocked_id = ?', rB.user.id, rB.user.id)) === 0, 'remove does not block');
    ok((await frCall('POST', '/friends/add', { code: prA.code }, rB.token, { 'CF-Connecting-IP': '10.19.25.4' })).json.ok === true, 'after remove they can add again');
    ok((await frCall('POST', '/friends/remove', { fid: 'E'.repeat(22) }, rA.token)).json.ok === true, 'removing an unknown fid is quiet');
    ok((await frCall('POST', '/friends/remove', { fid: prA.fid }, rA.token)).json.error === 'bad', 'removing myself is bad');

    // a block either way is not_found, including after a new code. Unclaimed events go.
    const kA = await user('10.19.26.1'), kB = await user('10.19.26.2'), kC = await user('10.19.26.3');
    const pkA = await profile(kA, [5, 5]), pkB = await profile(kB, [6, 1]);
    await profile(kC, [6, 2]);
    ok((await frCall('POST', '/friends/add', { code: pkB.code }, kA.token, { 'CF-Connecting-IP': '10.19.26.4' })).json.ok === true, 'block pair');
    await frCall('POST', '/friends/send', { fid: pkB.fid, kind: 'pet' }, kA.token);
    ok((await frCall('POST', '/friends/block', { fid: pkA.fid }, kB.token)).json.ok === true, 'block is quiet');
    ok((await nOf('select count(*) as n from friend_blocks where user_id = ? and blocked_id = ?', kB.user.id, kA.user.id)) === 1, 'the block row is mine');
    ok((await nOf('select count(*) as n from friends where user_id = ? or friend_id = ?', kA.user.id, kA.user.id)) === 0, 'block also removes the friendship');
    ok((await nOf('select count(*) as n from friend_events where claimed_at is null and ((from_id = ? and to_id = ?) or (from_id = ? and to_id = ?))', kA.user.id, kB.user.id, kB.user.id, kA.user.id)) === 0, 'block deletes the unclaimed events between the two');
    ok((await frCall('POST', '/friends/add', { code: pkA.code }, kB.token, { 'CF-Connecting-IP': '10.19.26.5' })).json.error === 'not_found', 'the blocker adding them back is not_found');
    ok((await frCall('POST', '/friends/add', { code: pkB.code }, kA.token, { 'CF-Connecting-IP': '10.19.26.6' })).json.error === 'not_found', 'the blocked player adding them is not_found');
    const pkB2 = (await frCall('POST', '/friends/code/new', {}, kB.token)).json;
    ok((await frCall('POST', '/friends/add', { code: pkB2.code }, kA.token, { 'CF-Connecting-IP': '10.19.26.7' })).json.error === 'not_found', 'a new code does not get past a block');
    ok((await frCall('POST', '/friends/add', { code: pkB2.code }, kC.token, { 'CF-Connecting-IP': '10.19.26.8' })).json.ok === true, 'someone else can still add that new code');
    ok((await frCall('POST', '/friends/send', { fid: pkB2.fid, kind: 'pet' }, kA.token)).json.error === 'not_found', 'a blocked player cannot send either');

    // 50 friends on either side
    const capB = await user('10.19.27.1'), capA = await user('10.19.27.2'), capC = await user('10.19.27.3'), capD = await user('10.19.27.4');
    const pCapB = await profile(capB, [1, 3]);
    await profile(capA, [1, 4]); await profile(capC, [1, 5]);
    const pCapD = await profile(capD, [1, 6]);
    for (let i = 0; i < 49; i++) {
      await sql('insert into users (id, email, created_at, guest) values (?, null, ?, 1)', 'filler-b-' + i, Date.now(), true);
      await sql('insert into friends (user_id, friend_id, created_at) values (?, ?, ?)', capB.user.id, 'filler-b-' + i, 1, true);
    }
    res = await frCall('POST', '/friends/add', { code: pCapB.code }, capA.token, { 'CF-Connecting-IP': '10.19.27.5' });
    ok(res.status === 200 && res.json.ok === true, 'the 50th friend is allowed');
    res = await frCall('POST', '/friends/add', { code: pCapB.code }, capC.token, { 'CF-Connecting-IP': '10.19.27.6' });
    ok(res.status === 400 && res.json.error === 'full', 'the friend who already has 50 answers full');
    ok((await nOf('select count(*) as n from friends where user_id = ? and friend_id = ?', capC.user.id, capB.user.id)) === 0, 'full does not write a row');
    for (let i = 0; i < 49; i++) {
      await sql('insert into users (id, email, created_at, guest) values (?, null, ?, 1)', 'filler-a-' + i, Date.now(), true);
      await sql('insert into friends (user_id, friend_id, created_at) values (?, ?, ?)', capA.user.id, 'filler-a-' + i, 1, true);
    }
    res = await frCall('POST', '/friends/add', { code: pCapD.code }, capA.token, { 'CF-Connecting-IP': '10.19.27.7' });
    ok(res.status === 400 && res.json.error === 'full', 'I answer full once I have 50, whoever the other side is');

    // v2.22.3 official accounts (users.official = 1, set by hand in D1): no cap on their side, they don't count toward anyone's 50,
    // and their own list is their newest 50.
    {
      const filler = async (pre, owner, n, t0) => {
        for (let i = 0; i < n; i++) {
          const id = pre + i;
          await sql('insert into users (id, email, created_at, guest) values (?, null, ?, 1)', id, Date.now(), true);
          await sql('insert into friend_ids (user_id, fid, code, name_a, name_b, created_at, code_at, seen_at) values (?, ?, ?, 0, 0, 1, 1, 0)', id, (pre + i + '_').padEnd(22, 'x').slice(0, 22), 'F' + pre + i, true);
          await sql('insert into friends (user_id, friend_id, created_at) values (?, ?, ?)', owner, id, (t0 || 1) + i, true);
          await sql('insert into friends (user_id, friend_id, created_at) values (?, ?, ?)', id, owner, (t0 || 1) + i, true);
        }
      };
      const ofc = await user('10.19.33.1'), pOfc = await profile(ofc, [7, 7]);
      await sql('update users set official = 1 where id = ?', ofc.user.id, true);
      await filler('of-o-', ofc.user.id, 55, 1000);
      // a player with 50 normal friends can still add the official account
      const at50 = await user('10.19.33.2'), pAt50 = await profile(at50, [7, 8]);
      await filler('of-a-', at50.user.id, 50, 1000);
      res = await frCall('POST', '/friends/add', { code: pOfc.code }, at50.token, { 'CF-Connecting-IP': '10.19.33.20' });
      ok(res.status === 200 && res.json.ok === true, 'official: a player with 50 friends can add the official account');
      ok((await nOf('select count(*) as n from friends where user_id = ?', ofc.user.id)) === 56, 'official: the official account goes past 50 (56 rows)');
      ok((await nOf('select count(*) as n from friends where user_id = ? and friend_id = ?', ofc.user.id, at50.user.id)) === 1, 'official: both rows are written');
      // a player at 49 normal friends: official, then one more normal, then full
      const at49 = await user('10.19.33.3'), pAt49 = await profile(at49, [7, 9]);
      await filler('of-b-', at49.user.id, 49, 1000);
      const n1 = await user('10.19.33.4'), pN1 = await profile(n1, [7, 10]);
      const n2 = await user('10.19.33.5'), pN2 = await profile(n2, [7, 11]);
      ok((await frCall('POST', '/friends/add', { code: pOfc.code }, at49.token, { 'CF-Connecting-IP': '10.19.33.21' })).json.ok === true, 'official: 49 normal friends, adding official is fine');
      ok((await frCall('POST', '/friends/add', { code: pN1.code }, at49.token, { 'CF-Connecting-IP': '10.19.33.21' })).json.ok === true, 'official: the official friend does not count, so a 50th normal friend still fits');
      res = await frCall('POST', '/friends/add', { code: pN2.code }, at49.token, { 'CF-Connecting-IP': '10.19.33.21' });
      ok(res.status === 400 && res.json.error === 'full', 'official: the normal cap is unchanged (51st normal friend: full)');
      res = await frCall('POST', '/friends/add', { code: pAt49.code }, n2.token, { 'CF-Connecting-IP': '10.19.33.22' });
      ok(res.status === 400 && res.json.error === 'full', 'official: adding a player who has 50 normal friends plus official is still full');
      // the official account adding a player who has 50 normal friends: no cap on either side
      const at50b = await user('10.19.33.6'), pAt50b = await profile(at50b, [7, 12]);
      await filler('of-c-', at50b.user.id, 50, 1000);
      ok((await frCall('POST', '/friends/add', { code: pAt50b.code }, ofc.token, { 'CF-Connecting-IP': '10.19.33.23' })).json.ok === true, 'official: the official account can add a player who has 50 friends');
      // lists: official sees its newest 50; players see the official row marked, their own rows unmarked
      res = await frCall('GET', '/friends', null, ofc.token);
      const offFids = res.json.friends.map((f) => f.fid);
      ok(res.json.friends.length === 50, 'official: its own list is 50 long (' + res.json.friends.length + ')');
      ok(offFids.includes(pAt50.fid) && offFids.includes(pAt49.fid) && offFids.includes(pAt50b.fid), 'official: the newest friends are in its list');
      ok(!offFids.some((f) => /^of-o-[0-7]_/.test(f)) && offFids.includes('of-o-8_'.padEnd(22, 'x')), 'official: the oldest 8 of 58 are left out');
      ok(!res.json.friends.some((f) => 'official' in f), 'official: no friend of the official account is marked official');
      res = await frCall('GET', '/friends', null, at50.token);
      const offRow = res.json.friends.find((f) => f.fid === pOfc.fid);
      ok(res.json.friends.length === 51 && offRow && offRow.official === true, 'official: a player sees all 51 rows and the official one says official: true');
      ok(res.json.friends.filter((f) => 'official' in f).length === 1, 'official: normal rows have no official field');
      ok((await frCall('GET', '/friends', null, capA.token)).json.friends.every((f) => !('official' in f)), 'official: a normal list is as before');
      // the official yard and sends work like any friend's
      ok((await frCall('PUT', '/friends/yard', { yard: yard() }, ofc.token)).json.ok === true, 'official: yard save');
      ok((await frCall('GET', '/friends/yard?fid=' + pOfc.fid, null, at50.token)).json.yard !== null, 'official: a player can visit the official yard');
      ok((await frCall('POST', '/friends/send', { fid: pOfc.fid, kind: 'pet' }, at50.token)).json.ok === true, 'official: a player can pet the official dogs');
      // remove and block still work for players
      ok((await frCall('POST', '/friends/remove', { fid: pOfc.fid }, at50.token)).json.ok === true, 'official: remove answers ok');
      ok((await nOf('select count(*) as n from friends where (user_id = ? and friend_id = ?) or (user_id = ? and friend_id = ?)', at50.user.id, ofc.user.id, ofc.user.id, at50.user.id)) === 0, 'official: remove deletes both rows');
      ok((await frCall('POST', '/friends/block', { fid: pOfc.fid }, at49.token)).json.ok === true, 'official: block answers ok');
      ok((await nOf('select count(*) as n from friends where user_id = ? and friend_id = ?', at49.user.id, ofc.user.id)) === 0, 'official: block removes the friendship');
      ok((await frCall('POST', '/friends/add', { code: pAt49.code }, ofc.token, { 'CF-Connecting-IP': '10.19.33.23' })).json.error === 'not_found', 'official: a block holds against the official account too');
      // nothing can set official: no route writes it, and extra fields are ignored or refused
      ok(!/update\s+users\s+set[^`'"]*official|insert\s+into\s+users\s*\([^)]*official|body\.official/i.test(workerSrc), 'official: no route writes users.official');
      const gOff = (await call('POST', '/guest', { official: 1 }, null, { 'CF-Connecting-IP': '10.19.33.30' })).json;
      ok(gOff && gOff.user && (await nOf('select official as n from users where id = ?', gOff.user.id)) === 0, 'official: POST /guest with official: 1 makes a normal guest');
      res = await frCall('POST', '/friends/me', { name: [1, 1], official: 1 }, gOff.token);
      ok(res.status === 400 && res.json.error === 'bad', 'official: POST /friends/me refuses an official field');
      await call('POST', '/register', { email: 'official-try@example.com', password: 'pupper123', official: 1 }, gOff.token, { 'CF-Connecting-IP': '10.19.33.30' });
      ok((await nOf('select official as n from users where email = ?', 'official-try@example.com')) === 0, 'official: register with official: 1 stays normal');
    }

    // leave deletes my code, both directions, blocks I made, my yard and my events. Blocks against me stay.
    const lA = await user('10.19.28.1'), lB = await user('10.19.28.2'), lC = await user('10.19.28.3'), lD = await user('10.19.28.4'), lE = await user('10.19.28.5');
    const plA = await profile(lA, [2, 8]), plB = await profile(lB, [2, 9]), plD = await profile(lD, [3, 1]);
    await profile(lC, [3, 2]); await profile(lE, [3, 3]);
    ok((await frCall('POST', '/friends/add', { code: plB.code }, lA.token, { 'CF-Connecting-IP': '10.19.28.6' })).json.ok === true, 'leave: friend B');
    ok((await frCall('POST', '/friends/add', { code: plA.code }, lC.token, { 'CF-Connecting-IP': '10.19.28.7' })).json.ok === true, 'leave: friend C added me');
    await frCall('PUT', '/friends/yard', { yard: yard() }, lA.token);
    await frCall('POST', '/friends/send', { fid: plB.fid, kind: 'note', data: { i: 3 } }, lA.token);
    res = await frCall('GET', '/friends/inbox', null, lB.token);
    await frCall('POST', '/friends/inbox/claim', { ids: [res.json.events[0].id] }, lB.token);
    await frCall('POST', '/friends/send', { fid: plA.fid, kind: 'pet' }, lB.token);
    ok((await frCall('POST', '/friends/block', { fid: plD.fid }, lA.token)).json.ok === true, 'leave: I blocked D');
    ok((await frCall('POST', '/friends/block', { fid: plA.fid }, lE.token)).json.ok === true, 'leave: E blocked me');
    res = await frCall('POST', '/friends/leave', {}, lA.token);
    ok(res.status === 200 && res.json.ok === true, 'leave answers ok');
    ok((await nOf('select count(*) as n from friend_ids where user_id = ?', lA.user.id)) === 0, 'leave deletes my friend id and code');
    ok((await nOf('select count(*) as n from friends where user_id = ? or friend_id = ?', lA.user.id, lA.user.id)) === 0, 'leave deletes friends both ways');
    ok((await nOf('select count(*) as n from friend_blocks where user_id = ?', lA.user.id)) === 0, 'leave deletes blocks I made');
    ok((await nOf('select count(*) as n from friend_blocks where user_id = ? and blocked_id = ?', lE.user.id, lA.user.id)) === 1, 'a block someone else made against me stays');
    ok((await nOf('select count(*) as n from yards where user_id = ?', lA.user.id)) === 0, 'leave deletes my yard');
    ok((await nOf('select count(*) as n from friend_events where from_id = ? or to_id = ?', lA.user.id, lA.user.id)) === 0, 'leave deletes my events, claimed and unclaimed, sent and received');
    res = await frCall('GET', '/friends', null, lA.token);
    ok(res.json.me === null && res.json.friends.length === 0, 'after leave, GET /friends is empty');
    ok((await frCall('POST', '/friends/add', { code: plA.code }, lB.token, { 'CF-Connecting-IP': '10.19.28.8' })).json.error === 'not_found', 'the old code does not work after leave');
    ok((await frCall('GET', '/friends', null, lB.token)).json.friends.length === 0, 'the other side loses me too');
    ok((await nOf('select count(*) as n from friend_ids where user_id = ?', lB.user.id)) === 1, 'leaving does not delete the other player');
    ok((await frCall('POST', '/friends/leave', {}, lA.token)).json.ok === true, 'leave again is ok');

    // misses share the add limits: 10/h per user, 30/h per IP
    const adder = await user('10.19.29.1'); await profile(adder, [4, 0]);
    const f1 = await profile(await user('10.19.29.2'), [4, 1]);
    const f2 = await profile(await user('10.19.29.3'), [4, 2]);
    const addIp = { 'CF-Connecting-IP': '10.19.29.9' };
    const userHits = [];
    for (let i = 0; i < 8; i++) userHits.push((await frCall('POST', '/friends/add', { code: 'OOOOO' }, adder.token, addIp)).status);
    userHits.push((await frCall('POST', '/friends/add', { code: 'DOG-ZZZZZ' }, adder.token, addIp)).status);
    userHits.push((await frCall('POST', '/friends/add', { code: f1.code.toLowerCase() }, adder.token, addIp)).status);
    userHits.push((await frCall('POST', '/friends/add', { code: f2.code }, adder.token, addIp)).status);
    ok(userHits.join() === '404,404,404,404,404,404,404,404,404,200,429', 'add misses count toward 10/h per user, and the 11th waits (' + userHits.join(' ') + ')');
    const ipHits = [];
    for (let i = 0; i < 31; i++) {
      const g = await user('10.19.31.' + (i + 1)); await profile(g, [i % 40, 3]);
      ipHits.push((await call('POST', '/friends/add', { code: 'OOOOO' }, g.token, { 'CF-Connecting-IP': '10.19.32.1' })).status);
    }
    ok(ipHits[0] === 404 && ipHits[29] === 404 && ipHits[30] === 429, 'add misses count toward 30/h per IP (' + ipHits.filter((s) => s === 429).length + ' limited)');
    const ipText = JSON.stringify(ipHits);
    ok(!ipText.includes('blocked'), 'the limited IP answers are not_found or rate_limited');

    // the other limits, checked at the exact threshold
    const lim = async (g, key, max, method, p, body, headers, again) => {
      const first = await frCall(method, p, body, g.token, headers);
      await bump(key, max - 1);
      const mid = await frCall(method, p, body, g.token, headers);
      const over = await frCall(method, p, body, g.token, headers);
      ok(first.status !== 429 && mid.status === again && over.status === 429 && over.json.error === 'rate_limited', `${method} ${p.split('?')[0]} allows ${max} then rate_limited (got ${first.status}, ${mid.status}, ${over.status})`);
    };
    const gList = await user('10.19.40.1'); await profile(gList);
    await lim(gList, 'fr:list:' + gList.user.id, 120, 'GET', '/friends', null, null, 200);
    const gMe = await user('10.19.40.2'); await profile(gMe, [0, 2]);
    await lim(gMe, 'fr:me:' + gMe.user.id, 20, 'POST', '/friends/me', { name: [0, 3] }, null, 200);
    const gRm = await user('10.19.40.3');
    await lim(gRm, 'fr:rm:' + gRm.user.id, 30, 'POST', '/friends/remove', { fid: 'B'.repeat(22) }, null, 200);
    const gBl = await user('10.19.40.4');
    await lim(gBl, 'fr:block:' + gBl.user.id, 30, 'POST', '/friends/block', { fid: 'C'.repeat(22) }, null, 200);
    const gY = await user('10.19.40.5'); await profile(gY);
    await lim(gY, 'fr:yard:' + gY.user.id, 30, 'PUT', '/friends/yard', { yard: yard() }, null, 200);
    const gYG = await user('10.19.40.6');
    await lim(gYG, 'fr:yardget:' + gYG.user.id, 120, 'GET', '/friends/yard?fid=' + 'D'.repeat(22), null, null, 404);
    const gS1 = await user('10.19.40.7'), gS2 = await user('10.19.40.8');
    const pS2 = await profile(gS2, [5, 8]); await profile(gS1, [5, 9]);
    ok((await frCall('POST', '/friends/add', { code: pS2.code }, gS1.token, { 'CF-Connecting-IP': '10.19.40.9' })).json.ok === true, 'send limit pair');
    await lim(gS1, 'fr:send:' + gS1.user.id, 60, 'POST', '/friends/send', { fid: pS2.fid, kind: 'pet' }, null, 400);
    const gIn = await user('10.19.41.1');
    await lim(gIn, 'fr:in:' + gIn.user.id, 120, 'GET', '/friends/inbox', null, null, 200);
    const gCl = await user('10.19.41.2');
    await lim(gCl, 'fr:claim:' + gCl.user.id, 120, 'POST', '/friends/inbox/claim', { ids: [] }, null, 200);
    const gLv = await user('10.19.41.3'); await profile(gLv);
    await lim(gLv, 'fr:leave:' + gLv.user.id, 30, 'POST', '/friends/leave', {}, null, 200);

    for (const p of ['GET /friends', 'POST /friends/me', 'POST /friends/code/new', 'POST /friends/add', 'POST /friends/remove', 'POST /friends/block', 'PUT /friends/yard', 'GET /friends/yard', 'POST /friends/send', 'GET /friends/inbox', 'POST /friends/inbox/claim', 'POST /friends/leave']) {
      ok(hit.has(p), 'raw JSON privacy checked on ' + p);
    }
    const alphabet = [];
    for (let i = 0; i < 12; i++) alphabet.push((await profile(await user('10.19.50.' + i), [i % 40, (i * 3) % 40])).code);
    ok(alphabet.every((c) => CODE.test(c)) && new Set(alphabet).size === alphabet.length, 'codes are DOG- plus 5 characters, with none of 0, O, 1, I or L');

    // frTidy: friend rows of deleted accounts (like dcTidy for cards)
    const gone = await user('10.19.60.1');
    const goneProf = await profile(gone, [2, 3]);
    await frCall('PUT', '/friends/yard', { yard: yard() }, gone.token);
    await sql('insert into friends (user_id, friend_id, created_at) values (?, ?, ?)', gone.user.id, 'orphan-user-id', Date.now(), true);
    await sql('insert into friend_blocks (user_id, blocked_id) values (?, ?)', gone.user.id, 'blocked-user-id', true);
    await sql('insert into friend_events (to_id, from_id, kind, data, day, created_at) values (?, ?, ?, ?, ?, ?)', gone.user.id, 'sender-id', 'pet', '{}', '2026-11-01', Date.now(), true);
    await sql('delete from users where id = ?', gone.user.id, true);
    const keeper = await user('10.19.60.2');
    await profile(keeper, [4, 4]);
    await frCall('GET', '/friends', null, keeper.token);
    ok(!(await sql('select * from friend_ids where user_id = ?', gone.user.id)) && !(await sql('select * from yards where user_id = ?', gone.user.id)), 'frTidy drops friend_ids and yards for deleted accounts');
    ok((await nOf('select count(*) as n from friends where user_id = ? or friend_id = ?', gone.user.id, gone.user.id)) === 0, 'frTidy drops friends rows');
    ok((await nOf('select count(*) as n from friend_blocks where user_id = ? or blocked_id = ?', gone.user.id, gone.user.id)) === 0, 'frTidy drops friend_blocks rows');
    ok((await nOf('select count(*) as n from friend_events where from_id = ? or to_id = ?', gone.user.id, gone.user.id)) === 0, 'frTidy drops friend_events rows');
  }
}

/* ---------------- backends ---------------- */
async function inNode() {
  const { d1 } = require(path.join(ROOT, 'cloudflare', 'd1_node.js'));
  const worker = (await import(path.join(ROOT, 'cloudflare', 'worker.js'))).default;
  const DB = d1(), mail = fakeMail();
  DB.raw.exec(require('fs').readFileSync(path.join(ROOT, 'cloudflare', 'schema.sql'), 'utf8')); // a second apply: the schema must be safe to re-run
  const env = { DB, RESEND_API_KEY: 're_test', MAIL_FETCH: mail.fetch, MAIL_WAIT: '1', TIDY: '1' }; // TIDY: tidy after every request (Dog Cards: a deleted account)
  const call = async (method, p, body, token, headers) => {
    const h = Object.assign({}, headers || {}); if (token) h.Authorization = 'Bearer ' + token;
    let b; if (body !== null && body !== undefined) { b = typeof body === 'string' ? body : JSON.stringify(body); h['Content-Type'] = 'application/json'; }
    const res = await worker.fetch(new Request('https://api.test' + p, { method, headers: h, body: method === 'GET' || method === 'OPTIONS' ? undefined : b }), env, { waitUntil() {} });
    const text = method === 'OPTIONS' ? '' : await res.text(); let json = null; try { json = JSON.parse(text); } catch (e) { json = null; }
    return { status: res.status, headers: res.headers, text, json };
  };
  const sql = async (q, ...a) => { const write = a[a.length - 1] === true; if (write) a.pop(); const st = DB.raw.prepare(q); return write ? st.run(...a) : st.get(...a); };
  await checks('in-process Node, D1 over node:sqlite', call, sql, mail);
  { // in production the code mail goes out through ctx.waitUntil, after the answer (an account is not answered any slower)
    delete env.MAIL_WAIT; const pend = [], m1 = mail.mails.length;
    const res = await worker.fetch(new Request('https://api.test/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '10.8.8.9' }, body: JSON.stringify({ email: 'forgetful2@example.com' }) }), env, { waitUntil(p) { pend.push(p); } });
    ok(res.status === 200 && pend.length >= 1 && mail.mails.length === m1, 'without MAIL_WAIT the answer comes first and the mail waits in ctx.waitUntil');
    await Promise.all(pend); ok(mail.mails.length === m1 + 1 && /^\d{6}$/.test(mail.mails[m1].code), 'and then it is sent');
    env.MAIL_WAIT = '1';
  }
  delete env.RESEND_API_KEY; const m0 = mail.mails.length; // no email service set up yet: the game is told, nothing is sent
  const r = await call('POST', '/forgot', { email: 'forgetful@example.com' }, null, { 'CF-Connecting-IP': '10.8.8.8' });
  ok(r.status === 200 && r.json.ok === true && r.json.mail === false && mail.mails.length === m0, 'without RESEND_API_KEY: { mail: false } and no email');
}
function findMiniflare() {
  const roots = [].concat((process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean), module.paths);
  for (const r of roots) for (const sub of ['miniflare', 'wrangler/node_modules/miniflare']) { try { return require(path.join(r, sub)); } catch (e) { /* next */ } }
  try { return require('miniflare'); } catch (e) { return null; }
}
async function inMiniflare() {
  const MF = findMiniflare();
  if (!MF) { console.log('--- Miniflare: not installed here (npm i -g wrangler); skipped'); return; }
  const fs = require('fs'), mail = fakeMail();
  const worker = {
    name: 'pawhaven-api', modules: true, script: require('fs').readFileSync(path.join(ROOT, 'cloudflare', 'worker.js'), 'utf8'), // the code itself: workerd refuses paths above its starting directory compatibilityDate: '2026-08-01',
    d1Databases: { DB: 'pawhaven-test-' + Date.now() },
    bindings: { RESEND_API_KEY: 're_test', MAIL_WAIT: '1', TIDY: '1' },
    outboundService: (req) => (req.url.startsWith('https://api.resend.com/') ? mail.fetch(req) : new Response('{}', { status: 404 }))
  };
  let mf; // Miniflare 4 takes the worker's options at the top; Miniflare 5 wants them in workers[]
  try { mf = new MF.Miniflare(Object.assign({ d1Persist: false }, worker)); } catch (e) { mf = new MF.Miniflare({ workers: [worker] }); }
  try {
    const DB = await mf.getD1Database('DB');
    const schema = fs.readFileSync(path.join(ROOT, 'cloudflare', 'schema.sql'), 'utf8').replace(/--.*$/gm, '');
    for (let pass = 0; pass < 2; pass++) { // a second apply: the schema must be safe to re-run
      for (const s of schema.split(';').map((x) => x.trim()).filter(Boolean)) await DB.prepare(s).run();
    }
    const call = async (method, p, body, token, headers) => {
      const h = Object.assign({}, headers || {}); if (token) h.Authorization = 'Bearer ' + token;
      let b; if (body !== null && body !== undefined) { b = typeof body === 'string' ? body : JSON.stringify(body); h['Content-Type'] = 'application/json'; }
      const res = await mf.dispatchFetch('https://api.test' + p, { method, headers: h, body: method === 'GET' || method === 'OPTIONS' ? undefined : b });
      const text = await res.text(); let json = null; try { json = JSON.parse(text); } catch (e) { json = null; }
      return { status: res.status, headers: res.headers, text, json };
    };
    const sql = async (q, ...a) => { const write = a[a.length - 1] === true; if (write) a.pop(); const st = DB.prepare(q).bind(...a); return write ? st.run() : st.first(); };
    await checks('Miniflare (workerd + local D1)', call, sql, mail);
  } finally { await mf.dispose(); }
}

(async () => {
  const t0 = Date.now();
  try { await inNode(); await inMiniflare(); } catch (e) { fails++; console.log('  CRASH', e && e.stack || e); }
  console.log(`${passes} passed, ${fails} failed (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  if (!fails) console.log('ALL OK');
  process.exit(fails ? 1 : 0);
})();
