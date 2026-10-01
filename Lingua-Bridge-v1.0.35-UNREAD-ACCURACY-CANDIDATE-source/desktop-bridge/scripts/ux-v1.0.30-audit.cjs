const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const preload = fs.readFileSync(path.join(root, 'electron', 'service-preload.cjs'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const main = fs.readFileSync(path.join(root, 'electron', 'main.cjs'), 'utf8');
const checks = [
  ['pending fingerprint dedupe', preload.includes('pendingIncomingFingerprints')],
  ['retry no longer permanently suppressed', preload.includes('permit a real') && preload.includes('translationRetryBlocked(fp, forceRetry, targetLang)')],
  ['progressive history backfill', preload.includes('progressively backfill') && preload.includes('historyBudget = force ? 14 : 7')],
  ['leading edge scheduler', preload.includes('if (!settings.isActive || scanTimer) return') && preload.includes('}, 70)')],
  ['slow diagnostics timer', preload.includes('}, 3500)')],
  ['common language concurrency', app.includes('const concurrencyLimit = peekBroad ? 1 : 2')],
  ['faster standard lane', app.includes('let providerRealtimeGapMs = 90')],
  ['dark native theme', main.includes("nativeTheme.themeSource = 'dark'")],
  ['bilingual title', main.includes('Thank you to all our users') && main.includes('感谢所有用户的支持')],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; }
if (failed) process.exit(1);
