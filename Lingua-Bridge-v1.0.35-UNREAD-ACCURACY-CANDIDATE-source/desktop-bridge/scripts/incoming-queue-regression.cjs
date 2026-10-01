const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../src/app.js'), 'utf8');
const start = source.indexOf('function incomingQueueKey(');
const end = source.indexOf('\n\nwindow.addEventListener(', start);
assert(start >= 0 && end > start);
const sent = [];
const view = { send: (channel, value) => sent.push({ channel, ...value }) };
const context = vm.createContext({
  state: { incomingQueue: [], incomingActive: 0 },
  incomingQueuedKeys: new Set(),
  drainIncomingQueue: () => {},
  setTimeout: () => {},
  Date,
  PROVIDER_EXTRA_CODES: new Set(),
});
// Test the actual queue functions, with processing paused so we can inspect admission.
vm.runInContext(source.slice(start, end).replace('function drainIncomingQueue() {', 'function unusedDrainIncomingQueue() {'), context);
const enqueue = context.enqueueIncoming;
const payload = id => ({ id, text: 'Bonjour', sourceLang: 'auto', targetLang: 'en', priority: 'history' });

enqueue(view, payload('in_1'));
enqueue(view, payload('in_2'));
assert.equal(context.state.incomingQueue.length, 2, 'identical messages each need a result');

for (let i = 3; i <= 28; i++) enqueue(view, { ...payload(`in_${i}`), text: `Message ${i}` });
assert.equal(context.state.incomingQueue.length, 24);
const admitted = new Set(context.state.incomingQueue.map(item => item.payload.id));
for (let i = 1; i <= 28; i++) {
  assert(admitted.has(`in_${i}`) || sent.some(result => result.id === `in_${i}`), `in_${i} must get a result`);
}
console.log('incoming queue admission and overflow regression passed');
