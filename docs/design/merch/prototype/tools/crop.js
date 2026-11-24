// tighten each dog body SVG's viewBox to what is drawn (so the print fills the print area)
const {chromium}=require(require('path').join(require('child_process').execSync('npm root -g').toString().trim(),'playwright'));const fs=require('fs'),path=require('path');
(async()=>{const dir=process.argv[2];const b=await chromium.launch();const p=await b.newPage();
for(const f of fs.readdirSync(dir).filter(f=>/-(stand|sit|happy)\.svg$/.test(f))){let s=fs.readFileSync(path.join(dir,f),'utf8');
await p.setContent(s);const bb=await p.evaluate(()=>{const sv=document.querySelector("svg"),o=sv.getBoundingClientRect(),r=sv.querySelector("g").getBoundingClientRect();return [r.x-o.x,r.y-o.y,r.width,r.height]});
const m=4,x=Math.max(0,bb[0]-m),y=Math.max(0,bb[1]-m),w=Math.min(240,bb[0]+bb[2]+m)-x,h=Math.min(200,bb[1]+bb[3]+m)-y;
s=s.replace(/viewBox="0 0 240 200"/,`viewBox="${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}"`).replace(/width="240" height="200"/,`width="${w.toFixed(0)}" height="${h.toFixed(0)}"`);
fs.writeFileSync(path.join(dir,f),s);console.log(f,w.toFixed(0),h.toFixed(0))}
await b.close()})();
