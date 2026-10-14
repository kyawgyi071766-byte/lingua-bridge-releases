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
  if (expectedId === 'discord') {
    // Discord normally sends from Enter; this adapter intentionally has no
    // generic button selector to avoid intercepting unrelated toolbar buttons.
    assert.equal(rule.sendSelectors.length, 0, label + ' uses keyboard send');
    assert.ok(serviceSource.includes("function onNativeKeydown(event)"), 'keyboard send interception is wired');
  } else {
    assert.ok(rule.sendSelectors.length > 0, label + ' has send selectors');
  }
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
assert.ok(tiktok.messageSelectors.some(s => s.toLowerCase().includes('data-e2e*="message"')));
assert.ok(tiktok.messageSelectors.some(s => s.toLowerCase().includes('data-testid*="message"')));
assert.ok(tiktok.messageSelectors.some(s => s.toLowerCase().includes('chat-message')));
assert.ok(tiktok.bubbleSelectors.some(s => s.toLowerCase().includes('message-item')));
assert.ok(tiktok.composerSelectors.some(s => s.includes('data-e2e="message-input-area"')));
assert.ok(tiktok.composerSelectors.some(s => s.toLowerCase().includes('data-testid*="composer"')));
assert.ok(tiktok.sendSelectors.some(s => s.includes('send-msg-btn')));
assert.match(serviceSource, /tiktok:\s*\[[\s\S]*?chat-room-title/);
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
const navigationHosts = (appSource.match(/const trustedMessengerHosts = \[([\s\S]*?)\];/) || [])[1] || '';
for (const host of [
  'tiktok.com', 'vk.com', 'line.me', 'line.naver.jp',
  'teams.microsoft.com', 'teams.live.com', 'snapchat.com', 'zalo.me'
]) assert.ok(navigationHosts.includes("'" + host + "'"), 'navigation allow-list includes ' + host);

// Composer and send fallbacks must be used even when platform-specific classes
// change; send interception is additionally label- and proximity-aware.
assert.ok(serviceSource.includes('const COMMON_COMPOSER_FALLBACKS = ['));
assert.ok(serviceSource.includes('...(rule().composerSelectors || []), ...COMMON_COMPOSER_FALLBACKS'));
assert.ok(serviceSource.includes('const COMMON_SEND_FALLBACKS = ['));
assert.ok(serviceSource.includes('...(rule().sendSelectors || []), ...COMMON_SEND_FALLBACKS'));
assert.ok(/function matchesSendTarget\(target\)[\s\S]*?sendLabel[\s\S]*?horizontalGap < 420/.test(serviceSource));
assert.ok(/function findComposer\(\)[\s\S]*?composerScore\(all\[0\]\) > 0/.test(serviceSource));
assert.ok(serviceSource.includes('const COMMON_MESSAGE_FALLBACKS = ['));
assert.ok(serviceSource.includes('...(rule().messageSelectors || []), ...COMMON_MESSAGE_FALLBACKS'));
assert.ok(serviceSource.includes('[data-e2e*="message" i] [dir="auto"]'));
assert.ok(serviceSource.includes('[data-testid*="message" i] [dir="auto"]'));
assert.ok(serviceSource.includes('[class*="chat-message" i] [dir="auto"]'));
assert.ok(serviceSource.includes('const COMMON_BUBBLE_FALLBACKS = ['));
assert.ok(serviceSource.includes('...(rule().bubbleSelectors || []), ...COMMON_BUBBLE_FALLBACKS'));
assert.ok(serviceSource.includes('[data-testid*="message-item" i]'));
assert.ok(serviceSource.includes('[class*="chat-message" i]'));
assert.ok(serviceSource.includes('function findComposerForEventTarget(target)'), 'focused-editor fallback exists');
assert.ok(serviceSource.includes("requestOutgoingTranslation(event, 'keydown', composer)"), 'Enter uses the actual editor');
assert.ok(serviceSource.includes("requestOutgoingTranslation(event, 'pointerdown', composerForSendAction(), button)"), 'Send button uses the focused editor and preserves the original Send control');
assert.ok(serviceSource.includes("document.addEventListener('submit', onNativeSubmit, true)"), 'form-submit fallback exists');
assert.ok(serviceSource.includes('pending.composer'), 'translation result remains tied to the originating editor');
assert.ok(serviceSource.includes('pending.conversationKey'), 'send is guarded when chat changes during translation');
assert.ok(serviceSource.includes('const nearComposerEnd ='), 'icon-only Send buttons have a guarded spatial fallback');
assert.ok(serviceSource.includes('clickSend(pending.sendButton)'), 'translated text uses the same native Send button when available');
assert.ok(/送|ส่ง|ပို့|إرسال|ارسال/.test(serviceSource), 'localized Send labels are supported');

// Test own-message recognition for platform-specific class conventions.
function functionSource(name) {
  const start = serviceSource.indexOf('function ' + name + '(');
  const end = serviceSource.indexOf('\nfunction ', start + 10);
  assert(start >= 0 && end > start, name + ' helper exists');
  return serviceSource.slice(start, end);
}

// Exercise the focused-composer fallback used when a platform's DOM no longer
// matches its preferred selector. It must find message inputs but reject search boxes.
{
  const context = vm.createContext({
    document: { activeElement: null },
    innerHeight: 1000,
    cleanText: value => String(value || '').replace(/\s+/g, ' ').trim(),
    isVisible: element => Boolean(element && element.visible),
  });
  vm.runInContext(
    functionSource('composerScore') + '\n' +
    functionSource('findComposerForEventTarget') + '\n' +
    'globalThis.__findComposerForEventTarget = findComposerForEventTarget;',
    context
  );

  function editable({tagName = 'DIV', type = '', attrs = {}, className = '', top = 650, searchAncestor = false, parent = null} = {}) {
    const element = {
      nodeType: 1,
      tagName,
      type,
      className,
      id: '',
      parentElement: parent,
      visible: true,
      isConnected: true,
      getAttribute(name) { return attrs[name] ?? (name === 'type' ? type : null); },
      matches(selector) {
        if (selector.includes('textarea') && selector.includes('contenteditable="true"')) {
          if (['TEXTAREA', 'INPUT'].includes(tagName)) return !['search', 'password', 'hidden'].includes(type);
          return Boolean(attrs.contenteditable === 'true' || attrs.role === 'textbox');
        }
        return false;
      },
      closest(selector) {
        if (selector.includes('textarea') && selector.includes('contenteditable="true"')) {
          return this.matches(selector) ? this : (parent?.closest?.(selector) || null);
        }
        if (searchAncestor && /header|nav|role="search"|class\*=search/i.test(selector)) return { nodeType: 1 };
        return parent?.closest?.(selector) || null;
      },
      contains(node) { return node === this || parent?.contains?.(node) || false; },
      getBoundingClientRect() { return { top, bottom: top + 40, left: 500, right: 900, width: 400, height: 40 }; },
    };
    return element;
  }

  const tiktokEditor = editable({
    attrs: { contenteditable: 'true', 'data-e2e': 'message-input-area', placeholder: 'Send a message' },
    className: 'editor-new-build',
    top: 340,
  });
  context.document.activeElement = tiktokEditor;
  assert.equal(context.__findComposerForEventTarget(tiktokEditor), tiktokEditor,
    'active message editor is found even when its CSS class changes');

  const searchBox = editable({
    tagName: 'INPUT', type: 'search',
    attrs: { type: 'search', placeholder: 'Search TikTok' },
    top: 20,
  });
  context.document.activeElement = searchBox;
  assert.equal(context.__findComposerForEventTarget(searchBox), null,
    'search fields are never treated as message composers');

  const child = {
    nodeType: 1, parentElement: tiktokEditor,
    matches: () => false,
    closest: selector => tiktokEditor.matches(selector) ? tiktokEditor : null,
  };
  context.document.activeElement = tiktokEditor;
  assert.equal(context.__findComposerForEventTarget(child), tiktokEditor,
    'Enter from a nested child resolves to its message editor');
}

let currentRule = rules.find(rule => rule.id === 'tiktok');
const context = vm.createContext({
  rule: () => currentRule,
  findBubble: node => node?.bubble || null,
  innerWidth: 1280,
});
// Prefer the closest message bubble over an outer row/list container even
// when the outer container's selector is listed first.
{
  const findBubble = new Function(
    'rule', 'COMMON_BUBBLE_FALLBACKS',
    functionSource('findBubble') + '\nglobalThis.__findBubble = findBubble; return findBubble;'
  )(() => ({ bubbleSelectors: ['[role="row"]', '.message'] }), [
    '[role="row"]', '[role="listitem"]', '.message'
  ]);
  function node(parentElement, selectors = []) {
    return {
      parentElement,
      matches: selector => selectors.includes(selector),
      closest(selector) {
        let current = this;
        while (current) {
          if (current.matches(selector)) return current;
          current = current.parentElement;
        }
        return null;
      }
    };
  }
  const wrapper = node(null, ['[role="row"]']);
  const bubble = node(wrapper, ['.message']);
  const textNode = node(bubble);
  assert.equal(findBubble(textNode), bubble);
}

vm.runInContext(functionSource('isOutgoingMessage') + '\nglobalThis.__isOutgoingMessage = isOutgoingMessage;', context);
assert.equal(context.__isOutgoingMessage({ bubble: { className: 'message--out' } }), true);
currentRule = rules.find(rule => rule.id === 'vk');
assert.equal(context.__isOutgoingMessage({ bubble: { className: 'im-mess_out' } }), true);
currentRule = rules.find(rule => rule.id === 'teams');
assert.equal(context.__isOutgoingMessage({ bubble: { className: 'message--outgoing' } }), true);

console.log('PASS platform-specific message/composer adapters for TikTok, VK, LINE, Teams, Snapchat, Zalo, and existing web messengers');
console.log('PASS common composer/send fallbacks and trusted host allow-list');
console.log('PASS platform-specific outgoing-message recognition and innermost message bubble selection');
