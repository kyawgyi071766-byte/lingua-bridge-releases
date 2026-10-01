const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'electron', 'service-preload.cjs'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const checks = [
  ['v1.0.25 package', pkg.version === '1.0.25'],
  ['active account unread is not cleared on selection', !app.includes('clearInstanceUnread(state.activeId)') && app.includes('state.unreadByInstance[id] = raw')],
  ['account rail badge mirrors raw unread', app.includes('state.unreadRawByInstance[id] = raw') && app.includes('data-unread-for')],
  ['red unread badge overlays service icon', app.includes('service-icon-wrap') && css.includes('.service-icon-wrap') && css.includes('.instance-unread-badge')],
  ['collapsed/expanded account rail remains', app.includes('toggleInstances') && css.includes('.app-shell.instances-collapsed')],
  ['round rail controls', css.includes('border-radius:50%') && css.includes('.instances-collapse-btn')],
  ['account hover tooltip present', app.includes('accountHoverTooltip') && app.includes('showAccountHoverTooltip') && css.includes('.account-hover-tooltip')],
  ['account details persist locally', app.includes('lingua.accountDetails') && app.includes('editAccountDetails') && app.includes('Account details')],
  ['hover tooltip includes name and phone', app.includes('<span>Name</span>') && app.includes('<span>Phone</span>')],
  ['Telegram unread selectors broadened', preload.includes('.chatlist-chat .badge.unread') && preload.includes('[data-peer-id] .badge')],
  ['account badge counts unread conversations', preload.includes('unreadConversationCountFromSelectors') && preload.includes('return domCount > 0 ? domCount : titleCount')],
  ['persistent webviews retained', app.includes('persistentViews') && app.includes('syncPersistentWebviews')],
  ['version marker', app.includes("lingua.desktopVersion', '1.0.25") && app.includes('v1.0.25')]
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; }
if (failed) process.exit(1);
