const fs = require('fs');
const read = (p) => fs.readFileSync(p, 'utf8');
const schema = read('prisma/schema.prisma');
const migration = read('prisma/migrations/20260921000100_device_limits/migration.sql');
const devices = read('src/lib/devices.ts');
const login = read('src/app/api/auth/login/route.ts');
const me = read('src/app/api/auth/me/route.ts');
const translate = read('src/app/api/translate/route.ts');
const voice = read('src/app/api/voice/translate/route.ts');
const deviceRoute = read('src/app/api/devices/route.ts');
const adminRemove = read('src/app/api/admin/device/remove/route.ts');
const adminPage = read('src/app/admin/page.tsx');
const adminUsers = read('src/components/AdminUserTable.tsx');
const access = read('src/lib/accessCodes.ts');
const checks = [
  ['UserDevice model exists', /model UserDevice\s*\{/.test(schema)],
  ['Raw fingerprint is not a DB field', !/fingerprint\s+String/.test(schema) && /fingerprintHash\s+String/.test(schema)],
  ['Device DB migration exists with user FK', /CREATE TABLE "user_devices"/.test(migration) && /user_devices_user_id_fkey/.test(migration)],
  ['Paid purchase limit is 2', /PURCHASE_LIMIT\s*=\s*2/.test(devices)],
  ['Gift-code limit is 1', /GIFT_LIMIT\s*=\s*1/.test(devices)],
  ['Free plans are unrestricted', /plan !== 'pro' && plan !== 'business'/.test(devices)],
  ['Fingerprint gets server-side SHA-256 HMAC', /createHmac\('sha256'/.test(devices)],
  ['Desktop login checks device policy', /ensureDeviceAccess/.test(login) && /isLinguaDesktopRequest/.test(login)],
  ['Text translation checks device policy', /ensureDeviceAccess/.test(translate)],
  ['Voice translation checks device policy', /ensureDeviceAccess/.test(voice)],
  ['Account API returns device count and limit', /devices:\s*\{/.test(me) && /deviceLimit/.test(me)],
  ['Purchased users can self-remove device', /grantType !== 'purchase'/.test(deviceRoute) && /revokeUserDevice/.test(deviceRoute)],
  ['Gift users cannot self-remove device', /Gift-code devices can only be removed/.test(deviceRoute)],
  ['Owner-only device removal route exists', /getOwnerAdmin/.test(adminRemove) && /revokeUserDevice/.test(adminRemove)],
  ['Admin dashboard loads active devices', /include:\s*\{ devices/.test(adminPage)],
  ['Admin dashboard has remove device action', /Remove device/.test(adminUsers) && /api\/admin\/device\/remove/.test(adminUsers)],
  ['Gift activation starts with clean device slot', /revokeAllActiveDevices/.test(read('src/app/api/access-code/redeem/route.ts'))],
  ['Existing Access Code AES-256-GCM is preserved', /aes-256-gcm/.test(access)],
];
let failures = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failures++;
}
if (failures) process.exit(1);
console.log(`\nAll ${checks.length} device-limit checks passed.`);
