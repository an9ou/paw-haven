// v2.14.1 owner fix: a dog's speech bubble never covers its face. In every language, at the 390 px and 684 px site embeds (phone layout)
// and on desktop, after a dog speaks the bubble's box must not overlap the speaking dog's head (the top 42% of its drawn box, full width),
// and it stays inside the stage. Scenes: the Shelter adopt screen (the meet dog, a tall greyhound and a small dog), the home yard,
// the house, the park and Shibuya (Tokyo) at 390 px; the yard and Shibuya at the other sizes.
//   node game/run_tests.js i18n_bubble          PAW_LANGS=ja,th ...: other languages; PAW_BUBBLE_SIZES=390,1280: other sizes
const LANGS = process.env.PAW_LANGS ? process.env.PAW_LANGS.split(',').map((s) => s.trim()).filter(Boolean) : ['en', 'ja', 'zh-Hans', 'zh-Hant', 'ko', 'es', 'pt-BR', 'fr', 'de', 'th', 'id'];
const SIZES = { 390: [390, 630], 684: [684, 860], 1280: [1280, 720] };
const PICK = process.env.PAW_BUBBLE_SIZES ? process.env.PAW_BUBBLE_SIZES.split(',').map((s) => s.trim()) : null;
const { URL } = require('./test_lib');

require('./test_lib').run('i18n_bubble', async (t) => {
  const { ok, sec, ev } = t;
  // the bubble against the speaking dog's drawn box (sel: the dog's svg.pa-dog), in page px
  const measure = (sel) => ev((sel) => {
    const b = document.getElementById('bubble'), st = document.getElementById('stage').getBoundingClientRect(), s = document.querySelector(sel);
    if (b.hidden || !s) return { miss: b.hidden ? 'no bubble' : 'no dog ' + sel };
    const r = b.getBoundingClientRect(), d = s.firstElementChild.getBoundingClientRect();
    const head = { l: d.left, r: d.right, t: d.top, b: d.top + d.height * 0.42 };
    const over = r.left < head.r && r.right > head.l && r.top < head.b && r.bottom > head.t;
    const ovH = over ? Math.round(Math.min(r.bottom, head.b) - Math.max(r.top, head.t)) : 0;
    const inside = r.left >= st.left - 4 && r.right <= st.right + 4 && r.top >= st.top - 4 && r.bottom <= st.bottom + 4;
    return { over, ovH, inside, bub: [r.left, r.top, r.right, r.bottom].map(Math.round).join(','), head: [head.l, head.t, head.r, head.b].map(Math.round).join(','), cls: b.className, text: b.textContent };
  }, sel);
  const settle = () => t.sleep(450); // the pop animation (0.25 s) has ended
  const check = async (where, sel) => {
    const m = await measure(sel);
    if (m.miss) return ok(false, `${where}: ${m.miss}`);
    ok(!m.over, `${where}: the bubble (${m.bub}) is clear of the dog's head (${m.head})${m.over ? ' overlap ' + m.ovH + ' px, "' + m.text.slice(0, 30) + '"' : ''}`);
    ok(m.inside, `${where}: the bubble stays inside the stage (${m.bub})`);
    return m;
  };
  for (const lang of LANGS) {
    for (const size of Object.keys(SIZES).filter((s) => !PICK || PICK.includes(s))) {
      if (size === '684' && !['en', 'zh-Hant', 'ja', 'th'].includes(lang) && !PICK) continue; // the middle size: a few scripts are enough
      const [vw, vh] = SIZES[size], tag = `${lang} ${size}`;
      sec(tag);
      if (t.ctx) await t.ctx.close();
      await t.mk({ lang, prefs: { tkTest: true } }); const p = t.p; await p.setViewportSize({ width: vw, height: vh });
      await p.goto(URL); await p.waitForSelector('#tNew');
      await p.click('#tNew'); await p.waitForSelector('#aAdopt');
      let line = '';
      for (const i of [8, 0]) { // the greyhound (tall, the owner's screenshot), then a small dog
        await p.click(`.heads button[data-i="${i}"]`);
        if (!(await t.until(() => { const b = document.getElementById('bubble'); return !b.hidden && b.textContent.length > 1; }, null, 12000))) { ok(false, `${tag} adopt ${i}: a line shows`); continue; }
        // the meet dog has walked in (its walk is at most 1.4 s); on a slow machine the 6 s line may be gone by then: one more tap says it again
        await t.until(() => { const m = document.querySelector('#adoptDog .sr-meetdog'); if (!m) return false; const a = m.getBoundingClientRect().x; const ok = window.__lastMeetX === a; window.__lastMeetX = a; return ok; }, null, 6000);
        if (await ev(() => document.getElementById('bubble').hidden)) { await p.click(`.heads button[data-i="${i}"]`); await t.until(() => !document.getElementById('bubble').hidden, null, 12000); await t.sleep(300); }
        const m = await check(`${tag} adopt dog ${i}`, '#adoptDog .sr-meetdog svg.pa-dog');
        if (i === 8 && m && m.text) line = m.text;
        if (size === '390' && i === 8) await t.SH(`${lang}_${size}_adopt`);
      }
      await p.click('#aGirl'); await p.click('#aAdopt'); await p.waitForSelector('#nOk'); await p.click('#nOk'); await t.intro(); await t.calm();
      await t.patch({ bond: { level: 7, pts: 1450 }, coins: 1000 });
      const long = line && line.length < 40 ? line + ' ' + line : line || 'Woof.';
      for (const place of ['yard', 'house', 'park', 'shibuya'].filter((k) => size === '390' || k === 'yard' || k === 'shibuya')) {
        await ev((k) => { const s = window.__paw.S; s.sleeping = false; s.place = k; window.__paw.go('yard'); }, place);
        await t.until(() => !!document.querySelector('#dogArt svg.pa-dog'), null, 5000); await t.lu(); await t.sleep(300);
        for (const txt of [line, long]) {
          await ev((s) => window.__paw.home.sayDog(s, 8000), txt); await settle();
          await check(`${tag} ${place} (${txt === long ? 'long' : 'short'})`, '#dogArt svg.pa-dog');
        }
        if (size !== '684' && ['yard', 'shibuya'].includes(place)) await t.SH(`${lang}_${size}_${place}`);
      }
    }
  }
}, { lang: 'en', timeout: 1500000 });
