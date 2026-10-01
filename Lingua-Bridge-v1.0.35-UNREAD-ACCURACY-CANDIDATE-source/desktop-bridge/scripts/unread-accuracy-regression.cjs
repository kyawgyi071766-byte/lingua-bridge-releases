const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../electron/service-preload.cjs'), 'utf8');
const start = source.indexOf('function parseCompactUnread(');
const end = source.indexOf('function normalizeConversationTitle(', start);
assert(start >= 0 && end > start);

function count({ title = 'Telegram', badges = [] }) {
  const document = {
    title,
    querySelectorAll(selector) {
      return badges.filter(badge => selector === badge.selector).map(badge => badge.node);
    }
  };
  const context = vm.createContext({ document, rule: () => ({ id: 'telegram' }), isVisible: () => true });
  vm.runInContext(source.slice(start, end), context);
  return vm.runInContext('detectUnreadCount()', context);
}
function badge(selector, text, rowId, attrs = {}) {
  const row = { rowId };
  return { selector, node: {
    innerText: text, textContent: text,
    getAttribute(name) { return attrs[name] || null; },
    closest() { return row; }
  } };
}

// A generic Telegram badge and a number in a chat preview do not prove an unread reply.
assert.equal(count({ badges: [badge('.chatlist-chat .badge', '08:09', 1)] }), 0,
  'a generic badge showing a time must not count as an unread conversation');
assert.equal(count({ title: '(5) Telegram', badges: [] }), 0,
  'a title number alone is not verified per-conversation unread state');
assert.equal(count({ badges: [badge('.chatlist-chat .badge.unread', '3', 2)] }), 1,
  'one confirmed unread conversation counts once, regardless of message count');
console.log('Unread accuracy regression passed');
