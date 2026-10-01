const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
const build = fs.readFileSync(path.join(root, 'scripts/build-static.cjs'), 'utf8');
const main = fs.readFileSync(path.join(root, 'electron/main.cjs'), 'utf8');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'electron-builder.candidate.json'), 'utf8'));
const checks = [
  ['v1.0.13 marker', app.includes("lingua.desktopVersion', '1.0.13")],
  ['instances are draggable', app.includes('draggable="true"') && app.includes('bindInstanceDragDrop')],
  ['reorder persists in instances array', app.includes('reorderInstanceInState') && app.includes('state.instances.splice') && app.includes('persist();')],
  ['reorder avoids full render', app.includes("setNotice('Account order saved") && !/function reorderInstanceInState[\s\S]{0,1200}render\(\)/.test(app)],
  ['drag visuals present', css.includes('.instance-item.dragging') && css.includes('.drag-over-before') && css.includes('.drag-over-after')],
  ['new logo in renderer', app.includes('src="./lingua-logo.png"') && fs.existsSync(path.join(root, 'src', 'lingua-logo.png'))],
  ['static build copies logo', build.includes("'lingua-logo.png'" )],
  ['window icon uses logo', main.includes("assets', 'lingua-logo.png")],
  ['windows installer icon configured', cfg.win?.icon === 'build/lingua.ico' && fs.existsSync(path.join(root, 'build', 'lingua.ico'))],
  ['Burmese incoming-only option present', app.includes('INCOMING_EXTRA_LANGS') && app.includes('Myanmar / Burmese (မြန်မာ)')],
  ['Burmese selection requires Google', app.includes("value === 'my'") && app.includes('googleConfigured')],
  ['Burmese is not added to outgoing selector', !app.includes('langOptions(settings.outgoingTarget,false,INCOMING_EXTRA_LANGS)')],
  ['Signal safe fallback preserved', main.includes('signalProtocolRegistered()') && main.includes("shell.openExternal('https://signal.org/')")],
  ['admin custom apps preserved', app.includes('Owner / Admin Custom App Manager') && app.includes('createCustomService')],
  ['candidate is side-by-side', cfg.appId === 'com.lingua.bridge.draglogo.burmese.candidate'],
];
let failed = false;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
