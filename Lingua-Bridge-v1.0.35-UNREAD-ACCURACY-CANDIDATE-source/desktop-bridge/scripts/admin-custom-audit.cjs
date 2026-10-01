const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const main = fs.readFileSync(path.join(root, 'electron/main.cjs'), 'utf8');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'electron-builder.public-installer.json'), 'utf8'));
const checks = [
  ['current version marker', app.includes("lingua.desktopVersion', '1.0.35")],
  ['Signal service card in-app', app.includes("id:'signal'") && !app.includes("external:'signal'")],
  ['Signal protocol guarded', main.includes('signalProtocolRegistered()') && main.includes("shell.openExternal('sgnl://')")],
  ['Signal browser fallback removed', !main.includes("shell.openExternal('https://signal.org/')")],
  ['Admin custom manager UI', app.includes('Owner / Admin Custom App Manager')],
  ['Admin custom create', app.includes('function createCustomService()')],
  ['Admin custom edit', app.includes('function editCustomService(id)')],
  ['Admin custom delete', app.includes('function deleteCustomService(id)')],
  ['Owner role gate', app.includes('if (!isOwnerAdmin()) return setNotice')],
  ['Customer picker excludes custom templates', app.includes("return isOwnerAdmin() ? [...builtins, ...state.customServices] : builtins")],
  ['HTTPS-only validation', app.includes("parsed.protocol !== 'https:'")],
  ['Embedded credentials blocked', app.includes('parsed.username || parsed.password')],
  ['Custom template persistence', app.includes("localStorage.setItem('lingua.customServices'")],
  ['Instance session isolation', app.includes("const partition = `persist:lingua-${svc.ownerCustom ? 'custom' : svc.id}-${id}`")],
  ['Template deletion preserves instances', app.includes('Existing instances already added to Lingua will remain')],
  ['Stable upgrade app ID', cfg.appId === 'com.lingua.bridge'],
  ['Stable product name', cfg.productName === 'Lingua Bridge'],
  ['Stable public output', cfg.directories?.output === 'release-v1.0.35-public'],
];
let failed = false;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
