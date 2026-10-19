'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const asar = require('@electron/asar');
const [platform, arch] = process.argv.slice(2);
assert(['win','mac','linux'].includes(platform), 'Unknown platform');
assert(['x64','arm64'].includes(arch), 'Unknown architecture');
const root = path.resolve('release-multiplatform-preview');
const product = 'Lingua Bridge Translation Memory Preview';
const unpacked = platform === 'mac'
  ? path.join(root, arch === 'arm64' ? 'mac-arm64' : 'mac', product + '.app', 'Contents', 'Resources', 'app.asar')
  : path.join(root, platform === 'win' ? 'win-unpacked' : 'linux-unpacked', 'resources', 'app.asar');
assert(fs.existsSync(unpacked), 'Packaged app.asar missing: ' + unpacked);
const entries = asar.listPackage(unpacked).map(n => n.replace(/\\/g,'/').replace(/^\//,''));
for (const required of ['package.json','dist/index.html','electron/main.cjs','electron/host-preload.cjs','electron/service-preload.cjs']) {
  assert(entries.includes(required), 'Missing packaged file: ' + required);
}
assert(!entries.some(n => /(^|\/)(\.env(?:\..*)?|id_rsa|credentials\.json)$/.test(n)), 'Unexpected credential file in package');
const meta = JSON.parse(asar.extractFile(unpacked,'package.json').toString());
assert.equal(meta.name, 'lingua-bridge-translation-memory-preview', 'Preview must use separate data directory identity');
assert.equal(meta.productName, product);
const source = asar.extractFile(unpacked,'electron/service-preload.cjs').toString();
assert(source.includes('function currentConversationCacheScope()'), 'Translation memory absent from package');
const suffixes = {win:['.exe','.zip'],mac:['.dmg','.zip'],linux:['.AppImage','.deb','.tar.gz']}[platform];
const files = fs.readdirSync(root).filter(n => suffixes.some(s => n.endsWith(s)));
for (const suffix of suffixes) assert(files.some(n => n.endsWith(suffix)), 'Missing download format ' + suffix);
const records = files.sort().map(name => {
  const bytes = fs.readFileSync(path.join(root,name));
  assert(bytes.length > 1024, 'Empty or truncated artifact ' + name);
  return {name,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
});
fs.writeFileSync(path.join(root,'SHA256SUMS.txt'), records.map(r=>r.sha256+'  '+r.name).join('\n')+'\n');
for (const line of fs.readFileSync(path.join(root,'SHA256SUMS.txt'),'utf8').trim().split('\n')) {
  const [,expected,name] = /^([a-f0-9]{64})  (.+)$/.exec(line) || [];
  assert(name, 'Invalid checksum line');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex'),expected);
}
fs.writeFileSync(path.join(root,'PACKAGE-VERIFICATION.json'), JSON.stringify({
  commit:process.env.GITHUB_SHA,platform,arch,packageName:meta.name,version:meta.version,
  verified:['required app files','isolated preview identity','all download formats','SHA-256 round trip'],
  limitations:['unsigned preview','real messenger and device smoke testing required'],files:records
},null,2)+'\n');
fs.writeFileSync(path.join(root,'README.txt'),'Unsigned translation-memory preview with separate application identity. Not a stable auto-update. Real messenger smoke testing remains required. Production email recovery remains blocked by DNSExit relay policy.\n');
console.log('PASS packaged files, isolated identity, all download formats and SHA-256 verification: '+platform+'/'+arch);
