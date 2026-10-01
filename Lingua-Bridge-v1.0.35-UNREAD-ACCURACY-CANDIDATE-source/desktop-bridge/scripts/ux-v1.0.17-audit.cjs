const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'electron/service-preload.cjs'), 'utf8');
const main = fs.readFileSync(path.join(root, 'electron/main.cjs'), 'utf8');
const hostPreload = fs.readFileSync(path.join(root, 'electron/host-preload.cjs'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'electron-builder.candidate.json'), 'utf8'));

const checks = [
  ['Version is 1.0.17', pkg.version === '1.0.17' && app.includes("lingua.desktopVersion', '1.0.17")],
  ['Persistent webview map exists', app.includes('const persistentViews = new Map()')],
  ['Persistent webview host lives outside renderer rebuild', app.includes('ensurePersistentWebviewHost') && app.includes("document.body.appendChild(persistentWebviewHost)")],
  ['Renderer no longer injects active <webview>', !app.includes('<webview id="serviceView"')],
  ['Switch render reuses persistent webviews', app.includes('syncPersistentWebviews()') && app.includes('activePersistentView()')],
  ['Inactive views stay mounted', app.includes("view.style.visibility = active ? 'visible' : 'hidden'") && app.includes("view.style.pointerEvents = active ? 'auto' : 'none'")],
  ['First-load white flash masked', app.includes('linguaPersistentLoading') && app.includes("view.dataset.ready === '1'")],
  ['Inactive translation scanning suspended', preload.includes('if (!settings.isActive) return;') && preload.includes('isActive: false')],
  ['Active/inactive flag is sent to guests', app.includes('isActive: Boolean(isActive)')],
  ['Conversation state is bound to instance', app.includes('state.activeConversations[instance.id]')],
  ['Broad provider gating remains', app.includes('broadProviderConfigured') && app.includes('Microsoft Translator') && app.includes('Google Cloud Translation')],
  ['Myanmar/Burmese broad language present', app.includes('Myanmar / Burmese (မြန်မာ)')],
  ['Extended language set expanded', ['Afrikaans','Bangla','Hebrew','Khmer','Malay','Nepali','Persian','Punjabi','Tamil','Urdu','Welsh','Zulu'].every(x => app.includes(x))],
  ['Unavailable broad options are disabled', app.includes("unavailable?'disabled':''") && app.includes('setup required')],
  ['Provider refresh control exists', app.includes('refreshProviderStatus')],
  ['Chrome in-app preserved', app.includes("id:'chrome'") && app.includes('normalizeBrowserInput')],
  ['Signal in-app preserved', app.includes("id:'signal'") && !main.includes("shell.openExternal('https://signal.org/')")],
  ['Fast warmup preserved', app.includes('warmService') && hostPreload.includes('warmService') && main.includes("lingua:warm-service")],
  ['Drag ordering preserved', app.includes('bindInstanceDragDrop') && app.includes('reorderInstanceInState')],
  ['Candidate is side-by-side', cfg.appId === 'com.lingua.bridge.norefresh.multilang.candidate'],
  ['Provider capability styling exists', css.includes('.provider-capability') && css.includes('.provider-action-grid')],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log('v1.0.17 no-refresh multilang audit: PASS');
