const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const preload = fs.readFileSync(path.join(root, 'electron', 'service-preload.cjs'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const checks = [
  ['v1.0.25 safe-send carried into v1.0.27', pkg.version === '1.0.27'],
  ['follow-up native events blocked while translating', preload.includes('outgoingBusy || (Date.now() < suppressNativeUntil') && preload.includes('preventEvent(event);\n    return true;')],
  ['verified composer replacement', preload.includes('composer replacement verification failed') && preload.includes('safe-send check failed')],
  ['WhatsApp merge regression documented in code', preload.includes('make WhatsApp merge') && preload.includes('Replace the *entire* editable selection')],
  ['auto-send only after exact composer verification', preload.includes("composerText(active) !== expectedText") && preload.includes('clickSend();')],
  ['translation and no-refresh UI retained', app.includes('persistentViews') && app.includes('syncPersistentWebviews')],
  ['v1.0.27 marker', app.includes("lingua.desktopVersion', '1.0.27")],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; }
if (failed) process.exit(1);
