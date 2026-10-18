'use strict';
// In confirmation mode, typing Enter/pressing Send is a translation request,
// never a network send. Cover both the native event and the async response.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'electron', 'service-preload.cjs'), 'utf8');
function functionSource(startMarker, endMarker) {
  const begin = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, begin + startMarker.length);
  assert(begin >= 0 && end > begin, 'required preload function exists: ' + startMarker);
  return source.slice(begin, end);
}
const composer = { isConnected: true };
let draft = '你好';
const notices = [];
const requests = [];
const context = vm.createContext({
  settings: { isActive: true, confirmBeforeSend: true, sourceLang: 'auto', outgoingTarget: 'zh' },
  directSendEnabled: () => true,
  outgoingBusy: false,
  suppressNativeUntil: 0,
  bypassNextSendUntil: 0,
  approvedOutgoingText: '你好',
  approvedOutgoingCard: null,
  findComposer: () => composer,
  composerText: () => draft,
  isVisible: () => true,
  preventEvent: e => { if (e) e.prevented = true; },
  ensureStatusChip: (...args) => notices.push(args),
  setComposerText: (_composer, next) => { draft = next; },
  pendingOutgoing: new Map(),
  currentConversationCacheScope: () => 'telegram|chat',
  location: { pathname: '/', search: '', hash: '' },
  ipcRenderer: { sendToHost: (...args) => requests.push(args) },
  Date,
  messageCounter: 0,
  cleanText: x => String(x || '').trim(),
  findMessageNodes: () => [],
  watchSentTranslationCard: () => assert.fail('must not create sent card in confirm-only mode'),
});
vm.runInContext(functionSource('function requestOutgoingTranslation(', '\nfunction onNativeBeforeInput('), context);
const evt = { prevented: false };
assert.equal(context.requestOutgoingTranslation(evt, 'keydown'), true);
assert.equal(evt.prevented, true, 'second Enter must be cancelled');
assert.equal(requests.length, 0, 'approved translation cannot trigger new request or send');
assert.equal(draft, '你好');

// A new draft must request translation rather than delivery.
draft = 'Hello';
assert.equal(context.requestOutgoingTranslation(evt, 'keydown'), true);
assert.equal(draft, '', 'original draft cleared to prevent native send');
assert.equal(requests.length, 1);
assert.equal(requests[0][0], 'lingua-translate-request');
const pending = [...context.pendingOutgoing.values()][0];
assert.equal(pending.confirmOnly, true, 'capture send policy when request starts');

// Even after toggling the setting off during an in-flight translation,
// that particular request must remain confirmation-only.
context.settings.confirmBeforeSend = false;
context.pendingOutgoing.set('out_test', { ...pending, original: 'Hello', composer, confirmOnly: true, conversationKey: 'telegram|chat', route: '/' });
let resultHandler;
context.ipcRenderer.on = (channel, fn) => { if (channel === 'lingua-translation-result') resultHandler = fn; };
context.pendingIncoming = new Map();
context.pendingIncomingFingerprints = new Set();
context.findComposer = () => composer;
context.rule = () => ({ id: 'telegram' });
context.setTimeout = () => assert.fail('a confirmed translation must not schedule an automatic send');
vm.runInContext(functionSource("ipcRenderer.on('lingua-translation-result'", "\nipcRenderer.on('lingua-insert-text'"), context);
assert.equal(typeof resultHandler, 'function');
(async () => {
  await resultHandler(null, { id: 'out_test', ok: true, translatedText: 'Bonjour', detectedSource: 'en' });
  assert.equal(draft, 'Bonjour');
  assert.equal(context.approvedOutgoingText, 'Bonjour');
  console.log('PASS translation-only Enter, pending request policy, and async result (never sends)');
})().catch(error => { console.error(error); process.exitCode = 1; });

// All sending paths must enforce the current confirmation setting.
assert.match(source, /function clickSend\(buttonOverride = null\) \{[\s\S]*?if \(settings\.confirmBeforeSend\) return false/);
assert.match(source, /const sendNow = Boolean\(payload\.sendNow\) && !settings\.confirmBeforeSend/);
