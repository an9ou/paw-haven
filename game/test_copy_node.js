// Copy and style check (plain node, no browser): replaces the separate QA review for the standing copy rules.
// node game/test_copy_node.js   (also runs as the `copy` suite in run_tests.js)
// Scans string literals in game/src/*.js and mods/*.js and fails on:
//   - banned words: "breed" as a verb, "stud", "litter price", "sell"/"sold" about dogs, franchise names
//   - emoji in code (use icons or HTML entities instead)
//   - semicolons in player-facing sentences
//   - browser dialogs: alert( / confirm( / prompt(  (every window is a centred popup)
// A line can opt out with a trailing comment `// copy-ok: <reason>`.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const files = [
  ...fs.readdirSync(path.join(ROOT, 'game/src')).filter((f) => f.endsWith('.js')).map((f) => 'game/src/' + f),
  ...fs.readdirSync(path.join(ROOT, 'mods')).filter((f) => /^[a-z]+\.js$/.test(f)).map((f) => 'mods/' + f),
];

const RULES = [
  { name: 'breed as a verb', re: /\b(to breed|breed (them|your|her|him|my|our|dogs)|breeding (your|her|him|them|dogs)|bred (by|with|from))\b/i },
  { name: 'stud', re: /\bstuds?\b/i },
  { name: 'litter price', re: /litter price/i },
  { name: 'selling dogs', re: /\b(sell|sells|selling|sold)\b[^.!?]*\b(dog|dogs|pup|pups|puppy|puppies)\b|\b(dog|dogs|pup|pups|puppy|puppies)\b[^.!?]*\b(sell|sells|selling|sold)\b/i },
  { name: 'franchise name', re: /nintendo|pok[eé]mon|animal crossing/i },
];
const EMOJI = /\p{Emoji_Presentation}/u; // real emoji only (text symbols like ♥ ★ ✓ are fine)
const DIALOG = /(^|[^\w.$]|window\.)(alert|confirm|prompt)\s*\(/;

// string literals on one line: '...', "...", `...` (template text between ${} is kept, the expressions are blanked)
function literals(line) {
  const out = []; let i = 0;
  while (i < line.length) {
    const c = line[i];
    if (c === '/' && line[i + 1] === '/') break; // line comment
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1, s = '';
      while (j < line.length && line[j] !== c) { if (line[j] === '\\') { s += line[j + 1] || ''; j += 2; continue; } if (c === '`' && line[j] === '$' && line[j + 1] === '{') { let d = 1; j += 2; while (j < line.length && d) { if (line[j] === '{') d++; else if (line[j] === '}') d--; j++; } s += ' X '; continue; } s += line[j]; j++; }
      out.push(s); i = j + 1; continue;
    }
    i++;
  }
  return out;
}
// player-facing sentence: has words and spaces, no markup or CSS
const sentence = (s) => /[A-Za-z]{3,} [A-Za-z]{2,}/.test(s) && !/[<>{}=]|\b(px|rgba?|var\(|translate|viewBox)\b|:\s*[\w#-]/.test(s);

let fails = 0, checked = 0;
for (const f of files) {
  const lines = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n'); let inBlock = false;
  lines.forEach((line, n) => {
    const tl = line.trim();
    if (inBlock) { if (tl.includes('*/')) inBlock = false; return; } // inside a /* block comment */
    if (tl.startsWith('/*') && !tl.includes('*/')) { inBlock = true; return; }
    if (/copy-ok:/.test(line) || /^(\*|\/\*|\/\/)/.test(tl)) return; // opt-out, or a comment line
    const where = `${f}:${n + 1}`;
    if (DIALOG.test(line.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '""'))) { console.log(`  FAIL ${where} browser dialog: ${line.trim().slice(0, 120)}`); fails++; }
    for (const s of literals(line)) {
      checked++;
      if (EMOJI.test(s)) { console.log(`  FAIL ${where} emoji in code: "${s.slice(0, 80)}"`); fails++; }
      if (!sentence(s)) continue;
      for (const r of RULES) if (r.re.test(s)) { console.log(`  FAIL ${where} ${r.name}: "${s.slice(0, 120)}"`); fails++; }
      if (/[a-z)]; [a-zA-Z]/.test(s)) { console.log(`  FAIL ${where} semicolon in player text: "${s.slice(0, 120)}"`); fails++; }
    }
  });
}
console.log(`\n${files.length} files, ${checked} strings checked, ${fails} problem(s)`);
if (!fails) console.log('ALL OK');
process.exit(fails ? 1 : 0);
