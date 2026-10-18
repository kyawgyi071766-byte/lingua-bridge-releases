'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const app = fs.readFileSync(path.join(__dirname, '../src/app.js'), 'utf8');
const start = app.indexOf('async function translateCompose(');
const stop = app.indexOf('\nfunction sendSettings()', start);
assert(start >= 0 && stop > start, 'fallback composer implementation found');
const sentToWebview = [];
const notices = [];
const input = { value: 'Good morning' };
const prefs = { outgoingTarget: 'zh', sourceLang: 'en', translateBeforeSending: true, confirmBeforeSend: true };
const ctx = vm.createContext({
  document: { querySelector: () => input },
  currentSettings: () => prefs,
  translateText: async () => ({ translatedText: '早上好', provider: 'test-stub' }),
  setNotice: (...v) => notices.push(v),
  activePersistentView: () => ({ send: (channel, payload) => sentToWebview.push({channel,payload}) }),
  confirm: () => assert.fail('confirm dialog must never authorize sending in confirmation-only mode'),
});
vm.runInContext(app.slice(start,stop),ctx);
(async () => {
  await ctx.translateCompose(true);
  assert.equal(sentToWebview.length, 1);
  assert.equal(sentToWebview[0].payload.text, '早上好');
  assert.equal(sentToWebview[0].payload.sendNow, false, 'confirm-only inserts translation but never sends');
  assert.equal(input.value, '');
  prefs.confirmBeforeSend = false;
  input.value = 'Good morning';
  await ctx.translateCompose(true);
  assert.equal(sentToWebview.length, 2);
  assert.equal(sentToWebview[1].payload.sendNow, true, 'normal sending remains available when confirm-only is off');
  console.log('PASS fallback composer translation-only policy; normal send unchanged');
})().catch(e => { console.error(e); process.exitCode = 1; });
