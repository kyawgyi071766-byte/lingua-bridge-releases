'use strict';
// Execute the production scanMessages function with simulated visible Telegram
// bubbles. This catches stale fingerprints and duplicate history queues.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../electron/service-preload.cjs'), 'utf8');
const begin = source.indexOf('function clearMessageFingerprints()');
const end = source.indexOf('\nfunction scheduleScan()', begin);
assert(begin >= 0 && end > begin, 'production message scanner present');
const scope = 'telegram|one-test-conversation';
let messages = Array.from({ length: 6 }, (_, i) => ({
  dataset: {}, isConnected: true, innerText: 'Past message ' + i,
  closest: () => null
}));
const calls = [];
const context = vm.createContext({
  settings: { isActive: true, autoTranslateIncoming: true, autoTranslateHistorical: false, incomingTarget: 'en' },
  findMessageNodes: () => messages,
  reportDiagnostics: () => {},
  currentConversationCacheScope: () => scope,
  lastScanConversationKey: '',
  primedConversationKeys: new Set(),
  cleanText: value => String(value || '').trim(),
  fingerprint: value => 'fp:' + value,
  restoreCachedTranslation: () => false,
  invalidateStaleTranslation: () => {},
  isAudioLikeMessage: () => false,
  isOutgoingMessage: () => false,
  ensureManualTranslateAction: () => {},
  removeManualTranslateAction: () => {},
  requestIncomingTranslation: (node, priority) => {
    const fp = 'fp:' + node.innerText;
    if (node.dataset.linguaFingerprint === fp) return false;
    node.dataset.linguaFingerprint = fp;
    calls.push({ text: node.innerText, priority });
    return true;
  }
});
vm.runInContext(source.slice(begin, end), context);
context.scanMessages(false);
assert.equal(calls.length, 0, 'history off should not auto-send old bubbles for translation');
assert(messages.every(node => node.dataset.linguaSeenConversation === scope));
context.settings.autoTranslateHistorical = true;
context.clearMessageFingerprints();
context.scanMessages(false);
assert.equal(new Set(calls.map(item => item.text)).size, 6, 'all previously-seen messages must be picked up after opt-in');
const initialCalls = calls.length;
context.scanMessages(false);
assert.equal(calls.length, initialCalls, 'repeated scan must not duplicate provider requests');
messages.push({ dataset: {}, isConnected: true, innerText: 'Scrolled older message', closest: () => null });
context.scanMessages(false);
assert(calls.some(item => item.text === 'Scrolled older message'), 'newly loaded historical bubble must be translated');
console.log('PASS history opt-in, dedupe, and scrolling older messages');
