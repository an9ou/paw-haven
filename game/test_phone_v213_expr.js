// phone_v213_expr (V213.md section 4, EX lane) on iPhone 15 and Pixel 7: the faces in the phone scene (a roaming pack dog and the leader, only that dog
// drawn again, a tap to pet makes a face) and the photo mode face picker: a row under the picture that scrolls sideways (no page sideways scroll),
// 44 px taps, 15 px text or more, a tap puts the face on every dog and the photo is taken again with it. node game/run_tests.js phone_v213_expr
const { run } = require('./test_lib');

(async () => {
  for (const device of ['iPhone 15', 'Pixel 7']) {
    await run('phone_v213_expr_' + device.replace(/\W+/g, ''), async (t) => {
      const { ok, sec } = t, ev = (f, a) => t.ev(f, a), tag = device + ': ';
      await t.newGame({ device, prefs: { exTest: true } }, { coins: 2000, bond: { level: 8, pts: 2000 } });
      await ev(() => { const P = window.__paw; P.addDog({ key: 'mastiff', sex: 'male', months: 30 }, 'Moose'); P.addDog({ key: 'spitz', sex: 'female', months: 20 }, 'Yuki'); });
      await t.calm(); await t.home('house'); await t.home('yard'); await t.sleep(300);
      await ev(() => { const x = window.__paw.ex; x.roam(false); window.__paw.S.dogs.forEach((d) => { d.sleeping = false; x.clear(d.id); }); x.cool(); x.clearLog(); });
      const [A, , Y] = (await t.S()).dogs.map((d) => d.id);

      sec(tag + 'faces in the scene');
      await ev((id) => { window.__paw.rm.pause('test'); window.__paw.rm.set(id, { pose: 'sit' }); }, Y);
      await ev(() => { window.__exMut = []; window.__exObs = new MutationObserver((ms) => ms.forEach((m) => { const g = m.target.closest && m.target.closest('[data-dog]'); window.__exMut.push(g ? g.dataset.dog : '?'); })); window.__exObs.observe(document.getElementById('pack'), { childList: true, subtree: true }); });
      await ev((id) => window.__paw.ex.show(id, 'proud', 1200), Y);
      ok(await ev((id) => /pa-ex-proud/.test(document.querySelector(`#pack [data-dog="${id}"] .rm-art svg`).getAttribute('class')), Y), tag + 'a pack dog shows its face');
      ok(await ev((id) => { const l = [...new Set(window.__exMut)]; return l.length === 1 && l[0] === id; }, Y), tag + 'only that dog was drawn again');
      ok(await t.until((id) => !document.querySelector(`#pack [data-dog="${id}"] svg[class*="pa-ex-"]`), Y, 4000), tag + 'and its own face comes back');
      await ev(() => { window.__exObs.disconnect(); window.__paw.rm.resume('test'); });
      await ev(() => { window.__paw.ex.rnd(0); window.__paw.ex.roam(true); });
      ok(await t.until(() => window.__paw.ex.log.some((l) => l.ev === 'roam'), null, 3000), tag + 'roaming: a dog that stands makes a face now and then');
      await ev(() => { const x = window.__paw.ex; x.roam(false); x.rnd(null); window.__paw.S.dogs.forEach((d) => x.clear(d.id)); x.cool(); });
      for (let i = 0; i < 6 && !(await ev((id) => window.__paw.ex.log.some((l) => l.id === id && l.ev === 'pet'), A)); i++) { await t.p.tap('#dogHit'); await t.sleep(120); }
      ok(await ev((id) => window.__paw.ex.log.some((l) => l.id === id && l.ev === 'pet'), A), tag + 'a tap to pet the leader: a face');
      await t.luWait(800); await t.sleep(3200); await t.lu();

      sec(tag + 'photo mode: the face picker');
      await ev(() => window.__paw.S.dogs.forEach((d) => window.__paw.ex.clear(d.id)));
      await t.p.click('#moreBtn'); await t.p.waitForSelector('#mmPhoto'); await t.p.click('#mmPhoto');
      ok(await t.until(() => window.__paw.ph.active() && window.__paw.ph.ready(), null, 15000), tag + 'photo mode opens from the "..." sheet');
      await t.SH('picker');
      const g = await ev(() => {
        const q = (s) => document.querySelector(s), r = (el) => el.getBoundingClientRect(), row = q('.ex-frow'), box = q('.ex-faces');
        const bs = [...document.querySelectorAll('.ex-faces [data-exface]')];
        return {
          n: bs.length, vw: innerWidth, docW: document.documentElement.scrollWidth, bodyW: document.body.scrollWidth,
          rowSW: row.scrollWidth, rowCW: row.clientWidth, ox: getComputedStyle(row).overflowX,
          small: bs.filter((b) => r(b).height < 43.5 || r(b).width < 43.5).map((b) => b.dataset.exface + ':' + Math.round(r(b).width) + 'x' + Math.round(r(b).height)),
          font: Math.min(...bs.map((b) => parseFloat(getComputedStyle(b.querySelector('.ex-fword')).fontSize))),
          words: bs.every((b) => { const w = b.querySelector('.ex-fword'); return r(w).width > 10 && w.textContent.length > 1; }),
          pic: r(q('.ph-pic')), faces: r(box), side: r(q('.ph-side')), inView: r(box).left >= -1 && r(box).right <= innerWidth + 1,
        };
      });
      ok(g.n === 15, tag + 'Natural and the fourteen faces');
      ok(g.small.length === 0, tag + 'every face button is 44 px or more: ' + g.small.join(' '));
      ok(g.font >= 15 && g.words, tag + `every button shows its word at ${g.font}px`);
      ok(g.rowSW > g.rowCW + 40 && /auto|scroll/.test(g.ox), tag + `the row scrolls sideways (${g.rowSW} in ${g.rowCW})`);
      ok(g.docW <= g.vw && g.bodyW <= g.vw && g.inView, tag + `no sideways page scroll (${g.docW} / ${g.vw})`);
      ok(g.pic.bottom <= g.faces.top + 1 && g.faces.bottom <= g.side.top + 1, tag + 'the picture, then the faces row, then the other choices');
      ok(g.faces.top - g.pic.bottom <= 16, tag + `the picture sits on the faces row (gap ${Math.round(g.faces.top - g.pic.bottom)} px)`);
      // scroll to Wink (far right) and tap it
      await ev(() => { const b = document.querySelector('[data-exface="wink"]'); b.scrollIntoView({ inline: 'center', block: 'nearest' }); });
      ok(await ev(() => document.documentElement.scrollWidth <= innerWidth && window.scrollX === 0), tag + 'scrolling the row never scrolls the page');
      await t.p.tap('[data-exface="wink"]');
      ok(await t.until(() => window.__paw.ph.ready() && window.__paw.ph.svg().includes('pa-ex-wink'), null, 15000), tag + 'Wink: the photo is taken again with the face on');
      ok(await ev(() => document.querySelector('.ph-pic').naturalWidth > 0 && window.__paw.ph.blobSize() > 1000), tag + 'the picture and its PNG are made');
      await t.SH('picker_wink');
      await t.p.tap('#phClose');
      ok(await t.until(() => !window.__paw.ph.active() && !document.querySelector('#pack svg[class*="pa-ex-"]'), null, 4000), tag + 'closing: the dogs have their own faces again');
      ok(t.errors.length === 0, tag + 'no console errors');
    });
  }
})();
