const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const preloadSource = fs.readFileSync(path.join(root, 'electron/service-preload.cjs'), 'utf8');

function functionSource(name, endMarker) {
  const start = preloadSource.indexOf('function ' + name + '(');
  const end = preloadSource.indexOf(endMarker, start + 10);
  assert(start >= 0 && end > start, name + ' helper exists');
  return preloadSource.slice(start, end);
}

const hint = {
  textContent: '',
  offsetWidth: 190,
  style: {},
};
const composer = {
  getBoundingClientRect() {
    return { left: 400, right: 900, top: 600, bottom: 640, width: 500, height: 40 };
  },
};
const context = vm.createContext({
  settings: {
    isActive: true,
    sourceLang: 'auto',
    sourceLangLabel: 'Auto detect',
    outgoingTarget: 'zh',
    outgoingTargetLabel: 'Chinese (中文)',
    incomingTarget: 'en',
    autoTranslateIncoming: true,
    autoTranslateHistorical: false,
    translateOwnMessages: false,
    showInlineTranslations: true,
  },
  scanTimer: null,
  document: {
    getElementById(id) {
      return id === 'lingua-composer-target-hint' ? hint : null;
    },
    documentElement: { appendChild() {} },
  },
  directSendEnabled: () => true,
  findComposer: () => composer,
  isVisible: () => true,
  composerText: () => '',
  reportDirectSendState() {},
  ensureSendShield() {},
  clearMessageFingerprints() {},
  scanMessages() {},
  reportDiagnostics() {},
  findMessageNodes: () => [],
  reportConversation() {},
  clearTimeout() {},
  setTimeout(callback) { callback(); return 1; },
  requestAnimationFrame(callback) { callback(); return 1; },
  innerWidth: 1200,
});

vm.runInContext(
  functionSource('ensureComposerTargetHint', '\nfunction ensureSendShield') +
  functionSource('updateComposerHint', '\nfunction preventEvent') +
  functionSource('scheduleComposerHintRefresh', '\nfunction applySettingsUpdate') +
  functionSource('applySettingsUpdate', "\nipcRenderer.on('lingua-settings'") +
  '\nglobalThis.__applySettingsUpdate = applySettingsUpdate;',
  context
);

assert.match(
  preloadSource,
  /ipcRenderer\.on\('lingua-settings', \(_event, next\) => applySettingsUpdate\(next\)\);/,
  'the Electron settings IPC is wired to the live update handler'
);

context.__applySettingsUpdate({
  isActive: true,
  sourceLang: 'auto',
  sourceLangLabel: 'Auto detect',
  outgoingTarget: 'es',
  outgoingTargetLabel: 'Spanish (Español)',
});
assert.equal(hint.textContent, 'Auto detect → Spanish (Español)',
  'changing the outgoing target updates the visible composer pill without navigation');

context.__applySettingsUpdate({
  sourceLang: 'my',
  sourceLangLabel: 'Myanmar / Burmese (မြန်မာ)',
  outgoingTarget: 'bg',
  outgoingTargetLabel: 'Bulgarian (Български)',
});
assert.equal(hint.textContent, 'Myanmar / Burmese (မြန်မာ) → Bulgarian (Български)',
  'changing source and target labels updates the pill immediately in both directions');

assert.match(preloadSource, /if \(composerLanguageChanged\) scheduleComposerHintRefresh\(\);/,
  'language-label updates schedule a post-layout refresh to handle replaced messenger composers');

console.log('PASS outgoing target changes update the composer language pill without a webview reload');
console.log('PASS source/target display labels refresh on the next animation frame');
console.log('PASS language hint refresh retries briefly if a messenger SPA replaces its composer');
