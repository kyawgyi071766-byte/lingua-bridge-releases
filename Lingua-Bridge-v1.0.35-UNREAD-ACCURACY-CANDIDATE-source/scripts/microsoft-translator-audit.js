const fs = require('fs');
const translator = fs.readFileSync('src/lib/translator.ts','utf8');
const languages = fs.readFileSync('src/lib/languages.ts','utf8');
const env = fs.readFileSync('.env.example','utf8');
const status = fs.readFileSync('src/app/api/translate/status/route.ts','utf8');
const checks = [
  ['Microsoft provider type exists', /'microsoft'/.test(translator)],
  ['Microsoft key remains environment-only', /process\.env\.MICROSOFT_TRANSLATOR_KEY/.test(translator) && !/MICROSOFT_TRANSLATOR_KEY\s*=\s*['\"][^r]/.test(translator)],
  ['Microsoft subscription key header exists', /Ocp-Apim-Subscription-Key/.test(translator)],
  ['Optional Microsoft region header exists', /Ocp-Apim-Subscription-Region/.test(translator)],
  ['Microsoft v3 translate route exists', /api-version/.test(translator) && /3\.0/.test(translator) && /\/translate/.test(translator)],
  ['Safe chain includes DeepL Microsoft Google', /deepl.*microsoft.*google/s.test(translator)],
  ['Stage 1 languages include ar hi my th vi', ['ar','hi','my','th','vi'].every(c => languages.includes(`code: "${c}"`))],
  ['Environment template documents Microsoft', /MICROSOFT_TRANSLATOR_KEY/.test(env) && /TRANSLATE_CHAIN=deepl,gemini,microsoft,google/.test(env)],
  ['Status route uses server-side provider status only', /translationProviderStatus/.test(status)],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok?'PASS':'FAIL'} - ${name}`); if(!ok) failed++; }
if (failed) process.exit(1);
console.log('Microsoft Translator Stage 1 audit: PASS');
