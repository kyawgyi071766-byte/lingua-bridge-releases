const fs = require('fs');
const translator = fs.readFileSync('src/lib/translator.ts','utf8');
const env = fs.readFileSync('.env.example','utf8');
const checks = [
  ['Gemini provider type wired', translator.includes("'gemini'") && translator.includes('translateGemini')],
  ['Gemini secret remains server-side', translator.includes('process.env.GEMINI_API_KEY') && !fs.readFileSync('desktop-bridge/src/app.js','utf8').includes('GEMINI_API_KEY')],
  ['Gemini auth uses x-goog-api-key', translator.includes("'x-goog-api-key': key!")],
  ['Gemini stable model default wired', translator.includes("'gemini-3.5-flash-lite'")],
  ['Gemini current-model fallback wired', translator.includes("'gemini-3.8-flash'")],
  ['DeepL-first explicit chain documented', env.includes('TRANSLATE_CHAIN=deepl,gemini,microsoft,google')],
  ['Broad-language status exposes Gemini', translator.includes('geminiConfigured: hasGemini()')],
  ['Original text safety remains', translator.includes('Your original text was not replaced')],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; }
if (failed) process.exit(1);
