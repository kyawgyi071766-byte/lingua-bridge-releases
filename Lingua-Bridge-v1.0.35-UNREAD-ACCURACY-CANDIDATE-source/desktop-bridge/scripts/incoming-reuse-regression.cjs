const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'electron', 'service-preload.cjs'),
  'utf8'
);

// WhatsApp can reuse an existing DOM message node when a new incoming message
// arrives. The scan must not suppress that node merely because the conversation
// was already seen; it may only skip when both conversation and fingerprint
// are unchanged.
const guard = 'if (!force && node.dataset.linguaSeenConversation === conversationKey && node.dataset.linguaFingerprint === fp) continue;';
assert.equal(
  source.split(guard).length - 1,
  2,
  'incoming scan must compare the current message fingerprint before skipping'
);

assert.match(
  source,
  /const TRANSLATION_CACHE_LIMIT = 5000;/,
  'translation history cache must retain a durable local window'
);
assert.match(
  source,
  /function forceRefreshIncomingTranslation\(node\)/,
  'each translation card must support an explicit refresh'
);
assert.match(
  source,
  /function ensureManualTranslateAction\(node\)/,
  'untranslated incoming messages must expose a manual translation action'
);
assert.match(
  source,
  /className = 'lingua-refresh-translation'/,
  'refresh controls must use the dedicated refresh icon class'
);

console.log('PASS reused-message-node and translation-history refresh guards');
