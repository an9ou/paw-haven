// Renders the prototype's placeholder dogs from the game's own art (read-only on the repo).
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT='/home/user/paw-haven',OUT=process.argv[2];
const ctx={window:{},console};ctx.window.window=ctx.window;vm.createContext(ctx);
for(const f of ['dogs/pawart_dogs.js','world/pawart_world_a.js','world/pawart_world_b.js','world/pawart_world_c.js','world/pawart_world_d.js','world/pawart_world_e.js','world/pawart_world_f.js','world/pawart_world_g.js'].filter(x=>fs.existsSync(path.join(ROOT,x))))vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),ctx,{filename:f});
const PA=ctx.window.PawArt;
const sa=(svg,w,h)=>svg.replace(/^<svg(?! xmlns)/,'<svg xmlns="http://www.w3.org/2000/svg"').replace(/^<svg /,`<svg width="${w}" height="${h}" `);
const W=(rel,s)=>{const p=path.join(OUT,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s)};
const DOGS=JSON.parse(process.argv[3]);
for(const d of DOGS){
  const o={anim:false};if(d.age)o.age=d.age;if(d.outfit)o.outfit=d.outfit;
  for(const [pose,file] of [['idle','stand'],['sit','sit'],['happy','happy']])W(`dogs/${d.id}-${file}.svg`,sa(PA.dog(d.key,Object.assign({pose},o)),240,200));
  const ho={expr:'happy'};if(d.age)ho.age=d.age;
  W(`dogs/${d.id}-head.svg`,sa(PA.dogHead(d.key,Object.assign({expr:d.face||'curious'},d.age?{age:d.age}:{})),100,100));
}
W('yard.svg',sa(PA.scene('yard',{}),1000,600));
console.log('ok');
