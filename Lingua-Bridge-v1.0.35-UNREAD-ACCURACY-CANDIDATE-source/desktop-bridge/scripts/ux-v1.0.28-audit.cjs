const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'electron', 'service-preload.cjs'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const checks = [
  ['current package version', pkg.version === '1.0.35'],
  ['current version marker', app.includes("lingua.desktopVersion', '1.0.35") && app.includes('v1.0.35')],
  ['composer hint source label payload', app.includes('sourceLangLabel:') && preload.includes('settings.sourceLangLabel')],
  ['empty composer hint survives focus', preload.includes('if (hasText)') && !preload.includes('if (focused || hasText)')],
  ['composer hint arrow text', preload.includes('`${sourceLabel} → ${targetLabel}`')],
  ['account details toolbar retained', app.includes('id="accountDetailsBtn"')],
  ['account details per-account editor', app.includes('editAccountDetails(instanceOverride = null)')],
  ['sidebar right-click account editor', app.includes("button.addEventListener('contextmenu', editThisAccount)")],
  ['sidebar double-click account editor', app.includes("button.addEventListener('dblclick', editThisAccount)")],
  ['hover edit help', app.includes('Right-click this account to save/edit name and phone.')],
  ['translation card click isolation', preload.includes("for (const eventName of ['pointerdown', 'mousedown', 'click', 'dblclick'])") && preload.includes('event.stopPropagation()')],
  ['translation cache exists', preload.includes('const translationCache = new Map()') && preload.includes('TRANSLATION_CACHE_LIMIT')],
  ['translation result cached', preload.includes('rememberTranslation(fp, result.translatedText, result.provider, targetLang)')],
  ['translation card restoration', preload.includes('restoreCachedTranslation(node, fp, targetLang)') || preload.includes('restoreCachedTranslation(node, fp)')],
  ['per-message incoming auto-detect retained', preload.includes("sourceLang: 'auto'")],
  ['persistent no-refresh retained', app.includes('persistentViews') && app.includes('syncPersistentWebviews')],
  ['Signal companion retained', app.includes('Open Signal Desktop / QR')],
  ['ESC back retained', app.includes('escapeBackActiveView')],
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
