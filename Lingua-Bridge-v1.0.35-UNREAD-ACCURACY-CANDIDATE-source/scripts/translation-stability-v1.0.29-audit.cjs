const fs = require('fs');
const translator = fs.readFileSync('src/lib/translator.ts','utf8');
const route = fs.readFileSync('src/app/api/translate/route.ts','utf8');

const checks = [
  ['auto mode DeepL-first hardening', translator.includes("filtered = ['deepl', ...filtered.filter((provider) => provider !== 'deepl')]")],
  ['forced provider preserved', translator.includes("if (NETWORK_PROVIDERS.includes(forced")],
  ['provider fallback loop preserved', translator.includes('for (const provider of order)')],
  ['failed usage reservation rolled back', route.includes('usageChars: { decrement: charCount }')],
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
