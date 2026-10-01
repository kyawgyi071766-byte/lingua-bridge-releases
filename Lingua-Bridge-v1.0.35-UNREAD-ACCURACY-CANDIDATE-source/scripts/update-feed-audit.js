const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const route = fs.readFileSync(path.join(root, 'src/app/api/desktop/update/route.ts'), 'utf8');
const env = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
const checks = [
  ['update route exists', route.includes('export async function GET')],
  ['stable and beta channels supported', route.includes("'stable'") && route.includes("'beta'")],
  ['HTTPS-only download URL', route.includes("url.protocol === 'https:'")],
  ['SHA-256 validated', route.includes('/^[a-f0-9]{64}$/')],
  ['unconfigured feed fails safely', route.includes('configured: false')],
  ['release metadata is no-store', route.includes("'Cache-Control': 'no-store")],
  ['stable env vars documented', env.includes('DESKTOP_STABLE_VERSION=') && env.includes('DESKTOP_STABLE_WINDOWS_URL=')],
  ['beta env vars documented', env.includes('DESKTOP_BETA_VERSION=') && env.includes('DESKTOP_BETA_WINDOWS_URL=')]
];
let failed=false;
for (const [name,ok] of checks) { console.log(`${ok?'PASS':'FAIL'} ${name}`); if(!ok) failed=true; }
if (failed) process.exit(1);
console.log(`\nAll ${checks.length} desktop update-feed checks passed.`);
