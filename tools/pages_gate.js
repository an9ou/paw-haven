// Doodle Doggo: the password screen for the GitHub Pages test copy only (owner, 2 Nov 2026).
// tools/pages.js puts gate() right after <body>. itch.io (tools/itch.js), doodledoggo.app /play/ and the artifact never get it.
// Not real security (the repo is public): it keeps casual visitors out of the test copy. The password itself is never stored:
// only SHA-256(salt + password) is, in tools/pages_gate.json { salt, hash }. Without that file (or with "off": true) there is no gate.
// Set or change it: node tools/pages_gate.js set '<password>'   (prints nothing secret, writes the json)
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const CONF = path.join(__dirname, 'pages_gate.json');

function conf() { try { const c = JSON.parse(fs.readFileSync(CONF, 'utf8')); return c && c.hash && c.salt && !c.off ? c : null; } catch (e) { return null; } }

function gate() {
  const c = conf(); if (!c) return '';
  const K = 'dd_gate_v1';
  return `<style>html.dd-locked body>*:not(#ddGate){visibility:hidden!important}#ddGate{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:16px;background:#FFFBF3;font-family:Caveat,'Comic Sans MS',cursive;color:#5B3D32}
#ddGate form{width:min(340px,100%);padding:26px 22px;border:3px solid #5B3D32;border-radius:18px 12px 20px 10px;background:#FFF4DC;box-shadow:4px 5px 0 rgba(91,61,50,.18);text-align:center}
#ddGate h1{margin:0 0 4px;font-size:34px;line-height:1.1}#ddGate p{margin:0 0 16px;font-size:20px}
#ddGate input{box-sizing:border-box;width:100%;min-height:46px;padding:8px 12px;font:inherit;font-size:22px;color:inherit;background:#fff;border:2.5px solid #5B3D32;border-radius:10px 14px 9px 13px}
#ddGate button{margin-top:12px;min-height:46px;min-width:140px;padding:6px 18px;font:inherit;font-size:24px;color:#5B3D32;background:#F7D774;border:2.5px solid #5B3D32;border-radius:13px 9px 15px 8px;cursor:pointer}
#ddGate .no{min-height:24px;margin:10px 0 0;font-size:19px;color:#C0504D}</style>
<div id="ddGate" role="dialog" aria-modal="true" aria-labelledby="ddGateT"><form autocomplete="off"><h1 id="ddGateT">Doodle Doggo</h1><p>Test copy. Password, please!</p><input type="password" aria-label="Password" autofocus><button type="submit">Let me in</button><div class="no" aria-live="polite"></div></form></div>
<script>(function(){var H=${JSON.stringify(c.hash)},SALT=${JSON.stringify(c.salt)},K=${JSON.stringify(K)},g=document.getElementById('ddGate'),d=document.documentElement;
function ok(){try{return localStorage.getItem(K)===H}catch(e){return false}}
function open(){d.classList.remove('dd-locked');if(g)g.remove();window.removeEventListener('keydown',stop,true);window.removeEventListener('keyup',stop,true)}
function stop(e){if(!g||!g.contains(e.target))e.stopImmediatePropagation()}
if(ok()){open();return}
d.classList.add('dd-locked');window.addEventListener('keydown',stop,true);window.addEventListener('keyup',stop,true);
var f=g.querySelector('form'),i=g.querySelector('input'),m=g.querySelector('.no');
f.addEventListener('submit',function(e){e.preventDefault();if(!(window.crypto&&crypto.subtle)){m.textContent='This browser cannot check the password.';return}
crypto.subtle.digest('SHA-256',new TextEncoder().encode(SALT+i.value)).then(function(b){var h=Array.prototype.map.call(new Uint8Array(b),function(x){return('0'+x.toString(16)).slice(-2)}).join('');
if(h===H){try{localStorage.setItem(K,H)}catch(e){}open()}else{m.textContent='Woof? That is not it. Try again.';i.value='';i.focus()}})})})();</script>`;
}

module.exports = { gate };

if (require.main === module) {
  const [cmd, pw] = process.argv.slice(2);
  if (cmd === 'set' && pw) {
    const salt = crypto.randomBytes(16).toString('hex'), hash = crypto.createHash('sha256').update(salt + pw).digest('hex');
    fs.writeFileSync(CONF, JSON.stringify({ salt, hash }, null, 2) + '\n'); console.log('wrote tools/pages_gate.json (salt + hash only)');
  } else if (cmd === 'off') { const c = conf() || {}; fs.writeFileSync(CONF, JSON.stringify(Object.assign(c, { off: true }), null, 2) + '\n'); console.log('gate off'); }
  else console.log("usage: node tools/pages_gate.js set '<password>' | off");
}
