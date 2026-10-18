// node compare.js <art.js> <outprefix>  -> <outprefix>_desktop.png (1280x720 full page), <outprefix>_phone.png (390x844 full page)
const fs=require('fs'),vm=require('vm');const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const [,,ART,OUT,TITLE='']=process.argv;
const sb={window:{}};vm.createContext(sb);vm.runInContext(fs.readFileSync(ART,'utf8'),sb);const PA=sb.window.PawArt;
const G=[['big',1,['dobie','corso','lab','malamute','stdpoodle'],['golden','greyhound','samoyed','akita','afghan','dane','mastiff','gsd']],
 ['medium',.86,['pitbull','chow'],['shiba','spitz','beagle','mutt','poodle','collie','husky']],
 ['small',.72,['minpin','schnauzer','westie','yorkie','bichon','maltese','shihtzu'],['chihuahua','pom','pug','frenchie','dachs','corgi']]];
const POSES=(process.env.POSES||'idle,happy').split(',');
let body=TITLE?`<h2>${TITLE}</h2>`:'';
for(const [nm,sz,nw,old] of G){body+=`<section><h3>${nm} (size ${sz}): new in red, then the old ${nm} dogs; ${POSES.join(', ')}</h3><div class=g>`;
 for(const k of [...nw,...old])for(const p of POSES)body+=`<figure class="${nw.includes(k)?'new':''}"><div class=c><svg viewBox="0 0 240 200" style="width:${Math.round(110*sz)}px">${PA.dog(k,{pose:p,anim:false}).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg></div><figcaption>${k} ${p}</figcaption></figure>`;
 body+='</div></section>'}
const html=`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><style>body{margin:6px;font:12px Helvetica,Arial,sans-serif;background:#FBF4E6}h2{font-size:15px;margin:4px 6px}section{background:#fff;border:1px solid #E6DCC8;margin:0 0 6px;padding:4px 4px 2px}h3{font-size:12.5px;margin:2px 4px 0}.g{display:flex;flex-wrap:wrap}figure{margin:0;width:118px;text-align:center}.c{height:96px;display:flex;align-items:flex-end;justify-content:center}figcaption{color:#666;font-size:11px;line-height:13px;min-height:14px;padding-bottom:4px}.new figcaption{color:#B3262E;font-weight:bold}@media(max-width:500px){figure{width:33%}}</style>${body}`;
fs.writeFileSync(OUT+'.html',html);
(async()=>{const b=await chromium.launch();for(const [vp,w,h] of [['desktop',1280,720],['phone',390,844]]){const pg=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});await pg.setContent(html);await pg.screenshot({path:`${OUT}_${vp}.png`,fullPage:true});await pg.close()}await b.close()})();
