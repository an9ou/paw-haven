const {chromium}=require(require('path').join(require('child_process').execSync('npm root -g').toString().trim(),'playwright'));const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:960}});
const svg=fs.readFileSync(process.argv[2],'utf8');await p.setContent(`<style>body{margin:0}svg{display:block;width:1600px;height:960px}</style>${svg}`);
const png=await p.screenshot({type:'png'});const webp=await p.evaluate(async(b64)=>{const i=new Image();i.src='data:image/png;base64,'+b64;await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;c.getContext('2d').drawImage(i,0,0);return c.toDataURL('image/webp',.82).split(',')[1]},png.toString('base64'));
fs.writeFileSync(process.argv[3],Buffer.from(webp,'base64'));await b.close()})();
