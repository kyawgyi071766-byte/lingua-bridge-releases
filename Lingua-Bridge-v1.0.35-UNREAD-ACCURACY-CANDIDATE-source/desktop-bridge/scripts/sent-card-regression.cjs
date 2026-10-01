const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../electron/service-preload.cjs'), 'utf8');
const begin = source.indexOf('function showSentTranslationCard(');
const end = source.indexOf('\nfunction ', begin + 10);
assert(begin >= 0 && end > begin, 'sent card helper exists');
const calls = [];
const node = { isConnected: true, dataset: {}, innerText: 'Bonjour', textContent: 'Bonjour' };
const context = vm.createContext({
  settings: { isActive: true, autoTranslateIncoming: true, showInlineTranslations: true, translateOwnMessages: true, incomingTarget: 'en' },
  cleanText: value => String(value || '').trim(),
  fingerprint: value => `fp:${value}`,
  rememberTranslation: (...args) => calls.push(['cache', ...args]),
  restoreCachedTranslation: (...args) => { calls.push(['card', ...args]); return true; },
  requestIncomingTranslation: (...args) => calls.push(['request', ...args]),
});
vm.runInContext(source.slice(begin, end), context);
context.showSentTranslationCard(node, 'My birthday is June 11.', 'EN', 'Bonjour');
assert.equal(calls.filter(call => call[0] === 'card').length, 1);
assert.equal(calls.filter(call => call[0] === 'request').length, 0);
assert.equal(node.dataset.linguaFingerprint, 'fp:Bonjour');

calls.length = 0;
node.dataset.linguaFingerprint = '';
context.showSentTranslationCard(node, '你好', 'ZH', 'Bonjour');
assert.equal(calls.filter(call => call[0] === 'card').length, 0);
assert.equal(calls.filter(call => call[0] === 'request').length, 1);
console.log('PASS sent bubbles receive immediate own-language cards or an automatic translation request');

const watchBegin = source.indexOf('function watchSentTranslationCard(');
const watchEnd = source.indexOf('\nfunction ', watchBegin + 10);
assert(watchBegin >= 0 && watchEnd > watchBegin);
const timers = [];
const visible = [node];
context.setTimeout = callback => { timers.push(callback); };
context.detectConversationInfo = () => ({ key: 'whatsapp|test-chat' });
context.findMessageNodes = () => visible;
context.isOutgoingMessage = () => true;
context.scanMessages = () => assert.fail('visible sent bubble must not require manual rescan');
vm.runInContext(source.slice(watchBegin, watchEnd), context);
calls.length = 0;
const previousNodes = new Set([node]);
context.watchSentTranslationCard('Bonjour', 'Hello', 'EN', previousNodes);
timers.shift()();
assert.equal(calls.length, 0, 'existing matching bubble is not reused');
const sentNode = { isConnected: true, dataset: {}, innerText: 'Bonjour', textContent: 'Bonjour' };
visible.push(sentNode);
timers.shift()();
assert.equal(calls.filter(call => call[0] === 'card').length, 1);
console.log('PASS new sent bubble receives the card without a Translate click');
