const fs = require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
const dl=read('src/lib/downloadAccess.ts');
const list=read('src/app/api/download/list/route.ts');
const file=read('src/app/api/download/file/route.ts');
const feed=read('src/app/api/desktop/update/route.ts');
const env=read('.env.example');
const checks=[
 ['public/private download mode is explicit', dl.includes('DOWNLOAD_ACCESS_MODE') && dl.includes('downloadsArePublic')],
 ['public download list is explicitly gated', list.includes('downloadsArePublic') && list.includes('public: isPublic')],
 ['public downloads can use direct release asset URL', list.includes('isPublic ? downloadUrl(item.id)')],
 ['public fallback redirect remains HTTPS-only', file.includes('downloadUrl(platform)') && dl.includes("parsed.protocol === 'https:'")],
 ['desktop feed requires SHA-256', feed.includes("const checksumOk = /^[a-f0-9]{64}$/.test(config.sha256)")],
 ['desktop feed keeps HTTPS-only URL', feed.includes("url.protocol === 'https:'")],
 ['global public release envs documented', env.includes('DESKTOP_STABLE_VERSION=1.0.22') && env.includes('DOWNLOAD_ACCESS_MODE=public')],
];
let failed=false; for (const [l,o] of checks){console.log(`${o?'PASS':'FAIL'} ${l}`);if(!o)failed=true;} if(failed)process.exit(1);
