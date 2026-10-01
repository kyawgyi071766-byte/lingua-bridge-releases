const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const pass = (name, ok, detail = '') => checks.push({ name, ok, detail });

const nextConfig = read('next.config.js');
const dashboard = read('src/app/dashboard/page.tsx');
const serviceWorker = read('public/sw.js');
const envExample = read('.env.example');
const packageJson = JSON.parse(read('package.json'));
const manifest = JSON.parse(read('public/manifest.json'));
const schema = read('prisma/schema.prisma');
const translate = read('src/app/api/translate/route.ts');
const paymentCheck = read('src/app/api/payment/check/route.ts');
const paymentProof = read('src/app/api/payment/proof/route.ts');
const support = read('src/app/api/support/route.ts');
const billing = read('src/app/billing/page.tsx');

pass('Next.js is on patched Maintenance LTS line', packageJson.dependencies.next === '15.5.24');
pass('Build errors are not explicitly ignored', !/ignoreBuildErrors|ignoreDuringBuilds/.test(nextConfig));
pass('Security headers are configured', /Content-Security-Policy/.test(nextConfig) && /X-Content-Type-Options/.test(nextConfig));
pass('Dashboard target language excludes auto', /TARGET_LANGUAGES/.test(dashboard) && /filter\(\(language\) => language\.code !== "auto"\)/.test(dashboard));
pass('Service worker does not cache private dashboard HTML', !/CORE\s*=\s*\[[^\]]*\/dashboard/.test(serviceWorker));
pass('Production DB uses PostgreSQL', /provider\s*=\s*"postgresql"/.test(schema));
pass('Payment model and account safety fields exist', /model Payment/.test(schema) && /paidUntil\s+DateTime\?/.test(schema) && /suspended\s+Boolean/.test(schema));
pass('Suspended users are blocked from translation', /temporarily suspended/.test(translate) && /status: 403/.test(translate));
pass('Crypto payment verification activates immediately', /activatePayment/.test(paymentCheck));
pass('Receipt review never bypasses on-chain verification', /findMatchingTransfer/.test(paymentProof) && /screenshot alone cannot confirm payment|receipt image.*cannot/i.test(paymentProof));
pass('Receipt reuse protection exists', /receiptHash/.test(schema) && /duplicateReceipt/.test(paymentProof));
pass('Support has no-key fallback', /fallbackReply/.test(support) && /!apiKey/.test(support));
pass('Crypto is the only payment method shown on billing UI', /USDT/.test(billing) && !/Stripe/.test(billing));
pass('PWA share target uses POST', manifest.share_target?.method === 'POST');
pass('Crypto environment variables documented', /CRYPTO_WALLET_ADDRESS/.test(envExample) && /CRYPTO_CHAIN/.test(envExample) && /TRONSCAN_API_KEY/.test(envExample) && /BSCSCAN_API_KEY/.test(envExample));
pass('AI support environment variables documented', /OPENAI_API_KEY/.test(envExample) && /OPENAI_BASE_URL/.test(envExample) && /OPENAI_MODEL/.test(envExample));
pass('Gemini + Microsoft fallback chain is documented', /GEMINI_API_KEY/.test(envExample) && /MICROSOFT_TRANSLATOR_KEY/.test(envExample) && /MICROSOFT_TRANSLATOR_ENDPOINT/.test(envExample) && /TRANSLATE_CHAIN=deepl,gemini,microsoft,google/.test(envExample));
pass('Google broad-coverage fallback remains documented', /GOOGLE_TRANSLATE_API_KEY/.test(envExample));
pass('Legacy Stripe is disabled by default', /LEGACY_STRIPE_ENABLED=false/.test(envExample));
pass('No real-looking Google API key committed', !/AIza[0-9A-Za-z_-]{20,}/.test(envExample));
pass('No real-looking crypto private key/seed committed', !/(private key|seed phrase)\s*=\s*[A-Za-z0-9]{20,}/i.test(envExample));

const failed = checks.filter((item) => !item.ok);
for (const item of checks) console.log(`${item.ok ? 'PASS' : 'FAIL'}  ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
if (failed.length) {
  console.error(`\n${failed.length} static audit check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} static audit checks passed.`);
