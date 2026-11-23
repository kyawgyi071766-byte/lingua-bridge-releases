const fs = require('fs');
const path = require('path');
const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const blockStart = app.indexOf('const PROVIDER_EXTRA_LANGS = [');
const blockEnd = app.indexOf('];', blockStart);
const block = blockStart >= 0 && blockEnd > blockStart ? app.slice(blockStart, blockEnd + 2) : '';
const required = ['af','sq','ar','hy','az','bn','eu','gl','ka','gu','he','hi','is','ga','kk','ms','ml','mt','mr','my','ne','fa','pa','sr','sw','ta','te','th','ur','vi','cy','zu','tl'];
const forbidden = ['am','fil','kn','km','lo','sr-Latn','sr-Cyrl'];
const checks = [
  ['DeepL-Translator-listed extended languages remain available', Boolean(block) && required.every(code => new RegExp('\\["' + code + '"').test(block))],
  ['languages absent from the DeepL Translator list are excluded', Boolean(block) && forbidden.every(code => !new RegExp('\\["' + code + '"').test(block))],
  ['Serbian is listed once without claiming script-specific variants', block.split('["sr",').length === 2],
  ['Tagalog uses the DeepL-listed language name and code', block.includes('["tl", "Tagalog (Tagalog)')],
  ['the source documents that broad languages use fallback providers, not an implied DeepL API guarantee', app.includes('does not claim DeepL API support')],
  ['existing stored unsupported language selections are sanitized by the version migration', app.includes("localStorage.getItem('lingua.desktopVersion') !== '1.0.38'") && app.includes("localStorage.setItem('lingua.desktopVersion', '1.0.38')")]
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log((ok ? 'PASS ' : 'FAIL ') + name);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
