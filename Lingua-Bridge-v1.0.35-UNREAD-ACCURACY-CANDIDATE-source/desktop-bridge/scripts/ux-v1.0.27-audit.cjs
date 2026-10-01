const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'electron', 'main.cjs'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'electron', 'host-preload.cjs'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const checks = [
  ['v1.0.27 package', pkg.version === '1.0.27'],
  ['Escape guest back handler', main.includes('shouldUseEscapeForEmbeddedBack') && main.includes('contents.goBack()')],
  ['Escape only leaves external linked pages', main.includes('!isTrustedMessengerUrl(currentUrl)')],
  ['host Escape back fallback', app.includes('escapeBackActiveView') && app.includes("event.key !== 'Escape'")],
  ['persistent webview retained', app.includes('persistentViews') && app.includes('syncPersistentWebviews')],
  ['Signal status IPC', main.includes("ipcMain.handle('lingua:signal-status'") && preload.includes('signalStatus:')],
  ['Signal executable detection retained', main.includes('findSignalExecutable') && main.includes('Signal.exe')],
  ['Signal genuine QR wording', app.includes('genuine QR code') && app.includes('official Signal Desktop app')],
  ['Signal native companion skips hidden webview', app.includes('serviceFor(instance).nativeCompanion') && app.includes('persistentViews.delete(instance.id)')],
  ['v1.0.26 fast translation retained', app.includes('broadRealtimeGapMs') && app.includes('incomingQueue')],
  ['v1.0.27 marker', app.includes("lingua.desktopVersion', '1.0.27")],
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
