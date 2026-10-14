const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const serviceSource = fs.readFileSync(path.join(root, 'electron/service-preload.cjs'), 'utf8');
const mainSource = fs.readFileSync(path.join(root, 'electron/main.cjs'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');

function serviceRulesFrom(source) {
  const start = source.indexOf('const SERVICE_RULES = [');
  const endMarker = source.indexOf('\n];', start);
  assert(start >= 0 && endMarker > start, 'SERVICE_RULES exists');
  const context = vm.createContext({});
  vm.runInContext(source.slice(start, endMarker + 3) + '\nglobalThis.__rules = SERVICE_RULES;', context);
  return Array.from(context.__rules, rule => ({
    id: rule.id,
    match: rule.match,
    messageSelectors: Array.from(rule.messageSelectors || []),
    bubbleSelectors: Array.from(rule.bubbleSelectors || []),
    composerSelectors: Array.from(rule.composerSelectors || []),
    sendSelectors: Array.from(rule.sendSelectors || []),
  }));
}

const rules = serviceRulesFrom(serviceSource);
function ruleFor(host) {
  return rules.find(rule => rule.match(host)) || rules[rules.length - 1];
}
function assertProfile(host, expectedId, label = host) {
  const rule = ruleFor(host);
  assert.equal(rule.id, expectedId, label + ' selects the expected adapter');
  assert.ok(rule.messageSelectors.length > 0, label + ' has message selectors');
  assert.ok(rule.composerSelectors.length > 0, label + ' has composer selectors');
  assert.ok(rule.sendSelectors.length > 0, label + ' has send selectors');
  return rule;
}

// The built-in services which use web message composers must route to a
// service-specific adapter rather than the generic selector set.
const domainCases = [
  ['web.whatsapp.com', 'whatsapp'],
  ['web.telegram.org', 'telegram'],
  ['www.messenger.com', 'messenger'],
  ['www.facebook.com', 'messenger'],
  ['www.instagram.com', 'instagram'],
  ['discord.com', 'discord'],
  ['x.com', 'x'],
  ['chat.google.com', 'googlechat'],
  ['www.tiktok.com', 'tiktok'],
  ['vk.com', 'vk'],
  ['web.line.me', 'line'],
  ['teams.microsoft.com', 'teams'],
  ['teams.live.com', 'teams'],
  ['web.snapchat.com', 'snapchat'],
  ['chat.zalo.me', 'zalo'],
  ['slack.com', 'slack'],
  ['messages.google.com', 'googlemessages'],
  ['www.linkedin.com', 'linkedin'],
];
for (const [host, id] of domainCases) assertProfile(host, id);

const tiktok = rules.find(rule => rule.id === 'tiktok');
assert.ok(tiktok.messageSelectors.some(s => s.includes('data-e2e="message-content"')));
assert.ok(tiktok.composerSelectors.some(s => s.includes('data-e2e="message-input-area"')));
assert.ok(tiktok.sendSelectors.some(s => s.includes('send-msg-btn')));
const vk = rules.find(rule => rule.id === 'vk');
assert.ok(vk.messageSelectors.some(s => s.includes('im-mess--text')));
const teams = rules.find(rule => rule.id === 'teams');
assert.ok(teams.messageSelectors.some(s => s.includes('messageBodyContent')));
assert.ok(teams.composerSelectors.some(s => s.includes('ckeditor')));
const generic = rules.find(rule => rule.id === 'generic');
assert.ok(generic.messageSelectors.some(s => s.includes('data-testid*="message-content"')));
assert.ok(generic.composerSelectors.some(s => s.includes('div[contenteditable="true"]')));
assert.ok(generic.sendSelectors.some(s => s.includes('data-e2e*="send"')));

// Every built-in UI service is still registered. Signal is intentionally a
// native desktop companion and Chrome/Web is the generic custom-site browser.
for (const id of [
  'whatsapp', 'telegram', 'messenger', 'instagram', 'facebook', 'discord',
  'x', 'googlechat', 'tiktok', 'vk', 'line', 'teams', 'snapchat', 'zalo',
  'slack', 'googlemessages', 'linkedin', 'signal', 'chrome', 'custom'
]) {
  assert.ok(appSource.includes("id:'" + id + "'"), 'built-in app remains registered: ' + id);
}

// The host allow-list controls webview permissions. Newly supported messaging
// origins need the same trusted origin treatment for their intended features.
const trustedMatch = mainSource.match(/const TRUSTED_MESSENGER_HOSTS = \[([\s\S]*?)\];/);
assert.ok(trustedMatch, 'trusted webview host allow-list exists');
const trustedHosts = [...trustedMatch[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
for (const host of [
  'tiktok.com', 'vk.com', 'line.me', 'line.naver.jp',
  'teams.microsoft.com', 'teams.live.com', 'snapchat.com', 'zalo.me'
]) assert.ok(trustedHosts.includes(host), 'trusted host allow-list includes ' + host);

// Composer and send fallbacks must be used even when platform-specific classes
// change; send interception is additionally label- and proximity-aware.
assert.ok(serviceSource.includes('const COMMON_COMPOSER_FALLBACKS = ['));
assert.ok(serviceSource.includes('...(rule().composerSelectors || []), ...COMMON_COMPOSER_FALLBACKS'));
assert.ok(serviceSource.includes('const COMMON_SEND_FALLBACKS = ['));
assert.ok(serviceSource.includes('...(rule().sendSelectors || []), ...COMMON_SEND_FALLBACKS'));
assert.ok(/function matchesSendTarget\(target\)[\s\S]*?sendLabel[\s\S]*?horizontalGap < 420/.test(serviceSource));
assert.ok(/function findComposer\(\)[\s\S]*?composerScore\(all\[0\]\) > 0/.test(serviceSource));

// Test own-message recognition for platform-specific class conventions.
function functionSource(name) {
  const start = serviceSource.indexOf('function ' + name + '(');
  const end = serviceSource.indexOf('\nfunction ', start + 10);
  assert(start >= 0 && end > start, name + ' helper exists');
  return serviceSource.slice(start, end);
}
let currentRule = rules.find(rule => rule.id === 'tiktok');
const context = vm.createContext({
  rule: () => currentRule,
  findBubble: node => node?.bubble || null,
  innerWidth: 1280,
});
vm.runInContext(functionSource('isOutgoingMessage') + '\nglobalThis.__isOutgoingMessage = isOutgoingMessage;', context);
assert.equal(context.__isOutgoingMessage({ bubble: { className: 'message--out' } }), true);
currentRule = rules.find(rule => rule.id === 'vk');
assert.equal(context.__isOutgoingMessage({ bubble: { className: 'im-mess_out' } }), true);
currentRule = rules.find(rule => rule.id === 'teams');
assert.equal(context.__isOutgoingMessage({ bubble: { className: 'message--outgoing' } }), true);

console.log('PASS platform-specific message/composer adapters for TikTok, VK, LINE, Teams, Snapchat, Zalo, and existing web messengers');
console.log('PASS common composer/send fallbacks and trusted host allow-list');
console.log('PASS platform-specific outgoing-message recognition');
