const fs = require('fs');
const APPROVED_WALLET = 'TC4gLVT6RnjdnMB6qCgq2mAb5KNnM9ovzM';
const env = (name) => (process.env[name] || '').trim();
const source = (path) => fs.readFileSync(path, 'utf8');
const plans = source('src/lib/plans.ts');
const envExample = source('.env.example');
const publicMode = env('DOWNLOAD_ACCESS_MODE').toLowerCase() === 'public';
const checks = [
  ['TRON is the active billing chain', env('CRYPTO_CHAIN').toLowerCase() === 'tron'],
  ['Approved owner wallet is configured', env('CRYPTO_WALLET_ADDRESS') === APPROVED_WALLET],
  ['Official TRON USDT contract is configured', env('TRON_USDT_CONTRACT') === 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'],
  ['Pro remains 9 USDT', /pro:\s*\{[\s\S]*?price:\s*9\b/.test(plans)],
  ['Business remains 29 USDT', /business:\s*\{[\s\S]*?price:\s*29\b/.test(plans)],
  ['Legacy Stripe is disabled', env('LEGACY_STRIPE_ENABLED').toLowerCase() === 'false'],
  ['Public site URL is production HTTPS', /^https:\/\/[^/]+/i.test(env('NEXT_PUBLIC_SITE_URL')) && !env('NEXT_PUBLIC_SITE_URL').includes('your-domain.com')],
  ['Windows installer URL is HTTPS', /^https:\/\//i.test(env('DOWNLOAD_WINDOWS_URL'))],
  ['Stable desktop version is exactly 1.0.22', env('DESKTOP_STABLE_VERSION') === '1.0.22'],
  ['Stable and customer installer URLs match', env('DESKTOP_STABLE_WINDOWS_URL') === env('DOWNLOAD_WINDOWS_URL')],
  ['Public distribution mode is enabled', publicMode],
  ['Official installer checksum is a SHA-256', /^[a-f0-9]{64}$/i.test(env('DESKTOP_STABLE_WINDOWS_SHA256'))],
  ['Example configuration documents approved wallet', envExample.includes(`CRYPTO_WALLET_ADDRESS=${APPROVED_WALLET}`)],
];
let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failed += 1;
}
if (failed) {
  console.error(`Official release audit failed (${failed}/${checks.length}). This audit requires the real production environment variables.`);
  process.exit(1);
}
console.log(`Official release audit passed (${checks.length}/${checks.length}).`);
