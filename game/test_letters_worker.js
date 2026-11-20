// v2.32 "A letter from your dog" (V232_letters.md 7): the Worker's letters routes and its cron against a local D1 (cloudflare/d1_node.js),
// Resend faked. No network, no real email.
//   node game/test_letters_worker.js      (or: node game/run_tests.js letters_worker)      LETTERS_SNAP=write rewrites game/test_letters_snap.json
// The gate (constant vs the game's, 404 soon, the variable, missing secrets), opt-in (guest, pending, the confirmation email and its caps,
// language), tokens (valid, forged, expired, the other kind), confirm and unsubscribe (GET changes nothing, POST does), the cron (weekday and
// hour in JST, the 48 hour window, one letter a week, retries, the run cap and its backlog, the day cap, 429 and 5xx give the claim back,
// two runs at once), away weeks 1/2/4, the 8-week goodbye and the silence after it, playing again, the letter's text (snapshots in en and
// ja, all 12 languages), name safety, headers, the bounce and complaint hook, deletion, what the table keeps. Prints ALL OK when every check passes.
process.removeAllListeners('warning'); // node:sqlite is still "experimental" on Node 22
const path = require('path'), fs = require('fs'), crypto = require('crypto'), cp = require('child_process');
const ROOT = path.join(__dirname, '..'), SNAP = path.join(__dirname, 'test_letters_snap.json');
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.log('  FAIL', m); } };
const sec = (s) => console.log('--- ' + s);

(async () => {
  const t0 = Date.now();
  try {
    const { d1 } = require(path.join(ROOT, 'cloudflare', 'd1_node.js'));
    const worker = (await import(path.join(ROOT, 'cloudflare', 'worker.js'))).default;
    const TXT = await import(path.join(ROOT, 'cloudflare', 'letters_text.js'));
    const DB = d1(), raw = DB.raw, KEY = 'test-letters-key-0123456789abcdef', HOOK = 'whsec_' + Buffer.from('hook-secret-0123456789').toString('base64');
    // a fake Resend: every email lands in mails[]; mail.plan = [status, ...] answers the next sends with those statuses
    const mail = { mails: [], plan: [], seen: new Set() };
    mail.fetch = async (u, o) => {
      if (u !== 'https://api.resend.com/emails' || o.headers.Authorization !== 'Bearer re_test') return new Response('{"message":"bad"}', { status: 401 });
      const st = mail.plan.length ? mail.plan.shift() : 200; if (st !== 200) return new Response('{"message":"no"}', { status: st });
      const m = JSON.parse(o.body); m.idem = o.headers['Idempotency-Key'] || '';
      if (m.idem && mail.seen.has(m.idem)) return new Response('{"id":"same"}', { status: 200 }); // Resend: the same key is the same email
      if (m.idem) mail.seen.add(m.idem);
      mail.mails.push(m); return new Response('{"id":"mail_' + mail.mails.length + '"}', { status: 200 });
    };
    const env = { DB, TIDY: '1', RATE_SCALE: '1', BT_FROM: '0', LETTERS_FROM: '0', RESEND_API_KEY: 're_test', LETTERS_KEY: KEY, MAIL_FETCH: mail.fetch, MAIL_WAIT: '1' };
    let ipN = 0;
    const freshIp = () => '10.32.' + ((++ipN >> 8) & 255) + '.' + (ipN & 255);
    const call = async (method, p, body, token, o) => {
      o = o || {}; const h = Object.assign({ 'CF-Connecting-IP': o.ip || freshIp() }, o.headers || {}); if (token) h.Authorization = 'Bearer ' + token;
      let b; if (typeof body === 'string') b = body; else if (body !== null && body !== undefined) { b = JSON.stringify(body); h['Content-Type'] = 'application/json'; }
      const res = await worker.fetch(new Request('https://api.test' + p, { method, headers: h, body: method === 'GET' ? undefined : b }), Object.assign({}, env, o.env || {}), { waitUntil() {} });
      const text = await res.text(); let json = null; try { json = JSON.parse(text); } catch (e) { json = null; }
      return { status: res.status, text, json, headers: res.headers };
    };
    const without = (...ks) => { const e = {}; ks.forEach((k) => { e[k] = undefined; }); return e; };
    const n = (sql, ...a) => raw.prepare(sql).get(...a).n;
    const row = (id) => raw.prepare('select * from letters where user_id = ?').get(id);
    const is = (r, status, err) => r.status === status && r.json && r.json.error === err;
    const shut = (r) => r.status === 404 && r.json && r.json.error === 'not_found' && r.json.soon === true;
    let accN = 0;
    const account = async () => {
      const g = (await call('POST', '/guest', {})).json, email = 'lt' + (++accN) + '@example.com';
      const r = (await call('POST', '/register', { email, password: 'pupper123' }, g.token)).json;
      return { tok: r.token, id: r.user.id, email };
    };
    // a save as the game would store it: one dog and the weekly notes (S.ltr)
    const saveOf = (o) => {
      o = o || {}; const id = 'd1';
      return { v: 1, activeId: id, daysPlayed: o.days === undefined ? 12 : o.days, dogs: [{ id, name: o.name === undefined ? 'Mochi' : o.name, key: o.key || 'shiba', bond: { level: o.lv || 4, pts: o.pts || 150 } }],
        story: { ch: 3, c: o.story || {} }, ltr: { st: 'on', ask: 1, b: o.b || [], ev: o.ev || [] } };
    };
    const putSave = (acc, data, at) => raw.prepare('insert into saves (user_id, data, rev, changed_at, device, updated_at) values (?, ?, 1, ?, null, ?) on conflict(user_id) do update set data = excluded.data, updated_at = excluded.updated_at')
      .run(acc.id, typeof data === 'string' ? data : JSON.stringify(data), new Date(at).toISOString(), new Date(at).toISOString());
    const tokOf = (m) => (m.text.match(/[?]t=(v1\.[A-Za-z0-9._-]+)/) || [])[1] || '';
    // turn letters on for a new account through the real routes: ask, read the email, press the page's button
    const subscribe = async (lang) => {
      const a = await account(), m0 = mail.mails.length;
      const r = await call('POST', '/letters', { on: true, lang: lang || 'en' }, a.tok);
      if (r.status !== 200 || mail.mails.length !== m0 + 1) throw new Error('subscribe: ' + r.status + ' ' + r.text);
      const c = await call('POST', '/letters/confirm?t=' + tokOf(mail.mails[m0]), '');
      if (c.status !== 200) throw new Error('confirm: ' + c.status);
      return a;
    };
    const cron = (now, extra) => worker.scheduled({ scheduledTime: now }, Object.assign({}, env, extra || {}), {});
    const sign = (kind, lid, expS, key) => { const e = expS.toString(36); return `v1.${kind}.${lid}.${e}.` + crypto.createHmac('sha256', key || KEY).update(`dd-letter-v1|${kind}|${lid}|${e}`).digest('base64url'); };
    const H = 3600e3, DAY = 864e5, WEEK = 7 * DAY;
    // the first Sunday 10:00 JST after now (so every week id in the cron tests is later than the rows' own week)
    const SUN = (() => { const j = new Date(Date.now() + 9 * H); let s = Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate() - j.getUTCDay(), 10) - 9 * H; while (s <= Date.now()) s += WEEK; return s; })();
    const weekId = (t) => new Date(t + 9 * H).toISOString().slice(0, 10);
    const src = fs.readFileSync(path.join(ROOT, 'cloudflare', 'worker.js'), 'utf8'), game = fs.readFileSync(path.join(ROOT, 'game', 'src', '59b_letters.js'), 'utf8');

    sec('0. the launch gate');
    {
      const w = (src.match(/\nconst LETTERS_FROM = '([^']*)';/) || [])[1], g = (game.match(/\nconst LT_FROM = '([^']*)';/) || [])[1];
      ok(w !== undefined && g !== undefined && w === g, "the Worker's LETTERS_FROM is the game's LT_FROM ('" + w + "' / '" + g + "')");
      ok(w === '' || /^\d{4}-\d{2}-\d{2}$/.test(w), 'the launch date is empty (not launched) or a YYYY-MM-DD day');
      const a = await account(), was = { rate: n("select count(*) as n from rate where k like 'lt:%'"), rows: n('select count(*) as n from letters') };
      const soon = String(Date.now() + H);
      for (const [name, e] of [['no variable (the built-in date)', without('LETTERS_FROM')], ['the variable "off"', { LETTERS_FROM: 'off' }], ['a later time (ms)', { LETTERS_FROM: soon }], ['a later time (ISO)', { LETTERS_FROM: new Date(Date.now() + H).toISOString() }], ['no LETTERS_KEY', without('LETTERS_KEY')], ['no RESEND_API_KEY', without('RESEND_API_KEY')]]) {
        if (name.startsWith('no variable') && w) continue; // once the owner has set the date, the built-in gate is not "shut" any more
        const rs = [await call('GET', '/letters', null, a.tok, { env: e }), await call('POST', '/letters', { on: true }, a.tok, { env: e }), await call('GET', '/letters', null, null, { env: e }),
          await call('GET', '/letters/confirm?t=x', null, null, { env: e }), await call('POST', '/letters/unsub?t=x', '', null, { env: e }), await call('POST', '/letters/hook', '{}', null, { env: e })];
        ok(rs.every(shut), 'shut with ' + name + ': every /letters route answers 404 not_found (soon): ' + rs.map((x) => x.status).join(' '));
        const c = await cron(Date.now(), e); ok(c.ran === false && c.why === 'shut' && c.sent === 0, 'shut with ' + name + ': the cron does nothing');
      }
      ok(n("select count(*) as n from rate where k like 'lt:%'") === was.rate && n('select count(*) as n from letters') === was.rows && mail.mails.length === 0, 'a shut route spends no rate row, writes no row, sends nothing');
      ok((await call('GET', '/me', null, a.tok, { env: { LETTERS_FROM: 'off' } })).status === 200, 'the other routes are open as before');
      ok((await call('GET', '/letters', null, a.tok, { env: { LETTERS_FROM: String(Date.now() - 1000) } })).status === 200 && (await call('GET', '/letters', null, a.tok, { env: { LETTERS_FROM: new Date(Date.now() - H).toISOString() } })).status === 200, 'a past LETTERS_FROM (ms or ISO) opens it');
      ok(w ? true : shut(await call('GET', '/letters', null, a.tok, { env: { LETTERS_FROM: 'not a date' } })), 'a broken value falls back to the built-in date');
      ok(/import \{[^}]*\} from '\.\/letters_text\.js';/.test(src) && /letters_text\.js=@cloudflare\/letters_text\.js/.test(fs.readFileSync(path.join(ROOT, 'tools', 'cf_api_deploy.sh'), 'utf8')), 'the deploy uploads letters_text.js next to worker.js');
    }

    sec('1. opt-in');
    const A = await account();
    {
      ok(is(await call('GET', '/letters'), 401, 'no_session') && is(await call('POST', '/letters', { on: true }), 401, 'no_session'), 'no login: 401');
      const g = (await call('POST', '/guest', {})).json;
      ok(is(await call('GET', '/letters', null, g.token), 403, 'no_account') && is(await call('POST', '/letters', { on: true }, g.token), 403, 'no_account') && n('select count(*) as n from letters') === 0, 'a guest: 403 no_account, no row');
      for (const b of [{}, { on: 'yes' }, { on: true, x: 1 }, { lang: 5 }, { on: 1 }]) ok(is(await call('POST', '/letters', b, A.tok), 400, 'bad'), 'a bad body is refused: ' + JSON.stringify(b));
      const g0 = await call('GET', '/letters', null, A.tok);
      ok(g0.status === 200 && g0.json.state === 'off' && g0.json.lang === null && g0.json.day === 0 && g0.json.hour === 10, 'off by default: ' + g0.text);
      ok((await call('POST', '/letters', { lang: 'ja' }, A.tok)).json.state === 'off' && !row(A.id), 'a language alone never makes a row');
      ok((await call('POST', '/letters', { on: false }, A.tok)).json.state === 'off' && !row(A.id), 'off when already off: still off, no row');
      const r = await call('POST', '/letters', { on: true, lang: 'en' }, A.tok), R = row(A.id), m = mail.mails[mail.mails.length - 1];
      ok(r.status === 200 && r.json.state === 'pending' && r.json.lang === 'en', 'on: pending until the address says yes: ' + r.text);
      ok(!!R && R.state === 'pending' && R.lang === 'en' && R.ok_at === null && R.quiet === 0 && /^[A-Za-z0-9_-]{22}$/.test(R.lid) && R.lid !== A.id && Math.abs(R.at - Date.now()) < 5000, 'the row: pending, the language, a random link id that is not the user id');
      ok(R.last_week === weekId(SUN - WEEK), 'a new row starts at the current week (' + R.last_week + '), so the first letter is the next Sunday\'s');
      ok(mail.mails.length === 1 && m.to.length === 1 && m.to[0] === A.email && m.subject === TXT.LT_TEXT.en.m_c_subj && /letters@doodledoggo\.app/.test(m.from) && m.reply_to === 'contact@doodledoggo.app', 'one confirmation email, to the account\'s own address, from letters@doodledoggo.app');
      ok(m.text.includes('https://api.doodledoggo.app/letters/confirm?t=v1.c.' + R.lid + '.') && m.html.includes('/letters/confirm?t=v1.c.') && !m.headers && !m.idem, 'it carries the signed confirm link (and no list headers: it is not a letter)');
      ok(!/Mochi|<script|<img|http:\/\//i.test(m.html + m.text) && (m.html.match(/href="([^"]+)"/g) || []).every((h) => /href="https:\/\/(api\.doodledoggo\.app\/letters\/confirm\?t=|doodledoggo\.app")/.test(h)), 'fixed text only: no dog name, no image, no script, only our own two links');
      ok((await call('GET', '/letters', null, A.tok)).json.state === 'pending', 'GET says pending');
      // the language follows the game without another email
      const m1 = mail.mails.length;
      ok((await call('POST', '/letters', { lang: 'de' }, A.tok)).json.lang === 'de' && row(A.id).lang === 'de' && mail.mails.length === m1, 'a language alone updates the row and sends nothing');
      ok((await call('POST', '/letters', { lang: 'klingon' }, A.tok)).json.lang === 'en', 'an unknown language is English');
      // "Send it again": 3 confirmation emails a Japan day per account
      ok((await call('POST', '/letters', { on: true, lang: 'ja' }, A.tok)).json.state === 'pending' && mail.mails.length === m1 + 1 && row(A.id).lang === 'ja' && mail.mails[m1].subject === (TXT.LT_TEXT.ja.m_c_subj || TXT.LT_TEXT.en.m_c_subj), 'asked again: a second email, in the new language');
      ok((await call('POST', '/letters', { on: true }, A.tok)).status === 200 && mail.mails.length === m1 + 2 && row(A.id).lang === 'ja', 'a third one, the language kept');
      const r4 = await call('POST', '/letters', { on: true }, A.tok);
      ok(is(r4, 429, 'rate_limited') && r4.json.state === 'pending' && mail.mails.length === m1 + 2, 'the fourth that day: 429 rate_limited, no email, still pending');
      // and 6 in 30 days: an address that never says yes is left alone (the daily counters cleared here, as on later days)
      const day = (k) => "delete from rate where k like 'lt:c:" + A.id + ":%'";
      raw.exec(day()); const m5 = mail.mails.length, later = [];
      for (let i = 0; i < 3; i++) later.push(await call('POST', '/letters', { on: true }, A.tok));
      raw.exec(day()); later.push(await call('POST', '/letters', { on: true }, A.tok));
      ok(later.slice(0, 3).every((x) => x.status === 200) && is(later[3], 429, 'rate_limited') && mail.mails.length === m5 + 3 && row(A.id).state === 'pending', 'six confirmation emails in 30 days per account, then 429 whatever the day');
      const ip = freshIp(), many = []; for (let i = 0; i < 11; i++) { const x = await account(); many.push(await call('POST', '/letters', { on: true }, x.tok, { ip })); }
      ok(many.slice(0, 10).every((x) => x.status === 200) && is(many[10], 429, 'rate_limited'), 'ten confirmation emails an hour per IP, then 429');
      raw.exec("delete from letters where user_id != '" + A.id + "'");
    }

    sec('2. the confirm link');
    {
      const R = row(A.id), all = mail.mails.filter((m) => m.to[0] === A.email), t = tokOf(all[all.length - 1]);
      ok(/^v1\.c\.[A-Za-z0-9_-]{22}\.[0-9a-z]+\.[A-Za-z0-9_-]{43}$/.test(t), 'the token: v1.c.<link id>.<expiry>.<signature>');
      const g = await call('GET', '/letters/confirm?t=' + t, null, null, { headers: { 'Accept-Language': 'fr' } });
      ok(g.status === 200 && /text\/html/.test(g.headers.get('content-type')) && /<form method="post">/.test(g.text) && g.text.includes(TXT.LT_TEXT.ja.m_c_btn || TXT.LT_TEXT.en.m_c_btn) && row(A.id).state === 'pending', 'GET shows a page with one button (the row\'s language) and changes nothing: a mail scanner cannot confirm');
      ok(g.headers.get('cache-control') === 'no-store' && /noindex/.test(g.headers.get('x-robots-tag')) && /default-src 'none'/.test(g.headers.get('content-security-policy')) && g.headers.get('referrer-policy') === 'no-referrer' && !/<script/i.test(g.text), 'the page: not cached, not indexed, no scripts, no referrer');
      const flip = t.slice(0, -1) + (t.endsWith('A') ? 'B' : 'A');
      const bads = { forged: flip, 'the unsubscribe kind': sign('u', R.lid, Math.floor(Date.now() / 1000) + 600), expired: sign('c', R.lid, Math.floor(Date.now() / 1000) - 5), 'another key': sign('c', R.lid, Math.floor(Date.now() / 1000) + 600, 'other-key'), garbage: 'hello', empty: '', 'no row': sign('c', 'A'.repeat(22), Math.floor(Date.now() / 1000) + 600) };
      for (const k of Object.keys(bads)) { const x = await call('POST', '/letters/confirm?t=' + encodeURIComponent(bads[k]), ''); ok(x.status === 400 && /text\/html/.test(x.headers.get('content-type')) && !/<form/.test(x.text) && row(A.id).state === 'pending', 'a ' + k + ' token: a kind page, 400, nothing changes'); }
      const p = await call('POST', '/letters/confirm?t=' + t, '');
      ok(p.status === 200 && row(A.id).state === 'on' && Math.abs(row(A.id).ok_at - Date.now()) < 5000 && p.text.includes(TXT.LT_TEXT.ja.m_p_conf_ok_h || TXT.LT_TEXT.en.m_p_conf_ok_h), 'POST turns it on');
      ok((await call('POST', '/letters/confirm?t=' + t, '')).status === 200 && (await call('GET', '/letters/confirm?t=' + t)).status === 200 && row(A.id).state === 'on', 'the link pressed again: still on, the same kind page');
      ok((await call('GET', '/letters', null, A.tok)).json.state === 'on', 'GET says on');
      const m0 = mail.mails.length, r = await call('POST', '/letters', { on: true, lang: 'en' }, A.tok);
      ok(r.json.state === 'on' && r.json.lang === 'en' && mail.mails.length === m0, 'on when already on: the language is updated, no email');
      const ip = freshIp(); let last; for (let i = 0; i < 61; i++) last = await call('GET', '/letters/confirm?t=x', null, null, { ip });
      ok(last.status === 429 && /text\/html/.test(last.headers.get('content-type')), 'the pages: 60 an hour per IP');
    }

    sec('3. the cron: when, once a week, retries');
    const letters = (from) => mail.mails.slice(from || 0).filter((m) => m.headers && m.headers['List-Unsubscribe']);
    putSave(A, saveOf({}), SUN - 2 * DAY);
    {
      const m0 = mail.mails.length;
      for (const [name, t] of [['Saturday 23:00 JST', SUN - 11 * H], ['Sunday 09:59 JST', SUN - 60e3], ['Wednesday', SUN - 4 * DAY]]) { const c = await cron(t); ok(c.ran === false && c.why === 'window' && mail.mails.length === m0, name + ': outside the window, nothing is sent'); }
      const c = await cron(SUN), L = letters(m0), m = L[0], R = row(A.id);
      ok(c.ran && c.week === weekId(SUN) && c.due === 1 && c.sent === 1 && L.length === 1, 'Sunday 10:00 JST: one letter: ' + JSON.stringify(c));
      ok(R.last_week === weekId(SUN) && new Date(SUN + 9 * H).getUTCDay() === 0 && new Date(SUN + 9 * H).getUTCHours() === 10, 'the week is that Sunday\'s JST date (' + R.last_week + ')');
      ok(m.to.length === 1 && m.to[0] === A.email && m.subject === 'A letter from Mochi' && m.idem === 'dd-letter/' + R.lid + '/' + weekId(SUN), 'to the account\'s address, with the Idempotency-Key dd-letter/<link id>/<week>');
      const u = (m.headers['List-Unsubscribe'].match(/^<(https:\/\/api\.doodledoggo\.app\/letters\/unsub\?t=v1\.u\.[^>]+)>$/) || [])[1];
      ok(!!u && m.headers['List-Unsubscribe-Post'] === 'List-Unsubscribe=One-Click' && m.text.includes(u) && m.html.includes(u.replace(/&/g, '&amp;')), 'List-Unsubscribe and List-Unsubscribe-Post headers, and the same signed link in the text and the HTML');
      const hrefs = (m.html.match(/(?:href|src)="[^"]+"/g) || []);
      ok(hrefs.length === 2 && hrefs.every((h) => h === 'href="' + u + '"' || h === 'href="https://doodledoggo.app"') && !/<img|<script|<link|@import|url\(/i.test(m.html), 'no tracking: no image, no script, no web font, two plain links (unsubscribe and doodledoggo.app)');
      ok(!/coin|buy|shop|sale|offer/i.test(m.text) && m.text.includes('Dear human,') && m.text.includes('Gerald'), 'the dog writes, Gerald signs off, nothing is for sale');
      const im = await (async () => { const x = await subscribe(); putSave(x, saveOf({}), SUN); const k = mail.mails.length; await cron(SUN, { LETTERS_IMG: '1' }); const mm = letters(k)[0]; raw.prepare('delete from letters where user_id = ?').run(x.id); return mm; })();
      ok(/<img src="https:\/\/doodledoggo\.app\/img\/mail\/letter\.png" [^>]*alt=""/.test(im.html) && (im.html.match(/src="/g) || []).length === 1, 'with LETTERS_IMG=1: the one header image, the same address for everyone');
      const m1 = mail.mails.length;
      for (const [name, t] of [['the same hour again (a cron retry)', SUN], ['an hour later', SUN + H], ['Monday', SUN + 30 * H], ['hour 47', SUN + 47 * H]]) { const x = await cron(t); ok(x.ran && x.due === 0 && x.sent === 0 && mail.mails.length === m1, name + ': nothing more this week'); }
      ok((await cron(SUN + 49 * H)).why === 'window', 'after 48 hours the window is shut');
      const c2 = await cron(SUN + WEEK);
      ok(c2.sent === 1 && letters(m1).length === 1 && row(A.id).last_week === weekId(SUN + WEEK) && letters(m1)[0].idem.endsWith('/' + weekId(SUN + WEEK)), 'the next Sunday: the next letter');
      // rows that are not on, and an account without a save
      const P = await account(); await call('POST', '/letters', { on: true }, P.tok); putSave(P, saveOf({}), SUN + WEEK);
      const N = await subscribe(); // on, but nothing saved yet
      const m2 = mail.mails.length, c3 = await cron(SUN + 2 * WEEK);
      ok(c3.due === 2 && c3.sent === 1 && c3.skipped === 1 && letters(m2).length === 1 && letters(m2)[0].to[0] === A.email, 'a pending row gets no letter, an account without a save is skipped: ' + JSON.stringify(c3));
      ok(row(N.id).last_week === weekId(SUN + 2 * WEEK) && row(P.id).state === 'pending', 'the skipped row is handled for the week');
      raw.prepare('delete from letters where user_id in (?, ?)').run(P.id, N.id);
    }

    sec('4. the run cap, the backlog, the day cap, Resend saying no');
    {
      const T = SUN + 3 * WEEK, wk = weekId(T), many = [];
      raw.prepare('update letters set last_week = ? where user_id = ?').run('2999-01-01', A.id); // A sits the rest out
      for (let i = 0; i < 7; i++) { const x = await subscribe(); putSave(x, saveOf({ name: 'Dog' + i }), T - DAY); many.push(x); }
      const m0 = mail.mails.length, runs = [];
      for (let i = 0; i < 4; i++) runs.push(await cron(T + i * H, { LETTERS_CAP: '3' }));
      ok(runs.map((x) => x.sent).join(',') === '3,3,1,0' && runs.map((x) => x.due).join(',') === '3,3,1,0', 'LETTERS_CAP 3 with 7 due: 3, 3, 1, 0 (the backlog goes with the next hourly runs)');
      const got = letters(m0).map((m) => m.to[0]).sort();
      ok(got.length === 7 && new Set(got).size === 7 && many.every((x) => got.includes(x.email)), 'each account exactly one letter');
      // the day cap (UTC day): Resend's free plan is 100 a day, and Forgot password shares it
      const played = (t) => many.forEach((x, i) => putSave(x, saveOf({ name: 'Dog' + i }), t - DAY));
      const T2 = T + WEEK, m1 = mail.mails.length; played(T2); const d1 = await cron(T2, { LETTERS_DAY: '2' });
      ok(d1.sent === 2 && d1.back === 5 && n('select count(*) as n from letters where last_week = ?', weekId(T2)) === 2, 'LETTERS_DAY 2: two go, five claims are given back: ' + JSON.stringify(d1));
      const d2 = await cron(T2 + H, { LETTERS_DAY: '2' });
      ok(d2.ran === false && d2.why === 'day' && mail.mails.length === m1 + 2, 'the same UTC day again: the day is full, nothing is sent');
      const d3 = await cron(T2 + 24 * H, { LETTERS_DAY: '2' });
      ok(d3.sent === 2 && mail.mails.length === m1 + 4, 'the next UTC day (still inside the window): two more');
      const d4 = await cron(T2 + 25 * H);
      ok(d4.sent === 3 && new Set(letters(m1).map((m) => m.to[0])).size === 7 && letters(m1).length === 7, 'the rest with the cap lifted: seven letters, seven accounts');
      // Resend busy (429) and down (500): the claim goes back and the run ends; a refusal for good (422) is not retried
      const T3 = T2 + WEEK, m2 = mail.mails.length; played(T3); mail.plan = [200, 429];
      const e1 = await cron(T3);
      ok(e1.sent === 1 && e1.back === 6 && e1.why === 'resend 429' && n('select count(*) as n from letters where last_week = ?', weekId(T3)) === 1, '429 on the second send: one sent, six claims given back, the run ends: ' + JSON.stringify(e1));
      mail.plan = [500];
      const e2 = await cron(T3 + H);
      ok(e2.sent === 0 && e2.back === 6 && e2.why === 'resend 500', '500: nothing sent, all six wait');
      mail.plan = [422];
      const e3 = await cron(T3 + 2 * H);
      ok(e3.sent === 5 && e3.failed === 1 && e3.back === 0 && letters(m2).length === 6, '422 (refused for good): that one is handled, the other five go: ' + JSON.stringify(e3));
      ok((await cron(T3 + 3 * H)).due === 0, 'nobody is asked twice');
      const failEnv = { MAIL_FETCH: async () => { throw new Error('network'); } }, T4 = T3 + WEEK; played(T4);
      const e4 = await cron(T4, failEnv);
      ok(e4.sent === 0 && e4.back === 7 && e4.why === 'resend 0', 'the network down: every claim goes back: ' + JSON.stringify(e4));
      // two runs at the same moment: one letter each
      const m3 = mail.mails.length, both = await Promise.all([cron(T4 + H), cron(T4 + H)]);
      ok(both[0].sent + both[1].sent === 7 && letters(m3).length === 7 && new Set(letters(m3).map((m) => m.idem)).size === 7, 'two runs at once: seven letters in all, never two for one account: ' + both.map((x) => x.sent).join(' + '));
      raw.prepare("delete from letters where user_id != ?").run(A.id);
      raw.exec("delete from rate where k like 'lt:day:%'");
    }

    sec('5. away: a kind letter in weeks 1, 2 and 4, a last one at 8 weeks, then nothing');
    {
      const B = await subscribe(), T = SUN + 20 * WEEK;
      putSave(B, saveOf({ name: 'Biscuit', key: 'corgi' }), T - DAY);
      raw.prepare('update letters set last_week = ? where user_id = ?').run('2999-01-01', A.id);
      const kinds = [], texts = [];
      for (let k = 0; k <= 10; k++) { const m0 = mail.mails.length; await cron(T + k * WEEK); const L = letters(m0); texts.push(L[0] ? L[0].text : ''); kinds.push(!L[0] ? '-' : L[0].text.includes(TXT.LT_TEXT.en.m_bye2) ? 'bye' : L[0].text.includes(TXT.LT_TEXT.en.m_miss) ? 'away' : 'week'); }
      ok(kinds.join(' ') === 'week away away - away - - - bye - -', 'played a day before week 0, then away: ' + kinds.join(' '));
      ok(texts[1].includes('three new nap spots') && texts[2].includes('watching the clouds') && texts[4].includes('practising my sit'), 'weeks 1, 2 and 4 each have their own calm line');
      ok([1, 2, 4].every((k) => texts[k].includes('I miss you a little, in the happy way.') && texts[k].includes('There is no hurry at all.')) && !/sad|lonely|hungry|waiting for you|come back|forgot/i.test(texts.join(' ')), 'gentle: "I miss you a little, in the happy way", no guilt, nothing bad');
      ok(texts[8].includes('my last letter for now') && texts[8].includes('No more letters will come unless you play again.') && mail.mails.filter((m) => m.to[0] === B.email && /last letter/.test(m.subject)).length === 1, 'week 8: one last kind letter, with its own subject and footer');
      ok(row(B.id).quiet === 1 && row(B.id).state === 'on' && row(B.id).last_week === weekId(T + 10 * WEEK), 'then quiet: the row stays on, the weeks pass with no email');
      putSave(B, saveOf({ name: 'Biscuit', key: 'corgi' }), T + 10 * WEEK + DAY); // they played again
      const m0 = mail.mails.length; await cron(T + 11 * WEEK);
      ok(letters(m0).length === 1 && letters(m0)[0].text.includes('See you in the yard.') && row(B.id).quiet === 0, 'played again: the weekly letter is back and quiet is cleared');
      // the answer is the same all through the window (a late backlog run never shifts the away week)
      const C = await subscribe(); putSave(C, saveOf({}), T + 12 * WEEK - 8 * DAY - H);
      const m1 = mail.mails.length; await cron(T + 12 * WEEK + 40 * H);
      ok(letters(m1).some((m) => m.to[0] === C.email && m.text.includes('three new nap spots')), 'a run late in the window still counts the days from the week\'s start (away week 1)');
      raw.prepare('delete from letters where user_id in (?, ?)').run(B.id, C.id);
    }

    sec('6. the letter\'s words');
    {
      const T = Date.parse('2027-03-07T10:00:00+09:00'), wk = weekId(T), day = (k) => new Date(Date.parse(wk + 'T00:00:00Z') - k * DAY).toISOString().slice(0, 10);
      const full = saveOf({ name: 'Mochi', key: 'shiba', lv: 4, pts: 150, days: 12, b: [[day(9), 'd1', 2, 10], [day(6), 'd1', 3, 90], [day(2), 'd1', 4, 20]],
        ev: [[day(8), 'w', 9], [day(8), 't', 'Sit'], [day(5), 'w', 2], [day(3), 'w', 1], [day(3), 't', 'Roll Over'], [day(2), 'wi', 2], [day(1), 'mk', 1], [day(1), 'v', 3]], story: { 2: day(4), 1: day(20), 3: 'test' } });
      // a fixed Sunday and (for the snapshots) a fixed link id, so the letter is the same on every run (the opening line is picked from the id and the week)
      const letterFor = async (save, lang, at, lid) => { const x = await subscribe(lang); putSave(x, save, at === undefined ? T - DAY : at); raw.prepare("update letters set last_week = '', lid = coalesce(?, lid) where user_id = ?").run(lid || null, x.id); const m0 = mail.mails.length; const c = await cron(T, { LETTERS_DAY: '100000' }); const m = letters(m0).find((q) => q.to[0] === x.email) || null; raw.prepare('delete from letters where user_id = ?').run(x.id); return { m, c }; };
      const norm = (t) => t.replace(/[?]t=v1\.[A-Za-z0-9._-]+/g, '?t=TOKEN');
      ok(wk === '2027-03-07' && new Date(T + 9 * H).getUTCDay() === 0, 'the snapshot week is Sunday 7 March 2027');
      const en = (await letterFor(full, 'en', undefined, 'SnapshotLinkId00000001')).m, ja = (await letterFor(full, 'ja', undefined, 'SnapshotLinkId00000002')).m;
      const snap = fs.existsSync(SNAP) ? JSON.parse(fs.readFileSync(SNAP, 'utf8')) : {};
      const now = { en: { subject: en.subject, text: norm(en.text) }, ja: { subject: ja.subject, text: norm(ja.text) } };
      if (process.env.LETTERS_SNAP === 'write') { fs.writeFileSync(SNAP, JSON.stringify(now, null, 2) + '\n'); console.log('  wrote ' + path.relative(ROOT, SNAP)); }
      else for (const l of ['en', 'ja']) ok(!!snap[l] && snap[l].subject === now[l].subject && snap[l].text === now[l].text, 'the ' + l + ' letter is the snapshot (game/test_letters_snap.json)' + (snap[l] && snap[l].text !== now[l].text ? ':\n' + now[l].text : ''));
      ok(en.text.includes('We have played together on 12 days now.') && en.text.includes('we reached Bond 4 this week') && en.text.includes('I learned a new trick: Roll Over.') && en.text.includes('We finished chapter 2 of Gerald\'s storybook.') && !en.text.includes('walks this week') && en.text.includes('Mochi (Shiba)'),
        'en: days played, the Bond level reached this week, the two top highlights (the trick and the chapter), the sign-off with the breed');
      ok(!en.text.includes('chapter 3') && !en.text.includes('Sit.'), 'only the last 7 days count (an older trick and an undated chapter stay out)');
      ok(ja.subject !== en.subject && /[぀-ヿ]/.test(ja.text) && ja.text.includes('Mochi') && ja.text.includes('柴犬'), 'ja: Japanese text, the dog\'s name and the breed in Japanese');
      // every language renders, nothing left to fill in
      for (const l of TXT.LT_LANGS) {
        const m = (await letterFor(full, l)).m;
        ok(!!m && m.text.length > 200 && !/[{}]/.test(m.text + m.subject) && !/undefined|\[object/.test(m.text) && m.text.includes('Mochi') && m.html.includes('lang="' + (l === 'yue' ? 'yue-Hant-HK' : l) + '"'), l + ': the letter renders with no {var} left');
        if (l !== 'en') ok(Object.keys(TXT.LT_TEXT.en).every((k) => typeof TXT.LT_TEXT[l][k] === 'string' && TXT.LT_TEXT[l][k]) && m.text.split('\n')[0] !== en.text.split('\n')[0], l + ': every message is translated');
      }
      // the other lines
      const has = async (o, s, lang) => { const m = (await letterFor(saveOf(o), lang || 'en')).m; return !!m && m.text.includes(s) ? true : (console.log('    got: ' + (m ? m.text.split('\n\n').slice(1, 6).join(' / ') : 'no letter')), false); };
      ok(await has({ lv: 10 }, 'We are at Bond 10. Best friends. I checked.'), 'Bond 10');
      ok(await has({ lv: 3, pts: 80, b: [[day(3), 'd1', 3, 20]] }, 'Our Bond grew this week. We are at Bond 3'), 'the Bond grew inside its level');
      ok(await has({ lv: 3, pts: 20, b: [[day(3), 'd1', 3, 20]] }, 'We are at Bond 3. I like it here.') && await has({ lv: 3, b: [[day(3), 'other', 1, 0]] }, 'We are at Bond 3. I like it here.'), 'no change (or another dog\'s note): the plain Bond line');
      ok(await has({}, 'It was a quiet week. Quiet weeks have the best naps.'), 'no highlights: a quiet week');
      ok(await has({ ev: [[day(1), 'w', 1]] }, 'We went on 1 walk this week.') && await has({ ev: [[day(1), 'w', 3], [day(2), 'w', 2]] }, 'We went on 5 walks this week.'), 'walks: singular and plural');
      ok(await has({ ev: [[day(1), 'wi', 1]] }, 'A wish of mine came true this week.') && await has({ ev: [[day(1), 'dg', 1]] }, 'A new friend came home with us.') && await has({ ev: [[day(1), 'v', 1]] }, 'A friend\'s dog came to visit our yard.') && await has({ ev: [[day(1), 'mk', 1]] }, 'We brought something home from the market.'), 'a wish, a new dog, a friend\'s visit, a market buy');
      ok(await has({ ev: [[day(1), 't', 'Signature']] }, 'I learned a new trick. I am a genius.') && await has({ ev: [[day(1), 't', 'Play Dead']] }, 'I learned a new trick: Play Dead.') && await has({ ev: [[day(1), 't', '<b>x</b>']] }, 'I learned a new trick. I am a genius.'), 'a trick by its table name, any other text as "a new trick"');
      ok(!(await letterFor(saveOf({ days: 1 }), 'en')).m.text.includes('played together'), 'the first day: no days line');
      // name safety: the one typed text in a letter
      const nm = async (name) => (await letterFor(saveOf({ name }), 'en')).m;
      const x1 = await nm('<b>Rex</b> <script>alert(1)</script>');
      ok(!/<b>|<script|alert\(1\)<|&lt;script/.test(x1.html) && /A letter from b Rex \/b/.test(x1.subject) === false && !/[<>]/.test(x1.subject), 'a name with tags: no tag reaches the email: ' + x1.subject);
      const x2 = await nm('visit http://evil.example now'), x3 = await nm('www.evil.example'), x4 = await nm('a@b.c');
      ok([x2, x3, x4].every((m) => m.subject === 'A letter from Shiba' && !/evil|a@b/.test(m.text + m.html)), 'a name that looks like a link or an address is replaced by the breed');
      const x5 = await nm('Sir Fluffington The Third Of Barkshire'), x6 = await nm('Mo\nchi\r\nBcc: x'), x7 = await nm('  '), x8 = await nm(12345);
      ok(x5.subject === 'A letter from Sir Fluffington The Thir' && !/[\r\n]/.test(x6.subject) && x7.subject === 'A letter from Shiba' && x8.subject === 'A letter from Shiba', 'cut to 24 characters, no line breaks in the subject, an empty or odd name is the breed');
      const x9 = await nm('Tom & "Jerry\'s"');
      ok(x9.html.includes('Tom &amp; &quot;Jerry&#39;s&quot;') && x9.text.includes('Tom & "Jerry\'s"'), 'the HTML part escapes the name, the text part keeps it');
      ok((await letterFor({ v: 1, dogs: [] }, 'en')).m === null && (await letterFor('{not json', 'en')).m === null && (await letterFor('[1,2]', 'en')).m === null, 'a save without a dog, or one that will not parse: no letter, no error');
      ok((await letterFor({ v: 1, dog: { name: 'Old', key: 'pug' }, bond: { level: 2, pts: 5 } }, 'en')).m.text.includes('Old (Pug)') && (await letterFor(saveOf({ key: 'unicorn' }), 'en')).m.text.includes('Mochi (dog)'), 'an old save shape (S.dog) works, an unknown breed is "dog"');
    }

    sec('7. unsubscribe');
    {
      const U = await subscribe(), T = SUN + 50 * WEEK; putSave(U, saveOf({}), T - DAY);
      const m0 = mail.mails.length; await cron(T);
      const m = letters(m0).find((q) => q.to[0] === U.email), t = tokOf(m), lid = row(U.id).lid;
      ok(/^v1\.u\./.test(t), 'the letter carries an unsubscribe token');
      const g = await call('GET', '/letters/unsub?t=' + t);
      ok(g.status === 200 && /<form method="post">/.test(g.text) && g.text.includes(TXT.LT_TEXT.en.m_p_unsub_btn) && !!row(U.id), 'GET shows one button and changes nothing');
      for (const [k, bad] of [['forged', t.slice(0, -2) + (t.endsWith('AA') ? 'BB' : 'AA')], ['expired', sign('u', lid, Math.floor(Date.now() / 1000) - 5)], ['confirm-kind', sign('c', lid, Math.floor(Date.now() / 1000) + 600)]]) { const x = await call('POST', '/letters/unsub?t=' + bad, 'List-Unsubscribe=One-Click'); ok(x.status === 400 && !!row(U.id), 'a ' + k + ' token does not unsubscribe'); }
      ok(sign('u', lid, parseInt(t.split('.')[3], 36)) === t && Math.abs(parseInt(t.split('.')[3], 36) - (T / 1000 + 180 * 86400)) < 5, 'the link is signed with LETTERS_KEY and works for 180 days');
      const p = await call('POST', '/letters/unsub?t=' + t, 'List-Unsubscribe=One-Click', null, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      ok(p.status === 200 && !row(U.id) && p.text.includes(TXT.LT_TEXT.en.m_p_unsub_ok_h), 'the mail app\'s one-click POST (RFC 8058) deletes the row');
      ok((await call('POST', '/letters/unsub?t=' + t, '')).status === 200 && (await call('GET', '/letters/unsub?t=' + t)).status === 200, 'the link again: done already, the same kind page');
      ok((await call('GET', '/letters', null, U.tok)).json.state === 'off', 'the game sees off');
      const m1 = mail.mails.length; await cron(T + WEEK);
      ok(!letters(m1).some((q) => q.to[0] === U.email), 'no more letters');
      // from Settings
      const V = await subscribe(); ok((await call('POST', '/letters', { on: false }, V.tok)).json.state === 'off' && !row(V.id), 'off from Settings: the row is deleted');
      // a valid link works even with the gate shut again; nothing else does
      const W = await subscribe(); putSave(W, saveOf({}), T + WEEK); const m2 = mail.mails.length; await cron(T + 2 * WEEK); const tw = tokOf(letters(m2).find((q) => q.to[0] === W.email));
      ok(shut(await call('POST', '/letters/unsub?t=' + tw.slice(0, -2) + 'zz', '', null, { env: { LETTERS_FROM: 'off' } })) && shut(await call('GET', '/letters', null, W.tok, { env: { LETTERS_FROM: 'off' } })) && !!row(W.id), 'the gate shut again: a forged link and the other routes are 404');
      ok((await call('POST', '/letters/unsub?t=' + tw, '', null, { env: { LETTERS_FROM: 'off' } })).status === 200 && !row(W.id), 'the gate shut again: a valid unsubscribe link still works');
    }

    sec('8. bounces and complaints (Resend\'s webhook)');
    {
      const X = await subscribe(), Y = await subscribe(), Z = await subscribe();
      const hook = (body, o) => {
        o = o || {}; const raw2 = JSON.stringify(body), id = 'msg_' + Math.random().toString(36).slice(2), ts = String(Math.floor((o.at || Date.now()) / 1000));
        const sig = crypto.createHmac('sha256', Buffer.from((o.secret || HOOK).replace(/^whsec_/, ''), 'base64')).update(id + '.' + ts + '.' + raw2).digest('base64');
        return call('POST', '/letters/hook', o.tamper ? raw2.replace('@', '+x@') : raw2, null, { env: o.noSecret ? {} : { RESEND_WEBHOOK_SECRET: HOOK }, headers: { 'svix-id': id, 'svix-timestamp': ts, 'svix-signature': 'v1,' + sig, 'Content-Type': 'application/json' } });
      };
      const ev = (type, to, more) => ({ type, created_at: new Date().toISOString(), data: Object.assign({ email_id: 'e1', to: [to], subject: 'x' }, more || {}) });
      ok(is(await hook(ev('email.complained', X.email), { noSecret: true }), 404, 'not_found') && row(X.id).state === 'on', 'without RESEND_WEBHOOK_SECRET the hook is not there');
      ok(is(await hook(ev('email.complained', X.email), { secret: 'whsec_' + Buffer.from('wrong').toString('base64') }), 400, 'bad_signature') && is(await hook(ev('email.complained', X.email), { tamper: true }), 400, 'bad_signature') && is(await hook(ev('email.complained', X.email), { at: Date.now() - 10 * 60e3 }), 400, 'bad_signature') && row(X.id).state === 'on', 'a wrong secret, a changed body or an old timestamp: 400, nothing changes');
      ok((await hook(ev('email.delivered', X.email))).status === 200 && (await hook(ev('email.bounced', X.email, { bounce: { type: 'Transient' } }))).status === 200 && row(X.id).state === 'on', 'delivered, or a passing bounce: nothing changes');
      ok((await hook(ev('email.complained', X.email))).json.received === true && row(X.id).state === 'stopped', 'a complaint stops the letters');
      ok((await hook(ev('email.bounced', Y.email.toUpperCase(), { bounce: { type: 'Permanent' } }))).status === 200 && row(Y.id).state === 'stopped' && row(Z.id).state === 'on', 'a permanent bounce stops them (that address only)');
      ok((await hook(ev('email.bounced', 'nobody@example.com'))).status === 200, 'an address we do not know: fine');
      const r = await call('POST', '/letters', { on: true }, X.tok), m0 = mail.mails.length;
      ok(is(r, 409, 'stopped') && r.json.state === 'stopped' && (await call('GET', '/letters', null, X.tok)).json.state === 'stopped', 'a stopped address cannot be turned on again from the game');
      ok((await call('POST', '/letters', { on: false }, X.tok)).json.state === 'stopped' && row(X.id).state === 'stopped', 'off keeps the stopped row (so it is not asked again)');
      putSave(X, saveOf({}), SUN + 60 * WEEK); putSave(Z, saveOf({}), SUN + 60 * WEEK); await cron(SUN + 61 * WEEK);
      ok(letters(m0).length === 1 && letters(m0)[0].to[0] === Z.email && mail.mails.length === m0 + 1, 'the cron writes to nobody who is stopped');
    }

    sec('9. deletion and what is kept');
    {
      const D1 = await subscribe(), D2 = await subscribe();
      raw.prepare('delete from users where id = ?').run(D1.id);
      ok(!row(D1.id), 'a deleted account: its row goes in the same moment (trigger users_letters_gone)');
      raw.exec('drop trigger users_letters_gone'); raw.prepare('delete from users where id = ?').run(D2.id); ok(!!row(D2.id), '(without the trigger the row would stay)');
      await call('GET', '/'); ok(!row(D2.id), 'tidy() is the backstop: the orphan row is gone');
      const P = await account(); await call('POST', '/letters', { on: true }, P.tok);
      raw.prepare('update letters set at = ? where user_id = ?').run(Date.now() - 8 * DAY, P.id); await call('GET', '/');
      ok(!row(P.id), 'a row nobody confirmed for a week is dropped');
      const cols = raw.prepare("select name from pragma_table_info('letters')").all().map((x) => x.name).sort().join(',');
      ok(cols === 'at,lang,last_week,lid,ok_at,quiet,state,user_id', 'the table keeps only: ' + cols);
      const dump = JSON.stringify(raw.prepare('select * from letters').all());
      ok(!/Mochi|@example\.com|Dear human/.test(dump), 'no email address, no dog name, no letter text in it');
      const plan = raw.prepare("explain query plan select l.user_id from letters l join users u on u.id = l.user_id where l.state = 'on' and l.last_week < 'x' and u.guest = 0 and u.email is not null order by l.last_week, l.user_id limit 20").all().map((x) => x.detail).join(' | ');
      ok(/letters_due/.test(plan), 'the due lookup uses the index letters_due: ' + plan);
      let fresh = true; try { cp.execFileSync(process.execPath, [path.join(ROOT, 'tools', 'letters_pack.js'), '--check'], { stdio: 'pipe' }); } catch (e) { fresh = false; }
      ok(fresh, 'cloudflare/letters_text.js is fresh (node tools/letters_pack.js)');
      ok(/crons = \["0 1-23 \* \* SUN", "0 \* \* \* MON"\]/.test(fs.readFileSync(path.join(ROOT, 'cloudflare', 'wrangler.toml'), 'utf8')), 'wrangler.toml carries the two Cron Triggers (Sunday 10:00 JST and the 48 hours after it)');
    }
  } catch (e) { fails++; console.log('  CRASH', (e && e.stack) || e); }
  console.log('\n' + passes + ' checks, ' + fails + ' failed, ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  console.log(fails ? 'FAILED' : 'ALL OK');
  process.exit(fails ? 1 : 0);
})();
