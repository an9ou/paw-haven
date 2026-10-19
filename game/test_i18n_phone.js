// I18N PHONE (v2.14, V214.md 13): longer and taller text on phones, before the translations exist, through the pseudo-locales.
//   node game/run_tests.js i18n_phone        (in the `phone` group)      PAW_LANGS=xx,de,th ...: other languages (any code works)
//   PAW_I18N_STRICT=1: a clipped label fails the suite (by default clipped labels are listed as notes for the PHONE I18N lane;
//   sideways scroll, a tap target under 44 px in the picker and console errors always fail).
// iPhone 15 and Pixel 7, in xx (about 40% longer, accented) and xx-cjk (CJK-shaped): the title, the yard, the Feed, Play and Care trays,
// the wardrobe, the journal, Settings with the language list, a shop, the map and the walk route carousel.
const LANGS = process.env.PAW_LANGS ? process.env.PAW_LANGS.split(',').map((s) => s.trim()).filter(Boolean) : ['xx', 'xx-cjk'];
const STRICT = !!process.env.PAW_I18N_STRICT;
const { URL } = require('./test_lib');

require('./test_lib').run('i18n_phone', async (t) => {
  const { ok, sec, ev } = t;
  // page and stage overflow, and labels whose text is cut (scrollWidth > clientWidth on an element that hides overflow, or text wider than its button)
  const MEASURE = () => {
    const de = document.scrollingElement || document.documentElement, st = document.getElementById('stage');
    const side = Math.max(de.scrollWidth - innerWidth, st ? st.scrollWidth - st.clientWidth : 0);
    const clip = [];
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth && getComputedStyle(el).visibility !== 'hidden'; };
    document.querySelectorAll('#stage button, #stage .btn, #stage .chip, #stage .act span, #stage [role=tab], #stage label, #stage h2, #stage h3, #stage .tray .lbl, #stage .sitem .nm, #title .tagline, #title .crayon-note').forEach((el) => {
      if (!vis(el) || el.closest('svg') || !el.textContent.trim()) return;
      const cs = getComputedStyle(el), hides = /hidden|clip/.test(cs.overflowX) || /ellipsis/.test(cs.textOverflow);
      if ((hides && el.scrollWidth > el.clientWidth + 1) || (hides && el.scrollHeight > el.clientHeight + 2 && /hidden|clip/.test(cs.overflowY))) clip.push((el.id ? '#' + el.id : el.className ? '.' + String(el.className).split(' ')[0] : el.tagName) + ' "' + el.textContent.trim().slice(0, 24) + '"');
    });
    return { side, clip };
  };
  const notes = [];
  async function look(where) {
    await t.sleep(120); const m = await ev(MEASURE);
    ok(m.side <= 1, `${where}: no sideways scroll (${m.side} px)`);
    if (STRICT) ok(!m.clip.length, `${where}: no clipped label` + (m.clip.length ? ' -> ' + m.clip.slice(0, 5).join(', ') : ''));
    else if (m.clip.length) notes.push(`${where}: ${m.clip.length} clipped (${m.clip.slice(0, 4).join(', ')})`);
  }
  for (const device of ['iPhone 15', 'Pixel 7']) for (const lang of LANGS) {
    const tag = `${device} ${lang}`;
    sec(tag);
    await t.mk({ device, lang }); const p = t.p; await p.goto(URL); await p.waitForSelector('#tNew, #tContinue');
    ok(await ev((l) => window.PawI18n.tlang() === l && document.documentElement.dataset.layout === 'phone', lang), `${tag}: phone layout in ${lang}`);
    await look(tag + ' title');
    const chip = await ev(() => { const r = document.getElementById('tLang').getBoundingClientRect(); return [r.width, r.height]; });
    ok(chip[0] >= 43.5 && chip[1] >= 43.5, `${tag}: the title chip is a 44 px tap (${chip.map(Math.round).join('x')})`);
    await t.adopt({ sex: 'girl' }); await t.patch({ coins: 500, bond: { level: 4, pts: 500 } });
    await look(tag + ' yard');
    for (const a of ['feed', 'play', 'care']) { await p.click(`[data-act=${a}]`); await t.waitPop(true); await look(`${tag} ${a} tray`); await p.click(`[data-act=${a}]`); await t.waitPop(false); }
    await p.click('[data-act=wardrobe]'); await p.waitForSelector('.ward'); await look(tag + ' wardrobe'); await t.closeX(); await t.modalGone();
    await p.click('[data-act=journal]'); await p.waitForSelector('.panel.journal'); await look(tag + ' journal'); await t.closeX(); await t.modalGone();
    await ev(() => (document.getElementById('moreBtn').offsetParent ? document.getElementById('moreBtn') : document.getElementById('gearBtn')).click());
    if (await t.until(() => !!document.getElementById('mmSet'), null, 2000)) await p.click('#mmSet');
    await p.waitForSelector('#setLang'); await p.click('#setLang'); await p.waitForSelector('#setLangBox [data-lang]');
    await look(tag + ' settings + language list');
    const small = await ev(() => [...document.querySelectorAll('#setLangBox [data-lang], #setLang')].map((b) => b.getBoundingClientRect()).filter((r) => r.width < 43.5 || r.height < 43.5).length);
    ok(!small, `${tag}: every language row is a 44 px tap`);
    await t.closeX(); await t.modalGone();
    await t.home('market'); await p.click('#placeBtns [data-sh=kibble]'); await p.waitForSelector('[data-buy="Basic Kibble"]'); await look(tag + ' shop'); await t.closeX(); await t.home('yard');
    await p.click('[data-act=map]'); await p.waitForSelector('[data-area=park]'); await look(tag + ' map'); await p.keyboard.press('Escape'); await t.untilMode('yard');
    await p.click('[data-act=walk]'); await p.waitForSelector('#rtStart'); await look(tag + ' walk routes'); await p.keyboard.press('Escape'); await t.untilMode('yard');
    await t.ctx.close();
  }
  if (notes.length) { console.log('\n  notes for the PHONE I18N lane (clipped labels, PAW_I18N_STRICT=1 makes them failures):'); notes.forEach((n) => console.log('  note ' + n)); }
}, { timeout: 900000 });
