const fs = require('fs');
const path = require('path');
const text = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'translator.ts'), 'utf8');
const checks = [
  ['strict override opt-in', text.includes('TRANSLATE_PROVIDER_STRICT')],
  ['DeepL common-language fast lane', text.includes("filtered = ['deepl', ...filtered.filter((provider) => provider !== 'deepl')]")],
  ['legacy forced provider becomes preference', text.includes('Legacy deployments sometimes left TRANSLATE_PROVIDER=gemini')],
  ['broad languages still fall through', text.includes('Broad targets such as Burmese automatically skip DeepL')],
];
let failed=0; for (const [name,ok] of checks) { console.log(`${ok?'PASS':'FAIL'} ${name}`); if(!ok) failed++; } if(failed) process.exit(1);
