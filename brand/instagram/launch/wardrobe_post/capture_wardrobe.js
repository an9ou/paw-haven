// The wardrobe glow-up post (v2.23.3 "Tidy wardrobe", 9 Nov 2026): the REAL Wardrobe sheet on a phone, before and after the redesign.
// The same save in both builds: Noodle the Dachshund, 14 everyday Boutique clothes (no festival, Winter Market or Christmas items) and two charms,
// wearing the Flower Crown, Heart Sunglasses, Red Bandana and Knit Winter Sweater with the Lucky Penny. The last two clothes bought
// (Cowboy Hat, Bumblebee Suit) are not seen yet, so the AFTER build shows its "new!" tape on them (S.wardN; the BEFORE build has no such flag).
// Hidden: toasts, tutorial hints and the dev button only (as friends_reel/capture_friends.js). Phone 393 x 852, DPR 3.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/wardrobe_post/capture_wardrobe.js <game checkout> <out.png>
//   (the checkout needs game/test_merged.html: node game/build.js && node game/harness.js merged)
//   before: origin/main 14eae860 (v2.23.2)   after: origin/main f4b15682 (v2.23.3)
const path = require('path'), fs = require('fs');
const G = path.resolve(process.argv[2] || '.'), OUT = path.resolve(process.argv[3] || 'wardrobe.png');
const { T } = require(path.join(G, 'game', 'test_lib'));
const { devices } = require('playwright');
devices['Phone 393x852'] = Object.assign({}, devices['iPhone 15'], { viewport: { width: 393, height: 852 }, screen: { width: 393, height: 852 }, deviceScaleFactor: 3 });
const OWN = ['Red Bandana', 'Party Hat', 'Bow Tie', 'Flower Crown', 'Heart Sunglasses', 'Yellow Raincoat', 'Frog Raincoat', 'Pom-pom Beanie', 'Knit Winter Sweater', 'Superhero Cape', 'Chef Hat', 'Tutu', 'Cowboy Hat', 'Bumblebee Suit'];
const NEW = 2; // the last two are new here
(async () => {
  const t = new T('wardrobe_post', { timeout: 120000 }); await t.launch();
  try {
    await t.boot({ device: 'Phone 393x852' });
    const heads = await t.ev(() => [...document.querySelectorAll('.heads button')].map((x) => x.getAttribute('aria-label')));
    await t.p.click('#tNew'); await t.p.waitForSelector('#aAdopt');
    const all = await t.ev(() => [...document.querySelectorAll('.heads button')].map((x) => x.getAttribute('aria-label')));
    const i = all.findIndex((h) => /Dachshund|Noodle/.test(h)); if (i < 0) throw new Error('no Dachshund among ' + all.join(' | '));
    await t.p.locator('.heads button').nth(i).click(); await t.sleep(400);
    await t.p.click('#aBoy'); await t.p.click('#aAdopt'); await t.p.waitForSelector('#nOk'); await t.p.click('#nOk');
    await t.intro(); await t.calm(); void heads;
    await t.ev(([own, nw]) => { const P = window.__paw, S = P.S; S.dog.name = 'Noodle'; S.inv.clothes = own.slice(); S.inv.charms = ['Lucky Penny', 'Sparkle Stone'];
      Object.assign(S.outfit, { head: 'Flower Crown', eyes: 'Heart Sunglasses', neck: 'Red Bandana', body: 'Knit Winter Sweater', charm: 'Lucky Penny' });
      S.wardN = own.length - nw; P.saveNow(); }, [OWN, NEW]);
    await t.lu();
    await t.p.addStyleTag({ content: '#toasts,#devBtn,#devPanel,.hint,.coach{opacity:0!important;pointer-events:none}' });
    const st = await t.ev(() => ({ key: window.__paw.S.dog.key || window.__paw.S.dog.breed, name: window.__paw.S.dog.name }));
    console.log('dog', JSON.stringify(st));
    await t.dock('wardrobe'); await t.p.locator('[data-act=wardrobe]').tap(); await t.p.waitForSelector('#modal .panel');
    await t.until(() => { const p = document.querySelector('#modal .panel'); return !!p && !p.getAnimations().length; }, null, 4000); await t.sleep(900);
    await t.p.screenshot({ path: OUT });
    console.log('saved', OUT, 'errors', t.errors.length ? t.errors : 'none');
  } finally { await t.b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
