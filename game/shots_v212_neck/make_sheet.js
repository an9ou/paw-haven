// node sheet.js <art.js> <out.png> <keys> <ages: ad,puppy,newborn> [cell px] [title] [poses] [width]
const fs=require('fs'),vm=require('vm');const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const [,,ART,OUTP,KEYS,AGES,CELL='120',TITLE='',POSESA='',WIDTH='1280']=process.argv;
const sb={window:{}};vm.createContext(sb);vm.runInContext(fs.readFileSync(ART,'utf8'),sb);const PA=sb.window.PawArt;
const POSES=POSESA?POSESA.split(','):['idle','happy','pet','eat','sleep','walk','jump','sit','sad','dirty','crouch','shake','cold','hot','dig','beg','squat','leglift','paw','down','rollover','playdead','speak','dance','bow','scratch','sniff','yawn','howl'];
let body=`<h3>${TITLE}</h3>`;
for(const k of KEYS.split(','))for(const a of AGES.split(',')){body+=`<div class=row><b>${k} ${a}</b><div class=g>`;
 for(const p of POSES){let o={pose:p,anim:false};if(p.endsWith('-L')){o.pose=p.slice(0,-2);o.facing='left'}if(a!=='ad')o.age=a;
  const oc=/^o:(.*)$/.exec(a);body+=`<figure>${PA.dog(k,o)}<figcaption>${p}</figcaption></figure>`}body+='</div></div>'}
const html=`<!doctype html><meta charset=utf-8><style>body{margin:8px;font:12px sans-serif;background:#FFFBF2}h3{margin:4px 0}.row{border:1px solid #ddd;margin:4px 0;padding:4px;background:#fff}.g{display:flex;flex-wrap:wrap}figure{margin:2px;width:${CELL}px;text-align:center}figure svg{width:${CELL}px;height:${CELL*200/240}px}figcaption{color:#555}</style>${body}`;
fs.writeFileSync(OUTP.replace(/\.png$/,'.html'),html);
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:+WIDTH,height:720}});await pg.setContent(html);await pg.screenshot({path:OUTP,fullPage:true});await b.close()})();
