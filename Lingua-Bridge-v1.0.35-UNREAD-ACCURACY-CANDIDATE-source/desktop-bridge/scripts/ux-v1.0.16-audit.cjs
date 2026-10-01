const fs = require('fs');
const app = fs.readFileSync('src/app.js','utf8');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const checks = [
  ['Version is 1.0.16', pkg.version === '1.0.16'],
  ['Microsoft provider status is displayed', app.includes('Microsoft Translator') && app.includes('microsoftConfigured')],
  ['Broad provider languages are present', ['Arabic','Hindi','Myanmar / Burmese','Thai','Vietnamese'].every(x => app.includes(x))],
  ['Broad language selection is provider-gated', app.includes('broadProviderConfigured') && app.includes('setLanguageSafely')],
  ['Microsoft or Google can unlock broad languages', app.includes('microsoftConfigured || state.providerStatus?.googleConfigured')],
  ['Chrome/Web service preserved', app.includes("id:'chrome'") && app.includes('Chrome / Web')],
  ['Signal service preserved', app.includes("id:'signal'") && app.includes('Signal')],
  ['Drag ordering preserved', app.includes('dragstart') && app.includes('drop')],
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
