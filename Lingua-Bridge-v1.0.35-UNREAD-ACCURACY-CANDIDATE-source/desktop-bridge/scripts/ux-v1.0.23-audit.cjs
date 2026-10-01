const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'electron', 'service-preload.cjs'), 'utf8');
const main = fs.readFileSync(path.join(root, 'electron', 'main.cjs'), 'utf8');
const host = fs.readFileSync(path.join(root, 'electron', 'host-preload.cjs'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const checks = [
  ['v1.0.25 package', pkg.version === '1.0.25'],
  ['collapsible instance rail state', app.includes('instancesCollapsed') && app.includes('toggleInstances') && css.includes('.app-shell.instances-collapsed')],
  ['red unread account badge', app.includes('instance-unread-badge') && css.includes('background:#e53935')],
  ['unread state IPC', preload.includes("sendToHost('lingua-unread-state'") && app.includes("event.channel === 'lingua-unread-state'")],
  ['inactive account native notification', host.includes('notifyUnread') && main.includes("ipcMain.handle('lingua:notify-unread'")],
  ['Telegram unread selectors', preload.includes('#column-left .chatlist-chat .badge') && preload.includes('.ChatFolders .Chat .Badge.unread')],
  ['Signal genuine QR wording', app.includes('genuine linking QR code') && app.includes('Signal does not provide an official browser chat')],
  ['Signal official download', app.includes("https://signal.org/download/")],
  ['persistent webview preserved', app.includes('persistentViews') && app.includes('syncPersistentWebviews')],
  ['version marker', app.includes("lingua.desktopVersion', '1.0.25") && app.includes('v1.0.25')]
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; }
if (failed) process.exit(1);
