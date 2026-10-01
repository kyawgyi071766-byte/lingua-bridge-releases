const fs = require('fs');
const preload = fs.readFileSync('electron/service-preload.cjs','utf8');
const app = fs.readFileSync('src/app.js','utf8');

const checks = [
  ['failure backoff map', preload.includes('const translationFailureBackoff = new Map()')],
  ['failed fingerprint preserved', preload.includes('node.dataset.linguaFingerprint = fp;') && preload.includes('rememberTranslationFailure(fp, message, targetLang)')],
  ['provider cooldown in preload', preload.includes('translationProviderCooldownUntil')],
  ['bounded card retry', preload.includes('delayByAttempt') && preload.includes('translationRetryBlocked')],
  ['reduced visible history burst', preload.includes('const realtimeBudget = force ? 5 : 3') && preload.includes('const historyBudget = force ? 14 : 7')],
  ['global host provider penalty', app.includes('let providerPenaltyUntil = 0') && app.includes('providerRealtimeGapMs')],
  ['history has zero host retries', app.includes('const maxRetries = isHistory ? 0 : 1')],
  ['queue waits for provider cooldown', app.includes('providerPenaltyUntil - Date.now()')],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
