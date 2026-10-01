const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const servicePreload = fs.readFileSync(path.join(root, 'electron/service-preload.cjs'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const installer = JSON.parse(fs.readFileSync(path.join(root, 'electron-builder.public-installer.json'), 'utf8'));
const zip = JSON.parse(fs.readFileSync(path.join(root, 'electron-builder.public-zip.json'), 'utf8'));
const checks = [
  ['v1.0.27 version marker', app.includes("lingua.desktopVersion', '1.0.27") && pkg.version === '1.0.27'],
  ['stable upgrade app identity retained', installer.appId === 'com.lingua.bridge' && pkg.build?.appId === 'com.lingua.bridge'],
  ['stable public product name retained', installer.productName === 'Lingua Bridge' && pkg.build?.productName === 'Lingua Bridge'],
  ['public outputs target v1.0.27 folder', installer.directories?.output === 'release-v1.0.27-public' && zip.directories?.output === 'release-v1.0.27-public'],
  ['composer hint hides while focused', servicePreload.includes('if (focused || hasText)') && servicePreload.includes("hint.style.display = 'none'")],
  ['composer hint no longer overlays typed text', !servicePreload.includes('hasText ? `Lingua → customer receives ${label}`')],
  ['empty composer still has target hint', servicePreload.includes('`Translate to ${label} before sending`')],
  ['verified update download retained', app.includes('downloadAvailableUpdate') && app.includes('downloadUpdate({ url, sha256')],
  ['rate-limit stability retained', app.includes('incomingQueue') && app.includes('linguaSettingsSignature')],
  ['persistent no-refresh switching retained', app.includes('persistentViews') || app.includes('viewRegistry') || app.includes('hostedViews')],
  ['robust pointer reorder retained', app.includes('setPointerCapture') && app.includes('syncInstanceListDomOrder')],
  ['Burmese broad-language support retained', app.includes('["my", "Myanmar / Burmese')],
];
let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
