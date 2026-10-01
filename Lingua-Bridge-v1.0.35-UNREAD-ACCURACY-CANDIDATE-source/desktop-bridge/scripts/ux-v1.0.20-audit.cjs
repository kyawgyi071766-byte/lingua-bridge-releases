const fs = require('fs');
const app = fs.readFileSync('src/app.js','utf8');
const preload = fs.readFileSync('electron/service-preload.cjs','utf8');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const checks = [
  ['v1.0.20 stability logic carried into v1.0.27', pkg.version === '1.0.27'],
  ['settings signature prevents repeat scans', app.includes('linguaSettingsSignature') && app.includes('if (view.dataset.linguaSettingsSignature === signature) return')],
  ['incoming queue deduplicates text', app.includes('incomingQueuedKeys') && app.includes('incomingQueueKey')],
  ['incoming concurrency capped at one', app.includes('state.incomingActive >= 1') && app.includes('state.incomingActive = 1')],
  ['broad translations are adaptively paced', app.includes('broadRealtimeGapMs') && app.includes('broadPenaltyUntil')],
  ['transient incoming failures retry later', app.includes('retryDelay') && app.includes('item.attempts < 2')],
  ['automatic scan stays bounded and prioritizes recent messages', !preload.includes('found.slice(-40)') && preload.includes('const realtimeCount = force ? 6 : 4')],
  ['settings updates do not force full rescan', preload.includes('scanMessages(false)') && !preload.includes("scanTimer = setTimeout(() => scanMessages(true), 120)")],
  ['translation setting changes reset fingerprints only when needed', preload.includes('translationChanged') && preload.includes('clearMessageFingerprints()')],
  ['persistent no-refresh views retained', app.includes('persistentViews') && app.includes('visibility = active')],
  ['robust pointer reorder retained', app.includes('setPointerCapture') && app.includes('syncInstanceListDomOrder')],
  ['Burmese broad language retained', app.includes('["my", "Myanmar / Burmese')],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; }
if (failed) process.exit(1);
