const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const appSource = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');

function functionSource(name, endMarker) {
  const start = appSource.indexOf('function ' + name + '(');
  const end = appSource.indexOf(endMarker, start + 10);
  assert(start >= 0 && end > start, name + ' helper exists');
  return appSource.slice(start, end);
}

const instance = { id: 'tiktok-1', service: 'tiktok' };
const cachedInstanceSettings = {
  sourceLang: 'auto',
  incomingTarget: 'my',
  outgoingTarget: 'en',
  autoTranslateIncoming: true,
  translateBeforeSending: true,
  showInlineTranslations: true,
};
let latestEffectiveSettings = { ...cachedInstanceSettings };
const context = vm.createContext({
  serviceFor: () => ({ browser: false }),
  settingsForInstance: () => ({ ...cachedInstanceSettings }),
  currentSettings: () => ({ ...latestEffectiveSettings }),
  activeInstance: () => instance,
  activePersistentView: () => view,
  languageName: code => ({
    auto: 'Auto detect',
    my: 'Myanmar / Burmese',
    en: 'English',
    es: 'Spanish'
  }[code] || String(code || '')),
});

let deliveries = [];
let failNextSend = false;
const view = {
  dataset: { ready: '0' },
  send(channel, payload) {
    if (failNextSend) {
      failNextSend = false;
      throw new Error('simulated webview-not-ready race');
    }
    deliveries.push({ channel, payload });
  },
};

vm.runInContext(
  functionSource('sendSettingsToPersistentView', '\nfunction rememberBrowserUrlFor') +
  functionSource('sendSettings', '\nfunction incomingQueueKey') +
  '\nglobalThis.__sendSettingsToPersistentView = sendSettingsToPersistentView;' +
  '\nglobalThis.__sendSettings = sendSettings;',
  context
);

const sendSettings = (force = false) =>
  context.__sendSettingsToPersistentView(view, instance, true, { force });

sendSettings();
assert.equal(deliveries.length, 0, 'settings are never sent/cached before DOM ready');
assert.equal(view.dataset.linguaSettingsSignature, undefined, 'not-ready call never caches the signature');

view.dataset.ready = '1';
sendSettings();
assert.equal(deliveries.length, 1, 'settings are sent after DOM ready');
assert.equal(deliveries[0].channel, 'lingua-settings');
assert.equal(deliveries[0].payload.isActive, true);
assert.equal(view.dataset.linguaSettingsSignature, JSON.stringify(deliveries[0].payload));

sendSettings();
assert.equal(deliveries.length, 1, 'unchanged settings are not needlessly resent during ordinary sync');
sendSettings(true);
assert.equal(deliveries.length, 2, 'dom-ready forced delivery reinitializes a reloaded preload');

// A failed send must leave the signature retryable instead of suppressing
// every subsequent attempt for the same settings payload.
view.dataset.linguaSettingsSignature = '';
failNextSend = true;
sendSettings();
assert.equal(view.dataset.linguaSettingsSignature, '', 'failed send does not cache delivery');
sendSettings();
assert.equal(deliveries.length, 3, 'a later ordinary sync retries the failed delivery');
assert.notEqual(view.dataset.linguaSettingsSignature, '', 'successful retry records the signature');

// A language edit must send the latest effective Current conversation profile,
// not a stale per-instance snapshot, and must bypass a cached signature.
latestEffectiveSettings = { ...latestEffectiveSettings, outgoingTarget: 'es' };
const expectedLatestPayload = {
  ...latestEffectiveSettings,
  isActive: true,
  incomingTargetLabel: 'Myanmar / Burmese',
  sourceLangLabel: 'Auto detect',
  outgoingTargetLabel: 'Spanish'
};
view.dataset.linguaSettingsSignature = JSON.stringify(expectedLatestPayload);
const beforeLanguageEdit = deliveries.length;
context.__sendSettings();
assert.equal(deliveries.length, beforeLanguageEdit + 1, 'explicit language change is force-delivered despite a cached signature');
assert.equal(deliveries.at(-1).payload.outgoingTarget, 'es', 'active guest receives the newest effective target language');
assert.equal(deliveries.at(-1).payload.outgoingTargetLabel, 'Spanish', 'active guest receives the matching display label');

// The actual webview lifecycle must force settings after every full navigation.
assert.match(appSource, /view\.addEventListener\('dom-ready', \(\) => \{[\s\S]*?sendSettingsToPersistentView\(view, instance, true, \{ force: true \}\)/);
assert.match(appSource, /sendSettingsToPersistentView\(view, instance, false, \{ force: true \}\)/);
assert.match(appSource, /view\.addEventListener\('did-start-loading', \(\) => \{[\s\S]*?view\.dataset\.ready = '0';[\s\S]*?view\.dataset\.linguaSettingsSignature = '';/);

console.log('PASS webview settings are sent only after DOM ready');
console.log('PASS reload forces settings into the newly-created service preload');
console.log('PASS a failed IPC delivery remains retryable');
console.log('PASS language changes force the latest effective profile to the active webview');
