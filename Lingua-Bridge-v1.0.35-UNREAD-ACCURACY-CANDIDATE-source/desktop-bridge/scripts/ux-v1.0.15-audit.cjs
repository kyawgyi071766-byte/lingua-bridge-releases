const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
const main = fs.readFileSync(path.join(root, 'electron/main.cjs'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'electron/host-preload.cjs'), 'utf8');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'electron-builder.candidate.json'), 'utf8'));
const checks = [
  ['v1.0.16 marker', app.includes("lingua.desktopVersion', '1.0.16")],
  ['Chrome/Web built-in service exists', app.includes("id:'chrome'") && app.includes("name:'Chrome / Web'") && app.includes('browser:true')],
  ['Chrome/Web default opens Google in-app', app.includes("url:'https://www.google.com/'")],
  ['Chrome/Web has browser navigation controls', ['browserBack','browserForward','browserHome','browserRefresh','browserAddress','browserGo'].every(x => app.includes(x))],
  ['Chrome/Web search and address normalization exists', app.includes('normalizeBrowserInput') && app.includes('google.com/search?q=')],
  ['Chrome/Web only accepts normal web protocols', app.includes("['https:', 'http:'].includes(parsed.protocol)")],
  ['Chrome/Web persists current URL', app.includes('rememberBrowserUrl') && app.includes("view.addEventListener('did-navigate'") && app.includes("view.addEventListener('did-navigate-in-page'")],
  ['Chrome/Web does not load messenger translation preload', app.includes("browserMode ? '' :") && app.includes('preload="${esc(state.preloadPath)}"') && app.includes('if (!browserMode) sendSettings();')],
  ['Chrome/Web browser toolbar styles exist', css.includes('.browser-toolbar') && css.includes('.browser-address')],
  ['Chrome/Web workspace row is isolated', css.includes('.workspace.browser-active')],
  ['fast service warmup remains wired', app.includes('warmService') && preload.includes('warmService') && main.includes("lingua:warm-service") && main.includes('preconnect')],
  ['Signal stays in-app', app.includes("id:'signal'") && app.includes("url:'https://signal.org/'") && !main.includes("shell.openExternal('https://signal.org/')")],
  ['drag reorder preserved', app.includes('bindInstanceDragDrop') && app.includes('reorderInstanceInState')],
  ['admin custom apps preserved', app.includes('Owner / Admin Custom App Manager') && app.includes('createCustomService')],
  ['Stage 1 broad language support present', app.includes('PROVIDER_EXTRA_LANGS') && app.includes('Myanmar / Burmese (မြန်မာ)') && app.includes('Thai (ไทย)')],
  ['candidate remains side-by-side', cfg.appId === 'com.lingua.bridge.microsoft.fallback.candidate'],
];
let failed = false;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
console.log('v1.0.16 preserves Chrome in-app / fast-add behavior: PASS');
