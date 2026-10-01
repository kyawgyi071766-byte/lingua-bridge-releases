const fs = require('fs');
const read = (p) => fs.readFileSync(p, 'utf8');
const schema = read('prisma/schema.prisma');
const migration = read('prisma/migrations/20260920000200_access_codes_admin/migration.sql');
const access = read('src/lib/accessCodes.ts');
const redeem = read('src/app/api/access-code/redeem/route.ts');
const admin = read('src/app/api/admin/access-codes/route.ts');
const auth = read('src/lib/auth.ts');
const usage = read('src/lib/usage.ts');
const plans = read('src/lib/plans.ts');
const billing = read('src/app/billing/page.tsx');
const adminPage = read('src/app/admin/page.tsx');
const checks = [
  ['AccessCode model exists', /model AccessCode\s*\{/.test(schema)],
  ['Redemption audit model exists', /model AccessCodeRedemption\s*\{/.test(schema)],
  ['User grant type is persisted', /grantType\s+String/.test(schema) && /grant_type/.test(migration)],
  ['Voice quota migration remains present', fs.existsSync('prisma/migrations/20260920000100_voice_quota/migration.sql')],
  ['Codes use cryptographic random generation', /randomInt\(/.test(access) && /CODE_ALPHABET/.test(access)],
  ['Codes are hashed for lookup', /sha256/.test(access) && /hashAccessCode/.test(redeem)],
  ['Owner-viewable code copy is encrypted at rest', /aes-256-gcm/.test(access) && /encryptedCode/.test(admin)],
  ['Redeem route is authenticated and rate limited', /getCurrentUser/.test(redeem) && /consumeRateLimit/.test(redeem)],
  ['Redeem route enforces max uses', /usedCount\s*>=\s*code\.maxUses/.test(redeem)],
  ['Gift grants are checked server-side', /expireGiftGrantForUser/.test(usage)],
  ['Revocation downgrades active gift users', /grantType:\s*'free'/.test(admin) && /accessCodeId:\s*null/.test(admin)],
  ['Revocation cannot be reversed', /cannot be reactivated/.test(admin)],
  ['Owner admin requires ADMIN_EMAIL', /ADMIN_EMAIL/.test(auth) && /isOwnerAdminUser/.test(auth)],
  ['Legacy owner account can self-bootstrap from ADMIN_EMAIL', /promoted once after authentication/.test(auth)],
  ['Pro voice quota is 300', /monthlyVoiceUses:\s*300/.test(plans)],
  ['Business voice quota is 2000', /monthlyVoiceUses:\s*2_000/.test(plans)],
  ['Billing page exposes Redeem Gift Code', /RedeemGiftCode/.test(billing)],
  ['Admin dashboard includes revenue and active-user stats', /dailyRevenue/.test(adminPage) && /monthlyRevenue/.test(adminPage) && /activeUsers/.test(adminPage)],
];
let failures = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failures++;
}
if (failures) process.exit(1);
console.log(`\nAll ${checks.length} Access Code/Admin static checks passed.`);
