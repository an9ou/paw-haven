require('./test_lib').run('scratch', async (t) => {
  await t.newGame({ sex: 'girl' });
  await t.ev(() => { const S = window.__paw.S; S.decor = { 'Giant Crayon Box': { got: 'x', out: true } }; window.__paw.go('yard'); });
  await t.sleep(800);
  await t.p.screenshot({ path: '/tmp/claude-0/-home-user-paw-haven/b3c6ccb6-32cf-577e-ba9a-17e2ba20f62f/scratchpad/yard0.png' });
  const r = await t.ev(() => { const o = {}; ['#houseG','#bowlG','#mailboxG','#sceneG [data-hot=mailbox]','#dogHit'].forEach(s=>{const e=document.querySelector(s); if(!e){o[s]=null;return;} const svg=document.querySelector('#view svg.world'); const M=svg.getScreenCTM().inverse(); const b=e.getBoundingClientRect(); const a=new DOMPoint(b.left,b.top).matrixTransform(M), c=new DOMPoint(b.right,b.bottom).matrixTransform(M); o[s]=[a.x,a.y,c.x,c.y].map(Math.round);}); return o;});
  console.log(JSON.stringify(r));
});
