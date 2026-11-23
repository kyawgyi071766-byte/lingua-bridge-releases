const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');

const standardStart = app.indexOf('const LANGS = [');
const standardEnd = app.indexOf('];', standardStart);
const extraStart = app.indexOf('const PROVIDER_EXTRA_LANGS = [');
const extraEnd = app.indexOf('];', extraStart);
assert(standardStart >= 0 && standardEnd > standardStart, 'standard language list exists');
assert(extraStart >= 0 && extraEnd > extraStart, 'broad-provider language list exists');

const standardLanguages = app.slice(standardStart, standardEnd);
const broadProviderLanguages = app.slice(extraStart, extraEnd);

assert.match(standardLanguages, /\["my",\s*"Myanmar \/ Burmese \(မြန်မာ\)"\]/,
  'Burmese is selectable in the regular DeepL-supported language group');
assert.doesNotMatch(broadProviderLanguages, /\["my",/,
  'Burmese is not incorrectly gated behind Gemini/Microsoft/Google availability');
assert.match(app, /const DEEPL_LANGUAGE_CODES = new Set\(LANGS\.map\(\(\[id\]\) => id\)\)/,
  'the regular language catalog defines DeepL-supported options');
assert.match(app, /const PROVIDER_EXTRA_CODES = new Set\(PROVIDER_EXTRA_LANGS\.map\(\(\[id\]\) => id\)\)/,
  'only the broad-provider list is subject to the optional-provider gate');
assert.match(app, /if \(PROVIDER_EXTRA_CODES\.has\(value\)\)/,
  'language selection checks the broad-provider gate only for broad-provider languages');

assert.match(app, /Burmese\/Myanmar is available through DeepL/,
  'provider status text confirms Burmese is available through DeepL');
assert.doesNotMatch(app, /DeepL-only mode: Myanmar\/Burmese and other extended languages stay disabled/,
  'provider status text no longer disables Burmese when broad providers are absent');
assert.doesNotMatch(app, /DeepL-only for broad-language purposes\. Configure[^\n]*Myanmar\/Burmese and other broad languages/,
  'refresh-provider notice no longer says Burmese requires a broad provider');
assert.match(app, /DeepL-only mode: Arabic, Hindi, Thai, Vietnamese[\s\S]{0,600}Burmese\/Myanmar is available through DeepL/,
  'owner provider panel distinguishes DeepL Burmese from other broad-only languages');
assert.match(app, /Current server is DeepL-only for broad-language purposes[\s\S]{0,600}Burmese\/Myanmar is available through DeepL/,
  'provider refresh notice explains Burmese remains available through DeepL');

console.log('PASS Burmese is a regular selectable DeepL language');
console.log('PASS Burmese is not disabled when optional broad-language providers are absent');
