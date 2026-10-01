const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const installer = JSON.parse(fs.readFileSync(path.join(root, 'electron-builder.public-installer.json'), 'utf8'));
const zip = JSON.parse(fs.readFileSync(path.join(root, 'electron-builder.public-zip.json'), 'utf8'));
const main = fs.readFileSync(path.join(root, 'electron/main.cjs'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'electron/host-preload.cjs'), 'utf8');
const checks = [
  ['v1.0.21 version marker', app.includes("lingua.desktopVersion', '1.0.21") && pkg.version === '1.0.21'],
  ['stable app id matches v1.0.9 upgrade identity', installer.appId === 'com.lingua.bridge' && pkg.build?.appId === 'com.lingua.bridge'],
  ['public product name', installer.productName === 'Lingua Bridge' && pkg.build?.productName === 'Lingua Bridge'],
  ['installer keeps upgrade-compatible NSIS identity', installer.win?.target?.some?.(x => x.target === 'nsis') && installer.nsis?.oneClick === false],
  ['ZIP fallback is public and x64', zip.win?.target?.some?.(x => x.target === 'zip' && x.arch?.includes('x64'))],
  ['download-and-verify update button wired', app.includes('downloadAvailableUpdate') && app.includes('Download & verify Lingua ${result.latest}') && app.includes('downloadUpdate({ url, sha256')],
  ['update download requires HTTPS', app.includes("/^https:\\/\\//i.test(String(url || ''))")],
  ['installer bytes are SHA-256 verified before launch', main.includes("lingua:download-update") && main.includes("hash.digest('hex')") && main.includes('actual !== expected') && preload.includes('launchVerifiedUpdate')],
  ['only verified downloaded update can launch', main.includes('verifiedUpdateFiles.has(resolved)') && main.includes('Only an update downloaded and SHA-256 verified by Lingua can be launched.')],
  ['silent self-replacement remains disabled until code signing', app.includes('Silent installation remains disabled until the Windows installer is code-signed')],
  ['rate-limit stability from v1.0.20 retained', app.includes('incomingQueue') && app.includes('linguaSettingsSignature')],
  ['persistent no-refresh switching retained', app.includes('persistentViews') || app.includes('viewRegistry') || app.includes('hostedViews')],
];
let failed=false;
for (const [label, ok] of checks) { console.log(`${ok?'PASS':'FAIL'} ${label}`); if(!ok) failed=true; }
if (failed) process.exit(1);
