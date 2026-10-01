const fs = require('fs');
const app = fs.readFileSync('src/app.js','utf8');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const cfg = JSON.parse(fs.readFileSync('electron-builder.no-nsis.json','utf8'));
const checks = [
  ['Version is 1.0.18', pkg.version === '1.0.18'],
  ['Gemini provider status is displayed', app.includes('Gemini API') && app.includes('geminiConfigured')],
  ['Broad language selection is provider-gated', app.includes('broadProviderConfigured') && app.includes('setLanguageSafely')],
  ['Gemini/Microsoft/Google can unlock broad languages', app.includes('geminiConfigured || state.providerStatus?.microsoftConfigured || state.providerStatus?.googleConfigured')],
  ['No-refresh persistent views preserved', app.includes('persistentViews') && app.includes('syncPersistentWebviews')],
  ['Chrome/Web service preserved', app.includes("id:'chrome'") && app.includes('Chrome / Web')],
  ['Signal service preserved', app.includes("id:'signal'") && app.includes('Signal')],
  ['Drag ordering preserved', app.includes('dragstart') && app.includes('drop')],
  ['Candidate app ID isolated', cfg.appId === 'com.lingua.bridge.gemini.fallback.candidate'],
  ['Candidate product isolated', cfg.productName === 'Lingua Bridge Gemini Fallback Candidate'],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}`); if (!ok) failed++; }
if (failed) process.exit(1);
