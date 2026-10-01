const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const preload = fs.readFileSync(path.join(root, 'electron', 'service-preload.cjs'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const checks = [
  ['v1.0.27 package', pkg.version === '1.0.27'],
  ['incoming per-message auto detect', preload.includes("sourceLang: 'auto'") && preload.includes('every message is independently auto-detected')],
  ['fast scan debounce', preload.includes('setTimeout(scanMessages, 110)')],
  ['newest messages first', preload.includes("requestIncomingTranslation(node, 'realtime')") && preload.includes('.reverse()')],
  ['history is lower priority', app.includes("payload.priority === 'history'") && app.includes('state.incomingQueue.unshift(item)')],
  ['adaptive broad-provider pacing', app.includes('broadRealtimeGapMs') && app.includes('broadPenaltyUntil')],
  ['persistent no-flash geometry', app.includes('Keep the last valid geometry') && app.includes("transition: 'none'")],
  ['persistent no-refresh switching retained', app.includes('persistentViews') && app.includes('syncPersistentWebviews')],
  ['v1.0.27 marker', app.includes("lingua.desktopVersion', '1.0.27")],
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
