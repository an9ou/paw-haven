// v2.22 "Town levels" on phones (V222.md 1.3-1.5, 7.1 Phone), part C: the HUD star #lvBtn, the Level sheet and the level-up card.
// At 360x740, 390x844 and the iPhone 15 (393x659 visible), in en and de (th and ja after the translation batch, part F):
//   the star is a 44 px tap target on row 1 directly left of the coins; row 1 never wraps and nothing overlaps with 1 dog and with 5 dogs plus a
//   long title; the HUD keeps its height; no sideways scroll; the sheet (level 6 and level 20 with stars) and the card fit on screen, their OK / X
//   and the "Opened so far" toggle are 44 px and on top, and every text is 13 px or more.
// Part D: the Journal > Profile habits card fits each size (one column, 15 px lines, nothing past the card, the last row above the phone bar), and
//   the Bond card with its habit box fits at 360 (OK on top, text 13 px or more).
// Part G: at each size the star card (one sticker, and 3 at once at 360) fits with its OK on top, and the sheet's sticker page (4 x 2 cells) fits the
//   width, no cell past the page, its last row above the phone bar, every label 13 px or more.
// node game/run_tests.js phone_v222_levels   (--shots writes every size to game/shots_phone_v222_levels/)
const { run } = require('./test_lib');
const ON = { ms2Test: true, lvTest: true, tkTest: true, jpTest: true, ffTest: true };
const SIZES = [[360, 740], [390, 844], [393, 659]];

(async () => {
  for (const lang of ['en', 'de']) {
    await run('phone_v222_levels', async (t) => {
      const { ok, sec, ev } = t;
      sec(`${lang}: a fresh save on the iPhone 15 profile`);
      await t.newGame({ sex: 'girl', device: 'iPhone 15', prefs: ON, map215: true, lang }, { bond: { level: 3, pts: 200 }, coins: 12345 });
      const p = t.p; await t.freezeMotion(true);
      ok(await t.until(() => !!document.getElementById('lvBtn'), null, 6000), `${lang}: the star is in the HUD`);
      const hud = () => ev(() => {
        const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return r.width ? [r.left, r.top, r.right, r.bottom] : null; };
        const b = document.getElementById('lvBtn'), br = R(b), c = br && document.elementFromPoint((br[0] + br[2]) / 2, (br[1] + br[3]) / 2);
        const who = ['#hud .portrait', '#hudName', '#hudTitle:not([hidden])', '#hudPack:not(:empty)'].map((q) => R(document.querySelector(q))).filter(Boolean);
        return { b: br, onTop: !!c && b.contains(c), coins: R(document.getElementById('coins')), more: R(document.getElementById('moreBtn')), meters: R(document.getElementById('meters')), who, hudH: document.getElementById('hud').offsetHeight,
          nfs: parseFloat(getComputedStyle(b.querySelector('.lv-n')).fontSize), track: getComputedStyle(b.querySelector('.lv-track')).display, next: getComputedStyle(document.getElementById('lvNext')).display, sw: document.documentElement.scrollWidth, iw: innerWidth,
          title: (document.getElementById('hudTitle') || {}).textContent };
      });
      const offH = async () => { await ev(() => window.__paw.lv.test(false)); await t.until(() => !document.getElementById('lvBtn'), null, 3000); const h = await ev(() => document.getElementById('hud').offsetHeight); await ev(() => window.__paw.lv.test(true)); await t.until(() => !!document.getElementById('lvBtn'), null, 3000); return h; };
      const hudCheck = async (tag) => {
        const h = await hud(), h0 = await offH(), b = h.b, mid = (r) => (r[1] + r[3]) / 2;
        ok(b && b[2] - b[0] >= 44 && b[3] - b[1] >= 44 && h.onTop, `${tag}: #lvBtn is a 44 px tap target with nothing on top (${b && b.map(Math.round)})`);
        ok(b && b[2] <= h.coins[0] + 1 && h.coins[2] <= h.more[0] + 1 && Math.abs(mid(b) - mid(h.coins)) < 6 && Math.abs(mid(b) - mid(h.more)) < 6 && b[3] <= h.meters[1] + 4, `${tag}: row 1 = the dog, the star, the coins, the menu (no wrap)`);
        const hit = h.who.filter((r) => r[2] > b[0] + 0.5);
        ok(!hit.length, `${tag}: the portrait, the name, the title and the pack chip end before the star ${JSON.stringify(hit.map((r) => r.map(Math.round)))} star ${b && b.map(Math.round)}`);
        ok(h.hudH === h0, `${tag}: the HUD keeps its height (${h.hudH} with the star, ${h0} without)`);
        ok(h.sw <= h.iw, `${tag}: no sideways scroll (${h.sw} <= ${h.iw})`);
        ok(h.nfs >= 13 && h.track === 'none' && h.next === 'none', `${tag}: the number is ${h.nfs} px, no track and no Next tag on phones`);
      };
      const textCheck = (sel) => ev((sel) => {
        const P = document.querySelector(sel), small = [];
        P.querySelectorAll('*').forEach((e) => { if ([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && e.getClientRects().length && !e.closest('svg')) { const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 13) small.push(e.tagName + '.' + e.className + ' ' + fs); } });
        const r = P.getBoundingClientRect(), bar = document.getElementById('bar').getBoundingClientRect();
        const top = (q) => { const e = P.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(), c = document.elementFromPoint((b.left + b.right) / 2, (b.top + b.bottom) / 2); return { w: b.width, h: b.height, on: !!c && e.contains(c) }; };
        const last = P.querySelector('.panel-body').lastElementChild, lb = last.getBoundingClientRect(), lc = document.elementFromPoint(lb.left + 8, (lb.top + lb.bottom) / 2);
        return { small, r: [r.left, r.top, r.right, r.bottom], iw: innerWidth, ih: innerHeight, sw: document.documentElement.scrollWidth, x: top('.x'), ok: top('#lvOk'), stok: top('#lvStOk'), sum: top('.lv-open summary'), lastOn: !!lc && P.contains(lc), barTop: bar.top, overBar: r.bottom > bar.top + 1 };
      }, sel);
      const stkCheck = async (tag) => { // the sticker page inside the open sheet
        const m = await ev(() => {
          const P = document.querySelector('#modal .panel.lv-pop'), g = P.querySelector('.lv-stk'); if (!g) return null;
          g.scrollIntoView({ block: 'end' }); const r = P.getBoundingClientRect(), gr = g.getBoundingClientRect(), cells = [...g.querySelectorAll('li.lv-sti')], bar = document.getElementById('bar').getBoundingClientRect();
          const out = cells.filter((c) => { const b = c.getBoundingClientRect(); return b.left < gr.left - 1 || b.right > gr.right + 1; }).length, rows = new Set(cells.map((c) => Math.round(c.getBoundingClientRect().top))).size;
          const lab = cells.map((c) => c.querySelector('.lv-sl')).filter((l) => l.scrollWidth > l.clientWidth + 1).length, last = cells[cells.length - 1].getBoundingClientRect(), hit = document.elementFromPoint((last.left + last.right) / 2, last.top + 10);
          return { n: cells.length, rows, out, lab, g: [gr.left, gr.right], r: [r.left, r.right], lastB: last.bottom, barTop: bar.top, lastOn: !!hit && cells[cells.length - 1].contains(hit), fs: Math.min(...cells.map((c) => parseFloat(getComputedStyle(c.querySelector('.lv-sl')).fontSize))) };
        });
        ok(m && m.n === 8 && m.rows === 2 && !m.out && !m.lab && m.g[0] >= m.r[0] - 1 && m.g[1] <= m.r[1] + 1, `${tag}: the sticker page is 4 x 2 cells inside the sheet, no label cut ${JSON.stringify(m)}`);
        ok(m && m.lastOn && m.lastB <= m.barTop + 1 && m.fs >= 13, `${tag}: its last row is on top above the phone bar, labels ${m && m.fs} px`);
        await t.SH(`${tag}_stickers`);
      };
      const starCheck = async (tag, n) => {
        ok(await t.until(() => !!document.getElementById('lvStOk'), null, 5000), `${tag}: the star card shows`);
        await t.sleep(300); await t.SH(`${tag}_starcard`);
        const m = await textCheck('#modal .panel.lv-stc'), k = await ev(() => document.querySelectorAll('#modal .lv-stkcard .lv-sa svg').length);
        ok(k === n && m.r[0] >= -1 && m.r[2] <= m.iw + 1 && m.r[1] >= 0 && m.r[3] <= m.ih + 1 && m.sw <= m.iw, `${tag}: the star card with ${k} sticker(s) fits the screen ${JSON.stringify(m.r.map(Math.round))}`);
        ok(m.stok && m.stok.w >= 44 && m.stok.h >= 44 && m.stok.on, `${tag}: its OK is a 44 px button on top ${JSON.stringify(m.stok)}`);
        ok(!m.small.length, `${tag}: every star card text is 13 px or more ${m.small.slice(0, 4).join(', ')}`);
        await p.click('#lvStOk'); await t.modalGone();
      };
      const sheetCheck = async (tag, stk) => {
        await p.click('#lvBtn'); ok(await t.until(() => !!document.querySelector('#modal .panel.lv-pop'), null, 3000), `${tag}: a tap on the star opens the sheet`);
        await t.sleep(300); await t.SH(`${tag}_sheet`);
        if (stk) await stkCheck(tag);
        await ev(() => { const d = document.querySelector('.lv-open'); if (d) d.open = true; const b = document.querySelector('#modal .panel-body'); b.scrollTop = b.scrollHeight; });
        await t.sleep(200); const m = await textCheck('#modal .panel.lv-pop'); await t.SH(`${tag}_sheet_end`);
        ok(m.r[0] >= -1 && m.r[2] <= m.iw + 1 && m.r[1] >= 0 && m.r[3] <= m.ih + 1 && m.sw <= m.iw, `${tag}: the sheet fits the screen ${JSON.stringify(m.r.map(Math.round))} (${m.iw}x${m.ih})`);
        ok(!m.overBar || m.lastOn, `${tag}: nothing of the sheet hides under the phone bar (the last line is on top)`);
        ok(m.x && m.x.w >= 44 && m.x.h >= 44 && m.x.on && (!m.sum || (m.sum.h >= 44)), `${tag}: the X and the "Opened so far" toggle are 44 px ${JSON.stringify([m.x, m.sum])}`);
        ok(!m.small.length, `${tag}: every sheet text is 13 px or more ${m.small.slice(0, 4).join(', ')}`);
        await t.closeX();
      };
      const cardCheck = async (tag) => {
        ok(await t.until(() => !!document.getElementById('lvOk'), null, 5000), `${tag}: the level card shows`);
        await t.sleep(300); await t.SH(`${tag}_card`);
        const m = await textCheck('#modal .panel.lv-lu');
        ok(m.r[0] >= -1 && m.r[2] <= m.iw + 1 && m.r[1] >= 0 && m.r[3] <= m.ih + 1 && m.sw <= m.iw, `${tag}: the card fits the screen ${JSON.stringify(m.r.map(Math.round))}`);
        ok(m.ok && m.ok.w >= 44 && m.ok.h >= 44 && m.ok.on && (!m.overBar || m.ok.on), `${tag}: OK is a 44 px button on top, nothing under the bar ${JSON.stringify(m.ok)}`);
        ok(!m.small.length, `${tag}: every card text is 13 px or more ${m.small.slice(0, 4).join(', ')}`);
        await p.click('#lvOk'); await t.modalGone();
      };
      // part D: the Profile habits card, scrolled into view, and the Bond card's habit box
      const habCheck = async (tag) => {
        await ev(() => window.__paw.dd.journal('profile'));
        ok(await t.until(() => !!document.querySelector('#modal .pf-habits'), null, 4000), `${tag}: Journal > Profile has the habits card`);
        await ev(() => document.querySelector('#modal .pf-habits').scrollIntoView({ block: 'start' })); await t.sleep(250); await t.SH(`${tag}_habits`);
        const m = await ev(() => {
          const c = document.querySelector('#modal .pf-habits'), r = c.getBoundingClientRect(), rows = [...c.querySelectorAll('li.hb-row')], bar = document.getElementById('bar').getBoundingClientRect(), small = [];
          c.querySelectorAll('*').forEach((e) => { if ([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && e.getClientRects().length && !e.closest('svg')) { const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 13) small.push(e.tagName + '.' + e.className + ' ' + fs); } });
          const on = rows.filter((l) => !l.classList.contains('off')).map((l) => parseFloat(getComputedStyle(l.querySelector('.hb-line')).fontSize));
          const lefts = new Set(rows.map((l) => Math.round(l.getBoundingClientRect().left))), wide = rows.filter((l) => { const b = l.getBoundingClientRect(); return b.left < r.left - 1 || b.right > r.right + 1; }).length;
          const last = rows[rows.length - 1]; last.scrollIntoView({ block: 'end' }); const lb = last.getBoundingClientRect(), hit = document.elementFromPoint(lb.left + 20, (lb.top + lb.bottom) / 2);
          return { n: rows.length, r: [r.left, r.right], iw: innerWidth, sw: document.documentElement.scrollWidth, cols: lefts.size, wide, small, fs: Math.min(...on), lastOn: !!hit && last.contains(hit), lastB: lb.bottom, barTop: bar.top };
        });
        await t.sleep(200); await t.SH(`${tag}_habits_end`);
        ok(m.n === 10 && m.r[0] >= -1 && m.r[1] <= m.iw + 1 && m.sw <= m.iw && !m.wide, `${tag}: the habits card fits the width, no row past it, no sideways scroll ${JSON.stringify(m.r.map(Math.round))} (${m.iw})`);
        ok(m.cols === 1 && m.fs >= 15 && !m.small.length, `${tag}: one column, ${m.fs} px lines, every text 13 px or more ${m.small.slice(0, 3).join(', ')}`);
        ok(m.lastOn && m.lastB <= m.barTop + 1, `${tag}: the last row is on top, above the phone bar (${Math.round(m.lastB)} <= ${Math.round(m.barTop)})`);
        await t.closeX(); await t.modalGone();
      };
      const luBoxCheck = async (tag) => {
        await ev(() => { const P = window.__paw; P.lv.bondUp(P.fw.BOND_TH[3] - P.S.bond.pts); }); // Bond 3 -> 4: a new habit
        ok(await t.until(() => !!document.querySelector('#modal .hb-new'), null, 5000), `${tag}: the Bond card has the habit box`);
        await t.sleep(300); await t.SH(`${tag}_bondcard`);
        const m = await textCheck('#modal .panel.celebrate'), o = await ev(() => { const b = document.getElementById('luOk'), r = b.getBoundingClientRect(), c = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2), x = document.querySelector('#modal .hb-new').getBoundingClientRect(), P = document.querySelector('#modal .panel').getBoundingClientRect(); return { w: r.width, h: r.height, on: !!c && b.contains(c), box: x.left >= P.left - 1 && x.right <= P.right + 1 }; });
        ok(m.r[0] >= -1 && m.r[2] <= m.iw + 1 && m.r[1] >= 0 && m.r[3] <= m.ih + 1 && m.sw <= m.iw && o.box, `${tag}: the Bond card and its habit box fit the screen ${JSON.stringify(m.r.map(Math.round))}`);
        ok(o.w >= 44 && o.h >= 44 && o.on && !m.small.length, `${tag}: Yay! is a 44 px button on top, every text 13 px or more ${m.small.slice(0, 3).join(', ')}`);
        await t.lu(); await t.luWait(800); await ev(() => { const b = document.getElementById('lvOk'); if (b) b.click(); }); await t.modalGone();
      };
      // a level card at the narrowest size: levels 2-6 at once (the longest list of week 1)
      await p.setViewportSize({ width: 360, height: 740 }); await t.until(() => innerWidth === 360, null, 4000);
      await ev(() => window.__paw.lv.gain('board', 630)); await cardCheck(`${lang}_360`);
      await luBoxCheck(`${lang}_360`);
      for (const [W, H] of SIZES) {
        const tag = `${lang}_${W}x${H}`; sec(tag);
        await p.setViewportSize({ width: W, height: H }); await t.until((w) => innerWidth === w, W, 4000);
        await ev(() => { const P = window.__paw, S = P.S; S.dogs = S.dogs.slice(0, 1); S.activeId = S.dogs[0].id; S.title = ''; S.place = 'yard'; P.go('yard'); }); await t.lu(); await t.sleep(400);
        await hudCheck(`${tag} 1 dog`); await t.SH(`${tag}_hud1`);
        await ev(() => { const P = window.__paw, S = P.S; while (S.dogs.length < 5) P.addDog({ key: 'golden', sex: 'male', months: 20 }, 'Pal'); S.titles = S.titles || {}; S.titles['Town Know-it-all'] = '2026-11-01'; S.title = 'Town Know-it-all'; S.place = 'yard'; P.go('yard'); });
        await t.lu(); await t.calm(); await t.sleep(400);
        await hudCheck(`${tag} 5 dogs + title`); await t.SH(`${tag}_hud5`);
        await sheetCheck(tag);
        await habCheck(tag);
      }
      sec(`${lang}: level 20 with stars`);
      await p.setViewportSize({ width: 360, height: 740 }); await t.until(() => innerWidth === 360, null, 4000);
      await ev(() => window.__paw.lv.gain('board', 8570 + 2400 - window.__paw.lv.xp())); await cardCheck(`${lang}_360 level 20`);
      await starCheck(`${lang}_360 2 stars at once`, 2);
      for (const [W, H] of SIZES) {
        const tag = `${lang}_${W}x${H} level 20`;
        await p.setViewportSize({ width: W, height: H }); await t.until((w) => innerWidth === w, W, 4000);
        await ev(() => { window.__paw.S.place = 'yard'; window.__paw.go('yard'); window.__paw.lv.dev('star'); }); await starCheck(tag, 1);
        await sheetCheck(tag, true);
      }
    }, { device: 'iPhone 15', map215: true, lang, timeout: 300000 });
  }
})();
