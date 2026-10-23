// I18N SMOKE (v2.14, V214.md 13): the game boots and plays in every language, the pseudo-locales included.
//   node game/run_tests.js i18n_smoke                (all 11 languages + xx + xx-cjk; not in `all`)
//   PAW_LANGS=ja,de,xx node game/run_tests.js i18n_smoke   (a few)      PAW_I18N_PARTIAL=1: misses are listed, never a failure
// Per language: title (the first-run chip), adopt, every action-bar popup, Settings (the Language row), the map, a shop and its purchase
// window, a walk and "Head home early", ball play. Checks: no {var} braces left on screen, no console errors, html[lang], the language in
// __paw.i18n. Misses (keys with no text in that language) and unknown keys (not in en.json) are printed. A language whose table
// (game/i18n/<lang>.json) exists must have no misses unless PAW_I18N_PARTIAL is set.
// Then: auto-detect (no pin, browser locale zh-TW -> zh-Hant), a pick on the title screen goes into the new save, a pick in Settings
// reloads into the language, and the picker waits during a walk.
const fs = require('fs'), path = require('path');
const M = require('./i18n/msg.js');
const ALL = M.CODES.concat(['xx', 'xx-cjk']);
const LANGS = process.env.PAW_LANGS ? process.env.PAW_LANGS.split(',').map((s) => s.trim()).filter(Boolean) : ALL;
const PARTIAL = !!process.env.PAW_I18N_PARTIAL;
const hasTable = (l) => fs.existsSync(path.join(__dirname, 'i18n', l + '.json'));
const HTML_LANG = { xx: 'en-XA', 'xx-cjk': 'ja-XA' };

require('./test_lib').run('i18n_smoke', async (t) => {
  const { ok, sec, ev, S } = t;
  // visible text with an unformatted {var} (a message that lost a var, or a typo in a table)
  const braces = () => ev(() => { const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); for (let n; (n = w.nextNode());) { const s = n.nodeValue; const el = n.parentElement; if (!el || el.closest('script, style, svg') || !el.offsetParent) continue; if (/\{[A-Za-z_$][\w$]*(\}|,)/.test(s)) out.push(s.trim().slice(0, 80)); } return out; });
  const checkBraces = async (where) => { const b = await braces(); ok(!b.length, `${where}: no {var} left on screen` + (b.length ? ' -> ' + b.slice(0, 3).join(' | ') : '')); };

  for (const lang of LANGS) {
    sec(lang + ': boot, title, adopt');
    await t.mk({ lang }); const p = t.p; await p.goto(require('./test_lib').URL); await p.waitForSelector('#tNew, #tContinue');
    const st = await ev(() => ({ lang: window.PawI18n.tlang(), html: document.documentElement.lang, chip: !!document.getElementById('tLang') }));
    ok(st.lang === lang && st.html === (HTML_LANG[lang] || lang), `${lang}: the game runs in ${lang}, html lang="${st.html}"`);
    ok(st.chip, `${lang}: the first-run language chip is on the title screen`);
    await checkBraces(lang + ' title');
    await t.adopt({ sex: 'boy' });
    ok((await t.mode()) === 'yard', `${lang}: adopted, in the yard`);
    if (lang === 'xx') ok(await ev(() => /^\[/.test(document.querySelector('#bar .act span:last-child').textContent)), 'xx: the action bar shows the pseudo-locale');
    await t.patch({ bond: { level: 4, pts: 500 }, coins: 500 });

    sec(lang + ': popups, settings, map');
    for (const [a, sel] of [['feed', '[data-food]'], ['play', '[data-play]'], ['care', '[data-care=bed]']]) {
      await p.click(`[data-act=${a}]`); ok(await t.waitPop(true) && await p.locator(sel).count() >= 1, `${lang} ${a}: popup opens`);
      await checkBraces(`${lang} ${a}`);
      await p.click(`[data-act=${a}]`); await t.waitPop(false);
    }
    await p.click('[data-act=wardrobe]'); ok(await p.waitForSelector('.ward').then(() => true, () => false), `${lang}: wardrobe opens`); await checkBraces(lang + ' wardrobe'); await t.closeX(); await t.modalGone();
    await p.click('[data-act=journal]'); ok(await p.waitForSelector('.panel.journal').then(() => true, () => false), `${lang}: journal opens`); await checkBraces(lang + ' journal'); await t.closeX(); await t.modalGone();
    await ev(() => document.getElementById('gearBtn').click());
    ok(await t.until(() => !!document.getElementById('setLang')), `${lang}: Settings has the Language row`);
    await p.click('#setLang'); ok(await t.until(() => document.querySelectorAll('#setLangBox [data-lang]').length === 12), `${lang}: the list shows 11 languages + "Use device language"`);
    await checkBraces(lang + ' settings'); await t.closeX(); await t.modalGone();
    await p.click('[data-act=map]'); await p.waitForSelector('[data-area=park]'); await checkBraces(lang + ' map'); await p.keyboard.press('Escape'); await t.untilMode('yard');

    sec(lang + ': shop, walk, ball');
    await t.home('market'); await p.click('#placeBtns [data-sh=kibble]'); await p.waitForSelector('[data-buy="Basic Kibble"]');
    await p.click('[data-buy="Basic Kibble"]'); ok(await p.waitForSelector('.buyveil').then(() => true, () => false), `${lang}: the purchase window opens`);
    await checkBraces(lang + ' shop'); await p.click('.bb-yes'); await p.waitForSelector('.buyveil', { state: 'detached' }); await t.closeX(); await t.home('yard');
    ok(await t.startWalk(), `${lang}: a walk starts`); await checkBraces(lang + ' walk');
    ok(await t.quitWalk(true), `${lang}: Head home early -> results -> OK`);
    await p.click('[data-act=play]'); await t.waitPop(true); await p.click('[data-play="ball:Tennis Ball"]');
    ok(await t.until(() => !!window.__paw.bl && window.__paw.bl.on, null, 4000), `${lang}: ball play starts`); await p.click('#blDone'); await t.until(() => !window.__paw.bl.on, null, 3000);

    const r = await ev(() => ({ misses: window.__paw.i18n.misses, unknown: window.__paw.i18n.unknown }));
    console.log(`  note ${lang}: ${r.misses.length} misses${r.misses.length ? ' (' + r.misses.slice(0, 6).join(', ') + (r.misses.length > 6 ? ', ...' : '') + ')' : ''}, ${r.unknown.length} keys not in en.json${r.unknown.length ? ' (' + r.unknown.slice(0, 6).join(', ') + ')' : ''}`);
    if (hasTable(lang) && !PARTIAL) ok(!r.misses.length, `${lang}: every key on these screens is translated (PAW_I18N_PARTIAL=1 lists them instead)`);
    await t.ctx.close();
  }

  sec('auto-detect: no pin, a zh-TW browser');
  await t.mk({ lang: null, locale: 'zh-TW' }); await t.p.goto(require('./test_lib').URL); await t.p.waitForSelector('#tNew');
  ok(await ev(() => window.PawI18n.tlang() === 'zh-Hant' && document.documentElement.lang === 'zh-Hant'), 'zh-TW picks zh-Hant (pickLang)');
  await t.ctx.close();

  sec('the title chip: a pick before the save exists goes into the new save');
  const p = await t.boot();
  await p.click('#tLang'); await p.waitForSelector('.langsheet [data-lang="de"]'); await p.click('.langsheet [data-lang="de"]');
  ok(await t.until(() => window.PawI18n.tlang() === 'de' && document.documentElement.lang === 'de' && !!document.getElementById('tNew') && document.getElementById('modal').hidden), 'picking Deutsch re-renders the title live in de');
  ok(await ev(() => /Deutsch/.test(document.getElementById('tLang').textContent)), 'the chip now says Deutsch');
  await t.adopt({ sex: 'girl' }); ok((await S()).lang === 'de', 'the new save carries S.lang = de');

  sec('Settings: a pick reloads into the language; the picker waits during a walk');
  await ev(() => document.getElementById('gearBtn').click()); await p.waitForSelector('#setLang'); await p.click('#setLang'); await p.waitForSelector('#setLangBox [data-lang="ja"]');
  await Promise.all([p.waitForEvent('load'), p.click('#setLangBox [data-lang="ja"]')]);
  await p.waitForSelector('#tNew, #tContinue, #bar .act', { timeout: 20000 }).catch(() => {});
  ok(await t.until(() => window.PawI18n && window.PawI18n.tlang() === 'ja' && document.documentElement.lang === 'ja', null, 15000), 'after the reload the game is in ja');
  ok((await S()).lang === 'ja', 'S.lang = ja is saved');
  if ((await t.mode()) === 'title') { await p.click('#tContinue'); await t.untilMode('yard'); }
  await t.calm(); ok(await t.startWalk(), 'a walk starts');
  await ev(() => document.getElementById('gearBtn').click()); await p.waitForSelector('#setLang');
  ok(await ev(() => document.getElementById('setLang').disabled && !!document.querySelector('.langbusy')), 'during a walk the Language button is disabled, with the note');
  await t.closeX(); await t.quitWalk(true);
  await ev(() => document.getElementById('gearBtn').click()); await p.waitForSelector('#setLang'); await p.click('#setLang'); await p.waitForSelector('#setLangBox [data-lang=""]');
  await Promise.all([p.waitForEvent('load'), p.click('#setLangBox [data-lang=""]')]);
  ok(await t.until(() => window.PawI18n && window.PawI18n.tlang() === 'en', null, 15000), '"Use device language" goes back to the device (en here)');
  ok((await S()).lang === null, 'S.lang = null');
}, { timeout: 1500000 });
