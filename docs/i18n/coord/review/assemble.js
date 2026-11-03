const fs=require("fs");const rows=require("./rows.json");
const L1=String.fromCharCode(0x2028),L2=String.fromCharCode(0x2029);
const js=JSON.stringify(rows).split("<").join("\\u003c").split(L1).join("\\u2028").split(L2).join("\\u2029");
const p=fs.readFileSync(__dirname+"/page.html","utf8");if(!p.includes("/*ROWS*/[]"))throw "no marker";
const out=p.replace("/*ROWS*/[]",()=>js);fs.writeFileSync(__dirname+"/yue_check.html",out);
const s=out.match(/<script>([\s\S]*)<\/script>/)[1];new Function(s);console.log("ok",out.length);
