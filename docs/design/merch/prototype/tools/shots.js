const {chromium}=require(require('path').join(require('child_process').execSync('npm root -g').toString().trim(),'playwright'));
const OUT=process.argv[2], only=process.argv[3];
const U='http://127.0.0.1:8791/index.html?clean=1';
const SHOTS=[
 ['step1','',{}],
 ['step2','#/pick',{src:'game',dog:'biscuit'}],
 ['step2_link','#/pick',{src:'link',dog:'pickle'}],
 ['step2_none','#/pick',{src:'none'}],
 ['step3','#/product',{dog:'biscuit'}],
 ['step4','#/make',{dog:'biscuit',prod:'tee',col:'white',pose:'stand',yard:false,showName:true,name:'Biscuit',size:2}],
 ['step4_sheet','#/make',{dog:'pickle',prod:'stickers',showName:true,name:'Pickle'}],
 ['step4_hoodie','#/make',{dog:'mochi',prod:'hoodie',col:'black',pose:'happy',yard:true,showName:true,name:'Mochi',size:2}],
 ['step5','#/pay',{dog:'biscuit',prod:'tee',col:'white',pose:'stand',showName:true,name:'Biscuit',size:2,ctry:'us'}],
 ['step6','#/done',{dog:'biscuit',prod:'tee',col:'white',pose:'stand',showName:true,name:'Biscuit',size:2}],
];
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[390,844],[1280,720],[360,640]]){const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});
 p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
 for(const [name,hash,st] of SHOTS){ if(only&&!name.startsWith(only))continue; if(w===360&&/_/.test(name))continue;
  await p.goto('about:blank');await p.goto(U+hash);await p.waitForTimeout(250);await p.evaluate(s=>{window.__merch.go(s)},st);await p.waitForTimeout(500);
  // phone fit check: anything wider than the viewport?
  const over=await p.evaluate(()=>{const W=document.documentElement.clientWidth,bad=[];document.querySelectorAll('.sheet *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.right>W+0.5&&!e.closest('.deco,.petals'))bad.push(e.tagName+'.'+e.className+' '+Math.round(r.right))});
   const small=[];document.querySelectorAll('.mview.on button,.mview.on a,.sitenav a,.shopbar button').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&(r.height<43.5||r.width<43.5))small.push((e.textContent||'').trim().slice(0,20)+' '+Math.round(r.width)+'x'+Math.round(r.height))});
   return {sw:document.documentElement.scrollWidth>W,bad:bad.slice(0,5),small:small.slice(0,8)}});
  if(over.sw||over.bad.length||over.small.length)console.log(name,w,JSON.stringify(over));
  if(w!==360){const H=await p.evaluate(()=>document.documentElement.scrollHeight);await p.setViewportSize({width:w,height:Math.max(h,H)});await p.waitForTimeout(300);await p.screenshot({path:`${OUT}/${name}_${w}.png`});await p.setViewportSize({width:w,height:h});}}
 await p.close()}
await b.close()})();
