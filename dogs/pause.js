const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.goto('file://'+__dirname+'/gallery.html');await p.waitForTimeout(300);
const st=()=>p.evaluate(()=>getComputedStyle(document.querySelector('.pa-dog .pa-d-f0')).animationPlayState);
console.log('on:',await st());await p.click('#mot');console.log('motion off:',await st());await p.click('#mot');await p.click('#still');console.log('pa-still:',await st());
await p.emulateMedia({reducedMotion:'reduce'});await p.click('#still');console.log('reduced:',await st());await b.close()})();
