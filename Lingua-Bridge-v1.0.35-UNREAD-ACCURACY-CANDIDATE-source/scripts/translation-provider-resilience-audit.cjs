const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const translator = read('src/lib/translator.ts');
const guard = read('src/lib/translationProviderGuard.ts');
const status = read('src/app/api/translate/status/route.ts');

const checks = [
  ['provider budget is reserved before an external provider call',
    translator.indexOf('reserveTranslationProvider(provider') >= 0 &&
    translator.indexOf('reserveTranslationProvider(provider') < translator.indexOf('await runProvider(provider')],
  ['provider chain continues after a provider budget/cooldown skip',
    translator.includes('if (!reservation.allowed)') && translator.includes('continue;')],
  ['provider usage is stored in the shared database rate-limit table',
    guard.includes('prisma.rateLimitBucket') && guard.includes('requestFingerprint') && guard.includes('translation-provider-')],
  ['monthly character ceiling is checked atomically',
    guard.includes('count: { lte: limit - characters }') && guard.includes('count: { increment: characters }')],
  ['DeepL API Free receives a conservative default ceiling',
    guard.includes("endsWith(':fx')") && guard.includes('450_000')],
  ['provider cooldown is persistent across serverless instances',
    guard.includes("keyFor('cooldown', provider)") && guard.includes('resetAt: cooldownUntil')],
  ['successful provider clears its persistent cooldown',
    guard.includes("deleteMany({ where: { key: keyFor('cooldown', provider) } })")],
  ['provider status usage is restricted to owner admin',
    status.includes('isOwnerAdminUser(user)') && status.includes('getTranslationProviderUsageStatus()')],
  ['Google API key is sent in a header, not in the request URL',
    translator.includes("'x-goog-api-key': key!") && !translator.includes("url.searchParams.set('key', key!)")],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log('PASS translation provider resilience audit');
