const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const languages = fs.readFileSync(path.join(root, 'src/lib/languages.ts'), 'utf8');
const translator = fs.readFileSync(path.join(root, 'src/lib/translator.ts'), 'utf8');

const checks = [
  ['Bulgarian is present in the app language catalog', /code:\s*"bg"/.test(languages)],
  ['Burmese is present in the app language catalog', /code:\s*"my"/.test(languages)],
  ['DeepL supports Bulgarian', /\bbg:\s*"BG"/.test(languages)],
  ['DeepL does not claim Burmese support', !/\bmy:\s*"/.test(languages)],
  ['DeepL skips unsupported target-language pairs', translator.includes("if (!DEEPL_SUPPORTED[target]) return false;")],
  ['DeepL skips pairs whose explicit source language is unsupported', translator.includes("Boolean(DEEPL_SUPPORTED[source])")],
  ['Microsoft Translator is available as a broad-language provider', translator.includes("provider === 'microsoft'") && translator.includes('translateMicrosoft(text, target, source)')],
  ['Google Cloud Translation is available as a broad-language provider', translator.includes("return translateGoogle(text, target, source)")],
  ['Provider chain tries the next provider after a prior provider is skipped or fails', translator.includes('for (const provider of order)') && translator.includes('continue;')],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log('PASS translation language-pair routing audit');
